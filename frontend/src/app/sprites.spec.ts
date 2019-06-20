import {constants} from './constants/constants.module';
import {EventLoop} from './event';
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
      sprite = newSprite(map, {type: Sprites.Empty, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type Player', () => {
    let sprite: Sprite;
    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Player, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type Text', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Text, x: 0, y: 0, text: 'Test text'});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type Boot', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Boot, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type AndGate', async () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.AndGate, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type NotGate', async () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.NotGate, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', async () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });

    it('should provide power when not powered', async () => {
      expect(sprite.powered).toEqual(true);
    });

    it('should not provide power when powered', async () => {
      eventLoop.sprites.push(newSprite(map, {type: Sprites.ConnectorLeft, x: 40, y: 10, powered: true}));
      await eventLoop.tick();
      expect(sprite.powered).toEqual(false);
    });
  });

  describe('of type OrGate', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.OrGate, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type Clacker', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Clacker, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type ConnectorLeft', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.ConnectorLeft, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type ConnectorRight', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.ConnectorRight, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type ConnectorUp', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.ConnectorUp, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type ConnectorDown', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.ConnectorDown, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type OptionWall', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.OptionWall, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });


    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });

  describe('of type Clock', () => {
    let sprite: Sprite;

    beforeEach(async () => {
      sprite = newSprite(map, {type: Sprites.Clock, x: 0, y: 0});
      eventLoop.sprites.push(sprite);
      await eventLoop.tick();
    });

    it('should have a valid bounding box', () => {
      expect(sprite.boundingbox.width).toBeGreaterThan(0);
      expect(sprite.boundingbox.height).toBeGreaterThan(0);
    });
  });
});
