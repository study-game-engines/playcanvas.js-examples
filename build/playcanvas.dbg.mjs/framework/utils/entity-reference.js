/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Component } from '../components/component.js';
import { Entity } from '../entity.js';
import { EventHandler } from '../../core/event-handler.js';

/**
 * An EntityReference can be used in scenarios where a component has one or more properties that
 * refer to entities in the scene graph. Using an EntityReference simplifies the job of dealing
 * with the presence or non-presence of the underlying entity and its components, especially when
 * it comes to dealing with the runtime addition or removal of components, and addition/removal of
 * associated event listeners.
 *
 * ## Usage Scenario ##
 *
 * Imagine that you're creating a Checkbox component, which has a reference to an entity
 * representing the checkmark/tickmark that is rendered in the Checkbox. The reference is modeled
 * as an entity guid property on the Checkbox component, called simply 'checkmark'. We have to
 * implement a basic piece of functionality whereby when the 'checkmark' entity reference is set,
 * the Checkbox component must toggle the tint of an ImageElementComponent present on the checkmark
 * entity to indicate whether the Checkbox is currently in the active or inactive state.
 *
 * Without using an EntityReference, the Checkbox component must implement some or all of the
 * following:
 *
 * - Listen for its 'checkmark' property being set to a valid guid, and retrieve a reference to the
 *   entity associated with this guid whenever it changes (i.e. via `app.root.findByGuid()`).
 * - Once a valid entity is received, check to see whether it has already has an
 *   ImageElementComponent or not:
 *   - If it has one, proceed to set the tint of the ImageElementComponent based on whether the
 *     Checkbox is currently active or inactive.
 *   - If it doesn't have one, add a listener to wait for the addition of an ImageElementComponent,
 *     and then apply the tint once one becomes present.
 * - If the checkmark entity is then reassigned (such as if the user reassigns the field in the
 *   editor, or if this is done at runtime via a script), a well-behaved Checkbox component must
 *   also undo the tinting so that no lasting effect is applied to the old entity.
 * - If the checkmark entity's ImageElementComponent is removed and then another
 *   ImageElementComponent is added, the Checkbox component must handle this in order to re-apply
 *   the tint.
 * - To prevent memory leaks, the Checkbox component must also make sure to correctly remove
 *   listeners in each of the following scenarios:
 *   - Destruction of the Checkbox component.
 *   - Reassignment of the checkmark entity.
 *   - Removal of the ImageElementComponent.
 * - It must also be careful not to double-add listeners in any of the above code paths, to avoid
 *   various forms of undesirable behavior.
 *
 * If the Checkbox component becomes more complicated and has multiple entity reference properties,
 * all of the above must be done correctly for each entity. Similarly, if it depends on multiple
 * different component types being present on the entities it has references to, it must correctly
 * handle the presence and non-presence of each of these components in the various possible
 * sequences of addition and removal. In addition to generating a lot of boilerplate, it's also
 * very easy for subtle mistakes to be made that lead to memory leaks, null reference errors or
 * visual bugs.
 *
 * By using an EntityReference, all of the above can be reduced to the following:
 *
 * ```javascript
 * function CheckboxComponent() {
 *    this._checkmarkReference = new pc.EntityReference(this, 'checkmark', {
 *        'element#gain': this._onCheckmarkImageElementGain,
 *        'element#lose': this._onCheckmarkImageElementLose
 *    });
 * }
 * ```
 *
 * Using the above code snippet, the `_onCheckmarkImageElementGain()` listener will be called
 * in either of the following scenarios:
 *
 * 1. A checkmark entity is assigned and already has an ElementComponent.
 * 2. A checkmark entity is assigned that does not have an ElementComponent, but one is added
 * later.
 *
 * Similarly, the `_onCheckmarkImageElementLose()` listener will be called in either of the
 * following scenarios:
 *
 * 1. An ElementComponent is removed from the checkmark entity.
 * 2. The checkmark entity is re-assigned (i.e. to another entity), or nullified. In this
 * scenario the callback will only be called if the entity actually had an ElementComponent.
 *
 * ## Event String Format ##
 *
 * The event string (i.e. "element#gain" in the above examples) is of the format
 * `sourceName#eventName`, and is defined as follows:
 *
 * - `sourceName`: May be any component name, or the special string "entity", which refers to the
 * entity itself.
 * - `eventName`: May be the name of any event dispatched by the relevant component or entity, as
 * well as the special strings "gain" or "lose".
 *
 * Some examples are as follows:
 *
 * ```javascript
 * "entity#destroy"    // Called when the entity managed by the entity reference is destroyed.
 * "element#set:width" // Called when the width of an ElementComponent is set.
 * ```
 *
 * When the entity reference changes to another entity (or null) the set:entity event is fired.
 *
 * ## Ownership and Destruction ##
 *
 * The lifetime of an ElementReference is tied to the parent component that instantiated it. This
 * coupling is indicated by the provision of the `this` keyword to the ElementReference's
 * constructor in the above examples (i.e. `new pc.EntityReference(this, ...`).
 *
 * Any event listeners managed by the ElementReference are automatically cleaned up when the parent
 * component is removed or the parent component's entity is destroyed – as such you should never
 * have to worry about dangling listeners.
 *
 * Additionally, any callbacks listed in the event config will automatically be called in the scope
 * of the parent component – you should never have to worry about manually calling
 * `Function.bind()`.
 *
 * @augments EventHandler
 * @ignore
 */
class EntityReference extends EventHandler {
  /**
   * Helper class used for managing component properties that represent entity references.
   *
   * @param {Component} parentComponent - A reference to the parent component that owns this
   * entity reference.
   * @param {string} entityPropertyName - The name of the component property that contains the
   * entity guid.
   * @param {Object<string, Function>} [eventConfig] - A map of event listener configurations.
   */
  constructor(parentComponent, entityPropertyName, eventConfig) {
    super();
    if (!parentComponent || !(parentComponent instanceof Component)) {
      throw new Error('The parentComponent argument is required and must be a Component');
    } else if (!entityPropertyName || typeof entityPropertyName !== 'string') {
      throw new Error('The propertyName argument is required and must be a string');
    } else if (eventConfig && typeof eventConfig !== 'object') {
      throw new Error('If provided, the eventConfig argument must be an object');
    }
    this._parentComponent = parentComponent;
    this._entityPropertyName = entityPropertyName;
    this._entity = null;
    this._app = parentComponent.system.app;
    this._configureEventListeners(eventConfig || {}, {
      'entity#destroy': this._onEntityDestroy
    });
    this._toggleLifecycleListeners('on');
  }
  _configureEventListeners(externalEventConfig, internalEventConfig) {
    const externalEventListenerConfigs = this._parseEventListenerConfig(externalEventConfig, 'external', this._parentComponent);
    const internalEventListenerConfigs = this._parseEventListenerConfig(internalEventConfig, 'internal', this);
    this._eventListenerConfigs = externalEventListenerConfigs.concat(internalEventListenerConfigs);
    this._listenerStatusFlags = {};
    this._gainListeners = {};
    this._loseListeners = {};
  }
  _parseEventListenerConfig(eventConfig, prefix, scope) {
    return Object.keys(eventConfig).map(function (listenerDescription, index) {
      const listenerDescriptionParts = listenerDescription.split('#');
      const sourceName = listenerDescriptionParts[0];
      const eventName = listenerDescriptionParts[1];
      const callback = eventConfig[listenerDescription];
      if (listenerDescriptionParts.length !== 2 || typeof sourceName !== 'string' || sourceName.length === 0 || typeof eventName !== 'string' || eventName.length === 0) {
        throw new Error('Invalid event listener description: `' + listenerDescription + '`');
      }
      if (typeof callback !== 'function') {
        throw new Error('Invalid or missing callback for event listener `' + listenerDescription + '`');
      }
      return {
        id: prefix + '_' + index + '_' + listenerDescription,
        sourceName: sourceName,
        eventName: eventName,
        callback: callback,
        scope: scope
      };
    }, this);
  }
  _toggleLifecycleListeners(onOrOff) {
    this._parentComponent[onOrOff]('set_' + this._entityPropertyName, this._onSetEntity, this);
    this._parentComponent.system[onOrOff]('beforeremove', this._onParentComponentRemove, this);
    this._app.systems[onOrOff]('postPostInitialize', this._updateEntityReference, this);
    this._app[onOrOff]('tools:sceneloaded', this._onSceneLoaded, this);

    // For any event listeners that relate to the gain/loss of a component, register
    // listeners that will forward the add/remove component events
    const allComponentSystems = [];
    for (let i = 0; i < this._eventListenerConfigs.length; ++i) {
      const config = this._eventListenerConfigs[i];
      const componentSystem = this._app.systems[config.sourceName];
      if (componentSystem) {
        if (allComponentSystems.indexOf(componentSystem) === -1) {
          allComponentSystems.push(componentSystem);
        }
        if (componentSystem && config.eventName === 'gain') {
          this._gainListeners[config.sourceName] = config;
        }
        if (componentSystem && config.eventName === 'lose') {
          this._loseListeners[config.sourceName] = config;
        }
      }
    }
    for (let i = 0; i < allComponentSystems.length; ++i) {
      allComponentSystems[i][onOrOff]('add', this._onComponentAdd, this);
      allComponentSystems[i][onOrOff]('beforeremove', this._onComponentRemove, this);
    }
  }
  _onSetEntity(name, oldValue, newValue) {
    if (newValue instanceof Entity) {
      this._updateEntityReference();
    } else {
      if (newValue !== null && newValue !== undefined && typeof newValue !== 'string') {
        console.warn("Entity field `" + this._entityPropertyName + "` was set to unexpected type '" + typeof newValue + "'");
        return;
      }
      if (oldValue !== newValue) {
        this._updateEntityReference();
      }
    }
  }

