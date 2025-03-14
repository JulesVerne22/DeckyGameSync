import { GLOBAL_SYNC_APP_ID, SHARED_FILTER_APP_ID, PLUGIN_NAME_AS_PATH } from "./commonDefs";

export function getAppName(appId: number): string {
  if (appId == GLOBAL_SYNC_APP_ID) {
    return "global"
  } else if (appId == SHARED_FILTER_APP_ID) {
    return "shared"
  } else {
    return String(window.appStore.GetAppOverviewByAppID(appId)?.display_name);
  }
}

export function getCurrentUserId(): number {
  return Number(BigInt.asUintN(32, BigInt(window.App.m_CurrentUser.strSteamID)));
};

const CLIPBOARD_KEY = `${PLUGIN_NAME_AS_PATH}-clipboard`;
let timeout: NodeJS.Timeout | undefined = undefined;

export function copy(text: string) {
  localStorage.setItem(CLIPBOARD_KEY, text);
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(() => {
    localStorage.removeItem(CLIPBOARD_KEY);
    timeout = undefined;
  }, 5 * 60 * 1000);
}

export function paste(): string {
  if (timeout) {
    clearTimeout(timeout);
    timeout = undefined;
  }
  const text = localStorage.getItem(CLIPBOARD_KEY);
  return text ?? "";
}

export function reduceSlashes(input: string): string {
    return input.replace(/\/+/g, '/');
}