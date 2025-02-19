/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Component } from '../component.js';

class AudioListenerComponent extends Component {
	constructor(system, entity) {
		super(system, entity);
	}
	setCurrentListener() {
		if (this.enabled && this.entity.audiolistener && this.entity.enabled) {
			this.system.current = this.entity;
			const position = this.system.current.getPosition();
			this.system.manager.listener.setPosition(position);
		}
	}
	onEnable() {
		this.setCurrentListener();
	}
	onDisable() {
		if (this.system.current === this.entity) {
			this.system.current = null;
		}
	}
}

export { AudioListenerComponent };
