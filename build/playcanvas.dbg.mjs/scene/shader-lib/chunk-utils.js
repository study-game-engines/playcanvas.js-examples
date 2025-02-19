/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
const decodeTable = {
  'linear': 'decodeLinear',
  'srgb': 'decodeGamma',
  'rgbm': 'decodeRGBM',
  'rgbe': 'decodeRGBE',
  'rgbp': 'decodeRGBP'
};
const encodeTable = {
  'linear': 'encodeLinear',
  'srgb': 'encodeGamma',
  'rgbm': 'encodeRGBM',
  'rgbe': 'encodeRGBE',
  'rgbp': 'encodeRGBP'
};
class ChunkUtils {
  // returns the name of the decode function for the texture encoding
  static decodeFunc(encoding) {
    return decodeTable[encoding] || 'decodeGamma';
  }
  static encodeFunc(encoding) {
    return encodeTable[encoding] || 'encodeGamma';
  }
}

export { ChunkUtils };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2h1bmstdXRpbHMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY2VuZS9zaGFkZXItbGliL2NodW5rLXV0aWxzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGRlY29kZVRhYmxlID0ge1xuICAgICdsaW5lYXInOiAnZGVjb2RlTGluZWFyJyxcbiAgICAnc3JnYic6ICdkZWNvZGVHYW1tYScsXG4gICAgJ3JnYm0nOiAnZGVjb2RlUkdCTScsXG4gICAgJ3JnYmUnOiAnZGVjb2RlUkdCRScsXG4gICAgJ3JnYnAnOiAnZGVjb2RlUkdCUCdcbn07XG5cbmNvbnN0IGVuY29kZVRhYmxlID0ge1xuICAgICdsaW5lYXInOiAnZW5jb2RlTGluZWFyJyxcbiAgICAnc3JnYic6ICdlbmNvZGVHYW1tYScsXG4gICAgJ3JnYm0nOiAnZW5jb2RlUkdCTScsXG4gICAgJ3JnYmUnOiAnZW5jb2RlUkdCRScsXG4gICAgJ3JnYnAnOiAnZW5jb2RlUkdCUCdcbn07XG5cbmNsYXNzIENodW5rVXRpbHMge1xuICAgIC8vIHJldHVybnMgdGhlIG5hbWUgb2YgdGhlIGRlY29kZSBmdW5jdGlvbiBmb3IgdGhlIHRleHR1cmUgZW5jb2RpbmdcbiAgICBzdGF0aWMgZGVjb2RlRnVuYyhlbmNvZGluZykge1xuICAgICAgICByZXR1cm4gZGVjb2RlVGFibGVbZW5jb2RpbmddIHx8ICdkZWNvZGVHYW1tYSc7XG4gICAgfVxuXG4gICAgc3RhdGljIGVuY29kZUZ1bmMoZW5jb2RpbmcpIHtcbiAgICAgICAgcmV0dXJuIGVuY29kZVRhYmxlW2VuY29kaW5nXSB8fCAnZW5jb2RlR2FtbWEnO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ2h1bmtVdGlscyB9O1xuIl0sIm5hbWVzIjpbImRlY29kZVRhYmxlIiwiZW5jb2RlVGFibGUiLCJDaHVua1V0aWxzIiwiZGVjb2RlRnVuYyIsImVuY29kaW5nIiwiZW5jb2RlRnVuYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxNQUFNQSxXQUFXLEdBQUc7QUFDaEIsRUFBQSxRQUFRLEVBQUUsY0FBYztBQUN4QixFQUFBLE1BQU0sRUFBRSxhQUFhO0FBQ3JCLEVBQUEsTUFBTSxFQUFFLFlBQVk7QUFDcEIsRUFBQSxNQUFNLEVBQUUsWUFBWTtBQUNwQixFQUFBLE1BQU0sRUFBRSxZQUFBO0FBQ1osQ0FBQyxDQUFBO0FBRUQsTUFBTUMsV0FBVyxHQUFHO0FBQ2hCLEVBQUEsUUFBUSxFQUFFLGNBQWM7QUFDeEIsRUFBQSxNQUFNLEVBQUUsYUFBYTtBQUNyQixFQUFBLE1BQU0sRUFBRSxZQUFZO0FBQ3BCLEVBQUEsTUFBTSxFQUFFLFlBQVk7QUFDcEIsRUFBQSxNQUFNLEVBQUUsWUFBQTtBQUNaLENBQUMsQ0FBQTtBQUVELE1BQU1DLFVBQVUsQ0FBQztBQUNiO0VBQ0EsT0FBT0MsVUFBVUEsQ0FBQ0MsUUFBUSxFQUFFO0FBQ3hCLElBQUEsT0FBT0osV0FBVyxDQUFDSSxRQUFRLENBQUMsSUFBSSxhQUFhLENBQUE7QUFDakQsR0FBQTtFQUVBLE9BQU9DLFVBQVVBLENBQUNELFFBQVEsRUFBRTtBQUN4QixJQUFBLE9BQU9ILFdBQVcsQ0FBQ0csUUFBUSxDQUFDLElBQUksYUFBYSxDQUFBO0FBQ2pELEdBQUE7QUFDSjs7OzsifQ==
