import * as plugin from "./json/plugin.json"
import { definePlugin } from "@decky/api";
import { Patch } from "@decky/ui";
import { FaSave } from "react-icons/fa";

import * as ApiClient from "./helpers/apiClient";
// import { Content } from "./pages/RenderDCSMenu";
// import ConfigurePathsPage from "./pages/ConfigurePathsPage";
// import ConfigureBackendPage from "./pages/ConfigureBackendPage";
// import RenderSyncLogPage from "./pages/RenderSyncLogPage";
// import RenderPluginLogPage from "./pages/RenderPluginLogPage";

function Content() {
  return (
    <div>
      <h1>DCS Server Plugin</h1>
    </div>
  );
}

export default definePlugin(() => {
  const patchArray: Array<Patch> = []
  const registrationArray: Array<{unregister: () => void}> = [];
  // const routeArray: Array<string> = ["/dcs-configure-paths", "/dcs-configure-backend", "/dcs-sync-logs", "/dcs-plugin-logs"];

  registrationArray.push(ApiClient.setupAppLifetimeNotificationsHandler());


  // routerHook.addRoute("/dcs-configure-paths", () => <ConfigurePathsPage serverApi={serverApi} />, { exact: true });
  // routerHook.addRoute("/dcs-configure-backend", () => <ConfigureBackendPage serverApi={serverApi} />, { exact: true });
  // routerHook.addRoute("/dcs-sync-logs", () => <RenderSyncLogPage />, { exact: true });
  // routerHook.addRoute("/dcs-plugin-logs", () => <RenderPluginLogPage />, { exact: true });

  return {
    name: plugin.name,
    content: <Content />,
    icon: <FaSave />,
    onDismount() {
      patchArray.forEach(patch => patch.unpatch());
      registrationArray.forEach(registration => registration.unregister());
      // routerHook.removeRoute("/dcs-configure-paths");
      // routerHook.removeRoute("/dcs-configure-backend");
      // routerHook.removeRoute("/dcs-sync-logs");
      // routerHook.removeRoute("/dcs-plugin-logs");
    }
  }
});
