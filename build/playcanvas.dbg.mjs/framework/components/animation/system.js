/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Component } from '../component.js';
import { ComponentSystem } from '../system.js';
import { AnimationComponent } from './component.js';
import { AnimationComponentData } from './data.js';

const _schema = ['enabled'];

/**
 * The AnimationComponentSystem manages creating and deleting AnimationComponents.
 *
 * @augments ComponentSystem
 */
class AnimationComponentSystem extends ComponentSystem {
  /**
   * Create an AnimationComponentSystem instance.
   *
   * @param {import('../../app-base.js').AppBase} app - The application managing this system.
   * @hideconstructor
   */
  constructor(app) {
    super(app);
    this.id = 'animation';
    this.ComponentType = AnimationComponent;
    this.DataType = AnimationComponentData;
    this.schema = _schema;
    this.on('beforeremove', this.onBeforeRemove, this);
    this.app.systems.on('update', this.onUpdate, this);
  }

  /**
   * Called during {@link ComponentSystem#addComponent} to initialize the component data in the
   * store. This can be overridden by derived Component Systems and either called by the derived
   * System or replaced entirely.
   *
   * @param {AnimationComponent} component - The component being initialized.
   * @param {object} data - The data block used to initialize the component.
   * @param {Array<string | {name: string, type: string}>} properties - The array of property descriptors for the component.
   * A descriptor can be either a plain property name, or an object specifying the name and type.
   * @ignore
   */
  initializeComponentData(component, data, properties) {
    // properties need to be set in a specific order due to some setters in the component
    // having extra logic. `assets` need to be last as it checks other properties
    // to see if it should play the animation
    properties = ['activate', 'enabled', 'loop', 'speed', 'assets'];
    for (const property of properties) {
      if (data.hasOwnProperty(property)) {
        component[property] = data[property];
      }
    }
    super.initializeComponentData(component, data, _schema);
  }

  /**
   * Create a clone of component. This creates a copy of all component data variables.
   *
   * @param {import('../../entity.js').Entity} entity - The entity to clone the component from.
   * @param {import('../../entity.js').Entity} clone - The entity to clone the component into.
   * @returns {AnimationComponent} The newly cloned component.
   * @ignore
   */
  cloneComponent(entity, clone) {
    this.addComponent(clone, {});
    clone.animation.assets = entity.animation.assets.slice();
    clone.animation.speed = entity.animation.speed;
    clone.animation.loop = entity.animation.loop;
    clone.animation.activate = entity.animation.activate;
    clone.animation.enabled = entity.animation.enabled;
    const clonedAnimations = {};
    const animations = entity.animation.animations;
    for (const key in animations) {
      if (animations.hasOwnProperty(key)) {
        clonedAnimations[key] = animations[key];
      }
    }
    clone.animation.animations = clonedAnimations;
    const clonedAnimationsIndex = {};
    const animationsIndex = entity.animation.animationsIndex;
    for (const key in animationsIndex) {
      if (animationsIndex.hasOwnProperty(key)) {
        clonedAnimationsIndex[key] = animationsIndex[key];
      }
    }
    clone.animation.animationsIndex = clonedAnimationsIndex;
    return clone.animation;
  }

  /**
   * @param {import('../../entity.js').Entity} entity - The entity having its component removed.
   * @param {AnimationComponent} component - The component being removed.
   * @private
   */
  onBeforeRemove(entity, component) {
    component.onBeforeRemove();
  }

  /**
   * @param {number} dt - The time delta since the last frame.
   * @private
   */
  onUpdate(dt) {
    const components = this.store;
    for (const id in components) {
      if (components.hasOwnProperty(id)) {
        const component = components[id];
        if (component.data.enabled && component.entity.enabled) {
          component.entity.animation.update(dt);
        }
      }
    }
  }
  destroy() {
    super.destroy();
    this.app.systems.off('update', this.onUpdate, this);
  }
}
Component._buildAccessors(AnimationComponent.prototype, _schema);

