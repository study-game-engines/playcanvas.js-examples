/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../core/debug.js';
import { TRACEID_VRAM_VB } from '../core/constants.js';
import { BUFFER_STATIC } from './constants.js';

let id = 0;

class VertexBuffer {
  constructor(graphicsDevice, format, numVertices, usage = BUFFER_STATIC, initialData) {
    this.device = graphicsDevice;
    this.format = format;
    this.numVertices = numVertices;
    this.usage = usage;
    this.id = id++;
    this.impl = graphicsDevice.createVertexBufferImpl(this, format);
    this.instancing = false;
    this.numBytes = format.verticesByteSize ? format.verticesByteSize : format.size * numVertices;
    this.adjustVramSizeTracking(graphicsDevice._vram, this.numBytes);

    if (initialData) {
      this.setData(initialData);
    } else {
      this.storage = new ArrayBuffer(this.numBytes);
    }

    this.device.buffers.push(this);
  }

  destroy() {
    const device = this.device;
    const idx = device.buffers.indexOf(this);

    if (idx !== -1) {
      device.buffers.splice(idx, 1);
    }

    if (this.impl.initialized) {
      this.impl.destroy(device);
      this.adjustVramSizeTracking(device._vram, -this.storage.byteLength);
    }
  }

  adjustVramSizeTracking(vram, size) {
    Debug.trace(TRACEID_VRAM_VB, `${this.id} size: ${size} vram.vb: ${vram.vb} => ${vram.vb + size}`);
    vram.vb += size;
  }

  loseContext() {
    this.impl.loseContext();
  }

  getFormat() {
    return this.format;
  }

  getUsage() {
    return this.usage;
  }

  getNumVertices() {
    return this.numVertices;
  }

  lock() {
    return this.storage;
  }

  unlock() {
    this.impl.unlock(this);
  }

  setData(data) {
    if (data.byteLength !== this.numBytes) {
      Debug.error(`VertexBuffer: wrong initial data size: expected ${this.numBytes}, got ${data.byteLength}`);
      return false;
    }

    this.storage = data;
    this.unlock();
    return true;
  }

}

