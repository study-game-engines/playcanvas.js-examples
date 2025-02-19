/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Vec3 } from '../../core/math/vec3.js';
import { random } from '../../core/math/random.js';
import { Color } from '../../core/math/color.js';
import { Entity } from '../entity.js';
import { SHADOW_PCF3 } from '../../scene/constants.js';
import { BakeLight } from './bake-light.js';

const _tempPoint = new Vec3();

// bake light representing an ambient light (cubemap or constant)
class BakeLightAmbient extends BakeLight {
  constructor(scene) {
    const lightEntity = new Entity('AmbientLight');
    lightEntity.addComponent('light', {
      type: 'directional',
      affectDynamic: true,
      affectLightmapped: false,
      bake: true,
      bakeNumSamples: scene.ambientBakeNumSamples,
      castShadows: true,
      normalOffsetBias: 0.05,
      shadowBias: 0.2,
      shadowDistance: 1,
      // this is updated during shadow map rendering
      shadowResolution: 2048,
      shadowType: SHADOW_PCF3,
      color: Color.WHITE,
      intensity: 1,
      bakeDir: false
    });
    super(scene, lightEntity.light.light);
  }
  get numVirtualLights() {
    return this.light.bakeNumSamples;
  }
  prepareVirtualLight(index, numVirtualLights) {
    // directional points down the negative Y-axis
    random.spherePointDeterministic(_tempPoint, index, numVirtualLights, 0, this.scene.ambientBakeSpherePart);
    this.light._node.lookAt(_tempPoint.mulScalar(-1));
    this.light._node.rotateLocal(90, 0, 0);

    // intensity of the virtual light depends on the sphere part used, and also needs to take into account
    // the fact N dot L used to bake it lowers total intensity
    const gamma = this.scene.gammaCorrection ? 2.2 : 1;
    const fullIntensity = 2 * Math.PI * this.scene.ambientBakeSpherePart;
    const linearIntensity = Math.pow(fullIntensity, gamma);
    this.light.intensity = Math.pow(linearIntensity / numVirtualLights, 1 / gamma);
  }
}

