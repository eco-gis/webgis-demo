// map/controls/draw-control.ts
import type maplibregl from "maplibre-gl";

export class DrawControl {
	private _container?: HTMLElement;

	constructor(
		private onToggle: () => void,
		private active: () => boolean,
	) {}

	onAdd(map: maplibregl.Map) {
		this._map = map;
		this._container = document.createElement("div");
		this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";

		this.render();

		this._container.onclick = this.onToggle;

		return this._container;
	}

	private render() {
		if (!this._container) return;
		this._container.innerHTML = `
      <button class="eco-ctrl-btn ${this.active() ? "eco-btn-active" : ""}">✏️</button>
    `;
	}

	onRemove() {
		this._container?.remove();
		this._map = undefined;
	}
}
