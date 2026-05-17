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
}, te = /-\w/g, E = ee((e) => e.replace(te, (e) => e.slice(1).toUpperCase())), ne = /\B([A-Z])/g, D = ee((e) => e.replace(ne, "-$1").toLowerCase()), O = ee((e) => e.charAt(0).toUpperCase() + e.slice(1)), re = ee((e) => e ? `on${O(e)}` : ""), k = (e, t) => !Object.is(e, t), ie = (e, ...t) => {
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
function j(e) {
	let t = "";
	if (g(e)) t = e;
	else if (d(e)) for (let n = 0; n < e.length; n++) {
		let r = j(e[n]);
		r && (t += r + " ");
	}
	else if (v(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var me = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", he = /* @__PURE__ */ e(me);
me + "";
function ge(e) {
	return !!e || e === "";
}
function _e(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = ve(e[r], t[r]);
	return n;
}
function ve(e, t) {
	if (e === t) return !0;
	let n = m(e), r = m(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = _(e), r = _(t), n || r) return e === t;
	if (n = d(e), r = d(t), n || r) return n && r ? _e(e, t) : !1;
	if (n = v(e), r = v(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !ve(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
function ye(e, t) {
	return e.findIndex((e) => ve(e, t));
}
var be = (e) => !!(e && e.__v_isRef === !0), M = (e) => g(e) ? e : e == null ? "" : d(e) || v(e) && (e.toString === b || !h(e.toString)) ? be(e) ? M(e.value) : JSON.stringify(e, xe, 2) : String(e), xe = (e, t) => be(t) ? xe(e, t.value) : f(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[Se(t, r) + " =>"] = n, e), {}) } : p(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => Se(e)) } : _(t) ? Se(t) : v(t) && !d(t) && !C(t) ? String(t) : t, Se = (e, t = "") => _(e) ? `Symbol(${e.description ?? t})` : e, N, Ce = class {
	constructor(e = !1) {
		this.detached = e, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !e && N && (N.active ? (this.parent = N, this.index = (N.scopes ||= []).push(this) - 1) : (this._active = !1, this._warnOnRun = !1));
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
			let t = N;
			try {
				return N = this, e();
			} finally {
				N = t;
			}
		}
	}
	on() {
		++this._on === 1 && (this.prevScope = N, N = this);
	}
	off() {
		if (this._on > 0 && --this._on === 0) {
			if (N === this) N = this.prevScope;
			else {
				let e = N;
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
function we() {
	return N;
}
var P, Te = /* @__PURE__ */ new WeakSet(), Ee = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, N && (N.active ? N.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, Te.has(this) && (Te.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Ae(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, Ue(this), Ne(this);
		let e = P, t = ze;
		P = this, ze = !0;
		try {
			return this.fn();
		} finally {
			Pe(this), P = e, ze = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) Le(e);
			this.deps = this.depsTail = void 0, Ue(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? Te.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		Fe(this) && this.run();
	}
	get dirty() {
		return Fe(this);
	}
}, De = 0, Oe, ke;
function Ae(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = ke, ke = e;
		return;
	}
	e.next = Oe, Oe = e;
}
function je() {
	De++;
}
function Me() {
	if (--De > 0) return;
	if (ke) {
		let e = ke;
		for (ke = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; Oe;) {
		let t = Oe;
		for (Oe = void 0; t;) {
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
function Ne(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Pe(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), Le(r), Re(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function Fe(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (Ie(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function Ie(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === We) || (e.globalVersion = We, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Fe(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = P, r = ze;
	P = e, ze = !0;
	try {
		Ne(e);
		let n = e.fn(e._value);
		(t.version === 0 || k(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		P = n, ze = r, Pe(e), e.flags &= -3;
	}
}
function Le(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) Le(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function Re(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var ze = !0, Be = [];
function Ve() {
	Be.push(ze), ze = !1;
}
function He() {
	let e = Be.pop();
	ze = e === void 0 ? !0 : e;
}
function Ue(e) {
	let { cleanup: t } = e;
	if (e.cleanup = void 0, t) {
		let e = P;
		P = void 0;
		try {
			t();
		} finally {
			P = e;
		}
	}
}
var We = 0, Ge = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, Ke = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!P || !ze || P === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== P) t = this.activeLink = new Ge(P, this), P.deps ? (t.prevDep = P.depsTail, P.depsTail.nextDep = t, P.depsTail = t) : P.deps = P.depsTail = t, qe(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = P.depsTail, t.nextDep = void 0, P.depsTail.nextDep = t, P.depsTail = t, P.deps === t && (P.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, We++, this.notify(e);
	}
	notify(e) {
		je();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			Me();
		}
	}
};
function qe(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) qe(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var Je = /* @__PURE__ */ new WeakMap(), Ye = /* @__PURE__ */ Symbol(""), Xe = /* @__PURE__ */ Symbol(""), Ze = /* @__PURE__ */ Symbol("");
function F(e, t, n) {
	if (ze && P) {
		let t = Je.get(e);
		t || Je.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new Ke()), r.map = t, r.key = n), r.track();
	}
}
function Qe(e, t, n, r, i, a) {
	let o = Je.get(e);
	if (!o) {
		We++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (je(), t === "clear") o.forEach(s);
	else {
		let i = d(e), a = i && w(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === Ze || !_(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(Ze)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(Ye)), f(e) && s(o.get(Xe)));
				break;
			case "delete":
				i || (s(o.get(Ye)), f(e) && s(o.get(Xe)));
				break;
			case "set":
				f(e) && s(o.get(Ye));
				break;
		}
	}
	Me();
}
function $e(e) {
	let t = /* @__PURE__ */ I(e);
	return t === e ? t : (F(t, "iterate", Ze), /* @__PURE__ */ zt(e) ? t : t.map(Ht));
}
function et(e) {
	return F(e = /* @__PURE__ */ I(e), "iterate", Ze), e;
}
function tt(e, t) {
	return /* @__PURE__ */ Rt(e) ? Ut(/* @__PURE__ */ Lt(e) ? Ht(t) : t) : Ht(t);
}
var nt = {
	__proto__: null,
	[Symbol.iterator]() {
		return rt(this, Symbol.iterator, (e) => tt(this, e));
	},
	concat(...e) {
		return $e(this).concat(...e.map((e) => d(e) ? $e(e) : e));
	},
	entries() {
		return rt(this, "entries", (e) => (e[1] = tt(this, e[1]), e));
	},
	every(e, t) {
		return at(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return at(this, "filter", e, t, (e) => e.map((e) => tt(this, e)), arguments);
	},
	find(e, t) {
		return at(this, "find", e, t, (e) => tt(this, e), arguments);
	},
	findIndex(e, t) {
		return at(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return at(this, "findLast", e, t, (e) => tt(this, e), arguments);
	},
	findLastIndex(e, t) {
		return at(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return at(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return st(this, "includes", e);
	},
	indexOf(...e) {
		return st(this, "indexOf", e);
	},
	join(e) {
		return $e(this).join(e);
	},
	lastIndexOf(...e) {
		return st(this, "lastIndexOf", e);
	},
	map(e, t) {
		return at(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return ct(this, "pop");
	},
	push(...e) {
		return ct(this, "push", e);
	},
	reduce(e, ...t) {
		return ot(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return ot(this, "reduceRight", e, t);
	},
	shift() {
		return ct(this, "shift");
	},
	some(e, t) {
		return at(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return ct(this, "splice", e);
	},
	toReversed() {
		return $e(this).toReversed();
	},
	toSorted(e) {
		return $e(this).toSorted(e);
	},
	toSpliced(...e) {
		return $e(this).toSpliced(...e);
	},
	unshift(...e) {
		return ct(this, "unshift", e);
	},
	values() {
		return rt(this, "values", (e) => tt(this, e));
	}
};
function rt(e, t, n) {
	let r = et(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ zt(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var it = Array.prototype;
function at(e, t, n, r, i, a) {
	let o = et(e), s = o !== e && !/* @__PURE__ */ zt(e), c = o[t];
	if (c !== it[t]) {
		let t = c.apply(e, a);
		return s ? Ht(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, tt(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function ot(e, t, n, r) {
	let i = et(e), a = i !== e && !/* @__PURE__ */ zt(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = tt(e, t)), n.call(this, t, tt(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? tt(e, c) : c;
}
function st(e, t, n) {
	let r = /* @__PURE__ */ I(e);
	F(r, "iterate", Ze);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ Bt(n[0]) ? (n[0] = /* @__PURE__ */ I(n[0]), r[t](...n)) : i;
}
function ct(e, t, n = []) {
	Ve(), je();
	let r = (/* @__PURE__ */ I(e))[t].apply(e, n);
	return Me(), He(), r;
}
var lt = /* @__PURE__ */ e("__proto__,__v_isRef,__isVue"), ut = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(_));
function dt(e) {
	_(e) || (e = String(e));
	let t = /* @__PURE__ */ I(this);
	return F(t, "has", e), t.hasOwnProperty(e);
}
var ft = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? At : kt : i ? Ot : Dt).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = d(e);
		if (!r) {
			let e;
			if (a && (e = nt[t])) return e;
			if (t === "hasOwnProperty") return dt;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ L(e) ? e : n);
		if ((_(t) ? ut.has(t) : lt(t)) || (r || F(e, "get", t), i)) return o;
		if (/* @__PURE__ */ L(o)) {
			let e = a && w(t) ? o : o.value;
			return r && v(e) ? /* @__PURE__ */ Ft(e) : e;
		}
		return v(o) ? r ? /* @__PURE__ */ Ft(o) : /* @__PURE__ */ Nt(o) : o;
	}
}, pt = class extends ft {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = d(e) && w(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ Rt(i);
			if (!/* @__PURE__ */ zt(n) && !/* @__PURE__ */ Rt(n) && (i = /* @__PURE__ */ I(i), n = /* @__PURE__ */ I(n)), !a && /* @__PURE__ */ L(i) && !/* @__PURE__ */ L(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : u(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ L(e) ? e : r);
		return e === /* @__PURE__ */ I(r) && (o ? k(n, i) && Qe(e, "set", t, n, i) : Qe(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = u(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && Qe(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!_(t) || !ut.has(t)) && F(e, "has", t), n;
	}
	ownKeys(e) {
		return F(e, "iterate", d(e) ? "length" : Ye), Reflect.ownKeys(e);
	}
}, mt = class extends ft {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, ht = /* @__PURE__ */ new pt(), gt = /* @__PURE__ */ new mt(), _t = /* @__PURE__ */ new pt(!0), vt = (e) => e, yt = (e) => Reflect.getPrototypeOf(e);
function bt(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ I(i), o = f(a), c = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, u = i[e](...r), d = n ? vt : t ? Ut : Ht;
		return !t && F(a, "iterate", l ? Xe : Ye), s(Object.create(u), { next() {
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
function xt(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function St(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ I(r), a = /* @__PURE__ */ I(n);
			e || (k(n, a) && F(i, "get", n), F(i, "get", a));
			let { has: o } = yt(i), s = t ? vt : e ? Ut : Ht;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && F(/* @__PURE__ */ I(t), "iterate", Ye), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ I(n), i = /* @__PURE__ */ I(t);
			return e || (k(t, i) && F(r, "has", t), F(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ I(a), s = t ? vt : e ? Ut : Ht;
			return !e && F(o, "iterate", Ye), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return s(n, e ? {
		add: xt("add"),
		set: xt("set"),
		delete: xt("delete"),
		clear: xt("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ I(this), r = yt(n), i = /* @__PURE__ */ I(e), a = !t && !/* @__PURE__ */ zt(e) && !/* @__PURE__ */ Rt(e) ? i : e;
			return r.has.call(n, a) || k(e, a) && r.has.call(n, e) || k(i, a) && r.has.call(n, i) || (n.add(a), Qe(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ zt(n) && !/* @__PURE__ */ Rt(n) && (n = /* @__PURE__ */ I(n));
			let r = /* @__PURE__ */ I(this), { has: i, get: a } = yt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ I(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? k(n, s) && Qe(r, "set", e, n, s) : Qe(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ I(this), { has: n, get: r } = yt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ I(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && Qe(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ I(this), t = e.size !== 0, n = e.clear();
			return t && Qe(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = bt(r, e, t);
	}), n;
}
function Ct(e, t) {
	let n = St(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(u(n, r) && r in t ? n : t, r, i);
}
var wt = { get: /* @__PURE__ */ Ct(!1, !1) }, Tt = { get: /* @__PURE__ */ Ct(!1, !0) }, Et = { get: /* @__PURE__ */ Ct(!0, !1) }, Dt = /* @__PURE__ */ new WeakMap(), Ot = /* @__PURE__ */ new WeakMap(), kt = /* @__PURE__ */ new WeakMap(), At = /* @__PURE__ */ new WeakMap();
function jt(e) {
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
function Mt(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : jt(S(e));
}
/* @__NO_SIDE_EFFECTS__ */
function Nt(e) {
	return /* @__PURE__ */ Rt(e) ? e : It(e, !1, ht, wt, Dt);
}
/* @__NO_SIDE_EFFECTS__ */
function Pt(e) {
	return It(e, !1, _t, Tt, Ot);
}
/* @__NO_SIDE_EFFECTS__ */
function Ft(e) {
	return It(e, !0, gt, Et, kt);
}
function It(e, t, n, r, i) {
	if (!v(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = Mt(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function Lt(e) {
	return /* @__PURE__ */ Rt(e) ? /* @__PURE__ */ Lt(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function Rt(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function zt(e) {
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
	return !u(e, "__v_skip") && Object.isExtensible(e) && A(e, "__v_skip", !0), e;
}
var Ht = (e) => v(e) ? /* @__PURE__ */ Nt(e) : e, Ut = (e) => v(e) ? /* @__PURE__ */ Ft(e) : e;
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
		this.dep = new Ke(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ I(e), this._value = t ? e : Ht(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ zt(e) || /* @__PURE__ */ Rt(e);
		e = n ? e : /* @__PURE__ */ I(e), k(e, t) && (this._rawValue = e, this._value = n ? e : Ht(e), this.dep.trigger());
	}
};
function z(e) {
	return /* @__PURE__ */ L(e) ? e.value : e;
}
var Kt = {
	get: (e, t, n) => t === "__v_raw" ? e : z(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ L(i) && !/* @__PURE__ */ L(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function qt(e) {
	return /* @__PURE__ */ Lt(e) ? e : new Proxy(e, Kt);
}
var Jt = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new Ke(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = We - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && P !== this) return Ae(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return Ie(this), e && (e.version = this.dep.version), this._value;
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
	let { immediate: a, deep: o, once: s, scheduler: l, augmentJob: u, call: f } = i, p = (e) => o ? e : /* @__PURE__ */ zt(e) || o === !1 || o === 0 ? tn(e, 1) : tn(e), m, g, _, v, y = !1, b = !1;
	if (/* @__PURE__ */ L(e) ? (g = () => e.value, y = /* @__PURE__ */ zt(e)) : /* @__PURE__ */ Lt(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some((e) => /* @__PURE__ */ Lt(e) || /* @__PURE__ */ zt(e)), g = () => e.map((e) => {
		if (/* @__PURE__ */ L(e)) return e.value;
		if (/* @__PURE__ */ Lt(e)) return p(e);
		if (h(e)) return f ? f(e, 2) : e();
	})) : g = h(e) ? n ? f ? () => f(e, 2) : e : () => {
		if (_) {
			Ve();
			try {
				_();
			} finally {
				He();
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
	let x = we(), S = () => {
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
			if (o || y || (b ? e.some((e, t) => k(e, C[t])) : k(e, C))) {
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
	return u && u(w), m = new Ee(g), m.scheduler = l ? () => l(w, !1) : w, v = (e) => $t(e, !1, m), _ = m.onStop = () => {
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
	if (n.set(e, t), t--, /* @__PURE__ */ L(e)) tn(e.value, t, n);
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
			Ve(), nn(o, null, 10, [
				e,
				i,
				a
			]), He();
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
var Sn = null, Cn = null;
function wn(e) {
	let t = Sn;
	return Sn = e, Cn = e && e.type.__scopeId || null, t;
}
function Tn(e, t = Sn, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && Oi(-1);
		let i = wn(t), a;
		try {
			a = e(...n);
		} finally {
			wn(i), r._d && Oi(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function En(e, n) {
	if (Sn === null) return e;
	let r = la(Sn), i = e.dirs ||= [];
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
function Dn(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (Ve(), rn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), He());
	}
}
function On(e, t) {
	if (Z) {
		let n = Z.provides, r = Z.parent && Z.parent.provides;
		r === n && (n = Z.provides = Object.create(r)), n[e] = t;
	}
}
function kn(e, t, n = !1) {
	let r = Ji();
	if (r || Mr) {
		let i = Mr ? Mr._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t;
	}
}
var An = /* @__PURE__ */ Symbol.for("v-scx"), jn = () => kn(An);
function V(e, t, n) {
	return Mn(e, t, n);
}
function Mn(e, n, i = t) {
	let { immediate: a, deep: o, flush: c, once: l } = i, u = s({}, i), d = n && a || !n && c !== "post", f;
	if (ea) {
		if (c === "sync") {
			let e = jn();
			f = e.__watcherHandles ||= [];
		} else if (!d) {
			let e = () => {};
			return e.stop = r, e.resume = r, e.pause = r, e;
		}
	}
	let p = Z;
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
	return ea && (f ? f.push(h) : d && h()), h;
}
function Nn(e, t, n) {
	let r = this.proxy, i = g(e) ? e.includes(".") ? Pn(r, e) : () => r[e] : e.bind(r, r), a;
	h(t) ? a = t : (a = t.handler, n = t);
	let o = Zi(this), s = Mn(i, a.bind(r), n);
	return o(), s;
}
function Pn(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var Fn = /* @__PURE__ */ Symbol("_vte"), In = (e) => e.__isTeleport, Ln = /* @__PURE__ */ Symbol("_leaveCb");
function Rn(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, Rn(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function zn(e, t) {
	return h(e) ? s({ name: e.name }, t, { setup: e }) : e;
}
function Bn(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function Vn(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var Hn = /* @__PURE__ */ new WeakMap();
function Un(e, n, r, a, o = !1) {
	if (d(e)) {
		e.forEach((e, t) => Un(e, n && (d(n) ? n[t] : n), r, a, o));
		return;
	}
	if (Gn(a) && !o) {
		a.shapeFlag & 512 && a.type.__asyncResolved && a.component.subTree.component && Un(e, n, r, a.component.subTree);
		return;
	}
	let s = a.shapeFlag & 4 ? la(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ I(v), b = v === t ? i : (e) => Vn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Vn(_, t));
	if (m != null && m !== p) {
		if (Wn(n), g(m)) _[m] = null, b(m) && (v[m] = null);
		else if (/* @__PURE__ */ L(m)) {
			let e = n;
			x(m, e.k) && (m.value = null), e.k && (_[e.k] = null);
		}
	}
	if (h(p)) nn(p, f, 12, [l, _]);
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
					i(), Hn.delete(e);
				};
				t.id = -1, Hn.set(e, t), W(t, r);
			} else Wn(e), i();
		}
	}
}
function Wn(e) {
	let t = Hn.get(e);
	t && (t.flags |= 8, Hn.delete(e));
}
ce().requestIdleCallback, ce().cancelIdleCallback;
var Gn = (e) => !!e.type.__asyncLoader, Kn = (e) => e.type.__isKeepAlive;
function qn(e, t) {
	Yn(e, "a", t);
}
function Jn(e, t) {
	Yn(e, "da", t);
}
function Yn(e, t, n = Z) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (Zn(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) Kn(e.parent.vnode) && Xn(r, t, n, e), e = e.parent;
	}
}
function Xn(e, t, n, r) {
	let i = Zn(t, e, r, !0);
	ir(() => {
		c(r[t], i);
	}, n);
}
function Zn(e, t, n = Z, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			Ve();
			let i = Zi(n), a = rn(t, n, e, r);
			return i(), He(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Qn = (e) => (t, n = Z) => {
	(!ea || e === "sp") && Zn(e, (...e) => t(...e), n);
}, $n = Qn("bm"), er = Qn("m"), tr = Qn("bu"), nr = Qn("u"), rr = Qn("bum"), ir = Qn("um"), ar = Qn("sp"), or = Qn("rtg"), sr = Qn("rtc");
function cr(e, t = Z) {
	Zn("ec", e, t);
}
var lr = /* @__PURE__ */ Symbol.for("v-ndc");
function H(e, t, n, r) {
	let i, a = n && n[r], o = d(e);
	if (o || g(e)) {
		let n = o && /* @__PURE__ */ Lt(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ zt(e), s = /* @__PURE__ */ Rt(e), e = et(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Ut(Ht(e[n])) : Ht(e[n]) : e[n], n, void 0, a && a[n]);
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
var ur = (e) => e ? $i(e) ? la(e) : ur(e.parent) : null, dr = /* @__PURE__ */ s(/* @__PURE__ */ Object.create(null), {
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
	$watch: (e) => Nn.bind(e)
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
		if (d) return n === "$attrs" && F(e.attrs, "get", ""), d(e);
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
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: T, renderTracked: ee, renderTriggered: te, errorCaptured: E, serverPrefetch: ne, expose: D, inheritAttrs: O, components: re, directives: k, filters: ie } = t;
	if (u && _r(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Nt(t));
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
			On(t, e[t]);
		});
	}
	f && vr(f, e, "c");
	function A(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (A($n, p), A(er, m), A(tr, g), A(nr, _), A(qn, y), A(Jn, b), A(cr, E), A(sr, ee), A(or, te), A(rr, S), A(ir, w), A(ar, ne), d(D)) if (D.length) {
		let t = e.exposed ||= {};
		D.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	T && e.render === r && (e.render = T), O != null && (e.inheritAttrs = O), re && (e.components = re), k && (e.directives = k), ne && Bn(e);
}
function _r(e, t, n = r) {
	d(e) && (e = Tr(e));
	for (let n in e) {
		let r = e[n], i;
		i = v(r) ? "default" in r ? kn(r.from || n, r.default, !0) : kn(r.from || n) : kn(r), /* @__PURE__ */ L(i) ? Object.defineProperty(t, n, {
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
	let i = r.includes(".") ? Pn(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && V(i, n);
	} else if (h(e)) V(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => yr(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && V(i, r, e);
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
					let u = l._ceVNode || Fi(n, r);
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, la(u.component);
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
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(ae)));
	let c, l = i[c = re(n)] || i[c = re(E(n))];
	!l && o && (l = i[c = re(D(n))]), l && rn(l, e, 6, a);
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
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: s, attrs: c, emit: l, render: u, renderCache: d, props: f, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = wn(e), v, y;
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
			}) : e(f, null)), y = t.props ? c : zr(c);
		}
	} catch (t) {
		wi.length = 0, an(t, e, 1), v = Fi(Si);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = Br(y, a)), b = Ri(b, y, !1, !0));
	}
	return n.dirs && (b = Ri(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && Rn(b, n.transition), v = b, wn(_), v;
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
	return n === "style" && v(r) && v(i) ? !ve(r, i) : r !== i;
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
	n ? e.props = r ? i : /* @__PURE__ */ Pt(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
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
	l && Qe(e.attrs, "set", "");
}
function Xr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (T(t)) continue;
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
	return e[0] !== "$" && !T(e);
}
var ti = (e) => e === "_" || e === "_ctx" || e === "$stable", ni = (e) => d(e) ? e.map(Bi) : [Bi(e)], ri = (e, t, n) => {
	if (t._n) return t;
	let r = Tn((...e) => ni(t(...e)), n);
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
		e ? (oi(r, t, n), n && A(r, "_", e, !0)) : ii(t, r);
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
	let a = ce();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Mi(e, t) && (r = _e(e), pe(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
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
				re(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? k(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, be);
		}
		u != null && i ? Un(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && Un(e.ref, null, a, e, !0);
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
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && E(e.children, d, null, r, i, di(e, a), s, u), _ && Dn(e, null, r, "created"), te(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !T(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Wi(f, r, e);
		}
		_ && Dn(e, null, r, "beforeMount");
		let v = pi(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && W(() => {
			try {
				f && Wi(f, r, e), v && g.enter(d), _ && Dn(e, null, r, "mounted");
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
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? Vi(e[l]) : Bi(e[l]), t, n, r, i, a, o, s);
	}, ne = (e, n, r, i, a, o, s) => {
		let l = n.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = n;
		u |= e.patchFlag & 16;
		let m = e.props || t, h = n.props || t, g;
		if (r && fi(r, !1), (g = h.onVnodeBeforeUpdate) && Wi(g, r, n, e), f && Dn(n, e, r, "beforeUpdate"), r && fi(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? D(e.dynamicChildren, d, l, r, i, di(n, a), o) : s || le(e, n, l, null, r, i, di(n, a), o, !1), u > 0) {
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
		((g = h.onVnodeUpdated) || f) && W(() => {
			g && Wi(g, r, n, e), f && Dn(n, e, r, "updated");
		}, i);
	}, D = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === G || !Mi(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
		}
	}, O = (e, n, r, i, a) => {
		if (n !== r) {
			if (n !== t) for (let t in n) !T(t) && !(t in r) && c(e, t, n[t], null, a, i);
			for (let t in r) {
				if (T(t)) continue;
				let o = r[t], s = n[t];
				o !== s && t !== "value" && c(e, t, s, o, a, i);
			}
			"value" in r && c(e, "value", n.value, r.value, a);
		}
	}, re = (e, t, n, r, i, a, s, c, l) => {
		let d = t.el = e ? e.el : u(""), f = t.anchor = e ? e.anchor : u(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), E(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (D(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && mi(e, t, !0)) : le(e, t, n, f, i, a, s, c, l);
	}, k = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : A(t, n, r, i, a, o, c) : ae(e, t, c);
	}, A = (e, t, n, r, i, a, o) => {
		let s = e.component = qi(e, r, i);
		if (Kn(e) && (s.ctx.renderer = be), ta(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, oe, o), !e.el) {
				let r = s.subTree = Fi(Si);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else oe(s, e, t, n, i, a, o);
	}, ae = (e, t, n) => {
		let r = t.component = e.component;
		if (Vr(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			se(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, oe = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = gi(e);
					if (n) {
						t && (t.el = c.el, se(e, t, o)), n.asyncDep.then(() => {
							W(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				fi(e, !1), t ? (t.el = c.el, se(e, t, o)) : t = c, n && ie(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Wi(d, s, t, c), fi(e, !0);
				let f = Rr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), _e(p), e, i, a), t.el = f.el, u === null && Wr(e, f.el), r && W(r, i), (d = t.props && t.props.onVnodeUpdated) && W(() => Wi(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Gn(t);
				if (fi(e, !1), l && ie(l), !m && (o = c && c.onVnodeBeforeMount) && Wi(o, d, t), fi(e, !0), s && xe) {
					let t = () => {
						e.subTree = Rr(e), xe(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Rr(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && W(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					W(() => Wi(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Gn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && W(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new Ee(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => hn(u), fi(e, !0), l();
	}, se = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Yr(e, t.props, r, n), ci(e, t.children, n), Ve(), vn(e), He();
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
		m & 8 ? (u & 16 && ge(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? de(l, d, n, r, i, a, o, s, c) : ge(l, i, a, !0) : (u & 8 && p(n, ""), m & 16 && E(d, n, r, i, a, o, s, c));
	}, ue = (e, t, r, i, a, o, s, c, l) => {
		e ||= n, t ||= n;
		let u = e.length, d = t.length, f = Math.min(u, d), p;
		for (p = 0; p < f; p++) {
			let n = t[p] = l ? Vi(t[p]) : Bi(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? ge(e, a, o, !0, !1, f) : E(t, r, i, a, o, s, c, l, f);
	}, de = (e, t, r, i, a, o, s, c, l) => {
		let u = 0, d = t.length, f = e.length - 1, p = d - 1;
		for (; u <= f && u <= p;) {
			let n = e[u], i = t[u] = l ? Vi(t[u]) : Bi(t[u]);
			if (Mi(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			u++;
		}
		for (; u <= f && u <= p;) {
			let n = e[f], i = t[p] = l ? Vi(t[p]) : Bi(t[p]);
			if (Mi(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			f--, p--;
		}
		if (u > f) {
			if (u <= p) {
				let e = p + 1, n = e < d ? t[e].el : i;
				for (; u <= p;) v(null, t[u] = l ? Vi(t[u]) : Bi(t[u]), r, n, a, o, s, c, l), u++;
			}
		} else if (u > p) for (; u <= f;) pe(e[u], a, o, !0), u++;
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
					pe(n, a, o, !0);
					continue;
				}
				let i;
				if (n.key != null) i = g.get(n.key);
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && Mi(n, t[_])) {
					i = _;
					break;
				}
				i === void 0 ? pe(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++);
			}
			let w = x ? hi(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || vi(f) : i;
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
			c.move(e, t, n, be);
			return;
		}
		if (c === G) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) fe(u[e], t, n, r);
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
				a._isLeaving && a[Ln](!0), r(a, () => {
					u(), c && c();
				});
			};
			i ? i(a, u, d) : d();
		}
		else o(a, t, n);
	}, pe = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (Ve(), Un(s, null, n, e, !0), He()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Gn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Wi(_, t, e), u & 6) he(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && Dn(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, be, r) : l && !l.hasOnce && (a !== G || d > 0 && d & 64) ? ge(l, t, n, !1, !0) : (a === G && d & 384 || !i && u & 16) && ge(c, t, n), r && j(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && W(() => {
			_ && Wi(_, t, e), h && Dn(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, j = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === G) {
			me(n, r);
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
	}, me = (e, t) => {
		let n;
		for (; e !== t;) n = h(e), s(e), e = n;
		s(t);
	}, he = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		_i(c), _i(l), r && ie(r), i.stop(), a && (a.flags |= 8, pe(o, e, t, n)), s && W(s, t), W(() => {
			e.isUnmounted = !0;
		}, t);
	}, ge = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) pe(e[o], t, n, r, i);
	}, _e = (e) => {
		if (e.shapeFlag & 6) return _e(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[Fn];
		return n ? h(n) : t;
	}, ve = !1, ye = (e, t, n) => {
		let r;
		e == null ? t._vnode && (pe(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, ve ||= (ve = !0, vn(r), yn(), !1);
	}, be = {
		p: v,
		um: pe,
		m: fe,
		r: j,
		mt: A,
		mc: E,
		pc: le,
		pbc: D,
		n: _e,
		o: e
	}, M, xe;
	return i && ([M, xe] = i(be)), {
		render: ye,
		hydrate: M,
		createApp: jr(ye, M)
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
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Vi(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && mi(t, a)), a.type === xi && (a.patchFlag === -1 && (a = i[e] = Vi(a)), a.el = t.el), a.type === Si && !a.el && (a.el = t.el);
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
var G = /* @__PURE__ */ Symbol.for("v-fgt"), xi = /* @__PURE__ */ Symbol.for("v-txt"), Si = /* @__PURE__ */ Symbol.for("v-cmt"), Ci = /* @__PURE__ */ Symbol.for("v-stc"), wi = [], Ti = null;
function K(e = !1) {
	wi.push(Ti = e ? null : []);
}
function Ei() {
	wi.pop(), Ti = wi[wi.length - 1] || null;
}
var Di = 1;
function Oi(e, t = !1) {
	Di += e, e < 0 && Ti && t && (Ti.hasOnce = !0);
}
function ki(e) {
	return e.dynamicChildren = Di > 0 ? Ti || n : null, Ei(), Di > 0 && Ti && Ti.push(e), e;
}
function q(e, t, n, r, i, a) {
	return ki(J(e, t, n, r, i, a, !0));
}
function Ai(e, t, n, r, i) {
	return ki(Fi(e, t, n, r, i, !0));
}
function ji(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function Mi(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Ni = ({ key: e }) => e ?? null, Pi = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ L(e) || h(e) ? {
	i: Sn,
	r: e,
	k: t,
	f: !!n
} : e);
function J(e, t = null, n = null, r = 0, i = null, a = e === G ? 0 : 1, o = !1, s = !1) {
	let c = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e,
		props: t,
		key: t && Ni(t),
		ref: t && Pi(t),
		scopeId: Cn,
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
		ctx: Sn
	};
	return s ? (Hi(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Di > 0 && !o && Ti && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && Ti.push(c), c;
}
var Fi = Ii;
function Ii(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === lr) && (e = Si), ji(e)) {
		let r = Ri(e, t, !0);
		return n && Hi(r, n), Di > 0 && !a && Ti && (r.shapeFlag & 6 ? Ti[Ti.indexOf(e)] = r : Ti.push(r)), r.patchFlag = -2, r;
	}
	if (ua(e) && (e = e.__vccOpts), t) {
		t = Li(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = j(e)), v(n) && (/* @__PURE__ */ Bt(n) && !d(n) && (n = s({}, n)), t.style = le(n));
	}
	let o = g(e) ? 1 : yi(e) ? 128 : In(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return J(e, t, n, r, i, o, a, !0);
}
function Li(e) {
	return e ? /* @__PURE__ */ Bt(e) || qr(e) ? s({}, e) : e : null;
}
function Ri(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? Ui(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && Ni(l),
		ref: t && t.ref ? n && a ? d(a) ? a.concat(Pi(t)) : [a, Pi(t)] : Pi(t) : a,
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
		ssContent: e.ssContent && Ri(e.ssContent),
		ssFallback: e.ssFallback && Ri(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && Rn(u, c.clone(u)), u;
}
function Y(e = " ", t = 0) {
	return Fi(xi, null, e, t);
}
function zi(e, t) {
	let n = Fi(Ci, null, e);
	return n.staticCount = t, n;
}
function X(e = "", t = !1) {
	return t ? (K(), Ai(Si, null, e)) : Fi(Si, null, e);
}
function Bi(e) {
	return e == null || typeof e == "boolean" ? Fi(Si) : d(e) ? Fi(G, null, e.slice()) : ji(e) ? Vi(e) : Fi(xi, null, String(e));
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
		!r && !qr(t) ? t._ctx = Sn : r === 3 && Sn && (Sn.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: Sn
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Y(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Ui(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = j([t.class, r.class]));
		else if (e === "style") t.style = le([t.style, r.style]);
		else if (a(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(d(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !o(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Wi(e, t, n, r = null) {
	rn(e, t, 7, [n, r]);
}
var Gi = kr(), Ki = 0;
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
		scope: new Ce(!0),
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
var Z = null, Ji = () => Z || Sn, Yi, Xi;
{
	let e = ce(), t = (t, n) => {
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
	Jr(e, r, a, t), si(e, i, n || t);
	let o = a ? na(e, t) : void 0;
	return t && Xi(!1), o;
}
function na(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, pr);
	let { setup: r } = n;
	if (r) {
		Ve();
		let n = e.setupContext = r.length > 1 ? ca(e) : null, i = Zi(e), a = nn(r, e, 0, [e.props, n]), o = y(a);
		if (He(), i(), (o || e.sp) && !Gn(e) && Bn(e), o) {
			if (a.then(Qi, Qi), t) return a.then((n) => {
				ra(e, n, t);
			}).catch((t) => {
				an(t, e, 0);
			});
			e.asyncDep = a;
		} else ra(e, a, t);
	} else oa(e, t);
}
function ra(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = qt(t)), oa(e, n);
}
var ia, aa;
function oa(e, t, n) {
	let i = e.type;
	if (!e.render) {
		if (!t && ia && !i.render) {
			let t = i.template || br(e).template;
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
		Ve();
		try {
			gr(e);
		} finally {
			He(), t();
		}
	}
}
var sa = { get(e, t) {
	return F(e, "get", ""), e[t];
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
function ua(e) {
	return h(e) && "__vccOpts" in e;
}
var Q = (e, t) => /* @__PURE__ */ Yt(e, t, ea), da = "3.5.34", fa = void 0, pa = typeof window < "u" && window.trustedTypes;
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
	r = O(r);
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
function Pa(e, t, n, r, i, a = he(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Na, t.slice(6, t.length)) : e.setAttributeNS(Na, t, n) : n == null || a && !ge(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
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
		r === "boolean" ? n = ge(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
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
		rn(Ka(e, n.value), t, 5, [e]);
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
	let r = /* @__PURE__ */ zn(e, t);
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
		if (t) for (let e in t) u(this, e) || Object.defineProperty(this, e, { get: () => z(t[e]) });
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
		t && this._numberProps && this._numberProps[r] && (n = oe(n)), this._setProp(r, n, !1, !0);
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
		let t = Fi(this._def, s(e, this._props));
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
	return d(t) ? (e) => ie(t, e) : t;
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
	return t && (e = e.trim()), n && (e = ae(e)), e;
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
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? ae(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, so = {
	deep: !0,
	created(e, { value: t, modifiers: { number: n } }, r) {
		let i = p(t);
		Ia(e, "change", () => {
			let t = Array.prototype.filter.call(e.options, (e) => e.selected).map((e) => n ? ae(lo(e)) : lo(e));
			e[io](e.multiple ? i ? new Set(t) : t : t[0]), e._assigning = !0, pn(() => {
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
				e === "string" || e === "number" ? a.selected = t.some((e) => String(e) === String(o)) : a.selected = ye(t, o) > -1;
			} else a.selected = t.has(o);
			else if (ve(lo(a), t)) {
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
	return _o ||= li(go);
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
	t.enabled ? V(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), ir(a);
}
//#endregion
//#region packages/sdk-vue/src/markdown.ts
var ps = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
function ms(e) {
	return e.replace(/[&<>"']/g, (e) => ps[e] ?? e);
}
var hs = /\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, gs = "CODE", _s = "END";
function vs(e) {
	let t = [], n = e.replace(/`([^`]+)`/g, (e, n) => (t.push("<code>" + n + "</code>"), gs + (t.length - 1) + _s));
	n = n.replace(hs, (e) => "<a href=\"" + e + "\" rel=\"noopener noreferrer\">" + e + "</a>"), n = n.replace(/\*\*([^*]+)\*\*/g, (e, t) => "<strong>" + t + "</strong>"), n = n.replace(/(^|[^*])\*([^*\s][^*]*?[^*\s]|[^*\s])\*(?!\*)/g, (e, t, n) => t + "<em>" + n + "</em>");
	let r = /* @__PURE__ */ RegExp("CODE(\\d+)END", "g");
	return n.replace(r, (e, n) => t[Number(n)] ?? "");
}
function ys(e) {
	let t = e.replace(/\r\n?/g, "\n").split("\n"), n = [], r = 0;
	for (; r < t.length;) {
		let e = t[r] ?? "";
		if (e.trim() === "") {
			r += 1;
			continue;
		}
		let i = e.match(/^```(\w*)\s*$/);
		if (i) {
			let e = (i[1] ?? "").trim();
			r += 1;
			let a = [];
			for (; r < t.length && !(t[r] ?? "").startsWith("```");) a.push(t[r] ?? ""), r += 1;
			r += 1, n.push({
				kind: "code",
				lang: e,
				text: a.join("\n")
			});
			continue;
		}
		let a = e.match(/^(#{1,6})\s+(.+?)\s*$/);
		if (a) {
			n.push({
				kind: "heading",
				level: Math.min(6, (a[1] ?? "").length),
				text: a[2] ?? ""
			}), r += 1;
			continue;
		}
		if (/^\s*[-*]\s+/.test(e)) {
			let e = [];
			for (; r < t.length && /^\s*[-*]\s+/.test(t[r] ?? "");) e.push((t[r] ?? "").replace(/^\s*[-*]\s+/, "")), r += 1;
			n.push({
				kind: "list",
				ordered: !1,
				text: "",
				items: e
			});
			continue;
		}
		if (/^\s*\d+\.\s+/.test(e)) {
			let e = [];
			for (; r < t.length && /^\s*\d+\.\s+/.test(t[r] ?? "");) e.push((t[r] ?? "").replace(/^\s*\d+\.\s+/, "")), r += 1;
			n.push({
				kind: "list",
				ordered: !0,
				text: "",
				items: e
			});
			continue;
		}
		let o = [e];
		for (r += 1; r < t.length && (t[r] ?? "").trim() !== "" && !/^```/.test(t[r] ?? "") && !/^#{1,6}\s+/.test(t[r] ?? "") && !/^\s*[-*]\s+/.test(t[r] ?? "") && !/^\s*\d+\.\s+/.test(t[r] ?? "");) o.push(t[r] ?? ""), r += 1;
		n.push({
			kind: "paragraph",
			text: o.join("\n")
		});
	}
	return n;
}
function bs(e) {
	if (!e) return "";
	let t = ys(e), n = [];
	for (let e of t) switch (e.kind) {
		case "heading": {
			let t = e.level ?? 1, r = vs(ms(e.text));
			n.push("<h" + t + ">" + r + "</h" + t + ">");
			break;
		}
		case "paragraph": {
			let t = vs(ms(e.text));
			n.push("<p>" + t.replace(/\n/g, "<br />") + "</p>");
			break;
		}
		case "code": {
			let t = e.lang ? " data-lang=\"" + ms(e.lang) + "\"" : "";
			n.push("<pre" + t + "><code>" + ms(e.text) + "</code></pre>");
			break;
		}
		case "list": {
			let t = e.ordered ? "ol" : "ul", r = (e.items ?? []).map((e) => "  <li>" + vs(ms(e)) + "</li>").join("\n");
			n.push("<" + t + ">\n" + r + "\n</" + t + ">");
			break;
		}
	}
	return n.join("\n");
}
//#endregion
//#region packages/sdk-vue/src/parse-query.ts
function xs(e, t) {
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
var Ss = {
	kind: "unknown",
	label: "unknown",
	glyph: "·",
	tone: "neutral"
};
function $(e) {
	if (!e) return Ss;
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: Cs(r),
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
			glyph: Cs(r) || "·",
			tone: "neutral"
		};
	}
}
function Cs(e) {
	return e.slice(0, 1).toUpperCase();
}
//#endregion
//#region packages/sdk-vue/src/comtrya-config.ts
function ws() {
	if (typeof window > "u") return [];
	let e = window.location.pathname;
	if (!e.startsWith("/r/")) return [];
	let t = e.slice(3), n = t.indexOf("/p/");
	return (n >= 0 ? t.slice(0, n) : t).split("/").filter(Boolean).map(decodeURIComponent);
}
async function Ts(e) {
	try {
		let t = e ?? ws(), n = t.length > 0 ? "query ComtryaProjects($segments: [String!]!) {\n          workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n        }" : "query ComtryaProjectsCwd { repository { comtryaConfig } }", r = t.length > 0 ? { segments: t } : void 0, i = await Oo().query(n, r);
		return ((i.workspace?.repositoryByPath?.comtryaConfig ?? i.repository?.comtryaConfig ?? null)?.projects ?? []).filter((e) => typeof e == "object" && !!e);
	} catch {
		return [];
	}
}
//#endregion
//#region packages/sdk-vue/src/LabelPill.vue?vue&type=script&setup=true&lang.ts
var Es = ["title"], Ds = {
	key: 0,
	class: "label-pill-value"
}, Os = { class: "label-pill-type" }, ks = { class: "label-pill-value" }, As = /* @__PURE__ */ zn({
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
		return (e, t) => (K(), q("span", {
			class: j(["label-pill", [`label-pill--${r.value.kind}`]]),
			title: a.value ?? void 0,
			style: le(i.value ? { "--label-color": i.value } : void 0)
		}, [r.value.kind === "plain" ? (K(), q("span", Ds, M(r.value.value), 1)) : (K(), q(G, { key: 1 }, [
			J("span", Os, M(r.value.type), 1),
			t[0] ||= J("span", {
				class: "label-pill-sep",
				"aria-hidden": "true"
			}, "::", -1),
			J("span", ks, M(r.value.value), 1)
		], 64))], 14, Es));
	}
});
//#endregion
//#region packages/sdk-vue/src/index.ts
function js(e) {
	Ms(e.tagName, e.component);
	let t = /* @__PURE__ */ Qa(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(Ps(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function Ms(e, t) {
	if (typeof document > "u") return;
	let n = Ns(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function Ns(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function Ps(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_issues/dist/ext_issues.client.ts
var Fs = {
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
}, Is = "query($from: ResourceURN!, $kind: ResourceURN) {\n  relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n}", Ls = "query($to: ResourceURN!, $kind: ResourceURN) {\n  relations.incoming(to: $to, kind: $kind) { id kind from to source target }\n}", Rs = "mutation($input: RelationCreateInput!) {\n  relations.create(input: $input) { id kind from to source target }\n}", zs = "mutation($input: RelationDeleteInput!) {\n  relations.delete(input: $input)\n}";
function Bs(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Vs(e, t) {
	return t ? `comtrya://workspace/${e}/repository/${t}` : `comtrya://workspace/${e}`;
}
function Hs(e) {
	let t = e?.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/([^/]+))?$/);
	return {
		workspaceId: t?.[1] ?? "",
		repositoryId: t?.[2] ?? null
	};
}
function Us(e) {
	switch (e) {
		case "closed":
		case "CLOSED": return "CLOSED";
		case "reopened":
		case "REOPENED": return "REOPENED";
		default: return "OPEN";
	}
}
function Ws(e) {
	let t = Hs(e.repository);
	return {
		id: e.id,
		workspaceId: t.workspaceId,
		repositoryId: t.repositoryId,
		number: e.number,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: Us(e.state),
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
async function Gs(e, t) {
	let n = Bs(await Fs.listIssues({
		repository: Vs(t.workspaceId, t.repositoryId),
		limit: 1024
	}), "listIssues").map(Ws), r = t.state ? Us(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function Ks(e, t) {
	let n = Bs(await Fs.byRefIssue(t), "issueByRef");
	return n ? Ws(n) : null;
}
async function qs(e, t, n) {
	let r = Bs(await Fs.byNumberIssue({
		workspaceId: t,
		number: n
	}), "issueByNumber");
	return r ? Ws(r) : null;
}
async function Js(e) {
	return Ws(Bs(await Fs.openIssue({
		repository: Vs(e.workspaceId, e.repositoryId),
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		projectName: e.projectName ?? null,
		labels: e.labels ?? [],
		closeOnMerge: e.closeOnMerge ?? null,
		assignees: e.assignees ?? []
	}), "openIssue"));
}
async function Ys(e, t) {
	return Ws(Bs(await Fs.closeIssue({
		id: t,
		reason: "completed"
	}), "closeIssue"));
}
async function Xs(e, t) {
	return Ws(Bs(await Fs.reopenIssue(t), "reopenIssue"));
}
async function Zs(e, t) {
	return Ws(Bs(await Fs.assignProject({
		id: e,
		projectName: t ?? null
	}), "assignProject"));
}
async function Qs(e, t, n) {
	return ((await e.query(Is, n ? {
		from: t,
		kind: n
	} : { from: t })).relations?.outgoing ?? []).map(nc);
}
async function $s(e, t, n) {
	return ((await e.query(Ls, n ? {
		to: t,
		kind: n
	} : { to: t })).relations?.incoming ?? []).map(nc);
}
async function ec(e, t) {
	let n = (await e.mutate(Rs, { input: t })).relations?.create;
	if (!n) throw Error("relations.create returned no relation");
	return nc(n);
}
async function tc(e, t) {
	return (await e.mutate(zs, { input: { id: t } })).relations?.delete ?? !1;
}
function nc(e) {
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
var rc = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
function ic(e) {
	return `comtrya://issue/${e.id}`;
}
var ac = "issues";
function oc(e) {
	return Io(ac, `/${e.workspaceId}/${e.number}`);
}
function sc() {
	return Io(ac, "/new");
}
function cc(e) {
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
var lc = ["data-state"], uc = ["data-issue-id"], dc = { class: "issue-card-title" }, fc = { class: "issue-number" }, pc = ["href"], mc = { class: "issue-meta" }, hc = { key: 0 }, gc = {
	key: 1,
	class: "issue-line muted"
}, _c = {
	key: 2,
	class: "issue-card-fallback"
}, vc = { class: "issue-line muted" }, yc = { class: "issue-line warn" }, bc = /* @__PURE__ */ zn({
	__name: "IssueCard",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issue: { type: null },
		ref: { type: String },
		resourceRef: { type: String }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R("idle"), r = /* @__PURE__ */ R(null), i = /* @__PURE__ */ R(t.issue ?? null), a = Q(() => t.resourceRef ?? t.ref ?? ""), o = Q(() => t.client ?? t.comtryaClient), s = Q(() => t.issue ?? i.value), c = Q(() => cc(s.value?.state)), l = Q(() => s.value?.labels?.join(", ") ?? ""), u = Q(() => s.value ? oc(s.value) : "#");
		er(d), V(() => [
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
				i.value = await Ks(o.value, a.value), n.value = i.value ? "ready" : "empty";
			} catch (e) {
				i.value = null, n.value = "error", r.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (e, t) => (K(), q("article", {
			class: "issue-card",
			"data-state": n.value,
			"data-smoke": "issue-card"
		}, [s.value ? (K(), q("div", {
			key: 0,
			class: "issue-card-body",
			"data-issue-id": s.value.id,
			"data-smoke": "issue-card-body"
		}, [J("div", dc, [
			J("span", { class: j(["issue-pill", c.value.className]) }, M(c.value.label), 3),
			J("span", fc, "#" + M(s.value.number), 1),
			J("a", {
				class: "issue-title-link",
				href: u.value
			}, M(s.value.title), 9, pc)
		]), J("div", mc, [J("span", null, "by " + M(s.value.authorRef ?? "unknown"), 1), l.value ? (K(), q("span", hc, M(l.value), 1)) : X("", !0)])], 8, uc)) : n.value === "loading" ? (K(), q("p", gc, " Loading " + M(a.value), 1)) : (K(), q("div", _c, [J("p", vc, M(a.value || "issue"), 1), J("p", yc, M(r.value ?? "issue not found"), 1)]))], 8, lc));
	}
}), xc = ".issue-card[data-v-926ccdce]{display:block}.issue-card-body[data-v-926ccdce]{border:1px solid var(--ink-rule,#d0cfc8);padding:8px 12px}.issue-card-title[data-v-926ccdce]{align-items:baseline;gap:8px;min-width:0;display:flex}.issue-pill[data-v-926ccdce],.issue-number[data-v-926ccdce],.issue-meta[data-v-926ccdce],.issue-line[data-v-926ccdce]{font-family:var(--mono,monospace)}.issue-pill[data-v-926ccdce]{border:1px solid;padding:1px 8px;font-size:10px}.issue-state-open[data-v-926ccdce]{color:var(--ink-go,#008873)}.issue-state-closed[data-v-926ccdce],.issue-number[data-v-926ccdce],.issue-meta[data-v-926ccdce]{color:var(--ink-faint,#888)}.issue-number[data-v-926ccdce]{font-size:12px}.issue-title-link[data-v-926ccdce]{min-width:0;color:inherit;font-family:var(--display,system-ui);overflow-wrap:anywhere;font-weight:600}.issue-meta[data-v-926ccdce]{flex-wrap:wrap;gap:8px;margin-top:4px;font-size:11px;display:flex}.issue-line[data-v-926ccdce]{margin:4px 0;font-size:12px}.muted[data-v-926ccdce]{color:var(--ink-faint,#888)}.warn[data-v-926ccdce]{color:var(--ink-warn,#c2410c)}", Sc = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, Cc = /* @__PURE__ */ Sc(bc, [["styles", [xc]], ["__scopeId", "data-v-926ccdce"]]), wc = /* @__PURE__ */ Sc(/* @__PURE__ */ zn({
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
		er(i), V(() => [
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
		return (e, t) => (K(), q("span", {
			ref_key: "mount",
			ref: n,
			class: "custom-element-host"
		}, null, 512));
	}
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]), Tc = {
	defaultLabels: [],
	closeOnMerge: null,
	ownerRefs: []
};
function Ec(e = "location") {
	let t = e === "location" ? typeof window < "u" ? window.location.pathname : "" : Dc();
	if (!t.startsWith("/r/")) return [];
	let n = t.slice(3), r = n.indexOf("/p/");
	return (r >= 0 ? n.slice(0, r) : n).split("/").filter(Boolean).map(decodeURIComponent);
}
function Dc() {
	let e = typeof document < "u" && document.referrer || "";
	if (!e) return "";
	try {
		return new URL(e).pathname;
	} catch {
		return "";
	}
}
async function Oc(e, t = "location") {
	try {
		let n = Ec(t), r = n.length > 0 ? "query Q($segments: [String!]!) {\n          workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n        }" : "{ repository { comtryaConfig } }", i = n.length > 0 ? { segments: n } : void 0, a = await Oo().query(r, i), o = ((a.workspace?.repositoryByPath?.comtryaConfig ?? a.repository?.comtryaConfig ?? null)?.projects ?? []).find((t) => t.name === e), s = (o?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0);
		return {
			defaultLabels: o?.issues?.defaultLabels ?? [],
			closeOnMerge: typeof o?.issues?.closeOnMerge == "boolean" ? o.issues.closeOnMerge : null,
			ownerRefs: s
		};
	} catch {
		return Tc;
	}
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/IssueDetail.vue?vue&type=script&setup=true&lang.ts
var kc = ["data-state", "data-issue-id"], Ac = {
	key: 0,
	class: "issue-line muted"
}, jc = {
	key: 1,
	class: "issue-line warn"
}, Mc = {
	key: 2,
	class: "issue-line warn"
}, Nc = {
	key: 3,
	class: "issue-detail-shell"
}, Pc = { class: "issue-main" }, Fc = { class: "issue-hero" }, Ic = { class: "issue-kicker" }, Lc = { class: "issue-number" }, Rc = {
	key: 0,
	class: "issue-repository"
}, zc = {
	class: "issue-chip-row",
	"aria-label": "Issue metadata"
}, Bc = ["href", "title"], Vc = {
	key: 1,
	class: "issue-chip tone-warn",
	title: "closeOnMerge=false — opted out of the PR merge reactor's auto-close path."
}, Hc = ["data-author-kind", "title"], Uc = { class: "chip-glyph" }, Wc = ["data-author-kind", "title"], Gc = { class: "chip-glyph" }, Kc = ["title"], qc = ["data-issue-id", "innerHTML"], Jc = ["data-issue-id"], Yc = { class: "issue-thread" }, Xc = {
	class: "issue-sidebar",
	"aria-label": "Issue sidebar"
}, Zc = { class: "issue-panel" }, Qc = { class: "issue-state-summary" }, $c = { key: 0 }, el = { class: "issue-actions" }, tl = ["disabled"], nl = ["disabled"], rl = {
	key: 0,
	class: "issue-line warn",
	role: "alert"
}, il = {
	class: "issue-panel",
	"data-smoke": "issue-project-picker"
}, al = ["value", "disabled"], ol = ["value"], sl = {
	key: 0,
	class: "issue-line warn",
	role: "alert"
}, cl = {
	key: 0,
	class: "issue-panel",
	"data-smoke": "issue-project-owners"
}, ll = ["href", "title"], ul = { class: "issue-owners" }, dl = ["data-author-kind", "title"], fl = { class: "chip-glyph" }, pl = { class: "issue-line muted" }, ml = "comtrya-issue-relationships", hl = /* @__PURE__ */ Sc(/* @__PURE__ */ zn({
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
		let t = e, n = /* @__PURE__ */ R("idle"), r = /* @__PURE__ */ R("idle"), i = /* @__PURE__ */ R(null), a = /* @__PURE__ */ R(null), o = /* @__PURE__ */ R(t.issue ?? null), s = Q(() => t.client ?? t.comtryaClient), c = Q(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3"), l = Q(() => o.value ?? t.issue ?? null), u = Q(() => cc(l.value?.state)), d = Q(() => !!l.value?.bodyMarkdown?.trim()), f = Q(() => d.value ? bs(l.value?.bodyMarkdown ?? "") : ""), p = Q(() => ee(l.value?.createdAt)), m = Q(() => te(l.value?.createdAt)), h = Q(() => t.repositoryPath ?? l.value?.repositoryId ?? null), g = Q(() => Number(t.number ?? t.routeParams?.params?.number)), _ = Q(() => s.value && Number.isFinite(g.value)), v = /* @__PURE__ */ R(null), y = Q(() => v.value?.ownerRefs ?? []);
		V(() => l.value?.projectName ?? "", async (e) => {
			if (!e) {
				v.value = null;
				return;
			}
			try {
				v.value = await Oc(e);
			} catch {
				v.value = null;
			}
		}, { immediate: !0 });
		let b = /* @__PURE__ */ R([]), x = /* @__PURE__ */ R("idle"), S = /* @__PURE__ */ R(null);
		er(async () => {
			try {
				b.value = await Ts();
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
				o.value = await Zs(n.id, r);
			} catch (e) {
				o.value = {
					...n,
					projectName: i
				}, t.value = i ?? "", S.value = e instanceof Error ? e.message : String(e);
			} finally {
				x.value = "idle";
			}
		}
		er(w), V(() => [
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
				let e = await qs(s.value, c.value, g.value);
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
						value: await Ys(e, t.id)
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
						value: await Xs(e, t.id)
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
		return (o, _) => (K(), q("main", {
			class: "issue-detail",
			"data-state": n.value,
			"data-issue-id": l.value?.id,
			"data-smoke": "issue-detail"
		}, [n.value === "loading" ? (K(), q("p", Ac, "Loading issue")) : n.value === "error" ? (K(), q("p", jc, M(i.value), 1)) : l.value ? (K(), q("div", Nc, [J("section", Pc, [
			J("header", Fc, [
				J("div", Ic, [
					J("span", { class: j(["issue-pill", u.value.className]) }, M(u.value.label), 3),
					J("span", Lc, "#" + M(l.value.number), 1),
					h.value ? (K(), q("span", Rc, M(h.value), 1)) : X("", !0)
				]),
				J("h1", null, M(l.value.title), 1),
				J("div", zc, [
					l.value.projectName ? (K(), q("a", {
						key: 0,
						class: "issue-chip tone-project issue-chip-link",
						href: `/x/issues/?project=${encodeURIComponent(l.value.projectName)}`,
						title: `Filter issues by project ${l.value.projectName}`
					}, [_[0] ||= J("span", { class: "chip-glyph" }, "◇", -1), Y(M(l.value.projectName), 1)], 8, Bc)) : X("", !0),
					(K(!0), q(G, null, H(l.value.labels ?? [], (t) => (K(), Ai(z(As), {
						key: `label-${t}`,
						name: t,
						catalog: e.labelCatalog ?? null
					}, null, 8, ["name", "catalog"]))), 128)),
					l.value.closeOnMerge === !1 ? (K(), q("span", Vc, "closeOnMerge · off")) : X("", !0),
					(K(!0), q(G, null, H(l.value.assignees ?? [], (e) => (K(), q("span", {
						key: `assignee-${e}`,
						class: "issue-chip tone-assignee",
						"data-author-kind": z($)(e).kind,
						title: e
					}, [J("span", Uc, M(z($)(e).glyph), 1), Y(" " + M(z($)(e).label), 1)], 8, Hc))), 128)),
					l.value.authorRef ? (K(), q("span", {
						key: 2,
						class: "issue-chip tone-author",
						"data-author-kind": z($)(l.value.authorRef).kind,
						title: `Opened by ${l.value.authorRef}`
					}, [J("span", Gc, M(z($)(l.value.authorRef).glyph), 1), Y(" by " + M(z($)(l.value.authorRef).label), 1)], 8, Wc)) : X("", !0),
					m.value ? (K(), q("span", {
						key: 3,
						class: "issue-chip tone-time",
						title: p.value ?? ""
					}, "opened " + M(m.value), 9, Kc)) : X("", !0)
				])
			]),
			d.value ? (K(), q("article", {
				key: 0,
				class: "issue-body prose",
				"data-issue-id": l.value.id,
				"data-smoke": "issue-detail-main",
				innerHTML: f.value
			}, null, 8, qc)) : (K(), q("article", {
				key: 1,
				class: "issue-body is-empty",
				"data-issue-id": l.value.id,
				"data-smoke": "issue-detail-main"
			}, " No description has been added yet. ", 8, Jc)),
			J("section", Yc, [_[1] ||= J("header", null, [J("h2", null, "Activity")], -1), Fi(wc, {
				tag: "comtrya-comment-thread",
				attributes: { target: z(ic)(l.value) },
				properties: {
					target: z(ic)(l.value),
					comtryaClient: s.value
				}
			}, null, 8, ["attributes", "properties"])])
		]), J("aside", Xc, [
			J("section", Zc, [
				_[2] ||= J("header", null, [J("h2", null, "State")], -1),
				J("div", Qc, [J("span", { class: j(["issue-pill", u.value.className]) }, M(u.value.label), 3), l.value.stateReason ? (K(), q("span", $c, M(l.value.stateReason), 1)) : X("", !0)]),
				J("div", el, [l.value.state === "OPEN" || l.value.state === "REOPENED" ? (K(), q("button", {
					key: 0,
					type: "button",
					disabled: r.value === "submitting",
					onClick: E
				}, " Close issue ", 8, tl)) : (K(), q("button", {
					key: 1,
					type: "button",
					disabled: r.value === "submitting",
					onClick: ne
				}, " Reopen issue ", 8, nl))]),
				a.value ? (K(), q("p", rl, M(a.value), 1)) : X("", !0)
			]),
			J("section", il, [
				_[4] ||= J("header", null, [J("h2", null, "Project")], -1),
				J("select", {
					class: "issue-project-select",
					"data-smoke": "issue-project-select",
					value: l.value.projectName ?? "",
					disabled: x.value === "submitting",
					onChange: C
				}, [_[3] ||= J("option", { value: "" }, "— no project —", -1), (K(!0), q(G, null, H(b.value, (e) => (K(), q("option", {
					key: e.name,
					value: e.name ?? ""
				}, M(e.name), 9, ol))), 128))], 40, al),
				S.value ? (K(), q("p", sl, M(S.value), 1)) : X("", !0),
				_[5] ||= J("p", { class: "issue-line muted" }, [
					Y(" Stamps "),
					J("code", null, "projectName"),
					Y(" on this issue. Lights up the workspace per-Project counts. ")
				], -1)
			]),
			l.value.projectName && y.value.length > 0 ? (K(), q("section", cl, [
				J("header", null, [_[6] ||= J("h2", null, "Routed to", -1), J("a", {
					href: `/x/issues/?project=${encodeURIComponent(l.value.projectName)}`,
					class: "issue-panel-link",
					title: `Filter to project ${l.value.projectName}`
				}, "◇ " + M(l.value.projectName), 9, ll)]),
				J("ul", ul, [(K(!0), q(G, null, H(y.value, (e) => (K(), q("li", {
					key: e,
					class: "issue-owner",
					"data-author-kind": z($)(e).kind,
					title: e
				}, [J("span", fl, M(z($)(e).glyph), 1), Y(" " + M(z($)(e).label), 1)], 8, dl))), 128))]),
				J("p", pl, [
					_[7] ||= Y(" From ", -1),
					_[8] ||= J("code", null, "package comtrya", -1),
					Y(" · projects." + M(l.value.projectName) + ".owners ", 1)
				])
			])) : X("", !0),
			Fi(wc, {
				tag: ml,
				properties: {
					client: s.value,
					issue: l.value,
					workspaceId: c.value,
					repositoryId: l.value.repositoryId,
					repositoryPath: t.repositoryPath
				}
			}, null, 8, ["properties"])
		])])) : (K(), q("p", Mc, " No issue #" + M(Number.isFinite(g.value) ? g.value : "?") + " in " + M(c.value), 1))], 8, kc));
	}
}), [["styles", [".issue-detail[data-v-d31be39f]{width:min(100%,1180px);color:var(--ink,#111);gap:24px;padding:8px 0 48px;display:grid}.issue-detail-shell[data-v-d31be39f]{grid-template-columns:minmax(0,1fr) minmax(280px,340px);align-items:start;gap:32px;display:grid}.issue-main[data-v-d31be39f],.issue-sidebar[data-v-d31be39f],.issue-panel[data-v-d31be39f],.issue-thread[data-v-d31be39f]{min-width:0}.issue-main[data-v-d31be39f]{gap:24px;display:grid}.issue-sidebar[data-v-d31be39f]{gap:16px;display:grid}.issue-detail h1[data-v-d31be39f]{max-width:820px;font-family:var(--display,system-ui);letter-spacing:0;overflow-wrap:anywhere;margin:10px 0 0;font-size:42px;line-height:1}.issue-hero[data-v-d31be39f]{border-bottom:2px solid var(--ink,#111);gap:14px;padding-bottom:22px;display:grid}.issue-kicker[data-v-d31be39f]{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.issue-chip-row[data-v-d31be39f]{flex-wrap:wrap;gap:6px;margin:4px 0 0;display:flex}.issue-chip[data-v-d31be39f]{border:1px solid var(--rule-light,#d8d1c4);font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);align-items:center;gap:5px;padding:2px 8px;font-size:11px;line-height:16px;display:inline-flex}.issue-chip .chip-glyph[data-v-d31be39f]{place-items:center;width:13px;height:13px;font-size:10px;font-weight:700;display:inline-grid}.issue-chip.tone-project[data-v-d31be39f]{color:var(--accent-blue,#1d55a6);border-color:currentColor}.issue-chip-link[data-v-d31be39f]{cursor:pointer;text-decoration:none}.issue-chip-link[data-v-d31be39f]:hover{background:#1d55a60f}.issue-chip.tone-label[data-v-d31be39f]{color:var(--accent-teal,#087f6f);border-color:currentColor}.issue-chip.tone-warn[data-v-d31be39f]{color:var(--accent-yellow,#c89300);text-transform:lowercase;border-color:currentColor}.issue-chip.tone-assignee[data-v-d31be39f]{cursor:help;border-style:dashed;border-color:currentColor}.issue-chip.tone-author[data-v-d31be39f],.issue-chip.tone-assignee[data-v-d31be39f]{color:var(--ink-soft,#2c2b28)}.issue-chip.tone-author[data-author-kind=agent][data-v-d31be39f],.issue-chip.tone-assignee[data-author-kind=agent][data-v-d31be39f]{color:#6b3fa0}.issue-chip.tone-author[data-author-kind=credential][data-v-d31be39f],.issue-chip.tone-assignee[data-author-kind=credential][data-v-d31be39f]{color:var(--accent-yellow,#c89300)}.issue-chip.tone-author[data-author-kind=bot][data-v-d31be39f],.issue-chip.tone-assignee[data-author-kind=bot][data-v-d31be39f]{color:var(--accent-blue,#1d55a6)}.issue-chip.tone-author[data-author-kind=team][data-v-d31be39f],.issue-chip.tone-assignee[data-author-kind=team][data-v-d31be39f]{color:var(--accent-teal,#087f6f)}.issue-chip.tone-time[data-v-d31be39f]{color:var(--ink-faint,#68645c);border-style:none;padding-left:2px}.issue-line[data-v-d31be39f],.issue-kicker[data-v-d31be39f],.issue-panel[data-v-d31be39f],.issue-actions button[data-v-d31be39f]{font-family:var(--mono,monospace)}.issue-pill[data-v-d31be39f]{min-height:22px;font-family:var(--mono,monospace);text-transform:lowercase;border:1px solid;align-items:center;padding:2px 8px;font-size:11px;line-height:1;display:inline-flex}.issue-number[data-v-d31be39f],.issue-repository[data-v-d31be39f]{color:var(--ink-faint,#888);font-size:12px}.issue-state-open[data-v-d31be39f]{color:var(--ink-go,#008873)}.issue-state-closed[data-v-d31be39f]{color:var(--ink-faint,#888)}.issue-body[data-v-d31be39f]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 86%, white);white-space:pre-wrap;overflow-wrap:anywhere;min-height:156px;padding:20px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55}.issue-body.is-empty[data-v-d31be39f]{color:var(--ink-faint,#888);font-family:var(--mono,monospace);font-size:12px}.issue-thread[data-v-d31be39f]{gap:12px;padding-top:4px;display:grid}.issue-thread header[data-v-d31be39f],.issue-panel header[data-v-d31be39f]{border-bottom:1px solid var(--ink-rule,#d0cfc8);align-items:center;min-height:36px;display:flex}.issue-thread h2[data-v-d31be39f],.issue-panel h2[data-v-d31be39f]{font-family:var(--display,system-ui);margin:0;font-size:18px;line-height:1}.issue-panel[data-v-d31be39f]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 94%, white);gap:12px;padding:14px;display:grid}.issue-state-summary[data-v-d31be39f]{color:var(--ink-faint,#888);flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;display:flex}.issue-actions[data-v-d31be39f]{gap:8px;display:grid}.issue-project-select[data-v-d31be39f]{border:1.5px solid var(--ink-rule,#d0cfc8);background:var(--paper,#fffdf8);width:100%;color:var(--ink,#111);font-family:var(--mono,monospace);outline:none;padding:8px 10px;font-size:13px;transition:border-color .12s}.issue-project-select[data-v-d31be39f]:focus{border-color:var(--ink,#111)}.issue-project-select[data-v-d31be39f]:disabled{cursor:wait;opacity:.55}.issue-panel header .issue-panel-link[data-v-d31be39f]{font-family:var(--mono,monospace);color:var(--accent-blue,#1d55a6);letter-spacing:.02em;margin-left:auto;font-size:11px;text-decoration:none}.issue-panel header .issue-panel-link[data-v-d31be39f]:hover{text-underline-offset:2px;text-decoration:underline}.issue-owners[data-v-d31be39f]{flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none;display:flex}.issue-owner[data-v-d31be39f]{color:var(--ink,#111);font-family:var(--mono,monospace);letter-spacing:.02em;border:1px solid;align-items:center;gap:5px;padding:2px 8px;font-size:11px;display:inline-flex}.issue-owner .chip-glyph[data-v-d31be39f]{font-family:var(--display,system-ui);font-size:12px;line-height:1}.issue-owner[data-author-kind=team][data-v-d31be39f]{color:var(--accent-teal,#087f6f)}.issue-owner[data-author-kind=human][data-v-d31be39f]{color:var(--ink,#111)}.issue-owner[data-author-kind=agent][data-v-d31be39f]{color:#6b3fa0}.issue-owner[data-author-kind=bot][data-v-d31be39f]{color:var(--accent-blue,#1d55a6)}.issue-owner[data-author-kind=credential][data-v-d31be39f]{color:var(--accent-yellow,#c89300)}.issue-line.muted code[data-v-d31be39f]{font-family:var(--mono,monospace);background:var(--paper-tint,#f2efe7);color:var(--ink-soft,#2c2b28);padding:0 4px;font-size:11px}.issue-actions button[data-v-d31be39f]{border:1.5px solid var(--ink,#111);min-height:34px;color:inherit;cursor:pointer;text-align:left;background:0 0;padding:8px 12px}.issue-actions button[data-v-d31be39f]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-d31be39f]{margin:4px 0;font-size:12px}.muted[data-v-d31be39f]{color:var(--ink-faint,#888)}.warn[data-v-d31be39f]{color:var(--ink-warn,#c2410c)}@media (max-width:920px){.issue-detail-shell[data-v-d31be39f]{grid-template-columns:1fr}.issue-detail h1[data-v-d31be39f]{font-size:34px}}"]], ["__scopeId", "data-v-d31be39f"]]), gl = {
	class: "issue-relationships",
	"data-smoke": "issue-detail-relationships"
}, _l = { class: "relationship-header" }, vl = {
	key: 0,
	class: "issue-line muted"
}, yl = {
	key: 1,
	class: "issue-line warn"
}, bl = {
	key: 2,
	class: "issue-line muted"
}, xl = {
	key: 3,
	class: "relationship-groups"
}, Sl = { class: "relationship-group-heading" }, Cl = { class: "relationship-card" }, wl = [
	"aria-label",
	"disabled",
	"onClick"
], Tl = ["value"], El = ["value"], Dl = ["disabled"], Ol = {
	key: 5,
	class: "issue-line muted"
}, kl = {
	key: 6,
	class: "issue-line warn",
	role: "alert"
}, Al = "issue", jl = /* @__PURE__ */ Sc(/* @__PURE__ */ zn({
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
		let t = e, n = Q(() => t.client ?? t.comtryaClient), r = Q(() => ic(t.issue)), i = /* @__PURE__ */ R("idle"), a = /* @__PURE__ */ R(null), o = /* @__PURE__ */ R("idle"), s = /* @__PURE__ */ R(null), c = /* @__PURE__ */ R([]), l = /* @__PURE__ */ R([]), u = /* @__PURE__ */ R([]), d = /* @__PURE__ */ R(""), f = /* @__PURE__ */ R(""), p = /* @__PURE__ */ R(0), m, h = Q(() => (p.value, No(Al))), g = Q(() => y.value.reduce((e, t) => e + t.relations.length, 0)), _ = Q(() => {
			let e = [];
			for (let t of h.value) {
				if (t.symmetric) {
					let n = E(t.sourceKinds.includes(Al) ? t.targetKinds : t.sourceKinds);
					n.length > 0 && e.push({
						key: `${t.id}:symmetric`,
						type: t,
						direction: "symmetric",
						label: t.outgoingLabel,
						targetKinds: n
					});
					continue;
				}
				if (t.sourceKinds.includes(Al)) {
					let n = E(t.targetKinds);
					n.length > 0 && e.push({
						key: `${t.id}:outgoing`,
						type: t,
						direction: "outgoing",
						label: t.outgoingLabel,
						targetKinds: n
					});
				}
				if (t.targetKinds.includes(Al)) {
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
				if (t.sourceKinds.includes(Al)) {
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
				if (t.targetKinds.includes(Al)) {
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
		er(() => {
			m = Fo(() => {
				p.value += 1;
			});
		}), ir(() => m?.()), V(() => [n.value, t.issue.id], () => void b(), { immediate: !0 }), V(_, (e) => {
			e.some((e) => e.key === d.value) || (d.value = e[0]?.key ?? "");
		}, { immediate: !0 }), V(() => [
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
				let [t, n] = await Promise.all([Qs(e, r.value), $s(e, r.value)]);
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
						currentKind: Al,
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
				await ec(e, {
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
					await tc(t, e.id), await b();
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
		return (e, t) => (K(), q("section", gl, [
			J("header", _l, [J("div", null, [t[2] ||= J("h2", null, "Relationships", -1), J("p", null, M(g.value) + " linked", 1)])]),
			i.value === "loading" ? (K(), q("p", vl, "Loading relationships")) : i.value === "error" ? (K(), q("p", yl, M(a.value), 1)) : y.value.length === 0 ? (K(), q("p", bl, " No relationships yet. ")) : (K(), q("div", xl, [(K(!0), q(G, null, H(y.value, (e) => (K(), q("section", {
				key: e.key,
				class: "relationship-group"
			}, [J("div", Sl, [J("h3", null, M(e.label), 1), J("span", null, M(e.relations.length), 1)]), J("ul", null, [(K(!0), q(G, null, H(e.relations, (t) => (K(), q("li", { key: t.relation.id }, [J("div", Cl, [Fi(wc, {
				tag: "comtrya-resource-card",
				attributes: { ref: t.targetRef },
				properties: {
					ref: t.targetRef,
					comtryaClient: n.value
				}
			}, null, 8, ["attributes", "properties"])]), J("button", {
				type: "button",
				class: "relationship-remove",
				"aria-label": `Remove ${e.label} relationship`,
				disabled: o.value === "submitting",
				onClick: (e) => C(t.relation)
			}, " Remove ", 8, wl)]))), 128))])]))), 128))])),
			_.value.length > 0 ? (K(), q("form", {
				key: 4,
				class: "relationship-form",
				onSubmit: po(S, ["prevent"])
			}, [
				J("label", null, [t[3] ||= J("span", null, "Type", -1), En(J("select", {
					"onUpdate:modelValue": t[0] ||= (e) => d.value = e,
					"aria-label": "Relationship type"
				}, [(K(!0), q(G, null, H(_.value, (e) => (K(), q("option", {
					key: e.key,
					value: e.key
				}, M(e.label), 9, Tl))), 128))], 512), [[so, d.value]])]),
				J("label", null, [t[4] ||= J("span", null, "Target", -1), En(J("select", {
					"onUpdate:modelValue": t[1] ||= (e) => f.value = e,
					"aria-label": "Relationship target"
				}, [(K(!0), q(G, null, H(u.value, (e) => (K(), q("option", {
					key: e.ref,
					value: e.ref
				}, M(e.title) + M(e.subtitle ? ` - ${e.subtitle}` : ""), 9, El))), 128))], 512), [[so, f.value]])]),
				J("button", {
					type: "submit",
					disabled: o.value !== "idle" || !f.value
				}, " Add ", 8, Dl)
			], 32)) : X("", !0),
			_.value.length > 0 && u.value.length === 0 && o.value === "idle" ? (K(), q("p", Ol, " No eligible targets for this relationship. ")) : X("", !0),
			s.value ? (K(), q("p", kl, M(s.value), 1)) : X("", !0)
		]));
	}
}), [["styles", [".issue-relationships[data-v-0937cdb1]{border:1px solid var(--ink-rule,#d0cfc8);background:color-mix(in srgb, var(--paper,#f7f4ec) 94%, white);font-family:var(--mono,monospace);gap:12px;padding:14px;font-size:12px;display:grid}.relationship-header[data-v-0937cdb1]{border-bottom:1px solid var(--ink-rule,#d0cfc8);align-items:center;min-height:36px;display:flex}.relationship-header h2[data-v-0937cdb1],.relationship-group h3[data-v-0937cdb1]{font-family:var(--display,system-ui);margin:0}.relationship-header h2[data-v-0937cdb1]{font-size:18px;line-height:1}.relationship-header p[data-v-0937cdb1]{color:var(--ink-faint,#888);margin:4px 0 0;font-size:11px}.relationship-groups[data-v-0937cdb1],.relationship-group[data-v-0937cdb1],.relationship-group ul[data-v-0937cdb1]{flex-direction:column;gap:8px;display:flex}.relationship-group[data-v-0937cdb1]{padding-top:4px}.relationship-group-heading[data-v-0937cdb1]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.relationship-group-heading h3[data-v-0937cdb1]{font-size:14px;line-height:1}.relationship-group-heading span[data-v-0937cdb1]{color:var(--ink-faint,#888);font-size:11px}.relationship-group ul[data-v-0937cdb1]{margin:0;padding:0;list-style:none}.relationship-group li[data-v-0937cdb1]{grid-template-columns:minmax(0,1fr) auto;align-items:stretch;gap:8px;display:grid}.relationship-card[data-v-0937cdb1]{min-width:0}.relationship-form[data-v-0937cdb1]{border-top:1px solid var(--ink-rule,#d0cfc8);gap:8px;padding-top:12px;display:grid}.relationship-form label[data-v-0937cdb1]{flex-direction:column;gap:4px;min-width:0;display:flex}.relationship-form label>span[data-v-0937cdb1]{color:var(--ink-faint,#888);letter-spacing:.08em;text-transform:uppercase;font-size:10px}.relationship-form select[data-v-0937cdb1],.relationship-form button[data-v-0937cdb1],.relationship-group button[data-v-0937cdb1]{border:1px solid var(--ink,#111);min-height:32px;color:inherit;font:inherit;background:0 0}.relationship-form select[data-v-0937cdb1]{width:100%;max-width:100%;padding:5px 8px}.relationship-form button[data-v-0937cdb1],.relationship-group button[data-v-0937cdb1]{cursor:pointer;padding:5px 10px}.relationship-remove[data-v-0937cdb1]{color:var(--ink-faint,#888);align-self:start}.relationship-form button[data-v-0937cdb1]:disabled,.relationship-group button[data-v-0937cdb1]:disabled{cursor:wait;opacity:.55}.issue-line[data-v-0937cdb1]{margin:4px 0;font-size:12px}.muted[data-v-0937cdb1]{color:var(--ink-faint,#888)}.warn[data-v-0937cdb1]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-0937cdb1"]]), Ml = {
	class: "issues-queue",
	"data-smoke": "issues-list"
}, Nl = { class: "issues-queue-head" }, Pl = { class: "head-row" }, Fl = ["href"], Il = { class: "issues-controls" }, Ll = {
	class: "issues-filter-row",
	role: "tablist",
	"aria-label": "Filter issues by state"
}, Rl = ["aria-selected", "onClick"], zl = { class: "count" }, Bl = { class: "issues-search" }, Vl = {
	key: 0,
	class: "issues-query-chips",
	"data-smoke": "issues-query-chips",
	"aria-label": "Parsed search filters"
}, Hl = ["title"], Ul = {
	key: 1,
	class: "issues-assignee-filter",
	"data-smoke": "issues-assignee-filter"
}, Wl = ["data-author-kind", "title"], Gl = { class: "author-glyph" }, Kl = {
	key: 2,
	class: "issues-project-filter",
	"data-smoke": "issues-project-filter"
}, ql = ["title"], Jl = ["data-busy"], Yl = ["placeholder", "disabled"], Xl = {
	key: 0,
	class: "quick-add-status"
}, Zl = ["title"], Ql = {
	key: 2,
	class: "quick-add-chip tone-yellow",
	title: "closeOnMerge=false — opt-out from PR auto-close reactor"
}, $l = ["title"], eu = {
	key: 0,
	class: "quick-add-error",
	role: "alert"
}, tu = {
	key: 1,
	class: "issues-bulk-bar",
	"data-smoke": "issues-bulk-bar"
}, nu = { class: "count" }, ru = ["disabled"], iu = { class: "bulk-reproject" }, au = ["disabled"], ou = ["value"], su = ["disabled"], cu = {
	key: 2,
	class: "quick-add-error",
	role: "alert"
}, lu = {
	key: 3,
	class: "muted"
}, uu = {
	key: 4,
	class: "muted error",
	role: "alert"
}, du = {
	key: 5,
	class: "muted"
}, fu = ["href"], pu = {
	key: 6,
	class: "muted"
}, mu = {
	key: 7,
	class: "issues-list",
	role: "listbox",
	"aria-label": "Issue list"
}, hu = ["aria-selected", "onMouseenter"], gu = ["href"], _u = { class: "issues-row-number" }, vu = { class: "issues-row-body" }, yu = { class: "issues-row-title" }, bu = { class: "issues-row-meta" }, xu = ["title", "onClick"], Su = [
	"data-author-kind",
	"title",
	"onClick"
], Cu = { class: "author-glyph" }, wu = ["data-author-kind"], Tu = { class: "author-glyph" }, Eu = {
	key: 0,
	class: "author-badge"
}, Du = {
	key: 1,
	class: "author-badge"
}, Ou = {
	key: 2,
	class: "author-badge"
}, ku = { class: "issues-row-age" }, Au = /* @__PURE__ */ Sc(/* @__PURE__ */ zn({
	__name: "IssuesList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issues: { type: [Array, null] },
		workspaceId: {
			default: rc,
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
		], r = /* @__PURE__ */ R("idle"), i = /* @__PURE__ */ R(null), a = /* @__PURE__ */ R(t.issues ?? []), o = /* @__PURE__ */ R("OPEN"), s = /* @__PURE__ */ R(""), c = /* @__PURE__ */ R(0), l = /* @__PURE__ */ R(""), u = /* @__PURE__ */ R(""), d = /* @__PURE__ */ R(/* @__PURE__ */ new Set()), f = /* @__PURE__ */ R(!1), p = /* @__PURE__ */ R(null);
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
				let n = await Promise.allSettled(t.map((t) => Ys(e, t))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
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
		let _ = /* @__PURE__ */ R([]);
		er(async () => {
			try {
				_.value = await Ts();
			} catch {
				_.value = [];
			}
		});
		async function v(e) {
			if (d.value.size === 0 || f.value) return;
			let t = Array.from(d.value);
			f.value = !0, p.value = null;
			try {
				let n = await Promise.allSettled(t.map((t) => Zs(t, e))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
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
		let b = /* @__PURE__ */ R(""), x = /* @__PURE__ */ R(!1), S = /* @__PURE__ */ R(null), C = /* @__PURE__ */ R({
			defaultLabels: [],
			closeOnMerge: null,
			ownerRefs: []
		}), w = /* @__PURE__ */ R(!1), T = Q(() => {
			let e = t.issues ?? a.value;
			return t.projectName ? e.filter((e) => e.projectName === t.projectName) : e;
		}), ee = Q(() => t.client ?? t.comtryaClient), te = Q(() => {
			let e = sc(), n = new URLSearchParams({ workspaceId: t.workspaceId });
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
		}, O = Q(() => xs(s.value, ne)), re = Q(() => {
			for (let e of O.value.filters.is ?? []) {
				let t = D[e.toLowerCase()];
				if (t) return t;
			}
			return o.value;
		}), k = Q(() => {
			for (let e of O.value.filters.assignee ?? []) if (e.startsWith("comtrya://")) return e;
			return l.value;
		}), ie = Q(() => {
			if (t.projectName) return "";
			for (let e of O.value.filters.project ?? []) if (e.trim()) return e.trim();
			return u.value;
		}), A = Q(() => {
			let e = O.value.text.trim().toLowerCase(), t = k.value, n = ie.value, r = re.value;
			return T.value.filter((e) => E(e, r)).filter((e) => n ? e.projectName === n : !0).filter((e) => t ? (e.assignees ?? []).includes(t) : !0).filter((t) => {
				if (!e) return !0;
				let n = (t.authorRef ?? "").split("/").pop() ?? "";
				return `${t.number} ${t.title} ${n}`.toLowerCase().includes(e);
			});
		}), ae = Q(() => {
			let e = [];
			for (let t of O.value.filters.is ?? []) {
				let n = D[t.toLowerCase()];
				e.push({
					key: "is",
					value: t,
					label: n ? `is · ${n.toLowerCase()}` : `is · ${t}`,
					tone: "is"
				});
			}
			for (let t of O.value.filters.assignee ?? []) {
				let n = $(t);
				e.push({
					key: "assignee",
					value: t,
					label: `→ ${n.label}`,
					tone: "assignee"
				});
			}
			for (let t of O.value.filters.project ?? []) e.push({
				key: "project",
				value: t,
				label: `◇ ${t}`,
				tone: "project"
			});
			for (let t of O.value.unknown) e.push({
				key: t,
				value: "",
				label: `unknown · ${t}:`,
				tone: "unknown"
			});
			return e;
		});
		function oe(e) {
			l.value === e ? l.value = "" : l.value = e;
		}
		function se() {
			l.value = "";
		}
		function ce(e) {
			u.value === e ? u.value = "" : u.value = e;
		}
		function le() {
			u.value = "";
		}
		let ue = Q(() => t.projectName ? `New issue in ${t.projectName}…` : "New issue…"), de = Q(() => {
			let e = {
				OPEN: 0,
				CLOSED: 0,
				ALL: T.value.length
			};
			for (let t of T.value) (t.state === "OPEN" || t.state === "REOPENED") && (e.OPEN += 1), t.state === "CLOSED" && (e.CLOSED += 1);
			return e;
		});
		function fe(e) {
			if (!e) return "";
			let t = Date.parse(e);
			if (Number.isNaN(t)) return e;
			let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
		}
		let pe = new Set([
			"OPEN",
			"CLOSED",
			"ALL"
		]);
		function me() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = (e.get("state") ?? "").toUpperCase();
			pe.has(t) && (o.value = t);
			let n = e.get("q");
			n !== null && (s.value = n);
			let r = e.get("assignee") ?? "";
			l.value = r.startsWith("comtrya://") ? r : "";
			let i = e.get("project") ?? "";
			u.value = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(i) ? i : "";
		}
		function he() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			o.value === "OPEN" ? e.delete("state") : e.set("state", o.value);
			let n = s.value.trim();
			n ? e.set("q", n) : e.delete("q"), l.value ? e.set("assignee", l.value) : e.delete("assignee"), u.value && !t.projectName ? e.set("project", u.value) : e.delete("project");
			let r = e.toString(), i = `${window.location.pathname}${r ? `?${r}` : ""}${window.location.hash}`;
			i !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", i);
		}
		let ge = !1;
		er(() => {
			ge = !0, me(), ge = !1, xe(), be(), window.addEventListener("popstate", _e);
		}), ir(() => {
			window.removeEventListener("popstate", _e);
		});
		function _e() {
			ge = !0, me(), pn(() => {
				ge = !1;
			});
		}
		V([
			o,
			s,
			l,
			u
		], () => {
			ge || he();
		}), fs({
			j: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, A.value.length - 1));
			},
			ArrowDown: (e) => {
				e.preventDefault(), c.value = Math.min(c.value + 1, Math.max(0, A.value.length - 1));
			},
			k: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			ArrowUp: (e) => {
				e.preventDefault(), c.value = Math.max(c.value - 1, 0);
			},
			Enter: (e) => {
				let t = A.value[c.value];
				t && (e.preventDefault(), window.location.href = oc(t));
			},
			" ": (e) => {
				let t = A.value[c.value];
				t && (e.preventDefault(), m(t.id));
			},
			Escape: (e) => {
				d.value.size !== 0 && (e.preventDefault(), h());
			},
			"/": (e) => {
				e.preventDefault(), document.querySelector("[data-issues-search]")?.focus();
			},
			c: (e) => {
				e.preventDefault(), Se();
			},
			...Object.fromEntries(n.map((e) => [e.key, (t) => {
				t.preventDefault(), o.value = e.id;
			}]))
		});
		function ve(e) {
			s.value &&= (e.preventDefault(), "");
		}
		function ye(e) {
			e.preventDefault(), b.value = "", S.value = null, e.target?.blur();
		}
		V(() => [
			ee.value,
			t.issues,
			t.workspaceId,
			t.repositoryId,
			t.state
		], () => void xe()), V(() => t.projectName, () => void be()), V(A, (e) => {
			c.value >= e.length && (c.value = Math.max(0, e.length - 1));
		});
		async function be() {
			if (!t.projectName) {
				C.value = {
					defaultLabels: [],
					closeOnMerge: null,
					ownerRefs: []
				}, w.value = !0;
				return;
			}
			C.value = await Oc(t.projectName, "location"), w.value = !0;
		}
		async function xe() {
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
				let e = await Gs(ee.value, {
					workspaceId: t.workspaceId,
					repositoryId: t.repositoryId,
					state: t.state
				});
				a.value = e, r.value = e.length > 0 ? "ready" : "empty";
			} catch (e) {
				a.value = [], r.value = "error", i.value = e instanceof Error ? e.message : String(e);
			}
		}
		function Se() {
			document.querySelector("[data-smoke=\"issues-quick-add\"]")?.focus();
		}
		async function N() {
			let e = b.value.trim();
			if (!(!e || x.value)) {
				x.value = !0, S.value = null;
				try {
					let n = await Js({
						workspaceId: t.workspaceId,
						repositoryId: t.repositoryId,
						projectName: t.projectName ?? null,
						title: e,
						bodyMarkdown: "",
						labels: C.value.defaultLabels,
						closeOnMerge: C.value.closeOnMerge,
						assignees: C.value.ownerRefs
					});
					a.value.some((e) => e.id === n.id) || (a.value = [n, ...a.value]), b.value = "", r.value = "ready", xe(), pn(Se);
				} catch (e) {
					S.value = e instanceof Error ? e.message : String(e);
				} finally {
					x.value = !1;
				}
			}
		}
		return (a, m) => (K(), q("section", Ml, [
			J("header", Nl, [
				J("div", Pl, [J("h2", null, M(e.title), 1), e.showNewLink ? (K(), q("a", {
					key: 0,
					href: te.value,
					class: "issues-new"
				}, "+ new", 8, Fl)) : X("", !0)]),
				J("div", Il, [J("div", Ll, [(K(), q(G, null, H(n, (e) => J("button", {
					key: e.id,
					type: "button",
					role: "tab",
					"aria-selected": o.value === e.id,
					class: j(["issues-filter", { active: o.value === e.id }]),
					onClick: (t) => o.value = e.id
				}, [
					J("span", null, M(e.label), 1),
					J("span", zl, M(de.value[e.id]), 1),
					J("kbd", null, M(e.key), 1)
				], 10, Rl)), 64))]), J("label", Bl, [En(J("input", {
					"data-issues-search": "",
					"onUpdate:modelValue": m[0] ||= (e) => s.value = e,
					type: "search",
					placeholder: "Filter — try is:open · project:<name> · assignee:<urn> · text",
					autocomplete: "off",
					onKeydown: ho(ve, ["esc"])
				}, null, 544), [[oo, s.value]]), m[2] ||= J("kbd", null, "/", -1)])]),
				ae.value.length > 0 ? (K(), q("div", Vl, [(K(!0), q(G, null, H(ae.value, (e) => (K(), q("span", {
					key: `${e.key}:${e.value || "unknown"}`,
					class: j(["query-chip", `tone-${e.tone}`]),
					title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
				}, M(e.label), 11, Hl))), 128)), m[3] ||= J("span", { class: "query-chips-hint" }, [
					Y(" syntax: "),
					J("code", null, "is:open"),
					Y(" · "),
					J("code", null, "project:<name>"),
					Y(" · "),
					J("code", null, "assignee:<urn>")
				], -1)])) : X("", !0),
				l.value ? (K(), q("div", Ul, [
					m[4] ||= J("span", { class: "prefix" }, "assigned to", -1),
					J("span", {
						class: "active-chip",
						"data-author-kind": z($)(l.value).kind,
						title: l.value
					}, [J("span", Gl, M(z($)(l.value).glyph), 1), Y(" " + M(z($)(l.value).label), 1)], 8, Wl),
					J("button", {
						type: "button",
						class: "clear",
						onClick: se,
						"aria-label": "Clear assignee filter"
					}, " clear ✕ ")
				])) : X("", !0),
				u.value && !t.projectName ? (K(), q("div", Kl, [
					m[6] ||= J("span", { class: "prefix" }, "project", -1),
					J("span", {
						class: "active-chip",
						title: `Scoped to project ${u.value}`
					}, [m[5] ||= J("span", { class: "project-glyph" }, "◇", -1), Y(" " + M(u.value), 1)], 8, ql),
					J("button", {
						type: "button",
						class: "clear",
						onClick: le,
						"aria-label": "Clear project filter"
					}, " clear ✕ ")
				])) : X("", !0)
			]),
			J("form", {
				class: "issues-quick-add",
				"data-busy": x.value ? "true" : "false",
				onSubmit: po(N, ["prevent"])
			}, [
				m[7] ||= J("span", {
					class: "quick-add-glyph",
					"aria-hidden": "true"
				}, "+", -1),
				En(J("input", {
					"onUpdate:modelValue": m[1] ||= (e) => b.value = e,
					"data-smoke": "issues-quick-add",
					type: "text",
					autocomplete: "off",
					placeholder: ue.value,
					disabled: x.value,
					onKeydown: ho(ye, ["esc"])
				}, null, 40, Yl), [[oo, b.value]]),
				x.value ? (K(), q("span", Xl, "opening…")) : C.value.defaultLabels.length > 0 ? (K(), q("span", {
					key: 1,
					class: "quick-add-chip tone-teal",
					title: `Labels will be pre-stamped: ${C.value.defaultLabels.join(", ")}`
				}, " labels · " + M(C.value.defaultLabels.join(", ")), 9, Zl)) : X("", !0),
				C.value.closeOnMerge === !1 ? (K(), q("span", Ql, "closeOnMerge · off")) : X("", !0),
				C.value.ownerRefs.length > 0 ? (K(), q("span", {
					key: 3,
					class: "quick-add-chip tone-teal",
					title: `Assigned on create: ${C.value.ownerRefs.join(", ")}`
				}, "→ " + M(C.value.ownerRefs.map((e) => e.split("/").pop()).join(" · ")), 9, $l)) : X("", !0),
				m[8] ||= J("span", { class: "quick-add-hint" }, [
					J("kbd", null, "↵"),
					Y(" create · "),
					J("kbd", null, "esc"),
					Y(" clear · "),
					J("kbd", null, "c"),
					Y(" focus ")
				], -1)
			], 40, Jl),
			S.value ? (K(), q("p", eu, M(S.value), 1)) : X("", !0),
			d.value.size > 0 ? (K(), q("div", tu, [
				J("span", nu, M(d.value.size) + " selected", 1),
				J("button", {
					type: "button",
					class: "bulk-action",
					disabled: f.value,
					onClick: g
				}, M(f.value ? "closing…" : `close ${d.value.size}`), 9, ru),
				J("label", iu, [m[11] ||= J("span", { class: "bulk-reproject-label" }, "reproject →", -1), J("select", {
					class: "bulk-reproject-select",
					"data-smoke": "issues-bulk-reproject",
					disabled: f.value,
					onChange: y
				}, [
					m[9] ||= J("option", {
						value: "",
						disabled: "",
						selected: ""
					}, "pick project…", -1),
					m[10] ||= J("option", { value: "__NONE__" }, "— no project —", -1),
					(K(!0), q(G, null, H(_.value, (e) => (K(), q("option", {
						key: e.name,
						value: e.name ?? ""
					}, "◇ " + M(e.name), 9, ou))), 128))
				], 40, au)]),
				J("button", {
					type: "button",
					class: "bulk-clear",
					disabled: f.value,
					onClick: h
				}, [...m[12] ||= [Y("clear ", -1), J("kbd", null, "esc", -1)]], 8, su),
				m[13] ||= J("span", { class: "hint" }, [J("kbd", null, "space"), Y(" toggle row ")], -1)
			])) : X("", !0),
			p.value ? (K(), q("p", cu, M(p.value), 1)) : X("", !0),
			r.value === "loading" ? (K(), q("p", lu, "Loading issues…")) : r.value === "error" ? (K(), q("p", uu, M(i.value), 1)) : T.value.length === 0 ? (K(), q("p", du, [
				m[14] ||= Y(" No issues yet. ", -1),
				J("a", { href: te.value }, "Create one", 8, fu),
				m[15] ||= Y(" to get started. ", -1)
			])) : A.value.length === 0 ? (K(), q("p", pu, " No issues match the current filter. ")) : (K(), q("ol", mu, [(K(!0), q(G, null, H(A.value, (t, n) => (K(), q("li", {
				key: t.id,
				class: j(["issues-row", {
					focused: n === c.value,
					selected: d.value.has(t.id)
				}]),
				role: "option",
				"aria-selected": n === c.value,
				onMouseenter: (e) => c.value = n
			}, [J("a", {
				href: z(oc)(t),
				class: "issues-row-link"
			}, [
				J("span", _u, "#" + M(t.number), 1),
				J("span", vu, [J("span", yu, M(t.title), 1), J("span", bu, [
					J("span", { class: j(["issue-state", z(cc)(t.state).className]) }, M(z(cc)(t.state).label), 3),
					t.projectName ? (K(), q("button", {
						key: 0,
						type: "button",
						class: j(["issue-project", { active: u.value === t.projectName }]),
						title: `${t.projectName}\nClick to filter by this project`,
						onClick: po((e) => ce(t.projectName), ["prevent", "stop"])
					}, [m[16] ||= J("span", { class: "project-glyph" }, "◇", -1), Y(" " + M(t.projectName), 1)], 10, xu)) : X("", !0),
					(K(!0), q(G, null, H(t.labels ?? [], (t) => (K(), Ai(z(As), {
						key: t,
						name: t,
						catalog: e.labelCatalog
					}, null, 8, ["name", "catalog"]))), 128)),
					(K(!0), q(G, null, H(t.assignees ?? [], (e) => (K(), q("button", {
						key: `assignee-${e}`,
						type: "button",
						class: j(["issue-assignee", { active: l.value === e }]),
						"data-author-kind": z($)(e).kind,
						title: `${e}\nClick to filter by this assignee`,
						onClick: po((t) => oe(e), ["prevent", "stop"])
					}, [J("span", Cu, M(z($)(e).glyph), 1), Y(" " + M(z($)(e).label), 1)], 10, Su))), 128)),
					t.authorRef ? (K(), q("span", {
						key: 1,
						class: "issue-author",
						"data-author-kind": z($)(t.authorRef).kind
					}, [
						J("span", Tu, M(z($)(t.authorRef).glyph), 1),
						Y(" " + M(z($)(t.authorRef).label) + " ", 1),
						z($)(t.authorRef).kind === "agent" ? (K(), q("span", Eu, "agent")) : z($)(t.authorRef).kind === "credential" ? (K(), q("span", Du, "bot")) : z($)(t.authorRef).kind === "bot" ? (K(), q("span", Ou, "bot")) : X("", !0)
					], 8, wu)) : X("", !0)
				])]),
				J("span", ku, M(fe(t.createdAt)), 1)
			], 8, gu)], 42, hu))), 128))])),
			m[17] ||= zi("<footer class=\"issues-foot\" data-v-96e9f064><span data-v-96e9f064><kbd data-v-96e9f064>j</kbd> <kbd data-v-96e9f064>k</kbd> navigate · <kbd data-v-96e9f064>↵</kbd> open · <kbd data-v-96e9f064>/</kbd> search · <kbd data-v-96e9f064>c</kbd> create · <kbd data-v-96e9f064>o</kbd> open <kbd data-v-96e9f064>x</kbd> closed <kbd data-v-96e9f064>a</kbd> all </span></footer>", 1)
		]));
	}
}), [["styles", [".issues-queue[data-v-96e9f064]{font-family:var(--sans,system-ui);color:var(--ink,#111);gap:14px;display:grid}.issues-queue-head[data-v-96e9f064]{gap:12px;display:grid}.head-row[data-v-96e9f064]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.issues-queue-head h2[data-v-96e9f064]{font-family:var(--display,system-ui);margin:0;font-size:22px;line-height:1}.issues-new[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border:1.5px solid var(--ink,#111);padding:6px 12px;font-size:12px;text-decoration:none}.issues-controls[data-v-96e9f064]{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;display:flex}.issues-query-chips[data-v-96e9f064]{font-family:var(--mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;font-size:11px;display:flex}.issues-query-chips .query-chip[data-v-96e9f064]{letter-spacing:.02em;white-space:nowrap;border:1px solid;align-items:center;padding:1px 7px;display:inline-flex}.issues-query-chips .query-chip.tone-is[data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.issues-query-chips .query-chip.tone-assignee[data-v-96e9f064]{color:var(--ink,#111)}.issues-query-chips .query-chip.tone-project[data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issues-query-chips .query-chip.tone-unknown[data-v-96e9f064]{color:var(--accent-yellow,#c89300);border-style:dashed}.issues-query-chips .query-chips-hint[data-v-96e9f064]{color:var(--ink-faint,#68645c);letter-spacing:0;margin-left:4px}.issues-query-chips .query-chips-hint code[data-v-96e9f064]{font-family:var(--mono,monospace);background:var(--paper-tint,#f2efe7);color:var(--ink-soft,#2c2b28);padding:0 4px;font-size:11px}.issues-assignee-filter[data-v-96e9f064]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-items:center;gap:8px;margin-top:8px;padding:6px 10px;font-size:11px;display:inline-flex}.issues-assignee-filter .prefix[data-v-96e9f064]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.issues-assignee-filter .active-chip[data-v-96e9f064]{color:var(--ink,#111);border:1px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.issues-assignee-filter .active-chip[data-author-kind=agent][data-v-96e9f064]{color:#6b3fa0}.issues-assignee-filter .active-chip[data-author-kind=credential][data-v-96e9f064]{color:var(--accent-yellow,#c89300)}.issues-assignee-filter .active-chip[data-author-kind=bot][data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issues-assignee-filter .active-chip[data-author-kind=team][data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.issues-project-filter[data-v-96e9f064]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-items:center;gap:8px;margin-top:8px;padding:6px 10px;font-size:11px;display:inline-flex}.issues-project-filter .prefix[data-v-96e9f064]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.issues-project-filter .active-chip[data-v-96e9f064]{color:var(--accent-blue,#1d55a6);border:1px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.issues-project-filter .project-glyph[data-v-96e9f064]{font-size:10px}.issues-project-filter .clear[data-v-96e9f064]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.issues-project-filter .clear[data-v-96e9f064]:hover{color:var(--ink,#111)}.issues-assignee-filter .author-glyph[data-v-96e9f064]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.issues-assignee-filter .clear[data-v-96e9f064]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.issues-assignee-filter .clear[data-v-96e9f064]:hover{color:var(--ink,#111)}.issues-quick-add[data-v-96e9f064]{border:1.5px solid var(--rule-light,#d8d1c4);background:var(--paper,#fffdf8);align-items:center;gap:8px;padding:6px 10px 6px 6px;transition:border-color .12s;display:flex}.issues-quick-add[data-v-96e9f064]:focus-within{border-color:var(--ink,#111)}.issues-quick-add[data-busy=true][data-v-96e9f064]{opacity:.85;border-style:dashed}.quick-add-glyph[data-v-96e9f064]{width:22px;height:22px;font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border:1px solid;border-radius:2px;place-items:center;font-size:13px;display:inline-grid}.issues-quick-add input[data-v-96e9f064]{min-width:0;color:inherit;font-family:var(--display,system-ui);background:0 0;border:0;outline:none;flex:1;padding:4px 0;font-size:15px}.issues-quick-add input[data-v-96e9f064]::placeholder{color:var(--ink-fainter,#918b80);font-style:italic}.quick-add-status[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.quick-add-chip[data-v-96e9f064]{font-family:var(--mono,monospace);letter-spacing:.02em;white-space:nowrap;border:1px solid;align-items:center;padding:1px 6px;font-size:10.5px;display:inline-flex}.quick-add-chip.tone-teal[data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.quick-add-chip.tone-yellow[data-v-96e9f064]{color:var(--accent-yellow,#c89300)}.quick-add-hint[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-fainter,#918b80);white-space:nowrap;font-size:10.5px}.quick-add-hint kbd[data-v-96e9f064]{font-family:var(--mono,monospace);border:1px solid;padding:0 4px;font-size:10px}.quick-add-error[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--accent-err,#c9341c);margin:-6px 0 0;font-size:11px}.issues-filter-row[data-v-96e9f064]{border:1.5px solid var(--ink,#111);flex-wrap:wrap;gap:4px;display:inline-flex}.issues-filter[data-v-96e9f064]{color:inherit;cursor:pointer;font-family:var(--mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;display:inline-flex}.issues-filter[data-v-96e9f064]:not(:last-child){border-right:1px solid var(--rule-light,#d8d1c4)}.issues-filter.active[data-v-96e9f064]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.issues-filter .count[data-v-96e9f064]{color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums}.issues-filter.active .count[data-v-96e9f064]{color:var(--paper-tint,#f2efe7)}.issues-filter kbd[data-v-96e9f064]{font-family:var(--mono,monospace);opacity:.6;border:1px solid;padding:0 4px;font-size:10px}.issues-search[data-v-96e9f064]{border:1.5px solid var(--ink,#111);flex:240px;align-items:center;gap:8px;min-width:240px;max-width:420px;padding:4px 10px;display:inline-flex}.issues-search input[data-v-96e9f064]{color:inherit;font:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0}.issues-search kbd[data-v-96e9f064]{border:1px solid var(--ink,#111);font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);padding:0 4px;font-size:10px}.muted[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border-top:1.5px solid var(--rule-light,#d8d1c4);padding:18px 0;font-size:13px}.muted.error[data-v-96e9f064]{color:var(--accent-err,#c9341c)}.issues-list[data-v-96e9f064]{border-top:1.5px solid var(--ink,#111);margin:0;padding:0;list-style:none;display:grid}.issues-row[data-v-96e9f064]{border-bottom:1px solid var(--rule-light,#d8d1c4);position:relative}.issues-row.focused[data-v-96e9f064]{background:var(--paper-tint,#f2efe7)}.issues-row.selected[data-v-96e9f064]{background:var(--paper-tint,#f2efe7);box-shadow:inset 3px 0 0 var(--ink,#111)}.issues-row.selected.focused[data-v-96e9f064]{background:var(--paper-tint,#f2efe7);box-shadow:inset 3px 0 0 var(--accent-teal,#087f6f)}.issues-bulk-bar[data-v-96e9f064]{z-index:5;border:1.5px solid var(--ink,#111);background:var(--ink,#111);color:var(--paper,#fffdf8);font-family:var(--mono,monospace);align-items:center;gap:12px;margin:8px 0;padding:8px 12px;font-size:12px;display:flex;position:sticky;top:0}.issues-bulk-bar .count[data-v-96e9f064]{letter-spacing:.02em;font-weight:600}.issues-bulk-bar .bulk-action[data-v-96e9f064]{border:1px solid var(--paper,#fffdf8);color:var(--paper,#fffdf8);font-family:var(--mono,monospace);cursor:pointer;letter-spacing:.02em;text-transform:lowercase;background:0 0;padding:4px 10px;font-size:11px}.issues-bulk-bar .bulk-action[data-v-96e9f064]:hover:not(:disabled){background:var(--paper,#fffdf8);color:var(--ink,#111)}.issues-bulk-bar .bulk-action[data-v-96e9f064]:disabled{opacity:.5;cursor:wait}.issues-bulk-bar .bulk-reproject[data-v-96e9f064]{align-items:center;gap:6px;display:inline-flex}.issues-bulk-bar .bulk-reproject-label[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--paper-tint,#f2efe7);letter-spacing:.04em;font-size:11px}.issues-bulk-bar .bulk-reproject-select[data-v-96e9f064]{border:1px solid var(--paper-tint,#f2efe7);color:var(--paper,#fffdf8);font-family:var(--mono,monospace);cursor:pointer;background:0 0;outline:none;padding:2px 6px;font-size:11px}.issues-bulk-bar .bulk-reproject-select[data-v-96e9f064]:disabled{opacity:.5;cursor:wait}.issues-bulk-bar .bulk-reproject-select option[data-v-96e9f064]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.issues-bulk-bar .bulk-clear[data-v-96e9f064]{color:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 4px;font-size:11px}.issues-bulk-bar .bulk-clear kbd[data-v-96e9f064]{border:1px solid;margin-left:4px;padding:0 4px;font-size:10px}.issues-bulk-bar .hint[data-v-96e9f064]{color:var(--paper-tint,#f2efe7);letter-spacing:.04em;font-size:10.5px}.issues-bulk-bar .hint kbd[data-v-96e9f064]{border:1px solid;padding:0 4px;font-size:10px}.issues-row-link[data-v-96e9f064]{color:inherit;grid-template-columns:56px 1fr auto;align-items:baseline;gap:14px;padding:12px 12px 12px 6px;text-decoration:none;display:grid}.issues-row-link[data-v-96e9f064]:hover{background:var(--paper-tint,#f2efe7);text-decoration:none}.issues-row-number[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);text-align:right;font-variant-numeric:tabular-nums;font-size:12px}.issues-row-body[data-v-96e9f064]{gap:4px;min-width:0;display:grid}.issues-row-title[data-v-96e9f064]{font-family:var(--display,system-ui);text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;overflow:hidden}.issues-row-meta[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);flex-wrap:wrap;align-items:baseline;gap:10px;font-size:12px;display:flex}.issue-state[data-v-96e9f064]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 6px;font-size:11px}.issue-state.issue-state-open[data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.issue-state.issue-state-closed[data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issue-project[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--accent-blue,#1d55a6);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px solid;align-items:center;gap:4px;padding:0 6px;display:inline-flex}.issue-project[data-v-96e9f064]:hover{background:var(--paper-tint,#f2efe7)}.issue-project.active[data-v-96e9f064]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-color:var(--ink,#111)}.issue-project .project-glyph[data-v-96e9f064]{font-size:10px}.issue-label[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--accent-teal,#087f6f);letter-spacing:.02em;border:1px solid;padding:0 5px;font-size:10px}.issue-author[data-v-96e9f064]{font-family:var(--mono,monospace);align-items:center;gap:5px;font-size:12px;display:inline-flex}.issue-author .author-glyph[data-v-96e9f064]{width:14px;height:14px;color:var(--ink-faint,#68645c);border:1px solid;place-items:center;font-size:10px;font-weight:700;display:inline-grid}.issue-author[data-author-kind=agent][data-v-96e9f064]{color:#6b3fa0}.issue-author[data-author-kind=credential][data-v-96e9f064]{color:var(--accent-yellow,#c89300)}.issue-author[data-author-kind=bot][data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issue-author .author-badge[data-v-96e9f064]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.issue-assignee[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px dashed;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.issue-assignee[data-v-96e9f064]:hover{background:var(--paper-tint,#f2efe7)}.issue-assignee.active[data-v-96e9f064]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-color:var(--ink,#111)}.issue-assignee.active .author-glyph[data-v-96e9f064]{color:inherit}.issue-assignee .author-glyph[data-v-96e9f064]{width:12px;height:12px;color:inherit;border:0;place-items:center;font-size:9px;font-weight:700;display:inline-grid}.issue-assignee[data-author-kind=agent][data-v-96e9f064]{color:#6b3fa0}.issue-assignee[data-author-kind=credential][data-v-96e9f064]{color:var(--accent-yellow,#c89300)}.issue-assignee[data-author-kind=bot][data-v-96e9f064]{color:var(--accent-blue,#1d55a6)}.issue-assignee[data-author-kind=team][data-v-96e9f064]{color:var(--accent-teal,#087f6f)}.issues-row-age[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);white-space:nowrap;font-size:12px}.issues-foot[data-v-96e9f064]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.issues-foot kbd[data-v-96e9f064]{font-family:var(--mono,monospace);border:1px solid;padding:0 4px;font-size:10px}"]], ["__scopeId", "data-v-96e9f064"]]), ju = /* @__PURE__ */ new Map();
function Mu(e) {
	return [
		e.id,
		e.number,
		e.title,
		e.state
	].join("|");
}
function Nu(e, t) {
	let n = [];
	return n.push(ss({
		id: `ext_issues.open.${e.id}`,
		title: `Open issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: () => {
			window.location.href = oc(e);
		}
	})), e.state === "OPEN" || e.state === "REOPENED" ? n.push(ss({
		id: `ext_issues.close.${e.id}`,
		title: `Close issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: async () => {
			await Ys(t, e.id);
		}
	})) : e.state === "CLOSED" && n.push(ss({
		id: `ext_issues.reopen.${e.id}`,
		title: `Reopen issue #${e.number} — ${e.title}`,
		category: "Issues",
		extensionId: "ext_issues",
		run: async () => {
			await Xs(t, e.id);
		}
	})), () => n.forEach((e) => e());
}
async function Pu(e, t) {
	let n;
	try {
		n = await Gs(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_issues] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = Mu(t), i = ju.get(t.id);
		i && i.signature === n || (i?.unregister(), ju.set(t.id, {
			signature: n,
			unregister: Nu(t, e)
		}));
	}
	for (let [e, t] of ju) r.has(e) || (t.unregister(), ju.delete(e));
}
function Fu(e) {
	let t = rc;
	Pu(e, t);
	let n = [
		"dev.comtrya.issues.opened",
		"dev.comtrya.issues.closed",
		"dev.comtrya.issues.reopened"
	].map((n) => Lo({
		type: n,
		onEvent: () => {
			Pu(e, t);
		},
		onError: () => {}
	}));
	return () => {
		for (let e of n) e();
		for (let e of ju.values()) e.unregister();
		ju.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_issues/ui/src/register.ts
var Iu = "ext_issues", Lu = "comtrya-issue-card", Ru = "comtrya-issues-list", zu = "comtrya-issues-repo-list", Bu = "comtrya-issue-detail", Vu = "comtrya-issue-relationships", Hu = "comtrya-issue-new";
js({
	tagName: Lu,
	component: Cc,
	propertyAliases: { ref: "resourceRef" }
}), js({
	tagName: Ru,
	component: Au
}), js({
	tagName: zu,
	component: Au
}), js({
	tagName: Bu,
	component: hl
}), js({
	tagName: Vu,
	component: jl
}), Wu();
var Uu = {
	id: Iu,
	setup(e) {
		e.registerCard({
			resourceKind: "issue",
			element: Lu,
			requiredPermission: "issues.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "issue",
			loadTargets: async (t) => (await Gs(e.client, {
				workspaceId: t.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
				repositoryId: t.repositoryId
			})).map((e) => ({
				ref: ic(e),
				kind: "issue",
				title: `#${e.number} ${e.title}`,
				subtitle: e.state.toLowerCase()
			}))
		}), e.registerWidget({
			id: "issues-list",
			element: Ru,
			defaultSlot: "repository.main",
			defaultPriority: 100,
			requiredPermission: "issues.read"
		}), e.registerRoute("/", {
			element: Ru,
			requiredPermission: "issues.read"
		}), e.registerRoute("/new", {
			element: Hu,
			requiredPermission: "issues.write"
		}), e.registerRoute("/:workspaceId/:number", {
			element: Bu,
			requiredPermission: "issues.read"
		}), Fu(e.client);
	}
};
function Wu() {
	if (typeof customElements > "u" || customElements.get(Hu)) return;
	class e extends HTMLElement {
		routeParams;
		workspaceId;
		repositoryId;
		connectedCallback() {
			this.replaceChildren(Ku(Gu(this.routeParams, this)));
		}
	}
	customElements.define(Hu, e);
}
function Gu(e, t = {}) {
	let n = new URLSearchParams(window.location.search);
	return {
		workspaceId: n.get("workspaceId") ?? t.workspaceId ?? e?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
		repositoryId: n.get("repositoryId") ?? t.repositoryId ?? e?.params?.repositoryId ?? null,
		projectName: n.get("projectName") ?? t.projectName ?? e?.params?.projectName ?? null
	};
}
function Ku(e) {
	Xu();
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
	let o = qu("Title"), s = document.createElement("input");
	s.required = !0, s.placeholder = "What needs to be done?", o.append(s);
	let c = qu("Project", "Stamps the Project on this issue and pulls its CUE policy."), l = document.createElement("select");
	l.className = "issue-new-project-select", l.dataset.smoke = "issue-new-project";
	let u = document.createElement("option");
	u.value = "", u.textContent = "— no project —", l.append(u), c.append(l);
	let d = qu("Description", "Optional. Supports Markdown."), f = document.createElement("textarea");
	f.rows = 6, f.placeholder = "Add context, repro steps, links…", d.append(f);
	let p = qu("Labels"), m = document.createElement("input");
	m.placeholder = "comma-separated", m.dataset.smoke = "issue-new-labels", p.append(m);
	let h = document.createElement("p");
	h.className = "issue-new-hint", h.hidden = !0, p.append(h);
	let g = document.createElement("div");
	g.className = "issue-new-policy", g.hidden = !0, g.dataset.smoke = "issue-new-policy";
	let _ = null, v = [];
	function y(e) {
		if (!e) {
			v.length > 0 && m.value.trim() && (m.value = Zu(m.value).filter((e) => !v.includes(e)).join(", ")), v = [], h.hidden = !0, h.textContent = "", g.hidden = !0, g.replaceChildren(), _ = null, r.textContent = "Issue";
			return;
		}
		r.textContent = `${e} · issue`, Oc(e, "referrer").then((t) => {
			let n = Zu(m.value).filter((e) => !v.includes(e)), r = [], i = /* @__PURE__ */ new Set();
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
	Ts().then((t) => {
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
		t.preventDefault(), x.disabled = !0, S.hidden = !0, Js({
			workspaceId: e.workspaceId,
			repositoryId: e.repositoryId,
			projectName: l.value || null,
			title: s.value.trim(),
			bodyMarkdown: f.value,
			labels: Zu(m.value),
			closeOnMerge: _
		}).then((e) => {
			window.location.assign(oc(e));
		}).catch((e) => {
			S.textContent = e instanceof Error ? e.message : String(e), S.hidden = !1, x.disabled = !1;
		});
	}), t.append(n, a), t;
}
function qu(e, t) {
	let n = document.createElement("div");
	n.className = "issue-new-field";
	let r = document.createElement("label");
	if (r.className = "issue-new-label", r.textContent = e, n.append(r), t) {
		let e = document.createElement("span");
		e.className = "issue-new-hint", e.textContent = t, n.append(e);
	}
	return n;
}
var Ju = "comtrya-issue-new-styles", Yu = "\n.issue-new {\n  display: grid;\n  gap: 24px;\n  max-width: 720px;\n  font-family: var(--sans, system-ui);\n  color: var(--ink, #111);\n}\n.issue-new-head {\n  display: grid;\n  gap: 6px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 14px;\n}\n.issue-new-overline {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #68645c);\n}\n.issue-new h1 {\n  margin: 0;\n  font-family: var(--display, system-ui);\n  font-size: 36px;\n  line-height: 1;\n}\n.issue-new-form {\n  display: grid;\n  gap: 18px;\n}\n.issue-new-field {\n  display: grid;\n  gap: 6px;\n}\n.issue-new-label {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #68645c);\n}\n.issue-new-hint {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-fainter, #918b80);\n}\n.issue-new input,\n.issue-new textarea,\n.issue-new select {\n  width: 100%;\n  border: 1.5px solid var(--rule-light, #d8d1c4);\n  background: var(--paper, #fffdf8);\n  color: var(--ink, #111);\n  padding: 10px 12px;\n  font-family: var(--mono, monospace);\n  font-size: 13px;\n  outline: none;\n  transition: border-color 120ms ease;\n}\n.issue-new input:focus,\n.issue-new textarea:focus,\n.issue-new select:focus {\n  border-color: var(--ink, #111);\n}\n.issue-new textarea {\n  resize: vertical;\n  font-family: var(--mono, monospace);\n}\n.issue-new-policy {\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  flex-wrap: wrap;\n  border: 1px dashed var(--rule-light, #d8d1c4);\n  padding: 8px 12px;\n  background: var(--paper-tint, #f2efe7);\n}\n.issue-new-chip {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  border: 1px solid currentColor;\n  padding: 1px 6px;\n}\n.issue-new-chip.chip-on {\n  color: var(--accent-teal, #087f6f);\n}\n.issue-new-chip.chip-off {\n  color: var(--accent-yellow, #c89300);\n}\n.issue-new-chip-detail {\n  font-family: var(--sans, system-ui);\n  font-size: 12px;\n  color: var(--ink-soft, #2c2b28);\n}\n.issue-new-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding-top: 4px;\n}\n.issue-new-submit {\n  border: 1.5px solid var(--ink, #111);\n  background: var(--ink, #111);\n  color: var(--paper, #fffdf8);\n  padding: 10px 18px;\n  font-family: var(--display, system-ui);\n  font-weight: 600;\n  font-size: 13px;\n  cursor: pointer;\n}\n.issue-new-submit:disabled {\n  background: var(--ink-faint, #68645c);\n  cursor: wait;\n}\n.issue-new-error {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--accent-err, #c9341c);\n}\n";
function Xu() {
	if (typeof document > "u" || document.getElementById(Ju)) return;
	let e = document.createElement("style");
	e.id = Ju, e.textContent = Yu, document.head.appendChild(e);
}
function Zu(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e.split(",")) {
		let e = r.trim();
		e && (t.has(e) || (t.add(e), n.push(e)));
	}
	return n;
}
//#endregion
export { Uu as default };
