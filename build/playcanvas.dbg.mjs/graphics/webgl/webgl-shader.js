/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../../core/debug.js';
import { now } from '../../core/time.js';
import { ShaderInput } from '../shader-input.js';
import { semanticToLocation, SHADERTAG_MATERIAL } from '../constants.js';

class WebglShader {
  constructor(shader) {
    this.init();
    this.compileAndLink(shader.device, shader);
    shader.device.shaders.push(shader);
  }

  destroy(shader) {
    const device = shader.device;
    const idx = device.shaders.indexOf(shader);

    if (idx !== -1) {
      device.shaders.splice(idx, 1);
    }

    if (this.glProgram) {
      device.gl.deleteProgram(this.glProgram);
      this.glProgram = null;
      device.removeShaderFromCache(shader);
    }
  }

  init() {
    this.uniforms = [];
    this.samplers = [];
    this.attributes = [];
    this.glProgram = null;
    this.glVertexShader = null;
    this.glFragmentShader = null;
  }

  loseContext() {
    this.init();
  }

  restoreContext(device, shader) {
    this.compileAndLink(device, shader);
  }

  compileAndLink(device, shader) {
    const definition = shader.definition;

    const glVertexShader = this._compileShaderSource(device, definition.vshader, true);

    const glFragmentShader = this._compileShaderSource(device, definition.fshader, false);

    const gl = device.gl;
    const glProgram = gl.createProgram();
    gl.attachShader(glProgram, glVertexShader);
    gl.attachShader(glProgram, glFragmentShader);
    const attrs = definition.attributes;

    if (device.webgl2 && definition.useTransformFeedback) {
      const outNames = [];

      for (const attr in attrs) {
        if (attrs.hasOwnProperty(attr)) {
          outNames.push("out_" + attr);
        }
      }

      gl.transformFeedbackVaryings(glProgram, outNames, gl.INTERLEAVED_ATTRIBS);
    }

    const locations = {};

    for (const attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        const semantic = attrs[attr];
        const loc = semanticToLocation[semantic];
        Debug.assert(!locations.hasOwnProperty(loc), `WARNING: Two attribues are mapped to the same location in a shader: ${locations[loc]} and ${attr}`);
        locations[loc] = attr;
        gl.bindAttribLocation(glProgram, loc, attr);
      }
    }

    gl.linkProgram(glProgram);
    this.glVertexShader = glVertexShader;
    this.glFragmentShader = glFragmentShader;
    this.glProgram = glProgram;
    device._shaderStats.linked++;

    if (definition.tag === SHADERTAG_MATERIAL) {
      device._shaderStats.materialShaders++;
    }
  }

  _compileShaderSource(device, src, isVertexShader) {
    const gl = device.gl;
    const shaderCache = isVertexShader ? device.vertexShaderCache : device.fragmentShaderCache;
    let glShader = shaderCache[src];

    if (!glShader) {
      const startTime = now();
      device.fire('shader:compile:start', {
        timestamp: startTime,
        target: device
      });
      glShader = gl.createShader(isVertexShader ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
      gl.shaderSource(glShader, src);
      gl.compileShader(glShader);
      shaderCache[src] = glShader;
      const endTime = now();
      device.fire('shader:compile:end', {
        timestamp: endTime,
        target: device
      });
      device._shaderStats.compileTime += endTime - startTime;

      if (isVertexShader) {
        device._shaderStats.vsCompiled++;
      } else {
        device._shaderStats.fsCompiled++;
      }
    }

    return glShader;
  }

  postLink(device, shader) {
    const gl = device.gl;
    const glProgram = this.glProgram;
    const definition = shader.definition;
    const startTime = now();
    device.fire('shader:link:start', {
      timestamp: startTime,
      target: device
    });
    if (!this._isCompiled(device, shader, this.glVertexShader, definition.vshader, "vertex")) return false;
    if (!this._isCompiled(device, shader, this.glFragmentShader, definition.fshader, "fragment")) return false;

    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
      const message = "Failed to link shader program. Error: " + gl.getProgramInfoLog(glProgram);
      console.error(message, definition);
      return false;
    }

    let i, info, location, shaderInput;
    i = 0;
    const numAttributes = gl.getProgramParameter(glProgram, gl.ACTIVE_ATTRIBUTES);

    while (i < numAttributes) {
      info = gl.getActiveAttrib(glProgram, i++);
      location = gl.getAttribLocation(glProgram, info.name);

      if (definition.attributes[info.name] === undefined) {
        console.error(`Vertex shader attribute "${info.name}" is not mapped to a semantic in shader definition.`);
      }

      shaderInput = new ShaderInput(device, definition.attributes[info.name], device.pcUniformType[info.type], location);
      this.attributes.push(shaderInput);
    }

    i = 0;
    const numUniforms = gl.getProgramParameter(glProgram, gl.ACTIVE_UNIFORMS);

    while (i < numUniforms) {
      info = gl.getActiveUniform(glProgram, i++);
      location = gl.getUniformLocation(glProgram, info.name);
      shaderInput = new ShaderInput(device, info.name, device.pcUniformType[info.type], location);

      if (info.type === gl.SAMPLER_2D || info.type === gl.SAMPLER_CUBE || device.webgl2 && (info.type === gl.SAMPLER_2D_SHADOW || info.type === gl.SAMPLER_CUBE_SHADOW || info.type === gl.SAMPLER_3D)) {
        this.samplers.push(shaderInput);
      } else {
        this.uniforms.push(shaderInput);
      }
    }

    shader.ready = true;
    const endTime = now();
    device.fire('shader:link:end', {
      timestamp: endTime,
      target: device
    });
    device._shaderStats.compileTime += endTime - startTime;
    return true;
  }

  _isCompiled(device, shader, glShader, source, shaderType) {
    const gl = device.gl;

    if (!gl.getShaderParameter(glShader, gl.COMPILE_STATUS)) {
      const infoLog = gl.getShaderInfoLog(glShader);

      const [code, error] = this._processError(source, infoLog);

      const message = `Failed to compile ${shaderType} shader:\n\n${infoLog}\n${code}`;
      error.shader = shader;
      console.error(message, error);
      return false;
    }

    return true;
  }

  _processError(src, infoLog) {
    const error = {};
    let code = '';

    if (src) {
      const lines = src.split('\n');
      let from = 0;
      let to = lines.length;

      if (infoLog && infoLog.startsWith('ERROR:')) {
        const match = infoLog.match(/^ERROR:\s([0-9]+):([0-9]+):\s*(.+)/);

        if (match) {
          error.message = match[3];
          error.line = parseInt(match[2], 10);
          from = Math.max(0, error.line - 6);
          to = Math.min(lines.length, error.line + 5);
        }
      }

      for (let i = from; i < to; i++) {
        code += i + 1 + ":\t" + lines[i] + '\n';
      }

      error.source = src;
    }

    return [code, error];
  }

}

