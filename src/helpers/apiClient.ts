import { sleep, LifetimeNotification, Navigation } from "@decky/ui";
import * as Backend from "./backend";
import Logger from '../helpers/logger';
import Toaster from "./toaster";

const GLOBAL_SYNC_APP_ID = 0;
const SYNC_STATE_MAP: Map<number, boolean> = new Map<number, boolean>();

export function setupAppLifetimeNotificationsHandler(): {unregister: () => void} {
  return SteamClient.GameSessions.RegisterForAppLifetimeNotifications((e: LifetimeNotification) => {
    if (e.bRunning) {
      Logger.info(`Starting game ${e.unAppID}`);
      startSyncUnblocked(Backend.sync_cloud_first, GLOBAL_SYNC_APP_ID);
      startSyncBlocked(Backend.sync_cloud_first, e);
    } else {
      Logger.info(`Stopping game ${e.unAppID}`);
      startSyncUnblocked(Backend.sync_local_first, GLOBAL_SYNC_APP_ID);
      startSyncUnblocked(Backend.sync_local_first, e.unAppID);
    }
  });
}

async function startSyncUnblocked(syncFunction: (appId: number) => Promise<number>, appId: number) {
  if (SYNC_STATE_MAP.get(appId) === true) {
    Logger.info(`Sync triggered for target "${appId}" while the previous one is still in progress`);
    let waitCount = 0;
    while (SYNC_STATE_MAP.get(appId) === true) {
      await sleep(300);
      // if previous sync takes too long (>= 30 seconds), let the user know
      if ((++waitCount) == 100) {
        Toaster.toast("Waiting for previous sync to finish")
      }
    }
  }

  SYNC_STATE_MAP.set(appId, true);
  let startTime = new Date().getTime();
  let exitCode = await syncFunction(appId);
  let timeDiff = (new Date().getTime() - startTime) / 1000;
  SYNC_STATE_MAP.set(appId, false);

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
  for (let i = 0; i < 10; i++) {
    console.log("Sleeping to emulate slow sync");
    await sleep(1000);
  }
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
