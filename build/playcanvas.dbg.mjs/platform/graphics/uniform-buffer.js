/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../../core/debug.js';
import { uniformTypeToName, UNIFORMTYPE_FLOAT, UNIFORMTYPE_VEC2, UNIFORMTYPE_VEC3, UNIFORMTYPE_VEC4, UNIFORMTYPE_INT, UNIFORMTYPE_IVEC2, UNIFORMTYPE_IVEC3, UNIFORMTYPE_IVEC4, UNIFORMTYPE_MAT2, UNIFORMTYPE_MAT3, UNIFORMTYPE_FLOATARRAY, UNIFORMTYPE_VEC2ARRAY, UNIFORMTYPE_VEC3ARRAY } from './constants.js';

// Uniform buffer set functions - only implemented for types for which the default
// array to buffer copy does not work, or could be slower.
const _updateFunctions = [];
_updateFunctions[UNIFORMTYPE_FLOAT] = function (uniformBuffer, value, offset) {
  const dst = uniformBuffer.storageFloat32;
  dst[offset] = value;
};
_updateFunctions[UNIFORMTYPE_VEC2] = (uniformBuffer, value, offset) => {
  const dst = uniformBuffer.storageFloat32;
  dst[offset] = value[0];
  dst[offset + 1] = value[1];
};
_updateFunctions[UNIFORMTYPE_VEC3] = (uniformBuffer, value, offset) => {
  const dst = uniformBuffer.storageFloat32;
  dst[offset] = value[0];
  dst[offset + 1] = value[1];
  dst[offset + 2] = value[2];
};
_updateFunctions[UNIFORMTYPE_VEC4] = (uniformBuffer, value, offset) => {
  const dst = uniformBuffer.storageFloat32;
  dst[offset] = value[0];
  dst[offset + 1] = value[1];
  dst[offset + 2] = value[2];
  dst[offset + 3] = value[3];
};
_updateFunctions[UNIFORMTYPE_INT] = function (uniformBuffer, value, offset) {
  const dst = uniformBuffer.storageInt32;
  dst[offset] = value;
};
_updateFunctions[UNIFORMTYPE_IVEC2] = function (uniformBuffer, value, offset) {
  const dst = uniformBuffer.storageInt32;
  dst[offset] = value[0];
  dst[offset + 1] = value[1];
};
_updateFunctions[UNIFORMTYPE_IVEC3] = function (uniformBuffer, value, offset) {
  const dst = uniformBuffer.storageInt32;
  dst[offset] = value[0];
  dst[offset + 1] = value[1];
  dst[offset + 2] = value[2];
};
_updateFunctions[UNIFORMTYPE_IVEC4] = function (uniformBuffer, value, offset) {
  const dst = uniformBuffer.storageInt32;
  dst[offset] = value[0];
  dst[offset + 1] = value[1];
  dst[offset + 2] = value[2];
  dst[offset + 3] = value[3];
};

// convert from continuous array to vec2[3] with padding to vec4[2]
_updateFunctions[UNIFORMTYPE_MAT2] = (uniformBuffer, value, offset) => {
  const dst = uniformBuffer.storageFloat32;
  dst[offset] = value[0];
  dst[offset + 1] = value[1];
  dst[offset + 4] = value[2];
  dst[offset + 5] = value[3];
  dst[offset + 8] = value[4];
  dst[offset + 9] = value[5];
};

