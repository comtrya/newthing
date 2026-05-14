//#region packages/sdk-core/src/runtime.ts
async function e(e, r, i, a, o = {}) {
	let s = `${o.baseUrl ?? ""}/api/ops/${encodeURIComponent(e)}/${encodeURIComponent(r)}/${encodeURIComponent(i)}`, c = { "content-type": "application/json" };
	o.token && (c.authorization = `Bearer ${o.token}`);
	try {
		let e = await fetch(s, {
			method: "POST",
			headers: c,
			body: JSON.stringify(a ?? null),
			signal: o.signal,
			credentials: "include"
		}), r = await e.text();
		if (!e.ok) {
			let i;
			try {
				i = r ? JSON.parse(r) : void 0;
			} catch {
				i = void 0;
			}
			let a = n(e.status), o = typeof i?.message == "string" ? i.message : void 0;
			return {
				ok: !1,
				error: {
					code: t(i?.code) ?? a,
					message: o ?? (r || e.statusText),
					path: i?.path
				}
			};
		}
		return {
			ok: !0,
			value: r ? JSON.parse(r) : null
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
function t(e) {
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
function n(e) {
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
typeof fetch < "u" && fetch.bind(globalThis);
//#endregion
//#region packages/sdk-core/src/relationship-registry.ts
var r = Symbol.for("comtrya.relationship-registry");
i();
function i() {
	let e = globalThis;
	return e[r] ??= {
		types: /* @__PURE__ */ new Map(),
		providers: /* @__PURE__ */ new Map(),
		subscribers: /* @__PURE__ */ new Set()
	}, e[r];
}
//#endregion
//#region packages/sdk-core/src/route-registry.ts
function a(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`;
	return `/x/${e}${n === "/" ? "" : n.replace(/\/+$/, "")}`;
}
//#endregion
//#region node_modules/.bun/@vue+shared@3.5.34/node_modules/@vue/shared/dist/shared.esm-bundler.js
/* @__NO_SIDE_EFFECTS__ */
function o(e) {
	let t = /* @__PURE__ */ Object.create(null);
	for (let n of e.split(",")) t[n] = 1;
	return (e) => e in t;
}
var s = {}, c = [], l = () => {}, u = () => !1, d = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), f = (e) => e.startsWith("onUpdate:"), p = Object.assign, m = (e, t) => {
	let n = e.indexOf(t);
	n > -1 && e.splice(n, 1);
}, h = Object.prototype.hasOwnProperty, g = (e, t) => h.call(e, t), _ = Array.isArray, v = (e) => T(e) === "[object Map]", y = (e) => T(e) === "[object Set]", b = (e) => T(e) === "[object Date]", x = (e) => typeof e == "function", S = (e) => typeof e == "string", C = (e) => typeof e == "symbol", w = (e) => typeof e == "object" && !!e, ee = (e) => (w(e) || x(e)) && x(e.then) && x(e.catch), te = Object.prototype.toString, T = (e) => te.call(e), ne = (e) => T(e).slice(8, -1), re = (e) => T(e) === "[object Object]", ie = (e) => S(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, ae = /* @__PURE__ */ o(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"), oe = (e) => {
	let t = /* @__PURE__ */ Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, se = /-\w/g, E = oe((e) => e.replace(se, (e) => e.slice(1).toUpperCase())), D = /\B([A-Z])/g, O = oe((e) => e.replace(D, "-$1").toLowerCase()), ce = oe((e) => e.charAt(0).toUpperCase() + e.slice(1)), le = oe((e) => e ? `on${ce(e)}` : ""), k = (e, t) => !Object.is(e, t), ue = (e, ...t) => {
	for (let n = 0; n < e.length; n++) e[n](...t);
}, de = (e, t, n, r = !1) => {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		writable: r,
		value: n
	});
}, fe = (e) => {
	let t = parseFloat(e);
	return isNaN(t) ? e : t;
}, pe = (e) => {
	let t = S(e) ? Number(e) : NaN;
	return isNaN(t) ? e : t;
}, me, he = () => me ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function ge(e) {
	if (_(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = S(r) ? be(r) : ge(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (S(e) || w(e)) return e;
}
var _e = /;(?![^(]*\))/g, ve = /:([^]+)/, ye = /\/\*[^]*?\*\//g;
function be(e) {
	let t = {};
	return e.replace(ye, "").split(_e).forEach((e) => {
		if (e) {
			let n = e.split(ve);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function xe(e) {
	let t = "";
	if (S(e)) t = e;
	else if (_(e)) for (let n = 0; n < e.length; n++) {
		let r = xe(e[n]);
		r && (t += r + " ");
	}
	else if (w(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var Se = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Ce = /* @__PURE__ */ o(Se);
Se + "";
function we(e) {
	return !!e || e === "";
}
function Te(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = Ee(e[r], t[r]);
	return n;
}
function Ee(e, t) {
	if (e === t) return !0;
	let n = b(e), r = b(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = C(e), r = C(t), n || r) return e === t;
	if (n = _(e), r = _(t), n || r) return n && r ? Te(e, t) : !1;
	if (n = w(e), r = w(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !Ee(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
var De = (e) => !!(e && e.__v_isRef === !0), A = (e) => S(e) ? e : e == null ? "" : _(e) || w(e) && (e.toString === te || !x(e.toString)) ? De(e) ? A(e.value) : JSON.stringify(e, Oe, 2) : String(e), Oe = (e, t) => De(t) ? Oe(e, t.value) : v(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[ke(t, r) + " =>"] = n, e), {}) } : y(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => ke(e)) } : C(t) ? ke(t) : w(t) && !_(t) && !re(t) ? String(t) : t, ke = (e, t = "") => C(e) ? `Symbol(${e.description ?? t})` : e, j, Ae = class {
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
function je() {
	return j;
}
var M, Me = /* @__PURE__ */ new WeakSet(), Ne = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, j && (j.active ? j.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, Me.has(this) && (Me.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Le(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, Ye(this), Be(this);
		let e = M, t = N;
		M = this, N = !0;
		try {
			return this.fn();
		} finally {
			Ve(this), M = e, N = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) We(e);
			this.deps = this.depsTail = void 0, Ye(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? Me.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		He(this) && this.run();
	}
	get dirty() {
		return He(this);
	}
}, Pe = 0, Fe, Ie;
function Le(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = Ie, Ie = e;
		return;
	}
	e.next = Fe, Fe = e;
}
function Re() {
	Pe++;
}
function ze() {
	if (--Pe > 0) return;
	if (Ie) {
		let e = Ie;
		for (Ie = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; Fe;) {
		let t = Fe;
		for (Fe = void 0; t;) {
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
function Be(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Ve(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), We(r), Ge(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function He(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (Ue(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function Ue(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Xe) || (e.globalVersion = Xe, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !He(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = M, r = N;
	M = e, N = !0;
	try {
		Be(e);
		let n = e.fn(e._value);
		(t.version === 0 || k(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		M = n, N = r, Ve(e), e.flags &= -3;
	}
}
function We(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) We(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function Ge(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var N = !0, Ke = [];
function qe() {
	Ke.push(N), N = !1;
}
function Je() {
	let e = Ke.pop();
	N = e === void 0 ? !0 : e;
}
function Ye(e) {
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
var Xe = 0, Ze = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, Qe = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!M || !N || M === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== M) t = this.activeLink = new Ze(M, this), M.deps ? (t.prevDep = M.depsTail, M.depsTail.nextDep = t, M.depsTail = t) : M.deps = M.depsTail = t, $e(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = M.depsTail, t.nextDep = void 0, M.depsTail.nextDep = t, M.depsTail = t, M.deps === t && (M.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, Xe++, this.notify(e);
	}
	notify(e) {
		Re();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			ze();
		}
	}
};
function $e(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) $e(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var et = /* @__PURE__ */ new WeakMap(), tt = /* @__PURE__ */ Symbol(""), nt = /* @__PURE__ */ Symbol(""), rt = /* @__PURE__ */ Symbol("");
function P(e, t, n) {
	if (N && M) {
		let t = et.get(e);
		t || et.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new Qe()), r.map = t, r.key = n), r.track();
	}
}
function it(e, t, n, r, i, a) {
	let o = et.get(e);
	if (!o) {
		Xe++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (Re(), t === "clear") o.forEach(s);
	else {
		let i = _(e), a = i && ie(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === rt || !C(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(rt)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(tt)), v(e) && s(o.get(nt)));
				break;
			case "delete":
				i || (s(o.get(tt)), v(e) && s(o.get(nt)));
				break;
			case "set":
				v(e) && s(o.get(tt));
				break;
		}
	}
	ze();
}
function at(e) {
	let t = /* @__PURE__ */ I(e);
	return t === e ? t : (P(t, "iterate", rt), /* @__PURE__ */ F(e) ? t : t.map(L));
}
function ot(e) {
	return P(e = /* @__PURE__ */ I(e), "iterate", rt), e;
}
function st(e, t) {
	return /* @__PURE__ */ Wt(e) ? qt(/* @__PURE__ */ Ut(e) ? L(t) : t) : L(t);
}
var ct = {
	__proto__: null,
	[Symbol.iterator]() {
		return lt(this, Symbol.iterator, (e) => st(this, e));
	},
	concat(...e) {
		return at(this).concat(...e.map((e) => _(e) ? at(e) : e));
	},
	entries() {
		return lt(this, "entries", (e) => (e[1] = st(this, e[1]), e));
	},
	every(e, t) {
		return dt(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return dt(this, "filter", e, t, (e) => e.map((e) => st(this, e)), arguments);
	},
	find(e, t) {
		return dt(this, "find", e, t, (e) => st(this, e), arguments);
	},
	findIndex(e, t) {
		return dt(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return dt(this, "findLast", e, t, (e) => st(this, e), arguments);
	},
	findLastIndex(e, t) {
		return dt(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return dt(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return pt(this, "includes", e);
	},
	indexOf(...e) {
		return pt(this, "indexOf", e);
	},
	join(e) {
		return at(this).join(e);
	},
	lastIndexOf(...e) {
		return pt(this, "lastIndexOf", e);
	},
	map(e, t) {
		return dt(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return mt(this, "pop");
	},
	push(...e) {
		return mt(this, "push", e);
	},
	reduce(e, ...t) {
		return ft(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return ft(this, "reduceRight", e, t);
	},
	shift() {
		return mt(this, "shift");
	},
	some(e, t) {
		return dt(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return mt(this, "splice", e);
	},
	toReversed() {
		return at(this).toReversed();
	},
	toSorted(e) {
		return at(this).toSorted(e);
	},
	toSpliced(...e) {
		return at(this).toSpliced(...e);
	},
	unshift(...e) {
		return mt(this, "unshift", e);
	},
	values() {
		return lt(this, "values", (e) => st(this, e));
	}
};
function lt(e, t, n) {
	let r = ot(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ F(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var ut = Array.prototype;
function dt(e, t, n, r, i, a) {
	let o = ot(e), s = o !== e && !/* @__PURE__ */ F(e), c = o[t];
	if (c !== ut[t]) {
		let t = c.apply(e, a);
		return s ? L(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, st(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function ft(e, t, n, r) {
	let i = ot(e), a = i !== e && !/* @__PURE__ */ F(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = st(e, t)), n.call(this, t, st(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? st(e, c) : c;
}
function pt(e, t, n) {
	let r = /* @__PURE__ */ I(e);
	P(r, "iterate", rt);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ Gt(n[0]) ? (n[0] = /* @__PURE__ */ I(n[0]), r[t](...n)) : i;
}
function mt(e, t, n = []) {
	qe(), Re();
	let r = (/* @__PURE__ */ I(e))[t].apply(e, n);
	return ze(), Je(), r;
}
var ht = /* @__PURE__ */ o("__proto__,__v_isRef,__isVue"), gt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(C));
function _t(e) {
	C(e) || (e = String(e));
	let t = /* @__PURE__ */ I(this);
	return P(t, "has", e), t.hasOwnProperty(e);
}
var vt = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? It : Ft : i ? Pt : Nt).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = _(e);
		if (!r) {
			let e;
			if (a && (e = ct[t])) return e;
			if (t === "hasOwnProperty") return _t;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ R(e) ? e : n);
		if ((C(t) ? gt.has(t) : ht(t)) || (r || P(e, "get", t), i)) return o;
		if (/* @__PURE__ */ R(o)) {
			let e = a && ie(t) ? o : o.value;
			return r && w(e) ? /* @__PURE__ */ Vt(e) : e;
		}
		return w(o) ? r ? /* @__PURE__ */ Vt(o) : /* @__PURE__ */ zt(o) : o;
	}
}, yt = class extends vt {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = _(e) && ie(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ Wt(i);
			if (!/* @__PURE__ */ F(n) && !/* @__PURE__ */ Wt(n) && (i = /* @__PURE__ */ I(i), n = /* @__PURE__ */ I(n)), !a && /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : g(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ R(e) ? e : r);
		return e === /* @__PURE__ */ I(r) && (o ? k(n, i) && it(e, "set", t, n, i) : it(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = g(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && it(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!C(t) || !gt.has(t)) && P(e, "has", t), n;
	}
	ownKeys(e) {
		return P(e, "iterate", _(e) ? "length" : tt), Reflect.ownKeys(e);
	}
}, bt = class extends vt {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, xt = /* @__PURE__ */ new yt(), St = /* @__PURE__ */ new bt(), Ct = /* @__PURE__ */ new yt(!0), wt = (e) => e, Tt = (e) => Reflect.getPrototypeOf(e);
function Et(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ I(i), o = v(a), s = e === "entries" || e === Symbol.iterator && o, c = e === "keys" && o, l = i[e](...r), u = n ? wt : t ? qt : L;
		return !t && P(a, "iterate", c ? nt : tt), p(Object.create(l), { next() {
			let { value: e, done: t } = l.next();
			return t ? {
				value: e,
				done: t
			} : {
				value: s ? [u(e[0]), u(e[1])] : u(e),
				done: t
			};
		} });
	};
}
function Dt(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function Ot(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ I(r), a = /* @__PURE__ */ I(n);
			e || (k(n, a) && P(i, "get", n), P(i, "get", a));
			let { has: o } = Tt(i), s = t ? wt : e ? qt : L;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && P(/* @__PURE__ */ I(t), "iterate", tt), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ I(n), i = /* @__PURE__ */ I(t);
			return e || (k(t, i) && P(r, "has", t), P(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ I(a), s = t ? wt : e ? qt : L;
			return !e && P(o, "iterate", tt), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return p(n, e ? {
		add: Dt("add"),
		set: Dt("set"),
		delete: Dt("delete"),
		clear: Dt("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ I(this), r = Tt(n), i = /* @__PURE__ */ I(e), a = !t && !/* @__PURE__ */ F(e) && !/* @__PURE__ */ Wt(e) ? i : e;
			return r.has.call(n, a) || k(e, a) && r.has.call(n, e) || k(i, a) && r.has.call(n, i) || (n.add(a), it(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ F(n) && !/* @__PURE__ */ Wt(n) && (n = /* @__PURE__ */ I(n));
			let r = /* @__PURE__ */ I(this), { has: i, get: a } = Tt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ I(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? k(n, s) && it(r, "set", e, n, s) : it(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ I(this), { has: n, get: r } = Tt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ I(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && it(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ I(this), t = e.size !== 0, n = e.clear();
			return t && it(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = Et(r, e, t);
	}), n;
}
function kt(e, t) {
	let n = Ot(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(g(n, r) && r in t ? n : t, r, i);
}
var At = { get: /* @__PURE__ */ kt(!1, !1) }, jt = { get: /* @__PURE__ */ kt(!1, !0) }, Mt = { get: /* @__PURE__ */ kt(!0, !1) }, Nt = /* @__PURE__ */ new WeakMap(), Pt = /* @__PURE__ */ new WeakMap(), Ft = /* @__PURE__ */ new WeakMap(), It = /* @__PURE__ */ new WeakMap();
function Lt(e) {
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
function Rt(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : Lt(ne(e));
}
/* @__NO_SIDE_EFFECTS__ */
function zt(e) {
	return /* @__PURE__ */ Wt(e) ? e : Ht(e, !1, xt, At, Nt);
}
/* @__NO_SIDE_EFFECTS__ */
function Bt(e) {
	return Ht(e, !1, Ct, jt, Pt);
}
/* @__NO_SIDE_EFFECTS__ */
function Vt(e) {
	return Ht(e, !0, St, Mt, Ft);
}
function Ht(e, t, n, r, i) {
	if (!w(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = Rt(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function Ut(e) {
	return /* @__PURE__ */ Wt(e) ? /* @__PURE__ */ Ut(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function Wt(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function F(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function Gt(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function I(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ I(t) : e;
}
function Kt(e) {
	return !g(e, "__v_skip") && Object.isExtensible(e) && de(e, "__v_skip", !0), e;
}
var L = (e) => w(e) ? /* @__PURE__ */ zt(e) : e, qt = (e) => w(e) ? /* @__PURE__ */ Vt(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function R(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function z(e) {
	return Jt(e, !1);
}
function Jt(e, t) {
	return /* @__PURE__ */ R(e) ? e : new Yt(e, t);
}
var Yt = class {
	constructor(e, t) {
		this.dep = new Qe(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ I(e), this._value = t ? e : L(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ F(e) || /* @__PURE__ */ Wt(e);
		e = n ? e : /* @__PURE__ */ I(e), k(e, t) && (this._rawValue = e, this._value = n ? e : L(e), this.dep.trigger());
	}
};
function Xt(e) {
	return /* @__PURE__ */ R(e) ? e.value : e;
}
var Zt = {
	get: (e, t, n) => t === "__v_raw" ? e : Xt(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Qt(e) {
	return /* @__PURE__ */ Ut(e) ? e : new Proxy(e, Zt);
}
var $t = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new Qe(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Xe - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && M !== this) return Le(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return Ue(this), e && (e.version = this.dep.version), this._value;
	}
	set value(e) {
		this.setter && this.setter(e);
	}
};
/* @__NO_SIDE_EFFECTS__ */
function en(e, t, n = !1) {
	let r, i;
	return x(e) ? r = e : (r = e.get, i = e.set), new $t(r, i, n);
}
var tn = {}, nn = /* @__PURE__ */ new WeakMap(), rn = void 0;
function an(e, t = !1, n = rn) {
	if (n) {
		let t = nn.get(n);
		t || nn.set(n, t = []), t.push(e);
	}
}
function on(e, t, n = s) {
	let { immediate: r, deep: i, once: a, scheduler: o, augmentJob: c, call: u } = n, d = (e) => i ? e : /* @__PURE__ */ F(e) || i === !1 || i === 0 ? sn(e, 1) : sn(e), f, p, h, g, v = !1, y = !1;
	if (/* @__PURE__ */ R(e) ? (p = () => e.value, v = /* @__PURE__ */ F(e)) : /* @__PURE__ */ Ut(e) ? (p = () => d(e), v = !0) : _(e) ? (y = !0, v = e.some((e) => /* @__PURE__ */ Ut(e) || /* @__PURE__ */ F(e)), p = () => e.map((e) => {
		if (/* @__PURE__ */ R(e)) return e.value;
		if (/* @__PURE__ */ Ut(e)) return d(e);
		if (x(e)) return u ? u(e, 2) : e();
	})) : p = x(e) ? t ? u ? () => u(e, 2) : e : () => {
		if (h) {
			qe();
			try {
				h();
			} finally {
				Je();
			}
		}
		let t = rn;
		rn = f;
		try {
			return u ? u(e, 3, [g]) : e(g);
		} finally {
			rn = t;
		}
	} : l, t && i) {
		let e = p, t = i === !0 ? Infinity : i;
		p = () => sn(e(), t);
	}
	let b = je(), S = () => {
		f.stop(), b && b.active && m(b.effects, f);
	};
	if (a && t) {
		let e = t;
		t = (...t) => {
			e(...t), S();
		};
	}
	let C = y ? Array(e.length).fill(tn) : tn, w = (e) => {
		if (!(!(f.flags & 1) || !f.dirty && !e)) if (t) {
			let e = f.run();
			if (i || v || (y ? e.some((e, t) => k(e, C[t])) : k(e, C))) {
				h && h();
				let n = rn;
				rn = f;
				try {
					let n = [
						e,
						C === tn ? void 0 : y && C[0] === tn ? [] : C,
						g
					];
					C = e, u ? u(t, 3, n) : t(...n);
				} finally {
					rn = n;
				}
			}
		} else f.run();
	};
	return c && c(w), f = new Ne(p), f.scheduler = o ? () => o(w, !1) : w, g = (e) => an(e, !1, f), h = f.onStop = () => {
		let e = nn.get(f);
		if (e) {
			if (u) u(e, 4);
			else for (let t of e) t();
			nn.delete(f);
		}
	}, t ? r ? w(!0) : C = f.run() : o ? o(w.bind(null, !0), !0) : f.run(), S.pause = f.pause.bind(f), S.resume = f.resume.bind(f), S.stop = S, S;
}
function sn(e, t = Infinity, n) {
	if (t <= 0 || !w(e) || e.__v_skip || (n ||= /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t)) return e;
	if (n.set(e, t), t--, /* @__PURE__ */ R(e)) sn(e.value, t, n);
	else if (_(e)) for (let r = 0; r < e.length; r++) sn(e[r], t, n);
	else if (y(e) || v(e)) e.forEach((e) => {
		sn(e, t, n);
	});
	else if (re(e)) {
		for (let r in e) sn(e[r], t, n);
		for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && sn(e[r], t, n);
	}
	return e;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.34/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function cn(e, t, n, r) {
	try {
		return r ? e(...r) : e();
	} catch (e) {
		ln(e, t, n);
	}
}
function B(e, t, n, r) {
	if (x(e)) {
		let i = cn(e, t, n, r);
		return i && ee(i) && i.catch((e) => {
			ln(e, t, n);
		}), i;
	}
	if (_(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(B(e[a], t, n, r));
		return i;
	}
}
function ln(e, t, n, r = !0) {
	let i = t ? t.vnode : null, { errorHandler: a, throwUnhandledErrorInProduction: o } = t && t.appContext.config || s;
	if (t) {
		let r = t.parent, i = t.proxy, o = `https://vuejs.org/error-reference/#runtime-${n}`;
		for (; r;) {
			let t = r.ec;
			if (t) {
				for (let n = 0; n < t.length; n++) if (t[n](e, i, o) === !1) return;
			}
			r = r.parent;
		}
		if (a) {
			qe(), cn(a, null, 10, [
				e,
				i,
				o
			]), Je();
			return;
		}
	}
	un(e, n, i, r, o);
}
function un(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var V = [], H = -1, dn = [], fn = null, pn = 0, mn = /* @__PURE__ */ Promise.resolve(), hn = null;
function gn(e) {
	let t = hn || mn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function _n(e) {
	let t = H + 1, n = V.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = V[r], a = Cn(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function vn(e) {
	if (!(e.flags & 1)) {
		let t = Cn(e), n = V[V.length - 1];
		!n || !(e.flags & 2) && t >= Cn(n) ? V.push(e) : V.splice(_n(t), 0, e), e.flags |= 1, yn();
	}
}
function yn() {
	hn ||= mn.then(wn);
}
function bn(e) {
	_(e) ? dn.push(...e) : fn && e.id === -1 ? fn.splice(pn + 1, 0, e) : e.flags & 1 || (dn.push(e), e.flags |= 1), yn();
}
function xn(e, t, n = H + 1) {
	for (; n < V.length; n++) {
		let t = V[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			V.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function Sn(e) {
	if (dn.length) {
		let e = [...new Set(dn)].sort((e, t) => Cn(e) - Cn(t));
		if (dn.length = 0, fn) {
			fn.push(...e);
			return;
		}
		for (fn = e, pn = 0; pn < fn.length; pn++) {
			let e = fn[pn];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		fn = null, pn = 0;
	}
}
var Cn = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function wn(e) {
	try {
		for (H = 0; H < V.length; H++) {
			let e = V[H];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), cn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; H < V.length; H++) {
			let e = V[H];
			e && (e.flags &= -2);
		}
		H = -1, V.length = 0, Sn(e), hn = null, (V.length || dn.length) && wn(e);
	}
}
var U = null, Tn = null;
function En(e) {
	let t = U;
	return U = e, Tn = e && e.type.__scopeId || null, t;
}
function Dn(e, t = U, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && Ai(-1);
		let i = En(t), a;
		try {
			a = e(...n);
		} finally {
			En(i), r._d && Ai(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function On(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (qe(), B(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), Je());
	}
}
function kn(e, t) {
	if (Q) {
		let n = Q.provides, r = Q.parent && Q.parent.provides;
		r === n && (n = Q.provides = Object.create(r)), n[e] = t;
	}
}
function An(e, t, n = !1) {
	let r = Xi();
	if (r || Fr) {
		let i = Fr ? Fr._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && x(t) ? t.call(r && r.proxy) : t;
	}
}
var jn = /* @__PURE__ */ Symbol.for("v-scx"), Mn = () => An(jn);
function Nn(e, t, n) {
	return Pn(e, t, n);
}
function Pn(e, t, n = s) {
	let { immediate: r, deep: i, flush: a, once: o } = n, c = p({}, n), u = t && r || !t && a !== "post", d;
	if (na) {
		if (a === "sync") {
			let e = Mn();
			d = e.__watcherHandles ||= [];
		} else if (!u) {
			let e = () => {};
			return e.stop = l, e.resume = l, e.pause = l, e;
		}
	}
	let f = Q;
	c.call = (e, t, n) => B(e, f, t, n);
	let m = !1;
	a === "post" ? c.scheduler = (e) => {
		G(e, f && f.suspense);
	} : a !== "sync" && (m = !0, c.scheduler = (e, t) => {
		t ? e() : vn(e);
	}), c.augmentJob = (e) => {
		t && (e.flags |= 4), m && (e.flags |= 2, f && (e.id = f.uid, e.i = f));
	};
	let h = on(e, t, c);
	return na && (d ? d.push(h) : u && h()), h;
}
function Fn(e, t, n) {
	let r = this.proxy, i = S(e) ? e.includes(".") ? In(r, e) : () => r[e] : e.bind(r, r), a;
	x(t) ? a = t : (a = t.handler, n = t);
	let o = $i(this), s = Pn(i, a.bind(r), n);
	return o(), s;
}
function In(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var Ln = /* @__PURE__ */ Symbol("_vte"), Rn = (e) => e.__isTeleport, zn = /* @__PURE__ */ Symbol("_leaveCb");
function Bn(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, Bn(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function Vn(e, t) {
	return x(e) ? p({ name: e.name }, t, { setup: e }) : e;
}
function Hn(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function Un(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var Wn = /* @__PURE__ */ new WeakMap();
function Gn(e, t, n, r, i = !1) {
	if (_(e)) {
		e.forEach((e, a) => Gn(e, t && (_(t) ? t[a] : t), n, r, i));
		return;
	}
	if (qn(r) && !i) {
		r.shapeFlag & 512 && r.type.__asyncResolved && r.component.subTree.component && Gn(e, t, n, r.component.subTree);
		return;
	}
	let a = r.shapeFlag & 4 ? da(r.component) : r.el, o = i ? null : a, { i: c, r: l } = e, d = t && t.r, f = c.refs === s ? c.refs = {} : c.refs, p = c.setupState, h = /* @__PURE__ */ I(p), v = p === s ? u : (e) => Un(f, e) ? !1 : g(h, e), y = (e, t) => !(t && Un(f, t));
	if (d != null && d !== l) {
		if (Kn(t), S(d)) f[d] = null, v(d) && (p[d] = null);
		else if (/* @__PURE__ */ R(d)) {
			let e = t;
			y(d, e.k) && (d.value = null), e.k && (f[e.k] = null);
		}
	}
	if (x(l)) cn(l, c, 12, [o, f]);
	else {
		let t = S(l), r = /* @__PURE__ */ R(l);
		if (t || r) {
			let s = () => {
				if (e.f) {
					let n = t ? v(l) ? p[l] : f[l] : y(l) || !e.k ? l.value : f[e.k];
					if (i) _(n) && m(n, a);
					else if (_(n)) n.includes(a) || n.push(a);
					else if (t) f[l] = [a], v(l) && (p[l] = f[l]);
					else {
						let t = [a];
						y(l, e.k) && (l.value = t), e.k && (f[e.k] = t);
					}
				} else t ? (f[l] = o, v(l) && (p[l] = o)) : r && (y(l, e.k) && (l.value = o), e.k && (f[e.k] = o));
			};
			if (o) {
				let t = () => {
					s(), Wn.delete(e);
				};
				t.id = -1, Wn.set(e, t), G(t, n);
			} else Kn(e), s();
		}
	}
}
function Kn(e) {
	let t = Wn.get(e);
	t && (t.flags |= 8, Wn.delete(e));
}
he().requestIdleCallback, he().cancelIdleCallback;
var qn = (e) => !!e.type.__asyncLoader, Jn = (e) => e.type.__isKeepAlive;
function Yn(e, t) {
	Zn(e, "a", t);
}
function Xn(e, t) {
	Zn(e, "da", t);
}
function Zn(e, t, n = Q) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if ($n(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) Jn(e.parent.vnode) && Qn(r, t, n, e), e = e.parent;
	}
}
function Qn(e, t, n, r) {
	let i = $n(t, e, r, !0);
	or(() => {
		m(r[t], i);
	}, n);
}
function $n(e, t, n = Q, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			qe();
			let i = $i(n), a = B(t, n, e, r);
			return i(), Je(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var er = (e) => (t, n = Q) => {
	(!na || e === "sp") && $n(e, (...e) => t(...e), n);
}, tr = er("bm"), nr = er("m"), rr = er("bu"), ir = er("u"), ar = er("bum"), or = er("um"), sr = er("sp"), cr = er("rtg"), lr = er("rtc");
function ur(e, t = Q) {
	$n("ec", e, t);
}
var dr = /* @__PURE__ */ Symbol.for("v-ndc");
function fr(e, t, n, r) {
	let i, a = n && n[r], o = _(e);
	if (o || S(e)) {
		let n = o && /* @__PURE__ */ Ut(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ F(e), s = /* @__PURE__ */ Wt(e), e = ot(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? qt(L(e[n])) : L(e[n]) : e[n], n, void 0, a && a[n]);
	} else if (typeof e == "number") {
		i = Array(e);
		for (let n = 0; n < e; n++) i[n] = t(n + 1, n, void 0, a && a[n]);
	} else if (w(e)) if (e[Symbol.iterator]) i = Array.from(e, (e, n) => t(e, n, void 0, a && a[n]));
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
var pr = (e) => e ? ta(e) ? da(e) : pr(e.parent) : null, mr = /* @__PURE__ */ p(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => pr(e.parent),
	$root: (e) => pr(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => Cr(e),
	$forceUpdate: (e) => e.f ||= () => {
		vn(e.update);
	},
	$nextTick: (e) => e.n ||= gn.bind(e.proxy),
	$watch: (e) => Fn.bind(e)
}), hr = (e, t) => e !== s && !e.__isScriptSetup && g(e, t), gr = {
	get({ _: e }, t) {
		if (t === "__v_skip") return !0;
		let { ctx: n, setupState: r, data: i, props: a, accessCache: o, type: c, appContext: l } = e;
		if (t[0] !== "$") {
			let e = o[t];
			if (e !== void 0) switch (e) {
				case 1: return r[t];
				case 2: return i[t];
				case 4: return n[t];
				case 3: return a[t];
			}
			else if (hr(r, t)) return o[t] = 1, r[t];
			else if (i !== s && g(i, t)) return o[t] = 2, i[t];
			else if (g(a, t)) return o[t] = 3, a[t];
			else if (n !== s && g(n, t)) return o[t] = 4, n[t];
			else vr && (o[t] = 0);
		}
		let u = mr[t], d, f;
		if (u) return t === "$attrs" && P(e.attrs, "get", ""), u(e);
		if ((d = c.__cssModules) && (d = d[t])) return d;
		if (n !== s && g(n, t)) return o[t] = 4, n[t];
		if (f = l.config.globalProperties, g(f, t)) return f[t];
	},
	set({ _: e }, t, n) {
		let { data: r, setupState: i, ctx: a } = e;
		return hr(i, t) ? (i[t] = n, !0) : r !== s && g(r, t) ? (r[t] = n, !0) : g(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (a[t] = n, !0);
	},
	has({ _: { data: e, setupState: t, accessCache: n, ctx: r, appContext: i, props: a, type: o } }, c) {
		let l;
		return !!(n[c] || e !== s && c[0] !== "$" && g(e, c) || hr(t, c) || g(a, c) || g(r, c) || g(mr, c) || g(i.config.globalProperties, c) || (l = o.__cssModules) && l[c]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? g(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function _r(e) {
	return _(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var vr = !0;
function yr(e) {
	let t = Cr(e), n = e.proxy, r = e.ctx;
	vr = !1, t.beforeCreate && xr(t.beforeCreate, e, "bc");
	let { data: i, computed: a, methods: o, watch: s, provide: c, inject: u, created: d, beforeMount: f, mounted: p, beforeUpdate: m, updated: h, activated: g, deactivated: v, beforeDestroy: y, beforeUnmount: b, destroyed: S, unmounted: C, render: ee, renderTracked: te, renderTriggered: T, errorCaptured: ne, serverPrefetch: re, expose: ie, inheritAttrs: ae, components: oe, directives: se, filters: E } = t;
	if (u && br(u, r, null), o) for (let e in o) {
		let t = o[e];
		x(t) && (r[e] = t.bind(n));
	}
	if (i) {
		let t = i.call(n, n);
		w(t) && (e.data = /* @__PURE__ */ zt(t));
	}
	if (vr = !0, a) for (let e in a) {
		let t = a[e], i = $({
			get: x(t) ? t.bind(n, n) : x(t.get) ? t.get.bind(n, n) : l,
			set: !x(t) && x(t.set) ? t.set.bind(n) : l
		});
		Object.defineProperty(r, e, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		});
	}
	if (s) for (let e in s) Sr(s[e], r, n, e);
	if (c) {
		let e = x(c) ? c.call(n) : c;
		Reflect.ownKeys(e).forEach((t) => {
			kn(t, e[t]);
		});
	}
	d && xr(d, e, "c");
	function D(e, t) {
		_(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (D(tr, f), D(nr, p), D(rr, m), D(ir, h), D(Yn, g), D(Xn, v), D(ur, ne), D(lr, te), D(cr, T), D(ar, b), D(or, C), D(sr, re), _(ie)) if (ie.length) {
		let t = e.exposed ||= {};
		ie.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	ee && e.render === l && (e.render = ee), ae != null && (e.inheritAttrs = ae), oe && (e.components = oe), se && (e.directives = se), re && Hn(e);
}
function br(e, t, n = l) {
	_(e) && (e = Or(e));
	for (let n in e) {
		let r = e[n], i;
		i = w(r) ? "default" in r ? An(r.from || n, r.default, !0) : An(r.from || n) : An(r), /* @__PURE__ */ R(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function xr(e, t, n) {
	B(_(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function Sr(e, t, n, r) {
	let i = r.includes(".") ? In(n, r) : () => n[r];
	if (S(e)) {
		let n = t[e];
		x(n) && Nn(i, n);
	} else if (x(e)) Nn(i, e.bind(n));
	else if (w(e)) if (_(e)) e.forEach((e) => Sr(e, t, n, r));
	else {
		let r = x(e.handler) ? e.handler.bind(n) : t[e.handler];
		x(r) && Nn(i, r, e);
	}
}
function Cr(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => wr(c, e, o, !0)), wr(c, t, o)), w(t) && a.set(t, c), c;
}
function wr(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && wr(e, a, n, !0), i && i.forEach((t) => wr(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = Tr[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var Tr = {
	data: Er,
	props: Ar,
	emits: Ar,
	methods: kr,
	computed: kr,
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
	components: kr,
	directives: kr,
	watch: jr,
	provide: Er,
	inject: Dr
};
function Er(e, t) {
	return t ? e ? function() {
		return p(x(e) ? e.call(this, this) : e, x(t) ? t.call(this, this) : t);
	} : t : e;
}
function Dr(e, t) {
	return kr(Or(e), Or(t));
}
function Or(e) {
	if (_(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function W(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function kr(e, t) {
	return e ? p(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Ar(e, t) {
	return e ? _(e) && _(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : p(/* @__PURE__ */ Object.create(null), _r(e), _r(t ?? {})) : t;
}
function jr(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = p(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = W(e[r], t[r]);
	return n;
}
function Mr() {
	return {
		app: null,
		config: {
			isNativeTag: u,
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
var Nr = 0;
function Pr(e, t) {
	return function(n, r = null) {
		x(n) || (n = p({}, n)), r != null && !w(r) && (r = null);
		let i = Mr(), a = /* @__PURE__ */ new WeakSet(), o = [], s = !1, c = i.app = {
			_uid: Nr++,
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
				return a.has(e) || (e && x(e.install) ? (a.add(e), e.install(c, ...t)) : x(e) && (a.add(e), e(c, ...t))), c;
			},
			mixin(e) {
				return i.mixins.includes(e) || i.mixins.push(e), c;
			},
			component(e, t) {
				return t ? (i.components[e] = t, c) : i.components[e];
			},
			directive(e, t) {
				return t ? (i.directives[e] = t, c) : i.directives[e];
			},
			mount(a, o, l) {
				if (!s) {
					let u = c._ceVNode || Z(n, r);
					return u.appContext = i, l === !0 ? l = "svg" : l === !1 && (l = void 0), o && t ? t(u, a) : e(u, a, l), s = !0, c._container = a, a.__vue_app__ = c, da(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				s && (B(o, c._instance, 16), e(null, c._container), delete c._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, c;
			},
			runWithContext(e) {
				let t = Fr;
				Fr = c;
				try {
					return e();
				} finally {
					Fr = t;
				}
			}
		};
		return c;
	};
}
var Fr = null, Ir = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${E(t)}Modifiers`] || e[`${O(t)}Modifiers`];
function Lr(e, t, ...n) {
	if (e.isUnmounted) return;
	let r = e.vnode.props || s, i = n, a = t.startsWith("update:"), o = a && Ir(r, t.slice(7));
	o && (o.trim && (i = n.map((e) => S(e) ? e.trim() : e)), o.number && (i = n.map(fe)));
	let c, l = r[c = le(t)] || r[c = le(E(t))];
	!l && a && (l = r[c = le(O(t))]), l && B(l, e, 6, i);
	let u = r[c + "Once"];
	if (u) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[c]) return;
		e.emitted[c] = !0, B(u, e, 6, i);
	}
}
var Rr = /* @__PURE__ */ new WeakMap();
function zr(e, t, n = !1) {
	let r = n ? Rr : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, s = !1;
	if (!x(e)) {
		let r = (e) => {
			let n = zr(e, t, !0);
			n && (s = !0, p(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !s ? (w(e) && r.set(e, null), null) : (_(a) ? a.forEach((e) => o[e] = null) : p(o, a), w(e) && r.set(e, o), o);
}
function Br(e, t) {
	return !e || !d(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), g(e, t[0].toLowerCase() + t.slice(1)) || g(e, O(t)) || g(e, t));
}
function Vr(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: o, attrs: s, emit: c, render: l, renderCache: u, props: d, data: p, setupState: m, ctx: h, inheritAttrs: g } = e, _ = En(e), v, y;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			v = Hi(l.call(t, e, u, d, m, p, h)), y = s;
		} else {
			let e = t;
			v = Hi(e.length > 1 ? e(d, {
				attrs: s,
				slots: o,
				emit: c
			}) : e(d, null)), y = t.props ? s : Hr(s);
		}
	} catch (t) {
		Di.length = 0, ln(t, e, 1), v = Z(Ti);
	}
	let b = v;
	if (y && g !== !1) {
		let e = Object.keys(y), { shapeFlag: t } = b;
		e.length && t & 7 && (a && e.some(f) && (y = Ur(y, a)), b = zi(b, y, !1, !0));
	}
	return n.dirs && (b = zi(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && Bn(b, n.transition), v = b, En(_), v;
}
var Hr = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || d(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, Ur = (e, t) => {
	let n = {};
	for (let r in e) (!f(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function Wr(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? Gr(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (Kr(o, r, n) && !Br(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? Gr(r, o, l) : !0 : !!o;
	return !1;
}
function Gr(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (Kr(t, e, a) && !Br(n, a)) return !0;
	}
	return !1;
}
function Kr(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && w(r) && w(i) ? !Ee(r, i) : r !== i;
}
function qr({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var Jr = {}, Yr = () => Object.create(Jr), Xr = (e) => Object.getPrototypeOf(e) === Jr;
function Zr(e, t, n, r = !1) {
	let i = {}, a = Yr();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), $r(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ Bt(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Qr(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ I(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (Br(e.emitsOptions, o)) continue;
				let u = t[o];
				if (c) if (g(a, o)) u !== a[o] && (a[o] = u, l = !0);
				else {
					let t = E(o);
					i[t] = ei(c, s, t, u, e, !1);
				}
				else u !== a[o] && (a[o] = u, l = !0);
			}
		}
	} else {
		$r(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !g(t, a) && ((r = O(a)) === a || !g(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = ei(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !g(t, e)) && (delete a[e], l = !0);
	}
	l && it(e.attrs, "set", "");
}
function $r(e, t, n, r) {
	let [i, a] = e.propsOptions, o = !1, c;
	if (t) for (let s in t) {
		if (ae(s)) continue;
		let l = t[s], u;
		i && g(i, u = E(s)) ? !a || !a.includes(u) ? n[u] = l : (c ||= {})[u] = l : Br(e.emitsOptions, s) || (!(s in r) || l !== r[s]) && (r[s] = l, o = !0);
	}
	if (a) {
		let t = /* @__PURE__ */ I(n), r = c || s;
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			n[s] = ei(i, t, s, r[s], e, !g(r, s));
		}
	}
	return o;
}
function ei(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = g(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && x(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = $i(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === O(n)) && (r = !0));
	}
	return r;
}
var ti = /* @__PURE__ */ new WeakMap();
function ni(e, t, n = !1) {
	let r = n ? ti : t.propsCache, i = r.get(e);
	if (i) return i;
	let a = e.props, o = {}, l = [], u = !1;
	if (!x(e)) {
		let r = (e) => {
			u = !0;
			let [n, r] = ni(e, t, !0);
			p(o, n), r && l.push(...r);
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	if (!a && !u) return w(e) && r.set(e, c), c;
	if (_(a)) for (let e = 0; e < a.length; e++) {
		let t = E(a[e]);
		ri(t) && (o[t] = s);
	}
	else if (a) for (let e in a) {
		let t = E(e);
		if (ri(t)) {
			let n = a[e], r = o[t] = _(n) || x(n) ? { type: n } : p({}, n), i = r.type, s = !1, c = !0;
			if (_(i)) for (let e = 0; e < i.length; ++e) {
				let t = i[e], n = x(t) && t.name;
				if (n === "Boolean") {
					s = !0;
					break;
				} else n === "String" && (c = !1);
			}
			else s = x(i) && i.name === "Boolean";
			r[0] = s, r[1] = c, (s || g(r, "default")) && l.push(t);
		}
	}
	let d = [o, l];
	return w(e) && r.set(e, d), d;
}
function ri(e) {
	return e[0] !== "$" && !ae(e);
}
var ii = (e) => e === "_" || e === "_ctx" || e === "$stable", ai = (e) => _(e) ? e.map(Hi) : [Hi(e)], oi = (e, t, n) => {
	if (t._n) return t;
	let r = Dn((...e) => ai(t(...e)), n);
	return r._c = !1, r;
}, si = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (ii(n)) continue;
		let i = e[n];
		if (x(i)) t[n] = oi(n, i, r);
		else if (i != null) {
			let e = ai(i);
			t[n] = () => e;
		}
	}
}, ci = (e, t) => {
	let n = ai(t);
	e.slots.default = () => n;
}, li = (e, t, n) => {
	for (let r in t) (n || !ii(r)) && (e[r] = t[r]);
}, ui = (e, t, n) => {
	let r = e.slots = Yr();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (li(r, t, n), n && de(r, "_", e, !0)) : si(t, r);
	} else t && ci(e, t);
}, di = (e, t, n) => {
	let { vnode: r, slots: i } = e, a = !0, o = s;
	if (r.shapeFlag & 32) {
		let e = t._;
		e ? n && e === 1 ? a = !1 : li(i, t, n) : (a = !t.$stable, si(t, i)), o = t;
	} else t && (ci(e, t), o = { default: 1 });
	if (a) for (let e in i) !ii(e) && o[e] == null && delete i[e];
}, G = Ci;
function fi(e) {
	return pi(e);
}
function pi(e, t) {
	let n = he();
	n.__VUE__ = !0;
	let { insert: r, remove: i, patchProp: a, createElement: o, createText: u, createComment: d, setText: f, setElementText: p, parentNode: m, nextSibling: h, setScopeId: g = l, insertStaticContent: _ } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Pi(e, t) && (r = ye(e), pe(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case wi:
				y(e, t, n, r);
				break;
			case Ti:
				b(e, t, n, r);
				break;
			case Ei:
				e ?? x(t, n, r, o);
				break;
			case K:
				oe(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? se(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, Se);
		}
		u != null && i ? Gn(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && Gn(e.ref, null, a, e, !0);
	}, y = (e, t, n, i) => {
		if (e == null) r(t.el = u(t.children), n, i);
		else {
			let n = t.el = e.el;
			t.children !== e.children && f(n, t.children);
		}
	}, b = (e, t, n, i) => {
		e == null ? r(t.el = d(t.children || ""), n, i) : t.el = e.el;
	}, x = (e, t, n, r) => {
		[e.el, e.anchor] = _(e.children, t, n, r, e.el, e.anchor);
	}, S = ({ el: e, anchor: t }, n, i) => {
		let a;
		for (; e && e !== t;) a = h(e), r(e, n, i), e = a;
		r(t, n, i);
	}, C = ({ el: e, anchor: t }) => {
		let n;
		for (; e && e !== t;) n = h(e), i(e), e = n;
		i(t);
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
	}, ee = (e, t, n, i, s, c, l, u) => {
		let d, f, { props: m, shapeFlag: h, transition: g, dirs: _ } = e;
		if (d = e.el = o(e.type, c, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && T(e.children, d, null, i, s, mi(e, c), l, u), _ && On(e, null, i, "created"), te(d, e, e.scopeId, l, i), m) {
			for (let e in m) e !== "value" && !ae(e) && a(d, e, null, m[e], c, i);
			"value" in m && a(d, "value", null, m.value, c), (f = m.onVnodeBeforeMount) && Ki(f, i, e);
		}
		_ && On(e, null, i, "beforeMount");
		let v = gi(s, g);
		v && g.beforeEnter(d), r(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && G(() => {
			try {
				f && Ki(f, i, e), v && g.enter(d), _ && On(e, null, i, "mounted");
			} finally {}
		}, s);
	}, te = (e, t, n, r, i) => {
		if (n && g(e, n), r) for (let t = 0; t < r.length; t++) g(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || Si(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				te(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, T = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) v(null, e[l] = s ? Ui(e[l]) : Hi(e[l]), t, n, r, i, a, o, s);
	}, ne = (e, t, n, r, i, o, c) => {
		let l = t.el = e.el, { patchFlag: u, dynamicChildren: d, dirs: f } = t;
		u |= e.patchFlag & 16;
		let m = e.props || s, h = t.props || s, g;
		if (n && hi(n, !1), (g = h.onVnodeBeforeUpdate) && Ki(g, n, t, e), f && On(t, e, n, "beforeUpdate"), n && hi(n, !0), (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ""), d ? re(e.dynamicChildren, d, l, n, r, mi(t, i), o) : c || le(e, t, l, null, n, r, mi(t, i), o, !1), u > 0) {
			if (u & 16) ie(l, m, h, n, i);
			else if (u & 2 && m.class !== h.class && a(l, "class", null, h.class, i), u & 4 && a(l, "style", m.style, h.style, i), u & 8) {
				let e = t.dynamicProps;
				for (let t = 0; t < e.length; t++) {
					let r = e[t], o = m[r], s = h[r];
					(s !== o || r === "value") && a(l, r, o, s, i, n);
				}
			}
			u & 1 && e.children !== t.children && p(l, t.children);
		} else !c && d == null && ie(l, m, h, n, i);
		((g = h.onVnodeUpdated) || f) && G(() => {
			g && Ki(g, n, t, e), f && On(t, e, n, "updated");
		}, r);
	}, re = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			v(c, l, c.el && (c.type === K || !Pi(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0);
		}
	}, ie = (e, t, n, r, i) => {
		if (t !== n) {
			if (t !== s) for (let o in t) !ae(o) && !(o in n) && a(e, o, t[o], null, i, r);
			for (let o in n) {
				if (ae(o)) continue;
				let s = n[o], c = t[o];
				s !== c && o !== "value" && a(e, o, c, s, i, r);
			}
			"value" in n && a(e, "value", t.value, n.value, i);
		}
	}, oe = (e, t, n, i, a, o, s, c, l) => {
		let d = t.el = e ? e.el : u(""), f = t.anchor = e ? e.anchor : u(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (c = c ? c.concat(h) : h), e == null ? (r(d, n, i), r(f, n, i), T(t.children || [], n, f, a, o, s, c, l)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (re(e.dynamicChildren, m, n, a, o, s, c), (t.key != null || a && t === a.subTree) && _i(e, t, !0)) : le(e, t, n, f, a, o, s, c, l);
	}, se = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : E(t, n, r, i, a, o, c) : D(e, t, c);
	}, E = (e, t, n, r, i, a, o) => {
		let s = e.component = Yi(e, r, i);
		if (Jn(e) && (s.ctx.renderer = Se), ra(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, O, o), !e.el) {
				let r = s.subTree = Z(Ti);
				b(null, r, t, n), e.placeholder = r.el;
			}
		} else O(s, e, t, n, i, a, o);
	}, D = (e, t, n) => {
		let r = t.component = e.component;
		if (Wr(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			ce(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, O = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = yi(e);
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
				hi(e, !1), t ? (t.el = c.el, ce(e, t, o)) : t = c, n && ue(n), (d = t.props && t.props.onVnodeBeforeUpdate) && Ki(d, s, t, c), hi(e, !0);
				let f = Vr(e), p = e.subTree;
				e.subTree = f, v(p, f, m(p.el), ye(p), e, i, a), t.el = f.el, u === null && qr(e, f.el), r && G(r, i), (d = t.props && t.props.onVnodeUpdated) && G(() => Ki(d, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = qn(t);
				if (hi(e, !1), l && ue(l), !m && (o = c && c.onVnodeBeforeMount) && Ki(o, d, t), hi(e, !0), s && we) {
					let t = () => {
						e.subTree = Vr(e), we(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Vr(e);
					v(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && G(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					G(() => Ki(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && qn(d.vnode) && d.vnode.shapeFlag & 256) && e.a && G(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new Ne(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => vn(u), hi(e, !0), l();
	}, ce = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Qr(e, t.props, r, n), di(e, t.children, n), qe(), xn(e), Je();
	}, le = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, u = e ? e.shapeFlag : 0, d = t.children, { patchFlag: f, shapeFlag: m } = t;
		if (f > 0) {
			if (f & 128) {
				de(l, d, n, r, i, a, o, s, c);
				return;
			} else if (f & 256) {
				k(l, d, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (u & 16 && ve(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? de(l, d, n, r, i, a, o, s, c) : ve(l, i, a, !0) : (u & 8 && p(n, ""), m & 16 && T(d, n, r, i, a, o, s, c));
	}, k = (e, t, n, r, i, a, o, s, l) => {
		e ||= c, t ||= c;
		let u = e.length, d = t.length, f = Math.min(u, d), p;
		for (p = 0; p < f; p++) {
			let r = t[p] = l ? Ui(t[p]) : Hi(t[p]);
			v(e[p], r, n, null, i, a, o, s, l);
		}
		u > d ? ve(e, i, a, !0, !1, f) : T(t, n, r, i, a, o, s, l, f);
	}, de = (e, t, n, r, i, a, o, s, l) => {
		let u = 0, d = t.length, f = e.length - 1, p = d - 1;
		for (; u <= f && u <= p;) {
			let r = e[u], c = t[u] = l ? Ui(t[u]) : Hi(t[u]);
			if (Pi(r, c)) v(r, c, n, null, i, a, o, s, l);
			else break;
			u++;
		}
		for (; u <= f && u <= p;) {
			let r = e[f], c = t[p] = l ? Ui(t[p]) : Hi(t[p]);
			if (Pi(r, c)) v(r, c, n, null, i, a, o, s, l);
			else break;
			f--, p--;
		}
		if (u > f) {
			if (u <= p) {
				let e = p + 1, c = e < d ? t[e].el : r;
				for (; u <= p;) v(null, t[u] = l ? Ui(t[u]) : Hi(t[u]), n, c, i, a, o, s, l), u++;
			}
		} else if (u > p) for (; u <= f;) pe(e[u], i, a, !0), u++;
		else {
			let m = u, h = u, g = /* @__PURE__ */ new Map();
			for (u = h; u <= p; u++) {
				let e = t[u] = l ? Ui(t[u]) : Hi(t[u]);
				e.key != null && g.set(e.key, u);
			}
			let _, y = 0, b = p - h + 1, x = !1, S = 0, C = Array(b);
			for (u = 0; u < b; u++) C[u] = 0;
			for (u = m; u <= f; u++) {
				let r = e[u];
				if (y >= b) {
					pe(r, i, a, !0);
					continue;
				}
				let c;
				if (r.key != null) c = g.get(r.key);
				else for (_ = h; _ <= p; _++) if (C[_ - h] === 0 && Pi(r, t[_])) {
					c = _;
					break;
				}
				c === void 0 ? pe(r, i, a, !0) : (C[c - h] = u + 1, c >= S ? S = c : x = !0, v(r, t[c], n, null, i, a, o, s, l), y++);
			}
			let w = x ? vi(C) : c;
			for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
				let e = h + u, c = t[e], f = t[e + 1], p = e + 1 < d ? f.el || xi(f) : r;
				C[u] === 0 ? v(null, c, n, p, i, a, o, s, l) : x && (_ < 0 || u !== w[_] ? fe(c, n, p, 2) : _--);
			}
		}
	}, fe = (e, t, n, a, o = null) => {
		let { el: s, type: c, transition: l, children: u, shapeFlag: d } = e;
		if (d & 6) {
			fe(e.component.subTree, t, n, a);
			return;
		}
		if (d & 128) {
			e.suspense.move(t, n, a);
			return;
		}
		if (d & 64) {
			c.move(e, t, n, Se);
			return;
		}
		if (c === K) {
			r(s, t, n);
			for (let e = 0; e < u.length; e++) fe(u[e], t, n, a);
			r(e.anchor, t, n);
			return;
		}
		if (c === Ei) {
			S(e, t, n);
			return;
		}
		if (a !== 2 && d & 1 && l) if (a === 0) l.beforeEnter(s), r(s, t, n), G(() => l.enter(s), o);
		else {
			let { leave: a, delayLeave: o, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? i(s) : r(s, t, n);
			}, d = () => {
				s._isLeaving && s[zn](!0), a(s, () => {
					u(), c && c();
				});
			};
			o ? o(s, u, d) : d();
		}
		else r(s, t, n);
	}, pe = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (qe(), Gn(s, null, n, e, !0), Je()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !qn(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Ki(_, t, e), u & 6) _e(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && On(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, Se, r) : l && !l.hasOnce && (a !== K || d > 0 && d & 64) ? ve(l, t, n, !1, !0) : (a === K && d & 384 || !i && u & 16) && ve(c, t, n), r && me(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && G(() => {
			_ && Ki(_, t, e), h && On(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, me = (e) => {
		let { type: t, el: n, anchor: r, transition: a } = e;
		if (t === K) {
			ge(n, r);
			return;
		}
		if (t === Ei) {
			C(e);
			return;
		}
		let o = () => {
			i(n), a && !a.persisted && a.afterLeave && a.afterLeave();
		};
		if (e.shapeFlag & 1 && a && !a.persisted) {
			let { leave: t, delayLeave: r } = a, i = () => t(n, o);
			r ? r(e.el, o, i) : i();
		} else o();
	}, ge = (e, t) => {
		let n;
		for (; e !== t;) n = h(e), i(e), e = n;
		i(t);
	}, _e = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		bi(c), bi(l), r && ue(r), i.stop(), a && (a.flags |= 8, pe(o, e, t, n)), s && G(s, t), G(() => {
			e.isUnmounted = !0;
		}, t);
	}, ve = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) pe(e[o], t, n, r, i);
	}, ye = (e) => {
		if (e.shapeFlag & 6) return ye(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = h(e.anchor || e.el), n = t && t[Ln];
		return n ? h(n) : t;
	}, be = !1, xe = (e, t, n) => {
		let r;
		e == null ? t._vnode && (pe(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, be ||= (be = !0, xn(r), Sn(), !1);
	}, Se = {
		p: v,
		um: pe,
		m: fe,
		r: me,
		mt: E,
		mc: T,
		pc: le,
		pbc: re,
		n: ye,
		o: e
	}, Ce, we;
	return t && ([Ce, we] = t(Se)), {
		render: xe,
		hydrate: Ce,
		createApp: Pr(xe, Ce)
	};
}
function mi({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function hi({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function gi(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function _i(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (_(r) && _(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Ui(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && _i(t, a)), a.type === wi && (a.patchFlag === -1 && (a = i[e] = Ui(a)), a.el = t.el), a.type === Ti && !a.el && (a.el = t.el);
	}
}
function vi(e) {
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
function yi(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : yi(t);
}
function bi(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function xi(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? xi(t.subTree) : null;
}
var Si = (e) => e.__isSuspense;
function Ci(e, t) {
	t && t.pendingBranch ? _(e) ? t.effects.push(...e) : t.effects.push(e) : bn(e);
}
var K = /* @__PURE__ */ Symbol.for("v-fgt"), wi = /* @__PURE__ */ Symbol.for("v-txt"), Ti = /* @__PURE__ */ Symbol.for("v-cmt"), Ei = /* @__PURE__ */ Symbol.for("v-stc"), Di = [], q = null;
function J(e = !1) {
	Di.push(q = e ? null : []);
}
function Oi() {
	Di.pop(), q = Di[Di.length - 1] || null;
}
var ki = 1;
function Ai(e, t = !1) {
	ki += e, e < 0 && q && t && (q.hasOnce = !0);
}
function ji(e) {
	return e.dynamicChildren = ki > 0 ? q || c : null, Oi(), ki > 0 && q && q.push(e), e;
}
function Y(e, t, n, r, i, a) {
	return ji(X(e, t, n, r, i, a, !0));
}
function Mi(e, t, n, r, i) {
	return ji(Z(e, t, n, r, i, !0));
}
function Ni(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function Pi(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Fi = ({ key: e }) => e ?? null, Ii = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : S(e) || /* @__PURE__ */ R(e) || x(e) ? {
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
		key: t && Fi(t),
		ref: t && Ii(t),
		scopeId: Tn,
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
	return s ? (Wi(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= S(n) ? 8 : 16), ki > 0 && !o && q && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && q.push(c), c;
}
var Z = Li;
function Li(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === dr) && (e = Ti), Ni(e)) {
		let r = zi(e, t, !0);
		return n && Wi(r, n), ki > 0 && !a && q && (r.shapeFlag & 6 ? q[q.indexOf(e)] = r : q.push(r)), r.patchFlag = -2, r;
	}
	if (fa(e) && (e = e.__vccOpts), t) {
		t = Ri(t);
		let { class: e, style: n } = t;
		e && !S(e) && (t.class = xe(e)), w(n) && (/* @__PURE__ */ Gt(n) && !_(n) && (n = p({}, n)), t.style = ge(n));
	}
	let o = S(e) ? 1 : Si(e) ? 128 : Rn(e) ? 64 : w(e) ? 4 : x(e) ? 2 : 0;
	return X(e, t, n, r, i, o, a, !0);
}
function Ri(e) {
	return e ? /* @__PURE__ */ Gt(e) || Xr(e) ? p({}, e) : e : null;
}
function zi(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? Gi(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && Fi(l),
		ref: t && t.ref ? n && a ? _(a) ? a.concat(Ii(t)) : [a, Ii(t)] : Ii(t) : a,
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
		ssContent: e.ssContent && zi(e.ssContent),
		ssFallback: e.ssFallback && zi(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && Bn(u, c.clone(u)), u;
}
function Bi(e = " ", t = 0) {
	return Z(wi, null, e, t);
}
function Vi(e = "", t = !1) {
	return t ? (J(), Mi(Ti, null, e)) : Z(Ti, null, e);
}
function Hi(e) {
	return e == null || typeof e == "boolean" ? Z(Ti) : _(e) ? Z(K, null, e.slice()) : Ni(e) ? Ui(e) : Z(wi, null, String(e));
}
function Ui(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : zi(e);
}
function Wi(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (_(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), Wi(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Xr(t) ? t._ctx = U : r === 3 && U && (U.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else x(t) ? (t = {
		default: t,
		_ctx: U
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Bi(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Gi(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = xe([t.class, r.class]));
		else if (e === "style") t.style = ge([t.style, r.style]);
		else if (d(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(_(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !f(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Ki(e, t, n, r = null) {
	B(e, t, 7, [n, r]);
}
var qi = Mr(), Ji = 0;
function Yi(e, t, n) {
	let r = e.type, i = (t ? t.appContext : e.appContext) || qi, a = {
		uid: Ji++,
		vnode: e,
		type: r,
		parent: t,
		appContext: i,
		root: null,
		next: null,
		subTree: null,
		effect: null,
		update: null,
		job: null,
		scope: new Ae(!0),
		render: null,
		proxy: null,
		exposed: null,
		exposeProxy: null,
		withProxy: null,
		provides: t ? t.provides : Object.create(i.provides),
		ids: t ? t.ids : [
			"",
			0,
			0
		],
		accessCache: null,
		renderCache: [],
		components: null,
		directives: null,
		propsOptions: ni(r, i),
		emitsOptions: zr(r, i),
		emit: null,
		emitted: null,
		propsDefaults: s,
		inheritAttrs: r.inheritAttrs,
		ctx: s,
		data: s,
		props: s,
		attrs: s,
		slots: s,
		refs: s,
		setupState: s,
		setupContext: null,
		suspense: n,
		suspenseId: n ? n.pendingId : 0,
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
	return a.ctx = { _: a }, a.root = t ? t.root : a, a.emit = Lr.bind(null, a), e.ce && e.ce(a), a;
}
var Q = null, Xi = () => Q || U, Zi, Qi;
{
	let e = he(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Zi = t("__VUE_INSTANCE_SETTERS__", (e) => Q = e), Qi = t("__VUE_SSR_SETTERS__", (e) => na = e);
}
var $i = (e) => {
	let t = Q;
	return Zi(e), e.scope.on(), () => {
		e.scope.off(), Zi(t);
	};
}, ea = () => {
	Q && Q.scope.off(), Zi(null);
};
function ta(e) {
	return e.vnode.shapeFlag & 4;
}
var na = !1;
function ra(e, t = !1, n = !1) {
	t && Qi(t);
	let { props: r, children: i } = e.vnode, a = ta(e);
	Zr(e, r, a, t), ui(e, i, n || t);
	let o = a ? ia(e, t) : void 0;
	return t && Qi(!1), o;
}
function ia(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, gr);
	let { setup: r } = n;
	if (r) {
		qe();
		let n = e.setupContext = r.length > 1 ? ua(e) : null, i = $i(e), a = cn(r, e, 0, [e.props, n]), o = ee(a);
		if (Je(), i(), (o || e.sp) && !qn(e) && Hn(e), o) {
			if (a.then(ea, ea), t) return a.then((n) => {
				aa(e, n, t);
			}).catch((t) => {
				ln(t, e, 0);
			});
			e.asyncDep = a;
		} else aa(e, a, t);
	} else ca(e, t);
}
function aa(e, t, n) {
	x(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : w(t) && (e.setupState = Qt(t)), ca(e, n);
}
var oa, sa;
function ca(e, t, n) {
	let r = e.type;
	if (!e.render) {
		if (!t && oa && !r.render) {
			let t = r.template || Cr(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: i } = e.appContext.config, { delimiters: a, compilerOptions: o } = r;
				r.render = oa(t, p(p({
					isCustomElement: n,
					delimiters: a
				}, i), o));
			}
		}
		e.render = r.render || l, sa && sa(e);
	}
	{
		let t = $i(e);
		qe();
		try {
			yr(e);
		} finally {
			Je(), t();
		}
	}
}
var la = { get(e, t) {
	return P(e, "get", ""), e[t];
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
	return e.exposed ? e.exposeProxy ||= new Proxy(Qt(Kt(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in mr) return mr[n](e);
		},
		has(e, t) {
			return t in e || t in mr;
		}
	}) : e.proxy;
}
function fa(e) {
	return x(e) && "__vccOpts" in e;
}
var $ = (e, t) => /* @__PURE__ */ en(e, t, na), pa = "3.5.34", ma = void 0, ha = typeof window < "u" && window.trustedTypes;
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
	let r = e.style, i = S(n), a = !1;
	if (n && !i) {
		if (t) if (S(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? Aa(r, t, "");
		}
		else for (let e in t) n[e] ?? Aa(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? Aa(r, i, "") : Pa(e, i, !S(t) && t ? t[i] : void 0, o) || Aa(r, i, o);
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
	if (_(n)) n.forEach((n) => Aa(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = Na(e, t);
		ka.test(n) ? e.setProperty(O(r), n.replace(ka, ""), "important") : e[r] = n;
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
	let r = E(t);
	if (r !== "filter" && r in e) return Ma[t] = r;
	r = ce(r);
	for (let n = 0; n < ja.length; n++) {
		let i = ja[n] + r;
		if (i in e) return Ma[t] = i;
	}
	return t;
}
function Pa(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && S(r) && n === r;
}
var Fa = "http://www.w3.org/1999/xlink";
function Ia(e, t, n, r, i, a = Ce(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Fa, t.slice(6, t.length)) : e.setAttributeNS(Fa, t, n) : n == null || a && !we(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : C(n) ? String(n) : n);
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
		r === "boolean" ? n = we(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
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
	return [e[2] === ":" ? e.slice(3) : O(e.slice(2)), t];
}
var Wa = 0, Ga = /* @__PURE__ */ Promise.resolve(), Ka = () => Wa ||= (Ga.then(() => Wa = 0), Date.now());
function qa(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		B(Ja(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Ka(), n;
}
function Ja(e, t) {
	if (_(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Ya = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Xa = (e, t, n, r, i, a) => {
	let o = i === "svg";
	t === "class" ? Ca(e, r, o) : t === "style" ? Oa(e, n, r) : d(t) ? f(t) || Va(e, t, n, r, a) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Za(e, t, r, o)) ? (La(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ia(e, t, r, o, a, t !== "value")) : e._isVueCE && (Qa(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !S(r))) ? La(e, E(t), r, a, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Ia(e, t, r, o));
};
function Za(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Ya(t) && x(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Ya(t) && S(n) ? !1 : t in e;
}
function Qa(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = E(t);
	return Array.isArray(n) ? n.some((e) => E(e) === r) : Object.keys(n).some((e) => E(e) === r);
}
var $a = {};
/* @__NO_SIDE_EFFECTS__ */
function eo(e, t, n) {
	let r = /* @__PURE__ */ Vn(e, t);
	re(r) && (r = p({}, r, t));
	class i extends no {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var to = typeof HTMLElement < "u" ? HTMLElement : class {}, no = class e extends to {
	constructor(e, t = {}, n = so) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== so ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(p({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, gn(() => {
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
			if (n && !_(n)) for (let e in n) {
				let t = n[e];
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = pe(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[E(e)] = !0);
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
		if (t) for (let e in t) g(this, e) || Object.defineProperty(this, e, { get: () => Xt(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = _(t) ? t : Object.keys(t || {});
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : $a, r = E(e);
		t && this._numberProps && this._numberProps[r] && (n = pe(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === $a ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(O(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(O(e), t + "") : t || this.removeAttribute(O(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), oo(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Z(this._def, p(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, re(t[0]) ? p({ detail: t }, t[0]) : { detail: t }));
			};
			e.emit = (e, ...n) => {
				t(e, n), O(e) !== e && t(O(e), n);
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
}, ro = /* @__PURE__ */ p({ patchProp: Xa }, xa), io;
function ao() {
	return io ||= fi(ro);
}
var oo = ((...e) => {
	ao().render(...e);
}), so = ((...e) => {
	let t = ao().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = lo(e);
		if (!r) return;
		let i = t._component;
		!x(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, co(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function co(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function lo(e) {
	return S(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function uo(e) {
	fo(e.tagName, e.component);
	let t = /* @__PURE__ */ eo(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(mo(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function fo(e, t) {
	if (typeof document > "u") return;
	let n = po(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function po(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function mo(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_epics/dist/ext_epics.client.ts
var ho = {
	createEpic: async (t) => e("ext_epics", "epics", "create-epic", t),
	changeStateEpic: async (t) => e("ext_epics", "epics", "change-state-epic", t),
	getEpic: async (t) => e("ext_epics", "epics", "get-epic", t),
	listEpics: async (t) => e("ext_epics", "epics", "list-epics", t),
	byRefEpic: async (t) => e("ext_epics", "epics", "by-ref-epic", t),
	byRefsEpic: async (t) => e("ext_epics", "epics", "by-refs-epic", t),
	progressEpic: async (t) => e("ext_epics", "epics", "progress-epic", t),
	issuesInEpic: async (t) => e("ext_epics", "epics", "issues-in-epic", t),
	childrenOfEpic: async (t) => e("ext_epics", "epics", "children-of-epic", t)
};
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/api.ts
function go(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function _o(e) {
	return `comtrya://workspace/${e}`;
}
function vo(e) {
	switch (e) {
		case "IN_PROGRESS":
		case "AT_RISK":
		case "DONE":
		case "CANCELED": return e;
		default: return "PLANNED";
	}
}
function yo(e) {
	return {
		id: e.id,
		workspaceId: e.workspaceId ?? e.workspace?.replace(/^comtrya:\/\/workspace\//, "") ?? "",
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: vo(e.state),
		targetDate: e.targetDate ?? null,
		ownerRef: e.ownerRef ?? null,
		labels: e.labels ?? [],
		createdAt: e.createdAt ?? null,
		closedAt: e.closedAt ?? null
	};
}
async function bo(e, t) {
	let n = go(await ho.byRefEpic(t), "epicByRef");
	return n ? yo(n) : null;
}
async function xo(e, t) {
	let n = go(await ho.listEpics({
		workspace: _o(t.workspaceId),
		limit: 1024
	}), "listEpics").map(yo), r = t.state ? vo(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function So(e, t) {
	return go(await ho.progressEpic(t), "epicProgress");
}
async function Co(e, t) {
	return go(await ho.issuesInEpic(t), "issuesInEpic");
}
async function wo(e, t, n) {
	return yo(go(await ho.changeStateEpic({
		id: t,
		state: n
	}), "changeEpicState"));
}
async function To(e, t) {
	return yo(go(await ho.createEpic({
		workspace: _o(t.workspaceId),
		title: t.title,
		bodyMarkdown: t.bodyMarkdown ?? "",
		ownerRef: null,
		targetDate: null,
		labels: [],
		parentEpicRef: null
	}), "createEpic"));
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/types.ts
var Eo = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", Do = "epics";
function Oo(e) {
	return `comtrya://epic/${e.id}`;
}
function ko(e) {
	return a(Do, `/${e.workspaceId}/${e.id}`);
}
function Ao(e) {
	return `${a(Do, "/new")}?workspaceId=${e}`;
}
function jo(e) {
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
//#region ../extensions/first-party/ext_epics/ui/src/EpicCard.vue?vue&type=script&setup=true&lang.ts
var Mo = ["data-state"], No = ["data-epic-id"], Po = { class: "epic-card-title" }, Fo = ["href"], Io = {
	key: 0,
	class: "epic-meta"
}, Lo = {
	key: 1,
	class: "epic-meta"
}, Ro = {
	key: 1,
	class: "epic-line muted"
}, zo = {
	key: 2,
	class: "epic-card-fallback"
}, Bo = { class: "epic-line muted" }, Vo = { class: "epic-line warn" }, Ho = /* @__PURE__ */ Vn({
	__name: "EpicCard",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epic: { type: null },
		ref: { type: String },
		resourceRef: { type: String }
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ z("idle"), r = /* @__PURE__ */ z(null), i = /* @__PURE__ */ z(t.epic ?? null), a = /* @__PURE__ */ z(null), o = $(() => t.resourceRef ?? t.ref ?? ""), s = $(() => t.client ?? t.comtryaClient), c = $(() => t.epic ?? i.value), l = $(() => jo(c.value?.state)), u = $(() => (a.value?.issuesOpen ?? 0) + (a.value?.issuesClosed ?? 0));
		nr(d), Nn(() => [
			s.value,
			t.epic,
			o.value
		], () => void d());
		async function d() {
			if (t.epic) {
				i.value = t.epic, n.value = "ready", r.value = null, await f();
				return;
			}
			if (!o.value) {
				i.value = null, a.value = null, n.value = "error", r.value = "epic-card: missing ref";
				return;
			}
			if (!s.value) {
				i.value = null, a.value = null, n.value = "error", r.value = "epic-card: no client";
				return;
			}
			n.value = "loading", r.value = null;
			try {
				i.value = await bo(s.value, o.value), n.value = i.value ? "ready" : "empty", await f();
			} catch (e) {
				i.value = null, a.value = null, n.value = "error", r.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function f() {
			if (!s.value || !o.value) {
				a.value = null;
				return;
			}
			try {
				a.value = await So(s.value, o.value);
			} catch {
				a.value = null;
			}
		}
		return (e, t) => (J(), Y("article", {
			class: "epic-card",
			"data-state": n.value,
			"data-smoke": "epic-card"
		}, [c.value ? (J(), Y("div", {
			key: 0,
			class: "epic-card-body",
			"data-epic-id": c.value.id,
			"data-smoke": "epic-card-body"
		}, [
			X("div", Po, [X("span", { class: xe(["epic-pill", l.value.className]) }, A(l.value.label), 3), X("a", {
				class: "epic-title-link",
				href: Xt(ko)(c.value)
			}, A(c.value.title), 9, Fo)]),
			a.value ? (J(), Y("div", Io, [X("span", null, A(a.value.issuesClosed ?? 0) + "/" + A(u.value) + " issues", 1), X("span", null, A(a.value.percentComplete ?? 0) + "% complete", 1)])) : Vi("", !0),
			c.value.targetDate ? (J(), Y("div", Lo, [X("span", null, "target: " + A(c.value.targetDate), 1)])) : Vi("", !0)
		], 8, No)) : n.value === "loading" ? (J(), Y("p", Ro, " Loading " + A(o.value), 1)) : (J(), Y("div", zo, [X("p", Bo, A(o.value || "epic"), 1), X("p", Vo, A(r.value ?? "epic not found"), 1)]))], 8, Mo));
	}
}), Uo = ".epic-card[data-v-aa22da85]{display:block}.epic-card-body[data-v-aa22da85]{border:1px solid var(--ink-rule,#d0cfc8);gap:6px;padding:10px 12px;display:grid}.epic-card-title[data-v-aa22da85]{align-items:baseline;gap:8px;min-width:0;display:flex}.epic-pill[data-v-aa22da85],.epic-meta[data-v-aa22da85],.epic-line[data-v-aa22da85]{font-family:var(--mono,monospace)}.epic-pill[data-v-aa22da85]{border:1px solid;padding:1px 8px;font-size:10px}.epic-state-good[data-v-aa22da85]{color:var(--ink-go,#008873)}.epic-state-warn[data-v-aa22da85]{color:var(--ink-warn,#c2410c)}.epic-state-muted[data-v-aa22da85],.epic-meta[data-v-aa22da85],.muted[data-v-aa22da85]{color:var(--ink-faint,#888)}.epic-title-link[data-v-aa22da85]{min-width:0;color:inherit;font-family:var(--display,system-ui);overflow-wrap:anywhere;font-weight:600}.epic-meta[data-v-aa22da85]{flex-wrap:wrap;gap:8px;font-size:11px;display:flex}.epic-line[data-v-aa22da85]{margin:4px 0;font-size:12px}.warn[data-v-aa22da85]{color:var(--ink-warn,#c2410c)}", Wo = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, Go = /* @__PURE__ */ Wo(Ho, [["styles", [Uo]], ["__scopeId", "data-v-aa22da85"]]), Ko = /* @__PURE__ */ Wo(/* @__PURE__ */ Vn({
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
		nr(i), Nn(() => [
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
		return (e, t) => (J(), Y("span", {
			ref_key: "mount",
			ref: n,
			class: "custom-element-host"
		}, null, 512));
	}
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]), qo = ["data-state", "data-epic-id"], Jo = {
	key: 0,
	class: "epic-line muted"
}, Yo = {
	key: 1,
	class: "epic-line warn"
}, Xo = {
	key: 2,
	class: "epic-line warn"
}, Zo = { class: "epic-detail-meta" }, Qo = { key: 0 }, $o = ["data-epic-id"], es = {
	class: "epic-section",
	"data-smoke": "epic-progress"
}, ts = {
	key: 0,
	class: "epic-line"
}, ns = {
	key: 1,
	class: "epic-line muted"
}, rs = {
	class: "epic-section",
	"data-smoke": "epic-issues"
}, is = {
	key: 0,
	class: "epic-line muted"
}, as = { key: 1 }, os = { class: "epic-actions" }, ss = ["disabled", "onClick"], cs = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, ls = /* @__PURE__ */ Wo(/* @__PURE__ */ Vn({
	__name: "EpicDetail",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epic: { type: null },
		workspaceId: { type: String },
		id: { type: String },
		routeParams: { type: null }
	},
	setup(e) {
		let t = e, n = [
			"PLANNED",
			"IN_PROGRESS",
			"DONE",
			"CANCELED"
		], r = /* @__PURE__ */ z("idle"), i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(null), s = /* @__PURE__ */ z(t.epic ?? null), c = /* @__PURE__ */ z(null), l = /* @__PURE__ */ z([]), u = $(() => t.client ?? t.comtryaClient), d = $(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3"), f = $(() => t.id ?? t.routeParams?.params?.id ?? ""), p = $(() => t.epic ? Oo(t.epic) : `comtrya://epic/${f.value}`), m = $(() => s.value ?? t.epic ?? null), h = $(() => jo(m.value?.state)), g = $(() => n.filter((e) => e !== m.value?.state)), _ = $(() => (c.value?.issuesOpen ?? 0) + (c.value?.issuesClosed ?? 0)), v = $(() => u.value && !!f.value);
		nr(y), Nn(() => [
			u.value,
			t.epic,
			d.value,
			f.value
		], () => void y());
		async function y() {
			if (t.epic) {
				s.value = t.epic, r.value = "ready", a.value = null, await b();
				return;
			}
			if (!v.value || !u.value) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = "epic-detail: missing params";
				return;
			}
			r.value = "loading", a.value = null;
			try {
				s.value = await bo(u.value, p.value), r.value = s.value ? "ready" : "empty", await b();
			} catch (e) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function b() {
			if (!u.value || !m.value) {
				c.value = null, l.value = [];
				return;
			}
			let e = Oo(m.value), [t, n] = await Promise.allSettled([So(u.value, e), Co(u.value, e)]);
			c.value = t.status === "fulfilled" ? t.value : null, l.value = n.status === "fulfilled" ? n.value : [];
		}
		async function x(e) {
			if (!(!u.value || !m.value)) {
				i.value = "submitting", o.value = null;
				try {
					s.value = await wo(u.value, m.value.id, e), await b();
				} catch (e) {
					o.value = e instanceof Error ? e.message : String(e);
				} finally {
					i.value = "idle";
				}
			}
		}
		function S(e) {
			return e.toLowerCase().replace("_", " ");
		}
		return (e, t) => (J(), Y("main", {
			class: "epic-detail",
			"data-state": r.value,
			"data-epic-id": m.value?.id,
			"data-smoke": "epic-detail"
		}, [r.value === "loading" ? (J(), Y("p", Jo, "Loading epic")) : r.value === "error" ? (J(), Y("p", Yo, A(a.value), 1)) : m.value ? (J(), Y(K, { key: 3 }, [
			X("header", null, [X("h1", null, A(m.value.title), 1), X("div", Zo, [
				X("span", { class: xe(["epic-pill", h.value.className]) }, A(h.value.label), 3),
				X("span", null, "created " + A(m.value.createdAt ?? "unknown"), 1),
				m.value.targetDate ? (J(), Y("span", Qo, "target " + A(m.value.targetDate), 1)) : Vi("", !0)
			])]),
			X("article", {
				class: "epic-body",
				"data-epic-id": m.value.id,
				"data-smoke": "epic-detail-main"
			}, A(m.value.bodyMarkdown || "(no description)"), 9, $o),
			X("section", es, [t[0] ||= X("h3", null, "Progress", -1), c.value ? (J(), Y("p", ts, A(c.value.issuesClosed ?? 0) + "/" + A(_.value) + " issues closed · " + A(c.value.percentComplete ?? 0) + "% ", 1)) : (J(), Y("p", ns, "progress unavailable"))]),
			X("section", rs, [t[1] ||= X("h3", null, "Issues in this epic", -1), l.value.length === 0 ? (J(), Y("div", is, " no issues linked yet ")) : (J(), Y("ul", as, [(J(!0), Y(K, null, fr(l.value, (e) => (J(), Y("li", { key: e }, [Z(Ko, {
				tag: "comtrya-resource-card",
				attributes: { ref: e },
				properties: {
					ref: e,
					comtryaClient: u.value
				}
			}, null, 8, ["attributes", "properties"])]))), 128))]))]),
			X("div", os, [(J(!0), Y(K, null, fr(g.value, (e) => (J(), Y("button", {
				key: e,
				type: "button",
				disabled: i.value === "submitting",
				onClick: (t) => x(e)
			}, " mark " + A(S(e)), 9, ss))), 128))]),
			o.value ? (J(), Y("p", cs, A(o.value), 1)) : Vi("", !0),
			Z(Ko, {
				tag: "comtrya-comment-thread",
				attributes: { target: Xt(Oo)(m.value) },
				properties: {
					target: Xt(Oo)(m.value),
					comtryaClient: u.value
				}
			}, null, 8, ["attributes", "properties"])
		], 64)) : (J(), Y("p", Xo, " No epic " + A(f.value || "?") + " in " + A(d.value), 1))], 8, qo));
	}
}), [["styles", [".epic-detail[data-v-93b7e60a]{gap:16px;max-width:720px;padding:24px 0;display:grid}.epic-detail h1[data-v-93b7e60a]{font-family:var(--display,system-ui);margin:0}.epic-detail-meta[data-v-93b7e60a],.epic-line[data-v-93b7e60a],.epic-actions button[data-v-93b7e60a],.epic-section[data-v-93b7e60a]{font-family:var(--mono,monospace)}.epic-detail-meta[data-v-93b7e60a]{color:var(--ink-faint,#888);flex-wrap:wrap;gap:8px;margin-top:4px;font-size:12px;display:flex}.epic-pill[data-v-93b7e60a]{border:1px solid;padding:1px 8px}.epic-state-good[data-v-93b7e60a]{color:var(--ink-go,#008873)}.epic-state-warn[data-v-93b7e60a]{color:var(--ink-warn,#c2410c)}.epic-state-muted[data-v-93b7e60a],.muted[data-v-93b7e60a]{color:var(--ink-faint,#888)}.epic-body[data-v-93b7e60a]{border:1px solid var(--ink-rule,#d0cfc8);white-space:pre-wrap;min-height:96px;padding:12px}.epic-section[data-v-93b7e60a]{gap:6px;font-size:12px;display:grid}.epic-section h3[data-v-93b7e60a]{font-family:var(--display,system-ui);margin:0;font-size:13px}.epic-section ul[data-v-93b7e60a]{gap:6px;margin:0;padding:0;list-style:none;display:grid}.epic-actions[data-v-93b7e60a]{flex-wrap:wrap;gap:8px;display:flex}.epic-actions button[data-v-93b7e60a]{cursor:pointer;padding:4px 12px}.epic-line[data-v-93b7e60a]{margin:4px 0;font-size:12px}.warn[data-v-93b7e60a]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-93b7e60a"]]), us = ["data-state"], ds = { class: "epics-list-header" }, fs = ["href"], ps = {
	key: 0,
	class: "epic-line muted"
}, ms = {
	key: 1,
	class: "epic-line warn"
}, hs = {
	key: 2,
	class: "epic-line muted"
}, gs = {
	key: 3,
	class: "epics-list-items"
}, _s = /* @__PURE__ */ Wo(/* @__PURE__ */ Vn({
	__name: "EpicsList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epics: { type: [Array, null] },
		workspaceId: {
			default: Eo,
			type: String
		},
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
		}
	},
	setup(e) {
		let t = e, n = /* @__PURE__ */ z("idle"), r = /* @__PURE__ */ z(null), i = /* @__PURE__ */ z(t.epics ?? []), a = $(() => t.epics ?? i.value), o = $(() => t.client ?? t.comtryaClient), s = $(() => Ao(t.workspaceId));
		nr(c), Nn(() => [
			o.value,
			t.epics,
			t.workspaceId,
			t.state
		], () => void c());
		async function c() {
			if (t.epics) {
				i.value = t.epics, n.value = t.epics.length > 0 ? "ready" : "empty", r.value = null;
				return;
			}
			if (!o.value) {
				i.value = [], n.value = "error", r.value = "epics: no client";
				return;
			}
			n.value = "loading", r.value = null;
			try {
				i.value = await xo(o.value, {
					workspaceId: t.workspaceId,
					state: t.state
				}), n.value = i.value.length > 0 ? "ready" : "empty";
			} catch (e) {
				i.value = [], n.value = "error", r.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (t, i) => (J(), Y("section", {
			class: "epics-list",
			"data-state": n.value,
			"data-smoke": "epics-list"
		}, [X("header", ds, [X("h3", null, A(e.title), 1), e.showNewLink ? (J(), Y("a", {
			key: 0,
			href: s.value
		}, "+ new", 8, fs)) : Vi("", !0)]), n.value === "loading" ? (J(), Y("p", ps, "Loading epics")) : n.value === "error" ? (J(), Y("p", ms, A(r.value), 1)) : a.value.length === 0 ? (J(), Y("p", hs, "No epics yet.")) : (J(), Y("ul", gs, [(J(!0), Y(K, null, fr(a.value, (e) => (J(), Y("li", { key: e.id }, [Z(Go, {
			epic: e,
			"resource-ref": Xt(Oo)(e),
			client: o.value
		}, null, 8, [
			"epic",
			"resource-ref",
			"client"
		])]))), 128))]))], 8, us));
	}
}), [["styles", [".epics-list[data-v-0c012b75]{gap:8px;display:grid}.epics-list-header[data-v-0c012b75]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.epics-list-header h3[data-v-0c012b75]{font-family:var(--display,system-ui);margin:0;font-size:14px}.epics-list-header a[data-v-0c012b75],.epic-line[data-v-0c012b75]{font-family:var(--mono,monospace);font-size:12px}.epics-list-header a[data-v-0c012b75]{color:var(--ink-faint,#888);text-decoration:none}.epics-list-items[data-v-0c012b75]{gap:8px;margin:0;padding:0;list-style:none;display:grid}.epic-line[data-v-0c012b75]{margin:4px 0}.muted[data-v-0c012b75]{color:var(--ink-faint,#888)}.warn[data-v-0c012b75]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-0c012b75"]]), vs = "epics", ys = "ext_epics", bs = "comtrya-epic-card", xs = "comtrya-epics-board", Ss = "comtrya-epics-index", Cs = "comtrya-epic-detail", ws = "comtrya-epic-new";
uo({
	tagName: bs,
	component: Go,
	propertyAliases: { ref: "resourceRef" }
}), uo({
	tagName: xs,
	component: _s
}), uo({
	tagName: Ss,
	component: _s
}), uo({
	tagName: Cs,
	component: ls
}), Es();
var Ts = {
	id: ys,
	setup(e) {
		e.registerCard({
			resourceKind: "epic",
			element: bs,
			requiredPermission: "epics.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "epic",
			loadTargets: async (t) => (await xo(e.client, { workspaceId: t.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3" })).map((e) => ({
				ref: Oo(e),
				kind: "epic",
				title: e.title,
				subtitle: e.state.toLowerCase().replace(/_/g, " ")
			}))
		}), e.registerWidget({
			id: "epics-board",
			element: xs,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "epics.read"
		}), e.registerRoute("/", {
			element: Ss,
			requiredPermission: "epics.read"
		}), e.registerRoute("/new", {
			element: ws,
			requiredPermission: "epics.write"
		}), e.registerRoute("/:workspaceId/:id", {
			element: Cs,
			requiredPermission: "epics.read"
		});
	}
};
function Es() {
	typeof customElements > "u" || customElements.get(ws) || customElements.define(ws, class extends HTMLElement {
		routeParams;
		connectedCallback() {
			this.replaceChildren(Os(Ds(this.routeParams)));
		}
	});
}
function Ds(e) {
	return new URLSearchParams(window.location.search).get("workspaceId") ?? e?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
}
function Os(e) {
	let t = document.createElement("main");
	t.className = "epic-new", t.dataset.smoke = "epic-new";
	let n = document.createElement("h3");
	n.textContent = "New epic";
	let r = document.createElement("form"), i = document.createElement("input");
	i.required = !0, i.placeholder = "Epic title";
	let o = document.createElement("textarea");
	o.rows = 5, o.placeholder = "Description (optional)";
	let s = document.createElement("button");
	s.type = "submit", s.textContent = "Create epic";
	let c = ks("", "warn");
	return c.setAttribute("role", "alert"), c.hidden = !0, r.append(i, o, s, c), r.addEventListener("submit", (t) => {
		t.preventDefault(), s.disabled = !0, c.hidden = !0, To(void 0, {
			workspaceId: e,
			title: i.value.trim(),
			bodyMarkdown: o.value
		}).then((e) => {
			window.location.assign(a(vs, `/${e.workspaceId}/${e.id}`));
		}).catch((e) => {
			c.textContent = e instanceof Error ? e.message : String(e), c.hidden = !1, s.disabled = !1;
		});
	}), t.append(n, r), t;
}
function ks(e, t) {
	let n = document.createElement("p");
	return n.className = `epic-line ${t}`, n.textContent = e, n;
}
//#endregion
export { Ts as default };
