/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (DEBUG PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
import { EventHandler } from '../core/event-handler.js';
import { Asset } from '../asset/asset.js';
import { I18nParser } from './i18n-parser.js';
import { DEFAULT_LOCALE, DEFAULT_LOCALE_FALLBACKS } from './constants.js';
import { getLang, replaceLang, getPluralFn, findAvailableLocale } from './utils.js';

class I18n extends EventHandler {
  constructor(app) {
    super();
    this.locale = DEFAULT_LOCALE;
    this._translations = {};
    this._availableLangs = {};
    this._app = app;
    this._assets = [];
    this._parser = new I18nParser();
  }

  set assets(value) {
    const index = {};

    for (let _i = 0, len = value.length; _i < len; _i++) {
      const id = value[_i] instanceof Asset ? value[_i].id : value[_i];
      index[id] = true;
    }

    let i = this._assets.length;

    while (i--) {
      const id = this._assets[i];

      if (!index[id]) {
        this._app.assets.off('add:' + id, this._onAssetAdd, this);

        const asset = this._app.assets.get(id);

        if (asset) {
          this._onAssetRemove(asset);
        }

        this._assets.splice(i, 1);
      }
    }

    for (const id in index) {
      const idNum = parseInt(id, 10);
      if (this._assets.indexOf(idNum) !== -1) continue;

      this._assets.push(idNum);

      const asset = this._app.assets.get(idNum);

      if (!asset) {
        this._app.assets.once('add:' + idNum, this._onAssetAdd, this);
      } else {
        this._onAssetAdd(asset);
      }
    }
  }

  get assets() {
    return this._assets;
  }

  set locale(value) {
    if (this._locale === value) {
      return;
    }

    let lang = getLang(value);

    if (lang === 'in') {
      lang = 'id';
      value = replaceLang(value, lang);

      if (this._locale === value) {
        return;
      }
    }

    const old = this._locale;
    this._locale = value;
    this._lang = lang;
    this._pluralFn = getPluralFn(this._lang);
    this.fire('set:locale', value, old);
  }

  get locale() {
    return this._locale;
  }

  static findAvailableLocale(desiredLocale, availableLocales) {
    return findAvailableLocale(desiredLocale, availableLocales);
  }

  findAvailableLocale(desiredLocale) {
    if (this._translations[desiredLocale]) {
      return desiredLocale;
    }

    const lang = getLang(desiredLocale);
    return this._findFallbackLocale(desiredLocale, lang);
  }

  getText(key, locale) {
    let result = key;
    let lang;

    if (!locale) {
      locale = this._locale;
      lang = this._lang;
    }

    let translations = this._translations[locale];

    if (!translations) {
      if (!lang) {
        lang = getLang(locale);
      }

      locale = this._findFallbackLocale(locale, lang);
      translations = this._translations[locale];
    }

    if (translations && translations.hasOwnProperty(key)) {
      result = translations[key];

      if (Array.isArray(result)) {
        result = result[0];
      }

      if (result === null || result === undefined) {
        result = key;
      }
    }

    return result;
  }

  getPluralText(key, n, locale) {
    let result = key;
    let lang;
    let pluralFn;

    if (!locale) {
      locale = this._locale;
      lang = this._lang;
      pluralFn = this._pluralFn;
    } else {
      lang = getLang(locale);
      pluralFn = getPluralFn(lang);
    }

    let translations = this._translations[locale];

    if (!translations) {
      locale = this._findFallbackLocale(locale, lang);
      lang = getLang(locale);
      pluralFn = getPluralFn(lang);
      translations = this._translations[locale];
    }

    if (translations && translations[key] && pluralFn) {
      const index = pluralFn(n);
      result = translations[key][index];

      if (result === null || result === undefined) {
        result = key;
      }
    }

    return result;
  }

  addData(data) {
    let parsed;

    try {
      parsed = this._parser.parse(data);
    } catch (err) {
      console.error(err);
      return;
    }

    for (let i = 0, len = parsed.length; i < len; i++) {
      const entry = parsed[i];
      const locale = entry.info.locale;
      const messages = entry.messages;

      if (!this._translations[locale]) {
        this._translations[locale] = {};
        const lang = getLang(locale);

        if (!this._availableLangs[lang]) {
          this._availableLangs[lang] = locale;
        }
      }

      Object.assign(this._translations[locale], messages);
      this.fire('data:add', locale, messages);
    }
  }

  removeData(data) {
    let parsed;

    try {
      parsed = this._parser.parse(data);
    } catch (err) {
      console.error(err);
      return;
    }

    for (let i = 0, len = parsed.length; i < len; i++) {
      const entry = parsed[i];
      const locale = entry.info.locale;
      const translations = this._translations[locale];
      if (!translations) continue;
      const messages = entry.messages;

      for (const key in messages) {
        delete translations[key];
      }

      if (Object.keys(translations).length === 0) {
        delete this._translations[locale];
        delete this._availableLangs[getLang(locale)];
      }

      this.fire('data:remove', locale, messages);
    }
  }

  destroy() {
    this._translations = null;
    this._availableLangs = null;
    this._assets = null;
    this._parser = null;
    this.off();
  }

  _findFallbackLocale(locale, lang) {
    let result = DEFAULT_LOCALE_FALLBACKS[locale];

    if (result && this._translations[result]) {
      return result;
    }

    result = DEFAULT_LOCALE_FALLBACKS[lang];

    if (result && this._translations[result]) {
      return result;
    }

    result = this._availableLangs[lang];

    if (result && this._translations[result]) {
      return result;
    }

    return DEFAULT_LOCALE;
  }

  _onAssetAdd(asset) {
    asset.on('load', this._onAssetLoad, this);
    asset.on('change', this._onAssetChange, this);
    asset.on('remove', this._onAssetRemove, this);
    asset.on('unload', this._onAssetUnload, this);

    if (asset.resource) {
      this._onAssetLoad(asset);
    }
  }

  _onAssetLoad(asset) {
    this.addData(asset.resource);
  }

  _onAssetChange(asset) {
    if (asset.resource) {
      this.addData(asset.resource);
    }
  }

  _onAssetRemove(asset) {
    asset.off('load', this._onAssetLoad, this);
    asset.off('change', this._onAssetChange, this);
    asset.off('remove', this._onAssetRemove, this);
    asset.off('unload', this._onAssetUnload, this);

    if (asset.resource) {
      this.removeData(asset.resource);
    }

    this._app.assets.once('add:' + asset.id, this._onAssetAdd, this);
  }

  _onAssetUnload(asset) {
    if (asset.resource) {
      this.removeData(asset.resource);
    }
  }

}

export { I18n };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2kxOG4vaTE4bi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudEhhbmRsZXIgfSBmcm9tICcuLi9jb3JlL2V2ZW50LWhhbmRsZXIuanMnO1xuXG5pbXBvcnQgeyBBc3NldCB9IGZyb20gJy4uL2Fzc2V0L2Fzc2V0LmpzJztcblxuaW1wb3J0IHsgSTE4blBhcnNlciB9IGZyb20gJy4vaTE4bi1wYXJzZXIuanMnO1xuXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi4vZnJhbWV3b3JrL2FwcC1iYXNlLmpzJykuQXBwQmFzZX0gQXBwQmFzZSAqL1xuXG5pbXBvcnQge1xuICAgIERFRkFVTFRfTE9DQUxFLFxuICAgIERFRkFVTFRfTE9DQUxFX0ZBTExCQUNLU1xufSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5cbmltcG9ydCB7XG4gICAgcmVwbGFjZUxhbmcsXG4gICAgZ2V0TGFuZyxcbiAgICBnZXRQbHVyYWxGbixcbiAgICBmaW5kQXZhaWxhYmxlTG9jYWxlXG59IGZyb20gJy4vdXRpbHMuanMnO1xuXG4vKipcbiAqIEhhbmRsZXMgbG9jYWxpemF0aW9uLiBSZXNwb25zaWJsZSBmb3IgbG9hZGluZyBsb2NhbGl6YXRpb24gYXNzZXRzIGFuZCByZXR1cm5pbmcgdHJhbnNsYXRpb25zIGZvclxuICogYSBjZXJ0YWluIGtleS4gQ2FuIGFsc28gaGFuZGxlIHBsdXJhbCBmb3Jtcy4gVG8gb3ZlcnJpZGUgaXRzIGRlZmF1bHQgYmVoYXZpb3IgZGVmaW5lIGEgZGlmZmVyZW50XG4gKiBpbXBsZW1lbnRhdGlvbiBmb3Ige0BsaW5rIEkxOG4jZ2V0VGV4dH0gYW5kIHtAbGluayBJMThuI2dldFBsdXJhbFRleHR9LlxuICpcbiAqIEBhdWdtZW50cyBFdmVudEhhbmRsZXJcbiAqL1xuY2xhc3MgSTE4biBleHRlbmRzIEV2ZW50SGFuZGxlciB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEkxOG4gaW5zdGFuY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FwcEJhc2V9IGFwcCAtIFRoZSBhcHBsaWNhdGlvbi5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmxvY2FsZSA9IERFRkFVTFRfTE9DQUxFO1xuICAgICAgICB0aGlzLl90cmFuc2xhdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5fYXZhaWxhYmxlTGFuZ3MgPSB7fTtcbiAgICAgICAgdGhpcy5fYXBwID0gYXBwO1xuICAgICAgICB0aGlzLl9hc3NldHMgPSBbXTtcbiAgICAgICAgdGhpcy5fcGFyc2VyID0gbmV3IEkxOG5QYXJzZXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbiBhcnJheSBvZiBhc3NldCBpZHMgb3IgYXNzZXRzIHRoYXQgY29udGFpbiBsb2NhbGl6YXRpb24gZGF0YSBpbiB0aGUgZXhwZWN0ZWQgZm9ybWF0LiBJMThuXG4gICAgICogd2lsbCBhdXRvbWF0aWNhbGx5IGxvYWQgdHJhbnNsYXRpb25zIGZyb20gdGhlc2UgYXNzZXRzIGFzIHRoZSBhc3NldHMgYXJlIGxvYWRlZCBhbmQgaXQgd2lsbFxuICAgICAqIGFsc28gYXV0b21hdGljYWxseSB1bmxvYWQgdHJhbnNsYXRpb25zIGlmIHRoZSBhc3NldHMgZ2V0IHJlbW92ZWQgb3IgdW5sb2FkZWQgYXQgcnVudGltZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJbXXxBc3NldFtdfVxuICAgICAqL1xuICAgIHNldCBhc3NldHModmFsdWUpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB7fTtcblxuICAgICAgICAvLyBjb252ZXJ0IGFycmF5IHRvIGRpY3RcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpZCA9IHZhbHVlW2ldIGluc3RhbmNlb2YgQXNzZXQgPyB2YWx1ZVtpXS5pZCA6IHZhbHVlW2ldO1xuICAgICAgICAgICAgaW5kZXhbaWRdID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbW92ZSBhc3NldHMgbm90IGluIHZhbHVlXG4gICAgICAgIGxldCBpID0gdGhpcy5fYXNzZXRzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgY29uc3QgaWQgPSB0aGlzLl9hc3NldHNbaV07XG4gICAgICAgICAgICBpZiAoIWluZGV4W2lkXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FwcC5hc3NldHMub2ZmKCdhZGQ6JyArIGlkLCB0aGlzLl9vbkFzc2V0QWRkLCB0aGlzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IHRoaXMuX2FwcC5hc3NldHMuZ2V0KGlkKTtcbiAgICAgICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb25Bc3NldFJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2Fzc2V0cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgYXNzZXRzIGluIHZhbHVlIHRoYXQgZG8gbm90IGFscmVhZHkgZXhpc3QgaGVyZVxuICAgICAgICBmb3IgKGNvbnN0IGlkIGluIGluZGV4KSB7XG4gICAgICAgICAgICBjb25zdCBpZE51bSA9IHBhcnNlSW50KGlkLCAxMCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fYXNzZXRzLmluZGV4T2YoaWROdW0pICE9PSAtMSkgY29udGludWU7XG5cbiAgICAgICAgICAgIHRoaXMuX2Fzc2V0cy5wdXNoKGlkTnVtKTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcy5fYXBwLmFzc2V0cy5nZXQoaWROdW0pO1xuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FwcC5hc3NldHMub25jZSgnYWRkOicgKyBpZE51bSwgdGhpcy5fb25Bc3NldEFkZCwgdGhpcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uQXNzZXRBZGQoYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGFzc2V0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Fzc2V0cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY3VycmVudCBsb2NhbGUgZm9yIGV4YW1wbGUgXCJlbi1VU1wiLiBDaGFuZ2luZyB0aGUgbG9jYWxlIHdpbGwgcmFpc2UgYW4gZXZlbnQgd2hpY2ggd2lsbFxuICAgICAqIGNhdXNlIGxvY2FsaXplZCBUZXh0IEVsZW1lbnRzIHRvIGNoYW5nZSBsYW5ndWFnZSB0byB0aGUgbmV3IGxvY2FsZS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgc2V0IGxvY2FsZSh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fbG9jYWxlID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVwbGFjZSAnaW4nIGxhbmd1YWdlIHdpdGggJ2lkJ1xuICAgICAgICAvLyBmb3IgSW5kb25lc2lhbiBiZWNhdXNlIGJvdGggY29kZXMgYXJlIHZhbGlkXG4gICAgICAgIC8vIHNvIHRoYXQgdXNlcnMgb25seSBuZWVkIHRvIHVzZSB0aGUgJ2lkJyBjb2RlXG4gICAgICAgIGxldCBsYW5nID0gZ2V0TGFuZyh2YWx1ZSk7XG4gICAgICAgIGlmIChsYW5nID09PSAnaW4nKSB7XG4gICAgICAgICAgICBsYW5nID0gJ2lkJztcbiAgICAgICAgICAgIHZhbHVlID0gcmVwbGFjZUxhbmcodmFsdWUsIGxhbmcpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2xvY2FsZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvbGQgPSB0aGlzLl9sb2NhbGU7XG4gICAgICAgIC8vIGNhY2hlIGxvY2FsZSwgbGFuZyBhbmQgcGx1cmFsIGZ1bmN0aW9uXG4gICAgICAgIHRoaXMuX2xvY2FsZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9sYW5nID0gbGFuZztcbiAgICAgICAgdGhpcy5fcGx1cmFsRm4gPSBnZXRQbHVyYWxGbih0aGlzLl9sYW5nKTtcblxuICAgICAgICAvLyByYWlzZSBldmVudFxuICAgICAgICB0aGlzLmZpcmUoJ3NldDpsb2NhbGUnLCB2YWx1ZSwgb2xkKTtcbiAgICB9XG5cbiAgICBnZXQgbG9jYWxlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9jYWxlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGZpcnN0IGF2YWlsYWJsZSBsb2NhbGUgYmFzZWQgb24gdGhlIGRlc2lyZWQgbG9jYWxlIHNwZWNpZmllZC4gRmlyc3QgdHJpZXMgdG9cbiAgICAgKiBmaW5kIHRoZSBkZXNpcmVkIGxvY2FsZSBhbmQgdGhlbiB0cmllcyB0byBmaW5kIGFuIGFsdGVybmF0aXZlIGxvY2FsZSBiYXNlZCBvbiB0aGUgbGFuZ3VhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGVzaXJlZExvY2FsZSAtIFRoZSBkZXNpcmVkIGxvY2FsZSBlLmcuIGVuLVVTLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBhdmFpbGFibGVMb2NhbGVzIC0gQSBkaWN0aW9uYXJ5IHdoZXJlIGVhY2gga2V5IGlzIGFuIGF2YWlsYWJsZSBsb2NhbGUuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gVGhlIGxvY2FsZSBmb3VuZCBvciBpZiBubyBsb2NhbGUgaXMgYXZhaWxhYmxlIHJldHVybnMgdGhlIGRlZmF1bHQgZW4tVVNcbiAgICAgKiBsb2NhbGUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBXaXRoIGEgZGVmaW5lZCBkaWN0aW9uYXJ5IG9mIGxvY2FsZXNcbiAgICAgKiB2YXIgYXZhaWxhYmxlTG9jYWxlcyA9IHsgZW46ICdlbi1VUycsIGZyOiAnZnItRlInIH07XG4gICAgICogdmFyIGxvY2FsZSA9IHBjLkkxOG4uZ2V0VGV4dCgnZW4tVVMnLCBhdmFpbGFibGVMb2NhbGVzKTtcbiAgICAgKiAvLyByZXR1cm5zICdlbidcbiAgICAgKiBAaWdub3JlXG4gICAgICovXG4gICAgc3RhdGljIGZpbmRBdmFpbGFibGVMb2NhbGUoZGVzaXJlZExvY2FsZSwgYXZhaWxhYmxlTG9jYWxlcykge1xuICAgICAgICByZXR1cm4gZmluZEF2YWlsYWJsZUxvY2FsZShkZXNpcmVkTG9jYWxlLCBhdmFpbGFibGVMb2NhbGVzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBmaXJzdCBhdmFpbGFibGUgbG9jYWxlIGJhc2VkIG9uIHRoZSBkZXNpcmVkIGxvY2FsZSBzcGVjaWZpZWQuIEZpcnN0IHRyaWVzIHRvXG4gICAgICogZmluZCB0aGUgZGVzaXJlZCBsb2NhbGUgaW4gdGhlIGxvYWRlZCB0cmFuc2xhdGlvbnMgYW5kIHRoZW4gdHJpZXMgdG8gZmluZCBhbiBhbHRlcm5hdGl2ZVxuICAgICAqIGxvY2FsZSBiYXNlZCBvbiB0aGUgbGFuZ3VhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGVzaXJlZExvY2FsZSAtIFRoZSBkZXNpcmVkIGxvY2FsZSBlLmcuIGVuLVVTLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBsb2NhbGUgZm91bmQgb3IgaWYgbm8gbG9jYWxlIGlzIGF2YWlsYWJsZSByZXR1cm5zIHRoZSBkZWZhdWx0IGVuLVVTXG4gICAgICogbG9jYWxlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIGxvY2FsZSA9IHRoaXMuYXBwLmkxOG4uZ2V0VGV4dCgnZW4tVVMnKTtcbiAgICAgKi9cbiAgICBmaW5kQXZhaWxhYmxlTG9jYWxlKGRlc2lyZWRMb2NhbGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3RyYW5zbGF0aW9uc1tkZXNpcmVkTG9jYWxlXSkge1xuICAgICAgICAgICAgcmV0dXJuIGRlc2lyZWRMb2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYW5nID0gZ2V0TGFuZyhkZXNpcmVkTG9jYWxlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRGYWxsYmFja0xvY2FsZShkZXNpcmVkTG9jYWxlLCBsYW5nKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB0cmFuc2xhdGlvbiBmb3IgdGhlIHNwZWNpZmllZCBrZXkgYW5kIGxvY2FsZS4gSWYgdGhlIGxvY2FsZSBpcyBub3Qgc3BlY2lmaWVkIGl0XG4gICAgICogd2lsbCB1c2UgdGhlIGN1cnJlbnQgbG9jYWxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIFRoZSBsb2NhbGl6YXRpb24ga2V5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbG9jYWxlXSAtIFRoZSBkZXNpcmVkIGxvY2FsZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgdHJhbnNsYXRlZCB0ZXh0LiBJZiBubyB0cmFuc2xhdGlvbnMgYXJlIGZvdW5kIGF0IGFsbCBmb3IgdGhlIGxvY2FsZVxuICAgICAqIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlIGVuLVVTIHRyYW5zbGF0aW9uLiBJZiBubyB0cmFuc2xhdGlvbiBleGlzdHMgZm9yIHRoYXQga2V5IHRoZW4gaXQgd2lsbFxuICAgICAqIHJldHVybiB0aGUgbG9jYWxpemF0aW9uIGtleS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBsb2NhbGl6ZWQgPSB0aGlzLmFwcC5pMThuLmdldFRleHQoJ2xvY2FsaXphdGlvbi1rZXknKTtcbiAgICAgKiB2YXIgbG9jYWxpemVkRnJlbmNoID0gdGhpcy5hcHAuaTE4bi5nZXRUZXh0KCdsb2NhbGl6YXRpb24ta2V5JywgJ2ZyLUZSJyk7XG4gICAgICovXG4gICAgZ2V0VGV4dChrZXksIGxvY2FsZSkge1xuICAgICAgICAvLyBkZWZhdWx0IHRyYW5zbGF0aW9uIGlzIHRoZSBrZXlcbiAgICAgICAgbGV0IHJlc3VsdCA9IGtleTtcblxuICAgICAgICBsZXQgbGFuZztcbiAgICAgICAgaWYgKCFsb2NhbGUpIHtcbiAgICAgICAgICAgIGxvY2FsZSA9IHRoaXMuX2xvY2FsZTtcbiAgICAgICAgICAgIGxhbmcgPSB0aGlzLl9sYW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRyYW5zbGF0aW9ucyA9IHRoaXMuX3RyYW5zbGF0aW9uc1tsb2NhbGVdO1xuICAgICAgICBpZiAoIXRyYW5zbGF0aW9ucykge1xuICAgICAgICAgICAgaWYgKCFsYW5nKSB7XG4gICAgICAgICAgICAgICAgbGFuZyA9IGdldExhbmcobG9jYWxlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbG9jYWxlID0gdGhpcy5fZmluZEZhbGxiYWNrTG9jYWxlKGxvY2FsZSwgbGFuZyk7XG4gICAgICAgICAgICB0cmFuc2xhdGlvbnMgPSB0aGlzLl90cmFuc2xhdGlvbnNbbG9jYWxlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cmFuc2xhdGlvbnMgJiYgdHJhbnNsYXRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRyYW5zbGF0aW9uc1trZXldO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGEgcGx1cmFsIGtleSB0aGVuIHJldHVybiB0aGUgZmlyc3QgZW50cnkgaW4gdGhlIGFycmF5XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0WzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiBudWxsIG9yIHVuZGVmaW5lZCBzd2l0Y2ggYmFjayB0byB0aGUga2V5IChlbXB0eSBzdHJpbmcgaXMgYWxsb3dlZClcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwgfHwgcmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBrZXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBsdXJhbGl6ZWQgdHJhbnNsYXRpb24gZm9yIHRoZSBzcGVjaWZpZWQga2V5LCBudW1iZXIgbiBhbmQgbG9jYWxlLiBJZiB0aGUgbG9jYWxlXG4gICAgICogaXMgbm90IHNwZWNpZmllZCBpdCB3aWxsIHVzZSB0aGUgY3VycmVudCBsb2NhbGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gVGhlIGxvY2FsaXphdGlvbiBrZXkuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG4gLSBUaGUgbnVtYmVyIHVzZWQgdG8gZGV0ZXJtaW5lIHdoaWNoIHBsdXJhbCBmb3JtIHRvIHVzZS4gRS5nLiBGb3IgdGhlXG4gICAgICogcGhyYXNlIFwiNSBBcHBsZXNcIiBuIGVxdWFscyA1LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbG9jYWxlXSAtIFRoZSBkZXNpcmVkIGxvY2FsZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgdHJhbnNsYXRlZCB0ZXh0LiBJZiBubyB0cmFuc2xhdGlvbnMgYXJlIGZvdW5kIGF0IGFsbCBmb3IgdGhlIGxvY2FsZVxuICAgICAqIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlIGVuLVVTIHRyYW5zbGF0aW9uLiBJZiBubyB0cmFuc2xhdGlvbiBleGlzdHMgZm9yIHRoYXQga2V5IHRoZW4gaXRcbiAgICAgKiB3aWxsIHJldHVybiB0aGUgbG9jYWxpemF0aW9uIGtleS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIG1hbnVhbGx5IHJlcGxhY2Uge251bWJlcn0gaW4gdGhlIHJlc3VsdGluZyB0cmFuc2xhdGlvbiB3aXRoIG91ciBudW1iZXJcbiAgICAgKiB2YXIgbG9jYWxpemVkID0gdGhpcy5hcHAuaTE4bi5nZXRQbHVyYWxUZXh0KCd7bnVtYmVyfSBhcHBsZXMnLCBudW1iZXIpLnJlcGxhY2UoXCJ7bnVtYmVyfVwiLCBudW1iZXIpO1xuICAgICAqL1xuICAgIGdldFBsdXJhbFRleHQoa2V5LCBuLCBsb2NhbGUpIHtcbiAgICAgICAgLy8gZGVmYXVsdCB0cmFuc2xhdGlvbiBpcyB0aGUga2V5XG4gICAgICAgIGxldCByZXN1bHQgPSBrZXk7XG5cbiAgICAgICAgbGV0IGxhbmc7XG4gICAgICAgIGxldCBwbHVyYWxGbjtcblxuICAgICAgICBpZiAoIWxvY2FsZSkge1xuICAgICAgICAgICAgbG9jYWxlID0gdGhpcy5fbG9jYWxlO1xuICAgICAgICAgICAgbGFuZyA9IHRoaXMuX2xhbmc7XG4gICAgICAgICAgICBwbHVyYWxGbiA9IHRoaXMuX3BsdXJhbEZuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGFuZyA9IGdldExhbmcobG9jYWxlKTtcbiAgICAgICAgICAgIHBsdXJhbEZuID0gZ2V0UGx1cmFsRm4obGFuZyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdHJhbnNsYXRpb25zID0gdGhpcy5fdHJhbnNsYXRpb25zW2xvY2FsZV07XG4gICAgICAgIGlmICghdHJhbnNsYXRpb25zKSB7XG4gICAgICAgICAgICBsb2NhbGUgPSB0aGlzLl9maW5kRmFsbGJhY2tMb2NhbGUobG9jYWxlLCBsYW5nKTtcbiAgICAgICAgICAgIGxhbmcgPSBnZXRMYW5nKGxvY2FsZSk7XG4gICAgICAgICAgICBwbHVyYWxGbiA9IGdldFBsdXJhbEZuKGxhbmcpO1xuICAgICAgICAgICAgdHJhbnNsYXRpb25zID0gdGhpcy5fdHJhbnNsYXRpb25zW2xvY2FsZV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHJhbnNsYXRpb25zICYmIHRyYW5zbGF0aW9uc1trZXldICYmIHBsdXJhbEZuKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHBsdXJhbEZuKG4pO1xuICAgICAgICAgICAgcmVzdWx0ID0gdHJhbnNsYXRpb25zW2tleV1baW5kZXhdO1xuXG4gICAgICAgICAgICAvLyBpZiBudWxsIG9yIHVuZGVmaW5lZCBzd2l0Y2ggYmFjayB0byB0aGUga2V5IChlbXB0eSBzdHJpbmcgaXMgYWxsb3dlZClcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwgfHwgcmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBrZXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgbG9jYWxpemF0aW9uIGRhdGEuIElmIHRoZSBsb2NhbGUgYW5kIGtleSBmb3IgYSB0cmFuc2xhdGlvbiBhbHJlYWR5IGV4aXN0cyBpdCB3aWxsIGJlXG4gICAgICogb3ZlcndyaXR0ZW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFRoZSBsb2NhbGl6YXRpb24gZGF0YS4gU2VlIGV4YW1wbGUgZm9yIHRoZSBleHBlY3RlZCBmb3JtYXQgb2YgdGhlXG4gICAgICogZGF0YS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRoaXMuYXBwLmkxOG4uYWRkRGF0YSh7XG4gICAgICogICAgIGhlYWRlcjoge1xuICAgICAqICAgICAgICAgdmVyc2lvbjogMVxuICAgICAqICAgICB9LFxuICAgICAqICAgICBkYXRhOiBbe1xuICAgICAqICAgICAgICAgaW5mbzoge1xuICAgICAqICAgICAgICAgICAgIGxvY2FsZTogJ2VuLVVTJ1xuICAgICAqICAgICAgICAgfSxcbiAgICAgKiAgICAgICAgIG1lc3NhZ2VzOiB7XG4gICAgICogICAgICAgICAgICAgXCJrZXlcIjogXCJ0cmFuc2xhdGlvblwiLFxuICAgICAqICAgICAgICAgICAgIC8vIFRoZSBudW1iZXIgb2YgcGx1cmFsIGZvcm1zIGRlcGVuZHMgb24gdGhlIGxvY2FsZS4gU2VlIHRoZSBtYW51YWwgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAgICogICAgICAgICAgICAgXCJwbHVyYWxfa2V5XCI6IFtcIm9uZSBpdGVtXCIsIFwibW9yZSB0aGFuIG9uZSBpdGVtc1wiXVxuICAgICAqICAgICAgICAgfVxuICAgICAqICAgICB9LCB7XG4gICAgICogICAgICAgICBpbmZvOiB7XG4gICAgICogICAgICAgICAgICAgbG9jYWxlOiAnZnItRlInXG4gICAgICogICAgICAgICB9LFxuICAgICAqICAgICAgICAgbWVzc2FnZXM6IHtcbiAgICAgKiAgICAgICAgICAgICAvLyAuLi5cbiAgICAgKiAgICAgICAgIH1cbiAgICAgKiAgICAgfV1cbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBhZGREYXRhKGRhdGEpIHtcbiAgICAgICAgbGV0IHBhcnNlZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHBhcnNlZCA9IHRoaXMuX3BhcnNlci5wYXJzZShkYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gcGFyc2VkLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9IHBhcnNlZFtpXTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsZSA9IGVudHJ5LmluZm8ubG9jYWxlO1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBlbnRyeS5tZXNzYWdlcztcbiAgICAgICAgICAgIGlmICghdGhpcy5fdHJhbnNsYXRpb25zW2xvY2FsZV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90cmFuc2xhdGlvbnNbbG9jYWxlXSA9IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhbmcgPSBnZXRMYW5nKGxvY2FsZSk7XG5cbiAgICAgICAgICAgICAgICAvLyByZW1lbWJlciB0aGUgZmlyc3QgbG9jYWxlIHdlJ3ZlIGZvdW5kIGZvciB0aGF0IGxhbmd1YWdlXG4gICAgICAgICAgICAgICAgLy8gaW4gY2FzZSB3ZSBuZWVkIHRvIGZhbGwgYmFjayB0byBpdFxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fYXZhaWxhYmxlTGFuZ3NbbGFuZ10pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXZhaWxhYmxlTGFuZ3NbbGFuZ10gPSBsb2NhbGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuX3RyYW5zbGF0aW9uc1tsb2NhbGVdLCBtZXNzYWdlcyk7XG5cbiAgICAgICAgICAgIHRoaXMuZmlyZSgnZGF0YTphZGQnLCBsb2NhbGUsIG1lc3NhZ2VzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgbG9jYWxpemF0aW9uIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFRoZSBsb2NhbGl6YXRpb24gZGF0YS4gVGhlIGRhdGEgaXMgZXhwZWN0ZWQgdG8gYmUgaW4gdGhlIHNhbWUgZm9ybWF0XG4gICAgICogYXMge0BsaW5rIEkxOG4jYWRkRGF0YX0uXG4gICAgICovXG4gICAgcmVtb3ZlRGF0YShkYXRhKSB7XG4gICAgICAgIGxldCBwYXJzZWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYXJzZWQgPSB0aGlzLl9wYXJzZXIucGFyc2UoZGF0YSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhcnNlZC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZW50cnkgPSBwYXJzZWRbaV07XG4gICAgICAgICAgICBjb25zdCBsb2NhbGUgPSBlbnRyeS5pbmZvLmxvY2FsZTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0aW9ucyA9IHRoaXMuX3RyYW5zbGF0aW9uc1tsb2NhbGVdO1xuICAgICAgICAgICAgaWYgKCF0cmFuc2xhdGlvbnMpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IGVudHJ5Lm1lc3NhZ2VzO1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbWVzc2FnZXMpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdHJhbnNsYXRpb25zW2tleV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIG5vIG1vcmUgZW50cmllcyBmb3IgdGhhdCBsb2NhbGUgdGhlblxuICAgICAgICAgICAgLy8gZGVsZXRlIHRoZSBsb2NhbGVcbiAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0cmFuc2xhdGlvbnMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl90cmFuc2xhdGlvbnNbbG9jYWxlXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fYXZhaWxhYmxlTGFuZ3NbZ2V0TGFuZyhsb2NhbGUpXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5maXJlKCdkYXRhOnJlbW92ZScsIGxvY2FsZSwgbWVzc2FnZXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRnJlZXMgdXAgbWVtb3J5LlxuICAgICAqL1xuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuX3RyYW5zbGF0aW9ucyA9IG51bGw7XG4gICAgICAgIHRoaXMuX2F2YWlsYWJsZUxhbmdzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYXNzZXRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcGFyc2VyID0gbnVsbDtcbiAgICAgICAgdGhpcy5vZmYoKTtcbiAgICB9XG5cbiAgICAvLyBGaW5kcyBhIGZhbGxiYWNrIGxvY2FsZSBmb3IgdGhlIHNwZWNpZmllZCBsb2NhbGUgYW5kIGxhbmd1YWdlLlxuICAgIC8vIDEpIEZpcnN0IHRyaWVzIERFRkFVTFRfTE9DQUxFX0ZBTExCQUNLU1xuICAgIC8vIDIpIElmIG5vIHRyYW5zbGF0aW9uIGV4aXN0cyBmb3IgdGhhdCBsb2NhbGUgcmV0dXJuIHRoZSBmaXJzdCBsb2NhbGUgYXZhaWxhYmxlIGZvciB0aGF0IGxhbmd1YWdlLlxuICAgIC8vIDMpIElmIG5vIHRyYW5zbGF0aW9uIGV4aXN0cyBmb3IgdGhhdCBlaXRoZXIgdGhlbiByZXR1cm4gdGhlIERFRkFVTFRfTE9DQUxFXG4gICAgX2ZpbmRGYWxsYmFja0xvY2FsZShsb2NhbGUsIGxhbmcpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IERFRkFVTFRfTE9DQUxFX0ZBTExCQUNLU1tsb2NhbGVdO1xuICAgICAgICBpZiAocmVzdWx0ICYmIHRoaXMuX3RyYW5zbGF0aW9uc1tyZXN1bHRdKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0ID0gREVGQVVMVF9MT0NBTEVfRkFMTEJBQ0tTW2xhbmddO1xuICAgICAgICBpZiAocmVzdWx0ICYmIHRoaXMuX3RyYW5zbGF0aW9uc1tyZXN1bHRdKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0ID0gdGhpcy5fYXZhaWxhYmxlTGFuZ3NbbGFuZ107XG4gICAgICAgIGlmIChyZXN1bHQgJiYgdGhpcy5fdHJhbnNsYXRpb25zW3Jlc3VsdF0pIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gREVGQVVMVF9MT0NBTEU7XG4gICAgfVxuXG4gICAgX29uQXNzZXRBZGQoYXNzZXQpIHtcbiAgICAgICAgYXNzZXQub24oJ2xvYWQnLCB0aGlzLl9vbkFzc2V0TG9hZCwgdGhpcyk7XG4gICAgICAgIGFzc2V0Lm9uKCdjaGFuZ2UnLCB0aGlzLl9vbkFzc2V0Q2hhbmdlLCB0aGlzKTtcbiAgICAgICAgYXNzZXQub24oJ3JlbW92ZScsIHRoaXMuX29uQXNzZXRSZW1vdmUsIHRoaXMpO1xuICAgICAgICBhc3NldC5vbigndW5sb2FkJywgdGhpcy5fb25Bc3NldFVubG9hZCwgdGhpcyk7XG5cbiAgICAgICAgaWYgKGFzc2V0LnJlc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9vbkFzc2V0TG9hZChhc3NldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25Bc3NldExvYWQoYXNzZXQpIHtcbiAgICAgICAgdGhpcy5hZGREYXRhKGFzc2V0LnJlc291cmNlKTtcbiAgICB9XG5cbiAgICBfb25Bc3NldENoYW5nZShhc3NldCkge1xuICAgICAgICBpZiAoYXNzZXQucmVzb3VyY2UpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRGF0YShhc3NldC5yZXNvdXJjZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25Bc3NldFJlbW92ZShhc3NldCkge1xuICAgICAgICBhc3NldC5vZmYoJ2xvYWQnLCB0aGlzLl9vbkFzc2V0TG9hZCwgdGhpcyk7XG4gICAgICAgIGFzc2V0Lm9mZignY2hhbmdlJywgdGhpcy5fb25Bc3NldENoYW5nZSwgdGhpcyk7XG4gICAgICAgIGFzc2V0Lm9mZigncmVtb3ZlJywgdGhpcy5fb25Bc3NldFJlbW92ZSwgdGhpcyk7XG4gICAgICAgIGFzc2V0Lm9mZigndW5sb2FkJywgdGhpcy5fb25Bc3NldFVubG9hZCwgdGhpcyk7XG5cbiAgICAgICAgaWYgKGFzc2V0LnJlc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZURhdGEoYXNzZXQucmVzb3VyY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYXBwLmFzc2V0cy5vbmNlKCdhZGQ6JyArIGFzc2V0LmlkLCB0aGlzLl9vbkFzc2V0QWRkLCB0aGlzKTtcbiAgICB9XG5cbiAgICBfb25Bc3NldFVubG9hZChhc3NldCkge1xuICAgICAgICBpZiAoYXNzZXQucmVzb3VyY2UpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRGF0YShhc3NldC5yZXNvdXJjZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IEkxOG4gfTtcbiJdLCJuYW1lcyI6WyJJMThuIiwiRXZlbnRIYW5kbGVyIiwiY29uc3RydWN0b3IiLCJhcHAiLCJsb2NhbGUiLCJERUZBVUxUX0xPQ0FMRSIsIl90cmFuc2xhdGlvbnMiLCJfYXZhaWxhYmxlTGFuZ3MiLCJfYXBwIiwiX2Fzc2V0cyIsIl9wYXJzZXIiLCJJMThuUGFyc2VyIiwiYXNzZXRzIiwidmFsdWUiLCJpbmRleCIsImkiLCJsZW4iLCJsZW5ndGgiLCJpZCIsIkFzc2V0Iiwib2ZmIiwiX29uQXNzZXRBZGQiLCJhc3NldCIsImdldCIsIl9vbkFzc2V0UmVtb3ZlIiwic3BsaWNlIiwiaWROdW0iLCJwYXJzZUludCIsImluZGV4T2YiLCJwdXNoIiwib25jZSIsIl9sb2NhbGUiLCJsYW5nIiwiZ2V0TGFuZyIsInJlcGxhY2VMYW5nIiwib2xkIiwiX2xhbmciLCJfcGx1cmFsRm4iLCJnZXRQbHVyYWxGbiIsImZpcmUiLCJmaW5kQXZhaWxhYmxlTG9jYWxlIiwiZGVzaXJlZExvY2FsZSIsImF2YWlsYWJsZUxvY2FsZXMiLCJfZmluZEZhbGxiYWNrTG9jYWxlIiwiZ2V0VGV4dCIsImtleSIsInJlc3VsdCIsInRyYW5zbGF0aW9ucyIsImhhc093blByb3BlcnR5IiwiQXJyYXkiLCJpc0FycmF5IiwidW5kZWZpbmVkIiwiZ2V0UGx1cmFsVGV4dCIsIm4iLCJwbHVyYWxGbiIsImFkZERhdGEiLCJkYXRhIiwicGFyc2VkIiwicGFyc2UiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJlbnRyeSIsImluZm8iLCJtZXNzYWdlcyIsIk9iamVjdCIsImFzc2lnbiIsInJlbW92ZURhdGEiLCJrZXlzIiwiZGVzdHJveSIsIkRFRkFVTFRfTE9DQUxFX0ZBTExCQUNLUyIsIm9uIiwiX29uQXNzZXRMb2FkIiwiX29uQXNzZXRDaGFuZ2UiLCJfb25Bc3Nl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
