import { PLUGIN_NAME } from "./helpers/commonDefs";
import { definePlugin } from "@decky/api";
import { FaSave } from "react-icons/fa";
import ApiClient from "./helpers/apiClient";
import { Content } from "./pages/quickAccessMenu";
import PluginLogsPage from "./pages/pluginLogsPage";
import ConfigCloudPage from "./pages/configCloudPage";
import ContextMenuPatch from "./helpers/contextMenuPatch";
import SyncTargetConfigPage from "./pages/syncTargetConfigPage";

export default definePlugin(() => {
  const registrations: Array<Unregisterable> = [];

  registrations.push(ApiClient.setupAppLifetimeNotificationsHandler());
  registrations.push(ApiClient.setupScreenshotNotification());

  registrations.push(PluginLogsPage.register());
  registrations.push(ConfigCloudPage.register());
  registrations.push(SyncTargetConfigPage.register());

  registrations.push(ContextMenuPatch.register());

  return {
    name: PLUGIN_NAME,
    content: <Content />,
    icon: <FaSave />,
    onDismount() {
      registrations.forEach(registration => registration.unregister());
    }
  }
});
