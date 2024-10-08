import { updateDom } from "./dom";
import { simulateRequestIdleCallback } from "./polyfill";

interface Props {
  [key: string]: any;
}

interface Element {
  type: string | Function;
  props: Props;
}

export function createElement(type: string | Function, props?: Props | null, ...children: any[]): Element {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text: string | number): Element {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

interface Fiber {
  type: string | Function;
  props: Props;
  dom: HTMLElement | Text | null;
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: Fiber | null;
  effectTag?: 'UPDATE' | 'PLACEMENT' | 'DELETION';
  stateHooks?: any[] | null;
  effectHooks?: any[] | null;
}

let nextUnitOfWork: Fiber | null = null;
let wipRoot: Fiber | null = null;
let currentRoot: Fiber | null = null;
let deletions: Fiber[] | null = null;

let wipFiber: Fiber | null = null;
let stateHookIndex: number | null = null;

export function resetGlobalVariables() {
  nextUnitOfWork = null;
  wipRoot = null;
  currentRoot = null;
  deletions = null;
  wipFiber = null;
  stateHookIndex = null;
}

let isBatchingUpdates = false;
const updateQueue: (() => void)[] = [];

export function batchedUpdates(fn: () => void) {
  const prevIsBatchingUpdates = isBatchingUpdates;
  isBatchingUpdates = true;
  try {
    fn();
  } finally {
    isBatchingUpdates = prevIsBatchingUpdates;
    if (!isBatchingUpdates) {
      while (updateQueue.length > 0) {
        const update = updateQueue.shift();
        update!();
      }
    }
  }
}

export function useState<T>(
  initialState: T
): [T, (action: T | ((prevState: T) => T)) => void] {
  const currentFiber = wipFiber!;

  const oldHook = wipFiber!.alternate?.stateHooks![stateHookIndex!];

  const stateHook = {
    state: oldHook ? oldHook.state : initialState,
    queue: oldHook ? oldHook.queue : [],
  };

  stateHook.queue.forEach((action: (state: T) => T) => {
    stateHook.state = action(stateHook.state);
  });

  stateHook.queue = [];

  stateHookIndex!++;
  wipFiber!.stateHooks!.push(stateHook);

  function setState(action: T | ((prevState: T) => T)) {
    const update = () => {
      const isFunction = typeof action === "function";

      stateHook.queue.push(isFunction ? action : () => action);
  
      wipRoot = {
        ...currentFiber,
        alternate: currentFiber,
      };
      nextUnitOfWork = wipRoot;
    }

    if (isBatchingUpdates) {
      updateQueue.push(update);
    } else {
      update();
    }
  }

  return [stateHook.state, setState];
}

export function useEffect(callback: () => void | (() => void), deps?: any[]) {
  const effectHook = {
    callback,
    deps,
    cleanup: undefined as (() => void) | undefined,
  };
  wipFiber!.effectHooks!.push(effectHook);
}

const requestIdleCallback = window.requestIdleCallback ?? simulateRequestIdleCallback;

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}


function performUnitOfWork(fiber: Fiber): Fiber | null {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  return null;
}

function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber;
  stateHookIndex = 0;
  wipFiber.stateHooks = [];
  wipFiber.effectHooks = [];

  const children = [(fiber.type as Function)(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

function createDom(fiber: Fiber): HTMLElement | Text {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props);

  return dom;
}

function reconcileChildren(wipFiber: Fiber, elements: Element[]) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling: Fiber | null = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
        child: null,
        sibling: null,
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
        child: null,
        sibling: null,
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions!.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling!.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

function commitRoot() {
  deletions!.forEach(commitWork);
  commitWork(wipRoot!.child);
  commitEffectHooks();
  currentRoot = wipRoot;
  wipRoot = null;
  deletions = [];
}

function isDepsEqual(deps: any[], newDeps: any[]) {
  if (deps.length !== newDeps.length) {
    return false;
  }

  for (let i = 0; i < deps.length; i++) {
    if (deps[i] !== newDeps[i]) {
      return false;
    }
  }
  return true;
}

function commitEffectHooks() {
  function runCleanup(fiber: Fiber | null) {
    if (!fiber) return;

    fiber.alternate?.effectHooks?.forEach((hook, index) => {
      const deps = fiber.effectHooks![index].deps;

      if (!hook.deps || !isDepsEqual(hook.deps, deps!)) {
        hook.cleanup?.();
      }
    });

    runCleanup(fiber.child);
    runCleanup(fiber.sibling);
  }

  function run(fiber: Fiber | null) {
    if (!fiber) return;

    fiber.effectHooks?.forEach((newHook, index) => {
      if (!fiber.alternate) {
        newHook.cleanup = newHook.callback();
        return;
      }

      if (!newHook.deps) {
        newHook.cleanup = newHook.callback();
      }

      if (newHook.deps && newHook.deps.length > 0) {
        const oldHook = fiber.alternate?.effectHooks![index];

        if (!isDepsEqual(oldHook.deps!, newHook.deps!)) {
          newHook.cleanup = newHook.callback();
        }
      }
    });

    run(fiber.child);
    run(fiber.sibling);
  }

  runCleanup(wipRoot);
  run(wipRoot);
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber!.dom) {
    domParentFiber = domParentFiber!.parent;
  }
  const domParent = domParentFiber!.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber, domParent: Node) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child!, domParent);
  }
}

export function render(element: Element, container: HTMLElement | Text) {
  wipRoot = {
    type: container.nodeName.toLowerCase(),
    props: {
      children: [element],
    },
    dom: container,
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

requestIdleCallback(workLoop);

export function memo<P extends object>(
  Component: (props: P) => Element,
  propsAreEqual: (prevProps: P, nextProps: P) => boolean = shallowEqual
): (props: P) => Element {
  return (props: P) => {
    const fiber = wipFiber!;
    const oldProps = fiber.alternate?.props;
    
    if (oldProps && propsAreEqual(oldProps as P, props)) {
      return fiber.alternate!.child!;
    }
    
    return Component(props);
  };
}

function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null ||
      typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (let key of keys1) {
    if (key === 'children') continue; // Skip comparing children
    if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}