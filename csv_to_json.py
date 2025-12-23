from __future__ import annotations

from pathlib import Path
import csv
import json
from collections import defaultdict

CSV_DIR = Path("public/data/csv")
OUT_DIR = Path("public/data/json")

PRESENCE_VALUE = 1
MAX_GAP_MINUTES = 1  # <=1 Minute Abstand zählt noch als derselbe Event


def minute_key_to_int(hour: int, minute: int) -> int:
	return hour * 60 + minute


def main() -> None:
	OUT_DIR.mkdir(parents=True, exist_ok=True)

	for csv_file in CSV_DIR.glob("*.csv"):
		site: str | None = None
		year: int | None = None
		month: int | None = None

		# day -> list of minute indices (0..1439) where presence==1
		minutes_by_day: dict[str, list[int]] = defaultdict(list)

		with csv_file.open(encoding="utf-8", newline="") as f:
			reader = csv.DictReader(f)

			for row in reader:
				if site is None:
					site = row.get("site") or None
					year = int(row["year"])
					month = int(row["month"])

				try:
					presence = int(str(row["presence"]).strip())
				except Exception:
					continue

				if presence != PRESENCE_VALUE:
					continue

				y = int(row["year"])
				mo = int(row["month"])
				d = int(row["day"])
				h = int(row["hour"])
				mi = int(row["minute"])

				day_key = f"{y:04d}-{mo:02d}-{d:02d}"
				minutes_by_day[day_key].append(minute_key_to_int(h, mi))

		series: list[dict[str, object]] = []
		total_presence_minutes = 0
		total_call_events = 0

		for day_key in sorted(minutes_by_day.keys()):
			mins = sorted(set(minutes_by_day[day_key]))  # unique + sorted
			presence_minutes = len(mins)
			total_presence_minutes += presence_minutes

			# count events as contiguous/runs
			call_events = 0
			prev = None
			for m in mins:
				if prev is None or (m - prev) > MAX_GAP_MINUTES:
					call_events += 1
				prev = m

			total_call_events += call_events

			series.append(
				{
					"t": day_key,
					"presenceMinutes": presence_minutes,
					"callEvents": call_events,
				}
			)

		out = {
			"sourceCsv": csv_file.name,
			"site": site,
			"year": year,
			"month": month,
			"bucketMinutes": None,
			"metric": "calls_daily",
			"presenceValue": PRESENCE_VALUE,
			"maxGapMinutes": MAX_GAP_MINUTES,
			"totalPresenceMinutes": total_presence_minutes,
			"totalCallEvents": total_call_events,
			"series": series,
		}

		out_file = OUT_DIR / f"{csv_file.stem}.json"
		out_file.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
		print(f"✔ wrote {out_file}")


if __name__ == "__main__":
	main()
