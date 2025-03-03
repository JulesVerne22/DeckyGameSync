import { call, callable } from "@decky/api"

// rclone.conf Setup
export const spawn = callable<[backend_type: string], string>("spawn");
export const spawn_probe = callable<[], number>("spawn_probe");
export const get_cloud_type = callable<[], string>("get_cloud_type");

// Sync Paths
export const get_filters_target = callable<[app_id: number], Array<string>>("get_filters_target");
export const get_filters_shared = callable<[app_id: number], Array<string>>("get_filters_shared");
export const set_filters_target = callable<[paths: Array<string>, app_id: number], void>("set_filters_target");
export const set_filters_shared = callable<[paths: Array<string>, app_id: number], void>("set_filters_shared");
export const test_syncpath = callable<[path: string], number>("test_syncpath");

// Syncing
export const sync_local_first = callable<[app_id: number], number>("sync_local_first");
export const sync_cloud_first = callable<[app_id: number], number>("sync_cloud_first");
export const resync_local_first = callable<[], number>("resync_local_first");
export const resync_cloud_first = callable<[], number>("resync_cloud_first");
export const sync_screenshot = callable<[user_id: number, screenshot_url: string], number>("sync_screenshot");
export const delete_lock_files = callable<[], void>("delete_lock_files");
export const get_available_sync_targets = callable<[], Array<number>>("get_available_sync_targets");

// Processes
export const pause_process = callable<[pid: number], void>("pause_process");
export const resume_process = callable<[pid: number], void>("resume_process");

// Configuration
export const get_config = callable<[], object>("get_config");
export const set_config = callable<[key: string, value: any], void>("set_config");

// Logger
export const log_debug = callable<[msg: string], void>("log_debug");
export const log_info = callable<[msg: string], void>("log_info");
export const log_warning = callable<[msg: string], void>("log_warning");
export const log_error = callable<[msg: string], void>("log_error");
export const get_last_sync_log = callable<[], string>("get_last_sync_log");
export const get_plugin_log = callable<[], string>("get_plugin_log");
