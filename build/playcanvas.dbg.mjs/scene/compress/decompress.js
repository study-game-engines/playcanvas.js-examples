/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { CompressUtils } from './compress-utils.js';

/**
 * Reconstruct original object field names in a compressed scene.
 *
 * @ignore
 */
class Decompress {
  /**
   * Create a new Decompress instance.
   *
   * @param {object} node - The current node of the object being decompressed, initially the
   * 'entities' field of a scene.
   * @param {object} data - Compression metadata.
   */
  constructor(node, data) {
    this._node = node;
    this._data = data;
  }
  run() {
    const type = Object.prototype.toString.call(this._node);
    if (type === '[object Object]') {
      this._handleMap();
    } else if (type === '[object Array]') {
      this._handleArray();
    } else {
      this._result = this._node;
    }
    return this._result;
  }
  _handleMap() {
    this._result = {};
    const a = Object.keys(this._node);
    a.forEach(this._handleKey, this);
  }
  _handleKey(origKey) {
    let newKey = origKey;
    const len = origKey.length;
    if (len === 1) {
      newKey = CompressUtils.oneCharToKey(origKey, this._data);
    } else if (len === 2) {
      newKey = CompressUtils.multCharToKey(origKey, this._data);
    }
    this._result[newKey] = new Decompress(this._node[origKey], this._data).run();
  }
  _handleArray() {
    this._result = [];
    this._node.forEach(this._handleArElt, this);
  }
  _handleArElt(elt) {
    const v = new Decompress(elt, this._data).run();
    this._result.push(v);
  }
}

