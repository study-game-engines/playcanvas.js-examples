/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { Debug } from '../../core/debug.js';
import { TRACEID_VRAM_IB } from '../../core/constants.js';
import { typedArrayIndexFormatsByteSize, BUFFER_STATIC, INDEXFORMAT_UINT32, INDEXFORMAT_UINT16 } from './constants.js';

let id = 0;

/**
 * An index buffer stores index values into a {@link VertexBuffer}. Indexed graphical primitives
 * can normally utilize less memory that unindexed primitives (if vertices are shared).
 *
 * Typically, index buffers are set on {@link Mesh} objects.
 */
class IndexBuffer {
  /**
   * Create a new IndexBuffer instance.
   *
   * @param {import('./graphics-device.js').GraphicsDevice} graphicsDevice - The graphics device
   * used to manage this index buffer.
   * @param {number} format - The type of each index to be stored in the index buffer. Can be:
   *
   * - {@link INDEXFORMAT_UINT8}
   * - {@link INDEXFORMAT_UINT16}
   * - {@link INDEXFORMAT_UINT32}
   * @param {number} numIndices - The number of indices to be stored in the index buffer.
   * @param {number} [usage] - The usage type of the vertex buffer. Can be:
   *
   * - {@link BUFFER_DYNAMIC}
   * - {@link BUFFER_STATIC}
   * - {@link BUFFER_STREAM}
   *
   * Defaults to {@link BUFFER_STATIC}.
   * @param {ArrayBuffer} [initialData] - Initial data. If left unspecified, the index buffer
   * will be initialized to zeros.
   * @example
   * // Create an index buffer holding 3 16-bit indices. The buffer is marked as
   * // static, hinting that the buffer will never be modified.
   * var indices = new UInt16Array([0, 1, 2]);
   * var indexBuffer = new pc.IndexBuffer(graphicsDevice,
   *                                      pc.INDEXFORMAT_UINT16,
   *                                      3,
   *                                      pc.BUFFER_STATIC,
   *                                      indices);
   */
  constructor(graphicsDevice, format, numIndices, usage = BUFFER_STATIC, initialData) {
    // By default, index buffers are static (better for performance since buffer data can be cached in VRAM)
    this.device = graphicsDevice;
    this.format = format;
    this.numIndices = numIndices;
    this.usage = usage;
    this.id = id++;
    this.impl = graphicsDevice.createIndexBufferImpl(this);

    // Allocate the storage
    const bytesPerIndex = typedArrayIndexFormatsByteSize[format];
    this.bytesPerIndex = bytesPerIndex;
    this.numBytes = this.numIndices * bytesPerIndex;
    if (initialData) {
      this.setData(initialData);
    } else {
      this.storage = new ArrayBuffer(this.numBytes);
    }
    this.adjustVramSizeTracking(graphicsDevice._vram, this.numBytes);
    this.device.buffers.push(this);
  }

  /**
   * Frees resources associated with this index buffer.
   */
  destroy() {
    // stop tracking the index buffer
    const device = this.device;
    const idx = device.buffers.indexOf(this);
    if (idx !== -1) {
      device.buffers.splice(idx, 1);
    }
    if (this.device.indexBuffer === this) {
      this.device.indexBuffer = null;
    }
    if (this.impl.initialized) {
      this.impl.destroy(device);
      this.adjustVramSizeTracking(device._vram, -this.storage.byteLength);
    }
  }
  adjustVramSizeTracking(vram, size) {
    Debug.trace(TRACEID_VRAM_IB, `${this.id} size: ${size} vram.ib: ${vram.ib} => ${vram.ib + size}`);
    vram.ib += size;
  }

  /**
   * Called when the rendering context was lost. It releases all context related resources.
   *
   * @ignore
   */
  loseContext() {
    this.impl.loseContext();
  }

