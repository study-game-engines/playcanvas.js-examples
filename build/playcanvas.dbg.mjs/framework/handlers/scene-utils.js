/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { http } from '../../platform/net/http.js';

const SceneUtils = {
  /**
   * @private
   * @function
   * @static
   * @name SceneUtils.load
   * @description Loads the scene JSON file from a URL.
   * @param {string} url - URL to scene JSON.
   * @param {number} maxRetries - Number of http load retry attempts.
   * @param {Function} callback - The callback to the JSON file is loaded.
   */
  load: function (url, maxRetries, callback) {
    if (typeof url === 'string') {
      url = {
        load: url,
        original: url
      };
    }
    http.get(url.load, {
      retry: maxRetries > 0,
      maxRetries: maxRetries
    }, function (err, response) {
      if (!err) {
        callback(err, response);
      } else {
        let errMsg = 'Error while loading scene JSON ' + url.original;
        if (err.message) {
          errMsg += ': ' + err.message;
          if (err.stack) {
            errMsg += '\n' + err.stack;
          }
        } else {
          errMsg += ': ' + err;
        }
        callback(errMsg);
      }
    });
  }
};

export { SceneUtils };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdXRpbHMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9mcmFtZXdvcmsvaGFuZGxlcnMvc2NlbmUtdXRpbHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaHR0cCB9IGZyb20gJy4uLy4uL3BsYXRmb3JtL25ldC9odHRwLmpzJztcblxuY29uc3QgU2NlbmVVdGlscyA9IHtcbiAgICAvKipcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbmFtZSBTY2VuZVV0aWxzLmxvYWRcbiAgICAgKiBAZGVzY3JpcHRpb24gTG9hZHMgdGhlIHNjZW5lIEpTT04gZmlsZSBmcm9tIGEgVVJMLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBVUkwgdG8gc2NlbmUgSlNPTi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbWF4UmV0cmllcyAtIE51bWJlciBvZiBodHRwIGxvYWQgcmV0cnkgYXR0ZW1wdHMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgdG8gdGhlIEpTT04gZmlsZSBpcyBsb2FkZWQuXG4gICAgICovXG4gICAgbG9hZDogZnVuY3Rpb24gKHVybCwgbWF4UmV0cmllcywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB1cmwgPSB7XG4gICAgICAgICAgICAgICAgbG9hZDogdXJsLFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsOiB1cmxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBodHRwLmdldCh1cmwubG9hZCwge1xuICAgICAgICAgICAgcmV0cnk6IG1heFJldHJpZXMgPiAwLFxuICAgICAgICAgICAgbWF4UmV0cmllczogbWF4UmV0cmllc1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCByZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IGVyck1zZyA9ICdFcnJvciB3aGlsZSBsb2FkaW5nIHNjZW5lIEpTT04gJyArIHVybC5vcmlnaW5hbDtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyTXNnICs9ICc6ICcgKyBlcnIubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyTXNnICs9ICdcXG4nICsgZXJyLnN0YWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyTXNnICs9ICc6ICcgKyBlcnI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyTXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IHsgU2NlbmVVdGlscyB9O1xuIl0sIm5hbWVzIjpbIlNjZW5lVXRpbHMiLCJsb2FkIiwidXJsIiwibWF4UmV0cmllcyIsImNhbGxiYWNrIiwib3JpZ2luYWwiLCJodHRwIiwiZ2V0IiwicmV0cnkiLCJlcnIiLCJyZXNwb25zZSIsImVyck1zZyIsIm1lc3NhZ2UiLCJzdGFjayJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBLE1BQU1BLFVBQVUsR0FBRztBQUNmO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0lDLElBQUksRUFBRSxVQUFVQyxHQUFHLEVBQUVDLFVBQVUsRUFBRUMsUUFBUSxFQUFFO0FBQ3ZDLElBQUEsSUFBSSxPQUFPRixHQUFHLEtBQUssUUFBUSxFQUFFO0FBQ3pCQSxNQUFBQSxHQUFHLEdBQUc7QUFDRkQsUUFBQUEsSUFBSSxFQUFFQyxHQUFHO0FBQ1RHLFFBQUFBLFFBQVEsRUFBRUgsR0FBQUE7T0FDYixDQUFBO0FBQ0wsS0FBQTtBQUVBSSxJQUFBQSxJQUFJLENBQUNDLEdBQUcsQ0FBQ0wsR0FBRyxDQUFDRCxJQUFJLEVBQUU7TUFDZk8sS0FBSyxFQUFFTCxVQUFVLEdBQUcsQ0FBQztBQUNyQkEsTUFBQUEsVUFBVSxFQUFFQSxVQUFBQTtBQUNoQixLQUFDLEVBQUUsVUFBVU0sR0FBRyxFQUFFQyxRQUFRLEVBQUU7TUFDeEIsSUFBSSxDQUFDRCxHQUFHLEVBQUU7QUFDTkwsUUFBQUEsUUFBUSxDQUFDSyxHQUFHLEVBQUVDLFFBQVEsQ0FBQyxDQUFBO0FBQzNCLE9BQUMsTUFBTTtBQUNILFFBQUEsSUFBSUMsTUFBTSxHQUFHLGlDQUFpQyxHQUFHVCxHQUFHLENBQUNHLFFBQVEsQ0FBQTtRQUM3RCxJQUFJSSxHQUFHLENBQUNHLE9BQU8sRUFBRTtBQUNiRCxVQUFBQSxNQUFNLElBQUksSUFBSSxHQUFHRixHQUFHLENBQUNHLE9BQU8sQ0FBQTtVQUM1QixJQUFJSCxHQUFHLENBQUNJLEtBQUssRUFBRTtBQUNYRixZQUFBQSxNQUFNLElBQUksSUFBSSxHQUFHRixHQUFHLENBQUNJLEtBQUssQ0FBQTtBQUM5QixXQUFBO0FBQ0osU0FBQyxNQUFNO1VBQ0hGLE1BQU0sSUFBSSxJQUFJLEdBQUdGLEdBQUcsQ0FBQTtBQUN4QixTQUFBO1FBRUFMLFFBQVEsQ0FBQ08sTUFBTSxDQUFDLENBQUE7QUFDcEIsT0FBQTtBQUNKLEtBQUMsQ0FBQyxDQUFBO0FBQ04sR0FBQTtBQUNKOzs7OyJ9
