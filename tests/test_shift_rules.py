from __future__ import annotations

from datetime import datetime, time

from app.models import Shift
from app.shift_rules import is_now_within_shift


def test_non_overnight_shift_allows_login_within_window():
    now = datetime(2026, 1, 1, 12, 0, 0)  # treated as UTC by shift_rules
    today_mask = 1 << now.weekday()

    shift = Shift(
        user_id=1,
        name="day",
        start_time=time(10, 0),
        end_time=time(14, 0),
        days_mask=today_mask,
        timezone="UTC",
        is_active=True,
    )

    assert is_now_within_shift(shift, now_utc=now) is True


def test_non_overnight_shift_blocks_if_day_not_allowed():
    now = datetime(2026, 1, 1, 12, 0, 0)
    other_day_mask = 1 << ((now.weekday() + 1) % 7)

    shift = Shift(
        user_id=1,
        name="day",
        start_time=time(10, 0),
        end_time=time(14, 0),
        days_mask=other_day_mask,
        timezone="UTC",
        is_active=True,
    )

    assert is_now_within_shift(shift, now_utc=now) is False


def test_overnight_shift_allows_late_night_and_early_morning():
    late = datetime(2026, 1, 1, 23, 0, 0)
    start_day_mask = 1 << late.weekday()

    shift = Shift(
        user_id=1,
        name="night",
        start_time=time(22, 0),
        end_time=time(6, 0),
        days_mask=start_day_mask,
        timezone="UTC",
        is_active=True,
    )

    assert is_now_within_shift(shift, now_utc=late) is True

    early_next_day = datetime(2026, 1, 2, 5, 0, 0)
    assert is_now_within_shift(shift, now_utc=early_next_day) is True


def test_overnight_shift_blocks_early_morning_if_prev_day_not_allowed():
    early = datetime(2026, 1, 2, 5, 0, 0)
    current_day_mask = 1 << early.weekday()

    shift = Shift(
        user_id=1,
        name="night",
        start_time=time(22, 0),
        end_time=time(6, 0),
        days_mask=current_day_mask,
        timezone="UTC",
        is_active=True,
    )

    # Shift runs overnight, but mask includes only the "end day" not the start day.
    assert is_now_within_shift(shift, now_utc=early) is False

