/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { math } from './math.js';

/**
 * Representation of an RGBA color.
 */
class Color {
  /**
   * The red component of the color.
   *
   * @type {number}
   */

  /**
   * The green component of the color.
   *
   * @type {number}
   */

  /**
   * The blue component of the color.
   *
   * @type {number}
   */

  /**
   * The alpha component of the color.
   *
   * @type {number}
   */

  /**
   * Create a new Color object.
   *
   * @param {number|number[]} [r] - The value of the red component (0-1). Defaults to 0. If r is
   * an array of length 3 or 4, the array will be used to populate all components.
   * @param {number} [g] - The value of the green component (0-1). Defaults to 0.
   * @param {number} [b] - The value of the blue component (0-1). Defaults to 0.
   * @param {number} [a] - The value of the alpha component (0-1). Defaults to 1.
   */
  constructor(r = 0, g = 0, b = 0, a = 1) {
    this.r = void 0;
    this.g = void 0;
    this.b = void 0;
    this.a = void 0;
    const length = r.length;
    if (length === 3 || length === 4) {
      this.r = r[0];
      this.g = r[1];
      this.b = r[2];
      this.a = r[3] !== undefined ? r[3] : 1;
    } else {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }
  }

  /**
   * Returns a clone of the specified color.
   *
   * @returns {this} A duplicate color object.
   */
  clone() {
    /** @type {this} */
    const cstr = this.constructor;
    return new cstr(this.r, this.g, this.b, this.a);
  }

  /**
   * Copies the contents of a source color to a destination color.
   *
   * @param {Color} rhs - A color to copy to the specified color.
   * @returns {Color} Self for chaining.
   * @example
   * var src = new pc.Color(1, 0, 0, 1);
   * var dst = new pc.Color();
   *
   * dst.copy(src);
   *
   * console.log("The two colors are " + (dst.equals(src) ? "equal" : "different"));
   */
  copy(rhs) {
    this.r = rhs.r;
    this.g = rhs.g;
    this.b = rhs.b;
    this.a = rhs.a;
    return this;
  }

  /**
   * Reports whether two colors are equal.
   *
   * @param {Color} rhs - The color to compare to the specified color.
   * @returns {boolean} True if the colors are equal and false otherwise.
   * @example
   * var a = new pc.Color(1, 0, 0, 1);
   * var b = new pc.Color(1, 1, 0, 1);
   * console.log("The two colors are " + (a.equals(b) ? "equal" : "different"));
   */
  equals(rhs) {
    return this.r === rhs.r && this.g === rhs.g && this.b === rhs.b && this.a === rhs.a;
  }

  /**
   * Assign values to the color components, including alpha.
   *
   * @param {number} r - The value for red (0-1).
   * @param {number} g - The value for blue (0-1).
   * @param {number} b - The value for green (0-1).
   * @param {number} [a] - The value for the alpha (0-1), defaults to 1.
   * @returns {Color} Self for chaining.
   */
  set(r, g, b, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    return this;
  }

  /**
   * Returns the result of a linear interpolation between two specified colors.
   *
   * @param {Color} lhs - The color to interpolate from.
   * @param {Color} rhs - The color to interpolate to.
   * @param {number} alpha - The value controlling the point of interpolation. Between 0 and 1,
   * the linear interpolant will occur on a straight line between lhs and rhs. Outside of this
   * range, the linear interpolant will occur on a ray extrapolated from this line.
   * @returns {Color} Self for chaining.
   * @example
   * var a = new pc.Color(0, 0, 0);
   * var b = new pc.Color(1, 1, 0.5);
   * var r = new pc.Color();
   *
   * r.lerp(a, b, 0);   // r is equal to a
   * r.lerp(a, b, 0.5); // r is 0.5, 0.5, 0.25
   * r.lerp(a, b, 1);   // r is equal to b
   */
  lerp(lhs, rhs, alpha) {
    this.r = lhs.r + alpha * (rhs.r - lhs.r);
    this.g = lhs.g + alpha * (rhs.g - lhs.g);
    this.b = lhs.b + alpha * (rhs.b - lhs.b);
    this.a = lhs.a + alpha * (rhs.a - lhs.a);
    return this;
  }

