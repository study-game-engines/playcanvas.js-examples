var aoSpecOccPS = `
uniform float material_occludeSpecularIntensity;

void occludeSpecular() {
    // approximated specular occlusion from AO
    float specPow = exp2(dGlossiness * 11.0);
    // http://research.tri-ace.com/Data/cedec2011_RealtimePBR_Implementation_e.pptx
    float specOcc = saturate(pow(dot(dNormalW, dViewDirW) + dAo, 0.01*specPow) - 1.0 + dAo);
    specOcc = mix(1.0, specOcc, material_occludeSpecularIntensity);

    dSpecularLight *= specOcc;
    dReflection *= specOcc;
}
`;

export { aoSpecOccPS as default };
