import {AfterViewInit, Component} from '@angular/core';
import * as _ from 'lodash';

import {environment} from '../../environments/environment';
import {blockSize, constants, formatText, sizeX, sizeY} from '../constants/constants.module';
import {afterMs, atTick, Event, EventLoop} from '../event';
import {GameMap, loadMap} from '../game-map';
import {Point} from '../position';
import {newSprite, Player, Sprite, Sprites} from '../sprites';

const snapSize = 10;
const directions = ['up', 'down', 'left', 'right'];

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements AfterViewInit {
  canvas: HTMLCanvasElement;
  canvasWidth = sizeX * blockSize;
  canvasHeight = sizeY * blockSize;
  map: GameMap = new GameMap();
  pointer = {
    x: 0,
    y: 0,
    down: false,
  };
  currentSprite: Sprites = Sprites.Empty;
  currentColour = 'white';
  currentText = 'Text here';
  currentFixed = false;
  currentPowered = false;
  currentJson = '';
  moveSnap = true;
  mapList: string[] = [];
  Sprites: any;
  spriteNames: string[] = [];
  drawGrid: boolean = false;
  playerSprite: Player = null;
  tempSprite: Sprite = null;

  constructor(private eventLoop: EventLoop) {
    constants.inEditor = true;
    this.Sprites = Sprites;
    const sn = Object.keys(Sprites);
    this.spriteNames = sn.slice(0, sn.length / 2);
  }

  ngAfterViewInit() {
    setTimeout(async () => {
      window.addEventListener('selectstart', (event) => {
        if ((event.target as HTMLInputElement).type === 'text') return;
        event.preventDefault();
      });

      window.addEventListener('keydown', (event) => {
        if (event.code === 'ShiftLeft') {
          this.moveSnap = false;
          event.cancelBubble = true;
        }
      });

      window.addEventListener('keyup', (event) => {
        if (event.code === 'ShiftLeft') {
          this.moveSnap = true;
          event.cancelBubble = true;
        }
      });

      this.map.name = 'test-map';
      this.selectColour('white');

      await this.loadMapList();
      await this.loadMap('sprite-test');
      await this.gameTick();
      setInterval(async () => {
        await this.eventLoop.run();
      }, 1000 / 30);
      window.setInterval(async () => {
        await this.gameTick();
      }, 1000 / 4);
    }, 1);
  }

  drawMap(): void {
    const canvas = document.getElementById('board') as HTMLCanvasElement;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.fillRect(0, 0, sizeX * blockSize, sizeY * blockSize);

    // Draw grid overlay.
    if (constants.inEditor && this.drawGrid) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'grey';
      for (let x = 0; x < sizeX; x++) {
        for (let y = 0; y < sizeY; y++) {
          ctx.strokeRect(x * blockSize, y * blockSize, (x + 1) * blockSize, (y + 1) * blockSize);
        }
      }
    }

    // Draw existing sprites.
    for (const s of this.map.sprites) {
      s.draw(ctx);
    }

    // Draw new sprite if mouse is down.
    if (this.pointer.down && this.tempSprite) this.tempSprite.draw(ctx);

    // Draw player
    if (!this.pointer.down || (this.pointer.down && this.currentSprite !== Sprites.Player)) this.playerSprite.draw(ctx);
  }

  snapPointer() {
    const ss = this.moveSnap ? blockSize : snapSize;
    if (this.pointer.x % blockSize !== 0) this.pointer.x = Math.floor(this.pointer.x / ss) * ss;
    if (this.pointer.y % blockSize !== 0) this.pointer.y = Math.floor(this.pointer.y / ss) * ss;
  }

  selectColour(colour: string) {
    this.currentColour = colour;
    document.querySelectorAll('div.colour').forEach((h: HTMLElement) => {
      if (h.style.backgroundColor === colour) {
        h.style.border = '2px solid black';
      } else {
        h.style.border = '2px solid white';
      }
    });
  }

  dropSprite() {
    if (this.currentSprite === Sprites.Empty) {
      console.log(`Removing all sprites at at ${this.pointer.x} / ${this.pointer.y}`);
      _.remove(this.map.sprites, (el: Sprite) => el.pos.x === this.pointer.x && el.pos.y === this.pointer.y);
      return;
    }
    if (this.currentSprite === Sprites.Player) {
      this.map.playerStart.x = this.pointer.x;
      this.map.playerStart.y = this.pointer.y;
      this.playerSprite.pos.x = this.pointer.x;
      this.playerSprite.pos.y = this.pointer.y;
      return;
    }
    _.remove(this.map.sprites, (el: Sprite) => el.pos.x === this.pointer.x && el.pos.y === this.pointer.y);
    this.map.sprites.push(this.tempSprite);
    this.map.sortSprites();
    this.tempSprite = null;
  }

  pointerDown(event: any) {
    this.pointer.down = true;
    this.pointer.x = event.offsetX;
    this.pointer.y = event.offsetY;
    this.snapPointer();
    this.tempSprite = newSprite(this.map, {
      x: this.pointer.x,
      y: this.pointer.y,
      type: this.currentSprite,
      colour: this.currentColour,
      powered: this.currentPowered,
      text: formatText(this.currentText),
    });
    event.cancelBubble = true;
    this.drawMap();
  }

  pointerUp(event: any) {
    this.pointer.down = false;
    this.dropSprite();
    this.tempSprite = null;
    this.drawMap();
  }

  mouseMove(event: any) {
    this.pointer.x = event.offsetX;
    this.pointer.y = event.offsetY;
    this.snapPointer();
    if (this.tempSprite) {
      this.tempSprite.pos.x = this.pointer.x;
      this.tempSprite.pos.y = this.pointer.y;
    }
    this.drawMap();
  }

  mouseEnter(event: any) {
    this.pointer.down = event.buttons === 1;
    this.drawMap();
  }

  mouseLeave(event: any) {
    this.pointer.down = false;
  }

  loadMapList(): Promise<any> {
    return fetch(`${environment.mapserverUrl}/maps`, {
             cache: 'no-cache',
             headers: {'Content-Type': 'application/json'},
             redirect: 'follow',
           })
        .then((response: Response) => {
          return response.json();
        })
        .then((json) => {
          // console.log('Got maps list', json);
          this.mapList = json.maps;
          this.mapList.sort();
          this.updateMapList();
          return null;
        });
  }

  updateMapList() {
    const select = document.querySelector('select[name=maplist]');
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
    for (const i of this.mapList) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.text = i;
      opt.addEventListener('dblclick', () => this.loadMap(i));
      select.appendChild(opt);
    }
  }

  loadMap(name: string): Promise<any> {
    return loadMap(name).then((map: GameMap) => {
      this.map = map;
      this.map.sprites = _.map(map.sprites, s => newSprite(this.map, s));
      this.playerSprite = new Player({
        x: this.map.playerStart.x,
        y: this.map.playerStart.y,
      });
      return map;
    });
  }

  async gameTick() {
    await this.eventLoop.tick();
    this.drawMap();
  }

  getWall(direction: string): Sprite[] {
    const isWall = (s: Sprite) => s.type === Sprites.Wall || s.type === Sprites.OptionWall;
    switch (direction) {
      case 'up':
        return _.filter(this.map.sprites, (s: Sprite) => s.pos.y === 0 && isWall(s));
      case 'down':
        return _.filter(this.map.sprites, (s: Sprite) => s.pos.y === (sizeY - 1) * blockSize && isWall(s));
      case 'left':
        return _.filter(this.map.sprites, (s: Sprite) => s.pos.x === 0 && isWall(s));
      case 'right':
        return _.filter(this.map.sprites, (s: Sprite) => s.pos.x === (sizeX - 1) * blockSize && isWall(s));
    }
  }

  buildWall(direction: string): Sprite[] {
    const sprites: Sprite[] = [];
    switch (direction) {
      case 'up':
        for (let i = 0; i < sizeX; i++) {
          sprites.push(newSprite(this.map, {
            colour: 'blue',
            type: Sprites.Wall,
            x: i * blockSize,
            y: 0,
          }));
        }
        break;
      case 'down':
        for (let i = 0; i < sizeX; i++) {
          sprites.push(newSprite(this.map, {
            colour: 'blue',
            type: Sprites.Wall,
            x: i * blockSize,
            y: (sizeY - 1) * blockSize,
          }));
        }
        break;
      case 'left':
        for (let i = 0; i < sizeY; i++) {
          sprites.push(newSprite(this.map, {
            colour: 'blue',
            type: Sprites.Wall,
            x: 0,
            y: i * blockSize,
          }));
        }
        break;
      case 'right':
        for (let i = 0; i < sizeY; i++) {
          sprites.push(newSprite(this.map, {
            colour: 'blue',
            type: Sprites.Wall,
            x: (sizeX - 1) * blockSize,
            y: i * blockSize,
          }));
        }
        break;
    }
    return sprites;
  }

  async validExits() {
    if (this.map.name === 'sprite-test') return;
    if (this.getWall('up').length !== sizeX && !this.map.exits.up) throw new Error('exit-up invalid');
    if (this.getWall('down').length !== sizeX && !this.map.exits.down) throw new Error('exit-down invalid');
    if (this.getWall('left').length !== sizeY && !this.map.exits.left) throw new Error('exit-left invalid');
    if (this.getWall('right').length !== sizeY && !this.map.exits.right) throw new Error('exit-right invalid');
    return;
  }

  buildJson(map: GameMap): any {
    const json = {
      name: map.name,
      playerStart: map.playerStart,
      exits: map.exits,
      sprites: [],
    };
    for (const sprite of map.sprites) {
      json.sprites.push(sprite.toJson());
    }
    return json;
  }

  async saveMap(map: GameMap, forceInvalidExits = false) {
    try {
      if (map.name === '') throw new Error('Invalid map name');
      this.currentJson = JSON.stringify(this.buildJson(map), null, 2);
      if (!forceInvalidExits) await this.validExits();
    } catch (e) {
      alert(e);
      return;
    }

    console.log(`Saving map ${map.name}`);
    return fetch(`${environment.mapserverUrl}/map/${map.name}`, {
             method: 'PUT',
             cache: 'no-cache',
             headers: {'Content-Type': 'application/json'},
             redirect: 'follow',
             body: JSON.stringify(this.buildJson(map)),
           })
        .then((response: Response) => {
          return response.json();
        })
        .then(async (json) => {
          this.mapList.push(map.name);
          this.mapList = _.uniqBy(this.mapList);
          this.mapList = this.mapList.sort();
          this.updateMapList();
          return this.buildOppositeExits(map);
        });
  }

  async buildOppositeExits(map: GameMap) {
    const promises: Promise<any>[] = [];
    // Create adjoining maps if they don't yet exist.
    if (map.exits.up && this.mapList.indexOf(map.exits.up) < 0) {
      const wall = this.getWall('up');
      const newMap = new GameMap({
        name: map.exits.up,
        exits: {down: map.name},
        sprites: this.buildWall('up').concat(this.buildWall('left')).concat(this.buildWall('right')),
        playerStart: {x: 2 * blockSize, y: 2 * blockSize},
      });
      for (const s of wall) {
        newMap.sprites.push({
          type: Sprites.Wall,
          pos: new Point(s.pos.x, (sizeY - 1) * blockSize),
        });
      }
      promises.push(this.saveMap(newMap, true));
    }
    if (map.exits.down && this.mapList.indexOf(map.exits.down) < 0) {
      const wall = this.getWall('down');
      const newMap = new GameMap({
        name: map.exits.down,
        exits: {up: map.name},
        sprites: this.buildWall('down').concat(this.buildWall('left')).concat(this.buildWall('right')),
        playerStart: {x: 2 * blockSize, y: 2 * blockSize},
      });
      for (const s of wall) {
        newMap.sprites.push({
          type: Sprites.Wall,
          pos: new Point(s.pos.x, 0),
        });
      }
      promises.push(this.saveMap(newMap, true));
    }
    if (map.exits.left && this.mapList.indexOf(map.exits.left) < 0) {
      const wall = this.getWall('left');
      const newMap = new GameMap({
        name: map.exits.left,
        exits: {right: map.name},
        sprites: this.buildWall('up').concat(this.buildWall('down')).concat(this.buildWall('left')),
        playerStart: {x: 2 * blockSize, y: 2 * blockSize},
      });
      for (const s of wall) {
        newMap.sprites.push({
          type: Sprites.Wall,
          pos: new Point((sizeX - 1) * blockSize, s.pos.y),
        });
      }
      promises.push(this.saveMap(newMap, true));
    }
    if (map.exits.right && this.mapList.indexOf(map.exits.right) < 0) {
      const wall = this.getWall('right');
      const newMap = new GameMap({
        name: map.exits.right,
        exits: {left: map.name},
        sprites: this.buildWall('up').concat(this.buildWall('down')).concat(this.buildWall('right')),
        playerStart: {x: 2 * blockSize, y: 2 * blockSize},
      });
      for (const s of wall) {
        newMap.sprites.push({
          type: Sprites.Wall,
          pos: new Point(0, s.pos.y),
        });
      }
      promises.push(this.saveMap(newMap, true));
    }
    return Promise.all(promises);
  }
}
