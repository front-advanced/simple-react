import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, render } from '../src/react';

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

describe('render', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders a simple element', () => {
    const element = createElement('div', { id: 'test' });
    render(element, container);
    expect(container.innerHTML).toBe('<div id="test"></div>');
  });

  it('renders an element with children', () => {
    const element = createElement('div', null,
      createElement('span', null, 'Hello'),
      ' World'
    );
    render(element, container);
    expect(container.innerHTML).toBe('<div><span>Hello</span> World</div>');
  });
});