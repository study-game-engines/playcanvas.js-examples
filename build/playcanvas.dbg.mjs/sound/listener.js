/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../core/debug.js';
import { Vec3 } from '../math/vec3.js';
import { Mat4 } from '../math/mat4.js';

class Listener {
  constructor(manager) {
    this._manager = manager;
    this.position = new Vec3();
    this.velocity = new Vec3();
    this.orientation = new Mat4();
  }

  getPosition() {
    return this.position;
  }

  setPosition(position) {
    this.position.copy(position);
    const listener = this.listener;

    if (listener) {
      if ('positionX' in listener) {
        listener.positionX.value = position.x;
        listener.positionY.value = position.y;
        listener.positionZ.value = position.z;
      } else if (listener.setPosition) {
        listener.setPosition(position.x, position.y, position.z);
      }
    }
  }

  getVelocity() {
    Debug.warn('Listener#getVelocity is not implemented.');
    return this.velocity;
  }

  setVelocity(velocity) {
    Debug.warn('Listener#setVelocity is not implemented.');
  }

  setOrientation(orientation) {
    this.orientation.copy(orientation);
    const listener = this.listener;

    if (listener) {
      const m = orientation.data;

      if ('forwardX' in listener) {
        listener.forwardX.value = -m[8];
        listener.forwardY.value = -m[9];
        listener.forwardZ.value = -m[10];
        listener.upX.value = m[4];
        listener.upY.value = m[5];
        listener.upZ.value = m[6];
      } else if (listener.setOrientation) {
        listener.setOrientation(-m[8], -m[9], -m[10], m[4], m[5], m[6]);
      }
    }
  }

  getOrientation() {
    return this.orientation;
  }

  get listener() {
    const context = this._manager.context;
    return context ? context.listener : null;
  }

}

