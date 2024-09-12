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

export function render(element: Element, container: HTMLElement | Text) {
  if (typeof element.type === "function") {
    const componentElement = element.type(element.props);
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

  element.props.children.forEach((child: Element) =>
    render(child, dom)
  );

  container.appendChild(dom);
}