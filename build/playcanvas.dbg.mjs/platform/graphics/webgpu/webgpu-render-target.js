/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Debug, DebugHelper } from '../../../core/debug.js';
import { WebgpuDebug } from './webgpu-debug.js';

/**
 * A WebGPU implementation of the RenderTarget.
 *
 * @ignore
 */
class WebgpuRenderTarget {
  /** @type {boolean} */

  /** @type {string} */

  /**
   * Unique key used by render pipeline creation
   *
   * @type {string}
   */

  /** @type {string} */

  /** @type {boolean} */

  /**
   * @type {GPUTexture}
   * @private
   */

  /**
   * @type {GPUTexture}
   * @private
   */

  /**
   * True if the depthTexture is internally allocated / owned
   *
   * @type {boolean}
   */

  /**
   * Texture assigned each frame, and not owned by this render target. This is used on the
   * framebuffer to assign per frame texture obtained from the context.
   *
   * @type {GPUTexture}
   * @private
   */

  /**
   * Render pass descriptor used when starting a render pass for this render target.
   *
   * @type {GPURenderPassDescriptor}
   * @private
   */

  /**
   * @param {import('../render-target.js').RenderTarget} renderTarget - The render target owning
   * this implementation.
   */
  constructor(renderTarget) {
    this.initialized = false;
    this.colorFormat = void 0;
    this.key = void 0;
    this.depthFormat = void 0;
    this.hasStencil = void 0;
    this.multisampledColorBuffer = void 0;
    this.depthTexture = null;
    this.depthTextureInternal = false;
    this.assignedColorTexture = null;
    this.renderPassDescriptor = {};
    this.renderTarget = renderTarget;

    // color format is based on the texture
    if (renderTarget.colorBuffer) {
      this.colorFormat = renderTarget.colorBuffer.impl.format;
    }
    this.updateKey();
  }

  /**
   * Release associated resources. Note that this needs to leave this instance in a state where
   * it can be re-initialized again, which is used by render target resizing.
   *
   * @param {import('../webgpu/webgpu-graphics-device.js').WebgpuGraphicsDevice} device - The
   * graphics device.
   */
  destroy(device) {
    var _this$multisampledCol;
    this.initialized = false;
    if (this.depthTextureInternal) {
      var _this$depthTexture;
      (_this$depthTexture = this.depthTexture) == null ? void 0 : _this$depthTexture.destroy();
      this.depthTexture = null;
    }
    this.assignedColorTexture = null;
    (_this$multisampledCol = this.multisampledColorBuffer) == null ? void 0 : _this$multisampledCol.destroy();
    this.multisampledColorBuffer = null;
  }
  updateKey() {
    // key used by render pipeline creation
    const rt = this.renderTarget;
    this.key = `${this.colorFormat}-${rt.depth ? this.depthFormat : ''}-${rt.samples}`;
  }
  setDepthFormat(depthFormat) {
    Debug.assert(depthFormat);
    this.depthFormat = depthFormat;
    this.hasStencil = depthFormat === 'depth24plus-stencil8';
  }

  /**
   * Assign a color buffer. This allows the color buffer of the main framebuffer
   * to be swapped each frame to a buffer provided by the context.
   *
   * @param {any} gpuTexture - The color buffer.
   */
  assignColorTexture(gpuTexture) {
    Debug.assert(gpuTexture);
    this.assignedColorTexture = gpuTexture;
    const view = gpuTexture.createView();
    DebugHelper.setLabel(view, 'Framebuffer.assignedColor');

    // use it as render buffer or resolve target
    const colorAttachment = this.renderPassDescriptor.colorAttachments[0];
    const samples = this.renderTarget.samples;
    if (samples > 1) {
      colorAttachment.resolveTarget = view;
    } else {
      colorAttachment.view = view;
    }

    // for main framebuffer, this is how the format is obtained
    this.colorFormat = gpuTexture.format;
    this.updateKey();
  }

