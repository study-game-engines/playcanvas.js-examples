/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { path } from '../core/path.js';
import { Debug } from '../core/debug.js';
import { Http, http } from '../net/http.js';
import { GlbModelParser } from './parser/glb-model.js';
import { JsonModelParser } from './parser/json-model.js';
import { getDefaultMaterial } from '../scene/materials/default-material.js';

class ModelHandler {
  constructor(app) {
    this.handlerType = "model";
    this._device = app.graphicsDevice;
    this._parsers = [];
    this._defaultMaterial = getDefaultMaterial(this._device);
    this.maxRetries = 0;
    this.addParser(new JsonModelParser(this._device, this._defaultMaterial), function (url, data) {
      return path.getExtension(url) === '.json';
    });
    this.addParser(new GlbModelParser(this._device, this._defaultMaterial), function (url, data) {
      return path.getExtension(url) === '.glb';
    });
  }

  load(url, callback) {
    if (typeof url === 'string') {
      url = {
        load: url,
        original: url
      };
    }

    const options = {
      retry: this.maxRetries > 0,
      maxRetries: this.maxRetries
    };

    if (url.load.startsWith('blob:') || url.load.startsWith('data:')) {
      if (path.getExtension(url.original).toLowerCase() === '.glb') {
        options.responseType = Http.ResponseType.ARRAY_BUFFER;
      } else {
        options.responseType = Http.ResponseType.JSON;
      }
    }

    http.get(url.load, options, function (err, response) {
      if (!callback) return;

      if (!err) {
        callback(null, response);
      } else {
        callback(`Error loading model: ${url.original} [${err}]`);
      }
    });
  }

  open(url, data) {
    for (let i = 0; i < this._parsers.length; i++) {
      const p = this._parsers[i];

      if (p.decider(url, data)) {
        return p.parser.parse(data);
      }
    }

    Debug.warn('pc.ModelHandler#open: No model parser found for: ' + url);
    return null;
  }

  patch(asset, assets) {
    if (!asset.resource) return;
    const data = asset.data;
    const self = this;
    asset.resource.meshInstances.forEach(function (meshInstance, i) {
      if (data.mapping) {
        const handleMaterial = function handleMaterial(asset) {
          if (asset.resource) {
            meshInstance.material = asset.resource;
          } else {
            asset.once('load', handleMaterial);
            assets.load(asset);
          }

          asset.once('remove', function (asset) {
            if (meshInstance.material === asset.resource) {
              meshInstance.material = self._defaultMaterial;
            }
          });
        };

        if (!data.mapping[i]) {
          meshInstance.material = self._defaultMaterial;
          return;
        }

        const id = data.mapping[i].material;
        const url = data.mapping[i].path;
        let material;

        if (id !== undefined) {
          if (!id) {
            meshInstance.material = self._defaultMaterial;
          } else {
            material = assets.get(id);

            if (material) {
              handleMaterial(material);
            } else {
              assets.once('add:' + id, handleMaterial);
            }
          }
        } else if (url) {
          const path = asset.getAbsoluteUrl(data.mapping[i].path);
          material = assets.getByUrl(path);

          if (material) {
            handleMaterial(material);
          } else {
            assets.once('add:url:' + path, handleMaterial);
          }
        }
      }
    });
  }

  addParser(parser, decider) {
    this._parsers.push({
      parser: parser,
      decider: decider
    });
  }

}

