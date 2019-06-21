import {TestBed} from '@angular/core/testing';

import {environment} from '../environments/environment';

import {MapServerService} from './map-server.service';

describe('MapServerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MapServerService = TestBed.get(MapServerService);
    expect(service).toBeTruthy();
  });

  it('should load a map', async () => {
    const service: MapServerService = TestBed.get(MapServerService);
    expect(service).toBeTruthy();
    const res = {
      json: (): any => {
        return {
          status: 'OK',
          map: JSON.stringify({
            name: 'test',
            exits: {
              up: 'test-1',
            },
            playerStart: {
              x: 10,
              y: 20,
            },
          }),
        };
      }
    } as unknown as Response;
    spyOn(window, 'fetch').and.returnValue(Promise.resolve(res));
    const map = await service.load('test');
    expect(map.name).toEqual('test');
    expect(map.exits.up).toEqual('test-1');
    expect(map.playerStart.x).toEqual(10);
    expect(map.playerStart.y).toEqual(20);
    expect((window.fetch as any).calls.count()).toEqual(1);
    expect((window.fetch as any).calls.argsFor(0)[0]).toEqual(`${environment.mapserverUrl}/map/test`);
  });
});
