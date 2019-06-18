import {Point} from './position';

describe('Point', () => {
  it('should create an instance', () => {
    const p = new Point(10, 15);
    expect(p).toBeTruthy();
    expect(p.x).toEqual(10);
    expect(p.y).toEqual(15);
  });

  it('should add a point', () => {
    let p = new Point(10, 15);
    p = p.add(new Point(10, 15));
    expect(p.x).toEqual(20);
    expect(p.y).toEqual(20);
  });

  it('should add x and y', () => {
    let p = new Point(10, 15);
    p = p.add(10, 15);
    expect(p.x).toEqual(20);
    expect(p.y).toEqual(20);
  });
});
