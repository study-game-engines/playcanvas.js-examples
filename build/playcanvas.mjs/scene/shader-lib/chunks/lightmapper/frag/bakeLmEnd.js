var bakeLmEndPS = `
#ifdef LIGHTMAP_RGBM
		gl_FragColor.rgb = dDiffuseLight;
		gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(0.5));
		gl_FragColor.rgb /= 8.0;
		gl_FragColor.a = clamp( max( max( gl_FragColor.r, gl_FragColor.g ), max( gl_FragColor.b, 1.0 / 255.0 ) ), 0.0,1.0 );
		gl_FragColor.a = ceil(gl_FragColor.a * 255.0) / 255.0;
		gl_FragColor.rgb /= gl_FragColor.a;
#else
		gl_FragColor = vec4(dDiffuseLight, 1.0);
#endif
`;

export { bakeLmEndPS as default };
