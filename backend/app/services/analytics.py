from typing import Any, Dict


def build_event_payload(event_name: str, properties: Dict[str, Any]) -> Dict[str, Any]:
    return {"event_name": event_name, "properties": properties}
