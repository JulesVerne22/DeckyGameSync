import { ReactNode } from "react";
import { Navigation, PanelSection } from "@decky/ui";
import RoutePage from "../components/routePage";
import Logger from "../helpers/logger";
import Container from "../components/container";

interface SyncTargetConfigPageParams {
  appId: string;
}

class SyncTargetConfigPage extends RoutePage<SyncTargetConfigPageParams> {
  readonly route = "sync-target"

  render(): ReactNode {
    const params = new URLSearchParams(window.location.search);
    Logger.debug('Sync Target config page query parameters:', Object.fromEntries(params));
    const appId = params.get('appId');
    if (appId === null) {
      Logger.error('Sync Target config page: appId is null');
      Navigation.NavigateBack();
    }


    return (
      <Container title="Sync Target Configuration">
        <PanelSection>
          Sync Target Configuration
        </PanelSection>
      </Container>
    );
  }
}

const syncTargetConfigPage = new SyncTargetConfigPage();
export default syncTargetConfigPage;
