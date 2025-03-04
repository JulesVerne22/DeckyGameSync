import { useEffect, useState } from "react";
import { FaFileUpload, FaSave } from "react-icons/fa";
import { IoDocumentText } from "react-icons/io5";
import { BiSolidCloudUpload } from "react-icons/bi";
import { BsFillGearFill } from "react-icons/bs";
import { ButtonItem, PanelSection, PanelSectionRow, ToggleField } from "@decky/ui";
import * as Defs from "../helpers/commonDefs";
import SyncTaskQeueue from "../helpers/syncTaskQueue";
import { get_cloud_type } from "../helpers/backend";
import DeckyStoreButton from "../components/deckyStoreButton";
import Config from "../helpers/config";
import * as Popups from "../components/popups";
import * as Backend from "../helpers/backend";
import configCloudPage from "./configCloudPage";
import PluginLogsPage from "./pluginLogsPage";
import SyncTargetConfigPage from "./syncTargetConfigPage";

export function Content() {
  const [auto_global_sync] = useState<boolean>(Config.get("auto_global_sync"));
  const [screenshot_upload_enable, set_screenshot_upload_enable] = useState<boolean>(Config.get("screenshot_upload_enable"));
  const [screenshot_delete_after_upload] = useState<boolean>(Config.get("screenshot_delete_after_upload"));
  const [advanced_options, set_advanced_options] = useState<boolean>(Config.get("advanced_options"));
  const [strict_game_sync] = useState<boolean>(Config.get("strict_game_sync"));

  const [syncInProgress, setSyncInProgress] = useState<boolean>(SyncTaskQeueue.busy);
  const [hasProvider, setHasProvider] = useState<boolean>(false);

  useEffect(() => {
    get_cloud_type().then((e) => setHasProvider(Boolean(e)));

    const syncInProgressUpdateHandler = ((event: CustomEvent) => setSyncInProgress(event.detail)) as EventListener;
    SyncTaskQeueue.addEventListener(SyncTaskQeueue.events.BUSY, syncInProgressUpdateHandler);

    return () => {
      SyncTaskQeueue.removeEventListener(SyncTaskQeueue.events.BUSY, syncInProgressUpdateHandler);
    }
  }, []);

  return (
    <>
      <PanelSection title="Global Sync">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={syncInProgress || (!hasProvider)}
            onClick={() => {
              SyncTaskQeueue.addSyncTask(Backend.sync_cloud_first, Defs.GLOBAL_SYNC_APP_ID);
            }}
          >
            <style>{`
              .cloudSaveForkRotatingIcon {
                animation: cloudSaveForkRotatingIconAnimation 1s infinite cubic-bezier(0.46, 0.03, 0.52, 0.96);
              }
              @keyframes cloudSaveForkRotatingIconAnimation {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
            `}
            </style>
            <DeckyStoreButton icon={<FaSave className={syncInProgress ? "cloudSaveForkRotatingIcon" : ""} />}>
              Sync Now
            </DeckyStoreButton>
          </ButtonItem>
          {hasProvider === false && <small>{'Cloud Storage Provider is not configured. Please configure it in "Cloud Provider"'}.</small>}
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            disabled={!hasProvider}
            label="Sync on game start & stop"
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
            checked={screenshot_upload_enable && hasProvider}
            onChange={(e) => {
              Config.set("screenshot_upload_enable", e);
              set_screenshot_upload_enable(e); // to trigger re-render
            }}
          />
        </PanelSectionRow>
        {screenshot_upload_enable && hasProvider && (<>
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
                  Config.get("screenshot_upload_destination"),
                  (e) => Config.set("screenshot_upload_destination", e))}
            >
              <DeckyStoreButton icon={<FaFileUpload />}>
                Upload Destination
              </DeckyStoreButton>
            </ButtonItem>
          </PanelSectionRow>
        </>)}
      </PanelSection>

      <PanelSection title="Configuration">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => SyncTargetConfigPage.enter({ syncTargetId: String(Defs.GLOBAL_SYNC_APP_ID) })}
          >
            <DeckyStoreButton icon={<BsFillGearFill />}>
              Global Sync Config
            </DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => configCloudPage.enter()}
          >
            <DeckyStoreButton icon={<BiSolidCloudUpload />}>
              Cloud Provider
            </DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => PluginLogsPage.enter()}
          >
            <DeckyStoreButton icon={<IoDocumentText />}>Plugin Logs</DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Advanced Options">
        <PanelSectionRow>
          <ToggleField
            label="Enable"
            checked={advanced_options}
            onChange={(e) => {
              if (e) {
                Popups.confirmPopup("Show Advanced Options",
                  <span>
                    Advanced options are only for those who understand what they are doing.<br />
                    <b>Using them without caution may cause unrecoverable data loss!</b><br /><br />
                    Click "Confirm" to continue.
                  </span>,
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
                    <span>
                      This will change rclone to from "COPY" mode to "SYNC" mode when doing game sync, which allows it to <b>DELETE ANY FILES</b> on destination (local/cloud) to make it match the source (cloud/local).<br /><br />
                      Click "Confirm" to continue.
                    </span>,
                    () => Config.set("strict_game_sync", true))
                } else {
                  Config.set("strict_game_sync", false);
                }
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() =>
                Popups.textInputPopup("Global & Game Sync Root",
                  Config.get("sync_root"),
                  (e) => {
                    if (e != Config.get("sync_root")) {
                      if (Config.get("strict_game_sync")) {
                        Popups.confirmPopup("Modify Sync Root",
                          <span>
                            You are modifying the sync root with "Strict Game Sync" enabled.<br />
                            Please make sure all the data are aligned in local and cloud, otherwise data may be lost or even <b>fully deleted</b>!<br /><br />
                            Click "Confirm" to continue.
                          </span>,
                          () => Config.set("sync_root", e)
                        )
                      } else {
                        Config.set("sync_root", e);
                      }
                    }
                  })}
            >
              <DeckyStoreButton icon={<FaFileUpload />}>
                Sync Root
              </DeckyStoreButton>
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() =>
                Popups.textInputPopup("Global & Game Sync Destination",
                  Config.get("sync_destination"),
                  (e) => {
                    if (e != Config.get("sync_destination")) {
                      if (Config.get("strict_game_sync")) {
                        Popups.confirmPopup("Modify Sync Destination",
                          <span>
                            You are modifying the sync destination with "Strict Game Sync" enabled.<br />
                            Please make sure all the data are aligned in local and cloud, otherwise data may be lost or even <b>fully deleted</b>!<br /><br />
                            Click "Confirm" to continue.
                          </span>,
                          () => Config.set("sync_destination", e)
                        )
                      } else {
                        Config.set("sync_destination", e);
                      }
                    }
                  })}
            >
              <DeckyStoreButton icon={<FaFileUpload />}>
                Sync Destination
              </DeckyStoreButton>
            </ButtonItem>
          </PanelSectionRow>
        </>)}
      </PanelSection>
    </>
  );
};
