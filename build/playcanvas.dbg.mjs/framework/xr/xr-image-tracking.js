/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { EventHandler } from '../../core/event-handler.js';
import { platform } from '../../core/platform.js';
import { XrTrackedImage } from './xr-tracked-image.js';

/**
 * Image Tracking provides the ability to track real world images by provided image samples and
 * their estimated sizes.
 *
 * @augments EventHandler
 */
class XrImageTracking extends EventHandler {
  /**
   * @type {import('./xr-manager.js').XrManager}
   * @private
   */

  /**
   * @type {boolean}
   * @private
   */

  /**
   * @type {boolean}
   * @private
   */

  /**
   * @type {XrTrackedImage[]}
   * @private
   */

  /**
   * Image Tracking provides the ability to track real world images by provided image samples and
   * their estimate sizes.
   *
   * @param {import('./xr-manager.js').XrManager} manager - WebXR Manager.
   * @hideconstructor
   */
  constructor(manager) {
    super();
    this._manager = void 0;
    this._supported = platform.browser && !!window.XRImageTrackingResult;
    this._available = false;
    this._images = [];
    this._manager = manager;
    if (this._supported) {
      this._manager.on('start', this._onSessionStart, this);
      this._manager.on('end', this._onSessionEnd, this);
    }
  }

  /**
   * Fired when the XR session is started, but image tracking failed to process the provided
   * images.
   *
   * @event XrImageTracking#error
   * @param {Error} error - Error object related to a failure of image tracking.
   */

  /**
   * Add an image for image tracking. A width can also be provided to help the underlying system
   * estimate the appropriate transformation. Modifying the tracked images list is only possible
   * before an AR session is started.
   *
   * @param {HTMLCanvasElement|HTMLImageElement|SVGImageElement|HTMLVideoElement|Blob|ImageData|ImageBitmap} image - Image
   * that is matching real world image as close as possible. Resolution of images should be at
   * least 300x300. High resolution does NOT improve tracking performance. Color of image is
   * irrelevant, so grayscale images can be used. Images with too many geometric features or
   * repeating patterns will reduce tracking stability.
   * @param {number} width - Width (in meters) of image in the real world. Providing this value
   * as close to the real value will improve tracking quality.
   * @returns {XrTrackedImage|null} Tracked image object that will contain tracking information.
   * Returns null if image tracking is not supported or if the XR manager is not active.
   * @example
   * // image with width of 20cm (0.2m)
   * app.xr.imageTracking.add(bookCoverImg, 0.2);
   */
  add(image, width) {
    if (!this._supported || this._manager.active) return null;
    const trackedImage = new XrTrackedImage(image, width);
    this._images.push(trackedImage);
    return trackedImage;
  }

  /**
   * Remove an image from image tracking.
   *
   * @param {XrTrackedImage} trackedImage - Tracked image to be removed. Modifying the tracked
   * images list is only possible before an AR session is started.
   */
  remove(trackedImage) {
    if (this._manager.active) return;
    const ind = this._images.indexOf(trackedImage);
    if (ind !== -1) {
      trackedImage.destroy();
      this._images.splice(ind, 1);
    }
  }

  /** @private */
  _onSessionStart() {
    this._manager.session.getTrackedImageScores().then(images => {
      this._available = true;
      for (let i = 0; i < images.length; i++) {
        this._images[i]._trackable = images[i] === 'trackable';
      }
    }).catch(err => {
      this._available = false;
      this.fire('error', err);
    });
  }

  /** @private */
  _onSessionEnd() {
    this._available = false;
    for (let i = 0; i < this._images.length; i++) {
      const image = this._images[i];
      image._pose = null;
      image._measuredWidth = 0;
      if (image._tracking) {
        image._tracking = false;
        image.fire('untracked');
      }
    }
  }

  /**
   * @param {Function} callback - Function to call when all images have been prepared as image
   * bitmaps.
   * @ignore
   */
  prepareImages(callback) {
    if (this._images.length) {
      Promise.all(this._images.map(function (trackedImage) {
        return trackedImage.prepare();
      })).then(function (bitmaps) {
        callback(null, bitmaps);
      }).catch(function (err) {
        callback(err, null);
      });
    } else {
      callback(null, null);
    }
  }

