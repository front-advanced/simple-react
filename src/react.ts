interface Props {
  [key: string]: any;
  children?: Element | Element[];
}

interface Element {
  type: string | Function;
  props: Props;
}

export function createElement(type: string | Function, props: Props | null, ...children: any[]): Element {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      ).flat(),
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

function isElement(child: any): child is Element {
  return typeof child === "object" && "type" in child;
}

export function render(element: Element, container: HTMLElement | Text) {
  if (typeof element.type === "function") {
    const componentElement = element.type({
      ...element.props,
      children: element.props.children || [],
    });
    render(componentElement, container);
    return;
  }

  const dom = 
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type as string);

  const isProperty = (key: string) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      (dom as any)[name] = element.props[name];
    });

  const children = element.props.children || [];
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (isElement(child)) {
        render(child, dom);
      }
    });
  } else if (isElement(children)) {
    render(children, dom);
  }

  container.appendChild(dom);
}