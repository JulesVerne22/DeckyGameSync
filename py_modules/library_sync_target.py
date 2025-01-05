from sync_target import SyncTarget

class LibrarySyncTarget(SyncTarget):
    def __init__(self, library: str):
        if not library:
            raise ValueError("library is required")

        super().__init__(library)

        self.DEFAULT_CONFIG = {
            "enabled": False,
            "bisync": False,
            "destination_directory": f"deck-libraries/{library}",
        }

    def get_filter_args(self) -> list:
        """
        Retrieves the filter arguments for rclone.
        For library sync, no filter args will be used.

        Returns:
        list: An empty list
        """
        return []