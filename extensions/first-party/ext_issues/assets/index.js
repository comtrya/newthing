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
}, te = /-\w/g, E = T((e) => e.replace(te, (e) => e.slice(1).toUpperCase())), ne = /\B([A-Z])/g, D = T((e) => e.replace(ne, "-$1").toLowerCase()), re = T((e) => e.charAt(0).toUpperCase() + e.slice(1)), ie = T((e) => e ? `on${re(e)}` : ""), O = (e, t) => !Object.is(e, t), ae = (e, ...t) => {
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
	let t = /* @__PURE__ */ I(e);
	return t === e ? t : (P(t, "iterate", Qe), /* @__PURE__ */ F(e) ? t : t.map(L));
}
function tt(e) {
	return P(e = /* @__PURE__ */ I(e), "iterate", Qe), e;
}
function nt(e, t) {
	return /* @__PURE__ */ zt(e) ? Ht(/* @__PURE__ */ Rt(e) ? L(t) : t) : L(t);
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
	return r !== e && !/* @__PURE__ */ F(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var at = Array.prototype;
function ot(e, t, n, r, i, a) {
	let o = tt(e), s = o !== e && !/* @__PURE__ */ F(e), c = o[t];
	if (c !== at[t]) {
		let t = c.apply(e, a);
		return s ? L(t) : t;
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
	let i = tt(e), a = i !== e && !/* @__PURE__ */ F(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = nt(e, t)), n.call(this, t, nt(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? nt(e, c) : c;
}
function ct(e, t, n) {
	let r = /* @__PURE__ */ I(e);
	P(r, "iterate", Qe);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ Bt(n[0]) ? (n[0] = /* @__PURE__ */ I(n[0]), r[t](...n)) : i;
}
function lt(e, t, n = []) {
	He(), Me();
	let r = (/* @__PURE__ */ I(e))[t].apply(e, n);
	return Ne(), Ue(), r;
}
var ut = /* @__PURE__ */ e("__proto__,__v_isRef,__isVue"), dt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(_));
function ft(e) {
	_(e) || (e = String(e));
	let t = /* @__PURE__ */ I(this);
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
		let o = Reflect.get(e, t, /* @__PURE__ */ R(e) ? e : n);
		if ((_(t) ? dt.has(t) : ut(t)) || (r || P(e, "get", t), i)) return o;
		if (/* @__PURE__ */ R(o)) {
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
			if (!/* @__PURE__ */ F(n) && !/* @__PURE__ */ zt(n) && (i = /* @__PURE__ */ I(i), n = /* @__PURE__ */ I(n)), !a && /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : u(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ R(e) ? e : r);
		return e === /* @__PURE__ */ I(r) && (o ? O(n, i) && $e(e, "set", t, n, i) : $e(e, "add", t, n)), s;
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
		let i = this.__v_raw, a = /* @__PURE__ */ I(i), o = f(a), c = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, u = i[e](...r), d = n ? yt : t ? Ht : L;
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
			let r = this.__v_raw, i = /* @__PURE__ */ I(r), a = /* @__PURE__ */ I(n);
			e || (O(n, a) && P(i, "get", n), P(i, "get", a));
			let { has: o } = bt(i), s = t ? yt : e ? Ht : L;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && P(/* @__PURE__ */ I(t), "iterate", Xe), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ I(n), i = /* @__PURE__ */ I(t);
			return e || (O(t, i) && P(r, "has", t), P(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ I(a), s = t ? yt : e ? Ht : L;
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
			let n = /* @__PURE__ */ I(this), r = bt(n), i = /* @__PURE__ */ I(e), a = !t && !/* @__PURE__ */ F(e) && !/* @__PURE__ */ zt(e) ? i : e;
			return r.has.call(n, a) || O(e, a) && r.has.call(n, e) || O(i, a) && r.has.call(n, i) || (n.add(a), $e(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ F(n) && !/* @__PURE__ */ zt(n) && (n = /* @__PURE__ */ I(n));
			let r = /* @__PURE__ */ I(this), { has: i, get: a } = bt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ I(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? O(n, s) && $e(r, "set", e, n, s) : $e(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ I(this), { has: n, get: r } = bt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ I(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && $e(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ I(this), t = e.size !== 0, n = e.clear();
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
function F(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function Bt(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function I(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ I(t) : e;
}
function Vt(e) {
	return !u(e, "__v_skip") && Object.isExtensible(e) && k(e, "__v_skip", !0), e;
}
var L = (e) => v(e) ? /* @__PURE__ */ Pt(e) : e, Ht = (e) => v(e) ? /* @__PURE__ */ It(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function R(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function z(e) {
	return Ut(e, !1);
}
function Ut(e, t) {
	return /* @__PURE__ */ R(e) ? e : new Wt(e, t);
}
var Wt = class {
	constructor(e, t) {
		this.dep = new qe(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ I(e), this._value = t ? e : L(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ F(e) || /* @__PURE__ */ zt(e);
		e = n ? e : /* @__PURE__ */ I(e), O(e, t) && (this._rawValue = e, this._value = n ? e : L(e), this.dep.trigger());
	}
};
function Gt(e) {
	return /* @__PURE__ */ R(e) ? e.value : e;
}
var Kt = {
	get: (e, t, n) => t === "__v_raw" ? e : Gt(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function qt(e) {
	return /* @__PURE__ */ Rt(e) ? e : new Proxy(e, Kt);
}
var Jt = class {
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
function Yt(e, t, n = !1) {
	let r, i;
	return h(e) ? r = e : (r = e.get, i = e.set), new Jt(r, i, n);
}
var Xt = {}, Zt = /* @__PURE__ */ new WeakMap(), Qt = void 0;
function $t(e, t = !1, n = Qt) {
	if (n) {
		let t = Zt.get(n);
		t || Zt.set(n, t = []), t.push(e);
	}
}
function en(e, n, i = t) {
	let { immediate: a, deep: o, once: s, scheduler: l, augmentJob: u, call: f } = i, p = (e) => o ? e : /* @__PURE__ */ F(e) || o === !1 || o === 0 ? tn(e, 1) : tn(e), m, g, _, v, y = !1, b = !1;
	if (/* @__PURE__ */ R(e) ? (g = () => e.value, y = /* @__PURE__ */ F(e)) : /* @__PURE__ */ Rt(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some((e) => /* @__PURE__ */ Rt(e) || /* @__PURE__ */ F(e)), g = () => e.map((e) => {
		if (/* @__PURE__ */ R(e)) return e.value;
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
		let t = Qt;
		Qt = m;
		try {
			return f ? f(e, 3, [v]) : e(v);
		} finally {
			Qt = t;
		}
	} : r, n && o) {
		let e = g, t = o === !0 ? Infinity : o;
		g = () => tn(e(), t);
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
	let C = b ? Array(e.length).fill(Xt) : Xt, w = (e) => {
		if (!(!(m.flags & 1) || !m.dirty && !e)) if (n) {
			let e = m.run();
			if (o || y || (b ? e.some((e, t) => O(e, C[t])) : O(e, C))) {
				_ && _();
				let t = Qt;
				Qt = m;
				try {
					let t = [
						e,
						C === Xt ? void 0 : b && C[0] === Xt ? [] : C,
						v
					];
					C = e, f ? f(n, 3, t) : n(...t);
				} finally {
					Qt = t;
				}
			}
		} else m.run();
	};
	return u && u(w), m = new De(g), m.scheduler = l ? () => l(w, !1) : w, v = (e) => $t(e, !1, m), _ = m.onStop = () => {
		let e = Zt.get(m);
		if (e) {
			if (f) f(e, 4);
			else for (let t of e) t();
			Zt.delete(m);
		}
	}, n ? a ? w(!0) : C = m.run() : l ? l(w.bind(null, !0), !0) : m.run(), S.pause = m.pause.bind(m), S.resume = m.resume.bind(m), S.stop = S, S;
}
function tn(e, t = Infinity, n) {
	if (t <= 0 || !v(e) || e.__v_skip || (n ||= /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t)) return e;
	if (n.set(e, t), t--, /* @__PURE__ */ R(e)) tn(e.value, t, n);
	else if (d(e)) for (let r = 0; r < e.length; r++) tn(e[r], t, n);
	else if (p(e) || f(e)) e.forEach((e) => {
		tn(e, t, n);
	});
	else if (C(e)) {
		for (let r in e) tn(e[r], t, n);
		for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && tn(e[r], t, n);
	}
	return e;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.34/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function nn(e, t, n, r) {
	try {
		return r ? e(...r) : e();
	} catch (e) {
		an(e, t, n);
	}
}
function rn(e, t, n, r) {
	if (h(e)) {
		let i = nn(e, t, n, r);
		return i && y(i) && i.catch((e) => {
			an(e, t, n);
		}), i;
	}
	if (d(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(rn(e[a], t, n, r));
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
			He(), nn(o, null, 10, [
				e,
				i,
				a
			]), Ue();
			return;
		}
	}
	on(e, r, a, i, s);
}
function on(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var B = [], sn = -1, cn = [], ln = null, un = 0, dn = /* @__PURE__ */ Promise.resolve(), fn = null;
function pn(e) {
	let t = fn || dn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function mn(e) {
	let t = sn + 1, n = B.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = B[r], a = bn(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function hn(e) {
	if (!(e.flags & 1)) {
		let t = bn(e), n = B[B.length - 1];
		!n || !(e.flags & 2) && t >= bn(n) ? B.push(e) : B.splice(mn(t), 0, e), e.flags |= 1, gn();
	}
}
function gn() {
	fn ||= dn.then(xn);
}
function _n(e) {
	d(e) ? cn.push(...e) : ln && e.id === -1 ? ln.splice(un + 1, 0, e) : e.flags & 1 || (cn.push(e), e.flags |= 1), gn();
}
function vn(e, t, n = sn + 1) {
	for (; n < B.length; n++) {
		let t = B[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			B.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function yn(e) {
	if (cn.length) {
		let e = [...new Set(cn)].sort((e, t) => bn(e) - bn(t));
		if (cn.length = 0, ln) {
			ln.push(...e);
			return;
		}
		for (ln = e, un = 0; un < ln.length; un++) {
			let e = ln[un];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		ln = null, un = 0;
	}
}
var bn = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function xn(e) {
	try {
		for (sn = 0; sn < B.length; sn++) {
			let e = B[sn];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), nn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; sn < B.length; sn++) {
			let e = B[sn];
			e && (e.flags &= -2);
		}
		sn = -1, B.length = 0, yn(e), fn = null, (B.length || cn.length) && xn(e);
	}
}
var V = null, Sn = null;
function Cn(e) {
	let t = V;
	return V = e, Sn = e && e.type.__scopeId || null, t;
}
function wn(e, t = V, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && Di(-1);
		let i = Cn(t), a;
		try {
			a = e(...n);
		} finally {
			Cn(i), r._d && Di(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function Tn(e, n) {
	if (V === null) return e;
	let r = ca(V), i = e.dirs ||= [];
	for (let e = 0; e < n.length; e++) {
		let [a, o, s, c = t] = n[e];
		a && (h(a) && (a = {
			mounted: a,
			updated: a
		}), a.deep && tn(o), i.push({
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
function En(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (He(), rn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), Ue());
	}
}
function Dn(e, t) {
	if (Q) {
		let n = Q.provides, r = Q.parent && Q.parent.provides;
		r === n && (n = Q.provides = Object.create(r)), n[e] = t;
	}
}
function On(e, t, n = !1) {
	let r = qi();
	if (r || Mr) {
		let i = Mr ? Mr._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t;
	}
}
var kn = /* @__PURE__ */ Symbol.for("v-scx"), An = () => On(kn);
function H(e, t, n) {
	return jn(e, t, n);
}
function jn(e, n, i = t) {
	let { immediate: a, deep: o, flush: c, once: l } = i, u = s({}, i), d = n && a || !n && c !== "post", f;
	if ($i) {
		if (c === "sync") {
			let e = An();
			f = e.__watcherHandles ||= [];
		} else if (!d) {
			let e = () => {};
			return e.stop = r, e.resume = r, e.pause = r, e;
		}
	}
	let p = Q;
	u.call = (e, t, n) => rn(e, p, t, n);
	let m = !1;
	c === "post" ? u.scheduler = (e) => {
		W(e, p && p.suspense);
	} : c !== "sync" && (m = !0, u.scheduler = (e, t) => {
		t ? e() : hn(e);
	}), u.augmentJob = (e) => {
		n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p));
	};
	let h = en(e, n, u);
	return $i && (f ? f.push(h) : d && h()), h;
}
function Mn(e, t, n) {
	let r = this.proxy, i = g(e) ? e.includes(".") ? Nn(r, e) : () => r[e] : e.bind(r, r), a;
	h(t) ? a = t : (a = t.handler, n = t);
	let o = Xi(this), s = jn(i, a.bind(r), n);
	return o(), s;
}
function Nn(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var Pn = /* @__PURE__ */ Symbol("_vte"), Fn = (e) => e.__isTeleport, In = /* @__PURE__ */ Symbol("_leaveCb");
function Ln(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, Ln(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function Rn(e, t) {
	return h(e) ? s({ name: e.name }, t, { setup: e }) : e;
}
function zn(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function Bn(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var Vn = /* @__PURE__ */ new WeakMap();
function Hn(e, n, r, a, o = !1) {
	if (d(e)) {
		e.forEach((e, t) => Hn(e, n && (d(n) ? n[t] : n), r, a, o));
		return;
	}
	if (Wn(a) && !o) {
		a.shapeFlag & 512 && a.type.__asyncResolved && a.component.subTree.component && Hn(e, n, r, a.component.subTree);
		return;
	}
	let s = a.shapeFlag & 4 ? ca(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ I(v), b = v === t ? i : (e) => Bn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Bn(_, t));
	if (m != null && m !== p) {
		if (Un(n), g(m)) _[m] = null, b(m) && (v[m] = null);
		else if (/* @__PURE__ */ R(m)) {
			let e = n;
			x(m, e.k) && (m.value = null), e.k && (_[e.k] = null);
		}
	}
	if (h(p)) nn(p, f, 12, [l, _]);
	else {
		let t = g(p), n = /* @__PURE__ */ R(p);
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
					i(), Vn.delete(e);
				};
				t.id = -1, Vn.set(e, t), W(t, r);
			} else Un(e), i();
		}
	}
}
function Un(e) {
	let t = Vn.get(e);
	t && (t.flags |= 8, Vn.delete(e));
}
le().requestIdleCallback, le().cancelIdleCallback;
var Wn = (e) => !!e.type.__asyncLoader, Gn = (e) => e.type.__isKeepAlive;
function Kn(e, t) {
	Jn(e, "a", t);
}
function qn(e, t) {
	Jn(e, "da", t);
}
function Jn(e, t, n = Q) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (Xn(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) Gn(e.parent.vnode) && Yn(r, t, n, e), e = e.parent;
	}
}
function Yn(e, t, n, r) {
	let i = Xn(t, e, r, !0);
	rr(() => {
		c(r[t], i);
	}, n);
}
function Xn(e, t, n = Q, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			He();
			let i = Xi(n), a = rn(t, n, e, r);
			return i(), Ue(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Zn = (e) => (t, n = Q) => {
	(!$i || e === "sp") && Xn(e, (...e) => t(...e), n);
}, Qn = Zn("bm"), $n = Zn("m"), er = Zn("bu"), tr = Zn("u"), nr = Zn("bum"), rr = Zn("um"), ir = Zn("sp"), ar = Zn("rtg"), or = Zn("rtc");
function sr(e, t = Q) {
	Xn("ec", e, t);
}
var cr = /* @__PURE__ */ Symbol.for("v-ndc");
function lr(e, t, n, r) {
	let i, a = n && n[r], o = d(e);
	if (o || g(e)) {
		let n = o && /* @__PURE__ */ Rt(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ F(e), s = /* @__PURE__ */ zt(e), e = tt(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Ht(L(e[n])) : L(e[n]) : e[n], n, void 0, a && a[n]);
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
var ur = (e) => e ? Qi(e) ? ca(e) : ur(e.parent) : null, dr = /* @__PURE__ */ s(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => ur(e.parent),
	$root: (e) => ur(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => br(e),
	$forceUpdate: (e) => e.f ||= () => {
		hn(e.update);
	},
	$nextTick: (e) => e.n ||= pn.bind(e.proxy),
	$watch: (e) => Mn.bind(e)
}), fr = (e, n) => e !== t && !e.__isScriptSetup && u(e, n), pr = {
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
			else if (fr(i, n)) return s[n] = 1, i[n];
			else if (a !== t && u(a, n)) return s[n] = 2, a[n];
			else if (u(o, n)) return s[n] = 3, o[n];
			else if (r !== t && u(r, n)) return s[n] = 4, r[n];
			else hr && (s[n] = 0);
		}
		let d = dr[n], f, p;
		if (d) return n === "$attrs" && P(e.attrs, "get", ""), d(e);
		if ((f = c.__cssModules) && (f = f[n])) return f;
		if (r !== t && u(r, n)) return s[n] = 4, r[n];
		if (p = l.config.globalProperties, u(p, n)) return p[n];
	},
	set({ _: e }, n, r) {
		let { data: i, setupState: a, ctx: o } = e;
		return fr(a, n) ? (a[n] = r, !0) : i !== t && u(i, n) ? (i[n] = r, !0) : u(e.props, n) || n[0] === "$" && n.slice(1) in e ? !1 : (o[n] = r, !0);
	},
	has({ _: { data: e, setupState: n, accessCache: r, ctx: i, appContext: a, props: o, type: s } }, c) {
		let l;
		return !!(r[c] || e !== t && c[0] !== "$" && u(e, c) || fr(n, c) || u(o, c) || u(i, c) || u(dr, c) || u(a.config.globalProperties, c) || (l = s.__cssModules) && l[c]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? u(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function mr(e) {
	return d(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var hr = !0;
function gr(e) {
	let t = br(e), n = e.proxy, i = e.ctx;
	hr = !1, t.beforeCreate && vr(t.beforeCreate, e, "bc");
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: ee, renderTracked: T, renderTriggered: te, errorCaptured: E, serverPrefetch: ne, expose: D, inheritAttrs: re, components: ie, directives: O, filters: ae } = t;
	if (u && _r(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Pt(t));
	}
	if (hr = !0, o) for (let e in o) {
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
	if (c) for (let e in c) yr(c[e], i, n, e);
	if (l) {
		let e = h(l) ? l.call(n) : l;
		Reflect.ownKeys(e).forEach((t) => {
			Dn(t, e[t]);
		});
	}
	f && vr(f, e, "c");
	function k(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (k(Qn, p), k($n, m), k(er, g), k(tr, _), k(Kn, y), k(qn, b), k(sr, E), k(or, T), k(ar, te), k(nr, S), k(rr, w), k(ir, ne), d(D)) if (D.length) {
		let t = e.exposed ||= {};
		D.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	ee && e.render === r && (e.render = ee), re != null && (e.inheritAttrs = re), ie && (e.components = ie), O && (e.directives = O), ne && zn(e);
}
function _r(e, t, n = r) {
	d(e) && (e = Tr(e));
	for (let n in e) {
		let r = e[n], i;
		i = v(r) ? "default" in r ? On(r.from || n, r.default, !0) : On(r.from || n) : On(r), /* @__PURE__ */ R(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function vr(e, t, n) {
	rn(d(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function yr(e, t, n, r) {
	let i = r.includes(".") ? Nn(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && H(i, n);
	} else if (h(e)) H(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => yr(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && H(i, r, e);
	}
}
function br(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => xr(c, e, o, !0)), xr(c, t, o)), v(t) && a.set(t, c), c;
}
function xr(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && xr(e, a, n, !0), i && i.forEach((t) => xr(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = Sr[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var Sr = {
	data: Cr,
	props: Dr,
	emits: Dr,
	methods: Er,
	computed: Er,
	beforeCreate: U,
	created: U,
	beforeMount: U,
	mounted: U,
	beforeUpdate: U,
	updated: U,
	beforeDestroy: U,
	beforeUnmount: U,
	destroyed: U,
	unmounted: U,
	activated: U,
	deactivated: U,
	errorCaptured: U,
	serverPrefetch: U,
	components: Er,
	directives: Er,
	watch: Or,
	provide: Cr,
	inject: wr
};
function Cr(e, t) {
	return t ? e ? function() {
		return s(h(e) ? e.call(this, this) : e, h(t) ? t.call(this, this) : t);
	} : t : e;
}
function wr(e, t) {
	return Er(Tr(e), Tr(t));
}
function Tr(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function U(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function Er(e, t) {
	return e ? s(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Dr(e, t) {
	return e ? d(e) && d(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : s(/* @__PURE__ */ Object.create(null), mr(e), mr(t ?? {})) : t;
}
function Or(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = s(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = U(e[r], t[r]);
	return n;
}
function kr() {
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
var Ar = 0;
function jr(e, t) {
	return function(n, r = null) {
		h(n) || (n = s({}, n)), r != null && !v(r) && (r = null);
		let i = kr(), a = /* @__PURE__ */ new WeakSet(), o = [], c = !1, l = i.app = {
			_uid: Ar++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: ua,
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
					let u = l._ceVNode || X(n, r);
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, ca(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				c && (rn(o, l._instance, 16), e(null, l._container), delete l._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, l;
			},
			runWithContext(e) {
				let t = Mr;
				Mr = l;
				try {
					return e();
				} finally {
					Mr = t;
				}
			}
		};
		return l;
	};
}
var Mr = null, Nr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${E(t)}Modifiers`] || e[`${D(t)}Modifiers`];
function Pr(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && Nr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(oe)));
	let c, l = i[c = ie(n)] || i[c = ie(E(n))];
	!l && o && (l = i[c = ie(D(n))]), l && rn(l, e, 6, a);
	let u = i[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, rn(u, e, 6, a);
	}
}
var Fr = /* @__PURE__ */ new WeakMap();
function Ir(e, t, n = !1) {
	let r = n ? Fr : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, c = !1;
	if (!h(e)) {
		let r = (e) => {
			let n = Ir(e, t, !0);
			n && (c = !0, s(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !c ? (v(e) && r.set(e, null), null) : (d(a) ? a.forEach((e) => o[e] = null) : s(o, a), v(e) && r.set(e, o), o);
}
function Lr(e, t) {
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, D(t)) || u(e, t));
}
function Rr(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: s, attrs: c, emit: l, render: u, renderCache: d, props: f, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = Cn(e), v, y;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			v = zi(u.call(t, e, d, f, m, p, h)), y = c;
		} else {
			let e = t;
			v = zi(e.length > 1 ? e(f, {
				attrs: c,
				slots: s,
				emit: l
			}) : e(f, null)), y = t.props ? c : zr(c);
		}
	} catch (t) {
		wi.length = 0, an(t, e, 1), v = X(Si);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = Br(y, a)), b = Ii(b, y, !1, !0));
	}
	return n.dirs && (b = Ii(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && Ln(b, n.transition), v = b, Cn(_), v;
}
var zr = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || a(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, Br = (e, t) => {
	let n = {};
	for (let r in e) (!o(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function Vr(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? Hr(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (Ur(o, r, n) && !Lr(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? Hr(r, o, l) : !0 : !!o;
	return !1;
}
function Hr(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (Ur(t, e, a) && !Lr(n, a)) return !0;
	}
	return !1;
}
function Ur(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && v(r) && v(i) ? !ye(r, i) : r !== i;
}
function Wr({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var Gr = {}, Kr = () => Object.create(Gr), qr = (e) => Object.getPrototypeOf(e) === Gr;
function Jr(e, t, n, r = !1) {
	let i = {}, a = Kr();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), Xr(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ Ft(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Yr(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ I(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (Lr(e.emitsOptions, o)) continue;
				let d = t[o];
				if (c) if (u(a, o)) d !== a[o] && (a[o] = d, l = !0);
				else {
					let t = E(o);
					i[t] = Zr(c, s, t, d, e, !1);
				}
				else d !== a[o] && (a[o] = d, l = !0);
			}
		}
	} else {
		Xr(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !u(t, a) && ((r = D(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Zr(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !u(t, e)) && (delete a[e], l = !0);
	}
	l && $e(e.attrs, "set", "");
}
function Xr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (ee(t)) continue;
		let l = n[t], d;
		a && u(a, d = E(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : Lr(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ I(r), i = c || t;
		for (let t = 0; t < o.length; t++) {
			let s = o[t];
			r[s] = Zr(a, n, s, i[s], e, !u(i, s));
		}
	}
	return s;
}
function Zr(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = u(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && h(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = Xi(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === D(n)) && (r = !0));
	}
	return r;
}
var Qr = /* @__PURE__ */ new WeakMap();
function $r(e, r, i = !1) {
	let a = i ? Qr : r.propsCache, o = a.get(e);
	if (o) return o;
	let c = e.props, l = {}, f = [], p = !1;
	if (!h(e)) {
		let t = (e) => {
			p = !0;
			let [t, n] = $r(e, r, !0);
			s(l, t), n && f.push(...n);
		};
		!i && r.mixins.length && r.mixins.forEach(t), e.extends && t(e.extends), e.mixins && e.mixins.forEach(t);
	}
	if (!c && !p) return v(e) && a.set(e, n), n;
	if (d(c)) for (let e = 0; e < c.length; e++) {
		let n = E(c[e]);
		ei(n) && (l[n] = t);
	}
	else if (c) for (let e in c) {
		let t = E(e);
		if (ei(t)) {
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
function ei(e) {
	return e[0] !== "$" && !ee(e);
}
var ti = (e) => e === "_" || e === "_ctx" || e === "$stable", ni = (e) => d(e) ? e.map(zi) : [zi(e)], ri = (e, t, n) => {
	if (t._n) return t;
	let r = wn((...e) => ni(t(...e)), n);
	return r._c = !1, r;
}, ii = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (ti(n)) continue;
		let i = e[n];
		if (h(i)) t[n] = ri(n, i, r);
		else if (i != null) {
			let e = ni(i);
			t[n] = () => e;
		}
	}
}, ai = (e, t) => {
	let n = ni(t);
	e.slots.default = () => n;
}, oi = (e, t, n) => {
	for (let r in t) (n || !ti(r)) && (e[r] = t[r]);
}, si = (e, t, n) => {
	let r = e.slots = Kr();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (oi(r, t, n), n && k(r, "_", e, !0)) : ii(t, r);
	} else t && ai(e, t);
}, ci = (e, n, r) => {
	let { vnode: i, slots: a } = e, o = !0, s = t;
	if (i.shapeFlag & 32) {
		let e = n._;
		e ? r && e === 1 ? o = !1 : oi(a, n, r) : (o = !n.$stable, ii(n, a)), s = n;
	} else n && (ai(e, n), s = { default: 1 });
	if (o) for (let e in a) !ti(e) && s[e] == null && delete a[e];
}, W = bi;
function li(e) {
	return ui(e);
}
function ui(e, i) {
	let a = le();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !ji(e, t) && (r = ve(e), me(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case xi:
				y(e, t, n, r);
				break;
			case Si:
				b(e, t, n, r);
				break;
			case Ci:
				e ?? x(t, n, r, o);
				break;
			case G:
				ie(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? O(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, xe);
		}
		u != null && i ? Hn(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && Hn(e.ref, null, a, e, !0);
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
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && E(e.children, d, null, r, i, di(e, a), s, u), _ && En(e, null, r, "created"), te(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !ee(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Ui(f, r, e);
		}
		_ && En(e, null, r, "beforeMount");
		let v = pi(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && W(() => {
			try {
				f && Ui(f, r, e), v && g.enter(d), _ && En(e, null, r, "mounted");
			} finally {}
		}, i);
	}, te = (e, t, n, r, i) => {
		if (n && g(e, n), r) for (let t = 0; t < r.length; t++) g(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || yi(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				te(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, E = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? Bi(e[l]) : zi(e[l]), t, n, r, i, a, o, s);
	}, ne = (e, n, r, i, a, o, s) => {
		let l = n.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = n;
		u |= e.patchFlag & 16;
		let m = e.props || t, h = n.props || t, g;
		if (r && fi(r, !1), (g = h.onVnodeBeforeUpdate) && Ui(g, r, n, e), f && En(n, e, r, "beforeUpdate"), r && fi(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? D(e.dynamicChildren, d, l, r, i, di(n, a), o) : s || ue(e, n, l, null, r, i, di(n, a), o, !1), u > 0) {
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
		((g = h.onVnodeUpdated) || f) && W(() => {
			g && Ui(g, r, n, e), f && En(n, e, r, "updated");
		}, i);
	}, D = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === G || !ji(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
		}
	}, re = (e, n, r, i, a) => {
		if (n !== r) {
			if (n !== t) for (let t in n) !ee(t) && !(t in r) && c(e, t, n[t], null, a, i);
			for (let t in r) {
				if (ee(t)) continue;
				let o = r[t], s = n[t];
				o !== s && t !== "value" && c(e, t, s, o, a, i);
			}
			"value" in r && c(e, "value", n.value, r.value, a);
		}
	}, ie = (e, t, n, r, i, a, s, c, l) => {
		let d = t.el = e ? e.el : u(""), f = t.anchor = e ? e.anchor : u(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), E(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (D(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && mi(e, t, !0)) : ue(e, t, n, f, i, a, s, c, l);
	}, O = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : k(t, n, r, i, a, o, c) : oe(e, t, c);
	}, k = (e, t, n, r, i, a, o) => {
		let s = e.component = Ki(e, r, i);
		if (Gn(e) && (s.ctx.renderer = xe), ea(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, se, o), !e.el) {
				let r = s.subTree = X(Si);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else se(s, e, t, n, i, a, o);
	}, oe = (e, t, n) => {
		let r = t.component = e.component;
		if (Vr(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			ce(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, se = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = gi(e);
					if (n) {
						t && (t.el = c.el, ce(e, t, o)), n.asyncDep.then(() => {
							W(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				fi(e, !1), t ? (t.el = c.el, ce(e, t, o)) : t = c, n && ae(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Ui(d, s, t, c), fi(e, !0);
				let f = Rr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ve(p), e, i, a), t.el = f.el, u === null && Wr(e, f.el), r && W(r, i), (d = t.props && t.props.onVnodeUpdated) && W(() => Ui(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Wn(t);
				if (fi(e, !1), l && ae(l), !m && (o = c && c.onVnodeBeforeMount) && Ui(o, d, t), fi(e, !0), s && Se) {
					let t = () => {
						e.subTree = Rr(e), Se(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Rr(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && W(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					W(() => Ui(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Wn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && W(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new De(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => hn(u), fi(e, !0), l();
	}, ce = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Yr(e, t.props, r, n), ci(e, t.children, n), He(), vn(e), Ue();
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
			let n = t[p] = l ? Bi(t[p]) : zi(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? _e(e, a, o, !0, !1, f) : E(t, r, i, a, o, s, c, l, f);
	}, fe = (e, t, r, i, a, o, s, c, l) => {
		let u = 0, d = t.length, f = e.length - 1, p = d - 1;
		for (; u <= f && u <= p;) {
			let n = e[u], i = t[u] = l ? Bi(t[u]) : zi(t[u]);
			if (ji(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			u++;
		}
		for (; u <= f && u <= p;) {
			let n = e[f], i = t[p] = l ? Bi(t[p]) : zi(t[p]);
			if (ji(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			f--, p--;
		}
		if (u > f) {
			if (u <= p) {
				let e = p + 1, n = e < d ? t[e].el : i;
				for (; u <= p;) v(null, t[u] = l ? Bi(t[u]) : zi(t[u]), r, n, a, o, s, c, l), u++;
			}
		} else if (u > p) for (; u <= f;) me(e[u], a, o, !0), u++;
		else {
			let m = u, h = u, g = /* @__PURE__ */ new Map();
			for (u = h; u <= p; u++) {
				let e = t[u] = l ? Bi(t[u]) : zi(t[u]);
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
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && ji(n, t[_])) {
					i = _;
					break;
				}
				i === void 0 ? me(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++);
			}
			let w = x ? hi(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || vi(f) : i;
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
		if (c === G) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) pe(u[e], t, n, r);
			o(e.anchor, t, n);
			return;
		}
		if (c === Ci) {
			S(e, t, n);
			return;
		}
		if (r !== 2 && d & 1 && l) if (r === 0) l.beforeEnter(a), o(a, t, n), W(() => l.enter(a), i);
		else {
			let { leave: r, delayLeave: i, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? s(a) : o(a, t, n);
			}, d = () => {
				a._isLeaving && a[In](!0), r(a, () => {
					u(), c && c();
				});
			};
			i ? i(a, u, d) : d();
		}
		else o(a, t, n);
	}, me = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (He(), Hn(s, null, n, e, !0), Ue()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Wn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Ui(_, t, e), u & 6) ge(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && En(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, xe, r) : l && !l.hasOnce && (a !== G || d > 0 && d & 64) ? _e(l, t, n, !1, !0) : (a === G && d & 384 || !i && u & 16) && _e(c, t, n), r && A(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && W(() => {
			_ && Ui(_, t, e), h && En(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, A = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === G) {
			he(n, r);
			return;
		}
		if (t === Ci) {
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
		_i(c), _i(l), r && ae(r), i.stop(), a && (a.flags |= 8, me(o, e, t, n)), s && W(s, t), W(() => {
			e.isUnmounted = !0;
		}, t);
	}, _e = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) me(e[o], t, n, r, i);
	}, ve = (e) => {
		if (e.shapeFlag & 6) return ve(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[Pn];
		return n ? h(n) : t;
	}, ye = !1, be = (e, t, n) => {
		let r;
		e == null ? t._vnode && (me(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, ye ||= (ye = !0, vn(r), yn(), !1);
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
		createApp: jr(be, j)
	};
}
function di({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function fi({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function pi(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function mi(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (d(r) && d(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Bi(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && mi(t, a)), a.type === xi && (a.patchFlag === -1 && (a = i[e] = Bi(a)), a.el = t.el), a.type === Si && !a.el && (a.el = t.el);
	}
}
function hi(e) {
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
function gi(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : gi(t);
}
function _i(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function vi(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? vi(t.subTree) : null;
}
var yi = (e) => e.__isSuspense;
function bi(e, t) {
	t && t.pendingBranch ? d(e) ? t.effects.push(...e) : t.effects.push(e) : _n(e);
}
var G = /* @__PURE__ */ Symbol.for("v-fgt"), xi = /* @__PURE__ */ Symbol.for("v-txt"), Si = /* @__PURE__ */ Symbol.for("v-cmt"), Ci = /* @__PURE__ */ Symbol.for("v-stc"), wi = [], K = null;
function q(e = !1) {
	wi.push(K = e ? null : []);
}
function Ti() {
	wi.pop(), K = wi[wi.length - 1] || null;
}
var Ei = 1;
function Di(e, t = !1) {
	Ei += e, e < 0 && K && t && (K.hasOnce = !0);
}
function Oi(e) {
	return e.dynamicChildren = Ei > 0 ? K || n : null, Ti(), Ei > 0 && K && K.push(e), e;
}
function J(e, t, n, r, i, a) {
	return Oi(Y(e, t, n, r, i, a, !0));
}
function ki(e, t, n, r, i) {
	return Oi(X(e, t, n, r, i, !0));
}
function Ai(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function ji(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Mi = ({ key: e }) => e ?? null, Ni = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ R(e) || h(e) ? {
	i: V,
	r: e,
	k: t,
	f: !!n
} : e);
function Y(e, t = null, n = null, r = 0, i = null, a = e === G ? 0 : 1, o = !1, s = !1) {
	let c = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e,
		props: t,
		key: t && Mi(t),
		ref: t && Ni(t),
		scopeId: Sn,
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
		ctx: V
	};
	return s ? (Vi(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Ei > 0 && !o && K && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && K.push(c), c;
}
var X = Pi;
function Pi(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === cr) && (e = Si), Ai(e)) {
		let r = Ii(e, t, !0);
		return n && Vi(r, n), Ei > 0 && !a && K && (r.shapeFlag & 6 ? K[K.indexOf(e)] = r : K.push(r)), r.patchFlag = -2, r;
	}
	if (la(e) && (e = e.__vccOpts), t) {
		t = Fi(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = A(e)), v(n) && (/* @__PURE__ */ Bt(n) && !d(n) && (n = s({}, n)), t.style = ue(n));
	}
	let o = g(e) ? 1 : yi(e) ? 128 : Fn(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return Y(e, t, n, r, i, o, a, !0);
}
function Fi(e) {
	return e ? /* @__PURE__ */ Bt(e) || qr(e) ? s({}, e) : e : null;
}
function Ii(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? Hi(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && Mi(l),
		ref: t && t.ref ? n && a ? d(a) ? a.concat(Ni(t)) : [a, Ni(t)] : Ni(t) : a,
		scopeId: e.scopeId,
		slotScopeIds: e.slotScopeIds,
		children: s,
		target: e.target,
		targetStart: e.targetStart,
		targetAnchor: e.targetAnchor,
		staticCount: e.staticCount,
		shapeFlag: e.shapeFlag,
		patchFlag: t && e.type !== G ? o === -1 ? 16 : o | 16 : o,
		dynamicProps: e.dynamicProps,
		dynamicChildren: e.dynamicChildren,
		appContext: e.appContext,
		dirs: e.dirs,
		transition: c,
		component: e.component,
		suspense: e.suspense,
		ssContent: e.ssContent && Ii(e.ssContent),
		ssFallback: e.ssFallback && Ii(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && Ln(u, c.clone(u)), u;
}
function Li(e = " ", t = 0) {
	return X(xi, null, e, t);
}
function Ri(e, t) {
	let n = X(Ci, null, e);
	return n.staticCount = t, n;
}
function Z(e = "", t = !1) {
	return t ? (q(), ki(Si, null, e)) : X(Si, null, e);
}
function zi(e) {
	return e == null || typeof e == "boolean" ? X(Si) : d(e) ? X(G, null, e.slice()) : Ai(e) ? Bi(e) : X(xi, null, String(e));
}
function Bi(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : Ii(e);
}
function Vi(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (d(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), Vi(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !qr(t) ? t._ctx = V : r === 3 && V && (V.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: V
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Li(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Hi(...e) {
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
function Ui(e, t, n, r = null) {
	rn(e, t, 7, [n, r]);
}
var Wi = kr(), Gi = 0;
function Ki(e, n, r) {
	let i = e.type, a = (n ? n.appContext : e.appContext) || Wi, o = {
		uid: Gi++,
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
		propsOptions: $r(i, a),
		emitsOptions: Ir(i, a),
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
	return o.ctx = { _: o }, o.root = n ? n.root : o, o.emit = Pr.bind(null, o), e.ce && e.ce(o), o;
}
var Q = null, qi = () => Q || V, Ji, Yi;
{
	let e = le(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Ji = t("__VUE_INSTANCE_SETTERS__", (e) => Q = e), Yi = t("__VUE_SSR_SETTERS__", (e) => $i = e);
}
var Xi = (e) => {
	let t = Q;
	return Ji(e), e.scope.on(), () => {
		e.scope.off(), Ji(t);
	};
}, Zi = () => {
	Q && Q.scope.off(), Ji(null);
};
function Qi(e) {
	return e.vnode.shapeFlag & 4;
}
var $i = !1;
function ea(e, t = !1, n = !1) {
	t && Yi(t);
	let { props: r, children: i } = e.vnode, a = Qi(e);
	Jr(e, r, a, t), si(e, i, n || t);
	let o = a ? ta(e, t) : void 0;
	return t && Yi(!1), o;
}
function ta(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, pr);
	let { setup: r } = n;
	if (r) {
		He();
		let n = e.setupContext = r.length > 1 ? sa(e) : null, i = Xi(e), a = nn(r, e, 0, [e.props, n]), o = y(a);
		if (Ue(), i(), (o || e.sp) && !Wn(e) && zn(e), o) {
			if (a.then(Zi, Zi), t) return a.then((n) => {
				na(e, n, t);
			}).catch((t) => {
				an(t, e, 0);
			});
			e.asyncDep = a;
		} else na(e, a, t);
	} else aa(e, t);
}
function na(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = qt(t)), aa(e, n);
}
var ra, ia;
function aa(e, t, n) {
	let i = e.type;
	if (!e.render) {
		if (!t && ra && !i.render) {
			let t = i.template || br(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: r } = e.appContext.config, { delimiters: a, compilerOptions: o } = i;
				i.render = ra(t, s(s({
					isCustomElement: n,
					delimiters: a
				}, r), o));
			}
		}
		e.render = i.render || r, ia && ia(e);
	}
	{
		let t = Xi(e);
		He();
		try {
			gr(e);
		} finally {
			Ue(), t();
		}
	}
}
var oa = { get(e, t) {
	return P(e, "get", ""), e[t];
} };
function sa(e) {
	return {
		attrs: new Proxy(e.attrs, oa),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function ca(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(qt(Vt(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in dr) return dr[n](e);
		},
		has(e, t) {
			return t in e || t in dr;
		}
	}) : e.proxy;
}
function la(e) {
	return h(e) && "__vccOpts" in e;
}
var $ = (e, t) => /* @__PURE__ */ Yt(e, t, $i), ua = "3.5.34", da = void 0, fa = typeof window < "u" && window.trustedTypes;
if (fa) try {
	da = /* @__PURE__ */ fa.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var pa = da ? (e) => da.createHTML(e) : (e) => e, ma = "http://www.w3.org/2000/svg", ha = "http://www.w3.org/1998/Math/MathML", ga = typeof document < "u" ? document : null, _a = ga && /* @__PURE__ */ ga.createElement("template"), va = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? ga.createElementNS(ma, e) : t === "mathml" ? ga.createElementNS(ha, e) : n ? ga.createElement(e, { is: n }) : ga.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => ga.createTextNode(e),
	createComment: (e) => ga.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => ga.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			_a.innerHTML = pa(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = _a.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, ya = /* @__PURE__ */ Symbol("_vtc");
function ba(e, t, n) {
	let r = e[ya];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var xa = /* @__PURE__ */ Symbol("_vod"), Sa = /* @__PURE__ */ Symbol("_vsh"), Ca = /* @__PURE__ */ Symbol(""), wa = /(?:^|;)\s*display\s*:/;
function Ta(e, t, n) {
	let r = e.style, i = g(n), a = !1;
	if (n && !i) {
		if (t) if (g(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? Da(r, t, "");
		}
		else for (let e in t) n[e] ?? Da(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? Da(r, i, "") : ja(e, i, !g(t) && t ? t[i] : void 0, o) || Da(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[Ca];
			e && (n += ";" + e), r.cssText = n, a = wa.test(n);
		}
	} else t && e.removeAttribute("style");
	xa in e && (e[xa] = a ? r.display : "", e[Sa] && (r.display = "none"));
}
var Ea = /\s*!important$/;
function Da(e, t, n) {
	if (d(n)) n.forEach((n) => Da(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = Aa(e, t);
		Ea.test(n) ? e.setProperty(D(r), n.replace(Ea, ""), "important") : e[r] = n;
	}
}
var Oa = [
	"Webkit",
	"Moz",
	"ms"
], ka = {};
function Aa(e, t) {
	let n = ka[t];
	if (n) return n;
	let r = E(t);
	if (r !== "filter" && r in e) return ka[t] = r;
	r = re(r);
	for (let n = 0; n < Oa.length; n++) {
		let i = Oa[n] + r;
		if (i in e) return ka[t] = i;
	}
	return t;
}
function ja(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && g(r) && n === r;
}
var Ma = "http://www.w3.org/1999/xlink";
function Na(e, t, n, r, i, a = ge(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Ma, t.slice(6, t.length)) : e.setAttributeNS(Ma, t, n) : n == null || a && !_e(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
}
function Pa(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? pa(n) : n);
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
function Fa(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function Ia(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var La = /* @__PURE__ */ Symbol("_vei");
function Ra(e, t, n, r, i = null) {
	let a = e[La] || (e[La] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = Ba(t);
		r ? Fa(e, n, a[t] = Wa(r, i), s) : o && (Ia(e, n, o, s), a[t] = void 0);
	}
}
var za = /(?:Once|Passive|Capture)$/;
function Ba(e) {
	let t;
	if (za.test(e)) {
		t = {};
		let n;
		for (; n = e.match(za);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : D(e.slice(2)), t];
}
var Va = 0, Ha = /* @__PURE__ */ Promise.resolve(), Ua = () => Va ||= (Ha.then(() => Va = 0), Date.now());
function Wa(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		rn(Ga(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Ua(), n;
}
function Ga(e, t) {
	if (d(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Ka = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, qa = (e, t, n, r, i, s) => {
	let c = i === "svg";
	t === "class" ? ba(e, r, c) : t === "style" ? Ta(e, n, r) : a(t) ? o(t) || Ra(e, t, n, r, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ja(e, t, r, c)) ? (Pa(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Na(e, t, r, c, s, t !== "value")) : e._isVueCE && (Ya(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r))) ? Pa(e, E(t), r, s, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Na(e, t, r, c));
};
function Ja(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Ka(t) && h(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Ka(t) && g(n) ? !1 : t in e;
}
function Ya(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = E(t);
	return Array.isArray(n) ? n.some((e) => E(e) === r) : Object.keys(n).some((e) => E(e) === r);
}
var Xa = {};
/* @__NO_SIDE_EFFECTS__ */
function Za(e, t, n) {
	let r = /* @__PURE__ */ Rn(e, t);
	C(r) && (r = s({}, r, t));
	class i extends $a {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var Qa = typeof HTMLElement < "u" ? HTMLElement : class {}, $a = class e extends Qa {
	constructor(e, t = {}, n = yo) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== yo ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, pn(() => {
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
		if (t) for (let e in t) u(this, e) || Object.defineProperty(this, e, { get: () => Gt(t[e]) });
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : Xa, r = E(e);
		t && this._numberProps && this._numberProps[r] && (n = se(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === Xa ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(D(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(D(e), t + "") : t || this.removeAttribute(D(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), vo(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = X(this._def, s(e, this._props));
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
}, eo = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return d(t) ? (e) => ae(t, e) : t;
};
function to(e) {
	e.target.composing = !0;
}
function no(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var ro = /* @__PURE__ */ Symbol("_assign");
function io(e, t, n) {
	return t && (e = e.trim()), n && (e = oe(e)), e;
}
var ao = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e[ro] = eo(i);
		let a = r || i.props && i.props.type === "number";
		Fa(e, t ? "change" : "input", (t) => {
			t.target.composing || e[ro](io(e.value, n, a));
		}), (n || a) && Fa(e, "change", () => {
			e.value = io(e.value, n, a);
		}), t || (Fa(e, "compositionstart", to), Fa(e, "compositionend", no), Fa(e, "change", no));
	},
	mounted(e, { value: t }) {
		e.value = t ?? "";
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[ro] = eo(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? oe(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, oo = {
	deep: !0,
	created(e, { value: t, modifiers: { number: n } }, r) {
		let i = p(t);
		Fa(e, "change", () => {
			let t = Array.prototype.filter.call(e.options, (e) => e.selected).map((e) => n ? oe(co(e)) : co(e));
			e[ro](e.multiple ? i ? new Set(t) : t : t[0]), e._assigning = !0, pn(() => {
				e._assigning = !1;
			});
		}), e[ro] = eo(r);
	},
	mounted(e, { value: t }) {
		so(e, t);
	},
	beforeUpdate(e, t, n) {
		e[ro] = eo(n);
	},
	updated(e, { value: t }) {
		e._assigning || so(e, t);
	}
};
function so(e, t) {
	let n = e.multiple, r = d(t);
	if (!(n && !r && !p(t))) {
		for (let i = 0, a = e.options.length; i < a; i++) {
			let a = e.options[i], o = co(a);
			if (n) if (r) {
				let e = typeof o;
				e === "string" || e === "number" ? a.selected = t.some((e) => String(e) === String(o)) : a.selected = be(t, o) > -1;
			} else a.selected = t.has(o);
			else if (ye(co(a), t)) {
				e.selectedIndex !== i && (e.selectedIndex = i);
				return;
			}
		}
		!n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
	}
}
function co(e) {
	return "_value" in e ? e._value : e.value;
}
var lo = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], uo = {
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
	exact: (e, t) => lo.some((n) => e[`${n}Key`] && !t.includes(n))
}, fo = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = uo[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, po = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, mo = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = D(n.key);
		if (t.some((e) => e === r || po[e] === r)) return e(n);
	}));
}, ho = /* @__PURE__ */ s({ patchProp: qa }, va), go;
function _o() {
	return go ||= li(ho);
}
var vo = ((...e) => {
	_o().render(...e);
}), yo = ((...e) => {
	let t = _o().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = xo(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, bo(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function bo(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function xo(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/runtime.ts
async function So(e, t, n, r, i = {}) {
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
			let r = wo(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: Co(n?.code) ?? r,
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
function Co(e) {
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
function wo(e) {
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
var To = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, Eo;
function Do() {
	return Eo ||= Oo(To), Eo;
}
function Oo(e) {
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
var ko = Symbol.for("comtrya.relationship-registry"), Ao = jo();
function jo() {
	let e = globalThis;
	return e[ko] ??= {
		types: /* @__PURE__ */ new Map(),
		providers: /* @__PURE__ */ new Map(),
		subscribers: /* @__PURE__ */ new Set()
	}, e[ko];
}
function Mo(e) {
	return [...Ao.types.values()].filter((t) => t.sourceKinds.includes(e) || t.targetKinds.includes(e)).sort((e, t) => e.order - t.order || e.id.localeCompare(t.id));
}
function No(e) {
	return Ao.providers.get(e);
}
function Po(e) {
	return Ao.subscribers.add(e), () => Ao.subscribers.delete(e);
}
//#endregion
//#region packages/sdk-core/src/route-registry.ts
function Fo(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`;
	return `/x/${e}${n === "/" ? "" : n.replace(/\/+$/, "")}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function Io(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return Lo(t, e, n.signal), () => n.abort();
}
async function Lo(e, t, n) {
	try {
		let r = await Ro(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: zo(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await Bo(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function Ro(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: zo(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function zo(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function Bo(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		Vo(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) Ho(e, t);
	}
	a += i.decode(), Vo(a, t);
}
function Vo(e, t) {
	for (let n of e.split("\n\n")) Ho(n, t);
}
function Ho(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = Uo(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function Uo(e, t) {
	let n = Wo(e) ? e : {}, r = Wo(n.data) ? n.data : {}, i = Go(r.eventType) ?? Go(n.type) ?? t ?? "";
	return {
		id: Go(r.id) ?? Go(n.id) ?? "",
		eventType: i,
		payloadB64: Go(r.payloadB64) ?? "",
		timestampMs: Ko(r.timestampMs) ?? qo(Ko(n.time)) ?? Date.now(),
		sourceUri: Go(r.sourceUri) ?? Go(n.source) ?? "",
		emitterExtension: Go(r.emitterExtension) ?? Go(r.extensionId) ?? Go(n.source) ?? "",
		raw: e
	};
}
function Wo(e) {
	return typeof e == "object" && !!e;
}
function Go(e) {
	return typeof e == "string" ? e : void 0;
}
function Ko(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function qo(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var Jo = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], Yo = typeof navigator == "object" ? navigator.platform : "", Xo = /Mac|iPod|iPhone|iPad/.test(Yo), Zo = Xo ? "Meta" : "Control", Qo = Yo === "Win32" ? ["Control", "Alt"] : Xo ? ["Alt"] : [];
function $o(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || Qo.includes(t) && e.getModifierState("AltGraph"));
}
function es(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? Zo : e;
		}), n];
	});
}
function ts(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !$o(e, t);
	}) || Jo.find(function(t) {
		return !n.includes(t) && r !== t && $o(e, t);
	}));
}
function ns(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [es(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			ts(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : $o(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function rs(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = ns(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var is = /* @__PURE__ */ new Map(), as = /* @__PURE__ */ new Set();
function os(e) {
	is.set(e.id, e);
	for (let e of as) e();
	return () => {
		is.delete(e.id);
		for (let e of as) e();
	};
}
//#endregion
//#region packages/sdk-core/src/optimistic.ts
async function ss(e) {
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
function cs(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function ls(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function us(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (ls(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			cs(e.target) || r(e);
		};
	}
	return t;
}
function ds(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = us(e), i = () => {
		n ||= rs(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? H(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), rr(a);
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function fs(e) {
	ps(e.tagName, e.component);
	let t = /* @__PURE__ */ Za(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(hs(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function ps(e, t) {
	if (typeof document > "u") return;
	let n = ms(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function ms(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function hs(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_issues/dist/ext_issues.client.ts
var gs = {
	openIssue: async (e) => So("ext_issues", "issues", "open-issue", e),
	closeIssue: async (e) => So("ext_issues", "issues", "close-issue", e),
	reopenIssue: async (e) => So("ext_issues", "issues", "reopen-issue", e),
	getIssue: async (e) => So("ext_issues", "issues", "get-issue", e),
	listIssues: async (e) => So("ext_issues", "issues", "list-issues", e),
	byRefIssue: async (e) => So("ext_issues", "issues", "by-ref-issue", e),
	byRefsIssue: async (e) => So("ext_issues", "issues", "by-refs-issue", e),
	byNumberIssue: async (e) => So("ext_issues", "issues", "by-number-issue", e),
	stateCountsForRefsIssue: async (e) => So("ext_issues", "issues", "state-counts-for-refs-issue", e)
}, _s = "query($from: ResourceURN!, $kind: ResourceURN) {\n  relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n}", vs = "query($to: ResourceURN!, $kind: ResourceURN) {\n  relations.incoming(to: $to, kind: $kind) { id kind from to source target }\n}", ys = "mutation($input: RelationCreateInput!) {\n  relations.create(input: $input) { id kind from to source target }\n}", bs = "mutation($input: RelationDeleteInput!) {\n  relations.delete(input: $input)\n}";
function xs(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Ss(e, t) {
	return t ? `comtrya://workspace/${e}/repository/${t}` : `comtrya://workspace/${e}`;
}
function Cs(e) {
	let t = e?.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/([^/]+))?$/);
	return {
		workspaceId: t?.[1] ?? "",
		repositoryId: t?.[2] ?? null
	};
}
function ws(e) {
	switch (e) {
		case "closed":
		case "CLOSED": return "CLOSED";
		case "reopened":
		case "REOPENED": return "REOPENED";
		default: return "OPEN";
	}
}
function Ts(e) {
	let t = Cs(e.repository);
	return {
		id: e.id,
		workspaceId: t.workspaceId,
		repositoryId: t.repositoryId,
		number: e.number,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: ws(e.state),
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
async function Es(e, t) {
	let n = xs(await gs.listIssues({
		repository: Ss(t.workspaceId, t.repositoryId),
		limit: 1024
	}), "listIssues").map(Ts), r = t.state ? ws(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function Ds(e, t) {
	let n = xs(await gs.byRefIssue(t), "issueByRef");
	return n ? Ts(n) : null;
}
async function Os(e, t, n) {
	let r = xs(await gs.byNumberIssue({
		workspaceId: t,
		number: n
	}), "issueByNumber");
	return r ? Ts(r) : null;
}
async function ks(e) {
	return Ts(xs(await gs.openIssue({
		repository: Ss(e.workspaceId, e.repositoryId),
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		projectName: e.projectName ?? null,
		labels: e.labels ?? [],
		closeOnMerge: e.closeOnMerge ?? null,
		assignees: e.assignees ?? []
	}), "openIssue"));
}
async function As(e, t) {
	return Ts(xs(await gs.closeIssue({
		id: t,
		reason: "completed"
	}), "closeIssue"));
}
async function js(e, t) {
	return Ts(xs(await gs.reopenIssue(t), "reopenIssue"));
}
async function Ms(e, t, n) {
	return ((await e.query(_s, n ? {
		from: t,
		kind: n
	} : { from: t })).relations?.outgoing ?? []).map(Is);
}
async function Ns(e, t, n) {
	return ((await e.query(vs, n ? {
		to: t,
		kind: n
	} : { to: t })).relations?.incoming ?? []).map(Is);
}
async function Ps(e, t) {
	let n = (await e.mutate(ys, { input: t })).relations?.create;
	if (!n) throw Error("relations.create returned no relation");
	return Is(n);
}
async function Fs(e, t) {
	return (await e.mutate(bs, { input: { id: t } })).relations?.delete ?? !1;
}
function Is(e) {
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
var Ls = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
function Rs(e) {
	return `comtrya://issue/${e.id}`;
}
var zs = "issues";
function Bs(e) {
	return Fo(zs, `/${e.workspaceId}/${e.number}`);
}
function Vs() {
	return Fo(zs, "/new");
}
function Hs(e) {
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
var Us = ["data-state"], Ws = ["data-issue-id"], Gs = { class: "issue-card-title" }, Ks = { class: "issue-number" }, qs = ["href"], Js = { class: "issue-meta" }, Ys = { key: 0 }, Xs = {
	key: 1,
	class: "issue-line muted"
}, Zs = {
	key: 2,
	class: "issue-card-fallback"
}, Qs = { class: "issue-line muted" }, $s = { class: "issue-line warn" }, ec = /* @__PURE__ */ Rn({
	__name: "IssueCard",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issue: { type: null },
		ref: { type: String },
		resourceRef: { type: String }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ z("idle"), r = /* @__PURE__ */ z(null), i = /* @__PURE__ */ z(t.issue ?? null), a = $(() => t.resourceRef ?? t.ref ?? ""), o = $(() => t.client ?? t.comtryaClient), s = $(() => t.issue ?? i.value), c = $(() => Hs(s.value?.state)), l = $(() => s.value?.labels?.join(", ") ?? ""), u = $(() => s.value ? Bs(s.value) : "#");
		$n(d), H(() => [
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
				i.value = await Ds(o.value, a.value), n.value = i.value ? "ready" : "empty";
			} catch (e) {
				i.value = null, n.value = "error", r.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (e, t) => (q(), J("article", {
			class: "issue-card",
			"data-state": n.value,
			"data-smoke": "issue-card"
		}, [s.value ? (q(), J("div", {
			key: 0,
			class: "issue-card-body",
			"data-issue-id": s.value.id,
			"data-smoke": "issue-card-body"
		}, [Y("div", Gs, [
			Y("span", { class: A(["issue-pill", c.value.className]) }, j(c.value.label), 3),
			Y("span", Ks, "#" + j(s.value.number), 1),
			Y("a", {
				class: "issue-title-link",
				href: u.value
			}, j(s.value.title), 9, qs)
		]), Y("div", Js, [Y("span", null, "by " + j(s.value.authorRef ?? "unknown"), 1), l.value ? (q(), J("span", Ys, j(l.value), 1)) : Z("", !0)])], 8, Ws)) : n.value === "loading" ? (q(), J("p", Xs, " Loading " + j(a.value), 1)) : (q(), J("div", Zs, [Y("p", Qs, j(a.value || "issue"), 1), Y("p", $s, j(r.value ?? "issue not found"), 1)]))], 8, Us));
	}
}), tc = ".issue-card[data-v-926ccdce]{display:block}.issue-card-body[data-v-926ccdce]{border:1px solid var(--ink-rule,#d0cfc8);padding:8px 12px}.issue-card-title[data-v-926ccdce]{align-items:baseline;gap:8px;min-width:0;display:flex}.issue-pill[data-v-926ccdce],.issue-number[data-v-926ccdce],.issue-meta[data-v-926ccdce],.issue-line[data-v-926ccdce]{font-family:var(--mono,monospace)}.issue-pill[data-v-926ccdce]{border:1px solid;padding:1px 8px;font-size:10px}.issue-state-open[data-v-926ccdce]{color:var(--ink-go,#008873)}.issue-state-closed[data-v-926ccdce],.issue-number[data-v-926ccdce],.issue-meta[data-v-926ccdce]{color:var(--ink-faint,#888)}.issue-number[data-v-926ccdce]{font-size:12px}.issue-title-link[data-v-926ccdce]{min-width:0;color:inherit;font-family:var(--display,system-ui);overflow-wrap:anywhere;font-weight:600}.issue-meta[data-v-926ccdce]{flex-wrap:wrap;gap:8px;margin-top:4px;font-size:11px;display:flex}.issue-line[data-v-926ccdce]{margin:4px 0;font-size:12px}.muted[data-v-926ccdce]{color:var(--ink-faint,#888)}.warn[data-v-926ccdce]{color:var(--ink-warn,#c2410c)}", nc = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, rc = /* @__PURE__ */ nc(ec, [["styles", [tc]], ["__scopeId", "data-v-926ccdce"]]), ic = /* @__PURE__ */ nc(/* @__PURE__ */ Rn({
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
		let t = e, n = /* @__PURE__ */ z(null), r = null;
		$n(i), H(() => [
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
		return (e, t) => (q(), J("span", {
			ref_key: "mount",
			ref: n,
			class: "custom-element-host"
		}, null, 512));
	}
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]), ac = ["data-state", "data-issue-id"], oc = {
	key: 0,
	class: "issue-line muted"
}, sc = {
	key: 1,
	class: "issue-line warn"
}, cc = {
	key: 2,
	class: "issue-line warn"
}, lc = {
	key: 3,
	class: "issue-detail-shell"
}, uc = { class: "issue-main" }, dc = { class: "issue-hero" }, fc = { class: "issue-kicker" }, pc = { class: "issue-number" }, mc = {
	key: 0,
	class: "issue-repository"
}, hc = {
	class: "issue-facts",
	"aria-label": "Issue metadata"
}, gc = { key: 0 }, _c = { key: 1 }, vc = ["data-issue-id"], yc = { class: "issue-thread" }, bc = {
	class: "issue-sidebar",
	"aria-label": "Issue sidebar"
}, xc = { class: "issue-panel" }, Sc = { class: "issue-state-summary" }, Cc = { key: 0 }, wc = { class: "issue-actions" }, Tc = ["disabled"], Ec = ["disabled"], Dc = {
	key: 0,
	class: "issue-line warn",
	role: "alert"
}, Oc = "comtrya-issue-relationships", kc = /* @__PURE__ */ nc(/* @__PURE__ */ Rn({
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
		let t = e, n = /* @__PURE__ */ z("idle"), r = /* @__PURE__ */ z("idle"), i = /* @__PURE__ */ z(null), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(t.issue ?? null), s = $(() => t.client ?? t.comtryaClient), c = $(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3"), l = $(() => o.value ?? t.issue ?? null), u = $(() => Hs(l.value?.state)), d = $(() => !!l.value?.bodyMarkdown?.trim()), f = $(() => l.value?.bodyMarkdown?.trim() || "No description has been added yet."), p = $(() => y(l.value?.createdAt)), m = $(() => t.repositoryPath ?? l.value?.repositoryId ?? null), h = $(() => Number(t.number ?? t.routeParams?.params?.number)), g = $(() => s.value && Number.isFinite(h.value));
		$n(_), H(() => [
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
				let e = await Os(s.value, c.value, h.value);
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
				let r = await ss({
					apply: () => {
						o.value = n;
					},
					rollback: () => {
						o.value = t;
					},
					op: async () => ({
						ok: !0,
						value: await As(e, t.id)
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
				let r = await ss({
					apply: () => {
						o.value = n;
					},
					rollback: () => {
						o.value = t;
					},
					op: async () => ({
						ok: !0,
						value: await js(e, t.id)
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
		return (e, o) => (q(), J("main", {
			class: "issue-detail",
			"data-state": n.value,
			"data-issue-id": l.value?.id,
			"data-smoke": "issue-detail"
		}, [n.value === "loading" ? (q(), J("p", oc, "Loading issue")) : n.value === "error" ? (q(), J("p", sc, j(i.value), 1)) : l.value ? (q(), J("div", lc, [Y("section", uc, [
			Y("header", dc, [
				Y("div", fc, [
					Y("span", { class: A(["issue-pill", u.value.className]) }, j(u.value.label), 3),
					Y("span", pc, "#" + j(l.value.number), 1),
					m.value ? (q(), J("span", mc, j(m.value), 1)) : Z("", !0)
				]),
				Y("h1", null, j(l.value.title), 1),
				Y("dl", hc, [
					Y("div", null, [o[0] ||= Y("dt", null, "Author", -1), Y("dd", null, j(l.value.authorRef ?? "unknown"), 1)]),
					p.value ? (q(), J("div", gc, [o[1] ||= Y("dt", null, "Opened", -1), Y("dd", null, j(p.value), 1)])) : Z("", !0),
					l.value.labels?.length ? (q(), J("div", _c, [o[2] ||= Y("dt", null, "Labels", -1), Y("dd", null, j(l.value.labels.join(", ")), 1)])) : Z("", !0)
				])
			]),
			Y("article", {
				class: A(["issue-body", { "is-empty": !d.value }]),
				"data-issue-id": l.value.id,
				"data-smoke": "issue-detail-main"
			}, j(f.value), 11, vc),
			Y("section", yc, [o[3] ||= Y("header", null, [Y("h2", null, "Activity")], -1), X(ic, {
				tag: "comtrya-comment-thread",
				attributes: { target: Gt(Rs)(l.value) },
				properties: {
					target: Gt(Rs)(l.value),
					comtryaClient: s.value
				}
			}, null, 8, ["attributes", "properties"])])
		]), Y("aside", bc, [Y("section", xc, [
			o[4] ||= Y("header", null, [Y("h2", null, "State")], -1),
			Y("div", Sc, [Y("span", { class: A(["issue-pill", u.value.className]) }, j(u.value.label), 3), l.value.stateReason ? (q(), J("span", Cc, j(l.value.stateReason), 1)) : Z("", !0)]),
			Y("div", wc, [l.value.state === "OPEN" || l.value.state === "REOPENED" ? (q(), J("button", {
				key: 0,
				type: "button",
				disabled: r.value === "submitting",
				onClick: b
			}, " Close issue ", 8, Tc)) : (q(), J("button", {
				key: 1,
				type: "button",
				disabled: r.value === "submitting",
				onClick: x
			}, " Reopen issue ", 8, Ec))]),
			a.value ? (q(), J("p", Dc, j(a.value), 1)) : Z("", !0)
		]), X(ic, {
			tag: Oc,
			properties: {
				client: s.value,
				issue: l.value,
				workspaceId: c.value,
				repositoryId: l.value.repositoryId,
				repositoryPath: t.repositoryPath
			}
		}, null, 8, ["properties"])])])) : (q(), J("p", cc, " No issue #" + j(Number.isFinite(h.value) ? h.value : "?") + " in " + j(c.value), 1))], 8, ac));
	}
}), [["styles", [".issue-detail[data-v-47f03841]{width:min(100%,1180px);color:var(--ink,#111);gap:24px;padding:8px 0 48px;display:grid}.issue-detail-shell[data-v-47f03841]{grid-template-columns:minmax(0,1fr) minmax(280px,340px);align-items:start;gap:32px;display:grid}.issue-main[data-v-47f03841],.issue-sidebar[data-v-47f03841],.issue-panel[data-v-47f03841],.issue-thread[data-v-47f03841]{min-width:0}.issue-main[data-v-47f03841]{gap:24px;display:grid}.issue-sidebar[data-v-47f03841]{gap:16px;display:grid}.issue-detail h1[data-v-47f03841]{max-width:820px;font-family:var(--display,system-ui);letter-spacing:0;overflow-wrap:anywhere;margin:10px 0 0;font-size:42px;line-height:1}.issue-hero[data-v-47f03841]{border-bottom:2px solid var(--ink,#111);gap:14px;padding-bottom:22px;display:grid}.issue-kicker[data-v-47f03841]{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.issue-facts[data-v-47f03841]{flex-wrap:wrap;gap:12px 24px;margin:0;display:flex}.issue-line[data-v-47f03841],.issue-kicker[data-v-47f03841],.issue-facts[data-v-47f03841],.issue-panel[data-v-47f03841],.issue-actions button[data-v-47f03841]{font-family:var(--mono,monospace)}.issue-pill[data-v-47f03841]{min-height:22px;font-family:var(--mono,monospace);text-transform:lowercase;border:1px solid;align-items:center;padding:2px 8px;font-size:11px;line-height:1;display:inline-flex}.issue-number[data-v-47f03841],.issue-repository[data-v-47f03841]{color:var(--ink-faint,#888);font-size:12px}.issue-facts div[data-v-47f03841]{gap:4px;display:grid}.issue-facts dt[data-v-47f03841],.issue-facts dd[data-v-47f03841]{margin:0}.issue-facts dt[data-v-47f03841]{color:var(--ink-faint,#888);letter-spacing:.08em;text-transform:uppercase;font-size:10px}.issue-facts dd[data-v-47f03841]{color:var(--ink-soft,#2c2b28);overflow-wrap:anywhere;font-size:12px}.issue-state-open[data-v-47f03841]{color:var(--ink-go,#008873)}.issue-state-closed[data-v-47f03841]{color:var(--ink-faint,#888)}.issue-body[data-v-47f03841]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 86%, white);white-space:pre-wrap;overflow-wrap:anywhere;min-height:156px;padding:20px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55}.issue-body.is-empty[data-v-47f03841]{color:var(--ink-faint,#888);font-family:var(--mono,monospace);font-size:12px}.issue-thread[data-v-47f03841]{gap:12px;padding-top:4px;display:grid}.issue-thread header[data-v-47f03841],.issue-panel header[data-v-47f03841]{border-bottom:1px solid var(--ink-rule,#d0cfc8);align-items:center;min-height:36px;display:flex}.issue-thread h2[data-v-47f03841],.issue-panel h2[data-v-47f03841]{font-family:var(--display,system-ui);margin:0;font-size:18px;line-height:1}.issue-panel[data-v-47f03841]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 94%, white);gap:12px;padding:14px;display:grid}.issue-state-summary[data-v-47f03841]{color:var(--ink-faint,#888);flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;display:flex}.issue-actions[data-v-47f03841]{gap:8px;display:grid}.issue-actions button[data-v-47f03841]{border:1.5px solid var(--ink,#111);min-height:34px;color:inherit;cursor:pointer;text-align:left;background:0 0;padding:8px 12px}.issue-actions button[data-v-47f03841]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-47f03841]{margin:4px 0;font-size:12px}.muted[data-v-47f03841]{color:var(--ink-faint,#888)}.warn[data-v-47f03841]{color:var(--ink-warn,#c2410c)}@media (max-width:920px){.issue-detail-shell[data-v-47f03841]{grid-template-columns:1fr}.issue-detail h1[data-v-47f03841]{font-size:34px}}"]], ["__scopeId", "data-v-47f03841"]]), Ac = {
	class: "issue-relationships",
	"data-smoke": "issue-detail-relationships"
}, jc = { class: "relationship-header" }, Mc = {
	key: 0,
	class: "issue-line muted"
}, Nc = {
	key: 1,
	class: "issue-line warn"
}, Pc = {
	key: 2,
	class: "issue-line muted"
}, Fc = {
	key: 3,
	class: "relationship-groups"
}, Ic = { class: "relationship-group-heading" }, Lc = { class: "relationship-card" }, Rc = [
	"aria-label",
	"disabled",
	"onClick"
], zc = ["value"], Bc = ["value"], Vc = ["disabled"], Hc = {
	key: 5,
	class: "issue-line muted"
}, Uc = {
	key: 6,
	class: "issue-line warn",
	role: "alert"
}, Wc = "issue", Gc = /* @__PURE__ */ nc(/* @__PURE__ */ Rn({
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
		let t = e, n = $(() => t.client ?? t.comtryaClient), r = $(() => Rs(t.issue)), i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z("idle"), s = /* @__PURE__ */ z(null), c = /* @__PURE__ */ z([]), l = /* @__PURE__ */ z([]), u = /* @__PURE__ */ z([]), d = /* @__PURE__ */ z(""), f = /* @__PURE__ */ z(""), p = /* @__PURE__ */ z(0), m, h = $(() => (p.value, Mo(Wc))), g = $(() => y.value.reduce((e, t) => e + t.relations.length, 0)), _ = $(() => {
			let e = [];
			for (let t of h.value) {
				if (t.symmetric) {
					let n = E(t.sourceKinds.includes(Wc) ? t.targetKinds : t.sourceKinds);
					n.length > 0 && e.push({
						key: `${t.id}:symmetric`,
						type: t,
						direction: "symmetric",
						label: t.outgoingLabel,
						targetKinds: n
					});
					continue;
				}
				if (t.sourceKinds.includes(Wc)) {
					let n = E(t.targetKinds);
					n.length > 0 && e.push({
						key: `${t.id}:outgoing`,
						type: t,
						direction: "outgoing",
						label: t.outgoingLabel,
						targetKinds: n
					});
				}
				if (t.targetKinds.includes(Wc)) {
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
		}), v = $(() => _.value.find((e) => e.key === d.value)), y = $(() => {
			let e = [];
			for (let t of h.value) {
				if (t.symmetric) {
					let n = ne([...c.value, ...l.value]).filter((e) => e.kind === t.kind).map((e) => ({
						relation: e,
						targetRef: T(e, r.value)
					})).filter((e) => t.sourceKinds.includes(te(e.targetRef)) || t.targetKinds.includes(te(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:symmetric`,
						label: t.outgoingLabel,
						relations: n
					});
					continue;
				}
				if (t.sourceKinds.includes(Wc)) {
					let n = c.value.filter((e) => e.kind === t.kind && w(e) === r.value).map((e) => ({
						relation: e,
						targetRef: ee(e)
					})).filter((e) => t.targetKinds.includes(te(e.targetRef)));
					n.length > 0 && e.push({
						key: `${t.id}:outgoing`,
						label: t.outgoingLabel,
						relations: n
					});
				}
				if (t.targetKinds.includes(Wc)) {
					let n = l.value.filter((e) => e.kind === t.kind && ee(e) === r.value).map((e) => ({
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
		$n(() => {
			m = Po(() => {
				p.value += 1;
			});
		}), rr(() => m?.()), H(() => [n.value, t.issue.id], () => void b(), { immediate: !0 }), H(_, (e) => {
			e.some((e) => e.key === d.value) || (d.value = e[0]?.key ?? "");
		}, { immediate: !0 }), H(() => [
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
				let [t, n] = await Promise.all([Ms(e, r.value), Ns(e, r.value)]);
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
					let a = No(i);
					if (!a) continue;
					let o = await a.loadTargets({
						workspaceId: t.workspaceId,
						repositoryId: t.repositoryId,
						repositoryPath: t.repositoryPath,
						currentRef: r.value,
						currentKind: Wc,
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
				await Ps(e, {
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
					await Fs(t, e.id), await b();
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
		function T(e, t) {
			let n = w(e), r = ee(e);
			return n === t ? r : n === r ? "" : n;
		}
		function te(e) {
			return e.match(/^comtrya:\/\/([^/]+)\//)?.[1] ?? "";
		}
		function E(e) {
			return [...new Set(e)].filter((e) => No(e) !== void 0);
		}
		function ne(e) {
			let t = /* @__PURE__ */ new Set();
			return e.filter((e) => t.has(e.id) ? !1 : (t.add(e.id), !0));
		}
		function D(e) {
			let t = /* @__PURE__ */ new Set();
			return e.filter((e) => t.has(e.ref) ? !1 : (t.add(e.ref), !0));
		}
		return (e, t) => (q(), J("section", Ac, [
			Y("header", jc, [Y("div", null, [t[2] ||= Y("h2", null, "Relationships", -1), Y("p", null, j(g.value) + " linked", 1)])]),
			i.value === "loading" ? (q(), J("p", Mc, "Loading relationships")) : i.value === "error" ? (q(), J("p", Nc, j(a.value), 1)) : y.value.length === 0 ? (q(), J("p", Pc, " No relationships yet. ")) : (q(), J("div", Fc, [(q(!0), J(G, null, lr(y.value, (e) => (q(), J("section", {
				key: e.key,
				class: "relationship-group"
			}, [Y("div", Ic, [Y("h3", null, j(e.label), 1), Y("span", null, j(e.relations.length), 1)]), Y("ul", null, [(q(!0), J(G, null, lr(e.relations, (t) => (q(), J("li", { key: t.relation.id }, [Y("div", Lc, [X(ic, {
				tag: "comtrya-resource-card",
				attributes: { ref: t.targetRef },
				properties: {
					ref: t.targetRef,
					comtryaClient: n.value
				}
			}, null, 8, ["attributes", "properties"])]), Y("button", {
				type: "button",
				class: "relationship-remove",
				"aria-label": `Remove ${e.label} relationship`,
				disabled: o.value === "submitting",
				onClick: (e) => C(t.relation)
			}, " Remove ", 8, Rc)]))), 128))])]))), 128))])),
			_.value.length > 0 ? (q(), J("form", {
				key: 4,
				class: "relationship-form",
				onSubmit: fo(S, ["prevent"])
			}, [
				Y("label", null, [t[3] ||= Y("span", null, "Type", -1), Tn(Y("select", {
					"onUpdate:modelValue": t[0] ||= (e) => d.value = e,
					"aria-label": "Relationship type"
				}, [(q(!0), J(G, null, lr(_.value, (e) => (q(), J("option", {
					key: e.key,
					value: e.key
				}, j(e.label), 9, zc))), 128))], 512), [[oo, d.value]])]),
				Y("label", null, [t[4] ||= Y("span", null, "Target", -1), Tn(Y("select", {
					"onUpdate:modelValue": t[1] ||= (e) => f.value = e,
					"aria-label": "Relationship target"
				}, [(q(!0), J(G, null, lr(u.value, (e) => (q(), J("option", {
					key: e.ref,
					value: e.ref
				}, j(e.title) + j(e.subtitle ? ` - ${e.subtitle}` : ""), 9, Bc))), 128))], 512), [[oo, f.value]])]),
				Y("button", {
					type: "submit",
					disabled: o.value !== "idle" || !f.value
				}, " Add ", 8, Vc)
			], 32)) : Z("", !0),
			_.value.length > 0 && u.value.length === 0 && o.value === "idle" ? (q(), J("p", Hc, " No eligible targets for this relationship. ")) : Z("", !0),
			s.value ? (q(), J("p", Uc, j(s.value), 1)) : Z("", !0)
		]));
	}
}), [["styles", [".issue-relationships[data-v-0937cdb1]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 94%, white);font-family:var(--mono,monospace);gap:12px;padding:14px;font-size:12px;display:grid}.relationship-header[data-v-0937cdb1]{border-bottom:1px solid var(--ink-rule,#d0cfc8);align-items:center;min-height:36px;display:flex}.relationship-header h2[data-v-0937cdb1],.relationship-group h3[data-v-0937cdb1]{font-family:var(--display,system-ui);margin:0}.relationship-header h2[data-v-0937cdb1]{font-size:18px;line-height:1}.relationship-header p[data-v-0937cdb1]{color:var(--ink-faint,#888);margin:4px 0 0;font-size:11px}.relationship-groups[data-v-0937cdb1],.relationship-group[data-v-0937cdb1],.relationship-group ul[data-v-0937cdb1]{flex-direction:column;gap:8px;display:flex}.relationship-group[data-v-0937cdb1]{padding-top:4px}.relationship-group-heading[data-v-0937cdb1]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.relationship-group-heading h3[data-v-0937cdb1]{font-size:14px;line-height:1}.relationship-group-heading span[data-v-0937cdb1]{color:var(--ink-faint,#888);font-size:11px}.relationship-group ul[data-v-0937cdb1]{margin:0;padding:0;list-style:none}.relationship-group li[data-v-0937cdb1]{grid-template-columns:minmax(0,1fr) auto;align-items:stretch;gap:8px;display:grid}.relationship-card[data-v-0937cdb1]{min-width:0}.relationship-form[data-v-0937cdb1]{border-top:1px solid var(--ink-rule,#d0cfc8);gap:8px;padding-top:12px;display:grid}.relationship-form label[data-v-0937cdb1]{flex-direction:column;gap:4px;min-width:0;display:flex}.relationship-form label>span[data-v-0937cdb1]{color:var(--ink-faint,#888);letter-spacing:.08em;text-transform:uppercase;font-size:10px}.relationship-form select[data-v-0937cdb1],.relationship-form button[data-v-0937cdb1],.relationship-group button[data-v-0937cdb1]{border:1px solid var(--ink,#111);min-height:32px;color:inherit;font:inherit;background:0 0}.relationship-form select[data-v-0937cdb1]{width:100%;max-width:100%;padding:5px 8px}.relationship-form button[data-v-0937cdb1],.relationship-group button[data-v-0937cdb1]{cursor:pointer;padding:5px 10px}.relationship-remove[data-v-0937cdb1]{color:var(--ink-faint,#888);align-self:start}.relationship-form button[data-v-0937cdb1]:disabled,.relationship-group button[data-v-0937cdb1]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-0937cdb1]{margin:4px 0;font-size:12px}.muted[data-v-0937cdb1]{color:var(--ink-faint,#888)}.warn[data-v-0937cdb1]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-0937cdb1"]]), Kc = {
	defaultLabels: [],
	closeOnMerge: null,
	ownerRefs: []
};
function qc(e = "location") {
	let t = e === "location" ? typeof window < "u" ? window.location.pathname : "" : Jc();
	if (!t.startsWith("/r/")) return [];
	let n = t.slice(3), r = n.indexOf("/p/");
	return (r >= 0 ? n.slice(0, r) : n).split("/").filter(Boolean).map(decodeURIComponent);
}
function Jc() {
	let e = typeof document < "u" && document.referrer || "";
	if (!e) return "";
	try {
		return new URL(e).pathname;
	} catch {
		return "";
	}
}
async function Yc(e, t = "location") {
	try {
		let n = qc(t), r = n.length > 0 ? "query Q($segments: [String!]!) {\n          workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n        }" : "{ repository { comtryaConfig } }", i = n.length > 0 ? { segments: n } : void 0, a = await Do().query(r, i), o = ((a.workspace?.repositoryByPath?.comtryaConfig ?? a.repository?.comtryaConfig ?? null)?.projects ?? []).find((t) => t.name === e), s = (o?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0);
		return {
			defaultLabels: o?.issues?.defaultLabels ?? [],
			closeOnMerge: typeof o?.issues?.closeOnMerge == "boolean" ? o.issues.closeOnMerge : null,
			ownerRefs: s
		};
	} catch {
		return Kc;
	}
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/IssuesList.vue?vue&type=script&setup=true&lang.ts
var Xc = {
	class: "issues-queue",
	"data-smoke": "issues-list"
}, Zc = { class: "issues-queue-head" }, Qc = { class: "head-row" }, $c = ["href"], el = { class: "issues-controls" }, tl = {
	class: "issues-filter-row",
	role: "tablist",
	"aria-label": "Filter issues by state"
}, nl = ["aria-selected", "onClick"], rl = { class: "count" }, il = { class: "issues-search" }, al = ["data-busy"], ol = ["placeholder", "disabled"], sl = {
	key: 0,
	class: "quick-add-status"
}, cl = ["title"], ll = {
	key: 2,
	class: "quick-add-chip tone-yellow",
	title: "closeOnMerge=false — opt-out from PR auto-close reactor"
}, ul = ["title"], dl = {
	key: 0,
	class: "quick-add-error",
	role: "alert"
}, fl = {
	key: 1,
	class: "muted"
}, pl = {
	key: 2,
	class: "muted error",
	role: "alert"
}, ml = {
	key: 3,
	class: "muted"
}, hl = ["href"], gl = {
	key: 4,
	class: "muted"
}, _l = {
	key: 5,
	class: "issues-list",
	role: "listbox",
	"aria-label": "Issue list"
}, vl = ["aria-selected", "onMouseenter"], yl = ["href"], bl = { class: "issues-row-number" }, xl = { class: "issues-row-body" }, Sl = { class: "issues-row-title" }, Cl = { class: "issues-row-meta" }, wl = ["title"], Tl = ["data-author-kind", "title"], El = { class: "author-glyph" }, Dl = ["data-author-kind"], Ol = { class: "author-glyph" }, kl = {
	key: 0,
	class: "author-badge"
}, Al = {
	key: 1,
	class: "author-badge"
}, jl = {
	key: 2,
	class: "author-badge"
}, Ml = { class: "issues-row-age" }, Nl = /* @__PURE__ */ nc(/* @__PURE__ */ Rn({
	__name: "IssuesList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issues: { type: [Array, null] },
		workspaceId: {
			default: Ls,
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
		], r = /* @__PURE__ */ z("idle"), i = /* @__PURE__ */ z(null), a = /* @__PURE__ */ z(t.issues ?? []), o = /* @__PURE__ */ z("OPEN"), s = /* @__PURE__ */ z(""), c = /* @__PURE__ */ z(0), l = /* @__PURE__ */ z(""), u = /* @__PURE__ */ z(!1), d = /* @__PURE__ */ z(null), f = /* @__PURE__ */ z({
			defaultLabels: [],
			closeOnMerge: null,
			ownerRefs: []
		}), p = /* @__PURE__ */ z(!1), m = $(() => {
			let e = t.issues ?? a.value;
			return t.projectName ? e.filter((e) => e.projectName === t.projectName) : e;
		}), h = $(() => t.client ?? t.comtryaClient), g = $(() => {
			let e = Vs(), n = new URLSearchParams({ workspaceId: t.workspaceId });
			return t.repositoryId && n.set("repositoryId", t.repositoryId), t.projectName && n.set("projectName", t.projectName), `${e}?${n.toString()}`;
		}), _ = (e, t) => t === "ALL" ? !0 : t === "OPEN" ? e.state === "OPEN" || e.state === "REOPENED" : e.state === "CLOSED", v = $(() => {
			let e = s.value.trim().toLowerCase();
			return m.value.filter((e) => _(e, o.value)).filter((t) => {
				if (!e) return !0;
				let n = (t.authorRef ?? "").split("/").pop() ?? "";
				return `${t.number} ${t.title} ${n}`.toLowerCase().includes(e);
			});
		}), y = $(() => t.projectName ? `New issue in ${t.projectName}…` : "New issue…"), b = $(() => {
			let e = {
				OPEN: 0,
				CLOSED: 0,
				ALL: m.value.length
			};
			for (let t of m.value) (t.state === "OPEN" || t.state === "REOPENED") && (e.OPEN += 1), t.state === "CLOSED" && (e.CLOSED += 1);
			return e;
		});
		function x(e) {
			if (!e) return {
				label: "unknown",
				glyph: "·",
				kind: "unknown"
			};
			let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
			return t === "agent" ? {
				label: r,
				glyph: "✦",
				kind: "agent"
			} : t === "bot" ? {
				label: r,
				glyph: "◆",
				kind: "bot"
			} : t === "credential" ? {
				label: r,
				glyph: "⚙",
				kind: "credential"
			} : t === "team" ? {
				label: r,
				glyph: "◇",
				kind: "team"
			} : t === "user" ? {
				label: r,
				glyph: r.slice(0, 1).toUpperCase(),
				kind: "human"
			} : {
				label: r,
				glyph: r.slice(0, 1).toUpperCase() || "·",
				kind: "unknown"
			};
		}
		function S(e) {
			if (!e) return "";
			let t = Date.parse(e);
			if (Number.isNaN(t)) return e;
			let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
		}
		let C = new Set([
			"OPEN",
			"CLOSED",
			"ALL"
		]);
		function w() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = (e.get("state") ?? "").toUpperCase();
			C.has(t) && (o.value = t);
			let n = e.get("q");
			n !== null && (s.value = n);
		}
		function ee() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			o.value === "OPEN" ? e.delete("state") : e.set("state", o.value);
			let t = s.value.trim();
			t ? e.set("q", t) : e.delete("q");
			let n = e.toString(), r = `${window.location.pathname}${n ? `?${n}` : ""}${window.location.hash}`;
			r !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", r);
		}
		let T = !1;
		$n(() => {
			T = !0, w(), T = !1, re(), D(), window.addEventListener("popstate", te);
		}), rr(() => {
			window.removeEventListener("popstate", te);
		});
		function te() {
			T = !0, w(), pn(() => {
				T = !1;
			});
		}
		H([o, s], () => {
			T || ee();
		}), ds({
			j: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, v.value.length - 1));
			},
			ArrowDown: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, v.value.length - 1));
			},
			k: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			ArrowUp: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			Enter: (e) => {
				let t = v.value[c.value];
				t && (e.preventDefault(), window.location.href = Bs(t));
			},
			"/": (e) => {
				e.preventDefault(), document.querySelector("[data-issues-search]")?.focus();
			},
			c: (e) => {
				e.preventDefault(), ie();
			},
			...Object.fromEntries(n.map((e) => [e.key, (t) => {
				t.preventDefault(), o.value = e.id;
			}]))
		});
		function E(e) {
			s.value &&= (e.preventDefault(), "");
		}
		function ne(e) {
			e.preventDefault(), l.value = "", d.value = null, e.target?.blur();
		}
		H(() => [
			h.value,
			t.issues,
			t.workspaceId,
			t.repositoryId,
			t.state
		], () => void re()), H(() => t.projectName, () => void D()), H(v, (e) => {
			c.value >= e.length && (c.value = Math.max(0, e.length - 1));
		});
		async function D() {
			if (!t.projectName) {
				f.value = {
					defaultLabels: [],
					closeOnMerge: null,
					ownerRefs: []
				}, p.value = !0;
				return;
			}
			f.value = await Yc(t.projectName, "location"), p.value = !0;
		}
		async function re() {
			if (t.issues) {
				a.value = t.issues, r.value = t.issues.length > 0 ? "ready" : "empty", i.value = null;
				return;
			}
			if (!h.value) {
				a.value = [], r.value = "error", i.value = "issues: no client";
				return;
			}
			r.value = "loading", i.value = null;
			try {
				let e = await Es(h.value, {
					workspaceId: t.workspaceId,
					repositoryId: t.repositoryId,
					state: t.state
				});
				a.value = e, r.value = e.length > 0 ? "ready" : "empty";
			} catch (e) {
				a.value = [], r.value = "error", i.value = e instanceof Error ? e.message : String(e);
			}
		}
		function ie() {
			document.querySelector("[data-smoke=\"issues-quick-add\"]")?.focus();
		}
		async function O() {
			let e = l.value.trim();
			if (!(!e || u.value)) {
				u.value = !0, d.value = null;
				try {
					let n = await ks({
						workspaceId: t.workspaceId,
						repositoryId: t.repositoryId,
						projectName: t.projectName ?? null,
						title: e,
						bodyMarkdown: "",
						labels: f.value.defaultLabels,
						closeOnMerge: f.value.closeOnMerge,
						assignees: f.value.ownerRefs
					});
					a.value.some((e) => e.id === n.id) || (a.value = [n, ...a.value]), l.value = "", r.value = "ready", re(), pn(ie);
				} catch (e) {
					d.value = e instanceof Error ? e.message : String(e);
				} finally {
					u.value = !1;
				}
			}
		}
		return (t, a) => (q(), J("section", Xc, [
			Y("header", Zc, [Y("div", Qc, [Y("h2", null, j(e.title), 1), e.showNewLink ? (q(), J("a", {
				key: 0,
				href: g.value,
				class: "issues-new"
			}, "+ new", 8, $c)) : Z("", !0)]), Y("div", el, [Y("div", tl, [(q(), J(G, null, lr(n, (e) => Y("button", {
				key: e.id,
				type: "button",
				role: "tab",
				"aria-selected": o.value === e.id,
				class: A(["issues-filter", { active: o.value === e.id }]),
				onClick: (t) => o.value = e.id
			}, [
				Y("span", null, j(e.label), 1),
				Y("span", rl, j(b.value[e.id]), 1),
				Y("kbd", null, j(e.key), 1)
			], 10, nl)), 64))]), Y("label", il, [Tn(Y("input", {
				"data-issues-search": "",
				"onUpdate:modelValue": a[0] ||= (e) => s.value = e,
				type: "search",
				placeholder: "Filter by title or author",
				autocomplete: "off",
				onKeydown: mo(E, ["esc"])
			}, null, 544), [[ao, s.value]]), a[2] ||= Y("kbd", null, "/", -1)])])]),
			Y("form", {
				class: "issues-quick-add",
				"data-busy": u.value ? "true" : "false",
				onSubmit: fo(O, ["prevent"])
			}, [
				a[3] ||= Y("span", {
					class: "quick-add-glyph",
					"aria-hidden": "true"
				}, "+", -1),
				Tn(Y("input", {
					"onUpdate:modelValue": a[1] ||= (e) => l.value = e,
					"data-smoke": "issues-quick-add",
					type: "text",
					autocomplete: "off",
					placeholder: y.value,
					disabled: u.value,
					onKeydown: mo(ne, ["esc"])
				}, null, 40, ol), [[ao, l.value]]),
				u.value ? (q(), J("span", sl, "opening…")) : f.value.defaultLabels.length > 0 ? (q(), J("span", {
					key: 1,
					class: "quick-add-chip tone-teal",
					title: `Labels will be pre-stamped: ${f.value.defaultLabels.join(", ")}`
				}, " labels · " + j(f.value.defaultLabels.join(", ")), 9, cl)) : Z("", !0),
				f.value.closeOnMerge === !1 ? (q(), J("span", ll, "closeOnMerge · off")) : Z("", !0),
				f.value.ownerRefs.length > 0 ? (q(), J("span", {
					key: 3,
					class: "quick-add-chip tone-teal",
					title: `Assigned on create: ${f.value.ownerRefs.join(", ")}`
				}, "→ " + j(f.value.ownerRefs.map((e) => e.split("/").pop()).join(" · ")), 9, ul)) : Z("", !0),
				a[4] ||= Y("span", { class: "quick-add-hint" }, [
					Y("kbd", null, "↵"),
					Li(" create · "),
					Y("kbd", null, "esc"),
					Li(" clear · "),
					Y("kbd", null, "c"),
					Li(" focus ")
				], -1)
			], 40, al),
			d.value ? (q(), J("p", dl, j(d.value), 1)) : Z("", !0),
			r.value === "loading" ? (q(), J("p", fl, "Loading issues…")) : r.value === "error" ? (q(), J("p", pl, j(i.value), 1)) : m.value.length === 0 ? (q(), J("p", ml, [
				a[5] ||= Li(" No issues yet. ", -1),
				Y("a", { href: g.value }, "Create one", 8, hl),
				a[6] ||= Li(" to get started. ", -1)
			])) : v.value.length === 0 ? (q(), J("p", gl, " No issues match the current filter. ")) : (q(), J("ol", _l, [(q(!0), J(G, null, lr(v.value, (e, t) => (q(), J("li", {
				key: e.id,
				class: A(["issues-row", { focused: t === c.value }]),
				role: "option",
				"aria-selected": t === c.value,
				onMouseenter: (e) => c.value = t
			}, [Y("a", {
				href: Gt(Bs)(e),
				class: "issues-row-link"
			}, [
				Y("span", bl, "#" + j(e.number), 1),
				Y("span", xl, [Y("span", Sl, j(e.title), 1), Y("span", Cl, [
					Y("span", { class: A(["issue-state", Gt(Hs)(e.state).className]) }, j(Gt(Hs)(e.state).label), 3),
					e.projectName ? (q(), J("span", {
						key: 0,
						class: "issue-project",
						title: `Scoped to project ${e.projectName}`
					}, [a[7] ||= Y("span", { class: "project-glyph" }, "◇", -1), Li(" " + j(e.projectName), 1)], 8, wl)) : Z("", !0),
					(q(!0), J(G, null, lr(e.labels ?? [], (e) => (q(), J("span", {
						key: e,
						class: "issue-label"
					}, j(e), 1))), 128)),
					(q(!0), J(G, null, lr(e.assignees ?? [], (e) => (q(), J("span", {
						key: `assignee-${e}`,
						class: "issue-assignee",
						"data-author-kind": x(e).kind,
						title: e
					}, [Y("span", El, j(x(e).glyph), 1), Li(" " + j(x(e).label), 1)], 8, Tl))), 128)),
					e.authorRef ? (q(), J("span", {
						key: 1,
						class: "issue-author",
						"data-author-kind": x(e.authorRef).kind
					}, [
						Y("span", Ol, j(x(e.authorRef).glyph), 1),
						Li(" " + j(x(e.authorRef).label) + " ", 1),
						x(e.authorRef).kind === "agent" ? (q(), J("span", kl, "agent")) : x(e.authorRef).kind === "credential" ? (q(), J("span", Al, "bot")) : x(e.authorRef).kind === "bot" ? (q(), J("span", jl, "bot")) : Z("", !0)
					], 8, Dl)) : Z("", !0)
				])]),
				Y("span", Ml, j(S(e.createdAt)), 1)
			], 8, yl)], 42, vl))), 128))])),
			a[8] ||= Ri("<footer class=\"issues-foot\" data-v-17549a18><span data-v-17549a18><kbd data-v-17549a18>j</kbd> <kbd data-v-17549a18>k</kbd> navigate · <kbd data-v-17549a18>↵</kbd> open · <kbd data-v-17549a18>/</kbd> search · <kbd data-v-17549a18>c</kbd> create · <kbd data-v-17549a18>o</kbd> open <kbd data-v-17549a18>x</kbd> closed <kbd data-v-17549a18>a</kbd> all </span></footer>", 1)
		]));
	}
}), [["styles", [".issues-queue[data-v-17549a18]{font-family:var(--sans,system-ui);color:var(--ink,#111);gap:14px;display:grid}.issues-queue-head[data-v-17549a18]{gap:12px;display:grid}.head-row[data-v-17549a18]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.issues-queue-head h2[data-v-17549a18]{font-family:var(--display,system-ui);margin:0;font-size:22px;line-height:1}.issues-new[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border:1.5px solid var(--ink,#111);padding:6px 12px;font-size:12px;text-decoration:none}.issues-controls[data-v-17549a18]{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;display:flex}.issues-quick-add[data-v-17549a18]{border:1.5px solid var(--rule-light,#d8d1c4);background:var(--paper,#fffdf8);align-items:center;gap:8px;padding:6px 10px 6px 6px;transition:border-color .12s;display:flex}.issues-quick-add[data-v-17549a18]:focus-within{border-color:var(--ink,#111)}.issues-quick-add[data-busy=true][data-v-17549a18]{opacity:.85;border-style:dashed}.quick-add-glyph[data-v-17549a18]{width:22px;height:22px;font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border:1px solid;border-radius:2px;place-items:center;font-size:13px;display:inline-grid}.issues-quick-add input[data-v-17549a18]{min-width:0;color:inherit;font-family:var(--display,system-ui);background:0 0;border:0;outline:none;flex:1;padding:4px 0;font-size:15px}.issues-quick-add input[data-v-17549a18]::placeholder{color:var(--ink-fainter,#918b80);font-style:italic}.quick-add-status[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.quick-add-chip[data-v-17549a18]{font-family:var(--mono,monospace);letter-spacing:.02em;white-space:nowrap;border:1px solid;align-items:center;padding:1px 6px;font-size:10.5px;display:inline-flex}.quick-add-chip.tone-teal[data-v-17549a18]{color:var(--accent-teal,#087f6f)}.quick-add-chip.tone-yellow[data-v-17549a18]{color:var(--accent-yellow,#c89300)}.quick-add-hint[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--ink-fainter,#918b80);white-space:nowrap;font-size:10.5px}.quick-add-hint kbd[data-v-17549a18]{font-family:var(--mono,monospace);border:1px solid;padding:0 4px;font-size:10px}.quick-add-error[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--accent-err,#c9341c);margin:-6px 0 0;font-size:11px}.issues-filter-row[data-v-17549a18]{border:1.5px solid var(--ink,#111);flex-wrap:wrap;gap:4px;display:inline-flex}.issues-filter[data-v-17549a18]{color:inherit;cursor:pointer;font-family:var(--mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;display:inline-flex}.issues-filter[data-v-17549a18]:not(:last-child){border-right:1px solid var(--rule-light,#d8d1c4)}.issues-filter.active[data-v-17549a18]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.issues-filter .count[data-v-17549a18]{color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums}.issues-filter.active .count[data-v-17549a18]{color:var(--paper-tint,#f2efe7)}.issues-filter kbd[data-v-17549a18]{font-family:var(--mono,monospace);opacity:.6;border:1px solid;padding:0 4px;font-size:10px}.issues-search[data-v-17549a18]{border:1.5px solid var(--ink,#111);flex:240px;align-items:center;gap:8px;min-width:240px;max-width:420px;padding:4px 10px;display:inline-flex}.issues-search input[data-v-17549a18]{color:inherit;font:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0}.issues-search kbd[data-v-17549a18]{border:1px solid var(--ink,#111);font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);padding:0 4px;font-size:10px}.muted[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border-top:1.5px solid var(--rule-light,#d8d1c4);padding:18px 0;font-size:13px}.muted.error[data-v-17549a18]{color:var(--accent-err,#c9341c)}.issues-list[data-v-17549a18]{border-top:1.5px solid var(--ink,#111);margin:0;padding:0;list-style:none;display:grid}.issues-row[data-v-17549a18]{border-bottom:1px solid var(--rule-light,#d8d1c4)}.issues-row.focused[data-v-17549a18]{background:var(--paper-tint,#f2efe7)}.issues-row-link[data-v-17549a18]{color:inherit;grid-template-columns:56px 1fr auto;align-items:baseline;gap:14px;padding:12px 12px 12px 6px;text-decoration:none;display:grid}.issues-row-link[data-v-17549a18]:hover{background:var(--paper-tint,#f2efe7);text-decoration:none}.issues-row-number[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);text-align:right;font-variant-numeric:tabular-nums;font-size:12px}.issues-row-body[data-v-17549a18]{gap:4px;min-width:0;display:grid}.issues-row-title[data-v-17549a18]{font-family:var(--display,system-ui);text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;overflow:hidden}.issues-row-meta[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);flex-wrap:wrap;align-items:baseline;gap:10px;font-size:12px;display:flex}.issue-state[data-v-17549a18]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 6px;font-size:11px}.issue-state.issue-state-open[data-v-17549a18]{color:var(--accent-teal,#087f6f)}.issue-state.issue-state-closed[data-v-17549a18]{color:var(--accent-blue,#1d55a6)}.issue-project[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--accent-blue,#1d55a6);border:1px solid;align-items:center;gap:4px;padding:0 6px;font-size:11px;display:inline-flex}.issue-project .project-glyph[data-v-17549a18]{font-size:10px}.issue-label[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--accent-teal,#087f6f);letter-spacing:.02em;border:1px solid;padding:0 5px;font-size:10px}.issue-author[data-v-17549a18]{font-family:var(--mono,monospace);align-items:center;gap:5px;font-size:12px;display:inline-flex}.issue-author .author-glyph[data-v-17549a18]{width:14px;height:14px;color:var(--ink-faint,#68645c);border:1px solid;place-items:center;font-size:10px;font-weight:700;display:inline-grid}.issue-author[data-author-kind=agent][data-v-17549a18]{color:#6b3fa0}.issue-author[data-author-kind=credential][data-v-17549a18]{color:var(--accent-yellow,#c89300)}.issue-author[data-author-kind=bot][data-v-17549a18]{color:var(--accent-blue,#1d55a6)}.issue-author .author-badge[data-v-17549a18]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.issue-assignee[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);cursor:help;border:1px dashed;align-items:center;gap:4px;padding:0 5px;font-size:11px;display:inline-flex}.issue-assignee .author-glyph[data-v-17549a18]{width:12px;height:12px;color:inherit;border:0;place-items:center;font-size:9px;font-weight:700;display:inline-grid}.issue-assignee[data-author-kind=agent][data-v-17549a18]{color:#6b3fa0}.issue-assignee[data-author-kind=credential][data-v-17549a18]{color:var(--accent-yellow,#c89300)}.issue-assignee[data-author-kind=bot][data-v-17549a18]{color:var(--accent-blue,#1d55a6)}.issue-assignee[data-author-kind=team][data-v-17549a18]{color:var(--accent-teal,#087f6f)}.issues-row-age[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);white-space:nowrap;font-size:12px}.issues-foot[data-v-17549a18]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.issues-foot kbd[data-v-17549a18]{font-family:var(--mono,monospace);border:1px solid;padding:0 4px;font-size:10px}"]], ["__scopeId", "data-v-17549a18"]]), Pl = /* @__PURE__ */ new Map();
function Fl(e) {
	return [
		e.id,
		e.number,
		e.title,
		e.state
	].join("|");
}
function Il(e, t) {
	let n = [];
	return n.push(os({
		id: `ext_issues.open.${e.id}`,
		title: `Open issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: () => {
			window.location.href = Bs(e);
		}
	})), e.state === "OPEN" || e.state === "REOPENED" ? n.push(os({
		id: `ext_issues.close.${e.id}`,
		title: `Close issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: async () => {
			await As(t, e.id);
		}
	})) : e.state === "CLOSED" && n.push(os({
		id: `ext_issues.reopen.${e.id}`,
		title: `Reopen issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: async () => {
			await js(t, e.id);
		}
	})), () => n.forEach((e) => e());
}
async function Ll(e, t) {
	let n;
	try {
		n = await Es(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_issues] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = Fl(t), i = Pl.get(t.id);
		i && i.signature === n || (i?.unregister(), Pl.set(t.id, {
			signature: n,
			unregister: Il(t, e)
		}));
	}
	for (let [e, t] of Pl) r.has(e) || (t.unregister(), Pl.delete(e));
}
function Rl(e) {
	let t = Ls;
	Ll(e, t);
	let n = [
		"dev.comtrya.issues.opened",
		"dev.comtrya.issues.closed",
		"dev.comtrya.issues.reopened"
	].map((n) => Io({
		type: n,
		onEvent: () => {
			Ll(e, t);
		},
		onError: () => {}
	}));
	return () => {
		for (let e of n) e();
		for (let e of Pl.values()) e.unregister();
		Pl.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/register.ts
var zl = "ext_issues", Bl = "comtrya-issue-card", Vl = "comtrya-issues-list", Hl = "comtrya-issues-repo-list", Ul = "comtrya-issue-detail", Wl = "comtrya-issue-relationships", Gl = "comtrya-issue-new";
fs({
	tagName: Bl,
	component: rc,
	propertyAliases: { ref: "resourceRef" }
}), fs({
	tagName: Vl,
	component: Nl
}), fs({
	tagName: Hl,
	component: Nl
}), fs({
	tagName: Ul,
	component: kc
}), fs({
	tagName: Wl,
	component: Gc
}), ql();
var Kl = {
	id: zl,
	setup(e) {
		e.registerCard({
			resourceKind: "issue",
			element: Bl,
			requiredPermission: "issues.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "issue",
			loadTargets: async (t) => (await Es(e.client, {
				workspaceId: t.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
				repositoryId: t.repositoryId
			})).map((e) => ({
				ref: Rs(e),
				kind: "issue",
				title: `#${e.number} ${e.title}`,
				subtitle: e.state.toLowerCase()
			}))
		}), e.registerWidget({
			id: "issues-list",
			element: Vl,
			defaultSlot: "repository.main",
			defaultPriority: 100,
			requiredPermission: "issues.read"
		}), e.registerRoute("/", {
			element: Vl,
			requiredPermission: "issues.read"
		}), e.registerRoute("/new", {
			element: Gl,
			requiredPermission: "issues.write"
		}), e.registerRoute("/:workspaceId/:number", {
			element: Ul,
			requiredPermission: "issues.read"
		}), Rl(e.client);
	}
};
function ql() {
	if (typeof customElements > "u" || customElements.get(Gl)) return;
	class e extends HTMLElement {
		routeParams;
		workspaceId;
		repositoryId;
		connectedCallback() {
			this.replaceChildren(Yl(Jl(this.routeParams, this)));
		}
	}
	customElements.define(Gl, e);
}
function Jl(e, t = {}) {
	let n = new URLSearchParams(window.location.search);
	return {
		workspaceId: n.get("workspaceId") ?? t.workspaceId ?? e?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
		repositoryId: n.get("repositoryId") ?? t.repositoryId ?? e?.params?.repositoryId ?? null,
		projectName: n.get("projectName") ?? t.projectName ?? e?.params?.projectName ?? null
	};
}
function Yl(e) {
	$l();
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
	let o = Xl("Title"), s = document.createElement("input");
	s.required = !0, s.placeholder = "What needs to be done?", o.append(s);
	let c = Xl("Description", "Optional. Supports Markdown."), l = document.createElement("textarea");
	l.rows = 6, l.placeholder = "Add context, repro steps, links…", c.append(l);
	let u = Xl("Labels"), d = document.createElement("input");
	d.placeholder = "comma-separated", d.dataset.smoke = "issue-new-labels", u.append(d);
	let f = document.createElement("p");
	f.className = "issue-new-hint", f.hidden = !0, u.append(f);
	let p = document.createElement("div");
	p.className = "issue-new-policy", p.hidden = !0, p.dataset.smoke = "issue-new-policy";
	let m = null;
	e.projectName && Yc(e.projectName, "referrer").then((t) => {
		if (t.defaultLabels.length > 0 && (d.value.trim().length === 0 && (d.value = t.defaultLabels.join(", ")), f.hidden = !1, f.textContent = `Pre-filled from CUE · ${e.projectName} → issues.defaultLabels`), m = t.closeOnMerge, t.closeOnMerge !== null) {
			p.hidden = !1;
			let e = document.createElement("span");
			e.className = `issue-new-chip ${t.closeOnMerge ? "chip-on" : "chip-off"}`, e.textContent = t.closeOnMerge ? "closeOnMerge · on" : "closeOnMerge · off";
			let n = document.createElement("span");
			n.className = "issue-new-chip-detail", n.textContent = t.closeOnMerge ? "Auto-closes when a linked PR merges." : "Stays open when a linked PR merges.", p.replaceChildren(e, n);
		}
	});
	let h = document.createElement("div");
	h.className = "issue-new-actions";
	let g = document.createElement("button");
	g.type = "submit", g.className = "issue-new-submit", g.textContent = "Create issue", h.append(g);
	let _ = document.createElement("p");
	return _.className = "issue-new-error", _.setAttribute("role", "alert"), _.hidden = !0, a.append(o, c, u, p, h, _), a.addEventListener("submit", (t) => {
		t.preventDefault(), g.disabled = !0, _.hidden = !0, ks({
			workspaceId: e.workspaceId,
			repositoryId: e.repositoryId,
			projectName: e.projectName ?? null,
			title: s.value.trim(),
			bodyMarkdown: l.value,
			labels: eu(d.value),
			closeOnMerge: m
		}).then((e) => {
			window.location.assign(Bs(e));
		}).catch((e) => {
			_.textContent = e instanceof Error ? e.message : String(e), _.hidden = !1, g.disabled = !1;
		});
	}), t.append(n, a), t;
}
function Xl(e, t) {
	let n = document.createElement("div");
	n.className = "issue-new-field";
	let r = document.createElement("label");
	if (r.className = "issue-new-label", r.textContent = e, n.append(r), t) {
		let e = document.createElement("span");
		e.className = "issue-new-hint", e.textContent = t, n.append(e);
	}
	return n;
}
var Zl = "comtrya-issue-new-styles", Ql = "\n.issue-new {\n  display: grid;\n  gap: 24px;\n  max-width: 720px;\n  font-family: var(--sans, system-ui);\n  color: var(--ink, #111);\n}\n.issue-new-head {\n  display: grid;\n  gap: 6px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 14px;\n}\n.issue-new-overline {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #68645c);\n}\n.issue-new h1 {\n  margin: 0;\n  font-family: var(--display, system-ui);\n  font-size: 36px;\n  line-height: 1;\n}\n.issue-new-form {\n  display: grid;\n  gap: 18px;\n}\n.issue-new-field {\n  display: grid;\n  gap: 6px;\n}\n.issue-new-label {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #68645c);\n}\n.issue-new-hint {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-fainter, #918b80);\n}\n.issue-new input,\n.issue-new textarea {\n  width: 100%;\n  border: 1.5px solid var(--rule-light, #d8d1c4);\n  background: var(--paper, #fffdf8);\n  color: var(--ink, #111);\n  padding: 10px 12px;\n  font-family: var(--mono, monospace);\n  font-size: 13px;\n  outline: none;\n  transition: border-color 120ms ease;\n}\n.issue-new input:focus,\n.issue-new textarea:focus {\n  border-color: var(--ink, #111);\n}\n.issue-new textarea {\n  resize: vertical;\n  font-family: var(--mono, monospace);\n}\n.issue-new-policy {\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  flex-wrap: wrap;\n  border: 1px dashed var(--rule-light, #d8d1c4);\n  padding: 8px 12px;\n  background: var(--paper-tint, #f2efe7);\n}\n.issue-new-chip {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  border: 1px solid currentColor;\n  padding: 1px 6px;\n}\n.issue-new-chip.chip-on {\n  color: var(--accent-teal, #087f6f);\n}\n.issue-new-chip.chip-off {\n  color: var(--accent-yellow, #c89300);\n}\n.issue-new-chip-detail {\n  font-family: var(--sans, system-ui);\n  font-size: 12px;\n  color: var(--ink-soft, #2c2b28);\n}\n.issue-new-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding-top: 4px;\n}\n.issue-new-submit {\n  border: 1.5px solid var(--ink, #111);\n  background: var(--ink, #111);\n  color: var(--paper, #fffdf8);\n  padding: 10px 18px;\n  font-family: var(--display, system-ui);\n  font-weight: 600;\n  font-size: 13px;\n  cursor: pointer;\n}\n.issue-new-submit:disabled {\n  background: var(--ink-faint, #68645c);\n  cursor: wait;\n}\n.issue-new-error {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--accent-err, #c9341c);\n}\n";
function $l() {
	if (typeof document > "u" || document.getElementById(Zl)) return;
	let e = document.createElement("style");
	e.id = Zl, e.textContent = Ql, document.head.appendChild(e);
}
function eu(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e.split(",")) {
		let e = r.trim();
		e && (t.has(e) || (t.add(e), n.push(e)));
	}
	return n;
}
//#endregion
export { Kl as default };
