/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
var storeEVSMPS = `
float exponent = VSM_EXPONENT;

depth = 2.0 * depth - 1.0;
depth =  exp(exponent * depth);
gl_FragColor = vec4(depth, depth*depth, 1.0, 1.0);
`;

export { storeEVSMPS as default };
