/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../../core/debug.js';
import { FILTER_NEAREST, FILTER_LINEAR_MIPMAP_LINEAR, FILTER_LINEAR, ADDRESS_CLAMP_TO_EDGE, PIXELFORMAT_DEPTHSTENCIL, PIXELFORMAT_RGBA8 } from '../../platform/graphics/constants.js';
import { RenderTarget } from '../../platform/graphics/render-target.js';
import { Texture } from '../../platform/graphics/texture.js';
import { BlendState } from '../../platform/graphics/blend-state.js';
import { DebugGraphics } from '../../platform/graphics/debug-graphics.js';
import { LAYERID_DEPTH, SHADER_DEPTH, LAYERID_WORLD } from '../constants.js';
import { Layer } from '../layer.js';

// uniform names (first is current name, second one is deprecated name for compatibility)
const _depthUniformNames = ['uSceneDepthMap', 'uDepthMap'];
const _colorUniformNames = ['uSceneColorMap', 'texture_grabPass'];

/**
 * Internal class abstracting the access to the depth and color texture of the scene.
 * color frame buffer is copied to a texture
 * For webgl 2 devices, the depth buffer is copied to a texture
 * for webgl 1 devices, the scene's depth is rendered to a separate RGBA texture
 *
 * TODO: implement mipmapped color buffer support for WebGL 1 as well, which requires
 * the texture to be a power of two, by first downscaling the captured framebuffer
 * texture to smaller power of 2 texture, and then generate mipmaps and use it for rendering
 * TODO: or even better, implement blur filter to have smoother lower levels
 *
 * @ignore
 */
class SceneGrab {
  /**
   * Create an instance of SceneGrab.
   *
   * @param {import('../../platform/graphics/graphics-device.js').GraphicsDevice} device - The
   * graphics device.
   * @param {import('../scene.js').Scene} scene - The scene.
   */
  constructor(device, scene) {
    Debug.assert(scene);
    this.scene = scene;
    Debug.assert(device);
    this.device = device;

    // create depth layer
    this.layer = null;

    // create a depth layer, which is a default depth layer, but also a template used
    // to patch application created depth layers to behave as one
    if (this.device.webgl2 || this.device.isWebGPU) {
      this.initMainPath();
    } else {
      this.initFallbackPath();
    }
  }

  /**
   * Returns true if the camera rendering scene grab textures requires a render pass to do it.
   *
   * @param {import('../../platform/graphics/graphics-device.js').GraphicsDevice} device - The
   * graphics device used for rendering.
   * @param {import('../../framework/components/camera/component.js').CameraComponent} camera - The camera that
   * needs scene grab textures.
   */
  static requiresRenderPass(device, camera) {
    // just copy out the textures, no render pass needed
    if (device.webgl2 || device.isWebGPU) {
      return false;
    }

    // on WebGL1 device, only depth rendering needs render pass
    return camera.renderSceneDepthMap;
  }
  setupUniform(device, depth, buffer) {
    // assign it to scopes to expose it to shaders
    const names = depth ? _depthUniformNames : _colorUniformNames;
    names.forEach(name => device.scope.resolve(name).setValue(buffer));
  }
  allocateTexture(device, source, name, format, isDepth, mipmaps) {
    // allocate texture that will store the depth
    return new Texture(device, {
      name,
      format,
      width: source ? source.colorBuffer.width : device.width,
      height: source ? source.colorBuffer.height : device.height,
      mipmaps,
      minFilter: isDepth ? FILTER_NEAREST : mipmaps ? FILTER_LINEAR_MIPMAP_LINEAR : FILTER_LINEAR,
      magFilter: isDepth ? FILTER_NEAREST : FILTER_LINEAR,
      addressU: ADDRESS_CLAMP_TO_EDGE,
      addressV: ADDRESS_CLAMP_TO_EDGE
    });
  }

  // texture format of the source texture the grab pass needs to copy
  getSourceColorFormat(texture) {
    var _texture$format;
    // based on the RT the camera renders to, otherwise framebuffer
    return (_texture$format = texture == null ? void 0 : texture.format) != null ? _texture$format : this.device.framebufferFormat;
  }
  shouldReallocate(targetRT, sourceTexture, testFormat) {
    // need to reallocate if format does not match
    if (testFormat) {
      const targetFormat = targetRT == null ? void 0 : targetRT.colorBuffer.format;
      const sourceFormat = this.getSourceColorFormat(sourceTexture);
      if (targetFormat !== sourceFormat) return true;
    }

    // need to reallocate if dimensions don't match
    const width = (sourceTexture == null ? void 0 : sourceTexture.width) || this.device.width;
    const height = (sourceTexture == null ? void 0 : sourceTexture.height) || this.device.height;
    return !targetRT || width !== targetRT.width || height !== targetRT.height;
  }
  allocateRenderTarget(renderTarget, sourceRenderTarget, device, format, isDepth, mipmaps, isDepthUniforms) {
    // texture / uniform names: new one (first), as well as old one  (second) for compatibility
    const names = isDepthUniforms ? _depthUniformNames : _colorUniformNames;

    // allocate texture buffer
    const buffer = this.allocateTexture(device, sourceRenderTarget, names[0], format, isDepth, mipmaps);
    if (renderTarget) {
      // if reallocating RT size, release previous framebuffer
      renderTarget.destroyFrameBuffers();

      // assign new texture
      if (isDepth) {
        renderTarget._depthBuffer = buffer;
      } else {
        renderTarget._colorBuffer = buffer;
      }
    } else {
      // create new render target with the texture
      renderTarget = new RenderTarget({
        name: 'renderTargetSceneGrab',
        colorBuffer: isDepth ? null : buffer,
        depthBuffer: isDepth ? buffer : null,
        depth: !isDepth,
        stencil: device.supportsStencil,
        autoResolve: false
      });
    }
    return renderTarget;
  }
  releaseRenderTarget(rt) {
    if (rt) {
      rt.destroyTextureBuffers();
      rt.destroy();
    }
  }

  // main path where both color and depth is copied from existing surface
  initMainPath() {
    const device = this.device;
    const self = this;

    // WebGL 2 depth layer just copies existing color or depth
    this.layer = new Layer({
      enabled: false,
      name: "Depth",
      id: LAYERID_DEPTH,
      onDisable: function () {
        self.releaseRenderTarget(this.depthRenderTarget);
        this.depthRenderTarget = null;
        self.releaseRenderTarget(this.colorRenderTarget);
        this.colorRenderTarget = null;
      },
      onPreRenderOpaque: function (cameraPass) {
        // resize depth map if needed

        /** @type {import('../../framework/components/camera/component.js').CameraComponent} */
        const camera = this.cameras[cameraPass];
        if (camera.renderSceneColorMap) {
          var _camera$renderTarget;
          // allocate / resize existing RT as needed
          if (self.shouldReallocate(this.colorRenderTarget, (_camera$renderTarget = camera.renderTarget) == null ? void 0 : _camera$renderTarget.colorBuffer, true)) {
            var _camera$renderTarget2;
            self.releaseRenderTarget(this.colorRenderTarget);
            const format = self.getSourceColorFormat((_camera$renderTarget2 = camera.renderTarget) == null ? void 0 : _camera$renderTarget2.colorBuffer);
            this.colorRenderTarget = self.allocateRenderTarget(this.colorRenderTarget, camera.renderTarget, device, format, false, true, false);
          }

          // copy color from the current render target
          DebugGraphics.pushGpuMarker(device, 'GRAB-COLOR');
          const colorBuffer = this.colorRenderTarget.colorBuffer;
          if (device.isWebGPU) {
            device.copyRenderTarget(camera.renderTarget, this.colorRenderTarget, true, false);
          } else {
            device.copyRenderTarget(device.renderTarget, this.colorRenderTarget, true, false);

            // generate mipmaps
            device.activeTexture(device.maxCombinedTextures - 1);
            device.bindTexture(colorBuffer);
            device.gl.generateMipmap(colorBuffer.impl._glTarget);
          }
          DebugGraphics.popGpuMarker(device);

          // assign unifrom
          self.setupUniform(device, false, colorBuffer);
        }
        if (camera.renderSceneDepthMap) {
          var _camera$renderTarget3;
          // reallocate RT if needed
          if (self.shouldReallocate(this.depthRenderTarget, (_camera$renderTarget3 = camera.renderTarget) == null ? void 0 : _camera$renderTarget3.depthBuffer)) {
            self.releaseRenderTarget(this.depthRenderTarget);
            this.depthRenderTarget = self.allocateRenderTarget(this.depthRenderTarget, camera.renderTarget, device, PIXELFORMAT_DEPTHSTENCIL, true, false, true);
          }

          // copy depth
          DebugGraphics.pushGpuMarker(device, 'GRAB-DEPTH');
          device.copyRenderTarget(device.renderTarget, this.depthRenderTarget, false, true);
          DebugGraphics.popGpuMarker(device);

          // assign unifrom
          self.setupUniform(device, true, this.depthRenderTarget.depthBuffer);
        }
      },
      onPostRenderOpaque: function (cameraPass) {}
    });
  }

