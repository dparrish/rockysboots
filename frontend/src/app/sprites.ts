import {constants} from './constants/constants.module';
import {afterMs, atTick, Event, EventLoop} from './event-loop';
import {GameMap} from './game-map';
import {BoundingBox, Point} from './position';
import * as sprites from './sprites';

const playerSprite = new Image();
playerSprite.src = '../assets/player.png';
const wallSprite = new Image();
wallSprite.src = '../assets/wall.png';
const bootSprite = new Image();
bootSprite.src = '../assets/boot.png';

const blockSize = constants.blockSize;
const h = blockSize / 2;

function boundingbox(x: number, y: number, width: number, height: number): BoundingBox {
  return new BoundingBox(new Point(x, y), width, height);
}

export enum Sprites {
  Empty,
  Player,
  Wall,
  Text,
  Boot,
  AndGate,
  NotGate,
  OrGate,
  Clacker,
  ConnectorLeft,
  ConnectorRight,
  ConnectorUp,
  ConnectorDown,
  OptionWall,
  Clock,
}

export class Sprite {
  type: Sprites;
  text: string;
  pos: Point = new Point(0, 0);
  colour: string;
  fixed: boolean = false;
  passable: boolean = true;
  map: GameMap = null;

  powerable: boolean = false;
  powered: boolean = false;

  // Bounding box for each input, relative to the bounding box of the sprite.
  inputs: BoundingBox[] = [];
  // Bounding box for each output, relative to the bounding box of the sprite.
  outputs: BoundingBox[] = [];

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

  // Get all sprites where one of our outputs is connected to one of their inputs.
  connectedOutputs(sprites: Sprite[]): Sprite[] {
    const out: Sprite[] = [];
    for (const output of this.outputs) {
      for (const sprite of sprites) {
        if (sprite === this) continue;
        for (const input of sprite.inputs) {
          if (output.relativeTo(this.boundingbox).intersects(input.relativeTo(sprite.boundingbox))) {
            out.push(sprite);
          }
        }
      }
    }
    return out;
  }

  // Get all sprites where one of our inputs is connected to one of their outputs.
  connectedInputs(sprites: Sprite[]): Sprite[] {
    const out: Sprite[] = [];
    for (const input of this.inputs) {
      for (const sprite of sprites) {
        if (sprite === this) continue;
        for (const output of sprite.outputs) {
          if (output.relativeTo(sprite.boundingbox).intersects(input.relativeTo(this.boundingbox))) {
            out.push(sprite);
          }
        }
      }
    }
    return out;
  }

  get boundingbox(): BoundingBox {
    return boundingbox(this.pos.x, this.pos.y, blockSize, blockSize);
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
      // Draw bounding box.
      ctx.save();
      ctx.strokeStyle = 'darkgray';
      const bb = this.boundingbox;
      ctx.strokeRect(bb.topleft.x, bb.topleft.y, bb.width, bb.height);
      ctx.restore();

      // Draw inputs.
      for (const input of this.inputs) {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        input.relativeTo(this.boundingbox).draw(ctx);
      }

      // Draw outputs.
      for (const output of this.outputs) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        output.relativeTo(this.boundingbox).draw(ctx);
      }
    }
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

  // Called when the power state may change.
  // This should decide whether this sprite is now "powered".
  power(eventLoop: EventLoop) {
    if (!this.powerable) return;
    this.powered = true;
    eventLoop.queue(atTick(eventLoop.currentTick + 1), async (event: Event) => {
      for (const sprite of this.connectedOutputs(this.map.sprites)) {
        sprite.power(eventLoop);
      }
      this.powered = false;
    });
  }

  // Called every game tick, now is the time to update the internal state.
  tick(eventLoop: EventLoop) {}
}

export function newSprite(map: GameMap, src: Sprites|object): Sprite {
  let s: Sprite = null;
  if ((src as any).type !== undefined) {
    s = new (sprites as any)[Sprites[(src as any).type]](src);
  } else {
    s = new (sprites as any)[Sprites[src as Sprites]]();
  }
  s.map = map;
  return s;
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
    this.outputs = [
      boundingbox(0, 0, 40, 40),
    ];
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
    this.powered = false;
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
    this.inputs = [
      boundingbox(0, 0, 40, 40),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
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
    return boundingbox(this.pos.x, this.pos.y, blockSize * 0.46 * this.text.length, blockSize / 2);
  }
}

export class Boot extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.Boot;
    this.inputs = [
      boundingbox(0, 0, 40, 40),
    ];
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
      boundingbox(2 * blockSize + 10, 1, 18, 18),
      boundingbox(2 * blockSize + 10, 21, 18, 18),
    ];
    this.outputs = [
      boundingbox(10, 10, 18, 18),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    // Top Connector
    connector(ctx, this.pos.x + h, this.pos.y + 10, this.colour);
    ctx.fillRect(this.pos.x, this.pos.y + 9, h, 2);
    // Bottom Connector.
    connector(ctx, this.pos.x + h, this.pos.y + blockSize - 10, this.colour);
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
    return boundingbox(this.pos.x - blockSize * 2, this.pos.y, blockSize * 3, blockSize);
  }
}

