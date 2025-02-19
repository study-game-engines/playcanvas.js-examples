/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
class Key {
	constructor(time, position, rotation, scale) {
		this.time = time;
		this.position = position;
		this.rotation = rotation;
		this.scale = scale;
	}
}
class Node {
	constructor() {
		this._name = '';
		this._keys = [];
	}
}
class Animation {
	constructor() {
		this.name = '';
		this.duration = 0;
		this._nodes = [];
		this._nodeDict = {};
	}
	getNode(name) {
		return this._nodeDict[name];
	}
	addNode(node) {
		this._nodes.push(node);
		this._nodeDict[node._name] = node;
	}
	get nodes() {
		return this._nodes;
	}
}

export { Animation, Key, Node };
