/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { CULLFACE_FRONT } from '../platform/graphics/constants.js';
import { ShaderProcessorOptions } from '../platform/graphics/shader-processor-options.js';
import { SHADER_FORWARDHDR, GAMMA_SRGBHDR, GAMMA_NONE, TONEMAP_LINEAR, LAYERID_SKYBOX } from './constants.js';
import { createBox } from './procedural.js';
import { GraphNode } from './graph-node.js';
import { Material } from './materials/material.js';
import { MeshInstance } from './mesh-instance.js';
import { getProgramLibrary } from './shader-lib/get-program-library.js';
import { skybox } from './shader-lib/programs/skybox.js';

/**
 * A visual representation of the sky.
 *
 * @ignore
 */
class Sky {
  /**
   * Mesh instance representing the visuals of the sky.
   *
   * @type {MeshInstance}
   */

  /**
   * @param {import('../platform/graphics/graphics-device.js').GraphicsDevice} device - The
   * graphics device.
   * @param {import('./scene.js').Scene} scene - The scene owning the sky.
   * @param {import('../platform/graphics/texture.js').Texture} texture - The texture of the sky.
   */
  constructor(device, scene, texture) {
    this.meshInstance = void 0;
    const material = new Material();
    material.getShaderVariant = function (dev, sc, defs, staticLightList, pass, sortedLights, viewUniformFormat, viewBindGroupFormat) {
      const options = texture.cubemap ? {
        type: 'cubemap',
        encoding: texture.encoding,
        useIntensity: scene.skyboxIntensity !== 1 || scene.physicalUnits,
        mip: texture.fixCubemapSeams ? scene.skyboxMip : 0,
        fixSeams: texture.fixCubemapSeams,
        gamma: pass === SHADER_FORWARDHDR ? scene.gammaCorrection ? GAMMA_SRGBHDR : GAMMA_NONE : scene.gammaCorrection,
        toneMapping: pass === SHADER_FORWARDHDR ? TONEMAP_LINEAR : scene.toneMapping
      } : {
        type: 'envAtlas',
        encoding: texture.encoding,
        useIntensity: scene.skyboxIntensity !== 1 || scene.physicalUnits,
        gamma: pass === SHADER_FORWARDHDR ? scene.gammaCorrection ? GAMMA_SRGBHDR : GAMMA_NONE : scene.gammaCorrection,
        toneMapping: pass === SHADER_FORWARDHDR ? TONEMAP_LINEAR : scene.toneMapping
      };
      const processingOptions = new ShaderProcessorOptions(viewUniformFormat, viewBindGroupFormat);
      const library = getProgramLibrary(device);
      library.register('skybox', skybox);
      return library.getProgram('skybox', options, processingOptions);
    };
    if (texture.cubemap) {
      material.setParameter('texture_cubeMap', texture);
    } else {
      material.setParameter('texture_envAtlas', texture);
      material.setParameter('mipLevel', scene._skyboxMip);
    }
    material.cull = CULLFACE_FRONT;
    material.depthWrite = false;
    const skyLayer = scene.layers.getLayerById(LAYERID_SKYBOX);
    if (skyLayer) {
      const node = new GraphNode('Skybox');
      const mesh = createBox(device);
      const meshInstance = new MeshInstance(mesh, material, node);
      this.meshInstance = meshInstance;
      meshInstance.cull = false;
      meshInstance._noDepthDrawGl1 = true;

      // disable picker, the material has custom update shader and does not handle picker variant
      meshInstance.pick = false;
      skyLayer.addMeshInstances([meshInstance]);
      this.skyLayer = skyLayer;
    }
  }
  destroy() {
    if (this.meshInstance) {
      if (this.skyLayer) {
        this.skyLayer.removeMeshInstances([this.meshInstance]);
      }
      this.meshInstance.destroy();
      this.meshInstance = null;
    }
  }
}

