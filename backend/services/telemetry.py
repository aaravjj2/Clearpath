"""
Lightweight telemetry module for ClearPath.

Tracks usage statistics in-memory (no external service required).
Designed to be swapped for OpenTelemetry or Datadog in production.
"""

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class RequestStat:
    path: str
    method: str
    status: int
    duration_ms: float


class Telemetry:
    """In-memory request telemetry aggregator."""

    def __init__(self, max_samples: int = 1000) -> None:
        self._samples: List[RequestStat] = []
        self._max = max_samples
        self._total = 0
        self._error_total = 0

    def record(self, path: str, method: str, status: int, duration_ms: float) -> None:
        stat = RequestStat(path=path, method=method, status=status, duration_ms=duration_ms)
        if len(self._samples) >= self._max:
            self._samples.pop(0)
        self._samples.append(stat)
        self._total += 1
        if status >= 400:
            self._error_total += 1

    @property
    def summary(self) -> dict:
        if not self._samples:
            return {"total": 0, "error_total": 0, "avg_duration_ms": 0.0, "paths": {}}
        durations = [s.duration_ms for s in self._samples]
        paths: Dict[str, int] = defaultdict(int)
        for s in self._samples:
            paths[s.path] += 1
        return {
            "total": self._total,
            "error_total": self._error_total,
            "avg_duration_ms": round(sum(durations) / len(durations), 1),
            "p95_duration_ms": round(sorted(durations)[int(len(durations) * 0.95)], 1),
            "paths": dict(sorted(paths.items(), key=lambda x: -x[1])[:10]),
        }


_telemetry = Telemetry()


def get_telemetry() -> Telemetry:
    return _telemetry
