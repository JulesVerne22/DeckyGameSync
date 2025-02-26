import { ButtonItem, Navigation, PanelSection, PanelSectionRow, ToggleField } from "@decky/ui";
import { useEffect, useState } from "react";
import { FaCloudUploadAlt, FaPlug, FaSave } from "react-icons/fa";
import { FiEdit3 } from "react-icons/fi";
import { AiOutlineCloudUpload } from "react-icons/ai";
import "../css/rotatingIcon.css"
import ApiClient, { GLOBAL_SYNC_APP_ID } from "../helpers/apiClient";
import DeckyStoreButton from "../components/DeckyStoreButton";
import * as Backend from "../helpers/backend";

// TODO
export function Content() {
  const [hasProvider, setHasProvider] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    ApiClient.getCloudBackend().then((e) => setHasProvider(!!e));
  }, []);

  const [syncInProgress, setSyncInProgress] = useState<boolean>((ApiClient.syncTaksQueue.size + ApiClient.syncTaksQueue.pending) <= 0);
  useEffect(() => {
    ApiClient.syncTaksQueue.on("add", () => setSyncInProgress(true));
    ApiClient.syncTaksQueue.on("idle", () => setSyncInProgress(false));

    return () => {
      ApiClient.syncTaksQueue.off("add");
      ApiClient.syncTaksQueue.off("idle");
    };
  }, []);


  return (
    <>
      <Head />
      <PanelSection title="Global Sync">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={syncInProgress || (!hasProvider)}
            onClick={() => {
              ApiClient.startSyncUnblocked(Backend.sync_cloud_first, GLOBAL_SYNC_APP_ID);
            }}
          >
            <DeckyStoreButton icon={<FaSave className={syncInProgress ? "cloud-save-fork-rotating-icon" : ""} />}>
              Sync Now
            </DeckyStoreButton>
          </ButtonItem>
          {hasProvider === false && <small>{'Cloud Storage Provider is not configured. Please configure it in "Cloud Provider"'}.</small>}
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
            <DeckyStoreButton icon={<FiEdit3 />}>{Translator.translate("sync.paths")}</DeckyStoreButton>
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
            <DeckyStoreButton icon={<AiOutlineCloudUpload />}>{Translator.translate("cloud.provider")}</DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title={Translator.translate("log.files")}>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              (async () => {
                let logs = await Backend.getPluginLog();
                if (logs == "" || logs == null || logs == undefined) {
                  logs = Translator.translate("no.available.logs");
                }
                Storage.setSessionStorageItem("pluginLogs", logs);
                Navigation.Navigate("/dcs-plugin-logs");
                Navigation.CloseSideMenus();
              })();
            }}
          >
            <DeckyStoreButton icon={<FaPlug />}>{Translator.translate("app.logs")}</DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={appState.syncing === "true" || !hasProvider}
            onClick={() => {
              (async () => {
                let logs = await Backend.getLastSyncLog();
                if (logs == "" || logs == null || logs == undefined) {
                  logs = Translator.translate("no.available.logs");
                }
                Storage.setSessionStorageItem("syncLogs", logs);
                Navigation.Navigate("/dcs-sync-logs");
                Navigation.CloseSideMenus();
              })();
            }}
          >
            <DeckyStoreButton icon={<FaCloudUploadAlt />}>{Translator.translate("sync.logs")}</DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title={Translator.translate("experimental.use.risk")}>
        <PanelSectionRow>
          <ToggleField
            label={Translator.translate("bidirectional.sync")}
            checked={appState.bisync_enabled === "true"}
            onChange={(e) => ApplicationState.setAppState("bisync_enabled", e ? "true" : "false", true)}
          />
        </PanelSectionRow>
      </PanelSection>
    </>
  );
};