import * as _ from 'lodash';
import {constants} from './constants/constants.module';
import {atTick, Event, EventLoop} from './event';
import {GameMap} from './game-map';
import {newSprite, Sprite, Sprites} from './sprites';

describe('Sprites', () => {
  it('should create new sprite from json', () => {
    const s = newSprite(null, {type: Sprites.Player});
    expect(s.type).toEqual(Sprites.Player);
  });

  it('should create new sprite from a type', () => {
    const s = newSprite(null, Sprites.Player);
    expect(s.type).toEqual(Sprites.Player);
  });

  it('should define a bounding box', () => {
    const s = newSprite(null, {type: Sprites.Wall, x: 10, y: 20});
    expect(s.boundingbox.topleft.x).toEqual(10);
    expect(s.boundingbox.topleft.y).toEqual(20);
    expect(s.boundingbox.width).toEqual(40);
    expect(s.boundingbox.height).toEqual(40);
    expect(s.boundingbox.bottomright.x).toEqual(50);
    expect(s.boundingbox.bottomright.y).toEqual(60);
  });

  it('should force text to be fixed', () => {
    const s = newSprite(null, {type: Sprites.Text, x: 10, y: 20, fixed: false});
    expect(s.fixed).toEqual(true);
  });

  it('should match outputs to inputs', () => {
    const sprites = [
      // Source sprite.
      newSprite(null, {type: Sprites.ConnectorRight, x: 0, y: 0, colour: 'source'}),
      // Should be connected.
      newSprite(null, {type: Sprites.ConnectorRight, x: constants.blockSize, y: 0, colour: 'connected'}),
      // Shouldn't be connected.
      newSprite(null, {type: Sprites.ConnectorRight, x: constants.blockSize, y: 100, colour: 'notconnected'}),
    ];
    const connected = sprites[0].connectedOutputs(sprites);
    expect(connected.length).toEqual(1);
    expect(connected[0]).toEqual(sprites[1]);
  });

  it('should match inputs to outputs', () => {
    const sprites = [
      // Source sprite.
      newSprite(null, {type: Sprites.ConnectorRight, x: 0, y: 0, colour: 'source'}),
      // Should be connected.
      newSprite(null, {type: Sprites.ConnectorRight, x: constants.blockSize, y: 0, colour: 'connected'}),
      // Shouldn't be connected.
      newSprite(null, {type: Sprites.ConnectorRight, x: constants.blockSize, y: 100, colour: 'notconnected'}),
    ];
    const connected = sprites[1].connectedInputs(sprites);
    expect(connected.length).toEqual(1);
    expect(connected[0]).toEqual(sprites[0]);
  });
});

