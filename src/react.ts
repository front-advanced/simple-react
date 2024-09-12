interface Props {
  [key: string]: any;
}

interface Element {
  type: string;
  props: Props;
}

export function createElement(type: string, props: Props | null, ...children: any[]): Element {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text: string): Element {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export function render(element: Element, container: HTMLElement | Text) {
  console.log("Rendering element:", element);
  console.log("Into container:", container);
}