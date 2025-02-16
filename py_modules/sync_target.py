from datetime import datetime
from pathlib import Path
from asyncio.subprocess import create_subprocess_exec, PIPE
from subprocess import list2cmdline

import decky_plugin
from config import Config
from utils import *
import asyncio
import asyncio

ONGOING_SYNCS = dict()


class _SyncTarget:

    def __init__(self, id: str):
        self.id = id
        # self.sync_again = False

        # self.config_dir = Path(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR) / subdir
        self.log_dir = Path(decky_plugin.DECKY_PLUGIN_LOG_DIR) / id

        self.rclone_log_path = None
        self.syncpath_includes_file = Config.config_dir / f"{self.id}.include"
        self.syncpath_excludes_file = Config.config_dir / "all.exclude"

    async def sync(self, winner: RcloneSyncWinner) -> int:
        """
        Runs the rclone sync process.

        Parameters:
        winner (RcloneSyncWinner): The winner of the sync, its data will be preserved as priority.

        Returns:
        int: Exit code of the rclone sync process if it runs, -1 if it cannot run.
        """
        if (ONGOING_SYNCS.get(self.id)) is not None:
            return 0

        extra_args = []
        if self._get_sync_type() == RcloneSyncMode.BISYNC:
            extra_args.extend(["--conflict-resolve", "path1"])
        sync_result = await self._rclone_execute(winner, extra_args)

        ONGOING_SYNCS.pop(self.id)
        return sync_result

    async def resync(self, winner: RcloneSyncWinner) -> int:
        """
        Triggers rclone bisync resync to fix sync issues. Only works when bisync is enabled.

        Parameters:
        winner (RcloneSyncWinner): The winner of the sync, its data will be preserved as priority.

        Returns:
        int: Exit code of the rclone sync process if it runs, -1 if it cannot run.
        """
        if (ONGOING_SYNCS.get(self.id)) is not None:
            return 0

        if self._get_sync_type() != RcloneSyncMode.BISYNC:
            logger.error(f"Resync not supported for sync type: {self._get_sync_type()}")
            return -1

        sync_result = await self._rclone_execute(
            winner, ["--resync-mode", "path1", "--resync"]
        )

        ONGOING_SYNCS.pop(self.id)
        return sync_result

    def _get_sync_type(self):
        """
        Determines the sync type based on the configuration.

        Returns:
        RcloneSyncMode: The sync mode.
        """
        strict_sync_enabled = Config.get_config_item("strict_sync")
        if strict_sync_enabled:
            return RcloneSyncMode.SYNC
        else:
            return RcloneSyncMode.BISYNC

    def _get_filter_str_bytes(self) -> bytes | None:
        """
        Generates the sync paths filter file based on includes and excludes files.

        Returns:
        bytes: Bytes of string containing all filter entries if sync path files exist, None otherwise.
        """
        if not self.syncpath_includes_file.exists():
            return None

        filter_string = ""
        with open_file(self.syncpath_excludes_file, "r") as f:
            for line in f.readlines():
                if stripped_line := line.strip():
                    filter_string += f"- {stripped_line}\n"
        with open_file(self.syncpath_includes_file, "r") as f:
            for line in f.readlines():
                if stripped_line := line.strip():
                    filter_string += f"+ {line.strip()}\n"
        filter_string += "- **"
        logger.debug(f"Sync {self.rclone_log_path} filter string:\n{filter_string}")
        return filter_string.encode(STR_ENCODING)

    def _get_rclone_log_path(self, max_log_files: int = 5) -> Path:
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
        self.rclone_log_path = self.log_dir / f"rclone {current_time}.log"

        # remove extra log files
        all_log_files = sorted(self.log_dir.glob("rclone *.log"))
        if len(all_log_files) >= max_log_files:
            for old_log_file in all_log_files[:-max_log_files]:
                old_log_file.unlink(missing_ok=True)

        return self.rclone_log_path

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
            logger.error(err_msg)
            return err_msg

    def _get_sync_paths(self) -> tuple[str, str]:
        """
        Retrieves the sync root and destination directory from the configuration.

        Returns:
        tuple[str, str]: A tuple containing the sync root and destination directory.
        """
        sync_root, destination_dir = Config.get_config_items(
            "sync_root", "destination_directory"
        )
        return sync_root, destination_dir

    async def _rclone_execute(
        self, winner: RcloneSyncWinner, extra_args: list[str] = []
    ) -> int:
        """
        Runs the rclone sync process.

        Parameters:
        winner (BisyncWinner): The winner of the sync, its data will be preserved as priority.

        Returns:
        int: Exit code of the rclone sync process if it runs, -1 if it cannot run.
        """
        additional_sync_args = Config.get_config_item("additional_sync_args")
        sync_root, destination_dir = self._get_sync_paths()
        sync_type = self._get_sync_type()
        arguments = [sync_type.value]

        match winner:
            case RcloneSyncWinner.LOCAL:
                arguments.extend([sync_root, f"backend:{destination_dir}"])
            case RcloneSyncWinner.CLOUD:
                arguments.extend([f"backend:{destination_dir}", sync_root])
            case _:
                logger.error(f"Invalid winner: {winner}")
                return -1

        arguments.extend(
            [
                "--filter-from",
                "-",
                "--copy-links",
                "--transfers",
                "8",
                "--checkers",
                "16",
                "--log-file",
                str(self._get_rclone_log_path()),
                "--log-format",
                "none",
                "-v",
            ]
        )
        arguments.extend(additional_sync_args)
        arguments.extend(extra_args)

        logger.info(f"Running command: {RCLONE_BIN_PATH} {list2cmdline(arguments)}")
        current_sync = await create_subprocess_exec(
            str(RCLONE_BIN_PATH),
            *arguments,
            stdin=PIPE,
            stdout=PIPE,
            stderr=PIPE,
        )
        sync_stdcout, sync_stderr = await current_sync.communicate(
            self._get_filter_str_bytes()
        )
        sync_result = current_sync.returncode

        logger.info(
            f"Sync {self.rclone_log_path} finished with exit code: {sync_result}"
        )
        if sync_stdcout:
            logger.info(
                f"Sync {self.rclone_log_path} stdout: {sync_stdcout.decode(STR_ENCODING)}"
            )
        if sync_stderr:
            logger.error(
                f"Sync {self.rclone_log_path} stderr: {sync_stderr.decode(STR_ENCODING)}"
            )

        return sync_result

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
        logger.info(f"Adding path '{path}' to sync '{file}'")

        # Replace the beginning of path to replace the root.
        path = f"{path.strip().replace(Config.get_config_item("sync_root"), "/", 1)}\n"

        if path in self.get_syncpaths(exclude):
            return

        with open_file(file, "a") as f:
            f.write(path)

    def remove_syncpath(self, path: str, exclude: bool):
        """
        Removes a sync path from the specified file.

        Parameters:
        path (str): The path to remove.
        exclude (bool): The type of the sync paths to add, True for exclude, False for include
        """
        file = self.syncpath_excludes_file if exclude else self.syncpath_includes_file
        logger.info(f"Removing path '{path}' to sync '{file}'")

        # Replace the beginning of path to replace the root.
        path = f"{path.strip()}\n"
        lines = self.get_syncpaths(exclude)

        with open_file(file, "w") as f:
            for line in lines:
                if line != path:
                    f.write(line)


