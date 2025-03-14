import toastIcon from "../../assets/images/toastIcon.png";
import { PLUGIN_NAME } from "../helpers/commonDefs";
import { toaster } from "@decky/api";

/**
 * Icon for the toast notification.
 */
const ico = window.SP_REACT.createElement("img", {
  width: "30",
  style: { marginTop: "5px", marginLeft: "10px" },
  src: toastIcon
});

/**
 * Displays a toast notification.
 * @param msg - The message to display.
 * @param ms - The duration of the toast notification in milliseconds (default is 2000).
 * @param clickAction - The action to perform when the toast notification is clicked.
 */
export function toast(
  msg: any,
  ms: number = 2000,
  clickAction = () => { }
) {
  toaster.toast({
    title: PLUGIN_NAME,
    body: msg,
    duration: ms,
    logo: ico,
    onClick: clickAction
  });
}
