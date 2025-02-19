var fresnelSchlickPS = `
// Schlick's approximation
vec3 getFresnel(
				float cosTheta, 
				float gloss, 
				vec3 specularity
#if defined(LIT_IRIDESCENCE)
				, vec3 iridescenceFresnel, 
				IridescenceArgs iridescence
#endif
		) {
		float fresnel = pow(1.0 - max(cosTheta, 0.0), 5.0);
		float glossSq = gloss * gloss;
		vec3 ret = specularity + (max(vec3(glossSq), specularity) - specularity) * fresnel;
#if defined(LIT_IRIDESCENCE)
		return mix(ret, iridescenceFresnel, iridescence.intensity);
#else
		return ret;
#endif    
}

float getFresnelCC(float cosTheta) {
		float fresnel = pow(1.0 - max(cosTheta, 0.0), 5.0);
		return 0.04 + (1.0 - 0.04) * fresnel;
}
`;

export { fresnelSchlickPS as default };