export { WebglShader };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViZ2wtc2hhZGVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZ3JhcGhpY3Mvd2ViZ2wvd2ViZ2wtc2hhZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERlYnVnIH0gZnJvbSAnLi4vLi4vY29yZS9kZWJ1Zy5qcyc7XG5pbXBvcnQgeyBub3cgfSBmcm9tICcuLi8uLi9jb3JlL3RpbWUuanMnO1xuXG5pbXBvcnQgeyBTaGFkZXJJbnB1dCB9IGZyb20gJy4uL3NoYWRlci1pbnB1dC5qcyc7XG5pbXBvcnQgeyBTSEFERVJUQUdfTUFURVJJQUwsIHNlbWFudGljVG9Mb2NhdGlvbiB9IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuL3dlYmdsLWdyYXBoaWNzLWRldmljZS5qcycpLldlYmdsR3JhcGhpY3NEZXZpY2V9IFdlYmdsR3JhcGhpY3NEZXZpY2UgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9zaGFkZXIuanMnKS5TaGFkZXJ9IFNoYWRlciAqL1xuXG4vKipcbiAqIEEgV2ViR0wgaW1wbGVtZW50YXRpb24gb2YgdGhlIFNoYWRlci5cbiAqXG4gKiBAaWdub3JlXG4gKi9cbmNsYXNzIFdlYmdsU2hhZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihzaGFkZXIpIHtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgIHRoaXMuY29tcGlsZUFuZExpbmsoc2hhZGVyLmRldmljZSwgc2hhZGVyKTtcbiAgICAgICAgc2hhZGVyLmRldmljZS5zaGFkZXJzLnB1c2goc2hhZGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGcmVlIHRoZSBXZWJHTCByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIGEgc2hhZGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTaGFkZXJ9IHNoYWRlciAtIFRoZSBzaGFkZXIgdG8gZnJlZS5cbiAgICAgKi9cbiAgICBkZXN0cm95KHNoYWRlcikge1xuICAgICAgICAvKiogQHR5cGUge1dlYmdsR3JhcGhpY3NEZXZpY2V9ICovXG4gICAgICAgIGNvbnN0IGRldmljZSA9IHNoYWRlci5kZXZpY2U7XG4gICAgICAgIGNvbnN0IGlkeCA9IGRldmljZS5zaGFkZXJzLmluZGV4T2Yoc2hhZGVyKTtcbiAgICAgICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGRldmljZS5zaGFkZXJzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ2xQcm9ncmFtKSB7XG4gICAgICAgICAgICBkZXZpY2UuZ2wuZGVsZXRlUHJvZ3JhbSh0aGlzLmdsUHJvZ3JhbSk7XG4gICAgICAgICAgICB0aGlzLmdsUHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICBkZXZpY2UucmVtb3ZlU2hhZGVyRnJvbUNhY2hlKHNoYWRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLnVuaWZvcm1zID0gW107XG4gICAgICAgIHRoaXMuc2FtcGxlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gW107XG5cbiAgICAgICAgdGhpcy5nbFByb2dyYW0gPSBudWxsO1xuICAgICAgICB0aGlzLmdsVmVydGV4U2hhZGVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5nbEZyYWdtZW50U2hhZGVyID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwb3NlIHRoZSBzaGFkZXIgd2hlbiB0aGUgY29udGV4dCBoYXMgYmVlbiBsb3N0LlxuICAgICAqL1xuICAgIGxvc2VDb250ZXh0KCkge1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXN0b3JlIHNoYWRlciBhZnRlciB0aGUgY29udGV4dCBoYXMgYmVlbiBvYnRhaW5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7V2ViZ2xHcmFwaGljc0RldmljZX0gZGV2aWNlIC0gVGhlIGdyYXBoaWNzIGRldmljZS5cbiAgICAgKiBAcGFyYW0ge1NoYWRlcn0gc2hhZGVyIC0gVGhlIHNoYWRlciB0byByZXN0b3JlLlxuICAgICAqL1xuICAgIHJlc3RvcmVDb250ZXh0KGRldmljZSwgc2hhZGVyKSB7XG4gICAgICAgIHRoaXMuY29tcGlsZUFuZExpbmsoZGV2aWNlLCBzaGFkZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXBpbGUgYW5kIGxpbmsgYSBzaGFkZXIgcHJvZ3JhbS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7V2ViZ2xHcmFwaGljc0RldmljZX0gZGV2aWNlIC0gVGhlIGdyYXBoaWNzIGRldmljZS5cbiAgICAgKiBAcGFyYW0ge1NoYWRlcn0gc2hhZGVyIC0gVGhlIHNoYWRlciB0byBjb21waWxlLlxuICAgICAqL1xuICAgIGNvbXBpbGVBbmRMaW5rKGRldmljZSwgc2hhZGVyKSB7XG4gICAgICAgIGNvbnN0IGRlZmluaXRpb24gPSBzaGFkZXIuZGVmaW5pdGlvbjtcbiAgICAgICAgY29uc3QgZ2xWZXJ0ZXhTaGFkZXIgPSB0aGlzLl9jb21waWxlU2hhZGVyU291cmNlKGRldmljZSwgZGVmaW5pdGlvbi52c2hhZGVyLCB0cnVlKTtcbiAgICAgICAgY29uc3QgZ2xGcmFnbWVudFNoYWRlciA9IHRoaXMuX2NvbXBpbGVTaGFkZXJTb3VyY2UoZGV2aWNlLCBkZWZpbml0aW9uLmZzaGFkZXIsIGZhbHNlKTtcblxuICAgICAgICBjb25zdCBnbCA9IGRldmljZS5nbDtcbiAgICAgICAgY29uc3QgZ2xQcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuXG4gICAgICAgIGdsLmF0dGFjaFNoYWRlcihnbFByb2dyYW0sIGdsVmVydGV4U2hhZGVyKTtcbiAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKGdsUHJvZ3JhbSwgZ2xGcmFnbWVudFNoYWRlcik7XG5cbiAgICAgICAgY29uc3QgYXR0cnMgPSBkZWZpbml0aW9uLmF0dHJpYnV0ZXM7XG4gICAgICAgIGlmIChkZXZpY2Uud2ViZ2wyICYmIGRlZmluaXRpb24udXNlVHJhbnNmb3JtRmVlZGJhY2spIHtcbiAgICAgICAgICAgIC8vIENvbGxlY3QgYWxsIFwib3V0X1wiIGF0dHJpYnV0ZXMgYW5kIHVzZSB0aGVtIGZvciBvdXRwdXRcbiAgICAgICAgICAgIGNvbnN0IG91dE5hbWVzID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGF0dHIgaW4gYXR0cnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkoYXR0cikpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0TmFtZXMucHVzaChcIm91dF9cIiArIGF0dHIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdsLnRyYW5zZm9ybUZlZWRiYWNrVmFyeWluZ3MoZ2xQcm9ncmFtLCBvdXROYW1lcywgZ2wuSU5URVJMRUFWRURfQVRUUklCUyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtYXAgYWxsIHZlcnRleCBpbnB1dCBhdHRyaWJ1dGVzIHRvIGZpeGVkIGxvY2F0aW9uc1xuICAgICAgICBjb25zdCBsb2NhdGlvbnMgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBhdHRyIGluIGF0dHJzKSB7XG4gICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkoYXR0cikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZW1hbnRpYyA9IGF0dHJzW2F0dHJdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxvYyA9IHNlbWFudGljVG9Mb2NhdGlvbltzZW1hbnRpY107XG4gICAgICAgICAgICAgICAgRGVidWcuYXNzZXJ0KCFsb2NhdGlvbnMuaGFzT3duUHJvcGVydHkobG9jKSwgYFdBUk5JTkc6IFR3byBhdHRyaWJ1ZXMgYXJlIG1hcHBlZCB0byB0aGUgc2FtZSBsb2NhdGlvbiBpbiBhIHNoYWRlcjogJHtsb2NhdGlvbnNbbG9jXX0gYW5kICR7YXR0cn1gKTtcblxuICAgICAgICAgICAgICAgIGxvY2F0aW9uc1tsb2NdID0gYXR0cjtcbiAgICAgICAgICAgICAgICBnbC5iaW5kQXR0cmliTG9jYXRpb24oZ2xQcm9ncmFtLCBsb2MsIGF0dHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZ2wubGlua1Byb2dyYW0oZ2xQcm9ncmFtKTtcblxuICAgICAgICAvLyBDYWNoZSB0aGUgV2ViR0wgb2JqZWN0cyBvbiB0aGUgc2hhZGVyXG4gICAgICAgIHRoaXMuZ2xWZXJ0ZXhTaGFkZXIgPSBnbFZlcnRleFNoYWRlcjtcbiAgICAgICAgdGhpcy5nbEZyYWdtZW50U2hhZGVyID0gZ2xGcmFnbWVudFNoYWRlcjtcbiAgICAgICAgdGhpcy5nbFByb2dyYW0gPSBnbFByb2dyYW07XG5cbiAgICAgICAgLy8gI2lmIF9QUk9GSUxFUlxuICAgICAgICBkZXZpY2UuX3NoYWRlclN0YXRzLmxpbmtlZCsrO1xuICAgICAgICBpZiAoZGVmaW5pdGlvbi50YWcgPT09IFNIQURFUlRBR19NQVRFUklBTCkge1xuICAgICAgICAgICAgZGV2aWNlLl9zaGFkZXJTdGF0cy5tYXRlcmlhbFNoYWRlcnMrKztcbiAgICAgICAgfVxuICAgICAgICAvLyAjZW5kaWZcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb21waWxlcyBhbiBpbmRpdmlkdWFsIHNoYWRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7V2ViZ2xHcmFwaGljc0RldmljZX0gZGV2aWNlIC0gVGhlIGdyYXBoaWNzIGRldmljZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3JjIC0gVGhlIHNoYWRlciBzb3VyY2UgY29kZS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzVmVydGV4U2hhZGVyIC0gVHJ1ZSBpZiB0aGUgc2hhZGVyIGlzIGEgdmVydGV4IHNoYWRlciwgZmFsc2UgaWYgaXQgaXMgYVxuICAgICAqIGZyYWdtZW50IHNoYWRlci5cbiAgICAgKiBAcmV0dXJucyB7V2ViR0xTaGFkZXJ9IFRoZSBjb21waWxlZCBzaGFkZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY29tcGlsZVNoYWRlclNvdXJjZShkZXZpY2UsIHNyYywgaXNWZXJ0ZXhTaGFkZXIpIHtcbiAgICAgICAgY29uc3QgZ2wgPSBkZXZpY2UuZ2w7XG4gICAgICAgIGNvbnN0IHNoYWRlckNhY2hlID0gaXNWZXJ0ZXhTaGFkZXIgPyBkZXZpY2UudmVydGV4U2hhZGVyQ2FjaGUgOiBkZXZpY2UuZnJhZ21lbnRTaGFkZXJDYWNoZTtcbiAgICAgICAgbGV0IGdsU2hhZGVyID0gc2hhZGVyQ2FjaGVbc3JjXTtcblxuICAgICAgICBpZiAoIWdsU2hhZGVyKSB7XG4gICAgICAgICAgICAvLyAjaWYgX1BST0ZJTEVSXG4gICAgICAgICAgICBjb25zdCBzdGFydFRpbWUgPSBub3coKTtcbiAgICAgICAgICAgIGRldmljZS5maXJlKCdzaGFkZXI6Y29tcGlsZTpzdGFydCcsIHtcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IHN0YXJ0VGltZSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IGRldmljZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyAjZW5kaWZcblxuICAgICAgICAgICAgZ2xTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoaXNWZXJ0ZXhTaGFkZXIgPyBnbC5WRVJURVhfU0hBREVSIDogZ2wuRlJBR01FTlRfU0hBREVSKTtcblxuICAgICAgICAgICAgZ2wuc2hhZGVyU291cmNlKGdsU2hhZGVyLCBzcmMpO1xuICAgICAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihnbFNoYWRlcik7XG5cbiAgICAgICAgICAgIHNoYWRlckNhY2hlW3NyY10gPSBnbFNoYWRlcjtcblxuICAgICAgICAgICAgLy8gI2lmIF9QUk9GSUxFUlxuICAgICAgICAgICAgY29uc3QgZW5kVGltZSA9IG5vdygpO1xuICAgICAgICAgICAgZGV2aWNlLmZpcmUoJ3NoYWRlcjpjb21waWxlOmVuZCcsIHtcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IGVuZFRpbWUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBkZXZpY2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGV2aWNlLl9zaGFkZXJTdGF0cy5jb21waWxlVGltZSArPSBlbmRUaW1lIC0gc3RhcnRUaW1lO1xuXG4gICAgICAgICAgICBpZiAoaXNWZXJ0ZXhTaGFkZXIpIHtcbiAgICAgICAgICAgICAgICBkZXZpY2UuX3NoYWRlclN0YXRzLnZzQ29tcGlsZWQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlLl9zaGFkZXJTdGF0cy5mc0NvbXBpbGVkKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyAjZW5kaWZcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnbFNoYWRlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeHRyYWN0IGF0dHJpYnV0ZSBhbmQgdW5pZm9ybSBpbmZvcm1hdGlvbiBmcm9tIGEgc3VjY2Vzc2Z1bGx5IGxpbmtlZCBzaGFkZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1dlYmdsR3JhcGhpY3NEZXZpY2V9IGRldmljZSAtIFRoZSBncmFwaGljcyBkZXZpY2UuXG4gICAgICogQHBhcmFtIHtTaGFkZXJ9IHNoYWRlciAtIFRoZSBzaGFkZXIgdG8gcXVlcnkuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIHNoYWRlciB3YXMgc3VjY2Vzc2Z1bGx5IHF1ZXJpZWQgYW5kIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBwb3N0TGluayhkZXZpY2UsIHNoYWRlcikge1xuICAgICAgICBjb25zdCBnbCA9IGRldmljZS5nbDtcblxuICAgICAgICBjb25zdCBnbFByb2dyYW0gPSB0aGlzLmdsUHJvZ3JhbTtcbiAgICAgICAgY29uc3QgZGVmaW5pdGlvbiA9IHNoYWRlci5kZWZpbml0aW9uO1xuXG4gICAgICAgIC8vICNpZiBfUFJPRklMRVJcbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gbm93KCk7XG4gICAgICAgIGRldmljZS5maXJlKCdzaGFkZXI6bGluazpzdGFydCcsIHtcbiAgICAgICAgICAgIHRpbWVzdGFtcDogc3RhcnRUaW1lLFxuICAgICAgICAgICAgdGFyZ2V0OiBkZXZpY2VcbiAgICAgICAgfSk7XG4gICAgICAgIC8vICNlbmRpZlxuXG4gICAgICAgIC8vIENoZWNrIGZvciBjb21waWxhdGlvbiBlcnJvcnNcbiAgICAgICAgaWYgKCF0aGlzLl9pc0NvbXBpbGVkKGRldmljZSwgc2hhZGVyLCB0aGlzLmdsVmVydGV4U2hhZGVyLCBkZWZpbml0aW9uLnZzaGFkZXIsIFwidmVydGV4XCIpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGlmICghdGhpcy5faXNDb21waWxlZChkZXZpY2UsIHNoYWRlciwgdGhpcy5nbEZyYWdtZW50U2hhZGVyLCBkZWZpbml0aW9uLmZzaGFkZXIsIFwiZnJhZ21lbnRcIikpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKGdsUHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKSB7XG5cbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBcIkZhaWxlZCB0byBsaW5rIHNoYWRlciBwcm9ncmFtLiBFcnJvcjogXCIgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyhnbFByb2dyYW0pO1xuXG4gICAgICAgICAgICAvLyAjaWYgX0RFQlVHXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UsIGRlZmluaXRpb24pO1xuICAgICAgICAgICAgLy8gI2Vsc2VcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XG4gICAgICAgICAgICAvLyAjZW5kaWZcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGksIGluZm8sIGxvY2F0aW9uLCBzaGFkZXJJbnB1dDtcblxuICAgICAgICAvLyBRdWVyeSB0aGUgcHJvZ3JhbSBmb3IgZWFjaCB2ZXJ0ZXggYnVmZmVyIGlucHV0IChHTFNMICdhdHRyaWJ1dGUnKVxuICAgICAgICBpID0gMDtcbiAgICAgICAgY29uc3QgbnVtQXR0cmlidXRlcyA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoZ2xQcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyk7XG4gICAgICAgIHdoaWxlIChpIDwgbnVtQXR0cmlidXRlcykge1xuICAgICAgICAgICAgaW5mbyA9IGdsLmdldEFjdGl2ZUF0dHJpYihnbFByb2dyYW0sIGkrKyk7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKGdsUHJvZ3JhbSwgaW5mby5uYW1lKTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgYXR0cmlidXRlcyBhcmUgY29ycmVjdGx5IGxpbmtlZCB1cFxuICAgICAgICAgICAgaWYgKGRlZmluaXRpb24uYXR0cmlidXRlc1tpbmZvLm5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBWZXJ0ZXggc2hhZGVyIGF0dHJpYnV0ZSBcIiR7aW5mby5uYW1lfVwiIGlzIG5vdCBtYXBwZWQgdG8gYSBzZW1hbnRpYyBpbiBzaGFkZXIgZGVmaW5pdGlvbi5gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2hhZGVySW5wdXQgPSBuZXcgU2hhZGVySW5wdXQoZGV2aWNlLCBkZWZpbml0aW9uLmF0dHJpYnV0ZXNbaW5mby5uYW1lXSwgZGV2aWNlLnBjVW5pZm9ybVR5cGVbaW5mby50eXBlXSwgbG9jYXRpb24pO1xuXG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMucHVzaChzaGFkZXJJbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBRdWVyeSB0aGUgcHJvZ3JhbSBmb3IgZWFjaCBzaGFkZXIgc3RhdGUgKEdMU0wgJ3VuaWZvcm0nKVxuICAgICAgICBpID0gMDtcbiAgICAgICAgY29uc3QgbnVtVW5pZm9ybXMgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKGdsUHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKTtcbiAgICAgICAgd2hpbGUgKGkgPCBudW1Vbmlmb3Jtcykge1xuICAgICAgICAgICAgaW5mbyA9IGdsLmdldEFjdGl2ZVVuaWZvcm0oZ2xQcm9ncmFtLCBpKyspO1xuICAgICAgICAgICAgbG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oZ2xQcm9ncmFtLCBpbmZvLm5hbWUpO1xuXG4gICAgICAgICAgICBzaGFkZXJJbnB1dCA9IG5ldyBTaGFkZXJJbnB1dChkZXZpY2UsIGluZm8ubmFtZSwgZGV2aWNlLnBjVW5pZm9ybVR5cGVbaW5mby50eXBlXSwgbG9jYXRpb24pO1xuXG4gICAgICAgICAgICBpZiAoaW5mby50eXBlID09PSBnbC5TQU1QTEVSXzJEIHx8IGluZm8udHlwZSA9PT0gZ2wuU0FNUExFUl9DVUJFIHx8XG4gICAgICAgICAgICAgICAgKGRldmljZS53ZWJnbDIgJiYgKGluZm8udHlwZSA9PT0gZ2wuU0FNUExFUl8yRF9TSEFET1cgfHwgaW5mby50eXBlID09PSBnbC5TQU1QTEVSX0NVQkVfU0hBRE9XIHx8IGluZm8udHlwZSA9PT0gZ2wuU0FNUExFUl8zRCkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNhbXBsZXJzLnB1c2goc2hhZGVySW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVuaWZvcm1zLnB1c2goc2hhZGVySW5wdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2hhZGVyLnJlYWR5ID0gdHJ1ZTtcblxuICAgICAgICAvLyAjaWYgX1BST0ZJTEVSXG4gICAgICAgIGNvbnN0IGVuZFRpbWUgPSBub3coKTtcbiAgICAgICAgZGV2aWNlLmZpcmUoJ3NoYWRlcjpsaW5rOmVuZCcsIHtcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZW5kVGltZSxcbiAgICAgICAgICAgIHRhcmdldDogZGV2aWNlXG4gICAgICAgIH0pO1xuICAgICAgICBkZXZpY2UuX3NoYWRlclN0YXRzLmNvbXBpbGVUaW1lICs9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICAgIC8vICNlbmRpZlxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBjb21waWxhdGlvbiBzdGF0dXMgb2YgYSBzaGFkZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1dlYmdsR3JhcGhpY3NEZXZpY2V9IGRldmljZSAtIFRoZSBncmFwaGljcyBkZXZpY2UuXG4gICAgICogQHBhcmFtIHtTaGFkZXJ9IHNoYWRlciAtIFRoZSBzaGFkZXIgdG8gcXVlcnkuXG4gICAgICogQHBhcmFtIHtXZWJHTFNoYWRlcn0gZ2xTaGFkZXIgLSBUaGUgV2ViR0wgc2hhZGVyLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2UgLSBUaGUgc2hhZGVyIHNvdXJjZSBjb2RlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzaGFkZXJUeXBlIC0gVGhlIHNoYWRlciB0eXBlLiBDYW4gYmUgJ3ZlcnRleCcgb3IgJ2ZyYWdtZW50Jy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgc2hhZGVyIGNvbXBpbGVkIHN1Y2Nlc3NmdWxseSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2lzQ29tcGlsZWQoZGV2aWNlLCBzaGFkZXIsIGdsU2hhZGVyLCBzb3VyY2UsIHNoYWRlclR5cGUpIHtcbiAgICAgICAgY29uc3QgZ2wgPSBkZXZpY2UuZ2w7XG5cbiAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoZ2xTaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgY29uc3QgaW5mb0xvZyA9IGdsLmdldFNoYWRlckluZm9Mb2coZ2xTaGFkZXIpO1xuICAgICAgICAgICAgY29uc3QgW2NvZGUsIGVycm9yXSA9IHRoaXMuX3Byb2Nlc3NFcnJvcihzb3VyY2UsIGluZm9Mb2cpO1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBGYWlsZWQgdG8gY29tcGlsZSAke3NoYWRlclR5cGV9IHNoYWRlcjpcXG5cXG4ke2luZm9Mb2d9XFxuJHtjb2RlfWA7XG4gICAgICAgICAgICAvLyAjaWYgX0RFQlVHXG4gICAgICAgICAgICBlcnJvci5zaGFkZXIgPSBzaGFkZXI7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UsIGVycm9yKTtcbiAgICAgICAgICAgIC8vICNlbHNlXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgICAgLy8gI2VuZGlmXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJ1bmNhdGUgdGhlIFdlYkdMIHNoYWRlciBjb21waWxhdGlvbiBsb2cgdG8ganVzdCBpbmNsdWRlIHRoZSBlcnJvciBsaW5lIHBsdXMgdGhlIDUgbGluZXNcbiAgICAgKiBiZWZvcmUgYW5kIGFmdGVyIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNyYyAtIFRoZSBzaGFkZXIgc291cmNlIGNvZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGluZm9Mb2cgLSBUaGUgaW5mbyBsb2cgcmV0dXJuZWQgZnJvbSBXZWJHTCBvbiBhIGZhaWxlZCBzaGFkZXIgY29tcGlsYXRpb24uXG4gICAgICogQHJldHVybnMge0FycmF5fSBBbiBhcnJheSB3aGVyZSB0aGUgZmlyc3QgZWxlbWVudCBpcyB0aGUgMTAgbGluZXMgb2YgY29kZSBhcm91bmQgdGhlIGZpcnN0XG4gICAgICogZGV0ZWN0ZWQgZXJyb3IsIGFuZCB0aGUgc2Vjb25kIGVsZW1lbnQgYW4gb2JqZWN0IHN0b3JpbmcgdGhlIGVycm9yIG1lc3NzYWdlLCBsaW5lIG51bWJlciBhbmRcbiAgICAgKiBjb21wbGV0ZSBzaGFkZXIgc291cmNlLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Byb2Nlc3NFcnJvcihzcmMsIGluZm9Mb2cpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSB7IH07XG4gICAgICAgIGxldCBjb2RlID0gJyc7XG5cbiAgICAgICAgaWYgKHNyYykge1xuICAgICAgICAgICAgY29uc3QgbGluZXMgPSBzcmMuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgbGV0IGZyb20gPSAwO1xuICAgICAgICAgICAgbGV0IHRvID0gbGluZXMubGVuZ3RoO1xuXG4gICAgICAgICAgICAvLyBpZiBlcnJvciBpcyBpbiB0aGUgY29kZSwgb25seSBzaG93IG5lYXJieSBsaW5lcyBpbnN0ZWFkIG9mIHdob2xlIHNoYWRlciBjb2RlXG4gICAgICAgICAgICBpZiAoaW5mb0xvZyAmJiBpbmZvTG9nLnN0YXJ0c1dpdGgoJ0VSUk9SOicpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBpbmZvTG9nLm1hdGNoKC9eRVJST1I6XFxzKFswLTldKyk6KFswLTldKyk6XFxzKiguKykvKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IubWVzc2FnZSA9IG1hdGNoWzNdO1xuICAgICAgICAgICAgICAgICAgICBlcnJvci5saW5lID0gcGFyc2VJbnQobWF0Y2hbMl0sIDEwKTtcblxuICAgICAgICAgICAgICAgICAgICBmcm9tID0gTWF0aC5tYXgoMCwgZXJyb3IubGluZSAtIDYpO1xuICAgICAgICAgICAgICAgICAgICB0byA9IE1hdGgubWluKGxpbmVzLmxlbmd0aCwgZXJyb3IubGluZSArIDUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hyb21lIHJlcG9ydHMgc2hhZGVyIGVycm9ycyBvbiBsaW5lcyBpbmRleGVkIGZyb20gMVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGZyb207IGkgPCB0bzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29kZSArPSAoaSArIDEpICsgXCI6XFx0XCIgKyBsaW5lc1tpXSArICdcXG4nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlcnJvci5zb3VyY2UgPSBzcmM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW2NvZGUsIGVycm9yXTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFdlYmdsU2hhZGVyIH07XG4iXSwibmFtZXMiOlsiV2ViZ2xTaGFkZXIiLCJjb25zdHJ1Y3RvciIsInNoYWRlciIsImluaXQiLCJjb21waWxlQW5kTGluayIsImRldmljZSIsInNoYWRlcnMiLCJwdXNoIiwiZGVzdHJveSIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnbFByb2dyYW0iLCJnbCIsImRlbGV0ZVByb2dyYW0iLCJyZW1vdmVTaGFkZXJGcm9tQ2FjaGUiLCJ1bmlmb3JtcyIsInNhbXBsZXJzIiwiYXR0cmlidXRlcyIsImdsVmVydGV4U2hhZGVyIiwiZ2xGcmFnbWVudFNoYWRlciIsImxvc2VDb250ZXh0IiwicmVzdG9yZUNvbnRleHQiLCJkZWZpbml0aW9uIiwiX2NvbXBpbGVTaGFkZXJTb3VyY2UiLCJ2c2hhZGVyIiwiZnNoYWRlciIsImNyZWF0ZVByb2dyYW0iLCJhdHRhY2hTaGFkZXIiLCJhdHRycyIsIndlYmdsMiIsInVzZVRyYW5zZm9ybUZlZWRiYWNrIiwib3V0TmFtZXMiLCJhdHRyIiwiaGFzT3duUHJvcGVydHkiLCJ0cmFuc2Zvcm1GZWVkYmFja1ZhcnlpbmdzIiwiSU5URVJMRUFWRURfQVRUUklCUyIsImxvY2F0aW9ucyIsInNlbWFudGljIiwibG9jIiwic2VtYW50aWNUb0xvY2F0aW9uIiwiRGVidWciLCJhc3NlcnQiLCJiaW5kQXR0cmliTG9jYXRpb24iLCJsaW5rUHJvZ3JhbSIsIl9zaGFkZXJTdGF0cyIsImxpbmtlZCIsInRhZyIsIlNIQURFUlRBR19NQVRFUklBTCIsIm1hdGVyaWFsU2hhZGVycyIsInNyYyIsImlzVmVydGV4U2hhZGVyIiwic2hhZGVyQ2FjaGUiLCJ2ZXJ0ZXhTaGFkZXJDYWNoZSIsImZyYWdtZW50U2hhZGVyQ2FjaGUiLCJnbFNoYWRlciIsInN0YXJ0VGltZSIsIm5vdyIsImZpcmUiLCJ0aW1lc3RhbXAiLCJ0YXJnZXQiLCJjcmVhdGVTaGFkZXIiLCJWRVJURVhfU0hBREVSIiwiRlJBR01FTlRfU0hBREVSIiwic2hhZGVyU291cmNlIiwiY29tcGlsZVNoYWRlciIsImVuZFRpbWUiLCJjb21waWxlVGltZSIsInZzQ29tcGlsZWQiLCJmc0NvbXBpbGVkIiwicG9zdExpbmsiLCJfaXNDb21waWxlZCIsImdldFByb2dyYW1QYXJhbWV0ZXIiLCJMSU5LX1NUQVRVUyIsIm1lc3NhZ2UiLCJnZXRQcm9ncmFtSW5mb0xvZyIsImNvbnNvbGUiLCJlcnJvciIsImkiLCJpbmZvIiwibG9jYXRpb24iLCJzaGFkZXJJbnB1dCIsIm51bUF0dHJpYnV0ZXMiLCJBQ1RJVkVfQVRUUklCVVRFUyIsImdldEFjdGl2ZUF0dHJpYiIsImdldEF0dHJpYkxvY2F0aW9uIiwibmFtZSIsInVuZGVmaW5lZCIsIlNoYWRlcklucHV0IiwicGNVbmlmb3JtVHlwZSIsInR5cGUiLCJudW1Vbmlmb3JtcyIsIkFDVElWRV9VTklGT1JNUyIsImdldEFjdGl2ZVVuaWZvcm0iLCJnZXRVbmlmb3JtTG9jYXRpb24iLCJTQU1QTEVSXzJEIiwiU0FNUExFUl9DVUJFIiwiU0FNUExFUl8yRF9TSEFET1ciLCJTQU1QTEVSX0NVQkVfU0hBRE9XIiwiU0FNUExFUl8zRCIsInJlYWR5Iiwic291cmNlIiwic2hhZGVyVHlwZSIsImdldFNoYWRlclBhcmFtZXRlciIsIkNPTVBJTEVfU1RBVFVTIiwiaW5mb0xvZyIsImdldFNoYWRlckluZm9Mb2ciLCJjb2RlIiwiX3Byb2Nlc3NFcnJvciIsImxpbmVzIiwic3BsaXQiLCJmcm9tIiwidG8iLCJsZW5ndGgiLCJzdGFydHNXaXRoIiwibWF0Y2giLCJsaW5lIiwicGFyc2VJbnQiLCJNYXRoIiwibWF4IiwibWluIl0sIm1hcHBpbmdzIjoiOzs7Ozs7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
