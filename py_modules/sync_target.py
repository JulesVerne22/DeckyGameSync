from datetime import datetime
from pathlib import Path
from typing import Any
import subprocess

import decky_plugin
from config import Config

RCLONE_BIN_PATH = Path(decky_plugin.DECKY_PLUGIN_DIR) / "bin/rcloneLauncher"
RCLONE_CFG_PATH = Path(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR) / "rclone.conf"
RCLONE_BISYNC_CACHE_DIR = Path(decky_plugin.HOME) / ".cache/rclone/bisync"

class SyncTarget():
    def __init__(self, subdir: str = ""):
        self.current_sync = None
        self.sync_result = None

        self.config_dir = Path(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR) / subdir
        self.log_dir = Path(decky_plugin.DECKY_PLUGIN_LOG_DIR) / subdir

        self.rclone_log_path = None
        self.syncpath_includes_file = self.config_dir / "sync_paths_includes.txt"
        self.syncpath_excludes_file = self.config_dir / "sync_paths_excludes.txt"

    def get_filter_str(self) -> str:
        """
        Generates the sync paths filter file based on includes and excludes files.

        Returns:
        str: A string containing all filter entries
        """
        filter_string = ""
        with self.syncpath_includes_file.open('r') as f:
            filter_string += f.read().strip() + '\n'
        with self.syncpath_excludes_file.open('r') as f:
            filter_string += f.read().strip() + '\n'
        filter_string += "- **"
        return filter_string

    def get_filter_args(self) -> list[str]:
        """
        Retrieves the filter arguments for rclone.

        Returns:
        list: A list of filter arguments.
        """
        return ["--filter-from", "-"]

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

    def sync_now(self, winner: str, resync: bool = False):
        """
        Initiates a synchronization process using rclone.

        Parameters:
        winner (str): The winner of the resync operation. Defaults to None.
        resync (bool, optional): Whether to perform a resync operation. Defaults to False.
        """
        self.rclone_log_path = self.create_rclone_log_file()

        bisync, sync_root, destination_dir = Config.get_config_items("bisync", "sync_root", "destination_directory")
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
                    str(self.rclone_log_path), "--log-format", "none", "-v"])

        args.extend(self.get_config_item("additional_sync_args", []))

        cmd = [RCLONE_BIN_PATH, *args]

        decky_plugin.logger.info(
            "Running command: %s", subprocess.list2cmdline(cmd))

        self.current_sync = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        sync_stdcout, sync_stderr = self.current_sync.communicate(self.get_filter_str())
        self.sync_result = self.current_sync.returncode
        self.current_sync = None

        decky_plugin.logger.info(f"Sync {self.rclone_log_path} finished with exit code: {self.sync_result}")
        if sync_stdcout:
            decky_plugin.logger.info(f"Sync {self.rclone_log_path} stdout: {sync_stdcout}")
        if sync_stderr:
            decky_plugin.logger.error(f"Sync {self.rclone_log_path} stderr: {sync_stderr}")

    def get_last_sync_log(self) -> str:
        """
        Retrieves the last synchronization log.

        Returns:
        str: The last synchronization log contents.
        """
        if not self.rclone_log_path:
            all_log_files = sorted(self.log_dir.glob("rclone *.log"))
            if len(all_log_files) > 0:
                self.rclone_log_path = all_log_files[-1]
            else:
                return "No logs available."
        try:
            with self.rclone_log_path.open() as f:
                return f.read()
        except Exception as e:
            err_msg = f"Error reading log file {self.rclone_log_path}:\n{e}"
            decky_plugin.logger.error(err_msg)
            return err_msg

    def get_syncpaths(self, exclude: bool) -> list[str]:
        """
        Retrieves sync paths from the specified file.

        Parameters:
        exclude (bool): The type of the sync paths to retrieve, True for exclude, False for include

        Returns:
        list[str]: A list of sync paths.
        """
        file = self.syncpath_excludes_file if exclude else self.syncpath_includes_file
        if not file.exists():
            return []
        with file.open("r") as f:
            return f.readlines()

    def add_syncpath(self, path: str, exclude: bool):
        """
        Adds a sync path.

        Parameters:
        path (str): The path to add.
        exclude (bool): The type of the sync paths to add, True for exclude, False for include
        """
        file = self.syncpath_excludes_file if exclude else self.syncpath_includes_file
        decky_plugin.logger.info(f"Adding Path to Sync: '{path}', {file}")

        # Replace the beginning of path to replace the root.
        path = f"{path.strip().replace(self.get_config_item("sync_root"), "/", 1)}\n"

        if path in self.get_syncpaths(exclude):
            return
        with file.open("a") as f:
            f.write(path)

    def remove_syncpath(self, path: str, exclude: bool):
        """
        Removes a sync path from the specified file.

        Parameters:
        path (str): The path to remove.
        exclude (bool): The type of the sync paths to add, True for exclude, False for include
        """
        file = self.syncpath_excludes_file if exclude else self.syncpath_includes_file
        decky_plugin.logger.info(f"Removing Path to Sync: '{path}', {file}")

        # Replace the beginning of path to replace the root.
        path = f"{path.strip()}\n"

        lines = self.get_syncpaths(exclude)
        with file.open("w") as f:
            for line in lines:
                if line != path:
                    f.write(line)


class GameSyncTarget(SyncTarget):
    def __init__(self, app_id: int):
        if app_id <= 0:
            raise ValueError(f"Invalid app_id {app_id}, it is required to be > 730")
        super().__init__(str(app_id))


class LibrarySyncTarget(SyncTarget):
    def __init__(self, library: str):
        if not library:
            raise ValueError("library is required")
        super().__init__(library)

    def get_filter_args(self) -> list:
        """
        Retrieves the filter arguments for rclone.
        For library sync, no filter args will be used.

        Returns:
        list: An empty list
        """
        return []
