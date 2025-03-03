import { LifetimeNotification } from "@decky/ui";
import { sync_screenshot, sync_cloud_first, sync_local_first } from "./backend";
import * as Defs from "./commonDefs";
import Logger from "./logger";
import Toaster from "./toaster";
import Config from "./config";
import SyncTaskQeueue from "./syncTaskQueue";

function getCurrentUserId(): number {
  return Number(BigInt.asUintN(32, BigInt(window.App.m_CurrentUser.strSteamID)));
};

class ApiClient {
  public setupScreenshotNotification(): Unregisterable {
    return SteamClient.GameSessions.RegisterForScreenshotNotification(async (e: ScreenshotNotification) => {
      if (Config.get("screenshot_upload_enable") && e.details && e.strOperation == "written") {
        let exitCode = await sync_screenshot(getCurrentUserId(), e.details.strUrl);
        if (exitCode == 0 && Config.get("screenshot_delete_after_upload")) {
          if (await SteamClient.Screenshots.DeleteLocalScreenshot(e.details.strGameID, e.details.hHandle)) {
            Logger.info(`Screenshot ${e.details.strUrl} uploaded and deleted locally`);
          } else {
            Logger.warning(`Failed to delete screenshot ${e.details.strUrl} locally`);
            Toaster.toast("Failed to delete the screenshot locally");
          }
        } else {
          Logger.error(`Failed to upload screenshot ${e.details.strUrl}, exit code: ${exitCode}`);
          Toaster.toast(`Failed to upload the screenshot, exit code: ${exitCode}`);
        }
      }
    });
  }

  public setupAppLifetimeNotificationsHandler(): Unregisterable {
    return SteamClient.GameSessions.RegisterForAppLifetimeNotifications(async (e: LifetimeNotification) => {
      if (e.bRunning) {
        Logger.info(`Starting game ${e.unAppID}`);
        await SyncTaskQeueue.addBlockedSyncTask(sync_cloud_first, e.unAppID, e.nInstanceID);
        if (Config.get("auto_global_sync")) {
          await SyncTaskQeueue.addUnblockedSyncTask(sync_local_first, Defs.GLOBAL_SYNC_APP_ID);
        }
      } else {
        Logger.info(`Stopping game ${e.unAppID}`);
        await SyncTaskQeueue.addUnblockedSyncTask(sync_local_first, e.unAppID);
        if (Config.get("auto_global_sync")) {
          await SyncTaskQeueue.addUnblockedSyncTask(sync_cloud_first, Defs.GLOBAL_SYNC_APP_ID);
        }
      }
    });
  }
}

const apiClient = new ApiClient();
export default apiClient;
