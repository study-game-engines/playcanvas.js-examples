/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Component } from '../component.js';
import { ComponentSystem } from '../system.js';
import { JointComponent } from './component.js';
import { JointComponentData } from './data.js';

const _schema = ['enabled'];
class JointComponentSystem extends ComponentSystem {
	constructor(app) {
		super(app);
		this.id = 'joint';
		this.app = app;
		this.ComponentType = JointComponent;
		this.DataType = JointComponentData;
		this.schema = _schema;
	}
	initializeComponentData(component, data, properties) {
		component.initFromData(data);
	}
}
Component._buildAccessors(JointComponent.prototype, _schema);

export { JointComponentSystem };
