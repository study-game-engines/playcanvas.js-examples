/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
/**
 * A cache storing shared resources associated with a device. The resources are removed
 * from the cache when the device is destroyed.
 *
 * @ignore
 */
class DeviceCache {
  constructor() {
    this._cache = new Map();
  }
  /**
   * Returns the resources for the supplied device.
   *
   * @param {import('./graphics-device.js').GraphicsDevice} device - The graphics device.
   * @returns {any} The resource for the device.
   */
  get(device, onCreate) {
    if (!this._cache.has(device)) {
      this._cache.set(device, onCreate());

      // when the device is destroyed, destroy and remove its entry
      device.on('destroy', () => {
        this.remove(device);
      });

      // when the context is lost, call optional loseContext on its entry
      device.on('devicelost', () => {
        var _this$_cache$get;
        (_this$_cache$get = this._cache.get(device)) == null ? void 0 : _this$_cache$get.loseContext == null ? void 0 : _this$_cache$get.loseContext(device);
      });
    }
    return this._cache.get(device);
  }

  /**
   * Destroys and removes the content of the cache associated with the device
   *
   * @param {import('./graphics-device.js').GraphicsDevice} device - The graphics device.
   */
  remove(device) {
    var _this$_cache$get2;
    (_this$_cache$get2 = this._cache.get(device)) == null ? void 0 : _this$_cache$get2.destroy == null ? void 0 : _this$_cache$get2.destroy(device);
    this._cache.delete(device);
  }
}

