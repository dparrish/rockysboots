import { TestBed } from '@angular/core/testing';

import { MapServerService } from './map-server.service';

describe('MapServerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MapServerService = TestBed.get(MapServerService);
    expect(service).toBeTruthy();
  });
});
