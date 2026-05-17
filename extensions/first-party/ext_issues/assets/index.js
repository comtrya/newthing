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
}, l = Object.prototype.hasOwnProperty, u = (e, t) => l.call(e, t), d = Array.isArray, f = (e) => x(e) === "[object Map]", p = (e) => x(e) === "[object Set]", m = (e) => x(e) === "[object Date]", h = (e) => typeof e == "function", g = (e) => typeof e == "string", _ = (e) => typeof e == "symbol", v = (e) => typeof e == "object" && !!e, y = (e) => (v(e) || h(e)) && h(e.then) && h(e.catch), b = Object.prototype.toString, x = (e) => b.call(e), S = (e) => x(e).slice(8, -1), C = (e) => x(e) === "[object Object]", w = (e) => g(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, T = /* @__PURE__ */ e(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"), ee = (e) => {
	let t = /* @__PURE__ */ Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, te = /-\w/g, E = ee((e) => e.replace(te, (e) => e.slice(1).toUpperCase())), ne = /\B([A-Z])/g, D = ee((e) => e.replace(ne, "-$1").toLowerCase()), re = ee((e) => e.charAt(0).toUpperCase() + e.slice(1)), ie = ee((e) => e ? `on${re(e)}` : ""), O = (e, t) => !Object.is(e, t), ae = (e, ...t) => {
	for (let n = 0; n < e.length; n++) e[n](...t);
}, k = (e, t, n, r = !1) => {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		writable: r,
		value: n
	});
}, oe = (e) => {
	let t = parseFloat(e);
	return isNaN(t) ? e : t;
}, se = (e) => {
	let t = g(e) ? Number(e) : NaN;
	return isNaN(t) ? e : t;
}, ce, le = () => ce ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function ue(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = g(r) ? me(r) : ue(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (g(e) || v(e)) return e;
}
var de = /;(?![^(]*\))/g, fe = /:([^]+)/, pe = /\/\*[^]*?\*\//g;
function me(e) {
	let t = {};
	return e.replace(pe, "").split(de).forEach((e) => {
		if (e) {
			let n = e.split(fe);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function A(e) {
	let t = "";
	if (g(e)) t = e;
	else if (d(e)) for (let n = 0; n < e.length; n++) {
		let r = A(e[n]);
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
		(t.version === 0 || O(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
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
		return e === /* @__PURE__ */ F(r) && (o ? O(n, i) && $e(e, "set", t, n, i) : $e(e, "add", t, n)), s;
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
			e || (O(n, a) && P(i, "get", n), P(i, "get", a));
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
			return e || (O(t, i) && P(r, "has", t), P(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
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
			return r.has.call(n, a) || O(e, a) && r.has.call(n, e) || O(i, a) && r.has.call(n, i) || (n.add(a), $e(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ Bt(n) && !/* @__PURE__ */ zt(n) && (n = /* @__PURE__ */ F(n));
			let r = /* @__PURE__ */ F(this), { has: i, get: a } = bt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ F(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? O(n, s) && $e(r, "set", e, n, s) : $e(r, "add", e, n), this;
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
	return !u(e, "__v_skip") && Object.isExtensible(e) && k(e, "__v_skip", !0), e;
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
		e = n ? e : /* @__PURE__ */ F(e), O(e, t) && (this._rawValue = e, this._value = n ? e : Ut(e), this.dep.trigger());
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
			if (o || y || (b ? e.some((e, t) => O(e, C[t])) : O(e, C))) {
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
var z = [], cn = -1, ln = [], un = null, dn = 0, fn = /* @__PURE__ */ Promise.resolve(), pn = null;
function mn(e) {
	let t = pn || fn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function hn(e) {
	let t = cn + 1, n = z.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = z[r], a = xn(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function gn(e) {
	if (!(e.flags & 1)) {
		let t = xn(e), n = z[z.length - 1];
		!n || !(e.flags & 2) && t >= xn(n) ? z.push(e) : z.splice(hn(t), 0, e), e.flags |= 1, _n();
	}
}
function _n() {
	pn ||= fn.then(Sn);
}
function vn(e) {
	d(e) ? ln.push(...e) : un && e.id === -1 ? un.splice(dn + 1, 0, e) : e.flags & 1 || (ln.push(e), e.flags |= 1), _n();
}
function yn(e, t, n = cn + 1) {
	for (; n < z.length; n++) {
		let t = z[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			z.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function bn(e) {
	if (ln.length) {
		let e = [...new Set(ln)].sort((e, t) => xn(e) - xn(t));
		if (ln.length = 0, un) {
			un.push(...e);
			return;
		}
		for (un = e, dn = 0; dn < un.length; dn++) {
			let e = un[dn];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		un = null, dn = 0;
	}
}
var xn = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function Sn(e) {
	try {
		for (cn = 0; cn < z.length; cn++) {
			let e = z[cn];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), rn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; cn < z.length; cn++) {
			let e = z[cn];
			e && (e.flags &= -2);
		}
		cn = -1, z.length = 0, bn(e), pn = null, (z.length || ln.length) && Sn(e);
	}
}
var Cn = null, wn = null;
function Tn(e) {
	let t = Cn;
	return Cn = e, wn = e && e.type.__scopeId || null, t;
}
function En(e, t = Cn, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && ki(-1);
		let i = Tn(t), a;
		try {
			a = e(...n);
		} finally {
			Tn(i), r._d && ki(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function Dn(e, n) {
	if (Cn === null) return e;
	let r = la(Cn), i = e.dirs ||= [];
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
function On(e, t, n, r) {
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
function kn(e, t) {
	if (Z) {
		let n = Z.provides, r = Z.parent && Z.parent.provides;
		r === n && (n = Z.provides = Object.create(r)), n[e] = t;
	}
}
function An(e, t, n = !1) {
	let r = Ji();
	if (r || Nr) {
		let i = Nr ? Nr._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t;
	}
}
var jn = /* @__PURE__ */ Symbol.for("v-scx"), Mn = () => An(jn);
function B(e, t, n) {
	return Nn(e, t, n);
}
function Nn(e, n, i = t) {
	let { immediate: a, deep: o, flush: c, once: l } = i, u = s({}, i), d = n && a || !n && c !== "post", f;
	if (ea) {
		if (c === "sync") {
			let e = Mn();
			f = e.__watcherHandles ||= [];
		} else if (!d) {
			let e = () => {};
			return e.stop = r, e.resume = r, e.pause = r, e;
		}
	}
	let p = Z;
	u.call = (e, t, n) => an(e, p, t, n);
	let m = !1;
	c === "post" ? u.scheduler = (e) => {
		U(e, p && p.suspense);
	} : c !== "sync" && (m = !0, u.scheduler = (e, t) => {
		t ? e() : gn(e);
	}), u.augmentJob = (e) => {
		n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p));
	};
	let h = tn(e, n, u);
	return ea && (f ? f.push(h) : d && h()), h;
}
function Pn(e, t, n) {
	let r = this.proxy, i = g(e) ? e.includes(".") ? Fn(r, e) : () => r[e] : e.bind(r, r), a;
	h(t) ? a = t : (a = t.handler, n = t);
	let o = Zi(this), s = Nn(i, a.bind(r), n);
	return o(), s;
}
function Fn(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var In = /* @__PURE__ */ Symbol("_vte"), Ln = (e) => e.__isTeleport, Rn = /* @__PURE__ */ Symbol("_leaveCb");
function zn(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, zn(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function Bn(e, t) {
	return h(e) ? s({ name: e.name }, t, { setup: e }) : e;
}
function Vn(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function Hn(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var Un = /* @__PURE__ */ new WeakMap();
function Wn(e, n, r, a, o = !1) {
	if (d(e)) {
		e.forEach((e, t) => Wn(e, n && (d(n) ? n[t] : n), r, a, o));
		return;
	}
	if (Kn(a) && !o) {
		a.shapeFlag & 512 && a.type.__asyncResolved && a.component.subTree.component && Wn(e, n, r, a.component.subTree);
		return;
	}
	let s = a.shapeFlag & 4 ? la(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ F(v), b = v === t ? i : (e) => Hn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Hn(_, t));
	if (m != null && m !== p) {
		if (Gn(n), g(m)) _[m] = null, b(m) && (v[m] = null);
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
					i(), Un.delete(e);
				};
				t.id = -1, Un.set(e, t), U(t, r);
			} else Gn(e), i();
		}
	}
}
function Gn(e) {
	let t = Un.get(e);
	t && (t.flags |= 8, Un.delete(e));
}
le().requestIdleCallback, le().cancelIdleCallback;
var Kn = (e) => !!e.type.__asyncLoader, qn = (e) => e.type.__isKeepAlive;
function Jn(e, t) {
	Xn(e, "a", t);
}
function Yn(e, t) {
	Xn(e, "da", t);
}
function Xn(e, t, n = Z) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (Qn(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) qn(e.parent.vnode) && Zn(r, t, n, e), e = e.parent;
	}
}
function Zn(e, t, n, r) {
	let i = Qn(t, e, r, !0);
	ar(() => {
		c(r[t], i);
	}, n);
}
function Qn(e, t, n = Z, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			He();
			let i = Zi(n), a = an(t, n, e, r);
			return i(), Ue(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var $n = (e) => (t, n = Z) => {
	(!ea || e === "sp") && Qn(e, (...e) => t(...e), n);
}, er = $n("bm"), tr = $n("m"), nr = $n("bu"), rr = $n("u"), ir = $n("bum"), ar = $n("um"), or = $n("sp"), sr = $n("rtg"), cr = $n("rtc");
function lr(e, t = Z) {
	Qn("ec", e, t);
}
var ur = /* @__PURE__ */ Symbol.for("v-ndc");
function V(e, t, n, r) {
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
var dr = (e) => e ? $i(e) ? la(e) : dr(e.parent) : null, fr = /* @__PURE__ */ s(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => dr(e.parent),
	$root: (e) => dr(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => xr(e),
	$forceUpdate: (e) => e.f ||= () => {
		gn(e.update);
	},
	$nextTick: (e) => e.n ||= mn.bind(e.proxy),
	$watch: (e) => Pn.bind(e)
}), pr = (e, n) => e !== t && !e.__isScriptSetup && u(e, n), mr = {
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
			else if (pr(i, n)) return s[n] = 1, i[n];
			else if (a !== t && u(a, n)) return s[n] = 2, a[n];
			else if (u(o, n)) return s[n] = 3, o[n];
			else if (r !== t && u(r, n)) return s[n] = 4, r[n];
			else gr && (s[n] = 0);
		}
		let d = fr[n], f, p;
		if (d) return n === "$attrs" && P(e.attrs, "get", ""), d(e);
		if ((f = c.__cssModules) && (f = f[n])) return f;
		if (r !== t && u(r, n)) return s[n] = 4, r[n];
		if (p = l.config.globalProperties, u(p, n)) return p[n];
	},
	set({ _: e }, n, r) {
		let { data: i, setupState: a, ctx: o } = e;
		return pr(a, n) ? (a[n] = r, !0) : i !== t && u(i, n) ? (i[n] = r, !0) : u(e.props, n) || n[0] === "$" && n.slice(1) in e ? !1 : (o[n] = r, !0);
	},
	has({ _: { data: e, setupState: n, accessCache: r, ctx: i, appContext: a, props: o, type: s } }, c) {
		let l;
		return !!(r[c] || e !== t && c[0] !== "$" && u(e, c) || pr(n, c) || u(o, c) || u(i, c) || u(fr, c) || u(a.config.globalProperties, c) || (l = s.__cssModules) && l[c]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? u(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function hr(e) {
	return d(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var gr = !0;
function _r(e) {
	let t = xr(e), n = e.proxy, i = e.ctx;
	gr = !1, t.beforeCreate && yr(t.beforeCreate, e, "bc");
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: T, renderTracked: ee, renderTriggered: te, errorCaptured: E, serverPrefetch: ne, expose: D, inheritAttrs: re, components: ie, directives: O, filters: ae } = t;
	if (u && vr(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Pt(t));
	}
	if (gr = !0, o) for (let e in o) {
		let t = o[e], a = Q({
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
	if (c) for (let e in c) br(c[e], i, n, e);
	if (l) {
		let e = h(l) ? l.call(n) : l;
		Reflect.ownKeys(e).forEach((t) => {
			kn(t, e[t]);
		});
	}
	f && yr(f, e, "c");
	function k(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (k(er, p), k(tr, m), k(nr, g), k(rr, _), k(Jn, y), k(Yn, b), k(lr, E), k(cr, ee), k(sr, te), k(ir, S), k(ar, w), k(or, ne), d(D)) if (D.length) {
		let t = e.exposed ||= {};
		D.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	T && e.render === r && (e.render = T), re != null && (e.inheritAttrs = re), ie && (e.components = ie), O && (e.directives = O), ne && Vn(e);
}
function vr(e, t, n = r) {
	d(e) && (e = Er(e));
	for (let n in e) {
		let r = e[n], i;
		i = v(r) ? "default" in r ? An(r.from || n, r.default, !0) : An(r.from || n) : An(r), /* @__PURE__ */ I(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function yr(e, t, n) {
	an(d(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function br(e, t, n, r) {
	let i = r.includes(".") ? Fn(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && B(i, n);
	} else if (h(e)) B(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => br(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && B(i, r, e);
	}
}
function xr(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => Sr(c, e, o, !0)), Sr(c, t, o)), v(t) && a.set(t, c), c;
}
function Sr(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && Sr(e, a, n, !0), i && i.forEach((t) => Sr(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = Cr[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var Cr = {
	data: wr,
	props: Or,
	emits: Or,
	methods: Dr,
	computed: Dr,
	beforeCreate: H,
	created: H,
	beforeMount: H,
	mounted: H,
	beforeUpdate: H,
	updated: H,
	beforeDestroy: H,
	beforeUnmount: H,
	destroyed: H,
	unmounted: H,
	activated: H,
	deactivated: H,
	errorCaptured: H,
	serverPrefetch: H,
	components: Dr,
	directives: Dr,
	watch: kr,
	provide: wr,
	inject: Tr
};
function wr(e, t) {
	return t ? e ? function() {
		return s(h(e) ? e.call(this, this) : e, h(t) ? t.call(this, this) : t);
	} : t : e;
}
function Tr(e, t) {
	return Dr(Er(e), Er(t));
}
function Er(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function H(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function Dr(e, t) {
	return e ? s(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Or(e, t) {
	return e ? d(e) && d(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : s(/* @__PURE__ */ Object.create(null), hr(e), hr(t ?? {})) : t;
}
function kr(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = s(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = H(e[r], t[r]);
	return n;
}
function Ar() {
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
var jr = 0;
function Mr(e, t) {
	return function(n, r = null) {
		h(n) || (n = s({}, n)), r != null && !v(r) && (r = null);
		let i = Ar(), a = /* @__PURE__ */ new WeakSet(), o = [], c = !1, l = i.app = {
			_uid: jr++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: da,
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
					let u = l._ceVNode || J(n, r);
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, la(u.component);
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
				let t = Nr;
				Nr = l;
				try {
					return e();
				} finally {
					Nr = t;
				}
			}
		};
		return l;
	};
}
var Nr = null, Pr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${E(t)}Modifiers`] || e[`${D(t)}Modifiers`];
function Fr(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && Pr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(oe)));
	let c, l = i[c = ie(n)] || i[c = ie(E(n))];
	!l && o && (l = i[c = ie(D(n))]), l && an(l, e, 6, a);
	let u = i[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, an(u, e, 6, a);
	}
}
var Ir = /* @__PURE__ */ new WeakMap();
function Lr(e, t, n = !1) {
	let r = n ? Ir : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, c = !1;
	if (!h(e)) {
		let r = (e) => {
			let n = Lr(e, t, !0);
			n && (c = !0, s(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !c ? (v(e) && r.set(e, null), null) : (d(a) ? a.forEach((e) => o[e] = null) : s(o, a), v(e) && r.set(e, o), o);
}
function Rr(e, t) {
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, D(t)) || u(e, t));
}
function zr(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: s, attrs: c, emit: l, render: u, renderCache: d, props: f, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = Tn(e), v, y;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			v = Bi(u.call(t, e, d, f, m, p, h)), y = c;
		} else {
			let e = t;
			v = Bi(e.length > 1 ? e(f, {
				attrs: c,
				slots: s,
				emit: l
			}) : e(f, null)), y = t.props ? c : Br(c);
		}
	} catch (t) {
		Ti.length = 0, on(t, e, 1), v = J(Ci);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = Vr(y, a)), b = Ri(b, y, !1, !0));
	}
	return n.dirs && (b = Ri(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && zn(b, n.transition), v = b, Tn(_), v;
}
var Br = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || a(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, Vr = (e, t) => {
	let n = {};
	for (let r in e) (!o(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function Hr(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? Ur(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (Wr(o, r, n) && !Rr(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? Ur(r, o, l) : !0 : !!o;
	return !1;
}
function Ur(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (Wr(t, e, a) && !Rr(n, a)) return !0;
	}
	return !1;
}
function Wr(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && v(r) && v(i) ? !ye(r, i) : r !== i;
}
function Gr({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var Kr = {}, qr = () => Object.create(Kr), Jr = (e) => Object.getPrototypeOf(e) === Kr;
function Yr(e, t, n, r = !1) {
	let i = {}, a = qr();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), Zr(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ Ft(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Xr(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ F(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (Rr(e.emitsOptions, o)) continue;
				let d = t[o];
				if (c) if (u(a, o)) d !== a[o] && (a[o] = d, l = !0);
				else {
					let t = E(o);
					i[t] = Qr(c, s, t, d, e, !1);
				}
				else d !== a[o] && (a[o] = d, l = !0);
			}
		}
	} else {
		Zr(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !u(t, a) && ((r = D(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Qr(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !u(t, e)) && (delete a[e], l = !0);
	}
	l && $e(e.attrs, "set", "");
}
function Zr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (T(t)) continue;
		let l = n[t], d;
		a && u(a, d = E(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : Rr(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ F(r), i = c || t;
		for (let t = 0; t < o.length; t++) {
			let s = o[t];
			r[s] = Qr(a, n, s, i[s], e, !u(i, s));
		}
	}
	return s;
}
function Qr(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = u(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && h(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = Zi(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === D(n)) && (r = !0));
	}
	return r;
}
var $r = /* @__PURE__ */ new WeakMap();
function ei(e, r, i = !1) {
	let a = i ? $r : r.propsCache, o = a.get(e);
	if (o) return o;
	let c = e.props, l = {}, f = [], p = !1;
	if (!h(e)) {
		let t = (e) => {
			p = !0;
			let [t, n] = ei(e, r, !0);
			s(l, t), n && f.push(...n);
		};
		!i && r.mixins.length && r.mixins.forEach(t), e.extends && t(e.extends), e.mixins && e.mixins.forEach(t);
	}
	if (!c && !p) return v(e) && a.set(e, n), n;
	if (d(c)) for (let e = 0; e < c.length; e++) {
		let n = E(c[e]);
		ti(n) && (l[n] = t);
	}
	else if (c) for (let e in c) {
		let t = E(e);
		if (ti(t)) {
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
function ti(e) {
	return e[0] !== "$" && !T(e);
}
var ni = (e) => e === "_" || e === "_ctx" || e === "$stable", ri = (e) => d(e) ? e.map(Bi) : [Bi(e)], ii = (e, t, n) => {
	if (t._n) return t;
	let r = En((...e) => ri(t(...e)), n);
	return r._c = !1, r;
}, ai = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (ni(n)) continue;
		let i = e[n];
		if (h(i)) t[n] = ii(n, i, r);
		else if (i != null) {
			let e = ri(i);
			t[n] = () => e;
		}
	}
}, oi = (e, t) => {
	let n = ri(t);
	e.slots.default = () => n;
}, si = (e, t, n) => {
	for (let r in t) (n || !ni(r)) && (e[r] = t[r]);
}, ci = (e, t, n) => {
	let r = e.slots = qr();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (si(r, t, n), n && k(r, "_", e, !0)) : ai(t, r);
	} else t && oi(e, t);
}, li = (e, n, r) => {
	let { vnode: i, slots: a } = e, o = !0, s = t;
	if (i.shapeFlag & 32) {
		let e = n._;
		e ? r && e === 1 ? o = !1 : si(a, n, r) : (o = !n.$stable, ai(n, a)), s = n;
	} else n && (oi(e, n), s = { default: 1 });
	if (o) for (let e in a) !ni(e) && s[e] == null && delete a[e];
}, U = xi;
function ui(e) {
	return di(e);
}
function di(e, i) {
	let a = le();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Ni(e, t) && (r = ve(e), me(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case Si:
				y(e, t, n, r);
				break;
			case Ci:
				b(e, t, n, r);
				break;
			case wi:
				e ?? x(t, n, r, o);
				break;
			case W:
				ie(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? O(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, xe);
		}
		u != null && i ? Wn(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && Wn(e.ref, null, a, e, !0);
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
		if (t.type === "svg" ? o = "svg" : t.type === "math" && (o = "mathml"), e == null) ee(t, n, r, i, a, o, s, c);
		else {
			let n = e.el && e.el._isVueCE ? e.el : null;
			try {
				n && n._beginPatch(), ne(e, t, i, a, o, s, c);
			} finally {
				n && n._endPatch();
			}
		}
	}, ee = (e, t, n, r, i, a, s, u) => {
		let d, f, { props: m, shapeFlag: h, transition: g, dirs: _ } = e;
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && E(e.children, d, null, r, i, fi(e, a), s, u), _ && On(e, null, r, "created"), te(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !T(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Wi(f, r, e);
		}
		_ && On(e, null, r, "beforeMount");
		let v = mi(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && U(() => {
			try {
				f && Wi(f, r, e), v && g.enter(d), _ && On(e, null, r, "mounted");
			} finally {}
		}, i);
	}, te = (e, t, n, r, i) => {
		if (n && g(e, n), r) for (let t = 0; t < r.length; t++) g(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || bi(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				te(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, E = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? Vi(e[l]) : Bi(e[l]), t, n, r, i, a, o, s);
	}, ne = (e, n, r, i, a, o, s) => {
		let l = n.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = n;
		u |= e.patchFlag & 16;
		let m = e.props || t, h = n.props || t, g;
		if (r && pi(r, !1), (g = h.onVnodeBeforeUpdate) && Wi(g, r, n, e), f && On(n, e, r, "beforeUpdate"), r && pi(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? D(e.dynamicChildren, d, l, r, i, fi(n, a), o) : s || ue(e, n, l, null, r, i, fi(n, a), o, !1), u > 0) {
			if (u & 16) re(l, m, h, r, a);
			else if (u & 2 && m.class !== h.class && c(l, "class", null, h.class, a), u & 4 && c(l, "style", m.style, h.style, a), u & 8) {
				let e = n.dynamicProps;
				for (let t = 0; t < e.length; t++) {
					let n = e[t], i = m[n], o = h[n];
					(o !== i || n === "value") && c(l, n, i, o, a, r);
				}
			}
			u & 1 && e.children !== n.children && p(l, n.children);
		} else !s && d == null && re(l, m, h, r, a);
		((g = h.onVnodeUpdated) || f) && U(() => {
			g && Wi(g, r, n, e), f && On(n, e, r, "updated");
		}, i);
	}, D = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === W || !Ni(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
		}
	}, re = (e, n, r, i, a) => {
		if (n !== r) {
			if (n !== t) for (let t in n) !T(t) && !(t in r) && c(e, t, n[t], null, a, i);
			for (let t in r) {
				if (T(t)) continue;
				let o = r[t], s = n[t];
				o !== s && t !== "value" && c(e, t, s, o, a, i);
			}
			"value" in r && c(e, "value", n.value, r.value, a);
		}
	}, ie = (e, t, n, r, i, a, s, c, l) => {
		let d = t.el = e ? e.el : u(""), f = t.anchor = e ? e.anchor : u(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), E(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (D(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && hi(e, t, !0)) : ue(e, t, n, f, i, a, s, c, l);
	}, O = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : k(t, n, r, i, a, o, c) : oe(e, t, c);
	}, k = (e, t, n, r, i, a, o) => {
		let s = e.component = qi(e, r, i);
		if (qn(e) && (s.ctx.renderer = xe), ta(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, se, o), !e.el) {
				let r = s.subTree = J(Ci);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else se(s, e, t, n, i, a, o);
	}, oe = (e, t, n) => {
		let r = t.component = e.component;
		if (Hr(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			ce(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, se = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = _i(e);
					if (n) {
						t && (t.el = c.el, ce(e, t, o)), n.asyncDep.then(() => {
							U(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				pi(e, !1), t ? (t.el = c.el, ce(e, t, o)) : t = c, n && ae(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Wi(d, s, t, c), pi(e, !0);
				let f = zr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ve(p), e, i, a), t.el = f.el, u === null && Gr(e, f.el), r && U(r, i), (d = t.props && t.props.onVnodeUpdated) && U(() => Wi(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Kn(t);
				if (pi(e, !1), l && ae(l), !m && (o = c && c.onVnodeBeforeMount) && Wi(o, d, t), pi(e, !0), s && Se) {
					let t = () => {
						e.subTree = zr(e), Se(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = zr(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && U(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					U(() => Wi(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Kn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && U(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new De(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => gn(u), pi(e, !0), l();
	}, ce = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Xr(e, t.props, r, n), li(e, t.children, n), He(), yn(e), Ue();
	}, ue = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, u = e ? e.shapeFlag : 0, d = t.children, { patchFlag: f, shapeFlag: m } = t;
		if (f > 0) {
			if (f & 128) {
				fe(l, d, n, r, i, a, o, s, c);
				return;
			} else if (f & 256) {
				de(l, d, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (u & 16 && _e(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? fe(l, d, n, r, i, a, o, s, c) : _e(l, i, a, !0) : (u & 8 && p(n, ""), m & 16 && E(d, n, r, i, a, o, s, c));
	}, de = (e, t, r, i, a, o, s, c, l) => {
		e ||= n, t ||= n;
		let u = e.length, d = t.length, f = Math.min(u, d), p;
		for (p = 0; p < f; p++) {
			let n = t[p] = l ? Vi(t[p]) : Bi(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? _e(e, a, o, !0, !1, f) : E(t, r, i, a, o, s, c, l, f);
	}, fe = (e, t, r, i, a, o, s, c, l) => {
		let u = 0, d = t.length, f = e.length - 1, p = d - 1;
		for (; u <= f && u <= p;) {
			let n = e[u], i = t[u] = l ? Vi(t[u]) : Bi(t[u]);
			if (Ni(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			u++;
		}
		for (; u <= f && u <= p;) {
			let n = e[f], i = t[p] = l ? Vi(t[p]) : Bi(t[p]);
			if (Ni(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			f--, p--;
		}
		if (u > f) {
			if (u <= p) {
				let e = p + 1, n = e < d ? t[e].el : i;
				for (; u <= p;) v(null, t[u] = l ? Vi(t[u]) : Bi(t[u]), r, n, a, o, s, c, l), u++;
			}
		} else if (u > p) for (; u <= f;) me(e[u], a, o, !0), u++;
		else {
			let m = u, h = u, g = /* @__PURE__ */ new Map();
			for (u = h; u <= p; u++) {
				let e = t[u] = l ? Vi(t[u]) : Bi(t[u]);
				e.key != null && g.set(e.key, u);
			}
			let _, y = 0, b = p - h + 1, x = !1, S = 0, C = Array(b);
			for (u = 0; u < b; u++) C[u] = 0;
			for (u = m; u <= f; u++) {
				let n = e[u];
				if (y >= b) {
					me(n, a, o, !0);
					continue;
				}
				let i;
				if (n.key != null) i = g.get(n.key);
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && Ni(n, t[_])) {
					i = _;
					break;
				}
				i === void 0 ? me(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++);
			}
			let w = x ? gi(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || yi(f) : i;
				C[u] === 0 ? v(null, n, r, p, a, o, s, c, l) : x && (_ < 0 || u !== w[_] ? pe(n, r, p, 2) : _--);
			}
		}
	}, pe = (e, t, n, r, i = null) => {
		let { el: a, type: c, transition: l, children: u, shapeFlag: d } = e;
		if (d & 6) {
			pe(e.component.subTree, t, n, r);
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
		if (c === W) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) pe(u[e], t, n, r);
			o(e.anchor, t, n);
			return;
		}
		if (c === wi) {
			S(e, t, n);
			return;
		}
		if (r !== 2 && d & 1 && l) if (r === 0) l.beforeEnter(a), o(a, t, n), U(() => l.enter(a), i);
		else {
			let { leave: r, delayLeave: i, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? s(a) : o(a, t, n);
			}, d = () => {
				a._isLeaving && a[Rn](!0), r(a, () => {
					u(), c && c();
				});
			};
			i ? i(a, u, d) : d();
		}
		else o(a, t, n);
	}, me = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (He(), Wn(s, null, n, e, !0), Ue()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Kn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Wi(_, t, e), u & 6) ge(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && On(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, xe, r) : l && !l.hasOnce && (a !== W || d > 0 && d & 64) ? _e(l, t, n, !1, !0) : (a === W && d & 384 || !i && u & 16) && _e(c, t, n), r && A(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && U(() => {
			_ && Wi(_, t, e), h && On(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, A = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === W) {
			he(n, r);
			return;
		}
		if (t === wi) {
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
		vi(c), vi(l), r && ae(r), i.stop(), a && (a.flags |= 8, me(o, e, t, n)), s && U(s, t), U(() => {
			e.isUnmounted = !0;
		}, t);
	}, _e = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) me(e[o], t, n, r, i);
	}, ve = (e) => {
		if (e.shapeFlag & 6) return ve(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[In];
		return n ? h(n) : t;
	}, ye = !1, be = (e, t, n) => {
		let r;
		e == null ? t._vnode && (me(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, ye ||= (ye = !0, yn(r), bn(), !1);
	}, xe = {
		p: v,
		um: me,
		m: pe,
		r: A,
		mt: k,
		mc: E,
		pc: ue,
		pbc: D,
		n: ve,
		o: e
	}, j, Se;
	return i && ([j, Se] = i(xe)), {
		render: be,
		hydrate: j,
		createApp: Mr(be, j)
	};
}
function fi({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function pi({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function mi(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function hi(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (d(r) && d(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Vi(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && hi(t, a)), a.type === Si && (a.patchFlag === -1 && (a = i[e] = Vi(a)), a.el = t.el), a.type === Ci && !a.el && (a.el = t.el);
	}
}
function gi(e) {
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
function _i(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : _i(t);
}
function vi(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function yi(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? yi(t.subTree) : null;
}
var bi = (e) => e.__isSuspense;
function xi(e, t) {
	t && t.pendingBranch ? d(e) ? t.effects.push(...e) : t.effects.push(e) : vn(e);
}
var W = /* @__PURE__ */ Symbol.for("v-fgt"), Si = /* @__PURE__ */ Symbol.for("v-txt"), Ci = /* @__PURE__ */ Symbol.for("v-cmt"), wi = /* @__PURE__ */ Symbol.for("v-stc"), Ti = [], Ei = null;
function G(e = !1) {
	Ti.push(Ei = e ? null : []);
}
function Di() {
	Ti.pop(), Ei = Ti[Ti.length - 1] || null;
}
var Oi = 1;
function ki(e, t = !1) {
	Oi += e, e < 0 && Ei && t && (Ei.hasOnce = !0);
}
function Ai(e) {
	return e.dynamicChildren = Oi > 0 ? Ei || n : null, Di(), Oi > 0 && Ei && Ei.push(e), e;
}
function K(e, t, n, r, i, a) {
	return Ai(q(e, t, n, r, i, a, !0));
}
function ji(e, t, n, r, i) {
	return Ai(J(e, t, n, r, i, !0));
}
function Mi(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function Ni(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Pi = ({ key: e }) => e ?? null, Fi = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ I(e) || h(e) ? {
	i: Cn,
	r: e,
	k: t,
	f: !!n
} : e);
function q(e, t = null, n = null, r = 0, i = null, a = e === W ? 0 : 1, o = !1, s = !1) {
	let c = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e,
		props: t,
		key: t && Pi(t),
		ref: t && Fi(t),
		scopeId: wn,
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
		ctx: Cn
	};
	return s ? (Hi(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Oi > 0 && !o && Ei && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && Ei.push(c), c;
}
var J = Ii;
function Ii(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === ur) && (e = Ci), Mi(e)) {
		let r = Ri(e, t, !0);
		return n && Hi(r, n), Oi > 0 && !a && Ei && (r.shapeFlag & 6 ? Ei[Ei.indexOf(e)] = r : Ei.push(r)), r.patchFlag = -2, r;
	}
	if (ua(e) && (e = e.__vccOpts), t) {
		t = Li(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = A(e)), v(n) && (/* @__PURE__ */ Vt(n) && !d(n) && (n = s({}, n)), t.style = ue(n));
	}
	let o = g(e) ? 1 : bi(e) ? 128 : Ln(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return q(e, t, n, r, i, o, a, !0);
}
function Li(e) {
	return e ? /* @__PURE__ */ Vt(e) || Jr(e) ? s({}, e) : e : null;
}
function Ri(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? Ui(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && Pi(l),
		ref: t && t.ref ? n && a ? d(a) ? a.concat(Fi(t)) : [a, Fi(t)] : Fi(t) : a,
		scopeId: e.scopeId,
		slotScopeIds: e.slotScopeIds,
		children: s,
		target: e.target,
		targetStart: e.targetStart,
		targetAnchor: e.targetAnchor,
		staticCount: e.staticCount,
		shapeFlag: e.shapeFlag,
		patchFlag: t && e.type !== W ? o === -1 ? 16 : o | 16 : o,
		dynamicProps: e.dynamicProps,
		dynamicChildren: e.dynamicChildren,
		appContext: e.appContext,
		dirs: e.dirs,
		transition: c,
		component: e.component,
		suspense: e.suspense,
		ssContent: e.ssContent && Ri(e.ssContent),
		ssFallback: e.ssFallback && Ri(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && zn(u, c.clone(u)), u;
}
function Y(e = " ", t = 0) {
	return J(Si, null, e, t);
}
function zi(e, t) {
	let n = J(wi, null, e);
	return n.staticCount = t, n;
}
function X(e = "", t = !1) {
	return t ? (G(), ji(Ci, null, e)) : J(Ci, null, e);
}
function Bi(e) {
	return e == null || typeof e == "boolean" ? J(Ci) : d(e) ? J(W, null, e.slice()) : Mi(e) ? Vi(e) : J(Si, null, String(e));
}
function Vi(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : Ri(e);
}
function Hi(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (d(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), Hi(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Jr(t) ? t._ctx = Cn : r === 3 && Cn && (Cn.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: Cn
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Y(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Ui(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = A([t.class, r.class]));
		else if (e === "style") t.style = ue([t.style, r.style]);
		else if (a(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(d(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !o(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Wi(e, t, n, r = null) {
	an(e, t, 7, [n, r]);
}
var Gi = Ar(), Ki = 0;
function qi(e, n, r) {
	let i = e.type, a = (n ? n.appContext : e.appContext) || Gi, o = {
		uid: Ki++,
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
		propsOptions: ei(i, a),
		emitsOptions: Lr(i, a),
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
	return o.ctx = { _: o }, o.root = n ? n.root : o, o.emit = Fr.bind(null, o), e.ce && e.ce(o), o;
}
var Z = null, Ji = () => Z || Cn, Yi, Xi;
{
	let e = le(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Yi = t("__VUE_INSTANCE_SETTERS__", (e) => Z = e), Xi = t("__VUE_SSR_SETTERS__", (e) => ea = e);
}
var Zi = (e) => {
	let t = Z;
	return Yi(e), e.scope.on(), () => {
		e.scope.off(), Yi(t);
	};
}, Qi = () => {
	Z && Z.scope.off(), Yi(null);
};
function $i(e) {
	return e.vnode.shapeFlag & 4;
}
var ea = !1;
function ta(e, t = !1, n = !1) {
	t && Xi(t);
	let { props: r, children: i } = e.vnode, a = $i(e);
	Yr(e, r, a, t), ci(e, i, n || t);
	let o = a ? na(e, t) : void 0;
	return t && Xi(!1), o;
}
function na(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, mr);
	let { setup: r } = n;
	if (r) {
		He();
		let n = e.setupContext = r.length > 1 ? ca(e) : null, i = Zi(e), a = rn(r, e, 0, [e.props, n]), o = y(a);
		if (Ue(), i(), (o || e.sp) && !Kn(e) && Vn(e), o) {
			if (a.then(Qi, Qi), t) return a.then((n) => {
				ra(e, n, t);
			}).catch((t) => {
				on(t, e, 0);
			});
			e.asyncDep = a;
		} else ra(e, a, t);
	} else oa(e, t);
}
function ra(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = Jt(t)), oa(e, n);
}
var ia, aa;
function oa(e, t, n) {
	let i = e.type;
	if (!e.render) {
		if (!t && ia && !i.render) {
			let t = i.template || xr(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: r } = e.appContext.config, { delimiters: a, compilerOptions: o } = i;
				i.render = ia(t, s(s({
					isCustomElement: n,
					delimiters: a
				}, r), o));
			}
		}
		e.render = i.render || r, aa && aa(e);
	}
	{
		let t = Zi(e);
		He();
		try {
			_r(e);
		} finally {
			Ue(), t();
		}
	}
}
var sa = { get(e, t) {
	return P(e, "get", ""), e[t];
} };
function ca(e) {
	return {
		attrs: new Proxy(e.attrs, sa),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function la(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(Jt(Ht(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in fr) return fr[n](e);
		},
		has(e, t) {
			return t in e || t in fr;
		}
	}) : e.proxy;
}
function ua(e) {
	return h(e) && "__vccOpts" in e;
}
var Q = (e, t) => /* @__PURE__ */ Xt(e, t, ea), da = "3.5.34", fa = void 0, pa = typeof window < "u" && window.trustedTypes;
if (pa) try {
	fa = /* @__PURE__ */ pa.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var ma = fa ? (e) => fa.createHTML(e) : (e) => e, ha = "http://www.w3.org/2000/svg", ga = "http://www.w3.org/1998/Math/MathML", _a = typeof document < "u" ? document : null, va = _a && /* @__PURE__ */ _a.createElement("template"), ya = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? _a.createElementNS(ha, e) : t === "mathml" ? _a.createElementNS(ga, e) : n ? _a.createElement(e, { is: n }) : _a.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => _a.createTextNode(e),
	createComment: (e) => _a.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => _a.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			va.innerHTML = ma(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = va.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, ba = /* @__PURE__ */ Symbol("_vtc");
function xa(e, t, n) {
	let r = e[ba];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var Sa = /* @__PURE__ */ Symbol("_vod"), Ca = /* @__PURE__ */ Symbol("_vsh"), wa = /* @__PURE__ */ Symbol(""), Ta = /(?:^|;)\s*display\s*:/;
function Ea(e, t, n) {
	let r = e.style, i = g(n), a = !1;
	if (n && !i) {
		if (t) if (g(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? Oa(r, t, "");
		}
		else for (let e in t) n[e] ?? Oa(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? Oa(r, i, "") : Ma(e, i, !g(t) && t ? t[i] : void 0, o) || Oa(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[wa];
			e && (n += ";" + e), r.cssText = n, a = Ta.test(n);
		}
	} else t && e.removeAttribute("style");
	Sa in e && (e[Sa] = a ? r.display : "", e[Ca] && (r.display = "none"));
}
var Da = /\s*!important$/;
function Oa(e, t, n) {
	if (d(n)) n.forEach((n) => Oa(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = ja(e, t);
		Da.test(n) ? e.setProperty(D(r), n.replace(Da, ""), "important") : e[r] = n;
	}
}
var ka = [
	"Webkit",
	"Moz",
	"ms"
], Aa = {};
function ja(e, t) {
	let n = Aa[t];
	if (n) return n;
	let r = E(t);
	if (r !== "filter" && r in e) return Aa[t] = r;
	r = re(r);
	for (let n = 0; n < ka.length; n++) {
		let i = ka[n] + r;
		if (i in e) return Aa[t] = i;
	}
	return t;
}
function Ma(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && g(r) && n === r;
}
var Na = "http://www.w3.org/1999/xlink";
function Pa(e, t, n, r, i, a = ge(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Na, t.slice(6, t.length)) : e.setAttributeNS(Na, t, n) : n == null || a && !_e(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
}
function Fa(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? ma(n) : n);
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
function Ia(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function La(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var Ra = /* @__PURE__ */ Symbol("_vei");
function za(e, t, n, r, i = null) {
	let a = e[Ra] || (e[Ra] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = Va(t);
		r ? Ia(e, n, a[t] = Ga(r, i), s) : o && (La(e, n, o, s), a[t] = void 0);
	}
}
var Ba = /(?:Once|Passive|Capture)$/;
function Va(e) {
	let t;
	if (Ba.test(e)) {
		t = {};
		let n;
		for (; n = e.match(Ba);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : D(e.slice(2)), t];
}
var Ha = 0, Ua = /* @__PURE__ */ Promise.resolve(), Wa = () => Ha ||= (Ua.then(() => Ha = 0), Date.now());
function Ga(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		an(Ka(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Wa(), n;
}
function Ka(e, t) {
	if (d(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var qa = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Ja = (e, t, n, r, i, s) => {
	let c = i === "svg";
	t === "class" ? xa(e, r, c) : t === "style" ? Ea(e, n, r) : a(t) ? o(t) || za(e, t, n, r, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ya(e, t, r, c)) ? (Fa(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Pa(e, t, r, c, s, t !== "value")) : e._isVueCE && (Xa(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r))) ? Fa(e, E(t), r, s, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Pa(e, t, r, c));
};
function Ya(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && qa(t) && h(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return qa(t) && g(n) ? !1 : t in e;
}
function Xa(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = E(t);
	return Array.isArray(n) ? n.some((e) => E(e) === r) : Object.keys(n).some((e) => E(e) === r);
}
var Za = {};
/* @__NO_SIDE_EFFECTS__ */
function Qa(e, t, n) {
	let r = /* @__PURE__ */ Bn(e, t);
	C(r) && (r = s({}, r, t));
	class i extends eo {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var $a = typeof HTMLElement < "u" ? HTMLElement : class {}, eo = class e extends $a {
	constructor(e, t = {}, n = bo) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== bo ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, mn(() => {
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
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = se(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[E(e)] = !0);
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : Za, r = E(e);
		t && this._numberProps && this._numberProps[r] && (n = se(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === Za ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(D(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(D(e), t + "") : t || this.removeAttribute(D(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), yo(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = J(this._def, s(e, this._props));
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
}, to = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return d(t) ? (e) => ae(t, e) : t;
};
function no(e) {
	e.target.composing = !0;
}
function ro(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var io = /* @__PURE__ */ Symbol("_assign");
function ao(e, t, n) {
	return t && (e = e.trim()), n && (e = oe(e)), e;
}
var oo = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e[io] = to(i);
		let a = r || i.props && i.props.type === "number";
		Ia(e, t ? "change" : "input", (t) => {
			t.target.composing || e[io](ao(e.value, n, a));
		}), (n || a) && Ia(e, "change", () => {
			e.value = ao(e.value, n, a);
		}), t || (Ia(e, "compositionstart", no), Ia(e, "compositionend", ro), Ia(e, "change", ro));
	},
	mounted(e, { value: t }) {
		e.value = t ?? "";
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[io] = to(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? oe(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, so = {
	deep: !0,
	created(e, { value: t, modifiers: { number: n } }, r) {
		let i = p(t);
		Ia(e, "change", () => {
			let t = Array.prototype.filter.call(e.options, (e) => e.selected).map((e) => n ? oe(lo(e)) : lo(e));
			e[io](e.multiple ? i ? new Set(t) : t : t[0]), e._assigning = !0, mn(() => {
				e._assigning = !1;
			});
		}), e[io] = to(r);
	},
	mounted(e, { value: t }) {
		co(e, t);
	},
	beforeUpdate(e, t, n) {
		e[io] = to(n);
	},
	updated(e, { value: t }) {
		e._assigning || co(e, t);
	}
};
function co(e, t) {
	let n = e.multiple, r = d(t);
	if (!(n && !r && !p(t))) {
		for (let i = 0, a = e.options.length; i < a; i++) {
			let a = e.options[i], o = lo(a);
			if (n) if (r) {
				let e = typeof o;
				e === "string" || e === "number" ? a.selected = t.some((e) => String(e) === String(o)) : a.selected = be(t, o) > -1;
			} else a.selected = t.has(o);
			else if (ye(lo(a), t)) {
				e.selectedIndex !== i && (e.selectedIndex = i);
				return;
			}
		}
		!n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
	}
}
function lo(e) {
	return "_value" in e ? e._value : e.value;
}
var uo = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], fo = {
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
	exact: (e, t) => uo.some((n) => e[`${n}Key`] && !t.includes(n))
}, po = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = fo[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, mo = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, ho = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = D(n.key);
		if (t.some((e) => e === r || mo[e] === r)) return e(n);
	}));
}, go = /* @__PURE__ */ s({ patchProp: Ja }, ya), _o;
function vo() {
	return _o ||= ui(go);
}
var yo = ((...e) => {
	vo().render(...e);
}), bo = ((...e) => {
	let t = vo().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = So(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, xo(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function xo(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function So(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/runtime.ts
async function Co(e, t, n, r, i = {}) {
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
			let r = To(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: wo(n?.code) ?? r,
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
function wo(e) {
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
function To(e) {
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
var Eo = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, Do;
function Oo() {
	return Do ||= ko(Eo), Do;
}
function ko(e) {
	let t = async (t, n) => {
		let r = await e.fetchImpl(e.endpoint, {
			method: "POST",
			credentials: e.credentials,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: t,
				variables: n
			})
		}), i;
		try {
			i = await r.json();
		} catch (e) {
			throw Error(`GraphQL response was not JSON: ${e instanceof Error ? e.message : String(e)}`);
		}
		if (!r.ok || i.errors?.length) throw Error(i.errors?.[0]?.message ?? r.statusText ?? "GraphQL request failed");
		if (i.data === void 0) throw Error("GraphQL response did not include data");
		return i.data;
	};
	return {
		query: t,
		mutate: t
	};
}
//#endregion
//#region packages/sdk-core/src/relationship-registry.ts
var Ao = Symbol.for("comtrya.relationship-registry"), jo = Mo();
function Mo() {
	let e = globalThis;
	return e[Ao] ??= {
		types: /* @__PURE__ */ new Map(),
		providers: /* @__PURE__ */ new Map(),
		subscribers: /* @__PURE__ */ new Set()
	}, e[Ao];
}
function No(e) {
	return [...jo.types.values()].filter((t) => t.sourceKinds.includes(e) || t.targetKinds.includes(e)).sort((e, t) => e.order - t.order || e.id.localeCompare(t.id));
}
function Po(e) {
	return jo.providers.get(e);
}
function Fo(e) {
	return jo.subscribers.add(e), () => jo.subscribers.delete(e);
}
//#endregion
//#region packages/sdk-core/src/route-registry.ts
function Io(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`;
	return `/x/${e}${n === "/" ? "" : n.replace(/\/+$/, "")}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function Lo(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return Ro(t, e, n.signal), () => n.abort();
}
async function Ro(e, t, n) {
	try {
		let r = await zo(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: Bo(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await Vo(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function zo(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: Bo(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function Bo(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function Vo(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		Ho(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) Uo(e, t);
	}
	a += i.decode(), Ho(a, t);
}
function Ho(e, t) {
	for (let n of e.split("\n\n")) Uo(n, t);
}
function Uo(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = Wo(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function Wo(e, t) {
	let n = Go(e) ? e : {}, r = Go(n.data) ? n.data : {}, i = Ko(r.eventType) ?? Ko(n.type) ?? t ?? "";
	return {
		id: Ko(r.id) ?? Ko(n.id) ?? "",
		eventType: i,
		payloadB64: Ko(r.payloadB64) ?? "",
		timestampMs: qo(r.timestampMs) ?? Jo(qo(n.time)) ?? Date.now(),
		sourceUri: Ko(r.sourceUri) ?? Ko(n.source) ?? "",
		emitterExtension: Ko(r.emitterExtension) ?? Ko(r.extensionId) ?? Ko(n.source) ?? "",
		raw: e
	};
}
function Go(e) {
	return typeof e == "object" && !!e;
}
function Ko(e) {
	return typeof e == "string" ? e : void 0;
}
function qo(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function Jo(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var Yo = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], Xo = typeof navigator == "object" ? navigator.platform : "", Zo = /Mac|iPod|iPhone|iPad/.test(Xo), Qo = Zo ? "Meta" : "Control", $o = Xo === "Win32" ? ["Control", "Alt"] : Zo ? ["Alt"] : [];
function es(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || $o.includes(t) && e.getModifierState("AltGraph"));
}
function ts(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? Qo : e;
		}), n];
	});
}
function ns(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !es(e, t);
	}) || Yo.find(function(t) {
		return !n.includes(t) && r !== t && es(e, t);
	}));
}
function rs(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [ts(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			ns(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : es(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function is(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = rs(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var as = /* @__PURE__ */ new Map(), os = /* @__PURE__ */ new Set();
function ss(e) {
	as.set(e.id, e);
	for (let e of os) e();
	return () => {
		as.delete(e.id);
		for (let e of os) e();
	};
}
//#endregion
//#region packages/sdk-core/src/optimistic.ts
async function cs(e) {
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
//#region packages/sdk-vue/src/use-shortcuts.ts
function ls(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function us(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function ds(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (us(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			ls(e.target) || r(e);
		};
	}
	return t;
}
function fs(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = ds(e), i = () => {
		n ||= is(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? B(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), ar(a);
}
//#endregion
//#region packages/sdk-vue/src/parse-query.ts
function ps(e, t) {
	let n = {}, r = /* @__PURE__ */ new Set(), i = [], a = new Set(t);
	if (!e || !e.trim()) return {
		text: "",
		filters: n,
		unknown: []
	};
	for (let t of e.matchAll(/([A-Za-z][\w-]*):"([^"]*)"|([A-Za-z][\w-]*):(\S*)|(\S+)/g)) {
		let [, e, o, s, c, l] = t, u = (e ?? s ?? "").toLowerCase(), d = e ? o ?? "" : c ?? "";
		if (u) {
			if (!d) continue;
			a.has(u) ? (n[u] ?? (n[u] = [])).push(d) : r.add(u);
		} else l && i.push(l);
	}
	return {
		text: i.join(" "),
		filters: n,
		unknown: Array.from(r)
	};
}
//#endregion
//#region packages/sdk-vue/src/classify-principal.ts
var ms = {
	kind: "unknown",
	label: "unknown",
	glyph: "·",
	tone: "neutral"
};
function $(e) {
	if (!e) return ms;
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: hs(r),
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
			glyph: hs(r) || "·",
			tone: "neutral"
		};
	}
}
function hs(e) {
	return e.slice(0, 1).toUpperCase();
}
//#endregion
//#region packages/sdk-vue/src/comtrya-config.ts
function gs() {
	if (typeof window > "u") return [];
	let e = window.location.pathname;
	if (!e.startsWith("/r/")) return [];
	let t = e.slice(3), n = t.indexOf("/p/");
	return (n >= 0 ? t.slice(0, n) : t).split("/").filter(Boolean).map(decodeURIComponent);
}
async function _s(e) {
	try {
		let t = e ?? gs(), n = t.length > 0 ? "query ComtryaProjects($segments: [String!]!) {\n          workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n        }" : "query ComtryaProjectsCwd { repository { comtryaConfig } }", r = t.length > 0 ? { segments: t } : void 0, i = await Oo().query(n, r);
		return ((i.workspace?.repositoryByPath?.comtryaConfig ?? i.repository?.comtryaConfig ?? null)?.projects ?? []).filter((e) => typeof e == "object" && !!e);
	} catch {
		return [];
	}
}
//#endregion
//#region packages/sdk-vue/src/LabelPill.vue?vue&type=script&setup=true&lang.ts
var vs = ["title"], ys = {
	key: 0,
	class: "label-pill-value"
}, bs = { class: "label-pill-type" }, xs = { class: "label-pill-value" }, Ss = /* @__PURE__ */ Bn({
	__name: "LabelPill",
	props: {
		name: { type: String },
		catalog: { type: [Object, null] }
	},
	setup(e) {
		let t = e, n = Q(() => t.catalog ? t.catalog[t.name] ?? null : null), r = Q(() => {
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
		}), i = Q(() => n.value?.color ?? null), a = Q(() => n.value?.description ?? null);
		return (e, t) => (G(), K("span", {
			class: A(["label-pill", [`label-pill--${r.value.kind}`]]),
			title: a.value ?? void 0,
			style: ue(i.value ? { "--label-color": i.value } : void 0)
		}, [r.value.kind === "plain" ? (G(), K("span", ys, j(r.value.value), 1)) : (G(), K(W, { key: 1 }, [
			q("span", bs, j(r.value.type), 1),
			t[0] ||= q("span", {
				class: "label-pill-sep",
				"aria-hidden": "true"
			}, "::", -1),
			q("span", xs, j(r.value.value), 1)
		], 64))], 14, vs));
	}
});
//#endregion
//#region packages/sdk-vue/src/index.ts
function Cs(e) {
	ws(e.tagName, e.component);
	let t = /* @__PURE__ */ Qa(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(Es(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function ws(e, t) {
	if (typeof document > "u") return;
	let n = Ts(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function Ts(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function Es(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_issues/dist/ext_issues.client.ts
var Ds = {
	openIssue: async (e) => Co("ext_issues", "issues", "open-issue", e),
	closeIssue: async (e) => Co("ext_issues", "issues", "close-issue", e),
	reopenIssue: async (e) => Co("ext_issues", "issues", "reopen-issue", e),
	assignProject: async (e) => Co("ext_issues", "issues", "assign-project", e),
	getIssue: async (e) => Co("ext_issues", "issues", "get-issue", e),
	listIssues: async (e) => Co("ext_issues", "issues", "list-issues", e),
	byRefIssue: async (e) => Co("ext_issues", "issues", "by-ref-issue", e),
	byRefsIssue: async (e) => Co("ext_issues", "issues", "by-refs-issue", e),
	byNumberIssue: async (e) => Co("ext_issues", "issues", "by-number-issue", e),
	stateCountsForRefsIssue: async (e) => Co("ext_issues", "issues", "state-counts-for-refs-issue", e)
}, Os = "query($from: ResourceURN!, $kind: ResourceURN) {\n  relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n}", ks = "query($to: ResourceURN!, $kind: ResourceURN) {\n  relations.incoming(to: $to, kind: $kind) { id kind from to source target }\n}", As = "mutation($input: RelationCreateInput!) {\n  relations.create(input: $input) { id kind from to source target }\n}", js = "mutation($input: RelationDeleteInput!) {\n  relations.delete(input: $input)\n}";
function Ms(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Ns(e, t) {
	return t ? `comtrya://workspace/${e}/repository/${t}` : `comtrya://workspace/${e}`;
}
function Ps(e) {
	let t = e?.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/([^/]+))?$/);
	return {
		workspaceId: t?.[1] ?? "",
		repositoryId: t?.[2] ?? null
	};
}
function Fs(e) {
	switch (e) {
		case "closed":
		case "CLOSED": return "CLOSED";
		case "reopened":
		case "REOPENED": return "REOPENED";
		default: return "OPEN";
	}
}
function Is(e) {
	let t = Ps(e.repository);
	return {
		id: e.id,
		workspaceId: t.workspaceId,
		repositoryId: t.repositoryId,
		number: e.number,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: Fs(e.state),
		stateReason: e.stateReason ?? null,
		authorRef: e.authorRef ?? null,
		labels: e.labels ?? [],
		createdAt: e.createdAt ?? null,
		closedAt: e.closedAt ?? null,
		projectName: e.projectName ?? null,
		closeOnMerge: e.closeOnMerge ?? null,
		assignees: e.assignees ?? []
	};
}
async function Ls(e, t) {
	let n = Ms(await Ds.listIssues({
		repository: Ns(t.workspaceId, t.repositoryId),
		limit: 1024
	}), "listIssues").map(Is), r = t.state ? Fs(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function Rs(e, t) {
	let n = Ms(await Ds.byRefIssue(t), "issueByRef");
	return n ? Is(n) : null;
}
async function zs(e, t, n) {
	let r = Ms(await Ds.byNumberIssue({
		workspaceId: t,
		number: n
	}), "issueByNumber");
	return r ? Is(r) : null;
}
async function Bs(e) {
	return Is(Ms(await Ds.openIssue({
		repository: Ns(e.workspaceId, e.repositoryId),
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		projectName: e.projectName ?? null,
		labels: e.labels ?? [],
		closeOnMerge: e.closeOnMerge ?? null,
		assignees: e.assignees ?? []
	}), "openIssue"));
}
async function Vs(e, t) {
	return Is(Ms(await Ds.closeIssue({
		id: t,
		reason: "completed"
	}), "closeIssue"));
}
async function Hs(e, t) {
	return Is(Ms(await Ds.reopenIssue(t), "reopenIssue"));
}
async function Us(e, t) {
	return Is(Ms(await Ds.assignProject({
		id: e,
		projectName: t ?? null
	}), "assignProject"));
}
async function Ws(e, t, n) {
	return ((await e.query(Os, n ? {
		from: t,
		kind: n
	} : { from: t })).relations?.outgoing ?? []).map(Js);
}
async function Gs(e, t, n) {
	return ((await e.query(ks, n ? {
		to: t,
		kind: n
	} : { to: t })).relations?.incoming ?? []).map(Js);
}
async function Ks(e, t) {
	let n = (await e.mutate(As, { input: t })).relations?.create;
	if (!n) throw Error("relations.create returned no relation");
	return Js(n);
}
async function qs(e, t) {
	return (await e.mutate(js, { input: { id: t } })).relations?.delete ?? !1;
}
function Js(e) {
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
var Ys = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
function Xs(e) {
	return `comtrya://issue/${e.id}`;
}
var Zs = "issues";
function Qs(e) {
	return Io(Zs, `/${e.workspaceId}/${e.number}`);
}
function $s() {
	return Io(Zs, "/new");
}
function ec(e) {
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
var tc = ["data-state"], nc = ["data-issue-id"], rc = { class: "issue-card-title" }, ic = { class: "issue-number" }, ac = ["href"], oc = { class: "issue-meta" }, sc = { key: 0 }, cc = {
	key: 1,
	class: "issue-line muted"
}, lc = {
	key: 2,
	class: "issue-card-fallback"
}, uc = { class: "issue-line muted" }, dc = { class: "issue-line warn" }, fc = /* @__PURE__ */ Bn({
	__name: "IssueCard",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issue: { type: null },
		ref: { type: String },
		resourceRef: { type: String }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ L("idle"), r = /* @__PURE__ */ L(null), i = /* @__PURE__ */ L(t.issue ?? null), a = Q(() => t.resourceRef ?? t.ref ?? ""), o = Q(() => t.client ?? t.comtryaClient), s = Q(() => t.issue ?? i.value), c = Q(() => ec(s.value?.state)), l = Q(() => s.value?.labels?.join(", ") ?? ""), u = Q(() => s.value ? Qs(s.value) : "#");
		tr(d), B(() => [
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
				i.value = await Rs(o.value, a.value), n.value = i.value ? "ready" : "empty";
			} catch (e) {
				i.value = null, n.value = "error", r.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (e, t) => (G(), K("article", {
			class: "issue-card",
			"data-state": n.value,
			"data-smoke": "issue-card"
		}, [s.value ? (G(), K("div", {
			key: 0,
			class: "issue-card-body",
			"data-issue-id": s.value.id,
			"data-smoke": "issue-card-body"
		}, [q("div", rc, [
			q("span", { class: A(["issue-pill", c.value.className]) }, j(c.value.label), 3),
			q("span", ic, "#" + j(s.value.number), 1),
			q("a", {
				class: "issue-title-link",
				href: u.value
			}, j(s.value.title), 9, ac)
		]), q("div", oc, [q("span", null, "by " + j(s.value.authorRef ?? "unknown"), 1), l.value ? (G(), K("span", sc, j(l.value), 1)) : X("", !0)])], 8, nc)) : n.value === "loading" ? (G(), K("p", cc, " Loading " + j(a.value), 1)) : (G(), K("div", lc, [q("p", uc, j(a.value || "issue"), 1), q("p", dc, j(r.value ?? "issue not found"), 1)]))], 8, tc));
	}
}), pc = ".issue-card[data-v-926ccdce]{display:block}.issue-card-body[data-v-926ccdce]{border:1px solid var(--ink-rule,#d0cfc8);padding:8px 12px}.issue-card-title[data-v-926ccdce]{align-items:baseline;gap:8px;min-width:0;display:flex}.issue-pill[data-v-926ccdce],.issue-number[data-v-926ccdce],.issue-meta[data-v-926ccdce],.issue-line[data-v-926ccdce]{font-family:var(--mono,monospace)}.issue-pill[data-v-926ccdce]{border:1px solid;padding:1px 8px;font-size:10px}.issue-state-open[data-v-926ccdce]{color:var(--ink-go,#008873)}.issue-state-closed[data-v-926ccdce],.issue-number[data-v-926ccdce],.issue-meta[data-v-926ccdce]{color:var(--ink-faint,#888)}.issue-number[data-v-926ccdce]{font-size:12px}.issue-title-link[data-v-926ccdce]{min-width:0;color:inherit;font-family:var(--display,system-ui);overflow-wrap:anywhere;font-weight:600}.issue-meta[data-v-926ccdce]{flex-wrap:wrap;gap:8px;margin-top:4px;font-size:11px;display:flex}.issue-line[data-v-926ccdce]{margin:4px 0;font-size:12px}.muted[data-v-926ccdce]{color:var(--ink-faint,#888)}.warn[data-v-926ccdce]{color:var(--ink-warn,#c2410c)}", mc = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, hc = /* @__PURE__ */ mc(fc, [["styles", [pc]], ["__scopeId", "data-v-926ccdce"]]), gc = /* @__PURE__ */ mc(/* @__PURE__ */ Bn({
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
		tr(i), B(() => [
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
		return (e, t) => (G(), K("span", {
			ref_key: "mount",
			ref: n,
			class: "custom-element-host"
		}, null, 512));
	}
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]), _c = {
	defaultLabels: [],
	closeOnMerge: null,
	ownerRefs: []
};
function vc(e = "location") {
	let t = e === "location" ? typeof window < "u" ? window.location.pathname : "" : yc();
	if (!t.startsWith("/r/")) return [];
	let n = t.slice(3), r = n.indexOf("/p/");
	return (r >= 0 ? n.slice(0, r) : n).split("/").filter(Boolean).map(decodeURIComponent);
}
function yc() {
	let e = typeof document < "u" && document.referrer || "";
	if (!e) return "";
	try {
		return new URL(e).pathname;
	} catch {
		return "";
	}
}
async function bc(e, t = "location") {
	try {
		let n = vc(t), r = n.length > 0 ? "query Q($segments: [String!]!) {\n          workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n        }" : "{ repository { comtryaConfig } }", i = n.length > 0 ? { segments: n } : void 0, a = await Oo().query(r, i), o = ((a.workspace?.repositoryByPath?.comtryaConfig ?? a.repository?.comtryaConfig ?? null)?.projects ?? []).find((t) => t.name === e), s = (o?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0);
		return {
			defaultLabels: o?.issues?.defaultLabels ?? [],
			closeOnMerge: typeof o?.issues?.closeOnMerge == "boolean" ? o.issues.closeOnMerge : null,
			ownerRefs: s
		};
	} catch {
		return _c;
	}
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/IssueDetail.vue?vue&type=script&setup=true&lang.ts
var xc = ["data-state", "data-issue-id"], Sc = {
	key: 0,
	class: "issue-line muted"
}, Cc = {
	key: 1,
	class: "issue-line warn"
}, wc = {
	key: 2,
	class: "issue-line warn"
}, Tc = {
	key: 3,
	class: "issue-detail-shell"
}, Ec = { class: "issue-main" }, Dc = { class: "issue-hero" }, Oc = { class: "issue-kicker" }, kc = { class: "issue-number" }, Ac = {
	key: 0,
	class: "issue-repository"
}, jc = {
	class: "issue-chip-row",
	"aria-label": "Issue metadata"
}, Mc = ["href", "title"], Nc = {
	key: 1,
	class: "issue-chip tone-warn",
	title: "closeOnMerge=false — opted out of the PR merge reactor's auto-close path."
}, Pc = ["data-author-kind", "title"], Fc = { class: "chip-glyph" }, Ic = ["data-author-kind", "title"], Lc = { class: "chip-glyph" }, Rc = ["title"], zc = ["data-issue-id"], Bc = { class: "issue-thread" }, Vc = {
	class: "issue-sidebar",
	"aria-label": "Issue sidebar"
}, Hc = { class: "issue-panel" }, Uc = { class: "issue-state-summary" }, Wc = { key: 0 }, Gc = { class: "issue-actions" }, Kc = ["disabled"], qc = ["disabled"], Jc = {
	key: 0,
	class: "issue-line warn",
	role: "alert"
}, Yc = {
	class: "issue-panel",
	"data-smoke": "issue-project-picker"
}, Xc = ["value", "disabled"], Zc = ["value"], Qc = {
	key: 0,
	class: "issue-line warn",
	role: "alert"
}, $c = {
	key: 0,
	class: "issue-panel",
	"data-smoke": "issue-project-owners"
}, el = ["href", "title"], tl = { class: "issue-owners" }, nl = ["data-author-kind", "title"], rl = { class: "chip-glyph" }, il = { class: "issue-line muted" }, al = "comtrya-issue-relationships", ol = /* @__PURE__ */ mc(/* @__PURE__ */ Bn({
	__name: "IssueDetail",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issue: { type: null },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] },
		number: { type: [Number, String] },
		routeParams: { type: null },
		labelCatalog: { type: null }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ L("idle"), r = /* @__PURE__ */ L("idle"), i = /* @__PURE__ */ L(null), a = /* @__PURE__ */ L(null), o = /* @__PURE__ */ L(t.issue ?? null), s = Q(() => t.client ?? t.comtryaClient), c = Q(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3"), l = Q(() => o.value ?? t.issue ?? null), u = Q(() => ec(l.value?.state)), d = Q(() => !!l.value?.bodyMarkdown?.trim()), f = Q(() => l.value?.bodyMarkdown?.trim() || "No description has been added yet."), p = Q(() => ee(l.value?.createdAt)), m = Q(() => te(l.value?.createdAt)), h = Q(() => t.repositoryPath ?? l.value?.repositoryId ?? null), g = Q(() => Number(t.number ?? t.routeParams?.params?.number)), _ = Q(() => s.value && Number.isFinite(g.value)), v = /* @__PURE__ */ L(null), y = Q(() => v.value?.ownerRefs ?? []);
		B(() => l.value?.projectName ?? "", async (e) => {
			if (!e) {
				v.value = null;
				return;
			}
			try {
				v.value = await bc(e);
			} catch {
				v.value = null;
			}
		}, { immediate: !0 });
		let b = /* @__PURE__ */ L([]), x = /* @__PURE__ */ L("idle"), S = /* @__PURE__ */ L(null);
		tr(async () => {
			try {
				b.value = await _s();
			} catch {
				b.value = [];
			}
		});
		async function C(e) {
			let t = e.target;
			if (!t || !l.value) return;
			let n = l.value, r = t.value || null;
			if ((n.projectName ?? null) === r) return;
			x.value = "submitting", S.value = null;
			let i = n.projectName ?? null;
			o.value = {
				...n,
				projectName: r
			};
			try {
				o.value = await Us(n.id, r);
			} catch (e) {
				o.value = {
					...n,
					projectName: i
				}, t.value = i ?? "", S.value = e instanceof Error ? e.message : String(e);
			} finally {
				x.value = "idle";
			}
		}
		tr(w), B(() => [
			s.value,
			t.issue,
			c.value,
			t.repositoryId,
			t.number,
			t.routeParams?.params?.number
		], () => void w());
		async function w() {
			if (t.issue) {
				o.value = T(t.issue) ? t.issue : null, n.value = o.value ? "ready" : "empty", i.value = null;
				return;
			}
			if (!_.value || !s.value) {
				o.value = null, n.value = "error", i.value = "issue-detail: missing params";
				return;
			}
			n.value = "loading", i.value = null;
			try {
				let e = await zs(s.value, c.value, g.value);
				o.value = e && T(e) ? e : null, n.value = o.value ? "ready" : "empty";
			} catch (e) {
				o.value = null, n.value = "error", i.value = e instanceof Error ? e.message : String(e);
			}
		}
		function T(e) {
			return !t.repositoryId || e.repositoryId === t.repositoryId;
		}
		function ee(e) {
			if (!e) return null;
			let t = new Date(e);
			return Number.isNaN(t.valueOf()) ? e : new Intl.DateTimeFormat(void 0, {
				dateStyle: "medium",
				timeStyle: "short"
			}).format(t);
		}
		function te(e) {
			if (!e) return null;
			let t = Date.parse(e);
			if (!Number.isFinite(t)) return null;
			let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
		}
		async function E() {
			if (!s.value || !l.value) return;
			let e = s.value, t = l.value, n = {
				...t,
				state: "CLOSED",
				stateReason: "completed"
			};
			r.value = "submitting", a.value = null;
			try {
				let r = await cs({
					apply: () => {
						o.value = n;
					},
					rollback: () => {
						o.value = t;
					},
					op: async () => ({
						ok: !0,
						value: await Vs(e, t.id)
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
		async function ne() {
			if (!s.value || !l.value) return;
			let e = s.value, t = l.value, n = {
				...t,
				state: "OPEN",
				stateReason: null,
				closedAt: null
			};
			r.value = "submitting", a.value = null;
			try {
				let r = await cs({
					apply: () => {
						o.value = n;
					},
					rollback: () => {
						o.value = t;
					},
					op: async () => ({
						ok: !0,
						value: await Hs(e, t.id)
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
		return (o, _) => (G(), K("main", {
			class: "issue-detail",
			"data-state": n.value,
			"data-issue-id": l.value?.id,
			"data-smoke": "issue-detail"
		}, [n.value === "loading" ? (G(), K("p", Sc, "Loading issue")) : n.value === "error" ? (G(), K("p", Cc, j(i.value), 1)) : l.value ? (G(), K("div", Tc, [q("section", Ec, [
			q("header", Dc, [
				q("div", Oc, [
					q("span", { class: A(["issue-pill", u.value.className]) }, j(u.value.label), 3),
					q("span", kc, "#" + j(l.value.number), 1),
					h.value ? (G(), K("span", Ac, j(h.value), 1)) : X("", !0)
				]),
				q("h1", null, j(l.value.title), 1),
				q("div", jc, [
					l.value.projectName ? (G(), K("a", {
						key: 0,
						class: "issue-chip tone-project issue-chip-link",
						href: `/x/issues/?project=${encodeURIComponent(l.value.projectName)}`,
						title: `Filter issues by project ${l.value.projectName}`
					}, [_[0] ||= q("span", { class: "chip-glyph" }, "◇", -1), Y(j(l.value.projectName), 1)], 8, Mc)) : X("", !0),
					(G(!0), K(W, null, V(l.value.labels ?? [], (t) => (G(), ji(R(Ss), {
						key: `label-${t}`,
						name: t,
						catalog: e.labelCatalog ?? null
					}, null, 8, ["name", "catalog"]))), 128)),
					l.value.closeOnMerge === !1 ? (G(), K("span", Nc, "closeOnMerge · off")) : X("", !0),
					(G(!0), K(W, null, V(l.value.assignees ?? [], (e) => (G(), K("span", {
						key: `assignee-${e}`,
						class: "issue-chip tone-assignee",
						"data-author-kind": R($)(e).kind,
						title: e
					}, [q("span", Fc, j(R($)(e).glyph), 1), Y(" " + j(R($)(e).label), 1)], 8, Pc))), 128)),
					l.value.authorRef ? (G(), K("span", {
						key: 2,
						class: "issue-chip tone-author",
						"data-author-kind": R($)(l.value.authorRef).kind,
						title: `Opened by ${l.value.authorRef}`
					}, [q("span", Lc, j(R($)(l.value.authorRef).glyph), 1), Y(" by " + j(R($)(l.value.authorRef).label), 1)], 8, Ic)) : X("", !0),
					m.value ? (G(), K("span", {
						key: 3,
						class: "issue-chip tone-time",
						title: p.value ?? ""
					}, "opened " + j(m.value), 9, Rc)) : X("", !0)
				])
			]),
			q("article", {
				class: A(["issue-body", { "is-empty": !d.value }]),
				"data-issue-id": l.value.id,
				"data-smoke": "issue-detail-main"
			}, j(f.value), 11, zc),
			q("section", Bc, [_[1] ||= q("header", null, [q("h2", null, "Activity")], -1), J(gc, {
				tag: "comtrya-comment-thread",
				attributes: { target: R(Xs)(l.value) },
				properties: {
					target: R(Xs)(l.value),
					comtryaClient: s.value
				}
			}, null, 8, ["attributes", "properties"])])
		]), q("aside", Vc, [
			q("section", Hc, [
				_[2] ||= q("header", null, [q("h2", null, "State")], -1),
				q("div", Uc, [q("span", { class: A(["issue-pill", u.value.className]) }, j(u.value.label), 3), l.value.stateReason ? (G(), K("span", Wc, j(l.value.stateReason), 1)) : X("", !0)]),
				q("div", Gc, [l.value.state === "OPEN" || l.value.state === "REOPENED" ? (G(), K("button", {
					key: 0,
					type: "button",
					disabled: r.value === "submitting",
					onClick: E
				}, " Close issue ", 8, Kc)) : (G(), K("button", {
					key: 1,
					type: "button",
					disabled: r.value === "submitting",
					onClick: ne
				}, " Reopen issue ", 8, qc))]),
				a.value ? (G(), K("p", Jc, j(a.value), 1)) : X("", !0)
			]),
			q("section", Yc, [
				_[4] ||= q("header", null, [q("h2", null, "Project")], -1),
				q("select", {
					class: "issue-project-select",
					"data-smoke": "issue-project-select",
					value: l.value.projectName ?? "",
					disabled: x.value === "submitting",
					onChange: C
				}, [_[3] ||= q("option", { value: "" }, "— no project —", -1), (G(!0), K(W, null, V(b.value, (e) => (G(), K("option", {
					key: e.name,
					value: e.name ?? ""
				}, j(e.name), 9, Zc))), 128))], 40, Xc),
				S.value ? (G(), K("p", Qc, j(S.value), 1)) : X("", !0),
				_[5] ||= q("p", { class: "issue-line muted" }, [
					Y(" Stamps "),
					q("code", null, "projectName"),
					Y(" on this issue. Lights up the workspace per-Project counts. ")
				], -1)
			]),
			l.value.projectName && y.value.length > 0 ? (G(), K("section", $c, [
				q("header", null, [_[6] ||= q("h2", null, "Routed to", -1), q("a", {
					href: `/x/issues/?project=${encodeURIComponent(l.value.projectName)}`,
					class: "issue-panel-link",
					title: `Filter to project ${l.value.projectName}`
				}, "◇ " + j(l.value.projectName), 9, el)]),
				q("ul", tl, [(G(!0), K(W, null, V(y.value, (e) => (G(), K("li", {
					key: e,
					class: "issue-owner",
					"data-author-kind": R($)(e).kind,
					title: e
				}, [q("span", rl, j(R($)(e).glyph), 1), Y(" " + j(R($)(e).label), 1)], 8, nl))), 128))]),
				q("p", il, [
					_[7] ||= Y(" From ", -1),
					_[8] ||= q("code", null, "package comtrya", -1),
					Y(" · projects." + j(l.value.projectName) + ".owners ", 1)
				])
			])) : X("", !0),
			J(gc, {
				tag: al,
				properties: {
					client: s.value,
					issue: l.value,
					workspaceId: c.value,
					repositoryId: l.value.repositoryId,
					repositoryPath: t.repositoryPath
				}
			}, null, 8, ["properties"])
		])])) : (G(), K("p", wc, " No issue #" + j(Number.isFinite(g.value) ? g.value : "?") + " in " + j(c.value), 1))], 8, xc));
	}
}), [["styles", [".issue-detail[data-v-f872342e]{width:min(100%,1180px);color:var(--ink,#111);gap:24px;padding:8px 0 48px;display:grid}.issue-detail-shell[data-v-f872342e]{grid-template-columns:minmax(0,1fr) minmax(280px,340px);align-items:start;gap:32px;display:grid}.issue-main[data-v-f872342e],.issue-sidebar[data-v-f872342e],.issue-panel[data-v-f872342e],.issue-thread[data-v-f872342e]{min-width:0}.issue-main[data-v-f872342e]{gap:24px;display:grid}.issue-sidebar[data-v-f872342e]{gap:16px;display:grid}.issue-detail h1[data-v-f872342e]{max-width:820px;font-family:var(--display,system-ui);letter-spacing:0;overflow-wrap:anywhere;margin:10px 0 0;font-size:42px;line-height:1}.issue-hero[data-v-f872342e]{border-bottom:2px solid var(--ink,#111);gap:14px;padding-bottom:22px;display:grid}.issue-kicker[data-v-f872342e]{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.issue-chip-row[data-v-f872342e]{flex-wrap:wrap;gap:6px;margin:4px 0 0;display:flex}.issue-chip[data-v-f872342e]{border:1px solid var(--rule-light,#d8d1c4);font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);align-items:center;gap:5px;padding:2px 8px;font-size:11px;line-height:16px;display:inline-flex}.issue-chip .chip-glyph[data-v-f872342e]{place-items:center;width:13px;height:13px;font-size:10px;font-weight:700;display:inline-grid}.issue-chip.tone-project[data-v-f872342e]{color:var(--accent-blue,#1d55a6);border-color:currentColor}.issue-chip-link[data-v-f872342e]{cursor:pointer;text-decoration:none}.issue-chip-link[data-v-f872342e]:hover{background:#1d55a60f}.issue-chip.tone-label[data-v-f872342e]{color:var(--accent-teal,#087f6f);border-color:currentColor}.issue-chip.tone-warn[data-v-f872342e]{color:var(--accent-yellow,#c89300);text-transform:lowercase;border-color:currentColor}.issue-chip.tone-assignee[data-v-f872342e]{cursor:help;border-style:dashed;border-color:currentColor}.issue-chip.tone-author[data-v-f872342e],.issue-chip.tone-assignee[data-v-f872342e]{color:var(--ink-soft,#2c2b28)}.issue-chip.tone-author[data-author-kind=agent][data-v-f872342e],.issue-chip.tone-assignee[data-author-kind=agent][data-v-f872342e]{color:#6b3fa0}.issue-chip.tone-author[data-author-kind=credential][data-v-f872342e],.issue-chip.tone-assignee[data-author-kind=credential][data-v-f872342e]{color:var(--accent-yellow,#c89300)}.issue-chip.tone-author[data-author-kind=bot][data-v-f872342e],.issue-chip.tone-assignee[data-author-kind=bot][data-v-f872342e]{color:var(--accent-blue,#1d55a6)}.issue-chip.tone-author[data-author-kind=team][data-v-f872342e],.issue-chip.tone-assignee[data-author-kind=team][data-v-f872342e]{color:var(--accent-teal,#087f6f)}.issue-chip.tone-time[data-v-f872342e]{color:var(--ink-faint,#68645c);border-style:none;padding-left:2px}.issue-line[data-v-f872342e],.issue-kicker[data-v-f872342e],.issue-panel[data-v-f872342e],.issue-actions button[data-v-f872342e]{font-family:var(--mono,monospace)}.issue-pill[data-v-f872342e]{min-height:22px;font-family:var(--mono,monospace);text-transform:lowercase;border:1px solid;align-items:center;padding:2px 8px;font-size:11px;line-height:1;display:inline-flex}.issue-number[data-v-f872342e],.issue-repository[data-v-f872342e]{color:var(--ink-faint,#888);font-size:12px}.issue-state-open[data-v-f872342e]{color:var(--ink-go,#008873)}.issue-state-closed[data-v-f872342e]{color:var(--ink-faint,#888)}.issue-body[data-v-f872342e]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 86%, white);white-space:pre-wrap;overflow-wrap:anywhere;min-height:156px;padding:20px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55}.issue-body.is-empty[data-v-f872342e]{color:var(--ink-faint,#888);font-family:var(--mono,monospace);font-size:12px}.issue-thread[data-v-f872342e]{gap:12px;padding-top:4px;display:grid}.issue-thread header[data-v-f872342e],.issue-panel header[data-v-f872342e]{border-bottom:1px solid var(--ink-rule,#d0cfc8);align-items:center;min-height:36px;display:flex}.issue-thread h2[data-v-f872342e],.issue-panel h2[data-v-f872342e]{font-family:var(--display,system-ui);margin:0;font-size:18px;line-height:1}.issue-panel[data-v-f872342e]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 94%, white);gap:12px;padding:14px;display:grid}.issue-state-summary[data-v-f872342e]{color:var(--ink-faint,#888);flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;display:flex}.issue-actions[data-v-f872342e]{gap:8px;display:grid}.issue-project-select[data-v-f872342e]{border:1.5px solid var(--ink-rule,#d0cfc8);background:var(--paper,#fffdf8);width:100%;color:var(--ink,#111);font-family:var(--mono,monospace);outline:none;padding:8px 10px;font-size:13px;transition:border-color .12s}.issue-project-select[data-v-f872342e]:focus{border-color:var(--ink,#111)}.issue-project-select[data-v-f872342e]:disabled{cursor:wait;opacity:.55}.issue-panel header .issue-panel-link[data-v-f872342e]{font-family:var(--mono,monospace);color:var(--accent-blue,#1d55a6);letter-spacing:.02em;margin-left:auto;font-size:11px;text-decoration:none}.issue-panel header .issue-panel-link[data-v-f872342e]:hover{text-underline-offset:2px;text-decoration:underline}.issue-owners[data-v-f872342e]{flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none;display:flex}.issue-owner[data-v-f872342e]{color:var(--ink,#111);font-family:var(--mono,monospace);letter-spacing:.02em;border:1px solid;align-items:center;gap:5px;padding:2px 8px;font-size:11px;display:inline-flex}.issue-owner .chip-glyph[data-v-f872342e]{font-family:var(--display,system-ui);font-size:12px;line-height:1}.issue-owner[data-author-kind=team][data-v-f872342e]{color:var(--accent-teal,#087f6f)}.issue-owner[data-author-kind=human][data-v-f872342e]{color:var(--ink,#111)}.issue-owner[data-author-kind=agent][data-v-f872342e]{color:#6b3fa0}.issue-owner[data-author-kind=bot][data-v-f872342e]{color:var(--accent-blue,#1d55a6)}.issue-owner[data-author-kind=credential][data-v-f872342e]{color:var(--accent-yellow,#c89300)}.issue-line.muted code[data-v-f872342e]{font-family:var(--mono,monospace);background:var(--paper-tint,#f2efe7);color:var(--ink-soft,#2c2b28);padding:0 4px;font-size:11px}.issue-actions button[data-v-f872342e]{border:1.5px solid var(--ink,#111);min-height:34px;color:inherit;cursor:pointer;text-align:left;background:0 0;padding:8px 12px}.issue-actions button[data-v-f872342e]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-f872342e]{margin:4px 0;font-size:12px}.muted[data-v-f872342e]{color:var(--ink-faint,#888)}.warn[data-v-f872342e]{color:var(--ink-warn,#c2410c)}@media (max-width:920px){.issue-detail-shell[data-v-f872342e]{grid-template-columns:1fr}.issue-detail h1[data-v-f872342e]{font-size:34px}}"]], ["__scopeId", "data-v-f872342e"]]), sl = {
	class: "issue-relationships",
	"data-smoke": "issue-detail-relationships"
}, cl = { class: "relationship-header" }, ll = {
	key: 0,
	class: "issue-line muted"
}, ul = {
	key: 1,
	class: "issue-line warn"
}, dl = {
	key: 2,
	class: "issue-line muted"
}, fl = {
	key: 3,
	class: "relationship-groups"
}, pl = { class: "relationship-group-heading" }, ml = { class: "relationship-card" }, hl = [
	"aria-label",
	"disabled",
	"onClick"
], gl = ["value"], _l = ["value"], vl = ["disabled"], yl = {
	key: 5,
	class: "issue-line muted"
}, bl = {
	key: 6,
	class: "issue-line warn",
	role: "alert"
}, xl = "issue", Sl = /* @__PURE__ */ mc(/* @__PURE__ */ Bn({
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
		let t = e, n = Q(() => t.client ?? t.comtryaClient), r = Q(() => Xs(t.issue)), i = /* @__PURE__ */ L("idle"), a = /* @__PURE__ */ L(null), o = /* @__PURE__ */ L("idle"), s = /* @__PURE__ */ L(null), c = /* @__PURE__ */ L([]), l = /* @__PURE__ */ L([]), u = /* @__PURE__ */ L([]), d = /* @__PURE__ */ L(""), f = /* @__PURE__ */ L(""), p = /* @__PURE__ */ L(0), m, h = Q(() => (p.value, No(xl))), g = Q(() => y.value.reduce((e, t) => e + t.relations.length, 0)), _ = Q(() => {
			let e = [];
			for (let t of h.value) {
				if (t.symmetric) {
					let n = E(t.sourceKinds.includes(xl) ? t.targetKinds : t.sourceKinds);
					n.length > 0 && e.push({
						key: `${t.id}:symmetric`,
						type: t,
						direction: "symmetric",
						label: t.outgoingLabel,
						targetKinds: n
					});
					continue;
				}
				if (t.sourceKinds.includes(xl)) {
					let n = E(t.targetKinds);
					n.length > 0 && e.push({
						key: `${t.id}:outgoing`,
						type: t,
						direction: "outgoing",
						label: t.outgoingLabel,
						targetKinds: n
					});
				}
				if (t.targetKinds.includes(xl)) {
					let n = E(t.sourceKinds);
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
		}), v = Q(() => _.value.find((e) => e.key === d.value)), y = Q(() => {
			let e = [];
			for (let t of h.value) {
				if (t.symmetric) {
					let n = ne([...c.value, ...l.value]).filter((e) => e.kind === t.kind).map((e) => ({
						relation: e,
						targetRef: ee(e, r.value)
					})).filter((e) => t.sourceKinds.includes(te(e.targetRef)) || t.targetKinds.includes(te(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:symmetric`,
						label: t.outgoingLabel,
						relations: n
					});
					continue;
				}
				if (t.sourceKinds.includes(xl)) {
					let n = c.value.filter((e) => e.kind === t.kind && w(e) === r.value).map((e) => ({
						relation: e,
						targetRef: T(e)
					})).filter((e) => t.targetKinds.includes(te(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:outgoing`,
						label: t.outgoingLabel,
						relations: n
					});
				}
				if (t.targetKinds.includes(xl)) {
					let n = l.value.filter((e) => e.kind === t.kind && T(e) === r.value).map((e) => ({
						relation: e,
						targetRef: w(e)
					})).filter((e) => t.sourceKinds.includes(te(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:incoming`,
						label: t.incomingLabel,
						relations: n
					});
				}
			}
			return e;
		});
		tr(() => {
			m = Fo(() => {
				p.value += 1;
			});
		}), ar(() => m?.()), B(() => [n.value, t.issue.id], () => void b(), { immediate: !0 }), B(_, (e) => {
			e.some((e) => e.key === d.value) || (d.value = e[0]?.key ?? "");
		}, { immediate: !0 }), B(() => [
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
				let [t, n] = await Promise.all([Ws(e, r.value), Gs(e, r.value)]);
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
					let a = Po(i);
					if (!a) continue;
					let o = await a.loadTargets({
						workspaceId: t.workspaceId,
						repositoryId: t.repositoryId,
						repositoryPath: t.repositoryPath,
						currentRef: r.value,
						currentKind: xl,
						relationshipType: e.type,
						direction: e.direction,
						targetKind: i
					});
					n.push(...o);
				}
				u.value = D(n).filter((e) => e.ref !== r.value), f.value = u.value[0]?.ref ?? "";
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
				await Ks(e, {
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
					await qs(t, e.id), await b();
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
		function T(e) {
			return e.to ?? e.target ?? "";
		}
		function ee(e, t) {
			let n = w(e), r = T(e);
			return n === t ? r : n === r ? "" : n;
		}
		function te(e) {
			return e.match(/^comtrya:\/\/([^/]+)\//)?.[1] ?? "";
		}
		function E(e) {
			return [...new Set(e)].filter((e) => Po(e) !== void 0);
		}
		function ne(e) {
			let t = /* @__PURE__ */ new Set();
			return e.filter((e) => t.has(e.id) ? !1 : (t.add(e.id), !0));
		}
		function D(e) {
			let t = /* @__PURE__ */ new Set();
			return e.filter((e) => t.has(e.ref) ? !1 : (t.add(e.ref), !0));
		}
		return (e, t) => (G(), K("section", sl, [
			q("header", cl, [q("div", null, [t[2] ||= q("h2", null, "Relationships", -1), q("p", null, j(g.value) + " linked", 1)])]),
			i.value === "loading" ? (G(), K("p", ll, "Loading relationships")) : i.value === "error" ? (G(), K("p", ul, j(a.value), 1)) : y.value.length === 0 ? (G(), K("p", dl, " No relationships yet. ")) : (G(), K("div", fl, [(G(!0), K(W, null, V(y.value, (e) => (G(), K("section", {
				key: e.key,
				class: "relationship-group"
			}, [q("div", pl, [q("h3", null, j(e.label), 1), q("span", null, j(e.relations.length), 1)]), q("ul", null, [(G(!0), K(W, null, V(e.relations, (t) => (G(), K("li", { key: t.relation.id }, [q("div", ml, [J(gc, {
				tag: "comtrya-resource-card",
				attributes: { ref: t.targetRef },
				properties: {
					ref: t.targetRef,
					comtryaClient: n.value
				}
			}, null, 8, ["attributes", "properties"])]), q("button", {
				type: "button",
				class: "relationship-remove",
				"aria-label": `Remove ${e.label} relationship`,
				disabled: o.value === "submitting",
				onClick: (e) => C(t.relation)
			}, " Remove ", 8, hl)]))), 128))])]))), 128))])),
			_.value.length > 0 ? (G(), K("form", {
				key: 4,
				class: "relationship-form",
				onSubmit: po(S, ["prevent"])
			}, [
				q("label", null, [t[3] ||= q("span", null, "Type", -1), Dn(q("select", {
					"onUpdate:modelValue": t[0] ||= (e) => d.value = e,
					"aria-label": "Relationship type"
				}, [(G(!0), K(W, null, V(_.value, (e) => (G(), K("option", {
					key: e.key,
					value: e.key
				}, j(e.label), 9, gl))), 128))], 512), [[so, d.value]])]),
				q("label", null, [t[4] ||= q("span", null, "Target", -1), Dn(q("select", {
					"onUpdate:modelValue": t[1] ||= (e) => f.value = e,
					"aria-label": "Relationship target"
				}, [(G(!0), K(W, null, V(u.value, (e) => (G(), K("option", {
					key: e.ref,
					value: e.ref
				}, j(e.title) + j(e.subtitle ? ` - ${e.subtitle}` : ""), 9, _l))), 128))], 512), [[so, f.value]])]),
				q("button", {
					type: "submit",
					disabled: o.value !== "idle" || !f.value
				}, " Add ", 8, vl)
			], 32)) : X("", !0),
			_.value.length > 0 && u.value.length === 0 && o.value === "idle" ? (G(), K("p", yl, " No eligible targets for this relationship. ")) : X("", !0),
			s.value ? (G(), K("p", bl, j(s.value), 1)) : X("", !0)
		]));
	}
}), [["styles", [".issue-relationships[data-v-0937cdb1]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 94%, white);font-family:var(--mono,monospace);gap:12px;padding:14px;font-size:12px;display:grid}.relationship-header[data-v-0937cdb1]{border-bottom:1px solid var(--ink-rule,#d0cfc8);align-items:center;min-height:36px;display:flex}.relationship-header h2[data-v-0937cdb1],.relationship-group h3[data-v-0937cdb1]{font-family:var(--display,system-ui);margin:0}.relationship-header h2[data-v-0937cdb1]{font-size:18px;line-height:1}.relationship-header p[data-v-0937cdb1]{color:var(--ink-faint,#888);margin:4px 0 0;font-size:11px}.relationship-groups[data-v-0937cdb1],.relationship-group[data-v-0937cdb1],.relationship-group ul[data-v-0937cdb1]{flex-direction:column;gap:8px;display:flex}.relationship-group[data-v-0937cdb1]{padding-top:4px}.relationship-group-heading[data-v-0937cdb1]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.relationship-group-heading h3[data-v-0937cdb1]{font-size:14px;line-height:1}.relationship-group-heading span[data-v-0937cdb1]{color:var(--ink-faint,#888);font-size:11px}.relationship-group ul[data-v-0937cdb1]{margin:0;padding:0;list-style:none}.relationship-group li[data-v-0937cdb1]{grid-template-columns:minmax(0,1fr) auto;align-items:stretch;gap:8px;display:grid}.relationship-card[data-v-0937cdb1]{min-width:0}.relationship-form[data-v-0937cdb1]{border-top:1px solid var(--ink-rule,#d0cfc8);gap:8px;padding-top:12px;display:grid}.relationship-form label[data-v-0937cdb1]{flex-direction:column;gap:4px;min-width:0;display:flex}.relationship-form label>span[data-v-0937cdb1]{color:var(--ink-faint,#888);letter-spacing:.08em;text-transform:uppercase;font-size:10px}.relationship-form select[data-v-0937cdb1],.relationship-form button[data-v-0937cdb1],.relationship-group button[data-v-0937cdb1]{border:1px solid var(--ink,#111);min-height:32px;color:inherit;font:inherit;background:0 0}.relationship-form select[data-v-0937cdb1]{width:100%;max-width:100%;padding:5px 8px}.relationship-form button[data-v-0937cdb1],.relationship-group button[data-v-0937cdb1]{cursor:pointer;padding:5px 10px}.relationship-remove[data-v-0937cdb1]{color:var(--ink-faint,#888);align-self:start}.relationship-form button[data-v-0937cdb1]:disabled,.relationship-group button[data-v-0937cdb1]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-0937cdb1]{margin:4px 0;font-size:12px}.muted[data-v-0937cdb1]{color:var(--ink-faint,#888)}.warn[data-v-0937cdb1]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-0937cdb1"]]), Cl = {
	class: "issues-queue",
	"data-smoke": "issues-list"
}, wl = { class: "issues-queue-head" }, Tl = { class: "head-row" }, El = ["href"], Dl = { class: "issues-controls" }, Ol = {
	class: "issues-filter-row",
	role: "tablist",
	"aria-label": "Filter issues by state"
}, kl = ["aria-selected", "onClick"], Al = { class: "count" }, jl = { class: "issues-search" }, Ml = {
	key: 0,
	class: "issues-query-chips",
	"data-smoke": "issues-query-chips",
	"aria-label": "Parsed search filters"
}, Nl = ["title"], Pl = {
	key: 1,
	class: "issues-assignee-filter",
	"data-smoke": "issues-assignee-filter"
}, Fl = ["data-author-kind", "title"], Il = { class: "author-glyph" }, Ll = {
	key: 2,
	class: "issues-project-filter",
	"data-smoke": "issues-project-filter"
}, Rl = ["title"], zl = ["data-busy"], Bl = ["placeholder", "disabled"], Vl = {
	key: 0,
	class: "quick-add-status"
}, Hl = ["title"], Ul = {
	key: 2,
	class: "quick-add-chip tone-yellow",
	title: "closeOnMerge=false — opt-out from PR auto-close reactor"
}, Wl = ["title"], Gl = {
	key: 0,
	class: "quick-add-error",
	role: "alert"
}, Kl = {
	key: 1,
	class: "issues-bulk-bar",
	"data-smoke": "issues-bulk-bar"
}, ql = { class: "count" }, Jl = ["disabled"], Yl = { class: "bulk-reproject" }, Xl = ["disabled"], Zl = ["value"], Ql = ["disabled"], $l = {
	key: 2,
	class: "quick-add-error",
	role: "alert"
}, eu = {
	key: 3,
	class: "muted"
}, tu = {
	key: 4,
	class: "muted error",
	role: "alert"
}, nu = {
	key: 5,
	class: "muted"
}, ru = ["href"], iu = {
	key: 6,
	class: "muted"
}, au = {
	key: 7,
	class: "issues-list",
	role: "listbox",
	"aria-label": "Issue list"
}, ou = ["aria-selected", "onMouseenter"], su = ["href"], cu = { class: "issues-row-number" }, lu = { class: "issues-row-body" }, uu = { class: "issues-row-title" }, du = { class: "issues-row-meta" }, fu = ["title", "onClick"], pu = [
	"data-author-kind",
	"title",
	"onClick"
], mu = { class: "author-glyph" }, hu = ["data-author-kind"], gu = { class: "author-glyph" }, _u = {
	key: 0,
	class: "author-badge"
}, vu = {
	key: 1,
	class: "author-badge"
}, yu = {
	key: 2,
	class: "author-badge"
}, bu = { class: "issues-row-age" }, xu = /* @__PURE__ */ mc(/* @__PURE__ */ Bn({
	__name: "IssuesList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issues: { type: [Array, null] },
		workspaceId: {
			default: Ys,
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
		], r = /* @__PURE__ */ L("idle"), i = /* @__PURE__ */ L(null), a = /* @__PURE__ */ L(t.issues ?? []), o = /* @__PURE__ */ L("OPEN"), s = /* @__PURE__ */ L(""), c = /* @__PURE__ */ L(0), l = /* @__PURE__ */ L(""), u = /* @__PURE__ */ L(""), d = /* @__PURE__ */ L(/* @__PURE__ */ new Set()), f = /* @__PURE__ */ L(!1), p = /* @__PURE__ */ L(null);
		function m(e) {
			let t = new Set(d.value);
			t.has(e) ? t.delete(e) : t.add(e), d.value = t;
		}
		function h() {
			d.value = /* @__PURE__ */ new Set(), p.value = null;
		}
		async function g() {
			if (d.value.size === 0 || f.value || !ee.value) return;
			let e = ee.value, t = Array.from(d.value);
			f.value = !0, p.value = null;
			try {
				let n = await Promise.allSettled(t.map((t) => Vs(e, t))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
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
		let _ = /* @__PURE__ */ L([]);
		tr(async () => {
			try {
				_.value = await _s();
			} catch {
				_.value = [];
			}
		});
		async function v(e) {
			if (d.value.size === 0 || f.value) return;
			let t = Array.from(d.value);
			f.value = !0, p.value = null;
			try {
				let n = await Promise.allSettled(t.map((t) => Us(t, e))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
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
		function y(e) {
			let t = e.target;
			if (!t) return;
			let n = t.value, r = n === "__NONE__" ? null : n || null;
			t.value = "", n !== "" && v(r);
		}
		let b = /* @__PURE__ */ L(""), x = /* @__PURE__ */ L(!1), S = /* @__PURE__ */ L(null), C = /* @__PURE__ */ L({
			defaultLabels: [],
			closeOnMerge: null,
			ownerRefs: []
		}), w = /* @__PURE__ */ L(!1), T = Q(() => {
			let e = t.issues ?? a.value;
			return t.projectName ? e.filter((e) => e.projectName === t.projectName) : e;
		}), ee = Q(() => t.client ?? t.comtryaClient), te = Q(() => {
			let e = $s(), n = new URLSearchParams({ workspaceId: t.workspaceId });
			return t.repositoryId && n.set("repositoryId", t.repositoryId), t.projectName && n.set("projectName", t.projectName), `${e}?${n.toString()}`;
		}), E = (e, t) => t === "ALL" ? !0 : t === "OPEN" ? e.state === "OPEN" || e.state === "REOPENED" : e.state === "CLOSED", ne = [
			"is",
			"assignee",
			"project"
		], D = {
			open: "OPEN",
			closed: "CLOSED",
			reopened: "OPEN",
			all: "ALL"
		}, re = Q(() => ps(s.value, ne)), ie = Q(() => {
			for (let e of re.value.filters.is ?? []) {
				let t = D[e.toLowerCase()];
				if (t) return t;
			}
			return o.value;
		}), O = Q(() => {
			for (let e of re.value.filters.assignee ?? []) if (e.startsWith("comtrya://")) return e;
			return l.value;
		}), ae = Q(() => {
			if (t.projectName) return "";
			for (let e of re.value.filters.project ?? []) if (e.trim()) return e.trim();
			return u.value;
		}), k = Q(() => {
			let e = re.value.text.trim().toLowerCase(), t = O.value, n = ae.value, r = ie.value;
			return T.value.filter((e) => E(e, r)).filter((e) => n ? e.projectName === n : !0).filter((e) => t ? (e.assignees ?? []).includes(t) : !0).filter((t) => {
				if (!e) return !0;
				let n = (t.authorRef ?? "").split("/").pop() ?? "";
				return `${t.number} ${t.title} ${n}`.toLowerCase().includes(e);
			});
		}), oe = Q(() => {
			let e = [];
			for (let t of re.value.filters.is ?? []) {
				let n = D[t.toLowerCase()];
				e.push({
					key: "is",
					value: t,
					label: n ? `is · ${n.toLowerCase()}` : `is · ${t}`,
					tone: "is"
				});
			}
			for (let t of re.value.filters.assignee ?? []) {
				let n = $(t);
				e.push({
					key: "assignee",
					value: t,
					label: `→ ${n.label}`,
					tone: "assignee"
				});
			}
			for (let t of re.value.filters.project ?? []) e.push({
				key: "project",
				value: t,
				label: `◇ ${t}`,
				tone: "project"
			});
			for (let t of re.value.unknown) e.push({
				key: t,
				value: "",
				label: `unknown · ${t}:`,
				tone: "unknown"
			});
			return e;
		});
		function se(e) {
			l.value === e ? l.value = "" : l.value = e;
		}
		function ce() {
			l.value = "";
		}
		function le(e) {
			u.value === e ? u.value = "" : u.value = e;
		}
		function ue() {
			u.value = "";
		}
		let de = Q(() => t.projectName ? `New issue in ${t.projectName}…` : "New issue…"), fe = Q(() => {
			let e = {
				OPEN: 0,
				CLOSED: 0,
				ALL: T.value.length
			};
			for (let t of T.value) (t.state === "OPEN" || t.state === "REOPENED") && (e.OPEN += 1), t.state === "CLOSED" && (e.CLOSED += 1);
			return e;
		});
		function pe(e) {
			if (!e) return "";
			let t = Date.parse(e);
			if (Number.isNaN(t)) return e;
			let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
		}
		let me = new Set([
			"OPEN",
			"CLOSED",
			"ALL"
		]);
		function he() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = (e.get("state") ?? "").toUpperCase();
			me.has(t) && (o.value = t);
			let n = e.get("q");
			n !== null && (s.value = n);
			let r = e.get("assignee") ?? "";
			l.value = r.startsWith("comtrya://") ? r : "";
			let i = e.get("project") ?? "";
			u.value = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(i) ? i : "";
		}
		function ge() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			o.value === "OPEN" ? e.delete("state") : e.set("state", o.value);
			let n = s.value.trim();
			n ? e.set("q", n) : e.delete("q"), l.value ? e.set("assignee", l.value) : e.delete("assignee"), u.value && !t.projectName ? e.set("project", u.value) : e.delete("project");
			let r = e.toString(), i = `${window.location.pathname}${r ? `?${r}` : ""}${window.location.hash}`;
			i !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", i);
		}
		let _e = !1;
		tr(() => {
			_e = !0, he(), _e = !1, Se(), xe(), window.addEventListener("popstate", ve);
		}), ar(() => {
			window.removeEventListener("popstate", ve);
		});
		function ve() {
			_e = !0, he(), mn(() => {
				_e = !1;
			});
		}
		B([
			o,
			s,
			l,
			u
		], () => {
			_e || ge();
		}), fs({
			j: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, k.value.length - 1));
			},
			ArrowDown: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, k.value.length - 1));
			},
			k: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			ArrowUp: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			Enter: (e) => {
				let t = k.value[c.value];
				t && (e.preventDefault(), window.location.href = Qs(t));
			},
			" ": (e) => {
				let t = k.value[c.value];
				t && (e.preventDefault(), m(t.id));
			},
			Escape: (e) => {
				d.value.size !== 0 && (e.preventDefault(), h());
			},
			"/": (e) => {
				e.preventDefault(), document.querySelector("[data-issues-search]")?.focus();
			},
			c: (e) => {
				e.preventDefault(), Ce();
			},
			...Object.fromEntries(n.map((e) => [e.key, (t) => {
				t.preventDefault(), o.value = e.id;
			}]))
		});
		function ye(e) {
			s.value &&= (e.preventDefault(), "");
		}
		function be(e) {
			e.preventDefault(), b.value = "", S.value = null, e.target?.blur();
		}
		B(() => [
			ee.value,
			t.issues,
			t.workspaceId,
			t.repositoryId,
			t.state
		], () => void Se()), B(() => t.projectName, () => void xe()), B(k, (e) => {
			c.value >= e.length && (c.value = Math.max(0, e.length - 1));
		});
		async function xe() {
			if (!t.projectName) {
				C.value = {
					defaultLabels: [],
					closeOnMerge: null,
					ownerRefs: []
				}, w.value = !0;
				return;
			}
			C.value = await bc(t.projectName, "location"), w.value = !0;
		}
		async function Se() {
			if (t.issues) {
				a.value = t.issues, r.value = t.issues.length > 0 ? "ready" : "empty", i.value = null;
				return;
			}
			if (!ee.value) {
				a.value = [], r.value = "error", i.value = "issues: no client";
				return;
			}
			r.value = "loading", i.value = null;
			try {
				let e = await Ls(ee.value, {
					workspaceId: t.workspaceId,
					repositoryId: t.repositoryId,
					state: t.state
				});
				a.value = e, r.value = e.length > 0 ? "ready" : "empty";
			} catch (e) {
				a.value = [], r.value = "error", i.value = e instanceof Error ? e.message : String(e);
			}
		}
		function Ce() {
			document.querySelector("[data-smoke=\"issues-quick-add\"]")?.focus();
		}
		async function M() {
			let e = b.value.trim();
			if (!(!e || x.value)) {
				x.value = !0, S.value = null;
				try {
					let n = await Bs({
						workspaceId: t.workspaceId,
						repositoryId: t.repositoryId,
						projectName: t.projectName ?? null,
						title: e,
						bodyMarkdown: "",
						labels: C.value.defaultLabels,
						closeOnMerge: C.value.closeOnMerge,
						assignees: C.value.ownerRefs
					});
					a.value.some((e) => e.id === n.id) || (a.value = [n, ...a.value]), b.value = "", r.value = "ready", Se(), mn(Ce);
				} catch (e) {
					S.value = e instanceof Error ? e.message : String(e);
				} finally {
					x.value = !1;
				}
			}
		}
		return (a, m) => (G(), K("section", Cl, [
			q("header", wl, [
				q("div", Tl, [q("h2", null, j(e.title), 1), e.showNewLink ? (G(), K("a", {
					key: 0,
					href: te.value,
					class: "issues-new"
				}, "+ new", 8, El)) : X("", !0)]),
				q("div", Dl, [q("div", Ol, [(G(), K(W, null, V(n, (e) => q("button", {
					key: e.id,
					type: "button",
					role: "tab",
					"aria-selected": o.value === e.id,
					class: A(["issues-filter", { active: o.value === e.id }]),
					onClick: (t) => o.value = e.id
				}, [
					q("span", null, j(e.label), 1),
					q("span", Al, j(fe.value[e.id]), 1),
					q("kbd", null, j(e.key), 1)
				], 10, kl)), 64))]), q("label", jl, [Dn(q("input", {
					"data-issues-search": "",
					"onUpdate:modelValue": m[0] ||= (e) => s.value = e,
					type: "search",
					placeholder: "Filter — try is:open · project:<name> · assignee:<urn> · text",
					autocomplete: "off",
					onKeydown: ho(ye, ["esc"])
				}, null, 544), [[oo, s.value]]), m[2] ||= q("kbd", null, "/", -1)])]),
				oe.value.length > 0 ? (G(), K("div", Ml, [(G(!0), K(W, null, V(oe.value, (e) => (G(), K("span", {
					key: `${e.key}:${e.value || "unknown"}`,
					class: A(["query-chip", `tone-${e.tone}`]),
					title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
				}, j(e.label), 11, Nl))), 128)), m[3] ||= q("span", { class: "query-chips-hint" }, [
					Y(" syntax: "),
					q("code", null, "is:open"),
					Y(" · "),
					q("code", null, "project:<name>"),
					Y(" · "),
					q("code", null, "assignee:<urn>")
				], -1)])) : X("", !0),
				l.value ? (G(), K("div", Pl, [
					m[4] ||= q("span", { class: "prefix" }, "assigned to", -1),
					q("span", {
						class: "active-chip",
						"data-author-kind": R($)(l.value).kind,
						title: l.value
					}, [q("span", Il, j(R($)(l.value).glyph), 1), Y(" " + j(R($)(l.value).label), 1)], 8, Fl),
					q("button", {
						type: "button",
						class: "clear",
						onClick: ce,
						"aria-label": "Clear assignee filter"
					}, " clear ✕ ")
				])) : X("", !0),
				u.value && !t.projectName ? (G(), K("div", Ll, [
					m[6] ||= q("span", { class: "prefix" }, "project", -1),
					q("span", {
						class: "active-chip",
						title: `Scoped to project ${u.value}`
					}, [m[5] ||= q("span", { class: "project-glyph" }, "◇", -1), Y(" " + j(u.value), 1)], 8, Rl),
					q("button", {
						type: "button",
						class: "clear",
						onClick: ue,
						"aria-label": "Clear project filter"
					}, " clear ✕ ")
				])) : X("", !0)
			]),
			q("form", {
				class: "issues-quick-add",
				"data-busy": x.value ? "true" : "false",
				onSubmit: po(M, ["prevent"])
			}, [
				m[7] ||= q("span", {
					class: "quick-add-glyph",
					"aria-hidden": "true"
				}, "+", -1),
				Dn(q("input", {
					"onUpdate:modelValue": m[1] ||= (e) => b.value = e,
					"data-smoke": "issues-quick-add",
					type: "text",
					autocomplete: "off",
					placeholder: de.value,
					disabled: x.value,
					onKeydown: ho(be, ["esc"])
				}, null, 40, Bl), [[oo, b.value]]),
				x.value ? (G(), K("span", Vl, "opening…")) : C.value.defaultLabels.length > 0 ? (G(), K("span", {
					key: 1,
					class: "quick-add-chip tone-teal",
					title: `Labels will be pre-stamped: ${C.value.defaultLabels.join(", ")}`
				}, " labels · " + j(C.value.defaultLabels.join(", ")), 9, Hl)) : X("", !0),
				C.value.closeOnMerge === !1 ? (G(), K("span", Ul, "closeOnMerge · off")) : X("", !0),
				C.value.ownerRefs.length > 0 ? (G(), K("span", {
					key: 3,
					class: "quick-add-chip tone-teal",
					title: `Assigned on create: ${C.value.ownerRefs.join(", ")}`
				}, "→ " + j(C.value.ownerRefs.map((e) => e.split("/").pop()).join(" · ")), 9, Wl)) : X("", !0),
				m[8] ||= q("span", { class: "quick-add-hint" }, [
					q("kbd", null, "↵"),
					Y(" create · "),
					q("kbd", null, "esc"),
					Y(" clear · "),
					q("kbd", null, "c"),
					Y(" focus ")
				], -1)
			], 40, zl),
			S.value ? (G(), K("p", Gl, j(S.value), 1)) : X("", !0),
			d.value.size > 0 ? (G(), K("div", Kl, [
				q("span", ql, j(d.value.size) + " selected", 1),
				q("button", {
					type: "button",
					class: "bulk-action",
					disabled: f.value,
					onClick: g
				}, j(f.value ? "closing…" : `close ${d.value.size}`), 9, Jl),
				q("label", Yl, [m[11] ||= q("span", { class: "bulk-reproject-label" }, "reproject →", -1), q("select", {
					class: "bulk-reproject-select",
					"data-smoke": "issues-bulk-reproject",
					disabled: f.value,
					onChange: y
				}, [
					m[9] ||= q("option", {
						value: "",
						disabled: "",
						selected: ""
					}, "pick project…", -1),
					m[10] ||= q("option", { value: "__NONE__" }, "— no project —", -1),
					(G(!0), K(W, null, V(_.value, (e) => (G(), K("option", {
						key: e.name,
						value: e.name ?? ""
					}, "◇ " + j(e.name), 9, Zl))), 128))
				], 40, Xl)]),
				q("button", {
					type: "button",
					class: "bulk-clear",
					disabled: f.value,
					onClick: h
				}, [...m[12] ||= [Y("clear ", -1), q("kbd", null, "esc", -1)]], 8, Ql),
				m[13] ||= q("span", { class: "hint" }, [q("kbd", null, "space"), Y(" toggle row ")], -1)
			])) : X("", !0),
			p.value ? (G(), K("p", $l, j(p.value), 1)) : X("", !0),
			r.value === "loading" ? (G(), K("p", eu, "Loading issues…")) : r.value === "error" ? (G(), K("p", tu, j(i.value), 1)) : T.value.length === 0 ? (G(), K("p", nu, [
				m[14] ||= Y(" No issues yet. ", -1),
				q("a", { href: te.value }, "Create one", 8, ru),
				m[15] ||= Y(" to get started. ", -1)
			])) : k.value.length === 0 ? (G(), K("p", iu, " No issues match the current filter. ")) : (G(), K("ol", au, [(G(!0), K(W, null, V(k.value, (t, n) => (G(), K("li", {
				key: t.id,
				class: A(["issues-row", {
					focused: n === c.value,
					selected: d.value.has(t.id)
				}]),
				role: "option",
				"aria-selected": n === c.value,
				onMouseenter: (e) => c.value = n
			}, [q("a", {
				href: R(Qs)(t),
				class: "issues-row-link"
			}, [
				q("span", cu, "#" + j(t.number), 1),
				q("span", lu, [q("span", uu, j(t.title), 1), q("span", du, [
					q("span", { class: A(["issue-state", R(ec)(t.state).className]) }, j(R(ec)(t.state).label), 3),
					t.projectName ? (G(), K("button", {
						key: 0,
						type: "button",
						class: A(["issue-project", { active: u.value === t.projectName }]),
						title: `${t.projectName}\nClick to filter by this project`,
						onClick: po((e) => le(t.projectName), ["prevent", "stop"])
					}, [m[16] ||= q("span", { class: "project-glyph" }, "◇", -1), Y(" " + j(t.projectName), 1)], 10, fu)) : X("", !0),
					(G(!0), K(W, null, V(t.labels ?? [], (t) => (G(), ji(R(Ss), {
						key: t,
						name: t,
						catalog: e.labelCatalog
					}, null, 8, ["name", "catalog"]))), 128)),
					(G(!0), K(W, null, V(t.assignees ?? [], (e) => (G(), K("button", {
						key: `assignee-${e}`,
						type: "button",
						class: A(["issue-assignee", { active: l.value === e }]),
						"data-author-kind": R($)(e).kind,
						title: `${e}\nClick to filter by this assignee`,
						onClick: po((t) => se(e), ["prevent", "stop"])
					}, [q("span", mu, j(R($)(e).glyph), 1), Y(" " + j(R($)(e).label), 1)], 10, pu))), 128)),
					t.authorRef ? (G(), K("span", {
						key: 1,
						class: "issue-author",
						"data-author-kind": R($)(t.authorRef).kind
					}, [
						q("span", gu, j(R($)(t.authorRef).glyph), 1),
						Y(" " + j(R($)(t.authorRef).label) + " ", 1),
						R($)(t.authorRef).kind === "agent" ? (G(), K("span", _u, "agent")) : R($)(t.authorRef).kind === "credential" ? (G(), K("span", vu, "bot")) : R($)(t.authorRef).kind === "bot" ? (G(), K("span", yu, "bot")) : X("", !0)
					], 8, hu)) : X("", !0)
				])]),
				q("span", bu, j(pe(t.createdAt)), 1)
			], 8, su)], 42, ou))), 128))])),
			m[17] ||= zi("<footer class=\"issues-foot\" data-v-96e9f064><span data-v-96e9f064><kbd data-v-96e9f064>j</kbd> <kbd data-v-96e9f064>k</kbd> navigate · <kbd data-v-96e9f064>↵</kbd> open · <kbd data-v-96e9f064>/</kbd> search · <kbd data-v-96e9f064>c</kbd> create · <kbd data-v-96e9f064>o</kbd> open <kbd data-v-96e9f064>x</kbd> closed <kbd data-v-96e9f064>a</kbd> all </span></footer>", 1)
		]));
	}
}), [["styles", [".issues-queue[data-v-96e9f064]{font-family:var(--sans,system-ui);color:var(--ink,#111);gap:14px;display:grid}.issues-queue-head[data-v-96e9f064]{gap:12px;display:grid}.head-row[data-v-96e9f064]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.issues-queue-head h2[data-v-96e9f064]{font-family:var(--display,system-ui);margin:0;font-size:22px;line-height:1}.issues-new[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border:1.5px solid var(--ink,#111);padding:6px 12px;font-size:12px;text-decoration:none}.issues-controls[data-v-96e9f064]{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;display:flex}.issues-query-chips[data-v-96e9f064]{font-family:var(--mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;font-size:11px;display:flex}.issues-query-chips .query-chip[data-v-96e9f064]{letter-spacing:.02em;white-space:nowrap;border:1px solid;align-items:center;padding:1px 7px;display:inline-flex}.issues-query-chips .query-chip.tone-is[data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.issues-query-chips .query-chip.tone-assignee[data-v-96e9f064]{color:var(--ink,#111)}.issues-query-chips .query-chip.tone-project[data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issues-query-chips .query-chip.tone-unknown[data-v-96e9f064]{color:var(--accent-yellow,#c89300);border-style:dashed}.issues-query-chips .query-chips-hint[data-v-96e9f064]{color:var(--ink-faint,#68645c);letter-spacing:0;margin-left:4px}.issues-query-chips .query-chips-hint code[data-v-96e9f064]{font-family:var(--mono,monospace);background:var(--paper-tint,#f2efe7);color:var(--ink-soft,#2c2b28);padding:0 4px;font-size:11px}.issues-assignee-filter[data-v-96e9f064]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-items:center;gap:8px;margin-top:8px;padding:6px 10px;font-size:11px;display:inline-flex}.issues-assignee-filter .prefix[data-v-96e9f064]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.issues-assignee-filter .active-chip[data-v-96e9f064]{color:var(--ink,#111);border:1px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.issues-assignee-filter .active-chip[data-author-kind=agent][data-v-96e9f064]{color:#6b3fa0}.issues-assignee-filter .active-chip[data-author-kind=credential][data-v-96e9f064]{color:var(--accent-yellow,#c89300)}.issues-assignee-filter .active-chip[data-author-kind=bot][data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issues-assignee-filter .active-chip[data-author-kind=team][data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.issues-project-filter[data-v-96e9f064]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-items:center;gap:8px;margin-top:8px;padding:6px 10px;font-size:11px;display:inline-flex}.issues-project-filter .prefix[data-v-96e9f064]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.issues-project-filter .active-chip[data-v-96e9f064]{color:var(--accent-blue,#1d55a6);border:1px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.issues-project-filter .project-glyph[data-v-96e9f064]{font-size:10px}.issues-project-filter .clear[data-v-96e9f064]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.issues-project-filter .clear[data-v-96e9f064]:hover{color:var(--ink,#111)}.issues-assignee-filter .author-glyph[data-v-96e9f064]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.issues-assignee-filter .clear[data-v-96e9f064]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.issues-assignee-filter .clear[data-v-96e9f064]:hover{color:var(--ink,#111)}.issues-quick-add[data-v-96e9f064]{border:1.5px solid var(--rule-light,#d8d1c4);background:var(--paper,#fffdf8);align-items:center;gap:8px;padding:6px 10px 6px 6px;transition:border-color .12s;display:flex}.issues-quick-add[data-v-96e9f064]:focus-within{border-color:var(--ink,#111)}.issues-quick-add[data-busy=true][data-v-96e9f064]{opacity:.85;border-style:dashed}.quick-add-glyph[data-v-96e9f064]{width:22px;height:22px;font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border:1px solid;border-radius:2px;place-items:center;font-size:13px;display:inline-grid}.issues-quick-add input[data-v-96e9f064]{min-width:0;color:inherit;font-family:var(--display,system-ui);background:0 0;border:0;outline:none;flex:1;padding:4px 0;font-size:15px}.issues-quick-add input[data-v-96e9f064]::placeholder{color:var(--ink-fainter,#918b80);font-style:italic}.quick-add-status[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.quick-add-chip[data-v-96e9f064]{font-family:var(--mono,monospace);letter-spacing:.02em;white-space:nowrap;border:1px solid;align-items:center;padding:1px 6px;font-size:10.5px;display:inline-flex}.quick-add-chip.tone-teal[data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.quick-add-chip.tone-yellow[data-v-96e9f064]{color:var(--accent-yellow,#c89300)}.quick-add-hint[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-fainter,#918b80);white-space:nowrap;font-size:10.5px}.quick-add-hint kbd[data-v-96e9f064]{font-family:var(--mono,monospace);border:1px solid;padding:0 4px;font-size:10px}.quick-add-error[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--accent-err,#c9341c);margin:-6px 0 0;font-size:11px}.issues-filter-row[data-v-96e9f064]{border:1.5px solid var(--ink,#111);flex-wrap:wrap;gap:4px;display:inline-flex}.issues-filter[data-v-96e9f064]{color:inherit;cursor:pointer;font-family:var(--mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;display:inline-flex}.issues-filter[data-v-96e9f064]:not(:last-child){border-right:1px solid var(--rule-light,#d8d1c4)}.issues-filter.active[data-v-96e9f064]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.issues-filter .count[data-v-96e9f064]{color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums}.issues-filter.active .count[data-v-96e9f064]{color:var(--paper-tint,#f2efe7)}.issues-filter kbd[data-v-96e9f064]{font-family:var(--mono,monospace);opacity:.6;border:1px solid;padding:0 4px;font-size:10px}.issues-search[data-v-96e9f064]{border:1.5px solid var(--ink,#111);flex:240px;align-items:center;gap:8px;min-width:240px;max-width:420px;padding:4px 10px;display:inline-flex}.issues-search input[data-v-96e9f064]{color:inherit;font:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0}.issues-search kbd[data-v-96e9f064]{border:1px solid var(--ink,#111);font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);padding:0 4px;font-size:10px}.muted[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border-top:1.5px solid var(--rule-light,#d8d1c4);padding:18px 0;font-size:13px}.muted.error[data-v-96e9f064]{color:var(--accent-err,#c9341c)}.issues-list[data-v-96e9f064]{border-top:1.5px solid var(--ink,#111);margin:0;padding:0;list-style:none;display:grid}.issues-row[data-v-96e9f064]{border-bottom:1px solid var(--rule-light,#d8d1c4);position:relative}.issues-row.focused[data-v-96e9f064]{background:var(--paper-tint,#f2efe7)}.issues-row.selected[data-v-96e9f064]{background:var(--paper-tint,#f2efe7);box-shadow:inset 3px 0 0 var(--ink,#111)}.issues-row.selected.focused[data-v-96e9f064]{background:var(--paper-tint,#f2efe7);box-shadow:inset 3px 0 0 var(--accent-teal,#087f6f)}.issues-bulk-bar[data-v-96e9f064]{z-index:5;border:1.5px solid var(--ink,#111);background:var(--ink,#111);color:var(--paper,#fffdf8);font-family:var(--mono,monospace);align-items:center;gap:12px;margin:8px 0;padding:8px 12px;font-size:12px;display:flex;position:sticky;top:0}.issues-bulk-bar .count[data-v-96e9f064]{letter-spacing:.02em;font-weight:600}.issues-bulk-bar .bulk-action[data-v-96e9f064]{border:1px solid var(--paper,#fffdf8);color:var(--paper,#fffdf8);font-family:var(--mono,monospace);cursor:pointer;letter-spacing:.02em;text-transform:lowercase;background:0 0;padding:4px 10px;font-size:11px}.issues-bulk-bar .bulk-action[data-v-96e9f064]:hover:not(:disabled){background:var(--paper,#fffdf8);color:var(--ink,#111)}.issues-bulk-bar .bulk-action[data-v-96e9f064]:disabled{opacity:.5;cursor:wait}.issues-bulk-bar .bulk-reproject[data-v-96e9f064]{align-items:center;gap:6px;display:inline-flex}.issues-bulk-bar .bulk-reproject-label[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--paper-tint,#f2efe7);letter-spacing:.04em;font-size:11px}.issues-bulk-bar .bulk-reproject-select[data-v-96e9f064]{border:1px solid var(--paper-tint,#f2efe7);color:var(--paper,#fffdf8);font-family:var(--mono,monospace);cursor:pointer;background:0 0;outline:none;padding:2px 6px;font-size:11px}.issues-bulk-bar .bulk-reproject-select[data-v-96e9f064]:disabled{opacity:.5;cursor:wait}.issues-bulk-bar .bulk-reproject-select option[data-v-96e9f064]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.issues-bulk-bar .bulk-clear[data-v-96e9f064]{color:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 4px;font-size:11px}.issues-bulk-bar .bulk-clear kbd[data-v-96e9f064]{border:1px solid;margin-left:4px;padding:0 4px;font-size:10px}.issues-bulk-bar .hint[data-v-96e9f064]{color:var(--paper-tint,#f2efe7);letter-spacing:.04em;font-size:10.5px}.issues-bulk-bar .hint kbd[data-v-96e9f064]{border:1px solid;padding:0 4px;font-size:10px}.issues-row-link[data-v-96e9f064]{color:inherit;grid-template-columns:56px 1fr auto;align-items:baseline;gap:14px;padding:12px 12px 12px 6px;text-decoration:none;display:grid}.issues-row-link[data-v-96e9f064]:hover{background:var(--paper-tint,#f2efe7);text-decoration:none}.issues-row-number[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);text-align:right;font-variant-numeric:tabular-nums;font-size:12px}.issues-row-body[data-v-96e9f064]{gap:4px;min-width:0;display:grid}.issues-row-title[data-v-96e9f064]{font-family:var(--display,system-ui);text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;overflow:hidden}.issues-row-meta[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);flex-wrap:wrap;align-items:baseline;gap:10px;font-size:12px;display:flex}.issue-state[data-v-96e9f064]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 6px;font-size:11px}.issue-state.issue-state-open[data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.issue-state.issue-state-closed[data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issue-project[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--accent-blue,#1d55a6);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px solid;align-items:center;gap:4px;padding:0 6px;display:inline-flex}.issue-project[data-v-96e9f064]:hover{background:var(--paper-tint,#f2efe7)}.issue-project.active[data-v-96e9f064]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-color:var(--ink,#111)}.issue-project .project-glyph[data-v-96e9f064]{font-size:10px}.issue-label[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--accent-teal,#087f6f);letter-spacing:.02em;border:1px solid;padding:0 5px;font-size:10px}.issue-author[data-v-96e9f064]{font-family:var(--mono,monospace);align-items:center;gap:5px;font-size:12px;display:inline-flex}.issue-author .author-glyph[data-v-96e9f064]{width:14px;height:14px;color:var(--ink-faint,#68645c);border:1px solid;place-items:center;font-size:10px;font-weight:700;display:inline-grid}.issue-author[data-author-kind=agent][data-v-96e9f064]{color:#6b3fa0}.issue-author[data-author-kind=credential][data-v-96e9f064]{color:var(--accent-yellow,#c89300)}.issue-author[data-author-kind=bot][data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issue-author .author-badge[data-v-96e9f064]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.issue-assignee[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px dashed;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.issue-assignee[data-v-96e9f064]:hover{background:var(--paper-tint,#f2efe7)}.issue-assignee.active[data-v-96e9f064]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-color:var(--ink,#111)}.issue-assignee.active .author-glyph[data-v-96e9f064]{color:inherit}.issue-assignee .author-glyph[data-v-96e9f064]{width:12px;height:12px;color:inherit;border:0;place-items:center;font-size:9px;font-weight:700;display:inline-grid}.issue-assignee[data-author-kind=agent][data-v-96e9f064]{color:#6b3fa0}.issue-assignee[data-author-kind=credential][data-v-96e9f064]{color:var(--accent-yellow,#c89300)}.issue-assignee[data-author-kind=bot][data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issue-assignee[data-author-kind=team][data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.issues-row-age[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);white-space:nowrap;font-size:12px}.issues-foot[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.issues-foot kbd[data-v-96e9f064]{font-family:var(--mono,monospace);border:1px solid;padding:0 4px;font-size:10px}"]], ["__scopeId", "data-v-96e9f064"]]), Su = /* @__PURE__ */ new Map();
function Cu(e) {
	return [
		e.id,
		e.number,
		e.title,
		e.state
	].join("|");
}
function wu(e, t) {
	let n = [];
	return n.push(ss({
		id: `ext_issues.open.${e.id}`,
		title: `Open issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: () => {
			window.location.href = Qs(e);
		}
	})), e.state === "OPEN" || e.state === "REOPENED" ? n.push(ss({
		id: `ext_issues.close.${e.id}`,
		title: `Close issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: async () => {
			await Vs(t, e.id);
		}
	})) : e.state === "CLOSED" && n.push(ss({
		id: `ext_issues.reopen.${e.id}`,
		title: `Reopen issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: async () => {
			await Hs(t, e.id);
		}
	})), () => n.forEach((e) => e());
}
async function Tu(e, t) {
	let n;
	try {
		n = await Ls(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_issues] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = Cu(t), i = Su.get(t.id);
		i && i.signature === n || (i?.unregister(), Su.set(t.id, {
			signature: n,
			unregister: wu(t, e)
		}));
	}
	for (let [e, t] of Su) r.has(e) || (t.unregister(), Su.delete(e));
}
function Eu(e) {
	let t = Ys;
	Tu(e, t);
	let n = [
		"dev.comtrya.issues.opened",
		"dev.comtrya.issues.closed",
		"dev.comtrya.issues.reopened"
	].map((n) => Lo({
		type: n,
		onEvent: () => {
			Tu(e, t);
		},
		onError: () => {}
	}));
	return () => {
		for (let e of n) e();
		for (let e of Su.values()) e.unregister();
		Su.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/register.ts
var Du = "ext_issues", Ou = "comtrya-issue-card", ku = "comtrya-issues-list", Au = "comtrya-issues-repo-list", ju = "comtrya-issue-detail", Mu = "comtrya-issue-relationships", Nu = "comtrya-issue-new";
Cs({
	tagName: Ou,
	component: hc,
	propertyAliases: { ref: "resourceRef" }
}), Cs({
	tagName: ku,
	component: xu
}), Cs({
	tagName: Au,
	component: xu
}), Cs({
	tagName: ju,
	component: ol
}), Cs({
	tagName: Mu,
	component: Sl
}), Fu();
var Pu = {
	id: Du,
	setup(e) {
		e.registerCard({
			resourceKind: "issue",
			element: Ou,
			requiredPermission: "issues.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "issue",
			loadTargets: async (t) => (await Ls(e.client, {
				workspaceId: t.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
				repositoryId: t.repositoryId
			})).map((e) => ({
				ref: Xs(e),
				kind: "issue",
				title: `#${e.number} ${e.title}`,
				subtitle: e.state.toLowerCase()
			}))
		}), e.registerWidget({
			id: "issues-list",
			element: ku,
			defaultSlot: "repository.main",
			defaultPriority: 100,
			requiredPermission: "issues.read"
		}), e.registerRoute("/", {
			element: ku,
			requiredPermission: "issues.read"
		}), e.registerRoute("/new", {
			element: Nu,
			requiredPermission: "issues.write"
		}), e.registerRoute("/:workspaceId/:number", {
			element: ju,
			requiredPermission: "issues.read"
		}), Eu(e.client);
	}
};
function Fu() {
	if (typeof customElements > "u" || customElements.get(Nu)) return;
	class e extends HTMLElement {
		routeParams;
		workspaceId;
		repositoryId;
		connectedCallback() {
			this.replaceChildren(Lu(Iu(this.routeParams, this)));
		}
	}
	customElements.define(Nu, e);
}
function Iu(e, t = {}) {
	let n = new URLSearchParams(window.location.search);
	return {
		workspaceId: n.get("workspaceId") ?? t.workspaceId ?? e?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
		repositoryId: n.get("repositoryId") ?? t.repositoryId ?? e?.params?.repositoryId ?? null,
		projectName: n.get("projectName") ?? t.projectName ?? e?.params?.projectName ?? null
	};
}
function Lu(e) {
	Vu();
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
	let o = Ru("Title"), s = document.createElement("input");
	s.required = !0, s.placeholder = "What needs to be done?", o.append(s);
	let c = Ru("Project", "Stamps the Project on this issue and pulls its CUE policy."), l = document.createElement("select");
	l.className = "issue-new-project-select", l.dataset.smoke = "issue-new-project";
	let u = document.createElement("option");
	u.value = "", u.textContent = "— no project —", l.append(u), c.append(l);
	let d = Ru("Description", "Optional. Supports Markdown."), f = document.createElement("textarea");
	f.rows = 6, f.placeholder = "Add context, repro steps, links…", d.append(f);
	let p = Ru("Labels"), m = document.createElement("input");
	m.placeholder = "comma-separated", m.dataset.smoke = "issue-new-labels", p.append(m);
	let h = document.createElement("p");
	h.className = "issue-new-hint", h.hidden = !0, p.append(h);
	let g = document.createElement("div");
	g.className = "issue-new-policy", g.hidden = !0, g.dataset.smoke = "issue-new-policy";
	let _ = null, v = [];
	function y(e) {
		if (!e) {
			v.length > 0 && m.value.trim() && (m.value = Hu(m.value).filter((e) => !v.includes(e)).join(", ")), v = [], h.hidden = !0, h.textContent = "", g.hidden = !0, g.replaceChildren(), _ = null, r.textContent = "Issue";
			return;
		}
		r.textContent = `${e} · issue`, bc(e, "referrer").then((t) => {
			let n = Hu(m.value).filter((e) => !v.includes(e)), r = [], i = /* @__PURE__ */ new Set();
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
	_s().then((t) => {
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
		t.preventDefault(), x.disabled = !0, S.hidden = !0, Bs({
			workspaceId: e.workspaceId,
			repositoryId: e.repositoryId,
			projectName: l.value || null,
			title: s.value.trim(),
			bodyMarkdown: f.value,
			labels: Hu(m.value),
			closeOnMerge: _
		}).then((e) => {
			window.location.assign(Qs(e));
		}).catch((e) => {
			S.textContent = e instanceof Error ? e.message : String(e), S.hidden = !1, x.disabled = !1;
		});
	}), t.append(n, a), t;
}
function Ru(e, t) {
	let n = document.createElement("div");
	n.className = "issue-new-field";
	let r = document.createElement("label");
	if (r.className = "issue-new-label", r.textContent = e, n.append(r), t) {
		let e = document.createElement("span");
		e.className = "issue-new-hint", e.textContent = t, n.append(e);
	}
	return n;
}
var zu = "comtrya-issue-new-styles", Bu = "\n.issue-new {\n  display: grid;\n  gap: 24px;\n  max-width: 720px;\n  font-family: var(--sans, system-ui);\n  color: var(--ink, #111);\n}\n.issue-new-head {\n  display: grid;\n  gap: 6px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 14px;\n}\n.issue-new-overline {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #68645c);\n}\n.issue-new h1 {\n  margin: 0;\n  font-family: var(--display, system-ui);\n  font-size: 36px;\n  line-height: 1;\n}\n.issue-new-form {\n  display: grid;\n  gap: 18px;\n}\n.issue-new-field {\n  display: grid;\n  gap: 6px;\n}\n.issue-new-label {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #68645c);\n}\n.issue-new-hint {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-fainter, #918b80);\n}\n.issue-new input,\n.issue-new textarea,\n.issue-new select {\n  width: 100%;\n  border: 1.5px solid var(--rule-light, #d8d1c4);\n  background: var(--paper, #fffdf8);\n  color: var(--ink, #111);\n  padding: 10px 12px;\n  font-family: var(--mono, monospace);\n  font-size: 13px;\n  outline: none;\n  transition: border-color 120ms ease;\n}\n.issue-new input:focus,\n.issue-new textarea:focus,\n.issue-new select:focus {\n  border-color: var(--ink, #111);\n}\n.issue-new textarea {\n  resize: vertical;\n  font-family: var(--mono, monospace);\n}\n.issue-new-policy {\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  flex-wrap: wrap;\n  border: 1px dashed var(--rule-light, #d8d1c4);\n  padding: 8px 12px;\n  background: var(--paper-tint, #f2efe7);\n}\n.issue-new-chip {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  border: 1px solid currentColor;\n  padding: 1px 6px;\n}\n.issue-new-chip.chip-on {\n  color: var(--accent-teal, #087f6f);\n}\n.issue-new-chip.chip-off {\n  color: var(--accent-yellow, #c89300);\n}\n.issue-new-chip-detail {\n  font-family: var(--sans, system-ui);\n  font-size: 12px;\n  color: var(--ink-soft, #2c2b28);\n}\n.issue-new-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding-top: 4px;\n}\n.issue-new-submit {\n  border: 1.5px solid var(--ink, #111);\n  background: var(--ink, #111);\n  color: var(--paper, #fffdf8);\n  padding: 10px 18px;\n  font-family: var(--display, system-ui);\n  font-weight: 600;\n  font-size: 13px;\n  cursor: pointer;\n}\n.issue-new-submit:disabled {\n  background: var(--ink-faint, #68645c);\n  cursor: wait;\n}\n.issue-new-error {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--accent-err, #c9341c);\n}\n";
function Vu() {
	if (typeof document > "u" || document.getElementById(zu)) return;
	let e = document.createElement("style");
	e.id = zu, e.textContent = Bu, document.head.appendChild(e);
}
function Hu(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e.split(",")) {
		let e = r.trim();
		e && (t.has(e) || (t.add(e), n.push(e)));
	}
	return n;
}
//#endregion
export { Pu as default };
