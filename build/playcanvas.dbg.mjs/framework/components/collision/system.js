/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../../../core/debug.js';
import { Mat4 } from '../../../core/math/mat4.js';
import { Quat } from '../../../core/math/quat.js';
import { Vec3 } from '../../../core/math/vec3.js';
import { SEMANTIC_POSITION } from '../../../platform/graphics/constants.js';
import { GraphNode } from '../../../scene/graph-node.js';
import { Model } from '../../../scene/model.js';
import { Component } from '../component.js';
import { ComponentSystem } from '../system.js';
import { CollisionComponent } from './component.js';
import { CollisionComponentData } from './data.js';
import { Trigger } from './trigger.js';

const mat4 = new Mat4();
const vec3 = new Vec3();
const quat = new Quat();
const tempGraphNode = new GraphNode();
const _schema = ['enabled', 'type', 'halfExtents', 'linearOffset', 'angularOffset', 'radius', 'axis', 'height', 'asset', 'renderAsset', 'shape', 'model', 'render'];

// Collision system implementations
class CollisionSystemImpl {
  constructor(system) {
    this.system = system;
  }

  // Called before the call to system.super.initializeComponentData is made
  beforeInitialize(component, data) {
    data.shape = null;
    data.model = new Model();
    data.model.graph = new GraphNode();
  }

  // Called after the call to system.super.initializeComponentData is made
  afterInitialize(component, data) {
    this.recreatePhysicalShapes(component);
    component.data.initialized = true;
  }

  // Called when a collision component changes type in order to recreate debug and physical shapes
  reset(component, data) {
    this.beforeInitialize(component, data);
    this.afterInitialize(component, data);
  }

  // Re-creates rigid bodies / triggers
  recreatePhysicalShapes(component) {
    const entity = component.entity;
    const data = component.data;
    if (typeof Ammo !== 'undefined') {
      if (entity.trigger) {
        entity.trigger.destroy();
        delete entity.trigger;
      }
      if (data.shape) {
        if (component._compoundParent) {
          this.system._removeCompoundChild(component._compoundParent, data.shape);
          if (component._compoundParent.entity.rigidbody) component._compoundParent.entity.rigidbody.activate();
        }
        Ammo.destroy(data.shape);
        data.shape = null;
      }
      data.shape = this.createPhysicalShape(component.entity, data);
      const firstCompoundChild = !component._compoundParent;
      if (data.type === 'compound' && (!component._compoundParent || component === component._compoundParent)) {
        component._compoundParent = component;
        entity.forEach(this._addEachDescendant, component);
      } else if (data.type !== 'compound') {
        if (component._compoundParent && component === component._compoundParent) {
          entity.forEach(this.system.implementations.compound._updateEachDescendant, component);
        }
        if (!component.rigidbody) {
          component._compoundParent = null;
          let parent = entity.parent;
          while (parent) {
            if (parent.collision && parent.collision.type === 'compound') {
              component._compoundParent = parent.collision;
              break;
            }
            parent = parent.parent;
          }
        }
      }
      if (component._compoundParent) {
        if (component !== component._compoundParent) {
          if (firstCompoundChild && component._compoundParent.shape.getNumChildShapes() === 0) {
            this.system.recreatePhysicalShapes(component._compoundParent);
          } else {
            this.system.updateCompoundChildTransform(entity);
            if (component._compoundParent.entity.rigidbody) component._compoundParent.entity.rigidbody.activate();
          }
        }
      }
      if (entity.rigidbody) {
        entity.rigidbody.disableSimulation();
        entity.rigidbody.createBody();
        if (entity.enabled && entity.rigidbody.enabled) {
          entity.rigidbody.enableSimulation();
        }
      } else if (!component._compoundParent) {
        if (!entity.trigger) {
          entity.trigger = new Trigger(this.system.app, component, data);
        } else {
          entity.trigger.initialize(data);
        }
      }
    }
  }

  // Creates a physical shape for the collision. This consists
  // of the actual shape that will be used for the rigid bodies / triggers of
  // the collision.
  createPhysicalShape(entity, data) {
    return undefined;
  }
  updateTransform(component, position, rotation, scale) {
    if (component.entity.trigger) {
      component.entity.trigger.updateTransform();
    }
  }
  beforeRemove(entity, component) {
    if (component.data.shape) {
      if (component._compoundParent && !component._compoundParent.entity._destroying) {
        this.system._removeCompoundChild(component._compoundParent, component.data.shape);
        if (component._compoundParent.entity.rigidbody) component._compoundParent.entity.rigidbody.activate();
      }
      component._compoundParent = null;
      Ammo.destroy(component.data.shape);
      component.data.shape = null;
    }
  }

  // Called when the collision is removed
  remove(entity, data) {
    if (entity.rigidbody && entity.rigidbody.body) {
      entity.rigidbody.disableSimulation();
    }
    if (entity.trigger) {
      entity.trigger.destroy();
      delete entity.trigger;
    }
  }

  // Called when the collision is cloned to another entity
  clone(entity, clone) {
    const src = this.system.store[entity.getGuid()];
    const data = {
      enabled: src.data.enabled,
      type: src.data.type,
      halfExtents: [src.data.halfExtents.x, src.data.halfExtents.y, src.data.halfExtents.z],
      linearOffset: [src.data.linearOffset.x, src.data.linearOffset.y, src.data.linearOffset.z],
      angularOffset: [src.data.angularOffset.x, src.data.angularOffset.y, src.data.angularOffset.z, src.data.angularOffset.w],
      radius: src.data.radius,
      axis: src.data.axis,
      height: src.data.height,
      asset: src.data.asset,
      renderAsset: src.data.renderAsset,
      model: src.data.model,
      render: src.data.render
    };
    return this.system.addComponent(clone, data);
  }
}

// Box Collision System
class CollisionBoxSystemImpl extends CollisionSystemImpl {
  createPhysicalShape(entity, data) {
    if (typeof Ammo !== 'undefined') {
      const he = data.halfExtents;
      const ammoHe = new Ammo.btVector3(he ? he.x : 0.5, he ? he.y : 0.5, he ? he.z : 0.5);
      const shape = new Ammo.btBoxShape(ammoHe);
      Ammo.destroy(ammoHe);
      return shape;
    }
    return undefined;
  }
}

// Sphere Collision System
class CollisionSphereSystemImpl extends CollisionSystemImpl {
  createPhysicalShape(entity, data) {
    if (typeof Ammo !== 'undefined') {
      return new Ammo.btSphereShape(data.radius);
    }
    return undefined;
  }
}

// Capsule Collision System
class CollisionCapsuleSystemImpl extends CollisionSystemImpl {
  createPhysicalShape(entity, data) {
    const axis = data.axis !== undefined ? data.axis : 1;
    const radius = data.radius || 0.5;
    const height = Math.max((data.height || 2) - 2 * radius, 0);
    let shape = null;
    if (typeof Ammo !== 'undefined') {
      switch (axis) {
        case 0:
          shape = new Ammo.btCapsuleShapeX(radius, height);
          break;
        case 1:
          shape = new Ammo.btCapsuleShape(radius, height);
          break;
        case 2:
          shape = new Ammo.btCapsuleShapeZ(radius, height);
          break;
      }
    }
    return shape;
  }
}

// Cylinder Collision System
class CollisionCylinderSystemImpl extends CollisionSystemImpl {
  createPhysicalShape(entity, data) {
    const axis = data.axis !== undefined ? data.axis : 1;
    const radius = data.radius !== undefined ? data.radius : 0.5;
    const height = data.height !== undefined ? data.height : 1;
    let halfExtents = null;
    let shape = null;
    if (typeof Ammo !== 'undefined') {
      switch (axis) {
        case 0:
          halfExtents = new Ammo.btVector3(height * 0.5, radius, radius);
          shape = new Ammo.btCylinderShapeX(halfExtents);
          break;
        case 1:
          halfExtents = new Ammo.btVector3(radius, height * 0.5, radius);
          shape = new Ammo.btCylinderShape(halfExtents);
          break;
        case 2:
          halfExtents = new Ammo.btVector3(radius, radius, height * 0.5);
          shape = new Ammo.btCylinderShapeZ(halfExtents);
          break;
      }
    }
    if (halfExtents) Ammo.destroy(halfExtents);
    return shape;
  }
}

// Cone Collision System
class CollisionConeSystemImpl extends CollisionSystemImpl {
  createPhysicalShape(entity, data) {
    const axis = data.axis !== undefined ? data.axis : 1;
    const radius = data.radius !== undefined ? data.radius : 0.5;
    const height = data.height !== undefined ? data.height : 1;
    let shape = null;
    if (typeof Ammo !== 'undefined') {
      switch (axis) {
        case 0:
          shape = new Ammo.btConeShapeX(radius, height);
          break;
        case 1:
          shape = new Ammo.btConeShape(radius, height);
          break;
        case 2:
          shape = new Ammo.btConeShapeZ(radius, height);
          break;
      }
    }
    return shape;
  }
}

