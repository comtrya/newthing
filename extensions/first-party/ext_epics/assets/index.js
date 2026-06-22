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
}, ne = /-\w/g, T = te((e) => e.replace(ne, (e) => e.slice(1).toUpperCase())), re = /\B([A-Z])/g, E = te((e) => e.replace(re, "-$1").toLowerCase()), D = te((e) => e.charAt(0).toUpperCase() + e.slice(1)), ie = te((e) => e ? `on${D(e)}` : ""), O = (e, t) => !Object.is(e, t), ae = (e, ...t) => {
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
}, A, j = () => A ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function ce(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = g(r) ? fe(r) : ce(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (g(e) || v(e)) return e;
}
var le = /;(?![^(]*\))/g, ue = /:([^]+)/, de = /\/\*[^]*?\*\//g;
function fe(e) {
	let t = {};
	return e.replace(de, "").split(le).forEach((e) => {
		if (e) {
			let n = e.split(ue);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function M(e) {
	let t = "";
	if (g(e)) t = e;
	else if (d(e)) for (let n = 0; n < e.length; n++) {
		let r = M(e[n]);
		r && (t += r + " ");
	}
	else if (v(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var pe = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", me = /* @__PURE__ */ e(pe);
pe + "";
function he(e) {
	return !!e || e === "";
}
function ge(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = _e(e[r], t[r]);
	return n;
}
function _e(e, t) {
	if (e === t) return !0;
	let n = m(e), r = m(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = _(e), r = _(t), n || r) return e === t;
	if (n = d(e), r = d(t), n || r) return n && r ? ge(e, t) : !1;
	if (n = v(e), r = v(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !_e(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
function ve(e, t) {
	return e.findIndex((e) => _e(e, t));
}
var ye = (e) => !!(e && e.__v_isRef === !0), N = (e) => g(e) ? e : e == null ? "" : d(e) || v(e) && (e.toString === b || !h(e.toString)) ? ye(e) ? N(e.value) : JSON.stringify(e, be, 2) : String(e), be = (e, t) => ye(t) ? be(e, t.value) : f(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[xe(t, r) + " =>"] = n, e), {}) } : p(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => xe(e)) } : _(t) ? xe(t) : v(t) && !d(t) && !C(t) ? String(t) : t, xe = (e, t = "") => _(e) ? `Symbol(${e.description ?? t})` : e, P, Se = class {
	constructor(e = !1) {
		this.detached = e, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !e && P && (P.active ? (this.parent = P, this.index = (P.scopes ||= []).push(this) - 1) : (this._active = !1, this._warnOnRun = !1));
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
			let t = P;
			try {
				return P = this, e();
			} finally {
				P = t;
			}
		}
	}
	on() {
		++this._on === 1 && (this.prevScope = P, P = this);
	}
	off() {
		if (this._on > 0 && --this._on === 0) {
			if (P === this) P = this.prevScope;
			else {
				let e = P;
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
function Ce() {
	return P;
}
var F, we = /* @__PURE__ */ new WeakSet(), Te = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, P && (P.active ? P.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, we.has(this) && (we.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || ke(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, He(this), Me(this);
		let e = F, t = Re;
		F = this, Re = !0;
		try {
			return this.fn();
		} finally {
			Ne(this), F = e, Re = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) Ie(e);
			this.deps = this.depsTail = void 0, He(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? we.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		Pe(this) && this.run();
	}
	get dirty() {
		return Pe(this);
	}
}, Ee = 0, De, Oe;
function ke(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = Oe, Oe = e;
		return;
	}
	e.next = De, De = e;
}
function Ae() {
	Ee++;
}
function je() {
	if (--Ee > 0) return;
	if (Oe) {
		let e = Oe;
		for (Oe = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; De;) {
		let t = De;
		for (De = void 0; t;) {
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
function Me(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Ne(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), Ie(r), Le(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function Pe(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (Fe(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function Fe(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Ue) || (e.globalVersion = Ue, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Pe(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = F, r = Re;
	F = e, Re = !0;
	try {
		Me(e);
		let n = e.fn(e._value);
		(t.version === 0 || O(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		F = n, Re = r, Ne(e), e.flags &= -3;
	}
}
function Ie(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) Ie(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function Le(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var Re = !0, ze = [];
function Be() {
	ze.push(Re), Re = !1;
}
function Ve() {
	let e = ze.pop();
	Re = e === void 0 ? !0 : e;
}
function He(e) {
	let { cleanup: t } = e;
	if (e.cleanup = void 0, t) {
		let e = F;
		F = void 0;
		try {
			t();
		} finally {
			F = e;
		}
	}
}
var Ue = 0, We = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, Ge = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!F || !Re || F === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== F) t = this.activeLink = new We(F, this), F.deps ? (t.prevDep = F.depsTail, F.depsTail.nextDep = t, F.depsTail = t) : F.deps = F.depsTail = t, Ke(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = F.depsTail, t.nextDep = void 0, F.depsTail.nextDep = t, F.depsTail = t, F.deps === t && (F.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, Ue++, this.notify(e);
	}
	notify(e) {
		Ae();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			je();
		}
	}
};
function Ke(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) Ke(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var qe = /* @__PURE__ */ new WeakMap(), Je = /* @__PURE__ */ Symbol(""), Ye = /* @__PURE__ */ Symbol(""), Xe = /* @__PURE__ */ Symbol("");
function I(e, t, n) {
	if (Re && F) {
		let t = qe.get(e);
		t || qe.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new Ge()), r.map = t, r.key = n), r.track();
	}
}
function Ze(e, t, n, r, i, a) {
	let o = qe.get(e);
	if (!o) {
		Ue++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (Ae(), t === "clear") o.forEach(s);
	else {
		let i = d(e), a = i && w(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === Xe || !_(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(Xe)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(Je)), f(e) && s(o.get(Ye)));
				break;
			case "delete":
				i || (s(o.get(Je)), f(e) && s(o.get(Ye)));
				break;
			case "set":
				f(e) && s(o.get(Je));
				break;
		}
	}
	je();
}
function Qe(e) {
	let t = /* @__PURE__ */ L(e);
	return t === e ? t : (I(t, "iterate", Xe), /* @__PURE__ */ Rt(e) ? t : t.map(Vt));
}
function $e(e) {
	return I(e = /* @__PURE__ */ L(e), "iterate", Xe), e;
}
function et(e, t) {
	return /* @__PURE__ */ Lt(e) ? Ht(/* @__PURE__ */ It(e) ? Vt(t) : t) : Vt(t);
}
var tt = {
	__proto__: null,
	[Symbol.iterator]() {
		return nt(this, Symbol.iterator, (e) => et(this, e));
	},
	concat(...e) {
		return Qe(this).concat(...e.map((e) => d(e) ? Qe(e) : e));
	},
	entries() {
		return nt(this, "entries", (e) => (e[1] = et(this, e[1]), e));
	},
	every(e, t) {
		return it(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return it(this, "filter", e, t, (e) => e.map((e) => et(this, e)), arguments);
	},
	find(e, t) {
		return it(this, "find", e, t, (e) => et(this, e), arguments);
	},
	findIndex(e, t) {
		return it(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return it(this, "findLast", e, t, (e) => et(this, e), arguments);
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
		return Qe(this).join(e);
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
		return Qe(this).toReversed();
	},
	toSorted(e) {
		return Qe(this).toSorted(e);
	},
	toSpliced(...e) {
		return Qe(this).toSpliced(...e);
	},
	unshift(...e) {
		return st(this, "unshift", e);
	},
	values() {
		return nt(this, "values", (e) => et(this, e));
	}
};
function nt(e, t, n) {
	let r = $e(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ Rt(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var rt = Array.prototype;
function it(e, t, n, r, i, a) {
	let o = $e(e), s = o !== e && !/* @__PURE__ */ Rt(e), c = o[t];
	if (c !== rt[t]) {
		let t = c.apply(e, a);
		return s ? Vt(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, et(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function at(e, t, n, r) {
	let i = $e(e), a = i !== e && !/* @__PURE__ */ Rt(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = et(e, t)), n.call(this, t, et(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? et(e, c) : c;
}
function ot(e, t, n) {
	let r = /* @__PURE__ */ L(e);
	I(r, "iterate", Xe);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ zt(n[0]) ? (n[0] = /* @__PURE__ */ L(n[0]), r[t](...n)) : i;
}
function st(e, t, n = []) {
	Be(), Ae();
	let r = (/* @__PURE__ */ L(e))[t].apply(e, n);
	return je(), Ve(), r;
}
var ct = /* @__PURE__ */ e("__proto__,__v_isRef,__isVue"), lt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(_));
function ut(e) {
	_(e) || (e = String(e));
	let t = /* @__PURE__ */ L(this);
	return I(t, "has", e), t.hasOwnProperty(e);
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
		let o = Reflect.get(e, t, /* @__PURE__ */ R(e) ? e : n);
		if ((_(t) ? lt.has(t) : ct(t)) || (r || I(e, "get", t), i)) return o;
		if (/* @__PURE__ */ R(o)) {
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
			if (!/* @__PURE__ */ Rt(n) && !/* @__PURE__ */ Lt(n) && (i = /* @__PURE__ */ L(i), n = /* @__PURE__ */ L(n)), !a && /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : u(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ R(e) ? e : r);
		return e === /* @__PURE__ */ L(r) && (o ? O(n, i) && Ze(e, "set", t, n, i) : Ze(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = u(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && Ze(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!_(t) || !lt.has(t)) && I(e, "has", t), n;
	}
	ownKeys(e) {
		return I(e, "iterate", d(e) ? "length" : Je), Reflect.ownKeys(e);
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
		let i = this.__v_raw, a = /* @__PURE__ */ L(i), o = f(a), c = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, u = i[e](...r), d = n ? _t : t ? Ht : Vt;
		return !t && I(a, "iterate", l ? Ye : Je), s(Object.create(u), { next() {
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
			e || (O(n, a) && I(i, "get", n), I(i, "get", a));
			let { has: o } = vt(i), s = t ? _t : e ? Ht : Vt;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && I(/* @__PURE__ */ L(t), "iterate", Je), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ L(n), i = /* @__PURE__ */ L(t);
			return e || (O(t, i) && I(r, "has", t), I(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ L(a), s = t ? _t : e ? Ht : Vt;
			return !e && I(o, "iterate", Je), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return s(n, e ? {
		add: bt("add"),
		set: bt("set"),
		delete: bt("delete"),
		clear: bt("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ L(this), r = vt(n), i = /* @__PURE__ */ L(e), a = !t && !/* @__PURE__ */ Rt(e) && !/* @__PURE__ */ Lt(e) ? i : e;
			return r.has.call(n, a) || O(e, a) && r.has.call(n, e) || O(i, a) && r.has.call(n, i) || (n.add(a), Ze(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ Rt(n) && !/* @__PURE__ */ Lt(n) && (n = /* @__PURE__ */ L(n));
			let r = /* @__PURE__ */ L(this), { has: i, get: a } = vt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ L(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? O(n, s) && Ze(r, "set", e, n, s) : Ze(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ L(this), { has: n, get: r } = vt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ L(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && Ze(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ L(this), t = e.size !== 0, n = e.clear();
			return t && Ze(e, "clear", void 0, void 0, void 0), n;
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
function Rt(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function zt(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function L(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ L(t) : e;
}
function Bt(e) {
	return !u(e, "__v_skip") && Object.isExtensible(e) && k(e, "__v_skip", !0), e;
}
var Vt = (e) => v(e) ? /* @__PURE__ */ Mt(e) : e, Ht = (e) => v(e) ? /* @__PURE__ */ Pt(e) : e;
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
		this.dep = new Ge(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ L(e), this._value = t ? e : Vt(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ Rt(e) || /* @__PURE__ */ Lt(e);
		e = n ? e : /* @__PURE__ */ L(e), O(e, t) && (this._rawValue = e, this._value = n ? e : Vt(e), this.dep.trigger());
	}
};
function B(e) {
	return /* @__PURE__ */ R(e) ? e.value : e;
}
var Gt = {
	get: (e, t, n) => t === "__v_raw" ? e : B(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Kt(e) {
	return /* @__PURE__ */ It(e) ? e : new Proxy(e, Gt);
}
var qt = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new Ge(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Ue - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && F !== this) return ke(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return Fe(this), e && (e.version = this.dep.version), this._value;
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
	let { immediate: a, deep: o, once: s, scheduler: l, augmentJob: u, call: f } = i, p = (e) => o ? e : /* @__PURE__ */ Rt(e) || o === !1 || o === 0 ? en(e, 1) : en(e), m, g, _, v, y = !1, b = !1;
	if (/* @__PURE__ */ R(e) ? (g = () => e.value, y = /* @__PURE__ */ Rt(e)) : /* @__PURE__ */ It(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some((e) => /* @__PURE__ */ It(e) || /* @__PURE__ */ Rt(e)), g = () => e.map((e) => {
		if (/* @__PURE__ */ R(e)) return e.value;
		if (/* @__PURE__ */ It(e)) return p(e);
		if (h(e)) return f ? f(e, 2) : e();
	})) : g = h(e) ? n ? f ? () => f(e, 2) : e : () => {
		if (_) {
			Be();
			try {
				_();
			} finally {
				Ve();
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
	let x = Ce(), S = () => {
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
	return u && u(w), m = new Te(g), m.scheduler = l ? () => l(w, !1) : w, v = (e) => Qt(e, !1, m), _ = m.onStop = () => {
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
	if (n.set(e, t), t--, /* @__PURE__ */ R(e)) en(e.value, t, n);
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
			Be(), tn(o, null, 10, [
				e,
				i,
				a
			]), Ve();
			return;
		}
	}
	an(e, r, a, i, s);
}
function an(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var on = [], sn = -1, cn = [], ln = null, un = 0, dn = /* @__PURE__ */ Promise.resolve(), fn = null;
function pn(e) {
	let t = fn || dn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function mn(e) {
	let t = sn + 1, n = on.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = on[r], a = bn(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function hn(e) {
	if (!(e.flags & 1)) {
		let t = bn(e), n = on[on.length - 1];
		!n || !(e.flags & 2) && t >= bn(n) ? on.push(e) : on.splice(mn(t), 0, e), e.flags |= 1, gn();
	}
}
function gn() {
	fn ||= dn.then(xn);
}
function _n(e) {
	d(e) ? cn.push(...e) : ln && e.id === -1 ? ln.splice(un + 1, 0, e) : e.flags & 1 || (cn.push(e), e.flags |= 1), gn();
}
function vn(e, t, n = sn + 1) {
	for (; n < on.length; n++) {
		let t = on[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			on.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
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
		for (sn = 0; sn < on.length; sn++) {
			let e = on[sn];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), tn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; sn < on.length; sn++) {
			let e = on[sn];
			e && (e.flags &= -2);
		}
		sn = -1, on.length = 0, yn(e), fn = null, (on.length || cn.length) && xn(e);
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
		r._d && Ai(-1);
		let i = wn(t), a;
		try {
			a = e(...n);
		} finally {
			wn(i), r._d && Ai(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function En(e, n) {
	if (Sn === null) return e;
	let r = da(Sn), i = e.dirs ||= [];
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
function Dn(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (Be(), nn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), Ve());
	}
}
function On(e, t) {
	if (Yi) {
		let n = Yi.provides, r = Yi.parent && Yi.parent.provides;
		r === n && (n = Yi.provides = Object.create(r)), n[e] = t;
	}
}
function kn(e, t, n = !1) {
	let r = Xi();
	if (r || Nr) {
		let i = Nr ? Nr._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
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
	if (na) {
		if (c === "sync") {
			let e = jn();
			f = e.__watcherHandles ||= [];
		} else if (!d) {
			let e = () => {};
			return e.stop = r, e.resume = r, e.pause = r, e;
		}
	}
	let p = Yi;
	u.call = (e, t, n) => nn(e, p, t, n);
	let m = !1;
	c === "post" ? u.scheduler = (e) => {
		ui(e, p && p.suspense);
	} : c !== "sync" && (m = !0, u.scheduler = (e, t) => {
		t ? e() : hn(e);
	}), u.augmentJob = (e) => {
		n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p));
	};
	let h = $t(e, n, u);
	return na && (f ? f.push(h) : d && h()), h;
}
function Nn(e, t, n) {
	let r = this.proxy, i = g(e) ? e.includes(".") ? Pn(r, e) : () => r[e] : e.bind(r, r), a;
	h(t) ? a = t : (a = t.handler, n = t);
	let o = $i(this), s = Mn(i, a.bind(r), n);
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
	let s = a.shapeFlag & 4 ? da(a.component) : a.el, l = o ? null : s, { i: f, r: p } = e, m = n && n.r, _ = f.refs === t ? f.refs = {} : f.refs, v = f.setupState, y = /* @__PURE__ */ L(v), b = v === t ? i : (e) => Vn(_, e) ? !1 : u(y, e), x = (e, t) => !(t && Vn(_, t));
	if (m != null && m !== p) {
		if (Wn(n), g(m)) _[m] = null, b(m) && (v[m] = null);
		else if (/* @__PURE__ */ R(m)) {
			let e = n;
			x(m, e.k) && (m.value = null), e.k && (_[e.k] = null);
		}
	}
	if (h(p)) tn(p, f, 12, [l, _]);
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
					i(), Hn.delete(e);
				};
				t.id = -1, Hn.set(e, t), ui(t, r);
			} else Wn(e), i();
		}
	}
}
function Wn(e) {
	let t = Hn.get(e);
	t && (t.flags |= 8, Hn.delete(e));
}
j().requestIdleCallback, j().cancelIdleCallback;
var Gn = (e) => !!e.type.__asyncLoader, Kn = (e) => e.type.__isKeepAlive;
function qn(e, t) {
	Yn(e, "a", t);
}
function Jn(e, t) {
	Yn(e, "da", t);
}
function Yn(e, t, n = Yi) {
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
function Zn(e, t, n = Yi, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			Be();
			let i = $i(n), a = nn(t, n, e, r);
			return i(), Ve(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Qn = (e) => (t, n = Yi) => {
	(!na || e === "sp") && Zn(e, (...e) => t(...e), n);
}, $n = Qn("bm"), er = Qn("m"), tr = Qn("bu"), nr = Qn("u"), rr = Qn("bum"), ir = Qn("um"), ar = Qn("sp"), or = Qn("rtg"), sr = Qn("rtc");
function cr(e, t = Yi) {
	Zn("ec", e, t);
}
var lr = /* @__PURE__ */ Symbol.for("v-ndc");
function H(e, t, n, r) {
	let i, a = n && n[r], o = d(e);
	if (o || g(e)) {
		let n = o && /* @__PURE__ */ It(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ Rt(e), s = /* @__PURE__ */ Lt(e), e = $e(e)), i = Array(e.length);
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
var ur = (e) => e ? ta(e) ? da(e) : ur(e.parent) : null, dr = /* @__PURE__ */ s(/* @__PURE__ */ Object.create(null), {
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
		if (d) return n === "$attrs" && I(e.attrs, "get", ""), d(e);
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
	let { data: a, computed: o, methods: s, watch: c, provide: l, inject: u, created: f, beforeMount: p, mounted: m, beforeUpdate: g, updated: _, activated: y, deactivated: b, beforeDestroy: x, beforeUnmount: S, destroyed: C, unmounted: w, render: ee, renderTracked: te, renderTriggered: ne, errorCaptured: T, serverPrefetch: re, expose: E, inheritAttrs: D, components: ie, directives: O, filters: ae } = t;
	if (u && _r(u, i, null), s) for (let e in s) {
		let t = s[e];
		h(t) && (i[e] = t.bind(n));
	}
	if (a) {
		let t = a.call(n, n);
		v(t) && (e.data = /* @__PURE__ */ Mt(t));
	}
	if (hr = !0, o) for (let e in o) {
		let t = o[e], a = Y({
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
	function k(e, t) {
		d(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (k($n, p), k(er, m), k(tr, g), k(nr, _), k(qn, y), k(Jn, b), k(cr, T), k(sr, te), k(or, ne), k(rr, S), k(ir, w), k(ar, re), d(E)) if (E.length) {
		let t = e.exposed ||= {};
		E.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	ee && e.render === r && (e.render = ee), D != null && (e.inheritAttrs = D), ie && (e.components = ie), O && (e.directives = O), re && Bn(e);
}
function _r(e, t, n = r) {
	d(e) && (e = Tr(e));
	for (let n in e) {
		let r = e[n], i;
		i = v(r) ? "default" in r ? kn(r.from || n, r.default, !0) : kn(r.from || n) : kn(r), /* @__PURE__ */ R(i) ? Object.defineProperty(t, n, {
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
	props: Or,
	emits: Or,
	methods: Dr,
	computed: Dr,
	beforeCreate: Er,
	created: Er,
	beforeMount: Er,
	mounted: Er,
	beforeUpdate: Er,
	updated: Er,
	beforeDestroy: Er,
	beforeUnmount: Er,
	destroyed: Er,
	unmounted: Er,
	activated: Er,
	deactivated: Er,
	errorCaptured: Er,
	serverPrefetch: Er,
	components: Dr,
	directives: Dr,
	watch: kr,
	provide: Cr,
	inject: wr
};
function Cr(e, t) {
	return t ? e ? function() {
		return s(h(e) ? e.call(this, this) : e, h(t) ? t.call(this, this) : t);
	} : t : e;
}
function wr(e, t) {
	return Dr(Tr(e), Tr(t));
}
function Tr(e) {
	if (d(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function Er(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function Dr(e, t) {
	return e ? s(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Or(e, t) {
	return e ? d(e) && d(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : s(/* @__PURE__ */ Object.create(null), mr(e), mr(t ?? {})) : t;
}
function kr(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = s(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = Er(e[r], t[r]);
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
			version: pa,
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
					let u = l._ceVNode || Li(n, r);
					return u.appContext = i, s === !0 ? s = "svg" : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, da(u.component);
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
var Nr = null, Pr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${T(t)}Modifiers`] || e[`${E(t)}Modifiers`];
function Fr(e, n, ...r) {
	if (e.isUnmounted) return;
	let i = e.vnode.props || t, a = r, o = n.startsWith("update:"), s = o && Pr(i, n.slice(7));
	s && (s.trim && (a = r.map((e) => g(e) ? e.trim() : e)), s.number && (a = r.map(oe)));
	let c, l = i[c = ie(n)] || i[c = ie(T(n))];
	!l && o && (l = i[c = ie(E(n))]), l && nn(l, e, 6, a);
	let u = i[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, nn(u, e, 6, a);
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
	return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, E(t)) || u(e, t));
}
function zr(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: s, attrs: c, emit: l, render: u, renderCache: d, props: f, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = wn(e), v, y;
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
			}) : e(f, null)), y = t.props ? c : Br(c);
		}
	} catch (t) {
		Ei.length = 0, rn(t, e, 1), v = Li(wi);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(o) && (y = Vr(y, a)), b = Bi(b, y, !1, !0));
	}
	return n.dirs && (b = Bi(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && Rn(b, n.transition), v = b, wn(_), v;
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
	return n === "style" && v(r) && v(i) ? !_e(r, i) : r !== i;
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
	n ? e.props = r ? i : /* @__PURE__ */ Nt(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Xr(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ L(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (Rr(e.emitsOptions, o)) continue;
				let d = t[o];
				if (c) if (u(a, o)) d !== a[o] && (a[o] = d, l = !0);
				else {
					let t = T(o);
					i[t] = Qr(c, s, t, d, e, !1);
				}
				else d !== a[o] && (a[o] = d, l = !0);
			}
		}
	} else {
		Zr(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !u(t, a) && ((r = E(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Qr(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !u(t, e)) && (delete a[e], l = !0);
	}
	l && Ze(e.attrs, "set", "");
}
function Zr(e, n, r, i) {
	let [a, o] = e.propsOptions, s = !1, c;
	if (n) for (let t in n) {
		if (ee(t)) continue;
		let l = n[t], d;
		a && u(a, d = T(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : Rr(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0);
	}
	if (o) {
		let n = /* @__PURE__ */ L(r), i = c || t;
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
					let o = $i(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === E(n)) && (r = !0));
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
		let n = T(c[e]);
		ti(n) && (l[n] = t);
	}
	else if (c) for (let e in c) {
		let t = T(e);
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
	return e[0] !== "$" && !ee(e);
}
var ni = (e) => e === "_" || e === "_ctx" || e === "$stable", ri = (e) => d(e) ? e.map(Vi) : [Vi(e)], ii = (e, t, n) => {
	if (t._n) return t;
	let r = Tn((...e) => ri(t(...e)), n);
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
}, ui = Si;
function di(e) {
	return fi(e);
}
function fi(e, i) {
	let a = j();
	a.__VUE__ = !0;
	let { insert: o, remove: s, patchProp: c, createElement: l, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = r, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Pi(e, t) && (r = ge(e), fe(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
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
			case U:
				ie(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? O(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, ye);
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
		if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && T(e.children, d, null, r, i, pi(e, a), s, u), _ && Dn(e, null, r, "created"), ne(d, e, e.scopeId, s, r), m) {
			for (let e in m) e !== "value" && !ee(e) && c(d, e, null, m[e], a, r);
			"value" in m && c(d, "value", null, m.value, a), (f = m.onVnodeBeforeMount) && Gi(f, r, e);
		}
		_ && Dn(e, null, r, "beforeMount");
		let v = hi(i, g);
		v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && ui(() => {
			try {
				f && Gi(f, r, e), v && g.enter(d), _ && Dn(e, null, r, "mounted");
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
		if (r && mi(r, !1), (g = h.onVnodeBeforeUpdate) && Gi(g, r, n, e), f && Dn(n, e, r, "beforeUpdate"), r && mi(r, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? E(e.dynamicChildren, d, l, r, i, pi(n, a), o) : s || ce(e, n, l, null, r, i, pi(n, a), o, !1), u > 0) {
			if (u & 16) D(l, m, h, r, a);
			else if (u & 2 && m.class !== h.class && c(l, "class", null, h.class, a), u & 4 && c(l, "style", m.style, h.style, a), u & 8) {
				let e = n.dynamicProps;
				for (let t = 0; t < e.length; t++) {
					let n = e[t], i = m[n], o = h[n];
					(o !== i || n === "value") && c(l, n, i, o, a, r);
				}
			}
			u & 1 && e.children !== n.children && p(l, n.children);
		} else !s && d == null && D(l, m, h, r, a);
		((g = h.onVnodeUpdated) || f) && ui(() => {
			g && Gi(g, r, n, e), f && Dn(n, e, r, "updated");
		}, i);
	}, E = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === U || !Pi(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
		}
	}, D = (e, n, r, i, a) => {
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
		h && (c = c ? c.concat(h) : h), e == null ? (o(d, n, r), o(f, n, r), T(t.children || [], n, f, i, a, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (E(e.dynamicChildren, m, n, i, a, s, c), (t.key != null || i && t === i.subTree) && gi(e, t, !0)) : ce(e, t, n, f, i, a, s, c, l);
	}, O = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : k(t, n, r, i, a, o, c) : oe(e, t, c);
	}, k = (e, t, n, r, i, a, o) => {
		let s = e.component = Ji(e, r, i);
		if (Kn(e) && (s.ctx.renderer = ye), ra(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, se, o), !e.el) {
				let r = s.subTree = Li(wi);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else se(s, e, t, n, i, a, o);
	}, oe = (e, t, n) => {
		let r = t.component = e.component;
		if (Hr(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			A(r, t, n);
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
						t && (t.el = c.el, A(e, t, o)), n.asyncDep.then(() => {
							ui(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, d;
				mi(e, !1), t ? (t.el = c.el, A(e, t, o)) : t = c, n && ae(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Gi(d, s, t, c), mi(e, !0);
				let f = zr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ge(p), e, i, a), t.el = f.el, u === null && Gr(e, f.el), r && ui(r, i), (d = t.props && t.props.onVnodeUpdated) && ui(() => Gi(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Gn(t);
				if (mi(e, !1), l && ae(l), !m && (o = c && c.onVnodeBeforeMount) && Gi(o, d, t), mi(e, !0), s && be) {
					let t = () => {
						e.subTree = zr(e), be(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = zr(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && ui(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					ui(() => Gi(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Gn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && ui(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new Te(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => hn(u), mi(e, !0), l();
	}, A = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Xr(e, t.props, r, n), li(e, t.children, n), Be(), vn(e), Ve();
	}, ce = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, u = e ? e.shapeFlag : 0, d = t.children, { patchFlag: f, shapeFlag: m } = t;
		if (f > 0) {
			if (f & 128) {
				ue(l, d, n, r, i, a, o, s, c);
				return;
			} else if (f & 256) {
				le(l, d, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (u & 16 && he(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? ue(l, d, n, r, i, a, o, s, c) : he(l, i, a, !0) : (u & 8 && p(n, ""), m & 16 && T(d, n, r, i, a, o, s, c));
	}, le = (e, t, r, i, a, o, s, c, l) => {
		e ||= n, t ||= n;
		let u = e.length, d = t.length, f = Math.min(u, d), p;
		for (p = 0; p < f; p++) {
			let n = t[p] = l ? Hi(t[p]) : Vi(t[p]);
			v(e[p], n, r, null, a, o, s, c, l);
		}
		u > d ? he(e, a, o, !0, !1, f) : T(t, r, i, a, o, s, c, l, f);
	}, ue = (e, t, r, i, a, o, s, c, l) => {
		let u = 0, d = t.length, f = e.length - 1, p = d - 1;
		for (; u <= f && u <= p;) {
			let n = e[u], i = t[u] = l ? Hi(t[u]) : Vi(t[u]);
			if (Pi(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			u++;
		}
		for (; u <= f && u <= p;) {
			let n = e[f], i = t[p] = l ? Hi(t[p]) : Vi(t[p]);
			if (Pi(n, i)) v(n, i, r, null, a, o, s, c, l);
			else break;
			f--, p--;
		}
		if (u > f) {
			if (u <= p) {
				let e = p + 1, n = e < d ? t[e].el : i;
				for (; u <= p;) v(null, t[u] = l ? Hi(t[u]) : Vi(t[u]), r, n, a, o, s, c, l), u++;
			}
		} else if (u > p) for (; u <= f;) fe(e[u], a, o, !0), u++;
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
					fe(n, a, o, !0);
					continue;
				}
				let i;
				if (n.key != null) i = g.get(n.key);
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && Pi(n, t[_])) {
					i = _;
					break;
				}
				i === void 0 ? fe(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++);
			}
			let w = x ? _i(C) : n;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, n = t[e], f = t[e + 1], p = e + 1 < d ? f.el || bi(f) : i;
				C[u] === 0 ? v(null, n, r, p, a, o, s, c, l) : x && (_ < 0 || u !== w[_] ? de(n, r, p, 2) : _--);
			}
		}
	}, de = (e, t, n, r, i = null) => {
		let { el: a, type: c, transition: l, children: u, shapeFlag: d } = e;
		if (d & 6) {
			de(e.component.subTree, t, n, r);
			return;
		}
		if (d & 128) {
			e.suspense.move(t, n, r);
			return;
		}
		if (d & 64) {
			c.move(e, t, n, ye);
			return;
		}
		if (c === U) {
			o(a, t, n);
			for (let e = 0; e < u.length; e++) de(u[e], t, n, r);
			o(e.anchor, t, n);
			return;
		}
		if (c === Ti) {
			S(e, t, n);
			return;
		}
		if (r !== 2 && d & 1 && l) if (r === 0) l.beforeEnter(a), o(a, t, n), ui(() => l.enter(a), i);
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
	}, fe = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (Be(), Un(s, null, n, e, !0), Ve()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Gn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Gi(_, t, e), u & 6) me(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && Dn(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, ye, r) : l && !l.hasOnce && (a !== U || d > 0 && d & 64) ? he(l, t, n, !1, !0) : (a === U && d & 384 || !i && u & 16) && he(c, t, n), r && M(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && ui(() => {
			_ && Gi(_, t, e), h && Dn(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, M = (e) => {
		let { type: t, el: n, anchor: r, transition: i } = e;
		if (t === U) {
			pe(n, r);
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
	}, pe = (e, t) => {
		let n;
		for (; e !== t;) n = h(e), s(e), e = n;
		s(t);
	}, me = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		yi(c), yi(l), r && ae(r), i.stop(), a && (a.flags |= 8, fe(o, e, t, n)), s && ui(s, t), ui(() => {
			e.isUnmounted = !0;
		}, t);
	}, he = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) fe(e[o], t, n, r, i);
	}, ge = (e) => {
		if (e.shapeFlag & 6) return ge(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[Fn];
		return n ? h(n) : t;
	}, _e = !1, ve = (e, t, n) => {
		let r;
		e == null ? t._vnode && (fe(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, _e ||= (_e = !0, vn(r), yn(), !1);
	}, ye = {
		p: v,
		um: fe,
		m: de,
		r: M,
		mt: k,
		mc: T,
		pc: ce,
		pbc: E,
		n: ge,
		o: e
	}, N, be;
	return i && ([N, be] = i(ye)), {
		render: ve,
		hydrate: N,
		createApp: Mr(ve, N)
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
	t && t.pendingBranch ? d(e) ? t.effects.push(...e) : t.effects.push(e) : _n(e);
}
var U = /* @__PURE__ */ Symbol.for("v-fgt"), Ci = /* @__PURE__ */ Symbol.for("v-txt"), wi = /* @__PURE__ */ Symbol.for("v-cmt"), Ti = /* @__PURE__ */ Symbol.for("v-stc"), Ei = [], Di = null;
function W(e = !1) {
	Ei.push(Di = e ? null : []);
}
function Oi() {
	Ei.pop(), Di = Ei[Ei.length - 1] || null;
}
var ki = 1;
function Ai(e, t = !1) {
	ki += e, e < 0 && Di && t && (Di.hasOnce = !0);
}
function ji(e) {
	return e.dynamicChildren = ki > 0 ? Di || n : null, Oi(), ki > 0 && Di && Di.push(e), e;
}
function G(e, t, n, r, i, a) {
	return ji(K(e, t, n, r, i, a, !0));
}
function Mi(e, t, n, r, i) {
	return ji(Li(e, t, n, r, i, !0));
}
function Ni(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function Pi(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Fi = ({ key: e }) => e ?? null, Ii = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : g(e) || /* @__PURE__ */ R(e) || h(e) ? {
	i: Sn,
	r: e,
	k: t,
	f: !!n
} : e);
function K(e, t = null, n = null, r = 0, i = null, a = e === U ? 0 : 1, o = !1, s = !1) {
	let c = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e,
		props: t,
		key: t && Fi(t),
		ref: t && Ii(t),
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
	return s ? (Ui(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), ki > 0 && !o && Di && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && Di.push(c), c;
}
var Li = Ri;
function Ri(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === lr) && (e = wi), Ni(e)) {
		let r = Bi(e, t, !0);
		return n && Ui(r, n), ki > 0 && !a && Di && (r.shapeFlag & 6 ? Di[Di.indexOf(e)] = r : Di.push(r)), r.patchFlag = -2, r;
	}
	if (fa(e) && (e = e.__vccOpts), t) {
		t = zi(t);
		let { class: e, style: n } = t;
		e && !g(e) && (t.class = M(e)), v(n) && (/* @__PURE__ */ zt(n) && !d(n) && (n = s({}, n)), t.style = ce(n));
	}
	let o = g(e) ? 1 : xi(e) ? 128 : In(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
	return K(e, t, n, r, i, o, a, !0);
}
function zi(e) {
	return e ? /* @__PURE__ */ zt(e) || Jr(e) ? s({}, e) : e : null;
}
function Bi(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? Wi(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && Fi(l),
		ref: t && t.ref ? n && a ? d(a) ? a.concat(Ii(t)) : [a, Ii(t)] : Ii(t) : a,
		scopeId: e.scopeId,
		slotScopeIds: e.slotScopeIds,
		children: s,
		target: e.target,
		targetStart: e.targetStart,
		targetAnchor: e.targetAnchor,
		staticCount: e.staticCount,
		shapeFlag: e.shapeFlag,
		patchFlag: t && e.type !== U ? o === -1 ? 16 : o | 16 : o,
		dynamicProps: e.dynamicProps,
		dynamicChildren: e.dynamicChildren,
		appContext: e.appContext,
		dirs: e.dirs,
		transition: c,
		component: e.component,
		suspense: e.suspense,
		ssContent: e.ssContent && Bi(e.ssContent),
		ssFallback: e.ssFallback && Bi(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && Rn(u, c.clone(u)), u;
}
function q(e = " ", t = 0) {
	return Li(Ci, null, e, t);
}
function J(e = "", t = !1) {
	return t ? (W(), Mi(wi, null, e)) : Li(wi, null, e);
}
function Vi(e) {
	return e == null || typeof e == "boolean" ? Li(wi) : d(e) ? Li(U, null, e.slice()) : Ni(e) ? Hi(e) : Li(Ci, null, String(e));
}
function Hi(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : Bi(e);
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
		!r && !Jr(t) ? t._ctx = Sn : r === 3 && Sn && (Sn.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else h(t) ? (t = {
		default: t,
		_ctx: Sn
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [q(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Wi(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = M([t.class, r.class]));
		else if (e === "style") t.style = ce([t.style, r.style]);
		else if (a(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(d(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !o(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Gi(e, t, n, r = null) {
	nn(e, t, 7, [n, r]);
}
var Ki = Ar(), qi = 0;
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
		scope: new Se(!0),
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
var Yi = null, Xi = () => Yi || Sn, Zi, Qi;
{
	let e = j(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Zi = t("__VUE_INSTANCE_SETTERS__", (e) => Yi = e), Qi = t("__VUE_SSR_SETTERS__", (e) => na = e);
}
var $i = (e) => {
	let t = Yi;
	return Zi(e), e.scope.on(), () => {
		e.scope.off(), Zi(t);
	};
}, ea = () => {
	Yi && Yi.scope.off(), Zi(null);
};
function ta(e) {
	return e.vnode.shapeFlag & 4;
}
var na = !1;
function ra(e, t = !1, n = !1) {
	t && Qi(t);
	let { props: r, children: i } = e.vnode, a = ta(e);
	Yr(e, r, a, t), ci(e, i, n || t);
	let o = a ? ia(e, t) : void 0;
	return t && Qi(!1), o;
}
function ia(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, pr);
	let { setup: r } = n;
	if (r) {
		Be();
		let n = e.setupContext = r.length > 1 ? ua(e) : null, i = $i(e), a = tn(r, e, 0, [e.props, n]), o = y(a);
		if (Ve(), i(), (o || e.sp) && !Gn(e) && Bn(e), o) {
			if (a.then(ea, ea), t) return a.then((n) => {
				aa(e, n, t);
			}).catch((t) => {
				rn(t, e, 0);
			});
			e.asyncDep = a;
		} else aa(e, a, t);
	} else ca(e, t);
}
function aa(e, t, n) {
	h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = Kt(t)), ca(e, n);
}
var oa, sa;
function ca(e, t, n) {
	let i = e.type;
	if (!e.render) {
		if (!t && oa && !i.render) {
			let t = i.template || br(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: r } = e.appContext.config, { delimiters: a, compilerOptions: o } = i;
				i.render = oa(t, s(s({
					isCustomElement: n,
					delimiters: a
				}, r), o));
			}
		}
		e.render = i.render || r, sa && sa(e);
	}
	{
		let t = $i(e);
		Be();
		try {
			gr(e);
		} finally {
			Ve(), t();
		}
	}
}
var la = { get(e, t) {
	return I(e, "get", ""), e[t];
} };
function ua(e) {
	return {
		attrs: new Proxy(e.attrs, la),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function da(e) {
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
function fa(e) {
	return h(e) && "__vccOpts" in e;
}
var Y = (e, t) => /* @__PURE__ */ Jt(e, t, na), pa = "3.5.34", ma = void 0, ha = typeof window < "u" && window.trustedTypes;
if (ha) try {
	ma = /* @__PURE__ */ ha.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var ga = ma ? (e) => ma.createHTML(e) : (e) => e, _a = "http://www.w3.org/2000/svg", va = "http://www.w3.org/1998/Math/MathML", ya = typeof document < "u" ? document : null, ba = ya && /* @__PURE__ */ ya.createElement("template"), xa = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? ya.createElementNS(_a, e) : t === "mathml" ? ya.createElementNS(va, e) : n ? ya.createElement(e, { is: n }) : ya.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => ya.createTextNode(e),
	createComment: (e) => ya.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => ya.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			ba.innerHTML = ga(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = ba.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, Sa = /* @__PURE__ */ Symbol("_vtc");
function Ca(e, t, n) {
	let r = e[Sa];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var wa = /* @__PURE__ */ Symbol("_vod"), Ta = /* @__PURE__ */ Symbol("_vsh"), Ea = /* @__PURE__ */ Symbol(""), Da = /(?:^|;)\s*display\s*:/;
function Oa(e, t, n) {
	let r = e.style, i = g(n), a = !1;
	if (n && !i) {
		if (t) if (g(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? Aa(r, t, "");
		}
		else for (let e in t) n[e] ?? Aa(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? Aa(r, i, "") : Pa(e, i, !g(t) && t ? t[i] : void 0, o) || Aa(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[Ea];
			e && (n += ";" + e), r.cssText = n, a = Da.test(n);
		}
	} else t && e.removeAttribute("style");
	wa in e && (e[wa] = a ? r.display : "", e[Ta] && (r.display = "none"));
}
var ka = /\s*!important$/;
function Aa(e, t, n) {
	if (d(n)) n.forEach((n) => Aa(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = Na(e, t);
		ka.test(n) ? e.setProperty(E(r), n.replace(ka, ""), "important") : e[r] = n;
	}
}
var ja = [
	"Webkit",
	"Moz",
	"ms"
], Ma = {};
function Na(e, t) {
	let n = Ma[t];
	if (n) return n;
	let r = T(t);
	if (r !== "filter" && r in e) return Ma[t] = r;
	r = D(r);
	for (let n = 0; n < ja.length; n++) {
		let i = ja[n] + r;
		if (i in e) return Ma[t] = i;
	}
	return t;
}
function Pa(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && g(r) && n === r;
}
var Fa = "http://www.w3.org/1999/xlink";
function Ia(e, t, n, r, i, a = me(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Fa, t.slice(6, t.length)) : e.setAttributeNS(Fa, t, n) : n == null || a && !he(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : _(n) ? String(n) : n);
}
function La(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? ga(n) : n);
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
		r === "boolean" ? n = he(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
	}
	try {
		e[t] = n;
	} catch {}
	o && e.removeAttribute(i || t);
}
function Ra(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function za(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var Ba = /* @__PURE__ */ Symbol("_vei");
function Va(e, t, n, r, i = null) {
	let a = e[Ba] || (e[Ba] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = Ua(t);
		r ? Ra(e, n, a[t] = qa(r, i), s) : o && (za(e, n, o, s), a[t] = void 0);
	}
}
var Ha = /(?:Once|Passive|Capture)$/;
function Ua(e) {
	let t;
	if (Ha.test(e)) {
		t = {};
		let n;
		for (; n = e.match(Ha);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : E(e.slice(2)), t];
}
var Wa = 0, Ga = /* @__PURE__ */ Promise.resolve(), Ka = () => Wa ||= (Ga.then(() => Wa = 0), Date.now());
function qa(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		nn(Ja(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Ka(), n;
}
function Ja(e, t) {
	if (d(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Ya = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Xa = (e, t, n, r, i, s) => {
	let c = i === "svg";
	t === "class" ? Ca(e, r, c) : t === "style" ? Oa(e, n, r) : a(t) ? o(t) || Va(e, t, n, r, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Za(e, t, r, c)) ? (La(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ia(e, t, r, c, s, t !== "value")) : e._isVueCE && (Qa(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r))) ? La(e, T(t), r, s, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Ia(e, t, r, c));
};
function Za(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Ya(t) && h(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Ya(t) && g(n) ? !1 : t in e;
}
function Qa(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = T(t);
	return Array.isArray(n) ? n.some((e) => T(e) === r) : Object.keys(n).some((e) => T(e) === r);
}
var $a = {};
/* @__NO_SIDE_EFFECTS__ */
function eo(e, t, n) {
	let r = /* @__PURE__ */ zn(e, t);
	C(r) && (r = s({}, r, t));
	class i extends no {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var to = typeof HTMLElement < "u" ? HTMLElement : class {}, no = class e extends to {
	constructor(e, t = {}, n = So) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== So ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(s({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		if (t) for (let e in t) u(this, e) || Object.defineProperty(this, e, { get: () => B(t[e]) });
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : $a, r = T(e);
		t && this._numberProps && this._numberProps[r] && (n = se(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === $a ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(E(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(E(e), t + "") : t || this.removeAttribute(E(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), xo(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Li(this._def, s(e, this._props));
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
}, ro = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return d(t) ? (e) => ae(t, e) : t;
};
function io(e) {
	e.target.composing = !0;
}
function ao(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var oo = /* @__PURE__ */ Symbol("_assign");
function so(e, t, n) {
	return t && (e = e.trim()), n && (e = oe(e)), e;
}
var co = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e[oo] = ro(i);
		let a = r || i.props && i.props.type === "number";
		Ra(e, t ? "change" : "input", (t) => {
			t.target.composing || e[oo](so(e.value, n, a));
		}), (n || a) && Ra(e, "change", () => {
			e.value = so(e.value, n, a);
		}), t || (Ra(e, "compositionstart", io), Ra(e, "compositionend", ao), Ra(e, "change", ao));
	},
	mounted(e, { value: t }) {
		e.value = t ?? "";
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[oo] = ro(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? oe(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, lo = {
	deep: !0,
	created(e, { value: t, modifiers: { number: n } }, r) {
		let i = p(t);
		Ra(e, "change", () => {
			let t = Array.prototype.filter.call(e.options, (e) => e.selected).map((e) => n ? oe(fo(e)) : fo(e));
			e[oo](e.multiple ? i ? new Set(t) : t : t[0]), e._assigning = !0, pn(() => {
				e._assigning = !1;
			});
		}), e[oo] = ro(r);
	},
	mounted(e, { value: t }) {
		uo(e, t);
	},
	beforeUpdate(e, t, n) {
		e[oo] = ro(n);
	},
	updated(e, { value: t }) {
		e._assigning || uo(e, t);
	}
};
function uo(e, t) {
	let n = e.multiple, r = d(t);
	if (!(n && !r && !p(t))) {
		for (let i = 0, a = e.options.length; i < a; i++) {
			let a = e.options[i], o = fo(a);
			if (n) if (r) {
				let e = typeof o;
				e === "string" || e === "number" ? a.selected = t.some((e) => String(e) === String(o)) : a.selected = ve(t, o) > -1;
			} else a.selected = t.has(o);
			else if (_e(fo(a), t)) {
				e.selectedIndex !== i && (e.selectedIndex = i);
				return;
			}
		}
		!n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
	}
}
function fo(e) {
	return "_value" in e ? e._value : e.value;
}
var po = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], mo = {
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
	exact: (e, t) => po.some((n) => e[`${n}Key`] && !t.includes(n))
}, ho = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = mo[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, go = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, _o = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = E(n.key);
		if (t.some((e) => e === r || go[e] === r)) return e(n);
	}));
}, vo = /* @__PURE__ */ s({ patchProp: Xa }, xa), yo;
function bo() {
	return yo ||= di(vo);
}
var xo = ((...e) => {
	bo().render(...e);
}), So = ((...e) => {
	let t = bo().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = wo(e);
		if (!r) return;
		let i = t._component;
		!h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, Co(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function Co(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function wo(e) {
	return g(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-core/src/session.ts
var To = "__comtryaSessionState", Eo = "__comtryaOperatorCode";
async function Do(e = {}) {
	let t = Ao();
	if (t.current && t.current.expiresAtMs > Date.now() + 5e3) return t.current.token;
	if (!t.inflight) {
		let n = ko(e).finally(() => {
			Ao().inflight === n && (Ao().inflight = void 0);
		});
		t.inflight = n;
	}
	return t.inflight;
}
function Oo() {
	Ao().current = void 0;
}
async function ko(e) {
	let t = e.operatorCode ?? jo(), n = e.fetchImpl ?? fetch, r = e.baseUrl ?? "";
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
	return Ao().current = s, s.token;
}
function Ao() {
	let e = Mo();
	return e[To] ??= {}, e[To];
}
function jo() {
	let e = Mo()[Eo];
	if (e) return e;
	try {
		let e = {
			BASE_URL: "/",
			DEV: !1,
			MODE: "production",
			PROD: !0,
			SSR: !1
		}?.PUBLIC_COMTRYA_OPERATOR_CODE;
		return e && (Mo()[Eo] = e), e;
	} catch {
		return;
	}
}
function Mo() {
	return globalThis;
}
//#endregion
//#region packages/sdk-core/src/runtime.ts
async function X(e, t, n, r, i = {}) {
	let a = `${i.baseUrl ?? ""}/api/ops/${encodeURIComponent(e)}/${encodeURIComponent(t)}/${encodeURIComponent(n)}`, o = { "content-type": "application/json" }, s = i.token ?? await Do();
	s && (o.authorization = `Bearer ${s}`);
	try {
		let e = await fetch(a, {
			method: "POST",
			headers: o,
			body: JSON.stringify(r ?? null),
			signal: i.signal,
			credentials: "include"
		});
		e.status === 401 && Oo();
		let t = await e.text();
		if (!e.ok) {
			let n;
			try {
				n = t ? JSON.parse(t) : void 0;
			} catch {
				n = void 0;
			}
			let r = Po(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: No(n?.code) ?? r,
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
function No(e) {
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
function Po(e) {
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
var Fo = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, Io;
function Lo() {
	return Io ||= Ro(Fo), Io;
}
function Ro(e) {
	let t = async (t, n) => {
		let r = await Do(), i = { "Content-Type": "application/json" };
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
		a.status === 401 && Oo();
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
function zo(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`, r = n.length;
	for (; r > 1 && n.charCodeAt(r - 1) === 47;) --r;
	return `/x/${e}${n === "/" ? "" : n.slice(0, r)}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function Bo(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return Vo(t, e, n.signal), () => n.abort();
}
async function Vo(e, t, n) {
	try {
		let r = await Ho(e, n, t.token);
		t.onOpen?.();
		let i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: Uo(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await Wo(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function Ho(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: Uo(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function Uo(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function Wo(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		Go(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) Ko(e, t);
	}
	a += i.decode(), Go(a, t);
}
function Go(e, t) {
	for (let n of e.split("\n\n")) Ko(n, t);
}
function Ko(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = qo(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function qo(e, t) {
	let n = Jo(e) ? e : {}, r = Jo(n.data) ? n.data : {}, i = Yo(r.eventType) ?? Yo(n.type) ?? t ?? "";
	return {
		id: Yo(r.id) ?? Yo(n.id) ?? "",
		eventType: i,
		payloadB64: Yo(r.payloadB64) ?? "",
		timestampMs: Xo(r.timestampMs) ?? Zo(Xo(n.time)) ?? Date.now(),
		sourceUri: Yo(r.sourceUri) ?? Yo(n.source) ?? "",
		emitterExtension: Yo(r.emitterExtension) ?? Yo(r.extensionId) ?? Yo(n.source) ?? "",
		raw: e
	};
}
function Jo(e) {
	return typeof e == "object" && !!e;
}
function Yo(e) {
	return typeof e == "string" ? e : void 0;
}
function Xo(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function Zo(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var Qo = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], $o = typeof navigator == "object" ? navigator.platform : "", es = /Mac|iPod|iPhone|iPad/.test($o), ts = es ? "Meta" : "Control", ns = $o === "Win32" ? ["Control", "Alt"] : es ? ["Alt"] : [];
function rs(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || ns.includes(t) && e.getModifierState("AltGraph"));
}
function is(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? ts : e;
		}), n];
	});
}
function as(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !rs(e, t);
	}) || Qo.find(function(t) {
		return !n.includes(t) && r !== t && rs(e, t);
	}));
}
function os(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [is(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			as(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : rs(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function ss(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = os(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var cs = /* @__PURE__ */ new Map(), ls = /* @__PURE__ */ new Set();
function us(e) {
	cs.set(e.id, e);
	for (let e of ls) e();
	return () => {
		cs.delete(e.id);
		for (let e of ls) e();
	};
}
//#endregion
//#region packages/sdk-core/src/workspace-store.ts
var ds = null, fs = [];
function ps() {
	return ds;
}
function ms() {
	return ds === null ? new Promise((e) => {
		fs.push(e);
	}) : Promise.resolve(ds);
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function hs(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function gs(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function _s(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (gs(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			hs(e.target) || r(e);
		};
	}
	return t;
}
function vs(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = _s(e), i = () => {
		n ||= ss(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? V(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), ir(a);
}
//#endregion
//#region node_modules/.bun/marked@18.0.4/node_modules/marked/lib/marked.esm.js
function ys() {
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
var bs = ys();
function xs(e) {
	bs = e;
}
var Ss = { exec: () => null };
function Cs(e) {
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
var ws = ((e = "") => {
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
	nextBulletRegex: Cs((e) => RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),
	hrRegex: Cs((e) => RegExp(`^ {0,${e}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)),
	fencesBeginRegex: Cs((e) => RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),
	headingBeginRegex: Cs((e) => RegExp(`^ {0,${e}}#`)),
	htmlBeginRegex: Cs((e) => RegExp(`^ {0,${e}}<(?:[a-z].*>|!--)`, "i")),
	blockquoteBeginRegex: Cs((e) => RegExp(`^ {0,${e}}>`))
}, Ts = /^(?:[ \t]*(?:\n|$))+/, Es = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Ds = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Os = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ks = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, As = / {0,3}(?:[*+-]|\d{1,9}[.)])/, js = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, Ms = Z(js).replace(/bull/g, As).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Ns = Z(js).replace(/bull/g, As).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), Ps = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Fs = /^[^\n]+/, Is = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, Ls = Z(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Is).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Rs = Z(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, As).getRegex(), zs = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Bs = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Vs = Z("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", Bs).replace("tag", zs).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Hs = Z(Ps).replace("hr", Os).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", zs).getRegex(), Us = {
	blockquote: Z(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Hs).getRegex(),
	code: Es,
	def: Ls,
	fences: Ds,
	heading: ks,
	hr: Os,
	html: Vs,
	lheading: Ms,
	list: Rs,
	newline: Ts,
	paragraph: Hs,
	table: Ss,
	text: Fs
}, Ws = Z("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Os).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", zs).getRegex(), Gs = {
	...Us,
	lheading: Ns,
	table: Ws,
	paragraph: Z(Ps).replace("hr", Os).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Ws).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", zs).getRegex()
}, Ks = {
	...Us,
	html: Z("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", Bs).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: Ss,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: Z(Ps).replace("hr", Os).replace("heading", " *#{1,6} *[^\n]").replace("lheading", Ms).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, qs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Js = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Ys = /^( {2,}|\\)\n(?!\s*$)/, Xs = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Zs = /[\p{P}\p{S}]/u, Qs = /[\s\p{P}\p{S}]/u, $s = /[^\s\p{P}\p{S}]/u, ec = Z(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Qs).getRegex(), tc = /(?!~)[\p{P}\p{S}]/u, nc = /(?!~)[\s\p{P}\p{S}]/u, rc = /(?:[^\s\p{P}\p{S}]|~)/u, ic = Z(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", ws ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), ac = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/, oc = Z(ac, "u").replace(/punct/g, Zs).getRegex(), sc = Z(ac, "u").replace(/punct/g, tc).getRegex(), cc = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", lc = Z(cc, "gu").replace(/notPunctSpace/g, $s).replace(/punctSpace/g, Qs).replace(/punct/g, Zs).getRegex(), uc = Z(cc, "gu").replace(/notPunctSpace/g, rc).replace(/punctSpace/g, nc).replace(/punct/g, tc).getRegex(), dc = Z("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, $s).replace(/punctSpace/g, Qs).replace(/punct/g, Zs).getRegex(), fc = Z(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, Zs).getRegex(), pc = Z("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, $s).replace(/punctSpace/g, Qs).replace(/punct/g, Zs).getRegex(), mc = Z(/\\(punct)/, "gu").replace(/punct/g, Zs).getRegex(), hc = Z(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), gc = Z(Bs).replace("(?:-->|$)", "-->").getRegex(), _c = Z("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", gc).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), vc = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/, yc = Z(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", vc).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), bc = Z(/^!?\[(label)\]\[(ref)\]/).replace("label", vc).replace("ref", Is).getRegex(), xc = Z(/^!?\[(ref)\](?:\[\])?/).replace("ref", Is).getRegex(), Sc = Z("reflink|nolink(?!\\()", "g").replace("reflink", bc).replace("nolink", xc).getRegex(), Cc = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, wc = {
	_backpedal: Ss,
	anyPunctuation: mc,
	autolink: hc,
	blockSkip: ic,
	br: Ys,
	code: Js,
	del: Ss,
	delLDelim: Ss,
	delRDelim: Ss,
	emStrongLDelim: oc,
	emStrongRDelimAst: lc,
	emStrongRDelimUnd: dc,
	escape: qs,
	link: yc,
	nolink: xc,
	punctuation: ec,
	reflink: bc,
	reflinkSearch: Sc,
	tag: _c,
	text: Xs,
	url: Ss
}, Tc = {
	...wc,
	link: Z(/^!?\[(label)\]\((.*?)\)/).replace("label", vc).getRegex(),
	reflink: Z(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", vc).getRegex()
}, Ec = {
	...wc,
	emStrongRDelimAst: uc,
	emStrongLDelim: sc,
	delLDelim: fc,
	delRDelim: pc,
	url: Z(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", Cc).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: Z(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", Cc).getRegex()
}, Dc = {
	...Ec,
	br: Z(Ys).replace("{2,}", "*").getRegex(),
	text: Z(Ec.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Oc = {
	normal: Us,
	gfm: Gs,
	pedantic: Ks
}, kc = {
	normal: wc,
	gfm: Ec,
	breaks: Dc,
	pedantic: Tc
}, Ac = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, jc = (e) => Ac[e];
function Mc(e, t) {
	if (t) {
		if (Q.escapeTest.test(e)) return e.replace(Q.escapeReplace, jc);
	} else if (Q.escapeTestNoEncode.test(e)) return e.replace(Q.escapeReplaceNoEncode, jc);
	return e;
}
function Nc(e) {
	try {
		e = encodeURI(e).replace(Q.percentDecode, "%");
	} catch {
		return null;
	}
	return e;
}
function Pc(e, t) {
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
function Fc(e, t, n) {
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
function Ic(e) {
	let t = e.split("\n"), n = t.length - 1;
	for (; n >= 0 && Q.blankLine.test(t[n]);) n--;
	return t.length - n <= 2 ? e : t.slice(0, n + 1).join("\n");
}
function Lc(e, t) {
	if (e.indexOf(t[1]) === -1) return -1;
	let n = 0;
	for (let r = 0; r < e.length; r++) if (e[r] === "\\") r++;
	else if (e[r] === t[0]) n++;
	else if (e[r] === t[1] && (n--, n < 0)) return r;
	return n > 0 ? -2 : -1;
}
function Rc(e, t = 0) {
	let n = t, r = "";
	for (let t of e) if (t === "	") {
		let e = 4 - n % 4;
		r += " ".repeat(e), n += e;
	} else r += t, n++;
	return r;
}
function zc(e, t, n, r, i) {
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
function Bc(e, t, n) {
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
var Vc = class {
	options;
	rules;
	lexer;
	constructor(e) {
		this.options = e || bs;
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
			let e = this.options.pedantic ? t[0] : Ic(t[0]);
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
			let e = t[0], n = Bc(e, t[3] || "", this.rules);
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
				let t = Fc(e, "#");
				(this.options.pedantic || !t || this.rules.other.endingSpaceChar.test(t)) && (e = t.trim());
			}
			return {
				type: "heading",
				raw: Fc(t[0], "\n"),
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
			raw: Fc(t[0], "\n")
		};
	}
	blockquote(e) {
		let t = this.rules.block.blockquote.exec(e);
		if (t) {
			let e = Fc(t[0], "\n").split("\n"), n = "", r = "", i = [];
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
				let c = Rc(t[2].split("\n", 1)[0], t[1].length), l = e.split("\n", 1)[0], u = !c.trim(), d = 0;
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
			let e = Ic(t[0]);
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
				raw: Fc(t[0], "\n"),
				href: n,
				title: r
			};
		}
	}
	table(e) {
		let t = this.rules.block.table.exec(e);
		if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
		let n = Pc(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [], a = {
			type: "table",
			raw: Fc(t[0], "\n"),
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
			for (let e of i) a.rows.push(Pc(e, a.header.length).map((e, t) => ({
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
				raw: Fc(t[0], "\n"),
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
				let t = Fc(e.slice(0, -1), "\\");
				if ((e.length - t.length) % 2 == 0) return;
			} else {
				let e = Lc(t[2], "()");
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
			return n = n.trim(), this.rules.other.startAngleBracket.test(n) && (n = this.options.pedantic && !this.rules.other.endAngleBracket.test(e) ? n.slice(1) : n.slice(1, -1)), zc(t, {
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
			return zc(n, e, n[0], this.lexer, this.rules);
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
}, Hc = class e {
	tokens;
	options;
	state;
	inlineQueue;
	tokenizer;
	constructor(e) {
		this.tokens = [], this.tokens.links = Object.create(null), this.options = e || bs, this.options.tokenizer = this.options.tokenizer || new Vc(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			top: !0
		};
		let t = {
			other: Q,
			block: Oc.normal,
			inline: kc.normal
		};
		this.options.pedantic ? (t.block = Oc.pedantic, t.inline = kc.pedantic) : this.options.gfm && (t.block = Oc.gfm, this.options.breaks ? t.inline = kc.breaks : t.inline = kc.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: Oc,
			inline: kc
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
}, Uc = class {
	options;
	parser;
	constructor(e) {
		this.options = e || bs;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: t, escaped: n }) {
		let r = (t || "").match(Q.notSpaceStart)?.[0], i = e.replace(Q.endingNewline, "") + "\n";
		return r ? "<pre><code class=\"language-" + Mc(r) + "\">" + (n ? i : Mc(i, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? i : Mc(i, !0)) + "</code></pre>\n";
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
		return `<code>${Mc(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: t, tokens: n }) {
		let r = this.parser.parseInline(n), i = Nc(e);
		if (i === null) return r;
		e = i;
		let a = "<a href=\"" + e + "\"";
		return t && (a += " title=\"" + Mc(t) + "\""), a += ">" + r + "</a>", a;
	}
	image({ href: e, title: t, text: n, tokens: r }) {
		r && (n = this.parser.parseInline(r, this.parser.textRenderer));
		let i = Nc(e);
		if (i === null) return Mc(n);
		e = i;
		let a = `<img src="${e}" alt="${Mc(n)}"`;
		return t && (a += ` title="${Mc(t)}"`), a += ">", a;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : Mc(e.text);
	}
}, Wc = class {
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
}, Gc = class e {
	options;
	renderer;
	textRenderer;
	constructor(e) {
		this.options = e || bs, this.options.renderer = this.options.renderer || new Uc(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Wc();
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
}, Kc = class {
	options;
	block;
	constructor(e) {
		this.options = e || bs;
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
		return e ? Hc.lex : Hc.lexInline;
	}
	provideParser(e = this.block) {
		return e ? Gc.parse : Gc.parseInline;
	}
}, qc = class {
	defaults = ys();
	options = this.setOptions;
	parse = this.parseMarkdown(!0);
	parseInline = this.parseMarkdown(!1);
	Parser = Gc;
	Renderer = Uc;
	TextRenderer = Wc;
	Lexer = Hc;
	Tokenizer = Vc;
	Hooks = Kc;
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
				let t = this.defaults.renderer || new Uc(this.defaults);
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
				let t = this.defaults.tokenizer || new Vc(this.defaults);
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
				let t = this.defaults.hooks || new Kc();
				for (let n in e.hooks) {
					if (!(n in t)) throw Error(`hook '${n}' does not exist`);
					if (["options", "block"].includes(n)) continue;
					let r = n, i = e.hooks[r], a = t[r];
					Kc.passThroughHooks.has(n) ? t[r] = (e) => {
						if (this.defaults.async && Kc.passThroughHooksRespectAsync.has(n)) return (async () => {
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
		return Hc.lex(e, t ?? this.defaults);
	}
	parser(e, t) {
		return Gc.parse(e, t ?? this.defaults);
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
				let n = i.hooks ? await i.hooks.preprocess(t) : t, r = await (i.hooks ? await i.hooks.provideLexer(e) : e ? Hc.lex : Hc.lexInline)(n, i), a = i.hooks ? await i.hooks.processAllTokens(r) : r;
				i.walkTokens && await Promise.all(this.walkTokens(a, i.walkTokens));
				let o = await (i.hooks ? await i.hooks.provideParser(e) : e ? Gc.parse : Gc.parseInline)(a, i);
				return i.hooks ? await i.hooks.postprocess(o) : o;
			})().catch(a);
			try {
				i.hooks && (t = i.hooks.preprocess(t));
				let n = (i.hooks ? i.hooks.provideLexer(e) : e ? Hc.lex : Hc.lexInline)(t, i);
				i.hooks && (n = i.hooks.processAllTokens(n)), i.walkTokens && this.walkTokens(n, i.walkTokens);
				let r = (i.hooks ? i.hooks.provideParser(e) : e ? Gc.parse : Gc.parseInline)(n, i);
				return i.hooks && (r = i.hooks.postprocess(r)), r;
			} catch (e) {
				return a(e);
			}
		};
	}
	onError(e, t) {
		return (n) => {
			if (n.message += "\nPlease report this to https://github.com/markedjs/marked.", e) {
				let e = "<p>An error occurred:</p><pre>" + Mc(n.message + "", !0) + "</pre>";
				return t ? Promise.resolve(e) : e;
			}
			if (t) return Promise.reject(n);
			throw n;
		};
	}
}, Jc = new qc();
function $(e, t) {
	return Jc.parse(e, t);
}
$.options = $.setOptions = function(e) {
	return Jc.setOptions(e), $.defaults = Jc.defaults, xs($.defaults), $;
}, $.getDefaults = ys, $.defaults = bs, $.use = function(...e) {
	return Jc.use(...e), $.defaults = Jc.defaults, xs($.defaults), $;
}, $.walkTokens = function(e, t) {
	return Jc.walkTokens(e, t);
}, $.parseInline = Jc.parseInline, $.Parser = Gc, $.parser = Gc.parse, $.Renderer = Uc, $.TextRenderer = Wc, $.Lexer = Hc, $.lexer = Hc.lex, $.Tokenizer = Vc, $.Hooks = Kc, $.parse = $, $.options, $.setOptions, $.use, $.walkTokens, $.parseInline, Gc.parse, Hc.lex;
//#endregion
//#region packages/sdk-vue/src/markdown.ts
var Yc = new Set(/* @__PURE__ */ "h1.h2.h3.h4.h5.h6.p.ul.ol.li.strong.em.b.i.code.pre.a.img.br.hr.blockquote.table.thead.tbody.tfoot.tr.th.td.dl.dt.dd.details.summary.sup.sub.del.ins.s.mark.abbr.cite.q.figure.figcaption.caption.span.div.section.article.aside.header.footer.nav.main".split(".")), Xc = new Set([
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
]), Zc = {
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
}, Qc = /^\s*(?:javascript|vbscript|data)\s*:/i;
function $c(e) {
	return !Qc.test(e);
}
function el(e) {
	return e.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function tl(e, t) {
	if (!t.trim()) return "";
	let n = [], r = /\s+([a-zA-Z][a-zA-Z0-9_:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=>]+)))?/g, i, a = !1, o = [];
	for (; (i = r.exec(t)) !== null;) {
		let t = (i[1] ?? "").toLowerCase(), n = i[2] ?? i[3] ?? i[4] ?? "";
		if (t.startsWith("on")) continue;
		let r = Zc[e];
		(Xc.has(t) || r && r.has(t)) && ((t === "href" || t === "src") && !$c(n) || (t === "rel" && (a = !0), o.push({
			name: t,
			value: n
		})));
	}
	for (let { name: e, value: t } of o) n.push(" " + e + "=\"" + el(t) + "\"");
	return e === "a" && !a && n.push(" rel=\"noopener noreferrer\""), n.join("");
}
var nl = [
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
], rl = new Set([
	"input",
	"button",
	"meta",
	"link",
	"base",
	"applet"
]);
function il(e) {
	let t = e;
	for (let e of nl) {
		let n = RegExp("<" + e + "(\\s[^>]*)?>([\\s\\S]*?)<\\/" + e + ">", "gi");
		t = t.replace(n, "");
		let r = RegExp("<" + e + "(\\s[^>]*)?>", "gi");
		t = t.replace(r, "");
		let i = RegExp("<\\/" + e + ">", "gi");
		t = t.replace(i, "");
	}
	return t = t.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?(\/?)>/g, (e, t, n, r, i) => {
		let a = n.toLowerCase();
		if (rl.has(a) || !Yc.has(a)) return "";
		let o = tl(a, r ?? ""), s = i ? " /" : "";
		return "<" + t + a + o + s + ">";
	}), t;
}
function al(e, t) {
	let n = encodeURIComponent(t);
	return e.split(/(<code[^>]*>[\s\S]*?<\/code>)/).map((e, t) => t % 2 == 1 ? e : e.replace(/(^|[^\w&])#(\d+)\b/g, (e, t, r) => t + "<a href=\"/x/issues/" + n + "/" + r + "\" class=\"issue-ref\">#" + r + "</a>")).join("");
}
function ol(e, t = {}) {
	if (!e) return "";
	let n = il(new qc().parse(e, { async: !1 }));
	return t.workspaceId && (n = al(n, t.workspaceId)), n;
}
function sl(e, t = 280) {
	let n = e.replace(/\s+/g, " ").trim();
	return n.length <= t ? n : n.slice(0, t) + "…";
}
//#endregion
//#region packages/sdk-vue/src/parse-query.ts
function cl(e, t) {
	let n = {}, r = /* @__PURE__ */ new Set(), i = [], a = new Set(t);
	if (!e || !e.trim()) return {
		text: "",
		filters: n,
		unknown: []
	};
	let o = ll(e);
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
function ll(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n;) {
		for (; r < n && ul(e.charCodeAt(r));) r += 1;
		if (r >= n) break;
		let i = r, a = -1;
		for (; r < n && !ul(e.charCodeAt(r));) {
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
			if (dl(n)) {
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
function ul(e) {
	return e === 32 || e === 9 || e === 10 || e === 13;
}
function dl(e) {
	if (e.length === 0 || !fl(e.charCodeAt(0))) return !1;
	for (let t = 1; t < e.length; t += 1) {
		let n = e.charCodeAt(t);
		if (!fl(n) && !pl(n) && n !== 95 && n !== 45) return !1;
	}
	return !0;
}
function fl(e) {
	return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function pl(e) {
	return e >= 48 && e <= 57;
}
//#endregion
//#region packages/sdk-vue/src/project-query.ts
function ml(e, t) {
	let n = _l(t.projectFilter);
	if (!n) {
		e.delete("project");
		return;
	}
	hl(n, t) ? e.set("project", n) : e.delete("project");
}
function hl(e, t) {
	let n = _l(t.scopedProjectName);
	if (!n) return !0;
	if (n !== e) return !1;
	let r = gl(t.currentSearch);
	return r.get("project") === e && !r.has("projectName");
}
function gl(e) {
	return e instanceof URLSearchParams ? new URLSearchParams(e) : new URLSearchParams(e ?? "");
}
function _l(e) {
	return (e?.trim() ?? "") || null;
}
//#endregion
//#region packages/sdk-vue/src/extension-hrefs.ts
function vl(e, t = "/", n = {}) {
	let r = zo(e, t), i = yl(n.repositorySegments);
	if (!i) return r;
	let a = r.slice(`/x/${e}`.length);
	return `${`/r/${i.map(encodeURIComponent).join("/")}`}/${encodeURIComponent(e)}${a}`;
}
function yl(e) {
	let t = e?.map((e) => e.trim()).filter(Boolean) ?? [];
	return t.length > 0 ? t : null;
}
//#endregion
//#region packages/sdk-vue/src/classify-principal.ts
var bl = {
	kind: "unknown",
	label: "unknown",
	glyph: "·",
	tone: "neutral"
};
function xl(e) {
	if (!e) return bl;
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: Sl(r),
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
			glyph: Sl(r) || "·",
			tone: "neutral"
		};
	}
}
function Sl(e) {
	return e.slice(0, 1).toUpperCase();
}
//#endregion
//#region packages/sdk-vue/src/comtrya-config.ts
function Cl() {
	if (typeof window > "u") return [];
	let e = window.location.pathname;
	if (!e.startsWith("/r/")) return [];
	let t = e.slice(3), n = t.indexOf("/p/");
	return (n >= 0 ? t.slice(0, n) : t).split("/").filter(Boolean).map(decodeURIComponent);
}
async function wl(e) {
	try {
		let t = e ?? Cl();
		return t.length === 0 ? [] : (((await Lo().query("query ComtryaProjects($segments: [String!]!) {\n      workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n    }", { segments: t })).workspace?.repositoryByPath?.comtryaConfig ?? null)?.projects ?? []).filter((e) => typeof e == "object" && !!e);
	} catch {
		return [];
	}
}
async function Tl(e, t) {
	return ((await wl(t)).find((t) => t.name === e)?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0);
}
//#endregion
//#region packages/sdk-vue/src/LabelPill.vue?vue&type=script&setup=true&lang.ts
var El = ["title"], Dl = {
	key: 0,
	class: "label-pill-value"
}, Ol = { class: "label-pill-type" }, kl = { class: "label-pill-value" }, Al = /* @__PURE__ */ zn({
	__name: "LabelPill",
	props: {
		name: { type: String },
		catalog: { type: [Object, null] }
	},
	setup(e) {
		let t = e, n = Y(() => t.catalog ? t.catalog[t.name] ?? null : null), r = Y(() => {
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
		}), i = Y(() => n.value?.color ?? null), a = Y(() => n.value?.description ?? null);
		return (e, t) => (W(), G("span", {
			class: M(["label-pill", [`label-pill--${r.value.kind}`]]),
			title: a.value ?? void 0,
			style: ce(i.value ? { "--label-color": i.value } : void 0)
		}, [r.value.kind === "plain" ? (W(), G("span", Dl, N(r.value.value), 1)) : (W(), G(U, { key: 1 }, [
			K("span", Ol, N(r.value.type), 1),
			t[0] ||= K("span", {
				class: "label-pill-sep",
				"aria-hidden": "true"
			}, "::", -1),
			K("span", kl, N(r.value.value), 1)
		], 64))], 14, El));
	}
});
//#endregion
//#region packages/sdk-vue/src/index.ts
function jl(e) {
	Ml(e.tagName, e.component);
	let t = /* @__PURE__ */ eo(e.component, { shadowRoot: e.shadowRoot ?? !1 });
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
//#region ../extensions/first-party/ext_epics/dist/ext_epics.client.ts
var Fl = {
	createEpic: async (e) => X("ext_epics", "epics", "create-epic", e),
	changeStateEpic: async (e) => X("ext_epics", "epics", "change-state-epic", e),
	assignProject: async (e) => X("ext_epics", "epics", "assign-project", e),
	updateEpic: async (e) => X("ext_epics", "epics", "update-epic", e),
	getEpic: async (e) => X("ext_epics", "epics", "get-epic", e),
	listEpics: async (e) => X("ext_epics", "epics", "list-epics", e),
	byRefEpic: async (e) => X("ext_epics", "epics", "by-ref-epic", e),
	byRefsEpic: async (e) => X("ext_epics", "epics", "by-refs-epic", e),
	progressEpic: async (e) => X("ext_epics", "epics", "progress-epic", e),
	roadmapBoard: async (e) => X("ext_epics", "epics", "roadmap-board", e),
	ownerBoard: async (e) => X("ext_epics", "epics", "owner-board", e),
	projectBoard: async (e) => X("ext_epics", "epics", "project-board", e),
	labelBoard: async (e) => X("ext_epics", "epics", "label-board", e),
	priorityBoard: async (e) => X("ext_epics", "epics", "priority-board", e),
	milestoneBoard: async (e) => X("ext_epics", "epics", "milestone-board", e),
	targetBoard: async (e) => X("ext_epics", "epics", "target-board", e),
	issuesInEpic: async (e) => X("ext_epics", "epics", "issues-in-epic", e),
	childrenOfEpic: async (e) => X("ext_epics", "epics", "children-of-epic", e)
}, Il = "query($from: ResourceURN!, $kind: ResourceURN) {\n  relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n}", Ll = "mutation($input: RelationCreateInput!) {\n  relations.create(input: $input) { id kind from to source target }\n}", Rl = "mutation($input: RelationDeleteInput!) {\n  relations.delete(input: $input)\n}";
function zl(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Bl(e) {
	return `comtrya://workspace/${e}`;
}
function Vl(e) {
	switch (e) {
		case "IN_PROGRESS":
		case "AT_RISK":
		case "DONE":
		case "CANCELED": return e;
		default: return "PLANNED";
	}
}
function Hl(e) {
	return {
		id: e.id,
		workspaceId: e.workspaceId ?? e.workspace?.replace(/^comtrya:\/\/workspace\//, "") ?? "",
		number: e.number ?? null,
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: Vl(e.state),
		targetDate: e.targetDate ?? null,
		ownerRef: e.ownerRef ?? null,
		labels: e.labels ?? [],
		createdAt: e.createdAt ?? null,
		closedAt: e.closedAt ?? null,
		projectName: e.projectName ?? null
	};
}
function Ul(e) {
	return {
		workspace: e.workspace ?? "",
		total: e.total ?? 0,
		today: e.today ?? null,
		columns: (e.columns ?? []).map((e) => ({
			key: e.key,
			label: e.label,
			count: e.count,
			ownerRef: e.ownerRef ?? null,
			projectName: e.projectName ?? null,
			priority: e.priority ?? null,
			milestone: e.milestone ?? null,
			cards: (e.cards ?? []).map((e) => ({
				epic: Hl(e.epic),
				progress: e.progress ?? null,
				ownerRef: e.ownerRef ?? null,
				projectName: e.projectName ?? null,
				priority: e.priority ?? null,
				priorityLabel: e.priorityLabel ?? null,
				milestone: e.milestone ?? null,
				milestoneLabel: e.milestoneLabel ?? null
			}))
		}))
	};
}
async function Wl(e, t) {
	let n = zl(await Fl.byRefEpic(t), "epicByRef");
	return n ? Hl(n) : null;
}
async function Gl(e, t) {
	let n = zl(await Fl.listEpics({
		workspace: Bl(t.workspaceId),
		limit: 1024
	}), "listEpics").map(Hl), r = t.state ? Vl(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function Kl(e, t) {
	let n = {
		workspace: Bl(t.workspaceId),
		limit: t.limit ?? 128
	};
	return Ul(zl(await ql(e)(n), `${e}Board`));
}
function ql(e) {
	switch (e) {
		case "roadmap": return Fl.roadmapBoard;
		case "project": return Fl.projectBoard;
		case "owner": return Fl.ownerBoard;
		case "priority": return Fl.priorityBoard;
		case "milestone": return Fl.milestoneBoard;
		case "label": return Fl.labelBoard;
		case "target": return Fl.targetBoard;
	}
}
async function Jl(e, t) {
	return zl(await Fl.progressEpic(t), "epicProgress");
}
async function Yl(e, t, n = 1024) {
	return zl(await Fl.issuesInEpic({
		ref: t,
		limit: n
	}), "issuesInEpic");
}
async function Xl(e, t, n) {
	return Hl(zl(await Fl.changeStateEpic({
		id: t,
		state: n
	}), "changeEpicState"));
}
async function Zl(e, t) {
	return Hl(zl(await Fl.createEpic({
		workspace: Bl(t.workspaceId),
		title: t.title,
		bodyMarkdown: t.bodyMarkdown ?? "",
		ownerRef: null,
		targetDate: null,
		labels: [],
		parentEpicRef: null,
		projectName: t.projectName ?? null
	}), "createEpic"));
}
async function Ql(e, t) {
	return Hl(zl(await Fl.assignProject({
		id: e,
		projectName: t ?? null
	}), "assignProject"));
}
async function $l(e, t, n) {
	return ((await e.query(Il, n ? {
		from: t,
		kind: n
	} : { from: t })).relations?.outgoing ?? []).map(nu);
}
async function eu(e, t) {
	let n = (await e.mutate(Ll, { input: t })).relations?.create;
	if (!n) throw Error("relations.create returned no relation");
	return nu(n);
}
async function tu(e, t) {
	return (await e.mutate(Rl, { input: { id: t } })).relations?.delete ?? !1;
}
function nu(e) {
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
//#region ../extensions/first-party/ext_epics/ui/src/types.ts
function ru() {
	return ps() ?? "";
}
var iu = "epics";
function au(e) {
	return `comtrya://epic/${e.id}`;
}
function ou(e) {
	return zo(iu, `/${e.workspaceId}/${e.id}`);
}
function su(e) {
	return `${zo(iu, "/board")}?workspaceId=${e}`;
}
function cu(e) {
	switch (e) {
		case "PLANNED": return {
			label: "planned",
			className: "epic-state-muted"
		};
		case "IN_PROGRESS": return {
			label: "in progress",
			className: "epic-state-good"
		};
		case "AT_RISK": return {
			label: "at risk",
			className: "epic-state-warn"
		};
		case "DONE": return {
			label: "done",
			className: "epic-state-good"
		};
		case "CANCELED": return {
			label: "canceled",
			className: "epic-state-muted"
		};
		default: return {
			label: "unknown",
			className: "epic-state-muted"
		};
	}
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/epic-commands.ts
var lu = /* @__PURE__ */ new Map();
function uu(e) {
	return [
		e.id,
		e.title,
		e.state,
		e.projectName ?? ""
	].join("|");
}
var du = [
	{
		state: "IN_PROGRESS",
		verb: "in progress"
	},
	{
		state: "DONE",
		verb: "done"
	},
	{
		state: "CANCELED",
		verb: "canceled"
	}
];
function fu(e) {
	return e.projectName ? ` (${e.projectName})` : "";
}
function pu(e, t) {
	let n = [], r = fu(e);
	n.push(us({
		id: `ext_epics.open.${e.id}`,
		title: `Open epic ${e.title}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: () => {
			window.location.href = ou(e);
		}
	}));
	for (let { state: i, verb: a } of du) e.state !== i && n.push(us({
		id: `ext_epics.mark.${i.toLowerCase()}.${e.id}`,
		title: `Mark epic ${e.title} ${a}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: async () => {
			await Xl(t, e.id, i);
		}
	}));
	return () => n.forEach((e) => e());
}
async function mu(e, t) {
	let n;
	try {
		n = await Gl(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_epics] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = uu(t), i = lu.get(t.id);
		i && i.signature === n || (i?.unregister(), lu.set(t.id, {
			signature: n,
			unregister: pu(t, e)
		}));
	}
	for (let [e, t] of lu) r.has(e) || (t.unregister(), lu.delete(e));
}
function hu(e) {
	let t = [], n = !1;
	return ms().then((r) => {
		if (!n) {
			mu(e, r);
			for (let n of ["dev.comtrya.epic.created", "dev.comtrya.epic.state-changed"]) t.push(Bo({
				type: n,
				onEvent: () => {
					mu(e, r);
				},
				onError: () => {}
			}));
		}
	}), () => {
		n = !0;
		for (let e of t) e();
		for (let e of lu.values()) e.unregister();
		lu.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicCard.vue?vue&type=script&setup=true&lang.ts
var gu = ["data-state"], _u = ["data-epic-id"], vu = { class: "epic-card-title" }, yu = ["href"], bu = ["data-author-kind", "title"], xu = { class: "owner-glyph" }, Su = ["title"], Cu = {
	key: 0,
	class: "epic-meta"
}, wu = {
	key: 1,
	class: "epic-meta"
}, Tu = {
	key: 1,
	class: "epic-line muted"
}, Eu = {
	key: 2,
	class: "epic-card-fallback"
}, Du = { class: "epic-line muted" }, Ou = { class: "epic-line warn" }, ku = /* @__PURE__ */ zn({
	__name: "EpicCard",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epic: { type: null },
		ref: { type: String },
		resourceRef: { type: String },
		repositorySegments: { type: Array },
		activeOwner: { type: [String, null] },
		activeProject: { type: [String, null] }
	},
	emits: ["owner-click", "project-click"],
	setup(e, { emit: t }) {
		let n = e, r = t, i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(n.epic ?? null), s = /* @__PURE__ */ z(null), c = Y(() => n.resourceRef ?? n.ref ?? ""), l = Y(() => n.client ?? n.comtryaClient), u = Y(() => n.epic ?? o.value), d = Y(() => cu(u.value?.state)), f = Y(() => u.value ? vl(iu, `/${u.value.workspaceId}/${u.value.id}`, { repositorySegments: n.repositorySegments }) : "#"), p = Y(() => (s.value?.issuesOpen ?? 0) + (s.value?.issuesClosed ?? 0));
		er(m), V(() => [
			l.value,
			n.epic,
			c.value
		], () => void m());
		async function m() {
			if (n.epic) {
				o.value = n.epic, i.value = "ready", a.value = null, await h();
				return;
			}
			if (!c.value) {
				o.value = null, s.value = null, i.value = "error", a.value = "epic-card: missing ref";
				return;
			}
			if (!l.value) {
				o.value = null, s.value = null, i.value = "error", a.value = "epic-card: no client";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				o.value = await Wl(l.value, c.value), i.value = o.value ? "ready" : "empty", await h();
			} catch (e) {
				o.value = null, s.value = null, i.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function h() {
			if (!l.value || !c.value) {
				s.value = null;
				return;
			}
			try {
				s.value = await Jl(l.value, c.value);
			} catch {
				s.value = null;
			}
		}
		function g(e) {
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
		return (e, t) => (W(), G("article", {
			class: "epic-card",
			"data-state": i.value,
			"data-smoke": "epic-card"
		}, [u.value ? (W(), G("div", {
			key: 0,
			class: "epic-card-body",
			"data-epic-id": u.value.id,
			"data-smoke": "epic-card-body"
		}, [
			K("div", vu, [
				K("span", { class: M(["epic-pill", d.value.className]) }, N(d.value.label), 3),
				K("a", {
					class: "epic-title-link",
					href: f.value
				}, N(u.value.title), 9, yu),
				u.value.ownerRef ? (W(), G("button", {
					key: 0,
					type: "button",
					class: M(["epic-owner", { active: n.activeOwner === u.value.ownerRef }]),
					"data-author-kind": g(u.value.ownerRef).kind,
					title: `${u.value.ownerRef}\nClick to filter by this owner`,
					onClick: t[0] ||= ho((e) => r("owner-click", u.value.ownerRef), ["prevent", "stop"])
				}, [K("span", xu, N(g(u.value.ownerRef).glyph), 1), q(" " + N(g(u.value.ownerRef).label), 1)], 10, bu)) : J("", !0),
				u.value.projectName ? (W(), G("button", {
					key: 1,
					type: "button",
					class: M(["epic-project", { active: n.activeProject === u.value.projectName }]),
					title: `${u.value.projectName}\nClick to filter by this project`,
					onClick: t[1] ||= ho((e) => r("project-click", u.value.projectName), ["prevent", "stop"])
				}, [t[2] ||= K("span", { class: "project-glyph" }, "◇", -1), q(" " + N(u.value.projectName), 1)], 10, Su)) : J("", !0)
			]),
			s.value ? (W(), G("div", Cu, [K("span", null, N(s.value.issuesClosed ?? 0) + "/" + N(p.value) + " issues", 1), K("span", null, N(s.value.percentComplete ?? 0) + "% complete", 1)])) : J("", !0),
			u.value.targetDate ? (W(), G("div", wu, [K("span", null, "target: " + N(u.value.targetDate), 1)])) : J("", !0)
		], 8, _u)) : i.value === "loading" ? (W(), G("p", Tu, " Loading " + N(c.value), 1)) : (W(), G("div", Eu, [K("p", Du, N(c.value || "epic"), 1), K("p", Ou, N(a.value ?? "epic not found"), 1)]))], 8, gu));
	}
}), Au = ".epic-card[data-v-268f3a3f]{display:block}.epic-card-body[data-v-268f3a3f]{border:.5px solid var(--line,#ffffff12);gap:6px;padding:10px 12px;display:grid}.epic-card-title[data-v-268f3a3f]{align-items:baseline;gap:8px;min-width:0;display:flex}.epic-pill[data-v-268f3a3f],.epic-meta[data-v-268f3a3f],.epic-line[data-v-268f3a3f]{font-family:var(--font-mono,monospace)}.epic-pill[data-v-268f3a3f]{border:.5px solid;padding:1px 8px;font-size:10px}.epic-project[data-v-268f3a3f]{font-family:var(--font-mono,monospace);color:var(--accent-blue,#1d55a6);cursor:pointer;font-size:11px;font:inherit;font-family:var(--font-mono,monospace);background:0 0;border:.5px solid;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-project[data-v-268f3a3f]:hover{background:var(--bg-2,#0e1014)}.epic-project.active[data-v-268f3a3f]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);border-color:var(--fg,#fffffff0)}.epic-owner+.epic-project[data-v-268f3a3f]{margin-left:4px}.epic-project .project-glyph[data-v-268f3a3f]{font-size:10px}.epic-owner[data-v-268f3a3f]{font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);cursor:pointer;font-size:11px;font:inherit;font-family:var(--font-mono,monospace);background:0 0;border:1px dashed;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-owner[data-v-268f3a3f]:hover{background:var(--bg-2,#0e1014)}.epic-owner.active[data-v-268f3a3f]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);border-style:solid;border-color:var(--fg,#fffffff0)}.epic-owner.active .owner-glyph[data-v-268f3a3f]{color:inherit}.epic-owner .owner-glyph[data-v-268f3a3f]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.epic-owner[data-author-kind=agent][data-v-268f3a3f]{color:#6b3fa0}.epic-owner[data-author-kind=bot][data-v-268f3a3f]{color:var(--accent-blue,#1d55a6)}.epic-owner[data-author-kind=credential][data-v-268f3a3f]{color:var(--accent-yellow,#c89300)}.epic-owner[data-author-kind=team][data-v-268f3a3f]{color:var(--accent-teal,#087f6f)}.epic-state-good[data-v-268f3a3f]{color:var(--ok,#5dc879)}@supports (color:lab(0% 0 0)){.epic-state-good[data-v-268f3a3f]{color:var(--ok,lab(72.9029% -45.1402 29.5956))}}.epic-state-warn[data-v-268f3a3f]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.epic-state-warn[data-v-268f3a3f]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}.epic-state-muted[data-v-268f3a3f],.epic-meta[data-v-268f3a3f],.muted[data-v-268f3a3f]{color:var(--fg-3,#ffffff85)}.epic-title-link[data-v-268f3a3f]{min-width:0;color:inherit;font-family:var(--font-serif,system-ui);overflow-wrap:anywhere;font-weight:600}.epic-meta[data-v-268f3a3f]{flex-wrap:wrap;gap:8px;font-size:11px;display:flex}.epic-line[data-v-268f3a3f]{margin:4px 0;font-size:12px}.warn[data-v-268f3a3f]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-268f3a3f]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}", ju = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, Mu = /* @__PURE__ */ ju(ku, [["styles", [Au]], ["__scopeId", "data-v-268f3a3f"]]);
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/issue-rows.ts
function Nu(e, t = "") {
	return typeof e == "string" ? e : t;
}
function Pu(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Fu(e) {
	let t = typeof e == "string" ? e.toUpperCase() : "";
	return t === "CLOSED" ? "CLOSED" : t === "REOPENED" ? "REOPENED" : "OPEN";
}
function Iu(e) {
	return typeof e == "string" ? e.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/[^/]+)?$/)?.[1] ?? null : null;
}
async function Lu(e) {
	let t = await X("ext_issues", "issues", "by-ref-issue", e);
	if (!t.ok || !t.value || typeof t.value != "object") return null;
	let n = t.value, r = Pu(n.number), i = Iu(n.repository), a = r !== null && i ? zo("issues", `/${i}/${r}`) : null;
	return {
		ref: e,
		id: Nu(n.id),
		number: r,
		title: Nu(n.title, "(untitled)"),
		state: Fu(n.state),
		projectName: typeof n.projectName == "string" ? n.projectName : null,
		labels: Array.isArray(n.labels) ? n.labels.filter((e) => typeof e == "string") : [],
		authorRef: typeof n.authorRef == "string" ? n.authorRef : null,
		href: a
	};
}
async function Ru(e) {
	return (await Promise.all(e.map((e) => Lu(e)))).filter((e) => e !== null);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/epic-detail-styles.ts
var zu = "ext-epics-detail-styles", Bu = "\n.epic-detail {\n  max-width: 880px;\n  display: grid;\n  gap: 24px;\n  padding: 24px 0 48px;\n  font-family: var(--serif, \"Bitter\", Georgia, ui-serif, serif);\n}\n\n.epic-detail .epic-line,\n.epic-detail .epic-meta,\n.epic-detail .epic-progress,\n.epic-detail .epic-issues-list,\n.epic-detail .epic-actions,\n.epic-detail .epic-actions-heading,\n.epic-detail .epic-kbd-hint,\n.epic-detail .epic-section-count {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n}\n\n.epic-header { display: grid; gap: 6px; }\n\n.epic-overline {\n  margin: 0;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 10px;\n  letter-spacing: 0.18em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-title {\n  margin: 0;\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-weight: 600;\n  font-size: 28px;\n  letter-spacing: -0.01em;\n  line-height: 1.15;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  align-items: center;\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-pill {\n  padding: 1px 8px;\n  border: 1px solid currentColor;\n  text-transform: lowercase;\n}\n\n.epic-state-good { color: var(--ink-go, #087f6f); }\n.epic-state-warn { color: var(--ink-warn, #c2410c); }\n.epic-state-muted, .muted { color: var(--ink-faint, #888); }\n.epic-line.warn { color: var(--ink-warn, #c2410c); }\n\n.epic-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 1px 7px;\n  border-radius: 2px;\n  font-size: 11px;\n  line-height: 16px;\n  white-space: nowrap;\n}\n\n.epic-chip .chip-glyph {\n  font-size: 10px;\n}\n\n.epic-chip.tone-blue {\n  background: var(--chip-blue-bg, #e5edf7);\n  color: var(--chip-blue-ink, #1f3b6a);\n}\n.epic-chip.tone-teal {\n  background: var(--chip-teal-bg, #d8f0eb);\n  color: var(--chip-teal-ink, #0c5f54);\n}\n.epic-chip.tone-grey {\n  background: var(--chip-grey-bg, #ececea);\n  color: var(--chip-grey-ink, #4a4a45);\n}\n.epic-chip.compact {\n  padding: 0 6px;\n  font-size: 10.5px;\n}\n\n.epic-meta-time {\n  margin-left: auto;\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n/* \"Routed to\" panel — CUE Project ownership surfaced on the\n * detail page. Same paper-card aesthetic as the progress\n * panel above; owner chips carry classifier-glyph borders\n * so the visual vocabulary matches IssueDetail iter 59. */\n.epic-routed {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-routed-head {\n  display: flex;\n  align-items: baseline;\n  gap: 10px;\n}\n\n.epic-routed-label {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-project {\n  margin-left: auto;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  color: var(--accent-blue, #1d55a6);\n  text-decoration: none;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-project:hover {\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n\n/* iter 69 — inline Project picker on EpicDetail. Mirrors the\n * iter 68 IssueDetail select styling so both detail surfaces\n * read identically. */\n.epic-project-select {\n  width: 100%;\n  border: 1.5px solid var(--ink-rule, #d8d6cf);\n  background: var(--paper, #fffdf8);\n  color: var(--ink, #111);\n  padding: 8px 10px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 13px;\n  outline: none;\n  transition: border-color 120ms ease;\n}\n\n.epic-project-select:focus {\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-project-select:disabled {\n  cursor: wait;\n  opacity: 0.55;\n}\n\n.epic-routed-list {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-routed-owner {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 2px 8px;\n  border: 1px solid currentColor;\n  color: var(--ink, #111);\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-owner .chip-glyph {\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-size: 12px;\n  line-height: 1;\n}\n\n.epic-routed-owner[data-author-kind=\"team\"]       { color: var(--accent-teal, #087f6f); }\n.epic-routed-owner[data-author-kind=\"human\"]      { color: var(--ink, #111); }\n.epic-routed-owner[data-author-kind=\"agent\"]      { color: #6b3fa0; }\n.epic-routed-owner[data-author-kind=\"bot\"]        { color: var(--accent-blue, #1d55a6); }\n.epic-routed-owner[data-author-kind=\"credential\"] { color: var(--accent-yellow, #c89300); }\n\n.epic-routed-source {\n  margin: 0;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-source code {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  padding: 0 4px;\n  background: var(--paper-tint, #f2efe7);\n  color: var(--ink-soft, #2c2b28);\n}\n\n.epic-progress-head {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  align-items: baseline;\n  font-size: 12px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-progress-stat {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 4px;\n}\n\n.epic-progress-stat strong {\n  font-weight: 600;\n  color: var(--ink, #1a1a1a);\n  font-size: 15px;\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-progress-stat .stat-of {\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress-stat .stat-label {\n  color: var(--ink-faint, #6e6a62);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-progress-sep {\n  color: var(--ink-rule, #c8c6bf);\n  padding: 0 2px;\n}\n\n.epic-progress-bar {\n  height: 4px;\n  background: var(--ink-rule-soft, #ebe9e2);\n  border-radius: 2px;\n  overflow: hidden;\n}\n\n.epic-progress-fill {\n  height: 100%;\n  background: var(--ink-go, #087f6f);\n  transition: width 200ms ease;\n}\n\n.epic-body {\n  margin: 0;\n  font-size: 15.5px;\n  line-height: 1.6;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-body.muted {\n  padding: 12px 14px;\n  border: 1px dashed var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  color: var(--ink-faint, #888);\n  font-size: 12px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n}\n\n.epic-body.prose h1,\n.epic-body.prose h2,\n.epic-body.prose h3,\n.epic-body.prose h4 {\n  margin: 16px 0 6px;\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-weight: 600;\n  line-height: 1.2;\n  letter-spacing: -0.005em;\n}\n\n.epic-body.prose h1 { font-size: 20px; }\n.epic-body.prose h2 { font-size: 17px; }\n.epic-body.prose h3 { font-size: 15px; }\n\n.epic-body.prose p {\n  margin: 8px 0;\n}\n\n.epic-body.prose ul {\n  margin: 6px 0 6px 20px;\n  padding: 0;\n}\n\n.epic-body.prose li {\n  margin: 2px 0;\n}\n\n.epic-body.prose code {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  background: var(--ink-rule-soft, #efeee8);\n  padding: 0 4px;\n  border-radius: 2px;\n  font-size: 0.9em;\n}\n\n.epic-body.prose pre {\n  background: var(--surface-2, #f7f6f1);\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  padding: 10px 12px;\n  overflow-x: auto;\n  font-size: 12.5px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n}\n\n.epic-body.prose pre code {\n  background: transparent;\n  padding: 0;\n}\n\n.epic-section { display: grid; gap: 8px; }\n\n.epic-section-head {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding-bottom: 6px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-section h3 {\n  margin: 0;\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-weight: 600;\n  font-size: 13px;\n  letter-spacing: -0.005em;\n}\n\n.epic-section-count {\n  margin-left: auto;\n  font-size: 11px;\n  color: var(--ink-faint, #888);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-section-count [data-zero=\"true\"] { color: var(--ink-rule, #c8c6bf); }\n.epic-section-count .sep { padding: 0 2px; color: var(--ink-rule, #c8c6bf); }\n\n.epic-issues-list {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n}\n\n.epic-issue-row {\n  display: grid;\n  grid-template-columns: 18px 56px 1fr auto;\n  align-items: center;\n  gap: 10px;\n  padding: 6px 8px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n  font-size: 12.5px;\n  cursor: pointer;\n  outline: none;\n}\n\n.epic-issue-row:last-child { border-bottom: none; }\n\n.epic-issue-row:hover,\n.epic-issue-row.focused,\n.epic-issue-row:focus {\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-issue-row .row-state {\n  text-align: center;\n  font-size: 11px;\n}\n\n.epic-issue-row .row-state[data-state=\"OPEN\"],\n.epic-issue-row .row-state[data-state=\"REOPENED\"] {\n  color: var(--ink-go, #087f6f);\n}\n.epic-issue-row .row-state[data-state=\"CLOSED\"] {\n  color: var(--ink-faint, #888);\n}\n\n.epic-issue-row.state-closed {\n  color: var(--ink-faint, #888);\n}\n.epic-issue-row.state-closed .row-title {\n  text-decoration: line-through;\n  text-decoration-color: var(--ink-rule, #c8c6bf);\n}\n\n.epic-issue-row .row-number {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-issue-row .row-title {\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-size: 13px;\n  color: var(--ink, #1a1a1a);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.epic-issue-row .row-trailing {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: nowrap;\n}\n\n.row-author {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.row-author[data-author-kind=\"agent\"] { color: var(--ink-go, #087f6f); }\n.row-author[data-author-kind=\"credential\"],\n.row-author[data-author-kind=\"bot\"] { color: var(--ink-warn, #c2410c); }\n\n.epic-kbd-hint {\n  margin: 0;\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.epic-kbd-hint kbd {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 10px;\n  padding: 0 4px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-actions-section {\n  display: grid;\n  gap: 8px;\n  padding-top: 12px;\n  border-top: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-actions-heading {\n  margin: 0;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 10.5px;\n  letter-spacing: 0.16em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n  font-weight: 500;\n}\n\n.epic-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-actions button {\n  padding: 4px 12px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n  color: var(--ink, #1a1a1a);\n  cursor: pointer;\n  letter-spacing: 0.01em;\n}\n\n.epic-actions button:hover:not(:disabled) {\n  background: var(--ink, #1a1a1a);\n  color: var(--surface, #ffffff);\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-actions button:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n\n.epic-comments {\n  display: grid;\n  gap: 8px;\n}\n\n.epic-comments-head {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  gap: 12px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 4px;\n}\n\n.epic-comments-head h2 {\n  margin: 0;\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-size: 18px;\n}\n\n.epic-comments-count {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 13px;\n  color: var(--ink-faint, #68645c);\n  font-weight: normal;\n}\n";
function Vu() {
	if (typeof document > "u" || document.getElementById(zu)) return;
	let e = document.createElement("style");
	e.id = zu, e.textContent = Bu, document.head.appendChild(e);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/CustomElementHost.vue
var Hu = /* @__PURE__ */ ju(/* @__PURE__ */ zn({
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
		return (e, t) => (W(), G("span", {
			ref_key: "mount",
			ref: n,
			class: "custom-element-host"
		}, null, 512));
	}
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]);
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/project-policy.ts
async function Uu(e) {
	return { ownerRefs: await Tl(e) };
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicDetail.vue?vue&type=script&setup=true&lang.ts
var Wu = ["data-state", "data-epic-id"], Gu = {
	key: 0,
	class: "epic-line muted"
}, Ku = {
	key: 1,
	class: "epic-line warn"
}, qu = {
	key: 2,
	class: "epic-line warn"
}, Ju = { class: "epic-header" }, Yu = { class: "epic-title" }, Xu = { class: "epic-meta" }, Zu = ["title"], Qu = {
	key: 1,
	class: "epic-chip tone-grey",
	title: "Owner"
}, $u = {
	key: 2,
	class: "epic-chip tone-grey"
}, ed = {
	key: 3,
	class: "epic-meta-time"
}, td = {
	key: 0,
	class: "epic-progress",
	"data-smoke": "epic-progress"
}, nd = { class: "epic-progress-head" }, rd = { class: "epic-progress-stat" }, id = { class: "stat-of" }, ad = { class: "epic-progress-stat" }, od = {
	key: 0,
	class: "epic-progress-sep"
}, sd = {
	key: 1,
	class: "epic-progress-stat"
}, cd = ["aria-valuenow"], ld = {
	class: "epic-routed",
	"data-smoke": "epic-project-picker"
}, ud = { class: "epic-routed-head" }, dd = ["href", "title"], fd = ["value", "disabled"], pd = ["value"], md = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, hd = {
	key: 1,
	class: "epic-routed",
	"data-smoke": "epic-project-owners"
}, gd = { class: "epic-routed-head" }, _d = ["href", "title"], vd = { class: "epic-routed-list" }, yd = ["data-author-kind", "title"], bd = { class: "chip-glyph" }, xd = { class: "epic-routed-source" }, Sd = ["data-epic-id", "innerHTML"], Cd = {
	key: 3,
	class: "epic-body muted"
}, wd = {
	class: "epic-section",
	"data-smoke": "epic-issues"
}, Td = { class: "epic-section-head" }, Ed = { class: "epic-section-count" }, Dd = ["data-zero"], Od = ["data-zero"], kd = {
	key: 0,
	class: "epic-line muted"
}, Ad = {
	key: 1,
	class: "epic-issues-list",
	"data-smoke": "epic-issues-list"
}, jd = [
	"onClick",
	"onKeydown",
	"onFocus"
], Md = ["data-state"], Nd = { key: 0 }, Pd = { key: 1 }, Fd = { class: "row-number" }, Id = { class: "row-title" }, Ld = { class: "row-trailing" }, Rd = ["title"], zd = ["data-author-kind", "title"], Bd = { class: "author-glyph" }, Vd = {
	key: 2,
	class: "epic-kbd-hint muted"
}, Hd = { class: "epic-actions-section" }, Ud = { class: "epic-actions" }, Wd = ["disabled", "onClick"], Gd = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, Kd = { class: "epic-comments-head" }, qd = {
	key: 0,
	class: "epic-comments-count"
}, Jd = /* @__PURE__ */ zn({
	__name: "EpicDetail",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epic: { type: null },
		workspaceId: { type: String },
		id: { type: String },
		routeParams: { type: null },
		labelCatalog: { type: null }
	},
	setup(e) {
		let t = e, n = [
			"PLANNED",
			"IN_PROGRESS",
			"DONE",
			"CANCELED"
		], r = /* @__PURE__ */ z("idle"), i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(null), s = /* @__PURE__ */ z(t.epic ?? null), c = /* @__PURE__ */ z(null), l = /* @__PURE__ */ z([]), u = /* @__PURE__ */ z(null), d = Y(() => t.client ?? t.comtryaClient), f = Y(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? ru()), p = Y(() => t.id ?? t.routeParams?.params?.id ?? ""), m = Y(() => t.epic ? au(t.epic) : `comtrya://epic/${p.value}`), h = Y(() => s.value ?? t.epic ?? null), g = Y(() => cu(h.value?.state)), _ = Y(() => n.filter((e) => e !== h.value?.state)), v = Y(() => (c.value?.issuesOpen ?? 0) + (c.value?.issuesClosed ?? 0)), y = Y(() => Math.max(0, Math.min(100, c.value?.percentComplete ?? 0))), b = Y(() => l.value.filter((e) => e.state !== "CLOSED").length), x = Y(() => l.value.filter((e) => e.state === "CLOSED").length), S = Y(() => ol(h.value?.bodyMarkdown ?? "", { workspaceId: f.value })), C = Y(() => d.value && !!p.value), w = Y(() => {
			let e = h.value?.ownerRef;
			return e ? e.startsWith("comtrya://user/") ? e.slice(15) : e.startsWith("comtrya://agent/") ? `${e.slice(16)} (agent)` : e : null;
		}), ee = Y(() => de(h.value?.createdAt)), te = /* @__PURE__ */ z(null);
		function ne(e) {
			let t = e.detail;
			t && typeof t.count == "number" && (te.value = t.count);
		}
		let T = /* @__PURE__ */ z(null), re = Y(() => T.value?.ownerRefs ?? []);
		V(() => h.value?.projectName ?? "", async (e) => {
			if (!e) {
				T.value = null;
				return;
			}
			try {
				T.value = await Uu(e);
			} catch {
				T.value = null;
			}
		}, { immediate: !0 });
		let E = xl, D = /* @__PURE__ */ z([]), ie = /* @__PURE__ */ z("idle"), O = /* @__PURE__ */ z(null);
		er(async () => {
			try {
				D.value = await wl();
			} catch {
				D.value = [];
			}
		});
		async function ae(e) {
			let t = e.target;
			if (!t || !h.value) return;
			let n = h.value, r = t.value || null;
			if ((n.projectName ?? null) === r) return;
			ie.value = "submitting", O.value = null;
			let i = n.projectName ?? null;
			s.value = {
				...n,
				projectName: r
			};
			try {
				s.value = await Ql(n.id, r);
			} catch (e) {
				s.value = {
					...n,
					projectName: i
				}, t.value = i ?? "", O.value = e instanceof Error ? e.message : String(e);
			} finally {
				ie.value = "idle";
			}
		}
		er(() => {
			Vu(), oe();
		});
		let k = (e) => {
			if (l.value.length === 0) return;
			let t = u.value === null ? 0 : Math.max(0, Math.min(l.value.length - 1, u.value + e));
			u.value = t, pn(() => ue(t));
		};
		vs({
			j: (e) => {
				e.preventDefault(), k(1);
			},
			ArrowDown: (e) => {
				e.preventDefault(), k(1);
			},
			k: (e) => {
				e.preventDefault(), k(-1);
			},
			ArrowUp: (e) => {
				e.preventDefault(), k(-1);
			},
			Enter: (e) => {
				if (u.value === null) return;
				let t = l.value[u.value];
				t && (e.preventDefault(), le(t));
			}
		}), V(() => [
			d.value,
			t.epic,
			f.value,
			p.value
		], () => void oe());
		async function oe() {
			if (t.epic) {
				s.value = t.epic, r.value = "ready", a.value = null, await se();
				return;
			}
			if (!C.value || !d.value) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = "epic-detail: missing params";
				return;
			}
			r.value = "loading", a.value = null;
			try {
				s.value = await Wl(d.value, m.value), r.value = s.value ? "ready" : "empty", await se();
			} catch (e) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function se() {
			if (!d.value || !h.value) {
				c.value = null, l.value = [];
				return;
			}
			let e = au(h.value), [t, n] = await Promise.allSettled([Jl(d.value, e), Yl(d.value, e)]);
			c.value = t.status === "fulfilled" ? t.value : null, l.value = await Ru(n.status === "fulfilled" ? n.value : []), l.value.sort((e, t) => {
				let n = e.state !== "CLOSED";
				return n === (t.state !== "CLOSED") ? (t.number ?? 0) - (e.number ?? 0) : n ? -1 : 1;
			});
		}
		async function A(e) {
			if (!(!d.value || !h.value)) {
				i.value = "submitting", o.value = null;
				try {
					s.value = await Xl(d.value, h.value.id, e), await se();
				} catch (e) {
					o.value = e instanceof Error ? e.message : String(e);
				} finally {
					i.value = "idle";
				}
			}
		}
		function j(e) {
			return e.toLowerCase().replace("_", " ");
		}
		function le(e) {
			e.href && window.location.assign(e.href);
		}
		function ue(e) {
			let t = document.querySelector(".epic-detail [data-smoke=\"epic-issues-list\"]");
			t && t.querySelectorAll(".epic-issue-row")[e]?.focus();
		}
		function de(e) {
			if (!e) return null;
			let t = new Date(e).getTime();
			if (!Number.isFinite(t)) return null;
			let n = Date.now() - t, r = 6e4, i = 60 * r, a = 24 * i;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < 30 * a ? `${Math.floor(n / a)}d ago` : new Date(e).toISOString().slice(0, 10);
		}
		return (t, n) => (W(), G("main", {
			class: "epic-detail",
			"data-state": r.value,
			"data-epic-id": h.value?.id,
			"data-smoke": "epic-detail"
		}, [r.value === "loading" ? (W(), G("p", Gu, "Loading epic")) : r.value === "error" ? (W(), G("p", Ku, N(a.value), 1)) : h.value ? (W(), G(U, { key: 3 }, [
			K("header", Ju, [
				n[2] ||= K("p", { class: "epic-overline" }, "epic", -1),
				K("h1", Yu, N(h.value.title), 1),
				K("div", Xu, [
					K("span", { class: M(["epic-pill", g.value.className]) }, N(g.value.label), 3),
					h.value.projectName ? (W(), G("span", {
						key: 0,
						class: "epic-chip tone-blue",
						title: `Scoped to project ${h.value.projectName}`
					}, [n[0] ||= K("span", { class: "chip-glyph" }, "◇", -1), q(N(h.value.projectName), 1)], 8, Zu)) : J("", !0),
					(W(!0), G(U, null, H(h.value.labels, (t) => (W(), Mi(B(Al), {
						key: t,
						name: t,
						catalog: e.labelCatalog
					}, null, 8, ["name", "catalog"]))), 128)),
					w.value ? (W(), G("span", Qu, [n[1] ||= K("span", { class: "chip-glyph" }, "@", -1), q(N(w.value), 1)])) : J("", !0),
					h.value.targetDate ? (W(), G("span", $u, " target " + N(h.value.targetDate), 1)) : J("", !0),
					ee.value ? (W(), G("span", ed, "opened " + N(ee.value), 1)) : J("", !0)
				])
			]),
			c.value || l.value.length > 0 ? (W(), G("section", td, [K("div", nd, [
				K("span", rd, [
					K("strong", null, N(c.value?.issuesClosed ?? x.value), 1),
					K("span", id, "/ " + N(v.value || l.value.length), 1),
					n[3] ||= K("span", { class: "stat-label" }, "closed", -1)
				]),
				n[6] ||= K("span", { class: "epic-progress-sep" }, "·", -1),
				K("span", ad, [K("strong", null, N(y.value), 1), n[4] ||= K("span", { class: "stat-label" }, "% complete", -1)]),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (W(), G("span", od, "·")) : J("", !0),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (W(), G("span", sd, [K("strong", null, N(c.value?.childEpicsOpen ?? 0), 1), n[5] ||= K("span", { class: "stat-label" }, "child epics open", -1)])) : J("", !0)
			]), K("div", {
				class: "epic-progress-bar",
				"aria-valuenow": y.value,
				"aria-valuemin": "0",
				"aria-valuemax": "100"
			}, [K("div", {
				class: "epic-progress-fill",
				style: ce({ width: y.value + "%" })
			}, null, 4)], 8, cd)])) : J("", !0),
			K("section", ld, [
				K("header", ud, [n[7] ||= K("span", { class: "epic-routed-label" }, "Project", -1), h.value.projectName ? (W(), G("a", {
					key: 0,
					href: `/x/epics/?project=${encodeURIComponent(h.value.projectName)}`,
					class: "epic-routed-project",
					title: `Filter epics to project ${h.value.projectName}`
				}, "◇ " + N(h.value.projectName), 9, dd)) : J("", !0)]),
				K("select", {
					class: "epic-project-select",
					"data-smoke": "epic-project-select",
					value: h.value.projectName ?? "",
					disabled: ie.value === "submitting",
					onChange: ae
				}, [n[8] ||= K("option", { value: "" }, "— no project —", -1), (W(!0), G(U, null, H(D.value, (e) => (W(), G("option", {
					key: e.name,
					value: e.name ?? ""
				}, N(e.name), 9, pd))), 128))], 40, fd),
				O.value ? (W(), G("p", md, N(O.value), 1)) : J("", !0),
				n[9] ||= K("p", { class: "epic-routed-source" }, [
					q(" Stamps "),
					K("code", null, "projectName"),
					q(" on this epic. Lights up workspace per-Project counts. ")
				], -1)
			]),
			h.value.projectName && re.value.length > 0 ? (W(), G("section", hd, [
				K("header", gd, [n[10] ||= K("span", { class: "epic-routed-label" }, "Routed to", -1), K("a", {
					href: `/x/epics/?project=${encodeURIComponent(h.value.projectName)}`,
					class: "epic-routed-project",
					title: `Filter epics to project ${h.value.projectName}`
				}, "◇ " + N(h.value.projectName), 9, _d)]),
				K("ul", vd, [(W(!0), G(U, null, H(re.value, (e) => (W(), G("li", {
					key: e,
					class: "epic-routed-owner",
					"data-author-kind": B(E)(e).kind,
					title: e
				}, [K("span", bd, N(B(E)(e).glyph), 1), q(" " + N(B(E)(e).label), 1)], 8, yd))), 128))]),
				K("p", xd, [
					n[11] ||= q(" From ", -1),
					n[12] ||= K("code", null, "package comtrya", -1),
					q(" · projects." + N(h.value.projectName) + ".owners ", 1)
				])
			])) : J("", !0),
			S.value ? (W(), G("article", {
				key: 2,
				class: "epic-body prose",
				"data-epic-id": h.value.id,
				"data-smoke": "epic-detail-main",
				innerHTML: S.value
			}, null, 8, Sd)) : (W(), G("p", Cd, "No description yet.")),
			K("section", wd, [
				K("header", Td, [n[16] ||= K("h3", null, "Issues in this epic", -1), K("span", Ed, [
					K("span", { "data-zero": b.value === 0 }, N(b.value), 9, Dd),
					n[13] ||= q(" open ", -1),
					n[14] ||= K("span", { class: "sep" }, "·", -1),
					K("span", { "data-zero": x.value === 0 }, N(x.value), 9, Od),
					n[15] ||= q(" closed ", -1)
				])]),
				l.value.length === 0 ? (W(), G("p", kd, " No issues linked yet. Link issues via the issue's \"part of epic\" relation. ")) : (W(), G("ul", Ad, [(W(!0), G(U, null, H(l.value, (e, t) => (W(), G("li", {
					key: e.ref,
					class: M(["epic-issue-row", [`state-${e.state.toLowerCase()}`, { focused: u.value === t }]]),
					tabindex: "0",
					onClick: (t) => le(e),
					onKeydown: [_o(ho((t) => le(e), ["prevent"]), ["enter"]), _o(ho((t) => le(e), ["prevent"]), ["space"])],
					onFocus: (e) => u.value = t
				}, [
					K("span", {
						class: "row-state",
						"data-state": e.state
					}, [e.state === "CLOSED" ? (W(), G("span", Nd, "●")) : (W(), G("span", Pd, "○"))], 8, Md),
					K("span", Fd, "#" + N(e.number ?? "—"), 1),
					K("span", Id, N(e.title), 1),
					K("span", Ld, [
						e.projectName ? (W(), G("span", {
							key: 0,
							class: "epic-chip tone-blue compact",
							title: e.projectName
						}, [n[17] ||= K("span", { class: "chip-glyph" }, "◇", -1), q(N(e.projectName), 1)], 8, Rd)) : J("", !0),
						(W(!0), G(U, null, H(e.labels, (e) => (W(), Mi(B(Al), {
							key: e,
							name: e
						}, null, 8, ["name"]))), 128)),
						e.authorRef ? (W(), G("span", {
							key: 1,
							class: "row-author",
							"data-author-kind": B(xl)(e.authorRef).kind,
							title: e.authorRef
						}, [K("span", Bd, N(B(xl)(e.authorRef).glyph), 1), q(" " + N(B(xl)(e.authorRef).label), 1)], 8, zd)) : J("", !0)
					])
				], 42, jd))), 128))])),
				l.value.length > 0 ? (W(), G("p", Vd, [...n[18] ||= [
					K("kbd", null, "j", -1),
					q(" / ", -1),
					K("kbd", null, "k", -1),
					q(" move · ", -1),
					K("kbd", null, "↵", -1),
					q(" open ", -1)
				]])) : J("", !0)
			]),
			K("section", Hd, [
				n[19] ||= K("h3", { class: "epic-actions-heading" }, "Change state", -1),
				K("div", Ud, [(W(!0), G(U, null, H(_.value, (e) => (W(), G("button", {
					key: e,
					type: "button",
					disabled: i.value === "submitting",
					onClick: (t) => A(e)
				}, " mark " + N(j(e)), 9, Wd))), 128))]),
				o.value ? (W(), G("p", Gd, N(o.value), 1)) : J("", !0)
			]),
			K("section", {
				class: "epic-comments",
				onCommentThreadUpdate: ne
			}, [K("header", Kd, [K("h2", null, [n[20] ||= q(" Discussion", -1), te.value === null ? J("", !0) : (W(), G("span", qd, " (" + N(te.value) + ")", 1))])]), Li(Hu, {
				tag: "comtrya-comment-thread",
				attributes: { target: B(au)(h.value) },
				properties: {
					target: B(au)(h.value),
					comtryaClient: d.value
				}
			}, null, 8, ["attributes", "properties"])], 32)
		], 64)) : (W(), G("p", qu, " No epic " + N(p.value || "?") + " in " + N(f.value), 1))], 8, Wu));
	}
}), Yd = {
	class: "epics-roadmap",
	"data-smoke": "epics-roadmap-board"
}, Xd = { class: "epics-roadmap-head" }, Zd = { class: "epics-roadmap-title" }, Qd = { class: "epics-roadmap-subtitle" }, $d = ["href"], ef = { class: "epics-roadmap-toolbar" }, tf = {
	class: "epics-roadmap-tabs",
	"aria-label": "Epic roadmap views"
}, nf = [
	"aria-pressed",
	"aria-label",
	"title",
	"onClick"
], rf = { class: "epics-roadmap-search" }, af = {
	key: 0,
	class: "epics-roadmap-status"
}, of = {
	key: 1,
	class: "epics-roadmap-status error",
	role: "alert"
}, sf = {
	key: 2,
	class: "epics-roadmap-status"
}, cf = {
	key: 3,
	class: "epics-roadmap-status"
}, lf = ["data-board", "aria-label"], uf = { class: "epics-roadmap-column-head" }, df = {
	key: 0,
	class: "epics-roadmap-cards"
}, ff = ["onMouseenter"], pf = ["href", "aria-label"], mf = { class: "epics-roadmap-card-head" }, hf = { class: "epic-number" }, gf = { class: "epics-roadmap-card-title" }, _f = {
	key: 0,
	class: "epics-roadmap-card-copy"
}, vf = { class: "epics-roadmap-progress" }, yf = ["aria-label", "aria-valuenow"], bf = { class: "epics-roadmap-card-meta" }, xf = {
	key: 0,
	class: "epic-age"
}, Sf = {
	key: 1,
	class: "epic-age"
}, Cf = {
	key: 1,
	class: "epics-roadmap-card-tags"
}, wf = {
	key: 1,
	class: "epics-roadmap-empty"
}, Tf = /* @__PURE__ */ ju(/* @__PURE__ */ zn({
	__name: "EpicRoadmapBoard",
	props: {
		workspaceId: {
			default: ru(),
			type: String
		},
		repositoryId: {
			default: null,
			type: [String, null]
		},
		repositorySegments: { type: Array },
		routeParams: { type: null },
		labelCatalog: {
			default: null,
			type: null
		}
	},
	setup(e) {
		let t = e, n = [
			{
				id: "roadmap",
				label: "Roadmap",
				hint: "state lanes"
			},
			{
				id: "project",
				label: "Projects",
				hint: "CUE project lanes"
			},
			{
				id: "owner",
				label: "Owners",
				hint: "owner lanes"
			},
			{
				id: "priority",
				label: "Priority",
				hint: "priority labels"
			},
			{
				id: "milestone",
				label: "Milestones",
				hint: "release labels"
			},
			{
				id: "label",
				label: "Labels",
				hint: "label lanes"
			},
			{
				id: "target",
				label: "Targets",
				hint: "target date health"
			}
		], r = [
			"is",
			"owner",
			"project",
			"label",
			"priority",
			"milestone",
			"target"
		], i = {
			planned: "PLANNED",
			"in-progress": "IN_PROGRESS",
			in_progress: "IN_PROGRESS",
			inprogress: "IN_PROGRESS",
			"at-risk": "AT_RISK",
			at_risk: "AT_RISK",
			atrisk: "AT_RISK",
			done: "DONE",
			closed: "DONE",
			canceled: "CANCELED",
			cancelled: "CANCELED"
		}, a = /* @__PURE__ */ z("idle"), o = /* @__PURE__ */ z(null), s = /* @__PURE__ */ z("roadmap"), c = /* @__PURE__ */ z(""), l = /* @__PURE__ */ z(C()), u = /* @__PURE__ */ z(null), d = Y(() => t.workspaceId || t.routeParams?.params?.workspaceId || ru()), f = Y(() => l.value[s.value]), p = Y(() => cl(c.value, r)), m = Y(() => c.value.trim().length > 0), h = Y(() => {
			let e = f.value;
			if (!e || !m.value) return e;
			let t = e.columns.map((e) => {
				let t = e.cards.filter(D);
				return {
					...e,
					count: t.length,
					cards: t
				};
			});
			return {
				...e,
				total: t.reduce((e, t) => e + t.cards.length, 0),
				columns: t
			};
		}), g = Y(() => h.value?.total ?? 0), _ = Y(() => f.value?.total ?? 0), v = Y(() => n.find((e) => e.id === s.value)?.label ?? "Roadmap"), y = Y(() => {
			let e = vl(iu, "/new", { repositorySegments: t.repositorySegments }), n = new URLSearchParams({ workspaceId: d.value });
			return t.repositoryId && n.set("repositoryId", t.repositoryId), `${e}?${n.toString()}`;
		}), b = (e) => vl(iu, `/${e.workspaceId}/${e.id}`, { repositorySegments: t.repositorySegments }), x = Y(() => {
			let e = [];
			for (let t of h.value?.columns ?? []) for (let n of t.cards) e.includes(n.epic.id) || e.push(n.epic.id);
			return e;
		}), S = Y(() => {
			let e = u.value;
			if (!e) return null;
			for (let t of h.value?.columns ?? []) {
				let n = t.cards.find((t) => t.epic.id === e);
				if (n) return n;
			}
			return null;
		});
		er(() => {
			se(), window.addEventListener("popstate", j), w();
		}), ir(() => {
			window.removeEventListener("popstate", j);
		}), V(d, () => void w()), V(s, () => {
			u.value = x.value[0] ?? null;
		}), V(x, (e) => {
			e.includes(u.value ?? "") || (u.value = e[0] ?? null);
		}), V(c, () => A()), vs({
			h: (e) => {
				e.preventDefault(), T(-1);
			},
			ArrowLeft: (e) => {
				e.preventDefault(), T(-1);
			},
			l: (e) => {
				e.preventDefault(), T(1);
			},
			ArrowRight: (e) => {
				e.preventDefault(), T(1);
			},
			j: (e) => {
				e.preventDefault(), re(1);
			},
			ArrowDown: (e) => {
				e.preventDefault(), re(1);
			},
			k: (e) => {
				e.preventDefault(), re(-1);
			},
			ArrowUp: (e) => {
				e.preventDefault(), re(-1);
			},
			Enter: (e) => {
				let t = S.value?.epic;
				t && (e.preventDefault(), window.location.href = b(t));
			}
		});
		function C() {
			return {
				roadmap: null,
				project: null,
				owner: null,
				priority: null,
				milestone: null,
				label: null,
				target: null
			};
		}
		async function w() {
			a.value = "loading", o.value = null;
			try {
				let e = {
					workspaceId: d.value,
					limit: 128
				}, [t, n, r, i, o, s, c] = await Promise.all([
					Kl("roadmap", e),
					Kl("project", e),
					Kl("owner", e),
					Kl("priority", e),
					Kl("milestone", e),
					Kl("label", e),
					Kl("target", e)
				]);
				l.value = {
					roadmap: t,
					project: n,
					owner: r,
					priority: i,
					milestone: o,
					label: s,
					target: c
				}, a.value = "ready", u.value = x.value[0] ?? null;
			} catch (e) {
				l.value = C(), u.value = null, a.value = "error", o.value = e instanceof Error ? e.message : String(e);
			}
		}
		function ee(e) {
			return l.value[e]?.total ?? 0;
		}
		function te(e) {
			s.value = e;
		}
		function ne() {
			c.value = "";
		}
		function T(e) {
			let t = n.findIndex((e) => e.id === s.value);
			s.value = n[Math.max(0, Math.min(n.length - 1, t + e))]?.id ?? s.value;
		}
		function re(e) {
			let t = x.value;
			if (t.length === 0) return;
			let n = u.value ? t.indexOf(u.value) : -1;
			u.value = t[Math.max(0, Math.min(t.length - 1, n + e))] ?? null;
		}
		function E(e) {
			let t = [];
			return e.epic.projectName && t.push(`project:${e.epic.projectName}`), (e.ownerRef ?? e.epic.ownerRef) && t.push(le(e.ownerRef ?? e.epic.ownerRef ?? "")), e.priorityLabel && t.push(e.priorityLabel), e.milestoneLabel && t.push(e.milestoneLabel), e.epic.targetDate && t.push(`target:${e.epic.targetDate}`), t;
		}
		function D(e) {
			let t = p.value;
			if (!ie(e.epic.state, t.filters.is ?? []) || !O([e.epic.projectName, e.projectName], t.filters.project ?? []) || !O([
				e.epic.ownerRef,
				e.ownerRef,
				le(e.ownerRef ?? e.epic.ownerRef ?? "")
			], t.filters.owner ?? []) || !ae(e.epic.labels ?? [], t.filters.label ?? []) || !O([e.priority, e.priorityLabel], t.filters.priority ?? []) || !O([e.milestone, e.milestoneLabel], t.filters.milestone ?? []) || !O([e.epic.targetDate], t.filters.target ?? [])) return !1;
			let n = t.text.trim().toLowerCase();
			return !n || k(e).includes(n);
		}
		function ie(e, t) {
			return t.length === 0 ? !0 : t.some((t) => {
				let n = t.toLowerCase(), r = i[n];
				return r ? r === e : e.toLowerCase().includes(n);
			});
		}
		function O(e, t) {
			if (t.length === 0) return !0;
			let n = e.map(oe).filter(Boolean);
			return t.some((e) => n.some((t) => t.includes(oe(e))));
		}
		function ae(e, t) {
			if (t.length === 0) return !0;
			let n = e.map(oe).filter(Boolean);
			return t.every((e) => n.some((t) => t.includes(oe(e))));
		}
		function k(e) {
			return [
				e.epic.number ? `#${e.epic.number}` : "",
				e.epic.title,
				e.epic.bodyMarkdown,
				cu(e.epic.state).label,
				e.epic.projectName,
				e.projectName,
				e.epic.ownerRef,
				e.ownerRef,
				le(e.ownerRef ?? e.epic.ownerRef ?? ""),
				e.priority,
				e.priorityLabel,
				e.milestone,
				e.milestoneLabel,
				e.epic.targetDate,
				...e.epic.labels ?? [],
				...E(e)
			].map(oe).join(" ");
		}
		function oe(e) {
			return String(e ?? "").trim().toLowerCase();
		}
		function se() {
			typeof window > "u" || (c.value = new URLSearchParams(window.location.search).get("q") ?? "");
		}
		function A() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = c.value.trim();
			t ? e.set("q", t) : e.delete("q");
			let n = e.toString(), r = `${window.location.pathname}${n ? `?${n}` : ""}${window.location.hash}`;
			r !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", r);
		}
		function j() {
			se(), pn(() => {
				u.value ||= x.value[0] ?? null;
			});
		}
		function le(e) {
			let t = xl(e);
			return `${t.glyph} ${t.label}`;
		}
		function ue(e) {
			let t = e.progress?.percentComplete ?? 0;
			return Number.isFinite(t) ? Math.max(0, Math.min(100, t)) : 0;
		}
		function de(e) {
			let t = e.progress;
			if (!t) return "0% complete";
			let n = t.issuesClosed ?? 0, r = n + (t.issuesOpen ?? 0);
			return r > 0 ? `${n}/${r} issues · ${ue(e)}%` : `${ue(e)}% complete`;
		}
		function fe(e) {
			if (!e) return "";
			let t = Date.parse(e);
			if (Number.isNaN(t)) return e;
			let n = Math.max(0, Date.now() - t), r = 6e4, i = 60 * r, a = 24 * i, o = 7 * a;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < o ? `${Math.floor(n / a)}d ago` : `${Math.floor(n / o)}w ago`;
		}
		return (t, r) => (W(), G("section", Yd, [
			K("header", Xd, [K("div", Zd, [r[1] ||= K("h2", null, "Epics roadmap", -1), K("span", Qd, [a.value === "loading" ? (W(), G(U, { key: 0 }, [q("loading roadmap...")], 64)) : a.value === "error" ? (W(), G(U, { key: 1 }, [q("roadmap unavailable")], 64)) : m.value ? (W(), G(U, { key: 2 }, [
				q(N(g.value) + " of " + N(_.value) + " epic", 1),
				_.value === 1 ? J("", !0) : (W(), G(U, { key: 0 }, [q("s")], 64)),
				q(" on " + N(v.value.toLowerCase()), 1)
			], 64)) : (W(), G(U, { key: 3 }, [
				q(N(g.value) + " epic", 1),
				g.value === 1 ? J("", !0) : (W(), G(U, { key: 0 }, [q("s")], 64)),
				q(" on " + N(v.value.toLowerCase()), 1)
			], 64))])]), K("a", {
				href: y.value,
				class: "epics-roadmap-new"
			}, "New epic", 8, $d)]),
			K("div", ef, [
				K("nav", tf, [(W(), G(U, null, H(n, (e) => K("button", {
					key: e.id,
					type: "button",
					class: M(["epics-roadmap-tab", { active: s.value === e.id }]),
					"aria-pressed": s.value === e.id,
					"aria-label": `${e.label}: ${ee(e.id)} epics. ${e.hint}`,
					title: e.hint,
					onClick: (t) => te(e.id)
				}, [K("span", null, N(e.label), 1), K("strong", null, N(ee(e.id)), 1)], 10, nf)), 64))]),
				K("label", rf, [En(K("input", {
					"data-epics-roadmap-search": "",
					"onUpdate:modelValue": r[0] ||= (e) => c.value = e,
					type: "search",
					placeholder: "Filter epics: is:planned project:kernel roadmap",
					autocomplete: "off",
					"aria-label": "Filter epics roadmap"
				}, null, 512), [[co, c.value]])]),
				c.value ? (W(), G("button", {
					key: 0,
					type: "button",
					class: "epics-roadmap-clear",
					"aria-label": "Clear roadmap filter",
					onClick: ne
				}, " Clear ")) : J("", !0)
			]),
			a.value === "loading" ? (W(), G("p", af, " Loading roadmap... ")) : a.value === "error" ? (W(), G("p", of, N(o.value), 1)) : f.value && f.value.columns.length === 0 ? (W(), G("p", sf, " No roadmap columns yet. ")) : m.value && h.value && g.value === 0 ? (W(), G("p", cf, " No epics match the current board filter. ")) : h.value ? (W(), G("div", {
				key: 4,
				class: "epics-roadmap-columns",
				"data-board": s.value,
				"aria-label": `${v.value} epic board`,
				tabindex: "0"
			}, [(W(!0), G(U, null, H(h.value.columns, (t) => (W(), G("section", {
				key: t.key,
				class: "epics-roadmap-column"
			}, [K("header", uf, [K("h3", null, N(t.label), 1), K("span", null, N(t.count), 1)]), t.cards.length > 0 ? (W(), G("ol", df, [(W(!0), G(U, null, H(t.cards, (n) => (W(), G("li", {
				key: `${t.key}-${n.epic.id}`,
				class: M(["epics-roadmap-card", { focused: u.value === n.epic.id }]),
				onMouseenter: (e) => u.value = n.epic.id
			}, [K("a", {
				class: "epics-roadmap-card-link",
				href: b(n.epic),
				"aria-label": `Open epic #${n.epic.number ?? n.epic.id.slice(-4)}: ${n.epic.title}`
			}, [
				K("header", mf, [K("span", hf, " #" + N(n.epic.number ?? n.epic.id.slice(-4)), 1), K("span", { class: M(["epic-state", B(cu)(n.epic.state).className]) }, N(B(cu)(n.epic.state).label), 3)]),
				K("strong", gf, N(n.epic.title), 1),
				n.epic.bodyMarkdown ? (W(), G("p", _f, N(B(sl)(n.epic.bodyMarkdown)), 1)) : J("", !0),
				K("div", vf, [K("div", {
					class: "epics-roadmap-progress-bar",
					role: "progressbar",
					"aria-label": de(n),
					"aria-valuenow": ue(n),
					"aria-valuemin": "0",
					"aria-valuemax": "100"
				}, [K("span", { style: ce({ width: ue(n) + "%" }) }, null, 4)], 8, yf), K("span", null, N(de(n)), 1)]),
				K("div", bf, [n.epic.createdAt ? (W(), G("span", xf, " opened " + N(fe(n.epic.createdAt)), 1)) : J("", !0), f.value.today && s.value === "target" ? (W(), G("span", Sf, " today " + N(f.value.today), 1)) : J("", !0)]),
				E(n).length > 0 || (n.epic.labels ?? []).length > 0 ? (W(), G("div", Cf, [(W(!0), G(U, null, H(E(n), (e) => (W(), G("span", {
					key: `${n.epic.id}-${e}`,
					class: "epics-roadmap-badge"
				}, N(e), 1))), 128)), (W(!0), G(U, null, H(n.epic.labels ?? [], (t) => (W(), Mi(B(Al), {
					key: `${n.epic.id}-${t}`,
					name: t,
					catalog: e.labelCatalog
				}, null, 8, ["name", "catalog"]))), 128))])) : J("", !0)
			], 8, pf)], 42, ff))), 128))])) : (W(), G("p", wf, "No epics"))]))), 128))], 8, lf)) : J("", !0),
			r[2] ||= K("footer", { class: "epics-roadmap-foot" }, [K("span", null, [
				K("kbd", null, "h"),
				q("/"),
				K("kbd", null, "l"),
				q(" board · "),
				K("kbd", null, "j"),
				q("/"),
				K("kbd", null, "k"),
				q(" card · "),
				K("kbd", null, "enter"),
				q(" open")
			])], -1)
		]));
	}
}), [["styles", [".epics-roadmap[data-v-7fccd138]{min-width:0;color:var(--fg,#fffffff0);font-family:var(--font-sans,system-ui);gap:14px;display:grid}.epics-roadmap-head[data-v-7fccd138],.epics-roadmap-column-head[data-v-7fccd138],.epics-roadmap-card-head[data-v-7fccd138],.epics-roadmap-card-meta[data-v-7fccd138],.epics-roadmap-card-tags[data-v-7fccd138],.epics-roadmap-foot[data-v-7fccd138]{align-items:center;min-width:0;display:flex}.epics-roadmap-head[data-v-7fccd138]{justify-content:space-between;gap:12px}.epics-roadmap-title[data-v-7fccd138]{gap:4px;min-width:0;display:grid}.epics-roadmap-title h2[data-v-7fccd138]{font-family:var(--font-serif,system-ui);letter-spacing:0;margin:0;font-size:22px;line-height:1.2}.epics-roadmap-subtitle[data-v-7fccd138],.epics-roadmap-status[data-v-7fccd138],.epics-roadmap-empty[data-v-7fccd138],.epics-roadmap-foot[data-v-7fccd138]{color:var(--fg-3,#ffffff85);font-size:12px}.epics-roadmap-new[data-v-7fccd138]{border:.5px solid var(--line-2,#ffffff1f);border-radius:var(--r-sm,6px);min-height:30px;color:var(--fg,#fffffff0);background:var(--surface,#ffffff0a);flex:none;justify-content:center;align-items:center;padding:0 11px;font-size:13px;text-decoration:none;display:inline-flex}.epics-roadmap-tabs[data-v-7fccd138]{flex:460px;gap:6px;min-width:0;padding-bottom:2px;display:flex;overflow-x:auto}.epics-roadmap-toolbar[data-v-7fccd138]{flex-wrap:wrap;align-items:center;gap:8px;min-width:0;display:flex}.epics-roadmap-tab[data-v-7fccd138]{border:.5px solid var(--line,#ffffff14);border-radius:var(--r-sm,6px);min-height:32px;color:var(--fg-2,#ffffffc2);background:var(--surface,#ffffff08);font:inherit;white-space:nowrap;flex:none;align-items:center;gap:8px;padding:0 10px;font-size:12px;display:inline-flex}.epics-roadmap-tab.active[data-v-7fccd138]{border-color:var(--accent,#3b82f6);color:var(--fg,#fffffff0);background:var(--accent-soft,#3b82f624)}.epics-roadmap-tab strong[data-v-7fccd138]{font-family:var(--font-mono,monospace);font-size:11px;font-weight:600}.epics-roadmap-search[data-v-7fccd138]{border:.5px solid var(--line,#ffffff14);border-radius:var(--r-sm,6px);background:var(--bg,#0a0b0e);flex:280px;align-items:center;min-width:220px;padding:0 10px;display:inline-flex}.epics-roadmap-search input[data-v-7fccd138]{width:100%;min-width:0;color:inherit;font-family:var(--font-mono,monospace);background:0 0;border:0;outline:none;padding:8px 0;font-size:12px}.epics-roadmap-search input[data-v-7fccd138]::placeholder{color:var(--fg-3,#ffffff85)}.epics-roadmap-clear[data-v-7fccd138]{border:.5px solid var(--line,#ffffff14);border-radius:var(--r-sm,6px);min-height:32px;color:var(--fg-2,#ffffffc2);background:var(--surface,#ffffff08);font:inherit;flex:none;padding:0 10px;font-size:12px}.epics-roadmap-status[data-v-7fccd138]{border:.5px solid var(--line,#ffffff14);border-radius:var(--r-sm,6px);background:var(--surface,#ffffff08);margin:0;padding:12px}.epics-roadmap-status.error[data-v-7fccd138]{color:var(--err,#f87171);border-color:var(--err-soft,#f8717133);background:var(--err-soft,#f871711f)}.epics-roadmap-columns[data-v-7fccd138]{overscroll-behavior-x:contain;scrollbar-gutter:stable;grid-auto-columns:minmax(270px,1fr);grid-auto-flow:column;gap:10px;min-width:0;padding-bottom:6px;display:grid;overflow-x:auto}.epics-roadmap-columns[data-v-7fccd138]:focus-visible{outline:1.5px solid var(--accent,#3b82f6);outline-offset:3px}.epics-roadmap-column[data-v-7fccd138]{border:.5px solid var(--line,#ffffff14);border-radius:var(--r-sm,6px);background:var(--surface,#ffffff06);align-content:start;gap:8px;min-width:0;display:grid}.epics-roadmap-column-head[data-v-7fccd138]{justify-content:space-between;gap:8px;padding:10px 10px 0}.epics-roadmap-column-head h3[data-v-7fccd138]{text-overflow:ellipsis;white-space:nowrap;min-width:0;margin:0;font-size:13px;font-weight:650;line-height:1.2;overflow:hidden}.epics-roadmap-column-head span[data-v-7fccd138]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);flex:none;font-size:11px}.epics-roadmap-cards[data-v-7fccd138]{gap:8px;min-width:0;margin:0;padding:0 8px 8px;list-style:none;display:grid}.epics-roadmap-card[data-v-7fccd138]{min-width:0}.epics-roadmap-card-link[data-v-7fccd138]{border:.5px solid var(--line,#ffffff14);border-radius:var(--r-sm,6px);min-width:0;color:inherit;background:var(--surface-2,#ffffff0b);gap:8px;padding:10px;text-decoration:none;display:grid}.epics-roadmap-card.focused .epics-roadmap-card-link[data-v-7fccd138],.epics-roadmap-card-link[data-v-7fccd138]:focus-visible{outline:1.5px solid var(--accent,#3b82f6);outline-offset:2px}.epics-roadmap-card-head[data-v-7fccd138]{font-family:var(--font-mono,monospace);justify-content:space-between;gap:8px;font-size:11px}.epic-number[data-v-7fccd138],.epic-age[data-v-7fccd138]{color:var(--fg-3,#ffffff85)}.epic-state[data-v-7fccd138]{border:.5px solid;border-radius:999px;flex:none;padding:1px 7px;font-size:10px}.epic-state-good[data-v-7fccd138]{color:var(--ok,#5dc879)}@supports (color:lab(0% 0 0)){.epic-state-good[data-v-7fccd138]{color:var(--ok,lab(72.9029% -45.1402 29.5956))}}.epic-state-warn[data-v-7fccd138]{color:var(--warn,#f59e0b)}.epic-state-muted[data-v-7fccd138]{color:var(--fg-3,#ffffff85)}.epics-roadmap-card-title[data-v-7fccd138]{overflow-wrap:anywhere;min-width:0;font-size:13px;line-height:1.35}.epics-roadmap-card-copy[data-v-7fccd138]{color:var(--fg-2,#ffffffc2);-webkit-line-clamp:2;-webkit-box-orient:vertical;margin:0;font-size:12px;line-height:1.4;display:-webkit-box;overflow:hidden}.epics-roadmap-progress[data-v-7fccd138]{gap:5px;min-width:0;display:grid}.epics-roadmap-progress-bar[data-v-7fccd138]{background:var(--surface,#ffffff12);border-radius:999px;height:5px;overflow:hidden}.epics-roadmap-progress-bar span[data-v-7fccd138]{border-radius:inherit;background:var(--accent,#3b82f6);height:100%;display:block}.epics-roadmap-progress>span[data-v-7fccd138]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);font-size:11px}.epics-roadmap-card-meta[data-v-7fccd138],.epics-roadmap-card-tags[data-v-7fccd138]{flex-wrap:wrap;gap:6px}.epics-roadmap-badge[data-v-7fccd138]{border:.5px solid var(--line,#ffffff14);min-width:0;color:var(--fg-2,#ffffffc2);background:var(--surface,#ffffff08);border-radius:999px;align-items:center;gap:4px;padding:2px 7px;font-size:11px;line-height:1.2;display:inline-flex}.epics-roadmap-empty[data-v-7fccd138]{margin:0;padding:0 10px 12px}.epics-roadmap-foot[data-v-7fccd138]{justify-content:flex-end;gap:6px}.epics-roadmap-foot kbd[data-v-7fccd138]{border:.5px solid var(--line,#ffffff14);color:var(--fg-2,#ffffffbd);background:var(--surface,#ffffff0a);font-family:var(--font-mono,monospace);border-radius:4px;padding:1px 5px;font-size:10px}@media (max-width:720px){.epics-roadmap-head[data-v-7fccd138]{flex-direction:column;align-items:stretch}.epics-roadmap-new[data-v-7fccd138]{align-self:flex-start}.epics-roadmap-columns[data-v-7fccd138]{grid-auto-columns:minmax(250px,88vw)}}"]], ["__scopeId", "data-v-7fccd138"]]), Ef = ["data-state"], Df = { class: "epics-list-header" }, Of = { class: "epics-list-actions" }, kf = ["href"], Af = ["href"], jf = {
	key: 0,
	class: "epics-controls"
}, Mf = {
	class: "epics-filter-row",
	role: "tablist",
	"aria-label": "Filter epics by state"
}, Nf = ["aria-selected", "onClick"], Pf = { class: "count" }, Ff = { class: "epics-search" }, If = {
	key: 1,
	class: "epics-query-chips",
	"data-smoke": "epics-query-chips",
	"aria-label": "Parsed search filters"
}, Lf = ["title"], Rf = {
	key: 2,
	class: "epics-owner-filter",
	"data-smoke": "epics-owner-filter"
}, zf = ["title"], Bf = {
	key: 3,
	class: "epics-project-filter",
	"data-smoke": "epics-project-filter"
}, Vf = ["title"], Hf = ["data-busy"], Uf = ["placeholder", "disabled"], Wf = {
	key: 0,
	class: "quick-add-status"
}, Gf = ["title"], Kf = {
	key: 4,
	class: "epic-line warn",
	role: "alert"
}, qf = {
	key: 5,
	class: "epics-bulk-bar",
	"data-smoke": "epics-bulk-bar"
}, Jf = { class: "count" }, Yf = { class: "bulk-reproject" }, Xf = ["disabled"], Zf = ["value"], Qf = ["disabled"], $f = {
	key: 6,
	class: "epic-line warn",
	role: "alert"
}, ep = {
	key: 7,
	class: "epic-line muted"
}, tp = {
	key: 8,
	class: "epic-line warn"
}, np = {
	key: 9,
	class: "epic-line muted"
}, rp = {
	key: 10,
	class: "epic-line muted"
}, ip = {
	key: 11,
	class: "epics-list-items",
	role: "listbox",
	"aria-label": "Epic list"
}, ap = ["aria-selected", "onMouseenter"], op = {
	key: 12,
	class: "epics-list-foot"
}, sp = /* @__PURE__ */ ju(/* @__PURE__ */ zn({
	__name: "EpicsList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epics: { type: [Array, null] },
		workspaceId: {
			default: ru(),
			type: String
		},
		repositoryId: {
			default: null,
			type: [String, null]
		},
		repositorySegments: { type: Array },
		state: {
			default: null,
			type: [String, null]
		},
		title: {
			default: "Epics",
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
				id: "IN_PROGRESS",
				label: "In progress",
				key: "i"
			},
			{
				id: "PLANNED",
				label: "Planned",
				key: "p"
			},
			{
				id: "DONE",
				label: "Done",
				key: "d"
			},
			{
				id: "CANCELED",
				label: "Canceled",
				key: "x"
			},
			{
				id: "ALL",
				label: "All",
				key: "a"
			}
		], r = new Set([
			"PLANNED",
			"IN_PROGRESS",
			"DONE",
			"CANCELED",
			"ALL"
		]), i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(t.epics ?? []), s = /* @__PURE__ */ z("ALL"), c = /* @__PURE__ */ z(""), l = /* @__PURE__ */ z(""), u = /* @__PURE__ */ z(""), d = Y(() => {
			let e = t.epics ?? o.value;
			return t.projectName ? e.filter((e) => e.projectName === t.projectName) : e;
		}), f = [
			"is",
			"owner",
			"project"
		], p = {
			planned: "PLANNED",
			"in-progress": "IN_PROGRESS",
			in_progress: "IN_PROGRESS",
			inprogress: "IN_PROGRESS",
			done: "DONE",
			canceled: "CANCELED",
			cancelled: "CANCELED",
			all: "ALL"
		}, m = Y(() => cl(c.value, f)), h = Y(() => {
			for (let e of m.value.filters.is ?? []) {
				let t = p[e.toLowerCase()];
				if (t) return t;
			}
			return s.value;
		}), g = Y(() => {
			for (let e of m.value.filters.owner ?? []) if (e.startsWith("comtrya://")) return e;
			return l.value;
		}), _ = Y(() => {
			if (t.projectName) return "";
			for (let e of m.value.filters.project ?? []) if (e.trim()) return e.trim();
			return u.value;
		}), v = Y(() => {
			let e = d.value, t = h.value;
			t !== "ALL" && (e = e.filter((e) => e.state === t));
			let n = _.value;
			n && (e = e.filter((e) => e.projectName === n));
			let r = g.value;
			r && (e = e.filter((e) => e.ownerRef === r));
			let i = m.value.text.trim().toLowerCase();
			return i && (e = e.filter((e) => {
				let t = (e.ownerRef ?? "").split("/").pop() ?? "";
				return `${e.title} ${t} ${e.projectName ?? ""}`.toLowerCase().includes(i);
			})), e;
		}), y = Y(() => {
			let e = [];
			for (let t of m.value.filters.is ?? []) {
				let n = p[t.toLowerCase()];
				e.push({
					key: "is",
					value: t,
					label: n ? `is · ${n.toLowerCase().replace("_", " ")}` : `is · ${t}`,
					tone: "is"
				});
			}
			for (let t of m.value.filters.owner ?? []) e.push({
				key: "owner",
				value: t,
				label: `→ ${w(t)}`,
				tone: "owner"
			});
			for (let t of m.value.filters.project ?? []) e.push({
				key: "project",
				value: t,
				label: `◇ ${t}`,
				tone: "project"
			});
			for (let t of m.value.unknown) e.push({
				key: t,
				value: "",
				label: `unknown · ${t}:`,
				tone: "unknown"
			});
			return e;
		});
		function b(e) {
			l.value === e ? l.value = "" : l.value = e;
		}
		function x() {
			l.value = "";
		}
		function S(e) {
			u.value === e ? u.value = "" : u.value = e;
		}
		function C() {
			u.value = "";
		}
		function w(e) {
			return e.replace(/^comtrya:\/\/[a-z]+\//, "");
		}
		let ee = Y(() => {
			let e = {
				PLANNED: 0,
				IN_PROGRESS: 0,
				DONE: 0,
				CANCELED: 0,
				ALL: d.value.length
			};
			for (let t of d.value) t.state === "PLANNED" ? e.PLANNED += 1 : t.state === "IN_PROGRESS" ? e.IN_PROGRESS += 1 : t.state === "DONE" ? e.DONE += 1 : t.state === "CANCELED" && (e.CANCELED += 1);
			return e;
		}), te = Y(() => t.client ?? t.comtryaClient), ne = Y(() => {
			let e = vl(iu, "/new", { repositorySegments: t.repositorySegments }), n = re();
			return t.projectName && n.set("projectName", t.projectName), `${e}?${n.toString()}`;
		}), T = Y(() => {
			if (typeof window > "u") return su(t.workspaceId);
			let e = window.location.pathname.replace(/\/$/, "");
			return e.endsWith("/epics") ? `${e}/board${window.location.search}` : `${vl(iu, "/board", { repositorySegments: t.repositorySegments })}?${re().toString()}`;
		});
		function re() {
			let e = new URLSearchParams({ workspaceId: t.workspaceId });
			return t.repositoryId && e.set("repositoryId", t.repositoryId), e;
		}
		let E = /* @__PURE__ */ z(""), D = /* @__PURE__ */ z(!1), ie = /* @__PURE__ */ z(null), O = Y(() => t.projectName ?? _.value ?? null), ae = Y(() => {
			let e = O.value;
			return e ? `New epic in ${e}…` : "New epic…";
		});
		function k() {
			document.querySelector("[data-smoke=\"epics-quick-add\"]")?.focus();
		}
		function oe(e) {
			e.preventDefault(), E.value = "", ie.value = null, e.target?.blur();
		}
		async function se() {
			let e = E.value.trim();
			if (!(!e || D.value)) {
				D.value = !0, ie.value = null;
				try {
					let n = await Zl(te.value, {
						workspaceId: t.workspaceId,
						title: e,
						bodyMarkdown: "",
						projectName: O.value
					});
					o.value.some((e) => e.id === n.id) || (o.value = [n, ...o.value]), E.value = "", i.value = "ready", ye(), pn(k);
				} catch (e) {
					ie.value = e instanceof Error ? e.message : String(e);
				} finally {
					D.value = !1;
				}
			}
		}
		let A = /* @__PURE__ */ z(0), j = /* @__PURE__ */ z(/* @__PURE__ */ new Set()), ce = /* @__PURE__ */ z(!1), le = /* @__PURE__ */ z(null), ue = /* @__PURE__ */ z([]);
		er(async () => {
			try {
				ue.value = await wl(t.repositorySegments);
			} catch {
				ue.value = [];
			}
		}), V(v, (e) => {
			A.value >= e.length && (A.value = Math.max(0, e.length - 1));
		});
		function de(e) {
			let t = new Set(j.value);
			t.has(e) ? t.delete(e) : t.add(e), j.value = t;
		}
		function fe() {
			j.value = /* @__PURE__ */ new Set(), le.value = null;
		}
		async function pe(e) {
			if (j.value.size === 0 || ce.value) return;
			let t = Array.from(j.value);
			ce.value = !0, le.value = null;
			try {
				let n = await Promise.allSettled(t.map((t) => Ql(t, e))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
				if (n.forEach((e, n) => {
					let a = t[n];
					e.status === "fulfilled" ? r.set(a, e.value) : i.add(a);
				}), o.value = o.value.map((e) => r.get(e.id) ?? e), j.value = i, i.size > 0) {
					let n = e ?? "(no project)";
					le.value = `${i.size} of ${t.length} reassignments to ${n} failed; retry the remaining selection.`;
				}
			} catch (e) {
				le.value = e instanceof Error ? e.message : String(e);
			} finally {
				ce.value = !1;
			}
		}
		function me(e) {
			let t = e.target;
			if (!t) return;
			let n = t.value, r = n === "__NONE__" ? null : n || null;
			t.value = "", n !== "" && pe(r);
		}
		vs({
			c: (e) => {
				e.preventDefault(), k();
			},
			j: (e) => {
				v.value.length !== 0 && (e.preventDefault(), A.value = Math.min(v.value.length - 1, A.value + 1));
			},
			k: (e) => {
				v.value.length !== 0 && (e.preventDefault(), A.value = Math.max(0, A.value - 1));
			},
			" ": (e) => {
				let t = v.value[A.value];
				t && (e.preventDefault(), de(t.id));
			},
			Escape: (e) => {
				j.value.size !== 0 && (e.preventDefault(), fe());
			}
		});
		function he() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = (e.get("state") ?? "").toUpperCase();
			r.has(t) && (s.value = t);
			let n = e.get("owner") ?? "";
			l.value = n.startsWith("comtrya://") ? n : "";
			let i = e.get("project") ?? "";
			u.value = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(i) ? i : "";
			let a = e.get("q");
			a !== null && (c.value = a);
		}
		function ge() {
			if (typeof window > "u") return;
			let e = window.location.search, n = new URLSearchParams(e);
			s.value === "ALL" ? n.delete("state") : n.set("state", s.value), l.value ? n.set("owner", l.value) : n.delete("owner"), ml(n, {
				projectFilter: u.value,
				scopedProjectName: t.projectName,
				currentSearch: e
			});
			let r = c.value.trim();
			r ? n.set("q", r) : n.delete("q");
			let i = n.toString(), a = `${window.location.pathname}${i ? `?${i}` : ""}${window.location.hash}`;
			a !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", a);
		}
		let _e = !1;
		function ve() {
			_e = !0, he(), pn(() => {
				_e = !1;
			});
		}
		er(() => {
			_e = !0, he(), _e = !1, ye(), window.addEventListener("popstate", ve);
		}), ir(() => {
			window.removeEventListener("popstate", ve);
		}), V(() => [
			te.value,
			t.epics,
			t.workspaceId,
			t.state
		], () => void ye()), V([
			s,
			l,
			u,
			c
		], () => {
			_e || ge();
		});
		async function ye() {
			if (t.epics) {
				o.value = t.epics, i.value = t.epics.length > 0 ? "ready" : "empty", a.value = null;
				return;
			}
			if (!te.value) {
				o.value = [], i.value = "error", a.value = "epics: no client";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				o.value = await Gl(te.value, {
					workspaceId: t.workspaceId,
					state: t.state
				}), i.value = o.value.length > 0 ? "ready" : "empty";
			} catch (e) {
				o.value = [], i.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (r, o) => (W(), G("section", {
			class: "epics-list",
			"data-state": i.value,
			"data-smoke": "epics-list"
		}, [
			K("header", Df, [K("h3", null, N(e.title), 1), K("div", Of, [K("a", { href: T.value }, "board", 8, kf), e.showNewLink ? (W(), G("a", {
				key: 0,
				href: ne.value
			}, "+ new", 8, Af)) : J("", !0)])]),
			d.value.length > 0 ? (W(), G("div", jf, [K("div", Mf, [(W(), G(U, null, H(n, (e) => K("button", {
				key: e.id,
				type: "button",
				role: "tab",
				"aria-selected": s.value === e.id,
				class: M(["epics-filter", { active: s.value === e.id }]),
				onClick: (t) => s.value = e.id
			}, [K("span", null, N(e.label), 1), K("span", Pf, N(ee.value[e.id]), 1)], 10, Nf)), 64))]), K("label", Ff, [En(K("input", {
				"data-epics-search": "",
				"onUpdate:modelValue": o[0] ||= (e) => c.value = e,
				type: "search",
				placeholder: "Filter — try is:in-progress · project:<name> · owner:<urn> · text",
				autocomplete: "off"
			}, null, 512), [[co, c.value]])])])) : J("", !0),
			y.value.length > 0 ? (W(), G("div", If, [(W(!0), G(U, null, H(y.value, (e) => (W(), G("span", {
				key: `${e.key}:${e.value || "unknown"}`,
				class: M(["query-chip", `tone-${e.tone}`]),
				title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
			}, N(e.label), 11, Lf))), 128)), o[2] ||= K("span", { class: "query-chips-hint" }, [
				q(" syntax: "),
				K("code", null, "is:in-progress"),
				q(" · "),
				K("code", null, "project:<name>"),
				q(" · "),
				K("code", null, "owner:<urn>")
			], -1)])) : J("", !0),
			l.value ? (W(), G("div", Rf, [
				o[3] ||= K("span", { class: "prefix" }, "owner", -1),
				K("span", {
					class: "active-chip",
					title: l.value
				}, N(w(l.value)), 9, zf),
				K("button", {
					type: "button",
					class: "clear",
					onClick: x,
					"aria-label": "Clear owner filter"
				}, "clear ✕")
			])) : J("", !0),
			u.value && !t.projectName ? (W(), G("div", Bf, [
				o[5] ||= K("span", { class: "prefix" }, "project", -1),
				K("span", {
					class: "active-chip",
					title: `Scoped to project ${u.value}`
				}, [o[4] ||= K("span", { class: "project-glyph" }, "◇", -1), q(" " + N(u.value), 1)], 8, Vf),
				K("button", {
					type: "button",
					class: "clear",
					onClick: C,
					"aria-label": "Clear project filter"
				}, "clear ✕")
			])) : J("", !0),
			K("form", {
				class: "epics-quick-add",
				"data-busy": D.value ? "true" : "false",
				onSubmit: ho(se, ["prevent"])
			}, [
				o[6] ||= K("span", {
					class: "quick-add-glyph",
					"aria-hidden": "true"
				}, "+", -1),
				En(K("input", {
					"onUpdate:modelValue": o[1] ||= (e) => E.value = e,
					"data-smoke": "epics-quick-add",
					type: "text",
					autocomplete: "off",
					placeholder: ae.value,
					disabled: D.value,
					onKeydown: _o(oe, ["esc"])
				}, null, 40, Uf), [[co, E.value]]),
				D.value ? (W(), G("span", Wf, "creating…")) : O.value ? (W(), G("span", {
					key: 1,
					class: "quick-add-chip tone-blue",
					title: `Stamps projectName = ${O.value} on create`
				}, "◇ " + N(O.value), 9, Gf)) : J("", !0),
				o[7] ||= K("span", { class: "quick-add-hint" }, [
					K("kbd", null, "↵"),
					q(" create · "),
					K("kbd", null, "esc"),
					q(" clear · "),
					K("kbd", null, "c"),
					q(" focus ")
				], -1)
			], 40, Hf),
			ie.value ? (W(), G("p", Kf, N(ie.value), 1)) : J("", !0),
			j.value.size > 0 ? (W(), G("div", qf, [
				K("span", Jf, N(j.value.size) + " selected", 1),
				K("label", Yf, [o[10] ||= K("span", { class: "bulk-reproject-label" }, "reproject →", -1), K("select", {
					class: "bulk-reproject-select",
					"data-smoke": "epics-bulk-reproject",
					disabled: ce.value,
					onChange: me
				}, [
					o[8] ||= K("option", {
						value: "",
						disabled: "",
						selected: ""
					}, "pick project…", -1),
					o[9] ||= K("option", { value: "__NONE__" }, "— no project —", -1),
					(W(!0), G(U, null, H(ue.value, (e) => (W(), G("option", {
						key: e.name,
						value: e.name ?? ""
					}, "◇ " + N(e.name), 9, Zf))), 128))
				], 40, Xf)]),
				K("button", {
					type: "button",
					class: "bulk-clear",
					disabled: ce.value,
					onClick: fe
				}, [...o[11] ||= [q("clear ", -1), K("kbd", null, "esc", -1)]], 8, Qf),
				o[12] ||= K("span", { class: "hint" }, [K("kbd", null, "space"), q(" toggle row ")], -1)
			])) : J("", !0),
			le.value ? (W(), G("p", $f, N(le.value), 1)) : J("", !0),
			i.value === "loading" ? (W(), G("p", ep, "Loading epics")) : i.value === "error" ? (W(), G("p", tp, N(a.value), 1)) : d.value.length === 0 ? (W(), G("p", np, "No epics yet.")) : v.value.length === 0 ? (W(), G("p", rp, " No " + N(s.value.toLowerCase().replace("_", " ")) + " epics in scope. ", 1)) : (W(), G("ul", ip, [(W(!0), G(U, null, H(v.value, (t, n) => (W(), G("li", {
				key: t.id,
				class: M({
					focused: n === A.value,
					selected: j.value.has(t.id)
				}),
				"aria-selected": j.value.has(t.id),
				role: "option",
				onMouseenter: (e) => A.value = n
			}, [Li(Mu, {
				epic: t,
				"resource-ref": B(au)(t),
				client: te.value,
				"repository-segments": e.repositorySegments,
				"active-owner": l.value,
				"active-project": u.value,
				onOwnerClick: b,
				onProjectClick: S
			}, null, 8, [
				"epic",
				"resource-ref",
				"client",
				"repository-segments",
				"active-owner",
				"active-project"
			])], 42, ap))), 128))])),
			v.value.length > 0 ? (W(), G("footer", op, [...o[13] ||= [
				K("kbd", null, "j", -1),
				q(),
				K("kbd", null, "k", -1),
				q(" navigate · ", -1),
				K("kbd", null, "space", -1),
				q(" select · ", -1),
				K("kbd", null, "c", -1),
				q(" create ", -1)
			]])) : J("", !0)
		], 8, Ef));
	}
}), [["styles", [".epics-list[data-v-bc83a744]{gap:8px;min-width:0;max-width:100%;display:grid}.epics-list-header[data-v-bc83a744]{flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:12px;min-width:0;max-width:100%;display:flex}.epics-list-header h3[data-v-bc83a744]{font-family:var(--font-serif,system-ui);margin:0;font-size:14px}.epics-list-header a[data-v-bc83a744],.epic-line[data-v-bc83a744]{font-family:var(--font-mono,monospace);font-size:12px}.epics-list-actions[data-v-bc83a744]{flex-wrap:wrap;align-items:center;gap:10px;display:flex}.epic-line[data-v-bc83a744]{overflow-wrap:anywhere;min-width:0}.epics-list-header a[data-v-bc83a744]{color:var(--fg-3,#ffffff85);text-decoration:none}.epics-controls[data-v-bc83a744]{flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:4px;display:flex}.epics-search[data-v-bc83a744]{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);flex:280px;align-items:center;gap:6px;padding:0 8px;display:inline-flex}.epics-search input[data-v-bc83a744]{font-family:var(--font-mono,monospace);color:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0;padding:6px 0;font-size:12px}.epics-search input[data-v-bc83a744]::placeholder{color:var(--fg-3,#ffffff85)}.epics-query-chips[data-v-bc83a744]{font-family:var(--font-mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:4px;font-size:11px;display:flex}.epics-query-chips .query-chip[data-v-bc83a744]{letter-spacing:.02em;white-space:nowrap;border:.5px solid;align-items:center;padding:1px 7px;display:inline-flex}.epics-query-chips .query-chip.tone-is[data-v-bc83a744]{color:var(--accent-teal,#087f6f)}.epics-query-chips .query-chip.tone-owner[data-v-bc83a744]{color:var(--fg,#fffffff0)}.epics-query-chips .query-chip.tone-project[data-v-bc83a744]{color:var(--accent-blue,#1d55a6)}.epics-query-chips .query-chip.tone-unknown[data-v-bc83a744]{color:var(--accent-yellow,#c89300);border-style:dashed}.epics-query-chips .query-chips-hint[data-v-bc83a744]{color:var(--fg-3,#ffffff85);letter-spacing:0;margin-left:4px}.epics-query-chips .query-chips-hint code[data-v-bc83a744]{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);color:var(--fg-2,#ffffffbd);padding:0 4px;font-size:11px}.epics-filter-row[data-v-bc83a744]{border:.5px solid var(--fg,#fffffff0);flex-wrap:wrap;align-self:flex-start;gap:0;display:inline-flex}.epics-filter[data-v-bc83a744]{color:inherit;cursor:pointer;font-family:var(--font-mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:4px 9px;font-size:11px;display:inline-flex}.epics-filter[data-v-bc83a744]:not(:last-child){border-right:.5px solid var(--line,#ffffff12)}.epics-filter.active[data-v-bc83a744]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.epics-filter .count[data-v-bc83a744]{color:var(--fg-3,#ffffff85);font-variant-numeric:tabular-nums}.epics-filter.active .count[data-v-bc83a744]{color:var(--bg-2,#0e1014)}.epics-owner-filter[data-v-bc83a744]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-owner-filter .prefix[data-v-bc83a744]{color:var(--fg-3,#ffffff85);letter-spacing:.04em;text-transform:lowercase}.epics-owner-filter .active-chip[data-v-bc83a744]{border:.5px solid var(--fg,#fffffff0);color:var(--fg,#fffffff0);padding:0 5px}.epics-owner-filter .clear[data-v-bc83a744]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-owner-filter .clear[data-v-bc83a744]:hover{color:var(--fg,#fffffff0)}.epics-project-filter[data-v-bc83a744]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-project-filter .prefix[data-v-bc83a744]{color:var(--fg-3,#ffffff85);letter-spacing:.04em;text-transform:lowercase}.epics-project-filter .active-chip[data-v-bc83a744]{color:var(--accent-blue,#1d55a6);border:.5px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.epics-project-filter .project-glyph[data-v-bc83a744]{font-size:10px}.epics-project-filter .clear[data-v-bc83a744]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-project-filter .clear[data-v-bc83a744]:hover{color:var(--fg,#fffffff0)}.epics-quick-add[data-v-bc83a744]{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);flex-wrap:wrap;align-items:center;gap:8px;min-width:0;max-width:100%;padding:6px 10px 6px 6px;transition:border-color .12s;display:flex}.epics-quick-add[data-v-bc83a744]:focus-within{border-color:var(--fg,#fffffff0)}.epics-quick-add[data-busy=true][data-v-bc83a744]{opacity:.85;border-style:dashed}.epics-quick-add .quick-add-glyph[data-v-bc83a744]{width:22px;height:22px;font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);border:.5px solid;border-radius:2px;place-items:center;font-size:13px;display:inline-grid}.epics-quick-add input[data-v-bc83a744]{min-width:0;color:inherit;font-family:var(--font-serif,system-ui);background:0 0;border:0;outline:none;flex:180px;padding:4px 0;font-size:15px}.epics-quick-add input[data-v-bc83a744]::placeholder{color:var(--fg-4,#ffffff57);font-style:italic}.epics-quick-add .quick-add-status[data-v-bc83a744]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);flex:0 auto;font-size:11px}.epics-quick-add .quick-add-chip[data-v-bc83a744]{min-width:0;max-width:100%;font-family:var(--font-mono,monospace);letter-spacing:.02em;white-space:nowrap;border:.5px solid;flex:0 auto;align-items:center;padding:1px 6px;font-size:10.5px;display:inline-flex}.epics-quick-add .quick-add-chip.tone-blue[data-v-bc83a744]{color:var(--accent-blue,#1d55a6)}.epics-quick-add .quick-add-hint[data-v-bc83a744]{min-width:0;font-family:var(--font-mono,monospace);color:var(--fg-4,#ffffff57);white-space:normal;flex:180px;font-size:10.5px}.epics-quick-add .quick-add-hint kbd[data-v-bc83a744]{font-family:var(--font-mono,monospace);border:.5px solid var(--line,#ffffff12);margin:0 1px;padding:0 4px;font-size:10px}.epics-list-items[data-v-bc83a744]{gap:8px;margin:0;padding:0;list-style:none;display:grid}.epics-list-items>li[data-v-bc83a744]{transition:background 80ms;position:relative}.epics-list-items>li.focused[data-v-bc83a744]{background:var(--bg-2,#0e1014)}.epics-list-items>li.selected[data-v-bc83a744]{box-shadow:inset 3px 0 0 var(--fg,#fffffff0)}.epics-list-items>li.focused.selected[data-v-bc83a744]{box-shadow:inset 3px 0 0 var(--accent-teal,#087f6f)}.epics-list-foot[data-v-bc83a744]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);letter-spacing:.04em;margin-top:8px;font-size:11px}.epics-list-foot kbd[data-v-bc83a744]{font-family:var(--font-mono,monospace);border:.5px solid var(--line,#ffffff12);margin:0 1px;padding:0 4px;font-size:10px}.epics-bulk-bar[data-v-bc83a744]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);font-family:var(--font-mono,monospace);z-index:1;flex-wrap:wrap;align-items:center;gap:12px;padding:8px 12px;font-size:11px;display:flex;position:sticky;top:0}.epics-bulk-bar .count[data-v-bc83a744]{font-weight:600}.epics-bulk-bar .bulk-reproject[data-v-bc83a744]{align-items:center;gap:6px;display:inline-flex}.epics-bulk-bar .bulk-reproject-label[data-v-bc83a744]{color:var(--bg-2,#0e1014);letter-spacing:.04em}.epics-bulk-bar .bulk-reproject-select[data-v-bc83a744]{border:.5px solid var(--bg-2,#0e1014);color:var(--bg,#0a0b0e);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;outline:none;padding:2px 6px;font-size:11px}.epics-bulk-bar .bulk-reproject-select[data-v-bc83a744]:disabled{opacity:.5;cursor:wait}.epics-bulk-bar .bulk-reproject-select option[data-v-bc83a744]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.epics-bulk-bar .bulk-clear[data-v-bc83a744]{color:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 4px;font-size:11px}.epics-bulk-bar .bulk-clear kbd[data-v-bc83a744]{border:.5px solid;margin-left:4px;padding:0 4px;font-size:10px}.epics-bulk-bar .hint[data-v-bc83a744]{color:var(--bg-2,#0e1014);letter-spacing:.04em;font-size:10.5px}.epics-bulk-bar .hint kbd[data-v-bc83a744]{border:.5px solid;padding:0 4px;font-size:10px}.epic-line[data-v-bc83a744]{margin:4px 0}.muted[data-v-bc83a744]{color:var(--fg-3,#ffffff85)}.warn[data-v-bc83a744]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-bc83a744]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}"]], ["__scopeId", "data-v-bc83a744"]]), cp = {
	class: "issue-epic-linker",
	"data-smoke": "issue-epic-linker"
}, lp = { class: "issue-epic-linker-header" }, up = {
	key: 0,
	class: "epic-linker-line muted"
}, dp = {
	key: 1,
	class: "epic-linker-line warn"
}, fp = {
	key: 2,
	class: "linked-epics"
}, pp = ["href"], mp = {
	key: 0,
	class: "epic-linker-line muted"
}, hp = ["disabled", "onClick"], gp = {
	key: 3,
	class: "linked-epics"
}, _p = { class: "epic-linker-line muted" }, vp = ["disabled", "onClick"], yp = {
	key: 4,
	class: "epic-linker-line muted"
}, bp = ["value"], xp = ["disabled"], Sp = {
	key: 6,
	class: "epic-linker-line muted"
}, Cp = {
	key: 7,
	class: "epic-linker-line warn",
	role: "alert"
}, wp = "comtrya://rel/part-of", Tp = /* @__PURE__ */ ju(/* @__PURE__ */ zn({
	__name: "IssueEpicLinker",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		issue: { type: [Object, null] },
		workspaceId: { type: String },
		repositoryId: { type: [String, null] },
		repositoryPath: { type: [String, null] },
		refreshKey: { type: Number },
		relationshipRefreshKey: { type: Number }
	},
	emits: ["comtrya-relationship-changed"],
	setup(e, { emit: t }) {
		let n = e, r = t, i = Y(() => n.client ?? n.comtryaClient), a = Y(() => n.workspaceId ?? n.issue?.workspaceId ?? ru()), o = Y(() => n.issue?.id ? `comtrya://issue/${n.issue.id}` : ""), s = Y(() => {
			let e = u.value;
			return h.value.filter((t) => e.has(au(t)));
		}), c = Y(() => {
			let e = new Set(h.value.map((e) => au(e)));
			return [...u.value].filter((t) => !e.has(t));
		}), l = Y(() => {
			let e = u.value, t = n.issue?.projectName ?? null;
			return h.value.filter((t) => !e.has(au(t))).sort((e, n) => (t && e.projectName === t ? 0 : 1) - (t && n.projectName === t ? 0 : 1) || (e.projectName ?? "").localeCompare(n.projectName ?? "") || e.title.localeCompare(n.title));
		}), u = Y(() => new Set(g.value.filter((e) => e.kind === wp).map((e) => C(e)).filter((e) => e.startsWith("comtrya://epic/")))), d = /* @__PURE__ */ z("idle"), f = /* @__PURE__ */ z(null), p = /* @__PURE__ */ z("idle"), m = /* @__PURE__ */ z(null), h = /* @__PURE__ */ z([]), g = /* @__PURE__ */ z([]), _ = /* @__PURE__ */ z("");
		V(() => [
			i.value,
			a.value,
			o.value,
			n.refreshKey,
			n.relationshipRefreshKey
		], () => void v(), { immediate: !0 }), V(l, (e) => {
			e.some((e) => au(e) === _.value) || (_.value = e[0] ? au(e[0]) : "");
		}, { immediate: !0 });
		async function v() {
			let e = i.value;
			if (!e || !o.value) {
				h.value = [], g.value = [], d.value = "error", f.value = e ? "issue-epic-linker: missing issue" : "issue-epic-linker: no client";
				return;
			}
			d.value = "loading", f.value = null;
			try {
				let [t, n] = await Promise.all([Gl(e, { workspaceId: a.value }), $l(e, o.value, wp)]);
				h.value = t, g.value = n, d.value = "ready";
			} catch (e) {
				h.value = [], g.value = [], d.value = "error", f.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function y() {
			let e = i.value;
			if (!(!e || !o.value || !_.value)) {
				p.value = "submitting", m.value = null;
				try {
					let t = await eu(e, {
						from: o.value,
						to: _.value,
						kind: wp
					});
					await v(), w("created", t);
				} catch (e) {
					m.value = e instanceof Error ? e.message : String(e);
				} finally {
					p.value = "idle";
				}
			}
		}
		async function b(e) {
			let t = i.value;
			if (t) {
				p.value = "submitting", m.value = null;
				try {
					await tu(t, e.id), await v(), w("deleted", e);
				} catch (e) {
					m.value = e instanceof Error ? e.message : String(e);
				} finally {
					p.value = "idle";
				}
			}
		}
		async function x(e) {
			let t = S(e);
			t && await b(t);
		}
		function S(e) {
			return g.value.find((t) => C(t) === e);
		}
		function C(e) {
			return e.to ?? e.target ?? "";
		}
		function w(e, t) {
			r("comtrya-relationship-changed", {
				source: "issue-epic-linker",
				action: e,
				relation: t
			});
		}
		return (e, t) => (W(), G("section", cp, [
			K("header", lp, [K("div", null, [t[1] ||= K("h2", null, "Epic", -1), K("p", null, N(s.value.length + c.value.length) + " linked", 1)])]),
			d.value === "loading" ? (W(), G("p", up, "Loading epics")) : d.value === "error" ? (W(), G("p", dp, N(f.value), 1)) : J("", !0),
			d.value === "ready" && s.value.length > 0 ? (W(), G("div", fp, [(W(!0), G(U, null, H(s.value, (e) => (W(), G("article", {
				key: e.id,
				class: "linked-epic"
			}, [K("div", null, [
				K("span", { class: M(["epic-state", B(cu)(e.state).className]) }, N(B(cu)(e.state).label), 3),
				K("a", { href: B(ou)(e) }, N(e.title), 9, pp),
				e.projectName ? (W(), G("p", mp, N(e.projectName), 1)) : J("", !0)
			]), K("button", {
				type: "button",
				disabled: p.value === "submitting",
				onClick: (t) => x(B(au)(e))
			}, " Remove ", 8, hp)]))), 128))])) : J("", !0),
			d.value === "ready" && c.value.length > 0 ? (W(), G("div", gp, [(W(!0), G(U, null, H(c.value, (e) => (W(), G("article", {
				key: e,
				class: "linked-epic"
			}, [K("p", _p, N(e), 1), S(e) ? (W(), G("button", {
				key: 0,
				type: "button",
				disabled: p.value === "submitting",
				onClick: (t) => x(e)
			}, " Remove ", 8, vp)) : J("", !0)]))), 128))])) : J("", !0),
			d.value === "ready" && s.value.length === 0 && c.value.length === 0 ? (W(), G("p", yp, " Not linked to an epic. ")) : J("", !0),
			d.value === "ready" && l.value.length > 0 ? (W(), G("form", {
				key: 5,
				class: "epic-linker-form",
				onSubmit: ho(y, ["prevent"])
			}, [K("label", null, [t[2] ||= K("span", null, "Link epic", -1), En(K("select", {
				"onUpdate:modelValue": t[0] ||= (e) => _.value = e,
				"aria-label": "Epic"
			}, [(W(!0), G(U, null, H(l.value, (e) => (W(), G("option", {
				key: e.id,
				value: B(au)(e)
			}, N(e.title) + N(e.projectName ? ` - ${e.projectName}` : ""), 9, bp))), 128))], 512), [[lo, _.value]])]), K("button", {
				type: "submit",
				disabled: p.value === "submitting" || !_.value
			}, " Link ", 8, xp)], 32)) : d.value === "ready" && l.value.length === 0 ? (W(), G("p", Sp, " No eligible epics. ")) : J("", !0),
			m.value ? (W(), G("p", Cp, N(m.value), 1)) : J("", !0)
		]));
	}
}), [["styles", [".issue-epic-linker[data-v-7883bb2f]{border:.5px solid var(--line,#ffffff12);background:var(--surface);color:var(--fg,#fffffff0);font-family:var(--font-mono,monospace);gap:12px;padding:14px;font-size:12px;display:grid}.issue-epic-linker-header[data-v-7883bb2f]{border-bottom:.5px solid var(--line,#ffffff12);align-items:center;min-height:36px;display:flex}.issue-epic-linker-header h2[data-v-7883bb2f]{font-family:var(--font-serif,system-ui);margin:0;font-size:18px;line-height:1}.issue-epic-linker-header p[data-v-7883bb2f],.epic-linker-line[data-v-7883bb2f]{margin:4px 0 0;font-size:11px}.linked-epics[data-v-7883bb2f],.epic-linker-form[data-v-7883bb2f]{gap:8px;display:grid}.linked-epic[data-v-7883bb2f]{grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:8px;display:grid}.linked-epic a[data-v-7883bb2f]{color:inherit;overflow-wrap:anywhere;text-decoration:none}.linked-epic a[data-v-7883bb2f]:hover{text-decoration:underline}.epic-state[data-v-7883bb2f]{border:.5px solid;margin-right:6px;padding:1px 6px;font-size:10px;display:inline-flex}.epic-linker-form[data-v-7883bb2f]{border-top:.5px solid var(--line,#ffffff12);padding-top:12px}.epic-linker-form label[data-v-7883bb2f]{gap:4px;min-width:0;display:grid}.epic-linker-form label>span[data-v-7883bb2f]{color:var(--fg-3,#ffffff85);letter-spacing:.08em;text-transform:uppercase;font-size:10px}.epic-linker-form select[data-v-7883bb2f],.epic-linker-form button[data-v-7883bb2f],.linked-epic button[data-v-7883bb2f]{border:.5px solid var(--fg,#fffffff0);min-height:32px;color:inherit;font:inherit;background:0 0}.epic-linker-form select[data-v-7883bb2f]{width:100%;max-width:100%;padding:5px 8px}.epic-linker-form button[data-v-7883bb2f],.linked-epic button[data-v-7883bb2f]{cursor:pointer;padding:5px 10px}.epic-linker-form button[data-v-7883bb2f]:disabled,.linked-epic button[data-v-7883bb2f]:disabled{cursor:wait;opacity:.55}.muted[data-v-7883bb2f]{color:var(--fg-3,#ffffff85)}.warn[data-v-7883bb2f]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-7883bb2f]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}"]], ["__scopeId", "data-v-7883bb2f"]]), Ep = "epics", Dp = "ext_epics", Op = "comtrya-epic-card", kp = "comtrya-epics-board", Ap = "comtrya-epics-index", jp = "comtrya-epics-roadmap", Mp = "comtrya-epic-detail", Np = "comtrya-issue-epic-linker", Pp = "comtrya-epic-new";
jl({
	tagName: Op,
	component: Mu,
	propertyAliases: { ref: "resourceRef" }
}), jl({
	tagName: kp,
	component: sp
}), jl({
	tagName: Ap,
	component: sp
}), jl({
	tagName: jp,
	component: Tf
}), jl({
	tagName: Mp,
	component: Jd
}), jl({
	tagName: Np,
	component: Tp
}), Ip();
var Fp = {
	id: Dp,
	setup(e) {
		e.registerCard({
			resourceKind: "epic",
			element: Op,
			requiredPermission: "epics.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "epic",
			loadTargets: async (t) => (await Gl(e.client, { workspaceId: t.workspaceId ?? ru() })).map((e) => ({
				ref: au(e),
				kind: "epic",
				title: e.title,
				subtitle: e.state.toLowerCase().replace(/_/g, " ")
			}))
		}), e.registerWidget({
			id: "epics-board",
			element: kp,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "epics.read"
		}), e.registerWidget({
			id: "issue-epic-linker",
			element: Np,
			defaultSlot: "issue.detail.sidebar",
			defaultPriority: 90,
			requiredPermission: "epics.write"
		}), e.registerRoute("/", {
			element: Ap,
			requiredPermission: "epics.read"
		}), e.registerRoute("/board", {
			element: jp,
			requiredPermission: "epics.read"
		}), e.registerRoute("/new", {
			element: Pp,
			requiredPermission: "epics.write"
		}), e.registerRoute("/:workspaceId/:id", {
			element: Mp,
			requiredPermission: "epics.read"
		}), hu(e.client);
	}
};
function Ip() {
	typeof customElements > "u" || customElements.get(Pp) || customElements.define(Pp, class extends HTMLElement {
		routeParams;
		workspaceId;
		repositorySegments;
		connectedCallback() {
			let e = Lp(this.routeParams, {
				workspaceId: this.workspaceId,
				repositorySegments: this.repositorySegments
			});
			this.replaceChildren(Rp(e));
		}
	});
}
function Lp(e, t = {}) {
	let n = new URLSearchParams(window.location.search), r = t.repositorySegments?.map((e) => e.trim()).filter(Boolean);
	return {
		workspaceId: t.workspaceId ?? n.get("workspaceId") ?? e?.params?.workspaceId ?? ru(),
		repositorySegments: r?.length ? r : void 0,
		projectName: n.get("projectName") ?? e?.params?.projectName ?? null
	};
}
function Rp(e) {
	let t = document.createElement("main");
	t.className = "epic-new", t.dataset.smoke = "epic-new";
	let n = document.createElement("h3");
	n.textContent = e.projectName ? `New epic in ${e.projectName}` : "New epic";
	let r = document.createElement("form"), i = document.createElement("input");
	i.required = !0, i.placeholder = "Epic title";
	let a = document.createElement("select");
	a.className = "epic-new-project-select", a.dataset.smoke = "epic-new-project";
	let o = document.createElement("option");
	o.value = "", o.textContent = "— no project —", a.append(o), wl(e.repositorySegments).then((t) => {
		let n = !1;
		for (let r of t) {
			if (!r.name) continue;
			let t = document.createElement("option");
			t.value = r.name, t.textContent = r.name, r.name === e.projectName && (t.selected = !0, n = !0), a.append(t);
		}
		if (e.projectName) {
			if (!n) {
				let t = document.createElement("option");
				t.value = e.projectName, t.textContent = e.projectName, t.selected = !0, a.append(t);
			}
			a.value = e.projectName;
		}
	}), a.addEventListener("change", () => {
		n.textContent = a.value ? `New epic in ${a.value}` : "New epic";
	});
	let s = document.createElement("textarea");
	s.rows = 5, s.placeholder = "Description (optional)";
	let c = document.createElement("button");
	c.type = "submit", c.textContent = "Create epic";
	let l = zp("", "warn");
	return l.setAttribute("role", "alert"), l.hidden = !0, r.append(i, a, s, c, l), r.addEventListener("submit", (t) => {
		t.preventDefault(), c.disabled = !0, l.hidden = !0, Zl(void 0, {
			workspaceId: e.workspaceId,
			projectName: a.value || e.projectName || null,
			title: i.value.trim(),
			bodyMarkdown: s.value
		}).then((t) => {
			window.location.assign(vl(Ep, `/${t.workspaceId}/${t.id}`, { repositorySegments: e.repositorySegments }));
		}).catch((e) => {
			l.textContent = e instanceof Error ? e.message : String(e), l.hidden = !1, c.disabled = !1;
		});
	}), t.append(n, r), t;
}
function zp(e, t) {
	let n = document.createElement("p");
	return n.className = `epic-line ${t}`, n.textContent = e, n;
}
//#endregion
export { Fp as default };
