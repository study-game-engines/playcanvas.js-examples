/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Component } from '../component.js';

/**
 * A LayoutChildComponent enables the Entity to control the sizing applied to it by its parent
 * {@link LayoutGroupComponent}.
 *
 * @augments Component
 */
class LayoutChildComponent extends Component {
  /**
   * Create a new LayoutChildComponent.
   *
   * @param {import('./system.js').LayoutChildComponentSystem} system - The ComponentSystem that
   * created this Component.
   * @param {import('../../entity.js').Entity} entity - The Entity that this Component is
   * attached to.
   */
  constructor(system, entity) {
    super(system, entity);

    /** @private */
    this._minWidth = 0;
    /** @private */
    this._minHeight = 0;
    /** @private */
    this._maxWidth = null;
    /** @private */
    this._maxHeight = null;
    /** @private */
    this._fitWidthProportion = 0;
    /** @private */
    this._fitHeightProportion = 0;
    /** @private */
    this._excludeFromLayout = false;
  }

  /**
   * The minimum width the element should be rendered at.
   *
   * @type {number}
   */
  set minWidth(value) {
    if (value !== this._minWidth) {
      this._minWidth = value;
      this.fire('resize');
    }
  }
  get minWidth() {
    return this._minWidth;
  }

  /**
   * The minimum height the element should be rendered at.
   *
   * @type {number}
   */
  set minHeight(value) {
    if (value !== this._minHeight) {
      this._minHeight = value;
      this.fire('resize');
    }
  }
  get minHeight() {
    return this._minHeight;
  }

  /**
   * The maximum width the element should be rendered at.
   *
   * @type {number|null}
   */
  set maxWidth(value) {
    if (value !== this._maxWidth) {
      this._maxWidth = value;
      this.fire('resize');
    }
  }
  get maxWidth() {
    return this._maxWidth;
  }

  /**
   * The maximum height the element should be rendered at.
   *
   * @type {number|null}
   */
  set maxHeight(value) {
    if (value !== this._maxHeight) {
      this._maxHeight = value;
      this.fire('resize');
    }
  }
  get maxHeight() {
    return this._maxHeight;
  }

  /**
   * The amount of additional horizontal space that the element should take up, if necessary to
   * satisfy a Stretch/Shrink fitting calculation. This is specified as a proportion, taking into
   * account the proportion values of other siblings.
   *
   * @type {number}
   */
  set fitWidthProportion(value) {
    if (value !== this._fitWidthProportion) {
      this._fitWidthProportion = value;
      this.fire('resize');
    }
  }
  get fitWidthProportion() {
    return this._fitWidthProportion;
  }

  /**
   * The amount of additional vertical space that the element should take up, if necessary to
   * satisfy a Stretch/Shrink fitting calculation. This is specified as a proportion, taking into
   * account the proportion values of other siblings.
   *
   * @type {number}
   */
  set fitHeightProportion(value) {
    if (value !== this._fitHeightProportion) {
      this._fitHeightProportion = value;
      this.fire('resize');
    }
  }
  get fitHeightProportion() {
    return this._fitHeightProportion;
  }

  /**
   * If set to true, the child will be excluded from all layout calculations.
   *
   * @type {boolean}
   */
  set excludeFromLayout(value) {
    if (value !== this._excludeFromLayout) {
      this._excludeFromLayout = value;
      this.fire('resize');
    }
  }
  get excludeFromLayout() {
    return this._excludeFromLayout;
  }
}

