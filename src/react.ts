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
}

let nextUnitOfWork: Fiber | null = null;
let wipRoot: Fiber | null = null;
let currentRoot: Fiber | null = null;
let deletions: Fiber[] | null = null;

export function resetGlobalVariables() {
  nextUnitOfWork = null;
  wipRoot = null;
  currentRoot = null;
  deletions = null;
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
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

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
  currentRoot = wipRoot;
  wipRoot = null;
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

