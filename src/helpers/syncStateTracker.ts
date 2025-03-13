import { PLUGIN_NAME_AS_PATH } from "./commonDefs";
import Config from "./config";

class SyncStateTracker {
  private get autoSync(): boolean {
    return Config.get("sync_on_game_start") && Config.get("sync_on_game_stop");
  }

  private getKey(appId: number): string {
    return `${PLUGIN_NAME_AS_PATH}-in-sync-${appId}`;
  }

  public setInSync(appId: number, inSync: boolean) {
    if (this.autoSync) {
      if (inSync) {
        localStorage.removeItem(this.getKey(appId));
      } else {
        localStorage.setItem(this.getKey(appId), "");
      }
    }
  }

  // Key existence means out of sync
  public getInSync(appId: number): boolean {
    return !(this.autoSync && this.getKey(appId) in localStorage);
  }
}

const syncStateTracker = new SyncStateTracker();
export default syncStateTracker;
