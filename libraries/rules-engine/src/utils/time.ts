export type TimingResult<T> = {
   readonly result: T;
   readonly durationMs: number;
};

export const measureTime = <T>(fn: () => T): TimingResult<T> => {
   const start = performance.now();
   const result = fn();
   const durationMs = performance.now() - start;
   return { result, durationMs };
};

export const measureTimeAsync = async <T>(
   fn: () => Promise<T>,
): Promise<TimingResult<T>> => {
   const start = performance.now();
   const result = await fn();
   const durationMs = performance.now() - start;
   return { result, durationMs };
};

export const withTimeout = <T>(
   promise: Promise<T>,
   timeoutMs: number,
   errorMessage = "Operation timed out",
): Promise<T> => {
   return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
         reject(new Error(errorMessage));
      }, timeoutMs);

      promise
         .then((result) => {
            clearTimeout(timer);
            resolve(result);
         })
         .catch((error) => {
            clearTimeout(timer);
            reject(error);
         });
   });
};
