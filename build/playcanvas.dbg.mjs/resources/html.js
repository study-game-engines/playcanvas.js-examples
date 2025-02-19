/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { http } from '../net/http.js';

class HtmlHandler {
  constructor(app) {
    this.handlerType = "html";
    this.maxRetries = 0;
  }

  load(url, callback) {
    if (typeof url === 'string') {
      url = {
        load: url,
        original: url
      };
    }

    http.get(url.load, {
      retry: this.maxRetries > 0,
      maxRetries: this.maxRetries
    }, function (err, response) {
      if (!err) {
        callback(null, response);
      } else {
        callback(`Error loading html resource: ${url.original} [${err}]`);
      }
    });
  }

  open(url, data) {
    return data;
  }

  patch(asset, assets) {}

}

export { HtmlHandler };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Jlc291cmNlcy9odG1sLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGh0dHAgfSBmcm9tICcuLi9uZXQvaHR0cC5qcyc7XG5cbmNsYXNzIEh0bWxIYW5kbGVyIHtcbiAgICAvKipcbiAgICAgKiBUeXBlIG9mIHRoZSByZXNvdXJjZSB0aGUgaGFuZGxlciBoYW5kbGVzLlxuICAgICAqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBoYW5kbGVyVHlwZSA9IFwiaHRtbFwiO1xuXG4gICAgY29uc3RydWN0b3IoYXBwKSB7XG4gICAgICAgIHRoaXMubWF4UmV0cmllcyA9IDA7XG4gICAgfVxuXG4gICAgbG9hZCh1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdXJsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdXJsID0ge1xuICAgICAgICAgICAgICAgIGxvYWQ6IHVybCxcbiAgICAgICAgICAgICAgICBvcmlnaW5hbDogdXJsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaHR0cC5nZXQodXJsLmxvYWQsIHtcbiAgICAgICAgICAgIHJldHJ5OiB0aGlzLm1heFJldHJpZXMgPiAwLFxuICAgICAgICAgICAgbWF4UmV0cmllczogdGhpcy5tYXhSZXRyaWVzXG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soYEVycm9yIGxvYWRpbmcgaHRtbCByZXNvdXJjZTogJHt1cmwub3JpZ2luYWx9IFske2Vycn1dYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9wZW4odXJsLCBkYXRhKSB7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cblxuICAgIHBhdGNoKGFzc2V0LCBhc3NldHMpIHtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEh0bWxIYW5kbGVyIH07XG4iXSwibmFtZXMiOlsiSHRtbEhhbmRsZXIiLCJjb25zdHJ1Y3RvciIsImFwcCIsImhhbmRsZXJUeXBlIiwibWF4UmV0cmllcyIsImxvYWQiLCJ1cmwiLCJjYWxsYmFjayIsIm9yaWdpbmFsIiwiaHR0cCIsImdldCIsInJldHJ5IiwiZXJyIiwicmVzcG9uc2UiLCJvcGVuIiwiZGF0YSIsInBhdGNoIiwiYXNzZXQiLCJhc3NldHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQSxNQUFNQSxXQUFOLENBQWtCO0VBUWRDLFdBQVcsQ0FBQ0MsR0FBRCxFQUFNO0lBQUEsSUFGakJDLENBQUFBLFdBRWlCLEdBRkgsTUFFRyxDQUFBO0lBQ2IsSUFBS0MsQ0FBQUEsVUFBTCxHQUFrQixDQUFsQixDQUFBO0FBQ0gsR0FBQTs7QUFFREMsRUFBQUEsSUFBSSxDQUFDQyxHQUFELEVBQU1DLFFBQU4sRUFBZ0I7QUFDaEIsSUFBQSxJQUFJLE9BQU9ELEdBQVAsS0FBZSxRQUFuQixFQUE2QjtBQUN6QkEsTUFBQUEsR0FBRyxHQUFHO0FBQ0ZELFFBQUFBLElBQUksRUFBRUMsR0FESjtBQUVGRSxRQUFBQSxRQUFRLEVBQUVGLEdBQUFBO09BRmQsQ0FBQTtBQUlILEtBQUE7O0FBRURHLElBQUFBLElBQUksQ0FBQ0MsR0FBTCxDQUFTSixHQUFHLENBQUNELElBQWIsRUFBbUI7QUFDZk0sTUFBQUEsS0FBSyxFQUFFLElBQUEsQ0FBS1AsVUFBTCxHQUFrQixDQURWO0FBRWZBLE1BQUFBLFVBQVUsRUFBRSxJQUFLQSxDQUFBQSxVQUFBQTtBQUZGLEtBQW5CLEVBR0csVUFBVVEsR0FBVixFQUFlQyxRQUFmLEVBQXlCO01BQ3hCLElBQUksQ0FBQ0QsR0FBTCxFQUFVO0FBQ05MLFFBQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU9NLFFBQVAsQ0FBUixDQUFBO0FBQ0gsT0FGRCxNQUVPO1FBQ0hOLFFBQVEsQ0FBRSxnQ0FBK0JELEdBQUcsQ0FBQ0UsUUFBUyxDQUFJSSxFQUFBQSxFQUFBQSxHQUFJLEdBQXRELENBQVIsQ0FBQTtBQUNILE9BQUE7S0FSTCxDQUFBLENBQUE7QUFVSCxHQUFBOztBQUVERSxFQUFBQSxJQUFJLENBQUNSLEdBQUQsRUFBTVMsSUFBTixFQUFZO0FBQ1osSUFBQSxPQUFPQSxJQUFQLENBQUE7QUFDSCxHQUFBOztBQUVEQyxFQUFBQSxLQUFLLENBQUNDLEtBQUQsRUFBUUMsTUFBUixFQUFnQixFQUNwQjs7QUFyQ2E7Ozs7In0=
