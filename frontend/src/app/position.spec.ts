import {BoundingBox, Point} from './position';

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
    expect(p.y).toEqual(30);
  });

  it('should add x and y', () => {
    let p = new Point(10, 15);
    p = p.add(10, 15);
    expect(p.x).toEqual(20);
    expect(p.y).toEqual(30);
  });

  it('should subtract a point', () => {
    let p = new Point(30, 35);
    p = p.sub(new Point(10, 20));
    expect(p.x).toEqual(20);
    expect(p.y).toEqual(15);
  });

  it('should subtract x and y', () => {
    let p = new Point(30, 35);
    p = p.sub(10, 20);
    expect(p.x).toEqual(20);
    expect(p.y).toEqual(15);
  });
});

describe('BoundingBox', () => {
  it('should create an instance', () => {
    const a = new BoundingBox(new Point(100, 100), 40, 40);
    expect(a).toBeTruthy();
  });

  it('should intersect an overlapping box near topleft', () => {
    // Check near top-left.
    const a = new BoundingBox(new Point(100, 100), 120, 40);
    const b = new BoundingBox(new Point(110, 110), 40, 40);
    expect(a.intersects(b)).toBeTruthy();
  });

  it('should intersect an overlapping box near bottomright', () => {
    // Check near bottom-right.
    const a = new BoundingBox(new Point(100, 100), 120, 40);
    const b = new BoundingBox(new Point(180, 100), 40, 40);
    expect(a.intersects(b)).toBeTruthy();
  });

  it('should not intersect a touching box', () => {
    const a = new BoundingBox(new Point(100, 100), 120, 40);
    const b = new BoundingBox(new Point(140, 140), 40, 40);
    expect(a.intersects(b)).toBeFalsy();
  });

  it('should not intersect a distant box', () => {
    const a = new BoundingBox(new Point(100, 100), 120, 40);
    const b = new BoundingBox(new Point(1000, 1000), 40, 40);
    expect(a.intersects(b)).toBeFalsy();
  });

  it('should add a position', () => {
    const a = new BoundingBox(new Point(100, 100), 120, 40);
    const b = a.add(new Point(10, 20));
    expect(b.topleft.x).toEqual(100 + 10);
    expect(b.topleft.y).toEqual(100 + 20);
    expect(b.bottomright.x).toEqual(100 + 120 + 10);
    expect(b.bottomright.y).toEqual(100 + 40 + 20);
  });

  it('should relativeTo', () => {
    const a = new BoundingBox(new Point(100, 100), 120, 40);
    const b = new BoundingBox(new Point(10, 20), 10, 10);
    const c = a.relativeTo(b);
    // Hasn't resized.
    expect(c.width).toEqual(120);
    expect(c.height).toEqual(40);
    // Output is moved.
    expect(c.topleft.x).toEqual(100 + 10);
    expect(c.topleft.y).toEqual(100 + 20);
    expect(c.bottomright.x).toEqual(100 + 120 + 10);
    expect(c.bottomright.y).toEqual(100 + 40 + 20);
    // Original hasn't resized or moved.
    expect(a.topleft.x).toEqual(100);
    expect(a.topleft.y).toEqual(100);
    expect(a.bottomright.x).toEqual(100 + 120);
    expect(a.bottomright.y).toEqual(100 + 40);
  });
});
