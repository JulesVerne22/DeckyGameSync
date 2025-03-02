import { ReactNode } from "react";
import Plugin from "../json/plugin.json";
import { routerHook } from "@decky/api";
import { Navigation } from "@decky/ui";

export default abstract class RoutePage {
  readonly routePrefix:string = `/${Plugin.name.replaceAll(' ', '-').toLowerCase()}/`;
  abstract readonly route: string;

  register(): RoutePage {
    routerHook.addRoute(this.routePrefix + this.route, () => this.render(), { exact: true });
    return this;
  }

  unregister() {
    routerHook.removeRoute(this.routePrefix + this.route);
  }

  enter() {
    Navigation.Navigate(this.routePrefix + this.route);
    Navigation.CloseSideMenus();
  }

  abstract render(): ReactNode;
}
