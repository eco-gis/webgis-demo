// map/controls/toggle-control.ts
import type maplibregl from "maplibre-gl";

export class ToggleControl {
	private _container?: HTMLElement;

	constructor(
		private onClick: () => void,
		private html: string,
	) {}

	onAdd(map: maplibregl.Map) {
		this._map = map;
		this._container = document.createElement("div");
		this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";

		this._container.innerHTML = `
      <button class="eco-ctrl-btn">${this.html}</button>
    `;

		this._container.onclick = this.onClick;

		return this._container;
	}

	onRemove() {
		this._container?.remove();
		this._map = undefined;
	}
}
