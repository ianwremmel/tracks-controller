/**
 * Theoretically never thrown. Use this in typeguards to convince typescript of
 * things that are definitely true
 */
export class TypeNarrowingError extends TypeError {}
