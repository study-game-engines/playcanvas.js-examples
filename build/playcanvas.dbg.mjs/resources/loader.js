/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../core/debug.js';

class ResourceLoader {
  constructor(app) {
    this._handlers = {};
    this._requests = {};
    this._cache = {};
    this._app = app;
  }

  addHandler(type, handler) {
    this._handlers[type] = handler;
    handler._loader = this;
  }

  removeHandler(type) {
    delete this._handlers[type];
  }

  getHandler(type) {
    return this._handlers[type];
  }

  load(url, type, callback, asset) {
    const handler = this._handlers[type];

    if (!handler) {
      const err = `No resource handler for asset type: '${type}' when loading [${url}]`;
      Debug.warnOnce(err);
      callback(err);
      return;
    }

    if (!url) {
      this._loadNull(handler, callback, asset);

      return;
    }

    const key = url + type;

    if (this._cache[key] !== undefined) {
      callback(null, this._cache[key]);
    } else if (this._requests[key]) {
      this._requests[key].push(callback);
    } else {
      this._requests[key] = [callback];
      const self = this;

      const handleLoad = function handleLoad(err, urlObj) {
        if (err) {
          self._onFailure(key, err);

          return;
        }

        handler.load(urlObj, function (err, data, extra) {
          if (!self._requests[key]) {
            return;
          }

          if (err) {
            self._onFailure(key, err);

            return;
          }

          try {
            self._onSuccess(key, handler.open(urlObj.original, data, asset), extra);
          } catch (e) {
            self._onFailure(key, e);
          }
        }, asset);
      };

      const normalizedUrl = url.split('?')[0];

      if (this._app.enableBundles && this._app.bundles.hasUrl(normalizedUrl)) {
        if (!this._app.bundles.canLoadUrl(normalizedUrl)) {
          handleLoad(`Bundle for ${url} not loaded yet`);
          return;
        }

        this._app.bundles.loadUrl(normalizedUrl, function (err, fileUrlFromBundle) {
          handleLoad(err, {
            load: fileUrlFromBundle,
            original: normalizedUrl
          });
        });
      } else {
        handleLoad(null, {
          load: url,
          original: asset && asset.file.filename || url
        });
      }
    }
  }

  _loadNull(handler, callback, asset) {
    const onLoad = function onLoad(err, data, extra) {
      if (err) {
        callback(err);
      } else {
        try {
          callback(null, handler.open(null, data, asset), extra);
        } catch (e) {
          callback(e);
        }
      }
    };

    handler.load(null, onLoad, asset);
  }

  _onSuccess(key, result, extra) {
    this._cache[key] = result;

    for (let i = 0; i < this._requests[key].length; i++) {
      this._requests[key][i](null, result, extra);
    }

    delete this._requests[key];
  }

  _onFailure(key, err) {
    console.error(err);

    if (this._requests[key]) {
      for (let i = 0; i < this._requests[key].length; i++) {
        this._requests[key][i](err);
      }

      delete this._requests[key];
    }
  }

  open(type, data) {
    const handler = this._handlers[type];

    if (!handler) {
      console.warn('No resource handler found for: ' + type);
      return data;
    }

    return handler.open(null, data);
  }

  patch(asset, assets) {
    const handler = this._handlers[asset.type];

    if (!handler) {
      console.warn('No resource handler found for: ' + asset.type);
      return;
    }

    if (handler.patch) {
      handler.patch(asset, assets);
    }
  }

  clearCache(url, type) {
    delete this._cache[url + type];
  }

  getFromCache(url, type) {
    if (this._cache[url + type]) {
      return this._cache[url + type];
    }

    return undefined;
  }

  enableRetry(maxRetries = 5) {
    maxRetries = Math.max(0, maxRetries) || 0;

    for (const key in this._handlers) {
      this._handlers[key].maxRetries = maxRetries;
    }
  }

  disableRetry() {
    for (const key in this._handlers) {
      this._handlers[key].maxRetries = 0;
    }
  }

  destroy() {
    this._handlers = {};
    this._requests = {};
    this._cache = {};
  }

}