export { VertexBuffer };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVydGV4LWJ1ZmZlci5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2dyYXBoaWNzL3ZlcnRleC1idWZmZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGVidWcgfSBmcm9tICcuLi9jb3JlL2RlYnVnLmpzJztcbmltcG9ydCB7IFRSQUNFSURfVlJBTV9WQiB9IGZyb20gJy4uL2NvcmUvY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IEJVRkZFUl9TVEFUSUMgfSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2dyYXBoaWNzLWRldmljZS5qcycpLkdyYXBoaWNzRGV2aWNlfSBHcmFwaGljc0RldmljZSAqL1xuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4vdmVydGV4LWZvcm1hdC5qcycpLlZlcnRleEZvcm1hdH0gVmVydGV4Rm9ybWF0ICovXG5cbmxldCBpZCA9IDA7XG5cbi8qKlxuICogQSB2ZXJ0ZXggYnVmZmVyIGlzIHRoZSBtZWNoYW5pc20gdmlhIHdoaWNoIHRoZSBhcHBsaWNhdGlvbiBzcGVjaWZpZXMgdmVydGV4IGRhdGEgdG8gdGhlIGdyYXBoaWNzXG4gKiBoYXJkd2FyZS5cbiAqL1xuY2xhc3MgVmVydGV4QnVmZmVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgVmVydGV4QnVmZmVyIGluc3RhbmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtHcmFwaGljc0RldmljZX0gZ3JhcGhpY3NEZXZpY2UgLSBUaGUgZ3JhcGhpY3MgZGV2aWNlIHVzZWQgdG8gbWFuYWdlIHRoaXMgdmVydGV4XG4gICAgICogYnVmZmVyLlxuICAgICAqIEBwYXJhbSB7VmVydGV4Rm9ybWF0fSBmb3JtYXQgLSBUaGUgdmVydGV4IGZvcm1hdCBvZiB0aGlzIHZlcnRleCBidWZmZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG51bVZlcnRpY2VzIC0gVGhlIG51bWJlciBvZiB2ZXJ0aWNlcyB0aGF0IHRoaXMgdmVydGV4IGJ1ZmZlciB3aWxsIGhvbGQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt1c2FnZV0gLSBUaGUgdXNhZ2UgdHlwZSBvZiB0aGUgdmVydGV4IGJ1ZmZlciAoc2VlIEJVRkZFUl8qKS4gRGVmYXVsdHMgdG8gQlVGRkVSX1NUQVRJQy5cbiAgICAgKiBAcGFyYW0ge0FycmF5QnVmZmVyfSBbaW5pdGlhbERhdGFdIC0gSW5pdGlhbCBkYXRhLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGdyYXBoaWNzRGV2aWNlLCBmb3JtYXQsIG51bVZlcnRpY2VzLCB1c2FnZSA9IEJVRkZFUl9TVEFUSUMsIGluaXRpYWxEYXRhKSB7XG4gICAgICAgIC8vIEJ5IGRlZmF1bHQsIHZlcnRleCBidWZmZXJzIGFyZSBzdGF0aWMgKGJldHRlciBmb3IgcGVyZm9ybWFuY2Ugc2luY2UgYnVmZmVyIGRhdGEgY2FuIGJlIGNhY2hlZCBpbiBWUkFNKVxuICAgICAgICB0aGlzLmRldmljZSA9IGdyYXBoaWNzRGV2aWNlO1xuICAgICAgICB0aGlzLmZvcm1hdCA9IGZvcm1hdDtcbiAgICAgICAgdGhpcy5udW1WZXJ0aWNlcyA9IG51bVZlcnRpY2VzO1xuICAgICAgICB0aGlzLnVzYWdlID0gdXNhZ2U7XG5cbiAgICAgICAgdGhpcy5pZCA9IGlkKys7XG5cbiAgICAgICAgdGhpcy5pbXBsID0gZ3JhcGhpY3NEZXZpY2UuY3JlYXRlVmVydGV4QnVmZmVySW1wbCh0aGlzLCBmb3JtYXQpO1xuXG4gICAgICAgIC8vIG1hcmtzIHZlcnRleCBidWZmZXIgYXMgaW5zdGFuY2luZyBkYXRhXG4gICAgICAgIHRoaXMuaW5zdGFuY2luZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgc2l6ZS4gSWYgZm9ybWF0IGNvbnRhaW5zIHZlcnRpY2VzQnl0ZVNpemUgKG5vbi1pbnRlcmxlYXZlZCBmb3JtYXQpLCB1c2UgaXRcbiAgICAgICAgdGhpcy5udW1CeXRlcyA9IGZvcm1hdC52ZXJ0aWNlc0J5dGVTaXplID8gZm9ybWF0LnZlcnRpY2VzQnl0ZVNpemUgOiBmb3JtYXQuc2l6ZSAqIG51bVZlcnRpY2VzO1xuICAgICAgICB0aGlzLmFkanVzdFZyYW1TaXplVHJhY2tpbmcoZ3JhcGhpY3NEZXZpY2UuX3ZyYW0sIHRoaXMubnVtQnl0ZXMpO1xuXG4gICAgICAgIC8vIEFsbG9jYXRlIHRoZSBzdG9yYWdlXG4gICAgICAgIGlmIChpbml0aWFsRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5zZXREYXRhKGluaXRpYWxEYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcmFnZSA9IG5ldyBBcnJheUJ1ZmZlcih0aGlzLm51bUJ5dGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGV2aWNlLmJ1ZmZlcnMucHVzaCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGcmVlcyByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgdmVydGV4IGJ1ZmZlci5cbiAgICAgKi9cbiAgICBkZXN0cm95KCkge1xuXG4gICAgICAgIC8vIHN0b3AgdHJhY2tpbmcgdGhlIHZlcnRleCBidWZmZXJcbiAgICAgICAgY29uc3QgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG4gICAgICAgIGNvbnN0IGlkeCA9IGRldmljZS5idWZmZXJzLmluZGV4T2YodGhpcyk7XG4gICAgICAgIGlmIChpZHggIT09IC0xKSB7XG4gICAgICAgICAgICBkZXZpY2UuYnVmZmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmltcGwuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaW1wbC5kZXN0cm95KGRldmljZSk7XG4gICAgICAgICAgICB0aGlzLmFkanVzdFZyYW1TaXplVHJhY2tpbmcoZGV2aWNlLl92cmFtLCAtdGhpcy5zdG9yYWdlLmJ5dGVMZW5ndGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWRqdXN0VnJhbVNpemVUcmFja2luZyh2cmFtLCBzaXplKSB7XG4gICAgICAgIERlYnVnLnRyYWNlKFRSQUNFSURfVlJBTV9WQiwgYCR7dGhpcy5pZH0gc2l6ZTogJHtzaXplfSB2cmFtLnZiOiAke3ZyYW0udmJ9ID0+ICR7dnJhbS52YiArIHNpemV9YCk7XG4gICAgICAgIHZyYW0udmIgKz0gc2l6ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgcmVuZGVyaW5nIGNvbnRleHQgd2FzIGxvc3QuIEl0IHJlbGVhc2VzIGFsbCBjb250ZXh0IHJlbGF0ZWQgcmVzb3VyY2VzLlxuICAgICAqXG4gICAgICogQGlnbm9yZVxuICAgICAqL1xuICAgIGxvc2VDb250ZXh0KCkge1xuICAgICAgICB0aGlzLmltcGwubG9zZUNvbnRleHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBkYXRhIGZvcm1hdCBvZiB0aGUgc3BlY2lmaWVkIHZlcnRleCBidWZmZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7VmVydGV4Rm9ybWF0fSBUaGUgZGF0YSBmb3JtYXQgb2YgdGhlIHNwZWNpZmllZCB2ZXJ0ZXggYnVmZmVyLlxuICAgICAqL1xuICAgIGdldEZvcm1hdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHVzYWdlIHR5cGUgb2YgdGhlIHNwZWNpZmllZCB2ZXJ0ZXggYnVmZmVyLiBUaGlzIGluZGljYXRlcyB3aGV0aGVyIHRoZSBidWZmZXIgY2FuXG4gICAgICogYmUgbW9kaWZpZWQgb25jZSBhbmQgdXNlZCBtYW55IHRpbWVzIHtAbGluayBCVUZGRVJfU1RBVElDfSwgbW9kaWZpZWQgcmVwZWF0ZWRseSBhbmQgdXNlZFxuICAgICAqIG1hbnkgdGltZXMge0BsaW5rIEJVRkZFUl9EWU5BTUlDfSBvciBtb2RpZmllZCBvbmNlIGFuZCB1c2VkIGF0IG1vc3QgYSBmZXcgdGltZXNcbiAgICAgKiB7QGxpbmsgQlVGRkVSX1NUUkVBTX0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgdXNhZ2UgdHlwZSBvZiB0aGUgdmVydGV4IGJ1ZmZlciAoc2VlIEJVRkZFUl8qKS5cbiAgICAgKi9cbiAgICBnZXRVc2FnZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXNhZ2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIHZlcnRpY2VzIHN0b3JlZCBpbiB0aGUgc3BlY2lmaWVkIHZlcnRleCBidWZmZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIHZlcnRpY2VzIHN0b3JlZCBpbiB0aGUgdmVydGV4IGJ1ZmZlci5cbiAgICAgKi9cbiAgICBnZXROdW1WZXJ0aWNlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubnVtVmVydGljZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG1hcHBlZCBtZW1vcnkgYmxvY2sgcmVwcmVzZW50aW5nIHRoZSBjb250ZW50IG9mIHRoZSB2ZXJ0ZXggYnVmZmVyLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0FycmF5QnVmZmVyfSBBbiBhcnJheSBjb250YWluaW5nIHRoZSBieXRlIGRhdGEgc3RvcmVkIGluIHRoZSB2ZXJ0ZXggYnVmZmVyLlxuICAgICAqL1xuICAgIGxvY2soKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0b3JhZ2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTm90aWZpZXMgdGhlIGdyYXBoaWNzIGVuZ2luZSB0aGF0IHRoZSBjbGllbnQgc2lkZSBjb3B5IG9mIHRoZSB2ZXJ0ZXggYnVmZmVyJ3MgbWVtb3J5IGNhbiBiZVxuICAgICAqIHJldHVybmVkIHRvIHRoZSBjb250cm9sIG9mIHRoZSBncmFwaGljcyBkcml2ZXIuXG4gICAgICovXG4gICAgdW5sb2NrKCkge1xuXG4gICAgICAgIC8vIFVwbG9hZCB0aGUgbmV3IHZlcnRleCBkYXRhXG4gICAgICAgIHRoaXMuaW1wbC51bmxvY2sodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29waWVzIGRhdGEgaW50byB2ZXJ0ZXggYnVmZmVyJ3MgbWVtb3J5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gW2RhdGFdIC0gU291cmNlIGRhdGEgdG8gY29weS5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiBmdW5jdGlvbiBmaW5pc2hlZCBzdWNjZXNzZnVsbHksIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBzZXREYXRhKGRhdGEpIHtcbiAgICAgICAgaWYgKGRhdGEuYnl0ZUxlbmd0aCAhPT0gdGhpcy5udW1CeXRlcykge1xuICAgICAgICAgICAgRGVidWcuZXJyb3IoYFZlcnRleEJ1ZmZlcjogd3JvbmcgaW5pdGlhbCBkYXRhIHNpemU6IGV4cGVjdGVkICR7dGhpcy5udW1CeXRlc30sIGdvdCAke2RhdGEuYnl0ZUxlbmd0aH1gKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0b3JhZ2UgPSBkYXRhO1xuICAgICAgICB0aGlzLnVubG9jaygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFZlcnRleEJ1ZmZlciB9O1xuIl0sIm5hbWVzIjpbImlkIiwiVmVydGV4QnVmZmVyIiwiY29uc3RydWN0b3IiLCJncmFwaGljc0RldmljZSIsImZvcm1hdCIsIm51bVZlcnRpY2VzIiwidXNhZ2UiLCJCVUZGRVJfU1RBVElDIiwiaW5pdGlhbERhdGEiLCJkZXZpY2UiLCJpbXBsIiwiY3JlYXRlVmVydGV4QnVmZmVySW1wbCIsImluc3RhbmNpbmciLCJudW1CeXRlcyIsInZlcnRpY2VzQnl0ZVNpemUiLCJzaXplIiwiYWRqdXN0VnJhbVNpemVUcmFja2luZyIsIl92cmFtIiwic2V0RGF0YSIsInN0b3JhZ2UiLCJBcnJheUJ1ZmZlciIsImJ1ZmZlcnMiLCJwdXNoIiwiZGVzdHJveSIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJpbml0aWFsaXplZCIsImJ5dGVMZW5ndGgiLCJ2cmFtIiwiRGVidWciLCJ0cmFjZSIsIlRSQUNFSURfVlJBTV9WQiIsInZiIiwibG9zZUNvbnRleHQiLCJnZXRGb3JtYXQiLCJnZXRVc2FnZSIsImdldE51bVZlcnRpY2VzIiwibG9jayIsInVubG9jayIsImRhdGEiLCJlcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBT0EsSUFBSUEsRUFBRSxHQUFHLENBQVQsQ0FBQTs7QUFNQSxNQUFNQyxZQUFOLENBQW1CO0FBV2ZDLEVBQUFBLFdBQVcsQ0FBQ0MsY0FBRCxFQUFpQkMsTUFBakIsRUFBeUJDLFdBQXpCLEVBQXNDQyxLQUFLLEdBQUdDLGFBQTlDLEVBQTZEQyxXQUE3RCxFQUEwRTtJQUVqRixJQUFLQyxDQUFBQSxNQUFMLEdBQWNOLGNBQWQsQ0FBQTtJQUNBLElBQUtDLENBQUFBLE1BQUwsR0FBY0EsTUFBZCxDQUFBO0lBQ0EsSUFBS0MsQ0FBQUEsV0FBTCxHQUFtQkEsV0FBbkIsQ0FBQTtJQUNBLElBQUtDLENBQUFBLEtBQUwsR0FBYUEsS0FBYixDQUFBO0lBRUEsSUFBS04sQ0FBQUEsRUFBTCxHQUFVQSxFQUFFLEVBQVosQ0FBQTtJQUVBLElBQUtVLENBQUFBLElBQUwsR0FBWVAsY0FBYyxDQUFDUSxzQkFBZixDQUFzQyxJQUF0QyxFQUE0Q1AsTUFBNUMsQ0FBWixDQUFBO0lBR0EsSUFBS1EsQ0FBQUEsVUFBTCxHQUFrQixLQUFsQixDQUFBO0FBR0EsSUFBQSxJQUFBLENBQUtDLFFBQUwsR0FBZ0JULE1BQU0sQ0FBQ1UsZ0JBQVAsR0FBMEJWLE1BQU0sQ0FBQ1UsZ0JBQWpDLEdBQW9EVixNQUFNLENBQUNXLElBQVAsR0FBY1YsV0FBbEYsQ0FBQTtBQUNBLElBQUEsSUFBQSxDQUFLVyxzQkFBTCxDQUE0QmIsY0FBYyxDQUFDYyxLQUEzQyxFQUFrRCxLQUFLSixRQUF2RCxDQUFBLENBQUE7O0FBR0EsSUFBQSxJQUFJTCxXQUFKLEVBQWlCO01B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
