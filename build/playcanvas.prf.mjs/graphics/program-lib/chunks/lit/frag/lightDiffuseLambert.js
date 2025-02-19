/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
var lightDiffuseLambertPS = `
float getLightDiffuse() {
    return max(dot(dNormalW, -dLightDirNormW), 0.0);
}
`;

export { lightDiffuseLambertPS as default };
