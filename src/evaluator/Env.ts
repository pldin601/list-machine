export interface IMap {
  [key: string]: any;
}

export default class Env {
  private bindings: IMap;
  private parent?: Env;

  constructor(bindings: IMap = {}, parent?: Env) {
    this.bindings = bindings;
    this.parent = parent;
  }

  public get(name: string): any {
    if (name in this.bindings) {
      return this.bindings[name];
    }

    if (this.parent) {
      return this.parent.get(name);
    }

    return null;
  }

  public bind(name: string, value: any): void {
    this.bindings[name] = value;
  }

  public bindAll(bindings: IMap) {
    this.bindings = { ...this.bindings, ... bindings };
  }

  public mutate(name: string, value: any): void {
    if (name in this.bindings) {
      this.bindings[name] = value;
      return;
    }

    if (this.parent) {
      this.parent.mutate(name, value);
    }
  }

  public isBound(name: string): boolean {
    if (name in this.bindings) {
      return true;
    }

    if (this.parent) {
      return this.parent.isBound(name);
    }

    return false;
  }

  public newEnv(bindings: IMap = {}) {
    return new Env(bindings, this);
  }
}
