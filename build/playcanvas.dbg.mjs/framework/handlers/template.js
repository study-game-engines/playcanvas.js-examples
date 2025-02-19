/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { http } from '../../platform/net/http.js';
import { Template } from '../template.js';

class TemplateHandler {
  /**
   * Type of the resource the handler handles.
   *
   * @type {string}
   */

  constructor(app) {
    this.handlerType = "template";
    this._app = app;
    this.maxRetries = 0;
  }
  load(url, callback) {
    if (typeof url === 'string') {
      url = {
        load: url,
        original: url
      };
    }

    // we need to specify JSON for blob URLs
    const options = {
      retry: this.maxRetries > 0,
      maxRetries: this.maxRetries
    };
    http.get(url.load, options, function (err, response) {
      if (err) {
        callback('Error requesting template: ' + url.original);
      } else {
        callback(err, response);
      }
    });
  }
  open(url, data) {
    return new Template(this._app, data);
  }
}

export { TemplateHandler };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9mcmFtZXdvcmsvaGFuZGxlcnMvdGVtcGxhdGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaHR0cCB9IGZyb20gJy4uLy4uL3BsYXRmb3JtL25ldC9odHRwLmpzJztcblxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tICcuLi90ZW1wbGF0ZS5qcyc7XG5cbmNsYXNzIFRlbXBsYXRlSGFuZGxlciB7XG4gICAgLyoqXG4gICAgICogVHlwZSBvZiB0aGUgcmVzb3VyY2UgdGhlIGhhbmRsZXIgaGFuZGxlcy5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgaGFuZGxlclR5cGUgPSBcInRlbXBsYXRlXCI7XG5cbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcbiAgICAgICAgdGhpcy5fYXBwID0gYXBwO1xuICAgICAgICB0aGlzLm1heFJldHJpZXMgPSAwO1xuICAgIH1cblxuICAgIGxvYWQodXJsLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIHVybCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHVybCA9IHtcbiAgICAgICAgICAgICAgICBsb2FkOiB1cmwsXG4gICAgICAgICAgICAgICAgb3JpZ2luYWw6IHVybFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3BlY2lmeSBKU09OIGZvciBibG9iIFVSTHNcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHJldHJ5OiB0aGlzLm1heFJldHJpZXMgPiAwLFxuICAgICAgICAgICAgbWF4UmV0cmllczogdGhpcy5tYXhSZXRyaWVzXG4gICAgICAgIH07XG5cbiAgICAgICAgaHR0cC5nZXQodXJsLmxvYWQsIG9wdGlvbnMsIGZ1bmN0aW9uIChlcnIsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soJ0Vycm9yIHJlcXVlc3RpbmcgdGVtcGxhdGU6ICcgKyB1cmwub3JpZ2luYWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb3Blbih1cmwsIGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUZW1wbGF0ZSh0aGlzLl9hcHAsIGRhdGEpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgVGVtcGxhdGVIYW5kbGVyIH07XG4iXSwibmFtZXMiOlsiVGVtcGxhdGVIYW5kbGVyIiwiY29uc3RydWN0b3IiLCJhcHAiLCJoYW5kbGVyVHlwZSIsIl9hcHAiLCJtYXhSZXRyaWVzIiwibG9hZCIsInVybCIsImNhbGxiYWNrIiwib3JpZ2luYWwiLCJvcHRpb25zIiwicmV0cnkiLCJodHRwIiwiZ2V0IiwiZXJyIiwicmVzcG9uc2UiLCJvcGVuIiwiZGF0YSIsIlRlbXBsYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUlBLE1BQU1BLGVBQWUsQ0FBQztBQUNsQjtBQUNKO0FBQ0E7QUFDQTtBQUNBOztFQUdJQyxXQUFXQSxDQUFDQyxHQUFHLEVBQUU7SUFBQSxJQUZqQkMsQ0FBQUEsV0FBVyxHQUFHLFVBQVUsQ0FBQTtJQUdwQixJQUFJLENBQUNDLElBQUksR0FBR0YsR0FBRyxDQUFBO0lBQ2YsSUFBSSxDQUFDRyxVQUFVLEdBQUcsQ0FBQyxDQUFBO0FBQ3ZCLEdBQUE7QUFFQUMsRUFBQUEsSUFBSUEsQ0FBQ0MsR0FBRyxFQUFFQyxRQUFRLEVBQUU7QUFDaEIsSUFBQSxJQUFJLE9BQU9ELEdBQUcsS0FBSyxRQUFRLEVBQUU7QUFDekJBLE1BQUFBLEdBQUcsR0FBRztBQUNGRCxRQUFBQSxJQUFJLEVBQUVDLEdBQUc7QUFDVEUsUUFBQUEsUUFBUSxFQUFFRixHQUFBQTtPQUNiLENBQUE7QUFDTCxLQUFBOztBQUVBO0FBQ0EsSUFBQSxNQUFNRyxPQUFPLEdBQUc7QUFDWkMsTUFBQUEsS0FBSyxFQUFFLElBQUksQ0FBQ04sVUFBVSxHQUFHLENBQUM7TUFDMUJBLFVBQVUsRUFBRSxJQUFJLENBQUNBLFVBQUFBO0tBQ3BCLENBQUE7QUFFRE8sSUFBQUEsSUFBSSxDQUFDQyxHQUFHLENBQUNOLEdBQUcsQ0FBQ0QsSUFBSSxFQUFFSSxPQUFPLEVBQUUsVUFBVUksR0FBRyxFQUFFQyxRQUFRLEVBQUU7QUFDakQsTUFBQSxJQUFJRCxHQUFHLEVBQUU7QUFDTE4sUUFBQUEsUUFBUSxDQUFDLDZCQUE2QixHQUFHRCxHQUFHLENBQUNFLFFBQVEsQ0FBQyxDQUFBO0FBQzFELE9BQUMsTUFBTTtBQUNIRCxRQUFBQSxRQUFRLENBQUNNLEdBQUcsRUFBRUMsUUFBUSxDQUFDLENBQUE7QUFDM0IsT0FBQTtBQUNKLEtBQUMsQ0FBQyxDQUFBO0FBQ04sR0FBQTtBQUVBQyxFQUFBQSxJQUFJQSxDQUFDVCxHQUFHLEVBQUVVLElBQUksRUFBRTtJQUNaLE9BQU8sSUFBSUMsUUFBUSxDQUFDLElBQUksQ0FBQ2QsSUFBSSxFQUFFYSxJQUFJLENBQUMsQ0FBQTtBQUN4QyxHQUFBO0FBQ0o7Ozs7In0=
