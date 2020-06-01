import {inherits} from './inerits';

describe('Kernel', () => {
  describe('Common', () => {
    describe('inherits()', () => {
      it('indicates if a given constructor is a child derived from another constructor', () => {
        class A {}
        class B extends A {}
        class C extends B {}
        class D {}

        expect(inherits(C, A)).toBe(true);
        expect(inherits(D, A)).toBe(false);
      });
    });
  });
});
