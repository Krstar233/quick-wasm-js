export class TestClass {
  private _name: string;
  constructor(name: string) {
    this._name = name;
  }
  setName(name: string): void {
    this._name = name;
  }
}
