/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { Http, http } from '../net/http.js';
import { AnimCurve } from '../anim/evaluator/anim-curve.js';
import { AnimData } from '../anim/evaluator/anim-data.js';
import { AnimTrack } from '../anim/evaluator/anim-track.js';

class AnimClipHandler {
  constructor(app) {
    this.handlerType = "animclip";
    this.maxRetries = 0;
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

    if (url.load.startsWith('blob:')) {
      options.responseType = Http.ResponseType.JSON;
    }

    http.get(url.load, options, function (err, response) {
      if (err) {
        callback(`Error loading animation clip resource: ${url.original} [${err}]`);
      } else {
        callback(null, response);
      }
    });
  }

  open(url, data) {
    const name = data.name;
    const duration = data.duration;
    const inputs = data.inputs.map(function (input) {
      return new AnimData(1, input);
    });
    const outputs = data.outputs.map(function (output) {
      return new AnimData(output.components, output.data);
    });
    const curves = data.curves.map(function (curve) {
      return new AnimCurve([curve.path], curve.inputIndex, curve.outputIndex, curve.interpolation);
    });
    return new AnimTrack(name, duration, inputs, outputs, curves);
  }

  patch(asset, assets) {}

}

export { AnimClipHandler };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbS1jbGlwLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcmVzb3VyY2VzL2FuaW0tY2xpcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBodHRwLCBIdHRwIH0gZnJvbSAnLi4vbmV0L2h0dHAuanMnO1xuXG5pbXBvcnQgeyBBbmltQ3VydmUgfSBmcm9tICcuLi9hbmltL2V2YWx1YXRvci9hbmltLWN1cnZlLmpzJztcbmltcG9ydCB7IEFuaW1EYXRhIH0gZnJvbSAnLi4vYW5pbS9ldmFsdWF0b3IvYW5pbS1kYXRhLmpzJztcbmltcG9ydCB7IEFuaW1UcmFjayB9IGZyb20gJy4uL2FuaW0vZXZhbHVhdG9yL2FuaW0tdHJhY2suanMnO1xuXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9oYW5kbGVyLmpzJykuUmVzb3VyY2VIYW5kbGVyfSBSZXNvdXJjZUhhbmRsZXIgKi9cblxuLyoqXG4gKiBSZXNvdXJjZSBoYW5kbGVyIHVzZWQgZm9yIGxvYWRpbmcge0BsaW5rIEFuaW1DbGlwfSByZXNvdXJjZXMuXG4gKlxuICogQGltcGxlbWVudHMge1Jlc291cmNlSGFuZGxlcn1cbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgQW5pbUNsaXBIYW5kbGVyIHtcbiAgICAvKipcbiAgICAgKiBUeXBlIG9mIHRoZSByZXNvdXJjZSB0aGUgaGFuZGxlciBoYW5kbGVzLlxuICAgICAqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBoYW5kbGVyVHlwZSA9IFwiYW5pbWNsaXBcIjtcblxuICAgIGNvbnN0cnVjdG9yKGFwcCkge1xuICAgICAgICB0aGlzLm1heFJldHJpZXMgPSAwO1xuICAgIH1cblxuICAgIGxvYWQodXJsLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIHVybCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHVybCA9IHtcbiAgICAgICAgICAgICAgICBsb2FkOiB1cmwsXG4gICAgICAgICAgICAgICAgb3JpZ2luYWw6IHVybFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3BlY2lmeSBKU09OIGZvciBibG9iIFVSTHNcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHJldHJ5OiB0aGlzLm1heFJldHJpZXMgPiAwLFxuICAgICAgICAgICAgbWF4UmV0cmllczogdGhpcy5tYXhSZXRyaWVzXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHVybC5sb2FkLnN0YXJ0c1dpdGgoJ2Jsb2I6JykpIHtcbiAgICAgICAgICAgIG9wdGlvbnMucmVzcG9uc2VUeXBlID0gSHR0cC5SZXNwb25zZVR5cGUuSlNPTjtcbiAgICAgICAgfVxuXG4gICAgICAgIGh0dHAuZ2V0KHVybC5sb2FkLCBvcHRpb25zLCBmdW5jdGlvbiAoZXJyLCByZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGBFcnJvciBsb2FkaW5nIGFuaW1hdGlvbiBjbGlwIHJlc291cmNlOiAke3VybC5vcmlnaW5hbH0gWyR7ZXJyfV1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvcGVuKHVybCwgZGF0YSkge1xuICAgICAgICBjb25zdCBuYW1lID0gZGF0YS5uYW1lO1xuICAgICAgICBjb25zdCBkdXJhdGlvbiA9IGRhdGEuZHVyYXRpb247XG4gICAgICAgIGNvbnN0IGlucHV0cyA9IGRhdGEuaW5wdXRzLm1hcChmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQW5pbURhdGEoMSwgaW5wdXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgb3V0cHV0cyA9IGRhdGEub3V0cHV0cy5tYXAoZnVuY3Rpb24gKG91dHB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBbmltRGF0YShvdXRwdXQuY29tcG9uZW50cywgb3V0cHV0LmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgY3VydmVzID0gZGF0YS5jdXJ2ZXMubWFwKGZ1bmN0aW9uIChjdXJ2ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBbmltQ3VydmUoXG4gICAgICAgICAgICAgICAgW2N1cnZlLnBhdGhdLFxuICAgICAgICAgICAgICAgIGN1cnZlLmlucHV0SW5kZXgsXG4gICAgICAgICAgICAgICAgY3VydmUub3V0cHV0SW5kZXgsXG4gICAgICAgICAgICAgICAgY3VydmUuaW50ZXJwb2xhdGlvblxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXcgQW5pbVRyYWNrKFxuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgICAgaW5wdXRzLFxuICAgICAgICAgICAgb3V0cHV0cyxcbiAgICAgICAgICAgIGN1cnZlc1xuICAgICAgICApO1xuICAgIH1cblxuICAgIHBhdGNoKGFzc2V0LCBhc3NldHMpIHtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEFuaW1DbGlwSGFuZGxlciB9O1xuIl0sIm5hbWVzIjpbIkFuaW1DbGlwSGFuZGxlciIsImNvbnN0cnVjdG9yIiwiYXBwIiwiaGFuZGxlclR5cGUiLCJtYXhSZXRyaWVzIiwibG9hZCIsInVybCIsImNhbGxiYWNrIiwib3JpZ2luYWwiLCJvcHRpb25zIiwicmV0cnkiLCJzdGFydHNXaXRoIiwicmVzcG9uc2VUeXBlIiwiSHR0cCIsIlJlc3BvbnNlVHlwZSIsIkpTT04iLCJodHRwIiwiZ2V0IiwiZXJyIiwicmVzcG9uc2UiLCJvcGVuIiwiZGF0YSIsIm5hbWUiLCJkdXJhdGlvbiIsImlucHV0cyIsIm1hcCIsImlucHV0IiwiQW5pbURhdGEiLCJvdXRwdXRzIiwib3V0cHV0IiwiY29tcG9uZW50cyIsImN1cnZlcyIsImN1cnZlIiwiQW5pbUN1cnZlIiwicGF0aCIsImlucHV0SW5kZXgiLCJvdXRwdXRJbmRleCIsImludGVycG9sYXRpb24iLCJBbmltVHJhY2siLCJwYXRjaCIsImFzc2V0IiwiYXNzZXRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBY0EsTUFBTUEsZUFBTixDQUFzQjtFQVFsQkMsV0FBVyxDQUFDQyxHQUFELEVBQU07SUFBQSxJQUZqQkMsQ0FBQUEsV0FFaUIsR0FGSCxVQUVHLENBQUE7SUFDYixJQUFLQyxDQUFBQSxVQUFMLEdBQWtCLENBQWxCLENBQUE7QUFDSCxHQUFBOztBQUVEQyxFQUFBQSxJQUFJLENBQUNDLEdBQUQsRUFBTUMsUUFBTixFQUFnQjtBQUNoQixJQUFBLElBQUksT0FBT0QsR0FBUCxLQUFlLFFBQW5CLEVBQTZCO0FBQ3pCQSxNQUFBQSxHQUFHLEdBQUc7QUFDRkQsUUFBQUEsSUFBSSxFQUFFQyxHQURKO0FBRUZFLFFBQUFBLFFBQVEsRUFBRUYsR0FBQUE7T0FGZCxDQUFBO0FBSUgsS0FBQTs7QUFHRCxJQUFBLE1BQU1HLE9BQU8sR0FBRztBQUNaQyxNQUFBQSxLQUFLLEVBQUUsSUFBQSxDQUFLTixVQUFMLEdBQWtCLENBRGI7QUFFWkEsTUFBQUEsVUFBVSxFQUFFLElBQUtBLENBQUFBLFVBQUFBO0tBRnJCLENBQUE7O0lBS0EsSUFBSUUsR0FBRyxDQUFDRCxJQUFKLENBQVNNLFVBQVQsQ0FBb0IsT0FBcEIsQ0FBSixFQUFrQztBQUM5QkYsTUFBQUEsT0FBTyxDQUFDRyxZQUFSLEdBQXVCQyxJQUFJLENBQUNDLFlBQUwsQ0FBa0JDLElBQXpDLENBQUE7QUFDSCxLQUFBOztBQUVEQyxJQUFBQSxJQUFJLENBQUNDLEdBQUwsQ0FBU1gsR0FBRyxDQUFDRCxJQUFiLEVBQW1CSSxPQUFuQixFQUE0QixVQUFVUyxHQUFWLEVBQWVDLFFBQWYsRUFBeUI7QUFDakQsTUFBQSxJQUFJRCxHQUFKLEVBQVM7UUFDTFgsUUFBUSxDQUFFLDBDQUF5Q0QsR0FBRyxDQUFDRSxRQUFTLENBQUlVLEVBQUFBLEVBQUFBLEdBQUksR0FBaEUsQ0FBUixDQUFBO0FBQ0gsT0FGRCxNQUVPO0FBQ0hYLFFBQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU9ZLFFBQVAsQ0FBUixDQUFBO0FBQ0gsT0FBQTtLQUxMLENBQUEsQ0FBQTtBQU9ILEdBQUE7O0FBRURDLEVBQUFBLElBQUksQ0FBQ2QsR0FBRCxFQUFNZSxJQUFOLEVBQVk7QUFDWixJQUFBLE1BQU1DLElBQUksR0FBR0QsSUFBSSxDQUFDQyxJQUFsQixDQUFBO0FBQ0EsSUFBQSxNQUFNQyxRQUFRLEdBQUdGLElBQUksQ0FBQ0UsUUFBdEIsQ0FBQTtJQUNBLE1BQU1DLE1BQU0sR0FBR0gsSUFBSSxDQUFDRyxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsVUFBVUMsS0FBVixFQUFpQjtBQUM1QyxNQUFBLE9BQU8sSUFBSUMsUUFBSixDQUFhLENBQWIsRUFBZ0JELEtBQWhCLENBQVAsQ0FBQTtBQUNILEtBRmMsQ0FBZixDQUFBO0lBR0EsTUFBTUUsT0FBTyxHQUFHUCxJQUFJLENBQUNPLE9BQUwsQ0FBYUgsR0FBYixDQUFpQixVQUFVSSxNQUFWLEVBQWtCO01BQy9DLE9BQU8sSUFBSUYsUUFBSixDQUFhRSxNQUFNLENBQUNDLFVBQXBCLEVBQWdDRCxNQUFNLENBQUNSLElBQXZDLENBQVAsQ0FBQTtBQUNILEtBRmUsQ0FBaEIsQ0FBQTtJQUdBLE1BQU1VLE1BQU0sR0FBR1YsSUFBSSxDQUFDVSxNQUFMLENBQVlOLEdBQVosQ0FBZ0IsVUFBVU8sS0FBVixFQUFpQjtNQUM1QyxPQUFPLElBQUlDLFNBQUosQ0FDSCxDQUFDRCxLQUFLLENBQUNFLElBQVAsQ0FERyxFQUVIRixLQUFLLENBQUNHLFVBRkgsRUFHSEgsS0FBSyxDQUFDSSxXQUhILEVBSUhKLEtBQUssQ0FBQ0ssYUFKSCxDQUFQLENBQUE7QUFNSCxLQVBjLENBQWYsQ0FBQTtBQVFBLElBQUEsT0FBTyxJQUFJQyxTQUFKLENBQ0hoQixJQURHLEVBRUhDLFFBRkcsRUFHSEMsTUFIRyxFQUlISSxPQUpHLEVBS0hHLE1BTEcsQ0FBUCxDQUFBO0FBT0gsR0FBQTs7QUFFRFEsRUFBQUEsS0FBSyxDQUFDQyxLQUFELEVBQVFDLE1BQVIsRUFBZ0IsRUFDcEI7O0FBbEVpQjs7OzsifQ==
