// map/controls/map-control-factory.ts
import { ToggleControl } from "./toggle-control";

export function createToggleControl(html: string, onClick: () => void) {
	return new ToggleControl(onClick, html);
}
