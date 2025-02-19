/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { SceneUtils } from './scene-utils.js';
import { SceneParser } from '../parsers/scene.js';

/** @typedef {import('./handler.js').ResourceHandler} ResourceHandler */

/**
 * Resource handler used for loading {@link Scene} resources.
 *
 * @implements {ResourceHandler}
 */
class SceneHandler {
  /**
   * Type of the resource the handler handles.
   *
   * @type {string}
   */

  /**
   * Create a new SceneHandler instance.
   *
   * @param {import('../app-base.js').AppBase} app - The running {@link AppBase}.
   * @hideconstructor
   */
  constructor(app) {
    this.handlerType = "scene";
    this._app = app;
    this.maxRetries = 0;
  }
  load(url, callback) {
    SceneUtils.load(url, this.maxRetries, callback);
  }
  open(url, data) {
    // prevent script initialization until entire scene is open
    this._app.systems.script.preloading = true;
    const parser = new SceneParser(this._app, false);
    const parent = parser.parse(data);

    // set scene root
    const scene = this._app.scene;
    scene.root = parent;
    this._app.applySceneSettings(data.settings);

    // re-enable script initialization
    this._app.systems.script.preloading = false;
    return scene;
  }
  patch(asset, assets) {}
}

export { SceneHandler };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9mcmFtZXdvcmsvaGFuZGxlcnMvc2NlbmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2NlbmVVdGlscyB9IGZyb20gJy4vc2NlbmUtdXRpbHMuanMnO1xuaW1wb3J0IHsgU2NlbmVQYXJzZXIgfSBmcm9tICcuLi9wYXJzZXJzL3NjZW5lLmpzJztcblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4vaGFuZGxlci5qcycpLlJlc291cmNlSGFuZGxlcn0gUmVzb3VyY2VIYW5kbGVyICovXG5cbi8qKlxuICogUmVzb3VyY2UgaGFuZGxlciB1c2VkIGZvciBsb2FkaW5nIHtAbGluayBTY2VuZX0gcmVzb3VyY2VzLlxuICpcbiAqIEBpbXBsZW1lbnRzIHtSZXNvdXJjZUhhbmRsZXJ9XG4gKi9cbmNsYXNzIFNjZW5lSGFuZGxlciB7XG4gICAgLyoqXG4gICAgICogVHlwZSBvZiB0aGUgcmVzb3VyY2UgdGhlIGhhbmRsZXIgaGFuZGxlcy5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgaGFuZGxlclR5cGUgPSBcInNjZW5lXCI7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgU2NlbmVIYW5kbGVyIGluc3RhbmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4uL2FwcC1iYXNlLmpzJykuQXBwQmFzZX0gYXBwIC0gVGhlIHJ1bm5pbmcge0BsaW5rIEFwcEJhc2V9LlxuICAgICAqIEBoaWRlY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcbiAgICAgICAgdGhpcy5fYXBwID0gYXBwO1xuICAgICAgICB0aGlzLm1heFJldHJpZXMgPSAwO1xuICAgIH1cblxuICAgIGxvYWQodXJsLCBjYWxsYmFjaykge1xuICAgICAgICBTY2VuZVV0aWxzLmxvYWQodXJsLCB0aGlzLm1heFJldHJpZXMsIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBvcGVuKHVybCwgZGF0YSkge1xuICAgICAgICAvLyBwcmV2ZW50IHNjcmlwdCBpbml0aWFsaXphdGlvbiB1bnRpbCBlbnRpcmUgc2NlbmUgaXMgb3BlblxuICAgICAgICB0aGlzLl9hcHAuc3lzdGVtcy5zY3JpcHQucHJlbG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgY29uc3QgcGFyc2VyID0gbmV3IFNjZW5lUGFyc2VyKHRoaXMuX2FwcCwgZmFsc2UpO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSBwYXJzZXIucGFyc2UoZGF0YSk7XG5cbiAgICAgICAgLy8gc2V0IHNjZW5lIHJvb3RcbiAgICAgICAgY29uc3Qgc2NlbmUgPSB0aGlzLl9hcHAuc2NlbmU7XG4gICAgICAgIHNjZW5lLnJvb3QgPSBwYXJlbnQ7XG5cbiAgICAgICAgdGhpcy5fYXBwLmFwcGx5U2NlbmVTZXR0aW5ncyhkYXRhLnNldHRpbmdzKTtcblxuICAgICAgICAvLyByZS1lbmFibGUgc2NyaXB0IGluaXRpYWxpemF0aW9uXG4gICAgICAgIHRoaXMuX2FwcC5zeXN0ZW1zLnNjcmlwdC5wcmVsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHNjZW5lO1xuICAgIH1cblxuICAgIHBhdGNoKGFzc2V0LCBhc3NldHMpIHtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFNjZW5lSGFuZGxlciB9O1xuIl0sIm5hbWVzIjpbIlNjZW5lSGFuZGxlciIsImNvbnN0cnVjdG9yIiwiYXBwIiwiaGFuZGxlclR5cGUiLCJfYXBwIiwibWF4UmV0cmllcyIsImxvYWQiLCJ1cmwiLCJjYWxsYmFjayIsIlNjZW5lVXRpbHMiLCJvcGVuIiwiZGF0YSIsInN5c3RlbXMiLCJzY3JpcHQiLCJwcmVsb2FkaW5nIiwicGFyc2VyIiwiU2NlbmVQYXJzZXIiLCJwYXJlbnQiLCJwYXJzZSIsInNjZW5lIiwicm9vdCIsImFwcGx5U2NlbmVTZXR0aW5ncyIsInNldHRpbmdzIiwicGF0Y2giLCJhc3NldCIsImFzc2V0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFHQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUEsWUFBWSxDQUFDO0FBQ2Y7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7QUFHSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDSUMsV0FBV0EsQ0FBQ0MsR0FBRyxFQUFFO0lBQUEsSUFSakJDLENBQUFBLFdBQVcsR0FBRyxPQUFPLENBQUE7SUFTakIsSUFBSSxDQUFDQyxJQUFJLEdBQUdGLEdBQUcsQ0FBQTtJQUNmLElBQUksQ0FBQ0csVUFBVSxHQUFHLENBQUMsQ0FBQTtBQUN2QixHQUFBO0FBRUFDLEVBQUFBLElBQUlBLENBQUNDLEdBQUcsRUFBRUMsUUFBUSxFQUFFO0lBQ2hCQyxVQUFVLENBQUNILElBQUksQ0FBQ0MsR0FBRyxFQUFFLElBQUksQ0FBQ0YsVUFBVSxFQUFFRyxRQUFRLENBQUMsQ0FBQTtBQUNuRCxHQUFBO0FBRUFFLEVBQUFBLElBQUlBLENBQUNILEdBQUcsRUFBRUksSUFBSSxFQUFFO0FBQ1o7SUFDQSxJQUFJLENBQUNQLElBQUksQ0FBQ1EsT0FBTyxDQUFDQyxNQUFNLENBQUNDLFVBQVUsR0FBRyxJQUFJLENBQUE7SUFFMUMsTUFBTUMsTUFBTSxHQUFHLElBQUlDLFdBQVcsQ0FBQyxJQUFJLENBQUNaLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtBQUNoRCxJQUFBLE1BQU1hLE1BQU0sR0FBR0YsTUFBTSxDQUFDRyxLQUFLLENBQUNQLElBQUksQ0FBQyxDQUFBOztBQUVqQztBQUNBLElBQUEsTUFBTVEsS0FBSyxHQUFHLElBQUksQ0FBQ2YsSUFBSSxDQUFDZSxLQUFLLENBQUE7SUFDN0JBLEtBQUssQ0FBQ0MsSUFBSSxHQUFHSCxNQUFNLENBQUE7SUFFbkIsSUFBSSxDQUFDYixJQUFJLENBQUNpQixrQkFBa0IsQ0FBQ1YsSUFBSSxDQUFDVyxRQUFRLENBQUMsQ0FBQTs7QUFFM0M7SUFDQSxJQUFJLENBQUNsQixJQUFJLENBQUNRLE9BQU8sQ0FBQ0MsTUFBTSxDQUFDQyxVQUFVLEdBQUcsS0FBSyxDQUFBO0FBRTNDLElBQUEsT0FBT0ssS0FBSyxDQUFBO0FBQ2hCLEdBQUE7QUFFQUksRUFBQUEsS0FBS0EsQ0FBQ0MsS0FBSyxFQUFFQyxNQUFNLEVBQUUsRUFDckI7QUFDSjs7OzsifQ==
