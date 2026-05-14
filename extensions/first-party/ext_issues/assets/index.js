//#region node_modules/.bun/@vue+shared@3.5.34/node_modules/@vue/shared/dist/shared.esm-bundler.js
/* @__NO_SIDE_EFFECTS__ */
function e(e) {
	let t = /* @__PURE__ */ Object.create(null);
	for (let n of e.split(",")) t[n] = 1;
	return (e) => e in t;
}
var t = {}, n = [], r = () => {}, i = () => !1, a = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), o = (e) => e.startsWith("onUpdate:"), s = Object.assign, c = (e, t) => {
	let n = e.indexOf(t);
	n > -1 && e.splice(n, 1);
}, l = Object.prototype.hasOwnProperty, u = (e, t) => l.call(e, t), d = Array.isArray, f = (e) => x(e) === "[object Map]", p = (e) => x(e) === "[object Set]", m = (e) => x(e) === "[object Date]", h = (e) => typeof e == "function", g = (e) => typeof e == "string", _ = (e) => typeof e == "symbol", v = (e) => typeof e == "object" && !!e, y = (e) => (v(e) || h(e)) && h(e.then) && h(e.catch), b = Object.prototype.toString, x = (e) => b.call(e), S = (e) => x(e).slice(8, -1), C = (e) => x(e) === "[object Object]", w = (e) => g(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, ee = /* @__PURE__ */ e(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"), te = (e) => {
	let t = /* @__PURE__ */ Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, ne = /-\w/g, T = te((e) => e.replace(ne, (e) => e.slice(1).toUpperCase())), re = /\B([A-Z])/g, E = te((e) => e.replace(re, "-$1").toLowerCase()), ie = te((e) => e.charAt(0).toUpperCase() + e.slice(1)), ae = te((e) => e ? `on${ie(e)}` : ""), D = (e, t) => !Object.is(e, t), oe = (e, ...t) => {
	for (let n = 0; n < e.length; n++) e[n](...t);
}, O = (e, t, n, r = !1) => {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		writable: r,
		value: n
	});
}, se = (e) => {
	let t = parseFloat(e);
	return isNaN(t) ? e : t;
}, ce = (e) => {
	let t = g(e) ? Number(e) : NaN;
	return isNaN(t) ? e : t;
}, le, ue = () => le ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function de(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = g(r) ? he(r) : de(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (g(e) || v(e)) return e;
}
var fe = /;(?![^(]*\))/g, pe = /:([^]+)/, me = /\/\*[^]*?\*\//g;
function he(e) {
	let t = {};
	return e.replace(me, "").split(fe).forEach((e) => {
		if (e) {
			let n = e.split(pe);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function ge(e) {
	let t = "";
	if (g(e)) t = e;
	else if (d(e)) for (let n = 0; n < e.length; n++) {
		let r = ge(e[n]);
		r && (t += r + " ");
	}
	else if (v(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var _e = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", ve = /* @__PURE__ */ e(_e);
_e + "";
function ye(e) {
	return !!e || e === "";
}
function be(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = xe(e[r], t[r]);
	return n;
}
function xe(e, t) {
	if (e === t) return !0;
	let n = m(e), r = m(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = _(e), r = _(t), n || r) return e === t;
	if (n = d(e), r = d(t), n || r) return n && r ? be(e, t) : !1;
	if (n = v(e), r = v(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !xe(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
function Se(e, t) {
	return e.findIndex((e) => xe(e, t));
}
var Ce = (e) => !!(e && e.__v_isRef === !0), k = (e) => g(e) ? e : e == null ? "" : d(e) || v(e) && (e.toString === b || !h(e.toString)) ? Ce(e) ? k(e.value) : JSON.stringify(e, we, 2) : String(e), we = (e, t) => Ce(t) ? we(e, t.value) : f(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[Te(t, r) + " =>"] = n, e), {}) } : p(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => Te(e)) } : _(t) ? Te(t) : v(t) && !d(t) && !C(t) ? String(t) : t, Te = (e, t = "") => _(e) ? `Symbol(${e.description ?? t})` : e, A, Ee = class {
	constructor(e = !1) {
		this.detached = e, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !e && A && (A.active ? (this.parent = A, this.index = (A.scopes ||= []).push(this) - 1) : (this._active = !1, this._warnOnRun = !1));
	}
	get active() {
		return this._active;
	}
	pause() {
		if (this._active) {
			this._isPaused = !0;
			let e, t;
			if (this.scopes) for (e = 0, t = this.scopes.length; e < t; e++) this.scopes[e].pause();
			for (e = 0, t = this.effects.length; e < t; e++) this.effects[e].pause();
		}
	}
	resume() {
		if (this._active && this._isPaused) {
			this._isPaused = !1;
			let e, t;
			if (this.scopes) for (e = 0, t = this.scopes.length; e < t; e++) this.scopes[e].resume();
			for (e = 0, t = this.effects.length; e < t; e++) this.effects[e].resume();
		}
	}
	run(e) {
		if (this._active) {
			let t = A;
			try {
				return A = this, e();
			} finally {
				A = t;
			}
		}
	}
	on() {
		++this._on === 1 && (this.prevScope = A, A = this);
	}
	off() {
		if (this._on > 0 && --this._on === 0) {
			if (A === this) A = this.prevScope;
			else {
				let e = A;
				for (; e;) {
					if (e.prevScope === this) {
						e.prevScope = this.prevScope;
						break;
					}
					e = e.prevScope;
				}
			}
			this.prevScope = void 0;
		}
	}
	stop(e) {
		if (this._active) {
			this._active = !1;
			let t, n;
			for (t = 0, n = this.effects.length; t < n; t++) this.effects[t].stop();
			for (this.effects.length = 0, t = 0, n = this.cleanups.length; t < n; t++) this.cleanups[t]();
			if (this.cleanups.length = 0, this.scopes) {
				for (t = 0, n = this.scopes.length; t < n; t++) this.scopes[t].stop(!0);
				this.scopes.length = 0;
			}
			if (!this.detached && this.parent && !e) {
				let e = this.parent.scopes.pop();
				e && e !== this && (this.parent.scopes[this.index] = e, e.index = this.index);
			}
			this.parent = void 0;
		}
	}
};
function De() {
	return A;
}
var j, Oe = /* @__PURE__ */ new WeakSet(), ke = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, A && (A.active ? A.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, Oe.has(this) && (Oe.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Ne(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, Ge(this), Ie(this);
		let e = j, t = M;
		j = this, M = !0;
		try {
			return this.fn();
		} finally {
			Le(this), j = e, M = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) Be(e);
			this.deps = this.depsTail = void 0, Ge(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? Oe.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		Re(this) && this.run();
	}
	get dirty() {
		return Re(this);
	}
}, Ae = 0, je, Me;
function Ne(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = Me, Me = e;
		return;
	}
	e.next = je, je = e;
}
function Pe() {
	Ae++;
}
function Fe() {
	if (--Ae > 0) return;
	if (Me) {
		let e = Me;
		for (Me = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; je;) {
		let t = je;
		for (je = void 0; t;) {
			let n = t.next;
			if (t.next = void 0, t.flags &= -9, t.flags & 1) try {
				t.trigger();
			} catch (t) {
				e ||= t;
			}
			t = n;
		}
	}
	if (e) throw e;
}
function Ie(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Le(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), Be(r), Ve(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function Re(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (ze(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function ze(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Ke) || (e.globalVersion = Ke, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Re(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = j, r = M;
	j = e, M = !0;
	try {
		Ie(e);
		let n = e.fn(e._value);
		(t.version === 0 || D(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		j = n, M = r, Le(e), e.flags &= -3;
	}
}
function Be(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) Be(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function Ve(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var M = !0, He = [];
function Ue() {
	He.push(M), M = !1;
}
function We() {
	let e = He.pop();
	M = e === void 0 ? !0 : e;
}
function Ge(e) {
	let { cleanup: t } = e;
	if (e.cleanup = void 0, t) {
		let e = j;
		j = void 0;
		try {
			t();
		} finally {
			j = e;
		}
	}
}
var Ke = 0, qe = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, Je = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!j || !M || j === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== j) t = this.activeLink = new qe(j, this), j.deps ? (t.prevDep = j.depsTail, j.depsTail.nextDep = t, j.depsTail = t) : j.deps = j.depsTail = t, Ye(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = j.depsTail, t.nextDep = void 0, j.depsTail.nextDep = t, j.depsTail = t, j.deps === t && (j.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, Ke++, this.notify(e);
	}
	notify(e) {
		Pe();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			Fe();
		}
	}
};
function Ye(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) Ye(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var Xe = /* @__PURE__ */ new WeakMap(), Ze = /* @__PURE__ */ Symbol(""), Qe = /* @__PURE__ */ Symbol(""), $e = /* @__PURE__ */ Symbol("");
function N(e, t, n) {
	if (M && j) {
		let t = Xe.get(e);
		t || Xe.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new Je()), r.map = t, r.key = n), r.track();
	}
}
function et(e, t, n, r, i, a) {
	let o = Xe.get(e);
	if (!o) {
		Ke++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (Pe(), t === "clear") o.forEach(s);
	else {
		let i = d(e), a = i && w(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === $e || !_(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get($e)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(Ze)), f(e) && s(o.get(Qe)));
				break;
			case "delete":
				i || (s(o.get(Ze)), f(e) && s(o.get(Qe)));
				break;
			case "set":
				f(e) && s(o.get(Ze));
				break;
		}
	}
	Fe();
}
function tt(e) {
	let t = /* @__PURE__ */ F(e);
	return t === e ? t : (N(t, "iterate", $e), /* @__PURE__ */ P(e) ? t : t.map(I));
}
function nt(e) {
	return N(e = /* @__PURE__ */ F(e), "iterate", $e), e;
}
function rt(e, t) {
	return /* @__PURE__ */ Bt(e) ? Ut(/* @__PURE__ */ zt(e) ? I(t) : t) : I(t);
}
var it = {
	__proto__: null,
	[Symbol.iterator]() {
		return at(this, Symbol.iterator, (e) => rt(this, e));
	},
	concat(...e) {
		return tt(this).concat(...e.map((e) => d(e) ? tt(e) : e));
	},
	entries() {
		return at(this, "entries", (e) => (e[1] = rt(this, e[1]), e));
	},
	every(e, t) {
		return st(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return st(this, "filter", e, t, (e) => e.map((e) => rt(this, e)), arguments);
	},
	find(e, t) {
		return st(this, "find", e, t, (e) => rt(this, e), arguments);
	},
	findIndex(e, t) {
		return st(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return st(this, "findLast", e, t, (e) => rt(this, e), arguments);
	},
	findLastIndex(e, t) {
		return st(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return st(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return lt(this, "includes", e);
	},
	indexOf(...e) {
		return lt(this, "indexOf", e);
	},
	join(e) {
		return tt(this).join(e);
	},
	lastIndexOf(...e) {
		return lt(this, "lastIndexOf", e);
	},
	map(e, t) {
		return st(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return ut(this, "pop");
	},
	push(...e) {
		return ut(this, "push", e);
	},
	reduce(e, ...t) {
		return ct(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return ct(this, "reduceRight", e, t);
	},
	shift() {
		return ut(this, "shift");
	},
	some(e, t) {
		return st(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return ut(this, "splice", e);
	},
	toReversed() {
		return tt(this).toReversed();
	},
	toSorted(e) {
		return tt(this).toSorted(e);
	},
	toSpliced(...e) {
		return tt(this).toSpliced(...e);
	},
	unshift(...e) {
		return ut(this, "unshift", e);
	},
	values() {
		return at(this, "values", (e) => rt(this, e));
	}
};
function at(e, t, n) {
	let r = nt(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ P(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var ot = Array.prototype;
function st(e, t, n, r, i, a) {
	let o = nt(e), s = o !== e && !/* @__PURE__ */ P(e), c = o[t];
	if (c !== ot[t]) {
		let t = c.apply(e, a);
		return s ? I(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, rt(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function ct(e, t, n, r) {
	let i = nt(e), a = i !== e && !/* @__PURE__ */ P(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = rt(e, t)), n.call(this, t, rt(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? rt(e, c) : c;
}
function lt(e, t, n) {
	let r = /* @__PURE__ */ F(e);
	N(r, "iterate", $e);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ Vt(n[0]) ? (n[0] = /* @__PURE__ */ F(n[0]), r[t](...n)) : i;
}
function ut(e, t, n = []) {
	Ue(), Pe();
	let r = (/* @__PURE__ */ F(e))[t].apply(e, n);
	return Fe(), We(), r;
}
var dt = /* @__PURE__ */ e("__proto__,__v_isRef,__isVue"), ft = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(_));
function pt(e) {
	_(e) || (e = String(e));
	let t = /* @__PURE__ */ F(this);
	return N(t, "has", e), t.hasOwnProperty(e);
}
var mt = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? Mt : jt : i ? At : kt).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = d(e);
		if (!r) {
			let e;
			if (a && (e = it[t])) return e;
			if (t === "hasOwnProperty") return pt;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ L(e) ? e : n);
		if ((_(t) ? ft.has(t) : dt(t)) || (r || N(e, "get", t), i)) return o;
		if (/* @__PURE__ */ L(o)) {
			let e = a && w(t) ? o : o.value;
			return r && v(e) ? /* @__PURE__ */ Lt(e) : e;
		}
		return v(o) ? r ? /* @__PURE__ */ Lt(o) : /* @__PURE__ */ Ft(o) : o;
	}
}, ht = class extends mt {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = d(e) && w(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ Bt(i);
			if (!/* @__PURE__ */ P(n) && !/* @__PURE__ */ Bt(n) && (i = /* @__PURE__ */ F(i), n = /* @__PURE__ */ F(n)), !a && /* @__PURE__ */ L(i) && !/* @__PURE__ */ L(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : u(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ L(e) ? e : r);
		return e === /* @__PURE__ */ F(r) && (o ? D(n, i) && et(e, "set", t, n, i) : et(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = u(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && et(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!_(t) || !ft.has(t)) && N(e, "has", t), n;
	}
	ownKeys(e) {
		return N(e, "iterate", d(e) ? "length" : Ze), Reflect.ownKeys(e);
	}
}, gt = class extends mt {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, _t = /* @__PURE__ */ new ht(), vt = /* @__PURE__ */ new gt(), yt = /* @__PURE__ */ new ht(!0), bt = (e) => e, xt = (e) => Reflect.getPrototypeOf(e);
function St(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ F(i), o = f(a), c = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, u = i[e](...r), d = n ? bt : t ? Ut : I;
		return !t && N(a, "iterate", l ? Qe : Ze), s(Object.create(u), { next() {
			let { value: e, done: t } = u.next();
			return t ? {
				value: e,
				done: t
			} : {
				value: c ? [d(e[0]), d(e[1])] : d(e),
				done: t
			};
		} });
	};
}
function Ct(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function wt(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ F(r), a = /* @__PURE__ */ F(n);
			e || (D(n, a) && N(i, "get", n), N(i, "get", a));
			let { has: o } = xt(i), s = t ? bt : e ? Ut : I;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && N(/* @__PURE__ */ F(t), "iterate", Ze), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ F(n), i = /* @__PURE__ */ F(t);
			return e || (D(t, i) && N(r, "has", t), N(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ F(a), s = t ? bt : e ? Ut : I;
			return !e && N(o, "iterate", Ze), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return s(n, e ? {
		add: Ct("add"),
		set: Ct("set"),
		delete: Ct("delete"),
		clear: Ct("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ F(this), r = xt(n), i = /* @__PURE__ */ F(e), a = !t && !/* @__PURE__ */ P(e) && !/* @__PURE__ */ Bt(e) ? i : e;
			return r.has.call(n, a) || D(e, a) && r.has.call(n, e) || D(i, a) && r.has.call(n, i) || (n.add(a), et(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ P(n) && !/* @__PURE__ */ Bt(n) && (n = /* @__PURE__ */ F(n));
			let r = /* @__PURE__ */ F(this), { has: i, get: a } = xt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ F(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? D(n, s) && et(r, "set", e, n, s) : et(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ F(this), { has: n, get: r } = xt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ F(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && et(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ F(this), t = e.size !== 0, n = e.clear();
			return t && et(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = St(r, e, t);
	}), n;
}
function Tt(e, t) {
	let n = wt(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(u(n, r) && r in t ? n : t, r, i);
}
var Et = { get: /* @__PURE__ */ Tt(!1, !1) }, Dt = { get: /* @__PURE__ */ Tt(!1, !0) }, Ot = { get: /* @__PURE__ */ Tt(!0, !1) }, kt = /* @__PURE__ */ new WeakMap(), At = /* @__PURE__ */ new WeakMap(), jt = /* @__PURE__ */ new WeakMap(), Mt = /* @__PURE__ */ new WeakMap();
function Nt(e) {
	switch (e) {
		case "Object":
		case "Array": return 1;
		case "Map":
		case "Set":
		case "WeakMap":
		case "WeakSet": return 2;
		default: return 0;
	}
}
function Pt(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : Nt(S(e));
}
/* @__NO_SIDE_EFFECTS__ */
function Ft(e) {
	return /* @__PURE__ */ Bt(e) ? e : Rt(e, !1, _t, Et, kt);
}
/* @__NO_SIDE_EFFECTS__ */
function It(e) {
	return Rt(e, !1, yt, Dt, At);
}
/* @__NO_SIDE_EFFECTS__ */
function Lt(e) {
	return Rt(e, !0, vt, Ot, jt);
}
function Rt(e, t, n, r, i) {
	if (!v(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = Pt(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function zt(e) {
	return /* @__PURE__ */ Bt(e) ? /* @__PURE__ */ zt(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function Bt(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function P(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function Vt(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function F(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ F(t) : e;
}
function Ht(e) {
	return !u(e, "__v_skip") && Object.isExtensible(e) && O(e, "__v_skip", !0), e;
}
var I = (e) => v(e) ? /* @__PURE__ */ Ft(e) : e, Ut = (e) => v(e) ? /* @__PURE__ */ Lt(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function L(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function R(e) {
	return Wt(e, !1);
}
function Wt(e, t) {
	return /* @__PURE__ */ L(e) ? e : new Gt(e, t);
}
var Gt = class {
	constructor(e, t) {
		this.dep = new Je(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ F(e), this._value = t ? e : I(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ P(e) || /* @__PURE__ */ Bt(e);
		e = n ? e : /* @__PURE__ */ F(e), D(e, t) && (this._rawValue = e, this._value = n ? e : I(e), this.dep.trigger());
	}
};
function Kt(e) {
	return /* @__PURE__ */ L(e) ? e.value : e;
}
var qt = {
	get: (e, t, n) => t === "__v_raw" ? e : Kt(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ L(i) && !/* @__PURE__ */ L(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Jt(e) {
	return /* @__PURE__ */ zt(e) ? e : new Proxy(e, qt);
}
var Yt = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new Je(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Ke - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && j !== this) return Ne(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return ze(this), e && (e.version = this.dep.version), this._value;
	}
	set value(e) {
		this.setter && this.setter(e);
	}
};
/* @__NO_SIDE_EFFECTS__ */
function Xt(e, t, n = !1) {
	let r, i;
	return h(e) ? r = e : (r = e.get, i = e.set), new Yt(r, i, n);
}
var Zt = {}, Qt = /* @__PURE__ */ new WeakMap(), $t = void 0;
function en(e, t = !1, n = $t) {
	if (n) {
		let t = Qt.get(n);
		t || Qt.set(n, t = []), t.push(e);
	}
}
function tn(e, n, i = t) {
	let { immediate: a, deep: o, once: s, scheduler: l, augmentJob: u, call: f } = i, p = (e) => o ? e : /* @__PURE__ */ P(e) || o === !1 || o === 0 ? nn(e, 1) : nn(e), m, g, _, v, y = !1, b = !1;
	if (/* @__PURE__ */ L(e) ? (g = () => e.value, y = /* @__PURE__ */ P(e)) : /* @__PURE__ */ zt(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some((e) => /* @__PURE__ */ zt(e) || /* @__PURE__ */ P(e)), g = () => e.map((e) => {
		if (/* @__PURE__ */ L(e)) return e.value;
		if (/* @__PURE__ */ zt(e)) return p(e);
		if (h(e)) return f ? f(e, 2) : e();
	})) : g = h(e) ? n ? f ? () => f(e, 2) : e : () => {
		if (_) {
			Ue();
			try {
				_();
			} finally {
				We();
			}
		}
		let t = $t;
		$t = m;
		try {
			return f ? f(e, 3, [v]) : e(v);
		} finally {
			$t = t;
		}
	} : r, n && o) {
		let e = g, t = o === !0 ? Infinity : o;
		g = () => nn(e(), t);
	}
	let x = De(), S = () => {
		m.stop(), x && x.active && c(x.effects, m);
	};
	if (s && n) {
		let e = n;
		n = (...t) => {
			e(...t), S();
		};
	}
	let C = b ? Array(e.length).fill(Zt) : Zt, w = (e) => {
		if (!(!(m.flags & 1) || !m.dirty && !e)) if (n) {
			let e = m.run();
			if (o || y || (b ? e.some((e, t) => D(e, C[t])) : D(e, C))) {
				_ && _();
				let t = $t;
				$t = m;
				try {
					let t = [
						e,
						C === Zt ? void 0 : b && C[0] === Zt ? [] : C,
						v
					];
					C = e, f ? f(n, 3, t) : n(...t);
				} finally {
					$t = t;
				}
			}
		} else m.run();
	};
	return u && u(w), m = new ke(g), m.scheduler = l ? () => l(w, !1) : w, v = (e) => en(e, !1, m), _ = m.onStop = () => {
		let e = Qt.get(m);
		if (e) {
			if (f) f(e, 4);
			else for (let t of e) t();
			Qt.delete(m);
		}
	}, n ? a ? w(!0) : C = m.run() : l ? l(w.bind(null, !0), !0) : m.run(), S.pause = m.pause.bind(m), S.resume = m.resume.bind(m), S.stop = S, S;
}
function nn(e, t = Infinity, n) {
	if (t <= 0 || !v(e) || e.__v_skip || (n ||= /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t)) return e;
	if (n.set(e, t), t--, /* @__PURE__ */ L(e)) nn(e.value, t, n);
	else if (d(e)) for (let r = 0; r < e.length; r++) nn(e[r], t, n);
	else if (p(e) || f(e)) e.forEach((e) => {
		nn(e, t, n);
	});
	else if (C(e)) {
		for (let r in e) nn(e[r], t, n);
		for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && nn(e[r], t, n);
	}
	return e;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.34/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function rn(e, t, n, r) {
	try {
		return r ? e(...r) : e();
	} catch (e) {
		an(e, t, n);
	}
}
function z(e, t, n, r) {
	if (h(e)) {
		let i = rn(e, t, n, r);
		return i && y(i) && i.catch((e) => {
			an(e, t, n);
		}), i;
	}
	if (d(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(z(e[a], t, n, r));
		return i;
	}
}
function an(e, n, r, i = !0) {
	let a = n ? n.vnode : null, { errorHandler: o, throwUnhandledErrorInProduction: s } = n && n.appContext.config || t;
	if (n) {
		let t = n.parent, i = n.proxy, a = `https://vuejs.org/error-reference/#runtime-${r}`;
		for (; t;) {
			let n = t.ec;
			if (n) {
				for (let t = 0; t < n.length; t++) if (n[t](e, i, a) === !1) return;
			}
			t = t.parent;
		}
		if (o) {
			Ue(), rn(o, null, 10, [
				e,
				i,
				a
			]), We();
			return;
		}
	}
	on(e, r, a, i, s);
}
function on(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var B = [], V = -1, sn = [], cn = null, ln = 0, un = /* @__PURE__ */ Promise.resolve(), dn = null;
function fn(e) {
	let t = dn || un;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function pn(e) {
	let t = V + 1, n = B.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = B[r], a = yn(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function mn(e) {
	if (!(e.flags & 1)) {
		let t = yn(e), n = B[B.length - 1];
		!n || !(e.flags & 2) && t >= yn(n) ? B.push(e) : B.splice(pn(t), 0, e), e.flags |= 1, hn();
	}
}
function hn() {
	dn ||= un.then(bn);
}
function gn(e) {
	d(e) ? sn.push(...e) : cn && e.id === -1 ? cn.splice(ln + 1, 0, e) : e.flags & 1 || (sn.push(e), e.flags |= 1), hn();
}
function _n(e, t, n = V + 1) {
	for (; n < B.length; n++) {
		let t = B[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			B.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function vn(e) {
	if (sn.length) {
		let e = [...new Set(sn)].sort((e, t) => yn(e) - yn(t));
		if (sn.length = 0, cn) {
			cn.push(...e);
			return;
		}
		for (cn = e, ln = 0; ln < cn.length; ln++) {
			let e = cn[ln];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		cn = null, ln = 0;
	}
}
var yn = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function bn(e) {
	try {
		for (V = 0; V < B.length; V++) {
			let e = B[V];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), rn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; V < B.length; V++) {
			let e = B[V];
			e && (e.flags &= -2);
		}
		V = -1, B.length = 0, vn(e), dn = null, (B.length || sn.length) && bn(e);
	}
}
var H = null, xn = null;
function Sn(e) {
	let t = H;
	return H = e, xn = e && e.type.__scopeId || null, t;
}
function Cn(e, t = H, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && Ei(-1);
		let i = Sn(t), a;
		try {
			a = e(...n);
		} finally {
			Sn(i), r._d && Ei(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function wn(e, n) {
	if (H === null) return e;
	let r = sa(H), i = e.dirs ||= [];
	for (let e = 0; e < n.length; e++) {
		let [a, o, s, c = t] = n[e];
		a && (h(a) && (a = {
			mounted: a,
			updated: a
		}), a.deep && nn(o), i.push({
			dir: a,
			instance: r,
			value: o,
			oldValue: void 0,
			arg: s,
			modifiers: c
		}));
	}
	return e;
}
function Tn(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (Ue(), z(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), We());
	}
}
function En(e, t) {
	if (Q) {
		let n = Q.provides, r = Q.parent && Q.parent.provides;
		r === n && (n = Q.provides = Object.create(r)), n[e] = t;
	}
}
function Dn(e, t, n = !1) {
	let r = Ki();
	if (r || jr) {
		let i = jr ? jr._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t;
	}
}
var On = /* @__PURE__ */ Symbol.for("v-scx"), kn = () => Dn(On);
function U(e, t, n) {
	return An(e, t, n);
}
function An(e, n, i = t) {
	let { immediate: a, deep: o, flush: c, once: l } = i, u = s({}, i), d = n && a || !n && c !== "post", f;
	if (Qi) {
		if (c === "sync") {
			let e = kn();
			f = e.__watcherHandles ||= [];
		} else if (!d) {
			let e = () => {};
			return e.stop = r, e.resume = r, e.pause = r, e;
		}
	}
	let p = Q;
	u.call = (e, t, n) => z(e, p, t, n);
	let m = !1;
	c === "post" ? u.scheduler = (e) => {
		G(e, p && p.suspense);
	} : c !== "sync" && (m = !0, u.scheduler = (e, t) => {
		t ? e() : mn(e);
	}), u.augmentJob = (e) => {
		n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p));
	};
	let h = tn(e, n, u);
	return Qi && (f ? f.push(h) : d && h()), h;
}
function jn(e, t, n) {
	let r = this.proxy, i = g(e) ? e.includes(".") ? Mn(r, e) : () => r[e] : e.bind(r, r), a;
	h(t) ? a = t : (a = t.handler, n = t);
	let o = Yi(this), s = An(i, a.bind(r), n);
	return o(), s;
}
function Mn(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var Nn = /* @__PURE__ */ Symbol("_vte"), Pn = (e) => e.__isTeleport, Fn = /* @__PURE__ */ Symbol("_leaveCb");
function In(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, In(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function Ln(e, t) {
	return h(e) ? s({ name: e.name }, t, { setup: e }) : e;
}
function Rn(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function zn(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var Bn = /* @__PURE__ */ new WeakMap();
function Vn(e, n, r, a, o = !1) {
	if (d(e)) {
		e.forEach((e, t) => Vn(e, n && (d(n) ? n[t] : n), r, a, o));
		return;
	}
	if (Un(a) && !o) {
		a.shapeFlag & 512 && a.type.__asyncResolved && a.component.subTree.component && Vn(e, n, r, a.component.subTree);
		return;
	}
	let s = a.shapeFlag & 4 ? sa(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ F(v), b = v === t ? i : (e) => zn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && zn(_, t));
	if (m != null && m !== p) {
		if (Hn(n), g(m)) _[m] = null, b(m) && (v[m] = null);
		else if (/* @__PURE__ */ L(m)) {
			let e = n;
			x(m, e.k) && (m.value = null), e.k && (_[e.k] = null);
		}
	}
	if (h(p)) rn(p, f, 12, [l, _]);
	else {
		let t = g(p), n = /* @__PURE__ */ L(p);
		if (t || n) {
			let i = () => {
				if (e.f) {
					let n = t ? b(p) ? v[p] : _[p] : x(p) || !e.k ? p.value : _[e.k];
					if (o) d(n) && c(n, s);
					else if (d(n)) n.includes(s) || n.push(s);
					else if (t) _[p] = [s], b(p) && (v[p] = _[p]);
					else {
						let t = [s];
						x(p, e.k) && (p.value = t), e.k && (_[e.k] = t);
					}
				} else t ? (_[p] = l, b(p) && (v[p] = l)) : n && (x(p, e.k) && (p.value = l), e.k && (_[e.k] = l));
			};
			if (l) {
				let t = () => {
					i(), Bn.delete(e);
				};
				t.id = -1, Bn.set(e, t), G(t, r);
			} else Hn(e), i();
		}
	}
}
function Hn(e) {
	let t = Bn.get(e);
	t && (t.flags |= 8, Bn.delete(e));
}
ue().requestIdleCallback, ue().cancelIdleCallback;
var Un = (e) => !!e.type.__asyncLoader, Wn = (e) => e.type.__isKeepAlive;
function Gn(e, t) {
	qn(e, "a", t);
}
function Kn(e, t) {
	qn(e, "da", t);
}
function qn(e, t, n = Q) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (Yn(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) Wn(e.parent.vnode) && Jn(r, t, n, e), e = e.parent;
	}
}
function Jn(e, t, n, r) {
	let i = Yn(t, e, r, !0);
	nr(() => {
		c(r[t], i);
	}, n);
}
function Yn(e, t, n = Q, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			Ue();
			let i = Yi(n), a = z(t, n, e, r);
			return i(), We(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Xn = (e) => (t, n = Q) => {
	(!Qi || e === "sp") && Yn(e, (...e) => t(...e), n);
}, Zn = Xn("bm"), Qn = Xn("m"), $n = Xn("bu"), er = Xn("u"), tr = Xn("bum"), nr = Xn("um"), rr = Xn("sp"), ir = Xn("rtg"), ar = Xn("rtc");
function or(e, t = Q) {
	Yn("ec", e, t);
}
var sr = /* @__PURE__ */ Symbol.for("v-ndc");
function cr(e, t, n, r) {
	let i, a = n && n[r], o = d(e);
	if (o || g(e)) {
		let n = o && /* @__PURE__ */ zt(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ P(e), s = /* @__PURE__ */ Bt(e), e = nt(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Ut(I(e[n])) : I(e[n]) : e[n], n, void 0, a && a[n]);
	} else if (typeof e == "number") {
		i = Array(e);
		for (let n = 0; n < e; n++) i[n] = t(n + 1, n, void 0, a && a[n]);
	} else if (v(e)) if (e[Symbol.iterator]) i = Array.from(e, (e, n) => t(e, n, void 0, a && a[n]));
	else {
		let n = Object.keys(e);
		i = Array(n.length);
		for (let r = 0, o = n.length; r < o; r++) {
			let o = n[r];
			i[r] = t(e[o], o, r, a && a[r]);
		}
	}
	else i = [];
	return n && (n[r] = i), i;
}
var lr = (e) => e ? Zi(e) ? sa(e) : lr(e.parent) : null, ur = /* @__PURE__ */ s(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => lr(e.parent),
	$root: (e) => lr(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => yr(e),
	$forceUpdate: (e) => e.f ||= () => {
		mn(e.update);
	},
	$nextTick: (e) => e.n ||= fn.bind(e.proxy),
	$watch: (e) => jn.bind(e)
}), dr = (e, n) => e !== t && !e.__isScriptSetup && u(e, n), fr = {
	get({ _: e }, n) {
		if (n === "__v_skip") return !0;
		let { ctx: r, setupState: i, data: a, props: o, accessCache: s, type: c, appContext: l } = e;
		if (n[0] !== "$") {
			let e = s[n];
			if (e !== void 0) switch (e) {
				case 1: return i[n];
				case 2: return a[n];
				case 4: return r[n];
				case 3: return o[n];
			}
			else if (dr(i, n)) return s[n] = 1, i[n];
			else if (a !== t && u(a, n)) return s[n] = 2, a[n];
			else if (u(o, n)) return s[n] = 3, o[n];
			else if (r !== t && u(r, n)) return s[n] = 4, r[n];
			else mr && (s[n] = 0);
		}
		let d = ur[n], f, p;
		if (d) return n === "$attrs" && N(e.attrs, "get", ""), d(e);
		if ((f = c.__cssModules) && (f = f[n])) return f;
		if (r !== t && u(r, n)) return s[n] = 4, r[n];
		if (p = l.config.globalProperties, u(p, n)) return p[n];
	},
	set({ _: e }, n, r) {
		let { data: i, setupState: a, ctx: o } = e;
		return dr(a, n) ? (a[n] = r, !0) : i !== t && u(i, n) ? (i[n] = r, !0) : u(e.props, n) || n[0] === "$" && n.slice(1) in e ? !1 : (o[n] = r, !0);
	},
	has({ _: { data: e, setupState: n, accessCache: r, ctx: i, appContext: a, props: o, type: s } }, c) {
		let l;
		return !!(r[c] || e !== t && c[0] !== "$" && u(e, c) || dr(n, c) || u(o, c) || u(i, c) || u(ur, c) || u(a.config.globalProperties, c) || (l = s.__cssModules) && l[c]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? u(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function pr(e) {
	return d(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var mr = !0;
function hr(e) {
	let t = yr(e), n = e.proxy, i = e.ctx;
	mr = !1, t.beforeCreate && _r(t.beforeCreate, e, "bc");
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: ee, renderTracked: te, renderTriggered: ne, errorCaptured: T, serverPrefetch: re, expose: E, inheritAttrs: ie, components: ae, directives: D, filters: oe } = t;
	if (u && gr(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Ft(t));
	}
	if (mr = !0, o) for (let e in o) {
		let t = o[e], a = $({
			get: h(t) ? t.bind(n, n) : h(t.get) ? t.get.bind(n, n) : r,
			set: !h(t) && h(t.set) ? t.set.bind(n) : r
		});
		Object.defineProperty(i, e, {
			enumerable: !0,
			configurable: !0,
			get: () => a.value,
			set: (e) => a.value = e
		});
	}
	if (c) for (let e in c) vr(c[e], i, n, e);
	if (l) {
		let e = h(l) ? l.call(n) : l;
		Reflect.ownKeys(e).forEach((t) => {
			En(t, e[t]);
		});
	}
	f && _r(f, e, "c");
	function O(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (O(Zn, p), O(Qn, m), O($n, g), O(er, _), O(Gn, y), O(Kn, b), O(or, T), O(ar, te), O(ir, ne), O(tr, S), O(nr, w), O(rr, re), d(E)) if (E.length) {
		let t = e.exposed ||= {};
		E.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	ee && e.render === r && (e.render = ee), ie != null && (e.inheritAttrs = ie), ae && (e.components = ae), D && (e.directives = D), re && Rn(e);
}
function gr(e, t, n = r) {
	d(e) && (e = wr(e));
	for (let n in e) {
		let r = e[n], i;
		i = v(r) ? "default" in r ? Dn(r.from || n, r.default, !0) : Dn(r.from || n) : Dn(r), /* @__PURE__ */ L(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function _r(e, t, n) {
	z(d(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function vr(e, t, n, r) {
	let i = r.includes(".") ? Mn(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && U(i, n);
	} else if (h(e)) U(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => vr(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && U(i, r, e);
	}
}
function yr(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => br(c, e, o, !0)), br(c, t, o)), v(t) && a.set(t, c), c;
}
function br(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && br(e, a, n, !0), i && i.forEach((t) => br(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = xr[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var xr = {
	data: Sr,
	props: Er,
	emits: Er,
	methods: Tr,
	computed: Tr,
	beforeCreate: W,
	created: W,
	beforeMount: W,
	mounted: W,
	beforeUpdate: W,
	updated: W,
	beforeDestroy: W,
	beforeUnmount: W,
	destroyed: W,
	unmounted: W,
	activated: W,
	deactivated: W,
	errorCaptured: W,
	serverPrefetch: W,
	components: Tr,
	directives: Tr,
	watch: Dr,
	provide: Sr,
	inject: Cr
};
function Sr(e, t) {
	return t ? e ? function() {
		return s(h(e) ? e.call(this, this) : e, h(t) ? t.call(this, this) : t);
	} : t : e;
}
function Cr(e, t) {
	return Tr(wr(e), wr(t));
}
function wr(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function W(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function Tr(e, t) {
	return e ? s(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Er(e, t) {
	return e ? d(e) && d(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : s(/* @__PURE__ */ Object.create(null), pr(e), pr(t ?? {})) : t;
}
function Dr(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = s(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = W(e[r], t[r]);
	return n;
}
function Or() {
	return {
		app: null,
		config: {
			isNativeTag: i,
			performance: !1,
			globalProperties: {},
			optionMergeStrategies: {},
			errorHandler: void 0,
			warnHandler: void 0,
			compilerOptions: {}
		},
		mixins: [],
		components: {},
		directives: {},
		provides: /* @__PURE__ */ Object.create(null),
		optionsCache: /* @__PURE__ */ new WeakMap(),
		propsCache: /* @__PURE__ */ new WeakMap(),
		emitsCache: /* @__PURE__ */ new WeakMap()
	};
}
var kr = 0;
function Ar(e, t) {
	return function(n, r = null) {
		h(n) || (n = s({}, n)), r != null && !v(r) && (r = null);
		let i = Or(), a = /* @__PURE__ */ new WeakSet(), o = [], c = !1, l = i.app = {
			_uid: kr++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: la,
			get config() {
				return i.config;
			},
			set config(e) {},
			use(e, ...t) {
				return a.has(e) || (e && h(e.install) ? (a.add(e), e.install(l, ...t)) : h(e) && (a.add(e), e(l, ...t))), l;
			},
			mixin(e) {
				return i.mixins.includes(e) || i.mixins.push(e), l;
			},
			component(e, t) {
				return t ? (i.components[e] = t, l) : i.components[e];
			},
			directive(e, t) {
				return t ? (i.directives[e] = t, l) : i.directives[e];
			},
			mount(a, o, s) {
				if (!c) {
					let u = l._ceVNode || Z(n, r);
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, sa(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				c && (z(o, l._instance, 16), e(null, l._container), delete l._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, l;
			},
			runWithContext(e) {
				let t = jr;
				jr = l;
				try {
					return e();
				} finally {
					jr = t;
				}
			}
		};
		return l;
	};
}
var jr = null, Mr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${T(t)}Modifiers`] || e[`${E(t)}Modifiers`];
function Nr(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && Mr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(se)));
	let c, l = i[c = ae(n)] || i[c = ae(T(n))];
	!l && o && (l = i[c = ae(E(n))]), l && z(l, e, 6, a);
	let u = i[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, z(u, e, 6, a);
	}
}
var Pr = /* @__PURE__ */ new WeakMap();
function Fr(e, t, n = !1) {
	let r = n ? Pr : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, c = !1;
	if (!h(e)) {
		let r = (e) => {
			let n = Fr(e, t, !0);
			n && (c = !0, s(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !c ? (v(e) && r.set(e, null), null) : (d(a) ? a.forEach((e) => o[e] = null) : s(o, a), v(e) && r.set(e, o), o);
}
function Ir(e, t) {
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, E(t)) || u(e, t));
}
function Lr(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: s, attrs: c, emit: l, render: u, renderCache: d, props: f, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = Sn(e), v, y;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			v = Ri(u.call(t, e, d, f, m, p, h)), y = c;
		} else {
			let e = t;
			v = Ri(e.length > 1 ? e(f, {
				attrs: c,
				slots: s,
				emit: l
			}) : e(f, null)), y = t.props ? c : Rr(c);
		}
	} catch (t) {
		Ci.length = 0, an(t, e, 1), v = Z(xi);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = zr(y, a)), b = Fi(b, y, !1, !0));
	}
	return n.dirs && (b = Fi(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && In(b, n.transition), v = b, Sn(_), v;
}
var Rr = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || a(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, zr = (e, t) => {
	let n = {};
	for (let r in e) (!o(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function Br(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? Vr(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (Hr(o, r, n) && !Ir(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? Vr(r, o, l) : !0 : !!o;
	return !1;
}
function Vr(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (Hr(t, e, a) && !Ir(n, a)) return !0;
	}
	return !1;
}
function Hr(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && v(r) && v(i) ? !xe(r, i) : r !== i;
}
function Ur({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var Wr = {}, Gr = () => Object.create(Wr), Kr = (e) => Object.getPrototypeOf(e) === Wr;
function qr(e, t, n, r = !1) {
	let i = {}, a = Gr();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), Yr(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ It(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Jr(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ F(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (Ir(e.emitsOptions, o)) continue;
				let d = t[o];
				if (c) if (u(a, o)) d !== a[o] && (a[o] = d, l = !0);
				else {
					let t = T(o);
					i[t] = Xr(c, s, t, d, e, !1);
				}
				else d !== a[o] && (a[o] = d, l = !0);
			}
		}
	} else {
		Yr(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !u(t, a) && ((r = E(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Xr(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !u(t, e)) && (delete a[e], l = !0);
	}
	l && et(e.attrs, "set", "");
}
function Yr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (ee(t)) continue;
		let l = n[t], d;
		a && u(a, d = T(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : Ir(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ F(r), i = c || t;
		for (let t = 0; t < o.length; t++) {
			let s = o[t];
			r[s] = Xr(a, n, s, i[s], e, !u(i, s));
		}
	}
	return s;
}
function Xr(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = u(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && h(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = Yi(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === E(n)) && (r = !0));
	}
	return r;
}
var Zr = /* @__PURE__ */ new WeakMap();
function Qr(e, r, i = !1) {
	let a = i ? Zr : r.propsCache, o = a.get(e);
	if (o) return o;
	let c = e.props, l = {}, f = [], p = !1;
	if (!h(e)) {
		let t = (e) => {
			p = !0;
			let [t, n] = Qr(e, r, !0);
			s(l, t), n && f.push(...n);
		};
		!i && r.mixins.length && r.mixins.forEach(t), e.extends && t(e.extends), e.mixins && e.mixins.forEach(t);
	}
	if (!c && !p) return v(e) && a.set(e, n), n;
	if (d(c)) for (let e = 0; e < c.length; e++) {
		let n = T(c[e]);
		$r(n) && (l[n] = t);
	}
	else if (c) for (let e in c) {
		let t = T(e);
		if ($r(t)) {
			let n = c[e], r = l[t] = d(n) || h(n) ? { type: n } : s({}, n), i = r.type, a = !1, o = !0;
			if (d(i)) for (let e = 0; e < i.length; ++e) {
				let t = i[e], n = h(t) && t.name;
				if (n === "Boolean") {
					a = !0;
					break;
				} else n === "String" && (o = !1);
			}
			else a = h(i) && i.name === "Boolean";
			r[0] = a, r[1] = o, (a || u(r, "default")) && f.push(t);
		}
	}
	let m = [l, f];
	return v(e) && a.set(e, m), m;
}
function $r(e) {
	return e[0] !== "$" && !ee(e);
}
var ei = (e) => e === "_" || e === "_ctx" || e === "$stable", ti = (e) => d(e) ? e.map(Ri) : [Ri(e)], ni = (e, t, n) => {
	if (t._n) return t;
	let r = Cn((...e) => ti(t(...e)), n);
	return r._c = !1, r;
}, ri = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (ei(n)) continue;
		let i = e[n];
		if (h(i)) t[n] = ni(n, i, r);
		else if (i != null) {
			let e = ti(i);
			t[n] = () => e;
		}
	}
}, ii = (e, t) => {
	let n = ti(t);
	e.slots.default = () => n;
}, ai = (e, t, n) => {
	for (let r in t) (n || !ei(r)) && (e[r] = t[r]);
}, oi = (e, t, n) => {
	let r = e.slots = Gr();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (ai(r, t, n), n && O(r, "_", e, !0)) : ri(t, r);
	} else t && ii(e, t);
}, si = (e, n, r) => {
	let { vnode: i, slots: a } = e, o = !0, s = t;
	if (i.shapeFlag & 32) {
		let e = n._;
		e ? r && e === 1 ? o = !1 : ai(a, n, r) : (o = !n.$stable, ri(n, a)), s = n;
	} else n && (ii(e, n), s = { default: 1 });
	if (o) for (let e in a) !ei(e) && s[e] == null && delete a[e];
}, G = yi;
function ci(e) {
	return li(e);
}
function li(e, i) {
	let a = ue();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Ai(e, t) && (r = be(e), he(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case bi:
				y(e, t, n, r);
				break;
			case xi:
				b(e, t, n, r);
				break;
			case Si:
				e ?? x(t, n, r, o);
				break;
			case K:
				ae(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? D(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, Ce);
		}
		u != null && i ? Vn(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && Vn(e.ref, null, a, e, !0);
	}, y = (e, t, n, r) => {
		if (e == null) o(t.el = u(t.children), n, r);
		else {
			let n = t.el = e.el;
			t.children !== e.children && f(n, t.children);
		}
	}, b = (e, t, n, r) => {
		e == null ? o(t.el = d(t.children || ""), n, r) : t.el = e.el;
	}, x = (e, t, n, r) => {
		[e.el, e.anchor] = _(e.children, t, n, r, e.el, e.anchor);
	}, S = ({ el: e, anchor: t }, n, r) => {
		let i;
		for (; e && e !== t;) i = h(e), o(e, n, r), e = i;
		o(t, n, r);
	}, C = ({ el: e, anchor: t }) => {
		let n;
		for (; e && e !== t;) n = h(e), s(e), e = n;
		s(t);
	}, w = (e, t, n, r, i, a, o, s, c) => {
		if (t.type === "svg" ? o = "svg" : t.type === "math" && (o = "mathml"), e == null) te(t, n, r, i, a, o, s, c);
		else {
			let n = e.el && e.el._isVueCE ? e.el : null;
			try {
				n && n._beginPatch(), re(e, t, i, a, o, s, c);
			} finally {
				n && n._endPatch();
			}
		}
	}, te = (e, t, n, r, i, a, s, u) => {
		let d, f, { props: m, shapeFlag: h, transition: g, dirs: _ } = e;
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && T(e.children, d, null, r, i, ui(e, a), s, u), _ && Tn(e, null, r, "created"), ne(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !ee(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Hi(f, r, e);
		}
		_ && Tn(e, null, r, "beforeMount");
		let v = fi(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && G(() => {
			try {
				f && Hi(f, r, e), v && g.enter(d), _ && Tn(e, null, r, "mounted");
			} finally {}
		}, i);
	}, ne = (e, t, n, r, i) => {
		if (n && g(e, n), r) for (let t = 0; t < r.length; t++) g(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || vi(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				ne(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, T = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? zi(e[l]) : Ri(e[l]), t, n, r, i, a, o, s);
	}, re = (e, n, r, i, a, o, s) => {
		let l = n.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = n;
		u |= e.patchFlag & 16;
		let m = e.props || t, h = n.props || t, g;
		if (r && di(r, !1), (g = h.onVnodeBeforeUpdate) && Hi(g, r, n, e), f && Tn(n, e, r, "beforeUpdate"), r && di(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? E(e.dynamicChildren, d, l, r, i, ui(n, a), o) : s || de(e, n, l, null, r, i, ui(n, a), o, !1), u > 0) {
			if (u & 16) ie(l, m, h, r, a);
			else if (u & 2 && m.class !== h.class && c(l, "class", null, h.class, a), u & 4 && c(l, "style", m.style, h.style, a), u & 8) {
				let e = n.dynamicProps;
				for (let t = 0; t < e.length; t++) {
					let n = e[t], i = m[n], o = h[n];
					(o !== i || n === "value") && c(l, n, i, o, a, r);
				}
			}
			u & 1 && e.children !== n.children && p(l, n.children);
		} else !s && d == null && ie(l, m, h, r, a);
		((g = h.onVnodeUpdated) || f) && G(() => {
			g && Hi(g, r, n, e), f && Tn(n, e, r, "updated");
		}, i);
	}, E = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === K || !Ai(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
		}
	}, ie = (e, n, r, i, a) => {
		if (n !== r) {
			if (n !== t) for (let t in n) !ee(t) && !(t in r) && c(e, t, n[t], null, a, i);
			for (let t in r) {
				if (ee(t)) continue;
				let o = r[t], s = n[t];
				o !== s && t !== "value" && c(e, t, s, o, a, i);
			}
			"value" in r && c(e, "value", n.value, r.value, a);
		}
	}, ae = (e, t, n, r, i, a, s, c, l) => {
		let d = t.el = e ? e.el : u(""), f = t.anchor = e ? e.anchor : u(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), T(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (E(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && pi(e, t, !0)) : de(e, t, n, f, i, a, s, c, l);
	}, D = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : O(t, n, r, i, a, o, c) : se(e, t, c);
	}, O = (e, t, n, r, i, a, o) => {
		let s = e.component = Gi(e, r, i);
		if (Wn(e) && (s.ctx.renderer = Ce), $i(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, ce, o), !e.el) {
				let r = s.subTree = Z(xi);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else ce(s, e, t, n, i, a, o);
	}, se = (e, t, n) => {
		let r = t.component = e.component;
		if (Br(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			le(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, ce = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = hi(e);
					if (n) {
						t && (t.el = c.el, le(e, t, o)), n.asyncDep.then(() => {
							G(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				di(e, !1), t ? (t.el = c.el, le(e, t, o)) : t = c, n && oe(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Hi(d, s, t, c), di(e, !0);
				let f = Lr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), be(p), e, i, a), t.el = f.el, u === null && Ur(e, f.el), r && G(r, i), (d = t.props && t.props.onVnodeUpdated) && G(() => Hi(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Un(t);
				if (di(e, !1), l && oe(l), !m && (o = c && c.onVnodeBeforeMount) && Hi(o, d, t), di(e, !0), s && we) {
					let t = () => {
						e.subTree = Lr(e), we(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Lr(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && G(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					G(() => Hi(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Un(d.vnode) && d.vnode.shapeFlag & 256) && e.a && G(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new ke(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => mn(u), di(e, !0), l();
	}, le = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Jr(e, t.props, r, n), si(e, t.children, n), Ue(), _n(e), We();
	}, de = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, u = e ? e.shapeFlag : 0, d = t.children, { patchFlag: f, shapeFlag: m } = t;
		if (f > 0) {
			if (f & 128) {
				pe(l, d, n, r, i, a, o, s, c);
				return;
			} else if (f & 256) {
				fe(l, d, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (u & 16 && ye(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? pe(l, d, n, r, i, a, o, s, c) : ye(l, i, a, !0) : (u & 8 && p(n, ""), m & 16 && T(d, n, r, i, a, o, s, c));
	}, fe = (e, t, r, i, a, o, s, c, l) => {
		e ||= n, t ||= n;
		let u = e.length, d = t.length, f = Math.min(u, d), p;
		for (p = 0; p < f; p++) {
			let n = t[p] = l ? zi(t[p]) : Ri(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? ye(e, a, o, !0, !1, f) : T(t, r, i, a, o, s, c, l, f);
	}, pe = (e, t, r, i, a, o, s, c, l) => {
		let u = 0, d = t.length, f = e.length - 1, p = d - 1;
		for (; u <= f && u <= p;) {
			let n = e[u], i = t[u] = l ? zi(t[u]) : Ri(t[u]);
			if (Ai(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			u++;
		}
		for (; u <= f && u <= p;) {
			let n = e[f], i = t[p] = l ? zi(t[p]) : Ri(t[p]);
			if (Ai(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			f--, p--;
		}
		if (u > f) {
			if (u <= p) {
				let e = p + 1, n = e < d ? t[e].el : i;
				for (; u <= p;) v(null, t[u] = l ? zi(t[u]) : Ri(t[u]), r, n, a, o, s, c, l), u++;
			}
		} else if (u > p) for (; u <= f;) he(e[u], a, o, !0), u++;
		else {
			let m = u, h = u, g = /* @__PURE__ */ new Map();
			for (u = h; u <= p; u++) {
				let e = t[u] = l ? zi(t[u]) : Ri(t[u]);
				e.key != null && g.set(e.key, u);
			}
			let _, y = 0, b = p - h + 1, x = !1, S = 0, C = Array(b);
			for (u = 0; u < b; u++) C[u] = 0;
			for (u = m; u <= f; u++) {
				let n = e[u];
				if (y >= b) {
					he(n, a, o, !0);
					continue;
				}
				let i;
				if (n.key != null) i = g.get(n.key);
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && Ai(n, t[_])) {
					i = _;
					break;
				}
				i === void 0 ? he(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++);
			}
			let w = x ? mi(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || _i(f) : i;
				C[u] === 0 ? v(null, n, r, p, a, o, s, c, l) : x && (_ < 0 || u !== w[_] ? me(n, r, p, 2) : _--);
			}
		}
	}, me = (e, t, n, r, i = null) => {
		let { el: a, type: c, transition: l, children: u, shapeFlag: d } = e;
		if (d & 6) {
			me(e.component.subTree, t, n, r);
			return;
		}
		if (d & 128) {
			e.suspense.move(t, n, r);
			return;
		}
		if (d & 64) {
			c.move(e, t, n, Ce);
			return;
		}
		if (c === K) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) me(u[e], t, n, r);
			o(e.anchor, t, n);
			return;
		}
		if (c === Si) {
			S(e, t, n);
			return;
		}
		if (r !== 2 && d & 1 && l) if (r === 0) l.beforeEnter(a), o(a, t, n), G(() => l.enter(a), i);
		else {
			let { leave: r, delayLeave: i, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? s(a) : o(a, t, n);
			}, d = () => {
				a._isLeaving && a[Fn](!0), r(a, () => {
					u(), c && c();
				});
			};
			i ? i(a, u, d) : d();
		}
		else o(a, t, n);
	}, he = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (Ue(), Vn(s, null, n, e, !0), We()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Un(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Hi(_, t, e), u & 6) ve(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && Tn(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, Ce, r) : l && !l.hasOnce && (a !== K || d > 0 && d & 64) ? ye(l, t, n, !1, !0) : (a === K && d & 384 || !i && u & 16) && ye(c, t, n), r && ge(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && G(() => {
			_ && Hi(_, t, e), h && Tn(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, ge = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === K) {
			_e(n, r);
			return;
		}
		if (t === Si) {
			C(e);
			return;
		}
		let a = () => {
			s(n), i && !i.persisted && i.afterLeave && i.afterLeave();
		};
		if (e.shapeFlag & 1 && i && !i.persisted) {
			let { leave: t, delayLeave: r } = i, o = () => t(n, a);
			r ? r(e.el, a, o) : o();
		} else a();
	}, _e = (e, t) => {
		let n;
		for (; e !== t;) n = h(e), s(e), e = n;
		s(t);
	}, ve = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		gi(c), gi(l), r && oe(r), i.stop(), a && (a.flags |= 8, he(o, e, t, n)), s && G(s, t), G(() => {
			e.isUnmounted = !0;
		}, t);
	}, ye = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) he(e[o], t, n, r, i);
	}, be = (e) => {
		if (e.shapeFlag & 6) return be(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[Nn];
		return n ? h(n) : t;
	}, xe = !1, Se = (e, t, n) => {
		let r;
		e == null ? t._vnode && (he(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, xe ||= (xe = !0, _n(r), vn(), !1);
	}, Ce = {
		p: v,
		um: he,
		m: me,
		r: ge,
		mt: O,
		mc: T,
		pc: de,
		pbc: E,
		n: be,
		o: e
	}, k, we;
	return i && ([k, we] = i(Ce)), {
		render: Se,
		hydrate: k,
		createApp: Ar(Se, k)
	};
}
function ui({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function di({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function fi(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function pi(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (d(r) && d(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = zi(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && pi(t, a)), a.type === bi && (a.patchFlag === -1 && (a = i[e] = zi(a)), a.el = t.el), a.type === xi && !a.el && (a.el = t.el);
	}
}
function mi(e) {
	let t = e.slice(), n = [0], r, i, a, o, s, c = e.length;
	for (r = 0; r < c; r++) {
		let c = e[r];
		if (c !== 0) {
			if (i = n[n.length - 1], e[i] < c) {
				t[r] = i, n.push(r);
				continue;
			}
			for (a = 0, o = n.length - 1; a < o;) s = a + o >> 1, e[n[s]] < c ? a = s + 1 : o = s;
			c < e[n[a]] && (a > 0 && (t[r] = n[a - 1]), n[a] = r);
		}
	}
	for (a = n.length, o = n[a - 1]; a-- > 0;) n[a] = o, o = t[o];
	return n;
}
function hi(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : hi(t);
}
function gi(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function _i(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? _i(t.subTree) : null;
}
var vi = (e) => e.__isSuspense;
function yi(e, t) {
	t && t.pendingBranch ? d(e) ? t.effects.push(...e) : t.effects.push(e) : gn(e);
}
var K = /* @__PURE__ */ Symbol.for("v-fgt"), bi = /* @__PURE__ */ Symbol.for("v-txt"), xi = /* @__PURE__ */ Symbol.for("v-cmt"), Si = /* @__PURE__ */ Symbol.for("v-stc"), Ci = [], q = null;
function J(e = !1) {
	Ci.push(q = e ? null : []);
}
function wi() {
	Ci.pop(), q = Ci[Ci.length - 1] || null;
}
var Ti = 1;
function Ei(e, t = !1) {
	Ti += e, e < 0 && q && t && (q.hasOnce = !0);
}
function Di(e) {
	return e.dynamicChildren = Ti > 0 ? q || n : null, wi(), Ti > 0 && q && q.push(e), e;
}
function Y(e, t, n, r, i, a) {
	return Di(X(e, t, n, r, i, a, !0));
}
function Oi(e, t, n, r, i) {
	return Di(Z(e, t, n, r, i, !0));
}
function ki(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function Ai(e, t) {
	return e.type === t.type && e.key === t.key;
}
var ji = ({ key: e }) => e ?? null, Mi = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ L(e) || h(e) ? {
	i: H,
	r: e,
	k: t,
	f: !!n
} : e);
function X(e, t = null, n = null, r = 0, i = null, a = e === K ? 0 : 1, o = !1, s = !1) {
	let c = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e,
		props: t,
		key: t && ji(t),
		ref: t && Mi(t),
		scopeId: xn,
		slotScopeIds: null,
		children: n,
		component: null,
		suspense: null,
		ssContent: null,
		ssFallback: null,
		dirs: null,
		transition: null,
		el: null,
		anchor: null,
		target: null,
		targetStart: null,
		targetAnchor: null,
		staticCount: 0,
		shapeFlag: a,
		patchFlag: r,
		dynamicProps: i,
		dynamicChildren: null,
		appContext: null,
		ctx: H
	};
	return s ? (Bi(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Ti > 0 && !o && q && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && q.push(c), c;
}
var Z = Ni;
function Ni(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === sr) && (e = xi), ki(e)) {
		let r = Fi(e, t, !0);
		return n && Bi(r, n), Ti > 0 && !a && q && (r.shapeFlag & 6 ? q[q.indexOf(e)] = r : q.push(r)), r.patchFlag = -2, r;
	}
	if (ca(e) && (e = e.__vccOpts), t) {
		t = Pi(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = ge(e)), v(n) && (/* @__PURE__ */ Vt(n) && !d(n) && (n = s({}, n)), t.style = de(n));
	}
	let o = g(e) ? 1 : vi(e) ? 128 : Pn(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return X(e, t, n, r, i, o, a, !0);
}
function Pi(e) {
	return e ? /* @__PURE__ */ Vt(e) || Kr(e) ? s({}, e) : e : null;
}
function Fi(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? Vi(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && ji(l),
		ref: t && t.ref ? n && a ? d(a) ? a.concat(Mi(t)) : [a, Mi(t)] : Mi(t) : a,
		scopeId: e.scopeId,
		slotScopeIds: e.slotScopeIds,
		children: s,
		target: e.target,
		targetStart: e.targetStart,
		targetAnchor: e.targetAnchor,
		staticCount: e.staticCount,
		shapeFlag: e.shapeFlag,
		patchFlag: t && e.type !== K ? o === -1 ? 16 : o | 16 : o,
		dynamicProps: e.dynamicProps,
		dynamicChildren: e.dynamicChildren,
		appContext: e.appContext,
		dirs: e.dirs,
		transition: c,
		component: e.component,
		suspense: e.suspense,
		ssContent: e.ssContent && Fi(e.ssContent),
		ssFallback: e.ssFallback && Fi(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && In(u, c.clone(u)), u;
}
function Ii(e = " ", t = 0) {
	return Z(bi, null, e, t);
}
function Li(e = "", t = !1) {
	return t ? (J(), Oi(xi, null, e)) : Z(xi, null, e);
}
function Ri(e) {
	return e == null || typeof e == "boolean" ? Z(xi) : d(e) ? Z(K, null, e.slice()) : ki(e) ? zi(e) : Z(bi, null, String(e));
}
function zi(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : Fi(e);
}
function Bi(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (d(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), Bi(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Kr(t) ? t._ctx = H : r === 3 && H && (H.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: H
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Ii(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Vi(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = ge([t.class, r.class]));
		else if (e === "style") t.style = de([t.style, r.style]);
		else if (a(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(d(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !o(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Hi(e, t, n, r = null) {
	z(e, t, 7, [n, r]);
}
var Ui = Or(), Wi = 0;
function Gi(e, n, r) {
	let i = e.type, a = (n ? n.appContext : e.appContext) || Ui, o = {
		uid: Wi++,
		vnode: e,
		type: i,
		parent: n,
		appContext: a,
		root: null,
		next: null,
		subTree: null,
		effect: null,
		update: null,
		job: null,
		scope: new Ee(!0),
		render: null,
		proxy: null,
		exposed: null,
		exposeProxy: null,
		withProxy: null,
		provides: n ? n.provides : Object.create(a.provides),
		ids: n ? n.ids : [
			"",
			0,
			0
		],
		accessCache: null,
		renderCache: [],
		components: null,
		directives: null,
		propsOptions: Qr(i, a),
		emitsOptions: Fr(i, a),
		emit: null,
		emitted: null,
		propsDefaults: t,
		inheritAttrs: i.inheritAttrs,
		ctx: t,
		data: t,
		props: t,
		attrs: t,
		slots: t,
		refs: t,
		setupState: t,
		setupContext: null,
		suspense: r,
		suspenseId: r ? r.pendingId : 0,
		asyncDep: null,
		asyncResolved: !1,
		isMounted: !1,
		isUnmounted: !1,
		isDeactivated: !1,
		bc: null,
		c: null,
		bm: null,
		m: null,
		bu: null,
		u: null,
		um: null,
		bum: null,
		da: null,
		a: null,
		rtg: null,
		rtc: null,
		ec: null,
		sp: null
	};
	return o.ctx = { _: o }, o.root = n ? n.root : o, o.emit = Nr.bind(null, o), e.ce && e.ce(o), o;
}
var Q = null, Ki = () => Q || H, qi, Ji;
{
	let e = ue(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	qi = t("__VUE_INSTANCE_SETTERS__", (e) => Q = e), Ji = t("__VUE_SSR_SETTERS__", (e) => Qi = e);
}
var Yi = (e) => {
	let t = Q;
	return qi(e), e.scope.on(), () => {
		e.scope.off(), qi(t);
	};
}, Xi = () => {
	Q && Q.scope.off(), qi(null);
};
function Zi(e) {
	return e.vnode.shapeFlag & 4;
}
var Qi = !1;
function $i(e, t = !1, n = !1) {
	t && Ji(t);
	let { props: r, children: i } = e.vnode, a = Zi(e);
	qr(e, r, a, t), oi(e, i, n || t);
	let o = a ? ea(e, t) : void 0;
	return t && Ji(!1), o;
}
function ea(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, fr);
	let { setup: r } = n;
	if (r) {
		Ue();
		let n = e.setupContext = r.length > 1 ? oa(e) : null, i = Yi(e), a = rn(r, e, 0, [e.props, n]), o = y(a);
		if (We(), i(), (o || e.sp) && !Un(e) && Rn(e), o) {
			if (a.then(Xi, Xi), t) return a.then((n) => {
				ta(e, n, t);
			}).catch((t) => {
				an(t, e, 0);
			});
			e.asyncDep = a;
		} else ta(e, a, t);
	} else ia(e, t);
}
function ta(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = Jt(t)), ia(e, n);
}
var na, ra;
function ia(e, t, n) {
	let i = e.type;
	if (!e.render) {
		if (!t && na && !i.render) {
			let t = i.template || yr(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: r } = e.appContext.config, { delimiters: a, compilerOptions: o } = i;
				i.render = na(t, s(s({
					isCustomElement: n,
					delimiters: a
				}, r), o));
			}
		}
		e.render = i.render || r, ra && ra(e);
	}
	{
		let t = Yi(e);
		Ue();
		try {
			hr(e);
		} finally {
			We(), t();
		}
	}
}
var aa = { get(e, t) {
	return N(e, "get", ""), e[t];
} };
function oa(e) {
	return {
		attrs: new Proxy(e.attrs, aa),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function sa(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(Jt(Ht(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in ur) return ur[n](e);
		},
		has(e, t) {
			return t in e || t in ur;
		}
	}) : e.proxy;
}
function ca(e) {
	return h(e) && "__vccOpts" in e;
}
var $ = (e, t) => /* @__PURE__ */ Xt(e, t, Qi), la = "3.5.34", ua = void 0, da = typeof window < "u" && window.trustedTypes;
if (da) try {
	ua = /* @__PURE__ */ da.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var fa = ua ? (e) => ua.createHTML(e) : (e) => e, pa = "http://www.w3.org/2000/svg", ma = "http://www.w3.org/1998/Math/MathML", ha = typeof document < "u" ? document : null, ga = ha && /* @__PURE__ */ ha.createElement("template"), _a = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? ha.createElementNS(pa, e) : t === "mathml" ? ha.createElementNS(ma, e) : n ? ha.createElement(e, { is: n }) : ha.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => ha.createTextNode(e),
	createComment: (e) => ha.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => ha.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			ga.innerHTML = fa(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = ga.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, va = /* @__PURE__ */ Symbol("_vtc");
function ya(e, t, n) {
	let r = e[va];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var ba = /* @__PURE__ */ Symbol("_vod"), xa = /* @__PURE__ */ Symbol("_vsh"), Sa = /* @__PURE__ */ Symbol(""), Ca = /(?:^|;)\s*display\s*:/;
function wa(e, t, n) {
	let r = e.style, i = g(n), a = !1;
	if (n && !i) {
		if (t) if (g(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? Ea(r, t, "");
		}
		else for (let e in t) n[e] ?? Ea(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? Ea(r, i, "") : Aa(e, i, !g(t) && t ? t[i] : void 0, o) || Ea(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[Sa];
			e && (n += ";" + e), r.cssText = n, a = Ca.test(n);
		}
	} else t && e.removeAttribute("style");
	ba in e && (e[ba] = a ? r.display : "", e[xa] && (r.display = "none"));
}
var Ta = /\s*!important$/;
function Ea(e, t, n) {
	if (d(n)) n.forEach((n) => Ea(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = ka(e, t);
		Ta.test(n) ? e.setProperty(E(r), n.replace(Ta, ""), "important") : e[r] = n;
	}
}
var Da = [
	"Webkit",
	"Moz",
	"ms"
], Oa = {};
function ka(e, t) {
	let n = Oa[t];
	if (n) return n;
	let r = T(t);
	if (r !== "filter" && r in e) return Oa[t] = r;
	r = ie(r);
	for (let n = 0; n < Da.length; n++) {
		let i = Da[n] + r;
		if (i in e) return Oa[t] = i;
	}
	return t;
}
function Aa(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && g(r) && n === r;
}
var ja = "http://www.w3.org/1999/xlink";
function Ma(e, t, n, r, i, a = ve(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(ja, t.slice(6, t.length)) : e.setAttributeNS(ja, t, n) : n == null || a && !ye(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
}
function Na(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? fa(n) : n);
		return;
	}
	let a = e.tagName;
	if (t === "value" && a !== "PROGRESS" && !a.includes("-")) {
		let r = a === "OPTION" ? e.getAttribute("value") || "" : e.value, i = n == null ? e.type === "checkbox" ? "on" : "" : String(n);
		(r !== i || !("_value" in e)) && (e.value = i), n ?? e.removeAttribute(t), e._value = n;
		return;
	}
	let o = !1;
	if (n === "" || n == null) {
		let r = typeof e[t];
		r === "boolean" ? n = ye(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
	}
	try {
		e[t] = n;
	} catch {}
	o && e.removeAttribute(i || t);
}
function Pa(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function Fa(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var Ia = /* @__PURE__ */ Symbol("_vei");
function La(e, t, n, r, i = null) {
	let a = e[Ia] || (e[Ia] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = za(t);
		r ? Pa(e, n, a[t] = Ua(r, i), s) : o && (Fa(e, n, o, s), a[t] = void 0);
	}
}
var Ra = /(?:Once|Passive|Capture)$/;
function za(e) {
	let t;
	if (Ra.test(e)) {
		t = {};
		let n;
		for (; n = e.match(Ra);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : E(e.slice(2)), t];
}
var Ba = 0, Va = /* @__PURE__ */ Promise.resolve(), Ha = () => Ba ||= (Va.then(() => Ba = 0), Date.now());
function Ua(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		z(Wa(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Ha(), n;
}
function Wa(e, t) {
	if (d(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Ga = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Ka = (e, t, n, r, i, s) => {
	let c = i === "svg";
	t === "class" ? ya(e, r, c) : t === "style" ? wa(e, n, r) : a(t) ? o(t) || La(e, t, n, r, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : qa(e, t, r, c)) ? (Na(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ma(e, t, r, c, s, t !== "value")) : e._isVueCE && (Ja(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r))) ? Na(e, T(t), r, s, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Ma(e, t, r, c));
};
function qa(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Ga(t) && h(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Ga(t) && g(n) ? !1 : t in e;
}
function Ja(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = T(t);
	return Array.isArray(n) ? n.some((e) => T(e) === r) : Object.keys(n).some((e) => T(e) === r);
}
var Ya = {};
/* @__NO_SIDE_EFFECTS__ */
function Xa(e, t, n) {
	let r = /* @__PURE__ */ Ln(e, t);
	C(r) && (r = s({}, r, t));
	class i extends Qa {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var Za = typeof HTMLElement < "u" ? HTMLElement : class {}, Qa = class e extends Za {
	constructor(e, t = {}, n = fo) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== fo ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
	}
	connectedCallback() {
		if (!this.isConnected) return;
		!this.shadowRoot && !this._resolved && this._parseSlots(), this._connected = !0;
		let t = this;
		for (; t &&= t.assignedSlot || t.parentNode || t.host;) if (t instanceof e) {
			this._parent = t;
			break;
		}
		this._instance || (this._resolved ? this._mount(this._def) : t && t._pendingResolve ? this._pendingResolve = t._pendingResolve.then(() => {
			this._pendingResolve = void 0, this._resolveDef();
		}) : this._resolveDef());
	}
	_setParent(e = this._parent) {
		e && (this._instance.parent = e._instance, this._inheritParentContext(e));
	}
	_inheritParentContext(e = this._parent) {
		e && this._app && Object.setPrototypeOf(this._app._context.provides, e._instance.provides);
	}
	disconnectedCallback() {
		this._connected = !1, fn(() => {
			this._connected || (this._ob &&= (this._ob.disconnect(), null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null, this._teleportTargets &&= (this._teleportTargets.clear(), void 0));
		});
	}
	_processMutations(e) {
		for (let t of e) this._setAttr(t.attributeName);
	}
	_resolveDef() {
		if (this._pendingResolve) return;
		for (let e = 0; e < this.attributes.length; e++) this._setAttr(this.attributes[e].name);
		this._ob = new MutationObserver(this._processMutations.bind(this)), this._ob.observe(this, { attributes: !0 });
		let e = (e, t = !1) => {
			this._resolved = !0, this._pendingResolve = void 0;
			let { props: n, styles: r } = e, i;
			if (n && !d(n)) for (let e in n) {
				let t = n[e];
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = ce(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[T(e)] = !0);
			}
			this._numberProps = i, this._resolveProps(e), this.shadowRoot && this._applyStyles(r), this._mount(e);
		}, t = this._def.__asyncLoader;
		t ? this._pendingResolve = t().then((t) => {
			t.configureApp = this._def.configureApp, e(this._def = t, !0);
		}) : e(this._def);
	}
	_mount(e) {
		this._app = this._createApp(e), this._inheritParentContext(), e.configureApp && e.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
		let t = this._instance && this._instance.exposed;
		if (t) for (let e in t) u(this, e) || Object.defineProperty(this, e, { get: () => Kt(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = d(t) ? t : Object.keys(t || {});
		for (let e of Object.keys(this)) e[0] !== "_" && n.includes(e) && this._setProp(e, this[e]);
		for (let e of n.map(T)) Object.defineProperty(this, e, {
			get() {
				return this._getProp(e);
			},
			set(t) {
				this._setProp(e, t, !0, !this._patching);
			}
		});
	}
	_setAttr(e) {
		if (e.startsWith("data-v-")) return;
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : Ya, r = T(e);
		t && this._numberProps && this._numberProps[r] && (n = ce(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === Ya ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(E(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(E(e), t + "") : t || this.removeAttribute(E(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), uo(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Z(this._def, s(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, C(t[0]) ? s({ detail: t }, t[0]) : { detail: t }));
			};
			e.emit = (e, ...n) => {
				t(e, n), E(e) !== e && t(E(e), n);
			}, this._setParent();
		}), t;
	}
	_applyStyles(e, t, n) {
		if (!e) return;
		if (t) {
			if (t === this._def || this._styleChildren.has(t)) return;
			this._styleChildren.add(t);
		}
		let r = this._nonce, i = this.shadowRoot, a = n ? this._getStyleAnchor(n) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(i), o = null;
		for (let s = e.length - 1; s >= 0; s--) {
			let c = document.createElement("style");
			r && c.setAttribute("nonce", r), c.textContent = e[s], i.insertBefore(c, o || a), o = c, s === 0 && (n || this._styleAnchors.set(this._def, c), t && this._styleAnchors.set(t, c));
		}
	}
	_getStyleAnchor(e) {
		if (!e) return null;
		let t = this._styleAnchors.get(e);
		return t && t.parentNode === this.shadowRoot ? t : (t && this._styleAnchors.delete(e), null);
	}
	_getRootStyleInsertionAnchor(e) {
		for (let t = 0; t < e.childNodes.length; t++) {
			let n = e.childNodes[t];
			if (!(n instanceof HTMLStyleElement)) return n;
		}
		return null;
	}
	_parseSlots() {
		let e = this._slots = {}, t;
		for (; t = this.firstChild;) {
			let n = t.nodeType === 1 && t.getAttribute("slot") || "default";
			(e[n] || (e[n] = [])).push(t), this.removeChild(t);
		}
	}
	_renderSlots() {
		let e = this._getSlots(), t = this._instance.type.__scopeId;
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = r.getAttribute("name") || "default", a = this._slots[i], o = r.parentNode;
			if (a) for (let e of a) {
				if (t && e.nodeType === 1) {
					let n = t + "-s", r = document.createTreeWalker(e, 1);
					e.setAttribute(n, "");
					let i;
					for (; i = r.nextNode();) i.setAttribute(n, "");
				}
				o.insertBefore(e, r);
			}
			else for (; r.firstChild;) o.insertBefore(r.firstChild, r);
			o.removeChild(r);
		}
	}
	_getSlots() {
		let e = [this];
		this._teleportTargets && e.push(...this._teleportTargets);
		let t = /* @__PURE__ */ new Set();
		for (let n of e) {
			let e = n.querySelectorAll("slot");
			for (let n = 0; n < e.length; n++) t.add(e[n]);
		}
		return Array.from(t);
	}
	_injectChildStyle(e, t) {
		this._applyStyles(e.styles, e, t);
	}
	_beginPatch() {
		this._patching = !0, this._dirty = !1;
	}
	_endPatch() {
		this._patching = !1, this._dirty && this._instance && this._update();
	}
	_hasShadowRoot() {
		return this._def.shadowRoot !== !1;
	}
	_removeChildStyle(e) {}
}, $a = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return d(t) ? (e) => oe(t, e) : t;
}, eo = /* @__PURE__ */ Symbol("_assign"), to = {
	deep: !0,
	created(e, { value: t, modifiers: { number: n } }, r) {
		let i = p(t);
		Pa(e, "change", () => {
			let t = Array.prototype.filter.call(e.options, (e) => e.selected).map((e) => n ? se(ro(e)) : ro(e));
			e[eo](e.multiple ? i ? new Set(t) : t : t[0]), e._assigning = !0, fn(() => {
				e._assigning = !1;
			});
		}), e[eo] = $a(r);
	},
	mounted(e, { value: t }) {
		no(e, t);
	},
	beforeUpdate(e, t, n) {
		e[eo] = $a(n);
	},
	updated(e, { value: t }) {
		e._assigning || no(e, t);
	}
};
function no(e, t) {
	let n = e.multiple, r = d(t);
	if (!(n && !r && !p(t))) {
		for (let i = 0, a = e.options.length; i < a; i++) {
			let a = e.options[i], o = ro(a);
			if (n) if (r) {
				let e = typeof o;
				e === "string" || e === "number" ? a.selected = t.some((e) => String(e) === String(o)) : a.selected = Se(t, o) > -1;
			} else a.selected = t.has(o);
			else if (xe(ro(a), t)) {
				e.selectedIndex !== i && (e.selectedIndex = i);
				return;
			}
		}
		!n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
	}
}
function ro(e) {
	return "_value" in e ? e._value : e.value;
}
var io = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], ao = {
	stop: (e) => e.stopPropagation(),
	prevent: (e) => e.preventDefault(),
	self: (e) => e.target !== e.currentTarget,
	ctrl: (e) => !e.ctrlKey,
	shift: (e) => !e.shiftKey,
	alt: (e) => !e.altKey,
	meta: (e) => !e.metaKey,
	left: (e) => "button" in e && e.button !== 0,
	middle: (e) => "button" in e && e.button !== 1,
	right: (e) => "button" in e && e.button !== 2,
	exact: (e, t) => io.some((n) => e[`${n}Key`] && !t.includes(n))
}, oo = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = ao[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, so = /* @__PURE__ */ s({ patchProp: Ka }, _a), co;
function lo() {
	return co ||= ci(so);
}
var uo = ((...e) => {
	lo().render(...e);
}), fo = ((...e) => {
	let t = lo().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = mo(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, po(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function po(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function mo(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/runtime.ts
async function ho(e, t, n, r, i = {}) {
	let a = `${i.baseUrl ?? ""}/api/ops/${encodeURIComponent(e)}/${encodeURIComponent(t)}/${encodeURIComponent(n)}`, o = { "content-type": "application/json" };
	i.token && (o.authorization = `Bearer ${i.token}`);
	try {
		let e = await fetch(a, {
			method: "POST",
			headers: o,
			body: JSON.stringify(r ?? null),
			signal: i.signal,
			credentials: "include"
		}), t = await e.text();
		if (!e.ok) {
			let n;
			try {
				n = t ? JSON.parse(t) : void 0;
			} catch {
				n = void 0;
			}
			let r = _o(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: go(n?.code) ?? r,
					message: i ?? (t || e.statusText),
					path: n?.path
				}
			};
		}
		return {
			ok: !0,
			value: t ? JSON.parse(t) : null
		};
	} catch (e) {
		return {
			ok: !1,
			error: {
				code: "unavailable",
				message: e instanceof Error ? e.message : String(e)
			}
		};
	}
}
function go(e) {
	switch (e) {
		case "not-found":
		case "conflict":
		case "forbidden":
		case "unauthenticated":
		case "bad-input":
		case "internal":
		case "unavailable": return e;
		default: return;
	}
}
function _o(e) {
	switch (e) {
		case 400: return "bad-input";
		case 401: return "unauthenticated";
		case 403: return "forbidden";
		case 404: return "not-found";
		case 409: return "conflict";
		case 503: return "unavailable";
		default: return "internal";
	}
}
typeof fetch < "u" && fetch.bind(globalThis);
//#endregion
//#region packages/sdk-core/src/relationship-registry.ts
var vo = Symbol.for("comtrya.relationship-registry"), yo = bo();
function bo() {
	let e = globalThis;
	return e[vo] ??= {
		types: /* @__PURE__ */ new Map(),
		providers: /* @__PURE__ */ new Map(),
		subscribers: /* @__PURE__ */ new Set()
	}, e[vo];
}
function xo(e) {
	return [...yo.types.values()].filter((t) => t.sourceKinds.includes(e) || t.targetKinds.includes(e)).sort((e, t) => e.order - t.order || e.id.localeCompare(t.id));
}
function So(e) {
	return yo.providers.get(e);
}
function Co(e) {
	return yo.subscribers.add(e), () => yo.subscribers.delete(e);
}
//#endregion
//#region packages/sdk-core/src/route-registry.ts
function wo(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`;
	return `/x/${e}${n === "/" ? "" : n.replace(/\/+$/, "")}`;
}
//#endregion
//#region packages/sdk-core/src/optimistic.ts
async function To(e) {
	e.apply();
	let t;
	try {
		t = await e.op();
	} catch (t) {
		return e.rollback(), {
			ok: !1,
			error: {
				code: "internal",
				message: t instanceof Error ? t.message : String(t)
			}
		};
	}
	return t.ok ? e.onSuccess?.(t.value) : e.rollback(), t;
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function Eo(e) {
	Do(e.tagName, e.component);
	let t = /* @__PURE__ */ Xa(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(ko(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function Do(e, t) {
	if (typeof document > "u") return;
	let n = Oo(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function Oo(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function ko(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_issues/dist/ext_issues.client.ts
var Ao = {
	openIssue: async (e) => ho("ext_issues", "issues", "open-issue", e),
	closeIssue: async (e) => ho("ext_issues", "issues", "close-issue", e),
	reopenIssue: async (e) => ho("ext_issues", "issues", "reopen-issue", e),
	getIssue: async (e) => ho("ext_issues", "issues", "get-issue", e),
	listIssues: async (e) => ho("ext_issues", "issues", "list-issues", e),
	byRefIssue: async (e) => ho("ext_issues", "issues", "by-ref-issue", e),
	byRefsIssue: async (e) => ho("ext_issues", "issues", "by-refs-issue", e),
	byNumberIssue: async (e) => ho("ext_issues", "issues", "by-number-issue", e),
	stateCountsForRefsIssue: async (e) => ho("ext_issues", "issues", "state-counts-for-refs-issue", e)
}, jo = "query($from: ResourceURN!, $kind: ResourceURN) {\n  relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n}", Mo = "query($to: ResourceURN!, $kind: ResourceURN) {\n  relations.incoming(to: $to, kind: $kind) { id kind from to source target }\n}", No = "mutation($input: RelationCreateInput!) {\n  relations.create(input: $input) { id kind from to source target }\n}", Po = "mutation($input: RelationDeleteInput!) {\n  relations.delete(input: $input)\n}";
function Fo(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Io(e, t) {
	return t ? `comtrya://workspace/${e}/repository/${t}` : `comtrya://workspace/${e}`;
}
function Lo(e) {
	let t = e?.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/([^/]+))?$/);
	return {
		workspaceId: t?.[1] ?? "",
		repositoryId: t?.[2] ?? null
	};
}
function Ro(e) {
	switch (e) {
		case "closed":
		case "CLOSED": return "CLOSED";
		case "reopened":
		case "REOPENED": return "REOPENED";
		default: return "OPEN";
	}
}
function zo(e) {
	let t = Lo(e.repository);
	return {
		id: e.id,
		workspaceId: t.workspaceId,
		repositoryId: t.repositoryId,
		number: e.number,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: Ro(e.state),
		stateReason: e.stateReason ?? null,
		authorRef: e.authorRef ?? null,
		labels: [],
		createdAt: e.createdAt ?? null,
		closedAt: e.closedAt ?? null
	};
}
async function Bo(e, t) {
	let n = Fo(await Ao.listIssues({
		repository: Io(t.workspaceId, t.repositoryId),
		limit: 1024
	}), "listIssues").map(zo), r = t.state ? Ro(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function Vo(e, t) {
	let n = Fo(await Ao.byRefIssue(t), "issueByRef");
	return n ? zo(n) : null;
}
async function Ho(e, t, n) {
	let r = Fo(await Ao.byNumberIssue({
		workspaceId: t,
		number: n
	}), "issueByNumber");
	return r ? zo(r) : null;
}
async function Uo(e) {
	return zo(Fo(await Ao.openIssue({
		repository: Io(e.workspaceId, e.repositoryId),
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? ""
	}), "openIssue"));
}
async function Wo(e, t) {
	return zo(Fo(await Ao.closeIssue({
		id: t,
		reason: "completed"
	}), "closeIssue"));
}
async function Go(e, t) {
	return zo(Fo(await Ao.reopenIssue(t), "reopenIssue"));
}
async function Ko(e, t, n) {
	return ((await e.query(jo, n ? {
		from: t,
		kind: n
	} : { from: t })).relations?.outgoing ?? []).map(Xo);
}
async function qo(e, t, n) {
	return ((await e.query(Mo, n ? {
		to: t,
		kind: n
	} : { to: t })).relations?.incoming ?? []).map(Xo);
}
async function Jo(e, t) {
	let n = (await e.mutate(No, { input: t })).relations?.create;
	if (!n) throw Error("relations.create returned no relation");
	return Xo(n);
}
async function Yo(e, t) {
	return (await e.mutate(Po, { input: { id: t } })).relations?.delete ?? !1;
}
function Xo(e) {
	let t = e.from ?? e.source ?? "", n = e.to ?? e.target ?? "";
	return {
		...e,
		from: t,
		to: n,
		source: e.source ?? t,
		target: e.target ?? n
	};
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/types.ts
var Zo = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
function Qo(e) {
	return `comtrya://issue/${e.id}`;
}
var $o = "issues";
function es(e) {
	return wo($o, `/${e.workspaceId}/${e.number}`);
}
function ts() {
	return wo($o, "/new");
}
function ns(e) {
	switch (e) {
		case "OPEN":
		case "REOPENED": return {
			label: "open",
			className: "issue-state-open"
		};
		case "CLOSED": return {
			label: "closed",
			className: "issue-state-closed"
		};
		default: return {
			label: "unknown",
			className: "issue-state-closed"
		};
	}
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/IssueCard.vue?vue&type=script&setup=true&lang.ts
var rs = ["data-state"], is = ["data-issue-id"], as = { class: "issue-card-title" }, os = { class: "issue-number" }, ss = ["href"], cs = { class: "issue-meta" }, ls = { key: 0 }, us = {
	key: 1,
	class: "issue-line muted"
}, ds = {
	key: 2,
	class: "issue-card-fallback"
}, fs = { class: "issue-line muted" }, ps = { class: "issue-line warn" }, ms = /* @__PURE__ */ Ln({
	__name: "IssueCard",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issue: { type: null },
		ref: { type: String },
		resourceRef: { type: String }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R("idle"), r = /* @__PURE__ */ R(null), i = /* @__PURE__ */ R(t.issue ?? null), a = $(() => t.resourceRef ?? t.ref ?? ""), o = $(() => t.client ?? t.comtryaClient), s = $(() => t.issue ?? i.value), c = $(() => ns(s.value?.state)), l = $(() => s.value?.labels?.join(", ") ?? ""), u = $(() => s.value ? es(s.value) : "#");
		Qn(d), U(() => [
			o.value,
			t.issue,
			a.value
		], () => void d());
		async function d() {
			if (t.issue) {
				i.value = t.issue, n.value = "ready", r.value = null;
				return;
			}
			if (!a.value) {
				i.value = null, n.value = "error", r.value = "issue-card: missing ref";
				return;
			}
			if (!o.value) {
				i.value = null, n.value = "error", r.value = "issue-card: no client";
				return;
			}
			n.value = "loading", r.value = null;
			try {
				i.value = await Vo(o.value, a.value), n.value = i.value ? "ready" : "empty";
			} catch (e) {
				i.value = null, n.value = "error", r.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (e, t) => (J(), Y("article", {
			class: "issue-card",
			"data-state": n.value,
			"data-smoke": "issue-card"
		}, [s.value ? (J(), Y("div", {
			key: 0,
			class: "issue-card-body",
			"data-issue-id": s.value.id,
			"data-smoke": "issue-card-body"
		}, [X("div", as, [
			X("span", { class: ge(["issue-pill", c.value.className]) }, k(c.value.label), 3),
			X("span", os, "#" + k(s.value.number), 1),
			X("a", {
				class: "issue-title-link",
				href: u.value
			}, k(s.value.title), 9, ss)
		]), X("div", cs, [X("span", null, "by " + k(s.value.authorRef ?? "unknown"), 1), l.value ? (J(), Y("span", ls, k(l.value), 1)) : Li("", !0)])], 8, is)) : n.value === "loading" ? (J(), Y("p", us, " Loading " + k(a.value), 1)) : (J(), Y("div", ds, [X("p", fs, k(a.value || "issue"), 1), X("p", ps, k(r.value ?? "issue not found"), 1)]))], 8, rs));
	}
}), hs = ".issue-card[data-v-926ccdce]{display:block}.issue-card-body[data-v-926ccdce]{border:1px solid var(--ink-rule,#d0cfc8);padding:8px 12px}.issue-card-title[data-v-926ccdce]{align-items:baseline;gap:8px;min-width:0;display:flex}.issue-pill[data-v-926ccdce],.issue-number[data-v-926ccdce],.issue-meta[data-v-926ccdce],.issue-line[data-v-926ccdce]{font-family:var(--mono,monospace)}.issue-pill[data-v-926ccdce]{border:1px solid;padding:1px 8px;font-size:10px}.issue-state-open[data-v-926ccdce]{color:var(--ink-go,#008873)}.issue-state-closed[data-v-926ccdce],.issue-number[data-v-926ccdce],.issue-meta[data-v-926ccdce]{color:var(--ink-faint,#888)}.issue-number[data-v-926ccdce]{font-size:12px}.issue-title-link[data-v-926ccdce]{min-width:0;color:inherit;font-family:var(--display,system-ui);overflow-wrap:anywhere;font-weight:600}.issue-meta[data-v-926ccdce]{flex-wrap:wrap;gap:8px;margin-top:4px;font-size:11px;display:flex}.issue-line[data-v-926ccdce]{margin:4px 0;font-size:12px}.muted[data-v-926ccdce]{color:var(--ink-faint,#888)}.warn[data-v-926ccdce]{color:var(--ink-warn,#c2410c)}", gs = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, _s = /* @__PURE__ */ gs(ms, [["styles", [hs]], ["__scopeId", "data-v-926ccdce"]]), vs = /* @__PURE__ */ gs(/* @__PURE__ */ Ln({
	__name: "CustomElementHost",
	props: {
		tag: { type: String },
		attributes: {
			default: () => ({}),
			type: Object
		},
		properties: {
			default: () => ({}),
			type: Object
		}
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R(null), r = null;
		Qn(i), U(() => [
			t.tag,
			t.attributes,
			t.properties
		], i, { deep: !0 });
		function i() {
			let e = n.value;
			if (!e) return;
			let i = !r || r.tagName.toLowerCase() !== t.tag;
			(!r || r.tagName.toLowerCase() !== t.tag) && (r = document.createElement(t.tag));
			for (let [e, n] of Object.entries(t.attributes)) n == null ? r.hasAttribute(e) && r.removeAttribute(e) : r.getAttribute(e) !== n && r.setAttribute(e, n);
			for (let [e, n] of Object.entries(t.properties)) r[e] !== n && (r[e] = n);
			i && e.replaceChildren(r);
		}
		return (e, t) => (J(), Y("span", {
			ref_key: "mount",
			ref: n,
			class: "custom-element-host"
		}, null, 512));
	}
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]), ys = ["data-state", "data-issue-id"], bs = {
	key: 0,
	class: "issue-line muted"
}, xs = {
	key: 1,
	class: "issue-line warn"
}, Ss = {
	key: 2,
	class: "issue-line warn"
}, Cs = {
	key: 3,
	class: "issue-detail-shell"
}, ws = { class: "issue-main" }, Ts = { class: "issue-hero" }, Es = { class: "issue-kicker" }, Ds = { class: "issue-number" }, Os = {
	key: 0,
	class: "issue-repository"
}, ks = {
	class: "issue-facts",
	"aria-label": "Issue metadata"
}, As = { key: 0 }, js = { key: 1 }, Ms = ["data-issue-id"], Ns = { class: "issue-thread" }, Ps = {
	class: "issue-sidebar",
	"aria-label": "Issue sidebar"
}, Fs = { class: "issue-panel" }, Is = { class: "issue-state-summary" }, Ls = { key: 0 }, Rs = { class: "issue-actions" }, zs = ["disabled"], Bs = ["disabled"], Vs = {
	key: 0,
	class: "issue-line warn",
	role: "alert"
}, Hs = "comtrya-issue-relationships", Us = /* @__PURE__ */ gs(/* @__PURE__ */ Ln({
	__name: "IssueDetail",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issue: { type: null },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] },
		number: { type: [Number, String] },
		routeParams: { type: null }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R("idle"), r = /* @__PURE__ */ R("idle"), i = /* @__PURE__ */ R(null), a = /* @__PURE__ */ R(null), o = /* @__PURE__ */ R(t.issue ?? null), s = $(() => t.client ?? t.comtryaClient), c = $(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3"), l = $(() => o.value ?? t.issue ?? null), u = $(() => ns(l.value?.state)), d = $(() => !!l.value?.bodyMarkdown?.trim()), f = $(() => l.value?.bodyMarkdown?.trim() || "No description has been added yet."), p = $(() => y(l.value?.createdAt)), m = $(() => t.repositoryPath ?? l.value?.repositoryId ?? null), h = $(() => Number(t.number ?? t.routeParams?.params?.number)), g = $(() => s.value && Number.isFinite(h.value));
		Qn(_), U(() => [
			s.value,
			t.issue,
			c.value,
			t.repositoryId,
			t.number,
			t.routeParams?.params?.number
		], () => void _());
		async function _() {
			if (t.issue) {
				o.value = v(t.issue) ? t.issue : null, n.value = o.value ? "ready" : "empty", i.value = null;
				return;
			}
			if (!g.value || !s.value) {
				o.value = null, n.value = "error", i.value = "issue-detail: missing params";
				return;
			}
			n.value = "loading", i.value = null;
			try {
				let e = await Ho(s.value, c.value, h.value);
				o.value = e && v(e) ? e : null, n.value = o.value ? "ready" : "empty";
			} catch (e) {
				o.value = null, n.value = "error", i.value = e instanceof Error ? e.message : String(e);
			}
		}
		function v(e) {
			return !t.repositoryId || e.repositoryId === t.repositoryId;
		}
		function y(e) {
			if (!e) return null;
			let t = new Date(e);
			return Number.isNaN(t.valueOf()) ? e : new Intl.DateTimeFormat(void 0, {
				dateStyle: "medium",
				timeStyle: "short"
			}).format(t);
		}
		async function b() {
			if (!s.value || !l.value) return;
			let e = s.value, t = l.value, n = {
				...t,
				state: "CLOSED",
				stateReason: "completed"
			};
			r.value = "submitting", a.value = null;
			try {
				let r = await To({
					apply: () => {
						o.value = n;
					},
					rollback: () => {
						o.value = t;
					},
					op: async () => ({
						ok: !0,
						value: await Wo(e, t.id)
					}),
					onSuccess: (e) => {
						o.value = e;
					}
				});
				r.ok || (a.value = r.error.message);
			} catch (e) {
				a.value = e instanceof Error ? e.message : String(e);
			} finally {
				r.value = "idle";
			}
		}
		async function x() {
			if (!s.value || !l.value) return;
			let e = s.value, t = l.value, n = {
				...t,
				state: "OPEN",
				stateReason: null,
				closedAt: null
			};
			r.value = "submitting", a.value = null;
			try {
				let r = await To({
					apply: () => {
						o.value = n;
					},
					rollback: () => {
						o.value = t;
					},
					op: async () => ({
						ok: !0,
						value: await Go(e, t.id)
					}),
					onSuccess: (e) => {
						o.value = e;
					}
				});
				r.ok || (a.value = r.error.message);
			} catch (e) {
				a.value = e instanceof Error ? e.message : String(e);
			} finally {
				r.value = "idle";
			}
		}
		return (e, o) => (J(), Y("main", {
			class: "issue-detail",
			"data-state": n.value,
			"data-issue-id": l.value?.id,
			"data-smoke": "issue-detail"
		}, [n.value === "loading" ? (J(), Y("p", bs, "Loading issue")) : n.value === "error" ? (J(), Y("p", xs, k(i.value), 1)) : l.value ? (J(), Y("div", Cs, [X("section", ws, [
			X("header", Ts, [
				X("div", Es, [
					X("span", { class: ge(["issue-pill", u.value.className]) }, k(u.value.label), 3),
					X("span", Ds, "#" + k(l.value.number), 1),
					m.value ? (J(), Y("span", Os, k(m.value), 1)) : Li("", !0)
				]),
				X("h1", null, k(l.value.title), 1),
				X("dl", ks, [
					X("div", null, [o[0] ||= X("dt", null, "Author", -1), X("dd", null, k(l.value.authorRef ?? "unknown"), 1)]),
					p.value ? (J(), Y("div", As, [o[1] ||= X("dt", null, "Opened", -1), X("dd", null, k(p.value), 1)])) : Li("", !0),
					l.value.labels?.length ? (J(), Y("div", js, [o[2] ||= X("dt", null, "Labels", -1), X("dd", null, k(l.value.labels.join(", ")), 1)])) : Li("", !0)
				])
			]),
			X("article", {
				class: ge(["issue-body", { "is-empty": !d.value }]),
				"data-issue-id": l.value.id,
				"data-smoke": "issue-detail-main"
			}, k(f.value), 11, Ms),
			X("section", Ns, [o[3] ||= X("header", null, [X("h2", null, "Activity")], -1), Z(vs, {
				tag: "comtrya-comment-thread",
				attributes: { target: Kt(Qo)(l.value) },
				properties: {
					target: Kt(Qo)(l.value),
					comtryaClient: s.value
				}
			}, null, 8, ["attributes", "properties"])])
		]), X("aside", Ps, [X("section", Fs, [
			o[4] ||= X("header", null, [X("h2", null, "State")], -1),
			X("div", Is, [X("span", { class: ge(["issue-pill", u.value.className]) }, k(u.value.label), 3), l.value.stateReason ? (J(), Y("span", Ls, k(l.value.stateReason), 1)) : Li("", !0)]),
			X("div", Rs, [l.value.state === "OPEN" || l.value.state === "REOPENED" ? (J(), Y("button", {
				key: 0,
				type: "button",
				disabled: r.value === "submitting",
				onClick: b
			}, " Close issue ", 8, zs)) : (J(), Y("button", {
				key: 1,
				type: "button",
				disabled: r.value === "submitting",
				onClick: x
			}, " Reopen issue ", 8, Bs))]),
			a.value ? (J(), Y("p", Vs, k(a.value), 1)) : Li("", !0)
		]), Z(vs, {
			tag: Hs,
			properties: {
				client: s.value,
				issue: l.value,
				workspaceId: c.value,
				repositoryId: l.value.repositoryId,
				repositoryPath: t.repositoryPath
			}
		}, null, 8, ["properties"])])])) : (J(), Y("p", Ss, " No issue #" + k(Number.isFinite(h.value) ? h.value : "?") + " in " + k(c.value), 1))], 8, ys));
	}
}), [["styles", [".issue-detail[data-v-47f03841]{width:min(100%,1180px);color:var(--ink,#111);gap:24px;padding:8px 0 48px;display:grid}.issue-detail-shell[data-v-47f03841]{grid-template-columns:minmax(0,1fr) minmax(280px,340px);align-items:start;gap:32px;display:grid}.issue-main[data-v-47f03841],.issue-sidebar[data-v-47f03841],.issue-panel[data-v-47f03841],.issue-thread[data-v-47f03841]{min-width:0}.issue-main[data-v-47f03841]{gap:24px;display:grid}.issue-sidebar[data-v-47f03841]{gap:16px;display:grid}.issue-detail h1[data-v-47f03841]{max-width:820px;font-family:var(--display,system-ui);letter-spacing:0;overflow-wrap:anywhere;margin:10px 0 0;font-size:42px;line-height:1}.issue-hero[data-v-47f03841]{border-bottom:2px solid var(--ink,#111);gap:14px;padding-bottom:22px;display:grid}.issue-kicker[data-v-47f03841]{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.issue-facts[data-v-47f03841]{flex-wrap:wrap;gap:12px 24px;margin:0;display:flex}.issue-line[data-v-47f03841],.issue-kicker[data-v-47f03841],.issue-facts[data-v-47f03841],.issue-panel[data-v-47f03841],.issue-actions button[data-v-47f03841]{font-family:var(--mono,monospace)}.issue-pill[data-v-47f03841]{min-height:22px;font-family:var(--mono,monospace);text-transform:lowercase;border:1px solid;align-items:center;padding:2px 8px;font-size:11px;line-height:1;display:inline-flex}.issue-number[data-v-47f03841],.issue-repository[data-v-47f03841]{color:var(--ink-faint,#888);font-size:12px}.issue-facts div[data-v-47f03841]{gap:4px;display:grid}.issue-facts dt[data-v-47f03841],.issue-facts dd[data-v-47f03841]{margin:0}.issue-facts dt[data-v-47f03841]{color:var(--ink-faint,#888);letter-spacing:.08em;text-transform:uppercase;font-size:10px}.issue-facts dd[data-v-47f03841]{color:var(--ink-soft,#2c2b28);overflow-wrap:anywhere;font-size:12px}.issue-state-open[data-v-47f03841]{color:var(--ink-go,#008873)}.issue-state-closed[data-v-47f03841]{color:var(--ink-faint,#888)}.issue-body[data-v-47f03841]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 86%, white);white-space:pre-wrap;overflow-wrap:anywhere;min-height:156px;padding:20px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55}.issue-body.is-empty[data-v-47f03841]{color:var(--ink-faint,#888);font-family:var(--mono,monospace);font-size:12px}.issue-thread[data-v-47f03841]{gap:12px;padding-top:4px;display:grid}.issue-thread header[data-v-47f03841],.issue-panel header[data-v-47f03841]{border-bottom:1px solid var(--ink-rule,#d0cfc8);align-items:center;min-height:36px;display:flex}.issue-thread h2[data-v-47f03841],.issue-panel h2[data-v-47f03841]{font-family:var(--display,system-ui);margin:0;font-size:18px;line-height:1}.issue-panel[data-v-47f03841]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 94%, white);gap:12px;padding:14px;display:grid}.issue-state-summary[data-v-47f03841]{color:var(--ink-faint,#888);flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;display:flex}.issue-actions[data-v-47f03841]{gap:8px;display:grid}.issue-actions button[data-v-47f03841]{border:1.5px solid var(--ink,#111);min-height:34px;color:inherit;cursor:pointer;text-align:left;background:0 0;padding:8px 12px}.issue-actions button[data-v-47f03841]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-47f03841]{margin:4px 0;font-size:12px}.muted[data-v-47f03841]{color:var(--ink-faint,#888)}.warn[data-v-47f03841]{color:var(--ink-warn,#c2410c)}@media (max-width:920px){.issue-detail-shell[data-v-47f03841]{grid-template-columns:1fr}.issue-detail h1[data-v-47f03841]{font-size:34px}}"]], ["__scopeId", "data-v-47f03841"]]), Ws = {
	class: "issue-relationships",
	"data-smoke": "issue-detail-relationships"
}, Gs = { class: "relationship-header" }, Ks = {
	key: 0,
	class: "issue-line muted"
}, qs = {
	key: 1,
	class: "issue-line warn"
}, Js = {
	key: 2,
	class: "issue-line muted"
}, Ys = {
	key: 3,
	class: "relationship-groups"
}, Xs = { class: "relationship-group-heading" }, Zs = { class: "relationship-card" }, Qs = [
	"aria-label",
	"disabled",
	"onClick"
], $s = ["value"], ec = ["value"], tc = ["disabled"], nc = {
	key: 5,
	class: "issue-line muted"
}, rc = {
	key: 6,
	class: "issue-line warn",
	role: "alert"
}, ic = "issue", ac = /* @__PURE__ */ gs(/* @__PURE__ */ Ln({
	__name: "IssueRelationships",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issue: { type: null },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = $(() => t.client ?? t.comtryaClient), r = $(() => Qo(t.issue)), i = /* @__PURE__ */ R("idle"), a = /* @__PURE__ */ R(null), o = /* @__PURE__ */ R("idle"), s = /* @__PURE__ */ R(null), c = /* @__PURE__ */ R([]), l = /* @__PURE__ */ R([]), u = /* @__PURE__ */ R([]), d = /* @__PURE__ */ R(""), f = /* @__PURE__ */ R(""), p = /* @__PURE__ */ R(0), m, h = $(() => (p.value, xo(ic))), g = $(() => y.value.reduce((e, t) => e + t.relations.length, 0)), _ = $(() => {
			let e = [];
			for (let t of h.value) {
				if (t.symmetric) {
					let n = T(t.sourceKinds.includes(ic) ? t.targetKinds : t.sourceKinds);
					n.length > 0 && e.push({
						key: `${t.id}:symmetric`,
						type: t,
						direction: "symmetric",
						label: t.outgoingLabel,
						targetKinds: n
					});
					continue;
				}
				if (t.sourceKinds.includes(ic)) {
					let n = T(t.targetKinds);
					n.length > 0 && e.push({
						key: `${t.id}:outgoing`,
						type: t,
						direction: "outgoing",
						label: t.outgoingLabel,
						targetKinds: n
					});
				}
				if (t.targetKinds.includes(ic)) {
					let n = T(t.sourceKinds);
					n.length > 0 && e.push({
						key: `${t.id}:incoming`,
						type: t,
						direction: "incoming",
						label: t.incomingLabel,
						targetKinds: n
					});
				}
			}
			return e;
		}), v = $(() => _.value.find((e) => e.key === d.value)), y = $(() => {
			let e = [];
			for (let t of h.value) {
				if (t.symmetric) {
					let n = re([...c.value, ...l.value]).filter((e) => e.kind === t.kind).map((e) => ({
						relation: e,
						targetRef: te(e, r.value)
					})).filter((e) => t.sourceKinds.includes(ne(e.targetRef)) || t.targetKinds.includes(ne(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:symmetric`,
						label: t.outgoingLabel,
						relations: n
					});
					continue;
				}
				if (t.sourceKinds.includes(ic)) {
					let n = c.value.filter((e) => e.kind === t.kind && w(e) === r.value).map((e) => ({
						relation: e,
						targetRef: ee(e)
					})).filter((e) => t.targetKinds.includes(ne(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:outgoing`,
						label: t.outgoingLabel,
						relations: n
					});
				}
				if (t.targetKinds.includes(ic)) {
					let n = l.value.filter((e) => e.kind === t.kind && ee(e) === r.value).map((e) => ({
						relation: e,
						targetRef: w(e)
					})).filter((e) => t.sourceKinds.includes(ne(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:incoming`,
						label: t.incomingLabel,
						relations: n
					});
				}
			}
			return e;
		});
		Qn(() => {
			m = Co(() => {
				p.value += 1;
			});
		}), nr(() => m?.()), U(() => [n.value, t.issue.id], () => void b(), { immediate: !0 }), U(_, (e) => {
			e.some((e) => e.key === d.value) || (d.value = e[0]?.key ?? "");
		}, { immediate: !0 }), U(() => [
			d.value,
			t.workspaceId,
			t.repositoryId,
			t.repositoryPath,
			r.value
		], () => void x(), { immediate: !0 });
		async function b() {
			let e = n.value;
			if (!e) {
				c.value = [], l.value = [], i.value = "error", a.value = "relationships: no client";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				let [t, n] = await Promise.all([Ko(e, r.value), qo(e, r.value)]);
				c.value = t, l.value = n, i.value = "ready";
			} catch (e) {
				c.value = [], l.value = [], i.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function x() {
			let e = v.value;
			if (!e) {
				u.value = [], f.value = "";
				return;
			}
			o.value = "loading-targets", s.value = null;
			try {
				let n = [];
				for (let i of e.targetKinds) {
					let a = So(i);
					if (!a) continue;
					let o = await a.loadTargets({
						workspaceId: t.workspaceId,
						repositoryId: t.repositoryId,
						repositoryPath: t.repositoryPath,
						currentRef: r.value,
						currentKind: ic,
						relationshipType: e.type,
						direction: e.direction,
						targetKind: i
					});
					n.push(...o);
				}
				u.value = E(n).filter((e) => e.ref !== r.value), f.value = u.value[0]?.ref ?? "";
			} catch (e) {
				u.value = [], f.value = "", s.value = e instanceof Error ? e.message : String(e);
			} finally {
				o.value = "idle";
			}
		}
		async function S() {
			let e = n.value, t = v.value;
			if (!e || !t || !f.value) return;
			let i = t.direction === "incoming" ? f.value : r.value, a = t.direction === "incoming" ? r.value : f.value;
			o.value = "submitting", s.value = null;
			try {
				await Jo(e, {
					from: i,
					to: a,
					kind: t.type.kind
				}), await b();
			} catch (e) {
				s.value = e instanceof Error ? e.message : String(e);
			} finally {
				o.value = "idle";
			}
		}
		async function C(e) {
			let t = n.value;
			if (t) {
				o.value = "submitting", s.value = null;
				try {
					await Yo(t, e.id), await b();
				} catch (e) {
					s.value = e instanceof Error ? e.message : String(e);
				} finally {
					o.value = "idle";
				}
			}
		}
		function w(e) {
			return e.from ?? e.source ?? "";
		}
		function ee(e) {
			return e.to ?? e.target ?? "";
		}
		function te(e, t) {
			let n = w(e), r = ee(e);
			return n === t ? r : n === r ? "" : n;
		}
		function ne(e) {
			return e.match(/^comtrya:\/\/([^/]+)\//)?.[1] ?? "";
		}
		function T(e) {
			return [...new Set(e)].filter((e) => So(e) !== void 0);
		}
		function re(e) {
			let t = /* @__PURE__ */ new Set();
			return e.filter((e) => t.has(e.id) ? !1 : (t.add(e.id), !0));
		}
		function E(e) {
			let t = /* @__PURE__ */ new Set();
			return e.filter((e) => t.has(e.ref) ? !1 : (t.add(e.ref), !0));
		}
		return (e, t) => (J(), Y("section", Ws, [
			X("header", Gs, [X("div", null, [t[2] ||= X("h2", null, "Relationships", -1), X("p", null, k(g.value) + " linked", 1)])]),
			i.value === "loading" ? (J(), Y("p", Ks, "Loading relationships")) : i.value === "error" ? (J(), Y("p", qs, k(a.value), 1)) : y.value.length === 0 ? (J(), Y("p", Js, " No relationships yet. ")) : (J(), Y("div", Ys, [(J(!0), Y(K, null, cr(y.value, (e) => (J(), Y("section", {
				key: e.key,
				class: "relationship-group"
			}, [X("div", Xs, [X("h3", null, k(e.label), 1), X("span", null, k(e.relations.length), 1)]), X("ul", null, [(J(!0), Y(K, null, cr(e.relations, (t) => (J(), Y("li", { key: t.relation.id }, [X("div", Zs, [Z(vs, {
				tag: "comtrya-resource-card",
				attributes: { ref: t.targetRef },
				properties: {
					ref: t.targetRef,
					comtryaClient: n.value
				}
			}, null, 8, ["attributes", "properties"])]), X("button", {
				type: "button",
				class: "relationship-remove",
				"aria-label": `Remove ${e.label} relationship`,
				disabled: o.value === "submitting",
				onClick: (e) => C(t.relation)
			}, " Remove ", 8, Qs)]))), 128))])]))), 128))])),
			_.value.length > 0 ? (J(), Y("form", {
				key: 4,
				class: "relationship-form",
				onSubmit: oo(S, ["prevent"])
			}, [
				X("label", null, [t[3] ||= X("span", null, "Type", -1), wn(X("select", {
					"onUpdate:modelValue": t[0] ||= (e) => d.value = e,
					"aria-label": "Relationship type"
				}, [(J(!0), Y(K, null, cr(_.value, (e) => (J(), Y("option", {
					key: e.key,
					value: e.key
				}, k(e.label), 9, $s))), 128))], 512), [[to, d.value]])]),
				X("label", null, [t[4] ||= X("span", null, "Target", -1), wn(X("select", {
					"onUpdate:modelValue": t[1] ||= (e) => f.value = e,
					"aria-label": "Relationship target"
				}, [(J(!0), Y(K, null, cr(u.value, (e) => (J(), Y("option", {
					key: e.ref,
					value: e.ref
				}, k(e.title) + k(e.subtitle ? ` - ${e.subtitle}` : ""), 9, ec))), 128))], 512), [[to, f.value]])]),
				X("button", {
					type: "submit",
					disabled: o.value !== "idle" || !f.value
				}, " Add ", 8, tc)
			], 32)) : Li("", !0),
			_.value.length > 0 && u.value.length === 0 && o.value === "idle" ? (J(), Y("p", nc, " No eligible targets for this relationship. ")) : Li("", !0),
			s.value ? (J(), Y("p", rc, k(s.value), 1)) : Li("", !0)
		]));
	}
}), [["styles", [".issue-relationships[data-v-0937cdb1]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 94%, white);font-family:var(--mono,monospace);gap:12px;padding:14px;font-size:12px;display:grid}.relationship-header[data-v-0937cdb1]{border-bottom:1px solid var(--ink-rule,#d0cfc8);align-items:center;min-height:36px;display:flex}.relationship-header h2[data-v-0937cdb1],.relationship-group h3[data-v-0937cdb1]{font-family:var(--display,system-ui);margin:0}.relationship-header h2[data-v-0937cdb1]{font-size:18px;line-height:1}.relationship-header p[data-v-0937cdb1]{color:var(--ink-faint,#888);margin:4px 0 0;font-size:11px}.relationship-groups[data-v-0937cdb1],.relationship-group[data-v-0937cdb1],.relationship-group ul[data-v-0937cdb1]{flex-direction:column;gap:8px;display:flex}.relationship-group[data-v-0937cdb1]{padding-top:4px}.relationship-group-heading[data-v-0937cdb1]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.relationship-group-heading h3[data-v-0937cdb1]{font-size:14px;line-height:1}.relationship-group-heading span[data-v-0937cdb1]{color:var(--ink-faint,#888);font-size:11px}.relationship-group ul[data-v-0937cdb1]{margin:0;padding:0;list-style:none}.relationship-group li[data-v-0937cdb1]{grid-template-columns:minmax(0,1fr) auto;align-items:stretch;gap:8px;display:grid}.relationship-card[data-v-0937cdb1]{min-width:0}.relationship-form[data-v-0937cdb1]{border-top:1px solid var(--ink-rule,#d0cfc8);gap:8px;padding-top:12px;display:grid}.relationship-form label[data-v-0937cdb1]{flex-direction:column;gap:4px;min-width:0;display:flex}.relationship-form label>span[data-v-0937cdb1]{color:var(--ink-faint,#888);letter-spacing:.08em;text-transform:uppercase;font-size:10px}.relationship-form select[data-v-0937cdb1],.relationship-form button[data-v-0937cdb1],.relationship-group button[data-v-0937cdb1]{border:1px solid var(--ink,#111);min-height:32px;color:inherit;font:inherit;background:0 0}.relationship-form select[data-v-0937cdb1]{width:100%;max-width:100%;padding:5px 8px}.relationship-form button[data-v-0937cdb1],.relationship-group button[data-v-0937cdb1]{cursor:pointer;padding:5px 10px}.relationship-remove[data-v-0937cdb1]{color:var(--ink-faint,#888);align-self:start}.relationship-form button[data-v-0937cdb1]:disabled,.relationship-group button[data-v-0937cdb1]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-0937cdb1]{margin:4px 0;font-size:12px}.muted[data-v-0937cdb1]{color:var(--ink-faint,#888)}.warn[data-v-0937cdb1]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-0937cdb1"]]), oc = ["data-state"], sc = { class: "issues-list-header" }, cc = ["href"], lc = {
	key: 0,
	class: "issue-line muted"
}, uc = {
	key: 1,
	class: "issue-line warn"
}, dc = {
	key: 2,
	class: "issue-line muted"
}, fc = {
	key: 3,
	class: "issues-list-items"
}, pc = /* @__PURE__ */ gs(/* @__PURE__ */ Ln({
	__name: "IssuesList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issues: { type: [Array, null] },
		workspaceId: {
			default: Zo,
			type: String
		},
		repositoryId: {
			default: null,
			type: [String, null]
		},
		state: {
			default: null,
			type: [String, null]
		},
		title: {
			default: "Issues",
			type: String
		},
		showNewLink: {
			type: Boolean,
			default: !0
		}
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R("idle"), r = /* @__PURE__ */ R(null), i = /* @__PURE__ */ R(t.issues ?? []), a = $(() => t.issues ?? i.value), o = $(() => t.client ?? t.comtryaClient), s = $(() => {
			let e = ts(), n = new URLSearchParams({ workspaceId: t.workspaceId });
			return t.repositoryId && n.set("repositoryId", t.repositoryId), `${e}?${n.toString()}`;
		});
		Qn(c), U(() => [
			o.value,
			t.issues,
			t.workspaceId,
			t.repositoryId,
			t.state
		], () => void c());
		async function c() {
			if (t.issues) {
				i.value = t.issues, n.value = t.issues.length > 0 ? "ready" : "empty", r.value = null;
				return;
			}
			if (!o.value) {
				i.value = [], n.value = "error", r.value = "issues: no client";
				return;
			}
			n.value = "loading", r.value = null;
			try {
				i.value = await Bo(o.value, {
					workspaceId: t.workspaceId,
					repositoryId: t.repositoryId,
					state: t.state
				}), n.value = i.value.length > 0 ? "ready" : "empty";
			} catch (e) {
				i.value = [], n.value = "error", r.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (t, i) => (J(), Y("section", {
			class: "issues-list",
			"data-state": n.value,
			"data-smoke": "issues-list"
		}, [X("header", sc, [X("h3", null, k(e.title), 1), e.showNewLink ? (J(), Y("a", {
			key: 0,
			href: s.value
		}, "+ new", 8, cc)) : Li("", !0)]), n.value === "loading" ? (J(), Y("p", lc, "Loading issues")) : n.value === "error" ? (J(), Y("p", uc, k(r.value), 1)) : a.value.length === 0 ? (J(), Y("p", dc, "No issues yet.")) : (J(), Y("ul", fc, [(J(!0), Y(K, null, cr(a.value, (e) => (J(), Y("li", { key: e.id }, [Z(_s, {
			issue: e,
			client: o.value
		}, null, 8, ["issue", "client"])]))), 128))]))], 8, oc));
	}
}), [["styles", [".issues-list[data-v-920dccbd]{gap:8px;display:grid}.issues-list-header[data-v-920dccbd]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.issues-list-header h3[data-v-920dccbd]{font-family:var(--display,system-ui);margin:0;font-size:14px}.issues-list-header a[data-v-920dccbd],.issue-line[data-v-920dccbd]{font-family:var(--mono,monospace);font-size:12px}.issues-list-header a[data-v-920dccbd]{color:var(--ink-faint,#888);text-decoration:none}.issues-list-items[data-v-920dccbd]{gap:6px;margin:0;padding:0;list-style:none;display:grid}.issue-line[data-v-920dccbd]{margin:4px 0}.muted[data-v-920dccbd]{color:var(--ink-faint,#888)}.warn[data-v-920dccbd]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-920dccbd"]]), mc = "ext_issues", hc = "comtrya-issue-card", gc = "comtrya-issues-list", _c = "comtrya-issues-repo-list", vc = "comtrya-issue-detail", yc = "comtrya-issue-relationships", bc = "comtrya-issue-new";
Eo({
	tagName: hc,
	component: _s,
	propertyAliases: { ref: "resourceRef" }
}), Eo({
	tagName: gc,
	component: pc
}), Eo({
	tagName: _c,
	component: pc
}), Eo({
	tagName: vc,
	component: Us
}), Eo({
	tagName: yc,
	component: ac
}), Sc();
var xc = {
	id: mc,
	setup(e) {
		e.registerCard({
			resourceKind: "issue",
			element: hc,
			requiredPermission: "issues.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "issue",
			loadTargets: async (t) => (await Bo(e.client, {
				workspaceId: t.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
				repositoryId: t.repositoryId
			})).map((e) => ({
				ref: Qo(e),
				kind: "issue",
				title: `#${e.number} ${e.title}`,
				subtitle: e.state.toLowerCase()
			}))
		}), e.registerWidget({
			id: "issues-list",
			element: gc,
			defaultSlot: "repository.main",
			defaultPriority: 100,
			requiredPermission: "issues.read"
		}), e.registerRoute("/", {
			element: gc,
			requiredPermission: "issues.read"
		}), e.registerRoute("/new", {
			element: bc,
			requiredPermission: "issues.write"
		}), e.registerRoute("/:workspaceId/:number", {
			element: vc,
			requiredPermission: "issues.read"
		});
	}
};
function Sc() {
	if (typeof customElements > "u" || customElements.get(bc)) return;
	class e extends HTMLElement {
		routeParams;
		workspaceId;
		repositoryId;
		connectedCallback() {
			this.replaceChildren(wc(Cc(this.routeParams, this)));
		}
	}
	customElements.define(bc, e);
}
function Cc(e, t = {}) {
	let n = new URLSearchParams(window.location.search);
	return {
		workspaceId: n.get("workspaceId") ?? t.workspaceId ?? e?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
		repositoryId: n.get("repositoryId") ?? t.repositoryId ?? e?.params?.repositoryId ?? null
	};
}
function wc(e) {
	let t = document.createElement("main");
	t.className = "issue-new", t.dataset.smoke = "issue-new";
	let n = document.createElement("h1");
	n.textContent = "New issue";
	let r = document.createElement("form"), i = document.createElement("input");
	i.required = !0, i.placeholder = "Issue title";
	let a = document.createElement("textarea");
	a.rows = 6, a.placeholder = "Description (optional)";
	let o = document.createElement("button");
	o.type = "submit", o.textContent = "Create issue";
	let s = Tc("", "warn");
	return s.setAttribute("role", "alert"), s.hidden = !0, r.append(i, a, o, s), r.addEventListener("submit", (t) => {
		t.preventDefault(), o.disabled = !0, s.hidden = !0, Uo({
			workspaceId: e.workspaceId,
			repositoryId: e.repositoryId,
			title: i.value.trim(),
			bodyMarkdown: a.value
		}).then((e) => {
			window.location.assign(es(e));
		}).catch((e) => {
			s.textContent = e instanceof Error ? e.message : String(e), s.hidden = !1, o.disabled = !1;
		});
	}), t.append(n, r), t;
}
function Tc(e, t) {
	let n = document.createElement("p");
	return n.className = `issue-line ${t}`, n.textContent = e, n;
}
//#endregion
export { xc as default };
