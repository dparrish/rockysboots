import {constants} from './constants/constants.module';
import {BoundingBox, Point} from './position';

const playerSprite = new Image();
playerSprite.src = '../assets/player.png';
const wallSprite = new Image();
wallSprite.src = '../assets/wall.png';
const bootSprite = new Image();
bootSprite.src = '../assets/boot.png';

const blockSize = constants.blockSize;

export enum Sprites {
  Empty,
  Player,
  Wall,
  Text,
  Boot,
  AndGate,
  NotGate,
  OrGate,
  ClackerUp,
  ClackerDown,
  ConnectorLeft,
  ConnectorRight,
  ConnectorUp,
  ConnectorDown,
  OptionWall,
}

export class Sprite {
  type: Sprites;
  text: string;
  x: number;
  y: number;
  colour: string;
  fixed: boolean = false;
  passable: boolean = true;

  lastPower: number;
  powerSpread: number;
  powerable: boolean = false;
  powered: boolean = false;
  inputs: Point[] = [];
  outputs: Point[] = [];

  constructor(json?: any) {
    if (json) this.fromJson(json);
  }

  get pos(): Point {
    return new Point(this.x, this.y);
  }

  get name(): string {
    return Sprites[this.type];
  }

  toString(): string {
    return `${this.colour} ${Sprites[this.type]}`;
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.x, this.y), blockSize, blockSize);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = this.colour;
    ctx.fillStyle = this.colour;
    ctx.lineWidth = 2;
    if (this.powered) ctx.filter = 'drop-shadow(0px 0px 10px red) drop-shadow(0px 0px 5px yellow)';
  }

  finishDraw(ctx: CanvasRenderingContext2D) {
    ctx.restore();
    if (constants.inEditor) {
      // Draw circles around inputs.
      for (const pos of this.inputs) {
        ctx.save();
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.arc(this.x + pos.x, this.y + pos.y, 10, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Draw circles around outputs.
      for (const pos of this.outputs) {
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x + pos.x, this.y + pos.y, 10, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Draw bounding box.
      ctx.save();
      ctx.strokeStyle = 'darkgray';
      const bb = this.boundingbox;
      ctx.strokeRect(bb.topleft.x, bb.topleft.y, bb.width, bb.height);
      ctx.restore();
    }
  }

  jsonFields = ['type', 'text', 'x', 'y', 'colour', 'powered', 'fixed']
  toJson(): object {
    const json = {};
    for (const field of this.jsonFields) {
      json[field] = this[field];
    }
    return json
  }

  fromJson(json: object): Sprite {
    for (const field of this.jsonFields) {
      if (json[field] !== undefined) this[field] = json[field];
    }
    return this;
  }
}

export function newSprite(src: Sprites|object): Sprite {
  if ((src as any).type) {
    return newSprite((src as any).type).fromJson(src as object);
  }
  switch (src) {
    case Sprites.AndGate:
      return new AndGate();
    case Sprites.Boot:
      return new Boot();
    case Sprites.ClackerDown:
      return new ClackerDown();
    case Sprites.ClackerUp:
      return new ClackerUp();
    case Sprites.ConnectorDown:
      return new ConnectorDown();
    case Sprites.ConnectorLeft:
      return new ConnectorLeft();
    case Sprites.ConnectorRight:
      return new ConnectorRight();
    case Sprites.ConnectorUp:
      return new ConnectorUp();
    case Sprites.NotGate:
      return new NotGate();
    case Sprites.OptionWall:
      return new OptionWall();
    case Sprites.OrGate:
      return new OrGate();
    case Sprites.Player:
      return new Player();
    case Sprites.Text:
      return new Text();
    case Sprites.Wall:
      return new Wall();
    default:
      return new Empty();
  }
}

export class Empty extends Sprite {
  constructor(json?: any) {
    super(json);
    this.colour = 'black';
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.fillRect(this.x, this.y, blockSize, blockSize);
    super.finishDraw(ctx);
  }
}

export class Player extends Sprite {
  constructor(json?: any) {
    super(json);
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.drawImage(playerSprite, this.x, this.y);
    super.finishDraw(ctx);
  }
}

export class Wall extends Sprite {
  constructor(json?: any) {
    super(json);
    this.passable = false;
    this.fixed = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.drawImage(wallSprite, this.x, this.y);
    super.finishDraw(ctx);
  }
}

export class OptionWall extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
    this.passable = false;
    this.fixed = true;
    this.inputs = [new Point(20, 20)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.colour;
    ctx.fillStyle = this.colour;
    ctx.fillRect(this.x, this.y, blockSize, blockSize);
    if (constants.inEditor) {
      ctx.textBaseline = 'top';
      ctx.font = '21px Apple';
      if (this.colour === 'white') {
        ctx.fillStyle = 'black';
      } else {
        ctx.fillStyle = 'white';
      }
      ctx.fillText('O', this.x + 10, this.y + 10);
    }
    super.finishDraw(ctx);
  }
}

export class Text extends Sprite {
  constructor(json?: any) {
    super(json);
    this.fixed = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.textBaseline = 'top';
    ctx.font = '21px Apple';
    ctx.fillText(this.text, this.x, this.y);
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.x, this.y), blockSize * 0.46 * this.text.length, blockSize / 2);
  }
}

