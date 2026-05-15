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
var be = (e) => !!(e && e.__v_isRef === !0), j = (e) => g(e) ? e : e == null ? "" : d(e) || v(e) && (e.toString === b || !h(e.toString)) ? be(e) ? j(e.value) : JSON.stringify(e, xe, 2) : String(e), xe = (e, t) => be(t) ? xe(e, t.value) : f(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[Se(t, r) + " =>"] = n, e), {}) } : p(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => Se(e)) } : _(t) ? Se(t) : v(t) && !d(t) && !C(t) ? String(t) : t, Se = (e, t = "") => _(e) ? `Symbol(${e.description ?? t})` : e, M, Ce = class {
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
function we() {
	return M;
}
var N, Te = /* @__PURE__ */ new WeakSet(), Ee = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, M && (M.active ? M.effects.push(this) : this.flags &= -2);
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
		let e = N, t = ze;
		N = this, ze = !0;
		try {
			return this.fn();
		} finally {
			Pe(this), N = e, ze = t, this.flags &= -3;
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
	let t = e.dep, n = N, r = ze;
	N = e, ze = !0;
	try {
		Ne(e);
		let n = e.fn(e._value);
		(t.version === 0 || O(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		N = n, ze = r, Pe(e), e.flags &= -3;
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
		let e = N;
		N = void 0;
		try {
			t();
		} finally {
			N = e;
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
		if (!N || !ze || N === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== N) t = this.activeLink = new Ge(N, this), N.deps ? (t.prevDep = N.depsTail, N.depsTail.nextDep = t, N.depsTail = t) : N.deps = N.depsTail = t, qe(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = N.depsTail, t.nextDep = void 0, N.depsTail.nextDep = t, N.depsTail = t, N.deps === t && (N.deps = e);
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
function P(e, t, n) {
	if (ze && N) {
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
	Ve(), je();
	let r = (/* @__PURE__ */ I(e))[t].apply(e, n);
	return Me(), He(), r;
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
		e = n ? e : /* @__PURE__ */ I(e), O(e, t) && (this._rawValue = e, this._value = n ? e : Vt(e), this.dep.trigger());
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
		if (this.flags |= 16, !(this.flags & 8) && N !== this) return Ae(this, !0), !0;
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
	let x = we(), S = () => {
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
	return u && u(w), m = new Ee(g), m.scheduler = l ? () => l(w, !1) : w, v = (e) => Qt(e, !1, m), _ = m.onStop = () => {
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
		c && (Ve(), nn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), He());
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
	let s = a.shapeFlag & 4 ? ca(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ I(v), b = v === t ? i : (e) => Bn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Bn(_, t));
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
le().requestIdleCallback, le().cancelIdleCallback;
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
			Ve();
			let i = Xi(n), a = nn(t, n, e, r);
			return i(), He(), a;
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
			En(t, e[t]);
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
					let u = l._ceVNode || Pi(n, r);
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
var Mr = null, Nr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${E(t)}Modifiers`] || e[`${D(t)}Modifiers`];
function Pr(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && Nr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(oe)));
	let c, l = i[c = ie(n)] || i[c = ie(E(n))];
	!l && o && (l = i[c = ie(D(n))]), l && nn(l, e, 6, a);
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
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, D(t)) || u(e, t));
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
		wi.length = 0, rn(t, e, 1), v = Pi(Si);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = Br(y, a)), b = Li(b, y, !1, !0));
	}
	return n.dirs && (b = Li(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && Ln(b, n.transition), v = b, Sn(_), v;
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
		e ? (oi(r, t, n), n && k(r, "_", e, !0)) : ii(t, r);
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
			case W:
				ie(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? O(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, j);
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
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && E(e.children, d, null, r, i, di(e, a), s, u), _ && Tn(e, null, r, "created"), te(d, e, e.scopeId, s, r), m) {
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
		if (r && fi(r, !1), (g = h.onVnodeBeforeUpdate) && Ui(g, r, n, e), f && Tn(n, e, r, "beforeUpdate"), r && fi(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? D(e.dynamicChildren, d, l, r, i, di(n, a), o) : s || ue(e, n, l, null, r, i, di(n, a), o, !1), u > 0) {
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
			g && Ui(g, r, n, e), f && Tn(n, e, r, "updated");
		}, i);
	}, D = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === W || !ji(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
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
		if (Gn(e) && (s.ctx.renderer = j), ea(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, se, o), !e.el) {
				let r = s.subTree = Pi(Si);
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
							U(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				fi(e, !1), t ? (t.el = c.el, ce(e, t, o)) : t = c, n && ae(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Ui(d, s, t, c), fi(e, !0);
				let f = Rr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ve(p), e, i, a), t.el = f.el, u === null && Wr(e, f.el), r && U(r, i), (d = t.props && t.props.onVnodeUpdated) && U(() => Ui(d, s, t, c), i);
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
				if (u && U(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					U(() => Ui(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Wn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && U(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new Ee(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => mn(u), fi(e, !0), l();
	}, ce = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Yr(e, t.props, r, n), ci(e, t.children, n), Ve(), _n(e), He();
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
			c.move(e, t, n, j);
			return;
		}
		if (c === W) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) pe(u[e], t, n, r);
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
	}, me = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (Ve(), Hn(s, null, n, e, !0), He()), p != null && (t.renderCache[p] = void 0), u & 256) {
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
			h && Tn(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, j, r) : l && !l.hasOnce && (a !== W || d > 0 && d & 64) ? _e(l, t, n, !1, !0) : (a === W && d & 384 || !i && u & 16) && _e(c, t, n), r && A(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && U(() => {
			_ && Ui(_, t, e), h && Tn(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, A = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === W) {
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
		_i(c), _i(l), r && ae(r), i.stop(), a && (a.flags |= 8, me(o, e, t, n)), s && U(s, t), U(() => {
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
		e == null ? t._vnode && (me(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, ye ||= (ye = !0, _n(r), vn(), !1);
	}, j = {
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
	}, xe, Se;
	return i && ([xe, Se] = i(j)), {
		render: be,
		hydrate: xe,
		createApp: jr(be, xe)
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
	return Oi(Pi(e, t, n, r, i, !0));
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
var Pi = Fi;
function Fi(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === cr) && (e = Si), Ai(e)) {
		let r = Li(e, t, !0);
		return n && Vi(r, n), Ei > 0 && !a && G && (r.shapeFlag & 6 ? G[G.indexOf(e)] = r : G.push(r)), r.patchFlag = -2, r;
	}
	if (la(e) && (e = e.__vccOpts), t) {
		t = Ii(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = A(e)), v(n) && (/* @__PURE__ */ zt(n) && !d(n) && (n = s({}, n)), t.style = ue(n));
	}
	let o = g(e) ? 1 : yi(e) ? 128 : Fn(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return J(e, t, n, r, i, o, a, !0);
}
function Ii(e) {
	return e ? /* @__PURE__ */ zt(e) || qr(e) ? s({}, e) : e : null;
}
function Li(e, t, n = !1, r = !1) {
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
		ssContent: e.ssContent && Li(e.ssContent),
		ssFallback: e.ssFallback && Li(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && Ln(u, c.clone(u)), u;
}
function Y(e = " ", t = 0) {
	return Pi(xi, null, e, t);
}
function Ri(e, t) {
	let n = Pi(Ci, null, e);
	return n.staticCount = t, n;
}
function X(e = "", t = !1) {
	return t ? (K(), ki(Si, null, e)) : Pi(Si, null, e);
}
function zi(e) {
	return e == null || typeof e == "boolean" ? Pi(Si) : d(e) ? Pi(W, null, e.slice()) : Ai(e) ? Bi(e) : Pi(xi, null, String(e));
}
function Bi(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : Li(e);
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
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Y(t)]) : n = 8);
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
var Z = null, qi = () => Z || V, Ji, Yi;
{
	let e = le(), t = (t, n) => {
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
		Ve();
		let n = e.setupContext = r.length > 1 ? sa(e) : null, i = Xi(e), a = tn(r, e, 0, [e.props, n]), o = y(a);
		if (He(), i(), (o || e.sp) && !Wn(e) && zn(e), o) {
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
		Ve();
		try {
			gr(e);
		} finally {
			He(), t();
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
	return e.exposed ? e.exposeProxy ||= new Proxy(Kt(Bt(e.exposed)), {
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
		this._app && (e.appContext = this._app._context), ho(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Pi(this._def, s(e, this._props));
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
		let r = D(n.key);
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
//#region packages/sdk-vue/src/markdown.ts
var is = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
function as(e) {
	return e.replace(/[&<>"']/g, (e) => is[e] ?? e);
}
var os = /\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, ss = "CODE", cs = "END";
function ls(e) {
	let t = [], n = e.replace(/`([^`]+)`/g, (e, n) => (t.push("<code>" + n + "</code>"), ss + (t.length - 1) + cs));
	n = n.replace(os, (e) => "<a href=\"" + e + "\" rel=\"noopener noreferrer\">" + e + "</a>"), n = n.replace(/\*\*([^*]+)\*\*/g, (e, t) => "<strong>" + t + "</strong>"), n = n.replace(/(^|[^*])\*([^*\s][^*]*?[^*\s]|[^*\s])\*(?!\*)/g, (e, t, n) => t + "<em>" + n + "</em>");
	let r = /* @__PURE__ */ RegExp("CODE(\\d+)END", "g");
	return n.replace(r, (e, n) => t[Number(n)] ?? "");
}
function us(e) {
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
function ds(e) {
	if (!e) return "";
	let t = us(e), n = [];
	for (let e of t) switch (e.kind) {
		case "heading": {
			let t = e.level ?? 1, r = ls(as(e.text));
			n.push("<h" + t + ">" + r + "</h" + t + ">");
			break;
		}
		case "paragraph": {
			let t = ls(as(e.text));
			n.push("<p>" + t.replace(/\n/g, "<br />") + "</p>");
			break;
		}
		case "code": {
			let t = e.lang ? " data-lang=\"" + as(e.lang) + "\"" : "";
			n.push("<pre" + t + "><code>" + as(e.text) + "</code></pre>");
			break;
		}
		case "list": {
			let t = e.ordered ? "ol" : "ul", r = (e.items ?? []).map((e) => "  <li>" + ls(as(e)) + "</li>").join("\n");
			n.push("<" + t + ">\n" + r + "\n</" + t + ">");
			break;
		}
	}
	return n.join("\n");
}
//#endregion
//#region packages/sdk-vue/src/parse-query.ts
function fs(e, t) {
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
var ps = {
	kind: "unknown",
	label: "unknown",
	glyph: "·",
	tone: "neutral"
};
function $(e) {
	if (!e) return ps;
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: ms(r),
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
			glyph: ms(r) || "·",
			tone: "neutral"
		};
	}
}
function ms(e) {
	return e.slice(0, 1).toUpperCase();
}
function hs(e) {
	return $(e).label;
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function gs(e) {
	_s(e.tagName, e.component);
	let t = /* @__PURE__ */ Za(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(ys(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function _s(e, t) {
	if (typeof document > "u") return;
	let n = vs(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function vs(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function ys(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
var bs = "ext_pull_requests", xs = "pulls";
function Ss(e, t) {
	return t ? `comtrya://workspace/${e}/repository/${t}` : `comtrya://workspace/${e}`;
}
function Cs(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function ws(e) {
	switch ((typeof e == "string" ? e : e && typeof e == "object" && typeof e.tag == "string" ? e.tag : "").toLowerCase()) {
		case "draft": return "DRAFT";
		case "merged": return "MERGED";
		case "closed": return "CLOSED";
		default: return "READY";
	}
}
function Ts(e) {
	return {
		id: e.id,
		repository: e.repository,
		workspace: e.workspace ?? null,
		number: e.number,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: ws(e.state),
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
async function Es(e) {
	return Cs(await yo(bs, xs, "list-pulls", {
		repository: Ss(e.workspaceId, e.repositoryId),
		limit: e.limit ?? 256
	}), "list-pulls").map(Ts);
}
async function Ds(e) {
	let t = Cs(await yo(bs, xs, "get-pull", e), "get-pull");
	return t ? Ts(t) : null;
}
async function Os(e, t) {
	return Ts(Cs(await yo(bs, xs, "merge-pull", {
		id: e,
		mergedByRef: t ?? null
	}), "merge-pull"));
}
async function ks(e, t) {
	return Ts(Cs(await yo(bs, xs, "close-pull", {
		id: e,
		closedByRef: t ?? null
	}), "close-pull"));
}
function As(e) {
	switch ((typeof e == "string" ? e : e && typeof e == "object" && typeof e.tag == "string" ? e.tag : "").toLowerCase()) {
		case "closed": return "CLOSED";
		case "reopened": return "REOPENED";
		default: return "OPEN";
	}
}
async function js(e) {
	if (!e) return [];
	let t = `comtrya://pull_request/${e}`, n = (await wo().query("query LinkedIssues($from: ResourceURN!, $kind: ResourceURN) {\n      relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n    }", {
		from: t,
		kind: "comtrya://rel/com.comtrya.pulls/closes"
	})).relations?.outgoing ?? [], r = Array.from(new Set(n.map((e) => e.to ?? e.target ?? "").filter((e) => e.startsWith("comtrya://issue/"))));
	return (await Promise.all(r.map(Ms))).filter((e) => e !== null);
}
async function Ms(e) {
	let t = await yo("ext_issues", "issues", "by-ref-issue", e);
	if (!t.ok) return null;
	let n = t.value;
	if (!n || typeof n != "object") return null;
	let r = typeof n.projectName == "string" && n.projectName.trim().length > 0 ? n.projectName.trim() : null, i = typeof n.repository == "string" ? n.repository : null, a = typeof n.workspace == "string" ? n.workspace : null, o = Ns(i ?? a);
	return {
		id: typeof n.id == "string" ? n.id : "",
		number: typeof n.number == "number" ? n.number : null,
		title: typeof n.title == "string" ? n.title : "(untitled)",
		state: As(n.state),
		uri: e,
		projectName: r,
		workspaceId: o
	};
}
function Ns(e) {
	if (!e) return null;
	let t = e.match(/^comtrya:\/\/workspace\/([^/]+)/);
	return t ? t[1] ?? null : null;
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/types.ts
var Ps = "pulls";
function Fs() {
	return Oo(Ps, "/");
}
function Is(e) {
	return Oo(Ps, `/${e.id}`);
}
function Ls(e) {
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
function Rs(e) {
	if (!e) return "";
	let t = Date.parse(e);
	if (Number.isNaN(t)) return e;
	let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
	return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/pr-commands.ts
var zs = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", Bs = /* @__PURE__ */ new Map();
function Vs(e) {
	return [
		e.id,
		e.number,
		e.title,
		e.state
	].join("|");
}
function Hs(e) {
	let t = [];
	return t.push($o({
		id: `ext_pull_requests.open.${e.id}`,
		title: `Open PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: () => {
			window.location.href = Is(e);
		}
	})), (e.state === "READY" || e.state === "DRAFT") && t.push($o({
		id: `ext_pull_requests.merge.${e.id}`,
		title: `Merge PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: async () => {
			await Os(e.id);
		}
	})), e.state !== "CLOSED" && e.state !== "MERGED" && t.push($o({
		id: `ext_pull_requests.close.${e.id}`,
		title: `Close PR #${e.number} — ${e.title}`,
		category: "Pull requests",
		extensionId: "ext_pull_requests",
		run: async () => {
			await ks(e.id);
		}
	})), () => t.forEach((e) => e());
}
async function Us(e) {
	let t;
	try {
		t = await Es({ workspaceId: e });
	} catch (e) {
		console.warn("[ext_pull_requests] palette sync failed:", e);
		return;
	}
	let n = /* @__PURE__ */ new Set();
	for (let e of t) {
		n.add(e.id);
		let t = Vs(e), r = Bs.get(e.id);
		r && r.signature === t || (r?.unregister(), Bs.set(e.id, {
			signature: t,
			unregister: Hs(e)
		}));
	}
	for (let [e, t] of Bs) n.has(e) || (t.unregister(), Bs.delete(e));
}
function Ws() {
	let e = zs;
	Us(e);
	let t = [
		"dev.comtrya.pull-request.created",
		"dev.comtrya.pull-request.merged",
		"dev.comtrya.pull-request.closed"
	].map((t) => ko({
		type: t,
		onEvent: () => {
			Us(e);
		},
		onError: () => {}
	}));
	return () => {
		for (let e of t) e();
		for (let e of Bs.values()) e.unregister();
		Bs.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/diff.ts
var Gs = /^diff --git a\/(.+?) b\/(.+)$/, Ks = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;
function qs(e) {
	if (!e) return [];
	let t = [], n = e.split("\n"), r = null, i = null, a = 0, o = 0, s = () => {
		r && i && r.hunks.push(i), i = null;
	}, c = () => {
		s(), r && t.push(r), r = null;
	};
	for (let e of n) {
		let t = e.match(Gs);
		if (t) {
			c();
			let [, e, n] = t;
			r = {
				oldPath: e ?? "",
				newPath: n ?? "",
				displayPath: n || e || "",
				status: "modified",
				language: Ys(n || e || ""),
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
		let n = e.match(Ks);
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
var Js = {
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
function Ys(e) {
	let t = e.lastIndexOf(".");
	return t < 0 ? "plain" : Js[e.slice(t + 1).toLowerCase()] ?? "plain";
}
function Xs(e) {
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
var Zs = "comtrya-diff-view-styles", Qs = "\n.diff-view {\n  display: grid;\n  gap: 14px;\n  font-family: var(--sans, system-ui);\n}\n\n.diff-summary {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  flex-wrap: wrap;\n  gap: 12px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 8px;\n}\n\n.diff-summary h2 {\n  margin: 0;\n  font-family: var(--display, system-ui);\n  font-size: 18px;\n}\n\n.diff-totals {\n  display: inline-flex;\n  flex-wrap: wrap;\n  gap: 10px 14px;\n  align-items: baseline;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--ink-faint, #68645c);\n}\n\n.diff-totals .adds { color: var(--accent-teal, #087f6f); }\n.diff-totals .dels { color: var(--accent-err, #c9341c); }\n.diff-totals .hint { color: var(--ink-fainter, #918b80); }\n\n.diff-totals .hint kbd {\n  border: 1px solid currentColor;\n  padding: 0 4px;\n  font-family: var(--mono, monospace);\n  font-size: 10px;\n}\n\n.diff-view .muted {\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  color: var(--ink-faint, #68645c);\n}\n\n.diff-view .muted.error { color: var(--accent-err, #c9341c); }\n\n.diff-files {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n  gap: 14px;\n}\n\n.diff-file {\n  border: 1.5px solid var(--ink, #111);\n  background: var(--paper, #fffdf8);\n}\n\n.diff-file.focused {\n  box-shadow: -3px 0 0 0 var(--accent-orange, #e34a20);\n}\n\n.diff-file-head {\n  display: grid;\n  grid-template-columns: 14px auto minmax(0, 1fr) auto auto;\n  gap: 10px;\n  align-items: center;\n  padding: 8px 10px;\n  border-bottom: 1px solid var(--rule-light, #d8d1c4);\n  cursor: pointer;\n  background: var(--paper-tint, #f2efe7);\n}\n\n.diff-file-head:hover,\n.diff-file-head:focus-visible {\n  background: color-mix(in srgb, var(--paper-tint, #f2efe7) 80%, var(--ink, #111));\n  outline: none;\n}\n\n.diff-file-head .caret {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #68645c);\n}\n\n.file-status {\n  font-family: var(--mono, monospace);\n  font-size: 10px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  padding: 1px 6px;\n  border: 1px solid currentColor;\n}\n\n.status-added { color: var(--accent-teal, #087f6f); }\n.status-deleted { color: var(--accent-err, #c9341c); }\n.status-modified { color: var(--accent-blue, #1d55a6); }\n.status-renamed { color: var(--accent-yellow, #c89300); }\n\n.file-path {\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.file-rename {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #68645c);\n}\n\n.file-counts {\n  display: inline-flex;\n  gap: 8px;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n}\n\n.file-counts .adds { color: var(--accent-teal, #087f6f); }\n.file-counts .dels { color: var(--accent-err, #c9341c); }\n\n.diff-file-body { display: grid; gap: 0; }\n\n.diff-hunk { border-top: 1px solid var(--rule-light, #d8d1c4); }\n.diff-hunk:first-child { border-top: 0; }\n\n.diff-hunk-head {\n  background: var(--paper-tint, #f2efe7);\n  padding: 4px 10px;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #68645c);\n}\n\n.diff-hunk table {\n  width: 100%;\n  border-collapse: collapse;\n  font-family: var(--mono, monospace);\n  font-size: 12px;\n  line-height: 1.45;\n}\n\n.diff-line.line-add {\n  background: color-mix(in srgb, var(--accent-teal, #087f6f) 10%, var(--paper, #fffdf8));\n}\n\n.diff-line.line-del {\n  background: color-mix(in srgb, var(--accent-err, #c9341c) 10%, var(--paper, #fffdf8));\n}\n\n.diff-line.line-meta { color: var(--ink-fainter, #918b80); }\n\n.diff-line td {\n  padding: 0;\n  vertical-align: top;\n  white-space: pre-wrap;\n  word-break: break-word;\n}\n\n.diff-line .ln {\n  width: 48px;\n  padding: 0 8px;\n  color: var(--ink-fainter, #918b80);\n  text-align: right;\n  user-select: none;\n  background: color-mix(in srgb, var(--paper-tint, #f2efe7) 60%, var(--paper, #fffdf8));\n  border-right: 1px solid var(--rule-light, #d8d1c4);\n  font-variant-numeric: tabular-nums;\n}\n\n.diff-line.line-add .ln.new,\n.diff-line.line-del .ln.old {\n  color: var(--ink-soft, #2c2b28);\n}\n\n.diff-line .marker {\n  width: 18px;\n  padding: 0 4px;\n  text-align: center;\n  color: var(--ink-faint, #68645c);\n  user-select: none;\n}\n\n.diff-line.line-add .marker { color: var(--accent-teal, #087f6f); }\n.diff-line.line-del .marker { color: var(--accent-err, #c9341c); }\n.diff-line .content { padding: 0 8px; }\n";
function $s() {
	if (typeof document > "u" || document.getElementById(Zs)) return;
	let e = document.createElement("style");
	e.id = Zs, e.textContent = Qs, document.head.appendChild(e);
}
//#endregion
//#region ../extensions/first-party/ext_pull_requests/ui/src/DiffView.vue?vue&type=script&setup=true&lang.ts
var ec = {
	class: "diff-view",
	"data-smoke": "pulls-diff-view"
}, tc = { class: "diff-summary" }, nc = { class: "diff-totals" }, rc = { class: "adds" }, ic = { class: "dels" }, ac = {
	key: 0,
	class: "muted"
}, oc = {
	key: 1,
	class: "muted error"
}, sc = {
	key: 2,
	class: "muted"
}, cc = {
	key: 3,
	class: "diff-files"
}, lc = ["data-diff-file-index"], uc = [
	"aria-expanded",
	"onClick",
	"onKeydown",
	"onFocus"
], dc = { class: "caret" }, fc = { class: "file-path" }, pc = {
	key: 0,
	class: "file-rename"
}, mc = { class: "file-counts" }, hc = { class: "adds" }, gc = { class: "dels" }, _c = {
	key: 0,
	class: "diff-file-body"
}, vc = {
	key: 0,
	class: "muted"
}, yc = { class: "diff-hunk-head" }, bc = { class: "ln old" }, xc = { class: "ln new" }, Sc = { class: "marker" }, Cc = { class: "content" }, wc = /* @__PURE__ */ Rn({
	__name: "DiffView",
	props: {
		patch: { type: String },
		loading: { type: Boolean },
		error: { type: [String, null] }
	},
	setup(e) {
		$s();
		let t = e, n = /* @__PURE__ */ R({}), r = /* @__PURE__ */ R(0), i = Q(() => qs(t.patch)), a = Q(() => Xs(i.value));
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
		return (t, n) => (K(), q("section", ec, [J("header", tc, [n[1] ||= J("h2", null, "Files changed", -1), J("div", nc, [
			J("span", null, [Y(j(a.value.files) + " file", 1), a.value.files === 1 ? X("", !0) : (K(), q(W, { key: 0 }, [Y("s")], 64))]),
			J("span", rc, "+" + j(a.value.additions), 1),
			J("span", ic, "-" + j(a.value.deletions), 1),
			n[0] ||= J("span", { class: "hint" }, [
				J("kbd", null, "n"),
				Y("/"),
				J("kbd", null, "p"),
				Y(" next/prev file · "),
				J("kbd", null, "space"),
				Y(" collapse ")
			], -1)
		])]), e.loading ? (K(), q("p", ac, "Loading diff…")) : e.error ? (K(), q("p", oc, j(e.error), 1)) : i.value.length === 0 ? (K(), q("p", sc, " No diff to show. Push commits to head and base refs to populate this view. ")) : (K(), q("ol", cc, [(K(!0), q(W, null, lr(i.value, (e, t) => (K(), q("li", {
			key: e.displayPath + t,
			class: A(["diff-file", { focused: t === r.value }]),
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
			J("span", dc, j(s(e.displayPath) ? "▸" : "▾"), 1),
			J("span", { class: A(["file-status", `status-${e.status}`]) }, j(c(e)), 3),
			J("code", fc, j(e.displayPath), 1),
			e.status === "renamed" && e.oldPath !== e.newPath ? (K(), q("span", pc, [n[2] ||= Y(" from ", -1), J("code", null, j(e.oldPath), 1)])) : X("", !0),
			J("span", mc, [J("span", hc, "+" + j(e.additions), 1), J("span", gc, "-" + j(e.deletions), 1)])
		], 40, uc), s(e.displayPath) ? X("", !0) : (K(), q("div", _c, [e.binary ? (K(), q("p", vc, "Binary file — no preview.")) : (K(!0), q(W, { key: 1 }, lr(e.hunks, (e, t) => (K(), q("section", {
			key: t,
			class: "diff-hunk"
		}, [J("header", yc, [J("code", null, j(e.header.replace(/^@@ /, "").replace(/ @@$/, "")), 1)]), J("table", null, [J("tbody", null, [(K(!0), q(W, null, lr(e.lines, (e, t) => (K(), q("tr", {
			key: t,
			class: A(["diff-line", `line-${e.kind}`])
		}, [
			J("td", bc, j(e.oldNumber ?? ""), 1),
			J("td", xc, j(e.newNumber ?? ""), 1),
			J("td", Sc, [e.kind === "add" ? (K(), q(W, { key: 0 }, [Y("+")], 64)) : e.kind === "del" ? (K(), q(W, { key: 1 }, [Y("-")], 64)) : e.kind === "meta" ? (K(), q(W, { key: 2 }, [Y("\\")], 64)) : (K(), q(W, { key: 3 }, [], 64))]),
			J("td", Cc, j(e.text), 1)
		], 2))), 128))])])]))), 128))]))], 10, lc))), 128))]))]));
	}
}), Tc = {
	class: "pulls-detail",
	"data-smoke": "pulls-detail"
}, Ec = {
	key: 0,
	class: "pulls-empty"
}, Dc = {
	key: 1,
	class: "pulls-error",
	role: "alert"
}, Oc = {
	key: 2,
	class: "pulls-empty"
}, kc = ["href"], Ac = { class: "pulls-detail-head" }, jc = { class: "pulls-detail-title" }, Mc = ["href"], Nc = { class: "pulls-detail-number" }, Pc = {
	class: "pulls-chip-row",
	"aria-label": "Pull request metadata"
}, Fc = { class: "pull-chip tone-branch" }, Ic = ["title"], Lc = ["data-author-kind", "title"], Rc = { class: "chip-glyph" }, zc = {
	key: 0,
	class: "pull-chip tone-time tone-merged"
}, Bc = {
	key: 1,
	class: "pull-chip tone-time tone-closed"
}, Vc = {
	key: 2,
	class: "pull-chip tone-time"
}, Hc = { class: "pulls-detail-actions" }, Uc = ["disabled"], Wc = ["disabled"], Gc = {
	key: 0,
	class: "pulls-action-message"
}, Kc = {
	key: 0,
	class: "pulls-detail-body"
}, qc = ["innerHTML"], Jc = {
	key: 1,
	class: "pulls-detail-body muted"
}, Yc = {
	key: 2,
	class: "pulls-routed",
	"data-smoke": "pulls-routed",
	"aria-label": "CUE project routing"
}, Xc = { class: "muted" }, Zc = { class: "pulls-routed-list" }, Qc = ["href", "title"], $c = {
	key: 0,
	class: "pulls-routed-owners"
}, el = ["data-author-kind", "title"], tl = { class: "chip-glyph" }, nl = {
	key: 1,
	class: "pulls-routed-owners muted"
}, rl = {
	key: 3,
	class: "pulls-linked-issues",
	"data-smoke": "pulls-linked-issues"
}, il = { class: "muted" }, al = {
	key: 0,
	role: "listbox",
	"aria-label": "Linked issues"
}, ol = ["aria-selected", "onMouseenter"], sl = ["href"], cl = { class: "issue-num" }, ll = { class: "issue-title" }, ul = ["href", "title"], dl = {
	key: 1,
	class: "pulls-linked-foot"
}, fl = /* @__PURE__ */ Rn({
	__name: "PullsDetail",
	props: { routeParams: { type: null } },
	setup(e) {
		let t = e, n = Q(() => t.routeParams?.params?.pullId ?? ""), r = /* @__PURE__ */ R(null), i = /* @__PURE__ */ R("idle"), a = /* @__PURE__ */ R(null), o = /* @__PURE__ */ R("idle"), s = /* @__PURE__ */ R(null), c = /* @__PURE__ */ R(""), l = /* @__PURE__ */ R(""), u = /* @__PURE__ */ R("idle"), d = /* @__PURE__ */ R(null), f = /* @__PURE__ */ R([]), p = /* @__PURE__ */ R("idle"), m = /* @__PURE__ */ R(-1), h = /* @__PURE__ */ R([]);
		function g(e) {
			let t = (e ?? "").replace(/^\.\//, "").replace(/\/+$/g, "");
			return t === "." ? "" : t;
		}
		let _ = Q(() => {
			if (h.value.length === 0 || !c.value) return [];
			let e = h.value.map((e) => ({
				name: e.name ?? "",
				root: g(e.root)
			})).filter((e) => e.name).sort((e, t) => t.root.length - e.root.length), t = /* @__PURE__ */ new Set();
			for (let n of qs(c.value)) {
				let r = n.displayPath.replace(/^\/+/, "");
				for (let n of e) if (n.root === "" || r === n.root || r.startsWith(`${n.root}/`)) {
					t.add(n.name);
					break;
				}
			}
			return Array.from(t).sort();
		}), v = Q(() => {
			let e = /* @__PURE__ */ new Set();
			for (let t of f.value) t.projectName && e.add(t.projectName);
			return Array.from(e).sort();
		}), y = Q(() => {
			let e = new Set([..._.value, ...v.value]);
			return Array.from(e).sort().map((e) => ({
				name: e,
				owners: (h.value.find((t) => t.name === e)?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0)
			}));
		}), b = $, x = Q(() => Ls(r.value?.state)), S = Q(() => r.value && (r.value.state === "READY" || r.value.state === "DRAFT")), C = Q(() => r.value && r.value.state !== "CLOSED" && r.value.state !== "MERGED"), w = Q(() => r.value?.bodyMarkdown ? ds(r.value.bodyMarkdown) : ""), ee = [];
		$n(() => {
			T(), re(), te();
			for (let e of [
				"dev.comtrya.issues.opened",
				"dev.comtrya.issues.closed",
				"dev.comtrya.issues.reopened"
			]) ee.push(ko({
				type: e,
				onEvent: () => void te(),
				onError: () => {}
			}));
		}), rr(() => {
			for (let e of ee) e();
			ee.length = 0;
		}), An(n, () => void te()), rs({
			m: (e) => {
				S.value && (e.preventDefault(), ie());
			},
			x: (e) => {
				C.value && (e.preventDefault(), O());
			},
			j: (e) => {
				if (f.value.length === 0) return;
				e.preventDefault();
				let t = m.value + 1;
				m.value = t >= f.value.length ? 0 : t;
			},
			k: (e) => {
				if (f.value.length === 0) return;
				e.preventDefault();
				let t = m.value - 1;
				m.value = t < 0 ? f.value.length - 1 : t;
			},
			Enter: (e) => {
				if (m.value < 0) return;
				let t = f.value[m.value];
				t && (e.preventDefault(), window.location.href = E(t));
			},
			Escape: (e) => {
				document.querySelector(".shortcuts-backdrop, .palette-backdrop") || (e.preventDefault(), window.location.href = Fs());
			}
		}), An(n, () => void T());
		async function T() {
			if (!n.value) {
				i.value = "error", a.value = "Missing pull id";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				r.value = await Ds(n.value), i.value = r.value ? "ready" : "empty";
			} catch (e) {
				i.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function te() {
			if (n.value) {
				p.value = "loading";
				try {
					f.value = await js(n.value), p.value = "ready";
				} catch {
					f.value = [], p.value = "error";
				}
				m.value = -1;
			}
		}
		function E(e) {
			return e.workspaceId && e.number !== null ? `/x/issues/${e.workspaceId}/${e.number}` : "/x/issues/";
		}
		function ne(e) {
			return `/x/issues/?project=${encodeURIComponent(e)}`;
		}
		function D(e) {
			switch (e) {
				case "CLOSED": return "issue-state-closed";
				default: return "issue-state-open";
			}
		}
		async function re() {
			u.value = "loading", d.value = null;
			try {
				let e = await wo().query("query PullDiff {\n        repository {\n          diff { path language patch }\n          comtryaConfig\n        }\n      }"), t = e.repository?.diff;
				c.value = t?.patch ?? "", l.value = t?.path ?? "", h.value = e.repository?.comtryaConfig?.projects ?? [], u.value = "ready";
			} catch (e) {
				u.value = "error", d.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function ie() {
			if (!(!r.value || !S.value)) {
				o.value = "merging", s.value = null;
				try {
					r.value = await Os(r.value.id), s.value = `Merged pull #${r.value.number}`;
				} catch (e) {
					s.value = e instanceof Error ? e.message : String(e);
				} finally {
					o.value = "idle";
				}
			}
		}
		async function O() {
			if (!(!r.value || !C.value)) {
				o.value = "closing", s.value = null;
				try {
					r.value = await ks(r.value.id), s.value = `Closed pull #${r.value.number}`;
				} catch (e) {
					s.value = e instanceof Error ? e.message : String(e);
				} finally {
					o.value = "idle";
				}
			}
		}
		return (e, t) => (K(), q("article", Tc, [i.value === "loading" ? (K(), q("p", Ec, "Loading pull request…")) : i.value === "error" ? (K(), q("p", Dc, j(a.value), 1)) : i.value === "empty" || !r.value ? (K(), q("p", Oc, [
			t[1] ||= Y(" No pull request found for ", -1),
			J("code", null, j(n.value), 1),
			t[2] ||= Y(". ", -1),
			J("a", { href: z(Fs)() }, "← back to queue", 8, kc)
		])) : (K(), q(W, { key: 3 }, [
			J("header", Ac, [J("div", jc, [
				J("a", {
					href: z(Fs)(),
					class: "back",
					"aria-label": "Back to pull request queue"
				}, "←", 8, Mc),
				J("span", Nc, "#" + j(r.value.number), 1),
				J("h1", null, j(r.value.title), 1)
			]), J("div", Pc, [
				J("span", { class: A([
					"pull-chip",
					"tone-state",
					x.value.className
				]) }, j(x.value.label), 3),
				J("span", Fc, [
					J("code", null, j(r.value.headRef), 1),
					t[3] ||= J("span", {
						class: "branch-arrow",
						"aria-hidden": "true"
					}, "→", -1),
					J("code", null, j(r.value.baseRef), 1)
				]),
				(K(!0), q(W, null, lr(_.value, (e) => (K(), q("span", {
					key: `project-${e}`,
					class: "pull-chip tone-project",
					title: `Touches files inside the ${e} Project's root`
				}, [t[4] ||= J("span", { class: "chip-glyph" }, "◇", -1), Y(j(e), 1)], 8, Ic))), 128)),
				J("span", {
					class: "pull-chip tone-author",
					"data-author-kind": z($)(r.value.authorRef).kind,
					title: `Opened by ${r.value.authorRef}`
				}, [J("span", Rc, j(z($)(r.value.authorRef).glyph), 1), Y(" by " + j(z($)(r.value.authorRef).label), 1)], 8, Lc),
				r.value.mergedAt ? (K(), q("span", zc, " merged " + j(z(Rs)(r.value.mergedAt)), 1)) : r.value.closedAt ? (K(), q("span", Bc, " closed " + j(z(Rs)(r.value.closedAt)), 1)) : X("", !0),
				r.value.createdAt ? (K(), q("span", Vc, " opened " + j(z(Rs)(r.value.createdAt)), 1)) : X("", !0)
			])]),
			J("section", Hc, [
				J("button", {
					type: "button",
					class: "pulls-action primary",
					disabled: !S.value || o.value !== "idle",
					onClick: ie
				}, [Y(j(o.value === "merging" ? "Merging…" : "Merge") + " ", 1), t[5] ||= J("kbd", null, "m", -1)], 8, Uc),
				J("button", {
					type: "button",
					class: "pulls-action",
					disabled: !C.value || o.value !== "idle",
					onClick: O
				}, [Y(j(o.value === "closing" ? "Closing…" : "Close") + " ", 1), t[6] ||= J("kbd", null, "x", -1)], 8, Wc),
				s.value ? (K(), q("span", Gc, j(s.value), 1)) : X("", !0)
			]),
			w.value ? (K(), q("section", Kc, [t[7] ||= J("h2", null, "Description", -1), J("div", {
				class: "pulls-detail-body-prose",
				innerHTML: w.value
			}, null, 8, qc)])) : (K(), q("section", Jc, [...t[8] ||= [J("h2", null, "Description", -1), J("p", null, "No description provided.", -1)]])),
			y.value.length > 0 ? (K(), q("section", Yc, [
				J("header", null, [t[9] ||= J("h2", null, "Routed to", -1), J("span", Xc, [Y(j(y.value.length) + " project", 1), y.value.length === 1 ? X("", !0) : (K(), q(W, { key: 0 }, [Y("s")], 64))])]),
				J("ul", Zc, [(K(!0), q(W, null, lr(y.value, (e) => (K(), q("li", {
					key: e.name,
					class: "pulls-routed-project"
				}, [J("a", {
					href: `/x/issues/?project=${encodeURIComponent(e.name)}`,
					class: "pulls-routed-name",
					title: `Filter issues to project ${e.name}`
				}, "◇ " + j(e.name), 9, Qc), e.owners.length > 0 ? (K(), q("ul", $c, [(K(!0), q(W, null, lr(e.owners, (e) => (K(), q("li", {
					key: e,
					class: "pulls-routed-owner",
					"data-author-kind": z(b)(e).kind,
					title: e
				}, [J("span", tl, j(z(b)(e).glyph), 1), Y(" " + j(z(b)(e).label), 1)], 8, el))), 128))])) : (K(), q("span", nl, " no owners declared "))]))), 128))]),
				t[10] ||= J("p", { class: "pulls-routed-source" }, [
					Y(" From paths the diff touched · issues this PR closes · "),
					J("code", null, "package comtrya"),
					Y(" owners ")
				], -1)
			])) : X("", !0),
			p.value !== "idle" || f.value.length > 0 ? (K(), q("section", rl, [
				J("header", null, [t[11] ||= J("h2", null, "Closes", -1), J("span", il, [p.value === "loading" ? (K(), q(W, { key: 0 }, [Y("resolving…")], 64)) : f.value.length === 0 ? (K(), q(W, { key: 1 }, [Y(" no linked issues ")], 64)) : (K(), q(W, { key: 2 }, [
					Y(j(f.value.length) + " issue", 1),
					f.value.length === 1 ? X("", !0) : (K(), q(W, { key: 0 }, [Y("s")], 64)),
					r.value.state === "MERGED" ? (K(), q(W, { key: 1 }, [Y(" — auto-closed on merge")], 64)) : (K(), q(W, { key: 2 }, [Y(" — will close on merge")], 64))
				], 64))])]),
				f.value.length > 0 ? (K(), q("ul", al, [(K(!0), q(W, null, lr(f.value, (e, n) => (K(), q("li", {
					key: e.uri,
					class: A({ focused: n === m.value }),
					"aria-selected": n === m.value,
					role: "option",
					onMouseenter: (e) => m.value = n
				}, [J("a", { href: E(e) }, [
					J("span", cl, [e.number === null ? (K(), q(W, { key: 1 }, [Y("issue")], 64)) : (K(), q(W, { key: 0 }, [Y("#" + j(e.number), 1)], 64))]),
					J("span", ll, j(e.title), 1),
					e.projectName ? (K(), q("a", {
						key: 0,
						class: "issue-project",
						href: ne(e.projectName),
						title: `Filter to project ${e.projectName}`,
						onClick: t[0] ||= co(() => {}, ["stop"])
					}, "◇ " + j(e.projectName), 9, ul)) : X("", !0),
					J("span", { class: A(["issue-state", D(e.state)]) }, j(e.state.toLowerCase()), 3)
				], 8, sl)], 42, ol))), 128))])) : X("", !0),
				f.value.length > 0 ? (K(), q("footer", dl, [...t[12] ||= [
					J("kbd", null, "j", -1),
					Y(),
					J("kbd", null, "k", -1),
					Y(" walk · ", -1),
					J("kbd", null, "↵", -1),
					Y(" open ", -1)
				]])) : X("", !0)
			])) : X("", !0),
			Pi(wc, {
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
}), pl = ".pulls-detail[data-v-da8fb83d]{font-family:var(--sans,system-ui);gap:22px;display:grid}.pulls-detail-head[data-v-da8fb83d]{border-bottom:1.5px solid var(--ink,#111);gap:12px;padding-bottom:16px;display:grid}.pulls-detail-title[data-v-da8fb83d]{flex-wrap:wrap;align-items:baseline;gap:12px;display:flex}.pulls-detail-title h1[data-v-da8fb83d]{font-family:var(--display,system-ui);flex:320px;margin:0;font-size:28px;line-height:1.1}.back[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:16px;text-decoration:none}.back[data-v-da8fb83d]:hover{color:var(--ink,#111)}.pulls-detail-number[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:14px}.pulls-chip-row[data-v-da8fb83d]{flex-wrap:wrap;align-items:center;gap:6px;margin:4px 0 0;display:flex}.pull-chip[data-v-da8fb83d]{border:1px solid var(--rule-light,#d8d1c4);font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);align-items:center;gap:5px;padding:2px 8px;font-size:11px;line-height:16px;display:inline-flex}.pull-chip .chip-glyph[data-v-da8fb83d]{place-items:center;width:13px;height:13px;font-size:10px;font-weight:700;display:inline-grid}.pull-chip.tone-state[data-v-da8fb83d]{text-transform:lowercase;letter-spacing:.02em;border-color:currentColor}.pull-chip.tone-state.pr-state-ready[data-v-da8fb83d]{color:var(--accent-teal,#087f6f)}.pull-chip.tone-state.pr-state-draft[data-v-da8fb83d]{color:var(--ink-faint,#68645c)}.pull-chip.tone-state.pr-state-merged[data-v-da8fb83d]{color:var(--accent-blue,#1d55a6)}.pull-chip.tone-state.pr-state-closed[data-v-da8fb83d]{color:var(--accent-err,#c9341c)}.pull-chip.tone-project[data-v-da8fb83d]{color:var(--accent-blue,#1d55a6);cursor:help;border-color:currentColor}.pull-chip.tone-branch[data-v-da8fb83d]{gap:4px}.pull-chip.tone-branch code[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);font-size:11px}.pull-chip.tone-branch .branch-arrow[data-v-da8fb83d]{color:var(--ink-fainter,#918b80);padding:0 2px}.pull-chip.tone-author[data-v-da8fb83d]{color:var(--ink-soft,#2c2b28)}.pull-chip.tone-author[data-author-kind=agent][data-v-da8fb83d]{color:#6b3fa0}.pull-chip.tone-author[data-author-kind=credential][data-v-da8fb83d]{color:var(--accent-yellow,#c89300)}.pull-chip.tone-author[data-author-kind=bot][data-v-da8fb83d]{color:var(--accent-blue,#1d55a6)}.pull-chip.tone-author[data-author-kind=team][data-v-da8fb83d]{color:var(--accent-teal,#087f6f)}.pull-chip.tone-time[data-v-da8fb83d]{color:var(--ink-faint,#68645c);border-style:none;padding-left:2px}.pull-chip.tone-time.tone-merged[data-v-da8fb83d]{color:var(--accent-blue,#1d55a6)}.pull-chip.tone-time.tone-closed[data-v-da8fb83d]{color:var(--accent-err,#c9341c)}.pulls-detail-actions[data-v-da8fb83d]{flex-wrap:wrap;align-items:center;gap:10px;display:flex}.pulls-action[data-v-da8fb83d]{border:1.5px solid var(--ink,#111);background:var(--paper,#fffdf8);color:var(--ink,#111);font-family:var(--display,system-ui);cursor:pointer;align-items:center;gap:8px;padding:8px 14px;font-weight:600;display:inline-flex}.pulls-action.primary[data-v-da8fb83d]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.pulls-action[disabled][data-v-da8fb83d]{opacity:.5;cursor:not-allowed}.pulls-action kbd[data-v-da8fb83d]{font-family:var(--mono,monospace);opacity:.6;border:1px solid;padding:0 4px;font-size:10px}.pulls-action-message[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.pulls-detail-body h2[data-v-da8fb83d]{font-family:var(--display,system-ui);margin:0 0 8px;font-size:16px}.pulls-detail-body-prose[data-v-da8fb83d]{color:var(--ink,#1a1916);font-size:14px;line-height:1.6}.pulls-detail-body-prose h1[data-v-da8fb83d],.pulls-detail-body-prose h2[data-v-da8fb83d],.pulls-detail-body-prose h3[data-v-da8fb83d],.pulls-detail-body-prose h4[data-v-da8fb83d],.pulls-detail-body-prose h5[data-v-da8fb83d],.pulls-detail-body-prose h6[data-v-da8fb83d]{font-family:var(--display,system-ui);margin:1.1em 0 .4em;font-weight:600;line-height:1.25}.pulls-detail-body-prose h1[data-v-da8fb83d]{font-size:20px}.pulls-detail-body-prose h2[data-v-da8fb83d]{font-size:17px}.pulls-detail-body-prose h3[data-v-da8fb83d],.pulls-detail-body-prose h4[data-v-da8fb83d]{font-size:15px}.pulls-detail-body-prose p[data-v-da8fb83d]{margin:.55em 0}.pulls-detail-body-prose ul[data-v-da8fb83d],.pulls-detail-body-prose ol[data-v-da8fb83d]{margin:.4em 0 .6em;padding-left:22px}.pulls-detail-body-prose li[data-v-da8fb83d]{margin:.15em 0}.pulls-detail-body-prose code[data-v-da8fb83d]{font-family:var(--mono,monospace);background:var(--ink-tint,#f2efe6);border-radius:2px;padding:1px 5px;font-size:.88em}.pulls-detail-body-prose pre[data-v-da8fb83d]{font-family:var(--mono,monospace);background:var(--ink-tint,#f2efe6);border:1px solid var(--ink-rule,#d8d6cf);white-space:pre;word-break:normal;margin:.7em 0;padding:12px 14px;font-size:12.5px;line-height:1.55;overflow-x:auto}.pulls-detail-body-prose pre code[data-v-da8fb83d]{font-size:inherit;background:0 0;padding:0}.pulls-detail-body-prose a[data-v-da8fb83d]{color:var(--accent-teal,#087f6f);text-underline-offset:2px;text-decoration:underline}.pulls-detail-body-prose strong[data-v-da8fb83d]{font-weight:600}.pulls-detail-body-prose em[data-v-da8fb83d]{font-style:italic}.pulls-detail-body.muted p[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.pulls-routed[data-v-da8fb83d]{border:1px solid var(--ink-rule,#d0cfc8);background:var(--paper-tint,#f2efe7);gap:10px;padding:12px 14px;display:grid}.pulls-routed>header[data-v-da8fb83d]{border-bottom:1px solid var(--ink-rule,#d0cfc8);justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:6px;display:flex}.pulls-routed>header h2[data-v-da8fb83d]{font-family:var(--display,system-ui);margin:0;font-size:16px}.pulls-routed>header .muted[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.pulls-routed-list[data-v-da8fb83d]{gap:10px;margin:0;padding:0;list-style:none;display:grid}.pulls-routed-project[data-v-da8fb83d]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper,#fffdf8);gap:6px;padding:8px 10px;display:grid}.pulls-routed-name[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--accent-blue,#1d55a6);letter-spacing:.02em;font-size:12px;text-decoration:none}.pulls-routed-name[data-v-da8fb83d]:hover{text-underline-offset:2px;text-decoration:underline}.pulls-routed-owners[data-v-da8fb83d]{flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none;display:flex}.pulls-routed-owners.muted[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px;font-style:italic}.pulls-routed-owner[data-v-da8fb83d]{color:var(--ink,#111);font-family:var(--mono,monospace);letter-spacing:.02em;border:1px solid;align-items:center;gap:5px;padding:2px 8px;font-size:11px;display:inline-flex}.pulls-routed-owner .chip-glyph[data-v-da8fb83d]{font-family:var(--display,system-ui);font-size:12px;line-height:1}.pulls-routed-owner[data-author-kind=team][data-v-da8fb83d]{color:var(--accent-teal,#087f6f)}.pulls-routed-owner[data-author-kind=human][data-v-da8fb83d]{color:var(--ink,#111)}.pulls-routed-owner[data-author-kind=agent][data-v-da8fb83d]{color:#6b3fa0}.pulls-routed-owner[data-author-kind=bot][data-v-da8fb83d]{color:var(--accent-blue,#1d55a6)}.pulls-routed-owner[data-author-kind=credential][data-v-da8fb83d]{color:var(--accent-yellow,#c89300)}.pulls-routed-source[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);margin:0;font-size:11px}.pulls-routed-source code[data-v-da8fb83d]{font-family:var(--mono,monospace);background:var(--paper-tint,#f2efe7);color:var(--ink-soft,#2c2b28);padding:0 4px;font-size:11px}.pulls-linked-issues[data-v-da8fb83d]{gap:8px;display:grid}.pulls-linked-issues header[data-v-da8fb83d]{border-bottom:1.5px solid var(--ink,#111);justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:4px;display:flex}.pulls-linked-issues h2[data-v-da8fb83d]{font-family:var(--display,system-ui);margin:0;font-size:18px}.pulls-linked-issues .muted[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px}.pulls-linked-issues ul[data-v-da8fb83d]{margin:0;padding:0;list-style:none;display:grid}.pulls-linked-issues li[data-v-da8fb83d]{position:relative}.pulls-linked-issues li.focused[data-v-da8fb83d]{box-shadow:inset 3px 0 0 var(--ink,#111)}.pulls-linked-issues li.focused a[data-v-da8fb83d]{background:var(--paper-tint,#f2efe7)}.pulls-linked-issues li a[data-v-da8fb83d]{color:inherit;border-bottom:1px solid var(--rule-light,#d8d1c4);grid-template-columns:auto minmax(0,1fr) auto auto;align-items:baseline;gap:12px;padding:8px 10px;text-decoration:none;display:grid}.pulls-linked-issues li:last-child a[data-v-da8fb83d]{border-bottom:0}.pulls-linked-issues .issue-project[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border:1px solid var(--rule-light,#d8d1c4);letter-spacing:.02em;white-space:nowrap;padding:1px 7px;font-size:11px;text-decoration:none}.pulls-linked-issues .issue-project[data-v-da8fb83d]:hover{color:var(--ink,#111);border-color:var(--ink,#111)}.pulls-linked-foot[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);letter-spacing:.04em;margin-top:6px;font-size:11px}.pulls-linked-foot kbd[data-v-da8fb83d]{font-family:var(--mono,monospace);border:1px solid var(--rule-light,#d8d1c4);margin:0 1px;padding:0 4px;font-size:10px}.pulls-linked-issues .issue-num[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums;font-size:12px}.pulls-linked-issues .issue-title[data-v-da8fb83d]{font-family:var(--display,system-ui);text-overflow:ellipsis;white-space:nowrap;font-weight:500;overflow:hidden}.pulls-linked-issues .issue-state[data-v-da8fb83d]{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 5px;font-size:10px}.pulls-linked-issues .issue-state-open[data-v-da8fb83d]{color:var(--accent-teal,#087f6f)}.pulls-linked-issues .issue-state-closed[data-v-da8fb83d]{color:var(--accent-blue,#1d55a6)}.pulls-empty[data-v-da8fb83d],.pulls-error[data-v-da8fb83d]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:13px}.pulls-error[data-v-da8fb83d]{color:var(--accent-err,#c9341c)}", ml = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, hl = /* @__PURE__ */ ml(fl, [["styles", [pl]], ["__scopeId", "data-v-da8fb83d"]]), gl = {
	class: "pulls-overview",
	"data-smoke": "pulls-overview"
}, _l = ["href"], vl = {
	key: 0,
	class: "muted"
}, yl = {
	key: 1,
	class: "muted"
}, bl = {
	key: 2,
	class: "muted"
}, xl = { key: 3 }, Sl = ["href"], Cl = { class: "num" }, wl = { class: "title" }, Tl = { class: "age" }, El = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", Dl = /* @__PURE__ */ ml(/* @__PURE__ */ Rn({
	__name: "PullsOverview",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R([]), r = /* @__PURE__ */ R("idle"), i = Q(() => t.workspaceId ?? t.host?.workspaceId ?? El), a = Q(() => t.repositoryId ?? t.host?.repositoryId ?? null), o = Q(() => n.value.filter((e) => e.state === "READY" || e.state === "DRAFT").sort((e, t) => {
			let n = Date.parse(e.updatedAt ?? e.createdAt ?? "") || 0;
			return (Date.parse(t.updatedAt ?? t.createdAt ?? "") || 0) - n;
		}).slice(0, 5)), s = Q(() => n.value.filter((e) => e.state === "READY").length);
		$n(() => void c()), An(() => [i.value, a.value], () => void c());
		async function c() {
			r.value = "loading";
			try {
				n.value = await Es({
					workspaceId: i.value,
					repositoryId: a.value,
					limit: 32
				}), r.value = n.value.length > 0 ? "ready" : "empty";
			} catch {
				r.value = "error", n.value = [];
			}
		}
		return (e, t) => (K(), q("section", gl, [J("header", null, [t[0] ||= J("h3", null, "Pull requests", -1), J("a", { href: z(Fs)() }, j(s.value) + " open", 9, _l)]), r.value === "loading" ? (K(), q("p", vl, "Loading…")) : r.value === "error" ? (K(), q("p", yl, "Could not load pulls.")) : o.value.length === 0 ? (K(), q("p", bl, "No open pull requests.")) : (K(), q("ul", xl, [(K(!0), q(W, null, lr(o.value, (e) => (K(), q("li", { key: e.id }, [J("a", { href: z(Is)(e) }, [
			J("span", Cl, "#" + j(e.number), 1),
			J("span", wl, j(e.title), 1),
			J("span", { class: A(["state", z(Ls)(e.state).className]) }, j(z(Ls)(e.state).label), 3),
			J("span", Tl, j(z(Rs)(e.updatedAt ?? e.createdAt)), 1)
		], 8, Sl)]))), 128))]))]));
	}
}), [["styles", [".pulls-overview[data-v-c112b1d8]{gap:8px;display:grid}.pulls-overview header[data-v-c112b1d8]{justify-content:space-between;align-items:baseline;display:flex}.pulls-overview h3[data-v-c112b1d8]{font-family:var(--display,system-ui);margin:0;font-size:14px}.pulls-overview header a[data-v-c112b1d8],.muted[data-v-c112b1d8]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px;text-decoration:none}.pulls-overview ul[data-v-c112b1d8]{gap:4px;margin:0;padding:0;list-style:none;display:grid}.pulls-overview li a[data-v-c112b1d8]{color:inherit;border-bottom:1px solid var(--rule-light,#d8d1c4);grid-template-columns:auto minmax(0,1fr) auto auto;align-items:baseline;gap:8px;padding:6px 0;text-decoration:none;display:grid}.pulls-overview li:last-child a[data-v-c112b1d8]{border-bottom:0}.num[data-v-c112b1d8]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.title[data-v-c112b1d8]{text-overflow:ellipsis;white-space:nowrap;font-weight:500;overflow:hidden}.state[data-v-c112b1d8]{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.state.pr-state-ready[data-v-c112b1d8]{color:var(--accent-teal,#087f6f)}.state.pr-state-draft[data-v-c112b1d8]{color:var(--ink-faint,#68645c)}.state.pr-state-merged[data-v-c112b1d8]{color:var(--accent-blue,#1d55a6)}.state.pr-state-closed[data-v-c112b1d8]{color:var(--accent-err,#c9341c)}.age[data-v-c112b1d8]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}"]], ["__scopeId", "data-v-c112b1d8"]]), Ol = {
	class: "pulls-queue",
	"data-smoke": "pulls-queue"
}, kl = { class: "pulls-queue-head" }, Al = { class: "pulls-queue-controls" }, jl = {
	class: "pulls-filter-row",
	role: "tablist",
	"aria-label": "Filter pulls by state"
}, Ml = ["aria-selected", "onClick"], Nl = { class: "count" }, Pl = { class: "pulls-search" }, Fl = {
	key: 0,
	class: "pulls-query-chips",
	"data-smoke": "pulls-query-chips",
	"aria-label": "Parsed search filters"
}, Il = ["title"], Ll = {
	key: 1,
	class: "pulls-author-filter",
	"data-smoke": "pulls-author-filter"
}, Rl = ["data-author-kind", "title"], zl = { class: "author-glyph" }, Bl = {
	key: 0,
	class: "pulls-empty"
}, Vl = {
	key: 1,
	class: "pulls-error",
	role: "alert"
}, Hl = {
	key: 2,
	class: "pulls-empty"
}, Ul = {
	key: 3,
	class: "pulls-empty"
}, Wl = {
	key: 4,
	class: "pulls-list",
	role: "listbox",
	"aria-label": "Pull request queue"
}, Gl = ["aria-selected", "onMouseenter"], Kl = ["href"], ql = { class: "pulls-row-number" }, Jl = { class: "pulls-row-body" }, Yl = { class: "pulls-row-title" }, Xl = { class: "pulls-row-meta" }, Zl = { class: "pulls-branch" }, Ql = [
	"data-author-kind",
	"title",
	"onClick"
], $l = { class: "author-glyph" }, eu = { class: "author-label" }, tu = { class: "pulls-row-age" }, nu = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", ru = /* @__PURE__ */ ml(/* @__PURE__ */ Rn({
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
		], r = /* @__PURE__ */ R("OPEN"), i = /* @__PURE__ */ R(""), a = /* @__PURE__ */ R(""), o = /* @__PURE__ */ R([]), s = /* @__PURE__ */ R("idle"), c = /* @__PURE__ */ R(null), l = /* @__PURE__ */ R(0), u = Q(() => t.workspaceId ?? t.host?.workspaceId ?? nu), d = Q(() => t.repositoryId ?? t.host?.repositoryId ?? null), f = (e, t) => t === "ALL" ? !0 : t === "OPEN" ? e.state === "READY" : e.state === t, p = ["is", "author"], m = {
			open: "OPEN",
			draft: "DRAFT",
			merged: "MERGED",
			closed: "CLOSED",
			all: "ALL"
		}, h = Q(() => fs(i.value, p)), g = Q(() => {
			let e = h.value.filters.is ?? [];
			for (let t of e) {
				let e = m[t.toLowerCase()];
				if (e) return e;
			}
			return r.value;
		}), _ = Q(() => {
			let e = h.value.filters.author ?? [];
			for (let t of e) if (t.startsWith("comtrya://")) return t;
			return a.value;
		}), v = Q(() => {
			let e = h.value.text.trim().toLowerCase(), t = _.value, n = g.value;
			return o.value.filter((e) => f(e, n)).filter((e) => t ? e.authorRef === t : !0).filter((t) => {
				if (!e) return !0;
				let n = $(t.authorRef);
				return `${t.number} ${t.title} ${t.headRef} ${t.baseRef} ${n.label} ${n.kind}`.toLowerCase().includes(e);
			});
		}), y = Q(() => {
			let e = [];
			for (let t of h.value.filters.is ?? []) {
				let n = m[t.toLowerCase()];
				e.push({
					key: "is",
					value: t,
					label: n ? `is · ${n.toLowerCase()}` : `is · ${t}`,
					tone: "is"
				});
			}
			for (let t of h.value.filters.author ?? []) {
				let n = $(t);
				e.push({
					key: "author",
					value: t,
					label: `author · ${n.label}`,
					tone: "author"
				});
			}
			for (let t of h.value.unknown) e.push({
				key: t,
				value: "",
				label: `unknown · ${t}:`,
				tone: "unknown"
			});
			return e;
		});
		function b(e) {
			a.value === e ? a.value = "" : a.value = e;
		}
		function x() {
			a.value = "";
		}
		let S = Q(() => {
			let e = {
				OPEN: 0,
				DRAFT: 0,
				MERGED: 0,
				CLOSED: 0,
				ALL: o.value.length
			};
			for (let t of o.value) t.state === "READY" && (e.OPEN += 1), t.state === "DRAFT" && (e.DRAFT += 1), t.state === "MERGED" && (e.MERGED += 1), t.state === "CLOSED" && (e.CLOSED += 1);
			return e;
		}), C = new Set([
			"OPEN",
			"DRAFT",
			"MERGED",
			"CLOSED",
			"ALL"
		]);
		function w() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = (e.get("state") ?? "").toUpperCase();
			C.has(t) && (r.value = t);
			let n = e.get("q");
			n !== null && (i.value = n);
			let o = e.get("author") ?? "";
			a.value = o.startsWith("comtrya://") ? o : "";
		}
		function ee() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			r.value === "OPEN" ? e.delete("state") : e.set("state", r.value);
			let t = i.value.trim();
			t ? e.set("q", t) : e.delete("q"), a.value ? e.set("author", a.value) : e.delete("author");
			let n = e.toString(), o = `${window.location.pathname}${n ? `?${n}` : ""}${window.location.hash}`;
			o !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", o);
		}
		let T = !1;
		function te() {
			T = !0, w(), fn(() => {
				T = !1;
			});
		}
		$n(() => {
			T = !0, w(), T = !1, ne(), window.addEventListener("popstate", te);
		}), rr(() => {
			window.removeEventListener("popstate", te);
		}), An(() => [u.value, d.value], () => void ne()), An(v, () => {
			l.value >= v.value.length && (l.value = Math.max(0, v.value.length - 1));
		}), An([
			r,
			i,
			a
		], () => {
			T || ee();
		}), rs({
			j: (e) => {
				e.preventDefault(), l.value = Math.min(l.value + 1, Math.max(0, v.value.length - 1));
			},
			ArrowDown: (e) => {
				e.preventDefault(), l.value = Math.min(l.value + 1, Math.max(0, v.value.length - 1));
			},
			k: (e) => {
				e.preventDefault(), l.value = Math.max(l.value - 1, 0);
			},
			ArrowUp: (e) => {
				e.preventDefault(), l.value = Math.max(l.value - 1, 0);
			},
			Enter: (e) => {
				let t = v.value[l.value];
				t && (e.preventDefault(), window.location.href = Is(t));
			},
			"/": (e) => {
				e.preventDefault(), document.querySelector("[data-pulls-search]")?.focus();
			},
			...Object.fromEntries(n.map((e) => [e.key, (t) => {
				t.preventDefault(), r.value = e.id;
			}]))
		});
		function E(e) {
			i.value &&= (e.preventDefault(), "");
		}
		async function ne() {
			s.value = "loading", c.value = null;
			try {
				o.value = (await Es({
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
		return (e, t) => (K(), q("section", Ol, [
			J("header", kl, [
				t[4] ||= J("h2", null, "Pull requests", -1),
				J("div", Al, [J("div", jl, [(K(), q(W, null, lr(n, (e) => J("button", {
					key: e.id,
					type: "button",
					role: "tab",
					"aria-selected": r.value === e.id,
					class: A(["pulls-filter", { active: r.value === e.id }]),
					onClick: (t) => r.value = e.id
				}, [
					J("span", null, j(e.label), 1),
					J("span", Nl, j(S.value[e.id]), 1),
					J("kbd", null, j(e.key), 1)
				], 10, Ml)), 64))]), J("label", Pl, [wn(J("input", {
					"data-pulls-search": "",
					"onUpdate:modelValue": t[0] ||= (e) => i.value = e,
					type: "search",
					placeholder: "Filter — try is:open · author:<urn> · text",
					autocomplete: "off",
					onKeydown: uo(E, ["esc"])
				}, null, 544), [[ao, i.value]]), t[1] ||= J("kbd", null, "/", -1)])]),
				y.value.length > 0 ? (K(), q("div", Fl, [(K(!0), q(W, null, lr(y.value, (e) => (K(), q("span", {
					key: `${e.key}:${e.value || "unknown"}`,
					class: A(["query-chip", `tone-${e.tone}`]),
					title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
				}, j(e.label), 11, Il))), 128)), t[2] ||= J("span", { class: "query-chips-hint" }, [
					Y(" syntax: "),
					J("code", null, "is:open"),
					Y(" · "),
					J("code", null, "is:draft"),
					Y(" · "),
					J("code", null, "author:<urn>")
				], -1)])) : X("", !0),
				a.value ? (K(), q("div", Ll, [
					t[3] ||= J("span", { class: "prefix" }, "authored by", -1),
					J("span", {
						class: "active-chip",
						"data-author-kind": z($)(a.value).kind,
						title: a.value
					}, [J("span", zl, j(z($)(a.value).glyph), 1), Y(" " + j(z($)(a.value).label), 1)], 8, Rl),
					J("button", {
						type: "button",
						class: "clear",
						onClick: x,
						"aria-label": "Clear author filter"
					}, "clear ✕")
				])) : X("", !0)
			]),
			s.value === "loading" ? (K(), q("p", Bl, "Loading pull requests…")) : s.value === "error" ? (K(), q("p", Vl, j(c.value), 1)) : o.value.length === 0 ? (K(), q("p", Hl, [...t[5] ||= [
				Y(" No pull requests yet. Push a branch and open one through the ", -1),
				J("code", null, "create-pull", -1),
				Y(" op or the SDK. ", -1)
			]])) : v.value.length === 0 ? (K(), q("p", Ul, " No pull requests match the current filter. ")) : (K(), q("ol", Wl, [(K(!0), q(W, null, lr(v.value, (e, n) => (K(), q("li", {
				key: e.id,
				class: A(["pulls-row", { focused: n === l.value }]),
				role: "option",
				"aria-selected": n === l.value,
				onMouseenter: (e) => l.value = n
			}, [J("a", {
				href: z(Is)(e),
				class: "pulls-row-link"
			}, [
				J("span", ql, "#" + j(e.number), 1),
				J("span", Jl, [J("span", Yl, j(e.title), 1), J("span", Xl, [
					J("span", { class: A(["pulls-state", z(Ls)(e.state).className]) }, j(z(Ls)(e.state).label), 3),
					J("code", Zl, [
						Y(j(e.headRef) + " ", 1),
						t[6] ||= J("span", null, "→", -1),
						Y(" " + j(e.baseRef), 1)
					]),
					J("button", {
						type: "button",
						class: A(["pulls-author", { active: a.value === e.authorRef }]),
						"data-author-kind": z($)(e.authorRef).kind,
						title: `${e.authorRef}\nClick to filter by this author`,
						onClick: co((t) => b(e.authorRef), ["prevent", "stop"])
					}, [J("span", $l, j(z($)(e.authorRef).glyph), 1), J("span", eu, j(z($)(e.authorRef).label), 1)], 10, Ql)
				])]),
				J("span", tu, j(z(Rs)(e.updatedAt ?? e.createdAt)), 1)
			], 8, Kl)], 42, Gl))), 128))])),
			t[7] ||= Ri("<footer class=\"pulls-queue-foot\" data-v-60fc0976><span data-v-60fc0976><kbd data-v-60fc0976>j</kbd> <kbd data-v-60fc0976>k</kbd> navigate · <kbd data-v-60fc0976>↵</kbd> open · <kbd data-v-60fc0976>/</kbd> search · <kbd data-v-60fc0976>o</kbd> open <kbd data-v-60fc0976>d</kbd> draft <kbd data-v-60fc0976>m</kbd> merged <kbd data-v-60fc0976>c</kbd> closed <kbd data-v-60fc0976>a</kbd> all </span></footer>", 1)
		]));
	}
}), [["styles", [".pulls-queue[data-v-60fc0976]{font-family:var(--sans,system-ui);color:var(--ink,#111);gap:16px;display:grid}.pulls-queue-head[data-v-60fc0976]{gap:12px;display:grid}.pulls-queue-head h2[data-v-60fc0976]{font-family:var(--display,system-ui);margin:0;font-size:22px;line-height:1}.pulls-queue-controls[data-v-60fc0976]{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;display:flex}.pulls-filter-row[data-v-60fc0976]{border:1.5px solid var(--ink,#111);flex-wrap:wrap;gap:4px;display:inline-flex}.pulls-filter[data-v-60fc0976]{color:inherit;cursor:pointer;font-family:var(--mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;display:inline-flex}.pulls-filter[data-v-60fc0976]:not(:last-child){border-right:1px solid var(--rule-light,#d8d1c4)}.pulls-filter.active[data-v-60fc0976]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.pulls-filter .count[data-v-60fc0976]{color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums}.pulls-filter.active .count[data-v-60fc0976]{color:var(--paper-tint,#f2efe7)}.pulls-filter kbd[data-v-60fc0976]{font-family:var(--mono,monospace);opacity:.6;border:1px solid;padding:0 4px;font-size:10px}.pulls-search[data-v-60fc0976]{border:1.5px solid var(--ink,#111);flex:240px;align-items:center;gap:8px;min-width:240px;max-width:420px;padding:4px 10px;display:inline-flex}.pulls-search input[data-v-60fc0976]{color:inherit;font:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0}.pulls-search kbd[data-v-60fc0976]{border:1px solid var(--ink,#111);font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);padding:0 4px;font-size:10px}.pulls-list[data-v-60fc0976]{border-top:1.5px solid var(--ink,#111);margin:0;padding:0;list-style:none;display:grid}.pulls-row[data-v-60fc0976]{border-bottom:1px solid var(--rule-light,#d8d1c4)}.pulls-row.focused[data-v-60fc0976]{background:var(--paper-tint,#f2efe7)}.pulls-row-link[data-v-60fc0976]{color:inherit;grid-template-columns:56px 1fr auto;align-items:baseline;gap:14px;padding:12px 12px 12px 6px;text-decoration:none;display:grid}.pulls-row-link[data-v-60fc0976]:hover{background:var(--paper-tint,#f2efe7);text-decoration:none}.pulls-row-number[data-v-60fc0976]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);text-align:right;font-variant-numeric:tabular-nums;font-size:12px}.pulls-row-body[data-v-60fc0976]{gap:4px;min-width:0;display:grid}.pulls-row-title[data-v-60fc0976]{font-family:var(--display,system-ui);text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:600;overflow:hidden}.pulls-row-meta[data-v-60fc0976]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);flex-wrap:wrap;align-items:baseline;gap:10px;font-size:12px;display:flex}.pulls-state[data-v-60fc0976]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 6px;font-size:11px}.pulls-state.pr-state-ready[data-v-60fc0976]{color:var(--accent-teal,#087f6f)}.pulls-state.pr-state-draft[data-v-60fc0976]{color:var(--ink-faint,#68645c)}.pulls-state.pr-state-merged[data-v-60fc0976]{color:var(--accent-blue,#1d55a6)}.pulls-state.pr-state-closed[data-v-60fc0976]{color:var(--accent-err,#c9341c)}.pulls-branch[data-v-60fc0976]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);font-size:12px}.pulls-branch span[data-v-60fc0976]{color:var(--ink-fainter,#918b80);padding:0 4px}.pulls-author[data-v-60fc0976]{color:inherit;font:inherit;font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:1px dashed #0000;align-items:center;gap:5px;padding:0 5px;font-size:12px;display:inline-flex}.pulls-author[data-v-60fc0976]:hover{background:var(--paper-tint,#f2efe7);border-color:currentColor}.pulls-author.active[data-v-60fc0976]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-color:var(--ink,#111);border-style:solid}.pulls-author.active .author-glyph[data-v-60fc0976],.pulls-author.active .author-label[data-v-60fc0976]{color:inherit}.pulls-query-chips[data-v-60fc0976]{font-family:var(--mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;font-size:11px;display:flex}.pulls-query-chips .query-chip[data-v-60fc0976]{letter-spacing:.02em;white-space:nowrap;border:1px solid;align-items:center;padding:1px 7px;display:inline-flex}.pulls-query-chips .query-chip.tone-is[data-v-60fc0976]{color:var(--accent-teal,#087f6f)}.pulls-query-chips .query-chip.tone-author[data-v-60fc0976]{color:var(--ink,#111)}.pulls-query-chips .query-chip.tone-unknown[data-v-60fc0976]{color:var(--accent-warn,#c89300);border-style:dashed}.pulls-query-chips .query-chips-hint[data-v-60fc0976]{color:var(--ink-faint,#68645c);letter-spacing:0;margin-left:4px}.pulls-query-chips .query-chips-hint code[data-v-60fc0976]{font-family:var(--mono,monospace);background:var(--paper-tint,#f2efe7);color:var(--ink-soft,#2c2b28);padding:0 4px;font-size:11px}.pulls-author-filter[data-v-60fc0976]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-items:center;gap:8px;margin-top:8px;padding:6px 10px;font-size:11px;display:inline-flex}.pulls-author-filter .prefix[data-v-60fc0976]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.pulls-author-filter .active-chip[data-v-60fc0976]{color:var(--ink,#111);border:1px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.pulls-author-filter .active-chip[data-author-kind=agent][data-v-60fc0976]{color:#6b3fa0}.pulls-author-filter .active-chip[data-author-kind=credential][data-v-60fc0976]{color:var(--accent-yellow,#c89300)}.pulls-author-filter .active-chip[data-author-kind=bot][data-v-60fc0976]{color:var(--accent-blue,#1d55a6)}.pulls-author-filter .active-chip[data-author-kind=team][data-v-60fc0976]{color:var(--accent-teal,#087f6f)}.pulls-author-filter .author-glyph[data-v-60fc0976]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.pulls-author-filter .clear[data-v-60fc0976]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.pulls-author-filter .clear[data-v-60fc0976]:hover{color:var(--ink,#111)}.pulls-author .author-glyph[data-v-60fc0976]{width:14px;height:14px;color:var(--ink-faint,#68645c);border:1px solid;place-items:center;font-size:10px;font-weight:700;display:inline-grid}.pulls-author[data-author-kind=agent] .author-glyph[data-v-60fc0976],.pulls-author[data-author-kind=agent] .author-label[data-v-60fc0976],.pulls-author[data-author-kind=agent] .author-badge[data-v-60fc0976]{color:#6b3fa0}.pulls-author[data-author-kind=credential] .author-glyph[data-v-60fc0976],.pulls-author[data-author-kind=credential] .author-label[data-v-60fc0976],.pulls-author[data-author-kind=credential] .author-badge[data-v-60fc0976]{color:var(--accent-yellow,#c89300)}.pulls-author[data-author-kind=bot] .author-glyph[data-v-60fc0976],.pulls-author[data-author-kind=bot] .author-label[data-v-60fc0976],.pulls-author[data-author-kind=bot] .author-badge[data-v-60fc0976]{color:var(--accent-blue,#1d55a6)}.pulls-author .author-badge[data-v-60fc0976]{letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.pulls-row-age[data-v-60fc0976]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);white-space:nowrap;font-size:12px}.pulls-empty[data-v-60fc0976],.pulls-error[data-v-60fc0976]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border-top:1.5px solid var(--rule-light,#d8d1c4);padding:18px 0;font-size:13px}.pulls-error[data-v-60fc0976]{color:var(--accent-err,#c9341c)}.pulls-queue-foot[data-v-60fc0976]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.pulls-queue-foot kbd[data-v-60fc0976]{font-family:var(--mono,monospace);border:1px solid;padding:0 4px;font-size:10px}"]], ["__scopeId", "data-v-60fc0976"]]), iu = {
	class: "pulls-your-work",
	"data-smoke": "pulls-your-work"
}, au = ["href"], ou = {
	key: 0,
	class: "muted"
}, su = {
	key: 1,
	class: "muted"
}, cu = {
	key: 2,
	class: "muted"
}, lu = { key: 3 }, uu = ["href"], du = { class: "num" }, fu = { class: "title" }, pu = { class: "meta" }, mu = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", hu = /* @__PURE__ */ ml(/* @__PURE__ */ Rn({
	__name: "PullsYourWork",
	props: {
		host: { type: Object },
		workspaceId: { type: String },
		viewerRef: { type: [String, null] }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ R([]), r = /* @__PURE__ */ R("idle"), i = Q(() => t.workspaceId ?? t.host?.workspaceId ?? mu), a = Q(() => t.viewerRef ?? t.host?.viewerRef ?? null), o = Q(() => a.value ? n.value.filter((e) => e.authorRef === a.value).filter((e) => e.state === "READY" || e.state === "DRAFT").slice(0, 5) : n.value.filter((e) => e.state === "READY" || e.state === "DRAFT").slice(0, 5));
		$n(() => void s()), An(() => [i.value], () => void s());
		async function s() {
			r.value = "loading";
			try {
				n.value = await Es({
					workspaceId: i.value,
					limit: 64
				}), r.value = n.value.length > 0 ? "ready" : "empty";
			} catch {
				r.value = "error", n.value = [];
			}
		}
		return (e, t) => (K(), q("section", iu, [J("header", null, [t[0] ||= J("h3", null, "Your pull requests", -1), J("a", { href: z(Fs)() }, "queue", 8, au)]), r.value === "loading" ? (K(), q("p", ou, "Loading…")) : r.value === "error" ? (K(), q("p", su, "Could not load pulls.")) : o.value.length === 0 ? (K(), q("p", cu, " Nothing here yet. Open a pull request to see it in this rail. ")) : (K(), q("ul", lu, [(K(!0), q(W, null, lr(o.value, (e) => (K(), q("li", { key: e.id }, [J("a", { href: z(Is)(e) }, [
			J("span", du, "#" + j(e.number), 1),
			J("span", fu, j(e.title), 1),
			J("span", { class: A(["state", z(Ls)(e.state).className]) }, j(z(Ls)(e.state).label), 3),
			J("span", pu, j(z(hs)(e.authorRef)) + " · " + j(z(Rs)(e.updatedAt ?? e.createdAt)), 1)
		], 8, uu)]))), 128))]))]));
	}
}), [["styles", [".pulls-your-work[data-v-cf9251fe]{gap:8px;display:grid}.pulls-your-work header[data-v-cf9251fe]{justify-content:space-between;align-items:baseline;display:flex}.pulls-your-work h3[data-v-cf9251fe]{font-family:var(--display,system-ui);margin:0;font-size:14px}.pulls-your-work header a[data-v-cf9251fe],.muted[data-v-cf9251fe]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:12px;text-decoration:none}.pulls-your-work ul[data-v-cf9251fe]{margin:0;padding:0;list-style:none;display:grid}.pulls-your-work li a[data-v-cf9251fe]{color:inherit;border-bottom:1px solid var(--rule-light,#d8d1c4);grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline;gap:8px;padding:8px 0;text-decoration:none;display:grid}.pulls-your-work li:last-child a[data-v-cf9251fe]{border-bottom:0}.num[data-v-cf9251fe]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.title[data-v-cf9251fe]{text-overflow:ellipsis;white-space:nowrap;grid-row:1;overflow:hidden}.state[data-v-cf9251fe]{font-family:var(--mono,monospace);letter-spacing:.04em;text-transform:uppercase;border:1px solid;padding:0 4px;font-size:10px}.state.pr-state-ready[data-v-cf9251fe]{color:var(--accent-teal,#087f6f)}.state.pr-state-draft[data-v-cf9251fe]{color:var(--ink-faint,#68645c)}.state.pr-state-merged[data-v-cf9251fe]{color:var(--accent-blue,#1d55a6)}.state.pr-state-closed[data-v-cf9251fe]{color:var(--accent-err,#c9341c)}.meta[data-v-cf9251fe]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);grid-column:1/-1;font-size:11px}"]], ["__scopeId", "data-v-cf9251fe"]]), gu = "ext_pull_requests", _u = "comtrya-pulls-queue", vu = "comtrya-pulls-detail", yu = "comtrya-pulls-your-work", bu = "comtrya-pulls-overview";
gs({
	tagName: _u,
	component: ru
}), gs({
	tagName: vu,
	component: hl
}), gs({
	tagName: yu,
	component: hu
}), gs({
	tagName: bu,
	component: Dl
});
var xu = {
	id: gu,
	setup(e) {
		e.registerWidget({
			id: "pulls-your-work",
			element: yu,
			defaultSlot: "home.your-work",
			defaultPriority: 100,
			requiredPermission: "pull-requests.read"
		}), e.registerWidget({
			id: "pulls-overview",
			element: bu,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "pull-requests.read"
		}), e.registerRoute("/", {
			element: _u,
			requiredPermission: "pull-requests.read"
		}), e.registerRoute("/:pullId", {
			element: vu,
			requiredPermission: "pull-requests.read"
		}), Ws();
	}
};
//#endregion
export { xu as default };