export class NotGate extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.NotGate;
    this.powerable = true;
    this.inputs = [
      boundingbox(2 * blockSize + 10, 10, 18, 18),
    ];
    this.outputs = [
      boundingbox(10, 10, 18, 18),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    connector(ctx, this.pos.x + h, this.pos.y + h, this.colour);

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
    return boundingbox(this.pos.x - blockSize * 2, this.pos.y, blockSize * 3, blockSize);
  }

  power(eventLoop: EventLoop) {
    this.powered = true;
    for (const sprite of this.connectedInputs(this.map.sprites)) {
      if (sprite.powered) this.powered = false;
      break;
    }
    if (this.powered) {
      super.power(eventLoop);
    }
  }

  tick(eventLoop: EventLoop) {
    this.power(eventLoop);
  }
}

export class OrGate extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.OrGate;
    this.powerable = true;
    this.inputs = [
      boundingbox(2 * blockSize + 10, 1, 18, 18),
      boundingbox(2 * blockSize + 10, 21, 18, 18),
    ];
    this.outputs = [
      boundingbox(10, 10, 18, 18),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    // Top Connector.
    connector(ctx, this.pos.x + h, this.pos.y + 10, this.colour);
    ctx.fillRect(this.pos.x, this.pos.y + 9, h, 2);
    // Bottom Connector.
    connector(ctx, this.pos.x + h, this.pos.y + blockSize - 10, this.colour);
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
    return boundingbox(this.pos.x - blockSize * 2, this.pos.y, blockSize * 3, blockSize);
  }
}

export class Clacker extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.Clacker;
    this.powerable = true;
    this.inputs = [
      boundingbox(0, 0, 40, 40),
    ];
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

export class ConnectorLeft extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ConnectorLeft;
    this.powerable = true;
    this.inputs = [
      boundingbox(blockSize + 10, 10, 18, 18),
    ];
    this.outputs = [
      boundingbox(10, 10, 18, 18),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    connector(ctx, this.pos.x + (blockSize / 2), this.pos.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.pos.x - blockSize / 2, this.pos.y + (blockSize / 2) - 1, blockSize, 2);
    ctx.beginPath();
    ctx.moveTo(this.pos.x - blockSize + h + 7, this.pos.y + h - 8);
    ctx.lineTo(this.pos.x - blockSize + h, this.pos.y + h);
    ctx.lineTo(this.pos.x - blockSize + h + 7, this.pos.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return boundingbox(this.pos.x - blockSize, this.pos.y, 2 * blockSize, blockSize);
  }
}

export class ConnectorRight extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ConnectorRight;
    this.powerable = true;
    this.inputs = [
      boundingbox(10, 10, 18, 18),
    ];
    this.outputs = [
      boundingbox(blockSize + 10, 10, 18, 18),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    connector(ctx, this.pos.x + (blockSize / 2), this.pos.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.pos.x + blockSize / 2, this.pos.y + (blockSize / 2) - 1, blockSize, 2);
    ctx.beginPath();
    ctx.moveTo(this.pos.x + blockSize + h - 7, this.pos.y + h - 8);
    ctx.lineTo(this.pos.x + blockSize + h, this.pos.y + h);
    ctx.lineTo(this.pos.x + blockSize + h - 7, this.pos.y + h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return boundingbox(this.pos.x, this.pos.y, 2 * blockSize, blockSize);
  }
}

export class ConnectorUp extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ConnectorUp;
    this.powerable = true;
    this.inputs = [
      boundingbox(10, blockSize + 10, 18, 18),
    ];
    this.outputs = [
      boundingbox(10, 10, 18, 18),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    connector(ctx, this.pos.x + (blockSize / 2), this.pos.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.pos.x + blockSize / 2 - 1, this.pos.y - (blockSize / 2), 2, blockSize);
    ctx.beginPath();
    ctx.moveTo(this.pos.x + (h - 8), this.pos.y - h + 8);
    ctx.lineTo(this.pos.x + h, this.pos.y - blockSize + h);
    ctx.lineTo(this.pos.x + (h + 8), this.pos.y - h + 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return boundingbox(this.pos.x, this.pos.y - blockSize, blockSize, blockSize * 2);
  }
}

