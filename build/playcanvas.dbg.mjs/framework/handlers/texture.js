/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
import { path } from '../../core/path.js';
import { PIXELFORMAT_RGB8, TEXTURETYPE_RGBM, TEXTURETYPE_SWIZZLEGGGR, ADDRESS_REPEAT, ADDRESS_CLAMP_TO_EDGE, ADDRESS_MIRRORED_REPEAT, FILTER_NEAREST, FILTER_LINEAR, FILTER_NEAREST_MIPMAP_NEAREST, FILTER_LINEAR_MIPMAP_NEAREST, FILTER_NEAREST_MIPMAP_LINEAR, FILTER_LINEAR_MIPMAP_LINEAR, TEXTURETYPE_DEFAULT, TEXTURETYPE_RGBE, TEXTURETYPE_RGBP, PIXELFORMAT_RGBA8, PIXELFORMAT_RGBA32F } from '../../platform/graphics/constants.js';
import { Texture } from '../../platform/graphics/texture.js';
import { BasisParser } from '../parsers/texture/basis.js';
import { ImgParser } from '../parsers/texture/img.js';
import { KtxParser } from '../parsers/texture/ktx.js';
import { Ktx2Parser } from '../parsers/texture/ktx2.js';
import { DdsParser } from '../parsers/texture/dds.js';
import { HdrParser } from '../parsers/texture/hdr.js';

/** @typedef {import('./handler.js').ResourceHandler} ResourceHandler */

const JSON_ADDRESS_MODE = {
  'repeat': ADDRESS_REPEAT,
  'clamp': ADDRESS_CLAMP_TO_EDGE,
  'mirror': ADDRESS_MIRRORED_REPEAT
};
const JSON_FILTER_MODE = {
  'nearest': FILTER_NEAREST,
  'linear': FILTER_LINEAR,
  'nearest_mip_nearest': FILTER_NEAREST_MIPMAP_NEAREST,
  'linear_mip_nearest': FILTER_LINEAR_MIPMAP_NEAREST,
  'nearest_mip_linear': FILTER_NEAREST_MIPMAP_LINEAR,
  'linear_mip_linear': FILTER_LINEAR_MIPMAP_LINEAR
};
const JSON_TEXTURE_TYPE = {
  'default': TEXTURETYPE_DEFAULT,
  'rgbm': TEXTURETYPE_RGBM,
  'rgbe': TEXTURETYPE_RGBE,
  'rgbp': TEXTURETYPE_RGBP,
  'swizzleGGGR': TEXTURETYPE_SWIZZLEGGGR
};

/**
 * @interface
 * @name TextureParser
 * @description Interface to a texture parser. Implementations of this interface handle the loading
 * and opening of texture assets.
 */
class TextureParser {
  /* eslint-disable jsdoc/require-returns-check */
  /**
   * @function
   * @name TextureParser#load
   * @description Load the texture from the remote URL. When loaded (or failed),
   * use the callback to return an the raw resource data (or error).
   * @param {object} url - The URL of the resource to load.
   * @param {string} url.load - The URL to use for loading the resource.
   * @param {string} url.original - The original URL useful for identifying the resource type.
   * @param {import('./handler.js').ResourceHandlerCallback} callback - The callback used when
   * the resource is loaded or an error occurs.
   * @param {import('../asset/asset.js').Asset} [asset] - Optional asset that is passed by
   * ResourceLoader.
   */
  load(url, callback, asset) {
    throw new Error('not implemented');
  }

  /**
   * @function
   * @name TextureParser#open
   * @description Convert raw resource data into a resource instance. E.g. Take 3D model format
   * JSON and return a {@link Model}.
   * @param {string} url - The URL of the resource to open.
   * @param {*} data - The raw resource data passed by callback from {@link ResourceHandler#load}.
   * @param {import('../../platform/graphics/graphics-device.js').GraphicsDevice} device - The
   * graphics device.
   * @returns {Texture} The parsed resource data.
   */
  open(url, data, device) {
    throw new Error('not implemented');
  }
  /* eslint-enable jsdoc/require-returns-check */
}

// In the case where a texture has more than 1 level of mip data specified, but not the full
// mip chain, we generate the missing levels here.
// This is to overcome an issue where iphone xr and xs ignores further updates to the mip data
// after invoking gl.generateMipmap on the texture (which was the previous method of ensuring
// the texture's full mip chain was complete).
// NOTE: this function only resamples RGBA8 and RGBAFloat32 data.
const _completePartialMipmapChain = function _completePartialMipmapChain(texture) {
  const requiredMipLevels = Math.log2(Math.max(texture._width, texture._height)) + 1;
  const isHtmlElement = function isHtmlElement(object) {
    return object instanceof HTMLCanvasElement || object instanceof HTMLImageElement || object instanceof HTMLVideoElement;
  };
  if (!(texture._format === PIXELFORMAT_RGBA8 || texture._format === PIXELFORMAT_RGBA32F) || texture._volume || texture._compressed || texture._levels.length === 1 || texture._levels.length === requiredMipLevels || isHtmlElement(texture._cubemap ? texture._levels[0][0] : texture._levels[0])) {
    return;
  }
  const downsample = function downsample(width, height, data) {
    const sampledWidth = Math.max(1, width >> 1);
    const sampledHeight = Math.max(1, height >> 1);
    const sampledData = new data.constructor(sampledWidth * sampledHeight * 4);
    const xs = Math.floor(width / sampledWidth);
    const ys = Math.floor(height / sampledHeight);
    const xsys = xs * ys;
    for (let y = 0; y < sampledHeight; ++y) {
      for (let x = 0; x < sampledWidth; ++x) {
        for (let e = 0; e < 4; ++e) {
          let sum = 0;
          for (let sy = 0; sy < ys; ++sy) {
            for (let sx = 0; sx < xs; ++sx) {
              sum += data[(x * xs + sx + (y * ys + sy) * width) * 4 + e];
            }
          }
          sampledData[(x + y * sampledWidth) * 4 + e] = sum / xsys;
        }
      }
    }
    return sampledData;
  };

  // step through levels
  for (let level = texture._levels.length; level < requiredMipLevels; ++level) {
    const width = Math.max(1, texture._width >> level - 1);
    const height = Math.max(1, texture._height >> level - 1);
    if (texture._cubemap) {
      const mips = [];
      for (let face = 0; face < 6; ++face) {
        mips.push(downsample(width, height, texture._levels[level - 1][face]));
      }
      texture._levels.push(mips);
    } else {
      texture._levels.push(downsample(width, height, texture._levels[level - 1]));
    }
  }
  texture._levelsUpdated = texture._cubemap ? [[true, true, true, true, true, true]] : [true];
};