  /**
   * Set the values of the color from a string representation '#11223344' or '#112233'.
   *
   * @param {string} hex - A string representation in the format '#RRGGBBAA' or '#RRGGBB'. Where
   * RR, GG, BB, AA are red, green, blue and alpha values. This is the same format used in
   * HTML/CSS.
   * @returns {Color} Self for chaining.
   */
  fromString(hex) {
    const i = parseInt(hex.replace('#', '0x'), 16);
    let bytes;
    if (hex.length > 7) {
      bytes = math.intToBytes32(i);
    } else {
      bytes = math.intToBytes24(i);
      bytes[3] = 255;
    }
    this.set(bytes[0] / 255, bytes[1] / 255, bytes[2] / 255, bytes[3] / 255);
    return this;
  }

  /**
   * Converts the color to string form. The format is '#RRGGBBAA', where RR, GG, BB, AA are the
   * red, green, blue and alpha values. When the alpha value is not included (the default), this
   * is the same format as used in HTML/CSS.
   *
   * @param {boolean} alpha - If true, the output string will include the alpha value.
   * @returns {string} The color in string form.
   * @example
   * var c = new pc.Color(1, 1, 1);
   * // Outputs #ffffffff
   * console.log(c.toString());
   */
  toString(alpha) {
    let s = '#' + ((1 << 24) + (Math.round(this.r * 255) << 16) + (Math.round(this.g * 255) << 8) + Math.round(this.b * 255)).toString(16).slice(1);
    if (alpha === true) {
      const a = Math.round(this.a * 255).toString(16);
      if (this.a < 16 / 255) {
        s += '0' + a;
      } else {
        s += a;
      }
    }
    return s;
  }

  /**
   * A constant color set to black [0, 0, 0, 1].
   *
   * @type {Color}
   * @readonly
   */
}
Color.BLACK = Object.freeze(new Color(0, 0, 0, 1));
Color.BLUE = Object.freeze(new Color(0, 0, 1, 1));
Color.CYAN = Object.freeze(new Color(0, 1, 1, 1));
Color.GRAY = Object.freeze(new Color(0.5, 0.5, 0.5, 1));
Color.GREEN = Object.freeze(new Color(0, 1, 0, 1));
Color.MAGENTA = Object.freeze(new Color(1, 0, 1, 1));
Color.RED = Object.freeze(new Color(1, 0, 0, 1));
Color.WHITE = Object.freeze(new Color(1, 1, 1, 1));
Color.YELLOW = Object.freeze(new Color(1, 1, 0, 1));

