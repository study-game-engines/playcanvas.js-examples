/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../../core/debug.js';
import { AnimBlendTree1D } from './anim-blend-tree-1d.js';
import { AnimBlendTreeCartesian2D } from './anim-blend-tree-2d-cartesian.js';
import { AnimBlendTreeDirectional2D } from './anim-blend-tree-2d-directional.js';
import { AnimBlendTreeDirect } from './anim-blend-tree-direct.js';
import { AnimNode } from './anim-node.js';
import { ANIM_BLEND_DIRECT, ANIM_BLEND_2D_DIRECTIONAL, ANIM_BLEND_2D_CARTESIAN, ANIM_BLEND_1D, ANIM_CONTROL_STATES } from './constants.js';

class AnimState {
  constructor(controller, name, speed, loop, blendTree) {
    this._controller = controller;
    this._name = name;
    this._animations = {};
    this._animationList = [];
    this._speed = speed || 1.0;
    this._loop = loop === undefined ? true : loop;

    const findParameter = this._controller.findParameter.bind(this._controller);

    if (blendTree) {
      this._blendTree = this._createTree(blendTree.type, this, null, name, 1.0, blendTree.parameter ? [blendTree.parameter] : blendTree.parameters, blendTree.children, blendTree.syncAnimations, this._createTree, findParameter);
    } else {
      this._blendTree = new AnimNode(this, null, name, 1.0, speed);
    }
  }

  _createTree(type, state, parent, name, point, parameters, children, syncAnimations, createTree, findParameter) {
    switch (type) {
      case ANIM_BLEND_1D:
        return new AnimBlendTree1D(state, parent, name, point, parameters, children, syncAnimations, createTree, findParameter);

      case ANIM_BLEND_2D_CARTESIAN:
        return new AnimBlendTreeCartesian2D(state, parent, name, point, parameters, children, syncAnimations, createTree, findParameter);

      case ANIM_BLEND_2D_DIRECTIONAL:
        return new AnimBlendTreeDirectional2D(state, parent, name, point, parameters, children, syncAnimations, createTree, findParameter);

      case ANIM_BLEND_DIRECT:
        return new AnimBlendTreeDirect(state, parent, name, point, parameters, children, syncAnimations, createTree, findParameter);
    }

    Debug.error(`Invalid anim blend type: ${type}`);
    return undefined;
  }

  _getNodeFromPath(path) {
    let currNode = this._blendTree;

    for (let i = 1; i < path.length; i++) {
      currNode = currNode.getChild(path[i]);
    }

    return currNode;
  }

  addAnimation(path, animTrack) {
    const pathString = path.join('.');

    const indexOfAnimation = this._animationList.findIndex(function (animation) {
      return animation.path === pathString;
    });

    if (indexOfAnimation >= 0) {
      this._animationList[indexOfAnimation].animTrack = animTrack;
    } else {
      const node = this._getNodeFromPath(path);

      node.animTrack = animTrack;

      this._animationList.push(node);
    }
  }

  get name() {
    return this._name;
  }

  set animations(value) {
    this._animationList = value;
  }

  get animations() {
    return this._animationList;
  }

  set speed(value) {
    this._speed = value;
  }

  get speed() {
    return this._speed;
  }

  set loop(value) {
    this._loop = value;
  }

  get loop() {
    return this._loop;
  }

  get nodeCount() {
    if (!this._blendTree || this._blendTree.constructor === AnimNode) return 1;
    return this._blendTree.getNodeCount();
  }

  get playable() {
    return ANIM_CONTROL_STATES.indexOf(this.name) !== -1 || this.animations.length === this.nodeCount;
  }

  get looping() {
    if (this.animations.length > 0) {
      const trackClipName = this.name + '.' + this.animations[0].animTrack.name;

      const trackClip = this._controller.animEvaluator.findClip(trackClipName);

      if (trackClip) {
        return trackClip.loop;
      }
    }

    return false;
  }

  get totalWeight() {
    let sum = 0;

    for (let i = 0; i < this.animations.length; i++) {
      sum += this.animations[i].weight;
    }

    return sum;
  }

  get timelineDuration() {
    let duration = 0;

    for (let i = 0; i < this.animations.length; i++) {
      const animation = this.animations[i];

      if (animation.animTrack.duration > duration) {
        duration = animation.animTrack.duration;
      }
    }

    return duration;
  }

}

