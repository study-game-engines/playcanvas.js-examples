/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
/**
 * Helper class for organized reading of memory.
 *
 * @ignore
 */
class ReadStream {
  constructor(arraybuffer) {
    this.arraybuffer = arraybuffer;
    this.dataView = new DataView(arraybuffer);
    this.offset = 0;
    this.stack = [];
  }
  get remainingBytes() {
    return this.dataView.byteLength - this.offset;
  }
  reset(offset = 0) {
    this.offset = offset;
  }
  skip(bytes) {
    this.offset += bytes;
  }
  align(bytes) {
    this.offset = this.offset + bytes - 1 & ~(bytes - 1);
  }
  _inc(amount) {
    this.offset += amount;
    return this.offset - amount;
  }
  readChar() {
    return String.fromCharCode(this.dataView.getUint8(this.offset++));
  }
  readChars(numChars) {
    let result = '';
    for (let i = 0; i < numChars; ++i) {
      result += this.readChar();
    }
    return result;
  }
  readU8() {
    return this.dataView.getUint8(this.offset++);
  }
  readU16() {
    return this.dataView.getUint16(this._inc(2), true);
  }
  readU32() {
    return this.dataView.getUint32(this._inc(4), true);
  }
  readU64() {
    return this.readU32() + 2 ** 32 * this.readU32();
  }

  // big-endian
  readU32be() {
    return this.dataView.getUint32(this._inc(4), false);
  }
  readArray(result) {
    for (let i = 0; i < result.length; ++i) {
      result[i] = this.readU8();
    }
  }
  readLine() {
    const view = this.dataView;
    let result = '';
    while (true) {
      if (this.offset >= view.byteLength) {
        break;
      }
      const c = String.fromCharCode(this.readU8());
      if (c === '\n') {
        break;
      }
      result += c;
    }
    return result;
  }
}

export { ReadStream };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZC1zdHJlYW0uanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3JlYWQtc3RyZWFtLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSGVscGVyIGNsYXNzIGZvciBvcmdhbml6ZWQgcmVhZGluZyBvZiBtZW1vcnkuXG4gKlxuICogQGlnbm9yZVxuICovXG5jbGFzcyBSZWFkU3RyZWFtIHtcbiAgICBjb25zdHJ1Y3RvcihhcnJheWJ1ZmZlcikge1xuICAgICAgICB0aGlzLmFycmF5YnVmZmVyID0gYXJyYXlidWZmZXI7XG4gICAgICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcoYXJyYXlidWZmZXIpO1xuICAgICAgICB0aGlzLm9mZnNldCA9IDA7XG4gICAgICAgIHRoaXMuc3RhY2sgPSBbXTtcbiAgICB9XG5cbiAgICBnZXQgcmVtYWluaW5nQnl0ZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFWaWV3LmJ5dGVMZW5ndGggLSB0aGlzLm9mZnNldDtcbiAgICB9XG5cbiAgICByZXNldChvZmZzZXQgPSAwKSB7XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuICAgIH1cblxuICAgIHNraXAoYnl0ZXMpIHtcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gYnl0ZXM7XG4gICAgfVxuXG4gICAgYWxpZ24oYnl0ZXMpIHtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSAodGhpcy5vZmZzZXQgKyBieXRlcyAtIDEpICYgKH4oYnl0ZXMgLSAxKSk7XG4gICAgfVxuXG4gICAgX2luYyhhbW91bnQpIHtcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gYW1vdW50O1xuICAgICAgICByZXR1cm4gdGhpcy5vZmZzZXQgLSBhbW91bnQ7XG4gICAgfVxuXG4gICAgcmVhZENoYXIoKSB7XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKHRoaXMuZGF0YVZpZXcuZ2V0VWludDgodGhpcy5vZmZzZXQrKykpO1xuICAgIH1cblxuICAgIHJlYWRDaGFycyhudW1DaGFycykge1xuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtQ2hhcnM7ICsraSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9IHRoaXMucmVhZENoYXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJlYWRVOCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVZpZXcuZ2V0VWludDgodGhpcy5vZmZzZXQrKyk7XG4gICAgfVxuXG4gICAgcmVhZFUxNigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVZpZXcuZ2V0VWludDE2KHRoaXMuX2luYygyKSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgcmVhZFUzMigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVZpZXcuZ2V0VWludDMyKHRoaXMuX2luYyg0KSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgcmVhZFU2NCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZFUzMigpICsgMiAqKiAzMiAqIHRoaXMucmVhZFUzMigpO1xuICAgIH1cblxuICAgIC8vIGJpZy1lbmRpYW5cbiAgICByZWFkVTMyYmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFWaWV3LmdldFVpbnQzMih0aGlzLl9pbmMoNCksIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZWFkQXJyYXkocmVzdWx0KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICByZXN1bHRbaV0gPSB0aGlzLnJlYWRVOCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVhZExpbmUoKSB7XG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLmRhdGFWaWV3O1xuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vZmZzZXQgPj0gdmlldy5ieXRlTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHRoaXMucmVhZFU4KCkpO1xuICAgICAgICAgICAgaWYgKGMgPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQgKz0gYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUmVhZFN0cmVhbSB9O1xuIl0sIm5hbWVzIjpbIlJlYWRTdHJlYW0iLCJjb25zdHJ1Y3RvciIsImFycmF5YnVmZmVyIiwiZGF0YVZpZXciLCJEYXRhVmlldyIsIm9mZnNldCIsInN0YWNrIiwicmVtYWluaW5nQnl0ZXMiLCJieXRlTGVuZ3RoIiwicmVzZXQiLCJza2lwIiwiYnl0ZXMiLCJhbGlnbiIsIl9pbmMiLCJhbW91bnQiLCJyZWFkQ2hhciIsIlN0cmluZyIsImZyb21DaGFyQ29kZSIsImdldFVpbnQ4IiwicmVhZENoYXJzIiwibnVtQ2hhcnMiLCJyZXN1bHQiLCJpIiwicmVhZFU4IiwicmVhZFUxNiIsImdldFVpbnQxNiIsInJlYWRVMzIiLCJnZXRVaW50MzIiLCJyZWFkVTY0IiwicmVhZFUzMmJlIiwicmVhZEFycmF5IiwibGVuZ3RoIiwicmVhZExpbmUiLCJ2aWV3IiwiYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUEsVUFBVSxDQUFDO0VBQ2JDLFdBQVdBLENBQUNDLFdBQVcsRUFBRTtJQUNyQixJQUFJLENBQUNBLFdBQVcsR0FBR0EsV0FBVyxDQUFBO0FBQzlCLElBQUEsSUFBSSxDQUFDQyxRQUFRLEdBQUcsSUFBSUMsUUFBUSxDQUFDRixXQUFXLENBQUMsQ0FBQTtJQUN6QyxJQUFJLENBQUNHLE1BQU0sR0FBRyxDQUFDLENBQUE7SUFDZixJQUFJ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
