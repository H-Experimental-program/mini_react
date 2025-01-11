import { Props } from 'shared/ReactTypes';

export type Container = Element;
export type Instance = Element;

export const createInstance = (type: string, props: Props): Instance => {
  const element = document.createElement(type);

  // 处理 props

  return element;
};

export const appendInitialChild = (
  parent: Instance | Container,
  child: Instance
) => {
  parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
  return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;
