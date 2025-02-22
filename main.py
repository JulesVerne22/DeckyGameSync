import signal
from typing import Any

from common_defs import *
from config import Config
import utils
from rclone_manager import RcloneManager
from sync_target import *


class Plugin:

    # rclone.conf Setup

    async def spawn(self, backend_type: str) -> str:
        logger.debug(f"Executing spawn(backend_type={backend_type})")
        return RcloneManager.spawn(backend_type)

    async def spawn_probe(self) -> int:
        logger.debug(f"Executing probe()")
        return RcloneManager.probe()

    async def get_backend_type(self) -> str:
        logger.debug(f"Executing get_backend_type()")
        return RcloneManager.get_backend_type()

    # Sync Paths

    async def get_filters_target(self, app_id: int = 0) -> list[str]:
        logger.debug(f"Executing get_filters_target(app_id={app_id})")
        return get_sync_target(app_id).get_filters(FilterType.TARGET)

    async def get_filters_general(self, app_id: int = 0) -> list[str]:
        logger.debug(f"Executing get_filters_general(app_id={app_id})")
        return get_sync_target(app_id).get_filters(FilterType.GENERAL)

    async def set_filters_target(self, paths: list[str], app_id: int = 0) -> None:
        logger.debug(
            f"Executing set_filters_target(path={paths}, app_id={app_id})"
        )
        return get_sync_target(app_id).set_filters(FilterType.TARGET)

    async def set_filters_general(self, paths: list[str], app_id: int = 0) -> None:
        logger.debug(
            f"Executing set_filters_general(path={paths}, app_id={app_id})"
        )
        return get_sync_target(app_id).set_filters(FilterType.GENERAL)

    async def test_syncpath(self, path: str) -> int:
        logger.debug(f"Executing test_syncpath({path})")
        return utils.test_syncpath(path)

    # Syncing

    async def sync_local_first(self, app_id: int = 0) -> int:
        logger.debug(f"Executing sync_local_first(app_id={app_id})")
        return await self._sync(RcloneSyncWinner.LOCAL, app_id)

    async def sync_cloud_first(self, app_id: int = 0) -> int:
        logger.debug(f"Executing sync_cloud_first(app_id={app_id})")
        return await self._sync(RcloneSyncWinner.CLOUD, app_id)

    async def resync_local_first(self) -> int:
        logger.debug(f"Executing resync_local_first()")
        return await GlobalSyncTarget().resync(RcloneSyncWinner.LOCAL)

    async def resync_cloud_first(self) -> int:
        logger.debug(f"Executing resync_cloud_first()")
        return await GlobalSyncTarget().resync(RcloneSyncWinner.CLOUD)

    async def sync_screenshot(self, user_id: int, screenshot_url: str) -> int:
        logger.debug(f"Executing sync_screenshot()")
        return await ScreenshotSyncTarget(
            utils.getLocalScreenshotPath(user_id, screenshot_url)
        ).sync()

    async def delete_lock_files(self):
        logger.debug(f"Executing delete_lock_files()")
        return utils.delete_lock_files()

    async def _sync(self, winner: RcloneSyncWinner, app_id: int = 0) -> int:
        return await get_sync_target(app_id).sync(winner)

    # Processes

    async def pause_process(self, pid: int) -> None:
        logger.debug(f"Executing pause_process(pid={pid})")
        utils.send_signal(pid, signal.SIGSTOP)

    async def resume_process(self, pid: int) -> None:
        logger.debug(f"Executing resume_process(pid={pid})")
        utils.send_signal(pid, signal.SIGCONT)

    # Configuration

    async def get_config(self) -> dict[str, Any]:
        logger.debug(f"Executing get_config()")
        return Config.get_config()

    async def set_config(self, key: str, value: Any):
        logger.debug(f"Executing set_config(key={key}, value={value})")
        Config.set_config(key, value)

    # async def mkdir_dest_dir(self):
    #     logger.debug(f"Executing cloud_mkdir()")
    #     utils.mkdir_dest_dir()

    # Logger

    async def log_debug(self, msg: str) -> None:
        logger.debug(msg)

    async def log_info(self, msg: str) -> None:
        logger.info(msg)

    async def log_warning(self, msg: str) -> None:
        logger.warning(msg)

    async def log_error(self, msg: str) -> None:
        logger.error(msg)

    async def get_last_sync_log(self) -> str:
        logger.debug(f"Executing get_last_sync_log()")
        # return logger_utils.get_last_sync_log()
        return "unimplemented"

    async def get_plugin_log(self) -> str:
        logger.debug(f"Executing get_plugin_log()")
        return utils.get_plugin_log()

    # Lifecycle

    async def _main(self):
        logger_level = Config.get_config_item("log_level")
        logger.setLevel(logger_level)

        logger.debug(f"rclone exe path: {RCLONE_BIN_PATH}")
        logger.debug(f"rclone cfg path: {RCLONE_CFG_PATH}")

    async def _unload(self):
        RcloneManager.cleanup()

    async def _migration(self):
        # plugin_config.migrate()
        pass
