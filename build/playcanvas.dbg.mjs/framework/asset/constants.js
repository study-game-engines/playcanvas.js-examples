/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
const ABSOLUTE_URL = new RegExp('^' +
// beginning of the url
'\\s*' +
// ignore leading spaces (some browsers trim the url automatically, but we can't assume that)
'(?:' +
// beginning of a non-captured regex group
// `{protocol}://`
'(?:' +
// beginning of protocol scheme (non-captured regex group)
'[a-z]+[a-z0-9\\-\\+\\.]*' +
// protocol scheme must (RFC 3986) consist of "a letter and followed by any combination of letters, digits, plus ("+"), period ("."), or hyphen ("-")."
':' +
// protocol scheme must end with colon character
')?' +
// end of optional scheme group, the group is optional since the string may be a protocol-relative absolute URL
'//' +
// an absolute url must always begin with two forward slash characters (ignoring any leading spaces and protocol scheme)

'|' +
// or another option(s):

// Data URL (RFC 2397), simplified
'data:' +
// Blob data
'|blob:' + ')', 'i' // non case-sensitive flag
);

/**
 * Asset type name for animation.
 *
 * @type {string}
 */
const ASSET_ANIMATION = 'animation';

/**
 * Asset type name for audio.
 *
 * @type {string}
 */
const ASSET_AUDIO = 'audio';

/**
 * Asset type name for image.
 *
 * @type {string}
 */
const ASSET_IMAGE = 'image';

/**
 * Asset type name for json.
 *
 * @type {string}
 */
const ASSET_JSON = 'json';

/**
 * Asset type name for model.
 *
 * @type {string}
 */
const ASSET_MODEL = 'model';

/**
 * Asset type name for material.
 *
 * @type {string}
 */
const ASSET_MATERIAL = 'material';

/**
 * Asset type name for text.
 *
 * @type {string}
 */
const ASSET_TEXT = 'text';

/**
 * Asset type name for texture.
 *
 * @type {string}
 */
const ASSET_TEXTURE = 'texture';

/**
 * Asset type name for textureatlas.
 *
 * @type {string}
 */
const ASSET_TEXTUREATLAS = 'textureatlas';

/**
 * Asset type name for cubemap.
 *
 * @type {string}
 */
const ASSET_CUBEMAP = 'cubemap';

/**
 * Asset type name for shader.
 *
 * @type {string}
 */
const ASSET_SHADER = 'shader';

/**
 * Asset type name for CSS.
 *
 * @type {string}
 */
const ASSET_CSS = 'css';

/**
 * Asset type name for HTML.
 *
 * @type {string}
 */
const ASSET_HTML = 'html';

/**
 * Asset type name for script.
 *
 * @type {string}
 */
const ASSET_SCRIPT = 'script';

/**
 * Asset type name for a container.
 *
 * @type {string}
 */
const ASSET_CONTAINER = 'container';

