/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { EventHandler } from '../../core/event-handler.js';

/**
 * Container for all {@link ScriptType}s that are available to this application. Note that
 * PlayCanvas scripts can access the Script Registry from inside the application with
 * {@link AppBase#scripts}.
 *
 * @augments EventHandler
 */
class ScriptRegistry extends EventHandler {
  /**
   * Create a new ScriptRegistry instance.
   *
   * @param {import('../app-base.js').AppBase} app - Application to attach registry to.
   */
  constructor(app) {
    super();
    this.app = app;
    this._scripts = {};
    this._list = [];
  }
  destroy() {
    this.app = null;
    this.off();
  }

  /**
   * Add {@link ScriptType} to registry. Note: when {@link createScript} is called, it will add
   * the {@link ScriptType} to the registry automatically. If a script already exists in
   * registry, and the new script has a `swap` method defined, it will perform code hot swapping
   * automatically in async manner.
   *
   * @param {Class<import('./script-type.js').ScriptType>} script - Script Type that is created
   * using {@link createScript}.
   * @returns {boolean} True if added for the first time or false if script already exists.
   * @example
   * var PlayerController = pc.createScript('playerController');
   * // playerController Script Type will be added to pc.ScriptRegistry automatically
   * console.log(app.scripts.has('playerController')); // outputs true
   */
  add(script) {
    const scriptName = script.__name;
    if (this._scripts.hasOwnProperty(scriptName)) {
      setTimeout(() => {
        if (script.prototype.swap) {
          // swapping
          const old = this._scripts[scriptName];
          const ind = this._list.indexOf(old);
          this._list[ind] = script;
          this._scripts[scriptName] = script;
          this.fire('swap', scriptName, script);
          this.fire('swap:' + scriptName, script);
        } else {
          console.warn(`script registry already has '${scriptName}' script, define 'swap' method for new script type to enable code hot swapping`);
        }
      });
      return false;
    }
    this._scripts[scriptName] = script;
    this._list.push(script);
    this.fire('add', scriptName, script);
    this.fire('add:' + scriptName, script);

    // for all components awaiting Script Type
    // create script instance
    setTimeout(() => {
      if (!this._scripts.hasOwnProperty(scriptName)) return;

      // this is a check for a possible error
      // that might happen if the app has been destroyed before
      // setTimeout has finished
      if (!this.app || !this.app.systems || !this.app.systems.script) {
        return;
      }
      const components = this.app.systems.script._components;
      let attributes;
      const scriptInstances = [];
      const scriptInstancesInitialized = [];
      for (components.loopIndex = 0; components.loopIndex < components.length; components.loopIndex++) {
        const component = components.items[components.loopIndex];
        // check if awaiting for script
        if (component._scriptsIndex[scriptName] && component._scriptsIndex[scriptName].awaiting) {
          if (component._scriptsData && component._scriptsData[scriptName]) attributes = component._scriptsData[scriptName].attributes;
          const scriptInstance = component.create(scriptName, {
            preloading: true,
            ind: component._scriptsIndex[scriptName].ind,
            attributes: attributes
          });
          if (scriptInstance) scriptInstances.push(scriptInstance);
        }
      }

      // initialize attributes
      for (let i = 0; i < scriptInstances.length; i++) scriptInstances[i].__initializeAttributes();

      // call initialize()
      for (let i = 0; i < scriptInstances.length; i++) {
        if (scriptInstances[i].enabled) {
          scriptInstances[i]._initialized = true;
          scriptInstancesInitialized.push(scriptInstances[i]);
          if (scriptInstances[i].initialize) scriptInstances[i].initialize();
        }
      }

      // call postInitialize()
      for (let i = 0; i < scriptInstancesInitialized.length; i++) {
        if (!scriptInstancesInitialized[i].enabled || scriptInstancesInitialized[i]._postInitialized) {
          continue;
        }
        scriptInstancesInitialized[i]._postInitialized = true;
        if (scriptInstancesInitialized[i].postInitialize) scriptInstancesInitialized[i].postInitialize();
      }
    });
    return true;
  }

