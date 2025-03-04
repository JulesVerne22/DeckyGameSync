import { ReactNode } from "react";
import { routerHook } from "@decky/api";
import { Navigation } from "@decky/ui";
import Plugin from "../json/plugin.json";

export default abstract class RoutePage<T extends { [K in keyof T]: string } = Record<string, string>> {
  readonly routePrefix: string = `${Plugin.name.replaceAll(' ', '-').toLowerCase()}`;
  abstract readonly route: string;

  private get fullRoute(): string {
    return `/${this.routePrefix}/${this.route}`;
  }

  public register = (): Unregisterable => {
    const route = this.fullRoute;
    routerHook.addRoute(route, this.render, { exact: true });
    return {
      unregister: () => routerHook.removeRoute(route)
    };
  }

  public enter = (params?: T): void => {
    const routeParams = new URLSearchParams(params).toString();
    Navigation.Navigate(routeParams ? `${this.fullRoute}?${routeParams}` : this.fullRoute);
    Navigation.CloseSideMenus();
  }

  public abstract render(): ReactNode;
}
