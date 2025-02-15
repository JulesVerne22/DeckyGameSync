from datetime import datetime
from pathlib import Path
from asyncio.subprocess import create_subprocess_exec, PIPE
from subprocess import list2cmdline

import decky_plugin
from config import Config
from utils import *

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

    def get_filter_str_bytes(self) -> bytes | None:
        """
        Generates the sync paths filter file based on includes and excludes files.

        Returns:
        bytes: Bytes of string containing all filter entries if sync path files exist, None otherwise
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

    def get_filter_args(self) -> list[str]:
        """
        Retrieves the filter arguments for rclone.

        Returns:
        list: A list of filter arguments.
        """
        sync_root, destination_dir = Config.get_config_items("sync_root", "destination_directory")
        return [sync_root, f"backend:{destination_dir}", "--filter-from", "-"]

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

    def is_bisync_enabled(self) -> bool:
        """
        Retrieves the bisync config option.

        Returns:
        bool: bisync config option
        """
        return Config.get_config_item("bisync")

    async def sync_now(self, winner: str = "", resync: bool = False) -> int | None:
        """
        Do synchronization using rclone. Sync again if self.sync_again is set to True and
        current sync finished successfully. Otherwise stop here and return the exit code.

        Parameters:
        winner (str, optional): The winner of the resync operation. Defaults to "".
        resync (bool, optional): Whether to perform a resync operation. Defaults to False.

        Returns:
        int | None: Exit code of this sync if this sync runs, None otherwise
        """
        if (ongoing_sync := ONGOING_SYNCS.get(self.id)) is not None:
            # ongoing_sync.sync_again = True
            return None

        sync_result = await self._sync_now_internal(winner, resync)

        # ONGOING_SYNCS[self.id] = self
        # while self.sync_again == True:
        #     self.sync_again = False
        #     sync_result = await self._sync_now_internal(winner, resync)
        #     if sync_result != 0:
        #         break

        ONGOING_SYNCS.pop(self.id)
        return sync_result

    async def _sync_now_internal(self, winner: str, resync: bool) -> int | None:
        """
        Initiates a synchronization process using rclone.

        Parameters:
        winner (str): The winner of the resync operation
        resync (bool): Whether to perform a resync operation.

        Returns:
        int | None: Exit code of this sync if the filter is not empty, None otherwise
        """
        self.rclone_log_path = self.create_rclone_log_file()
        bisync = self.is_bisync_enabled()
        args = []

        if bisync:
            args.extend(["bisync"])
            logger.debug("Using bisync")
        else:
            args.extend(["copy"])
            logger.debug("Using copy")

        args.extend(self.get_filter_args())
        if bisync:
            if resync:
                args.extend(["--resync-mode", winner, "--resync"])
            else:
                args.extend(["--conflict-resolve", winner])

        args.extend(
            [
                "--copy-links",
                "--transfers",
                "8",
                "--checkers",
                "16",
                "--log-file",
                str(self.rclone_log_path),
                "--log-format",
                "none",
                "-v",
            ]
        )

        args.extend(Config.get_config_item("additional_sync_args"))

        logger.info(f"Running command: {RCLONE_BIN_PATH} {list2cmdline(args)}")

        current_sync = await create_subprocess_exec(
            str(RCLONE_BIN_PATH),
            *args,
            stdin=PIPE,
            stdout=PIPE,
            stderr=PIPE,
        )
        sync_stdcout, sync_stderr = await current_sync.communicate(self.get_filter_str_bytes())
        sync_result = current_sync.returncode

        logger.info(f"Sync {self.rclone_log_path} finished with exit code: {sync_result}")
        if sync_stdcout:
            logger.info(f"Sync {self.rclone_log_path} stdout: {sync_stdcout.decode(STR_ENCODING)}")
        if sync_stderr:
            logger.error(f"Sync {self.rclone_log_path} stderr: {sync_stderr.decode(STR_ENCODING)}")

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


class LibrarySyncTarget(_SyncTarget):
    def __init__(self, library: str):
        if not library:
            raise ValueError("library is required")
        super().__init__(library)

    def get_filter_args(self) -> list[str]:
        """
        Retrieves the filter arguments for rclone.

        Returns:
        list: A list of filter arguments.
        """
        destination_dir = Config.get_config_item("screenshot_sync_destination")
        return [str(Path.home() / self.id), f"backend:{destination_dir}"]

    def is_bisync_enabled(self) -> bool:
        """
        Retrieves the bisync config option.

        Returns:
        bool: bisync config option
        """
        return False

    def get_filter_str_bytes(self) -> None:
        """
        Returns None
        """
        return None
