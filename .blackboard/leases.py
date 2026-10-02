"""Claim leases: when does a claim stop protecting its task?  Pure functions, no database access."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable, Mapping

import locate

_NOW: Callable[[], datetime] | None = None  # tests install a fake clock here


def now() -> datetime:
    return _NOW() if _NOW else datetime.now(timezone.utc)


def parse_time(value: str) -> datetime | None:
    """A timezone-aware time, or None when the text is not a timestamp (one bad row must not stop the others)."""
    try:
        parsed = datetime.fromisoformat(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def claim_status(row: Mapping[str, Any], at: datetime, live: set[str] | None) -> tuple[str, str]:
    """Judge a claimed task: ("held", ""), ("expired", why) or ("orphaned", why).

    A claim lapses when the worktree it was made from no longer exists (orphaned), or when
    nothing has been reported for stale_after_seconds since the claim or the last progress
    note (expired).  `live` is the set of existing worktrees, or None when git cannot say;
    then only the clock counts, and a claim is never called orphaned on a guess.
    """
    keys = row.keys()
    worktree = row["claim_worktree"] if "claim_worktree" in keys else None
    if live is not None and worktree and locate.norm(worktree) not in live:
        return "orphaned", f"its worktree {worktree} no longer exists"
    stamps = [parse_time(row[key]) for key in ("claimed_at", "last_reported_at") if key in keys and row[key]]
    if not stamps or None in stamps:
        return "expired", "the claim's timestamp is missing or unreadable"
    idle = int((at - max(stamps)).total_seconds())
    limit = int(row["stale_after_seconds"])
    if idle > limit:
        return "expired", f"no report for {idle}s, limit {limit}s"
    return "held", ""