export { ResourceLoader };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcmVzb3VyY2VzL2xvYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQHR5cGVkZWYge2ltcG9ydCgnLi4vYXNzZXQvYXNzZXQuanMnKS5Bc3NldH0gQXNzZXQgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9hc3NldC9hc3NldC1yZWdpc3RyeS5qcycpLkFzc2V0UmVnaXN0cnl9IEFzc2V0UmVnaXN0cnkgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9mcmFtZXdvcmsvYXBwLWJhc2UuanMnKS5BcHBCYXNlfSBBcHBCYXNlICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9oYW5kbGVyLmpzJykuUmVzb3VyY2VIYW5kbGVyfSBSZXNvdXJjZUhhbmRsZXIgKi9cblxuaW1wb3J0IHsgRGVidWcgfSBmcm9tICcuLi9jb3JlL2RlYnVnLmpzJztcblxuLyoqXG4gKiBDYWxsYmFjayB1c2VkIGJ5IHtAbGluayBSZXNvdXJjZUxvYWRlciNsb2FkfSB3aGVuIGEgcmVzb3VyY2UgaXMgbG9hZGVkIChvciBhbiBlcnJvciBvY2N1cnMpLlxuICpcbiAqIEBjYWxsYmFjayBSZXNvdXJjZUxvYWRlckNhbGxiYWNrXG4gKiBAcGFyYW0ge3N0cmluZ3xudWxsfSBlcnIgLSBUaGUgZXJyb3IgbWVzc2FnZSBpbiB0aGUgY2FzZSB3aGVyZSB0aGUgbG9hZCBmYWlscy5cbiAqIEBwYXJhbSB7Kn0gW3Jlc291cmNlXSAtIFRoZSByZXNvdXJjZSB0aGF0IGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBsb2FkZWQuXG4gKi9cblxuLyoqXG4gKiBMb2FkIHJlc291cmNlIGRhdGEsIHBvdGVudGlhbGx5IGZyb20gcmVtb3RlIHNvdXJjZXMuIENhY2hlcyByZXNvdXJjZSBvbiBsb2FkIHRvIHByZXZlbnQgbXVsdGlwbGVcbiAqIHJlcXVlc3RzLiBBZGQgUmVzb3VyY2VIYW5kbGVycyB0byBoYW5kbGUgZGlmZmVyZW50IHR5cGVzIG9mIHJlc291cmNlcy5cbiAqL1xuY2xhc3MgUmVzb3VyY2VMb2FkZXIge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBSZXNvdXJjZUxvYWRlciBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXBwQmFzZX0gYXBwIC0gVGhlIGFwcGxpY2F0aW9uLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGFwcCkge1xuICAgICAgICB0aGlzLl9oYW5kbGVycyA9IHt9O1xuICAgICAgICB0aGlzLl9yZXF1ZXN0cyA9IHt9O1xuICAgICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgICAgICB0aGlzLl9hcHAgPSBhcHA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEge0BsaW5rIFJlc291cmNlSGFuZGxlcn0gZm9yIGEgcmVzb3VyY2UgdHlwZS4gSGFuZGxlciBzaG91bGQgc3VwcG9ydCBhdCBsZWFzdCBgbG9hZCgpYFxuICAgICAqIGFuZCBgb3BlbigpYC4gSGFuZGxlcnMgY2FuIG9wdGlvbmFsbHkgc3VwcG9ydCBwYXRjaChhc3NldCwgYXNzZXRzKSB0byBoYW5kbGUgZGVwZW5kZW5jaWVzIG9uXG4gICAgICogb3RoZXIgYXNzZXRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBUaGUgbmFtZSBvZiB0aGUgcmVzb3VyY2UgdHlwZSB0aGF0IHRoZSBoYW5kbGVyIHdpbGwgYmUgcmVnaXN0ZXJlZFxuICAgICAqIHdpdGguIENhbiBiZTpcbiAgICAgKlxuICAgICAqIC0ge0BsaW5rIEFTU0VUX0FOSU1BVElPTn1cbiAgICAgKiAtIHtAbGluayBBU1NFVF9BVURJT31cbiAgICAgKiAtIHtAbGluayBBU1NFVF9JTUFHRX1cbiAgICAgKiAtIHtAbGluayBBU1NFVF9KU09OfVxuICAgICAqIC0ge0BsaW5rIEFTU0VUX01PREVMfVxuICAgICAqIC0ge0BsaW5rIEFTU0VUX01BVEVSSUFMfVxuICAgICAqIC0ge0BsaW5rIEFTU0VUX1RFWFR9XG4gICAgICogLSB7QGxpbmsgQVNTRVRfVEVYVFVSRX1cbiAgICAgKiAtIHtAbGluayBBU1NFVF9DVUJFTUFQfVxuICAgICAqIC0ge0BsaW5rIEFTU0VUX1NIQURFUn1cbiAgICAgKiAtIHtAbGluayBBU1NFVF9DU1N9XG4gICAgICogLSB7QGxpbmsgQVNTRVRfSFRNTH1cbiAgICAgKiAtIHtAbGluayBBU1NFVF9TQ1JJUFR9XG4gICAgICogLSB7QGxpbmsgQVNTRVRfQ09OVEFJTkVSfVxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZXNvdXJjZUhhbmRsZXJ9IGhhbmRsZXIgLSBBbiBpbnN0YW5jZSBvZiBhIHJlc291cmNlIGhhbmRsZXIgc3VwcG9ydGluZyBhdCBsZWFzdFxuICAgICAqIGBsb2FkKClgIGFuZCBgb3BlbigpYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBsb2FkZXIgPSBuZXcgUmVzb3VyY2VMb2FkZXIoKTtcbiAgICAgKiBsb2FkZXIuYWRkSGFuZGxlcihcImpzb25cIiwgbmV3IHBjLkpzb25IYW5kbGVyKCkpO1xuICAgICAqL1xuICAgIGFkZEhhbmRsZXIodHlwZSwgaGFuZGxlcikge1xuICAgICAgICB0aGlzLl9oYW5kbGVyc1t0eXBlXSA9IGhhbmRsZXI7XG4gICAgICAgIGhhbmRsZXIuX2xvYWRlciA9IHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEge0BsaW5rIFJlc291cmNlSGFuZGxlcn0gZm9yIGEgcmVzb3VyY2UgdHlwZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gVGhlIG5hbWUgb2YgdGhlIHR5cGUgdGhhdCB0aGUgaGFuZGxlciB3aWxsIGJlIHJlbW92ZWQuXG4gICAgICovXG4gICAgcmVtb3ZlSGFuZGxlcih0eXBlKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9oYW5kbGVyc1t0eXBlXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSB7QGxpbmsgUmVzb3VyY2VIYW5kbGVyfSBmb3IgYSByZXNvdXJjZSB0eXBlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBUaGUgbmFtZSBvZiB0aGUgcmVzb3VyY2UgdHlwZSB0aGF0IHRoZSBoYW5kbGVyIGlzIHJlZ2lzdGVyZWQgd2l0aC5cbiAgICAgKiBAcmV0dXJucyB7UmVzb3VyY2VIYW5kbGVyfSBUaGUgcmVnaXN0ZXJlZCBoYW5kbGVyLlxuICAgICAqL1xuICAgIGdldEhhbmRsZXIodHlwZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlcnNbdHlwZV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFrZSBhIHJlcXVlc3QgZm9yIGEgcmVzb3VyY2UgZnJvbSBhIHJlbW90ZSBVUkwuIFBhcnNlIHRoZSByZXR1cm5lZCBkYXRhIHVzaW5nIHRoZSBoYW5kbGVyXG4gICAgICogZm9yIHRoZSBzcGVjaWZpZWQgdHlwZS4gV2hlbiBsb2FkZWQgYW5kIHBhcnNlZCwgdXNlIHRoZSBjYWxsYmFjayB0byByZXR1cm4gYW4gaW5zdGFuY2Ugb2ZcbiAgICAgKiB0aGUgcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVGhlIFVSTCBvZiB0aGUgcmVzb3VyY2UgdG8gbG9hZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIFRoZSB0eXBlIG9mIHJlc291cmNlIGV4cGVjdGVkLlxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2VMb2FkZXJDYWxsYmFja30gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgdXNlZCB3aGVuIHRoZSByZXNvdXJjZSBpcyBsb2FkZWQgb3JcbiAgICAgKiBhbiBlcnJvciBvY2N1cnMuIFBhc3NlZCAoZXJyLCByZXNvdXJjZSkgd2hlcmUgZXJyIGlzIG51bGwgaWYgdGhlcmUgYXJlIG5vIGVycm9ycy5cbiAgICAgKiBAcGFyYW0ge0Fzc2V0fSBbYXNzZXRdIC0gT3B0aW9uYWwgYXNzZXQgdGhhdCBpcyBwYXNzZWQgaW50byBoYW5kbGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBhcHAubG9hZGVyLmxvYWQoXCIuLi9wYXRoL3RvL3RleHR1cmUucG5nXCIsIFwidGV4dHVyZVwiLCBmdW5jdGlvbiAoZXJyLCB0ZXh0dXJlKSB7XG4gICAgICogICAgIC8vIHVzZSB0ZXh0dXJlIGhlcmVcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBsb2FkKHVybCwgdHlwZSwgY2FsbGJhY2ssIGFzc2V0KSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLl9oYW5kbGVyc1t0eXBlXTtcbiAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBgTm8gcmVzb3VyY2UgaGFuZGxlciBmb3IgYXNzZXQgdHlwZTogJyR7dHlwZX0nIHdoZW4gbG9hZGluZyBbJHt1cmx9XWA7XG4gICAgICAgICAgICBEZWJ1Zy53YXJuT25jZShlcnIpO1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhbmRsZSByZXF1ZXN0cyB3aXRoIG51bGwgZmlsZVxuICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgdGhpcy5fbG9hZE51bGwoaGFuZGxlciwgY2FsbGJhY2ssIGFzc2V0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGtleSA9IHVybCArIHR5cGU7XG5cbiAgICAgICAgaWYgKHRoaXMuX2NhY2hlW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gaW4gY2FjaGVcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHRoaXMuX2NhY2hlW2tleV0pO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3JlcXVlc3RzW2tleV0pIHtcbiAgICAgICAgICAgIC8vIGV4aXN0aW5nIHJlcXVlc3RcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RzW2tleV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBuZXcgcmVxdWVzdFxuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdHNba2V5XSA9IFtjYWxsYmFja107XG5cbiAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICBjb25zdCBoYW5kbGVMb2FkID0gZnVuY3Rpb24gKGVyciwgdXJsT2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9vbkZhaWx1cmUoa2V5LCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlci5sb2FkKHVybE9iaiwgZnVuY3Rpb24gKGVyciwgZGF0YSwgZXh0cmEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIGtleSBleGlzdHMgYmVjYXVzZSBsb2FkZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gbWlnaHQgaGF2ZSBiZWVuIGRlc3Ryb3llZCBieSBub3dcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWxmLl9yZXF1ZXN0c1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9vbkZhaWx1cmUoa2V5LCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX29uU3VjY2VzcyhrZXksIGhhbmRsZXIub3Blbih1cmxPYmoub3JpZ2luYWwsIGRhdGEsIGFzc2V0KSwgZXh0cmEpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9vbkZhaWx1cmUoa2V5LCBlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGFzc2V0KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRVcmwgPSB1cmwuc3BsaXQoJz8nKVswXTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hcHAuZW5hYmxlQnVuZGxlcyAmJiB0aGlzLl9hcHAuYnVuZGxlcy5oYXNVcmwobm9ybWFsaXplZFVybCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2FwcC5idW5kbGVzLmNhbkxvYWRVcmwobm9ybWFsaXplZFVybCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlTG9hZChgQnVuZGxlIGZvciAke3VybH0gbm90IGxvYWRlZCB5ZXRgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX2FwcC5idW5kbGVzLmxvYWRVcmwobm9ybWFsaXplZFVybCwgZnVuY3Rpb24gKGVyciwgZmlsZVVybEZyb21CdW5kbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlTG9hZChlcnIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWQ6IGZpbGVVcmxGcm9tQnVuZGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWw6IG5vcm1hbGl6ZWRVcmxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhhbmRsZUxvYWQobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICBsb2FkOiB1cmwsXG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsOiBhc3NldCAmJiBhc3NldC5maWxlLmZpbGVuYW1lIHx8IHVybFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbG9hZCBhbiBhc3NldCB3aXRoIG5vIHVybCwgc2tpcHBpbmcgYnVuZGxlcyBhbmQgY2FjaGluZ1xuICAgIF9sb2FkTnVsbChoYW5kbGVyLCBjYWxsYmFjaywgYXNzZXQpIHtcbiAgICAgICAgY29uc3Qgb25Mb2FkID0gZnVuY3Rpb24gKGVyciwgZGF0YSwgZXh0cmEpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBoYW5kbGVyLm9wZW4obnVsbCwgZGF0YSwgYXNzZXQpLCBleHRyYSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGhhbmRsZXIubG9hZChudWxsLCBvbkxvYWQsIGFzc2V0KTtcbiAgICB9XG5cbiAgICBfb25TdWNjZXNzKGtleSwgcmVzdWx0LCBleHRyYSkge1xuICAgICAgICB0aGlzLl9jYWNoZVtrZXldID0gcmVzdWx0O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3JlcXVlc3RzW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RzW2tleV1baV0obnVsbCwgcmVzdWx0LCBleHRyYSk7XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIHRoaXMuX3JlcXVlc3RzW2tleV07XG4gICAgfVxuXG4gICAgX29uRmFpbHVyZShrZXksIGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIGlmICh0aGlzLl9yZXF1ZXN0c1trZXldKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3JlcXVlc3RzW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXF1ZXN0c1trZXldW2ldKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcmVxdWVzdHNba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgcmF3IHJlc291cmNlIGRhdGEgaW50byBhIHJlc291cmNlIGluc3RhbmNlLiBFLmcuIFRha2UgM0QgbW9kZWwgZm9ybWF0IEpTT04gYW5kXG4gICAgICogcmV0dXJuIGEge0BsaW5rIE1vZGVsfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gVGhlIHR5cGUgb2YgcmVzb3VyY2UuXG4gICAgICogQHBhcmFtIHsqfSBkYXRhIC0gVGhlIHJhdyByZXNvdXJjZSBkYXRhLlxuICAgICAqIEByZXR1cm5zIHsqfSBUaGUgcGFyc2VkIHJlc291cmNlIGRhdGEuXG4gICAgICovXG4gICAgb3Blbih0eXBlLCBkYXRhKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLl9oYW5kbGVyc1t0eXBlXTtcbiAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIHJlc291cmNlIGhhbmRsZXIgZm91bmQgZm9yOiAnICsgdHlwZSk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBoYW5kbGVyLm9wZW4obnVsbCwgZGF0YSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtIGFueSBvcGVyYXRpb25zIG9uIGEgcmVzb3VyY2UsIHRoYXQgcmVxdWlyZXMgYSBkZXBlbmRlbmN5IG9uIGl0cyBhc3NldCBkYXRhIG9yIGFueVxuICAgICAqIG90aGVyIGFzc2V0IGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Fzc2V0fSBhc3NldCAtIFRoZSBhc3NldCB0byBwYXRjaC5cbiAgICAgKiBAcGFyYW0ge0Fzc2V0UmVnaXN0cnl9IGFzc2V0cyAtIFRoZSBhc3NldCByZWdpc3RyeS5cbiAgICAgKi9cbiAgICBwYXRjaChhc3NldCwgYXNzZXRzKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLl9oYW5kbGVyc1thc3NldC50eXBlXTtcbiAgICAgICAgaWYgKCFoYW5kbGVyKSAge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdObyByZXNvdXJjZSBoYW5kbGVyIGZvdW5kIGZvcjogJyArIGFzc2V0LnR5cGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhbmRsZXIucGF0Y2gpIHtcbiAgICAgICAgICAgIGhhbmRsZXIucGF0Y2goYXNzZXQsIGFzc2V0cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgcmVzb3VyY2UgZnJvbSBjYWNoZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBUaGUgVVJMIG9mIHRoZSByZXNvdXJjZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIFRoZSB0eXBlIG9mIHJlc291cmNlLlxuICAgICAqL1xuICAgIGNsZWFyQ2FjaGUodXJsLCB0eXBlKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9jYWNoZVt1cmwgKyB0eXBlXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBjYWNoZSBmb3IgcmVzb3VyY2UgZnJvbSBhIFVSTC4gSWYgcHJlc2VudCwgcmV0dXJuIHRoZSBjYWNoZWQgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVGhlIFVSTCBvZiB0aGUgcmVzb3VyY2UgdG8gZ2V0IGZyb20gdGhlIGNhY2hlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gVGhlIHR5cGUgb2YgdGhlIHJlc291cmNlLlxuICAgICAqIEByZXR1cm5zIHsqfSBUaGUgcmVzb3VyY2UgbG9hZGVkIGZyb20gdGhlIGNhY2hlLlxuICAgICAqL1xuICAgIGdldEZyb21DYWNoZSh1cmwsIHR5cGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NhY2hlW3VybCArIHR5cGVdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FjaGVbdXJsICsgdHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGVzIHJldHJ5aW5nIG9mIGZhaWxlZCByZXF1ZXN0cyB3aGVuIGxvYWRpbmcgYXNzZXRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG1heFJldHJpZXMgLSBUaGUgbWF4aW11bSBudW1iZXIgb2YgdGltZXMgdG8gcmV0cnkgbG9hZGluZyBhbiBhc3NldC4gRGVmYXVsdHNcbiAgICAgKiB0byA1LlxuICAgICAqIEBpZ25vcmVcbiAgICAgKi9cbiAgICBlbmFibGVSZXRyeShtYXhSZXRyaWVzID0gNSkge1xuICAgICAgICBtYXhSZXRyaWVzID0gTWF0aC5tYXgoMCwgbWF4UmV0cmllcykgfHwgMDtcblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLl9oYW5kbGVycykge1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlcnNba2V5XS5tYXhSZXRyaWVzID0gbWF4UmV0cmllcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc2FibGVzIHJldHJ5aW5nIG9mIGZhaWxlZCByZXF1ZXN0cyB3aGVuIGxvYWRpbmcgYXNzZXRzLlxuICAgICAqXG4gICAgICogQGlnbm9yZVxuICAgICAqL1xuICAgIGRpc2FibGVSZXRyeSgpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5faGFuZGxlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZXJzW2tleV0ubWF4UmV0cmllcyA9IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXN0cm95cyB0aGUgcmVzb3VyY2UgbG9hZGVyLlxuICAgICAqL1xuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuX2hhbmRsZXJzID0ge307XG4gICAgICAgIHRoaXMuX3JlcXVlc3RzID0ge307XG4gICAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgfVxufVxuXG5leHBvcnQgeyBSZXNvdXJjZUxvYWRlciB9O1xuIl0sIm5hbWVzIjpbIlJlc291cmNlTG9hZGVyIiwiY29uc3RydWN0b3IiLCJhcHAiLCJfaGFuZGxlcnMiLCJfcmVxdWVzdHMiLCJfY2FjaGUiLCJfYXBwIiwiYWRkSGFuZGxlciIsInR5cGUiLCJoYW5kbGVyIiwiX2xvYWRlciIsInJlbW92ZUhhbmRsZXIiLCJnZXRIYW5kbGVyIiwibG9hZCIsInVybCIsImNhbGxiYWNrIiwiYXNzZXQiLCJlcnIiLCJEZWJ1ZyIsIndhcm5PbmNlIiwiX2xvYWROdWxsIiwia2V5IiwidW5kZWZpbmVkIiwicHVzaCIsInNlbGYiLCJoYW5kbGVMb2FkIiwidXJsT2JqIiwiX29uRmFpbHVyZSIsImRhdGEiLCJleHRyYSIsIl9vblN1Y2Nlc3MiLCJvcGVuIiwib3JpZ2luYWwiLCJlIiwibm9ybWFsaXplZFVybCIsInNwbGl0IiwiZW5hYmxlQnVuZGxlcyIsImJ1bmRsZXMiLCJoYXNVcmwiLCJjYW5Mb2FkVXJsIiwibG9hZFVybCIsImZpbGVVcmxGcm9tQnVuZGxlIiwiZmlsZSIsImZpbGVuYW1lIiwib25Mb2FkIiwicmVzdWx0IiwiaSIsImxlbmd0aCIsImNvbnNvbGUiLCJlcnJvciIsIndhcm4iLCJwYXRjaCIsImFzc2V0cyIsImNsZWFyQ2FjaGUiLCJnZXRGcm9tQ2FjaGUiLCJlbmFibGVSZXRyeSIsIm1heFJldHJpZXMiLCJNYXRoIiwibWF4IiwiZGlzYWJsZVJldHJ5IiwiZGVzdHJveSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQW1CQSxNQUFNQSxjQUFOLENBQXFCO0VBTWpCQyxXQUFXLENBQUNDLEdBQUQsRUFBTTtJQUNiLElBQUtDLENBQUFB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
