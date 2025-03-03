import { ReactNode, useEffect, useState } from "react";
import { ImOnedrive, ImDropbox, ImHome, ImGoogleDrive } from "react-icons/im";
import { BsGearFill, BsPatchQuestionFill } from "react-icons/bs";
import { ButtonItem, Navigation, PanelSection, PanelSectionRow, sleep } from "@decky/ui";
import Container from "../components/container";
import { spawn, spawn_probe } from "../helpers/backend";
import RoutePage from "../components/routePage";
import { confirmPopup } from "../components/popups";
import { get_cloud_type } from "../helpers/backend";

async function openConfig(cloud: "onedrive" | "drive" | "dropbox") {
  const url = await spawn(cloud);
  async () => {
    let count = 0; // For timeout in case user forgor 💀
    while (count < 10_000 /* approx 1h */) {
      if (await spawn_probe() === 0) {
        Navigation.NavigateBack();
        break;
      }
      await sleep(360);
    }
  };
  Navigation.CloseSideMenus();
  Navigation.NavigateToExternalWeb(url);
}

async function getCloudBackend(): Promise<string> {
  const cloud_type = await get_cloud_type();
  switch (cloud_type) {
    case "onedrive":
      return "OneDrive";
    case "drive":
      return "Google Drive";
    case "dropbox":
      return "Dropbox";
    default:
      return "Other: " + cloud_type;
  }
}

class ConfigCloudPage extends RoutePage {
  readonly route = "config-cloud-page";

  render(): ReactNode {
    const [provider, setProvider] = useState<string>("N/A");

    useEffect(() => {
      getCloudBackend().then((cloud) => {
        if (cloud) {
          setProvider(cloud);
        } else {
          setProvider("N/A");
        }
      })
    }, []);

    return (
      <Container title="Configure Cloud Storage Provider">
        <PanelSection>
          <strong>Currently using: {provider}</strong>
        </PanelSection>
        <PanelSection>
          <small>Click one of the providers below to configure the backup destination</small>
          <PanelSectionRow>
            <ButtonItem onClick={() => openConfig("onedrive")} icon={<ImOnedrive />} label="OneDrive">
              <BsGearFill />
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              onClick={() => openConfig("drive")}
              icon={<ImGoogleDrive />}
              label="Google Drive (may not work if Google does not trust the Steam Browser)"
            >
              <BsGearFill />
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem onClick={() => openConfig("dropbox")} icon={<ImDropbox />} label="Dropbox">
              <BsGearFill />
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              onClick={() =>
                confirmPopup("Adding Other Providers",
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    In addition to the providers listed above, others can also be configured. Unfortunately, setup for them can only be done in desktop mode.<br />
                    Please refer to rclone config documents (<a href="https://rclone.org/flags/#config">https://rclone.org/flags/#config</a>) for more information.
                  </span>
                )}
              icon={<ImHome />}
              label="Other (Advanced)"
            >
              <BsPatchQuestionFill />
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      </Container >
    );
  }
}

const configCloudPage = new ConfigCloudPage();
export default configCloudPage;
