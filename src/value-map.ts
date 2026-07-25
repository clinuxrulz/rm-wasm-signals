export class ValueMap {
  private arr: any[] = [undefined];
  private nextId = 1;

  alloc(val: any): number {
    const id = this.nextId++;
    this.arr[id] = val;
    return id;
  }

  get(id: number): any {
    return this.arr[id];
  }

  free(id: number): void {
    delete this.arr[id];
  }

  clear(): void {
    this.arr.length = 0;
    this.arr[0] = undefined;
    this.nextId = 1;
  }
}
