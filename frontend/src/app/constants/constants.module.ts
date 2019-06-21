import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

export const constants = {
  blockSize: 40,
  sizeX: 20,
  sizeY: 12,
  inEditor: false,
};

export const sizeX = 20;
export const sizeY = 12;
export const blockSize = 40;
export let inEditor = false;

const textReplacements = {
  Up: '\x8b',
  Down: '\x8a',
  Left: '\x88',
  Right: '\x95',
};

export function formatText(text: string): string {
  for (const rep in textReplacements) {
    if (textReplacements.hasOwnProperty(rep)) text = text.replace(`{${rep}}`, textReplacements[rep]);
  }
  return text;
}
