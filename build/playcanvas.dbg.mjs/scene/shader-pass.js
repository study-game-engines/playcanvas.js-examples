/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../core/debug.js';
import { SHADER_SHADOW, SHADOW_COUNT, LIGHTTYPE_COUNT, SHADERTYPE_SHADOW, SHADERTYPE_FORWARD, SHADER_PICK, SHADERTYPE_PICK, SHADER_DEPTH, SHADERTYPE_DEPTH, SHADER_FORWARDHDR, SHADER_FORWARD } from './constants.js';

/**
 * A pure static utility class, responsible for math operations on the shader pass constants.
 *
 * @ignore
 */
class ShaderPass {
  /**
   * Returns the shader type given the shader pass.
   *
   * @param {number} shaderPass - The shader pass.
   * @returns {string} - The shader type.
   */
  static getType(shaderPass) {
    switch (shaderPass) {
      case SHADER_FORWARD:
      case SHADER_FORWARDHDR:
        return SHADERTYPE_FORWARD;
      case SHADER_DEPTH:
        return SHADERTYPE_DEPTH;
      case SHADER_PICK:
        return SHADERTYPE_PICK;
      default:
        return shaderPass >= SHADER_SHADOW && shaderPass < SHADER_SHADOW + SHADOW_COUNT * LIGHTTYPE_COUNT ? SHADERTYPE_SHADOW : SHADERTYPE_FORWARD;
    }
  }

  /**
   * Returns true if the shader pass is a forward shader pass.
   *
   * @param {number} pass - The shader pass.
   * @returns {boolean} - True if the pass is a forward shader pass.
   */
  static isForward(pass) {
    return this.getType(pass) === SHADERTYPE_FORWARD;
  }

  /**
   * Returns true if the shader pass is a shadow shader pass.
   *
   * @param {number} pass - The shader pass.
   * @returns {boolean} - True if the pass is a shadow shader pass.
   */
  static isShadow(pass) {
    return this.getType(pass) === SHADERTYPE_SHADOW;
  }

  /**
   * Returns the light type based on the shader shadow pass.
   *
   * @param {number} pass - The shader pass.
   * @returns {number} - A light type.
   */
  static toLightType(pass) {
    Debug.assert(ShaderPass.isShadow(pass));
    const shadowMode = pass - SHADER_SHADOW;
    return Math.floor(shadowMode / SHADOW_COUNT);
  }

  /**
   * Returns the shadow type based on the shader shadow pass.
   *
   * @param {number} pass - The shader pass.
   * @returns {number} - A shadow type.
   */
  static toShadowType(pass) {
    Debug.assert(ShaderPass.isShadow(pass));
    const shadowMode = pass - SHADER_SHADOW;
    const lightType = Math.floor(shadowMode / SHADOW_COUNT);
    return shadowMode - lightType * SHADOW_COUNT;
  }

  /**
   * Returns a shader pass for specified light and shadow type.
   *
   * @param {number} lightType - A light type.
   * @param {number} shadowType - A shadow type.
   * @returns {number} - A shader pass.
   */
  static getShadow(lightType, shadowType) {
    const shadowMode = shadowType + lightType * SHADOW_COUNT;
    const pass = SHADER_SHADOW + shadowMode;
    Debug.assert(ShaderPass.isShadow(pass));
    return pass;
  }

  /**
   * Returns the define code line for the shader pass.
   *
   * @param {number} pass - The shader pass.
   * @returns {string} - A code line.
   */
  static getPassShaderDefine(pass) {
    if (pass === SHADER_PICK) {
      return '#define PICK_PASS\n';
    } else if (pass === SHADER_DEPTH) {
      return '#define DEPTH_PASS\n';
    } else if (ShaderPass.isShadow(pass)) {
      return '#define SHADOW_PASS\n';
    }
    return '';
  }
}

