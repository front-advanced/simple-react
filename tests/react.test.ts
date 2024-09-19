import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, render, resetGlobalVariables } from '../src/react';
import { vi } from 'vitest';

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

describe('Fiber Architecture', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    resetGlobalVariables();
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null as any;
  })

  it('renders elements incrementally', async () => {
    const element = createElement('div', null,
      createElement('h1', null, 'Hello'),
      createElement('h2', null, 'World')
    );
    render(element, container);

    await vi.waitFor(() => {
      expect(container.innerHTML).toBe('<div><h1>Hello</h1><h2>World</h2></div>');
    });
  });

  it('updates existing elements', async () => {
    const element1 = createElement('div', { id: 'test' }, 'Hello');
    render(element1, container);

    const element2 = createElement('div', { id: 'test', className: 'updated' }, 'Updated');
    render(element2, container);

    await vi.waitFor(() => container.innerHTML === '<div id="test" class="updated">Updated</div>');
  });

  it('removes elements', async () => {
    const element = createElement('div', null,
      createElement('h1', null, 'Hello'),
      createElement('h2', null, 'World')
    );
    render(element, container);

    const element2 = createElement('div', null, 
      createElement('h1', null, 'Hello')
    );
    render(element2, container);
  
    await vi.waitFor(() => {
      expect(container.innerHTML).toBe('<div><h1>Hello</h1></div>');
    });
  });
});