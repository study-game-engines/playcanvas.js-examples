/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { SceneParser } from './parsers/scene.js';

class Template {
	constructor(app, data) {
		this._app = app;
		this._data = data;
		this._templateRoot = null;
	}
	instantiate() {
		if (!this._templateRoot) {
			this._parseTemplate();
		}
		return this._templateRoot.clone();
	}
	_parseTemplate() {
		const parser = new SceneParser(this._app, true);
		this._templateRoot = parser.parse(this._data);
	}
}

export { Template };
