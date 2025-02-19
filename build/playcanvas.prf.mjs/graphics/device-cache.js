/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
class DeviceCache {
  constructor() {
    this._cache = new Map();
  }

  get(device, onCreate) {
    if (!this._cache.has(device)) {
      this._cache.set(device, onCreate());

      device.on('destroy', () => {
        this.remove(device);
      });
    }

    return this._cache.get(device);
  }

  remove(device) {
    var _this$_cache$get;

    (_this$_cache$get = this._cache.get(device)) == null ? void 0 : _this$_cache$get.destroy();

    this._cache.delete(device);
  }

}

export { DeviceCache };