  /**
   * Initialize render target for rendering one time.
   *
   * @param {import('../webgpu/webgpu-graphics-device.js').WebgpuGraphicsDevice} device - The
   * graphics device.
   * @param {import('../render-target.js').RenderTarget} renderTarget - The render target.
   */
  init(device, renderTarget) {
    Debug.assert(!this.initialized);
    const wgpu = device.wgpu;
    WebgpuDebug.memory(device);
    WebgpuDebug.validate(device);
    const {
      samples,
      width,
      height,
      depth,
      depthBuffer
    } = renderTarget;

    // depth buffer that we render to (single or multi-sampled). We don't create resolve
    // depth buffer as we don't currently resolve it. This might need to change in the future.
    if (depth || depthBuffer) {
      // allocate depth buffer if not provided
      if (!depthBuffer) {
        // TODO: support rendering to 32bit depth without a stencil as well
        this.setDepthFormat('depth24plus-stencil8');

        /** @type {GPUTextureDescriptor} */
        const depthTextureDesc = {
          size: [width, height, 1],
          dimension: '2d',
          sampleCount: samples,
          format: this.depthFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT
        };

        // single sampled depth buffer can be copied out (grab pass), multisampled cannot
        // TODO: we should not enable this for shadow maps, as this is not needed it
        if (samples <= 1) {
          depthTextureDesc.usage |= GPUTextureUsage.COPY_SRC;
        }

        // allocate depth buffer
        this.depthTexture = wgpu.createTexture(depthTextureDesc);
        this.depthTextureInternal = true;
      } else {
        // use provided depth buffer
        this.depthTexture = depthBuffer.impl.gpuTexture;
        this.setDepthFormat(depthBuffer.impl.format);
      }
      Debug.assert(this.depthTexture);
      DebugHelper.setLabel(this.depthTexture, `${renderTarget.name}.depthTexture`);

      // @type {GPURenderPassDepthStencilAttachment}
      this.renderPassDescriptor.depthStencilAttachment = {
        view: this.depthTexture.createView()
      };
    }

    // Single-sampled color buffer gets passed in:
    // - for normal render target, constructor takes the color buffer as an option
    // - for the main framebuffer, the device supplies the buffer each frame
    // And so we only need to create multi-sampled color buffer if needed here.
    /** @type {GPURenderPassColorAttachment} */
    const colorAttachment = {};
    this.renderPassDescriptor.colorAttachments = [];
    const colorBuffer = renderTarget.colorBuffer;
    let colorView = null;
    if (colorBuffer) {
      colorView = colorBuffer.impl.getView(device);

      // cubemap face view - face is a single 2d array layer in order [+X, -X, +Y, -Y, +Z, -Z]
      if (colorBuffer.cubemap) {
        colorView = colorBuffer.impl.createView({
          dimension: '2d',
          baseArrayLayer: renderTarget.face,
          arrayLayerCount: 1
        });
      }
    }

    // multi-sampled color buffer
    if (samples > 1) {
      /** @type {GPUTextureDescriptor} */
      const multisampledTextureDesc = {
        size: [width, height, 1],
        dimension: '2d',
        sampleCount: samples,
        format: this.colorFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      };

      // allocate multi-sampled color buffer
      this.multisampledColorBuffer = wgpu.createTexture(multisampledTextureDesc);
      DebugHelper.setLabel(this.multisampledColorBuffer, `${renderTarget.name}.multisampledColor`);
      colorAttachment.view = this.multisampledColorBuffer.createView();
      DebugHelper.setLabel(colorAttachment.view, `${renderTarget.name}.multisampledColorView`);
      colorAttachment.resolveTarget = colorView;
    } else {
      colorAttachment.view = colorView;
    }

    // if we have color a buffer, or at least a format (main framebuffer that gets assigned later)
    if (colorAttachment.view || this.colorFormat) {
      this.renderPassDescriptor.colorAttachments.push(colorAttachment);
    }
    this.initialized = true;
    WebgpuDebug.end(device, {
      renderTarget
    });
    WebgpuDebug.end(device, {
      renderTarget
    });
  }

  /**
   * Update WebGPU render pass descriptor by RenderPass settings.
   *
   * @param {import('../render-pass.js').RenderPass} renderPass - The render pass to start.
   */
  setupForRenderPass(renderPass) {
    var _this$renderPassDescr;
    Debug.assert(this.renderPassDescriptor);
    const colorAttachment = (_this$renderPassDescr = this.renderPassDescriptor.colorAttachments) == null ? void 0 : _this$renderPassDescr[0];
    if (colorAttachment) {
      colorAttachment.clearValue = renderPass.colorOps.clearValue;
      colorAttachment.loadOp = renderPass.colorOps.clear ? 'clear' : 'load';
      colorAttachment.storeOp = renderPass.colorOps.store ? 'store' : 'discard';
    }
    const depthAttachment = this.renderPassDescriptor.depthStencilAttachment;
    if (depthAttachment) {
      depthAttachment.depthClearValue = renderPass.depthStencilOps.clearDepthValue;
      depthAttachment.depthLoadOp = renderPass.depthStencilOps.clearDepth ? 'clear' : 'load';
      depthAttachment.depthStoreOp = renderPass.depthStencilOps.storeDepth ? 'store' : 'discard';
      depthAttachment.depthReadOnly = false;
      if (this.hasStencil) {
        depthAttachment.stencilClearValue = renderPass.depthStencilOps.clearStencilValue;
        depthAttachment.stencilLoadOp = renderPass.depthStencilOps.clearStencil ? 'clear' : 'load';
        depthAttachment.stencilStoreOp = renderPass.depthStencilOps.storeStencil ? 'store' : 'discard';
        depthAttachment.stencilReadOnly = false;
      }
    }
  }
  loseContext() {
    this.initialized = false;
  }
  resolve(device, target, color, depth) {}
}

