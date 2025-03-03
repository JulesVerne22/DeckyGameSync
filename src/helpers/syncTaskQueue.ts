import { EventEmitter } from "stream";
import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { Navigation } from "@decky/ui";
import * as Defs from "./commonDefs"
import Logger from "./logger"
import Toaster from "./toaster";
import { get_available_sync_targets, pause_process, resume_process } from "./backend"

async function startSync(syncFunction: (appId: number) => Promise<number>, appId: number) {
  let startTime = new Date().getTime();
  let exitCode = await syncFunction(appId);
  let timeDiff = (new Date().getTime() - startTime) / 1000;

  if (exitCode == 0 || exitCode == 6) {
    Logger.info(`Sync for "${appId}" finished in ${timeDiff}s`);
  } else {
    let appName: string | undefined;
    if (appId == Defs.GLOBAL_SYNC_APP_ID) {
      appName = "global";
    } else {
      appName = window.appStore.GetAppOverviewByAppID(appId)?.display_name;
    }
    let msg = `Sync for "${appName}" failed with exit code ${exitCode} in ${timeDiff}s`;
    Logger.error(msg);
    Toaster.toast(`${msg}, click here to see the errors`, 10000, () => { Navigation.Navigate("/dcs-sync-logs"); });
  }
}

async function worker(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    Logger.error('Error processing task:', error);
  }
}

class SyncTaskQueue extends EventEmitter {
  private readonly queue: queueAsPromised<any>;
  private availableSyncTargets: Set<number> = new Set<number>;

  public constructor() {
    super();
    this.queue = fastq.promise(worker, 1)
    this.queue.drain = () => {
      this.emit('idle');
    };
    this.updateAvailableSyncTargets();
  }

  public async addUnblockedSyncTask(syncFunction: (appId: number) => Promise<number>, appId: number) {
    if (appId in this.availableSyncTargets) {
      await this.pushTask(async () => {
        await startSync(syncFunction, appId);
      });
    }
  }

  public async addBlockedSyncTask(syncFunction: (appId: number) => Promise<number>, appId: number, pId: number) {
    if (appId in this.availableSyncTargets) {
      await pause_process(pId);
      await this.pushTask(async () => {
        await startSync(syncFunction, appId);
        await resume_process(pId);
      });
    }
  }

  private async pushTask(fn: () => Promise<void>): Promise<void> {
    if (this.queue.idle()) {
      this.emit('busy');
    }
    await this.queue.push(fn);
  }

  public updateAvailableSyncTargets() {
    get_available_sync_targets().then((targets) => {
      this.availableSyncTargets = new Set(targets);
      Logger.debug("Available sync targets:", this.availableSyncTargets);
    })
  }
}

const synkTaskQueue = new SyncTaskQueue();
export default synkTaskQueue;
