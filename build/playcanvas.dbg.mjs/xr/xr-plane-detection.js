/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { platform } from '../core/platform.js';
import { EventHandler } from '../core/event-handler.js';
import { XrPlane } from './xr-plane.js';

class XrPlaneDetection extends EventHandler {
  constructor(manager) {
    super();
    this._manager = void 0;
    this._supported = platform.browser && !!window.XRPlane;
    this._available = false;
    this._planesIndex = new Map();
    this._planes = null;
    this._manager = manager;

    if (this._supported) {
      this._manager.on('end', this._onSessionEnd, this);
    }
  }

  _onSessionEnd() {
    if (this._planes) {
      for (let i = 0; i < this._planes.length; i++) {
        this._planes[i].destroy();
      }
    }

    this._planesIndex.clear();

    this._planes = null;

    if (this._available) {
      this._available = false;
      this.fire('unavailable');
    }
  }

  update(frame) {
    let detectedPlanes;

    if (!this._available) {
      try {
        detectedPlanes = frame.detectedPlanes;
        this._planes = [];
        this._available = true;
        this.fire('available');
      } catch (ex) {
        return;
      }
    } else {
      detectedPlanes = frame.detectedPlanes;
    }

    for (const [xrPlane, plane] of this._planesIndex) {
      if (detectedPlanes.has(xrPlane)) continue;

      this._planesIndex.delete(xrPlane);

      this._planes.splice(this._planes.indexOf(plane), 1);

      plane.destroy();
      this.fire('remove', plane);
    }

    for (const xrPlane of detectedPlanes) {
      let plane = this._planesIndex.get(xrPlane);

      if (!plane) {
        plane = new XrPlane(this, xrPlane);

        this._planesIndex.set(xrPlane, plane);

        this._planes.push(plane);

        plane.update(frame);
        this.fire('add', plane);
      } else {
        plane.update(frame);
      }
    }
  }

  get supported() {
    return this._supported;
  }

  get available() {
    return this._available;
  }

  get planes() {
    return this._planes;
  }

}

