/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { ImmediateBatch } from './immediate-batch.js';

// helper class storing line batches for a single layer
class ImmediateBatches {
  constructor(device) {
    this.device = device;

    // dictionary of Material to ImmediateBatch mapping
    this.map = new Map();
  }
  getBatch(material, layer) {
    let batch = this.map.get(material);
    if (!batch) {
      batch = new ImmediateBatch(this.device, material, layer);
      this.map.set(material, batch);
    }
    return batch;
  }
  onPreRender(visibleList, transparent) {
    this.map.forEach(batch => {
      batch.onPreRender(visibleList, transparent);
    });
  }
}

export { ImmediateBatches };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1tZWRpYXRlLWJhdGNoZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY2VuZS9pbW1lZGlhdGUvaW1tZWRpYXRlLWJhdGNoZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW1tZWRpYXRlQmF0Y2ggfSBmcm9tICcuL2ltbWVkaWF0ZS1iYXRjaC5qcyc7XG5cbi8vIGhlbHBlciBjbGFzcyBzdG9yaW5nIGxpbmUgYmF0Y2hlcyBmb3IgYSBzaW5nbGUgbGF5ZXJcbmNsYXNzIEltbWVkaWF0ZUJhdGNoZXMge1xuICAgIGNvbnN0cnVjdG9yKGRldmljZSkge1xuICAgICAgICB0aGlzLmRldmljZSA9IGRldmljZTtcblxuICAgICAgICAvLyBkaWN0aW9uYXJ5IG9mIE1hdGVyaWFsIHRvIEltbWVkaWF0ZUJhdGNoIG1hcHBpbmdcbiAgICAgICAgdGhpcy5tYXAgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZ2V0QmF0Y2gobWF0ZXJpYWwsIGxheWVyKSB7XG4gICAgICAgIGxldCBiYXRjaCA9IHRoaXMubWFwLmdldChtYXRlcmlhbCk7XG4gICAgICAgIGlmICghYmF0Y2gpIHtcbiAgICAgICAgICAgIGJhdGNoID0gbmV3IEltbWVkaWF0ZUJhdGNoKHRoaXMuZGV2aWNlLCBtYXRlcmlhbCwgbGF5ZXIpO1xuICAgICAgICAgICAgdGhpcy5tYXAuc2V0KG1hdGVyaWFsLCBiYXRjaCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhdGNoO1xuICAgIH1cblxuICAgIG9uUHJlUmVuZGVyKHZpc2libGVMaXN0LCB0cmFuc3BhcmVudCkge1xuICAgICAgICB0aGlzLm1hcC5mb3JFYWNoKChiYXRjaCkgPT4ge1xuICAgICAgICAgICAgYmF0Y2gub25QcmVSZW5kZXIodmlzaWJsZUxpc3QsIHRyYW5zcGFyZW50KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBJbW1lZGlhdGVCYXRjaGVzIH07XG4iXSwibmFtZXMiOlsiSW1tZWRpYXRlQmF0Y2hlcyIsImNvbnN0cnVjdG9yIiwiZGV2aWNlIiwibWFwIiwiTWFwIiwiZ2V0QmF0Y2giLCJtYXRlcmlhbCIsImxheWVyIiwiYmF0Y2giLCJnZXQiLCJJbW1lZGlhdGVCYXRjaCIsInNldCIsIm9uUHJlUmVuZGVyIiwidmlzaWJsZUxpc3QiLCJ0cmFuc3BhcmVudCIsImZvckVhY2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTtBQUNBLE1BQU1BLGdCQUFnQixDQUFDO0VBQ25CQyxXQUFXQSxDQUFDQyxNQUFNLEVBQUU7SUFDaEIsSUFBSSxDQUFDQSxNQUFNLEdBQUdBLE1BQU0sQ0FBQTs7QUFFcEI7QUFDQSxJQUFBLElBQUksQ0FBQ0MsR0FBRyxHQUFHLElBQUlDLEdBQUcsRUFBRSxDQUFBO0FBQ3hCLEdBQUE7QUFFQUMsRUFBQUEsUUFBUUEsQ0FBQ0MsUUFBUSxFQUFFQyxLQUFLLEVBQUU7SUFDdEIsSUFBSUMsS0FBSyxHQUFHLElBQUksQ0FBQ0wsR0FBRyxDQUFDTSxHQUFHLENBQUNILFFBQVEsQ0FBQyxDQUFBO0lBQ2xDLElBQUksQ0FBQ0UsS0FBSyxFQUFFO01BQ1JBLEtBQUssR0FBRyxJQUFJRSxjQUFjLENBQUMsSUFBSSxDQUFDUixNQUFNLEVBQUVJLFFBQVEsRUFBRUMsS0FBSyxDQUFDLENBQUE7TUFDeEQsSUFBSSxDQUFDSixHQUFHLENBQUNRLEdBQUcsQ0FBQ0wsUUFBUSxFQUFFRSxLQUFLLENBQUMsQ0FBQTtBQUNqQyxLQUFBO0FBQ0EsSUFBQSxPQUFPQSxLQUFLLENBQUE7QUFDaEIsR0FBQTtBQUVBSSxFQUFBQSxXQUFXQSxDQUFDQyxXQUFXLEVBQUVDLFdBQVcsRUFBRTtBQUNsQyxJQUFBLElBQUksQ0FBQ1gsR0FBRyxDQUFDWSxPQUFPLENBQUVQLEtBQUssSUFBSztBQUN4QkEsTUFBQUEsS0FBSyxDQUFDSSxXQUFXLENBQUNDLFdBQVcsRUFBRUMsV0FBVyxDQUFDLENBQUE7QUFDL0MsS0FBQyxDQUFDLENBQUE7QUFDTixHQUFBO0FBQ0o7Ozs7In0=
