/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { extends as _extends } from '../../../_virtual/_rollupPluginBabelHelpers.js';
import { Color } from '../../../math/color.js';
import { Vec2 } from '../../../math/vec2.js';
import { Vec3 } from '../../../math/vec3.js';
import { Texture } from '../../../graphics/texture.js';
import { BoundingBox } from '../../../shape/bounding-box.js';
import { SPECULAR_BLINN, SPECULAR_PHONG } from '../../../scene/constants.js';
import { StandardMaterial } from '../../../scene/materials/standard-material.js';
import { StandardMaterialValidator } from '../../../scene/materials/standard-material-validator.js';
import { standardMaterialParameterTypes } from '../../../scene/materials/standard-material-parameters.js';

class JsonStandardMaterialParser {
  constructor() {
    this._validator = null;
  }

  parse(input) {
    const migrated = this.migrate(input);

    const validated = this._validate(migrated);

    const material = new StandardMaterial();
    this.initialize(material, validated);
    return material;
  }

  initialize(material, data) {
    if (!data.validated) {
      data = this._validate(data);
    }

    if (data.chunks) {
      material.chunks = _extends({}, data.chunks);
    }

    for (const key in data) {
      const type = standardMaterialParameterTypes[key];
      const value = data[key];

      if (type === 'vec2') {
        material[key] = new Vec2(value[0], value[1]);
      } else if (type === 'rgb') {
        material[key] = new Color(value[0], value[1], value[2]);
      } else if (type === 'texture') {
        if (value instanceof Texture) {
          material[key] = value;
        } else if (!(material[key] instanceof Texture && typeof value === 'number' && value > 0)) {
          material[key] = null;
        }
      } else if (type === 'cubemap') {
        if (value instanceof Texture) {
          material[key] = value;
        } else if (!(material[key] instanceof Texture && typeof value === 'number' && value > 0)) {
          material[key] = null;
        }

        if (key === 'cubeMap' && !value) {
          material.prefilteredCubemaps = null;
        }
      } else if (type === 'boundingbox') {
        const center = new Vec3(value.center[0], value.center[1], value.center[2]);
        const halfExtents = new Vec3(value.halfExtents[0], value.halfExtents[1], value.halfExtents[2]);
        material[key] = new BoundingBox(center, halfExtents);
      } else {
        material[key] = data[key];
      }
    }

    material.update();
  }

  migrate(data) {
    if (data.shadingModel === undefined) {
      if (data.shader === 'blinn') {
        data.shadingModel = SPECULAR_BLINN;
      } else {
        data.shadingModel = SPECULAR_PHONG;
      }
    }

    if (data.shader) delete data.shader;

    if (data.mapping_format) {
      data.mappingFormat = data.mapping_format;
      delete data.mapping_format;
    }

    let i;
    const RENAMED_PROPERTIES = [['bumpMapFactor', 'bumpiness'], ['aoUvSet', 'aoMapUv'], ['aoMapVertexColor', 'aoVertexColor'], ['diffuseMapVertexColor', 'diffuseVertexColor'], ['emissiveMapVertexColor', 'emissiveVertexColor'], ['specularMapVertexColor', 'specularVertexColor'], ['metalnessMapVertexColor', 'metalnessVertexColor'], ['opacityMapVertexColor', 'opacityVertexColor'], ['glossMapVertexColor', 'glossVertexColor'], ['lightMapVertexColor', 'lightVertexColor'], ['diffuseMapTint', 'diffuseTint'], ['specularMapTint', 'specularTint'], ['emissiveMapTint', 'emissiveTint'], ['metalnessMapTint', 'metalnessTint']];

    for (i = 0; i < RENAMED_PROPERTIES.length; i++) {
      const _old = RENAMED_PROPERTIES[i][0];
      const _new = RENAMED_PROPERTIES[i][1];

      if (data[_old] !== undefined && !(data[_new] !== undefined)) {
        data[_new] = data[_old];
        delete data[_old];
      }
    }

    const DEPRECATED_PROPERTIES = ['fresnelFactor', 'shadowSampleType'];

    for (i = 0; i < DEPRECATED_PROPERTIES.length; i++) {
      const name = DEPRECATED_PROPERTIES[i];

      if (data.hasOwnProperty(name)) {
        delete data[name];
      }
    }

    return data;
  }

