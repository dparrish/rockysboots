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
  pos: Point = new Point(0, 0);
  colour: string;
  fixed: boolean = false;
  passable: boolean = true;

  lastPower: number;
  powerSpread: number;
  powerable: boolean = false;
  powered: boolean = false;
  inputs: Point[] = [];
  outputs: Point[] = [];

  jsonFields = ['type', 'text', 'colour', 'powered', 'fixed'];

  constructor(json?: any) {
    if (json) this.fromJson(json);
  }

  get name(): string {
    return Sprites[this.type];
  }

  toString(): string {
    return `${this.colour} ${Sprites[this.type]}`;
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.pos.x, this.pos.y), blockSize, blockSize);
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
        ctx.arc(this.pos.x + pos.x, this.pos.y + pos.y, 10, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Draw circles around outputs.
      for (const pos of this.outputs) {
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.pos.x + pos.x, this.pos.y + pos.y, 10, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw bounding box.
    ctx.save();
    ctx.strokeStyle = 'darkgray';
    const bb = this.boundingbox;
    ctx.strokeRect(bb.topleft.x, bb.topleft.y, bb.width, bb.height);
    ctx.restore();
  }

  toJson(): object {
    const json = {};
    for (const field of this.jsonFields) {
      json[field] = this[field];
    }
    (json as any).x = this.pos.x;
    (json as any).y = this.pos.y;
    return json;
  }

  fromJson(json: object): Sprite {
    for (const field of this.jsonFields) {
      if (json[field] !== undefined) (this as any)[field] = json[field];
    }
    this.pos.x = (json as any).x;
    this.pos.y = (json as any).y;
    return this;
  }
}

export function newSprite(src: Sprites|object): Sprite {
  if ((src as any).type) {
    return newSprite((src as any).type).fromJson(src as object);
  }
  console.log(`Creating new ${src}`);
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
      console.log(`Invalid sprite type ${src}`);
      return new Empty();
  }
}

export class Empty extends Sprite {
  constructor(json?: any) {
    super(json);
    this.colour = 'black';
    this.type = Sprites.Empty;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.fillRect(this.pos.x, this.pos.y, blockSize, blockSize);
    super.finishDraw(ctx);
  }
}

export class Player extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.Player;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.drawImage(playerSprite, this.pos.x, this.pos.y);
    super.finishDraw(ctx);
  }
}

export class Wall extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.Wall;
    this.passable = false;
    this.fixed = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.drawImage(wallSprite, this.pos.x, this.pos.y);
    super.finishDraw(ctx);
  }
}

export class OptionWall extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.OptionWall;
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
    ctx.fillRect(this.pos.x, this.pos.y, blockSize, blockSize);
    if (constants.inEditor) {
      ctx.textBaseline = 'top';
      ctx.font = '21px Apple';
      if (this.colour === 'white') {
        ctx.fillStyle = 'black';
      } else {
        ctx.fillStyle = 'white';
      }
      ctx.fillText('O', this.pos.x + 10, this.pos.y + 10);
    }
    super.finishDraw(ctx);
  }
}

export class Text extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.Text;
    this.fixed = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.textBaseline = 'top';
    ctx.font = '21px Apple';
    ctx.fillText(this.text, this.pos.x, this.pos.y);
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.pos.x, this.pos.y), blockSize * 0.46 * this.text.length, blockSize / 2);
  }
}

export class Boot extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.Boot;
    this.inputs = [new Point(20, 20)];
    this.powerable = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.drawImage(bootSprite, this.pos.x, this.pos.y);
    super.finishDraw(ctx);
  }
}

export class AndGate extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.AndGate;
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
    _connector(ctx, this.pos.x + h, this.pos.y + 10, this.colour);
    ctx.fillRect(this.pos.x, this.pos.y + 9, h, 2);
    // Bottom Connector.
    _connector(ctx, this.pos.x + h, this.pos.y + blockSize - 10, this.colour);
    ctx.fillRect(this.pos.x, this.pos.y + blockSize - 10, h, 2);

    ctx.fillRect(this.pos.x - h, this.pos.y, h, 2);
    ctx.fillRect(this.pos.x - h, this.pos.y + blockSize - 2, h, 2);
    ctx.fillRect(this.pos.x, this.pos.y, 2, blockSize - 1);

    ctx.beginPath();
    ctx.arc(this.pos.x - h, this.pos.y + h, h - 1, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    // Draw arrow.
    ctx.fillRect(this.pos.x - blockSize - blockSize / 2, this.pos.y + h - 1, h, 2);
    ctx.beginPath();
    ctx.moveTo(this.pos.x - (blockSize * 2) + h + 7, this.pos.y + h - 8);
    ctx.lineTo(this.pos.x - (blockSize * 2) + h, this.pos.y + h);
    ctx.lineTo(this.pos.x - (blockSize * 2) + h + 7, this.pos.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.pos.x - blockSize * 2, this.pos.y), blockSize * 3, blockSize);
  }
}

export class NotGate extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.NotGate;
    this.powerable = true;
    this.inputs = [new Point(20, blockSize / 2)];
    this.outputs = [new Point(-60, 20)];
    this.passable = false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.pos.x + h, this.pos.y + h, this.colour);

    ctx.beginPath();
    ctx.arc(this.pos.x - h - 7, this.pos.y + h, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillRect(this.pos.x, this.pos.y + h - 1, h, 2);

    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y + 5);
    ctx.lineTo(this.pos.x - blockSize + h, this.pos.y + h);
    ctx.lineTo(this.pos.x, this.pos.y + blockSize - 5);
    ctx.closePath();
    ctx.stroke();

    ctx.fillRect(this.pos.x - blockSize - blockSize / 2, this.pos.y + h - 1, h + 7, 2);

    ctx.beginPath();
    ctx.moveTo(this.pos.x - (blockSize * 2) + h + 7, this.pos.y + h - 8);
    ctx.lineTo(this.pos.x - (blockSize * 2) + h, this.pos.y + h);
    ctx.lineTo(this.pos.x - (blockSize * 2) + h + 7, this.pos.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.pos.x - blockSize * 2 + 1, this.pos.y), blockSize * 3, blockSize);
  }
}

