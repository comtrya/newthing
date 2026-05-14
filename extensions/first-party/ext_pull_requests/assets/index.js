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
	let t = /* @__PURE__ */ F(e);
	return t === e ? t : (N(t, "iterate", Qe), /* @__PURE__ */ P(e) ? t : t.map(I));
}
function tt(e) {
	return N(e = /* @__PURE__ */ F(e), "iterate", Qe), e;
}
function nt(e, t) {
	return /* @__PURE__ */ zt(e) ? Ht(/* @__PURE__ */ Rt(e) ? I(t) : t) : I(t);
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
	return r !== e && !/* @__PURE__ */ P(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var at = Array.prototype;
function ot(e, t, n, r, i, a) {
	let o = tt(e), s = o !== e && !/* @__PURE__ */ P(e), c = o[t];
	if (c !== at[t]) {
		let t = c.apply(e, a);
		return s ? I(t) : t;
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
	let i = tt(e), a = i !== e && !/* @__PURE__ */ P(e), o = n, s = !1;
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
	N(r, "iterate", Qe);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ Bt(n[0]) ? (n[0] = /* @__PURE__ */ F(n[0]), r[t](...n)) : i;
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
		let o = Reflect.get(e, t, /* @__PURE__ */ L(e) ? e : n);
		if ((_(t) ? dt.has(t) : ut(t)) || (r || N(e, "get", t), i)) return o;
		if (/* @__PURE__ */ L(o)) {
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
			if (!/* @__PURE__ */ P(n) && !/* @__PURE__ */ zt(n) && (i = /* @__PURE__ */ F(i), n = /* @__PURE__ */ F(n)), !a && /* @__PURE__ */ L(i) && !/* @__PURE__ */ L(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : u(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ L(e) ? e : r);
		return e === /* @__PURE__ */ F(r) && (o ? D(n, i) && $e(e, "set", t, n, i) : $e(e, "add", t, n)), s;
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
		let i = this.__v_raw, a = /* @__PURE__ */ F(i), o = f(a), c = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, u = i[e](...r), d = n ? yt : t ? Ht : I;
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
			let r = this.__v_raw, i = /* @__PURE__ */ F(r), a = /* @__PURE__ */ F(n);
			e || (D(n, a) && N(i, "get", n), N(i, "get", a));
			let { has: o } = bt(i), s = t ? yt : e ? Ht : I;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && N(/* @__PURE__ */ F(t), "iterate", Xe), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ F(n), i = /* @__PURE__ */ F(t);
			return e || (D(t, i) && N(r, "has", t), N(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ F(a), s = t ? yt : e ? Ht : I;
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
			let n = /* @__PURE__ */ F(this), r = bt(n), i = /* @__PURE__ */ F(e), a = !t && !/* @__PURE__ */ P(e) && !/* @__PURE__ */ zt(e) ? i : e;
			return r.has.call(n, a) || D(e, a) && r.has.call(n, e) || D(i, a) && r.has.call(n, i) || (n.add(a), $e(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ P(n) && !/* @__PURE__ */ zt(n) && (n = /* @__PURE__ */ F(n));
			let r = /* @__PURE__ */ F(this), { has: i, get: a } = bt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ F(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? D(n, s) && $e(r, "set", e, n, s) : $e(r, "add", e, n), this;
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
function P(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function Bt(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function F(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ F(t) : e;
}
function Vt(e) {
	return !u(e, "__v_skip") && Object.isExtensible(e) && O(e, "__v_skip", !0), e;
}
var I = (e) => v(e) ? /* @__PURE__ */ Pt(e) : e, Ht = (e) => v(e) ? /* @__PURE__ */ It(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function L(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function R(e) {
	return Ut(e, !1);
}
function Ut(e, t) {
	return /* @__PURE__ */ L(e) ? e : new Wt(e, t);
}
var Wt = class {
	constructor(e, t) {
		this.dep = new qe(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ F(e), this._value = t ? e : I(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ P(e) || /* @__PURE__ */ zt(e);
		e = n ? e : /* @__PURE__ */ F(e), D(e, t) && (this._rawValue = e, this._value = n ? e : I(e), this.dep.trigger());
	}
};
function z(e) {
	return /* @__PURE__ */ L(e) ? e.value : e;
}
var Gt = {
	get: (e, t, n) => t === "__v_raw" ? e : z(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ L(i) && !/* @__PURE__ */ L(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Kt(e) {
	return /* @__PURE__ */ Rt(e) ? e : new Proxy(e, Gt);
}
var qt = class {
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
function Jt(e, t, n = !1) {
	let r, i;
	return h(e) ? r = e : (r = e.get, i = e.set), new qt(r, i, n);
}
var Yt = {}, Xt = /* @__PURE__ */ new WeakMap(), Zt = void 0;
function Qt(e, t = !1, n = Zt) {
	if (n) {
		let t = Xt.get(n);
		t || Xt.set(n, t = []), t.push(e);
	}
}
function $t(e, n, i = t) {
	let { immediate: a, deep: o, once: s, scheduler: l, augmentJob: u, call: f } = i, p = (e) => o ? e : /* @__PURE__ */ P(e) || o === !1 || o === 0 ? en(e, 1) : en(e), m, g, _, v, y = !1, b = !1;
	if (/* @__PURE__ */ L(e) ? (g = () => e.value, y = /* @__PURE__ */ P(e)) : /* @__PURE__ */ Rt(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some((e) => /* @__PURE__ */ Rt(e) || /* @__PURE__ */ P(e)), g = () => e.map((e) => {
		if (/* @__PURE__ */ L(e)) return e.value;
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
		let t = Zt;
		Zt = m;
		try {
			return f ? f(e, 3, [v]) : e(v);
		} finally {
			Zt = t;
		}
	} : r, n && o) {
		let e = g, t = o === !0 ? Infinity : o;
		g = () => en(e(), t);
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
	let C = b ? Array(e.length).fill(Yt) : Yt, w = (e) => {
		if (!(!(m.flags & 1) || !m.dirty && !e)) if (n) {
			let e = m.run();
			if (o || y || (b ? e.some((e, t) => D(e, C[t])) : D(e, C))) {
				_ && _();
				let t = Zt;
				Zt = m;
				try {
					let t = [
						e,
						C === Yt ? void 0 : b && C[0] === Yt ? [] : C,
						v
					];
					C = e, f ? f(n, 3, t) : n(...t);
				} finally {
					Zt = t;
				}
			}
		} else m.run();
	};
	return u && u(w), m = new De(g), m.scheduler = l ? () => l(w, !1) : w, v = (e) => Qt(e, !1, m), _ = m.onStop = () => {
		let e = Xt.get(m);
		if (e) {
			if (f) f(e, 4);
			else for (let t of e) t();
			Xt.delete(m);
		}
	}, n ? a ? w(!0) : C = m.run() : l ? l(w.bind(null, !0), !0) : m.run(), S.pause = m.pause.bind(m), S.resume = m.resume.bind(m), S.stop = S, S;
}
function en(e, t = Infinity, n) {
	if (t <= 0 || !v(e) || e.__v_skip || (n ||= /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t)) return e;
	if (n.set(e, t), t--, /* @__PURE__ */ L(e)) en(e.value, t, n);
	else if (d(e)) for (let r = 0; r < e.length; r++) en(e[r], t, n);
	else if (p(e) || f(e)) e.forEach((e) => {
		en(e, t, n);
	});
	else if (C(e)) {
		for (let r in e) en(e[r], t, n);
		for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && en(e[r], t, n);
	}
	return e;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.34/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function tn(e, t, n, r) {
	try {
		return r ? e(...r) : e();
	} catch (e) {
		rn(e, t, n);
	}
}
function nn(e, t, n, r) {
	if (h(e)) {
		let i = tn(e, t, n, r);
		return i && y(i) && i.catch((e) => {
			rn(e, t, n);
		}), i;
	}
	if (d(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(nn(e[a], t, n, r));
		return i;
	}
}
function rn(e, n, r, i = !0) {
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
			He(), tn(o, null, 10, [
				e,
				i,
				a
			]), Ue();
			return;
		}
	}
	an(e, r, a, i, s);
}
function an(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var B = [], on = -1, sn = [], cn = null, ln = 0, un = /* @__PURE__ */ Promise.resolve(), dn = null;
function fn(e) {
	let t = dn || un;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function pn(e) {
	let t = on + 1, n = B.length;
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
function _n(e, t, n = on + 1) {
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
		for (on = 0; on < B.length; on++) {
			let e = B[on];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), tn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; on < B.length; on++) {
			let e = B[on];
			e && (e.flags &= -2);
		}
		on = -1, B.length = 0, vn(e), dn = null, (B.length || sn.length) && bn(e);
	}
}
var V = null, xn = null;
function Sn(e) {
	let t = V;
	return V = e, xn = e && e.type.__scopeId || null, t;
}
function Cn(e, t = V, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && Di(-1);
		let i = Sn(t), a;
		try {
			a = e(...n);
		} finally {
			Sn(i), r._d && Di(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function wn(e, n) {
	if (V === null) return e;
	let r = ca(V), i = e.dirs ||= [];
	for (let e = 0; e < n.length; e++) {
		let [a, o, s, c = t] = n[e];
		a && (h(a) && (a = {
			mounted: a,
			updated: a
		}), a.deep && en(o), i.push({
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
		c && (He(), nn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), Ue());
	}
}
function En(e, t) {
	if (Z) {
		let n = Z.provides, r = Z.parent && Z.parent.provides;
		r === n && (n = Z.provides = Object.create(r)), n[e] = t;
	}
}
function Dn(e, t, n = !1) {
	let r = qi();
	if (r || Mr) {
		let i = Mr ? Mr._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t;
	}
}
var On = /* @__PURE__ */ Symbol.for("v-scx"), kn = () => Dn(On);
function An(e, t, n) {
	return jn(e, t, n);
}
function jn(e, n, i = t) {
	let { immediate: a, deep: o, flush: c, once: l } = i, u = s({}, i), d = n && a || !n && c !== "post", f;
	if ($i) {
		if (c === "sync") {
			let e = kn();
			f = e.__watcherHandles ||= [];
		} else if (!d) {
			let e = () => {};
			return e.stop = r, e.resume = r, e.pause = r, e;
		}
	}
	let p = Z;
	u.call = (e, t, n) => nn(e, p, t, n);
	let m = !1;
	c === "post" ? u.scheduler = (e) => {
		U(e, p && p.suspense);
	} : c !== "sync" && (m = !0, u.scheduler = (e, t) => {
		t ? e() : mn(e);
	}), u.augmentJob = (e) => {
		n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p));
	};
	let h = $t(e, n, u);
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
	let s = a.shapeFlag & 4 ? ca(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ F(v), b = v === t ? i : (e) => Bn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Bn(_, t));
	if (m != null && m !== p) {
		if (Un(n), g(m)) _[m] = null, b(m) && (v[m] = null);
		else if (/* @__PURE__ */ L(m)) {
			let e = n;
			x(m, e.k) && (m.value = null), e.k && (_[e.k] = null);
		}
	}
	if (h(p)) tn(p, f, 12, [l, _]);
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
					i(), Vn.delete(e);
				};
				t.id = -1, Vn.set(e, t), U(t, r);
			} else Un(e), i();
		}
	}
}
function Un(e) {
	let t = Vn.get(e);
	t && (t.flags |= 8, Vn.delete(e));
}
ue().requestIdleCallback, ue().cancelIdleCallback;
var Wn = (e) => !!e.type.__asyncLoader, Gn = (e) => e.type.__isKeepAlive;
function Kn(e, t) {
	Jn(e, "a", t);
}
function qn(e, t) {
	Jn(e, "da", t);
}
function Jn(e, t, n = Z) {
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
function Xn(e, t, n = Z, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			He();
			let i = Xi(n), a = nn(t, n, e, r);
			return i(), Ue(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Zn = (e) => (t, n = Z) => {
	(!$i || e === "sp") && Xn(e, (...e) => t(...e), n);
}, Qn = Zn("bm"), $n = Zn("m"), er = Zn("bu"), tr = Zn("u"), nr = Zn("bum"), rr = Zn("um"), ir = Zn("sp"), ar = Zn("rtg"), or = Zn("rtc");
function sr(e, t = Z) {
	Xn("ec", e, t);
}
var cr = /* @__PURE__ */ Symbol.for("v-ndc");
function lr(e, t, n, r) {
	let i, a = n && n[r], o = d(e);
	if (o || g(e)) {
		let n = o && /* @__PURE__ */ Rt(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ P(e), s = /* @__PURE__ */ zt(e), e = tt(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Ht(I(e[n])) : I(e[n]) : e[n], n, void 0, a && a[n]);
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
		mn(e.update);
	},
	$nextTick: (e) => e.n ||= fn.bind(e.proxy),
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
		if (d) return n === "$attrs" && N(e.attrs, "get", ""), d(e);
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
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: ee, renderTracked: te, renderTriggered: ne, errorCaptured: T, serverPrefetch: re, expose: E, inheritAttrs: ie, components: ae, directives: D, filters: oe } = t;
	if (u && _r(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Pt(t));
	}
	if (hr = !0, o) for (let e in o) {
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
	if (c) for (let e in c) yr(c[e], i, n, e);
	if (l) {
		let e = h(l) ? l.call(n) : l;
		Reflect.ownKeys(e).forEach((t) => {
			En(t, e[t]);
		});
	}
	f && vr(f, e, "c");
	function O(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (O(Qn, p), O($n, m), O(er, g), O(tr, _), O(Kn, y), O(qn, b), O(sr, T), O(or, te), O(ar, ne), O(nr, S), O(rr, w), O(ir, re), d(E)) if (E.length) {
		let t = e.exposed ||= {};
		E.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	ee && e.render === r && (e.render = ee), ie != null && (e.inheritAttrs = ie), ae && (e.components = ae), D && (e.directives = D), re && zn(e);
}
function _r(e, t, n = r) {
	d(e) && (e = Tr(e));
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
function vr(e, t, n) {
	nn(d(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function yr(e, t, n, r) {
	let i = r.includes(".") ? Nn(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && An(i, n);
	} else if (h(e)) An(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => yr(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && An(i, r, e);
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
function H(e, t) {
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
	for (let r in t) n[r] = H(e[r], t[r]);
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
					let u = l._ceVNode || Y(n, r);
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, ca(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				c && (nn(o, l._instance, 16), e(null, l._container), delete l._container.__vue_app__);
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
var Mr = null, Nr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${T(t)}Modifiers`] || e[`${E(t)}Modifiers`];
function Pr(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && Nr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(se)));
	let c, l = i[c = ae(n)] || i[c = ae(T(n))];
	!l && o && (l = i[c = ae(E(n))]), l && nn(l, e, 6, a);
	let u = i[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, nn(u, e, 6, a);
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
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, E(t)) || u(e, t));
}
function Rr(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: s, attrs: c, emit: l, render: u, renderCache: d, props: f, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = Sn(e), v, y;
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
		wi.length = 0, rn(t, e, 1), v = Y(Si);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = Br(y, a)), b = Ii(b, y, !1, !0));
	}
	return n.dirs && (b = Ii(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && Ln(b, n.transition), v = b, Sn(_), v;
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
	return n === "style" && v(r) && v(i) ? !be(r, i) : r !== i;
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
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ F(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (Lr(e.emitsOptions, o)) continue;
				let d = t[o];
				if (c) if (u(a, o)) d !== a[o] && (a[o] = d, l = !0);
				else {
					let t = T(o);
					i[t] = Zr(c, s, t, d, e, !1);
				}
				else d !== a[o] && (a[o] = d, l = !0);
			}
		}
	} else {
		Xr(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !u(t, a) && ((r = E(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Zr(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !u(t, e)) && (delete a[e], l = !0);
	}
	l && $e(e.attrs, "set", "");
}
function Xr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (ee(t)) continue;
		let l = n[t], d;
		a && u(a, d = T(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : Lr(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ F(r), i = c || t;
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
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === E(n)) && (r = !0));
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
		let n = T(c[e]);
		ei(n) && (l[n] = t);
	}
	else if (c) for (let e in c) {
		let t = T(e);
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
	let r = Cn((...e) => ni(t(...e)), n);
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
		e ? (oi(r, t, n), n && O(r, "_", e, !0)) : ii(t, r);
	} else t && ai(e, t);
}, ci = (e, n, r) => {
	let { vnode: i, slots: a } = e, o = !0, s = t;
	if (i.shapeFlag & 32) {
		let e = n._;
		e ? r && e === 1 ? o = !1 : oi(a, n, r) : (o = !n.$stable, ii(n, a)), s = n;
	} else n && (ai(e, n), s = { default: 1 });
	if (o) for (let e in a) !ti(e) && s[e] == null && delete a[e];
}, U = bi;
function li(e) {
	return ui(e);
}
function ui(e, i) {
	let a = ue();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !ji(e, t) && (r = ye(e), he(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
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
			case W:
				ae(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? D(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, A);
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
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && T(e.children, d, null, r, i, di(e, a), s, u), _ && Tn(e, null, r, "created"), ne(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !ee(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Ui(f, r, e);
		}
		_ && Tn(e, null, r, "beforeMount");
		let v = pi(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && U(() => {
			try {
				f && Ui(f, r, e), v && g.enter(d), _ && Tn(e, null, r, "mounted");
			} finally {}
		}, i);
	}, ne = (e, t, n, r, i) => {
		if (n && g(e, n), r) for (let t = 0; t < r.length; t++) g(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || yi(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				ne(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, T = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? Bi(e[l]) : zi(e[l]), t, n, r, i, a, o, s);
	}, re = (e, n, r, i, a, o, s) => {
		let l = n.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = n;
		u |= e.patchFlag & 16;
		let m = e.props || t, h = n.props || t, g;
		if (r && fi(r, !1), (g = h.onVnodeBeforeUpdate) && Ui(g, r, n, e), f && Tn(n, e, r, "beforeUpdate"), r && fi(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? E(e.dynamicChildren, d, l, r, i, di(n, a), o) : s || de(e, n, l, null, r, i, di(n, a), o, !1), u > 0) {
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
		((g = h.onVnodeUpdated) || f) && U(() => {
			g && Ui(g, r, n, e), f && Tn(n, e, r, "updated");
		}, i);
	}, E = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === W || !ji(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
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
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), T(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (E(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && mi(e, t, !0)) : de(e, t, n, f, i, a, s, c, l);
	}, D = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : O(t, n, r, i, a, o, c) : se(e, t, c);
	}, O = (e, t, n, r, i, a, o) => {
		let s = e.component = Ki(e, r, i);
		if (Gn(e) && (s.ctx.renderer = A), ea(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, ce, o), !e.el) {
				let r = s.subTree = Y(Si);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else ce(s, e, t, n, i, a, o);
	}, se = (e, t, n) => {
		let r = t.component = e.component;
		if (Vr(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			le(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, ce = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = gi(e);
					if (n) {
						t && (t.el = c.el, le(e, t, o)), n.asyncDep.then(() => {
							U(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				fi(e, !1), t ? (t.el = c.el, le(e, t, o)) : t = c, n && oe(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Ui(d, s, t, c), fi(e, !0);
				let f = Rr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ye(p), e, i, a), t.el = f.el, u === null && Wr(e, f.el), r && U(r, i), (d = t.props && t.props.onVnodeUpdated) && U(() => Ui(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Wn(t);
				if (fi(e, !1), l && oe(l), !m && (o = c && c.onVnodeBeforeMount) && Ui(o, d, t), fi(e, !0), s && Ce) {
					let t = () => {
						e.subTree = Rr(e), Ce(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Rr(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && U(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					U(() => Ui(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Wn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && U(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new De(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => mn(u), fi(e, !0), l();
	}, le = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Yr(e, t.props, r, n), ci(e, t.children, n), He(), _n(e), Ue();
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
			let n = t[p] = l ? Bi(t[p]) : zi(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? ve(e, a, o, !0, !1, f) : T(t, r, i, a, o, s, c, l, f);
	}, pe = (e, t, r, i, a, o, s, c, l) => {
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
		} else if (u > p) for (; u <= f;) he(e[u], a, o, !0), u++;
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
					he(n, a, o, !0);
					continue;
				}
				let i;
				if (n.key != null) i = g.get(n.key);
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && ji(n, t[_])) {
					i = _;
					break;
				}
				i === void 0 ? he(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++);
			}
			let w = x ? hi(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || vi(f) : i;
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
		if (c === W) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) me(u[e], t, n, r);
			o(e.anchor, t, n);
			return;
		}
		if (c === Ci) {
			S(e, t, n);
			return;
		}
		if (r !== 2 && d & 1 && l) if (r === 0) l.beforeEnter(a), o(a, t, n), U(() => l.enter(a), i);
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
	}, he = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (He(), Hn(s, null, n, e, !0), Ue()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Wn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Ui(_, t, e), u & 6) _e(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && Tn(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, A, r) : l && !l.hasOnce && (a !== W || d > 0 && d & 64) ? ve(l, t, n, !1, !0) : (a === W && d & 384 || !i && u & 16) && ve(c, t, n), r && k(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && U(() => {
			_ && Ui(_, t, e), h && Tn(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, k = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === W) {
			ge(n, r);
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
	}, ge = (e, t) => {
		let n;
		for (; e !== t;) n = h(e), s(e), e = n;
		s(t);
	}, _e = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		_i(c), _i(l), r && oe(r), i.stop(), a && (a.flags |= 8, he(o, e, t, n)), s && U(s, t), U(() => {
			e.isUnmounted = !0;
		}, t);
	}, ve = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) he(e[o], t, n, r, i);
	}, ye = (e) => {
		if (e.shapeFlag & 6) return ye(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[Pn];
		return n ? h(n) : t;
	}, be = !1, xe = (e, t, n) => {
		let r;
		e == null ? t._vnode && (he(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, be ||= (be = !0, _n(r), vn(), !1);
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
		createApp: jr(xe, Se)
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
	t && t.pendingBranch ? d(e) ? t.effects.push(...e) : t.effects.push(e) : gn(e);
}
var W = /* @__PURE__ */ Symbol.for("v-fgt"), xi = /* @__PURE__ */ Symbol.for("v-txt"), Si = /* @__PURE__ */ Symbol.for("v-cmt"), Ci = /* @__PURE__ */ Symbol.for("v-stc"), wi = [], G = null;
function K(e = !1) {
	wi.push(G = e ? null : []);
}
function Ti() {
	wi.pop(), G = wi[wi.length - 1] || null;
}
var Ei = 1;
function Di(e, t = !1) {
	Ei += e, e < 0 && G && t && (G.hasOnce = !0);
}
function Oi(e) {
	return e.dynamicChildren = Ei > 0 ? G || n : null, Ti(), Ei > 0 && G && G.push(e), e;
}
function q(e, t, n, r, i, a) {
	return Oi(J(e, t, n, r, i, a, !0));
}
function ki(e, t, n, r, i) {
	return Oi(Y(e, t, n, r, i, !0));
}
function Ai(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function ji(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Mi = ({ key: e }) => e ?? null, Ni = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ L(e) || h(e) ? {
	i: V,
	r: e,
	k: t,
	f: !!n
} : e);
function J(e, t = null, n = null, r = 0, i = null, a = e === W ? 0 : 1, o = !1, s = !1) {
	let c = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e,
		props: t,
		key: t && Mi(t),
		ref: t && Ni(t),
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
		ctx: V
	};
	return s ? (Vi(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Ei > 0 && !o && G && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && G.push(c), c;
}
var Y = Pi;
function Pi(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === cr) && (e = Si), Ai(e)) {
		let r = Ii(e, t, !0);
		return n && Vi(r, n), Ei > 0 && !a && G && (r.shapeFlag & 6 ? G[G.indexOf(e)] = r : G.push(r)), r.patchFlag = -2, r;
	}
	if (la(e) && (e = e.__vccOpts), t) {
		t = Fi(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = k(e)), v(n) && (/* @__PURE__ */ Bt(n) && !d(n) && (n = s({}, n)), t.style = de(n));
	}
	let o = g(e) ? 1 : yi(e) ? 128 : Fn(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return J(e, t, n, r, i, o, a, !0);
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
		patchFlag: t && e.type !== W ? o === -1 ? 16 : o | 16 : o,
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
function X(e = " ", t = 0) {
	return Y(xi, null, e, t);
}
function Li(e, t) {
	let n = Y(Ci, null, e);
	return n.staticCount = t, n;
}
function Ri(e = "", t = !1) {
	return t ? (K(), ki(Si, null, e)) : Y(Si, null, e);
}
function zi(e) {
	return e == null || typeof e == "boolean" ? Y(Si) : d(e) ? Y(W, null, e.slice()) : Ai(e) ? Bi(e) : Y(xi, null, String(e));
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
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [X(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Hi(...e) {
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
function Ui(e, t, n, r = null) {
	nn(e, t, 7, [n, r]);
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
var Z = null, qi = () => Z || V, Ji, Yi;
{
	let e = ue(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Ji = t("__VUE_INSTANCE_SETTERS__", (e) => Z = e), Yi = t("__VUE_SSR_SETTERS__", (e) => $i = e);
}
var Xi = (e) => {
	let t = Z;
	return Ji(e), e.scope.on(), () => {
		e.scope.off(), Ji(t);
	};
}, Zi = () => {
	Z && Z.scope.off(), Ji(null);
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
		let n = e.setupContext = r.length > 1 ? sa(e) : null, i = Xi(e), a = tn(r, e, 0, [e.props, n]), o = y(a);
		if (Ue(), i(), (o || e.sp) && !Wn(e) && zn(e), o) {
			if (a.then(Zi, Zi), t) return a.then((n) => {
				na(e, n, t);
			}).catch((t) => {
				rn(t, e, 0);
			});
			e.asyncDep = a;
		} else na(e, a, t);
	} else aa(e, t);
}
function na(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = Kt(t)), aa(e, n);
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
	return N(e, "get", ""), e[t];
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
	return e.exposed ? e.exposeProxy ||= new Proxy(Kt(Vt(e.exposed)), {
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
var Q = (e, t) => /* @__PURE__ */ Jt(e, t, $i), ua = "3.5.34", da = void 0, fa = typeof window < "u" && window.trustedTypes;
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
		Ea.test(n) ? e.setProperty(E(r), n.replace(Ea, ""), "important") : e[r] = n;
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
	let r = T(t);
	if (r !== "filter" && r in e) return ka[t] = r;
	r = ie(r);
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
function Na(e, t, n, r, i, a = _e(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Ma, t.slice(6, t.length)) : e.setAttributeNS(Ma, t, n) : n == null || a && !ve(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
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
		r === "boolean" ? n = ve(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
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
	return [e[2] === ":" ? e.slice(3) : E(e.slice(2)), t];
}
var Va = 0, Ha = /* @__PURE__ */ Promise.resolve(), Ua = () => Va ||= (Ha.then(() => Va = 0), Date.now());
function Wa(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		nn(Ga(e, n.value), t, 5, [e]);
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
	t === "class" ? ba(e, r, c) : t === "style" ? Ta(e, n, r) : a(t) ? o(t) || Ra(e, t, n, r, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ja(e, t, r, c)) ? (Pa(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Na(e, t, r, c, s, t !== "value")) : e._isVueCE && (Ya(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r))) ? Pa(e, T(t), r, s, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Na(e, t, r, c));
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
	let r = T(t);
	return Array.isArray(n) ? n.some((e) => T(e) === r) : Object.keys(n).some((e) => T(e) === r);
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
	constructor(e, t = {}, n = go) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== go ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		if (t) for (let e in t) u(this, e) || Object.defineProperty(this, e, { get: () => z(t[e]) });
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : Xa, r = T(e);
		t && this._numberProps && this._numberProps[r] && (n = ce(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === Xa ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(E(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(E(e), t + "") : t || this.removeAttribute(E(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), ho(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Y(this._def, s(e, this._props));
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
}, eo = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return d(t) ? (e) => oe(t, e) : t;
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
	return t && (e = e.trim()), n && (e = se(e)), e;
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
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? se(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, oo = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], so = {
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
	exact: (e, t) => oo.some((n) => e[`${n}Key`] && !t.includes(n))
}, co = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = so[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, lo = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, uo = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = E(n.key);
		if (t.some((e) => e === r || lo[e] === r)) return e(n);
	}));
}, fo = /* @__PURE__ */ s({ patchProp: qa }, va), po;
function mo() {
	return po ||= li(fo);
}
var ho = ((...e) => {
	mo().render(...e);
}), go = ((...e) => {
	let t = mo().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = vo(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, _o(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function _o(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function vo(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/runtime.ts
async function yo(e, t, n, r, i = {}) {
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
			let r = xo(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: bo(n?.code) ?? r,
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
function bo(e) {
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
function xo(e) {
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
var So = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, Co;
function wo() {
	return Co ||= To(So), Co;
}
function To(e) {
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
var Eo = Symbol.for("comtrya.relationship-registry");
Do();
function Do() {
	let e = globalThis;
	return e[Eo] ??= {
		types: /* @__PURE__ */ new Map(),
		providers: /* @__PURE__ */ new Map(),
		subscribers: /* @__PURE__ */ new Set()
	}, e[Eo];
}
//#endregion
//#region packages/sdk-core/src/route-registry.ts
function Oo(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`;
	return `/x/${e}${n === "/" ? "" : n.replace(/\/+$/, "")}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function ko(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return Ao(t, e, n.signal), () => n.abort();
}
async function Ao(e, t, n) {
	try {
		let r = await jo(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: Mo(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await No(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function jo(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: Mo(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function Mo(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function No(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		Po(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) Fo(e, t);
	}
	a += i.decode(), Po(a, t);
}
function Po(e, t) {
	for (let n of e.split("\n\n")) Fo(n, t);
}
function Fo(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = Io(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function Io(e, t) {
	let n = Lo(e) ? e : {}, r = Lo(n.data) ? n.data : {}, i = Ro(r.eventType) ?? Ro(n.type) ?? t ?? "";
	return {
		id: Ro(r.id) ?? Ro(n.id) ?? "",
		eventType: i,
		payloadB64: Ro(r.payloadB64) ?? "",
		timestampMs: zo(r.timestampMs) ?? Bo(zo(n.time)) ?? Date.now(),
		sourceUri: Ro(r.sourceUri) ?? Ro(n.source) ?? "",
		emitterExtension: Ro(r.emitterExtension) ?? Ro(r.extensionId) ?? Ro(n.source) ?? "",
		raw: e
	};
}
function Lo(e) {
	return typeof e == "object" && !!e;
}
function Ro(e) {
	return typeof e == "string" ? e : void 0;
}
function zo(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function Bo(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var Vo = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], Ho = typeof navigator == "object" ? navigator.platform : "", Uo = /Mac|iPod|iPhone|iPad/.test(Ho), Wo = Uo ? "Meta" : "Control", Go = Ho === "Win32" ? ["Control", "Alt"] : Uo ? ["Alt"] : [];
function Ko(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || Go.includes(t) && e.getModifierState("AltGraph"));
}
function qo(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? Wo : e;
		}), n];
	});
}
function Jo(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !Ko(e, t);
	}) || Vo.find(function(t) {
		return !n.includes(t) && r !== t && Ko(e, t);
	}));
}
function Yo(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [qo(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			Jo(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : Ko(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function Xo(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = Yo(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var Zo = /* @__PURE__ */ new Map(), Qo = /* @__PURE__ */ new Set();
function $o(e) {
	Zo.set(e.id, e);
	for (let e of Qo) e();
	return () => {
		Zo.delete(e.id);
		for (let e of Qo) e();
	};
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function es(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function ts(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function ns(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (ts(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			es(e.target) || r(e);
		};
	}
	return t;
}
function rs(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = ns(e), i = () => {
		n ||= Xo(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? An(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), rr(a);
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function is(e) {
	as(e.tagName, e.component);
	let t = /* @__PURE__ */ Za(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(ss(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function as(e, t) {
	if (typeof document > "u") return;
	let n = os(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function os(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function ss(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
var cs = "ext_pull_requests", ls = "pulls";
function us(e, t) {
	return t ? `comtrya://workspace/${e}/repository/${t}` : `comtrya://workspace/${e}`;
}
function ds(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function fs(e) {
	switch ((typeof e == "string" ? e : e && typeof e == "object" && typeof e.tag == "string" ? e.tag : "").toLowerCase()) {
		case "draft": return "DRAFT";
		case "merged": return "MERGED";
		case "closed": return "CLOSED";
		default: return "READY";
	}
}
function ps(e) {
	return {
		id: e.id,
		repository: e.repository,
		workspace: e.workspace ?? null,
		number: e.number,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: fs(e.state),
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
async function ms(e) {
	return ds(await yo(cs, ls, "list-pulls", {
		repository: us(e.workspaceId, e.repositoryId),
		limit: e.limit ?? 256
	}), "list-pulls").map(ps);
}
async function hs(e) {
	let t = ds(await yo(cs, ls, "get-pull", e), "get-pull");
	return t ? ps(t) : null;
}
async function gs(e, t) {
	return ps(ds(await yo(cs, ls, "merge-pull", {
		id: e,
		mergedByRef: t ?? null
	}), "merge-pull"));
}
async function _s(e, t) {
	return ps(ds(await yo(cs, ls, "close-pull", {
		id: e,
		closedByRef: t ?? null
	}), "close-pull"));
}
function vs(e) {
	switch ((typeof e == "string" ? e : e && typeof e == "object" && typeof e.tag == "string" ? e.tag : "").toLowerCase()) {
		case "closed": return "CLOSED";
		case "reopened": return "REOPENED";
		default: return "OPEN";
	}
}
async function ys(e) {
	if (!e) return [];
	let t = `comtrya://pull_request/${e}`, n = (await wo().query("query LinkedIssues($from: ResourceURN!, $kind: ResourceURN) {\n      relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n    }", {
		from: t,
		kind: "comtrya://rel/com.comtrya.pulls/closes"
	})).relations?.outgoing ?? [], r = Array.from(new Set(n.map((e) => e.to ?? e.target ?? "").filter((e) => e.startsWith("comtrya://issue/"))));
	return (await Promise.all(r.map(bs))).filter((e) => e !== null);
}
async function bs(e) {
	let t = await yo("ext_issues", "issues", "by-ref-issue", e);
	if (!t.ok) return null;
	let n = t.value;
	return !n || typeof n != "object" ? null : {
		id: typeof n.id == "string" ? n.id : "",
		number: typeof n.number == "number" ? n.number : null,
		title: typeof n.title == "string" ? n.title : "(untitled)",
		state: vs(n.state),
		uri: e
	};
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/types.ts
var xs = "pulls";
function Ss() {
	return Oo(xs, "/");
}
function Cs(e) {
	return Oo(xs, `/${e.id}`);
}
function ws(e) {
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
function Ts(e) {
	if (!e) return "";
	let t = Date.parse(e);
	if (Number.isNaN(t)) return e;
	let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
	return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
}
function Es(e) {
	return e ? (e.split("/").pop() ?? e) || e : "unknown";
}
function $(e) {
	if (!e) return {
		kind: "unknown",
		label: "unknown",
		glyph: "·",
		tone: "neutral"
	};
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || Es(e);
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: r.slice(0, 1).toUpperCase(),
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
		default: return {
			kind: "unknown",
			label: r,
			glyph: r.slice(0, 1).toUpperCase() || "·",
			tone: "neutral"
		};
	}
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/pr-commands.ts
var Ds = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", Os = /* @__PURE__ */ new Map();
function ks(e) {
	return [
		e.id,
		e.number,
		e.title,
		e.state
	].join("|");
}
function As(e) {
	let t = [];
	return t.push($o({
		id: `ext_pull_requests.open.${e.id}`,
		title: `Open PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: () => {
			window.location.href = Cs(e);
		}
	})), (e.state === "READY" || e.state === "DRAFT") && t.push($o({
		id: `ext_pull_requests.merge.${e.id}`,
		title: `Merge PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: async () => {
			await gs(e.id);
		}
	})), e.state !== "CLOSED" && e.state !== "MERGED" && t.push($o({
		id: `ext_pull_requests.close.${e.id}`,
		title: `Close PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: async () => {
			await _s(e.id);
		}
	})), () => t.forEach((e) => e());
}
async function js(e) {
	let t;
	try {
		t = await ms({ workspaceId: e });
	} catch (e) {
		console.warn("[ext_pull_requests] palette sync failed:", e);
		return;
	}
	let n = /* @__PURE__ */ new Set();
	for (let e of t) {
		n.add(e.id);
		let t = ks(e), r = Os.get(e.id);
		r && r.signature === t || (r?.unregister(), Os.set(e.id, {
			signature: t,
			unregister: As(e)
		}));
	}
	for (let [e, t] of Os) n.has(e) || (t.unregister(), Os.delete(e));
}
function Ms() {
	let e = Ds;
	js(e);
	let t = [
		"dev.comtrya.pull-request.created",
		"dev.comtrya.pull-request.merged",
		"dev.comtrya.pull-request.closed"
	].map((t) => ko({
		type: t,
		onEvent: () => {
			js(e);
		},
		onError: () => {}
	}));
	return () => {
		for (let e of t) e();
		for (let e of Os.values()) e.unregister();
		Os.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/diff.ts
var Ns = /^diff --git a\/(.+?) b\/(.+)$/, Ps = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;
function Fs(e) {
	if (!e) return [];
	let t = [], n = e.split("\n"), r = null, i = null, a = 0, o = 0, s = () => {
		r && i && r.hunks.push(i), i = null;
	}, c = () => {
		s(), r && t.push(r), r = null;
	};
	for (let e of n) {
		let t = e.match(Ns);
		if (t) {
			c();
			let [, e, n] = t;
			r = {
				oldPath: e ?? "",
				newPath: n ?? "",
				displayPath: n || e || "",
				status: "modified",
				language: Ls(n || e || ""),
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
		let n = e.match(Ps);
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
var Is = {
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
function Ls(e) {
	let t = e.lastIndexOf(".");
	return t < 0 ? "plain" : Is[e.slice(t + 1).toLowerCase()] ?? "plain";
}
function Rs(e) {
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
var zs = "comtrya-diff-view-styles", Bs = "\n.diff-view {\n  display: grid;\n  gap: 14px;\n  font-family: var(--sans, system-ui);\n}\n\n.diff-summary {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  flex-wrap: wrap;\n  gap: 12px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 8px;\n}\n\n.diff-summary h2 {\n  margin: 0;\n  font-family: var(--display, system-ui);\n  font-size: 18px;\n}\n\n.diff-totals {\n  display: inline-flex;\n  flex-wrap: wrap;\n  gap: 10px 14px;\n  align-items: baseline;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--ink-faint, #68645c);\n}\n\n.diff-totals .adds { color: var(--accent-teal, #087f6f); }\n.diff-totals .dels { color: var(--accent-err, #c9341c); }\n.diff-totals .hint { color: var(--ink-fainter, #918b80); }\n\n.diff-totals .hint kbd {\n  border: 1px solid currentColor;\n  padding: 0 4px;\n  font-family: var(--mono, monospace);\n  font-size: 10px;\n}\n\n.diff-view .muted {\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--ink-faint, #68645c);\n}\n\n.diff-view .muted.error { color: var(--accent-err, #c9341c); }\n\n.diff-files {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n  gap: 14px;\n}\n\n.diff-file {\n  border: 1.5px solid var(--ink, #111);\n  background: var(--paper, #fffdf8);\n}\n\n.diff-file.focused {\n  box-shadow: -3px 0 0 0 var(--accent-orange, #e34a20);\n}\n\n.diff-file-head {\n  display: grid;\n  grid-template-columns: 14px auto minmax(0, 1fr) auto auto;\n  gap: 10px;\n  align-items: center;\n  padding: 8px 10px;\n  border-bottom: 1px solid var(--rule-light, #d8d1c4);\n  cursor: pointer;\n  background: var(--paper-tint, #f2efe7);\n}\n\n.diff-file-head:hover,\n.diff-file-head:focus-visible {\n  background: color-mix(in srgb, var(--paper-tint, #f2efe7) 80%, var(--ink, #111));\n  outline: none;\n}\n\n.diff-file-head .caret {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #68645c);\n}\n\n.file-status {\n  font-family: var(--mono, monospace);\n  font-size: 10px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  padding: 1px 6px;\n  border: 1px solid currentColor;\n}\n\n.status-added { color: var(--accent-teal, #087f6f); }\n.status-deleted { color: var(--accent-err, #c9341c); }\n.status-modified { color: var(--accent-blue, #1d55a6); }\n.status-renamed { color: var(--accent-yellow, #c89300); }\n\n.file-path {\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.file-rename {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #68645c);\n}\n\n.file-counts {\n  display: inline-flex;\n  gap: 8px;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n}\n\n.file-counts .adds { color: var(--accent-teal, #087f6f); }\n.file-counts .dels { color: var(--accent-err, #c9341c); }\n\n.diff-file-body { display: grid; gap: 0; }\n\n.diff-hunk { border-top: 1px solid var(--rule-light, #d8d1c4); }\n.diff-hunk:first-child { border-top: 0; }\n\n.diff-hunk-head {\n  background: var(--paper-tint, #f2efe7);\n  padding: 4px 10px;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #68645c);\n}\n\n.diff-hunk table {\n  width: 100%;\n  border-collapse: collapse;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  line-height: 1.45;\n}\n\n.diff-line.line-add {\n  background: color-mix(in srgb, var(--accent-teal, #087f6f) 10%, var(--paper, #fffdf8));\n}\n\n.diff-line.line-del {\n  background: color-mix(in srgb, var(--accent-err, #c9341c) 10%, var(--paper, #fffdf8));\n}\n\n.diff-line.line-meta { color: var(--ink-fainter, #918b80); }\n\n.diff-line td {\n  padding: 0;\n  vertical-align: top;\n  white-space: pre-wrap;\n  word-break: break-word;\n}\n\n.diff-line .ln {\n  width: 48px;\n  padding: 0 8px;\n  color: var(--ink-fainter, #918b80);\n  text-align: right;\n  user-select: none;\n  background: color-mix(in srgb, var(--paper-tint, #f2efe7) 60%, var(--paper, #fffdf8));\n  border-right: 1px solid var(--rule-light, #d8d1c4);\n  font-variant-numeric: tabular-nums;\n}\n\n.diff-line.line-add .ln.new,\n.diff-line.line-del .ln.old {\n  color: var(--ink-soft, #2c2b28);\n}\n\n.diff-line .marker {\n  width: 18px;\n  padding: 0 4px;\n  text-align: center;\n  color: var(--ink-faint, #68645c);\n  user-select: none;\n}\n\n.diff-line.line-add .marker { color: var(--accent-teal, #087f6f); }\n.diff-line.line-del .marker { color: var(--accent-err, #c9341c); }\n.diff-line .content { padding: 0 8px; }\n";
function Vs() {
	if (typeof document > "u" || document.getElementById(zs)) return;
	let e = document.createElement("style");
	e.id = zs, e.textContent = Bs, document.head.appendChild(e);
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/DiffView.vue?vue&type=script&setup=true&lang.ts
var Hs = {
	class: "diff-view",
	"data-smoke": "pulls-diff-view"
}, Us = { class: "diff-summary" }, Ws = { class: "diff-totals" }, Gs = { class: "adds" }, Ks = { class: "dels" }, qs = {
	key: 0,
	class: "muted"
}, Js = {
	key: 1,
	class: "muted error"
}, Ys = {
	key: 2,
	class: "muted"
}, Xs = {
	key: 3,
	class: "diff-files"
}, Zs = ["data-diff-file-index"], Qs = [
	"aria-expanded",
	"onClick",
	"onKeydown",
	"onFocus"
], $s = { class: "caret" }, ec = { class: "file-path" }, tc = {
	key: 0,
	class: "file-rename"
}, nc = { class: "file-counts" }, rc = { class: "adds" }, ic = { class: "dels" }, ac = {
	key: 0,
	class: "diff-file-body"
}, oc = {
	key: 0,
	class: "muted"
}, sc = { class: "diff-hunk-head" }, cc = { class: "ln old" }, lc = { class: "ln new" }, uc = { class: "marker" }, dc = { class: "content" }, fc = /* @__PURE__ */ Rn({
	__name: "DiffView",
	props: {
		patch: { type: String },
		loading: { type: Boolean },
		error: { type: [String, null] }
	},
	setup(e) {
		Vs();
		let t = e, n = /* @__PURE__ */ R({}), r = /* @__PURE__ */ R(0), i = Q(() => Fs(t.patch)), a = Q(() => Rs(i.value));
		An(i, (e) => {
			r.value >= e.length && (r.value = Math.max(0, e.length - 1));
		}), rs({
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
		return (t, n) => (K(), q("section", Hs, [J("header", Us, [n[1] ||= J("h2", null, "Files changed", -1), J("div", Ws, [
			J("span", null, [X(A(a.value.files) + " file", 1), a.value.files === 1 ? Ri("", !0) : (K(), q(W, { key: 0 }, [X("s")], 64))]),
			J("span", Gs, "+" + A(a.value.additions), 1),
			J("span", Ks, "-" + A(a.value.deletions), 1),
			n[0] ||= J("span", { class: "hint" }, [
				J("kbd", null, "n"),
				X("/"),
				J("kbd", null, "p"),
				X(" next/prev file · "),
				J("kbd", null, "space"),
				X(" collapse ")
			], -1)
		])]), e.loading ? (K(), q("p", qs, "Loading diff…")) : e.error ? (K(), q("p", Js, A(e.error), 1)) : i.value.length === 0 ? (K(), q("p", Ys, " No diff to show. Push commits to head and base refs to populate this view. ")) : (K(), q("ol", Xs, [(K(!0), q(W, null, lr(i.value, (e, t) => (K(), q("li", {
			key: e.displayPath + t,
			class: k(["diff-file", { focused: t === r.value }]),
			"data-diff-file-index": t
		}, [J("header", {
			class: "diff-file-head",
			tabindex: "0",
			role: "button",
			"aria-expanded": !s(e.displayPath),
			onClick: (t) => o(e.displayPath),
			onKeydown: uo(co((t) => o(e.displayPath), ["prevent"]), ["enter"]),
			onFocus: (e) => r.value = t
		}, [
			J("span", $s, A(s(e.displayPath) ? "▸" : "▾"), 1),
			J("span", { class: k(["file-status", `status-${e.status}`]) }, A(c(e)), 3),
			J("code", ec, A(e.displayPath), 1),
			e.status === "renamed" && e.oldPath !== e.newPath ? (K(), q("span", tc, [n[2] ||= X(" from ", -1), J("code", null, A(e.oldPath), 1)])) : Ri("", !0),
			J("span", nc, [J("span", rc, "+" + A(e.additions), 1), J("span", ic, "-" + A(e.deletions), 1)])
		], 40, Qs), s(e.displayPath) ? Ri("", !0) : (K(), q("div", ac, [e.binary ? (K(), q("p", oc, "Binary file — no preview.")) : (K(!0), q(W, { key: 1 }, lr(e.hunks, (e, t) => (K(), q("section", {
			key: t,
			class: "diff-hunk"
		}, [J("header", sc, [J("code", null, A(e.header.replace(/^@@ /, "").replace(/ @@$/, "")), 1)]), J("table", null, [J("tbody", null, [(K(!0), q(W, null, lr(e.lines, (e, t) => (K(), q("tr", {
			key: t,
			class: k(["diff-line", `line-${e.kind}`])
		}, [
			J("td", cc, A(e.oldNumber ?? ""), 1),
			J("td", lc, A(e.newNumber ?? ""), 1),
			J("td", uc, [e.kind === "add" ? (K(), q(W, { key: 0 }, [X("+")], 64)) : e.kind === "del" ? (K(), q(W, { key: 1 }, [X("-")], 64)) : e.kind === "meta" ? (K(), q(W, { key: 2 }, [X("\\")], 64)) : (K(), q(W, { key: 3 }, [], 64))]),
			J("td", dc, A(e.text), 1)
		], 2))), 128))])])]))), 128))]))], 10, Zs))), 128))]))]));
	}
}), pc = {
	class: "pulls-detail",
	"data-smoke": "pulls-detail"
}, mc = {
	key: 0,
	class: "pulls-empty"
}, hc = {
	key: 1,
	class: "pulls-error",
	role: "alert"
}, gc = {
	key: 2,
	class: "pulls-empty"
}, _c = ["href"], vc = { class: "pulls-detail-head" }, yc = { class: "pulls-detail-title" }, bc = ["href"], xc = { class: "pulls-detail-number" }, Sc = { class: "pulls-detail-meta" }, Cc = { class: "pulls-branch" }, wc = ["data-author-kind"], Tc = { class: "author-glyph" }, Ec = {
	key: 0,
	class: "author-badge"
}, Dc = {
	key: 1,
	class: "author-badge"
}, Oc = {
	key: 2,
	class: "author-badge"
}, kc = { key: 0 }, Ac = { key: 1 }, jc = { key: 2 }, Mc = { class: "pulls-detail-actions" }, Nc = ["disabled"], Pc = ["disabled"], Fc = {
	key: 0,
	class: "pulls-action-message"
}, Ic = {
	key: 0,
	class: "pulls-detail-body"
}, Lc = {
	key: 1,
	class: "pulls-detail-body muted"
}, Rc = {
	key: 2,
	class: "pulls-linked-issues",
	"data-smoke": "pulls-linked-issues"
}, zc = { class: "muted" }, Bc = { key: 0 }, Vc = ["href"], Hc = { class: "issue-num" }, Uc = { class: "issue-title" }, Wc = /* @__PURE__ */ Rn({
	__name: "PullsDetail",
	props: { routeParams: { type: null } },
	setup(e) {
		let t = e, n = Q(() => t.routeParams?.params?.pullId ?? ""), r = /* @__PURE__ */ R(null), i = /* @__PURE__ */ R("idle"), a = /* @__PURE__ */ R(null), o = /* @__PURE__ */ R("idle"), s = /* @__PURE__ */ R(null), c = /* @__PURE__ */ R(""), l = /* @__PURE__ */ R(""), u = /* @__PURE__ */ R("idle"), d = /* @__PURE__ */ R(null), f = /* @__PURE__ */ R([]), p = /* @__PURE__ */ R("idle"), m = Q(() => ws(r.value?.state)), h = Q(() => r.value && (r.value.state === "READY" || r.value.state === "DRAFT")), g = Q(() => r.value && r.value.state !== "CLOSED" && r.value.state !== "MERGED");
		$n(() => {
			_(), x(), v();
		}), An(n, () => void v()), rs({
			m: (e) => {
				h.value && (e.preventDefault(), S());
			},
			x: (e) => {
				g.value && (e.preventDefault(), C());
			},
			Escape: (e) => {
				document.querySelector(".shortcuts-backdrop, .palette-backdrop") || (e.preventDefault(), window.location.href = Ss());
			}
		}), An(n, () => void _());
		async function _() {
			if (!n.value) {
				i.value = "error", a.value = "Missing pull id";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				r.value = await hs(n.value), i.value = r.value ? "ready" : "empty";
			} catch (e) {
				i.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function v() {
			if (n.value) {
				p.value = "loading";
				try {
					f.value = await ys(n.value), p.value = "ready";
				} catch {
					f.value = [], p.value = "error";
				}
			}
		}
		function y(e) {
			return e.id ? `/x/issues/${e.id}` : "/x/issues/";
		}
		function b(e) {
			switch (e) {
				case "CLOSED": return "issue-state-closed";
				default: return "issue-state-open";
			}
		}
		async function x() {
			u.value = "loading", d.value = null;
			try {
				let e = (await wo().query("query PullDiff {\n        repository { diff { path language patch } }\n      }")).repository?.diff;
				c.value = e?.patch ?? "", l.value = e?.path ?? "", u.value = "ready";
			} catch (e) {
				u.value = "error", d.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function S() {
			if (!(!r.value || !h.value)) {
				o.value = "merging", s.value = null;
				try {
					r.value = await gs(r.value.id), s.value = `Merged pull #${r.value.number}`;
				} catch (e) {
					s.value = e instanceof Error ? e.message : String(e);
				} finally {
					o.value = "idle";
				}
			}
		}
		async function C() {
			if (!(!r.value || !g.value)) {
				o.value = "closing", s.value = null;
				try {
					r.value = await _s(r.value.id), s.value = `Closed pull #${r.value.number}`;
				} catch (e) {
					s.value = e instanceof Error ? e.message : String(e);
				} finally {
					o.value = "idle";
				}
			}
		}
		return (e, t) => (K(), q("article", pc, [i.value === "loading" ? (K(), q("p", mc, "Loading pull request…")) : i.value === "error" ? (K(), q("p", hc, A(a.value), 1)) : i.value === "empty" || !r.value ? (K(), q("p", gc, [
			t[0] ||= X(" No pull request found for ", -1),
			J("code", null, A(n.value), 1),
			t[1] ||= X(". ", -1),
			J("a", { href: z(Ss)() }, "← back to queue", 8, _c)
		])) : (K(), q(W, { key: 3 }, [
			J("header", vc, [J("div", yc, [
				J("a", {
					href: z(Ss)(),
					class: "back",
					"aria-label": "Back to pull request queue"
				}, "←", 8, bc),
				J("span", xc, "#" + A(r.value.number), 1),
				J("h1", null, A(r.value.title), 1)
			]), J("div", Sc, [
				J("span", { class: k(["pulls-state", m.value.className]) }, A(m.value.label), 3),
				J("code", Cc, [
					X(A(r.value.headRef) + " ", 1),
					t[2] ||= J("span", null, "→", -1),
					X(" " + A(r.value.baseRef), 1)
				]),
				J("span", {
					class: "pulls-author",
					"data-author-kind": z($)(r.value.authorRef).kind
				}, [
					J("span", Tc, A(z($)(r.value.authorRef).glyph), 1),
					X(" by " + A(z($)(r.value.authorRef).label) + " ", 1),
					z($)(r.value.authorRef).kind === "agent" ? (K(), q("span", Ec, "agent")) : z($)(r.value.authorRef).kind === "credential" ? (K(), q("span", Dc, "bot")) : z($)(r.value.authorRef).kind === "bot" ? (K(), q("span", Oc, "bot")) : Ri("", !0)
				], 8, wc),
				r.value.createdAt ? (K(), q("span", kc, "opened " + A(z(Ts)(r.value.createdAt)), 1)) : Ri("", !0),
				r.value.mergedAt ? (K(), q("span", Ac, "merged " + A(z(Ts)(r.value.mergedAt)), 1)) : r.value.closedAt ? (K(), q("span", jc, "closed " + A(z(Ts)(r.value.closedAt)), 1)) : Ri("", !0)
			])]),
			J("section", Mc, [
				J("button", {
					type: "button",
					class: "pulls-action primary",
					disabled: !h.value || o.value !== "idle",
					onClick: S
				}, [X(A(o.value === "merging" ? "Merging…" : "Merge") + " ", 1), t[3] ||= J("kbd", null, "m", -1)], 8, Nc),
				J("button", {
					type: "button",
					class: "pulls-action",
					disabled: !g.value || o.value !== "idle",
					onClick: C
				}, [X(A(o.value === "closing" ? "Closing…" : "Close") + " ", 1), t[4] ||= J("kbd", null, "x", -1)], 8, Pc),
				s.value ? (K(), q("span", Fc, A(s.value), 1)) : Ri("", !0)
			]),
			r.value.bodyMarkdown ? (K(), q("section", Ic, [t[5] ||= J("h2", null, "Description", -1), J("pre", null, A(r.value.bodyMarkdown), 1)])) : (K(), q("section", Lc, [...t[6] ||= [J("h2", null, "Description", -1), J("p", null, "No description provided.", -1)]])),
			p.value !== "idle" || f.value.length > 0 ? (K(), q("section", Rc, [J("header", null, [t[7] ||= J("h2", null, "Closes", -1), J("span", zc, [p.value === "loading" ? (K(), q(W, { key: 0 }, [X("resolving…")], 64)) : f.value.length === 0 ? (K(), q(W, { key: 1 }, [X(" no linked issues ")], 64)) : (K(), q(W, { key: 2 }, [
				X(A(f.value.length) + " issue", 1),
				f.value.length === 1 ? Ri("", !0) : (K(), q(W, { key: 0 }, [X("s")], 64)),
				r.value.state === "MERGED" ? (K(), q(W, { key: 1 }, [X(" — auto-closed on merge")], 64)) : (K(), q(W, { key: 2 }, [X(" — will close on merge")], 64))
			], 64))])]), f.value.length > 0 ? (K(), q("ul", Bc, [(K(!0), q(W, null, lr(f.value, (e) => (K(), q("li", { key: e.uri }, [J("a", { href: y(e) }, [
				J("span", Hc, [e.number === null ? (K(), q(W, { key: 1 }, [X("issue")], 64)) : (K(), q(W, { key: 0 }, [X("#" + A(e.number), 1)], 64))]),
				J("span", Uc, A(e.title), 1),
				J("span", { class: k(["issue-state", b(e.state)]) }, A(e.state.toLowerCase()), 3)
			], 8, Vc)]))), 128))])) : Ri("", !0)])) : Ri("", !0),
			Y(fc, {
				patch: c.value,
				loading: u.value === "loading",
				error: d.value
			}, null, 8, [
				"patch",
				"loading",
				"error"
			])
		], 64))]));
	}
}), Gc = ".pulls-detail[data-v-d6960fd6]{font-family:var(--sans,system-ui);gap:22px;display:grid}.pulls-detail-head[data-v-d6960fd6]{border-bottom:1.5px solid var(--ink,#111);gap:12px;padding-bottom:16px;display:grid}.pulls-detail-title[data-v-d6960fd6]{flex-wrap:wrap;align-items:baseline;gap:12px;display:flex}.pulls-detail-title h1[data-v-d6960fd6]{font-family:var(--display,system-ui);flex:320px;margin:0;font-size:28px;line-height:1.1}.back[data-v-d6960fd6]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:16px;text-decoration:none}.back[data-v-d6960fd6]:hover{color:var(--ink,#111)}.pulls-detail-number[data-v-d6960fd6]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:14px}.pulls-detail-meta[data-v-d6960fd6]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);flex-wrap:wrap;align-items:baseline;gap:10px 16px;font-size:12px;display:flex}.pulls-state[data-v-d6960fd6]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 6px;font-size:11px}.pulls-state.pr-state-ready[data-v-d6960fd6]{color:var(--accent-teal,#087f6f)}.pulls-state.pr-state-draft[data-v-d6960fd6]{color:var(--ink-faint,#68645c)}.pulls-state.pr-state-merged[data-v-d6960fd6]{color:var(--accent-blue,#1d55a6)}.pulls-state.pr-state-closed[data-v-d6960fd6]{color:var(--accent-err,#c9341c)}.pulls-branch[data-v-d6960fd6]{color:var(--ink-soft,#2c2b28)}.pulls-branch span[data-v-d6960fd6]{color:var(--ink-fainter,#918b80);padding:0 4px}.pulls-detail-actions[data-v-d6960fd6]{flex-wrap:wrap;align-items:center;gap:10px;display:flex}.pulls-action[data-v-d6960fd6]{border:1.5px solid var(--ink,#111);background:var(--paper,#fffdf8);color:var(--ink,#111);font-family:var(--display,system-ui);cursor:pointer;align-items:center;gap:8px;padding:8px 14px;font-weight:600;display:inline-flex}.pulls-action.primary[data-v-d6960fd6]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.pulls-action[disabled][data-v-d6960fd6]{opacity:.5;cursor:not-allowed}.pulls-action kbd[data-v-d6960fd6]{font-family:var(--mono,monospace);opacity:.6;border:1px solid;padding:0 4px;font-size:10px}.pulls-action-message[data-v-d6960fd6]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.pulls-detail-body h2[data-v-d6960fd6]{font-family:var(--display,system-ui);margin:0 0 8px;font-size:16px}.pulls-detail-body pre[data-v-d6960fd6]{font-family:var(--mono,monospace);white-space:pre-wrap;word-break:break-word;color:var(--ink-soft,#2c2b28);margin:0;font-size:12px}.pulls-detail-body.muted p[data-v-d6960fd6]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.pulls-detail-meta .pulls-author[data-v-d6960fd6]{align-items:center;gap:6px;display:inline-flex}.pulls-detail-meta .author-glyph[data-v-d6960fd6]{width:14px;height:14px;color:var(--ink-faint,#68645c);border:1px solid;place-items:center;font-size:10px;font-weight:700;display:inline-grid}.pulls-detail-meta .pulls-author[data-author-kind=agent] .author-glyph[data-v-d6960fd6],.pulls-detail-meta .pulls-author[data-author-kind=agent] .author-badge[data-v-d6960fd6],.pulls-detail-meta .pulls-author[data-author-kind=agent][data-v-d6960fd6]{color:#6b3fa0}.pulls-detail-meta .pulls-author[data-author-kind=credential] .author-glyph[data-v-d6960fd6],.pulls-detail-meta .pulls-author[data-author-kind=credential] .author-badge[data-v-d6960fd6],.pulls-detail-meta .pulls-author[data-author-kind=credential][data-v-d6960fd6]{color:var(--accent-yellow,#c89300)}.pulls-detail-meta .pulls-author[data-author-kind=bot] .author-glyph[data-v-d6960fd6],.pulls-detail-meta .pulls-author[data-author-kind=bot] .author-badge[data-v-d6960fd6],.pulls-detail-meta .pulls-author[data-author-kind=bot][data-v-d6960fd6]{color:var(--accent-blue,#1d55a6)}.pulls-detail-meta .author-badge[data-v-d6960fd6]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.pulls-linked-issues[data-v-d6960fd6]{gap:8px;display:grid}.pulls-linked-issues header[data-v-d6960fd6]{border-bottom:1.5px solid var(--ink,#111);justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:4px;display:flex}.pulls-linked-issues h2[data-v-d6960fd6]{font-family:var(--display,system-ui);margin:0;font-size:18px}.pulls-linked-issues .muted[data-v-d6960fd6]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.pulls-linked-issues ul[data-v-d6960fd6]{margin:0;padding:0;list-style:none;display:grid}.pulls-linked-issues li a[data-v-d6960fd6]{color:inherit;border-bottom:1px solid var(--rule-light,#d8d1c4);grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline;gap:12px;padding:8px 0;text-decoration:none;display:grid}.pulls-linked-issues li:last-child a[data-v-d6960fd6]{border-bottom:0}.pulls-linked-issues .issue-num[data-v-d6960fd6]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums;font-size:12px}.pulls-linked-issues .issue-title[data-v-d6960fd6]{font-family:var(--display,system-ui);text-overflow:ellipsis;white-space:nowrap;font-weight:500;overflow:hidden}.pulls-linked-issues .issue-state[data-v-d6960fd6]{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 5px;font-size:10px}.pulls-linked-issues .issue-state-open[data-v-d6960fd6]{color:var(--accent-teal,#087f6f)}.pulls-linked-issues .issue-state-closed[data-v-d6960fd6]{color:var(--accent-blue,#1d55a6)}.pulls-empty[data-v-d6960fd6],.pulls-error[data-v-d6960fd6]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:13px}.pulls-error[data-v-d6960fd6]{color:var(--accent-err,#c9341c)}", Kc = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, qc = /* @__PURE__ */ Kc(Wc, [["styles", [Gc]], ["__scopeId", "data-v-d6960fd6"]]), Jc = {
	class: "pulls-overview",
	"data-smoke": "pulls-overview"
}, Yc = ["href"], Xc = {
	key: 0,
	class: "muted"
}, Zc = {
	key: 1,
	class: "muted"
}, Qc = {
	key: 2,
	class: "muted"
}, $c = { key: 3 }, el = ["href"], tl = { class: "num" }, nl = { class: "title" }, rl = { class: "age" }, il = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", al = /* @__PURE__ */ Kc(/* @__PURE__ */ Rn({
	__name: "PullsOverview",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R([]), r = /* @__PURE__ */ R("idle"), i = Q(() => t.workspaceId ?? t.host?.workspaceId ?? il), a = Q(() => t.repositoryId ?? t.host?.repositoryId ?? null), o = Q(() => n.value.filter((e) => e.state === "READY" || e.state === "DRAFT").sort((e, t) => {
			let n = Date.parse(e.updatedAt ?? e.createdAt ?? "") || 0;
			return (Date.parse(t.updatedAt ?? t.createdAt ?? "") || 0) - n;
		}).slice(0, 5)), s = Q(() => n.value.filter((e) => e.state === "READY").length);
		$n(() => void c()), An(() => [i.value, a.value], () => void c());
		async function c() {
			r.value = "loading";
			try {
				n.value = await ms({
					workspaceId: i.value,
					repositoryId: a.value,
					limit: 32
				}), r.value = n.value.length > 0 ? "ready" : "empty";
			} catch {
				r.value = "error", n.value = [];
			}
		}
		return (e, t) => (K(), q("section", Jc, [J("header", null, [t[0] ||= J("h3", null, "Pull requests", -1), J("a", { href: z(Ss)() }, A(s.value) + " open", 9, Yc)]), r.value === "loading" ? (K(), q("p", Xc, "Loading…")) : r.value === "error" ? (K(), q("p", Zc, "Could not load pulls.")) : o.value.length === 0 ? (K(), q("p", Qc, "No open pull requests.")) : (K(), q("ul", $c, [(K(!0), q(W, null, lr(o.value, (e) => (K(), q("li", { key: e.id }, [J("a", { href: z(Cs)(e) }, [
			J("span", tl, "#" + A(e.number), 1),
			J("span", nl, A(e.title), 1),
			J("span", { class: k(["state", z(ws)(e.state).className]) }, A(z(ws)(e.state).label), 3),
			J("span", rl, A(z(Ts)(e.updatedAt ?? e.createdAt)), 1)
		], 8, el)]))), 128))]))]));
	}
}), [["styles", [".pulls-overview[data-v-c112b1d8]{gap:8px;display:grid}.pulls-overview header[data-v-c112b1d8]{justify-content:space-between;align-items:baseline;display:flex}.pulls-overview h3[data-v-c112b1d8]{font-family:var(--display,system-ui);margin:0;font-size:14px}.pulls-overview header a[data-v-c112b1d8],.muted[data-v-c112b1d8]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px;text-decoration:none}.pulls-overview ul[data-v-c112b1d8]{gap:4px;margin:0;padding:0;list-style:none;display:grid}.pulls-overview li a[data-v-c112b1d8]{color:inherit;border-bottom:1px solid var(--rule-light,#d8d1c4);grid-template-columns:auto minmax(0,1fr) auto auto;align-items:baseline;gap:8px;padding:6px 0;text-decoration:none;display:grid}.pulls-overview li:last-child a[data-v-c112b1d8]{border-bottom:0}.num[data-v-c112b1d8]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.title[data-v-c112b1d8]{text-overflow:ellipsis;white-space:nowrap;font-weight:500;overflow:hidden}.state[data-v-c112b1d8]{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.state.pr-state-ready[data-v-c112b1d8]{color:var(--accent-teal,#087f6f)}.state.pr-state-draft[data-v-c112b1d8]{color:var(--ink-faint,#68645c)}.state.pr-state-merged[data-v-c112b1d8]{color:var(--accent-blue,#1d55a6)}.state.pr-state-closed[data-v-c112b1d8]{color:var(--accent-err,#c9341c)}.age[data-v-c112b1d8]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}"]], ["__scopeId", "data-v-c112b1d8"]]), ol = {
	class: "pulls-queue",
	"data-smoke": "pulls-queue"
}, sl = { class: "pulls-queue-head" }, cl = { class: "pulls-queue-controls" }, ll = {
	class: "pulls-filter-row",
	role: "tablist",
	"aria-label": "Filter pulls by state"
}, ul = ["aria-selected", "onClick"], dl = { class: "count" }, fl = { class: "pulls-search" }, pl = {
	key: 0,
	class: "pulls-empty"
}, ml = {
	key: 1,
	class: "pulls-error",
	role: "alert"
}, hl = {
	key: 2,
	class: "pulls-empty"
}, gl = {
	key: 3,
	class: "pulls-empty"
}, _l = {
	key: 4,
	class: "pulls-list",
	role: "listbox",
	"aria-label": "Pull request queue"
}, vl = ["aria-selected", "onMouseenter"], yl = ["href"], bl = { class: "pulls-row-number" }, xl = { class: "pulls-row-body" }, Sl = { class: "pulls-row-title" }, Cl = { class: "pulls-row-meta" }, wl = { class: "pulls-branch" }, Tl = ["data-author-kind"], El = { class: "author-glyph" }, Dl = { class: "author-label" }, Ol = {
	key: 0,
	class: "author-badge"
}, kl = {
	key: 1,
	class: "author-badge"
}, Al = {
	key: 2,
	class: "author-badge"
}, jl = { class: "pulls-row-age" }, Ml = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", Nl = /* @__PURE__ */ Kc(/* @__PURE__ */ Rn({
	__name: "PullsQueue",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] }
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
		], r = /* @__PURE__ */ R("OPEN"), i = /* @__PURE__ */ R(""), a = /* @__PURE__ */ R([]), o = /* @__PURE__ */ R("idle"), s = /* @__PURE__ */ R(null), c = /* @__PURE__ */ R(0), l = Q(() => t.workspaceId ?? t.host?.workspaceId ?? Ml), u = Q(() => t.repositoryId ?? t.host?.repositoryId ?? null), d = (e, t) => t === "ALL" ? !0 : t === "OPEN" ? e.state === "READY" : e.state === t, f = Q(() => {
			let e = i.value.trim().toLowerCase();
			return a.value.filter((e) => d(e, r.value)).filter((t) => {
				if (!e) return !0;
				let n = $(t.authorRef);
				return `${t.number} ${t.title} ${t.headRef} ${t.baseRef} ${n.label} ${n.kind}`.toLowerCase().includes(e);
			});
		}), p = Q(() => {
			let e = {
				OPEN: 0,
				DRAFT: 0,
				MERGED: 0,
				CLOSED: 0,
				ALL: a.value.length
			};
			for (let t of a.value) t.state === "READY" && (e.OPEN += 1), t.state === "DRAFT" && (e.DRAFT += 1), t.state === "MERGED" && (e.MERGED += 1), t.state === "CLOSED" && (e.CLOSED += 1);
			return e;
		});
		$n(() => {
			h();
		}), An(() => [l.value, u.value], () => void h()), An(f, () => {
			c.value >= f.value.length && (c.value = Math.max(0, f.value.length - 1));
		}), rs({
			j: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, f.value.length - 1));
			},
			ArrowDown: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, f.value.length - 1));
			},
			k: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			ArrowUp: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			Enter: (e) => {
				let t = f.value[c.value];
				t && (e.preventDefault(), window.location.href = Cs(t));
			},
			"/": (e) => {
				e.preventDefault(), document.querySelector("[data-pulls-search]")?.focus();
			},
			...Object.fromEntries(n.map((e) => [e.key, (t) => {
				t.preventDefault(), r.value = e.id;
			}]))
		});
		function m(e) {
			i.value &&= (e.preventDefault(), "");
		}
		async function h() {
			o.value = "loading", s.value = null;
			try {
				a.value = (await ms({
					workspaceId: l.value,
					repositoryId: u.value
				})).sort((e, t) => {
					let n = Date.parse(e.updatedAt ?? e.createdAt ?? "") || 0;
					return (Date.parse(t.updatedAt ?? t.createdAt ?? "") || 0) - n;
				}), o.value = a.value.length > 0 ? "ready" : "empty";
			} catch (e) {
				a.value = [], o.value = "error", s.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (e, t) => (K(), q("section", ol, [
			J("header", sl, [t[2] ||= J("h2", null, "Pull requests", -1), J("div", cl, [J("div", ll, [(K(), q(W, null, lr(n, (e) => J("button", {
				key: e.id,
				type: "button",
				role: "tab",
				"aria-selected": r.value === e.id,
				class: k(["pulls-filter", { active: r.value === e.id }]),
				onClick: (t) => r.value = e.id
			}, [
				J("span", null, A(e.label), 1),
				J("span", dl, A(p.value[e.id]), 1),
				J("kbd", null, A(e.key), 1)
			], 10, ul)), 64))]), J("label", fl, [wn(J("input", {
				"data-pulls-search": "",
				"onUpdate:modelValue": t[0] ||= (e) => i.value = e,
				type: "search",
				placeholder: "Filter by title, branch, author",
				autocomplete: "off",
				onKeydown: uo(m, ["esc"])
			}, null, 544), [[ao, i.value]]), t[1] ||= J("kbd", null, "/", -1)])])]),
			o.value === "loading" ? (K(), q("p", pl, "Loading pull requests…")) : o.value === "error" ? (K(), q("p", ml, A(s.value), 1)) : a.value.length === 0 ? (K(), q("p", hl, [...t[3] ||= [
				X(" No pull requests yet. Push a branch and open one through the ", -1),
				J("code", null, "create-pull", -1),
				X(" op or the SDK. ", -1)
			]])) : f.value.length === 0 ? (K(), q("p", gl, " No pull requests match the current filter. ")) : (K(), q("ol", _l, [(K(!0), q(W, null, lr(f.value, (e, n) => (K(), q("li", {
				key: e.id,
				class: k(["pulls-row", { focused: n === c.value }]),
				role: "option",
				"aria-selected": n === c.value,
				onMouseenter: (e) => c.value = n
			}, [J("a", {
				href: z(Cs)(e),
				class: "pulls-row-link"
			}, [
				J("span", bl, "#" + A(e.number), 1),
				J("span", xl, [J("span", Sl, A(e.title), 1), J("span", Cl, [
					J("span", { class: k(["pulls-state", z(ws)(e.state).className]) }, A(z(ws)(e.state).label), 3),
					J("code", wl, [
						X(A(e.headRef) + " ", 1),
						t[4] ||= J("span", null, "→", -1),
						X(" " + A(e.baseRef), 1)
					]),
					J("span", {
						class: "pulls-author",
						"data-author-kind": z($)(e.authorRef).kind
					}, [
						J("span", El, A(z($)(e.authorRef).glyph), 1),
						J("span", Dl, A(z($)(e.authorRef).label), 1),
						z($)(e.authorRef).kind === "agent" ? (K(), q("span", Ol, "agent")) : z($)(e.authorRef).kind === "credential" ? (K(), q("span", kl, "bot")) : z($)(e.authorRef).kind === "bot" ? (K(), q("span", Al, "bot")) : Ri("", !0)
					], 8, Tl)
				])]),
				J("span", jl, A(z(Ts)(e.updatedAt ?? e.createdAt)), 1)
			], 8, yl)], 42, vl))), 128))])),
			t[5] ||= Li("<footer class=\"pulls-queue-foot\" data-v-19df486e><span data-v-19df486e><kbd data-v-19df486e>j</kbd> <kbd data-v-19df486e>k</kbd> navigate · <kbd data-v-19df486e>↵</kbd> open · <kbd data-v-19df486e>/</kbd> search · <kbd data-v-19df486e>o</kbd> open <kbd data-v-19df486e>d</kbd> draft <kbd data-v-19df486e>m</kbd> merged <kbd data-v-19df486e>c</kbd> closed <kbd data-v-19df486e>a</kbd> all </span></footer>", 1)
		]));
	}
}), [["styles", [".pulls-queue[data-v-19df486e]{font-family:var(--sans,system-ui);color:var(--ink,#111);gap:16px;display:grid}.pulls-queue-head[data-v-19df486e]{gap:12px;display:grid}.pulls-queue-head h2[data-v-19df486e]{font-family:var(--display,system-ui);margin:0;font-size:22px;line-height:1}.pulls-queue-controls[data-v-19df486e]{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;display:flex}.pulls-filter-row[data-v-19df486e]{border:1.5px solid var(--ink,#111);flex-wrap:wrap;gap:4px;display:inline-flex}.pulls-filter[data-v-19df486e]{color:inherit;cursor:pointer;font-family:var(--mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;display:inline-flex}.pulls-filter[data-v-19df486e]:not(:last-child){border-right:1px solid var(--rule-light,#d8d1c4)}.pulls-filter.active[data-v-19df486e]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.pulls-filter .count[data-v-19df486e]{color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums}.pulls-filter.active .count[data-v-19df486e]{color:var(--paper-tint,#f2efe7)}.pulls-filter kbd[data-v-19df486e]{font-family:var(--mono,monospace);opacity:.6;border:1px solid;padding:0 4px;font-size:10px}.pulls-search[data-v-19df486e]{border:1.5px solid var(--ink,#111);flex:240px;align-items:center;gap:8px;min-width:240px;max-width:420px;padding:4px 10px;display:inline-flex}.pulls-search input[data-v-19df486e]{color:inherit;font:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0}.pulls-search kbd[data-v-19df486e]{border:1px solid var(--ink,#111);font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);padding:0 4px;font-size:10px}.pulls-list[data-v-19df486e]{border-top:1.5px solid var(--ink,#111);margin:0;padding:0;list-style:none;display:grid}.pulls-row[data-v-19df486e]{border-bottom:1px solid var(--rule-light,#d8d1c4)}.pulls-row.focused[data-v-19df486e]{background:var(--paper-tint,#f2efe7)}.pulls-row-link[data-v-19df486e]{color:inherit;grid-template-columns:56px 1fr auto;align-items:baseline;gap:14px;padding:12px 12px 12px 6px;text-decoration:none;display:grid}.pulls-row-link[data-v-19df486e]:hover{background:var(--paper-tint,#f2efe7);text-decoration:none}.pulls-row-number[data-v-19df486e]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);text-align:right;font-variant-numeric:tabular-nums;font-size:12px}.pulls-row-body[data-v-19df486e]{gap:4px;min-width:0;display:grid}.pulls-row-title[data-v-19df486e]{font-family:var(--display,system-ui);text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;overflow:hidden}.pulls-row-meta[data-v-19df486e]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);flex-wrap:wrap;align-items:baseline;gap:10px;font-size:12px;display:flex}.pulls-state[data-v-19df486e]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 6px;font-size:11px}.pulls-state.pr-state-ready[data-v-19df486e]{color:var(--accent-teal,#087f6f)}.pulls-state.pr-state-draft[data-v-19df486e]{color:var(--ink-faint,#68645c)}.pulls-state.pr-state-merged[data-v-19df486e]{color:var(--accent-blue,#1d55a6)}.pulls-state.pr-state-closed[data-v-19df486e]{color:var(--accent-err,#c9341c)}.pulls-branch[data-v-19df486e]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);font-size:12px}.pulls-branch span[data-v-19df486e]{color:var(--ink-fainter,#918b80);padding:0 4px}.pulls-author[data-v-19df486e]{font-family:var(--mono,monospace);align-items:center;gap:5px;font-size:12px;display:inline-flex}.pulls-author .author-glyph[data-v-19df486e]{width:14px;height:14px;color:var(--ink-faint,#68645c);border:1px solid;place-items:center;font-size:10px;font-weight:700;display:inline-grid}.pulls-author[data-author-kind=agent] .author-glyph[data-v-19df486e],.pulls-author[data-author-kind=agent] .author-label[data-v-19df486e],.pulls-author[data-author-kind=agent] .author-badge[data-v-19df486e]{color:#6b3fa0}.pulls-author[data-author-kind=credential] .author-glyph[data-v-19df486e],.pulls-author[data-author-kind=credential] .author-label[data-v-19df486e],.pulls-author[data-author-kind=credential] .author-badge[data-v-19df486e]{color:var(--accent-yellow,#c89300)}.pulls-author[data-author-kind=bot] .author-glyph[data-v-19df486e],.pulls-author[data-author-kind=bot] .author-label[data-v-19df486e],.pulls-author[data-author-kind=bot] .author-badge[data-v-19df486e]{color:var(--accent-blue,#1d55a6)}.pulls-author .author-badge[data-v-19df486e]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.pulls-row-age[data-v-19df486e]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);white-space:nowrap;font-size:12px}.pulls-empty[data-v-19df486e],.pulls-error[data-v-19df486e]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border-top:1.5px solid var(--rule-light,#d8d1c4);padding:18px 0;font-size:13px}.pulls-error[data-v-19df486e]{color:var(--accent-err,#c9341c)}.pulls-queue-foot[data-v-19df486e]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.pulls-queue-foot kbd[data-v-19df486e]{font-family:var(--mono,monospace);border:1px solid;padding:0 4px;font-size:10px}"]], ["__scopeId", "data-v-19df486e"]]), Pl = {
	class: "pulls-your-work",
	"data-smoke": "pulls-your-work"
}, Fl = ["href"], Il = {
	key: 0,
	class: "muted"
}, Ll = {
	key: 1,
	class: "muted"
}, Rl = {
	key: 2,
	class: "muted"
}, zl = { key: 3 }, Bl = ["href"], Vl = { class: "num" }, Hl = { class: "title" }, Ul = { class: "meta" }, Wl = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", Gl = /* @__PURE__ */ Kc(/* @__PURE__ */ Rn({
	__name: "PullsYourWork",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		viewerRef: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R([]), r = /* @__PURE__ */ R("idle"), i = Q(() => t.workspaceId ?? t.host?.workspaceId ?? Wl), a = Q(() => t.viewerRef ?? t.host?.viewerRef ?? null), o = Q(() => a.value ? n.value.filter((e) => e.authorRef === a.value).filter((e) => e.state === "READY" || e.state === "DRAFT").slice(0, 5) : n.value.filter((e) => e.state === "READY" || e.state === "DRAFT").slice(0, 5));
		$n(() => void s()), An(() => [i.value], () => void s());
		async function s() {
			r.value = "loading";
			try {
				n.value = await ms({
					workspaceId: i.value,
					limit: 64
				}), r.value = n.value.length > 0 ? "ready" : "empty";
			} catch {
				r.value = "error", n.value = [];
			}
		}
		return (e, t) => (K(), q("section", Pl, [J("header", null, [t[0] ||= J("h3", null, "Your pull requests", -1), J("a", { href: z(Ss)() }, "queue", 8, Fl)]), r.value === "loading" ? (K(), q("p", Il, "Loading…")) : r.value === "error" ? (K(), q("p", Ll, "Could not load pulls.")) : o.value.length === 0 ? (K(), q("p", Rl, " Nothing here yet. Open a pull request to see it in this rail. ")) : (K(), q("ul", zl, [(K(!0), q(W, null, lr(o.value, (e) => (K(), q("li", { key: e.id }, [J("a", { href: z(Cs)(e) }, [
			J("span", Vl, "#" + A(e.number), 1),
			J("span", Hl, A(e.title), 1),
			J("span", { class: k(["state", z(ws)(e.state).className]) }, A(z(ws)(e.state).label), 3),
			J("span", Ul, A(z(Es)(e.authorRef)) + " · " + A(z(Ts)(e.updatedAt ?? e.createdAt)), 1)
		], 8, Bl)]))), 128))]))]));
	}
}), [["styles", [".pulls-your-work[data-v-cf9251fe]{gap:8px;display:grid}.pulls-your-work header[data-v-cf9251fe]{justify-content:space-between;align-items:baseline;display:flex}.pulls-your-work h3[data-v-cf9251fe]{font-family:var(--display,system-ui);margin:0;font-size:14px}.pulls-your-work header a[data-v-cf9251fe],.muted[data-v-cf9251fe]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px;text-decoration:none}.pulls-your-work ul[data-v-cf9251fe]{margin:0;padding:0;list-style:none;display:grid}.pulls-your-work li a[data-v-cf9251fe]{color:inherit;border-bottom:1px solid var(--rule-light,#d8d1c4);grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline;gap:8px;padding:8px 0;text-decoration:none;display:grid}.pulls-your-work li:last-child a[data-v-cf9251fe]{border-bottom:0}.num[data-v-cf9251fe]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.title[data-v-cf9251fe]{text-overflow:ellipsis;white-space:nowrap;grid-row:1;overflow:hidden}.state[data-v-cf9251fe]{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.state.pr-state-ready[data-v-cf9251fe]{color:var(--accent-teal,#087f6f)}.state.pr-state-draft[data-v-cf9251fe]{color:var(--ink-faint,#68645c)}.state.pr-state-merged[data-v-cf9251fe]{color:var(--accent-blue,#1d55a6)}.state.pr-state-closed[data-v-cf9251fe]{color:var(--accent-err,#c9341c)}.meta[data-v-cf9251fe]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);grid-column:1/-1;font-size:11px}"]], ["__scopeId", "data-v-cf9251fe"]]), Kl = "ext_pull_requests", ql = "comtrya-pulls-queue", Jl = "comtrya-pulls-detail", Yl = "comtrya-pulls-your-work", Xl = "comtrya-pulls-overview";
is({
	tagName: ql,
	component: Nl
}), is({
	tagName: Jl,
	component: qc
}), is({
	tagName: Yl,
	component: Gl
}), is({
	tagName: Xl,
	component: al
});
var Zl = {
	id: Kl,
	setup(e) {
		e.registerWidget({
			id: "pulls-your-work",
			element: Yl,
			defaultSlot: "home.your-work",
			defaultPriority: 100,
			requiredPermission: "pull-requests.read"
		}), e.registerWidget({
			id: "pulls-overview",
			element: Xl,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "pull-requests.read"
		}), e.registerRoute("/", {
			element: ql,
			requiredPermission: "pull-requests.read"
		}), e.registerRoute("/:pullId", {
			element: Jl,
			requiredPermission: "pull-requests.read"
		}), Ms();
	}
};
//#endregion
export { Zl as default };
