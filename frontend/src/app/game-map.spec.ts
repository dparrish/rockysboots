import * as _ from 'lodash';
import {blockSize, sizeX, sizeY} from './constants/constants.module';
import {GameMap} from './game-map';
import {Sprites} from './sprites';

describe('GameMap', () => {
  it('can build up walls', () => {
    const map = new GameMap();
    map.buildWall('up');
    expect(map.sprites.length).toEqual(sizeX);
    for (const sprite of map.sprites) {
      expect(sprite.type === Sprites.Wall);
      expect(sprite.pos.x === 0);
    }
  });

  it('can build down walls', () => {
    const map = new GameMap();
    map.buildWall('down');
    expect(map.sprites.length).toEqual(sizeX);
    for (const sprite of map.sprites) {
      expect(sprite.type === Sprites.Wall);
      expect(sprite.pos.x === (sizeX - 1) * blockSize);
    }
  });

  it('can build left walls', () => {
    const map = new GameMap();
    map.buildWall('left');
    expect(map.sprites.length).toEqual(sizeY);
    for (const sprite of map.sprites) {
      expect(sprite.type === Sprites.Wall);
      expect(sprite.pos.y === 0);
    }
  });

  it('can build right walls', () => {
    const map = new GameMap();
    map.buildWall('right');
    expect(map.sprites.length).toEqual(sizeY);
    for (const sprite of map.sprites) {
      expect(sprite.type === Sprites.Wall);
      expect(sprite.pos.y === (sizeY - 1) * blockSize);
    }
  });

  it('can build all walls', () => {
    const map = new GameMap();
    map.buildWall('left');
    map.buildWall('right');
    map.buildWall('up');
    map.buildWall('down');
    expect(map.sprites.length).toEqual(sizeX * 2 + (sizeY - 2) * 2);
  });
});
