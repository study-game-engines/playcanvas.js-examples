/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
var aoSpecOccSimplePS = `
uniform float material_occludeSpecularIntensity;

void occludeSpecular(float gloss, float ao, vec3 worldNormal, vec3 viewDir) {
		float specOcc = mix(1.0, ao, material_occludeSpecularIntensity);
		dSpecularLight *= specOcc;
		dReflection *= specOcc;

#ifdef LIT_SHEEN
		sSpecularLight *= specOcc;
		sReflection *= specOcc;
#endif
}
`;

export { aoSpecOccSimplePS as default };
