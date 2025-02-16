import { callable } from "@decky/api"

// rclone.conf Setup
export const spawn = callable<[backend_type: string], string>("spawn");
export const spawn_probe = callable<[], number>("spawn_probe");
export const get_backend_type = callable<[], string>("get_backend_type");

// Sync Paths
export const get_syncpaths = callable<[exclude: boolean, app_id: number], Array<string>>("get_syncpaths");
export const add_syncpath = callable<[path: string, exclude: boolean, app_id: number], void>("add_syncpath");
export const remove_syncpath = callable<[path: string, exclude: boolean, app_id: number], void>("remove_syncpath");
export const test_syncpath = callable<[path: string], number>("test_syncpath");

// Syncing
export const sync_local_first = callable<[app_id: number], number>("sync_local_first");
export const sync_cloud_first = callable<[app_id: number], number>("sync_cloud_first");
export const resync_local_first = callable<[app_id: number], number>("resync_local_first");
export const resync_cloud_first = callable<[app_id: number], number>("resync_cloud_first");
export const sync_screenshots = callable<[screenshot_path: string], number>("sync_screenshots");
export const delete_lock_files = callable<[], void>("delete_lock_files");

// Processes
export const signal = callable<[pid: number, s: string], void>("signal");

// Configuration
export const get_log_level = callable<[], number>("get_log_level");
export const get_config = callable<[], Map<string, any>>("get_config");
export const set_config = callable<[key: string, value: any], void>("set_config");

// Logger
export const log_debug = callable<[msg: string], void>("log_debug");
export const log_info = callable<[msg: string], void>("log_info");
export const log_warning = callable<[msg: string], void>("log_warning");
export const log_error = callable<[msg: string], void>("log_error");
// export const get_last_sync_log = callable<[], string>("get_last_sync_log");
export const get_plugin_log = callable<[], string>("get_plugin_log");