export { ABSOLUTE_URL, ASSET_ANIMATION, ASSET_AUDIO, ASSET_CONTAINER, ASSET_CSS, ASSET_CUBEMAP, ASSET_HTML, ASSET_IMAGE, ASSET_JSON, ASSET_MATERIAL, ASSET_MODEL, ASSET_SCRIPT, ASSET_SHADER, ASSET_TEXT, ASSET_TEXTURE, ASSET_TEXTUREATLAS };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZnJhbWV3b3JrL2Fzc2V0L2NvbnN0YW50cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgQUJTT0xVVEVfVVJMID0gbmV3IFJlZ0V4cChcbiAgICAnXicgKyAvLyBiZWdpbm5pbmcgb2YgdGhlIHVybFxuICAgICdcXFxccyonICsgIC8vIGlnbm9yZSBsZWFkaW5nIHNwYWNlcyAoc29tZSBicm93c2VycyB0cmltIHRoZSB1cmwgYXV0b21hdGljYWxseSwgYnV0IHdlIGNhbid0IGFzc3VtZSB0aGF0KVxuICAgICcoPzonICsgIC8vIGJlZ2lubmluZyBvZiBhIG5vbi1jYXB0dXJlZCByZWdleCBncm91cFxuICAgICAgICAvLyBge3Byb3RvY29sfTovL2BcbiAgICAgICAgJyg/OicgKyAgLy8gYmVnaW5uaW5nIG9mIHByb3RvY29sIHNjaGVtZSAobm9uLWNhcHR1cmVkIHJlZ2V4IGdyb3VwKVxuICAgICAgICAgICAgJ1thLXpdK1thLXowLTlcXFxcLVxcXFwrXFxcXC5dKicgKyAvLyBwcm90b2NvbCBzY2hlbWUgbXVzdCAoUkZDIDM5ODYpIGNvbnNpc3Qgb2YgXCJhIGxldHRlciBhbmQgZm9sbG93ZWQgYnkgYW55IGNvbWJpbmF0aW9uIG9mIGxldHRlcnMsIGRpZ2l0cywgcGx1cyAoXCIrXCIpLCBwZXJpb2QgKFwiLlwiKSwgb3IgaHlwaGVuIChcIi1cIikuXCJcbiAgICAgICAgICAgICc6JyArIC8vIHByb3RvY29sIHNjaGVtZSBtdXN0IGVuZCB3aXRoIGNvbG9uIGNoYXJhY3RlclxuICAgICAgICAnKT8nICsgLy8gZW5kIG9mIG9wdGlvbmFsIHNjaGVtZSBncm91cCwgdGhlIGdyb3VwIGlzIG9wdGlvbmFsIHNpbmNlIHRoZSBzdHJpbmcgbWF5IGJlIGEgcHJvdG9jb2wtcmVsYXRpdmUgYWJzb2x1dGUgVVJMXG4gICAgICAgICcvLycgKyAvLyBhbiBhYnNvbHV0ZSB1cmwgbXVzdCBhbHdheXMgYmVnaW4gd2l0aCB0d28gZm9yd2FyZCBzbGFzaCBjaGFyYWN0ZXJzIChpZ25vcmluZyBhbnkgbGVhZGluZyBzcGFjZXMgYW5kIHByb3RvY29sIHNjaGVtZSlcblxuICAgICAgICAnfCcgKyAvLyBvciBhbm90aGVyIG9wdGlvbihzKTpcblxuICAgICAgICAvLyBEYXRhIFVSTCAoUkZDIDIzOTcpLCBzaW1wbGlmaWVkXG4gICAgICAgICdkYXRhOicgK1xuXG4gICAgICAgIC8vIEJsb2IgZGF0YVxuICAgICAgICAnfGJsb2I6JyArXG4gICAgJyknLFxuICAgICdpJyAvLyBub24gY2FzZS1zZW5zaXRpdmUgZmxhZ1xuKTtcblxuLyoqXG4gKiBBc3NldCB0eXBlIG5hbWUgZm9yIGFuaW1hdGlvbi5cbiAqXG4gKiBAdHlwZSB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgQVNTRVRfQU5JTUFUSU9OID0gJ2FuaW1hdGlvbic7XG5cbi8qKlxuICogQXNzZXQgdHlwZSBuYW1lIGZvciBhdWRpby5cbiAqXG4gKiBAdHlwZSB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgQVNTRVRfQVVESU8gPSAnYXVkaW8nO1xuXG4vKipcbiAqIEFzc2V0IHR5cGUgbmFtZSBmb3IgaW1hZ2UuXG4gKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX0lNQUdFID0gJ2ltYWdlJztcblxuLyoqXG4gKiBBc3NldCB0eXBlIG5hbWUgZm9yIGpzb24uXG4gKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX0pTT04gPSAnanNvbic7XG5cbi8qKlxuICogQXNzZXQgdHlwZSBuYW1lIGZvciBtb2RlbC5cbiAqXG4gKiBAdHlwZSB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgQVNTRVRfTU9ERUwgPSAnbW9kZWwnO1xuXG4vKipcbiAqIEFzc2V0IHR5cGUgbmFtZSBmb3IgbWF0ZXJpYWwuXG4gKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX01BVEVSSUFMID0gJ21hdGVyaWFsJztcblxuLyoqXG4gKiBBc3NldCB0eXBlIG5hbWUgZm9yIHRleHQuXG4gKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX1RFWFQgPSAndGV4dCc7XG5cbi8qKlxuICogQXNzZXQgdHlwZSBuYW1lIGZvciB0ZXh0dXJlLlxuICpcbiAqIEB0eXBlIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBBU1NFVF9URVhUVVJFID0gJ3RleHR1cmUnO1xuXG4vKipcbiAqIEFzc2V0IHR5cGUgbmFtZSBmb3IgdGV4dHVyZWF0bGFzLlxuICpcbiAqIEB0eXBlIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBBU1NFVF9URVhUVVJFQVRMQVMgPSAndGV4dHVyZWF0bGFzJztcblxuLyoqXG4gKiBBc3NldCB0eXBlIG5hbWUgZm9yIGN1YmVtYXAuXG4gKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX0NVQkVNQVAgPSAnY3ViZW1hcCc7XG5cbi8qKlxuICogQXNzZXQgdHlwZSBuYW1lIGZvciBzaGFkZXIuXG4gKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX1NIQURFUiA9ICdzaGFkZXInO1xuXG4vKipcbiAqIEFzc2V0IHR5cGUgbmFtZSBmb3IgQ1NTLlxuICpcbiAqIEB0eXBlIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBBU1NFVF9DU1MgPSAnY3NzJztcblxuLyoqXG4gKiBBc3NldCB0eXBlIG5hbWUgZm9yIEhUTUwuXG4gKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX0hUTUwgPSAnaHRtbCc7XG5cbi8qKlxuICogQXNzZXQgdHlwZSBuYW1lIGZvciBzY3JpcHQuXG4gKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX1NDUklQVCA9ICdzY3JpcHQnO1xuXG4vKipcbiAqIEFzc2V0IHR5cGUgbmFtZSBmb3IgYSBjb250YWluZXIuXG4gKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX0NPTlRBSU5FUiA9ICdjb250YWluZXInO1xuIl0sIm5hbWVzIjpbIkFCU09MVVRFX1VSTCIsIlJlZ0V4cCIsIkFTU0VUX0FOSU1BVElPTiIsIkFTU0VUX0FVRElPIiwiQVNTRVRfSU1BR0UiLCJBU1NFVF9KU09OIiwiQVNTRVRfTU9ERUwiLCJBU1NFVF9NQVRFUklBTCIsIkFTU0VUX1RFWFQiLCJBU1NFVF9URVhUVVJFIiwiQVNTRVRfVEVYVFVSRUFUTEFTIiwiQVNTRVRfQ1VCRU1BUCIsIkFTU0VUX1NIQURFUiIsIkFTU0VUX0NTUyIsIkFTU0VUX0hUTUwiLCJBU1NFVF9TQ1JJUFQiLCJBU1NFVF9DT05UQUlORVIiXSwibWFwcGluZ3MiOiI7Ozs7O01BQWFBLFlBQVksR0FBRyxJQUFJQyxNQUFNLENBQ2xDLEdBQUc7QUFBRztBQUNOLE1BQU07QUFBSTtBQUNWLEtBQUs7QUFBSTtBQUNMO0FBQ0EsS0FBSztBQUFJO0FBQ0wsMEJBQTBCO0FBQUc7QUFDN0IsR0FBRztBQUFHO0FBQ1YsSUFBSTtBQUFHO0FBQ1AsSUFBSTtBQUFHOztBQUVQLEdBQUc7QUFBRzs7QUFFTjtBQUNBLE9BQU87QUFFUDtBQUNBLFFBQVEsR0FDWixHQUFHLEVBQ0gsR0FBRztBQUFDLEVBQ1A7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU1DLGVBQWUsR0FBRyxZQUFXOztBQUUxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTUMsV0FBVyxHQUFHLFFBQU87O0FBRWxDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxNQUFNQyxXQUFXLEdBQUcsUUFBTzs7QUFFbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU1DLFVBQVUsR0FBRyxPQUFNOztBQUVoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTUMsV0FBVyxHQUFHLFFBQU87O0FBRWxDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxNQUFNQyxjQUFjLEdBQUcsV0FBVTs7QUFFeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU1DLFVBQVUsR0FBRyxPQUFNOztBQUVoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTUMsYUFBYSxHQUFHLFVBQVM7O0FBRXRDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxNQUFNQyxrQkFBa0IsR0FBRyxlQUFjOztBQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTUMsYUFBYSxHQUFHLFVBQVM7O0FBRXRDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxNQUFNQyxZQUFZLEdBQUcsU0FBUTs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU1DLFNBQVMsR0FBRyxNQUFLOztBQUU5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTUMsVUFBVSxHQUFHLE9BQU07O0FBRWhDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxNQUFNQyxZQUFZLEdBQUcsU0FBUTs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU1DLGVBQWUsR0FBRzs7OzsifQ==
