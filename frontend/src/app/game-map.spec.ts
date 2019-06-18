import {environment} from '../environments/environment';

import {GameMap, loadMap} from './game-map';

describe('GameMap', () => {
  it('should load a map', async () => {
    const res = {
      json: (): any => {
        return {
          status: 'OK',
          map: JSON.stringify({
            name: 'test',
            exits: {
              up: 'test-1',
            },
            sprites: ['a'],
            playerStart: {
              x: 10,
              y: 20,
            },
          }),
        };
      }
    } as unknown as Response;
    spyOn(window, 'fetch').and.returnValue(Promise.resolve(res));
    const map = await loadMap('test');
    expect(map.name).toEqual('test');
    expect(map.sprites).toEqual(['a']);
    expect(map.exits.up).toEqual('test-1');
    expect(map.playerStart.x).toEqual(10);
    expect(map.playerStart.y).toEqual(20);
    expect((window.fetch as any).calls.count()).toEqual(1);
    expect((window.fetch as any).calls.argsFor(0)[0]).toEqual(`${environment.mapserverUrl}/map/test`);
  });
});
