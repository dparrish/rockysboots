import * as _ from 'lodash';

import {blockSize} from './constants/constants.module';
import {MapServerService} from './map-server.service';
import * as sprites from './sprites';

export class GameMap {
  exits = {
    down: '',
    left: '',
    right: '',
    up: '',
  };
  name = '';
  playerStart = {x: 2 * blockSize, y: 2 * blockSize};
  sprites = [];

  constructor(json?: any) {
    this.sprites = [];
    if (json) {
      this.exits = json.exits;
      this.name = json.name;
      this.playerStart = json.playerStart;
      this.sprites = json.sprites;
      this.sortSprites();
    }
  }

  sortSprites() {
    this.sprites = _.sortBy(this.sprites, (a: any, b: any): number => {
      if (a.type === sprites.Sprites.Wall || a.type === sprites.Sprites.OptionWall) return 1;
      return 0;
    });
  }
}
