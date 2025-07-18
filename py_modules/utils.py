import decky

import socket
from subprocess import Popen, PIPE
from pathlib import Path
import os, signal

from common_defs import *
from config import Config


def is_port_in_use(port: int) -> bool:
    """
    Checks if a given port is in use.

    Parameters:
    port (int): The port number to check.

    Returns:
    bool: True if the port is in use, False otherwise.
    """
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
        logger.debug("Process %d received signal %s", pid, signal.name)

        child_pids = _get_process_tree(pid)
        for child_pid in child_pids:
            send_signal(child_pid, signal)

    except Exception as e:
        logger.warning("Error sending signal %s to process %d: %s", signal.name, pid, e)


def test_syncpath(syncpath: str) -> int:
    """
    Tests a sync path to determine if it's a file or a directory.

    Parameters:
    path (str): The path to test.

    Returns:
    int: The number of files if it's a directory, -1 if it exceeds the limit, or 0 if it's a file.
    """
    roots = Config.get_config_item("sync_root")
    match = False
    for root in roots:
        if syncpath.startswith(root):
            match = True
            break
    
    if not match:
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
    for _, _, os_files in os.walk(syncpath, followlinks=True):
        count += len(os_files)
        if count > 9000:
            return -1
        if scan_single_dir:
            break

    logger.debug("Counted %d files", count)
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
        logger.error("Invalid screenshot URL: %s", screenshot_url)

    return (
        f"{decky.DECKY_USER_HOME}/.steam/steam/userdata/{user_id}/760/remote/{subpath}"
    )


def get_available_filters() -> list[int]:
    """
    Returns a list of available sync targets.

    Returns:
    list[int]: A list of available sync targets.
    """
    sync_paths = list()
    for filter in PLUGIN_CONFIG_DIR.glob("*.filter"):
        if filter.stem in SYNC_FILTER_TYPE_DICT:
            sync_paths.append(SYNC_FILTER_TYPE_DICT[filter.stem])
        elif filter.stem.isdigit():
            sync_paths.append(int(filter.stem))

    return sync_paths


def get_filters(file: Path) -> list[str]:
    """
    Retrieves sync filters from the specified file.

    Parameters:
    file (Path): Path of the filter file

    Returns:
    list[str]: A list of filters, '\\n's will be stripped.
    """
    if not file.exists():
        return []
    with file.open("r") as f:
        return [
            stripped for line in f.read().splitlines() if (stripped := line.strip())
        ]


def set_filters(file: Path, filters: list[str]):
    """
    Updates sync filters to the specified file.

    Parameters:
    file (Path): Path of the filter file
    filters (list[str]): The filters to set, elements inside should not contain '\\n'.
    """
    if not filters:
        file.unlink(missing_ok=True)
        return

    str_to_write = "\n".join(stripped for path in filters if (stripped := path.strip()))
    with file.open("w") as f:
        f.write(str_to_write)
