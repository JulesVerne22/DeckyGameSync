import { ReactNode } from "react";
import RoutePage from "../components/routePage";
import LogView from "../components/logView";
import { get_plugin_log } from "../helpers/backend";

class PluginLogsPage extends RoutePage {
  readonly route = "plugin-logs";

  render(): ReactNode {
    return <LogView title="Plugin Logs" getLog={get_plugin_log} />;
  }
}

const pluginLogsPage = new PluginLogsPage();
export default pluginLogsPage;