  /**
   * Remove {@link ScriptType}.
   *
   * @param {string|Class<import('./script-type.js').ScriptType>} nameOrType - The name or type
   * of {@link ScriptType}.
   * @returns {boolean} True if removed or False if already not in registry.
   * @example
   * app.scripts.remove('playerController');
   */
  remove(nameOrType) {
    let scriptType = nameOrType;
    let scriptName = nameOrType;
    if (typeof scriptName !== 'string') {
      scriptName = scriptType.__name;
    } else {
      scriptType = this.get(scriptName);
    }
    if (this.get(scriptName) !== scriptType) return false;
    delete this._scripts[scriptName];
    const ind = this._list.indexOf(scriptType);
    this._list.splice(ind, 1);
    this.fire('remove', scriptName, scriptType);
    this.fire('remove:' + scriptName, scriptType);
    return true;
  }

  /**
   * Get {@link ScriptType} by name.
   *
   * @param {string} name - Name of a {@link ScriptType}.
   * @returns {Class<import('./script-type.js').ScriptType>} The Script Type if it exists in the
   * registry or null otherwise.
   * @example
   * var PlayerController = app.scripts.get('playerController');
   */
  get(name) {
    return this._scripts[name] || null;
  }

  /**
   * Check if a {@link ScriptType} with the specified name is in the registry.
   *
   * @param {string|Class<import('./script-type.js').ScriptType>} nameOrType - The name or type
   * of {@link ScriptType}.
   * @returns {boolean} True if {@link ScriptType} is in registry.
   * @example
   * if (app.scripts.has('playerController')) {
   *     // playerController is in pc.ScriptRegistry
   * }
   */
  has(nameOrType) {
    if (typeof nameOrType === 'string') {
      return this._scripts.hasOwnProperty(nameOrType);
    }
    if (!nameOrType) return false;
    const scriptName = nameOrType.__name;
    return this._scripts[scriptName] === nameOrType;
  }

  /**
   * Get list of all {@link ScriptType}s from registry.
   *
   * @returns {Array<Class<import('./script-type.js').ScriptType>>} list of all {@link ScriptType}s
   * in registry.
   * @example
   * // logs array of all Script Type names available in registry
   * console.log(app.scripts.list().map(function (o) {
   *     return o.name;
   * }));
   */
  list() {
    return this._list;
  }
}

