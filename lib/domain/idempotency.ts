export class IdempotencyRegistry<T> {
  private readonly operations = new Map<string, Promise<T>>();

  run(key: string, operation: () => Promise<T>) {
    const existing = this.operations.get(key);
    if (existing) return existing;

    const pending = operation();
    this.operations.set(key, pending);
    return pending;
  }
}