export { ShaderPass };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZGVyLXBhc3MuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zY2VuZS9zaGFkZXItcGFzcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEZWJ1ZyB9IGZyb20gJy4uL2NvcmUvZGVidWcuanMnO1xuaW1wb3J0IHtcbiAgICBTSEFERVJfRk9SV0FSRCwgU0hBREVSX0ZPUldBUkRIRFIsIFNIQURFUl9ERVBUSCwgU0hBREVSX1BJQ0ssXG4gICAgU0hBREVSX1NIQURPVywgU0hBRE9XX0NPVU5ULCBMSUdIVFRZUEVfQ09VTlQsXG4gICAgU0hBREVSVFlQRV9GT1JXQVJELCBTSEFERVJUWVBFX0RFUFRILCBTSEFERVJUWVBFX1BJQ0ssIFNIQURFUlRZUEVfU0hBRE9XXG59IGZyb20gJy4vY29uc3RhbnRzLmpzJztcblxuLyoqXG4gKiBBIHB1cmUgc3RhdGljIHV0aWxpdHkgY2xhc3MsIHJlc3BvbnNpYmxlIGZvciBtYXRoIG9wZXJhdGlvbnMgb24gdGhlIHNoYWRlciBwYXNzIGNvbnN0YW50cy5cbiAqXG4gKiBAaWdub3JlXG4gKi9cbmNsYXNzIFNoYWRlclBhc3Mge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNoYWRlciB0eXBlIGdpdmVuIHRoZSBzaGFkZXIgcGFzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzaGFkZXJQYXNzIC0gVGhlIHNoYWRlciBwYXNzLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gVGhlIHNoYWRlciB0eXBlLlxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRUeXBlKHNoYWRlclBhc3MpIHtcbiAgICAgICAgc3dpdGNoIChzaGFkZXJQYXNzKSB7XG4gICAgICAgICAgICBjYXNlIFNIQURFUl9GT1JXQVJEOlxuICAgICAgICAgICAgY2FzZSBTSEFERVJfRk9SV0FSREhEUjpcbiAgICAgICAgICAgICAgICByZXR1cm4gU0hBREVSVFlQRV9GT1JXQVJEO1xuICAgICAgICAgICAgY2FzZSBTSEFERVJfREVQVEg6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFNIQURFUlRZUEVfREVQVEg7XG4gICAgICAgICAgICBjYXNlIFNIQURFUl9QSUNLOlxuICAgICAgICAgICAgICAgIHJldHVybiBTSEFERVJUWVBFX1BJQ0s7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiAoc2hhZGVyUGFzcyA+PSBTSEFERVJfU0hBRE9XICYmIHNoYWRlclBhc3MgPCBTSEFERVJfU0hBRE9XICsgU0hBRE9XX0NPVU5UICogTElHSFRUWVBFX0NPVU5UKSA/IFNIQURFUlRZUEVfU0hBRE9XIDogU0hBREVSVFlQRV9GT1JXQVJEO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBzaGFkZXIgcGFzcyBpcyBhIGZvcndhcmQgc2hhZGVyIHBhc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcGFzcyAtIFRoZSBzaGFkZXIgcGFzcy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBUcnVlIGlmIHRoZSBwYXNzIGlzIGEgZm9yd2FyZCBzaGFkZXIgcGFzcy5cbiAgICAgKi9cbiAgICBzdGF0aWMgaXNGb3J3YXJkKHBhc3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VHlwZShwYXNzKSA9PT0gU0hBREVSVFlQRV9GT1JXQVJEO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgc2hhZGVyIHBhc3MgaXMgYSBzaGFkb3cgc2hhZGVyIHBhc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcGFzcyAtIFRoZSBzaGFkZXIgcGFzcy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBUcnVlIGlmIHRoZSBwYXNzIGlzIGEgc2hhZG93IHNoYWRlciBwYXNzLlxuICAgICAqL1xuICAgIHN0YXRpYyBpc1NoYWRvdyhwYXNzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFR5cGUocGFzcykgPT09IFNIQURFUlRZUEVfU0hBRE9XO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGxpZ2h0IHR5cGUgYmFzZWQgb24gdGhlIHNoYWRlciBzaGFkb3cgcGFzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwYXNzIC0gVGhlIHNoYWRlciBwYXNzLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IC0gQSBsaWdodCB0eXBlLlxuICAgICAqL1xuICAgIHN0YXRpYyB0b0xpZ2h0VHlwZShwYXNzKSB7XG4gICAgICAgIERlYnVnLmFzc2VydChTaGFkZXJQYXNzLmlzU2hhZG93KHBhc3MpKTtcbiAgICAgICAgY29uc3Qgc2hhZG93TW9kZSA9IHBhc3MgLSBTSEFERVJfU0hBRE9XO1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihzaGFkb3dNb2RlIC8gU0hBRE9XX0NPVU5UKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzaGFkb3cgdHlwZSBiYXNlZCBvbiB0aGUgc2hhZGVyIHNoYWRvdyBwYXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBhc3MgLSBUaGUgc2hhZGVyIHBhc3MuXG4gICAgICogQHJldHVybnMge251bWJlcn0gLSBBIHNoYWRvdyB0eXBlLlxuICAgICAqL1xuICAgIHN0YXRpYyB0b1NoYWRvd1R5cGUocGFzcykge1xuICAgICAgICBEZWJ1Zy5hc3NlcnQoU2hhZGVyUGFzcy5pc1NoYWRvdyhwYXNzKSk7XG4gICAgICAgIGNvbnN0IHNoYWRvd01vZGUgPSBwYXNzIC0gU0hBREVSX1NIQURPVztcbiAgICAgICAgY29uc3QgbGlnaHRUeXBlID0gTWF0aC5mbG9vcihzaGFkb3dNb2RlIC8gU0hBRE9XX0NPVU5UKTtcbiAgICAgICAgcmV0dXJuIHNoYWRvd01vZGUgLSBsaWdodFR5cGUgKiBTSEFET1dfQ09VTlQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHNoYWRlciBwYXNzIGZvciBzcGVjaWZpZWQgbGlnaHQgYW5kIHNoYWRvdyB0eXBlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxpZ2h0VHlwZSAtIEEgbGlnaHQgdHlwZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc2hhZG93VHlwZSAtIEEgc2hhZG93IHR5cGUuXG4gICAgICogQHJldHVybnMge251bWJlcn0gLSBBIHNoYWRlciBwYXNzLlxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRTaGFkb3cobGlnaHRUeXBlLCBzaGFkb3dUeXBlKSB7XG4gICAgICAgIGNvbnN0IHNoYWRvd01vZGUgPSBzaGFkb3dUeXBlICsgbGlnaHRUeXBlICogU0hBRE9XX0NPVU5UO1xuICAgICAgICBjb25zdCBwYXNzID0gU0hBREVSX1NIQURPVyArIHNoYWRvd01vZGU7XG4gICAgICAgIERlYnVnLmFzc2VydChTaGFkZXJQYXNzLmlzU2hhZG93KHBhc3MpKTtcbiAgICAgICAgcmV0dXJuIHBhc3M7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgZGVmaW5lIGNvZGUgbGluZSBmb3IgdGhlIHNoYWRlciBwYXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBhc3MgLSBUaGUgc2hhZGVyIHBhc3MuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gLSBBIGNvZGUgbGluZS5cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0UGFzc1NoYWRlckRlZmluZShwYXNzKSB7XG4gICAgICAgIGlmIChwYXNzID09PSBTSEFERVJfUElDSykge1xuICAgICAgICAgICAgcmV0dXJuICcjZGVmaW5lIFBJQ0tfUEFTU1xcbic7XG4gICAgICAgIH0gZWxzZSBpZiAocGFzcyA9PT0gU0hBREVSX0RFUFRIKSB7XG4gICAgICAgICAgICByZXR1cm4gJyNkZWZpbmUgREVQVEhfUEFTU1xcbic7XG4gICAgICAgIH0gZWxzZSBpZiAoU2hhZGVyUGFzcy5pc1NoYWRvdyhwYXNzKSkge1xuICAgICAgICAgICAgcmV0dXJuICcjZGVmaW5lIFNIQURPV19QQVNTXFxuJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG5leHBvcnQgeyBTaGFkZXJQYXNzIH07XG4iXSwibmFtZXMiOlsiU2hhZGVyUGFzcyIsImdldFR5cGUiLCJzaGFkZXJQYXNzIiwiU0hBREVSX0ZPUldBUkQiLCJTSEFERVJfRk9SV0FSREhEUiIsIlNIQURFUlRZUEVfRk9SV0FSRCIsIlNIQURFUl9ERVBUSCIsIlNIQURFUlRZUEVfREVQVEgiLCJTSEFERVJfUElDSyIsIlNIQURFUlRZUEVfUElDSyIsIlNIQURFUl9TSEFET1ciLCJTSEFET1dfQ09VTlQiLCJMSUdIVFRZUEVfQ09VTlQiLCJTSEFERVJUWVBFX1NIQURPVyIsImlzRm9yd2FyZCIsInBhc3MiLCJpc1NoYWRvdyIsInRvTGlnaHRUeXBlIiwiRGVidWciLCJhc3NlcnQiLCJzaGFkb3dNb2RlIiwiTWF0aCIsImZsb29yIiwidG9TaGFkb3dUeXBlIiwibGlnaHRUeXBlIiwiZ2V0U2hhZG93Iiwic2hhZG93VHlwZSIsImdldFBhc3NTaGFkZXJEZWZpbmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU1BLFVBQVUsQ0FBQztBQUNiO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNJLE9BQU9DLE9BQU9BLENBQUNDLFVBQVUsRUFBRTtBQUN2QixJQUFBLFFBQVFBLFVBQVU7QUFDZCxNQUFBLEtBQUtDLGNBQWMsQ0FBQTtBQUNuQixNQUFBLEtBQUtDLGlCQUFpQjtBQUNsQixRQUFBLE9BQU9DLGtCQUFrQixDQUFBO0FBQzdCLE1BQUEsS0FBS0MsWUFBWTtBQUNiLFFBQUEsT0FBT0MsZ0JBQWdCLENBQUE7QUFDM0IsTUFBQSxLQUFLQyxXQUFXO0FBQ1osUUFBQSxPQUFPQyxlQUFlLENBQUE7QUFDMUIsTUFBQTtBQUNJLFFBQUEsT0FBUVAsVUFBVSxJQUFJUSxhQUFhLElBQUlSLFVBQVUsR0FBR1EsYUFBYSxHQUFHQyxZ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
