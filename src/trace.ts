export const trace = <X>(tag: string) =>
  (x: X): X => {
    console.log(tag, x);
    return x;
  };