class GlobalSyncTarget(_SyncTarget):
    def __init__(self):
        super().__init__("global")


class GameSyncTarget(_SyncTarget):
    def __init__(self, app_id: int):
        if app_id <= 0:
            raise ValueError(f"Invalid app_id {app_id}, it is required to be > 730")
        super().__init__(str(app_id))


class ScreenshotSyncTarget(_SyncTarget):
    def __init__(self, screenshot_path: str):
        if not screenshot_path:
            raise ValueError("screenshot_path is required")
        super().__init__(screenshot_path)
        self.screenshot_path = Path(screenshot_path)

    async def sync(self) -> int:
        """
        Runs the rclone sync process.

        Returns:
        int: Exit code of the rclone sync process if it runs, -1 if it cannot run.
        """
        return await super().sync(RcloneSyncWinner.LOCAL)

    def _get_filter_str_bytes(self) -> None:
        """
        Returns None
        """
        return None

    def _get_sync_paths(self) -> tuple[str, str]:
        """
        Retrieves the sync root and destination directory from the configuration.

        Returns:
        tuple[str, str]: A tuple containing the sync root and destination directory.
        """
        screenshot_destination_directory = Path(
            Config.get_config_item("screenshot_destination_directory")
        )
        screenshot_destination_path = (
            screenshot_destination_directory / self.screenshot_path.name
        )

        return str(self.screenshot_path), str(screenshot_destination_path)