export { AnimationComponentSystem };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvZnJhbWV3b3JrL2NvbXBvbmVudHMvYW5pbWF0aW9uL3N5c3RlbS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnQuanMnO1xuaW1wb3J0IHsgQ29tcG9uZW50U3lzdGVtIH0gZnJvbSAnLi4vc3lzdGVtLmpzJztcblxuaW1wb3J0IHsgQW5pbWF0aW9uQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnQuanMnO1xuaW1wb3J0IHsgQW5pbWF0aW9uQ29tcG9uZW50RGF0YSB9IGZyb20gJy4vZGF0YS5qcyc7XG5cbmNvbnN0IF9zY2hlbWEgPSBbXG4gICAgJ2VuYWJsZWQnXG5dO1xuXG4vKipcbiAqIFRoZSBBbmltYXRpb25Db21wb25lbnRTeXN0ZW0gbWFuYWdlcyBjcmVhdGluZyBhbmQgZGVsZXRpbmcgQW5pbWF0aW9uQ29tcG9uZW50cy5cbiAqXG4gKiBAYXVnbWVudHMgQ29tcG9uZW50U3lzdGVtXG4gKi9cbmNsYXNzIEFuaW1hdGlvbkNvbXBvbmVudFN5c3RlbSBleHRlbmRzIENvbXBvbmVudFN5c3RlbSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuIEFuaW1hdGlvbkNvbXBvbmVudFN5c3RlbSBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi8uLi9hcHAtYmFzZS5qcycpLkFwcEJhc2V9IGFwcCAtIFRoZSBhcHBsaWNhdGlvbiBtYW5hZ2luZyB0aGlzIHN5c3RlbS5cbiAgICAgKiBAaGlkZWNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoYXBwKSB7XG4gICAgICAgIHN1cGVyKGFwcCk7XG5cbiAgICAgICAgdGhpcy5pZCA9ICdhbmltYXRpb24nO1xuXG4gICAgICAgIHRoaXMuQ29tcG9uZW50VHlwZSA9IEFuaW1hdGlvbkNvbXBvbmVudDtcbiAgICAgICAgdGhpcy5EYXRhVHlwZSA9IEFuaW1hdGlvbkNvbXBvbmVudERhdGE7XG5cbiAgICAgICAgdGhpcy5zY2hlbWEgPSBfc2NoZW1hO1xuXG4gICAgICAgIHRoaXMub24oJ2JlZm9yZXJlbW92ZScsIHRoaXMub25CZWZvcmVSZW1vdmUsIHRoaXMpO1xuICAgICAgICB0aGlzLmFwcC5zeXN0ZW1zLm9uKCd1cGRhdGUnLCB0aGlzLm9uVXBkYXRlLCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgZHVyaW5nIHtAbGluayBDb21wb25lbnRTeXN0ZW0jYWRkQ29tcG9uZW50fSB0byBpbml0aWFsaXplIHRoZSBjb21wb25lbnQgZGF0YSBpbiB0aGVcbiAgICAgKiBzdG9yZS4gVGhpcyBjYW4gYmUgb3ZlcnJpZGRlbiBieSBkZXJpdmVkIENvbXBvbmVudCBTeXN0ZW1zIGFuZCBlaXRoZXIgY2FsbGVkIGJ5IHRoZSBkZXJpdmVkXG4gICAgICogU3lzdGVtIG9yIHJlcGxhY2VkIGVudGlyZWx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBbmltYXRpb25Db21wb25lbnR9IGNvbXBvbmVudCAtIFRoZSBjb21wb25lbnQgYmVpbmcgaW5pdGlhbGl6ZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBUaGUgZGF0YSBibG9jayB1c2VkIHRvIGluaXRpYWxpemUgdGhlIGNvbXBvbmVudC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZyB8IHtuYW1lOiBzdHJpbmcsIHR5cGU6IHN0cmluZ30+fSBwcm9wZXJ0aWVzIC0gVGhlIGFycmF5IG9mIHByb3BlcnR5IGRlc2NyaXB0b3JzIGZvciB0aGUgY29tcG9uZW50LlxuICAgICAqIEEgZGVzY3JpcHRvciBjYW4gYmUgZWl0aGVyIGEgcGxhaW4gcHJvcGVydHkgbmFtZSwgb3IgYW4gb2JqZWN0IHNwZWNpZnlpbmcgdGhlIG5hbWUgYW5kIHR5cGUuXG4gICAgICogQGlnbm9yZVxuICAgICAqL1xuICAgIGluaXRpYWxpemVDb21wb25lbnREYXRhKGNvbXBvbmVudCwgZGF0YSwgcHJvcGVydGllcykge1xuICAgICAgICAvLyBwcm9wZXJ0aWVzIG5lZWQgdG8gYmUgc2V0IGluIGEgc3BlY2lmaWMgb3JkZXIgZHVlIHRvIHNvbWUgc2V0dGVycyBpbiB0aGUgY29tcG9uZW50XG4gICAgICAgIC8vIGhhdmluZyBleHRyYSBsb2dpYy4gYGFzc2V0c2AgbmVlZCB0byBiZSBsYXN0IGFzIGl0IGNoZWNrcyBvdGhlciBwcm9wZXJ0aWVzXG4gICAgICAgIC8vIHRvIHNlZSBpZiBpdCBzaG91bGQgcGxheSB0aGUgYW5pbWF0aW9uXG4gICAgICAgIHByb3BlcnRpZXMgPSBbJ2FjdGl2YXRlJywgJ2VuYWJsZWQnLCAnbG9vcCcsICdzcGVlZCcsICdhc3NldHMnXTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wZXJ0eSBvZiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnRbcHJvcGVydHldID0gZGF0YVtwcm9wZXJ0eV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlci5pbml0aWFsaXplQ29tcG9uZW50RGF0YShjb21wb25lbnQsIGRhdGEsIF9zY2hlbWEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIGNsb25lIG9mIGNvbXBvbmVudC4gVGhpcyBjcmVhdGVzIGEgY29weSBvZiBhbGwgY29tcG9uZW50IGRhdGEgdmFyaWFibGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uLy4uL2VudGl0eS5qcycpLkVudGl0eX0gZW50aXR5IC0gVGhlIGVudGl0eSB0byBjbG9uZSB0aGUgY29tcG9uZW50IGZyb20uXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uLy4uL2VudGl0eS5qcycpLkVudGl0eX0gY2xvbmUgLSBUaGUgZW50aXR5IHRvIGNsb25lIHRoZSBjb21wb25lbnQgaW50by5cbiAgICAgKiBAcmV0dXJucyB7QW5pbWF0aW9uQ29tcG9uZW50fSBUaGUgbmV3bHkgY2xvbmVkIGNvbXBvbmVudC5cbiAgICAgKiBAaWdub3JlXG4gICAgICovXG4gICAgY2xvbmVDb21wb25lbnQoZW50aXR5LCBjbG9uZSkge1xuICAgICAgICB0aGlzLmFkZENvbXBvbmVudChjbG9uZSwge30pO1xuXG4gICAgICAgIGNsb25lLmFuaW1hdGlvbi5hc3NldHMgPSBlbnRpdHkuYW5pbWF0aW9uLmFzc2V0cy5zbGljZSgpO1xuICAgICAgICBjbG9uZS5hbmltYXRpb24uc3BlZWQgPSBlbnRpdHkuYW5pbWF0aW9uLnNwZWVkO1xuICAgICAgICBjbG9uZS5hbmltYXRpb24ubG9vcCA9IGVudGl0eS5hbmltYXRpb24ubG9vcDtcbiAgICAgICAgY2xvbmUuYW5pbWF0aW9uLmFjdGl2YXRlID0gZW50aXR5LmFuaW1hdGlvbi5hY3RpdmF0ZTtcbiAgICAgICAgY2xvbmUuYW5pbWF0aW9uLmVuYWJsZWQgPSBlbnRpdHkuYW5pbWF0aW9uLmVuYWJsZWQ7XG5cbiAgICAgICAgY29uc3QgY2xvbmVkQW5pbWF0aW9ucyA9IHt9O1xuICAgICAgICBjb25zdCBhbmltYXRpb25zID0gZW50aXR5LmFuaW1hdGlvbi5hbmltYXRpb25zO1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBhbmltYXRpb25zKSB7XG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgY2xvbmVkQW5pbWF0aW9uc1trZXldID0gYW5pbWF0aW9uc1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNsb25lLmFuaW1hdGlvbi5hbmltYXRpb25zID0gY2xvbmVkQW5pbWF0aW9ucztcblxuICAgICAgICBjb25zdCBjbG9uZWRBbmltYXRpb25zSW5kZXggPSB7fTtcbiAgICAgICAgY29uc3QgYW5pbWF0aW9uc0luZGV4ID0gZW50aXR5LmFuaW1hdGlvbi5hbmltYXRpb25zSW5kZXg7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGFuaW1hdGlvbnNJbmRleCkge1xuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbnNJbmRleC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgY2xvbmVkQW5pbWF0aW9uc0luZGV4W2tleV0gPSBhbmltYXRpb25zSW5kZXhba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjbG9uZS5hbmltYXRpb24uYW5pbWF0aW9uc0luZGV4ID0gY2xvbmVkQW5pbWF0aW9uc0luZGV4O1xuXG4gICAgICAgIHJldHVybiBjbG9uZS5hbmltYXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uLy4uL2VudGl0eS5qcycpLkVudGl0eX0gZW50aXR5IC0gVGhlIGVudGl0eSBoYXZpbmcgaXRzIGNvbXBvbmVudCByZW1vdmVkLlxuICAgICAqIEBwYXJhbSB7QW5pbWF0aW9uQ29tcG9uZW50fSBjb21wb25lbnQgLSBUaGUgY29tcG9uZW50IGJlaW5nIHJlbW92ZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkJlZm9yZVJlbW92ZShlbnRpdHksIGNvbXBvbmVudCkge1xuICAgICAgICBjb21wb25lbnQub25CZWZvcmVSZW1vdmUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZHQgLSBUaGUgdGltZSBkZWx0YSBzaW5jZSB0aGUgbGFzdCBmcmFtZS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uVXBkYXRlKGR0KSB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0aGlzLnN0b3JlO1xuXG4gICAgICAgIGZvciAoY29uc3QgaWQgaW4gY29tcG9uZW50cykge1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50c1tpZF07XG5cbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50LmRhdGEuZW5hYmxlZCAmJiBjb21wb25lbnQuZW50aXR5LmVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50LmVudGl0eS5hbmltYXRpb24udXBkYXRlKGR0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBzdXBlci5kZXN0cm95KCk7XG5cbiAgICAgICAgdGhpcy5hcHAuc3lzdGVtcy5vZmYoJ3VwZGF0ZScsIHRoaXMub25VcGRhdGUsIHRoaXMpO1xuICAgIH1cbn1cblxuQ29tcG9uZW50Ll9idWlsZEFjY2Vzc29ycyhBbmltYXRpb25Db21wb25lbnQucHJvdG90eXBlLCBfc2NoZW1hKTtcblxuZXhwb3J0IHsgQW5pbWF0aW9uQ29tcG9uZW50U3lzdGVtIH07XG4iXSwibmFtZXMiOlsiX3NjaGVtYSIsIkFuaW1hdGlvbkNvbXBvbmVudFN5c3RlbSIsIkNvbXBvbmVudFN5c3RlbSIsImNvbnN0cnVjdG9yIiwiYXBwIiwiaWQiLCJDb21wb25lbnRUeXBlIiwiQW5pbWF0aW9uQ29tcG9uZW50IiwiRGF0YVR5cGUiLCJBbmltYXRpb25Db21wb25lbnREYXRhIiwic2NoZW1hIiwib24iLCJvbkJlZm9yZVJlbW92ZSIsInN5c3RlbXMiLCJvblVwZGF0ZSIsImluaXRpYWxpemVDb21wb25lbnREYXRhIiwiY29tcG9uZW50IiwiZGF0YSIsInByb3BlcnRpZXMiLCJwcm9wZXJ0eSIsImhhc093blByb3BlcnR5IiwiY2xvbmVDb21wb25lbnQiLCJlbnRpdHkiLCJjbG9uZSIsImFkZENvbXBvbmVudCIsImFuaW1hdGlvbiIsImFzc2V0cyIsInNsaWNlIiwic3BlZWQiLCJsb29wIiwiYWN0aXZhdGUiLCJlbmFibGVkIiwiY2xvbmVkQW5pbWF0aW9ucyIsImFuaW1hdGlvbnMiLCJrZXkiLCJjbG9uZWRBbmltYXRpb25zSW5kZXgiLCJhbmltYXRpb25zSW5kZXgiLCJkdCIsImNvbXBvbmVudHMiLCJzdG9yZSIsInVwZGF0ZSIsImRlc3Ryb3kiLCJvZmYiLCJDb21wb25lbnQiLCJfYnVpbGRBY2Nlc3NvcnMiLCJwcm90b3R5cGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFNQSxNQUFNQSxPQUFPLEdBQUcsQ0FDWixTQUFTLENBQ1osQ0FBQTs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsd0JBQXdCLFNBQVNDLGVBQWUsQ0FBQztBQUNuRDtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDSUMsV0FBV0EsQ0FBQ0MsR0FBRyxFQUFFO0lBQ2IsS0FBSyxDQUFDQSxHQUFHLENBQUMsQ0FBQTtJQUVWLElBQUksQ0FBQ0MsRUFBRSxHQUFHLFdBQVcsQ0FBQTtJQUVyQixJQUFJLENBQUNDLGFBQWEsR0FBR0Msa0JBQWtCLENBQUE7SUFDdkMsSUFBSSxDQUFDQyxRQUFRLEdBQUdDLHNCQUFzQixDQUFBO0lBRXRDLElBQUksQ0FBQ0MsTUFBTSxHQUFHVixPQUFPLENBQUE7SUFFckIsSUFBSSxDQUFDVyxFQUFFLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQ0MsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ2xELElBQUEsSUFBSSxDQUFDUixHQUFHLENBQUNTLE9BQU8sQ0FBQ0YsRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUNHLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUN0RCxHQUFBOztBQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsdUJBQXVCQSxDQUFDQyxTQUFTLEVBQUVDLElBQUksRUFBRUMsVUFBVSxFQUFFO0FBQ2pEO0FBQ0E7QUFDQTtJQUNBQSxVQUFVLEdBQUcsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDL0QsSUFBQSxLQUFL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
