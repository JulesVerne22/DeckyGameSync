export enum SyncTrigger {
    START,
    STOP,
    MANUAL
}

export type SyncStateStruct = {
    inSync: boolean;
    trigger: SyncTrigger;
}

export const SyncStates: Map<string, SyncStateStruct> = new Map<string, SyncStateStruct>();