// Mesh Collision System
class CollisionMeshSystemImpl extends CollisionSystemImpl {
  // override for the mesh implementation because the asset model needs
  // special handling
  beforeInitialize(component, data) {}
  createAmmoMesh(mesh, node, shape) {
    let triMesh;
    if (this.system._triMeshCache[mesh.id]) {
      triMesh = this.system._triMeshCache[mesh.id];
    } else {
      const vb = mesh.vertexBuffer;
      const format = vb.getFormat();
      let stride;
      let positions;
      for (let i = 0; i < format.elements.length; i++) {
        const element = format.elements[i];
        if (element.name === SEMANTIC_POSITION) {
          positions = new Float32Array(vb.lock(), element.offset);
          stride = element.stride / 4;
          break;
        }
      }
      const indices = [];
      mesh.getIndices(indices);
      const numTriangles = mesh.primitive[0].count / 3;
      const v1 = new Ammo.btVector3();
      const v2 = new Ammo.btVector3();
      const v3 = new Ammo.btVector3();
      let i1, i2, i3;
      const base = mesh.primitive[0].base;
      triMesh = new Ammo.btTriangleMesh();
      this.system._triMeshCache[mesh.id] = triMesh;
      for (let i = 0; i < numTriangles; i++) {
        i1 = indices[base + i * 3] * stride;
        i2 = indices[base + i * 3 + 1] * stride;
        i3 = indices[base + i * 3 + 2] * stride;
        v1.setValue(positions[i1], positions[i1 + 1], positions[i1 + 2]);
        v2.setValue(positions[i2], positions[i2 + 1], positions[i2 + 2]);
        v3.setValue(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        triMesh.addTriangle(v1, v2, v3, true);
      }
      Ammo.destroy(v1);
      Ammo.destroy(v2);
      Ammo.destroy(v3);
    }
    const useQuantizedAabbCompression = true;
    const triMeshShape = new Ammo.btBvhTriangleMeshShape(triMesh, useQuantizedAabbCompression);
    const scaling = this.system._getNodeScaling(node);
    triMeshShape.setLocalScaling(scaling);
    Ammo.destroy(scaling);
    const transform = this.system._getNodeTransform(node);
    shape.addChildShape(transform, triMeshShape);
    Ammo.destroy(transform);
  }
  createPhysicalShape(entity, data) {
    if (typeof Ammo === 'undefined') return undefined;
    if (data.model || data.render) {
      const shape = new Ammo.btCompoundShape();
      if (data.model) {
        const meshInstances = data.model.meshInstances;
        for (let i = 0; i < meshInstances.length; i++) {
          this.createAmmoMesh(meshInstances[i].mesh, meshInstances[i].node, shape);
        }
      } else if (data.render) {
        const meshes = data.render.meshes;
        for (let i = 0; i < meshes.length; i++) {
          this.createAmmoMesh(meshes[i], tempGraphNode, shape);
        }
      }
      const entityTransform = entity.getWorldTransform();
      const scale = entityTransform.getScale();
      const vec = new Ammo.btVector3(scale.x, scale.y, scale.z);
      shape.setLocalScaling(vec);
      Ammo.destroy(vec);
      return shape;
    }
    return undefined;
  }
  recreatePhysicalShapes(component) {
    const data = component.data;
    if (data.renderAsset || data.asset) {
      if (component.enabled && component.entity.enabled) {
        this.loadAsset(component, data.renderAsset || data.asset, data.renderAsset ? 'render' : 'model');
        return;
      }
    }
    this.doRecreatePhysicalShape(component);
  }
  loadAsset(component, id, property) {
    const data = component.data;
    const assets = this.system.app.assets;
    const asset = assets.get(id);
    if (asset) {
      asset.ready(asset => {
        data[property] = asset.resource;
        this.doRecreatePhysicalShape(component);
      });
      assets.load(asset);
    } else {
      assets.once('add:' + id, asset => {
        asset.ready(asset => {
          data[property] = asset.resource;
          this.doRecreatePhysicalShape(component);
        });
        assets.load(asset);
      });
    }
  }
  doRecreatePhysicalShape(component) {
    const entity = component.entity;
    const data = component.data;
    if (data.model || data.render) {
      this.destroyShape(data);
      data.shape = this.createPhysicalShape(entity, data);
      if (entity.rigidbody) {
        entity.rigidbody.disableSimulation();
        entity.rigidbody.createBody();
        if (entity.enabled && entity.rigidbody.enabled) {
          entity.rigidbody.enableSimulation();
        }
      } else {
        if (!entity.trigger) {
          entity.trigger = new Trigger(this.system.app, component, data);
        } else {
          entity.trigger.initialize(data);
        }
      }
    } else {
      this.beforeRemove(entity, component);
      this.remove(entity, data);
    }
  }
  updateTransform(component, position, rotation, scale) {
    if (component.shape) {
      const entityTransform = component.entity.getWorldTransform();
      const worldScale = entityTransform.getScale();

      // if the scale changed then recreate the shape
      const previousScale = component.shape.getLocalScaling();
      if (worldScale.x !== previousScale.x() || worldScale.y !== previousScale.y() || worldScale.z !== previousScale.z()) {
        this.doRecreatePhysicalShape(component);
      }
    }
    super.updateTransform(component, position, rotation, scale);
  }
  destroyShape(data) {
    if (!data.shape) return;
    const numShapes = data.shape.getNumChildShapes();
    for (let i = 0; i < numShapes; i++) {
      const shape = data.shape.getChildShape(i);
      Ammo.destroy(shape);
    }
    Ammo.destroy(data.shape);
    data.shape = null;
  }
  remove(entity, data) {
    this.destroyShape(data);
    super.remove(entity, data);
  }
}

// Compound Collision System
class CollisionCompoundSystemImpl extends CollisionSystemImpl {
  createPhysicalShape(entity, data) {
    if (typeof Ammo !== 'undefined') {
      return new Ammo.btCompoundShape();
    }
    return undefined;
  }
  _addEachDescendant(entity) {
    if (!entity.collision || entity.rigidbody) return;
    entity.collision._compoundParent = this;
    if (entity !== this.entity) {
      entity.collision.system.recreatePhysicalShapes(entity.collision);
    }
  }
  _updateEachDescendant(entity) {
    if (!entity.collision) return;
    if (entity.collision._compoundParent !== this) return;
    entity.collision._compoundParent = null;
    if (entity !== this.entity && !entity.rigidbody) {
      entity.collision.system.recreatePhysicalShapes(entity.collision);
    }
  }
  _updateEachDescendantTransform(entity) {
    if (!entity.collision || entity.collision._compoundParent !== this.collision._compoundParent) return;
    this.collision.system.updateCompoundChildTransform(entity);
  }
}

/**
 * Manages creation of {@link CollisionComponent}s.
 *
 * @augments ComponentSystem
 */
class CollisionComponentSystem extends ComponentSystem {
  /**
   * Creates a new CollisionComponentSystem instance.
   *
   * @param {import('../../app-base.js').AppBase} app - The running {@link AppBase}.
   * @hideconstructor
   */
  constructor(app) {
    super(app);
    this.id = 'collision';
    this.ComponentType = CollisionComponent;
    this.DataType = CollisionComponentData;
    this.schema = _schema;
    this.implementations = {};
    this._triMeshCache = {};
    this.on('beforeremove', this.onBeforeRemove, this);
    this.on('remove', this.onRemove, this);
  }
  initializeComponentData(component, _data, properties) {
    properties = ['type', 'halfExtents', 'radius', 'axis', 'height', 'shape', 'model', 'asset', 'render', 'renderAsset', 'enabled', 'linearOffset', 'angularOffset'];

    // duplicate the input data because we are modifying it
    const data = {};
    for (let i = 0, len = properties.length; i < len; i++) {
      const property = properties[i];
      data[property] = _data[property];
    }

    // asset takes priority over model
    // but they are both trying to change the mesh
    // so remove one of them to avoid conflicts
    let idx;
    if (_data.hasOwnProperty('asset')) {
      idx = properties.indexOf('model');
      if (idx !== -1) {
        properties.splice(idx, 1);
      }
      idx = properties.indexOf('render');
      if (idx !== -1) {
        properties.splice(idx, 1);
      }
    } else if (_data.hasOwnProperty('model')) {
      idx = properties.indexOf('asset');
      if (idx !== -1) {
        properties.splice(idx, 1);
      }
    }
    if (!data.type) {
      data.type = component.data.type;
    }
    component.data.type = data.type;
    if (Array.isArray(data.halfExtents)) {
      data.halfExtents = new Vec3(data.halfExtents);
    }
    if (Array.isArray(data.linearOffset)) {
      data.linearOffset = new Vec3(data.linearOffset);
    }
    if (Array.isArray(data.angularOffset)) {
      // Allow for euler angles to be passed as a 3 length array
      const values = data.angularOffset;
      if (values.length === 3) {
        data.angularOffset = new Quat().setFromEulerAngles(values[0], values[1], values[2]);
      } else {
        data.angularOffset = new Quat(data.angularOffset);
      }
    }
    const impl = this._createImplementation(data.type);
    impl.beforeInitialize(component, data);
    super.initializeComponentData(component, data, properties);
    impl.afterInitialize(component, data);
  }

  // Creates an implementation based on the collision type and caches it
  // in an internal implementations structure, before returning it.
  _createImplementation(type) {
    if (this.implementations[type] === undefined) {
      let impl;
      switch (type) {
        case 'box':
          impl = new CollisionBoxSystemImpl(this);
          break;
        case 'sphere':
          impl = new CollisionSphereSystemImpl(this);
          break;
        case 'capsule':
          impl = new CollisionCapsuleSystemImpl(this);
          break;
        case 'cylinder':
          impl = new CollisionCylinderSystemImpl(this);
          break;
        case 'cone':
          impl = new CollisionConeSystemImpl(this);
          break;
        case 'mesh':
          impl = new CollisionMeshSystemImpl(this);
          break;
        case 'compound':
          impl = new CollisionCompoundSystemImpl(this);
          break;
        default:
          Debug.error(`_createImplementation: Invalid collision system type: ${type}`);
      }
      this.implementations[type] = impl;
    }
    return this.implementations[type];
  }

  // Gets an existing implementation for the specified entity
  _getImplementation(entity) {
    return this.implementations[entity.collision.data.type];
  }
  cloneComponent(entity, clone) {
    return this._getImplementation(entity).clone(entity, clone);
  }
  onBeforeRemove(entity, component) {
    this.implementations[component.data.type].beforeRemove(entity, component);
    component.onBeforeRemove();
  }
  onRemove(entity, data) {
    this.implementations[data.type].remove(entity, data);
  }
  updateCompoundChildTransform(entity) {
    // TODO
    // use updateChildTransform once it is exposed in ammo.js

    this._removeCompoundChild(entity.collision._compoundParent, entity.collision.data.shape);
    if (entity.enabled && entity.collision.enabled) {
      const transform = this._getNodeTransform(entity, entity.collision._compoundParent.entity);
      entity.collision._compoundParent.shape.addChildShape(transform, entity.collision.data.shape);
      Ammo.destroy(transform);
    }
  }
  _removeCompoundChild(collision, shape) {
    if (collision.shape.removeChildShape) {
      collision.shape.removeChildShape(shape);
    } else {
      const ind = collision._getCompoundChildShapeIndex(shape);
      if (ind !== null) {
        collision.shape.removeChildShapeByIndex(ind);
      }
    }
  }
  onTransformChanged(component, position, rotation, scale) {
    this.implementations[component.data.type].updateTransform(component, position, rotation, scale);
  }

  // Destroys the previous collision type and creates a new one based on the new type provided
  changeType(component, previousType, newType) {
    this.implementations[previousType].beforeRemove(component.entity, component);
    this.implementations[previousType].remove(component.entity, component.data);
    this._createImplementation(newType).reset(component, component.data);
  }

