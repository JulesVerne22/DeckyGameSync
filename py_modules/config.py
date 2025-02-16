from pathlib import Path
from typing import Any
import json

import decky_plugin
from settings import SettingsManager
from utils import *

DEFAULT_CONFIG = dict()
try:
    with PLUGIN_DEFAULT_CONFIG_PATH.open('r') as f:
        DEFAULT_CONFIG.update(json.load(f))
except Exception as e:
    logger.error(f"Failed to load default config: {e}")

class Config():
    config_dir = Path(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR)
    config = SettingsManager(name="config", settings_directory=str(config_dir))

    @classmethod
    def get_config(cls) -> dict:
        """
        Retrieves the plugin configuration.

        Returns:
        dict: The plugin configuration.
        """
        # cls.read()
        if not cls.config.settings:
            cls.config.settings = cls.DEFAULT_CONFIG
            cls.commit()

        return cls.settings

    @classmethod
    def get_config_item(cls, key: str) -> int|bool|str:
        """
        Retrieves a configuration item.

        Parameters:
        key (str): The key to get.

        Returns:
        int|bool|str: The value of the configuration item.
                      If the config doesn't exist, the default value will be returned.
                      If the entry doesn't exist in the default config, the value from the default config fallback will be returned.
        """
        all_configs = cls.get_config()
        return all_configs.get(key)

    @classmethod
    def get_config_items(cls, *keys: str)-> tuple[bool | str | list[str], ...]:
        """
        Retrieves multiple configuration items.

        Parameters:
        *keys (str): The keys to get.

        Returns:
        tuple: Requested configuration items.
        """
        all_configs = cls.get_config()
        return *[all_configs.get(key, cls.DEFAULT_CONFIG.get(key)) for key in keys],

    @classmethod
    def set_config(cls, key: str, value: Any):
        """
        Sets a configuration key-value pair in the plugin configuration file.

        Parameters:
        key (str): The key to set.
        value (Any): The value to set for the key.
        """
        cls.setSetting(key, value)
