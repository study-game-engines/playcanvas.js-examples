/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
class ChunkBuilder {
	constructor() {
		this.code = '';
	}
	append(...chunks) {
		chunks.forEach(chunk => {
			if (chunk.endsWith('\n')) {
				this.code += chunk;
			} else {
				this.code += chunk + '\n';
			}
		});
	}
	prepend(...chunks) {
		chunks.forEach(chunk => {
			if (chunk.endsWith('\n')) {
				this.code = chunk + this.code;
			} else {
				this.code = chunk + '\n' + this.code;
			}
		});
	}
}

export { ChunkBuilder };