describe('Invidivual Sprites', () => {
  let map = new GameMap();
  let eventLoop = new EventLoop();

  beforeEach(() => {
    map = new GameMap();
    eventLoop = new EventLoop();
  });

  describe('of type Empty', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Empty, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type Player', () => {
    let sprite: Sprite;
    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Player, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type Text', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Text, x: 0, y: 0, colour: '0', text: 'Test text'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type Boot', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Boot, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type AndGate', async () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.AndGate, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should not provide power with 0 inputs powered', async () => {
      expect(sprite.powered).toEqual(false);
    });

    it('should not provide power with 1 input powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorLeft, colour: '1', x: 1000, y: 1000});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      injectPower(eventLoop, a);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
    });

    it('should provide power with 2 inputs powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorLeft, colour: '2', x: 1000, y: 1000});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      const b = newSprite(map, {type: Sprites.ConnectorLeft, colour: '3', x: 1000, y: 1000});
      eventLoop.sprites.push(b);
      b.connectOutputToInput(0, sprite, 1);
      injectPower(eventLoop, a);
      injectPower(eventLoop, b);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(true);
    });
  });

  describe('of type NotGate', async () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.NotGate, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', async () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should provide power when not powered', async () => {
      await eventLoop.tick();
      expect(sprite.powered).toEqual(true);
    });

    it('should not provide power when powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorLeft, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      injectPower(eventLoop, a);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(true);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
    });
  });

  describe('of type OrGate', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.OrGate, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should not provide power with 0 inputs powered', async () => {
      expect(sprite.powered).toEqual(false);
    });

    it('should provide power with 1 input powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorLeft, colour: '1', x: 1000, y: 1000});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      injectPower(eventLoop, a);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(true);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
    });

    it('should provide power with 2 inputs powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorLeft, colour: '2', x: 1000, y: 1000});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      const b = newSprite(map, {type: Sprites.ConnectorLeft, colour: '3', x: 1000, y: 1000});
      eventLoop.sprites.push(b);
      b.connectOutputToInput(0, sprite, 1);
      injectPower(eventLoop, a);
      injectPower(eventLoop, b);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(true);
    });
  });

  describe('of type Clacker', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Clacker, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type ConnectorLeft', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.ConnectorLeft, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should not provide power when not powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorLeft, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
    });

    it('should provide power when powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorLeft, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      injectPower(eventLoop, a);
      await eventLoop.tick();
      expect(a.powered).toEqual(true);
      expect(sprite.powered).toEqual(false);
      await eventLoop.tick();
      expect(a.powered).toEqual(false);
      expect(sprite.powered).toEqual(true);
    });

    it('should steadily propagate power', async () => {
      eventLoop.sprites.shift();
      const connectors = [];
      for (let i = 0; i < 4; i++) {
        connectors.push(newSprite(map, {type: Sprites.ConnectorLeft, x: 0, y: i * 100, colour: `${i}`}));
        eventLoop.sprites.push(connectors[i]);
      }
      for (let i = connectors.length - 2; i >= 0; i--) {
        connectors[i].connectOutputToInput(0, connectors[i + 1], 0);
      }
      injectPower(eventLoop, connectors[0]);

      while (eventLoop.currentTick < 5) {
        await eventLoop.tick();
        for (let i = 0; i < connectors.length; i++) {
          expect(connectors[i].powered).toEqual(eventLoop.currentTick === i + 1);
        }
      }
    });
  });

  describe('of type ConnectorRight', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.ConnectorRight, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should not provide power when not powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorRight, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
    });

    it('should provide power when powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorRight, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      injectPower(eventLoop, a);
      await eventLoop.tick();
      expect(a.powered).toEqual(true);
      expect(sprite.powered).toEqual(false);
      await eventLoop.tick();
      expect(a.powered).toEqual(false);
      expect(sprite.powered).toEqual(true);
    });

    it('should steadily propagate power', async () => {
      eventLoop.sprites.shift();
      const connectors = [];
      for (let i = 0; i < 4; i++) {
        connectors.push(newSprite(map, {type: Sprites.ConnectorRight, x: 0, y: i * 100, colour: `${i}`}));
        eventLoop.sprites.push(connectors[i]);
      }
      for (let i = connectors.length - 2; i >= 0; i--) {
        connectors[i].connectOutputToInput(0, connectors[i + 1], 0);
      }
      injectPower(eventLoop, connectors[0]);

      while (eventLoop.currentTick < 5) {
        await eventLoop.tick();
        for (let i = 0; i < connectors.length; i++) {
          expect(connectors[i].powered).toEqual(eventLoop.currentTick === i + 1);
        }
      }
    });
  });

  describe('of type ConnectorUp', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.ConnectorUp, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should not provide power when not powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorUp, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
    });

    it('should provide power when powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorUp, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      injectPower(eventLoop, a);
      await eventLoop.tick();
      expect(a.powered).toEqual(true);
      expect(sprite.powered).toEqual(false);
      await eventLoop.tick();
      expect(a.powered).toEqual(false);
      expect(sprite.powered).toEqual(true);
    });

    it('should steadily propagate power', async () => {
      eventLoop.sprites.shift();
      const connectors = [];
      for (let i = 0; i < 4; i++) {
        connectors.push(newSprite(map, {type: Sprites.ConnectorUp, x: 0, y: i * 100, colour: `${i}`}));
        eventLoop.sprites.push(connectors[i]);
      }
      for (let i = connectors.length - 2; i >= 0; i--) {
        connectors[i].connectOutputToInput(0, connectors[i + 1], 0);
      }
      injectPower(eventLoop, connectors[0]);

      while (eventLoop.currentTick < 5) {
        await eventLoop.tick();
        for (let i = 0; i < connectors.length; i++) {
          expect(connectors[i].powered).toEqual(eventLoop.currentTick === i + 1);
        }
      }
    });
  });

  describe('of type ConnectorDown', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.ConnectorDown, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should not provide power when not powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorDown, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
    });

    it('should provide power when powered', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorDown, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      a.connectOutputToInput(0, sprite, 0);
      injectPower(eventLoop, a);
      await eventLoop.tick();
      expect(a.powered).toEqual(true);
      expect(sprite.powered).toEqual(false);
      await eventLoop.tick();
      expect(a.powered).toEqual(false);
      expect(sprite.powered).toEqual(true);
    });

    it('should steadily propagate power', async () => {
      eventLoop.sprites.shift();
      const connectors = [];
      for (let i = 0; i < 4; i++) {
        connectors.push(newSprite(map, {type: Sprites.ConnectorDown, x: 0, y: i * 100, colour: `${i}`}));
        eventLoop.sprites.push(connectors[i]);
      }
      for (let i = connectors.length - 2; i >= 0; i--) {
        connectors[i].connectOutputToInput(0, connectors[i + 1], 0);
      }
      injectPower(eventLoop, connectors[0]);

      while (eventLoop.currentTick < 5) {
        await eventLoop.tick();
        for (let i = 0; i < connectors.length; i++) {
          expect(connectors[i].powered).toEqual(eventLoop.currentTick === i + 1);
        }
      }
    });
  });

  describe('of type OptionWall', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.OptionWall, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should keep power when powered', async () => {
      injectPower(eventLoop, sprite);
      for (let i = 0; i < 5; i++) {
        await eventLoop.tick();
        expect(sprite.powered).toEqual(true);
      }
    });

    it('should only have a single selected OptionWall per map', async () => {
      const otherMap = new GameMap();
      for (let i = 1; i < 10; i++) {
        const m = i < 5 ? map : otherMap;
        eventLoop.sprites.push(newSprite(m, {type: Sprites.OptionWall, x: 0, y: i * 40, colour: `${i}`}));
      }
      // Inject power into an OptionWall on this map.
      injectPower(eventLoop, eventLoop.sprites[1]);
      // Inject power into an OptionWall on a different map.
      injectPower(eventLoop, eventLoop.sprites[7]);
      await eventLoop.tick();
      expect(_.filter(eventLoop.sprites, (s: Sprite) => s.type === Sprites.OptionWall && s.map === map && s.powered)
                 .length)
          .toEqual(1);

      // Move the selected OptionWall on each map.
      injectPower(eventLoop, eventLoop.sprites[2]);
      injectPower(eventLoop, eventLoop.sprites[8]);
      await eventLoop.tick();
      expect(_.filter(eventLoop.sprites, (s: Sprite) => s.type === Sprites.OptionWall && s.map === map && s.powered)
                 .length)
          .toEqual(1);
    });
  });

  describe('of type Clock', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Clock, x: 0, y: 0, colour: '0'});
      eventLoop.sprites.push(sprite);
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should provide power to a ConnectorLeft every 8 ticks', async () => {
      const a = newSprite(map, {type: Sprites.ConnectorLeft, x: 0, y: 0, colour: '1'});
      eventLoop.sprites.push(a);
      sprite.connectOutputToInput(0, a, 0);
      let connectorPowered = 0;
      let clockPowered = 0;
      while (eventLoop.currentTick < 17) {
        await eventLoop.tick();
        // Expect power propagation to take a tick, not during the same tick.
        expect((sprite.powered === true && a.powered === false) || (sprite.powered === true && a.powered === false));
        if (a.powered) connectorPowered++;
        if (sprite.powered) clockPowered++;
      }
      // 16 frames means exactly 2 times that power was sent from the clock to the connector.
      expect(connectorPowered).toEqual(2);
      expect(clockPowered).toEqual(2);
    });
  });
});

function injectPower(eventLoop: EventLoop, sprite: Sprite) {
  eventLoop.queue(atTick(0), async (event: Event) => {
    sprite.power(eventLoop);
  });
}
