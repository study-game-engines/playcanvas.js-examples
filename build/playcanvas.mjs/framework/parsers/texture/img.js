import { path } from '../../../core/path.js';
import { PIXELFORMAT_RGB8, PIXELFORMAT_RGBA8 } from '../../../platform/graphics/constants.js';
import { Texture } from '../../../platform/graphics/texture.js';
import { http } from '../../../platform/net/http.js';
import { ABSOLUTE_URL } from '../../asset/constants.js';

class ImgParser {
	constructor(registry, device) {
		this.crossOrigin = registry.prefix ? 'anonymous' : null;
		this.maxRetries = 0;
		this.device = device;
	}
	load(url, callback, asset) {
		var _asset$file;
		const hasContents = !!(asset != null && (_asset$file = asset.file) != null && _asset$file.contents);
		if (hasContents) {
			if (this.device.supportsImageBitmap) {
				this._loadImageBitmapFromData(asset.file.contents, callback);
				return;
			}
			url = {
				load: URL.createObjectURL(new Blob([asset.file.contents])),
				original: url.original
			};
		}
		const handler = (err, result) => {
			if (hasContents) {
				URL.revokeObjectURL(url.load);
			}
			callback(err, result);
		};
		let crossOrigin;
		if (asset && asset.options && asset.options.hasOwnProperty('crossOrigin')) {
			crossOrigin = asset.options.crossOrigin;
		} else if (ABSOLUTE_URL.test(url.load)) {
			crossOrigin = this.crossOrigin;
		}
		if (this.device.supportsImageBitmap) {
			this._loadImageBitmap(url.load, url.original, crossOrigin, handler);
		} else {
			this._loadImage(url.load, url.original, crossOrigin, handler);
		}
	}
	open(url, data, device) {
		const ext = path.getExtension(url).toLowerCase();
		const format = ext === '.jpg' || ext === '.jpeg' ? PIXELFORMAT_RGB8 : PIXELFORMAT_RGBA8;
		const texture = new Texture(device, {
			name: url,
			width: data.width,
			height: data.height,
			format: format
		});
		texture.setSource(data);
		return texture;
	}
	_loadImage(url, originalUrl, crossOrigin, callback) {
		const image = new Image();
		if (crossOrigin) {
			image.crossOrigin = crossOrigin;
		}
		let retries = 0;
		const maxRetries = this.maxRetries;
		let retryTimeout;
		image.onload = function () {
			callback(null, image);
		};
		image.onerror = function () {
			if (retryTimeout) return;
			if (maxRetries > 0 && ++retries <= maxRetries) {
				const retryDelay = Math.pow(2, retries) * 100;
				console.log(`Error loading Texture from: '${originalUrl}' - Retrying in ${retryDelay}ms...`);
				const idx = url.indexOf('?');
				const separator = idx >= 0 ? '&' : '?';
				retryTimeout = setTimeout(function () {
					image.src = url + separator + 'retry=' + Date.now();
					retryTimeout = null;
				}, retryDelay);
			} else {
				callback(`Error loading Texture from: '${originalUrl}'`);
			}
		};
		image.src = url;
	}
	_loadImageBitmap(url, originalUrl, crossOrigin, callback) {
		const options = {
			cache: true,
			responseType: 'blob',
			retry: this.maxRetries > 0,
			maxRetries: this.maxRetries
		};
		http.get(url, options, function (err, blob) {
			if (err) {
				callback(err);
			} else {
				createImageBitmap(blob, {
					premultiplyAlpha: 'none'
				}).then(imageBitmap => callback(null, imageBitmap)).catch(e => callback(e));
			}
		});
	}
	_loadImageBitmapFromData(data, callback) {
		createImageBitmap(new Blob([data]), {
			premultiplyAlpha: 'none'
		}).then(imageBitmap => callback(null, imageBitmap)).catch(e => callback(e));
	}
}

export { ImgParser };
