import decky_plugin

from pathlib import Path
import os

from config import Config

STR_ENCODING = "utf-8"

RCLONE_BIN_PATH = Path(decky_plugin.DECKY_PLUGIN_DIR) / "bin/rcloneLauncher"
RCLONE_CFG_PATH = Path(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR) / "rclone.conf"
RCLONE_BISYNC_CACHE_DIR = Path(decky_plugin.HOME) / ".cache/rclone/bisync"

def test_syncpath(syncpath: str):
    """
    Tests a sync path to determine if it's a file or a directory.

    Parameters:
    path (str): The path to test.

    Returns:
    int: The number of files if it's a directory, -1 if it exceeds the limit, or 0 if it's a file.
    """
    if not syncpath.startswith(Config.get_config_item("sync_root")):
        raise Exception("Selection is outside of sync root.")

    if syncpath.endswith("/**"):
        scan_single_dir = False
        syncpath = syncpath[:-3]
    elif syncpath.endswith("/*"):
        scan_single_dir = True
        syncpath = syncpath[:-2]
    else:
        return int(Path(syncpath).is_file())

    count = 0
    for root, os_dirs, os_files in os.walk(syncpath, followlinks=True):
        decky_plugin.logger.debug("%s %s %s", root, os_dirs, os_files)
        count += len(os_files)
        if count > 9000:
            return -1
        if scan_single_dir:
            break

    return count