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
}, ne = /-\w/g, T = te((e) => e.replace(ne, (e) => e.slice(1).toUpperCase())), E = /\B([A-Z])/g, D = te((e) => e.replace(E, "-$1").toLowerCase()), re = te((e) => e.charAt(0).toUpperCase() + e.slice(1)), ie = te((e) => e ? `on${re(e)}` : ""), O = (e, t) => !Object.is(e, t), ae = (e, ...t) => {
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
function he(e) {
	let t = "";
	if (g(e)) t = e;
	else if (d(e)) for (let n = 0; n < e.length; n++) {
		let r = he(e[n]);
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
		(t.version === 0 || O(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
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
		return e === /* @__PURE__ */ I(r) && (o ? O(n, i) && Qe(e, "set", t, n, i) : Qe(e, "add", t, n)), s;
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
			e || (O(n, a) && P(i, "get", n), P(i, "get", a));
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
			return e || (O(t, i) && P(r, "has", t), P(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
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
			return r.has.call(n, a) || O(e, a) && r.has.call(n, e) || O(i, a) && r.has.call(n, i) || (n.add(a), Qe(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ F(n) && !/* @__PURE__ */ Rt(n) && (n = /* @__PURE__ */ I(n));
			let r = /* @__PURE__ */ I(this), { has: i, get: a } = yt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ I(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? O(n, s) && Qe(r, "set", e, n, s) : Qe(r, "add", e, n), this;
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
	return !u(e, "__v_skip") && Object.isExtensible(e) && k(e, "__v_skip", !0), e;
}
var Vt = (e) => v(e) ? /* @__PURE__ */ Nt(e) : e, Ht = (e) => v(e) ? /* @__PURE__ */ Ft(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function L(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function Ut(e) {
	return Wt(e, !1);
}
function Wt(e, t) {
	return /* @__PURE__ */ L(e) ? e : new Gt(e, t);
}
var Gt = class {
	constructor(e, t) {
		this.dep = new Ke(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ I(e), this._value = t ? e : Vt(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ F(e) || /* @__PURE__ */ Rt(e);
		e = n ? e : /* @__PURE__ */ I(e), O(e, t) && (this._rawValue = e, this._value = n ? e : Vt(e), this.dep.trigger());
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
	return /* @__PURE__ */ Lt(e) ? e : new Proxy(e, qt);
}
var Yt = class {
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
	let { immediate: a, deep: o, once: s, scheduler: l, augmentJob: u, call: f } = i, p = (e) => o ? e : /* @__PURE__ */ F(e) || o === !1 || o === 0 ? nn(e, 1) : nn(e), m, g, _, v, y = !1, b = !1;
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
			Ve(), rn(o, null, 10, [
				e,
				i,
				a
			]), He();
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
var z = null, Cn = null;
function wn(e) {
	let t = z;
	return z = e, Cn = e && e.type.__scopeId || null, t;
}
function Tn(e, t = z, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && ki(-1);
		let i = wn(t), a;
		try {
			a = e(...n);
		} finally {
			wn(i), r._d && ki(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function En(e, n) {
	if (z === null) return e;
	let r = la(z), i = e.dirs ||= [];
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
function Dn(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (Ve(), an(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), He());
	}
}
function On(e, t) {
	if (Y) {
		let n = Y.provides, r = Y.parent && Y.parent.provides;
		r === n && (n = Y.provides = Object.create(r)), n[e] = t;
	}
}
function kn(e, t, n = !1) {
	let r = Ji();
	if (r || Pr) {
		let i = Pr ? Pr._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t;
	}
}
var An = /* @__PURE__ */ Symbol.for("v-scx"), jn = () => kn(An);
function Mn(e, t, n) {
	return Nn(e, t, n);
}
function Nn(e, n, i = t) {
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
	let s = a.shapeFlag & 4 ? la(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ I(v), b = v === t ? i : (e) => Hn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Hn(_, t));
	if (m != null && m !== p) {
		if (Gn(n), g(m)) _[m] = null, b(m) && (v[m] = null);
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
le().requestIdleCallback, le().cancelIdleCallback;
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
			Ve();
			let i = Zi(n), a = an(t, n, e, r);
			return i(), He(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var $n = (e) => (t, n = Y) => {
	(!ea || e === "sp") && Qn(e, (...e) => t(...e), n);
}, er = $n("bm"), tr = $n("m"), nr = $n("bu"), rr = $n("u"), ir = $n("bum"), ar = $n("um"), or = $n("sp"), sr = $n("rtg"), cr = $n("rtc");
function lr(e, t = Y) {
	Qn("ec", e, t);
}
var ur = /* @__PURE__ */ Symbol.for("v-ndc");
function dr(e, t, n, r) {
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
var fr = (e) => e ? $i(e) ? la(e) : fr(e.parent) : null, pr = /* @__PURE__ */ s(/* @__PURE__ */ Object.create(null), {
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
		if (d) return n === "$attrs" && P(e.attrs, "get", ""), d(e);
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
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: ee, renderTracked: te, renderTriggered: ne, errorCaptured: T, serverPrefetch: E, expose: D, inheritAttrs: re, components: ie, directives: O, filters: ae } = t;
	if (u && yr(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Nt(t));
	}
	if (_r = !0, o) for (let e in o) {
		let t = o[e], a = da({
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
			On(t, e[t]);
		});
	}
	f && br(f, e, "c");
	function k(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (k(er, p), k(tr, m), k(nr, g), k(rr, _), k(Jn, y), k(Yn, b), k(lr, T), k(cr, te), k(sr, ne), k(ir, S), k(ar, w), k(or, E), d(D)) if (D.length) {
		let t = e.exposed ||= {};
		D.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	ee && e.render === r && (e.render = ee), re != null && (e.inheritAttrs = re), ie && (e.components = ie), O && (e.directives = O), E && Vn(e);
}
function yr(e, t, n = r) {
	d(e) && (e = Dr(e));
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
function br(e, t, n) {
	an(d(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function xr(e, t, n, r) {
	let i = r.includes(".") ? Fn(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && Mn(i, n);
	} else if (h(e)) Mn(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => xr(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && Mn(i, r, e);
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
var Pr = null, Fr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${T(t)}Modifiers`] || e[`${D(t)}Modifiers`];
function Ir(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && Fr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(oe)));
	let c, l = i[c = ie(n)] || i[c = ie(T(n))];
	!l && o && (l = i[c = ie(D(n))]), l && an(l, e, 6, a);
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
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, D(t)) || u(e, t));
}
function Br(e) {
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
	return n.dirs && (b = zi(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && zn(b, n.transition), v = b, wn(_), v;
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
	n ? e.props = r ? i : /* @__PURE__ */ Pt(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Zr(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ I(i), [c] = e.propsOptions, l = !1;
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
		for (let a in s) (!t || !u(t, a) && ((r = D(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = $r(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !u(t, e)) && (delete a[e], l = !0);
	}
	l && Qe(e.attrs, "set", "");
}
function Qr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (ee(t)) continue;
		let l = n[t], d;
		a && u(a, d = T(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : zr(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ I(r), i = c || t;
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
var ri = (e) => e === "_" || e === "_ctx" || e === "$stable", ii = (e) => d(e) ? e.map(Bi) : [Bi(e)], ai = (e, t, n) => {
	if (t._n) return t;
	let r = Tn((...e) => ii(t(...e)), n);
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
		e ? (ci(r, t, n), n && k(r, "_", e, !0)) : oi(t, r);
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
	let a = le();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Ni(e, t) && (r = ye(e), me(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
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
				ie(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? O(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, A);
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
				n && n._beginPatch(), E(e, t, i, a, o, s, c);
			} finally {
				n && n._endPatch();
			}
		}
	}, te = (e, t, n, r, i, a, s, u) => {
		let d, f, { props: m, shapeFlag: h, transition: g, dirs: _ } = e;
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && T(e.children, d, null, r, i, pi(e, a), s, u), _ && Dn(e, null, r, "created"), ne(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !ee(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Wi(f, r, e);
		}
		_ && Dn(e, null, r, "beforeMount");
		let v = hi(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && V(() => {
			try {
				f && Wi(f, r, e), v && g.enter(d), _ && Dn(e, null, r, "mounted");
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
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? Vi(e[l]) : Bi(e[l]), t, n, r, i, a, o, s);
	}, E = (e, n, r, i, a, o, s) => {
		let l = n.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = n;
		u |= e.patchFlag & 16;
		let m = e.props || t, h = n.props || t, g;
		if (r && mi(r, !1), (g = h.onVnodeBeforeUpdate) && Wi(g, r, n, e), f && Dn(n, e, r, "beforeUpdate"), r && mi(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? D(e.dynamicChildren, d, l, r, i, pi(n, a), o) : s || ue(e, n, l, null, r, i, pi(n, a), o, !1), u > 0) {
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
		((g = h.onVnodeUpdated) || f) && V(() => {
			g && Wi(g, r, n, e), f && Dn(n, e, r, "updated");
		}, i);
	}, D = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === H || !Ni(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
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
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), T(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (D(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && gi(e, t, !0)) : ue(e, t, n, f, i, a, s, c, l);
	}, O = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : k(t, n, r, i, a, o, c) : oe(e, t, c);
	}, k = (e, t, n, r, i, a, o) => {
		let s = e.component = qi(e, r, i);
		if (qn(e) && (s.ctx.renderer = A), ta(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, se, o), !e.el) {
				let r = s.subTree = Ii(wi);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else se(s, e, t, n, i, a, o);
	}, oe = (e, t, n) => {
		let r = t.component = e.component;
		if (Ur(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			ce(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, se = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = vi(e);
					if (n) {
						t && (t.el = c.el, ce(e, t, o)), n.asyncDep.then(() => {
							V(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				mi(e, !1), t ? (t.el = c.el, ce(e, t, o)) : t = c, n && ae(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Wi(d, s, t, c), mi(e, !0);
				let f = Br(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ye(p), e, i, a), t.el = f.el, u === null && Kr(e, f.el), r && V(r, i), (d = t.props && t.props.onVnodeUpdated) && V(() => Wi(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Kn(t);
				if (mi(e, !1), l && ae(l), !m && (o = c && c.onVnodeBeforeMount) && Wi(o, d, t), mi(e, !0), s && Ce) {
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
					V(() => Wi(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Kn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && V(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new De(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => gn(u), mi(e, !0), l();
	}, ce = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Zr(e, t.props, r, n), ui(e, t.children, n), Ve(), yn(e), He();
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
		m & 8 ? (u & 16 && ve(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? fe(l, d, n, r, i, a, o, s, c) : ve(l, i, a, !0) : (u & 8 && p(n, ""), m & 16 && T(d, n, r, i, a, o, s, c));
	}, de = (e, t, r, i, a, o, s, c, l) => {
		e ||= n, t ||= n;
		let u = e.length, d = t.length, f = Math.min(u, d), p;
		for (p = 0; p < f; p++) {
			let n = t[p] = l ? Vi(t[p]) : Bi(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? ve(e, a, o, !0, !1, f) : T(t, r, i, a, o, s, c, l, f);
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
			let w = x ? _i(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || bi(f) : i;
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
			c.move(e, t, n, A);
			return;
		}
		if (c === H) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) pe(u[e], t, n, r);
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
	}, me = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (Ve(), Wn(s, null, n, e, !0), He()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Kn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Wi(_, t, e), u & 6) _e(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && Dn(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, A, r) : l && !l.hasOnce && (a !== H || d > 0 && d & 64) ? ve(l, t, n, !1, !0) : (a === H && d & 384 || !i && u & 16) && ve(c, t, n), r && he(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && V(() => {
			_ && Wi(_, t, e), h && Dn(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, he = (e) => {
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
		yi(c), yi(l), r && ae(r), i.stop(), a && (a.flags |= 8, me(o, e, t, n)), s && V(s, t), V(() => {
			e.isUnmounted = !0;
		}, t);
	}, ve = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) me(e[o], t, n, r, i);
	}, ye = (e) => {
		if (e.shapeFlag & 6) return ye(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[In];
		return n ? h(n) : t;
	}, be = !1, xe = (e, t, n) => {
		let r;
		e == null ? t._vnode && (me(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, be ||= (be = !0, yn(r), bn(), !1);
	}, A = {
		p: v,
		um: me,
		m: pe,
		r: he,
		mt: k,
		mc: T,
		pc: ue,
		pbc: D,
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
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Vi(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && gi(t, a)), a.type === Ci && (a.patchFlag === -1 && (a = i[e] = Vi(a)), a.el = t.el), a.type === wi && !a.el && (a.el = t.el);
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
var Pi = ({ key: e }) => e ?? null, Fi = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ L(e) || h(e) ? {
	i: z,
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
		ctx: z
	};
	return s ? (Hi(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Oi > 0 && !o && U && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && U.push(c), c;
}
var Ii = Li;
function Li(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === ur) && (e = wi), Mi(e)) {
		let r = zi(e, t, !0);
		return n && Hi(r, n), Oi > 0 && !a && U && (r.shapeFlag & 6 ? U[U.indexOf(e)] = r : U.push(r)), r.patchFlag = -2, r;
	}
	if (ua(e) && (e = e.__vccOpts), t) {
		t = Ri(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = he(e)), v(n) && (/* @__PURE__ */ zt(n) && !d(n) && (n = s({}, n)), t.style = ue(n));
	}
	let o = g(e) ? 1 : xi(e) ? 128 : Ln(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return K(e, t, n, r, i, o, a, !0);
}
function Ri(e) {
	return e ? /* @__PURE__ */ zt(e) || Yr(e) ? s({}, e) : e : null;
}
function zi(e, t, n = !1, r = !1) {
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
function J(e = "", t = !1) {
	return t ? (W(), ji(wi, null, e)) : Ii(wi, null, e);
}
function Bi(e) {
	return e == null || typeof e == "boolean" ? Ii(wi) : d(e) ? Ii(H, null, e.slice()) : Mi(e) ? Vi(e) : Ii(Ci, null, String(e));
}
function Vi(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : zi(e);
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
		!r && !Yr(t) ? t._ctx = z : r === 3 && z && (z.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: z
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [q(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Ui(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = he([t.class, r.class]));
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
var Gi = jr(), Ki = 0;
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
var Y = null, Ji = () => Y || z, Yi, Xi;
{
	let e = le(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Yi = t("__VUE_INSTANCE_SETTERS__", (e) => Y = e), Xi = t("__VUE_SSR_SETTERS__", (e) => ea = e);
}
var Zi = (e) => {
	let t = Y;
	return Yi(e), e.scope.on(), () => {
		e.scope.off(), Yi(t);
	};
}, Qi = () => {
	Y && Y.scope.off(), Yi(null);
};
function $i(e) {
	return e.vnode.shapeFlag & 4;
}
var ea = !1;
function ta(e, t = !1, n = !1) {
	t && Xi(t);
	let { props: r, children: i } = e.vnode, a = $i(e);
	Xr(e, r, a, t), li(e, i, n || t);
	let o = a ? na(e, t) : void 0;
	return t && Xi(!1), o;
}
function na(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, hr);
	let { setup: r } = n;
	if (r) {
		Ve();
		let n = e.setupContext = r.length > 1 ? ca(e) : null, i = Zi(e), a = rn(r, e, 0, [e.props, n]), o = y(a);
		if (He(), i(), (o || e.sp) && !Kn(e) && Vn(e), o) {
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
			let t = i.template || Sr(e).template;
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
			vr(e);
		} finally {
			He(), t();
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
	return e.exposed ? e.exposeProxy ||= new Proxy(Jt(Bt(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in pr) return pr[n](e);
		},
		has(e, t) {
			return t in e || t in pr;
		}
	}) : e.proxy;
}
function ua(e) {
	return h(e) && "__vccOpts" in e;
}
var da = (e, t) => /* @__PURE__ */ Xt(e, t, ea), fa = "3.5.34", pa = void 0, ma = typeof window < "u" && window.trustedTypes;
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
var Ca = /* @__PURE__ */ Symbol("_vod"), wa = /* @__PURE__ */ Symbol("_vsh"), Ta = {
	name: "show",
	beforeMount(e, { value: t }, { transition: n }) {
		e[Ca] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : Ea(e, t);
	},
	mounted(e, { value: t }, { transition: n }) {
		n && t && n.enter(e);
	},
	updated(e, { value: t, oldValue: n }, { transition: r }) {
		!t != !n && (r ? t ? (r.beforeEnter(e), Ea(e, !0), r.enter(e)) : r.leave(e, () => {
			Ea(e, !1);
		}) : Ea(e, t));
	},
	beforeUnmount(e, { value: t }) {
		Ea(e, t);
	}
};
function Ea(e, t) {
	e.style.display = t ? e[Ca] : "none", e[wa] = !t;
}
var Da = /* @__PURE__ */ Symbol(""), Oa = /(?:^|;)\s*display\s*:/;
function ka(e, t, n) {
	let r = e.style, i = g(n), a = !1;
	if (n && !i) {
		if (t) if (g(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? ja(r, t, "");
		}
		else for (let e in t) n[e] ?? ja(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? ja(r, i, "") : Fa(e, i, !g(t) && t ? t[i] : void 0, o) || ja(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[Da];
			e && (n += ";" + e), r.cssText = n, a = Oa.test(n);
		}
	} else t && e.removeAttribute("style");
	Ca in e && (e[Ca] = a ? r.display : "", e[wa] && (r.display = "none"));
}
var Aa = /\s*!important$/;
function ja(e, t, n) {
	if (d(n)) n.forEach((n) => ja(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = Pa(e, t);
		Aa.test(n) ? e.setProperty(D(r), n.replace(Aa, ""), "important") : e[r] = n;
	}
}
var Ma = [
	"Webkit",
	"Moz",
	"ms"
], Na = {};
function Pa(e, t) {
	let n = Na[t];
	if (n) return n;
	let r = T(t);
	if (r !== "filter" && r in e) return Na[t] = r;
	r = re(r);
	for (let n = 0; n < Ma.length; n++) {
		let i = Ma[n] + r;
		if (i in e) return Na[t] = i;
	}
	return t;
}
function Fa(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && g(r) && n === r;
}
var Ia = "http://www.w3.org/1999/xlink";
function La(e, t, n, r, i, a = _e(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Ia, t.slice(6, t.length)) : e.setAttributeNS(Ia, t, n) : n == null || a && !ve(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
}
function Ra(e, t, n, r, i) {
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
function za(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function Ba(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var Va = /* @__PURE__ */ Symbol("_vei");
function Ha(e, t, n, r, i = null) {
	let a = e[Va] || (e[Va] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = Wa(t);
		r ? za(e, n, a[t] = Ja(r, i), s) : o && (Ba(e, n, o, s), a[t] = void 0);
	}
}
var Ua = /(?:Once|Passive|Capture)$/;
function Wa(e) {
	let t;
	if (Ua.test(e)) {
		t = {};
		let n;
		for (; n = e.match(Ua);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : D(e.slice(2)), t];
}
var Ga = 0, Ka = /* @__PURE__ */ Promise.resolve(), qa = () => Ga ||= (Ka.then(() => Ga = 0), Date.now());
function Ja(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		an(Ya(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = qa(), n;
}
function Ya(e, t) {
	if (d(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Xa = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Za = (e, t, n, r, i, s) => {
	let c = i === "svg";
	t === "class" ? Sa(e, r, c) : t === "style" ? ka(e, n, r) : a(t) ? o(t) || Ha(e, t, n, r, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Qa(e, t, r, c)) ? (Ra(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && La(e, t, r, c, s, t !== "value")) : e._isVueCE && ($a(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r))) ? Ra(e, T(t), r, s, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), La(e, t, r, c));
};
function Qa(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Xa(t) && h(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Xa(t) && g(n) ? !1 : t in e;
}
function $a(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = T(t);
	return Array.isArray(n) ? n.some((e) => T(e) === r) : Object.keys(n).some((e) => T(e) === r);
}
var eo = {};
/* @__NO_SIDE_EFFECTS__ */
function to(e, t, n) {
	let r = /* @__PURE__ */ Bn(e, t);
	C(r) && (r = s({}, r, t));
	class i extends ro {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var no = typeof HTMLElement < "u" ? HTMLElement : class {}, ro = class e extends no {
	constructor(e, t = {}, n = mo) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== mo ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = se(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[T(e)] = !0);
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : eo, r = T(e);
		t && this._numberProps && this._numberProps[r] && (n = se(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === eo ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(D(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(D(e), t + "") : t || this.removeAttribute(D(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), po(e, this._root);
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
}, io = [
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
}, so = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, co = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = D(n.key);
		if (t.some((e) => e === r || so[e] === r)) return e(n);
	}));
}, lo = /* @__PURE__ */ s({ patchProp: Za }, ba), uo;
function fo() {
	return uo ||= di(lo);
}
var po = ((...e) => {
	fo().render(...e);
}), mo = ((...e) => {
	let t = fo().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = go(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, ho(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function ho(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function go(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/session.ts
var _o, vo;
async function yo(e = {}) {
	return _o && _o.expiresAtMs > Date.now() + 5e3 ? _o.token : (vo ||= xo(e).finally(() => {
		vo = void 0;
	}), vo);
}
function bo() {
	_o = void 0;
}
async function xo(e) {
	let t = e.operatorCode ?? So(), n = e.fetchImpl ?? fetch, r = e.baseUrl ?? "";
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
	return _o = {
		token: a.accessToken,
		expiresAtMs: Date.now() + o
	}, _o.token;
}
function So() {
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
async function X(e, t, n, r, i = {}) {
	let a = `${i.baseUrl ?? ""}/api/ops/${encodeURIComponent(e)}/${encodeURIComponent(t)}/${encodeURIComponent(n)}`, o = { "content-type": "application/json" }, s = i.token ?? await yo();
	s && (o.authorization = `Bearer ${s}`);
	try {
		let e = await fetch(a, {
			method: "POST",
			headers: o,
			body: JSON.stringify(r ?? null),
			signal: i.signal,
			credentials: "include"
		});
		e.status === 401 && bo();
		let t = await e.text();
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
		let r = await yo(), i = { "Content-Type": "application/json" };
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
		a.status === 401 && bo();
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
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var ko = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], Ao = typeof navigator == "object" ? navigator.platform : "", jo = /Mac|iPod|iPhone|iPad/.test(Ao), Mo = jo ? "Meta" : "Control", No = Ao === "Win32" ? ["Control", "Alt"] : jo ? ["Alt"] : [];
function Po(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || No.includes(t) && e.getModifierState("AltGraph"));
}
function Fo(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? Mo : e;
		}), n];
	});
}
function Io(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !Po(e, t);
	}) || ko.find(function(t) {
		return !n.includes(t) && r !== t && Po(e, t);
	}));
}
function Lo(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [Fo(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			Io(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : Po(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function Ro(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = Lo(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function zo(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function Bo(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function Vo(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (Bo(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			zo(e.target) || r(e);
		};
	}
	return t;
}
function Ho(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = Vo(e), i = () => {
		n ||= Ro(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? Mn(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), ar(a);
}
//#endregion
//#region node_modules/.bun/marked@18.0.4/node_modules/marked/lib/marked.esm.js
function Uo() {
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
var Wo = Uo();
function Go(e) {
	Wo = e;
}
var Ko = { exec: () => null };
function qo(e) {
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
var Jo = ((e = "") => {
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
	nextBulletRegex: qo((e) => RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),
	hrRegex: qo((e) => RegExp(`^ {0,${e}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)),
	fencesBeginRegex: qo((e) => RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),
	headingBeginRegex: qo((e) => RegExp(`^ {0,${e}}#`)),
	htmlBeginRegex: qo((e) => RegExp(`^ {0,${e}}<(?:[a-z].*>|!--)`, "i")),
	blockquoteBeginRegex: qo((e) => RegExp(`^ {0,${e}}>`))
}, Yo = /^(?:[ \t]*(?:\n|$))+/, Xo = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Zo = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Qo = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, $o = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, es = / {0,3}(?:[*+-]|\d{1,9}[.)])/, ts = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, ns = Z(ts).replace(/bull/g, es).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), rs = Z(ts).replace(/bull/g, es).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), is = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, as = /^[^\n]+/, os = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, ss = Z(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", os).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), cs = Z(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, es).getRegex(), ls = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", us = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, ds = Z("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", us).replace("tag", ls).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), fs = Z(is).replace("hr", Qo).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ls).getRegex(), ps = {
	blockquote: Z(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", fs).getRegex(),
	code: Xo,
	def: ss,
	fences: Zo,
	heading: $o,
	hr: Qo,
	html: ds,
	lheading: ns,
	list: cs,
	newline: Yo,
	paragraph: fs,
	table: Ko,
	text: as
}, ms = Z("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Qo).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ls).getRegex(), hs = {
	...ps,
	lheading: rs,
	table: ms,
	paragraph: Z(is).replace("hr", Qo).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ms).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ls).getRegex()
}, gs = {
	...ps,
	html: Z("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", us).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: Ko,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: Z(is).replace("hr", Qo).replace("heading", " *#{1,6} *[^\n]").replace("lheading", ns).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, _s = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, vs = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, ys = /^( {2,}|\\)\n(?!\s*$)/, bs = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, xs = /[\p{P}\p{S}]/u, Ss = /[\s\p{P}\p{S}]/u, Cs = /[^\s\p{P}\p{S}]/u, ws = Z(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Ss).getRegex(), Ts = /(?!~)[\p{P}\p{S}]/u, Es = /(?!~)[\s\p{P}\p{S}]/u, Ds = /(?:[^\s\p{P}\p{S}]|~)/u, Os = Z(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Jo ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), ks = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/, As = Z(ks, "u").replace(/punct/g, xs).getRegex(), js = Z(ks, "u").replace(/punct/g, Ts).getRegex(), Ms = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", Ns = Z(Ms, "gu").replace(/notPunctSpace/g, Cs).replace(/punctSpace/g, Ss).replace(/punct/g, xs).getRegex(), Ps = Z(Ms, "gu").replace(/notPunctSpace/g, Ds).replace(/punctSpace/g, Es).replace(/punct/g, Ts).getRegex(), Fs = Z("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, Cs).replace(/punctSpace/g, Ss).replace(/punct/g, xs).getRegex(), Is = Z(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, xs).getRegex(), Ls = Z("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Cs).replace(/punctSpace/g, Ss).replace(/punct/g, xs).getRegex(), Rs = Z(/\\(punct)/, "gu").replace(/punct/g, xs).getRegex(), zs = Z(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Bs = Z(us).replace("(?:-->|$)", "-->").getRegex(), Vs = Z("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Bs).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Hs = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/, Us = Z(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", Hs).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Ws = Z(/^!?\[(label)\]\[(ref)\]/).replace("label", Hs).replace("ref", os).getRegex(), Gs = Z(/^!?\[(ref)\](?:\[\])?/).replace("ref", os).getRegex(), Ks = Z("reflink|nolink(?!\\()", "g").replace("reflink", Ws).replace("nolink", Gs).getRegex(), qs = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, Js = {
	_backpedal: Ko,
	anyPunctuation: Rs,
	autolink: zs,
	blockSkip: Os,
	br: ys,
	code: vs,
	del: Ko,
	delLDelim: Ko,
	delRDelim: Ko,
	emStrongLDelim: As,
	emStrongRDelimAst: Ns,
	emStrongRDelimUnd: Fs,
	escape: _s,
	link: Us,
	nolink: Gs,
	punctuation: ws,
	reflink: Ws,
	reflinkSearch: Ks,
	tag: Vs,
	text: bs,
	url: Ko
}, Ys = {
	...Js,
	link: Z(/^!?\[(label)\]\((.*?)\)/).replace("label", Hs).getRegex(),
	reflink: Z(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Hs).getRegex()
}, Xs = {
	...Js,
	emStrongRDelimAst: Ps,
	emStrongLDelim: js,
	delLDelim: Is,
	delRDelim: Ls,
	url: Z(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", qs).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: Z(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", qs).getRegex()
}, Zs = {
	...Xs,
	br: Z(ys).replace("{2,}", "*").getRegex(),
	text: Z(Xs.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Qs = {
	normal: ps,
	gfm: hs,
	pedantic: gs
}, $s = {
	normal: Js,
	gfm: Xs,
	breaks: Zs,
	pedantic: Ys
}, ec = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, tc = (e) => ec[e];
function nc(e, t) {
	if (t) {
		if (Q.escapeTest.test(e)) return e.replace(Q.escapeReplace, tc);
	} else if (Q.escapeTestNoEncode.test(e)) return e.replace(Q.escapeReplaceNoEncode, tc);
	return e;
}
function rc(e) {
	try {
		e = encodeURI(e).replace(Q.percentDecode, "%");
	} catch {
		return null;
	}
	return e;
}
function ic(e, t) {
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
function ac(e, t, n) {
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
function oc(e) {
	let t = e.split("\n"), n = t.length - 1;
	for (; n >= 0 && Q.blankLine.test(t[n]);) n--;
	return t.length - n <= 2 ? e : t.slice(0, n + 1).join("\n");
}
function sc(e, t) {
	if (e.indexOf(t[1]) === -1) return -1;
	let n = 0;
	for (let r = 0; r < e.length; r++) if (e[r] === "\\") r++;
	else if (e[r] === t[0]) n++;
	else if (e[r] === t[1] && (n--, n < 0)) return r;
	return n > 0 ? -2 : -1;
}
function cc(e, t = 0) {
	let n = t, r = "";
	for (let t of e) if (t === "	") {
		let e = 4 - n % 4;
		r += " ".repeat(e), n += e;
	} else r += t, n++;
	return r;
}
function lc(e, t, n, r, i) {
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
function uc(e, t, n) {
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
var dc = class {
	options;
	rules;
	lexer;
	constructor(e) {
		this.options = e || Wo;
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
			let e = this.options.pedantic ? t[0] : oc(t[0]);
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
			let e = t[0], n = uc(e, t[3] || "", this.rules);
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
				let t = ac(e, "#");
				(this.options.pedantic || !t || this.rules.other.endingSpaceChar.test(t)) && (e = t.trim());
			}
			return {
				type: "heading",
				raw: ac(t[0], "\n"),
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
			raw: ac(t[0], "\n")
		};
	}
	blockquote(e) {
		let t = this.rules.block.blockquote.exec(e);
		if (t) {
			let e = ac(t[0], "\n").split("\n"), n = "", r = "", i = [];
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
				let c = cc(t[2].split("\n", 1)[0], t[1].length), l = e.split("\n", 1)[0], u = !c.trim(), d = 0;
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
			let e = oc(t[0]);
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
				raw: ac(t[0], "\n"),
				href: n,
				title: r
			};
		}
	}
	table(e) {
		let t = this.rules.block.table.exec(e);
		if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
		let n = ic(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [], a = {
			type: "table",
			raw: ac(t[0], "\n"),
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
			for (let e of i) a.rows.push(ic(e, a.header.length).map((e, t) => ({
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
				raw: ac(t[0], "\n"),
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
				let t = ac(e.slice(0, -1), "\\");
				if ((e.length - t.length) % 2 == 0) return;
			} else {
				let e = sc(t[2], "()");
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
			return n = n.trim(), this.rules.other.startAngleBracket.test(n) && (n = this.options.pedantic && !this.rules.other.endAngleBracket.test(e) ? n.slice(1) : n.slice(1, -1)), lc(t, {
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
			return lc(n, e, n[0], this.lexer, this.rules);
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
}, fc = class e {
	tokens;
	options;
	state;
	inlineQueue;
	tokenizer;
	constructor(e) {
		this.tokens = [], this.tokens.links = Object.create(null), this.options = e || Wo, this.options.tokenizer = this.options.tokenizer || new dc(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			top: !0
		};
		let t = {
			other: Q,
			block: Qs.normal,
			inline: $s.normal
		};
		this.options.pedantic ? (t.block = Qs.pedantic, t.inline = $s.pedantic) : this.options.gfm && (t.block = Qs.gfm, this.options.breaks ? t.inline = $s.breaks : t.inline = $s.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: Qs,
			inline: $s
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
}, pc = class {
	options;
	parser;
	constructor(e) {
		this.options = e || Wo;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: t, escaped: n }) {
		let r = (t || "").match(Q.notSpaceStart)?.[0], i = e.replace(Q.endingNewline, "") + "\n";
		return r ? "<pre><code class=\"language-" + nc(r) + "\">" + (n ? i : nc(i, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? i : nc(i, !0)) + "</code></pre>\n";
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
		return `<code>${nc(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: t, tokens: n }) {
		let r = this.parser.parseInline(n), i = rc(e);
		if (i === null) return r;
		e = i;
		let a = "<a href=\"" + e + "\"";
		return t && (a += " title=\"" + nc(t) + "\""), a += ">" + r + "</a>", a;
	}
	image({ href: e, title: t, text: n, tokens: r }) {
		r && (n = this.parser.parseInline(r, this.parser.textRenderer));
		let i = rc(e);
		if (i === null) return nc(n);
		e = i;
		let a = `<img src="${e}" alt="${nc(n)}"`;
		return t && (a += ` title="${nc(t)}"`), a += ">", a;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : nc(e.text);
	}
}, mc = class {
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
}, hc = class e {
	options;
	renderer;
	textRenderer;
	constructor(e) {
		this.options = e || Wo, this.options.renderer = this.options.renderer || new pc(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new mc();
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
}, gc = class {
	options;
	block;
	constructor(e) {
		this.options = e || Wo;
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
		return e ? fc.lex : fc.lexInline;
	}
	provideParser(e = this.block) {
		return e ? hc.parse : hc.parseInline;
	}
}, _c = class {
	defaults = Uo();
	options = this.setOptions;
	parse = this.parseMarkdown(!0);
	parseInline = this.parseMarkdown(!1);
	Parser = hc;
	Renderer = pc;
	TextRenderer = mc;
	Lexer = fc;
	Tokenizer = dc;
	Hooks = gc;
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
				let t = this.defaults.renderer || new pc(this.defaults);
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
				let t = this.defaults.tokenizer || new dc(this.defaults);
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
				let t = this.defaults.hooks || new gc();
				for (let n in e.hooks) {
					if (!(n in t)) throw Error(`hook '${n}' does not exist`);
					if (["options", "block"].includes(n)) continue;
					let r = n, i = e.hooks[r], a = t[r];
					gc.passThroughHooks.has(n) ? t[r] = (e) => {
						if (this.defaults.async && gc.passThroughHooksRespectAsync.has(n)) return (async () => {
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
		return fc.lex(e, t ?? this.defaults);
	}
	parser(e, t) {
		return hc.parse(e, t ?? this.defaults);
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
				let n = i.hooks ? await i.hooks.preprocess(t) : t, r = await (i.hooks ? await i.hooks.provideLexer(e) : e ? fc.lex : fc.lexInline)(n, i), a = i.hooks ? await i.hooks.processAllTokens(r) : r;
				i.walkTokens && await Promise.all(this.walkTokens(a, i.walkTokens));
				let o = await (i.hooks ? await i.hooks.provideParser(e) : e ? hc.parse : hc.parseInline)(a, i);
				return i.hooks ? await i.hooks.postprocess(o) : o;
			})().catch(a);
			try {
				i.hooks && (t = i.hooks.preprocess(t));
				let n = (i.hooks ? i.hooks.provideLexer(e) : e ? fc.lex : fc.lexInline)(t, i);
				i.hooks && (n = i.hooks.processAllTokens(n)), i.walkTokens && this.walkTokens(n, i.walkTokens);
				let r = (i.hooks ? i.hooks.provideParser(e) : e ? hc.parse : hc.parseInline)(n, i);
				return i.hooks && (r = i.hooks.postprocess(r)), r;
			} catch (e) {
				return a(e);
			}
		};
	}
	onError(e, t) {
		return (n) => {
			if (n.message += "\nPlease report this to https://github.com/markedjs/marked.", e) {
				let e = "<p>An error occurred:</p><pre>" + nc(n.message + "", !0) + "</pre>";
				return t ? Promise.resolve(e) : e;
			}
			if (t) return Promise.reject(n);
			throw n;
		};
	}
}, vc = new _c();
function $(e, t) {
	return vc.parse(e, t);
}
$.options = $.setOptions = function(e) {
	return vc.setOptions(e), $.defaults = vc.defaults, Go($.defaults), $;
}, $.getDefaults = Uo, $.defaults = Wo, $.use = function(...e) {
	return vc.use(...e), $.defaults = vc.defaults, Go($.defaults), $;
}, $.walkTokens = function(e, t) {
	return vc.walkTokens(e, t);
}, $.parseInline = vc.parseInline, $.Parser = hc, $.parser = hc.parse, $.Renderer = pc, $.TextRenderer = mc, $.Lexer = fc, $.lexer = fc.lex, $.Tokenizer = dc, $.Hooks = gc, $.parse = $, $.options, $.setOptions, $.use, $.walkTokens, $.parseInline, hc.parse, fc.lex;
//#endregion
//#region packages/sdk-vue/src/markdown.ts
var yc = new Set(/* @__PURE__ */ "h1.h2.h3.h4.h5.h6.p.ul.ol.li.strong.em.b.i.code.pre.a.img.br.hr.blockquote.table.thead.tbody.tfoot.tr.th.td.dl.dt.dd.details.summary.sup.sub.del.ins.s.mark.abbr.cite.q.figure.figcaption.caption.span.div.section.article.aside.header.footer.nav.main".split(".")), bc = new Set([
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
]), xc = {
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
}, Sc = /^\s*(?:javascript|vbscript|data)\s*:/i;
function Cc(e) {
	return !Sc.test(e);
}
function wc(e) {
	return e.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Tc(e, t) {
	if (!t.trim()) return "";
	let n = [], r = /\s+([a-zA-Z][a-zA-Z0-9_:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=>]+)))?/g, i, a = !1, o = [];
	for (; (i = r.exec(t)) !== null;) {
		let t = (i[1] ?? "").toLowerCase(), n = i[2] ?? i[3] ?? i[4] ?? "";
		if (t.startsWith("on")) continue;
		let r = xc[e];
		(bc.has(t) || r && r.has(t)) && ((t === "href" || t === "src") && !Cc(n) || (t === "rel" && (a = !0), o.push({
			name: t,
			value: n
		})));
	}
	for (let { name: e, value: t } of o) n.push(" " + e + "=\"" + wc(t) + "\"");
	return e === "a" && !a && n.push(" rel=\"noopener noreferrer\""), n.join("");
}
var Ec = [
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
], Dc = new Set([
	"input",
	"button",
	"meta",
	"link",
	"base",
	"applet"
]);
function Oc(e) {
	let t = e;
	for (let e of Ec) {
		let n = RegExp("<" + e + "(\\s[^>]*)?>([\\s\\S]*?)<\\/" + e + ">", "gi");
		t = t.replace(n, "");
		let r = RegExp("<" + e + "(\\s[^>]*)?>", "gi");
		t = t.replace(r, "");
		let i = RegExp("<\\/" + e + ">", "gi");
		t = t.replace(i, "");
	}
	return t = t.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?(\/?)>/g, (e, t, n, r, i) => {
		let a = n.toLowerCase();
		if (Dc.has(a) || !yc.has(a)) return "";
		let o = Tc(a, r ?? ""), s = i ? " /" : "";
		return "<" + t + a + o + s + ">";
	}), t;
}
function kc(e, t) {
	let n = encodeURIComponent(t);
	return e.split(/(<code[^>]*>[\s\S]*?<\/code>)/).map((e, t) => t % 2 == 1 ? e : e.replace(/(^|[^\w&])#(\d+)\b/g, (e, t, r) => t + "<a href=\"/x/issues/" + n + "/" + r + "\" class=\"issue-ref\">#" + r + "</a>")).join("");
}
function Ac(e, t = {}) {
	if (!e) return "";
	let n = Oc(new _c().parse(e, { async: !1 }));
	return t.workspaceId && (n = kc(n, t.workspaceId)), n;
}
function jc(e, t = 280) {
	let n = e.replace(/\s+/g, " ").trim();
	return n.length <= t ? n : n.slice(0, t) + "…";
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function Mc(e) {
	Nc(e.tagName, e.component);
	let t = /* @__PURE__ */ to(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(Fc(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function Nc(e, t) {
	if (typeof document > "u") return;
	let n = Pc(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function Pc(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function Fc(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_docs/dist/ext_docs.client.ts
var Ic = {
	ping: async (e) => X("ext_docs", "docs", "ping", e),
	summarizeDoc: async (e) => X("ext_docs", "docs", "summarize-doc", e),
	summarizeCatalog: async (e) => X("ext_docs", "docs", "summarize-catalog", e),
	typeBoard: async (e) => X("ext_docs", "docs", "type-board", e),
	statusBoard: async (e) => X("ext_docs", "docs", "status-board", e),
	ownerBoard: async (e) => X("ext_docs", "docs", "owner-board", e),
	tagBoard: async (e) => X("ext_docs", "docs", "tag-board", e),
	projectBoard: async (e) => X("ext_docs", "docs", "project-board", e),
	summarizeScenarios: async (e) => X("ext_docs", "docs", "summarize-scenarios", e),
	scenarioBoard: async (e) => X("ext_docs", "docs", "scenario-board", e),
	summarizeChecklists: async (e) => X("ext_docs", "docs", "summarize-checklists", e),
	summarizeReferences: async (e) => X("ext_docs", "docs", "summarize-references", e),
	traceabilityBoard: async (e) => X("ext_docs", "docs", "traceability-board", e),
	summarizeOutline: async (e) => X("ext_docs", "docs", "summarize-outline", e),
	summarizeDecisions: async (e) => X("ext_docs", "docs", "summarize-decisions", e),
	decisionBoard: async (e) => X("ext_docs", "docs", "decision-board", e),
	readinessBoard: async (e) => X("ext_docs", "docs", "readiness-board", e),
	handoffBoard: async (e) => X("ext_docs", "docs", "handoff-board", e),
	implementationBoard: async (e) => X("ext_docs", "docs", "implementation-board", e)
}, Lc = {
	class: "docs-panel",
	"data-smoke": "docs-panel"
}, Rc = { class: "docs-head" }, zc = { class: "title-block" }, Bc = { class: "muted" }, Vc = {
	key: 0,
	class: "muted error",
	role: "alert"
}, Hc = {
	key: 1,
	class: "muted error",
	role: "alert"
}, Uc = {
	key: 2,
	class: "docs-workbench",
	"data-smoke": "docs-workbench"
}, Wc = { class: "docs-workbench-head" }, Gc = { class: "docs-workbench-title" }, Kc = { class: "muted" }, qc = {
	class: "docs-board-tabs",
	"aria-label": "Docs workbench views"
}, Jc = ["aria-pressed", "onClick"], Yc = {
	key: 0,
	class: "muted docs-board-status"
}, Xc = {
	key: 1,
	class: "muted error docs-board-status",
	role: "alert"
}, Zc = ["data-board"], Qc = { class: "docs-board-column-head" }, $c = {
	key: 0,
	class: "docs-board-cards"
}, el = { class: "docs-board-card-head" }, tl = { class: "docs-board-type" }, nl = {
	key: 0,
	class: "docs-board-path"
}, rl = {
	key: 1,
	class: "docs-board-metrics"
}, il = {
	key: 1,
	class: "muted docs-board-empty"
}, al = { class: "docs-project-head" }, ol = { class: "docs-project-root" }, sl = { class: "docs-type-head" }, cl = { class: "docs-type-key" }, ll = { class: "docs-type-label" }, ul = { class: "docs-type-scope" }, dl = { class: "muted docs-type-count" }, fl = {
	key: 0,
	class: "docs-type-desc"
}, pl = {
	key: 1,
	class: "docs-type-props"
}, ml = {
	key: 2,
	class: "docs-files"
}, hl = [
	"onClick",
	"onFocus",
	"onMouseenter",
	"onKeydown"
], gl = { class: "docs-file-head" }, _l = { class: "docs-file-caret" }, vl = { class: "docs-file-title" }, yl = { class: "docs-file-path" }, bl = {
	key: 0,
	class: "docs-file-front"
}, xl = {
	key: 1,
	class: "docs-file-body"
}, Sl = ["innerHTML"], Cl = {
	key: 3,
	class: "muted no-files"
}, wl = /* @__PURE__ */ ((e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
})(/* @__PURE__ */ Bn({
	__name: "DocsPanel",
	props: {
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] },
		repositorySegments: { type: Array },
		projectName: { type: String }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ Ut("loading"), r = /* @__PURE__ */ Ut(null), i = /* @__PURE__ */ Ut(null), a = /* @__PURE__ */ Ut([]), o = da(() => i.value?.projects ?? []), s = da(() => t.projectName ? o.value.filter((e) => e.name === t.projectName) : o.value), c = da(() => {
			let e = 0;
			for (let t of s.value) for (let n of Object.values(t.docs ?? {})) e += E(t, n).length;
			return e;
		}), l = /* @__PURE__ */ Ut(null), u = /* @__PURE__ */ Ut(null), d = /* @__PURE__ */ Ut("idle"), f = /* @__PURE__ */ Ut(null), p = /* @__PURE__ */ Ut("status"), m = /* @__PURE__ */ Ut(_()), h = [
			{
				id: "status",
				label: "Status"
			},
			{
				id: "scenario",
				label: "Scenarios"
			},
			{
				id: "readiness",
				label: "Readiness"
			},
			{
				id: "decision",
				label: "Review"
			},
			{
				id: "handoff",
				label: "Handoff"
			},
			{
				id: "traceability",
				label: "Traceability"
			},
			{
				id: "implementation",
				label: "Implementation"
			}
		], g = da(() => m.value[p.value]);
		function _() {
			return {
				status: null,
				scenario: null,
				readiness: null,
				decision: null,
				handoff: null,
				traceability: null,
				implementation: null
			};
		}
		function v() {
			m.value = _(), d.value = "idle", f.value = null;
		}
		function y(e) {
			return l.value === e;
		}
		function b(e) {
			l.value = y(e) ? null : e, u.value = e;
		}
		function x(e) {
			u.value = e;
		}
		let S = da(() => {
			let e = [];
			for (let t of s.value) for (let n of D(t)) for (let r of E(t, n.type)) e.push(r.path);
			return e;
		});
		function C(e) {
			let t = S.value;
			if (t.length === 0) return;
			let n = u.value, r = n ? t.indexOf(n) : -1;
			u.value = t[Math.max(0, Math.min(t.length - 1, r + e))] ?? null;
		}
		Ho({
			Escape: (e) => {
				l.value &&= (e.preventDefault(), null);
			},
			j: (e) => {
				u.value && (e.preventDefault(), C(1));
			},
			ArrowDown: (e) => {
				u.value && (e.preventDefault(), C(1));
			},
			k: (e) => {
				u.value && (e.preventDefault(), C(-1));
			},
			ArrowUp: (e) => {
				u.value && (e.preventDefault(), C(-1));
			},
			Enter: (e) => {
				u.value && (e.preventDefault(), b(u.value));
			},
			" ": (e) => {
				u.value && (e.preventDefault(), b(u.value));
			}
		}), tr(() => {
			w();
		}), Mn([() => t.repositoryPath, () => t.projectName], () => void w());
		async function w() {
			n.value = "loading", r.value = null, v();
			try {
				let e = t.repositorySegments ?? [];
				if (e.length === 0) {
					i.value = null, a.value = [], n.value = "ready";
					return;
				}
				let r = (await Do().query("query Q($segments: [String!]!) {\n        workspace { repositoryByPath(segments: $segments) { comtryaConfig blobs { path preview size } } }\n      }", { segments: e })).workspace?.repositoryByPath ?? null;
				i.value = r?.comtryaConfig ?? null, a.value = r?.blobs ?? [], n.value = "ready", oe();
			} catch (e) {
				n.value = "error", r.value = e instanceof Error ? e.message : String(e), v();
			}
		}
		function ee(e, t) {
			let n = (e ?? "").replace(/\/+$/g, "").replace(/^\.\/?/, ""), r = (t ?? "").replace(/^\/+/g, "").replace(/^\.\//, "");
			return n ? !r || r === "." ? n : `${n}/${r}` : r;
		}
		function te(e, t) {
			return ee((e.root ?? "").replace(/\/+$/g, ""), t.slug ?? "");
		}
		function ne(e) {
			let t = e ?? "";
			if (!t.startsWith("---")) return {
				props: {},
				body: t
			};
			let n = t.indexOf("\n---", 3);
			if (n < 0) return {
				props: {},
				body: t
			};
			let r = t.slice(3, n).trim(), i = t.slice(n + 4).replace(/^\n/, ""), a = {};
			for (let e of r.split("\n")) {
				let t = e.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
				if (!t) continue;
				let n = t[1];
				a[n] = T(t[2].trim());
			}
			return {
				props: a,
				body: i
			};
		}
		function T(e) {
			let t = e.trim();
			return t ? t === "true" || t === "false" ? t === "true" : /^-?\d+$/.test(t) ? Number(t) : t.startsWith("[") && t.endsWith("]") ? t.slice(1, -1).split(",").map((e) => e.trim().replace(/^"(.*)"$/, "$1")).filter((e) => e.length > 0) : t.replace(/^"(.*)"$/, "$1") : "";
		}
		function E(e, t) {
			let n = te(e, t), r = n ? `${n}/` : "";
			return a.value.filter((e) => !e.path || !e.path.endsWith(".mdx") && !e.path.endsWith(".md") ? !1 : r ? e.path.startsWith(r) : !0).map((e) => {
				let { props: t, body: n } = ne(e.preview), r = typeof t.title == "string" && t.title.length > 0 ? t.title : (e.path ?? "").split("/").pop() ?? e.path ?? "(untitled)", i = (e.path ?? "").split("/").pop() ?? e.path ?? "";
				return {
					path: e.path ?? "",
					fileName: i,
					title: r,
					frontMatter: t,
					body: n,
					preview: e.preview ?? ""
				};
			}).sort((e, t) => e.fileName.localeCompare(t.fileName));
		}
		function D(e) {
			return e.docs ? Object.entries(e.docs).map(([e, t]) => ({
				key: e,
				type: t
			})).sort((e, t) => e.key.localeCompare(t.key)) : [];
		}
		function re(e) {
			return e.properties ? Object.entries(e.properties).map(([e, t]) => ({
				name: e,
				spec: t
			})) : [];
		}
		function ie(e) {
			return typeof e == "string" ? e : e == null ? "any" : typeof e == "object" ? Object.keys(e).join(" | ") || "object" : String(e);
		}
		function O(e) {
			return e == null ? "·" : Array.isArray(e) ? e.map(O).join(" · ") : typeof e == "object" ? Object.entries(e).map(([e, t]) => `${e}=${O(t)}`).join(" · ") : String(e);
		}
		function ae() {
			let e = [];
			for (let t of s.value) for (let n of D(t)) e.push({
				projectName: t.name ?? "(unnamed project)",
				typeName: n.key,
				label: n.type.label || n.key,
				description: n.type.description ?? null,
				slug: n.type.slug ?? "",
				files: E(t, n.type).map((e) => ({
					path: e.path,
					preview: e.preview
				}))
			});
			return { types: e };
		}
		function k(e, t) {
			if (e.ok) return e.value;
			throw Error(`${t}: ${e.error.message}`);
		}
		async function oe() {
			let e = ae();
			if (!e.types.some((e) => e.files.length > 0)) {
				m.value = _(), d.value = "ready", f.value = null;
				return;
			}
			d.value = "loading", f.value = null;
			try {
				let [t, n, r, i, a, o, s] = await Promise.all([
					Ic.statusBoard(e),
					Ic.scenarioBoard(e),
					Ic.readinessBoard(e),
					Ic.decisionBoard(e),
					Ic.handoffBoard(e),
					Ic.traceabilityBoard(e),
					Ic.implementationBoard(e)
				]);
				m.value = {
					status: k(t, "status board"),
					scenario: k(n, "scenario board"),
					readiness: k(r, "readiness board"),
					decision: k(i, "review board"),
					handoff: k(a, "handoff board"),
					traceability: k(o, "traceability board"),
					implementation: k(s, "implementation board")
				}, d.value = "ready";
			} catch (e) {
				m.value = _(), d.value = "error", f.value = e instanceof Error ? e.message : String(e);
			}
		}
		function se(e) {
			return m.value[e]?.totalDocs ?? 0;
		}
		function ce(e) {
			return e.typeLabel || e.typeName || "doc";
		}
		function le(e) {
			let t = [];
			return e.status && t.push({
				label: "status",
				value: e.status
			}), e.projectName && t.push({
				label: "project",
				value: e.projectName
			}), e.owner && t.push({
				label: "owner",
				value: e.owner
			}), e.feature && t.push({
				label: "feature",
				value: e.feature
			}), Array.isArray(e.tags) && e.tags.length > 0 && t.push({
				label: "tags",
				value: e.tags.join(", ")
			}), typeof e.scenarioCount == "number" && t.push({
				label: "scenarios",
				value: String(e.scenarioCount)
			}), typeof e.stepCount == "number" && t.push({
				label: "steps",
				value: String(e.stepCount)
			}), typeof e.scenariosWithoutSteps == "number" && e.scenariosWithoutSteps > 0 && t.push({
				label: "empty",
				value: String(e.scenariosWithoutSteps)
			}), typeof e.checklistTotal == "number" && t.push({
				label: "checklist",
				value: `${e.checklistChecked ?? 0}/${e.checklistTotal}`
			}), typeof e.referenceCount == "number" && t.push({
				label: "refs",
				value: String(e.referenceCount)
			}), typeof e.implementationReferenceCount == "number" && t.push({
				label: "impl refs",
				value: String(e.implementationReferenceCount)
			}), typeof e.docReferenceCount == "number" && t.push({
				label: "doc refs",
				value: String(e.docReferenceCount)
			}), typeof e.otherReferenceCount == "number" && e.otherReferenceCount > 0 && t.push({
				label: "other refs",
				value: String(e.otherReferenceCount)
			}), typeof e.decisionCount == "number" && t.push({
				label: "decisions",
				value: String(e.decisionCount)
			}), typeof e.openQuestionCount == "number" && t.push({
				label: "questions",
				value: String(e.openQuestionCount)
			}), typeof e.riskCount == "number" && t.push({
				label: "risks",
				value: String(e.riskCount)
			}), t;
		}
		return (t, a) => (W(), G("section", Lc, [
			K("header", Rc, [K("div", zc, [a[8] ||= K("h2", null, "Docs", -1), K("span", Bc, [n.value === "loading" ? (W(), G(H, { key: 0 }, [q("reading repo CUE config…")], 64)) : n.value === "error" ? (W(), G(H, { key: 1 }, [q("unavailable")], 64)) : c.value === 0 ? (W(), G(H, { key: 2 }, [
				a[0] ||= q(" No MDX docs declared. Add a ", -1),
				a[1] ||= K("code", null, "docs", -1),
				a[2] ||= q(" block to a Project in ", -1),
				a[3] ||= K("code", null, "package comtrya", -1),
				a[4] ||= q(" to surface them here. ", -1)
			], 64)) : (W(), G(H, { key: 3 }, [
				q(A(c.value) + " doc", 1),
				c.value === 1 ? J("", !0) : (W(), G(H, { key: 0 }, [q("s")], 64)),
				q(" across " + A(s.value.length) + " project", 1),
				s.value.length === 1 ? J("", !0) : (W(), G(H, { key: 1 }, [q("s")], 64)),
				a[5] ||= q(" · shape from ", -1),
				a[6] ||= K("code", null, "ext_docs", -1),
				a[7] ||= q("'s registered CUE schema ", -1)
			], 64))])])]),
			n.value === "error" ? (W(), G("p", Vc, A(r.value), 1)) : i.value?.error ? (W(), G("p", Hc, A(i.value.error), 1)) : J("", !0),
			n.value === "ready" && c.value > 0 ? (W(), G("section", Uc, [K("header", Wc, [K("div", Gc, [a[9] ||= K("h3", null, "Product review", -1), K("span", Kc, [q(A(g.value?.totalDocs ?? c.value) + " doc", 1), (g.value?.totalDocs ?? c.value) === 1 ? J("", !0) : (W(), G(H, { key: 0 }, [q("s")], 64))])]), K("nav", qc, [(W(), G(H, null, dr(h, (e) => K("button", {
				key: e.id,
				type: "button",
				class: he(["docs-board-tab", { active: p.value === e.id }]),
				"aria-pressed": p.value === e.id,
				onClick: (t) => p.value = e.id
			}, [K("span", null, A(e.label), 1), K("strong", null, A(se(e.id)), 1)], 10, Jc)), 64))])]), d.value === "loading" ? (W(), G("p", Yc, " Loading docs board… ")) : d.value === "error" ? (W(), G("p", Xc, A(f.value), 1)) : g.value ? (W(), G("div", {
				key: 2,
				class: "docs-board",
				"data-board": p.value
			}, [(W(!0), G(H, null, dr(g.value.columns, (e) => (W(), G("section", {
				key: e.key,
				class: "docs-board-column"
			}, [K("header", Qc, [K("h4", null, A(e.label), 1), K("span", null, A(e.count), 1)]), e.docs.length > 0 ? (W(), G("ol", $c, [(W(!0), G(H, null, dr(e.docs, (e) => (W(), G("li", {
				key: e.path,
				class: "docs-board-card"
			}, [
				K("header", el, [K("span", tl, A(ce(e)), 1), K("strong", null, A(e.title || e.path), 1)]),
				e.path ? (W(), G("code", nl, A(e.path), 1)) : J("", !0),
				le(e).length > 0 ? (W(), G("dl", rl, [(W(!0), G(H, null, dr(le(e), (t) => (W(), G(H, { key: `${e.path}-${t.label}` }, [K("dt", null, A(t.label), 1), K("dd", null, A(t.value), 1)], 64))), 128))])) : J("", !0)
			]))), 128))])) : (W(), G("p", il, "No docs"))]))), 128))], 8, Zc)) : J("", !0)])) : J("", !0),
			(W(!0), G(H, null, dr(s.value, (t) => En((W(), G("article", {
				key: t.name,
				class: "docs-project"
			}, [K("header", al, [K("h3", null, A(t.name), 1), K("code", ol, A(t.root || "<repo root>") + "/", 1)]), (W(!0), G(H, null, dr(D(t), (n) => (W(), G("section", {
				key: n.key,
				class: "docs-type"
			}, [
				K("header", sl, [
					K("code", cl, A(n.key), 1),
					K("span", ll, A(n.type.label || n.key), 1),
					K("code", ul, A(te(t, n.type) || "<project root>") + "/", 1),
					K("span", dl, [q(A(E(t, n.type).length) + " file", 1), E(t, n.type).length === 1 ? J("", !0) : (W(), G(H, { key: 0 }, [q("s")], 64))])
				]),
				n.type.description ? (W(), G("p", fl, A(n.type.description), 1)) : J("", !0),
				re(n.type).length > 0 ? (W(), G("dl", pl, [
					(W(!0), G(H, null, dr(re(n.type), (e) => (W(), G(H, { key: e.name }, [K("dt", null, [K("code", null, A(e.name), 1)]), K("dd", null, A(ie(e.spec)), 1)], 64))), 128)),
					a[10] ||= K("dt", { class: "implicit" }, [K("code", null, "body")], -1),
					a[11] ||= K("dd", { class: "implicit" }, "MDX body (implicit)", -1)
				])) : J("", !0),
				E(t, n.type).length > 0 ? (W(), G("ol", ml, [(W(!0), G(H, null, dr(E(t, n.type), (t) => (W(), G("li", {
					key: t.path,
					class: he(["docs-file", {
						focused: u.value === t.path,
						expanded: y(t.path)
					}]),
					tabindex: "0",
					onClick: (e) => b(t.path),
					onFocus: (e) => x(t.path),
					onMouseenter: (e) => x(t.path),
					onKeydown: co(oo((e) => b(t.path), ["prevent"]), ["enter"])
				}, [
					K("header", gl, [
						K("span", _l, A(y(t.path) ? "▾" : "▸"), 1),
						K("strong", vl, A(t.title), 1),
						K("code", yl, A(t.path), 1)
					]),
					Object.keys(t.frontMatter).length > 0 ? (W(), G("dl", bl, [(W(!0), G(H, null, dr(t.frontMatter, (e, t) => (W(), G(H, { key: t }, [K("dt", null, [K("code", null, A(t), 1)]), K("dd", null, A(O(e)), 1)], 64))), 128))])) : J("", !0),
					t.body && !y(t.path) ? (W(), G("p", xl, A(Kt(jc)(t.body)), 1)) : J("", !0),
					t.body && y(t.path) ? (W(), G("article", {
						key: 2,
						class: "docs-file-rendered",
						innerHTML: Kt(Ac)(t.body, { workspaceId: e.workspaceId ?? "" })
					}, null, 8, Sl)) : J("", !0)
				], 42, hl))), 128))])) : (W(), G("p", Cl, [
					a[12] ||= q(" No MDX files in ", -1),
					K("code", null, A(te(t, n.type)) + "/", 1),
					a[13] ||= q(" yet. ", -1)
				]))
			]))), 128))])), [[Ta, D(t).length > 0]])), 128))
		]));
	}
}), [["styles", [".docs-panel{font-family:var(--font-sans,system-ui);gap:14px;display:grid}.docs-panel .docs-head{border-bottom:.5px solid var(--fg,#fffffff0);justify-content:space-between;align-items:baseline;padding-bottom:6px;display:flex}.docs-panel h2{font-family:var(--font-serif,system-ui);margin:0;font-size:22px;line-height:1}.docs-panel .title-block{flex-wrap:wrap;align-items:baseline;gap:14px;display:inline-flex}.docs-panel .muted{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:12px}.docs-panel .muted code{font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);background:var(--bg-2,#0e1014);padding:0 4px;font-size:11px}.docs-panel .muted.error{color:var(--accent-err,#c9341c)}.docs-panel .docs-workbench{border:.5px solid var(--line,#ffffff12);background:var(--surface,#ffffff08)}.docs-panel .docs-workbench-head{border-bottom:.5px solid var(--line,#ffffff12);grid-template-columns:minmax(160px,1fr) auto;align-items:start;gap:12px;padding:10px 12px;display:grid}.docs-panel .docs-workbench-title{align-items:baseline;gap:10px;min-width:0;display:flex}.docs-panel .docs-workbench-title h3{font-family:var(--font-serif,system-ui);margin:0;font-size:16px;line-height:1}.docs-panel .docs-board-tabs{flex-wrap:wrap;justify-content:flex-end;gap:4px;display:flex}.docs-panel .docs-board-tab{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);max-width:100%;min-height:30px;color:var(--fg-2,#ffffffbd);font-family:var(--font-mono,monospace);white-space:nowrap;cursor:pointer;border-radius:6px;align-items:center;gap:7px;font-size:11px;line-height:1;display:inline-flex}.docs-panel .docs-board-tab:hover,.docs-panel .docs-board-tab.active{border-color:var(--fg-3,#ffffff85);color:var(--fg,#fffffff0)}.docs-panel .docs-board-tab.active{background:var(--bg-2,#0e1014)}.docs-panel .docs-board-tab strong{background:var(--surface-2,#ffffff0f);min-width:16px;color:var(--fg,#fffffff0);text-align:center;border-radius:6px;padding:3px 5px;font-weight:700}.docs-panel .docs-board-status{margin:0;padding:12px}.docs-panel .docs-board{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));align-items:start;gap:10px;padding:10px;display:grid}.docs-panel .docs-board-column{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);min-width:0}.docs-panel .docs-board-column-head{border-bottom:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;display:flex}.docs-panel .docs-board-column-head h4{overflow-wrap:anywhere;min-width:0;font-family:var(--font-mono,monospace);color:var(--fg,#fffffff0);margin:0;font-size:12px;line-height:1.2}.docs-panel .docs-board-column-head span{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);flex:none;font-size:11px}.docs-panel .docs-board-cards{gap:8px;margin:0;padding:8px;list-style:none;display:grid}.docs-panel .docs-board-card{border:.5px solid var(--line,#ffffff12);background:var(--surface,#ffffff08);border-radius:6px;min-width:0;padding:8px}.docs-panel .docs-board-card-head{gap:3px;min-width:0;display:grid}.docs-panel .docs-board-card-head strong{overflow-wrap:anywhere;min-width:0;font-family:var(--font-serif,system-ui);font-size:13px;line-height:1.2}.docs-panel .docs-board-type{font-family:var(--font-mono,monospace);color:var(--accent-blue,#1d55a6);font-size:10px;line-height:1}.docs-panel .docs-board-path{overflow-wrap:anywhere;font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);margin-top:6px;font-size:10px;line-height:1.3;display:block}.docs-panel .docs-board-metrics{font-family:var(--font-mono,monospace);grid-template-columns:minmax(64px,max-content) 1fr;gap:2px 8px;margin:8px 0 0;font-size:10px;line-height:1.35;display:grid}.docs-panel .docs-board-metrics dt{color:var(--fg-4,#ffffff57)}.docs-panel .docs-board-metrics dd{overflow-wrap:anywhere;min-width:0;color:var(--fg-2,#ffffffbd);margin:0}.docs-panel .docs-board-empty{margin:0;padding:8px 10px 10px}.docs-panel .docs-project{border:.5px solid var(--fg,#fffffff0);background:var(--bg,#0a0b0e)}.docs-panel .docs-project-head{background:var(--bg-2,#0e1014);border-bottom:.5px solid var(--line,#ffffff12);flex-wrap:wrap;align-items:baseline;gap:12px;padding:10px 14px;display:flex}.docs-panel .docs-project-head h3{font-family:var(--font-serif,system-ui);margin:0;font-size:16px;line-height:1}.docs-panel .docs-project-root{font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);font-size:12px}.docs-panel .docs-type{border-bottom:.5px solid var(--line,#ffffff12);padding:12px 14px}.docs-panel .docs-type:last-child{border-bottom:0}.docs-panel .docs-type-head{flex-wrap:wrap;align-items:baseline;gap:8px 12px;margin-bottom:6px;display:flex}.docs-panel .docs-type-key{font-family:var(--font-mono,monospace);letter-spacing:.04em;text-transform:uppercase;color:var(--accent-blue,#1d55a6);font-size:12px;font-weight:700}.docs-panel .docs-type-label{font-family:var(--font-serif,system-ui);font-size:14px;font-weight:600}.docs-panel .docs-type-scope{font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);background:var(--bg-2,#0e1014);padding:0 5px;font-size:11px}.docs-panel .docs-type-count{margin-left:auto}.docs-panel .docs-type-desc{font-family:var(--font-sans,system-ui);color:var(--fg-2,#ffffffbd);margin:0 0 8px;font-size:13px}.docs-panel .docs-type-props{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);grid-template-columns:auto 1fr;gap:2px 14px;margin:0 0 10px;font-size:11px;display:grid}.docs-panel .docs-type-props dt{font-weight:600}.docs-panel .docs-type-props dt code{color:var(--fg,#fffffff0)}.docs-panel .docs-type-props .implicit code,.docs-panel .docs-type-props .implicit{color:var(--fg-4,#ffffff57);font-style:italic}.docs-panel .docs-files{gap:8px;margin:0;padding:0;list-style:none;display:grid}.docs-panel .docs-file{border-left:2px solid var(--line,#ffffff12);cursor:pointer;padding:6px 0 6px 12px;transition:border-color .12s}.docs-panel .docs-file:hover,.docs-panel .docs-file.focused{border-left-color:var(--fg-3,#ffffff85);background:var(--surface)}.docs-panel .docs-file.expanded{border-left-color:var(--accent-blue,#1d55a6);cursor:default}.docs-panel .docs-file:focus{outline:none}.docs-panel .docs-file-caret{width:12px;color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);display:inline-block}.docs-panel .docs-file-head{flex-wrap:wrap;align-items:baseline;gap:10px;margin-bottom:2px;display:flex}.docs-panel .docs-file-title{font-family:var(--font-serif,system-ui);font-size:13px}.docs-panel .docs-file-path{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}.docs-panel .docs-file-front{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);grid-template-columns:auto 1fr;gap:1px 12px;margin:0 0 4px;font-size:11px;display:grid}.docs-panel .docs-file-front dt code{color:var(--fg-2,#ffffffbd)}.docs-panel .docs-file-body{font-family:var(--font-sans,system-ui);color:var(--fg-2,#ffffffbd);white-space:pre-wrap;word-break:break-word;margin:0;font-size:12px}.docs-panel .docs-file-rendered{border-top:.5px solid var(--line,#ffffff12);font-family:var(--font-sans,system-ui);color:var(--fg,#fffffff0);margin-top:8px;padding:12px 0 4px;font-size:13px;line-height:1.55}.docs-panel .docs-file-rendered h1,.docs-panel .docs-file-rendered h2,.docs-panel .docs-file-rendered h3,.docs-panel .docs-file-rendered h4{font-family:var(--font-serif,system-ui);margin:12px 0 6px;line-height:1.2}.docs-panel .docs-file-rendered h1{font-size:20px}.docs-panel .docs-file-rendered h2{font-size:16px}.docs-panel .docs-file-rendered h3{text-transform:uppercase;letter-spacing:.06em;color:var(--fg-3,#ffffff85);font-size:14px}.docs-panel .docs-file-rendered p{margin:0 0 8px}.docs-panel .docs-file-rendered ul{margin:0 0 8px 18px;padding:0;list-style:outside}.docs-panel .docs-file-rendered ul li{margin:2px 0}.docs-panel .docs-file-rendered code{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);border-radius:2px;padding:0 4px;font-size:12px}.docs-panel .docs-file-rendered pre{background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);white-space:pre-wrap;word-break:break-word;border-left:2px solid var(--line,#ffffff12);margin:8px 0;padding:10px 12px;font-size:12px;line-height:1.45}.docs-panel .docs-file-rendered pre code{background:0 0;padding:0}.docs-panel .docs-file-rendered strong{font-weight:700}.docs-panel .docs-file-rendered em{font-style:italic}.docs-panel .no-files{margin:0}@media (max-width:760px){.docs-panel .docs-workbench-head{grid-template-columns:1fr}.docs-panel .docs-board-tabs{justify-content:flex-start}}"]]]), Tl = "ext_docs", El = "comtrya-docs-panel";
Mc({
	tagName: El,
	component: wl
});
var Dl = {
	id: Tl,
	setup(e) {
		e.registerWidget({
			id: "docs-panel",
			element: El,
			defaultSlot: "repository.main",
			defaultPriority: 80,
			requiredPermission: "workspace.read"
		}), e.registerRoute("/", {
			element: El,
			requiredPermission: "workspace.read"
		});
	}
};
//#endregion
export { Dl as default };
