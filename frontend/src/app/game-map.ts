import * as _ from 'lodash';

import {constants} from './constants/constants.module';
import * as sprites from './sprites';

const blockSize = constants.blockSize;

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

export function loadMap(name: string): Promise<GameMap> {
  return fetch(`https://rockysboots.dparrish.com/api/v1/map/${name}`, {
           cache: 'no-cache',
           headers: {'Content-Type': 'application/json'},
           redirect: 'follow',
         })
      .then((response: Response) => {
        return response.json();
      })
      .then(json => {
        if (!json || !json.map || json.status != 'OK') {
          console.log('Error loading map', json);
          let map = new GameMap();
          return map;
        }
        let map = new GameMap(JSON.parse(json.map));
        // console.log('Got map', map);
        return map;
      });
}
