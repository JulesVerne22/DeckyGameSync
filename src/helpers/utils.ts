import { GLOBAL_SYNC_APP_ID, SHARED_FILTER_APP_ID } from "./commonDefs";

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
