var alphaTestPS = `
uniform float alpha_ref;

void alphaTest(float a) {
		if (a < alpha_ref) discard;
}
`;

export { alphaTestPS as default };
