export interface PromiseParams<T> {
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
}