  // fallback path, where copy is not possible and the scene gets re-rendered
  initFallbackPath() {
    const self = this;
    const device = this.device;
    const scene = this.scene;

    // WebGL 1 depth layer renders the same objects as in World, but with RGBA-encoded depth shader to get depth
    this.layer = new Layer({
      enabled: false,
      name: "Depth",
      id: LAYERID_DEPTH,
      shaderPass: SHADER_DEPTH,
      onEnable: function () {
        // create RT without textures, those will be created as needed later
        this.depthRenderTarget = new RenderTarget({
          name: 'depthRenderTarget-webgl1',
          depth: true,
          stencil: device.supportsStencil,
          autoResolve: false,
          graphicsDevice: device
        });

        // assign it so the render actions knows to render to it
        // TODO: avoid this as this API is deprecated
        this.renderTarget = this.depthRenderTarget;
      },
      onDisable: function () {
        // only release depth texture, but not the render target itself
        this.depthRenderTarget.destroyTextureBuffers();
        this.renderTarget = null;
        self.releaseRenderTarget(this.colorRenderTarget);
        this.colorRenderTarget = null;
      },
      onPostCull: function (cameraPass) {
        /** @type {import('../../framework/components/camera/component.js').CameraComponent} */
        const camera = this.cameras[cameraPass];
        if (camera.renderSceneDepthMap) {
          var _camera$renderTarget4;
          // reallocate RT if needed
          if (!this.depthRenderTarget.depthBuffer || self.shouldReallocate(this.depthRenderTarget, (_camera$renderTarget4 = camera.renderTarget) == null ? void 0 : _camera$renderTarget4.depthBuffer)) {
            this.depthRenderTarget.destroyTextureBuffers();
            this.depthRenderTarget = self.allocateRenderTarget(this.depthRenderTarget, camera.renderTarget, device, PIXELFORMAT_RGBA8, false, false, true);
          }

          // Collect all rendered mesh instances with the same render target as World has, depthWrite == true and prior to this layer to replicate blitFramebuffer on WebGL2
          const visibleObjects = this.instances.visibleOpaque[cameraPass];
          const visibleList = visibleObjects.list;
          const layerComposition = scene.layers;
          const subLayerEnabled = layerComposition.subLayerEnabled;
          const isTransparent = layerComposition.subLayerList;

          // can't use self.defaultLayerWorld.renderTarget because projects that use the editor override default layers
          const rt = layerComposition.getLayerById(LAYERID_WORLD).renderTarget;
          let visibleLength = 0;
          const layers = layerComposition.layerList;
          for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer === this) break;
            if (layer.renderTarget !== rt || !layer.enabled || !subLayerEnabled[i]) continue;
            const layerCamId = layer.cameras.indexOf(camera);
            if (layerCamId < 0) continue;
            const transparent = isTransparent[i];
            let layerVisibleList = transparent ? layer.instances.visibleTransparent[layerCamId] : layer.instances.visibleOpaque[layerCamId];
            const layerVisibleListLength = layerVisibleList.length;
            layerVisibleList = layerVisibleList.list;
            for (let j = 0; j < layerVisibleListLength; j++) {
              const drawCall = layerVisibleList[j];
              if (drawCall.material && drawCall.material.depthWrite && !drawCall._noDepthDrawGl1) {
                visibleList[visibleLength] = drawCall;
                visibleLength++;
              }
            }
          }
          visibleObjects.length = visibleLength;
        }
      },
      onPreRenderOpaque: function (cameraPass) {
        /** @type {import('../../framework/components/camera/component.js').CameraComponent} */
        const camera = this.cameras[cameraPass];
        if (camera.renderSceneColorMap) {
          var _camera$renderTarget5;
          // reallocate RT if needed
          if (self.shouldReallocate(this.colorRenderTarget, (_camera$renderTarget5 = camera.renderTarget) == null ? void 0 : _camera$renderTarget5.colorBuffer)) {
            var _camera$renderTarget6;
            self.releaseRenderTarget(this.colorRenderTarget);
            const format = self.getSourceColorFormat((_camera$renderTarget6 = camera.renderTarget) == null ? void 0 : _camera$renderTarget6.colorBuffer);
            this.colorRenderTarget = self.allocateRenderTarget(this.colorRenderTarget, camera.renderTarget, device, format, false, false, false);
          }

          // copy out the color buffer
          DebugGraphics.pushGpuMarker(device, 'GRAB-COLOR');

          // initialize the texture
          const colorBuffer = this.colorRenderTarget._colorBuffer;
          if (!colorBuffer.impl._glTexture) {
            colorBuffer.impl.initialize(device, colorBuffer);
          }

          // copy framebuffer to it
          device.bindTexture(colorBuffer);
          const gl = device.gl;
          gl.copyTexImage2D(gl.TEXTURE_2D, 0, colorBuffer.impl._glFormat, 0, 0, colorBuffer.width, colorBuffer.height, 0);

          // stop the device from updating this texture further
          colorBuffer._needsUpload = false;
          colorBuffer._needsMipmapsUpload = false;
          DebugGraphics.popGpuMarker(device);

          // assign unifrom
          self.setupUniform(device, false, colorBuffer);
        }
        if (camera.renderSceneDepthMap) {
          // assign unifrom
          self.setupUniform(device, true, this.depthRenderTarget.colorBuffer);
        }
      },
      onDrawCall: function () {
        // writing depth to color render target, force no blending and writing to all channels
        device.setBlendState(BlendState.DEFAULT);
      },
      onPostRenderOpaque: function (cameraPass) {
        /** @type {import('../../framework/components/camera/component.js').CameraComponent} */
        const camera = this.cameras[cameraPass];
        if (camera.renderSceneDepthMap) {
          // just clear the list of visible objects to avoid keeping references
          const visibleObjects = this.instances.visibleOpaque[cameraPass];
          visibleObjects.length = 0;
        }
      }
    });
  }

  // function which patches a layer to use depth layer set up in this class
  patch(layer) {
    layer.onEnable = this.layer.onEnable;
    layer.onDisable = this.layer.onDisable;
    layer.onPreRenderOpaque = this.layer.onPreRenderOpaque;
    layer.onPostRenderOpaque = this.layer.onPostRenderOpaque;
    layer.shaderPass = this.layer.shaderPass;
    layer.onPostCull = this.layer.onPostCull;
    layer.onDrawCall = this.layer.onDrawCall;
  }
}

