export * from './string';

/** Indicates if A directly inherits from B */
// eslint-disable-next-line @typescript-eslint/ban-types
export function directlyInherits(A: Function, B: Function) {
  return A.prototype instanceof B;
}

/** Indicates if A inherits from B */
// eslint-disable-next-line @typescript-eslint/ban-types
export function inherits(A: Function, B: Function): boolean {
  if (!A) {
    return false;
  }

  if (directlyInherits(A, B)) {
    return true;
  }

  return inherits(A.prototype, B);
}
