import { PLUGIN_NAME_AS_PATH } from "./commonDefs";
import Config from "./config";

function autoSync(): boolean {
  return Config.get("sync_on_game_start") && Config.get("sync_on_game_stop");
}

function getKey(appId: number): string {
  return `${PLUGIN_NAME_AS_PATH}-in-sync-${appId}`;
}

export function setInSync(appId: number, inSync: boolean) {
  if (autoSync()) {
    if (inSync) {
      localStorage.removeItem(getKey(appId));
    } else {
      localStorage.setItem(getKey(appId), "");
    }
  }
}

// Key existence means out of sync
export function getInSync(appId: number): boolean {
  return !(autoSync() && getKey(appId) in localStorage);
}
