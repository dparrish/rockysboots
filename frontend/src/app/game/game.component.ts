import {AfterViewInit, Component} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

import {environment} from '../../environments/environment';
import {constants} from '../constants/constants.module';
import {afterMs, atTick, Event, EventLoop} from '../event';
import {GameMap, loadMap} from '../game-map';
import {BoundingBox, Point} from '../position';
import {newSprite, Player, Sprite, Sprites, spritesWithInputAt} from '../sprites';

@Component({selector: 'app-game', templateUrl: './game.component.html', styleUrls: ['./game.component.css']})
export class GameComponent implements AfterViewInit {
  canvas: HTMLCanvasElement;
  canvasWidth = constants.sizeX * constants.blockSize;
  canvasHeight = constants.sizeY * constants.blockSize;
  map: GameMap = new GameMap();
  maps: {[name: string]: GameMap} = {};
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
      await this.gameTick();
      setInterval(async () => {
        await this.eventLoop.run();
      }, 1000 / 30);
      setInterval(async () => {
        await this.gameTick();
      }, environment.msPerTick);
    }, 1);
  }

  loadMap(name: string): Promise<any> {
    if (this.maps[name]) {
      this.map = this.maps[name];
      this.drawMap();
      return Promise.resolve(this.map);
    }
    return loadMap(name).then((map: GameMap) => {
      console.log(`Loaded map ${name}`);
      this.map = map;
      this.map.sprites = _.map(map.sprites, s => {
        s = newSprite(this.map, s);
        if (s.powerable) s.powered = false;
        return s;
      });
      this.maps[name] = map;
      if (!this.player) {
        this.player = newSprite(this.map, {
          x: this.map.playerStart.x,
          y: this.map.playerStart.y,
          type: Sprites.Player,
        });
      }
      this.eventLoop.sprites = this.eventLoop.sprites.concat(_.filter(this.map.sprites, (s: Sprite) => s.powerable));
      this.drawMap();
      return map;
    });
  }

  drawMap() {
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

  spriteName(s: Sprite): string {
    return `${s.colour} ${Sprites[s.type]}`;
  }

  async gameTick() {
    // console.log(`Game tick ${this.eventLoop.currentTick}`);
    // Wait for all events to fire continuing.
    await this.eventLoop.tick();

    // Check for sprites that the player is powering.
    for (const s of spritesWithInputAt(this.player.boundingbox, this.map.sprites)) {
      console.log(`Player powering`, s);
      s.power(this.eventLoop);
    }

    this.drawMap();
  }

  canMoveTo(player: Player): boolean {
    return !_.find(this.map.sprites, (s: Sprite) => {
      // Find all impassable sprites that intersect with the player's new position.
      if (s.passable) return false;
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

    this.drawMap();
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

function moveSpriteToMap(sprite: Sprite, from: GameMap, to: GameMap, pos: Point) {
  _.remove(from.sprites, (s: Sprite) => s === sprite);
  to.sprites.push(sprite);
  sprite.pos = pos;
  sprite.map = to;
}

