from asyncio.subprocess import Process, create_subprocess_exec
from pathlib import Path
import asyncio
import os
import re

import decky_plugin

from game_sync_target import *
from library_sync_target import *
from sync_target import *

async def _kill_previous_spawn(process: Process):
    """
    Kills the previous spawned process.

    Parameters:
    process (asyncio.subprocess.Process): The process to be killed.
    """
    if process and process.returncode is None:
        decky_plugin.logger.warning("Killing previous Process")

        process.kill()

        await asyncio.sleep(0.1)  # Give time for OS to clear up the port

def _is_port_in_use(port: int) -> bool:
    """
    Checks if a given port is in use.

    Parameters:
    port (int): The port number to check.

    Returns:
    bool: True if the port is in use, False otherwise.
    """
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

async def _get_url_from_rclone_process(process: asyncio.subprocess.Process):
    """
    Extracts the URL from the stderr of the rclone process.

    Parameters:
    process (asyncio.subprocess.Process): The rclone process.

    Returns:
    str: The URL extracted from the process output.
    """
    while True:
        line = (await process.stderr.readline()).decode()
        url_re_match = re.search(
            "(http:\/\/127\.0\.0\.1:53682\/auth\?state=.*)\\n$", line)
        if url_re_match:
            return url_re_match.group(1)

class RcloneSetupManager:
    current_spawn: Process | None = None

    async def spawn(self, backend_type: str):
        """
        Spawns a new rclone process with the specified backend type.

        Parameters:
        backend_type (str): The type of backend to use.

        Returns:
        str: The URL for authentication.
        """
        decky_plugin.logger.info("Updating rclone.conf")

        await _kill_previous_spawn(self.current_spawn)
        if _is_port_in_use(53682):
            raise Exception('RCLONE_PORT_IN_USE')

        self.current_spawn = await create_subprocess_exec(str(RCLONE_BIN_PATH), *(["config", "create", "backend", backend_type]), stderr=asyncio.subprocess.PIPE)

        url = await _get_url_from_rclone_process(self.current_spawn)
        decky_plugin.logger.info("Login URL: %s", url)

        return url

    async def probe(self):
        """
        Checks if the current rclone process is running.

        Returns:
        int: The return code of the rclone process.
        """
        if not self.current_spawn:
            return 0

        return self.current_spawn.returncode

    def delete_lock_files(self):
        """
        Deletes rclone lock files
        """
        decky_plugin.logger.info("Deleting lock files.")
        for lck_file in RCLONE_BISYNC_CACHE_DIR.glob("*.lck"):
            lck_file.unlink(missing_ok=True)

    async def get_backend_type(self):
        """
        Retrieves the current backend type from the rclone configuration.

        Returns:
        str: The current backend type.
        """
        with RCLONE_CFG_PATH.open("r") as f:
            l = f.readlines()
            return l[1]

    def cleanup(self):
        """
        Cleans up the resources.
        """
        _kill_previous_spawn(self.current_spawn)

    def test_syncpath(self, syncpath: str):
        """
        Tests a sync path to determine if it's a file or a directory.

        Parameters:
        path (str): The path to test.

        Returns:
        int: The number of files if it's a directory, -1 if it exceeds the limit, or 0 if it's a file.
        """
        if not syncpath.startswith(SyncTarget().get_config_item("sync_root")):
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
