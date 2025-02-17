interface SteamClient {
    Apps: {
        RunGame: (gameId: string, _1: string, _2: number, _3: number) => void;
        TerminateApp: (gameId: string, _1: boolean) => void;
    };
    GameSessions: {
        RegisterForAppLifetimeNotifications: (callback: (e: LifetimeNotification) => void) => { unregister: () => void; };
    }
}