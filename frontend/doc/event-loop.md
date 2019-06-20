# Event Loop

The game state is updated on an event loop which ticks 4 times per second. Each tick has a number of states described
here.

## States

### tickStart

This is the start of each tick. Every sprite's `tickStart()` method is called in a random order. The current tick
counter is updated before calling each sprite.

### tickQueue

All events that have been added to the event loop using `EventLoop.queue(atTick())` are called here, once only. Each
event must return a `Promise<any>`, which will be awaited before continuing with the next state.

### tickInside

This is uesd internally by the event loop. Callbacks added using `EventLoop.inside()` are called every tick, and must
return a `Promise<any>`, which will be awaited before continung with the next state.

### tickEnd

This is the end of each tick. Every sprite's `tickEnd()` method is called in a random order.

### tickWait

Any events that have been added to the event loop using `EventLoop.queue(afterMs())` are called here, once only.
Events may only occur at most once per millisecond during this period.

## Adding Events

Events can be added to the event queue using the `EventLoop.queue()` method. The method takes two parameters, the first
specifying when to run the event and the second is a function returning a `Promise<any>`.

The first parameter can be generated using either `afterMs()` or `atTick()`.

`afterMs()` takes a single argument, the number of milliseconds from now to run the event. The event may be delayed and
the callback can check the delay in milliseconds with `moment().valueOf() - event.when.time`.

`atTick()` takes a single argument, the game tick at which to run the event. If the argument is less than or equal to
the current tick number, it will be run on the next game tick (in the `tickQueue` state).
