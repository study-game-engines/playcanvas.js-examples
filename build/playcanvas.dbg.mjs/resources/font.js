/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { path } from '../core/path.js';
import { string } from '../core/string.js';
import { http } from '../net/http.js';
import { Font } from '../font/font.js';

function upgradeDataSchema(data) {
  if (data.version < 3) {
    if (data.version < 2) {
      data.info.maps = data.info.maps || [{
        width: data.info.width,
        height: data.info.height
      }];
    }

    data.chars = Object.keys(data.chars || {}).reduce(function (newChars, key) {
      const existing = data.chars[key];
      const newKey = existing.letter !== undefined ? existing.letter : string.fromCodePoint(key);

      if (data.version < 2) {
        existing.map = existing.map || 0;
      }

      newChars[newKey] = existing;
      return newChars;
    }, {});
    data.version = 3;
  }

  return data;
}

class FontHandler {
  constructor(app) {
    this.handlerType = "font";
    this._loader = app.loader;
    this.maxRetries = 0;
  }

  load(url, callback, asset) {
    if (typeof url === 'string') {
      url = {
        load: url,
        original: url
      };
    }

    const self = this;

    if (path.getExtension(url.original) === '.json') {
      http.get(url.load, {
        retry: this.maxRetries > 0,
        maxRetries: this.maxRetries
      }, function (err, response) {
        if (!err) {
          const data = upgradeDataSchema(response);

          self._loadTextures(url.load.replace('.json', '.png'), data, function (err, textures) {
            if (err) return callback(err);
            callback(null, {
              data: data,
              textures: textures
            });
          });
        } else {
          callback(`Error loading font resource: ${url.original} [${err}]`);
        }
      });
    } else {
      if (asset && asset.data) {
        asset.data = upgradeDataSchema(asset.data);
      }

      this._loadTextures(url.load, asset && asset.data, callback);
    }
  }

  _loadTextures(url, data, callback) {
    const numTextures = data.info.maps.length;
    let numLoaded = 0;
    let error = null;
    const textures = new Array(numTextures);
    const loader = this._loader;

    const loadTexture = function loadTexture(index) {
      const onLoaded = function onLoaded(err, texture) {
        if (error) return;

        if (err) {
          error = err;
          return callback(err);
        }

        texture.upload();
        textures[index] = texture;
        numLoaded++;

        if (numLoaded === numTextures) {
          callback(null, textures);
        }
      };

      if (index === 0) {
        loader.load(url, 'texture', onLoaded);
      } else {
        loader.load(url.replace('.png', index + '.png'), 'texture', onLoaded);
      }
    };

    for (let i = 0; i < numTextures; i++) loadTexture(i);
  }

  open(url, data, asset) {
    let font;

    if (data.textures) {
      font = new Font(data.textures, data.data);
    } else {
      font = new Font(data, null);
    }

    return font;
  }

  patch(asset, assets) {
    const font = asset.resource;

    if (!font.data && asset.data) {
      font.data = asset.data;
    } else if (!asset.data && font.data) {
      asset.data = font.data;
    }

    if (asset.data) {
      asset.data = upgradeDataSchema(asset.data);
    }
  }

}

