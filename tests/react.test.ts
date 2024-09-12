import { describe, it, expect } from 'vitest';
import { createElement } from '../src/react';

describe('createElement', () => {
  it('creates a simple element', () => {
    const element = createElement('div', { id: 'test' });
    expect(element).toEqual({
      type: 'div',
      props: {
        id: 'test',
        children: [],
      },
    });
  });

  it('creates an element with children', () => {
    const element = createElement('div', null, 'Hello', createElement('span', null, 'World'));
    expect(element).toEqual({
      type: 'div',
      props: {
        children: [
          {
            type: 'TEXT_ELEMENT',
            props: {
              nodeValue: 'Hello',
              children: [],
            },
          },
          {
            type: 'span',
            props: {
              children: [
                {
                  type: 'TEXT_ELEMENT',
                  props: {
                    nodeValue: 'World',
                    children: [],
                  },
                },
              ],
            },
          },
        ],
      },
    });
  });
});