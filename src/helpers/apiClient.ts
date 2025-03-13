import { LifetimeNotification } from "@decky/ui";
import { sync_cloud_first, sync_local_first } from "./backend";
import { GLOBAL_SYNC_APP_ID } from "./commonDefs";
import { getCurrentUserId } from "./utils";
import Logger from "./logger";
import Config from "./config";
import SyncTaskQeueue from "./syncTaskQueue";
import SyncStateTracker from "./syncStateTracker";
import Toaster from "./toaster";

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
        // To handle the case when gamescope crashed so we couldn't upload the latest changes
        await SyncTaskQeueue.addSyncTask(async (appId: number) => {
          if (SyncStateTracker.isInSync(appId)) {
            const rc = await sync_cloud_first(appId);
            SyncStateTracker.onDownload(appId);
            return rc;
          } else {
            const msg = "Missing upload, skipping download";
            Logger.warning(`${msg} for game ${appId}`);
            Toaster.toast(msg);
            return 0;
          }
        }, e.unAppID, e.nInstanceID);
        Logger.info(`Syncing on game ${e.unAppID} start`);
        await SyncTaskQeueue.addSyncTask(sync_local_first, GLOBAL_SYNC_APP_ID);
      }
    } else {
      if (Config.get("sync_on_game_stop")) {
        await SyncTaskQeueue.addSyncTask(async (appId: number) => {
          const rc = await sync_local_first(appId);
          SyncStateTracker.onUpload(appId);
          return rc;
        }, e.unAppID);
        Logger.info(`Syncing on game ${e.unAppID} stop`);
        await SyncTaskQeueue.addSyncTask(sync_cloud_first, GLOBAL_SYNC_APP_ID);
      }
    }
  });
}