export { WebgpuRenderTarget };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViZ3B1LXJlbmRlci10YXJnZXQuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9wbGF0Zm9ybS9ncmFwaGljcy93ZWJncHUvd2ViZ3B1LXJlbmRlci10YXJnZXQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGVidWcsIERlYnVnSGVscGVyIH0gZnJvbSAnLi4vLi4vLi4vY29yZS9kZWJ1Zy5qcyc7XG5pbXBvcnQgeyBXZWJncHVEZWJ1ZyB9IGZyb20gJy4vd2ViZ3B1LWRlYnVnLmpzJztcblxuLyoqXG4gKiBBIFdlYkdQVSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgUmVuZGVyVGFyZ2V0LlxuICpcbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgV2ViZ3B1UmVuZGVyVGFyZ2V0IHtcbiAgICAvKiogQHR5cGUge2Jvb2xlYW59ICovXG4gICAgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgIGNvbG9yRm9ybWF0O1xuXG4gICAgLyoqXG4gICAgICogVW5pcXVlIGtleSB1c2VkIGJ5IHJlbmRlciBwaXBlbGluZSBjcmVhdGlvblxuICAgICAqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBrZXk7XG5cbiAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICBkZXB0aEZvcm1hdDtcblxuICAgIC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cbiAgICBoYXNTdGVuY2lsO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0dQVVRleHR1cmV9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBtdWx0aXNhbXBsZWRDb2xvckJ1ZmZlcjtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtHUFVUZXh0dXJlfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZGVwdGhUZXh0dXJlID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRydWUgaWYgdGhlIGRlcHRoVGV4dHVyZSBpcyBpbnRlcm5hbGx5IGFsbG9jYXRlZCAvIG93bmVkXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBkZXB0aFRleHR1cmVJbnRlcm5hbCA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogVGV4dHVyZSBhc3NpZ25lZCBlYWNoIGZyYW1lLCBhbmQgbm90IG93bmVkIGJ5IHRoaXMgcmVuZGVyIHRhcmdldC4gVGhpcyBpcyB1c2VkIG9uIHRoZVxuICAgICAqIGZyYW1lYnVmZmVyIHRvIGFzc2lnbiBwZXIgZnJhbWUgdGV4dHVyZSBvYnRhaW5lZCBmcm9tIHRoZSBjb250ZXh0LlxuICAgICAqXG4gICAgICogQHR5cGUge0dQVVRleHR1cmV9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBhc3NpZ25lZENvbG9yVGV4dHVyZSA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgcGFzcyBkZXNjcmlwdG9yIHVzZWQgd2hlbiBzdGFydGluZyBhIHJlbmRlciBwYXNzIGZvciB0aGlzIHJlbmRlciB0YXJnZXQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7R1BVUmVuZGVyUGFzc0Rlc2NyaXB0b3J9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICByZW5kZXJQYXNzRGVzY3JpcHRvciA9IHt9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL3JlbmRlci10YXJnZXQuanMnKS5SZW5kZXJUYXJnZXR9IHJlbmRlclRhcmdldCAtIFRoZSByZW5kZXIgdGFyZ2V0IG93bmluZ1xuICAgICAqIHRoaXMgaW1wbGVtZW50YXRpb24uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocmVuZGVyVGFyZ2V0KSB7XG4gICAgICAgIHRoaXMucmVuZGVyVGFyZ2V0ID0gcmVuZGVyVGFyZ2V0O1xuXG4gICAgICAgIC8vIGNvbG9yIGZvcm1hdCBpcyBiYXNlZCBvbiB0aGUgdGV4dHVyZVxuICAgICAgICBpZiAocmVuZGVyVGFyZ2V0LmNvbG9yQnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbG9yRm9ybWF0ID0gcmVuZGVyVGFyZ2V0LmNvbG9yQnVmZmVyLmltcGwuZm9ybWF0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVLZXkoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWxlYXNlIGFzc29jaWF0ZWQgcmVzb3VyY2VzLiBOb3RlIHRoYXQgdGhpcyBuZWVkcyB0byBsZWF2ZSB0aGlzIGluc3RhbmNlIGluIGEgc3RhdGUgd2hlcmVcbiAgICAgKiBpdCBjYW4gYmUgcmUtaW5pdGlhbGl6ZWQgYWdhaW4sIHdoaWNoIGlzIHVzZWQgYnkgcmVuZGVyIHRhcmdldCByZXNpemluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi93ZWJncHUvd2ViZ3B1LWdyYXBoaWNzLWRldmljZS5qcycpLldlYmdwdUdyYXBoaWNzRGV2aWNlfSBkZXZpY2UgLSBUaGVcbiAgICAgKiBncmFwaGljcyBkZXZpY2UuXG4gICAgICovXG4gICAgZGVzdHJveShkZXZpY2UpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgICAgIGlmICh0aGlzLmRlcHRoVGV4dHVyZUludGVybmFsKSB7XG4gICAgICAgICAgICB0aGlzLmRlcHRoVGV4dHVyZT8uZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5kZXB0aFRleHR1cmUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hc3NpZ25lZENvbG9yVGV4dHVyZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5tdWx0aXNhbXBsZWRDb2xvckJ1ZmZlcj8uZGVzdHJveSgpO1xuICAgICAgICB0aGlzLm11bHRpc2FtcGxlZENvbG9yQnVmZmVyID0gbnVsbDtcbiAgICB9XG5cbiAgICB1cGRhdGVLZXkoKSB7XG4gICAgICAgIC8vIGtleSB1c2VkIGJ5IHJlbmRlciBwaXBlbGluZSBjcmVhdGlvblxuICAgICAgICBjb25zdCBydCA9IHRoaXMucmVuZGVyVGFyZ2V0O1xuICAgICAgICB0aGlzLmtleSA9IGAke3RoaXMuY29sb3JGb3JtYXR9LSR7cnQuZGVwdGggPyB0aGlzLmRlcHRoRm9ybWF0IDogJyd9LSR7cnQuc2FtcGxlc31gO1xuICAgIH1cblxuICAgIHNldERlcHRoRm9ybWF0KGRlcHRoRm9ybWF0KSB7XG4gICAgICAgIERlYnVnLmFzc2VydChkZXB0aEZvcm1hdCk7XG4gICAgICAgIHRoaXMuZGVwdGhGb3JtYXQgPSBkZXB0aEZvcm1hdDtcbiAgICAgICAgdGhpcy5oYXNTdGVuY2lsID0gZGVwdGhGb3JtYXQgPT09ICdkZXB0aDI0cGx1cy1zdGVuY2lsOCc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXNzaWduIGEgY29sb3IgYnVmZmVyLiBUaGlzIGFsbG93cyB0aGUgY29sb3IgYnVmZmVyIG9mIHRoZSBtYWluIGZyYW1lYnVmZmVyXG4gICAgICogdG8gYmUgc3dhcHBlZCBlYWNoIGZyYW1lIHRvIGEgYnVmZmVyIHByb3ZpZGVkIGJ5IHRoZSBjb250ZXh0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IGdwdVRleHR1cmUgLSBUaGUgY29sb3IgYnVmZmVyLlxuICAgICAqL1xuICAgIGFzc2lnbkNvbG9yVGV4dHVyZShncHVUZXh0dXJlKSB7XG5cbiAgICAgICAgRGVidWcuYXNzZXJ0KGdwdVRleHR1cmUpO1xuICAgICAgICB0aGlzLmFzc2lnbmVkQ29sb3JUZXh0dXJlID0gZ3B1VGV4dHVyZTtcblxuICAgICAgICBjb25zdCB2aWV3ID0gZ3B1VGV4dHVyZS5jcmVhdGVWaWV3KCk7XG4gICAgICAgIERlYnVnSGVscGVyLnNldExhYmVsKHZpZXcsICdGcmFtZWJ1ZmZlci5hc3NpZ25lZENvbG9yJyk7XG5cbiAgICAgICAgLy8gdXNlIGl0IGFzIHJlbmRlciBidWZmZXIgb3IgcmVzb2x2ZSB0YXJnZXRcbiAgICAgICAgY29uc3QgY29sb3JBdHRhY2htZW50ID0gdGhpcy5yZW5kZXJQYXNzRGVzY3JpcHRvci5jb2xvckF0dGFjaG1lbnRzWzBdO1xuICAgICAgICBjb25zdCBzYW1wbGVzID0gdGhpcy5yZW5kZXJUYXJnZXQuc2FtcGxlcztcbiAgICAgICAgaWYgKHNhbXBsZXMgPiAxKSB7XG4gICAgICAgICAgICBjb2xvckF0dGFjaG1lbnQucmVzb2x2ZVRhcmdldCA9IHZpZXc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb2xvckF0dGFjaG1lbnQudmlldyA9IHZpZXc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3IgbWFpbiBmcmFtZWJ1ZmZlciwgdGhpcyBpcyBob3cgdGhlIGZvcm1hdCBpcyBvYnRhaW5lZFxuICAgICAgICB0aGlzLmNvbG9yRm9ybWF0ID0gZ3B1VGV4dHVyZS5mb3JtYXQ7XG4gICAgICAgIHRoaXMudXBkYXRlS2V5KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSByZW5kZXIgdGFyZ2V0IGZvciByZW5kZXJpbmcgb25lIHRpbWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vd2ViZ3B1L3dlYmdwdS1ncmFwaGljcy1kZXZpY2UuanMnKS5XZWJncHVHcmFwaGljc0RldmljZX0gZGV2aWNlIC0gVGhlXG4gICAgICogZ3JhcGhpY3MgZGV2aWNlLlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9yZW5kZXItdGFyZ2V0LmpzJykuUmVuZGVyVGFyZ2V0fSByZW5kZXJUYXJnZXQgLSBUaGUgcmVuZGVyIHRhcmdldC5cbiAgICAgKi9cbiAgICBpbml0KGRldmljZSwgcmVuZGVyVGFyZ2V0KSB7XG5cbiAgICAgICAgRGVidWcuYXNzZXJ0KCF0aGlzLmluaXRpYWxpemVkKTtcblxuICAgICAgICBjb25zdCB3Z3B1ID0gZGV2aWNlLndncHU7XG5cbiAgICAgICAgV2ViZ3B1RGVidWcubWVtb3J5KGRldmljZSk7XG4gICAgICAgIFdlYmdwdURlYnVnLnZhbGlkYXRlKGRldmljZSk7XG5cbiAgICAgICAgY29uc3QgeyBzYW1wbGVzLCB3aWR0aCwgaGVpZ2h0LCBkZXB0aCwgZGVwdGhCdWZmZXIgfSA9IHJlbmRlclRhcmdldDtcblxuICAgICAgICAvLyBkZXB0aCBidWZmZXIgdGhhdCB3ZSByZW5kZXIgdG8gKHNpbmdsZSBvciBtdWx0aS1zYW1wbGVkKS4gV2UgZG9uJ3QgY3JlYXRlIHJlc29sdmVcbiAgICAgICAgLy8gZGVwdGggYnVmZmVyIGFzIHdlIGRvbid0IGN1cnJlbnRseSByZXNvbHZlIGl0LiBUaGlzIG1pZ2h0IG5lZWQgdG8gY2hhbmdlIGluIHRoZSBmdXR1cmUuXG4gICAgICAgIGlmIChkZXB0aCB8fCBkZXB0aEJ1ZmZlcikge1xuXG4gICAgICAgICAgICAvLyBhbGxvY2F0ZSBkZXB0aCBidWZmZXIgaWYgbm90IHByb3ZpZGVkXG4gICAgICAgICAgICBpZiAoIWRlcHRoQnVmZmVyKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBzdXBwb3J0IHJlbmRlcmluZyB0byAzMmJpdCBkZXB0aCB3aXRob3V0IGEgc3RlbmNpbCBhcyB3ZWxsXG4gICAgICAgICAgICAgICAgdGhpcy5zZXREZXB0aEZvcm1hdCgnZGVwdGgyNHBsdXMtc3RlbmNpbDgnKTtcblxuICAgICAgICAgICAgICAgIC8qKiBAdHlwZSB7R1BVVGV4dHVyZURlc2NyaXB0b3J9ICovXG4gICAgICAgICAgICAgICAgY29uc3QgZGVwdGhUZXh0dXJlRGVzYyA9IHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogW3dpZHRoLCBoZWlnaHQsIDFdLFxuICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb246ICcyZCcsXG4gICAgICAgICAgICAgICAgICAgIHNhbXBsZUNvdW50OiBzYW1wbGVzLFxuICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHRoaXMuZGVwdGhGb3JtYXQsXG4gICAgICAgICAgICAgICAgICAgIHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlRcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gc2luZ2xlIHNhbXBsZWQgZGVwdGggYnVmZmVyIGNhbiBiZSBjb3BpZWQgb3V0IChncmFiIHBhc3MpLCBtdWx0aXNhbXBsZWQgY2Fubm90XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogd2Ugc2hvdWxkIG5vdCBlbmFibGUgdGhpcyBmb3Igc2hhZG93IG1hcHMsIGFzIHRoaXMgaXMgbm90IG5lZWRlZCBpdFxuICAgICAgICAgICAgICAgIGlmIChzYW1wbGVzIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVwdGhUZXh0dXJlRGVzYy51c2FnZSB8PSBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9TUkM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gYWxsb2NhdGUgZGVwdGggYnVmZmVyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXB0aFRleHR1cmUgPSB3Z3B1LmNyZWF0ZVRleHR1cmUoZGVwdGhUZXh0dXJlRGVzYyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXB0aFRleHR1cmVJbnRlcm5hbCA9IHRydWU7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyB1c2UgcHJvdmlkZWQgZGVwdGggYnVmZmVyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXB0aFRleHR1cmUgPSBkZXB0aEJ1ZmZlci5pbXBsLmdwdVRleHR1cmU7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXREZXB0aEZvcm1hdChkZXB0aEJ1ZmZlci5pbXBsLmZvcm1hdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIERlYnVnLmFzc2VydCh0aGlzLmRlcHRoVGV4dHVyZSk7XG4gICAgICAgICAgICBEZWJ1Z0hlbHBlci5zZXRMYWJlbCh0aGlzLmRlcHRoVGV4dHVyZSwgYCR7cmVuZGVyVGFyZ2V0Lm5hbWV9LmRlcHRoVGV4dHVyZWApO1xuXG4gICAgICAgICAgICAvLyBAdHlwZSB7R1BVUmVuZGVyUGFzc0RlcHRoU3RlbmNpbEF0dGFjaG1lbnR9XG4gICAgICAgICAgICB0aGlzLnJlbmRlclBhc3NEZXNjcmlwdG9yLmRlcHRoU3RlbmNpbEF0dGFjaG1lbnQgPSB7XG4gICAgICAgICAgICAgICAgdmlldzogdGhpcy5kZXB0aFRleHR1cmUuY3JlYXRlVmlldygpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2luZ2xlLXNhbXBsZWQgY29sb3IgYnVmZmVyIGdldHMgcGFzc2VkIGluOlxuICAgICAgICAvLyAtIGZvciBub3JtYWwgcmVuZGVyIHRhcmdldCwgY29uc3RydWN0b3IgdGFrZXMgdGhlIGNvbG9yIGJ1ZmZlciBhcyBhbiBvcHRpb25cbiAgICAgICAgLy8gLSBmb3IgdGhlIG1haW4gZnJhbWVidWZmZXIsIHRoZSBkZXZpY2Ugc3VwcGxpZXMgdGhlIGJ1ZmZlciBlYWNoIGZyYW1lXG4gICAgICAgIC8vIEFuZCBzbyB3ZSBvbmx5IG5lZWQgdG8gY3JlYXRlIG11bHRpLXNhbXBsZWQgY29sb3IgYnVmZmVyIGlmIG5lZWRlZCBoZXJlLlxuICAgICAgICAvKiogQHR5cGUge0dQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnR9ICovXG4gICAgICAgIGNvbnN0IGNvbG9yQXR0YWNobWVudCA9IHt9O1xuICAgICAgICB0aGlzLnJlbmRlclBhc3NEZXNjcmlwdG9yLmNvbG9yQXR0YWNobWVudHMgPSBbXTtcblxuICAgICAgICBjb25zdCBjb2xvckJ1ZmZlciA9IHJlbmRlclRhcmdldC5jb2xvckJ1ZmZlcjtcbiAgICAgICAgbGV0IGNvbG9yVmlldyA9IG51bGw7XG4gICAgICAgIGlmIChjb2xvckJ1ZmZlcikge1xuICAgICAgICAgICAgY29sb3JWaWV3ID0gY29sb3JCdWZmZXIuaW1wbC5nZXRWaWV3KGRldmljZSk7XG5cbiAgICAgICAgICAgIC8vIGN1YmVtYXAgZmFjZSB2aWV3IC0gZmFjZSBpcyBhIHNpbmdsZSAyZCBhcnJheSBsYXllciBpbiBvcmRlciBbK1gsIC1YLCArWSwgLVksICtaLCAtWl1cbiAgICAgICAgICAgIGlmIChjb2xvckJ1ZmZlci5jdWJlbWFwKSB7XG4gICAgICAgICAgICAgICAgY29sb3JWaWV3ID0gY29sb3JCdWZmZXIuaW1wbC5jcmVhdGVWaWV3KHtcbiAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uOiAnMmQnLFxuICAgICAgICAgICAgICAgICAgICBiYXNlQXJyYXlMYXllcjogcmVuZGVyVGFyZ2V0LmZhY2UsXG4gICAgICAgICAgICAgICAgICAgIGFycmF5TGF5ZXJDb3VudDogMVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gbXVsdGktc2FtcGxlZCBjb2xvciBidWZmZXJcbiAgICAgICAgaWYgKHNhbXBsZXMgPiAxKSB7XG5cbiAgICAgICAgICAgIC8qKiBAdHlwZSB7R1BVVGV4dHVyZURlc2NyaXB0b3J9ICovXG4gICAgICAgICAgICBjb25zdCBtdWx0aXNhbXBsZWRUZXh0dXJlRGVzYyA9IHtcbiAgICAgICAgICAgICAgICBzaXplOiBbd2lkdGgsIGhlaWdodCwgMV0sXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uOiAnMmQnLFxuICAgICAgICAgICAgICAgIHNhbXBsZUNvdW50OiBzYW1wbGVzLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogdGhpcy5jb2xvckZvcm1hdCxcbiAgICAgICAgICAgICAgICB1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5UXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBhbGxvY2F0ZSBtdWx0aS1zYW1wbGVkIGNvbG9yIGJ1ZmZlclxuICAgICAgICAgICAgdGhpcy5tdWx0aXNhbXBsZWRDb2xvckJ1ZmZlciA9IHdncHUuY3JlYXRlVGV4dHVyZShtdWx0aXNhbXBsZWRUZXh0dXJlRGVzYyk7XG4gICAgICAgICAgICBEZWJ1Z0hlbHBlci5zZXRMYWJlbCh0aGlzLm11bHRpc2FtcGxlZENvbG9yQnVmZmVyLCBgJHtyZW5kZXJUYXJnZXQubmFtZX0ubXVsdGlzYW1wbGVkQ29sb3JgKTtcblxuICAgICAgICAgICAgY29sb3JBdHRhY2htZW50LnZpZXcgPSB0aGlzLm11bHRpc2FtcGxlZENvbG9yQnVmZmVyLmNyZWF0ZVZpZXcoKTtcbiAgICAgICAgICAgIERlYnVnSGVscGVyLnNldExhYmVsKGNvbG9yQXR0YWNobWVudC52aWV3LCBgJHtyZW5kZXJUYXJnZXQubmFtZX0ubXVsdGlzYW1wbGVkQ29sb3JWaWV3YCk7XG5cbiAgICAgICAgICAgIGNvbG9yQXR0YWNobWVudC5yZXNvbHZlVGFyZ2V0ID0gY29sb3JWaWV3O1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGNvbG9yQXR0YWNobWVudC52aWV3ID0gY29sb3JWaWV3O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgd2UgaGF2ZSBjb2xvciBhIGJ1ZmZlciwgb3IgYXQgbGVhc3QgYSBmb3JtYXQgKG1haW4gZnJhbWVidWZmZXIgdGhhdCBnZXRzIGFzc2lnbmVkIGxhdGVyKVxuICAgICAgICBpZiAoY29sb3JBdHRhY2htZW50LnZpZXcgfHwgdGhpcy5jb2xvckZvcm1hdCkge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXNzRGVzY3JpcHRvci5jb2xvckF0dGFjaG1lbnRzLnB1c2goY29sb3JBdHRhY2htZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gICAgICAgIFdlYmdwdURlYnVnLmVuZChkZXZpY2UsIHsgcmVuZGVyVGFyZ2V0IH0pO1xuICAgICAgICBXZWJncHVEZWJ1Zy5lbmQoZGV2aWNlLCB7IHJlbmRlclRhcmdldCB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgV2ViR1BVIHJlbmRlciBwYXNzIGRlc2NyaXB0b3IgYnkgUmVuZGVyUGFzcyBzZXR0aW5ncy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9yZW5kZXItcGFzcy5qcycpLlJlbmRlclBhc3N9IHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgdG8gc3RhcnQuXG4gICAgICovXG4gICAgc2V0dXBGb3JSZW5kZXJQYXNzKHJlbmRlclBhc3MpIHtcblxuICAgICAgICBEZWJ1Zy5hc3NlcnQodGhpcy5yZW5kZXJQYXNzRGVzY3JpcHRvcik7XG5cbiAgICAgICAgY29uc3QgY29sb3JBdHRhY2htZW50ID0gdGhpcy5yZW5kZXJQYXNzRGVzY3JpcHRvci5jb2xvckF0dGFjaG1lbnRzPy5bMF07XG4gICAgICAgIGlmIChjb2xvckF0dGFjaG1lbnQpIHtcbiAgICAgICAgICAgIGNvbG9yQXR0YWNobWVudC5jbGVhclZhbHVlID0gcmVuZGVyUGFzcy5jb2xvck9wcy5jbGVhclZhbHVlO1xuICAgICAgICAgICAgY29sb3JBdHRhY2htZW50LmxvYWRPcCA9IHJlbmRlclBhc3MuY29sb3JPcHMuY2xlYXIgPyAnY2xlYXInIDogJ2xvYWQnO1xuICAgICAgICAgICAgY29sb3JBdHRhY2htZW50LnN0b3JlT3AgPSByZW5kZXJQYXNzLmNvbG9yT3BzLnN0b3JlID8gJ3N0b3JlJyA6ICdkaXNjYXJkJztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlcHRoQXR0YWNobWVudCA9IHRoaXMucmVuZGVyUGFzc0Rlc2NyaXB0b3IuZGVwdGhTdGVuY2lsQXR0YWNobWVudDtcbiAgICAgICAgaWYgKGRlcHRoQXR0YWNobWVudCkge1xuICAgICAgICAgICAgZGVwdGhBdHRhY2htZW50LmRlcHRoQ2xlYXJWYWx1ZSA9IHJlbmRlclBhc3MuZGVwdGhTdGVuY2lsT3BzLmNsZWFyRGVwdGhWYWx1ZTtcbiAgICAgICAgICAgIGRlcHRoQXR0YWNobWVudC5kZXB0aExvYWRPcCA9IHJlbmRlclBhc3MuZGVwdGhTdGVuY2lsT3BzLmNsZWFyRGVwdGggPyAnY2xlYXInIDogJ2xvYWQnO1xuICAgICAgICAgICAgZGVwdGhBdHRhY2htZW50LmRlcHRoU3RvcmVPcCA9IHJlbmRlclBhc3MuZGVwdGhTdGVuY2lsT3BzLnN0b3JlRGVwdGggPyAnc3RvcmUnIDogJ2Rpc2NhcmQnO1xuICAgICAgICAgICAgZGVwdGhBdHRhY2htZW50LmRlcHRoUmVhZE9ubHkgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaGFzU3RlbmNpbCkge1xuICAgICAgICAgICAgICAgIGRlcHRoQXR0YWNobWVudC5zdGVuY2lsQ2xlYXJWYWx1ZSA9IHJlbmRlclBhc3MuZGVwdGhTdGVuY2lsT3BzLmNsZWFyU3RlbmNpbFZhbHVlO1xuICAgICAgICAgICAgICAgIGRlcHRoQXR0YWNobWVudC5zdGVuY2lsTG9hZE9wID0gcmVuZGVyUGFzcy5kZXB0aFN0ZW5jaWxPcHMuY2xlYXJTdGVuY2lsID8gJ2NsZWFyJyA6ICdsb2FkJztcbiAgICAgICAgICAgICAgICBkZXB0aEF0dGFjaG1lbnQuc3RlbmNpbFN0b3JlT3AgPSByZW5kZXJQYXNzLmRlcHRoU3RlbmNpbE9wcy5zdG9yZVN0ZW5jaWwgPyAnc3RvcmUnIDogJ2Rpc2NhcmQnO1xuICAgICAgICAgICAgICAgIGRlcHRoQXR0YWNobWVudC5zdGVuY2lsUmVhZE9ubHkgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxvc2VDb250ZXh0KCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmVzb2x2ZShkZXZpY2UsIHRhcmdldCwgY29sb3IsIGRlcHRoKSB7XG4gICAgfVxufVxuXG5leHBvcnQgeyBXZWJncHVSZW5kZXJUYXJnZXQgfTtcbiJdLCJuYW1lcyI6WyJXZWJncHVSZW5kZXJUYXJnZXQiLCJjb25zdHJ1Y3RvciIsInJlbmRlclRhcmdldCIsImluaXRpYWxpemVkIiwiY29sb3JGb3JtYXQiLCJrZXkiLCJkZXB0aEZvcm1hdCIsImhhc1N0ZW5jaWwiLCJtdWx0aXNhbXBsZWRDb2xvckJ1ZmZlciIsImRlcHRoVGV4dHVyZSIsImRlcHRoVGV4dHVyZUludGVybmFsIiwiYXNzaWduZWRDb2xvclRleHR1cmUiLCJyZW5kZXJQYXNzRGVzY3JpcHRvciIsImNvbG9yQnVmZmVyIiwiaW1wbCIsImZvcm1hdCIsInVwZGF0ZUtleSIsImRlc3Ryb3kiLCJkZXZpY2UiLCJfdGhpcyRtdWx0aXNhbXBsZWRDb2wiLCJfdGhpcyRkZXB0aFRleHR1cmUiLCJydCIsImRlcHRoIiwic2FtcGxlcyIsInNldERlcHRoRm9ybWF0IiwiRGVidWciLCJhc3NlcnQiLCJhc3NpZ25Db2xvclRleHR1cmUiLCJncHVUZXh0dXJlIiwidmlldyIsImNyZWF0ZVZpZXciLCJEZWJ1Z0hlbHBlciIsInNldExhYmVsIiwiY29sb3JBdHRhY2htZW50IiwiY29sb3JBdHRhY2htZW50cyIsInJlc29sdmVUYXJnZXQiLCJpbml0Iiwid2dwdSIsIldlYmdwdURlYnVnIiwibWVtb3J5IiwidmFsaWRhdGUiLCJ3aWR0aCIsImhlaWdodCIsImRlcHRoQnVmZmVyIiwiZGVwdGhUZXh0dXJlRGVzYyIsInNpemUiLCJkaW1lbnNpb24iLCJzYW1wbGVDb3VudCIsInVzYWdlIiwiR1BVVGV4dHVyZVVzYWdlIiwiUkVOREVSX0FUVEFDSE1FTlQiLCJDT1BZX1NSQyIsImNyZWF0ZVRleHR1cmUiLCJuYW1lIiwiZGVwdGhTdGVuY2lsQXR0YWNobWVudCIsImNvbG9yVmlldyIsImdldFZpZXciLCJjdWJlbWFwIiwiYmFzZUFycmF5TGF5ZXIiLCJmYWNlIiwiYXJyYXlMYXllckNvdW50IiwibXVsdGlzYW1wbGVkVGV4dHVyZURlc2MiLCJwdXNoIiwiZW5kIiwic2V0dXBGb3JSZW5kZXJQYXNzIiwicmVuZGVyUGFzcyIsIl90aGlzJHJlbmRlclBhc3NEZXNjciIsImNsZWFyVmFsdWUiLCJjb2xvck9wcyIsImxvYWRPcCIsImNsZWFyIiwic3RvcmVPcCIsInN0b3JlIiwiZGVwdGhBdHRhY2htZW50IiwiZGVwdGhDbGVhclZhbHVlIiwiZGVwdGhTdGVuY2lsT3BzIiwiY2xlYXJEZXB0aFZhbHVlIiwiZGVwdGhMb2FkT3AiLCJjbGVhckRlcHRoIiwiZGVwdGhTdG9yZU9wIiwic3RvcmVEZXB0aCIsImRlcHRoUmVhZE9ubHkiLCJzdGVuY2lsQ2xlYXJWYWx1ZSIsImNsZWFyU3RlbmNpbFZhbHVlIiwic3RlbmNpbExvYWRPcCIsImNsZWFyU3RlbmNpbCIsInN0ZW5jaWxTdG9yZU9wIiwic3RvcmVTdGVuY2lsIiwic3RlbmNpbFJlYWRPbmx5IiwibG9zZUNvbnRleHQiLCJyZXNvbHZlIiwidGFyZ2V0IiwiY29sb3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU1BLGtCQUFrQixDQUFDO0FBQ3JCOztBQUdBOztBQUdBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7O0FBR0k7O0FBR0E7O0FBR0E7QUFDSjtBQUNBO0FBQ0E7O0FBR0k7QUFDSjtBQUNBO0FBQ0E7O0FBR0k7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7QUFHSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0k7QUFDSjtBQUNBO0FBQ0E7RUFDSUMsV0FBV0EsQ0FBQ0MsWUFBWSxFQUFFO0lBQUEsSUExRDFCQyxDQUFBQSxXQUFXLEdBQUcsS0FBSyxDQUFBO0FBQUEsSUFBQSxJQUFBLENBR25CQyxXQUFXLEdBQUEsS0FBQSxDQUFBLENBQUE7QUFBQSxJQUFBLElBQUEsQ0FPWEMsR0FBRyxHQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQUEsSUFBQSxJQUFBLENBR0hDLFdBQVcsR0FBQSxLQUFBLENBQUEsQ0FBQTtBQUFBLElBQUEsSUFBQSxDQUdYQyxVQUFVLEdBQUEsS0FBQSxDQUFBLENBQUE7QUFBQSxJQUFBLElBQUEsQ0FNVkMsdUJBQXVCLEdBQUEsS0FBQSxDQUFBLENBQUE7SUFBQSxJQU12QkMsQ0FBQUEsWUFBWSxHQUFHLElBQUksQ0FBQTtJQUFBLElBT25CQyxDQUFBQSxvQkFBb0IsR0FBRyxLQUFLLENBQUE7SUFBQSxJQVM1QkMsQ0FBQUEsb0JBQW9CLEdBQUcsSUFBSSxDQUFBO0lBQUEsSUFRM0JDLENBQUFBLG9CQUFvQixHQUFHLEVBQUUsQ0FBQTtJQU9yQixJQUFJLENBQUNWLFlBQVksR0FBR0EsWUFB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
