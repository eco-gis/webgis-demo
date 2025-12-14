import type { LayerSpecification, SourceSpecification } from "maplibre-gl";

export type OverlayDefinition = {
  sources: Record<string, SourceSpecification>;
  layers: LayerSpecification[];
};
