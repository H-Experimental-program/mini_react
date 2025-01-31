import { HostText } from './workTags';
import { Props, ReactElementType } from 'shared/ReactTypes';
import {
  createFiberFromElement,
  createWorkInProgress,
  FiberNode
} from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { ChildDeletion, Placement } from './fiberFlags';

type ExistingChildren = Map<string | number, FiberNode>;

function ChildReconciler(shouldTrackEffects: boolean) {
  function deleteChild(returnFiber: FiberNode, childTODelete: FiberNode) {
    if (!shouldTrackEffects) {
      return;
    }
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childTODelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childTODelete);
      // returnFiber.flags |= ChildDeletion;
    }
  }

  function deleteRemainingChildren(
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null
  ) {
    if (!shouldTrackEffects) {
      return;
    }
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
  }

  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType
  ) {
    const key = element.key;
    while (currentFiber !== null) {
      // update
      if (currentFiber.key === key) {
        // key 相同
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (currentFiber.type === element.type) {
            // type 相同
            const existing = useFiber(currentFiber, element.props);
            existing.return = returnFiber;
            // 当前节点可复用，标记剩余的节点为删除
            deleteRemainingChildren(returnFiber, currentFiber.sibling);
            return existing;
          }
          // key相同但type不同，无法复用
          deleteRemainingChildren(returnFiber, currentFiber);
          break;
        } else {
          if (__DEV__) {
            console.warn('[[Reconcile]] unrealized react type', element);
          }
          break;
        }
      } else {
        // key不同，删除旧的，继续比较
        deleteChild(returnFiber, currentFiber);
        currentFiber = currentFiber.sibling;
      }
    }
    // 根据 element 创建一个 fiber 并返回
    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber;
  }

  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number
  ) {
    while (currentFiber !== null) {
      // update
      if (currentFiber.tag === HostText) {
        // type 没有改变
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
        deleteRemainingChildren(returnFiber, currentFiber.sibling);
        return existing;
      }
      deleteChild(returnFiber, currentFiber);
      currentFiber = currentFiber.sibling;
    }
    const fiber = new FiberNode(HostText, { content }, null);
    fiber.return = returnFiber;
    return fiber;
  }

  function placeSingleChild(fiber: FiberNode) {
    if (
      shouldTrackEffects /* 需要追踪副作用 */ &&
      fiber.alternate === null /* 首屏渲染 */
    ) {
      fiber.flags |= Placement;
    }
    return fiber;
  }

  function reconcileChildrenArray(
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    newChild: any[]
  ) {
    // 将 current 保存在一个 Map 中
    // 遍历到的最后一个可复用fiber在before中的index
    let lastPlacedIndex = 0;
    // 创建的最后一个fiber
    let lastNewFiber: FiberNode | null = null;
    // 创建的第一个fiber
    let firstNewFiber: FiberNode | null = null;

    // 遍历前的准备工作，将current保存在map中
    const existingChildren: ExistingChildren = new Map();
    let current = currentFirstChild;
    while (current !== null) {
      const keyToUse = current.key !== null ? current.key : current.index;
      existingChildren.set(keyToUse, current);
      current = current.sibling;
    }

    for (let i = 0; i < newChild.length; i++) {
      const after = newChild[i];
      const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
      if (newFiber === null) continue;

      newFiber.index = i;
      newFiber.return = returnFiber;

      if (lastNewFiber === null) {
        lastNewFiber = firstNewFiber = newFiber;
      } else {
        lastNewFiber = (lastNewFiber.sibling as FiberNode) = newFiber;
      }

      if (!shouldTrackEffects) continue;

      const current = newFiber.alternate;
      if (current !== null) {
        const oldIndex = current.index;
        if (oldIndex < lastPlacedIndex) {
          // 移动
          newFiber.flags |= Placement;
          // continue;
        } else {
          // 不移动
          lastPlacedIndex = oldIndex;
        }
      } else {
        // fiber不能复用，插入新节点
        newFiber.flags |= Placement;
      }
    }

    // 遍历后的收尾工作，标记existingChildren中剩余的删除
    existingChildren.forEach((fiber) => {
      deleteChild(returnFiber, fiber);
    });
    return firstNewFiber;
  }

  function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiberNode: FiberNode | null,
    newChild?: ReactElementType
  ) {
    // 判断当前 fiber 的类型
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFiberNode, newChild)
          );
        default:
          if (__DEV__) {
            console.warn(
              '[[reconcileChildFibers]] unrealized reconcile type',
              newChild
            );
          }
          break;
      }

      if (Array.isArray(newChild)) {
        return reconcileChildrenArray(returnFiber, currentFiberNode, newChild);
      }

      if (currentFiberNode !== null) {
        deleteChild(returnFiber, currentFiberNode);
      }
    }
    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiberNode, newChild)
      );
    }

    if (__DEV__) {
      console.warn(
        '[[reconcileChildFibers]] unrealized reconcile type',
        newChild
      );
    }
    return null;
  }

  function updateFromMap(
    returnFiber: FiberNode,
    existingChildren: ExistingChildren,
    index: number,
    element: any
  ): FiberNode | null {
    const keyToUse = element.key !== null ? element.key : index;
    const before = existingChildren.get(keyToUse);
    if (typeof element === 'string' || typeof element === 'number') {
      // HostText
      if (before) {
        if (before.tag === HostText) {
          existingChildren.delete(keyToUse);

          return useFiber(before, { content: element + '' });
        } else {
          deleteChild(returnFiber, before);
        }
      }

      return new FiberNode(HostText, { content: element + '' }, null);
    }

    // ReactElement
    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (before) {
            if (before.type === element.type) {
              existingChildren.delete(keyToUse);
              return useFiber(before, element.props);
            }
          }
          return createFiberFromElement(element);
      }
    }

    // todo: Array
    if (Array.isArray(element) && __DEV__) {
      console.warn('[[updateFromMap]] unrealized Array children');
    }

    return null;
  }

  return reconcileChildFibers;
}

/**
 * @explain 对于同一个 fiberNode，即使反复更新，current、wip 也会重复使用
 */
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.index = 0;
  clone.sibling = null;
  return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
