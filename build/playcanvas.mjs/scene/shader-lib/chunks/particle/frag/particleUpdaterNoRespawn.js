var particleUpdaterNoRespawnPS = `
		if (outLife >= lifetime) {
				outLife -= max(lifetime, (numParticles - 1.0) * particleRate);
				visMode = -1.0;
		}
`;

export { particleUpdaterNoRespawnPS as default };
