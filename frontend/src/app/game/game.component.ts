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
  carrying: Sprite = null;
  carryDiff: Point = null;

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
      setInterval(async () => {
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
        .then((map: GameMap) => {
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
        .then((map: GameMap) => {
          for (const s of _.filter(map.sprites, (s: Sprite) => s.powerable)) {
            // Set up the initial power states.
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
    for (const s of _.filter(
             this.map.sprites, (s: Sprite) => s.powerable && this.player.boundingbox.intersects(s.boundingbox))) {
      this.eventLoop.queue(new Event(afterMs(0), (event): Promise<any> => {
        console.log(`Player powering`, s);
        s.powered = true;
        s.lastPower = this.tickCount;
        return Promise.resolve();
      }));
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
    this.checkPlayerPower();

    for (const s of _.filter(this.map.sprites, (s: Sprite) => s.powerable && !s.lastPower)) {
      // Set the initial power state for each sprite.
      s.lastPower = this.tickCount;
      s.powerSpread = this.tickCount;
    }

    for (const s of _.filter(this.map.sprites, (s: Sprite) => s.powerable)) {
      this.spreadPower(s);
    }

    for (const s of _.filter(this.map.sprites, (s: Sprite) => s.powerable)) {
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
    for (const dest of _.filter(this.powerableAt(pos), (s: Sprite) => s.powerable)) {
      // console.log(`Sprite ${this.spriteName(s)} powering ${this.spriteName(dest)}`);
      dest.powered = true;

      // Don't let this sprite immediately spread power.
      if (dest.powerSpread < this.tickCount - 1) dest.powerSpread = this.tickCount;

      // Don't let this sprite spread power again this tick.
      s.powerSpread = this.tickCount;
      dest.lastPower = this.tickCount;
    }
  }

  powerableAt(pos: Point): any[] {
    return _.filter(this.map.sprites, (s: Sprite) => s.powerable && (s.pos.y === pos.y && s.pos.x === pos.x));
  }

  canMoveTo(player: Player): boolean {
    return !_.find(this.map.sprites, (s: Sprite) => {
      // Find all impassable sprites that intersect with the player's new position.
      if (s.passable) return false;
      if (s.boundingbox.intersects(player.boundingbox)) {
        console.log(`player intersects with ${s} bounding box at ${s.boundingbox}`);
      }
      return s.boundingbox.intersects(player.boundingbox);
    });
  }

  async keyDown(event) {
    const distance = this.modifiers.shift ? 10 : constants.blockSize;
    const newPlayer = new Player().fromJson(this.player.toJson());
    let move: Point = null;
    switch (event.code) {
      case 'ArrowUp':
        move = new Point(0, -distance);
        newPlayer.pos = newPlayer.pos.add(move);
        if (!this.canMoveTo(newPlayer)) return;
        break;
      case 'ArrowDown':
        move = new Point(0, distance);
        newPlayer.pos = newPlayer.pos.add(move);
        if (!this.canMoveTo(newPlayer)) return;
        break;
      case 'ArrowLeft':
        move = new Point(-distance, 0);
        newPlayer.pos = newPlayer.pos.add(move);
        if (!this.canMoveTo(newPlayer)) return;
        break;
      case 'ArrowRight':
        move = new Point(distance, 0);
        newPlayer.pos = newPlayer.pos.add(move);
        if (!this.canMoveTo(newPlayer)) return;
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
    if (move) {
      this.player.pos = this.player.pos.add(move);
      if (this.carrying) this.carrying.pos = this.carrying.pos.add(move);
    }

    const moveSpriteToMap = (sprite: Sprite, from: GameMap, to: GameMap, pos: Point) => {
      _.remove(from.sprites, (s: Sprite) => s === sprite);
      to.sprites.push(sprite);
      sprite.pos = pos;
    };

    if (this.map.exits.right && this.player.pos.x + constants.blockSize - 1 >= constants.sizeX * constants.blockSize) {
      // Moved to the right.
      const oldMap = this.map;
      return this.loadMap(this.map.exits.right).then((map: GameMap) => {
        this.player.pos.x = 0;
        this.player.pos.y = newPlayer.pos.y;
        if (this.carrying) moveSpriteToMap(this.carrying, oldMap, this.map, this.player.pos.sub(this.carryDiff));
      });
    }
    if (this.map.exits.left && this.player.pos.x < 0) {
      // Moved to the left.
      const oldMap = this.map;
      return this.loadMap(this.map.exits.left).then((map: GameMap) => {
        this.player.pos.x = (constants.sizeX - 1) * constants.blockSize;
        this.player.pos.y = newPlayer.pos.y;
        if (this.carrying) moveSpriteToMap(this.carrying, oldMap, this.map, this.player.pos.sub(this.carryDiff));
      });
    }
    if (this.map.exits.up && this.player.pos.y < 0) {
      // Moved to the top.
      const oldMap = this.map;
      return this.loadMap(this.map.exits.up).then((map: GameMap) => {
        this.player.pos.x = newPlayer.pos.x;
        this.player.pos.y = (constants.sizeY - 1) * constants.blockSize;
        if (this.carrying) moveSpriteToMap(this.carrying, oldMap, this.map, this.player.pos.sub(this.carryDiff));
      });
    }
    if (this.map.exits.down && this.player.pos.y + constants.blockSize - 1 >= constants.sizeY * constants.blockSize) {
      // Moved to the bottom.
      const oldMap = this.map;
      return this.loadMap(this.map.exits.down).then((map: GameMap) => {
        this.player.pos.x = newPlayer.pos.x;
        this.player.pos.y = 0;
        if (this.carrying) moveSpriteToMap(this.carrying, oldMap, this.map, this.player.pos.sub(this.carryDiff));
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

  handlePickup() {
    if (this.carrying) {
      // Drop sprite.
      this.carrying = null;
    } else {
      // Pick up sprite.
      for (const s of _.filter(
               this.map.sprites, (s: Sprite) => !s.fixed && s.boundingbox.intersects(this.player.boundingbox))) {
        this.carrying = s;
        this.carryDiff = this.player.pos.sub(s.pos);
      }
    }
  }

  mouseLeave(event) {}

  mouseEnter(event) {}

  pointerUp(event) {}

  pointerDown(event) {}

  mouseMove(event) {}
}
