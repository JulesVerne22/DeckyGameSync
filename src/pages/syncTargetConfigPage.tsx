import { ReactNode, useEffect } from "react";
import RoutePage from "../components/routePage";
import Logger from "../helpers/logger";

interface SyncTargetConfigPageParams {
  syncTargetId: string;
}

class SyncTargetConfigPage extends RoutePage<SyncTargetConfigPageParams> {
  readonly route = "sync-target"

  render(): ReactNode {
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      Logger.debug('Sync Target config page query parameters:', Object.fromEntries(params));
    }, []);

    return (
      <></>
    );
  }
}

const syncTargetConfigPage = new SyncTargetConfigPage();
export default syncTargetConfigPage;
