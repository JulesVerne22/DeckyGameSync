import * as plugin from "../json/plugin.json"
import { definePlugin, ServerAPI, staticClasses, LifetimeNotification } from "decky-frontend-lib";
import { Toast } from "./helpers/toast";
import Logger from "./helpers/logger";
import { ApiClient } from "./helpers/apiClient";
import { ApplicationState } from "./helpers/state";
import { Content } from "./pages/RenderDCSMenu";
import { FaSave } from "react-icons/fa";
// import ConfigurePathsPage from "./pages/ConfigurePathsPage";
import ConfigureBackendPage from "./pages/ConfigureBackendPage";
// import RenderSyncLogPage from "./pages/RenderSyncLogPage";
// import RenderPluginLogPage from "./pages/RenderPluginLogPage";

declare const appStore: any;

export default definePlugin((serverApi: ServerAPI) => {
  ApplicationState.initialize(serverApi);

  // serverApi.routerHook.addRoute("/dcs-configure-paths", () => <ConfigurePathsPage serverApi={serverApi} />, { exact: true });
  serverApi.routerHook.addRoute("/dcs-configure-backend", () => <ConfigureBackendPage serverApi={serverApi} />, { exact: true });
  // serverApi.routerHook.addRoute("/dcs-sync-logs", () => <RenderSyncLogPage />, { exact: true });
  // serverApi.routerHook.addRoute("/dcs-plugin-logs", () => <RenderPluginLogPage />, { exact: true });

  const { unregister: removeGameExecutionListener } = SteamClient.GameSessions.RegisterForAppLifetimeNotifications((e: LifetimeNotification) => {
    const currentState = ApplicationState.getAppState().currentState;
    if (currentState.sync_on_game_exit) {
      const gameInfo = appStore.GetAppOverviewByGameID(e.unAppID);
      Logger.info((e.bRunning ? "Starting" : "Stopping") + " game '" + gameInfo.display_name + "' (" + e.unAppID + ")");

      ApplicationState.setAppState("playing", String(e.bRunning));

      syncGame(e);
    } else {
      Logger.info("No futher actions");
    }
  });

  return {
    title: <div className={staticClasses.Title}>{plugin.name}</div>,
    content: <Content />,
    icon: <FaSave />,
    onDismount() {
      removeGameExecutionListener();
      serverApi.routerHook.removeRoute("/dcs-configure-paths");
      serverApi.routerHook.removeRoute("/dcs-configure-backend");
      serverApi.routerHook.removeRoute("/dcs-sync-logs");
      serverApi.routerHook.removeRoute("/dcs-plugin-logs");
    },
  };
});

function syncGame(e: LifetimeNotification) {
  const currentState = ApplicationState.getAppState().currentState;
  let toast = currentState.toast_auto_sync;
  if (e.bRunning) {
    // Only sync at start when bisync is enabled. No need to when its not.
    if (currentState.bisync_enabled) {
      if (toast) {
        Toast.toast("Synchronizing savedata");
      }
      ApiClient.syncOnLaunch(toast, e.nInstanceID); // nInstanceID is Linux Process PID
    }
  } else {
    ApiClient.syncOnEnd(toast);
  }
}
