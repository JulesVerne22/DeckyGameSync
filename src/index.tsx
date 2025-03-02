import Plugin from "./json/plugin.json"
import { definePlugin } from "@decky/api";
import { FaSave } from "react-icons/fa";
import ApiClient from "./helpers/apiClient";
import RoutePage from "./components/routePage";
import { Content } from "./pages/quickAccessMenu";
import PluginLogsPage from "./pages/pluginLogsPage";
import ConfigCloudPage from "./pages/configCloudPage";

export default definePlugin(() => {
  const registrationArray: Array<Unregisterable> = [];
  const routePageArray: Array<RoutePage> = [];

  registrationArray.push(ApiClient.setupAppLifetimeNotificationsHandler());
  registrationArray.push(ApiClient.setupScreenshotNotification());

  routePageArray.push(PluginLogsPage.register());
  routePageArray.push(ConfigCloudPage.register());

  return {
    name: Plugin.name,
    content: <Content />,
    icon: <FaSave />,
    onDismount() {
      registrationArray.forEach(registration => registration.unregister());
      routePageArray.forEach(routePage => routePage.unregister());
    }
  }
});
