"""Tests for the telemetry aggregator."""

from services.telemetry import Telemetry


def test_empty_summary():
    t = Telemetry()
    s = t.summary
    assert s["total"] == 0
    assert s["avg_duration_ms"] == 0.0


def test_record_and_total():
    t = Telemetry()
    t.record("/health", "GET", 200, 5.0)
    t.record("/api/chat/", "POST", 200, 100.0)
    assert t.summary["total"] == 2


def test_error_counting():
    t = Telemetry()
    t.record("/upload", "POST", 413, 20.0)
    t.record("/upload", "POST", 200, 15.0)
    assert t.summary["error_total"] == 1


def test_avg_duration():
    t = Telemetry()
    t.record("/a", "GET", 200, 10.0)
    t.record("/b", "GET", 200, 30.0)
    assert t.summary["avg_duration_ms"] == 20.0


def test_max_samples_eviction():
    t = Telemetry(max_samples=3)
    for i in range(5):
        t.record(f"/path{i}", "GET", 200, float(i))
    assert len(t._samples) == 3
    assert t.summary["total"] == 5  # total counts all, not just samples


def test_p95_duration():
    t = Telemetry()
    for i in range(100):
        t.record("/x", "GET", 200, float(i))
    s = t.summary
    assert s["p95_duration_ms"] >= 90.0
