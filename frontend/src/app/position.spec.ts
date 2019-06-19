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
    console.log(`Checking intersecting bounding boxes ${a} and ${b}`);
    expect(a.intersects(b)).toBeTruthy();
  });

  it('should intersect an overlapping box near bottomright', () => {
    // Check near bottom-right.
    const a = new BoundingBox(new Point(100, 100), 120, 40);
    const b = new BoundingBox(new Point(180, 100), 40, 40);
    console.log(`Checking intersecting bounding boxes ${a} and ${b}`);
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
});
