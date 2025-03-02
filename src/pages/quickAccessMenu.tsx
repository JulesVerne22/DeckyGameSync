import { useEffect, useState } from "react";
import { FaFileUpload, FaPlug, FaSave } from "react-icons/fa";
// import { FiEdit3 } from "react-icons/fi";
// import { AiOutlineCloudUpload } from "react-icons/ai";
import { ButtonItem, PanelSection, PanelSectionRow, ToggleField } from "@decky/ui";
// import Styles from "../styles.css";
import ApiClient, { GLOBAL_SYNC_APP_ID } from "../helpers/apiClient";
import DeckyStoreButton from "../components/deckyStoreButton";
import * as Popups from "../components/popups";
import PluginLogsPage from "./pluginLogsPage";
import Config from "../helpers/config";
import * as Backend from "../helpers/backend";

export function Content() {
  const [auto_global_sync] = useState<boolean>(Config.get("auto_global_sync"));
  const [screenshot_upload_enable, set_screenshot_upload_enable] = useState<boolean>(Config.get("screenshot_upload_enable"));
  const [screenshot_delete_after_upload] = useState<boolean>(Config.get("screenshot_delete_after_upload"));
  const [advanced_options, set_advanced_options] = useState<boolean>(Config.get("advanced_options"));
  const [strict_game_sync] = useState<boolean>(Config.get("strict_game_sync"));


  const [hasProvider, setHasProvider] = useState<boolean>(false);
  useEffect(() => {
    ApiClient.getCloudBackend().then((e) => setHasProvider(Boolean(e)));
  }, []);

  const [syncInProgress] = useState<boolean>(false);
  // const [syncInProgress, setSyncInProgress] = useState<boolean>((ApiClient.syncTaksQueue.size + ApiClient.syncTaksQueue.pending) <= 0);
  // useEffect(() => {
  //   ApiClient.syncTaksQueue.on("add", () => setSyncInProgress(true));
  //   ApiClient.syncTaksQueue.on("idle", () => setSyncInProgress(false));

  //   return () => {
  //     ApiClient.syncTaksQueue.off("add");
  //     ApiClient.syncTaksQueue.off("idle");
  //   };
  // }, []);

  return (
    <>
      <PanelSection title="Global Sync">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={syncInProgress || (!hasProvider)}
            onClick={() => {
              ApiClient.startSyncUnblocked(Backend.sync_cloud_first, GLOBAL_SYNC_APP_ID);
            }}
          >
            {/* <DeckyStoreButton icon={<FaSave className={syncInProgress ? Styles.cloudSaveForkRotatingIcon : ""} />}>
              Sync Now
            </DeckyStoreButton> */}
          </ButtonItem>
          {hasProvider === false && <small>{'Cloud Storage Provider is not configured. Please configure it in "Cloud Provider"'}.</small>}
        </PanelSectionRow>

        <PanelSectionRow>
          <ToggleField
            disabled={!hasProvider}
            label="Sync on game start/stop"
            checked={auto_global_sync}
            onChange={(e) => {
              Config.set("auto_global_sync", e);
            }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Screenshots">
        <PanelSectionRow>
          <ToggleField
            disabled={!hasProvider}
            label="Upload screenshots"
            checked={screenshot_upload_enable}
            onChange={(e) => {
              Config.set("screenshot_upload_enable", e);
              set_screenshot_upload_enable(e); // to trigger re-render
            }}
          />
        </PanelSectionRow>
        {screenshot_upload_enable && (<>
          <PanelSectionRow>
            <ToggleField
              label="Delete local copy"
              checked={screenshot_delete_after_upload}
              onChange={(e) => {
                Config.set("screenshot_delete_after_upload", e);
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() =>
                Popups.textInputPopup("Screenshot Upload Destination",
                  Config.get("screenshot_destination_directory"),
                  (e) => Config.set("screenshot_destination_directory", e))}
            >
              <DeckyStoreButton icon={<FaFileUpload />}>
                Upload Destination
              </DeckyStoreButton>
            </ButtonItem>
          </PanelSectionRow>
        </>)}
      </PanelSection>

      {/* <PanelSection title="Configuration">
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
      </PanelSection> */}

      <PanelSection title="Logs">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={PluginLogsPage.enter}
          >
            <DeckyStoreButton icon={<FaPlug />}>Plugin Log</DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>
        {/* <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={syncInProgress || (!hasProvider)}
            onClick={() => {
              (async () => {
                Navigation.Navigate("/dcs-sync-logs");
                Navigation.CloseSideMenus();
              })();
            }}
          >
            <DeckyStoreButton icon={<FaCloudUploadAlt />}>Global Sync Log</DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow> */}
      </PanelSection>

      <PanelSection title="Advanced Options">
        <PanelSectionRow>
          <ToggleField
            label="Enable"
            checked={advanced_options}
            onChange={(e) => {
              if (e) {
                Popups.confirmPopup("Show Advanced Options",
                  "Advanced options are only for those who understand what they are doing. " +
                  "Using them without caution may cause unrecoverable data loss! " +
                  'Click "Confirm" to continue.',
                  () => Config.set("advanced_options", true));
              } else {
                Config.set("advanced_options", false);
                set_advanced_options(false); // to trigger re-render
              }
            }}
          />
        </PanelSectionRow>
        {advanced_options && (<>
          <PanelSectionRow>
            <ToggleField
              label="Strict Game Sync"
              checked={strict_game_sync}
              onChange={(e) => {
                if (e) {
                  Popups.confirmPopup("Enable Strict Game Sync",
                    'This will change rclone to from "COPY" mode to "SYNC" mode, ' +
                    "which allows it to DELETE ANY FILE on (cloud/local) to make it match the source (local/cloud). " +
                    'Click "Confirm" to continue.',
                    () => Config.set("strict_game_sync", true))
                } else {
                  Config.set("strict_game_sync", false);
                }
              }}
            />
          </PanelSectionRow>
        </>)}
      </PanelSection>
    </>
  );
};