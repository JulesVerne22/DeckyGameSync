from asyncio import create_subprocess_exec
from datetime import datetime
from enum import Enum
from pathlib import Path
from subprocess import list2cmdline
from typing import Any

import decky_plugin
from settings import SettingsManager as settings_manager

RCLONE_BIN_PATH = Path(decky_plugin.DECKY_PLUGIN_DIR) / "bin/rcloneLauncher"
RCLONE_CFG_PATH = Path(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR) / "rclone.conf"
RCLONE_BISYNC_CACHE_DIR = Path(decky_plugin.HOME) / "/.cache/rclone/bisync"

class SyncTarget:
    DEFAULT_CONFIG = {
        "log_level": "INFO",
        "sync_on_game_exit": True,
        "toast_auto_sync": True,
        "destination_directory": "decky-cloud-save",
        "bisync": False,
        "additional_sync_args": [],
        "sync_root": "/",
    }

    DEFAULT_CONFIG_FALLBACK = DEFAULT_CONFIG

    def __init__(self, subdir: str = ""):
        self.current_sync = None
        self.sync_result = None
        self.subdir = subdir

        # subdir should be empty for global sync
        self.config_dir = Path(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR) / subdir
        self.runtime_dir = Path(decky_plugin.DECKY_PLUGIN_RUNTIME_DIR) / subdir
        self.log_dir = Path(decky_plugin.DECKY_PLUGIN_LOG_DIR) / subdir
        self.config = SettingsManager(name="config", settings_directory=str(self.config_dir))

        self.syncpath_includes_file = self.config_dir / "sync_paths_includes.txt"
        self.syncpath_excludes_file = self.config_dir / "sync_paths_excludes.txt"
        self.syncpath_filter_file = self.runtime_dir / "filter.txt"

    def get_config(self) -> dict:
        """
        Retrieves the plugin configuration.

        Returns:
        dict: The plugin configuration.
        """
        self.config.read()
        if not self.config.settings:
            self.config.settings = self.DEFAULT_CONFIG
            self.config.commit()

        return self.config.settings

    def get_config_item(self, key: str) -> int|bool|str:
        """
        Retrieves a configuration item.

        Parameters:
        key (str): The key to get.

        Returns:
        int|bool|str: The value of the configuration item.
        """
        all_configs = self.get_config()
        return all_configs.get(key, self.DEFAULT_CONFIG.get(key))

    def get_config_items(self, *keys: str)-> tuple[Any, ...]:
        """
        Retrieves multiple configuration items.

        Parameters:
        *keys (str): The keys to get.

        Returns:
        dict: A dictionary containing the requested configuration items.
        """
        all_configs = self.get_config()
        return *[all_configs.get(key, self.DEFAULT_CONFIG.get(key)) for key in keys],

    def set_config(self, key: str, value: Any):
        """
        Sets a configuration key-value pair in the plugin configuration file.

        Parameters:
        key (str): The key to set.
        value (Any): The value to set for the key.
        """
        self.config.setSetting(key, value)

    def generate_filter_file(self):
        """
        Generates the sync paths filter file based on includes and excludes files.
        """
        with open(self.sync_path_includes_file, 'r') as f:
            includes = f.readlines()
        with open(self.sync_path_excludes_file, 'r') as f:
            excludes = f.readlines()
        with open(self.sync_path_filter_file, 'w') as f:
            for exclude in excludes:
                f.write(f"- {exclude}")
            f.write("\n")
            for include in includes:
                f.write(f"+ {include}")
            f.write("\n")
            f.write("- **\n")

    def get_filter_args(self) -> list[str]:
        """
        Retrieves the filter arguments for rclone.

        Returns:
        list: A list of filter arguments.
        """
        return ["--filter-from", self.syncpath_filter_file]

    def create_rclone_log_file(self, max_log_files: int = 5) -> Path:
        """
        Creates the rclone log file.

        Parameters:
        max_log_files (int): Max number of log files to keep, old ones will be deleted.

        Returns:
        Path: The path to the created rclone log file.
        """
        if not self.log_dir.exists():
            self.log_dir.mkdir(parents=True)

        current_time = datetime.now.strftime("%Y-%m-%d %H.%M.%S")
        log_file = self.log_dir / f"rclone {current_time}.log"
        if not log_file.exists():
            log_file.touch()

        # remove extra log files
        all_log_files = sorted(self.log_dir.glob("rclone *.log"))
        if len(all_log_files) > max_log_files:
            for old_log_file in all_log_files[:-max_log_files]:
                old_log_file.unlink(missing_ok=True)

        return log_file

    async def sync_now(self, winner: str, resync: bool = False):
        """
        Initiates a synchronization process using rclone.

        Parameters:
        winner (str): The winner of the resync operation. Defaults to None.
        resync (bool, optional): Whether to perform a resync operation. Defaults to False.
        """
        self.generate_filter_file()
        self.rclone_log_path = self.create_rclone_log_file()

        bisync, sync_root, destination_dir = self.get_config_items("bisync", "sync_root", "destination_directory")
        args = [sync_root, f"backend:{destination_dir}"]
        args.extend(self.get_filter_args())

        if bisync:
            args.extend(["bisync"])
            decky_plugin.logger.debug("Using bisync")
        else:
            args.extend(["copy"])
            decky_plugin.logger.debug("Using copy")

        args.extend(["--copy-links"])
        if bisync:
            if resync:
                args.extend(["--resync-mode", winner, "--resync"])
            else:
                args.extend(["--conflict-resolve", winner])

        args.extend(["--transfers", "8", "--checkers", "16", "--log-file",
                    str(rclone_log_path), "--log-format", "none", "-v"])

        args.extend(self.get_config_item("additional_sync_args", []))

        cmd = [RCLONE_BIN_PATH, *args]

        decky_plugin.logger.info(
            "Running command: %s", list2cmdline(cmd))

        self.current_sync = await create_subprocess_exec(*cmd)
        self.sync_result = await self.current_sync.wait()
        self.current_sync = None
        decky_plugin.logger.info(f"Sync {rclone_log_path} finished with exit code: {self.sync_result}")

    async def delete_lock_files(self):
        """
        Deletes rclone lock files
        """
        decky_plugin.logger.info("Deleting lock files.")
        for lck_file in RCLONE_BISYNC_CACHE_DIR.glob("*.lck"):
            lck_file.unlink(missing_ok=True)

    def get_last_sync_log(self) -> str:
        """
        Retrieves the last synchronization log.

        Returns:
        str: The last synchronization log.
        """
        with self.rclone_log_path.open() as f:
            return f.read()