  /**
   * Returns the data format of the specified index buffer.
   *
   * @returns {number} The data format of the specified index buffer. Can be:
   *
   * - {@link INDEXFORMAT_UINT8}
   * - {@link INDEXFORMAT_UINT16}
   * - {@link INDEXFORMAT_UINT32}
   */
  getFormat() {
    return this.format;
  }

  /**
   * Returns the number of indices stored in the specified index buffer.
   *
   * @returns {number} The number of indices stored in the specified index buffer.
   */
  getNumIndices() {
    return this.numIndices;
  }

  /**
   * Gives access to the block of memory that stores the buffer's indices.
   *
   * @returns {ArrayBuffer} A contiguous block of memory where index data can be written to.
   */
  lock() {
    return this.storage;
  }

  /**
   * Signals that the block of memory returned by a call to the lock function is ready to be
   * given to the graphics hardware. Only unlocked index buffers can be set on the currently
   * active device.
   */
  unlock() {
    // Upload the new index data
    this.impl.unlock(this);
  }

  /**
   * Set preallocated data on the index buffer.
   *
   * @param {ArrayBuffer} data - The index data to set.
   * @returns {boolean} True if the data was set successfully, false otherwise.
   * @ignore
   */
  setData(data) {
    if (data.byteLength !== this.numBytes) {
      Debug.error(`IndexBuffer: wrong initial data size: expected ${this.numBytes}, got ${data.byteLength}`);
      return false;
    }
    this.storage = data;
    this.unlock();
    return true;
  }

  /**
   * Get the appropriate typed array from an index buffer.
   *
   * @returns {Uint8Array|Uint16Array|Uint32Array} The typed array containing the index data.
   * @private
   */
  _lockTypedArray() {
    const lock = this.lock();
    const indices = this.format === INDEXFORMAT_UINT32 ? new Uint32Array(lock) : this.format === INDEXFORMAT_UINT16 ? new Uint16Array(lock) : new Uint8Array(lock);
    return indices;
  }

  /**
   * Copies the specified number of elements from data into index buffer. Optimized for
   * performance from both typed array as well as array.
   *
   * @param {Uint8Array|Uint16Array|Uint32Array|number[]} data - The data to write.
   * @param {number} count - The number of indices to write.
   * @ignore
   */
  writeData(data, count) {
    const indices = this._lockTypedArray();

    // if data contains more indices than needed, copy from its subarray
    if (data.length > count) {
      // if data is typed array
      if (ArrayBuffer.isView(data)) {
        data = data.subarray(0, count);
        indices.set(data);
      } else {
        // data is array, copy right amount manually
        for (let i = 0; i < count; i++) indices[i] = data[i];
      }
    } else {
      // copy whole data
      indices.set(data);
    }
    this.unlock();
  }

  /**
   * Copies index data from index buffer into provided data array.
   *
   * @param {Uint8Array|Uint16Array|Uint32Array|number[]} data - The data array to write to.
   * @returns {number} The number of indices read.
   * @ignore
   */
  readData(data) {
    // note: there is no need to unlock this buffer, as we are only reading from it
    const indices = this._lockTypedArray();
    const count = this.numIndices;
    if (ArrayBuffer.isView(data)) {
      // destination data is typed array
      data.set(indices);
    } else {
      // data is array, copy right amount manually
      data.length = 0;
      for (let i = 0; i < count; i++) data[i] = indices[i];
    }
    return count;
  }
}