export { Sky };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2t5LmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2NlbmUvc2t5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENVTExGQUNFX0ZST05UIH0gZnJvbSAnLi4vcGxhdGZvcm0vZ3JhcGhpY3MvY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IFNoYWRlclByb2Nlc3Nvck9wdGlvbnMgfSBmcm9tICcuLi9wbGF0Zm9ybS9ncmFwaGljcy9zaGFkZXItcHJvY2Vzc29yLW9wdGlvbnMuanMnO1xuXG5pbXBvcnQgeyBHQU1NQV9OT05FLCBHQU1NQV9TUkdCSERSLCBMQVlFUklEX1NLWUJPWCwgU0hBREVSX0ZPUldBUkRIRFIsIFRPTkVNQVBfTElORUFSIH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgY3JlYXRlQm94IH0gZnJvbSAnLi9wcm9jZWR1cmFsLmpzJztcbmltcG9ydCB7IEdyYXBoTm9kZSB9IGZyb20gJy4vZ3JhcGgtbm9kZS5qcyc7XG5pbXBvcnQgeyBNYXRlcmlhbCB9IGZyb20gJy4vbWF0ZXJpYWxzL21hdGVyaWFsLmpzJztcbmltcG9ydCB7IE1lc2hJbnN0YW5jZSB9IGZyb20gJy4vbWVzaC1pbnN0YW5jZS5qcyc7XG5pbXBvcnQgeyBnZXRQcm9ncmFtTGlicmFyeSB9IGZyb20gJy4vc2hhZGVyLWxpYi9nZXQtcHJvZ3JhbS1saWJyYXJ5LmpzJztcbmltcG9ydCB7IHNreWJveCB9IGZyb20gJy4vc2hhZGVyLWxpYi9wcm9ncmFtcy9za3lib3guanMnO1xuXG4vKipcbiAqIEEgdmlzdWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBza3kuXG4gKlxuICogQGlnbm9yZVxuICovXG5jbGFzcyBTa3kge1xuICAgIC8qKlxuICAgICAqIE1lc2ggaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSB2aXN1YWxzIG9mIHRoZSBza3kuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TWVzaEluc3RhbmNlfVxuICAgICAqL1xuICAgIG1lc2hJbnN0YW5jZTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9wbGF0Zm9ybS9ncmFwaGljcy9ncmFwaGljcy1kZXZpY2UuanMnKS5HcmFwaGljc0RldmljZX0gZGV2aWNlIC0gVGhlXG4gICAgICogZ3JhcGhpY3MgZGV2aWNlLlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuL3NjZW5lLmpzJykuU2NlbmV9IHNjZW5lIC0gVGhlIHNjZW5lIG93bmluZyB0aGUgc2t5LlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9wbGF0Zm9ybS9ncmFwaGljcy90ZXh0dXJlLmpzJykuVGV4dHVyZX0gdGV4dHVyZSAtIFRoZSB0ZXh0dXJlIG9mIHRoZSBza3kuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZGV2aWNlLCBzY2VuZSwgdGV4dHVyZSkge1xuXG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gbmV3IE1hdGVyaWFsKCk7XG5cbiAgICAgICAgbWF0ZXJpYWwuZ2V0U2hhZGVyVmFyaWFudCA9IGZ1bmN0aW9uIChkZXYsIHNjLCBkZWZzLCBzdGF0aWNMaWdodExpc3QsIHBhc3MsIHNvcnRlZExpZ2h0cywgdmlld1VuaWZvcm1Gb3JtYXQsIHZpZXdCaW5kR3JvdXBGb3JtYXQpIHtcblxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHRleHR1cmUuY3ViZW1hcCA/IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnY3ViZW1hcCcsXG4gICAgICAgICAgICAgICAgZW5jb2Rpbmc6IHRleHR1cmUuZW5jb2RpbmcsXG4gICAgICAgICAgICAgICAgdXNlSW50ZW5zaXR5OiBzY2VuZS5za3lib3hJbnRlbnNpdHkgIT09IDEgfHwgc2NlbmUucGh5c2ljYWxVbml0cyxcbiAgICAgICAgICAgICAgICBtaXA6IHRleHR1cmUuZml4Q3ViZW1hcFNlYW1zID8gc2NlbmUuc2t5Ym94TWlwIDogMCxcbiAgICAgICAgICAgICAgICBmaXhTZWFtczogdGV4dHVyZS5maXhDdWJlbWFwU2VhbXMsXG4gICAgICAgICAgICAgICAgZ2FtbWE6IChwYXNzID09PSBTSEFERVJfRk9SV0FSREhEUiA/IChzY2VuZS5nYW1tYUNvcnJlY3Rpb24gPyBHQU1NQV9TUkdCSERSIDogR0FNTUFfTk9ORSkgOiBzY2VuZS5nYW1tYUNvcnJlY3Rpb24pLFxuICAgICAgICAgICAgICAgIHRvbmVNYXBwaW5nOiAocGFzcyA9PT0gU0hBREVSX0ZPUldBUkRIRFIgPyBUT05FTUFQX0xJTkVBUiA6IHNjZW5lLnRvbmVNYXBwaW5nKVxuICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnZW52QXRsYXMnLFxuICAgICAgICAgICAgICAgIGVuY29kaW5nOiB0ZXh0dXJlLmVuY29kaW5nLFxuICAgICAgICAgICAgICAgIHVzZUludGVuc2l0eTogc2NlbmUuc2t5Ym94SW50ZW5zaXR5ICE9PSAxIHx8IHNjZW5lLnBoeXNpY2FsVW5pdHMsXG4gICAgICAgICAgICAgICAgZ2FtbWE6IChwYXNzID09PSBTSEFERVJfRk9SV0FSREhEUiA/IChzY2VuZS5nYW1tYUNvcnJlY3Rpb24gPyBHQU1NQV9TUkdCSERSIDogR0FNTUFfTk9ORSkgOiBzY2VuZS5nYW1tYUNvcnJlY3Rpb24pLFxuICAgICAgICAgICAgICAgIHRvbmVNYXBwaW5nOiAocGFzcyA9PT0gU0hBREVSX0ZPUldBUkRIRFIgPyBUT05FTUFQX0xJTkVBUiA6IHNjZW5lLnRvbmVNYXBwaW5nKVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2luZ09wdGlvbnMgPSBuZXcgU2hhZGVyUHJvY2Vzc29yT3B0aW9ucyh2aWV3VW5pZm9ybUZvcm1hdCwgdmlld0JpbmRHcm91cEZvcm1hdCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGxpYnJhcnkgPSBnZXRQcm9ncmFtTGlicmFyeShkZXZpY2UpO1xuICAgICAgICAgICAgbGlicmFyeS5yZWdpc3Rlcignc2t5Ym94Jywgc2t5Ym94KTtcbiAgICAgICAgICAgIHJldHVybiBsaWJyYXJ5LmdldFByb2dyYW0oJ3NreWJveCcsIG9wdGlvbnMsIHByb2Nlc3NpbmdPcHRpb25zKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodGV4dHVyZS5jdWJlbWFwKSB7XG4gICAgICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3RleHR1cmVfY3ViZU1hcCcsIHRleHR1cmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd0ZXh0dXJlX2VudkF0bGFzJywgdGV4dHVyZSk7XG4gICAgICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ21pcExldmVsJywgc2NlbmUuX3NreWJveE1pcCk7XG4gICAgICAgIH1cblxuICAgICAgICBtYXRlcmlhbC5jdWxsID0gQ1VMTEZBQ0VfRlJPTlQ7XG4gICAgICAgIG1hdGVyaWFsLmRlcHRoV3JpdGUgPSBmYWxzZTtcblxuICAgICAgICBjb25zdCBza3lMYXllciA9IHNjZW5lLmxheWVycy5nZXRMYXllckJ5SWQoTEFZRVJJRF9TS1lCT1gpO1xuICAgICAgICBpZiAoc2t5TGF5ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgR3JhcGhOb2RlKCdTa3lib3gnKTtcbiAgICAgICAgICAgIGNvbnN0IG1lc2ggPSBjcmVhdGVCb3goZGV2aWNlKTtcbiAgICAgICAgICAgIGNvbnN0IG1lc2hJbnN0YW5jZSA9IG5ldyBNZXNoSW5zdGFuY2UobWVzaCwgbWF0ZXJpYWwsIG5vZGUpO1xuICAgICAgICAgICAgdGhpcy5tZXNoSW5zdGFuY2UgPSBtZXNoSW5zdGFuY2U7XG5cbiAgICAgICAgICAgIG1lc2hJbnN0YW5jZS5jdWxsID0gZmFsc2U7XG4gICAgICAgICAgICBtZXNoSW5zdGFuY2UuX25vRGVwdGhEcmF3R2wxID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gZGlzYWJsZSBwaWNrZXIsIHRoZSBtYXRlcmlhbCBoYXMgY3VzdG9tIHVwZGF0ZSBzaGFkZXIgYW5kIGRvZXMgbm90IGhhbmRsZSBwaWNrZXIgdmFyaWFudFxuICAgICAgICAgICAgbWVzaEluc3RhbmNlLnBpY2sgPSBmYWxzZTtcblxuICAgICAgICAgICAgc2t5TGF5ZXIuYWRkTWVzaEluc3RhbmNlcyhbbWVzaEluc3RhbmNlXSk7XG4gICAgICAgICAgICB0aGlzLnNreUxheWVyID0gc2t5TGF5ZXI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5tZXNoSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNreUxheWVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5za3lMYXllci5yZW1vdmVNZXNoSW5zdGFuY2VzKFt0aGlzLm1lc2hJbnN0YW5jZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tZXNoSW5zdGFuY2UuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5tZXNoSW5zdGFuY2UgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBTa3kgfTtcbiJdLCJuYW1lcyI6WyJTa3kiLCJjb25zdHJ1Y3RvciIsImRldmljZSIsInNjZW5lIiwidGV4dHVyZSIsIm1lc2hJbnN0YW5jZSIsIm1hdGVyaWFsIiwiTWF0ZXJpYWwiLCJnZXRTaGFkZXJWYXJpYW50IiwiZGV2Iiwic2MiLCJkZWZzIiwic3RhdGljTGlnaHRMaXN0IiwicGFzcyIsInNvcnRlZExpZ2h0cyIsInZpZXdVbmlmb3JtRm9ybWF0Iiwidmlld0JpbmRHcm91cEZvcm1hdCIsIm9wdGlvbnMiLCJjdWJlbWFwIiwidHlwZSIsImVuY29kaW5nIiwidXNlSW50ZW5zaXR5Iiwic2t5Ym94SW50ZW5zaXR5IiwicGh5c2ljYWxVbml0cyIsIm1pcCIsImZpeEN1YmVtYXBTZWFtcyIsInNreWJveE1pcCIsImZpeFNlYW1zIiwiZ2FtbWEiLCJTSEFERVJfRk9SV0FSREhEUiIsImdhbW1hQ29ycmVjdGlvbiIsIkdBTU1BX1NSR0JIRFIiLCJHQU1NQV9OT05FIiwidG9uZU1hcHBpbmciLCJUT05FTUFQX0xJTkVBUiIsInByb2Nlc3NpbmdPcHRpb25zIiwiU2hhZGVyUHJvY2Vzc29yT3B0aW9ucyIsImxpYnJhcnkiLCJnZXRQcm9ncmFtTGlicmFyeSIsInJlZ2lzdGVyIiwic2t5Ym94IiwiZ2V0UHJvZ3JhbSIsInNldFBhcmFtZXRlciIsIl9za3lib3hNaXAiLCJjdWxsIiwiQ1VMTEZBQ0VfRlJPTlQiLCJkZXB0aFdyaXRlIiwic2t5TGF5ZXIiLCJsYXllcnMiLCJnZXRMYXllckJ5SWQiLCJMQVlFUklEX1NLWUJPWCIsIm5vZGUiLCJHcmFwaE5vZGUiLCJtZXNoIiwiY3JlYXRlQm94IiwiTWVzaEluc3RhbmNlIiwiX25vRGVwdGhEcmF3R2wxIiwicGljayIsImFkZE1lc2hJbnN0YW5jZXMiLCJkZXN0cm95IiwicmVtb3ZlTWVzaEluc3RhbmNlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU1BLEdBQUcsQ0FBQztBQUNOO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7O0FBR0k7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLFdBQVdBLENBQUNDLE1BQU0sRUFBRUMsS0FBSyxFQUFFQyxPQUFPLEVBQUU7QUFBQSxJQUFBLElBQUEsQ0FScENDLFlBQVksR0FBQSxLQUFBLENBQUEsQ0FBQTtBQVVSLElBQUEsTUFBTUMsUUFBUSxHQUFHLElBQUlDLFFBQVEsRUFBRSxDQUFBO0FBRS9CRCxJQUFBQSxRQUFRLENBQUNFLGdCQUFnQixHQUFHLFVBQVVDLEdBQUcsRUFBRUMsRUFBRSxFQUFFQyxJQUFJLEVBQUVDLGVBQWUsRUFBRUMsSUFBSSxFQUFFQyxZQUFZLEVBQUVDLGlCQUFpQixFQUFFQyxtQkFBbUIsRUFBRTtBQUU5SCxNQUFBLE1BQU1DLE9BQU8sR0FBR2IsT0FBTyxDQUFDYyxPQUFPLEdBQUc7QUFDOUJDLFFBQUFBLElBQUksRUFBRSxTQUFTO1FBQ2ZDLFFBQVEsRUFBRWhCLE9BQU8sQ0FBQ2dCLFFBQVE7UUFDMUJDLFlBQVks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