export class ConnectorDown extends Sprite {
  constructor(json?: any) {
    super(json);
    this.type = Sprites.ConnectorDown;
    this.powerable = true;
    this.inputs = [
      boundingbox(10, 10, 18, 18),
    ];
    this.outputs = [
      boundingbox(10, blockSize + 10, 18, 18),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    connector(ctx, this.pos.x + (blockSize / 2), this.pos.y + (blockSize / 2), this.colour);
    ctx.fillRect(this.pos.x + blockSize / 2 - 1, this.pos.y + (blockSize / 2), 2, blockSize);
    ctx.beginPath();
    ctx.moveTo(this.pos.x + (h - 8), this.pos.y + blockSize + h - 8);
    ctx.lineTo(this.pos.x + h, this.pos.y + blockSize + h);
    ctx.lineTo(this.pos.x + (h + 8), this.pos.y + blockSize + h - 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return boundingbox(this.pos.x, this.pos.y, blockSize, blockSize * 2);
  }
}

export class Clock extends Sprite {
  private frame: number = 0;

  constructor(json?: any) {
    super(json);
    this.type = Sprites.Clock;
    this.powerable = false;
    this.powered = false;
    this.inputs = [];
    this.outputs = [
      boundingbox(10, blockSize + 10, 18, 18),
    ];
  }

  tick(eventLoop: EventLoop) {
    this.frame = (this.frame + 1) % 8;
    if (this.frame === 0) {
      this.powered = true;
      eventLoop.queue(atTick(eventLoop.currentTick + 1), async (event: Event) => {
        for (const sprite of this.connectedOutputs(this.map.sprites)) {
          sprite.power(eventLoop);
        }
      });
    } else {
      this.powered = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);

    const cx = this.pos.x + h;
    const cy = this.pos.y + h;

    // Draw the hands greyed out.
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#333333';
    // 6
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + blockSize);
    // 7:30
    ctx.moveTo(cx, cy);
    ctx.lineTo(this.pos.x + 6, this.pos.y + blockSize - 6);
    // 9
    ctx.moveTo(cx, cy);
    ctx.lineTo(this.pos.x, cy);
    // 10:30
    ctx.moveTo(cx, cy);
    ctx.lineTo(this.pos.x + 6, this.pos.y + 6);
    // 12
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, this.pos.y);
    // 1:30
    ctx.moveTo(cx, cy);
    ctx.lineTo(this.pos.x + blockSize - 6, this.pos.y + 6);
    // 3
    ctx.moveTo(cx, cy);
    ctx.lineTo(this.pos.x + blockSize, cy);
    // 4:30
    ctx.moveTo(cx, cy);
    ctx.lineTo(this.pos.x + blockSize - 6, this.pos.y + blockSize - 6);

    ctx.stroke();

    // Draw the face.
    ctx.beginPath();
    ctx.arc(cx, cy, h, 0, Math.PI * 2);
    ctx.strokeStyle = this.colour;
    ctx.fillStyle = this.colour;
    ctx.lineWidth = 2;
    ctx.stroke();

    connector(ctx, cx, cy, this.colour);

    // Draw the hand at the right angle.
    ctx.moveTo(cx, cy);
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.colour;

    switch (this.frame) {
      case 0:
        // 6
        ctx.lineTo(cx, cy + blockSize);
        break;
      case 1:
        // 7:30
        ctx.lineTo(this.pos.x + 6, this.pos.y + blockSize - 6);
        break;
      case 2:
        // 9
        ctx.lineTo(this.pos.x, cy);
        break;
      case 3:
        // 10:30
        ctx.lineTo(this.pos.x + 6, this.pos.y + 6);
        break;
      case 4:
        // 12
        ctx.lineTo(cx, this.pos.y);
        break;
      case 5:
        // 1:30
        ctx.lineTo(this.pos.x + blockSize - 6, this.pos.y + 6);
        break;
      case 6:
        // 3
        ctx.lineTo(this.pos.x + blockSize, cy);
        break;
      case 7:
        // 4:30
        ctx.lineTo(this.pos.x + blockSize - 6, this.pos.y + blockSize - 6);
        break;
    }
    ctx.stroke();

    // Output
    ctx.beginPath();
    ctx.moveTo(this.pos.x + (h - 8), this.pos.y + blockSize + h - 8);
    ctx.lineTo(this.pos.x + h, this.pos.y + blockSize + h);
    ctx.lineTo(this.pos.x + (h + 8), this.pos.y + blockSize + h - 8);
    ctx.stroke();
    super.finishDraw(ctx);
  }

  get boundingbox(): BoundingBox {
    return boundingbox(this.pos.x, this.pos.y, blockSize, blockSize * 2);
  }
}

function connector(ctx: CanvasRenderingContext2D, x: number, y: number, colour: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

export function spritesWithInputAt(pos: BoundingBox, sprites: Sprite[]): Sprite[] {
  const out: Sprite[] = [];
  for (const sprite of sprites) {
    if (!sprite.powerable) continue;
    for (const input of sprite.inputs) {
      if (pos.intersects(input.relativeTo(sprite.boundingbox))) {
        out.push(sprite);
      }
    }
  }
  return out;
}
