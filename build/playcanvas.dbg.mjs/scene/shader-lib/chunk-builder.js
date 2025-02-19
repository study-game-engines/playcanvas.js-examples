/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (DEBUG PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
// helper class for combining shader chunks together
// ensures every chunk ends with a new line otherwise shaders can be ill-formed
class ChunkBuilder {
  constructor() {
    this.code = '';
  }
  append(...chunks) {
    chunks.forEach(chunk => {
      if (chunk.endsWith('\n')) {
        this.code += chunk;
      } else {
        this.code += chunk + '\n';
      }
    });
  }
  prepend(...chunks) {
    chunks.forEach(chunk => {
      if (chunk.endsWith('\n')) {
        this.code = chunk + this.code;
      } else {
        this.code = chunk + '\n' + this.code;
      }
    });
  }
}

export { ChunkBuilder };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2h1bmstYnVpbGRlci5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjZW5lL3NoYWRlci1saWIvY2h1bmstYnVpbGRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBoZWxwZXIgY2xhc3MgZm9yIGNvbWJpbmluZyBzaGFkZXIgY2h1bmtzIHRvZ2V0aGVyXG4vLyBlbnN1cmVzIGV2ZXJ5IGNodW5rIGVuZHMgd2l0aCBhIG5ldyBsaW5lIG90aGVyd2lzZSBzaGFkZXJzIGNhbiBiZSBpbGwtZm9ybWVkXG5jbGFzcyBDaHVua0J1aWxkZXIge1xuICAgIGNvZGUgPSAnJztcblxuICAgIGFwcGVuZCguLi5jaHVua3MpIHtcbiAgICAgICAgY2h1bmtzLmZvckVhY2goKGNodW5rKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2h1bmsuZW5kc1dpdGgoJ1xcbicpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2RlICs9IGNodW5rO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvZGUgKz0gY2h1bmsgKyAnXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJlcGVuZCguLi5jaHVua3MpIHtcbiAgICAgICAgY2h1bmtzLmZvckVhY2goKGNodW5rKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2h1bmsuZW5kc1dpdGgoJ1xcbicpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2RlID0gY2h1bmsgKyB0aGlzLmNvZGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY29kZSA9IGNodW5rICsgJ1xcbicgKyB0aGlzLmNvZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ2h1bmtCdWlsZGVyIH07XG4iXSwibmFtZXMiOlsiQ2h1bmtCdWlsZGVyIiwiY29uc3RydWN0b3IiLCJjb2RlIiwiYXBwZW5kIiwiY2h1bmtzIiwiZm9yRWFjaCIsImNodW5rIiwiZW5kc1dpdGgiLCJwcmVwZW5kIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFBO0FBQ0E7QUFDQSxNQUFNQSxZQUFZLENBQUM7RUFBQUMsV0FBQSxHQUFBO0lBQUEsSUFDZkMsQ0FBQUEsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUFBLEdBQUE7RUFFVEMsTUFBTUEsQ0FBQyxHQUFHQyxNQUFNLEVBQUU7QUFDZEEsSUFBQUEsTUFBTSxDQUFDQyxPQUFPLENBQUVDLEtBQUssSUFBSztBQUN0QixNQUFBLElBQUlBLEtBQUssQ0FBQ0MsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3RCLElBQUksQ0FBQ0wsSUFBSSxJQUFJSSxLQUFLLENBQUE7QUFDdEIsT0FBQyxNQUFNO0FBQ0gsUUFBQSxJQUFJLENBQUNKLElBQUksSUFBSUksS0FBSyxHQUFHLElBQUksQ0FBQTtBQUM3QixPQUFBO0FBQ0osS0FBQyxDQUFDLENBQUE7QUFDTixHQUFBO0VBRUFFLE9BQU9BLENBQUMsR0FBR0osTUFBTSxFQUFFO0FBQ2ZBLElBQUFBLE1BQU0sQ0FBQ0MsT0FBTyxDQUFFQyxLQUFLLElBQUs7QUFDdEIsTUFBQSxJQUFJQSxLQUFLLENBQUNDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN0QixRQUFBLElBQUksQ0FBQ0wsSUFBSSxHQUFHSSxLQUFLLEdBQUcsSUFBSSxDQUFDSixJQUFJLENBQUE7QUFDakMsT0FBQyxNQUFNO1FBQ0gsSUFBSSxDQUFDQSxJQUFJLEdBQUdJLEtBQUssR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDSixJQUFJLENBQUE7QUFDeEMsT0FBQTtBQUNKLEtBQUMsQ0FBQyxDQUFBO0FBQ04sR0FBQTtBQUNKOzs7OyJ9
