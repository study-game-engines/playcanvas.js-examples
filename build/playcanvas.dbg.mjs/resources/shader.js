/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { http } from '../net/http.js';

class ShaderHandler {
  constructor(app) {
    this.handlerType = "shader";
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
        callback(`Error loading shader resource: ${url.original} [${err}]`);
      }
    });
  }

  open(url, data) {
    return data;
  }

  patch(asset, assets) {}

}

export { ShaderHandler };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZGVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcmVzb3VyY2VzL3NoYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBodHRwIH0gZnJvbSAnLi4vbmV0L2h0dHAuanMnO1xuXG5jbGFzcyBTaGFkZXJIYW5kbGVyIHtcbiAgICAvKipcbiAgICAgKiBUeXBlIG9mIHRoZSByZXNvdXJjZSB0aGUgaGFuZGxlciBoYW5kbGVzLlxuICAgICAqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBoYW5kbGVyVHlwZSA9IFwic2hhZGVyXCI7XG5cbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcbiAgICAgICAgdGhpcy5tYXhSZXRyaWVzID0gMDtcbiAgICB9XG5cbiAgICBsb2FkKHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB1cmwgPSB7XG4gICAgICAgICAgICAgICAgbG9hZDogdXJsLFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsOiB1cmxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBodHRwLmdldCh1cmwubG9hZCwge1xuICAgICAgICAgICAgcmV0cnk6IHRoaXMubWF4UmV0cmllcyA+IDAsXG4gICAgICAgICAgICBtYXhSZXRyaWVzOiB0aGlzLm1heFJldHJpZXNcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhgRXJyb3IgbG9hZGluZyBzaGFkZXIgcmVzb3VyY2U6ICR7dXJsLm9yaWdpbmFsfSBbJHtlcnJ9XWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvcGVuKHVybCwgZGF0YSkge1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG5cbiAgICBwYXRjaChhc3NldCwgYXNzZXRzKSB7XG4gICAgfVxufVxuXG5leHBvcnQgeyBTaGFkZXJIYW5kbGVyIH07XG4iXSwibmFtZXMiOlsiU2hhZGVySGFuZGxlciIsImNvbnN0cnVjdG9yIiwiYXBwIiwiaGFuZGxlclR5cGUiLCJtYXhSZXRyaWVzIiwibG9hZCIsInVybCIsImNhbGxiYWNrIiwib3JpZ2luYWwiLCJodHRwIiwiZ2V0IiwicmV0cnkiLCJlcnIiLCJyZXNwb25zZSIsIm9wZW4iLCJkYXRhIiwicGF0Y2giLCJhc3NldCIsImFzc2V0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBLE1BQU1BLGFBQU4sQ0FBb0I7RUFRaEJDLFdBQVcsQ0FBQ0MsR0FBRCxFQUFNO0lBQUEsSUFGakJDLENBQUFBLFdBRWlCLEdBRkgsUUFFRyxDQUFBO0lBQ2IsSUFBS0MsQ0FBQUEsVUFBTCxHQUFrQixDQUFsQixDQUFBO0FBQ0gsR0FBQTs7QUFFREMsRUFBQUEsSUFBSSxDQUFDQyxHQUFELEVBQU1DLFFBQU4sRUFBZ0I7QUFDaEIsSUFBQSxJQUFJLE9BQU9ELEdBQVAsS0FBZSxRQUFuQixFQUE2QjtBQUN6QkEsTUFBQUEsR0FBRyxHQUFHO0FBQ0ZELFFBQUFBLElBQUksRUFBRUMsR0FESjtBQUVGRSxRQUFBQSxRQUFRLEVBQUVGLEdBQUFBO09BRmQsQ0FBQTtBQUlILEtBQUE7O0FBRURHLElBQUFBLElBQUksQ0FBQ0MsR0FBTCxDQUFTSixHQUFHLENBQUNELElBQWIsRUFBbUI7QUFDZk0sTUFBQUEsS0FBSyxFQUFFLElBQUEsQ0FBS1AsVUFBTCxHQUFrQixDQURWO0FBRWZBLE1BQUFBLFVBQVUsRUFBRSxJQUFLQSxDQUFBQSxVQUFBQTtBQUZGLEtBQW5CLEVBR0csVUFBVVEsR0FBVixFQUFlQyxRQUFmLEVBQXlCO01BQ3hCLElBQUksQ0FBQ0QsR0FBTCxFQUFVO0FBQ05MLFFBQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU9NLFFBQVAsQ0FBUixDQUFBO0FBQ0gsT0FGRCxNQUVPO1FBQ0hOLFFBQVEsQ0FBRSxrQ0FBaUNELEdBQUcsQ0FBQ0UsUUFBUyxDQUFJSSxFQUFBQSxFQUFBQSxHQUFJLEdBQXhELENBQVIsQ0FBQTtBQUNILE9BQUE7S0FSTCxDQUFBLENBQUE7QUFVSCxHQUFBOztBQUVERSxFQUFBQSxJQUFJLENBQUNSLEdBQUQsRUFBTVMsSUFBTixFQUFZO0FBQ1osSUFBQSxPQUFPQSxJQUFQLENBQUE7QUFDSCxHQUFBOztBQUVEQyxFQUFBQSxLQUFLLENBQUNDLEtBQUQsRUFBUUMsTUFBUixFQUFnQixFQUNwQjs7QUFyQ2U7Ozs7In0=
