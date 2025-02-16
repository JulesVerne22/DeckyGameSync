import { ButtonItem, Navigation, PanelSection, PanelSectionRow } from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { FaSave } from "react-icons/fa";
import { FiEdit3 } from "react-icons/fi";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { ApiClient } from "../helpers/apiClient";
import Head from "../components/Head";
import DeckyStoreButton from "../components/DeckyStoreButton";
import { ApplicationState } from "../helpers/state";

// TODO
export const Content: VFC<{}> = () => {
  const appState = ApplicationState.useAppState();

  const [hasProvider, setHasProvider] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    ApiClient.getCloudBackend().then((e) => setHasProvider(!!e));
  }, []);

  return (
    <>
      <Head />
      <PanelSection title="Sync">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={appState.syncing || (!hasProvider)}
            onClick={() => {
              ApiClient.syncNow(true);
            }}
          >
            <DeckyStoreButton icon={<FaSave className={appState.syncing ? "dcs-rotate" : ""} />}>
              Sync Now
            </DeckyStoreButton>
          </ButtonItem>
          {hasProvider === false && <small>"Cloud Storage Provider is not configured. Please configure it in Cloud Provider"</small>}
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Configuration">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Navigation.CloseSideMenus();
              Navigation.Navigate("/dcs-configure-paths");
            }}
          >
            <DeckyStoreButton icon={<FiEdit3 />}>Sync Paths</DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Navigation.CloseSideMenus();
              Navigation.Navigate("/dcs-configure-backend");
            }}
          >
            <DeckyStoreButton icon={<AiOutlineCloudUpload />}>Cloud Provider</DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
};
