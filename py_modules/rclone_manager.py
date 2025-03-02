import decky

from asyncio import create_subprocess_exec
from asyncio.subprocess import Process, PIPE

from utils import *


class RcloneManager:
    current_spawn: Process | None = None

    @classmethod
    def spawn(cls, cloud_type: str) -> str:
        """
        Spawns a new rclone process with the specified cloud type.

        Parameters:
        cloud_type (str): The type of cloud to use.

        Returns:
        str: The URL for authentication.
        """
        decky.logger.info("Updating rclone.conf")

        kill_previous_spawn(cls.current_spawn)
        if is_port_in_use(RCLONE_PORT):
            raise Exception("RCLONE_PORT_IN_USE")

        cls.current_spawn = create_subprocess_exec(
            str(RCLONE_BIN_PATH), *(["config", "create", "cloud", cloud_type]), stderr=PIPE
        )

        url = get_url_from_rclone_process(cls.current_spawn)
        decky.logger.info("Login URL: %s", url)

        return url

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
                return l[1].strip().split(' ')[-1]
        except:
            return ""

    @classmethod
    def cleanup(cls):
        """
        Cleans up the resources.
        """
        kill_previous_spawn(cls.current_spawn)
