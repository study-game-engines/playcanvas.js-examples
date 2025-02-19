/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
var basePS = `
uniform vec3 view_position;

uniform vec3 light_globalAmbient;

float square(float x) {
		return x*x;
}

float saturate(float x) {
		return clamp(x, 0.0, 1.0);
}

vec3 saturate(vec3 x) {
		return clamp(x, vec3(0.0), vec3(1.0));
}
`;

export { basePS as default };