export { FontHandler };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9udC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Jlc291cmNlcy9mb250LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBhdGggfSBmcm9tICcuLi9jb3JlL3BhdGguanMnO1xuaW1wb3J0IHsgc3RyaW5nIH0gZnJvbSAnLi4vY29yZS9zdHJpbmcuanMnO1xuXG5pbXBvcnQgeyBodHRwIH0gZnJvbSAnLi4vbmV0L2h0dHAuanMnO1xuXG5pbXBvcnQgeyBGb250IH0gZnJvbSAnLi4vZm9udC9mb250LmpzJztcblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4vaGFuZGxlci5qcycpLlJlc291cmNlSGFuZGxlcn0gUmVzb3VyY2VIYW5kbGVyICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi4vZnJhbWV3b3JrL2FwcC1iYXNlLmpzJykuQXBwQmFzZX0gQXBwQmFzZSAqL1xuXG5mdW5jdGlvbiB1cGdyYWRlRGF0YVNjaGVtYShkYXRhKSB7XG4gICAgLy8gY29udmVydCB2MSBhbmQgdjIgdG8gdjMgZm9udCBkYXRhIHNjaGVtYVxuICAgIGlmIChkYXRhLnZlcnNpb24gPCAzKSB7XG4gICAgICAgIGlmIChkYXRhLnZlcnNpb24gPCAyKSB7XG4gICAgICAgICAgICBkYXRhLmluZm8ubWFwcyA9IGRhdGEuaW5mby5tYXBzIHx8IFt7XG4gICAgICAgICAgICAgICAgd2lkdGg6IGRhdGEuaW5mby53aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGRhdGEuaW5mby5oZWlnaHRcbiAgICAgICAgICAgIH1dO1xuICAgICAgICB9XG4gICAgICAgIGRhdGEuY2hhcnMgPSBPYmplY3Qua2V5cyhkYXRhLmNoYXJzIHx8IHt9KS5yZWR1Y2UoZnVuY3Rpb24gKG5ld0NoYXJzLCBrZXkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gZGF0YS5jaGFyc1trZXldO1xuICAgICAgICAgICAgLy8ga2V5IGJ5IGxldHRlciBpbnN0ZWFkIG9mIGNoYXIgY29kZVxuICAgICAgICAgICAgY29uc3QgbmV3S2V5ID0gZXhpc3RpbmcubGV0dGVyICE9PSB1bmRlZmluZWQgPyBleGlzdGluZy5sZXR0ZXIgOiBzdHJpbmcuZnJvbUNvZGVQb2ludChrZXkpO1xuICAgICAgICAgICAgaWYgKGRhdGEudmVyc2lvbiA8IDIpIHtcbiAgICAgICAgICAgICAgICBleGlzdGluZy5tYXAgPSBleGlzdGluZy5tYXAgfHwgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld0NoYXJzW25ld0tleV0gPSBleGlzdGluZztcbiAgICAgICAgICAgIHJldHVybiBuZXdDaGFycztcbiAgICAgICAgfSwge30pO1xuICAgICAgICBkYXRhLnZlcnNpb24gPSAzO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbn1cblxuLyoqXG4gKiBSZXNvdXJjZSBoYW5kbGVyIHVzZWQgZm9yIGxvYWRpbmcge0BsaW5rIEZvbnR9IHJlc291cmNlcy5cbiAqXG4gKiBAaW1wbGVtZW50cyB7UmVzb3VyY2VIYW5kbGVyfVxuICovXG5jbGFzcyBGb250SGFuZGxlciB7XG4gICAgLyoqXG4gICAgICogVHlwZSBvZiB0aGUgcmVzb3VyY2UgdGhlIGhhbmRsZXIgaGFuZGxlcy5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgaGFuZGxlclR5cGUgPSBcImZvbnRcIjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBGb250SGFuZGxlciBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXBwQmFzZX0gYXBwIC0gVGhlIHJ1bm5pbmcge0BsaW5rIEFwcEJhc2V9LlxuICAgICAqIEBoaWRlY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcbiAgICAgICAgdGhpcy5fbG9hZGVyID0gYXBwLmxvYWRlcjtcbiAgICAgICAgdGhpcy5tYXhSZXRyaWVzID0gMDtcbiAgICB9XG5cbiAgICBsb2FkKHVybCwgY2FsbGJhY2ssIGFzc2V0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgdXJsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdXJsID0ge1xuICAgICAgICAgICAgICAgIGxvYWQ6IHVybCxcbiAgICAgICAgICAgICAgICBvcmlnaW5hbDogdXJsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmIChwYXRoLmdldEV4dGVuc2lvbih1cmwub3JpZ2luYWwpID09PSAnLmpzb24nKSB7XG4gICAgICAgICAgICAvLyBsb2FkIGpzb24gZGF0YSB0aGVuIGxvYWQgdGV4dHVyZSBvZiBzYW1lIG5hbWVcbiAgICAgICAgICAgIGh0dHAuZ2V0KHVybC5sb2FkLCB7XG4gICAgICAgICAgICAgICAgcmV0cnk6IHRoaXMubWF4UmV0cmllcyA+IDAsXG4gICAgICAgICAgICAgICAgbWF4UmV0cmllczogdGhpcy5tYXhSZXRyaWVzXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBhc3NldCBkYXRhXG4gICAgICAgICAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHVwZ3JhZGVEYXRhU2NoZW1hKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9hZFRleHR1cmVzKHVybC5sb2FkLnJlcGxhY2UoJy5qc29uJywgJy5wbmcnKSwgZGF0YSwgZnVuY3Rpb24gKGVyciwgdGV4dHVyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYWxsYmFjayhlcnIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlczogdGV4dHVyZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhgRXJyb3IgbG9hZGluZyBmb250IHJlc291cmNlOiAke3VybC5vcmlnaW5hbH0gWyR7ZXJyfV1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdXBncmFkZSBhc3NldCBkYXRhXG4gICAgICAgICAgICBpZiAoYXNzZXQgJiYgYXNzZXQuZGF0YSkge1xuICAgICAgICAgICAgICAgIGFzc2V0LmRhdGEgPSB1cGdyYWRlRGF0YVNjaGVtYShhc3NldC5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2xvYWRUZXh0dXJlcyh1cmwubG9hZCwgYXNzZXQgJiYgYXNzZXQuZGF0YSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2xvYWRUZXh0dXJlcyh1cmwsIGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IG51bVRleHR1cmVzID0gZGF0YS5pbmZvLm1hcHMubGVuZ3RoO1xuICAgICAgICBsZXQgbnVtTG9hZGVkID0gMDtcbiAgICAgICAgbGV0IGVycm9yID0gbnVsbDtcblxuICAgICAgICBjb25zdCB0ZXh0dXJlcyA9IG5ldyBBcnJheShudW1UZXh0dXJlcyk7XG4gICAgICAgIGNvbnN0IGxvYWRlciA9IHRoaXMuX2xvYWRlcjtcblxuICAgICAgICBjb25zdCBsb2FkVGV4dHVyZSA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgY29uc3Qgb25Mb2FkZWQgPSBmdW5jdGlvbiAoZXJyLCB0ZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yID0gZXJyO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0ZXh0dXJlLnVwbG9hZCgpO1xuICAgICAgICAgICAgICAgIHRleHR1cmVzW2luZGV4XSA9IHRleHR1cmU7XG4gICAgICAgICAgICAgICAgbnVtTG9hZGVkKys7XG4gICAgICAgICAgICAgICAgaWYgKG51bUxvYWRlZCA9PT0gbnVtVGV4dHVyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgdGV4dHVyZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGxvYWRlci5sb2FkKHVybCwgJ3RleHR1cmUnLCBvbkxvYWRlZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvYWRlci5sb2FkKHVybC5yZXBsYWNlKCcucG5nJywgaW5kZXggKyAnLnBuZycpLCAndGV4dHVyZScsIG9uTG9hZGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRleHR1cmVzOyBpKyspXG4gICAgICAgICAgICBsb2FkVGV4dHVyZShpKTtcbiAgICB9XG5cbiAgICBvcGVuKHVybCwgZGF0YSwgYXNzZXQpIHtcbiAgICAgICAgbGV0IGZvbnQ7XG4gICAgICAgIGlmIChkYXRhLnRleHR1cmVzKSB7XG4gICAgICAgICAgICAvLyBib3RoIGRhdGEgYW5kIHRleHR1cmVzIGV4aXN0XG4gICAgICAgICAgICBmb250ID0gbmV3IEZvbnQoZGF0YS50ZXh0dXJlcywgZGF0YS5kYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG9ubHkgdGV4dHVyZXNcbiAgICAgICAgICAgIGZvbnQgPSBuZXcgRm9udChkYXRhLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9udDtcbiAgICB9XG5cbiAgICBwYXRjaChhc3NldCwgYXNzZXRzKSB7XG4gICAgICAgIC8vIGlmIG5vdCBhbHJlYWR5IHNldCwgZ2V0IGZvbnQgZGF0YSBibG9jayBmcm9tIGFzc2V0XG4gICAgICAgIC8vIGFuZCBhc3NpZ24gdG8gZm9udCByZXNvdXJjZVxuICAgICAgICBjb25zdCBmb250ID0gYXNzZXQucmVzb3VyY2U7XG4gICAgICAgIGlmICghZm9udC5kYXRhICYmIGFzc2V0LmRhdGEpIHtcbiAgICAgICAgICAgIC8vIGZvbnQgZGF0YSBwcmVzZW50IGluIGFzc2V0IGJ1dCBub3QgaW4gZm9udFxuICAgICAgICAgICAgZm9udC5kYXRhID0gYXNzZXQuZGF0YTtcbiAgICAgICAgfSBlbHNlIGlmICghYXNzZXQuZGF0YSAmJiBmb250LmRhdGEpIHtcbiAgICAgICAgICAgIC8vIGZvbnQgZGF0YSBwcmVzZW50IGluIGZvbnQgYnV0IG5vdCBpbiBhc3NldFxuICAgICAgICAgICAgYXNzZXQuZGF0YSA9IGZvbnQuZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldC5kYXRhKSB7XG4gICAgICAgICAgICBhc3NldC5kYXRhID0gdXBncmFkZURhdGFTY2hlbWEoYXNzZXQuZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvbnRIYW5kbGVyIH07XG4iXSwibmFtZXMiOlsidXBncmFkZURhdGFTY2hlbWEiLCJkYXRhIiwidmVyc2lvbiIsImluZm8iLCJtYXBzIiwid2lkdGgiLCJoZWlnaHQiLCJjaGFycyIsIk9iamVjdCIsImtleXMiLCJyZWR1Y2UiLCJuZXdDaGFycyIsImtleSIsImV4aXN0aW5nIiwibmV3S2V5IiwibGV0dGVyIiwidW5kZWZpbmVkIiwic3RyaW5nIiwiZnJvbUNvZGVQb2ludCIsIm1hcCIsIkZvbnRIYW5kbGVyIiwiY29uc3RydWN0b3IiLCJhcHAiLCJoYW5kbGVyVHlwZSIsIl9sb2FkZXIiLCJsb2FkZXIiLCJtYXhSZXRyaWVzIiwibG9hZCIsInVybCIsImNhbGxiYWNrIiwiYXNzZXQiLCJvcmlnaW5hbCIsInNlbGYiLCJwYXRoIiwiZ2V0RXh0ZW5zaW9uIiwiaHR0cCIsImdldCIsInJldHJ5IiwiZXJyIiwicmVzcG9uc2UiLCJfbG9hZFRleHR1cmVzIiwicmVwbGFjZSIsInRleHR1cmVzIiwibnVtVGV4dHVyZXMiLCJsZW5ndGgiLCJudW1Mb2FkZWQiLCJlcnJvciIsIkFycmF5IiwibG9hZFRleHR1cmUiLCJpbmRleCIsIm9uTG9hZGVkIiwidGV4dHVyZSIsInVwbG9hZCIsImkiLCJvcGVuIiwiZm9udCIsIkZvbnQiLCJwYXRjaCIsImFzc2V0cyIsInJlc291cmNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBVUEsU0FBU0EsaUJBQVQsQ0FBMkJDLElBQTNCLEVBQWlDO0FBRTdCLEVBQUEsSUFBSUEsSUFBSSxDQUFDQyxPQUFMLEdBQWUsQ0FBbkIsRUFBc0I7QUFDbEIsSUFBQSxJQUFJRCxJQUFJLENBQUNDLE9BQUwsR0FBZSxDQUFuQixFQUFzQjtNQUNsQkQsSUFBSSxDQUFDRSxJQUFMLENBQVVDLElBQVYsR0FBaUJILElBQUksQ0FBQ0UsSUFBTCxDQUFVQyxJQUFWLElBQWtCLENBQUM7QUFDaENDLFFBQUFBLEtBQUssRUFBRUosSUFBSSxDQUFDRSxJQUFMLENBQVVFLEtBRGU7QUFFaENDLFFBQUFBLE1BQU0sRUFBRUwsSUFBSSxDQUFDRSxJQUFMLENBQVVHLE1BQUFBO0FBRmMsT0FBRCxDQUFuQyxDQUFBO0FBSUgsS0FBQTs7QUFDREwsSUFBQUEsSUFBSSxDQUFDTSxLQUFMLEdBQWFDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZUixJQUFJLENBQUNNLEtBQUwsSUFBYyxFQUExQixFQUE4QkcsTUFBOUIsQ0FBcUMsVUFBVUMsUUFBVixFQUFvQkMsR0FBcEIsRUFBeUI7QUFDdkUsTUFBQSxNQUFNQyxRQUFRLEdBQUdaLElBQUksQ0FBQ00sS0FBTCxDQUFXSyxHQUFYLENBQWpCLENBQUE7QUFF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