export { Decompress };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb21wcmVzcy5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjZW5lL2NvbXByZXNzL2RlY29tcHJlc3MuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcHJlc3NVdGlscyB9IGZyb20gJy4vY29tcHJlc3MtdXRpbHMuanMnO1xuXG4vKipcbiAqIFJlY29uc3RydWN0IG9yaWdpbmFsIG9iamVjdCBmaWVsZCBuYW1lcyBpbiBhIGNvbXByZXNzZWQgc2NlbmUuXG4gKlxuICogQGlnbm9yZVxuICovXG5jbGFzcyBEZWNvbXByZXNzIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgRGVjb21wcmVzcyBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlIC0gVGhlIGN1cnJlbnQgbm9kZSBvZiB0aGUgb2JqZWN0IGJlaW5nIGRlY29tcHJlc3NlZCwgaW5pdGlhbGx5IHRoZVxuICAgICAqICdlbnRpdGllcycgZmllbGQgb2YgYSBzY2VuZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIENvbXByZXNzaW9uIG1ldGFkYXRhLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG5vZGUsIGRhdGEpIHtcbiAgICAgICAgdGhpcy5fbm9kZSA9IG5vZGU7XG5cbiAgICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgfVxuXG4gICAgcnVuKCkge1xuICAgICAgICBjb25zdCB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRoaXMuX25vZGUpO1xuXG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlTWFwKCk7XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVBcnJheSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9ub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3VsdDtcbiAgICB9XG5cbiAgICBfaGFuZGxlTWFwKCkge1xuICAgICAgICB0aGlzLl9yZXN1bHQgPSB7fTtcblxuICAgICAgICBjb25zdCBhID0gT2JqZWN0LmtleXModGhpcy5fbm9kZSk7XG5cbiAgICAgICAgYS5mb3JFYWNoKHRoaXMuX2hhbmRsZUtleSwgdGhpcyk7XG4gICAgfVxuXG4gICAgX2hhbmRsZUtleShvcmlnS2V5KSB7XG4gICAgICAgIGxldCBuZXdLZXkgPSBvcmlnS2V5O1xuXG4gICAgICAgIGNvbnN0IGxlbiA9IG9yaWdLZXkubGVuZ3RoO1xuXG4gICAgICAgIGlmIChsZW4gPT09IDEpIHtcbiAgICAgICAgICAgIG5ld0tleSA9IENvbXByZXNzVXRpbHMub25lQ2hhclRvS2V5KG9yaWdLZXksIHRoaXMuX2RhdGEpO1xuICAgICAgICB9IGVsc2UgaWYgKGxlbiA9PT0gMikge1xuICAgICAgICAgICAgbmV3S2V5ID0gQ29tcHJlc3NVdGlscy5tdWx0Q2hhclRvS2V5KG9yaWdLZXksIHRoaXMuX2RhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcmVzdWx0W25ld0tleV0gPSBuZXcgRGVjb21wcmVzcyh0aGlzLl9ub2RlW29yaWdLZXldLCB0aGlzLl9kYXRhKS5ydW4oKTtcbiAgICB9XG5cbiAgICBfaGFuZGxlQXJyYXkoKSB7XG4gICAgICAgIHRoaXMuX3Jlc3VsdCA9IFtdO1xuXG4gICAgICAgIHRoaXMuX25vZGUuZm9yRWFjaCh0aGlzLl9oYW5kbGVBckVsdCwgdGhpcyk7XG4gICAgfVxuXG4gICAgX2hhbmRsZUFyRWx0KGVsdCkge1xuICAgICAgICBjb25zdCB2ID0gbmV3IERlY29tcHJlc3MoZWx0LCB0aGlzLl9kYXRhKS5ydW4oKTtcblxuICAgICAgICB0aGlzLl9yZXN1bHQucHVzaCh2KTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IERlY29tcHJlc3MgfTtcbiJdLCJuYW1lcyI6WyJEZWNvbXByZXNzIiwiY29uc3RydWN0b3IiLCJub2RlIiwiZGF0YSIsIl9ub2RlIiwiX2RhdGEiLCJydW4iLCJ0eXBlIiwiT2JqZWN0IiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwiX2hhbmRsZU1hcCIsIl9oYW5kbGVBcnJheSIsIl9yZXN1bHQiLCJhIiwia2V5cyIsImZvckVhY2giLCJfaGFuZGxlS2V5Iiwib3JpZ0tleSIsIm5ld0tleSIsImxlbiIsImxlbmd0aCIsIkNvbXByZXNzVXRpbHMiLCJvbmVDaGFyVG9LZXkiLCJtdWx0Q2hhclRvS2V5IiwiX2hhbmRsZUFyRWx0IiwiZWx0IiwidiIsInB1c2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUEsVUFBVSxDQUFDO0FBQ2I7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsV0FBV0EsQ0FBQ0MsSUFBSSxFQUFFQyxJQUFJLEVBQUU7SUFDcEIsSUFBSSxDQUFDQyxLQUFLLEdBQUdGLElBQUksQ0FBQTtJQUVqQixJQUFJLENBQUNHLEtBQUssR0FBR0YsSUFBSSxDQUFBO0FBQ3JCLEdBQUE7QUFFQUcsRUFBQUEsR0FBR0EsR0FBRztBQUNGLElBQUEsTUFBTUMsSUFBSSxHQUFHQyxNQUFNLENBQUNDLFNBQVMsQ0FBQ0MsUUFBUSxDQUFDQyxJQUFJLENBQUMsSUFBSSxDQUFDUCxLQUFLLENBQUMsQ0FBQTtJQUV2RCxJQUFJRyxJQUFJLEtBQUssaUJBQWlCLEVBQUU7TUFDNUIsSUFBSSxDQUFDSyxVQUFVLEVBQUUsQ0FBQTtBQUVyQixLQUFDLE1BQU0sSUFBSUwsSUFBSSxLQUFLLGdCQUFnQixFQUFFO01BQ2xDLElBQUksQ0FBQ00sWUFBWSxFQUFFLENBQUE7QUFFdkIsS0FBQyxNQUFNO0FBQ0gsTUFBQSxJQUFJLENBQUNDLE9BQU8sR0FBRyxJQUFJLENBQUNWLEtBQUssQ0FBQTtBQUM3QixLQUFBO0lBRUEsT0FBTyxJQUFJLENBQUNVLE9BQU8sQ0FBQTtBQUN2QixHQUFBO0FBRUFGLEVBQUFBLFVBQVVBLEdBQUc7QUFDVCxJQUFBLElBQUksQ0FBQ0UsT0FBTyxHQUFHLEVBQUUsQ0FBQTtJQUVqQixNQUFNQyxDQUFDLEdBQUdQLE1BQU0sQ0FBQ1EsSUFBSSxDQUFDLElBQUksQ0FBQ1osS0FBSyxDQUFDLENBQUE7SUFFakNXLENBQUMsQ0FBQ0UsT0FBTyxDQUFDLElBQUksQ0FBQ0MsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ3BDLEdBQUE7RUFFQUEsVUFBVUEsQ0FBQ0MsT0FBTyxFQUFFO0lBQ2hCLElBQUlDLE1BQU0sR0FBR0QsT0FBTyxDQUFBO0FBRXBCLElBQUEsTUFBTUUsR0FBRyxHQUFHRixPQUFPLENBQUNHLE1BQU0sQ0FBQTtJQUUxQixJQUFJRCxHQUFHLEtBQUssQ0FBQyxFQUFFO01BQ1hELE1BQU0sR0FBR0csYUFBYSxDQUFDQyxZQUFZLENBQUNMLE9BQU8sRUFBRSxJQUFJLENBQUNkLEtBQUssQ0FBQyxDQUFBO0FBQzVELEtBQUMsTUFBTSxJQUFJZ0IsR0FBRyxLQUFLLENBQUMsRUFBRTtNQUNsQkQsTUFBTSxHQUFHRyxhQUFhLENBQUNFLGFBQWEsQ0FBQ04sT0FBTyxFQUFFLElBQUksQ0FBQ2QsS0FBSyxDQUFDLENBQUE7QUFDN0QsS0FBQTtJQUVBLElBQUksQ0FBQ1MsT0FBTyxDQUFDTSxNQUFNLENBQUMsR0FBRyxJQUFJcEIsVUFBVSxDQUFDLElBQUksQ0FBQ0ksS0FBSyxDQUFDZSxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUNkLEtBQUssQ0FBQyxDQUFDQyxHQUFHLEVBQUUsQ0FBQTtBQUNoRixHQUFBO0FBRUFPLEVBQUFBLFlBQVlBLEdBQUc7SUFDWCxJQUFJLENBQUNDLE9BQU8sR0FBRyxFQUFFLENBQUE7SUFFakIsSUFBSSxDQUFDVixLQUFLLENBQUNhLE9BQU8sQ0FBQyxJQUFJLENBQUNTLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUMvQyxHQUFBO0VBRUFBLFlBQVlBLENBQUNDLEdBQUcsRUFBRTtBQUNkLElBQUEsTUFBTUMsQ0FBQyxHQUFHLElBQUk1QixVQUFVLENBQUMyQixHQUFHLEVBQUUsSUFBSSxDQUFDdEIsS0FBSyxDQUFDLENBQUNDLEdBQUcsRUFBRSxDQUFBO0FBRS9DLElBQUEsSUFBSSxDQUFDUSxPQUFPLENBQUNlLElBQUksQ0FBQ0QsQ0FBQyxDQUFDLENBQUE7QUFDeEIsR0FBQTtBQUNKOzs7OyJ9
