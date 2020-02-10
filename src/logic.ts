type StatePredicate<X, Y, Z> = (x: X, y: Y, z: Z) => boolean;

export const when = <X, Y, Z, Fx>(p: StatePredicate<X, Y, Z>, f: (x: X, y: Y, z: Z) => Fx) =>
  (x: X, y: Y, z: Z): X|Fx =>
    p(x, y, z) ? f(x, y, z) : x;

export const not = <X, Y, Z>(p: StatePredicate<X, Y, Z>) =>
  (x: X, y: Y, z: Z): boolean =>
    !p(x, y, z);

export const and = <X, Y, Z>(p: StatePredicate<X, Y, Z>, q: StatePredicate<X, Y, Z>) =>
  (x: X, y: Y, z: Z): boolean =>
    p(x, y, z) &&
    q(x, y, z);

export const or = <X, Y, Z>(p: StatePredicate<X, Y, Z>, q: StatePredicate<X, Y, Z>) =>
  (x: X, y: Y, z: Z): boolean =>
    p(x, y, z) ||
    q(x, y, z);
