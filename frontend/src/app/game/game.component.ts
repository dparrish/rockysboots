import {AfterViewInit, Component} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

import {environment} from '../../environments/environment';
import {constants} from '../constants/constants.module';
import {afterMs, atTick, Event, EventLoop} from '../event-loop';
import {GameMap, loadMap} from '../game-map';
import {BoundingBox, Point} from '../position';
import {newSprite, Player, Sprite, Sprites} from '../sprites';

@Component({selector: 'app-game', templateUrl: './game.component.html', styleUrls: ['./game.component.css']})
export class GameComponent implements AfterViewInit {
  canvas: HTMLCanvasElement;
  canvasWidth = constants.sizeX * constants.blockSize;
  canvasHeight = constants.sizeY * constants.blockSize;
  map: GameMap = new GameMap();
  maps: {[name: string]: GameMap} = {};
  tickCount = 0;
  player: Player = null;
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
    return loadMap(name)
        .then((map) => {
          console.log(`Loaded map ${name}`);
          this.map = map;
          this.map.sprites = _.map(map.sprites, newSprite);
          this.maps[name] = map;
          if (!this.player) {
            this.player = newSprite({
              x: this.map.playerStart.x,
              y: this.map.playerStart.y,
              type: Sprites.Player,
            });
          }
          return map;
        })
        .then(map => {
          for (const s of map.sprites) {
            // Set up the initial power states.
            if (!s.powerable) continue;
            if (s.type === Sprites.NotGate) s.powered = true;
          }
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
      s.draw(ctx);
    }

    // Draw player.
    this.player.draw(ctx);
  }

  checkPlayerPower() {
    for (const s of this.map.sprites) {
      if (s.powerable && this.player.boundingbox.intersects(s.boundingbox)) {
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

    for (const s of _.filter(this.map.sprites, s => s.powerable)) {
      if (!s.lastPower) {
        // Set the initial power state for each sprite.
        s.lastPower = this.tickCount;
        s.powerSpread = this.tickCount;
      }
    }

    for (const s of this.map.sprites) {
      if (s.powerable) {
        this.spreadPower(s);
      }
    }

    for (const s of this.map.sprites) {
      if (!s.powerable) {
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

    let pos: Point;
    switch (s.type) {
      case Sprites.ConnectorUp:
        if (s.powered) pos = s.pos.add(0, -constants.blockSize);
        break;

      case Sprites.ConnectorDown:
        if (s.powered) pos = s.pos.add(0, constants.blockSize);
        break;

      case Sprites.ConnectorLeft:
        if (s.powered) pos = s.pos.add(-constants.blockSize, 0);
        break;

      case Sprites.ConnectorRight:
        if (s.powered) pos = s.pos.add(constants.blockSize, 0);
        break;

      case Sprites.NotGate:
        if (!s.powered) pos = s.pos.add((-2 * constants.blockSize), 0);
        break;

      default:
        return;
    }
    if (!pos) return;

    // Spread power to any powerable sprites at the destination position.
    for (const dest of _.filter(this.spritesAt(pos), s => s.powerable)) {
      // console.log(`Sprite ${this.spriteName(s)} powering ${this.spriteName(dest)}`);
      dest.powered = true;

      // Don't let this sprite immediately spread power.
      if (dest.powerSpread < this.tickCount - 1) dest.powerSpread = this.tickCount;

      // Don't let this sprite spread power again this tick.
      s.powerSpread = this.tickCount;
      dest.lastPower = this.tickCount;
    }
  }

  spritesAt(pos: Point): any[] {
    return _.filter(_.filter(this.map.sprites, (s) => s.y === pos.y && s.x === pos.x), s => s.powerable);
  }

  canMoveTo(pos: Point): boolean {
    return !_.find(this.map.sprites, (s) => {
      if (s.type !== Sprites.Wall && s.type !== Sprites.OptionWall) return false;
      return s.boundingbox.intersects(blockBoundingBox(pos.x, pos.y));
    });
  }

  async keyDown(event) {
    const distance = this.modifiers.shift ? 10 : constants.blockSize;
    const pos = this.player.pos;
    switch (event.code) {
      case 'ArrowUp':
        pos.y -= distance;
        if (!this.canMoveTo(pos)) return;
        break;
      case 'ArrowDown':
        pos.y += distance;
        if (!this.canMoveTo(pos)) return;
        break;
      case 'ArrowLeft':
        pos.x -= distance;
        if (!this.canMoveTo(pos)) return;
        break;
      case 'ArrowRight':
        pos.x += distance;
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
    this.player.x = pos.x;
    this.player.y = pos.y;

    if (this.map.exits.right && this.player.x + constants.blockSize - 1 >= constants.sizeX * constants.blockSize) {
      // Moved to the right.
      return this.loadMap(this.map.exits.right).then((map) => {
        this.player.x = 0;
        this.player.y = pos.y;
      });
    }
    if (this.map.exits.left && this.player.x < 0) {
      // Moved to the left.
      return this.loadMap(this.map.exits.left).then((map) => {
        this.player.x = (constants.sizeX - 1) * constants.blockSize;
        this.player.y = pos.y;
      });
    }
    if (this.map.exits.up && this.player.y < 0) {
      // Moved to the top.
      return this.loadMap(this.map.exits.up).then((map) => {
        this.player.x = pos.x;
        this.player.y = (constants.sizeY - 1) * constants.blockSize;
      });
    }
    if (this.map.exits.down && this.player.y + constants.blockSize - 1 >= constants.sizeY * constants.blockSize) {
      // Moved to the bottom.
      return this.loadMap(this.map.exits.down).then((map) => {
        this.player.x = pos.x;
        this.player.y = 0;
      });
    }

    this.checkPlayerPower();
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

function blockBoundingBox(x: number, y: number): BoundingBox {
  return new BoundingBox(new Point(x, y), constants.blockSize - 1, constants.blockSize - 1);
}
