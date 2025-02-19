/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
var parallaxPS = `
uniform float material_heightMapFactor;

void getParallax() {
		float parallaxScale = material_heightMapFactor;

		float height = texture2DBias($SAMPLER, $UV, textureBias).$CH;
		height = height * parallaxScale - parallaxScale*0.5;
		vec3 viewDirT = dViewDirW * dTBN;

		viewDirT.z += 0.42;
		dUvOffset = height * (viewDirT.xy / viewDirT.z);
}
`;

export { parallaxPS as default };
