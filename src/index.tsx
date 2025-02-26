import Plugin from "./json/plugin.json"
import { definePlugin } from "@decky/api";
import { FaSave } from "react-icons/fa";

import ApiClient from "./helpers/apiClient";
import { Content } from "./pages/quickAccessMenu";
// import { Content } from "./pages/RenderDCSMenu";
// import ConfigurePathsPage from "./pages/ConfigurePathsPage";
// import ConfigureBackendPage from "./pages/ConfigureBackendPage";
// import RenderSyncLogPage from "./pages/RenderSyncLogPage";
// import RenderPluginLogPage from "./pages/RenderPluginLogPage";

export default definePlugin(() => {
  const registrationArray: Array<Unregisterable> = [];
  // const routeArray: Array<string> = ["/dcs-configure-paths", "/dcs-configure-backend", "/dcs-sync-logs", "/dcs-plugin-logs"];

  registrationArray.push(ApiClient.setupAppLifetimeNotificationsHandler());
  registrationArray.push(ApiClient.setupScreenshotNotification());


  // routerHook.addRoute("/dcs-configure-paths", () => <ConfigurePathsPage serverApi={serverApi} />, { exact: true });
  // routerHook.addRoute("/dcs-configure-backend", () => <ConfigureBackendPage serverApi={serverApi} />, { exact: true });
  // routerHook.addRoute("/dcs-sync-logs", () => <RenderSyncLogPage />, { exact: true });
  // routerHook.addRoute("/dcs-plugin-logs", () => <RenderPluginLogPage />, { exact: true });

  return {
    name: Plugin.name,
    content: <Content />,
    icon: <FaSave />,
    onDismount() {
      registrationArray.forEach(registration => registration.unregister());
      // routerHook.removeRoute("/dcs-configure-paths");
      // routerHook.removeRoute("/dcs-configure-backend");
      // routerHook.removeRoute("/dcs-sync-logs");
      // routerHook.removeRoute("/dcs-plugin-logs");
    }
  }
});
