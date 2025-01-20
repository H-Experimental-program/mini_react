import { FunctionComponent } from './workTags';
import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatcher, Dispatch } from 'react/src/currentDispatch';
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  processUpdateQueue,
  UpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

// 记录当前正在 render 的 FC 对应的 fiberNode
// 在 fiberNode 周昂保存 hook 数据
let CURRENTLY_RENDERING_FIBER: FiberNode | null = null;
// 记录当前正在处理的 hook
let WORK_IN_PROGRESS_HOOK: Hook | null = null;
let CURRENT_HOOK: Hook | null = null;

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
    currentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // mount
    currentDispatcher.current = HooksDispatcherOnMount;
  }
  const Component = wip.type;
  const props = wip.pendingProps;
  const children = Component(props);
  // reset
  CURRENTLY_RENDERING_FIBER = null;
  WORK_IN_PROGRESS_HOOK = null;
  CURRENT_HOOK = null;
  return children;
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState
};

const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState
};

function updateState<State>(): [State, Dispatch<State>] {
  // 找到当前 useState 对应的 hook 数据
  const hook = updateWorkInProgressHook();
  // the logic to get new state
  const queue = hook.updateQueue as UpdateQueue<State>;
  const pending = queue.shared.pending;
  if (pending !== null) {
    const { memorizedState } = processUpdateQueue(hook.memorizedState, pending);
    hook.memorizedState = memorizedState;
  }
  return [hook.memorizedState, queue.dispatch as Dispatch<State>];
}

function updateWorkInProgressHook(): Hook {
  // 情况1:交互触发的更新，此时wipHook还不存在，复用 currentHook链表中对应的 hook 克隆 wipHook
  // todo: 情况2:render阶段触发的更新，wipHook已经存在，使用wipHook
  let nextCurrentHook: Hook | null;
  if (CURRENT_HOOK === null) {
    // 情况1 当前组件的第一个hook
    const current = (CURRENTLY_RENDERING_FIBER as FiberNode).alternate;
    if (current !== null) {
      nextCurrentHook = current.memorizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = CURRENT_HOOK.next;
  }
  if (nextCurrentHook === null) {
    // 本次render当前组件执行的hook比之前多，举个例子：
    // 之前：hook1 -> hook2 -> hook3
    // 本次：hook1 -> hook2 -> hook3 -> hook4
    // 那到了hook4，nextCurrentHook就为null
    console.error(
      `组件${CURRENTLY_RENDERING_FIBER?.type}本次执行的hook比上次多`
    );
  }
  CURRENT_HOOK = nextCurrentHook!;
  const newHook: Hook = {
    memorizedState: CURRENT_HOOK.memorizedState,
    // 对于state，保存update相关数据
    updateQueue: CURRENT_HOOK.updateQueue,
    next: null
  };
  if (WORK_IN_PROGRESS_HOOK === null) {
    (CURRENTLY_RENDERING_FIBER as FiberNode).memorizedState =
      WORK_IN_PROGRESS_HOOK = newHook;
  } else {
    WORK_IN_PROGRESS_HOOK = WORK_IN_PROGRESS_HOOK.next = newHook;
  }
  return WORK_IN_PROGRESS_HOOK!;
}

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
      console.error('[[hook]] only can used by FC');
    } else {
      CURRENTLY_RENDERING_FIBER.memorizedState = WORK_IN_PROGRESS_HOOK = hook;
    }
  } else {
    // mount 时后续的 hook
    WORK_IN_PROGRESS_HOOK = WORK_IN_PROGRESS_HOOK.next = hook;
  }
  return WORK_IN_PROGRESS_HOOK as Hook;
}
