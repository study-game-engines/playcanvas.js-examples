/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { EventHandler } from '../../core/event-handler.js';

/**
 * Components are used to attach functionality on a {@link Entity}. Components can receive update
 * events each frame, and expose properties to the PlayCanvas Editor.
 *
 * @property {boolean} enabled Enables or disables the component.
 * @augments EventHandler
 */
class Component extends EventHandler {
  /**
   * The ComponentSystem used to create this Component.
   *
   * @type {import('./system.js').ComponentSystem}
   */

  /**
   * The Entity that this Component is attached to.
   *
   * @type {import('../entity.js').Entity}
   */

  /**
   * Base constructor for a Component.
   *
   * @param {import('./system.js').ComponentSystem} system - The ComponentSystem used to create
   * this Component.
   * @param {import('../entity.js').Entity} entity - The Entity that this Component is attached
   * to.
   */
  constructor(system, entity) {
    super();
    this.system = void 0;
    this.entity = void 0;
    this.system = system;
    this.entity = entity;
    if (this.system.schema && !this._accessorsBuilt) {
      this.buildAccessors(this.system.schema);
    }
    this.on('set', function (name, oldValue, newValue) {
      this.fire('set_' + name, name, oldValue, newValue);
    });
    this.on('set_enabled', this.onSetEnabled, this);
  }

  /** @ignore */
  static _buildAccessors(obj, schema) {
    // Create getter/setter pairs for each property defined in the schema
    schema.forEach(function (descriptor) {
      // If the property descriptor is an object, it should have a `name`
      // member. If not, it should just be the plain property name.
      const name = typeof descriptor === 'object' ? descriptor.name : descriptor;
      Object.defineProperty(obj, name, {
        get: function () {
          return this.data[name];
        },
        set: function (value) {
          const data = this.data;
          const oldValue = data[name];
          data[name] = value;
          this.fire('set', name, oldValue, value);
        },
        configurable: true
      });
    });
    obj._accessorsBuilt = true;
  }

  /** @ignore */
  buildAccessors(schema) {
    Component._buildAccessors(this, schema);
  }

  /** @ignore */
  onSetEnabled(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (this.entity.enabled) {
        if (newValue) {
          this.onEnable();
        } else {
          this.onDisable();
        }
      }
    }
  }

  /** @ignore */
  onEnable() {}

  /** @ignore */
  onDisable() {}

  /** @ignore */
  onPostStateChange() {}

  /**
   * Access the component data directly. Usually you should access the data properties via the
   * individual properties as modifying this data directly will not fire 'set' events.
   *
   * @type {*}
   * @ignore
   */
  get data() {
    const record = this.system.store[this.entity.getGuid()];
    return record ? record.data : null;
  }
}