  /**
   * Must be called from the parent component's onEnable() method in order for entity references
   * to be correctly resolved when {@link Entity#clone} is called.
   *
   * @private
   */
  onParentComponentEnable() {
    // When an entity is cloned via the JS API, we won't be able to resolve the
    // entity reference until the cloned entity has been added to the scene graph.
    // We can detect this by waiting for the parent component to be enabled, in the
    // specific case where we haven't yet been able to resolve an entity reference.
    if (!this._entity) {
      this._updateEntityReference();
    }
  }

  // When running within the editor, postInitialize is fired before the scene graph
  // has been fully constructed. As such we use the special tools:sceneloaded event
  // in order to know when the graph is ready to traverse.
  _onSceneLoaded() {
    this._updateEntityReference();
  }
  _updateEntityReference() {
    let nextEntityGuid = this._parentComponent.data[this._entityPropertyName];
    let nextEntity;
    if (nextEntityGuid instanceof Entity) {
      // if value is set to a Entity itself replace value with the GUID
      nextEntity = nextEntityGuid;
      nextEntityGuid = nextEntity.getGuid();
      this._parentComponent.data[this._entityPropertyName] = nextEntityGuid;
    } else {
      const root = this._parentComponent.system.app.root;
      const isOnSceneGraph = this._parentComponent.entity.isDescendantOf(root);
      nextEntity = isOnSceneGraph && nextEntityGuid ? root.findByGuid(nextEntityGuid) : null;
    }
    const hasChanged = this._entity !== nextEntity;
    if (hasChanged) {
      if (this._entity) {
        this._onBeforeEntityChange();
      }
      this._entity = nextEntity;
      if (this._entity) {
        this._onAfterEntityChange();
      }
      this.fire('set:entity', this._entity);
    }
  }
  _onBeforeEntityChange() {
    this._toggleEntityListeners('off');
    this._callAllGainOrLoseListeners(this._loseListeners);
  }
  _onAfterEntityChange() {
    this._toggleEntityListeners('on');
    this._callAllGainOrLoseListeners(this._gainListeners);
  }
  _onComponentAdd(entity, component) {
    const componentName = component.system.id;
    if (entity === this._entity) {
      this._callGainOrLoseListener(componentName, this._gainListeners);
      this._toggleComponentListeners('on', componentName);
    }
  }
  _onComponentRemove(entity, component) {
    const componentName = component.system.id;
    if (entity === this._entity) {
      this._callGainOrLoseListener(componentName, this._loseListeners);
      this._toggleComponentListeners('off', componentName, true);
    }
  }
  _callAllGainOrLoseListeners(listenerMap) {
    for (const componentName in this._entity.c) {
      this._callGainOrLoseListener(componentName, listenerMap);
    }
  }
  _callGainOrLoseListener(componentName, listenerMap) {
    if (this._entity.c.hasOwnProperty(componentName) && listenerMap[componentName]) {
      const config = listenerMap[componentName];
      config.callback.call(config.scope);
    }
  }
  _toggleEntityListeners(onOrOff, isDestroying) {
    if (this._entity) {
      for (let i = 0; i < this._eventListenerConfigs.length; ++i) {
        this._safeToggleListener(onOrOff, this._eventListenerConfigs[i], isDestroying);
      }
    }
  }
  _toggleComponentListeners(onOrOff, componentName, isDestroying) {
    for (let i = 0; i < this._eventListenerConfigs.length; ++i) {
      const config = this._eventListenerConfigs[i];
      if (config.sourceName === componentName) {
        this._safeToggleListener(onOrOff, config, isDestroying);
      }
    }
  }
  _safeToggleListener(onOrOff, config, isDestroying) {
    const isAdding = onOrOff === 'on';

    // Prevent duplicate listeners
    if (isAdding && this._listenerStatusFlags[config.id]) {
      return;
    }
    const source = this._getEventSource(config.sourceName, isDestroying);
    if (source) {
      source[onOrOff](config.eventName, config.callback, config.scope);
      this._listenerStatusFlags[config.id] = isAdding;
    }
  }
  _getEventSource(sourceName, isDestroying) {
    // The 'entity' source name is a special case - we just want to return
    // a reference to the entity itself. For all other cases the source name
    // should refer to a component.
    if (sourceName === 'entity') {
      return this._entity;
    }
    const component = this._entity[sourceName];
    if (component) {
      return component;
    }
    if (!isDestroying) {
      console.warn('Entity has no component with name ' + sourceName);
    }
    return null;
  }
  _onEntityDestroy(entity) {
    if (this._entity === entity) {
      this._toggleEntityListeners('off', true);
      this._entity = null;
    }
  }
  _onParentComponentRemove(entity, component) {
    if (component === this._parentComponent) {
      this._toggleLifecycleListeners('off');
      this._toggleEntityListeners('off', true);
    }
  }

  /**
   * Convenience method indicating whether the entity exists and has a component of the provided
   * type.
   *
   * @param {string} componentName - Name of the component.
   * @returns {boolean} True if the entity exists and has a component of the provided type.
   */
  hasComponent(componentName) {
    return this._entity && this._entity.c ? !!this._entity.c[componentName] : false;
  }

  /**
   * A reference to the entity, if present.
   *
   * @type {Entity}
   */
  get entity() {
    return this._entity;
  }
}

