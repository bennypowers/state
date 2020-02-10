import type { UpdatingElement } from 'lit-element';

import type { StatefulElement } from './StateMixin';

type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

export interface State extends Record<string, any> {}


export type EffectFunction = (value: State[keyof State], state?: State) => unknown;

export type Effects = EffectFunction|EffectFunction[];

type StateInitializers = { [P in keyof Partial<State>]?: { state: State[P]; effects?: Effects } };

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

/** Duck-type for UpdatingElement so we don't have to import */
function isUpdatingElement(element: unknown): element is UpdatingElement {
  if (typeof element['requestUpdate'] === 'function') return true;
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
export function runEffects(state: State, property: keyof State, value: State[keyof State]): void {
  if (EFFECTS.has(property))
    EFFECTS.get(property).forEach((f: EffectFunction) => f(value, state));
}

/** Get a shallow copy of the current state */
export function getState(): State {
  return { ...state };
}

/** Update an element's state */
function updateElement(element: StatefulElement): void {
  if (isUpdatingElement(element))
    element.requestUpdate();
  else
    element.state = getState();
}

const PROXY = new Proxy(state, {
  set(state: State, property: keyof State, value: State[keyof Partial<State>]): boolean {
    try {
      runEffects(state, property, value);
      state[property] = value;
      INSTANCES.forEach(updateElement);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return false;
    }
  },
});

/** Update the state with a partial tree */
export function updateState(partial: RecursivePartial<State>): void {
  const entries = Object.entries(partial) as [keyof State, State[keyof State]][];
  entries.forEach(function updateStateSlice([property, value]) {
    PROXY[property] = !isObject(value) ? value : {
      ...(PROXY[property] || {}) as object,
      ...value,
    };
  });
}

/** Lazily register a slice of state along with any effects you want to run when it updates */
export function registerState(stateInitializers: StateInitializers): void {
  const entries = Object.entries(stateInitializers) as
    [keyof State, { state: Partial<State>; effects?: Effects }][];
  entries.forEach(function initializeStateSlice([key, { state, effects }]) {
    registerEffects(key, effects);
    updateState({ [key]: state });
  });
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
