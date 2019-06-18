import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

export const constants = {
  blockSize: 40,
  sizeX: 20,
  sizeY: 12,
  inEditor: false,

  formatText: (text: string): string => {
    for (const rep in textReplacements) {
      text = text.replace(`{${rep}}`, textReplacements[rep]);
    }
    return text;
  }
};

const textReplacements = {
  'Up': '\x8b',
  'Down': '\x8a',
  'Left': '\x88',
  'Right': '\x95',
};

