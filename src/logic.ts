import type { State, EffectFunction, StateSlice } from './state';

export type StatePredicate<T extends StateSlice> =
  (x: T, y: T, z: State) =>
    boolean;

type UnaryStatePredicateCombinator =
  <T extends StateSlice>(p: StatePredicate<T>) =>
    StatePredicate<T>

type BinaryStatePredicateCombinator =
  <T extends StateSlice>(p: StatePredicate<T>, q: StatePredicate<T>) =>
    (x: T, y: T, z: State) =>
      boolean

type NaryStatePredicateCombinator =
  <T extends StateSlice>(...ps: StatePredicate<T>[]) =>
    StatePredicate<T>

type EffectFunctionGuard =
  <T extends StateSlice>(p: StatePredicate<T>, f: EffectFunction<T>) =>
    (x: T, y: T, z: State) =>
      T|ReturnType<EffectFunction<T>>

type StateAccessor<R = StateSlice[keyof StateSlice]> =
  <T extends StateSlice>(propName: keyof T) =>
    (o: T) =>
      R

type PropChangedType =
  <T extends StateSlice>(prop: keyof T) =>
    (next: T, prev: T) =>
      boolean

export const and: BinaryStatePredicateCombinator =
  (p, q) =>
    (...a): boolean =>
      p(...a) &&
      q(...a);

export const or: BinaryStatePredicateCombinator =
  (p, q) =>
    (...a): boolean =>
      p(...a) ||
      q(...a);

export const not: UnaryStatePredicateCombinator =
  p =>
    (...a): boolean =>
      !p(...a);

export const when: EffectFunctionGuard =
  (p, f) =>
    (x, y, z) =>
        p(x, y, z) ? f(x, y, z)
      : x;

export const unless: EffectFunctionGuard =
   (p, f) =>
     (x, y, z) =>
        p(x, y, z) ? x
      : f(x, y, z);

export const all: NaryStatePredicateCombinator =
  (...ps) =>
    ps.reduce(and);

export const any: NaryStatePredicateCombinator =
  (...ps) =>
    ps.reduce(or);

export const none: NaryStatePredicateCombinator =
  (...ps) =>
    not(any(...ps));

export const getProp: StateAccessor =
  propName =>
    o =>
      o?.[propName];

export const hasProp: StateAccessor<boolean> =
  propName =>
    o =>
      o[propName] != null;

export const propChanged: PropChangedType =
  prop =>
    (next, prev) =>
      next?.[prop] !== prev?.[prop];

export const receivedProp: <T extends StateSlice>(prop: keyof T) => StatePredicate<T> =
  prop =>
    and(propChanged(prop), hasProp(prop));
