import { LifetimeNotification } from "@decky/ui";

declare global {
  interface SteamClient {
    GameSessions: {
      RegisterForAppLifetimeNotifications: (callback: (e: LifetimeNotification) => void) => Unregisterable;
      RegisterForScreenshotNotification: (callback: (e: ScreenshotNotification) => void) => Unregisterable;
    };
    Screenshots: {
      DeleteLocalScreenshot: (strGameID: string, hHandle: number) => Promise<boolean>;
    }
  }

  interface Screenshot {
    nAppID: number;
    strGameID: string;
    hHandle: number;
    nWidth: number;
    nHeight: number;
    nCreated: number; // timestamp
    ePrivacy: any;
    strCaption: "";
    bSpoilers: boolean;
    strUrl: string;
    bUploaded: boolean;
    ugcHandle: string;
  }
  interface ScreenshotNotification {
    details?: Screenshot;
    hScreenshot: number;
    strOperation: "written" | "deleted" | (string & {});
    unAppID: number;
  }

  interface Unregisterable {
    unregister(): void;
  }
}