export class OrGate extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.OrGate;
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
    _connector(ctx, this.pos.x + h, this.pos.y + 10, this.colour);
    ctx.fillRect(this.pos.x, this.pos.y + 9, h, 2);
    // Bottom Connector.
    _connector(ctx, this.pos.x + h, this.pos.y + blockSize - 10, this.colour);
    ctx.fillRect(this.pos.x, this.pos.y + blockSize - 10, h, 2);

    ctx.beginPath();
    ctx.arc(this.pos.x + blockSize - 7, this.pos.y + h + 1, blockSize - 6, Math.PI * 0.8, Math.PI * 1.2);
    ctx.stroke();

    // Draw ellipse arc.
    ctx.beginPath();
    let first = true;
    const cX = this.pos.x + 5;
    const cY = this.pos.y + h + 1;
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
    ctx.fillRect(this.pos.x - blockSize - blockSize / 2, this.pos.y + h - 1, h + 5, 2);
    ctx.beginPath();
    ctx.moveTo(this.pos.x - (blockSize * 2) + h + 7, this.pos.y + h - 8);
    ctx.lineTo(this.pos.x - (blockSize * 2) + h, this.pos.y + h);
    ctx.lineTo(this.pos.x - (blockSize * 2) + h + 7, this.pos.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.pos.x - blockSize * 2, this.pos.y), blockSize * 3, blockSize);
  }
}

export class ClackerUp extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ClackerUp;
    this.powerable = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    if (constants.inEditor) {
      ctx.textBaseline = 'top';
      ctx.font = '10px Apple';
      ctx.fillText('CLKU', this.pos.x + 3, this.pos.y + 15);
    }
    super.finishDraw(ctx);
  }
}

export class ClackerDown extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ClackerDown;
    this.powerable = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    if (constants.inEditor) {
      ctx.textBaseline = 'top';
      ctx.font = '10px Apple';
      ctx.fillText('CLKD', this.pos.x + 3, this.pos.y + 15);
    }
    super.finishDraw(ctx);
  }
}

export class ConnectorLeft extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ConnectorLeft;
    this.powerable = true;
    this.inputs = [new Point(20, 20)];
    this.outputs = [new Point(-20, 20)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.pos.x + (blockSize / 2), this.pos.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.pos.x - blockSize / 2, this.pos.y + (blockSize / 2) - 1, blockSize, 2);
    ctx.beginPath();
    ctx.moveTo(this.pos.x - blockSize + h + 7, this.pos.y + h - 8);
    ctx.lineTo(this.pos.x - blockSize + h, this.pos.y + h);
    ctx.lineTo(this.pos.x - blockSize + h + 7, this.pos.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.pos.x - blockSize, this.pos.y), 2 * blockSize, blockSize);
  }
}

export class ConnectorRight extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ConnectorRight;
    this.powerable = true;
    this.inputs = [new Point(20, 20)];
    this.outputs = [new Point(60, 20)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.pos.x + (blockSize / 2), this.pos.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.pos.x + blockSize / 2, this.pos.y + (blockSize / 2) - 1, blockSize, 2);
    ctx.beginPath();
    ctx.moveTo(this.pos.x + blockSize + h - 7, this.pos.y + h - 8);
    ctx.lineTo(this.pos.x + blockSize + h, this.pos.y + h);
    ctx.lineTo(this.pos.x + blockSize + h - 7, this.pos.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.pos.x, this.pos.y), 2 * blockSize, blockSize);
  }
}

export class ConnectorUp extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ConnectorUp;
    this.powerable = true;
    this.inputs = [new Point(20, 20)];
    this.outputs = [new Point(20, -20)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.pos.x + (blockSize / 2), this.pos.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.pos.x + blockSize / 2 - 1, this.pos.y - (blockSize / 2), 2, blockSize);
    ctx.beginPath();
    ctx.moveTo(this.pos.x + (h - 8), this.pos.y - h + 8);
    ctx.lineTo(this.pos.x + h, this.pos.y - blockSize + h);
    ctx.lineTo(this.pos.x + (h + 8), this.pos.y - h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.pos.x, this.pos.y - blockSize), blockSize, blockSize * 2);
  }
}

export class ConnectorDown extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ConnectorDown;
    this.powerable = true;
    this.inputs = [new Point(20, 20)];
    this.outputs = [new Point(20, 60)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    const h = blockSize / 2;
    _connector(ctx, this.pos.x + (blockSize / 2), this.pos.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.pos.x + blockSize / 2 - 1, this.pos.y + (blockSize / 2), 2, blockSize);
    ctx.beginPath();
    ctx.moveTo(this.pos.x + (h - 8), this.pos.y + blockSize + h - 8);
    ctx.lineTo(this.pos.x + h, this.pos.y + blockSize + h);
    ctx.lineTo(this.pos.x + (h + 8), this.pos.y + blockSize + h - 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return new BoundingBox(new Point(this.pos.x, this.pos.y), blockSize, blockSize * 2);
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
