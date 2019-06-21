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

  run(): Promise<any> {
    // Fire all the events that are currently ready right now.
    const promises: Promise<any>[] = [];
    const now = moment().valueOf();
    while (this.timeQueue.length && this.timeQueue[0].when.time <= now) {
      const event = this.timeQueue.shift();
      event.eventLoop = this;
      promises.push(event.callback(event));
    }
    return Promise.all(promises);
  }

  async tick(): Promise<any> {
    // tickStart

    this.currentTick++;

    // Update all sprites' internal state.
    _.map(this.sprites, (s: Sprite) => s.tickStart(this));

    // tickQueue

    // Fire all the events that are currently ready for the current tick.
    const promises: Promise<any>[] = [];
    while (this.tickQueue.length && this.tickQueue[0].when.tick <= this.currentTick) {
      const event = this.tickQueue.shift();
      event.eventLoop = this;
      event.tick = this.currentTick;
      promises.push(event.callback(event));
    }
    await Promise.all(promises);


    // tickEnd

    _.map(this.sprites, (s: Sprite) => s.tickEnd(this));

    // tickWait
  }

  queue(when: When, callback: EventCallback) {
    const event = new Event(when, callback);
    if (event.when.time >= 0) {
      this.timeQueue.push(event);
      this.timeQueue.sort((a: Event, b: Event): number => a.when.time - b.when.time);
    } else {
      this.tickQueue.push(event);
      this.tickQueue.sort((a: Event, b: Event): number => a.when.tick - b.when.tick);
    }
  }
}
