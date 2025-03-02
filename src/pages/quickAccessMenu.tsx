import { useEffect, useState } from "react";
import { FaFileUpload, FaPlug, FaSave } from "react-icons/fa";
import { BsGearFill } from "react-icons/bs";
// import { FiEdit3 } from "react-icons/fi";
// import { AiOutlineCloudUpload } from "react-icons/ai";
import { ButtonItem, ConfirmModal, DialogButton, Focusable, PanelSection, PanelSectionRow, showModal, staticClasses, TextField, ToggleField } from "@decky/ui";
// import Styles from "../styles.css";
import ApiClient, { GLOBAL_SYNC_APP_ID } from "../helpers/apiClient";
import DeckyStoreButton from "../components/deckyStoreButton";
import * as Popups from "../components/popups";
import PluginLogsPage from "./pluginLogsPage";
import Config from "../helpers/config";
import * as Backend from "../helpers/backend";

export function Title() {
  // const onSettingsClick = () => {
  //   Navigation.CloseSideMenus();
  //   Navigation.Navigate("/cssloader/settings");
  // };

  return (
    <Focusable
      style={{
        display: "flex",
        padding: "0",
        width: "100%",
        boxShadow: "none",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      className={staticClasses.Title}
    >
      {/* <style>
        {`
        @keyframes onboarding {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        `}
      </style>
      <div style={{ marginRight: "auto" }}>CSS Loader</div> */}
      <DialogButton
        style={{ height: "28px", width: "40px", minWidth: 0, padding: "10px 12px" }}
        // onClick={onSettingsClick}
      >
        <BsGearFill style={{ marginTop: "-4px", display: "block" }} />
      </DialogButton>
    </Focusable>
  );
}

export function Content() {
  const [auto_global_sync, set_auto_global_sync] = useState<boolean>(Config.get("auto_global_sync"));
  useEffect(() => {
    Config.set("auto_global_sync", auto_global_sync);
  }, [auto_global_sync]);

  const [screenshot_upload_enable, set_screenshot_upload_enable] = useState<boolean>(Config.get("screenshot_upload_enable"));
  useEffect(() => {
    Config.set("screenshot_upload_enable", screenshot_upload_enable);
  }, [screenshot_upload_enable]);

  const [screenshot_delete_after_upload, set_screenshot_delete_after_upload] = useState<boolean>(Config.get("screenshot_delete_after_upload"));
  useEffect(() => {
    Config.set("screenshot_delete_after_upload", screenshot_delete_after_upload);
  }, [screenshot_delete_after_upload]);

  const [advanced_options, set_advanced_options] = useState<boolean>(Config.get("advanced_options"));
  // useEffect(() => {
  //   console.log('advanced_options changed:', advanced_options);
  //   Config.set("advanced_options", advanced_options);
  // }, [advanced_options]);

  const [strict_game_sync, set_strict_game_sync] = useState<boolean>(Config.get("strict_game_sync"));
  useEffect(() => {
    Config.set("strict_game_sync", strict_game_sync);
  }, [strict_game_sync]);

  const [hasProvider, setHasProvider] = useState<boolean>(false);
  useEffect(() => {
    set_advanced_options(Config.get("advanced_options"))
    ApiClient.getCloudBackend().then((e) => setHasProvider(Boolean(e)));
  }, []);
  const [textFieldValue, setTextFieldValue] = useState("");

  const [syncInProgress, _] = useState<boolean>(false);
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
            onChange={set_auto_global_sync}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Screenshots">
        <PanelSectionRow>
          <ToggleField
            disabled={!hasProvider}
            label="Upload screenshots"
            checked={screenshot_upload_enable}
            onChange={set_screenshot_upload_enable}
          />
        </PanelSectionRow>
        {screenshot_upload_enable && (<>
          <PanelSectionRow>
            <ToggleField
              label="Delete local copy"
              checked={screenshot_delete_after_upload}
              onChange={set_screenshot_delete_after_upload}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() =>
                showModal(
                  <ConfirmModal
                    strTitle="Screenshot Upload Destination"
                    onOK={() => Config.set("screenshot_destination_directory", textFieldValue)}>
                    <TextField
                      defaultValue={Config.get("screenshot_destination_directory")}
                      onBlur={(e) => setTextFieldValue(e.target.value)} />
                  </ConfirmModal>)}
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
                showModal(
                  <ConfirmModal
                    strTitle="Show Advanced Options"
                    onOK={() => Config.set("advanced_options", true)} />);
              } else {
                set_advanced_options(false);
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
                    "Click OK to continue.",
                    () => set_strict_game_sync(true))
                } else {
                  set_strict_game_sync(false);
                }
              }}
            />
          </PanelSectionRow>
        </>)}
      </PanelSection>
    </>
  );
};