import decky_plugin

from asyncio import sleep
from asyncio.subprocess import Process
from subprocess import Popen, PIPE
from pathlib import Path
from enum import Enum
import os, signal, re

from config import Config

STR_ENCODING = "utf-8"
RCLONE_PORT = 53682

RCLONE_BIN_PATH = Path(decky_plugin.DECKY_PLUGIN_DIR) / "bin/rcloneLauncher"
RCLONE_CFG_PATH = Path(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR) / "rclone.conf"
RCLONE_BISYNC_CACHE_DIR = Path(decky_plugin.HOME) / ".cache/rclone/bisync"

PLUGIN_DEFAULT_CONFIG_PATH = Path(decky_plugin.DECKY_PLUGIN_DIR) / "bin/default_config.json"

class RcloneSyncMode(Enum):
    """
    Enum representing the different modes of rclone sync operations.
    """
    COPY = "copy"
    SYNC = "sync"
    BISYNC = "bisync"

class RcloneSyncWinner(Enum):
    """
    Enum representing the winner in rclone bisync
    """
    LOCAL = 1
    CLOUD = 2

class SyncPathType(Enum):
    """
    Enum representing the different types of sync paths.
    """
    INCLUDE = True
    EXCLUDE = False

logger = decky_plugin.logger

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
            f"(http:\/\/127\.0\.0\.1:{RCLONE_PORT}\/auth\?state=.*)\\n$", line)
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
        return s.connect_ex(('localhost', port)) == 0

def get_process_tree(pid):
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

    return children;

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
        logger.info("Process with PID %d received signal %s.", pid, signal)

        child_pids = get_process_tree(pid)

        for child_pid in child_pids:
            send_signal(child_pid, signal)

    except Exception as e:
         logger.error("Error sending signal to process with PID %d: %s", pid, e)

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
        logger.debug("%s %s %s", root, os_dirs, os_files)
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

def open_file(file: Path, *args, **kwargs):
    """
    Wrapper function of Path.open() to guarantee the file exists

    Parameters:
    file (Path): Path object to the file.
    *args: Positional arguments to pass to the Path.open() function.
    **kwargs: Keyword arguments to pass to the Path.open() function.

    Returns:
    Whatever file.open() returns
    """
    file.parent.mkdir(parents=True, exist_ok=True)
    file.touch(exist_ok=True)
    return file.open(*args, **kwargs)

def get_plugin_log() -> str:
    """
    Retrieves the entire plugin log.

    Returns:
    str: The plugin log.
    """
    log: str = ""
    with open(decky_plugin.DECKY_PLUGIN_LOG) as f:
        for line in reversed(list(f)):
            log = line + '\n' + log
            if "Logger initialized at level" in line.strip():
                break
    return log
