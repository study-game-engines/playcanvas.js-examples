/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { ANIM_INTERRUPTION_NONE } from './constants.js';

/**
 * AnimTransitions represent connections in the controllers state graph between AnimStates. During
 * each frame, the controller tests to see if any of the AnimTransitions have the current AnimState
 * as their source (from) state. If so and the AnimTransitions parameter based conditions are met,
 * the controller will transition to the destination state.
 *
 * @ignore
 */
class AnimTransition {
  /**
   * Create a new AnimTransition.
   *
   * @param {object} options - Options.
   * @param {string} options.from - The state that this transition will exit from.
   * @param {string} options.to - The state that this transition will transition to.
   * @param {number} options.time - The duration of the transition in seconds. Defaults to 0.
   * @param {number} options.priority - Used to sort all matching transitions in ascending order.
   * The first transition in the list will be selected. Defaults to 0.
   * @param {object[]} options.conditions - A list of conditions which must pass for this
   * transition to be used. Defaults to [].
   * @param {number} options.exitTime - If provided, this transition will only be active for the
   * exact frame during which the source states progress passes the time specified. Given as a
   * normalized value of the source states duration. Values less than 1 will be checked every
   * animation loop. Defaults to null.
   * @param {number} options.transitionOffset - If provided, the destination state will begin
   * playing its animation at this time. Given in normalized time, based on the state's duration
   * and must be between 0 and 1. Defaults to null.
   * @param {string} options.interruptionSource - Defines whether another transition can
   * interrupt this one and which of the current or previous states transitions can do so. One of
   * pc.ANIM_INTERRUPTION_*. Defaults to pc.ANIM_INTERRUPTION_NONE.
   */
  constructor({
    from,
    to,
    time = 0,
    priority = 0,
    conditions = [],
    exitTime = null,
    transitionOffset = null,
    interruptionSource = ANIM_INTERRUPTION_NONE
  }) {
    this._from = from;
    this._to = to;
    this._time = time;
    this._priority = priority;
    this._conditions = conditions;
    this._exitTime = exitTime;
    this._transitionOffset = transitionOffset;
    this._interruptionSource = interruptionSource;
  }
  get from() {
    return this._from;
  }
  set to(value) {
    this._to = value;
  }
  get to() {
    return this._to;
  }
  get time() {
    return this._time;
  }
  get priority() {
    return this._priority;
  }
  get conditions() {
    return this._conditions;
  }
  get exitTime() {
    return this._exitTime;
  }
  get transitionOffset() {
    return this._transitionOffset;
  }
  get interruptionSource() {
    return this._interruptionSource;
  }
  get hasExitTime() {
    return !!this.exitTime;
  }
}

