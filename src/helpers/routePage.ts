import { ReactNode } from "react";
import { routerHook } from "@decky/api";
import { Navigation } from "@decky/ui";

export default abstract class RoutePage {
  abstract readonly routeStr: string;

  register(): RoutePage {
    routerHook.addRoute(this.routeStr, () => this.render(), { exact: true });
    return this;
  }

  unregister() {
    routerHook.removeRoute(this.routeStr);
  }

  enter() {
    Navigation.Navigate(this.routeStr);
    Navigation.CloseSideMenus();
  }

  abstract render(): ReactNode;
}
