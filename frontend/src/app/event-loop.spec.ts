import {afterMs, atTick, Event, EventLoop} from './event-loop';

describe('EventLoop', () => {
  it('should create an instance', () => {
    expect(new EventLoop()).toBeTruthy();
  });

  it('should queue timed events', () => {
    const l = new EventLoop();
    l.queue(afterMs(10), (event): Promise<any> => {
      return Promise.resolve();
    });
    expect(l.timeQueue.length).toEqual(1);
    expect(l.tickQueue.length).toEqual(0);
  });

  it('should queue tick events', () => {
    const l = new EventLoop();
    l.queue(atTick(10), (event): Promise<any> => {
      return Promise.resolve();
    });
    expect(l.timeQueue.length).toEqual(0);
    expect(l.tickQueue.length).toEqual(1);
  });

  it('should not run timed events before now', async () => {
    const l = new EventLoop();
    let called = false;
    l.queue(afterMs(10000), (event): Promise<any> => {
      called = true;
      return Promise.resolve();
    });
    await l.run();
    expect(called).toBeFalsy();
  });

  it('should run timed events', async () => {
    const l = new EventLoop();
    let called = false;
    l.queue(afterMs(0), (event): Promise<any> => {
      called = true;
      return Promise.resolve();
    });
    await l.run();
    expect(called).toBeTruthy();
  });

  it('should run tick events', async () => {
    const l = new EventLoop();
    let called = false;
    l.queue(atTick(2), (event): Promise<any> => {
      called = true;
      return Promise.resolve();
    });
    await l.tick();
    expect(called).toBeFalsy();
    await l.tick();
    expect(called).toBeTruthy();
  });

  it('should run late tick events (and pass the current tick)', async () => {
    const l = new EventLoop();
    let called = 0;
    await l.tick();
    l.queue(atTick(1), (event): Promise<any> => {
      called = event.tick;
      return Promise.resolve();
    });
    await l.tick();
    expect(called).toEqual(2);
  });

  it('should not run timed events on tick', async () => {
    const l = new EventLoop();
    let called = false;
    l.queue(atTick(10), (event): Promise<any> => {
      called = true;
      return Promise.resolve();
    });
    await l.run();
    expect(called).toBeFalsy();
  });

  it('should not run tick events on time', async () => {
    const l = new EventLoop();
    let called = false;
    l.queue(afterMs(0), (event): Promise<any> => {
      called = true;
      return Promise.resolve();
    });
    await l.tick();
    expect(called).toBeFalsy();
  });

  it('should order tick events', async () => {
    const l = new EventLoop();
    l.queue(atTick(10), (event): Promise<any> => {
      return Promise.resolve();
    });
    l.queue(atTick(5), (event): Promise<any> => {
      return Promise.resolve();
    });
    expect(l.tickQueue.length).toEqual(2);
    expect(l.tickQueue[0].when.tick).toBeLessThan(l.tickQueue[1].when.tick);
  });

  it('should order time events', async () => {
    const l = new EventLoop();
    l.queue(afterMs(10), (event): Promise<any> => {
      return Promise.resolve();
    });
    l.queue(afterMs(5), (event): Promise<any> => {
      return Promise.resolve();
    });
    expect(l.timeQueue.length).toEqual(2);
    expect(l.timeQueue[0].when.time).toBeLessThan(l.timeQueue[1].when.time);
  });
});
