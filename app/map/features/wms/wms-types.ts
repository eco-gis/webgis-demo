// app/map/features/wms/wms-types.ts


export type WmsConfig = {
  id: string;
  name: string;
  url: string;
  layers: string; // kommasepariert
  styles?: string;
  format?: "image/png" | "image/jpeg";
  transparent?: boolean;
  version?: "1.1.1" | "1.3.0";
  tileSize?: 256 | 512;
  opacity?: number; // 0..1
  zIndex?: number; // optional für Insert-Position
};

export type WmsUrlId = `wms:${string}`;
export type WmsImageFormat = "image/png" | "image/jpeg";
export type WmsUrlConfig = {
	id: WmsUrlId;
	title: string;
	baseUrl: string;
	layers: string;

	format: WmsImageFormat;
	transparent: boolean;
	opacity?: number;
};
