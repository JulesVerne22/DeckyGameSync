from sync_target import SyncTarget

class GameSyncTarget(SyncTarget):
    DEFAULT_CONFIG = {
        "bisync": False,
    }

    def __init__(self, app_id: int):
        if app_id <= 730:
            raise ValueError(f"Invalid app_id {app_id}, it is required to be > 730")

        super().__init__(str(app_id))
