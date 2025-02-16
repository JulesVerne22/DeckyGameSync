import { ButtonItem, ConfirmModal, showModal } from "@decky/ui";
import { useState } from "react";
import { FaFile, FaFolder, FaTrash } from "react-icons/fa";
import { ApplicationState } from "../helpers/state";
import { PageProps } from "../helpers/types";
import { Toast } from "../helpers/toast";

export function RenderExistingPathButton({
  path,
  onPathRemoved,
  file,
}: PageProps<{ path: string; onPathRemoved?: () => void; file: "includes" | "excludes" }>) {
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const onClickDelete = () => {
    showModal(
      <ConfirmModal
        strTitle="Confirm Remove"
        strDescription={`Removing Path ${path} Proceed?`}
        onCancel={() => setButtonDisabled(false)}
        onEscKeypress={() => setButtonDisabled(false)}
        onOK={() => {
          setButtonDisabled(true);
          ApplicationState.getServerApi().callPluginMethod<{ path: string; file: "includes" | "excludes" }, void>("remove_syncpath", { path, file }).then((res: { success: any; result: any; }) => {
            if (res.success) {
              if (onPathRemoved) onPathRemoved();
            } else {
              Toast.toast(res.result);
              setButtonDisabled(false);
            }
          });
        }}
      />
    );
  };

  return (
    <ButtonItem icon={path.endsWith("**") ? <FaFolder /> : <FaFile />} label={path} onClick={onClickDelete} disabled={buttonDisabled}>
      <FaTrash />
    </ButtonItem>
  );
}
