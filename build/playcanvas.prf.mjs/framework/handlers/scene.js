/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { SceneUtils } from './scene-utils.js';
import { SceneParser } from '../parsers/scene.js';

class SceneHandler {
	constructor(app) {
		this.handlerType = "scene";
		this._app = app;
		this.maxRetries = 0;
	}
	load(url, callback) {
		SceneUtils.load(url, this.maxRetries, callback);
	}
	open(url, data) {
		this._app.systems.script.preloading = true;
		const parser = new SceneParser(this._app, false);
		const parent = parser.parse(data);
		const scene = this._app.scene;
		scene.root = parent;
		this._app.applySceneSettings(data.settings);
		this._app.systems.script.preloading = false;
		return scene;
	}
	patch(asset, assets) {}
}

export { SceneHandler };