export { Color };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3IuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL21hdGgvY29sb3IuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbWF0aCB9IGZyb20gJy4vbWF0aC5qcyc7XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYW4gUkdCQSBjb2xvci5cbiAqL1xuY2xhc3MgQ29sb3Ige1xuICAgIC8qKlxuICAgICAqIFRoZSByZWQgY29tcG9uZW50IG9mIHRoZSBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgcjtcblxuICAgIC8qKlxuICAgICAqIFRoZSBncmVlbiBjb21wb25lbnQgb2YgdGhlIGNvbG9yLlxuICAgICAqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBnO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGJsdWUgY29tcG9uZW50IG9mIHRoZSBjb2xvci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgYjtcblxuICAgIC8qKlxuICAgICAqIFRoZSBhbHBoYSBjb21wb25lbnQgb2YgdGhlIGNvbG9yLlxuICAgICAqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBhO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IENvbG9yIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfG51bWJlcltdfSBbcl0gLSBUaGUgdmFsdWUgb2YgdGhlIHJlZCBjb21wb25lbnQgKDAtMSkuIERlZmF1bHRzIHRvIDAuIElmIHIgaXNcbiAgICAgKiBhbiBhcnJheSBvZiBsZW5ndGggMyBvciA0LCB0aGUgYXJyYXkgd2lsbCBiZSB1c2VkIHRvIHBvcHVsYXRlIGFsbCBjb21wb25lbnRzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZ10gLSBUaGUgdmFsdWUgb2YgdGhlIGdyZWVuIGNvbXBvbmVudCAoMC0xKS4gRGVmYXVsdHMgdG8gMC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2JdIC0gVGhlIHZhbHVlIG9mIHRoZSBibHVlIGNvbXBvbmVudCAoMC0xKS4gRGVmYXVsdHMgdG8gMC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2FdIC0gVGhlIHZhbHVlIG9mIHRoZSBhbHBoYSBjb21wb25lbnQgKDAtMSkuIERlZmF1bHRzIHRvIDEuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IociA9IDAsIGcgPSAwLCBiID0gMCwgYSA9IDEpIHtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gci5sZW5ndGg7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDMgfHwgbGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICB0aGlzLnIgPSByWzBdO1xuICAgICAgICAgICAgdGhpcy5nID0gclsxXTtcbiAgICAgICAgICAgIHRoaXMuYiA9IHJbMl07XG4gICAgICAgICAgICB0aGlzLmEgPSByWzNdICE9PSB1bmRlZmluZWQgPyByWzNdIDogMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuciA9IHI7XG4gICAgICAgICAgICB0aGlzLmcgPSBnO1xuICAgICAgICAgICAgdGhpcy5iID0gYjtcbiAgICAgICAgICAgIHRoaXMuYSA9IGE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgY2xvbmUgb2YgdGhlIHNwZWNpZmllZCBjb2xvci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt0aGlzfSBBIGR1cGxpY2F0ZSBjb2xvciBvYmplY3QuXG4gICAgICovXG4gICAgY2xvbmUoKSB7XG4gICAgICAgIC8qKiBAdHlwZSB7dGhpc30gKi9cbiAgICAgICAgY29uc3QgY3N0ciA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICAgIHJldHVybiBuZXcgY3N0cih0aGlzLnIsIHRoaXMuZywgdGhpcy5iLCB0aGlzLmEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvcGllcyB0aGUgY29udGVudHMgb2YgYSBzb3VyY2UgY29sb3IgdG8gYSBkZXN0aW5hdGlvbiBjb2xvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q29sb3J9IHJocyAtIEEgY29sb3IgdG8gY29weSB0byB0aGUgc3BlY2lmaWVkIGNvbG9yLlxuICAgICAqIEByZXR1cm5zIHtDb2xvcn0gU2VsZiBmb3IgY2hhaW5pbmcuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgc3JjID0gbmV3IHBjLkNvbG9yKDEsIDAsIDAsIDEpO1xuICAgICAqIHZhciBkc3QgPSBuZXcgcGMuQ29sb3IoKTtcbiAgICAgKlxuICAgICAqIGRzdC5jb3B5KHNyYyk7XG4gICAgICpcbiAgICAgKiBjb25zb2xlLmxvZyhcIlRoZSB0d28gY29sb3JzIGFyZSBcIiArIChkc3QuZXF1YWxzKHNyYykgPyBcImVxdWFsXCIgOiBcImRpZmZlcmVudFwiKSk7XG4gICAgICovXG4gICAgY29weShyaHMpIHtcbiAgICAgICAgdGhpcy5yID0gcmhzLnI7XG4gICAgICAgIHRoaXMuZyA9IHJocy5nO1xuICAgICAgICB0aGlzLmIgPSByaHMuYjtcbiAgICAgICAgdGhpcy5hID0gcmhzLmE7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVwb3J0cyB3aGV0aGVyIHR3byBjb2xvcnMgYXJlIGVxdWFsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDb2xvcn0gcmhzIC0gVGhlIGNvbG9yIHRvIGNvbXBhcmUgdG8gdGhlIHNwZWNpZmllZCBjb2xvci5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgY29sb3JzIGFyZSBlcXVhbCBhbmQgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIGEgPSBuZXcgcGMuQ29sb3IoMSwgMCwgMCwgMSk7XG4gICAgICogdmFyIGIgPSBuZXcgcGMuQ29sb3IoMSwgMSwgMCwgMSk7XG4gICAgICogY29uc29sZS5sb2coXCJUaGUgdHdvIGNvbG9ycyBhcmUgXCIgKyAoYS5lcXVhbHMoYikgPyBcImVxdWFsXCIgOiBcImRpZmZlcmVudFwiKSk7XG4gICAgICovXG4gICAgZXF1YWxzKHJocykge1xuICAgICAgICByZXR1cm4gdGhpcy5yID09PSByaHMuciAmJiB0aGlzLmcgPT09IHJocy5nICYmIHRoaXMuYiA9PT0gcmhzLmIgJiYgdGhpcy5hID09PSByaHMuYTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBc3NpZ24gdmFsdWVzIHRvIHRoZSBjb2xvciBjb21wb25lbnRzLCBpbmNsdWRpbmcgYWxwaGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gciAtIFRoZSB2YWx1ZSBmb3IgcmVkICgwLTEpLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBnIC0gVGhlIHZhbHVlIGZvciBibHVlICgwLTEpLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBiIC0gVGhlIHZhbHVlIGZvciBncmVlbiAoMC0xKS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2FdIC0gVGhlIHZhbHVlIGZvciB0aGUgYWxwaGEgKDAtMSksIGRlZmF1bHRzIHRvIDEuXG4gICAgICogQHJldHVybnMge0NvbG9yfSBTZWxmIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBzZXQociwgZywgYiwgYSA9IDEpIHtcbiAgICAgICAgdGhpcy5yID0gcjtcbiAgICAgICAgdGhpcy5nID0gZztcbiAgICAgICAgdGhpcy5iID0gYjtcbiAgICAgICAgdGhpcy5hID0gYTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSByZXN1bHQgb2YgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byBzcGVjaWZpZWQgY29sb3JzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDb2xvcn0gbGhzIC0gVGhlIGNvbG9yIHRvIGludGVycG9sYXRlIGZyb20uXG4gICAgICogQHBhcmFtIHtDb2xvcn0gcmhzIC0gVGhlIGNvbG9yIHRvIGludGVycG9sYXRlIHRvLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbHBoYSAtIFRoZSB2YWx1ZSBjb250cm9sbGluZyB0aGUgcG9pbnQgb2YgaW50ZXJwb2xhdGlvbi4gQmV0d2VlbiAwIGFuZCAxLFxuICAgICAqIHRoZSBsaW5lYXIgaW50ZXJwb2xhbnQgd2lsbCBvY2N1ciBvbiBhIHN0cmFpZ2h0IGxpbmUgYmV0d2VlbiBsaHMgYW5kIHJocy4gT3V0c2lkZSBvZiB0aGlzXG4gICAgICogcmFuZ2UsIHRoZSBsaW5lYXIgaW50ZXJwb2xhbnQgd2lsbCBvY2N1ciBvbiBhIHJheSBleHRyYXBvbGF0ZWQgZnJvbSB0aGlzIGxpbmUuXG4gICAgICogQHJldHVybnMge0NvbG9yfSBTZWxmIGZvciBjaGFpbmluZy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBhID0gbmV3IHBjLkNvbG9yKDAsIDAsIDApO1xuICAgICAqIHZhciBiID0gbmV3IHBjLkNvbG9yKDEsIDEsIDAuNSk7XG4gICAgICogdmFyIHIgPSBuZXcgcGMuQ29sb3IoKTtcbiAgICAgKlxuICAgICAqIHIubGVycChhLCBiLCAwKTsgICAvLyByIGlzIGVxdWFsIHRvIGFcbiAgICAgKiByLmxlcnAoYSwgYiwgMC41KTsgLy8gciBpcyAwLjUsIDAuNSwgMC4yNVxuICAgICAqIHIubGVycChhLCBiLCAxKTsgICAvLyByIGlzIGVxdWFsIHRvIGJcbiAgICAgKi9cbiAgICBsZXJwKGxocywgcmhzLCBhbHBoYSkge1xuICAgICAgICB0aGlzLnIgPSBsaHMuciArIGFscGhhICogKHJocy5yIC0gbGhzLnIpO1xuICAgICAgICB0aGlzLmcgPSBsaHMuZyArIGFscGhhICogKHJocy5nIC0gbGhzLmcpO1xuICAgICAgICB0aGlzLmIgPSBsaHMuYiArIGFscGhhICogKHJocy5iIC0gbGhzLmIpO1xuICAgICAgICB0aGlzLmEgPSBsaHMuYSArIGFscGhhICogKHJocy5hIC0gbGhzLmEpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmFsdWVzIG9mIHRoZSBjb2xvciBmcm9tIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uICcjMTEyMjMzNDQnIG9yICcjMTEyMjMzJy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBoZXggLSBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBpbiB0aGUgZm9ybWF0ICcjUlJHR0JCQUEnIG9yICcjUlJHR0JCJy4gV2hlcmVcbiAgICAgKiBSUiwgR0csIEJCLCBBQSBhcmUgcmVkLCBncmVlbiwgYmx1ZSBhbmQgYWxwaGEgdmFsdWVzLiBUaGlzIGlzIHRoZSBzYW1lIGZvcm1hdCB1c2VkIGluXG4gICAgICogSFRNTC9DU1MuXG4gICAgICogQHJldHVybnMge0NvbG9yfSBTZWxmIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBmcm9tU3RyaW5nKGhleCkge1xuICAgICAgICBjb25zdCBpID0gcGFyc2VJbnQoaGV4LnJlcGxhY2UoJyMnLCAnMHgnKSwgMTYpO1xuICAgICAgICBsZXQgYnl0ZXM7XG4gICAgICAgIGlmIChoZXgubGVuZ3RoID4gNykge1xuICAgICAgICAgICAgYnl0ZXMgPSBtYXRoLmludFRvQnl0ZXMzMihpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ5dGVzID0gbWF0aC5pbnRUb0J5dGVzMjQoaSk7XG4gICAgICAgICAgICBieXRlc1szXSA9IDI1NTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0KGJ5dGVzWzBdIC8gMjU1LCBieXRlc1sxXSAvIDI1NSwgYnl0ZXNbMl0gLyAyNTUsIGJ5dGVzWzNdIC8gMjU1KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyB0aGUgY29sb3IgdG8gc3RyaW5nIGZvcm0uIFRoZSBmb3JtYXQgaXMgJyNSUkdHQkJBQScsIHdoZXJlIFJSLCBHRywgQkIsIEFBIGFyZSB0aGVcbiAgICAgKiByZWQsIGdyZWVuLCBibHVlIGFuZCBhbHBoYSB2YWx1ZXMuIFdoZW4gdGhlIGFscGhhIHZhbHVlIGlzIG5vdCBpbmNsdWRlZCAodGhlIGRlZmF1bHQpLCB0aGlzXG4gICAgICogaXMgdGhlIHNhbWUgZm9ybWF0IGFzIHVzZWQgaW4gSFRNTC9DU1MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGFscGhhIC0gSWYgdHJ1ZSwgdGhlIG91dHB1dCBzdHJpbmcgd2lsbCBpbmNsdWRlIHRoZSBhbHBoYSB2YWx1ZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgY29sb3IgaW4gc3RyaW5nIGZvcm0uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgYyA9IG5ldyBwYy5Db2xvcigxLCAxLCAxKTtcbiAgICAgKiAvLyBPdXRwdXRzICNmZmZmZmZmZlxuICAgICAqIGNvbnNvbGUubG9nKGMudG9TdHJpbmcoKSk7XG4gICAgICovXG4gICAgdG9TdHJpbmcoYWxwaGEpIHtcbiAgICAgICAgbGV0IHMgPSAnIycgKyAoKDEgPDwgMjQpICsgKE1hdGgucm91bmQodGhpcy5yICogMjU1KSA8PCAxNikgKyAoTWF0aC5yb3VuZCh0aGlzLmcgKiAyNTUpIDw8IDgpICsgTWF0aC5yb3VuZCh0aGlzLmIgKiAyNTUpKS50b1N0cmluZygxNikuc2xpY2UoMSk7XG4gICAgICAgIGlmIChhbHBoYSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgY29uc3QgYSA9IE1hdGgucm91bmQodGhpcy5hICogMjU1KS50b1N0cmluZygxNik7XG4gICAgICAgICAgICBpZiAodGhpcy5hIDwgMTYgLyAyNTUpIHtcbiAgICAgICAgICAgICAgICBzICs9ICcwJyArIGE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHMgKz0gYTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBjb25zdGFudCBjb2xvciBzZXQgdG8gYmxhY2sgWzAsIDAsIDAsIDFdLlxuICAgICAqXG4gICAgICogQHR5cGUge0NvbG9yfVxuICAgICAqIEByZWFkb25seVxuICAgICAqL1xuICAgIHN0YXRpYyBCTEFDSyA9IE9iamVjdC5mcmVlemUobmV3IENvbG9yKDAsIDAsIDAsIDEpKTtcblxuICAgIC8qKlxuICAgICAqIEEgY29uc3RhbnQgY29sb3Igc2V0IHRvIGJsdWUgWzAsIDAsIDEsIDFdLlxuICAgICAqXG4gICAgICogQHR5cGUge0NvbG9yfVxuICAgICAqIEByZWFkb25seVxuICAgICAqL1xuICAgIHN0YXRpYyBCTFVFID0gT2JqZWN0LmZyZWV6ZShuZXcgQ29sb3IoMCwgMCwgMSwgMSkpO1xuXG4gICAgLyoqXG4gICAgICogQSBjb25zdGFudCBjb2xvciBzZXQgdG8gY3lhbiBbMCwgMSwgMSwgMV0uXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Q29sb3J9XG4gICAgICogQHJlYWRvbmx5XG4gICAgICovXG4gICAgc3RhdGljIENZQU4gPSBPYmplY3QuZnJlZXplKG5ldyBDb2xvcigwLCAxLCAxLCAxKSk7XG5cbiAgICAvKipcbiAgICAgKiBBIGNvbnN0YW50IGNvbG9yIHNldCB0byBncmF5IFswLjUsIDAuNSwgMC41LCAxXS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtDb2xvcn1cbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICBzdGF0aWMgR1JBWSA9IE9iamVjdC5mcmVlemUobmV3IENvbG9yKDAuNSwgMC41LCAwLjUsIDEpKTtcblxuICAgIC8qKlxuICAgICAqIEEgY29uc3RhbnQgY29sb3Igc2V0IHRvIGdyZWVuIFswLCAxLCAwLCAxXS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtDb2xvcn1cbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICBzdGF0aWMgR1JFRU4gPSBPYmplY3QuZnJlZXplKG5ldyBDb2xvcigwLCAxLCAwLCAxKSk7XG5cbiAgICAvKipcbiAgICAgKiBBIGNvbnN0YW50IGNvbG9yIHNldCB0byBtYWdlbnRhIFsxLCAwLCAxLCAxXS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtDb2xvcn1cbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICBzdGF0aWMgTUFHRU5UQSA9IE9iamVjdC5mcmVlemUobmV3IENvbG9yKDEsIDAsIDEsIDEpKTtcblxuICAgIC8qKlxuICAgICAqIEEgY29uc3RhbnQgY29sb3Igc2V0IHRvIHJlZCBbMSwgMCwgMCwgMV0uXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Q29sb3J9XG4gICAgICogQHJlYWRvbmx5XG4gICAgICovXG4gICAgc3RhdGljIFJFRCA9IE9iamVjdC5mcmVlemUobmV3IENvbG9yKDEsIDAsIDAsIDEpKTtcblxuICAgIC8qKlxuICAgICAqIEEgY29uc3RhbnQgY29sb3Igc2V0IHRvIHdoaXRlIFsxLCAxLCAxLCAxXS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtDb2xvcn1cbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICBzdGF0aWMgV0hJVEUgPSBPYmplY3QuZnJlZXplKG5ldyBDb2xvcigxLCAxLCAxLCAxKSk7XG5cbiAgICAvKipcbiAgICAgKiBBIGNvbnN0YW50IGNvbG9yIHNldCB0byB5ZWxsb3cgWzEsIDEsIDAsIDFdLlxuICAgICAqXG4gICAgICogQHR5cGUge0NvbG9yfVxuICAgICAqIEByZWFkb25seVxuICAgICAqL1xuICAgIHN0YXRpYyBZRUxMT1cgPSBPYmplY3QuZnJlZXplKG5ldyBDb2xvcigxLCAxLCAwLCAxKSk7XG59XG5cbmV4cG9ydCB7IENvbG9yIH07XG4iXSwibmFtZXMiOlsiQ29sb3IiLCJjb25zdHJ1Y3RvciIsInIiLCJnIiwiYiIsImEiLCJsZW5ndGgiLCJ1bmRlZmluZWQiLCJjbG9uZSIsImNzdHIiLCJjb3B5IiwicmhzIiwiZXF1YWxzIiwic2V0IiwibGVycCIsImxocyIsImFscGhhIiwiZnJvbVN0cmluZyIsImhleCIsImkiLCJwYXJzZUludCIsInJlcGxhY2UiLCJieXRlcyIsIm1hdGgiLCJpbnRUb0J5dGVzMzIiLCJpbnRUb0J5dGVzMjQiLCJ0b1N0cmluZyIsInMiLCJNYXRoIiwicm91bmQiLCJzbGljZSIsIkJMQUNLIiwiT2JqZWN0IiwiZnJlZXplIiwiQkxVRSIsIkNZQU4iLCJHUkFZIiwiR1JFRU4iLCJNQUdFTlRBIiwiUkVEIiwiV0hJVEUiLCJZRUxMT1ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQSxLQUFLLENBQUM7QUFDUjtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUdJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7O0FBR0k7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7QUFHSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUdJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSxXQUFXQSxDQUFDQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQUEsSUFBQSxJQUFBLENBaEN4Q0gsQ0FBQyxHQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQUEsSUFBQSxJQUFBLENBT0RDLENBQUMsR0FBQSxLQUFBLENBQUEsQ0FBQTtBQUFBLElBQUEsSUFBQSxDQU9EQyxDQUFDLEdBQUEsS0FBQSxDQUFBLENBQUE7QUFBQSxJQUFBLElBQUEsQ0FPREMsQ0FBQyxHQUFBLEtBQUEsQ0FBQSxDQUFBO0FBWUcsSUFBQSxNQUFNQyxNQUFNLEdBQUdKLENBQUMsQ0FBQ0ksTUFBTSxDQUFBO0FBQ3ZCLElBQUEsSUFBSUEsTUFBTSxLQUFLLENBQUMsSUFBSUEsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUM5QixNQUFBLElBQUksQ0FBQ0osQ0FBQyxHQUFHQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDYixNQUFBLElBQUksQ0FBQ0MsQ0FBQyxHQUFHRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDYixNQUFBLElBQUksQ0FBQ0UsQ0FBQyxHQUFHRixDQUFDLENB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
