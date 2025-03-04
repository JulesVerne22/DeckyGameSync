import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { Navigation } from "@decky/ui";
import { GLOBAL_SYNC_APP_ID } from "./commonDefs"
import Logger from "./logger"
import Toaster from "./toaster";
import Config from "./config";
import { sync_screenshot, get_available_sync_targets, pause_process, resume_process } from "./backend"

async function worker(fn: () => Promise<number>): Promise<number | undefined> {
  try {
    return await fn();
  } catch (error) {
    Logger.error('Error processing task:', error);
  }

  return undefined;
}

class SyncTaskQueue extends EventTarget {
  public readonly events = {
    BUSY: 'busy'
  }

  private readonly queue: queueAsPromised<any>;
  private availableSyncTargets: Set<number> = new Set<number>;

  public constructor() {
    super();
    this.queue = fastq.promise(worker, 1)
    this.queue.drain = () => {
      Logger.debug("All tasks finished")
      this.dispatchEvent(new CustomEvent(this.events.BUSY, { detail: false }));
    };
    this.updateAvailableSyncTargets();
  }

  public get busy() {
    return (!this.queue.idle());
  }

  public async addSyncTask(syncFunction: (appId: number) => Promise<number>, appId: number, pId?: number) {
    if (this.availableSyncTargets.has(appId)) {
      if (pId) {
        await pause_process(pId);
      }
      this.pushTask(async () => await syncFunction(appId))
        .then((exitCode) => {
          if (exitCode == 0 || exitCode == 6) {
            Logger.info(`Sync for "${appId}" finished`);
          } else {
            let appName: string | undefined;
            if (appId == GLOBAL_SYNC_APP_ID) {
              appName = "global";
            } else {
              appName = window.appStore.GetAppOverviewByAppID(appId)?.display_name;
            }
            let msg = `Sync for "${appName}" failed with exit code ${exitCode}`;
            Logger.error(msg);
            Toaster.toast(`${msg}, click here to see the errors`, 10000, () => { Navigation.Navigate("/dcs-sync-logs"); });
          }
        })
        .finally(() => {
          if (pId) {
            resume_process(pId);
          }
        });
    }
  }

  public async addScreenshotSyncTask(userId: number, screenshotUrl: string, gameId: string, handle: number) {
    this.pushTask(async () => await sync_screenshot(userId, screenshotUrl))
      .then((exitCode) => {
        if (exitCode == 0 && Config.get("screenshot_delete_after_upload")) {
          SteamClient.Screenshots.DeleteLocalScreenshot(gameId, handle)
            .then(() =>
              Logger.info(`Screenshot ${screenshotUrl} uploaded and deleted locally`))
            .catch(() => {
              Logger.warning(`Failed to delete screenshot ${screenshotUrl} locally`);
              Toaster.toast("Failed to delete the screenshot locally");
            })
        } else {
          Logger.error(`Failed to upload screenshot ${screenshotUrl}, exit code: ${exitCode}`);
          Toaster.toast(`Failed to upload the screenshot, exit code: ${exitCode}`);
        }
      });
  }

  private async pushTask(fn: () => Promise<number>): Promise<number | undefined> {
    if (this.queue.idle()) {
      Logger.debug("Starting task");
      this.dispatchEvent(new CustomEvent(this.events.BUSY, { detail: true }));
    }
    return await this.queue.push(fn);
  }

  public updateAvailableSyncTargets() {
    get_available_sync_targets().then((targets) => {
      Logger.debug("Available sync targets:", targets);
      this.availableSyncTargets = new Set(targets);
    })
  }
}

const syncTaskQueue = new SyncTaskQueue();
export default syncTaskQueue;
