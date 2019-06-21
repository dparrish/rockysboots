export class Point {
  constructor(public x: number, public y: number) {}

  add(pos: Point|number, y?: number) {
    if (pos instanceof Point) {
      return new Point(this.x + pos.x, this.y + pos.y);
    } else {
      return new Point(this.x + pos as number, this.y + y);
    }
  }

  sub(pos: Point|number, y?: number) {
    if (pos instanceof Point) {
      return new Point(this.x - pos.x, this.y - pos.y);
    } else {
      return new Point(this.x - pos as number, this.y - y);
    }
  }

  equals(pos: Point) {
    return pos.x === this.x && pos.y === this.y;
  }

  toString(): string {
    return `${this.x},${this.y}`;
  }
}

export class BoundingBox {
  constructor(public topleft: Point, public width: number, public height: number) {}

  get bottomright(): Point {
    return new Point(this.topleft.x + this.width, this.topleft.y + this.height);
  }

  add(distance: Point): BoundingBox {
    return new BoundingBox(this.topleft.add(distance), this.width, this.height);
  }

  relativeTo(box: BoundingBox): BoundingBox {
    return new BoundingBox(this.topleft.add(box.topleft), this.width, this.height);
  }

  intersects(other: BoundingBox): boolean {
    return (
        this.topleft.x < other.topleft.x + other.width && this.topleft.x + this.width > other.topleft.x &&
        this.topleft.y < other.topleft.y + other.height && this.topleft.y + this.height > other.topleft.y);
  }

  toString(): string {
    return `${this.topleft} - ${this.bottomright}`;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeRect(this.topleft.x, this.topleft.y, this.width, this.height);
    ctx.restore();
  }
}
