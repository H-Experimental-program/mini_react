import { Key, Props, Ref, ReactElementType } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

/*
  对于同一个节点，比较其 ReactNode 与 fiberNode，生成子 fiberNode。
  并根据比较的结果生产不同的标记（插入、删除、移动...），对应不同的宿主环境
  API 的执行

  遍历方法 DFS
  前序：beginWork
  后序：completeWork

  当所有的 ReactElement 比较完后，会生成一颗 fiberNode 树，一共会存
  在两颗 fiberNode 树：
  - current：与视图中真实 UI 对应的 fiberNode 树
  - workProgress：触发更新后，正在 reconciler 中计算的 fiberNode 树

  workProgress 树在更新完后会变为新的 current 树，下次更新时会创建一颗
  新的 workProgress 树
*/

export class FiberNode {
  // 实例
  tag: WorkTag;
  key: Key;
  stateNode: any;
  type: any;

  // 树状结构
  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;
  ref: Ref;

  // 工作单元
  pendingProps: Props;
  memorizedProps: Props | null;
  memorizedState: any;
  updateQueue: unknown;
  // - 用于树的切换
  // - 若当前的 fiberNode 是 current
  // - 则 alternate 指向 workProgress
  // - 若是 workProgress 则指向 current
  alternate: FiberNode | null;

  // 副作用
  // - 对应操作的标记（插入、删除、移动...）
  flags: Flags;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // 实例
    this.tag = tag;
    this.key = key;
    // 以 HostComponent 为例，如果它是 <div>
    // 则 stateNode 中就应该保存这个 div Dom
    this.stateNode = null;
    // 以 FunctionComponent 为例，它的 tag 是 0
    // 其 type 是其函数本身 () => {}
    this.type = null;

    // 树状结构
    // - 指向父 fiberNode
    this.return = null;
    this.sibling = null;
    this.child = null;

    // 处理类如 <ul><li>*3
    // 第一个 li 的 index 为 0，之后为 1，以此类推
    this.index = 0;

    this.ref = null;

    // 工作单元
    // 工作单元开始工作时的 props
    this.pendingProps = pendingProps;
    // 工作完成之后的 props
    this.memorizedProps = null;
    this.memorizedState = null;
    this.updateQueue = null;
    this.alternate = null;

    // 副作用
    this.flags = NoFlags;
  }
}

export class FiberRootNode {
  container: Container;
  current: FiberNode;
  // 已经更新完成的 hostRootFiber
  finishedWork: FiberNode | null;

  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    hostRootFiber.stateNode = this;
    this.finishedWork = null;
  }
}

export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props
): FiberNode => {
  let wip /* work in progress */ = current.alternate;

  if (wip === null) {
    // mount
    wip = new FiberNode(current.tag, pendingProps, current.key);
    wip.stateNode = current.stateNode;

    wip.alternate = current;
    current.alternate = wip;
  } else {
    // update
    wip.pendingProps = pendingProps;
    // 清除遗留副作用
    wip.flags = NoFlags;
  }

  wip.type = current.type;
  wip.updateQueue = current.updateQueue;
  wip.child = current.child;
  wip.memorizedProps = current.memorizedProps;
  wip.memorizedState = current.memorizedState;
  wip.ref = current.ref;

  return wip;
};

export function createFiberFromElement(element: ReactElementType): FiberNode {
  const { type, key, props } = element;
  let fiberTag: WorkTag = FunctionComponent;

  if (typeof type === 'string') {
    // <div/> type: 'div'
    fiberTag = HostComponent;
  } else if (typeof type !== 'function' && __DEV__) {
    console.warn('undefined type', element);
  }

  const fiber = new FiberNode(fiberTag, props, key);
  fiber.type = type;

  return fiber;
}
