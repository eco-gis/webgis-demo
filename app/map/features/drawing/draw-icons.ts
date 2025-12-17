"use client";

import type maplibregl from "maplibre-gl";

export async function ensureArrowIcon(map: maplibregl.Map): Promise<void> {
	if (map.hasImage("arrow-icon")) return;

	const size = 32;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");

	if (ctx) {
		ctx.strokeStyle = "#16a34a"; // Passend zu deiner draw-lines Farbe
		ctx.lineWidth = 4;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		// Zeichne einen nach rechts gerichteten Pfeilkopf
		ctx.beginPath();
		ctx.moveTo(10, 10);
		ctx.lineTo(24, 16);
		ctx.lineTo(10, 22);
		ctx.stroke();

		const imageData = ctx.getImageData(0, 0, size, size);
		map.addImage("arrow-icon", imageData);
	}
}