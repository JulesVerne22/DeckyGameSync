from asyncio import create_subprocess_exec
from asyncio.subprocess import Process, PIPE
from time import sleep
import re

from utils import *


class RcloneManager:
    current_spawn: Process | None = None

    @classmethod
    async def spawn(cls, cloud_type: str) -> str:
        """
        Spawns a new rclone process with the specified cloud type.

        Parameters:
        cloud_type (str): The type of cloud to use.

        Returns:
        str: The URL for authentication.
        """
        logger.info("Updating rclone.conf")

        cls.kill_current_spawn()
        if is_port_in_use(RCLONE_PORT):
            raise Exception("RCLONE_PORT_IN_USE")

        cls.current_spawn = await create_subprocess_exec(
            str(RCLONE_BIN_PATH),
            *(["config", "create", "cloud", cloud_type]),
            stderr=PIPE,
        )

        url = await cls.get_url_from_rclone_process()
        logger.debug(f"Login URL: {url}")
        return url

    @classmethod
    def kill_current_spawn(cls):
        """
        Kills the previous spawned process.

        Parameters:
        process (asyncio.subprocess.Process): The process to be killed.
        """
        if cls.current_spawn and cls.current_spawn.returncode is None:
            logger.warning("Killing previous Process")
            cls.current_spawn.kill()
            sleep(0.1)  # Give time for OS to clear up the port
            cls.current_spawn = None

    @classmethod
    async def get_url_from_rclone_process(cls):
        """
        Extracts the URL from the stderr of the rclone process.

        Parameters:
        process (asyncio.subprocess.Process): The rclone process.

        Returns:
        str: The URL extracted from the process output.
        """
        for _ in range(2):
            line = (await cls.current_spawn.stderr.readline()).decode()
            logger.debug(f"Rclone output: {line}")
            if url_re_match := re.search(r"http://127.0.0.1:\d+/auth\?state=.*", line):
                return url_re_match.group(0)

        logger.warning("Failed to extract URL from rclone process")
        cls.kill_current_spawn()
        return ""

    @classmethod
    def probe(cls) -> int:
        """
        Checks if the current rclone process is running.

        Returns:
        int: The return code of the rclone process.
        """
        if not cls.current_spawn:
            return 0

        return cls.current_spawn.returncode

    @classmethod
    def get_cloud_type(cls) -> str:
        """
        Retrieves the current cloud type from the rclone configuration.

        Returns:
        str: The current cloud type, empty string if it doesn't exist
        """
        try:
            with RCLONE_CFG_PATH.open("r") as f:
                l = f.readlines()
                return l[1].strip().split(" ")[-1]
        except:
            return ""
