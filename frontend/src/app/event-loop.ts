import {Injectable} from '@angular/core';

import * as _ from 'lodash';
import * as moment from 'moment';
import {environment} from '../environments/environment';

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

export class Event {
  when: When;
  callback: EventCallback;
  eventLoop?: EventLoop;

  constructor(when: When, callback: EventCallback) {
    this.when = when;
    this.callback = callback;
  }
}

@Injectable({providedIn: 'root'})
export class EventLoop {
  tickQueue: Event[] = [];
  timeQueue: Event[] = [];

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

  runTick(tick: number): Promise<any> {
    // Fire all the events that are currently ready for the current tick.
    const promises: Promise<any>[] = [];
    while (this.tickQueue.length) {
      const event = this.tickQueue[0];
      if (event.when.tick > tick) {
        break;
      }
      this.tickQueue.shift();
      event.eventLoop = this;
      promises.push(event.callback(event));
    }
    return Promise.all(promises);
  }

  queue(event: Event) {
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
