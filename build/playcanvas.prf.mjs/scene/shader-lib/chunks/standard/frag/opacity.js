/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
var opacityPS = `
#ifdef MAPFLOAT
uniform float material_opacity;
#endif

void getOpacity() {
		dAlpha = 1.0;

		#ifdef MAPFLOAT
		dAlpha *= material_opacity;
		#endif

		#ifdef MAPTEXTURE
		dAlpha *= texture2DBias($SAMPLER, $UV, textureBias).$CH;
		#endif

		#ifdef MAPVERTEX
		dAlpha *= clamp(vVertexColor.$VC, 0.0, 1.0);
		#endif
}
`;

export { opacityPS as default };
