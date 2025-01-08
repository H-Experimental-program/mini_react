// DFS 前序

import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { Flags } from './fiberFlags';

import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';

/**
 * @explain
 * <A>
 *   <B></B>
 * </A>
 * 当进入 A 的 beginWork 时,
 * 通过对比 B 的 current fiberNode 与 reactElement
 * 生成 B 对应的 wip fiberNode
 * @process
 * 此过程标记两类"结构变化"相关的 flags
 * - Placement
 *   - 插入: a -> ab
 *   - 移动: abc -> bca
 * - ChildDeletion
 *   - 删除: ul>li*3 -> ul>li*1
 * 不包含"属性变化"相关的 flag
 * - Update
 */
export const beginWork = (wip: FiberNode) => {
  // ReactElement 与 fiberNode 比较生成子 fiberNode
  switch (wip.tag) {
    case HostRoot:
      return updateHostRoot(wip);
    case HostComponent:
      return updateHostComponent(wip);
    case HostText:
      // HostText 没有子节点, 无须再向下遍历
      return null;
    default:
      if (__DEV__) {
        console.warn('beginWork unprocessed types');
      }
      break;
  }

  return null;
};

/**
 *
 * @job 计算状态的最新值 processUpdateQueue
 * @job 创建子 fiberNode
 */
function updateHostRoot(wip: FiberNode) {
  const baseState = wip.memorizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<Element>;
  const pending = updateQueue.shared.pending;
  // 使用计算出的 update, 清除以前的 update
  updateQueue.shared.pending = null;
  const { memorizedState } = processUpdateQueue(baseState, pending);
  wip.memorizedState = memorizedState;

  // B 的 reactElement
  const nextChildren = wip.memorizedState;
  reconcilerChildren(wip, nextChildren);
  return wip.child;
}

/**
 *
 * @job 创建子 fiberNode
 */
function updateHostComponent(wip: FiberNode) {
  const nextProps = wip.pendingProps;
  const nextChildren = nextProps.children;
  reconcilerChildren(wip, nextChildren);
  return wip.child;
}

/**
 *
 * @param wip
 * @param children B 的 reactElement
 */
function reconcilerChildren(wip: FiberNode, children?: ReactElementType) {
  // 获取 B 的 current fiberNode
  const current = wip.alternate;

  if (current !== null) {
    // update
    // 生成 B 对应的 wip fiberNode
    wip.child = reconcileChildFibers(wip, current?.child, children);
  } else {
    // mount
    wip.child = mountChildFibers(wip, null, children);
  }
}