export class Boot extends Sprite {
  constructor(json?: any) {
    super(json);
    this.inputs = [new Point(20, 20)];
    this.powerable = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.drawImage(bootSprite, this.x, this.y);
    super.finishDraw(ctx);
  }
}

export class AndGate extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
    this.inputs = [
      new Point(20, 10),
      new Point(20, 30),
    ];
    this.outputs = [new Point(-60, 20)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    // Top Connector
    _connector(ctx, this.x + h, this.y + 10, this.colour);
    ctx.fillRect(this.x, this.y + 9, h, 2);
    // Bottom Connector.
    _connector(ctx, this.x + h, this.y + blockSize - 10, this.colour);
    ctx.fillRect(this.x, this.y + blockSize - 10, h, 2);

    ctx.fillRect(this.x - h, this.y, h, 2);
    ctx.fillRect(this.x - h, this.y + blockSize - 2, h, 2);
    ctx.fillRect(this.x, this.y, 2, blockSize - 1);

    ctx.beginPath();
    ctx.arc(this.x - h, this.y + h, h - 1, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    // Draw arrow.
    ctx.fillRect(this.x - blockSize - blockSize / 2, this.y + h - 1, h, 2);
    ctx.beginPath();
    ctx.moveTo(this.x - (blockSize * 2) + h + 7, this.y + h - 8);
    ctx.lineTo(this.x - (blockSize * 2) + h, this.y + h);
    ctx.lineTo(this.x - (blockSize * 2) + h + 7, this.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.x - blockSize * 2, this.y), blockSize * 3, blockSize);
  }
}

export class NotGate extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
    this.inputs = [new Point(20, blockSize / 2)];
    this.outputs = [new Point(-60, 20)];
    this.passable = false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.x + h, this.y + h, this.colour);

    ctx.beginPath();
    ctx.arc(this.x - h - 7, this.y + h, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillRect(this.x, this.y + h - 1, h, 2);

    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 5);
    ctx.lineTo(this.x - blockSize + h, this.y + h);
    ctx.lineTo(this.x, this.y + blockSize - 5);
    ctx.closePath();
    ctx.stroke();

    ctx.fillRect(this.x - blockSize - blockSize / 2, this.y + h - 1, h + 7, 2);

    ctx.beginPath();
    ctx.moveTo(this.x - (blockSize * 2) + h + 7, this.y + h - 8);
    ctx.lineTo(this.x - (blockSize * 2) + h, this.y + h);
    ctx.lineTo(this.x - (blockSize * 2) + h + 7, this.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.x - blockSize * 2, this.y), blockSize * 3, blockSize);
  }
}

