var tonemappingLinearPS = `
uniform float exposure;

vec3 toneMap(vec3 color) {
		return color * exposure;
}
`;

export { tonemappingLinearPS as default };
