/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
var startNineSlicedTiledPS = `
		vec2 tileMask = step(vMask, vec2(0.99999));
		vec2 tileSize = 0.5 * (innerOffset.xy + innerOffset.zw);
		vec2 tileScale = vec2(1.0) / (vec2(1.0) - tileSize);
		vec2 clampedUv = mix(innerOffset.xy * 0.5, vec2(1.0) - innerOffset.zw * 0.5, fract((vTiledUv - tileSize) * tileScale));
		clampedUv = clampedUv * atlasRect.zw + atlasRect.xy;
		nineSlicedUv = vUv0 * tileMask + clampedUv * (vec2(1.0) - tileMask);
		nineSlicedUv.y = 1.0 - nineSlicedUv.y;
		
`;

export { startNineSlicedTiledPS as default };
