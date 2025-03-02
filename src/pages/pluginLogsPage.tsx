import { ReactNode } from "react";
import Plugin from "../json/plugin.json"
import RoutePage from "../helpers/routePage";
import LogView from "../components/logView";
import { get_plugin_log } from "../helpers/backend";

class PluginLogsPage extends RoutePage {
  readonly routeStr = `/${Plugin.name.replaceAll(' ', '-').toLowerCase()}-plugin-logs-page`;

  render(): ReactNode {
    return <LogView title="Plugin Logs" getLog={get_plugin_log} />;
  }
}

const pluginLogsPage = new PluginLogsPage();
export default pluginLogsPage;
