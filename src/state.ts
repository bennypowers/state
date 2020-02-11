import type { StatefulElement } from './StateMixin';

type Key = string|number|symbol;

type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

export interface State extends Record<keyof State, State[keyof State]> {
  // 1️⃣🖐👏
}

export type StateSlice = State[keyof State];

/**
 * Effects run after state has been assigned.
 * @param  value Local state slice. e.g. for effects on the `user` slice, the first parameter is the `user` slice
 * @param  previous Previous value of state.
 * @param  state global state
 */
export type EffectFunction = (
  value: StateSlice,
  previous?: StateSlice,
  state?: State
) => void;

export type Effects = EffectFunction|EffectFunction[];

type StateInitializer<P extends keyof State = keyof State> = { state: State[P]; effects?: Effects }

type StateInitializers = { [P in keyof State]?: StateInitializer<P> };

/** Reactive state tree */
const state = {};

/**
 * isObject :: a -> Boolean
 * @license ISC License (c) copyright 2016 original and current authors
 * @author Ian Hofmann-Hicks (evil)
 */
function isObject(x: unknown): x is object {
  return !!x && Object.prototype.toString.call(x) === '[object Object]';
}

/** Element Instances */
const INSTANCES = new Set() as Set<StatefulElement>;

/** Effecting functions to run on state change */
const EFFECTS = new Map() as Map<keyof State, EffectFunction[]>;

/** Register effects for a State slice */
export function registerEffects(key: keyof State, effects?: Effects): void {
  if (!effects) return;
  const registeredEffects = Array.isArray(effects) ? effects : [effects];
  if (EFFECTS.has(key))
    EFFECTS.get(key).push(...registeredEffects);
  else
    EFFECTS.set(key, [...registeredEffects]);
}

/** Run effects for a state slice */
export function runEffects(
  property: keyof State,
  value: StateSlice,
  previousValue: StateSlice,
  state: State,
): void {
  if (EFFECTS.has(property)) {
    EFFECTS.get(property).forEach((f: EffectFunction) =>
      f(value, previousValue, state));
  }
}

/** Get a shallow copy of the current state */
export function getState(): State {
  return { ...state };
}

/** Update an element's state */
async function updateElement(element: StatefulElement): Promise<void> {
  element.__stateUpdated();
}

const isStateSlice = (x: object): x is StateSlice =>
  isObject(x);

const PROXY = new Proxy(state, {
  set(state: State, property: keyof State, value: StateSlice): boolean {
    try {
      const previousValue =
        (isStateSlice(state[property]) ?
          { ...(state[property] as object) }
          : state[property]) as StateSlice;
      state[property] = value;
      INSTANCES.forEach(updateElement);
      runEffects(property, value, previousValue, state);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return false;
    }
  },
});

/** Update the state with a partial tree */
export function updateState(statePartial: RecursivePartial<State>): void {
  for (const [property, value] of Object.entries(statePartial) as [Key, unknown][])
    PROXY[property] = !isObject(value) ? value : { ...PROXY[property], ...value };
}

/** Lazily register a slice of state along with any effects you want to run when it updates */
export function registerState(stateInitializers: StateInitializers): void {
  for (const [key, { state, effects }] of
      Object.entries(stateInitializers) as [keyof State, StateInitializer][]) {
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
