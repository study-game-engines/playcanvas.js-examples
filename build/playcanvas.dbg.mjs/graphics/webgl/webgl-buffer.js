/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { BUFFER_GPUDYNAMIC, BUFFER_STREAM, BUFFER_DYNAMIC, BUFFER_STATIC } from '../constants.js';

class WebglBuffer {
  constructor() {
    this.bufferId = null;
  }

  destroy(device) {
    if (this.bufferId) {
      device.gl.deleteBuffer(this.bufferId);
      this.bufferId = null;
    }
  }

  get initialized() {
    return !!this.bufferId;
  }

  loseContext() {
    this.bufferId = null;
  }

  unlock(device, usage, target, storage) {
    const gl = device.gl;

    if (!this.bufferId) {
      this.bufferId = gl.createBuffer();
    }

    let glUsage;

    switch (usage) {
      case BUFFER_STATIC:
        glUsage = gl.STATIC_DRAW;
        break;

      case BUFFER_DYNAMIC:
        glUsage = gl.DYNAMIC_DRAW;
        break;

      case BUFFER_STREAM:
        glUsage = gl.STREAM_DRAW;
        break;

      case BUFFER_GPUDYNAMIC:
        if (device.webgl2) {
          glUsage = gl.DYNAMIC_COPY;
        } else {
          glUsage = gl.STATIC_DRAW;
        }

        break;
    }

    gl.bindBuffer(target, this.bufferId);
    gl.bufferData(target, storage, glUsage);
  }

}

