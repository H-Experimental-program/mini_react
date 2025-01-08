// DFS 后序

import {
  appendInitialChild,
  createInstance,
  createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import { NoFlags } from './fiberFlags';

/**
 *
 * @process
 * - 对于 Host 类型的 fiberNode：构建离屏 dom 树
 * - 标记 Update flag
 */

export const completeWork = (wip: FiberNode) => {
  const newProps = wip.pendingProps;
  const current = wip.alternate;

  switch (wip.tag) {
    case HostComponent:
      if (current !== null && wip.stateNode) {
        // update
      } else {
        // 1. 构建 dom
        const instance = createInstance(wip.type, newProps);
        // 2. 将 dom 插入到 dom 树中
        appendAllChildren(instance, wip);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostText:
      if (current !== null && wip.stateNode) {
        // update
      } else {
        // 1. 构建 dom
        const instance = createTextInstance(newProps.content);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostRoot:
      bubbleProperties(wip);
      return null;
    default:
      if (__DEV__) {
        console.warn('unprocessed completeWork', wip);
      }
      break;
  }
};

/**
 *
 * @explain 在 parent 中插入 wip
 */
function appendAllChildren(parent: FiberNode, wip: FiberNode) {
  let node = wip.child;

  // wip 可能不是一个 dom 节点
  // 递归的查找 HostComponent 和 HostText 类型的节点
  while (node !== null) {
    if (node?.tag === HostComponent || node?.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === wip) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === wip) {
        return;
      }

      node = node?.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }
}

/**
 * @explain 利用 completeWork 将子 fiberNode 的 flags 冒泡到 父 fiberNode
 */
function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags;
  let child = wip.child;

  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;

    child.return = wip;
    child = child.sibling;
  }

  wip.subtreeFlags |= subtreeFlags;
}
