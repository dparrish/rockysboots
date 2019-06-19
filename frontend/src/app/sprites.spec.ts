import {constants} from './constants/constants.module';
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

