/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
class TagsCache {
  constructor(key = null) {
    this._index = {};
    this._key = void 0;
    this._key = key;
  }
  addItem(item) {
    const tags = item.tags._list;
    for (const tag of tags) this.add(tag, item);
  }
  removeItem(item) {
    const tags = item.tags._list;
    for (const tag of tags) this.remove(tag, item);
  }
  add(tag, item) {
    // already in cache
    if (this._index[tag] && this._index[tag].list.indexOf(item) !== -1) return;

    // create index for tag
    if (!this._index[tag]) {
      this._index[tag] = {
        list: []
      };
      // key indexing is available
      if (this._key) this._index[tag].keys = {};
    }

    // add to index list
    this._index[tag].list.push(item);

    // add to index keys
    if (this._key) this._index[tag].keys[item[this._key]] = item;
  }
  remove(tag, item) {
    // no index created for that tag
    if (!this._index[tag]) return;

    // check if item not in cache
    if (this._key) {
      // by key
      if (!this._index[tag].keys[item[this._key]]) return;
    }

    // by position in list
    const ind = this._index[tag].list.indexOf(item);
    if (ind === -1) return;

    // remove item from index list
    this._index[tag].list.splice(ind, 1);

    // remove item from index keys
    if (this._key) delete this._index[tag].keys[item[this._key]];

    // if index empty, remove it
    if (this._index[tag].list.length === 0) delete this._index[tag];
  }
  find(args) {
    const index = {};
    const items = [];
    let item, tag, tags, tagsRest, missingIndex;
    const sort = (a, b) => {
      return this._index[a].list.length - this._index[b].list.length;
    };
    for (let i = 0; i < args.length; i++) {
      tag = args[i];
      if (tag instanceof Array) {
        if (tag.length === 0) continue;
        if (tag.length === 1) {
          tag = tag[0];
        } else {
          // check if all indexes are in present
          missingIndex = false;
          for (let t = 0; t < tag.length; t++) {
            if (!this._index[tag[t]]) {
              missingIndex = true;
              break;
            }
          }
          if (missingIndex) continue;

          // sort tags by least number of matches first
          tags = tag.slice(0).sort(sort);

          // remainder of tags for `has` checks
          tagsRest = tags.slice(1);
          if (tagsRest.length === 1) tagsRest = tagsRest[0];
          for (let n = 0; n < this._index[tags[0]].list.length; n++) {
            item = this._index[tags[0]].list[n];
            if ((this._key ? !index[item[this._key]] : items.indexOf(item) === -1) && item.tags.has(tagsRest)) {
              if (this._key) index[item[this._key]] = true;
              items.push(item);
            }
          }
          continue;
        }
      }
      if (tag && typeof tag === 'string' && this._index[tag]) {
        for (let n = 0; n < this._index[tag].list.length; n++) {
          item = this._index[tag].list[n];
          if (this._key) {
            if (!index[item[this._key]]) {
              index[item[this._key]] = true;
              items.push(item);
            }
          } else if (items.indexOf(item) === -1) {
            items.push(item);
          }
        }
      }
    }
    return items;
  }
}

