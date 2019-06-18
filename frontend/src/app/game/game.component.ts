import {AfterViewInit, Component} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

import {environment} from '../../environments/environment';
import {constants} from '../constants/constants.module';
import {afterMs, atTick, Event, EventLoop} from '../event-loop';
import {GameMap, loadMap} from '../game-map';
import {DrawSprite, Sprite, Sprites} from '../sprites';

// X, Y
type Position = [number, number];
// Top-left, bottom-right
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({selector: 'app-game', templateUrl: './game.component.html', styleUrls: ['./game.component.css']})
export class GameComponent implements AfterViewInit {
  canvas: HTMLCanvasElement;
  canvasWidth = constants.sizeX * constants.blockSize;
  canvasHeight = constants.sizeY * constants.blockSize;
  map: GameMap = new GameMap();
  maps: {[name: string]: GameMap} = {};
  tickCount = 0;
  modifiers: {[name: string]: boolean} = {
    shift: false,
    control: false,
    alt: false,
  };

  constructor(private eventLoop: EventLoop) {}

  ngAfterViewInit() {
    setTimeout(async () => {
      window.addEventListener('selectstart', event => {
        event.preventDefault();
      });

      window.addEventListener('keydown', async event => {
        await this.keyDown(event);
      });
      window.addEventListener('keyup', event => {
        this.keyUp(event);
      });

      await this.loadMap(environment.initialMap);
      setInterval(async () => {
        await this.drawMap();
      }, 1000 / 30);
      await this.gameTick();
      window.setInterval(async () => {
        await this.gameTick();
      }, environment.msPerTick);
    }, 1);
  }

  loadMap(name: string): Promise<any> {
    if (this.maps[name]) {
      this.map = this.maps[name];
      return Promise.resolve(this.map);
    }
    return loadMap(name).then((map) => {
      console.log(`Loaded map ${name}`);
      this.map = map;
      this.maps[name] = map;
      return map;
    });
  }

  async drawMap() {
    // Wait for all events to fire before drawing the map.
    await this.eventLoop.run();

    const canvas = document.getElementById('board') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.fillRect(0, 0, constants.sizeX * constants.blockSize, constants.sizeY * constants.blockSize);

    // Draw existing sprites.
    for (const s of this.map.sprites) {
      DrawSprite(ctx, s);
    }

    // Draw player.
    DrawSprite(ctx, {
      x: this.map.playerStart.x,
      y: this.map.playerStart.y,
      type: Sprites.Player,
    } as Sprite);
  }

  checkPlayerPower() {
    for (const s of this.map.sprites) {
      if (powerable(s) &&
          boxesCollide(blockBoundingBox(this.map.playerStart.x, this.map.playerStart.y), blockBoundingBox(s.x, s.y))) {
        this.eventLoop.queue(new Event(afterMs(0), (event): Promise<any> => {
          console.log(`Player powering`, s);
          s.powered = true;
          s.lastPower = this.tickCount;
          return Promise.resolve();
        }));
      }
    }
  }

  spriteName(s: Sprite): string {
    return `${s.colour} ${Sprites[s.type]}`;
  }

  async gameTick() {
    this.tickCount++;
    // console.log(`Game tick ${this.tickCount}`);
    // Wait for all events to fire continuing.
    await this.eventLoop.runTick(this.tickCount);

    for (const s of _.filter(this.map.sprites, powerable)) {
      if (!s.lastPower) {
        // Set the initial power state for each sprite.
        s.lastPower = this.tickCount;
        s.powerSpread = this.tickCount;
      }
    }

    for (const s of this.map.sprites) {
      if (powerable(s)) {
        this.spreadPower(s);
      }
    }

    for (const s of this.map.sprites) {
      if (!powerable(s)) {
        continue;
      }
      if (s.powered && s.lastPower < this.tickCount) {
        s.powered = false;
        s.lastPower = this.tickCount;
      }
    }
  }

