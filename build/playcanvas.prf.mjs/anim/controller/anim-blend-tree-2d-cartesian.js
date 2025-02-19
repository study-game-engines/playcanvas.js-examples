/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { Vec2 } from '../../math/vec2.js';
import { math } from '../../math/math.js';
import { AnimBlendTree } from './anim-blend-tree.js';

class AnimBlendTreeCartesian2D extends AnimBlendTree {
  pointDistanceCache(i, j) {
    const pointKey = `${i}${j}`;

    if (!this._pointCache[pointKey]) {
      this._pointCache[pointKey] = this._children[j].point.clone().sub(this._children[i].point);
    }

    return this._pointCache[pointKey];
  }

  calculateWeights() {
    if (this.updateParameterValues()) return;
    let weightSum, weightedDurationSum;

    AnimBlendTreeCartesian2D._p.set(...this._parameterValues);

    weightSum = 0.0;
    weightedDurationSum = 0.0;

    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
      const pi = child.point;

      AnimBlendTreeCartesian2D._pip.set(AnimBlendTreeCartesian2D._p.x, AnimBlendTreeCartesian2D._p.y).sub(pi);

      let minj = Number.MAX_VALUE;

      for (let j = 0; j < this._children.length; j++) {
        if (i === j) continue;
        const pipj = this.pointDistanceCache(i, j);
        const result = math.clamp(1.0 - AnimBlendTreeCartesian2D._pip.dot(pipj) / pipj.lengthSq(), 0.0, 1.0);
        if (result < minj) minj = result;
      }

      child.weight = minj;
      weightSum += minj;

      if (this._syncAnimations) {
        weightedDurationSum += child.animTrack.duration / child.absoluteSpeed * child.weight;
      }
    }

    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
      child.weight = child._weight / weightSum;

      if (this._syncAnimations) {
        child.weightedSpeed = child.animTrack.duration / child.absoluteSpeed / weightedDurationSum;
      }
    }
  }

}

AnimBlendTreeCartesian2D._p = new Vec2();
AnimBlendTreeCartesian2D._pip = new Vec2();

export { AnimBlendTreeCartesian2D };
