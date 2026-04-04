from __future__ import annotations

from datetime import datetime, time as dtime, timedelta
from zoneinfo import ZoneInfo

from app.config import settings
from app.models import Shift


def _day_index(dt: datetime) -> int:
    # Python: Monday=0 .. Sunday=6
    return dt.weekday()


def _mask_has_day(days_mask: int, day_index: int) -> bool:
    return bool(days_mask & (1 << day_index))


def is_now_within_shift(shift: Shift, *, now_utc: datetime | None = None) -> bool:
    tzname = shift.timezone or settings.timezone
    tz = ZoneInfo(tzname)
    now_local = (now_utc or datetime.utcnow()).replace(tzinfo=ZoneInfo("UTC")).astimezone(tz)
    t = now_local.timetz().replace(tzinfo=None)

    start: dtime = shift.start_time
    end: dtime = shift.end_time

    # Non-overnight
    if end > start:
        if not _mask_has_day(shift.days_mask, _day_index(now_local)):
            return False
        return start <= t < end

    # Overnight (e.g. 22:00 -> 06:00)
    if t >= start:
        # Active on the start day
        return _mask_has_day(shift.days_mask, _day_index(now_local))

    # t < end, so shift started "yesterday"
    prev_day = (now_local - timedelta(days=1))
    return _mask_has_day(shift.days_mask, _day_index(prev_day))


def is_user_in_any_active_shift(shifts: list[Shift], *, now_utc: datetime | None = None) -> bool:
    for shift in shifts:
        if not shift.is_active:
            continue
        if is_now_within_shift(shift, now_utc=now_utc):
            return True
    return False

