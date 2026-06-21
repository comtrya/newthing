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
}, l = Object.prototype.hasOwnProperty, u = (e, t) => l.call(e, t), d = Array.isArray, f = (e) => x(e) === "[object Map]", p = (e) => x(e) === "[object Set]", m = (e) => x(e) === "[object Date]", h = (e) => typeof e == "function", g = (e) => typeof e == "string", _ = (e) => typeof e == "symbol", v = (e) => typeof e == "object" && !!e, y = (e) => (v(e) || h(e)) && h(e.then) && h(e.catch), b = Object.prototype.toString, x = (e) => b.call(e), S = (e) => x(e).slice(8, -1), C = (e) => x(e) === "[object Object]", w = (e) => g(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, ee = /* @__PURE__ */ e(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"), T = (e) => {
	let t = /* @__PURE__ */ Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, te = /-\w/g, E = T((e) => e.replace(te, (e) => e.slice(1).toUpperCase())), ne = /\B([A-Z])/g, D = T((e) => e.replace(ne, "-$1").toLowerCase()), O = T((e) => e.charAt(0).toUpperCase() + e.slice(1)), re = T((e) => e ? `on${O(e)}` : ""), k = (e, t) => !Object.is(e, t), ie = (e, ...t) => {
	for (let n = 0; n < e.length; n++) e[n](...t);
}, A = (e, t, n, r = !1) => {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		writable: r,
		value: n
	});
}, ae = (e) => {
	let t = parseFloat(e);
	return isNaN(t) ? e : t;
}, oe = (e) => {
	let t = g(e) ? Number(e) : NaN;
	return isNaN(t) ? e : t;
}, se, ce = () => se ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function le(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = g(r) ? pe(r) : le(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (g(e) || v(e)) return e;
}
var ue = /;(?![^(]*\))/g, de = /:([^]+)/, fe = /\/\*[^]*?\*\//g;
function pe(e) {
	let t = {};
	return e.replace(fe, "").split(ue).forEach((e) => {
		if (e) {
			let n = e.split(de);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function me(e) {
	let t = "";
	if (g(e)) t = e;
	else if (d(e)) for (let n = 0; n < e.length; n++) {
		let r = me(e[n]);
		r && (t += r + " ");
	}
	else if (v(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var he = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", ge = /* @__PURE__ */ e(he);
he + "";
function _e(e) {
	return !!e || e === "";
}
function ve(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = ye(e[r], t[r]);
	return n;
}
function ye(e, t) {
	if (e === t) return !0;
	let n = m(e), r = m(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = _(e), r = _(t), n || r) return e === t;
	if (n = d(e), r = d(t), n || r) return n && r ? ve(e, t) : !1;
	if (n = v(e), r = v(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !ye(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
function be(e, t) {
	return e.findIndex((e) => ye(e, t));
}
var xe = (e) => !!(e && e.__v_isRef === !0), j = (e) => g(e) ? e : e == null ? "" : d(e) || v(e) && (e.toString === b || !h(e.toString)) ? xe(e) ? j(e.value) : JSON.stringify(e, Se, 2) : String(e), Se = (e, t) => xe(t) ? Se(e, t.value) : f(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[Ce(t, r) + " =>"] = n, e), {}) } : p(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => Ce(e)) } : _(t) ? Ce(t) : v(t) && !d(t) && !C(t) ? String(t) : t, Ce = (e, t = "") => _(e) ? `Symbol(${e.description ?? t})` : e, M, we = class {
	constructor(e = !1) {
		this.detached = e, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !e && M && (M.active ? (this.parent = M, this.index = (M.scopes ||= []).push(this) - 1) : (this._active = !1, this._warnOnRun = !1));
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
			let t = M;
			try {
				return M = this, e();
			} finally {
				M = t;
			}
		}
	}
	on() {
		++this._on === 1 && (this.prevScope = M, M = this);
	}
	off() {
		if (this._on > 0 && --this._on === 0) {
			if (M === this) M = this.prevScope;
			else {
				let e = M;
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
function Te() {
	return M;
}
var N, Ee = /* @__PURE__ */ new WeakSet(), De = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, M && (M.active ? M.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, Ee.has(this) && (Ee.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || je(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, We(this), Pe(this);
		let e = N, t = Be;
		N = this, Be = !0;
		try {
			return this.fn();
		} finally {
			Fe(this), N = e, Be = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) Re(e);
			this.deps = this.depsTail = void 0, We(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? Ee.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		Ie(this) && this.run();
	}
	get dirty() {
		return Ie(this);
	}
}, Oe = 0, ke, Ae;
function je(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = Ae, Ae = e;
		return;
	}
	e.next = ke, ke = e;
}
function Me() {
	Oe++;
}
function Ne() {
	if (--Oe > 0) return;
	if (Ae) {
		let e = Ae;
		for (Ae = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; ke;) {
		let t = ke;
		for (ke = void 0; t;) {
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
function Pe(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Fe(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), Re(r), ze(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function Ie(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (Le(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function Le(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Ge) || (e.globalVersion = Ge, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Ie(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = N, r = Be;
	N = e, Be = !0;
	try {
		Pe(e);
		let n = e.fn(e._value);
		(t.version === 0 || k(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		N = n, Be = r, Fe(e), e.flags &= -3;
	}
}
function Re(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) Re(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function ze(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var Be = !0, Ve = [];
function He() {
	Ve.push(Be), Be = !1;
}
function Ue() {
	let e = Ve.pop();
	Be = e === void 0 ? !0 : e;
}
function We(e) {
	let { cleanup: t } = e;
	if (e.cleanup = void 0, t) {
		let e = N;
		N = void 0;
		try {
			t();
		} finally {
			N = e;
		}
	}
}
var Ge = 0, Ke = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, qe = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!N || !Be || N === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== N) t = this.activeLink = new Ke(N, this), N.deps ? (t.prevDep = N.depsTail, N.depsTail.nextDep = t, N.depsTail = t) : N.deps = N.depsTail = t, Je(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = N.depsTail, t.nextDep = void 0, N.depsTail.nextDep = t, N.depsTail = t, N.deps === t && (N.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, Ge++, this.notify(e);
	}
	notify(e) {
		Me();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			Ne();
		}
	}
};
function Je(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) Je(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var Ye = /* @__PURE__ */ new WeakMap(), Xe = /* @__PURE__ */ Symbol(""), Ze = /* @__PURE__ */ Symbol(""), Qe = /* @__PURE__ */ Symbol("");
function P(e, t, n) {
	if (Be && N) {
		let t = Ye.get(e);
		t || Ye.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new qe()), r.map = t, r.key = n), r.track();
	}
}
function $e(e, t, n, r, i, a) {
	let o = Ye.get(e);
	if (!o) {
		Ge++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (Me(), t === "clear") o.forEach(s);
	else {
		let i = d(e), a = i && w(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === Qe || !_(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(Qe)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(Xe)), f(e) && s(o.get(Ze)));
				break;
			case "delete":
				i || (s(o.get(Xe)), f(e) && s(o.get(Ze)));
				break;
			case "set":
				f(e) && s(o.get(Xe));
				break;
		}
	}
	Ne();
}
function et(e) {
	let t = /* @__PURE__ */ F(e);
	return t === e ? t : (P(t, "iterate", Qe), /* @__PURE__ */ Bt(e) ? t : t.map(Ut));
}
function tt(e) {
	return P(e = /* @__PURE__ */ F(e), "iterate", Qe), e;
}
function nt(e, t) {
	return /* @__PURE__ */ zt(e) ? Wt(/* @__PURE__ */ Rt(e) ? Ut(t) : t) : Ut(t);
}
var rt = {
	__proto__: null,
	[Symbol.iterator]() {
		return it(this, Symbol.iterator, (e) => nt(this, e));
	},
	concat(...e) {
		return et(this).concat(...e.map((e) => d(e) ? et(e) : e));
	},
	entries() {
		return it(this, "entries", (e) => (e[1] = nt(this, e[1]), e));
	},
	every(e, t) {
		return ot(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return ot(this, "filter", e, t, (e) => e.map((e) => nt(this, e)), arguments);
	},
	find(e, t) {
		return ot(this, "find", e, t, (e) => nt(this, e), arguments);
	},
	findIndex(e, t) {
		return ot(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return ot(this, "findLast", e, t, (e) => nt(this, e), arguments);
	},
	findLastIndex(e, t) {
		return ot(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return ot(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return ct(this, "includes", e);
	},
	indexOf(...e) {
		return ct(this, "indexOf", e);
	},
	join(e) {
		return et(this).join(e);
	},
	lastIndexOf(...e) {
		return ct(this, "lastIndexOf", e);
	},
	map(e, t) {
		return ot(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return lt(this, "pop");
	},
	push(...e) {
		return lt(this, "push", e);
	},
	reduce(e, ...t) {
		return st(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return st(this, "reduceRight", e, t);
	},
	shift() {
		return lt(this, "shift");
	},
	some(e, t) {
		return ot(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return lt(this, "splice", e);
	},
	toReversed() {
		return et(this).toReversed();
	},
	toSorted(e) {
		return et(this).toSorted(e);
	},
	toSpliced(...e) {
		return et(this).toSpliced(...e);
	},
	unshift(...e) {
		return lt(this, "unshift", e);
	},
	values() {
		return it(this, "values", (e) => nt(this, e));
	}
};
function it(e, t, n) {
	let r = tt(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ Bt(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var at = Array.prototype;
function ot(e, t, n, r, i, a) {
	let o = tt(e), s = o !== e && !/* @__PURE__ */ Bt(e), c = o[t];
	if (c !== at[t]) {
		let t = c.apply(e, a);
		return s ? Ut(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, nt(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function st(e, t, n, r) {
	let i = tt(e), a = i !== e && !/* @__PURE__ */ Bt(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = nt(e, t)), n.call(this, t, nt(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? nt(e, c) : c;
}
function ct(e, t, n) {
	let r = /* @__PURE__ */ F(e);
	P(r, "iterate", Qe);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ Vt(n[0]) ? (n[0] = /* @__PURE__ */ F(n[0]), r[t](...n)) : i;
}
function lt(e, t, n = []) {
	He(), Me();
	let r = (/* @__PURE__ */ F(e))[t].apply(e, n);
	return Ne(), Ue(), r;
}
var ut = /* @__PURE__ */ e("__proto__,__v_isRef,__isVue"), dt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(_));
function ft(e) {
	_(e) || (e = String(e));
	let t = /* @__PURE__ */ F(this);
	return P(t, "has", e), t.hasOwnProperty(e);
}
var pt = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? jt : At : i ? kt : Ot).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = d(e);
		if (!r) {
			let e;
			if (a && (e = rt[t])) return e;
			if (t === "hasOwnProperty") return ft;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ I(e) ? e : n);
		if ((_(t) ? dt.has(t) : ut(t)) || (r || P(e, "get", t), i)) return o;
		if (/* @__PURE__ */ I(o)) {
			let e = a && w(t) ? o : o.value;
			return r && v(e) ? /* @__PURE__ */ It(e) : e;
		}
		return v(o) ? r ? /* @__PURE__ */ It(o) : /* @__PURE__ */ Pt(o) : o;
	}
}, mt = class extends pt {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = d(e) && w(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ zt(i);
			if (!/* @__PURE__ */ Bt(n) && !/* @__PURE__ */ zt(n) && (i = /* @__PURE__ */ F(i), n = /* @__PURE__ */ F(n)), !a && /* @__PURE__ */ I(i) && !/* @__PURE__ */ I(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : u(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ I(e) ? e : r);
		return e === /* @__PURE__ */ F(r) && (o ? k(n, i) && $e(e, "set", t, n, i) : $e(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = u(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && $e(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!_(t) || !dt.has(t)) && P(e, "has", t), n;
	}
	ownKeys(e) {
		return P(e, "iterate", d(e) ? "length" : Xe), Reflect.ownKeys(e);
	}
}, ht = class extends pt {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, gt = /* @__PURE__ */ new mt(), _t = /* @__PURE__ */ new ht(), vt = /* @__PURE__ */ new mt(!0), yt = (e) => e, bt = (e) => Reflect.getPrototypeOf(e);
function xt(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ F(i), o = f(a), c = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, u = i[e](...r), d = n ? yt : t ? Wt : Ut;
		return !t && P(a, "iterate", l ? Ze : Xe), s(Object.create(u), { next() {
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
function St(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function Ct(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ F(r), a = /* @__PURE__ */ F(n);
			e || (k(n, a) && P(i, "get", n), P(i, "get", a));
			let { has: o } = bt(i), s = t ? yt : e ? Wt : Ut;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && P(/* @__PURE__ */ F(t), "iterate", Xe), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ F(n), i = /* @__PURE__ */ F(t);
			return e || (k(t, i) && P(r, "has", t), P(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ F(a), s = t ? yt : e ? Wt : Ut;
			return !e && P(o, "iterate", Xe), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return s(n, e ? {
		add: St("add"),
		set: St("set"),
		delete: St("delete"),
		clear: St("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ F(this), r = bt(n), i = /* @__PURE__ */ F(e), a = !t && !/* @__PURE__ */ Bt(e) && !/* @__PURE__ */ zt(e) ? i : e;
			return r.has.call(n, a) || k(e, a) && r.has.call(n, e) || k(i, a) && r.has.call(n, i) || (n.add(a), $e(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ Bt(n) && !/* @__PURE__ */ zt(n) && (n = /* @__PURE__ */ F(n));
			let r = /* @__PURE__ */ F(this), { has: i, get: a } = bt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ F(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? k(n, s) && $e(r, "set", e, n, s) : $e(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ F(this), { has: n, get: r } = bt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ F(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && $e(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ F(this), t = e.size !== 0, n = e.clear();
			return t && $e(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = xt(r, e, t);
	}), n;
}
function wt(e, t) {
	let n = Ct(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(u(n, r) && r in t ? n : t, r, i);
}
var Tt = { get: /* @__PURE__ */ wt(!1, !1) }, Et = { get: /* @__PURE__ */ wt(!1, !0) }, Dt = { get: /* @__PURE__ */ wt(!0, !1) }, Ot = /* @__PURE__ */ new WeakMap(), kt = /* @__PURE__ */ new WeakMap(), At = /* @__PURE__ */ new WeakMap(), jt = /* @__PURE__ */ new WeakMap();
function Mt(e) {
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
function Nt(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : Mt(S(e));
}
/* @__NO_SIDE_EFFECTS__ */
function Pt(e) {
	return /* @__PURE__ */ zt(e) ? e : Lt(e, !1, gt, Tt, Ot);
}
/* @__NO_SIDE_EFFECTS__ */
function Ft(e) {
	return Lt(e, !1, vt, Et, kt);
}
/* @__NO_SIDE_EFFECTS__ */
function It(e) {
	return Lt(e, !0, _t, Dt, At);
}
function Lt(e, t, n, r, i) {
	if (!v(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = Nt(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function Rt(e) {
	return /* @__PURE__ */ zt(e) ? /* @__PURE__ */ Rt(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function zt(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function Bt(e) {
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
	return !u(e, "__v_skip") && Object.isExtensible(e) && A(e, "__v_skip", !0), e;
}
var Ut = (e) => v(e) ? /* @__PURE__ */ Pt(e) : e, Wt = (e) => v(e) ? /* @__PURE__ */ It(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function I(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function L(e) {
	return Gt(e, !1);
}
function Gt(e, t) {
	return /* @__PURE__ */ I(e) ? e : new Kt(e, t);
}
var Kt = class {
	constructor(e, t) {
		this.dep = new qe(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ F(e), this._value = t ? e : Ut(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ Bt(e) || /* @__PURE__ */ zt(e);
		e = n ? e : /* @__PURE__ */ F(e), k(e, t) && (this._rawValue = e, this._value = n ? e : Ut(e), this.dep.trigger());
	}
};
function R(e) {
	return /* @__PURE__ */ I(e) ? e.value : e;
}
var qt = {
	get: (e, t, n) => t === "__v_raw" ? e : R(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ I(i) && !/* @__PURE__ */ I(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Jt(e) {
	return /* @__PURE__ */ Rt(e) ? e : new Proxy(e, qt);
}
var Yt = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new qe(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Ge - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && N !== this) return je(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return Le(this), e && (e.version = this.dep.version), this._value;
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
	let { immediate: a, deep: o, once: s, scheduler: l, augmentJob: u, call: f } = i, p = (e) => o ? e : /* @__PURE__ */ Bt(e) || o === !1 || o === 0 ? nn(e, 1) : nn(e), m, g, _, v, y = !1, b = !1;
	if (/* @__PURE__ */ I(e) ? (g = () => e.value, y = /* @__PURE__ */ Bt(e)) : /* @__PURE__ */ Rt(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some((e) => /* @__PURE__ */ Rt(e) || /* @__PURE__ */ Bt(e)), g = () => e.map((e) => {
		if (/* @__PURE__ */ I(e)) return e.value;
		if (/* @__PURE__ */ Rt(e)) return p(e);
		if (h(e)) return f ? f(e, 2) : e();
	})) : g = h(e) ? n ? f ? () => f(e, 2) : e : () => {
		if (_) {
			He();
			try {
				_();
			} finally {
				Ue();
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
	let x = Te(), S = () => {
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
			if (o || y || (b ? e.some((e, t) => k(e, C[t])) : k(e, C))) {
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
	return u && u(w), m = new De(g), m.scheduler = l ? () => l(w, !1) : w, v = (e) => en(e, !1, m), _ = m.onStop = () => {
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
	if (n.set(e, t), t--, /* @__PURE__ */ I(e)) nn(e.value, t, n);
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
		on(e, t, n);
	}
}
function an(e, t, n, r) {
	if (h(e)) {
		let i = rn(e, t, n, r);
		return i && y(i) && i.catch((e) => {
			on(e, t, n);
		}), i;
	}
	if (d(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(an(e[a], t, n, r));
		return i;
	}
}
function on(e, n, r, i = !0) {
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
			He(), rn(o, null, 10, [
				e,
				i,
				a
			]), Ue();
			return;
		}
	}
	sn(e, r, a, i, s);
}
function sn(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var cn = [], ln = -1, un = [], dn = null, fn = 0, pn = /* @__PURE__ */ Promise.resolve(), mn = null;
function hn(e) {
	let t = mn || pn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function gn(e) {
	let t = ln + 1, n = cn.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = cn[r], a = Sn(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function _n(e) {
	if (!(e.flags & 1)) {
		let t = Sn(e), n = cn[cn.length - 1];
		!n || !(e.flags & 2) && t >= Sn(n) ? cn.push(e) : cn.splice(gn(t), 0, e), e.flags |= 1, vn();
	}
}
function vn() {
	mn ||= pn.then(Cn);
}
function yn(e) {
	d(e) ? un.push(...e) : dn && e.id === -1 ? dn.splice(fn + 1, 0, e) : e.flags & 1 || (un.push(e), e.flags |= 1), vn();
}
function bn(e, t, n = ln + 1) {
	for (; n < cn.length; n++) {
		let t = cn[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			cn.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function xn(e) {
	if (un.length) {
		let e = [...new Set(un)].sort((e, t) => Sn(e) - Sn(t));
		if (un.length = 0, dn) {
			dn.push(...e);
			return;
		}
		for (dn = e, fn = 0; fn < dn.length; fn++) {
			let e = dn[fn];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		dn = null, fn = 0;
	}
}
var Sn = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function Cn(e) {
	try {
		for (ln = 0; ln < cn.length; ln++) {
			let e = cn[ln];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), rn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; ln < cn.length; ln++) {
			let e = cn[ln];
			e && (e.flags &= -2);
		}
		ln = -1, cn.length = 0, xn(e), mn = null, (cn.length || un.length) && Cn(e);
	}
}
var wn = null, Tn = null;
function En(e) {
	let t = wn;
	return wn = e, Tn = e && e.type.__scopeId || null, t;
}
function Dn(e, t = wn, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && Ni(-1);
		let i = En(t), a;
		try {
			a = e(...n);
		} finally {
			En(i), r._d && Ni(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function On(e, n) {
	if (wn === null) return e;
	let r = pa(wn), i = e.dirs ||= [];
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
function kn(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (He(), an(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), Ue());
	}
}
function An(e, t) {
	if (q) {
		let n = q.provides, r = q.parent && q.parent.provides;
		r === n && (n = q.provides = Object.create(r)), n[e] = t;
	}
}
function jn(e, t, n = !1) {
	let r = Qi();
	if (r || Ir) {
		let i = Ir ? Ir._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t;
	}
}
var Mn = /* @__PURE__ */ Symbol.for("v-scx"), Nn = () => jn(Mn);
function z(e, t, n) {
	return Pn(e, t, n);
}
function Pn(e, n, i = t) {
	let { immediate: a, deep: o, flush: c, once: l } = i, u = s({}, i), d = n && a || !n && c !== "post", f;
	if (ia) {
		if (c === "sync") {
			let e = Nn();
			f = e.__watcherHandles ||= [];
		} else if (!d) {
			let e = () => {};
			return e.stop = r, e.resume = r, e.pause = r, e;
		}
	}
	let p = q;
	u.call = (e, t, n) => an(e, p, t, n);
	let m = !1;
	c === "post" ? u.scheduler = (e) => {
		pi(e, p && p.suspense);
	} : c !== "sync" && (m = !0, u.scheduler = (e, t) => {
		t ? e() : _n(e);
	}), u.augmentJob = (e) => {
		n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p));
	};
	let h = tn(e, n, u);
	return ia && (f ? f.push(h) : d && h()), h;
}
function Fn(e, t, n) {
	let r = this.proxy, i = g(e) ? e.includes(".") ? In(r, e) : () => r[e] : e.bind(r, r), a;
	h(t) ? a = t : (a = t.handler, n = t);
	let o = ta(this), s = Pn(i, a.bind(r), n);
	return o(), s;
}
function In(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var Ln = /* @__PURE__ */ Symbol("_vte"), Rn = (e) => e.__isTeleport, zn = /* @__PURE__ */ Symbol("_leaveCb");
function Bn(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, Bn(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function Vn(e, t) {
	return h(e) ? s({ name: e.name }, t, { setup: e }) : e;
}
function Hn(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function Un(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var Wn = /* @__PURE__ */ new WeakMap();
function Gn(e, n, r, a, o = !1) {
	if (d(e)) {
		e.forEach((e, t) => Gn(e, n && (d(n) ? n[t] : n), r, a, o));
		return;
	}
	if (qn(a) && !o) {
		a.shapeFlag & 512 && a.type.__asyncResolved && a.component.subTree.component && Gn(e, n, r, a.component.subTree);
		return;
	}
	let s = a.shapeFlag & 4 ? pa(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ F(v), b = v === t ? i : (e) => Un(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Un(_, t));
	if (m != null && m !== p) {
		if (Kn(n), g(m)) _[m] = null, b(m) && (v[m] = null);
		else if (/* @__PURE__ */ I(m)) {
			let e = n;
			x(m, e.k) && (m.value = null), e.k && (_[e.k] = null);
		}
	}
	if (h(p)) rn(p, f, 12, [l, _]);
	else {
		let t = g(p), n = /* @__PURE__ */ I(p);
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
					i(), Wn.delete(e);
				};
				t.id = -1, Wn.set(e, t), pi(t, r);
			} else Kn(e), i();
		}
	}
}
function Kn(e) {
	let t = Wn.get(e);
	t && (t.flags |= 8, Wn.delete(e));
}
ce().requestIdleCallback, ce().cancelIdleCallback;
var qn = (e) => !!e.type.__asyncLoader, Jn = (e) => e.type.__isKeepAlive;
function Yn(e, t) {
	Zn(e, "a", t);
}
function Xn(e, t) {
	Zn(e, "da", t);
}
function Zn(e, t, n = q) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if ($n(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) Jn(e.parent.vnode) && Qn(r, t, n, e), e = e.parent;
	}
}
function Qn(e, t, n, r) {
	let i = $n(t, e, r, !0);
	or(() => {
		c(r[t], i);
	}, n);
}
function $n(e, t, n = q, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			He();
			let i = ta(n), a = an(t, n, e, r);
			return i(), Ue(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var er = (e) => (t, n = q) => {
	(!ia || e === "sp") && $n(e, (...e) => t(...e), n);
}, tr = er("bm"), nr = er("m"), rr = er("bu"), ir = er("u"), ar = er("bum"), or = er("um"), sr = er("sp"), cr = er("rtg"), lr = er("rtc");
function ur(e, t = q) {
	$n("ec", e, t);
}
var dr = /* @__PURE__ */ Symbol.for("v-ndc");
function fr(e, t, n, r) {
	let i, a = n && n[r], o = d(e);
	if (o || g(e)) {
		let n = o && /* @__PURE__ */ Rt(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ Bt(e), s = /* @__PURE__ */ zt(e), e = tt(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Wt(Ut(e[n])) : Ut(e[n]) : e[n], n, void 0, a && a[n]);
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
var pr = (e) => e ? ra(e) ? pa(e) : pr(e.parent) : null, mr = /* @__PURE__ */ s(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => pr(e.parent),
	$root: (e) => pr(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => Cr(e),
	$forceUpdate: (e) => e.f ||= () => {
		_n(e.update);
	},
	$nextTick: (e) => e.n ||= hn.bind(e.proxy),
	$watch: (e) => Fn.bind(e)
}), hr = (e, n) => e !== t && !e.__isScriptSetup && u(e, n), gr = {
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
			else if (hr(i, n)) return s[n] = 1, i[n];
			else if (a !== t && u(a, n)) return s[n] = 2, a[n];
			else if (u(o, n)) return s[n] = 3, o[n];
			else if (r !== t && u(r, n)) return s[n] = 4, r[n];
			else vr && (s[n] = 0);
		}
		let d = mr[n], f, p;
		if (d) return n === "$attrs" && P(e.attrs, "get", ""), d(e);
		if ((f = c.__cssModules) && (f = f[n])) return f;
		if (r !== t && u(r, n)) return s[n] = 4, r[n];
		if (p = l.config.globalProperties, u(p, n)) return p[n];
	},
	set({ _: e }, n, r) {
		let { data: i, setupState: a, ctx: o } = e;
		return hr(a, n) ? (a[n] = r, !0) : i !== t && u(i, n) ? (i[n] = r, !0) : u(e.props, n) || n[0] === "$" && n.slice(1) in e ? !1 : (o[n] = r, !0);
	},
	has({ _: { data: e, setupState: n, accessCache: r, ctx: i, appContext: a, props: o, type: s } }, c) {
		let l;
		return !!(r[c] || e !== t && c[0] !== "$" && u(e, c) || hr(n, c) || u(o, c) || u(i, c) || u(mr, c) || u(a.config.globalProperties, c) || (l = s.__cssModules) && l[c]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? u(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function _r(e) {
	return d(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var vr = !0;
function yr(e) {
	let t = Cr(e), n = e.proxy, i = e.ctx;
	vr = !1, t.beforeCreate && xr(t.beforeCreate, e, "bc");
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: ee, renderTracked: T, renderTriggered: te, errorCaptured: E, serverPrefetch: ne, expose: D, inheritAttrs: O, components: re, directives: k, filters: ie } = t;
	if (u && br(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Pt(t));
	}
	if (vr = !0, o) for (let e in o) {
		let t = o[e], a = J({
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
	if (c) for (let e in c) Sr(c[e], i, n, e);
	if (l) {
		let e = h(l) ? l.call(n) : l;
		Reflect.ownKeys(e).forEach((t) => {
			An(t, e[t]);
		});
	}
	f && xr(f, e, "c");
	function A(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (A(tr, p), A(nr, m), A(rr, g), A(ir, _), A(Yn, y), A(Xn, b), A(ur, E), A(lr, T), A(cr, te), A(ar, S), A(or, w), A(sr, ne), d(D)) if (D.length) {
		let t = e.exposed ||= {};
		D.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	ee && e.render === r && (e.render = ee), O != null && (e.inheritAttrs = O), re && (e.components = re), k && (e.directives = k), ne && Hn(e);
}
function br(e, t, n = r) {
	d(e) && (e = Or(e));
	for (let n in e) {
		let r = e[n], i;
		i = v(r) ? "default" in r ? jn(r.from || n, r.default, !0) : jn(r.from || n) : jn(r), /* @__PURE__ */ I(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function xr(e, t, n) {
	an(d(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function Sr(e, t, n, r) {
	let i = r.includes(".") ? In(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && z(i, n);
	} else if (h(e)) z(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => Sr(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && z(i, r, e);
	}
}
function Cr(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => wr(c, e, o, !0)), wr(c, t, o)), v(t) && a.set(t, c), c;
}
function wr(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && wr(e, a, n, !0), i && i.forEach((t) => wr(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = Tr[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var Tr = {
	data: Er,
	props: jr,
	emits: jr,
	methods: Ar,
	computed: Ar,
	beforeCreate: kr,
	created: kr,
	beforeMount: kr,
	mounted: kr,
	beforeUpdate: kr,
	updated: kr,
	beforeDestroy: kr,
	beforeUnmount: kr,
	destroyed: kr,
	unmounted: kr,
	activated: kr,
	deactivated: kr,
	errorCaptured: kr,
	serverPrefetch: kr,
	components: Ar,
	directives: Ar,
	watch: Mr,
	provide: Er,
	inject: Dr
};
function Er(e, t) {
	return t ? e ? function() {
		return s(h(e) ? e.call(this, this) : e, h(t) ? t.call(this, this) : t);
	} : t : e;
}
function Dr(e, t) {
	return Ar(Or(e), Or(t));
}
function Or(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function kr(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function Ar(e, t) {
	return e ? s(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function jr(e, t) {
	return e ? d(e) && d(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : s(/* @__PURE__ */ Object.create(null), _r(e), _r(t ?? {})) : t;
}
function Mr(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = s(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = kr(e[r], t[r]);
	return n;
}
function Nr() {
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
var Pr = 0;
function Fr(e, t) {
	return function(n, r = null) {
		h(n) || (n = s({}, n)), r != null && !v(r) && (r = null);
		let i = Nr(), a = /* @__PURE__ */ new WeakSet(), o = [], c = !1, l = i.app = {
			_uid: Pr++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: ha,
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
					let u = l._ceVNode || W(n, r);
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, pa(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				c && (an(o, l._instance, 16), e(null, l._container), delete l._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, l;
			},
			runWithContext(e) {
				let t = Ir;
				Ir = l;
				try {
					return e();
				} finally {
					Ir = t;
				}
			}
		};
		return l;
	};
}
var Ir = null, Lr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${E(t)}Modifiers`] || e[`${D(t)}Modifiers`];
function Rr(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && Lr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(ae)));
	let c, l = i[c = re(n)] || i[c = re(E(n))];
	!l && o && (l = i[c = re(D(n))]), l && an(l, e, 6, a);
	let u = i[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, an(u, e, 6, a);
	}
}
var zr = /* @__PURE__ */ new WeakMap();
function Br(e, t, n = !1) {
	let r = n ? zr : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, c = !1;
	if (!h(e)) {
		let r = (e) => {
			let n = Br(e, t, !0);
			n && (c = !0, s(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !c ? (v(e) && r.set(e, null), null) : (d(a) ? a.forEach((e) => o[e] = null) : s(o, a), v(e) && r.set(e, o), o);
}
function Vr(e, t) {
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, D(t)) || u(e, t));
}
function Hr(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: s, attrs: c, emit: l, render: u, renderCache: d, props: f, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = En(e), v, y;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			v = Wi(u.call(t, e, d, f, m, p, h)), y = c;
		} else {
			let e = t;
			v = Wi(e.length > 1 ? e(f, {
				attrs: c,
				slots: s,
				emit: l
			}) : e(f, null)), y = t.props ? c : Ur(c);
		}
	} catch (t) {
		ki.length = 0, on(t, e, 1), v = W(Di);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = Wr(y, a)), b = Hi(b, y, !1, !0));
	}
	return n.dirs && (b = Hi(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && Bn(b, n.transition), v = b, En(_), v;
}
var Ur = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || a(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, Wr = (e, t) => {
	let n = {};
	for (let r in e) (!o(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function Gr(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? Kr(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (qr(o, r, n) && !Vr(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? Kr(r, o, l) : !0 : !!o;
	return !1;
}
function Kr(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (qr(t, e, a) && !Vr(n, a)) return !0;
	}
	return !1;
}
function qr(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && v(r) && v(i) ? !ye(r, i) : r !== i;
}
function Jr({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var Yr = {}, Xr = () => Object.create(Yr), Zr = (e) => Object.getPrototypeOf(e) === Yr;
function Qr(e, t, n, r = !1) {
	let i = {}, a = Xr();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), ei(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ Ft(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function $r(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ F(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (Vr(e.emitsOptions, o)) continue;
				let d = t[o];
				if (c) if (u(a, o)) d !== a[o] && (a[o] = d, l = !0);
				else {
					let t = E(o);
					i[t] = ti(c, s, t, d, e, !1);
				}
				else d !== a[o] && (a[o] = d, l = !0);
			}
		}
	} else {
		ei(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !u(t, a) && ((r = D(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = ti(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !u(t, e)) && (delete a[e], l = !0);
	}
	l && $e(e.attrs, "set", "");
}
function ei(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (ee(t)) continue;
		let l = n[t], d;
		a && u(a, d = E(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : Vr(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ F(r), i = c || t;
		for (let t = 0; t < o.length; t++) {
			let s = o[t];
			r[s] = ti(a, n, s, i[s], e, !u(i, s));
		}
	}
	return s;
}
function ti(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = u(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && h(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = ta(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === D(n)) && (r = !0));
	}
	return r;
}
var ni = /* @__PURE__ */ new WeakMap();
function ri(e, r, i = !1) {
	let a = i ? ni : r.propsCache, o = a.get(e);
	if (o) return o;
	let c = e.props, l = {}, f = [], p = !1;
	if (!h(e)) {
		let t = (e) => {
			p = !0;
			let [t, n] = ri(e, r, !0);
			s(l, t), n && f.push(...n);
		};
		!i && r.mixins.length && r.mixins.forEach(t), e.extends && t(e.extends), e.mixins && e.mixins.forEach(t);
	}
	if (!c && !p) return v(e) && a.set(e, n), n;
	if (d(c)) for (let e = 0; e < c.length; e++) {
		let n = E(c[e]);
		ii(n) && (l[n] = t);
	}
	else if (c) for (let e in c) {
		let t = E(e);
		if (ii(t)) {
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
function ii(e) {
	return e[0] !== "$" && !ee(e);
}
var ai = (e) => e === "_" || e === "_ctx" || e === "$stable", oi = (e) => d(e) ? e.map(Wi) : [Wi(e)], si = (e, t, n) => {
	if (t._n) return t;
	let r = Dn((...e) => oi(t(...e)), n);
	return r._c = !1, r;
}, ci = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (ai(n)) continue;
		let i = e[n];
		if (h(i)) t[n] = si(n, i, r);
		else if (i != null) {
			let e = oi(i);
			t[n] = () => e;
		}
	}
}, li = (e, t) => {
	let n = oi(t);
	e.slots.default = () => n;
}, ui = (e, t, n) => {
	for (let r in t) (n || !ai(r)) && (e[r] = t[r]);
}, di = (e, t, n) => {
	let r = e.slots = Xr();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (ui(r, t, n), n && A(r, "_", e, !0)) : ci(t, r);
	} else t && li(e, t);
}, fi = (e, n, r) => {
	let { vnode: i, slots: a } = e, o = !0, s = t;
	if (i.shapeFlag & 32) {
		let e = n._;
		e ? r && e === 1 ? o = !1 : ui(a, n, r) : (o = !n.$stable, ci(n, a)), s = n;
	} else n && (li(e, n), s = { default: 1 });
	if (o) for (let e in a) !ai(e) && s[e] == null && delete a[e];
}, pi = Ti;
function mi(e) {
	return hi(e);
}
function hi(e, i) {
	let a = ce();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Li(e, t) && (r = ve(e), pe(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case Ei:
				y(e, t, n, r);
				break;
			case Di:
				b(e, t, n, r);
				break;
			case Oi:
				e ?? x(t, n, r, o);
				break;
			case B:
				re(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? k(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, xe);
		}
		u != null && i ? Gn(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && Gn(e.ref, null, a, e, !0);
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
		if (t.type === "svg" ? o = "svg" : t.type === "math" && (o = "mathml"), e == null) T(t, n, r, i, a, o, s, c);
		else {
			let n = e.el && e.el._isVueCE ? e.el : null;
			try {
				n && n._beginPatch(), ne(e, t, i, a, o, s, c);
			} finally {
				n && n._endPatch();
			}
		}
	}, T = (e, t, n, r, i, a, s, u) => {
		let d, f, { props: m, shapeFlag: h, transition: g, dirs: _ } = e;
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && E(e.children, d, null, r, i, gi(e, a), s, u), _ && kn(e, null, r, "created"), te(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !ee(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Ji(f, r, e);
		}
		_ && kn(e, null, r, "beforeMount");
		let v = vi(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && pi(() => {
			try {
				f && Ji(f, r, e), v && g.enter(d), _ && kn(e, null, r, "mounted");
			} finally {}
		}, i);
	}, te = (e, t, n, r, i) => {
		if (n && g(e, n), r) for (let t = 0; t < r.length; t++) g(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || wi(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				te(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, E = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? Gi(e[l]) : Wi(e[l]), t, n, r, i, a, o, s);
	}, ne = (e, n, r, i, a, o, s) => {
		let l = n.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = n;
		u |= e.patchFlag & 16;
		let m = e.props || t, h = n.props || t, g;
		if (r && _i(r, !1), (g = h.onVnodeBeforeUpdate) && Ji(g, r, n, e), f && kn(n, e, r, "beforeUpdate"), r && _i(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? D(e.dynamicChildren, d, l, r, i, gi(n, a), o) : s || le(e, n, l, null, r, i, gi(n, a), o, !1), u > 0) {
			if (u & 16) O(l, m, h, r, a);
			else if (u & 2 && m.class !== h.class && c(l, "class", null, h.class, a), u & 4 && c(l, "style", m.style, h.style, a), u & 8) {
				let e = n.dynamicProps;
				for (let t = 0; t < e.length; t++) {
					let n = e[t], i = m[n], o = h[n];
					(o !== i || n === "value") && c(l, n, i, o, a, r);
				}
			}
			u & 1 && e.children !== n.children && p(l, n.children);
		} else !s && d == null && O(l, m, h, r, a);
		((g = h.onVnodeUpdated) || f) && pi(() => {
			g && Ji(g, r, n, e), f && kn(n, e, r, "updated");
		}, i);
	}, D = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === B || !Li(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
		}
	}, O = (e, n, r, i, a) => {
		if (n !== r) {
			if (n !== t) for (let t in n) !ee(t) && !(t in r) && c(e, t, n[t], null, a, i);
			for (let t in r) {
				if (ee(t)) continue;
				let o = r[t], s = n[t];
				o !== s && t !== "value" && c(e, t, s, o, a, i);
			}
			"value" in r && c(e, "value", n.value, r.value, a);
		}
	}, re = (e, t, n, r, i, a, s, c, l) => {
		let d = t.el = e ? e.el : u(""), f = t.anchor = e ? e.anchor : u(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), E(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (D(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && yi(e, t, !0)) : le(e, t, n, f, i, a, s, c, l);
	}, k = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : A(t, n, r, i, a, o, c) : ae(e, t, c);
	}, A = (e, t, n, r, i, a, o) => {
		let s = e.component = Zi(e, r, i);
		if (Jn(e) && (s.ctx.renderer = xe), aa(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, oe, o), !e.el) {
				let r = s.subTree = W(Di);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else oe(s, e, t, n, i, a, o);
	}, ae = (e, t, n) => {
		let r = t.component = e.component;
		if (Gr(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			se(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, oe = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = xi(e);
					if (n) {
						t && (t.el = c.el, se(e, t, o)), n.asyncDep.then(() => {
							pi(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				_i(e, !1), t ? (t.el = c.el, se(e, t, o)) : t = c, n && ie(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Ji(d, s, t, c), _i(e, !0);
				let f = Hr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ve(p), e, i, a), t.el = f.el, u === null && Jr(e, f.el), r && pi(r, i), (d = t.props && t.props.onVnodeUpdated) && pi(() => Ji(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = qn(t);
				if (_i(e, !1), l && ie(l), !m && (o = c && c.onVnodeBeforeMount) && Ji(o, d, t), _i(e, !0), s && Se) {
					let t = () => {
						e.subTree = Hr(e), Se(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Hr(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && pi(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					pi(() => Ji(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && qn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && pi(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new De(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => _n(u), _i(e, !0), l();
	}, se = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, $r(e, t.props, r, n), fi(e, t.children, n), He(), bn(e), Ue();
	}, le = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, u = e ? e.shapeFlag : 0, d = t.children, { patchFlag: f, shapeFlag: m } = t;
		if (f > 0) {
			if (f & 128) {
				de(l, d, n, r, i, a, o, s, c);
				return;
			} else if (f & 256) {
				ue(l, d, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (u & 16 && _e(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? de(l, d, n, r, i, a, o, s, c) : _e(l, i, a, !0) : (u & 8 && p(n, ""), m & 16 && E(d, n, r, i, a, o, s, c));
	}, ue = (e, t, r, i, a, o, s, c, l) => {
		e ||= n, t ||= n;
		let u = e.length, d = t.length, f = Math.min(u, d), p;
		for (p = 0; p < f; p++) {
			let n = t[p] = l ? Gi(t[p]) : Wi(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? _e(e, a, o, !0, !1, f) : E(t, r, i, a, o, s, c, l, f);
	}, de = (e, t, r, i, a, o, s, c, l) => {
		let u = 0, d = t.length, f = e.length - 1, p = d - 1;
		for (; u <= f && u <= p;) {
			let n = e[u], i = t[u] = l ? Gi(t[u]) : Wi(t[u]);
			if (Li(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			u++;
		}
		for (; u <= f && u <= p;) {
			let n = e[f], i = t[p] = l ? Gi(t[p]) : Wi(t[p]);
			if (Li(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			f--, p--;
		}
		if (u > f) {
			if (u <= p) {
				let e = p + 1, n = e < d ? t[e].el : i;
				for (; u <= p;) v(null, t[u] = l ? Gi(t[u]) : Wi(t[u]), r, n, a, o, s, c, l), u++;
			}
		} else if (u > p) for (; u <= f;) pe(e[u], a, o, !0), u++;
		else {
			let m = u, h = u, g = /* @__PURE__ */ new Map();
			for (u = h; u <= p; u++) {
				let e = t[u] = l ? Gi(t[u]) : Wi(t[u]);
				e.key != null && g.set(e.key, u);
			}
			let _, y = 0, b = p - h + 1, x = !1, S = 0, C = Array(b);
			for (u = 0; u < b; u++) C[u] = 0;
			for (u = m; u <= f; u++) {
				let n = e[u];
				if (y >= b) {
					pe(n, a, o, !0);
					continue;
				}
				let i;
				if (n.key != null) i = g.get(n.key);
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && Li(n, t[_])) {
					i = _;
					break;
				}
				i === void 0 ? pe(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++);
			}
			let w = x ? bi(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || Ci(f) : i;
				C[u] === 0 ? v(null, n, r, p, a, o, s, c, l) : x && (_ < 0 || u !== w[_] ? fe(n, r, p, 2) : _--);
			}
		}
	}, fe = (e, t, n, r, i = null) => {
		let { el: a, type: c, transition: l, children: u, shapeFlag: d } = e;
		if (d & 6) {
			fe(e.component.subTree, t, n, r);
			return;
		}
		if (d & 128) {
			e.suspense.move(t, n, r);
			return;
		}
		if (d & 64) {
			c.move(e, t, n, xe);
			return;
		}
		if (c === B) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) fe(u[e], t, n, r);
			o(e.anchor, t, n);
			return;
		}
		if (c === Oi) {
			S(e, t, n);
			return;
		}
		if (r !== 2 && d & 1 && l) if (r === 0) l.beforeEnter(a), o(a, t, n), pi(() => l.enter(a), i);
		else {
			let { leave: r, delayLeave: i, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? s(a) : o(a, t, n);
			}, d = () => {
				a._isLeaving && a[zn](!0), r(a, () => {
					u(), c && c();
				});
			};
			i ? i(a, u, d) : d();
		}
		else o(a, t, n);
	}, pe = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (He(), Gn(s, null, n, e, !0), Ue()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !qn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Ji(_, t, e), u & 6) ge(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && kn(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, xe, r) : l && !l.hasOnce && (a !== B || d > 0 && d & 64) ? _e(l, t, n, !1, !0) : (a === B && d & 384 || !i && u & 16) && _e(c, t, n), r && me(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && pi(() => {
			_ && Ji(_, t, e), h && kn(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, me = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === B) {
			he(n, r);
			return;
		}
		if (t === Oi) {
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
	}, he = (e, t) => {
		let n;
		for (; e !== t;) n = h(e), s(e), e = n;
		s(t);
	}, ge = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		Si(c), Si(l), r && ie(r), i.stop(), a && (a.flags |= 8, pe(o, e, t, n)), s && pi(s, t), pi(() => {
			e.isUnmounted = !0;
		}, t);
	}, _e = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) pe(e[o], t, n, r, i);
	}, ve = (e) => {
		if (e.shapeFlag & 6) return ve(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[Ln];
		return n ? h(n) : t;
	}, ye = !1, be = (e, t, n) => {
		let r;
		e == null ? t._vnode && (pe(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, ye ||= (ye = !0, bn(r), xn(), !1);
	}, xe = {
		p: v,
		um: pe,
		m: fe,
		r: me,
		mt: A,
		mc: E,
		pc: le,
		pbc: D,
		n: ve,
		o: e
	}, j, Se;
	return i && ([j, Se] = i(xe)), {
		render: be,
		hydrate: j,
		createApp: Fr(be, j)
	};
}
function gi({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function _i({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function vi(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function yi(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (d(r) && d(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Gi(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && yi(t, a)), a.type === Ei && (a.patchFlag === -1 && (a = i[e] = Gi(a)), a.el = t.el), a.type === Di && !a.el && (a.el = t.el);
	}
}
function bi(e) {
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
function xi(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : xi(t);
}
function Si(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function Ci(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? Ci(t.subTree) : null;
}
var wi = (e) => e.__isSuspense;
function Ti(e, t) {
	t && t.pendingBranch ? d(e) ? t.effects.push(...e) : t.effects.push(e) : yn(e);
}
var B = /* @__PURE__ */ Symbol.for("v-fgt"), Ei = /* @__PURE__ */ Symbol.for("v-txt"), Di = /* @__PURE__ */ Symbol.for("v-cmt"), Oi = /* @__PURE__ */ Symbol.for("v-stc"), ki = [], Ai = null;
function V(e = !1) {
	ki.push(Ai = e ? null : []);
}
function ji() {
	ki.pop(), Ai = ki[ki.length - 1] || null;
}
var Mi = 1;
function Ni(e, t = !1) {
	Mi += e, e < 0 && Ai && t && (Ai.hasOnce = !0);
}
function Pi(e) {
	return e.dynamicChildren = Mi > 0 ? Ai || n : null, ji(), Mi > 0 && Ai && Ai.push(e), e;
}
function H(e, t, n, r, i, a) {
	return Pi(U(e, t, n, r, i, a, !0));
}
function Fi(e, t, n, r, i) {
	return Pi(W(e, t, n, r, i, !0));
}
function Ii(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function Li(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Ri = ({ key: e }) => e ?? null, zi = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ I(e) || h(e) ? {
	i: wn,
	r: e,
	k: t,
	f: !!n
} : e);
function U(e, t = null, n = null, r = 0, i = null, a = e === B ? 0 : 1, o = !1, s = !1) {
	let c = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e,
		props: t,
		key: t && Ri(t),
		ref: t && zi(t),
		scopeId: Tn,
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
		ctx: wn
	};
	return s ? (Ki(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Mi > 0 && !o && Ai && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && Ai.push(c), c;
}
var W = Bi;
function Bi(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === dr) && (e = Di), Ii(e)) {
		let r = Hi(e, t, !0);
		return n && Ki(r, n), Mi > 0 && !a && Ai && (r.shapeFlag & 6 ? Ai[Ai.indexOf(e)] = r : Ai.push(r)), r.patchFlag = -2, r;
	}
	if (ma(e) && (e = e.__vccOpts), t) {
		t = Vi(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = me(e)), v(n) && (/* @__PURE__ */ Vt(n) && !d(n) && (n = s({}, n)), t.style = le(n));
	}
	let o = g(e) ? 1 : wi(e) ? 128 : Rn(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return U(e, t, n, r, i, o, a, !0);
}
function Vi(e) {
	return e ? /* @__PURE__ */ Vt(e) || Zr(e) ? s({}, e) : e : null;
}
function Hi(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? qi(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && Ri(l),
		ref: t && t.ref ? n && a ? d(a) ? a.concat(zi(t)) : [a, zi(t)] : zi(t) : a,
		scopeId: e.scopeId,
		slotScopeIds: e.slotScopeIds,
		children: s,
		target: e.target,
		targetStart: e.targetStart,
		targetAnchor: e.targetAnchor,
		staticCount: e.staticCount,
		shapeFlag: e.shapeFlag,
		patchFlag: t && e.type !== B ? o === -1 ? 16 : o | 16 : o,
		dynamicProps: e.dynamicProps,
		dynamicChildren: e.dynamicChildren,
		appContext: e.appContext,
		dirs: e.dirs,
		transition: c,
		component: e.component,
		suspense: e.suspense,
		ssContent: e.ssContent && Hi(e.ssContent),
		ssFallback: e.ssFallback && Hi(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && Bn(u, c.clone(u)), u;
}
function G(e = " ", t = 0) {
	return W(Ei, null, e, t);
}
function Ui(e, t) {
	let n = W(Oi, null, e);
	return n.staticCount = t, n;
}
function K(e = "", t = !1) {
	return t ? (V(), Fi(Di, null, e)) : W(Di, null, e);
}
function Wi(e) {
	return e == null || typeof e == "boolean" ? W(Di) : d(e) ? W(B, null, e.slice()) : Ii(e) ? Gi(e) : W(Ei, null, String(e));
}
function Gi(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : Hi(e);
}
function Ki(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (d(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), Ki(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Zr(t) ? t._ctx = wn : r === 3 && wn && (wn.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: wn
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [G(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function qi(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = me([t.class, r.class]));
		else if (e === "style") t.style = le([t.style, r.style]);
		else if (a(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(d(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !o(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Ji(e, t, n, r = null) {
	an(e, t, 7, [n, r]);
}
var Yi = Nr(), Xi = 0;
function Zi(e, n, r) {
	let i = e.type, a = (n ? n.appContext : e.appContext) || Yi, o = {
		uid: Xi++,
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
		scope: new we(!0),
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
		propsOptions: ri(i, a),
		emitsOptions: Br(i, a),
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
	return o.ctx = { _: o }, o.root = n ? n.root : o, o.emit = Rr.bind(null, o), e.ce && e.ce(o), o;
}
var q = null, Qi = () => q || wn, $i, ea;
{
	let e = ce(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	$i = t("__VUE_INSTANCE_SETTERS__", (e) => q = e), ea = t("__VUE_SSR_SETTERS__", (e) => ia = e);
}
var ta = (e) => {
	let t = q;
	return $i(e), e.scope.on(), () => {
		e.scope.off(), $i(t);
	};
}, na = () => {
	q && q.scope.off(), $i(null);
};
function ra(e) {
	return e.vnode.shapeFlag & 4;
}
var ia = !1;
function aa(e, t = !1, n = !1) {
	t && ea(t);
	let { props: r, children: i } = e.vnode, a = ra(e);
	Qr(e, r, a, t), di(e, i, n || t);
	let o = a ? oa(e, t) : void 0;
	return t && ea(!1), o;
}
function oa(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, gr);
	let { setup: r } = n;
	if (r) {
		He();
		let n = e.setupContext = r.length > 1 ? fa(e) : null, i = ta(e), a = rn(r, e, 0, [e.props, n]), o = y(a);
		if (Ue(), i(), (o || e.sp) && !qn(e) && Hn(e), o) {
			if (a.then(na, na), t) return a.then((n) => {
				sa(e, n, t);
			}).catch((t) => {
				on(t, e, 0);
			});
			e.asyncDep = a;
		} else sa(e, a, t);
	} else ua(e, t);
}
function sa(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = Jt(t)), ua(e, n);
}
var ca, la;
function ua(e, t, n) {
	let i = e.type;
	if (!e.render) {
		if (!t && ca && !i.render) {
			let t = i.template || Cr(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: r } = e.appContext.config, { delimiters: a, compilerOptions: o } = i;
				i.render = ca(t, s(s({
					isCustomElement: n,
					delimiters: a
				}, r), o));
			}
		}
		e.render = i.render || r, la && la(e);
	}
	{
		let t = ta(e);
		He();
		try {
			yr(e);
		} finally {
			Ue(), t();
		}
	}
}
var da = { get(e, t) {
	return P(e, "get", ""), e[t];
} };
function fa(e) {
	return {
		attrs: new Proxy(e.attrs, da),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function pa(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(Jt(Ht(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in mr) return mr[n](e);
		},
		has(e, t) {
			return t in e || t in mr;
		}
	}) : e.proxy;
}
function ma(e) {
	return h(e) && "__vccOpts" in e;
}
var J = (e, t) => /* @__PURE__ */ Xt(e, t, ia), ha = "3.5.34", ga = void 0, _a = typeof window < "u" && window.trustedTypes;
if (_a) try {
	ga = /* @__PURE__ */ _a.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var va = ga ? (e) => ga.createHTML(e) : (e) => e, ya = "http://www.w3.org/2000/svg", ba = "http://www.w3.org/1998/Math/MathML", xa = typeof document < "u" ? document : null, Sa = xa && /* @__PURE__ */ xa.createElement("template"), Ca = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? xa.createElementNS(ya, e) : t === "mathml" ? xa.createElementNS(ba, e) : n ? xa.createElement(e, { is: n }) : xa.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => xa.createTextNode(e),
	createComment: (e) => xa.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => xa.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			Sa.innerHTML = va(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = Sa.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, wa = /* @__PURE__ */ Symbol("_vtc");
function Ta(e, t, n) {
	let r = e[wa];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var Ea = /* @__PURE__ */ Symbol("_vod"), Da = /* @__PURE__ */ Symbol("_vsh"), Oa = /* @__PURE__ */ Symbol(""), ka = /(?:^|;)\s*display\s*:/;
function Aa(e, t, n) {
	let r = e.style, i = g(n), a = !1;
	if (n && !i) {
		if (t) if (g(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? Ma(r, t, "");
		}
		else for (let e in t) n[e] ?? Ma(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? Ma(r, i, "") : Ia(e, i, !g(t) && t ? t[i] : void 0, o) || Ma(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[Oa];
			e && (n += ";" + e), r.cssText = n, a = ka.test(n);
		}
	} else t && e.removeAttribute("style");
	Ea in e && (e[Ea] = a ? r.display : "", e[Da] && (r.display = "none"));
}
var ja = /\s*!important$/;
function Ma(e, t, n) {
	if (d(n)) n.forEach((n) => Ma(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = Fa(e, t);
		ja.test(n) ? e.setProperty(D(r), n.replace(ja, ""), "important") : e[r] = n;
	}
}
var Na = [
	"Webkit",
	"Moz",
	"ms"
], Pa = {};
function Fa(e, t) {
	let n = Pa[t];
	if (n) return n;
	let r = E(t);
	if (r !== "filter" && r in e) return Pa[t] = r;
	r = O(r);
	for (let n = 0; n < Na.length; n++) {
		let i = Na[n] + r;
		if (i in e) return Pa[t] = i;
	}
	return t;
}
function Ia(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && g(r) && n === r;
}
var La = "http://www.w3.org/1999/xlink";
function Ra(e, t, n, r, i, a = ge(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(La, t.slice(6, t.length)) : e.setAttributeNS(La, t, n) : n == null || a && !_e(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
}
function za(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? va(n) : n);
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
		r === "boolean" ? n = _e(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
	}
	try {
		e[t] = n;
	} catch {}
	o && e.removeAttribute(i || t);
}
function Ba(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function Va(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var Ha = /* @__PURE__ */ Symbol("_vei");
function Ua(e, t, n, r, i = null) {
	let a = e[Ha] || (e[Ha] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = Ga(t);
		r ? Ba(e, n, a[t] = Ya(r, i), s) : o && (Va(e, n, o, s), a[t] = void 0);
	}
}
var Wa = /(?:Once|Passive|Capture)$/;
function Ga(e) {
	let t;
	if (Wa.test(e)) {
		t = {};
		let n;
		for (; n = e.match(Wa);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : D(e.slice(2)), t];
}
var Ka = 0, qa = /* @__PURE__ */ Promise.resolve(), Ja = () => Ka ||= (qa.then(() => Ka = 0), Date.now());
function Ya(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		an(Xa(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Ja(), n;
}
function Xa(e, t) {
	if (d(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Za = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Qa = (e, t, n, r, i, s) => {
	let c = i === "svg";
	t === "class" ? Ta(e, r, c) : t === "style" ? Aa(e, n, r) : a(t) ? o(t) || Ua(e, t, n, r, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : $a(e, t, r, c)) ? (za(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ra(e, t, r, c, s, t !== "value")) : e._isVueCE && (eo(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r))) ? za(e, E(t), r, s, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Ra(e, t, r, c));
};
function $a(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Za(t) && h(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Za(t) && g(n) ? !1 : t in e;
}
function eo(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = E(t);
	return Array.isArray(n) ? n.some((e) => E(e) === r) : Object.keys(n).some((e) => E(e) === r);
}
var to = {};
/* @__NO_SIDE_EFFECTS__ */
function no(e, t, n) {
	let r = /* @__PURE__ */ Vn(e, t);
	C(r) && (r = s({}, r, t));
	class i extends io {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var ro = typeof HTMLElement < "u" ? HTMLElement : class {}, io = class e extends ro {
	constructor(e, t = {}, n = wo) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== wo ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, hn(() => {
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
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = oe(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[E(e)] = !0);
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
		if (t) for (let e in t) u(this, e) || Object.defineProperty(this, e, { get: () => R(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = d(t) ? t : Object.keys(t || {});
		for (let e of Object.keys(this)) e[0] !== "_" && n.includes(e) && this._setProp(e, this[e]);
		for (let e of n.map(E)) Object.defineProperty(this, e, {
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : to, r = E(e);
		t && this._numberProps && this._numberProps[r] && (n = oe(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === to ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(D(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(D(e), t + "") : t || this.removeAttribute(D(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), Co(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = W(this._def, s(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, C(t[0]) ? s({ detail: t }, t[0]) : { detail: t }));
			};
			e.emit = (e, ...n) => {
				t(e, n), D(e) !== e && t(D(e), n);
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
}, ao = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return d(t) ? (e) => ie(t, e) : t;
};
function oo(e) {
	e.target.composing = !0;
}
function so(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var co = /* @__PURE__ */ Symbol("_assign");
function lo(e, t, n) {
	return t && (e = e.trim()), n && (e = ae(e)), e;
}
var uo = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e[co] = ao(i);
		let a = r || i.props && i.props.type === "number";
		Ba(e, t ? "change" : "input", (t) => {
			t.target.composing || e[co](lo(e.value, n, a));
		}), (n || a) && Ba(e, "change", () => {
			e.value = lo(e.value, n, a);
		}), t || (Ba(e, "compositionstart", oo), Ba(e, "compositionend", so), Ba(e, "change", so));
	},
	mounted(e, { value: t }) {
		e.value = t ?? "";
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[co] = ao(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? ae(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, fo = {
	deep: !0,
	created(e, { value: t, modifiers: { number: n } }, r) {
		let i = p(t);
		Ba(e, "change", () => {
			let t = Array.prototype.filter.call(e.options, (e) => e.selected).map((e) => n ? ae(mo(e)) : mo(e));
			e[co](e.multiple ? i ? new Set(t) : t : t[0]), e._assigning = !0, hn(() => {
				e._assigning = !1;
			});
		}), e[co] = ao(r);
	},
	mounted(e, { value: t }) {
		po(e, t);
	},
	beforeUpdate(e, t, n) {
		e[co] = ao(n);
	},
	updated(e, { value: t }) {
		e._assigning || po(e, t);
	}
};
function po(e, t) {
	let n = e.multiple, r = d(t);
	if (!(n && !r && !p(t))) {
		for (let i = 0, a = e.options.length; i < a; i++) {
			let a = e.options[i], o = mo(a);
			if (n) if (r) {
				let e = typeof o;
				e === "string" || e === "number" ? a.selected = t.some((e) => String(e) === String(o)) : a.selected = be(t, o) > -1;
			} else a.selected = t.has(o);
			else if (ye(mo(a), t)) {
				e.selectedIndex !== i && (e.selectedIndex = i);
				return;
			}
		}
		!n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
	}
}
function mo(e) {
	return "_value" in e ? e._value : e.value;
}
var ho = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], go = {
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
	exact: (e, t) => ho.some((n) => e[`${n}Key`] && !t.includes(n))
}, _o = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = go[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, vo = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, yo = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = D(n.key);
		if (t.some((e) => e === r || vo[e] === r)) return e(n);
	}));
}, bo = /* @__PURE__ */ s({ patchProp: Qa }, Ca), xo;
function So() {
	return xo ||= mi(bo);
}
var Co = ((...e) => {
	So().render(...e);
}), wo = ((...e) => {
	let t = So().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = Eo(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, To(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function To(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function Eo(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/session.ts
var Do = "__comtryaSessionState", Oo = "__comtryaOperatorCode";
async function ko(e = {}) {
	let t = Mo();
	if (t.current && t.current.expiresAtMs > Date.now() + 5e3) return t.current.token;
	if (!t.inflight) {
		let n = jo(e).finally(() => {
			Mo().inflight === n && (Mo().inflight = void 0);
		});
		t.inflight = n;
	}
	return t.inflight;
}
function Ao() {
	Mo().current = void 0;
}
async function jo(e) {
	let t = e.operatorCode ?? No(), n = e.fetchImpl ?? fetch, r = e.baseUrl ?? "";
	if (!t) return;
	let i = await n(`${r}/auth/token-exchange`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			grantType: "urn:comtrya:grant:operator-code",
			subjectToken: t,
			subjectTokenType: "urn:comtrya:token-type:operator-code",
			requestedResource: "comtrya://workspace",
			requestedActions: [
				"graphql:read",
				"graphql:write",
				"events:read",
				"git:read",
				"checks:read"
			]
		})
	});
	if (!i.ok) throw Error(`token-exchange failed (${i.status}): ${await i.text()}`);
	let a = await i.json();
	if (!a.accessToken) throw Error("token-exchange response missing accessToken");
	let o = (a.expiresIn ?? 1800) * 1e3, s = {
		token: a.accessToken,
		expiresAtMs: Date.now() + o
	};
	return Mo().current = s, s.token;
}
function Mo() {
	let e = Po();
	return e[Do] ??= {}, e[Do];
}
function No() {
	let e = Po()[Oo];
	if (e) return e;
	try {
		let e = {
			BASE_URL: "/",
			DEV: !1,
			MODE: "production",
			PROD: !0,
			SSR: !1
		}?.PUBLIC_COMTRYA_OPERATOR_CODE;
		return e && (Po()[Oo] = e), e;
	} catch {
		return;
	}
}
function Po() {
	return globalThis;
}
//#endregion
//#region packages/sdk-core/src/runtime.ts
async function Y(e, t, n, r, i = {}) {
	let a = `${i.baseUrl ?? ""}/api/ops/${encodeURIComponent(e)}/${encodeURIComponent(t)}/${encodeURIComponent(n)}`, o = { "content-type": "application/json" }, s = i.token ?? await ko();
	s && (o.authorization = `Bearer ${s}`);
	try {
		let e = await fetch(a, {
			method: "POST",
			headers: o,
			body: JSON.stringify(r ?? null),
			signal: i.signal,
			credentials: "include"
		});
		e.status === 401 && Ao();
		let t = await e.text();
		if (!e.ok) {
			let n;
			try {
				n = t ? JSON.parse(t) : void 0;
			} catch {
				n = void 0;
			}
			let r = Io(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: Fo(n?.code) ?? r,
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
function Fo(e) {
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
function Io(e) {
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
//#endregion
//#region packages/sdk-core/src/graphql-client.ts
var Lo = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, Ro;
function zo() {
	return Ro ||= Bo(Lo), Ro;
}
function Bo(e) {
	let t = async (t, n) => {
		let r = await ko(), i = { "Content-Type": "application/json" };
		r && (i.Authorization = `Bearer ${r}`);
		let a = await e.fetchImpl(e.endpoint, {
			method: "POST",
			credentials: e.credentials,
			headers: i,
			body: JSON.stringify({
				query: t,
				variables: n
			})
		});
		a.status === 401 && Ao();
		let o;
		try {
			o = await a.json();
		} catch (e) {
			throw Error(`GraphQL response was not JSON: ${e instanceof Error ? e.message : String(e)}`);
		}
		if (!a.ok || o.errors?.length) throw Error(o.errors?.[0]?.message ?? a.statusText ?? "GraphQL request failed");
		if (o.data === void 0) throw Error("GraphQL response did not include data");
		return o.data;
	};
	return {
		query: t,
		mutate: t
	};
}
//#endregion
//#region packages/sdk-core/src/relationship-registry.ts
var Vo = /* @__PURE__ */ new Map(), Ho = /* @__PURE__ */ new Map(), Uo = /* @__PURE__ */ new Set();
function Wo(e) {
	return [...Vo.values()].filter((t) => t.sourceKinds.includes(e) || t.targetKinds.includes(e)).sort((e, t) => e.order - t.order || e.id.localeCompare(t.id));
}
function Go(e) {
	return Ho.get(e);
}
function Ko(e) {
	return Uo.add(e), () => Uo.delete(e);
}
//#endregion
//#region packages/sdk-core/src/route-registry.ts
function qo(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`, r = n.length;
	for (; r > 1 && n.charCodeAt(r - 1) === 47;) --r;
	return `/x/${e}${n === "/" ? "" : n.slice(0, r)}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function Jo(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return Yo(t, e, n.signal), () => n.abort();
}
async function Yo(e, t, n) {
	try {
		let r = await Xo(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: Zo(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await Qo(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function Xo(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: Zo(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function Zo(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function Qo(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		$o(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) es(e, t);
	}
	a += i.decode(), $o(a, t);
}
function $o(e, t) {
	for (let n of e.split("\n\n")) es(n, t);
}
function es(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = ts(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function ts(e, t) {
	let n = ns(e) ? e : {}, r = ns(n.data) ? n.data : {}, i = rs(r.eventType) ?? rs(n.type) ?? t ?? "";
	return {
		id: rs(r.id) ?? rs(n.id) ?? "",
		eventType: i,
		payloadB64: rs(r.payloadB64) ?? "",
		timestampMs: is(r.timestampMs) ?? as(is(n.time)) ?? Date.now(),
		sourceUri: rs(r.sourceUri) ?? rs(n.source) ?? "",
		emitterExtension: rs(r.emitterExtension) ?? rs(r.extensionId) ?? rs(n.source) ?? "",
		raw: e
	};
}
function ns(e) {
	return typeof e == "object" && !!e;
}
function rs(e) {
	return typeof e == "string" ? e : void 0;
}
function is(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function as(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var os = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], ss = typeof navigator == "object" ? navigator.platform : "", cs = /Mac|iPod|iPhone|iPad/.test(ss), ls = cs ? "Meta" : "Control", us = ss === "Win32" ? ["Control", "Alt"] : cs ? ["Alt"] : [];
function ds(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || us.includes(t) && e.getModifierState("AltGraph"));
}
function fs(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? ls : e;
		}), n];
	});
}
function ps(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !ds(e, t);
	}) || os.find(function(t) {
		return !n.includes(t) && r !== t && ds(e, t);
	}));
}
function ms(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [fs(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			ps(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : ds(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function hs(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = ms(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var gs = /* @__PURE__ */ new Map(), _s = /* @__PURE__ */ new Set();
function vs(e) {
	gs.set(e.id, e);
	for (let e of _s) e();
	return () => {
		gs.delete(e.id);
		for (let e of _s) e();
	};
}
//#endregion
//#region packages/sdk-core/src/optimistic.ts
async function ys(e) {
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
//#region packages/sdk-core/src/workspace-store.ts
var bs = null, xs = [];
function Ss() {
	return bs;
}
function Cs() {
	return bs === null ? new Promise((e) => {
		xs.push(e);
	}) : Promise.resolve(bs);
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function ws(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function Ts(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function Es(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (Ts(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			ws(e.target) || r(e);
		};
	}
	return t;
}
function Ds(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = Es(e), i = () => {
		n ||= hs(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? z(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), or(a);
}
//#endregion
//#region node_modules/.bun/marked@18.0.4/node_modules/marked/lib/marked.esm.js
function Os() {
	return {
		async: !1,
		breaks: !1,
		extensions: null,
		gfm: !0,
		hooks: null,
		pedantic: !1,
		renderer: null,
		silent: !1,
		tokenizer: null,
		walkTokens: null
	};
}
var ks = Os();
function As(e) {
	ks = e;
}
var js = { exec: () => null };
function Ms(e) {
	let t = [];
	return (n) => {
		let r = Math.max(0, Math.min(3, n - 1)), i = t[r];
		return i || (i = e(r), t[r] = i), i;
	};
}
function X(e, t = "") {
	let n = typeof e == "string" ? e : e.source, r = {
		replace: (e, t) => {
			let i = typeof t == "string" ? t : t.source;
			return i = i.replace(Z.caret, "$1"), n = n.replace(e, i), r;
		},
		getRegex: () => new RegExp(n, t)
	};
	return r;
}
var Ns = ((e = "") => {
	try {
		return !!RegExp("(?<=1)(?<!1)" + e);
	} catch {
		return !1;
	}
})(), Z = {
	codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
	outputLinkReplace: /\\([\[\]])/g,
	indentCodeCompensation: /^(\s+)(?:```)/,
	beginningSpace: /^\s+/,
	endingHash: /#$/,
	startingSpaceChar: /^ /,
	endingSpaceChar: / $/,
	nonSpaceChar: /[^ ]/,
	newLineCharGlobal: /\n/g,
	tabCharGlobal: /\t/g,
	multipleSpaceGlobal: /\s+/g,
	blankLine: /^[ \t]*$/,
	doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
	blockquoteStart: /^ {0,3}>/,
	blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
	blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
	listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
	listIsTask: /^\[[ xX]\] +\S/,
	listReplaceTask: /^\[[ xX]\] +/,
	listTaskCheckbox: /\[[ xX]\]/,
	anyLine: /\n.*\n/,
	hrefBrackets: /^<(.*)>$/,
	tableDelimiter: /[:|]/,
	tableAlignChars: /^\||\| *$/g,
	tableRowBlankLine: /\n[ \t]*$/,
	tableAlignRight: /^ *-+: *$/,
	tableAlignCenter: /^ *:-+: *$/,
	tableAlignLeft: /^ *:-+ *$/,
	startATag: /^<a /i,
	endATag: /^<\/a>/i,
	startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
	endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
	startAngleBracket: /^</,
	endAngleBracket: />$/,
	pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
	unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
	escapeTest: /[&<>"']/,
	escapeReplace: /[&<>"']/g,
	escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
	escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
	caret: /(^|[^\[])\^/g,
	percentDecode: /%25/g,
	findPipe: /\|/g,
	splitPipe: / \|/,
	slashPipe: /\\\|/g,
	carriageReturn: /\r\n|\r/g,
	spaceLine: /^ +$/gm,
	notSpaceStart: /^\S*/,
	endingNewline: /\n$/,
	listItemRegex: (e) => RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
	nextBulletRegex: Ms((e) => RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),
	hrRegex: Ms((e) => RegExp(`^ {0,${e}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)),
	fencesBeginRegex: Ms((e) => RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),
	headingBeginRegex: Ms((e) => RegExp(`^ {0,${e}}#`)),
	htmlBeginRegex: Ms((e) => RegExp(`^ {0,${e}}<(?:[a-z].*>|!--)`, "i")),
	blockquoteBeginRegex: Ms((e) => RegExp(`^ {0,${e}}>`))
}, Ps = /^(?:[ \t]*(?:\n|$))+/, Fs = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Is = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Ls = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Rs = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, zs = / {0,3}(?:[*+-]|\d{1,9}[.)])/, Bs = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, Vs = X(Bs).replace(/bull/g, zs).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Hs = X(Bs).replace(/bull/g, zs).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), Us = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Ws = /^[^\n]+/, Gs = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, Ks = X(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Gs).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), qs = X(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, zs).getRegex(), Js = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Ys = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Xs = X("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", Ys).replace("tag", Js).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Zs = X(Us).replace("hr", Ls).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Js).getRegex(), Qs = {
	blockquote: X(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Zs).getRegex(),
	code: Fs,
	def: Ks,
	fences: Is,
	heading: Rs,
	hr: Ls,
	html: Xs,
	lheading: Vs,
	list: qs,
	newline: Ps,
	paragraph: Zs,
	table: js,
	text: Ws
}, $s = X("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Ls).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Js).getRegex(), ec = {
	...Qs,
	lheading: Hs,
	table: $s,
	paragraph: X(Us).replace("hr", Ls).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", $s).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Js).getRegex()
}, tc = {
	...Qs,
	html: X("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", Ys).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: js,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: X(Us).replace("hr", Ls).replace("heading", " *#{1,6} *[^\n]").replace("lheading", Vs).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, nc = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, rc = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, ic = /^( {2,}|\\)\n(?!\s*$)/, ac = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, oc = /[\p{P}\p{S}]/u, sc = /[\s\p{P}\p{S}]/u, cc = /[^\s\p{P}\p{S}]/u, lc = X(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, sc).getRegex(), uc = /(?!~)[\p{P}\p{S}]/u, dc = /(?!~)[\s\p{P}\p{S}]/u, fc = /(?:[^\s\p{P}\p{S}]|~)/u, pc = X(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Ns ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), mc = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/, hc = X(mc, "u").replace(/punct/g, oc).getRegex(), gc = X(mc, "u").replace(/punct/g, uc).getRegex(), _c = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", vc = X(_c, "gu").replace(/notPunctSpace/g, cc).replace(/punctSpace/g, sc).replace(/punct/g, oc).getRegex(), yc = X(_c, "gu").replace(/notPunctSpace/g, fc).replace(/punctSpace/g, dc).replace(/punct/g, uc).getRegex(), bc = X("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, cc).replace(/punctSpace/g, sc).replace(/punct/g, oc).getRegex(), xc = X(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, oc).getRegex(), Sc = X("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, cc).replace(/punctSpace/g, sc).replace(/punct/g, oc).getRegex(), Cc = X(/\\(punct)/, "gu").replace(/punct/g, oc).getRegex(), wc = X(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Tc = X(Ys).replace("(?:-->|$)", "-->").getRegex(), Ec = X("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Tc).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Dc = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/, Oc = X(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", Dc).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), kc = X(/^!?\[(label)\]\[(ref)\]/).replace("label", Dc).replace("ref", Gs).getRegex(), Ac = X(/^!?\[(ref)\](?:\[\])?/).replace("ref", Gs).getRegex(), jc = X("reflink|nolink(?!\\()", "g").replace("reflink", kc).replace("nolink", Ac).getRegex(), Mc = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, Nc = {
	_backpedal: js,
	anyPunctuation: Cc,
	autolink: wc,
	blockSkip: pc,
	br: ic,
	code: rc,
	del: js,
	delLDelim: js,
	delRDelim: js,
	emStrongLDelim: hc,
	emStrongRDelimAst: vc,
	emStrongRDelimUnd: bc,
	escape: nc,
	link: Oc,
	nolink: Ac,
	punctuation: lc,
	reflink: kc,
	reflinkSearch: jc,
	tag: Ec,
	text: ac,
	url: js
}, Pc = {
	...Nc,
	link: X(/^!?\[(label)\]\((.*?)\)/).replace("label", Dc).getRegex(),
	reflink: X(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Dc).getRegex()
}, Fc = {
	...Nc,
	emStrongRDelimAst: yc,
	emStrongLDelim: gc,
	delLDelim: xc,
	delRDelim: Sc,
	url: X(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", Mc).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: X(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", Mc).getRegex()
}, Ic = {
	...Fc,
	br: X(ic).replace("{2,}", "*").getRegex(),
	text: X(Fc.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Lc = {
	normal: Qs,
	gfm: ec,
	pedantic: tc
}, Rc = {
	normal: Nc,
	gfm: Fc,
	breaks: Ic,
	pedantic: Pc
}, zc = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, Bc = (e) => zc[e];
function Vc(e, t) {
	if (t) {
		if (Z.escapeTest.test(e)) return e.replace(Z.escapeReplace, Bc);
	} else if (Z.escapeTestNoEncode.test(e)) return e.replace(Z.escapeReplaceNoEncode, Bc);
	return e;
}
function Hc(e) {
	try {
		e = encodeURI(e).replace(Z.percentDecode, "%");
	} catch {
		return null;
	}
	return e;
}
function Uc(e, t) {
	let n = e.replace(Z.findPipe, (e, t, n) => {
		let r = !1, i = t;
		for (; --i >= 0 && n[i] === "\\";) r = !r;
		return r ? "|" : " |";
	}).split(Z.splitPipe), r = 0;
	if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), t) if (n.length > t) n.splice(t);
	else for (; n.length < t;) n.push("");
	for (; r < n.length; r++) n[r] = n[r].trim().replace(Z.slashPipe, "|");
	return n;
}
function Wc(e, t, n) {
	let r = e.length;
	if (r === 0) return "";
	let i = 0;
	for (; i < r;) {
		let a = e.charAt(r - i - 1);
		if (a === t && !n) i++;
		else if (a !== t && n) i++;
		else break;
	}
	return e.slice(0, r - i);
}
function Gc(e) {
	let t = e.split("\n"), n = t.length - 1;
	for (; n >= 0 && Z.blankLine.test(t[n]);) n--;
	return t.length - n <= 2 ? e : t.slice(0, n + 1).join("\n");
}
function Kc(e, t) {
	if (e.indexOf(t[1]) === -1) return -1;
	let n = 0;
	for (let r = 0; r < e.length; r++) if (e[r] === "\\") r++;
	else if (e[r] === t[0]) n++;
	else if (e[r] === t[1] && (n--, n < 0)) return r;
	return n > 0 ? -2 : -1;
}
function qc(e, t = 0) {
	let n = t, r = "";
	for (let t of e) if (t === "	") {
		let e = 4 - n % 4;
		r += " ".repeat(e), n += e;
	} else r += t, n++;
	return r;
}
function Jc(e, t, n, r, i) {
	let a = t.href, o = t.title || null, s = e[1].replace(i.other.outputLinkReplace, "$1");
	r.state.inLink = !0;
	let c = {
		type: e[0].charAt(0) === "!" ? "image" : "link",
		raw: n,
		href: a,
		title: o,
		text: s,
		tokens: r.inlineTokens(s)
	};
	return r.state.inLink = !1, c;
}
function Yc(e, t, n) {
	let r = e.match(n.other.indentCodeCompensation);
	if (r === null) return t;
	let i = r[1];
	return t.split("\n").map((e) => {
		let t = e.match(n.other.beginningSpace);
		if (t === null) return e;
		let [r] = t;
		return r.length >= i.length ? e.slice(i.length) : e;
	}).join("\n");
}
var Xc = class {
	options;
	rules;
	lexer;
	constructor(e) {
		this.options = e || ks;
	}
	space(e) {
		let t = this.rules.block.newline.exec(e);
		if (t && t[0].length > 0) return {
			type: "space",
			raw: t[0]
		};
	}
	code(e) {
		let t = this.rules.block.code.exec(e);
		if (t) {
			let e = this.options.pedantic ? t[0] : Gc(t[0]);
			return {
				type: "code",
				raw: e,
				codeBlockStyle: "indented",
				text: e.replace(this.rules.other.codeRemoveIndent, "")
			};
		}
	}
	fences(e) {
		let t = this.rules.block.fences.exec(e);
		if (t) {
			let e = t[0], n = Yc(e, t[3] || "", this.rules);
			return {
				type: "code",
				raw: e,
				lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
				text: n
			};
		}
	}
	heading(e) {
		let t = this.rules.block.heading.exec(e);
		if (t) {
			let e = t[2].trim();
			if (this.rules.other.endingHash.test(e)) {
				let t = Wc(e, "#");
				(this.options.pedantic || !t || this.rules.other.endingSpaceChar.test(t)) && (e = t.trim());
			}
			return {
				type: "heading",
				raw: Wc(t[0], "\n"),
				depth: t[1].length,
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	hr(e) {
		let t = this.rules.block.hr.exec(e);
		if (t) return {
			type: "hr",
			raw: Wc(t[0], "\n")
		};
	}
	blockquote(e) {
		let t = this.rules.block.blockquote.exec(e);
		if (t) {
			let e = Wc(t[0], "\n").split("\n"), n = "", r = "", i = [];
			for (; e.length > 0;) {
				let t = !1, a = [], o;
				for (o = 0; o < e.length; o++) if (this.rules.other.blockquoteStart.test(e[o])) a.push(e[o]), t = !0;
				else if (!t) a.push(e[o]);
				else break;
				e = e.slice(o);
				let s = a.join("\n"), c = s.replace(this.rules.other.blockquoteSetextReplace, "\n    $1").replace(this.rules.other.blockquoteSetextReplace2, "");
				n = n ? `${n}
${s}` : s, r = r ? `${r}
${c}` : c;
				let l = this.lexer.state.top;
				if (this.lexer.state.top = !0, this.lexer.blockTokens(c, i, !0), this.lexer.state.top = l, e.length === 0) break;
				let u = i.at(-1);
				if (u?.type === "code") break;
				if (u?.type === "blockquote") {
					let t = u, a = t.raw + "\n" + e.join("\n"), o = this.blockquote(a);
					i[i.length - 1] = o, n = n.substring(0, n.length - t.raw.length) + o.raw, r = r.substring(0, r.length - t.text.length) + o.text;
					break;
				} else if (u?.type === "list") {
					let t = u, a = t.raw + "\n" + e.join("\n"), o = this.list(a);
					i[i.length - 1] = o, n = n.substring(0, n.length - u.raw.length) + o.raw, r = r.substring(0, r.length - t.raw.length) + o.raw, e = a.substring(i.at(-1).raw.length).split("\n");
					continue;
				}
			}
			return {
				type: "blockquote",
				raw: n,
				tokens: i,
				text: r
			};
		}
	}
	list(e) {
		let t = this.rules.block.list.exec(e);
		if (t) {
			let n = t[1].trim(), r = n.length > 1, i = {
				type: "list",
				raw: "",
				ordered: r,
				start: r ? +n.slice(0, -1) : "",
				loose: !1,
				items: []
			};
			n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
			let a = this.rules.other.listItemRegex(n), o = !1;
			for (; e;) {
				let n = !1, r = "", s = "";
				if (!(t = a.exec(e)) || this.rules.block.hr.test(e)) break;
				r = t[0], e = e.substring(r.length);
				let c = qc(t[2].split("\n", 1)[0], t[1].length), l = e.split("\n", 1)[0], u = !c.trim(), d = 0;
				if (this.options.pedantic ? (d = 2, s = c.trimStart()) : u ? d = t[1].length + 1 : (d = c.search(this.rules.other.nonSpaceChar), d = d > 4 ? 1 : d, s = c.slice(d), d += t[1].length), u && this.rules.other.blankLine.test(l) && (r += l + "\n", e = e.substring(l.length + 1), n = !0), !n) {
					let t = this.rules.other.nextBulletRegex(d), n = this.rules.other.hrRegex(d), i = this.rules.other.fencesBeginRegex(d), a = this.rules.other.headingBeginRegex(d), o = this.rules.other.htmlBeginRegex(d), f = this.rules.other.blockquoteBeginRegex(d);
					for (; e;) {
						let p = e.split("\n", 1)[0], m;
						if (l = p, this.options.pedantic ? (l = l.replace(this.rules.other.listReplaceNesting, "  "), m = l) : m = l.replace(this.rules.other.tabCharGlobal, "    "), i.test(l) || a.test(l) || o.test(l) || f.test(l) || t.test(l) || n.test(l)) break;
						if (m.search(this.rules.other.nonSpaceChar) >= d || !l.trim()) s += "\n" + m.slice(d);
						else {
							if (u || c.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || i.test(c) || a.test(c) || n.test(c)) break;
							s += "\n" + l;
						}
						u = !l.trim(), r += p + "\n", e = e.substring(p.length + 1), c = m.slice(d);
					}
				}
				i.loose || (o ? i.loose = !0 : this.rules.other.doubleBlankLine.test(r) && (o = !0)), i.items.push({
					type: "list_item",
					raw: r,
					task: !!this.options.gfm && this.rules.other.listIsTask.test(s),
					loose: !1,
					text: s,
					tokens: []
				}), i.raw += r;
			}
			let s = i.items.at(-1);
			if (s) s.raw = s.raw.trimEnd(), s.text = s.text.trimEnd();
			else return;
			i.raw = i.raw.trimEnd();
			for (let e of i.items) {
				this.lexer.state.top = !1, e.tokens = this.lexer.blockTokens(e.text, []);
				let t = e.tokens[0];
				if (e.task && (t?.type === "text" || t?.type === "paragraph")) {
					e.text = e.text.replace(this.rules.other.listReplaceTask, ""), t.raw = t.raw.replace(this.rules.other.listReplaceTask, ""), t.text = t.text.replace(this.rules.other.listReplaceTask, "");
					for (let e = this.lexer.inlineQueue.length - 1; e >= 0; e--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[e].src)) {
						this.lexer.inlineQueue[e].src = this.lexer.inlineQueue[e].src.replace(this.rules.other.listReplaceTask, "");
						break;
					}
					let n = this.rules.other.listTaskCheckbox.exec(e.raw);
					if (n) {
						let t = {
							type: "checkbox",
							raw: n[0] + " ",
							checked: n[0] !== "[ ]"
						};
						e.checked = t.checked, i.loose ? e.tokens[0] && ["paragraph", "text"].includes(e.tokens[0].type) && "tokens" in e.tokens[0] && e.tokens[0].tokens ? (e.tokens[0].raw = t.raw + e.tokens[0].raw, e.tokens[0].text = t.raw + e.tokens[0].text, e.tokens[0].tokens.unshift(t)) : e.tokens.unshift({
							type: "paragraph",
							raw: t.raw,
							text: t.raw,
							tokens: [t]
						}) : e.tokens.unshift(t);
					}
				} else e.task &&= !1;
				if (!i.loose) {
					let t = e.tokens.filter((e) => e.type === "space");
					i.loose = t.length > 0 && t.some((e) => this.rules.other.anyLine.test(e.raw));
				}
			}
			if (i.loose) for (let e of i.items) {
				e.loose = !0;
				for (let t of e.tokens) t.type === "text" && (t.type = "paragraph");
			}
			return i;
		}
	}
	html(e) {
		let t = this.rules.block.html.exec(e);
		if (t) {
			let e = Gc(t[0]);
			return {
				type: "html",
				block: !0,
				raw: e,
				pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
				text: e
			};
		}
	}
	def(e) {
		let t = this.rules.block.def.exec(e);
		if (t) {
			let e = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), n = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
			return {
				type: "def",
				tag: e,
				raw: Wc(t[0], "\n"),
				href: n,
				title: r
			};
		}
	}
	table(e) {
		let t = this.rules.block.table.exec(e);
		if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
		let n = Uc(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [], a = {
			type: "table",
			raw: Wc(t[0], "\n"),
			header: [],
			align: [],
			rows: []
		};
		if (n.length === r.length) {
			for (let e of r) this.rules.other.tableAlignRight.test(e) ? a.align.push("right") : this.rules.other.tableAlignCenter.test(e) ? a.align.push("center") : this.rules.other.tableAlignLeft.test(e) ? a.align.push("left") : a.align.push(null);
			for (let e = 0; e < n.length; e++) a.header.push({
				text: n[e],
				tokens: this.lexer.inline(n[e]),
				header: !0,
				align: a.align[e]
			});
			for (let e of i) a.rows.push(Uc(e, a.header.length).map((e, t) => ({
				text: e,
				tokens: this.lexer.inline(e),
				header: !1,
				align: a.align[t]
			})));
			return a;
		}
	}
	lheading(e) {
		let t = this.rules.block.lheading.exec(e);
		if (t) {
			let e = t[1].trim();
			return {
				type: "heading",
				raw: Wc(t[0], "\n"),
				depth: t[2].charAt(0) === "=" ? 1 : 2,
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	paragraph(e) {
		let t = this.rules.block.paragraph.exec(e);
		if (t) {
			let e = t[1].charAt(t[1].length - 1) === "\n" ? t[1].slice(0, -1) : t[1];
			return {
				type: "paragraph",
				raw: t[0],
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	text(e) {
		let t = this.rules.block.text.exec(e);
		if (t) return {
			type: "text",
			raw: t[0],
			text: t[0],
			tokens: this.lexer.inline(t[0])
		};
	}
	escape(e) {
		let t = this.rules.inline.escape.exec(e);
		if (t) return {
			type: "escape",
			raw: t[0],
			text: t[1]
		};
	}
	tag(e) {
		let t = this.rules.inline.tag.exec(e);
		if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
			type: "html",
			raw: t[0],
			inLink: this.lexer.state.inLink,
			inRawBlock: this.lexer.state.inRawBlock,
			block: !1,
			text: t[0]
		};
	}
	link(e) {
		let t = this.rules.inline.link.exec(e);
		if (t) {
			let e = t[2].trim();
			if (!this.options.pedantic && this.rules.other.startAngleBracket.test(e)) {
				if (!this.rules.other.endAngleBracket.test(e)) return;
				let t = Wc(e.slice(0, -1), "\\");
				if ((e.length - t.length) % 2 == 0) return;
			} else {
				let e = Kc(t[2], "()");
				if (e === -2) return;
				if (e > -1) {
					let n = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + e;
					t[2] = t[2].substring(0, e), t[0] = t[0].substring(0, n).trim(), t[3] = "";
				}
			}
			let n = t[2], r = "";
			if (this.options.pedantic) {
				let e = this.rules.other.pedanticHrefTitle.exec(n);
				e && (n = e[1], r = e[3]);
			} else r = t[3] ? t[3].slice(1, -1) : "";
			return n = n.trim(), this.rules.other.startAngleBracket.test(n) && (n = this.options.pedantic && !this.rules.other.endAngleBracket.test(e) ? n.slice(1) : n.slice(1, -1)), Jc(t, {
				href: n && n.replace(this.rules.inline.anyPunctuation, "$1"),
				title: r && r.replace(this.rules.inline.anyPunctuation, "$1")
			}, t[0], this.lexer, this.rules);
		}
	}
	reflink(e, t) {
		let n;
		if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
			let e = t[(n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " ").toLowerCase()];
			if (!e) {
				let e = n[0].charAt(0);
				return {
					type: "text",
					raw: e,
					text: e
				};
			}
			return Jc(n, e, n[0], this.lexer, this.rules);
		}
	}
	emStrong(e, t, n = "") {
		let r = this.rules.inline.emStrongLDelim.exec(e);
		if (!(!r || !r[1] && !r[2] && !r[3] && !r[4] || r[4] && n.match(this.rules.other.unicodeAlphaNumeric)) && (!(r[1] || r[3]) || !n || this.rules.inline.punctuation.exec(n))) {
			let n = [...r[0]].length - 1, i, a, o = n, s = 0, c = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
			for (c.lastIndex = 0, t = t.slice(-1 * e.length + n); (r = c.exec(t)) !== null;) {
				if (i = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !i) continue;
				if (a = [...i].length, r[3] || r[4]) {
					o += a;
					continue;
				} else if ((r[5] || r[6]) && n % 3 && !((n + a) % 3)) {
					s += a;
					continue;
				}
				if (o -= a, o > 0) continue;
				a = Math.min(a, a + o + s);
				let t = [...r[0]][0].length, c = e.slice(0, n + r.index + t + a);
				if (Math.min(n, a) % 2) {
					let e = c.slice(1, -1);
					return {
						type: "em",
						raw: c,
						text: e,
						tokens: this.lexer.inlineTokens(e)
					};
				}
				let l = c.slice(2, -2);
				return {
					type: "strong",
					raw: c,
					text: l,
					tokens: this.lexer.inlineTokens(l)
				};
			}
		}
	}
	codespan(e) {
		let t = this.rules.inline.code.exec(e);
		if (t) {
			let e = t[2].replace(this.rules.other.newLineCharGlobal, " "), n = this.rules.other.nonSpaceChar.test(e), r = this.rules.other.startingSpaceChar.test(e) && this.rules.other.endingSpaceChar.test(e);
			return n && r && (e = e.substring(1, e.length - 1)), {
				type: "codespan",
				raw: t[0],
				text: e
			};
		}
	}
	br(e) {
		let t = this.rules.inline.br.exec(e);
		if (t) return {
			type: "br",
			raw: t[0]
		};
	}
	del(e, t, n = "") {
		let r = this.rules.inline.delLDelim.exec(e);
		if (r && (!r[1] || !n || this.rules.inline.punctuation.exec(n))) {
			let n = [...r[0]].length - 1, i, a, o = n, s = this.rules.inline.delRDelim;
			for (s.lastIndex = 0, t = t.slice(-1 * e.length + n); (r = s.exec(t)) !== null;) {
				if (i = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !i || (a = [...i].length, a !== n)) continue;
				if (r[3] || r[4]) {
					o += a;
					continue;
				}
				if (o -= a, o > 0) continue;
				a = Math.min(a, a + o);
				let t = [...r[0]][0].length, s = e.slice(0, n + r.index + t + a), c = s.slice(n, -n);
				return {
					type: "del",
					raw: s,
					text: c,
					tokens: this.lexer.inlineTokens(c)
				};
			}
		}
	}
	autolink(e) {
		let t = this.rules.inline.autolink.exec(e);
		if (t) {
			let e, n;
			return t[2] === "@" ? (e = t[1], n = "mailto:" + e) : (e = t[1], n = e), {
				type: "link",
				raw: t[0],
				text: e,
				href: n,
				tokens: [{
					type: "text",
					raw: e,
					text: e
				}]
			};
		}
	}
	url(e) {
		let t;
		if (t = this.rules.inline.url.exec(e)) {
			let e, n;
			if (t[2] === "@") e = t[0], n = "mailto:" + e;
			else {
				let r;
				do
					r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
				while (r !== t[0]);
				e = t[0], n = t[1] === "www." ? "http://" + t[0] : t[0];
			}
			return {
				type: "link",
				raw: t[0],
				text: e,
				href: n,
				tokens: [{
					type: "text",
					raw: e,
					text: e
				}]
			};
		}
	}
	inlineText(e) {
		let t = this.rules.inline.text.exec(e);
		if (t) {
			let e = this.lexer.state.inRawBlock;
			return {
				type: "text",
				raw: t[0],
				text: t[0],
				escaped: e
			};
		}
	}
}, Zc = class e {
	tokens;
	options;
	state;
	inlineQueue;
	tokenizer;
	constructor(e) {
		this.tokens = [], this.tokens.links = Object.create(null), this.options = e || ks, this.options.tokenizer = this.options.tokenizer || new Xc(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			top: !0
		};
		let t = {
			other: Z,
			block: Lc.normal,
			inline: Rc.normal
		};
		this.options.pedantic ? (t.block = Lc.pedantic, t.inline = Rc.pedantic) : this.options.gfm && (t.block = Lc.gfm, this.options.breaks ? t.inline = Rc.breaks : t.inline = Rc.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: Lc,
			inline: Rc
		};
	}
	static lex(t, n) {
		return new e(n).lex(t);
	}
	static lexInline(t, n) {
		return new e(n).inlineTokens(t);
	}
	lex(e) {
		e = e.replace(Z.carriageReturn, "\n"), this.blockTokens(e, this.tokens);
		for (let e = 0; e < this.inlineQueue.length; e++) {
			let t = this.inlineQueue[e];
			this.inlineTokens(t.src, t.tokens);
		}
		return this.inlineQueue = [], this.tokens;
	}
	blockTokens(e, t = [], n = !1) {
		this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(Z.tabCharGlobal, "    ").replace(Z.spaceLine, ""));
		let r = Infinity;
		for (; e;) {
			if (e.length < r) r = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			let i;
			if (this.options.extensions?.block?.some((n) => (i = n.call({ lexer: this }, e, t)) ? (e = e.substring(i.raw.length), t.push(i), !0) : !1)) continue;
			if (i = this.tokenizer.space(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				i.raw.length === 1 && n !== void 0 ? n.raw += "\n" : t.push(i);
				continue;
			}
			if (i = this.tokenizer.code(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				n?.type === "paragraph" || n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + i.raw, n.text += "\n" + i.text, this.inlineQueue.at(-1).src = n.text) : t.push(i);
				continue;
			}
			if (i = this.tokenizer.fences(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.heading(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.hr(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.blockquote(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.list(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.html(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.def(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				n?.type === "paragraph" || n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + i.raw, n.text += "\n" + i.raw, this.inlineQueue.at(-1).src = n.text) : this.tokens.links[i.tag] || (this.tokens.links[i.tag] = {
					href: i.href,
					title: i.title
				}, t.push(i));
				continue;
			}
			if (i = this.tokenizer.table(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			if (i = this.tokenizer.lheading(e)) {
				e = e.substring(i.raw.length), t.push(i);
				continue;
			}
			let a = e;
			if (this.options.extensions?.startBlock) {
				let t = Infinity, n = e.slice(1), r;
				this.options.extensions.startBlock.forEach((e) => {
					r = e.call({ lexer: this }, n), typeof r == "number" && r >= 0 && (t = Math.min(t, r));
				}), t < Infinity && t >= 0 && (a = e.substring(0, t + 1));
			}
			if (this.state.top && (i = this.tokenizer.paragraph(a))) {
				let r = t.at(-1);
				n && r?.type === "paragraph" ? (r.raw += (r.raw.endsWith("\n") ? "" : "\n") + i.raw, r.text += "\n" + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = r.text) : t.push(i), n = a.length !== e.length, e = e.substring(i.raw.length);
				continue;
			}
			if (i = this.tokenizer.text(e)) {
				e = e.substring(i.raw.length);
				let n = t.at(-1);
				n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + i.raw, n.text += "\n" + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = n.text) : t.push(i);
				continue;
			}
			if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return this.state.top = !0, t;
	}
	inline(e, t = []) {
		return this.inlineQueue.push({
			src: e,
			tokens: t
		}), t;
	}
	inlineTokens(e, t = []) {
		this.tokenizer.lexer = this;
		let n = e, r = null;
		if (this.tokens.links) {
			let e = Object.keys(this.tokens.links);
			if (e.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) !== null;) e.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
		}
		for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) !== null;) n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
		let i;
		for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) !== null;) i = r[2] ? r[2].length : 0, n = n.slice(0, r.index + i) + "[" + "a".repeat(r[0].length - i - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
		n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
		let a = !1, o = "", s = Infinity;
		for (; e;) {
			if (e.length < s) s = e.length;
			else {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
			a || (o = ""), a = !1;
			let r;
			if (this.options.extensions?.inline?.some((n) => (r = n.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1)) continue;
			if (r = this.tokenizer.escape(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.tag(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.link(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.reflink(e, this.tokens.links)) {
				e = e.substring(r.raw.length);
				let n = t.at(-1);
				r.type === "text" && n?.type === "text" ? (n.raw += r.raw, n.text += r.text) : t.push(r);
				continue;
			}
			if (r = this.tokenizer.emStrong(e, n, o)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.codespan(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.br(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.del(e, n, o)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.autolink(e)) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (!this.state.inLink && (r = this.tokenizer.url(e))) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			let i = e;
			if (this.options.extensions?.startInline) {
				let t = Infinity, n = e.slice(1), r;
				this.options.extensions.startInline.forEach((e) => {
					r = e.call({ lexer: this }, n), typeof r == "number" && r >= 0 && (t = Math.min(t, r));
				}), t < Infinity && t >= 0 && (i = e.substring(0, t + 1));
			}
			if (r = this.tokenizer.inlineText(i)) {
				e = e.substring(r.raw.length), r.raw.slice(-1) !== "_" && (o = r.raw.slice(-1)), a = !0;
				let n = t.at(-1);
				n?.type === "text" ? (n.raw += r.raw, n.text += r.text) : t.push(r);
				continue;
			}
			if (e) {
				this.infiniteLoopError(e.charCodeAt(0));
				break;
			}
		}
		return t;
	}
	infiniteLoopError(e) {
		let t = "Infinite loop on byte: " + e;
		if (this.options.silent) console.error(t);
		else throw Error(t);
	}
}, Qc = class {
	options;
	parser;
	constructor(e) {
		this.options = e || ks;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: t, escaped: n }) {
		let r = (t || "").match(Z.notSpaceStart)?.[0], i = e.replace(Z.endingNewline, "") + "\n";
		return r ? "<pre><code class=\"language-" + Vc(r) + "\">" + (n ? i : Vc(i, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? i : Vc(i, !0)) + "</code></pre>\n";
	}
	blockquote({ tokens: e }) {
		return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
	}
	html({ text: e }) {
		return e;
	}
	def(e) {
		return "";
	}
	heading({ tokens: e, depth: t }) {
		return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
	}
	hr(e) {
		return "<hr>\n";
	}
	list(e) {
		let t = e.ordered, n = e.start, r = "";
		for (let t = 0; t < e.items.length; t++) {
			let n = e.items[t];
			r += this.listitem(n);
		}
		let i = t ? "ol" : "ul", a = t && n !== 1 ? " start=\"" + n + "\"" : "";
		return "<" + i + a + ">\n" + r + "</" + i + ">\n";
	}
	listitem(e) {
		return `<li>${this.parser.parse(e.tokens)}</li>
`;
	}
	checkbox({ checked: e }) {
		return "<input " + (e ? "checked=\"\" " : "") + "disabled=\"\" type=\"checkbox\"> ";
	}
	paragraph({ tokens: e }) {
		return `<p>${this.parser.parseInline(e)}</p>
`;
	}
	table(e) {
		let t = "", n = "";
		for (let t = 0; t < e.header.length; t++) n += this.tablecell(e.header[t]);
		t += this.tablerow({ text: n });
		let r = "";
		for (let t = 0; t < e.rows.length; t++) {
			let i = e.rows[t];
			n = "";
			for (let e = 0; e < i.length; e++) n += this.tablecell(i[e]);
			r += this.tablerow({ text: n });
		}
		return r &&= `<tbody>${r}</tbody>`, "<table>\n<thead>\n" + t + "</thead>\n" + r + "</table>\n";
	}
	tablerow({ text: e }) {
		return `<tr>
${e}</tr>
`;
	}
	tablecell(e) {
		let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
		return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
	}
	strong({ tokens: e }) {
		return `<strong>${this.parser.parseInline(e)}</strong>`;
	}
	em({ tokens: e }) {
		return `<em>${this.parser.parseInline(e)}</em>`;
	}
	codespan({ text: e }) {
		return `<code>${Vc(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: t, tokens: n }) {
		let r = this.parser.parseInline(n), i = Hc(e);
		if (i === null) return r;
		e = i;
		let a = "<a href=\"" + e + "\"";
		return t && (a += " title=\"" + Vc(t) + "\""), a += ">" + r + "</a>", a;
	}
	image({ href: e, title: t, text: n, tokens: r }) {
		r && (n = this.parser.parseInline(r, this.parser.textRenderer));
		let i = Hc(e);
		if (i === null) return Vc(n);
		e = i;
		let a = `<img src="${e}" alt="${Vc(n)}"`;
		return t && (a += ` title="${Vc(t)}"`), a += ">", a;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : Vc(e.text);
	}
}, $c = class {
	strong({ text: e }) {
		return e;
	}
	em({ text: e }) {
		return e;
	}
	codespan({ text: e }) {
		return e;
	}
	del({ text: e }) {
		return e;
	}
	html({ text: e }) {
		return e;
	}
	text({ text: e }) {
		return e;
	}
	link({ text: e }) {
		return "" + e;
	}
	image({ text: e }) {
		return "" + e;
	}
	br() {
		return "";
	}
	checkbox({ raw: e }) {
		return e;
	}
}, el = class e {
	options;
	renderer;
	textRenderer;
	constructor(e) {
		this.options = e || ks, this.options.renderer = this.options.renderer || new Qc(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new $c();
	}
	static parse(t, n) {
		return new e(n).parse(t);
	}
	static parseInline(t, n) {
		return new e(n).parseInline(t);
	}
	parse(e) {
		this.renderer.parser = this;
		let t = "";
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			if (this.options.extensions?.renderers?.[r.type]) {
				let e = r, n = this.options.extensions.renderers[e.type].call({ parser: this }, e);
				if (n !== !1 || ![
					"space",
					"hr",
					"heading",
					"code",
					"table",
					"blockquote",
					"list",
					"html",
					"def",
					"paragraph",
					"text"
				].includes(e.type)) {
					t += n || "";
					continue;
				}
			}
			let i = r;
			switch (i.type) {
				case "space":
					t += this.renderer.space(i);
					break;
				case "hr":
					t += this.renderer.hr(i);
					break;
				case "heading":
					t += this.renderer.heading(i);
					break;
				case "code":
					t += this.renderer.code(i);
					break;
				case "table":
					t += this.renderer.table(i);
					break;
				case "blockquote":
					t += this.renderer.blockquote(i);
					break;
				case "list":
					t += this.renderer.list(i);
					break;
				case "checkbox":
					t += this.renderer.checkbox(i);
					break;
				case "html":
					t += this.renderer.html(i);
					break;
				case "def":
					t += this.renderer.def(i);
					break;
				case "paragraph":
					t += this.renderer.paragraph(i);
					break;
				case "text":
					t += this.renderer.text(i);
					break;
				default: {
					let e = "Token with \"" + i.type + "\" type was not found.";
					if (this.options.silent) return console.error(e), "";
					throw Error(e);
				}
			}
		}
		return t;
	}
	parseInline(e, t = this.renderer) {
		this.renderer.parser = this;
		let n = "";
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (this.options.extensions?.renderers?.[i.type]) {
				let e = this.options.extensions.renderers[i.type].call({ parser: this }, i);
				if (e !== !1 || ![
					"escape",
					"html",
					"link",
					"image",
					"strong",
					"em",
					"codespan",
					"br",
					"del",
					"text"
				].includes(i.type)) {
					n += e || "";
					continue;
				}
			}
			let a = i;
			switch (a.type) {
				case "escape":
					n += t.text(a);
					break;
				case "html":
					n += t.html(a);
					break;
				case "link":
					n += t.link(a);
					break;
				case "image":
					n += t.image(a);
					break;
				case "checkbox":
					n += t.checkbox(a);
					break;
				case "strong":
					n += t.strong(a);
					break;
				case "em":
					n += t.em(a);
					break;
				case "codespan":
					n += t.codespan(a);
					break;
				case "br":
					n += t.br(a);
					break;
				case "del":
					n += t.del(a);
					break;
				case "text":
					n += t.text(a);
					break;
				default: {
					let e = "Token with \"" + a.type + "\" type was not found.";
					if (this.options.silent) return console.error(e), "";
					throw Error(e);
				}
			}
		}
		return n;
	}
}, tl = class {
	options;
	block;
	constructor(e) {
		this.options = e || ks;
	}
	static passThroughHooks = new Set([
		"preprocess",
		"postprocess",
		"processAllTokens",
		"emStrongMask"
	]);
	static passThroughHooksRespectAsync = new Set([
		"preprocess",
		"postprocess",
		"processAllTokens"
	]);
	preprocess(e) {
		return e;
	}
	postprocess(e) {
		return e;
	}
	processAllTokens(e) {
		return e;
	}
	emStrongMask(e) {
		return e;
	}
	provideLexer(e = this.block) {
		return e ? Zc.lex : Zc.lexInline;
	}
	provideParser(e = this.block) {
		return e ? el.parse : el.parseInline;
	}
}, nl = class {
	defaults = Os();
	options = this.setOptions;
	parse = this.parseMarkdown(!0);
	parseInline = this.parseMarkdown(!1);
	Parser = el;
	Renderer = Qc;
	TextRenderer = $c;
	Lexer = Zc;
	Tokenizer = Xc;
	Hooks = tl;
	constructor(...e) {
		this.use(...e);
	}
	walkTokens(e, t) {
		let n = [];
		for (let r of e) switch (n = n.concat(t.call(this, r)), r.type) {
			case "table": {
				let e = r;
				for (let r of e.header) n = n.concat(this.walkTokens(r.tokens, t));
				for (let r of e.rows) for (let e of r) n = n.concat(this.walkTokens(e.tokens, t));
				break;
			}
			case "list": {
				let e = r;
				n = n.concat(this.walkTokens(e.items, t));
				break;
			}
			default: {
				let e = r;
				this.defaults.extensions?.childTokens?.[e.type] ? this.defaults.extensions.childTokens[e.type].forEach((r) => {
					let i = e[r].flat(Infinity);
					n = n.concat(this.walkTokens(i, t));
				}) : e.tokens && (n = n.concat(this.walkTokens(e.tokens, t)));
			}
		}
		return n;
	}
	use(...e) {
		let t = this.defaults.extensions || {
			renderers: {},
			childTokens: {}
		};
		return e.forEach((e) => {
			let n = { ...e };
			if (n.async = this.defaults.async || n.async || !1, e.extensions && (e.extensions.forEach((e) => {
				if (!e.name) throw Error("extension name required");
				if ("renderer" in e) {
					let n = t.renderers[e.name];
					n ? t.renderers[e.name] = function(...t) {
						let r = e.renderer.apply(this, t);
						return r === !1 && (r = n.apply(this, t)), r;
					} : t.renderers[e.name] = e.renderer;
				}
				if ("tokenizer" in e) {
					if (!e.level || e.level !== "block" && e.level !== "inline") throw Error("extension level must be 'block' or 'inline'");
					let n = t[e.level];
					n ? n.unshift(e.tokenizer) : t[e.level] = [e.tokenizer], e.start && (e.level === "block" ? t.startBlock ? t.startBlock.push(e.start) : t.startBlock = [e.start] : e.level === "inline" && (t.startInline ? t.startInline.push(e.start) : t.startInline = [e.start]));
				}
				"childTokens" in e && e.childTokens && (t.childTokens[e.name] = e.childTokens);
			}), n.extensions = t), e.renderer) {
				let t = this.defaults.renderer || new Qc(this.defaults);
				for (let n in e.renderer) {
					if (!(n in t)) throw Error(`renderer '${n}' does not exist`);
					if (["options", "parser"].includes(n)) continue;
					let r = n, i = e.renderer[r], a = t[r];
					t[r] = (...e) => {
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n || "";
					};
				}
				n.renderer = t;
			}
			if (e.tokenizer) {
				let t = this.defaults.tokenizer || new Xc(this.defaults);
				for (let n in e.tokenizer) {
					if (!(n in t)) throw Error(`tokenizer '${n}' does not exist`);
					if ([
						"options",
						"rules",
						"lexer"
					].includes(n)) continue;
					let r = n, i = e.tokenizer[r], a = t[r];
					t[r] = (...e) => {
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n;
					};
				}
				n.tokenizer = t;
			}
			if (e.hooks) {
				let t = this.defaults.hooks || new tl();
				for (let n in e.hooks) {
					if (!(n in t)) throw Error(`hook '${n}' does not exist`);
					if (["options", "block"].includes(n)) continue;
					let r = n, i = e.hooks[r], a = t[r];
					tl.passThroughHooks.has(n) ? t[r] = (e) => {
						if (this.defaults.async && tl.passThroughHooksRespectAsync.has(n)) return (async () => {
							let n = await i.call(t, e);
							return a.call(t, n);
						})();
						let r = i.call(t, e);
						return a.call(t, r);
					} : t[r] = (...e) => {
						if (this.defaults.async) return (async () => {
							let n = await i.apply(t, e);
							return n === !1 && (n = await a.apply(t, e)), n;
						})();
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n;
					};
				}
				n.hooks = t;
			}
			if (e.walkTokens) {
				let t = this.defaults.walkTokens, r = e.walkTokens;
				n.walkTokens = function(e) {
					let n = [];
					return n.push(r.call(this, e)), t && (n = n.concat(t.call(this, e))), n;
				};
			}
			this.defaults = {
				...this.defaults,
				...n
			};
		}), this;
	}
	setOptions(e) {
		return this.defaults = {
			...this.defaults,
			...e
		}, this;
	}
	lexer(e, t) {
		return Zc.lex(e, t ?? this.defaults);
	}
	parser(e, t) {
		return el.parse(e, t ?? this.defaults);
	}
	parseMarkdown(e) {
		return (t, n) => {
			let r = { ...n }, i = {
				...this.defaults,
				...r
			}, a = this.onError(!!i.silent, !!i.async);
			if (this.defaults.async === !0 && r.async === !1) return a(/* @__PURE__ */ Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
			if (typeof t > "u" || t === null) return a(/* @__PURE__ */ Error("marked(): input parameter is undefined or null"));
			if (typeof t != "string") return a(/* @__PURE__ */ Error("marked(): input parameter is of type " + Object.prototype.toString.call(t) + ", string expected"));
			if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
				let n = i.hooks ? await i.hooks.preprocess(t) : t, r = await (i.hooks ? await i.hooks.provideLexer(e) : e ? Zc.lex : Zc.lexInline)(n, i), a = i.hooks ? await i.hooks.processAllTokens(r) : r;
				i.walkTokens && await Promise.all(this.walkTokens(a, i.walkTokens));
				let o = await (i.hooks ? await i.hooks.provideParser(e) : e ? el.parse : el.parseInline)(a, i);
				return i.hooks ? await i.hooks.postprocess(o) : o;
			})().catch(a);
			try {
				i.hooks && (t = i.hooks.preprocess(t));
				let n = (i.hooks ? i.hooks.provideLexer(e) : e ? Zc.lex : Zc.lexInline)(t, i);
				i.hooks && (n = i.hooks.processAllTokens(n)), i.walkTokens && this.walkTokens(n, i.walkTokens);
				let r = (i.hooks ? i.hooks.provideParser(e) : e ? el.parse : el.parseInline)(n, i);
				return i.hooks && (r = i.hooks.postprocess(r)), r;
			} catch (e) {
				return a(e);
			}
		};
	}
	onError(e, t) {
		return (n) => {
			if (n.message += "\nPlease report this to https://github.com/markedjs/marked.", e) {
				let e = "<p>An error occurred:</p><pre>" + Vc(n.message + "", !0) + "</pre>";
				return t ? Promise.resolve(e) : e;
			}
			if (t) return Promise.reject(n);
			throw n;
		};
	}
}, rl = new nl();
function Q(e, t) {
	return rl.parse(e, t);
}
Q.options = Q.setOptions = function(e) {
	return rl.setOptions(e), Q.defaults = rl.defaults, As(Q.defaults), Q;
}, Q.getDefaults = Os, Q.defaults = ks, Q.use = function(...e) {
	return rl.use(...e), Q.defaults = rl.defaults, As(Q.defaults), Q;
}, Q.walkTokens = function(e, t) {
	return rl.walkTokens(e, t);
}, Q.parseInline = rl.parseInline, Q.Parser = el, Q.parser = el.parse, Q.Renderer = Qc, Q.TextRenderer = $c, Q.Lexer = Zc, Q.lexer = Zc.lex, Q.Tokenizer = Xc, Q.Hooks = tl, Q.parse = Q, Q.options, Q.setOptions, Q.use, Q.walkTokens, Q.parseInline, el.parse, Zc.lex;
//#endregion
//#region packages/sdk-vue/src/markdown.ts
var il = new Set(/* @__PURE__ */ "h1.h2.h3.h4.h5.h6.p.ul.ol.li.strong.em.b.i.code.pre.a.img.br.hr.blockquote.table.thead.tbody.tfoot.tr.th.td.dl.dt.dd.details.summary.sup.sub.del.ins.s.mark.abbr.cite.q.figure.figcaption.caption.span.div.section.article.aside.header.footer.nav.main".split(".")), al = new Set([
	"class",
	"id",
	"title",
	"lang",
	"dir",
	"tabindex",
	"aria-label",
	"aria-hidden",
	"aria-expanded",
	"aria-controls",
	"role",
	"data-lang"
]), ol = {
	a: new Set([
		"href",
		"rel",
		"target"
	]),
	img: new Set([
		"src",
		"alt",
		"width",
		"height",
		"loading"
	]),
	th: new Set([
		"colspan",
		"rowspan",
		"scope"
	]),
	td: new Set(["colspan", "rowspan"])
}, sl = /^\s*(?:javascript|vbscript|data)\s*:/i;
function cl(e) {
	return !sl.test(e);
}
function ll(e) {
	return e.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function ul(e, t) {
	if (!t.trim()) return "";
	let n = [], r = /\s+([a-zA-Z][a-zA-Z0-9_:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=>]+)))?/g, i, a = !1, o = [];
	for (; (i = r.exec(t)) !== null;) {
		let t = (i[1] ?? "").toLowerCase(), n = i[2] ?? i[3] ?? i[4] ?? "";
		if (t.startsWith("on")) continue;
		let r = ol[e];
		(al.has(t) || r && r.has(t)) && ((t === "href" || t === "src") && !cl(n) || (t === "rel" && (a = !0), o.push({
			name: t,
			value: n
		})));
	}
	for (let { name: e, value: t } of o) n.push(" " + e + "=\"" + ll(t) + "\"");
	return e === "a" && !a && n.push(" rel=\"noopener noreferrer\""), n.join("");
}
var dl = [
	"script",
	"style",
	"iframe",
	"frame",
	"frameset",
	"object",
	"embed",
	"form",
	"select",
	"textarea",
	"svg",
	"math"
], fl = new Set([
	"input",
	"button",
	"meta",
	"link",
	"base",
	"applet"
]);
function pl(e) {
	let t = e;
	for (let e of dl) {
		let n = RegExp("<" + e + "(\\s[^>]*)?>([\\s\\S]*?)<\\/" + e + ">", "gi");
		t = t.replace(n, "");
		let r = RegExp("<" + e + "(\\s[^>]*)?>", "gi");
		t = t.replace(r, "");
		let i = RegExp("<\\/" + e + ">", "gi");
		t = t.replace(i, "");
	}
	return t = t.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?(\/?)>/g, (e, t, n, r, i) => {
		let a = n.toLowerCase();
		if (fl.has(a) || !il.has(a)) return "";
		let o = ul(a, r ?? ""), s = i ? " /" : "";
		return "<" + t + a + o + s + ">";
	}), t;
}
function ml(e, t) {
	let n = encodeURIComponent(t);
	return e.split(/(<code[^>]*>[\s\S]*?<\/code>)/).map((e, t) => t % 2 == 1 ? e : e.replace(/(^|[^\w&])#(\d+)\b/g, (e, t, r) => t + "<a href=\"/x/issues/" + n + "/" + r + "\" class=\"issue-ref\">#" + r + "</a>")).join("");
}
function hl(e, t = {}) {
	if (!e) return "";
	let n = pl(new nl().parse(e, { async: !1 }));
	return t.workspaceId && (n = ml(n, t.workspaceId)), n;
}
//#endregion
//#region packages/sdk-vue/src/parse-query.ts
function gl(e, t) {
	let n = {}, r = /* @__PURE__ */ new Set(), i = [], a = new Set(t);
	if (!e || !e.trim()) return {
		text: "",
		filters: n,
		unknown: []
	};
	let o = _l(e);
	for (let e of o) {
		if (e.kind === "plain") {
			i.push(e.text);
			continue;
		}
		e.value && (a.has(e.key) ? (n[e.key] ?? (n[e.key] = [])).push(e.value) : r.add(e.key));
	}
	return {
		text: i.join(" "),
		filters: n,
		unknown: Array.from(r)
	};
}
function _l(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n;) {
		for (; r < n && vl(e.charCodeAt(r));) r += 1;
		if (r >= n) break;
		let i = r, a = -1;
		for (; r < n && !vl(e.charCodeAt(r));) {
			if (e.charCodeAt(r) === 58 && a === -1 && (a = r, r + 1 < n && e.charCodeAt(r + 1) === 34)) {
				for (r += 2; r < n && e.charCodeAt(r) !== 34;) r += 1;
				r < n && (r += 1);
				break;
			}
			r += 1;
		}
		let o = e.slice(i, r);
		if (a > i) {
			let n = e.slice(i, a);
			if (yl(n)) {
				let i = n.toLowerCase(), o = a + 1, s = e.slice(o, r);
				s.startsWith("\"") && s.endsWith("\"") && s.length >= 2 && (s = s.slice(1, -1)), t.push({
					kind: "kv",
					key: i,
					value: s
				});
				continue;
			}
		}
		t.push({
			kind: "plain",
			text: o
		});
	}
	return t;
}
function vl(e) {
	return e === 32 || e === 9 || e === 10 || e === 13;
}
function yl(e) {
	if (e.length === 0 || !bl(e.charCodeAt(0))) return !1;
	for (let t = 1; t < e.length; t += 1) {
		let n = e.charCodeAt(t);
		if (!bl(n) && !xl(n) && n !== 95 && n !== 45) return !1;
	}
	return !0;
}
function bl(e) {
	return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function xl(e) {
	return e >= 48 && e <= 57;
}
//#endregion
//#region packages/sdk-vue/src/classify-principal.ts
var Sl = {
	kind: "unknown",
	label: "unknown",
	glyph: "·",
	tone: "neutral"
};
function $(e) {
	if (!e) return Sl;
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: Cl(r),
			tone: "human"
		};
		case "agent": return {
			kind: "agent",
			label: r,
			glyph: "✦",
			tone: "agent"
		};
		case "bot": return {
			kind: "bot",
			label: r,
			glyph: "◆",
			tone: "bot"
		};
		case "credential": return {
			kind: "credential",
			label: r,
			glyph: "⚙",
			tone: "credential"
		};
		case "team": return {
			kind: "team",
			label: r,
			glyph: "◇",
			tone: "team"
		};
		default: return {
			kind: "unknown",
			label: r,
			glyph: Cl(r) || "·",
			tone: "neutral"
		};
	}
}
function Cl(e) {
	return e.slice(0, 1).toUpperCase();
}
//#endregion
//#region packages/sdk-vue/src/comtrya-config.ts
function wl() {
	if (typeof window > "u") return [];
	let e = window.location.pathname;
	if (!e.startsWith("/r/")) return [];
	let t = e.slice(3), n = t.indexOf("/p/");
	return (n >= 0 ? t.slice(0, n) : t).split("/").filter(Boolean).map(decodeURIComponent);
}
async function Tl(e) {
	try {
		let t = e ?? wl();
		return t.length === 0 ? [] : (((await zo().query("query ComtryaProjects($segments: [String!]!) {\n      workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n    }", { segments: t })).workspace?.repositoryByPath?.comtryaConfig ?? null)?.projects ?? []).filter((e) => typeof e == "object" && !!e);
	} catch {
		return [];
	}
}
//#endregion
//#region packages/sdk-vue/src/LabelPill.vue?vue&type=script&setup=true&lang.ts
var El = ["title"], Dl = {
	key: 0,
	class: "label-pill-value"
}, Ol = { class: "label-pill-type" }, kl = { class: "label-pill-value" }, Al = /* @__PURE__ */ Vn({
	__name: "LabelPill",
	props: {
		name: { type: String },
		catalog: { type: [Object, null] }
	},
	setup(e) {
		let t = e, n = J(() => t.catalog ? t.catalog[t.name] ?? null : null), r = J(() => {
			let e = t.name.split("::"), r = e.length === 2 && !!e[0] && !!e[1], i = n.value?.kind;
			return r ? {
				kind: i ?? "scoped",
				type: e[0],
				value: e[1]
			} : {
				kind: "plain",
				type: "",
				value: t.name
			};
		}), i = J(() => n.value?.color ?? null), a = J(() => n.value?.description ?? null);
		return (e, t) => (V(), H("span", {
			class: me(["label-pill", [`label-pill--${r.value.kind}`]]),
			title: a.value ?? void 0,
			style: le(i.value ? { "--label-color": i.value } : void 0)
		}, [r.value.kind === "plain" ? (V(), H("span", Dl, j(r.value.value), 1)) : (V(), H(B, { key: 1 }, [
			U("span", Ol, j(r.value.type), 1),
			t[0] ||= U("span", {
				class: "label-pill-sep",
				"aria-hidden": "true"
			}, "::", -1),
			U("span", kl, j(r.value.value), 1)
		], 64))], 14, El));
	}
});
//#endregion
//#region packages/sdk-vue/src/index.ts
function jl(e) {
	Ml(e.tagName, e.component);
	let t = /* @__PURE__ */ no(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(Pl(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function Ml(e, t) {
	if (typeof document > "u") return;
	let n = Nl(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function Nl(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function Pl(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_issues/dist/ext_issues.client.ts
var Fl = {
	openIssue: async (e) => Y("ext_issues", "issues", "open-issue", e),
	closeIssue: async (e) => Y("ext_issues", "issues", "close-issue", e),
	reopenIssue: async (e) => Y("ext_issues", "issues", "reopen-issue", e),
	assignProject: async (e) => Y("ext_issues", "issues", "assign-project", e),
	updateIssue: async (e) => Y("ext_issues", "issues", "update-issue", e),
	getIssue: async (e) => Y("ext_issues", "issues", "get-issue", e),
	listIssues: async (e) => Y("ext_issues", "issues", "list-issues", e),
	triageBoard: async (e) => Y("ext_issues", "issues", "triage-board", e),
	labelBoard: async (e) => Y("ext_issues", "issues", "label-board", e),
	assigneeBoard: async (e) => Y("ext_issues", "issues", "assignee-board", e),
	authorBoard: async (e) => Y("ext_issues", "issues", "author-board", e),
	projectBoard: async (e) => Y("ext_issues", "issues", "project-board", e),
	priorityBoard: async (e) => Y("ext_issues", "issues", "priority-board", e),
	milestoneBoard: async (e) => Y("ext_issues", "issues", "milestone-board", e),
	workflowBoard: async (e) => Y("ext_issues", "issues", "workflow-board", e),
	byRefIssue: async (e) => Y("ext_issues", "issues", "by-ref-issue", e),
	byRefsIssue: async (e) => Y("ext_issues", "issues", "by-refs-issue", e),
	byNumberIssue: async (e) => Y("ext_issues", "issues", "by-number-issue", e),
	stateCountsForRefsIssue: async (e) => Y("ext_issues", "issues", "state-counts-for-refs-issue", e)
};
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/scope.ts
function Il(e, t) {
	let n = Ll(e), r = Ll(t);
	return n && r ? `comtrya://workspace/${n}/repository/${r}` : r ? `comtrya://repository/${r}` : n ? `comtrya://workspace/${n}` : "comtrya://issues";
}
function Ll(e) {
	return (e?.trim() ?? "") || null;
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/api.ts
var Rl = "query($from: ResourceURN!, $kind: ResourceURN) {\n  relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n}", zl = "query($to: ResourceURN!, $kind: ResourceURN) {\n  relations.incoming(to: $to, kind: $kind) { id kind from to source target }\n}", Bl = "mutation($input: RelationCreateInput!) {\n  relations.create(input: $input) { id kind from to source target }\n}", Vl = "mutation($input: RelationDeleteInput!) {\n  relations.delete(input: $input)\n}";
function Hl(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Ul(e) {
	let t = e?.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/([^/]+))?$/);
	return t ? {
		workspaceId: t[1] ?? "",
		repositoryId: t[2] ?? null
	} : {
		workspaceId: "",
		repositoryId: e?.match(/^comtrya:\/\/repository\/([^/]+)$/)?.[1] ?? null
	};
}
function Wl(e) {
	switch (e) {
		case "closed":
		case "CLOSED": return "CLOSED";
		case "reopened":
		case "REOPENED": return "REOPENED";
		default: return "OPEN";
	}
}
function Gl(e) {
	let t = Ul(e.repository);
	return {
		id: e.id,
		workspaceId: t.workspaceId,
		repositoryId: t.repositoryId,
		number: e.number,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: Wl(e.state),
		stateReason: e.stateReason ?? null,
		authorRef: e.authorRef ?? null,
		labels: e.labels ?? [],
		createdAt: e.createdAt ?? null,
		updatedAt: e.updatedAt ?? null,
		closedAt: e.closedAt ?? null,
		projectName: e.projectName ?? null,
		closeOnMerge: e.closeOnMerge ?? null,
		assignees: e.assignees ?? []
	};
}
async function Kl(e, t) {
	let n = Hl(await Fl.listIssues({
		repository: Il(t.workspaceId, t.repositoryId),
		limit: 1024
	}), "listIssues").map(Gl), r = t.state ? Wl(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function ql(e, t) {
	let n = Hl(await Fl.byRefIssue(t), "issueByRef");
	return n ? Gl(n) : null;
}
async function Jl(e, t, n) {
	let r = Hl(await Fl.byNumberIssue({
		workspaceId: t,
		number: n
	}), "issueByNumber");
	return r ? Gl(r) : null;
}
async function Yl(e) {
	return Gl(Hl(await Fl.openIssue({
		repository: Il(e.workspaceId, e.repositoryId),
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		projectName: e.projectName ?? null,
		labels: e.labels ?? [],
		closeOnMerge: e.closeOnMerge ?? null,
		assignees: e.assignees ?? []
	}), "openIssue"));
}
async function Xl(e, t) {
	return Gl(Hl(await Fl.closeIssue({
		id: t,
		reason: "completed"
	}), "closeIssue"));
}
async function Zl(e, t) {
	return Gl(Hl(await Fl.reopenIssue(t), "reopenIssue"));
}
async function Ql(e, t) {
	return Gl(Hl(await Fl.assignProject({
		id: e,
		projectName: t ?? null
	}), "assignProject"));
}
async function $l(e, t, n) {
	return ((await e.query(Rl, n ? {
		from: t,
		kind: n
	} : { from: t })).relations?.outgoing ?? []).map(ru);
}
async function eu(e, t, n) {
	return ((await e.query(zl, n ? {
		to: t,
		kind: n
	} : { to: t })).relations?.incoming ?? []).map(ru);
}
async function tu(e, t) {
	let n = (await e.mutate(Bl, { input: t })).relations?.create;
	if (!n) throw Error("relations.create returned no relation");
	return ru(n);
}
async function nu(e, t) {
	return (await e.mutate(Vl, { input: { id: t } })).relations?.delete ?? !1;
}
function ru(e) {
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
function iu() {
	return Ss() ?? "";
}
function au(e) {
	return `comtrya://issue/${e.id}`;
}
var ou = "issues";
function su(e) {
	return qo(ou, `/${e.workspaceId}/${e.number}`);
}
function cu() {
	return qo(ou, "/new");
}
function lu(e) {
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
var uu = ["data-state"], du = ["data-issue-id"], fu = { class: "issue-card-title" }, pu = { class: "issue-number" }, mu = ["href"], hu = { class: "issue-meta" }, gu = { key: 0 }, _u = {
	key: 1,
	class: "issue-line muted"
}, vu = {
	key: 2,
	class: "issue-card-fallback"
}, yu = { class: "issue-line muted" }, bu = { class: "issue-line warn" }, xu = /* @__PURE__ */ Vn({
	__name: "IssueCard",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issue: { type: null },
		ref: { type: String },
		resourceRef: { type: String }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ L("idle"), r = /* @__PURE__ */ L(null), i = /* @__PURE__ */ L(t.issue ?? null), a = J(() => t.resourceRef ?? t.ref ?? ""), o = J(() => t.client ?? t.comtryaClient), s = J(() => t.issue ?? i.value), c = J(() => lu(s.value?.state)), l = J(() => s.value?.labels?.join(", ") ?? ""), u = J(() => s.value ? su(s.value) : "#");
		nr(d), z(() => [
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
				i.value = await ql(o.value, a.value), n.value = i.value ? "ready" : "empty";
			} catch (e) {
				i.value = null, n.value = "error", r.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (e, t) => (V(), H("article", {
			class: "issue-card",
			"data-state": n.value,
			"data-smoke": "issue-card"
		}, [s.value ? (V(), H("div", {
			key: 0,
			class: "issue-card-body",
			"data-issue-id": s.value.id,
			"data-smoke": "issue-card-body"
		}, [U("div", fu, [
			U("span", { class: me(["issue-pill", c.value.className]) }, j(c.value.label), 3),
			U("span", pu, "#" + j(s.value.number), 1),
			U("a", {
				class: "issue-title-link",
				href: u.value
			}, j(s.value.title), 9, mu)
		]), U("div", hu, [U("span", null, "by " + j(s.value.authorRef ?? "unknown"), 1), l.value ? (V(), H("span", gu, j(l.value), 1)) : K("", !0)])], 8, du)) : n.value === "loading" ? (V(), H("p", _u, " Loading " + j(a.value), 1)) : (V(), H("div", vu, [U("p", yu, j(a.value || "issue"), 1), U("p", bu, j(r.value ?? "issue not found"), 1)]))], 8, uu));
	}
}), Su = ".issue-card[data-v-672ca665]{display:block}.issue-card-body[data-v-672ca665]{border:.5px solid var(--line,#ffffff12);padding:8px 12px}.issue-card-title[data-v-672ca665]{align-items:baseline;gap:8px;min-width:0;display:flex}.issue-pill[data-v-672ca665],.issue-number[data-v-672ca665],.issue-meta[data-v-672ca665],.issue-line[data-v-672ca665]{font-family:var(--font-mono,monospace)}.issue-pill[data-v-672ca665]{border:.5px solid;padding:1px 8px;font-size:10px}.issue-state-open[data-v-672ca665]{color:var(--ok,#5dc879)}@supports (color:lab(0% 0 0)){.issue-state-open[data-v-672ca665]{color:var(--ok,lab(72.9029% -45.1402 29.5956))}}.issue-state-closed[data-v-672ca665],.issue-number[data-v-672ca665],.issue-meta[data-v-672ca665]{color:var(--fg-3,#ffffff85)}.issue-number[data-v-672ca665]{font-size:12px}.issue-title-link[data-v-672ca665]{min-width:0;color:inherit;font-family:var(--font-serif,system-ui);overflow-wrap:anywhere;font-weight:600}.issue-meta[data-v-672ca665]{flex-wrap:wrap;gap:8px;margin-top:4px;font-size:11px;display:flex}.issue-line[data-v-672ca665]{margin:4px 0;font-size:12px}.muted[data-v-672ca665]{color:var(--fg-3,#ffffff85)}.warn[data-v-672ca665]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-672ca665]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}", Cu = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, wu = /* @__PURE__ */ Cu(xu, [["styles", [Su]], ["__scopeId", "data-v-672ca665"]]), Tu = /* @__PURE__ */ Cu(/* @__PURE__ */ Vn({
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
		let t = e, n = /* @__PURE__ */ L(null), r = null;
		nr(i), z(() => [
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
		return (e, t) => (V(), H("span", {
			ref_key: "mount",
			ref: n,
			class: "custom-element-host"
		}, null, 512));
	}
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]), Eu = {
	defaultLabels: [],
	closeOnMerge: null,
	ownerRefs: []
};
function Du(e = "location") {
	let t = e === "location" ? typeof window < "u" ? window.location.pathname : "" : Ou();
	if (!t.startsWith("/r/")) return [];
	let n = t.slice(3), r = n.indexOf("/p/");
	return (r >= 0 ? n.slice(0, r) : n).split("/").filter(Boolean).map(decodeURIComponent);
}
function Ou() {
	let e = typeof document < "u" && document.referrer || "";
	if (!e) return "";
	try {
		return new URL(e).pathname;
	} catch {
		return "";
	}
}
async function ku(e, t = "location") {
	try {
		let n = Du(t);
		if (n.length === 0) return Eu;
		let r = (((await zo().query("query Q($segments: [String!]!) {\n        workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n      }", { segments: n })).workspace?.repositoryByPath?.comtryaConfig ?? null)?.projects ?? []).find((t) => t.name === e), i = (r?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0);
		return {
			defaultLabels: r?.issues?.defaultLabels ?? [],
			closeOnMerge: typeof r?.issues?.closeOnMerge == "boolean" ? r.issues.closeOnMerge : null,
			ownerRefs: i
		};
	} catch {
		return Eu;
	}
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/IssueDetail.vue?vue&type=script&setup=true&lang.ts
var Au = ["data-state", "data-issue-id"], ju = {
	key: 0,
	class: "issue-line muted"
}, Mu = {
	key: 1,
	class: "issue-line warn"
}, Nu = {
	key: 2,
	class: "issue-line warn"
}, Pu = {
	key: 3,
	class: "issue-detail-shell"
}, Fu = { class: "issue-main" }, Iu = { class: "issue-hero" }, Lu = { class: "issue-kicker" }, Ru = { class: "issue-number" }, zu = {
	key: 0,
	class: "issue-repository"
}, Bu = {
	class: "issue-chip-row",
	"aria-label": "Issue metadata"
}, Vu = ["href", "title"], Hu = {
	key: 1,
	class: "issue-chip tone-warn",
	title: "closeOnMerge=false — opted out of the PR merge reactor's auto-close path."
}, Uu = ["data-author-kind", "title"], Wu = { class: "chip-glyph" }, Gu = ["data-author-kind", "title"], Ku = { class: "chip-glyph" }, qu = ["title"], Ju = ["title"], Yu = ["data-issue-id", "innerHTML"], Xu = ["data-issue-id"], Zu = {
	key: 0,
	class: "issue-thread-count"
}, Qu = {
	class: "issue-sidebar",
	"aria-label": "Issue sidebar"
}, $u = { class: "issue-panel" }, ed = { class: "issue-state-summary" }, td = { key: 0 }, nd = { class: "issue-actions" }, rd = ["disabled"], id = ["disabled"], ad = {
	key: 0,
	class: "issue-line warn",
	role: "alert"
}, od = {
	class: "issue-panel",
	"data-smoke": "issue-project-picker"
}, sd = ["value", "disabled"], cd = ["value"], ld = {
	key: 0,
	class: "issue-line warn",
	role: "alert"
}, ud = {
	key: 0,
	class: "issue-panel",
	"data-smoke": "issue-project-owners"
}, dd = ["href", "title"], fd = { class: "issue-owners" }, pd = ["data-author-kind", "title"], md = { class: "chip-glyph" }, hd = { class: "issue-line muted" }, gd = "comtrya-issue-relationships", _d = "comtrya-slot-mount", vd = /* @__PURE__ */ Cu(/* @__PURE__ */ Vn({
	__name: "IssueDetail",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		relationshipRegistry: { type: Object },
		issue: { type: null },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] },
		number: { type: [Number, String] },
		routeParams: { type: null },
		labelCatalog: { type: null }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ L("idle"), r = /* @__PURE__ */ L("idle"), i = /* @__PURE__ */ L(null), a = /* @__PURE__ */ L(null), o = /* @__PURE__ */ L(t.issue ?? null), s = /* @__PURE__ */ L(0), c = J(() => t.client ?? t.comtryaClient), l = J(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? iu()), u = J(() => o.value ?? t.issue ?? null), d = J(() => lu(u.value?.state)), f = J(() => !!u.value?.bodyMarkdown?.trim()), p = J(() => f.value ? hl(u.value?.bodyMarkdown ?? "", { workspaceId: l.value }) : ""), m = /* @__PURE__ */ L(null);
		function h(e) {
			let t = e.detail;
			t && typeof t.count == "number" && (m.value = t.count);
		}
		function g() {
			s.value += 1;
		}
		let _ = J(() => ie(u.value?.createdAt)), v = J(() => A(u.value?.createdAt)), y = J(() => {
			let e = u.value?.updatedAt, t = u.value?.createdAt;
			return !e || e === t ? null : A(e);
		}), b = J(() => ie(u.value?.updatedAt)), x = J(() => t.repositoryPath ?? u.value?.repositoryId ?? null), S = J(() => Number(t.number ?? t.routeParams?.params?.number)), C = J(() => c.value && Number.isFinite(S.value)), w = J(() => {
			let e = u.value;
			return e ? {
				client: c.value,
				comtryaClient: c.value,
				issue: e,
				workspaceId: l.value,
				repositoryId: t.repositoryId ?? e.repositoryId ?? null,
				repositoryPath: t.repositoryPath ?? null,
				refreshKey: s.value,
				relationshipRefreshKey: s.value
			} : {};
		}), ee = J(() => {
			let e = u.value;
			return e ? {
				client: c.value,
				comtryaClient: c.value,
				relationshipRegistry: t.relationshipRegistry,
				issue: e,
				workspaceId: l.value,
				repositoryId: t.repositoryId ?? e.repositoryId ?? null,
				repositoryPath: t.repositoryPath ?? null,
				refreshKey: s.value
			} : {};
		}), T = /* @__PURE__ */ L(null), te = J(() => T.value?.ownerRefs ?? []);
		z(() => u.value?.projectName ?? "", async (e) => {
			if (!e) {
				T.value = null;
				return;
			}
			try {
				T.value = await ku(e);
			} catch {
				T.value = null;
			}
		}, { immediate: !0 });
		let E = /* @__PURE__ */ L([]), ne = /* @__PURE__ */ L("idle"), D = /* @__PURE__ */ L(null);
		nr(async () => {
			try {
				E.value = await Tl();
			} catch {
				E.value = [];
			}
		});
		async function O(e) {
			let t = e.target;
			if (!t || !u.value) return;
			let n = u.value, r = t.value || null;
			if ((n.projectName ?? null) === r) return;
			ne.value = "submitting", D.value = null;
			let i = n.projectName ?? null;
			o.value = {
				...n,
				projectName: r
			};
			try {
				o.value = await Ql(n.id, r);
			} catch (e) {
				o.value = {
					...n,
					projectName: i
				}, t.value = i ?? "", D.value = e instanceof Error ? e.message : String(e);
			} finally {
				ne.value = "idle";
			}
		}
		nr(re), z(() => [
			c.value,
			t.issue,
			l.value,
			t.repositoryId,
			t.number,
			t.routeParams?.params?.number
		], () => void re());
		async function re() {
			if (t.issue) {
				o.value = k(t.issue) ? t.issue : null, n.value = o.value ? "ready" : "empty", i.value = null;
				return;
			}
			if (!C.value || !c.value) {
				o.value = null, n.value = "error", i.value = "issue-detail: missing params";
				return;
			}
			n.value = "loading", i.value = null;
			try {
				let e = await Jl(c.value, l.value, S.value);
				o.value = e && k(e) ? e : null, n.value = o.value ? "ready" : "empty";
			} catch (e) {
				o.value = null, n.value = "error", i.value = e instanceof Error ? e.message : String(e);
			}
		}
		function k(e) {
			return !t.repositoryId || e.repositoryId === t.repositoryId;
		}
		function ie(e) {
			if (!e) return null;
			let t = new Date(e);
			return Number.isNaN(t.valueOf()) ? e : new Intl.DateTimeFormat(void 0, {
				dateStyle: "medium",
				timeStyle: "short"
			}).format(t);
		}
		function A(e) {
			if (!e) return null;
			let t = Date.parse(e);
			if (!Number.isFinite(t)) return null;
			let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
		}
		async function ae() {
			if (!c.value || !u.value) return;
			let e = c.value, t = u.value, n = {
				...t,
				state: "CLOSED",
				stateReason: "completed"
			};
			r.value = "submitting", a.value = null;
			try {
				let r = await ys({
					apply: () => {
						o.value = n;
					},
					rollback: () => {
						o.value = t;
					},
					op: async () => ({
						ok: !0,
						value: await Xl(e, t.id)
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
		async function oe() {
			if (!c.value || !u.value) return;
			let e = c.value, t = u.value, n = {
				...t,
				state: "OPEN",
				stateReason: null,
				closedAt: null
			};
			r.value = "submitting", a.value = null;
			try {
				let r = await ys({
					apply: () => {
						o.value = n;
					},
					rollback: () => {
						o.value = t;
					},
					op: async () => ({
						ok: !0,
						value: await Zl(e, t.id)
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
		return (t, o) => (V(), H("main", {
			class: "issue-detail",
			"data-state": n.value,
			"data-issue-id": u.value?.id,
			"data-smoke": "issue-detail"
		}, [n.value === "loading" ? (V(), H("p", ju, "Loading issue")) : n.value === "error" ? (V(), H("p", Mu, j(i.value), 1)) : u.value ? (V(), H("div", Pu, [U("section", Fu, [
			U("header", Iu, [
				U("div", Lu, [
					U("span", { class: me(["issue-pill", d.value.className]) }, j(d.value.label), 3),
					U("span", Ru, "#" + j(u.value.number), 1),
					x.value ? (V(), H("span", zu, j(x.value), 1)) : K("", !0)
				]),
				U("h1", null, j(u.value.title), 1),
				U("div", Bu, [
					u.value.projectName ? (V(), H("a", {
						key: 0,
						class: "issue-chip tone-project issue-chip-link",
						href: `/x/issues/?project=${encodeURIComponent(u.value.projectName)}`,
						title: `Filter issues by project ${u.value.projectName}`
					}, [o[0] ||= U("span", { class: "chip-glyph" }, "◇", -1), G(j(u.value.projectName), 1)], 8, Vu)) : K("", !0),
					(V(!0), H(B, null, fr(u.value.labels ?? [], (t) => (V(), Fi(R(Al), {
						key: `label-${t}`,
						name: t,
						catalog: e.labelCatalog ?? null
					}, null, 8, ["name", "catalog"]))), 128)),
					u.value.closeOnMerge === !1 ? (V(), H("span", Hu, "closeOnMerge · off")) : K("", !0),
					(V(!0), H(B, null, fr(u.value.assignees ?? [], (e) => (V(), H("span", {
						key: `assignee-${e}`,
						class: "issue-chip tone-assignee",
						"data-author-kind": R($)(e).kind,
						title: e
					}, [U("span", Wu, j(R($)(e).glyph), 1), G(" " + j(R($)(e).label), 1)], 8, Uu))), 128)),
					u.value.authorRef ? (V(), H("span", {
						key: 2,
						class: "issue-chip tone-author",
						"data-author-kind": R($)(u.value.authorRef).kind,
						title: `Opened by ${u.value.authorRef}`
					}, [U("span", Ku, j(R($)(u.value.authorRef).glyph), 1), G(" by " + j(R($)(u.value.authorRef).label), 1)], 8, Gu)) : K("", !0),
					v.value ? (V(), H("span", {
						key: 3,
						class: "issue-chip tone-time",
						title: _.value ?? ""
					}, "opened " + j(v.value), 9, qu)) : K("", !0),
					y.value ? (V(), H("span", {
						key: 4,
						class: "issue-chip tone-time tone-updated",
						title: b.value ?? ""
					}, "updated " + j(y.value), 9, Ju)) : K("", !0)
				])
			]),
			f.value ? (V(), H("article", {
				key: 0,
				class: "issue-body prose",
				"data-issue-id": u.value.id,
				"data-smoke": "issue-detail-main",
				innerHTML: p.value
			}, null, 8, Yu)) : (V(), H("article", {
				key: 1,
				class: "issue-body is-empty",
				"data-issue-id": u.value.id,
				"data-smoke": "issue-detail-main"
			}, " No description has been added yet. ", 8, Xu)),
			U("section", {
				class: "issue-thread",
				onCommentThreadUpdate: h
			}, [U("header", null, [U("h2", null, [o[1] ||= G(" Activity", -1), m.value === null ? K("", !0) : (V(), H("span", Zu, " (" + j(m.value) + ")", 1))])]), W(Tu, {
				tag: "comtrya-comment-thread",
				attributes: { target: R(au)(u.value) },
				properties: {
					target: R(au)(u.value),
					comtryaClient: c.value
				}
			}, null, 8, ["attributes", "properties"])], 32)
		]), U("aside", Qu, [
			U("section", $u, [
				o[2] ||= U("header", null, [U("h2", null, "State")], -1),
				U("div", ed, [U("span", { class: me(["issue-pill", d.value.className]) }, j(d.value.label), 3), u.value.stateReason ? (V(), H("span", td, j(u.value.stateReason), 1)) : K("", !0)]),
				U("div", nd, [u.value.state === "OPEN" || u.value.state === "REOPENED" ? (V(), H("button", {
					key: 0,
					type: "button",
					disabled: r.value === "submitting",
					onClick: ae
				}, " Close issue ", 8, rd)) : (V(), H("button", {
					key: 1,
					type: "button",
					disabled: r.value === "submitting",
					onClick: oe
				}, " Reopen issue ", 8, id))]),
				a.value ? (V(), H("p", ad, j(a.value), 1)) : K("", !0)
			]),
			U("section", od, [
				o[4] ||= U("header", null, [U("h2", null, "Project")], -1),
				U("select", {
					class: "issue-project-select",
					"data-smoke": "issue-project-select",
					value: u.value.projectName ?? "",
					disabled: ne.value === "submitting",
					onChange: O
				}, [o[3] ||= U("option", { value: "" }, "— no project —", -1), (V(!0), H(B, null, fr(E.value, (e) => (V(), H("option", {
					key: e.name,
					value: e.name ?? ""
				}, j(e.name), 9, cd))), 128))], 40, sd),
				D.value ? (V(), H("p", ld, j(D.value), 1)) : K("", !0),
				o[5] ||= U("p", { class: "issue-line muted" }, [
					G(" Stamps "),
					U("code", null, "projectName"),
					G(" on this issue. Lights up the workspace per-Project counts. ")
				], -1)
			]),
			u.value.projectName && te.value.length > 0 ? (V(), H("section", ud, [
				U("header", null, [o[6] ||= U("h2", null, "Routed to", -1), U("a", {
					href: `/x/issues/?project=${encodeURIComponent(u.value.projectName)}`,
					class: "issue-panel-link",
					title: `Filter to project ${u.value.projectName}`
				}, "◇ " + j(u.value.projectName), 9, dd)]),
				U("ul", fd, [(V(!0), H(B, null, fr(te.value, (e) => (V(), H("li", {
					key: e,
					class: "issue-owner",
					"data-author-kind": R($)(e).kind,
					title: e
				}, [U("span", md, j(R($)(e).glyph), 1), G(" " + j(R($)(e).label), 1)], 8, pd))), 128))]),
				U("p", hd, [
					o[7] ||= G(" From ", -1),
					o[8] ||= U("code", null, "package comtrya", -1),
					G(" · projects." + j(u.value.projectName) + ".owners ", 1)
				])
			])) : K("", !0),
			W(Tu, {
				tag: _d,
				properties: {
					name: "issue.detail.sidebar",
					elementContext: w.value
				},
				onComtryaRelationshipChanged: g
			}, null, 8, ["properties"]),
			W(Tu, {
				tag: gd,
				properties: ee.value,
				onComtryaRelationshipChanged: g
			}, null, 8, ["properties"])
		])])) : (V(), H("p", Nu, " No issue #" + j(Number.isFinite(S.value) ? S.value : "?") + " in " + j(l.value), 1))], 8, Au));
	}
}), [["styles", [".issue-detail[data-v-8ea4a8e4]{width:min(100%,1180px);color:var(--fg,#fffffff0);gap:24px;padding:8px 0 48px;display:grid}.issue-detail-shell[data-v-8ea4a8e4]{grid-template-columns:minmax(0,1fr) minmax(280px,340px);align-items:start;gap:32px;display:grid}.issue-main[data-v-8ea4a8e4],.issue-sidebar[data-v-8ea4a8e4],.issue-panel[data-v-8ea4a8e4],.issue-thread[data-v-8ea4a8e4]{min-width:0}.issue-main[data-v-8ea4a8e4]{gap:24px;display:grid}.issue-sidebar[data-v-8ea4a8e4]{gap:16px;display:grid}.issue-detail h1[data-v-8ea4a8e4]{max-width:820px;font-family:var(--font-serif,system-ui);letter-spacing:0;overflow-wrap:anywhere;margin:10px 0 0;font-size:42px;line-height:1}.issue-hero[data-v-8ea4a8e4]{border-bottom:2px solid var(--fg,#fffffff0);gap:14px;padding-bottom:22px;display:grid}.issue-kicker[data-v-8ea4a8e4]{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.issue-chip-row[data-v-8ea4a8e4]{flex-wrap:wrap;gap:6px;margin:4px 0 0;display:flex}.issue-chip[data-v-8ea4a8e4]{border:.5px solid var(--line,#ffffff12);font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);align-items:center;gap:5px;padding:2px 8px;font-size:11px;line-height:16px;display:inline-flex}.issue-chip .chip-glyph[data-v-8ea4a8e4]{place-items:center;width:13px;height:13px;font-size:10px;font-weight:700;display:inline-grid}.issue-chip.tone-project[data-v-8ea4a8e4]{color:var(--accent-blue,#1d55a6);border-color:currentColor}.issue-chip-link[data-v-8ea4a8e4]{cursor:pointer;text-decoration:none}.issue-chip-link[data-v-8ea4a8e4]:hover{background:#1d55a60f}.issue-chip.tone-label[data-v-8ea4a8e4]{color:var(--accent-teal,#087f6f);border-color:currentColor}.issue-chip.tone-warn[data-v-8ea4a8e4]{color:var(--accent-yellow,#c89300);text-transform:lowercase;border-color:currentColor}.issue-chip.tone-assignee[data-v-8ea4a8e4]{cursor:help;border-style:dashed;border-color:currentColor}.issue-chip.tone-author[data-v-8ea4a8e4],.issue-chip.tone-assignee[data-v-8ea4a8e4]{color:var(--fg-2,#ffffffbd)}.issue-chip.tone-author[data-author-kind=agent][data-v-8ea4a8e4],.issue-chip.tone-assignee[data-author-kind=agent][data-v-8ea4a8e4]{color:#6b3fa0}.issue-chip.tone-author[data-author-kind=credential][data-v-8ea4a8e4],.issue-chip.tone-assignee[data-author-kind=credential][data-v-8ea4a8e4]{color:var(--accent-yellow,#c89300)}.issue-chip.tone-author[data-author-kind=bot][data-v-8ea4a8e4],.issue-chip.tone-assignee[data-author-kind=bot][data-v-8ea4a8e4]{color:var(--accent-blue,#1d55a6)}.issue-chip.tone-author[data-author-kind=team][data-v-8ea4a8e4],.issue-chip.tone-assignee[data-author-kind=team][data-v-8ea4a8e4]{color:var(--accent-teal,#087f6f)}.issue-chip.tone-time[data-v-8ea4a8e4]{color:var(--fg-3,#ffffff85);border-style:none;padding-left:2px}.issue-line[data-v-8ea4a8e4],.issue-kicker[data-v-8ea4a8e4],.issue-panel[data-v-8ea4a8e4],.issue-actions button[data-v-8ea4a8e4]{font-family:var(--font-mono,monospace)}.issue-pill[data-v-8ea4a8e4]{min-height:22px;font-family:var(--font-mono,monospace);text-transform:lowercase;border:.5px solid;align-items:center;padding:2px 8px;font-size:11px;line-height:1;display:inline-flex}.issue-number[data-v-8ea4a8e4],.issue-repository[data-v-8ea4a8e4]{color:var(--fg-3,#ffffff85);font-size:12px}.issue-state-open[data-v-8ea4a8e4]{color:var(--ok,#5dc879)}@supports (color:lab(0% 0 0)){.issue-state-open[data-v-8ea4a8e4]{color:var(--ok,lab(72.9029% -45.1402 29.5956))}}.issue-state-closed[data-v-8ea4a8e4]{color:var(--fg-3,#ffffff85)}.issue-body[data-v-8ea4a8e4]{border:.5px solid var(--line,#ffffff12);background:var(--surface);min-height:156px;font-family:var(--font-sans,\"Quicksand\", ui-sans-serif, system-ui, sans-serif);white-space:pre-wrap;overflow-wrap:anywhere;padding:20px;font-size:15px;line-height:1.55}.issue-body.is-empty[data-v-8ea4a8e4]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);font-size:12px}.issue-thread[data-v-8ea4a8e4]{gap:12px;padding-top:4px;display:grid}.issue-thread header[data-v-8ea4a8e4],.issue-panel header[data-v-8ea4a8e4]{border-bottom:.5px solid var(--line,#ffffff12);align-items:center;min-height:36px;display:flex}.issue-thread h2[data-v-8ea4a8e4],.issue-panel h2[data-v-8ea4a8e4]{font-family:var(--font-serif,system-ui);margin:0;font-size:18px;line-height:1}.issue-thread-count[data-v-8ea4a8e4]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:13px;font-weight:400}.issue-panel[data-v-8ea4a8e4]{border:.5px solid var(--line,#ffffff12);background:var(--surface);gap:12px;padding:14px;display:grid}.issue-state-summary[data-v-8ea4a8e4]{color:var(--fg-3,#ffffff85);flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;display:flex}.issue-actions[data-v-8ea4a8e4]{gap:8px;display:grid}.issue-project-select[data-v-8ea4a8e4]{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);width:100%;color:var(--fg,#fffffff0);font-family:var(--font-mono,monospace);outline:none;padding:8px 10px;font-size:13px;transition:border-color .12s}.issue-project-select[data-v-8ea4a8e4]:focus{border-color:var(--fg,#fffffff0)}.issue-project-select[data-v-8ea4a8e4]:disabled{cursor:wait;opacity:.55}.issue-panel header .issue-panel-link[data-v-8ea4a8e4]{font-family:var(--font-mono,monospace);color:var(--accent-blue,#1d55a6);letter-spacing:.02em;margin-left:auto;font-size:11px;text-decoration:none}.issue-panel header .issue-panel-link[data-v-8ea4a8e4]:hover{text-underline-offset:2px;text-decoration:underline}.issue-owners[data-v-8ea4a8e4]{flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none;display:flex}.issue-owner[data-v-8ea4a8e4]{color:var(--fg,#fffffff0);font-family:var(--font-mono,monospace);letter-spacing:.02em;border:.5px solid;align-items:center;gap:5px;padding:2px 8px;font-size:11px;display:inline-flex}.issue-owner .chip-glyph[data-v-8ea4a8e4]{font-family:var(--font-serif,system-ui);font-size:12px;line-height:1}.issue-owner[data-author-kind=team][data-v-8ea4a8e4]{color:var(--accent-teal,#087f6f)}.issue-owner[data-author-kind=human][data-v-8ea4a8e4]{color:var(--fg,#fffffff0)}.issue-owner[data-author-kind=agent][data-v-8ea4a8e4]{color:#6b3fa0}.issue-owner[data-author-kind=bot][data-v-8ea4a8e4]{color:var(--accent-blue,#1d55a6)}.issue-owner[data-author-kind=credential][data-v-8ea4a8e4]{color:var(--accent-yellow,#c89300)}.issue-line.muted code[data-v-8ea4a8e4]{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);color:var(--fg-2,#ffffffbd);padding:0 4px;font-size:11px}.issue-actions button[data-v-8ea4a8e4]{border:.5px solid var(--fg,#fffffff0);min-height:34px;color:inherit;cursor:pointer;text-align:left;background:0 0;padding:8px 12px}.issue-actions button[data-v-8ea4a8e4]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-8ea4a8e4]{margin:4px 0;font-size:12px}.muted[data-v-8ea4a8e4]{color:var(--fg-3,#ffffff85)}.warn[data-v-8ea4a8e4]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-8ea4a8e4]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}@media (max-width:920px){.issue-detail-shell[data-v-8ea4a8e4]{grid-template-columns:1fr}.issue-detail h1[data-v-8ea4a8e4]{font-size:34px}}"]], ["__scopeId", "data-v-8ea4a8e4"]]), yd = {
	class: "issue-relationships",
	"data-smoke": "issue-detail-relationships"
}, bd = { class: "relationship-header" }, xd = {
	key: 0,
	class: "issue-line muted"
}, Sd = {
	key: 1,
	class: "issue-line warn"
}, Cd = {
	key: 2,
	class: "issue-line muted"
}, wd = {
	key: 3,
	class: "relationship-groups"
}, Td = { class: "relationship-group-heading" }, Ed = { class: "relationship-card" }, Dd = [
	"aria-label",
	"disabled",
	"onClick"
], Od = ["value"], kd = ["value"], Ad = ["disabled"], jd = {
	key: 5,
	class: "issue-line muted"
}, Md = {
	key: 6,
	class: "issue-line warn",
	role: "alert"
}, Nd = "issue", Pd = /* @__PURE__ */ Cu(/* @__PURE__ */ Vn({
	__name: "IssueRelationships",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		relationshipRegistry: { type: Object },
		issue: { type: null },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] },
		refreshKey: { type: Number }
	},
	emits: ["comtrya-relationship-changed"],
	setup(e, { emit: t }) {
		let n = e, r = t, i = J(() => n.client ?? n.comtryaClient), a = J(() => au(n.issue)), o = /* @__PURE__ */ L("idle"), s = /* @__PURE__ */ L(null), c = /* @__PURE__ */ L("idle"), l = /* @__PURE__ */ L(null), u = /* @__PURE__ */ L([]), d = /* @__PURE__ */ L([]), f = /* @__PURE__ */ L([]), p = /* @__PURE__ */ L(""), m = /* @__PURE__ */ L(""), h = /* @__PURE__ */ L(0), g, _ = J(() => (h.value, T().relationshipTypesForSourceKind(Nd))), v = J(() => x.value.reduce((e, t) => e + t.relations.length, 0)), y = J(() => {
			let e = [];
			for (let t of _.value) {
				if (t.symmetric) {
					let n = O(t.sourceKinds.includes(Nd) ? t.targetKinds : t.sourceKinds);
					n.length > 0 && e.push({
						key: `${t.id}:symmetric`,
						type: t,
						direction: "symmetric",
						label: t.outgoingLabel,
						targetKinds: n
					});
					continue;
				}
				if (t.sourceKinds.includes(Nd)) {
					let n = O(t.targetKinds);
					n.length > 0 && e.push({
						key: `${t.id}:outgoing`,
						type: t,
						direction: "outgoing",
						label: t.outgoingLabel,
						targetKinds: n
					});
				}
				if (t.targetKinds.includes(Nd)) {
					let n = O(t.sourceKinds);
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
		}), b = J(() => y.value.find((e) => e.key === p.value)), x = J(() => {
			let e = [];
			for (let t of _.value) {
				if (t.symmetric) {
					let n = re([...u.value, ...d.value]).filter((e) => e.kind === t.kind).map((e) => ({
						relation: e,
						targetRef: ne(e, a.value)
					})).filter((e) => t.sourceKinds.includes(D(e.targetRef)) || t.targetKinds.includes(D(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:symmetric`,
						label: t.outgoingLabel,
						relations: n
					});
					continue;
				}
				if (t.sourceKinds.includes(Nd)) {
					let n = u.value.filter((e) => e.kind === t.kind && te(e) === a.value).map((e) => ({
						relation: e,
						targetRef: E(e)
					})).filter((e) => t.targetKinds.includes(D(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:outgoing`,
						label: t.outgoingLabel,
						relations: n
					});
				}
				if (t.targetKinds.includes(Nd)) {
					let n = d.value.filter((e) => e.kind === t.kind && E(e) === a.value).map((e) => ({
						relation: e,
						targetRef: te(e)
					})).filter((e) => t.sourceKinds.includes(D(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:incoming`,
						label: t.incomingLabel,
						relations: n
					});
				}
			}
			return e;
		});
		z(() => n.relationshipRegistry, () => {
			g?.(), g = T().subscribeRelationshipTypes(() => {
				h.value += 1;
			}), h.value += 1;
		}, { immediate: !0 }), or(() => g?.()), z(() => [
			i.value,
			n.issue.id,
			n.refreshKey
		], () => void S(), { immediate: !0 }), z(y, (e) => {
			e.some((e) => e.key === p.value) || (p.value = e[0]?.key ?? "");
		}, { immediate: !0 }), z(() => [
			p.value,
			n.workspaceId,
			n.repositoryId,
			n.repositoryPath,
			a.value,
			h.value
		], () => void C(), { immediate: !0 });
		async function S() {
			let e = i.value;
			if (!e) {
				u.value = [], d.value = [], o.value = "error", s.value = "relationships: no client";
				return;
			}
			o.value = "loading", s.value = null;
			try {
				let [t, n] = await Promise.all([$l(e, a.value), eu(e, a.value)]);
				u.value = t, d.value = n, o.value = "ready";
			} catch (e) {
				u.value = [], d.value = [], o.value = "error", s.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function C() {
			let e = b.value;
			if (!e) {
				f.value = [], m.value = "";
				return;
			}
			c.value = "loading-targets", l.value = null;
			try {
				let t = [];
				for (let r of e.targetKinds) {
					let i = T().relationshipTargetProviderForKind(r);
					if (!i) continue;
					let o = await i.loadTargets({
						workspaceId: n.workspaceId,
						repositoryId: n.repositoryId,
						repositoryPath: n.repositoryPath,
						currentRef: a.value,
						currentKind: Nd,
						relationshipType: e.type,
						direction: e.direction,
						targetKind: r
					});
					t.push(...o);
				}
				f.value = k(t).filter((e) => e.ref !== a.value), m.value = f.value[0]?.ref ?? "";
			} catch (e) {
				f.value = [], m.value = "", l.value = e instanceof Error ? e.message : String(e);
			} finally {
				c.value = "idle";
			}
		}
		async function w() {
			let e = i.value, t = b.value;
			if (!e || !t || !m.value) return;
			let n = t.direction === "incoming" ? m.value : a.value, r = t.direction === "incoming" ? a.value : m.value;
			c.value = "submitting", l.value = null;
			try {
				let i = await tu(e, {
					from: n,
					to: r,
					kind: t.type.kind
				});
				await S(), ie("created", i);
			} catch (e) {
				l.value = e instanceof Error ? e.message : String(e);
			} finally {
				c.value = "idle";
			}
		}
		async function ee(e) {
			let t = i.value;
			if (t) {
				c.value = "submitting", l.value = null;
				try {
					await nu(t, e.id), await S(), ie("deleted", e);
				} catch (e) {
					l.value = e instanceof Error ? e.message : String(e);
				} finally {
					c.value = "idle";
				}
			}
		}
		function T() {
			return n.relationshipRegistry ?? {
				relationshipTypesForSourceKind: Wo,
				relationshipTargetProviderForKind: Go,
				subscribeRelationshipTypes: Ko
			};
		}
		function te(e) {
			return e.from ?? e.source ?? "";
		}
		function E(e) {
			return e.to ?? e.target ?? "";
		}
		function ne(e, t) {
			let n = te(e), r = E(e);
			return n === t ? r : n === r ? "" : n;
		}
		function D(e) {
			return e.match(/^comtrya:\/\/([^/]+)\//)?.[1] ?? "";
		}
		function O(e) {
			return [...new Set(e)].filter((e) => T().relationshipTargetProviderForKind(e) !== void 0);
		}
		function re(e) {
			let t = /* @__PURE__ */ new Set();
			return e.filter((e) => t.has(e.id) ? !1 : (t.add(e.id), !0));
		}
		function k(e) {
			let t = /* @__PURE__ */ new Set();
			return e.filter((e) => t.has(e.ref) ? !1 : (t.add(e.ref), !0));
		}
		function ie(e, t) {
			r("comtrya-relationship-changed", {
				source: "issue-relationships",
				action: e,
				relation: t
			});
		}
		return (e, t) => (V(), H("section", yd, [
			U("header", bd, [U("div", null, [t[2] ||= U("h2", null, "Relationships", -1), U("p", null, j(v.value) + " linked", 1)])]),
			o.value === "loading" ? (V(), H("p", xd, "Loading relationships")) : o.value === "error" ? (V(), H("p", Sd, j(s.value), 1)) : x.value.length === 0 ? (V(), H("p", Cd, " No relationships yet. ")) : (V(), H("div", wd, [(V(!0), H(B, null, fr(x.value, (e) => (V(), H("section", {
				key: e.key,
				class: "relationship-group"
			}, [U("div", Td, [U("h3", null, j(e.label), 1), U("span", null, j(e.relations.length), 1)]), U("ul", null, [(V(!0), H(B, null, fr(e.relations, (t) => (V(), H("li", { key: t.relation.id }, [U("div", Ed, [W(Tu, {
				tag: "comtrya-resource-card",
				attributes: { ref: t.targetRef },
				properties: {
					ref: t.targetRef,
					comtryaClient: i.value
				}
			}, null, 8, ["attributes", "properties"])]), U("button", {
				type: "button",
				class: "relationship-remove",
				"aria-label": `Remove ${e.label} relationship`,
				disabled: c.value === "submitting",
				onClick: (e) => ee(t.relation)
			}, " Remove ", 8, Dd)]))), 128))])]))), 128))])),
			y.value.length > 0 ? (V(), H("form", {
				key: 4,
				class: "relationship-form",
				onSubmit: _o(w, ["prevent"])
			}, [
				U("label", null, [t[3] ||= U("span", null, "Type", -1), On(U("select", {
					"onUpdate:modelValue": t[0] ||= (e) => p.value = e,
					"aria-label": "Relationship type"
				}, [(V(!0), H(B, null, fr(y.value, (e) => (V(), H("option", {
					key: e.key,
					value: e.key
				}, j(e.label), 9, Od))), 128))], 512), [[fo, p.value]])]),
				U("label", null, [t[4] ||= U("span", null, "Target", -1), On(U("select", {
					"onUpdate:modelValue": t[1] ||= (e) => m.value = e,
					"aria-label": "Relationship target"
				}, [(V(!0), H(B, null, fr(f.value, (e) => (V(), H("option", {
					key: e.ref,
					value: e.ref
				}, j(e.title) + j(e.subtitle ? ` - ${e.subtitle}` : ""), 9, kd))), 128))], 512), [[fo, m.value]])]),
				U("button", {
					type: "submit",
					disabled: c.value !== "idle" || !m.value
				}, " Add ", 8, Ad)
			], 32)) : K("", !0),
			y.value.length > 0 && f.value.length === 0 && c.value === "idle" ? (V(), H("p", jd, " No eligible targets for this relationship. ")) : K("", !0),
			l.value ? (V(), H("p", Md, j(l.value), 1)) : K("", !0)
		]));
	}
}), [["styles", [".issue-relationships[data-v-b033a0e6]{border:.5px solid var(--line,#ffffff12);background:var(--surface);font-family:var(--font-mono,monospace);gap:12px;padding:14px;font-size:12px;display:grid}.relationship-header[data-v-b033a0e6]{border-bottom:.5px solid var(--line,#ffffff12);align-items:center;min-height:36px;display:flex}.relationship-header h2[data-v-b033a0e6],.relationship-group h3[data-v-b033a0e6]{font-family:var(--font-serif,system-ui);margin:0}.relationship-header h2[data-v-b033a0e6]{font-size:18px;line-height:1}.relationship-header p[data-v-b033a0e6]{color:var(--fg-3,#ffffff85);margin:4px 0 0;font-size:11px}.relationship-groups[data-v-b033a0e6],.relationship-group[data-v-b033a0e6],.relationship-group ul[data-v-b033a0e6]{flex-direction:column;gap:8px;display:flex}.relationship-group[data-v-b033a0e6]{padding-top:4px}.relationship-group-heading[data-v-b033a0e6]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.relationship-group-heading h3[data-v-b033a0e6]{font-size:14px;line-height:1}.relationship-group-heading span[data-v-b033a0e6]{color:var(--fg-3,#ffffff85);font-size:11px}.relationship-group ul[data-v-b033a0e6]{margin:0;padding:0;list-style:none}.relationship-group li[data-v-b033a0e6]{grid-template-columns:minmax(0,1fr) auto;align-items:stretch;gap:8px;display:grid}.relationship-card[data-v-b033a0e6]{min-width:0}.relationship-form[data-v-b033a0e6]{border-top:.5px solid var(--line,#ffffff12);gap:8px;padding-top:12px;display:grid}.relationship-form label[data-v-b033a0e6]{flex-direction:column;gap:4px;min-width:0;display:flex}.relationship-form label>span[data-v-b033a0e6]{color:var(--fg-3,#ffffff85);letter-spacing:.08em;text-transform:uppercase;font-size:10px}.relationship-form select[data-v-b033a0e6],.relationship-form button[data-v-b033a0e6],.relationship-group button[data-v-b033a0e6]{border:.5px solid var(--fg,#fffffff0);min-height:32px;color:inherit;font:inherit;background:0 0}.relationship-form select[data-v-b033a0e6]{width:100%;max-width:100%;padding:5px 8px}.relationship-form button[data-v-b033a0e6],.relationship-group button[data-v-b033a0e6]{cursor:pointer;padding:5px 10px}.relationship-remove[data-v-b033a0e6]{color:var(--fg-3,#ffffff85);align-self:start}.relationship-form button[data-v-b033a0e6]:disabled,.relationship-group button[data-v-b033a0e6]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-b033a0e6]{margin:4px 0;font-size:12px}.muted[data-v-b033a0e6]{color:var(--fg-3,#ffffff85)}.warn[data-v-b033a0e6]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-b033a0e6]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}"]], ["__scopeId", "data-v-b033a0e6"]]);
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/route-context.ts
function Fd(e = {}, t = Id()) {
	let n = new URLSearchParams(t), r = Ld(e.workspaceId), i = Ld(e.routeParams?.params?.workspaceId), a = Ld(n.get("workspaceId")), o = Ld(e.repositoryId), s = Ld(e.routeParams?.params?.repositoryId), c = Ld(n.get("repositoryId")), l = o ?? s, u = Ld(e.projectName), d = Ld(e.routeParams?.params?.projectName), f = Ld(n.get("projectName"));
	return {
		workspaceId: l ? r ?? i ?? a ?? iu() : a ?? r ?? i ?? iu(),
		repositoryId: l ?? c ?? null,
		projectName: u ?? d ?? f ?? null,
		state: Ld(n.get("state")) ?? Ld(e.state) ?? null
	};
}
function Id() {
	return typeof window > "u" ? "" : window.location.search;
}
function Ld(e) {
	return e == null ? void 0 : e.trim() || void 0;
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/IssuesList.vue?vue&type=script&setup=true&lang.ts
var Rd = {
	class: "issues-queue",
	"data-smoke": "issues-list"
}, zd = { class: "issues-queue-head" }, Bd = { class: "head-row" }, Vd = ["href"], Hd = { class: "issues-controls" }, Ud = {
	class: "issues-filter-row",
	role: "tablist",
	"aria-label": "Filter issues by state"
}, Wd = ["aria-selected", "onClick"], Gd = { class: "count" }, Kd = { class: "issues-search" }, qd = {
	key: 0,
	class: "issues-query-chips",
	"data-smoke": "issues-query-chips",
	"aria-label": "Parsed search filters"
}, Jd = ["title"], Yd = {
	key: 1,
	class: "issues-assignee-filter",
	"data-smoke": "issues-assignee-filter"
}, Xd = ["data-author-kind", "title"], Zd = { class: "author-glyph" }, Qd = {
	key: 2,
	class: "issues-project-filter",
	"data-smoke": "issues-project-filter"
}, $d = ["title"], ef = ["data-busy"], tf = ["placeholder", "disabled"], nf = {
	key: 0,
	class: "quick-add-status"
}, rf = ["title"], af = {
	key: 2,
	class: "quick-add-chip tone-yellow",
	title: "closeOnMerge=false — opt-out from PR auto-close reactor"
}, of = ["title"], sf = {
	key: 0,
	class: "quick-add-error",
	role: "alert"
}, cf = {
	key: 1,
	class: "issues-bulk-bar",
	"data-smoke": "issues-bulk-bar"
}, lf = { class: "count" }, uf = ["disabled"], df = { class: "bulk-reproject" }, ff = ["disabled"], pf = ["value"], mf = ["disabled"], hf = {
	key: 2,
	class: "quick-add-error",
	role: "alert"
}, gf = {
	key: 3,
	class: "muted"
}, _f = {
	key: 4,
	class: "muted error",
	role: "alert"
}, vf = {
	key: 5,
	class: "muted"
}, yf = ["href"], bf = {
	key: 6,
	class: "muted"
}, xf = {
	key: 7,
	class: "issues-list",
	role: "listbox",
	"aria-label": "Issue list"
}, Sf = ["aria-selected", "onMouseenter"], Cf = ["href"], wf = { class: "issues-row-number" }, Tf = { class: "issues-row-body" }, Ef = { class: "issues-row-title" }, Df = { class: "issues-row-meta" }, Of = ["title", "onClick"], kf = [
	"data-author-kind",
	"title",
	"onClick"
], Af = { class: "author-glyph" }, jf = ["data-author-kind"], Mf = { class: "author-glyph" }, Nf = {
	key: 0,
	class: "author-badge"
}, Pf = {
	key: 1,
	class: "author-badge"
}, Ff = {
	key: 2,
	class: "author-badge"
}, If = ["title"], Lf = /* @__PURE__ */ Cu(/* @__PURE__ */ Vn({
	__name: "IssuesList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issues: { type: [Array, null] },
		workspaceId: {
			default: iu(),
			type: String
		},
		repositoryId: {
			default: null,
			type: [String, null]
		},
		routeParams: { type: null },
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
		},
		projectName: {
			default: void 0,
			type: String
		},
		labelCatalog: {
			default: null,
			type: null
		}
	},
	setup(e) {
		let t = e, n = [
			{
				id: "OPEN",
				label: "Open",
				key: "o"
			},
			{
				id: "CLOSED",
				label: "Closed",
				key: "x"
			},
			{
				id: "ALL",
				label: "All",
				key: "a"
			}
		], r = /* @__PURE__ */ L("idle"), i = /* @__PURE__ */ L(null), a = /* @__PURE__ */ L(t.issues ?? []), o = /* @__PURE__ */ L("OPEN"), s = /* @__PURE__ */ L(""), c = /* @__PURE__ */ L(0), l = /* @__PURE__ */ L(""), u = /* @__PURE__ */ L(""), d = /* @__PURE__ */ L(/* @__PURE__ */ new Set()), f = /* @__PURE__ */ L(!1), p = /* @__PURE__ */ L(null), m = /* @__PURE__ */ L(typeof window > "u" ? "" : window.location.search);
		function h(e) {
			let t = new Set(d.value);
			t.has(e) ? t.delete(e) : t.add(e), d.value = t;
		}
		function g() {
			d.value = /* @__PURE__ */ new Set(), p.value = null;
		}
		async function _() {
			if (d.value.size === 0 || f.value || !te.value) return;
			let e = te.value, t = Array.from(d.value);
			f.value = !0, p.value = null;
			try {
				let n = await Promise.allSettled(t.map((t) => Xl(e, t))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
				n.forEach((e, n) => {
					let a = t[n];
					e.status === "fulfilled" ? r.set(a, e.value) : i.add(a);
				}), a.value = a.value.map((e) => r.get(e.id) ?? e), d.value = i, i.size > 0 && (p.value = `${i.size} of ${t.length} close calls failed; retry the remaining selection.`);
			} catch (e) {
				p.value = e instanceof Error ? e.message : String(e);
			} finally {
				f.value = !1;
			}
		}
		let v = /* @__PURE__ */ L([]);
		nr(async () => {
			try {
				v.value = await Tl();
			} catch {
				v.value = [];
			}
		});
		async function y(e) {
			if (d.value.size === 0 || f.value) return;
			let t = Array.from(d.value);
			f.value = !0, p.value = null;
			try {
				let n = await Promise.allSettled(t.map((t) => Ql(t, e))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
				if (n.forEach((e, n) => {
					let a = t[n];
					e.status === "fulfilled" ? r.set(a, e.value) : i.add(a);
				}), a.value = a.value.map((e) => r.get(e.id) ?? e), d.value = i, i.size > 0) {
					let n = e ?? "(no project)";
					p.value = `${i.size} of ${t.length} reassignments to ${n} failed; retry the remaining selection.`;
				}
			} catch (e) {
				p.value = e instanceof Error ? e.message : String(e);
			} finally {
				f.value = !1;
			}
		}
		function b(e) {
			let t = e.target;
			if (!t) return;
			let n = t.value, r = n === "__NONE__" ? null : n || null;
			t.value = "", n !== "" && y(r);
		}
		let x = /* @__PURE__ */ L(""), S = /* @__PURE__ */ L(!1), C = /* @__PURE__ */ L(null), w = /* @__PURE__ */ L({
			defaultLabels: [],
			closeOnMerge: null,
			ownerRefs: []
		}), ee = /* @__PURE__ */ L(!1), T = J(() => {
			let e = t.issues ?? a.value, n = O.value;
			return n ? e.filter((e) => e.projectName === n) : e;
		}), te = J(() => t.client ?? t.comtryaClient), E = J(() => Fd({
			workspaceId: t.workspaceId,
			repositoryId: t.repositoryId,
			routeParams: t.routeParams,
			projectName: t.projectName,
			state: t.state
		}, m.value)), ne = J(() => E.value.workspaceId), D = J(() => E.value.repositoryId ?? null), O = J(() => E.value.projectName ?? null), re = J(() => E.value.state ?? null), k = J(() => {
			let e = cu(), t = new URLSearchParams({ workspaceId: ne.value });
			return D.value && t.set("repositoryId", D.value), O.value && t.set("projectName", O.value), `${e}?${t.toString()}`;
		}), ie = (e, t) => t === "ALL" ? !0 : t === "OPEN" ? e.state === "OPEN" || e.state === "REOPENED" : e.state === "CLOSED", A = [
			"is",
			"assignee",
			"project"
		], ae = {
			open: "OPEN",
			closed: "CLOSED",
			reopened: "OPEN",
			all: "ALL"
		}, oe = J(() => gl(s.value, A)), se = J(() => {
			for (let e of oe.value.filters.is ?? []) {
				let t = ae[e.toLowerCase()];
				if (t) return t;
			}
			return o.value;
		}), ce = J(() => {
			for (let e of oe.value.filters.assignee ?? []) if (e.startsWith("comtrya://")) return e;
			return l.value;
		}), le = J(() => {
			if (O.value) return "";
			for (let e of oe.value.filters.project ?? []) if (e.trim()) return e.trim();
			return u.value;
		});
		function ue(e) {
			return Date.parse(e.updatedAt ?? "") || Date.parse(e.createdAt ?? "") || 0;
		}
		let de = J(() => {
			let e = oe.value.text.trim().toLowerCase(), t = ce.value, n = le.value, r = se.value;
			return T.value.filter((e) => ie(e, r)).filter((e) => n ? e.projectName === n : !0).filter((e) => t ? (e.assignees ?? []).includes(t) : !0).filter((t) => {
				if (!e) return !0;
				let n = (t.authorRef ?? "").split("/").pop() ?? "";
				return `${t.number} ${t.title} ${n}`.toLowerCase().includes(e);
			}).slice().sort((e, t) => {
				let n = ue(t) - ue(e);
				return n === 0 ? (t.number ?? 0) - (e.number ?? 0) : n;
			});
		}), fe = J(() => {
			let e = [];
			for (let t of oe.value.filters.is ?? []) {
				let n = ae[t.toLowerCase()];
				e.push({
					key: "is",
					value: t,
					label: n ? `is · ${n.toLowerCase()}` : `is · ${t}`,
					tone: "is"
				});
			}
			for (let t of oe.value.filters.assignee ?? []) {
				let n = $(t);
				e.push({
					key: "assignee",
					value: t,
					label: `→ ${n.label}`,
					tone: "assignee"
				});
			}
			for (let t of oe.value.filters.project ?? []) e.push({
				key: "project",
				value: t,
				label: `◇ ${t}`,
				tone: "project"
			});
			for (let t of oe.value.unknown) e.push({
				key: t,
				value: "",
				label: `unknown · ${t}:`,
				tone: "unknown"
			});
			return e;
		});
		function pe(e) {
			l.value === e ? l.value = "" : l.value = e;
		}
		function he() {
			l.value = "";
		}
		function ge(e) {
			u.value === e ? u.value = "" : u.value = e;
		}
		function _e() {
			u.value = "";
		}
		let ve = J(() => {
			let e = O.value;
			return e ? `New issue in ${e}…` : "New issue…";
		}), ye = J(() => {
			let e = {
				OPEN: 0,
				CLOSED: 0,
				ALL: T.value.length
			};
			for (let t of T.value) (t.state === "OPEN" || t.state === "REOPENED") && (e.OPEN += 1), t.state === "CLOSED" && (e.CLOSED += 1);
			return e;
		});
		function be(e) {
			if (!e) return "";
			let t = Date.parse(e);
			if (Number.isNaN(t)) return e;
			let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
		}
		function xe(e) {
			let t = e.createdAt ?? null, n = e.updatedAt ?? null;
			if (!n || n === t) return t ? `opened ${t}` : "";
			let r = [];
			return t && r.push(`opened ${t}`), r.push(`updated ${n}`), r.join("\n");
		}
		let Se = new Set([
			"OPEN",
			"CLOSED",
			"ALL"
		]);
		function Ce() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = (e.get("state") ?? "").toUpperCase();
			Se.has(t) && (o.value = t);
			let n = e.get("q");
			n !== null && (s.value = n);
			let r = e.get("assignee") ?? "";
			l.value = r.startsWith("comtrya://") ? r : "";
			let i = e.get("project") ?? "";
			u.value = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(i) ? i : "";
		}
		function M() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			o.value === "OPEN" ? e.delete("state") : e.set("state", o.value);
			let t = s.value.trim();
			t ? e.set("q", t) : e.delete("q"), l.value ? e.set("assignee", l.value) : e.delete("assignee"), u.value && !O.value ? e.set("project", u.value) : e.delete("project");
			let n = e.toString(), r = `${window.location.pathname}${n ? `?${n}` : ""}${window.location.hash}`;
			r !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", r);
		}
		let we = !1;
		nr(() => {
			we = !0, Ce(), we = !1, Oe(), De(), window.addEventListener("popstate", Te);
		}), or(() => {
			window.removeEventListener("popstate", Te);
		});
		function Te() {
			we = !0, m.value = window.location.search, Ce(), hn(() => {
				we = !1;
			});
		}
		z([
			o,
			s,
			l,
			u
		], () => {
			we || M();
		}), Ds({
			j: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, de.value.length - 1));
			},
			ArrowDown: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, de.value.length - 1));
			},
			k: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			ArrowUp: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			Enter: (e) => {
				let t = de.value[c.value];
				t && (e.preventDefault(), window.location.href = su(t));
			},
			" ": (e) => {
				let t = de.value[c.value];
				t && (e.preventDefault(), h(t.id));
			},
			Escape: (e) => {
				d.value.size !== 0 && (e.preventDefault(), g());
			},
			"/": (e) => {
				e.preventDefault(), document.querySelector("[data-issues-search]")?.focus();
			},
			c: (e) => {
				e.preventDefault(), ke();
			},
			...Object.fromEntries(n.map((e) => [e.key, (t) => {
				t.preventDefault(), o.value = e.id;
			}]))
		});
		function N(e) {
			s.value &&= (e.preventDefault(), "");
		}
		function Ee(e) {
			e.preventDefault(), x.value = "", C.value = null, e.target?.blur();
		}
		z(() => [
			te.value,
			t.issues,
			ne.value,
			D.value,
			re.value
		], () => void Oe()), z(O, () => void De()), z(de, (e) => {
			c.value >= e.length && (c.value = Math.max(0, e.length - 1));
		});
		async function De() {
			let e = O.value;
			if (!e) {
				w.value = {
					defaultLabels: [],
					closeOnMerge: null,
					ownerRefs: []
				}, ee.value = !0;
				return;
			}
			w.value = await ku(e, "location"), ee.value = !0;
		}
		async function Oe() {
			if (t.issues) {
				a.value = t.issues, r.value = t.issues.length > 0 ? "ready" : "empty", i.value = null;
				return;
			}
			if (!te.value) {
				a.value = [], r.value = "error", i.value = "issues: no client";
				return;
			}
			r.value = "loading", i.value = null;
			try {
				let e = await Kl(te.value, {
					workspaceId: ne.value,
					repositoryId: D.value,
					state: re.value
				});
				a.value = e, r.value = e.length > 0 ? "ready" : "empty";
			} catch (e) {
				a.value = [], r.value = "error", i.value = e instanceof Error ? e.message : String(e);
			}
		}
		function ke() {
			document.querySelector("[data-smoke=\"issues-quick-add\"]")?.focus();
		}
		async function Ae() {
			let e = x.value.trim();
			if (!(!e || S.value)) {
				S.value = !0, C.value = null;
				try {
					let t = await Yl({
						workspaceId: ne.value,
						repositoryId: D.value,
						projectName: O.value,
						title: e,
						bodyMarkdown: "",
						labels: w.value.defaultLabels,
						closeOnMerge: w.value.closeOnMerge,
						assignees: w.value.ownerRefs
					});
					a.value.some((e) => e.id === t.id) || (a.value = [t, ...a.value]), x.value = "", r.value = "ready", Oe(), hn(ke);
				} catch (e) {
					C.value = e instanceof Error ? e.message : String(e);
				} finally {
					S.value = !1;
				}
			}
		}
		return (t, a) => (V(), H("section", Rd, [
			U("header", zd, [
				U("div", Bd, [U("h2", null, j(e.title), 1), e.showNewLink ? (V(), H("a", {
					key: 0,
					href: k.value,
					class: "issues-new"
				}, "+ new", 8, Vd)) : K("", !0)]),
				U("div", Hd, [U("div", Ud, [(V(), H(B, null, fr(n, (e) => U("button", {
					key: e.id,
					type: "button",
					role: "tab",
					"aria-selected": o.value === e.id,
					class: me(["issues-filter", { active: o.value === e.id }]),
					onClick: (t) => o.value = e.id
				}, [
					U("span", null, j(e.label), 1),
					U("span", Gd, j(ye.value[e.id]), 1),
					U("kbd", null, j(e.key), 1)
				], 10, Wd)), 64))]), U("label", Kd, [On(U("input", {
					"data-issues-search": "",
					"onUpdate:modelValue": a[0] ||= (e) => s.value = e,
					type: "search",
					placeholder: "Filter — try is:open · project:<name> · assignee:<urn> · text",
					autocomplete: "off",
					onKeydown: yo(N, ["esc"])
				}, null, 544), [[uo, s.value]]), a[2] ||= U("kbd", null, "/", -1)])]),
				fe.value.length > 0 ? (V(), H("div", qd, [(V(!0), H(B, null, fr(fe.value, (e) => (V(), H("span", {
					key: `${e.key}:${e.value || "unknown"}`,
					class: me(["query-chip", `tone-${e.tone}`]),
					title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
				}, j(e.label), 11, Jd))), 128)), a[3] ||= U("span", { class: "query-chips-hint" }, [
					G(" syntax: "),
					U("code", null, "is:open"),
					G(" · "),
					U("code", null, "project:<name>"),
					G(" · "),
					U("code", null, "assignee:<urn>")
				], -1)])) : K("", !0),
				l.value ? (V(), H("div", Yd, [
					a[4] ||= U("span", { class: "prefix" }, "assigned to", -1),
					U("span", {
						class: "active-chip",
						"data-author-kind": R($)(l.value).kind,
						title: l.value
					}, [U("span", Zd, j(R($)(l.value).glyph), 1), G(" " + j(R($)(l.value).label), 1)], 8, Xd),
					U("button", {
						type: "button",
						class: "clear",
						onClick: he,
						"aria-label": "Clear assignee filter"
					}, " clear ✕ ")
				])) : K("", !0),
				u.value && !O.value ? (V(), H("div", Qd, [
					a[6] ||= U("span", { class: "prefix" }, "project", -1),
					U("span", {
						class: "active-chip",
						title: `Scoped to project ${u.value}`
					}, [a[5] ||= U("span", { class: "project-glyph" }, "◇", -1), G(" " + j(u.value), 1)], 8, $d),
					U("button", {
						type: "button",
						class: "clear",
						onClick: _e,
						"aria-label": "Clear project filter"
					}, " clear ✕ ")
				])) : K("", !0)
			]),
			U("form", {
				class: "issues-quick-add",
				"data-busy": S.value ? "true" : "false",
				onSubmit: _o(Ae, ["prevent"])
			}, [
				a[7] ||= U("span", {
					class: "quick-add-glyph",
					"aria-hidden": "true"
				}, "+", -1),
				On(U("input", {
					"onUpdate:modelValue": a[1] ||= (e) => x.value = e,
					"data-smoke": "issues-quick-add",
					type: "text",
					autocomplete: "off",
					placeholder: ve.value,
					disabled: S.value,
					onKeydown: yo(Ee, ["esc"])
				}, null, 40, tf), [[uo, x.value]]),
				S.value ? (V(), H("span", nf, "opening…")) : w.value.defaultLabels.length > 0 ? (V(), H("span", {
					key: 1,
					class: "quick-add-chip tone-teal",
					title: `Labels will be pre-stamped: ${w.value.defaultLabels.join(", ")}`
				}, " labels · " + j(w.value.defaultLabels.join(", ")), 9, rf)) : K("", !0),
				w.value.closeOnMerge === !1 ? (V(), H("span", af, "closeOnMerge · off")) : K("", !0),
				w.value.ownerRefs.length > 0 ? (V(), H("span", {
					key: 3,
					class: "quick-add-chip tone-teal",
					title: `Assigned on create: ${w.value.ownerRefs.join(", ")}`
				}, "→ " + j(w.value.ownerRefs.map((e) => e.split("/").pop()).join(" · ")), 9, of)) : K("", !0),
				a[8] ||= U("span", { class: "quick-add-hint" }, [
					U("kbd", null, "↵"),
					G(" create · "),
					U("kbd", null, "esc"),
					G(" clear · "),
					U("kbd", null, "c"),
					G(" focus ")
				], -1)
			], 40, ef),
			C.value ? (V(), H("p", sf, j(C.value), 1)) : K("", !0),
			d.value.size > 0 ? (V(), H("div", cf, [
				U("span", lf, j(d.value.size) + " selected", 1),
				U("button", {
					type: "button",
					class: "bulk-action",
					disabled: f.value,
					onClick: _
				}, j(f.value ? "closing…" : `close ${d.value.size}`), 9, uf),
				U("label", df, [a[11] ||= U("span", { class: "bulk-reproject-label" }, "reproject →", -1), U("select", {
					class: "bulk-reproject-select",
					"data-smoke": "issues-bulk-reproject",
					disabled: f.value,
					onChange: b
				}, [
					a[9] ||= U("option", {
						value: "",
						disabled: "",
						selected: ""
					}, "pick project…", -1),
					a[10] ||= U("option", { value: "__NONE__" }, "— no project —", -1),
					(V(!0), H(B, null, fr(v.value, (e) => (V(), H("option", {
						key: e.name,
						value: e.name ?? ""
					}, "◇ " + j(e.name), 9, pf))), 128))
				], 40, ff)]),
				U("button", {
					type: "button",
					class: "bulk-clear",
					disabled: f.value,
					onClick: g
				}, [...a[12] ||= [G("clear ", -1), U("kbd", null, "esc", -1)]], 8, mf),
				a[13] ||= U("span", { class: "hint" }, [U("kbd", null, "space"), G(" toggle row ")], -1)
			])) : K("", !0),
			p.value ? (V(), H("p", hf, j(p.value), 1)) : K("", !0),
			r.value === "loading" ? (V(), H("p", gf, "Loading issues…")) : r.value === "error" ? (V(), H("p", _f, j(i.value), 1)) : T.value.length === 0 ? (V(), H("p", vf, [
				a[14] ||= G(" No issues yet. ", -1),
				U("a", { href: k.value }, "Create one", 8, yf),
				a[15] ||= G(" to get started. ", -1)
			])) : de.value.length === 0 ? (V(), H("p", bf, " No issues match the current filter. ")) : (V(), H("ol", xf, [(V(!0), H(B, null, fr(de.value, (t, n) => (V(), H("li", {
				key: t.id,
				class: me(["issues-row", {
					focused: n === c.value,
					selected: d.value.has(t.id)
				}]),
				role: "option",
				"aria-selected": n === c.value,
				onMouseenter: (e) => c.value = n
			}, [U("a", {
				href: R(su)(t),
				class: "issues-row-link"
			}, [
				U("span", wf, "#" + j(t.number), 1),
				U("span", Tf, [U("span", Ef, j(t.title), 1), U("span", Df, [
					U("span", { class: me(["issue-state", R(lu)(t.state).className]) }, j(R(lu)(t.state).label), 3),
					t.projectName ? (V(), H("button", {
						key: 0,
						type: "button",
						class: me(["issue-project", { active: u.value === t.projectName }]),
						title: `${t.projectName}\nClick to filter by this project`,
						onClick: _o((e) => ge(t.projectName), ["prevent", "stop"])
					}, [a[16] ||= U("span", { class: "project-glyph" }, "◇", -1), G(" " + j(t.projectName), 1)], 10, Of)) : K("", !0),
					(V(!0), H(B, null, fr(t.labels ?? [], (t) => (V(), Fi(R(Al), {
						key: t,
						name: t,
						catalog: e.labelCatalog
					}, null, 8, ["name", "catalog"]))), 128)),
					(V(!0), H(B, null, fr(t.assignees ?? [], (e) => (V(), H("button", {
						key: `assignee-${e}`,
						type: "button",
						class: me(["issue-assignee", { active: l.value === e }]),
						"data-author-kind": R($)(e).kind,
						title: `${e}\nClick to filter by this assignee`,
						onClick: _o((t) => pe(e), ["prevent", "stop"])
					}, [U("span", Af, j(R($)(e).glyph), 1), G(" " + j(R($)(e).label), 1)], 10, kf))), 128)),
					t.authorRef ? (V(), H("span", {
						key: 1,
						class: "issue-author",
						"data-author-kind": R($)(t.authorRef).kind
					}, [
						U("span", Mf, j(R($)(t.authorRef).glyph), 1),
						G(" " + j(R($)(t.authorRef).label) + " ", 1),
						R($)(t.authorRef).kind === "agent" ? (V(), H("span", Nf, "agent")) : R($)(t.authorRef).kind === "credential" ? (V(), H("span", Pf, "bot")) : R($)(t.authorRef).kind === "bot" ? (V(), H("span", Ff, "bot")) : K("", !0)
					], 8, jf)) : K("", !0)
				])]),
				U("span", {
					class: "issues-row-age",
					title: xe(t)
				}, j(be(t.updatedAt ?? t.createdAt)), 9, If)
			], 8, Cf)], 42, Sf))), 128))])),
			a[17] ||= Ui("<footer class=\"issues-foot\" data-v-f476b18a><span data-v-f476b18a><kbd data-v-f476b18a>j</kbd> <kbd data-v-f476b18a>k</kbd> navigate · <kbd data-v-f476b18a>↵</kbd> open · <kbd data-v-f476b18a>/</kbd> search · <kbd data-v-f476b18a>c</kbd> create · <kbd data-v-f476b18a>o</kbd> open <kbd data-v-f476b18a>x</kbd> closed <kbd data-v-f476b18a>a</kbd> all </span></footer>", 1)
		]));
	}
}), [["styles", [".issues-queue[data-v-f476b18a]{min-width:0;font-family:var(--font-sans,system-ui);color:var(--fg,#fffffff0);gap:14px;display:grid}.issues-queue-head[data-v-f476b18a]{gap:12px;min-width:0;display:grid}.head-row[data-v-f476b18a]{justify-content:space-between;align-items:baseline;gap:12px;min-width:0;display:flex}.issues-queue-head h2[data-v-f476b18a]{font-family:var(--font-serif,system-ui);margin:0;font-size:22px;line-height:1}.issues-new[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);border:.5px solid var(--fg,#fffffff0);padding:6px 12px;font-size:12px;text-decoration:none}.issues-controls[data-v-f476b18a]{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;min-width:0;display:flex}.issues-query-chips[data-v-f476b18a]{font-family:var(--font-mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;font-size:11px;display:flex}.issues-query-chips .query-chip[data-v-f476b18a]{letter-spacing:.02em;white-space:nowrap;border:.5px solid;align-items:center;padding:1px 7px;display:inline-flex}.issues-query-chips .query-chip.tone-is[data-v-f476b18a]{color:var(--accent-teal,#087f6f)}.issues-query-chips .query-chip.tone-assignee[data-v-f476b18a]{color:var(--fg,#fffffff0)}.issues-query-chips .query-chip.tone-project[data-v-f476b18a]{color:var(--accent-blue,#1d55a6)}.issues-query-chips .query-chip.tone-unknown[data-v-f476b18a]{color:var(--accent-yellow,#c89300);border-style:dashed}.issues-query-chips .query-chips-hint[data-v-f476b18a]{color:var(--fg-3,#ffffff85);letter-spacing:0;margin-left:4px}.issues-query-chips .query-chips-hint code[data-v-f476b18a]{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);color:var(--fg-2,#ffffffbd);padding:0 4px;font-size:11px}.issues-assignee-filter[data-v-f476b18a]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);align-items:center;gap:8px;margin-top:8px;padding:6px 10px;font-size:11px;display:inline-flex}.issues-assignee-filter .prefix[data-v-f476b18a]{color:var(--fg-3,#ffffff85);letter-spacing:.04em;text-transform:lowercase}.issues-assignee-filter .active-chip[data-v-f476b18a]{color:var(--fg,#fffffff0);border:.5px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.issues-assignee-filter .active-chip[data-author-kind=agent][data-v-f476b18a]{color:#6b3fa0}.issues-assignee-filter .active-chip[data-author-kind=credential][data-v-f476b18a]{color:var(--accent-yellow,#c89300)}.issues-assignee-filter .active-chip[data-author-kind=bot][data-v-f476b18a]{color:var(--accent-blue,#1d55a6)}.issues-assignee-filter .active-chip[data-author-kind=team][data-v-f476b18a]{color:var(--accent-teal,#087f6f)}.issues-project-filter[data-v-f476b18a]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);align-items:center;gap:8px;margin-top:8px;padding:6px 10px;font-size:11px;display:inline-flex}.issues-project-filter .prefix[data-v-f476b18a]{color:var(--fg-3,#ffffff85);letter-spacing:.04em;text-transform:lowercase}.issues-project-filter .active-chip[data-v-f476b18a]{color:var(--accent-blue,#1d55a6);border:.5px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.issues-project-filter .project-glyph[data-v-f476b18a]{font-size:10px}.issues-project-filter .clear[data-v-f476b18a]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.issues-project-filter .clear[data-v-f476b18a]:hover{color:var(--fg,#fffffff0)}.issues-assignee-filter .author-glyph[data-v-f476b18a]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.issues-assignee-filter .clear[data-v-f476b18a]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.issues-assignee-filter .clear[data-v-f476b18a]:hover{color:var(--fg,#fffffff0)}.issues-quick-add[data-v-f476b18a]{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);align-items:center;gap:8px;min-width:0;padding:6px 10px 6px 6px;transition:border-color .12s;display:flex}.issues-quick-add[data-v-f476b18a]:focus-within{border-color:var(--fg,#fffffff0)}.issues-quick-add[data-busy=true][data-v-f476b18a]{opacity:.85;border-style:dashed}.quick-add-glyph[data-v-f476b18a]{width:22px;height:22px;font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);border:.5px solid;border-radius:2px;place-items:center;font-size:13px;display:inline-grid}.issues-quick-add input[data-v-f476b18a]{min-width:0;color:inherit;font-family:var(--font-serif,system-ui);background:0 0;border:0;outline:none;flex:1;padding:4px 0;font-size:15px}.issues-quick-add input[data-v-f476b18a]::placeholder{color:var(--fg-4,#ffffff57);font-style:italic}.quick-add-status[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}.quick-add-chip[data-v-f476b18a]{font-family:var(--font-mono,monospace);letter-spacing:.02em;white-space:nowrap;border:.5px solid;align-items:center;padding:1px 6px;font-size:10.5px;display:inline-flex}.quick-add-chip.tone-teal[data-v-f476b18a]{color:var(--accent-teal,#087f6f)}.quick-add-chip.tone-yellow[data-v-f476b18a]{color:var(--accent-yellow,#c89300)}.quick-add-hint[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--fg-4,#ffffff57);white-space:nowrap;font-size:10.5px}.quick-add-hint kbd[data-v-f476b18a]{font-family:var(--font-mono,monospace);border:.5px solid;padding:0 4px;font-size:10px}.quick-add-error[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--accent-err,#c9341c);margin:-6px 0 0;font-size:11px}.issues-filter-row[data-v-f476b18a]{border:.5px solid var(--fg,#fffffff0);flex-wrap:wrap;gap:4px;display:inline-flex}.issues-filter[data-v-f476b18a]{color:inherit;cursor:pointer;font-family:var(--font-mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;display:inline-flex}.issues-filter[data-v-f476b18a]:not(:last-child){border-right:.5px solid var(--line,#ffffff12)}.issues-filter.active[data-v-f476b18a]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.issues-filter .count[data-v-f476b18a]{color:var(--fg-3,#ffffff85);font-variant-numeric:tabular-nums}.issues-filter.active .count[data-v-f476b18a]{color:var(--bg-2,#0e1014)}.issues-filter kbd[data-v-f476b18a]{font-family:var(--font-mono,monospace);opacity:.6;border:.5px solid;padding:0 4px;font-size:10px}.issues-search[data-v-f476b18a]{border:.5px solid var(--fg,#fffffff0);flex:240px;align-items:center;gap:8px;min-width:0;max-width:420px;padding:4px 10px;display:inline-flex}.issues-search input[data-v-f476b18a]{color:inherit;font:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0}.issues-search kbd[data-v-f476b18a]{border:.5px solid var(--fg,#fffffff0);font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);padding:0 4px;font-size:10px}.muted[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);border-top:.5px solid var(--line,#ffffff12);padding:18px 0;font-size:13px}.muted.error[data-v-f476b18a]{color:var(--accent-err,#c9341c)}.issues-list[data-v-f476b18a]{border-top:.5px solid var(--fg,#fffffff0);min-width:0;margin:0;padding:0;list-style:none;display:grid}.issues-row[data-v-f476b18a]{border-bottom:.5px solid var(--line,#ffffff12);min-width:0;position:relative}.issues-row.focused[data-v-f476b18a]{background:var(--bg-2,#0e1014)}.issues-row.selected[data-v-f476b18a]{background:var(--bg-2,#0e1014);box-shadow:inset 3px 0 0 var(--fg,#fffffff0)}.issues-row.selected.focused[data-v-f476b18a]{background:var(--bg-2,#0e1014);box-shadow:inset 3px 0 0 var(--accent-teal,#087f6f)}.issues-bulk-bar[data-v-f476b18a]{z-index:5;border:.5px solid var(--fg,#fffffff0);background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);font-family:var(--font-mono,monospace);align-items:center;gap:12px;margin:8px 0;padding:8px 12px;font-size:12px;display:flex;position:sticky;top:0}.issues-bulk-bar .count[data-v-f476b18a]{letter-spacing:.02em;font-weight:600}.issues-bulk-bar .bulk-action[data-v-f476b18a]{border:.5px solid var(--bg,#0a0b0e);color:var(--bg,#0a0b0e);font-family:var(--font-mono,monospace);cursor:pointer;letter-spacing:.02em;text-transform:lowercase;background:0 0;padding:4px 10px;font-size:11px}.issues-bulk-bar .bulk-action[data-v-f476b18a]:hover:not(:disabled){background:var(--bg,#0a0b0e);color:var(--fg,#fffffff0)}.issues-bulk-bar .bulk-action[data-v-f476b18a]:disabled{opacity:.5;cursor:wait}.issues-bulk-bar .bulk-reproject[data-v-f476b18a]{align-items:center;gap:6px;display:inline-flex}.issues-bulk-bar .bulk-reproject-label[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--bg-2,#0e1014);letter-spacing:.04em;font-size:11px}.issues-bulk-bar .bulk-reproject-select[data-v-f476b18a]{border:.5px solid var(--bg-2,#0e1014);color:var(--bg,#0a0b0e);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;outline:none;padding:2px 6px;font-size:11px}.issues-bulk-bar .bulk-reproject-select[data-v-f476b18a]:disabled{opacity:.5;cursor:wait}.issues-bulk-bar .bulk-reproject-select option[data-v-f476b18a]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.issues-bulk-bar .bulk-clear[data-v-f476b18a]{color:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 4px;font-size:11px}.issues-bulk-bar .bulk-clear kbd[data-v-f476b18a]{border:.5px solid;margin-left:4px;padding:0 4px;font-size:10px}.issues-bulk-bar .hint[data-v-f476b18a]{color:var(--bg-2,#0e1014);letter-spacing:.04em;font-size:10.5px}.issues-bulk-bar .hint kbd[data-v-f476b18a]{border:.5px solid;padding:0 4px;font-size:10px}.issues-row-link[data-v-f476b18a]{min-width:0;color:inherit;grid-template-columns:56px 1fr auto;align-items:baseline;gap:14px;padding:12px 12px 12px 6px;text-decoration:none;display:grid}.issues-row-link[data-v-f476b18a]:hover{background:var(--bg-2,#0e1014);text-decoration:none}.issues-row-number[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);text-align:right;font-variant-numeric:tabular-nums;font-size:12px}.issues-row-body[data-v-f476b18a]{gap:4px;min-width:0;display:grid}.issues-row-title[data-v-f476b18a]{font-family:var(--font-serif,system-ui);text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;overflow:hidden}.issues-row-meta[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);flex-wrap:wrap;align-items:baseline;gap:10px;font-size:12px;display:flex}.issue-state[data-v-f476b18a]{letter-spacing:.04em;text-transform:uppercase;border:.5px solid;padding:0 6px;font-size:11px}.issue-state.issue-state-open[data-v-f476b18a]{color:var(--accent-teal,#087f6f)}.issue-state.issue-state-closed[data-v-f476b18a]{color:var(--accent-blue,#1d55a6)}.issue-project[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--accent-blue,#1d55a6);cursor:pointer;font-size:11px;font:inherit;font-family:var(--font-mono,monospace);background:0 0;border:.5px solid;align-items:center;gap:4px;padding:0 6px;display:inline-flex}.issue-project[data-v-f476b18a]:hover{background:var(--bg-2,#0e1014)}.issue-project.active[data-v-f476b18a]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);border-color:var(--fg,#fffffff0)}.issue-project .project-glyph[data-v-f476b18a]{font-size:10px}.issue-label[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--accent-teal,#087f6f);letter-spacing:.02em;border:.5px solid;padding:0 5px;font-size:10px}.issue-author[data-v-f476b18a]{font-family:var(--font-mono,monospace);align-items:center;gap:5px;font-size:12px;display:inline-flex}.issue-author .author-glyph[data-v-f476b18a]{width:14px;height:14px;color:var(--fg-3,#ffffff85);border:.5px solid;place-items:center;font-size:10px;font-weight:700;display:inline-grid}.issue-author[data-author-kind=agent][data-v-f476b18a]{color:#6b3fa0}.issue-author[data-author-kind=credential][data-v-f476b18a]{color:var(--accent-yellow,#c89300)}.issue-author[data-author-kind=bot][data-v-f476b18a]{color:var(--accent-blue,#1d55a6)}.issue-author .author-badge[data-v-f476b18a]{letter-spacing:.04em;text-transform:uppercase;border:.5px solid;padding:0 4px;font-size:10px}.issue-assignee[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);cursor:pointer;font-size:11px;font:inherit;font-family:var(--font-mono,monospace);background:0 0;border:1px dashed;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.issue-assignee[data-v-f476b18a]:hover{background:var(--bg-2,#0e1014)}.issue-assignee.active[data-v-f476b18a]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);border-color:var(--fg,#fffffff0)}.issue-assignee.active .author-glyph[data-v-f476b18a]{color:inherit}.issue-assignee .author-glyph[data-v-f476b18a]{width:12px;height:12px;color:inherit;border:0;place-items:center;font-size:9px;font-weight:700;display:inline-grid}.issue-assignee[data-author-kind=agent][data-v-f476b18a]{color:#6b3fa0}.issue-assignee[data-author-kind=credential][data-v-f476b18a]{color:var(--accent-yellow,#c89300)}.issue-assignee[data-author-kind=bot][data-v-f476b18a]{color:var(--accent-blue,#1d55a6)}.issue-assignee[data-author-kind=team][data-v-f476b18a]{color:var(--accent-teal,#087f6f)}.issues-row-age[data-v-f476b18a]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);white-space:nowrap;font-size:12px}.issues-foot[data-v-f476b18a]{min-width:0;font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}.issues-foot kbd[data-v-f476b18a]{font-family:var(--font-mono,monospace);border:.5px solid;padding:0 4px;font-size:10px}@media (max-width:520px){.head-row[data-v-f476b18a],.issues-controls[data-v-f476b18a],.issues-quick-add[data-v-f476b18a]{align-items:stretch}.head-row[data-v-f476b18a]{flex-wrap:wrap}.issues-new[data-v-f476b18a]{justify-self:start}.issues-controls[data-v-f476b18a]{grid-template-columns:minmax(0,1fr);display:grid}.issues-search[data-v-f476b18a]{flex-basis:auto;width:100%;max-width:none}.issues-quick-add[data-v-f476b18a]{flex-wrap:wrap}.quick-add-status[data-v-f476b18a],.quick-add-hint[data-v-f476b18a]{white-space:normal;max-width:100%}.issues-row-link[data-v-f476b18a]{grid-template-columns:42px minmax(0,1fr);align-items:start;gap:10px}.issues-row-age[data-v-f476b18a]{grid-column:2;justify-self:start}.issues-foot[data-v-f476b18a]{overflow-wrap:anywhere}}"]], ["__scopeId", "data-v-f476b18a"]]), Rf = /* @__PURE__ */ new Map();
function zf(e) {
	return [
		e.id,
		e.number,
		e.title,
		e.state
	].join("|");
}
function Bf(e, t) {
	let n = [];
	return n.push(vs({
		id: `ext_issues.open.${e.id}`,
		title: `Open issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: () => {
			window.location.href = su(e);
		}
	})), e.state === "OPEN" || e.state === "REOPENED" ? n.push(vs({
		id: `ext_issues.close.${e.id}`,
		title: `Close issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: async () => {
			await Xl(t, e.id);
		}
	})) : e.state === "CLOSED" && n.push(vs({
		id: `ext_issues.reopen.${e.id}`,
		title: `Reopen issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: async () => {
			await Zl(t, e.id);
		}
	})), () => n.forEach((e) => e());
}
async function Vf(e, t) {
	let n;
	try {
		n = await Kl(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_issues] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = zf(t), i = Rf.get(t.id);
		i && i.signature === n || (i?.unregister(), Rf.set(t.id, {
			signature: n,
			unregister: Bf(t, e)
		}));
	}
	for (let [e, t] of Rf) r.has(e) || (t.unregister(), Rf.delete(e));
}
function Hf(e) {
	let t = [], n = !1;
	return Cs().then((r) => {
		if (!n) {
			Vf(e, r);
			for (let n of [
				"dev.comtrya.issues.opened",
				"dev.comtrya.issues.closed",
				"dev.comtrya.issues.reopened"
			]) t.push(Jo({
				type: n,
				onEvent: () => {
					Vf(e, r);
				},
				onError: () => {}
			}));
		}
	}), () => {
		n = !0;
		for (let e of t) e();
		for (let e of Rf.values()) e.unregister();
		Rf.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/register.ts
var Uf = "ext_issues", Wf = "comtrya-issue-card", Gf = "comtrya-issues-list", Kf = "comtrya-issues-repo-list", qf = "comtrya-issue-detail", Jf = "comtrya-issue-relationships", Yf = "comtrya-issue-new";
jl({
	tagName: Wf,
	component: wu,
	propertyAliases: { ref: "resourceRef" }
}), jl({
	tagName: Gf,
	component: Lf
}), jl({
	tagName: Kf,
	component: Lf
}), jl({
	tagName: qf,
	component: vd
}), jl({
	tagName: Jf,
	component: Pd
}), Zf();
var Xf = {
	id: Uf,
	setup(e) {
		e.registerCard({
			resourceKind: "issue",
			element: Wf,
			requiredPermission: "issues.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "issue",
			loadTargets: async (t) => (await Kl(e.client, {
				workspaceId: t.workspaceId ?? iu(),
				repositoryId: t.repositoryId
			})).map((e) => ({
				ref: au(e),
				kind: "issue",
				title: `#${e.number} ${e.title}`,
				subtitle: e.state.toLowerCase()
			}))
		}), e.registerWidget({
			id: "issues-list",
			element: Gf,
			defaultSlot: "repository.main",
			defaultPriority: 100,
			requiredPermission: "issues.read"
		}), e.registerRoute("/", {
			element: Gf,
			requiredPermission: "issues.read"
		}), e.registerRoute("/new", {
			element: Yf,
			requiredPermission: "issues.write"
		}), e.registerRoute("/:workspaceId/:number", {
			element: qf,
			requiredPermission: "issues.read"
		}), Hf(e.client);
	}
};
function Zf() {
	if (typeof customElements > "u" || customElements.get(Yf)) return;
	class e extends HTMLElement {
		routeParams;
		workspaceId;
		repositoryId;
		connectedCallback() {
			this.replaceChildren(Qf(Fd({
				routeParams: this.routeParams,
				workspaceId: this.workspaceId,
				repositoryId: this.repositoryId
			})));
		}
	}
	customElements.define(Yf, e);
}
function Qf(e) {
	np();
	let t = document.createElement("main");
	t.className = "issue-new", t.dataset.smoke = "issue-new";
	let n = document.createElement("header");
	n.className = "issue-new-head";
	let r = document.createElement("span");
	r.className = "issue-new-overline", r.textContent = e.projectName ? `${e.projectName} · issue` : "Issue";
	let i = document.createElement("h1");
	i.textContent = "New issue", n.append(r, i);
	let a = document.createElement("form");
	a.className = "issue-new-form";
	let o = $f("Title"), s = document.createElement("input");
	s.required = !0, s.placeholder = "What needs to be done?", o.append(s);
	let c = $f("Project", "Stamps the Project on this issue and pulls its CUE policy."), l = document.createElement("select");
	l.className = "issue-new-project-select", l.dataset.smoke = "issue-new-project";
	let u = document.createElement("option");
	u.value = "", u.textContent = "— no project —", l.append(u), c.append(l);
	let d = $f("Description", "Optional. Supports Markdown."), f = document.createElement("textarea");
	f.rows = 6, f.placeholder = "Add context, repro steps, links…", d.append(f);
	let p = $f("Labels"), m = document.createElement("input");
	m.placeholder = "comma-separated", m.dataset.smoke = "issue-new-labels", p.append(m);
	let h = document.createElement("p");
	h.className = "issue-new-hint", h.hidden = !0, p.append(h);
	let g = document.createElement("div");
	g.className = "issue-new-policy", g.hidden = !0, g.dataset.smoke = "issue-new-policy";
	let _ = null, v = [];
	function y(e) {
		if (!e) {
			v.length > 0 && m.value.trim() && (m.value = rp(m.value).filter((e) => !v.includes(e)).join(", ")), v = [], h.hidden = !0, h.textContent = "", g.hidden = !0, g.replaceChildren(), _ = null, r.textContent = "Issue";
			return;
		}
		r.textContent = `${e} · issue`, ku(e, "referrer").then((t) => {
			let n = rp(m.value).filter((e) => !v.includes(e)), r = [], i = /* @__PURE__ */ new Set();
			for (let e of [...t.defaultLabels, ...n]) i.has(e) || (i.add(e), r.push(e));
			if (m.value = r.join(", "), v = [...t.defaultLabels], t.defaultLabels.length > 0 ? (h.hidden = !1, h.textContent = `Pre-filled from CUE · ${e} → issues.defaultLabels`) : h.hidden = !0, _ = t.closeOnMerge, t.closeOnMerge !== null) {
				g.hidden = !1;
				let e = document.createElement("span");
				e.className = `issue-new-chip ${t.closeOnMerge ? "chip-on" : "chip-off"}`, e.textContent = t.closeOnMerge ? "closeOnMerge · on" : "closeOnMerge · off";
				let n = document.createElement("span");
				n.className = "issue-new-chip-detail", n.textContent = t.closeOnMerge ? "Auto-closes when a linked PR merges." : "Stays open when a linked PR merges.", g.replaceChildren(e, n);
			} else g.hidden = !0, g.replaceChildren();
		});
	}
	Tl().then((t) => {
		for (let n of t) {
			if (!n.name) continue;
			let t = document.createElement("option");
			t.value = n.name, t.textContent = n.name, n.name === e.projectName && (t.selected = !0), l.append(t);
		}
		e.projectName && y(e.projectName);
	}), l.addEventListener("change", () => {
		y(l.value || null);
	});
	let b = document.createElement("div");
	b.className = "issue-new-actions";
	let x = document.createElement("button");
	x.type = "submit", x.className = "issue-new-submit", x.textContent = "Create issue", b.append(x);
	let S = document.createElement("p");
	return S.className = "issue-new-error", S.setAttribute("role", "alert"), S.hidden = !0, a.append(o, c, d, p, g, b, S), a.addEventListener("submit", (t) => {
		t.preventDefault(), x.disabled = !0, S.hidden = !0, Yl({
			workspaceId: e.workspaceId,
			repositoryId: e.repositoryId,
			projectName: l.value || null,
			title: s.value.trim(),
			bodyMarkdown: f.value,
			labels: rp(m.value),
			closeOnMerge: _
		}).then((e) => {
			window.location.assign(su(e));
		}).catch((e) => {
			S.textContent = e instanceof Error ? e.message : String(e), S.hidden = !1, x.disabled = !1;
		});
	}), t.append(n, a), t;
}
function $f(e, t) {
	let n = document.createElement("div");
	n.className = "issue-new-field";
	let r = document.createElement("label");
	if (r.className = "issue-new-label", r.textContent = e, n.append(r), t) {
		let e = document.createElement("span");
		e.className = "issue-new-hint", e.textContent = t, n.append(e);
	}
	return n;
}
var ep = "comtrya-issue-new-styles", tp = "\n.issue-new {\n  display: grid;\n  gap: 24px;\n  max-width: 720px;\n  font-family: var(--sans, system-ui);\n  color: var(--ink, #111);\n}\n.issue-new-head {\n  display: grid;\n  gap: 6px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 14px;\n}\n.issue-new-overline {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #68645c);\n}\n.issue-new h1 {\n  margin: 0;\n  font-family: var(--display, system-ui);\n  font-size: 36px;\n  line-height: 1;\n}\n.issue-new-form {\n  display: grid;\n  gap: 18px;\n}\n.issue-new-field {\n  display: grid;\n  gap: 6px;\n}\n.issue-new-label {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #68645c);\n}\n.issue-new-hint {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-fainter, #918b80);\n}\n.issue-new input,\n.issue-new textarea,\n.issue-new select {\n  width: 100%;\n  border: 1.5px solid var(--rule-light, #d8d1c4);\n  background: var(--paper, #fffdf8);\n  color: var(--ink, #111);\n  padding: 10px 12px;\n  font-family: var(--mono, monospace);\n  font-size: 13px;\n  outline: none;\n  transition: border-color 120ms ease;\n}\n.issue-new input:focus,\n.issue-new textarea:focus,\n.issue-new select:focus {\n  border-color: var(--ink, #111);\n}\n.issue-new textarea {\n  resize: vertical;\n  font-family: var(--mono, monospace);\n}\n.issue-new-policy {\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  flex-wrap: wrap;\n  border: 1px dashed var(--rule-light, #d8d1c4);\n  padding: 8px 12px;\n  background: var(--paper-tint, #f2efe7);\n}\n.issue-new-chip {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  border: 1px solid currentColor;\n  padding: 1px 6px;\n}\n.issue-new-chip.chip-on {\n  color: var(--accent-teal, #087f6f);\n}\n.issue-new-chip.chip-off {\n  color: var(--accent-yellow, #c89300);\n}\n.issue-new-chip-detail {\n  font-family: var(--sans, system-ui);\n  font-size: 12px;\n  color: var(--ink-soft, #2c2b28);\n}\n.issue-new-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding-top: 4px;\n}\n.issue-new-submit {\n  border: 1.5px solid var(--ink, #111);\n  background: var(--ink, #111);\n  color: var(--paper, #fffdf8);\n  padding: 10px 18px;\n  font-family: var(--display, system-ui);\n  font-weight: 600;\n  font-size: 13px;\n  cursor: pointer;\n}\n.issue-new-submit:disabled {\n  background: var(--ink-faint, #68645c);\n  cursor: wait;\n}\n.issue-new-error {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--accent-err, #c9341c);\n}\n";
function np() {
	if (typeof document > "u" || document.getElementById(ep)) return;
	let e = document.createElement("style");
	e.id = ep, e.textContent = tp, document.head.appendChild(e);
}
function rp(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e.split(",")) {
		let e = r.trim();
		e && (t.has(e) || (t.add(e), n.push(e)));
	}
	return n;
}
//#endregion
export { Xf as default };
