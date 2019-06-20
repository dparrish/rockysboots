import {Injectable} from '@angular/core';

import * as _ from 'lodash';
import * as moment from 'moment';
import {environment} from '../environments/environment';
import {Sprite} from './sprites';

interface When {
  // Game tick.
  tick: number;

  // Unix time in ms.
  time: number;
}

export function afterMs(time: number): When {
  return {
    time: time + moment().valueOf(),
    tick: -1,
  };
}

export function atTick(tick: number): When {
  return {
    tick,
    time: -1,
  };
}

type EventCallback = (event: Event) => Promise<any>;
type InsideTickCallback = (eventLoop: EventLoop) => Promise<any>;

export class Event {
  eventLoop?: EventLoop;
  tick: number = 0;

  constructor(public when: When, public callback: EventCallback) {}
}

@Injectable({providedIn: 'root'})
export class EventLoop {
  currentTick: number = 0;
  tickQueue: Event[] = [];
  timeQueue: Event[] = [];
  sprites: Sprite[] = [];
  insideTickCallbacks: InsideTickCallback[] = [];

  run(): Promise<any> {
    // Fire all the events that are currently ready right now.
    const promises: Promise<any>[] = [];
    const now = moment().valueOf();
    while (this.timeQueue.length) {
      const event = this.timeQueue[0];
      if (event.when.time > now) {
        break;
      }
      this.timeQueue.shift();
      event.eventLoop = this;
      promises.push(event.callback(event));
    }
    return Promise.all(promises);
  }

  inside(cb: InsideTickCallback) {
    this.insideTickCallbacks.push(cb);
  }

  async tick(): Promise<any> {
    this.currentTick++;

    // Update all sprites' internal state.
    for (const sprite of this.sprites) {
      sprite.tickStart(this);
    }

    // Fire all the events that are currently ready for the current tick.
    let promises: Promise<any>[] = [];
    while (this.tickQueue.length) {
      const event = this.tickQueue[0];
      if (event.when.tick > this.currentTick) {
        break;
      }
      this.tickQueue.shift();
      event.eventLoop = this;
      event.tick = this.currentTick;
      promises.push(event.callback(event));
    }
    await Promise.all(promises);

    promises = [];
    for (const cb of this.insideTickCallbacks) {
      promises.push(cb(this));
    }
    await Promise.all(promises);

    for (const sprite of this.sprites) {
      sprite.tickEnd(this);
    }
  }

  queue(when: When, callback: EventCallback) {
    const event = new Event(when, callback);
    if (event.when.time >= 0) {
      this.timeQueue.push(event);
      this.timeQueue.sort((a: Event, b: Event): number => cmp(a.when.time, b.when.time));
    } else {
      this.tickQueue.push(event);
      this.tickQueue.sort((a: Event, b: Event): number => cmp(a.when.tick, b.when.tick));
    }
  }
}

function cmp(a: number, b: number): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
