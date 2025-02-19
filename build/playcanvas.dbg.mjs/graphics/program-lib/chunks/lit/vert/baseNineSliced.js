/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
var baseNineSlicedVS = `
#define NINESLICED

varying vec2 vMask;
varying vec2 vTiledUv;

uniform mediump vec4 innerOffset;
uniform mediump vec2 outerScale;
uniform mediump vec4 atlasRect;
`;

export { baseNineSlicedVS as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZU5pbmVTbGljZWQuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9ncmFwaGljcy9wcm9ncmFtLWxpYi9jaHVua3MvbGl0L3ZlcnQvYmFzZU5pbmVTbGljZWQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgLyogZ2xzbCAqL2BcbiNkZWZpbmUgTklORVNMSUNFRFxuXG52YXJ5aW5nIHZlYzIgdk1hc2s7XG52YXJ5aW5nIHZlYzIgdlRpbGVkVXY7XG5cbnVuaWZvcm0gbWVkaXVtcCB2ZWM0IGlubmVyT2Zmc2V0O1xudW5pZm9ybSBtZWRpdW1wIHZlYzIgb3V0ZXJTY2FsZTtcbnVuaWZvcm0gbWVkaXVtcCB2ZWM0IGF0bGFzUmVjdDtcbmA7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx1QkFBMEIsQ0FBQTtBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FUQTs7OzsifQ==
