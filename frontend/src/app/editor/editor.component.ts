import {AfterViewInit, Component} from '@angular/core';
import * as _ from 'lodash';

import {environment} from '../../environments/environment';
import {constants} from '../constants/constants.module';
import {GameMap, loadMap} from '../game-map';
import {DrawSprite, Sprite, Sprites} from '../sprites';

const snapSize = 10;
const directions = ['up', 'down', 'left', 'right'];

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements AfterViewInit {
  canvas: HTMLCanvasElement;
  canvasWidth = constants.sizeX * constants.blockSize;
  canvasHeight = constants.sizeY * constants.blockSize;
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
  moveSnap = true;
  mapList: string[] = [];
  Sprites: any;
  spriteNames: string[] = [];

  constructor() {
    this.Sprites = Sprites;
    const sn = Object.keys(Sprites);
    this.spriteNames = sn.slice(0, sn.length / 2);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      window.addEventListener('selectstart', event => {
        if ((event.target as HTMLInputElement).type === 'text') {
          return;
        }
        event.preventDefault();
      });

      window.addEventListener('keydown', event => {
        if (event.code === 'ShiftLeft') {
          this.moveSnap = false;
          event.cancelBubble = true;
        }
      });

      window.addEventListener('keyup', event => {
        if (event.code === 'ShiftLeft') {
          this.moveSnap = true;
          event.cancelBubble = true;
        }
      });

      this.map.name = 'test-map';
      this.selectColour('white');
      this.loadMapList().then(loaded => {
        this.loadMap('empty');
      });
      setInterval(() => {
        this.drawMap();
      }, 1000 / 30);
      window.setInterval(() => {
        this.gameTick();
      }, 1000 / 2);
    }, 1);
  }

  drawMap(): void {
    const canvas = document.getElementById('board') as HTMLCanvasElement;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.fillRect(0, 0, constants.sizeX * constants.blockSize, constants.sizeY * constants.blockSize);

    // Draw existing sprites.
    for (const s of this.map.sprites) {
      DrawSprite(ctx, s);
    }

    // Draw new sprite if mouse is down.
    if (this.pointer.down) {
      DrawSprite(ctx, {
        x: this.pointer.x,
        y: this.pointer.y,
        type: this.currentSprite as Sprites,
        colour: this.currentColour,
        powered: this.currentPowered,
        text: this.currentText,
      } as Sprite);
    }

    // Draw player
    if (!this.pointer.down || (this.pointer.down && this.currentSprite !== Sprites.Player)) {
      DrawSprite(ctx, {
        x: this.map.playerStart.x,
        y: this.map.playerStart.y,
        type: Sprites.Player,
      } as Sprite);
    }

    // Draw grid overlay.
    if (constants.inEditor && environment.drawGrid) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'grey';
      for (let x = 0; x < constants.sizeX; x++) {
        for (let y = 0; y < constants.sizeY; y++) {
          ctx.strokeRect(
              x * constants.blockSize, y * constants.blockSize, (x + 1) * constants.blockSize,
              (y + 1) * constants.blockSize);
        }
      }
    }
  }

  snapPointer() {
    const ss = this.moveSnap ? constants.blockSize : snapSize;
    if (this.pointer.x % constants.blockSize !== 0) {
      this.pointer.x = Math.floor(this.pointer.x / ss) * ss;
    }
    if (this.pointer.y % constants.blockSize !== 0) {
      this.pointer.y = Math.floor(this.pointer.y / ss) * ss;
    }
  }

  selectColour(colour: string) {
    this.currentColour = colour;
    document.querySelectorAll('div.colour').forEach((el) => {
      const h = (el as HTMLElement);
      if (h.style.backgroundColor === colour) {
        h.style.border = '2px solid black';
      } else {
        h.style.border = '2px solid white';
      }
    });
  }

  dropSprite() {
    if (this.currentSprite === Sprites.Empty) {
      // console.log(`Removing all sprites at at ${this.pointer.x} / ${this.pointer.y}`);
      _.remove(this.map.sprites, el => el.x === this.pointer.x && el.y === this.pointer.y);
      return;
    }
    if (this.currentSprite === Sprites.Player) {
      this.map.playerStart.x = this.pointer.x;
      this.map.playerStart.y = this.pointer.y;
      return;
    }
    _.remove(this.map.sprites, el => el.x === this.pointer.x && el.y === this.pointer.y);
    const s: Sprite = {
      colour: this.currentColour,
      text: undefined,
      type: this.currentSprite,
      x: this.pointer.x,
      y: this.pointer.y,
      fixed: this.currentFixed,
    };
    if (this.currentSprite === Sprites.Text) {
      s.text = this.currentText;
      if (this.currentText === '') {
        return;
      }
    }
    s.powered = this.currentPowered;
    this.map.sprites.push(s);
    this.map.sortSprites();
  }

  pointerDown(event: any) {
    this.pointer.down = true;
    this.pointer.x = event.offsetX;
    this.pointer.y = event.offsetY;
    this.snapPointer();
    event.cancelBubble = true;
  }

  pointerUp(event: any) {
    this.pointer.down = false;
    this.dropSprite();
  }

  mouseMove(event: any) {
    this.pointer.x = event.offsetX;
    this.pointer.y = event.offsetY;
    this.snapPointer();
  }

  mouseEnter(event: any) {
    if (event.buttons === 1) {
      this.pointer.down = true;
    } else {
      this.pointer.down = false;
    }
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
        .then(json => {
          // console.log('Got maps list', json);
          this.mapList = json.maps;
          this.mapList.sort();
          this.updateMapList();
          if (this.map.name === '') {
            return this.loadMap('sprite-test');
          }
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
    return loadMap(name).then(map => {
      this.map = map;
      this.updateExitsTicks();
      return map;
    });
  }

  updateExitsTicks() {}

  gameTick() {}

  getWall(direction: string): Sprite[] {
    function isWall(s: Sprite): boolean {
      return s.type === Sprites.Wall || s.type === Sprites.OptionWall;
    }
    switch (direction) {
      case 'up':
        return _.filter(this.map.sprites, s => s.y === 0 && isWall(s));
      case 'down':
        return _.filter(this.map.sprites, s => s.y === (constants.sizeY - 1) * constants.blockSize && isWall(s));
      case 'left':
        return _.filter(this.map.sprites, s => s.x === 0 && isWall(s));
      case 'right':
        return _.filter(this.map.sprites, s => s.x === (constants.sizeX - 1) * constants.blockSize && isWall(s));
      default:
        return null;
    }
  }

  buildWall(direction: string): Sprite[] {
    const sprites: Sprite[] = [];
    switch (direction) {
      case 'up':
        for (let i = 0; i < constants.sizeX; i++) {
          sprites.push({
            colour: 'blue',
            type: Sprites.Wall,
            x: i * constants.blockSize,
            y: 0,
          });
        }
        break;
      case 'down':
        for (let i = 0; i < constants.sizeX; i++) {
          sprites.push({
            colour: 'blue',
            type: Sprites.Wall,
            x: i * constants.blockSize,
            y: (constants.sizeY - 1) * constants.blockSize,
          });
        }
        break;
      case 'left':
        for (let i = 0; i < constants.sizeY; i++) {
          sprites.push({
            colour: 'blue',
            type: Sprites.Wall,
            x: 0,
            y: i * constants.blockSize,
          });
        }
        break;
      case 'right':
        for (let i = 0; i < constants.sizeY; i++) {
          sprites.push({
            colour: 'blue',
            type: Sprites.Wall,
            x: (constants.sizeX - 1) * constants.blockSize,
            y: i * constants.blockSize,
          });
        }
        break;
      default:
        break;
    }
    return sprites;
  }

  validExits(): Promise<any> {
    if (this.map.name === 'sprite-test') {
      return Promise.resolve(true);
    }
    let wall = this.getWall('up');
    if (wall.length !== constants.sizeX && !this.map.exits.up) {
      console.log(wall);
      return Promise.reject('exit-up invalid');
    }
    wall = this.getWall('down');
    if (wall.length !== constants.sizeX && !this.map.exits.down) {
      console.log(wall);
      return Promise.reject('exit-down invalid');
    }
    wall = this.getWall('left');
    if (wall.length !== constants.sizeY && !this.map.exits.left) {
      console.log(wall);
      return Promise.reject('exit-left invalid');
    }
    wall = this.getWall('right');
    if (wall.length !== constants.sizeY && !this.map.exits.right) {
      console.log(wall);
      return Promise.reject('exit-right invalid');
    }
    return Promise.resolve(true);
  }

  async saveMap(map: GameMap, forceInvalidExits = false): Promise<any> {
    if (map.name === '') {
      throw new Error('Invalid map name');
    }
    try {
      if (!forceInvalidExits) {
        await this.validExits();
      }
    } catch (e) {
      alert(e);
      return Promise.resolve(false);
    }

    console.log(`Saving map ${map.name}`);
    return fetch(`${environment.mapserverUrl}/map/${map.name}`, {
             method: 'PUT',
             cache: 'no-cache',
             headers: {'Content-Type': 'application/json'},
             redirect: 'follow',
             body: JSON.stringify(map, null, 2),
           })
        .then((response: Response) => {
          return response.json();
        })
        .then(json => {
          this.mapList.push(map.name);
          this.mapList = _.uniqBy(this.mapList);
          this.mapList = this.mapList.sort();
          this.updateMapList();

          // Create adjoining maps if they don't yet exist.
          if (map.exits.up) {
            if (this.mapList.indexOf(map.exits.up) < 0) {
              const wall = this.getWall('up');
              const newMap = new GameMap({
                name: map.exits.up,
                exits: {
                  down: map.name,
                },
                sprites: this.buildWall('up').concat(this.buildWall('left')).concat(this.buildWall('right')),
                playerStart: {x: 2 * constants.blockSize, y: 2 * constants.blockSize},
              });
              for (const s of wall) {
                newMap.sprites.push({
                  type: Sprites.Wall,
                  x: s.x,
                  y: (constants.sizeY - 1) * constants.blockSize,
                });
              }
              // console.log(`Creating map ${map.exits.up} up`, newMap);
              this.saveMap(newMap, true);
            }
          }
          if (map.exits.down) {
            if (this.mapList.indexOf(map.exits.down) < 0) {
              const wall = this.getWall('down');
              const newMap = new GameMap({
                name: map.exits.down,
                exits: {
                  up: map.name,
                },
                sprites: this.buildWall('down').concat(this.buildWall('left')).concat(this.buildWall('right')),
                playerStart: {x: 2 * constants.blockSize, y: 2 * constants.blockSize},
              });
              for (const s of wall) {
                newMap.sprites.push({
                  type: Sprites.Wall,
                  x: s.x,
                  y: 0,
                });
              }
              // console.log(`Creating map ${map.exits.down} down`, newMap);
              this.saveMap(newMap, true);
            }
          }
          if (map.exits.left) {
            if (this.mapList.indexOf(map.exits.left) < 0) {
              const wall = this.getWall('left');
              const newMap = new GameMap({
                name: map.exits.left,
                exits: {
                  right: map.name,
                },
                sprites: this.buildWall('up').concat(this.buildWall('down')).concat(this.buildWall('left')),
                playerStart: {x: 2 * constants.blockSize, y: 2 * constants.blockSize},
              });
              for (const s of wall) {
                newMap.sprites.push({
                  type: Sprites.Wall,
                  x: (constants.sizeX - 1) * constants.blockSize,
                  y: s.y,
                });
              }
              // console.log(`Creating map ${map.exits.left} left`, newMap);
              this.saveMap(newMap, true);
            }
          }
          if (map.exits.right) {
            if (this.mapList.indexOf(map.exits.right) < 0) {
              const wall = this.getWall('right');
              const newMap = new GameMap({
                name: map.exits.right,
                exits: {
                  left: map.name,
                },
                sprites: this.buildWall('up').concat(this.buildWall('down')).concat(this.buildWall('right')),
                playerStart: {x: 2 * constants.blockSize, y: 2 * constants.blockSize},
              });
              for (const s of wall) {
                newMap.sprites.push({
                  type: Sprites.Wall,
                  x: 0,
                  y: s.y,
                });
              }
              // console.log(`Creating map ${map.exits.right} right`, newMap);
              this.saveMap(newMap, true);
            }
          }
          return true;
        });
  }
}
