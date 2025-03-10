export default class Observable extends EventTarget {
  public addListener(
    eventType: string,
    handler: (arg: any) => void
  ): Unregisterable {
    const eventListener = ((event: CustomEvent) => handler(event.detail)) as EventListener;
    this.addEventListener(eventType, eventListener);
    return {
      unregister: () => this.removeEventListener(eventType, eventListener)
    };
  }
}
