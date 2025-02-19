/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
var lightSpecularPhongPS = `
float calcLightSpecular(float gloss, vec3 reflDir, vec3 lightDirNorm) {
		float specPow = gloss;

		// Hack: On Mac OS X, calling pow with zero for the exponent generates hideous artifacts so bias up a little
		return pow(max(dot(reflDir, -lightDirNorm), 0.0), specPow + 0.0001);
}

float getLightSpecular(vec3 h, vec3 reflDir, vec3 worldNormal, vec3 viewDir, vec3 lightDirNorm, float gloss, mat3 tbn) {
		return calcLightSpecular(gloss, reflDir, lightDirNorm);
}
`;

export { lightSpecularPhongPS as default };