  /**
   * @param {*} frame - XRFrame from requestAnimationFrame callback.
   * @ignore
   */
  update(frame) {
    if (!this._available) return;
    const results = frame.getImageTrackingResults();
    const index = {};
    for (let i = 0; i < results.length; i++) {
      index[results[i].index] = results[i];
      const trackedImage = this._images[results[i].index];
      trackedImage._emulated = results[i].trackingState === 'emulated';
      trackedImage._measuredWidth = results[i].measuredWidthInMeters;
      trackedImage._pose = frame.getPose(results[i].imageSpace, this._manager._referenceSpace);
    }
    for (let i = 0; i < this._images.length; i++) {
      if (this._images[i]._tracking && !index[i]) {
        this._images[i]._tracking = false;
        this._images[i].fire('untracked');
      } else if (!this._images[i]._tracking && index[i]) {
        this._images[i]._tracking = true;
        this._images[i].fire('tracked');
      }
    }
  }

  /**
   * True if Image Tracking is supported.
   *
   * @type {boolean}
   */
  get supported() {
    return this._supported;
  }

  /**
   * True if Image Tracking is available. This property will be false if no images were provided
   * for the AR session or there was an error processing the provided images.
   *
   * @type {boolean}
   */
  get available() {
    return this._available;
  }

  /**
   * List of {@link XrTrackedImage} that contain tracking information.
   *
   * @type {XrTrackedImage[]}
   */
  get images() {
    return this._images;
  }
}

