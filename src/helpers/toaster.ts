import toastIcon from "../../assets/images/toastIcon.png";
import plugin from "../json/plugin.json"
import { toaster } from "@decky/api";

/**
 * Represents a toast notification utility.
 */
export default class Toaster {
  /**
   * Icon for the toast notification.
   */
  private static ico = window.SP_REACT.createElement("img", { width: "30", style: { marginTop: "5px", marginLeft: "10px" }, src: toastIcon });

  /**
   * Displays a toast notification.
   * @param msg - The message to display.
   * @param ms - The duration of the toast notification in milliseconds (default is 2000).
   * @param clickAction - The action to perform when the toast notification is clicked (default is an empty function).
   */
  public static toast(msg: any, ms: number = 2000, clickAction = () => { }) {
    toaster.toast({ title: plugin.name, body: msg, duration: ms, logo: Toaster.ico, onClick: clickAction });
  }
}