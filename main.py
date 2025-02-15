import decky_plugin

import signal
import logger_utils
from typing import Any

from rclone_manager import RcloneManager
from sync_target import *
from config import Config
import utils


class Plugin:

    # rclone.conf Setup

    async def spawn(self, backend_type: str) -> str:
        decky_plugin.logger.debug(f"Executing spawn(backend_type={backend_type})")
        return RcloneManager.spawn(backend_type)

    async def spawn_probe(self) -> int:
        decky_plugin.logger.debug(f"Executing probe()")
        return RcloneManager.probe()

    async def get_backend_type(self) -> str:
        decky_plugin.logger.debug(f"Executing get_backend_type()")
        return RcloneManager.get_backend_type()

    # Sync Paths

    async def get_syncpaths(self, exclude: bool, app_id: int = 0) -> list[str]:
        decky_plugin.logger.debug(f"Executing get_syncpaths(exclude={exclude}, app_id={app_id})")
        if app_id > 0:
            return GameSyncTarget(app_id).get_syncpaths(exclude)
        else:
            return GlobalSyncTarget().get_syncpaths(exclude)

    async def add_syncpath(self, path: str, exclude: bool, app_id: int = 0) -> None:
        decky_plugin.logger.debug(f"Executing add_syncpath(path={path}, exclude={exclude}, app_id={app_id})")
        if app_id > 0:
            GameSyncTarget(app_id).add_syncpath(exclude)
        else:
            GlobalSyncTarget().add_syncpath(path, exclude)

    async def remove_syncpath(self, path: str, exclude: bool, app_id: int = 0) -> None:
        decky_plugin.logger.debug(f"Executing remove_syncpath(path={path}, exclude={exclude}, app_id={app_id})")
        if app_id > 0:
            GameSyncTarget(app_id).remove_syncpath(exclude)
        else:
            GlobalSyncTarget().remove_syncpath(path, exclude)

    async def test_syncpath(self, path: str) -> int:
        decky_plugin.logger.debug(f"Executing test_syncpath({path})")
        return utils.test_syncpath(path)

    # Syncing

    async def sync_now(self, winner: str, app_id: int = 0) -> int | None:
        decky_plugin.logger.debug(f"Executing RcloneSyncManager.sync_now(winner={winner}, app_id={app_id})")
        if app_id > 0:
            return await GameSyncTarget(app_id).sync_now(winner)
        else:
            return await GlobalSyncTarget().sync_now(winner)

    async def resync_now(self, winner:str, app_id: int = 0) -> int | None:
        decky_plugin.logger.debug(f"Executing RcloneSyncManager.resync_now(winner={winner}, app_id={app_id})")
        if app_id > 0:
            return await GameSyncTarget(app_id).sync_now(winner, True)
        else:
            return await GlobalSyncTarget().sync_now(winner, True)

    async def sync_now_screenshots(self) -> int | None:
        decky_plugin.logger.debug(f"Executing RcloneSyncManager.sync_now_screenshots()")
        return await LibrarySyncTarget("Pictures").sync_now()

    async def delete_lock_files(self):
        decky_plugin.logger.debug(f"Executing RcloneSyncManager.delete_lock_files()")
        return utils.delete_lock_files()

    # Processes

    async def signal(self, pid: int, s: str) -> None:
        decky_plugin.logger.debug(f"Executing send_signal(pid={pid}, s={s})")
        utils.send_signal(pid, getattr(signal, s))

    # Configuration

    async def get_log_level(self) -> int:
        decky_plugin.logger.debug(f"Executing get_log_level()")
        return decky_plugin.logger.level

    async def get_config(self):
        decky_plugin.logger.debug(f"Executing get_config()")
        return Config.get_config()

    async def set_config(self, key: str, value: Any):
        decky_plugin.logger.debug(f"Executing set_config(key={key}, value={value})")
        Config.set_config(key, value)

    # Logger

    async def log_debug(self, msg: str) -> None:
        decky_plugin.logger.debug(msg)

    async def log_info(self, msg: str) -> None:
        decky_plugin.logger.info(msg)

    async def log_warning(self, msg: str) -> None:
        decky_plugin.logger.warning(msg)

    async def log_error(self, msg: str) -> None:
        decky_plugin.logger.error(msg)

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
        RcloneManager.cleanup()

    async def _migration(self):
        # plugin_config.migrate()
        pass
