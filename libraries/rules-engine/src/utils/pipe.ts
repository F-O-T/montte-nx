type UnaryFn<A, B> = (a: A) => B;

export function pipe<A, B>(fn1: UnaryFn<A, B>): UnaryFn<A, B>;
export function pipe<A, B, C>(
   fn1: UnaryFn<A, B>,
   fn2: UnaryFn<B, C>,
): UnaryFn<A, C>;
export function pipe<A, B, C, D>(
   fn1: UnaryFn<A, B>,
   fn2: UnaryFn<B, C>,
   fn3: UnaryFn<C, D>,
): UnaryFn<A, D>;
export function pipe<A, B, C, D, E>(
   fn1: UnaryFn<A, B>,
   fn2: UnaryFn<B, C>,
   fn3: UnaryFn<C, D>,
   fn4: UnaryFn<D, E>,
): UnaryFn<A, E>;
export function pipe<A, B, C, D, E, F>(
   fn1: UnaryFn<A, B>,
   fn2: UnaryFn<B, C>,
   fn3: UnaryFn<C, D>,
   fn4: UnaryFn<D, E>,
   fn5: UnaryFn<E, F>,
): UnaryFn<A, F>;
export function pipe<A, B, C, D, E, F, G>(
   fn1: UnaryFn<A, B>,
   fn2: UnaryFn<B, C>,
   fn3: UnaryFn<C, D>,
   fn4: UnaryFn<D, E>,
   fn5: UnaryFn<E, F>,
   fn6: UnaryFn<F, G>,
): UnaryFn<A, G>;
export function pipe(
   ...fns: UnaryFn<unknown, unknown>[]
): UnaryFn<unknown, unknown> {
   return (value: unknown) => fns.reduce((acc, fn) => fn(acc), value);
}

export function compose<A, B>(fn1: UnaryFn<A, B>): UnaryFn<A, B>;
export function compose<A, B, C>(
   fn1: UnaryFn<B, C>,
   fn2: UnaryFn<A, B>,
): UnaryFn<A, C>;
export function compose<A, B, C, D>(
   fn1: UnaryFn<C, D>,
   fn2: UnaryFn<B, C>,
   fn3: UnaryFn<A, B>,
): UnaryFn<A, D>;
export function compose<A, B, C, D, E>(
   fn1: UnaryFn<D, E>,
   fn2: UnaryFn<C, D>,
   fn3: UnaryFn<B, C>,
   fn4: UnaryFn<A, B>,
): UnaryFn<A, E>;
export function compose<A, B, C, D, E, F>(
   fn1: UnaryFn<E, F>,
   fn2: UnaryFn<D, E>,
   fn3: UnaryFn<C, D>,
   fn4: UnaryFn<B, C>,
   fn5: UnaryFn<A, B>,
): UnaryFn<A, F>;
export function compose(
   ...fns: UnaryFn<unknown, unknown>[]
): UnaryFn<unknown, unknown> {
   return (value: unknown) => fns.reduceRight((acc, fn) => fn(acc), value);
}

export const identity = <T>(value: T): T => value;

export const always =
   <T>(value: T) =>
   (): T =>
      value;

export const tap =
   <T>(fn: (value: T) => void) =>
   (value: T): T => {
      fn(value);
      return value;
   };
