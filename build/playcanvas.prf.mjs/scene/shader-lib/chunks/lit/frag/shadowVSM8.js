/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
var shadowVSM8PS = `
float calculateVSM8(vec3 moments, float Z, float vsmBias) {
		float VSMBias = vsmBias;//0.01 * 0.25;
		float depthScale = VSMBias * Z;
		float minVariance1 = depthScale * depthScale;
		return chebyshevUpperBound(moments.xy, Z, minVariance1, 0.1);
}

float decodeFloatRG(vec2 rg) {
		return rg.y*(1.0/255.0) + rg.x;
}

float VSM8(sampler2D tex, vec2 texCoords, float resolution, float Z, float vsmBias, float exponent) {
		vec4 c = texture2D(tex, texCoords);
		vec3 moments = vec3(decodeFloatRG(c.xy), decodeFloatRG(c.zw), 0.0);
		return calculateVSM8(moments, Z, vsmBias);
}

float getShadowVSM8(sampler2D shadowMap, vec3 shadowCoord, vec3 shadowParams, float exponent, vec3 lightDir) {
		return VSM8(shadowMap, shadowCoord.xy, shadowParams.x, shadowCoord.z, shadowParams.y, 0.0);
}

float getShadowSpotVSM8(sampler2D shadowMap, vec3 shadowCoord, vec4 shadowParams, float exponent, vec3 lightDir) {
		return VSM8(shadowMap, shadowCoord.xy, shadowParams.x, length(lightDir) * shadowParams.w + shadowParams.z, shadowParams.y, 0.0);
}
`;

export { shadowVSM8PS as default };
