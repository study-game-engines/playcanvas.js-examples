/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../core/debug.js';
import { Quat } from '../math/quat.js';
import { Vec3 } from '../math/vec3.js';

class InterpolatedKey {
  constructor() {
    this._written = false;
    this._name = '';
    this._keyFrames = [];
    this._quat = new Quat();
    this._pos = new Vec3();
    this._scale = new Vec3();
    this._targetNode = null;
  }

  getTarget() {
    return this._targetNode;
  }

  setTarget(node) {
    this._targetNode = node;
  }

}

class Skeleton {
  constructor(graph) {
    this.looping = true;
    this._animation = null;
    this._time = 0;
    this._interpolatedKeys = [];
    this._interpolatedKeyDict = {};
    this._currKeyIndices = {};
    this.graph = null;

    const addInterpolatedKeys = node => {
      const interpKey = new InterpolatedKey();
      interpKey._name = node.name;

      this._interpolatedKeys.push(interpKey);

      this._interpolatedKeyDict[node.name] = interpKey;
      this._currKeyIndices[node.name] = 0;

      for (let i = 0; i < node._children.length; i++) addInterpolatedKeys(node._children[i]);
    };

    addInterpolatedKeys(graph);
  }

  set animation(value) {
    this._animation = value;
    this.currentTime = 0;
  }

  get animation() {
    return this._animation;
  }

  set currentTime(value) {
    this._time = value;
    const numNodes = this._interpolatedKeys.length;

    for (let i = 0; i < numNodes; i++) {
      const node = this._interpolatedKeys[i];
      const nodeName = node._name;
      this._currKeyIndices[nodeName] = 0;
    }

    this.addTime(0);
    this.updateGraph();
  }

  get currentTime() {
    return this._time;
  }

  get numNodes() {
    return this._interpolatedKeys.length;
  }

  addTime(delta) {
    if (this._animation !== null) {
      const nodes = this._animation._nodes;
      const duration = this._animation.duration;

      if (this._time === duration && !this.looping) {
        return;
      }

      this._time += delta;

      if (this._time > duration) {
        this._time = this.looping ? 0.0 : duration;

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const nodeName = node._name;
          this._currKeyIndices[nodeName] = 0;
        }
      } else if (this._time < 0) {
        this._time = this.looping ? duration : 0.0;

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const nodeName = node._name;
          this._currKeyIndices[nodeName] = node._keys.length - 2;
        }
      }

      const offset = delta >= 0 ? 1 : -1;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeName = node._name;
        const keys = node._keys;
        const interpKey = this._interpolatedKeyDict[nodeName];

        if (interpKey === undefined) {
          Debug.warn(`Unknown skeleton node name: ${nodeName}`);
          continue;
        }

        let foundKey = false;

        if (keys.length !== 1) {
          for (let currKeyIndex = this._currKeyIndices[nodeName]; currKeyIndex < keys.length - 1 && currKeyIndex >= 0; currKeyIndex += offset) {
            const k1 = keys[currKeyIndex];
            const k2 = keys[currKeyIndex + 1];

            if (k1.time <= this._time && k2.time >= this._time) {
              const alpha = (this._time - k1.time) / (k2.time - k1.time);

              interpKey._pos.lerp(k1.position, k2.position, alpha);

              interpKey._quat.slerp(k1.rotation, k2.rotation, alpha);

              interpKey._scale.lerp(k1.scale, k2.scale, alpha);

              interpKey._written = true;
              this._currKeyIndices[nodeName] = currKeyIndex;
              foundKey = true;
              break;
            }
          }
        }

        if (keys.length === 1 || !foundKey && this._time === 0.0 && this.looping) {
          interpKey._pos.copy(keys[0].position);

          interpKey._quat.copy(keys[0].rotation);

          interpKey._scale.copy(keys[0].scale);

          interpKey._written = true;
        }
      }
    }
  }

  blend(skel1, skel2, alpha) {
    const numNodes = this._interpolatedKeys.length;

    for (let i = 0; i < numNodes; i++) {
      const key1 = skel1._interpolatedKeys[i];
      const key2 = skel2._interpolatedKeys[i];
      const dstKey = this._interpolatedKeys[i];

      if (key1._written && key2._written) {
        dstKey._quat.slerp(key1._quat, skel2._interpolatedKeys[i]._quat, alpha);

        dstKey._pos.lerp(key1._pos, skel2._interpolatedKeys[i]._pos, alpha);

        dstKey._scale.lerp(key1._scale, key2._scale, alpha);

        dstKey._written = true;
      } else if (key1._written) {
        dstKey._quat.copy(key1._quat);

        dstKey._pos.copy(key1._pos);

        dstKey._scale.copy(key1._scale);

        dstKey._written = true;
      } else if (key2._written) {
        dstKey._quat.copy(key2._quat);

        dstKey._pos.copy(key2._pos);

        dstKey._scale.copy(key2._scale);

        dstKey._written = true;
      }
    }
  }

  setGraph(graph) {
    this.graph = graph;

    if (graph) {
      for (let i = 0; i < this._interpolatedKeys.length; i++) {
        const interpKey = this._interpolatedKeys[i];
        const graphNode = graph.findByName(interpKey._name);

        this._interpolatedKeys[i].setTarget(graphNode);
      }
    } else {
      for (let i = 0; i < this._interpolatedKeys.length; i++) {
        this._interpolatedKeys[i].setTarget(null);
      }
    }
  }

  updateGraph() {
    if (this.graph) {
      for (let i = 0; i < this._interpolatedKeys.length; i++) {
        const interpKey = this._interpolatedKeys[i];

        if (interpKey._written) {
          const transform = interpKey.getTarget();
          transform.localPosition.copy(interpKey._pos);
          transform.localRotation.copy(interpKey._quat);
          transform.localScale.copy(interpKey._scale);
          if (!transform._dirtyLocal) transform._dirtifyLocal();
          interpKey._written = false;
        }
      }
    }
  }

}

