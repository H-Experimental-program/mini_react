import { MutationMask, NoFlags } from './fiberFlags';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { HostRoot } from './workTags';
import { commitMutationEffects } from './commitWork';

// 指向正在工作的 fiberNode
let workInProgress: FiberNode | null = null;

// 用于执行初始化的操作
function prepareFreshStack(root: FiberRootNode) {
  // 通过 hostRootFiber 生成 workProgress 树
  workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
  // fiberRootNode
  const root = markUpdateFromFiberToRoot(fiber);

  renderRoot(root);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  let parent = node.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  if (node.tag === HostRoot) {
    return node.stateNode;
  }

  return null;
}

function renderRoot(root: FiberRootNode) {
  // initialize
  prepareFreshStack(root);

  do {
    try {
      workLoop();
      break;
    } catch (e) {
      if (__DEV__) {
        console.warn('workLoop发生错误', e);
      }
      workInProgress = null;
    }
  } while (true);

  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;

  commitRoot(root);
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber);
  fiber.memorizedProps = fiber.pendingProps;

  if (next === null) {
    // 说明没有 children
    completeUnitOfWork(fiber);
  } else {
    workInProgress = next;
  }
}

// 遍历平行节点
function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber;

  do {
    completeWork(node);

    const sibling = node.sibling;
    if (sibling !== null) {
      workInProgress = sibling;
      return;
    }

    node = node.return;
    workInProgress = node;
  } while (node !== null);
}
function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;

  if (finishedWork === null) {
    return;
  }

  if (__DEV__) {
    console.warn('commit start', finishedWork);
  }

  root.finishedWork = null;

  // 判断是否存在 3 个阶段需要执行的操作
  // root.flags & root.subtreeFlags
  const subtreeHasEffect =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeHasEffect || rootHasEffect) {
    // beforeMutation
    // mutation Placement
    commitMutationEffects(finishedWork);

    root.current = finishedWork;

    // layout
  } else {
    root.current = finishedWork;
  }

  console.warn('commitRoot: Function not implemented.');
}
