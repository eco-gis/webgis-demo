// app/map/features/popup/waldkauz/audio-player.tsx
"use client";

import { AlertCircle, FileQuestion, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatTime } from "./types";

type AudioPlayerProps = {
	locationId: string | null;
	className?: string;
};

type AudioState = {
	isPlaying: boolean;
	currentTime: number;
	duration: number; // 0 wenn unbekannt
	audioError: boolean;
	hasMetadata: boolean;
};

function clamp(n: number, min: number, max: number): number {
	return Math.min(Math.max(n, min), max);
}

function useAudioPlayer(audioUrl: string | null) {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const [state, setState] = useState<AudioState>({
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		audioError: false,
		hasMetadata: false,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Es ist nötig, dass nur audioUrl hier rein soll>
	useEffect(() => {
		setState({
			isPlaying: false,
			currentTime: 0,
			duration: 0,
			audioError: false,
			hasMetadata: false,
		});
	}, [audioUrl]);

	const readTimesFromRef = useCallback(() => {
		const el = audioRef.current;
		if (!el) return;

		const dur = Number.isFinite(el.duration) ? el.duration : 0;
		const t = Number.isFinite(el.currentTime) ? el.currentTime : 0;

		setState((s) => ({
			...s,
			currentTime: t,
			duration: dur,
		}));
	}, []);

	const onPlay = useCallback(() => {
		setState((s) => ({ ...s, isPlaying: true }));
	}, []);

	const onPause = useCallback(() => {
		setState((s) => ({ ...s, isPlaying: false }));
	}, []);

	const onEnded = useCallback(() => {
		setState((s) => ({ ...s, isPlaying: false }));
	}, []);

	const onTimeUpdate = useCallback(() => {
		readTimesFromRef();
	}, [readTimesFromRef]);

	const onLoadedMetadata = useCallback(() => {
		setState((s) => ({ ...s, hasMetadata: true }));
		readTimesFromRef();
	}, [readTimesFromRef]);

	const onError = useCallback(() => {
		setState((s) => ({ ...s, audioError: true, isPlaying: false }));
	}, []);

	const togglePlay = useCallback(async () => {
		const el = audioRef.current;
		if (!el) return;

		setState((s) => {
			// wenn error -> nichts machen
			if (s.audioError) return s;
			return s;
		});

		// aktuelle state.audioError ist in closure evtl. alt -> direkt aus setState vermeiden:
		// wir prüfen nochmal am Elementzustand + versuchen play/pause, Fehler setzt audioError.
		try {
			if (el.paused) {
				await el.play();
			} else {
				el.pause();
			}
		} catch {
			// Autoplay/Decode/404 etc.
			setState((s) => ({ ...s, audioError: true, isPlaying: false }));
		}
	}, []);

	const seek = useCallback((nextRaw: number) => {
		const el = audioRef.current;
		if (!el) return;
		if (!Number.isFinite(nextRaw)) return;

		const dur = Number.isFinite(el.duration) ? el.duration : 0;
		const next = dur > 0 ? clamp(nextRaw, 0, dur) : Math.max(0, nextRaw);

		try {
			el.currentTime = next;
			setState((s) => ({ ...s, currentTime: next }));
		} catch {
			// ignore
		}
	}, []);

	const bindAudioProps = useMemo(() => {
		return {
			ref: audioRef,
			preload: "metadata" as const,
			onPlay,
			onPause,
			onEnded,
			onTimeUpdate,
			onLoadedMetadata,
			onError,
		};
	}, [onPlay, onPause, onEnded, onTimeUpdate, onLoadedMetadata, onError]);

	return { state, togglePlay, seek, bindAudioProps };
}

export function AudioPlayer({ locationId, className }: AudioPlayerProps) {
	const { audioUrl, captionUrl } = useMemo(() => {
		if (!locationId) return { audioUrl: null, captionUrl: null };
		const encodedId = encodeURIComponent(locationId);
		return {
			audioUrl: `/data/soundsample/${encodedId}.mp3`,
			captionUrl: `/data/soundsample/${encodedId}.vtt`,
		};
	}, [locationId]);

	const { state, togglePlay, seek, bindAudioProps } = useAudioPlayer(audioUrl);

	if (!audioUrl) {
		return (
			<div
				className={[
					"flex items-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/10 p-2.5 text-[11px] text-muted-foreground",
					className,
				]
					.filter(Boolean)
					.join(" ")}>
				<FileQuestion size={14} /> Keine Audiodatei verfügbar
			</div>
		);
	}

	const sliderMax = Math.max(state.duration, 0.001);
	const sliderValue = clamp(state.currentTime, 0, sliderMax);

	return (
		<div
			className={[
				"relative rounded-xl border border-border/70 bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
				className,
			]
				.filter(Boolean)
				.join(" ")}>
			<audio key={audioUrl} {...bindAudioProps}>
				<source src={audioUrl} type="audio/mpeg" />
				{captionUrl ? <track kind="captions" src={captionUrl} srcLang="de" label="Deutsch" /> : null}
			</audio>

			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={togglePlay}
					disabled={state.audioError}
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-30"
					aria-label={state.isPlaying ? "Pause" : "Play"}>
					{state.isPlaying ? (
						<Pause size={18} fill="currentColor" />
					) : (
						<Play size={18} fill="currentColor" className="ml-0.5" />
					)}
				</button>

				<div className="min-w-0 flex-1 space-y-1.5">
					<input
						type="range"
						min={0}
						max={sliderMax}
						step={0.1}
						value={sliderValue}
						aria-label="Wiedergabeposition"
						onChange={(e) => seek(Number(e.target.value))}
						disabled={state.audioError || !state.hasMetadata}
						className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary/40 accent-primary transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					/>

					<div className="flex justify-between font-mono text-[9px] tabular-nums text-muted-foreground">
						<span>{formatTime(state.currentTime)}</span>
						<span>{state.audioError ? "Fehler" : state.hasMetadata ? formatTime(state.duration) : "—:—"}</span>
					</div>
				</div>
			</div>

			{state.audioError && (
				<div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-[10px] text-destructive">
					<AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<div>Audiodatei konnte nicht geladen werden.</div>
				</div>
			)}
		</div>
	);
}
