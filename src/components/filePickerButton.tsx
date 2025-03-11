import { ButtonItem, showContextMenu, Menu, MenuItem } from "@decky/ui";
import { openFilePicker, FileSelectionType } from "@decky/api";
import { confirmPopup } from "./popups";
import { test_syncpath } from "../helpers/backend";

const enum PathPostfix {
  FILE = "",
  FOLDER = "/**",
  FOLDER_NORECURSE = "/*",
}

interface FilterPickerButtonProps {
  text: string;
  onConfirm: (path: string) => void;
}

export default function filterPickerButton({ text, onConfirm }: FilterPickerButtonProps) {
  const onFilePicked = (path: string, postfix: PathPostfix) => {
    let fullPath = path + postfix;

    if (path === "/") {
      confirmPopup(
        <b>ARE YOU SURE?</b>,
        <span>
          It will add the root directory to the filter list. <b>Syncing with such a filter makes rclone try to upload or even delete the whole file system.</b><br /><br />
          If you are 100% sure what you are doing, click "Confirm" to continue.
        </span>,
        () => onConfirm(fullPath)
      );
    } else {
      test_syncpath(fullPath).then(e => confirmPopup(
        text,
        <span>
          Path {fullPath} matches <b>{e}</b> file(s).<br /><br />
          Click "Confirm" to continue.
        </span>,
        () => onConfirm(fullPath)
      ))
    }
  };

  return (
    <ButtonItem
      onClick={() => showContextMenu(
        <Menu label="Filter Type">
          <MenuItem
            onSelected={() =>
              openFilePicker(FileSelectionType.FILE, "~", true)
                .then(e => onFilePicked(e.realpath, PathPostfix.FILE))
            }
          >
            File
          </MenuItem>
          <MenuItem
            onSelected={() =>
              openFilePicker(FileSelectionType.FOLDER, "~", false)
                .then((e) => onFilePicked(e.realpath, PathPostfix.FOLDER))
            }
          >
            Folder
          </MenuItem>
          <MenuItem
            onSelected={() =>
              openFilePicker(FileSelectionType.FOLDER, "~", false)
                .then((e) => onFilePicked(e.realpath, PathPostfix.FOLDER_NORECURSE))
            }
          >
            Folder (Without Subfolders)
          </MenuItem>
        </Menu>
      )}
    >
      {text}
    </ButtonItem>
  );
}