export { WebglBuffer };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViZ2wtYnVmZmVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZ3JhcGhpY3Mvd2ViZ2wvd2ViZ2wtYnVmZmVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJVRkZFUl9EWU5BTUlDLCBCVUZGRVJfR1BVRFlOQU1JQywgQlVGRkVSX1NUQVRJQywgQlVGRkVSX1NUUkVBTSB9IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5cbi8qKlxuICogQSBXZWJHTCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgQnVmZmVyLlxuICpcbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgV2ViZ2xCdWZmZXIge1xuICAgIGJ1ZmZlcklkID0gbnVsbDtcblxuICAgIGRlc3Ryb3koZGV2aWNlKSB7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlcklkKSB7XG4gICAgICAgICAgICBkZXZpY2UuZ2wuZGVsZXRlQnVmZmVyKHRoaXMuYnVmZmVySWQpO1xuICAgICAgICAgICAgdGhpcy5idWZmZXJJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgaW5pdGlhbGl6ZWQoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuYnVmZmVySWQ7XG4gICAgfVxuXG4gICAgbG9zZUNvbnRleHQoKSB7XG4gICAgICAgIHRoaXMuYnVmZmVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHVubG9jayhkZXZpY2UsIHVzYWdlLCB0YXJnZXQsIHN0b3JhZ2UpIHtcbiAgICAgICAgY29uc3QgZ2wgPSBkZXZpY2UuZ2w7XG5cbiAgICAgICAgaWYgKCF0aGlzLmJ1ZmZlcklkKSB7XG4gICAgICAgICAgICB0aGlzLmJ1ZmZlcklkID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZ2xVc2FnZTtcbiAgICAgICAgc3dpdGNoICh1c2FnZSkge1xuICAgICAgICAgICAgY2FzZSBCVUZGRVJfU1RBVElDOlxuICAgICAgICAgICAgICAgIGdsVXNhZ2UgPSBnbC5TVEFUSUNfRFJBVztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQlVGRkVSX0RZTkFNSUM6XG4gICAgICAgICAgICAgICAgZ2xVc2FnZSA9IGdsLkRZTkFNSUNfRFJBVztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQlVGRkVSX1NUUkVBTTpcbiAgICAgICAgICAgICAgICBnbFVzYWdlID0gZ2wuU1RSRUFNX0RSQVc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEJVRkZFUl9HUFVEWU5BTUlDOlxuICAgICAgICAgICAgICAgIGlmIChkZXZpY2Uud2ViZ2wyKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsVXNhZ2UgPSBnbC5EWU5BTUlDX0NPUFk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZ2xVc2FnZSA9IGdsLlNUQVRJQ19EUkFXO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGdsLmJpbmRCdWZmZXIodGFyZ2V0LCB0aGlzLmJ1ZmZlcklkKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YSh0YXJnZXQsIHN0b3JhZ2UsIGdsVXNhZ2UpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgV2ViZ2xCdWZmZXIgfTtcbiJdLCJuYW1lcyI6WyJXZWJnbEJ1ZmZlciIsImJ1ZmZlcklkIiwiZGVzdHJveSIsImRldmljZSIsImdsIiwiZGVsZXRlQnVmZmVyIiwiaW5pdGlhbGl6ZWQiLCJsb3NlQ29udGV4dCIsInVubG9jayIsInVzYWdlIiwidGFyZ2V0Iiwic3RvcmFnZSIsImNyZWF0ZUJ1ZmZlciIsImdsVXNhZ2UiLCJCVUZGRVJfU1RBVElDIiwiU1RBVElDX0RSQVciLCJCVUZGRVJfRFlOQU1JQyIsIkRZTkFNSUNfRFJBVyIsIkJVRkZFUl9TVFJFQU0iLCJTVFJFQU1fRFJBVyIsIkJVRkZFUl9HUFVEWU5BTUlDIiwid2ViZ2wyIiwiRFlOQU1JQ19DT1BZIiwiYmluZEJ1ZmZlciIsImJ1ZmZlckRhdGEiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFPQSxNQUFNQSxXQUFOLENBQWtCO0FBQUEsRUFBQSxXQUFBLEdBQUE7SUFBQSxJQUNkQyxDQUFBQSxRQURjLEdBQ0gsSUFERyxDQUFBO0FBQUEsR0FBQTs7RUFHZEMsT0FBTyxDQUFDQyxNQUFELEVBQVM7SUFDWixJQUFJLElBQUEsQ0FBS0YsUUFBVCxFQUFtQjtBQUNmRSxNQUFBQSxNQUFNLENBQUNDLEVBQVAsQ0FBVUMsWUFBVixDQUF1QixLQUFLSixRQUE1QixDQUFBLENBQUE7TUFDQSxJQUFLQSxDQUFBQSxRQUFMLEdBQWdCLElBQWhCLENBQUE7QUFDSCxLQUFBO0FBQ0osR0FBQTs7QUFFYyxFQUFBLElBQVhLLFdBQVcsR0FBRztJQUNkLE9BQU8sQ0FBQyxDQUFDLElBQUEsQ0FBS0wsUUFBZCxDQUFBO0FBQ0gsR0FBQTs7QUFFRE0sRUFBQUEsV0FBVyxHQUFHO0lBQ1YsSUFBS04sQ0FBQUEsUUFBTCxHQUFnQixJQUFoQixDQUFBO0FBQ0gsR0FBQTs7RUFFRE8sTUFBTSxDQUFDTCxNQUFELEVBQVNNLEtBQVQsRUFBZ0JDLE1BQWhCLEVBQXdCQyxPQUF4QixFQUFpQztBQUNuQyxJQUFBLE1BQU1QLEVBQUUsR0FBR0QsTUFBTSxDQUFDQyxFQUFsQixDQUFBOztJQUVBLElBQUksQ0FBQyxJQUFLSCxDQUFBQSxRQUFWLEVBQW9CO0FBQ2hCLE1BQUEsSUFBQSxDQUFLQSxRQUFMLEdBQWdCRyxFQUFFLENBQUNRLFlBQUgsRUFBaEIsQ0FBQTtBQUNILEtBQUE7O0FBRUQsSUFBQSxJQUFJQyxPQUFKLENBQUE7O0FBQ0EsSUFBQSxRQUFRSixLQUFSO0FBQ0ksTUFBQSxLQUFLSyxhQUFMO1FBQ0lELE9BQU8sR0FBR1QsRUFBRSxDQUFDVyxXQUFiLENBQUE7QUFDQSxRQUFBLE1BQUE7O0FBQ0osTUFBQSxLQUFLQyxjQUFMO1FBQ0lILE9BQU8sR0FBR1QsRUFBRSxDQUFDYSxZQUFiLENBQUE7QUFDQSxRQUFBLE1BQUE7O0FBQ0osTUFBQSxLQUFLQyxhQUFMO1FBQ0lMLE9BQU8sR0FBR1QsRUFBRSxDQUFDZSxXQUFiLENBQUE7QUFDQSxRQUFBLE1BQUE7O0FBQ0osTUFBQSxLQUFLQyxpQkFBTDtRQUNJLElBQUlqQixNQUFNLENBQUNrQixNQUFYLEVBQW1CO1VBQ2ZSLE9BQU8sR0FBR1QsRUFBRSxDQUFDa0IsWUFBYixDQUFBO0FBQ0gsU0FGRCxNQUVPO1VBQ0hULE9BQU8sR0FBR1QsRUFBRSxDQUFDVyxXQUFiLENBQUE7QUFDSCxTQUFBOztBQUNELFFBQUEsTUFBQTtBQWhCUixLQUFBOztBQW1CQVgsSUFBQUEsRUFBRSxDQUFDbUIsVUFBSCxDQUFjYixNQUFkLEVBQXNCLEtBQUtULFFBQTNCLENBQUEsQ0FBQTtBQUNBRyxJQUFBQSxFQUFFLENBQUNvQixVQUFILENBQWNkLE1BQWQsRUFBc0JDLE9BQXRCLEVBQStCRSxPQUEvQixDQUFBLENBQUE7QUFDSCxHQUFBOztBQS9DYTs7OzsifQ==
