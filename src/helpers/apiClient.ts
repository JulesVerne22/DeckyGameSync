import { sleep, LifetimeNotification, Navigation } from "@decky/ui";
import * as Backend from "./backend";
import Logger from '../helpers/logger';
import Toaster from "./toaster";
import Config from "./config";

const GLOBAL_SYNC_APP_ID = 0;
var sync_in_progress = false;

export function setupScreenshotNotification(): Unregisterable {
  return SteamClient.GameSessions.RegisterForScreenshotNotification(async (e: ScreenshotNotification) => {
    if (Config.get("screenshot_upload_enable") && e.details && e.strOperation == "written") {
      let exitCode = await Backend.sync_screenshot(getCurrentUserId(), e.details.strUrl);
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

/**
 * Gets the current user's steam id.
 * @returns The user's steam id.
 */
function getCurrentUserId(): number {
  return Number(BigInt.asUintN(32, BigInt(window.App.m_CurrentUser.strSteamID)));
};

export function setupAppLifetimeNotificationsHandler(): Unregisterable {
  return SteamClient.GameSessions.RegisterForAppLifetimeNotifications(async (e: LifetimeNotification) => {
    if (e.bRunning) {
      Logger.info(`Starting game ${e.unAppID}`);
      await startSyncBlocked(Backend.sync_cloud_first, e);
      startSyncUnblocked(Backend.sync_cloud_first, GLOBAL_SYNC_APP_ID);
    } else {
      Logger.info(`Stopping game ${e.unAppID}`);
      await startSyncUnblocked(Backend.sync_local_first, e.unAppID);
      startSyncUnblocked(Backend.sync_local_first, GLOBAL_SYNC_APP_ID);
    }
  });
}

async function startSyncUnblocked(syncFunction: (appId: number) => Promise<number>, appId: number) {
  if (sync_in_progress === true) {
    Logger.info(`Sync triggered for target "${appId}" while the previous one is still in progress`);
    let waitCount = 0;
    while (sync_in_progress === true) {
      await sleep(300);
      // if previous sync takes too long (>= 30 seconds), let the user know
      if ((++waitCount) == 100) {
        Toaster.toast("Waiting for previous sync to finish")
      }
    }
  }

  sync_in_progress = true;
  let startTime = new Date().getTime();
  let exitCode = await syncFunction(appId);
  let timeDiff = (new Date().getTime() - startTime) / 1000;
  sync_in_progress = false;

  if (exitCode == 0 || exitCode == 6) {
    Logger.info(`Sync for "${appId}" finished in ${timeDiff}s`);
  } else {
    let appName;
    if (appId == GLOBAL_SYNC_APP_ID) {
      appName = "global";
    } else {
      appName = window.appStore.GetAppOverviewByAppID(appId)?.display_name;
    }
    let msg = `Sync for "${appName}" failed with exit code ${exitCode} in ${timeDiff}s`;
    Logger.error(msg);
    Toaster.toast(`${msg}, click here to see the errors`, 10000, () => { Navigation.Navigate("/dcs-sync-logs"); });
  }
}

async function startSyncBlocked(syncFunction: (appId: number) => Promise<number>, e: LifetimeNotification) {
  await Backend.pause_process(e.nInstanceID);
  await startSyncUnblocked(syncFunction, e.unAppID);
  await Backend.resume_process(e.nInstanceID);
}

/**
 * Retrieves the cloud backend type.
 * @returns A string representing the cloud backend type.
 */
export async function getCloudBackend(): Promise<string> {
  const backend_type = await Backend.get_backend_type();
    switch (backend_type) {
      case "onedrive\n":
        return "OneDrive";
      case "drive\n":
        return "Google Drive";
      case "dropbox\n":
        return "Dropbox";
      default:
        return "Other: " + backend_type;
    }
}