export { XrPlaneDetection };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHItcGxhbmUtZGV0ZWN0aW9uLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMveHIveHItcGxhbmUtZGV0ZWN0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBsYXRmb3JtIH0gZnJvbSAnLi4vY29yZS9wbGF0Zm9ybS5qcyc7XG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSBmcm9tICcuLi9jb3JlL2V2ZW50LWhhbmRsZXIuanMnO1xuaW1wb3J0IHsgWHJQbGFuZSB9IGZyb20gJy4veHItcGxhbmUuanMnO1xuXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi94ci1tYW5hZ2VyLmpzJykuWHJNYW5hZ2VyfSBYck1hbmFnZXIgKi9cblxuLyoqXG4gKiBQbGFuZSBEZXRlY3Rpb24gcHJvdmlkZXMgdGhlIGFiaWxpdHkgdG8gZGV0ZWN0IHJlYWwgd29ybGQgc3VyZmFjZXMgYmFzZWQgb24gZXN0aW1hdGlvbnMgb2YgdGhlXG4gKiB1bmRlcmx5aW5nIEFSIHN5c3RlbS5cbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiAvLyBzdGFydCBzZXNzaW9uIHdpdGggcGxhbmUgZGV0ZWN0aW9uIGVuYWJsZWRcbiAqIGFwcC54ci5zdGFydChjYW1lcmEsIHBjLlhSVFlQRV9WUiwgcGMuWFJTUEFDRV9MT0NBTEZMT09SLCB7XG4gKiAgICAgcGxhbmVEZXRlY3Rpb246IHRydWVcbiAqIH0pO1xuICogYGBgXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogYXBwLnhyLnBsYW5lRGV0ZWN0aW9uLm9uKCdhZGQnLCBmdW5jdGlvbiAocGxhbmUpIHtcbiAqICAgICAvLyBuZXcgcGxhbmUgYmVlbiBhZGRlZFxuICogfSk7XG4gKiBgYGBcbiAqL1xuY2xhc3MgWHJQbGFuZURldGVjdGlvbiBleHRlbmRzIEV2ZW50SGFuZGxlciB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge1hyTWFuYWdlcn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYW5hZ2VyO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc3VwcG9ydGVkID0gcGxhdGZvcm0uYnJvd3NlciAmJiAhIXdpbmRvdy5YUlBsYW5lO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYXZhaWxhYmxlID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7TWFwPFhSUGxhbmUsIFhyUGxhbmU+fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3BsYW5lc0luZGV4ID0gbmV3IE1hcCgpO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge1hyUGxhbmVbXXxudWxsfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3BsYW5lcyA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgWHJQbGFuZURldGVjdGlvbiBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WHJNYW5hZ2VyfSBtYW5hZ2VyIC0gV2ViWFIgTWFuYWdlci5cbiAgICAgKiBAaGlkZWNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWFuYWdlcikge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuX21hbmFnZXIgPSBtYW5hZ2VyO1xuXG4gICAgICAgIGlmICh0aGlzLl9zdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX21hbmFnZXIub24oJ2VuZCcsIHRoaXMuX29uU2Vzc2lvbkVuZCwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlZCB3aGVuIHBsYW5lIGRldGVjdGlvbiBiZWNvbWVzIGF2YWlsYWJsZS5cbiAgICAgKlxuICAgICAqIEBldmVudCBYclBsYW5lRGV0ZWN0aW9uI2F2YWlsYWJsZVxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogRmlyZWQgd2hlbiBwbGFuZSBkZXRlY3Rpb24gYmVjb21lcyB1bmF2YWlsYWJsZS5cbiAgICAgKlxuICAgICAqIEBldmVudCBYclBsYW5lRGV0ZWN0aW9uI3VuYXZhaWxhYmxlXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBGaXJlZCB3aGVuIG5ldyB7QGxpbmsgWHJQbGFuZX0gaXMgYWRkZWQgdG8gdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBAZXZlbnQgWHJQbGFuZURldGVjdGlvbiNhZGRcbiAgICAgKiBAcGFyYW0ge1hyUGxhbmV9IHBsYW5lIC0gUGxhbmUgdGhhdCBoYXMgYmVlbiBhZGRlZC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGFwcC54ci5wbGFuZURldGVjdGlvbi5vbignYWRkJywgZnVuY3Rpb24gKHBsYW5lKSB7XG4gICAgICogICAgIC8vIG5ldyBwbGFuZSBpcyBhZGRlZFxuICAgICAqIH0pO1xuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogRmlyZWQgd2hlbiBhIHtAbGluayBYclBsYW5lfSBpcyByZW1vdmVkIGZyb20gdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBAZXZlbnQgWHJQbGFuZURldGVjdGlvbiNyZW1vdmVcbiAgICAgKiBAcGFyYW0ge1hyUGxhbmV9IHBsYW5lIC0gUGxhbmUgdGhhdCBoYXMgYmVlbiByZW1vdmVkLlxuICAgICAqIEBleGFtcGxlXG4gICAgICogYXBwLnhyLnBsYW5lRGV0ZWN0aW9uLm9uKCdyZW1vdmUnLCBmdW5jdGlvbiAocGxhbmUpIHtcbiAgICAgKiAgICAgLy8gbmV3IHBsYW5lIGlzIHJlbW92ZWRcbiAgICAgKiB9KTtcbiAgICAgKi9cblxuICAgIC8qKiBAcHJpdmF0ZSAqL1xuICAgIF9vblNlc3Npb25FbmQoKSB7XG4gICAgICAgIGlmICh0aGlzLl9wbGFuZXMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fcGxhbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGxhbmVzW2ldLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3BsYW5lc0luZGV4LmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX3BsYW5lcyA9IG51bGw7XG5cbiAgICAgICAgaWYgKHRoaXMuX2F2YWlsYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5fYXZhaWxhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3VuYXZhaWxhYmxlJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0geyp9IGZyYW1lIC0gWFJGcmFtZSBmcm9tIHJlcXVlc3RBbmltYXRpb25GcmFtZSBjYWxsYmFjay5cbiAgICAgKiBAaWdub3JlXG4gICAgICovXG4gICAgdXBkYXRlKGZyYW1lKSB7XG4gICAgICAgIGxldCBkZXRlY3RlZFBsYW5lcztcblxuICAgICAgICBpZiAoIXRoaXMuX2F2YWlsYWJsZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBkZXRlY3RlZFBsYW5lcyA9IGZyYW1lLmRldGVjdGVkUGxhbmVzO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BsYW5lcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2F2YWlsYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGV0ZWN0ZWRQbGFuZXMgPSBmcmFtZS5kZXRlY3RlZFBsYW5lcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGl0ZXJhdGUgdGhyb3VnaCBpbmRleGVkIHBsYW5lc1xuICAgICAgICBmb3IgKGNvbnN0IFt4clBsYW5lLCBwbGFuZV0gb2YgdGhpcy5fcGxhbmVzSW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChkZXRlY3RlZFBsYW5lcy5oYXMoeHJQbGFuZSkpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgIC8vIGlmIGluZGV4ZWQgcGxhbmUgaXMgbm90IGxpc3RlZCBpbiBkZXRlY3RlZFBsYW5lcyBhbnltb3JlXG4gICAgICAgICAgICAvLyB0aGVuIHJlbW92ZSBpdFxuICAgICAgICAgICAgdGhpcy5fcGxhbmVzSW5kZXguZGVsZXRlKHhyUGxhbmUpO1xuICAgICAgICAgICAgdGhpcy5fcGxhbmVzLnNwbGljZSh0aGlzLl9wbGFuZXMuaW5kZXhPZihwbGFuZSksIDEpO1xuICAgICAgICAgICAgcGxhbmUuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBwbGFuZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpdGVyYXRlIHRocm91Z2ggZGV0ZWN0ZWQgcGxhbmVzXG4gICAgICAgIGZvciAoY29uc3QgeHJQbGFuZSBvZiBkZXRlY3RlZFBsYW5lcykge1xuICAgICAgICAgICAgbGV0IHBsYW5lID0gdGhpcy5fcGxhbmVzSW5kZXguZ2V0KHhyUGxhbmUpO1xuXG4gICAgICAgICAgICBpZiAoIXBsYW5lKSB7XG4gICAgICAgICAgICAgICAgLy8gZGV0ZWN0ZWQgcGxhbmUgaXMgbm90IGluZGV4ZWRcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGNyZWF0ZSBuZXcgWHJQbGFuZVxuICAgICAgICAgICAgICAgIHBsYW5lID0gbmV3IFhyUGxhbmUodGhpcywgeHJQbGFuZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGxhbmVzSW5kZXguc2V0KHhyUGxhbmUsIHBsYW5lKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGFuZXMucHVzaChwbGFuZSk7XG4gICAgICAgICAgICAgICAgcGxhbmUudXBkYXRlKGZyYW1lKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ2FkZCcsIHBsYW5lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgYWxyZWFkeSBpbmRleGVkLCBqdXN0IHVwZGF0ZVxuICAgICAgICAgICAgICAgIHBsYW5lLnVwZGF0ZShmcmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcnVlIGlmIFBsYW5lIERldGVjdGlvbiBpcyBzdXBwb3J0ZWQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgc3VwcG9ydGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwcG9ydGVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRydWUgaWYgUGxhbmUgRGV0ZWN0aW9uIGlzIGF2YWlsYWJsZS4gVGhpcyBwcm9wZXJ0eSBjYW4gYmUgc2V0IHRvIHRydWUgb25seSBkdXJpbmcgYSBydW5uaW5nXG4gICAgICogc2Vzc2lvbi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIGdldCBhdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hdmFpbGFibGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXJyYXkgb2Yge0BsaW5rIFhyUGxhbmV9IGluc3RhbmNlcyB0aGF0IGNvbnRhaW4gaW5kaXZpZHVhbCBwbGFuZSBpbmZvcm1hdGlvbiwgb3IgbnVsbCBpZlxuICAgICAqIHBsYW5lIGRldGVjdGlvbiBpcyBub3QgYXZhaWxhYmxlLlxuICAgICAqXG4gICAgICogQHR5cGUge1hyUGxhbmVbXXxudWxsfVxuICAgICAqL1xuICAgIGdldCBwbGFuZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wbGFuZXM7XG4gICAgfVxufVxuXG5leHBvcnQgeyBYclBsYW5lRGV0ZWN0aW9uIH07XG4iXSwibmFtZXMiOlsiWHJQbGFuZURldGVjdGlvbiIsIkV2ZW50SGFuZGxlciIsImNvbnN0cnVjdG9yIiwibWFuYWdlciIsIl9tYW5hZ2VyIiwiX3N1cHBvcnRlZCIsInBsYXRmb3JtIiwiYnJvd3NlciIsIndpbmRvdyIsIlhSUGxhbmUiLCJfYXZhaWxhYmxlIiwiX3BsYW5lc0luZGV4IiwiTWFwIiwiX3BsYW5lcyIsIm9uIiwiX29uU2Vzc2lvbkVuZCIsImkiLCJsZW5ndGgiLCJkZXN0cm95IiwiY2xlYXIiLCJmaXJlIiwidXBkYXRlIiwiZnJhbWUiLCJkZXRlY3RlZFBsYW5lcyIsImV4IiwieHJQbGFuZSIsInBsYW5lIiwiaGFzIiwiZGVsZXRlIiwic3BsaWNlIiwiaW5kZXhPZiIsImdldCIsIlhyUGxhbmUiLCJzZXQiLCJwdXNoIiwic3VwcG9ydGVkIiwiYXZhaWxhYmxlIiwicGxhbmVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUF1QkEsTUFBTUEsZ0JBQU4sU0FBK0JDLFlBQS9CLENBQTRDO0VBcUN4Q0MsV0FBVyxDQUFDQyxPQUFELEVBQVU7QUFDakIsSUFBQSxLQUFBLEVBQUEsQ0FBQTtBQURpQixJQUFBLElBQUEsQ0FoQ3JCQyxRQWdDcUIsR0FBQSxLQUFBLENBQUEsQ0FBQTtJQUFBLElBMUJyQkMsQ0FBQUEsVUEwQnFCLEdBMUJSQyxRQUFRLENBQUNDLE9BQVQsSUFBb0IsQ0FBQyxDQUFDQyxNQUFNLENBQUNDLE9BMEJyQixDQUFBO0lBQUEsSUFwQnJCQyxDQUFBQSxVQW9CcUIsR0FwQlIsS0FvQlEsQ0FBQTtBQUFBLElBQUEsSUFBQSxDQWRyQkMsWUFjcUIsR0FkTixJQUFJQyxHQUFKLEVBY00sQ0FBQTtJQUFBLElBUnJCQyxDQUFBQSxPQVFxQixHQVJYLElBUVcsQ0FBQTtJQUdqQixJQUFLVCxDQUFBQSxRQUFMLEdBQWdCRCxPQUFoQixDQUFBOztJQUVBLElBQUksSUFBQSxDQUFLRSxVQUFULEVBQXFCO01BQ2pCLElBQUtELENBQUFBLFFBQUwsQ0FBY1UsRUFBZCxDQUFpQixLQUFqQixFQUF3QixJQUFBLENBQUtDLGFBQTdCLEVBQTRDLElBQTVDLENBQUEsQ0FBQTtBQUNILEtBQUE7QUFDSixHQUFBOztBQXFDREEsRUFBQUEsYUFBYSxHQUFHO0lBQ1osSUFBSSxJQUFBLENBQUtGLE9BQVQsRUFBa0I7QUFDZCxNQUFBLEtBQUssSUFBSUcsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxJQUFLSCxDQUFBQSxPQUFMLENBQWFJLE1BQWpDLEVBQXlDRCxDQUFDLEVBQTFDLEVBQThDO0FBQzFDLFFBQUEsSUFBQSxDQUFLSCxPQUFMLENBQWFHLENBQWIsQ0FBQSxDQUFnQkUsT0FBaEIsRUFBQSxDQUFBO0FBQ0gsT0FBQTtBQUNKLEtBQUE7O0lBRUQsSUFBS1AsQ0FBQUEsWUFBTCxDQUFrQlEsS0FBbEIsRUFBQSxDQUFBOztJQUNBLElBQUtOLENBQUFBLE9BQUwsR0FBZSxJQUFmLENBQUE7O0lBRUEsSUFBSSxJQUFBLENBQUtILFVBQVQsRUFBcUI7TUFDakIsSUFBS0EsQ0FBQUEsVUFBTCxHQUFrQixLQUFsQixDQUFBO01BQ0EsSUFBS1UsQ0FBQUEsSUFBTCxDQUFVLGFBQVYsQ0FBQSxDQUFBO0FBQ0gsS0FBQTtBQUNKLEdBQUE7O0VBTURDLE1BQU0sQ0FBQ0MsS0FBRCxFQUFRO0FBQ1YsSUFBQSxJQUFJQyxjQUFKLENBQUE7O0lBRUEsSUFBSSxDQUFDLElBQUtiLENBQUFBLFVBQVYsRUFBc0I7TUFDbEIsSUFBSTtRQUNBYSxjQUFjLEdBQUdELEtBQUssQ0FBQ0MsY0FBdkIsQ0FBQTtRQUNBLElBQUtWLENBQUFBLE9BQUwsR0FBZSxFQUFmLENBQUE7UUFDQSxJQUFLSCxDQUFBQSxVQUFMLEdBQWtCLElBQWxCLENBQUE7UUFDQSxJQUFLVSxDQUFBQSxJQUFMLENBQVUsV0FBVixDQUFBLENBQUE7T0FKSixDQUtFLE9BQU9JLEVBQVAsRUFBVztBQUNULFFBQUEsT0FBQTtBQUNILE9BQUE7QUFDSixLQVRELE1BU087TUFDSEQsY0FBYyxHQUFHRCxLQUFLLENBQUNDLGNBQXZCLENBQUE7QUFDSCxLQUFBOztJQUdELEtBQUssTUFBTSxDQUFDRSxPQUFELEVBQVVDLEtBQVYsQ0FBWCxJQUErQixJQUFLZixDQUFBQSxZQUFwQyxFQUFrRDtBQUM5QyxNQUFBLElBQUlZLGNBQWMsQ0FBQ0ksR0FBZixDQUFtQkYsT0FBbkIsQ0FBSixFQUNJLFNBQUE7O0FBSUosTUFBQSxJQUFBLENBQUtkLFlBQUwsQ0FBa0JpQixNQUFsQixDQUF5QkgsT0FBekIsQ0FBQSxDQUFBOztBQUNBLE1BQUEsSUFBQSxDQUFLWixPQUFMLENBQWFnQixNQUFiLENBQW9CLElBQUtoQixDQUFBQSxPQUFMLENBQWFpQixPQUFiLENBQXFCSixLQUFyQixDQUFwQixFQUFpRCxDQUFqRCxDQUFBLENBQUE7O0FBQ0FBLE1BQUFBLEtBQUssQ0FBQ1IsT0FBTixFQUFBLENBQUE7QUFDQSxNQUFBLElBQUEsQ0FBS0UsSUFBTCxDQUFVLFFBQVYsRUFBb0JNLEtBQXBCLENBQUEsQ0FBQTtBQUNILEtBQUE7O0FBR0QsSUFBQSxLQUFLLE1BQU1ELE9BQVgsSUFBc0JGLGNBQXRCLEVBQXNDO01BQ2xDLElBQUlHLEtBQUssR0FBRyxJQUFLZixDQUFBQSxZQUFMLENBQWtCb0IsR0FBbEIsQ0FBc0JOLE9BQXRCLENBQVosQ0FBQTs7TUFFQSxJQUFJLENBQUNDLEtBQUwsRUFBWTtBQUdSQSxRQUFBQSxLQUFLLEdBQUcsSUFBSU0sT0FBSixDQUFZLElBQVosRUFBa0JQLE9BQWxCLENBQVIsQ0FBQTs7QUFDQSxRQUFBLElBQUEsQ0FBS2QsWUFBTCxDQUFrQnNCLEdBQWxCLENBQXNCUixPQUF0QixFQUErQkMsS0FBL0IsQ0FBQSxDQUFBOztBQUNBLFFBQUEsSUFBQSxDQUFLYixPQUFMLENBQWFxQixJQUFiLENBQWtCUixLQUFsQixDQUFBLENBQUE7O1FBQ0FBLEtBQUssQ0FBQ0wsTUFBTixDQUFhQyxLQUFiLENBQUEsQ0FBQTtBQUNBLFFBQUEsSUFBQSxDQUFLRixJQUFMLENBQVUsS0FBVixFQUFpQk0sS0FBakIsQ0FBQSxDQUFBO0FBQ0gsT0FSRCxNQVFPO1FBRUhBLEtBQUssQ0FBQ0wsTUFBTixDQUFhQyxLQUFiLENBQUEsQ0FBQTtBQUNILE9BQUE7QUFDSixLQUFBO0FBQ0osR0FBQTs7QUFPWSxFQUFBLElBQVRhLFNBQVMsR0FBRztBQUNaLElBQUEsT0FBTyxLQUFLOUIsVUFBWixDQUFBO0FBQ0gsR0FBQTs7QUFRWSxFQUFBLElBQVQrQixTQUFTLEdBQUc7QUFDWixJQUFBLE9BQU8sS0FBSzFCLFVBQVosQ0FBQTtBQUNILEdBQUE7O0FBUVMsRUFBQSxJQUFOMkIsTUFBTSxHQUFHO0FBQ1QsSUFBQSxPQUFPLEtBQUt4QixPQUFaLENBQUE7QUFDSCxHQUFBOztBQWpMdUM7Ozs7In0=
