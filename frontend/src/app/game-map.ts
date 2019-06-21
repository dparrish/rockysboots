import * as _ from 'lodash';

import {blockSize} from './constants/constants.module';
import {sizeX, sizeY} from './constants/constants.module';
import {MapServerService} from './map-server.service';
import {newSprite, Sprite, Sprites} from './sprites';

export class GameMap {
  exits = {
    down: '',
    left: '',
    right: '',
    up: '',
  };
  name = '';
  playerStart = {x: 2 * blockSize, y: 2 * blockSize};
  sprites: Sprite[] = [];

  constructor(json?: any) {
    this.sprites = [];
    if (json) {
      this.exits = json.exits;
      this.name = json.name;
      this.playerStart = json.playerStart;
      this.sprites = _.map(json.sprites, s => newSprite(this, s));
      this.sortSprites();
    }
  }

  sortSprites() {
    this.sprites = _.sortBy(this.sprites, (a: any, b: any): number => {
      if (a.type === Sprites.Wall || a.type === Sprites.OptionWall) return 1;
      return 0;
    });
  }

  getWall(direction: string): Sprite[] {
    const isWall = (s: Sprite) => (s.type === Sprites.Wall || s.type === Sprites.OptionWall);
    switch (direction) {
      case 'up':
        return _.filter(this.sprites, (s: Sprite) => s.pos.y === 0 && isWall(s));
      case 'down':
        return _.filter(this.sprites, (s: Sprite) => s.pos.y === (sizeY - 1) * blockSize && isWall(s));
      case 'left':
        return _.filter(this.sprites, (s: Sprite) => s.pos.x === 0 && isWall(s));
      case 'right':
        return _.filter(this.sprites, (s: Sprite) => s.pos.x === (sizeX - 1) * blockSize && isWall(s));
    }
  }

  buildWall(direction: string) {
    let sprites: Sprite[] = [];
    switch (direction) {
      case 'up':
        sprites = _.map(_.range(0, sizeX), i => newSprite(this, {
                                             colour: 'blue',
                                             type: Sprites.Wall,
                                             x: i * blockSize,
                                             y: 0,
                                           }));
        break;
      case 'down':
        sprites = _.map(_.range(0, sizeX), i => newSprite(this, {
                                             colour: 'blue',
                                             type: Sprites.Wall,
                                             x: i * blockSize,
                                             y: (sizeY - 1) * blockSize,
                                           }));
        break;
      case 'left':
        sprites = _.map(_.range(0, sizeY), i => newSprite(this, {
                                             colour: 'blue',
                                             type: Sprites.Wall,
                                             x: 0,
                                             y: i * blockSize,
                                           }));
        break;
      case 'right':
        sprites = _.map(_.range(0, sizeY), i => newSprite(this, {
                                             colour: 'blue',
                                             type: Sprites.Wall,
                                             x: (sizeX - 1) * blockSize,
                                             y: i * blockSize,
                                           }));
        break;
    }
    SPRITE: for (const sprite of sprites) {
      for (const other of this.sprites) {
        if ((other.type === Sprites.Wall || other.type === Sprites.OptionWall) && other.pos.equals(sprite.pos)) {
          console.log(`Found existing wall at ${sprite.pos}`);
          continue SPRITE;
        }
      }
      this.sprites.push(sprite);
    }
  }
}