export { AnimState };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbS1zdGF0ZS5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FuaW0vY29udHJvbGxlci9hbmltLXN0YXRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERlYnVnIH0gZnJvbSAnLi4vLi4vY29yZS9kZWJ1Zy5qcyc7XG5cbmltcG9ydCB7IEFuaW1CbGVuZFRyZWUxRCB9IGZyb20gJy4vYW5pbS1ibGVuZC10cmVlLTFkLmpzJztcbmltcG9ydCB7IEFuaW1CbGVuZFRyZWVDYXJ0ZXNpYW4yRCB9IGZyb20gJy4vYW5pbS1ibGVuZC10cmVlLTJkLWNhcnRlc2lhbi5qcyc7XG5pbXBvcnQgeyBBbmltQmxlbmRUcmVlRGlyZWN0aW9uYWwyRCB9IGZyb20gJy4vYW5pbS1ibGVuZC10cmVlLTJkLWRpcmVjdGlvbmFsLmpzJztcbmltcG9ydCB7IEFuaW1CbGVuZFRyZWVEaXJlY3QgfSBmcm9tICcuL2FuaW0tYmxlbmQtdHJlZS1kaXJlY3QuanMnO1xuaW1wb3J0IHsgQW5pbU5vZGUgfSBmcm9tICcuL2FuaW0tbm9kZS5qcyc7XG5pbXBvcnQge1xuICAgIEFOSU1fQkxFTkRfMUQsIEFOSU1fQkxFTkRfMkRfQ0FSVEVTSUFOLCBBTklNX0JMRU5EXzJEX0RJUkVDVElPTkFMLCBBTklNX0JMRU5EX0RJUkVDVCwgQU5JTV9DT05UUk9MX1NUQVRFU1xufSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5cbi8qKlxuICogRGVmaW5lcyBhIHNpbmdsZSBzdGF0ZSB0aGF0IHRoZSBjb250cm9sbGVyIGNhbiBiZSBpbi4gRWFjaCBzdGF0ZSBjb250YWlucyBlaXRoZXIgYSBzaW5nbGVcbiAqIEFuaW1Ob2RlIG9yIGEgQW5pbUJsZW5kVHJlZSBvZiBtdWx0aXBsZSBBbmltTm9kZXMsIHdoaWNoIHdpbGwgYmUgdXNlZCB0byBhbmltYXRlIHRoZSBFbnRpdHlcbiAqIHdoaWxlIHRoZSBzdGF0ZSBpcyBhY3RpdmUuIEFuIEFuaW1TdGF0ZSB3aWxsIHN0YXkgYWN0aXZlIGFuZCBwbGF5IGFzIGxvbmcgYXMgdGhlcmUgaXMgbm9cbiAqIEFuaW1UcmFuc2l0aW9uIHdpdGggaXRzIGNvbmRpdGlvbnMgbWV0IHRoYXQgaGFzIHRoYXQgQW5pbVN0YXRlIGFzIGl0cyBzb3VyY2Ugc3RhdGUuXG4gKlxuICogQGlnbm9yZVxuICovXG5jbGFzcyBBbmltU3RhdGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBBbmltU3RhdGUgaW5zdGFuY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FuaW1Db250cm9sbGVyfSBjb250cm9sbGVyIC0gVGhlIGNvbnRyb2xsZXIgdGhpcyBBbmltU3RhdGUgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHN0YXRlLiBVc2VkIHRvIGZpbmQgdGhpcyBzdGF0ZSB3aGVuIHRoZSBjb250cm9sbGVyXG4gICAgICogdHJhbnNpdGlvbnMgYmV0d2VlbiBzdGF0ZXMgYW5kIGxpbmtzIGFuaW1hdGlvbnMuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNwZWVkIC0gVGhlIHNwZWVkIGFuaW1hdGlvbnMgaW4gdGhlIHN0YXRlIHNob3VsZCBwbGF5IGF0LiBJbmRpdmlkdWFsXG4gICAgICoge0BsaW5rIEFuaW1Ob2Rlc30gY2FuIG92ZXJyaWRlIHRoaXMgdmFsdWUuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBsb29wIC0gRGV0ZXJtaW5lcyB3aGV0aGVyIGFuaW1hdGlvbnMgaW4gdGhpcyBzdGF0ZSBzaG91bGQgbG9vcC5cbiAgICAgKiBAcGFyYW0ge29iamVjdHxudWxsfSBibGVuZFRyZWUgLSBJZiBzdXBwbGllZCwgdGhlIEFuaW1TdGF0ZSB3aWxsIHJlY3Vyc2l2ZWx5IGJ1aWxkIGFcbiAgICAgKiB7QGxpbmsgQW5pbUJsZW5kVHJlZX0gaGllcmFyY2h5LCB1c2VkIHRvIHN0b3JlLCBibGVuZCBhbmQgcGxheSBtdWx0aXBsZSBhbmltYXRpb25zLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRyb2xsZXIsIG5hbWUsIHNwZWVkLCBsb29wLCBibGVuZFRyZWUpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLl9hbmltYXRpb25zID0ge307XG4gICAgICAgIHRoaXMuX2FuaW1hdGlvbkxpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5fc3BlZWQgPSBzcGVlZCB8fCAxLjA7XG4gICAgICAgIHRoaXMuX2xvb3AgPSBsb29wID09PSB1bmRlZmluZWQgPyB0cnVlIDogbG9vcDtcbiAgICAgICAgY29uc3QgZmluZFBhcmFtZXRlciA9IHRoaXMuX2NvbnRyb2xsZXIuZmluZFBhcmFtZXRlci5iaW5kKHRoaXMuX2NvbnRyb2xsZXIpO1xuICAgICAgICBpZiAoYmxlbmRUcmVlKSB7XG4gICAgICAgICAgICB0aGlzLl9ibGVuZFRyZWUgPSB0aGlzLl9jcmVhdGVUcmVlKFxuICAgICAgICAgICAgICAgIGJsZW5kVHJlZS50eXBlLFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIDEuMCxcbiAgICAgICAgICAgICAgICBibGVuZFRyZWUucGFyYW1ldGVyID8gW2JsZW5kVHJlZS5wYXJhbWV0ZXJdIDogYmxlbmRUcmVlLnBhcmFtZXRlcnMsXG4gICAgICAgICAgICAgICAgYmxlbmRUcmVlLmNoaWxkcmVuLFxuICAgICAgICAgICAgICAgIGJsZW5kVHJlZS5zeW5jQW5pbWF0aW9ucyxcbiAgICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVUcmVlLFxuICAgICAgICAgICAgICAgIGZpbmRQYXJhbWV0ZXJcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9ibGVuZFRyZWUgPSBuZXcgQW5pbU5vZGUodGhpcywgbnVsbCwgbmFtZSwgMS4wLCBzcGVlZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY3JlYXRlVHJlZSh0eXBlLCBzdGF0ZSwgcGFyZW50LCBuYW1lLCBwb2ludCwgcGFyYW1ldGVycywgY2hpbGRyZW4sIHN5bmNBbmltYXRpb25zLCBjcmVhdGVUcmVlLCBmaW5kUGFyYW1ldGVyKSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBBTklNX0JMRU5EXzFEOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQW5pbUJsZW5kVHJlZTFEKHN0YXRlLCBwYXJlbnQsIG5hbWUsIHBvaW50LCBwYXJhbWV0ZXJzLCBjaGlsZHJlbiwgc3luY0FuaW1hdGlvbnMsIGNyZWF0ZVRyZWUsIGZpbmRQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgY2FzZSBBTklNX0JMRU5EXzJEX0NBUlRFU0lBTjpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFuaW1CbGVuZFRyZWVDYXJ0ZXNpYW4yRChzdGF0ZSwgcGFyZW50LCBuYW1lLCBwb2ludCwgcGFyYW1ldGVycywgY2hpbGRyZW4sIHN5bmNBbmltYXRpb25zLCBjcmVhdGVUcmVlLCBmaW5kUGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGNhc2UgQU5JTV9CTEVORF8yRF9ESVJFQ1RJT05BTDpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFuaW1CbGVuZFRyZWVEaXJlY3Rpb25hbDJEKHN0YXRlLCBwYXJlbnQsIG5hbWUsIHBvaW50LCBwYXJhbWV0ZXJzLCBjaGlsZHJlbiwgc3luY0FuaW1hdGlvbnMsIGNyZWF0ZVRyZWUsIGZpbmRQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgY2FzZSBBTklNX0JMRU5EX0RJUkVDVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFuaW1CbGVuZFRyZWVEaXJlY3Qoc3RhdGUsIHBhcmVudCwgbmFtZSwgcG9pbnQsIHBhcmFtZXRlcnMsIGNoaWxkcmVuLCBzeW5jQW5pbWF0aW9ucywgY3JlYXRlVHJlZSwgZmluZFBhcmFtZXRlcik7XG4gICAgICAgIH1cblxuICAgICAgICBEZWJ1Zy5lcnJvcihgSW52YWxpZCBhbmltIGJsZW5kIHR5cGU6ICR7dHlwZX1gKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBfZ2V0Tm9kZUZyb21QYXRoKHBhdGgpIHtcbiAgICAgICAgbGV0IGN1cnJOb2RlID0gdGhpcy5fYmxlbmRUcmVlO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUuZ2V0Q2hpbGQocGF0aFtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnJOb2RlO1xuICAgIH1cblxuICAgIGFkZEFuaW1hdGlvbihwYXRoLCBhbmltVHJhY2spIHtcbiAgICAgICAgY29uc3QgcGF0aFN0cmluZyA9IHBhdGguam9pbignLicpO1xuICAgICAgICBjb25zdCBpbmRleE9mQW5pbWF0aW9uID0gdGhpcy5fYW5pbWF0aW9uTGlzdC5maW5kSW5kZXgoZnVuY3Rpb24gKGFuaW1hdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGFuaW1hdGlvbi5wYXRoID09PSBwYXRoU3RyaW5nO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGluZGV4T2ZBbmltYXRpb24gPj0gMCkge1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uTGlzdFtpbmRleE9mQW5pbWF0aW9uXS5hbmltVHJhY2sgPSBhbmltVHJhY2s7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fZ2V0Tm9kZUZyb21QYXRoKHBhdGgpO1xuICAgICAgICAgICAgbm9kZS5hbmltVHJhY2sgPSBhbmltVHJhY2s7XG4gICAgICAgICAgICB0aGlzLl9hbmltYXRpb25MaXN0LnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgfVxuXG4gICAgc2V0IGFuaW1hdGlvbnModmFsdWUpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0aW9uTGlzdCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBhbmltYXRpb25zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYW5pbWF0aW9uTGlzdDtcbiAgICB9XG5cbiAgICBzZXQgc3BlZWQodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fc3BlZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgc3BlZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zcGVlZDtcbiAgICB9XG5cbiAgICBzZXQgbG9vcCh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9sb29wID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGxvb3AoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb29wO1xuICAgIH1cblxuICAgIGdldCBub2RlQ291bnQoKSB7XG4gICAgICAgIGlmICghdGhpcy5fYmxlbmRUcmVlIHx8ICh0aGlzLl9ibGVuZFRyZWUuY29uc3RydWN0b3IgPT09IEFuaW1Ob2RlKSkgcmV0dXJuIDE7XG4gICAgICAgIHJldHVybiB0aGlzLl9ibGVuZFRyZWUuZ2V0Tm9kZUNvdW50KCk7XG4gICAgfVxuXG4gICAgZ2V0IHBsYXlhYmxlKCkge1xuICAgICAgICByZXR1cm4gKEFOSU1fQ09OVFJPTF9TVEFURVMuaW5kZXhPZih0aGlzLm5hbWUpICE9PSAtMSB8fCB0aGlzLmFuaW1hdGlvbnMubGVuZ3RoID09PSB0aGlzLm5vZGVDb3VudCk7XG4gICAgfVxuXG4gICAgZ2V0IGxvb3BpbmcoKSB7XG4gICAgICAgIGlmICh0aGlzLmFuaW1hdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgdHJhY2tDbGlwTmFtZSA9IHRoaXMubmFtZSArICcuJyArIHRoaXMuYW5pbWF0aW9uc1swXS5hbmltVHJhY2submFtZTtcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrQ2xpcCA9IHRoaXMuX2NvbnRyb2xsZXIuYW5pbUV2YWx1YXRvci5maW5kQ2xpcCh0cmFja0NsaXBOYW1lKTtcbiAgICAgICAgICAgIGlmICh0cmFja0NsaXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2tDbGlwLmxvb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGdldCB0b3RhbFdlaWdodCgpIHtcbiAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hbmltYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzdW0gKz0gdGhpcy5hbmltYXRpb25zW2ldLndlaWdodDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH1cblxuICAgIGdldCB0aW1lbGluZUR1cmF0aW9uKCkge1xuICAgICAgICBsZXQgZHVyYXRpb24gPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYW5pbWF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYW5pbWF0aW9uID0gdGhpcy5hbmltYXRpb25zW2ldO1xuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbi5hbmltVHJhY2suZHVyYXRpb24gPiBkdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gYW5pbWF0aW9uLmFuaW1UcmFjay5kdXJhdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZHVyYXRpb247XG4gICAgfVxufVxuXG5leHBvcnQgeyBBbmltU3RhdGUgfTtcbiJdLCJuYW1lcyI6WyJBbmltU3RhdGUiLCJjb25zdHJ1Y3RvciIsImNvbnRyb2xsZXIiLCJuYW1lIiwic3BlZWQiLCJsb29wIiwiYmxlbmRUcmVlIiwiX2NvbnRyb2xsZXIiLCJfbmFtZSIsIl9hbmltYXRpb25zIiwiX2FuaW1hdGlvbkxpc3QiLCJfc3BlZWQiLCJfbG9vcCIsInVuZGVmaW5lZCIsImZpbmRQYXJhbWV0ZXIiLCJiaW5kIiwiX2JsZW5kVHJlZSIsIl9jcmVhdGVUcmVlIiwidHlwZSIsInBhcmFtZXRlciIsInBhcmFtZXRlcnMiLCJjaGlsZHJlbiIsInN5bmNBbmltYXRpb25zIiwiQW5pbU5vZGUiLCJzdGF0ZSIsInBhcmVudCIsInBvaW50IiwiY3JlYXRlVHJlZSIsIkFOSU1fQkxFTkRfMUQiLCJBbmltQmxlbmRUcmVlMUQiLCJBTklNX0JMRU5EXzJEX0NBUlRFU0lBTiIsIkFuaW1CbGVuZFRyZWVDYXJ0ZXNpYW4yRCIsIkFOSU1fQkxFTkRfMkRfRElSRUNUSU9OQUwiLCJBbmltQmxlbmRUcmVlRGlyZWN0aW9uYWwyRCIsIkFOSU1fQkxFTkRfRElSRUNUIiwiQW5pbUJsZW5kVHJlZURpcmVjdCIsIkRlYnVnIiwiZXJyb3IiLCJfZ2V0Tm9kZUZyb21QYXRoIiwicGF0aCIsImN1cnJOb2RlIiwiaSIsImxlbmd0aCIsImdldENoaWxkIiwiYWRkQW5pbWF0aW9uIiwiYW5pbVRyYWNrIiwicGF0aFN0cmluZyIsImpvaW4iLCJpbmRleE9mQW5pbWF0aW9uIiwiZmluZEluZGV4IiwiYW5pbWF0aW9uIiwibm9kZSIsInB1c2giLCJhbmltYXRpb25zIiwidmFsdWUiLCJub2RlQ291bnQiLCJnZXROb2RlQ291bnQiLCJwbGF5YWJsZSIsIkFOSU1fQ09OVFJPTF9TVEFURVMiLCJpbmRleE9mIiwibG9vcGluZyIsInRyYWNrQ2xpcE5hbWUiLCJ0cmFja0NsaXAiLCJhbmltRXZhbHVhdG9yIiwiZmluZENsaXAiLCJ0b3RhbFdlaWdodCIsInN1bSIsIndlaWdodCIsInRpbWVsaW5lRHVyYXRpb24iLCJkdXJhdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQW1CQSxNQUFNQSxTQUFOLENBQWdCO0VBYVpDLFdBQVcsQ0FBQ0MsVUFBRCxFQUFhQyxJQUFiLEVBQW1CQyxLQUFuQixFQUEwQkMsSUFBMUIsRUFBZ0NDLFNBQWhDLEVBQTJDO0lBQ2xELElBQUtDLENBQUFBLFdBQUwsR0FBbUJMLFVBQW5CLENBQUE7SUFDQSxJQUFLTSxDQUFBQSxLQUFMLEdBQWFMLElBQWIsQ0FBQTtJQUNBLElBQUtNLENBQUFBLFdBQUwsR0FBbUIsRUFBbkIsQ0FBQTtJQUNBLElBQUtDLENBQUFBLGNBQUwsR0FBc0IsRUFBdEIsQ0FBQTtBQUNBLElBQUEsSUFBQSxDQUFLQyxNQUFMLEdBQWNQLEtBQUssSUFBSSxHQUF2QixDQUFBO0lBQ0EsSUFBS1EsQ0FBQUEsS0FBTCxHQUFhUCxJQUFJLEtBQUtRLFNBQVQsR0FBcUIsSUFBckIsR0FBNEJSLElBQXpDLENBQUE7O0lBQ0EsTUFBTVMsYUFBYSxHQUFHLElBQUEsQ0FBS1AsV0FBTCxDQUFpQk8sYUFBakIsQ0FBK0JDLElBQS9CLENBQW9DLElBQUtSLENBQUFBLFdBQXpDLENBQXRCLENBQUE7O0FBQ0EsSUFBQSxJQUFJRCxTQUFKLEVBQWU7QUFDWCxNQUFBLElBQUEsQ0FBS1UsVUFBTCxHQUFrQixJQUFBLENBQUtDLFdBQUwsQ0FDZFgsU0FBUyxDQUFDWSxJQURJLEVBRWQsSUFGYyxFQUdkLElBSGMsRUFJZGYsSUFKYyxFQUtkLEdBTGMsRUFNZEcsU0FBUyxDQUFDYSxTQUFWLEdBQXNCLENBQUNiLFNBQVMsQ0FBQ2EsU0FBWCxDQUF0QixHQUE4Q2IsU0FBUyxDQUFDYyxVQU4xQyxFQU9kZCxTQUFTLENBQUNlLFFBUEksRUFRZGYsU0FBUyxDQUFDZ0IsY0FSSSxFQVNkLEtBQUtMLFdBVFMsRUFVZEgsYUFWYyxDQUFsQixDQUFBO0FBWUgsS0FiRCxNQWFPO0FBQ0gsTUFBQSxJQUFBLENBQUtFLFVBQUwsR0FBa0IsSUFBSU8sUUFBSixDQUFhLElBQWIsRUFBbUIsSUFBbkIsRUFBeUJwQixJQUF6QixFQUErQixHQUEvQixFQUFvQ0MsS0FBcEMsQ0FBbEIsQ0FBQTtBQUNILEtBQUE7QUFDSixHQUFBOztFQUVEYSxXQUFXLENBQUNDLElBQUQsRUFBT00sS0FBUCxFQUFjQyxNQUFkLEVBQXNCdEIsSUFBdEIsRUFBNEJ1QixLQUE1QixFQUFtQ04sVUFBbkMsRUFBK0NDLFFBQS9DLEVBQXlEQyxjQUF6RCxFQUF5RUssVUFBekUsRUFBcUZiLGFBQXJGLEVBQW9HO0FBQzNHLElBQUEsUUFBUUksSUFBUjtBQUNJLE1BQUEsS0FBS1UsYUFBTDtRQUNJLE9BQU8sSUFBSUMsZUFBSixDQUFvQkwsS0FBcEIsRUFBMkJDLE1BQTNCLEVBQW1DdEIsSUFBbkMsRUFBeUN1QixLQUF6QyxFQUFnRE4sVUFBaEQsRUFBNERDLFFBQTVELEVBQXNFQyxjQUF0RSxFQUFzRkssVUFBdEYsRUFBa0diLGFBQWxHLENBQVAsQ0FBQTs7QUFDSixNQUFBLEtBQUtnQix1QkFBTDtRQUNJLE9BQU8sSUFBSUMsd0JBQUosQ0FBNkJQLEtBQTdCLEVBQW9DQyxNQUFwQyxFQUE0Q3RCLElBQTVDLEVBQWtEdUIsS0FBbEQsRUFBeUROLFVBQXpELEVBQXFFQyxRQUFyRSxFQUErRUMsY0FBL0UsRUFBK0ZLLFVBQS9GLEVBQTJHYixhQUEzRyxDQUFQLENBQUE7O0FBQ0osTUFBQSxLQUFLa0IseUJBQUw7UUFDSSxPQUFPLElBQUlDLDBCQUFKLENBQStCVCxLQUEvQixFQUFzQ0MsTUFBdEMsRUFBOEN0QixJQUE5QyxFQUFvRHVCLEtBQXBELEVBQTJETixVQUEzRCxFQUF1RUMsUUFBdkUsRUFBaUZDLGNBQWpGLEVBQWlHSyxVQUFqRyxFQUE2R2IsYUFBN0csQ0FBUCxDQUFBOztBQUNKLE1BQUEsS0FBS29CLGlCQUFMO1FBQ0ksT0FBTyxJQUFJQyxtQkFBSixDQUF3QlgsS0FBeEIsRUFBK0JDLE1BQS9CLEVBQXVDdEIsSUFBdkMsRUFBNkN1QixLQUE3QyxFQUFvRE4sVUFBcEQsRUFBZ0VDLFFBQWhFLEVBQTBFQyxjQUExRSxFQUEwRkssVUFBMUYsRUFBc0diLGFBQXRHLENBQVAsQ0FBQTtBQVJSLEtBQUE7O0FBV0FzQixJQUFBQSxLQUFLLENBQUNDLEtBQU4sQ0FBYSxDQUFBLHlCQUFBLEVBQTJCbkIsSUFBSyxDQUE3QyxDQUFBLENBQUEsQ0FBQTtBQUNBLElBQUEsT0FBT0wsU0FBUCxDQUFBO0FBQ0gsR0FBQTs7RUFFRHlCLGdCQUFnQixDQUFDQyxJQUFELEVBQU87SUFDbkIsSUFBSUMsUUFBUSxHQUFHLElBQUEsQ0FBS3hCLFVBQXBCLENBQUE7O0FBQ0EsSUFBQSxLQUFLLElBQUl5QixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHRixJQUFJLENBQUNHLE1BQXpCLEVBQWlDRCxDQUFDLEVBQWxDLEVBQXNDO01BQ2xDRCxRQUFRLEdBQUdBLFFBQVEsQ0FBQ0csUUFBVCxDQUFrQkosSUFBSSxDQUFDRSxDQUFELENBQXRCLENBQVgsQ0FBQTtBQUNILEtBQUE7O0FBQ0QsSUFBQSxPQUFPRCxRQUFQLENBQUE7QUFDSCxHQUFBOztBQUVESSxFQUFBQSxZQUFZLENBQUNMLElBQUQsRUFBT00sU0FBUCxFQUFrQjtBQUMxQixJQUFBLE1BQU1DLFVBQVUsR0FBR1AsSUFBSSxDQUFDUSxJQUFMLENBQVUsR0FBVixDQUFuQixDQUFBOztJQUNBLE1BQU1DLGdCQUFnQixHQUFHLElBQUt0QyxDQUFBQSxjQUFMLENBQW9CdUMsU0FBcEIsQ0FBOEIsVUFBVUMsU0FBVixFQUFxQjtBQUN4RSxNQUFBLE9BQU9BLFNBQVMsQ0FBQ1gsSUFBVixLQUFtQk8sVUFBMUIsQ0FBQTtBQUNILEtBRndCLENBQXpCLENBQUE7O0lBR0EsSUFBSUUsZ0JBQWdCLElBQUksQ0FBeEIsRUFBMkI7QUFDdkIsTUFBQSxJQUFBLENBQUt0QyxjQUFMLENBQW9Cc0MsZ0JBQXBCLENBQXNDSCxDQUFBQSxTQUF0QyxHQUFrREEsU0FBbEQsQ0FBQTtBQUNILEtBRkQsTUFFTztBQUNILE1BQUEsTUFBTU0sSUFBSSxHQUFHLElBQUEsQ0FBS2IsZ0JBQUwsQ0FBc0JDLElBQXRCLENBQWIsQ0FBQTs7TUFDQVksSUFBSSxDQUFDTixTQUFMLEdBQWlCQSxTQUFqQixDQUFBOztBQUNBLE1BQUEsSUFBQSxDQUFLbkMsY0FBTCxDQUFvQjBDLElBQXBCLENBQXlCRCxJQUF6QixDQUFBLENBQUE7QUFDSCxLQUFBO0FBQ0osR0FBQTs7QUFFTyxFQUFBLElBQUpoRCxJQUFJLEdBQUc7QUFDUCxJQUFBLE9BQU8sS0FBS0ssS0FBWixDQUFBO0FBQ0gsR0FBQTs7RUFFYSxJQUFWNkMsVUFBVSxDQUFDQyxLQUFELEVBQVE7SUFDbEIsSUFBSzVDLENBQUFBLGNBQUwsR0FBc0I0QyxLQUF0QixDQUFBO0FBQ0gsR0FBQTs7QUFFYSxFQUFBLElBQVZELFVBQVUsR0FBRztBQUNiLElBQUEsT0FBTyxLQUFLM0MsY0FBWixDQUFBO0FBQ0gsR0FBQTs7RUFFUSxJQUFMTixLQUFLLENBQUNrRCxLQUFELEVBQVE7SUFDYixJQUFLM0MsQ0FBQUEsTUFBTCxHQUFjMkMsS0FBZCxDQUFBO0FBQ0gsR0FBQTs7QUFFUSxFQUFBLElBQUxsRCxLQUFLLEdBQUc7QUFDUixJQUFBLE9BQU8sS0FBS08sTUFBWixDQUFBO0FBQ0gsR0FBQTs7RUFFTyxJQUFKTixJQUFJLENBQUNpRCxLQUFELEVBQVE7SUFDWixJQUFLMUMsQ0FBQUEsS0FBTCxHQUFhMEMsS0FBYixDQUFBO0FBQ0gsR0FBQTs7QUFFTyxFQUFBLElBQUpqRCxJQUFJLEdBQUc7QUFDUCxJQUFBLE9BQU8sS0FBS08sS0FBWixDQUFBO0FBQ0gsR0FBQTs7QUFFWSxFQUFBLElBQVQyQyxTQUFTLEdBQUc7QUFDWixJQUFBLElBQUksQ0FBQyxJQUFBLENBQUt2QyxVQUFOLElBQXFCLElBQUtBLENBQUFBLFVBQUwsQ0FBZ0JmLFdBQWhCLEtBQWdDc0IsUUFBekQsRUFBb0UsT0FBTyxDQUFQLENBQUE7QUFDcEUsSUFBQSxPQUFPLElBQUtQLENBQUFBLFVBQUwsQ0FBZ0J3QyxZQUFoQixFQUFQLENBQUE7QUFDSCxHQUFBOztBQUVXLEVBQUEsSUFBUkMsUUFBUSxHQUFHO0FBQ1gsSUFBQSxPQUFRQyxtQkFBbUIsQ0FBQ0MsT0FBcEIsQ0FBNEIsSUFBQSxDQUFLeEQsSUFBakMsQ0FBMkMsS0FBQSxDQUFDLENBQTVDLElBQWlELEtBQUtrRCxVQUFMLENBQWdCWCxNQUFoQixLQUEyQixLQUFLYSxTQUF6RixDQUFBO0FBQ0gsR0FBQTs7QUFFVSxFQUFBLElBQVBLLE9BQU8sR0FBRztBQUNWLElBQUEsSUFBSSxLQUFLUCxVQUFMLENBQWdCWCxNQUFoQixHQUF5QixDQUE3QixFQUFnQztBQUM1QixNQUFBLE1BQU1tQixhQUFhLEdBQUcsSUFBSzFELENBQUFBLElBQUwsR0FBWSxHQUFaLEdBQWtCLElBQUtrRCxDQUFBQSxVQUFMLENBQWdCLENBQWhCLENBQW1CUixDQUFBQSxTQUFuQixDQUE2QjFDLElBQXJFLENBQUE7O01BQ0EsTUFBTTJELFNBQVMsR0FBRyxJQUFBLENBQUt2RCxXQUFMLENBQWlCd0QsYUFBakIsQ0FBK0JDLFFBQS9CLENBQXdDSCxhQUF4QyxDQUFsQixDQUFBOztBQUNBLE1BQUEsSUFBSUMsU0FBSixFQUFlO1FBQ1gsT0FBT0EsU0FBUyxDQUFDekQsSUFBakIsQ0FBQTtBQUNILE9BQUE7QUFDSixLQUFBOztBQUNELElBQUEsT0FBTyxLQUFQLENBQUE7QUFDSCxHQUFBOztBQUVjLEVBQUEsSUFBWDRELFdBQVcsR0FBRztJQUNkLElBQUlDLEdBQUcsR0FBRyxDQUFWLENBQUE7O0FBQ0EsSUFBQSxLQUFLLElBQUl6QixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLElBQUtZLENBQUFBLFVBQUwsQ0FBZ0JYLE1BQXBDLEVBQTRDRCxDQUFDLEVBQTdDLEVBQWlEO0FBQzdDeUIsTUFBQUEsR0FBRyxJQUFJLElBQUtiLENBQUFBLFVBQUwsQ0FBZ0JaLENBQWhCLEVBQW1CMEIsTUFBMUIsQ0FBQTtBQUNILEtBQUE7O0FBQ0QsSUFBQSxPQUFPRCxHQUFQLENBQUE7QUFDSCxHQUFBOztBQUVtQixFQUFBLElBQWhCRSxnQkFBZ0IsR0FBRztJQUNuQixJQUFJQyxRQUFRLEdBQUcsQ0FBZixDQUFBOztBQUNBLElBQUEsS0FBSyxJQUFJNUIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxJQUFLWSxDQUFBQSxVQUFMLENBQWdCWCxNQUFwQyxFQUE0Q0QsQ0FBQyxFQUE3QyxFQUFpRDtBQUM3QyxNQUFBLE1BQU1TLFNBQVMsR0FBRyxJQUFBLENBQUtHLFVBQUwsQ0FBZ0JaLENBQWhCLENBQWxCLENBQUE7O0FBQ0EsTUFBQSxJQUFJUyxTQUFTLENBQUNMLFNBQVYsQ0FBb0J3QixRQUFwQixHQUErQkEsUUFBbkMsRUFBNkM7QUFDekNBLFFBQUFBLFFBQVEsR0FBR25CLFNBQVMsQ0FBQ0wsU0FBVixDQUFvQndCLFFBQS9CLENBQUE7QUFDSCxPQUFBO0FBQ0osS0FBQTs7QUFDRCxJQUFBLE9BQU9BLFFBQVAsQ0FBQTtBQUNILEdBQUE7O0FBOUlXOzs7OyJ9