export { ModelHandler };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yZXNvdXJjZXMvbW9kZWwuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGF0aCB9IGZyb20gJy4uL2NvcmUvcGF0aC5qcyc7XG5pbXBvcnQgeyBEZWJ1ZyB9IGZyb20gJy4uL2NvcmUvZGVidWcuanMnO1xuXG5pbXBvcnQgeyBodHRwLCBIdHRwIH0gZnJvbSAnLi4vbmV0L2h0dHAuanMnO1xuXG5pbXBvcnQgeyBHbGJNb2RlbFBhcnNlciB9IGZyb20gJy4vcGFyc2VyL2dsYi1tb2RlbC5qcyc7XG5pbXBvcnQgeyBKc29uTW9kZWxQYXJzZXIgfSBmcm9tICcuL3BhcnNlci9qc29uLW1vZGVsLmpzJztcblxuaW1wb3J0IHsgZ2V0RGVmYXVsdE1hdGVyaWFsIH0gZnJvbSAnLi4vc2NlbmUvbWF0ZXJpYWxzL2RlZmF1bHQtbWF0ZXJpYWwuanMnO1xuXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi4vZnJhbWV3b3JrL2FwcC1iYXNlLmpzJykuQXBwQmFzZX0gQXBwQmFzZSAqL1xuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4vaGFuZGxlci5qcycpLlJlc291cmNlSGFuZGxlcn0gUmVzb3VyY2VIYW5kbGVyICovXG5cbi8qKlxuICogQ2FsbGJhY2sgdXNlZCBieSB7QGxpbmsgTW9kZWxIYW5kbGVyI2FkZFBhcnNlcn0gdG8gZGVjaWRlIG9uIHdoaWNoIHBhcnNlciB0byB1c2UuXG4gKlxuICogQGNhbGxiYWNrIEFkZFBhcnNlckNhbGxiYWNrXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVGhlIHJlc291cmNlIHVybC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gVGhlIHJhdyBtb2RlbCBkYXRhLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybiB0cnVlIGlmIHRoaXMgcGFyc2VyIHNob3VsZCBiZSB1c2VkIHRvIHBhcnNlIHRoZSBkYXRhIGludG8gYVxuICoge0BsaW5rIE1vZGVsfS5cbiAqL1xuXG4vKipcbiAqIFJlc291cmNlIGhhbmRsZXIgdXNlZCBmb3IgbG9hZGluZyB7QGxpbmsgTW9kZWx9IHJlc291cmNlcy5cbiAqXG4gKiBAaW1wbGVtZW50cyB7UmVzb3VyY2VIYW5kbGVyfVxuICovXG5jbGFzcyBNb2RlbEhhbmRsZXIge1xuICAgIC8qKlxuICAgICAqIFR5cGUgb2YgdGhlIHJlc291cmNlIHRoZSBoYW5kbGVyIGhhbmRsZXMuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGhhbmRsZXJUeXBlID0gXCJtb2RlbFwiO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IE1vZGVsSGFuZGxlciBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXBwQmFzZX0gYXBwIC0gVGhlIHJ1bm5pbmcge0BsaW5rIEFwcEJhc2V9LlxuICAgICAqIEBoaWRlY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcbiAgICAgICAgdGhpcy5fZGV2aWNlID0gYXBwLmdyYXBoaWNzRGV2aWNlO1xuICAgICAgICB0aGlzLl9wYXJzZXJzID0gW107XG4gICAgICAgIHRoaXMuX2RlZmF1bHRNYXRlcmlhbCA9IGdldERlZmF1bHRNYXRlcmlhbCh0aGlzLl9kZXZpY2UpO1xuICAgICAgICB0aGlzLm1heFJldHJpZXMgPSAwO1xuXG4gICAgICAgIHRoaXMuYWRkUGFyc2VyKG5ldyBKc29uTW9kZWxQYXJzZXIodGhpcy5fZGV2aWNlLCB0aGlzLl9kZWZhdWx0TWF0ZXJpYWwpLCBmdW5jdGlvbiAodXJsLCBkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gKHBhdGguZ2V0RXh0ZW5zaW9uKHVybCkgPT09ICcuanNvbicpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hZGRQYXJzZXIobmV3IEdsYk1vZGVsUGFyc2VyKHRoaXMuX2RldmljZSwgdGhpcy5fZGVmYXVsdE1hdGVyaWFsKSwgZnVuY3Rpb24gKHVybCwgZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIChwYXRoLmdldEV4dGVuc2lvbih1cmwpID09PSAnLmdsYicpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBsb2FkKHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB1cmwgPSB7XG4gICAgICAgICAgICAgICAgbG9hZDogdXJsLFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsOiB1cmxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHNwZWNpZnkgSlNPTiBmb3IgYmxvYiBVUkxzXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICByZXRyeTogdGhpcy5tYXhSZXRyaWVzID4gMCxcbiAgICAgICAgICAgIG1heFJldHJpZXM6IHRoaXMubWF4UmV0cmllc1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh1cmwubG9hZC5zdGFydHNXaXRoKCdibG9iOicpIHx8IHVybC5sb2FkLnN0YXJ0c1dpdGgoJ2RhdGE6JykpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmdldEV4dGVuc2lvbih1cmwub3JpZ2luYWwpLnRvTG93ZXJDYXNlKCkgPT09ICcuZ2xiJykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVzcG9uc2VUeXBlID0gSHR0cC5SZXNwb25zZVR5cGUuQVJSQVlfQlVGRkVSO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnJlc3BvbnNlVHlwZSA9IEh0dHAuUmVzcG9uc2VUeXBlLkpTT047XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBodHRwLmdldCh1cmwubG9hZCwgb3B0aW9ucywgZnVuY3Rpb24gKGVyciwgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmICghY2FsbGJhY2spXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soYEVycm9yIGxvYWRpbmcgbW9kZWw6ICR7dXJsLm9yaWdpbmFsfSBbJHtlcnJ9XWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvcGVuKHVybCwgZGF0YSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3BhcnNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSB0aGlzLl9wYXJzZXJzW2ldO1xuXG4gICAgICAgICAgICBpZiAocC5kZWNpZGVyKHVybCwgZGF0YSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcC5wYXJzZXIucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgRGVidWcud2FybigncGMuTW9kZWxIYW5kbGVyI29wZW46IE5vIG1vZGVsIHBhcnNlciBmb3VuZCBmb3I6ICcgKyB1cmwpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwYXRjaChhc3NldCwgYXNzZXRzKSB7XG4gICAgICAgIGlmICghYXNzZXQucmVzb3VyY2UpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IGFzc2V0LmRhdGE7XG5cbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGFzc2V0LnJlc291cmNlLm1lc2hJbnN0YW5jZXMuZm9yRWFjaChmdW5jdGlvbiAobWVzaEluc3RhbmNlLCBpKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5tYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlTWF0ZXJpYWwgPSBmdW5jdGlvbiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0LnJlc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNoSW5zdGFuY2UubWF0ZXJpYWwgPSBhc3NldC5yZXNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0Lm9uY2UoJ2xvYWQnLCBoYW5kbGVNYXRlcmlhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldHMubG9hZChhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhc3NldC5vbmNlKCdyZW1vdmUnLCBmdW5jdGlvbiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXNoSW5zdGFuY2UubWF0ZXJpYWwgPT09IGFzc2V0LnJlc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzaEluc3RhbmNlLm1hdGVyaWFsID0gc2VsZi5fZGVmYXVsdE1hdGVyaWFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhLm1hcHBpbmdbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzaEluc3RhbmNlLm1hdGVyaWFsID0gc2VsZi5fZGVmYXVsdE1hdGVyaWFsO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBkYXRhLm1hcHBpbmdbaV0ubWF0ZXJpYWw7XG4gICAgICAgICAgICAgICAgY29uc3QgdXJsID0gZGF0YS5tYXBwaW5nW2ldLnBhdGg7XG4gICAgICAgICAgICAgICAgbGV0IG1hdGVyaWFsO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlkICE9PSB1bmRlZmluZWQpIHsgLy8gaWQgbWFwcGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNoSW5zdGFuY2UubWF0ZXJpYWwgPSBzZWxmLl9kZWZhdWx0TWF0ZXJpYWw7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbCA9IGFzc2V0cy5nZXQoaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGVyaWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlTWF0ZXJpYWwobWF0ZXJpYWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldHMub25jZSgnYWRkOicgKyBpZCwgaGFuZGxlTWF0ZXJpYWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh1cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXJsIG1hcHBpbmdcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGFzc2V0LmdldEFic29sdXRlVXJsKGRhdGEubWFwcGluZ1tpXS5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgbWF0ZXJpYWwgPSBhc3NldHMuZ2V0QnlVcmwocGF0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGVyaWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVNYXRlcmlhbChtYXRlcmlhbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldHMub25jZSgnYWRkOnVybDonICsgcGF0aCwgaGFuZGxlTWF0ZXJpYWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBwYXJzZXIgdGhhdCBjb252ZXJ0cyByYXcgZGF0YSBpbnRvIGEge0BsaW5rIE1vZGVsfS4gRGVmYXVsdCBwYXJzZXIgaXMgZm9yIEpTT04gbW9kZWxzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcnNlciAtIFNlZSBKc29uTW9kZWxQYXJzZXIgZm9yIGV4YW1wbGUuXG4gICAgICogQHBhcmFtIHtBZGRQYXJzZXJDYWxsYmFja30gZGVjaWRlciAtIEZ1bmN0aW9uIHRoYXQgZGVjaWRlcyBvbiB3aGljaCBwYXJzZXIgdG8gdXNlLiBGdW5jdGlvblxuICAgICAqIHNob3VsZCB0YWtlICh1cmwsIGRhdGEpIGFyZ3VtZW50cyBhbmQgcmV0dXJuIHRydWUgaWYgdGhpcyBwYXJzZXIgc2hvdWxkIGJlIHVzZWQgdG8gcGFyc2UgdGhlXG4gICAgICogZGF0YSBpbnRvIGEge0BsaW5rIE1vZGVsfS4gVGhlIGZpcnN0IHBhcnNlciB0byByZXR1cm4gdHJ1ZSBpcyB1c2VkLlxuICAgICAqL1xuICAgIGFkZFBhcnNlcihwYXJzZXIsIGRlY2lkZXIpIHtcbiAgICAgICAgdGhpcy5fcGFyc2Vycy5wdXNoKHtcbiAgICAgICAgICAgIHBhcnNlcjogcGFyc2VyLFxuICAgICAgICAgICAgZGVjaWRlcjogZGVjaWRlclxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IE1vZGVsSGFuZGxlciB9O1xuIl0sIm5hbWVzIjpbIk1vZGVsSGFuZGxlciIsImNvbnN0cnVjdG9yIiwiYXBwIiwiaGFuZGxlclR5cGUiLCJfZGV2aWNlIiwiZ3JhcGhpY3NEZXZpY2UiLCJfcGFyc2VycyIsIl9kZWZhdWx0TWF0ZXJpYWwiLCJnZXREZWZhdWx0TWF0ZXJpYWwiLCJtYXhSZXRyaWVzIiwiYWRkUGFyc2VyIiwiSnNvbk1vZGVsUGFyc2VyIiwidXJsIiwiZGF0YSIsInBhdGgiLCJnZXRFeHRlbnNpb24iLCJHbGJNb2RlbFBhcnNlciIsImxvYWQiLCJjYWxsYmFjayIsIm9yaWdpbmFsIiwib3B0aW9ucyIsInJldHJ5Iiwic3RhcnRzV2l0aCIsInRvTG93ZXJDYXNlIiwicmVzcG9uc2VUeXBlIiwiSHR0cCIsIlJlc3BvbnNlVHlwZSIsIkFSUkFZX0JVRkZFUiIsIkpTT04iLCJodHRwIiwiZ2V0IiwiZXJyIiwicmVzcG9uc2UiLCJvcGVuIiwiaSIsImxlbmd0aCIsInAiLCJkZWNpZGVyIiwicGFyc2VyIiwicGFyc2UiLCJEZWJ1ZyIsIndhcm4iLCJwYXRjaCIsImFzc2V0IiwiYXNzZXRzIiwicmVzb3VyY2UiLCJzZWxmIiwibWVzaEluc3RhbmNlcyIsImZvckVhY2giLCJtZXNoSW5zdGFuY2UiLCJtYXBwaW5nIiwiaGFuZGxlTWF0ZXJpYWwiLCJtYXRlcmlhbCIsIm9uY2UiLCJpZCIsInVuZGVmaW5lZCIsImdldEFic29sdXRlVXJsIiwiZ2V0QnlVcmwiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUE0QkEsTUFBTUEsWUFBTixDQUFtQjtFQWNmQyxXQUFXLENBQUNDLEdBQUQsRUFBTTtJQUFBLElBUmpCQyxDQUFBQSxXQVFpQixHQVJILE9BUUcsQ0FBQTtBQUNiLElBQUEsSUFBQSxDQUFLQyxPQUFMLEdBQWVGLEdBQUcsQ0FBQ0csY0FBbkIsQ0FBQTtJQUNBLElBQUtDLENBQUFBLFFBQUwsR0FBZ0IsRUFBaEIsQ0FBQTtBQUNBLElBQUEsSUFBQSxDQUFLQyxnQkFBTCxHQUF3QkMsa0JBQWtCLENBQUMsSUFBQSxDQUFLSixPQUFOLENBQTFDLENBQUE7SUFDQSxJQUFLSyxDQUFBQSxVQUFMLEdBQWtCLENBQWxCLENBQUE7QUFFQSxJQUFBLElBQUEsQ0FBS0MsU0FBTCxDQUFlLElBQUlDLGVBQUosQ0FBb0IsS0FBS1AsT0FBekIsRUFBa0MsSUFBS0csQ0FBQUEsZ0JBQXZDLENBQWYsRUFBeUUsVUFBVUssR0FBVixFQUFlQyxJQUFmLEVBQXFCO0FBQzFGLE1BQUEsT0FBUUMsSUFBSSxDQUFDQyxZQUFMLENBQWtCSCxHQUFsQixNQUEyQixPQUFuQyxDQUFBO0tBREosQ0FBQSxDQUFBO0FBR0EsSUFBQSxJQUFBLENBQUtG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