/**
 * Resource handler used for loading 2D and 3D {@link Texture} resources.
 *
 * @implements {ResourceHandler}
 */
class TextureHandler {
  /**
   * Type of the resource the handler handles.
   *
   * @type {string}
   */

  /**
   * Create a new TextureHandler instance.
   *
   * @param {import('../app-base.js').AppBase} app - The running {@link AppBase}.
   * @hideconstructor
   */
  constructor(app) {
    this.handlerType = "texture";
    const assets = app.assets;
    const device = app.graphicsDevice;
    this._device = device;
    this._assets = assets;
    this._loader = app.loader;

    // img parser handles all browser-supported image formats, this
    // parser will be used when other more specific parsers are not found.
    this.imgParser = new ImgParser(assets, device);
    this.parsers = {
      dds: new DdsParser(assets),
      ktx: new KtxParser(assets),
      ktx2: new Ktx2Parser(assets, device),
      basis: new BasisParser(assets, device),
      hdr: new HdrParser(assets)
    };
  }
  set crossOrigin(value) {
    this.imgParser.crossOrigin = value;
  }
  get crossOrigin() {
    return this.imgParser.crossOrigin;
  }
  set maxRetries(value) {
    this.imgParser.maxRetries = value;
    for (const parser in this.parsers) {
      if (this.parsers.hasOwnProperty(parser)) {
        this.parsers[parser].maxRetries = value;
      }
    }
  }
  get maxRetries() {
    return this.imgParser.maxRetries;
  }
  _getUrlWithoutParams(url) {
    return url.indexOf('?') >= 0 ? url.split('?')[0] : url;
  }
  _getParser(url) {
    const ext = path.getExtension(this._getUrlWithoutParams(url)).toLowerCase().replace('.', '');
    return this.parsers[ext] || this.imgParser;
  }
  load(url, callback, asset) {
    if (typeof url === 'string') {
      url = {
        load: url,
        original: url
      };
    }
    this._getParser(url.original).load(url, callback, asset);
  }
  open(url, data, asset) {
    if (!url) return undefined;
    let texture = this._getParser(url).open(url, data, this._device);
    if (texture === null) {
      texture = new Texture(this._device, {
        width: 4,
        height: 4,
        format: PIXELFORMAT_RGB8
      });
    } else {
      // check if the texture has only a partial mipmap chain specified and generate the
      // missing levels if possible.
      _completePartialMipmapChain(texture);

      // if the basis transcoder unswizzled a GGGR texture, remove the flag from the asset
      if (data.unswizzledGGGR) {
        asset.file.variants.basis.opt &= ~8;
      }
    }
    return texture;
  }
  patch(asset, assets) {
    const texture = asset.resource;
    if (!texture) {
      return;
    }
    if (asset.name && asset.name.length > 0) {
      texture.name = asset.name;
    }
    const assetData = asset.data;
    if (assetData.hasOwnProperty('minfilter')) {
      texture.minFilter = JSON_FILTER_MODE[assetData.minfilter];
    }
    if (assetData.hasOwnProperty('magfilter')) {
      texture.magFilter = JSON_FILTER_MODE[assetData.magfilter];
    }
    if (!texture.cubemap) {
      if (assetData.hasOwnProperty('addressu')) {
        texture.addressU = JSON_ADDRESS_MODE[assetData.addressu];
      }
      if (assetData.hasOwnProperty('addressv')) {
        texture.addressV = JSON_ADDRESS_MODE[assetData.addressv];
      }
    }
    if (assetData.hasOwnProperty('mipmaps')) {
      texture.mipmaps = assetData.mipmaps;
    }
    if (assetData.hasOwnProperty('anisotropy')) {
      texture.anisotropy = assetData.anisotropy;
    }
    if (assetData.hasOwnProperty('flipY')) {
      texture.flipY = !!assetData.flipY;
    }

    // extract asset type (this is bit of a mess)
    if (assetData.hasOwnProperty('type')) {
      texture.type = JSON_TEXTURE_TYPE[assetData.type];
    } else if (assetData.hasOwnProperty('rgbm') && assetData.rgbm) {
      texture.type = TEXTURETYPE_RGBM;
    } else if (asset.file && (asset.file.opt & 8) !== 0) {
      // basis normalmaps flag the variant as swizzled
      texture.type = TEXTURETYPE_SWIZZLEGGGR;
    }
  }
}

