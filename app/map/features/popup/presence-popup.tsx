"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { loadPresenceBucketJson, type PresenceBucketJson } from "@/app/lib/waldkauz/presence-json";

type MonthTabKey = "feb" | "sep";

export type PresencePopupFiles = {
	feb: string;
	sep: string;
};

type PresencePopupProps = {
	title: string; // z.B. "Guetli"
	files: PresencePopupFiles; // Tab->File
	defaultTab?: MonthTabKey; // default: "feb"
	heightPx?: number; // default: 220
};

type LoadState =
	| { kind: "idle" }
	| { kind: "loading" }
	| { kind: "error"; message: string }
	| { kind: "ready"; data: PresenceBucketJson };

function usePresenceData(fileBase: string): LoadState {
	const [state, setState] = React.useState<LoadState>({ kind: "idle" });

	React.useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				setState({ kind: "loading" });
				const data = await loadPresenceBucketJson(fileBase);
				if (!cancelled) setState({ kind: "ready", data });
			} catch (e) {
				const msg = e instanceof Error ? e.message : "Unknown error";
				if (!cancelled) setState({ kind: "error", message: msg });
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [fileBase]);

	return state;
}

function formatTick(t: string): string {
	// "YYYY-MM-DDTHH:MM" -> "HH:MM"
	const idx = t.indexOf("T");
	return idx >= 0 ? t.slice(idx + 1) : t;
}

function TabChart({ fileBase, heightPx }: { fileBase: string; heightPx: number }) {
	const state = usePresenceData(fileBase);

	if (state.kind === "loading" || state.kind === "idle") {
		return (
			<div className="space-y-3">
				<Skeleton className="h-5 w-40" />
				<Skeleton className="h-45 w-full" />
			</div>
		);
	}

	if (state.kind === "error") {
		return (
			<div className="rounded-md border p-3 text-sm">
				<div className="font-medium">Fehler beim Laden</div>
				<div className="mt-1 text-muted-foreground">{state.message}</div>
				<div className="mt-2 text-muted-foreground">
					Erwartet: <code className="text-xs">/data/json/{fileBase}.json</code>
				</div>
			</div>
		);
	}

	const { data } = state;
	const series = data.series;

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<div className="text-sm font-medium">
					Bucket: {data.bucketMinutes} min · Total: {data.totalPresenceMinutes}
				</div>
				<div className="text-xs text-muted-foreground">Wert = Minuten mit presence=1 pro Bucket</div>
			</div>

			<Card className="p-2">
				<div style={{ height: heightPx }} className="min-w-0">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={series}>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="t" tickFormatter={formatTick} minTickGap={24} height={24} />
							<YAxis allowDecimals={false} width={28} />
							<Tooltip labelFormatter={(label) => label} formatter={(value) => [value, "Minuten"]} />
							<Line type="monotone" dataKey="value" dot={false} strokeWidth={2} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</Card>
		</div>
	);
}

export function PresencePopup(props: PresencePopupProps) {
	const { title, files, defaultTab = "sep", heightPx = 220 } = props;

	return (
		<div className="w-90 max-w-[80vw] space-y-3">
			<div className="text-base font-semibold leading-tight">{title}</div>

			<Tabs defaultValue={defaultTab}>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="sep">September</TabsTrigger>
					<TabsTrigger value="feb">Februar</TabsTrigger>
				</TabsList>

				<TabsContent value="sep" className="mt-3">
					<TabChart fileBase={files.sep} heightPx={heightPx} />
				</TabsContent>

				<TabsContent value="feb" className="mt-3">
					<TabChart fileBase={files.feb} heightPx={heightPx} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
