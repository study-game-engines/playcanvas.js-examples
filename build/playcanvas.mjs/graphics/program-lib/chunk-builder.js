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
