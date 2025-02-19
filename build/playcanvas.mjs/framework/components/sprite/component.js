import '../../../core/tracing.js';
import { math } from '../../../core/math/math.js';
import { Color } from '../../../core/math/color.js';
import { Vec2 } from '../../../core/math/vec2.js';
import { Vec4 } from '../../../core/math/vec4.js';
import { LAYERID_WORLD, SPRITE_RENDERMODE_TILED, SPRITE_RENDERMODE_SLICED } from '../../../scene/constants.js';
import { BatchGroup } from '../../../scene/batching/batch-group.js';
import { GraphNode } from '../../../scene/graph-node.js';
import { MeshInstance } from '../../../scene/mesh-instance.js';
import { Model } from '../../../scene/model.js';
import { Component } from '../component.js';
import { SPRITETYPE_SIMPLE, SPRITETYPE_ANIMATED } from './constants.js';
import { SpriteAnimationClip } from './sprite-animation-clip.js';

const PARAM_EMISSIVE_MAP = 'texture_emissiveMap';
const PARAM_OPACITY_MAP = 'texture_opacityMap';
const PARAM_EMISSIVE = 'material_emissive';
const PARAM_OPACITY = 'material_opacity';
const PARAM_INNER_OFFSET = 'innerOffset';
const PARAM_OUTER_SCALE = 'outerScale';
const PARAM_ATLAS_RECT = 'atlasRect';
class SpriteComponent extends Component {
	constructor(system, entity) {
		super(system, entity);
		this._type = SPRITETYPE_SIMPLE;
		this._material = system.defaultMaterial;
		this._color = new Color(1, 1, 1, 1);
		this._colorUniform = new Float32Array(3);
		this._speed = 1;
		this._flipX = false;
		this._flipY = false;
		this._width = 1;
		this._height = 1;
		this._drawOrder = 0;
		this._layers = [LAYERID_WORLD];
		this._outerScale = new Vec2(1, 1);
		this._outerScaleUniform = new Float32Array(2);
		this._innerOffset = new Vec4();
		this._innerOffsetUniform = new Float32Array(4);
		this._atlasRect = new Vec4();
		this._atlasRectUniform = new Float32Array(4);
		this._batchGroupId = -1;
		this._batchGroup = null;
		this._node = new GraphNode();
		this._model = new Model();
		this._model.graph = this._node;
		this._meshInstance = null;
		entity.addChild(this._model.graph);
		this._model._entity = entity;
		this._updateAabbFunc = this._updateAabb.bind(this);
		this._addedModel = false;
		this._autoPlayClip = null;
		this._clips = {};
		this._defaultClip = new SpriteAnimationClip(this, {
			name: this.entity.name,
			fps: 0,
			loop: false,
			spriteAsset: null
		});
		this._currentClip = this._defaultClip;
	}
	set type(value) {
		if (this._type === value) return;
		this._type = value;
		if (this._type === SPRITETYPE_SIMPLE) {
			this.stop();
			this._currentClip = this._defaultClip;
			if (this.enabled && this.entity.enabled) {
				this._currentClip.frame = this.frame;
				if (this._currentClip.sprite) {
					this._showModel();
				} else {
					this._hideModel();
				}
			}
		} else if (this._type === SPRITETYPE_ANIMATED) {
			this.stop();
			if (this._autoPlayClip) {
				this._tryAutoPlay();
			}
			if (this._currentClip && this._currentClip.isPlaying && this.enabled && this.entity.enabled) {
				this._showModel();
			} else {
				this._hideModel();
			}
		}
	}
	get type() {
		return this._type;
	}
	set frame(value) {
		this._currentClip.frame = value;
	}
	get frame() {
		return this._currentClip.frame;
	}
	set spriteAsset(value) {
		this._defaultClip.spriteAsset = value;
	}
	get spriteAsset() {
		return this._defaultClip._spriteAsset;
	}
	set sprite(value) {
		this._currentClip.sprite = value;
	}
	get sprite() {
		return this._currentClip.sprite;
	}
	set material(value) {
		this._material = value;
		if (this._meshInstance) {
			this._meshInstance.material = value;
		}
	}
	get material() {
		return this._material;
	}
	set color(value) {
		this._color.r = value.r;
		this._color.g = value.g;
		this._color.b = value.b;
		if (this._meshInstance) {
			this._colorUniform[0] = this._color.r;
			this._colorUniform[1] = this._color.g;
			this._colorUniform[2] = this._color.b;
			this._meshInstance.setParameter(PARAM_EMISSIVE, this._colorUniform);
		}
	}
	get color() {
		return this._color;
	}
	set opacity(value) {
		this._color.a = value;
		if (this._meshInstance) {
			this._meshInstance.setParameter(PARAM_OPACITY, value);
		}
	}
	get opacity() {
		return this._color.a;
	}
	set clips(value) {
		if (!value) {
			for (const name in this._clips) {
				this.removeClip(name);
			}
			return;
		}
		for (const name in this._clips) {
			let found = false;
			for (const key in value) {
				if (value[key].name === name) {
					found = true;
					this._clips[name].fps = value[key].fps;
					this._clips[name].loop = value[key].loop;
					if (value[key].hasOwnProperty('sprite')) {
						this._clips[name].sprite = value[key].sprite;
					} else if (value[key].hasOwnProperty('spriteAsset')) {
						this._clips[name].spriteAsset = value[key].spriteAsset;
					}
					break;
				}
			}
			if (!found) {
				this.removeClip(name);
			}
		}
		for (const key in value) {
			if (this._clips[value[key].name]) continue;
			this.addClip(value[key]);
		}
		if (this._autoPlayClip) {
			this._tryAutoPlay();
		}
		if (!this._currentClip || !this._currentClip.sprite) {
			this._hideModel();
		}
	}
	get clips() {
		return this._clips;
	}
	get currentClip() {
		return this._currentClip;
	}
	set speed(value) {
		this._speed = value;
	}
	get speed() {
		return this._speed;
	}
	set flipX(value) {
		if (this._flipX === value) return;
		this._flipX = value;
		this._updateTransform();
	}
	get flipX() {
		return this._flipX;
	}
	set flipY(value) {
		if (this._flipY === value) return;
		this._flipY = value;
		this._updateTransform();
	}
	get flipY() {
		return this._flipY;
	}
	set width(value) {
		if (value === this._width) return;
		this._width = value;
		this._outerScale.x = this._width;
		if (this.sprite && (this.sprite.renderMode === SPRITE_RENDERMODE_TILED || this.sprite.renderMode === SPRITE_RENDERMODE_SLICED)) {
			this._updateTransform();
		}
	}
	get width() {
		return this._width;
	}
	set height(value) {
		if (value === this._height) return;
		this._height = value;
		this._outerScale.y = this.height;
		if (this.sprite && (this.sprite.renderMode === SPRITE_RENDERMODE_TILED || this.sprite.renderMode === SPRITE_RENDERMODE_SLICED)) {
			this._updateTransform();
		}
	}
	get height() {
		return this._height;
	}
	set batchGroupId(value) {
		if (this._batchGroupId === value) return;
		const prev = this._batchGroupId;
		this._batchGroupId = value;
		if (this.entity.enabled && prev >= 0) {
			var _this$system$app$batc;
			(_this$system$app$batc = this.system.app.batcher) == null ? void 0 : _this$system$app$batc.remove(BatchGroup.SPRITE, prev, this.entity);
		}
		if (this.entity.enabled && value >= 0) {
			var _this$system$app$batc2;
			(_this$system$app$batc2 = this.system.app.batcher) == null ? void 0 : _this$system$app$batc2.insert(BatchGroup.SPRITE, value, this.entity);
		} else {
			if (prev >= 0) {
				if (this._currentClip && this._currentClip.sprite && this.enabled && this.entity.enabled) {
					this._showModel();
				}
			}
		}
	}
	get batchGroupId() {
		return this._batchGroupId;
	}
	set autoPlayClip(value) {
		this._autoPlayClip = value instanceof SpriteAnimationClip ? value.name : value;
		this._tryAutoPlay();
	}
	get autoPlayClip() {
		return this._autoPlayClip;
	}
	set drawOrder(value) {
		this._drawOrder = value;
		if (this._meshInstance) {
			this._meshInstance.drawOrder = value;
		}
	}
	get drawOrder() {
		return this._drawOrder;
	}
	set layers(value) {
		if (this._addedModel) {
			this._hideModel();
		}
		this._layers = value;
		if (!this._meshInstance) {
			return;
		}
		if (this.enabled && this.entity.enabled) {
			this._showModel();
		}
	}
	get layers() {
		return this._layers;
	}
	get aabb() {
		if (this._meshInstance) {
			return this._meshInstance.aabb;
		}
		return null;
	}
	onEnable() {
		const app = this.system.app;
		const scene = app.scene;
		scene.on('set:layers', this._onLayersChanged, this);
		if (scene.layers) {
			scene.layers.on('add', this._onLayerAdded, this);
			scene.layers.on('remove', this._onLayerRemoved, this);
		}
		this._showModel();
		if (this._autoPlayClip) this._tryAutoPlay();
		if (this._batchGroupId >= 0) {
			var _app$batcher;
			(_app$batcher = app.batcher) == null ? void 0 : _app$batcher.insert(BatchGroup.SPRITE, this._batchGroupId, this.entity);
		}
	}
	onDisable() {
		const app = this.system.app;
		const scene = app.scene;
		scene.off('set:layers', this._onLayersChanged, this);
		if (scene.layers) {
			scene.layers.off('add', this._onLayerAdded, this);
			scene.layers.off('remove', this._onLayerRemoved, this);
		}
		this.stop();
		this._hideModel();
		if (this._batchGroupId >= 0) {
			var _app$batcher2;
			(_app$batcher2 = app.batcher) == null ? void 0 : _app$batcher2.remove(BatchGroup.SPRITE, this._batchGroupId, this.entity);
		}
	}
	onDestroy() {
		this._currentClip = null;
		if (this._defaultClip) {
			this._defaultClip._destroy();
			this._defaultClip = null;
		}
		for (const key in this._clips) {
			this._clips[key]._destroy();
		}
		this._clips = null;
		this._hideModel();
		this._model = null;
		if (this._node) {
			if (this._node.parent) this._node.parent.removeChild(this._node);
			this._node = null;
		}
		if (this._meshInstance) {
			this._meshInstance.material = null;
			this._meshInstance.mesh = null;
			this._meshInstance = null;
		}
	}
	_showModel() {
		if (this._addedModel) return;
		if (!this._meshInstance) return;
		const meshInstances = [this._meshInstance];
		for (let i = 0, len = this._layers.length; i < len; i++) {
			const layer = this.system.app.scene.layers.getLayerById(this._layers[i]);
			if (layer) {
				layer.addMeshInstances(meshInstances);
			}
		}
		this._addedModel = true;
	}
	_hideModel() {
		if (!this._addedModel || !this._meshInstance) return;
		const meshInstances = [this._meshInstance];
		for (let i = 0, len = this._layers.length; i < len; i++) {
			const layer = this.system.app.scene.layers.getLayerById(this._layers[i]);
			if (layer) {
				layer.removeMeshInstances(meshInstances);
			}
		}
		this._addedModel = false;
	}
	_showFrame(frame) {
		if (!this.sprite) return;
		const mesh = this.sprite.meshes[frame];
		if (!mesh) {
			if (this._meshInstance) {
				this._meshInstance.mesh = null;
				this._meshInstance.visible = false;
			}
			return;
		}
		let material;
		if (this.sprite.renderMode === SPRITE_RENDERMODE_SLICED) {
			material = this.system.default9SlicedMaterialSlicedMode;
		} else if (this.sprite.renderMode === SPRITE_RENDERMODE_TILED) {
			material = this.system.default9SlicedMaterialTiledMode;
		} else {
			material = this.system.defaultMaterial;
		}
		if (!this._meshInstance) {
			this._meshInstance = new MeshInstance(mesh, this._material, this._node);
			this._meshInstance.castShadow = false;
			this._meshInstance.receiveShadow = false;
			this._meshInstance.drawOrder = this._drawOrder;
			this._model.meshInstances.push(this._meshInstance);
			this._colorUniform[0] = this._color.r;
			this._colorUniform[1] = this._color.g;
			this._colorUniform[2] = this._color.b;
			this._meshInstance.setParameter(PARAM_EMISSIVE, this._colorUniform);
			this._meshInstance.setParameter(PARAM_OPACITY, this._color.a);
			if (this.enabled && this.entity.enabled) {
				this._showModel();
			}
		}
		if (this._meshInstance.material !== material) {
			this._meshInstance.material = material;
		}
		if (this._meshInstance.mesh !== mesh) {
			this._meshInstance.mesh = mesh;
			this._meshInstance.visible = true;
			this._meshInstance._aabbVer = -1;
		}
		if (this.sprite.atlas && this.sprite.atlas.texture) {
			this._meshInstance.setParameter(PARAM_EMISSIVE_MAP, this.sprite.atlas.texture);
			this._meshInstance.setParameter(PARAM_OPACITY_MAP, this.sprite.atlas.texture);
		} else {
			this._meshInstance.deleteParameter(PARAM_EMISSIVE_MAP);
			this._meshInstance.deleteParameter(PARAM_OPACITY_MAP);
		}
		if (this.sprite.atlas && (this.sprite.renderMode === SPRITE_RENDERMODE_SLICED || this.sprite.renderMode === SPRITE_RENDERMODE_TILED)) {
			this._meshInstance._updateAabbFunc = this._updateAabbFunc;
			const frameData = this.sprite.atlas.frames[this.sprite.frameKeys[frame]];
			if (frameData) {
				const borderWidthScale = 2 / frameData.rect.z;
				const borderHeightScale = 2 / frameData.rect.w;
				this._innerOffset.set(frameData.border.x * borderWidthScale, frameData.border.y * borderHeightScale, frameData.border.z * borderWidthScale, frameData.border.w * borderHeightScale);
				const tex = this.sprite.atlas.texture;
				this._atlasRect.set(frameData.rect.x / tex.width, frameData.rect.y / tex.height, frameData.rect.z / tex.width, frameData.rect.w / tex.height);
			} else {
				this._innerOffset.set(0, 0, 0, 0);
			}
			this._innerOffsetUniform[0] = this._innerOffset.x;
			this._innerOffsetUniform[1] = this._innerOffset.y;
			this._innerOffsetUniform[2] = this._innerOffset.z;
			this._innerOffsetUniform[3] = this._innerOffset.w;
			this._meshInstance.setParameter(PARAM_INNER_OFFSET, this._innerOffsetUniform);
			this._atlasRectUniform[0] = this._atlasRect.x;
			this._atlasRectUniform[1] = this._atlasRect.y;
			this._atlasRectUniform[2] = this._atlasRect.z;
			this._atlasRectUniform[3] = this._atlasRect.w;
			this._meshInstance.setParameter(PARAM_ATLAS_RECT, this._atlasRectUniform);
		} else {
			this._meshInstance._updateAabbFunc = null;
		}
		this._updateTransform();
	}
	_updateTransform() {
		let scaleX = this.flipX ? -1 : 1;
		let scaleY = this.flipY ? -1 : 1;
		let posX = 0;
		let posY = 0;
		if (this.sprite && (this.sprite.renderMode === SPRITE_RENDERMODE_SLICED || this.sprite.renderMode === SPRITE_RENDERMODE_TILED)) {
			let w = 1;
			let h = 1;
			if (this.sprite.atlas) {
				const frameData = this.sprite.atlas.frames[this.sprite.frameKeys[this.frame]];
				if (frameData) {
					w = frameData.rect.z;
					h = frameData.rect.w;
					posX = (0.5 - frameData.pivot.x) * this._width;
					posY = (0.5 - frameData.pivot.y) * this._height;
				}
			}
			const scaleMulX = w / this.sprite.pixelsPerUnit;
			const scaleMulY = h / this.sprite.pixelsPerUnit;
			this._outerScale.set(Math.max(this._width, this._innerOffset.x * scaleMulX), Math.max(this._height, this._innerOffset.y * scaleMulY));
			scaleX *= scaleMulX;
			scaleY *= scaleMulY;
			this._outerScale.x /= scaleMulX;
			this._outerScale.y /= scaleMulY;
			scaleX *= math.clamp(this._width / (this._innerOffset.x * scaleMulX), 0.0001, 1);
			scaleY *= math.clamp(this._height / (this._innerOffset.y * scaleMulY), 0.0001, 1);
			if (this._meshInstance) {
				this._outerScaleUniform[0] = this._outerScale.x;
				this._outerScaleUniform[1] = this._outerScale.y;
				this._meshInstance.setParameter(PARAM_OUTER_SCALE, this._outerScaleUniform);
			}
		}
		this._node.setLocalScale(scaleX, scaleY, 1);
		this._node.setLocalPosition(posX, posY, 0);
	}
	_updateAabb(aabb) {
		aabb.center.set(0, 0, 0);
		aabb.halfExtents.set(this._outerScale.x * 0.5, this._outerScale.y * 0.5, 0.001);
		aabb.setFromTransformedAabb(aabb, this._node.getWorldTransform());
		return aabb;
	}
	_tryAutoPlay() {
		if (!this._autoPlayClip) return;
		if (this.type !== SPRITETYPE_ANIMATED) return;
		const clip = this._clips[this._autoPlayClip];
		if (clip && !clip.isPlaying && (!this._currentClip || !this._currentClip.isPlaying)) {
			if (this.enabled && this.entity.enabled) {
				this.play(clip.name);
			}
		}
	}
	_onLayersChanged(oldComp, newComp) {
		oldComp.off('add', this.onLayerAdded, this);
		oldComp.off('remove', this.onLayerRemoved, this);
		newComp.on('add', this.onLayerAdded, this);
		newComp.on('remove', this.onLayerRemoved, this);
		if (this.enabled && this.entity.enabled) {
			this._showModel();
		}
	}
	_onLayerAdded(layer) {
		const index = this.layers.indexOf(layer.id);
		if (index < 0) return;
		if (this._addedModel && this.enabled && this.entity.enabled && this._meshInstance) {
			layer.addMeshInstances([this._meshInstance]);
		}
	}
	_onLayerRemoved(layer) {
		if (!this._meshInstance) return;
		const index = this.layers.indexOf(layer.id);
		if (index < 0) return;
		layer.removeMeshInstances([this._meshInstance]);
	}
	removeModelFromLayers() {
		for (let i = 0; i < this.layers.length; i++) {
			const layer = this.system.app.scene.layers.getLayerById(this.layers[i]);
			if (!layer) continue;
			layer.removeMeshInstances([this._meshInstance]);
		}
	}
	addClip(data) {
		const clip = new SpriteAnimationClip(this, {
			name: data.name,
			fps: data.fps,
			loop: data.loop,
			spriteAsset: data.spriteAsset
		});
		this._clips[data.name] = clip;
		if (clip.name && clip.name === this._autoPlayClip) this._tryAutoPlay();
		return clip;
	}
	removeClip(name) {
		delete this._clips[name];
	}
	clip(name) {
		return this._clips[name];
	}
	play(name) {
		const clip = this._clips[name];
		const current = this._currentClip;
		if (current && current !== clip) {
			current._playing = false;
		}
		this._currentClip = clip;
		if (this._currentClip) {
			this._currentClip = clip;
			this._currentClip.play();
		}
		return clip;
	}
	pause() {
		if (this._currentClip === this._defaultClip) return;
		if (this._currentClip.isPlaying) {
			this._currentClip.pause();
		}
	}
	resume() {
		if (this._currentClip === this._defaultClip) return;
		if (this._currentClip.isPaused) {
			this._currentClip.resume();
		}
	}
	stop() {
		if (this._currentClip === this._defaultClip) return;
		this._currentClip.stop();
	}
}

export { SpriteComponent };
