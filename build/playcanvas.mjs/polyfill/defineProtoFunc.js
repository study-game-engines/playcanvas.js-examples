function defineProtoFunc(cls, name, func) {
	if (!cls.prototype[name]) {
		Object.defineProperty(cls.prototype, name, {
			value: func,
			configurable: true,
			enumerable: false,
			writable: true
		});
	}
}

export { defineProtoFunc };
