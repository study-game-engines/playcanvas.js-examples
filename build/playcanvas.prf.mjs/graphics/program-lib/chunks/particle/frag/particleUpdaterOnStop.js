/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
var particleUpdaterOnStopPS = `
    visMode = outLife < 0.0? -1.0: visMode;
`;

export { particleUpdaterOnStopPS as default };