// convert from continuous array to vec3[3] with padding to vec4[3]
_updateFunctions[UNIFORMTYPE_MAT3] = (uniformBuffer, value, offset) => {
  const dst = uniformBuffer.storageFloat32;
  dst[offset] = value[0];
  dst[offset + 1] = value[1];
  dst[offset + 2] = value[2];
  dst[offset + 4] = value[3];
  dst[offset + 5] = value[4];
  dst[offset + 6] = value[5];
  dst[offset + 8] = value[6];
  dst[offset + 9] = value[7];
  dst[offset + 10] = value[8];
};
_updateFunctions[UNIFORMTYPE_FLOATARRAY] = function (uniformBuffer, value, offset, count) {
  const dst = uniformBuffer.storageFloat32;
  for (let i = 0; i < count; i++) {
    dst[offset + i * 4] = value[i];
  }
};
_updateFunctions[UNIFORMTYPE_VEC2ARRAY] = (uniformBuffer, value, offset, count) => {
  const dst = uniformBuffer.storageFloat32;
  for (let i = 0; i < count; i++) {
    dst[offset + i * 4] = value[i * 2];
    dst[offset + i * 4 + 1] = value[i * 2 + 1];
  }
};
_updateFunctions[UNIFORMTYPE_VEC3ARRAY] = (uniformBuffer, value, offset, count) => {
  const dst = uniformBuffer.storageFloat32;
  for (let i = 0; i < count; i++) {
    dst[offset + i * 4] = value[i * 3];
    dst[offset + i * 4 + 1] = value[i * 3 + 1];
    dst[offset + i * 4 + 2] = value[i * 3 + 2];
  }
};

/**
 * A uniform buffer represents a GPU memory buffer storing the uniforms.
 *
 * @ignore
 */
class UniformBuffer {
  /**
   * Create a new UniformBuffer instance.
   *
   * @param {import('./graphics-device.js').GraphicsDevice} graphicsDevice - The graphics device
   * used to manage this uniform buffer.
   * @param {import('./uniform-buffer-format.js').UniformBufferFormat} format - Format of the
   * uniform buffer.
   */
  constructor(graphicsDevice, format) {
    this.device = graphicsDevice;
    this.format = format;
    Debug.assert(format);
    this.impl = graphicsDevice.createUniformBufferImpl(this);
    this.storage = new ArrayBuffer(format.byteSize);
    this.storageFloat32 = new Float32Array(this.storage);
    this.storageInt32 = new Int32Array(this.storage);
    graphicsDevice._vram.ub += this.format.byteSize;

    // TODO: register with the device and handle lost context
    // this.device.buffers.push(this);
  }

  /**
   * Frees resources associated with this uniform buffer.
   */
  destroy() {
    // // stop tracking the vertex buffer
    const device = this.device;

    // TODO: remove the buffer from the list on the device (lost context handling)

    this.impl.destroy(device);
    device._vram.ub -= this.format.byteSize;
  }

  /**
   * Called when the rendering context was lost. It releases all context related resources.
   *
   * @ignore
   */
  loseContext() {
    this.impl.loseContext();
  }

  /**
   * Assign a value to the uniform specified by its format. This is the fast version of assigning
   * a value to a uniform, avoiding any lookups.
   *
   * @param {import('./uniform-buffer-format.js').UniformFormat} uniformFormat - The format of
   * the uniform.
   */
  setUniform(uniformFormat) {
    Debug.assert(uniformFormat);
    const offset = uniformFormat.offset;
    const value = uniformFormat.scopeId.value;
    if (value !== null && value !== undefined) {
      const updateFunction = _updateFunctions[uniformFormat.updateType];
      if (updateFunction) {
        updateFunction(this, value, offset, uniformFormat.count);
      } else {
        this.storageFloat32.set(value, offset);
      }
    } else {
      Debug.warnOnce(`Value was not set when assigning to uniform [${uniformFormat.name}]` + `, expected type ${uniformTypeToName[uniformFormat.type]}`);
    }
  }

  /**
   * Assign a value to the uniform specified by name.
   *
   * @param {string} name - The name of the uniform.
   */
  set(name) {
    const uniformFormat = this.format.map.get(name);
    Debug.assert(uniformFormat, `Uniform name [${name}] is not part of the Uniform buffer.`);
    if (uniformFormat) {
      this.setUniform(uniformFormat);
    }
  }
  update() {
    // set new values
    const uniforms = this.format.uniforms;
    for (let i = 0; i < uniforms.length; i++) {
      this.setUniform(uniforms[i]);
    }

    // Upload the new data
    this.impl.unlock(this);
  }
}

