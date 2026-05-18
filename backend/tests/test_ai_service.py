"""Unit tests for AI service helpers (no live API calls)."""

import json
import pytest
from services.ai import _extract_json


class TestExtractJson:
    def test_bare_json(self):
        data = _extract_json('{"key": "value", "num": 42}')
        assert data == {"key": "value", "num": 42}

    def test_json_fence(self):
        raw = "```json\n{\"a\": 1}\n```"
        assert _extract_json(raw) == {"a": 1}

    def test_plain_fence(self):
        raw = "```\n{\"a\": 2}\n```"
        assert _extract_json(raw) == {"a": 2}

    def test_prose_before(self):
        raw = "Here is the analysis:\n{\"simplified_text\": \"hello\"}"
        data = _extract_json(raw)
        assert data["simplified_text"] == "hello"

    def test_prose_after(self):
        raw = '{"x": 99}\nSome trailing text.'
        data = _extract_json(raw)
        assert data["x"] == 99

    def test_trailing_comma(self):
        raw = '{"key": "val",}'
        data = _extract_json(raw)
        assert data["key"] == "val"

    def test_bom_prefix(self):
        raw = '\ufeff{"bom": true}'
        data = _extract_json(raw)
        assert data["bom"] is True

    def test_invalid_raises(self):
        with pytest.raises(Exception):
            _extract_json("not json at all !!!!")

    def test_nested_object(self):
        raw = '{"red_flag": {"title": "T", "severity": 3}}'
        data = _extract_json(raw)
        assert data["red_flag"]["severity"] == 3