export { Listener };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zb3VuZC9saXN0ZW5lci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEZWJ1ZyB9IGZyb20gJy4uL2NvcmUvZGVidWcuanMnO1xuXG5pbXBvcnQgeyBWZWMzIH0gZnJvbSAnLi4vbWF0aC92ZWMzLmpzJztcbmltcG9ydCB7IE1hdDQgfSBmcm9tICcuLi9tYXRoL21hdDQuanMnO1xuXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9tYW5hZ2VyLmpzJykuU291bmRNYW5hZ2VyfSBTb3VuZE1hbmFnZXIgKi9cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGF1ZGlvIGxpc3RlbmVyIC0gdXNlZCBpbnRlcm5hbGx5LlxuICpcbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgTGlzdGVuZXIge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBsaXN0ZW5lciBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U291bmRNYW5hZ2VyfSBtYW5hZ2VyIC0gVGhlIHNvdW5kIG1hbmFnZXIuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWFuYWdlcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge1NvdW5kTWFuYWdlcn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX21hbmFnZXIgPSBtYW5hZ2VyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7VmVjM31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjMygpO1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge1ZlYzN9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gbmV3IFZlYzMoKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtNYXQ0fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vcmllbnRhdGlvbiA9IG5ldyBNYXQ0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7VmVjM30gVGhlIHBvc2l0aW9uIG9mIHRoZSBsaXN0ZW5lci5cbiAgICAgKi9cbiAgICBnZXRQb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zaXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1ZlYzN9IHBvc2l0aW9uIC0gVGhlIG5ldyBwb3NpdGlvbiBvZiB0aGUgbGlzdGVuZXIuXG4gICAgICovXG4gICAgc2V0UG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi5jb3B5KHBvc2l0aW9uKTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSB0aGlzLmxpc3RlbmVyO1xuICAgICAgICBpZiAobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGlmICgncG9zaXRpb25YJyBpbiBsaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLnBvc2l0aW9uWC52YWx1ZSA9IHBvc2l0aW9uLng7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIucG9zaXRpb25ZLnZhbHVlID0gcG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5wb3NpdGlvbloudmFsdWUgPSBwb3NpdGlvbi56O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsaXN0ZW5lci5zZXRQb3NpdGlvbikgeyAvLyBGaXJlZm94IChhbmQgbGVnYWN5IGJyb3dzZXJzKVxuICAgICAgICAgICAgICAgIGxpc3RlbmVyLnNldFBvc2l0aW9uKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHBvc2l0aW9uLnopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB2ZWxvY2l0eSBvZiB0aGUgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7VmVjM30gVGhlIHZlbG9jaXR5IG9mIHRoZSBsaXN0ZW5lci5cbiAgICAgKiBAZGVwcmVjYXRlZFxuICAgICAqL1xuICAgIGdldFZlbG9jaXR5KCkge1xuICAgICAgICBEZWJ1Zy53YXJuKCdMaXN0ZW5lciNnZXRWZWxvY2l0eSBpcyBub3QgaW1wbGVtZW50ZWQuJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnZlbG9jaXR5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmVsb2NpdHkgb2YgdGhlIGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtWZWMzfSB2ZWxvY2l0eSAtIFRoZSBuZXcgdmVsb2NpdHkgb2YgdGhlIGxpc3RlbmVyLlxuICAgICAqIEBkZXByZWNhdGVkXG4gICAgICovXG4gICAgc2V0VmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICAgICAgRGVidWcud2FybignTGlzdGVuZXIjc2V0VmVsb2NpdHkgaXMgbm90IGltcGxlbWVudGVkLicpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgb3JpZW50YXRpb24gbWF0cml4IG9mIHRoZSBsaXN0ZW5lci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TWF0NH0gb3JpZW50YXRpb24gLSBUaGUgbmV3IG9yaWVudGF0aW9uIG1hdHJpeCBvZiB0aGUgbGlzdGVuZXIuXG4gICAgICovXG4gICAgc2V0T3JpZW50YXRpb24ob3JpZW50YXRpb24pIHtcbiAgICAgICAgdGhpcy5vcmllbnRhdGlvbi5jb3B5KG9yaWVudGF0aW9uKTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSB0aGlzLmxpc3RlbmVyO1xuICAgICAgICBpZiAobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG0gPSBvcmllbnRhdGlvbi5kYXRhO1xuICAgICAgICAgICAgaWYgKCdmb3J3YXJkWCcgaW4gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5mb3J3YXJkWC52YWx1ZSA9IC1tWzhdO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmZvcndhcmRZLnZhbHVlID0gLW1bOV07XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuZm9yd2FyZFoudmFsdWUgPSAtbVsxMF07XG5cbiAgICAgICAgICAgICAgICBsaXN0ZW5lci51cFgudmFsdWUgPSBtWzRdO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLnVwWS52YWx1ZSA9IG1bNV07XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIudXBaLnZhbHVlID0gbVs2XTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGlzdGVuZXIuc2V0T3JpZW50YXRpb24pIHsgLy8gRmlyZWZveCAoYW5kIGxlZ2FjeSBicm93c2VycylcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5zZXRPcmllbnRhdGlvbigtbVs4XSwgLW1bOV0sIC1tWzEwXSwgbVs0XSwgbVs1XSwgbVs2XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIG9yaWVudGF0aW9uIG1hdHJpeCBvZiB0aGUgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7TWF0NH0gVGhlIG9yaWVudGF0aW9uIG1hdHJpeCBvZiB0aGUgbGlzdGVuZXIuXG4gICAgICovXG4gICAgZ2V0T3JpZW50YXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yaWVudGF0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7QXVkaW9MaXN0ZW5lcnxudWxsfVxuICAgICAqL1xuICAgIGdldCBsaXN0ZW5lcigpIHtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHRoaXMuX21hbmFnZXIuY29udGV4dDtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQgPyBjb250ZXh0Lmxpc3RlbmVyIDogbnVsbDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IExpc3RlbmVyIH07XG4iXSwibmFtZXMiOlsiTGlzdGVuZXIiLCJjb25zdHJ1Y3RvciIsIm1hbmFnZXIiLCJfbWFuYWdlciIsInBvc2l0aW9uIiwiVmVjMyIsInZlbG9jaXR5Iiwib3JpZW50YXRpb24iLCJNYXQ0IiwiZ2V0UG9zaXRpb24iLCJzZXRQb3NpdGlvbiIsImNvcHkiLCJsaXN0ZW5lciIsInBvc2l0aW9uWCIsInZhbHVlIiwieCIsInBvc2l0aW9uWSIsInkiLCJwb3NpdGlvbloiLCJ6IiwiZ2V0VmVsb2NpdHkiLCJEZWJ1ZyIsIndhcm4iLCJzZXRWZWxvY2l0eSIsInNldE9yaWVudGF0aW9uIiwibSIsImRhdGEiLCJmb3J3YXJkWCIsImZvcndhcmRZIiwiZm9yd2FyZFoiLCJ1cFgiLCJ1cFkiLCJ1cFoiLCJnZXRPcmllbnRhdGlvbiIsImNvbnRleHQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQVlBLE1BQU1BLFFBQU4sQ0FBZTtFQU1YQyxXQUFXLENBQUNDLE9BQUQsRUFBVTtJQUtqQixJQUFLQyxDQUFBQSxRQUFMLEdBQWdCRCxPQUFoQixDQUFBO0FBTUEsSUFBQSxJQUFBLENBQUtFLFFBQUwsR0FBZ0IsSUFBSUMsSUFBSixFQUFoQixDQUFBO0FBS0EsSUFBQSxJQUFBLENBQUtDLFFBQUwsR0FBZ0IsSUFBSUQsSUFBSixFQUFoQixDQUFBO0FBS0EsSUFBQSxJQUFBLENBQUtFLFdBQUwsR0FBbUIsSUFBSUMsSUFBSixFQUFuQixDQUFBO0FBQ0gsR0FBQTs7QUFPREMsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsSUFBQSxPQUFPLEtBQUtMLFFBQVosQ0FBQTtBQUNILEdBQUE7O0VBT0RNLFdBQVcsQ0FBQ04sUUFBRCxFQUFXO0FBQ2xCLElBQUEsSUFBQSxDQUFLQSxRQUFMLENBQWNPLElBQWQsQ0FBbUJQLFFBQW5CLENBQUEsQ0FB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
