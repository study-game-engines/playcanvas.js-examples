/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
var specularityFactorPS = `

#ifdef MAPFLOAT
uniform float material_specularityFactor;
#endif

void getSpecularityFactor() {
		float specularityFactor = 1.0;

		#ifdef MAPFLOAT
		specularityFactor *= material_specularityFactor;
		#endif

		#ifdef MAPTEXTURE
		specularityFactor *= texture2DBias($SAMPLER, $UV, textureBias).$CH;
		#endif

		#ifdef MAPVERTEX
		specularityFactor *= saturate(vVertexColor.$VC);
		#endif

		dSpecularityFactor = specularityFactor;
}
`;

export { specularityFactorPS as default };
