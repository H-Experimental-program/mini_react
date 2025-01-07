import { Action } from 'shared/ReactTypes';

export interface Update<State> {
  action: Action<State>;
}

export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
}

export const createUpdate = <State>(action: Action<State>): Update<State> => ({
  action
});

export const createUpdateQueue = <Action>() =>
  ({ shared: { pending: null } }) as UpdateQueue<Action>;

// 在 queue 中插入 update
export const enqueueUpdate = <Action>(
  updateQueue: UpdateQueue<Action>,
  update: Update<Action>
) => {
  updateQueue.shared.pending = update;
};

// 消费 update
// 通过 baseState 与 pendingUpdate 得到 memorizedState
export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State> | null
): { memorizedState: State } => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memorizedState: baseState
  };

  if (pendingUpdate !== null) {
    // baseState: 1 update: 2 -> memorizedUpdate: 2
    // baseState: 1 update: x => x * 4 -> memorizedUpdate: 4
    const action = pendingUpdate.action;
    if (action instanceof Function) {
      result.memorizedState = action(baseState);
    } else {
      result.memorizedState = action;
    }
  }

  return result;
};
