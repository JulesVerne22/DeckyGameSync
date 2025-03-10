import { ReactNode } from "react";
import { routerHook } from "@decky/api";
import { Navigation } from "@decky/ui";
import { PLUGIN_NAME_AS_PATH } from "../helpers/commonDefs";
import Logger from "../helpers/logger";
import Registerable from "../types/registerable";

export default abstract class RoutePage<T extends { [K in keyof T]: string } = Record<string, string>> extends Registerable {
  readonly routePrefix: string = PLUGIN_NAME_AS_PATH;
  abstract readonly route: string;

  private get fullRoute(): string {
    return `/${this.routePrefix}/${this.route}`;
  }

  protected _register(): () => void {
    const route = this.fullRoute;
    routerHook.addRoute(route, this.render, { exact: true });
    return () => routerHook.removeRoute(route);
  }

  public enter = (params?: T): void => {
    const routeParams = new URLSearchParams(params).toString();
    const route = routeParams ? `${this.fullRoute}?${routeParams}` : this.fullRoute;
    Logger.debug(`Navigating to ${route}`)
    Navigation.Navigate(route);
    Navigation.CloseSideMenus();
  }

  public abstract render(): ReactNode;
}
