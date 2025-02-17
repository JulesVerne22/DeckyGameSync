import { LifetimeNotification } from "@decky/ui";
import * as Backend from "./backend";
import Logger from '../helpers/logger';

export function setupAppLifetimeNotificationsHandler(): {unregister: () => void} {
  return SteamClient.GameSessions.RegisterForAppLifetimeNotifications((e: LifetimeNotification) => {
    if (e.bRunning) {
      Logger.info(`Starting game ${e.unAppID}`, e);
      Backend.sync_cloud_first(e.unAppID).then(() => {
      });
    } else {
      Logger.info(`Stopping game ${e.unAppID}`, e);
      Backend.sync_local_first(e.unAppID).then(() => {
      });
    }
  });
}

/**
 * Retrieves the cloud backend type.
 * @returns A string representing the cloud backend type.
 */
export async function getCloudBackend(): Promise<string | undefined> {
  const backend_type = await Backend.get_backend_type();
    switch (backend_type) {
      case "type = onedrive\n":
        return "OneDrive";
      case "type = drive\n":
        return "Google Drive";
      case "type = dropbox\n":
        return "Dropbox";
      case undefined:
        return undefined;
      default:
        return "Other: " + backend_type;
    }
}

// /**
//  * Retrieves synchronization paths.
//  * @param file - The type of file.
//  * @returns An array of synchronization paths.
//  */
// export async function getSyncPaths(file: "includes" | "excludes") {
//   return ApplicationState.getServerApi()
//     .callPluginMethod<{ file: "includes" | "excludes" }, string[]>("get_syncpaths", { file })
//     .then((r: { success: any; result: any[]; }) => {
//       if (r.success) {
//         if (r.result.length === 0) {
//           return [];
//         }

//         r.result.sort();
//         while (r.result[0] === "\n") {
//           r.result = r.result.slice(1);
//         }

//         return r.result.map((r: string) => r.trimEnd());
//       } else {
//         Toast.toast(r.result);
//         return [];
//       }
//     });
// }

// /**
//  * Internal method for synchronizing data.
//  * @param showToast - Whether to show toast notifications.
//  * @param winner - The winner of the synchronization.
//  * @param resync - Whether to force a full resync.
//  * @returns A Promise that resolves when synchronization is complete.
//  */
// async function syncNowInternal(showToast: boolean, winner: string, resync: boolean = false): Promise<void> {
//   Logger.info("Synchronizing");
//   const start = new Date();
//   if (ApplicationState.getAppState().currentState.syncing) {
//     Toast.toast("Waiting for previous sync", 2000);
//     while (ApplicationState.getAppState().currentState.syncing) {
//       await sleep(300);
//     }
//   }

//   ApplicationState.setAppState("syncing", true);
//   await ApplicationState.getServerApi().callPluginMethod("sync_now_internal", { winner, resync });

//   let exitCode = 0;
//   while (true) {
//     const status = await ApplicationState.getServerApi().callPluginMethod<{}, number | undefined>("sync_now_probe", {});

//     if (status.success && status.result != null) {
//       exitCode = status.result;
//       break;
//     }

//     await sleep(360);
//   }

//   const timeDiff = ((new Date().getTime() - start.getTime()) / 1000);
//   Logger.info("Sync finished in " + timeDiff + "s");

//   let pass;
//   switch (exitCode) {
//     case 0:
//     case 6:
//       pass = true;
//       break;
//     default:
//       pass = false;
//       break;
//   }
//   ApplicationState.setAppState("syncing", false);

//   let body;
//   let time = 2000;
//   let action = () => { Navigation.Navigate("/dcs-sync-logs"); };

//   // const syncLogs = await Backend.getLastSyncLog();
//   // Storage.setSessionStorageItem("syncLogs", syncLogs);

//   if (pass) {
//     body = `Sync completed in ${timeDiff}s`;
//   } else {
//     body = "Error. Click here to see the errors.";
//     time = 15000;
//   }

//   if (showToast || (!pass)) {
//     Toast.toast(body, time, action);
//   }

//   // Additional check for if there were any conflicts.
//   // if (syncLogs.match(/Moved \(server-side\) to: .*\.conflict\d*/)) {
//   //   Toast.toast(Translator.translate("sync.conflict"), 5000, () => { Navigation.Navigate("/dcs-sync-logs"); })
//   // }
// }