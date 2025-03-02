import decky

from pathlib import Path
from enum import Enum

RCLONE_PORT = 53682

PLUGIN_DEFAULT_CONFIG_PATH = Path(decky.DECKY_PLUGIN_DIR) / "default_config.json"
PLUGIN_CONFIG_DIR = Path(decky.DECKY_PLUGIN_SETTINGS_DIR)

RCLONE_BIN_PATH = Path(decky.DECKY_PLUGIN_DIR) / "bin/rcloneLauncher"
RCLONE_CFG_PATH = PLUGIN_CONFIG_DIR / "rclone.conf"
RCLONE_BISYNC_CACHE_DIR = Path(decky.HOME) / ".cache/rclone/bisync"

logger = decky.logger


class RcloneSyncMode(Enum):
    """
    Enum representing the different modes of rclone sync operations.
    """

    COPY = "copy"
    SYNC = "sync"
    BISYNC = "bisync"


class RcloneSyncWinner(Enum):
    """
    Enum representing the winner in rclone bisync
    """

    LOCAL = "path1"
    CLOUD = "path2"


class FilterType(Enum):
    """
    Enum representing the different types of sync paths.
    """

    TARGET = True
    SHARED = False