export { UniformBuffer };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pZm9ybS1idWZmZXIuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9wbGF0Zm9ybS9ncmFwaGljcy91bmlmb3JtLWJ1ZmZlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEZWJ1ZyB9IGZyb20gJy4uLy4uL2NvcmUvZGVidWcuanMnO1xuaW1wb3J0IHtcbiAgICB1bmlmb3JtVHlwZVRvTmFtZSxcbiAgICBVTklGT1JNVFlQRV9JTlQsIFVOSUZPUk1UWVBFX0ZMT0FULCBVTklGT1JNVFlQRV9WRUMyLCBVTklGT1JNVFlQRV9WRUMzLFxuICAgIFVOSUZPUk1UWVBFX1ZFQzQsIFVOSUZPUk1UWVBFX0lWRUMyLCBVTklGT1JNVFlQRV9JVkVDMywgVU5JRk9STVRZUEVfSVZFQzQsXG4gICAgVU5JRk9STVRZUEVfRkxPQVRBUlJBWSwgVU5JRk9STVRZUEVfVkVDMkFSUkFZLCBVTklGT1JNVFlQRV9WRUMzQVJSQVksXG4gICAgVU5JRk9STVRZUEVfTUFUMiwgVU5JRk9STVRZUEVfTUFUM1xufSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5cbi8vIFVuaWZvcm0gYnVmZmVyIHNldCBmdW5jdGlvbnMgLSBvbmx5IGltcGxlbWVudGVkIGZvciB0eXBlcyBmb3Igd2hpY2ggdGhlIGRlZmF1bHRcbi8vIGFycmF5IHRvIGJ1ZmZlciBjb3B5IGRvZXMgbm90IHdvcmssIG9yIGNvdWxkIGJlIHNsb3dlci5cbmNvbnN0IF91cGRhdGVGdW5jdGlvbnMgPSBbXTtcblxuX3VwZGF0ZUZ1bmN0aW9uc1tVTklGT1JNVFlQRV9GTE9BVF0gPSBmdW5jdGlvbiAodW5pZm9ybUJ1ZmZlciwgdmFsdWUsIG9mZnNldCkge1xuICAgIGNvbnN0IGRzdCA9IHVuaWZvcm1CdWZmZXIuc3RvcmFnZUZsb2F0MzI7XG4gICAgZHN0W29mZnNldF0gPSB2YWx1ZTtcbn07XG5cbl91cGRhdGVGdW5jdGlvbnNbVU5JRk9STVRZUEVfVkVDMl0gPSAodW5pZm9ybUJ1ZmZlciwgdmFsdWUsIG9mZnNldCkgPT4ge1xuICAgIGNvbnN0IGRzdCA9IHVuaWZvcm1CdWZmZXIuc3RvcmFnZUZsb2F0MzI7XG4gICAgZHN0W29mZnNldF0gPSB2YWx1ZVswXTtcbiAgICBkc3Rbb2Zmc2V0ICsgMV0gPSB2YWx1ZVsxXTtcbn07XG5cbl91cGRhdGVGdW5jdGlvbnNbVU5JRk9STVRZUEVfVkVDM10gPSAodW5pZm9ybUJ1ZmZlciwgdmFsdWUsIG9mZnNldCkgPT4ge1xuICAgIGNvbnN0IGRzdCA9IHVuaWZvcm1CdWZmZXIuc3RvcmFnZUZsb2F0MzI7XG4gICAgZHN0W29mZnNldF0gPSB2YWx1ZVswXTtcbiAgICBkc3Rbb2Zmc2V0ICsgMV0gPSB2YWx1ZVsxXTtcbiAgICBkc3Rbb2Zmc2V0ICsgMl0gPSB2YWx1ZVsyXTtcbn07XG5cbl91cGRhdGVGdW5jdGlvbnNbVU5JRk9STVRZUEVfVkVDNF0gPSAodW5pZm9ybUJ1ZmZlciwgdmFsdWUsIG9mZnNldCkgPT4ge1xuICAgIGNvbnN0IGRzdCA9IHVuaWZvcm1CdWZmZXIuc3RvcmFnZUZsb2F0MzI7XG4gICAgZHN0W29mZnNldF0gPSB2YWx1ZVswXTtcbiAgICBkc3Rbb2Zmc2V0ICsgMV0gPSB2YWx1ZVsxXTtcbiAgICBkc3Rbb2Zmc2V0ICsgMl0gPSB2YWx1ZVsyXTtcbiAgICBkc3Rbb2Zmc2V0ICsgM10gPSB2YWx1ZVszXTtcbn07XG5cbl91cGRhdGVGdW5jdGlvbnNbVU5JRk9STVRZUEVfSU5UXSA9IGZ1bmN0aW9uICh1bmlmb3JtQnVmZmVyLCB2YWx1ZSwgb2Zmc2V0KSB7XG4gICAgY29uc3QgZHN0ID0gdW5pZm9ybUJ1ZmZlci5zdG9yYWdlSW50MzI7XG4gICAgZHN0W29mZnNldF0gPSB2YWx1ZTtcbn07XG5cbl91cGRhdGVGdW5jdGlvbnNbVU5JRk9STVRZUEVfSVZFQzJdID0gZnVuY3Rpb24gKHVuaWZvcm1CdWZmZXIsIHZhbHVlLCBvZmZzZXQpIHtcbiAgICBjb25zdCBkc3QgPSB1bmlmb3JtQnVmZmVyLnN0b3JhZ2VJbnQzMjtcbiAgICBkc3Rbb2Zmc2V0XSA9IHZhbHVlWzBdO1xuICAgIGRzdFtvZmZzZXQgKyAxXSA9IHZhbHVlWzFdO1xufTtcblxuX3VwZGF0ZUZ1bmN0aW9uc1tVTklGT1JNVFlQRV9JVkVDM10gPSBmdW5jdGlvbiAodW5pZm9ybUJ1ZmZlciwgdmFsdWUsIG9mZnNldCkge1xuICAgIGNvbnN0IGRzdCA9IHVuaWZvcm1CdWZmZXIuc3RvcmFnZUludDMyO1xuICAgIGRzdFtvZmZzZXRdID0gdmFsdWVbMF07XG4gICAgZHN0W29mZnNldCArIDFdID0gdmFsdWVbMV07XG4gICAgZHN0W29mZnNldCArIDJdID0gdmFsdWVbMl07XG59O1xuXG5fdXBkYXRlRnVuY3Rpb25zW1VOSUZPUk1UWVBFX0lWRUM0XSA9IGZ1bmN0aW9uICh1bmlmb3JtQnVmZmVyLCB2YWx1ZSwgb2Zmc2V0KSB7XG4gICAgY29uc3QgZHN0ID0gdW5pZm9ybUJ1ZmZlci5zdG9yYWdlSW50MzI7XG4gICAgZHN0W29mZnNldF0gPSB2YWx1ZVswXTtcbiAgICBkc3Rbb2Zmc2V0ICsgMV0gPSB2YWx1ZVsxXTtcbiAgICBkc3Rbb2Zmc2V0ICsgMl0gPSB2YWx1ZVsyXTtcbiAgICBkc3Rbb2Zmc2V0ICsgM10gPSB2YWx1ZVszXTtcbn07XG5cbi8vIGNvbnZlcnQgZnJvbSBjb250aW51b3VzIGFycmF5IHRvIHZlYzJbM10gd2l0aCBwYWRkaW5nIHRvIHZlYzRbMl1cbl91cGRhdGVGdW5jdGlvbnNbVU5JRk9STVRZUEVfTUFUMl0gPSAodW5pZm9ybUJ1ZmZlciwgdmFsdWUsIG9mZnNldCkgPT4ge1xuICAgIGNvbnN0IGRzdCA9IHVuaWZvcm1CdWZmZXIuc3RvcmFnZUZsb2F0MzI7XG4gICAgZHN0W29mZnNldF0gPSB2YWx1ZVswXTtcbiAgICBkc3Rbb2Zmc2V0ICsgMV0gPSB2YWx1ZVsxXTtcblxuICAgIGRzdFtvZmZzZXQgKyA0XSA9IHZhbHVlWzJdO1xuICAgIGRzdFtvZmZzZXQgKyA1XSA9IHZhbHVlWzNdO1xuXG4gICAgZHN0W29mZnNldCArIDhdID0gdmFsdWVbNF07XG4gICAgZHN0W29mZnNldCArIDldID0gdmFsdWVbNV07XG59O1xuXG4vLyBjb252ZXJ0IGZyb20gY29udGludW91cyBhcnJheSB0byB2ZWMzWzNdIHdpdGggcGFkZGluZyB0byB2ZWM0WzNdXG5fdXBkYXRlRnVuY3Rpb25zW1VOSUZPUk1UWVBFX01BVDNdID0gKHVuaWZvcm1CdWZmZXIsIHZhbHVlLCBvZmZzZXQpID0+IHtcbiAgICBjb25zdCBkc3QgPSB1bmlmb3JtQnVmZmVyLnN0b3JhZ2VGbG9hdDMyO1xuICAgIGRzdFtvZmZzZXRdID0gdmFsdWVbMF07XG4gICAgZHN0W29mZnNldCArIDFdID0gdmFsdWVbMV07XG4gICAgZHN0W29mZnNldCArIDJdID0gdmFsdWVbMl07XG5cbiAgICBkc3Rbb2Zmc2V0ICsgNF0gPSB2YWx1ZVszXTtcbiAgICBkc3Rbb2Zmc2V0ICsgNV0gPSB2YWx1ZVs0XTtcbiAgICBkc3Rbb2Zmc2V0ICsgNl0gPSB2YWx1ZVs1XTtcblxuICAgIGRzdFtvZmZzZXQgKyA4XSA9IHZhbHVlWzZdO1xuICAgIGRzdFtvZmZzZXQgKyA5XSA9IHZhbHVlWzddO1xuICAgIGRzdFtvZmZzZXQgKyAxMF0gPSB2YWx1ZVs4XTtcbn07XG5cbl91cGRhdGVGdW5jdGlvbnNbVU5JRk9STVRZUEVfRkxPQVRBUlJBWV0gPSBmdW5jdGlvbiAodW5pZm9ybUJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgY291bnQpIHtcbiAgICBjb25zdCBkc3QgPSB1bmlmb3JtQnVmZmVyLnN0b3JhZ2VGbG9hdDMyO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICBkc3Rbb2Zmc2V0ICsgaSAqIDRdID0gdmFsdWVbaV07XG4gICAgfVxufTtcblxuX3VwZGF0ZUZ1bmN0aW9uc1tVTklGT1JNVFlQRV9WRUMyQVJSQVldID0gKHVuaWZvcm1CdWZmZXIsIHZhbHVlLCBvZmZzZXQsIGNvdW50KSA9PiB7XG4gICAgY29uc3QgZHN0ID0gdW5pZm9ybUJ1ZmZlci5zdG9yYWdlRmxvYXQzMjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgZHN0W29mZnNldCArIGkgKiA0XSA9IHZhbHVlW2kgKiAyXTtcbiAgICAgICAgZHN0W29mZnNldCArIGkgKiA0ICsgMV0gPSB2YWx1ZVtpICogMiArIDFdO1xuICAgIH1cbn07XG5cbl91cGRhdGVGdW5jdGlvbnNbVU5JRk9STVRZUEVfVkVDM0FSUkFZXSA9ICh1bmlmb3JtQnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBjb3VudCkgPT4ge1xuICAgIGNvbnN0IGRzdCA9IHVuaWZvcm1CdWZmZXIuc3RvcmFnZUZsb2F0MzI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIGRzdFtvZmZzZXQgKyBpICogNF0gPSB2YWx1ZVtpICogM107XG4gICAgICAgIGRzdFtvZmZzZXQgKyBpICogNCArIDFdID0gdmFsdWVbaSAqIDMgKyAxXTtcbiAgICAgICAgZHN0W29mZnNldCArIGkgKiA0ICsgMl0gPSB2YWx1ZVtpICogMyArIDJdO1xuICAgIH1cbn07XG5cbi8qKlxuICogQSB1bmlmb3JtIGJ1ZmZlciByZXByZXNlbnRzIGEgR1BVIG1lbW9yeSBidWZmZXIgc3RvcmluZyB0aGUgdW5pZm9ybXMuXG4gKlxuICogQGlnbm9yZVxuICovXG5jbGFzcyBVbmlmb3JtQnVmZmVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgVW5pZm9ybUJ1ZmZlciBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuL2dyYXBoaWNzLWRldmljZS5qcycpLkdyYXBoaWNzRGV2aWNlfSBncmFwaGljc0RldmljZSAtIFRoZSBncmFwaGljcyBkZXZpY2VcbiAgICAgKiB1c2VkIHRvIG1hbmFnZSB0aGlzIHVuaWZvcm0gYnVmZmVyLlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuL3VuaWZvcm0tYnVmZmVyLWZvcm1hdC5qcycpLlVuaWZvcm1CdWZmZXJGb3JtYXR9IGZvcm1hdCAtIEZvcm1hdCBvZiB0aGVcbiAgICAgKiB1bmlmb3JtIGJ1ZmZlci5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihncmFwaGljc0RldmljZSwgZm9ybWF0KSB7XG4gICAgICAgIHRoaXMuZGV2aWNlID0gZ3JhcGhpY3NEZXZpY2U7XG4gICAgICAgIHRoaXMuZm9ybWF0ID0gZm9ybWF0O1xuICAgICAgICBEZWJ1Zy5hc3NlcnQoZm9ybWF0KTtcblxuICAgICAgICB0aGlzLmltcGwgPSBncmFwaGljc0RldmljZS5jcmVhdGVVbmlmb3JtQnVmZmVySW1wbCh0aGlzKTtcblxuICAgICAgICB0aGlzLnN0b3JhZ2UgPSBuZXcgQXJyYXlCdWZmZXIoZm9ybWF0LmJ5dGVTaXplKTtcbiAgICAgICAgdGhpcy5zdG9yYWdlRmxvYXQzMiA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5zdG9yYWdlKTtcbiAgICAgICAgdGhpcy5zdG9yYWdlSW50MzIgPSBuZXcgSW50MzJBcnJheSh0aGlzLnN0b3JhZ2UpO1xuXG4gICAgICAgIGdyYXBoaWNzRGV2aWNlLl92cmFtLnViICs9IHRoaXMuZm9ybWF0LmJ5dGVTaXplO1xuXG4gICAgICAgIC8vIFRPRE86IHJlZ2lzdGVyIHdpdGggdGhlIGRldmljZSBhbmQgaGFuZGxlIGxvc3QgY29udGV4dFxuICAgICAgICAvLyB0aGlzLmRldmljZS5idWZmZXJzLnB1c2godGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRnJlZXMgcmVzb3VyY2VzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHVuaWZvcm0gYnVmZmVyLlxuICAgICAqL1xuICAgIGRlc3Ryb3koKSB7XG5cbiAgICAgICAgLy8gLy8gc3RvcCB0cmFja2luZyB0aGUgdmVydGV4IGJ1ZmZlclxuICAgICAgICBjb25zdCBkZXZpY2UgPSB0aGlzLmRldmljZTtcblxuICAgICAgICAvLyBUT0RPOiByZW1vdmUgdGhlIGJ1ZmZlciBmcm9tIHRoZSBsaXN0IG9uIHRoZSBkZXZpY2UgKGxvc3QgY29udGV4dCBoYW5kbGluZylcblxuICAgICAgICB0aGlzLmltcGwuZGVzdHJveShkZXZpY2UpO1xuXG4gICAgICAgIGRldmljZS5fdnJhbS51YiAtPSB0aGlzLmZvcm1hdC5ieXRlU2l6ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgcmVuZGVyaW5nIGNvbnRleHQgd2FzIGxvc3QuIEl0IHJlbGVhc2VzIGFsbCBjb250ZXh0IHJlbGF0ZWQgcmVzb3VyY2VzLlxuICAgICAqXG4gICAgICogQGlnbm9yZVxuICAgICAqL1xuICAgIGxvc2VDb250ZXh0KCkge1xuICAgICAgICB0aGlzLmltcGwubG9zZUNvbnRleHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBc3NpZ24gYSB2YWx1ZSB0byB0aGUgdW5pZm9ybSBzcGVjaWZpZWQgYnkgaXRzIGZvcm1hdC4gVGhpcyBpcyB0aGUgZmFzdCB2ZXJzaW9uIG9mIGFzc2lnbmluZ1xuICAgICAqIGEgdmFsdWUgdG8gYSB1bmlmb3JtLCBhdm9pZGluZyBhbnkgbG9va3Vwcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuL3VuaWZvcm0tYnVmZmVyLWZvcm1hdC5qcycpLlVuaWZvcm1Gb3JtYXR9IHVuaWZvcm1Gb3JtYXQgLSBUaGUgZm9ybWF0IG9mXG4gICAgICogdGhlIHVuaWZvcm0uXG4gICAgICovXG4gICAgc2V0VW5pZm9ybSh1bmlmb3JtRm9ybWF0KSB7XG4gICAgICAgIERlYnVnLmFzc2VydCh1bmlmb3JtRm9ybWF0KTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdW5pZm9ybUZvcm1hdC5vZmZzZXQ7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gdW5pZm9ybUZvcm1hdC5zY29wZUlkLnZhbHVlO1xuXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZUZ1bmN0aW9uID0gX3VwZGF0ZUZ1bmN0aW9uc1t1bmlmb3JtRm9ybWF0LnVwZGF0ZVR5cGVdO1xuICAgICAgICAgICAgaWYgKHVwZGF0ZUZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRnVuY3Rpb24odGhpcywgdmFsdWUsIG9mZnNldCwgdW5pZm9ybUZvcm1hdC5jb3VudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcmFnZUZsb2F0MzIuc2V0KHZhbHVlLCBvZmZzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRGVidWcud2Fybk9uY2UoYFZhbHVlIHdhcyBub3Qgc2V0IHdoZW4gYXNzaWduaW5nIHRvIHVuaWZvcm0gWyR7dW5pZm9ybUZvcm1hdC5uYW1lfV1gICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgLCBleHBlY3RlZCB0eXBlICR7dW5pZm9ybVR5cGVUb05hbWVbdW5pZm9ybUZvcm1hdC50eXBlXX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzc2lnbiBhIHZhbHVlIHRvIHRoZSB1bmlmb3JtIHNwZWNpZmllZCBieSBuYW1lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdW5pZm9ybS5cbiAgICAgKi9cbiAgICBzZXQobmFtZSkge1xuICAgICAgICBjb25zdCB1bmlmb3JtRm9ybWF0ID0gdGhpcy5mb3JtYXQubWFwLmdldChuYW1lKTtcbiAgICAgICAgRGVidWcuYXNzZXJ0KHVuaWZvcm1Gb3JtYXQsIGBVbmlmb3JtIG5hbWUgWyR7bmFtZX1dIGlzIG5vdCBwYXJ0IG9mIHRoZSBVbmlmb3JtIGJ1ZmZlci5gKTtcbiAgICAgICAgaWYgKHVuaWZvcm1Gb3JtYXQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0VW5pZm9ybSh1bmlmb3JtRm9ybWF0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcblxuICAgICAgICAvLyBzZXQgbmV3IHZhbHVlc1xuICAgICAgICBjb25zdCB1bmlmb3JtcyA9IHRoaXMuZm9ybWF0LnVuaWZvcm1zO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVuaWZvcm1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnNldFVuaWZvcm0odW5pZm9ybXNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBsb2FkIHRoZSBuZXcgZGF0YVxuICAgICAgICB0aGlzLmltcGwudW5sb2NrKHRoaXMpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgVW5pZm9ybUJ1ZmZlciB9O1xuIl0sIm5hbWVzIjpbIl91cGRhdGVGdW5jdGlvbnMiLCJVTklGT1JNVFlQRV9GTE9BVCIsInVuaWZvcm1CdWZmZXIiLCJ2YWx1ZSIsIm9mZnNldCIsImRzdCIsInN0b3JhZ2VGbG9hdDMyIiwiVU5JRk9STVRZUEVfVkVDMiIsIlVOSUZPUk1UWVBFX1ZFQzMiLCJVTklGT1JNVFlQRV9WRUM0IiwiVU5JRk9STVRZUEVfSU5UIiwic3RvcmFnZUludDMyIiwiVU5JRk9STVRZUEVfSVZFQzIiLCJVTklGT1JNVFlQRV9JVkVDMyIsIlVOSUZPUk1UWVBFX0lWRUM0IiwiVU5JRk9STVRZUEVfTUFUMiIsIlVOSUZPUk1UWVBFX01BVDMiLCJVTklGT1JNVFlQRV9GTE9BVEFSUkFZIiwiY291bnQiLCJpIiwiVU5JRk9STVRZUEVfVkVDMkFSUkFZIiwiVU5JRk9STVRZUEVfVkVDM0FSUkFZIiwiVW5pZm9ybUJ1ZmZlciIsImNvbnN0cnVjdG9yIiwiZ3JhcGhpY3NEZXZpY2UiLCJmb3JtYXQiLCJkZXZpY2UiLCJEZWJ1ZyIsImFzc2VydCIsImltcGwiLCJjcmVhdGVVbmlmb3JtQnVmZmVySW1wbCIsInN0b3JhZ2UiLCJBcnJheUJ1ZmZlciIsImJ5dGVTaXplIiwiRmxvYXQzMkFycmF5IiwiSW50MzJBcnJheSIsIl92cmFtIiwidWIiLCJkZXN0cm95IiwibG9zZUNvbnRleHQiLCJzZXRVbmlmb3JtIiwidW5pZm9ybUZvcm1hdCIsInNjb3BlSWQiLCJ1bmRlZmluZWQiLCJ1cGRhdGVGdW5jdGlvbiIsInVwZGF0ZVR5cGUiLCJzZXQiLCJ3YXJuT25jZSIsIm5hbWUiLCJ1bmlmb3JtVHlwZVRvTmFtZSIsInR5cGUiLCJtYXAiLCJnZXQiLCJ1cGRhdGUiLCJ1bmlmb3JtcyIsImxlbmd0aCIsInVubG9jayJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFTQTtBQUNBO0FBQ0EsTUFBTUEsZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO0FBRTNCQSxnQkFBZ0IsQ0FBQ0MsaUJBQWlCLENBQUMsR0FBRyxVQUFVQyxhQUFhLEVBQUVDLEtBQUssRUFBRUMsTUFBTSxFQUFFO0FBQzFFLEVBQUEsTUFBTUMsR0FBRyxHQUFHSCxhQUFhLENBQUNJLGNBQWMsQ0FBQTtBQUN4Q0QsRUFBQUEsR0FBRyxDQUFDRCxNQUFNLENBQUMsR0FBR0QsS0FBSyxDQUFBO0FBQ3ZCLENBQUMsQ0FBQTtBQUVESCxnQkFBZ0IsQ0FBQ08sZ0JBQWdCLENBQUMsR0FBRyxDQUFDTCxhQUFhLEVBQUVDLEtBQUssRUFBRUMsTUFBTSxLQUFLO0FBQ25FLEVBQUEsTUFBTUMsR0FBRyxHQUFHSCxhQUFhLENBQUNJLGNBQWMsQ0FBQTtBQUN4Q0QsRUFBQUEsR0FBRyxDQUFDRCxNQUFNLENBQUMsR0FBR0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0VBQ3RCRSxHQUFHLENBQUNELE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBR0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQzlCLENBQUMsQ0FBQTtBQUVESCxnQkFBZ0IsQ0FBQ1EsZ0JBQWdCLENBQUMsR0FBRyxDQUFDTixhQUFhLEVBQUVDLEtBQUssRUFBRUMsTUFBTSxLQUFLO0FBQ25FLEVBQUEsTUFBTUMsR0FBRyxHQUFHSCxhQUFhLENBQUNJLGNBQWMsQ0FBQTtBQUN4Q0QsRUFBQUEsR0FBRyxDQUFDRCxNQUFNLENBQUMsR0FBR0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0VBQ3RCRSxHQUFHLENBQUNELE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBR0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxD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