export { Component };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZnJhbWV3b3JrL2NvbXBvbmVudHMvY29tcG9uZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50SGFuZGxlciB9IGZyb20gJy4uLy4uL2NvcmUvZXZlbnQtaGFuZGxlci5qcyc7XG5cbi8qKlxuICogQ29tcG9uZW50cyBhcmUgdXNlZCB0byBhdHRhY2ggZnVuY3Rpb25hbGl0eSBvbiBhIHtAbGluayBFbnRpdHl9LiBDb21wb25lbnRzIGNhbiByZWNlaXZlIHVwZGF0ZVxuICogZXZlbnRzIGVhY2ggZnJhbWUsIGFuZCBleHBvc2UgcHJvcGVydGllcyB0byB0aGUgUGxheUNhbnZhcyBFZGl0b3IuXG4gKlxuICogQHByb3BlcnR5IHtib29sZWFufSBlbmFibGVkIEVuYWJsZXMgb3IgZGlzYWJsZXMgdGhlIGNvbXBvbmVudC5cbiAqIEBhdWdtZW50cyBFdmVudEhhbmRsZXJcbiAqL1xuY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgRXZlbnRIYW5kbGVyIHtcbiAgICAvKipcbiAgICAgKiBUaGUgQ29tcG9uZW50U3lzdGVtIHVzZWQgdG8gY3JlYXRlIHRoaXMgQ29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHR5cGUge2ltcG9ydCgnLi9zeXN0ZW0uanMnKS5Db21wb25lbnRTeXN0ZW19XG4gICAgICovXG4gICAgc3lzdGVtO1xuXG4gICAgLyoqXG4gICAgICogVGhlIEVudGl0eSB0aGF0IHRoaXMgQ29tcG9uZW50IGlzIGF0dGFjaGVkIHRvLlxuICAgICAqXG4gICAgICogQHR5cGUge2ltcG9ydCgnLi4vZW50aXR5LmpzJykuRW50aXR5fVxuICAgICAqL1xuICAgIGVudGl0eTtcblxuICAgIC8qKlxuICAgICAqIEJhc2UgY29uc3RydWN0b3IgZm9yIGEgQ29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4vc3lzdGVtLmpzJykuQ29tcG9uZW50U3lzdGVtfSBzeXN0ZW0gLSBUaGUgQ29tcG9uZW50U3lzdGVtIHVzZWQgdG8gY3JlYXRlXG4gICAgICogdGhpcyBDb21wb25lbnQuXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2VudGl0eS5qcycpLkVudGl0eX0gZW50aXR5IC0gVGhlIEVudGl0eSB0aGF0IHRoaXMgQ29tcG9uZW50IGlzIGF0dGFjaGVkXG4gICAgICogdG8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc3lzdGVtLCBlbnRpdHkpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnN5c3RlbSA9IHN5c3RlbTtcbiAgICAgICAgdGhpcy5lbnRpdHkgPSBlbnRpdHk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3lzdGVtLnNjaGVtYSAmJiAhdGhpcy5fYWNjZXNzb3JzQnVpbHQpIHtcbiAgICAgICAgICAgIHRoaXMuYnVpbGRBY2Nlc3NvcnModGhpcy5zeXN0ZW0uc2NoZW1hKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub24oJ3NldCcsIGZ1bmN0aW9uIChuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnc2V0XycgKyBuYW1lLCBuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLm9uKCdzZXRfZW5hYmxlZCcsIHRoaXMub25TZXRFbmFibGVkLCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKiogQGlnbm9yZSAqL1xuICAgIHN0YXRpYyBfYnVpbGRBY2Nlc3NvcnMob2JqLCBzY2hlbWEpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGdldHRlci9zZXR0ZXIgcGFpcnMgZm9yIGVhY2ggcHJvcGVydHkgZGVmaW5lZCBpbiB0aGUgc2NoZW1hXG4gICAgICAgIHNjaGVtYS5mb3JFYWNoKGZ1bmN0aW9uIChkZXNjcmlwdG9yKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgcHJvcGVydHkgZGVzY3JpcHRvciBpcyBhbiBvYmplY3QsIGl0IHNob3VsZCBoYXZlIGEgYG5hbWVgXG4gICAgICAgICAgICAvLyBtZW1iZXIuIElmIG5vdCwgaXQgc2hvdWxkIGp1c3QgYmUgdGhlIHBsYWluIHByb3BlcnR5IG5hbWUuXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKHR5cGVvZiBkZXNjcmlwdG9yID09PSAnb2JqZWN0JykgPyBkZXNjcmlwdG9yLm5hbWUgOiBkZXNjcmlwdG9yO1xuXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGFbbmFtZV07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IGRhdGFbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGRhdGFbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKCdzZXQnLCBuYW1lLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgb2JqLl9hY2Nlc3NvcnNCdWlsdCA9IHRydWU7XG4gICAgfVxuXG4gICAgLyoqIEBpZ25vcmUgKi9cbiAgICBidWlsZEFjY2Vzc29ycyhzY2hlbWEpIHtcbiAgICAgICAgQ29tcG9uZW50Ll9idWlsZEFjY2Vzc29ycyh0aGlzLCBzY2hlbWEpO1xuICAgIH1cblxuICAgIC8qKiBAaWdub3JlICovXG4gICAgb25TZXRFbmFibGVkKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdHkuZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRW5hYmxlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkRpc2FibGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQGlnbm9yZSAqL1xuICAgIG9uRW5hYmxlKCkge1xuICAgIH1cblxuICAgIC8qKiBAaWdub3JlICovXG4gICAgb25EaXNhYmxlKCkge1xuICAgIH1cblxuICAgIC8qKiBAaWdub3JlICovXG4gICAgb25Qb3N0U3RhdGVDaGFuZ2UoKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWNjZXNzIHRoZSBjb21wb25lbnQgZGF0YSBkaXJlY3RseS4gVXN1YWxseSB5b3Ugc2hvdWxkIGFjY2VzcyB0aGUgZGF0YSBwcm9wZXJ0aWVzIHZpYSB0aGVcbiAgICAgKiBpbmRpdmlkdWFsIHByb3BlcnRpZXMgYXMgbW9kaWZ5aW5nIHRoaXMgZGF0YSBkaXJlY3RseSB3aWxsIG5vdCBmaXJlICdzZXQnIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEB0eXBlIHsqfVxuICAgICAqIEBpZ25vcmVcbiAgICAgKi9cbiAgICBnZXQgZGF0YSgpIHtcbiAgICAgICAgY29uc3QgcmVjb3JkID0gdGhpcy5zeXN0ZW0uc3RvcmVbdGhpcy5lbnRpdHkuZ2V0R3VpZCgpXTtcbiAgICAgICAgcmV0dXJuIHJlY29yZCA/IHJlY29yZC5kYXRhIDogbnVsbDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IENvbXBvbmVudCB9O1xuIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsIkV2ZW50SGFuZGxlciIsImNvbnN0cnVjdG9yIiwic3lzdGVtIiwiZW50aXR5Iiwic2NoZW1hIiwiX2FjY2Vzc29yc0J1aWx0IiwiYnVpbGRBY2Nlc3NvcnMiLCJvbiIsIm5hbWUiLCJvbGRWYWx1ZSIsIm5ld1ZhbHVlIiwiZmlyZSIsIm9uU2V0RW5hYmxlZCIsIl9idWlsZEFjY2Vzc29ycyIsIm9iaiIsImZvckVhY2giLCJkZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJkYXRhIiwic2V0IiwidmFsdWUiLCJjb25maWd1cmFibGUiLCJlbmFibGVkIiwib25FbmFibGUiLCJvbkRpc2FibGUiLCJvblBvc3RTdGF0ZUNoYW5nZSIsInJlY29yZCIsInN0b3JlIiwiZ2V0R3VpZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUEsU0FBUyxTQUFTQyxZQUFZLENBQUM7QUFDakM7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7QUFHSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUdJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsV0FBV0EsQ0FBQ0MsTUFBTSxFQUFFQyxNQUFNLEVBQUU7QUFDeEIsSUFBQSxLQUFLLEVBQUUsQ0FBQTtBQUFDLElBQUEsSUFBQSxDQWxCWkQsTUFBTSxHQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQUEsSUFBQSxJQUFBLENBT05DLE1BQU0sR0FBQSxLQUFBLENBQUEsQ0FBQTtJQWFGLElBQUksQ0FBQ0QsTUFBTSxHQUFHQSxNQUFNLENBQUE7SUFDcEIsSUFBSSxDQUFDQyxNQUFNLEdBQUdBLE1BQU0sQ0FBQTtJQUVwQixJQUFJLElBQUksQ0FBQ0QsTUFBTSxDQUFDRSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUNDLGVBQWUsRUFBRTtNQUM3QyxJQUFJLENBQUNDLGNBQWMsQ0FBQyxJQUFJLENBQUNKLE1BQU0sQ0FBQ0UsTUFBTSxDQUFDLENBQUE7QUFDM0MsS0FBQTtJQUVBLElBQUksQ0FBQ0csRUFBRSxDQUFDLEtBQUssRUFBRSxVQUFVQyxJQUFJLEVBQUVD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