export { EntityReference };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50aXR5LXJlZmVyZW5jZS5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2ZyYW1ld29yay91dGlscy9lbnRpdHktcmVmZXJlbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvY29tcG9uZW50LmpzJztcbmltcG9ydCB7IEVudGl0eSB9IGZyb20gJy4uL2VudGl0eS5qcyc7XG5cbmltcG9ydCB7IEV2ZW50SGFuZGxlciB9IGZyb20gJy4uLy4uL2NvcmUvZXZlbnQtaGFuZGxlci5qcyc7XG5cbi8qKlxuICogQW4gRW50aXR5UmVmZXJlbmNlIGNhbiBiZSB1c2VkIGluIHNjZW5hcmlvcyB3aGVyZSBhIGNvbXBvbmVudCBoYXMgb25lIG9yIG1vcmUgcHJvcGVydGllcyB0aGF0XG4gKiByZWZlciB0byBlbnRpdGllcyBpbiB0aGUgc2NlbmUgZ3JhcGguIFVzaW5nIGFuIEVudGl0eVJlZmVyZW5jZSBzaW1wbGlmaWVzIHRoZSBqb2Igb2YgZGVhbGluZ1xuICogd2l0aCB0aGUgcHJlc2VuY2Ugb3Igbm9uLXByZXNlbmNlIG9mIHRoZSB1bmRlcmx5aW5nIGVudGl0eSBhbmQgaXRzIGNvbXBvbmVudHMsIGVzcGVjaWFsbHkgd2hlblxuICogaXQgY29tZXMgdG8gZGVhbGluZyB3aXRoIHRoZSBydW50aW1lIGFkZGl0aW9uIG9yIHJlbW92YWwgb2YgY29tcG9uZW50cywgYW5kIGFkZGl0aW9uL3JlbW92YWwgb2ZcbiAqIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqICMjIFVzYWdlIFNjZW5hcmlvICMjXG4gKlxuICogSW1hZ2luZSB0aGF0IHlvdSdyZSBjcmVhdGluZyBhIENoZWNrYm94IGNvbXBvbmVudCwgd2hpY2ggaGFzIGEgcmVmZXJlbmNlIHRvIGFuIGVudGl0eVxuICogcmVwcmVzZW50aW5nIHRoZSBjaGVja21hcmsvdGlja21hcmsgdGhhdCBpcyByZW5kZXJlZCBpbiB0aGUgQ2hlY2tib3guIFRoZSByZWZlcmVuY2UgaXMgbW9kZWxlZFxuICogYXMgYW4gZW50aXR5IGd1aWQgcHJvcGVydHkgb24gdGhlIENoZWNrYm94IGNvbXBvbmVudCwgY2FsbGVkIHNpbXBseSAnY2hlY2ttYXJrJy4gV2UgaGF2ZSB0b1xuICogaW1wbGVtZW50IGEgYmFzaWMgcGllY2Ugb2YgZnVuY3Rpb25hbGl0eSB3aGVyZWJ5IHdoZW4gdGhlICdjaGVja21hcmsnIGVudGl0eSByZWZlcmVuY2UgaXMgc2V0LFxuICogdGhlIENoZWNrYm94IGNvbXBvbmVudCBtdXN0IHRvZ2dsZSB0aGUgdGludCBvZiBhbiBJbWFnZUVsZW1lbnRDb21wb25lbnQgcHJlc2VudCBvbiB0aGUgY2hlY2ttYXJrXG4gKiBlbnRpdHkgdG8gaW5kaWNhdGUgd2hldGhlciB0aGUgQ2hlY2tib3ggaXMgY3VycmVudGx5IGluIHRoZSBhY3RpdmUgb3IgaW5hY3RpdmUgc3RhdGUuXG4gKlxuICogV2l0aG91dCB1c2luZyBhbiBFbnRpdHlSZWZlcmVuY2UsIHRoZSBDaGVja2JveCBjb21wb25lbnQgbXVzdCBpbXBsZW1lbnQgc29tZSBvciBhbGwgb2YgdGhlXG4gKiBmb2xsb3dpbmc6XG4gKlxuICogLSBMaXN0ZW4gZm9yIGl0cyAnY2hlY2ttYXJrJyBwcm9wZXJ0eSBiZWluZyBzZXQgdG8gYSB2YWxpZCBndWlkLCBhbmQgcmV0cmlldmUgYSByZWZlcmVuY2UgdG8gdGhlXG4gKiAgIGVudGl0eSBhc3NvY2lhdGVkIHdpdGggdGhpcyBndWlkIHdoZW5ldmVyIGl0IGNoYW5nZXMgKGkuZS4gdmlhIGBhcHAucm9vdC5maW5kQnlHdWlkKClgKS5cbiAqIC0gT25jZSBhIHZhbGlkIGVudGl0eSBpcyByZWNlaXZlZCwgY2hlY2sgdG8gc2VlIHdoZXRoZXIgaXQgaGFzIGFscmVhZHkgaGFzIGFuXG4gKiAgIEltYWdlRWxlbWVudENvbXBvbmVudCBvciBub3Q6XG4gKiAgIC0gSWYgaXQgaGFzIG9uZSwgcHJvY2VlZCB0byBzZXQgdGhlIHRpbnQgb2YgdGhlIEltYWdlRWxlbWVudENvbXBvbmVudCBiYXNlZCBvbiB3aGV0aGVyIHRoZVxuICogICAgIENoZWNrYm94IGlzIGN1cnJlbnRseSBhY3RpdmUgb3IgaW5hY3RpdmUuXG4gKiAgIC0gSWYgaXQgZG9lc24ndCBoYXZlIG9uZSwgYWRkIGEgbGlzdGVuZXIgdG8gd2FpdCBmb3IgdGhlIGFkZGl0aW9uIG9mIGFuIEltYWdlRWxlbWVudENvbXBvbmVudCxcbiAqICAgICBhbmQgdGhlbiBhcHBseSB0aGUgdGludCBvbmNlIG9uZSBiZWNvbWVzIHByZXNlbnQuXG4gKiAtIElmIHRoZSBjaGVja21hcmsgZW50aXR5IGlzIHRoZW4gcmVhc3NpZ25lZCAoc3VjaCBhcyBpZiB0aGUgdXNlciByZWFzc2lnbnMgdGhlIGZpZWxkIGluIHRoZVxuICogICBlZGl0b3IsIG9yIGlmIHRoaXMgaXMgZG9uZSBhdCBydW50aW1lIHZpYSBhIHNjcmlwdCksIGEgd2VsbC1iZWhhdmVkIENoZWNrYm94IGNvbXBvbmVudCBtdXN0XG4gKiAgIGFsc28gdW5kbyB0aGUgdGludGluZyBzbyB0aGF0IG5vIGxhc3RpbmcgZWZmZWN0IGlzIGFwcGxpZWQgdG8gdGhlIG9sZCBlbnRpdHkuXG4gKiAtIElmIHRoZSBjaGVja21hcmsgZW50aXR5J3MgSW1hZ2VFbGVtZW50Q29tcG9uZW50IGlzIHJlbW92ZWQgYW5kIHRoZW4gYW5vdGhlclxuICogICBJbWFnZUVsZW1lbnRDb21wb25lbnQgaXMgYWRkZWQsIHRoZSBDaGVja2JveCBjb21wb25lbnQgbXVzdCBoYW5kbGUgdGhpcyBpbiBvcmRlciB0byByZS1hcHBseVxuICogICB0aGUgdGludC5cbiAqIC0gVG8gcHJldmVudCBtZW1vcnkgbGVha3MsIHRoZSBDaGVja2JveCBjb21wb25lbnQgbXVzdCBhbHNvIG1ha2Ugc3VyZSB0byBjb3JyZWN0bHkgcmVtb3ZlXG4gKiAgIGxpc3RlbmVycyBpbiBlYWNoIG9mIHRoZSBmb2xsb3dpbmcgc2NlbmFyaW9zOlxuICogICAtIERlc3RydWN0aW9uIG9mIHRoZSBDaGVja2JveCBjb21wb25lbnQuXG4gKiAgIC0gUmVhc3NpZ25tZW50IG9mIHRoZSBjaGVja21hcmsgZW50aXR5LlxuICogICAtIFJlbW92YWwgb2YgdGhlIEltYWdlRWxlbWVudENvbXBvbmVudC5cbiAqIC0gSXQgbXVzdCBhbHNvIGJlIGNhcmVmdWwgbm90IHRvIGRvdWJsZS1hZGQgbGlzdGVuZXJzIGluIGFueSBvZiB0aGUgYWJvdmUgY29kZSBwYXRocywgdG8gYXZvaWRcbiAqICAgdmFyaW91cyBmb3JtcyBvZiB1bmRlc2lyYWJsZSBiZWhhdmlvci5cbiAqXG4gKiBJZiB0aGUgQ2hlY2tib3ggY29tcG9uZW50IGJlY29tZXMgbW9yZSBjb21wbGljYXRlZCBhbmQgaGFzIG11bHRpcGxlIGVudGl0eSByZWZlcmVuY2UgcHJvcGVydGllcyxcbiAqIGFsbCBvZiB0aGUgYWJvdmUgbXVzdCBiZSBkb25lIGNvcnJlY3RseSBmb3IgZWFjaCBlbnRpdHkuIFNpbWlsYXJseSwgaWYgaXQgZGVwZW5kcyBvbiBtdWx0aXBsZVxuICogZGlmZmVyZW50IGNvbXBvbmVudCB0eXBlcyBiZWluZyBwcmVzZW50IG9uIHRoZSBlbnRpdGllcyBpdCBoYXMgcmVmZXJlbmNlcyB0bywgaXQgbXVzdCBjb3JyZWN0bHlcbiAqIGhhbmRsZSB0aGUgcHJlc2VuY2UgYW5kIG5vbi1wcmVzZW5jZSBvZiBlYWNoIG9mIHRoZXNlIGNvbXBvbmVudHMgaW4gdGhlIHZhcmlvdXMgcG9zc2libGVcbiAqIHNlcXVlbmNlcyBvZiBhZGRpdGlvbiBhbmQgcmVtb3ZhbC4gSW4gYWRkaXRpb24gdG8gZ2VuZXJhdGluZyBhIGxvdCBvZiBib2lsZXJwbGF0ZSwgaXQncyBhbHNvXG4gKiB2ZXJ5IGVhc3kgZm9yIHN1YnRsZSBtaXN0YWtlcyB0byBiZSBtYWRlIHRoYXQgbGVhZCB0byBtZW1vcnkgbGVha3MsIG51bGwgcmVmZXJlbmNlIGVycm9ycyBvclxuICogdmlzdWFsIGJ1Z3MuXG4gKlxuICogQnkgdXNpbmcgYW4gRW50aXR5UmVmZXJlbmNlLCBhbGwgb2YgdGhlIGFib3ZlIGNhbiBiZSByZWR1Y2VkIHRvIHRoZSBmb2xsb3dpbmc6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogZnVuY3Rpb24gQ2hlY2tib3hDb21wb25lbnQoKSB7XG4gKiAgICB0aGlzLl9jaGVja21hcmtSZWZlcmVuY2UgPSBuZXcgcGMuRW50aXR5UmVmZXJlbmNlKHRoaXMsICdjaGVja21hcmsnLCB7XG4gKiAgICAgICAgJ2VsZW1lbnQjZ2Fpbic6IHRoaXMuX29uQ2hlY2ttYXJrSW1hZ2VFbGVtZW50R2FpbixcbiAqICAgICAgICAnZWxlbWVudCNsb3NlJzogdGhpcy5fb25DaGVja21hcmtJbWFnZUVsZW1lbnRMb3NlXG4gKiAgICB9KTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIFVzaW5nIHRoZSBhYm92ZSBjb2RlIHNuaXBwZXQsIHRoZSBgX29uQ2hlY2ttYXJrSW1hZ2VFbGVtZW50R2FpbigpYCBsaXN0ZW5lciB3aWxsIGJlIGNhbGxlZFxuICogaW4gZWl0aGVyIG9mIHRoZSBmb2xsb3dpbmcgc2NlbmFyaW9zOlxuICpcbiAqIDEuIEEgY2hlY2ttYXJrIGVudGl0eSBpcyBhc3NpZ25lZCBhbmQgYWxyZWFkeSBoYXMgYW4gRWxlbWVudENvbXBvbmVudC5cbiAqIDIuIEEgY2hlY2ttYXJrIGVudGl0eSBpcyBhc3NpZ25lZCB0aGF0IGRvZXMgbm90IGhhdmUgYW4gRWxlbWVudENvbXBvbmVudCwgYnV0IG9uZSBpcyBhZGRlZFxuICogbGF0ZXIuXG4gKlxuICogU2ltaWxhcmx5LCB0aGUgYF9vbkNoZWNrbWFya0ltYWdlRWxlbWVudExvc2UoKWAgbGlzdGVuZXIgd2lsbCBiZSBjYWxsZWQgaW4gZWl0aGVyIG9mIHRoZVxuICogZm9sbG93aW5nIHNjZW5hcmlvczpcbiAqXG4gKiAxLiBBbiBFbGVtZW50Q29tcG9uZW50IGlzIHJlbW92ZWQgZnJvbSB0aGUgY2hlY2ttYXJrIGVudGl0eS5cbiAqIDIuIFRoZSBjaGVja21hcmsgZW50aXR5IGlzIHJlLWFzc2lnbmVkIChpLmUuIHRvIGFub3RoZXIgZW50aXR5KSwgb3IgbnVsbGlmaWVkLiBJbiB0aGlzXG4gKiBzY2VuYXJpbyB0aGUgY2FsbGJhY2sgd2lsbCBvbmx5IGJlIGNhbGxlZCBpZiB0aGUgZW50aXR5IGFjdHVhbGx5IGhhZCBhbiBFbGVtZW50Q29tcG9uZW50LlxuICpcbiAqICMjIEV2ZW50IFN0cmluZyBGb3JtYXQgIyNcbiAqXG4gKiBUaGUgZXZlbnQgc3RyaW5nIChpLmUuIFwiZWxlbWVudCNnYWluXCIgaW4gdGhlIGFib3ZlIGV4YW1wbGVzKSBpcyBvZiB0aGUgZm9ybWF0XG4gKiBgc291cmNlTmFtZSNldmVudE5hbWVgLCBhbmQgaXMgZGVmaW5lZCBhcyBmb2xsb3dzOlxuICpcbiAqIC0gYHNvdXJjZU5hbWVgOiBNYXkgYmUgYW55IGNvbXBvbmVudCBuYW1lLCBvciB0aGUgc3BlY2lhbCBzdHJpbmcgXCJlbnRpdHlcIiwgd2hpY2ggcmVmZXJzIHRvIHRoZVxuICogZW50aXR5IGl0c2VsZi5cbiAqIC0gYGV2ZW50TmFtZWA6IE1heSBiZSB0aGUgbmFtZSBvZiBhbnkgZXZlbnQgZGlzcGF0Y2hlZCBieSB0aGUgcmVsZXZhbnQgY29tcG9uZW50IG9yIGVudGl0eSwgYXNcbiAqIHdlbGwgYXMgdGhlIHNwZWNpYWwgc3RyaW5ncyBcImdhaW5cIiBvciBcImxvc2VcIi5cbiAqXG4gKiBTb21lIGV4YW1wbGVzIGFyZSBhcyBmb2xsb3dzOlxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIFwiZW50aXR5I2Rlc3Ryb3lcIiAgICAvLyBDYWxsZWQgd2hlbiB0aGUgZW50aXR5IG1hbmFnZWQgYnkgdGhlIGVudGl0eSByZWZlcmVuY2UgaXMgZGVzdHJveWVkLlxuICogXCJlbGVtZW50I3NldDp3aWR0aFwiIC8vIENhbGxlZCB3aGVuIHRoZSB3aWR0aCBvZiBhbiBFbGVtZW50Q29tcG9uZW50IGlzIHNldC5cbiAqIGBgYFxuICpcbiAqIFdoZW4gdGhlIGVudGl0eSByZWZlcmVuY2UgY2hhbmdlcyB0byBhbm90aGVyIGVudGl0eSAob3IgbnVsbCkgdGhlIHNldDplbnRpdHkgZXZlbnQgaXMgZmlyZWQuXG4gKlxuICogIyMgT3duZXJzaGlwIGFuZCBEZXN0cnVjdGlvbiAjI1xuICpcbiAqIFRoZSBsaWZldGltZSBvZiBhbiBFbGVtZW50UmVmZXJlbmNlIGlzIHRpZWQgdG8gdGhlIHBhcmVudCBjb21wb25lbnQgdGhhdCBpbnN0YW50aWF0ZWQgaXQuIFRoaXNcbiAqIGNvdXBsaW5nIGlzIGluZGljYXRlZCBieSB0aGUgcHJvdmlzaW9uIG9mIHRoZSBgdGhpc2Aga2V5d29yZCB0byB0aGUgRWxlbWVudFJlZmVyZW5jZSdzXG4gKiBjb25zdHJ1Y3RvciBpbiB0aGUgYWJvdmUgZXhhbXBsZXMgKGkuZS4gYG5ldyBwYy5FbnRpdHlSZWZlcmVuY2UodGhpcywgLi4uYCkuXG4gKlxuICogQW55IGV2ZW50IGxpc3RlbmVycyBtYW5hZ2VkIGJ5IHRoZSBFbGVtZW50UmVmZXJlbmNlIGFyZSBhdXRvbWF0aWNhbGx5IGNsZWFuZWQgdXAgd2hlbiB0aGUgcGFyZW50XG4gKiBjb21wb25lbnQgaXMgcmVtb3ZlZCBvciB0aGUgcGFyZW50IGNvbXBvbmVudCdzIGVudGl0eSBpcyBkZXN0cm95ZWQg4oCTIGFzIHN1Y2ggeW91IHNob3VsZCBuZXZlclxuICogaGF2ZSB0byB3b3JyeSBhYm91dCBkYW5nbGluZyBsaXN0ZW5lcnMuXG4gKlxuICogQWRkaXRpb25hbGx5LCBhbnkgY2FsbGJhY2tzIGxpc3RlZCBpbiB0aGUgZXZlbnQgY29uZmlnIHdpbGwgYXV0b21hdGljYWxseSBiZSBjYWxsZWQgaW4gdGhlIHNjb3BlXG4gKiBvZiB0aGUgcGFyZW50IGNvbXBvbmVudCDigJMgeW91IHNob3VsZCBuZXZlciBoYXZlIHRvIHdvcnJ5IGFib3V0IG1hbnVhbGx5IGNhbGxpbmdcbiAqIGBGdW5jdGlvbi5iaW5kKClgLlxuICpcbiAqIEBhdWdtZW50cyBFdmVudEhhbmRsZXJcbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgRW50aXR5UmVmZXJlbmNlIGV4dGVuZHMgRXZlbnRIYW5kbGVyIHtcbiAgICAvKipcbiAgICAgKiBIZWxwZXIgY2xhc3MgdXNlZCBmb3IgbWFuYWdpbmcgY29tcG9uZW50IHByb3BlcnRpZXMgdGhhdCByZXByZXNlbnQgZW50aXR5IHJlZmVyZW5jZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0NvbXBvbmVudH0gcGFyZW50Q29tcG9uZW50IC0gQSByZWZlcmVuY2UgdG8gdGhlIHBhcmVudCBjb21wb25lbnQgdGhhdCBvd25zIHRoaXNcbiAgICAgKiBlbnRpdHkgcmVmZXJlbmNlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBlbnRpdHlQcm9wZXJ0eU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHRoYXQgY29udGFpbnMgdGhlXG4gICAgICogZW50aXR5IGd1aWQuXG4gICAgICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLCBGdW5jdGlvbj59IFtldmVudENvbmZpZ10gLSBBIG1hcCBvZiBldmVudCBsaXN0ZW5lciBjb25maWd1cmF0aW9ucy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihwYXJlbnRDb21wb25lbnQsIGVudGl0eVByb3BlcnR5TmFtZSwgZXZlbnRDb25maWcpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBpZiAoIXBhcmVudENvbXBvbmVudCB8fCAhKHBhcmVudENvbXBvbmVudCBpbnN0YW5jZW9mIENvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHBhcmVudENvbXBvbmVudCBhcmd1bWVudCBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhIENvbXBvbmVudCcpO1xuICAgICAgICB9IGVsc2UgaWYgKCFlbnRpdHlQcm9wZXJ0eU5hbWUgfHwgdHlwZW9mIGVudGl0eVByb3BlcnR5TmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3BlcnR5TmFtZSBhcmd1bWVudCBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhIHN0cmluZycpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50Q29uZmlnICYmIHR5cGVvZiBldmVudENvbmZpZyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSWYgcHJvdmlkZWQsIHRoZSBldmVudENvbmZpZyBhcmd1bWVudCBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcGFyZW50Q29tcG9uZW50ID0gcGFyZW50Q29tcG9uZW50O1xuICAgICAgICB0aGlzLl9lbnRpdHlQcm9wZXJ0eU5hbWUgPSBlbnRpdHlQcm9wZXJ0eU5hbWU7XG4gICAgICAgIHRoaXMuX2VudGl0eSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2FwcCA9IHBhcmVudENvbXBvbmVudC5zeXN0ZW0uYXBwO1xuXG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyZUV2ZW50TGlzdGVuZXJzKGV2ZW50Q29uZmlnIHx8IHt9LCB7XG4gICAgICAgICAgICAnZW50aXR5I2Rlc3Ryb3knOiB0aGlzLl9vbkVudGl0eURlc3Ryb3lcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3RvZ2dsZUxpZmVjeWNsZUxpc3RlbmVycygnb24nKTtcbiAgICB9XG5cbiAgICBfY29uZmlndXJlRXZlbnRMaXN0ZW5lcnMoZXh0ZXJuYWxFdmVudENvbmZpZywgaW50ZXJuYWxFdmVudENvbmZpZykge1xuICAgICAgICBjb25zdCBleHRlcm5hbEV2ZW50TGlzdGVuZXJDb25maWdzID0gdGhpcy5fcGFyc2VFdmVudExpc3RlbmVyQ29uZmlnKGV4dGVybmFsRXZlbnRDb25maWcsICdleHRlcm5hbCcsIHRoaXMuX3BhcmVudENvbXBvbmVudCk7XG4gICAgICAgIGNvbnN0IGludGVybmFsRXZlbnRMaXN0ZW5lckNvbmZpZ3MgPSB0aGlzLl9wYXJzZUV2ZW50TGlzdGVuZXJDb25maWcoaW50ZXJuYWxFdmVudENvbmZpZywgJ2ludGVybmFsJywgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lckNvbmZpZ3MgPSBleHRlcm5hbEV2ZW50TGlzdGVuZXJDb25maWdzLmNvbmNhdChpbnRlcm5hbEV2ZW50TGlzdGVuZXJDb25maWdzKTtcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJTdGF0dXNGbGFncyA9IHt9O1xuICAgICAgICB0aGlzLl9nYWluTGlzdGVuZXJzID0ge307XG4gICAgICAgIHRoaXMuX2xvc2VMaXN0ZW5lcnMgPSB7fTtcbiAgICB9XG5cbiAgICBfcGFyc2VFdmVudExpc3RlbmVyQ29uZmlnKGV2ZW50Q29uZmlnLCBwcmVmaXgsIHNjb3BlKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhldmVudENvbmZpZykubWFwKGZ1bmN0aW9uIChsaXN0ZW5lckRlc2NyaXB0aW9uLCBpbmRleCkge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJEZXNjcmlwdGlvblBhcnRzID0gbGlzdGVuZXJEZXNjcmlwdGlvbi5zcGxpdCgnIycpO1xuICAgICAgICAgICAgY29uc3Qgc291cmNlTmFtZSA9IGxpc3RlbmVyRGVzY3JpcHRpb25QYXJ0c1swXTtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IGxpc3RlbmVyRGVzY3JpcHRpb25QYXJ0c1sxXTtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gZXZlbnRDb25maWdbbGlzdGVuZXJEZXNjcmlwdGlvbl07XG5cbiAgICAgICAgICAgIGlmIChsaXN0ZW5lckRlc2NyaXB0aW9uUGFydHMubGVuZ3RoICE9PSAyIHx8XG4gICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZU5hbWUgIT09ICdzdHJpbmcnIHx8IHNvdXJjZU5hbWUubGVuZ3RoID09PSAwIHx8XG4gICAgICAgICAgICAgICAgdHlwZW9mIGV2ZW50TmFtZSAhPT0gJ3N0cmluZycgfHwgZXZlbnROYW1lLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBldmVudCBsaXN0ZW5lciBkZXNjcmlwdGlvbjogYCcgKyBsaXN0ZW5lckRlc2NyaXB0aW9uICsgJ2AnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBvciBtaXNzaW5nIGNhbGxiYWNrIGZvciBldmVudCBsaXN0ZW5lciBgJyArIGxpc3RlbmVyRGVzY3JpcHRpb24gKyAnYCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlkOiBwcmVmaXggKyAnXycgKyBpbmRleCArICdfJyArIGxpc3RlbmVyRGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgc291cmNlTmFtZTogc291cmNlTmFtZSxcbiAgICAgICAgICAgICAgICBldmVudE5hbWU6IGV2ZW50TmFtZSxcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgc2NvcGU6IHNjb3BlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBfdG9nZ2xlTGlmZWN5Y2xlTGlzdGVuZXJzKG9uT3JPZmYpIHtcbiAgICAgICAgdGhpcy5fcGFyZW50Q29tcG9uZW50W29uT3JPZmZdKCdzZXRfJyArIHRoaXMuX2VudGl0eVByb3BlcnR5TmFtZSwgdGhpcy5fb25TZXRFbnRpdHksIHRoaXMpO1xuICAgICAgICB0aGlzLl9wYXJlbnRDb21wb25lbnQuc3lzdGVtW29uT3JPZmZdKCdiZWZvcmVyZW1vdmUnLCB0aGlzLl9vblBhcmVudENvbXBvbmVudFJlbW92ZSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fYXBwLnN5c3RlbXNbb25Pck9mZl0oJ3Bvc3RQb3N0SW5pdGlhbGl6ZScsIHRoaXMuX3VwZGF0ZUVudGl0eVJlZmVyZW5jZSwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2FwcFtvbk9yT2ZmXSgndG9vbHM6c2NlbmVsb2FkZWQnLCB0aGlzLl9vblNjZW5lTG9hZGVkLCB0aGlzKTtcblxuICAgICAgICAvLyBGb3IgYW55IGV2ZW50IGxpc3RlbmVycyB0aGF0IHJlbGF0ZSB0byB0aGUgZ2Fpbi9sb3NzIG9mIGEgY29tcG9uZW50LCByZWdpc3RlclxuICAgICAgICAvLyBsaXN0ZW5lcnMgdGhhdCB3aWxsIGZvcndhcmQgdGhlIGFkZC9yZW1vdmUgY29tcG9uZW50IGV2ZW50c1xuICAgICAgICBjb25zdCBhbGxDb21wb25lbnRTeXN0ZW1zID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9ldmVudExpc3RlbmVyQ29uZmlncy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5fZXZlbnRMaXN0ZW5lckNvbmZpZ3NbaV07XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRTeXN0ZW0gPSB0aGlzLl9hcHAuc3lzdGVtc1tjb25maWcuc291cmNlTmFtZV07XG5cbiAgICAgICAgICAgIGlmIChjb21wb25lbnRTeXN0ZW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoYWxsQ29tcG9uZW50U3lzdGVtcy5pbmRleE9mKGNvbXBvbmVudFN5c3RlbSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbENvbXBvbmVudFN5c3RlbXMucHVzaChjb21wb25lbnRTeXN0ZW0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnRTeXN0ZW0gJiYgY29uZmlnLmV2ZW50TmFtZSA9PT0gJ2dhaW4nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dhaW5MaXN0ZW5lcnNbY29uZmlnLnNvdXJjZU5hbWVdID0gY29uZmlnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnRTeXN0ZW0gJiYgY29uZmlnLmV2ZW50TmFtZSA9PT0gJ2xvc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvc2VMaXN0ZW5lcnNbY29uZmlnLnNvdXJjZU5hbWVdID0gY29uZmlnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsQ29tcG9uZW50U3lzdGVtcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgYWxsQ29tcG9uZW50U3lzdGVtc1tpXVtvbk9yT2ZmXSgnYWRkJywgdGhpcy5fb25Db21wb25lbnRBZGQsIHRoaXMpO1xuICAgICAgICAgICAgYWxsQ29tcG9uZW50U3lzdGVtc1tpXVtvbk9yT2ZmXSgnYmVmb3JlcmVtb3ZlJywgdGhpcy5fb25Db21wb25lbnRSZW1vdmUsIHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uU2V0RW50aXR5KG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBpZiAobmV3VmFsdWUgaW5zdGFuY2VvZiBFbnRpdHkpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUVudGl0eVJlZmVyZW5jZSgpO1xuICAgICAgICB9IGVsc2UgIHtcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBuZXdWYWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJFbnRpdHkgZmllbGQgYFwiICsgdGhpcy5fZW50aXR5UHJvcGVydHlOYW1lICsgXCJgIHdhcyBzZXQgdG8gdW5leHBlY3RlZCB0eXBlICdcIiArICh0eXBlb2YgbmV3VmFsdWUpICsgXCInXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUVudGl0eVJlZmVyZW5jZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTXVzdCBiZSBjYWxsZWQgZnJvbSB0aGUgcGFyZW50IGNvbXBvbmVudCdzIG9uRW5hYmxlKCkgbWV0aG9kIGluIG9yZGVyIGZvciBlbnRpdHkgcmVmZXJlbmNlc1xuICAgICAqIHRvIGJlIGNvcnJlY3RseSByZXNvbHZlZCB3aGVuIHtAbGluayBFbnRpdHkjY2xvbmV9IGlzIGNhbGxlZC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25QYXJlbnRDb21wb25lbnRFbmFibGUoKSB7XG4gICAgICAgIC8vIFdoZW4gYW4gZW50aXR5IGlzIGNsb25lZCB2aWEgdGhlIEpTIEFQSSwgd2Ugd29uJ3QgYmUgYWJsZSB0byByZXNvbHZlIHRoZVxuICAgICAgICAvLyBlbnRpdHkgcmVmZXJlbmNlIHVudGlsIHRoZSBjbG9uZWQgZW50aXR5IGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBzY2VuZSBncmFwaC5cbiAgICAgICAgLy8gV2UgY2FuIGRldGVjdCB0aGlzIGJ5IHdhaXRpbmcgZm9yIHRoZSBwYXJlbnQgY29tcG9uZW50IHRvIGJlIGVuYWJsZWQsIGluIHRoZVxuICAgICAgICAvLyBzcGVjaWZpYyBjYXNlIHdoZXJlIHdlIGhhdmVuJ3QgeWV0IGJlZW4gYWJsZSB0byByZXNvbHZlIGFuIGVudGl0eSByZWZlcmVuY2UuXG4gICAgICAgIGlmICghdGhpcy5fZW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVFbnRpdHlSZWZlcmVuY2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFdoZW4gcnVubmluZyB3aXRoaW4gdGhlIGVkaXRvciwgcG9zdEluaXRpYWxpemUgaXMgZmlyZWQgYmVmb3JlIHRoZSBzY2VuZSBncmFwaFxuICAgIC8vIGhhcyBiZWVuIGZ1bGx5IGNvbnN0cnVjdGVkLiBBcyBzdWNoIHdlIHVzZSB0aGUgc3BlY2lhbCB0b29sczpzY2VuZWxvYWRlZCBldmVudFxuICAgIC8vIGluIG9yZGVyIHRvIGtub3cgd2hlbiB0aGUgZ3JhcGggaXMgcmVhZHkgdG8gdHJhdmVyc2UuXG4gICAgX29uU2NlbmVMb2FkZWQoKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUVudGl0eVJlZmVyZW5jZSgpO1xuICAgIH1cblxuICAgIF91cGRhdGVFbnRpdHlSZWZlcmVuY2UoKSB7XG4gICAgICAgIGxldCBuZXh0RW50aXR5R3VpZCA9IHRoaXMuX3BhcmVudENvbXBvbmVudC5kYXRhW3RoaXMuX2VudGl0eVByb3BlcnR5TmFtZV07XG4gICAgICAgIGxldCBuZXh0RW50aXR5O1xuXG4gICAgICAgIGlmIChuZXh0RW50aXR5R3VpZCBpbnN0YW5jZW9mIEVudGl0eSkge1xuICAgICAgICAgICAgLy8gaWYgdmFsdWUgaXMgc2V0IHRvIGEgRW50aXR5IGl0c2VsZiByZXBsYWNlIHZhbHVlIHdpdGggdGhlIEdVSURcbiAgICAgICAgICAgIG5leHRFbnRpdHkgPSBuZXh0RW50aXR5R3VpZDtcbiAgICAgICAgICAgIG5leHRFbnRpdHlHdWlkID0gbmV4dEVudGl0eS5nZXRHdWlkKCk7XG4gICAgICAgICAgICB0aGlzLl9wYXJlbnRDb21wb25lbnQuZGF0YVt0aGlzLl9lbnRpdHlQcm9wZXJ0eU5hbWVdID0gbmV4dEVudGl0eUd1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCByb290ID0gdGhpcy5fcGFyZW50Q29tcG9uZW50LnN5c3RlbS5hcHAucm9vdDtcbiAgICAgICAgICAgIGNvbnN0IGlzT25TY2VuZUdyYXBoID0gdGhpcy5fcGFyZW50Q29tcG9uZW50LmVudGl0eS5pc0Rlc2NlbmRhbnRPZihyb290KTtcblxuICAgICAgICAgICAgbmV4dEVudGl0eSA9IChpc09uU2NlbmVHcmFwaCAmJiBuZXh0RW50aXR5R3VpZCkgPyByb290LmZpbmRCeUd1aWQobmV4dEVudGl0eUd1aWQpIDogbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhc0NoYW5nZWQgPSB0aGlzLl9lbnRpdHkgIT09IG5leHRFbnRpdHk7XG5cbiAgICAgICAgaWYgKGhhc0NoYW5nZWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9lbnRpdHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vbkJlZm9yZUVudGl0eUNoYW5nZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9lbnRpdHkgPSBuZXh0RW50aXR5O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fZW50aXR5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb25BZnRlckVudGl0eUNoYW5nZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3NldDplbnRpdHknLCB0aGlzLl9lbnRpdHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uQmVmb3JlRW50aXR5Q2hhbmdlKCkge1xuICAgICAgICB0aGlzLl90b2dnbGVFbnRpdHlMaXN0ZW5lcnMoJ29mZicpO1xuICAgICAgICB0aGlzLl9jYWxsQWxsR2Fpbk9yTG9zZUxpc3RlbmVycyh0aGlzLl9sb3NlTGlzdGVuZXJzKTtcbiAgICB9XG5cbiAgICBfb25BZnRlckVudGl0eUNoYW5nZSgpIHtcbiAgICAgICAgdGhpcy5fdG9nZ2xlRW50aXR5TGlzdGVuZXJzKCdvbicpO1xuICAgICAgICB0aGlzLl9jYWxsQWxsR2Fpbk9yTG9zZUxpc3RlbmVycyh0aGlzLl9nYWluTGlzdGVuZXJzKTtcbiAgICB9XG5cbiAgICBfb25Db21wb25lbnRBZGQoZW50aXR5LCBjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudC5zeXN0ZW0uaWQ7XG5cbiAgICAgICAgaWYgKGVudGl0eSA9PT0gdGhpcy5fZW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLl9jYWxsR2Fpbk9yTG9zZUxpc3RlbmVyKGNvbXBvbmVudE5hbWUsIHRoaXMuX2dhaW5MaXN0ZW5lcnMpO1xuICAgICAgICAgICAgdGhpcy5fdG9nZ2xlQ29tcG9uZW50TGlzdGVuZXJzKCdvbicsIGNvbXBvbmVudE5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uQ29tcG9uZW50UmVtb3ZlKGVudGl0eSwgY29tcG9uZW50KSB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBjb21wb25lbnQuc3lzdGVtLmlkO1xuXG4gICAgICAgIGlmIChlbnRpdHkgPT09IHRoaXMuX2VudGl0eSkge1xuICAgICAgICAgICAgdGhpcy5fY2FsbEdhaW5Pckxvc2VMaXN0ZW5lcihjb21wb25lbnROYW1lLCB0aGlzLl9sb3NlTGlzdGVuZXJzKTtcbiAgICAgICAgICAgIHRoaXMuX3RvZ2dsZUNvbXBvbmVudExpc3RlbmVycygnb2ZmJywgY29tcG9uZW50TmFtZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY2FsbEFsbEdhaW5Pckxvc2VMaXN0ZW5lcnMobGlzdGVuZXJNYXApIHtcbiAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnROYW1lIGluIHRoaXMuX2VudGl0eS5jKSB7XG4gICAgICAgICAgICB0aGlzLl9jYWxsR2Fpbk9yTG9zZUxpc3RlbmVyKGNvbXBvbmVudE5hbWUsIGxpc3RlbmVyTWFwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9jYWxsR2Fpbk9yTG9zZUxpc3RlbmVyKGNvbXBvbmVudE5hbWUsIGxpc3RlbmVyTWFwKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbnRpdHkuYy5oYXNPd25Qcm9wZXJ0eShjb21wb25lbnROYW1lKSAmJiBsaXN0ZW5lck1hcFtjb21wb25lbnROYW1lXSkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gbGlzdGVuZXJNYXBbY29tcG9uZW50TmFtZV07XG4gICAgICAgICAgICBjb25maWcuY2FsbGJhY2suY2FsbChjb25maWcuc2NvcGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3RvZ2dsZUVudGl0eUxpc3RlbmVycyhvbk9yT2ZmLCBpc0Rlc3Ryb3lpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuX2VudGl0eSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9ldmVudExpc3RlbmVyQ29uZmlncy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NhZmVUb2dnbGVMaXN0ZW5lcihvbk9yT2ZmLCB0aGlzLl9ldmVudExpc3RlbmVyQ29uZmlnc1tpXSwgaXNEZXN0cm95aW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIF90b2dnbGVDb21wb25lbnRMaXN0ZW5lcnMob25Pck9mZiwgY29tcG9uZW50TmFtZSwgaXNEZXN0cm95aW5nKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fZXZlbnRMaXN0ZW5lckNvbmZpZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuX2V2ZW50TGlzdGVuZXJDb25maWdzW2ldO1xuXG4gICAgICAgICAgICBpZiAoY29uZmlnLnNvdXJjZU5hbWUgPT09IGNvbXBvbmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zYWZlVG9nZ2xlTGlzdGVuZXIob25Pck9mZiwgY29uZmlnLCBpc0Rlc3Ryb3lpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NhZmVUb2dnbGVMaXN0ZW5lcihvbk9yT2ZmLCBjb25maWcsIGlzRGVzdHJveWluZykge1xuICAgICAgICBjb25zdCBpc0FkZGluZyA9IChvbk9yT2ZmID09PSAnb24nKTtcblxuICAgICAgICAvLyBQcmV2ZW50IGR1cGxpY2F0ZSBsaXN0ZW5lcnNcbiAgICAgICAgaWYgKGlzQWRkaW5nICYmIHRoaXMuX2xpc3RlbmVyU3RhdHVzRmxhZ3NbY29uZmlnLmlkXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc291cmNlID0gdGhpcy5fZ2V0RXZlbnRTb3VyY2UoY29uZmlnLnNvdXJjZU5hbWUsIGlzRGVzdHJveWluZyk7XG5cbiAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgICAgc291cmNlW29uT3JPZmZdKGNvbmZpZy5ldmVudE5hbWUsIGNvbmZpZy5jYWxsYmFjaywgY29uZmlnLnNjb3BlKTtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyU3RhdHVzRmxhZ3NbY29uZmlnLmlkXSA9IGlzQWRkaW5nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2dldEV2ZW50U291cmNlKHNvdXJjZU5hbWUsIGlzRGVzdHJveWluZykge1xuICAgICAgICAvLyBUaGUgJ2VudGl0eScgc291cmNlIG5hbWUgaXMgYSBzcGVjaWFsIGNhc2UgLSB3ZSBqdXN0IHdhbnQgdG8gcmV0dXJuXG4gICAgICAgIC8vIGEgcmVmZXJlbmNlIHRvIHRoZSBlbnRpdHkgaXRzZWxmLiBGb3IgYWxsIG90aGVyIGNhc2VzIHRoZSBzb3VyY2UgbmFtZVxuICAgICAgICAvLyBzaG91bGQgcmVmZXIgdG8gYSBjb21wb25lbnQuXG4gICAgICAgIGlmIChzb3VyY2VOYW1lID09PSAnZW50aXR5Jykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VudGl0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRoaXMuX2VudGl0eVtzb3VyY2VOYW1lXTtcblxuICAgICAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcG9uZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc0Rlc3Ryb3lpbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRW50aXR5IGhhcyBubyBjb21wb25lbnQgd2l0aCBuYW1lICcgKyBzb3VyY2VOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIF9vbkVudGl0eURlc3Ryb3koZW50aXR5KSB7XG4gICAgICAgIGlmICh0aGlzLl9lbnRpdHkgPT09IGVudGl0eSkge1xuICAgICAgICAgICAgdGhpcy5fdG9nZ2xlRW50aXR5TGlzdGVuZXJzKCdvZmYnLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX2VudGl0eSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25QYXJlbnRDb21wb25lbnRSZW1vdmUoZW50aXR5LCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gdGhpcy5fcGFyZW50Q29tcG9uZW50KSB7XG4gICAgICAgICAgICB0aGlzLl90b2dnbGVMaWZlY3ljbGVMaXN0ZW5lcnMoJ29mZicpO1xuICAgICAgICAgICAgdGhpcy5fdG9nZ2xlRW50aXR5TGlzdGVuZXJzKCdvZmYnLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlbmllbmNlIG1ldGhvZCBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIGVudGl0eSBleGlzdHMgYW5kIGhhcyBhIGNvbXBvbmVudCBvZiB0aGUgcHJvdmlkZWRcbiAgICAgKiB0eXBlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbXBvbmVudE5hbWUgLSBOYW1lIG9mIHRoZSBjb21wb25lbnQuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIGVudGl0eSBleGlzdHMgYW5kIGhhcyBhIGNvbXBvbmVudCBvZiB0aGUgcHJvdmlkZWQgdHlwZS5cbiAgICAgKi9cbiAgICBoYXNDb21wb25lbnQoY29tcG9uZW50TmFtZSkge1xuICAgICAgICByZXR1cm4gKHRoaXMuX2VudGl0eSAmJiB0aGlzLl9lbnRpdHkuYykgPyAhIXRoaXMuX2VudGl0eS5jW2NvbXBvbmVudE5hbWVdIDogZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSByZWZlcmVuY2UgdG8gdGhlIGVudGl0eSwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtFbnRpdHl9XG4gICAgICovXG4gICAgZ2V0IGVudGl0eSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VudGl0eTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVudGl0eVJlZmVyZW5jZSB9O1xuIl0sIm5hbWVzIjpbIkVudGl0eVJlZmVyZW5jZSIsIkV2ZW50SGFuZGxlciIsImNvbnN0cnVjdG9yIiwicGFyZW50Q29tcG9uZW50IiwiZW50aXR5UHJvcGVydHlOYW1lIiwiZXZlbnRDb25maWciLCJDb21wb25lbnQiLCJFcnJvciIsIl9wYXJlbnRDb21wb25lbnQiLCJfZW50aXR5UHJvcGVydHlOYW1lIiwiX2VudGl0eSIsIl9hcHAiLCJzeXN0ZW0iLCJhcHAiLCJfY29uZmlndXJlRXZlbnRMaXN0ZW5lcnMiLCJfb25FbnRpdHlEZXN0cm95IiwiX3RvZ2dsZUxpZmVjeWNsZUxpc3RlbmVycyIsImV4dGVybmFsRXZlbnRDb25maWciLCJpbnRlcm5hbEV2ZW50Q29uZmlnIiwiZXh0ZXJuYWxFdmVudExpc3RlbmVyQ29uZmlncyIsIl9wYXJzZUV2ZW50TGlzdGVuZXJDb25maWciLCJpbnRlcm5hbEV2ZW50TGlzdGVuZXJDb25maWdzIiwiX2V2ZW50TGlzdGVuZXJDb25maWdzIiwiY29uY2F0IiwiX2xpc3RlbmVyU3RhdHVzRmxhZ3MiLCJfZ2Fpbkxpc3RlbmVycyIsIl9sb3NlTGlzdGVuZXJzIiwicHJlZml4Iiwic2NvcGUiLCJPYmplY3QiLCJrZXlzIiwibWFwIiwibGlzdGVuZXJEZXNjcmlwdGlvbiIsImluZGV4IiwibGlzdGVuZXJEZXNjcmlwdGlvblBhcnRzIiwic3BsaXQiLCJzb3VyY2VOYW1lIiwiZXZlbnROYW1lIiwiY2FsbGJhY2siLCJsZW5ndGgiLCJpZCIsIm9uT3JPZmYiLCJfb25TZXRFbnRpdHkiLCJfb25QYXJlbnRDb21wb25lbnRSZW1vdmUiLCJzeXN0ZW1zIiwiX3VwZGF0ZUVudGl0eVJlZmVyZW5jZSIsIl9vblNjZW5lTG9hZGVkIiwiYWxsQ29tcG9uZW50U3lzdGVtcyIsImkiLCJjb25maWciLCJjb21wb25lbnRTeXN0ZW0iLCJpbmRleE9mIiwicHVzaCIsIl9vbkNvbXBvbmVudEFkZCIsIl9vbkNvbXBvbmVudFJlbW92ZSIsIm5hbWUiLCJvbGRWYWx1ZSIsIm5ld1ZhbHVlIiwiRW50aXR5IiwidW5kZWZpbmVkIiwiY29uc29sZSIsIndhcm4iLCJvblBhcmVudENvbXBvbmVudEVuYWJsZSIsIm5leHRFbnRpdHlHdWlkIiwiZGF0YSIsIm5leHRFbnRpdHkiLCJnZXRHdWlkIiwicm9vdCIsImlzT25TY2VuZUdyYXBoIiwiZW50aXR5IiwiaXNEZXNjZW5kYW50T2YiLCJmaW5kQnlHdWlkIiwiaGFzQ2hhbmdlZCIsIl9vbkJlZm9yZUVudGl0eUNoYW5nZSIsIl9vbkFmdGVyRW50aXR5Q2hhbmdlIiwiZmlyZSIsIl90b2dnbGVFbnRpdHlMaXN0ZW5lcnMiLCJfY2FsbEFsbEdhaW5Pckxvc2VMaXN0ZW5lcnMiLCJjb21wb25lbnQiLCJjb21wb25lbnROYW1lIiwiX2NhbGxHYWluT3JMb3NlTGlzdGVuZXIiLCJfdG9nZ2xlQ29tcG9uZW50TGlzdGVuZXJzIiwibGlzdGVuZXJNYXAiLCJjIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiaXNEZXN0cm95aW5nIiwiX3NhZmVUb2dnbGVMaXN0ZW5lciIsImlzQWRkaW5nIiwic291cmNlIiwiX2dldEV2ZW50U291cmNlIiwiaGFzQ29tcG9uZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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
