// app/map/overlays/overlay-definition.ts
import type { LayerSpecification, SourceSpecification } from "maplibre-gl";

export type OverlayDefinition = {
	sources: Record<string, SourceSpecification>;
	layers: LayerSpecification[];
};

export type OverlayRegistry = Record<string, OverlayDefinition>;