export { DeviceCache };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlLWNhY2hlLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvcGxhdGZvcm0vZ3JhcGhpY3MvZGV2aWNlLWNhY2hlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQSBjYWNoZSBzdG9yaW5nIHNoYXJlZCByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIGEgZGV2aWNlLiBUaGUgcmVzb3VyY2VzIGFyZSByZW1vdmVkXG4gKiBmcm9tIHRoZSBjYWNoZSB3aGVuIHRoZSBkZXZpY2UgaXMgZGVzdHJveWVkLlxuICpcbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgRGV2aWNlQ2FjaGUge1xuICAgIC8qKlxuICAgICAqIENhY2hlIHN0b3JpbmcgdGhlIHJlc291cmNlIGZvciBlYWNoIEdyYXBoaWNzRGV2aWNlXG4gICAgICpcbiAgICAgKiBAdHlwZSB7TWFwPGltcG9ydCgnLi9ncmFwaGljcy1kZXZpY2UuanMnKS5HcmFwaGljc0RldmljZSwgYW55Pn1cbiAgICAgKi9cbiAgICBfY2FjaGUgPSBuZXcgTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBzdXBwbGllZCBkZXZpY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi9ncmFwaGljcy1kZXZpY2UuanMnKS5HcmFwaGljc0RldmljZX0gZGV2aWNlIC0gVGhlIGdyYXBoaWNzIGRldmljZS5cbiAgICAgKiBAcmV0dXJucyB7YW55fSBUaGUgcmVzb3VyY2UgZm9yIHRoZSBkZXZpY2UuXG4gICAgICovXG4gICAgZ2V0KGRldmljZSwgb25DcmVhdGUpIHtcblxuICAgICAgICBpZiAoIXRoaXMuX2NhY2hlLmhhcyhkZXZpY2UpKSB7XG4gICAgICAgICAgICB0aGlzLl9jYWNoZS5zZXQoZGV2aWNlLCBvbkNyZWF0ZSgpKTtcblxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgZGV2aWNlIGlzIGRlc3Ryb3llZCwgZGVzdHJveSBhbmQgcmVtb3ZlIGl0cyBlbnRyeVxuICAgICAgICAgICAgZGV2aWNlLm9uKCdkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKGRldmljZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgY29udGV4dCBpcyBsb3N0LCBjYWxsIG9wdGlvbmFsIGxvc2VDb250ZXh0IG9uIGl0cyBlbnRyeVxuICAgICAgICAgICAgZGV2aWNlLm9uKCdkZXZpY2Vsb3N0JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlLmdldChkZXZpY2UpPy5sb3NlQ29udGV4dD8uKGRldmljZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9jYWNoZS5nZXQoZGV2aWNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXN0cm95cyBhbmQgcmVtb3ZlcyB0aGUgY29udGVudCBvZiB0aGUgY2FjaGUgYXNzb2NpYXRlZCB3aXRoIHRoZSBkZXZpY2VcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuL2dyYXBoaWNzLWRldmljZS5qcycpLkdyYXBoaWNzRGV2aWNlfSBkZXZpY2UgLSBUaGUgZ3JhcGhpY3MgZGV2aWNlLlxuICAgICAqL1xuICAgIHJlbW92ZShkZXZpY2UpIHtcbiAgICAgICAgdGhpcy5fY2FjaGUuZ2V0KGRldmljZSk/LmRlc3Ryb3k/LihkZXZpY2UpO1xuICAgICAgICB0aGlzLl9jYWNoZS5kZWxldGUoZGV2aWNlKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IERldmljZUNhY2hlIH07XG4iXSwibmFtZXMiOlsiRGV2aWNlQ2FjaGUiLCJjb25zdHJ1Y3RvciIsIl9jYWNoZSIsIk1hcCIsImdldCIsImRldmljZSIsIm9uQ3JlYXRlIiwiaGFzIiwic2V0Iiwib24iLCJyZW1vdmUiLCJfdGhpcyRfY2FjaGUkZ2V0IiwibG9zZUNvbnRleHQiLCJfdGhpcyRfY2FjaGUkZ2V0MiIsImRlc3Ryb3kiLCJkZWxldGUiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUEsV0FBVyxDQUFDO0VBQUFDLFdBQUEsR0FBQTtBQUFBLElBQUEsSUFBQSxDQU1kQyxNQUFNLEdBQUcsSUFBSUMsR0FBRyxFQUFFLENBQUE7QUFBQSxHQUFBO0FBRWxCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSxHQUFHQSxDQUFDQyxNQUFNLEVBQUVDLFFBQVEsRUFBRTtJQUVsQixJQUFJLENBQUMsSUFBSSxDQUFDSixNQUFNLENBQUNLLEdBQUcsQ0FBQ0YsTUFBTSxDQUFDLEVBQUU7TUFDMUIsSUFBSSxDQUFDSCxNQUFNLENBQUNNLEdBQUcsQ0FBQ0gsTUFBTSxFQUFFQyxRQUFRLEVBQUUsQ0FBQyxDQUFBOztBQUVuQztBQUNBRCxNQUFBQSxNQUFNLENBQUNJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsTUFBTTtBQUN2QixRQUFBLElBQUksQ0FBQ0MsTUFBTSxDQUFDTCxNQUFNLENBQUMsQ0FBQTtBQUN2QixPQUFDLENBQUMsQ0FBQTs7QUFFRjtBQUNBQSxNQUFBQSxNQUFNLENBQUNJLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTTtBQUFBLFFBQUEsSUFBQUUsZ0JBQUEsQ0FBQTtBQUMxQixRQUFBLENBQUFBLGdCQUFBLEdBQUksSUFBQSxDQUFDVCxNQUFNLENBQUNFLEdBQUcsQ0FBQ0MsTUFBTSxDQUFDLHFCQUF2Qk0sZ0JBQUEsQ0FBeUJDLFdBQVcsSUFBcENELElBQUFBLEdBQUFBLEtBQUFBLENBQUFBLEdBQUFBLGdCQUFBLENBQXlCQyxXQUFXLENBQUdQLE1BQU0sQ0FBQyxDQUFBO0FBQ2xELE9BQUMsQ0FBQyxDQUFBO0FBQ04sS0FBQTtBQUVBLElBQUEsT0FBTyxJQUFJLENBQUNILE1BQU0sQ0FBQ0UsR0FBRyxDQUFDQyxNQUFNLENBQUMsQ0FBQTtBQUNsQyxHQUFBOztBQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7RUFDSUssTUFBTUEsQ0FBQ0wsTUFBTSxFQUFFO0FBQUEsSUFBQSxJQUFBUSxpQkFBQSxDQUFBO0FBQ1gsSUFBQSxDQUFBQSxpQkFBQSxHQUFJLElBQUEsQ0FBQ1gsTUFBTSxDQUFDRSxHQUFHLENBQUNDLE1BQU0sQ0FBQyxxQkFBdkJRLGlCQUFBLENBQXlCQyxPQUFPLElBQWhDRCxJQUFBQSxHQUFBQSxLQUFBQSxDQUFBQSxHQUFBQSxpQkFBQSxDQUF5QkMsT0FBTyxDQUFHVCxNQUFNLENBQUMsQ0FBQTtBQUMxQyxJQUFBLElBQUksQ0FBQ0gsTUFBTSxDQUFDYSxNQUFNLENBQUNWLE1BQU0sQ0FBQyxDQUFBO0FBQzlCLEdBQUE7QUFDSjs7OzsifQ==
