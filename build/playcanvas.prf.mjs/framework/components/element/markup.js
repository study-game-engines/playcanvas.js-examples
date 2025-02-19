/**
 * @license
 * PlayCanvas Engine v1.63.0-dev revision 9f3635a4e (PROFILER)
 * Copyright 2011-2023 PlayCanvas Ltd. All rights reserved.
 */
const EOF_TOKEN = 0;
const ERROR_TOKEN = 1;
const TEXT_TOKEN = 2;
const OPEN_BRACKET_TOKEN = 3;
const CLOSE_BRACKET_TOKEN = 4;
const EQUALS_TOKEN = 5;
const STRING_TOKEN = 6;
const IDENTIFIER_TOKEN = 7;
const WHITESPACE_TOKEN = 8;
const WHITESPACE_CHARS = ' \t\n\r\v\f';
const IDENTIFIER_REGEX = /[A-Z|a-z|0-9|_|-|/]/;
class Scanner {
	constructor(symbols) {
		this._symbols = symbols;
		this._index = 0;
		this._last = 0;
		this._cur = this._symbols.length > 0 ? this._symbols[0] : null;
		this._buf = [];
		this._mode = 'text';
		this._error = null;
	}
	read() {
		let token = this._read();
		while (token === WHITESPACE_TOKEN) {
			token = this._read();
		}
		if (token !== EOF_TOKEN && token !== ERROR_TOKEN) {
			this._last = this._index;
		}
		return token;
	}
	buf() {
		return this._buf;
	}
	last() {
		return this._last;
	}
	error() {
		return this._error;
	}
	debugPrint() {
		const tokenStrings = ['EOF', 'ERROR', 'TEXT', 'OPEN_BRACKET', 'CLOSE_BRACKET', 'EQUALS', 'STRING', 'IDENTIFIER', 'WHITESPACE'];
		let token = this.read();
		let result = '';
		while (true) {
			result += (result.length > 0 ? '\n' : '') + tokenStrings[token] + ' \'' + this.buf().join('') + '\'';
			if (token === EOF_TOKEN || token === ERROR_TOKEN) {
				break;
			}
			token = this.read();
		}
		return result;
	}
	_read() {
		this._buf = [];
		if (this._eof()) {
			return EOF_TOKEN;
		}
		return this._mode === 'text' ? this._text() : this._tag();
	}
	_text() {
		while (true) {
			switch (this._cur) {
				case null:
					return this._buf.length > 0 ? TEXT_TOKEN : EOF_TOKEN;
				case '[':
					this._mode = 'tag';
					return this._buf.length > 0 ? TEXT_TOKEN : this._tag();
				case '\\':
					this._next();
					switch (this._cur) {
						case '[':
							this._store();
							break;
						default:
							this._output('\\');
							break;
					}
					break;
				default:
					this._store();
					break;
			}
		}
	}
	_tag() {
		switch (this._cur) {
			case null:
				this._error = 'unexpected end of input reading tag';
				return ERROR_TOKEN;
			case '[':
				this._store();
				return OPEN_BRACKET_TOKEN;
			case ']':
				this._store();
				this._mode = 'text';
				return CLOSE_BRACKET_TOKEN;
			case '=':
				this._store();
				return EQUALS_TOKEN;
			case ' ':
			case '\t':
			case '\n':
			case '\r':
			case '\v':
			case '\f':
				return this._whitespace();
			case '"':
				return this._string();
			default:
				if (!this._isIdentifierSymbol(this._cur)) {
					this._error = 'unrecognized character';
					return ERROR_TOKEN;
				}
				return this._identifier();
		}
	}
	_whitespace() {
		this._store();
		while (WHITESPACE_CHARS.indexOf(this._cur) !== -1) {
			this._store();
		}
		return WHITESPACE_TOKEN;
	}
	_string() {
		this._next();
		while (true) {
			switch (this._cur) {
				case null:
					this._error = 'unexpected end of input reading string';
					return ERROR_TOKEN;
				case '"':
					this._next();
					return STRING_TOKEN;
				default:
					this._store();
					break;
			}
		}
	}
	_identifier() {
		this._store();
		while (this._cur !== null && this._isIdentifierSymbol(this._cur)) {
			this._store();
		}
		return IDENTIFIER_TOKEN;
	}
	_isIdentifierSymbol(s) {
		return s.length === 1 && s.match(IDENTIFIER_REGEX) !== null;
	}
	_eof() {
		return this._cur === null;
	}
	_next() {
		if (!this._eof()) {
			this._index++;
			this._cur = this._index < this._symbols.length ? this._symbols[this._index] : null;
		}
		return this._cur;
	}
	_store() {
		this._buf.push(this._cur);
		return this._next();
	}
	_output(c) {
		this._buf.push(c);
	}
}
class Parser {
	constructor(symbols) {
		this._scanner = new Scanner(symbols);
		this._error = null;
	}
	parse(symbols, tags) {
		while (true) {
			const token = this._scanner.read();
			switch (token) {
				case EOF_TOKEN:
					return true;
				case ERROR_TOKEN:
					return false;
				case TEXT_TOKEN:
					Array.prototype.push.apply(symbols, this._scanner.buf());
					break;
				case OPEN_BRACKET_TOKEN:
					if (!this._parseTag(symbols, tags)) {
						return false;
					}
					break;
				default:
					return false;
			}
		}
	}
	error() {
		return 'Error evaluating markup at #' + this._scanner.last().toString() + ' (' + (this._scanner.error() || this._error) + ')';
	}
	_parseTag(symbols, tags) {
		let token = this._scanner.read();
		if (token !== IDENTIFIER_TOKEN) {
			this._error = 'expected identifier';
			return false;
		}
		const name = this._scanner.buf().join('');
		if (name[0] === '/') {
			for (let index = tags.length - 1; index >= 0; --index) {
				if (name === '/' + tags[index].name && tags[index].end === null) {
					tags[index].end = symbols.length;
					token = this._scanner.read();
					if (token !== CLOSE_BRACKET_TOKEN) {
						this._error = 'expected close bracket';
						return false;
					}
					return true;
				}
			}
			this._error = 'failed to find matching tag';
			return false;
		}
		const tag = {
			name: name,
			value: null,
			attributes: {},
			start: symbols.length,
			end: null
		};
		token = this._scanner.read();
		if (token === EQUALS_TOKEN) {
			token = this._scanner.read();
			if (token !== STRING_TOKEN) {
				this._error = 'expected string';
				return false;
			}
			tag.value = this._scanner.buf().join('');
			token = this._scanner.read();
		}
		while (true) {
			switch (token) {
				case CLOSE_BRACKET_TOKEN:
					tags.push(tag);
					return true;
				case IDENTIFIER_TOKEN:
					{
						const identifier = this._scanner.buf().join('');
						token = this._scanner.read();
						if (token !== EQUALS_TOKEN) {
							this._error = 'expected equals';
							return false;
						}
						token = this._scanner.read();
						if (token !== STRING_TOKEN) {
							this._error = 'expected string';
							return false;
						}
						const value = this._scanner.buf().join('');
						tag.attributes[identifier] = value;
						break;
					}
				default:
					this._error = 'expected close bracket or identifier';
					return false;
			}
			token = this._scanner.read();
		}
	}
}
function merge(target, source) {
	for (const key in source) {
		if (!source.hasOwnProperty(key)) {
			continue;
		}
		const value = source[key];
		if (value instanceof Object) {
			if (!target.hasOwnProperty(key)) {
				target[key] = {};
			}
			merge(target[key], source[key]);
		} else {
			target[key] = value;
		}
	}
}
function combineTags(tags) {
	if (tags.length === 0) {
		return null;
	}
	const result = {};
	for (let index = 0; index < tags.length; ++index) {
		const tag = tags[index];
		const tmp = {};
		tmp[tag.name] = {
			value: tag.value,
			attributes: tag.attributes
		};
		merge(result, tmp);
	}
	return result;
}
function resolveMarkupTags(tags, numSymbols) {
	if (tags.length === 0) {
		return null;
	}
	const edges = {};
	for (let index = 0; index < tags.length; ++index) {
		const tag = tags[index];
		if (!edges.hasOwnProperty(tag.start)) {
			edges[tag.start] = {
				open: [tag],
				close: null
			};
		} else {
			if (edges[tag.start].open === null) {
				edges[tag.start].open = [tag];
			} else {
				edges[tag.start].open.push(tag);
			}
		}
		if (!edges.hasOwnProperty(tag.end)) {
			edges[tag.end] = {
				open: null,
				close: [tag]
			};
		} else {
			if (edges[tag.end].close === null) {
				edges[tag.end].close = [tag];
			} else {
				edges[tag.end].close.push(tag);
			}
		}
	}
	let tagStack = [];
	function removeTags(tags) {
		tagStack = tagStack.filter(function (tag) {
			return tags.find(function (t) {
				return t === tag;
			}) === undefined;
		});
	}
	function addTags(tags) {
		for (let index = 0; index < tags.length; ++index) {
			tagStack.push(tags[index]);
		}
	}
	const edgeKeys = Object.keys(edges).sort(function (a, b) {
		return a - b;
	});
	const resolvedTags = [];
	for (let index = 0; index < edgeKeys.length; ++index) {
		const edge = edges[edgeKeys[index]];
		if (edge.close !== null) {
			removeTags(edge.close);
		}
		if (edge.open !== null) {
			addTags(edge.open);
		}
		resolvedTags.push({
			start: edgeKeys[index],
			tags: combineTags(tagStack)
		});
	}
	const result = [];
	let prevTag = null;
	for (let index = 0; index < resolvedTags.length; ++index) {
		const resolvedTag = resolvedTags[index];
		while (result.length < resolvedTag.start) {
			result.push(prevTag ? prevTag.tags : null);
		}
		prevTag = resolvedTag;
	}
	while (result.length < numSymbols) {
		result.push(null);
	}
	return result;
}
function evaluateMarkup(symbols) {
	const parser = new Parser(symbols);
	const stripped_symbols = [];
	const tags = [];
	if (!parser.parse(stripped_symbols, tags)) {
		console.warn(parser.error());
		return {
			symbols: symbols,
			tags: null
		};
	}
	const invalidTag = tags.find(function (t) {
		return t.end === null;
	});
	if (invalidTag) {
		console.warn(`Markup error: found unclosed tag='${invalidTag.name}'`);
		return {
			symbols: symbols,
			tags: null
		};
	}
	const resolved_tags = resolveMarkupTags(tags, stripped_symbols.length);
	return {
		symbols: stripped_symbols,
		tags: resolved_tags
	};
}
class Markup {
	static evaluate(symbols) {
		return evaluateMarkup(symbols);
	}
}

export { Markup };
