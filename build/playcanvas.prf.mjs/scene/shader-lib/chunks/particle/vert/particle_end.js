/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
var particle_endVS = `
		localPos *= scale * emitterScale;
		localPos += particlePos;

		#ifdef SCREEN_SPACE
		gl_Position = vec4(localPos.x, localPos.y, 0.0, 1.0);
		#else
		gl_Position = matrix_viewProjection * vec4(localPos.xyz, 1.0);
		#endif
`;

export { particle_endVS as default };
