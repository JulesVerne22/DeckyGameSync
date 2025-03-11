import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { sync_screenshot, pause_process, resume_process } from "./backend";
import { getAppName } from "./utils";
import Observable from "../types/observable";
import Logger from "./logger"
import Toaster from "./toaster";
import Config from "./config";
import SyncFilters from "./syncFilters";

async function worker(fn: () => Promise<number>): Promise<number | undefined> {
  try {
    return await fn();
  } catch (error) {
    Logger.error('Error processing task:', error);
  }

  return undefined;
}

class SyncTaskQueue extends Observable {
  public readonly events = {
    BUSY: 'busy',
    FAIL_TOAST_CLICK: 'failToastClick',
  }

  private readonly queue: queueAsPromised<any>;

  public constructor() {
    super();
    this.queue = fastq.promise(worker, 1)
    this.queue.drain = () => {
      Logger.debug("All tasks finished")
      this.emit(this.events.BUSY, false);
    };
  }

  public get busy() {
    return (!this.queue.idle());
  }

  public async addSyncTask(syncFunction: (appId: number) => Promise<number>, appId: number, pId?: number) {
    if (SyncFilters.has(appId)) {
      if (pId) {
        await pause_process(pId);
      }
      this.pushTask(async () => await syncFunction(appId))
        .then((exitCode) => {
          if (exitCode == 0 || exitCode == 6) {
            Logger.info(`Sync for "${appId}" finished`);
          } else {
            let appName = getAppName(appId);
            let msg = `Sync for "${appName}" failed with exit code ${exitCode}`;
            Logger.error(msg);
            Toaster.toast(`${msg}, click to see the errors`, 10000, () => { this.emit(this.events.FAIL_TOAST_CLICK, appId) });
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
        if (exitCode == 0 && Config.get("capture_delete_after_upload")) {
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
      this.emit(this.events.BUSY, true);
    }
    return await this.queue.push(fn);
  }
}

const syncTaskQueue = new SyncTaskQueue();
export default syncTaskQueue;
