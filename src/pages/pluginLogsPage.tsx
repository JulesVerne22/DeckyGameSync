import { ReactNode } from "react";
import RoutePage from "../helpers/routePage";
import LogView from "../components/logView";
import { get_plugin_log } from "../helpers/backend";

class PluginLogsPage extends RoutePage {
  readonly route = `plugin-logs-page`;

  render(): ReactNode {
    return <LogView title="Plugin Logs" getLog={get_plugin_log} />;
  }
}

const pluginLogsPage = new PluginLogsPage();
export default pluginLogsPage;
