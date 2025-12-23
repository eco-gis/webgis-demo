// app/map/popups/waldkauz/presence-chart.tsx
"use client";

import { eachDayOfInterval, endOfMonth, format, isValid, parseISO, startOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import type { LoadState, PresenceBucketJson } from "@/app/map/features/popup/waldkauz/types";

type MetricKey = "callEvents" | "presenceMinutes";
type Variant = "default" | "compact";

type PresencePoint = {
	t: string; // yyyy-MM-dd
	callEvents: number;
	presenceMinutes: number;
};

type ChartPoint = {
	t: string; // yyyy-MM-dd
	value: number;
};

const presenceCache = new Map<string, PresenceBucketJson>();

async function fetchPresence(fileBase: string): Promise<PresenceBucketJson> {
	const cached = presenceCache.get(fileBase);
	if (cached) return cached;

	const res = await fetch(`/data/json/${encodeURIComponent(fileBase)}.json`, { cache: "force-cache" });
	if (!res.ok) throw new Error(`Daten nicht verfügbar (${res.status})`);

	const data: PresenceBucketJson = await res.json();
	presenceCache.set(fileBase, data);
	return data;
}

function toIsoDayKey(input: unknown): string | null {
	if (typeof input === "string") {
		// akzeptiere yyyy-MM-dd direkt
		if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

		const d = parseISO(input);
		if (isValid(d)) return format(d, "yyyy-MM-dd");
		return null;
	}

	if (input instanceof Date) {
		if (!isValid(input)) return null;
		return format(input, "yyyy-MM-dd");
	}

	return null;
}

function normalizeSeries(rawSeries: PresenceBucketJson["series"]): PresencePoint[] {
	return rawSeries
		.map((p) => {
			const obj = p as { t?: unknown; callEvents?: unknown; presenceMinutes?: unknown };

			const key = toIsoDayKey(obj.t);
			if (!key) return null;

			const callEvents = Number(obj.callEvents);
			const presenceMinutes = Number(obj.presenceMinutes);

			return {
				t: key,
				callEvents: Number.isFinite(callEvents) ? callEvents : 0,
				presenceMinutes: Number.isFinite(presenceMinutes) ? presenceMinutes : 0,
			};
		})
		.filter((v): v is PresencePoint => v !== null);
}

function prepareMonthSeries(data: PresenceBucketJson, metric: MetricKey): ChartPoint[] {
	const { year, month } = data;

	const raw = normalizeSeries(data.series);

	const valueMap = new Map<string, number>();
	for (const p of raw) valueMap.set(p.t, p[metric]);

	// falls keine bucket-info vorhanden: einfach raw als chart points
	if (!year || !month) return raw.map((p) => ({ t: p.t, value: p[metric] }));

	const startDate = startOfMonth(new Date(year, month - 1));
	const endDate = endOfMonth(startDate);

	return eachDayOfInterval({ start: startDate, end: endDate }).map((date) => {
		const key = format(date, "yyyy-MM-dd");
		return { t: key, value: valueMap.get(key) ?? 0 };
	});
}

function usePresence(fileBase: string | null): LoadState<PresenceBucketJson> {
	const [state, setState] = useState<LoadState<PresenceBucketJson>>({ kind: "idle" });

	useEffect(() => {
		if (!fileBase) {
			setState({ kind: "idle" });
			return;
		}

		let active = true;
		setState({ kind: "loading" });

		fetchPresence(fileBase)
			.then((data) => {
				if (active) setState({ kind: "ready", data });
			})
			.catch((e: unknown) => {
				const message = e instanceof Error ? e.message : "Unbekannter Fehler";
				if (active) setState({ kind: "error", message });
			});

		return () => {
			active = false;
		};
	}, [fileBase]);

	return state;
}

type TooltipPayloadPoint = {
	value?: number;
	payload?: { t?: string };
};

function TooltipContent(props: { active?: boolean; payload?: TooltipPayloadPoint[] }) {
	const { active, payload } = props;
	if (!active || !payload?.length) return null;

	const t = payload[0]?.payload?.t;
	if (!t) return null;

	const date = parseISO(t);
	if (!isValid(date)) return null;

	const v = payload[0]?.value;
	const detections = typeof v === "number" && Number.isFinite(v) ? v : 0;

	return (
		<div className="rounded-lg border bg-popover p-2 text-[11px] shadow-md">
			<p className="mb-1 font-medium text-muted-foreground">{format(date, "EEEE, dd. MMM", { locale: de })}</p>
			<p className="font-bold text-primary">{detections} Detektionen</p>
		</div>
	);
}

export function PresenceChart({ fileBase, variant = "default" }: { fileBase: string; variant?: Variant }) {
	const state = usePresence(fileBase);
	const uid = useId();
	const gradientId = `presenceGradient-${uid}`;

	// Du willst: Detektionen pro Tag (nicht Dauer)
	const metric: MetricKey = "callEvents";

	const chartData = useMemo(() => {
		if (state.kind !== "ready") return [];
		return prepareMonthSeries(state.data, metric);
	}, [state]);

	const totalCallEvents = useMemo(() => {
		if (state.kind !== "ready") return 0;
		const normalized = normalizeSeries(state.data.series);
		return normalized.reduce((sum, point) => sum + point.callEvents, 0);
	}, [state]);

	const isCompact = variant === "compact";
	const chartHeightClass = isCompact ? "h-40" : "h-56";
	const skeletonHeightClass = isCompact ? "h-36" : "h-48";

	if (state.kind === "loading" || state.kind === "idle") {
		return (
			<div className={isCompact ? "space-y-2" : "space-y-4"}>
				<Skeleton className="h-3 w-32" />
				<Skeleton className={`${skeletonHeightClass} w-full rounded-xl`} />
			</div>
		);
	}

	if (state.kind === "error") {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
				<AlertCircle className="mb-2 h-5 w-5 text-destructive" />
				<p className="text-xs font-medium text-destructive-foreground">{state.message}</p>
			</div>
		);
	}

	return (
		<div className={isCompact ? "space-y-2" : "group space-y-3 animate-in fade-in duration-500"}>
			<div className="flex items-end justify-between px-1">
				<div>
					<div className={isCompact ? "text-base font-bold tabular-nums" : "text-lg font-bold tabular-nums"}>
						{totalCallEvents} <span className="text-sm font-medium text-muted-foreground">Detektionen insgesamt</span>
					</div>
					<h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
						Detektionen pro Tag
					</h4>
				</div>
			</div>

			<Card
				className={[
					"relative w-full overflow-hidden border-none bg-linear-to-b from-muted/30 to-transparent p-0 shadow-none",
					chartHeightClass,
				].join(" ")}>
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={chartData} margin={{ top: 10, right: 10, left: isCompact ? -18 : -25, bottom: 0 }}>
						<defs>
							<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
								<stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
							</linearGradient>
						</defs>

						<CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />

						<XAxis
							dataKey="t"
							tickFormatter={(val: string) => {
								const d = parseISO(val);
								return isValid(d) ? format(d, "dd.") : "";
							}}
							fontSize={10}
							tickLine={false}
							axisLine={false}
							minTickGap={isCompact ? 28 : 20}
							stroke="var(--muted-foreground)"
						/>

						{isCompact ? null : (
							<YAxis
								fontSize={10}
								tickLine={false}
								axisLine={false}
								allowDecimals={false}
								stroke="var(--muted-foreground)"
							/>
						)}

						<Tooltip cursor={{ stroke: "var(--primary)", strokeWidth: 1 }} content={<TooltipContent />} />

						<Area
							type="monotone"
							dataKey="value"
							stroke="var(--primary)"
							strokeWidth={2}
							fillOpacity={1}
							fill={`url(#${gradientId})`}
							isAnimationActive={!isCompact}
							animationDuration={800}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</Card>
		</div>
	);
}
export function usePresenceFiles(locationId: string | null) {
	return useMemo(() => {
		if (!locationId) return null;
		return {
			sep: `${locationId}_sept24`,
			feb: `${locationId}_feb25`,
		};
	}, [locationId]);
}
