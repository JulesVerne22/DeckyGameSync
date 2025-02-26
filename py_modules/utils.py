import decky

from asyncio import sleep
from asyncio.subprocess import Process
from subprocess import Popen, PIPE
from pathlib import Path
import os, signal, re

from common_defs import *
from config import Config


def kill_previous_spawn(process: Process):
    """
    Kills the previous spawned process.

    Parameters:
    process (asyncio.subprocess.Process): The process to be killed.
    """
    if process and process.returncode is None:
        logger.warning("Killing previous Process")

        process.kill()

        sleep(0.1)  # Give time for OS to clear up the port


async def get_url_from_rclone_process(process: Process):
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
            f"(http:\/\/127\.0\.0\.1:{RCLONE_PORT}\/auth\?state=.*)\\n$", line
        )
        if url_re_match:
            return url_re_match.group(1)


def is_port_in_use(port: int) -> bool:
    """
    Checks if a given port is in use.

    Parameters:
    port (int): The port number to check.

    Returns:
    bool: True if the port is in use, False otherwise.
    """
    import socket

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


def _get_process_tree(pid):
    """
    Retrieves the process tree of a given process ID.

    Parameters:
    pid (int): The process ID whose process tree is to be retrieved.

    Returns:
    list: A list of child process IDs.
    """
    children = []
    with Popen(["ps", "--ppid", str(pid), "-o", "pid="], stdout=PIPE) as p:
        lines = p.stdout.readlines()
    for chldPid in lines:
        chldPid = chldPid.strip()
        if not chldPid:
            continue
        children.extend([int(chldPid.decode())])

    return children


def send_signal(pid: int, signal: signal.Signals):
    """
    Sends a signal to a process and its child processes recursively.

    Parameters:
    pid (int): The process ID of the target process.
    signal (signal.Signals): The signal to send.

    Raises:
    Exception: If an error occurs while sending the signal.
    """
    try:
        os.kill(pid, signal)
        logger.debug(f"Process {pid} received signal {signal.name}")

        child_pids = _get_process_tree(pid)
        for child_pid in child_pids:
            send_signal(child_pid, signal)

    except Exception as e:
        logger.warning(f"Error sending signal {signal.name} to process {pid}: {e}")


def test_syncpath(syncpath: str):
    """
    Tests a sync path to determine if it's a file or a directory.

    Parameters:
    path (str): The path to test.

    Returns:
    int: The number of files if it's a directory, -1 if it exceeds the limit, or 0 if it's a file.
    """
    if not syncpath.startswith(Config.get_config_item("sync_root")):
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
        logger.debug(f"{root} {os_dirs} {os_files}")
        count += len(os_files)
        if count > 9000:
            return -1
        if scan_single_dir:
            break

    return count


def delete_lock_files():
    """
    Deletes rclone lock files
    """
    logger.info("Deleting lock files.")
    for lck_file in RCLONE_BISYNC_CACHE_DIR.glob("*.lck"):
        lck_file.unlink(missing_ok=True)


def get_plugin_log() -> str:
    """
    Retrieves the entire plugin log.

    Returns:
    str: The plugin log.
    """
    with open(decky.DECKY_PLUGIN_LOG) as f:
        return f.read()


def getLocalScreenshotPath(user_id: int, screenshot_url: str) -> str:
    """
    Returns the local screenshot path for a given user and screenshot URL.

    Parameters:
    user_id (int): The user ID.
    screenshot_url (str): The URL of the screenshot,
                          example: "https://steamloopback.host/screenshots/7/screenshots/20250218080004_1.jpg"

    Returns:
    str: The local screenshot path,
         example: /home/deck/.steam/steam/userdata/9999999/760/remote/7/screenshots/20250218080004_1.jpg
    """
    subpath = "/".join(screenshot_url.split("/")[-3:])
    if not subpath:
        logger.error(f"Invalid screenshot URL: {screenshot_url}")

    return (
        f"{decky.DECKY_USER_HOME}/.steam/steam/userdata/{user_id}/760/remote/{subpath}"
    )
