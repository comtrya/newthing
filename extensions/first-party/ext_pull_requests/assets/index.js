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
		this.flags |= 2, Ue(this), Pe(this);
		let e = M, t = N;
		M = this, N = !0;
		try {
			return this.fn();
		} finally {
			Fe(this), M = e, N = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) Re(e);
			this.deps = this.depsTail = void 0, Ue(this), this.onStop && this.onStop(), this.flags &= -2;
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
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === We) || (e.globalVersion = We, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Ie(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = M, r = N;
	M = e, N = !0;
	try {
		Pe(e);
		let n = e.fn(e._value);
		(t.version === 0 || D(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		M = n, N = r, Fe(e), e.flags &= -3;
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
var N = !0, Be = [];
function Ve() {
	Be.push(N), N = !1;
}
function He() {
	let e = Be.pop();
	N = e === void 0 ? !0 : e;
}
function Ue(e) {
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
var We = 0, Ge = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, Ke = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!M || !N || M === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== M) t = this.activeLink = new Ge(M, this), M.deps ? (t.prevDep = M.depsTail, M.depsTail.nextDep = t, M.depsTail = t) : M.deps = M.depsTail = t, qe(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = M.depsTail, t.nextDep = void 0, M.depsTail.nextDep = t, M.depsTail = t, M.deps === t && (M.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, We++, this.notify(e);
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
function P(e, t, n) {
	if (N && M) {
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
	if (Me(), t === "clear") o.forEach(s);
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
	Ne();
}
function $e(e) {
	let t = /* @__PURE__ */ I(e);
	return t === e ? t : (P(t, "iterate", Ze), /* @__PURE__ */ F(e) ? t : t.map(Vt));
}
function et(e) {
	return P(e = /* @__PURE__ */ I(e), "iterate", Ze), e;
}
function tt(e, t) {
	return /* @__PURE__ */ Rt(e) ? Ht(/* @__PURE__ */ Lt(e) ? Vt(t) : t) : Vt(t);
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
	return r !== e && !/* @__PURE__ */ F(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var it = Array.prototype;
function at(e, t, n, r, i, a) {
	let o = et(e), s = o !== e && !/* @__PURE__ */ F(e), c = o[t];
	if (c !== it[t]) {
		let t = c.apply(e, a);
		return s ? Vt(t) : t;
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
	let i = et(e), a = i !== e && !/* @__PURE__ */ F(e), o = n, s = !1;
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
	P(r, "iterate", Ze);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ zt(n[0]) ? (n[0] = /* @__PURE__ */ I(n[0]), r[t](...n)) : i;
}
function ct(e, t, n = []) {
	Ve(), Me();
	let r = (/* @__PURE__ */ I(e))[t].apply(e, n);
	return Ne(), He(), r;
}
var lt = /* @__PURE__ */ e("__proto__,__v_isRef,__isVue"), ut = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(_));
function dt(e) {
	_(e) || (e = String(e));
	let t = /* @__PURE__ */ I(this);
	return P(t, "has", e), t.hasOwnProperty(e);
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
		if ((_(t) ? ut.has(t) : lt(t)) || (r || P(e, "get", t), i)) return o;
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
			if (!/* @__PURE__ */ F(n) && !/* @__PURE__ */ Rt(n) && (i = /* @__PURE__ */ I(i), n = /* @__PURE__ */ I(n)), !a && /* @__PURE__ */ L(i) && !/* @__PURE__ */ L(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : u(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ L(e) ? e : r);
		return e === /* @__PURE__ */ I(r) && (o ? D(n, i) && Qe(e, "set", t, n, i) : Qe(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = u(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && Qe(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!_(t) || !ut.has(t)) && P(e, "has", t), n;
	}
	ownKeys(e) {
		return P(e, "iterate", d(e) ? "length" : Ye), Reflect.ownKeys(e);
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
		let i = this.__v_raw, a = /* @__PURE__ */ I(i), o = f(a), c = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, u = i[e](...r), d = n ? vt : t ? Ht : Vt;
		return !t && P(a, "iterate", l ? Xe : Ye), s(Object.create(u), { next() {
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
			e || (D(n, a) && P(i, "get", n), P(i, "get", a));
			let { has: o } = yt(i), s = t ? vt : e ? Ht : Vt;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && P(/* @__PURE__ */ I(t), "iterate", Ye), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ I(n), i = /* @__PURE__ */ I(t);
			return e || (D(t, i) && P(r, "has", t), P(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ I(a), s = t ? vt : e ? Ht : Vt;
			return !e && P(o, "iterate", Ye), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return s(n, e ? {
		add: xt("add"),
		set: xt("set"),
		delete: xt("delete"),
		clear: xt("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ I(this), r = yt(n), i = /* @__PURE__ */ I(e), a = !t && !/* @__PURE__ */ F(e) && !/* @__PURE__ */ Rt(e) ? i : e;
			return r.has.call(n, a) || D(e, a) && r.has.call(n, e) || D(i, a) && r.has.call(n, i) || (n.add(a), Qe(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ F(n) && !/* @__PURE__ */ Rt(n) && (n = /* @__PURE__ */ I(n));
			let r = /* @__PURE__ */ I(this), { has: i, get: a } = yt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ I(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? D(n, s) && Qe(r, "set", e, n, s) : Qe(r, "add", e, n), this;
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
function F(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function zt(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function I(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ I(t) : e;
}
function Bt(e) {
	return !u(e, "__v_skip") && Object.isExtensible(e) && O(e, "__v_skip", !0), e;
}
var Vt = (e) => v(e) ? /* @__PURE__ */ Nt(e) : e, Ht = (e) => v(e) ? /* @__PURE__ */ Ft(e) : e;
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
		this.dep = new Ke(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ I(e), this._value = t ? e : Vt(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ F(e) || /* @__PURE__ */ Rt(e);
		e = n ? e : /* @__PURE__ */ I(e), D(e, t) && (this._rawValue = e, this._value = n ? e : Vt(e), this.dep.trigger());
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
	return /* @__PURE__ */ Lt(e) ? e : new Proxy(e, Gt);
}
var qt = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new Ke(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = We - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
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
	let { immediate: a, deep: o, once: s, scheduler: l, augmentJob: u, call: f } = i, p = (e) => o ? e : /* @__PURE__ */ F(e) || o === !1 || o === 0 ? en(e, 1) : en(e), m, g, _, v, y = !1, b = !1;
	if (/* @__PURE__ */ L(e) ? (g = () => e.value, y = /* @__PURE__ */ F(e)) : /* @__PURE__ */ Lt(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some((e) => /* @__PURE__ */ Lt(e) || /* @__PURE__ */ F(e)), g = () => e.map((e) => {
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
			Ve(), tn(o, null, 10, [
				e,
				i,
				a
			]), He();
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
	if (V === null) return e;
	let r = sa(V), i = e.dirs ||= [];
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
		c && (Ve(), nn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), He());
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
function H(e, t, n) {
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
	u.call = (e, t, n) => nn(e, p, t, n);
	let m = !1;
	c === "post" ? u.scheduler = (e) => {
		W(e, p && p.suspense);
	} : c !== "sync" && (m = !0, u.scheduler = (e, t) => {
		t ? e() : mn(e);
	}), u.augmentJob = (e) => {
		n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p));
	};
	let h = $t(e, n, u);
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
	let s = a.shapeFlag & 4 ? sa(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ I(v), b = v === t ? i : (e) => zn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && zn(_, t));
	if (m != null && m !== p) {
		if (Hn(n), g(m)) _[m] = null, b(m) && (v[m] = null);
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
					i(), Bn.delete(e);
				};
				t.id = -1, Bn.set(e, t), W(t, r);
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
			Ve();
			let i = Yi(n), a = nn(t, n, e, r);
			return i(), He(), a;
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
		let n = o && /* @__PURE__ */ Lt(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ F(e), s = /* @__PURE__ */ Rt(e), e = et(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Ht(Vt(e[n])) : Vt(e[n]) : e[n], n, void 0, a && a[n]);
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
		if (d) return n === "$attrs" && P(e.attrs, "get", ""), d(e);
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
		v(t) && (e.data = /* @__PURE__ */ Nt(t));
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
	nn(d(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function vr(e, t, n, r) {
	let i = r.includes(".") ? Mn(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && H(i, n);
	} else if (h(e)) H(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => vr(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && H(i, r, e);
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
function U(e, t) {
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
	for (let r in t) n[r] = U(e[r], t[r]);
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
					let u = l._ceVNode || X(n, r);
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, sa(u.component);
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
	!l && o && (l = i[c = ae(E(n))]), l && nn(l, e, 6, a);
	let u = i[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, nn(u, e, 6, a);
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
		Ci.length = 0, rn(t, e, 1), v = X(xi);
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
	return n === "style" && v(r) && v(i) ? !be(r, i) : r !== i;
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
	n ? e.props = r ? i : /* @__PURE__ */ Pt(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Jr(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ I(i), [c] = e.propsOptions, l = !1;
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
	l && Qe(e.attrs, "set", "");
}
function Yr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (ee(t)) continue;
		let l = n[t], d;
		a && u(a, d = T(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : Ir(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ I(r), i = c || t;
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
}, W = yi;
function ci(e) {
	return li(e);
}
function li(e, i) {
	let a = ue();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Ai(e, t) && (r = ye(e), he(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
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
			case G:
				ae(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? D(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, A);
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
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && W(() => {
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
		((g = h.onVnodeUpdated) || f) && W(() => {
			g && Hi(g, r, n, e), f && Tn(n, e, r, "updated");
		}, i);
	}, E = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === G || !Ai(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
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
		if (Wn(e) && (s.ctx.renderer = A), $i(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, ce, o), !e.el) {
				let r = s.subTree = X(xi);
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
							W(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				di(e, !1), t ? (t.el = c.el, le(e, t, o)) : t = c, n && oe(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Hi(d, s, t, c), di(e, !0);
				let f = Lr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ye(p), e, i, a), t.el = f.el, u === null && Ur(e, f.el), r && W(r, i), (d = t.props && t.props.onVnodeUpdated) && W(() => Hi(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Un(t);
				if (di(e, !1), l && oe(l), !m && (o = c && c.onVnodeBeforeMount) && Hi(o, d, t), di(e, !0), s && Ce) {
					let t = () => {
						e.subTree = Lr(e), Ce(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Lr(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && W(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					W(() => Hi(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Un(d.vnode) && d.vnode.shapeFlag & 256) && e.a && W(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new De(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => mn(u), di(e, !0), l();
	}, le = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Jr(e, t.props, r, n), si(e, t.children, n), Ve(), _n(e), He();
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
			let n = t[p] = l ? zi(t[p]) : Ri(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? ve(e, a, o, !0, !1, f) : T(t, r, i, a, o, s, c, l, f);
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
			c.move(e, t, n, A);
			return;
		}
		if (c === G) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) me(u[e], t, n, r);
			o(e.anchor, t, n);
			return;
		}
		if (c === Si) {
			S(e, t, n);
			return;
		}
		if (r !== 2 && d & 1 && l) if (r === 0) l.beforeEnter(a), o(a, t, n), W(() => l.enter(a), i);
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
		if (d === -2 && (i = !1), s != null && (Ve(), Vn(s, null, n, e, !0), He()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Un(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Hi(_, t, e), u & 6) _e(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && Tn(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, A, r) : l && !l.hasOnce && (a !== G || d > 0 && d & 64) ? ve(l, t, n, !1, !0) : (a === G && d & 384 || !i && u & 16) && ve(c, t, n), r && k(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && W(() => {
			_ && Hi(_, t, e), h && Tn(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, k = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === G) {
			ge(n, r);
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
	}, ge = (e, t) => {
		let n;
		for (; e !== t;) n = h(e), s(e), e = n;
		s(t);
	}, _e = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		gi(c), gi(l), r && oe(r), i.stop(), a && (a.flags |= 8, he(o, e, t, n)), s && W(s, t), W(() => {
			e.isUnmounted = !0;
		}, t);
	}, ve = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) he(e[o], t, n, r, i);
	}, ye = (e) => {
		if (e.shapeFlag & 6) return ye(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[Nn];
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
		createApp: Ar(xe, Se)
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
var G = /* @__PURE__ */ Symbol.for("v-fgt"), bi = /* @__PURE__ */ Symbol.for("v-txt"), xi = /* @__PURE__ */ Symbol.for("v-cmt"), Si = /* @__PURE__ */ Symbol.for("v-stc"), Ci = [], K = null;
function q(e = !1) {
	Ci.push(K = e ? null : []);
}
function wi() {
	Ci.pop(), K = Ci[Ci.length - 1] || null;
}
var Ti = 1;
function Ei(e, t = !1) {
	Ti += e, e < 0 && K && t && (K.hasOnce = !0);
}
function Di(e) {
	return e.dynamicChildren = Ti > 0 ? K || n : null, wi(), Ti > 0 && K && K.push(e), e;
}
function J(e, t, n, r, i, a) {
	return Di(Y(e, t, n, r, i, a, !0));
}
function Oi(e, t, n, r, i) {
	return Di(X(e, t, n, r, i, !0));
}
function ki(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function Ai(e, t) {
	return e.type === t.type && e.key === t.key;
}
var ji = ({ key: e }) => e ?? null, Mi = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ L(e) || h(e) ? {
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
		ctx: V
	};
	return s ? (Bi(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Ti > 0 && !o && K && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && K.push(c), c;
}
var X = Ni;
function Ni(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === sr) && (e = xi), ki(e)) {
		let r = Fi(e, t, !0);
		return n && Bi(r, n), Ti > 0 && !a && K && (r.shapeFlag & 6 ? K[K.indexOf(e)] = r : K.push(r)), r.patchFlag = -2, r;
	}
	if (ca(e) && (e = e.__vccOpts), t) {
		t = Pi(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = k(e)), v(n) && (/* @__PURE__ */ zt(n) && !d(n) && (n = s({}, n)), t.style = de(n));
	}
	let o = g(e) ? 1 : vi(e) ? 128 : Pn(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return Y(e, t, n, r, i, o, a, !0);
}
function Pi(e) {
	return e ? /* @__PURE__ */ zt(e) || Kr(e) ? s({}, e) : e : null;
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
		patchFlag: t && e.type !== G ? o === -1 ? 16 : o | 16 : o,
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
function Z(e = " ", t = 0) {
	return X(bi, null, e, t);
}
function Ii(e, t) {
	let n = X(Si, null, e);
	return n.staticCount = t, n;
}
function Li(e = "", t = !1) {
	return t ? (q(), Oi(xi, null, e)) : X(xi, null, e);
}
function Ri(e) {
	return e == null || typeof e == "boolean" ? X(xi) : d(e) ? X(G, null, e.slice()) : ki(e) ? zi(e) : X(bi, null, String(e));
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
		!r && !Kr(t) ? t._ctx = V : r === 3 && V && (V.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: V
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Z(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Vi(...e) {
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
function Hi(e, t, n, r = null) {
	nn(e, t, 7, [n, r]);
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
var Q = null, Ki = () => Q || V, qi, Ji;
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
		Ve();
		let n = e.setupContext = r.length > 1 ? oa(e) : null, i = Yi(e), a = tn(r, e, 0, [e.props, n]), o = y(a);
		if (He(), i(), (o || e.sp) && !Un(e) && Rn(e), o) {
			if (a.then(Xi, Xi), t) return a.then((n) => {
				ta(e, n, t);
			}).catch((t) => {
				rn(t, e, 0);
			});
			e.asyncDep = a;
		} else ta(e, a, t);
	} else ia(e, t);
}
function ta(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = Kt(t)), ia(e, n);
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
		Ve();
		try {
			hr(e);
		} finally {
			He(), t();
		}
	}
}
var aa = { get(e, t) {
	return P(e, "get", ""), e[t];
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
	return e.exposed ? e.exposeProxy ||= new Proxy(Kt(Bt(e.exposed)), {
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
var $ = (e, t) => /* @__PURE__ */ Jt(e, t, Qi), la = "3.5.34", ua = void 0, da = typeof window < "u" && window.trustedTypes;
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
function Ma(e, t, n, r, i, a = _e(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(ja, t.slice(6, t.length)) : e.setAttributeNS(ja, t, n) : n == null || a && !ve(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
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
		r === "boolean" ? n = ve(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
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
		nn(Wa(e, n.value), t, 5, [e]);
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
	constructor(e, t = {}, n = ho) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== ho ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._app && (e.appContext = this._app._context), mo(e, this._root);
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
};
function eo(e) {
	e.target.composing = !0;
}
function to(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var no = /* @__PURE__ */ Symbol("_assign");
function ro(e, t, n) {
	return t && (e = e.trim()), n && (e = se(e)), e;
}
var io = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e[no] = $a(i);
		let a = r || i.props && i.props.type === "number";
		Pa(e, t ? "change" : "input", (t) => {
			t.target.composing || e[no](ro(e.value, n, a));
		}), (n || a) && Pa(e, "change", () => {
			e.value = ro(e.value, n, a);
		}), t || (Pa(e, "compositionstart", eo), Pa(e, "compositionend", to), Pa(e, "change", to));
	},
	mounted(e, { value: t }) {
		e.value = t ?? "";
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[no] = $a(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? se(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, ao = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], oo = {
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
	exact: (e, t) => ao.some((n) => e[`${n}Key`] && !t.includes(n))
}, so = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = oo[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, co = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, lo = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = E(n.key);
		if (t.some((e) => e === r || co[e] === r)) return e(n);
	}));
}, uo = /* @__PURE__ */ s({ patchProp: Ka }, _a), fo;
function po() {
	return fo ||= ci(uo);
}
var mo = ((...e) => {
	po().render(...e);
}), ho = ((...e) => {
	let t = po().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = _o(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, go(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function go(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function _o(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/runtime.ts
async function vo(e, t, n, r, i = {}) {
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
			let r = bo(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: yo(n?.code) ?? r,
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
function yo(e) {
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
function bo(e) {
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
var xo = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, So;
function Co() {
	return So ||= wo(xo), So;
}
function wo(e) {
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
var To = Symbol.for("comtrya.relationship-registry");
Eo();
function Eo() {
	let e = globalThis;
	return e[To] ??= {
		types: /* @__PURE__ */ new Map(),
		providers: /* @__PURE__ */ new Map(),
		subscribers: /* @__PURE__ */ new Set()
	}, e[To];
}
//#endregion
//#region packages/sdk-core/src/route-registry.ts
function Do(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`;
	return `/x/${e}${n === "/" ? "" : n.replace(/\/+$/, "")}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function Oo(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return ko(t, e, n.signal), () => n.abort();
}
async function ko(e, t, n) {
	try {
		let r = await Ao(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: jo(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await Mo(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function Ao(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: jo(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function jo(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function Mo(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		No(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) Po(e, t);
	}
	a += i.decode(), No(a, t);
}
function No(e, t) {
	for (let n of e.split("\n\n")) Po(n, t);
}
function Po(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = Fo(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function Fo(e, t) {
	let n = Io(e) ? e : {}, r = Io(n.data) ? n.data : {}, i = Lo(r.eventType) ?? Lo(n.type) ?? t ?? "";
	return {
		id: Lo(r.id) ?? Lo(n.id) ?? "",
		eventType: i,
		payloadB64: Lo(r.payloadB64) ?? "",
		timestampMs: Ro(r.timestampMs) ?? zo(Ro(n.time)) ?? Date.now(),
		sourceUri: Lo(r.sourceUri) ?? Lo(n.source) ?? "",
		emitterExtension: Lo(r.emitterExtension) ?? Lo(r.extensionId) ?? Lo(n.source) ?? "",
		raw: e
	};
}
function Io(e) {
	return typeof e == "object" && !!e;
}
function Lo(e) {
	return typeof e == "string" ? e : void 0;
}
function Ro(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function zo(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var Bo = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], Vo = typeof navigator == "object" ? navigator.platform : "", Ho = /Mac|iPod|iPhone|iPad/.test(Vo), Uo = Ho ? "Meta" : "Control", Wo = Vo === "Win32" ? ["Control", "Alt"] : Ho ? ["Alt"] : [];
function Go(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || Wo.includes(t) && e.getModifierState("AltGraph"));
}
function Ko(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? Uo : e;
		}), n];
	});
}
function qo(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !Go(e, t);
	}) || Bo.find(function(t) {
		return !n.includes(t) && r !== t && Go(e, t);
	}));
}
function Jo(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [Ko(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			qo(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : Go(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function Yo(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = Jo(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var Xo = /* @__PURE__ */ new Map(), Zo = /* @__PURE__ */ new Set();
function Qo(e) {
	Xo.set(e.id, e);
	for (let e of Zo) e();
	return () => {
		Xo.delete(e.id);
		for (let e of Zo) e();
	};
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function $o(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function es(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function ts(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (es(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			$o(e.target) || r(e);
		};
	}
	return t;
}
function ns(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = ts(e), i = () => {
		n ||= Yo(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? H(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), nr(a);
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function rs(e) {
	is(e.tagName, e.component);
	let t = /* @__PURE__ */ Xa(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(os(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function is(e, t) {
	if (typeof document > "u") return;
	let n = as(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function as(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function os(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
var ss = "ext_pull_requests", cs = "pulls";
function ls(e, t) {
	return t ? `comtrya://workspace/${e}/repository/${t}` : `comtrya://workspace/${e}`;
}
function us(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function ds(e) {
	switch ((typeof e == "string" ? e : e && typeof e == "object" && typeof e.tag == "string" ? e.tag : "").toLowerCase()) {
		case "draft": return "DRAFT";
		case "merged": return "MERGED";
		case "closed": return "CLOSED";
		default: return "READY";
	}
}
function fs(e) {
	return {
		id: e.id,
		repository: e.repository,
		workspace: e.workspace ?? null,
		number: e.number,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: ds(e.state),
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
async function ps(e) {
	return us(await vo(ss, cs, "list-pulls", {
		repository: ls(e.workspaceId, e.repositoryId),
		limit: e.limit ?? 256
	}), "list-pulls").map(fs);
}
async function ms(e) {
	let t = us(await vo(ss, cs, "get-pull", e), "get-pull");
	return t ? fs(t) : null;
}
async function hs(e, t) {
	return fs(us(await vo(ss, cs, "merge-pull", {
		id: e,
		mergedByRef: t ?? null
	}), "merge-pull"));
}
async function gs(e, t) {
	return fs(us(await vo(ss, cs, "close-pull", {
		id: e,
		closedByRef: t ?? null
	}), "close-pull"));
}
function _s(e) {
	switch ((typeof e == "string" ? e : e && typeof e == "object" && typeof e.tag == "string" ? e.tag : "").toLowerCase()) {
		case "closed": return "CLOSED";
		case "reopened": return "REOPENED";
		default: return "OPEN";
	}
}
async function vs(e) {
	if (!e) return [];
	let t = `comtrya://pull_request/${e}`, n = (await Co().query("query LinkedIssues($from: ResourceURN!, $kind: ResourceURN) {\n      relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n    }", {
		from: t,
		kind: "comtrya://rel/com.comtrya.pulls/closes"
	})).relations?.outgoing ?? [], r = Array.from(new Set(n.map((e) => e.to ?? e.target ?? "").filter((e) => e.startsWith("comtrya://issue/"))));
	return (await Promise.all(r.map(ys))).filter((e) => e !== null);
}
async function ys(e) {
	let t = await vo("ext_issues", "issues", "by-ref-issue", e);
	if (!t.ok) return null;
	let n = t.value;
	return !n || typeof n != "object" ? null : {
		id: typeof n.id == "string" ? n.id : "",
		number: typeof n.number == "number" ? n.number : null,
		title: typeof n.title == "string" ? n.title : "(untitled)",
		state: _s(n.state),
		uri: e
	};
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/types.ts
var bs = "pulls";
function xs() {
	return Do(bs, "/");
}
function Ss(e) {
	return Do(bs, `/${e.id}`);
}
function Cs(e) {
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
function ws(e) {
	if (!e) return "";
	let t = Date.parse(e);
	if (Number.isNaN(t)) return e;
	let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
	return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
}
function Ts(e) {
	return e ? (e.split("/").pop() ?? e) || e : "unknown";
}
function Es(e) {
	if (!e) return {
		kind: "unknown",
		label: "unknown",
		glyph: "·",
		tone: "neutral"
	};
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || Ts(e);
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
	return t.push(Qo({
		id: `ext_pull_requests.open.${e.id}`,
		title: `Open PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: () => {
			window.location.href = Ss(e);
		}
	})), (e.state === "READY" || e.state === "DRAFT") && t.push(Qo({
		id: `ext_pull_requests.merge.${e.id}`,
		title: `Merge PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: async () => {
			await hs(e.id);
		}
	})), e.state !== "CLOSED" && e.state !== "MERGED" && t.push(Qo({
		id: `ext_pull_requests.close.${e.id}`,
		title: `Close PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: async () => {
			await gs(e.id);
		}
	})), () => t.forEach((e) => e());
}
async function js(e) {
	let t;
	try {
		t = await ps({ workspaceId: e });
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
	].map((t) => Oo({
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
}, sc = { class: "diff-hunk-head" }, cc = { class: "ln old" }, lc = { class: "ln new" }, uc = { class: "marker" }, dc = { class: "content" }, fc = /* @__PURE__ */ Ln({
	__name: "DiffView",
	props: {
		patch: { type: String },
		loading: { type: Boolean },
		error: { type: [String, null] }
	},
	setup(e) {
		Vs();
		let t = e, n = /* @__PURE__ */ R({}), r = /* @__PURE__ */ R(0), i = $(() => Fs(t.patch)), a = $(() => Rs(i.value));
		H(i, (e) => {
			r.value >= e.length && (r.value = Math.max(0, e.length - 1));
		}), ns({
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
		return (t, n) => (q(), J("section", Hs, [Y("header", Us, [n[1] ||= Y("h2", null, "Files changed", -1), Y("div", Ws, [
			Y("span", null, [Z(A(a.value.files) + " file", 1), a.value.files === 1 ? Li("", !0) : (q(), J(G, { key: 0 }, [Z("s")], 64))]),
			Y("span", Gs, "+" + A(a.value.additions), 1),
			Y("span", Ks, "-" + A(a.value.deletions), 1),
			n[0] ||= Y("span", { class: "hint" }, [
				Y("kbd", null, "n"),
				Z("/"),
				Y("kbd", null, "p"),
				Z(" next/prev file · "),
				Y("kbd", null, "space"),
				Z(" collapse ")
			], -1)
		])]), e.loading ? (q(), J("p", qs, "Loading diff…")) : e.error ? (q(), J("p", Js, A(e.error), 1)) : i.value.length === 0 ? (q(), J("p", Ys, " No diff to show. Push commits to head and base refs to populate this view. ")) : (q(), J("ol", Xs, [(q(!0), J(G, null, cr(i.value, (e, t) => (q(), J("li", {
			key: e.displayPath + t,
			class: k(["diff-file", { focused: t === r.value }]),
			"data-diff-file-index": t
		}, [Y("header", {
			class: "diff-file-head",
			tabindex: "0",
			role: "button",
			"aria-expanded": !s(e.displayPath),
			onClick: (t) => o(e.displayPath),
			onKeydown: lo(so((t) => o(e.displayPath), ["prevent"]), ["enter"]),
			onFocus: (e) => r.value = t
		}, [
			Y("span", $s, A(s(e.displayPath) ? "▸" : "▾"), 1),
			Y("span", { class: k(["file-status", `status-${e.status}`]) }, A(c(e)), 3),
			Y("code", ec, A(e.displayPath), 1),
			e.status === "renamed" && e.oldPath !== e.newPath ? (q(), J("span", tc, [n[2] ||= Z(" from ", -1), Y("code", null, A(e.oldPath), 1)])) : Li("", !0),
			Y("span", nc, [Y("span", rc, "+" + A(e.additions), 1), Y("span", ic, "-" + A(e.deletions), 1)])
		], 40, Qs), s(e.displayPath) ? Li("", !0) : (q(), J("div", ac, [e.binary ? (q(), J("p", oc, "Binary file — no preview.")) : (q(!0), J(G, { key: 1 }, cr(e.hunks, (e, t) => (q(), J("section", {
			key: t,
			class: "diff-hunk"
		}, [Y("header", sc, [Y("code", null, A(e.header.replace(/^@@ /, "").replace(/ @@$/, "")), 1)]), Y("table", null, [Y("tbody", null, [(q(!0), J(G, null, cr(e.lines, (e, t) => (q(), J("tr", {
			key: t,
			class: k(["diff-line", `line-${e.kind}`])
		}, [
			Y("td", cc, A(e.oldNumber ?? ""), 1),
			Y("td", lc, A(e.newNumber ?? ""), 1),
			Y("td", uc, [e.kind === "add" ? (q(), J(G, { key: 0 }, [Z("+")], 64)) : e.kind === "del" ? (q(), J(G, { key: 1 }, [Z("-")], 64)) : e.kind === "meta" ? (q(), J(G, { key: 2 }, [Z("\\")], 64)) : (q(), J(G, { key: 3 }, [], 64))]),
			Y("td", dc, A(e.text), 1)
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
}, _c = ["href"], vc = { class: "pulls-detail-head" }, yc = { class: "pulls-detail-title" }, bc = ["href"], xc = { class: "pulls-detail-number" }, Sc = {
	class: "pulls-chip-row",
	"aria-label": "Pull request metadata"
}, Cc = { class: "pull-chip tone-branch" }, wc = ["title"], Tc = ["data-author-kind", "title"], Ec = { class: "chip-glyph" }, Dc = {
	key: 0,
	class: "pull-chip tone-time tone-merged"
}, Oc = {
	key: 1,
	class: "pull-chip tone-time tone-closed"
}, kc = {
	key: 2,
	class: "pull-chip tone-time"
}, Ac = { class: "pulls-detail-actions" }, jc = ["disabled"], Mc = ["disabled"], Nc = {
	key: 0,
	class: "pulls-action-message"
}, Pc = {
	key: 0,
	class: "pulls-detail-body"
}, Fc = {
	key: 1,
	class: "pulls-detail-body muted"
}, Ic = {
	key: 2,
	class: "pulls-linked-issues",
	"data-smoke": "pulls-linked-issues"
}, Lc = { class: "muted" }, Rc = { key: 0 }, zc = ["href"], Bc = { class: "issue-num" }, Vc = { class: "issue-title" }, Hc = /* @__PURE__ */ Ln({
	__name: "PullsDetail",
	props: { routeParams: { type: null } },
	setup(e) {
		let t = e, n = $(() => t.routeParams?.params?.pullId ?? ""), r = /* @__PURE__ */ R(null), i = /* @__PURE__ */ R("idle"), a = /* @__PURE__ */ R(null), o = /* @__PURE__ */ R("idle"), s = /* @__PURE__ */ R(null), c = /* @__PURE__ */ R(""), l = /* @__PURE__ */ R(""), u = /* @__PURE__ */ R("idle"), d = /* @__PURE__ */ R(null), f = /* @__PURE__ */ R([]), p = /* @__PURE__ */ R("idle"), m = /* @__PURE__ */ R([]);
		function h(e) {
			let t = (e ?? "").replace(/^\.\//, "").replace(/\/+$/g, "");
			return t === "." ? "" : t;
		}
		let g = $(() => {
			if (m.value.length === 0 || !c.value) return [];
			let e = m.value.map((e) => ({
				name: e.name ?? "",
				root: h(e.root)
			})).filter((e) => e.name).sort((e, t) => t.root.length - e.root.length), t = /* @__PURE__ */ new Set();
			for (let n of Fs(c.value)) {
				let r = n.displayPath.replace(/^\/+/, "");
				for (let n of e) if (n.root === "" || r === n.root || r.startsWith(`${n.root}/`)) {
					t.add(n.name);
					break;
				}
			}
			return Array.from(t).sort();
		}), _ = $(() => Cs(r.value?.state)), v = $(() => r.value && (r.value.state === "READY" || r.value.state === "DRAFT")), y = $(() => r.value && r.value.state !== "CLOSED" && r.value.state !== "MERGED");
		Qn(() => {
			b(), w(), x();
		}), H(n, () => void x()), ns({
			m: (e) => {
				v.value && (e.preventDefault(), ee());
			},
			x: (e) => {
				y.value && (e.preventDefault(), te());
			},
			Escape: (e) => {
				document.querySelector(".shortcuts-backdrop, .palette-backdrop") || (e.preventDefault(), window.location.href = xs());
			}
		}), H(n, () => void b());
		async function b() {
			if (!n.value) {
				i.value = "error", a.value = "Missing pull id";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				r.value = await ms(n.value), i.value = r.value ? "ready" : "empty";
			} catch (e) {
				i.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function x() {
			if (n.value) {
				p.value = "loading";
				try {
					f.value = await vs(n.value), p.value = "ready";
				} catch {
					f.value = [], p.value = "error";
				}
			}
		}
		function S(e) {
			return e.id ? `/x/issues/${e.id}` : "/x/issues/";
		}
		function C(e) {
			switch (e) {
				case "CLOSED": return "issue-state-closed";
				default: return "issue-state-open";
			}
		}
		async function w() {
			u.value = "loading", d.value = null;
			try {
				let e = await Co().query("query PullDiff {\n        repository {\n          diff { path language patch }\n          comtryaConfig\n        }\n      }"), t = e.repository?.diff;
				c.value = t?.patch ?? "", l.value = t?.path ?? "", m.value = e.repository?.comtryaConfig?.projects ?? [], u.value = "ready";
			} catch (e) {
				u.value = "error", d.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function ee() {
			if (!(!r.value || !v.value)) {
				o.value = "merging", s.value = null;
				try {
					r.value = await hs(r.value.id), s.value = `Merged pull #${r.value.number}`;
				} catch (e) {
					s.value = e instanceof Error ? e.message : String(e);
				} finally {
					o.value = "idle";
				}
			}
		}
		async function te() {
			if (!(!r.value || !y.value)) {
				o.value = "closing", s.value = null;
				try {
					r.value = await gs(r.value.id), s.value = `Closed pull #${r.value.number}`;
				} catch (e) {
					s.value = e instanceof Error ? e.message : String(e);
				} finally {
					o.value = "idle";
				}
			}
		}
		return (e, t) => (q(), J("article", pc, [i.value === "loading" ? (q(), J("p", mc, "Loading pull request…")) : i.value === "error" ? (q(), J("p", hc, A(a.value), 1)) : i.value === "empty" || !r.value ? (q(), J("p", gc, [
			t[0] ||= Z(" No pull request found for ", -1),
			Y("code", null, A(n.value), 1),
			t[1] ||= Z(". ", -1),
			Y("a", { href: z(xs)() }, "← back to queue", 8, _c)
		])) : (q(), J(G, { key: 3 }, [
			Y("header", vc, [Y("div", yc, [
				Y("a", {
					href: z(xs)(),
					class: "back",
					"aria-label": "Back to pull request queue"
				}, "←", 8, bc),
				Y("span", xc, "#" + A(r.value.number), 1),
				Y("h1", null, A(r.value.title), 1)
			]), Y("div", Sc, [
				Y("span", { class: k([
					"pull-chip",
					"tone-state",
					_.value.className
				]) }, A(_.value.label), 3),
				Y("span", Cc, [
					Y("code", null, A(r.value.headRef), 1),
					t[2] ||= Y("span", {
						class: "branch-arrow",
						"aria-hidden": "true"
					}, "→", -1),
					Y("code", null, A(r.value.baseRef), 1)
				]),
				(q(!0), J(G, null, cr(g.value, (e) => (q(), J("span", {
					key: `project-${e}`,
					class: "pull-chip tone-project",
					title: `Touches files inside the ${e} Project's root`
				}, [t[3] ||= Y("span", { class: "chip-glyph" }, "◇", -1), Z(A(e), 1)], 8, wc))), 128)),
				Y("span", {
					class: "pull-chip tone-author",
					"data-author-kind": z(Es)(r.value.authorRef).kind,
					title: `Opened by ${r.value.authorRef}`
				}, [Y("span", Ec, A(z(Es)(r.value.authorRef).glyph), 1), Z(" by " + A(z(Es)(r.value.authorRef).label), 1)], 8, Tc),
				r.value.mergedAt ? (q(), J("span", Dc, " merged " + A(z(ws)(r.value.mergedAt)), 1)) : r.value.closedAt ? (q(), J("span", Oc, " closed " + A(z(ws)(r.value.closedAt)), 1)) : Li("", !0),
				r.value.createdAt ? (q(), J("span", kc, " opened " + A(z(ws)(r.value.createdAt)), 1)) : Li("", !0)
			])]),
			Y("section", Ac, [
				Y("button", {
					type: "button",
					class: "pulls-action primary",
					disabled: !v.value || o.value !== "idle",
					onClick: ee
				}, [Z(A(o.value === "merging" ? "Merging…" : "Merge") + " ", 1), t[4] ||= Y("kbd", null, "m", -1)], 8, jc),
				Y("button", {
					type: "button",
					class: "pulls-action",
					disabled: !y.value || o.value !== "idle",
					onClick: te
				}, [Z(A(o.value === "closing" ? "Closing…" : "Close") + " ", 1), t[5] ||= Y("kbd", null, "x", -1)], 8, Mc),
				s.value ? (q(), J("span", Nc, A(s.value), 1)) : Li("", !0)
			]),
			r.value.bodyMarkdown ? (q(), J("section", Pc, [t[6] ||= Y("h2", null, "Description", -1), Y("pre", null, A(r.value.bodyMarkdown), 1)])) : (q(), J("section", Fc, [...t[7] ||= [Y("h2", null, "Description", -1), Y("p", null, "No description provided.", -1)]])),
			p.value !== "idle" || f.value.length > 0 ? (q(), J("section", Ic, [Y("header", null, [t[8] ||= Y("h2", null, "Closes", -1), Y("span", Lc, [p.value === "loading" ? (q(), J(G, { key: 0 }, [Z("resolving…")], 64)) : f.value.length === 0 ? (q(), J(G, { key: 1 }, [Z(" no linked issues ")], 64)) : (q(), J(G, { key: 2 }, [
				Z(A(f.value.length) + " issue", 1),
				f.value.length === 1 ? Li("", !0) : (q(), J(G, { key: 0 }, [Z("s")], 64)),
				r.value.state === "MERGED" ? (q(), J(G, { key: 1 }, [Z(" — auto-closed on merge")], 64)) : (q(), J(G, { key: 2 }, [Z(" — will close on merge")], 64))
			], 64))])]), f.value.length > 0 ? (q(), J("ul", Rc, [(q(!0), J(G, null, cr(f.value, (e) => (q(), J("li", { key: e.uri }, [Y("a", { href: S(e) }, [
				Y("span", Bc, [e.number === null ? (q(), J(G, { key: 1 }, [Z("issue")], 64)) : (q(), J(G, { key: 0 }, [Z("#" + A(e.number), 1)], 64))]),
				Y("span", Vc, A(e.title), 1),
				Y("span", { class: k(["issue-state", C(e.state)]) }, A(e.state.toLowerCase()), 3)
			], 8, zc)]))), 128))])) : Li("", !0)])) : Li("", !0),
			X(fc, {
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
}), Uc = ".pulls-detail[data-v-ce34fe76]{font-family:var(--sans,system-ui);gap:22px;display:grid}.pulls-detail-head[data-v-ce34fe76]{border-bottom:1.5px solid var(--ink,#111);gap:12px;padding-bottom:16px;display:grid}.pulls-detail-title[data-v-ce34fe76]{flex-wrap:wrap;align-items:baseline;gap:12px;display:flex}.pulls-detail-title h1[data-v-ce34fe76]{font-family:var(--display,system-ui);flex:320px;margin:0;font-size:28px;line-height:1.1}.back[data-v-ce34fe76]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:16px;text-decoration:none}.back[data-v-ce34fe76]:hover{color:var(--ink,#111)}.pulls-detail-number[data-v-ce34fe76]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:14px}.pulls-chip-row[data-v-ce34fe76]{flex-wrap:wrap;align-items:center;gap:6px;margin:4px 0 0;display:flex}.pull-chip[data-v-ce34fe76]{border:1px solid var(--rule-light,#d8d1c4);font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);align-items:center;gap:5px;padding:2px 8px;font-size:11px;line-height:16px;display:inline-flex}.pull-chip .chip-glyph[data-v-ce34fe76]{place-items:center;width:13px;height:13px;font-size:10px;font-weight:700;display:inline-grid}.pull-chip.tone-state[data-v-ce34fe76]{text-transform:lowercase;letter-spacing:.02em;border-color:currentColor}.pull-chip.tone-state.pr-state-ready[data-v-ce34fe76]{color:var(--accent-teal,#087f6f)}.pull-chip.tone-state.pr-state-draft[data-v-ce34fe76]{color:var(--ink-faint,#68645c)}.pull-chip.tone-state.pr-state-merged[data-v-ce34fe76]{color:var(--accent-blue,#1d55a6)}.pull-chip.tone-state.pr-state-closed[data-v-ce34fe76]{color:var(--accent-err,#c9341c)}.pull-chip.tone-project[data-v-ce34fe76]{color:var(--accent-blue,#1d55a6);cursor:help;border-color:currentColor}.pull-chip.tone-branch[data-v-ce34fe76]{gap:4px}.pull-chip.tone-branch code[data-v-ce34fe76]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);font-size:11px}.pull-chip.tone-branch .branch-arrow[data-v-ce34fe76]{color:var(--ink-fainter,#918b80);padding:0 2px}.pull-chip.tone-author[data-v-ce34fe76]{color:var(--ink-soft,#2c2b28)}.pull-chip.tone-author[data-author-kind=agent][data-v-ce34fe76]{color:#6b3fa0}.pull-chip.tone-author[data-author-kind=credential][data-v-ce34fe76]{color:var(--accent-yellow,#c89300)}.pull-chip.tone-author[data-author-kind=bot][data-v-ce34fe76]{color:var(--accent-blue,#1d55a6)}.pull-chip.tone-author[data-author-kind=team][data-v-ce34fe76]{color:var(--accent-teal,#087f6f)}.pull-chip.tone-time[data-v-ce34fe76]{color:var(--ink-faint,#68645c);border-style:none;padding-left:2px}.pull-chip.tone-time.tone-merged[data-v-ce34fe76]{color:var(--accent-blue,#1d55a6)}.pull-chip.tone-time.tone-closed[data-v-ce34fe76]{color:var(--accent-err,#c9341c)}.pulls-detail-actions[data-v-ce34fe76]{flex-wrap:wrap;align-items:center;gap:10px;display:flex}.pulls-action[data-v-ce34fe76]{border:1.5px solid var(--ink,#111);background:var(--paper,#fffdf8);color:var(--ink,#111);font-family:var(--display,system-ui);cursor:pointer;align-items:center;gap:8px;padding:8px 14px;font-weight:600;display:inline-flex}.pulls-action.primary[data-v-ce34fe76]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.pulls-action[disabled][data-v-ce34fe76]{opacity:.5;cursor:not-allowed}.pulls-action kbd[data-v-ce34fe76]{font-family:var(--mono,monospace);opacity:.6;border:1px solid;padding:0 4px;font-size:10px}.pulls-action-message[data-v-ce34fe76]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.pulls-detail-body h2[data-v-ce34fe76]{font-family:var(--display,system-ui);margin:0 0 8px;font-size:16px}.pulls-detail-body pre[data-v-ce34fe76]{font-family:var(--mono,monospace);white-space:pre-wrap;word-break:break-word;color:var(--ink-soft,#2c2b28);margin:0;font-size:12px}.pulls-detail-body.muted p[data-v-ce34fe76]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.pulls-linked-issues[data-v-ce34fe76]{gap:8px;display:grid}.pulls-linked-issues header[data-v-ce34fe76]{border-bottom:1.5px solid var(--ink,#111);justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:4px;display:flex}.pulls-linked-issues h2[data-v-ce34fe76]{font-family:var(--display,system-ui);margin:0;font-size:18px}.pulls-linked-issues .muted[data-v-ce34fe76]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.pulls-linked-issues ul[data-v-ce34fe76]{margin:0;padding:0;list-style:none;display:grid}.pulls-linked-issues li a[data-v-ce34fe76]{color:inherit;border-bottom:1px solid var(--rule-light,#d8d1c4);grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline;gap:12px;padding:8px 0;text-decoration:none;display:grid}.pulls-linked-issues li:last-child a[data-v-ce34fe76]{border-bottom:0}.pulls-linked-issues .issue-num[data-v-ce34fe76]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums;font-size:12px}.pulls-linked-issues .issue-title[data-v-ce34fe76]{font-family:var(--display,system-ui);text-overflow:ellipsis;white-space:nowrap;font-weight:500;overflow:hidden}.pulls-linked-issues .issue-state[data-v-ce34fe76]{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 5px;font-size:10px}.pulls-linked-issues .issue-state-open[data-v-ce34fe76]{color:var(--accent-teal,#087f6f)}.pulls-linked-issues .issue-state-closed[data-v-ce34fe76]{color:var(--accent-blue,#1d55a6)}.pulls-empty[data-v-ce34fe76],.pulls-error[data-v-ce34fe76]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:13px}.pulls-error[data-v-ce34fe76]{color:var(--accent-err,#c9341c)}", Wc = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, Gc = /* @__PURE__ */ Wc(Hc, [["styles", [Uc]], ["__scopeId", "data-v-ce34fe76"]]), Kc = {
	class: "pulls-overview",
	"data-smoke": "pulls-overview"
}, qc = ["href"], Jc = {
	key: 0,
	class: "muted"
}, Yc = {
	key: 1,
	class: "muted"
}, Xc = {
	key: 2,
	class: "muted"
}, Zc = { key: 3 }, Qc = ["href"], $c = { class: "num" }, el = { class: "title" }, tl = { class: "age" }, nl = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", rl = /* @__PURE__ */ Wc(/* @__PURE__ */ Ln({
	__name: "PullsOverview",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R([]), r = /* @__PURE__ */ R("idle"), i = $(() => t.workspaceId ?? t.host?.workspaceId ?? nl), a = $(() => t.repositoryId ?? t.host?.repositoryId ?? null), o = $(() => n.value.filter((e) => e.state === "READY" || e.state === "DRAFT").sort((e, t) => {
			let n = Date.parse(e.updatedAt ?? e.createdAt ?? "") || 0;
			return (Date.parse(t.updatedAt ?? t.createdAt ?? "") || 0) - n;
		}).slice(0, 5)), s = $(() => n.value.filter((e) => e.state === "READY").length);
		Qn(() => void c()), H(() => [i.value, a.value], () => void c());
		async function c() {
			r.value = "loading";
			try {
				n.value = await ps({
					workspaceId: i.value,
					repositoryId: a.value,
					limit: 32
				}), r.value = n.value.length > 0 ? "ready" : "empty";
			} catch {
				r.value = "error", n.value = [];
			}
		}
		return (e, t) => (q(), J("section", Kc, [Y("header", null, [t[0] ||= Y("h3", null, "Pull requests", -1), Y("a", { href: z(xs)() }, A(s.value) + " open", 9, qc)]), r.value === "loading" ? (q(), J("p", Jc, "Loading…")) : r.value === "error" ? (q(), J("p", Yc, "Could not load pulls.")) : o.value.length === 0 ? (q(), J("p", Xc, "No open pull requests.")) : (q(), J("ul", Zc, [(q(!0), J(G, null, cr(o.value, (e) => (q(), J("li", { key: e.id }, [Y("a", { href: z(Ss)(e) }, [
			Y("span", $c, "#" + A(e.number), 1),
			Y("span", el, A(e.title), 1),
			Y("span", { class: k(["state", z(Cs)(e.state).className]) }, A(z(Cs)(e.state).label), 3),
			Y("span", tl, A(z(ws)(e.updatedAt ?? e.createdAt)), 1)
		], 8, Qc)]))), 128))]))]));
	}
}), [["styles", [".pulls-overview[data-v-c112b1d8]{gap:8px;display:grid}.pulls-overview header[data-v-c112b1d8]{justify-content:space-between;align-items:baseline;display:flex}.pulls-overview h3[data-v-c112b1d8]{font-family:var(--display,system-ui);margin:0;font-size:14px}.pulls-overview header a[data-v-c112b1d8],.muted[data-v-c112b1d8]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px;text-decoration:none}.pulls-overview ul[data-v-c112b1d8]{gap:4px;margin:0;padding:0;list-style:none;display:grid}.pulls-overview li a[data-v-c112b1d8]{color:inherit;border-bottom:1px solid var(--rule-light,#d8d1c4);grid-template-columns:auto minmax(0,1fr) auto auto;align-items:baseline;gap:8px;padding:6px 0;text-decoration:none;display:grid}.pulls-overview li:last-child a[data-v-c112b1d8]{border-bottom:0}.num[data-v-c112b1d8]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.title[data-v-c112b1d8]{text-overflow:ellipsis;white-space:nowrap;font-weight:500;overflow:hidden}.state[data-v-c112b1d8]{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.state.pr-state-ready[data-v-c112b1d8]{color:var(--accent-teal,#087f6f)}.state.pr-state-draft[data-v-c112b1d8]{color:var(--ink-faint,#68645c)}.state.pr-state-merged[data-v-c112b1d8]{color:var(--accent-blue,#1d55a6)}.state.pr-state-closed[data-v-c112b1d8]{color:var(--accent-err,#c9341c)}.age[data-v-c112b1d8]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}"]], ["__scopeId", "data-v-c112b1d8"]]), il = {
	class: "pulls-queue",
	"data-smoke": "pulls-queue"
}, al = { class: "pulls-queue-head" }, ol = { class: "pulls-queue-controls" }, sl = {
	class: "pulls-filter-row",
	role: "tablist",
	"aria-label": "Filter pulls by state"
}, cl = ["aria-selected", "onClick"], ll = { class: "count" }, ul = { class: "pulls-search" }, dl = {
	key: 0,
	class: "pulls-empty"
}, fl = {
	key: 1,
	class: "pulls-error",
	role: "alert"
}, pl = {
	key: 2,
	class: "pulls-empty"
}, ml = {
	key: 3,
	class: "pulls-empty"
}, hl = {
	key: 4,
	class: "pulls-list",
	role: "listbox",
	"aria-label": "Pull request queue"
}, gl = ["aria-selected", "onMouseenter"], _l = ["href"], vl = { class: "pulls-row-number" }, yl = { class: "pulls-row-body" }, bl = { class: "pulls-row-title" }, xl = { class: "pulls-row-meta" }, Sl = { class: "pulls-branch" }, Cl = ["data-author-kind"], wl = { class: "author-glyph" }, Tl = { class: "author-label" }, El = {
	key: 0,
	class: "author-badge"
}, Dl = {
	key: 1,
	class: "author-badge"
}, Ol = {
	key: 2,
	class: "author-badge"
}, kl = { class: "pulls-row-age" }, Al = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", jl = /* @__PURE__ */ Wc(/* @__PURE__ */ Ln({
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
		], r = /* @__PURE__ */ R("OPEN"), i = /* @__PURE__ */ R(""), a = /* @__PURE__ */ R([]), o = /* @__PURE__ */ R("idle"), s = /* @__PURE__ */ R(null), c = /* @__PURE__ */ R(0), l = $(() => t.workspaceId ?? t.host?.workspaceId ?? Al), u = $(() => t.repositoryId ?? t.host?.repositoryId ?? null), d = (e, t) => t === "ALL" ? !0 : t === "OPEN" ? e.state === "READY" : e.state === t, f = $(() => {
			let e = i.value.trim().toLowerCase();
			return a.value.filter((e) => d(e, r.value)).filter((t) => {
				if (!e) return !0;
				let n = Es(t.authorRef);
				return `${t.number} ${t.title} ${t.headRef} ${t.baseRef} ${n.label} ${n.kind}`.toLowerCase().includes(e);
			});
		}), p = $(() => {
			let e = {
				OPEN: 0,
				DRAFT: 0,
				MERGED: 0,
				CLOSED: 0,
				ALL: a.value.length
			};
			for (let t of a.value) t.state === "READY" && (e.OPEN += 1), t.state === "DRAFT" && (e.DRAFT += 1), t.state === "MERGED" && (e.MERGED += 1), t.state === "CLOSED" && (e.CLOSED += 1);
			return e;
		}), m = new Set([
			"OPEN",
			"DRAFT",
			"MERGED",
			"CLOSED",
			"ALL"
		]);
		function h() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = (e.get("state") ?? "").toUpperCase();
			m.has(t) && (r.value = t);
			let n = e.get("q");
			n !== null && (i.value = n);
		}
		function g() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			r.value === "OPEN" ? e.delete("state") : e.set("state", r.value);
			let t = i.value.trim();
			t ? e.set("q", t) : e.delete("q");
			let n = e.toString(), a = `${window.location.pathname}${n ? `?${n}` : ""}${window.location.hash}`;
			a !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", a);
		}
		let _ = !1;
		function v() {
			_ = !0, h(), fn(() => {
				_ = !1;
			});
		}
		Qn(() => {
			_ = !0, h(), _ = !1, b(), window.addEventListener("popstate", v);
		}), nr(() => {
			window.removeEventListener("popstate", v);
		}), H(() => [l.value, u.value], () => void b()), H(f, () => {
			c.value >= f.value.length && (c.value = Math.max(0, f.value.length - 1));
		}), H([r, i], () => {
			_ || g();
		}), ns({
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
				t && (e.preventDefault(), window.location.href = Ss(t));
			},
			"/": (e) => {
				e.preventDefault(), document.querySelector("[data-pulls-search]")?.focus();
			},
			...Object.fromEntries(n.map((e) => [e.key, (t) => {
				t.preventDefault(), r.value = e.id;
			}]))
		});
		function y(e) {
			i.value &&= (e.preventDefault(), "");
		}
		async function b() {
			o.value = "loading", s.value = null;
			try {
				a.value = (await ps({
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
		return (e, t) => (q(), J("section", il, [
			Y("header", al, [t[2] ||= Y("h2", null, "Pull requests", -1), Y("div", ol, [Y("div", sl, [(q(), J(G, null, cr(n, (e) => Y("button", {
				key: e.id,
				type: "button",
				role: "tab",
				"aria-selected": r.value === e.id,
				class: k(["pulls-filter", { active: r.value === e.id }]),
				onClick: (t) => r.value = e.id
			}, [
				Y("span", null, A(e.label), 1),
				Y("span", ll, A(p.value[e.id]), 1),
				Y("kbd", null, A(e.key), 1)
			], 10, cl)), 64))]), Y("label", ul, [wn(Y("input", {
				"data-pulls-search": "",
				"onUpdate:modelValue": t[0] ||= (e) => i.value = e,
				type: "search",
				placeholder: "Filter by title, branch, author",
				autocomplete: "off",
				onKeydown: lo(y, ["esc"])
			}, null, 544), [[io, i.value]]), t[1] ||= Y("kbd", null, "/", -1)])])]),
			o.value === "loading" ? (q(), J("p", dl, "Loading pull requests…")) : o.value === "error" ? (q(), J("p", fl, A(s.value), 1)) : a.value.length === 0 ? (q(), J("p", pl, [...t[3] ||= [
				Z(" No pull requests yet. Push a branch and open one through the ", -1),
				Y("code", null, "create-pull", -1),
				Z(" op or the SDK. ", -1)
			]])) : f.value.length === 0 ? (q(), J("p", ml, " No pull requests match the current filter. ")) : (q(), J("ol", hl, [(q(!0), J(G, null, cr(f.value, (e, n) => (q(), J("li", {
				key: e.id,
				class: k(["pulls-row", { focused: n === c.value }]),
				role: "option",
				"aria-selected": n === c.value,
				onMouseenter: (e) => c.value = n
			}, [Y("a", {
				href: z(Ss)(e),
				class: "pulls-row-link"
			}, [
				Y("span", vl, "#" + A(e.number), 1),
				Y("span", yl, [Y("span", bl, A(e.title), 1), Y("span", xl, [
					Y("span", { class: k(["pulls-state", z(Cs)(e.state).className]) }, A(z(Cs)(e.state).label), 3),
					Y("code", Sl, [
						Z(A(e.headRef) + " ", 1),
						t[4] ||= Y("span", null, "→", -1),
						Z(" " + A(e.baseRef), 1)
					]),
					Y("span", {
						class: "pulls-author",
						"data-author-kind": z(Es)(e.authorRef).kind
					}, [
						Y("span", wl, A(z(Es)(e.authorRef).glyph), 1),
						Y("span", Tl, A(z(Es)(e.authorRef).label), 1),
						z(Es)(e.authorRef).kind === "agent" ? (q(), J("span", El, "agent")) : z(Es)(e.authorRef).kind === "credential" ? (q(), J("span", Dl, "bot")) : z(Es)(e.authorRef).kind === "bot" ? (q(), J("span", Ol, "bot")) : Li("", !0)
					], 8, Cl)
				])]),
				Y("span", kl, A(z(ws)(e.updatedAt ?? e.createdAt)), 1)
			], 8, _l)], 42, gl))), 128))])),
			t[5] ||= Ii("<footer class=\"pulls-queue-foot\" data-v-eea3a968><span data-v-eea3a968><kbd data-v-eea3a968>j</kbd> <kbd data-v-eea3a968>k</kbd> navigate · <kbd data-v-eea3a968>↵</kbd> open · <kbd data-v-eea3a968>/</kbd> search · <kbd data-v-eea3a968>o</kbd> open <kbd data-v-eea3a968>d</kbd> draft <kbd data-v-eea3a968>m</kbd> merged <kbd data-v-eea3a968>c</kbd> closed <kbd data-v-eea3a968>a</kbd> all </span></footer>", 1)
		]));
	}
}), [["styles", [".pulls-queue[data-v-eea3a968]{font-family:var(--sans,system-ui);color:var(--ink,#111);gap:16px;display:grid}.pulls-queue-head[data-v-eea3a968]{gap:12px;display:grid}.pulls-queue-head h2[data-v-eea3a968]{font-family:var(--display,system-ui);margin:0;font-size:22px;line-height:1}.pulls-queue-controls[data-v-eea3a968]{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;display:flex}.pulls-filter-row[data-v-eea3a968]{border:1.5px solid var(--ink,#111);flex-wrap:wrap;gap:4px;display:inline-flex}.pulls-filter[data-v-eea3a968]{color:inherit;cursor:pointer;font-family:var(--mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;display:inline-flex}.pulls-filter[data-v-eea3a968]:not(:last-child){border-right:1px solid var(--rule-light,#d8d1c4)}.pulls-filter.active[data-v-eea3a968]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.pulls-filter .count[data-v-eea3a968]{color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums}.pulls-filter.active .count[data-v-eea3a968]{color:var(--paper-tint,#f2efe7)}.pulls-filter kbd[data-v-eea3a968]{font-family:var(--mono,monospace);opacity:.6;border:1px solid;padding:0 4px;font-size:10px}.pulls-search[data-v-eea3a968]{border:1.5px solid var(--ink,#111);flex:240px;align-items:center;gap:8px;min-width:240px;max-width:420px;padding:4px 10px;display:inline-flex}.pulls-search input[data-v-eea3a968]{color:inherit;font:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0}.pulls-search kbd[data-v-eea3a968]{border:1px solid var(--ink,#111);font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);padding:0 4px;font-size:10px}.pulls-list[data-v-eea3a968]{border-top:1.5px solid var(--ink,#111);margin:0;padding:0;list-style:none;display:grid}.pulls-row[data-v-eea3a968]{border-bottom:1px solid var(--rule-light,#d8d1c4)}.pulls-row.focused[data-v-eea3a968]{background:var(--paper-tint,#f2efe7)}.pulls-row-link[data-v-eea3a968]{color:inherit;grid-template-columns:56px 1fr auto;align-items:baseline;gap:14px;padding:12px 12px 12px 6px;text-decoration:none;display:grid}.pulls-row-link[data-v-eea3a968]:hover{background:var(--paper-tint,#f2efe7);text-decoration:none}.pulls-row-number[data-v-eea3a968]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);text-align:right;font-variant-numeric:tabular-nums;font-size:12px}.pulls-row-body[data-v-eea3a968]{gap:4px;min-width:0;display:grid}.pulls-row-title[data-v-eea3a968]{font-family:var(--display,system-ui);text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;overflow:hidden}.pulls-row-meta[data-v-eea3a968]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);flex-wrap:wrap;align-items:baseline;gap:10px;font-size:12px;display:flex}.pulls-state[data-v-eea3a968]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 6px;font-size:11px}.pulls-state.pr-state-ready[data-v-eea3a968]{color:var(--accent-teal,#087f6f)}.pulls-state.pr-state-draft[data-v-eea3a968]{color:var(--ink-faint,#68645c)}.pulls-state.pr-state-merged[data-v-eea3a968]{color:var(--accent-blue,#1d55a6)}.pulls-state.pr-state-closed[data-v-eea3a968]{color:var(--accent-err,#c9341c)}.pulls-branch[data-v-eea3a968]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);font-size:12px}.pulls-branch span[data-v-eea3a968]{color:var(--ink-fainter,#918b80);padding:0 4px}.pulls-author[data-v-eea3a968]{font-family:var(--mono,monospace);align-items:center;gap:5px;font-size:12px;display:inline-flex}.pulls-author .author-glyph[data-v-eea3a968]{width:14px;height:14px;color:var(--ink-faint,#68645c);border:1px solid;place-items:center;font-size:10px;font-weight:700;display:inline-grid}.pulls-author[data-author-kind=agent] .author-glyph[data-v-eea3a968],.pulls-author[data-author-kind=agent] .author-label[data-v-eea3a968],.pulls-author[data-author-kind=agent] .author-badge[data-v-eea3a968]{color:#6b3fa0}.pulls-author[data-author-kind=credential] .author-glyph[data-v-eea3a968],.pulls-author[data-author-kind=credential] .author-label[data-v-eea3a968],.pulls-author[data-author-kind=credential] .author-badge[data-v-eea3a968]{color:var(--accent-yellow,#c89300)}.pulls-author[data-author-kind=bot] .author-glyph[data-v-eea3a968],.pulls-author[data-author-kind=bot] .author-label[data-v-eea3a968],.pulls-author[data-author-kind=bot] .author-badge[data-v-eea3a968]{color:var(--accent-blue,#1d55a6)}.pulls-author .author-badge[data-v-eea3a968]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.pulls-row-age[data-v-eea3a968]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);white-space:nowrap;font-size:12px}.pulls-empty[data-v-eea3a968],.pulls-error[data-v-eea3a968]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border-top:1.5px solid var(--rule-light,#d8d1c4);padding:18px 0;font-size:13px}.pulls-error[data-v-eea3a968]{color:var(--accent-err,#c9341c)}.pulls-queue-foot[data-v-eea3a968]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.pulls-queue-foot kbd[data-v-eea3a968]{font-family:var(--mono,monospace);border:1px solid;padding:0 4px;font-size:10px}"]], ["__scopeId", "data-v-eea3a968"]]), Ml = {
	class: "pulls-your-work",
	"data-smoke": "pulls-your-work"
}, Nl = ["href"], Pl = {
	key: 0,
	class: "muted"
}, Fl = {
	key: 1,
	class: "muted"
}, Il = {
	key: 2,
	class: "muted"
}, Ll = { key: 3 }, Rl = ["href"], zl = { class: "num" }, Bl = { class: "title" }, Vl = { class: "meta" }, Hl = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", Ul = /* @__PURE__ */ Wc(/* @__PURE__ */ Ln({
	__name: "PullsYourWork",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		viewerRef: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R([]), r = /* @__PURE__ */ R("idle"), i = $(() => t.workspaceId ?? t.host?.workspaceId ?? Hl), a = $(() => t.viewerRef ?? t.host?.viewerRef ?? null), o = $(() => a.value ? n.value.filter((e) => e.authorRef === a.value).filter((e) => e.state === "READY" || e.state === "DRAFT").slice(0, 5) : n.value.filter((e) => e.state === "READY" || e.state === "DRAFT").slice(0, 5));
		Qn(() => void s()), H(() => [i.value], () => void s());
		async function s() {
			r.value = "loading";
			try {
				n.value = await ps({
					workspaceId: i.value,
					limit: 64
				}), r.value = n.value.length > 0 ? "ready" : "empty";
			} catch {
				r.value = "error", n.value = [];
			}
		}
		return (e, t) => (q(), J("section", Ml, [Y("header", null, [t[0] ||= Y("h3", null, "Your pull requests", -1), Y("a", { href: z(xs)() }, "queue", 8, Nl)]), r.value === "loading" ? (q(), J("p", Pl, "Loading…")) : r.value === "error" ? (q(), J("p", Fl, "Could not load pulls.")) : o.value.length === 0 ? (q(), J("p", Il, " Nothing here yet. Open a pull request to see it in this rail. ")) : (q(), J("ul", Ll, [(q(!0), J(G, null, cr(o.value, (e) => (q(), J("li", { key: e.id }, [Y("a", { href: z(Ss)(e) }, [
			Y("span", zl, "#" + A(e.number), 1),
			Y("span", Bl, A(e.title), 1),
			Y("span", { class: k(["state", z(Cs)(e.state).className]) }, A(z(Cs)(e.state).label), 3),
			Y("span", Vl, A(z(Ts)(e.authorRef)) + " · " + A(z(ws)(e.updatedAt ?? e.createdAt)), 1)
		], 8, Rl)]))), 128))]))]));
	}
}), [["styles", [".pulls-your-work[data-v-cf9251fe]{gap:8px;display:grid}.pulls-your-work header[data-v-cf9251fe]{justify-content:space-between;align-items:baseline;display:flex}.pulls-your-work h3[data-v-cf9251fe]{font-family:var(--display,system-ui);margin:0;font-size:14px}.pulls-your-work header a[data-v-cf9251fe],.muted[data-v-cf9251fe]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px;text-decoration:none}.pulls-your-work ul[data-v-cf9251fe]{margin:0;padding:0;list-style:none;display:grid}.pulls-your-work li a[data-v-cf9251fe]{color:inherit;border-bottom:1px solid var(--rule-light,#d8d1c4);grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline;gap:8px;padding:8px 0;text-decoration:none;display:grid}.pulls-your-work li:last-child a[data-v-cf9251fe]{border-bottom:0}.num[data-v-cf9251fe]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.title[data-v-cf9251fe]{text-overflow:ellipsis;white-space:nowrap;grid-row:1;overflow:hidden}.state[data-v-cf9251fe]{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.state.pr-state-ready[data-v-cf9251fe]{color:var(--accent-teal,#087f6f)}.state.pr-state-draft[data-v-cf9251fe]{color:var(--ink-faint,#68645c)}.state.pr-state-merged[data-v-cf9251fe]{color:var(--accent-blue,#1d55a6)}.state.pr-state-closed[data-v-cf9251fe]{color:var(--accent-err,#c9341c)}.meta[data-v-cf9251fe]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);grid-column:1/-1;font-size:11px}"]], ["__scopeId", "data-v-cf9251fe"]]), Wl = "ext_pull_requests", Gl = "comtrya-pulls-queue", Kl = "comtrya-pulls-detail", ql = "comtrya-pulls-your-work", Jl = "comtrya-pulls-overview";
rs({
	tagName: Gl,
	component: jl
}), rs({
	tagName: Kl,
	component: Gc
}), rs({
	tagName: ql,
	component: Ul
}), rs({
	tagName: Jl,
	component: rl
});
var Yl = {
	id: Wl,
	setup(e) {
		e.registerWidget({
			id: "pulls-your-work",
			element: ql,
			defaultSlot: "home.your-work",
			defaultPriority: 100,
			requiredPermission: "pull-requests.read"
		}), e.registerWidget({
			id: "pulls-overview",
			element: Jl,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "pull-requests.read"
		}), e.registerRoute("/", {
			element: Gl,
			requiredPermission: "pull-requests.read"
		}), e.registerRoute("/:pullId", {
			element: Kl,
			requiredPermission: "pull-requests.read"
		}), Ms();
	}
};
//#endregion
export { Yl as default };
