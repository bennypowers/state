export type StatePredicate<X, Z> = (x: X, y: X, z: Z) => boolean;

export const when = <X, Z, Fx>(p: StatePredicate<X, Z>, f: (x: X, y: X, z: Z) => Fx) =>
  (x: X, y: X, z: Z): X|Fx =>
    p(x, y, z) ? f(x, y, z) : x;

export const not = <X, Z>(p: StatePredicate<X, Z>) =>
  (x: X, y: X, z: Z): boolean =>
    !p(x, y, z);

export const and = <X, Z>(p: StatePredicate<X, Z>, q: StatePredicate<X, Z>) =>
  (x: X, y: X, z: Z): boolean =>
    p(x, y, z) &&
    q(x, y, z);

export const or = <X, Z>(p: StatePredicate<X, Z>, q: StatePredicate<X, Z>) =>
  (x: X, y: X, z: Z): boolean =>
    p(x, y, z) ||
    q(x, y, z);
