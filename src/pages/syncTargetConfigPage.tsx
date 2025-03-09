import { ReactNode } from "react";
import { Navigation, SidebarNavigation } from "@decky/ui";
import RoutePage from "../components/routePage";
import Logger from "../helpers/logger";
import LogsView from "../components/logsView";
import { get_last_sync_log } from "../helpers/backend";
import { FaFileAlt } from "react-icons/fa";
import { CSS_MAX_VIEWABLE_HIGHT } from "../helpers/commonDefs";

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
      Logger.error(`Sync Target config page: appId is not a number: ${appId}`);
      Navigation.NavigateBack();
    }

    return <SidebarNavigation
      pages={[
        {
          title: "Sync Logs 1",
          content: <LogsView title="Plugin Logs 1" getLog={async () => await get_last_sync_log(appId)} />
        },
        {
          title: "Sync Logs 2",
          content: <LogsView title="Plugin Logs 2" getLog={async () => await get_last_sync_log(appId)} />
        },
        {
          title: "Sync Logs",
          content: <div
            style={{
              height: CSS_MAX_VIEWABLE_HIGHT,
              marginTop: "-24px",
              position: "fixed",
            }}
          ><LogsView title="Sync Logs" getLog={async () => await get_last_sync_log(appId)} /></div>,
          icon: <FaFileAlt />,
          hideTitle: true,
        },
      ]}
    />
  }
}

const syncTargetConfigPage = new SyncTargetConfigPage();
export default syncTargetConfigPage;
