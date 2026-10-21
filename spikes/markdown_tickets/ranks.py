"""Bounded, ASCII-sortable sparse ranks. Exhaustion requires explicit maintenance."""
from __future__ import annotations

import re

MAX_RANK = (1 << 128) - 1
_RANK = re.compile(r"[0-9a-f]{32}")


class RankExhausted(ValueError):
    pass


def rank_value(rank: str) -> int:
    if not isinstance(rank, str) or not _RANK.fullmatch(rank):
        raise ValueError("order must be 32 lowercase hexadecimal characters")
    value = int(rank, 16)
    if not 0 < value < MAX_RANK:
        raise ValueError("boundary ranks are reserved")
    return value


def between(lower: str | None = None, upper: str | None = None) -> str:
    left = 0 if lower is None else rank_value(lower)
    right = MAX_RANK if upper is None else rank_value(upper)
    if left >= right:
        raise ValueError("rank bounds must be strictly increasing")
    if right - left == 1:
        raise RankExhausted("no rank remains between these neighbours; rebalance required")
    return f"{(left + right) // 2:032x}"


def rebalance_plan(ordered_ids: list[str]) -> dict[str, str]:
    """Propose evenly spaced ranks, without claiming to write a multi-file transaction."""
    if len(set(ordered_ids)) != len(ordered_ids):
        raise ValueError("duplicate ticket IDs")
    stride = MAX_RANK // (len(ordered_ids) + 1)
    if stride < 2:
        raise RankExhausted("too many tickets for this rank format")
    return {uid: f"{stride * (index + 1):032x}" for index, uid in enumerate(ordered_ids)}