  _validate(data) {
    if (!data.validated) {
      if (!this._validator) {
        this._validator = new StandardMaterialValidator();
      }

      this._validator.validate(data);
    }

    return data;
  }

}

export { JsonStandardMaterialParser };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zdGFuZGFyZC1tYXRlcmlhbC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3Jlc291cmNlcy9wYXJzZXIvbWF0ZXJpYWwvanNvbi1zdGFuZGFyZC1tYXRlcmlhbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb2xvciB9IGZyb20gJy4uLy4uLy4uL21hdGgvY29sb3IuanMnO1xuaW1wb3J0IHsgVmVjMiB9IGZyb20gJy4uLy4uLy4uL21hdGgvdmVjMi5qcyc7XG5pbXBvcnQgeyBWZWMzIH0gZnJvbSAnLi4vLi4vLi4vbWF0aC92ZWMzLmpzJztcblxuaW1wb3J0IHsgVGV4dHVyZSB9IGZyb20gJy4uLy4uLy4uL2dyYXBoaWNzL3RleHR1cmUuanMnO1xuXG5pbXBvcnQgeyBCb3VuZGluZ0JveCB9IGZyb20gJy4uLy4uLy4uL3NoYXBlL2JvdW5kaW5nLWJveC5qcyc7XG5cbmltcG9ydCB7IFNQRUNVTEFSX0JMSU5OLCBTUEVDVUxBUl9QSE9ORyB9IGZyb20gJy4uLy4uLy4uL3NjZW5lL2NvbnN0YW50cy5qcyc7XG5cbmltcG9ydCB7IFN0YW5kYXJkTWF0ZXJpYWwgfSBmcm9tICcuLi8uLi8uLi9zY2VuZS9tYXRlcmlhbHMvc3RhbmRhcmQtbWF0ZXJpYWwuanMnO1xuaW1wb3J0IHsgU3RhbmRhcmRNYXRlcmlhbFZhbGlkYXRvciB9IGZyb20gJy4uLy4uLy4uL3NjZW5lL21hdGVyaWFscy9zdGFuZGFyZC1tYXRlcmlhbC12YWxpZGF0b3IuanMnO1xuaW1wb3J0IHsgc3RhbmRhcmRNYXRlcmlhbFBhcmFtZXRlclR5cGVzIH0gZnJvbSAnLi4vLi4vLi4vc2NlbmUvbWF0ZXJpYWxzL3N0YW5kYXJkLW1hdGVyaWFsLXBhcmFtZXRlcnMuanMnO1xuXG4vKipcbiAqIENvbnZlcnQgaW5jb21pbmcgSlNPTiBkYXRhIGludG8gYSB7QGxpbmsgU3RhbmRhcmRNYXRlcmlhbH0uXG4gKlxuICogQGlnbm9yZVxuICovXG5jbGFzcyBKc29uU3RhbmRhcmRNYXRlcmlhbFBhcnNlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX3ZhbGlkYXRvciA9IG51bGw7XG4gICAgfVxuXG4gICAgcGFyc2UoaW5wdXQpIHtcbiAgICAgICAgY29uc3QgbWlncmF0ZWQgPSB0aGlzLm1pZ3JhdGUoaW5wdXQpO1xuICAgICAgICBjb25zdCB2YWxpZGF0ZWQgPSB0aGlzLl92YWxpZGF0ZShtaWdyYXRlZCk7XG5cbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBuZXcgU3RhbmRhcmRNYXRlcmlhbCgpO1xuICAgICAgICB0aGlzLmluaXRpYWxpemUobWF0ZXJpYWwsIHZhbGlkYXRlZCk7XG5cbiAgICAgICAgcmV0dXJuIG1hdGVyaWFsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgbWF0ZXJpYWwgcHJvcGVydGllcyBmcm9tIHRoZSBtYXRlcmlhbCBkYXRhIGJsb2NrIGUuZy4gTG9hZGluZyBmcm9tIHNlcnZlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RhbmRhcmRNYXRlcmlhbH0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gYmUgaW5pdGlhbGl6ZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBUaGUgZGF0YSBibG9jayB0aGF0IGlzIHVzZWQgdG8gaW5pdGlhbGl6ZS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplKG1hdGVyaWFsLCBkYXRhKSB7XG4gICAgICAgIC8vIHVzdWFsIGZsb3cgaXMgdGhhdCBkYXRhIGlzIHZhbGlkYXRlZCBpbiByZXNvdXJjZSBsb2FkZXJcbiAgICAgICAgLy8gYnV0IGlmIG5vdCwgdmFsaWRhdGUgaGVyZS5cbiAgICAgICAgaWYgKCFkYXRhLnZhbGlkYXRlZCkge1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMuX3ZhbGlkYXRlKGRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEuY2h1bmtzKSB7XG4gICAgICAgICAgICBtYXRlcmlhbC5jaHVua3MgPSB7IC4uLmRhdGEuY2h1bmtzIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbml0aWFsaXplIG1hdGVyaWFsIHZhbHVlcyBmcm9tIHRoZSBpbnB1dCBkYXRhXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBzdGFuZGFyZE1hdGVyaWFsUGFyYW1ldGVyVHlwZXNba2V5XTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZGF0YVtrZXldO1xuXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ3ZlYzInKSB7XG4gICAgICAgICAgICAgICAgbWF0ZXJpYWxba2V5XSA9IG5ldyBWZWMyKHZhbHVlWzBdLCB2YWx1ZVsxXSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdyZ2InKSB7XG4gICAgICAgICAgICAgICAgbWF0ZXJpYWxba2V5XSA9IG5ldyBDb2xvcih2YWx1ZVswXSwgdmFsdWVbMV0sIHZhbHVlWzJdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3RleHR1cmUnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgVGV4dHVyZSkge1xuICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghKG1hdGVyaWFsW2tleV0gaW5zdGFuY2VvZiBUZXh0dXJlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgdmFsdWUgPiAwKSkge1xuICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbFtrZXldID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gT1RIRVJXSVNFOiBtYXRlcmlhbCBhbHJlYWR5IGhhcyBhIHRleHR1cmUgYXNzaWduZWQsIGJ1dCBkYXRhIGNvbnRhaW5zIGEgdmFsaWQgYXNzZXQgaWQgKHdoaWNoIG1lYW5zIHRoZSBhc3NldCBpc24ndCB5ZXQgbG9hZGVkKVxuICAgICAgICAgICAgICAgIC8vIGxlYXZlIGN1cnJlbnQgdGV4dHVyZSAocHJvYmFibHkgYSBwbGFjZWhvbGRlcikgdW50aWwgdGhlIGFzc2V0IGlzIGxvYWRlZFxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnY3ViZW1hcCcpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBUZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGVyaWFsW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEobWF0ZXJpYWxba2V5XSBpbnN0YW5jZW9mIFRleHR1cmUgJiYgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiB2YWx1ZSA+IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGVyaWFsW2tleV0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGNsZWFyaW5nIHRoZSBjdWJlbWFwIG11c3QgYWxzbyBjbGVhciB0aGUgcHJlZmlsdGVyZWQgZGF0YVxuICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICdjdWJlTWFwJyAmJiAhdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0ZXJpYWwucHJlZmlsdGVyZWRDdWJlbWFwcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gT1RIRVJXSVNFOiBtYXRlcmlhbCBhbHJlYWR5IGhhcyBhIHRleHR1cmUgYXNzaWduZWQsIGJ1dCBkYXRhIGNvbnRhaW5zIGEgdmFsaWQgYXNzZXQgaWQgKHdoaWNoIG1lYW5zIHRoZSBhc3NldCBpc24ndCB5ZXQgbG9hZGVkKVxuICAgICAgICAgICAgICAgIC8vIGxlYXZlIGN1cnJlbnQgdGV4dHVyZSAocHJvYmFibHkgYSBwbGFjZWhvbGRlcikgdW50aWwgdGhlIGFzc2V0IGlzIGxvYWRlZFxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnYm91bmRpbmdib3gnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VudGVyID0gbmV3IFZlYzModmFsdWUuY2VudGVyWzBdLCB2YWx1ZS5jZW50ZXJbMV0sIHZhbHVlLmNlbnRlclsyXSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFsZkV4dGVudHMgPSBuZXcgVmVjMyh2YWx1ZS5oYWxmRXh0ZW50c1swXSwgdmFsdWUuaGFsZkV4dGVudHNbMV0sIHZhbHVlLmhhbGZFeHRlbnRzWzJdKTtcbiAgICAgICAgICAgICAgICBtYXRlcmlhbFtrZXldID0gbmV3IEJvdW5kaW5nQm94KGNlbnRlciwgaGFsZkV4dGVudHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBudW1iZXIsIGJvb2xlYW4gYW5kIGVudW0gdHlwZXMgZG9uJ3QgcmVxdWlyZSB0eXBlIGNyZWF0aW9uXG4gICAgICAgICAgICAgICAgbWF0ZXJpYWxba2V5XSA9IGRhdGFba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG1hdGVyaWFsLnVwZGF0ZSgpO1xuICAgIH1cblxuICAgIC8vIGNvbnZlcnQgYW55IHByb3BlcnRpZXMgdGhhdCBhcmUgb3V0IG9mIGRhdGVcbiAgICAvLyBvciBmcm9tIG9sZCB2ZXJzaW9ucyBpbnRvIGN1cnJlbnQgdmVyc2lvblxuICAgIG1pZ3JhdGUoZGF0YSkge1xuICAgICAgICAvLyByZXBsYWNlIG9sZCBzaGFkZXIgcHJvcGVydHkgd2l0aCBuZXcgc2hhZGluZ01vZGVsIHByb3BlcnR5XG4gICAgICAgIGlmIChkYXRhLnNoYWRpbmdNb2RlbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5zaGFkZXIgPT09ICdibGlubicpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnNoYWRpbmdNb2RlbCA9IFNQRUNVTEFSX0JMSU5OO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkYXRhLnNoYWRpbmdNb2RlbCA9IFNQRUNVTEFSX1BIT05HO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLnNoYWRlcikgZGVsZXRlIGRhdGEuc2hhZGVyO1xuXG4gICAgICAgIC8vIG1ha2UgSlMgc3R5bGVcbiAgICAgICAgaWYgKGRhdGEubWFwcGluZ19mb3JtYXQpIHtcbiAgICAgICAgICAgIGRhdGEubWFwcGluZ0Zvcm1hdCA9IGRhdGEubWFwcGluZ19mb3JtYXQ7XG4gICAgICAgICAgICBkZWxldGUgZGF0YS5tYXBwaW5nX2Zvcm1hdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpO1xuICAgICAgICAvLyBsaXN0IG9mIHByb3BlcnRpZXMgdGhhdCBoYXZlIGJlZW4gcmVuYW1lZCBpbiBTdGFuZGFyZE1hdGVyaWFsXG4gICAgICAgIC8vIGJ1dCBtYXkgc3RpbGwgZXhpc3RzIGluIGRhdGEgaW4gb2xkIGZvcm1hdFxuICAgICAgICBjb25zdCBSRU5BTUVEX1BST1BFUlRJRVMgPSBbXG4gICAgICAgICAgICBbJ2J1bXBNYXBGYWN0b3InLCAnYnVtcGluZXNzJ10sXG5cbiAgICAgICAgICAgIFsnYW9VdlNldCcsICdhb01hcFV2J10sXG5cbiAgICAgICAgICAgIFsnYW9NYXBWZXJ0ZXhDb2xvcicsICdhb1ZlcnRleENvbG9yJ10sXG4gICAgICAgICAgICBbJ2RpZmZ1c2VNYXBWZXJ0ZXhDb2xvcicsICdkaWZmdXNlVmVydGV4Q29sb3InXSxcbiAgICAgICAgICAgIFsnZW1pc3NpdmVNYXBWZXJ0ZXhDb2xvcicsICdlbWlzc2l2ZVZlcnRleENvbG9yJ10sXG4gICAgICAgICAgICBbJ3NwZWN1bGFyTWFwVmVydGV4Q29sb3InLCAnc3BlY3VsYXJWZXJ0ZXhDb2xvciddLFxuICAgICAgICAgICAgWydtZXRhbG5lc3NNYXBWZXJ0ZXhDb2xvcicsICdtZXRhbG5lc3NWZXJ0ZXhDb2xvciddLFxuICAgICAgICAgICAgWydvcGFjaXR5TWFwVmVydGV4Q29sb3InLCAnb3BhY2l0eVZlcnRleENvbG9yJ10sXG4gICAgICAgICAgICBbJ2dsb3NzTWFwVmVydGV4Q29sb3InLCAnZ2xvc3NWZXJ0ZXhDb2xvciddLFxuICAgICAgICAgICAgWydsaWdodE1hcFZlcnRleENvbG9yJywgJ2xpZ2h0VmVydGV4Q29sb3InXSxcblxuICAgICAgICAgICAgWydkaWZmdXNlTWFwVGludCcsICdkaWZmdXNlVGludCddLFxuICAgICAgICAgICAgWydzcGVjdWxhck1hcFRpbnQnLCAnc3BlY3VsYXJUaW50J10sXG4gICAgICAgICAgICBbJ2VtaXNzaXZlTWFwVGludCcsICdlbWlzc2l2ZVRpbnQnXSxcbiAgICAgICAgICAgIFsnbWV0YWxuZXNzTWFwVGludCcsICdtZXRhbG5lc3NUaW50J11cbiAgICAgICAgXTtcblxuICAgICAgICAvLyBpZiBhbiBvbGQgcHJvcGVydHkgbmFtZSBleGlzdHMgd2l0aG91dCBhIG5ldyBvbmUsXG4gICAgICAgIC8vIG1vdmUgcHJvcGVydHkgaW50byBuZXcgbmFtZSBhbmQgZGVsZXRlIG9sZCBvbmUuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBSRU5BTUVEX1BST1BFUlRJRVMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IF9vbGQgPSBSRU5BTUVEX1BST1BFUlRJRVNbaV1bMF07XG4gICAgICAgICAgICBjb25zdCBfbmV3ID0gUkVOQU1FRF9QUk9QRVJUSUVTW2ldWzFdO1xuXG4gICAgICAgICAgICBpZiAoZGF0YVtfb2xkXSAhPT0gdW5kZWZpbmVkICYmICEoZGF0YVtfbmV3XSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgICAgIGRhdGFbX25ld10gPSBkYXRhW19vbGRdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBkYXRhW19vbGRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJvcGVydGllcyB0aGF0IG1heSBleGlzdCBpbiBpbnB1dCBkYXRhLCBidXQgYXJlIG5vdyBpZ25vcmVkXG4gICAgICAgIGNvbnN0IERFUFJFQ0FURURfUFJPUEVSVElFUyA9IFtcbiAgICAgICAgICAgICdmcmVzbmVsRmFjdG9yJyxcbiAgICAgICAgICAgICdzaGFkb3dTYW1wbGVUeXBlJ1xuICAgICAgICBdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBERVBSRUNBVEVEX1BST1BFUlRJRVMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBERVBSRUNBVEVEX1BST1BFUlRJRVNbaV07XG4gICAgICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBkYXRhW25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgZm9yIGludmFsaWQgcHJvcGVydGllc1xuICAgIF92YWxpZGF0ZShkYXRhKSB7XG4gICAgICAgIGlmICghZGF0YS52YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fdmFsaWRhdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdmFsaWRhdG9yID0gbmV3IFN0YW5kYXJkTWF0ZXJpYWxWYWxpZGF0b3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbGlkYXRvci52YWxpZGF0ZShkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEpzb25TdGFuZGFyZE1hdGVyaWFsUGFyc2VyIH07XG4iXSwibmFtZXMiOlsiSnNvblN0YW5kYXJkTWF0ZXJpYWxQYXJzZXIiLCJjb25zdHJ1Y3RvciIsIl92YWxpZGF0b3IiLCJwYXJzZSIsImlucHV0IiwibWlncmF0ZWQiLCJtaWdyYXRlIiwidmFsaWRhdGVkIiwiX3ZhbGlkYXRlIiwibWF0ZXJpYWwiLCJTdGFuZGFyZE1hdGVyaWFsIiwiaW5pdGlhbGl6ZSIsImRhdGEiLCJjaHVua3MiLCJrZXkiLCJ0eXBlIiwic3RhbmRhcmRNYXRlcmlhbFBhcmFtZXRlclR5cGVzIiwidmFsdWUiLCJWZWMyIiwiQ29sb3IiLCJUZXh0dXJlIiwicHJlZmlsdGVyZWRDdWJlbWFwcyIsImNlbnRlciIsIlZlYzMiLCJoYWxmRXh0ZW50cyIsIkJvdW5kaW5nQm94IiwidXBkYXRlIiwic2hhZGluZ01vZGVsIiwidW5kZWZpbmVkIiwic2hhZGVyIiwiU1BFQ1VMQVJfQkxJTk4iLCJTUEVDVUxBUl9QSE9ORyIsIm1hcHBpbmdfZm9ybWF0IiwibWFwcGluZ0Zvcm1hdCIsImkiLCJSRU5BTUVEX1BST1BFUlRJRVMiLCJsZW5ndGgiLCJfb2xkIiwiX25ldyIsIkRFUFJFQ0FURURfUFJPUEVSVElFUyIsIm5hbWUiLCJoYXNPd25Qcm9wZXJ0eSIsIlN0YW5kYXJkTWF0ZXJpYWxWYWxpZGF0b3IiLCJ2YWxpZGF0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxNQUFNQSwwQkFBTixDQUFpQztBQUM3QkMsRUFBQUEsV0FBVyxHQUFHO0lBQ1YsSUFBS0MsQ0FBQUEsVUFBTCxHQUFrQixJQUFsQixDQUFBO0FBQ0gsR0FBQTs7RUFFREMsS0FBSyxDQUFDQyxLQUFELEVBQVE7QUFDVCxJQUFBLE1BQU1DLFFBQVEsR0FBRyxJQUFBLENBQUtDLE9BQUwsQ0FBYUYsS0FBYixDQUFqQixDQUFBOztBQUNBLElBQUEsTUFBTUcsU0FBUyxHQUFHLElBQUEsQ0FBS0MsU0FBTCxDQUFlSCxRQUFmLENBQWxCLENBQUE7O0FBRUEsSUFBQSxNQUFNSSxRQUFRLEdBQUcsSUFBSUMsZ0JBQUosRUFBakIsQ0FBQTtBQUNBLElBQUEsSUFBQSxDQUFLQyxVQUFMLENBQWdCRixRQUFoQixFQUEwQkYsU0FBMUIsQ0FBQSxDQUFBO0FBRUEsSUFBQSxPQUFPRSxRQUFQLENBQUE7QUFDSCxHQUFBOztBQVFERSxFQUFBQSxVQUFVLENBQUNGLFFBQUQsRUFBV0csSUFBWCxFQUFpQjtBQUd2QixJQUFBLElBQUksQ0FBQ0EsSUFBSSxDQUFDTCxTQUFWLEVBQXFCO0FBQ2pCSyxNQUFBQSxJQUFJLEdB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