export { BakeLightAmbient };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFrZS1saWdodC1hbWJpZW50LmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZnJhbWV3b3JrL2xpZ2h0bWFwcGVyL2Jha2UtbGlnaHQtYW1iaWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBWZWMzIH0gZnJvbSAnLi4vLi4vY29yZS9tYXRoL3ZlYzMuanMnO1xuaW1wb3J0IHsgcmFuZG9tIH0gZnJvbSAnLi4vLi4vY29yZS9tYXRoL3JhbmRvbS5qcyc7XG5pbXBvcnQgeyBDb2xvciB9IGZyb20gJy4uLy4uL2NvcmUvbWF0aC9jb2xvci5qcyc7XG5pbXBvcnQgeyBFbnRpdHkgfSBmcm9tICcuLi9lbnRpdHkuanMnO1xuaW1wb3J0IHsgU0hBRE9XX1BDRjMgfSBmcm9tICcuLi8uLi9zY2VuZS9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgQmFrZUxpZ2h0IH0gZnJvbSAnLi9iYWtlLWxpZ2h0LmpzJztcblxuY29uc3QgX3RlbXBQb2ludCA9IG5ldyBWZWMzKCk7XG5cbi8vIGJha2UgbGlnaHQgcmVwcmVzZW50aW5nIGFuIGFtYmllbnQgbGlnaHQgKGN1YmVtYXAgb3IgY29uc3RhbnQpXG5jbGFzcyBCYWtlTGlnaHRBbWJpZW50IGV4dGVuZHMgQmFrZUxpZ2h0IHtcbiAgICBjb25zdHJ1Y3RvcihzY2VuZSkge1xuXG4gICAgICAgIGNvbnN0IGxpZ2h0RW50aXR5ID0gbmV3IEVudGl0eSgnQW1iaWVudExpZ2h0Jyk7XG4gICAgICAgIGxpZ2h0RW50aXR5LmFkZENvbXBvbmVudCgnbGlnaHQnLCB7XG4gICAgICAgICAgICB0eXBlOiAnZGlyZWN0aW9uYWwnLFxuICAgICAgICAgICAgYWZmZWN0RHluYW1pYzogdHJ1ZSxcbiAgICAgICAgICAgIGFmZmVjdExpZ2h0bWFwcGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGJha2U6IHRydWUsXG4gICAgICAgICAgICBiYWtlTnVtU2FtcGxlczogc2NlbmUuYW1iaWVudEJha2VOdW1TYW1wbGVzLFxuICAgICAgICAgICAgY2FzdFNoYWRvd3M6IHRydWUsXG4gICAgICAgICAgICBub3JtYWxPZmZzZXRCaWFzOiAwLjA1LFxuICAgICAgICAgICAgc2hhZG93QmlhczogMC4yLFxuICAgICAgICAgICAgc2hhZG93RGlzdGFuY2U6IDEsICAvLyB0aGlzIGlzIHVwZGF0ZWQgZHVyaW5nIHNoYWRvdyBtYXAgcmVuZGVyaW5nXG4gICAgICAgICAgICBzaGFkb3dSZXNvbHV0aW9uOiAyMDQ4LFxuICAgICAgICAgICAgc2hhZG93VHlwZTogU0hBRE9XX1BDRjMsXG4gICAgICAgICAgICBjb2xvcjogQ29sb3IuV0hJVEUsXG4gICAgICAgICAgICBpbnRlbnNpdHk6IDEsXG4gICAgICAgICAgICBiYWtlRGlyOiBmYWxzZVxuICAgICAgICB9KTtcblxuICAgICAgICBzdXBlcihzY2VuZSwgbGlnaHRFbnRpdHkubGlnaHQubGlnaHQpO1xuICAgIH1cblxuICAgIGdldCBudW1WaXJ0dWFsTGlnaHRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5saWdodC5iYWtlTnVtU2FtcGxlcztcbiAgICB9XG5cbiAgICBwcmVwYXJlVmlydHVhbExpZ2h0KGluZGV4LCBudW1WaXJ0dWFsTGlnaHRzKSB7XG5cbiAgICAgICAgLy8gZGlyZWN0aW9uYWwgcG9pbnRzIGRvd24gdGhlIG5lZ2F0aXZlIFktYXhpc1xuICAgICAgICByYW5kb20uc3BoZXJlUG9pbnREZXRlcm1pbmlzdGljKF90ZW1wUG9pbnQsIGluZGV4LCBudW1WaXJ0dWFsTGlnaHRzLCAwLCB0aGlzLnNjZW5lLmFtYmllbnRCYWtlU3BoZXJlUGFydCk7XG4gICAgICAgIHRoaXMubGlnaHQuX25vZGUubG9va0F0KF90ZW1wUG9pbnQubXVsU2NhbGFyKC0xKSk7XG4gICAgICAgIHRoaXMubGlnaHQuX25vZGUucm90YXRlTG9jYWwoOTAsIDAsIDApO1xuXG4gICAgICAgIC8vIGludGVuc2l0eSBvZiB0aGUgdmlydHVhbCBsaWdodCBkZXBlbmRzIG9uIHRoZSBzcGhlcmUgcGFydCB1c2VkLCBhbmQgYWxzbyBuZWVkcyB0byB0YWtlIGludG8gYWNjb3VudFxuICAgICAgICAvLyB0aGUgZmFjdCBOIGRvdCBMIHVzZWQgdG8gYmFrZSBpdCBsb3dlcnMgdG90YWwgaW50ZW5zaXR5XG4gICAgICAgIGNvbnN0IGdhbW1hID0gdGhpcy5zY2VuZS5nYW1tYUNvcnJlY3Rpb24gPyAyLjIgOiAxO1xuICAgICAgICBjb25zdCBmdWxsSW50ZW5zaXR5ID0gMiAqIE1hdGguUEkgKiB0aGlzLnNjZW5lLmFtYmllbnRCYWtlU3BoZXJlUGFydDtcbiAgICAgICAgY29uc3QgbGluZWFySW50ZW5zaXR5ID0gTWF0aC5wb3coZnVsbEludGVuc2l0eSwgZ2FtbWEpO1xuICAgICAgICB0aGlzLmxpZ2h0LmludGVuc2l0eSA9IE1hdGgucG93KGxpbmVhckludGVuc2l0eSAvIG51bVZpcnR1YWxMaWdodHMsIDEgLyBnYW1tYSk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBCYWtlTGlnaHRBbWJpZW50IH07XG4iXSwibmFtZXMiOlsiX3RlbXBQb2ludCIsIlZlYzMiLCJCYWtlTGlnaHRBbWJpZW50IiwiQmFrZUxpZ2h0IiwiY29uc3RydWN0b3IiLCJzY2VuZSIsImxpZ2h0RW50aXR5IiwiRW50aXR5IiwiYWRkQ29tcG9uZW50IiwidHlwZSIsImFmZmVjdER5bmFtaWMiLCJhZmZlY3RMaWdodG1hcHBlZCIsImJha2UiLCJiYWtlTnVtU2FtcGxlcyIsImFtYmllbnRCYWtlTnVtU2FtcGxlcyIsImNhc3RTaGFkb3dzIiwibm9ybWFsT2Zmc2V0QmlhcyIsInNoYWRvd0JpYXMiLCJzaGFkb3dEaXN0YW5jZSIsInNoYWRvd1Jlc29sdXRpb24iLCJzaGFkb3dUeXBlIiwiU0hBRE9XX1BDRjMiLCJjb2xvciIsIkNvbG9yIiwiV0hJVEUiLCJpbnRlbnNpdHkiLCJiYWtlRGlyIiwibGlnaHQiLCJudW1WaXJ0dWFsTGlnaHRzIiwicHJlcGFyZVZpcnR1YWxMaWdodCIsImluZGV4IiwicmFuZG9tIiwic3BoZXJlUG9pbnREZXRlcm1pbmlzdGljIiwiYW1iaWVudEJha2VTcGhlcmVQYXJ0IiwiX25vZGUiLCJsb29rQXQiLCJtdWxTY2FsYXIiLCJyb3RhdGVMb2NhbCIsImdhbW1hIiwiZ2FtbWFDb3JyZWN0aW9uIiwiZnVsbEludGVuc2l0eSIsIk1hdGgiLCJQSSIsImxpbmVhckludGVuc2l0eSIsInBvdyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsTUFBTUEsVUFBVSxHQUFHLElBQUlDLElBQUksRUFBRSxDQUFBOztBQUU3QjtBQUNBLE1BQU1DLGdCQUFnQixTQUFTQyxTQUFTLENBQUM7RUFDckNDLFdBQVdBLENBQUNDLEtBQUssRUFBRTtBQUVmLElBQUEsTUFBTUMsV0FBVyxHQUFHLElBQUlDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUM5Q0QsSUFBQUEsV0FBVyxDQUFDRSxZQUFZLENBQUMsT0FBTyxFQUFFO0FBQzlCQyxNQUFBQSxJQUFJLEVBQUUsYUFBYTtBQUNuQkMsTUFBQUEsYUFBYSxFQUFFLElBQUk7QUFDbkJDLE1BQUFBLGlCQUFpQixFQUFFLEtBQUs7QUFDeEJDLE1BQUFBLElBQUksRUFBRSxJQUFJO01BQ1ZDLGNBQWMsRUFBRVIsS0FBSyxDQUFDUyxxQkFBcUI7QUFDM0NDLE1BQUFBLFdBQVcsRUFBRSxJQUFJO0FBQ2pCQyxNQUFBQSxnQkFBZ0IsRUFBRSxJQUFJO0FBQ3RCQyxNQUFBQSxVQUFVLEVBQUUsR0FBRztBQUNmQyxNQUFBQSxjQUFjLEVBQUUsQ0FBQztBQUFHO0FBQ3BCQyxNQUFBQSxnQkFBZ0IsRUFBRSxJQUFJO0FBQ3RCQyxNQUFBQSxVQUFVLEVBQUVDLFdBQVc7TUFDdkJDLEtBQUssRUFBRUMsS0FBSyxDQUFDQyxLQUFLO0FBQ2xCQyxNQUFBQSxTQUFTLEVBQUUsQ0FBQztBQUNaQyxNQUFBQSxPQUFPLEVBQUUsS0FBQTtBQUNiLEtBQUMsQ0FBQyxDQUFBO0lBRUYsS0FBSyxDQUFDckIsS0FBSyxFQUFFQyxXQUFXLENBQUNxQixLQUFLLENBQUNBLEtBQUssQ0FBQyxDQUFBO0FBQ3pDLEdBQUE7RUFFQSxJQUFJQyxnQkFBZ0JBLEdBQUc7QUFDbkIsSUFBQSxPQUFPLElBQUksQ0FBQ0QsS0FBSyxDQUFDZCxjQUFjLENBQUE7QUFDcEMsR0FBQTtBQUVBZ0IsRUFBQUEsbUJBQW1CQSxDQUFDQyxLQUFLLEVBQUVGLGdCQUFnQixFQUFFO0FBRXpDO0FBQ0FHLElBQUFBLE1BQU0sQ0FBQ0Msd0JBQXdCLENBQUNoQyxVQUFVLEVBQUU4QixLQUFLLEVBQUVGLGdCQUFnQixFQUFFLENBQUMsRUFBRSxJQUFJLENBQUN2QixLQUFLLENBQUM0QixxQkFBcUIsQ0FBQyxDQUFBO0FBQ3pHLElBQUEsSUFBSSxDQUFDTixLQUFLLENBQUNPLEtBQUssQ0FBQ0MsTUFBTSxDQUFDbkMsVUFBVSxDQUFDb0MsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNqRCxJQUFBLElBQUksQ0FBQ1QsS0FBSyxDQUFDTyxLQUFLLENBQUNHLFdBQVcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBOztBQUV0QztBQUNBO0lBQ0EsTUFBTUMsS0FBSyxHQUFHLElBQUksQ0FBQ2pDLEtBQUssQ0FBQ2tDLGVBQWUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFBO0FBQ2xELElBQUEsTUFBTUMsYUFBYSxHQUFHLENBQUMsR0FBR0MsSUFBSSxDQUFDQyxFQUFFLEdBQUcsSUFBSSxDQUFDckMsS0FBSyxDQUFDNEIscUJBQXFCLENBQUE7SUFDcEUsTUFBTVUsZUFBZSxHQUFHRixJQUFJLENBQUNHLEdBQUcsQ0FBQ0osYUFBYSxFQUFFRixLQUFLLENBQUMsQ0FBQTtBQUN0RCxJQUFBLElBQUksQ0FBQ1gsS0FBSyxDQUFDRixTQUFTLEdBQUdnQixJQUFJLENBQUNHLEdBQUcsQ0FBQ0QsZUFBZSxHQUFHZixnQkFBZ0IsRUFBRSxDQUFDLEdBQUdVLEtBQUssQ0FBQyxDQUFBO0FBQ2xGLEdBQUE7QUFDSjs7OzsifQ==
