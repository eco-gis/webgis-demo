export type DrawMode = "select" | "point" | "line" | "polygon" | "arrow";
export type DrawKind = "point" | "line" | "polygon" | "arrow";

export type DrawProps = {
	id: string;
	kind: DrawKind;
	label?: string;
};

export type DrawGeometry = GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon;

export type DrawFeature = GeoJSON.Feature<DrawGeometry, DrawProps>;

export type DrawCollection = GeoJSON.FeatureCollection<DrawGeometry, DrawProps>;