  // Recreates rigid bodies or triggers for the specified component
  recreatePhysicalShapes(component) {
    this.implementations[component.data.type].recreatePhysicalShapes(component);
  }
  _calculateNodeRelativeTransform(node, relative) {
    if (node === relative) {
      const scale = node.getWorldTransform().getScale();
      mat4.setScale(scale.x, scale.y, scale.z);
    } else {
      this._calculateNodeRelativeTransform(node.parent, relative);
      mat4.mul(node.getLocalTransform());
    }
  }
  _getNodeScaling(node) {
    const wtm = node.getWorldTransform();
    const scl = wtm.getScale();
    return new Ammo.btVector3(scl.x, scl.y, scl.z);
  }
  _getNodeTransform(node, relative) {
    let pos, rot;
    if (relative) {
      this._calculateNodeRelativeTransform(node, relative);
      pos = vec3;
      rot = quat;
      mat4.getTranslation(pos);
      rot.setFromMat4(mat4);
    } else {
      pos = node.getPosition();
      rot = node.getRotation();
    }
    const ammoQuat = new Ammo.btQuaternion();
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    const origin = transform.getOrigin();
    const component = node.collision;
    if (component && component._hasOffset) {
      const lo = component.data.linearOffset;
      const ao = component.data.angularOffset;
      quat.copy(rot).transformVector(lo, vec3);
      vec3.add(pos);
      quat.copy(rot).mul(ao);
      origin.setValue(vec3.x, vec3.y, vec3.z);
      ammoQuat.setValue(quat.x, quat.y, quat.z, quat.w);
    } else {
      origin.setValue(pos.x, pos.y, pos.z);
      ammoQuat.setValue(rot.x, rot.y, rot.z, rot.w);
    }
    transform.setRotation(ammoQuat);
    Ammo.destroy(ammoQuat);
    Ammo.destroy(origin);
    return transform;
  }
  destroy() {
    for (const key in this._triMeshCache) {
      Ammo.destroy(this._triMeshCache[key]);
    }
    this._triMeshCache = null;
    super.destroy();
  }
}
Component._buildAccessors(CollisionComponent.prototype, _schema);

export { CollisionComponentSystem };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvZnJhbWV3b3JrL2NvbXBvbmVudHMvY29sbGlzaW9uL3N5c3RlbS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEZWJ1ZyB9IGZyb20gJy4uLy4uLy4uL2NvcmUvZGVidWcuanMnO1xuXG5pbXBvcnQgeyBNYXQ0IH0gZnJvbSAnLi4vLi4vLi4vY29yZS9tYXRoL21hdDQuanMnO1xuaW1wb3J0IHsgUXVhdCB9IGZyb20gJy4uLy4uLy4uL2NvcmUvbWF0aC9xdWF0LmpzJztcbmltcG9ydCB7IFZlYzMgfSBmcm9tICcuLi8uLi8uLi9jb3JlL21hdGgvdmVjMy5qcyc7XG5cbmltcG9ydCB7IFNFTUFOVElDX1BPU0lUSU9OIH0gZnJvbSAnLi4vLi4vLi4vcGxhdGZvcm0vZ3JhcGhpY3MvY29uc3RhbnRzLmpzJztcblxuaW1wb3J0IHsgR3JhcGhOb2RlIH0gZnJvbSAnLi4vLi4vLi4vc2NlbmUvZ3JhcGgtbm9kZS5qcyc7XG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4uLy4uLy4uL3NjZW5lL21vZGVsLmpzJztcblxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50LmpzJztcbmltcG9ydCB7IENvbXBvbmVudFN5c3RlbSB9IGZyb20gJy4uL3N5c3RlbS5qcyc7XG5cbmltcG9ydCB7IENvbGxpc2lvbkNvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50LmpzJztcbmltcG9ydCB7IENvbGxpc2lvbkNvbXBvbmVudERhdGEgfSBmcm9tICcuL2RhdGEuanMnO1xuaW1wb3J0IHsgVHJpZ2dlciB9IGZyb20gJy4vdHJpZ2dlci5qcyc7XG5cbmNvbnN0IG1hdDQgPSBuZXcgTWF0NCgpO1xuY29uc3QgdmVjMyA9IG5ldyBWZWMzKCk7XG5jb25zdCBxdWF0ID0gbmV3IFF1YXQoKTtcbmNvbnN0IHRlbXBHcmFwaE5vZGUgPSBuZXcgR3JhcGhOb2RlKCk7XG5cbmNvbnN0IF9zY2hlbWEgPSBbXG4gICAgJ2VuYWJsZWQnLFxuICAgICd0eXBlJyxcbiAgICAnaGFsZkV4dGVudHMnLFxuICAgICdsaW5lYXJPZmZzZXQnLFxuICAgICdhbmd1bGFyT2Zmc2V0JyxcbiAgICAncmFkaXVzJyxcbiAgICAnYXhpcycsXG4gICAgJ2hlaWdodCcsXG4gICAgJ2Fzc2V0JyxcbiAgICAncmVuZGVyQXNzZXQnLFxuICAgICdzaGFwZScsXG4gICAgJ21vZGVsJyxcbiAgICAncmVuZGVyJ1xuXTtcblxuLy8gQ29sbGlzaW9uIHN5c3RlbSBpbXBsZW1lbnRhdGlvbnNcbmNsYXNzIENvbGxpc2lvblN5c3RlbUltcGwge1xuICAgIGNvbnN0cnVjdG9yKHN5c3RlbSkge1xuICAgICAgICB0aGlzLnN5c3RlbSA9IHN5c3RlbTtcbiAgICB9XG5cbiAgICAvLyBDYWxsZWQgYmVmb3JlIHRoZSBjYWxsIHRvIHN5c3RlbS5zdXBlci5pbml0aWFsaXplQ29tcG9uZW50RGF0YSBpcyBtYWRlXG4gICAgYmVmb3JlSW5pdGlhbGl6ZShjb21wb25lbnQsIGRhdGEpIHtcbiAgICAgICAgZGF0YS5zaGFwZSA9IG51bGw7XG5cbiAgICAgICAgZGF0YS5tb2RlbCA9IG5ldyBNb2RlbCgpO1xuICAgICAgICBkYXRhLm1vZGVsLmdyYXBoID0gbmV3IEdyYXBoTm9kZSgpO1xuICAgIH1cblxuICAgIC8vIENhbGxlZCBhZnRlciB0aGUgY2FsbCB0byBzeXN0ZW0uc3VwZXIuaW5pdGlhbGl6ZUNvbXBvbmVudERhdGEgaXMgbWFkZVxuICAgIGFmdGVySW5pdGlhbGl6ZShjb21wb25lbnQsIGRhdGEpIHtcbiAgICAgICAgdGhpcy5yZWNyZWF0ZVBoeXNpY2FsU2hhcGVzKGNvbXBvbmVudCk7XG4gICAgICAgIGNvbXBvbmVudC5kYXRhLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBDYWxsZWQgd2hlbiBhIGNvbGxpc2lvbiBjb21wb25lbnQgY2hhbmdlcyB0eXBlIGluIG9yZGVyIHRvIHJlY3JlYXRlIGRlYnVnIGFuZCBwaHlzaWNhbCBzaGFwZXNcbiAgICByZXNldChjb21wb25lbnQsIGRhdGEpIHtcbiAgICAgICAgdGhpcy5iZWZvcmVJbml0aWFsaXplKGNvbXBvbmVudCwgZGF0YSk7XG4gICAgICAgIHRoaXMuYWZ0ZXJJbml0aWFsaXplKGNvbXBvbmVudCwgZGF0YSk7XG4gICAgfVxuXG4gICAgLy8gUmUtY3JlYXRlcyByaWdpZCBib2RpZXMgLyB0cmlnZ2Vyc1xuICAgIHJlY3JlYXRlUGh5c2ljYWxTaGFwZXMoY29tcG9uZW50KSB7XG4gICAgICAgIGNvbnN0IGVudGl0eSA9IGNvbXBvbmVudC5lbnRpdHk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBjb21wb25lbnQuZGF0YTtcblxuICAgICAgICBpZiAodHlwZW9mIEFtbW8gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAoZW50aXR5LnRyaWdnZXIpIHtcbiAgICAgICAgICAgICAgICBlbnRpdHkudHJpZ2dlci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0eS50cmlnZ2VyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGF0YS5zaGFwZSkge1xuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQuX2NvbXBvdW5kUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3lzdGVtLl9yZW1vdmVDb21wb3VuZENoaWxkKGNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQsIGRhdGEuc2hhcGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQuX2NvbXBvdW5kUGFyZW50LmVudGl0eS5yaWdpZGJvZHkpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuX2NvbXBvdW5kUGFyZW50LmVudGl0eS5yaWdpZGJvZHkuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBBbW1vLmRlc3Ryb3koZGF0YS5zaGFwZSk7XG4gICAgICAgICAgICAgICAgZGF0YS5zaGFwZSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRhdGEuc2hhcGUgPSB0aGlzLmNyZWF0ZVBoeXNpY2FsU2hhcGUoY29tcG9uZW50LmVudGl0eSwgZGF0YSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGZpcnN0Q29tcG91bmRDaGlsZCA9ICFjb21wb25lbnQuX2NvbXBvdW5kUGFyZW50O1xuXG4gICAgICAgICAgICBpZiAoZGF0YS50eXBlID09PSAnY29tcG91bmQnICYmICghY29tcG9uZW50Ll9jb21wb3VuZFBhcmVudCB8fCBjb21wb25lbnQgPT09IGNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50Ll9jb21wb3VuZFBhcmVudCA9IGNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgIGVudGl0eS5mb3JFYWNoKHRoaXMuX2FkZEVhY2hEZXNjZW5kYW50LCBjb21wb25lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLnR5cGUgIT09ICdjb21wb3VuZCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50Ll9jb21wb3VuZFBhcmVudCAmJiBjb21wb25lbnQgPT09IGNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZW50aXR5LmZvckVhY2godGhpcy5zeXN0ZW0uaW1wbGVtZW50YXRpb25zLmNvbXBvdW5kLl91cGRhdGVFYWNoRGVzY2VuZGFudCwgY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWNvbXBvbmVudC5yaWdpZGJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50Ll9jb21wb3VuZFBhcmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJlbnQgPSBlbnRpdHkucGFyZW50O1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50LmNvbGxpc2lvbiAmJiBwYXJlbnQuY29sbGlzaW9uLnR5cGUgPT09ICdjb21wb3VuZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuX2NvbXBvdW5kUGFyZW50ID0gcGFyZW50LmNvbGxpc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjb21wb25lbnQuX2NvbXBvdW5kUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudCAhPT0gY29tcG9uZW50Ll9jb21wb3VuZFBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3RDb21wb3VuZENoaWxkICYmIGNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQuc2hhcGUuZ2V0TnVtQ2hpbGRTaGFwZXMoKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zeXN0ZW0ucmVjcmVhdGVQaHlzaWNhbFNoYXBlcyhjb21wb25lbnQuX2NvbXBvdW5kUGFyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3lzdGVtLnVwZGF0ZUNvbXBvdW5kQ2hpbGRUcmFuc2Zvcm0oZW50aXR5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQuZW50aXR5LnJpZ2lkYm9keSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuX2NvbXBvdW5kUGFyZW50LmVudGl0eS5yaWdpZGJvZHkuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVudGl0eS5yaWdpZGJvZHkpIHtcbiAgICAgICAgICAgICAgICBlbnRpdHkucmlnaWRib2R5LmRpc2FibGVTaW11bGF0aW9uKCk7XG4gICAgICAgICAgICAgICAgZW50aXR5LnJpZ2lkYm9keS5jcmVhdGVCb2R5KCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZW50aXR5LmVuYWJsZWQgJiYgZW50aXR5LnJpZ2lkYm9keS5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eS5yaWdpZGJvZHkuZW5hYmxlU2ltdWxhdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVudGl0eS50cmlnZ2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eS50cmlnZ2VyID0gbmV3IFRyaWdnZXIodGhpcy5zeXN0ZW0uYXBwLCBjb21wb25lbnQsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eS50cmlnZ2VyLmluaXRpYWxpemUoZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlcyBhIHBoeXNpY2FsIHNoYXBlIGZvciB0aGUgY29sbGlzaW9uLiBUaGlzIGNvbnNpc3RzXG4gICAgLy8gb2YgdGhlIGFjdHVhbCBzaGFwZSB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHJpZ2lkIGJvZGllcyAvIHRyaWdnZXJzIG9mXG4gICAgLy8gdGhlIGNvbGxpc2lvbi5cbiAgICBjcmVhdGVQaHlzaWNhbFNoYXBlKGVudGl0eSwgZGF0YSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHVwZGF0ZVRyYW5zZm9ybShjb21wb25lbnQsIHBvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudC5lbnRpdHkudHJpZ2dlcikge1xuICAgICAgICAgICAgY29tcG9uZW50LmVudGl0eS50cmlnZ2VyLnVwZGF0ZVRyYW5zZm9ybSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYmVmb3JlUmVtb3ZlKGVudGl0eSwgY29tcG9uZW50KSB7XG4gICAgICAgIGlmIChjb21wb25lbnQuZGF0YS5zaGFwZSkge1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQgJiYgIWNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQuZW50aXR5Ll9kZXN0cm95aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zeXN0ZW0uX3JlbW92ZUNvbXBvdW5kQ2hpbGQoY29tcG9uZW50Ll9jb21wb3VuZFBhcmVudCwgY29tcG9uZW50LmRhdGEuc2hhcGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQuZW50aXR5LnJpZ2lkYm9keSlcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50Ll9jb21wb3VuZFBhcmVudC5lbnRpdHkucmlnaWRib2R5LmFjdGl2YXRlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fY29tcG91bmRQYXJlbnQgPSBudWxsO1xuXG4gICAgICAgICAgICBBbW1vLmRlc3Ryb3koY29tcG9uZW50LmRhdGEuc2hhcGUpO1xuICAgICAgICAgICAgY29tcG9uZW50LmRhdGEuc2hhcGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2FsbGVkIHdoZW4gdGhlIGNvbGxpc2lvbiBpcyByZW1vdmVkXG4gICAgcmVtb3ZlKGVudGl0eSwgZGF0YSkge1xuICAgICAgICBpZiAoZW50aXR5LnJpZ2lkYm9keSAmJiBlbnRpdHkucmlnaWRib2R5LmJvZHkpIHtcbiAgICAgICAgICAgIGVudGl0eS5yaWdpZGJvZHkuZGlzYWJsZVNpbXVsYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbnRpdHkudHJpZ2dlcikge1xuICAgICAgICAgICAgZW50aXR5LnRyaWdnZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgZGVsZXRlIGVudGl0eS50cmlnZ2VyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2FsbGVkIHdoZW4gdGhlIGNvbGxpc2lvbiBpcyBjbG9uZWQgdG8gYW5vdGhlciBlbnRpdHlcbiAgICBjbG9uZShlbnRpdHksIGNsb25lKSB7XG4gICAgICAgIGNvbnN0IHNyYyA9IHRoaXMuc3lzdGVtLnN0b3JlW2VudGl0eS5nZXRHdWlkKCldO1xuXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICBlbmFibGVkOiBzcmMuZGF0YS5lbmFibGVkLFxuICAgICAgICAgICAgdHlwZTogc3JjLmRhdGEudHlwZSxcbiAgICAgICAgICAgIGhhbGZFeHRlbnRzOiBbc3JjLmRhdGEuaGFsZkV4dGVudHMueCwgc3JjLmRhdGEuaGFsZkV4dGVudHMueSwgc3JjLmRhdGEuaGFsZkV4dGVudHMuel0sXG4gICAgICAgICAgICBsaW5lYXJPZmZzZXQ6IFtzcmMuZGF0YS5saW5lYXJPZmZzZXQueCwgc3JjLmRhdGEubGluZWFyT2Zmc2V0LnksIHNyYy5kYXRhLmxpbmVhck9mZnNldC56XSxcbiAgICAgICAgICAgIGFuZ3VsYXJPZmZzZXQ6IFtzcmMuZGF0YS5hbmd1bGFyT2Zmc2V0LngsIHNyYy5kYXRhLmFuZ3VsYXJPZmZzZXQueSwgc3JjLmRhdGEuYW5ndWxhck9mZnNldC56LCBzcmMuZGF0YS5hbmd1bGFyT2Zmc2V0LnddLFxuICAgICAgICAgICAgcmFkaXVzOiBzcmMuZGF0YS5yYWRpdXMsXG4gICAgICAgICAgICBheGlzOiBzcmMuZGF0YS5heGlzLFxuICAgICAgICAgICAgaGVpZ2h0OiBzcmMuZGF0YS5oZWlnaHQsXG4gICAgICAgICAgICBhc3NldDogc3JjLmRhdGEuYXNzZXQsXG4gICAgICAgICAgICByZW5kZXJBc3NldDogc3JjLmRhdGEucmVuZGVyQXNzZXQsXG4gICAgICAgICAgICBtb2RlbDogc3JjLmRhdGEubW9kZWwsXG4gICAgICAgICAgICByZW5kZXI6IHNyYy5kYXRhLnJlbmRlclxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5hZGRDb21wb25lbnQoY2xvbmUsIGRhdGEpO1xuICAgIH1cbn1cblxuLy8gQm94IENvbGxpc2lvbiBTeXN0ZW1cbmNsYXNzIENvbGxpc2lvbkJveFN5c3RlbUltcGwgZXh0ZW5kcyBDb2xsaXNpb25TeXN0ZW1JbXBsIHtcbiAgICBjcmVhdGVQaHlzaWNhbFNoYXBlKGVudGl0eSwgZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIEFtbW8gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zdCBoZSA9IGRhdGEuaGFsZkV4dGVudHM7XG4gICAgICAgICAgICBjb25zdCBhbW1vSGUgPSBuZXcgQW1tby5idFZlY3RvcjMoaGUgPyBoZS54IDogMC41LCBoZSA/IGhlLnkgOiAwLjUsIGhlID8gaGUueiA6IDAuNSk7XG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IG5ldyBBbW1vLmJ0Qm94U2hhcGUoYW1tb0hlKTtcbiAgICAgICAgICAgIEFtbW8uZGVzdHJveShhbW1vSGUpO1xuICAgICAgICAgICAgcmV0dXJuIHNoYXBlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG4vLyBTcGhlcmUgQ29sbGlzaW9uIFN5c3RlbVxuY2xhc3MgQ29sbGlzaW9uU3BoZXJlU3lzdGVtSW1wbCBleHRlbmRzIENvbGxpc2lvblN5c3RlbUltcGwge1xuICAgIGNyZWF0ZVBoeXNpY2FsU2hhcGUoZW50aXR5LCBkYXRhKSB7XG4gICAgICAgIGlmICh0eXBlb2YgQW1tbyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQW1tby5idFNwaGVyZVNoYXBlKGRhdGEucmFkaXVzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuLy8gQ2Fwc3VsZSBDb2xsaXNpb24gU3lzdGVtXG5jbGFzcyBDb2xsaXNpb25DYXBzdWxlU3lzdGVtSW1wbCBleHRlbmRzIENvbGxpc2lvblN5c3RlbUltcGwge1xuICAgIGNyZWF0ZVBoeXNpY2FsU2hhcGUoZW50aXR5LCBkYXRhKSB7XG4gICAgICAgIGNvbnN0IGF4aXMgPSAoZGF0YS5heGlzICE9PSB1bmRlZmluZWQpID8gZGF0YS5heGlzIDogMTtcbiAgICAgICAgY29uc3QgcmFkaXVzID0gZGF0YS5yYWRpdXMgfHwgMC41O1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBNYXRoLm1heCgoZGF0YS5oZWlnaHQgfHwgMikgLSAyICogcmFkaXVzLCAwKTtcblxuICAgICAgICBsZXQgc2hhcGUgPSBudWxsO1xuXG4gICAgICAgIGlmICh0eXBlb2YgQW1tbyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoYXhpcykge1xuICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENhcHN1bGVTaGFwZVgocmFkaXVzLCBoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDYXBzdWxlU2hhcGUocmFkaXVzLCBoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDYXBzdWxlU2hhcGVaKHJhZGl1cywgaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2hhcGU7XG4gICAgfVxufVxuXG4vLyBDeWxpbmRlciBDb2xsaXNpb24gU3lzdGVtXG5jbGFzcyBDb2xsaXNpb25DeWxpbmRlclN5c3RlbUltcGwgZXh0ZW5kcyBDb2xsaXNpb25TeXN0ZW1JbXBsIHtcbiAgICBjcmVhdGVQaHlzaWNhbFNoYXBlKGVudGl0eSwgZGF0YSkge1xuICAgICAgICBjb25zdCBheGlzID0gKGRhdGEuYXhpcyAhPT0gdW5kZWZpbmVkKSA/IGRhdGEuYXhpcyA6IDE7XG4gICAgICAgIGNvbnN0IHJhZGl1cyA9IChkYXRhLnJhZGl1cyAhPT0gdW5kZWZpbmVkKSA/IGRhdGEucmFkaXVzIDogMC41O1xuICAgICAgICBjb25zdCBoZWlnaHQgPSAoZGF0YS5oZWlnaHQgIT09IHVuZGVmaW5lZCkgPyBkYXRhLmhlaWdodCA6IDE7XG5cbiAgICAgICAgbGV0IGhhbGZFeHRlbnRzID0gbnVsbDtcbiAgICAgICAgbGV0IHNoYXBlID0gbnVsbDtcblxuICAgICAgICBpZiAodHlwZW9mIEFtbW8gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGF4aXMpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgIGhhbGZFeHRlbnRzID0gbmV3IEFtbW8uYnRWZWN0b3IzKGhlaWdodCAqIDAuNSwgcmFkaXVzLCByYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q3lsaW5kZXJTaGFwZVgoaGFsZkV4dGVudHMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgIGhhbGZFeHRlbnRzID0gbmV3IEFtbW8uYnRWZWN0b3IzKHJhZGl1cywgaGVpZ2h0ICogMC41LCByYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q3lsaW5kZXJTaGFwZShoYWxmRXh0ZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgaGFsZkV4dGVudHMgPSBuZXcgQW1tby5idFZlY3RvcjMocmFkaXVzLCByYWRpdXMsIGhlaWdodCAqIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDeWxpbmRlclNoYXBlWihoYWxmRXh0ZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhbGZFeHRlbnRzKVxuICAgICAgICAgICAgQW1tby5kZXN0cm95KGhhbGZFeHRlbnRzKTtcblxuICAgICAgICByZXR1cm4gc2hhcGU7XG4gICAgfVxufVxuXG4vLyBDb25lIENvbGxpc2lvbiBTeXN0ZW1cbmNsYXNzIENvbGxpc2lvbkNvbmVTeXN0ZW1JbXBsIGV4dGVuZHMgQ29sbGlzaW9uU3lzdGVtSW1wbCB7XG4gICAgY3JlYXRlUGh5c2ljYWxTaGFwZShlbnRpdHksIGRhdGEpIHtcbiAgICAgICAgY29uc3QgYXhpcyA9IChkYXRhLmF4aXMgIT09IHVuZGVmaW5lZCkgPyBkYXRhLmF4aXMgOiAxO1xuICAgICAgICBjb25zdCByYWRpdXMgPSAoZGF0YS5yYWRpdXMgIT09IHVuZGVmaW5lZCkgPyBkYXRhLnJhZGl1cyA6IDAuNTtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gKGRhdGEuaGVpZ2h0ICE9PSB1bmRlZmluZWQpID8gZGF0YS5oZWlnaHQgOiAxO1xuXG4gICAgICAgIGxldCBzaGFwZSA9IG51bGw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBBbW1vICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgc3dpdGNoIChheGlzKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29uZVNoYXBlWChyYWRpdXMsIGhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbmVTaGFwZShyYWRpdXMsIGhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbmVTaGFwZVoocmFkaXVzLCBoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzaGFwZTtcbiAgICB9XG59XG5cbi8vIE1lc2ggQ29sbGlzaW9uIFN5c3RlbVxuY2xhc3MgQ29sbGlzaW9uTWVzaFN5c3RlbUltcGwgZXh0ZW5kcyBDb2xsaXNpb25TeXN0ZW1JbXBsIHtcbiAgICAvLyBvdmVycmlkZSBmb3IgdGhlIG1lc2ggaW1wbGVtZW50YXRpb24gYmVjYXVzZSB0aGUgYXNzZXQgbW9kZWwgbmVlZHNcbiAgICAvLyBzcGVjaWFsIGhhbmRsaW5nXG4gICAgYmVmb3JlSW5pdGlhbGl6ZShjb21wb25lbnQsIGRhdGEpIHt9XG5cbiAgICBjcmVhdGVBbW1vTWVzaChtZXNoLCBub2RlLCBzaGFwZSkge1xuICAgICAgICBsZXQgdHJpTWVzaDtcblxuICAgICAgICBpZiAodGhpcy5zeXN0ZW0uX3RyaU1lc2hDYWNoZVttZXNoLmlkXSkge1xuICAgICAgICAgICAgdHJpTWVzaCA9IHRoaXMuc3lzdGVtLl90cmlNZXNoQ2FjaGVbbWVzaC5pZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB2YiA9IG1lc2gudmVydGV4QnVmZmVyO1xuXG4gICAgICAgICAgICBjb25zdCBmb3JtYXQgPSB2Yi5nZXRGb3JtYXQoKTtcbiAgICAgICAgICAgIGxldCBzdHJpZGU7XG4gICAgICAgICAgICBsZXQgcG9zaXRpb25zO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmb3JtYXQuZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gZm9ybWF0LmVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50Lm5hbWUgPT09IFNFTUFOVElDX1BPU0lUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkodmIubG9jaygpLCBlbGVtZW50Lm9mZnNldCk7XG4gICAgICAgICAgICAgICAgICAgIHN0cmlkZSA9IGVsZW1lbnQuc3RyaWRlIC8gNDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpbmRpY2VzID0gW107XG4gICAgICAgICAgICBtZXNoLmdldEluZGljZXMoaW5kaWNlcyk7XG4gICAgICAgICAgICBjb25zdCBudW1UcmlhbmdsZXMgPSBtZXNoLnByaW1pdGl2ZVswXS5jb3VudCAvIDM7XG5cbiAgICAgICAgICAgIGNvbnN0IHYxID0gbmV3IEFtbW8uYnRWZWN0b3IzKCk7XG4gICAgICAgICAgICBjb25zdCB2MiA9IG5ldyBBbW1vLmJ0VmVjdG9yMygpO1xuICAgICAgICAgICAgY29uc3QgdjMgPSBuZXcgQW1tby5idFZlY3RvcjMoKTtcbiAgICAgICAgICAgIGxldCBpMSwgaTIsIGkzO1xuXG4gICAgICAgICAgICBjb25zdCBiYXNlID0gbWVzaC5wcmltaXRpdmVbMF0uYmFzZTtcbiAgICAgICAgICAgIHRyaU1lc2ggPSBuZXcgQW1tby5idFRyaWFuZ2xlTWVzaCgpO1xuICAgICAgICAgICAgdGhpcy5zeXN0ZW0uX3RyaU1lc2hDYWNoZVttZXNoLmlkXSA9IHRyaU1lc2g7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHJpYW5nbGVzOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpMSA9IGluZGljZXNbYmFzZSArIGkgKiAzXSAqIHN0cmlkZTtcbiAgICAgICAgICAgICAgICBpMiA9IGluZGljZXNbYmFzZSArIGkgKiAzICsgMV0gKiBzdHJpZGU7XG4gICAgICAgICAgICAgICAgaTMgPSBpbmRpY2VzW2Jhc2UgKyBpICogMyArIDJdICogc3RyaWRlO1xuICAgICAgICAgICAgICAgIHYxLnNldFZhbHVlKHBvc2l0aW9uc1tpMV0sIHBvc2l0aW9uc1tpMSArIDFdLCBwb3NpdGlvbnNbaTEgKyAyXSk7XG4gICAgICAgICAgICAgICAgdjIuc2V0VmFsdWUocG9zaXRpb25zW2kyXSwgcG9zaXRpb25zW2kyICsgMV0sIHBvc2l0aW9uc1tpMiArIDJdKTtcbiAgICAgICAgICAgICAgICB2My5zZXRWYWx1ZShwb3NpdGlvbnNbaTNdLCBwb3NpdGlvbnNbaTMgKyAxXSwgcG9zaXRpb25zW2kzICsgMl0pO1xuICAgICAgICAgICAgICAgIHRyaU1lc2guYWRkVHJpYW5nbGUodjEsIHYyLCB2MywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEFtbW8uZGVzdHJveSh2MSk7XG4gICAgICAgICAgICBBbW1vLmRlc3Ryb3kodjIpO1xuICAgICAgICAgICAgQW1tby5kZXN0cm95KHYzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVzZVF1YW50aXplZEFhYmJDb21wcmVzc2lvbiA9IHRydWU7XG4gICAgICAgIGNvbnN0IHRyaU1lc2hTaGFwZSA9IG5ldyBBbW1vLmJ0QnZoVHJpYW5nbGVNZXNoU2hhcGUodHJpTWVzaCwgdXNlUXVhbnRpemVkQWFiYkNvbXByZXNzaW9uKTtcblxuICAgICAgICBjb25zdCBzY2FsaW5nID0gdGhpcy5zeXN0ZW0uX2dldE5vZGVTY2FsaW5nKG5vZGUpO1xuICAgICAgICB0cmlNZXNoU2hhcGUuc2V0TG9jYWxTY2FsaW5nKHNjYWxpbmcpO1xuICAgICAgICBBbW1vLmRlc3Ryb3koc2NhbGluZyk7XG5cbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5zeXN0ZW0uX2dldE5vZGVUcmFuc2Zvcm0obm9kZSk7XG4gICAgICAgIHNoYXBlLmFkZENoaWxkU2hhcGUodHJhbnNmb3JtLCB0cmlNZXNoU2hhcGUpO1xuICAgICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtKTtcbiAgICB9XG5cbiAgICBjcmVhdGVQaHlzaWNhbFNoYXBlKGVudGl0eSwgZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIEFtbW8gPT09ICd1bmRlZmluZWQnKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmIChkYXRhLm1vZGVsIHx8IGRhdGEucmVuZGVyKSB7XG5cbiAgICAgICAgICAgIGNvbnN0IHNoYXBlID0gbmV3IEFtbW8uYnRDb21wb3VuZFNoYXBlKCk7XG5cbiAgICAgICAgICAgIGlmIChkYXRhLm1vZGVsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWVzaEluc3RhbmNlcyA9IGRhdGEubW9kZWwubWVzaEluc3RhbmNlcztcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lc2hJbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVBbW1vTWVzaChtZXNoSW5zdGFuY2VzW2ldLm1lc2gsIG1lc2hJbnN0YW5jZXNbaV0ubm9kZSwgc2hhcGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5yZW5kZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNoZXMgPSBkYXRhLnJlbmRlci5tZXNoZXM7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVBbW1vTWVzaChtZXNoZXNbaV0sIHRlbXBHcmFwaE5vZGUsIHNoYXBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGVudGl0eVRyYW5zZm9ybSA9IGVudGl0eS5nZXRXb3JsZFRyYW5zZm9ybSgpO1xuICAgICAgICAgICAgY29uc3Qgc2NhbGUgPSBlbnRpdHlUcmFuc2Zvcm0uZ2V0U2NhbGUoKTtcbiAgICAgICAgICAgIGNvbnN0IHZlYyA9IG5ldyBBbW1vLmJ0VmVjdG9yMyhzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KTtcbiAgICAgICAgICAgIHNoYXBlLnNldExvY2FsU2NhbGluZyh2ZWMpO1xuICAgICAgICAgICAgQW1tby5kZXN0cm95KHZlYyk7XG5cbiAgICAgICAgICAgIHJldHVybiBzaGFwZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmVjcmVhdGVQaHlzaWNhbFNoYXBlcyhjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC5kYXRhO1xuXG4gICAgICAgIGlmIChkYXRhLnJlbmRlckFzc2V0IHx8IGRhdGEuYXNzZXQpIHtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnQuZW5hYmxlZCAmJiBjb21wb25lbnQuZW50aXR5LmVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRBc3NldChcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50LFxuICAgICAgICAgICAgICAgICAgICBkYXRhLnJlbmRlckFzc2V0IHx8IGRhdGEuYXNzZXQsXG4gICAgICAgICAgICAgICAgICAgIGRhdGEucmVuZGVyQXNzZXQgPyAncmVuZGVyJyA6ICdtb2RlbCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZG9SZWNyZWF0ZVBoeXNpY2FsU2hhcGUoY29tcG9uZW50KTtcbiAgICB9XG5cbiAgICBsb2FkQXNzZXQoY29tcG9uZW50LCBpZCwgcHJvcGVydHkpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC5kYXRhO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLnN5c3RlbS5hcHAuYXNzZXRzO1xuXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gYXNzZXRzLmdldChpZCk7XG4gICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgYXNzZXQucmVhZHkoKGFzc2V0KSA9PiB7XG4gICAgICAgICAgICAgICAgZGF0YVtwcm9wZXJ0eV0gPSBhc3NldC5yZXNvdXJjZTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvUmVjcmVhdGVQaHlzaWNhbFNoYXBlKGNvbXBvbmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGFzc2V0cy5sb2FkKGFzc2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFzc2V0cy5vbmNlKCdhZGQ6JyArIGlkLCAoYXNzZXQpID0+IHtcbiAgICAgICAgICAgICAgICBhc3NldC5yZWFkeSgoYXNzZXQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtwcm9wZXJ0eV0gPSBhc3NldC5yZXNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb1JlY3JlYXRlUGh5c2ljYWxTaGFwZShjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFzc2V0cy5sb2FkKGFzc2V0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZG9SZWNyZWF0ZVBoeXNpY2FsU2hhcGUoY29tcG9uZW50KSB7XG4gICAgICAgIGNvbnN0IGVudGl0eSA9IGNvbXBvbmVudC5lbnRpdHk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBjb21wb25lbnQuZGF0YTtcblxuICAgICAgICBpZiAoZGF0YS5tb2RlbCB8fCBkYXRhLnJlbmRlcikge1xuICAgICAgICAgICAgdGhpcy5kZXN0cm95U2hhcGUoZGF0YSk7XG5cbiAgICAgICAgICAgIGRhdGEuc2hhcGUgPSB0aGlzLmNyZWF0ZVBoeXNpY2FsU2hhcGUoZW50aXR5LCBkYXRhKTtcblxuICAgICAgICAgICAgaWYgKGVudGl0eS5yaWdpZGJvZHkpIHtcbiAgICAgICAgICAgICAgICBlbnRpdHkucmlnaWRib2R5LmRpc2FibGVTaW11bGF0aW9uKCk7XG4gICAgICAgICAgICAgICAgZW50aXR5LnJpZ2lkYm9keS5jcmVhdGVCb2R5KCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZW50aXR5LmVuYWJsZWQgJiYgZW50aXR5LnJpZ2lkYm9keS5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eS5yaWdpZGJvZHkuZW5hYmxlU2ltdWxhdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlbnRpdHkudHJpZ2dlcikge1xuICAgICAgICAgICAgICAgICAgICBlbnRpdHkudHJpZ2dlciA9IG5ldyBUcmlnZ2VyKHRoaXMuc3lzdGVtLmFwcCwgY29tcG9uZW50LCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbnRpdHkudHJpZ2dlci5pbml0aWFsaXplKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYmVmb3JlUmVtb3ZlKGVudGl0eSwgY29tcG9uZW50KTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGVudGl0eSwgZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVUcmFuc2Zvcm0oY29tcG9uZW50LCBwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlKSB7XG4gICAgICAgIGlmIChjb21wb25lbnQuc2hhcGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGVudGl0eVRyYW5zZm9ybSA9IGNvbXBvbmVudC5lbnRpdHkuZ2V0V29ybGRUcmFuc2Zvcm0oKTtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkU2NhbGUgPSBlbnRpdHlUcmFuc2Zvcm0uZ2V0U2NhbGUoKTtcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNjYWxlIGNoYW5nZWQgdGhlbiByZWNyZWF0ZSB0aGUgc2hhcGVcbiAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzU2NhbGUgPSBjb21wb25lbnQuc2hhcGUuZ2V0TG9jYWxTY2FsaW5nKCk7XG4gICAgICAgICAgICBpZiAod29ybGRTY2FsZS54ICE9PSBwcmV2aW91c1NjYWxlLngoKSB8fFxuICAgICAgICAgICAgICAgIHdvcmxkU2NhbGUueSAhPT0gcHJldmlvdXNTY2FsZS55KCkgfHxcbiAgICAgICAgICAgICAgICB3b3JsZFNjYWxlLnogIT09IHByZXZpb3VzU2NhbGUueigpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kb1JlY3JlYXRlUGh5c2ljYWxTaGFwZShjb21wb25lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIudXBkYXRlVHJhbnNmb3JtKGNvbXBvbmVudCwgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSk7XG4gICAgfVxuXG4gICAgZGVzdHJveVNoYXBlKGRhdGEpIHtcbiAgICAgICAgaWYgKCFkYXRhLnNoYXBlKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG51bVNoYXBlcyA9IGRhdGEuc2hhcGUuZ2V0TnVtQ2hpbGRTaGFwZXMoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1TaGFwZXM7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgc2hhcGUgPSBkYXRhLnNoYXBlLmdldENoaWxkU2hhcGUoaSk7XG4gICAgICAgICAgICBBbW1vLmRlc3Ryb3koc2hhcGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgQW1tby5kZXN0cm95KGRhdGEuc2hhcGUpO1xuICAgICAgICBkYXRhLnNoYXBlID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW1vdmUoZW50aXR5LCBkYXRhKSB7XG4gICAgICAgIHRoaXMuZGVzdHJveVNoYXBlKGRhdGEpO1xuICAgICAgICBzdXBlci5yZW1vdmUoZW50aXR5LCBkYXRhKTtcbiAgICB9XG59XG5cbi8vIENvbXBvdW5kIENvbGxpc2lvbiBTeXN0ZW1cbmNsYXNzIENvbGxpc2lvbkNvbXBvdW5kU3lzdGVtSW1wbCBleHRlbmRzIENvbGxpc2lvblN5c3RlbUltcGwge1xuICAgIGNyZWF0ZVBoeXNpY2FsU2hhcGUoZW50aXR5LCBkYXRhKSB7XG4gICAgICAgIGlmICh0eXBlb2YgQW1tbyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQW1tby5idENvbXBvdW5kU2hhcGUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIF9hZGRFYWNoRGVzY2VuZGFudChlbnRpdHkpIHtcbiAgICAgICAgaWYgKCFlbnRpdHkuY29sbGlzaW9uIHx8IGVudGl0eS5yaWdpZGJvZHkpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgZW50aXR5LmNvbGxpc2lvbi5fY29tcG91bmRQYXJlbnQgPSB0aGlzO1xuXG4gICAgICAgIGlmIChlbnRpdHkgIT09IHRoaXMuZW50aXR5KSB7XG4gICAgICAgICAgICBlbnRpdHkuY29sbGlzaW9uLnN5c3RlbS5yZWNyZWF0ZVBoeXNpY2FsU2hhcGVzKGVudGl0eS5jb2xsaXNpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3VwZGF0ZUVhY2hEZXNjZW5kYW50KGVudGl0eSkge1xuICAgICAgICBpZiAoIWVudGl0eS5jb2xsaXNpb24pXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgaWYgKGVudGl0eS5jb2xsaXNpb24uX2NvbXBvdW5kUGFyZW50ICE9PSB0aGlzKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGVudGl0eS5jb2xsaXNpb24uX2NvbXBvdW5kUGFyZW50ID0gbnVsbDtcblxuICAgICAgICBpZiAoZW50aXR5ICE9PSB0aGlzLmVudGl0eSAmJiAhZW50aXR5LnJpZ2lkYm9keSkge1xuICAgICAgICAgICAgZW50aXR5LmNvbGxpc2lvbi5zeXN0ZW0ucmVjcmVhdGVQaHlzaWNhbFNoYXBlcyhlbnRpdHkuY29sbGlzaW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF91cGRhdGVFYWNoRGVzY2VuZGFudFRyYW5zZm9ybShlbnRpdHkpIHtcbiAgICAgICAgaWYgKCFlbnRpdHkuY29sbGlzaW9uIHx8IGVudGl0eS5jb2xsaXNpb24uX2NvbXBvdW5kUGFyZW50ICE9PSB0aGlzLmNvbGxpc2lvbi5fY29tcG91bmRQYXJlbnQpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdGhpcy5jb2xsaXNpb24uc3lzdGVtLnVwZGF0ZUNvbXBvdW5kQ2hpbGRUcmFuc2Zvcm0oZW50aXR5KTtcbiAgICB9XG59XG5cbi8qKlxuICogTWFuYWdlcyBjcmVhdGlvbiBvZiB7QGxpbmsgQ29sbGlzaW9uQ29tcG9uZW50fXMuXG4gKlxuICogQGF1Z21lbnRzIENvbXBvbmVudFN5c3RlbVxuICovXG5jbGFzcyBDb2xsaXNpb25Db21wb25lbnRTeXN0ZW0gZXh0ZW5kcyBDb21wb25lbnRTeXN0ZW0ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgQ29sbGlzaW9uQ29tcG9uZW50U3lzdGVtIGluc3RhbmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uLy4uL2FwcC1iYXNlLmpzJykuQXBwQmFzZX0gYXBwIC0gVGhlIHJ1bm5pbmcge0BsaW5rIEFwcEJhc2V9LlxuICAgICAqIEBoaWRlY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcbiAgICAgICAgc3VwZXIoYXBwKTtcblxuICAgICAgICB0aGlzLmlkID0gJ2NvbGxpc2lvbic7XG5cbiAgICAgICAgdGhpcy5Db21wb25lbnRUeXBlID0gQ29sbGlzaW9uQ29tcG9uZW50O1xuICAgICAgICB0aGlzLkRhdGFUeXBlID0gQ29sbGlzaW9uQ29tcG9uZW50RGF0YTtcblxuICAgICAgICB0aGlzLnNjaGVtYSA9IF9zY2hlbWE7XG5cbiAgICAgICAgdGhpcy5pbXBsZW1lbnRhdGlvbnMgPSB7IH07XG5cbiAgICAgICAgdGhpcy5fdHJpTWVzaENhY2hlID0geyB9O1xuXG4gICAgICAgIHRoaXMub24oJ2JlZm9yZXJlbW92ZScsIHRoaXMub25CZWZvcmVSZW1vdmUsIHRoaXMpO1xuICAgICAgICB0aGlzLm9uKCdyZW1vdmUnLCB0aGlzLm9uUmVtb3ZlLCB0aGlzKTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplQ29tcG9uZW50RGF0YShjb21wb25lbnQsIF9kYXRhLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHByb3BlcnRpZXMgPSBbXG4gICAgICAgICAgICAndHlwZScsXG4gICAgICAgICAgICAnaGFsZkV4dGVudHMnLFxuICAgICAgICAgICAgJ3JhZGl1cycsXG4gICAgICAgICAgICAnYXhpcycsXG4gICAgICAgICAgICAnaGVpZ2h0JyxcbiAgICAgICAgICAgICdzaGFwZScsXG4gICAgICAgICAgICAnbW9kZWwnLFxuICAgICAgICAgICAgJ2Fzc2V0JyxcbiAgICAgICAgICAgICdyZW5kZXInLFxuICAgICAgICAgICAgJ3JlbmRlckFzc2V0JyxcbiAgICAgICAgICAgICdlbmFibGVkJyxcbiAgICAgICAgICAgICdsaW5lYXJPZmZzZXQnLFxuICAgICAgICAgICAgJ2FuZ3VsYXJPZmZzZXQnXG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gZHVwbGljYXRlIHRoZSBpbnB1dCBkYXRhIGJlY2F1c2Ugd2UgYXJlIG1vZGlmeWluZyBpdFxuICAgICAgICBjb25zdCBkYXRhID0ge307XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBwcm9wZXJ0aWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IHByb3BlcnRpZXNbaV07XG4gICAgICAgICAgICBkYXRhW3Byb3BlcnR5XSA9IF9kYXRhW3Byb3BlcnR5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFzc2V0IHRha2VzIHByaW9yaXR5IG92ZXIgbW9kZWxcbiAgICAgICAgLy8gYnV0IHRoZXkgYXJlIGJvdGggdHJ5aW5nIHRvIGNoYW5nZSB0aGUgbWVzaFxuICAgICAgICAvLyBzbyByZW1vdmUgb25lIG9mIHRoZW0gdG8gYXZvaWQgY29uZmxpY3RzXG4gICAgICAgIGxldCBpZHg7XG4gICAgICAgIGlmIChfZGF0YS5oYXNPd25Qcm9wZXJ0eSgnYXNzZXQnKSkge1xuICAgICAgICAgICAgaWR4ID0gcHJvcGVydGllcy5pbmRleE9mKCdtb2RlbCcpO1xuICAgICAgICAgICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ID0gcHJvcGVydGllcy5pbmRleE9mKCdyZW5kZXInKTtcbiAgICAgICAgICAgIGlmIChpZHggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChfZGF0YS5oYXNPd25Qcm9wZXJ0eSgnbW9kZWwnKSkge1xuICAgICAgICAgICAgaWR4ID0gcHJvcGVydGllcy5pbmRleE9mKCdhc3NldCcpO1xuICAgICAgICAgICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIGRhdGEudHlwZSA9IGNvbXBvbmVudC5kYXRhLnR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50LmRhdGEudHlwZSA9IGRhdGEudHlwZTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhLmhhbGZFeHRlbnRzKSkge1xuICAgICAgICAgICAgZGF0YS5oYWxmRXh0ZW50cyA9IG5ldyBWZWMzKGRhdGEuaGFsZkV4dGVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YS5saW5lYXJPZmZzZXQpKSB7XG4gICAgICAgICAgICBkYXRhLmxpbmVhck9mZnNldCA9IG5ldyBWZWMzKGRhdGEubGluZWFyT2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEuYW5ndWxhck9mZnNldCkpIHtcbiAgICAgICAgICAgIC8vIEFsbG93IGZvciBldWxlciBhbmdsZXMgdG8gYmUgcGFzc2VkIGFzIGEgMyBsZW5ndGggYXJyYXlcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IGRhdGEuYW5ndWxhck9mZnNldDtcbiAgICAgICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5hbmd1bGFyT2Zmc2V0ID0gbmV3IFF1YXQoKS5zZXRGcm9tRXVsZXJBbmdsZXModmFsdWVzWzBdLCB2YWx1ZXNbMV0sIHZhbHVlc1syXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRhdGEuYW5ndWxhck9mZnNldCA9IG5ldyBRdWF0KGRhdGEuYW5ndWxhck9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbXBsID0gdGhpcy5fY3JlYXRlSW1wbGVtZW50YXRpb24oZGF0YS50eXBlKTtcbiAgICAgICAgaW1wbC5iZWZvcmVJbml0aWFsaXplKGNvbXBvbmVudCwgZGF0YSk7XG5cbiAgICAgICAgc3VwZXIuaW5pdGlhbGl6ZUNvbXBvbmVudERhdGEoY29tcG9uZW50LCBkYXRhLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICBpbXBsLmFmdGVySW5pdGlhbGl6ZShjb21wb25lbnQsIGRhdGEpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZXMgYW4gaW1wbGVtZW50YXRpb24gYmFzZWQgb24gdGhlIGNvbGxpc2lvbiB0eXBlIGFuZCBjYWNoZXMgaXRcbiAgICAvLyBpbiBhbiBpbnRlcm5hbCBpbXBsZW1lbnRhdGlvbnMgc3RydWN0dXJlLCBiZWZvcmUgcmV0dXJuaW5nIGl0LlxuICAgIF9jcmVhdGVJbXBsZW1lbnRhdGlvbih0eXBlKSB7XG4gICAgICAgIGlmICh0aGlzLmltcGxlbWVudGF0aW9uc1t0eXBlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBsZXQgaW1wbDtcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2JveCc6XG4gICAgICAgICAgICAgICAgICAgIGltcGwgPSBuZXcgQ29sbGlzaW9uQm94U3lzdGVtSW1wbCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnc3BoZXJlJzpcbiAgICAgICAgICAgICAgICAgICAgaW1wbCA9IG5ldyBDb2xsaXNpb25TcGhlcmVTeXN0ZW1JbXBsKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdjYXBzdWxlJzpcbiAgICAgICAgICAgICAgICAgICAgaW1wbCA9IG5ldyBDb2xsaXNpb25DYXBzdWxlU3lzdGVtSW1wbCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY3lsaW5kZXInOlxuICAgICAgICAgICAgICAgICAgICBpbXBsID0gbmV3IENvbGxpc2lvbkN5bGluZGVyU3lzdGVtSW1wbCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY29uZSc6XG4gICAgICAgICAgICAgICAgICAgIGltcGwgPSBuZXcgQ29sbGlzaW9uQ29uZVN5c3RlbUltcGwodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ21lc2gnOlxuICAgICAgICAgICAgICAgICAgICBpbXBsID0gbmV3IENvbGxpc2lvbk1lc2hTeXN0ZW1JbXBsKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdjb21wb3VuZCc6XG4gICAgICAgICAgICAgICAgICAgIGltcGwgPSBuZXcgQ29sbGlzaW9uQ29tcG91bmRTeXN0ZW1JbXBsKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBEZWJ1Zy5lcnJvcihgX2NyZWF0ZUltcGxlbWVudGF0aW9uOiBJbnZhbGlkIGNvbGxpc2lvbiBzeXN0ZW0gdHlwZTogJHt0eXBlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5pbXBsZW1lbnRhdGlvbnNbdHlwZV0gPSBpbXBsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaW1wbGVtZW50YXRpb25zW3R5cGVdO1xuICAgIH1cblxuICAgIC8vIEdldHMgYW4gZXhpc3RpbmcgaW1wbGVtZW50YXRpb24gZm9yIHRoZSBzcGVjaWZpZWQgZW50aXR5XG4gICAgX2dldEltcGxlbWVudGF0aW9uKGVudGl0eSkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbXBsZW1lbnRhdGlvbnNbZW50aXR5LmNvbGxpc2lvbi5kYXRhLnR5cGVdO1xuICAgIH1cblxuICAgIGNsb25lQ29tcG9uZW50KGVudGl0eSwgY2xvbmUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEltcGxlbWVudGF0aW9uKGVudGl0eSkuY2xvbmUoZW50aXR5LCBjbG9uZSk7XG4gICAgfVxuXG4gICAgb25CZWZvcmVSZW1vdmUoZW50aXR5LCBjb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5pbXBsZW1lbnRhdGlvbnNbY29tcG9uZW50LmRhdGEudHlwZV0uYmVmb3JlUmVtb3ZlKGVudGl0eSwgY29tcG9uZW50KTtcbiAgICAgICAgY29tcG9uZW50Lm9uQmVmb3JlUmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgb25SZW1vdmUoZW50aXR5LCBkYXRhKSB7XG4gICAgICAgIHRoaXMuaW1wbGVtZW50YXRpb25zW2RhdGEudHlwZV0ucmVtb3ZlKGVudGl0eSwgZGF0YSk7XG4gICAgfVxuXG4gICAgdXBkYXRlQ29tcG91bmRDaGlsZFRyYW5zZm9ybShlbnRpdHkpIHtcbiAgICAgICAgLy8gVE9ET1xuICAgICAgICAvLyB1c2UgdXBkYXRlQ2hpbGRUcmFuc2Zvcm0gb25jZSBpdCBpcyBleHBvc2VkIGluIGFtbW8uanNcblxuICAgICAgICB0aGlzLl9yZW1vdmVDb21wb3VuZENoaWxkKGVudGl0eS5jb2xsaXNpb24uX2NvbXBvdW5kUGFyZW50LCBlbnRpdHkuY29sbGlzaW9uLmRhdGEuc2hhcGUpO1xuXG4gICAgICAgIGlmIChlbnRpdHkuZW5hYmxlZCAmJiBlbnRpdHkuY29sbGlzaW9uLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuX2dldE5vZGVUcmFuc2Zvcm0oZW50aXR5LCBlbnRpdHkuY29sbGlzaW9uLl9jb21wb3VuZFBhcmVudC5lbnRpdHkpO1xuICAgICAgICAgICAgZW50aXR5LmNvbGxpc2lvbi5fY29tcG91bmRQYXJlbnQuc2hhcGUuYWRkQ2hpbGRTaGFwZSh0cmFuc2Zvcm0sIGVudGl0eS5jb2xsaXNpb24uZGF0YS5zaGFwZSk7XG4gICAgICAgICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9yZW1vdmVDb21wb3VuZENoaWxkKGNvbGxpc2lvbiwgc2hhcGUpIHtcbiAgICAgICAgaWYgKGNvbGxpc2lvbi5zaGFwZS5yZW1vdmVDaGlsZFNoYXBlKSB7XG4gICAgICAgICAgICBjb2xsaXNpb24uc2hhcGUucmVtb3ZlQ2hpbGRTaGFwZShzaGFwZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpbmQgPSBjb2xsaXNpb24uX2dldENvbXBvdW5kQ2hpbGRTaGFwZUluZGV4KHNoYXBlKTtcbiAgICAgICAgICAgIGlmIChpbmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb2xsaXNpb24uc2hhcGUucmVtb3ZlQ2hpbGRTaGFwZUJ5SW5kZXgoaW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uVHJhbnNmb3JtQ2hhbmdlZChjb21wb25lbnQsIHBvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUpIHtcbiAgICAgICAgdGhpcy5pbXBsZW1lbnRhdGlvbnNbY29tcG9uZW50LmRhdGEudHlwZV0udXBkYXRlVHJhbnNmb3JtKGNvbXBvbmVudCwgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSk7XG4gICAgfVxuXG4gICAgLy8gRGVzdHJveXMgdGhlIHByZXZpb3VzIGNvbGxpc2lvbiB0eXBlIGFuZCBjcmVhdGVzIGEgbmV3IG9uZSBiYXNlZCBvbiB0aGUgbmV3IHR5cGUgcHJvdmlkZWRcbiAgICBjaGFuZ2VUeXBlKGNvbXBvbmVudCwgcHJldmlvdXNUeXBlLCBuZXdUeXBlKSB7XG4gICAgICAgIHRoaXMuaW1wbGVtZW50YXRpb25zW3ByZXZpb3VzVHlwZV0uYmVmb3JlUmVtb3ZlKGNvbXBvbmVudC5lbnRpdHksIGNvbXBvbmVudCk7XG4gICAgICAgIHRoaXMuaW1wbGVtZW50YXRpb25zW3ByZXZpb3VzVHlwZV0ucmVtb3ZlKGNvbXBvbmVudC5lbnRpdHksIGNvbXBvbmVudC5kYXRhKTtcbiAgICAgICAgdGhpcy5fY3JlYXRlSW1wbGVtZW50YXRpb24obmV3VHlwZSkucmVzZXQoY29tcG9uZW50LCBjb21wb25lbnQuZGF0YSk7XG4gICAgfVxuXG4gICAgLy8gUmVjcmVhdGVzIHJpZ2lkIGJvZGllcyBvciB0cmlnZ2VycyBmb3IgdGhlIHNwZWNpZmllZCBjb21wb25lbnRcbiAgICByZWNyZWF0ZVBoeXNpY2FsU2hhcGVzKGNvbXBvbmVudCkge1xuICAgICAgICB0aGlzLmltcGxlbWVudGF0aW9uc1tjb21wb25lbnQuZGF0YS50eXBlXS5yZWNyZWF0ZVBoeXNpY2FsU2hhcGVzKGNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgX2NhbGN1bGF0ZU5vZGVSZWxhdGl2ZVRyYW5zZm9ybShub2RlLCByZWxhdGl2ZSkge1xuICAgICAgICBpZiAobm9kZSA9PT0gcmVsYXRpdmUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gbm9kZS5nZXRXb3JsZFRyYW5zZm9ybSgpLmdldFNjYWxlKCk7XG4gICAgICAgICAgICBtYXQ0LnNldFNjYWxlKHNjYWxlLngsIHNjYWxlLnksIHNjYWxlLnopO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY2FsY3VsYXRlTm9kZVJlbGF0aXZlVHJhbnNmb3JtKG5vZGUucGFyZW50LCByZWxhdGl2ZSk7XG4gICAgICAgICAgICBtYXQ0Lm11bChub2RlLmdldExvY2FsVHJhbnNmb3JtKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2dldE5vZGVTY2FsaW5nKG5vZGUpIHtcbiAgICAgICAgY29uc3Qgd3RtID0gbm9kZS5nZXRXb3JsZFRyYW5zZm9ybSgpO1xuICAgICAgICBjb25zdCBzY2wgPSB3dG0uZ2V0U2NhbGUoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBBbW1vLmJ0VmVjdG9yMyhzY2wueCwgc2NsLnksIHNjbC56KTtcbiAgICB9XG5cbiAgICBfZ2V0Tm9kZVRyYW5zZm9ybShub2RlLCByZWxhdGl2ZSkge1xuICAgICAgICBsZXQgcG9zLCByb3Q7XG5cbiAgICAgICAgaWYgKHJlbGF0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVOb2RlUmVsYXRpdmVUcmFuc2Zvcm0obm9kZSwgcmVsYXRpdmUpO1xuXG4gICAgICAgICAgICBwb3MgPSB2ZWMzO1xuICAgICAgICAgICAgcm90ID0gcXVhdDtcblxuICAgICAgICAgICAgbWF0NC5nZXRUcmFuc2xhdGlvbihwb3MpO1xuICAgICAgICAgICAgcm90LnNldEZyb21NYXQ0KG1hdDQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcG9zID0gbm9kZS5nZXRQb3NpdGlvbigpO1xuICAgICAgICAgICAgcm90ID0gbm9kZS5nZXRSb3RhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFtbW9RdWF0ID0gbmV3IEFtbW8uYnRRdWF0ZXJuaW9uKCk7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG5cbiAgICAgICAgdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbm9kZS5jb2xsaXNpb247XG5cbiAgICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQuX2hhc09mZnNldCkge1xuICAgICAgICAgICAgY29uc3QgbG8gPSBjb21wb25lbnQuZGF0YS5saW5lYXJPZmZzZXQ7XG4gICAgICAgICAgICBjb25zdCBhbyA9IGNvbXBvbmVudC5kYXRhLmFuZ3VsYXJPZmZzZXQ7XG5cbiAgICAgICAgICAgIHF1YXQuY29weShyb3QpLnRyYW5zZm9ybVZlY3RvcihsbywgdmVjMyk7XG4gICAgICAgICAgICB2ZWMzLmFkZCgocG9zKSk7XG4gICAgICAgICAgICBxdWF0LmNvcHkocm90KS5tdWwoYW8pO1xuXG4gICAgICAgICAgICBvcmlnaW4uc2V0VmFsdWUodmVjMy54LCB2ZWMzLnksIHZlYzMueik7XG4gICAgICAgICAgICBhbW1vUXVhdC5zZXRWYWx1ZShxdWF0LngsIHF1YXQueSwgcXVhdC56LCBxdWF0LncpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3JpZ2luLnNldFZhbHVlKHBvcy54LCBwb3MueSwgcG9zLnopO1xuICAgICAgICAgICAgYW1tb1F1YXQuc2V0VmFsdWUocm90LngsIHJvdC55LCByb3Queiwgcm90LncpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJhbnNmb3JtLnNldFJvdGF0aW9uKGFtbW9RdWF0KTtcbiAgICAgICAgQW1tby5kZXN0cm95KGFtbW9RdWF0KTtcbiAgICAgICAgQW1tby5kZXN0cm95KG9yaWdpbik7XG5cbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybTtcbiAgICB9XG5cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLl90cmlNZXNoQ2FjaGUpIHtcbiAgICAgICAgICAgIEFtbW8uZGVzdHJveSh0aGlzLl90cmlNZXNoQ2FjaGVba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl90cmlNZXNoQ2FjaGUgPSBudWxsO1xuXG4gICAgICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB9XG59XG5cbkNvbXBvbmVudC5fYnVpbGRBY2Nlc3NvcnMoQ29sbGlzaW9uQ29tcG9uZW50LnByb3RvdHlwZSwgX3NjaGVtYSk7XG5cbmV4cG9ydCB7IENvbGxpc2lvbkNvbXBvbmVudFN5c3RlbSB9O1xuIl0sIm5hbWVzIjpbIm1hdDQiLCJNYXQ0IiwidmVjMyIsIlZlYzMiLCJxdWF0IiwiUXVhdCIsInRlbXBHcmFwaE5vZGUiLCJHcmFwaE5vZGUiLCJfc2NoZW1hIiwiQ29sbGlzaW9uU3lzdGVtSW1wbCIsImNvbnN0cnVjdG9yIiwic3lzdGVtIiwiYmVmb3JlSW5pdGlhbGl6ZSIsImNvbXBvbmVudCIsImRhdGEiLCJzaGFwZSIsIm1vZGVsIiwiTW9kZWwiLCJncmFwaCIsImFmdGVySW5pdGlhbGl6ZSIsInJlY3JlYXRlUGh5c2ljYWxTaGFwZXMiLCJpbml0aWFsaXplZCIsInJlc2V0IiwiZW50aXR5IiwiQW1tbyIsInRyaWdnZXIiLCJkZXN0cm95IiwiX2NvbXBvdW5kUGFyZW50IiwiX3JlbW92ZUNvbXBvdW5kQ2hpbGQiLCJyaWdpZGJvZHkiLCJhY3RpdmF0ZSIsImNyZWF0ZVBoeXNpY2FsU2hhcGUiLCJmaXJzdENvbXBvdW5kQ2hpbGQiLCJ0eXBlIiwiZm9yRWFjaCIsIl9hZGRFYWNoRGVzY2VuZGFudCIsImltcGxlbWVudGF0aW9ucyIsImNvbXBvdW5kIiwiX3VwZGF0ZUVhY2hEZXNjZW5kYW50IiwicGFyZW50IiwiY29sbGlzaW9uIiwiZ2V0TnVtQ2hpbGRTaGFwZXMiLCJ1cGRhdGVDb21wb3VuZENoaWxkVHJhbnNmb3JtIiwiZGlzYWJsZVNpbXVsYXRpb24iLCJjcmVhdGVCb2R5IiwiZW5hYmxlZCIsImVuYWJsZVNpbXVsYXRpb24iLCJUcmlnZ2VyIiwiYXBwIiwiaW5pdGlhbGl6ZSIsInVuZGVmaW5lZCIsInVwZGF0ZVRyYW5zZm9ybSIsInBvc2l0aW9uIiwicm90YXRpb24iLCJzY2FsZSIsImJlZm9yZVJlbW92ZSIsIl9kZXN0cm95aW5nIiwicmVtb3ZlIiwiYm9keSIsImNsb25lIiwic3JjIiwic3RvcmUiLCJnZXRHdWlkIiwiaGFsZkV4dGVudHMiLCJ4IiwieSIsInoiLCJsaW5lYXJPZmZzZXQiLCJhbmd1bGFyT2Zmc2V0IiwidyIsInJhZGl1cyIsImF4aXMiLCJoZWlnaHQiLCJhc3NldCIsInJlbmRlckFzc2V0IiwicmVuZGVyIiwiYWRkQ29tcG9uZW50IiwiQ29sbGlzaW9uQm94U3lzdGVtSW1wbCIsImhlIiwiYW1tb0hlIiwiYnRWZWN0b3IzIiwiYnRCb3hTaGFwZSIsIkNvbGxpc2lvblNwaGVyZVN5c3RlbUltcGwiLCJidFNwaGVyZVNoYXBlIiwiQ29sbGlzaW9uQ2Fwc3VsZVN5c3RlbUltcGwiLCJNYXRoIiwibWF4IiwiYnRDYXBzdWxlU2hhcGVYIiwiYnRDYXBzdWxlU2hhcGUiLCJidENhcHN1bGVTaGFwZVoiLCJDb2xsaXNpb25DeWxpbmRlclN5c3RlbUltcGwiLCJidEN5bGluZGVyU2hhcGVYIiwiYnRDeWxpbmRlclNoYXBlIiwiYnRDeWxpbmRlclNoYXBlWiIsIkNvbGxpc2lvbkNvbmVTeXN0ZW1JbXBsIiwiYnRDb25lU2hhcGVYIiwiYnRDb25lU2hhcGUiLCJidENvbmVTaGFwZVoiLCJDb2xsaXNpb25NZXNoU3lzdGVtSW1wbCIsImNyZWF0ZUFtbW9NZXNoIiwibWVzaCIsIm5vZGUiLCJ0cmlNZXNoIiwiX3RyaU1lc2hDYWNoZSIsImlkIiwidmIiLCJ2ZXJ0ZXhCdWZmZXIiLCJmb3JtYXQiLCJnZXRGb3JtYXQiLCJzdHJpZGUiLCJwb3NpdGlvbnMiLCJpIiwiZWxlbWVudHMiLCJsZW5ndGgiLCJlbGVtZW50IiwibmFtZSIsIlNFTUFOVElDX1BPU0lUSU9OIiwiRmxvYXQzMkFycmF5IiwibG9jayIsIm9mZnNldCIsImluZGljZXMiLCJnZXRJbmRpY2VzIiwibnVtVHJpYW5nbGVzIiwicHJpbWl0aXZlIiwiY291bnQiLCJ2MSIsInYyIiwidjMiLCJpMSIsImkyIiwiaTMiLCJiYXNlIiwiYnRUcmlhbmdsZU1lc2giLCJzZXRWYWx1ZSIsImFkZFRyaWFuZ2xlIiwidXNlUXVhbnRpemVkQWFiYkNvbXByZXNzaW9uIiwidHJpTWVzaFNoYXBlIiwiYnRCdmhUcmlhbmdsZU1lc2hTaGFwZSIsInNjYWxpbmciLCJfZ2V0Tm9kZVNjYWxpbmciLCJzZXRMb2NhbFNjYWxpbmciLCJ0cmFuc2Zvcm0iLCJfZ2V0Tm9kZVRyYW5zZm9ybSIsImFkZENoaWxkU2hhcGUiLCJidENvbXBvdW5kU2hhcGUiLCJtZXNoSW5zdGFuY2VzIiwibWVzaGVzIiwiZW50aXR5VHJhbnNmb3JtIiwiZ2V0V29ybGRUcmFuc2Zvcm0iLCJnZXRTY2FsZSIsInZlYyIsImxvYWRBc3NldCIsImRvUmVjcmVhdGVQaHlzaWNhbFNoYXBlIiwicHJvcGVydHkiLCJhc3NldHMiLCJnZXQiLCJyZWFkeSIsInJlc291cmNlIiwibG9hZCIsIm9uY2UiLCJkZXN0cm95U2hhcGUiLCJ3b3JsZFNjYWxlIiwicHJldmlvdXNTY2FsZSIsImdldExvY2FsU2NhbGluZyIsIm51bVNoYXBlcyIsImdldENoaWxkU2hhcGUiLCJDb2xsaXNpb25Db21wb3VuZFN5c3RlbUltcGwiLCJfdXBkYXRlRWFjaERlc2NlbmRhbnRUcmFuc2Zvcm0iLCJDb2xsaXNpb25Db21wb25lbnRTeXN0ZW0iLCJDb21wb25lbnRTeXN0ZW0iLCJDb21wb25lbnRUeXBlIiwiQ29sbGlzaW9uQ29tcG9uZW50IiwiRGF0YVR5cGUiLCJDb2xsaXNpb25Db21wb25lbnREYXRhIiwic2NoZW1hIiwib24iLCJvbkJlZm9yZVJlbW92ZSIsIm9uUmVtb3ZlIiwiaW5pdGlhbGl6ZUNvbXBvbmVudERhdGEiLCJfZGF0YSIsInByb3BlcnRpZXMiLCJsZW4iLCJpZHgiLCJoYXNPd25Qcm9wZXJ0eSIsImluZGV4T2YiLCJzcGxpY2UiLCJBcnJheSIsImlzQXJyYXkiLCJ2YWx1ZXMiLCJzZXRGcm9tRXVsZXJBbmdsZXMiLCJpbXBsIiwiX2NyZWF0ZUltcGxlbWVudGF0aW9uIiwiRGVidWciLCJlcnJvciIsIl9nZXRJbXBsZW1lbnRhdGlvbiIsImNsb25lQ29tcG9uZW50IiwicmVtb3ZlQ2hpbGRTaGFwZSIsImluZCIsIl9nZXRDb21wb3VuZENoaWxkU2hhcGVJbmRleCIsInJlbW92ZUNoaWxkU2hhcGVCeUluZGV4Iiwib25UcmFuc2Zvcm1DaGFuZ2VkIiwiY2hhbmdlVHlwZSIsInByZXZpb3VzVHlwZSIsIm5ld1R5cGUiLCJfY2FsY3VsYXRlTm9kZVJlbGF0aXZlVHJhbnNmb3JtIiwicmVsYXRpdmUiLCJzZXRTY2FsZSIsIm11bCIsImdldExvY2FsVHJhbnNmb3JtIiwid3RtIiwic2NsIiwicG9zIiwicm90IiwiZ2V0VHJhbnNsYXRpb24iLCJzZXRGcm9tTWF0NCIsImdldFBvc2l0aW9uIiwiZ2V0Um90YXRpb24iLCJhbW1vUXVhdCIsImJ0UXVhdGVybmlvbiIsImJ0VHJhbnNmb3JtIiwic2V0SWRlbnRpdHkiLCJvcmlnaW4iLCJnZXRPcmlnaW4iLCJfaGFzT2Zmc2V0IiwibG8iLCJhbyIsImNvcHkiLCJ0cmFuc2Zvcm1WZWN0b3IiLCJhZGQiLCJzZXRSb3RhdGlvbiIsImtleSIsIkNvbXBvbmVudCIsIl9idWlsZEFjY2Vzc29ycyIsInByb3RvdHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLE1BQU1BLElBQUksR0FBRyxJQUFJQyxJQUFJLEVBQUUsQ0FBQTtBQUN2QixNQUFNQyxJQUFJLEdBQUcsSUFB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
