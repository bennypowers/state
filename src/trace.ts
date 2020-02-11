export const trace = <X>(tag: string) =>
  (x: X): X => {
    // eslint-disable-next-line no-console
    console.log(tag, x);
    return x;
  };
