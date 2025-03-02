import { LifetimeNotification, Navigation } from "@decky/ui";
import * as Backend from "./backend";
import Logger from '../helpers/logger';
import Toaster from "./toaster";
import Config from "./config";

export const GLOBAL_SYNC_APP_ID = 0;

class ApiClient {
  private syncInProgress: boolean = false;

  public setupScreenshotNotification(): Unregisterable {
    return SteamClient.GameSessions.RegisterForScreenshotNotification(async (e: ScreenshotNotification) => {
      if (Config.get("screenshot_upload_enable") && e.details && e.strOperation == "written") {
        let exitCode = await Backend.sync_screenshot(this.getCurrentUserId(), e.details.strUrl);
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
  private getCurrentUserId(): number {
    return Number(BigInt.asUintN(32, BigInt(window.App.m_CurrentUser.strSteamID)));
  };

  public setupAppLifetimeNotificationsHandler(): Unregisterable {
    return SteamClient.GameSessions.RegisterForAppLifetimeNotifications(async (e: LifetimeNotification) => {
      if (e.bRunning) {
        Logger.info(`Starting game ${e.unAppID}`);
        await this.startSyncBlocked(Backend.sync_cloud_first, e.unAppID, e.nInstanceID);
        await this.startSyncUnblocked(Backend.sync_local_first, GLOBAL_SYNC_APP_ID);
      } else {
        Logger.info(`Stopping game ${e.unAppID}`);
        await this.startSyncUnblocked(Backend.sync_local_first, e.unAppID);
        await this.startSyncUnblocked(Backend.sync_cloud_first, GLOBAL_SYNC_APP_ID);
      }
    });
  }

  public async startSync(syncFunction: (appId: number) => Promise<number>, appId: number) {
    if ((appId == GLOBAL_SYNC_APP_ID) && (!Config.get("auto_global_sync"))) {
      return;
    }

    if (this.syncInProgress === true) {
      Logger.info(`Sync triggered for target "${appId}" while the previous one is still in progress`);
      let waitCount = 0;
      while (this.syncInProgress === true) {
        // await sleep(300);
        // if previous sync takes too long (>= 30 seconds), let the user know
        if ((++waitCount) == 100) {
          Toaster.toast("Waiting for previous sync to finish");
        }
      }
    }

    this.syncInProgress = true;
    let startTime = new Date().getTime();
    let exitCode = await syncFunction(appId);
    let timeDiff = (new Date().getTime() - startTime) / 1000;
    this.syncInProgress = false;

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

  public async startSyncUnblocked(syncFunction: (appId: number) => Promise<number>, appId: number) {
    await this.startSync(syncFunction, appId);
  }

  public async startSyncBlocked(syncFunction: (appId: number) => Promise<number>, appId: number, pId: number) {
    await Backend.pause_process(pId);
    await this.startSync(syncFunction, appId);
    await Backend.resume_process(pId);
  }

  /**
   * Retrieves the cloud cloud type.
   * @returns A string representing the cloud cloud type.
   */
  public async getCloudBackend(): Promise<string> {
    const cloud_type = await Backend.get_cloud_type();
    switch (cloud_type) {
      case "":
        return "";
      case "onedrive":
        return "OneDrive";
      case "drive":
        return "Google Drive";
      case "dropbox":
        return "Dropbox";
      default:
        return "Other: " + cloud_type;
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;
