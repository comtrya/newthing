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
	let t = /* @__PURE__ */ L(e);
	return t === e ? t : (P(t, "iterate", Ze), /* @__PURE__ */ I(e) ? t : t.map(R));
}
function et(e) {
	return P(e = /* @__PURE__ */ L(e), "iterate", Ze), e;
}
function F(e, t) {
	return /* @__PURE__ */ Lt(e) ? Bt(/* @__PURE__ */ It(e) ? R(t) : t) : R(t);
}
var tt = {
	__proto__: null,
	[Symbol.iterator]() {
		return nt(this, Symbol.iterator, (e) => F(this, e));
	},
	concat(...e) {
		return $e(this).concat(...e.map((e) => d(e) ? $e(e) : e));
	},
	entries() {
		return nt(this, "entries", (e) => (e[1] = F(this, e[1]), e));
	},
	every(e, t) {
		return it(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return it(this, "filter", e, t, (e) => e.map((e) => F(this, e)), arguments);
	},
	find(e, t) {
		return it(this, "find", e, t, (e) => F(this, e), arguments);
	},
	findIndex(e, t) {
		return it(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return it(this, "findLast", e, t, (e) => F(this, e), arguments);
	},
	findLastIndex(e, t) {
		return it(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return it(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return ot(this, "includes", e);
	},
	indexOf(...e) {
		return ot(this, "indexOf", e);
	},
	join(e) {
		return $e(this).join(e);
	},
	lastIndexOf(...e) {
		return ot(this, "lastIndexOf", e);
	},
	map(e, t) {
		return it(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return st(this, "pop");
	},
	push(...e) {
		return st(this, "push", e);
	},
	reduce(e, ...t) {
		return at(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return at(this, "reduceRight", e, t);
	},
	shift() {
		return st(this, "shift");
	},
	some(e, t) {
		return it(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return st(this, "splice", e);
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
		return st(this, "unshift", e);
	},
	values() {
		return nt(this, "values", (e) => F(this, e));
	}
};
function nt(e, t, n) {
	let r = et(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ I(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var rt = Array.prototype;
function it(e, t, n, r, i, a) {
	let o = et(e), s = o !== e && !/* @__PURE__ */ I(e), c = o[t];
	if (c !== rt[t]) {
		let t = c.apply(e, a);
		return s ? R(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, F(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function at(e, t, n, r) {
	let i = et(e), a = i !== e && !/* @__PURE__ */ I(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = F(e, t)), n.call(this, t, F(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? F(e, c) : c;
}
function ot(e, t, n) {
	let r = /* @__PURE__ */ L(e);
	P(r, "iterate", Ze);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ Rt(n[0]) ? (n[0] = /* @__PURE__ */ L(n[0]), r[t](...n)) : i;
}
function st(e, t, n = []) {
	Ve(), Me();
	let r = (/* @__PURE__ */ L(e))[t].apply(e, n);
	return Ne(), He(), r;
}
var ct = /* @__PURE__ */ e("__proto__,__v_isRef,__isVue"), lt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(_));
function ut(e) {
	_(e) || (e = String(e));
	let t = /* @__PURE__ */ L(this);
	return P(t, "has", e), t.hasOwnProperty(e);
}
var dt = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? kt : Ot : i ? Dt : Et).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = d(e);
		if (!r) {
			let e;
			if (a && (e = tt[t])) return e;
			if (t === "hasOwnProperty") return ut;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ z(e) ? e : n);
		if ((_(t) ? lt.has(t) : ct(t)) || (r || P(e, "get", t), i)) return o;
		if (/* @__PURE__ */ z(o)) {
			let e = a && w(t) ? o : o.value;
			return r && v(e) ? /* @__PURE__ */ Pt(e) : e;
		}
		return v(o) ? r ? /* @__PURE__ */ Pt(o) : /* @__PURE__ */ Mt(o) : o;
	}
}, ft = class extends dt {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = d(e) && w(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ Lt(i);
			if (!/* @__PURE__ */ I(n) && !/* @__PURE__ */ Lt(n) && (i = /* @__PURE__ */ L(i), n = /* @__PURE__ */ L(n)), !a && /* @__PURE__ */ z(i) && !/* @__PURE__ */ z(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : u(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ z(e) ? e : r);
		return e === /* @__PURE__ */ L(r) && (o ? O(n, i) && Qe(e, "set", t, n, i) : Qe(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = u(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && Qe(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!_(t) || !lt.has(t)) && P(e, "has", t), n;
	}
	ownKeys(e) {
		return P(e, "iterate", d(e) ? "length" : Ye), Reflect.ownKeys(e);
	}
}, pt = class extends dt {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, mt = /* @__PURE__ */ new ft(), ht = /* @__PURE__ */ new pt(), gt = /* @__PURE__ */ new ft(!0), _t = (e) => e, vt = (e) => Reflect.getPrototypeOf(e);
function yt(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ L(i), o = f(a), c = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, u = i[e](...r), d = n ? _t : t ? Bt : R;
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
function bt(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function xt(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ L(r), a = /* @__PURE__ */ L(n);
			e || (O(n, a) && P(i, "get", n), P(i, "get", a));
			let { has: o } = vt(i), s = t ? _t : e ? Bt : R;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && P(/* @__PURE__ */ L(t), "iterate", Ye), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ L(n), i = /* @__PURE__ */ L(t);
			return e || (O(t, i) && P(r, "has", t), P(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ L(a), s = t ? _t : e ? Bt : R;
			return !e && P(o, "iterate", Ye), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return s(n, e ? {
		add: bt("add"),
		set: bt("set"),
		delete: bt("delete"),
		clear: bt("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ L(this), r = vt(n), i = /* @__PURE__ */ L(e), a = !t && !/* @__PURE__ */ I(e) && !/* @__PURE__ */ Lt(e) ? i : e;
			return r.has.call(n, a) || O(e, a) && r.has.call(n, e) || O(i, a) && r.has.call(n, i) || (n.add(a), Qe(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ I(n) && !/* @__PURE__ */ Lt(n) && (n = /* @__PURE__ */ L(n));
			let r = /* @__PURE__ */ L(this), { has: i, get: a } = vt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ L(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? O(n, s) && Qe(r, "set", e, n, s) : Qe(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ L(this), { has: n, get: r } = vt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ L(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && Qe(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ L(this), t = e.size !== 0, n = e.clear();
			return t && Qe(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = yt(r, e, t);
	}), n;
}
function St(e, t) {
	let n = xt(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(u(n, r) && r in t ? n : t, r, i);
}
var Ct = { get: /* @__PURE__ */ St(!1, !1) }, wt = { get: /* @__PURE__ */ St(!1, !0) }, Tt = { get: /* @__PURE__ */ St(!0, !1) }, Et = /* @__PURE__ */ new WeakMap(), Dt = /* @__PURE__ */ new WeakMap(), Ot = /* @__PURE__ */ new WeakMap(), kt = /* @__PURE__ */ new WeakMap();
function At(e) {
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
function jt(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : At(S(e));
}
/* @__NO_SIDE_EFFECTS__ */
function Mt(e) {
	return /* @__PURE__ */ Lt(e) ? e : Ft(e, !1, mt, Ct, Et);
}
/* @__NO_SIDE_EFFECTS__ */
function Nt(e) {
	return Ft(e, !1, gt, wt, Dt);
}
/* @__NO_SIDE_EFFECTS__ */
function Pt(e) {
	return Ft(e, !0, ht, Tt, Ot);
}
function Ft(e, t, n, r, i) {
	if (!v(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = jt(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function It(e) {
	return /* @__PURE__ */ Lt(e) ? /* @__PURE__ */ It(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function Lt(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function I(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function Rt(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function L(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ L(t) : e;
}
function zt(e) {
	return !u(e, "__v_skip") && Object.isExtensible(e) && k(e, "__v_skip", !0), e;
}
var R = (e) => v(e) ? /* @__PURE__ */ Mt(e) : e, Bt = (e) => v(e) ? /* @__PURE__ */ Pt(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function z(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function Vt(e) {
	return Ht(e, !1);
}
function Ht(e, t) {
	return /* @__PURE__ */ z(e) ? e : new Ut(e, t);
}
var Ut = class {
	constructor(e, t) {
		this.dep = new Ke(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ L(e), this._value = t ? e : R(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ I(e) || /* @__PURE__ */ Lt(e);
		e = n ? e : /* @__PURE__ */ L(e), O(e, t) && (this._rawValue = e, this._value = n ? e : R(e), this.dep.trigger());
	}
};
function Wt(e) {
	return /* @__PURE__ */ z(e) ? e.value : e;
}
var Gt = {
	get: (e, t, n) => t === "__v_raw" ? e : Wt(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ z(i) && !/* @__PURE__ */ z(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Kt(e) {
	return /* @__PURE__ */ It(e) ? e : new Proxy(e, Gt);
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
	let { immediate: a, deep: o, once: s, scheduler: l, augmentJob: u, call: f } = i, p = (e) => o ? e : /* @__PURE__ */ I(e) || o === !1 || o === 0 ? en(e, 1) : en(e), m, g, _, v, y = !1, b = !1;
	if (/* @__PURE__ */ z(e) ? (g = () => e.value, y = /* @__PURE__ */ I(e)) : /* @__PURE__ */ It(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some((e) => /* @__PURE__ */ It(e) || /* @__PURE__ */ I(e)), g = () => e.map((e) => {
		if (/* @__PURE__ */ z(e)) return e.value;
		if (/* @__PURE__ */ It(e)) return p(e);
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
			if (o || y || (b ? e.some((e, t) => O(e, C[t])) : O(e, C))) {
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
	if (n.set(e, t), t--, /* @__PURE__ */ z(e)) en(e.value, t, n);
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
		nn(e, t, n);
	}
}
function B(e, t, n, r) {
	if (h(e)) {
		let i = tn(e, t, n, r);
		return i && y(i) && i.catch((e) => {
			nn(e, t, n);
		}), i;
	}
	if (d(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(B(e[a], t, n, r));
		return i;
	}
}
function nn(e, n, r, i = !0) {
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
	rn(e, r, a, i, s);
}
function rn(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var V = [], H = -1, an = [], on = null, sn = 0, cn = /* @__PURE__ */ Promise.resolve(), ln = null;
function un(e) {
	let t = ln || cn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function dn(e) {
	let t = H + 1, n = V.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = V[r], a = _n(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function fn(e) {
	if (!(e.flags & 1)) {
		let t = _n(e), n = V[V.length - 1];
		!n || !(e.flags & 2) && t >= _n(n) ? V.push(e) : V.splice(dn(t), 0, e), e.flags |= 1, pn();
	}
}
function pn() {
	ln ||= cn.then(vn);
}
function mn(e) {
	d(e) ? an.push(...e) : on && e.id === -1 ? on.splice(sn + 1, 0, e) : e.flags & 1 || (an.push(e), e.flags |= 1), pn();
}
function hn(e, t, n = H + 1) {
	for (; n < V.length; n++) {
		let t = V[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			V.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function gn(e) {
	if (an.length) {
		let e = [...new Set(an)].sort((e, t) => _n(e) - _n(t));
		if (an.length = 0, on) {
			on.push(...e);
			return;
		}
		for (on = e, sn = 0; sn < on.length; sn++) {
			let e = on[sn];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		on = null, sn = 0;
	}
}
var _n = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function vn(e) {
	try {
		for (H = 0; H < V.length; H++) {
			let e = V[H];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), tn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; H < V.length; H++) {
			let e = V[H];
			e && (e.flags &= -2);
		}
		H = -1, V.length = 0, gn(e), ln = null, (V.length || an.length) && vn(e);
	}
}
var U = null, yn = null;
function bn(e) {
	let t = U;
	return U = e, yn = e && e.type.__scopeId || null, t;
}
function xn(e, t = U, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && Ti(-1);
		let i = bn(t), a;
		try {
			a = e(...n);
		} finally {
			bn(i), r._d && Ti(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function Sn(e, n) {
	if (U === null) return e;
	let r = aa(U), i = e.dirs ||= [];
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
function Cn(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (Ve(), B(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), He());
	}
}
function wn(e, t) {
	if ($) {
		let n = $.provides, r = $.parent && $.parent.provides;
		r === n && (n = $.provides = Object.create(r)), n[e] = t;
	}
}
function Tn(e, t, n = !1) {
	let r = Wi();
	if (r || Ar) {
		let i = Ar ? Ar._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t;
	}
}
var En = /* @__PURE__ */ Symbol.for("v-scx"), Dn = () => Tn(En);
function On(e, t, n) {
	return kn(e, t, n);
}
function kn(e, n, i = t) {
	let { immediate: a, deep: o, flush: c, once: l } = i, u = s({}, i), d = n && a || !n && c !== "post", f;
	if (Xi) {
		if (c === "sync") {
			let e = Dn();
			f = e.__watcherHandles ||= [];
		} else if (!d) {
			let e = () => {};
			return e.stop = r, e.resume = r, e.pause = r, e;
		}
	}
	let p = $;
	u.call = (e, t, n) => B(e, p, t, n);
	let m = !1;
	c === "post" ? u.scheduler = (e) => {
		G(e, p && p.suspense);
	} : c !== "sync" && (m = !0, u.scheduler = (e, t) => {
		t ? e() : fn(e);
	}), u.augmentJob = (e) => {
		n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p));
	};
	let h = $t(e, n, u);
	return Xi && (f ? f.push(h) : d && h()), h;
}
function An(e, t, n) {
	let r = this.proxy, i = g(e) ? e.includes(".") ? jn(r, e) : () => r[e] : e.bind(r, r), a;
	h(t) ? a = t : (a = t.handler, n = t);
	let o = qi(this), s = kn(i, a.bind(r), n);
	return o(), s;
}
function jn(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var Mn = /* @__PURE__ */ Symbol("_vte"), Nn = (e) => e.__isTeleport, Pn = /* @__PURE__ */ Symbol("_leaveCb");
function Fn(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, Fn(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function In(e, t) {
	return h(e) ? s({ name: e.name }, t, { setup: e }) : e;
}
function Ln(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function Rn(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var zn = /* @__PURE__ */ new WeakMap();
function Bn(e, n, r, a, o = !1) {
	if (d(e)) {
		e.forEach((e, t) => Bn(e, n && (d(n) ? n[t] : n), r, a, o));
		return;
	}
	if (Hn(a) && !o) {
		a.shapeFlag & 512 && a.type.__asyncResolved && a.component.subTree.component && Bn(e, n, r, a.component.subTree);
		return;
	}
	let s = a.shapeFlag & 4 ? aa(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ L(v), b = v === t ? i : (e) => Rn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Rn(_, t));
	if (m != null && m !== p) {
		if (Vn(n), g(m)) _[m] = null, b(m) && (v[m] = null);
		else if (/* @__PURE__ */ z(m)) {
			let e = n;
			x(m, e.k) && (m.value = null), e.k && (_[e.k] = null);
		}
	}
	if (h(p)) tn(p, f, 12, [l, _]);
	else {
		let t = g(p), n = /* @__PURE__ */ z(p);
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
					i(), zn.delete(e);
				};
				t.id = -1, zn.set(e, t), G(t, r);
			} else Vn(e), i();
		}
	}
}
function Vn(e) {
	let t = zn.get(e);
	t && (t.flags |= 8, zn.delete(e));
}
le().requestIdleCallback, le().cancelIdleCallback;
var Hn = (e) => !!e.type.__asyncLoader, Un = (e) => e.type.__isKeepAlive;
function Wn(e, t) {
	Kn(e, "a", t);
}
function Gn(e, t) {
	Kn(e, "da", t);
}
function Kn(e, t, n = $) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (Jn(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) Un(e.parent.vnode) && qn(r, t, n, e), e = e.parent;
	}
}
function qn(e, t, n, r) {
	let i = Jn(t, e, r, !0);
	tr(() => {
		c(r[t], i);
	}, n);
}
function Jn(e, t, n = $, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			Ve();
			let i = qi(n), a = B(t, n, e, r);
			return i(), He(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Yn = (e) => (t, n = $) => {
	(!Xi || e === "sp") && Jn(e, (...e) => t(...e), n);
}, Xn = Yn("bm"), Zn = Yn("m"), Qn = Yn("bu"), $n = Yn("u"), er = Yn("bum"), tr = Yn("um"), nr = Yn("sp"), rr = Yn("rtg"), ir = Yn("rtc");
function ar(e, t = $) {
	Jn("ec", e, t);
}
var or = /* @__PURE__ */ Symbol.for("v-ndc");
function sr(e, t, n, r) {
	let i, a = n && n[r], o = d(e);
	if (o || g(e)) {
		let n = o && /* @__PURE__ */ It(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ I(e), s = /* @__PURE__ */ Lt(e), e = et(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Bt(R(e[n])) : R(e[n]) : e[n], n, void 0, a && a[n]);
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
var cr = (e) => e ? Yi(e) ? aa(e) : cr(e.parent) : null, lr = /* @__PURE__ */ s(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => cr(e.parent),
	$root: (e) => cr(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => vr(e),
	$forceUpdate: (e) => e.f ||= () => {
		fn(e.update);
	},
	$nextTick: (e) => e.n ||= un.bind(e.proxy),
	$watch: (e) => An.bind(e)
}), ur = (e, n) => e !== t && !e.__isScriptSetup && u(e, n), dr = {
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
			else if (ur(i, n)) return s[n] = 1, i[n];
			else if (a !== t && u(a, n)) return s[n] = 2, a[n];
			else if (u(o, n)) return s[n] = 3, o[n];
			else if (r !== t && u(r, n)) return s[n] = 4, r[n];
			else pr && (s[n] = 0);
		}
		let d = lr[n], f, p;
		if (d) return n === "$attrs" && P(e.attrs, "get", ""), d(e);
		if ((f = c.__cssModules) && (f = f[n])) return f;
		if (r !== t && u(r, n)) return s[n] = 4, r[n];
		if (p = l.config.globalProperties, u(p, n)) return p[n];
	},
	set({ _: e }, n, r) {
		let { data: i, setupState: a, ctx: o } = e;
		return ur(a, n) ? (a[n] = r, !0) : i !== t && u(i, n) ? (i[n] = r, !0) : u(e.props, n) || n[0] === "$" && n.slice(1) in e ? !1 : (o[n] = r, !0);
	},
	has({ _: { data: e, setupState: n, accessCache: r, ctx: i, appContext: a, props: o, type: s } }, c) {
		let l;
		return !!(r[c] || e !== t && c[0] !== "$" && u(e, c) || ur(n, c) || u(o, c) || u(i, c) || u(lr, c) || u(a.config.globalProperties, c) || (l = s.__cssModules) && l[c]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? u(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function fr(e) {
	return d(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var pr = !0;
function mr(e) {
	let t = vr(e), n = e.proxy, i = e.ctx;
	pr = !1, t.beforeCreate && gr(t.beforeCreate, e, "bc");
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: T, renderTracked: ee, renderTriggered: te, errorCaptured: E, serverPrefetch: ne, expose: D, inheritAttrs: re, components: ie, directives: O, filters: ae } = t;
	if (u && hr(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Mt(t));
	}
	if (pr = !0, o) for (let e in o) {
		let t = o[e], a = sa({
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
	if (c) for (let e in c) _r(c[e], i, n, e);
	if (l) {
		let e = h(l) ? l.call(n) : l;
		Reflect.ownKeys(e).forEach((t) => {
			wn(t, e[t]);
		});
	}
	f && gr(f, e, "c");
	function k(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (k(Xn, p), k(Zn, m), k(Qn, g), k($n, _), k(Wn, y), k(Gn, b), k(ar, E), k(ir, ee), k(rr, te), k(er, S), k(tr, w), k(nr, ne), d(D)) if (D.length) {
		let t = e.exposed ||= {};
		D.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	T && e.render === r && (e.render = T), re != null && (e.inheritAttrs = re), ie && (e.components = ie), O && (e.directives = O), ne && Ln(e);
}
function hr(e, t, n = r) {
	d(e) && (e = Cr(e));
	for (let n in e) {
		let r = e[n], i;
		i = v(r) ? "default" in r ? Tn(r.from || n, r.default, !0) : Tn(r.from || n) : Tn(r), /* @__PURE__ */ z(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function gr(e, t, n) {
	B(d(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function _r(e, t, n, r) {
	let i = r.includes(".") ? jn(n, r) : () => n[r];
	if (g(e)) {
		let n = t[e];
		h(n) && On(i, n);
	} else if (h(e)) On(i, e.bind(n));
	else if (v(e)) if (d(e)) e.forEach((e) => _r(e, t, n, r));
	else {
		let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
		h(r) && On(i, r, e);
	}
}
function vr(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => yr(c, e, o, !0)), yr(c, t, o)), v(t) && a.set(t, c), c;
}
function yr(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && yr(e, a, n, !0), i && i.forEach((t) => yr(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = br[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var br = {
	data: xr,
	props: Tr,
	emits: Tr,
	methods: wr,
	computed: wr,
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
	components: wr,
	directives: wr,
	watch: Er,
	provide: xr,
	inject: Sr
};
function xr(e, t) {
	return t ? e ? function() {
		return s(h(e) ? e.call(this, this) : e, h(t) ? t.call(this, this) : t);
	} : t : e;
}
function Sr(e, t) {
	return wr(Cr(e), Cr(t));
}
function Cr(e) {
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
function wr(e, t) {
	return e ? s(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Tr(e, t) {
	return e ? d(e) && d(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : s(/* @__PURE__ */ Object.create(null), fr(e), fr(t ?? {})) : t;
}
function Er(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = s(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = W(e[r], t[r]);
	return n;
}
function Dr() {
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
var Or = 0;
function kr(e, t) {
	return function(n, r = null) {
		h(n) || (n = s({}, n)), r != null && !v(r) && (r = null);
		let i = Dr(), a = /* @__PURE__ */ new WeakSet(), o = [], c = !1, l = i.app = {
			_uid: Or++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: ca,
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
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, aa(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				c && (B(o, l._instance, 16), e(null, l._container), delete l._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, l;
			},
			runWithContext(e) {
				let t = Ar;
				Ar = l;
				try {
					return e();
				} finally {
					Ar = t;
				}
			}
		};
		return l;
	};
}
var Ar = null, jr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${E(t)}Modifiers`] || e[`${D(t)}Modifiers`];
function Mr(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && jr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(oe)));
	let c, l = i[c = ie(n)] || i[c = ie(E(n))];
	!l && o && (l = i[c = ie(D(n))]), l && B(l, e, 6, a);
	let u = i[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, B(u, e, 6, a);
	}
}
var Nr = /* @__PURE__ */ new WeakMap();
function Pr(e, t, n = !1) {
	let r = n ? Nr : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, c = !1;
	if (!h(e)) {
		let r = (e) => {
			let n = Pr(e, t, !0);
			n && (c = !0, s(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !c ? (v(e) && r.set(e, null), null) : (d(a) ? a.forEach((e) => o[e] = null) : s(o, a), v(e) && r.set(e, o), o);
}
function Fr(e, t) {
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, D(t)) || u(e, t));
}
function Ir(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: s, attrs: c, emit: l, render: u, renderCache: d, props: f, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = bn(e), v, y;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			v = Ii(u.call(t, e, d, f, m, p, h)), y = c;
		} else {
			let e = t;
			v = Ii(e.length > 1 ? e(f, {
				attrs: c,
				slots: s,
				emit: l
			}) : e(f, null)), y = t.props ? c : Lr(c);
		}
	} catch (t) {
		Si.length = 0, nn(t, e, 1), v = Z(bi);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = Rr(y, a)), b = Pi(b, y, !1, !0));
	}
	return n.dirs && (b = Pi(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && Fn(b, n.transition), v = b, bn(_), v;
}
var Lr = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || a(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, Rr = (e, t) => {
	let n = {};
	for (let r in e) (!o(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function zr(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? Br(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (Vr(o, r, n) && !Fr(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? Br(r, o, l) : !0 : !!o;
	return !1;
}
function Br(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (Vr(t, e, a) && !Fr(n, a)) return !0;
	}
	return !1;
}
function Vr(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && v(r) && v(i) ? !be(r, i) : r !== i;
}
function Hr({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var Ur = {}, Wr = () => Object.create(Ur), Gr = (e) => Object.getPrototypeOf(e) === Ur;
function Kr(e, t, n, r = !1) {
	let i = {}, a = Wr();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), Jr(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ Nt(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function qr(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ L(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (Fr(e.emitsOptions, o)) continue;
				let d = t[o];
				if (c) if (u(a, o)) d !== a[o] && (a[o] = d, l = !0);
				else {
					let t = E(o);
					i[t] = Yr(c, s, t, d, e, !1);
				}
				else d !== a[o] && (a[o] = d, l = !0);
			}
		}
	} else {
		Jr(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !u(t, a) && ((r = D(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Yr(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !u(t, e)) && (delete a[e], l = !0);
	}
	l && Qe(e.attrs, "set", "");
}
function Jr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (T(t)) continue;
		let l = n[t], d;
		a && u(a, d = E(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : Fr(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ L(r), i = c || t;
		for (let t = 0; t < o.length; t++) {
			let s = o[t];
			r[s] = Yr(a, n, s, i[s], e, !u(i, s));
		}
	}
	return s;
}
function Yr(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = u(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && h(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = qi(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === D(n)) && (r = !0));
	}
	return r;
}
var Xr = /* @__PURE__ */ new WeakMap();
function Zr(e, r, i = !1) {
	let a = i ? Xr : r.propsCache, o = a.get(e);
	if (o) return o;
	let c = e.props, l = {}, f = [], p = !1;
	if (!h(e)) {
		let t = (e) => {
			p = !0;
			let [t, n] = Zr(e, r, !0);
			s(l, t), n && f.push(...n);
		};
		!i && r.mixins.length && r.mixins.forEach(t), e.extends && t(e.extends), e.mixins && e.mixins.forEach(t);
	}
	if (!c && !p) return v(e) && a.set(e, n), n;
	if (d(c)) for (let e = 0; e < c.length; e++) {
		let n = E(c[e]);
		Qr(n) && (l[n] = t);
	}
	else if (c) for (let e in c) {
		let t = E(e);
		if (Qr(t)) {
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
function Qr(e) {
	return e[0] !== "$" && !T(e);
}
var $r = (e) => e === "_" || e === "_ctx" || e === "$stable", ei = (e) => d(e) ? e.map(Ii) : [Ii(e)], ti = (e, t, n) => {
	if (t._n) return t;
	let r = xn((...e) => ei(t(...e)), n);
	return r._c = !1, r;
}, ni = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if ($r(n)) continue;
		let i = e[n];
		if (h(i)) t[n] = ti(n, i, r);
		else if (i != null) {
			let e = ei(i);
			t[n] = () => e;
		}
	}
}, ri = (e, t) => {
	let n = ei(t);
	e.slots.default = () => n;
}, ii = (e, t, n) => {
	for (let r in t) (n || !$r(r)) && (e[r] = t[r]);
}, ai = (e, t, n) => {
	let r = e.slots = Wr();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (ii(r, t, n), n && k(r, "_", e, !0)) : ni(t, r);
	} else t && ri(e, t);
}, oi = (e, n, r) => {
	let { vnode: i, slots: a } = e, o = !0, s = t;
	if (i.shapeFlag & 32) {
		let e = n._;
		e ? r && e === 1 ? o = !1 : ii(a, n, r) : (o = !n.$stable, ni(n, a)), s = n;
	} else n && (ri(e, n), s = { default: 1 });
	if (o) for (let e in a) !$r(e) && s[e] == null && delete a[e];
}, G = vi;
function si(e) {
	return ci(e);
}
function ci(e, i) {
	let a = le();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !ki(e, t) && (r = ye(e), me(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case yi:
				y(e, t, n, r);
				break;
			case bi:
				b(e, t, n, r);
				break;
			case xi:
				e ?? x(t, n, r, o);
				break;
			case K:
				ie(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? O(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, A);
		}
		u != null && i ? Bn(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && Bn(e.ref, null, a, e, !0);
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
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && E(e.children, d, null, r, i, li(e, a), s, u), _ && Cn(e, null, r, "created"), te(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !T(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Bi(f, r, e);
		}
		_ && Cn(e, null, r, "beforeMount");
		let v = di(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && G(() => {
			try {
				f && Bi(f, r, e), v && g.enter(d), _ && Cn(e, null, r, "mounted");
			} finally {}
		}, i);
	}, te = (e, t, n, r, i) => {
		if (n && g(e, n), r) for (let t = 0; t < r.length; t++) g(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || _i(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				te(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, E = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? Li(e[l]) : Ii(e[l]), t, n, r, i, a, o, s);
	}, ne = (e, n, r, i, a, o, s) => {
		let l = n.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = n;
		u |= e.patchFlag & 16;
		let m = e.props || t, h = n.props || t, g;
		if (r && ui(r, !1), (g = h.onVnodeBeforeUpdate) && Bi(g, r, n, e), f && Cn(n, e, r, "beforeUpdate"), r && ui(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? D(e.dynamicChildren, d, l, r, i, li(n, a), o) : s || ue(e, n, l, null, r, i, li(n, a), o, !1), u > 0) {
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
		((g = h.onVnodeUpdated) || f) && G(() => {
			g && Bi(g, r, n, e), f && Cn(n, e, r, "updated");
		}, i);
	}, D = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === K || !ki(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
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
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), E(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (D(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && fi(e, t, !0)) : ue(e, t, n, f, i, a, s, c, l);
	}, O = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : k(t, n, r, i, a, o, c) : oe(e, t, c);
	}, k = (e, t, n, r, i, a, o) => {
		let s = e.component = Ui(e, r, i);
		if (Un(e) && (s.ctx.renderer = A), Zi(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, se, o), !e.el) {
				let r = s.subTree = Z(bi);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else se(s, e, t, n, i, a, o);
	}, oe = (e, t, n) => {
		let r = t.component = e.component;
		if (zr(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			ce(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, se = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = mi(e);
					if (n) {
						t && (t.el = c.el, ce(e, t, o)), n.asyncDep.then(() => {
							G(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				ui(e, !1), t ? (t.el = c.el, ce(e, t, o)) : t = c, n && ae(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Bi(d, s, t, c), ui(e, !0);
				let f = Ir(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ye(p), e, i, a), t.el = f.el, u === null && Hr(e, f.el), r && G(r, i), (d = t.props && t.props.onVnodeUpdated) && G(() => Bi(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Hn(t);
				if (ui(e, !1), l && ae(l), !m && (o = c && c.onVnodeBeforeMount) && Bi(o, d, t), ui(e, !0), s && Ce) {
					let t = () => {
						e.subTree = Ir(e), Ce(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Ir(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && G(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					G(() => Bi(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Hn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && G(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new De(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => fn(u), ui(e, !0), l();
	}, ce = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, qr(e, t.props, r, n), oi(e, t.children, n), Ve(), hn(e), He();
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
		m & 8 ? (u & 16 && ve(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? fe(l, d, n, r, i, a, o, s, c) : ve(l, i, a, !0) : (u & 8 && p(n, ""), m & 16 && E(d, n, r, i, a, o, s, c));
	}, de = (e, t, r, i, a, o, s, c, l) => {
		e ||= n, t ||= n;
		let u = e.length, d = t.length, f = Math.min(u, d), p;
		for (p = 0; p < f; p++) {
			let n = t[p] = l ? Li(t[p]) : Ii(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? ve(e, a, o, !0, !1, f) : E(t, r, i, a, o, s, c, l, f);
	}, fe = (e, t, r, i, a, o, s, c, l) => {
		let u = 0, d = t.length, f = e.length - 1, p = d - 1;
		for (; u <= f && u <= p;) {
			let n = e[u], i = t[u] = l ? Li(t[u]) : Ii(t[u]);
			if (ki(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			u++;
		}
		for (; u <= f && u <= p;) {
			let n = e[f], i = t[p] = l ? Li(t[p]) : Ii(t[p]);
			if (ki(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			f--, p--;
		}
		if (u > f) {
			if (u <= p) {
				let e = p + 1, n = e < d ? t[e].el : i;
				for (; u <= p;) v(null, t[u] = l ? Li(t[u]) : Ii(t[u]), r, n, a, o, s, c, l), u++;
			}
		} else if (u > p) for (; u <= f;) me(e[u], a, o, !0), u++;
		else {
			let m = u, h = u, g = /* @__PURE__ */ new Map();
			for (u = h; u <= p; u++) {
				let e = t[u] = l ? Li(t[u]) : Ii(t[u]);
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
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && ki(n, t[_])) {
					i = _;
					break;
				}
				i === void 0 ? me(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++);
			}
			let w = x ? pi(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || gi(f) : i;
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
		if (c === K) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) pe(u[e], t, n, r);
			o(e.anchor, t, n);
			return;
		}
		if (c === xi) {
			S(e, t, n);
			return;
		}
		if (r !== 2 && d & 1 && l) if (r === 0) l.beforeEnter(a), o(a, t, n), G(() => l.enter(a), i);
		else {
			let { leave: r, delayLeave: i, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? s(a) : o(a, t, n);
			}, d = () => {
				a._isLeaving && a[Pn](!0), r(a, () => {
					u(), c && c();
				});
			};
			i ? i(a, u, d) : d();
		}
		else o(a, t, n);
	}, me = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (Ve(), Bn(s, null, n, e, !0), He()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Hn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Bi(_, t, e), u & 6) _e(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && Cn(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, A, r) : l && !l.hasOnce && (a !== K || d > 0 && d & 64) ? ve(l, t, n, !1, !0) : (a === K && d & 384 || !i && u & 16) && ve(c, t, n), r && he(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && G(() => {
			_ && Bi(_, t, e), h && Cn(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, he = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === K) {
			ge(n, r);
			return;
		}
		if (t === xi) {
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
		hi(c), hi(l), r && ae(r), i.stop(), a && (a.flags |= 8, me(o, e, t, n)), s && G(s, t), G(() => {
			e.isUnmounted = !0;
		}, t);
	}, ve = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) me(e[o], t, n, r, i);
	}, ye = (e) => {
		if (e.shapeFlag & 6) return ye(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[Mn];
		return n ? h(n) : t;
	}, be = !1, xe = (e, t, n) => {
		let r;
		e == null ? t._vnode && (me(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, be ||= (be = !0, hn(r), gn(), !1);
	}, A = {
		p: v,
		um: me,
		m: pe,
		r: he,
		mt: k,
		mc: E,
		pc: ue,
		pbc: D,
		n: ye,
		o: e
	}, Se, Ce;
	return i && ([Se, Ce] = i(A)), {
		render: xe,
		hydrate: Se,
		createApp: kr(xe, Se)
	};
}
function li({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function ui({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function di(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function fi(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (d(r) && d(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Li(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && fi(t, a)), a.type === yi && (a.patchFlag === -1 && (a = i[e] = Li(a)), a.el = t.el), a.type === bi && !a.el && (a.el = t.el);
	}
}
function pi(e) {
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
function mi(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : mi(t);
}
function hi(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function gi(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? gi(t.subTree) : null;
}
var _i = (e) => e.__isSuspense;
function vi(e, t) {
	t && t.pendingBranch ? d(e) ? t.effects.push(...e) : t.effects.push(e) : mn(e);
}
var K = /* @__PURE__ */ Symbol.for("v-fgt"), yi = /* @__PURE__ */ Symbol.for("v-txt"), bi = /* @__PURE__ */ Symbol.for("v-cmt"), xi = /* @__PURE__ */ Symbol.for("v-stc"), Si = [], q = null;
function J(e = !1) {
	Si.push(q = e ? null : []);
}
function Ci() {
	Si.pop(), q = Si[Si.length - 1] || null;
}
var wi = 1;
function Ti(e, t = !1) {
	wi += e, e < 0 && q && t && (q.hasOnce = !0);
}
function Ei(e) {
	return e.dynamicChildren = wi > 0 ? q || n : null, Ci(), wi > 0 && q && q.push(e), e;
}
function Y(e, t, n, r, i, a) {
	return Ei(X(e, t, n, r, i, a, !0));
}
function Di(e, t, n, r, i) {
	return Ei(Z(e, t, n, r, i, !0));
}
function Oi(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function ki(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Ai = ({ key: e }) => e ?? null, ji = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ z(e) || h(e) ? {
	i: U,
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
		key: t && Ai(t),
		ref: t && ji(t),
		scopeId: yn,
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
		ctx: U
	};
	return s ? (Ri(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), wi > 0 && !o && q && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && q.push(c), c;
}
var Z = Mi;
function Mi(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === or) && (e = bi), Oi(e)) {
		let r = Pi(e, t, !0);
		return n && Ri(r, n), wi > 0 && !a && q && (r.shapeFlag & 6 ? q[q.indexOf(e)] = r : q.push(r)), r.patchFlag = -2, r;
	}
	if (oa(e) && (e = e.__vccOpts), t) {
		t = Ni(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = he(e)), v(n) && (/* @__PURE__ */ Rt(n) && !d(n) && (n = s({}, n)), t.style = ue(n));
	}
	let o = g(e) ? 1 : _i(e) ? 128 : Nn(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return X(e, t, n, r, i, o, a, !0);
}
function Ni(e) {
	return e ? /* @__PURE__ */ Rt(e) || Gr(e) ? s({}, e) : e : null;
}
function Pi(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? zi(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && Ai(l),
		ref: t && t.ref ? n && a ? d(a) ? a.concat(ji(t)) : [a, ji(t)] : ji(t) : a,
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
		ssContent: e.ssContent && Pi(e.ssContent),
		ssFallback: e.ssFallback && Pi(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && Fn(u, c.clone(u)), u;
}
function Q(e = " ", t = 0) {
	return Z(yi, null, e, t);
}
function Fi(e = "", t = !1) {
	return t ? (J(), Di(bi, null, e)) : Z(bi, null, e);
}
function Ii(e) {
	return e == null || typeof e == "boolean" ? Z(bi) : d(e) ? Z(K, null, e.slice()) : Oi(e) ? Li(e) : Z(yi, null, String(e));
}
function Li(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : Pi(e);
}
function Ri(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (d(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), Ri(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Gr(t) ? t._ctx = U : r === 3 && U && (U.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: U
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Q(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function zi(...e) {
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
function Bi(e, t, n, r = null) {
	B(e, t, 7, [n, r]);
}
var Vi = Dr(), Hi = 0;
function Ui(e, n, r) {
	let i = e.type, a = (n ? n.appContext : e.appContext) || Vi, o = {
		uid: Hi++,
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
		propsOptions: Zr(i, a),
		emitsOptions: Pr(i, a),
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
	return o.ctx = { _: o }, o.root = n ? n.root : o, o.emit = Mr.bind(null, o), e.ce && e.ce(o), o;
}
var $ = null, Wi = () => $ || U, Gi, Ki;
{
	let e = le(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Gi = t("__VUE_INSTANCE_SETTERS__", (e) => $ = e), Ki = t("__VUE_SSR_SETTERS__", (e) => Xi = e);
}
var qi = (e) => {
	let t = $;
	return Gi(e), e.scope.on(), () => {
		e.scope.off(), Gi(t);
	};
}, Ji = () => {
	$ && $.scope.off(), Gi(null);
};
function Yi(e) {
	return e.vnode.shapeFlag & 4;
}
var Xi = !1;
function Zi(e, t = !1, n = !1) {
	t && Ki(t);
	let { props: r, children: i } = e.vnode, a = Yi(e);
	Kr(e, r, a, t), ai(e, i, n || t);
	let o = a ? Qi(e, t) : void 0;
	return t && Ki(!1), o;
}
function Qi(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, dr);
	let { setup: r } = n;
	if (r) {
		Ve();
		let n = e.setupContext = r.length > 1 ? ia(e) : null, i = qi(e), a = tn(r, e, 0, [e.props, n]), o = y(a);
		if (He(), i(), (o || e.sp) && !Hn(e) && Ln(e), o) {
			if (a.then(Ji, Ji), t) return a.then((n) => {
				$i(e, n, t);
			}).catch((t) => {
				nn(t, e, 0);
			});
			e.asyncDep = a;
		} else $i(e, a, t);
	} else na(e, t);
}
function $i(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = Kt(t)), na(e, n);
}
var ea, ta;
function na(e, t, n) {
	let i = e.type;
	if (!e.render) {
		if (!t && ea && !i.render) {
			let t = i.template || vr(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: r } = e.appContext.config, { delimiters: a, compilerOptions: o } = i;
				i.render = ea(t, s(s({
					isCustomElement: n,
					delimiters: a
				}, r), o));
			}
		}
		e.render = i.render || r, ta && ta(e);
	}
	{
		let t = qi(e);
		Ve();
		try {
			mr(e);
		} finally {
			He(), t();
		}
	}
}
var ra = { get(e, t) {
	return P(e, "get", ""), e[t];
} };
function ia(e) {
	return {
		attrs: new Proxy(e.attrs, ra),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function aa(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(Kt(zt(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in lr) return lr[n](e);
		},
		has(e, t) {
			return t in e || t in lr;
		}
	}) : e.proxy;
}
function oa(e) {
	return h(e) && "__vccOpts" in e;
}
var sa = (e, t) => /* @__PURE__ */ Jt(e, t, Xi), ca = "3.5.34", la = void 0, ua = typeof window < "u" && window.trustedTypes;
if (ua) try {
	la = /* @__PURE__ */ ua.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var da = la ? (e) => la.createHTML(e) : (e) => e, fa = "http://www.w3.org/2000/svg", pa = "http://www.w3.org/1998/Math/MathML", ma = typeof document < "u" ? document : null, ha = ma && /* @__PURE__ */ ma.createElement("template"), ga = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? ma.createElementNS(fa, e) : t === "mathml" ? ma.createElementNS(pa, e) : n ? ma.createElement(e, { is: n }) : ma.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => ma.createTextNode(e),
	createComment: (e) => ma.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => ma.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			ha.innerHTML = da(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = ha.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, _a = /* @__PURE__ */ Symbol("_vtc");
function va(e, t, n) {
	let r = e[_a];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var ya = /* @__PURE__ */ Symbol("_vod"), ba = /* @__PURE__ */ Symbol("_vsh"), xa = {
	name: "show",
	beforeMount(e, { value: t }, { transition: n }) {
		e[ya] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : Sa(e, t);
	},
	mounted(e, { value: t }, { transition: n }) {
		n && t && n.enter(e);
	},
	updated(e, { value: t, oldValue: n }, { transition: r }) {
		!t != !n && (r ? t ? (r.beforeEnter(e), Sa(e, !0), r.enter(e)) : r.leave(e, () => {
			Sa(e, !1);
		}) : Sa(e, t));
	},
	beforeUnmount(e, { value: t }) {
		Sa(e, t);
	}
};
function Sa(e, t) {
	e.style.display = t ? e[ya] : "none", e[ba] = !t;
}
var Ca = /* @__PURE__ */ Symbol(""), wa = /(?:^|;)\s*display\s*:/;
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
	ya in e && (e[ya] = a ? r.display : "", e[ba] && (r.display = "none"));
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
function Na(e, t, n, r, i, a = _e(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Ma, t.slice(6, t.length)) : e.setAttributeNS(Ma, t, n) : n == null || a && !ve(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
}
function Pa(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? da(n) : n);
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
	return [e[2] === ":" ? e.slice(3) : D(e.slice(2)), t];
}
var Va = 0, Ha = /* @__PURE__ */ Promise.resolve(), Ua = () => Va ||= (Ha.then(() => Va = 0), Date.now());
function Wa(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		B(Ga(e, n.value), t, 5, [e]);
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
	t === "class" ? va(e, r, c) : t === "style" ? Ta(e, n, r) : a(t) ? o(t) || Ra(e, t, n, r, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ja(e, t, r, c)) ? (Pa(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Na(e, t, r, c, s, t !== "value")) : e._isVueCE && (Ya(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r))) ? Pa(e, E(t), r, s, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Na(e, t, r, c));
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
	let r = /* @__PURE__ */ In(e, t);
	C(r) && (r = s({}, r, t));
	class i extends $a {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var Qa = typeof HTMLElement < "u" ? HTMLElement : class {}, $a = class e extends Qa {
	constructor(e, t = {}, n = lo) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== lo ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, un(() => {
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
		if (t) for (let e in t) u(this, e) || Object.defineProperty(this, e, { get: () => Wt(t[e]) });
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
		this._app && (e.appContext = this._app._context), co(e, this._root);
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
}, eo = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], to = {
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
	exact: (e, t) => eo.some((n) => e[`${n}Key`] && !t.includes(n))
}, no = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = to[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, ro = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, io = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = D(n.key);
		if (t.some((e) => e === r || ro[e] === r)) return e(n);
	}));
}, ao = /* @__PURE__ */ s({ patchProp: qa }, ga), oo;
function so() {
	return oo ||= si(ao);
}
var co = ((...e) => {
	so().render(...e);
}), lo = ((...e) => {
	let t = so().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = fo(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, uo(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function uo(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function fo(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/graphql-client.ts
var po = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, mo;
function ho() {
	return mo ||= go(po), mo;
}
function go(e) {
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
var _o = Symbol.for("comtrya.relationship-registry");
vo();
function vo() {
	let e = globalThis;
	return e[_o] ??= {
		types: /* @__PURE__ */ new Map(),
		providers: /* @__PURE__ */ new Map(),
		subscribers: /* @__PURE__ */ new Set()
	}, e[_o];
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var yo = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], bo = typeof navigator == "object" ? navigator.platform : "", xo = /Mac|iPod|iPhone|iPad/.test(bo), So = xo ? "Meta" : "Control", Co = bo === "Win32" ? ["Control", "Alt"] : xo ? ["Alt"] : [];
function wo(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || Co.includes(t) && e.getModifierState("AltGraph"));
}
function To(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? So : e;
		}), n];
	});
}
function Eo(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !wo(e, t);
	}) || yo.find(function(t) {
		return !n.includes(t) && r !== t && wo(e, t);
	}));
}
function Do(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [To(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			Eo(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : wo(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function Oo(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = Do(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function ko(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function Ao(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function jo(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (Ao(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			ko(e.target) || r(e);
		};
	}
	return t;
}
function Mo(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = jo(e), i = () => {
		n ||= Oo(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? On(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), tr(a);
}
//#endregion
//#region packages/sdk-vue/src/markdown.ts
var No = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
function Po(e) {
	return e.replace(/[&<>"']/g, (e) => No[e] ?? e);
}
var Fo = /\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, Io = "CODE", Lo = "END";
function Ro(e, t) {
	let n = [], r = e.replace(/`([^`]+)`/g, (e, t) => (n.push("<code>" + t + "</code>"), Io + (n.length - 1) + Lo));
	if (r = r.replace(Fo, (e) => "<a href=\"" + e + "\" rel=\"noopener noreferrer\">" + e + "</a>"), t.workspaceId) {
		let e = encodeURIComponent(t.workspaceId);
		r = r.replace(/(^|[^\w&])#(\d+)\b/g, (t, n, r) => n + "<a href=\"/x/issues/" + e + "/" + r + "\" class=\"issue-ref\">#" + r + "</a>");
	}
	r = r.replace(/\*\*([^*]+)\*\*/g, (e, t) => "<strong>" + t + "</strong>"), r = r.replace(/(^|[^*])\*([^*\s][^*]*?[^*\s]|[^*\s])\*(?!\*)/g, (e, t, n) => t + "<em>" + n + "</em>");
	let i = /* @__PURE__ */ RegExp("CODE(\\d+)END", "g");
	return r.replace(i, (e, t) => n[Number(t)] ?? "");
}
function zo(e) {
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
function Bo(e, t = {}) {
	if (!e) return "";
	let n = zo(e), r = [];
	for (let e of n) switch (e.kind) {
		case "heading": {
			let n = e.level ?? 1, i = Ro(Po(e.text), t);
			r.push("<h" + n + ">" + i + "</h" + n + ">");
			break;
		}
		case "paragraph": {
			let n = Ro(Po(e.text), t);
			r.push("<p>" + n.replace(/\n/g, "<br />") + "</p>");
			break;
		}
		case "code": {
			let t = e.lang ? " data-lang=\"" + Po(e.lang) + "\"" : "";
			r.push("<pre" + t + "><code>" + Po(e.text) + "</code></pre>");
			break;
		}
		case "list": {
			let n = e.ordered ? "ol" : "ul", i = (e.items ?? []).map((e) => "  <li>" + Ro(Po(e), t) + "</li>").join("\n");
			r.push("<" + n + ">\n" + i + "\n</" + n + ">");
			break;
		}
	}
	return r.join("\n");
}
function Vo(e, t = 280) {
	let n = e.replace(/\s+/g, " ").trim();
	return n.length <= t ? n : n.slice(0, t) + "…";
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function Ho(e) {
	Uo(e.tagName, e.component);
	let t = /* @__PURE__ */ Za(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(Go(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function Uo(e, t) {
	if (typeof document > "u") return;
	let n = Wo(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function Wo(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function Go(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_docs/ui/src/DocsPanel.vue?vue&type=script&setup=true&lang.ts
var Ko = {
	class: "docs-panel",
	"data-smoke": "docs-panel"
}, qo = { class: "docs-head" }, Jo = { class: "title-block" }, Yo = { class: "muted" }, Xo = {
	key: 0,
	class: "muted error",
	role: "alert"
}, Zo = {
	key: 1,
	class: "muted error",
	role: "alert"
}, Qo = { class: "docs-project-head" }, $o = { class: "docs-project-root" }, es = { class: "docs-type-head" }, ts = { class: "docs-type-key" }, ns = { class: "docs-type-label" }, rs = { class: "docs-type-scope" }, is = { class: "muted docs-type-count" }, as = {
	key: 0,
	class: "docs-type-desc"
}, os = {
	key: 1,
	class: "docs-type-props"
}, ss = {
	key: 2,
	class: "docs-files"
}, cs = [
	"onClick",
	"onFocus",
	"onMouseenter",
	"onKeydown"
], ls = { class: "docs-file-head" }, us = { class: "docs-file-caret" }, ds = { class: "docs-file-title" }, fs = { class: "docs-file-path" }, ps = {
	key: 0,
	class: "docs-file-front"
}, ms = {
	key: 1,
	class: "docs-file-body"
}, hs = ["innerHTML"], gs = {
	key: 3,
	class: "muted no-files"
}, _s = /* @__PURE__ */ ((e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
})(/* @__PURE__ */ In({
	__name: "DocsPanel",
	props: {
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] },
		repositorySegments: { type: Array },
		projectName: { type: String }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ Vt("loading"), r = /* @__PURE__ */ Vt(null), i = /* @__PURE__ */ Vt(null), a = /* @__PURE__ */ Vt([]), o = sa(() => i.value?.projects ?? []), s = sa(() => t.projectName ? o.value.filter((e) => e.name === t.projectName) : o.value), c = sa(() => {
			let e = 0;
			for (let t of s.value) for (let n of Object.values(t.docs ?? {})) e += x(t, n).length;
			return e;
		}), l = /* @__PURE__ */ Vt(null), u = /* @__PURE__ */ Vt(null);
		function d(e) {
			return l.value === e;
		}
		function f(e) {
			l.value = d(e) ? null : e, u.value = e;
		}
		function p(e) {
			u.value = e;
		}
		let m = sa(() => {
			let e = [];
			for (let t of s.value) for (let n of S(t)) for (let r of x(t, n.type)) e.push(r.path);
			return e;
		});
		function h(e) {
			let t = m.value;
			if (t.length === 0) return;
			let n = u.value, r = n ? t.indexOf(n) : -1;
			u.value = t[Math.max(0, Math.min(t.length - 1, r + e))] ?? null;
		}
		Mo({
			Escape: (e) => {
				l.value &&= (e.preventDefault(), null);
			},
			j: (e) => {
				u.value && (e.preventDefault(), h(1));
			},
			ArrowDown: (e) => {
				u.value && (e.preventDefault(), h(1));
			},
			k: (e) => {
				u.value && (e.preventDefault(), h(-1));
			},
			ArrowUp: (e) => {
				u.value && (e.preventDefault(), h(-1));
			},
			Enter: (e) => {
				u.value && (e.preventDefault(), f(u.value));
			},
			" ": (e) => {
				u.value && (e.preventDefault(), f(u.value));
			}
		}), Zn(() => {
			g();
		}), On(() => t.repositoryPath, () => void g());
		async function g() {
			n.value = "loading", r.value = null;
			try {
				let e = t.repositorySegments ?? [], r = e.length > 0 ? await ho().query("query Q($segments: [String!]!) {\n            workspace { repositoryByPath(segments: $segments) { comtryaConfig blobs { path preview size } } }\n          }", { segments: e }) : await ho().query("{ repository { comtryaConfig blobs { path preview size } } }"), o = r.workspace?.repositoryByPath ?? r.repository ?? null;
				i.value = o?.comtryaConfig ?? null, a.value = o?.blobs ?? [], n.value = "ready";
			} catch (e) {
				n.value = "error", r.value = e instanceof Error ? e.message : String(e);
			}
		}
		function _(e, t) {
			let n = (e ?? "").replace(/\/+$/g, "").replace(/^\.\/?/, ""), r = (t ?? "").replace(/^\/+/g, "").replace(/^\.\//, "");
			return n ? !r || r === "." ? n : `${n}/${r}` : r;
		}
		function v(e, t) {
			return _((e.root ?? "").replace(/\/+$/g, ""), t.slug ?? "");
		}
		function y(e) {
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
				a[n] = b(t[2].trim());
			}
			return {
				props: a,
				body: i
			};
		}
		function b(e) {
			let t = e.trim();
			return t ? t === "true" || t === "false" ? t === "true" : /^-?\d+$/.test(t) ? Number(t) : t.startsWith("[") && t.endsWith("]") ? t.slice(1, -1).split(",").map((e) => e.trim().replace(/^"(.*)"$/, "$1")).filter((e) => e.length > 0) : t.replace(/^"(.*)"$/, "$1") : "";
		}
		function x(e, t) {
			let n = v(e, t), r = n ? `${n}/` : "";
			return a.value.filter((e) => !e.path || !e.path.endsWith(".mdx") && !e.path.endsWith(".md") ? !1 : r ? e.path.startsWith(r) : !0).map((e) => {
				let { props: t, body: n } = y(e.preview), r = typeof t.title == "string" && t.title.length > 0 ? t.title : (e.path ?? "").split("/").pop() ?? e.path ?? "(untitled)", i = (e.path ?? "").split("/").pop() ?? e.path ?? "";
				return {
					path: e.path ?? "",
					fileName: i,
					title: r,
					frontMatter: t,
					body: n
				};
			}).sort((e, t) => e.fileName.localeCompare(t.fileName));
		}
		function S(e) {
			return e.docs ? Object.entries(e.docs).map(([e, t]) => ({
				key: e,
				type: t
			})).sort((e, t) => e.key.localeCompare(t.key)) : [];
		}
		function C(e) {
			return e.properties ? Object.entries(e.properties).map(([e, t]) => ({
				name: e,
				spec: t
			})) : [];
		}
		function w(e) {
			return typeof e == "string" ? e : e == null ? "any" : typeof e == "object" ? Object.keys(e).join(" | ") || "object" : String(e);
		}
		function T(e) {
			return e == null ? "·" : Array.isArray(e) ? e.map(T).join(" · ") : typeof e == "object" ? Object.entries(e).map(([e, t]) => `${e}=${T(t)}`).join(" · ") : String(e);
		}
		return (t, a) => (J(), Y("section", Ko, [
			X("header", qo, [X("div", Jo, [a[8] ||= X("h2", null, "Docs", -1), X("span", Yo, [n.value === "loading" ? (J(), Y(K, { key: 0 }, [Q("reading repo CUE config…")], 64)) : n.value === "error" ? (J(), Y(K, { key: 1 }, [Q("unavailable")], 64)) : c.value === 0 ? (J(), Y(K, { key: 2 }, [
				a[0] ||= Q(" No MDX docs declared. Add a ", -1),
				a[1] ||= X("code", null, "docs", -1),
				a[2] ||= Q(" block to a Project in ", -1),
				a[3] ||= X("code", null, "package comtrya", -1),
				a[4] ||= Q(" to surface them here. ", -1)
			], 64)) : (J(), Y(K, { key: 3 }, [
				Q(A(c.value) + " doc", 1),
				c.value === 1 ? Fi("", !0) : (J(), Y(K, { key: 0 }, [Q("s")], 64)),
				Q(" across " + A(s.value.length) + " project", 1),
				s.value.length === 1 ? Fi("", !0) : (J(), Y(K, { key: 1 }, [Q("s")], 64)),
				a[5] ||= Q(" · shape from ", -1),
				a[6] ||= X("code", null, "ext_docs", -1),
				a[7] ||= Q("'s registered CUE schema ", -1)
			], 64))])])]),
			n.value === "error" ? (J(), Y("p", Xo, A(r.value), 1)) : i.value?.error ? (J(), Y("p", Zo, A(i.value.error), 1)) : Fi("", !0),
			(J(!0), Y(K, null, sr(s.value, (t) => Sn((J(), Y("article", {
				key: t.name,
				class: "docs-project"
			}, [X("header", Qo, [X("h3", null, A(t.name), 1), X("code", $o, A(t.root || "<repo root>") + "/", 1)]), (J(!0), Y(K, null, sr(S(t), (n) => (J(), Y("section", {
				key: n.key,
				class: "docs-type"
			}, [
				X("header", es, [
					X("code", ts, A(n.key), 1),
					X("span", ns, A(n.type.label || n.key), 1),
					X("code", rs, A(v(t, n.type) || "<project root>") + "/", 1),
					X("span", is, [Q(A(x(t, n.type).length) + " file", 1), x(t, n.type).length === 1 ? Fi("", !0) : (J(), Y(K, { key: 0 }, [Q("s")], 64))])
				]),
				n.type.description ? (J(), Y("p", as, A(n.type.description), 1)) : Fi("", !0),
				C(n.type).length > 0 ? (J(), Y("dl", os, [
					(J(!0), Y(K, null, sr(C(n.type), (e) => (J(), Y(K, { key: e.name }, [X("dt", null, [X("code", null, A(e.name), 1)]), X("dd", null, A(w(e.spec)), 1)], 64))), 128)),
					a[9] ||= X("dt", { class: "implicit" }, [X("code", null, "body")], -1),
					a[10] ||= X("dd", { class: "implicit" }, "MDX body (implicit)", -1)
				])) : Fi("", !0),
				x(t, n.type).length > 0 ? (J(), Y("ol", ss, [(J(!0), Y(K, null, sr(x(t, n.type), (t) => (J(), Y("li", {
					key: t.path,
					class: he(["docs-file", {
						focused: u.value === t.path,
						expanded: d(t.path)
					}]),
					tabindex: "0",
					onClick: (e) => f(t.path),
					onFocus: (e) => p(t.path),
					onMouseenter: (e) => p(t.path),
					onKeydown: io(no((e) => f(t.path), ["prevent"]), ["enter"])
				}, [
					X("header", ls, [
						X("span", us, A(d(t.path) ? "▾" : "▸"), 1),
						X("strong", ds, A(t.title), 1),
						X("code", fs, A(t.path), 1)
					]),
					Object.keys(t.frontMatter).length > 0 ? (J(), Y("dl", ps, [(J(!0), Y(K, null, sr(t.frontMatter, (e, t) => (J(), Y(K, { key: t }, [X("dt", null, [X("code", null, A(t), 1)]), X("dd", null, A(T(e)), 1)], 64))), 128))])) : Fi("", !0),
					t.body && !d(t.path) ? (J(), Y("p", ms, A(Wt(Vo)(t.body)), 1)) : Fi("", !0),
					t.body && d(t.path) ? (J(), Y("article", {
						key: 2,
						class: "docs-file-rendered",
						innerHTML: Wt(Bo)(t.body, { workspaceId: e.workspaceId ?? "" })
					}, null, 8, hs)) : Fi("", !0)
				], 42, cs))), 128))])) : (J(), Y("p", gs, [
					a[11] ||= Q(" No MDX files in ", -1),
					X("code", null, A(v(t, n.type)) + "/", 1),
					a[12] ||= Q(" yet. ", -1)
				]))
			]))), 128))])), [[xa, S(t).length > 0]])), 128))
		]));
	}
}), [["styles", [".docs-panel{font-family:var(--sans,system-ui);gap:14px;display:grid}.docs-panel .docs-head{border-bottom:1.5px solid var(--ink,#111);justify-content:space-between;align-items:baseline;padding-bottom:6px;display:flex}.docs-panel h2{font-family:var(--display,system-ui);margin:0;font-size:22px;line-height:1}.docs-panel .title-block{flex-wrap:wrap;align-items:baseline;gap:14px;display:inline-flex}.docs-panel .muted{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.docs-panel .muted code{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);background:var(--paper-tint,#f2efe7);padding:0 4px;font-size:11px}.docs-panel .muted.error{color:var(--accent-err,#c9341c)}.docs-panel .docs-project{border:1.5px solid var(--ink,#111);background:var(--paper,#fffdf8)}.docs-panel .docs-project-head{background:var(--paper-tint,#f2efe7);border-bottom:1px solid var(--rule-light,#d8d1c4);flex-wrap:wrap;align-items:baseline;gap:12px;padding:10px 14px;display:flex}.docs-panel .docs-project-head h3{font-family:var(--display,system-ui);margin:0;font-size:16px;line-height:1}.docs-panel .docs-project-root{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);font-size:12px}.docs-panel .docs-type{border-bottom:1px solid var(--rule-light,#d8d1c4);padding:12px 14px}.docs-panel .docs-type:last-child{border-bottom:0}.docs-panel .docs-type-head{flex-wrap:wrap;align-items:baseline;gap:8px 12px;margin-bottom:6px;display:flex}.docs-panel .docs-type-key{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;color:var(--accent-blue,#1d55a6);font-size:12px;font-weight:700}.docs-panel .docs-type-label{font-family:var(--display,system-ui);font-size:14px;font-weight:600}.docs-panel .docs-type-scope{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);background:var(--paper-tint,#f2efe7);padding:0 5px;font-size:11px}.docs-panel .docs-type-count{margin-left:auto}.docs-panel .docs-type-desc{font-family:var(--sans,system-ui);color:var(--ink-soft,#2c2b28);margin:0 0 8px;font-size:13px}.docs-panel .docs-type-props{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);grid-template-columns:auto 1fr;gap:2px 14px;margin:0 0 10px;font-size:11px;display:grid}.docs-panel .docs-type-props dt{font-weight:600}.docs-panel .docs-type-props dt code{color:var(--ink,#111)}.docs-panel .docs-type-props .implicit code,.docs-panel .docs-type-props .implicit{color:var(--ink-fainter,#918b80);font-style:italic}.docs-panel .docs-files{gap:8px;margin:0;padding:0;list-style:none;display:grid}.docs-panel .docs-file{border-left:2px solid var(--rule-light,#d8d1c4);cursor:pointer;padding:6px 0 6px 12px;transition:border-color .12s}.docs-panel .docs-file:hover,.docs-panel .docs-file.focused{border-left-color:var(--ink-faint,#68645c);background:color-mix(in srgb, var(--paper-tint,#f2efe7) 50%, transparent)}.docs-panel .docs-file.expanded{border-left-color:var(--accent-blue,#1d55a6);cursor:default}.docs-panel .docs-file:focus{outline:none}.docs-panel .docs-file-caret{width:12px;color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);display:inline-block}.docs-panel .docs-file-head{flex-wrap:wrap;align-items:baseline;gap:10px;margin-bottom:2px;display:flex}.docs-panel .docs-file-title{font-family:var(--display,system-ui);font-size:13px}.docs-panel .docs-file-path{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.docs-panel .docs-file-front{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);grid-template-columns:auto 1fr;gap:1px 12px;margin:0 0 4px;font-size:11px;display:grid}.docs-panel .docs-file-front dt code{color:var(--ink-soft,#2c2b28)}.docs-panel .docs-file-body{font-family:var(--sans,system-ui);color:var(--ink-soft,#2c2b28);white-space:pre-wrap;word-break:break-word;margin:0;font-size:12px}.docs-panel .docs-file-rendered{border-top:1px solid var(--rule-light,#d8d1c4);font-family:var(--sans,system-ui);color:var(--ink,#111);margin-top:8px;padding:12px 0 4px;font-size:13px;line-height:1.55}.docs-panel .docs-file-rendered h1,.docs-panel .docs-file-rendered h2,.docs-panel .docs-file-rendered h3,.docs-panel .docs-file-rendered h4{font-family:var(--display,system-ui);margin:12px 0 6px;line-height:1.2}.docs-panel .docs-file-rendered h1{font-size:20px}.docs-panel .docs-file-rendered h2{font-size:16px}.docs-panel .docs-file-rendered h3{text-transform:uppercase;letter-spacing:.06em;color:var(--ink-faint,#68645c);font-size:14px}.docs-panel .docs-file-rendered p{margin:0 0 8px}.docs-panel .docs-file-rendered ul{margin:0 0 8px 18px;padding:0;list-style:outside}.docs-panel .docs-file-rendered ul li{margin:2px 0}.docs-panel .docs-file-rendered code{font-family:var(--mono,monospace);background:var(--paper-tint,#f2efe7);border-radius:2px;padding:0 4px;font-size:12px}.docs-panel .docs-file-rendered pre{background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);white-space:pre-wrap;word-break:break-word;border-left:2px solid var(--rule-light,#d8d1c4);margin:8px 0;padding:10px 12px;font-size:12px;line-height:1.45}.docs-panel .docs-file-rendered pre code{background:0 0;padding:0}.docs-panel .docs-file-rendered strong{font-weight:700}.docs-panel .docs-file-rendered em{font-style:italic}.docs-panel .no-files{margin:0}"]]]), vs = "ext_docs", ys = "comtrya-docs-panel";
Ho({
	tagName: ys,
	component: _s
});
var bs = {
	id: vs,
	setup(e) {
		e.registerWidget({
			id: "docs-panel",
			element: ys,
			defaultSlot: "repository.main",
			defaultPriority: 80,
			requiredPermission: "workspace.read"
		});
	}
};
//#endregion
export { bs as default };
