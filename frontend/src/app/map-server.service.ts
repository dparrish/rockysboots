import {Injectable} from '@angular/core';

import {environment} from '../environments/environment';
import {GameMap} from './game-map';

@Injectable({providedIn: 'root'})
export class MapServerService {
  async load(name: string): Promise<GameMap> {
    return fetch(`${environment.mapserverUrl}/map/${name}`, {
             cache: 'no-cache',
             headers: {'Content-Type': 'application/json'},
             redirect: 'follow',
           })
        .then((response: Response) => {
          return response.json();
        })
        .then((json) => {
          if (!json || !json.map || json.status !== 'OK') throw new Error(`Error loading map: ${json}`);
          return new GameMap(JSON.parse(json.map));
        });
  }

  async save(name: string, json: any): Promise<GameMap> {
    return fetch(`${environment.mapserverUrl}/map/${name}`, {
             method: 'PUT',
             cache: 'no-cache',
             headers: {'Content-Type': 'application/json'},
             redirect: 'follow',
             body: JSON.stringify(json),
           })
        .then((response: Response) => {
          return response.json();
        });
  }

  async list(): Promise<GameMap[]> {
    return fetch(`${environment.mapserverUrl}/maps`, {
             cache: 'no-cache',
             headers: {'Content-Type': 'application/json'},
             redirect: 'follow',
           })
        .then((response: Response) => {
          return response.json();
        });
  }
}
