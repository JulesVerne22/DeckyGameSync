import Plugin from "./json/plugin.json"
import { definePlugin } from "@decky/api";
import { FaSave } from "react-icons/fa";
import ApiClient from "./helpers/apiClient";
import RoutePage from "./helpers/routePage";
import { Content } from "./pages/quickAccessMenu";
import PluginLogsPage from "./pages/pluginLogsPage";

export default definePlugin(() => {
  const registrationArray: Array<Unregisterable> = [];
  const routePageArray: Array<RoutePage> = [];

  registrationArray.push(ApiClient.setupAppLifetimeNotificationsHandler());
  registrationArray.push(ApiClient.setupScreenshotNotification());

  routePageArray.push(PluginLogsPage.register());

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
