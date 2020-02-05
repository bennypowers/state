import { StateElement } from "./StateElement";

type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

export interface State extends Record<string, any> {}

type EffectFunction = (value: RecursivePartial<State[keyof State]>, state?: State) => any

type EffectsMap = Map<keyof State, EffectFunction[]>;

type Effects = EffectFunction|EffectFunction[];

type StateInitializers = { [P in keyof Partial<State>]?: { state: State[P], effects?: Effects } };

type StatefulElement<Base = HTMLElement> = StateElement | Base & { state: State }

/** Element Instances */
const INSTANCES = new Set() as Set<StatefulElement>;

/** Effecting functions to run on state change */
const EFFECTS = new Map() as EffectsMap;

/**
 * Reactive state tree
 */
const STATE = new Proxy({ }, {
  set(state: State, property: keyof State, value: State[keyof Partial<State>]) {
    try {
      if (EFFECTS.has(property))
        EFFECTS.get(property).forEach((f: EffectFunction) => f(value, state));
      state[property] = value;
      INSTANCES.forEach(updateElement);
      return true;
    } catch (_) {
      return false;
    }
  },
});

/**
 * isObject :: a -> Boolean
 * @license ISC License (c) copyright 2016 original and current authors
 * @author Ian Hofmann-Hicks (evil)
 */
function isObject(x: any) {
  return !!x && Object.prototype.toString.call(x) === '[object Object]';
}

/** Update an element's state */
function updateElement(element: StatefulElement) {
  if (element instanceof StateElement)
    element.requestUpdate();
  else
    element.state = getState();
}

function registerEffects(key: keyof State, effects?: Effects) {
  if (!effects) return;
  const registeredEffects = Array.isArray(effects) ? effects : [effects];
  if (EFFECTS.has(key))
    EFFECTS.get(key).push(...registeredEffects);
  else
    EFFECTS.set(key, [...registeredEffects]);
}

/** Lazily register a slice of state along with any effects you want to run when it updates */
export function registerState(stateInitializers: StateInitializers) {
  const entries = Object.entries(stateInitializers) as [keyof State, { state: Partial<State>, effects?: Effects }][]
  entries.forEach(function initializeStateSlice([key, { state, effects }]) {
    registerEffects(key, effects);
    updateState({ [key]: state });
  });
}

/**
 * Update the state with a partial tree
 */
export function updateState(partial: RecursivePartial<State>) {
  const entries = Object.entries(partial) as [keyof State, State[keyof State]][]
  entries.forEach(function updateStateSlice([property, value]) {
    STATE[property] = isObject(value) ? { ...(STATE[property] || {}), ...value } : value;
  });
}

/** Get a shallow copy of the current state */
export function getState(): State {
  return { ...STATE };
}

/** Subscribe an element to state updates */
export function subscribe(element: StatefulElement) {
  INSTANCES.add(element);
  updateElement(element)
  return element.state;
}

/** Unsubscribe an element from state updates */
export function unsubscribe(element: StatefulElement) {
  INSTANCES.delete(element);
}
