import { ReactNode } from "react";
import { routerHook } from "@decky/api";
import { Navigation } from "@decky/ui";
import Plugin from "../json/plugin.json";

export default abstract class RoutePage {
  readonly routePrefix: string = `${Plugin.name.replaceAll(' ', '-').toLowerCase()}`;
  abstract readonly route: string;

  private get fullRoute(): string {
    return `/${this.routePrefix}/${this.route}`;
  }

  public register = (): RoutePage => {
    routerHook.addRoute(this.fullRoute, this.render, { exact: true });
    return this;
  }

  public unregister = (): void => {
    routerHook.removeRoute(this.fullRoute);
  }

  public enter = (): void => {
    Navigation.Navigate(this.fullRoute);
    Navigation.CloseSideMenus();
  }

  public abstract render(): ReactNode;
}
