import { GLOBAL_SYNC_APP_ID, SHARED_FILTER_APP_ID, PLUGIN_NAME_AS_PATH } from "./commonDefs";
import { update_rclone } from "./backend";
import * as Toaster from "./toaster";

export function getAppName(appId: number): string {
  if (appId == GLOBAL_SYNC_APP_ID) {
    return "global"
  } else if (appId == SHARED_FILTER_APP_ID) {
    return "shared"
  } else {
    return String(window.appStore.GetAppOverviewByAppID(appId)?.display_name);
  }
}

export function getCurrentUserId(): number {
  return Number(BigInt.asUintN(32, BigInt(window.App.m_CurrentUser.strSteamID)));
};

export function reduceSlashes(input: string): string {
  return input.replace(/\/+/g, '/');
}

export function clearLocalStorage() {
  Object.keys(localStorage)
    .filter(key => key.startsWith(PLUGIN_NAME_AS_PATH))
    .forEach(key => localStorage.removeItem(key));
}

export function updateRclone() {
  update_rclone()
    .then(() => Toaster.toast("Rclone is now the latest"))
    .catch(() => Toaster.toast("Error updating rclone"));
}