export { SceneGrab };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtZ3JhYi5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjZW5lL2dyYXBoaWNzL3NjZW5lLWdyYWIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGVidWcgfSBmcm9tICcuLi8uLi9jb3JlL2RlYnVnLmpzJztcblxuaW1wb3J0IHtcbiAgICBBRERSRVNTX0NMQU1QX1RPX0VER0UsXG4gICAgRklMVEVSX05FQVJFU1QsIEZJTFRFUl9MSU5FQVIsIEZJTFRFUl9MSU5FQVJfTUlQTUFQX0xJTkVBUixcbiAgICBQSVhFTEZPUk1BVF9ERVBUSFNURU5DSUwsIFBJWEVMRk9STUFUX1JHQkE4XG59IGZyb20gJy4uLy4uL3BsYXRmb3JtL2dyYXBoaWNzL2NvbnN0YW50cy5qcyc7XG5cbmltcG9ydCB7IFJlbmRlclRhcmdldCB9IGZyb20gJy4uLy4uL3BsYXRmb3JtL2dyYXBoaWNzL3JlbmRlci10YXJnZXQuanMnO1xuaW1wb3J0IHsgVGV4dHVyZSB9IGZyb20gJy4uLy4uL3BsYXRmb3JtL2dyYXBoaWNzL3RleHR1cmUuanMnO1xuaW1wb3J0IHsgQmxlbmRTdGF0ZSB9IGZyb20gJy4uLy4uL3BsYXRmb3JtL2dyYXBoaWNzL2JsZW5kLXN0YXRlLmpzJztcbmltcG9ydCB7IERlYnVnR3JhcGhpY3MgfSBmcm9tICcuLi8uLi9wbGF0Zm9ybS9ncmFwaGljcy9kZWJ1Zy1ncmFwaGljcy5qcyc7XG5cbmltcG9ydCB7XG4gICAgTEFZRVJJRF9ERVBUSCwgTEFZRVJJRF9XT1JMRCxcbiAgICBTSEFERVJfREVQVEhcbn0gZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcblxuaW1wb3J0IHsgTGF5ZXIgfSBmcm9tICcuLi9sYXllci5qcyc7XG5cbi8vIHVuaWZvcm0gbmFtZXMgKGZpcnN0IGlzIGN1cnJlbnQgbmFtZSwgc2Vjb25kIG9uZSBpcyBkZXByZWNhdGVkIG5hbWUgZm9yIGNvbXBhdGliaWxpdHkpXG5jb25zdCBfZGVwdGhVbmlmb3JtTmFtZXMgPSBbJ3VTY2VuZURlcHRoTWFwJywgJ3VEZXB0aE1hcCddO1xuY29uc3QgX2NvbG9yVW5pZm9ybU5hbWVzID0gWyd1U2NlbmVDb2xvck1hcCcsICd0ZXh0dXJlX2dyYWJQYXNzJ107XG5cbi8qKlxuICogSW50ZXJuYWwgY2xhc3MgYWJzdHJhY3RpbmcgdGhlIGFjY2VzcyB0byB0aGUgZGVwdGggYW5kIGNvbG9yIHRleHR1cmUgb2YgdGhlIHNjZW5lLlxuICogY29sb3IgZnJhbWUgYnVmZmVyIGlzIGNvcGllZCB0byBhIHRleHR1cmVcbiAqIEZvciB3ZWJnbCAyIGRldmljZXMsIHRoZSBkZXB0aCBidWZmZXIgaXMgY29waWVkIHRvIGEgdGV4dHVyZVxuICogZm9yIHdlYmdsIDEgZGV2aWNlcywgdGhlIHNjZW5lJ3MgZGVwdGggaXMgcmVuZGVyZWQgdG8gYSBzZXBhcmF0ZSBSR0JBIHRleHR1cmVcbiAqXG4gKiBUT0RPOiBpbXBsZW1lbnQgbWlwbWFwcGVkIGNvbG9yIGJ1ZmZlciBzdXBwb3J0IGZvciBXZWJHTCAxIGFzIHdlbGwsIHdoaWNoIHJlcXVpcmVzXG4gKiB0aGUgdGV4dHVyZSB0byBiZSBhIHBvd2VyIG9mIHR3bywgYnkgZmlyc3QgZG93bnNjYWxpbmcgdGhlIGNhcHR1cmVkIGZyYW1lYnVmZmVyXG4gKiB0ZXh0dXJlIHRvIHNtYWxsZXIgcG93ZXIgb2YgMiB0ZXh0dXJlLCBhbmQgdGhlbiBnZW5lcmF0ZSBtaXBtYXBzIGFuZCB1c2UgaXQgZm9yIHJlbmRlcmluZ1xuICogVE9ETzogb3IgZXZlbiBiZXR0ZXIsIGltcGxlbWVudCBibHVyIGZpbHRlciB0byBoYXZlIHNtb290aGVyIGxvd2VyIGxldmVsc1xuICpcbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgU2NlbmVHcmFiIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW4gaW5zdGFuY2Ugb2YgU2NlbmVHcmFiLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uLy4uL3BsYXRmb3JtL2dyYXBoaWNzL2dyYXBoaWNzLWRldmljZS5qcycpLkdyYXBoaWNzRGV2aWNlfSBkZXZpY2UgLSBUaGVcbiAgICAgKiBncmFwaGljcyBkZXZpY2UuXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL3NjZW5lLmpzJykuU2NlbmV9IHNjZW5lIC0gVGhlIHNjZW5lLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGRldmljZSwgc2NlbmUpIHtcblxuICAgICAgICBEZWJ1Zy5hc3NlcnQoc2NlbmUpO1xuICAgICAgICB0aGlzLnNjZW5lID0gc2NlbmU7XG5cbiAgICAgICAgRGVidWcuYXNzZXJ0KGRldmljZSk7XG4gICAgICAgIHRoaXMuZGV2aWNlID0gZGV2aWNlO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBkZXB0aCBsYXllclxuICAgICAgICB0aGlzLmxheWVyID0gbnVsbDtcblxuICAgICAgICAvLyBjcmVhdGUgYSBkZXB0aCBsYXllciwgd2hpY2ggaXMgYSBkZWZhdWx0IGRlcHRoIGxheWVyLCBidXQgYWxzbyBhIHRlbXBsYXRlIHVzZWRcbiAgICAgICAgLy8gdG8gcGF0Y2ggYXBwbGljYXRpb24gY3JlYXRlZCBkZXB0aCBsYXllcnMgdG8gYmVoYXZlIGFzIG9uZVxuICAgICAgICBpZiAodGhpcy5kZXZpY2Uud2ViZ2wyIHx8IHRoaXMuZGV2aWNlLmlzV2ViR1BVKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRNYWluUGF0aCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbml0RmFsbGJhY2tQYXRoKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGNhbWVyYSByZW5kZXJpbmcgc2NlbmUgZ3JhYiB0ZXh0dXJlcyByZXF1aXJlcyBhIHJlbmRlciBwYXNzIHRvIGRvIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uLy4uL3BsYXRmb3JtL2dyYXBoaWNzL2dyYXBoaWNzLWRldmljZS5qcycpLkdyYXBoaWNzRGV2aWNlfSBkZXZpY2UgLSBUaGVcbiAgICAgKiBncmFwaGljcyBkZXZpY2UgdXNlZCBmb3IgcmVuZGVyaW5nLlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi8uLi9mcmFtZXdvcmsvY29tcG9uZW50cy9jYW1lcmEvY29tcG9uZW50LmpzJykuQ2FtZXJhQ29tcG9uZW50fSBjYW1lcmEgLSBUaGUgY2FtZXJhIHRoYXRcbiAgICAgKiBuZWVkcyBzY2VuZSBncmFiIHRleHR1cmVzLlxuICAgICAqL1xuICAgIHN0YXRpYyByZXF1aXJlc1JlbmRlclBhc3MoZGV2aWNlLCBjYW1lcmEpIHtcblxuICAgICAgICAvLyBqdXN0IGNvcHkgb3V0IHRoZSB0ZXh0dXJlcywgbm8gcmVuZGVyIHBhc3MgbmVlZGVkXG4gICAgICAgIGlmIChkZXZpY2Uud2ViZ2wyIHx8IGRldmljZS5pc1dlYkdQVSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gb24gV2ViR0wxIGRldmljZSwgb25seSBkZXB0aCByZW5kZXJpbmcgbmVlZHMgcmVuZGVyIHBhc3NcbiAgICAgICAgcmV0dXJuIGNhbWVyYS5yZW5kZXJTY2VuZURlcHRoTWFwO1xuICAgIH1cblxuICAgIHNldHVwVW5pZm9ybShkZXZpY2UsIGRlcHRoLCBidWZmZXIpIHtcblxuICAgICAgICAvLyBhc3NpZ24gaXQgdG8gc2NvcGVzIHRvIGV4cG9zZSBpdCB0byBzaGFkZXJzXG4gICAgICAgIGNvbnN0IG5hbWVzID0gZGVwdGggPyBfZGVwdGhVbmlmb3JtTmFtZXMgOiBfY29sb3JVbmlmb3JtTmFtZXM7XG4gICAgICAgIG5hbWVzLmZvckVhY2gobmFtZSA9PiBkZXZpY2Uuc2NvcGUucmVzb2x2ZShuYW1lKS5zZXRWYWx1ZShidWZmZXIpKTtcbiAgICB9XG5cbiAgICBhbGxvY2F0ZVRleHR1cmUoZGV2aWNlLCBzb3VyY2UsIG5hbWUsIGZvcm1hdCwgaXNEZXB0aCwgbWlwbWFwcykge1xuXG4gICAgICAgIC8vIGFsbG9jYXRlIHRleHR1cmUgdGhhdCB3aWxsIHN0b3JlIHRoZSBkZXB0aFxuICAgICAgICByZXR1cm4gbmV3IFRleHR1cmUoZGV2aWNlLCB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgICAgd2lkdGg6IHNvdXJjZSA/IHNvdXJjZS5jb2xvckJ1ZmZlci53aWR0aCA6IGRldmljZS53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogc291cmNlID8gc291cmNlLmNvbG9yQnVmZmVyLmhlaWdodCA6IGRldmljZS5oZWlnaHQsXG4gICAgICAgICAgICBtaXBtYXBzLFxuICAgICAgICAgICAgbWluRmlsdGVyOiBpc0RlcHRoID8gRklMVEVSX05FQVJFU1QgOiAobWlwbWFwcyA/IEZJTFRFUl9MSU5FQVJfTUlQTUFQX0xJTkVBUiA6IEZJTFRFUl9MSU5FQVIpLFxuICAgICAgICAgICAgbWFnRmlsdGVyOiBpc0RlcHRoID8gRklMVEVSX05FQVJFU1QgOiBGSUxURVJfTElORUFSLFxuICAgICAgICAgICAgYWRkcmVzc1U6IEFERFJFU1NfQ0xBTVBfVE9fRURHRSxcbiAgICAgICAgICAgIGFkZHJlc3NWOiBBRERSRVNTX0NMQU1QX1RPX0VER0VcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gdGV4dHVyZSBmb3JtYXQgb2YgdGhlIHNvdXJjZSB0ZXh0dXJlIHRoZSBncmFiIHBhc3MgbmVlZHMgdG8gY29weVxuICAgIGdldFNvdXJjZUNvbG9yRm9ybWF0KHRleHR1cmUpIHtcbiAgICAgICAgLy8gYmFzZWQgb24gdGhlIFJUIHRoZSBjYW1lcmEgcmVuZGVycyB0bywgb3RoZXJ3aXNlIGZyYW1lYnVmZmVyXG4gICAgICAgIHJldHVybiB0ZXh0dXJlPy5mb3JtYXQgPz8gdGhpcy5kZXZpY2UuZnJhbWVidWZmZXJGb3JtYXQ7XG4gICAgfVxuXG4gICAgc2hvdWxkUmVhbGxvY2F0ZSh0YXJnZXRSVCwgc291cmNlVGV4dHVyZSwgdGVzdEZvcm1hdCkge1xuXG4gICAgICAgIC8vIG5lZWQgdG8gcmVhbGxvY2F0ZSBpZiBmb3JtYXQgZG9lcyBub3QgbWF0Y2hcbiAgICAgICAgaWYgKHRlc3RGb3JtYXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEZvcm1hdCA9IHRhcmdldFJUPy5jb2xvckJ1ZmZlci5mb3JtYXQ7XG4gICAgICAgICAgICBjb25zdCBzb3VyY2VGb3JtYXQgPSB0aGlzLmdldFNvdXJjZUNvbG9yRm9ybWF0KHNvdXJjZVRleHR1cmUpO1xuICAgICAgICAgICAgaWYgKHRhcmdldEZvcm1hdCAhPT0gc291cmNlRm9ybWF0KVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbmVlZCB0byByZWFsbG9jYXRlIGlmIGRpbWVuc2lvbnMgZG9uJ3QgbWF0Y2hcbiAgICAgICAgY29uc3Qgd2lkdGggPSBzb3VyY2VUZXh0dXJlPy53aWR0aCB8fCB0aGlzLmRldmljZS53aWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gc291cmNlVGV4dHVyZT8uaGVpZ2h0IHx8IHRoaXMuZGV2aWNlLmhlaWdodDtcbiAgICAgICAgcmV0dXJuICF0YXJnZXRSVCB8fCB3aWR0aCAhPT0gdGFyZ2V0UlQud2lkdGggfHwgaGVpZ2h0ICE9PSB0YXJnZXRSVC5oZWlnaHQ7XG4gICAgfVxuXG4gICAgYWxsb2NhdGVSZW5kZXJUYXJnZXQocmVuZGVyVGFyZ2V0LCBzb3VyY2VSZW5kZXJUYXJnZXQsIGRldmljZSwgZm9ybWF0LCBpc0RlcHRoLCBtaXBtYXBzLCBpc0RlcHRoVW5pZm9ybXMpIHtcblxuICAgICAgICAvLyB0ZXh0dXJlIC8gdW5pZm9ybSBuYW1lczogbmV3IG9uZSAoZmlyc3QpLCBhcyB3ZWxsIGFzIG9sZCBvbmUgIChzZWNvbmQpIGZvciBjb21wYXRpYmlsaXR5XG4gICAgICAgIGNvbnN0IG5hbWVzID0gaXNEZXB0aFVuaWZvcm1zID8gX2RlcHRoVW5pZm9ybU5hbWVzIDogX2NvbG9yVW5pZm9ybU5hbWVzO1xuXG4gICAgICAgIC8vIGFsbG9jYXRlIHRleHR1cmUgYnVmZmVyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYWxsb2NhdGVUZXh0dXJlKGRldmljZSwgc291cmNlUmVuZGVyVGFyZ2V0LCBuYW1lc1swXSwgZm9ybWF0LCBpc0RlcHRoLCBtaXBtYXBzKTtcblxuICAgICAgICBpZiAocmVuZGVyVGFyZ2V0KSB7XG5cbiAgICAgICAgICAgIC8vIGlmIHJlYWxsb2NhdGluZyBSVCBzaXplLCByZWxlYXNlIHByZXZpb3VzIGZyYW1lYnVmZmVyXG4gICAgICAgICAgICByZW5kZXJUYXJnZXQuZGVzdHJveUZyYW1lQnVmZmVycygpO1xuXG4gICAgICAgICAgICAvLyBhc3NpZ24gbmV3IHRleHR1cmVcbiAgICAgICAgICAgIGlmIChpc0RlcHRoKSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyVGFyZ2V0Ll9kZXB0aEJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyVGFyZ2V0Ll9jb2xvckJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gY3JlYXRlIG5ldyByZW5kZXIgdGFyZ2V0IHdpdGggdGhlIHRleHR1cmVcbiAgICAgICAgICAgIHJlbmRlclRhcmdldCA9IG5ldyBSZW5kZXJUYXJnZXQoe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdyZW5kZXJUYXJnZXRTY2VuZUdyYWInLFxuICAgICAgICAgICAgICAgIGNvbG9yQnVmZmVyOiBpc0RlcHRoID8gbnVsbCA6IGJ1ZmZlcixcbiAgICAgICAgICAgICAgICBkZXB0aEJ1ZmZlcjogaXNEZXB0aCA/IGJ1ZmZlciA6IG51bGwsXG4gICAgICAgICAgICAgICAgZGVwdGg6ICFpc0RlcHRoLFxuICAgICAgICAgICAgICAgIHN0ZW5jaWw6IGRldmljZS5zdXBwb3J0c1N0ZW5jaWwsXG4gICAgICAgICAgICAgICAgYXV0b1Jlc29sdmU6IGZhbHNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZW5kZXJUYXJnZXQ7XG4gICAgfVxuXG4gICAgcmVsZWFzZVJlbmRlclRhcmdldChydCkge1xuXG4gICAgICAgIGlmIChydCkge1xuICAgICAgICAgICAgcnQuZGVzdHJveVRleHR1cmVCdWZmZXJzKCk7XG4gICAgICAgICAgICBydC5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBtYWluIHBhdGggd2hlcmUgYm90aCBjb2xvciBhbmQgZGVwdGggaXMgY29waWVkIGZyb20gZXhpc3Rpbmcgc3VyZmFjZVxuICAgIGluaXRNYWluUGF0aCgpIHtcblxuICAgICAgICBjb25zdCBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gV2ViR0wgMiBkZXB0aCBsYXllciBqdXN0IGNvcGllcyBleGlzdGluZyBjb2xvciBvciBkZXB0aFxuICAgICAgICB0aGlzLmxheWVyID0gbmV3IExheWVyKHtcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgbmFtZTogXCJEZXB0aFwiLFxuICAgICAgICAgICAgaWQ6IExBWUVSSURfREVQVEgsXG5cbiAgICAgICAgICAgIG9uRGlzYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVsZWFzZVJlbmRlclRhcmdldCh0aGlzLmRlcHRoUmVuZGVyVGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmRlcHRoUmVuZGVyVGFyZ2V0ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHNlbGYucmVsZWFzZVJlbmRlclRhcmdldCh0aGlzLmNvbG9yUmVuZGVyVGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUmVuZGVyVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uUHJlUmVuZGVyT3BhcXVlOiBmdW5jdGlvbiAoY2FtZXJhUGFzcykgeyAvLyByZXNpemUgZGVwdGggbWFwIGlmIG5lZWRlZFxuXG4gICAgICAgICAgICAgICAgLyoqIEB0eXBlIHtpbXBvcnQoJy4uLy4uL2ZyYW1ld29yay9jb21wb25lbnRzL2NhbWVyYS9jb21wb25lbnQuanMnKS5DYW1lcmFDb21wb25lbnR9ICovXG4gICAgICAgICAgICAgICAgY29uc3QgY2FtZXJhID0gdGhpcy5jYW1lcmFzW2NhbWVyYVBhc3NdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNhbWVyYS5yZW5kZXJTY2VuZUNvbG9yTWFwKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gYWxsb2NhdGUgLyByZXNpemUgZXhpc3RpbmcgUlQgYXMgbmVlZGVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLnNob3VsZFJlYWxsb2NhdGUodGhpcy5jb2xvclJlbmRlclRhcmdldCwgY2FtZXJhLnJlbmRlclRhcmdldD8uY29sb3JCdWZmZXIsIHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbGVhc2VSZW5kZXJUYXJnZXQodGhpcy5jb2xvclJlbmRlclRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXQgPSBzZWxmLmdldFNvdXJjZUNvbG9yRm9ybWF0KGNhbWVyYS5yZW5kZXJUYXJnZXQ/LmNvbG9yQnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29sb3JSZW5kZXJUYXJnZXQgPSBzZWxmLmFsbG9jYXRlUmVuZGVyVGFyZ2V0KHRoaXMuY29sb3JSZW5kZXJUYXJnZXQsIGNhbWVyYS5yZW5kZXJUYXJnZXQsIGRldmljZSwgZm9ybWF0LCBmYWxzZSwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY29weSBjb2xvciBmcm9tIHRoZSBjdXJyZW50IHJlbmRlciB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgRGVidWdHcmFwaGljcy5wdXNoR3B1TWFya2VyKGRldmljZSwgJ0dSQUItQ09MT1InKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2xvckJ1ZmZlciA9IHRoaXMuY29sb3JSZW5kZXJUYXJnZXQuY29sb3JCdWZmZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRldmljZS5pc1dlYkdQVSkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2UuY29weVJlbmRlclRhcmdldChjYW1lcmEucmVuZGVyVGFyZ2V0LCB0aGlzLmNvbG9yUmVuZGVyVGFyZ2V0LCB0cnVlLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlLmNvcHlSZW5kZXJUYXJnZXQoZGV2aWNlLnJlbmRlclRhcmdldCwgdGhpcy5jb2xvclJlbmRlclRhcmdldCwgdHJ1ZSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnZW5lcmF0ZSBtaXBtYXBzXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2UuYWN0aXZlVGV4dHVyZShkZXZpY2UubWF4Q29tYmluZWRUZXh0dXJlcyAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlLmJpbmRUZXh0dXJlKGNvbG9yQnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldmljZS5nbC5nZW5lcmF0ZU1pcG1hcChjb2xvckJ1ZmZlci5pbXBsLl9nbFRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBEZWJ1Z0dyYXBoaWNzLnBvcEdwdU1hcmtlcihkZXZpY2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGFzc2lnbiB1bmlmcm9tXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0dXBVbmlmb3JtKGRldmljZSwgZmFsc2UsIGNvbG9yQnVmZmVyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY2FtZXJhLnJlbmRlclNjZW5lRGVwdGhNYXApIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyByZWFsbG9jYXRlIFJUIGlmIG5lZWRlZFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5zaG91bGRSZWFsbG9jYXRlKHRoaXMuZGVwdGhSZW5kZXJUYXJnZXQsIGNhbWVyYS5yZW5kZXJUYXJnZXQ/LmRlcHRoQnVmZmVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWxlYXNlUmVuZGVyVGFyZ2V0KHRoaXMuZGVwdGhSZW5kZXJUYXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXB0aFJlbmRlclRhcmdldCA9IHNlbGYuYWxsb2NhdGVSZW5kZXJUYXJnZXQodGhpcy5kZXB0aFJlbmRlclRhcmdldCwgY2FtZXJhLnJlbmRlclRhcmdldCwgZGV2aWNlLCBQSVhFTEZPUk1BVF9ERVBUSFNURU5DSUwsIHRydWUsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvcHkgZGVwdGhcbiAgICAgICAgICAgICAgICAgICAgRGVidWdHcmFwaGljcy5wdXNoR3B1TWFya2VyKGRldmljZSwgJ0dSQUItREVQVEgnKTtcbiAgICAgICAgICAgICAgICAgICAgZGV2aWNlLmNvcHlSZW5kZXJUYXJnZXQoZGV2aWNlLnJlbmRlclRhcmdldCwgdGhpcy5kZXB0aFJlbmRlclRhcmdldCwgZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBEZWJ1Z0dyYXBoaWNzLnBvcEdwdU1hcmtlcihkZXZpY2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGFzc2lnbiB1bmlmcm9tXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0dXBVbmlmb3JtKGRldmljZSwgdHJ1ZSwgdGhpcy5kZXB0aFJlbmRlclRhcmdldC5kZXB0aEJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25Qb3N0UmVuZGVyT3BhcXVlOiBmdW5jdGlvbiAoY2FtZXJhUGFzcykge1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBmYWxsYmFjayBwYXRoLCB3aGVyZSBjb3B5IGlzIG5vdCBwb3NzaWJsZSBhbmQgdGhlIHNjZW5lIGdldHMgcmUtcmVuZGVyZWRcbiAgICBpbml0RmFsbGJhY2tQYXRoKCkge1xuXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBjb25zdCBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgICAgICAgY29uc3Qgc2NlbmUgPSB0aGlzLnNjZW5lO1xuXG4gICAgICAgIC8vIFdlYkdMIDEgZGVwdGggbGF5ZXIgcmVuZGVycyB0aGUgc2FtZSBvYmplY3RzIGFzIGluIFdvcmxkLCBidXQgd2l0aCBSR0JBLWVuY29kZWQgZGVwdGggc2hhZGVyIHRvIGdldCBkZXB0aFxuICAgICAgICB0aGlzLmxheWVyID0gbmV3IExheWVyKHtcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgbmFtZTogXCJEZXB0aFwiLFxuICAgICAgICAgICAgaWQ6IExBWUVSSURfREVQVEgsXG4gICAgICAgICAgICBzaGFkZXJQYXNzOiBTSEFERVJfREVQVEgsXG5cbiAgICAgICAgICAgIG9uRW5hYmxlOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgUlQgd2l0aG91dCB0ZXh0dXJlcywgdGhvc2Ugd2lsbCBiZSBjcmVhdGVkIGFzIG5lZWRlZCBsYXRlclxuICAgICAgICAgICAgICAgIHRoaXMuZGVwdGhSZW5kZXJUYXJnZXQgPSBuZXcgUmVuZGVyVGFyZ2V0KHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RlcHRoUmVuZGVyVGFyZ2V0LXdlYmdsMScsXG4gICAgICAgICAgICAgICAgICAgIGRlcHRoOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzdGVuY2lsOiBkZXZpY2Uuc3VwcG9ydHNTdGVuY2lsLFxuICAgICAgICAgICAgICAgICAgICBhdXRvUmVzb2x2ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGdyYXBoaWNzRGV2aWNlOiBkZXZpY2VcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGFzc2lnbiBpdCBzbyB0aGUgcmVuZGVyIGFjdGlvbnMga25vd3MgdG8gcmVuZGVyIHRvIGl0XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogYXZvaWQgdGhpcyBhcyB0aGlzIEFQSSBpcyBkZXByZWNhdGVkXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJUYXJnZXQgPSB0aGlzLmRlcHRoUmVuZGVyVGFyZ2V0O1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25EaXNhYmxlOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBvbmx5IHJlbGVhc2UgZGVwdGggdGV4dHVyZSwgYnV0IG5vdCB0aGUgcmVuZGVyIHRhcmdldCBpdHNlbGZcbiAgICAgICAgICAgICAgICB0aGlzLmRlcHRoUmVuZGVyVGFyZ2V0LmRlc3Ryb3lUZXh0dXJlQnVmZmVycygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyVGFyZ2V0ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHNlbGYucmVsZWFzZVJlbmRlclRhcmdldCh0aGlzLmNvbG9yUmVuZGVyVGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUmVuZGVyVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uUG9zdEN1bGw6IGZ1bmN0aW9uIChjYW1lcmFQYXNzKSB7XG5cbiAgICAgICAgICAgICAgICAvKiogQHR5cGUge2ltcG9ydCgnLi4vLi4vZnJhbWV3b3JrL2NvbXBvbmVudHMvY2FtZXJhL2NvbXBvbmVudC5qcycpLkNhbWVyYUNvbXBvbmVudH0gKi9cbiAgICAgICAgICAgICAgICBjb25zdCBjYW1lcmEgPSB0aGlzLmNhbWVyYXNbY2FtZXJhUGFzc107XG5cbiAgICAgICAgICAgICAgICBpZiAoY2FtZXJhLnJlbmRlclNjZW5lRGVwdGhNYXApIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyByZWFsbG9jYXRlIFJUIGlmIG5lZWRlZFxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZGVwdGhSZW5kZXJUYXJnZXQuZGVwdGhCdWZmZXIgfHwgc2VsZi5zaG91bGRSZWFsbG9jYXRlKHRoaXMuZGVwdGhSZW5kZXJUYXJnZXQsIGNhbWVyYS5yZW5kZXJUYXJnZXQ/LmRlcHRoQnVmZmVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXB0aFJlbmRlclRhcmdldC5kZXN0cm95VGV4dHVyZUJ1ZmZlcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVwdGhSZW5kZXJUYXJnZXQgPSBzZWxmLmFsbG9jYXRlUmVuZGVyVGFyZ2V0KHRoaXMuZGVwdGhSZW5kZXJUYXJnZXQsIGNhbWVyYS5yZW5kZXJUYXJnZXQsIGRldmljZSwgUElYRUxGT1JNQVRfUkdCQTgsIGZhbHNlLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBDb2xsZWN0IGFsbCByZW5kZXJlZCBtZXNoIGluc3RhbmNlcyB3aXRoIHRoZSBzYW1lIHJlbmRlciB0YXJnZXQgYXMgV29ybGQgaGFzLCBkZXB0aFdyaXRlID09IHRydWUgYW5kIHByaW9yIHRvIHRoaXMgbGF5ZXIgdG8gcmVwbGljYXRlIGJsaXRGcmFtZWJ1ZmZlciBvbiBXZWJHTDJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlzaWJsZU9iamVjdHMgPSB0aGlzLmluc3RhbmNlcy52aXNpYmxlT3BhcXVlW2NhbWVyYVBhc3NdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2aXNpYmxlTGlzdCA9IHZpc2libGVPYmplY3RzLmxpc3Q7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyQ29tcG9zaXRpb24gPSBzY2VuZS5sYXllcnM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YkxheWVyRW5hYmxlZCA9IGxheWVyQ29tcG9zaXRpb24uc3ViTGF5ZXJFbmFibGVkO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1RyYW5zcGFyZW50ID0gbGF5ZXJDb21wb3NpdGlvbi5zdWJMYXllckxpc3Q7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2FuJ3QgdXNlIHNlbGYuZGVmYXVsdExheWVyV29ybGQucmVuZGVyVGFyZ2V0IGJlY2F1c2UgcHJvamVjdHMgdGhhdCB1c2UgdGhlIGVkaXRvciBvdmVycmlkZSBkZWZhdWx0IGxheWVyc1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBydCA9IGxheWVyQ29tcG9zaXRpb24uZ2V0TGF5ZXJCeUlkKExBWUVSSURfV09STEQpLnJlbmRlclRhcmdldDtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgdmlzaWJsZUxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxheWVycyA9IGxheWVyQ29tcG9zaXRpb24ubGF5ZXJMaXN0O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGF5ZXIgPSBsYXllcnNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGF5ZXIgPT09IHRoaXMpIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxheWVyLnJlbmRlclRhcmdldCAhPT0gcnQgfHwgIWxheWVyLmVuYWJsZWQgfHwgIXN1YkxheWVyRW5hYmxlZFtpXSkgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyQ2FtSWQgPSBsYXllci5jYW1lcmFzLmluZGV4T2YoY2FtZXJhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXllckNhbUlkIDwgMCkgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zcGFyZW50ID0gaXNUcmFuc3BhcmVudFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsYXllclZpc2libGVMaXN0ID0gdHJhbnNwYXJlbnQgPyBsYXllci5pbnN0YW5jZXMudmlzaWJsZVRyYW5zcGFyZW50W2xheWVyQ2FtSWRdIDogbGF5ZXIuaW5zdGFuY2VzLnZpc2libGVPcGFxdWVbbGF5ZXJDYW1JZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXllclZpc2libGVMaXN0TGVuZ3RoID0gbGF5ZXJWaXNpYmxlTGlzdC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllclZpc2libGVMaXN0ID0gbGF5ZXJWaXNpYmxlTGlzdC5saXN0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGxheWVyVmlzaWJsZUxpc3RMZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRyYXdDYWxsID0gbGF5ZXJWaXNpYmxlTGlzdFtqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZHJhd0NhbGwubWF0ZXJpYWwgJiYgZHJhd0NhbGwubWF0ZXJpYWwuZGVwdGhXcml0ZSAmJiAhZHJhd0NhbGwuX25vRGVwdGhEcmF3R2wxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGVMaXN0W3Zpc2libGVMZW5ndGhdID0gZHJhd0NhbGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGVMZW5ndGgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmlzaWJsZU9iamVjdHMubGVuZ3RoID0gdmlzaWJsZUxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvblByZVJlbmRlck9wYXF1ZTogZnVuY3Rpb24gKGNhbWVyYVBhc3MpIHtcblxuICAgICAgICAgICAgICAgIC8qKiBAdHlwZSB7aW1wb3J0KCcuLi8uLi9mcmFtZXdvcmsvY29tcG9uZW50cy9jYW1lcmEvY29tcG9uZW50LmpzJykuQ2FtZXJhQ29tcG9uZW50fSAqL1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbWVyYSA9IHRoaXMuY2FtZXJhc1tjYW1lcmFQYXNzXTtcblxuICAgICAgICAgICAgICAgIGlmIChjYW1lcmEucmVuZGVyU2NlbmVDb2xvck1hcCkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlYWxsb2NhdGUgUlQgaWYgbmVlZGVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLnNob3VsZFJlYWxsb2NhdGUodGhpcy5jb2xvclJlbmRlclRhcmdldCwgY2FtZXJhLnJlbmRlclRhcmdldD8uY29sb3JCdWZmZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbGVhc2VSZW5kZXJUYXJnZXQodGhpcy5jb2xvclJlbmRlclRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXQgPSBzZWxmLmdldFNvdXJjZUNvbG9yRm9ybWF0KGNhbWVyYS5yZW5kZXJUYXJnZXQ/LmNvbG9yQnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29sb3JSZW5kZXJUYXJnZXQgPSBzZWxmLmFsbG9jYXRlUmVuZGVyVGFyZ2V0KHRoaXMuY29sb3JSZW5kZXJUYXJnZXQsIGNhbWVyYS5yZW5kZXJUYXJnZXQsIGRldmljZSwgZm9ybWF0LCBmYWxzZSwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvcHkgb3V0IHRoZSBjb2xvciBidWZmZXJcbiAgICAgICAgICAgICAgICAgICAgRGVidWdHcmFwaGljcy5wdXNoR3B1TWFya2VyKGRldmljZSwgJ0dSQUItQ09MT1InKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBpbml0aWFsaXplIHRoZSB0ZXh0dXJlXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yQnVmZmVyID0gdGhpcy5jb2xvclJlbmRlclRhcmdldC5fY29sb3JCdWZmZXI7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY29sb3JCdWZmZXIuaW1wbC5fZ2xUZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckJ1ZmZlci5pbXBsLmluaXRpYWxpemUoZGV2aWNlLCBjb2xvckJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBjb3B5IGZyYW1lYnVmZmVyIHRvIGl0XG4gICAgICAgICAgICAgICAgICAgIGRldmljZS5iaW5kVGV4dHVyZShjb2xvckJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdsID0gZGV2aWNlLmdsO1xuICAgICAgICAgICAgICAgICAgICBnbC5jb3B5VGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBjb2xvckJ1ZmZlci5pbXBsLl9nbEZvcm1hdCwgMCwgMCwgY29sb3JCdWZmZXIud2lkdGgsIGNvbG9yQnVmZmVyLmhlaWdodCwgMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc3RvcCB0aGUgZGV2aWNlIGZyb20gdXBkYXRpbmcgdGhpcyB0ZXh0dXJlIGZ1cnRoZXJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JCdWZmZXIuX25lZWRzVXBsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQnVmZmVyLl9uZWVkc01pcG1hcHNVcGxvYWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBEZWJ1Z0dyYXBoaWNzLnBvcEdwdU1hcmtlcihkZXZpY2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGFzc2lnbiB1bmlmcm9tXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0dXBVbmlmb3JtKGRldmljZSwgZmFsc2UsIGNvbG9yQnVmZmVyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY2FtZXJhLnJlbmRlclNjZW5lRGVwdGhNYXApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXNzaWduIHVuaWZyb21cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXR1cFVuaWZvcm0oZGV2aWNlLCB0cnVlLCB0aGlzLmRlcHRoUmVuZGVyVGFyZ2V0LmNvbG9yQnVmZmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbkRyYXdDYWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gd3JpdGluZyBkZXB0aCB0byBjb2xvciByZW5kZXIgdGFyZ2V0LCBmb3JjZSBubyBibGVuZGluZyBhbmQgd3JpdGluZyB0byBhbGwgY2hhbm5lbHNcbiAgICAgICAgICAgICAgICBkZXZpY2Uuc2V0QmxlbmRTdGF0ZShCbGVuZFN0YXRlLkRFRkFVTFQpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25Qb3N0UmVuZGVyT3BhcXVlOiBmdW5jdGlvbiAoY2FtZXJhUGFzcykge1xuXG4gICAgICAgICAgICAgICAgLyoqIEB0eXBlIHtpbXBvcnQoJy4uLy4uL2ZyYW1ld29yay9jb21wb25lbnRzL2NhbWVyYS9jb21wb25lbnQuanMnKS5DYW1lcmFDb21wb25lbnR9ICovXG4gICAgICAgICAgICAgICAgY29uc3QgY2FtZXJhID0gdGhpcy5jYW1lcmFzW2NhbWVyYVBhc3NdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNhbWVyYS5yZW5kZXJTY2VuZURlcHRoTWFwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGp1c3QgY2xlYXIgdGhlIGxpc3Qgb2YgdmlzaWJsZSBvYmplY3RzIHRvIGF2b2lkIGtlZXBpbmcgcmVmZXJlbmNlc1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2aXNpYmxlT2JqZWN0cyA9IHRoaXMuaW5zdGFuY2VzLnZpc2libGVPcGFxdWVbY2FtZXJhUGFzc107XG4gICAgICAgICAgICAgICAgICAgIHZpc2libGVPYmplY3RzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBmdW5jdGlvbiB3aGljaCBwYXRjaGVzIGEgbGF5ZXIgdG8gdXNlIGRlcHRoIGxheWVyIHNldCB1cCBpbiB0aGlzIGNsYXNzXG4gICAgcGF0Y2gobGF5ZXIpIHtcblxuICAgICAgICBsYXllci5vbkVuYWJsZSA9IHRoaXMubGF5ZXIub25FbmFibGU7XG4gICAgICAgIGxheWVyLm9uRGlzYWJsZSA9IHRoaXMubGF5ZXIub25EaXNhYmxlO1xuICAgICAgICBsYXllci5vblByZVJlbmRlck9wYXF1ZSA9IHRoaXMubGF5ZXIub25QcmVSZW5kZXJPcGFxdWU7XG4gICAgICAgIGxheWVyLm9uUG9zdFJlbmRlck9wYXF1ZSA9IHRoaXMubGF5ZXIub25Qb3N0UmVuZGVyT3BhcXVlO1xuICAgICAgICBsYXllci5zaGFkZXJQYXNzID0gdGhpcy5sYXllci5zaGFkZXJQYXNzO1xuICAgICAgICBsYXllci5vblBvc3RDdWxsID0gdGhpcy5sYXllci5vblBvc3RDdWxsO1xuICAgICAgICBsYXllci5vbkRyYXdDYWxsID0gdGhpcy5sYXllci5vbkRyYXdDYWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgU2NlbmVHcmFiIH07XG4iXSwibmFtZXMiOlsiX2RlcHRoVW5pZm9ybU5hbWVzIiwiX2NvbG9yVW5pZm9ybU5hbWVzIiwiU2NlbmVHcmFiIiwiY29uc3RydWN0b3IiLCJkZXZpY2UiLCJzY2VuZSIsIkRlYnVnIiwiYXNzZXJ0IiwibGF5ZXIiLCJ3ZWJnbDIiLCJpc1dlYkdQVSIsImluaXRNYWluUGF0aCIsImluaXRGYWxsYmFja1BhdGgiLCJyZXF1aXJlc1JlbmRlclBhc3MiLCJjYW1lcmEiLCJyZW5kZXJTY2VuZURlcHRoTWFwIiwic2V0dXBVbmlmb3JtIiwiZGVwdGgiLCJidWZmZXIiLCJuYW1lcyIsImZvckVhY2giLCJuYW1lIiwic2NvcGUiLCJyZXNvbHZlIiwic2V0VmFsdWUiLCJhbGxvY2F0ZVRleHR1cmUiLCJzb3VyY2UiLCJmb3JtYXQiLCJpc0RlcHRoIiwibWlwbWFwcyIsIlRleHR1cmUiLCJ3aWR0aCIsImNvbG9yQnVmZmVyIiwiaGVpZ2h0IiwibWluRmlsdGVyIiwiRklMVEVSX05FQVJFU1QiLCJGSUxURVJfTElORUFSX01JUE1BUF9MSU5FQVIiLCJGSUxURVJfTElORUFSIiwibWFnRmlsdGVyIiwiYWRkcmVzc1UiLCJBRERSRVNTX0NMQU1QX1RPX0VER0UiLCJhZGRyZXNzViIsImdldFNvdXJjZUNvbG9yRm9ybWF0IiwidGV4dHVyZSIsIl90ZXh0dXJlJGZvcm1hdCIsImZyYW1lYnVmZmVyRm9ybWF0Iiwic2hvdWxkUmVhbGxvY2F0ZSIsInRhcmdldFJUIiwic291cmNlVGV4dHVyZSIsInRlc3RGb3JtYXQiLCJ0YXJnZXRGb3JtYXQiLCJzb3VyY2VGb3JtYXQiLCJhbGxvY2F0ZVJlbmRlclRhcmdldCIsInJlbmRlclRhcmdldCIsInNvdXJjZVJlbmRlclRhcmdldCIsImlzRGVwdGhVbmlmb3JtcyIsImRlc3Ryb3lGcmFtZUJ1ZmZlcnMiLCJfZGVwdGhCdWZmZXIiLCJfY29sb3JCdWZmZXIiLCJSZW5kZXJUYXJnZXQiLCJkZXB0aEJ1ZmZlciIsInN0ZW5jaWwiLCJzdXBwb3J0c1N0ZW5jaWwiLCJhdXRvUmVzb2x2ZSIsInJlbGVhc2VSZW5kZXJUYXJnZXQiLCJydCIsImRlc3Ryb3lUZXh0dXJlQnVmZmVycyIsImRlc3Ryb3kiLCJzZWxmIiwiTGF5ZXIiLCJlbmFibGVkIiwiaWQiLCJMQVlFUklEX0RFUFRIIiwib25EaXNhYmxlIiwiZGVwdGhSZW5kZXJUYXJnZXQiLCJjb2xvclJlbmRlclRhcmdldCIsIm9uUHJlUmVuZGVyT3BhcXVlIiwiY2FtZXJhUGFzcyIsImNhbWVyYXMiLCJyZW5kZXJTY2VuZUNvbG9yTWFwIiwiX2NhbWVyYSRyZW5kZXJUYXJnZXQiLCJfY2FtZXJhJHJlbmRlclRhcmdldDIiLCJEZWJ1Z0dyYXBoaWNzIiwicHVzaEdwdU1hcmtlciIsImNvcHlSZW5kZXJUYXJnZXQiLCJhY3RpdmVUZXh0dXJlIiwibWF4Q29tYmluZWRUZXh0dXJlcyIsImJpbmRUZXh0dXJlIiwiZ2wiLCJnZW5lcmF0ZU1pcG1hcCIsImltcGwiLCJfZ2xUYXJnZXQiLCJwb3BHcHVNYXJrZXIiLCJfY2FtZXJhJHJlbmRlclRhcmdldDMiLCJQSVhFTEZPUk1BVF9ERVBUSFNURU5DSUwiLCJvblBvc3RSZW5kZXJPcGFxdWUiLCJzaGFkZXJQYXNzIiwiU0hBREVSX0RFUFRIIiwib25FbmFibGUiLCJncmFwaGljc0RldmljZSIsIm9uUG9zdEN1bGwiLCJfY2FtZXJhJHJlbmRlclRhcmdldDQiLCJQSVhFTEZPUk1BVF9SR0JBOCIsInZpc2libGVPYmplY3RzIiwiaW5zdGFuY2VzIiwidmlzaWJsZU9wYXF1ZSIsInZpc2libGVMaXN0IiwibGlzdCIsImxheWVyQ29tcG9zaXRpb24iLCJsYXllcnMiLCJzdWJMYXllckVuYWJsZWQiLCJpc1RyYW5zcGFyZW50Iiwic3ViTGF5ZXJMaXN0IiwiZ2V0TGF5ZXJCeUlkIiwiTEFZRVJJRF9XT1JMRCIsInZpc2libGVMZW5ndGgiLCJsYXllckxpc3QiLCJpIiwibGVuZ3RoIiwibGF5ZXJDYW1JZCIsImluZGV4T2YiLCJ0cmFuc3BhcmVudCIsImxheWVyVmlzaWJsZUxpc3QiLCJ2aXNpYmxlVHJhbnNwYXJlbnQiLCJsYXllclZpc2libGVMaXN0TGVuZ3RoIiwiaiIsImRyYXdDYWxsIiwibWF0ZXJpYWwiLCJkZXB0aFdyaXRlIiwiX25vRGVwdGhEcmF3R2wxIiwiX2NhbWVyYSRyZW5kZXJUYXJnZXQ1IiwiX2NhbWVyYSRyZW5kZXJUYXJnZXQ2IiwiX2dsVGV4dHVyZSIsImluaXRpYWxpemUiLCJjb3B5VGV4SW1hZ2UyRCIsIlRFWFRVUkVfMkQiLCJfZ2xGb3JtYXQiLCJfbmVlZHNVcGxvYWQiLCJfbmVlZHNNaXBtYXBzVXBsb2FkIiwib25EcmF3Q2FsbCIsInNldEJsZW5kU3RhdGUiLCJCbGVuZFN0YXRlIiwiREVGQVVMVCIsInBhdGNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQW9CQTtBQUNBLE1BQU1BLGtCQUFrQixHQUFHLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUE7QUFDMUQsTUFBTUMsa0JBQWtCLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFBOztBQUVqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU1DLFNBQVMsQ0FBQztBQUNaO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLFdBQVdBLENBQUNDLE1BQU0sRUFBRUMsS0FBSyxFQUFFO0FBRXZCQyxJQUFBQSxLQUFLLENBQUNDLE1BQU0sQ0FBQ0YsS0FBSyxDQUFDLENBQUE7SUFDbkIsSUFBSSxDQUFDQSxLQUFLLEdBQUdBLEtBQUssQ0FBQTtBQUVsQkMsSUFBQUEsS0FBSyxDQUFDQyxNQUFNLENBQUNILE1BQU0sQ0FBQyxDQUFBO0lBQ3BCLElBQUksQ0FBQ0EsTUFBTSxHQUFHQSxNQUFNLENBQUE7O0FBRXBCO0lBQ0EsSUFBSSxDQUFDSSxLQUFLLEdBQUcsSUFBSSxDQUFBOztBQUVqQjtBQUNBO0lBQ0EsSUFBSSxJQUFJLENBQUNKLE1BQU0sQ0FBQ0ssTUFBTSxJQUFJLElBQUksQ0FBQ0wsTUFBTSxDQUFDTSxRQUFRLEVBQUU7TUFDNUMsSUFBSSxDQUFDQyxZQUFZLEVBQUUsQ0FBQTtBQUN2QixLQUFDLE1BQU07TUFDSCxJQUFJLENBQUNDLGdCQUFnQixFQUFFLENBQUE7QUFDM0IsS0FBQTtBQUNKLEdBQUE7O0FBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNJLEVBQUEsT0FBT0Msa0JBQWtCQSxDQUFDVCxNQUFN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