export { AnimTransition };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbS10cmFuc2l0aW9uLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvZnJhbWV3b3JrL2FuaW0vY29udHJvbGxlci9hbmltLXRyYW5zaXRpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBBTklNX0lOVEVSUlVQVElPTl9OT05FXG59IGZyb20gJy4vY29uc3RhbnRzLmpzJztcblxuLyoqXG4gKiBBbmltVHJhbnNpdGlvbnMgcmVwcmVzZW50IGNvbm5lY3Rpb25zIGluIHRoZSBjb250cm9sbGVycyBzdGF0ZSBncmFwaCBiZXR3ZWVuIEFuaW1TdGF0ZXMuIER1cmluZ1xuICogZWFjaCBmcmFtZSwgdGhlIGNvbnRyb2xsZXIgdGVzdHMgdG8gc2VlIGlmIGFueSBvZiB0aGUgQW5pbVRyYW5zaXRpb25zIGhhdmUgdGhlIGN1cnJlbnQgQW5pbVN0YXRlXG4gKiBhcyB0aGVpciBzb3VyY2UgKGZyb20pIHN0YXRlLiBJZiBzbyBhbmQgdGhlIEFuaW1UcmFuc2l0aW9ucyBwYXJhbWV0ZXIgYmFzZWQgY29uZGl0aW9ucyBhcmUgbWV0LFxuICogdGhlIGNvbnRyb2xsZXIgd2lsbCB0cmFuc2l0aW9uIHRvIHRoZSBkZXN0aW5hdGlvbiBzdGF0ZS5cbiAqXG4gKiBAaWdub3JlXG4gKi9cbmNsYXNzIEFuaW1UcmFuc2l0aW9uIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgQW5pbVRyYW5zaXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAtIE9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZnJvbSAtIFRoZSBzdGF0ZSB0aGF0IHRoaXMgdHJhbnNpdGlvbiB3aWxsIGV4aXQgZnJvbS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50byAtIFRoZSBzdGF0ZSB0aGF0IHRoaXMgdHJhbnNpdGlvbiB3aWxsIHRyYW5zaXRpb24gdG8uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG9wdGlvbnMudGltZSAtIFRoZSBkdXJhdGlvbiBvZiB0aGUgdHJhbnNpdGlvbiBpbiBzZWNvbmRzLiBEZWZhdWx0cyB0byAwLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvcHRpb25zLnByaW9yaXR5IC0gVXNlZCB0byBzb3J0IGFsbCBtYXRjaGluZyB0cmFuc2l0aW9ucyBpbiBhc2NlbmRpbmcgb3JkZXIuXG4gICAgICogVGhlIGZpcnN0IHRyYW5zaXRpb24gaW4gdGhlIGxpc3Qgd2lsbCBiZSBzZWxlY3RlZC4gRGVmYXVsdHMgdG8gMC5cbiAgICAgKiBAcGFyYW0ge29iamVjdFtdfSBvcHRpb25zLmNvbmRpdGlvbnMgLSBBIGxpc3Qgb2YgY29uZGl0aW9ucyB3aGljaCBtdXN0IHBhc3MgZm9yIHRoaXNcbiAgICAgKiB0cmFuc2l0aW9uIHRvIGJlIHVzZWQuIERlZmF1bHRzIHRvIFtdLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvcHRpb25zLmV4aXRUaW1lIC0gSWYgcHJvdmlkZWQsIHRoaXMgdHJhbnNpdGlvbiB3aWxsIG9ubHkgYmUgYWN0aXZlIGZvciB0aGVcbiAgICAgKiBleGFjdCBmcmFtZSBkdXJpbmcgd2hpY2ggdGhlIHNvdXJjZSBzdGF0ZXMgcHJvZ3Jlc3MgcGFzc2VzIHRoZSB0aW1lIHNwZWNpZmllZC4gR2l2ZW4gYXMgYVxuICAgICAqIG5vcm1hbGl6ZWQgdmFsdWUgb2YgdGhlIHNvdXJjZSBzdGF0ZXMgZHVyYXRpb24uIFZhbHVlcyBsZXNzIHRoYW4gMSB3aWxsIGJlIGNoZWNrZWQgZXZlcnlcbiAgICAgKiBhbmltYXRpb24gbG9vcC4gRGVmYXVsdHMgdG8gbnVsbC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gb3B0aW9ucy50cmFuc2l0aW9uT2Zmc2V0IC0gSWYgcHJvdmlkZWQsIHRoZSBkZXN0aW5hdGlvbiBzdGF0ZSB3aWxsIGJlZ2luXG4gICAgICogcGxheWluZyBpdHMgYW5pbWF0aW9uIGF0IHRoaXMgdGltZS4gR2l2ZW4gaW4gbm9ybWFsaXplZCB0aW1lLCBiYXNlZCBvbiB0aGUgc3RhdGUncyBkdXJhdGlvblxuICAgICAqIGFuZCBtdXN0IGJlIGJldHdlZW4gMCBhbmQgMS4gRGVmYXVsdHMgdG8gbnVsbC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5pbnRlcnJ1cHRpb25Tb3VyY2UgLSBEZWZpbmVzIHdoZXRoZXIgYW5vdGhlciB0cmFuc2l0aW9uIGNhblxuICAgICAqIGludGVycnVwdCB0aGlzIG9uZSBhbmQgd2hpY2ggb2YgdGhlIGN1cnJlbnQgb3IgcHJldmlvdXMgc3RhdGVzIHRyYW5zaXRpb25zIGNhbiBkbyBzby4gT25lIG9mXG4gICAgICogcGMuQU5JTV9JTlRFUlJVUFRJT05fKi4gRGVmYXVsdHMgdG8gcGMuQU5JTV9JTlRFUlJVUFRJT05fTk9ORS5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih7IGZyb20sIHRvLCB0aW1lID0gMCwgcHJpb3JpdHkgPSAwLCBjb25kaXRpb25zID0gW10sIGV4aXRUaW1lID0gbnVsbCwgdHJhbnNpdGlvbk9mZnNldCA9IG51bGwsIGludGVycnVwdGlvblNvdXJjZSA9IEFOSU1fSU5URVJSVVBUSU9OX05PTkUgfSkge1xuICAgICAgICB0aGlzLl9mcm9tID0gZnJvbTtcbiAgICAgICAgdGhpcy5fdG8gPSB0bztcbiAgICAgICAgdGhpcy5fdGltZSA9IHRpbWU7XG4gICAgICAgIHRoaXMuX3ByaW9yaXR5ID0gcHJpb3JpdHk7XG4gICAgICAgIHRoaXMuX2NvbmRpdGlvbnMgPSBjb25kaXRpb25zO1xuICAgICAgICB0aGlzLl9leGl0VGltZSA9IGV4aXRUaW1lO1xuICAgICAgICB0aGlzLl90cmFuc2l0aW9uT2Zmc2V0ID0gdHJhbnNpdGlvbk9mZnNldDtcbiAgICAgICAgdGhpcy5faW50ZXJydXB0aW9uU291cmNlID0gaW50ZXJydXB0aW9uU291cmNlO1xuICAgIH1cblxuICAgIGdldCBmcm9tKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZnJvbTtcbiAgICB9XG5cbiAgICBzZXQgdG8odmFsdWUpIHtcbiAgICAgICAgdGhpcy5fdG8gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgdG8oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90bztcbiAgICB9XG5cbiAgICBnZXQgdGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RpbWU7XG4gICAgfVxuXG4gICAgZ2V0IHByaW9yaXR5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcHJpb3JpdHk7XG4gICAgfVxuXG4gICAgZ2V0IGNvbmRpdGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb25kaXRpb25zO1xuICAgIH1cblxuICAgIGdldCBleGl0VGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V4aXRUaW1lO1xuICAgIH1cblxuICAgIGdldCB0cmFuc2l0aW9uT2Zmc2V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdHJhbnNpdGlvbk9mZnNldDtcbiAgICB9XG5cbiAgICBnZXQgaW50ZXJydXB0aW9uU291cmNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJydXB0aW9uU291cmNlO1xuICAgIH1cblxuICAgIGdldCBoYXNFeGl0VGltZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5leGl0VGltZTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEFuaW1UcmFuc2l0aW9uIH07XG4iXSwibmFtZXMiOlsiQW5pbVRyYW5zaXRpb24iLCJjb25zdHJ1Y3RvciIsImZyb20iLCJ0byIsInRpbWUiLCJwcmlvcml0eSIsImNvbmRpdGlvbnMiLCJleGl0VGltZSIsInRyYW5zaXRpb25PZmZzZXQiLCJpbnRlcnJ1cHRpb25Tb3VyY2UiLCJBTklNX0lOVEVSUlVQVElPTl9OT05FIiwiX2Zyb20iLCJfdG8iLCJfdGltZSIsIl9wcmlvcml0eSIsIl9jb25kaXRpb25zIiwiX2V4aXRUaW1lIiwiX3RyYW5zaXRpb25PZmZzZXQiLCJfaW50ZXJydXB0aW9uU291cmNlIiwidmFsdWUiLCJoYXNFeGl0VGltZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQSxjQUFjLENBQUM7QUFDakI7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsV0FBV0EsQ0FBQztJQUFFQyxJQUFJO0lBQUVDLEVBQUU7QUFBRUMsSUFBQUEsSUFBSSxHQUFHLENBQUM7QUFBRUMsSUFBQUEsUUFBUSxHQUFHLENBQUM7QUFBRUMsSUFBQUEsVUFBVSxHQUFHLEVBQUU7QUFBRUMsSUFBQUEsUUFBUSxHQUFHLElBQUk7QUFBRUMsSUFBQUEsZ0JBQWdCLEdBQUcsSUFBSTtBQUFFQyxJQUFBQSxrQkFBa0IsR0FBR0Msc0JBQUFBO0FBQXVCLEdBQUMsRUFBRTtJQUN0SixJQUFJLENBQUNDLEtBQUssR0FBR1QsSUFBSSxDQUFBO0lBQ2pCLElBQUksQ0FBQ1UsR0FBRyxHQUFHVCxFQUFFLENBQUE7SUFDYixJQUFJLENBQUNVLEtBQUssR0FBR1QsSUFBSSxDQUFBO0lBQ2pCLElBQUksQ0FBQ1UsU0FBUyxHQUFHVCxRQUFRLENBQUE7SUFDekIsSUFBSSxDQUFDVSxXQUFXLEdBQUdULFVBQVUsQ0FBQTtJQUM3QixJQUFJLENBQUNVLFNBQVMsR0FBR1QsUUFBUSxDQUFBO0lBQ3pCLElBQUksQ0FBQ1UsaUJBQWlCLEdBQUdULGdCQUFnQixDQUFBO0lBQ3pDLElBQUksQ0FBQ1UsbUJBQW1CLEdBQUdULGtCQUFrQixDQUFBO0FBQ2pELEdBQUE7RUFFQSxJQUFJUCxJQUFJQSxHQUFHO0lBQ1AsT0FBTyxJQUFJLENBQUNTLEtBQUssQ0FBQTtBQUNyQixHQUFBO0VBRUEsSUFBSVIsRUFBRUEsQ0FBQ2dCLEtBQUssRUFBRTtJQUNWLElBQUksQ0FBQ1AsR0FBRyxHQUFHTyxLQUFLLENBQUE7QUFDcEIsR0FBQTtFQUVBLElBQUloQixFQUFFQSxHQUFHO0lBQ0wsT0FBTyxJQUFJLENBQUNTLEdBQUcsQ0FBQTtBQUNuQixHQUFBO0VBRUEsSUFBSVIsSUFBSUEsR0FBRztJQUNQLE9BQU8sSUFBSSxDQUFDUyxLQUFLLENBQUE7QUFDckIsR0FBQTtFQUVBLElBQUlSLFFBQVFBLEdBQUc7SUFDWCxPQUFPLElBQUksQ0FBQ1MsU0FBUyxDQUFBO0FBQ3pCLEdBQUE7RUFFQSxJQUFJUixVQUFVQSxHQUFHO0lBQ2IsT0FBTyxJQUFJLENBQUNTLFdBQVcsQ0FBQTtBQUMzQixHQUFBO0VBRUEsSUFBSVIsUUFBUUEsR0FBRztJQUNYLE9BQU8sSUFBSSxDQUFDUyxTQUFTLENBQUE7QUFDekIsR0FBQTtFQUVBLElBQUlSLGdCQUFnQkEsR0FBRztJQUNuQixPQUFPLElBQUksQ0FBQ1MsaUJBQWlCLENBQUE7QUFDakMsR0FBQTtFQUVBLElBQUlSLGtCQUFrQkEsR0FBRztJQUNyQixPQUFPLElBQUksQ0FBQ1MsbUJBQW1CLENBQUE7QUFDbkMsR0FBQTtFQUVBLElBQUlFLFdBQVdBLEdBQUc7QUFDZCxJQUFBLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQ2IsUUFBUSxDQUFBO0FBQzFCLEdBQUE7QUFDSjs7OzsifQ==