export { LayoutChildComponent };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvZnJhbWV3b3JrL2NvbXBvbmVudHMvbGF5b3V0LWNoaWxkL2NvbXBvbmVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnQuanMnO1xuXG4vKipcbiAqIEEgTGF5b3V0Q2hpbGRDb21wb25lbnQgZW5hYmxlcyB0aGUgRW50aXR5IHRvIGNvbnRyb2wgdGhlIHNpemluZyBhcHBsaWVkIHRvIGl0IGJ5IGl0cyBwYXJlbnRcbiAqIHtAbGluayBMYXlvdXRHcm91cENvbXBvbmVudH0uXG4gKlxuICogQGF1Z21lbnRzIENvbXBvbmVudFxuICovXG5jbGFzcyBMYXlvdXRDaGlsZENvbXBvbmVudCBleHRlbmRzIENvbXBvbmVudCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IExheW91dENoaWxkQ29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4vc3lzdGVtLmpzJykuTGF5b3V0Q2hpbGRDb21wb25lbnRTeXN0ZW19IHN5c3RlbSAtIFRoZSBDb21wb25lbnRTeXN0ZW0gdGhhdFxuICAgICAqIGNyZWF0ZWQgdGhpcyBDb21wb25lbnQuXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uLy4uL2VudGl0eS5qcycpLkVudGl0eX0gZW50aXR5IC0gVGhlIEVudGl0eSB0aGF0IHRoaXMgQ29tcG9uZW50IGlzXG4gICAgICogYXR0YWNoZWQgdG8uXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc3lzdGVtLCBlbnRpdHkpIHtcbiAgICAgICAgc3VwZXIoc3lzdGVtLCBlbnRpdHkpO1xuXG4gICAgICAgIC8qKiBAcHJpdmF0ZSAqL1xuICAgICAgICB0aGlzLl9taW5XaWR0aCA9IDA7XG4gICAgICAgIC8qKiBAcHJpdmF0ZSAqL1xuICAgICAgICB0aGlzLl9taW5IZWlnaHQgPSAwO1xuICAgICAgICAvKiogQHByaXZhdGUgKi9cbiAgICAgICAgdGhpcy5fbWF4V2lkdGggPSBudWxsO1xuICAgICAgICAvKiogQHByaXZhdGUgKi9cbiAgICAgICAgdGhpcy5fbWF4SGVpZ2h0ID0gbnVsbDtcbiAgICAgICAgLyoqIEBwcml2YXRlICovXG4gICAgICAgIHRoaXMuX2ZpdFdpZHRoUHJvcG9ydGlvbiA9IDA7XG4gICAgICAgIC8qKiBAcHJpdmF0ZSAqL1xuICAgICAgICB0aGlzLl9maXRIZWlnaHRQcm9wb3J0aW9uID0gMDtcbiAgICAgICAgLyoqIEBwcml2YXRlICovXG4gICAgICAgIHRoaXMuX2V4Y2x1ZGVGcm9tTGF5b3V0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1pbmltdW0gd2lkdGggdGhlIGVsZW1lbnQgc2hvdWxkIGJlIHJlbmRlcmVkIGF0LlxuICAgICAqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBzZXQgbWluV2lkdGgodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB0aGlzLl9taW5XaWR0aCkge1xuICAgICAgICAgICAgdGhpcy5fbWluV2lkdGggPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgncmVzaXplJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgbWluV2lkdGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9taW5XaWR0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWluaW11bSBoZWlnaHQgdGhlIGVsZW1lbnQgc2hvdWxkIGJlIHJlbmRlcmVkIGF0LlxuICAgICAqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBzZXQgbWluSGVpZ2h0KHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdGhpcy5fbWluSGVpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLl9taW5IZWlnaHQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgncmVzaXplJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgbWluSGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWluSGVpZ2h0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtYXhpbXVtIHdpZHRoIHRoZSBlbGVtZW50IHNob3VsZCBiZSByZW5kZXJlZCBhdC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ8bnVsbH1cbiAgICAgKi9cbiAgICBzZXQgbWF4V2lkdGgodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB0aGlzLl9tYXhXaWR0aCkge1xuICAgICAgICAgICAgdGhpcy5fbWF4V2lkdGggPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgncmVzaXplJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgbWF4V2lkdGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXhXaWR0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWF4aW11bSBoZWlnaHQgdGhlIGVsZW1lbnQgc2hvdWxkIGJlIHJlbmRlcmVkIGF0LlxuICAgICAqXG4gICAgICogQHR5cGUge251bWJlcnxudWxsfVxuICAgICAqL1xuICAgIHNldCBtYXhIZWlnaHQodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB0aGlzLl9tYXhIZWlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMuX21heEhlaWdodCA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5maXJlKCdyZXNpemUnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBtYXhIZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXhIZWlnaHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGFtb3VudCBvZiBhZGRpdGlvbmFsIGhvcml6b250YWwgc3BhY2UgdGhhdCB0aGUgZWxlbWVudCBzaG91bGQgdGFrZSB1cCwgaWYgbmVjZXNzYXJ5IHRvXG4gICAgICogc2F0aXNmeSBhIFN0cmV0Y2gvU2hyaW5rIGZpdHRpbmcgY2FsY3VsYXRpb24uIFRoaXMgaXMgc3BlY2lmaWVkIGFzIGEgcHJvcG9ydGlvbiwgdGFraW5nIGludG9cbiAgICAgKiBhY2NvdW50IHRoZSBwcm9wb3J0aW9uIHZhbHVlcyBvZiBvdGhlciBzaWJsaW5ncy5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgc2V0IGZpdFdpZHRoUHJvcG9ydGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgIT09IHRoaXMuX2ZpdFdpZHRoUHJvcG9ydGlvbikge1xuICAgICAgICAgICAgdGhpcy5fZml0V2lkdGhQcm9wb3J0aW9uID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3Jlc2l6ZScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGZpdFdpZHRoUHJvcG9ydGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpdFdpZHRoUHJvcG9ydGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYW1vdW50IG9mIGFkZGl0aW9uYWwgdmVydGljYWwgc3BhY2UgdGhhdCB0aGUgZWxlbWVudCBzaG91bGQgdGFrZSB1cCwgaWYgbmVjZXNzYXJ5IHRvXG4gICAgICogc2F0aXNmeSBhIFN0cmV0Y2gvU2hyaW5rIGZpdHRpbmcgY2FsY3VsYXRpb24uIFRoaXMgaXMgc3BlY2lmaWVkIGFzIGEgcHJvcG9ydGlvbiwgdGFraW5nIGludG9cbiAgICAgKiBhY2NvdW50IHRoZSBwcm9wb3J0aW9uIHZhbHVlcyBvZiBvdGhlciBzaWJsaW5ncy5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgc2V0IGZpdEhlaWdodFByb3BvcnRpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB0aGlzLl9maXRIZWlnaHRQcm9wb3J0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9maXRIZWlnaHRQcm9wb3J0aW9uID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3Jlc2l6ZScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGZpdEhlaWdodFByb3BvcnRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maXRIZWlnaHRQcm9wb3J0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHNldCB0byB0cnVlLCB0aGUgY2hpbGQgd2lsbCBiZSBleGNsdWRlZCBmcm9tIGFsbCBsYXlvdXQgY2FsY3VsYXRpb25zLlxuICAgICAqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgc2V0IGV4Y2x1ZGVGcm9tTGF5b3V0KHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdGhpcy5fZXhjbHVkZUZyb21MYXlvdXQpIHtcbiAgICAgICAgICAgIHRoaXMuX2V4Y2x1ZGVGcm9tTGF5b3V0ID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3Jlc2l6ZScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGV4Y2x1ZGVGcm9tTGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZXhjbHVkZUZyb21MYXlvdXQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBMYXlvdXRDaGlsZENvbXBvbmVudCB9O1xuIl0sIm5hbWVzIjpbIkxheW91dENoaWxkQ29tcG9uZW50IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJzeXN0ZW0iLCJlbnRpdHkiLCJfbWluV2lkdGgiLCJfbWluSGVpZ2h0IiwiX21heFdpZHRoIiwiX21heEhlaWdodCIsIl9maXRXaWR0aFByb3BvcnRpb24iLCJfZml0SGVpZ2h0UHJvcG9ydGlvbiIsIl9leGNsdWRlRnJvbUxheW91dCIsIm1pbldpZHRoIiwidmFsdWUiLCJmaXJlIiwibWluSGVpZ2h0IiwibWF4V2lkdGgiLCJtYXhIZWlnaHQiLCJmaXRXaWR0aFByb3BvcnRpb24iLCJmaXRIZWlnaHRQcm9wb3J0aW9uIiwiZXhjbHVkZUZyb21MYXlvdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTtB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