export { IndexBuffer };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtYnVmZmVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvcGxhdGZvcm0vZ3JhcGhpY3MvaW5kZXgtYnVmZmVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERlYnVnIH0gZnJvbSAnLi4vLi4vY29yZS9kZWJ1Zy5qcyc7XG5pbXBvcnQgeyBUUkFDRUlEX1ZSQU1fSUIgfSBmcm9tICcuLi8uLi9jb3JlL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQge1xuICAgIEJVRkZFUl9TVEFUSUMsIElOREVYRk9STUFUX1VJTlQxNiwgSU5ERVhGT1JNQVRfVUlOVDMyLCB0eXBlZEFycmF5SW5kZXhGb3JtYXRzQnl0ZVNpemVcbn0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuXG5sZXQgaWQgPSAwO1xuXG4vKipcbiAqIEFuIGluZGV4IGJ1ZmZlciBzdG9yZXMgaW5kZXggdmFsdWVzIGludG8gYSB7QGxpbmsgVmVydGV4QnVmZmVyfS4gSW5kZXhlZCBncmFwaGljYWwgcHJpbWl0aXZlc1xuICogY2FuIG5vcm1hbGx5IHV0aWxpemUgbGVzcyBtZW1vcnkgdGhhdCB1bmluZGV4ZWQgcHJpbWl0aXZlcyAoaWYgdmVydGljZXMgYXJlIHNoYXJlZCkuXG4gKlxuICogVHlwaWNhbGx5LCBpbmRleCBidWZmZXJzIGFyZSBzZXQgb24ge0BsaW5rIE1lc2h9IG9iamVjdHMuXG4gKi9cbmNsYXNzIEluZGV4QnVmZmVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgSW5kZXhCdWZmZXIgaW5zdGFuY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi9ncmFwaGljcy1kZXZpY2UuanMnKS5HcmFwaGljc0RldmljZX0gZ3JhcGhpY3NEZXZpY2UgLSBUaGUgZ3JhcGhpY3MgZGV2aWNlXG4gICAgICogdXNlZCB0byBtYW5hZ2UgdGhpcyBpbmRleCBidWZmZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGZvcm1hdCAtIFRoZSB0eXBlIG9mIGVhY2ggaW5kZXggdG8gYmUgc3RvcmVkIGluIHRoZSBpbmRleCBidWZmZXIuIENhbiBiZTpcbiAgICAgKlxuICAgICAqIC0ge0BsaW5rIElOREVYRk9STUFUX1VJTlQ4fVxuICAgICAqIC0ge0BsaW5rIElOREVYRk9STUFUX1VJTlQxNn1cbiAgICAgKiAtIHtAbGluayBJTkRFWEZPUk1BVF9VSU5UMzJ9XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG51bUluZGljZXMgLSBUaGUgbnVtYmVyIG9mIGluZGljZXMgdG8gYmUgc3RvcmVkIGluIHRoZSBpbmRleCBidWZmZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt1c2FnZV0gLSBUaGUgdXNhZ2UgdHlwZSBvZiB0aGUgdmVydGV4IGJ1ZmZlci4gQ2FuIGJlOlxuICAgICAqXG4gICAgICogLSB7QGxpbmsgQlVGRkVSX0RZTkFNSUN9XG4gICAgICogLSB7QGxpbmsgQlVGRkVSX1NUQVRJQ31cbiAgICAgKiAtIHtAbGluayBCVUZGRVJfU1RSRUFNfVxuICAgICAqXG4gICAgICogRGVmYXVsdHMgdG8ge0BsaW5rIEJVRkZFUl9TVEFUSUN9LlxuICAgICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJ9IFtpbml0aWFsRGF0YV0gLSBJbml0aWFsIGRhdGEuIElmIGxlZnQgdW5zcGVjaWZpZWQsIHRoZSBpbmRleCBidWZmZXJcbiAgICAgKiB3aWxsIGJlIGluaXRpYWxpemVkIHRvIHplcm9zLlxuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gQ3JlYXRlIGFuIGluZGV4IGJ1ZmZlciBob2xkaW5nIDMgMTYtYml0IGluZGljZXMuIFRoZSBidWZmZXIgaXMgbWFya2VkIGFzXG4gICAgICogLy8gc3RhdGljLCBoaW50aW5nIHRoYXQgdGhlIGJ1ZmZlciB3aWxsIG5ldmVyIGJlIG1vZGlmaWVkLlxuICAgICAqIHZhciBpbmRpY2VzID0gbmV3IFVJbnQxNkFycmF5KFswLCAxLCAyXSk7XG4gICAgICogdmFyIGluZGV4QnVmZmVyID0gbmV3IHBjLkluZGV4QnVmZmVyKGdyYXBoaWNzRGV2aWNlLFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYy5JTkRFWEZPUk1BVF9VSU5UMTYsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDMsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBjLkJVRkZFUl9TVEFUSUMsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGljZXMpO1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGdyYXBoaWNzRGV2aWNlLCBmb3JtYXQsIG51bUluZGljZXMsIHVzYWdlID0gQlVGRkVSX1NUQVRJQywgaW5pdGlhbERhdGEpIHtcbiAgICAgICAgLy8gQnkgZGVmYXVsdCwgaW5kZXggYnVmZmVycyBhcmUgc3RhdGljIChiZXR0ZXIgZm9yIHBlcmZvcm1hbmNlIHNpbmNlIGJ1ZmZlciBkYXRhIGNhbiBiZSBjYWNoZWQgaW4gVlJBTSlcbiAgICAgICAgdGhpcy5kZXZpY2UgPSBncmFwaGljc0RldmljZTtcbiAgICAgICAgdGhpcy5mb3JtYXQgPSBmb3JtYXQ7XG4gICAgICAgIHRoaXMubnVtSW5kaWNlcyA9IG51bUluZGljZXM7XG4gICAgICAgIHRoaXMudXNhZ2UgPSB1c2FnZTtcblxuICAgICAgICB0aGlzLmlkID0gaWQrKztcblxuICAgICAgICB0aGlzLmltcGwgPSBncmFwaGljc0RldmljZS5jcmVhdGVJbmRleEJ1ZmZlckltcGwodGhpcyk7XG5cbiAgICAgICAgLy8gQWxsb2NhdGUgdGhlIHN0b3JhZ2VcbiAgICAgICAgY29uc3QgYnl0ZXNQZXJJbmRleCA9IHR5cGVkQXJyYXlJbmRleEZvcm1hdHNCeXRlU2l6ZVtmb3JtYXRdO1xuICAgICAgICB0aGlzLmJ5dGVzUGVySW5kZXggPSBieXRlc1BlckluZGV4O1xuICAgICAgICB0aGlzLm51bUJ5dGVzID0gdGhpcy5udW1JbmRpY2VzICogYnl0ZXNQZXJJbmRleDtcblxuICAgICAgICBpZiAoaW5pdGlhbERhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YShpbml0aWFsRGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0b3JhZ2UgPSBuZXcgQXJyYXlCdWZmZXIodGhpcy5udW1CeXRlcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFkanVzdFZyYW1TaXplVHJhY2tpbmcoZ3JhcGhpY3NEZXZpY2UuX3ZyYW0sIHRoaXMubnVtQnl0ZXMpO1xuXG4gICAgICAgIHRoaXMuZGV2aWNlLmJ1ZmZlcnMucHVzaCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGcmVlcyByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaW5kZXggYnVmZmVyLlxuICAgICAqL1xuICAgIGRlc3Ryb3koKSB7XG5cbiAgICAgICAgLy8gc3RvcCB0cmFja2luZyB0aGUgaW5kZXggYnVmZmVyXG4gICAgICAgIGNvbnN0IGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICAgICAgICBjb25zdCBpZHggPSBkZXZpY2UuYnVmZmVycy5pbmRleE9mKHRoaXMpO1xuICAgICAgICBpZiAoaWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgZGV2aWNlLmJ1ZmZlcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZXZpY2UuaW5kZXhCdWZmZXIgPT09IHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXMuZGV2aWNlLmluZGV4QnVmZmVyID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmltcGwuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaW1wbC5kZXN0cm95KGRldmljZSk7XG4gICAgICAgICAgICB0aGlzLmFkanVzdFZyYW1TaXplVHJhY2tpbmcoZGV2aWNlLl92cmFtLCAtdGhpcy5zdG9yYWdlLmJ5dGVMZW5ndGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWRqdXN0VnJhbVNpemVUcmFja2luZyh2cmFtLCBzaXplKSB7XG4gICAgICAgIERlYnVnLnRyYWNlKFRSQUNFSURfVlJBTV9JQiwgYCR7dGhpcy5pZH0gc2l6ZTogJHtzaXplfSB2cmFtLmliOiAke3ZyYW0uaWJ9ID0+ICR7dnJhbS5pYiArIHNpemV9YCk7XG4gICAgICAgIHZyYW0uaWIgKz0gc2l6ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgcmVuZGVyaW5nIGNvbnRleHQgd2FzIGxvc3QuIEl0IHJlbGVhc2VzIGFsbCBjb250ZXh0IHJlbGF0ZWQgcmVzb3VyY2VzLlxuICAgICAqXG4gICAgICogQGlnbm9yZVxuICAgICAqL1xuICAgIGxvc2VDb250ZXh0KCkge1xuICAgICAgICB0aGlzLmltcGwubG9zZUNvbnRleHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBkYXRhIGZvcm1hdCBvZiB0aGUgc3BlY2lmaWVkIGluZGV4IGJ1ZmZlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBkYXRhIGZvcm1hdCBvZiB0aGUgc3BlY2lmaWVkIGluZGV4IGJ1ZmZlci4gQ2FuIGJlOlxuICAgICAqXG4gICAgICogLSB7QGxpbmsgSU5ERVhGT1JNQVRfVUlOVDh9XG4gICAgICogLSB7QGxpbmsgSU5ERVhGT1JNQVRfVUlOVDE2fVxuICAgICAqIC0ge0BsaW5rIElOREVYRk9STUFUX1VJTlQzMn1cbiAgICAgKi9cbiAgICBnZXRGb3JtYXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvcm1hdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgaW5kaWNlcyBzdG9yZWQgaW4gdGhlIHNwZWNpZmllZCBpbmRleCBidWZmZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIGluZGljZXMgc3RvcmVkIGluIHRoZSBzcGVjaWZpZWQgaW5kZXggYnVmZmVyLlxuICAgICAqL1xuICAgIGdldE51bUluZGljZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm51bUluZGljZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZXMgYWNjZXNzIHRvIHRoZSBibG9jayBvZiBtZW1vcnkgdGhhdCBzdG9yZXMgdGhlIGJ1ZmZlcidzIGluZGljZXMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7QXJyYXlCdWZmZXJ9IEEgY29udGlndW91cyBibG9jayBvZiBtZW1vcnkgd2hlcmUgaW5kZXggZGF0YSBjYW4gYmUgd3JpdHRlbiB0by5cbiAgICAgKi9cbiAgICBsb2NrKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdG9yYWdlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNpZ25hbHMgdGhhdCB0aGUgYmxvY2sgb2YgbWVtb3J5IHJldHVybmVkIGJ5IGEgY2FsbCB0byB0aGUgbG9jayBmdW5jdGlvbiBpcyByZWFkeSB0byBiZVxuICAgICAqIGdpdmVuIHRvIHRoZSBncmFwaGljcyBoYXJkd2FyZS4gT25seSB1bmxvY2tlZCBpbmRleCBidWZmZXJzIGNhbiBiZSBzZXQgb24gdGhlIGN1cnJlbnRseVxuICAgICAqIGFjdGl2ZSBkZXZpY2UuXG4gICAgICovXG4gICAgdW5sb2NrKCkge1xuXG4gICAgICAgIC8vIFVwbG9hZCB0aGUgbmV3IGluZGV4IGRhdGFcbiAgICAgICAgdGhpcy5pbXBsLnVubG9jayh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgcHJlYWxsb2NhdGVkIGRhdGEgb24gdGhlIGluZGV4IGJ1ZmZlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJ9IGRhdGEgLSBUaGUgaW5kZXggZGF0YSB0byBzZXQuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIGRhdGEgd2FzIHNldCBzdWNjZXNzZnVsbHksIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKiBAaWdub3JlXG4gICAgICovXG4gICAgc2V0RGF0YShkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhLmJ5dGVMZW5ndGggIT09IHRoaXMubnVtQnl0ZXMpIHtcbiAgICAgICAgICAgIERlYnVnLmVycm9yKGBJbmRleEJ1ZmZlcjogd3JvbmcgaW5pdGlhbCBkYXRhIHNpemU6IGV4cGVjdGVkICR7dGhpcy5udW1CeXRlc30sIGdvdCAke2RhdGEuYnl0ZUxlbmd0aH1gKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RvcmFnZSA9IGRhdGE7XG4gICAgICAgIHRoaXMudW5sb2NrKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYXBwcm9wcmlhdGUgdHlwZWQgYXJyYXkgZnJvbSBhbiBpbmRleCBidWZmZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7VWludDhBcnJheXxVaW50MTZBcnJheXxVaW50MzJBcnJheX0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIGluZGV4IGRhdGEuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbG9ja1R5cGVkQXJyYXkoKSB7XG4gICAgICAgIGNvbnN0IGxvY2sgPSB0aGlzLmxvY2soKTtcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IHRoaXMuZm9ybWF0ID09PSBJTkRFWEZPUk1BVF9VSU5UMzIgPyBuZXcgVWludDMyQXJyYXkobG9jaykgOlxuICAgICAgICAgICAgKHRoaXMuZm9ybWF0ID09PSBJTkRFWEZPUk1BVF9VSU5UMTYgPyBuZXcgVWludDE2QXJyYXkobG9jaykgOiBuZXcgVWludDhBcnJheShsb2NrKSk7XG4gICAgICAgIHJldHVybiBpbmRpY2VzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvcGllcyB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBlbGVtZW50cyBmcm9tIGRhdGEgaW50byBpbmRleCBidWZmZXIuIE9wdGltaXplZCBmb3JcbiAgICAgKiBwZXJmb3JtYW5jZSBmcm9tIGJvdGggdHlwZWQgYXJyYXkgYXMgd2VsbCBhcyBhcnJheS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VWludDhBcnJheXxVaW50MTZBcnJheXxVaW50MzJBcnJheXxudW1iZXJbXX0gZGF0YSAtIFRoZSBkYXRhIHRvIHdyaXRlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb3VudCAtIFRoZSBudW1iZXIgb2YgaW5kaWNlcyB0byB3cml0ZS5cbiAgICAgKiBAaWdub3JlXG4gICAgICovXG4gICAgd3JpdGVEYXRhKGRhdGEsIGNvdW50KSB7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSB0aGlzLl9sb2NrVHlwZWRBcnJheSgpO1xuXG4gICAgICAgIC8vIGlmIGRhdGEgY29udGFpbnMgbW9yZSBpbmRpY2VzIHRoYW4gbmVlZGVkLCBjb3B5IGZyb20gaXRzIHN1YmFycmF5XG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCA+IGNvdW50KSB7XG5cbiAgICAgICAgICAgIC8vIGlmIGRhdGEgaXMgdHlwZWQgYXJyYXlcbiAgICAgICAgICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gZGF0YS5zdWJhcnJheSgwLCBjb3VudCk7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5zZXQoZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGRhdGEgaXMgYXJyYXksIGNvcHkgcmlnaHQgYW1vdW50IG1hbnVhbGx5XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKVxuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzW2ldID0gZGF0YVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGNvcHkgd2hvbGUgZGF0YVxuICAgICAgICAgICAgaW5kaWNlcy5zZXQoZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVubG9jaygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvcGllcyBpbmRleCBkYXRhIGZyb20gaW5kZXggYnVmZmVyIGludG8gcHJvdmlkZWQgZGF0YSBhcnJheS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VWludDhBcnJheXxVaW50MTZBcnJheXxVaW50MzJBcnJheXxudW1iZXJbXX0gZGF0YSAtIFRoZSBkYXRhIGFycmF5IHRvIHdyaXRlIHRvLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBudW1iZXIgb2YgaW5kaWNlcyByZWFkLlxuICAgICAqIEBpZ25vcmVcbiAgICAgKi9cbiAgICByZWFkRGF0YShkYXRhKSB7XG4gICAgICAgIC8vIG5vdGU6IHRoZXJlIGlzIG5vIG5lZWQgdG8gdW5sb2NrIHRoaXMgYnVmZmVyLCBhcyB3ZSBhcmUgb25seSByZWFkaW5nIGZyb20gaXRcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IHRoaXMuX2xvY2tUeXBlZEFycmF5KCk7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gdGhpcy5udW1JbmRpY2VzO1xuXG4gICAgICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkpIHtcbiAgICAgICAgICAgIC8vIGRlc3RpbmF0aW9uIGRhdGEgaXMgdHlwZWQgYXJyYXlcbiAgICAgICAgICAgIGRhdGEuc2V0KGluZGljZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZGF0YSBpcyBhcnJheSwgY29weSByaWdodCBhbW91bnQgbWFudWFsbHlcbiAgICAgICAgICAgIGRhdGEubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKylcbiAgICAgICAgICAgICAgICBkYXRhW2ldID0gaW5kaWNlc1tpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb3VudDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEluZGV4QnVmZmVyIH07XG4iXSwibmFtZXMiOlsiaWQiLCJJbmRleEJ1ZmZlciIsImNvbnN0cnVjdG9yIiwiZ3JhcGhpY3NEZXZpY2UiLCJmb3JtYXQiLCJudW1JbmRpY2VzIiwidXNhZ2UiLCJCVUZGRVJfU1RBVElDIiwiaW5pdGlhbERhdGEiLCJkZXZpY2UiLCJpbXBsIiwiY3JlYXRlSW5kZXhCdWZmZXJJbXBsIiwiYnl0ZXNQZXJJbmRleCIsInR5cGVkQXJyYXlJbmRleEZvcm1hdHNCeXRlU2l6ZSIsIm51bUJ5dGVzIiwic2V0RGF0YSIsInN0b3JhZ2UiLCJBcnJheUJ1ZmZlciIsImFkanVzdFZyYW1TaXplVHJhY2tpbmciLCJfdnJhbSIsImJ1ZmZlcnMiLCJwdXNoIiwiZGVzdHJveSIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJpbmRleEJ1ZmZlciIsImluaXRpYWxpemVkIiwiYnl0ZUxlbmd0aCIsInZyYW0iLCJzaXplIiwiRGVidWciLCJ0cmFjZSIsIlRSQUNFSURfVlJBTV9JQiIsImliIiwibG9zZUNvbnRleHQiLCJnZXRGb3JtYXQiLCJnZXROdW1JbmRpY2VzIiwibG9jayIsInVubG9jayIsImRhdGEiLCJlcnJvciIsIl9sb2NrVHlwZWRBcnJheSIsImluZGljZXMiLCJJTkRFWEZPUk1BVF9VSU5UMzIiLCJVaW50MzJBcnJheSIsIklOREVYRk9STUFUX1VJTlQxNiIsIlVpbnQxNkFycmF5IiwiVWludDhBcnJheSIsIndyaXRlRGF0YSIsImNvdW50IiwibGVuZ3RoIiwiaXNWaWV3Iiwic3ViYXJyYXkiLCJzZXQiLCJpIiwicmVhZERhdGEiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU1BLElBQUlBLEVBQUUsR0FBRyxDQUFDLENBQUE7O0FBRVY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsV0FBVyxDQUFDO0FBQ2Q7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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
