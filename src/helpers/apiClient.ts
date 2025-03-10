import { LifetimeNotification } from "@decky/ui";
import { sync_cloud_first, sync_local_first } from "./backend";
import { GLOBAL_SYNC_APP_ID } from "./commonDefs";
import Logger from "./logger";
import Config from "./config";
import SyncTaskQeueue from "./syncTaskQueue";

function getCurrentUserId(): number {
  return Number(BigInt.asUintN(32, BigInt(window.App.m_CurrentUser.strSteamID)));
};

export function setupScreenshotNotification(): Unregisterable {
  return SteamClient.GameSessions.RegisterForScreenshotNotification(async (e: ScreenshotNotification) => {
    if (Config.get("capture_upload") && e.details && e.strOperation == "written") {
      await SyncTaskQeueue.addScreenshotSyncTask(getCurrentUserId(), e.details.strUrl, e.details.strGameID, e.details.hHandle);
    }
  });
}

export function setupAppLifetimeNotifications(): Unregisterable {
  return SteamClient.GameSessions.RegisterForAppLifetimeNotifications(async (e: LifetimeNotification) => {
    if (e.bRunning) {
      if (Config.get("sync_on_game_start")) {
        Logger.info(`Syncing on game ${e.unAppID} start`);
        await SyncTaskQeueue.addSyncTask(sync_cloud_first, e.unAppID, e.nInstanceID);
        await SyncTaskQeueue.addSyncTask(sync_local_first, GLOBAL_SYNC_APP_ID);
      }
    } else {
      if (Config.get("sync_on_game_stop")) {
        Logger.info(`Syncing on game ${e.unAppID} stop`);
        await SyncTaskQeueue.addSyncTask(sync_local_first, e.unAppID);
        await SyncTaskQeueue.addSyncTask(sync_cloud_first, GLOBAL_SYNC_APP_ID);
      }
    }
  });
}
