import type { StatefulElement } from './StateMixin';

type Key = string|number|symbol;

type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

export interface State { }

export type StateKey =
  keyof State;

export type StateSlice =
  State[StateKey];

/**
 * Effects run after state has been assigned.
 * @param  next Local state slice. e.g. for effects on the `user` slice, the first parameter is the `user` slice
 * @param  prev Previous value of state.
 * @param  state global state
 */
export type EffectFunction<T extends StateSlice = StateSlice> =
  (next: T, prev?: T, state?: State) =>
    unknown
    | Promise<unknown>;

export type Effects<T extends StateSlice = StateSlice> =
  EffectFunction<T> |
  EffectFunction<T>[];

export interface SliceInitializer<P extends StateKey = StateKey> {
  effects?: Effects<State[P]>;
  state: State[P];
}

export type StateInitializer = {
  [P in StateKey]?: SliceInitializer<P>
};

/**
 * isObject :: a -> Boolean
 * @license ISC License (c) copyright 2016 original and current authors
 * @author Ian Hofmann-Hicks (evil)
 */
function isObject(x: unknown): x is object {
  return !!x && Object.prototype.toString.call(x) === '[object Object]';
}

const isStateSlice = isObject as (x: object) => x is StateSlice;

/** Reactive state tree */
const state = {};


/** Element Instances */
const INSTANCES =
  new Set() as Set<StatefulElement>;

/** Effecting functions to run on state change */
const EFFECTS =
  new Map() as Map<StateKey, EffectFunction[]>;

/** Register effects for a State slice */
function registerEffects(key: StateKey, effects?: Effects): void {
  if (!effects) return;
  const registeredEffects = Array.isArray(effects) ? effects : [effects];
  if (EFFECTS.has(key))
    EFFECTS.get(key).push(...registeredEffects);
  else
    EFFECTS.set(key, [...registeredEffects]);
}

/** Run effects for a state slice */
function runEffects(property: StateKey, next: StateSlice, prev: StateSlice, state: State): void {
  if (EFFECTS.has(property)) {
    for (const f of EFFECTS.get(property))
      f(next, prev, state);
  }
}

/** Get a shallow copy of the current state */
export function getState(): State {
  return { ...state };
}

/** Update an element's state */
async function updateElement(element: StatefulElement): Promise<void> {
  element.stateUpdated();
}

const PROXY = new Proxy(state, {
  set(state: State, key: StateKey, next: StateSlice): boolean {
    const slice = state[key];

    const prev = (
        Array.isArray(slice) ? [...slice as []]
      : isStateSlice(slice) ? { ...(slice as object) }
      : slice
    ) as StateSlice;

    state[key] = next;
    INSTANCES.forEach(updateElement);
    runEffects(key, next, prev, state);
    return true;
  },
});

/** Update the state with a partial tree */
export function updateState(statePartial: RecursivePartial<State>): void {
  for (const [property, value] of Object.entries(statePartial) as [Key, unknown][])
    PROXY[property] = !isObject(value) ? value : { ...PROXY[property], ...value };
}

/** Lazily register a slice of state along with any effects you want to run when it updates */
export function registerState(stateInitializers: StateInitializer): void {
  for (const [key, { state, effects }] of
      Object.entries(stateInitializers) as [StateKey, SliceInitializer][]) {
    registerEffects(key, effects);
    updateState({ [key]: state });
  }
}

/** Subscribe an element to state updates */
export function subscribe(element: StatefulElement): State {
  INSTANCES.add(element);
  updateElement(element);
  return element.state;
}

/** Unsubscribe an element from state updates */
export function unsubscribe(element: StatefulElement): void {
  INSTANCES.delete(element);
}