export { XrImageTracking };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHItaW1hZ2UtdHJhY2tpbmcuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9mcmFtZXdvcmsveHIveHItaW1hZ2UtdHJhY2tpbmcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vY29yZS9ldmVudC1oYW5kbGVyLmpzJztcbmltcG9ydCB7IHBsYXRmb3JtIH0gZnJvbSAnLi4vLi4vY29yZS9wbGF0Zm9ybS5qcyc7XG5cbmltcG9ydCB7IFhyVHJhY2tlZEltYWdlIH0gZnJvbSAnLi94ci10cmFja2VkLWltYWdlLmpzJztcblxuLyoqXG4gKiBJbWFnZSBUcmFja2luZyBwcm92aWRlcyB0aGUgYWJpbGl0eSB0byB0cmFjayByZWFsIHdvcmxkIGltYWdlcyBieSBwcm92aWRlZCBpbWFnZSBzYW1wbGVzIGFuZFxuICogdGhlaXIgZXN0aW1hdGVkIHNpemVzLlxuICpcbiAqIEBhdWdtZW50cyBFdmVudEhhbmRsZXJcbiAqL1xuY2xhc3MgWHJJbWFnZVRyYWNraW5nIGV4dGVuZHMgRXZlbnRIYW5kbGVyIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7aW1wb3J0KCcuL3hyLW1hbmFnZXIuanMnKS5Yck1hbmFnZXJ9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFuYWdlcjtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3N1cHBvcnRlZCA9IHBsYXRmb3JtLmJyb3dzZXIgJiYgISF3aW5kb3cuWFJJbWFnZVRyYWNraW5nUmVzdWx0O1xuXG4gICAgIC8qKlxuICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICogQHByaXZhdGVcbiAgICAgICovXG4gICAgX2F2YWlsYWJsZSA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge1hyVHJhY2tlZEltYWdlW119XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaW1hZ2VzID0gW107XG5cbiAgICAvKipcbiAgICAgKiBJbWFnZSBUcmFja2luZyBwcm92aWRlcyB0aGUgYWJpbGl0eSB0byB0cmFjayByZWFsIHdvcmxkIGltYWdlcyBieSBwcm92aWRlZCBpbWFnZSBzYW1wbGVzIGFuZFxuICAgICAqIHRoZWlyIGVzdGltYXRlIHNpemVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtpbXBvcnQoJy4veHItbWFuYWdlci5qcycpLlhyTWFuYWdlcn0gbWFuYWdlciAtIFdlYlhSIE1hbmFnZXIuXG4gICAgICogQGhpZGVjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmFnZXIpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLl9tYW5hZ2VyID0gbWFuYWdlcjtcblxuICAgICAgICBpZiAodGhpcy5fc3VwcG9ydGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9tYW5hZ2VyLm9uKCdzdGFydCcsIHRoaXMuX29uU2Vzc2lvblN0YXJ0LCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuX21hbmFnZXIub24oJ2VuZCcsIHRoaXMuX29uU2Vzc2lvbkVuZCwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlZCB3aGVuIHRoZSBYUiBzZXNzaW9uIGlzIHN0YXJ0ZWQsIGJ1dCBpbWFnZSB0cmFja2luZyBmYWlsZWQgdG8gcHJvY2VzcyB0aGUgcHJvdmlkZWRcbiAgICAgKiBpbWFnZXMuXG4gICAgICpcbiAgICAgKiBAZXZlbnQgWHJJbWFnZVRyYWNraW5nI2Vycm9yXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXJyb3IgLSBFcnJvciBvYmplY3QgcmVsYXRlZCB0byBhIGZhaWx1cmUgb2YgaW1hZ2UgdHJhY2tpbmcuXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYW4gaW1hZ2UgZm9yIGltYWdlIHRyYWNraW5nLiBBIHdpZHRoIGNhbiBhbHNvIGJlIHByb3ZpZGVkIHRvIGhlbHAgdGhlIHVuZGVybHlpbmcgc3lzdGVtXG4gICAgICogZXN0aW1hdGUgdGhlIGFwcHJvcHJpYXRlIHRyYW5zZm9ybWF0aW9uLiBNb2RpZnlpbmcgdGhlIHRyYWNrZWQgaW1hZ2VzIGxpc3QgaXMgb25seSBwb3NzaWJsZVxuICAgICAqIGJlZm9yZSBhbiBBUiBzZXNzaW9uIGlzIHN0YXJ0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fEhUTUxJbWFnZUVsZW1lbnR8U1ZHSW1hZ2VFbGVtZW50fEhUTUxWaWRlb0VsZW1lbnR8QmxvYnxJbWFnZURhdGF8SW1hZ2VCaXRtYXB9IGltYWdlIC0gSW1hZ2VcbiAgICAgKiB0aGF0IGlzIG1hdGNoaW5nIHJlYWwgd29ybGQgaW1hZ2UgYXMgY2xvc2UgYXMgcG9zc2libGUuIFJlc29sdXRpb24gb2YgaW1hZ2VzIHNob3VsZCBiZSBhdFxuICAgICAqIGxlYXN0IDMwMHgzMDAuIEhpZ2ggcmVzb2x1dGlvbiBkb2VzIE5PVCBpbXByb3ZlIHRyYWNraW5nIHBlcmZvcm1hbmNlLiBDb2xvciBvZiBpbWFnZSBpc1xuICAgICAqIGlycmVsZXZhbnQsIHNvIGdyYXlzY2FsZSBpbWFnZXMgY2FuIGJlIHVzZWQuIEltYWdlcyB3aXRoIHRvbyBtYW55IGdlb21ldHJpYyBmZWF0dXJlcyBvclxuICAgICAqIHJlcGVhdGluZyBwYXR0ZXJucyB3aWxsIHJlZHVjZSB0cmFja2luZyBzdGFiaWxpdHkuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gV2lkdGggKGluIG1ldGVycykgb2YgaW1hZ2UgaW4gdGhlIHJlYWwgd29ybGQuIFByb3ZpZGluZyB0aGlzIHZhbHVlXG4gICAgICogYXMgY2xvc2UgdG8gdGhlIHJlYWwgdmFsdWUgd2lsbCBpbXByb3ZlIHRyYWNraW5nIHF1YWxpdHkuXG4gICAgICogQHJldHVybnMge1hyVHJhY2tlZEltYWdlfG51bGx9IFRyYWNrZWQgaW1hZ2Ugb2JqZWN0IHRoYXQgd2lsbCBjb250YWluIHRyYWNraW5nIGluZm9ybWF0aW9uLlxuICAgICAqIFJldHVybnMgbnVsbCBpZiBpbWFnZSB0cmFja2luZyBpcyBub3Qgc3VwcG9ydGVkIG9yIGlmIHRoZSBYUiBtYW5hZ2VyIGlzIG5vdCBhY3RpdmUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBpbWFnZSB3aXRoIHdpZHRoIG9mIDIwY20gKDAuMm0pXG4gICAgICogYXBwLnhyLmltYWdlVHJhY2tpbmcuYWRkKGJvb2tDb3ZlckltZywgMC4yKTtcbiAgICAgKi9cbiAgICBhZGQoaW1hZ2UsIHdpZHRoKSB7XG4gICAgICAgIGlmICghdGhpcy5fc3VwcG9ydGVkIHx8IHRoaXMuX21hbmFnZXIuYWN0aXZlKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCB0cmFja2VkSW1hZ2UgPSBuZXcgWHJUcmFja2VkSW1hZ2UoaW1hZ2UsIHdpZHRoKTtcbiAgICAgICAgdGhpcy5faW1hZ2VzLnB1c2godHJhY2tlZEltYWdlKTtcbiAgICAgICAgcmV0dXJuIHRyYWNrZWRJbWFnZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYW4gaW1hZ2UgZnJvbSBpbWFnZSB0cmFja2luZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WHJUcmFja2VkSW1hZ2V9IHRyYWNrZWRJbWFnZSAtIFRyYWNrZWQgaW1hZ2UgdG8gYmUgcmVtb3ZlZC4gTW9kaWZ5aW5nIHRoZSB0cmFja2VkXG4gICAgICogaW1hZ2VzIGxpc3QgaXMgb25seSBwb3NzaWJsZSBiZWZvcmUgYW4gQVIgc2Vzc2lvbiBpcyBzdGFydGVkLlxuICAgICAqL1xuICAgIHJlbW92ZSh0cmFja2VkSW1hZ2UpIHtcbiAgICAgICAgaWYgKHRoaXMuX21hbmFnZXIuYWN0aXZlKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgaW5kID0gdGhpcy5faW1hZ2VzLmluZGV4T2YodHJhY2tlZEltYWdlKTtcbiAgICAgICAgaWYgKGluZCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRyYWNrZWRJbWFnZS5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLl9pbWFnZXMuc3BsaWNlKGluZCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQHByaXZhdGUgKi9cbiAgICBfb25TZXNzaW9uU3RhcnQoKSB7XG4gICAgICAgIHRoaXMuX21hbmFnZXIuc2Vzc2lvbi5nZXRUcmFja2VkSW1hZ2VTY29yZXMoKS50aGVuKChpbWFnZXMpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2F2YWlsYWJsZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW1hZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW1hZ2VzW2ldLl90cmFja2FibGUgPSBpbWFnZXNbaV0gPT09ICd0cmFja2FibGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9hdmFpbGFibGUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKiogQHByaXZhdGUgKi9cbiAgICBfb25TZXNzaW9uRW5kKCkge1xuICAgICAgICB0aGlzLl9hdmFpbGFibGUgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2ltYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSB0aGlzLl9pbWFnZXNbaV07XG4gICAgICAgICAgICBpbWFnZS5fcG9zZSA9IG51bGw7XG4gICAgICAgICAgICBpbWFnZS5fbWVhc3VyZWRXaWR0aCA9IDA7XG5cbiAgICAgICAgICAgIGlmIChpbWFnZS5fdHJhY2tpbmcpIHtcbiAgICAgICAgICAgICAgICBpbWFnZS5fdHJhY2tpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpbWFnZS5maXJlKCd1bnRyYWNrZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gY2FsbCB3aGVuIGFsbCBpbWFnZXMgaGF2ZSBiZWVuIHByZXBhcmVkIGFzIGltYWdlXG4gICAgICogYml0bWFwcy5cbiAgICAgKiBAaWdub3JlXG4gICAgICovXG4gICAgcHJlcGFyZUltYWdlcyhjYWxsYmFjaykge1xuICAgICAgICBpZiAodGhpcy5faW1hZ2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgUHJvbWlzZS5hbGwodGhpcy5faW1hZ2VzLm1hcChmdW5jdGlvbiAodHJhY2tlZEltYWdlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYWNrZWRJbWFnZS5wcmVwYXJlKCk7XG4gICAgICAgICAgICB9KSkudGhlbihmdW5jdGlvbiAoYml0bWFwcykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGJpdG1hcHMpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIG51bGwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHsqfSBmcmFtZSAtIFhSRnJhbWUgZnJvbSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgY2FsbGJhY2suXG4gICAgICogQGlnbm9yZVxuICAgICAqL1xuICAgIHVwZGF0ZShmcmFtZSkge1xuICAgICAgICBpZiAoIXRoaXMuX2F2YWlsYWJsZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBmcmFtZS5nZXRJbWFnZVRyYWNraW5nUmVzdWx0cygpO1xuICAgICAgICBjb25zdCBpbmRleCA9IHsgfTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGluZGV4W3Jlc3VsdHNbaV0uaW5kZXhdID0gcmVzdWx0c1tpXTtcblxuICAgICAgICAgICAgY29uc3QgdHJhY2tlZEltYWdlID0gdGhpcy5faW1hZ2VzW3Jlc3VsdHNbaV0uaW5kZXhdO1xuICAgICAgICAgICAgdHJhY2tlZEltYWdlLl9lbXVsYXRlZCA9IHJlc3VsdHNbaV0udHJhY2tpbmdTdGF0ZSA9PT0gJ2VtdWxhdGVkJztcbiAgICAgICAgICAgIHRyYWNrZWRJbWFnZS5fbWVhc3VyZWRXaWR0aCA9IHJlc3VsdHNbaV0ubWVhc3VyZWRXaWR0aEluTWV0ZXJzO1xuICAgICAgICAgICAgdHJhY2tlZEltYWdlLl9wb3NlID0gZnJhbWUuZ2V0UG9zZShyZXN1bHRzW2ldLmltYWdlU3BhY2UsIHRoaXMuX21hbmFnZXIuX3JlZmVyZW5jZVNwYWNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5faW1hZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faW1hZ2VzW2ldLl90cmFja2luZyAmJiAhaW5kZXhbaV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbWFnZXNbaV0uX3RyYWNraW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5faW1hZ2VzW2ldLmZpcmUoJ3VudHJhY2tlZCcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5faW1hZ2VzW2ldLl90cmFja2luZyAmJiBpbmRleFtpXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ltYWdlc1tpXS5fdHJhY2tpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ltYWdlc1tpXS5maXJlKCd0cmFja2VkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcnVlIGlmIEltYWdlIFRyYWNraW5nIGlzIHN1cHBvcnRlZC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIGdldCBzdXBwb3J0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBwb3J0ZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJ1ZSBpZiBJbWFnZSBUcmFja2luZyBpcyBhdmFpbGFibGUuIFRoaXMgcHJvcGVydHkgd2lsbCBiZSBmYWxzZSBpZiBubyBpbWFnZXMgd2VyZSBwcm92aWRlZFxuICAgICAqIGZvciB0aGUgQVIgc2Vzc2lvbiBvciB0aGVyZSB3YXMgYW4gZXJyb3IgcHJvY2Vzc2luZyB0aGUgcHJvdmlkZWQgaW1hZ2VzLlxuICAgICAqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGF2YWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F2YWlsYWJsZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMaXN0IG9mIHtAbGluayBYclRyYWNrZWRJbWFnZX0gdGhhdCBjb250YWluIHRyYWNraW5nIGluZm9ybWF0aW9uLlxuICAgICAqXG4gICAgICogQHR5cGUge1hyVHJhY2tlZEltYWdlW119XG4gICAgICovXG4gICAgZ2V0IGltYWdlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ltYWdlcztcbiAgICB9XG59XG5cbmV4cG9ydCB7IFhySW1hZ2VUcmFja2luZyB9O1xuIl0sIm5hbWVzIjpbIlhySW1hZ2VUcmFja2luZyIsIkV2ZW50SGFuZGxlciIsImNvbnN0cnVjdG9yIiwibWFuYWdlciIsIl9tYW5hZ2VyIiwiX3N1cHBvcnRlZCIsInBsYXRmb3JtIiwiYnJvd3NlciIsIndpbmRvdyIsIlhSSW1hZ2VUcmFja2luZ1Jlc3VsdCIsIl9hdmFpbGFibGUiLCJfaW1hZ2VzIiwib24iLCJfb25TZXNzaW9uU3RhcnQiLCJfb25TZXNzaW9uRW5kIiwiYWRkIiwiaW1hZ2UiLCJ3aWR0aCIsImFjdGl2ZSIsInRyYWNrZWRJbWFnZSIsIlhyVHJhY2tlZEltYWdlIiwicHVzaCIsInJlbW92ZSIsImluZCIsImluZGV4T2YiLCJkZXN0cm95Iiwic3BsaWNlIiwic2Vzc2lvbiIsImdldFRyYWNrZWRJbWFnZVNjb3JlcyIsInRoZW4iLCJpbWFnZXMiLCJpIiwibGVuZ3RoIiwiX3RyYWNrYWJsZSIsImNhdGNoIiwiZXJyIiwiZmlyZSIsIl9wb3NlIiwiX21lYXN1cmVkV2lkdGgiLCJfdHJhY2tpbmciLCJwcmVwYXJlSW1hZ2VzIiwiY2FsbGJhY2siLCJQcm9taXNlIiwiYWxsIiwibWFwIiwicHJlcGFyZSIsImJpdG1hcHMiLCJ1cGRhdGUiLCJmcmFtZSIsInJlc3VsdHMiLCJnZXRJbWFnZVRyYWNraW5nUmVzdWx0cyIsImluZGV4IiwiX2VtdWxhdGVkIiwidHJhY2tpbmdTdGF0ZSIsIm1lYXN1cmVkV2lkdGhJbk1ldGVycyIsImdldFBvc2UiLCJpbWFnZVNwYWNlIiwiX3JlZmVyZW5jZVNwYWNlIiwic3VwcG9ydGVkIiwiYXZhaWxhYmxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQSxlQUFlLFNBQVNDLFlBQVksQ0FBQztBQUN2QztBQUNKO0FBQ0E7QUFDQTs7QUFHSTtBQUNKO0FBQ0E7QUFDQTs7QUFHSztBQUNMO0FBQ0E7QUFDQTs7QUFHSTtBQUNKO0FBQ0E7QUFDQTs7QUFHSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNJQyxXQUFXQSxDQUFDQyxPQUFPLEVBQUU7QUFDakIsSUFBQSxLQUFLLEVBQUUsQ0FBQTtBQUFDLElBQUEsSUFBQSxDQTVCWkMsUUFBUSxHQUFBLEtBQUEsQ0FBQSxDQUFBO0lBQUEsSUFNUkMsQ0FBQUEsVUFBVSxHQUFHQyxRQUFRLENBQUNDLE9BQU8sSUFBSSxDQUFDLENBQUNDLE1BQU0sQ0FBQ0MscUJBQXFCLENBQUE7SUFBQSxJQU0vREMsQ0FBQUEsVUFBVSxHQUFHLEtBQUssQ0FBQTtJQUFBLElBTWxCQyxDQUFBQSxPQUFPLEdBQUcsRUFBRSxDQUFBO0lBWVIsSUFBSSxDQUFDUCxRQUFRLEdBQUdELE9BQU8sQ0FBQTtJQUV2QixJQUFJ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
