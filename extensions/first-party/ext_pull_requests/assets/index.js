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
function k(e) {
	let t = "";
	if (g(e)) t = e;
	else if (d(e)) for (let n = 0; n < e.length; n++) {
		let r = k(e[n]);
		r && (t += r + " ");
	}
	else if (v(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var ge = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", _e = /* @__PURE__ */ e(ge);
ge + "";
function ve(e) {
	return !!e || e === "";
}
function ye(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = be(e[r], t[r]);
	return n;
}
function be(e, t) {
	if (e === t) return !0;
	let n = m(e), r = m(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = _(e), r = _(t), n || r) return e === t;
	if (n = d(e), r = d(t), n || r) return n && r ? ye(e, t) : !1;
	if (n = v(e), r = v(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !be(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
var xe = (e) => !!(e && e.__v_isRef === !0), A = (e) => g(e) ? e : e == null ? "" : d(e) || v(e) && (e.toString === b || !h(e.toString)) ? xe(e) ? A(e.value) : JSON.stringify(e, Se, 2) : String(e), Se = (e, t) => xe(t) ? Se(e, t.value) : f(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[Ce(t, r) + " =>"] = n, e), {}) } : p(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => Ce(e)) } : _(t) ? Ce(t) : v(t) && !d(t) && !C(t) ? String(t) : t, Ce = (e, t = "") => _(e) ? `Symbol(${e.description ?? t})` : e, j, we = class {
	constructor(e = !1) {
		this.detached = e, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !e && j && (j.active ? (this.parent = j, this.index = (j.scopes ||= []).push(this) - 1) : (this._active = !1, this._warnOnRun = !1));
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
			let t = j;
			try {
				return j = this, e();
			} finally {
				j = t;
			}
		}
	}
	on() {
		++this._on === 1 && (this.prevScope = j, j = this);
	}
	off() {
		if (this._on > 0 && --this._on === 0) {
			if (j === this) j = this.prevScope;
			else {
				let e = j;
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
	return j;
}
var M, Ee = /* @__PURE__ */ new WeakSet(), De = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, j && (j.active ? j.effects.push(this) : this.flags &= -2);
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
		let e = M, t = Be;
		M = this, Be = !0;
		try {
			return this.fn();
		} finally {
			Fe(this), M = e, Be = t, this.flags &= -3;
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
	let t = e.dep, n = M, r = Be;
	M = e, Be = !0;
	try {
		Pe(e);
		let n = e.fn(e._value);
		(t.version === 0 || D(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		M = n, Be = r, Fe(e), e.flags &= -3;
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
		let e = M;
		M = void 0;
		try {
			t();
		} finally {
			M = e;
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
		if (!M || !Be || M === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== M) t = this.activeLink = new Ke(M, this), M.deps ? (t.prevDep = M.depsTail, M.depsTail.nextDep = t, M.depsTail = t) : M.deps = M.depsTail = t, Je(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = M.depsTail, t.nextDep = void 0, M.depsTail.nextDep = t, M.depsTail = t, M.deps === t && (M.deps = e);
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
function N(e, t, n) {
	if (Be && M) {
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
	let t = /* @__PURE__ */ P(e);
	return t === e ? t : (N(t, "iterate", Qe), /* @__PURE__ */ Bt(e) ? t : t.map(Ut));
}
function tt(e) {
	return N(e = /* @__PURE__ */ P(e), "iterate", Qe), e;
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
	let r = /* @__PURE__ */ P(e);
	N(r, "iterate", Qe);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ Vt(n[0]) ? (n[0] = /* @__PURE__ */ P(n[0]), r[t](...n)) : i;
}
function lt(e, t, n = []) {
	He(), Me();
	let r = (/* @__PURE__ */ P(e))[t].apply(e, n);
	return Ne(), Ue(), r;
}
var ut = /* @__PURE__ */ e("__proto__,__v_isRef,__isVue"), dt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(_));
function ft(e) {
	_(e) || (e = String(e));
	let t = /* @__PURE__ */ P(this);
	return N(t, "has", e), t.hasOwnProperty(e);
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
		let o = Reflect.get(e, t, /* @__PURE__ */ F(e) ? e : n);
		if ((_(t) ? dt.has(t) : ut(t)) || (r || N(e, "get", t), i)) return o;
		if (/* @__PURE__ */ F(o)) {
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
			if (!/* @__PURE__ */ Bt(n) && !/* @__PURE__ */ zt(n) && (i = /* @__PURE__ */ P(i), n = /* @__PURE__ */ P(n)), !a && /* @__PURE__ */ F(i) && !/* @__PURE__ */ F(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : u(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ F(e) ? e : r);
		return e === /* @__PURE__ */ P(r) && (o ? D(n, i) && $e(e, "set", t, n, i) : $e(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = u(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && $e(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!_(t) || !dt.has(t)) && N(e, "has", t), n;
	}
	ownKeys(e) {
		return N(e, "iterate", d(e) ? "length" : Xe), Reflect.ownKeys(e);
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
		let i = this.__v_raw, a = /* @__PURE__ */ P(i), o = f(a), c = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, u = i[e](...r), d = n ? yt : t ? Wt : Ut;
		return !t && N(a, "iterate", l ? Ze : Xe), s(Object.create(u), { next() {
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
			let r = this.__v_raw, i = /* @__PURE__ */ P(r), a = /* @__PURE__ */ P(n);
			e || (D(n, a) && N(i, "get", n), N(i, "get", a));
			let { has: o } = bt(i), s = t ? yt : e ? Wt : Ut;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && N(/* @__PURE__ */ P(t), "iterate", Xe), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ P(n), i = /* @__PURE__ */ P(t);
			return e || (D(t, i) && N(r, "has", t), N(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ P(a), s = t ? yt : e ? Wt : Ut;
			return !e && N(o, "iterate", Xe), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return s(n, e ? {
		add: St("add"),
		set: St("set"),
		delete: St("delete"),
		clear: St("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ P(this), r = bt(n), i = /* @__PURE__ */ P(e), a = !t && !/* @__PURE__ */ Bt(e) && !/* @__PURE__ */ zt(e) ? i : e;
			return r.has.call(n, a) || D(e, a) && r.has.call(n, e) || D(i, a) && r.has.call(n, i) || (n.add(a), $e(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ Bt(n) && !/* @__PURE__ */ zt(n) && (n = /* @__PURE__ */ P(n));
			let r = /* @__PURE__ */ P(this), { has: i, get: a } = bt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ P(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? D(n, s) && $e(r, "set", e, n, s) : $e(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ P(this), { has: n, get: r } = bt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ P(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && $e(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ P(this), t = e.size !== 0, n = e.clear();
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
function P(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ P(t) : e;
}
function Ht(e) {
	return !u(e, "__v_skip") && Object.isExtensible(e) && O(e, "__v_skip", !0), e;
}
var Ut = (e) => v(e) ? /* @__PURE__ */ Pt(e) : e, Wt = (e) => v(e) ? /* @__PURE__ */ It(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function F(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function I(e) {
	return Gt(e, !1);
}
function Gt(e, t) {
	return /* @__PURE__ */ F(e) ? e : new Kt(e, t);
}
var Kt = class {
	constructor(e, t) {
		this.dep = new qe(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ P(e), this._value = t ? e : Ut(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ Bt(e) || /* @__PURE__ */ zt(e);
		e = n ? e : /* @__PURE__ */ P(e), D(e, t) && (this._rawValue = e, this._value = n ? e : Ut(e), this.dep.trigger());
	}
};
function L(e) {
	return /* @__PURE__ */ F(e) ? e.value : e;
}
var qt = {
	get: (e, t, n) => t === "__v_raw" ? e : L(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ F(i) && !/* @__PURE__ */ F(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
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
		if (this.flags |= 16, !(this.flags & 8) && M !== this) return je(this, !0), !0;
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
	if (/* @__PURE__ */ F(e) ? (g = () => e.value, y = /* @__PURE__ */ Bt(e)) : /* @__PURE__ */ Rt(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some((e) => /* @__PURE__ */ Rt(e) || /* @__PURE__ */ Bt(e)), g = () => e.map((e) => {
		if (/* @__PURE__ */ F(e)) return e.value;
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
	if (n.set(e, t), t--, /* @__PURE__ */ F(e)) nn(e.value, t, n);
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
var R = [], cn = -1, ln = [], un = null, dn = 0, fn = /* @__PURE__ */ Promise.resolve(), pn = null;
function mn(e) {
	let t = pn || fn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function hn(e) {
	let t = cn + 1, n = R.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = R[r], a = xn(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function gn(e) {
	if (!(e.flags & 1)) {
		let t = xn(e), n = R[R.length - 1];
		!n || !(e.flags & 2) && t >= xn(n) ? R.push(e) : R.splice(hn(t), 0, e), e.flags |= 1, _n();
	}
}
function _n() {
	pn ||= fn.then(Sn);
}
function vn(e) {
	d(e) ? ln.push(...e) : un && e.id === -1 ? un.splice(dn + 1, 0, e) : e.flags & 1 || (ln.push(e), e.flags |= 1), _n();
}
function yn(e, t, n = cn + 1) {
	for (; n < R.length; n++) {
		let t = R[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			R.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
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
		for (cn = 0; cn < R.length; cn++) {
			let e = R[cn];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), rn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; cn < R.length; cn++) {
			let e = R[cn];
			e && (e.flags &= -2);
		}
		cn = -1, R.length = 0, bn(e), pn = null, (R.length || ln.length) && Sn(e);
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
	let r = ua(Cn), i = e.dirs ||= [];
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
	if (Y) {
		let n = Y.provides, r = Y.parent && Y.parent.provides;
		r === n && (n = Y.provides = Object.create(r)), n[e] = t;
	}
}
function An(e, t, n = !1) {
	let r = Yi();
	if (r || Pr) {
		let i = Pr ? Pr._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t;
	}
}
var jn = /* @__PURE__ */ Symbol.for("v-scx"), Mn = () => An(jn);
function z(e, t, n) {
	return Nn(e, t, n);
}
function Nn(e, n, i = t) {
	let { immediate: a, deep: o, flush: c, once: l } = i, u = s({}, i), d = n && a || !n && c !== "post", f;
	if (ta) {
		if (c === "sync") {
			let e = Mn();
			f = e.__watcherHandles ||= [];
		} else if (!d) {
			let e = () => {};
			return e.stop = r, e.resume = r, e.pause = r, e;
		}
	}
	let p = Y;
	u.call = (e, t, n) => an(e, p, t, n);
	let m = !1;
	c === "post" ? u.scheduler = (e) => {
		V(e, p && p.suspense);
	} : c !== "sync" && (m = !0, u.scheduler = (e, t) => {
		t ? e() : gn(e);
	}), u.augmentJob = (e) => {
		n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p));
	};
	let h = tn(e, n, u);
	return ta && (f ? f.push(h) : d && h()), h;
}
function Pn(e, t, n) {
	let r = this.proxy, i = g(e) ? e.includes(".") ? Fn(r, e) : () => r[e] : e.bind(r, r), a;
	h(t) ? a = t : (a = t.handler, n = t);
	let o = Qi(this), s = Nn(i, a.bind(r), n);
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
	let s = a.shapeFlag & 4 ? ua(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ P(v), b = v === t ? i : (e) => Hn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Hn(_, t));
	if (m != null && m !== p) {
		if (Gn(n), g(m)) _[m] = null, b(m) && (v[m] = null);
		else if (/* @__PURE__ */ F(m)) {
			let e = n;
			x(m, e.k) && (m.value = null), e.k && (_[e.k] = null);
		}
	}
	if (h(p)) rn(p, f, 12, [l, _]);
	else {
		let t = g(p), n = /* @__PURE__ */ F(p);
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
				t.id = -1, Un.set(e, t), V(t, r);
			} else Gn(e), i();
		}
	}
}
function Gn(e) {
	let t = Un.get(e);
	t && (t.flags |= 8, Un.delete(e));
}
ue().requestIdleCallback, ue().cancelIdleCallback;
var Kn = (e) => !!e.type.__asyncLoader, qn = (e) => e.type.__isKeepAlive;
function Jn(e, t) {
	Xn(e, "a", t);
}
function Yn(e, t) {
	Xn(e, "da", t);
}
function Xn(e, t, n = Y) {
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
function Qn(e, t, n = Y, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			He();
			let i = Qi(n), a = an(t, n, e, r);
			return i(), Ue(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var $n = (e) => (t, n = Y) => {
	(!ta || e === "sp") && Qn(e, (...e) => t(...e), n);
}, er = $n("bm"), tr = $n("m"), nr = $n("bu"), rr = $n("u"), ir = $n("bum"), ar = $n("um"), or = $n("sp"), sr = $n("rtg"), cr = $n("rtc");
function lr(e, t = Y) {
	Qn("ec", e, t);
}
var ur = /* @__PURE__ */ Symbol.for("v-ndc");
function dr(e, t, n, r) {
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
var fr = (e) => e ? ea(e) ? ua(e) : fr(e.parent) : null, pr = /* @__PURE__ */ s(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => fr(e.parent),
	$root: (e) => fr(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => Sr(e),
	$forceUpdate: (e) => e.f ||= () => {
		gn(e.update);
	},
	$nextTick: (e) => e.n ||= mn.bind(e.proxy),
	$watch: (e) => Pn.bind(e)
}), mr = (e, n) => e !== t && !e.__isScriptSetup && u(e, n), hr = {
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
			else if (mr(i, n)) return s[n] = 1, i[n];
			else if (a !== t && u(a, n)) return s[n] = 2, a[n];
			else if (u(o, n)) return s[n] = 3, o[n];
			else if (r !== t && u(r, n)) return s[n] = 4, r[n];
			else _r && (s[n] = 0);
		}
		let d = pr[n], f, p;
		if (d) return n === "$attrs" && N(e.attrs, "get", ""), d(e);
		if ((f = c.__cssModules) && (f = f[n])) return f;
		if (r !== t && u(r, n)) return s[n] = 4, r[n];
		if (p = l.config.globalProperties, u(p, n)) return p[n];
	},
	set({ _: e }, n, r) {
		let { data: i, setupState: a, ctx: o } = e;
		return mr(a, n) ? (a[n] = r, !0) : i !== t && u(i, n) ? (i[n] = r, !0) : u(e.props, n) || n[0] === "$" && n.slice(1) in e ? !1 : (o[n] = r, !0);
	},
	has({ _: { data: e, setupState: n, accessCache: r, ctx: i, appContext: a, props: o, type: s } }, c) {
		let l;
		return !!(r[c] || e !== t && c[0] !== "$" && u(e, c) || mr(n, c) || u(o, c) || u(i, c) || u(pr, c) || u(a.config.globalProperties, c) || (l = s.__cssModules) && l[c]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? u(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function gr(e) {
	return d(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var _r = !0;
function vr(e) {
	let t = Sr(e), n = e.proxy, i = e.ctx;
	_r = !1, t.beforeCreate && br(t.beforeCreate, e, "bc");
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: ee, renderTracked: te, renderTriggered: ne, errorCaptured: T, serverPrefetch: re, expose: E, inheritAttrs: ie, components: ae, directives: D, filters: oe } = t;
	if (u && yr(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Pt(t));
	}
	if (_r = !0, o) for (let e in o) {
		let t = o[e], a = X({
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
	if (c) for (let e in c) xr(c[e], i, n, e);
	if (l) {
		let e = h(l) ? l.call(n) : l;
		Reflect.ownKeys(e).forEach((t) => {
			kn(t, e[t]);
		});
	}
	f && br(f, e, "c");
	function O(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (O(er, p), O(tr, m), O(nr, g), O(rr, _), O(Jn, y), O(Yn, b), O(lr, T), O(cr, te), O(sr, ne), O(ir, S), O(ar, w), O(or, re), d(E)) if (E.length) {
		let t = e.exposed ||= {};
		E.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	ee && e.render === r && (e.render = ee), ie != null && (e.inheritAttrs = ie), ae && (e.components = ae), D && (e.directives = D), re && Vn(e);
}
function yr(e, t, n = r) {
	d(e) && (e = Dr(e));
	for (let n in e) {
		let r = e[n], i;
		i = v(r) ? "default" in r ? An(r.from || n, r.default, !0) : An(r.from || n) : An(r), /* @__PURE__ */ F(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function br(e, t, n) {
	an(d(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function xr(e, t, n, r) {
	let i = r.includes(".") ? Fn(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && z(i, n);
	} else if (h(e)) z(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => xr(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && z(i, r, e);
	}
}
function Sr(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => Cr(c, e, o, !0)), Cr(c, t, o)), v(t) && a.set(t, c), c;
}
function Cr(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && Cr(e, a, n, !0), i && i.forEach((t) => Cr(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = wr[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var wr = {
	data: Tr,
	props: kr,
	emits: kr,
	methods: Or,
	computed: Or,
	beforeCreate: B,
	created: B,
	beforeMount: B,
	mounted: B,
	beforeUpdate: B,
	updated: B,
	beforeDestroy: B,
	beforeUnmount: B,
	destroyed: B,
	unmounted: B,
	activated: B,
	deactivated: B,
	errorCaptured: B,
	serverPrefetch: B,
	components: Or,
	directives: Or,
	watch: Ar,
	provide: Tr,
	inject: Er
};
function Tr(e, t) {
	return t ? e ? function() {
		return s(h(e) ? e.call(this, this) : e, h(t) ? t.call(this, this) : t);
	} : t : e;
}
function Er(e, t) {
	return Or(Dr(e), Dr(t));
}
function Dr(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function B(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function Or(e, t) {
	return e ? s(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function kr(e, t) {
	return e ? d(e) && d(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : s(/* @__PURE__ */ Object.create(null), gr(e), gr(t ?? {})) : t;
}
function Ar(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = s(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = B(e[r], t[r]);
	return n;
}
function jr() {
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
var Mr = 0;
function Nr(e, t) {
	return function(n, r = null) {
		h(n) || (n = s({}, n)), r != null && !v(r) && (r = null);
		let i = jr(), a = /* @__PURE__ */ new WeakSet(), o = [], c = !1, l = i.app = {
			_uid: Mr++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: fa,
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
					let u = l._ceVNode || Ii(n, r);
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, ua(u.component);
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
				let t = Pr;
				Pr = l;
				try {
					return e();
				} finally {
					Pr = t;
				}
			}
		};
		return l;
	};
}
var Pr = null, Fr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${T(t)}Modifiers`] || e[`${E(t)}Modifiers`];
function Ir(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && Fr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(se)));
	let c, l = i[c = ae(n)] || i[c = ae(T(n))];
	!l && o && (l = i[c = ae(E(n))]), l && an(l, e, 6, a);
	let u = i[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, an(u, e, 6, a);
	}
}
var Lr = /* @__PURE__ */ new WeakMap();
function Rr(e, t, n = !1) {
	let r = n ? Lr : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, c = !1;
	if (!h(e)) {
		let r = (e) => {
			let n = Rr(e, t, !0);
			n && (c = !0, s(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !c ? (v(e) && r.set(e, null), null) : (d(a) ? a.forEach((e) => o[e] = null) : s(o, a), v(e) && r.set(e, o), o);
}
function zr(e, t) {
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, E(t)) || u(e, t));
}
function Br(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: s, attrs: c, emit: l, render: u, renderCache: d, props: f, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = Tn(e), v, y;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			v = Vi(u.call(t, e, d, f, m, p, h)), y = c;
		} else {
			let e = t;
			v = Vi(e.length > 1 ? e(f, {
				attrs: c,
				slots: s,
				emit: l
			}) : e(f, null)), y = t.props ? c : Vr(c);
		}
	} catch (t) {
		Ei.length = 0, on(t, e, 1), v = Ii(wi);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = Hr(y, a)), b = zi(b, y, !1, !0));
	}
	return n.dirs && (b = zi(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && zn(b, n.transition), v = b, Tn(_), v;
}
var Vr = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || a(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, Hr = (e, t) => {
	let n = {};
	for (let r in e) (!o(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function Ur(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? Wr(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (Gr(o, r, n) && !zr(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? Wr(r, o, l) : !0 : !!o;
	return !1;
}
function Wr(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (Gr(t, e, a) && !zr(n, a)) return !0;
	}
	return !1;
}
function Gr(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && v(r) && v(i) ? !be(r, i) : r !== i;
}
function Kr({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var qr = {}, Jr = () => Object.create(qr), Yr = (e) => Object.getPrototypeOf(e) === qr;
function Xr(e, t, n, r = !1) {
	let i = {}, a = Jr();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), Qr(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ Ft(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Zr(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ P(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (zr(e.emitsOptions, o)) continue;
				let d = t[o];
				if (c) if (u(a, o)) d !== a[o] && (a[o] = d, l = !0);
				else {
					let t = T(o);
					i[t] = $r(c, s, t, d, e, !1);
				}
				else d !== a[o] && (a[o] = d, l = !0);
			}
		}
	} else {
		Qr(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !u(t, a) && ((r = E(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = $r(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !u(t, e)) && (delete a[e], l = !0);
	}
	l && $e(e.attrs, "set", "");
}
function Qr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (ee(t)) continue;
		let l = n[t], d;
		a && u(a, d = T(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : zr(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ P(r), i = c || t;
		for (let t = 0; t < o.length; t++) {
			let s = o[t];
			r[s] = $r(a, n, s, i[s], e, !u(i, s));
		}
	}
	return s;
}
function $r(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = u(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && h(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = Qi(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === E(n)) && (r = !0));
	}
	return r;
}
var ei = /* @__PURE__ */ new WeakMap();
function ti(e, r, i = !1) {
	let a = i ? ei : r.propsCache, o = a.get(e);
	if (o) return o;
	let c = e.props, l = {}, f = [], p = !1;
	if (!h(e)) {
		let t = (e) => {
			p = !0;
			let [t, n] = ti(e, r, !0);
			s(l, t), n && f.push(...n);
		};
		!i && r.mixins.length && r.mixins.forEach(t), e.extends && t(e.extends), e.mixins && e.mixins.forEach(t);
	}
	if (!c && !p) return v(e) && a.set(e, n), n;
	if (d(c)) for (let e = 0; e < c.length; e++) {
		let n = T(c[e]);
		ni(n) && (l[n] = t);
	}
	else if (c) for (let e in c) {
		let t = T(e);
		if (ni(t)) {
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
function ni(e) {
	return e[0] !== "$" && !ee(e);
}
var ri = (e) => e === "_" || e === "_ctx" || e === "$stable", ii = (e) => d(e) ? e.map(Vi) : [Vi(e)], ai = (e, t, n) => {
	if (t._n) return t;
	let r = En((...e) => ii(t(...e)), n);
	return r._c = !1, r;
}, oi = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (ri(n)) continue;
		let i = e[n];
		if (h(i)) t[n] = ai(n, i, r);
		else if (i != null) {
			let e = ii(i);
			t[n] = () => e;
		}
	}
}, si = (e, t) => {
	let n = ii(t);
	e.slots.default = () => n;
}, ci = (e, t, n) => {
	for (let r in t) (n || !ri(r)) && (e[r] = t[r]);
}, li = (e, t, n) => {
	let r = e.slots = Jr();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (ci(r, t, n), n && O(r, "_", e, !0)) : oi(t, r);
	} else t && si(e, t);
}, ui = (e, n, r) => {
	let { vnode: i, slots: a } = e, o = !0, s = t;
	if (i.shapeFlag & 32) {
		let e = n._;
		e ? r && e === 1 ? o = !1 : ci(a, n, r) : (o = !n.$stable, oi(n, a)), s = n;
	} else n && (si(e, n), s = { default: 1 });
	if (o) for (let e in a) !ri(e) && s[e] == null && delete a[e];
}, V = Si;
function di(e) {
	return fi(e);
}
function fi(e, i) {
	let a = ue();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Ni(e, t) && (r = ye(e), he(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case Ci:
				y(e, t, n, r);
				break;
			case wi:
				b(e, t, n, r);
				break;
			case Ti:
				e ?? x(t, n, r, o);
				break;
			case H:
				ae(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? D(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, A);
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
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && T(e.children, d, null, r, i, pi(e, a), s, u), _ && On(e, null, r, "created"), ne(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !ee(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Gi(f, r, e);
		}
		_ && On(e, null, r, "beforeMount");
		let v = hi(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && V(() => {
			try {
				f && Gi(f, r, e), v && g.enter(d), _ && On(e, null, r, "mounted");
			} finally {}
		}, i);
	}, ne = (e, t, n, r, i) => {
		if (n && g(e, n), r) for (let t = 0; t < r.length; t++) g(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || xi(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				ne(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, T = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? Hi(e[l]) : Vi(e[l]), t, n, r, i, a, o, s);
	}, re = (e, n, r, i, a, o, s) => {
		let l = n.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = n;
		u |= e.patchFlag & 16;
		let m = e.props || t, h = n.props || t, g;
		if (r && mi(r, !1), (g = h.onVnodeBeforeUpdate) && Gi(g, r, n, e), f && On(n, e, r, "beforeUpdate"), r && mi(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? E(e.dynamicChildren, d, l, r, i, pi(n, a), o) : s || de(e, n, l, null, r, i, pi(n, a), o, !1), u > 0) {
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
		((g = h.onVnodeUpdated) || f) && V(() => {
			g && Gi(g, r, n, e), f && On(n, e, r, "updated");
		}, i);
	}, E = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === H || !Ni(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
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
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), T(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (E(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && gi(e, t, !0)) : de(e, t, n, f, i, a, s, c, l);
	}, D = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : O(t, n, r, i, a, o, c) : se(e, t, c);
	}, O = (e, t, n, r, i, a, o) => {
		let s = e.component = Ji(e, r, i);
		if (qn(e) && (s.ctx.renderer = A), na(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, ce, o), !e.el) {
				let r = s.subTree = Ii(wi);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else ce(s, e, t, n, i, a, o);
	}, se = (e, t, n) => {
		let r = t.component = e.component;
		if (Ur(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			le(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, ce = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = vi(e);
					if (n) {
						t && (t.el = c.el, le(e, t, o)), n.asyncDep.then(() => {
							V(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				mi(e, !1), t ? (t.el = c.el, le(e, t, o)) : t = c, n && oe(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Gi(d, s, t, c), mi(e, !0);
				let f = Br(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ye(p), e, i, a), t.el = f.el, u === null && Kr(e, f.el), r && V(r, i), (d = t.props && t.props.onVnodeUpdated) && V(() => Gi(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Kn(t);
				if (mi(e, !1), l && oe(l), !m && (o = c && c.onVnodeBeforeMount) && Gi(o, d, t), mi(e, !0), s && Ce) {
					let t = () => {
						e.subTree = Br(e), Ce(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Br(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && V(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					V(() => Gi(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Kn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && V(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new De(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => gn(u), mi(e, !0), l();
	}, le = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Zr(e, t.props, r, n), ui(e, t.children, n), He(), yn(e), Ue();
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
		m & 8 ? (u & 16 && ve(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? pe(l, d, n, r, i, a, o, s, c) : ve(l, i, a, !0) : (u & 8 && p(n, ""), m & 16 && T(d, n, r, i, a, o, s, c));
	}, fe = (e, t, r, i, a, o, s, c, l) => {
		e ||= n, t ||= n;
		let u = e.length, d = t.length, f = Math.min(u, d), p;
		for (p = 0; p < f; p++) {
			let n = t[p] = l ? Hi(t[p]) : Vi(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? ve(e, a, o, !0, !1, f) : T(t, r, i, a, o, s, c, l, f);
	}, pe = (e, t, r, i, a, o, s, c, l) => {
		let u = 0, d = t.length, f = e.length - 1, p = d - 1;
		for (; u <= f && u <= p;) {
			let n = e[u], i = t[u] = l ? Hi(t[u]) : Vi(t[u]);
			if (Ni(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			u++;
		}
		for (; u <= f && u <= p;) {
			let n = e[f], i = t[p] = l ? Hi(t[p]) : Vi(t[p]);
			if (Ni(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			f--, p--;
		}
		if (u > f) {
			if (u <= p) {
				let e = p + 1, n = e < d ? t[e].el : i;
				for (; u <= p;) v(null, t[u] = l ? Hi(t[u]) : Vi(t[u]), r, n, a, o, s, c, l), u++;
			}
		} else if (u > p) for (; u <= f;) he(e[u], a, o, !0), u++;
		else {
			let m = u, h = u, g = /* @__PURE__ */ new Map();
			for (u = h; u <= p; u++) {
				let e = t[u] = l ? Hi(t[u]) : Vi(t[u]);
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
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && Ni(n, t[_])) {
					i = _;
					break;
				}
				i === void 0 ? he(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++);
			}
			let w = x ? _i(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || bi(f) : i;
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
			c.move(e, t, n, A);
			return;
		}
		if (c === H) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) me(u[e], t, n, r);
			o(e.anchor, t, n);
			return;
		}
		if (c === Ti) {
			S(e, t, n);
			return;
		}
		if (r !== 2 && d & 1 && l) if (r === 0) l.beforeEnter(a), o(a, t, n), V(() => l.enter(a), i);
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
	}, he = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (He(), Wn(s, null, n, e, !0), Ue()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Kn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Gi(_, t, e), u & 6) _e(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && On(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, A, r) : l && !l.hasOnce && (a !== H || d > 0 && d & 64) ? ve(l, t, n, !1, !0) : (a === H && d & 384 || !i && u & 16) && ve(c, t, n), r && k(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && V(() => {
			_ && Gi(_, t, e), h && On(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, k = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === H) {
			ge(n, r);
			return;
		}
		if (t === Ti) {
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
	}, ge = (e, t) => {
		let n;
		for (; e !== t;) n = h(e), s(e), e = n;
		s(t);
	}, _e = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		yi(c), yi(l), r && oe(r), i.stop(), a && (a.flags |= 8, he(o, e, t, n)), s && V(s, t), V(() => {
			e.isUnmounted = !0;
		}, t);
	}, ve = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) he(e[o], t, n, r, i);
	}, ye = (e) => {
		if (e.shapeFlag & 6) return ye(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[In];
		return n ? h(n) : t;
	}, be = !1, xe = (e, t, n) => {
		let r;
		e == null ? t._vnode && (he(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, be ||= (be = !0, yn(r), bn(), !1);
	}, A = {
		p: v,
		um: he,
		m: me,
		r: k,
		mt: O,
		mc: T,
		pc: de,
		pbc: E,
		n: ye,
		o: e
	}, Se, Ce;
	return i && ([Se, Ce] = i(A)), {
		render: xe,
		hydrate: Se,
		createApp: Nr(xe, Se)
	};
}
function pi({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function mi({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function hi(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function gi(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (d(r) && d(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Hi(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && gi(t, a)), a.type === Ci && (a.patchFlag === -1 && (a = i[e] = Hi(a)), a.el = t.el), a.type === wi && !a.el && (a.el = t.el);
	}
}
function _i(e) {
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
function vi(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : vi(t);
}
function yi(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function bi(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? bi(t.subTree) : null;
}
var xi = (e) => e.__isSuspense;
function Si(e, t) {
	t && t.pendingBranch ? d(e) ? t.effects.push(...e) : t.effects.push(e) : vn(e);
}
var H = /* @__PURE__ */ Symbol.for("v-fgt"), Ci = /* @__PURE__ */ Symbol.for("v-txt"), wi = /* @__PURE__ */ Symbol.for("v-cmt"), Ti = /* @__PURE__ */ Symbol.for("v-stc"), Ei = [], U = null;
function W(e = !1) {
	Ei.push(U = e ? null : []);
}
function Di() {
	Ei.pop(), U = Ei[Ei.length - 1] || null;
}
var Oi = 1;
function ki(e, t = !1) {
	Oi += e, e < 0 && U && t && (U.hasOnce = !0);
}
function Ai(e) {
	return e.dynamicChildren = Oi > 0 ? U || n : null, Di(), Oi > 0 && U && U.push(e), e;
}
function G(e, t, n, r, i, a) {
	return Ai(K(e, t, n, r, i, a, !0));
}
function ji(e, t, n, r, i) {
	return Ai(Ii(e, t, n, r, i, !0));
}
function Mi(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function Ni(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Pi = ({ key: e }) => e ?? null, Fi = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ F(e) || h(e) ? {
	i: Cn,
	r: e,
	k: t,
	f: !!n
} : e);
function K(e, t = null, n = null, r = 0, i = null, a = e === H ? 0 : 1, o = !1, s = !1) {
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
	return s ? (Ui(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Oi > 0 && !o && U && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && U.push(c), c;
}
var Ii = Li;
function Li(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === ur) && (e = wi), Mi(e)) {
		let r = zi(e, t, !0);
		return n && Ui(r, n), Oi > 0 && !a && U && (r.shapeFlag & 6 ? U[U.indexOf(e)] = r : U.push(r)), r.patchFlag = -2, r;
	}
	if (da(e) && (e = e.__vccOpts), t) {
		t = Ri(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = k(e)), v(n) && (/* @__PURE__ */ Vt(n) && !d(n) && (n = s({}, n)), t.style = de(n));
	}
	let o = g(e) ? 1 : xi(e) ? 128 : Ln(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return K(e, t, n, r, i, o, a, !0);
}
function Ri(e) {
	return e ? /* @__PURE__ */ Vt(e) || Yr(e) ? s({}, e) : e : null;
}
function zi(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? Wi(i || {}, t) : i, u = {
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
		patchFlag: t && e.type !== H ? o === -1 ? 16 : o | 16 : o,
		dynamicProps: e.dynamicProps,
		dynamicChildren: e.dynamicChildren,
		appContext: e.appContext,
		dirs: e.dirs,
		transition: c,
		component: e.component,
		suspense: e.suspense,
		ssContent: e.ssContent && zi(e.ssContent),
		ssFallback: e.ssFallback && zi(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && zn(u, c.clone(u)), u;
}
function q(e = " ", t = 0) {
	return Ii(Ci, null, e, t);
}
function Bi(e, t) {
	let n = Ii(Ti, null, e);
	return n.staticCount = t, n;
}
function J(e = "", t = !1) {
	return t ? (W(), ji(wi, null, e)) : Ii(wi, null, e);
}
function Vi(e) {
	return e == null || typeof e == "boolean" ? Ii(wi) : d(e) ? Ii(H, null, e.slice()) : Mi(e) ? Hi(e) : Ii(Ci, null, String(e));
}
function Hi(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : zi(e);
}
function Ui(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (d(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), Ui(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Yr(t) ? t._ctx = Cn : r === 3 && Cn && (Cn.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: Cn
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [q(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Wi(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = k([t.class, r.class]));
		else if (e === "style") t.style = de([t.style, r.style]);
		else if (a(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(d(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !o(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Gi(e, t, n, r = null) {
	an(e, t, 7, [n, r]);
}
var Ki = jr(), qi = 0;
function Ji(e, n, r) {
	let i = e.type, a = (n ? n.appContext : e.appContext) || Ki, o = {
		uid: qi++,
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
		propsOptions: ti(i, a),
		emitsOptions: Rr(i, a),
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
	return o.ctx = { _: o }, o.root = n ? n.root : o, o.emit = Ir.bind(null, o), e.ce && e.ce(o), o;
}
var Y = null, Yi = () => Y || Cn, Xi, Zi;
{
	let e = ue(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Xi = t("__VUE_INSTANCE_SETTERS__", (e) => Y = e), Zi = t("__VUE_SSR_SETTERS__", (e) => ta = e);
}
var Qi = (e) => {
	let t = Y;
	return Xi(e), e.scope.on(), () => {
		e.scope.off(), Xi(t);
	};
}, $i = () => {
	Y && Y.scope.off(), Xi(null);
};
function ea(e) {
	return e.vnode.shapeFlag & 4;
}
var ta = !1;
function na(e, t = !1, n = !1) {
	t && Zi(t);
	let { props: r, children: i } = e.vnode, a = ea(e);
	Xr(e, r, a, t), li(e, i, n || t);
	let o = a ? ra(e, t) : void 0;
	return t && Zi(!1), o;
}
function ra(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, hr);
	let { setup: r } = n;
	if (r) {
		He();
		let n = e.setupContext = r.length > 1 ? la(e) : null, i = Qi(e), a = rn(r, e, 0, [e.props, n]), o = y(a);
		if (Ue(), i(), (o || e.sp) && !Kn(e) && Vn(e), o) {
			if (a.then($i, $i), t) return a.then((n) => {
				ia(e, n, t);
			}).catch((t) => {
				on(t, e, 0);
			});
			e.asyncDep = a;
		} else ia(e, a, t);
	} else sa(e, t);
}
function ia(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = Jt(t)), sa(e, n);
}
var aa, oa;
function sa(e, t, n) {
	let i = e.type;
	if (!e.render) {
		if (!t && aa && !i.render) {
			let t = i.template || Sr(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: r } = e.appContext.config, { delimiters: a, compilerOptions: o } = i;
				i.render = aa(t, s(s({
					isCustomElement: n,
					delimiters: a
				}, r), o));
			}
		}
		e.render = i.render || r, oa && oa(e);
	}
	{
		let t = Qi(e);
		He();
		try {
			vr(e);
		} finally {
			Ue(), t();
		}
	}
}
var ca = { get(e, t) {
	return N(e, "get", ""), e[t];
} };
function la(e) {
	return {
		attrs: new Proxy(e.attrs, ca),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function ua(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(Jt(Ht(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in pr) return pr[n](e);
		},
		has(e, t) {
			return t in e || t in pr;
		}
	}) : e.proxy;
}
function da(e) {
	return h(e) && "__vccOpts" in e;
}
var X = (e, t) => /* @__PURE__ */ Xt(e, t, ta), fa = "3.5.34", pa = void 0, ma = typeof window < "u" && window.trustedTypes;
if (ma) try {
	pa = /* @__PURE__ */ ma.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var ha = pa ? (e) => pa.createHTML(e) : (e) => e, ga = "http://www.w3.org/2000/svg", _a = "http://www.w3.org/1998/Math/MathML", va = typeof document < "u" ? document : null, ya = va && /* @__PURE__ */ va.createElement("template"), ba = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? va.createElementNS(ga, e) : t === "mathml" ? va.createElementNS(_a, e) : n ? va.createElement(e, { is: n }) : va.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => va.createTextNode(e),
	createComment: (e) => va.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => va.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			ya.innerHTML = ha(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = ya.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, xa = /* @__PURE__ */ Symbol("_vtc");
function Sa(e, t, n) {
	let r = e[xa];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var Ca = /* @__PURE__ */ Symbol("_vod"), wa = /* @__PURE__ */ Symbol("_vsh"), Ta = /* @__PURE__ */ Symbol(""), Ea = /(?:^|;)\s*display\s*:/;
function Da(e, t, n) {
	let r = e.style, i = g(n), a = !1;
	if (n && !i) {
		if (t) if (g(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? ka(r, t, "");
		}
		else for (let e in t) n[e] ?? ka(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? ka(r, i, "") : Na(e, i, !g(t) && t ? t[i] : void 0, o) || ka(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[Ta];
			e && (n += ";" + e), r.cssText = n, a = Ea.test(n);
		}
	} else t && e.removeAttribute("style");
	Ca in e && (e[Ca] = a ? r.display : "", e[wa] && (r.display = "none"));
}
var Oa = /\s*!important$/;
function ka(e, t, n) {
	if (d(n)) n.forEach((n) => ka(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = Ma(e, t);
		Oa.test(n) ? e.setProperty(E(r), n.replace(Oa, ""), "important") : e[r] = n;
	}
}
var Aa = [
	"Webkit",
	"Moz",
	"ms"
], ja = {};
function Ma(e, t) {
	let n = ja[t];
	if (n) return n;
	let r = T(t);
	if (r !== "filter" && r in e) return ja[t] = r;
	r = ie(r);
	for (let n = 0; n < Aa.length; n++) {
		let i = Aa[n] + r;
		if (i in e) return ja[t] = i;
	}
	return t;
}
function Na(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && g(r) && n === r;
}
var Pa = "http://www.w3.org/1999/xlink";
function Fa(e, t, n, r, i, a = _e(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Pa, t.slice(6, t.length)) : e.setAttributeNS(Pa, t, n) : n == null || a && !ve(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
}
function Ia(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? ha(n) : n);
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
		r === "boolean" ? n = ve(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
	}
	try {
		e[t] = n;
	} catch {}
	o && e.removeAttribute(i || t);
}
function La(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function Ra(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var za = /* @__PURE__ */ Symbol("_vei");
function Ba(e, t, n, r, i = null) {
	let a = e[za] || (e[za] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = Ha(t);
		r ? La(e, n, a[t] = Ka(r, i), s) : o && (Ra(e, n, o, s), a[t] = void 0);
	}
}
var Va = /(?:Once|Passive|Capture)$/;
function Ha(e) {
	let t;
	if (Va.test(e)) {
		t = {};
		let n;
		for (; n = e.match(Va);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : E(e.slice(2)), t];
}
var Ua = 0, Wa = /* @__PURE__ */ Promise.resolve(), Ga = () => Ua ||= (Wa.then(() => Ua = 0), Date.now());
function Ka(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		an(qa(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Ga(), n;
}
function qa(e, t) {
	if (d(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Ja = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Ya = (e, t, n, r, i, s) => {
	let c = i === "svg";
	t === "class" ? Sa(e, r, c) : t === "style" ? Da(e, n, r) : a(t) ? o(t) || Ba(e, t, n, r, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Xa(e, t, r, c)) ? (Ia(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Fa(e, t, r, c, s, t !== "value")) : e._isVueCE && (Za(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r))) ? Ia(e, T(t), r, s, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Fa(e, t, r, c));
};
function Xa(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Ja(t) && h(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Ja(t) && g(n) ? !1 : t in e;
}
function Za(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = T(t);
	return Array.isArray(n) ? n.some((e) => T(e) === r) : Object.keys(n).some((e) => T(e) === r);
}
var Qa = {};
/* @__NO_SIDE_EFFECTS__ */
function $a(e, t, n) {
	let r = /* @__PURE__ */ Bn(e, t);
	C(r) && (r = s({}, r, t));
	class i extends to {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var eo = typeof HTMLElement < "u" ? HTMLElement : class {}, to = class e extends eo {
	constructor(e, t = {}, n = vo) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== vo ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		if (t) for (let e in t) u(this, e) || Object.defineProperty(this, e, { get: () => L(t[e]) });
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : Qa, r = T(e);
		t && this._numberProps && this._numberProps[r] && (n = ce(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === Qa ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(E(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(E(e), t + "") : t || this.removeAttribute(E(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), _o(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Ii(this._def, s(e, this._props));
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
}, no = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return d(t) ? (e) => oe(t, e) : t;
};
function ro(e) {
	e.target.composing = !0;
}
function io(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var ao = /* @__PURE__ */ Symbol("_assign");
function oo(e, t, n) {
	return t && (e = e.trim()), n && (e = se(e)), e;
}
var so = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e[ao] = no(i);
		let a = r || i.props && i.props.type === "number";
		La(e, t ? "change" : "input", (t) => {
			t.target.composing || e[ao](oo(e.value, n, a));
		}), (n || a) && La(e, "change", () => {
			e.value = oo(e.value, n, a);
		}), t || (La(e, "compositionstart", ro), La(e, "compositionend", io), La(e, "change", io));
	},
	mounted(e, { value: t }) {
		e.value = t ?? "";
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[ao] = no(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? se(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, co = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], lo = {
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
	exact: (e, t) => co.some((n) => e[`${n}Key`] && !t.includes(n))
}, uo = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = lo[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, fo = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, po = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = E(n.key);
		if (t.some((e) => e === r || fo[e] === r)) return e(n);
	}));
}, mo = /* @__PURE__ */ s({ patchProp: Ya }, ba), ho;
function go() {
	return ho ||= di(mo);
}
var _o = ((...e) => {
	go().render(...e);
}), vo = ((...e) => {
	let t = go().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = bo(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, yo(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function yo(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function bo(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/session.ts
var xo, So;
async function Co(e = {}) {
	return xo && xo.expiresAtMs > Date.now() + 5e3 ? xo.token : (So ||= To(e).finally(() => {
		So = void 0;
	}), So);
}
function wo() {
	xo = void 0;
}
async function To(e) {
	let t = e.operatorCode ?? Eo(), n = e.fetchImpl ?? fetch, r = e.baseUrl ?? "";
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
	let o = (a.expiresIn ?? 1800) * 1e3;
	return xo = {
		token: a.accessToken,
		expiresAtMs: Date.now() + o
	}, xo.token;
}
function Eo() {
	try {
		return {
			BASE_URL: "/",
			DEV: !1,
			MODE: "production",
			PROD: !0,
			SSR: !1
		}?.PUBLIC_COMTRYA_OPERATOR_CODE;
	} catch {
		return;
	}
}
//#endregion
//#region packages/sdk-core/src/runtime.ts
async function Do(e, t, n, r, i = {}) {
	let a = `${i.baseUrl ?? ""}/api/ops/${encodeURIComponent(e)}/${encodeURIComponent(t)}/${encodeURIComponent(n)}`, o = { "content-type": "application/json" }, s = i.token ?? await Co();
	s && (o.authorization = `Bearer ${s}`);
	try {
		let e = await fetch(a, {
			method: "POST",
			headers: o,
			body: JSON.stringify(r ?? null),
			signal: i.signal,
			credentials: "include"
		});
		e.status === 401 && wo();
		let t = await e.text();
		if (!e.ok) {
			let n;
			try {
				n = t ? JSON.parse(t) : void 0;
			} catch {
				n = void 0;
			}
			let r = ko(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: Oo(n?.code) ?? r,
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
function Oo(e) {
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
function ko(e) {
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
var Ao = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, jo;
function Mo() {
	return jo ||= No(Ao), jo;
}
function No(e) {
	let t = async (t, n) => {
		let r = await Co(), i = { "Content-Type": "application/json" };
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
		a.status === 401 && wo();
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
//#region packages/sdk-core/src/route-registry.ts
function Po(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`, r = n.length;
	for (; r > 1 && n.charCodeAt(r - 1) === 47;) --r;
	return `/x/${e}${n === "/" ? "" : n.slice(0, r)}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function Fo(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return Io(t, e, n.signal), () => n.abort();
}
async function Io(e, t, n) {
	try {
		let r = await Lo(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: Ro(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await zo(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function Lo(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: Ro(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function Ro(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function zo(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		Bo(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) Vo(e, t);
	}
	a += i.decode(), Bo(a, t);
}
function Bo(e, t) {
	for (let n of e.split("\n\n")) Vo(n, t);
}
function Vo(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = Ho(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function Ho(e, t) {
	let n = Uo(e) ? e : {}, r = Uo(n.data) ? n.data : {}, i = Wo(r.eventType) ?? Wo(n.type) ?? t ?? "";
	return {
		id: Wo(r.id) ?? Wo(n.id) ?? "",
		eventType: i,
		payloadB64: Wo(r.payloadB64) ?? "",
		timestampMs: Go(r.timestampMs) ?? Ko(Go(n.time)) ?? Date.now(),
		sourceUri: Wo(r.sourceUri) ?? Wo(n.source) ?? "",
		emitterExtension: Wo(r.emitterExtension) ?? Wo(r.extensionId) ?? Wo(n.source) ?? "",
		raw: e
	};
}
function Uo(e) {
	return typeof e == "object" && !!e;
}
function Wo(e) {
	return typeof e == "string" ? e : void 0;
}
function Go(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function Ko(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var qo = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], Jo = typeof navigator == "object" ? navigator.platform : "", Yo = /Mac|iPod|iPhone|iPad/.test(Jo), Xo = Yo ? "Meta" : "Control", Zo = Jo === "Win32" ? ["Control", "Alt"] : Yo ? ["Alt"] : [];
function Qo(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || Zo.includes(t) && e.getModifierState("AltGraph"));
}
function $o(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? Xo : e;
		}), n];
	});
}
function es(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !Qo(e, t);
	}) || qo.find(function(t) {
		return !n.includes(t) && r !== t && Qo(e, t);
	}));
}
function ts(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [$o(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			es(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : Qo(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function ns(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = ts(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var rs = /* @__PURE__ */ new Map(), is = /* @__PURE__ */ new Set();
function as(e) {
	rs.set(e.id, e);
	for (let e of is) e();
	return () => {
		rs.delete(e.id);
		for (let e of is) e();
	};
}
//#endregion
//#region packages/sdk-core/src/workspace-store.ts
var os = null, ss = [];
function cs() {
	return os;
}
function ls() {
	return os === null ? new Promise((e) => {
		ss.push(e);
	}) : Promise.resolve(os);
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function us(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function ds(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function fs(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (ds(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			us(e.target) || r(e);
		};
	}
	return t;
}
function ps(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = fs(e), i = () => {
		n ||= ns(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? z(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), ar(a);
}
//#endregion
//#region node_modules/.bun/marked@18.0.4/node_modules/marked/lib/marked.esm.js
function ms() {
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
var hs = ms();
function gs(e) {
	hs = e;
}
var _s = { exec: () => null };
function vs(e) {
	let t = [];
	return (n) => {
		let r = Math.max(0, Math.min(3, n - 1)), i = t[r];
		return i || (i = e(r), t[r] = i), i;
	};
}
function Z(e, t = "") {
	let n = typeof e == "string" ? e : e.source, r = {
		replace: (e, t) => {
			let i = typeof t == "string" ? t : t.source;
			return i = i.replace(Q.caret, "$1"), n = n.replace(e, i), r;
		},
		getRegex: () => new RegExp(n, t)
	};
	return r;
}
var ys = ((e = "") => {
	try {
		return !!RegExp("(?<=1)(?<!1)" + e);
	} catch {
		return !1;
	}
})(), Q = {
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
	nextBulletRegex: vs((e) => RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),
	hrRegex: vs((e) => RegExp(`^ {0,${e}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)),
	fencesBeginRegex: vs((e) => RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),
	headingBeginRegex: vs((e) => RegExp(`^ {0,${e}}#`)),
	htmlBeginRegex: vs((e) => RegExp(`^ {0,${e}}<(?:[a-z].*>|!--)`, "i")),
	blockquoteBeginRegex: vs((e) => RegExp(`^ {0,${e}}>`))
}, bs = /^(?:[ \t]*(?:\n|$))+/, xs = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Ss = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Cs = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ws = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Ts = / {0,3}(?:[*+-]|\d{1,9}[.)])/, Es = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, Ds = Z(Es).replace(/bull/g, Ts).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Os = Z(Es).replace(/bull/g, Ts).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), ks = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, As = /^[^\n]+/, js = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, Ms = Z(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", js).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Ns = Z(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Ts).getRegex(), Ps = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Fs = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Is = Z("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", Fs).replace("tag", Ps).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Ls = Z(ks).replace("hr", Cs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Ps).getRegex(), Rs = {
	blockquote: Z(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Ls).getRegex(),
	code: xs,
	def: Ms,
	fences: Ss,
	heading: ws,
	hr: Cs,
	html: Is,
	lheading: Ds,
	list: Ns,
	newline: bs,
	paragraph: Ls,
	table: _s,
	text: As
}, zs = Z("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Cs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Ps).getRegex(), Bs = {
	...Rs,
	lheading: Os,
	table: zs,
	paragraph: Z(ks).replace("hr", Cs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", zs).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Ps).getRegex()
}, Vs = {
	...Rs,
	html: Z("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", Fs).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: _s,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: Z(ks).replace("hr", Cs).replace("heading", " *#{1,6} *[^\n]").replace("lheading", Ds).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Hs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Us = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Ws = /^( {2,}|\\)\n(?!\s*$)/, Gs = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Ks = /[\p{P}\p{S}]/u, qs = /[\s\p{P}\p{S}]/u, Js = /[^\s\p{P}\p{S}]/u, Ys = Z(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, qs).getRegex(), Xs = /(?!~)[\p{P}\p{S}]/u, Zs = /(?!~)[\s\p{P}\p{S}]/u, Qs = /(?:[^\s\p{P}\p{S}]|~)/u, $s = Z(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", ys ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), ec = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/, tc = Z(ec, "u").replace(/punct/g, Ks).getRegex(), nc = Z(ec, "u").replace(/punct/g, Xs).getRegex(), rc = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", ic = Z(rc, "gu").replace(/notPunctSpace/g, Js).replace(/punctSpace/g, qs).replace(/punct/g, Ks).getRegex(), ac = Z(rc, "gu").replace(/notPunctSpace/g, Qs).replace(/punctSpace/g, Zs).replace(/punct/g, Xs).getRegex(), oc = Z("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, Js).replace(/punctSpace/g, qs).replace(/punct/g, Ks).getRegex(), sc = Z(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, Ks).getRegex(), cc = Z("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Js).replace(/punctSpace/g, qs).replace(/punct/g, Ks).getRegex(), lc = Z(/\\(punct)/, "gu").replace(/punct/g, Ks).getRegex(), uc = Z(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), dc = Z(Fs).replace("(?:-->|$)", "-->").getRegex(), fc = Z("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", dc).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), pc = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/, mc = Z(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", pc).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), hc = Z(/^!?\[(label)\]\[(ref)\]/).replace("label", pc).replace("ref", js).getRegex(), gc = Z(/^!?\[(ref)\](?:\[\])?/).replace("ref", js).getRegex(), _c = Z("reflink|nolink(?!\\()", "g").replace("reflink", hc).replace("nolink", gc).getRegex(), vc = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, yc = {
	_backpedal: _s,
	anyPunctuation: lc,
	autolink: uc,
	blockSkip: $s,
	br: Ws,
	code: Us,
	del: _s,
	delLDelim: _s,
	delRDelim: _s,
	emStrongLDelim: tc,
	emStrongRDelimAst: ic,
	emStrongRDelimUnd: oc,
	escape: Hs,
	link: mc,
	nolink: gc,
	punctuation: Ys,
	reflink: hc,
	reflinkSearch: _c,
	tag: fc,
	text: Gs,
	url: _s
}, bc = {
	...yc,
	link: Z(/^!?\[(label)\]\((.*?)\)/).replace("label", pc).getRegex(),
	reflink: Z(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", pc).getRegex()
}, xc = {
	...yc,
	emStrongRDelimAst: ac,
	emStrongLDelim: nc,
	delLDelim: sc,
	delRDelim: cc,
	url: Z(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", vc).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: Z(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", vc).getRegex()
}, Sc = {
	...xc,
	br: Z(Ws).replace("{2,}", "*").getRegex(),
	text: Z(xc.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Cc = {
	normal: Rs,
	gfm: Bs,
	pedantic: Vs
}, wc = {
	normal: yc,
	gfm: xc,
	breaks: Sc,
	pedantic: bc
}, Tc = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, Ec = (e) => Tc[e];
function Dc(e, t) {
	if (t) {
		if (Q.escapeTest.test(e)) return e.replace(Q.escapeReplace, Ec);
	} else if (Q.escapeTestNoEncode.test(e)) return e.replace(Q.escapeReplaceNoEncode, Ec);
	return e;
}
function Oc(e) {
	try {
		e = encodeURI(e).replace(Q.percentDecode, "%");
	} catch {
		return null;
	}
	return e;
}
function kc(e, t) {
	let n = e.replace(Q.findPipe, (e, t, n) => {
		let r = !1, i = t;
		for (; --i >= 0 && n[i] === "\\";) r = !r;
		return r ? "|" : " |";
	}).split(Q.splitPipe), r = 0;
	if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), t) if (n.length > t) n.splice(t);
	else for (; n.length < t;) n.push("");
	for (; r < n.length; r++) n[r] = n[r].trim().replace(Q.slashPipe, "|");
	return n;
}
function Ac(e, t, n) {
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
function jc(e) {
	let t = e.split("\n"), n = t.length - 1;
	for (; n >= 0 && Q.blankLine.test(t[n]);) n--;
	return t.length - n <= 2 ? e : t.slice(0, n + 1).join("\n");
}
function Mc(e, t) {
	if (e.indexOf(t[1]) === -1) return -1;
	let n = 0;
	for (let r = 0; r < e.length; r++) if (e[r] === "\\") r++;
	else if (e[r] === t[0]) n++;
	else if (e[r] === t[1] && (n--, n < 0)) return r;
	return n > 0 ? -2 : -1;
}
function Nc(e, t = 0) {
	let n = t, r = "";
	for (let t of e) if (t === "	") {
		let e = 4 - n % 4;
		r += " ".repeat(e), n += e;
	} else r += t, n++;
	return r;
}
function Pc(e, t, n, r, i) {
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
function Fc(e, t, n) {
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
var Ic = class {
	options;
	rules;
	lexer;
	constructor(e) {
		this.options = e || hs;
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
			let e = this.options.pedantic ? t[0] : jc(t[0]);
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
			let e = t[0], n = Fc(e, t[3] || "", this.rules);
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
				let t = Ac(e, "#");
				(this.options.pedantic || !t || this.rules.other.endingSpaceChar.test(t)) && (e = t.trim());
			}
			return {
				type: "heading",
				raw: Ac(t[0], "\n"),
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
			raw: Ac(t[0], "\n")
		};
	}
	blockquote(e) {
		let t = this.rules.block.blockquote.exec(e);
		if (t) {
			let e = Ac(t[0], "\n").split("\n"), n = "", r = "", i = [];
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
				let c = Nc(t[2].split("\n", 1)[0], t[1].length), l = e.split("\n", 1)[0], u = !c.trim(), d = 0;
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
			let e = jc(t[0]);
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
				raw: Ac(t[0], "\n"),
				href: n,
				title: r
			};
		}
	}
	table(e) {
		let t = this.rules.block.table.exec(e);
		if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
		let n = kc(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [], a = {
			type: "table",
			raw: Ac(t[0], "\n"),
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
			for (let e of i) a.rows.push(kc(e, a.header.length).map((e, t) => ({
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
				raw: Ac(t[0], "\n"),
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
				let t = Ac(e.slice(0, -1), "\\");
				if ((e.length - t.length) % 2 == 0) return;
			} else {
				let e = Mc(t[2], "()");
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
			return n = n.trim(), this.rules.other.startAngleBracket.test(n) && (n = this.options.pedantic && !this.rules.other.endAngleBracket.test(e) ? n.slice(1) : n.slice(1, -1)), Pc(t, {
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
			return Pc(n, e, n[0], this.lexer, this.rules);
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
}, Lc = class e {
	tokens;
	options;
	state;
	inlineQueue;
	tokenizer;
	constructor(e) {
		this.tokens = [], this.tokens.links = Object.create(null), this.options = e || hs, this.options.tokenizer = this.options.tokenizer || new Ic(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			top: !0
		};
		let t = {
			other: Q,
			block: Cc.normal,
			inline: wc.normal
		};
		this.options.pedantic ? (t.block = Cc.pedantic, t.inline = wc.pedantic) : this.options.gfm && (t.block = Cc.gfm, this.options.breaks ? t.inline = wc.breaks : t.inline = wc.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: Cc,
			inline: wc
		};
	}
	static lex(t, n) {
		return new e(n).lex(t);
	}
	static lexInline(t, n) {
		return new e(n).inlineTokens(t);
	}
	lex(e) {
		e = e.replace(Q.carriageReturn, "\n"), this.blockTokens(e, this.tokens);
		for (let e = 0; e < this.inlineQueue.length; e++) {
			let t = this.inlineQueue[e];
			this.inlineTokens(t.src, t.tokens);
		}
		return this.inlineQueue = [], this.tokens;
	}
	blockTokens(e, t = [], n = !1) {
		this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(Q.tabCharGlobal, "    ").replace(Q.spaceLine, ""));
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
}, Rc = class {
	options;
	parser;
	constructor(e) {
		this.options = e || hs;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: t, escaped: n }) {
		let r = (t || "").match(Q.notSpaceStart)?.[0], i = e.replace(Q.endingNewline, "") + "\n";
		return r ? "<pre><code class=\"language-" + Dc(r) + "\">" + (n ? i : Dc(i, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? i : Dc(i, !0)) + "</code></pre>\n";
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
		return `<code>${Dc(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: t, tokens: n }) {
		let r = this.parser.parseInline(n), i = Oc(e);
		if (i === null) return r;
		e = i;
		let a = "<a href=\"" + e + "\"";
		return t && (a += " title=\"" + Dc(t) + "\""), a += ">" + r + "</a>", a;
	}
	image({ href: e, title: t, text: n, tokens: r }) {
		r && (n = this.parser.parseInline(r, this.parser.textRenderer));
		let i = Oc(e);
		if (i === null) return Dc(n);
		e = i;
		let a = `<img src="${e}" alt="${Dc(n)}"`;
		return t && (a += ` title="${Dc(t)}"`), a += ">", a;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : Dc(e.text);
	}
}, zc = class {
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
}, Bc = class e {
	options;
	renderer;
	textRenderer;
	constructor(e) {
		this.options = e || hs, this.options.renderer = this.options.renderer || new Rc(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new zc();
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
}, Vc = class {
	options;
	block;
	constructor(e) {
		this.options = e || hs;
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
		return e ? Lc.lex : Lc.lexInline;
	}
	provideParser(e = this.block) {
		return e ? Bc.parse : Bc.parseInline;
	}
}, Hc = class {
	defaults = ms();
	options = this.setOptions;
	parse = this.parseMarkdown(!0);
	parseInline = this.parseMarkdown(!1);
	Parser = Bc;
	Renderer = Rc;
	TextRenderer = zc;
	Lexer = Lc;
	Tokenizer = Ic;
	Hooks = Vc;
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
				let t = this.defaults.renderer || new Rc(this.defaults);
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
				let t = this.defaults.tokenizer || new Ic(this.defaults);
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
				let t = this.defaults.hooks || new Vc();
				for (let n in e.hooks) {
					if (!(n in t)) throw Error(`hook '${n}' does not exist`);
					if (["options", "block"].includes(n)) continue;
					let r = n, i = e.hooks[r], a = t[r];
					Vc.passThroughHooks.has(n) ? t[r] = (e) => {
						if (this.defaults.async && Vc.passThroughHooksRespectAsync.has(n)) return (async () => {
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
		return Lc.lex(e, t ?? this.defaults);
	}
	parser(e, t) {
		return Bc.parse(e, t ?? this.defaults);
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
				let n = i.hooks ? await i.hooks.preprocess(t) : t, r = await (i.hooks ? await i.hooks.provideLexer(e) : e ? Lc.lex : Lc.lexInline)(n, i), a = i.hooks ? await i.hooks.processAllTokens(r) : r;
				i.walkTokens && await Promise.all(this.walkTokens(a, i.walkTokens));
				let o = await (i.hooks ? await i.hooks.provideParser(e) : e ? Bc.parse : Bc.parseInline)(a, i);
				return i.hooks ? await i.hooks.postprocess(o) : o;
			})().catch(a);
			try {
				i.hooks && (t = i.hooks.preprocess(t));
				let n = (i.hooks ? i.hooks.provideLexer(e) : e ? Lc.lex : Lc.lexInline)(t, i);
				i.hooks && (n = i.hooks.processAllTokens(n)), i.walkTokens && this.walkTokens(n, i.walkTokens);
				let r = (i.hooks ? i.hooks.provideParser(e) : e ? Bc.parse : Bc.parseInline)(n, i);
				return i.hooks && (r = i.hooks.postprocess(r)), r;
			} catch (e) {
				return a(e);
			}
		};
	}
	onError(e, t) {
		return (n) => {
			if (n.message += "\nPlease report this to https://github.com/markedjs/marked.", e) {
				let e = "<p>An error occurred:</p><pre>" + Dc(n.message + "", !0) + "</pre>";
				return t ? Promise.resolve(e) : e;
			}
			if (t) return Promise.reject(n);
			throw n;
		};
	}
}, Uc = new Hc();
function $(e, t) {
	return Uc.parse(e, t);
}
$.options = $.setOptions = function(e) {
	return Uc.setOptions(e), $.defaults = Uc.defaults, gs($.defaults), $;
}, $.getDefaults = ms, $.defaults = hs, $.use = function(...e) {
	return Uc.use(...e), $.defaults = Uc.defaults, gs($.defaults), $;
}, $.walkTokens = function(e, t) {
	return Uc.walkTokens(e, t);
}, $.parseInline = Uc.parseInline, $.Parser = Bc, $.parser = Bc.parse, $.Renderer = Rc, $.TextRenderer = zc, $.Lexer = Lc, $.lexer = Lc.lex, $.Tokenizer = Ic, $.Hooks = Vc, $.parse = $, $.options, $.setOptions, $.use, $.walkTokens, $.parseInline, Bc.parse, Lc.lex;
//#endregion
//#region packages/sdk-vue/src/markdown.ts
var Wc = new Set(/* @__PURE__ */ "h1.h2.h3.h4.h5.h6.p.ul.ol.li.strong.em.b.i.code.pre.a.img.br.hr.blockquote.table.thead.tbody.tfoot.tr.th.td.dl.dt.dd.details.summary.sup.sub.del.ins.s.mark.abbr.cite.q.figure.figcaption.caption.span.div.section.article.aside.header.footer.nav.main".split(".")), Gc = new Set([
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
]), Kc = {
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
}, qc = /^\s*(?:javascript|vbscript|data)\s*:/i;
function Jc(e) {
	return !qc.test(e);
}
function Yc(e) {
	return e.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Xc(e, t) {
	if (!t.trim()) return "";
	let n = [], r = /\s+([a-zA-Z][a-zA-Z0-9_:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=>]+)))?/g, i, a = !1, o = [];
	for (; (i = r.exec(t)) !== null;) {
		let t = (i[1] ?? "").toLowerCase(), n = i[2] ?? i[3] ?? i[4] ?? "";
		if (t.startsWith("on")) continue;
		let r = Kc[e];
		(Gc.has(t) || r && r.has(t)) && ((t === "href" || t === "src") && !Jc(n) || (t === "rel" && (a = !0), o.push({
			name: t,
			value: n
		})));
	}
	for (let { name: e, value: t } of o) n.push(" " + e + "=\"" + Yc(t) + "\"");
	return e === "a" && !a && n.push(" rel=\"noopener noreferrer\""), n.join("");
}
var Zc = [
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
], Qc = new Set([
	"input",
	"button",
	"meta",
	"link",
	"base",
	"applet"
]);
function $c(e) {
	let t = e;
	for (let e of Zc) {
		let n = RegExp("<" + e + "(\\s[^>]*)?>([\\s\\S]*?)<\\/" + e + ">", "gi");
		t = t.replace(n, "");
		let r = RegExp("<" + e + "(\\s[^>]*)?>", "gi");
		t = t.replace(r, "");
		let i = RegExp("<\\/" + e + ">", "gi");
		t = t.replace(i, "");
	}
	return t = t.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?(\/?)>/g, (e, t, n, r, i) => {
		let a = n.toLowerCase();
		if (Qc.has(a) || !Wc.has(a)) return "";
		let o = Xc(a, r ?? ""), s = i ? " /" : "";
		return "<" + t + a + o + s + ">";
	}), t;
}
function el(e, t) {
	let n = encodeURIComponent(t);
	return e.split(/(<code[^>]*>[\s\S]*?<\/code>)/).map((e, t) => t % 2 == 1 ? e : e.replace(/(^|[^\w&])#(\d+)\b/g, (e, t, r) => t + "<a href=\"/x/issues/" + n + "/" + r + "\" class=\"issue-ref\">#" + r + "</a>")).join("");
}
function tl(e, t = {}) {
	if (!e) return "";
	let n = $c(new Hc().parse(e, { async: !1 }));
	return t.workspaceId && (n = el(n, t.workspaceId)), n;
}
//#endregion
//#region packages/sdk-vue/src/parse-query.ts
function nl(e, t) {
	let n = {}, r = /* @__PURE__ */ new Set(), i = [], a = new Set(t);
	if (!e || !e.trim()) return {
		text: "",
		filters: n,
		unknown: []
	};
	let o = rl(e);
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
function rl(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n;) {
		for (; r < n && il(e.charCodeAt(r));) r += 1;
		if (r >= n) break;
		let i = r, a = -1;
		for (; r < n && !il(e.charCodeAt(r));) {
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
			if (al(n)) {
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
function il(e) {
	return e === 32 || e === 9 || e === 10 || e === 13;
}
function al(e) {
	if (e.length === 0 || !ol(e.charCodeAt(0))) return !1;
	for (let t = 1; t < e.length; t += 1) {
		let n = e.charCodeAt(t);
		if (!ol(n) && !sl(n) && n !== 95 && n !== 45) return !1;
	}
	return !0;
}
function ol(e) {
	return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function sl(e) {
	return e >= 48 && e <= 57;
}
//#endregion
//#region packages/sdk-vue/src/classify-principal.ts
var cl = {
	kind: "unknown",
	label: "unknown",
	glyph: "·",
	tone: "neutral"
};
function ll(e) {
	if (!e) return cl;
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: ul(r),
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
			glyph: ul(r) || "·",
			tone: "neutral"
		};
	}
}
function ul(e) {
	return e.slice(0, 1).toUpperCase();
}
function dl(e) {
	return ll(e).label;
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function fl(e) {
	pl(e.tagName, e.component);
	let t = /* @__PURE__ */ $a(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(hl(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function pl(e, t) {
	if (typeof document > "u") return;
	let n = ml(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function ml(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function hl(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
var gl = "ext_pull_requests", _l = "pulls";
function vl(e, t) {
	return t ? `comtrya://workspace/${e}/repository/${t}` : `comtrya://workspace/${e}`;
}
function yl(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function bl(e) {
	switch ((typeof e == "string" ? e : e && typeof e == "object" && typeof e.tag == "string" ? e.tag : "").toLowerCase()) {
		case "draft": return "DRAFT";
		case "merged": return "MERGED";
		case "closed": return "CLOSED";
		default: return "READY";
	}
}
function xl(e) {
	return {
		id: e.id,
		repository: e.repository,
		workspace: e.workspace ?? null,
		number: e.number,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: bl(e.state),
		authorRef: e.authorRef,
		headRef: e.headRef,
		baseRef: e.baseRef,
		createdAt: e.createdAt ?? null,
		updatedAt: e.updatedAt ?? null,
		mergedAt: e.mergedAt ?? null,
		mergedByRef: e.mergedByRef ?? null,
		closedAt: e.closedAt ?? null,
		closedByRef: e.closedByRef ?? null
	};
}
async function Sl(e) {
	return yl(await Do(gl, _l, "list-pulls", {
		repository: vl(e.workspaceId, e.repositoryId),
		limit: e.limit ?? 256
	}), "list-pulls").map(xl);
}
async function Cl(e) {
	let t = yl(await Do(gl, _l, "get-pull", e), "get-pull");
	return t ? xl(t) : null;
}
async function wl(e, t) {
	return xl(yl(await Do(gl, _l, "merge-pull", {
		id: e,
		mergedByRef: t ?? null
	}), "merge-pull"));
}
async function Tl(e, t) {
	return xl(yl(await Do(gl, _l, "close-pull", {
		id: e,
		closedByRef: t ?? null
	}), "close-pull"));
}
function El(e) {
	switch ((typeof e == "string" ? e : e && typeof e == "object" && typeof e.tag == "string" ? e.tag : "").toLowerCase()) {
		case "closed": return "CLOSED";
		case "reopened": return "REOPENED";
		default: return "OPEN";
	}
}
async function Dl(e) {
	if (!e) return [];
	let t = `comtrya://pull-request/${e}`, n = (await Mo().query("query LinkedIssues($from: ResourceURN!, $kind: ResourceURN) {\n      relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n    }", {
		from: t,
		kind: "comtrya://rel/com.comtrya.pulls/closes"
	})).relations?.outgoing ?? [], r = Array.from(new Set(n.map((e) => e.to ?? e.target ?? "").filter((e) => e.startsWith("comtrya://issue/"))));
	return (await Promise.all(r.map(Ol))).filter((e) => e !== null);
}
async function Ol(e) {
	let t = await Do("ext_issues", "issues", "by-ref-issue", e);
	if (!t.ok) return null;
	let n = t.value;
	if (!n || typeof n != "object") return null;
	let r = typeof n.projectName == "string" && n.projectName.trim().length > 0 ? n.projectName.trim() : null, i = typeof n.repository == "string" ? n.repository : null, a = typeof n.workspace == "string" ? n.workspace : null, o = kl(i ?? a);
	return {
		id: typeof n.id == "string" ? n.id : "",
		number: typeof n.number == "number" ? n.number : null,
		title: typeof n.title == "string" ? n.title : "(untitled)",
		state: El(n.state),
		uri: e,
		projectName: r,
		workspaceId: o
	};
}
function kl(e) {
	if (!e) return null;
	let t = e.match(/^comtrya:\/\/workspace\/([^/]+)/);
	return t ? t[1] ?? null : null;
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/types.ts
var Al = "pulls";
function jl() {
	return cs() ?? "";
}
function Ml(e) {
	return Pl(e) ?? Po("pulls", "/");
}
function Nl(e, t) {
	let n = Pl(t);
	return n ? `${n}/${encodeURIComponent(e.id)}` : Po(Al, `/${e.id}`);
}
function Pl(e) {
	let t = e?.split("/").filter(Boolean) ?? [];
	return t.length === 0 ? null : `/r/${t.map(encodeURIComponent).join("/")}/pulls`;
}
function Fl(e) {
	switch (e) {
		case "READY": return {
			label: "open",
			className: "pr-state-ready"
		};
		case "DRAFT": return {
			label: "draft",
			className: "pr-state-draft"
		};
		case "MERGED": return {
			label: "merged",
			className: "pr-state-merged"
		};
		case "CLOSED": return {
			label: "closed",
			className: "pr-state-closed"
		};
		default: return {
			label: "unknown",
			className: "pr-state-closed"
		};
	}
}
function Il(e) {
	if (!e) return "";
	let t = Date.parse(e);
	if (Number.isNaN(t)) return e;
	let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
	return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/pr-commands.ts
var Ll = /* @__PURE__ */ new Map();
function Rl(e) {
	return [
		e.id,
		e.number,
		e.title,
		e.state
	].join("|");
}
function zl(e) {
	let t = [];
	return t.push(as({
		id: `ext_pull_requests.open.${e.id}`,
		title: `Open PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: () => {
			window.location.href = Nl(e);
		}
	})), (e.state === "READY" || e.state === "DRAFT") && t.push(as({
		id: `ext_pull_requests.merge.${e.id}`,
		title: `Merge PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: async () => {
			await wl(e.id);
		}
	})), e.state !== "CLOSED" && e.state !== "MERGED" && t.push(as({
		id: `ext_pull_requests.close.${e.id}`,
		title: `Close PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: async () => {
			await Tl(e.id);
		}
	})), () => t.forEach((e) => e());
}
async function Bl(e) {
	let t;
	try {
		t = await Sl({ workspaceId: e });
	} catch (e) {
		console.warn("[ext_pull_requests] palette sync failed:", e);
		return;
	}
	let n = /* @__PURE__ */ new Set();
	for (let e of t) {
		n.add(e.id);
		let t = Rl(e), r = Ll.get(e.id);
		r && r.signature === t || (r?.unregister(), Ll.set(e.id, {
			signature: t,
			unregister: zl(e)
		}));
	}
	for (let [e, t] of Ll) n.has(e) || (t.unregister(), Ll.delete(e));
}
function Vl() {
	let e = [], t = !1;
	return ls().then((n) => {
		if (!t) {
			Bl(n);
			for (let t of [
				"dev.comtrya.pull-request.created",
				"dev.comtrya.pull-request.merged",
				"dev.comtrya.pull-request.closed"
			]) e.push(Fo({
				type: t,
				onEvent: () => {
					Bl(n);
				},
				onError: () => {}
			}));
		}
	}), () => {
		t = !0;
		for (let t of e) t();
		for (let e of Ll.values()) e.unregister();
		Ll.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/CustomElementHost.vue?vue&type=script&setup=true&lang.ts
var Hl = /* @__PURE__ */ Bn({
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
		let t = e, n = /* @__PURE__ */ I(null), r = null;
		tr(i), z(() => [
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
		return (e, t) => (W(), G("span", {
			ref_key: "mount",
			ref: n,
			class: "custom-element-host"
		}, null, 512));
	}
}), Ul = ".custom-element-host[data-v-cf896d02]{display:contents}", Wl = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, Gl = /* @__PURE__ */ Wl(Hl, [["styles", [Ul]], ["__scopeId", "data-v-cf896d02"]]), Kl = /^diff --git a\/(.+?) b\/(.+)$/, ql = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;
function Jl(e) {
	if (!e) return [];
	let t = [], n = e.split("\n"), r = null, i = null, a = 0, o = 0, s = () => {
		r && i && r.hunks.push(i), i = null;
	}, c = () => {
		s(), r && t.push(r), r = null;
	};
	for (let e of n) {
		let t = e.match(Kl);
		if (t) {
			c();
			let [, e, n] = t;
			r = {
				oldPath: e ?? "",
				newPath: n ?? "",
				displayPath: n || e || "",
				status: "modified",
				language: Xl(n || e || ""),
				hunks: [],
				additions: 0,
				deletions: 0,
				binary: !1
			};
			continue;
		}
		if (!r) continue;
		if (e.startsWith("new file mode")) {
			r.status = "added";
			continue;
		}
		if (e.startsWith("deleted file mode")) {
			r.status = "deleted";
			continue;
		}
		if (e.startsWith("rename from") || e.startsWith("rename to")) {
			r.status = "renamed";
			continue;
		}
		if (e.startsWith("Binary files")) {
			r.binary = !0;
			continue;
		}
		if (e.startsWith("index ") || e.startsWith("---") || e.startsWith("+++")) continue;
		let n = e.match(ql);
		if (n) {
			s();
			let t = Number(n[1] ?? 0), r = Number(n[2] ?? 1), c = Number(n[3] ?? 0);
			i = {
				header: e,
				oldStart: t,
				oldLines: r,
				newStart: c,
				newLines: Number(n[4] ?? 1),
				lines: []
			}, a = t, o = c;
			continue;
		}
		i && (e.startsWith("+") ? (i.lines.push({
			kind: "add",
			text: e.slice(1),
			oldNumber: null,
			newNumber: o
		}), o += 1, r.additions += 1) : e.startsWith("-") ? (i.lines.push({
			kind: "del",
			text: e.slice(1),
			oldNumber: a,
			newNumber: null
		}), a += 1, r.deletions += 1) : e.startsWith("\\") ? i.lines.push({
			kind: "meta",
			text: e,
			oldNumber: null,
			newNumber: null
		}) : (i.lines.push({
			kind: "context",
			text: e.startsWith(" ") ? e.slice(1) : e,
			oldNumber: a,
			newNumber: o
		}), a += 1, o += 1));
	}
	return c(), t;
}
var Yl = {
	rs: "rust",
	ts: "typescript",
	tsx: "tsx",
	js: "javascript",
	jsx: "jsx",
	vue: "vue",
	py: "python",
	go: "go",
	md: "markdown",
	json: "json",
	yaml: "yaml",
	yml: "yaml",
	toml: "toml",
	sh: "shell",
	css: "css",
	html: "html"
};
function Xl(e) {
	let t = e.lastIndexOf(".");
	return t < 0 ? "plain" : Yl[e.slice(t + 1).toLowerCase()] ?? "plain";
}
function Zl(e) {
	let t = 0, n = 0;
	for (let r of e) t += r.additions, n += r.deletions;
	return {
		files: e.length,
		additions: t,
		deletions: n
	};
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/diff-styles.ts
var Ql = "comtrya-diff-view-styles", $l = "\n.diff-view {\n  display: grid;\n  gap: 14px;\n  font-family: var(--sans, system-ui);\n}\n\n.diff-summary {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  flex-wrap: wrap;\n  gap: 12px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 8px;\n}\n\n.diff-summary h2 {\n  margin: 0;\n  font-family: var(--display, system-ui);\n  font-size: 18px;\n}\n\n.diff-totals {\n  display: inline-flex;\n  flex-wrap: wrap;\n  gap: 10px 14px;\n  align-items: baseline;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--ink-faint, #68645c);\n}\n\n.diff-totals .adds { color: var(--accent-teal, #087f6f); }\n.diff-totals .dels { color: var(--accent-err, #c9341c); }\n.diff-totals .hint { color: var(--ink-fainter, #918b80); }\n\n.diff-totals .hint kbd {\n  border: 1px solid currentColor;\n  padding: 0 4px;\n  font-family: var(--mono, monospace);\n  font-size: 10px;\n}\n\n.diff-view .muted {\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--ink-faint, #68645c);\n}\n\n.diff-view .muted.error { color: var(--accent-err, #c9341c); }\n\n.diff-files {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n  gap: 14px;\n}\n\n.diff-file {\n  border: 1.5px solid var(--ink, #111);\n  background: var(--paper, #fffdf8);\n}\n\n.diff-file.focused {\n  box-shadow: -3px 0 0 0 var(--accent-orange, #e34a20);\n}\n\n.diff-file-head {\n  display: grid;\n  grid-template-columns: 14px auto minmax(0, 1fr) auto auto;\n  gap: 10px;\n  align-items: center;\n  padding: 8px 10px;\n  border-bottom: 1px solid var(--rule-light, #d8d1c4);\n  cursor: pointer;\n  background: var(--paper-tint, #f2efe7);\n}\n\n.diff-file-head:hover,\n.diff-file-head:focus-visible {\n  background: color-mix(in srgb, var(--paper-tint, #f2efe7) 80%, var(--ink, #111));\n  outline: none;\n}\n\n.diff-file-head .caret {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #68645c);\n}\n\n.file-status {\n  font-family: var(--mono, monospace);\n  font-size: 10px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  padding: 1px 6px;\n  border: 1px solid currentColor;\n}\n\n.status-added { color: var(--accent-teal, #087f6f); }\n.status-deleted { color: var(--accent-err, #c9341c); }\n.status-modified { color: var(--accent-blue, #1d55a6); }\n.status-renamed { color: var(--accent-yellow, #c89300); }\n\n.file-path {\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.file-rename {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #68645c);\n}\n\n.file-counts {\n  display: inline-flex;\n  gap: 8px;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n}\n\n.file-counts .adds { color: var(--accent-teal, #087f6f); }\n.file-counts .dels { color: var(--accent-err, #c9341c); }\n\n.diff-file-body { display: grid; gap: 0; }\n\n.diff-hunk { border-top: 1px solid var(--rule-light, #d8d1c4); }\n.diff-hunk:first-child { border-top: 0; }\n\n.diff-hunk-head {\n  background: var(--paper-tint, #f2efe7);\n  padding: 4px 10px;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #68645c);\n}\n\n.diff-hunk table {\n  width: 100%;\n  border-collapse: collapse;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  line-height: 1.45;\n}\n\n.diff-line.line-add {\n  background: color-mix(in srgb, var(--accent-teal, #087f6f) 10%, var(--paper, #fffdf8));\n}\n\n.diff-line.line-del {\n  background: color-mix(in srgb, var(--accent-err, #c9341c) 10%, var(--paper, #fffdf8));\n}\n\n.diff-line.line-meta { color: var(--ink-fainter, #918b80); }\n\n.diff-line td {\n  padding: 0;\n  vertical-align: top;\n  white-space: pre-wrap;\n  word-break: break-word;\n}\n\n.diff-line .ln {\n  width: 48px;\n  padding: 0 8px;\n  color: var(--ink-fainter, #918b80);\n  text-align: right;\n  user-select: none;\n  background: color-mix(in srgb, var(--paper-tint, #f2efe7) 60%, var(--paper, #fffdf8));\n  border-right: 1px solid var(--rule-light, #d8d1c4);\n  font-variant-numeric: tabular-nums;\n}\n\n.diff-line.line-add .ln.new,\n.diff-line.line-del .ln.old {\n  color: var(--ink-soft, #2c2b28);\n}\n\n.diff-line .marker {\n  width: 18px;\n  padding: 0 4px;\n  text-align: center;\n  color: var(--ink-faint, #68645c);\n  user-select: none;\n}\n\n.diff-line.line-add .marker { color: var(--accent-teal, #087f6f); }\n.diff-line.line-del .marker { color: var(--accent-err, #c9341c); }\n.diff-line .content { padding: 0 8px; }\n";
function eu() {
	if (typeof document > "u" || document.getElementById(Ql)) return;
	let e = document.createElement("style");
	e.id = Ql, e.textContent = $l, document.head.appendChild(e);
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/DiffView.vue?vue&type=script&setup=true&lang.ts
var tu = {
	class: "diff-view",
	"data-smoke": "pulls-diff-view"
}, nu = { class: "diff-summary" }, ru = { class: "diff-totals" }, iu = { class: "adds" }, au = { class: "dels" }, ou = {
	key: 0,
	class: "muted"
}, su = {
	key: 1,
	class: "muted error"
}, cu = {
	key: 2,
	class: "muted"
}, lu = {
	key: 3,
	class: "diff-files"
}, uu = ["data-diff-file-index"], du = [
	"aria-expanded",
	"onClick",
	"onKeydown",
	"onFocus"
], fu = { class: "caret" }, pu = { class: "file-path" }, mu = {
	key: 0,
	class: "file-rename"
}, hu = { class: "file-counts" }, gu = { class: "adds" }, _u = { class: "dels" }, vu = {
	key: 0,
	class: "diff-file-body"
}, yu = {
	key: 0,
	class: "muted"
}, bu = { class: "diff-hunk-head" }, xu = { class: "ln old" }, Su = { class: "ln new" }, Cu = { class: "marker" }, wu = { class: "content" }, Tu = /* @__PURE__ */ Bn({
	__name: "DiffView",
	props: {
		patch: { type: String },
		loading: { type: Boolean },
		error: { type: [String, null] }
	},
	setup(e) {
		eu();
		let t = e, n = /* @__PURE__ */ I({}), r = /* @__PURE__ */ I(0), i = X(() => Jl(t.patch)), a = X(() => Zl(i.value));
		z(i, (e) => {
			r.value >= e.length && (r.value = Math.max(0, e.length - 1));
		}), ps({
			"]": (e) => {
				i.value.length !== 0 && (e.preventDefault(), l(Math.min(r.value + 1, i.value.length - 1)));
			},
			n: (e) => {
				i.value.length !== 0 && (e.preventDefault(), l(Math.min(r.value + 1, i.value.length - 1)));
			},
			"[": (e) => {
				i.value.length !== 0 && (e.preventDefault(), l(Math.max(r.value - 1, 0)));
			},
			p: (e) => {
				i.value.length !== 0 && (e.preventDefault(), l(Math.max(r.value - 1, 0)));
			},
			" ": (e) => {
				let t = i.value[r.value];
				t && (e.preventDefault(), o(t.displayPath));
			}
		});
		function o(e) {
			n.value[e] = !n.value[e];
		}
		function s(e) {
			return n.value[e] === !0;
		}
		function c(e) {
			switch (e.status) {
				case "added": return "added";
				case "deleted": return "deleted";
				case "renamed": return "renamed";
				default: return "modified";
			}
		}
		function l(e) {
			if (e < 0 || e >= i.value.length) return;
			r.value = e;
			let t = document.querySelector(`[data-diff-file-index="${e}"]`);
			t && t.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
		}
		return (t, n) => (W(), G("section", tu, [K("header", nu, [n[1] ||= K("h2", null, "Files changed", -1), K("div", ru, [
			K("span", null, [q(A(a.value.files) + " file", 1), a.value.files === 1 ? J("", !0) : (W(), G(H, { key: 0 }, [q("s")], 64))]),
			K("span", iu, "+" + A(a.value.additions), 1),
			K("span", au, "-" + A(a.value.deletions), 1),
			n[0] ||= K("span", { class: "hint" }, [
				K("kbd", null, "n"),
				q("/"),
				K("kbd", null, "p"),
				q(" next/prev file · "),
				K("kbd", null, "space"),
				q(" collapse ")
			], -1)
		])]), e.loading ? (W(), G("p", ou, "Loading diff…")) : e.error ? (W(), G("p", su, A(e.error), 1)) : i.value.length === 0 ? (W(), G("p", cu, " No diff to show. Push commits to head and base refs to populate this view. ")) : (W(), G("ol", lu, [(W(!0), G(H, null, dr(i.value, (e, t) => (W(), G("li", {
			key: e.displayPath + t,
			class: k(["diff-file", { focused: t === r.value }]),
			"data-diff-file-index": t
		}, [K("header", {
			class: "diff-file-head",
			tabindex: "0",
			role: "button",
			"aria-expanded": !s(e.displayPath),
			onClick: (t) => o(e.displayPath),
			onKeydown: po(uo((t) => o(e.displayPath), ["prevent"]), ["enter"]),
			onFocus: (e) => r.value = t
		}, [
			K("span", fu, A(s(e.displayPath) ? "▸" : "▾"), 1),
			K("span", { class: k(["file-status", `status-${e.status}`]) }, A(c(e)), 3),
			K("code", pu, A(e.displayPath), 1),
			e.status === "renamed" && e.oldPath !== e.newPath ? (W(), G("span", mu, [n[2] ||= q(" from ", -1), K("code", null, A(e.oldPath), 1)])) : J("", !0),
			K("span", hu, [K("span", gu, "+" + A(e.additions), 1), K("span", _u, "-" + A(e.deletions), 1)])
		], 40, du), s(e.displayPath) ? J("", !0) : (W(), G("div", vu, [e.binary ? (W(), G("p", yu, "Binary file — no preview.")) : (W(!0), G(H, { key: 1 }, dr(e.hunks, (e, t) => (W(), G("section", {
			key: t,
			class: "diff-hunk"
		}, [K("header", bu, [K("code", null, A(e.header.replace(/^@@ /, "").replace(/ @@$/, "")), 1)]), K("table", null, [K("tbody", null, [(W(!0), G(H, null, dr(e.lines, (e, t) => (W(), G("tr", {
			key: t,
			class: k(["diff-line", `line-${e.kind}`])
		}, [
			K("td", xu, A(e.oldNumber ?? ""), 1),
			K("td", Su, A(e.newNumber ?? ""), 1),
			K("td", Cu, [e.kind === "add" ? (W(), G(H, { key: 0 }, [q("+")], 64)) : e.kind === "del" ? (W(), G(H, { key: 1 }, [q("-")], 64)) : e.kind === "meta" ? (W(), G(H, { key: 2 }, [q("\\")], 64)) : (W(), G(H, { key: 3 }, [], 64))]),
			K("td", wu, A(e.text), 1)
		], 2))), 128))])])]))), 128))]))], 10, uu))), 128))]))]));
	}
}), Eu = {
	class: "pulls-detail",
	"data-smoke": "pulls-detail"
}, Du = {
	key: 0,
	class: "pulls-empty"
}, Ou = {
	key: 1,
	class: "pulls-error",
	role: "alert"
}, ku = {
	key: 2,
	class: "pulls-empty"
}, Au = ["href"], ju = { class: "pulls-detail-head" }, Mu = { class: "pulls-detail-title" }, Nu = { class: "pulls-detail-number" }, Pu = {
	class: "pulls-chip-row",
	"aria-label": "Pull request metadata"
}, Fu = { class: "pull-chip tone-branch" }, Iu = ["title"], Lu = ["data-author-kind", "title"], Ru = { class: "chip-glyph" }, zu = {
	key: 0,
	class: "pull-chip tone-time tone-merged"
}, Bu = {
	key: 1,
	class: "pull-chip tone-time tone-closed"
}, Vu = {
	key: 2,
	class: "pull-chip tone-time"
}, Hu = { class: "pulls-detail-actions" }, Uu = ["disabled"], Wu = ["disabled"], Gu = {
	key: 0,
	class: "pulls-action-message"
}, Ku = {
	key: 0,
	class: "pulls-detail-body"
}, qu = ["innerHTML"], Ju = {
	key: 1,
	class: "pulls-detail-body muted"
}, Yu = {
	key: 2,
	class: "pulls-routed",
	"data-smoke": "pulls-routed",
	"aria-label": "CUE project routing"
}, Xu = { class: "muted" }, Zu = { class: "pulls-routed-list" }, Qu = ["href", "title"], $u = {
	key: 0,
	class: "pulls-routed-owners"
}, ed = ["data-author-kind", "title"], td = { class: "chip-glyph" }, nd = {
	key: 1,
	class: "pulls-routed-owners muted"
}, rd = {
	key: 3,
	class: "pulls-linked-issues",
	"data-smoke": "pulls-linked-issues"
}, id = { class: "muted" }, ad = {
	key: 0,
	role: "listbox",
	"aria-label": "Linked issues"
}, od = ["aria-selected", "onMouseenter"], sd = ["href"], cd = { class: "issue-num" }, ld = { class: "issue-title" }, ud = ["href", "title"], dd = {
	key: 1,
	class: "pulls-linked-foot"
}, fd = {
	key: 0,
	class: "pulls-detail-discussion-count"
}, pd = /* @__PURE__ */ Wl(/* @__PURE__ */ Bn({
	__name: "PullsDetail",
	props: {
		routeParams: { type: Object },
		repositoryPath: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = X(() => t.routeParams?.params?.pullId ?? ""), r = X(() => Ml(t.repositoryPath)), i = /* @__PURE__ */ I(null), a = /* @__PURE__ */ I("idle"), o = /* @__PURE__ */ I(null), s = /* @__PURE__ */ I("idle"), c = /* @__PURE__ */ I(null), l = /* @__PURE__ */ I(""), u = /* @__PURE__ */ I(""), d = /* @__PURE__ */ I("idle"), f = /* @__PURE__ */ I(null), p = /* @__PURE__ */ I([]), m = /* @__PURE__ */ I("idle"), h = /* @__PURE__ */ I(-1), g = /* @__PURE__ */ I([]);
		function _(e) {
			let t = (e ?? "").replace(/^\.\//, "").replace(/\/+$/g, "");
			return t === "." ? "" : t;
		}
		let v = X(() => {
			if (g.value.length === 0 || !l.value) return [];
			let e = g.value.map((e) => ({
				name: e.name ?? "",
				root: _(e.root)
			})).filter((e) => e.name).sort((e, t) => t.root.length - e.root.length), t = /* @__PURE__ */ new Set();
			for (let n of Jl(l.value)) {
				let r = n.displayPath.replace(/^\/+/, "");
				for (let n of e) if (n.root === "" || r === n.root || r.startsWith(`${n.root}/`)) {
					t.add(n.name);
					break;
				}
			}
			return Array.from(t).sort();
		}), y = X(() => {
			let e = /* @__PURE__ */ new Set();
			for (let t of p.value) t.projectName && e.add(t.projectName);
			return Array.from(e).sort();
		}), b = X(() => {
			let e = new Set([...v.value, ...y.value]);
			return Array.from(e).sort().map((e) => ({
				name: e,
				owners: (g.value.find((t) => t.name === e)?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0)
			}));
		}), x = ll, S = X(() => Fl(i.value?.state)), C = X(() => i.value && (i.value.state === "READY" || i.value.state === "DRAFT")), w = X(() => i.value && i.value.state !== "CLOSED" && i.value.state !== "MERGED"), ee = X(() => i.value?.bodyMarkdown ? tl(i.value.bodyMarkdown, { workspaceId: jl() }) : ""), te = X(() => i.value ? `comtrya://pull-request/${i.value.id}` : ""), ne = /* @__PURE__ */ I(null);
		function T(e) {
			let t = e.detail;
			t && typeof t.count == "number" && (ne.value = t.count);
		}
		let re = [];
		tr(() => {
			ie(), se(), ae();
			for (let e of [
				"dev.comtrya.issues.opened",
				"dev.comtrya.issues.closed",
				"dev.comtrya.issues.reopened"
			]) re.push(Fo({
				type: e,
				onEvent: () => void ae(),
				onError: () => {}
			}));
		}), ar(() => {
			for (let e of re) e();
			re.length = 0;
		}), z(n, () => void ae()), ps({
			m: (e) => {
				C.value && (e.preventDefault(), ue());
			},
			x: (e) => {
				w.value && (e.preventDefault(), de());
			},
			j: (e) => {
				if (p.value.length === 0) return;
				e.preventDefault();
				let t = h.value + 1;
				h.value = t >= p.value.length ? 0 : t;
			},
			k: (e) => {
				if (p.value.length === 0) return;
				e.preventDefault();
				let t = h.value - 1;
				h.value = t < 0 ? p.value.length - 1 : t;
			},
			Enter: (e) => {
				if (h.value < 0) return;
				let t = p.value[h.value];
				t && (e.preventDefault(), window.location.href = D(t));
			},
			Escape: (e) => {
				document.querySelector(".shortcuts-backdrop, .palette-backdrop") || E(e);
			}
		}), z(n, () => void ie());
		function E(e) {
			e.preventDefault(), window.location.href = r.value;
		}
		async function ie() {
			if (!n.value) {
				a.value = "error", o.value = "Missing pull id";
				return;
			}
			a.value = "loading", o.value = null;
			try {
				i.value = await Cl(n.value), a.value = i.value ? "ready" : "empty";
			} catch (e) {
				a.value = "error", o.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function ae() {
			if (n.value) {
				m.value = "loading";
				try {
					p.value = await Dl(n.value), m.value = "ready";
				} catch {
					p.value = [], m.value = "error";
				}
				h.value = -1;
			}
		}
		function D(e) {
			return e.workspaceId && e.number !== null ? `/x/issues/${e.workspaceId}/${e.number}` : "/x/issues/";
		}
		function oe(e) {
			return `/x/issues/?project=${encodeURIComponent(e)}`;
		}
		function O(e) {
			switch (e) {
				case "CLOSED": return "issue-state-closed";
				default: return "issue-state-open";
			}
		}
		async function se() {
			d.value = "loading", f.value = null;
			try {
				let e = ce();
				if (e.length === 0) {
					l.value = "", u.value = "", g.value = [], d.value = "ready";
					return;
				}
				let t = await Mo().query("query PullProjects($segments: [String!]!) {\n        workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n      }", { segments: e });
				l.value = "", u.value = "", g.value = t.workspace?.repositoryByPath?.comtryaConfig?.projects ?? [], d.value = "ready";
			} catch (e) {
				d.value = "error", f.value = e instanceof Error ? e.message : String(e);
			}
		}
		function ce() {
			let e = t.repositoryPath?.split("/").filter(Boolean) ?? [];
			return e.length > 0 ? e : le();
		}
		function le() {
			if (typeof window > "u") return [];
			let e = window.location.pathname;
			if (!e.startsWith("/r/")) return [];
			let t = e.slice(3), n = t.search(/\/(?:pulls|issues|checks|epics|p)\//);
			return (n >= 0 ? t.slice(0, n) : t).split("/").filter(Boolean).map(decodeURIComponent);
		}
		async function ue() {
			if (!(!i.value || !C.value)) {
				s.value = "merging", c.value = null;
				try {
					i.value = await wl(i.value.id), c.value = `Merged pull #${i.value.number}`;
				} catch (e) {
					c.value = e instanceof Error ? e.message : String(e);
				} finally {
					s.value = "idle";
				}
			}
		}
		async function de() {
			if (!(!i.value || !w.value)) {
				s.value = "closing", c.value = null;
				try {
					i.value = await Tl(i.value.id), c.value = `Closed pull #${i.value.number}`;
				} catch (e) {
					c.value = e instanceof Error ? e.message : String(e);
				} finally {
					s.value = "idle";
				}
			}
		}
		return (e, t) => (W(), G("article", Eu, [a.value === "loading" ? (W(), G("p", Du, "Loading pull request…")) : a.value === "error" ? (W(), G("p", Ou, A(o.value), 1)) : a.value === "empty" || !i.value ? (W(), G("p", ku, [
			t[0] ||= q(" No pull request found for ", -1),
			K("code", null, A(n.value), 1),
			t[1] ||= q(". ", -1),
			K("a", {
				href: r.value,
				onClick: E
			}, "← Pull requests", 8, Au)
		])) : (W(), G(H, { key: 3 }, [
			K("header", ju, [K("div", Mu, [
				K("button", {
					type: "button",
					class: "back",
					"aria-label": "Back to pull requests",
					onClick: E
				}, "← Pull requests"),
				K("span", Nu, "#" + A(i.value.number), 1),
				K("h1", null, A(i.value.title), 1)
			]), K("div", Pu, [
				K("span", { class: k([
					"pull-chip",
					"tone-state",
					S.value.className
				]) }, A(S.value.label), 3),
				K("span", Fu, [
					K("code", null, A(i.value.headRef), 1),
					t[2] ||= K("span", {
						class: "branch-arrow",
						"aria-hidden": "true"
					}, "→", -1),
					K("code", null, A(i.value.baseRef), 1)
				]),
				(W(!0), G(H, null, dr(v.value, (e) => (W(), G("span", {
					key: `project-${e}`,
					class: "pull-chip tone-project",
					title: `Touches files inside the ${e} Project's root`
				}, [t[3] ||= K("span", { class: "chip-glyph" }, "◇", -1), q(A(e), 1)], 8, Iu))), 128)),
				K("span", {
					class: "pull-chip tone-author",
					"data-author-kind": L(ll)(i.value.authorRef).kind,
					title: `Opened by ${i.value.authorRef}`
				}, [K("span", Ru, A(L(ll)(i.value.authorRef).glyph), 1), q(" by " + A(L(ll)(i.value.authorRef).label), 1)], 8, Lu),
				i.value.mergedAt ? (W(), G("span", zu, " merged " + A(L(Il)(i.value.mergedAt)), 1)) : i.value.closedAt ? (W(), G("span", Bu, " closed " + A(L(Il)(i.value.closedAt)), 1)) : J("", !0),
				i.value.createdAt ? (W(), G("span", Vu, " opened " + A(L(Il)(i.value.createdAt)), 1)) : J("", !0)
			])]),
			K("section", Hu, [
				K("button", {
					type: "button",
					class: "pulls-action primary",
					disabled: !C.value || s.value !== "idle",
					onClick: ue
				}, [q(A(s.value === "merging" ? "Merging…" : "Merge") + " ", 1), t[4] ||= K("kbd", null, "m", -1)], 8, Uu),
				K("button", {
					type: "button",
					class: "pulls-action",
					disabled: !w.value || s.value !== "idle",
					onClick: de
				}, [q(A(s.value === "closing" ? "Closing…" : "Close") + " ", 1), t[5] ||= K("kbd", null, "x", -1)], 8, Wu),
				c.value ? (W(), G("span", Gu, A(c.value), 1)) : J("", !0)
			]),
			ee.value ? (W(), G("section", Ku, [t[6] ||= K("h2", null, "Description", -1), K("div", {
				class: "pulls-detail-body-prose",
				innerHTML: ee.value
			}, null, 8, qu)])) : (W(), G("section", Ju, [...t[7] ||= [K("h2", null, "Description", -1), K("p", null, "No description provided.", -1)]])),
			b.value.length > 0 ? (W(), G("section", Yu, [
				K("header", null, [t[8] ||= K("h2", null, "Routed to", -1), K("span", Xu, [q(A(b.value.length) + " project", 1), b.value.length === 1 ? J("", !0) : (W(), G(H, { key: 0 }, [q("s")], 64))])]),
				K("ul", Zu, [(W(!0), G(H, null, dr(b.value, (e) => (W(), G("li", {
					key: e.name,
					class: "pulls-routed-project"
				}, [K("a", {
					href: `/x/issues/?project=${encodeURIComponent(e.name)}`,
					class: "pulls-routed-name",
					title: `Filter issues to project ${e.name}`
				}, "◇ " + A(e.name), 9, Qu), e.owners.length > 0 ? (W(), G("ul", $u, [(W(!0), G(H, null, dr(e.owners, (e) => (W(), G("li", {
					key: e,
					class: "pulls-routed-owner",
					"data-author-kind": L(x)(e).kind,
					title: e
				}, [K("span", td, A(L(x)(e).glyph), 1), q(" " + A(L(x)(e).label), 1)], 8, ed))), 128))])) : (W(), G("span", nd, " no owners declared "))]))), 128))]),
				t[9] ||= K("p", { class: "pulls-routed-source" }, [
					q(" From paths the diff touched · issues this PR closes · "),
					K("code", null, "package comtrya"),
					q(" owners ")
				], -1)
			])) : J("", !0),
			m.value !== "idle" || p.value.length > 0 ? (W(), G("section", rd, [
				K("header", null, [t[10] ||= K("h2", null, "Closes", -1), K("span", id, [m.value === "loading" ? (W(), G(H, { key: 0 }, [q("resolving…")], 64)) : p.value.length === 0 ? (W(), G(H, { key: 1 }, [q(" no linked issues ")], 64)) : (W(), G(H, { key: 2 }, [
					q(A(p.value.length) + " issue", 1),
					p.value.length === 1 ? J("", !0) : (W(), G(H, { key: 0 }, [q("s")], 64)),
					i.value.state === "MERGED" ? (W(), G(H, { key: 1 }, [q(" — auto-closed on merge")], 64)) : (W(), G(H, { key: 2 }, [q(" — will close on merge")], 64))
				], 64))])]),
				p.value.length > 0 ? (W(), G("ul", ad, [(W(!0), G(H, null, dr(p.value, (e, t) => (W(), G("li", {
					key: e.uri,
					class: k({ focused: t === h.value }),
					"aria-selected": t === h.value,
					role: "option",
					onMouseenter: (e) => h.value = t
				}, [
					K("a", {
						href: D(e),
						class: "issue-link"
					}, [K("span", cd, [e.number === null ? (W(), G(H, { key: 1 }, [q("issue")], 64)) : (W(), G(H, { key: 0 }, [q("#" + A(e.number), 1)], 64))]), K("span", ld, A(e.title), 1)], 8, sd),
					e.projectName ? (W(), G("a", {
						key: 0,
						class: "issue-project",
						href: oe(e.projectName),
						title: `Filter to project ${e.projectName}`
					}, "◇ " + A(e.projectName), 9, ud)) : J("", !0),
					K("span", { class: k(["issue-state", O(e.state)]) }, A(e.state.toLowerCase()), 3)
				], 42, od))), 128))])) : J("", !0),
				p.value.length > 0 ? (W(), G("footer", dd, [...t[11] ||= [
					K("kbd", null, "j", -1),
					q(),
					K("kbd", null, "k", -1),
					q(" walk · ", -1),
					K("kbd", null, "↵", -1),
					q(" open ", -1)
				]])) : J("", !0)
			])) : J("", !0),
			K("section", {
				class: "pulls-detail-discussion",
				"data-smoke": "pulls-detail-discussion",
				onCommentThreadUpdate: T
			}, [K("header", null, [K("h2", null, [t[12] ||= q(" Discussion", -1), ne.value === null ? J("", !0) : (W(), G("span", fd, " (" + A(ne.value) + ")", 1))])]), Ii(Gl, {
				tag: "comtrya-comment-thread",
				attributes: { target: te.value },
				properties: { target: te.value }
			}, null, 8, ["attributes", "properties"])], 32),
			Ii(Tu, {
				patch: l.value,
				loading: d.value === "loading",
				error: f.value
			}, null, 8, [
				"patch",
				"loading",
				"error"
			])
		], 64))]));
	}
}), [["styles", [".pulls-detail[data-v-c7f1ae19]{font-family:var(--font-sans,system-ui);gap:22px;display:grid}.pulls-detail-head[data-v-c7f1ae19]{border-bottom:.5px solid var(--fg,#fffffff0);gap:12px;padding-bottom:16px;display:grid}.pulls-detail-title[data-v-c7f1ae19]{flex-wrap:wrap;align-items:baseline;gap:12px;display:flex}.pulls-detail-title h1[data-v-c7f1ae19]{font-family:var(--font-serif,system-ui);flex:320px;margin:0;font-size:28px;line-height:1.1}.back[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);cursor:pointer;background:0 0;border:0;padding:0;font-size:16px;text-decoration:none}.back[data-v-c7f1ae19]:hover{color:var(--fg,#fffffff0)}.pulls-detail-number[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:14px}.pulls-chip-row[data-v-c7f1ae19]{flex-wrap:wrap;align-items:center;gap:6px;margin:4px 0 0;display:flex}.pull-chip[data-v-c7f1ae19]{border:.5px solid var(--line,#ffffff12);font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);align-items:center;gap:5px;padding:2px 8px;font-size:11px;line-height:16px;display:inline-flex}.pull-chip .chip-glyph[data-v-c7f1ae19]{place-items:center;width:13px;height:13px;font-size:10px;font-weight:700;display:inline-grid}.pull-chip.tone-state[data-v-c7f1ae19]{text-transform:lowercase;letter-spacing:.02em;border-color:currentColor}.pull-chip.tone-state.pr-state-ready[data-v-c7f1ae19]{color:var(--accent-teal,#087f6f)}.pull-chip.tone-state.pr-state-draft[data-v-c7f1ae19]{color:var(--fg-3,#ffffff85)}.pull-chip.tone-state.pr-state-merged[data-v-c7f1ae19]{color:var(--accent-blue,#1d55a6)}.pull-chip.tone-state.pr-state-closed[data-v-c7f1ae19]{color:var(--accent-err,#c9341c)}.pull-chip.tone-project[data-v-c7f1ae19]{color:var(--accent-blue,#1d55a6);cursor:help;border-color:currentColor}.pull-chip.tone-branch[data-v-c7f1ae19]{gap:4px}.pull-chip.tone-branch code[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);font-size:11px}.pull-chip.tone-branch .branch-arrow[data-v-c7f1ae19]{color:var(--fg-4,#ffffff57);padding:0 2px}.pull-chip.tone-author[data-v-c7f1ae19]{color:var(--fg-2,#ffffffbd)}.pull-chip.tone-author[data-author-kind=agent][data-v-c7f1ae19]{color:#6b3fa0}.pull-chip.tone-author[data-author-kind=credential][data-v-c7f1ae19]{color:var(--accent-yellow,#c89300)}.pull-chip.tone-author[data-author-kind=bot][data-v-c7f1ae19]{color:var(--accent-blue,#1d55a6)}.pull-chip.tone-author[data-author-kind=team][data-v-c7f1ae19]{color:var(--accent-teal,#087f6f)}.pull-chip.tone-time[data-v-c7f1ae19]{color:var(--fg-3,#ffffff85);border-style:none;padding-left:2px}.pull-chip.tone-time.tone-merged[data-v-c7f1ae19]{color:var(--accent-blue,#1d55a6)}.pull-chip.tone-time.tone-closed[data-v-c7f1ae19]{color:var(--accent-err,#c9341c)}.pulls-detail-actions[data-v-c7f1ae19]{flex-wrap:wrap;align-items:center;gap:10px;display:flex}.pulls-action[data-v-c7f1ae19]{border:.5px solid var(--fg,#fffffff0);background:var(--bg,#0a0b0e);color:var(--fg,#fffffff0);font-family:var(--font-serif,system-ui);cursor:pointer;align-items:center;gap:8px;padding:8px 14px;font-weight:600;display:inline-flex}.pulls-action.primary[data-v-c7f1ae19]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.pulls-action[disabled][data-v-c7f1ae19]{opacity:.5;cursor:not-allowed}.pulls-action kbd[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);opacity:.6;border:.5px solid;padding:0 4px;font-size:10px}.pulls-action-message[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:12px}.pulls-detail-body h2[data-v-c7f1ae19]{font-family:var(--font-serif,system-ui);margin:0 0 8px;font-size:16px}.pulls-detail-body-prose[data-v-c7f1ae19]{color:var(--fg,#fffffff0);font-size:14px;line-height:1.6}.pulls-detail-body-prose h1[data-v-c7f1ae19],.pulls-detail-body-prose h2[data-v-c7f1ae19],.pulls-detail-body-prose h3[data-v-c7f1ae19],.pulls-detail-body-prose h4[data-v-c7f1ae19],.pulls-detail-body-prose h5[data-v-c7f1ae19],.pulls-detail-body-prose h6[data-v-c7f1ae19]{font-family:var(--font-serif,system-ui);margin:1.1em 0 .4em;font-weight:600;line-height:1.25}.pulls-detail-body-prose h1[data-v-c7f1ae19]{font-size:20px}.pulls-detail-body-prose h2[data-v-c7f1ae19]{font-size:17px}.pulls-detail-body-prose h3[data-v-c7f1ae19],.pulls-detail-body-prose h4[data-v-c7f1ae19]{font-size:15px}.pulls-detail-body-prose p[data-v-c7f1ae19]{margin:.55em 0}.pulls-detail-body-prose ul[data-v-c7f1ae19],.pulls-detail-body-prose ol[data-v-c7f1ae19]{margin:.4em 0 .6em;padding-left:22px}.pulls-detail-body-prose li[data-v-c7f1ae19]{margin:.15em 0}.pulls-detail-body-prose code[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);border-radius:2px;padding:1px 5px;font-size:.88em}.pulls-detail-body-prose pre[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);border:.5px solid var(--line,#ffffff12);white-space:pre;word-break:normal;margin:.7em 0;padding:12px 14px;font-size:12.5px;line-height:1.55;overflow-x:auto}.pulls-detail-body-prose pre code[data-v-c7f1ae19]{font-size:inherit;background:0 0;padding:0}.pulls-detail-body-prose a[data-v-c7f1ae19]{color:var(--accent-teal,#087f6f);text-underline-offset:2px;text-decoration:underline}.pulls-detail-body-prose strong[data-v-c7f1ae19]{font-weight:600}.pulls-detail-body-prose em[data-v-c7f1ae19]{font-style:italic}.pulls-detail-body.muted p[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:12px}.pulls-routed[data-v-c7f1ae19]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);gap:10px;padding:12px 14px;display:grid}.pulls-routed>header[data-v-c7f1ae19]{border-bottom:.5px solid var(--line,#ffffff12);justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:6px;display:flex}.pulls-routed>header h2[data-v-c7f1ae19]{font-family:var(--font-serif,system-ui);margin:0;font-size:16px}.pulls-routed>header .muted[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}.pulls-routed-list[data-v-c7f1ae19]{gap:10px;margin:0;padding:0;list-style:none;display:grid}.pulls-routed-project[data-v-c7f1ae19]{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);gap:6px;padding:8px 10px;display:grid}.pulls-routed-name[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--accent-blue,#1d55a6);letter-spacing:.02em;font-size:12px;text-decoration:none}.pulls-routed-name[data-v-c7f1ae19]:hover{text-underline-offset:2px;text-decoration:underline}.pulls-routed-owners[data-v-c7f1ae19]{flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none;display:flex}.pulls-routed-owners.muted[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px;font-style:italic}.pulls-routed-owner[data-v-c7f1ae19]{color:var(--fg,#fffffff0);font-family:var(--font-mono,monospace);letter-spacing:.02em;border:.5px solid;align-items:center;gap:5px;padding:2px 8px;font-size:11px;display:inline-flex}.pulls-routed-owner .chip-glyph[data-v-c7f1ae19]{font-family:var(--font-serif,system-ui);font-size:12px;line-height:1}.pulls-routed-owner[data-author-kind=team][data-v-c7f1ae19]{color:var(--accent-teal,#087f6f)}.pulls-routed-owner[data-author-kind=human][data-v-c7f1ae19]{color:var(--fg,#fffffff0)}.pulls-routed-owner[data-author-kind=agent][data-v-c7f1ae19]{color:#6b3fa0}.pulls-routed-owner[data-author-kind=bot][data-v-c7f1ae19]{color:var(--accent-blue,#1d55a6)}.pulls-routed-owner[data-author-kind=credential][data-v-c7f1ae19]{color:var(--accent-yellow,#c89300)}.pulls-routed-source[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);margin:0;font-size:11px}.pulls-routed-source code[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);color:var(--fg-2,#ffffffbd);padding:0 4px;font-size:11px}.pulls-linked-issues[data-v-c7f1ae19]{gap:8px;display:grid}.pulls-linked-issues header[data-v-c7f1ae19]{border-bottom:.5px solid var(--fg,#fffffff0);justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:4px;display:flex}.pulls-linked-issues h2[data-v-c7f1ae19]{font-family:var(--font-serif,system-ui);margin:0;font-size:18px}.pulls-detail-discussion[data-v-c7f1ae19]{gap:8px;display:grid}.pulls-detail-discussion>header[data-v-c7f1ae19]{border-bottom:.5px solid var(--fg,#fffffff0);justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:4px;display:flex}.pulls-detail-discussion>header h2[data-v-c7f1ae19]{font-family:var(--font-serif,system-ui);margin:0;font-size:18px}.pulls-detail-discussion-count[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:13px;font-weight:400}.pulls-linked-issues .muted[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:12px}.pulls-linked-issues ul[data-v-c7f1ae19]{margin:0;padding:0;list-style:none;display:grid}.pulls-linked-issues li[data-v-c7f1ae19]{border-bottom:.5px solid var(--line,#ffffff12);grid-template-columns:auto minmax(0,1fr) auto auto;align-items:baseline;gap:12px;padding:8px 10px;display:grid;position:relative}.pulls-linked-issues li[data-v-c7f1ae19]:last-child{border-bottom:0}.pulls-linked-issues li.focused[data-v-c7f1ae19]{box-shadow:inset 3px 0 0 var(--fg,#fffffff0);background:var(--bg-2,#0e1014)}.pulls-linked-issues li .issue-link[data-v-c7f1ae19]{color:inherit;text-decoration:none;display:contents}.pulls-linked-issues .issue-project[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);border:.5px solid var(--line,#ffffff12);letter-spacing:.02em;white-space:nowrap;padding:1px 7px;font-size:11px;text-decoration:none}.pulls-linked-issues .issue-project[data-v-c7f1ae19]:hover{color:var(--fg,#fffffff0);border-color:var(--fg,#fffffff0)}.pulls-linked-foot[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);letter-spacing:.04em;margin-top:6px;font-size:11px}.pulls-linked-foot kbd[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);border:.5px solid var(--line,#ffffff12);margin:0 1px;padding:0 4px;font-size:10px}.pulls-linked-issues .issue-num[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-variant-numeric:tabular-nums;font-size:12px}.pulls-linked-issues .issue-title[data-v-c7f1ae19]{font-family:var(--font-serif,system-ui);text-overflow:ellipsis;white-space:nowrap;font-weight:500;overflow:hidden}.pulls-linked-issues .issue-state[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:.5px solid;padding:0 5px;font-size:10px}.pulls-linked-issues .issue-state-open[data-v-c7f1ae19]{color:var(--accent-teal,#087f6f)}.pulls-linked-issues .issue-state-closed[data-v-c7f1ae19]{color:var(--accent-blue,#1d55a6)}.pulls-empty[data-v-c7f1ae19],.pulls-error[data-v-c7f1ae19]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:13px}.pulls-error[data-v-c7f1ae19]{color:var(--accent-err,#c9341c)}"]], ["__scopeId", "data-v-c7f1ae19"]]), md = {
	class: "pulls-overview",
	"data-smoke": "pulls-overview"
}, hd = ["href"], gd = {
	key: 0,
	class: "muted"
}, _d = {
	key: 1,
	class: "muted"
}, vd = {
	key: 2,
	class: "muted"
}, yd = { key: 3 }, bd = ["href"], xd = { class: "num" }, Sd = { class: "title" }, Cd = { class: "age" }, wd = /* @__PURE__ */ Wl(/* @__PURE__ */ Bn({
	__name: "PullsOverview",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ I([]), r = /* @__PURE__ */ I("idle"), i = X(() => t.workspaceId ?? t.host?.workspaceId ?? jl()), a = X(() => t.repositoryId ?? t.host?.repositoryId ?? null), o = X(() => t.repositoryPath ?? t.host?.repositoryPath ?? null), s = X(() => n.value.filter((e) => e.state === "READY" || e.state === "DRAFT").sort((e, t) => {
			let n = Date.parse(e.updatedAt ?? e.createdAt ?? "") || 0;
			return (Date.parse(t.updatedAt ?? t.createdAt ?? "") || 0) - n;
		}).slice(0, 5)), c = X(() => n.value.filter((e) => e.state === "READY").length);
		tr(() => void d()), z(() => [i.value, a.value], () => void d());
		function l() {
			return Ml(o.value);
		}
		function u(e) {
			return Nl(e, o.value);
		}
		async function d() {
			r.value = "loading";
			try {
				n.value = await Sl({
					workspaceId: i.value,
					repositoryId: a.value,
					limit: 32
				}), r.value = n.value.length > 0 ? "ready" : "empty";
			} catch {
				r.value = "error", n.value = [];
			}
		}
		return (e, t) => (W(), G("section", md, [K("header", null, [t[0] ||= K("h3", null, "Pull requests", -1), K("a", { href: l() }, A(c.value) + " open", 9, hd)]), r.value === "loading" ? (W(), G("p", gd, "Loading…")) : r.value === "error" ? (W(), G("p", _d, "Could not load pulls.")) : s.value.length === 0 ? (W(), G("p", vd, "No open pull requests.")) : (W(), G("ul", yd, [(W(!0), G(H, null, dr(s.value, (e) => (W(), G("li", { key: e.id }, [K("a", { href: u(e) }, [
			K("span", xd, "#" + A(e.number), 1),
			K("span", Sd, A(e.title), 1),
			K("span", { class: k(["state", L(Fl)(e.state).className]) }, A(L(Fl)(e.state).label), 3),
			K("span", Cd, A(L(Il)(e.updatedAt ?? e.createdAt)), 1)
		], 8, bd)]))), 128))]))]));
	}
}), [["styles", [".pulls-overview[data-v-a6723eb1]{gap:8px;display:grid}.pulls-overview header[data-v-a6723eb1]{justify-content:space-between;align-items:baseline;display:flex}.pulls-overview h3[data-v-a6723eb1]{font-family:var(--font-serif,system-ui);margin:0;font-size:14px}.pulls-overview header a[data-v-a6723eb1],.muted[data-v-a6723eb1]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:12px;text-decoration:none}.pulls-overview ul[data-v-a6723eb1]{gap:4px;margin:0;padding:0;list-style:none;display:grid}.pulls-overview li a[data-v-a6723eb1]{color:inherit;border-bottom:.5px solid var(--line,#ffffff12);grid-template-columns:auto minmax(0,1fr) auto auto;align-items:baseline;gap:8px;padding:6px 0;text-decoration:none;display:grid}.pulls-overview li:last-child a[data-v-a6723eb1]{border-bottom:0}.num[data-v-a6723eb1]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}.title[data-v-a6723eb1]{text-overflow:ellipsis;white-space:nowrap;font-weight:500;overflow:hidden}.state[data-v-a6723eb1]{font-family:var(--font-mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:.5px solid;padding:0 4px;font-size:10px}.state.pr-state-ready[data-v-a6723eb1]{color:var(--accent-teal,#087f6f)}.state.pr-state-draft[data-v-a6723eb1]{color:var(--fg-3,#ffffff85)}.state.pr-state-merged[data-v-a6723eb1]{color:var(--accent-blue,#1d55a6)}.state.pr-state-closed[data-v-a6723eb1]{color:var(--accent-err,#c9341c)}.age[data-v-a6723eb1]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}"]], ["__scopeId", "data-v-a6723eb1"]]), Td = {
	class: "pulls-queue",
	"data-smoke": "pulls-queue"
}, Ed = { class: "pulls-queue-head" }, Dd = { class: "pulls-queue-controls" }, Od = {
	class: "pulls-filter-row",
	role: "tablist",
	"aria-label": "Filter pull requests by state"
}, kd = ["aria-selected", "onClick"], Ad = { class: "count" }, jd = { class: "pulls-search" }, Md = {
	key: 0,
	class: "pulls-query-chips",
	"data-smoke": "pulls-query-chips",
	"aria-label": "Parsed search filters"
}, Nd = ["title"], Pd = {
	key: 1,
	class: "pulls-author-filter",
	"data-smoke": "pulls-author-filter"
}, Fd = ["data-author-kind", "title"], Id = { class: "author-glyph" }, Ld = {
	key: 0,
	class: "pulls-empty"
}, Rd = {
	key: 1,
	class: "pulls-error",
	role: "alert"
}, zd = {
	key: 2,
	class: "pulls-empty"
}, Bd = {
	key: 3,
	class: "pulls-empty"
}, Vd = {
	key: 4,
	class: "pulls-list",
	role: "listbox",
	"aria-label": "Pull requests"
}, Hd = ["aria-selected", "onMouseenter"], Ud = ["href"], Wd = { class: "pulls-row-number" }, Gd = { class: "pulls-row-body" }, Kd = { class: "pulls-row-title" }, qd = { class: "pulls-row-meta" }, Jd = { class: "pulls-branch" }, Yd = [
	"data-author-kind",
	"title",
	"onClick"
], Xd = { class: "author-glyph" }, Zd = { class: "author-label" }, Qd = { class: "pulls-row-age" }, $d = /* @__PURE__ */ Wl(/* @__PURE__ */ Bn({
	__name: "PullsQueue",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = [
			{
				id: "OPEN",
				label: "Open",
				key: "o"
			},
			{
				id: "DRAFT",
				label: "Draft",
				key: "d"
			},
			{
				id: "MERGED",
				label: "Merged",
				key: "m"
			},
			{
				id: "CLOSED",
				label: "Closed",
				key: "c"
			},
			{
				id: "ALL",
				label: "All",
				key: "a"
			}
		], r = /* @__PURE__ */ I("OPEN"), i = /* @__PURE__ */ I(""), a = /* @__PURE__ */ I(""), o = /* @__PURE__ */ I([]), s = /* @__PURE__ */ I("idle"), c = /* @__PURE__ */ I(null), l = /* @__PURE__ */ I(0), u = X(() => t.workspaceId ?? t.host?.workspaceId ?? jl()), d = X(() => t.repositoryId ?? t.host?.repositoryId ?? null), f = X(() => t.repositoryPath ?? t.host?.repositoryPath ?? null), p = (e, t) => t === "ALL" ? !0 : t === "OPEN" ? e.state === "READY" : e.state === t, m = ["is", "author"], h = {
			open: "OPEN",
			draft: "DRAFT",
			merged: "MERGED",
			closed: "CLOSED",
			all: "ALL"
		}, g = X(() => nl(i.value, m)), _ = X(() => {
			let e = g.value.filters.is ?? [];
			for (let t of e) {
				let e = h[t.toLowerCase()];
				if (e) return e;
			}
			return r.value;
		}), v = X(() => {
			let e = g.value.filters.author ?? [];
			for (let t of e) if (t.startsWith("comtrya://")) return t;
			return a.value;
		}), y = X(() => {
			let e = g.value.text.trim().toLowerCase(), t = v.value, n = _.value;
			return o.value.filter((e) => p(e, n)).filter((e) => t ? e.authorRef === t : !0).filter((t) => {
				if (!e) return !0;
				let n = ll(t.authorRef);
				return `${t.number} ${t.title} ${t.headRef} ${t.baseRef} ${n.label} ${n.kind}`.toLowerCase().includes(e);
			});
		}), b = X(() => {
			let e = [];
			for (let t of g.value.filters.is ?? []) {
				let n = h[t.toLowerCase()];
				e.push({
					key: "is",
					value: t,
					label: n ? `is · ${n.toLowerCase()}` : `is · ${t}`,
					tone: "is"
				});
			}
			for (let t of g.value.filters.author ?? []) {
				let n = ll(t);
				e.push({
					key: "author",
					value: t,
					label: `author · ${n.label}`,
					tone: "author"
				});
			}
			for (let t of g.value.unknown) e.push({
				key: t,
				value: "",
				label: `unknown · ${t}:`,
				tone: "unknown"
			});
			return e;
		});
		function x(e) {
			a.value === e ? a.value = "" : a.value = e;
		}
		function S() {
			a.value = "";
		}
		let C = X(() => {
			let e = {
				OPEN: 0,
				DRAFT: 0,
				MERGED: 0,
				CLOSED: 0,
				ALL: o.value.length
			};
			for (let t of o.value) t.state === "READY" && (e.OPEN += 1), t.state === "DRAFT" && (e.DRAFT += 1), t.state === "MERGED" && (e.MERGED += 1), t.state === "CLOSED" && (e.CLOSED += 1);
			return e;
		}), w = new Set([
			"OPEN",
			"DRAFT",
			"MERGED",
			"CLOSED",
			"ALL"
		]);
		function ee() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = (e.get("state") ?? "").toUpperCase();
			w.has(t) && (r.value = t);
			let n = e.get("q");
			n !== null && (i.value = n);
			let o = e.get("author") ?? "";
			a.value = o.startsWith("comtrya://") ? o : "";
		}
		function te() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			r.value === "OPEN" ? e.delete("state") : e.set("state", r.value);
			let t = i.value.trim();
			t ? e.set("q", t) : e.delete("q"), a.value ? e.set("author", a.value) : e.delete("author");
			let n = e.toString(), o = `${window.location.pathname}${n ? `?${n}` : ""}${window.location.hash}`;
			o !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", o);
		}
		let ne = !1;
		function T() {
			ne = !0, ee(), mn(() => {
				ne = !1;
			});
		}
		tr(() => {
			ne = !0, ee(), ne = !1, ie(), window.addEventListener("popstate", T);
		}), ar(() => {
			window.removeEventListener("popstate", T);
		}), z(() => [u.value, d.value], () => void ie()), z(y, () => {
			l.value >= y.value.length && (l.value = Math.max(0, y.value.length - 1));
		}), z([
			r,
			i,
			a
		], () => {
			ne || te();
		}), ps({
			j: (e) => {
				e.preventDefault(), l.value = Math.min(l.value + 1, Math.max(0, y.value.length - 1));
			},
			ArrowDown: (e) => {
				e.preventDefault(), l.value = Math.min(l.value + 1, Math.max(0, y.value.length - 1));
			},
			k: (e) => {
				e.preventDefault(), l.value = Math.max(l.value - 1, 0);
			},
			ArrowUp: (e) => {
				e.preventDefault(), l.value = Math.max(l.value - 1, 0);
			},
			Enter: (e) => {
				let t = y.value[l.value];
				t && (e.preventDefault(), window.location.href = E(t));
			},
			"/": (e) => {
				e.preventDefault(), document.querySelector("[data-pulls-search]")?.focus();
			},
			...Object.fromEntries(n.map((e) => [e.key, (t) => {
				t.preventDefault(), r.value = e.id;
			}]))
		});
		function re(e) {
			i.value &&= (e.preventDefault(), "");
		}
		function E(e) {
			return Nl(e, f.value);
		}
		async function ie() {
			s.value = "loading", c.value = null;
			try {
				o.value = (await Sl({
					workspaceId: u.value,
					repositoryId: d.value
				})).sort((e, t) => {
					let n = Date.parse(e.updatedAt ?? e.createdAt ?? "") || 0;
					return (Date.parse(t.updatedAt ?? t.createdAt ?? "") || 0) - n;
				}), s.value = o.value.length > 0 ? "ready" : "empty";
			} catch (e) {
				o.value = [], s.value = "error", c.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (e, t) => (W(), G("section", Td, [
			K("header", Ed, [
				t[4] ||= K("h2", null, "Pull requests", -1),
				K("div", Dd, [K("div", Od, [(W(), G(H, null, dr(n, (e) => K("button", {
					key: e.id,
					type: "button",
					role: "tab",
					"aria-selected": r.value === e.id,
					class: k(["pulls-filter", { active: r.value === e.id }]),
					onClick: (t) => r.value = e.id
				}, [
					K("span", null, A(e.label), 1),
					K("span", Ad, A(C.value[e.id]), 1),
					K("kbd", null, A(e.key), 1)
				], 10, kd)), 64))]), K("label", jd, [Dn(K("input", {
					"data-pulls-search": "",
					"onUpdate:modelValue": t[0] ||= (e) => i.value = e,
					type: "search",
					placeholder: "Search pull requests",
					autocomplete: "off",
					onKeydown: po(re, ["esc"])
				}, null, 544), [[so, i.value]]), t[1] ||= K("kbd", null, "/", -1)])]),
				b.value.length > 0 ? (W(), G("div", Md, [(W(!0), G(H, null, dr(b.value, (e) => (W(), G("span", {
					key: `${e.key}:${e.value || "unknown"}`,
					class: k(["query-chip", `tone-${e.tone}`]),
					title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
				}, A(e.label), 11, Nd))), 128)), t[2] ||= K("span", { class: "query-chips-hint" }, [
					q(" syntax: "),
					K("code", null, "is:open"),
					q(" · "),
					K("code", null, "is:draft"),
					q(" · "),
					K("code", null, "author:<urn>")
				], -1)])) : J("", !0),
				a.value ? (W(), G("div", Pd, [
					t[3] ||= K("span", { class: "prefix" }, "authored by", -1),
					K("span", {
						class: "active-chip",
						"data-author-kind": L(ll)(a.value).kind,
						title: a.value
					}, [K("span", Id, A(L(ll)(a.value).glyph), 1), q(" " + A(L(ll)(a.value).label), 1)], 8, Fd),
					K("button", {
						type: "button",
						class: "clear",
						onClick: S,
						"aria-label": "Clear author filter"
					}, "clear ✕")
				])) : J("", !0)
			]),
			s.value === "loading" ? (W(), G("p", Ld, "Loading pull requests…")) : s.value === "error" ? (W(), G("p", Rd, A(c.value), 1)) : o.value.length === 0 ? (W(), G("p", zd, [...t[5] ||= [
				q(" No pull requests yet. Push a branch and open one through the ", -1),
				K("code", null, "create-pull", -1),
				q(" op or the SDK. ", -1)
			]])) : y.value.length === 0 ? (W(), G("p", Bd, " No pull requests match the current filter. ")) : (W(), G("ol", Vd, [(W(!0), G(H, null, dr(y.value, (e, n) => (W(), G("li", {
				key: e.id,
				class: k(["pulls-row", { focused: n === l.value }]),
				role: "option",
				"aria-selected": n === l.value,
				onMouseenter: (e) => l.value = n
			}, [K("a", {
				href: E(e),
				class: "pulls-row-link"
			}, [
				K("span", Wd, "#" + A(e.number), 1),
				K("span", Gd, [K("span", Kd, A(e.title), 1), K("span", qd, [
					K("span", { class: k(["pulls-state", L(Fl)(e.state).className]) }, A(L(Fl)(e.state).label), 3),
					K("code", Jd, [
						q(A(e.headRef) + " ", 1),
						t[6] ||= K("span", null, "→", -1),
						q(" " + A(e.baseRef), 1)
					]),
					K("button", {
						type: "button",
						class: k(["pulls-author", { active: a.value === e.authorRef }]),
						"data-author-kind": L(ll)(e.authorRef).kind,
						title: `${e.authorRef}\nClick to filter by this author`,
						onClick: uo((t) => x(e.authorRef), ["prevent", "stop"])
					}, [K("span", Xd, A(L(ll)(e.authorRef).glyph), 1), K("span", Zd, A(L(ll)(e.authorRef).label), 1)], 10, Yd)
				])]),
				K("span", Qd, A(L(Il)(e.updatedAt ?? e.createdAt)), 1)
			], 8, Ud)], 42, Hd))), 128))])),
			t[7] ||= Bi("<footer class=\"pulls-queue-foot\" data-v-4fbb2eed><span data-v-4fbb2eed><kbd data-v-4fbb2eed>j</kbd> <kbd data-v-4fbb2eed>k</kbd> navigate · <kbd data-v-4fbb2eed>↵</kbd> open · <kbd data-v-4fbb2eed>/</kbd> search · <kbd data-v-4fbb2eed>o</kbd> open <kbd data-v-4fbb2eed>d</kbd> draft <kbd data-v-4fbb2eed>m</kbd> merged <kbd data-v-4fbb2eed>c</kbd> closed <kbd data-v-4fbb2eed>a</kbd> all </span></footer>", 1)
		]));
	}
}), [["styles", [".pulls-queue[data-v-4fbb2eed]{font-family:var(--font-sans,system-ui);color:var(--fg,#fffffff0);gap:16px;display:grid}.pulls-queue-head[data-v-4fbb2eed]{gap:12px;display:grid}.pulls-queue-head h2[data-v-4fbb2eed]{font-family:var(--font-serif,system-ui);margin:0;font-size:22px;line-height:1}.pulls-queue-controls[data-v-4fbb2eed]{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;display:flex}.pulls-filter-row[data-v-4fbb2eed]{border:.5px solid var(--fg,#fffffff0);flex-wrap:wrap;gap:4px;display:inline-flex}.pulls-filter[data-v-4fbb2eed]{color:inherit;cursor:pointer;font-family:var(--font-mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;display:inline-flex}.pulls-filter[data-v-4fbb2eed]:not(:last-child){border-right:.5px solid var(--line,#ffffff12)}.pulls-filter.active[data-v-4fbb2eed]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.pulls-filter .count[data-v-4fbb2eed]{color:var(--fg-3,#ffffff85);font-variant-numeric:tabular-nums}.pulls-filter.active .count[data-v-4fbb2eed]{color:var(--bg-2,#0e1014)}.pulls-filter kbd[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);opacity:.6;border:.5px solid;padding:0 4px;font-size:10px}.pulls-search[data-v-4fbb2eed]{border:.5px solid var(--fg,#fffffff0);flex:240px;align-items:center;gap:8px;min-width:240px;max-width:420px;padding:4px 10px;display:inline-flex}.pulls-search input[data-v-4fbb2eed]{color:inherit;font:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0}.pulls-search kbd[data-v-4fbb2eed]{border:.5px solid var(--fg,#fffffff0);font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);padding:0 4px;font-size:10px}.pulls-list[data-v-4fbb2eed]{border-top:.5px solid var(--fg,#fffffff0);margin:0;padding:0;list-style:none;display:grid}.pulls-row[data-v-4fbb2eed]{border-bottom:.5px solid var(--line,#ffffff12)}.pulls-row.focused[data-v-4fbb2eed]{background:var(--bg-2,#0e1014)}.pulls-row-link[data-v-4fbb2eed]{color:inherit;grid-template-columns:56px 1fr auto;align-items:baseline;gap:14px;padding:12px 12px 12px 6px;text-decoration:none;display:grid}.pulls-row-link[data-v-4fbb2eed]:hover{background:var(--bg-2,#0e1014);text-decoration:none}.pulls-row-number[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);text-align:right;font-variant-numeric:tabular-nums;font-size:12px}.pulls-row-body[data-v-4fbb2eed]{gap:4px;min-width:0;display:grid}.pulls-row-title[data-v-4fbb2eed]{font-family:var(--font-serif,system-ui);text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;overflow:hidden}.pulls-row-meta[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);flex-wrap:wrap;align-items:baseline;gap:10px;font-size:12px;display:flex}.pulls-state[data-v-4fbb2eed]{letter-spacing:.04em;text-transform:uppercase;border:.5px solid;padding:0 6px;font-size:11px}.pulls-state.pr-state-ready[data-v-4fbb2eed]{color:var(--accent-teal,#087f6f)}.pulls-state.pr-state-draft[data-v-4fbb2eed]{color:var(--fg-3,#ffffff85)}.pulls-state.pr-state-merged[data-v-4fbb2eed]{color:var(--accent-blue,#1d55a6)}.pulls-state.pr-state-closed[data-v-4fbb2eed]{color:var(--accent-err,#c9341c)}.pulls-branch[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);font-size:12px}.pulls-branch span[data-v-4fbb2eed]{color:var(--fg-4,#ffffff57);padding:0 4px}.pulls-author[data-v-4fbb2eed]{color:inherit;font:inherit;font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:1px dashed #0000;align-items:center;gap:5px;padding:0 5px;font-size:12px;display:inline-flex}.pulls-author[data-v-4fbb2eed]:hover{background:var(--bg-2,#0e1014);border-color:currentColor}.pulls-author.active[data-v-4fbb2eed]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);border-color:var(--fg,#fffffff0);border-style:solid}.pulls-author.active .author-glyph[data-v-4fbb2eed],.pulls-author.active .author-label[data-v-4fbb2eed]{color:inherit}.pulls-query-chips[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;font-size:11px;display:flex}.pulls-query-chips .query-chip[data-v-4fbb2eed]{letter-spacing:.02em;white-space:nowrap;border:.5px solid;align-items:center;padding:1px 7px;display:inline-flex}.pulls-query-chips .query-chip.tone-is[data-v-4fbb2eed]{color:var(--accent-teal,#087f6f)}.pulls-query-chips .query-chip.tone-author[data-v-4fbb2eed]{color:var(--fg,#fffffff0)}.pulls-query-chips .query-chip.tone-unknown[data-v-4fbb2eed]{color:var(--accent-warn,#c89300);border-style:dashed}.pulls-query-chips .query-chips-hint[data-v-4fbb2eed]{color:var(--fg-3,#ffffff85);letter-spacing:0;margin-left:4px}.pulls-query-chips .query-chips-hint code[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);color:var(--fg-2,#ffffffbd);padding:0 4px;font-size:11px}.pulls-author-filter[data-v-4fbb2eed]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);align-items:center;gap:8px;margin-top:8px;padding:6px 10px;font-size:11px;display:inline-flex}.pulls-author-filter .prefix[data-v-4fbb2eed]{color:var(--fg-3,#ffffff85);letter-spacing:.04em;text-transform:lowercase}.pulls-author-filter .active-chip[data-v-4fbb2eed]{color:var(--fg,#fffffff0);border:.5px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.pulls-author-filter .active-chip[data-author-kind=agent][data-v-4fbb2eed]{color:#6b3fa0}.pulls-author-filter .active-chip[data-author-kind=credential][data-v-4fbb2eed]{color:var(--accent-yellow,#c89300)}.pulls-author-filter .active-chip[data-author-kind=bot][data-v-4fbb2eed]{color:var(--accent-blue,#1d55a6)}.pulls-author-filter .active-chip[data-author-kind=team][data-v-4fbb2eed]{color:var(--accent-teal,#087f6f)}.pulls-author-filter .author-glyph[data-v-4fbb2eed]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.pulls-author-filter .clear[data-v-4fbb2eed]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.pulls-author-filter .clear[data-v-4fbb2eed]:hover{color:var(--fg,#fffffff0)}.pulls-author .author-glyph[data-v-4fbb2eed]{width:14px;height:14px;color:var(--fg-3,#ffffff85);border:.5px solid;place-items:center;font-size:10px;font-weight:700;display:inline-grid}.pulls-author[data-author-kind=agent] .author-glyph[data-v-4fbb2eed],.pulls-author[data-author-kind=agent] .author-label[data-v-4fbb2eed],.pulls-author[data-author-kind=agent] .author-badge[data-v-4fbb2eed]{color:#6b3fa0}.pulls-author[data-author-kind=credential] .author-glyph[data-v-4fbb2eed],.pulls-author[data-author-kind=credential] .author-label[data-v-4fbb2eed],.pulls-author[data-author-kind=credential] .author-badge[data-v-4fbb2eed]{color:var(--accent-yellow,#c89300)}.pulls-author[data-author-kind=bot] .author-glyph[data-v-4fbb2eed],.pulls-author[data-author-kind=bot] .author-label[data-v-4fbb2eed],.pulls-author[data-author-kind=bot] .author-badge[data-v-4fbb2eed]{color:var(--accent-blue,#1d55a6)}.pulls-author .author-badge[data-v-4fbb2eed]{letter-spacing:.04em;text-transform:uppercase;border:.5px solid;padding:0 4px;font-size:10px}.pulls-row-age[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);white-space:nowrap;font-size:12px}.pulls-empty[data-v-4fbb2eed],.pulls-error[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);border-top:.5px solid var(--line,#ffffff12);padding:18px 0;font-size:13px}.pulls-error[data-v-4fbb2eed]{color:var(--accent-err,#c9341c)}.pulls-queue-foot[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}.pulls-queue-foot kbd[data-v-4fbb2eed]{font-family:var(--font-mono,monospace);border:.5px solid;padding:0 4px;font-size:10px}"]], ["__scopeId", "data-v-4fbb2eed"]]), ef = {
	class: "pulls-your-work",
	"data-smoke": "pulls-your-work"
}, tf = ["href"], nf = {
	key: 0,
	class: "muted"
}, rf = {
	key: 1,
	class: "muted"
}, af = {
	key: 2,
	class: "muted"
}, of = { key: 3 }, sf = ["href"], cf = { class: "num" }, lf = { class: "title" }, uf = { class: "meta" }, df = /* @__PURE__ */ Wl(/* @__PURE__ */ Bn({
	__name: "PullsYourWork",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		viewerRef: { type: [String, null] },
		repositoryPath: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ I([]), r = /* @__PURE__ */ I("idle"), i = X(() => t.workspaceId ?? t.host?.workspaceId ?? jl()), a = X(() => t.viewerRef ?? t.host?.viewerRef ?? null), o = X(() => t.repositoryPath ?? t.host?.repositoryPath ?? null), s = X(() => a.value ? n.value.filter((e) => e.authorRef === a.value).filter((e) => e.state === "READY" || e.state === "DRAFT").slice(0, 5) : n.value.filter((e) => e.state === "READY" || e.state === "DRAFT").slice(0, 5));
		tr(() => void u()), z(() => [i.value], () => void u());
		function c() {
			return Ml(o.value);
		}
		function l(e) {
			return Nl(e, o.value);
		}
		async function u() {
			r.value = "loading";
			try {
				n.value = await Sl({
					workspaceId: i.value,
					limit: 64
				}), r.value = n.value.length > 0 ? "ready" : "empty";
			} catch {
				r.value = "error", n.value = [];
			}
		}
		return (e, t) => (W(), G("section", ef, [K("header", null, [t[0] ||= K("h3", null, "Your pull requests", -1), K("a", { href: c() }, "queue", 8, tf)]), r.value === "loading" ? (W(), G("p", nf, "Loading…")) : r.value === "error" ? (W(), G("p", rf, "Could not load pulls.")) : s.value.length === 0 ? (W(), G("p", af, " Nothing here yet. Open a pull request to see it in this rail. ")) : (W(), G("ul", of, [(W(!0), G(H, null, dr(s.value, (e) => (W(), G("li", { key: e.id }, [K("a", { href: l(e) }, [
			K("span", cf, "#" + A(e.number), 1),
			K("span", lf, A(e.title), 1),
			K("span", { class: k(["state", L(Fl)(e.state).className]) }, A(L(Fl)(e.state).label), 3),
			K("span", uf, A(L(dl)(e.authorRef)) + " · " + A(L(Il)(e.updatedAt ?? e.createdAt)), 1)
		], 8, sf)]))), 128))]))]));
	}
}), [["styles", [".pulls-your-work[data-v-c169d03e]{gap:8px;display:grid}.pulls-your-work header[data-v-c169d03e]{justify-content:space-between;align-items:baseline;display:flex}.pulls-your-work h3[data-v-c169d03e]{font-family:var(--font-serif,system-ui);margin:0;font-size:14px}.pulls-your-work header a[data-v-c169d03e],.muted[data-v-c169d03e]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:12px;text-decoration:none}.pulls-your-work ul[data-v-c169d03e]{margin:0;padding:0;list-style:none;display:grid}.pulls-your-work li a[data-v-c169d03e]{color:inherit;border-bottom:.5px solid var(--line,#ffffff12);grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline;gap:8px;padding:8px 0;text-decoration:none;display:grid}.pulls-your-work li:last-child a[data-v-c169d03e]{border-bottom:0}.num[data-v-c169d03e]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}.title[data-v-c169d03e]{text-overflow:ellipsis;white-space:nowrap;grid-row:1;overflow:hidden}.state[data-v-c169d03e]{font-family:var(--font-mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:.5px solid;padding:0 4px;font-size:10px}.state.pr-state-ready[data-v-c169d03e]{color:var(--accent-teal,#087f6f)}.state.pr-state-draft[data-v-c169d03e]{color:var(--fg-3,#ffffff85)}.state.pr-state-merged[data-v-c169d03e]{color:var(--accent-blue,#1d55a6)}.state.pr-state-closed[data-v-c169d03e]{color:var(--accent-err,#c9341c)}.meta[data-v-c169d03e]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);grid-column:1/-1;font-size:11px}"]], ["__scopeId", "data-v-c169d03e"]]), ff = "ext_pull_requests", pf = "comtrya-pulls-queue", mf = "comtrya-pulls-detail", hf = "comtrya-pulls-your-work", gf = "comtrya-pulls-overview";
fl({
	tagName: pf,
	component: $d
}), fl({
	tagName: mf,
	component: pd
}), fl({
	tagName: hf,
	component: df
}), fl({
	tagName: gf,
	component: wd
});
var _f = {
	id: ff,
	setup(e) {
		e.registerWidget({
			id: "pulls-your-work",
			element: hf,
			defaultSlot: "home.your-work",
			defaultPriority: 100,
			requiredPermission: "pull-requests.read"
		}), e.registerWidget({
			id: "pulls-overview",
			element: gf,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "pull-requests.read"
		}), e.registerRoute("/", {
			element: pf,
			requiredPermission: "pull-requests.read"
		}), e.registerRoute("/:pullId", {
			element: mf,
			requiredPermission: "pull-requests.read"
		}), Vl();
	}
};
//#endregion
export { _f as default };