  spreadPower(s: Sprite) {
    // Each sprite can only spread power once per tick.
    if (s.powerSpread === this.tickCount) return;

    let pos: Position;
    switch (s.type) {
      case Sprites.ConnectorUp:
        if (s.powered) pos = [s.x, s.y - constants.blockSize];
        break;

      case Sprites.ConnectorDown:
        if (s.powered) pos = [s.x, s.y + constants.blockSize];
        break;

      case Sprites.ConnectorLeft:
        if (s.powered) pos = [s.x - constants.blockSize, s.y];
        break;

      case Sprites.ConnectorRight:
        if (s.powered) pos = [s.x + constants.blockSize, s.y];
        break;

      case Sprites.NotGate:
        if (!s.powered) pos = [s.x - (2 * constants.blockSize), s.y];
        break;

      default:
        return;
    }

    // Spread power to any powerable sprites at the destination position.
    for (const dest of _.filter(this.spritesAt(pos), powerable)) {
      // console.log(`Sprite ${this.spriteName(s)} powering ${this.spriteName(dest)}`);
      dest.powered = true;

      // Don't let this sprite immediately spread power.
      if (dest.powerSpread < this.tickCount - 1) dest.powerSpread = this.tickCount;

      // Don't let this sprite spread power again this tick.
      s.powerSpread = this.tickCount;
      dest.lastPower = this.tickCount;
    }
  }

  spritesAt(pos: Position): any[] {
    return _.filter(_.filter(this.map.sprites, (s) => s.y === pos[1] && s.x === pos[0]), powerable);
  }

  canMoveTo(pos: Position): boolean {
    return !_.find(this.map.sprites, (s) => {
      if (s.type !== Sprites.Wall && s.type !== Sprites.OptionWall) return false;
      return boxesCollide(blockBoundingBox(pos[0], pos[1]), blockBoundingBox(s.x, s.y));
    });
  }

  async keyDown(event) {
    const distance = this.modifiers.shift ? 10 : constants.blockSize;
    const pos = [this.map.playerStart.x, this.map.playerStart.y] as Position;
    switch (event.code) {
      case 'ArrowUp':
        pos[1] -= distance;
        if (!this.canMoveTo(pos)) return;
        break;
      case 'ArrowDown':
        pos[1] += distance;
        if (!this.canMoveTo(pos)) return;
        break;
      case 'ArrowLeft':
        pos[0] -= distance;
        if (!this.canMoveTo(pos)) return;
        break;
      case 'ArrowRight':
        pos[0] += distance;
        if (!this.canMoveTo(pos)) return;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.modifiers.shift = true;
        return;
      case 'Space':
        this.handlePickup();
        return;
      default:
        // console.log('keyDown', event);
        return;
    }

    // Valid movement.
    this.map.playerStart.x = pos[0];
    this.map.playerStart.y = pos[1];
    this.checkPlayerPower();

    if (this.map.playerStart.x + constants.blockSize - 1 >= constants.sizeX * constants.blockSize) {
      // Moved to the right.
      return this.loadMap(this.map.exits.right).then((map) => {
        this.map.playerStart.x = 0;
        this.map.playerStart.y = pos[1];
      });
    }
    if (this.map.playerStart.x < 0) {
      // Moved to the left.
      return this.loadMap(this.map.exits.left).then((map) => {
        this.map.playerStart.x = (constants.sizeX - 1) * constants.blockSize;
        this.map.playerStart.y = pos[1];
      });
    }
    if (this.map.playerStart.y < 0) {
      // Moved to the top.
      return this.loadMap(this.map.exits.up).then((map) => {
        this.map.playerStart.x = pos[0];
        this.map.playerStart.y = (constants.sizeY - 1) * constants.blockSize;
      });
    }
    if (this.map.playerStart.y + constants.blockSize - 1 >= constants.sizeY * constants.blockSize) {
      // Moved to the bottom.
      return this.loadMap(this.map.exits.down).then((map) => {
        this.map.playerStart.x = pos[0];
        this.map.playerStart.y = 0;
      });
    }
  }

  keyUp(event) {
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        this.modifiers.shift = false;
        break;
      default:
        // console.log('keyUp', event);
        break;
    }
  }

  handlePickup() {}

  mouseLeave(event) {}

  mouseEnter(event) {}

  pointerUp(event) {}

  pointerDown(event) {}

  mouseMove(event) {}
}

function boxesCollide(a: BoundingBox, b: BoundingBox) {
  return ((Math.abs(a.x - b.x) * 2 < a.width + b.width) && (Math.abs(a.y - b.y) * 2 < a.height + b.height));
}

function blockBoundingBox(x: number, y: number): BoundingBox {
  return {
    x,
    y,
    width: constants.blockSize - 1,
    height: constants.blockSize - 1,
  };
}

function powerable(s: Sprite): boolean {
  if (s.type === Sprites.Wall || s.type === Sprites.Text || s.type === Sprites.Empty) {
    return false;
  }
  return true;
}

function isAt(s: Sprite, pos: Position): boolean {
  return s.x === pos[0] && s.y === pos[1];
}
