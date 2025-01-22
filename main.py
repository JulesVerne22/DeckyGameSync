import decky_plugin
import sys
from os import path

import signal
import process_utils
import logger_utils
from rclone_setup_manager import RcloneSetupManager

from sync_target import *
from config import Config


class Plugin:
    manager_setup = RcloneSetupManager()
    ongoing_sync_targets = dict()

    # rclone.conf Setup

    async def spawn(self, backend_type: str):
        decky_plugin.logger.debug(f"Executing spawn(backend_type={backend_type})")
        return await self.manager_setup.spawn(backend_type)

    async def spawn_probe(self):
        decky_plugin.logger.debug(f"Executing probe()")
        return await self.manager_setup.probe()

    async def get_backend_type(self):
        decky_plugin.logger.debug(f"Executing get_backend_type()")
        return await self.manager_setup.get_backend_type()

    # Sync Paths

    async def get_syncpaths(self, exclude: bool, app_id=None):
        decky_plugin.logger.debug(
            f"Executing get_syncpaths(exclude={exclude}, app_id={app_id})"
        )
        return SyncTarget().get_syncpaths(exclude)

    async def test_syncpath(self, path: str):
        decky_plugin.logger.debug(f"Executing test_syncpath({path})")
        return self.manager_setup.test_syncpath(path)

    async def add_syncpath(self, path: str, exclude: bool):
        decky_plugin.logger.debug(
            f"Executing add_syncpath(path={path}, exclude={exclude})"
        )
        return SyncTarget().add_syncpath(path, exclude)

    async def remove_syncpath(self, path: str, exclude: bool):
        decky_plugin.logger.debug(
            f"Executing remove_syncpath(path={path}, exclude={exclude})"
        )
        return SyncTarget().remove_syncpath(path, exclude)

    # Syncing

    async def sync_now_internal(self, winner: str, resync: bool):
        decky_plugin.logger.info(
            f"Executing RcloneSyncManager.sync_now(winner={winner}, resync={resync})"
        )
        return SyncTarget().sync_now(winner, resync)

    async def sync_now_probe(self):
        decky_plugin.logger.debug(f"Executing RcloneSyncManager.probe()")
        return await self.manager_sync.probe()

    async def delete_lock_files(self):
        decky_plugin.logger.debug(f"Executing RcloneSyncManager.delete_lock_files()")
        return await self.manager_sync.delete_lock_files()

    # Processes

    async def signal(self, pid: int, s: str):
        decky_plugin.logger.debug(f"Executing send_signal(pid={pid}, s={s})")
        if s == "SIGSTOP":
            return process_utils.send_signal(pid, signal.SIGSTOP)
        elif s == "SIGCONT":
            return process_utils.send_signal(pid, signal.SIGCONT)

    # Configuration

    async def get_log_level(self):
        decky_plugin.logger.debug(f"Executing get_log_level()")
        return decky_plugin.logger.level

    async def get_config(self):
        decky_plugin.logger.debug(f"Executing get_config()")
        return Config.get_config()

    async def set_config(self, key: str, value: str):
        decky_plugin.logger.debug(f"Executing set_config(key={key}, value={value})")
        Config.set_config(key, value)

    # Logger

    async def log(self, level: str, msg: str) -> int:
        decky_plugin.logger.debug(f"Executing log()")
        return logger_utils.log(level, msg)

    async def get_last_sync_log(self) -> str:
        decky_plugin.logger.debug(f"Executing get_last_sync_log()")
        return logger_utils.get_last_sync_log()

    async def get_plugin_log(self) -> str:
        decky_plugin.logger.debug(f"Executing get_plugin_log()")
        return logger_utils.get_plugin_log()

    # Lifecycle

    async def _main(self):
        logger_level = Config.get_config_item("log_level")
        decky_plugin.logger.setLevel(logger_level)

        decky_plugin.logger.debug(f"rclone exe path: {RCLONE_BIN_PATH}")
        decky_plugin.logger.debug(f"rclone cfg path: {RCLONE_CFG_PATH}")

    async def _unload(self):
        self.manager_setup.cleanup()

    async def _migration(self):
        # plugin_config.migrate()
        pass