export { TextureHandler, TextureParser };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dHVyZS5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2ZyYW1ld29yay9oYW5kbGVycy90ZXh0dXJlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBhdGggfSBmcm9tICcuLi8uLi9jb3JlL3BhdGguanMnO1xuXG5pbXBvcnQge1xuICAgIEFERFJFU1NfQ0xBTVBfVE9fRURHRSwgQUREUkVTU19NSVJST1JFRF9SRVBFQVQsIEFERFJFU1NfUkVQRUFULFxuICAgIEZJTFRFUl9MSU5FQVIsIEZJTFRFUl9ORUFSRVNULCBGSUxURVJfTkVBUkVTVF9NSVBNQVBfTkVBUkVTVCwgRklMVEVSX05FQVJFU1RfTUlQTUFQX0xJTkVBUiwgRklMVEVSX0xJTkVBUl9NSVBNQVBfTkVBUkVTVCwgRklMVEVSX0xJTkVBUl9NSVBNQVBfTElORUFSLFxuICAgIFBJWEVMRk9STUFUX1JHQjgsIFBJWEVMRk9STUFUX1JHQkE4LCBQSVhFTEZPUk1BVF9SR0JBMzJGLFxuICAgIFRFWFRVUkVUWVBFX0RFRkFVTFQsIFRFWFRVUkVUWVBFX1JHQkUsIFRFWFRVUkVUWVBFX1JHQk0sIFRFWFRVUkVUWVBFX1NXSVpaTEVHR0dSLCBURVhUVVJFVFlQRV9SR0JQXG59IGZyb20gJy4uLy4uL3BsYXRmb3JtL2dyYXBoaWNzL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBUZXh0dXJlIH0gZnJvbSAnLi4vLi4vcGxhdGZvcm0vZ3JhcGhpY3MvdGV4dHVyZS5qcyc7XG5cbmltcG9ydCB7IEJhc2lzUGFyc2VyIH0gZnJvbSAnLi4vcGFyc2Vycy90ZXh0dXJlL2Jhc2lzLmpzJztcbmltcG9ydCB7IEltZ1BhcnNlciB9IGZyb20gJy4uL3BhcnNlcnMvdGV4dHVyZS9pbWcuanMnO1xuaW1wb3J0IHsgS3R4UGFyc2VyIH0gZnJvbSAnLi4vcGFyc2Vycy90ZXh0dXJlL2t0eC5qcyc7XG5pbXBvcnQgeyBLdHgyUGFyc2VyIH0gZnJvbSAnLi4vcGFyc2Vycy90ZXh0dXJlL2t0eDIuanMnO1xuaW1wb3J0IHsgRGRzUGFyc2VyIH0gZnJvbSAnLi4vcGFyc2Vycy90ZXh0dXJlL2Rkcy5qcyc7XG5pbXBvcnQgeyBIZHJQYXJzZXIgfSBmcm9tICcuLi9wYXJzZXJzL3RleHR1cmUvaGRyLmpzJztcblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4vaGFuZGxlci5qcycpLlJlc291cmNlSGFuZGxlcn0gUmVzb3VyY2VIYW5kbGVyICovXG5cbmNvbnN0IEpTT05fQUREUkVTU19NT0RFID0ge1xuICAgICdyZXBlYXQnOiBBRERSRVNTX1JFUEVBVCxcbiAgICAnY2xhbXAnOiBBRERSRVNTX0NMQU1QX1RPX0VER0UsXG4gICAgJ21pcnJvcic6IEFERFJFU1NfTUlSUk9SRURfUkVQRUFUXG59O1xuXG5jb25zdCBKU09OX0ZJTFRFUl9NT0RFID0ge1xuICAgICduZWFyZXN0JzogRklMVEVSX05FQVJFU1QsXG4gICAgJ2xpbmVhcic6IEZJTFRFUl9MSU5FQVIsXG4gICAgJ25lYXJlc3RfbWlwX25lYXJlc3QnOiBGSUxURVJfTkVBUkVTVF9NSVBNQVBfTkVBUkVTVCxcbiAgICAnbGluZWFyX21pcF9uZWFyZXN0JzogRklMVEVSX0xJTkVBUl9NSVBNQVBfTkVBUkVTVCxcbiAgICAnbmVhcmVzdF9taXBfbGluZWFyJzogRklMVEVSX05FQVJFU1RfTUlQTUFQX0xJTkVBUixcbiAgICAnbGluZWFyX21pcF9saW5lYXInOiBGSUxURVJfTElORUFSX01JUE1BUF9MSU5FQVJcbn07XG5cbmNvbnN0IEpTT05fVEVYVFVSRV9UWVBFID0ge1xuICAgICdkZWZhdWx0JzogVEVYVFVSRVRZUEVfREVGQVVMVCxcbiAgICAncmdibSc6IFRFWFRVUkVUWVBFX1JHQk0sXG4gICAgJ3JnYmUnOiBURVhUVVJFVFlQRV9SR0JFLFxuICAgICdyZ2JwJzogVEVYVFVSRVRZUEVfUkdCUCxcbiAgICAnc3dpenpsZUdHR1InOiBURVhUVVJFVFlQRV9TV0laWkxFR0dHUlxufTtcblxuLyoqXG4gKiBAaW50ZXJmYWNlXG4gKiBAbmFtZSBUZXh0dXJlUGFyc2VyXG4gKiBAZGVzY3JpcHRpb24gSW50ZXJmYWNlIHRvIGEgdGV4dHVyZSBwYXJzZXIuIEltcGxlbWVudGF0aW9ucyBvZiB0aGlzIGludGVyZmFjZSBoYW5kbGUgdGhlIGxvYWRpbmdcbiAqIGFuZCBvcGVuaW5nIG9mIHRleHR1cmUgYXNzZXRzLlxuICovXG5jbGFzcyBUZXh0dXJlUGFyc2VyIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBqc2RvYy9yZXF1aXJlLXJldHVybnMtY2hlY2sgKi9cbiAgICAvKipcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAbmFtZSBUZXh0dXJlUGFyc2VyI2xvYWRcbiAgICAgKiBAZGVzY3JpcHRpb24gTG9hZCB0aGUgdGV4dHVyZSBmcm9tIHRoZSByZW1vdGUgVVJMLiBXaGVuIGxvYWRlZCAob3IgZmFpbGVkKSxcbiAgICAgKiB1c2UgdGhlIGNhbGxiYWNrIHRvIHJldHVybiBhbiB0aGUgcmF3IHJlc291cmNlIGRhdGEgKG9yIGVycm9yKS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdXJsIC0gVGhlIFVSTCBvZiB0aGUgcmVzb3VyY2UgdG8gbG9hZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsLmxvYWQgLSBUaGUgVVJMIHRvIHVzZSBmb3IgbG9hZGluZyB0aGUgcmVzb3VyY2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybC5vcmlnaW5hbCAtIFRoZSBvcmlnaW5hbCBVUkwgdXNlZnVsIGZvciBpZGVudGlmeWluZyB0aGUgcmVzb3VyY2UgdHlwZS5cbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi9oYW5kbGVyLmpzJykuUmVzb3VyY2VIYW5kbGVyQ2FsbGJhY2t9IGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIHVzZWQgd2hlblxuICAgICAqIHRoZSByZXNvdXJjZSBpcyBsb2FkZWQgb3IgYW4gZXJyb3Igb2NjdXJzLlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9hc3NldC9hc3NldC5qcycpLkFzc2V0fSBbYXNzZXRdIC0gT3B0aW9uYWwgYXNzZXQgdGhhdCBpcyBwYXNzZWQgYnlcbiAgICAgKiBSZXNvdXJjZUxvYWRlci5cbiAgICAgKi9cbiAgICBsb2FkKHVybCwgY2FsbGJhY2ssIGFzc2V0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQG5hbWUgVGV4dHVyZVBhcnNlciNvcGVuXG4gICAgICogQGRlc2NyaXB0aW9uIENvbnZlcnQgcmF3IHJlc291cmNlIGRhdGEgaW50byBhIHJlc291cmNlIGluc3RhbmNlLiBFLmcuIFRha2UgM0QgbW9kZWwgZm9ybWF0XG4gICAgICogSlNPTiBhbmQgcmV0dXJuIGEge0BsaW5rIE1vZGVsfS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVGhlIFVSTCBvZiB0aGUgcmVzb3VyY2UgdG8gb3Blbi5cbiAgICAgKiBAcGFyYW0geyp9IGRhdGEgLSBUaGUgcmF3IHJlc291cmNlIGRhdGEgcGFzc2VkIGJ5IGNhbGxiYWNrIGZyb20ge0BsaW5rIFJlc291cmNlSGFuZGxlciNsb2FkfS5cbiAgICAgKiBAcGFyYW0ge2ltcG9ydCgnLi4vLi4vcGxhdGZvcm0vZ3JhcGhpY3MvZ3JhcGhpY3MtZGV2aWNlLmpzJykuR3JhcGhpY3NEZXZpY2V9IGRldmljZSAtIFRoZVxuICAgICAqIGdyYXBoaWNzIGRldmljZS5cbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZX0gVGhlIHBhcnNlZCByZXNvdXJjZSBkYXRhLlxuICAgICAqL1xuICAgIG9wZW4odXJsLCBkYXRhLCBkZXZpY2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZWQnKTtcbiAgICB9XG4gICAgLyogZXNsaW50LWVuYWJsZSBqc2RvYy9yZXF1aXJlLXJldHVybnMtY2hlY2sgKi9cbn1cblxuLy8gSW4gdGhlIGNhc2Ugd2hlcmUgYSB0ZXh0dXJlIGhhcyBtb3JlIHRoYW4gMSBsZXZlbCBvZiBtaXAgZGF0YSBzcGVjaWZpZWQsIGJ1dCBub3QgdGhlIGZ1bGxcbi8vIG1pcCBjaGFpbiwgd2UgZ2VuZXJhdGUgdGhlIG1pc3NpbmcgbGV2ZWxzIGhlcmUuXG4vLyBUaGlzIGlzIHRvIG92ZXJjb21lIGFuIGlzc3VlIHdoZXJlIGlwaG9uZSB4ciBhbmQgeHMgaWdub3JlcyBmdXJ0aGVyIHVwZGF0ZXMgdG8gdGhlIG1pcCBkYXRhXG4vLyBhZnRlciBpbnZva2luZyBnbC5nZW5lcmF0ZU1pcG1hcCBvbiB0aGUgdGV4dHVyZSAod2hpY2ggd2FzIHRoZSBwcmV2aW91cyBtZXRob2Qgb2YgZW5zdXJpbmdcbi8vIHRoZSB0ZXh0dXJlJ3MgZnVsbCBtaXAgY2hhaW4gd2FzIGNvbXBsZXRlKS5cbi8vIE5PVEU6IHRoaXMgZnVuY3Rpb24gb25seSByZXNhbXBsZXMgUkdCQTggYW5kIFJHQkFGbG9hdDMyIGRhdGEuXG5jb25zdCBfY29tcGxldGVQYXJ0aWFsTWlwbWFwQ2hhaW4gPSBmdW5jdGlvbiAodGV4dHVyZSkge1xuXG4gICAgY29uc3QgcmVxdWlyZWRNaXBMZXZlbHMgPSBNYXRoLmxvZzIoTWF0aC5tYXgodGV4dHVyZS5fd2lkdGgsIHRleHR1cmUuX2hlaWdodCkpICsgMTtcblxuICAgIGNvbnN0IGlzSHRtbEVsZW1lbnQgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiAob2JqZWN0IGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHx8XG4gICAgICAgICAgICAgICAob2JqZWN0IGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkgfHxcbiAgICAgICAgICAgICAgIChvYmplY3QgaW5zdGFuY2VvZiBIVE1MVmlkZW9FbGVtZW50KTtcbiAgICB9O1xuXG4gICAgaWYgKCEodGV4dHVyZS5fZm9ybWF0ID09PSBQSVhFTEZPUk1BVF9SR0JBOCB8fFxuICAgICAgICAgIHRleHR1cmUuX2Zvcm1hdCA9PT0gUElYRUxGT1JNQVRfUkdCQTMyRikgfHxcbiAgICAgICAgICB0ZXh0dXJlLl92b2x1bWUgfHxcbiAgICAgICAgICB0ZXh0dXJlLl9jb21wcmVzc2VkIHx8XG4gICAgICAgICAgdGV4dHVyZS5fbGV2ZWxzLmxlbmd0aCA9PT0gMSB8fFxuICAgICAgICAgIHRleHR1cmUuX2xldmVscy5sZW5ndGggPT09IHJlcXVpcmVkTWlwTGV2ZWxzIHx8XG4gICAgICAgICAgaXNIdG1sRWxlbWVudCh0ZXh0dXJlLl9jdWJlbWFwID8gdGV4dHVyZS5fbGV2ZWxzWzBdWzBdIDogdGV4dHVyZS5fbGV2ZWxzWzBdKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZG93bnNhbXBsZSA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBkYXRhKSB7XG4gICAgICAgIGNvbnN0IHNhbXBsZWRXaWR0aCA9IE1hdGgubWF4KDEsIHdpZHRoID4+IDEpO1xuICAgICAgICBjb25zdCBzYW1wbGVkSGVpZ2h0ID0gTWF0aC5tYXgoMSwgaGVpZ2h0ID4+IDEpO1xuICAgICAgICBjb25zdCBzYW1wbGVkRGF0YSA9IG5ldyBkYXRhLmNvbnN0cnVjdG9yKHNhbXBsZWRXaWR0aCAqIHNhbXBsZWRIZWlnaHQgKiA0KTtcblxuICAgICAgICBjb25zdCB4cyA9IE1hdGguZmxvb3Iod2lkdGggLyBzYW1wbGVkV2lkdGgpO1xuICAgICAgICBjb25zdCB5cyA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gc2FtcGxlZEhlaWdodCk7XG4gICAgICAgIGNvbnN0IHhzeXMgPSB4cyAqIHlzO1xuXG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgc2FtcGxlZEhlaWdodDsgKyt5KSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHNhbXBsZWRXaWR0aDsgKyt4KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZSA9IDA7IGUgPCA0OyArK2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHN5ID0gMDsgc3kgPCB5czsgKytzeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgc3ggPSAwOyBzeCA8IHhzOyArK3N4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtICs9IGRhdGFbKHggKiB4cyArIHN4ICsgKHkgKiB5cyArIHN5KSAqIHdpZHRoKSAqIDQgKyBlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzYW1wbGVkRGF0YVsoeCArIHkgKiBzYW1wbGVkV2lkdGgpICogNCArIGVdID0gc3VtIC8geHN5cztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2FtcGxlZERhdGE7XG4gICAgfTtcblxuICAgIC8vIHN0ZXAgdGhyb3VnaCBsZXZlbHNcbiAgICBmb3IgKGxldCBsZXZlbCA9IHRleHR1cmUuX2xldmVscy5sZW5ndGg7IGxldmVsIDwgcmVxdWlyZWRNaXBMZXZlbHM7ICsrbGV2ZWwpIHtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBNYXRoLm1heCgxLCB0ZXh0dXJlLl93aWR0aCA+PiAobGV2ZWwgLSAxKSk7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KDEsIHRleHR1cmUuX2hlaWdodCA+PiAobGV2ZWwgLSAxKSk7XG4gICAgICAgIGlmICh0ZXh0dXJlLl9jdWJlbWFwKSB7XG4gICAgICAgICAgICBjb25zdCBtaXBzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBmYWNlID0gMDsgZmFjZSA8IDY7ICsrZmFjZSkge1xuICAgICAgICAgICAgICAgIG1pcHMucHVzaChkb3duc2FtcGxlKHdpZHRoLCBoZWlnaHQsIHRleHR1cmUuX2xldmVsc1tsZXZlbCAtIDFdW2ZhY2VdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZXh0dXJlLl9sZXZlbHMucHVzaChtaXBzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHR1cmUuX2xldmVscy5wdXNoKGRvd25zYW1wbGUod2lkdGgsIGhlaWdodCwgdGV4dHVyZS5fbGV2ZWxzW2xldmVsIC0gMV0pKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRleHR1cmUuX2xldmVsc1VwZGF0ZWQgPSB0ZXh0dXJlLl9jdWJlbWFwID8gW1t0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlXV0gOiBbdHJ1ZV07XG59O1xuXG4vKipcbiAqIFJlc291cmNlIGhhbmRsZXIgdXNlZCBmb3IgbG9hZGluZyAyRCBhbmQgM0Qge0BsaW5rIFRleHR1cmV9IHJlc291cmNlcy5cbiAqXG4gKiBAaW1wbGVtZW50cyB7UmVzb3VyY2VIYW5kbGVyfVxuICovXG5jbGFzcyBUZXh0dXJlSGFuZGxlciB7XG4gICAgLyoqXG4gICAgICogVHlwZSBvZiB0aGUgcmVzb3VyY2UgdGhlIGhhbmRsZXIgaGFuZGxlcy5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgaGFuZGxlclR5cGUgPSBcInRleHR1cmVcIjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBUZXh0dXJlSGFuZGxlciBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7aW1wb3J0KCcuLi9hcHAtYmFzZS5qcycpLkFwcEJhc2V9IGFwcCAtIFRoZSBydW5uaW5nIHtAbGluayBBcHBCYXNlfS5cbiAgICAgKiBAaGlkZWNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoYXBwKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IGFwcC5hc3NldHM7XG4gICAgICAgIGNvbnN0IGRldmljZSA9IGFwcC5ncmFwaGljc0RldmljZTtcblxuICAgICAgICB0aGlzLl9kZXZpY2UgPSBkZXZpY2U7XG4gICAgICAgIHRoaXMuX2Fzc2V0cyA9IGFzc2V0cztcbiAgICAgICAgdGhpcy5fbG9hZGVyID0gYXBwLmxvYWRlcjtcblxuICAgICAgICAvLyBpbWcgcGFyc2VyIGhhbmRsZXMgYWxsIGJyb3dzZXItc3VwcG9ydGVkIGltYWdlIGZvcm1hdHMsIHRoaXNcbiAgICAgICAgLy8gcGFyc2VyIHdpbGwgYmUgdXNlZCB3aGVuIG90aGVyIG1vcmUgc3BlY2lmaWMgcGFyc2VycyBhcmUgbm90IGZvdW5kLlxuICAgICAgICB0aGlzLmltZ1BhcnNlciA9IG5ldyBJbWdQYXJzZXIoYXNzZXRzLCBkZXZpY2UpO1xuXG4gICAgICAgIHRoaXMucGFyc2VycyA9IHtcbiAgICAgICAgICAgIGRkczogbmV3IERkc1BhcnNlcihhc3NldHMpLFxuICAgICAgICAgICAga3R4OiBuZXcgS3R4UGFyc2VyKGFzc2V0cyksXG4gICAgICAgICAgICBrdHgyOiBuZXcgS3R4MlBhcnNlcihhc3NldHMsIGRldmljZSksXG4gICAgICAgICAgICBiYXNpczogbmV3IEJhc2lzUGFyc2VyKGFzc2V0cywgZGV2aWNlKSxcbiAgICAgICAgICAgIGhkcjogbmV3IEhkclBhcnNlcihhc3NldHMpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgc2V0IGNyb3NzT3JpZ2luKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuaW1nUGFyc2VyLmNyb3NzT3JpZ2luID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGNyb3NzT3JpZ2luKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbWdQYXJzZXIuY3Jvc3NPcmlnaW47XG4gICAgfVxuXG4gICAgc2V0IG1heFJldHJpZXModmFsdWUpIHtcbiAgICAgICAgdGhpcy5pbWdQYXJzZXIubWF4UmV0cmllcyA9IHZhbHVlO1xuICAgICAgICBmb3IgKGNvbnN0IHBhcnNlciBpbiB0aGlzLnBhcnNlcnMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhcnNlcnMuaGFzT3duUHJvcGVydHkocGFyc2VyKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyc2Vyc1twYXJzZXJdLm1heFJldHJpZXMgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBtYXhSZXRyaWVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbWdQYXJzZXIubWF4UmV0cmllcztcbiAgICB9XG5cbiAgICBfZ2V0VXJsV2l0aG91dFBhcmFtcyh1cmwpIHtcbiAgICAgICAgcmV0dXJuIHVybC5pbmRleE9mKCc/JykgPj0gMCA/IHVybC5zcGxpdCgnPycpWzBdIDogdXJsO1xuICAgIH1cblxuICAgIF9nZXRQYXJzZXIodXJsKSB7XG4gICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZ2V0RXh0ZW5zaW9uKHRoaXMuX2dldFVybFdpdGhvdXRQYXJhbXModXJsKSkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCcuJywgJycpO1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZXJzW2V4dF0gfHwgdGhpcy5pbWdQYXJzZXI7XG4gICAgfVxuXG4gICAgbG9hZCh1cmwsIGNhbGxiYWNrLCBhc3NldCkge1xuICAgICAgICBpZiAodHlwZW9mIHVybCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHVybCA9IHtcbiAgICAgICAgICAgICAgICBsb2FkOiB1cmwsXG4gICAgICAgICAgICAgICAgb3JpZ2luYWw6IHVybFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2dldFBhcnNlcih1cmwub3JpZ2luYWwpLmxvYWQodXJsLCBjYWxsYmFjaywgYXNzZXQpO1xuICAgIH1cblxuICAgIG9wZW4odXJsLCBkYXRhLCBhc3NldCkge1xuICAgICAgICBpZiAoIXVybClcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICAgICAgbGV0IHRleHR1cmUgPSB0aGlzLl9nZXRQYXJzZXIodXJsKS5vcGVuKHVybCwgZGF0YSwgdGhpcy5fZGV2aWNlKTtcblxuICAgICAgICBpZiAodGV4dHVyZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGV4dHVyZSA9IG5ldyBUZXh0dXJlKHRoaXMuX2RldmljZSwge1xuICAgICAgICAgICAgICAgIHdpZHRoOiA0LFxuICAgICAgICAgICAgICAgIGhlaWdodDogNCxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6IFBJWEVMRk9STUFUX1JHQjhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIHRleHR1cmUgaGFzIG9ubHkgYSBwYXJ0aWFsIG1pcG1hcCBjaGFpbiBzcGVjaWZpZWQgYW5kIGdlbmVyYXRlIHRoZVxuICAgICAgICAgICAgLy8gbWlzc2luZyBsZXZlbHMgaWYgcG9zc2libGUuXG4gICAgICAgICAgICBfY29tcGxldGVQYXJ0aWFsTWlwbWFwQ2hhaW4odGV4dHVyZSk7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBiYXNpcyB0cmFuc2NvZGVyIHVuc3dpenpsZWQgYSBHR0dSIHRleHR1cmUsIHJlbW92ZSB0aGUgZmxhZyBmcm9tIHRoZSBhc3NldFxuICAgICAgICAgICAgaWYgKGRhdGEudW5zd2l6emxlZEdHR1IpIHtcbiAgICAgICAgICAgICAgICBhc3NldC5maWxlLnZhcmlhbnRzLmJhc2lzLm9wdCAmPSB+ODtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZXh0dXJlO1xuICAgIH1cblxuICAgIHBhdGNoKGFzc2V0LCBhc3NldHMpIHtcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IGFzc2V0LnJlc291cmNlO1xuICAgICAgICBpZiAoIXRleHR1cmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldC5uYW1lICYmIGFzc2V0Lm5hbWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGV4dHVyZS5uYW1lID0gYXNzZXQubmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFzc2V0RGF0YSA9IGFzc2V0LmRhdGE7XG5cbiAgICAgICAgaWYgKGFzc2V0RGF0YS5oYXNPd25Qcm9wZXJ0eSgnbWluZmlsdGVyJykpIHtcbiAgICAgICAgICAgIHRleHR1cmUubWluRmlsdGVyID0gSlNPTl9GSUxURVJfTU9ERVthc3NldERhdGEubWluZmlsdGVyXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldERhdGEuaGFzT3duUHJvcGVydHkoJ21hZ2ZpbHRlcicpKSB7XG4gICAgICAgICAgICB0ZXh0dXJlLm1hZ0ZpbHRlciA9IEpTT05fRklMVEVSX01PREVbYXNzZXREYXRhLm1hZ2ZpbHRlcl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRleHR1cmUuY3ViZW1hcCkge1xuICAgICAgICAgICAgaWYgKGFzc2V0RGF0YS5oYXNPd25Qcm9wZXJ0eSgnYWRkcmVzc3UnKSkge1xuICAgICAgICAgICAgICAgIHRleHR1cmUuYWRkcmVzc1UgPSBKU09OX0FERFJFU1NfTU9ERVthc3NldERhdGEuYWRkcmVzc3VdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYXNzZXREYXRhLmhhc093blByb3BlcnR5KCdhZGRyZXNzdicpKSB7XG4gICAgICAgICAgICAgICAgdGV4dHVyZS5hZGRyZXNzViA9IEpTT05fQUREUkVTU19NT0RFW2Fzc2V0RGF0YS5hZGRyZXNzdl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXNzZXREYXRhLmhhc093blByb3BlcnR5KCdtaXBtYXBzJykpIHtcbiAgICAgICAgICAgIHRleHR1cmUubWlwbWFwcyA9IGFzc2V0RGF0YS5taXBtYXBzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzc2V0RGF0YS5oYXNPd25Qcm9wZXJ0eSgnYW5pc290cm9weScpKSB7XG4gICAgICAgICAgICB0ZXh0dXJlLmFuaXNvdHJvcHkgPSBhc3NldERhdGEuYW5pc290cm9weTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldERhdGEuaGFzT3duUHJvcGVydHkoJ2ZsaXBZJykpIHtcbiAgICAgICAgICAgIHRleHR1cmUuZmxpcFkgPSAhIWFzc2V0RGF0YS5mbGlwWTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGV4dHJhY3QgYXNzZXQgdHlwZSAodGhpcyBpcyBiaXQgb2YgYSBtZXNzKVxuICAgICAgICBpZiAoYXNzZXREYXRhLmhhc093blByb3BlcnR5KCd0eXBlJykpIHtcbiAgICAgICAgICAgIHRleHR1cmUudHlwZSA9IEpTT05fVEVYVFVSRV9UWVBFW2Fzc2V0RGF0YS50eXBlXTtcbiAgICAgICAgfSBlbHNlIGlmIChhc3NldERhdGEuaGFzT3duUHJvcGVydHkoJ3JnYm0nKSAmJiBhc3NldERhdGEucmdibSkge1xuICAgICAgICAgICAgdGV4dHVyZS50eXBlID0gVEVYVFVSRVRZUEVfUkdCTTtcbiAgICAgICAgfSBlbHNlIGlmIChhc3NldC5maWxlICYmIChhc3NldC5maWxlLm9wdCAmIDgpICE9PSAwKSB7XG4gICAgICAgICAgICAvLyBiYXNpcyBub3JtYWxtYXBzIGZsYWcgdGhlIHZhcmlhbnQgYXMgc3dpenpsZWRcbiAgICAgICAgICAgIHRleHR1cmUudHlwZSA9IFRFWFRVUkVUWVBFX1NXSVpaTEVHR0dSO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBUZXh0dXJlSGFuZGxlciwgVGV4dHVyZVBhcnNlciB9O1xuIl0sIm5hbWVzIjpbIkpTT05fQUREUkVTU19NT0RFIiwiQUREUkVTU19SRVBFQVQiLCJBRERSRVNTX0NMQU1QX1RPX0VER0UiLCJBRERSRVNTX01JUlJPUkVEX1JFUEVBVCIsIkpTT05fRklMVEVSX01PREUiLCJGSUxURVJfTkVBUkVTVCIsIkZJTFRFUl9MSU5FQVIiLCJGSUxURVJfTkVBUkVTVF9NSVBNQVBfTkVBUkVTVCIsIkZJTFRFUl9MSU5FQVJfTUlQTUFQX05FQVJFU1QiLCJGSUxURVJfTkVBUkVTVF9NSVBNQVBfTElORUFSIiwiRklMVEVSX0xJTkVBUl9NSVBNQVBfTElORUFSIiwiSlNPTl9URVhUVVJFX1RZUEUiLCJURVhUVVJFVFlQRV9ERUZBVUxUIiwiVEVYVFVSRVRZUEVfUkdCTSIsIlRFWFRVUkVUWVBFX1JHQkUiLCJURVhUVVJFVFlQRV9SR0JQIiwiVEVYVFVSRVRZUEVfU1dJWlpMRUdHR1IiLCJUZXh0dXJlUGFyc2VyIiwibG9hZCIsInVybCIsImNhbGxiYWNrIiwiYXNzZXQiLCJFcnJvciIsIm9wZW4iLCJkYXRhIiwiZGV2aWNlIiwiX2NvbXBsZXRlUGFydGlhbE1pcG1hcENoYWluIiwidGV4dHVyZSIsInJlcXVpcmVkTWlwTGV2ZWxzIiwiTWF0aCIsImxvZzIiLCJtYXgiLCJfd2lkdGgiLCJfaGVpZ2h0IiwiaXNIdG1sRWxlbWVudCIsIm9iamVjdCIsIkhUTUxDYW52YXNFbGVtZW50IiwiSFRNTEltYWdlRWxlbWVudCIsIkhUTUxWaWRlb0VsZW1lbnQiLCJfZm9ybWF0IiwiUElYRUxGT1JNQVRfUkdCQTgiLCJQSVhFTEZPUk1BVF9SR0JBMzJGIiwiX3ZvbHVtZSIsIl9jb21wcmVzc2VkIiwiX2xldmVscyIsImxlbmd0aCIsIl9jdWJlbWFwIiwiZG93bnNhbXBsZSIsIndpZHRoIiwiaGVpZ2h0Iiwic2FtcGxlZFdpZHRoIiwic2FtcGxlZEhlaWdodCIsInNhbXBsZWREYXRhIiwiY29uc3RydWN0b3IiLCJ4cyIsImZsb29yIiwieXMiLCJ4c3lzIiwieSIsIngiLCJlIiwic3VtIiwic3kiLCJzeCIsImxldmVsIiwibWlwcyIsImZhY2UiLCJwdXNoIiwiX2xldmVsc1VwZGF0ZWQiLCJUZXh0dXJlSGFuZGxlciIsImFwcCIsImhhbmRsZXJUeXBlIiwiYXNzZXRzIiwiZ3JhcGhpY3NEZXZpY2UiLCJfZGV2aWNlIiwiX2Fzc2V0cyIsIl9sb2FkZXIiLCJsb2FkZXIiLCJpbWdQYXJzZXIiLCJJbWdQYXJzZXIiLCJwYXJzZXJzIiwiZGRzIiwiRGRzUGFyc2VyIiwia3R4IiwiS3R4UGFyc2VyIiwia3R4MiIsIkt0eDJQYXJzZXIiLCJiYXNpcyIsIkJhc2lzUGFyc2VyIiwiaGRyIiwiSGRyUGFyc2VyIiwiY3Jvc3NPcmlnaW4iLCJ2YWx1ZSIsIm1heFJldHJpZXMiLCJwYXJzZXIiLCJoYXNPd25Qcm9wZXJ0eSIsIl9nZXRVcmxXaXRob3V0UGFyYW1zIiwiaW5kZXhPZiIsInNwbGl0IiwiX2dldFBhcnNlciIsImV4dCIsInBhdGgiLCJnZXRFeHRlbnNpb24iLCJ0b0xvd2VyQ2FzZSIsInJlcGxhY2UiLCJvcmlnaW5hbCIsInVuZGVmaW5lZCIsIlRleHR1cmUiLCJmb3JtYXQiLCJQSVhFTEZPUk1BVF9SR0I4IiwidW5zd2l6emxlZEdHR1IiLCJmaWxlIiwidmFyaWFudHMiLCJvcHQiLCJwYXRjaCIsInJlc291cmNlIiwibmFtZSIsImFzc2V0RGF0YSIsIm1pbkZpbHRlciIsIm1pbmZpbHRlciIsIm1hZ0ZpbHRlciIsIm1hZ2ZpbHRlciIsImN1YmVtYXAiLCJhZGRyZXNzVSIsImFkZHJlc3N1IiwiYWRkcmVzc1YiLCJhZGRyZXNzdiIsIm1pcG1hcHMiLCJhbmlzb3Ryb3B5IiwiZmxpcFkiLCJ0eXBlIiwicmdibSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUVBLE1BQU1BLGlCQUFpQixHQUFHO0FBQ3RCLEVBQUEsUUFBUSxFQUFFQyxjQUFjO0FBQ3hCLEVBQUEsT0FBTyxFQUFFQyxxQkFBcUI7QUFDOUIsRUFBQSxRQUFRLEVBQUVDLHVCQUFBQTtBQUNkLENBQUMsQ0FBQTtBQUVELE1BQU1DLGdCQUFnQixHQUFHO0FBQ3JCLEVBQUEsU0FBUyxFQUFFQyxjQUFjO0FBQ3pCLEVBQUEsUUFBUSxFQUFFQyxhQUFhO0FBQ3ZCLEVBQUEscUJBQXFCLEVBQUVDLDZCQUE2QjtBQUNwRCxFQUFBLG9CQUFvQixFQUFFQyw0QkFBNEI7QUFDbEQsRUFBQSxvQkFBb0IsRUFBRUMsNEJBQTRCO0FBQ2xELEVBQUEsbUJBQW1CLEVBQUVDLDJCQUFBQTtBQUN6QixDQUFDLENBQUE7QUFFRCxNQUFNQyxpQkFBaUIsR0FBRztBQUN0QixFQUFBLFNBQVMsRUFBRUMsbUJBQW1CO0FBQzlCLEVBQUEsTUFBTSxFQUFFQyxnQkFBZ0I7QUFDeEIsRUFBQSxNQUFNLEVBQUVDLGdCQUFnQjtBQUN4QixFQUFBLE1BQU0sRUFBRUMsZ0JBQWdCO0FBQ3hCLEVBQUEsYUFBYSxFQUFFQyx1QkFBQUE7QUFDbkIs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
