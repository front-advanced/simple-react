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

  it('renders a simple functional component', () => {
    function App() {
      return createElement('h1', null, 'Hello, World');
    }
    const element = createElement(App);
    render(element, container);
    expect(container.innerHTML).toBe('<h1>Hello, World</h1>');
  });

  it('renders a functional component with props', () => {
    function Greeting(props: { name: string }) {
      return createElement('h1', null, `Hello, ${props.name}`);
    }
    const element = createElement(Greeting, { name: 'React' });
    render(element, container);
    expect(container.innerHTML).toBe('<h1>Hello, React</h1>');
  });

  it('renders nested functional components', () => {
    function Child(props: { name: string }) {
      return createElement('div', null, `Child ${props.name}`);
    }
    function Parent() {
      return createElement('div', null,
        createElement(Child, { name: 'A' }),
        createElement(Child, { name: 'B' })
      );
    }
    const element = createElement(Parent);
    render(element, container);
    expect(container.innerHTML).toBe('<div><div>Child A</div><div>Child B</div></div>');
  });
});