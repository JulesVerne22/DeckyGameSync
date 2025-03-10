export default abstract class Registerable {
  private _registered = false;
  public get registered(): boolean {
    return this._registered;
  }

  protected abstract _register(): () => void;

  public register(): Unregisterable {
    if (this._registered) {
      throw new Error(`${this.constructor.name} is already registered`);
    }

    const unregister = this._register();
    this._registered = true;
    return {
      unregister: unregister,
    }
  }
}