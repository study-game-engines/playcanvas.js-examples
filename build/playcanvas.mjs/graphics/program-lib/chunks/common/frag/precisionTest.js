var precisionTestPS = `
void main(void) {
    gl_FragColor = vec4(2147483648.0);
}
`;

export { precisionTestPS as default };
