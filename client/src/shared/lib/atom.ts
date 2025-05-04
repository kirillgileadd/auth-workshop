export class Atom<T> {
  private value: T;
  private listeners: Set<() => void> = new Set();

  constructor(value: T) {
    this.value = value;
  }

  listen = (callback: () => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  get = () => {
    return this.value;
  };

  set = (value: T) => {
    this.value = value;
    this.listeners.forEach((listener) => listener());
  };
}
