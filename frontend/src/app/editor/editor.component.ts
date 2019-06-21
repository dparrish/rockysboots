import {AfterViewInit, Component} from '@angular/core';
import * as _ from 'lodash';

import {environment} from '../../environments/environment';
import {blockSize, constants, formatText, sizeX, sizeY} from '../constants/constants.module';
import {afterMs, atTick, Event, EventLoop} from '../event';
import {GameMap} from '../game-map';
import {MapServerService} from '../map-server.service';
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
  drawGrid: boolean = environment.editor.drawGrid;
  playerSprite: Player = null;
  tempSprite: Sprite = null;

  constructor(private eventLoop: EventLoop, private mapServer: MapServerService) {
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

    if (this.currentSprite === Sprites.Text) {
      document.getElementById('text').focus();
      (document.getElementById('text') as HTMLInputElement).select();
    }
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
    return this.mapServer.list().then((json: any) => {
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
    return this.mapServer.load(name).then((map: GameMap) => {
      this.map = map;
      this.playerSprite = new Player({
        x: this.map.playerStart.x,
        y: this.map.playerStart.y,
      });
      this.eventLoop.sprites = this.map.sprites;
      return map;
    });
  }

  async gameTick() {
    await this.eventLoop.tick();
    this.drawMap();
  }

  async validExits() {
    if (this.map.name === 'sprite-test') return;
    if (this.map.getWall('up').length !== sizeX && !this.map.exits.up) {
      throw new Error(`exit-up invalid (${this.map.getWall('up').length} / ${sizeX} found)`);
    }
    if (this.map.getWall('down').length !== sizeX && !this.map.exits.down) {
      throw new Error(`exit-down invalid (${this.map.getWall('down').length} / ${sizeX} found)`);
    }
    if (this.map.getWall('left').length !== sizeY && !this.map.exits.left) {
      throw new Error(`exit-left invalid (${this.map.getWall('left').length} / ${sizeY} found)`);
    }
    if (this.map.getWall('right').length !== sizeY && !this.map.exits.right) {
      throw new Error(`exit-right invalid (${this.map.getWall('right').length} / ${sizeY} found)`);
    }
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
      alert(e.toString());
      return;
    }

    console.log(`Saving map ${map.name}`);
    return this.mapServer.save(map.name, this.buildJson(map)).then(async (json: any) => {
      this.mapList.push(map.name);
      this.mapList = _.uniq(this.mapList);
      this.mapList = this.mapList.sort();
      this.updateMapList();
      return this.buildOppositeExits(map);
    });
  }

  async buildOppositeExits(map: GameMap) {
    const promises: Promise<any>[] = [];
    // Create adjoining maps if they don't yet exist.
    if (map.exits.up && this.mapList.indexOf(map.exits.up) < 0) {
      const newMap = new GameMap({
        name: map.exits.up,
        exits: {down: map.name},
        playerStart: {x: 2 * blockSize, y: 2 * blockSize},
      });
      for (const s of map.getWall('up')) {
        newMap.sprites.push(newSprite(map, {
          type: Sprites.Wall,
          x: s.pos.x,
          y: (sizeY - 1) * blockSize,
        }));
      }
      newMap.buildWall('up');
      newMap.buildWall('left');
      newMap.buildWall('right');
      promises.push(this.saveMap(newMap, true));
    }
    if (map.exits.down && this.mapList.indexOf(map.exits.down) < 0) {
      const newMap = new GameMap({
        name: map.exits.down,
        exits: {up: map.name},
        playerStart: {x: 2 * blockSize, y: 2 * blockSize},
      });
      for (const s of map.getWall('down')) {
        newMap.sprites.push(newSprite(map, {
          type: Sprites.Wall,
          x: s.pos.x,
          y: 0,
        }));
      }
      newMap.buildWall('down');
      newMap.buildWall('left');
      newMap.buildWall('right');
      promises.push(this.saveMap(newMap, true));
    }
    if (map.exits.left && this.mapList.indexOf(map.exits.left) < 0) {
      const newMap = new GameMap({
        name: map.exits.left,
        exits: {right: map.name},
        playerStart: {x: 2 * blockSize, y: 2 * blockSize},
      });
      for (const s of map.getWall('left')) {
        newMap.sprites.push(newSprite(map, {
          type: Sprites.Wall,
          x: (sizeX - 1) * blockSize,
          y: s.pos.y,
        }));
      }
      newMap.buildWall('up');
      newMap.buildWall('down');
      newMap.buildWall('left');
      promises.push(this.saveMap(newMap, true));
    }
    if (map.exits.right && this.mapList.indexOf(map.exits.right) < 0) {
      const newMap = new GameMap({
        name: map.exits.right,
        exits: {left: map.name},
        playerStart: {x: 2 * blockSize, y: 2 * blockSize},
      });
      for (const s of map.getWall('right')) {
        console.log(`Got ${s} at ${s.pos} - moving to 0,${s.pos.y}`);
        newMap.sprites.push(newSprite(map, {
          type: Sprites.Wall,
          x: 0,
          y: s.pos.y,
        }));
      }
      newMap.buildWall('up');
      newMap.buildWall('down');
      newMap.buildWall('right');
      promises.push(this.saveMap(newMap, true));
    }
    return Promise.all(promises);
  }

  async checkAllMaps() {
    const maps: {[name: string]: GameMap} = {};
    const promises: Promise<GameMap>[] = [];
    for (const mapName of this.mapList) {
      promises.push(this.mapServer.load(mapName).then(async (map: GameMap) => {
        if (map.name === 'sprite-test' || map.name === 'empty') return null;
        maps[map.name] = map;
        return map;
      }));
    }
    await Promise.all(promises);
    for (const map of Object.values(maps)) {
      console.log(`Checking map ${map.name} with ${map.sprites.length} sprites`);
      const walls: {[dir: string]: Sprite[]} = {
        up: map.getWall('up'),
        down: map.getWall('down'),
        left: map.getWall('left'),
        right: map.getWall('right'),
      };
      let hasexit = false;
      for (const dir of directions) {
        const expected = dir === 'up' || dir === 'down' ? sizeX : sizeY;
        if (!map.exits[dir]) {
          if (walls[dir].length !== expected) {
            console.error(`Map ${map.name} has wall gaps but no exit ${dir}`);
          }
          continue;
        }
        if (walls[dir].length === expected) {
          console.error(`Map ${map.name} has exit ${dir} but no wall gaps (${walls[dir].length} / ${expected})`);
          continue;
        }
        hasexit = true;
        const other = maps[map.exits[dir]];
        if (!other) {
          console.error(`Map ${map.name} exit ${dir} has invalid destination ${map.exits[dir]}`);
          continue;
        }
        let a = [];
        let b = [];
        switch (dir) {
          case 'up':
            if (other.exits.down !== map.name) {
              console.error(`Map ${map.name} exit ${dir} has invalid return map ${other.exits.down}`);
              continue;
            }
            a = walls.up;
            b = other.getWall('down');
            break;
          case 'down':
            if (other.exits.up !== map.name) {
              console.error(`Map ${map.name} exit ${dir} has invalid return map ${other.exits.up}`);
              continue;
            }
            a = walls.down;
            b = other.getWall('up');
            break;
          case 'left':
            if (other.exits.right !== map.name) {
              console.error(`Map ${map.name} exit ${dir} has invalid return map ${other.exits.right}`);
              continue;
            }
            a = walls.left;
            b = other.getWall('right');
            break;
          case 'right':
            if (other.exits.left !== map.name) {
              console.error(`Map ${map.name} exit ${dir} has invalid return map ${other.exits.left}`);
              continue;
            }
            a = walls.right;
            b = other.getWall('left');
            break;
        }
        if (dir === 'up' || dir === 'down') {
          a = _.map(a, (s: Sprite) => s.pos.x);
          b = _.map(b, (s: Sprite) => s.pos.x);
        } else {
          a = _.map(a, (s: Sprite) => s.pos.y);
          b = _.map(b, (s: Sprite) => s.pos.y);
        }
        a.sort();
        b.sort();
        if (!_.isEqual(a, b)) {
          console.error(`Map ${map.name} exit ${dir} does not have matching exits in ${other.name}`);
          continue;
        }
      }
      if (!hasexit) {
        console.error(`Map ${map.name} is disconnected from all others`);
      }
    }
  }
}
