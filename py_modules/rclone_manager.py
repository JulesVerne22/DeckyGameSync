import decky_plugin

from asyncio import create_subprocess_exec
from asyncio.subprocess import Process, PIPE

from utils import *


class RcloneManager:
    current_spawn: Process | None = None

    @classmethod
    def spawn(cls, backend_type: str):
        """
        Spawns a new rclone process with the specified backend type.

        Parameters:
        backend_type (str): The type of backend to use.

        Returns:
        str: The URL for authentication.
        """
        decky_plugin.logger.info("Updating rclone.conf")

        kill_previous_spawn(cls.current_spawn)
        if is_port_in_use(RCLONE_PORT):
            raise Exception("RCLONE_PORT_IN_USE")

        cls.current_spawn = create_subprocess_exec(
            str(RCLONE_BIN_PATH), *(["config", "create", "backend", backend_type]), stderr=PIPE
        )

        url = get_url_from_rclone_process(cls.current_spawn)
        decky_plugin.logger.info("Login URL: %s", url)

        return url

    @classmethod
    def probe(cls):
        """
        Checks if the current rclone process is running.

        Returns:
        int: The return code of the rclone process.
        """
        if not cls.current_spawn:
            return 0

        return cls.current_spawn.returncode

    @classmethod
    def get_backend_type(cls):
        """
        Retrieves the current backend type from the rclone configuration.

        Returns:
        str: The current backend type.
        """
        with RCLONE_CFG_PATH.open("r") as f:
            l = f.readlines()
            return l[1]

    @classmethod
    def cleanup(cls):
        """
        Cleans up the resources.
        """
        kill_previous_spawn(cls.current_spawn)
