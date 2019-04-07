export * from './string';

/** Indicates if A directly inherits from B */
export function directlyInherits(A: Function, B: Function) {
  return A.prototype instanceof B;
}

/** Indicates if A inherits from B */
export function inherits(A: Function, B: Function): boolean {
  if (!A) {
    return false;
  }

  if (directlyInherits(A, B)) {
    return true;
  }

  return inherits(A.prototype, B);
}
