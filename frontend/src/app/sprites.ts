import {constants} from './constants/constants.module';

const playerSprite = new Image();
playerSprite.src = '../assets/player.png';
const wallSprite = new Image();
wallSprite.src = '../assets/wall.png';
const bootSprite = new Image();
bootSprite.src = '../assets/boot.png';

const blockSize = constants.blockSize;
const inEditor = constants.inEditor;

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

export interface Sprite {
  type: Sprites;
  text?: string;
  x: number;
  y: number;
  colour?: string;
  powered?: boolean;
  fixed?: boolean;
  lastPower?: number;
  powerSpread?: number;
}

export function DrawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite) {
  const h = blockSize / 2;
  ctx.lineWidth = 2;
  ctx.strokeStyle = sprite.colour;
  ctx.fillStyle = sprite.colour;
  let powered = sprite.powered;
  const x = sprite.x;
  const y = sprite.y;

  ctx.save();
  if (sprite.type === Sprites.Wall) {
    powered = false;
  }
  if (sprite.type === Sprites.Player || sprite.type == Sprites.Empty) {
    powered = false;
  }
  if (powered) {
    ctx.filter = 'drop-shadow(0px 0px 10px red) drop-shadow(0px 0px 5px yellow) ';
  }

  switch (Sprites[Sprites[sprite.type]]) {
    case Sprites.Empty:
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'black';
      ctx.fillRect(x, y, blockSize, blockSize);
      break;

    case Sprites.Text:
      ctx.textBaseline = 'top';
      ctx.font = '21px Apple';
      ctx.fillText(sprite.text, x, y);
      break;

    case Sprites.Player:
      ctx.drawImage(playerSprite, x, y);
      break;

    case Sprites.Wall:
      ctx.drawImage(wallSprite, x, y);
      // ctx.fillRect(x, y, blockSize, blockSize);
      break;

    case Sprites.Boot:
      ctx.drawImage(bootSprite, x, y);
      break;

    case Sprites.AndGate:
      _spriteConnector(ctx, x + h, y + 7, sprite.colour);
      ctx.fillRect(x, y + 5, h, 2);
      _spriteConnector(ctx, x + h, y + blockSize - 7, sprite.colour);
      ctx.fillRect(x, y + blockSize - 7, h, 2);

      ctx.fillRect(x - h, y, h, 2);
      ctx.fillRect(x - h, y + blockSize, h, 2);
      ctx.fillRect(x, y, 2, blockSize + 2)

      ctx.beginPath();
      ctx.arc(x - h, y + h + 1, h, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();

      // Draw arrow.
      ctx.fillRect(x - blockSize - blockSize / 2, y + h - 1, h, 2);
      ctx.beginPath();
      ctx.moveTo(x - (blockSize * 2) + h + 7, y + h - 8);
      ctx.lineTo(x - (blockSize * 2) + h, y + h);
      ctx.lineTo(x - (blockSize * 2) + h + 7, y + h + 8);
      ctx.stroke();
      break;

    case Sprites.NotGate:
      _spriteConnector(ctx, x + h, y + h, sprite.colour);

      ctx.beginPath();
      ctx.arc(x - h - 7, y + h, 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillRect(x, y + h - 1, h, 2);

      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x - blockSize + h, y + h);
      ctx.lineTo(x, y + blockSize - 5);
      ctx.closePath();
      ctx.stroke();

      ctx.fillRect(x - blockSize - blockSize / 2, y + h - 1, h + 7, 2);

      ctx.beginPath();
      ctx.moveTo(x - (blockSize * 2) + h + 7, y + h - 8);
      ctx.lineTo(x - (blockSize * 2) + h, y + h);
      ctx.lineTo(x - (blockSize * 2) + h + 7, y + h + 8);
      ctx.stroke();

      break;
    case Sprites.OrGate:
      _spriteConnector(ctx, x + h, y + 7, sprite.colour);
      ctx.fillRect(x, y + 5, h, 2);
      _spriteConnector(ctx, x + h, y + blockSize - 7, sprite.colour);
      ctx.fillRect(x, y + blockSize - 7, h, 2);

      ctx.beginPath();
      ctx.arc(x + blockSize - 2, y + h + 1, blockSize, Math.PI * 0.8, Math.PI * 1.2);
      ctx.stroke();

      // Draw ellipse arc.
      ctx.beginPath();
      let first = true;
      let cX = x + 5;
      let cY = y + h + 1;
      let radX = h + 3;
      let radY = blockSize;
      for (let i = 0.5 * Math.PI; i < 1.5 * Math.PI; i += 0.01) {
        let xPos = cX - (radX * Math.sin(i)) * Math.sin(0 * Math.PI) + (radY * Math.cos(i)) * Math.cos(0 * Math.PI);
        let yPos = cY + (radY * Math.cos(i)) * Math.sin(0 * Math.PI) + (radX * Math.sin(i)) * Math.cos(0 * Math.PI);
        if (first) {
          ctx.moveTo(xPos, yPos);
          first = false;
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
      ctx.stroke();

      // Draw arrow.
      ctx.fillRect(x - blockSize - blockSize / 2, y + h - 1, h + 5, 2);
      ctx.beginPath();
      ctx.moveTo(x - (blockSize * 2) + h + 7, y + h - 8);
      ctx.lineTo(x - (blockSize * 2) + h, y + h);
      ctx.lineTo(x - (blockSize * 2) + h + 7, y + h + 8);
      ctx.stroke();

      break;

    case Sprites.ClackerUp:
      if (inEditor) {
        ctx.textBaseline = 'top';
        ctx.font = '10px Apple';
        ctx.fillText('CLKU', x + 3, y + 15);
      }
      break;

    case Sprites.ClackerDown:
      if (inEditor) {
        ctx.textBaseline = 'top';
        ctx.font = '10px Apple';
        ctx.fillText('CLKD', x + 3, y + 15);
      }
      break;

    case Sprites.ConnectorLeft:
      _spriteConnector(ctx, x + (blockSize / 2), y + (blockSize / 2), sprite.colour);
      ctx.fillRect(x - blockSize / 2, y + (blockSize / 2) - 1, blockSize, 2);
      ctx.beginPath();
      ctx.moveTo(x - blockSize + h + 7, y + h - 8);
      ctx.lineTo(x - blockSize + h, y + h);
      ctx.lineTo(x - blockSize + h + 7, y + h + 8);
      ctx.stroke();
      break;

    case Sprites.ConnectorRight:
      _spriteConnector(ctx, x + (blockSize / 2), y + (blockSize / 2), sprite.colour);
      ctx.fillRect(x + blockSize / 2, y + (blockSize / 2) - 1, blockSize, 2);
      ctx.beginPath();
      ctx.moveTo(x + blockSize + h - 7, y + h - 8);
      ctx.lineTo(x + blockSize + h, y + h);
      ctx.lineTo(x + blockSize + h - 7, y + h + 8);
      ctx.stroke();
      break;

    case Sprites.ConnectorUp:
      _spriteConnector(ctx, x + (blockSize / 2), y + (blockSize / 2), sprite.colour);
      ctx.fillRect(x + blockSize / 2 - 1, y - (blockSize / 2), 2, blockSize);
      ctx.beginPath();
      ctx.moveTo(x + (h - 8), y - h + 8);
      ctx.lineTo(x + h, y - blockSize + h);
      ctx.lineTo(x + (h + 8), y - h + 8);
      ctx.stroke();
      break;

    case Sprites.ConnectorDown:
      _spriteConnector(ctx, x + (blockSize / 2), y + (blockSize / 2), sprite.colour);
      ctx.fillRect(x + blockSize / 2 - 1, y + (blockSize / 2), 2, blockSize);
      ctx.beginPath();
      ctx.moveTo(x + (h - 8), y + blockSize + h - 8);
      ctx.lineTo(x + h, y + blockSize + h);
      ctx.lineTo(x + (h + 8), y + blockSize + h - 8);
      ctx.stroke();
      break;

    case Sprites.OptionWall:
      ctx.fillRect(x, y, blockSize, blockSize);
      if (inEditor) {
        ctx.textBaseline = 'top';
        ctx.font = '21px Apple';
        if (sprite.colour === 'white') {
          ctx.fillStyle = 'black';
        } else {
          ctx.fillStyle = 'white';
        }
        ctx.fillText('O', x + 10, y + 10);
      }
      break;
    default:
      console.log(`Unknown sprite ${Sprites[sprite.type]}`);
      break;
  }
  ctx.restore();
}

function _spriteConnector(ctx: CanvasRenderingContext2D, x: number, y: number, colour: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}
