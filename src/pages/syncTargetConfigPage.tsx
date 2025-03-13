import { ReactNode, useEffect, useState } from "react";
import { IoArrowUpCircle, IoArrowDownCircle } from "react-icons/io5";
import { FaCloudArrowUp, FaCloudArrowDown } from "react-icons/fa6";
import { Navigation, SidebarNavigation } from "@decky/ui";
import { getAppName } from "../helpers/utils";
import { get_last_sync_log, get_target_filters, set_target_filters, get_shared_filters, set_shared_filters, sync_local_first, sync_cloud_first, resync_local_first, resync_cloud_first } from "../helpers/backend";
import RoutePage from "../components/routePage";
import LogsView from "../components/logsView";
import FiltersView from "../components/filtersView";
import Logger from "../helpers/logger";
import Toaster from "../helpers/toaster";
import SyncTaskQueue from "../helpers/syncTaskQueue";
import IconButton from "../components/iconButton";
import { GLOBAL_SYNC_APP_ID } from "../helpers/commonDefs";
import { confirmPopup } from "../components/popups";

interface SyncTargetConfigPageParams {
  appId: string;
}

class SyncTargetConfigPage extends RoutePage<SyncTargetConfigPageParams> {
  readonly route = "sync-target"

  protected _register(): UnregisterFunction {
    const registrations: Array<Unregisterable> = [];

    registrations.push({ unregister: super._register() });
    registrations.push(SyncTaskQueue.on(SyncTaskQueue.events.FAIL_TOAST_CLICK, (appId) => this.enter({ appId: appId })));

    return (() => registrations.forEach(e => e.unregister()))
  }

  render(): ReactNode {
    const params = new URLSearchParams(window.location.search);
    Logger.debug('Sync Target config page query parameters:', Object.fromEntries(params));

    const appId = Number(params.get('appId'));
    if (isNaN(appId)) {
      Logger.error(`Invalid appId for sync target config page, params: ${params}`);
      Toaster.toast("Invalid appId for sync target config page");
      Navigation.NavigateBack();
    }

    const appName = getAppName(appId);

    const [syncInProgress, setSyncInProgress] = useState<boolean>(SyncTaskQueue.busy);
    useEffect(() => {
      const registrations: Array<Unregisterable> = [];
      registrations.push(SyncTaskQueue.on(SyncTaskQueue.events.BUSY, setSyncInProgress));
      return () => {
        registrations.forEach(e => e.unregister());
      };
    }, []);

    return <SidebarNavigation
      pages={[
        {
          title: "Target Filter",
          hideTitle: true,
          content:
            <FiltersView
              title="Target Filter"
              description={`Filters specific for ${appName} sync. It will be used together with the shared filter, but has a lower priority.`}
              fullPage={false}
              getFiltersFunction={() => get_target_filters(appId)}
              setFiltersFunction={(filters) => set_target_filters(appId, filters)}
            >
              <IconButton
                icon={FaCloudArrowUp}
                onOKActionDescription="Sync Now (Upload to Cloud)"
                disabled={syncInProgress}
                onClick={() => SyncTaskQueue.addSyncTask(sync_local_first, appId)}>
              </IconButton>
              <IconButton
                icon={FaCloudArrowDown}
                onOKActionDescription="Sync Now (Download from Cloud)"
                disabled={syncInProgress}
                onClick={() => SyncTaskQueue.addSyncTask(sync_cloud_first, appId)}>
              </IconButton>
            </FiltersView>
        },
        {
          title: "Shared Filter",
          hideTitle: true,
          content:
            <FiltersView
              title="Shared Filter"
              description="Filters that's shared among all syncs. It will be used together with the target filter, but has a higher priority."
              fullPage={false}
              getFiltersFunction={get_shared_filters}
              setFiltersFunction={(filters) => set_shared_filters(filters)}
            />
        },
        {
          title: "Sync Logs",
          // icon: <FaFileAlt />,
          hideTitle: true,
          content:
            <LogsView
              title="Sync Logs"
              getLog={async () => await get_last_sync_log(appId)}
              fullPage={false}
            >
              {(appId == GLOBAL_SYNC_APP_ID) && (
                <>
                  <IconButton
                    icon={IoArrowUpCircle}
                    onOKActionDescription="Resync (Local First)"
                    disabled={syncInProgress}
                    onClick={() => confirmPopup(
                      "Resync (Local First)",
                      <span>
                        Starting resync, this may take some time.<br /><br />
                        Click "Confirm" to continue.
                      </span>,
                      () => SyncTaskQueue.addSyncTask(async _ => await resync_local_first(), GLOBAL_SYNC_APP_ID)
                    )}>
                  </IconButton>
                  <IconButton
                    icon={IoArrowDownCircle}
                    onOKActionDescription="Resync (Cloud First)"
                    disabled={syncInProgress}
                    onClick={() => confirmPopup(
                      "Resync (Cloud First)",
                      <span>
                        Starting resync, this may take some time.<br /><br />
                        Click "Confirm" to continue.
                      </span>,
                      () => SyncTaskQueue.addSyncTask(async _ => await resync_cloud_first(), GLOBAL_SYNC_APP_ID)
                    )}>
                  </IconButton>
                </>)}
            </LogsView>
        },
      ]}
    />
  }
}

const syncTargetConfigPage = new SyncTargetConfigPage();
export default syncTargetConfigPage;
