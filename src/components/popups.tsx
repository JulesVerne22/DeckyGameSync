import { useState } from "react";
import { ConfirmModal, showModal, TextField } from "@decky/ui";

export function textInputPopup(title: string, value: string, onOK: (value: string) => void) {
  const [textFieldValue, setTextFieldValue] = useState(value);

  showModal(
    <ConfirmModal
      strTitle={title}
      onOK={() => onOK(textFieldValue)}>
      <TextField
        defaultValue={value}
        onBlur={(e) => setTextFieldValue(e.target.value)} />
    </ConfirmModal>)
}

export function confirmPopup(title: string, text: string, onOK: () => void) {
  showModal(
    <ConfirmModal
      strTitle={title}
      strDescription={text}
      onOK={() => onOK()} />)
}