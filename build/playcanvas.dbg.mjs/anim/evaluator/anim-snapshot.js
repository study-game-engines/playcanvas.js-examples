/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { AnimCache } from './anim-cache.js';

class AnimSnapshot {
  constructor(animTrack) {
    this._name = animTrack.name + 'Snapshot';
    this._time = -1;
    this._cache = [];
    this._results = [];

    for (let i = 0; i < animTrack._inputs.length; ++i) {
      this._cache[i] = new AnimCache();
    }

    const curves = animTrack._curves;
    const outputs = animTrack._outputs;

    for (let i = 0; i < curves.length; ++i) {
      const curve = curves[i];
      const output = outputs[curve._output];
      const storage = [];

      for (let j = 0; j < output._components; ++j) {
        storage[j] = 0;
      }

      this._results[i] = storage;
    }
  }

}

export { AnimSnapshot };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbS1zbmFwc2hvdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FuaW0vZXZhbHVhdG9yL2FuaW0tc25hcHNob3QuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQW5pbUNhY2hlIH0gZnJvbSAnLi9hbmltLWNhY2hlLmpzJztcblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4vYW5pbS10cmFjay5qcycpLkFuaW1UcmFja30gQW5pbVRyYWNrICovXG5cbi8qKlxuICogQW5pbVNuYXBzaG90IHN0b3JlcyB0aGUgc3RhdGUgb2YgYW4gYW5pbWF0aW9uIHRyYWNrIGF0IGEgcGFydGljdWxhciB0aW1lLlxuICpcbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgQW5pbVNuYXBzaG90IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgYW5pbWF0aW9uIHNuYXBzaG90LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBbmltVHJhY2t9IGFuaW1UcmFjayAtIFRoZSBzb3VyY2UgdHJhY2suXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoYW5pbVRyYWNrKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSBhbmltVHJhY2submFtZSArICdTbmFwc2hvdCc7XG4gICAgICAgIHRoaXMuX3RpbWUgPSAtMTtcblxuICAgICAgICAvLyBwZXItY3VydmUgaW5wdXQgY2FjaGVcbiAgICAgICAgdGhpcy5fY2FjaGUgPSBbXTtcblxuICAgICAgICAvLyBwZXItY3VydmUgZXZhbHVhdGlvbiByZXN1bHRzXG4gICAgICAgIHRoaXMuX3Jlc3VsdHMgPSBbXTtcblxuICAgICAgICAvLyBwcmUtYWxsb2NhdGUgaW5wdXQgY2FjaGVzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYW5pbVRyYWNrLl9pbnB1dHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhY2hlW2ldID0gbmV3IEFuaW1DYWNoZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcHJlLWFsbG9jYXRlIHN0b3JhZ2UgZm9yIGV2YWx1YXRpb24gcmVzdWx0c1xuICAgICAgICBjb25zdCBjdXJ2ZXMgPSBhbmltVHJhY2suX2N1cnZlcztcbiAgICAgICAgY29uc3Qgb3V0cHV0cyA9IGFuaW1UcmFjay5fb3V0cHV0cztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXJ2ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnZlID0gY3VydmVzW2ldO1xuICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gb3V0cHV0c1tjdXJ2ZS5fb3V0cHV0XTtcbiAgICAgICAgICAgIGNvbnN0IHN0b3JhZ2UgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgb3V0cHV0Ll9jb21wb25lbnRzOyArK2opIHtcbiAgICAgICAgICAgICAgICBzdG9yYWdlW2pdID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHNbaV0gPSBzdG9yYWdlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBBbmltU25hcHNob3QgfTtcbiJdLCJuYW1lcyI6WyJBbmltU25hcHNob3QiLCJjb25zdHJ1Y3RvciIsImFuaW1UcmFjayIsIl9uYW1lIiwibmFtZSIsIl90aW1lIiwiX2NhY2hlIiwiX3Jlc3VsdHMiLCJpIiwiX2lucHV0cyIsImxlbmd0aCIsIkFuaW1DYWNoZSIsImN1cnZlcyIsIl9jdXJ2ZXMiLCJvdXRwdXRzIiwiX291dHB1dHMiLCJjdXJ2ZSIsIm91dHB1dCIsIl9vdXRwdXQiLCJzdG9yYWdlIiwiaiIsIl9jb21wb25lbnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBU0EsTUFBTUEsWUFBTixDQUFtQjtFQU1mQyxXQUFXLENBQUNDLFNBQUQsRUFBWTtBQUNuQixJQUFBLElBQUEsQ0FBS0MsS0FBTCxHQUFhRCxTQUFTLENBQUNFLElBQVYsR0FBaUIsVUFBOUIsQ0FBQTtJQUNBLElBQUtDLENBQUFBLEtBQUwsR0FBYSxDQUFDLENBQWQsQ0FBQTtJQUdBLElBQUtDLENBQUFBLE1BQUwsR0FBYyxFQUFkLENBQUE7SUFHQSxJQUFLQyxDQUFBQSxRQUFMLEdBQWdCLEVBQWhCLENBQUE7O0FBR0EsSUFBQSxLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdOLFNBQVMsQ0FBQ08sT0FBVixDQUFrQkMsTUFBdEMsRUFBOEMsRUFBRUYsQ0FBaEQsRUFBbUQ7QUFDL0MsTUFBQSxJQUFBLENBQUtGLE1BQUwsQ0FBWUUsQ0FBWixDQUFpQixHQUFBLElBQUlHLFNBQUosRUFBakIsQ0FBQTtBQUNILEtBQUE7O0FBR0QsSUFBQSxNQUFNQyxNQUFNLEdBQUdWLFNBQVMsQ0FBQ1csT0FBekIsQ0FBQTtBQUNBLElBQUEsTUFBTUMsT0FBTyxHQUFHWixTQUFTLENBQUNhLFFBQTFCLENBQUE7O0FBQ0EsSUFBQSxLQUFLLElBQUlQLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdJLE1BQU0sQ0FBQ0YsTUFBM0IsRUFBbUMsRUFBRUYsQ0FBckMsRUFBd0M7QUFDcEMsTUFBQSxNQUFNUSxLQUFLLEdBQUdKLE1BQU0sQ0FBQ0osQ0FBRCxDQUFwQixDQUFBO0FBQ0EsTUFBQSxNQUFNUyxNQUFNLEdBQUdILE9BQU8sQ0FBQ0UsS0FBSyxDQUFDRSxPQUFQLENBQXRCLENBQUE7TUFDQSxNQUFNQyxPQUFPLEdBQUcsRUFBaEIsQ0FBQTs7QUFDQSxNQUFBLEtBQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0gsTUFBTSxDQUFDSSxXQUEzQixFQUF3QyxFQUFFRCxDQUExQyxFQUE2QztBQUN6Q0QsUUFBQUEsT0FBTyxDQUFDQyxDQUFELENBQVAsR0FBYSxDQUFiLENBQUE7QUFDSCxPQUFBOztBQUNELE1BQUEsSUFBQSxDQUFLYixRQUFMLENBQWNDLENBQWQsQ0FBQSxHQUFtQlcsT0FBbkIsQ0FBQTtBQUNILEtBQUE7QUFDSixHQUFBOztBQWpDYzs7OzsifQ==
