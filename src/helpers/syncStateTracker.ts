import { PLUGIN_NAME_AS_PATH } from "./commonDefs";
import Config from "./config";

class SyncStateTracker {
  private get autoSync(): boolean {
    return Config.get("sync_on_game_start") && Config.get("sync_on_game_stop");
  }

  private getKey(appId: number): string {
    return `${PLUGIN_NAME_AS_PATH}-in-sync-${appId}`;
  }

  public onDownload(appId: number) {
    if (this.autoSync) {
      localStorage.setItem(this.getKey(appId), "");
    }
  }

  public onUpload(appId: number) {
    if (this.autoSync) {
      localStorage.removeItem(this.getKey(appId));
    }
  }

  public isInSync(appId: number): boolean {
    return !(this.autoSync && this.getKey(appId) in localStorage);
  }
}

const syncStateTracker = new SyncStateTracker();
export default syncStateTracker;
