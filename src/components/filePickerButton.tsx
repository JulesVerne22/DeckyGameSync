import { DialogButton, showContextMenu, Menu, MenuItem } from "@decky/ui";
import { openFilePicker, FileSelectionType } from "@decky/api";
import { confirmPopup } from "./popups";
import { test_syncpath } from "../helpers/backend";
import { reduceSlashes } from "../helpers/utils";
import * as Toaster from "../helpers/toaster";
import Config from "../helpers/config";

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
    const fullPath = path + postfix;

    let roots = Config.get("sync_root")
    let root = roots[0]
    let match = false

    for (let i = 0; i < roots.length; i++) {
      if (path.startsWith(roots[i])) {
        match = true

        if (roots[i].length > root.length) {
          root = roots[i]
        }
      }
    }

    if (!match) {
      Toaster.toast("Invalid, path not in sync root");
    } else if (path === "/") {
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
          Path <i>{fullPath}</i> matches <b>{e >= 0 ? e : "tooooooo many"}</b> file(s).<br /><br />
          Click "Confirm" to continue.
        </span>,
        () => onConfirm("/" + reduceSlashes(fullPath.slice(1)))
      ))
    }
  };

  return (
    <DialogButton
      onClick={() => showContextMenu(
        <Menu label="Filter Type">
          <MenuItem
            onSelected={() =>
              openFilePicker(FileSelectionType.FILE, "/", true)
                .then(e => onFilePicked(e.path, PathPostfix.FILE))
            }
          >
            File
          </MenuItem>
          <MenuItem
            onSelected={() =>
              openFilePicker(FileSelectionType.FOLDER, "/", false)
                .then((e) => onFilePicked(e.path, PathPostfix.FOLDER))
            }
          >
            Folder
          </MenuItem>
          <MenuItem
            onSelected={() =>
              openFilePicker(FileSelectionType.FOLDER, "/", false)
                .then((e) => onFilePicked(e.path, PathPostfix.FOLDER_NORECURSE))
            }
          >
            Folder (without Subfolders)
          </MenuItem>
        </Menu>
      )}
    >
      {text}
    </DialogButton>
  );
}
