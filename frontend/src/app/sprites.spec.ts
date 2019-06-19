import {newSprite, Sprite, Sprites} from './sprites';

describe('Sprites', () => {
  it('should create new sprite from json', () => {
    const s = newSprite({type: Sprites.Player});
    expect(s.type).toEqual(Sprites.Player);
  });

  it('should create new sprite from a type', () => {
    const s = newSprite(Sprites.Player);
    expect(s.type).toEqual(Sprites.Player);
  });

  it('should define a bounding box', () => {
    const s = newSprite({type: Sprites.Wall, x: 10, y: 20});
    expect(s.boundingbox.topleft.x).toEqual(10);
    expect(s.boundingbox.topleft.y).toEqual(20);
    expect(s.boundingbox.width).toEqual(40);
    expect(s.boundingbox.height).toEqual(40);
    expect(s.boundingbox.bottomright.x).toEqual(50);
    expect(s.boundingbox.bottomright.y).toEqual(60);
  });

  it('should force text to be fixed', () => {
    const s = newSprite({type: Sprites.Text, x: 10, y: 20, fixed: false});
    expect(s.fixed).toEqual(true);
  });
});
