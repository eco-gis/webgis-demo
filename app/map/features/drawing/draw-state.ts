// map/drawing/draw-state.ts

export type DrawState = {
	isDrawing: boolean;
	coords: [number, number][];
};

export const createDrawState = (): DrawState => ({
	isDrawing: false,
	coords: [],
});
