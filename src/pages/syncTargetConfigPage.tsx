import { ReactNode } from "react";
import { Navigation, SidebarNavigation } from "@decky/ui";
import RoutePage from "../components/routePage";
import Logger from "../helpers/logger";
import LogsView from "../components/logsView";
import { get_last_sync_log } from "../helpers/backend";
import { FaFileAlt } from "react-icons/fa";
import { CSS_MAX_VIEWABLE_HEIGHT as CSS_MAX_VIEWABLE_HEIGHT } from "../helpers/commonDefs";
import Toaster from "../helpers/toaster";

interface SyncTargetConfigPageParams {
  appId: string;
}

class SyncTargetConfigPage extends RoutePage<SyncTargetConfigPageParams> {
  readonly route = "sync-target"

  render(): ReactNode {
    const params = new URLSearchParams(window.location.search);
    Logger.debug('Sync Target config page query parameters:', Object.fromEntries(params));

    const appId = Number(params.get('appId'));
    if (isNaN(appId)) {
      const msg = `Sync Target config page: appId is not a number: ${appId}`;
      Logger.error(msg);
      Toaster.toast(msg);
      Navigation.NavigateBack();
    }

    return <SidebarNavigation
      pages={[
        {
          title: "Target Filter",
          content: <LogsView title="Target Filter" getLog={async () => await get_last_sync_log(appId)} />
        },
        {
          title: "Shared Filter",
          content: <LogsView title="Shared Filter" getLog={async () => await get_last_sync_log(appId)} />
        },
        {
          title: "Sync Logs",
          icon: <FaFileAlt />,
          hideTitle: true,
          content:
            <div style={{
              height: CSS_MAX_VIEWABLE_HEIGHT,
              marginTop: "-24px",
              position: "fixed",
            }}>
              <LogsView title="Sync Logs" getLog={async () => await get_last_sync_log(appId)} />
            </div>,
        },
      ]}
    />
  }
}

const syncTargetConfigPage = new SyncTargetConfigPage();
export default syncTargetConfigPage;