export { ScriptRegistry };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0LXJlZ2lzdHJ5LmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZnJhbWV3b3JrL3NjcmlwdC9zY3JpcHQtcmVnaXN0cnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vY29yZS9ldmVudC1oYW5kbGVyLmpzJztcblxuLyoqXG4gKiBDb250YWluZXIgZm9yIGFsbCB7QGxpbmsgU2NyaXB0VHlwZX1zIHRoYXQgYXJlIGF2YWlsYWJsZSB0byB0aGlzIGFwcGxpY2F0aW9uLiBOb3RlIHRoYXRcbiAqIFBsYXlDYW52YXMgc2NyaXB0cyBjYW4gYWNjZXNzIHRoZSBTY3JpcHQgUmVnaXN0cnkgZnJvbSBpbnNpZGUgdGhlIGFwcGxpY2F0aW9uIHdpdGhcbiAqIHtAbGluayBBcHBCYXNlI3NjcmlwdHN9LlxuICpcbiAqIEBhdWdtZW50cyBFdmVudEhhbmRsZXJcbiAqL1xuY2xhc3MgU2NyaXB0UmVnaXN0cnkgZXh0ZW5kcyBFdmVudEhhbmRsZXIge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBTY3JpcHRSZWdpc3RyeSBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9hcHAtYmFzZS5qcycpLkFwcEJhc2V9IGFwcCAtIEFwcGxpY2F0aW9uIHRvIGF0dGFjaCByZWdpc3RyeSB0by5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICAgICAgdGhpcy5fc2NyaXB0cyA9IHsgfTtcbiAgICAgICAgdGhpcy5fbGlzdCA9IFtdO1xuICAgIH1cblxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuYXBwID0gbnVsbDtcbiAgICAgICAgdGhpcy5vZmYoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQge0BsaW5rIFNjcmlwdFR5cGV9IHRvIHJlZ2lzdHJ5LiBOb3RlOiB3aGVuIHtAbGluayBjcmVhdGVTY3JpcHR9IGlzIGNhbGxlZCwgaXQgd2lsbCBhZGRcbiAgICAgKiB0aGUge0BsaW5rIFNjcmlwdFR5cGV9IHRvIHRoZSByZWdpc3RyeSBhdXRvbWF0aWNhbGx5LiBJZiBhIHNjcmlwdCBhbHJlYWR5IGV4aXN0cyBpblxuICAgICAqIHJlZ2lzdHJ5LCBhbmQgdGhlIG5ldyBzY3JpcHQgaGFzIGEgYHN3YXBgIG1ldGhvZCBkZWZpbmVkLCBpdCB3aWxsIHBlcmZvcm0gY29kZSBob3Qgc3dhcHBpbmdcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGluIGFzeW5jIG1hbm5lci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q2xhc3M8aW1wb3J0KCcuL3NjcmlwdC10eXBlLmpzJykuU2NyaXB0VHlwZT59IHNjcmlwdCAtIFNjcmlwdCBUeXBlIHRoYXQgaXMgY3JlYXRlZFxuICAgICAqIHVzaW5nIHtAbGluayBjcmVhdGVTY3JpcHR9LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIGFkZGVkIGZvciB0aGUgZmlyc3QgdGltZSBvciBmYWxzZSBpZiBzY3JpcHQgYWxyZWFkeSBleGlzdHMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgUGxheWVyQ29udHJvbGxlciA9IHBjLmNyZWF0ZVNjcmlwdCgncGxheWVyQ29udHJvbGxlcicpO1xuICAgICAqIC8vIHBsYXllckNvbnRyb2xsZXIgU2NyaXB0IFR5cGUgd2lsbCBiZSBhZGRlZCB0byBwYy5TY3JpcHRSZWdpc3RyeSBhdXRvbWF0aWNhbGx5XG4gICAgICogY29uc29sZS5sb2coYXBwLnNjcmlwdHMuaGFzKCdwbGF5ZXJDb250cm9sbGVyJykpOyAvLyBvdXRwdXRzIHRydWVcbiAgICAgKi9cbiAgICBhZGQoc2NyaXB0KSB7XG4gICAgICAgIGNvbnN0IHNjcmlwdE5hbWUgPSBzY3JpcHQuX19uYW1lO1xuXG4gICAgICAgIGlmICh0aGlzLl9zY3JpcHRzLmhhc093blByb3BlcnR5KHNjcmlwdE5hbWUpKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0LnByb3RvdHlwZS5zd2FwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN3YXBwaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZCA9IHRoaXMuX3NjcmlwdHNbc2NyaXB0TmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZCA9IHRoaXMuX2xpc3QuaW5kZXhPZihvbGQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9saXN0W2luZF0gPSBzY3JpcHQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NjcmlwdHNbc2NyaXB0TmFtZV0gPSBzY3JpcHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKCdzd2FwJywgc2NyaXB0TmFtZSwgc2NyaXB0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKCdzd2FwOicgKyBzY3JpcHROYW1lLCBzY3JpcHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybihgc2NyaXB0IHJlZ2lzdHJ5IGFscmVhZHkgaGFzICcke3NjcmlwdE5hbWV9JyBzY3JpcHQsIGRlZmluZSAnc3dhcCcgbWV0aG9kIGZvciBuZXcgc2NyaXB0IHR5cGUgdG8gZW5hYmxlIGNvZGUgaG90IHN3YXBwaW5nYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zY3JpcHRzW3NjcmlwdE5hbWVdID0gc2NyaXB0O1xuICAgICAgICB0aGlzLl9saXN0LnB1c2goc2NyaXB0KTtcblxuICAgICAgICB0aGlzLmZpcmUoJ2FkZCcsIHNjcmlwdE5hbWUsIHNjcmlwdCk7XG4gICAgICAgIHRoaXMuZmlyZSgnYWRkOicgKyBzY3JpcHROYW1lLCBzY3JpcHQpO1xuXG4gICAgICAgIC8vIGZvciBhbGwgY29tcG9uZW50cyBhd2FpdGluZyBTY3JpcHQgVHlwZVxuICAgICAgICAvLyBjcmVhdGUgc2NyaXB0IGluc3RhbmNlXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9zY3JpcHRzLmhhc093blByb3BlcnR5KHNjcmlwdE5hbWUpKVxuICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gdGhpcyBpcyBhIGNoZWNrIGZvciBhIHBvc3NpYmxlIGVycm9yXG4gICAgICAgICAgICAvLyB0aGF0IG1pZ2h0IGhhcHBlbiBpZiB0aGUgYXBwIGhhcyBiZWVuIGRlc3Ryb3llZCBiZWZvcmVcbiAgICAgICAgICAgIC8vIHNldFRpbWVvdXQgaGFzIGZpbmlzaGVkXG4gICAgICAgICAgICBpZiAoIXRoaXMuYXBwIHx8ICF0aGlzLmFwcC5zeXN0ZW1zIHx8ICF0aGlzLmFwcC5zeXN0ZW1zLnNjcmlwdCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IHRoaXMuYXBwLnN5c3RlbXMuc2NyaXB0Ll9jb21wb25lbnRzO1xuICAgICAgICAgICAgbGV0IGF0dHJpYnV0ZXM7XG4gICAgICAgICAgICBjb25zdCBzY3JpcHRJbnN0YW5jZXMgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHNjcmlwdEluc3RhbmNlc0luaXRpYWxpemVkID0gW107XG5cbiAgICAgICAgICAgIGZvciAoY29tcG9uZW50cy5sb29wSW5kZXggPSAwOyBjb21wb25lbnRzLmxvb3BJbmRleCA8IGNvbXBvbmVudHMubGVuZ3RoOyBjb21wb25lbnRzLmxvb3BJbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50cy5pdGVtc1tjb21wb25lbnRzLmxvb3BJbmRleF07XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgYXdhaXRpbmcgZm9yIHNjcmlwdFxuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQuX3NjcmlwdHNJbmRleFtzY3JpcHROYW1lXSAmJiBjb21wb25lbnQuX3NjcmlwdHNJbmRleFtzY3JpcHROYW1lXS5hd2FpdGluZykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50Ll9zY3JpcHRzRGF0YSAmJiBjb21wb25lbnQuX3NjcmlwdHNEYXRhW3NjcmlwdE5hbWVdKVxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcyA9IGNvbXBvbmVudC5fc2NyaXB0c0RhdGFbc2NyaXB0TmFtZV0uYXR0cmlidXRlcztcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRJbnN0YW5jZSA9IGNvbXBvbmVudC5jcmVhdGUoc2NyaXB0TmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlbG9hZGluZzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZDogY29tcG9uZW50Ll9zY3JpcHRzSW5kZXhbc2NyaXB0TmFtZV0uaW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlc1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2NyaXB0SW5zdGFuY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRJbnN0YW5jZXMucHVzaChzY3JpcHRJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpbml0aWFsaXplIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NyaXB0SW5zdGFuY2VzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIHNjcmlwdEluc3RhbmNlc1tpXS5fX2luaXRpYWxpemVBdHRyaWJ1dGVzKCk7XG5cbiAgICAgICAgICAgIC8vIGNhbGwgaW5pdGlhbGl6ZSgpXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjcmlwdEluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRJbnN0YW5jZXNbaV0uZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRJbnN0YW5jZXNbaV0uX2luaXRpYWxpemVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRJbnN0YW5jZXNJbml0aWFsaXplZC5wdXNoKHNjcmlwdEluc3RhbmNlc1tpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjcmlwdEluc3RhbmNlc1tpXS5pbml0aWFsaXplKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0SW5zdGFuY2VzW2ldLmluaXRpYWxpemUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbGwgcG9zdEluaXRpYWxpemUoKVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY3JpcHRJbnN0YW5jZXNJbml0aWFsaXplZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghc2NyaXB0SW5zdGFuY2VzSW5pdGlhbGl6ZWRbaV0uZW5hYmxlZCB8fCBzY3JpcHRJbnN0YW5jZXNJbml0aWFsaXplZFtpXS5fcG9zdEluaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNjcmlwdEluc3RhbmNlc0luaXRpYWxpemVkW2ldLl9wb3N0SW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdEluc3RhbmNlc0luaXRpYWxpemVkW2ldLnBvc3RJbml0aWFsaXplKVxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRJbnN0YW5jZXNJbml0aWFsaXplZFtpXS5wb3N0SW5pdGlhbGl6ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUge0BsaW5rIFNjcmlwdFR5cGV9LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8Q2xhc3M8aW1wb3J0KCcuL3NjcmlwdC10eXBlLmpzJykuU2NyaXB0VHlwZT59IG5hbWVPclR5cGUgLSBUaGUgbmFtZSBvciB0eXBlXG4gICAgICogb2Yge0BsaW5rIFNjcmlwdFR5cGV9LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHJlbW92ZWQgb3IgRmFsc2UgaWYgYWxyZWFkeSBub3QgaW4gcmVnaXN0cnkuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBhcHAuc2NyaXB0cy5yZW1vdmUoJ3BsYXllckNvbnRyb2xsZXInKTtcbiAgICAgKi9cbiAgICByZW1vdmUobmFtZU9yVHlwZSkge1xuICAgICAgICBsZXQgc2NyaXB0VHlwZSA9IG5hbWVPclR5cGU7XG4gICAgICAgIGxldCBzY3JpcHROYW1lID0gbmFtZU9yVHlwZTtcblxuICAgICAgICBpZiAodHlwZW9mIHNjcmlwdE5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBzY3JpcHROYW1lID0gc2NyaXB0VHlwZS5fX25hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRUeXBlID0gdGhpcy5nZXQoc2NyaXB0TmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5nZXQoc2NyaXB0TmFtZSkgIT09IHNjcmlwdFR5cGUpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgZGVsZXRlIHRoaXMuX3NjcmlwdHNbc2NyaXB0TmFtZV07XG4gICAgICAgIGNvbnN0IGluZCA9IHRoaXMuX2xpc3QuaW5kZXhPZihzY3JpcHRUeXBlKTtcbiAgICAgICAgdGhpcy5fbGlzdC5zcGxpY2UoaW5kLCAxKTtcblxuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIHNjcmlwdE5hbWUsIHNjcmlwdFR5cGUpO1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZTonICsgc2NyaXB0TmFtZSwgc2NyaXB0VHlwZSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHtAbGluayBTY3JpcHRUeXBlfSBieSBuYW1lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBOYW1lIG9mIGEge0BsaW5rIFNjcmlwdFR5cGV9LlxuICAgICAqIEByZXR1cm5zIHtDbGFzczxpbXBvcnQoJy4vc2NyaXB0LXR5cGUuanMnKS5TY3JpcHRUeXBlPn0gVGhlIFNjcmlwdCBUeXBlIGlmIGl0IGV4aXN0cyBpbiB0aGVcbiAgICAgKiByZWdpc3RyeSBvciBudWxsIG90aGVyd2lzZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBQbGF5ZXJDb250cm9sbGVyID0gYXBwLnNjcmlwdHMuZ2V0KCdwbGF5ZXJDb250cm9sbGVyJyk7XG4gICAgICovXG4gICAgZ2V0KG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NjcmlwdHNbbmFtZV0gfHwgbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBhIHtAbGluayBTY3JpcHRUeXBlfSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZSBpcyBpbiB0aGUgcmVnaXN0cnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xDbGFzczxpbXBvcnQoJy4vc2NyaXB0LXR5cGUuanMnKS5TY3JpcHRUeXBlPn0gbmFtZU9yVHlwZSAtIFRoZSBuYW1lIG9yIHR5cGVcbiAgICAgKiBvZiB7QGxpbmsgU2NyaXB0VHlwZX0uXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYge0BsaW5rIFNjcmlwdFR5cGV9IGlzIGluIHJlZ2lzdHJ5LlxuICAgICAqIEBleGFtcGxlXG4gICAgICogaWYgKGFwcC5zY3JpcHRzLmhhcygncGxheWVyQ29udHJvbGxlcicpKSB7XG4gICAgICogICAgIC8vIHBsYXllckNvbnRyb2xsZXIgaXMgaW4gcGMuU2NyaXB0UmVnaXN0cnlcbiAgICAgKiB9XG4gICAgICovXG4gICAgaGFzKG5hbWVPclR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lT3JUeXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NjcmlwdHMuaGFzT3duUHJvcGVydHkobmFtZU9yVHlwZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5hbWVPclR5cGUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgY29uc3Qgc2NyaXB0TmFtZSA9IG5hbWVPclR5cGUuX19uYW1lO1xuICAgICAgICByZXR1cm4gdGhpcy5fc2NyaXB0c1tzY3JpcHROYW1lXSA9PT0gbmFtZU9yVHlwZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgbGlzdCBvZiBhbGwge0BsaW5rIFNjcmlwdFR5cGV9cyBmcm9tIHJlZ2lzdHJ5LlxuICAgICAqXG4gICAgICogQHJldHVybnMge0FycmF5PENsYXNzPGltcG9ydCgnLi9zY3JpcHQtdHlwZS5qcycpLlNjcmlwdFR5cGU+Pn0gbGlzdCBvZiBhbGwge0BsaW5rIFNjcmlwdFR5cGV9c1xuICAgICAqIGluIHJlZ2lzdHJ5LlxuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gbG9ncyBhcnJheSBvZiBhbGwgU2NyaXB0IFR5cGUgbmFtZXMgYXZhaWxhYmxlIGluIHJlZ2lzdHJ5XG4gICAgICogY29uc29sZS5sb2coYXBwLnNjcmlwdHMubGlzdCgpLm1hcChmdW5jdGlvbiAobykge1xuICAgICAqICAgICByZXR1cm4gby5uYW1lO1xuICAgICAqIH0pKTtcbiAgICAgKi9cbiAgICBsaXN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbGlzdDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFNjcmlwdFJlZ2lzdHJ5IH07XG4iXSwibmFtZXMiOlsiU2NyaXB0UmVnaXN0cnkiLCJFdmVudEhhbmRsZXIiLCJjb25zdHJ1Y3RvciIsImFwcCIsIl9zY3JpcHRzIiwiX2xpc3QiLCJkZXN0cm95Iiwib2ZmIiwiYWRkIiwic2NyaXB0Iiwic2NyaXB0TmFtZSIsIl9fbmFtZSIsImhhc093blByb3BlcnR5Iiwic2V0VGltZW91dCIsInByb3RvdHlwZSIsInN3YXAiLCJvbGQiLCJpbmQiLCJpbmRleE9mIiwiZmlyZSIsImNvbnNvbGUiLCJ3YXJuIiwicHVzaCIsInN5c3RlbXMiLCJjb21wb25lbnRzIiwiX2NvbXBvbmVudHMiLCJhdHRyaWJ1dGVzIiwic2NyaXB0SW5zdGFuY2VzIiwic2NyaXB0SW5zdGFuY2VzSW5pdGlhbGl6ZWQiLCJsb29wSW5kZXgiLCJsZW5ndGgiLCJjb21wb25lbnQiLCJpdGVtcyIsIl9zY3JpcHRzSW5kZXgiLCJhd2FpdGluZyIsIl9zY3JpcHRzRGF0YSIsInNjcmlwdEluc3RhbmNlIiwiY3JlYXRlIiwicHJlbG9hZGluZyIsImkiLCJfX2luaXRpYWxpemVBdHRyaWJ1dGVzIiwiZW5hYmxlZCIsIl9pbml0aWFsaXplZCIsImluaXRpYWxpemUiLCJfcG9zdEluaXRpYWxpemVkIiwicG9zdEluaXRpYWxpemUiLCJyZW1vdmUiLCJuYW1lT3JUeXBlIiwic2NyaXB0VHlwZSIsImdldCIsInNwbGljZSIsIm5hbWUiLCJoYXMiLCJsaXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQSxjQUFjLFNBQVNDLFlBQVksQ0FBQztBQUN0QztBQUNKO0FBQ0E7QUFDQTtBQUNBO0VBQ0lDLFdBQVdBLENBQUNDLEdBQUcsRUFBRTtBQUNiLElBQUEsS0FBSyxFQUFFLENBQUE7SUFFUCxJQUFJLENBQUNBLEdBQUcsR0FBR0EsR0FBRyxDQUFBO0FBQ2QsSUFBQSxJQUFJLENBQUNDLFFBQVEsR0FBRyxFQUFHLENBQUE7SUFDbkIsSUFBSSxDQUFDQyxLQUFLLEdBQUcsRUFBRSxDQUFBO0FBQ25CLEdBQUE7QUFFQUMsRUFBQUEsT0FBT0Es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
