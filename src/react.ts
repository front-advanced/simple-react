export function createElement(type: string, props: any, ...children: any[]) {
  // We'll implement this in the next lesson
  return { type, props, children };
}

export function render(element: any, container: HTMLElement) {
  // We'll implement this in the next lesson
  console.log("Rendering", element, "into", container);
}