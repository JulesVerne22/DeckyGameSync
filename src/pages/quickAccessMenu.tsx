import { useEffect, useState } from "react";
import { FaFileUpload, FaSave } from "react-icons/fa";
import { IoDocumentText } from "react-icons/io5";
import { BiSolidCloudUpload } from "react-icons/bi";
import { BsFillGearFill } from "react-icons/bs";
import { ButtonItem, PanelSection, PanelSectionRow, ToggleField } from "@decky/ui";
import { GLOBAL_SYNC_APP_ID } from "../helpers/commonDefs";
import SyncTaskQeueue from "../helpers/syncTaskQueue";
import { get_cloud_type } from "../helpers/backend";
import DeckyStoreButton from "../components/deckyStoreButton";
import Config from "../helpers/config";
import * as Popups from "../components/popups";
import * as Backend from "../helpers/backend";
import ConfigCloudPage from "./configCloudPage";
import PluginLogsPage from "./pluginLogsPage";
import SyncTargetConfigPage from "./syncTargetConfigPage";

export function Content() {
  const [sync_on_game_start] = useState<boolean>(Config.get("sync_on_game_start"));
  const [sync_on_game_stop] = useState<boolean>(Config.get("sync_on_game_stop"));
  const [capture_upload_enable, set_capture_upload_enable] = useState<boolean>(Config.get("capture_upload_enable"));
  const [capture_delete_after_upload] = useState<boolean>(Config.get("capture_delete_after_upload"));
  const [advanced_mode, set_advanced_mode] = useState<boolean>(Config.get("advanced_mode"));
  const [strict_game_sync] = useState<boolean>(Config.get("strict_game_sync"));

  const [syncInProgress, setSyncInProgress] = useState<boolean>(SyncTaskQeueue.busy);
  const [hasProvider, setHasProvider] = useState<boolean>(true);

  useEffect(() => {
    get_cloud_type().then((e) => setHasProvider(Boolean(e)));

    const syncInProgressUpdateHandler = ((event: CustomEvent) => setSyncInProgress(event.detail)) as EventListener;
    SyncTaskQeueue.addEventListener(SyncTaskQeueue.events.BUSY, syncInProgressUpdateHandler);

    return () => {
      SyncTaskQeueue.removeEventListener(SyncTaskQeueue.events.BUSY, syncInProgressUpdateHandler);
    }
  }, []);

  return (<>
    {hasProvider && (<>
      <PanelSection title="Sync">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={syncInProgress}
            onClick={() => {
              SyncTaskQeueue.addSyncTask(Backend.sync_cloud_first, GLOBAL_SYNC_APP_ID);
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
              Start Global Sync
            </DeckyStoreButton>
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Sync on game start"
            checked={sync_on_game_start}
            onChange={(e) => {
              Config.set("sync_on_game_start", e);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Sync on game stop"
            checked={sync_on_game_stop}
            onChange={(e) => {
              Config.set("sync_on_game_stop", e);
            }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Screenshots">
        <PanelSectionRow>
          <ToggleField
            label="Upload screenshots"
            checked={capture_upload_enable}
            onChange={(e) => {
              Config.set("capture_upload_enable", e);
              set_capture_upload_enable(e); // to trigger re-render
            }}
          />
        </PanelSectionRow>
        {capture_upload_enable && (<>
          <PanelSectionRow>
            <ToggleField
              label="Delete local copy"
              checked={capture_delete_after_upload}
              onChange={(e) => {
                Config.set("capture_delete_after_upload", e);
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() =>
                Popups.textInputPopup("Screenshot Upload Destination",
                  Config.get("capture_upload_destination"),
                  (e) => Config.set("capture_upload_destination", e))}
            >
              <DeckyStoreButton icon={<FaFileUpload />}>
                Upload Destination
              </DeckyStoreButton>
            </ButtonItem>
          </PanelSectionRow>
        </>)}
      </PanelSection>
    </>)}
    <PanelSection title="Configuration">
      {hasProvider && (<>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => SyncTargetConfigPage.enter({ appId: String(GLOBAL_SYNC_APP_ID) })}
          >
            <DeckyStoreButton icon={<BsFillGearFill />}>
              Global Sync Config
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
      </>)}
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => ConfigCloudPage.enter()}
        >
          <DeckyStoreButton icon={<BiSolidCloudUpload />}>
            Cloud Provider
          </DeckyStoreButton>
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>

    {hasProvider && (<>
      <PanelSection title="Advanced Mode">
        <PanelSectionRow>
          <ToggleField
            label="Enable"
            checked={advanced_mode}
            onChange={(e) => {
              if (e) {
                Popups.confirmPopup("Enable Advanced Mode",
                  <span>
                    Advanced Mode is only for those who understand what they are doing.<br />
                    <b>Using options within without caution may cause unrecoverable data loss!</b><br /><br />
                    Click "Confirm" to continue.
                  </span>,
                  () => Config.set("advanced_mode", true));
              } else {
                Config.set("advanced_mode", false);
                set_advanced_mode(false); // to trigger re-render
              }
            }}
          />
        </PanelSectionRow>
        {advanced_mode && (<>
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
    </>)}
  </>);
};
