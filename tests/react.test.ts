import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, render, resetGlobalVariables, useEffect, useState } from '../src/react';
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

describe('useState hook', () => {

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

  it('should update state and re-render', async () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return createElement(
        'div',
        null,
        createElement('p', null, `Count: ${count}`),
        createElement('button', { onClick: () => setCount(c => c + 1) }, 'Increment')
      );
    }

    const element = createElement(Counter);
    render(element, container);

    await vi.waitFor(() => {
      expect(container.innerHTML).toBe('<div><p>Count: 0</p><button>Increment</button></div>');
    });

    const button = container.querySelector('button');
    button!.click();

    await vi.waitFor(() => {
      expect(container.innerHTML).toBe('<div><p>Count: 1</p><button>Increment</button></div>');
    });
  });

  it('should handle multiple state hooks', async () => {
    function TwoCounters() {
      const [count1, setCount1] = useState(0);
      const [count2, setCount2] = useState(10);
      return createElement(
        'div',
        null,
        createElement('p', null, `Count1: ${count1}`),
        createElement('button', { onClick: () => setCount1(c => c + 1) }, 'Increment1'),
        createElement('p', null, `Count2: ${count2}`),
        createElement('button', { onClick: () => setCount2(c => c + 1) }, 'Increment2')
      );
    }

    const element = createElement(TwoCounters);
    render(element, container);

   await vi.waitFor(() => {
      expect(container.innerHTML).toBe('<div><p>Count1: 0</p><button>Increment1</button><p>Count2: 10</p><button>Increment2</button></div>');
   });

    const buttons = container.querySelectorAll('button');
    buttons[0].click();

    await vi.waitFor(() => {
      expect(container.innerHTML).toBe('<div><p>Count1: 1</p><button>Increment1</button><p>Count2: 10</p><button>Increment2</button></div>');
    });

    buttons[1].click();

    await vi.waitFor(() => {
      expect(container.innerHTML).toBe('<div><p>Count1: 1</p><button>Increment1</button><p>Count2: 11</p><button>Increment2</button></div>');
    });
  });
});

describe('useEffect hook', () => {
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

  it('should run effect after render', async () => {
    const effectMock = vi.fn();

    function EffectComponent() {
      useEffect(effectMock);
      return createElement('div', null, 'Effect Test');
    }

    const element = createElement(EffectComponent);
    render(element, container);

    await vi.waitFor(() => {
      expect(effectMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should run effect only when dependencies change', async () => {
    const effectMock = vi.fn();

    function EffectComponent({ dep }: { dep: number }) {
      const [state, setState] = useState(dep);
      useEffect(effectMock, [state]);

      return createElement(
        'div',
        null,
        createElement('span', null, `Dep: ${state}`),
        createElement(
          'button',
          { onClick: () => setState(prev => prev + 1) },
          'Increment'
        )
      );
    }

    const element = createElement(EffectComponent, { dep: 1 });
    render(element, container);

    await vi.waitFor(() => {
      expect(effectMock).toHaveBeenCalledTimes(1);
    });

    // Simulate a click to change the dependency
    container.querySelector('button')?.click();

    await vi.waitFor(() => {
      expect(effectMock).toHaveBeenCalledTimes(2);
    });

    // Simulate another click to change the dependency again
    container.querySelector('button')?.click();

    await vi.waitFor(() => {
      expect(effectMock).toHaveBeenCalledTimes(3);
    });
  });

  it('should cleanup effect', async () => {
    const cleanupMock = vi.fn();

    function CleanupComponent() {
      const [, setShow] = useState(true);
      
      useEffect(() => {
        return cleanupMock;
      });

      return createElement(
        'div',
        null,
        createElement(
          'button',
          { onClick: () => {
            console.log('click');
            setShow(false);
          } },
          'Hide'
        )
      );
    }

    const element = createElement(CleanupComponent);
    render(element, container);

    await vi.waitFor(() => {
      expect(container.innerHTML).toBe('<div><button>Hide</button></div>');
    })

    container.querySelector('button')?.click();

    await vi.waitFor(() => {
      expect(cleanupMock).toHaveBeenCalledTimes(1);
    });
  });
});