/**
 * @license
 * PlayCanvas Engine v1.58.0-dev revision e102f2b2a (PROFILER)
 * Copyright 2011-2022 PlayCanvas Ltd. All rights reserved.
 */
class AssetFile {
  constructor(url, filename, hash, size, opt, contents) {
    this.url = url || '';
    this.filename = filename || '';
    this.hash = hash === undefined ? null : hash;
    this.size = size === undefined ? null : size;
    this.opt = opt === undefined ? null : opt;
    this.contents = contents || null;
  }

  equals(other) {
    return this.url === other.url && this.filename === other.filename && this.hash === other.hash && this.size === other.size && this.opt === other.opt && this.contents === other.contents;
  }

}

export { AssetFile };
