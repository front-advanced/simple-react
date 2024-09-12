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

describe('Components and Props', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders a functional component', () => {
    function App(props: { name: string }) {
      return createElement('h1', null, `Hello, ${props.name}`);
    }
    const element = createElement(App, { name: 'World' });
    render(element, container);
    expect(container.innerHTML).toBe('<h1>Hello, World</h1>');
  });

  it('renders a component with children', () => {
    function Parent(props: { children: any }) {
      return createElement('div', null, props.children);
    }
    const element = createElement(
      Parent,
      null,
      createElement('span', null, 'Child 1'),
      createElement('span', null, 'Child 2')
    );
    render(element, container);
    expect(container.innerHTML).toBe('<div><span>Child 1</span><span>Child 2</span></div>');
  });
});