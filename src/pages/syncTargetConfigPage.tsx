import { ReactNode, useEffect } from "react";
import { PanelSection } from "@decky/ui";
import RoutePage from "../components/routePage";
import Logger from "../helpers/logger";
import Container from "../components/container";

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