export { TagsCache };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFncy1jYWNoZS5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvdGFncy1jYWNoZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBUYWdzQ2FjaGUge1xuICAgIF9pbmRleCA9IHt9O1xuXG4gICAgX2tleTtcblxuICAgIGNvbnN0cnVjdG9yKGtleSA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fa2V5ID0ga2V5O1xuICAgIH1cblxuICAgIGFkZEl0ZW0oaXRlbSkge1xuICAgICAgICBjb25zdCB0YWdzID0gaXRlbS50YWdzLl9saXN0O1xuXG4gICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRhZ3MpXG4gICAgICAgICAgICB0aGlzLmFkZCh0YWcsIGl0ZW0pO1xuICAgIH1cblxuICAgIHJlbW92ZUl0ZW0oaXRlbSkge1xuICAgICAgICBjb25zdCB0YWdzID0gaXRlbS50YWdzLl9saXN0O1xuXG4gICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRhZ3MpXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSh0YWcsIGl0ZW0pO1xuICAgIH1cblxuICAgIGFkZCh0YWcsIGl0ZW0pIHtcbiAgICAgICAgLy8gYWxyZWFkeSBpbiBjYWNoZVxuICAgICAgICBpZiAodGhpcy5faW5kZXhbdGFnXSAmJiB0aGlzLl9pbmRleFt0YWddLmxpc3QuaW5kZXhPZihpdGVtKSAhPT0gLTEpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgLy8gY3JlYXRlIGluZGV4IGZvciB0YWdcbiAgICAgICAgaWYgKCF0aGlzLl9pbmRleFt0YWddKSB7XG4gICAgICAgICAgICB0aGlzLl9pbmRleFt0YWddID0ge1xuICAgICAgICAgICAgICAgIGxpc3Q6IFtdXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8ga2V5IGluZGV4aW5nIGlzIGF2YWlsYWJsZVxuICAgICAgICAgICAgaWYgKHRoaXMuX2tleSlcbiAgICAgICAgICAgICAgICB0aGlzLl9pbmRleFt0YWddLmtleXMgPSB7IH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgdG8gaW5kZXggbGlzdFxuICAgICAgICB0aGlzLl9pbmRleFt0YWddLmxpc3QucHVzaChpdGVtKTtcblxuICAgICAgICAvLyBhZGQgdG8gaW5kZXgga2V5c1xuICAgICAgICBpZiAodGhpcy5fa2V5KVxuICAgICAgICAgICAgdGhpcy5faW5kZXhbdGFnXS5rZXlzW2l0ZW1bdGhpcy5fa2V5XV0gPSBpdGVtO1xuICAgIH1cblxuICAgIHJlbW92ZSh0YWcsIGl0ZW0pIHtcbiAgICAgICAgLy8gbm8gaW5kZXggY3JlYXRlZCBmb3IgdGhhdCB0YWdcbiAgICAgICAgaWYgKCF0aGlzLl9pbmRleFt0YWddKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIGl0ZW0gbm90IGluIGNhY2hlXG4gICAgICAgIGlmICh0aGlzLl9rZXkpIHtcbiAgICAgICAgICAgIC8vIGJ5IGtleVxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbmRleFt0YWddLmtleXNbaXRlbVt0aGlzLl9rZXldXSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBieSBwb3NpdGlvbiBpbiBsaXN0XG4gICAgICAgIGNvbnN0IGluZCA9IHRoaXMuX2luZGV4W3RhZ10ubGlzdC5pbmRleE9mKGl0ZW0pO1xuICAgICAgICBpZiAoaW5kID09PSAtMSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvLyByZW1vdmUgaXRlbSBmcm9tIGluZGV4IGxpc3RcbiAgICAgICAgdGhpcy5faW5kZXhbdGFnXS5saXN0LnNwbGljZShpbmQsIDEpO1xuXG4gICAgICAgIC8vIHJlbW92ZSBpdGVtIGZyb20gaW5kZXgga2V5c1xuICAgICAgICBpZiAodGhpcy5fa2V5KVxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2luZGV4W3RhZ10ua2V5c1tpdGVtW3RoaXMuX2tleV1dO1xuXG4gICAgICAgIC8vIGlmIGluZGV4IGVtcHR5LCByZW1vdmUgaXRcbiAgICAgICAgaWYgKHRoaXMuX2luZGV4W3RhZ10ubGlzdC5sZW5ndGggPT09IDApXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5faW5kZXhbdGFnXTtcbiAgICB9XG5cbiAgICBmaW5kKGFyZ3MpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB7IH07XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gW107XG4gICAgICAgIGxldCBpdGVtLCB0YWcsIHRhZ3MsIHRhZ3NSZXN0LCBtaXNzaW5nSW5kZXg7XG5cbiAgICAgICAgY29uc3Qgc29ydCA9IChhLCBiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5kZXhbYV0ubGlzdC5sZW5ndGggLSB0aGlzLl9pbmRleFtiXS5saXN0Lmxlbmd0aDtcbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRhZyA9IGFyZ3NbaV07XG5cbiAgICAgICAgICAgIGlmICh0YWcgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIGlmICh0YWcubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIGlmICh0YWcubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZyA9IHRhZ1swXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgaW5kZXhlcyBhcmUgaW4gcHJlc2VudFxuICAgICAgICAgICAgICAgICAgICBtaXNzaW5nSW5kZXggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgdCA9IDA7IHQgPCB0YWcubGVuZ3RoOyB0KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5faW5kZXhbdGFnW3RdXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pc3NpbmdJbmRleCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pc3NpbmdJbmRleClcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvcnQgdGFncyBieSBsZWFzdCBudW1iZXIgb2YgbWF0Y2hlcyBmaXJzdFxuICAgICAgICAgICAgICAgICAgICB0YWdzID0gdGFnLnNsaWNlKDApLnNvcnQoc29ydCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtYWluZGVyIG9mIHRhZ3MgZm9yIGBoYXNgIGNoZWNrc1xuICAgICAgICAgICAgICAgICAgICB0YWdzUmVzdCA9IHRhZ3Muc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YWdzUmVzdC5sZW5ndGggPT09IDEpXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdzUmVzdCA9IHRhZ3NSZXN0WzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG4gPSAwOyBuIDwgdGhpcy5faW5kZXhbdGFnc1swXV0ubGlzdC5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHRoaXMuX2luZGV4W3RhZ3NbMF1dLmxpc3Rbbl07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHRoaXMuX2tleSA/ICFpbmRleFtpdGVtW3RoaXMuX2tleV1dIDogKGl0ZW1zLmluZGV4T2YoaXRlbSkgPT09IC0xKSkgJiYgaXRlbS50YWdzLmhhcyh0YWdzUmVzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fa2V5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFtpdGVtW3RoaXMuX2tleV1dID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFnICYmIHR5cGVvZiB0YWcgPT09ICdzdHJpbmcnICYmIHRoaXMuX2luZGV4W3RhZ10pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBuID0gMDsgbiA8IHRoaXMuX2luZGV4W3RhZ10ubGlzdC5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBpdGVtID0gdGhpcy5faW5kZXhbdGFnXS5saXN0W25dO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW5kZXhbaXRlbVt0aGlzLl9rZXldXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4W2l0ZW1bdGhpcy5fa2V5XV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbXMuaW5kZXhPZihpdGVtKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgfVxufVxuXG5leHBvcnQgeyBUYWdzQ2FjaGUgfTtcbiJdLCJuYW1lcyI6WyJUYWdzQ2FjaGUiLCJjb25zdHJ1Y3RvciIsImtleSIsIl9pbmRleCIsIl9rZXkiLCJhZGRJdGVtIiwiaXRlbSIsInRhZ3MiLCJfbGlzdCIsInRhZyIsImFkZCIsInJlbW92ZUl0ZW0iLCJyZW1vdmUiLCJsaXN0IiwiaW5kZXhPZiIsImtleXMiLCJwdXNoIiwiaW5kIiwic3BsaWNlIiwibGVuZ3RoIiwiZmluZCIsImFyZ3MiLCJpbmRleCIsIml0ZW1zIiwidGFnc1Jlc3QiLCJtaXNzaW5nSW5kZXgiLCJzb3J0IiwiYSIsImIiLCJpIiwiQXJyYXkiLCJ0Iiwic2xpY2UiLCJuIiwiaGFzIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFBLE1BQU1BLFNBQVMsQ0FBQztBQUtaQyxFQUFBQSxXQUFXQSxDQUFDQyxHQUFHLEdBQUcsSUFBSSxFQUFFO0lBQUEsSUFKeEJDLENBQUFBLE1BQU0sR0FBRyxFQUFFLENBQUE7QUFBQSxJQUFBLElBQUEsQ0FFWEMsSUFBSSxHQUFBLEtBQUEsQ0FBQSxDQUFBO0lBR0EsSUFBSSxDQUFDQSxJQUFJLEdBQUdGLEdBQUcsQ0FBQTtBQUNuQixHQUFBO0VBRUFHLE9BQU9BLENBQUNDLElBQUksRUFBRTtBQUNWLElBQUEsTUFBTUMsSUFBSSxHQUFHRCxJQUFJLENBQUNDLElBQUksQ0FBQ0MsS0FBSyxDQUFBO0FBRTVCLElBQUEsS0FBSyxNQUFNQyxHQUFHLElBQUlGLElBQUksRUFDbEIsSUFBSSxDQUFDRyxHQUFHLENBQUNELEdBQUcsRUFBRUgsSUFBSSxDQUFDLENBQUE7QUFDM0IsR0FBQTtFQUVBSyxVQUFVQSxDQUFDTCxJQUFJLEVBQUU7QUFDYixJQUFBLE1BQU1DLElBQUksR0FBR0QsSUFBSSxDQUFDQyxJQUFJLENBQUNDLEtBQUssQ0FBQTtBQUU1QixJQUFBLEtBQUssTUFBTUMsR0FBRyxJQUFJRixJQUFJLEVBQ2xCLElBQUksQ0FBQ0ssTUFBTSxDQUFDSCxHQUFHLEVBQUVILElBQUksQ0FBQyxDQUFBO0FBQzlCLEdBQUE7QUFFQUksRUFBQUEsR0FBR0EsQ0FBQ0QsR0FBRyxFQUFFSCxJQUFJLEVBQUU7QUFDWDtJQUNBLElBQUksSUFBSSxDQUFDSCxNQUFNLENBQUNNLEdBQUcsQ0FBQyxJ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
