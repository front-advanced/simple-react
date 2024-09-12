import { createElement, render } from './react';

const element = createElement('div', null, 'Hello, Mini React!');
render(element, document.getElementById('root')!);