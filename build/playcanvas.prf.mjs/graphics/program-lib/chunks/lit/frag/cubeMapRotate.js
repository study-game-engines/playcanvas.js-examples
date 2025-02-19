/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
var cubeMapRotatePS = `
#ifdef CUBEMAP_ROTATION
uniform mat3 cubeMapRotationMatrix;
#endif

vec3 cubeMapRotate(vec3 refDir) {
#ifdef CUBEMAP_ROTATION
    return refDir * cubeMapRotationMatrix;
#else
    return refDir;
#endif
}
`;

export { cubeMapRotatePS as default };
