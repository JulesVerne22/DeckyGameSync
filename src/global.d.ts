import { LifetimeNotification } from "@decky/ui";

declare global {
    interface SteamClient {
        GameSessions: {
            RegisterForAppLifetimeNotifications: (callback: (e: LifetimeNotification) => void) => { unregister: () => void };
        };
    }
}
