import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatcher, Dispatch } from 'react/src/currentDispatch';
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  UpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

// 记录当前正在 render 的 FC 对应的 fiberNode
// 在 fiberNode 周昂保存 hook 数据
let CURRENTLY_RENDERING_FIBER: FiberNode | null = null;
// 记录当前正在处理的 hook
let WORK_IN_PROGRESS_HOOK: Hook | null = null;

const { currentDispatcher } = internals;

interface Hook {
  // fiber 中的 memorizedState 是个 fiberNode 指向 hooks 的链表
  // 每个 hook 也有 memorizedState，指向自己的数据
  memorizedState: any;
  updateQueue: unknown;
  next: Hook | null;
}

export function renderWithHooks(wip: FiberNode) {
  // set
  CURRENTLY_RENDERING_FIBER = wip;
  wip.memorizedState = null;

  const current = wip.alternate;

  if (current !== null) {
    // update
    // currentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // mount
    currentDispatcher.current = HooksDispatcherOnMount;
  }

  const Component = wip.type;
  const props = wip.pendingProps;
  const children = Component(props);

  // reset
  CURRENTLY_RENDERING_FIBER = null;

  return children;
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState
};

function mountState<State>(
  initialState: (() => State) | State
): [State, Dispatch<State>] {
  // 找到当前 useState 对应的 hook 数据
  const hook = mountWorkInProgressHook();

  let memorizedState;

  if (initialState instanceof Function) {
    memorizedState = initialState();
  } else {
    memorizedState = initialState;
  }

  const queue = createUpdateQueue<State>();
  hook.updateQueue = queue;
  hook.memorizedState = memorizedState;

  if (CURRENTLY_RENDERING_FIBER === null) {
    throw new Error('[[mountState]] CURRENTLY_RENDERING_FIBER cannot be null');
  }

  const dispatch = dispatchSetState.bind(
    null,
    CURRENTLY_RENDERING_FIBER,
    queue as UpdateQueue<any>
  );
  queue.dispatch = dispatch;

  return [memorizedState, dispatch];
}

function dispatchSetState<State>(
  fiber: FiberNode,
  updateQueue: UpdateQueue<State>,
  action: Action<State>
) {
  const update = createUpdate(action);
  enqueueUpdate(updateQueue, update);
  scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memorizedState: null,
    updateQueue: null,
    next: null
  };

  if (WORK_IN_PROGRESS_HOOK === null) {
    // mount 时 第一个 hook
    if (CURRENTLY_RENDERING_FIBER === null) {
      throw new Error('[[hook]] only can used by FC');
    } else {
      WORK_IN_PROGRESS_HOOK = hook;
      CURRENTLY_RENDERING_FIBER.memorizedProps = WORK_IN_PROGRESS_HOOK;
    }
  } else {
    // mount 时后续的 hook
    WORK_IN_PROGRESS_HOOK.next = hook;
    WORK_IN_PROGRESS_HOOK = hook;
  }

  return WORK_IN_PROGRESS_HOOK;
}
