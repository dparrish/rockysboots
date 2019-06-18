export class Point {
  constructor(public x: number, public y: number) {}

  add(pos: Point|number, y?: number) {
    if (pos instanceof Point) {
      return new Point(this.x + pos.x, this.y + pos.y);
    } else {
      return new Point(this.x + pos as number, this.y + y);
    }
  }
}

export class BoundingBox {
  constructor(public topleft: Point, public width: number, public height: number) {}

  get bottomright(): Point {
    return new Point(this.topleft.x + this.width, this.topleft.y + this.height);
  }

  intersects(other: BoundingBox): boolean {
    return (
        (Math.abs(this.topleft.x - other.topleft.x) * 2 < this.width + other.width) &&
        (Math.abs(this.topleft.y - other.topleft.y) * 2 < this.height + other.height));
  }
}