export class OrGate extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
    this.inputs = [
      new Point(20, 10),
      new Point(20, 30),
    ];

    this.outputs = [new Point(-60, 20)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    // Top Connector.
    _connector(ctx, this.x + h, this.y + 10, this.colour);
    ctx.fillRect(this.x, this.y + 9, h, 2);
    // Bottom Connector.
    _connector(ctx, this.x + h, this.y + blockSize - 10, this.colour);
    ctx.fillRect(this.x, this.y + blockSize - 10, h, 2);

    ctx.beginPath();
    ctx.arc(this.x + blockSize - 7, this.y + h + 1, blockSize - 6, Math.PI * 0.8, Math.PI * 1.2);
    ctx.stroke();

    // Draw ellipse arc.
    ctx.beginPath();
    let first = true;
    const cX = this.x + 5;
    const cY = this.y + h + 1;
    const radX = h - 1;
    const radY = blockSize;
    for (let i = 0.5 * Math.PI; i < 1.5 * Math.PI; i += 0.01) {
      const xPos = cX - (radX * Math.sin(i)) * Math.sin(0 * Math.PI) + (radY * Math.cos(i)) * Math.cos(0 * Math.PI);
      const yPos = cY + (radY * Math.cos(i)) * Math.sin(0 * Math.PI) + (radX * Math.sin(i)) * Math.cos(0 * Math.PI);
      if (first) {
        ctx.moveTo(xPos, yPos);
        first = false;
      } else {
        ctx.lineTo(xPos, yPos);
      }
    }
    ctx.stroke();

    // Draw arrow.
    ctx.fillRect(this.x - blockSize - blockSize / 2, this.y + h - 1, h + 5, 2);
    ctx.beginPath();
    ctx.moveTo(this.x - (blockSize * 2) + h + 7, this.y + h - 8);
    ctx.lineTo(this.x - (blockSize * 2) + h, this.y + h);
    ctx.lineTo(this.x - (blockSize * 2) + h + 7, this.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.x - blockSize * 2, this.y), blockSize * 3, blockSize);
  }
}

export class ClackerUp extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    if (constants.inEditor) {
      ctx.textBaseline = 'top';
      ctx.font = '10px Apple';
      ctx.fillText('CLKU', this.x + 3, this.y + 15);
    }
    super.finishDraw(ctx);
  }
}

export class ClackerDown extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    if (constants.inEditor) {
      ctx.textBaseline = 'top';
      ctx.font = '10px Apple';
      ctx.fillText('CLKD', this.x + 3, this.y + 15);
    }
    super.finishDraw(ctx);
  }
}

export class ConnectorLeft extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
    this.inputs = [new Point(20, 20)];
    this.outputs = [new Point(-20, 20)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.x + (blockSize / 2), this.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.x - blockSize / 2, this.y + (blockSize / 2) - 1, blockSize, 2);
    ctx.beginPath();
    ctx.moveTo(this.x - blockSize + h + 7, this.y + h - 8);
    ctx.lineTo(this.x - blockSize + h, this.y + h);
    ctx.lineTo(this.x - blockSize + h + 7, this.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.x - blockSize, this.y), 2 * blockSize, blockSize);
  }
}

export class ConnectorRight extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
    this.inputs = [new Point(20, 20)];
    this.outputs = [new Point(60, 20)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.x + (blockSize / 2), this.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.x + blockSize / 2, this.y + (blockSize / 2) - 1, blockSize, 2);
    ctx.beginPath();
    ctx.moveTo(this.x + blockSize + h - 7, this.y + h - 8);
    ctx.lineTo(this.x + blockSize + h, this.y + h);
    ctx.lineTo(this.x + blockSize + h - 7, this.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.x, this.y), 2 * blockSize, blockSize);
  }
}

export class ConnectorUp extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
    this.inputs = [new Point(20, 20)];
    this.outputs = [new Point(20, -20)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.x + (blockSize / 2), this.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.x + blockSize / 2 - 1, this.y - (blockSize / 2), 2, blockSize);
    ctx.beginPath();
    ctx.moveTo(this.x + (h - 8), this.y - h + 8);
    ctx.lineTo(this.x + h, this.y - blockSize + h);
    ctx.lineTo(this.x + (h + 8), this.y - h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.x, this.y - blockSize), blockSize, blockSize * 2);
  }
}

export class ConnectorDown extends Sprite {
  constructor(json?: any) {
    super(json);
    this.powerable = true;
    this.inputs = [new Point(20, 20)];
    this.outputs = [new Point(20, 60)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.x + (blockSize / 2), this.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.x + blockSize / 2 - 1, this.y + (blockSize / 2), 2, blockSize);
    ctx.beginPath();
    ctx.moveTo(this.x + (h - 8), this.y + blockSize + h - 8);
    ctx.lineTo(this.x + h, this.y + blockSize + h);
    ctx.lineTo(this.x + (h + 8), this.y + blockSize + h - 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.x, this.y), blockSize, blockSize * 2);
  }
}

function _connector(ctx: CanvasRenderingContext2D, x: number, y: number, colour: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}