export { Skeleton };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tlbGV0b24uanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hbmltYXRpb24vc2tlbGV0b24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGVidWcgfSBmcm9tICcuLi9jb3JlL2RlYnVnLmpzJztcbmltcG9ydCB7IFF1YXQgfSBmcm9tICcuLi9tYXRoL3F1YXQuanMnO1xuaW1wb3J0IHsgVmVjMyB9IGZyb20gJy4uL21hdGgvdmVjMy5qcyc7XG5cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2FuaW1hdGlvbi5qcycpLkFuaW1hdGlvbn0gQW5pbWF0aW9uICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi4vc2NlbmUvZ3JhcGgtbm9kZS5qcycpLkdyYXBoTm9kZX0gR3JhcGhOb2RlICovXG5cbmNsYXNzIEludGVycG9sYXRlZEtleSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX3dyaXR0ZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fbmFtZSA9ICcnO1xuICAgICAgICB0aGlzLl9rZXlGcmFtZXMgPSBbXTtcblxuICAgICAgICAvLyBSZXN1bHQgb2YgaW50ZXJwb2xhdGlvblxuICAgICAgICB0aGlzLl9xdWF0ID0gbmV3IFF1YXQoKTtcbiAgICAgICAgdGhpcy5fcG9zID0gbmV3IFZlYzMoKTtcbiAgICAgICAgdGhpcy5fc2NhbGUgPSBuZXcgVmVjMygpO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsIGRlc3RpbmF0aW9uIGZvciBpbnRlcnBvbGF0ZWQga2V5ZnJhbWVcbiAgICAgICAgdGhpcy5fdGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0VGFyZ2V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdGFyZ2V0Tm9kZTtcbiAgICB9XG5cbiAgICBzZXRUYXJnZXQobm9kZSkge1xuICAgICAgICB0aGlzLl90YXJnZXROb2RlID0gbm9kZTtcbiAgICB9XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIHNrZWxldG9uIHVzZWQgdG8gcGxheSBhbmltYXRpb25zLlxuICovXG5jbGFzcyBTa2VsZXRvbiB7XG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHNrZWxldG9uIGlzIGxvb3BpbmcgaXRzIGFuaW1hdGlvbi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIGxvb3BpbmcgPSB0cnVlO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IFNrZWxldG9uIGluc3RhbmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtHcmFwaE5vZGV9IGdyYXBoIC0gVGhlIHJvb3Qge0BsaW5rIEdyYXBoTm9kZX0gb2YgdGhlIHNrZWxldG9uLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGdyYXBoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7QW5pbWF0aW9ufVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fYW5pbWF0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdGltZSA9IDA7XG5cbiAgICAgICAgdGhpcy5faW50ZXJwb2xhdGVkS2V5cyA9IFtdO1xuICAgICAgICB0aGlzLl9pbnRlcnBvbGF0ZWRLZXlEaWN0ID0ge307XG4gICAgICAgIHRoaXMuX2N1cnJLZXlJbmRpY2VzID0ge307XG5cbiAgICAgICAgdGhpcy5ncmFwaCA9IG51bGw7XG5cbiAgICAgICAgY29uc3QgYWRkSW50ZXJwb2xhdGVkS2V5cyA9IChub2RlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnBLZXkgPSBuZXcgSW50ZXJwb2xhdGVkS2V5KCk7XG4gICAgICAgICAgICBpbnRlcnBLZXkuX25hbWUgPSBub2RlLm5hbWU7XG4gICAgICAgICAgICB0aGlzLl9pbnRlcnBvbGF0ZWRLZXlzLnB1c2goaW50ZXJwS2V5KTtcbiAgICAgICAgICAgIHRoaXMuX2ludGVycG9sYXRlZEtleURpY3Rbbm9kZS5uYW1lXSA9IGludGVycEtleTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJLZXlJbmRpY2VzW25vZGUubmFtZV0gPSAwO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUuX2NoaWxkcmVuLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIGFkZEludGVycG9sYXRlZEtleXMobm9kZS5fY2hpbGRyZW5baV0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGFkZEludGVycG9sYXRlZEtleXMoZ3JhcGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFuaW1hdGlvbiBjdXJyZW50bHkgYXNzaWduZWQgdG8gc2tlbGV0b24uXG4gICAgICpcbiAgICAgKiBAdHlwZSB7QW5pbWF0aW9ufVxuICAgICAqL1xuICAgIHNldCBhbmltYXRpb24odmFsdWUpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0aW9uID0gdmFsdWU7XG4gICAgICAgIHRoaXMuY3VycmVudFRpbWUgPSAwO1xuICAgIH1cblxuICAgIGdldCBhbmltYXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbmltYXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3VycmVudCB0aW1lIG9mIGN1cnJlbnRseSBhY3RpdmUgYW5pbWF0aW9uIGluIHNlY29uZHMuIFRoaXMgdmFsdWUgaXMgYmV0d2VlbiB6ZXJvIGFuZCB0aGVcbiAgICAgKiBkdXJhdGlvbiBvZiB0aGUgYW5pbWF0aW9uLlxuICAgICAqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBzZXQgY3VycmVudFRpbWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fdGltZSA9IHZhbHVlO1xuICAgICAgICBjb25zdCBudW1Ob2RlcyA9IHRoaXMuX2ludGVycG9sYXRlZEtleXMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bU5vZGVzOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9pbnRlcnBvbGF0ZWRLZXlzW2ldO1xuICAgICAgICAgICAgY29uc3Qgbm9kZU5hbWUgPSBub2RlLl9uYW1lO1xuICAgICAgICAgICAgdGhpcy5fY3VycktleUluZGljZXNbbm9kZU5hbWVdID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWRkVGltZSgwKTtcbiAgICAgICAgdGhpcy51cGRhdGVHcmFwaCgpO1xuICAgIH1cblxuICAgIGdldCBjdXJyZW50VGltZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RpbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVhZC1vbmx5IHByb3BlcnR5IHRoYXQgcmV0dXJucyBudW1iZXIgb2Ygbm9kZXMgb2YgYSBza2VsZXRvbi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IG51bU5vZGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJwb2xhdGVkS2V5cy5sZW5ndGg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvZ3Jlc3NlcyB0aGUgYW5pbWF0aW9uIGFzc2lnbmVkIHRvIHRoZSBzcGVjaWZpZWQgc2tlbGV0b24gYnkgdGhlIHN1cHBsaWVkIHRpbWUgZGVsdGEuIElmXG4gICAgICogdGhlIGRlbHRhIHRha2VzIHRoZSBhbmltYXRpb24gcGFzc2VkIGl0cyBlbmQgcG9pbnQsIGlmIHRoZSBza2VsZXRvbiBpcyBzZXQgdG8gbG9vcCwgdGhlXG4gICAgICogYW5pbWF0aW9uIHdpbGwgY29udGludWUgZnJvbSB0aGUgYmVnaW5uaW5nLiBPdGhlcndpc2UsIHRoZSBhbmltYXRpb24ncyBjdXJyZW50IHRpbWUgd2lsbFxuICAgICAqIHJlbWFpbiBhdCBpdHMgZHVyYXRpb24gKGkuZS4gdGhlIGVuZCkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVsdGEgLSBUaGUgdGltZSBpbiBzZWNvbmRzIHRvIHByb2dyZXNzIHRoZSBza2VsZXRvbidzIGFuaW1hdGlvbi5cbiAgICAgKi9cbiAgICBhZGRUaW1lKGRlbHRhKSB7XG4gICAgICAgIGlmICh0aGlzLl9hbmltYXRpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gdGhpcy5fYW5pbWF0aW9uLl9ub2RlcztcbiAgICAgICAgICAgIGNvbnN0IGR1cmF0aW9uID0gdGhpcy5fYW5pbWF0aW9uLmR1cmF0aW9uO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB3ZSBjYW4gZWFybHkgb3V0XG4gICAgICAgICAgICBpZiAoKHRoaXMuX3RpbWUgPT09IGR1cmF0aW9uKSAmJiAhdGhpcy5sb29waW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTdGVwIHRoZSBjdXJyZW50IHRpbWUgYW5kIHdvcmsgb3V0IGlmIHdlIG5lZWQgdG8ganVtcCBhaGVhZCwgY2xhbXAgb3Igd3JhcCBhcm91bmRcbiAgICAgICAgICAgIHRoaXMuX3RpbWUgKz0gZGVsdGE7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl90aW1lID4gZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90aW1lID0gdGhpcy5sb29waW5nID8gMC4wIDogZHVyYXRpb247XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVOYW1lID0gbm9kZS5fbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycktleUluZGljZXNbbm9kZU5hbWVdID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3RpbWUgPCAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdGltZSA9IHRoaXMubG9vcGluZyA/IGR1cmF0aW9uIDogMC4wO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlTmFtZSA9IG5vZGUuX25hbWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJLZXlJbmRpY2VzW25vZGVOYW1lXSA9IG5vZGUuX2tleXMubGVuZ3RoIC0gMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgLy8gRm9yIGVhY2ggYW5pbWF0ZWQgbm9kZS4uLlxuXG4gICAgICAgICAgICAvLyBrZXlzIGluZGV4IG9mZnNldFxuICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gKGRlbHRhID49IDAgPyAxIDogLTEpO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVOYW1lID0gbm9kZS5fbmFtZTtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gbm9kZS5fa2V5cztcblxuICAgICAgICAgICAgICAgIC8vIERldGVybWluZSB0aGUgaW50ZXJwb2xhdGVkIGtleWZyYW1lIGZvciB0aGlzIGFuaW1hdGVkIG5vZGVcbiAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnBLZXkgPSB0aGlzLl9pbnRlcnBvbGF0ZWRLZXlEaWN0W25vZGVOYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJwS2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgRGVidWcud2FybihgVW5rbm93biBza2VsZXRvbiBub2RlIG5hbWU6ICR7bm9kZU5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSdzIG9ubHkgYSBzaW5nbGUga2V5LCBqdXN0IGNvcHkgdGhlIGtleSB0byB0aGUgaW50ZXJwb2xhdGVkIGtleS4uLlxuICAgICAgICAgICAgICAgIGxldCBmb3VuZEtleSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChrZXlzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UsIGZpbmQgdGhlIGtleWZyYW1lIHBhaXIgZm9yIHRoaXMgbm9kZVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBjdXJyS2V5SW5kZXggPSB0aGlzLl9jdXJyS2V5SW5kaWNlc1tub2RlTmFtZV07IGN1cnJLZXlJbmRleCA8IGtleXMubGVuZ3RoIC0gMSAmJiBjdXJyS2V5SW5kZXggPj0gMDsgY3VycktleUluZGV4ICs9IG9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgazEgPSBrZXlzW2N1cnJLZXlJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrMiA9IGtleXNbY3VycktleUluZGV4ICsgMV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoazEudGltZSA8PSB0aGlzLl90aW1lKSAmJiAoazIudGltZSA+PSB0aGlzLl90aW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFscGhhID0gKHRoaXMuX3RpbWUgLSBrMS50aW1lKSAvIChrMi50aW1lIC0gazEudGltZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnBLZXkuX3Bvcy5sZXJwKGsxLnBvc2l0aW9uLCBrMi5wb3NpdGlvbiwgYWxwaGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVycEtleS5fcXVhdC5zbGVycChrMS5yb3RhdGlvbiwgazIucm90YXRpb24sIGFscGhhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnBLZXkuX3NjYWxlLmxlcnAoazEuc2NhbGUsIGsyLnNjYWxlLCBhbHBoYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJwS2V5Ll93cml0dGVuID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJLZXlJbmRpY2VzW25vZGVOYW1lXSA9IGN1cnJLZXlJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZEtleSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGtleXMubGVuZ3RoID09PSAxIHx8ICghZm91bmRLZXkgJiYgdGhpcy5fdGltZSA9PT0gMC4wICYmIHRoaXMubG9vcGluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJwS2V5Ll9wb3MuY29weShrZXlzWzBdLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJwS2V5Ll9xdWF0LmNvcHkoa2V5c1swXS5yb3RhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGludGVycEtleS5fc2NhbGUuY29weShrZXlzWzBdLnNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJwS2V5Ll93cml0dGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCbGVuZHMgdHdvIHNrZWxldG9ucyB0b2dldGhlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U2tlbGV0b259IHNrZWwxIC0gU2tlbGV0b24gaG9sZGluZyB0aGUgZmlyc3QgcG9zZSB0byBiZSBibGVuZGVkLlxuICAgICAqIEBwYXJhbSB7U2tlbGV0b259IHNrZWwyIC0gU2tlbGV0b24gaG9sZGluZyB0aGUgc2Vjb25kIHBvc2UgdG8gYmUgYmxlbmRlZC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYWxwaGEgLSBUaGUgdmFsdWUgY29udHJvbGxpbmcgdGhlIGludGVycG9sYXRpb24gaW4gcmVsYXRpb24gdG8gdGhlIHR3byBpbnB1dFxuICAgICAqIHNrZWxldG9ucy4gVGhlIHZhbHVlIGlzIGluIHRoZSByYW5nZSAwIHRvIDEsIDAgZ2VuZXJhdGluZyBza2VsMSwgMSBnZW5lcmF0aW5nIHNrZWwyIGFuZFxuICAgICAqIGFueXRoaW5nIGluIGJldHdlZW4gZ2VuZXJhdGluZyBhIHNwaGVyaWNhbCBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdGhlIHR3by5cbiAgICAgKi9cbiAgICBibGVuZChza2VsMSwgc2tlbDIsIGFscGhhKSB7XG4gICAgICAgIGNvbnN0IG51bU5vZGVzID0gdGhpcy5faW50ZXJwb2xhdGVkS2V5cy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtTm9kZXM7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qga2V5MSA9IHNrZWwxLl9pbnRlcnBvbGF0ZWRLZXlzW2ldO1xuICAgICAgICAgICAgY29uc3Qga2V5MiA9IHNrZWwyLl9pbnRlcnBvbGF0ZWRLZXlzW2ldO1xuICAgICAgICAgICAgY29uc3QgZHN0S2V5ID0gdGhpcy5faW50ZXJwb2xhdGVkS2V5c1tpXTtcblxuICAgICAgICAgICAgaWYgKGtleTEuX3dyaXR0ZW4gJiYga2V5Mi5fd3JpdHRlbikge1xuICAgICAgICAgICAgICAgIGRzdEtleS5fcXVhdC5zbGVycChrZXkxLl9xdWF0LCBza2VsMi5faW50ZXJwb2xhdGVkS2V5c1tpXS5fcXVhdCwgYWxwaGEpO1xuICAgICAgICAgICAgICAgIGRzdEtleS5fcG9zLmxlcnAoa2V5MS5fcG9zLCBza2VsMi5faW50ZXJwb2xhdGVkS2V5c1tpXS5fcG9zLCBhbHBoYSk7XG4gICAgICAgICAgICAgICAgZHN0S2V5Ll9zY2FsZS5sZXJwKGtleTEuX3NjYWxlLCBrZXkyLl9zY2FsZSwgYWxwaGEpO1xuICAgICAgICAgICAgICAgIGRzdEtleS5fd3JpdHRlbiA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGtleTEuX3dyaXR0ZW4pIHtcbiAgICAgICAgICAgICAgICBkc3RLZXkuX3F1YXQuY29weShrZXkxLl9xdWF0KTtcbiAgICAgICAgICAgICAgICBkc3RLZXkuX3Bvcy5jb3B5KGtleTEuX3Bvcyk7XG4gICAgICAgICAgICAgICAgZHN0S2V5Ll9zY2FsZS5jb3B5KGtleTEuX3NjYWxlKTtcbiAgICAgICAgICAgICAgICBkc3RLZXkuX3dyaXR0ZW4gPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChrZXkyLl93cml0dGVuKSB7XG4gICAgICAgICAgICAgICAgZHN0S2V5Ll9xdWF0LmNvcHkoa2V5Mi5fcXVhdCk7XG4gICAgICAgICAgICAgICAgZHN0S2V5Ll9wb3MuY29weShrZXkyLl9wb3MpO1xuICAgICAgICAgICAgICAgIGRzdEtleS5fc2NhbGUuY29weShrZXkyLl9zY2FsZSk7XG4gICAgICAgICAgICAgICAgZHN0S2V5Ll93cml0dGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExpbmtzIGEgc2tlbGV0b24gdG8gYSBub2RlIGhpZXJhcmNoeS4gVGhlIG5vZGVzIGFuaW1hdGVkIHNrZWxldG9uIGFyZSB0aGVuIHN1YnNlcXVlbnRseSB1c2VkXG4gICAgICogdG8gZHJpdmUgdGhlIGxvY2FsIHRyYW5zZm9ybWF0aW9uIG1hdHJpY2VzIG9mIHRoZSBub2RlIGhpZXJhcmNoeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7R3JhcGhOb2RlfSBncmFwaCAtIFRoZSByb290IG5vZGUgb2YgdGhlIGdyYXBoIHRoYXQgdGhlIHNrZWxldG9uIGlzIHRvIGRyaXZlLlxuICAgICAqL1xuICAgIHNldEdyYXBoKGdyYXBoKSB7XG4gICAgICAgIHRoaXMuZ3JhcGggPSBncmFwaDtcblxuICAgICAgICBpZiAoZ3JhcGgpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5faW50ZXJwb2xhdGVkS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGludGVycEtleSA9IHRoaXMuX2ludGVycG9sYXRlZEtleXNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhcGhOb2RlID0gZ3JhcGguZmluZEJ5TmFtZShpbnRlcnBLZXkuX25hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ludGVycG9sYXRlZEtleXNbaV0uc2V0VGFyZ2V0KGdyYXBoTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2ludGVycG9sYXRlZEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcnBvbGF0ZWRLZXlzW2ldLnNldFRhcmdldChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN5bmNocm9uaXplcyB0aGUgY3VycmVudGx5IGxpbmtlZCBub2RlIGhpZXJhcmNoeSB3aXRoIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBza2VsZXRvbi5cbiAgICAgKiBJbnRlcm5hbGx5LCB0aGlzIGZ1bmN0aW9uIGNvbnZlcnRzIHRoZSBpbnRlcnBvbGF0ZWQga2V5ZnJhbWUgYXQgZWFjaCBub2RlIGluIHRoZSBza2VsZXRvblxuICAgICAqIGludG8gdGhlIGxvY2FsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBhdCBlYWNoIGNvcnJlc3BvbmRpbmcgbm9kZSBpbiB0aGUgbGlua2VkIG5vZGVcbiAgICAgKiBoaWVyYXJjaHkuXG4gICAgICovXG4gICAgdXBkYXRlR3JhcGgoKSB7XG4gICAgICAgIGlmICh0aGlzLmdyYXBoKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2ludGVycG9sYXRlZEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnBLZXkgPSB0aGlzLl9pbnRlcnBvbGF0ZWRLZXlzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChpbnRlcnBLZXkuX3dyaXR0ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gaW50ZXJwS2V5LmdldFRhcmdldCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybS5sb2NhbFBvc2l0aW9uLmNvcHkoaW50ZXJwS2V5Ll9wb3MpO1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm0ubG9jYWxSb3RhdGlvbi5jb3B5KGludGVycEtleS5fcXVhdCk7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybS5sb2NhbFNjYWxlLmNvcHkoaW50ZXJwS2V5Ll9zY2FsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0cmFuc2Zvcm0uX2RpcnR5TG9jYWwpXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm0uX2RpcnRpZnlMb2NhbCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGludGVycEtleS5fd3JpdHRlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgU2tlbGV0b24gfTtcbiJdLCJuYW1lcyI6WyJJbnRlcnBvbGF0ZWRLZXkiLCJjb25zdHJ1Y3RvciIsIl93cml0dGVuIiwiX25hbWUiLCJfa2V5RnJhbWVzIiwiX3F1YXQiLCJRdWF0IiwiX3BvcyIsIlZlYzMiLCJfc2NhbGUiLCJfdGFyZ2V0Tm9kZSIsImdldFRhcmdldCIsInNldFRhcmdldCIsIm5vZGUiLCJTa2VsZXRvbiIsImdyYXBoIiwibG9vcGluZyIsIl9hbmltYXRpb24iLCJfdGltZSIsIl9pbnRlcnBvbGF0ZWRLZXlzIiwiX2ludGVycG9sYXRlZEtleURpY3QiLCJfY3VycktleUluZGljZXMiLCJhZGRJbnRlcnBvbGF0ZWRLZXlzIiwiaW50ZXJwS2V5IiwibmFtZSIsInB1c2giLCJpIiwiX2NoaWxkcmVuIiwibGVuZ3RoIiwiYW5pbWF0aW9uIiwidmFsdWUiLCJjdXJyZW50VGltZSIsIm51bU5vZGVzIiwibm9kZU5hbWUiLCJhZGRUaW1lIiwidXBkYXRlR3JhcGgiLCJkZWx0YSIsIm5vZGVzIiwiX25vZGVzIiwiZHVyYXRpb24iLCJfa2V5cyIsIm9mZnNldCIsImtleXMiLCJ1bmRlZmluZWQiLCJEZWJ1ZyIsIndhcm4iLCJmb3VuZEtleSIsImN1cnJLZXlJbmRleCIsImsxIiwiazIiLCJ0aW1lIiwiYWxwaGEiLCJsZXJwIiwicG9zaXRpb24iLCJzbGVycCIsInJvdGF0aW9uIiwic2NhbGUiLCJjb3B5IiwiYmxlbmQiLCJza2VsMSIsInNrZWwyIiwia2V5MSIsImtleTIiLCJkc3RLZXkiLCJzZXRHcmFwaCIsImdyYXBoTm9kZSIsImZpbmRCeU5hbWUiLCJ0cmFuc2Zvcm0iLCJsb2NhbFBvc2l0aW9uIiwibG9jYWxSb3RhdGlvbiIsImxvY2FsU2NhbGUiLCJfZGlydHlMb2NhbCIsIl9kaXJ0aWZ5TG9jYWwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU9BLE1BQU1BLGVBQU4sQ0FBc0I7QUFDbEJDLEVBQUFBLFdBQVcsR0FBRztJQUNWLElBQUtDLENBQUFBLFFBQUwsR0FBZ0IsS0FBaEIsQ0FBQTtJQUNBLElBQUtDLENBQUFBLEtBQUwsR0FBYSxFQUFiLENBQUE7SUFDQSxJQUFLQyxDQUFBQSxVQUFMLEdBQWtCLEVBQWxCLENBQUE7QUFHQSxJQUFBLElBQUEsQ0FBS0MsS0FBTCxHQUFhLElBQUlDLElBQUosRUFBYixDQUFBO0FBQ0EsSUFBQSxJQUFBLENBQUtDLElBQUwsR0FBWSxJQUFJQyxJQUFKLEVBQVosQ0FBQTtBQUNBLElBQUEsSUFBQSxDQUFLQyxNQUFMLEdBQWMsSUFBSUQsSUFBSixFQUFkLENBQUE7SUFHQSxJQUFLRSxDQUFBQSxXQUFMLEdBQW1CLElBQW5CLENBQUE7QUFDSCxHQUFBOztBQUVEQyxFQUFBQSxTQUFTLEdBQUc7QUFDUixJQUFBLE9BQU8sS0FBS0QsV0FBWixDQUFBO0FBQ0gsR0FBQTs7RUFFREUsU0FBUyxDQUFDQyxJQUFELEVBQU87SUFDWixJQUFLSCxDQUFBQSxXQUFMLEdBQW1CRyxJQUFuQixDQUFBO0FBQ0gsR0FBQTs7QUFyQmlCLENBQUE7O0FBMkJ0QixNQUFNQyxRQUFOLENBQWU7RUFhWGIsV0FBVyxDQUFDYyxLQUFELEVBQVE7SUFBQSxJQVBuQkMsQ0FBQUEsT0FPbUIsR0FQVCxJQU9TLENBQUE7SUFLZixJQUFLQyxDQUFBQSxVQUFMLEdBQWtCLElBQWxCLENBQUE7SUFDQSxJQUFLQyxDQUFBQSxLQUFMLEdBQWEsQ0FBYixDQUFBO0lBRUEsSUFBS0MsQ0FBQUEsaUJBQUwsR0FBeUIsRUFBekIsQ0FBQTtJQUNBLElBQUtDLENBQUFBLG9CQUFMLEdBQTRCLEVBQTVCLENBQUE7SUFDQSxJQUFLQyxDQUFBQSxlQUFMLEdBQXVCLEVBQXZCLENBQUE7SUFFQSxJQUFLTixDQUFBQSxLQUFMLEdBQWEsSUFBYixDQUFBOztJQUVBLE1BQU1PLG1CQUFtQixHQUFJVCxJQUFELElBQVU7QUFDbEMsTUFBQSxNQUFNVSxTQUFTLEdBQUcsSUFBSXZCLGVBQUosRUFBbEIsQ0FBQTtBQUNBdUIsTUFBQUEsU0FBUyxDQUFDcEIsS0FBVixHQUFrQlUsSUFBSSxDQUFDVyxJQUF2QixDQUFBOztBQUNBLE1BQUEsSUFBQSxDQUFLTCxpQkFBTCxDQUF1Qk0sSUFBdkIsQ0FBNEJGLFNBQTVCLENBQUEsQ0FBQTs7QUFDQSxNQUFBLElBQUEsQ0FBS0gsb0JBQUwsQ0FBMEJQLElBQUksQ0FBQ1csSUFBL0IsSUFBdUNELFNBQXZDLENBQUE7QUFDQSxNQUFBLElBQUEsQ0FBS0YsZUFBTCxDQUFxQlIsSUFBSSxDQUFDVyxJQUExQixJQUFrQyxDQUFsQyxDQUFBOztNQUVBLEtBQUssSUFBSUUsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR2IsSUFBSSxDQUFDYyxTQUFMLENBQWVDLE1BQW5DLEVBQTJDRixDQUFDLEVBQTVDLEVBQ0lKLG1CQUFtQixDQUFDVCxJQUFJLENBQUNjLFNBQUwsQ0FBZUQsQ0FBZixDQUFELENBQW5CLENBQUE7S0FSUixDQUFBOztJQVdBSixtQkFBbUIsQ0FBQ1AsS0FBRCxDQUFuQixDQUFBO0FBQ0gsR0FBQTs7RUFPWSxJQUFUYyxTQUFTLENBQUNDLEtBQUQsRUFBUTtJQUNqQixJQUFLYixDQUFBQSxVQUFMLEdBQWtCYSxLQUFsQixDQUFBO0lBQ0EsSUFBS0MsQ0FBQUEsV0FBTCxHQUFtQixDQUFuQixDQUFBO0FBQ0gsR0FBQTs7QUFFWSxFQUFBLElBQVRGLFNBQVMsR0FBRztBQUNaLElBQUEsT0FBTyxLQUFLWixVQUFaLENBQUE7QUFDSCxHQUFBOztFQVFjLElBQVhjLFdBQVcsQ0FBQ0QsS0FBRCxFQUFRO0lBQ25CLElBQUtaLENBQUFBLEtBQUwsR0FBYVksS0FBYixDQUFBO0FBQ0EsSUFBQSxNQUFNRSxRQUFRLEdBQUcsSUFBS2IsQ0FBQUEsaUJBQUwsQ0FBdUJTLE1BQXhDLENBQUE7O0lBQ0EsS0FBSyxJQUFJRixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHTSxRQUFwQixFQUE4Qk4sQ0FBQyxFQUEvQixFQUFtQztBQUMvQixNQUFBLE1BQU1iLElBQUksR0FBRyxJQUFBLENBQUtNLGlCQUFMLENBQXVCTyxDQUF2QixDQUFiLENBQUE7QUFDQSxNQUFBLE1BQU1PLFFBQVEsR0FBR3BCLElBQUksQ0FBQ1YsS0FBdEIsQ0FBQTtBQUNBLE1BQUEsSUFBQSxDQUFLa0IsZUFBTCxDQUFxQlksUUFBckIsQ0FBQSxHQUFpQyxDQUFqQyxDQUFBO0FBQ0gsS0FBQTs7SUFFRCxJQUFLQyxDQUFBQSxPQUFMLENBQWEsQ0FBYixDQUFBLENBQUE7QUFDQSxJQUFBLElBQUEsQ0FBS0MsV0FBTCxFQUFBLENBQUE7QUFDSCxHQUFBOztBQUVjLEVBQUEsSUFBWEosV0FBVyxHQUFHO0FBQ2QsSUFBQSxPQUFPLEtBQUtiLEtBQVosQ0FBQTtBQUNILEdBQUE7O0FBT1csRUFBQSxJQUFSYyxRQUFRLEdBQUc7SUFDWCxPQUFPLElBQUEsQ0FBS2IsaUJBQUwsQ0FBdUJTLE1BQTlCLENBQUE7QUFDSCxHQUFBOztFQVVETSxPQUFPLENBQUNFLEtBQUQsRUFBUTtBQUNYLElBQUEsSUFBSSxJQUFLbkIsQ0FBQUEsVUFBTCxLQUFvQixJQUF4QixFQUE4QjtBQUMxQixNQUFBLE1BQU1vQixLQUFLLEdBQUcsSUFBS3BCLENBQUFBLFVBQUwsQ0FBZ0JxQixNQUE5QixDQUFBO0FBQ0EsTUFBQSxNQUFNQyxRQUFRLEdBQUcsSUFBS3RCLENBQUFBLFVBQUwsQ0FBZ0JzQixRQUFqQyxDQUFBOztNQUdBLElBQUssSUFBQSxDQUFLckIsS0FBTCxLQUFlcUIsUUFBaEIsSUFBNkIsQ0FBQyxJQUFBLENBQUt2QixPQUF2QyxFQUFnRDtBQUM1QyxRQUFBLE9BQUE7QUFDSCxPQUFBOztNQUdELElBQUtFLENBQUFBLEtBQUwsSUFBY2tCLEtBQWQsQ0FBQTs7QUFFQSxNQUFBLElBQUksSUFBS2xCLENBQUFBLEtBQUwsR0FBYXFCLFFBQWpCLEVBQTJCO0FBQ3ZCLFFBQUEsSUFBQSxDQUFLckIsS0FBTCxHQUFhLElBQUEsQ0FBS0YsT0FBTCxHQUFlLEdBQWYsR0FBcUJ1QixRQUFsQyxDQUFBOztBQUNBLFFBQUEsS0FBSyxJQUFJYixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHVyxLQUFLLENBQUNULE1BQTFCLEVBQWtDRixDQUFDLEVBQW5DLEVBQXVDO0FBQ25DLFVBQUEsTUFBTWIsSUFBSSxHQUFHd0IsS0FBSyxDQUFDWCxDQUFELENBQWxCLENBQUE7QUFDQSxVQUFBLE1BQU1PLFFBQVEsR0FBR3BCLElBQUksQ0FBQ1YsS0FBdEIsQ0FBQTtBQUNBLFVBQUEsSUFBQSxDQUFLa0IsZUFBTCxDQUFxQlksUUFBckIsQ0FBQSxHQUFpQyxDQUFqQyxDQUFBO0FBQ0gsU0FBQTtBQUNKLE9BUEQsTUFPTyxJQUFJLElBQUEsQ0FBS2YsS0FBTCxHQUFhLENBQWpCLEVBQW9CO0FBQ3ZCLFFBQUEsSUFBQSxDQUFLQSxLQUFMLEdBQWEsSUFBQSxDQUFLRixPQUFMLEdBQWV1QixRQUFmLEdBQTBCLEdBQXZDLENBQUE7O0FBQ0EsUUFBQSxLQUFLLElBQUliLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdXLEtBQUssQ0FBQ1QsTUFBMUIsRUFBa0NGLENBQUMsRUFBbkMsRUFBdUM7QUFDbkMsVUFBQSxNQUFNYixJQUFJLEdBQUd3QixLQUFLLENBQUNYLENBQUQsQ0FBbEIsQ0FBQTtBQUNBLFVBQUEsTUFBTU8sUUFBUSxHQUFHcEIsSUFBSSxDQUFDVixLQUF0QixDQUFBO1VBQ0EsSUFBS2tCLENBQUFBLGVBQUwsQ0FBcUJZLFFBQXJCLENBQWlDcEIsR0FBQUEsSUFBSSxDQUFDMkIsS0FBTCxDQUFXWixNQUFYLEdBQW9CLENBQXJELENBQUE7QUFDSCxTQUFBO0FBQ0osT0FBQTs7TUFNRCxNQUFNYSxNQUFNLEdBQUlMLEtBQUssSUFBSSxDQUFULEdBQWEsQ0FBYixHQUFpQixDQUFDLENBQWxDLENBQUE7O0FBRUEsTUFBQSxLQUFLLElBQUlWLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdXLEtBQUssQ0FBQ1QsTUFBMUIsRUFBa0NGLENBQUMsRUFBbkMsRUFBdUM7QUFDbkMsUUFBQSxNQUFNYixJQUFJLEdBQUd3QixLQUFLLENBQUNYLENBQUQsQ0FBbEIsQ0FBQTtBQUNBLFFBQUEsTUFBTU8sUUFBUSxHQUFHcEIsSUFBSSxDQUFDVixLQUF0QixDQUFBO0FBQ0EsUUFBQSxNQUFNdUMsSUFBSSxHQUFHN0IsSUFBSSxDQUFDMkIsS0FBbEIsQ0FBQTtBQUdBLFFBQUEsTUFBTWpCLFNBQVMsR0FBRyxJQUFBLENBQUtILG9CQUFMLENBQTBCYSxRQUExQixDQUFsQixDQUFBOztRQUNBLElBQUlWLFNBQVMsS0FBS29CLFNBQWxCLEVBQTZCO0FBQ3pCQyxVQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBWSxDQUFBLDRCQUFBLEVBQThCWixRQUFTLENBQW5ELENBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxTQUFBO0FBQ0gsU0FBQTs7UUFFRCxJQUFJYSxRQUFRLEdBQUcsS0FBZixDQUFBOztBQUNBLFFBQUEsSUFBSUosSUFBSSxDQUFDZCxNQUFMLEtBQWdCLENBQXBCLEVBQXVCO1VBRW5CLEtBQUssSUFBSW1CLFlBQVksR0FBRyxJQUFLMUIsQ0FBQUEsZUFBTCxDQUFxQlksUUFBckIsQ0FBeEIsRUFBd0RjLFlBQVksR0FBR0wsSUFBSSxDQUFDZCxNQUFMLEdBQWMsQ0FBN0IsSUFBa0NtQixZQUFZLElBQUksQ0FBMUcsRUFBNkdBLFlBQVksSUFBSU4sTUFBN0gsRUFBcUk7QUFDakksWUFBQSxNQUFNTyxFQUFFLEdBQUdOLElBQUksQ0FBQ0ssWUFBRCxDQUFmLENBQUE7QUFDQSxZQUFBLE1BQU1FLEVBQUUsR0FBR1AsSUFBSSxDQUFDSyxZQUFZLEdBQUcsQ0FBaEIsQ0FBZixDQUFBOztBQUVBLFlBQUEsSUFBS0MsRUFBRSxDQUFDRSxJQUFILElBQVcsSUFBS2hDLENBQUFBLEtBQWpCLElBQTRCK0IsRUFBRSxDQUFDQyxJQUFILElBQVcsSUFBQSxDQUFLaEMsS0FBaEQsRUFBd0Q7QUFDcEQsY0FBQSxNQUFNaUMsS0FBSyxHQUFHLENBQUMsSUFBS2pDLENBQUFBLEtBQUwsR0FBYThCLEVBQUUsQ0FBQ0UsSUFBakIsS0FBMEJELEVBQUUsQ0FBQ0MsSUFBSCxHQUFVRixFQUFFLENBQUNFLElBQXZDLENBQWQsQ0FBQTs7QUFFQTNCLGNBQUFBLFNBQVMsQ0FBQ2hCLElBQVYsQ0FBZTZDLElBQWYsQ0FBb0JKLEVBQUUsQ0FBQ0ssUUFBdkIsRUFBaUNKLEVBQUUsQ0FBQ0ksUUFBcEMsRUFBOENGLEtBQTlDLENBQUEsQ0FBQTs7QUFDQTVCLGNBQUFBLFNBQVMsQ0FBQ2xCLEtBQVYsQ0FBZ0JpRCxLQUFoQixDQUFzQk4sRUFBRSxDQUFDTyxRQUF6QixFQUFtQ04sRUFBRSxDQUFDTSxRQUF0QyxFQUFnREosS0FBaEQsQ0FBQSxDQUFBOztBQUNBNUIsY0FBQUEsU0FBUyxDQUFDZCxNQUFWLENBQWlCMkMsSUFBakIsQ0FBc0JKLEVBQUUsQ0FBQ1EsS0FBekIsRUFBZ0NQLEVBQUUsQ0FBQ08sS0FBbkMsRUFBMENMLEtBQTFDLENBQUEsQ0FBQTs7Y0FDQTVCLFNBQVMsQ0FBQ3JCLFFBQVYsR0FBcUIsSUFBckIsQ0FBQTtBQUVBLGNBQUEsSUFBQSxDQUFLbUIsZUFBTCxDQUFxQlksUUFBckIsQ0FBQSxHQUFpQ2MsWUFBakMsQ0FBQTtBQUNBRCxjQUFBQSxRQUFRLEdBQUcsSUFBWCxDQUFBO0FBQ0EsY0FBQSxNQUFBO0FBQ0gsYUFBQTtBQUNKLFdBQUE7QUFDSixTQUFBOztBQUNELFFBQUEsSUFBSUosSUFBSSxDQUFDZCxNQUFMLEtBQWdCLENBQWhCLElBQXNCLENBQUNrQixRQUFELElBQWEsSUFBQSxDQUFLNUIsS0FBTCxLQUFlLEdBQTVCLElBQW1DLElBQUEsQ0FBS0YsT0FBbEUsRUFBNEU7VUFDeEVPLFNBQVMsQ0FBQ2hCLElBQVYsQ0FBZWtELElBQWYsQ0FBb0JmLElBQUksQ0FBQyxDQUFELENBQUosQ0FBUVcsUUFBNUIsQ0FBQSxDQUFBOztVQUNBOUIsU0FBUyxDQUFDbEIsS0FBVixDQUFnQm9ELElBQWhCLENBQXFCZixJQUFJLENBQUMsQ0FBRCxDQUFKLENBQVFhLFFBQTdCLENBQUEsQ0FBQTs7VUFDQWhDLFNBQVMsQ0FBQ2QsTUFBVixDQUFpQmdELElBQWpCLENBQXNCZixJQUFJLENBQUMsQ0FBRCxDQUFKLENBQVFjLEtBQTlCLENBQUEsQ0FBQTs7VUFDQWpDLFNBQVMsQ0FBQ3JCLFFBQVYsR0FBcUIsSUFBckIsQ0FBQTtBQUNILFNBQUE7QUFDSixPQUFBO0FBQ0osS0FBQTtBQUNKLEdBQUE7O0FBV0R3RCxFQUFBQSxLQUFLLENBQUNDLEtBQUQsRUFBUUMsS0FBUixFQUFlVCxLQUFmLEVBQXNCO0FBQ3ZCLElBQUEsTUFBTW5CLFFBQVEsR0FBRyxJQUFLYixDQUFBQSxpQkFBTCxDQUF1QlMsTUFBeEMsQ0FBQTs7SUFDQSxLQUFLLElBQUlGLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdNLFFBQXBCLEVBQThCTixDQUFDLEVBQS9CLEVBQW1DO0FBQy9CLE1BQUEsTUFBTW1DLElBQUksR0FBR0YsS0FBSyxDQUFDeEMsaUJBQU4sQ0FBd0JPLENBQXhCLENBQWIsQ0FBQTtBQUNBLE1BQUEsTUFBTW9DLElBQUksR0FBR0YsS0FBSyxDQUFDekMsaUJBQU4sQ0FBd0JPLENBQXhCLENBQWIsQ0FBQTtBQUNBLE1BQUEsTUFBTXFDLE1BQU0sR0FBRyxJQUFBLENBQUs1QyxpQkFBTCxDQUF1Qk8sQ0FBdkIsQ0FBZixDQUFBOztBQUVBLE1BQUEsSUFBSW1DLElBQUksQ0FBQzNELFFBQUwsSUFBaUI0RCxJQUFJLENBQUM1RCxRQUExQixFQUFvQztBQUNoQzZELFFBQUFBLE1BQU0sQ0FBQzFELEtBQVAsQ0FBYWlELEtBQWIsQ0FBbUJPLElBQUksQ0FBQ3hELEtBQXhCLEVBQStCdUQsS0FBSyxDQUFDekMsaUJBQU4sQ0FBd0JPLENBQXhCLENBQTJCckIsQ0FBQUEsS0FBMUQsRUFBaUU4QyxLQUFqRSxDQUFBLENBQUE7O0FBQ0FZLFFBQUFBLE1BQU0sQ0FBQ3hELElBQVAsQ0FBWTZDLElBQVosQ0FBaUJTLElBQUksQ0FBQ3RELElBQXRCLEVBQTRCcUQsS0FBSyxDQUFDekMsaUJBQU4sQ0FBd0JPLENBQXhCLENBQTJCbkIsQ0FBQUEsSUFBdkQsRUFBNkQ0QyxLQUE3RCxDQUFBLENBQUE7O0FBQ0FZLFFBQUFBLE1BQU0sQ0FBQ3RELE1BQVAsQ0FBYzJDLElBQWQsQ0FBbUJTLElBQUksQ0FBQ3BELE1BQXhCLEVBQWdDcUQsSUFBSSxDQUFDckQsTUFBckMsRUFBNkMwQyxLQUE3QyxDQUFBLENBQUE7O1FBQ0FZLE1BQU0sQ0FBQzdELFFBQVAsR0FBa0IsSUFBbEIsQ0FBQTtBQUNILE9BTEQsTUFLTyxJQUFJMkQsSUFBSSxDQUFDM0QsUUFBVCxFQUFtQjtBQUN0QjZELFFBQUFBLE1BQU0sQ0FBQzFELEtBQVAsQ0FBYW9ELElBQWIsQ0FBa0JJLElBQUksQ0FBQ3hELEtBQXZCLENBQUEsQ0FBQTs7QUFDQTBELFFBQUFBLE1BQU0sQ0FBQ3hELElBQVAsQ0FBWWtELElBQVosQ0FBaUJJLElBQUksQ0FBQ3RELElBQXRCLENBQUEsQ0FBQTs7QUFDQXdELFFBQUFBLE1BQU0sQ0FBQ3RELE1BQVAsQ0FBY2dELElBQWQsQ0FBbUJJLElBQUksQ0FBQ3BELE1BQXhCLENBQUEsQ0FBQTs7UUFDQXNELE1BQU0sQ0FBQzdELFFBQVAsR0FBa0IsSUFBbEIsQ0FBQTtBQUNILE9BTE0sTUFLQSxJQUFJNEQsSUFBSSxDQUFDNUQsUUFBVCxFQUFtQjtBQUN0QjZELFFBQUFBLE1BQU0sQ0FBQzFELEtBQVAsQ0FBYW9ELElBQWIsQ0FBa0JLLElBQUksQ0FBQ3pELEtBQXZCLENBQUEsQ0FBQTs7QUFDQTBELFFBQUFBLE1BQU0sQ0FBQ3hELElBQVAsQ0FBWWtELElBQVosQ0FBaUJLLElBQUksQ0FBQ3ZELElBQXRCLENBQUEsQ0FBQTs7QUFDQXdELFFBQUFBLE1BQU0sQ0FBQ3RELE1BQVAsQ0FBY2dELElBQWQsQ0FBbUJLLElBQUksQ0FBQ3JELE1BQXhCLENBQUEsQ0FBQTs7UUFDQXNELE1BQU0sQ0FBQzdELFFBQVAsR0FBa0IsSUFBbEIsQ0FBQTtBQUNILE9BQUE7QUFDSixLQUFBO0FBQ0osR0FBQTs7RUFRRDhELFFBQVEsQ0FBQ2pELEtBQUQsRUFBUTtJQUNaLElBQUtBLENBQUFBLEtBQUwsR0FBYUEsS0FBYixDQUFBOztBQUVBLElBQUEsSUFBSUEsS0FBSixFQUFXO0FBQ1AsTUFBQSxLQUFLLElBQUlXLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsSUFBS1AsQ0FBQUEsaUJBQUwsQ0FBdUJTLE1BQTNDLEVBQW1ERixDQUFDLEVBQXBELEVBQXdEO0FBQ3BELFFBQUEsTUFBTUgsU0FBUyxHQUFHLElBQUEsQ0FBS0osaUJBQUwsQ0FBdUJPLENBQXZCLENBQWxCLENBQUE7UUFDQSxNQUFNdUMsU0FBUyxHQUFHbEQsS0FBSyxDQUFDbUQsVUFBTixDQUFpQjNDLFNBQVMsQ0FBQ3BCLEtBQTNCLENBQWxCLENBQUE7O0FBQ0EsUUFBQSxJQUFBLENBQUtnQixpQkFBTCxDQUF1Qk8sQ0FBdkIsQ0FBMEJkLENBQUFBLFNBQTFCLENBQW9DcUQsU0FBcEMsQ0FBQSxDQUFBO0FBQ0gsT0FBQTtBQUNKLEtBTkQsTUFNTztBQUNILE1BQUEsS0FBSyxJQUFJdkMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxJQUFLUCxDQUFBQSxpQkFBTCxDQUF1QlMsTUFBM0MsRUFBbURGLENBQUMsRUFBcEQsRUFBd0Q7QUFDcEQsUUFBQSxJQUFBLENBQUtQLGlCQUFMLENBQXVCTyxDQUF2QixDQUEwQmQsQ0FBQUEsU0FBMUIsQ0FBb0MsSUFBcEMsQ0FBQSxDQUFBO0FBQ0gsT0FBQTtBQUNKLEtBQUE7QUFDSixHQUFBOztBQVFEdUIsRUFBQUEsV0FBVyxHQUFHO0lBQ1YsSUFBSSxJQUFBLENBQUtwQixLQUFULEVBQWdCO0FBQ1osTUFBQSxLQUFLLElBQUlXLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsSUFBS1AsQ0FBQUEsaUJBQUwsQ0FBdUJTLE1BQTNDLEVBQW1ERixDQUFDLEVBQXBELEVBQXdEO0FBQ3BELFFBQUEsTUFBTUgsU0FBUyxHQUFHLElBQUEsQ0FBS0osaUJBQUwsQ0FBdUJPLENBQXZCLENBQWxCLENBQUE7O1FBQ0EsSUFBSUgsU0FBUyxDQUFDckIsUUFBZCxFQUF3QjtBQUNwQixVQUFBLE1BQU1pRSxTQUFTLEdBQUc1QyxTQUFTLENBQUNaLFNBQVYsRUFBbEIsQ0FBQTtBQUVBd0QsVUFBQUEsU0FBUyxDQUFDQyxhQUFWLENBQXdCWCxJQUF4QixDQUE2QmxDLFNBQVMsQ0FBQ2hCLElBQXZDLENBQUEsQ0FBQTtBQUNBNEQsVUFBQUEsU0FBUyxDQUFDRSxhQUFWLENBQXdCWixJQUF4QixDQUE2QmxDLFNBQVMsQ0FBQ2xCLEtBQXZDLENBQUEsQ0FBQTtBQUNBOEQsVUFBQUEsU0FBUyxDQUFDRyxVQUFWLENBQXFCYixJQUFyQixDQUEwQmxDLFNBQVMsQ0FBQ2QsTUFBcEMsQ0FBQSxDQUFBO0FBRUEsVUFBQSxJQUFJLENBQUMwRCxTQUFTLENBQUNJLFdBQWYsRUFDSUosU0FBUyxDQUFDSyxhQUFWLEVBQUEsQ0FBQTtVQUVKakQsU0FBUyxDQUFDckIsUUFBVixHQUFxQixLQUFyQixDQUFBO0FBQ0gsU0FBQTtBQUNKLE9BQUE7QUFDSixLQUFBO0FBQ0osR0FBQTs7QUE5UFU7Ozs7In0=
