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
//#region packages/sdk-core/src/live-events.ts
function o(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return s(t, e, n.signal), () => n.abort();
}
async function s(e, t, n) {
	try {
		let r = await c(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: l(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await u(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function c(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: l(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function l(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function u(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		d(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) f(e, t);
	}
	a += i.decode(), d(a, t);
}
function d(e, t) {
	for (let n of e.split("\n\n")) f(n, t);
}
function f(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = p(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function p(e, t) {
	let n = m(e) ? e : {}, r = m(n.data) ? n.data : {}, i = h(r.eventType) ?? h(n.type) ?? t ?? "";
	return {
		id: h(r.id) ?? h(n.id) ?? "",
		eventType: i,
		payloadB64: h(r.payloadB64) ?? "",
		timestampMs: g(r.timestampMs) ?? _(g(n.time)) ?? Date.now(),
		sourceUri: h(r.sourceUri) ?? h(n.source) ?? "",
		emitterExtension: h(r.emitterExtension) ?? h(r.extensionId) ?? h(n.source) ?? "",
		raw: e
	};
}
function m(e) {
	return typeof e == "object" && !!e;
}
function h(e) {
	return typeof e == "string" ? e : void 0;
}
function g(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function _(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var v = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], y = typeof navigator == "object" ? navigator.platform : "", b = /Mac|iPod|iPhone|iPad/.test(y), ee = b ? "Meta" : "Control", x = y === "Win32" ? ["Control", "Alt"] : b ? ["Alt"] : [];
function te(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || x.includes(t) && e.getModifierState("AltGraph"));
}
function ne(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? ee : e;
		}), n];
	});
}
function re(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !te(e, t);
	}) || v.find(function(t) {
		return !n.includes(t) && r !== t && te(e, t);
	}));
}
function ie(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [ne(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			re(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : te(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function ae(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = ie(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var oe = /* @__PURE__ */ new Map(), se = /* @__PURE__ */ new Set();
function ce(e) {
	oe.set(e.id, e);
	for (let e of se) e();
	return () => {
		oe.delete(e.id);
		for (let e of se) e();
	};
}
//#endregion
//#region node_modules/.bun/@vue+shared@3.5.34/node_modules/@vue/shared/dist/shared.esm-bundler.js
/* @__NO_SIDE_EFFECTS__ */
function S(e) {
	let t = /* @__PURE__ */ Object.create(null);
	for (let n of e.split(",")) t[n] = 1;
	return (e) => e in t;
}
var C = {}, le = [], ue = () => {}, de = () => !1, fe = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), pe = (e) => e.startsWith("onUpdate:"), w = Object.assign, me = (e, t) => {
	let n = e.indexOf(t);
	n > -1 && e.splice(n, 1);
}, he = Object.prototype.hasOwnProperty, T = (e, t) => he.call(e, t), E = Array.isArray, ge = (e) => xe(e) === "[object Map]", _e = (e) => xe(e) === "[object Set]", ve = (e) => xe(e) === "[object Date]", D = (e) => typeof e == "function", O = (e) => typeof e == "string", k = (e) => typeof e == "symbol", A = (e) => typeof e == "object" && !!e, ye = (e) => (A(e) || D(e)) && D(e.then) && D(e.catch), be = Object.prototype.toString, xe = (e) => be.call(e), Se = (e) => xe(e).slice(8, -1), Ce = (e) => xe(e) === "[object Object]", we = (e) => O(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Te = /* @__PURE__ */ S(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"), Ee = (e) => {
	let t = /* @__PURE__ */ Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, De = /-\w/g, j = Ee((e) => e.replace(De, (e) => e.slice(1).toUpperCase())), Oe = /\B([A-Z])/g, M = Ee((e) => e.replace(Oe, "-$1").toLowerCase()), ke = Ee((e) => e.charAt(0).toUpperCase() + e.slice(1)), Ae = Ee((e) => e ? `on${ke(e)}` : ""), je = (e, t) => !Object.is(e, t), Me = (e, ...t) => {
	for (let n = 0; n < e.length; n++) e[n](...t);
}, Ne = (e, t, n, r = !1) => {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		writable: r,
		value: n
	});
}, Pe = (e) => {
	let t = parseFloat(e);
	return isNaN(t) ? e : t;
}, Fe = (e) => {
	let t = O(e) ? Number(e) : NaN;
	return isNaN(t) ? e : t;
}, Ie, Le = () => Ie ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function Re(e) {
	if (E(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = O(r) ? He(r) : Re(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (O(e) || A(e)) return e;
}
var ze = /;(?![^(]*\))/g, Be = /:([^]+)/, Ve = /\/\*[^]*?\*\//g;
function He(e) {
	let t = {};
	return e.replace(Ve, "").split(ze).forEach((e) => {
		if (e) {
			let n = e.split(Be);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function Ue(e) {
	let t = "";
	if (O(e)) t = e;
	else if (E(e)) for (let n = 0; n < e.length; n++) {
		let r = Ue(e[n]);
		r && (t += r + " ");
	}
	else if (A(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var We = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Ge = /* @__PURE__ */ S(We);
We + "";
function Ke(e) {
	return !!e || e === "";
}
function qe(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = Je(e[r], t[r]);
	return n;
}
function Je(e, t) {
	if (e === t) return !0;
	let n = ve(e), r = ve(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = k(e), r = k(t), n || r) return e === t;
	if (n = E(e), r = E(t), n || r) return n && r ? qe(e, t) : !1;
	if (n = A(e), r = A(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !Je(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
var Ye = (e) => !!(e && e.__v_isRef === !0), N = (e) => O(e) ? e : e == null ? "" : E(e) || A(e) && (e.toString === be || !D(e.toString)) ? Ye(e) ? N(e.value) : JSON.stringify(e, Xe, 2) : String(e), Xe = (e, t) => Ye(t) ? Xe(e, t.value) : ge(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[Ze(t, r) + " =>"] = n, e), {}) } : _e(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => Ze(e)) } : k(t) ? Ze(t) : A(t) && !E(t) && !Ce(t) ? String(t) : t, Ze = (e, t = "") => k(e) ? `Symbol(${e.description ?? t})` : e, P, Qe = class {
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
function $e() {
	return P;
}
var F, et = /* @__PURE__ */ new WeakSet(), tt = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, P && (P.active ? P.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, et.has(this) && (et.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || at(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, vt(this), ct(this);
		let e = F, t = mt;
		F = this, mt = !0;
		try {
			return this.fn();
		} finally {
			lt(this), F = e, mt = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) ft(e);
			this.deps = this.depsTail = void 0, vt(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? et.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		ut(this) && this.run();
	}
	get dirty() {
		return ut(this);
	}
}, nt = 0, rt, it;
function at(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = it, it = e;
		return;
	}
	e.next = rt, rt = e;
}
function ot() {
	nt++;
}
function st() {
	if (--nt > 0) return;
	if (it) {
		let e = it;
		for (it = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; rt;) {
		let t = rt;
		for (rt = void 0; t;) {
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
function ct(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function lt(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), ft(r), pt(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function ut(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (dt(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function dt(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === yt) || (e.globalVersion = yt, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !ut(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = F, r = mt;
	F = e, mt = !0;
	try {
		ct(e);
		let n = e.fn(e._value);
		(t.version === 0 || je(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		F = n, mt = r, lt(e), e.flags &= -3;
	}
}
function ft(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) ft(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function pt(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var mt = !0, ht = [];
function gt() {
	ht.push(mt), mt = !1;
}
function _t() {
	let e = ht.pop();
	mt = e === void 0 ? !0 : e;
}
function vt(e) {
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
var yt = 0, bt = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, xt = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!F || !mt || F === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== F) t = this.activeLink = new bt(F, this), F.deps ? (t.prevDep = F.depsTail, F.depsTail.nextDep = t, F.depsTail = t) : F.deps = F.depsTail = t, St(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = F.depsTail, t.nextDep = void 0, F.depsTail.nextDep = t, F.depsTail = t, F.deps === t && (F.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, yt++, this.notify(e);
	}
	notify(e) {
		ot();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			st();
		}
	}
};
function St(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) St(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var Ct = /* @__PURE__ */ new WeakMap(), wt = /* @__PURE__ */ Symbol(""), Tt = /* @__PURE__ */ Symbol(""), Et = /* @__PURE__ */ Symbol("");
function I(e, t, n) {
	if (mt && F) {
		let t = Ct.get(e);
		t || Ct.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new xt()), r.map = t, r.key = n), r.track();
	}
}
function Dt(e, t, n, r, i, a) {
	let o = Ct.get(e);
	if (!o) {
		yt++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (ot(), t === "clear") o.forEach(s);
	else {
		let i = E(e), a = i && we(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === Et || !k(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(Et)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(wt)), ge(e) && s(o.get(Tt)));
				break;
			case "delete":
				i || (s(o.get(wt)), ge(e) && s(o.get(Tt)));
				break;
			case "set":
				ge(e) && s(o.get(wt));
				break;
		}
	}
	st();
}
function Ot(e) {
	let t = /* @__PURE__ */ R(e);
	return t === e ? t : (I(t, "iterate", Et), /* @__PURE__ */ L(e) ? t : t.map(_n));
}
function kt(e) {
	return I(e = /* @__PURE__ */ R(e), "iterate", Et), e;
}
function At(e, t) {
	return /* @__PURE__ */ mn(e) ? vn(/* @__PURE__ */ pn(e) ? _n(t) : t) : _n(t);
}
var jt = {
	__proto__: null,
	[Symbol.iterator]() {
		return Mt(this, Symbol.iterator, (e) => At(this, e));
	},
	concat(...e) {
		return Ot(this).concat(...e.map((e) => E(e) ? Ot(e) : e));
	},
	entries() {
		return Mt(this, "entries", (e) => (e[1] = At(this, e[1]), e));
	},
	every(e, t) {
		return Pt(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return Pt(this, "filter", e, t, (e) => e.map((e) => At(this, e)), arguments);
	},
	find(e, t) {
		return Pt(this, "find", e, t, (e) => At(this, e), arguments);
	},
	findIndex(e, t) {
		return Pt(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return Pt(this, "findLast", e, t, (e) => At(this, e), arguments);
	},
	findLastIndex(e, t) {
		return Pt(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return Pt(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return It(this, "includes", e);
	},
	indexOf(...e) {
		return It(this, "indexOf", e);
	},
	join(e) {
		return Ot(this).join(e);
	},
	lastIndexOf(...e) {
		return It(this, "lastIndexOf", e);
	},
	map(e, t) {
		return Pt(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return Lt(this, "pop");
	},
	push(...e) {
		return Lt(this, "push", e);
	},
	reduce(e, ...t) {
		return Ft(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return Ft(this, "reduceRight", e, t);
	},
	shift() {
		return Lt(this, "shift");
	},
	some(e, t) {
		return Pt(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return Lt(this, "splice", e);
	},
	toReversed() {
		return Ot(this).toReversed();
	},
	toSorted(e) {
		return Ot(this).toSorted(e);
	},
	toSpliced(...e) {
		return Ot(this).toSpliced(...e);
	},
	unshift(...e) {
		return Lt(this, "unshift", e);
	},
	values() {
		return Mt(this, "values", (e) => At(this, e));
	}
};
function Mt(e, t, n) {
	let r = kt(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ L(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var Nt = Array.prototype;
function Pt(e, t, n, r, i, a) {
	let o = kt(e), s = o !== e && !/* @__PURE__ */ L(e), c = o[t];
	if (c !== Nt[t]) {
		let t = c.apply(e, a);
		return s ? _n(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, At(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function Ft(e, t, n, r) {
	let i = kt(e), a = i !== e && !/* @__PURE__ */ L(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = At(e, t)), n.call(this, t, At(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? At(e, c) : c;
}
function It(e, t, n) {
	let r = /* @__PURE__ */ R(e);
	I(r, "iterate", Et);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ hn(n[0]) ? (n[0] = /* @__PURE__ */ R(n[0]), r[t](...n)) : i;
}
function Lt(e, t, n = []) {
	gt(), ot();
	let r = (/* @__PURE__ */ R(e))[t].apply(e, n);
	return st(), _t(), r;
}
var Rt = /* @__PURE__ */ S("__proto__,__v_isRef,__isVue"), zt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(k));
function Bt(e) {
	k(e) || (e = String(e));
	let t = /* @__PURE__ */ R(this);
	return I(t, "has", e), t.hasOwnProperty(e);
}
var Vt = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? on : an : i ? rn : nn).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = E(e);
		if (!r) {
			let e;
			if (a && (e = jt[t])) return e;
			if (t === "hasOwnProperty") return Bt;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ z(e) ? e : n);
		if ((k(t) ? zt.has(t) : Rt(t)) || (r || I(e, "get", t), i)) return o;
		if (/* @__PURE__ */ z(o)) {
			let e = a && we(t) ? o : o.value;
			return r && A(e) ? /* @__PURE__ */ dn(e) : e;
		}
		return A(o) ? r ? /* @__PURE__ */ dn(o) : /* @__PURE__ */ ln(o) : o;
	}
}, Ht = class extends Vt {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = E(e) && we(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ mn(i);
			if (!/* @__PURE__ */ L(n) && !/* @__PURE__ */ mn(n) && (i = /* @__PURE__ */ R(i), n = /* @__PURE__ */ R(n)), !a && /* @__PURE__ */ z(i) && !/* @__PURE__ */ z(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : T(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ z(e) ? e : r);
		return e === /* @__PURE__ */ R(r) && (o ? je(n, i) && Dt(e, "set", t, n, i) : Dt(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = T(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && Dt(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!k(t) || !zt.has(t)) && I(e, "has", t), n;
	}
	ownKeys(e) {
		return I(e, "iterate", E(e) ? "length" : wt), Reflect.ownKeys(e);
	}
}, Ut = class extends Vt {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, Wt = /* @__PURE__ */ new Ht(), Gt = /* @__PURE__ */ new Ut(), Kt = /* @__PURE__ */ new Ht(!0), qt = (e) => e, Jt = (e) => Reflect.getPrototypeOf(e);
function Yt(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ R(i), o = ge(a), s = e === "entries" || e === Symbol.iterator && o, c = e === "keys" && o, l = i[e](...r), u = n ? qt : t ? vn : _n;
		return !t && I(a, "iterate", c ? Tt : wt), w(Object.create(l), { next() {
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
function Xt(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function Zt(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ R(r), a = /* @__PURE__ */ R(n);
			e || (je(n, a) && I(i, "get", n), I(i, "get", a));
			let { has: o } = Jt(i), s = t ? qt : e ? vn : _n;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && I(/* @__PURE__ */ R(t), "iterate", wt), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ R(n), i = /* @__PURE__ */ R(t);
			return e || (je(t, i) && I(r, "has", t), I(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ R(a), s = t ? qt : e ? vn : _n;
			return !e && I(o, "iterate", wt), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return w(n, e ? {
		add: Xt("add"),
		set: Xt("set"),
		delete: Xt("delete"),
		clear: Xt("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ R(this), r = Jt(n), i = /* @__PURE__ */ R(e), a = !t && !/* @__PURE__ */ L(e) && !/* @__PURE__ */ mn(e) ? i : e;
			return r.has.call(n, a) || je(e, a) && r.has.call(n, e) || je(i, a) && r.has.call(n, i) || (n.add(a), Dt(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ L(n) && !/* @__PURE__ */ mn(n) && (n = /* @__PURE__ */ R(n));
			let r = /* @__PURE__ */ R(this), { has: i, get: a } = Jt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ R(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? je(n, s) && Dt(r, "set", e, n, s) : Dt(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ R(this), { has: n, get: r } = Jt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ R(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && Dt(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ R(this), t = e.size !== 0, n = e.clear();
			return t && Dt(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = Yt(r, e, t);
	}), n;
}
function Qt(e, t) {
	let n = Zt(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(T(n, r) && r in t ? n : t, r, i);
}
var $t = { get: /* @__PURE__ */ Qt(!1, !1) }, en = { get: /* @__PURE__ */ Qt(!1, !0) }, tn = { get: /* @__PURE__ */ Qt(!0, !1) }, nn = /* @__PURE__ */ new WeakMap(), rn = /* @__PURE__ */ new WeakMap(), an = /* @__PURE__ */ new WeakMap(), on = /* @__PURE__ */ new WeakMap();
function sn(e) {
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
function cn(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : sn(Se(e));
}
/* @__NO_SIDE_EFFECTS__ */
function ln(e) {
	return /* @__PURE__ */ mn(e) ? e : fn(e, !1, Wt, $t, nn);
}
/* @__NO_SIDE_EFFECTS__ */
function un(e) {
	return fn(e, !1, Kt, en, rn);
}
/* @__NO_SIDE_EFFECTS__ */
function dn(e) {
	return fn(e, !0, Gt, tn, an);
}
function fn(e, t, n, r, i) {
	if (!A(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = cn(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function pn(e) {
	return /* @__PURE__ */ mn(e) ? /* @__PURE__ */ pn(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function mn(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function L(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function hn(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function R(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ R(t) : e;
}
function gn(e) {
	return !T(e, "__v_skip") && Object.isExtensible(e) && Ne(e, "__v_skip", !0), e;
}
var _n = (e) => A(e) ? /* @__PURE__ */ ln(e) : e, vn = (e) => A(e) ? /* @__PURE__ */ dn(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function z(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function B(e) {
	return yn(e, !1);
}
function yn(e, t) {
	return /* @__PURE__ */ z(e) ? e : new bn(e, t);
}
var bn = class {
	constructor(e, t) {
		this.dep = new xt(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ R(e), this._value = t ? e : _n(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ L(e) || /* @__PURE__ */ mn(e);
		e = n ? e : /* @__PURE__ */ R(e), je(e, t) && (this._rawValue = e, this._value = n ? e : _n(e), this.dep.trigger());
	}
};
function xn(e) {
	return /* @__PURE__ */ z(e) ? e.value : e;
}
var Sn = {
	get: (e, t, n) => t === "__v_raw" ? e : xn(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ z(i) && !/* @__PURE__ */ z(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Cn(e) {
	return /* @__PURE__ */ pn(e) ? e : new Proxy(e, Sn);
}
var wn = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new xt(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = yt - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && F !== this) return at(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return dt(this), e && (e.version = this.dep.version), this._value;
	}
	set value(e) {
		this.setter && this.setter(e);
	}
};
/* @__NO_SIDE_EFFECTS__ */
function Tn(e, t, n = !1) {
	let r, i;
	return D(e) ? r = e : (r = e.get, i = e.set), new wn(r, i, n);
}
var En = {}, Dn = /* @__PURE__ */ new WeakMap(), On = void 0;
function kn(e, t = !1, n = On) {
	if (n) {
		let t = Dn.get(n);
		t || Dn.set(n, t = []), t.push(e);
	}
}
function An(e, t, n = C) {
	let { immediate: r, deep: i, once: a, scheduler: o, augmentJob: s, call: c } = n, l = (e) => i ? e : /* @__PURE__ */ L(e) || i === !1 || i === 0 ? jn(e, 1) : jn(e), u, d, f, p, m = !1, h = !1;
	if (/* @__PURE__ */ z(e) ? (d = () => e.value, m = /* @__PURE__ */ L(e)) : /* @__PURE__ */ pn(e) ? (d = () => l(e), m = !0) : E(e) ? (h = !0, m = e.some((e) => /* @__PURE__ */ pn(e) || /* @__PURE__ */ L(e)), d = () => e.map((e) => {
		if (/* @__PURE__ */ z(e)) return e.value;
		if (/* @__PURE__ */ pn(e)) return l(e);
		if (D(e)) return c ? c(e, 2) : e();
	})) : d = D(e) ? t ? c ? () => c(e, 2) : e : () => {
		if (f) {
			gt();
			try {
				f();
			} finally {
				_t();
			}
		}
		let t = On;
		On = u;
		try {
			return c ? c(e, 3, [p]) : e(p);
		} finally {
			On = t;
		}
	} : ue, t && i) {
		let e = d, t = i === !0 ? Infinity : i;
		d = () => jn(e(), t);
	}
	let g = $e(), _ = () => {
		u.stop(), g && g.active && me(g.effects, u);
	};
	if (a && t) {
		let e = t;
		t = (...t) => {
			e(...t), _();
		};
	}
	let v = h ? Array(e.length).fill(En) : En, y = (e) => {
		if (!(!(u.flags & 1) || !u.dirty && !e)) if (t) {
			let e = u.run();
			if (i || m || (h ? e.some((e, t) => je(e, v[t])) : je(e, v))) {
				f && f();
				let n = On;
				On = u;
				try {
					let n = [
						e,
						v === En ? void 0 : h && v[0] === En ? [] : v,
						p
					];
					v = e, c ? c(t, 3, n) : t(...n);
				} finally {
					On = n;
				}
			}
		} else u.run();
	};
	return s && s(y), u = new tt(d), u.scheduler = o ? () => o(y, !1) : y, p = (e) => kn(e, !1, u), f = u.onStop = () => {
		let e = Dn.get(u);
		if (e) {
			if (c) c(e, 4);
			else for (let t of e) t();
			Dn.delete(u);
		}
	}, t ? r ? y(!0) : v = u.run() : o ? o(y.bind(null, !0), !0) : u.run(), _.pause = u.pause.bind(u), _.resume = u.resume.bind(u), _.stop = _, _;
}
function jn(e, t = Infinity, n) {
	if (t <= 0 || !A(e) || e.__v_skip || (n ||= /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t)) return e;
	if (n.set(e, t), t--, /* @__PURE__ */ z(e)) jn(e.value, t, n);
	else if (E(e)) for (let r = 0; r < e.length; r++) jn(e[r], t, n);
	else if (_e(e) || ge(e)) e.forEach((e) => {
		jn(e, t, n);
	});
	else if (Ce(e)) {
		for (let r in e) jn(e[r], t, n);
		for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && jn(e[r], t, n);
	}
	return e;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.34/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function Mn(e, t, n, r) {
	try {
		return r ? e(...r) : e();
	} catch (e) {
		Pn(e, t, n);
	}
}
function Nn(e, t, n, r) {
	if (D(e)) {
		let i = Mn(e, t, n, r);
		return i && ye(i) && i.catch((e) => {
			Pn(e, t, n);
		}), i;
	}
	if (E(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(Nn(e[a], t, n, r));
		return i;
	}
}
function Pn(e, t, n, r = !0) {
	let i = t ? t.vnode : null, { errorHandler: a, throwUnhandledErrorInProduction: o } = t && t.appContext.config || C;
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
			gt(), Mn(a, null, 10, [
				e,
				i,
				o
			]), _t();
			return;
		}
	}
	Fn(e, n, i, r, o);
}
function Fn(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var V = [], In = -1, Ln = [], Rn = null, zn = 0, Bn = /* @__PURE__ */ Promise.resolve(), Vn = null;
function Hn(e) {
	let t = Vn || Bn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function Un(e) {
	let t = In + 1, n = V.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = V[r], a = Yn(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function Wn(e) {
	if (!(e.flags & 1)) {
		let t = Yn(e), n = V[V.length - 1];
		!n || !(e.flags & 2) && t >= Yn(n) ? V.push(e) : V.splice(Un(t), 0, e), e.flags |= 1, Gn();
	}
}
function Gn() {
	Vn ||= Bn.then(Xn);
}
function Kn(e) {
	E(e) ? Ln.push(...e) : Rn && e.id === -1 ? Rn.splice(zn + 1, 0, e) : e.flags & 1 || (Ln.push(e), e.flags |= 1), Gn();
}
function qn(e, t, n = In + 1) {
	for (; n < V.length; n++) {
		let t = V[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			V.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function Jn(e) {
	if (Ln.length) {
		let e = [...new Set(Ln)].sort((e, t) => Yn(e) - Yn(t));
		if (Ln.length = 0, Rn) {
			Rn.push(...e);
			return;
		}
		for (Rn = e, zn = 0; zn < Rn.length; zn++) {
			let e = Rn[zn];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		Rn = null, zn = 0;
	}
}
var Yn = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function Xn(e) {
	try {
		for (In = 0; In < V.length; In++) {
			let e = V[In];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), Mn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; In < V.length; In++) {
			let e = V[In];
			e && (e.flags &= -2);
		}
		In = -1, V.length = 0, Jn(e), Vn = null, (V.length || Ln.length) && Xn(e);
	}
}
var Zn = null, Qn = null;
function $n(e) {
	let t = Zn;
	return Zn = e, Qn = e && e.type.__scopeId || null, t;
}
function er(e, t = Zn, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && ra(-1);
		let i = $n(t), a;
		try {
			a = e(...n);
		} finally {
			$n(i), r._d && ra(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function tr(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (gt(), Nn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), _t());
	}
}
function nr(e, t) {
	if (Q) {
		let n = Q.provides, r = Q.parent && Q.parent.provides;
		r === n && (n = Q.provides = Object.create(r)), n[e] = t;
	}
}
function rr(e, t, n = !1) {
	let r = xa();
	if (r || ci) {
		let i = ci ? ci._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && D(t) ? t.call(r && r.proxy) : t;
	}
}
var ir = /* @__PURE__ */ Symbol.for("v-scx"), ar = () => rr(ir);
function or(e, t, n) {
	return sr(e, t, n);
}
function sr(e, t, n = C) {
	let { immediate: r, deep: i, flush: a, once: o } = n, s = w({}, n), c = t && r || !t && a !== "post", l;
	if (Da) {
		if (a === "sync") {
			let e = ar();
			l = e.__watcherHandles ||= [];
		} else if (!c) {
			let e = () => {};
			return e.stop = ue, e.resume = ue, e.pause = ue, e;
		}
	}
	let u = Q;
	s.call = (e, t, n) => Nn(e, u, t, n);
	let d = !1;
	a === "post" ? s.scheduler = (e) => {
		U(e, u && u.suspense);
	} : a !== "sync" && (d = !0, s.scheduler = (e, t) => {
		t ? e() : Wn(e);
	}), s.augmentJob = (e) => {
		t && (e.flags |= 4), d && (e.flags |= 2, u && (e.id = u.uid, e.i = u));
	};
	let f = An(e, t, s);
	return Da && (l ? l.push(f) : c && f()), f;
}
function cr(e, t, n) {
	let r = this.proxy, i = O(e) ? e.includes(".") ? lr(r, e) : () => r[e] : e.bind(r, r), a;
	D(t) ? a = t : (a = t.handler, n = t);
	let o = wa(this), s = sr(i, a.bind(r), n);
	return o(), s;
}
function lr(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var ur = /* @__PURE__ */ Symbol("_vte"), dr = (e) => e.__isTeleport, fr = /* @__PURE__ */ Symbol("_leaveCb");
function pr(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, pr(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function mr(e, t) {
	return D(e) ? w({ name: e.name }, t, { setup: e }) : e;
}
function hr(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function gr(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var _r = /* @__PURE__ */ new WeakMap();
function vr(e, t, n, r, i = !1) {
	if (E(e)) {
		e.forEach((e, a) => vr(e, t && (E(t) ? t[a] : t), n, r, i));
		return;
	}
	if (br(r) && !i) {
		r.shapeFlag & 512 && r.type.__asyncResolved && r.component.subTree.component && vr(e, t, n, r.component.subTree);
		return;
	}
	let a = r.shapeFlag & 4 ? Ia(r.component) : r.el, o = i ? null : a, { i: s, r: c } = e, l = t && t.r, u = s.refs === C ? s.refs = {} : s.refs, d = s.setupState, f = /* @__PURE__ */ R(d), p = d === C ? de : (e) => gr(u, e) ? !1 : T(f, e), m = (e, t) => !(t && gr(u, t));
	if (l != null && l !== c) {
		if (yr(t), O(l)) u[l] = null, p(l) && (d[l] = null);
		else if (/* @__PURE__ */ z(l)) {
			let e = t;
			m(l, e.k) && (l.value = null), e.k && (u[e.k] = null);
		}
	}
	if (D(c)) Mn(c, s, 12, [o, u]);
	else {
		let t = O(c), r = /* @__PURE__ */ z(c);
		if (t || r) {
			let s = () => {
				if (e.f) {
					let n = t ? p(c) ? d[c] : u[c] : m(c) || !e.k ? c.value : u[e.k];
					if (i) E(n) && me(n, a);
					else if (E(n)) n.includes(a) || n.push(a);
					else if (t) u[c] = [a], p(c) && (d[c] = u[c]);
					else {
						let t = [a];
						m(c, e.k) && (c.value = t), e.k && (u[e.k] = t);
					}
				} else t ? (u[c] = o, p(c) && (d[c] = o)) : r && (m(c, e.k) && (c.value = o), e.k && (u[e.k] = o));
			};
			if (o) {
				let t = () => {
					s(), _r.delete(e);
				};
				t.id = -1, _r.set(e, t), U(t, n);
			} else yr(e), s();
		}
	}
}
function yr(e) {
	let t = _r.get(e);
	t && (t.flags |= 8, _r.delete(e));
}
Le().requestIdleCallback, Le().cancelIdleCallback;
var br = (e) => !!e.type.__asyncLoader, xr = (e) => e.type.__isKeepAlive;
function Sr(e, t) {
	wr(e, "a", t);
}
function Cr(e, t) {
	wr(e, "da", t);
}
function wr(e, t, n = Q) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (Er(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) xr(e.parent.vnode) && Tr(r, t, n, e), e = e.parent;
	}
}
function Tr(e, t, n, r) {
	let i = Er(t, e, r, !0);
	Nr(() => {
		me(r[t], i);
	}, n);
}
function Er(e, t, n = Q, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			gt();
			let i = wa(n), a = Nn(t, n, e, r);
			return i(), _t(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Dr = (e) => (t, n = Q) => {
	(!Da || e === "sp") && Er(e, (...e) => t(...e), n);
}, Or = Dr("bm"), kr = Dr("m"), Ar = Dr("bu"), jr = Dr("u"), Mr = Dr("bum"), Nr = Dr("um"), Pr = Dr("sp"), Fr = Dr("rtg"), Ir = Dr("rtc");
function Lr(e, t = Q) {
	Er("ec", e, t);
}
var Rr = /* @__PURE__ */ Symbol.for("v-ndc");
function zr(e, t, n, r) {
	let i, a = n && n[r], o = E(e);
	if (o || O(e)) {
		let n = o && /* @__PURE__ */ pn(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ L(e), s = /* @__PURE__ */ mn(e), e = kt(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? vn(_n(e[n])) : _n(e[n]) : e[n], n, void 0, a && a[n]);
	} else if (typeof e == "number") {
		i = Array(e);
		for (let n = 0; n < e; n++) i[n] = t(n + 1, n, void 0, a && a[n]);
	} else if (A(e)) if (e[Symbol.iterator]) i = Array.from(e, (e, n) => t(e, n, void 0, a && a[n]));
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
var Br = (e) => e ? Ea(e) ? Ia(e) : Br(e.parent) : null, Vr = /* @__PURE__ */ w(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => Br(e.parent),
	$root: (e) => Br(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => Xr(e),
	$forceUpdate: (e) => e.f ||= () => {
		Wn(e.update);
	},
	$nextTick: (e) => e.n ||= Hn.bind(e.proxy),
	$watch: (e) => cr.bind(e)
}), Hr = (e, t) => e !== C && !e.__isScriptSetup && T(e, t), Ur = {
	get({ _: e }, t) {
		if (t === "__v_skip") return !0;
		let { ctx: n, setupState: r, data: i, props: a, accessCache: o, type: s, appContext: c } = e;
		if (t[0] !== "$") {
			let e = o[t];
			if (e !== void 0) switch (e) {
				case 1: return r[t];
				case 2: return i[t];
				case 4: return n[t];
				case 3: return a[t];
			}
			else if (Hr(r, t)) return o[t] = 1, r[t];
			else if (i !== C && T(i, t)) return o[t] = 2, i[t];
			else if (T(a, t)) return o[t] = 3, a[t];
			else if (n !== C && T(n, t)) return o[t] = 4, n[t];
			else Gr && (o[t] = 0);
		}
		let l = Vr[t], u, d;
		if (l) return t === "$attrs" && I(e.attrs, "get", ""), l(e);
		if ((u = s.__cssModules) && (u = u[t])) return u;
		if (n !== C && T(n, t)) return o[t] = 4, n[t];
		if (d = c.config.globalProperties, T(d, t)) return d[t];
	},
	set({ _: e }, t, n) {
		let { data: r, setupState: i, ctx: a } = e;
		return Hr(i, t) ? (i[t] = n, !0) : r !== C && T(r, t) ? (r[t] = n, !0) : T(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (a[t] = n, !0);
	},
	has({ _: { data: e, setupState: t, accessCache: n, ctx: r, appContext: i, props: a, type: o } }, s) {
		let c;
		return !!(n[s] || e !== C && s[0] !== "$" && T(e, s) || Hr(t, s) || T(a, s) || T(r, s) || T(Vr, s) || T(i.config.globalProperties, s) || (c = o.__cssModules) && c[s]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? T(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function Wr(e) {
	return E(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var Gr = !0;
function Kr(e) {
	let t = Xr(e), n = e.proxy, r = e.ctx;
	Gr = !1, t.beforeCreate && Jr(t.beforeCreate, e, "bc");
	let { data: i, computed: a, methods: o, watch: s, provide: c, inject: l, created: u, beforeMount: d, mounted: f, beforeUpdate: p, updated: m, activated: h, deactivated: g, beforeDestroy: _, beforeUnmount: v, destroyed: y, unmounted: b, render: ee, renderTracked: x, renderTriggered: te, errorCaptured: ne, serverPrefetch: re, expose: ie, inheritAttrs: ae, components: oe, directives: se, filters: ce } = t;
	if (l && qr(l, r, null), o) for (let e in o) {
		let t = o[e];
		D(t) && (r[e] = t.bind(n));
	}
	if (i) {
		let t = i.call(n, n);
		A(t) && (e.data = /* @__PURE__ */ ln(t));
	}
	if (Gr = !0, a) for (let e in a) {
		let t = a[e], i = $({
			get: D(t) ? t.bind(n, n) : D(t.get) ? t.get.bind(n, n) : ue,
			set: !D(t) && D(t.set) ? t.set.bind(n) : ue
		});
		Object.defineProperty(r, e, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		});
	}
	if (s) for (let e in s) Yr(s[e], r, n, e);
	if (c) {
		let e = D(c) ? c.call(n) : c;
		Reflect.ownKeys(e).forEach((t) => {
			nr(t, e[t]);
		});
	}
	u && Jr(u, e, "c");
	function S(e, t) {
		E(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (S(Or, d), S(kr, f), S(Ar, p), S(jr, m), S(Sr, h), S(Cr, g), S(Lr, ne), S(Ir, x), S(Fr, te), S(Mr, v), S(Nr, b), S(Pr, re), E(ie)) if (ie.length) {
		let t = e.exposed ||= {};
		ie.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	ee && e.render === ue && (e.render = ee), ae != null && (e.inheritAttrs = ae), oe && (e.components = oe), se && (e.directives = se), re && hr(e);
}
function qr(e, t, n = ue) {
	E(e) && (e = ti(e));
	for (let n in e) {
		let r = e[n], i;
		i = A(r) ? "default" in r ? rr(r.from || n, r.default, !0) : rr(r.from || n) : rr(r), /* @__PURE__ */ z(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function Jr(e, t, n) {
	Nn(E(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function Yr(e, t, n, r) {
	let i = r.includes(".") ? lr(n, r) : () => n[r];
	if (O(e)) {
		let n = t[e];
		D(n) && or(i, n);
	} else if (D(e)) or(i, e.bind(n));
	else if (A(e)) if (E(e)) e.forEach((e) => Yr(e, t, n, r));
	else {
		let r = D(e.handler) ? e.handler.bind(n) : t[e.handler];
		D(r) && or(i, r, e);
	}
}
function Xr(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => Zr(c, e, o, !0)), Zr(c, t, o)), A(t) && a.set(t, c), c;
}
function Zr(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && Zr(e, a, n, !0), i && i.forEach((t) => Zr(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = Qr[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var Qr = {
	data: $r,
	props: ri,
	emits: ri,
	methods: ni,
	computed: ni,
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
	components: ni,
	directives: ni,
	watch: ii,
	provide: $r,
	inject: ei
};
function $r(e, t) {
	return t ? e ? function() {
		return w(D(e) ? e.call(this, this) : e, D(t) ? t.call(this, this) : t);
	} : t : e;
}
function ei(e, t) {
	return ni(ti(e), ti(t));
}
function ti(e) {
	if (E(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function H(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function ni(e, t) {
	return e ? w(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function ri(e, t) {
	return e ? E(e) && E(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : w(/* @__PURE__ */ Object.create(null), Wr(e), Wr(t ?? {})) : t;
}
function ii(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = w(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = H(e[r], t[r]);
	return n;
}
function ai() {
	return {
		app: null,
		config: {
			isNativeTag: de,
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
var oi = 0;
function si(e, t) {
	return function(n, r = null) {
		D(n) || (n = w({}, n)), r != null && !A(r) && (r = null);
		let i = ai(), a = /* @__PURE__ */ new WeakSet(), o = [], s = !1, c = i.app = {
			_uid: oi++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: Ra,
			get config() {
				return i.config;
			},
			set config(e) {},
			use(e, ...t) {
				return a.has(e) || (e && D(e.install) ? (a.add(e), e.install(c, ...t)) : D(e) && (a.add(e), e(c, ...t))), c;
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
					let u = c._ceVNode || Y(n, r);
					return u.appContext = i, l === !0 ? l = "svg" : l === !1 && (l = void 0), o && t ? t(u, a) : e(u, a, l), s = !0, c._container = a, a.__vue_app__ = c, Ia(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				s && (Nn(o, c._instance, 16), e(null, c._container), delete c._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, c;
			},
			runWithContext(e) {
				let t = ci;
				ci = c;
				try {
					return e();
				} finally {
					ci = t;
				}
			}
		};
		return c;
	};
}
var ci = null, li = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${j(t)}Modifiers`] || e[`${M(t)}Modifiers`];
function ui(e, t, ...n) {
	if (e.isUnmounted) return;
	let r = e.vnode.props || C, i = n, a = t.startsWith("update:"), o = a && li(r, t.slice(7));
	o && (o.trim && (i = n.map((e) => O(e) ? e.trim() : e)), o.number && (i = n.map(Pe)));
	let s, c = r[s = Ae(t)] || r[s = Ae(j(t))];
	!c && a && (c = r[s = Ae(M(t))]), c && Nn(c, e, 6, i);
	let l = r[s + "Once"];
	if (l) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[s]) return;
		e.emitted[s] = !0, Nn(l, e, 6, i);
	}
}
var di = /* @__PURE__ */ new WeakMap();
function fi(e, t, n = !1) {
	let r = n ? di : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, s = !1;
	if (!D(e)) {
		let r = (e) => {
			let n = fi(e, t, !0);
			n && (s = !0, w(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !s ? (A(e) && r.set(e, null), null) : (E(a) ? a.forEach((e) => o[e] = null) : w(o, a), A(e) && r.set(e, o), o);
}
function pi(e, t) {
	return !e || !fe(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), T(e, t[0].toLowerCase() + t.slice(1)) || T(e, M(t)) || T(e, t));
}
function mi(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: o, attrs: s, emit: c, render: l, renderCache: u, props: d, data: f, setupState: p, ctx: m, inheritAttrs: h } = e, g = $n(e), _, v;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			_ = pa(l.call(t, e, u, d, p, f, m)), v = s;
		} else {
			let e = t;
			_ = pa(e.length > 1 ? e(d, {
				attrs: s,
				slots: o,
				emit: c
			}) : e(d, null)), v = t.props ? s : hi(s);
		}
	} catch (t) {
		ea.length = 0, Pn(t, e, 1), _ = Y(Qi);
	}
	let y = _;
	if (v && h !== !1) {
		let e = Object.keys(v), { shapeFlag: t } = y;
		e.length && t & 7 && (a && e.some(pe) && (v = gi(v, a)), y = fa(y, v, !1, !0));
	}
	return n.dirs && (y = fa(y, null, !1, !0), y.dirs = y.dirs ? y.dirs.concat(n.dirs) : n.dirs), n.transition && pr(y, n.transition), _ = y, $n(g), _;
}
var hi = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || fe(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, gi = (e, t) => {
	let n = {};
	for (let r in e) (!pe(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function _i(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? vi(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (yi(o, r, n) && !pi(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? vi(r, o, l) : !0 : !!o;
	return !1;
}
function vi(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (yi(t, e, a) && !pi(n, a)) return !0;
	}
	return !1;
}
function yi(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && A(r) && A(i) ? !Je(r, i) : r !== i;
}
function bi({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var xi = {}, Si = () => Object.create(xi), Ci = (e) => Object.getPrototypeOf(e) === xi;
function wi(e, t, n, r = !1) {
	let i = {}, a = Si();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), Ei(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ un(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Ti(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ R(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (pi(e.emitsOptions, o)) continue;
				let u = t[o];
				if (c) if (T(a, o)) u !== a[o] && (a[o] = u, l = !0);
				else {
					let t = j(o);
					i[t] = Di(c, s, t, u, e, !1);
				}
				else u !== a[o] && (a[o] = u, l = !0);
			}
		}
	} else {
		Ei(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !T(t, a) && ((r = M(a)) === a || !T(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Di(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !T(t, e)) && (delete a[e], l = !0);
	}
	l && Dt(e.attrs, "set", "");
}
function Ei(e, t, n, r) {
	let [i, a] = e.propsOptions, o = !1, s;
	if (t) for (let c in t) {
		if (Te(c)) continue;
		let l = t[c], u;
		i && T(i, u = j(c)) ? !a || !a.includes(u) ? n[u] = l : (s ||= {})[u] = l : pi(e.emitsOptions, c) || (!(c in r) || l !== r[c]) && (r[c] = l, o = !0);
	}
	if (a) {
		let t = /* @__PURE__ */ R(n), r = s || C;
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			n[s] = Di(i, t, s, r[s], e, !T(r, s));
		}
	}
	return o;
}
function Di(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = T(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && D(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = wa(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === M(n)) && (r = !0));
	}
	return r;
}
var Oi = /* @__PURE__ */ new WeakMap();
function ki(e, t, n = !1) {
	let r = n ? Oi : t.propsCache, i = r.get(e);
	if (i) return i;
	let a = e.props, o = {}, s = [], c = !1;
	if (!D(e)) {
		let r = (e) => {
			c = !0;
			let [n, r] = ki(e, t, !0);
			w(o, n), r && s.push(...r);
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	if (!a && !c) return A(e) && r.set(e, le), le;
	if (E(a)) for (let e = 0; e < a.length; e++) {
		let t = j(a[e]);
		Ai(t) && (o[t] = C);
	}
	else if (a) for (let e in a) {
		let t = j(e);
		if (Ai(t)) {
			let n = a[e], r = o[t] = E(n) || D(n) ? { type: n } : w({}, n), i = r.type, c = !1, l = !0;
			if (E(i)) for (let e = 0; e < i.length; ++e) {
				let t = i[e], n = D(t) && t.name;
				if (n === "Boolean") {
					c = !0;
					break;
				} else n === "String" && (l = !1);
			}
			else c = D(i) && i.name === "Boolean";
			r[0] = c, r[1] = l, (c || T(r, "default")) && s.push(t);
		}
	}
	let l = [o, s];
	return A(e) && r.set(e, l), l;
}
function Ai(e) {
	return e[0] !== "$" && !Te(e);
}
var ji = (e) => e === "_" || e === "_ctx" || e === "$stable", Mi = (e) => E(e) ? e.map(pa) : [pa(e)], Ni = (e, t, n) => {
	if (t._n) return t;
	let r = er((...e) => Mi(t(...e)), n);
	return r._c = !1, r;
}, Pi = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (ji(n)) continue;
		let i = e[n];
		if (D(i)) t[n] = Ni(n, i, r);
		else if (i != null) {
			let e = Mi(i);
			t[n] = () => e;
		}
	}
}, Fi = (e, t) => {
	let n = Mi(t);
	e.slots.default = () => n;
}, Ii = (e, t, n) => {
	for (let r in t) (n || !ji(r)) && (e[r] = t[r]);
}, Li = (e, t, n) => {
	let r = e.slots = Si();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (Ii(r, t, n), n && Ne(r, "_", e, !0)) : Pi(t, r);
	} else t && Fi(e, t);
}, Ri = (e, t, n) => {
	let { vnode: r, slots: i } = e, a = !0, o = C;
	if (r.shapeFlag & 32) {
		let e = t._;
		e ? n && e === 1 ? a = !1 : Ii(i, t, n) : (a = !t.$stable, Pi(t, i)), o = t;
	} else t && (Fi(e, t), o = { default: 1 });
	if (a) for (let e in i) !ji(e) && o[e] == null && delete i[e];
}, U = Xi;
function zi(e) {
	return Bi(e);
}
function Bi(e, t) {
	let n = Le();
	n.__VUE__ = !0;
	let { insert: r, remove: i, patchProp: a, createElement: o, createText: s, createComment: c, setText: l, setElementText: u, parentNode: d, nextSibling: f, setScopeId: p = ue, insertStaticContent: m } = e, h = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !sa(e, t) && (r = D(e), T(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case Zi:
				g(e, t, n, r);
				break;
			case Qi:
				_(e, t, n, r);
				break;
			case $i:
				e ?? v(t, n, r, o);
				break;
			case W:
				oe(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? ee(e, t, n, r, i, a, o, s, c) : d & 6 ? se(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, A);
		}
		u != null && i ? vr(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && vr(e.ref, null, a, e, !0);
	}, g = (e, t, n, i) => {
		if (e == null) r(t.el = s(t.children), n, i);
		else {
			let n = t.el = e.el;
			t.children !== e.children && l(n, t.children);
		}
	}, _ = (e, t, n, i) => {
		e == null ? r(t.el = c(t.children || ""), n, i) : t.el = e.el;
	}, v = (e, t, n, r) => {
		[e.el, e.anchor] = m(e.children, t, n, r, e.el, e.anchor);
	}, y = ({ el: e, anchor: t }, n, i) => {
		let a;
		for (; e && e !== t;) a = f(e), r(e, n, i), e = a;
		r(t, n, i);
	}, b = ({ el: e, anchor: t }) => {
		let n;
		for (; e && e !== t;) n = f(e), i(e), e = n;
		i(t);
	}, ee = (e, t, n, r, i, a, o, s, c) => {
		if (t.type === "svg" ? o = "svg" : t.type === "math" && (o = "mathml"), e == null) x(t, n, r, i, a, o, s, c);
		else {
			let n = e.el && e.el._isVueCE ? e.el : null;
			try {
				n && n._beginPatch(), re(e, t, i, a, o, s, c);
			} finally {
				n && n._endPatch();
			}
		}
	}, x = (e, t, n, i, s, c, l, d) => {
		let f, p, { props: m, shapeFlag: h, transition: g, dirs: _ } = e;
		if (f = e.el = o(e.type, c, m && m.is, m), h & 8 ? u(f, e.children) : h & 16 && ne(e.children, f, null, i, s, Vi(e, c), l, d), _ && tr(e, null, i, "created"), te(f, e, e.scopeId, l, i), m) {
			for (let e in m) e !== "value" && !Te(e) && a(f, e, null, m[e], c, i);
			"value" in m && a(f, "value", null, m.value, c), (p = m.onVnodeBeforeMount) && _a(p, i, e);
		}
		_ && tr(e, null, i, "beforeMount");
		let v = Ui(s, g);
		v && g.beforeEnter(f), r(f, t, n), ((p = m && m.onVnodeMounted) || v || _) && U(() => {
			try {
				p && _a(p, i, e), v && g.enter(f), _ && tr(e, null, i, "mounted");
			} finally {}
		}, s);
	}, te = (e, t, n, r, i) => {
		if (n && p(e, n), r) for (let t = 0; t < r.length; t++) p(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || Yi(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				te(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, ne = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) h(null, e[l] = s ? ma(e[l]) : pa(e[l]), t, n, r, i, a, o, s);
	}, re = (e, t, n, r, i, o, s) => {
		let c = t.el = e.el, { patchFlag: l, dynamicChildren: d, dirs: f } = t;
		l |= e.patchFlag & 16;
		let p = e.props || C, m = t.props || C, h;
		if (n && Hi(n, !1), (h = m.onVnodeBeforeUpdate) && _a(h, n, t, e), f && tr(t, e, n, "beforeUpdate"), n && Hi(n, !0), (p.innerHTML && m.innerHTML == null || p.textContent && m.textContent == null) && u(c, ""), d ? ie(e.dynamicChildren, d, c, n, r, Vi(t, i), o) : s || pe(e, t, c, null, n, r, Vi(t, i), o, !1), l > 0) {
			if (l & 16) ae(c, p, m, n, i);
			else if (l & 2 && p.class !== m.class && a(c, "class", null, m.class, i), l & 4 && a(c, "style", p.style, m.style, i), l & 8) {
				let e = t.dynamicProps;
				for (let t = 0; t < e.length; t++) {
					let r = e[t], o = p[r], s = m[r];
					(s !== o || r === "value") && a(c, r, o, s, i, n);
				}
			}
			l & 1 && e.children !== t.children && u(c, t.children);
		} else !s && d == null && ae(c, p, m, n, i);
		((h = m.onVnodeUpdated) || f) && U(() => {
			h && _a(h, n, t, e), f && tr(t, e, n, "updated");
		}, r);
	}, ie = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			h(c, l, c.el && (c.type === W || !sa(c, l) || c.shapeFlag & 198) ? d(c.el) : n, null, r, i, a, o, !0);
		}
	}, ae = (e, t, n, r, i) => {
		if (t !== n) {
			if (t !== C) for (let o in t) !Te(o) && !(o in n) && a(e, o, t[o], null, i, r);
			for (let o in n) {
				if (Te(o)) continue;
				let s = n[o], c = t[o];
				s !== c && o !== "value" && a(e, o, c, s, i, r);
			}
			"value" in n && a(e, "value", t.value, n.value, i);
		}
	}, oe = (e, t, n, i, a, o, c, l, u) => {
		let d = t.el = e ? e.el : s(""), f = t.anchor = e ? e.anchor : s(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (l = l ? l.concat(h) : h), e == null ? (r(d, n, i), r(f, n, i), ne(t.children || [], n, f, a, o, c, l, u)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (ie(e.dynamicChildren, m, n, a, o, c, l), (t.key != null || a && t === a.subTree) && Wi(e, t, !0)) : pe(e, t, n, f, a, o, c, l, u);
	}, se = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : ce(t, n, r, i, a, o, c) : S(e, t, c);
	}, ce = (e, t, n, r, i, a, o) => {
		let s = e.component = ba(e, r, i);
		if (xr(e) && (s.ctx.renderer = A), Oa(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, de, o), !e.el) {
				let r = s.subTree = Y(Qi);
				_(null, r, t, n), e.placeholder = r.el;
			}
		} else de(s, e, t, n, i, a, o);
	}, S = (e, t, n) => {
		let r = t.component = e.component;
		if (_i(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			fe(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, de = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = Ki(e);
					if (n) {
						t && (t.el = c.el, fe(e, t, o)), n.asyncDep.then(() => {
							U(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, f;
				Hi(e, !1), t ? (t.el = c.el, fe(e, t, o)) : t = c, n && Me(n), (f = t.props && t.props.onVnodeBeforeUpdate) && _a(f, s, t, c), Hi(e, !0);
				let p = mi(e), m = e.subTree;
				e.subTree = p, h(m, p, d(m.el), D(m), e, i, a), t.el = p.el, u === null && bi(e, p.el), r && U(r, i), (f = t.props && t.props.onVnodeUpdated) && U(() => _a(f, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = br(t);
				if (Hi(e, !1), l && Me(l), !m && (o = c && c.onVnodeBeforeMount) && _a(o, d, t), Hi(e, !0), s && be) {
					let t = () => {
						e.subTree = mi(e), be(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = mi(e);
					h(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && U(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					U(() => _a(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && br(d.vnode) && d.vnode.shapeFlag & 256) && e.a && U(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new tt(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => Wn(u), Hi(e, !0), l();
	}, fe = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Ti(e, t.props, r, n), Ri(e, t.children, n), gt(), qn(e), _t();
	}, pe = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, d = e ? e.shapeFlag : 0, f = t.children, { patchFlag: p, shapeFlag: m } = t;
		if (p > 0) {
			if (p & 128) {
				me(l, f, n, r, i, a, o, s, c);
				return;
			} else if (p & 256) {
				w(l, f, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (d & 16 && ve(l, i, a), f !== l && u(n, f)) : d & 16 ? m & 16 ? me(l, f, n, r, i, a, o, s, c) : ve(l, i, a, !0) : (d & 8 && u(n, ""), m & 16 && ne(f, n, r, i, a, o, s, c));
	}, w = (e, t, n, r, i, a, o, s, c) => {
		e ||= le, t ||= le;
		let l = e.length, u = t.length, d = Math.min(l, u), f;
		for (f = 0; f < d; f++) {
			let r = t[f] = c ? ma(t[f]) : pa(t[f]);
			h(e[f], r, n, null, i, a, o, s, c);
		}
		l > u ? ve(e, i, a, !0, !1, d) : ne(t, n, r, i, a, o, s, c, d);
	}, me = (e, t, n, r, i, a, o, s, c) => {
		let l = 0, u = t.length, d = e.length - 1, f = u - 1;
		for (; l <= d && l <= f;) {
			let r = e[l], u = t[l] = c ? ma(t[l]) : pa(t[l]);
			if (sa(r, u)) h(r, u, n, null, i, a, o, s, c);
			else break;
			l++;
		}
		for (; l <= d && l <= f;) {
			let r = e[d], l = t[f] = c ? ma(t[f]) : pa(t[f]);
			if (sa(r, l)) h(r, l, n, null, i, a, o, s, c);
			else break;
			d--, f--;
		}
		if (l > d) {
			if (l <= f) {
				let e = f + 1, d = e < u ? t[e].el : r;
				for (; l <= f;) h(null, t[l] = c ? ma(t[l]) : pa(t[l]), n, d, i, a, o, s, c), l++;
			}
		} else if (l > f) for (; l <= d;) T(e[l], i, a, !0), l++;
		else {
			let p = l, m = l, g = /* @__PURE__ */ new Map();
			for (l = m; l <= f; l++) {
				let e = t[l] = c ? ma(t[l]) : pa(t[l]);
				e.key != null && g.set(e.key, l);
			}
			let _, v = 0, y = f - m + 1, b = !1, ee = 0, x = Array(y);
			for (l = 0; l < y; l++) x[l] = 0;
			for (l = p; l <= d; l++) {
				let r = e[l];
				if (v >= y) {
					T(r, i, a, !0);
					continue;
				}
				let u;
				if (r.key != null) u = g.get(r.key);
				else for (_ = m; _ <= f; _++) if (x[_ - m] === 0 && sa(r, t[_])) {
					u = _;
					break;
				}
				u === void 0 ? T(r, i, a, !0) : (x[u - m] = l + 1, u >= ee ? ee = u : b = !0, h(r, t[u], n, null, i, a, o, s, c), v++);
			}
			let te = b ? Gi(x) : le;
			for (_ = te.length - 1, l = y - 1; l >= 0; l--) {
				let e = m + l, d = t[e], f = t[e + 1], p = e + 1 < u ? f.el || Ji(f) : r;
				x[l] === 0 ? h(null, d, n, p, i, a, o, s, c) : b && (_ < 0 || l !== te[_] ? he(d, n, p, 2) : _--);
			}
		}
	}, he = (e, t, n, a, o = null) => {
		let { el: s, type: c, transition: l, children: u, shapeFlag: d } = e;
		if (d & 6) {
			he(e.component.subTree, t, n, a);
			return;
		}
		if (d & 128) {
			e.suspense.move(t, n, a);
			return;
		}
		if (d & 64) {
			c.move(e, t, n, A);
			return;
		}
		if (c === W) {
			r(s, t, n);
			for (let e = 0; e < u.length; e++) he(u[e], t, n, a);
			r(e.anchor, t, n);
			return;
		}
		if (c === $i) {
			y(e, t, n);
			return;
		}
		if (a !== 2 && d & 1 && l) if (a === 0) l.beforeEnter(s), r(s, t, n), U(() => l.enter(s), o);
		else {
			let { leave: a, delayLeave: o, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? i(s) : r(s, t, n);
			}, d = () => {
				s._isLeaving && s[fr](!0), a(s, () => {
					u(), c && c();
				});
			};
			o ? o(s, u, d) : d();
		}
		else r(s, t, n);
	}, T = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (gt(), vr(s, null, n, e, !0), _t()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !br(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && _a(_, t, e), u & 6) _e(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && tr(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, A, r) : l && !l.hasOnce && (a !== W || d > 0 && d & 64) ? ve(l, t, n, !1, !0) : (a === W && d & 384 || !i && u & 16) && ve(c, t, n), r && E(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && U(() => {
			_ && _a(_, t, e), h && tr(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, E = (e) => {
		let { type: t, el: n, anchor: r, transition: a } = e;
		if (t === W) {
			ge(n, r);
			return;
		}
		if (t === $i) {
			b(e);
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
		for (; e !== t;) n = f(e), i(e), e = n;
		i(t);
	}, _e = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		qi(c), qi(l), r && Me(r), i.stop(), a && (a.flags |= 8, T(o, e, t, n)), s && U(s, t), U(() => {
			e.isUnmounted = !0;
		}, t);
	}, ve = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) T(e[o], t, n, r, i);
	}, D = (e) => {
		if (e.shapeFlag & 6) return D(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = f(e.anchor || e.el), n = t && t[ur];
		return n ? f(n) : t;
	}, O = !1, k = (e, t, n) => {
		let r;
		e == null ? t._vnode && (T(t._vnode, null, null, !0), r = t._vnode.component) : h(t._vnode || null, e, t, null, null, null, n), t._vnode = e, O ||= (O = !0, qn(r), Jn(), !1);
	}, A = {
		p: h,
		um: T,
		m: he,
		r: E,
		mt: ce,
		mc: ne,
		pc: pe,
		pbc: ie,
		n: D,
		o: e
	}, ye, be;
	return t && ([ye, be] = t(A)), {
		render: k,
		hydrate: ye,
		createApp: si(k, ye)
	};
}
function Vi({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function Hi({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Ui(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Wi(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (E(r) && E(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = ma(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && Wi(t, a)), a.type === Zi && (a.patchFlag === -1 && (a = i[e] = ma(a)), a.el = t.el), a.type === Qi && !a.el && (a.el = t.el);
	}
}
function Gi(e) {
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
function Ki(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : Ki(t);
}
function qi(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function Ji(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? Ji(t.subTree) : null;
}
var Yi = (e) => e.__isSuspense;
function Xi(e, t) {
	t && t.pendingBranch ? E(e) ? t.effects.push(...e) : t.effects.push(e) : Kn(e);
}
var W = /* @__PURE__ */ Symbol.for("v-fgt"), Zi = /* @__PURE__ */ Symbol.for("v-txt"), Qi = /* @__PURE__ */ Symbol.for("v-cmt"), $i = /* @__PURE__ */ Symbol.for("v-stc"), ea = [], G = null;
function K(e = !1) {
	ea.push(G = e ? null : []);
}
function ta() {
	ea.pop(), G = ea[ea.length - 1] || null;
}
var na = 1;
function ra(e, t = !1) {
	na += e, e < 0 && G && t && (G.hasOnce = !0);
}
function ia(e) {
	return e.dynamicChildren = na > 0 ? G || le : null, ta(), na > 0 && G && G.push(e), e;
}
function q(e, t, n, r, i, a) {
	return ia(J(e, t, n, r, i, a, !0));
}
function aa(e, t, n, r, i) {
	return ia(Y(e, t, n, r, i, !0));
}
function oa(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function sa(e, t) {
	return e.type === t.type && e.key === t.key;
}
var ca = ({ key: e }) => e ?? null, la = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : O(e) || /* @__PURE__ */ z(e) || D(e) ? {
	i: Zn,
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
		key: t && ca(t),
		ref: t && la(t),
		scopeId: Qn,
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
		ctx: Zn
	};
	return s ? (ha(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= O(n) ? 8 : 16), na > 0 && !o && G && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && G.push(c), c;
}
var Y = ua;
function ua(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === Rr) && (e = Qi), oa(e)) {
		let r = fa(e, t, !0);
		return n && ha(r, n), na > 0 && !a && G && (r.shapeFlag & 6 ? G[G.indexOf(e)] = r : G.push(r)), r.patchFlag = -2, r;
	}
	if (La(e) && (e = e.__vccOpts), t) {
		t = da(t);
		let { class: e, style: n } = t;
		e && !O(e) && (t.class = Ue(e)), A(n) && (/* @__PURE__ */ hn(n) && !E(n) && (n = w({}, n)), t.style = Re(n));
	}
	let o = O(e) ? 1 : Yi(e) ? 128 : dr(e) ? 64 : A(e) ? 4 : D(e) ? 2 : 0;
	return J(e, t, n, r, i, o, a, !0);
}
function da(e) {
	return e ? /* @__PURE__ */ hn(e) || Ci(e) ? w({}, e) : e : null;
}
function fa(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? ga(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && ca(l),
		ref: t && t.ref ? n && a ? E(a) ? a.concat(la(t)) : [a, la(t)] : la(t) : a,
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
		ssContent: e.ssContent && fa(e.ssContent),
		ssFallback: e.ssFallback && fa(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && pr(u, c.clone(u)), u;
}
function X(e = " ", t = 0) {
	return Y(Zi, null, e, t);
}
function Z(e = "", t = !1) {
	return t ? (K(), aa(Qi, null, e)) : Y(Qi, null, e);
}
function pa(e) {
	return e == null || typeof e == "boolean" ? Y(Qi) : E(e) ? Y(W, null, e.slice()) : oa(e) ? ma(e) : Y(Zi, null, String(e));
}
function ma(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : fa(e);
}
function ha(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (E(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), ha(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Ci(t) ? t._ctx = Zn : r === 3 && Zn && (Zn.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else D(t) ? (t = {
		default: t,
		_ctx: Zn
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [X(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function ga(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = Ue([t.class, r.class]));
		else if (e === "style") t.style = Re([t.style, r.style]);
		else if (fe(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(E(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !pe(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function _a(e, t, n, r = null) {
	Nn(e, t, 7, [n, r]);
}
var va = ai(), ya = 0;
function ba(e, t, n) {
	let r = e.type, i = (t ? t.appContext : e.appContext) || va, a = {
		uid: ya++,
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
		scope: new Qe(!0),
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
		propsOptions: ki(r, i),
		emitsOptions: fi(r, i),
		emit: null,
		emitted: null,
		propsDefaults: C,
		inheritAttrs: r.inheritAttrs,
		ctx: C,
		data: C,
		props: C,
		attrs: C,
		slots: C,
		refs: C,
		setupState: C,
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
	return a.ctx = { _: a }, a.root = t ? t.root : a, a.emit = ui.bind(null, a), e.ce && e.ce(a), a;
}
var Q = null, xa = () => Q || Zn, Sa, Ca;
{
	let e = Le(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Sa = t("__VUE_INSTANCE_SETTERS__", (e) => Q = e), Ca = t("__VUE_SSR_SETTERS__", (e) => Da = e);
}
var wa = (e) => {
	let t = Q;
	return Sa(e), e.scope.on(), () => {
		e.scope.off(), Sa(t);
	};
}, Ta = () => {
	Q && Q.scope.off(), Sa(null);
};
function Ea(e) {
	return e.vnode.shapeFlag & 4;
}
var Da = !1;
function Oa(e, t = !1, n = !1) {
	t && Ca(t);
	let { props: r, children: i } = e.vnode, a = Ea(e);
	wi(e, r, a, t), Li(e, i, n || t);
	let o = a ? ka(e, t) : void 0;
	return t && Ca(!1), o;
}
function ka(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Ur);
	let { setup: r } = n;
	if (r) {
		gt();
		let n = e.setupContext = r.length > 1 ? Fa(e) : null, i = wa(e), a = Mn(r, e, 0, [e.props, n]), o = ye(a);
		if (_t(), i(), (o || e.sp) && !br(e) && hr(e), o) {
			if (a.then(Ta, Ta), t) return a.then((n) => {
				Aa(e, n, t);
			}).catch((t) => {
				Pn(t, e, 0);
			});
			e.asyncDep = a;
		} else Aa(e, a, t);
	} else Na(e, t);
}
function Aa(e, t, n) {
	D(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : A(t) && (e.setupState = Cn(t)), Na(e, n);
}
var ja, Ma;
function Na(e, t, n) {
	let r = e.type;
	if (!e.render) {
		if (!t && ja && !r.render) {
			let t = r.template || Xr(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: i } = e.appContext.config, { delimiters: a, compilerOptions: o } = r;
				r.render = ja(t, w(w({
					isCustomElement: n,
					delimiters: a
				}, i), o));
			}
		}
		e.render = r.render || ue, Ma && Ma(e);
	}
	{
		let t = wa(e);
		gt();
		try {
			Kr(e);
		} finally {
			_t(), t();
		}
	}
}
var Pa = { get(e, t) {
	return I(e, "get", ""), e[t];
} };
function Fa(e) {
	return {
		attrs: new Proxy(e.attrs, Pa),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function Ia(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(Cn(gn(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in Vr) return Vr[n](e);
		},
		has(e, t) {
			return t in e || t in Vr;
		}
	}) : e.proxy;
}
function La(e) {
	return D(e) && "__vccOpts" in e;
}
var $ = (e, t) => /* @__PURE__ */ Tn(e, t, Da), Ra = "3.5.34", za = void 0, Ba = typeof window < "u" && window.trustedTypes;
if (Ba) try {
	za = /* @__PURE__ */ Ba.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var Va = za ? (e) => za.createHTML(e) : (e) => e, Ha = "http://www.w3.org/2000/svg", Ua = "http://www.w3.org/1998/Math/MathML", Wa = typeof document < "u" ? document : null, Ga = Wa && /* @__PURE__ */ Wa.createElement("template"), Ka = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? Wa.createElementNS(Ha, e) : t === "mathml" ? Wa.createElementNS(Ua, e) : n ? Wa.createElement(e, { is: n }) : Wa.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => Wa.createTextNode(e),
	createComment: (e) => Wa.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => Wa.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			Ga.innerHTML = Va(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = Ga.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, qa = /* @__PURE__ */ Symbol("_vtc");
function Ja(e, t, n) {
	let r = e[qa];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var Ya = /* @__PURE__ */ Symbol("_vod"), Xa = /* @__PURE__ */ Symbol("_vsh"), Za = /* @__PURE__ */ Symbol(""), Qa = /(?:^|;)\s*display\s*:/;
function $a(e, t, n) {
	let r = e.style, i = O(n), a = !1;
	if (n && !i) {
		if (t) if (O(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? to(r, t, "");
		}
		else for (let e in t) n[e] ?? to(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? to(r, i, "") : ao(e, i, !O(t) && t ? t[i] : void 0, o) || to(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[Za];
			e && (n += ";" + e), r.cssText = n, a = Qa.test(n);
		}
	} else t && e.removeAttribute("style");
	Ya in e && (e[Ya] = a ? r.display : "", e[Xa] && (r.display = "none"));
}
var eo = /\s*!important$/;
function to(e, t, n) {
	if (E(n)) n.forEach((n) => to(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = io(e, t);
		eo.test(n) ? e.setProperty(M(r), n.replace(eo, ""), "important") : e[r] = n;
	}
}
var no = [
	"Webkit",
	"Moz",
	"ms"
], ro = {};
function io(e, t) {
	let n = ro[t];
	if (n) return n;
	let r = j(t);
	if (r !== "filter" && r in e) return ro[t] = r;
	r = ke(r);
	for (let n = 0; n < no.length; n++) {
		let i = no[n] + r;
		if (i in e) return ro[t] = i;
	}
	return t;
}
function ao(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && O(r) && n === r;
}
var oo = "http://www.w3.org/1999/xlink";
function so(e, t, n, r, i, a = Ge(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(oo, t.slice(6, t.length)) : e.setAttributeNS(oo, t, n) : n == null || a && !Ke(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : k(n) ? String(n) : n);
}
function co(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? Va(n) : n);
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
		r === "boolean" ? n = Ke(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
	}
	try {
		e[t] = n;
	} catch {}
	o && e.removeAttribute(i || t);
}
function lo(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function uo(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var fo = /* @__PURE__ */ Symbol("_vei");
function po(e, t, n, r, i = null) {
	let a = e[fo] || (e[fo] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = ho(t);
		r ? lo(e, n, a[t] = yo(r, i), s) : o && (uo(e, n, o, s), a[t] = void 0);
	}
}
var mo = /(?:Once|Passive|Capture)$/;
function ho(e) {
	let t;
	if (mo.test(e)) {
		t = {};
		let n;
		for (; n = e.match(mo);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : M(e.slice(2)), t];
}
var go = 0, _o = /* @__PURE__ */ Promise.resolve(), vo = () => go ||= (_o.then(() => go = 0), Date.now());
function yo(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		Nn(bo(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = vo(), n;
}
function bo(e, t) {
	if (E(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var xo = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, So = (e, t, n, r, i, a) => {
	let o = i === "svg";
	t === "class" ? Ja(e, r, o) : t === "style" ? $a(e, n, r) : fe(t) ? pe(t) || po(e, t, n, r, a) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Co(e, t, r, o)) ? (co(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && so(e, t, r, o, a, t !== "value")) : e._isVueCE && (wo(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !O(r))) ? co(e, j(t), r, a, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), so(e, t, r, o));
};
function Co(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && xo(t) && D(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return xo(t) && O(n) ? !1 : t in e;
}
function wo(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = j(t);
	return Array.isArray(n) ? n.some((e) => j(e) === r) : Object.keys(n).some((e) => j(e) === r);
}
var To = {};
/* @__NO_SIDE_EFFECTS__ */
function Eo(e, t, n) {
	let r = /* @__PURE__ */ mr(e, t);
	Ce(r) && (r = w({}, r, t));
	class i extends Oo {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var Do = typeof HTMLElement < "u" ? HTMLElement : class {}, Oo = class e extends Do {
	constructor(e, t = {}, n = Ro) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== Ro ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(w({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, Hn(() => {
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
			if (n && !E(n)) for (let e in n) {
				let t = n[e];
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = Fe(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[j(e)] = !0);
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
		if (t) for (let e in t) T(this, e) || Object.defineProperty(this, e, { get: () => xn(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = E(t) ? t : Object.keys(t || {});
		for (let e of Object.keys(this)) e[0] !== "_" && n.includes(e) && this._setProp(e, this[e]);
		for (let e of n.map(j)) Object.defineProperty(this, e, {
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : To, r = j(e);
		t && this._numberProps && this._numberProps[r] && (n = Fe(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === To ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(M(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(M(e), t + "") : t || this.removeAttribute(M(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), Lo(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Y(this._def, w(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, Ce(t[0]) ? w({ detail: t }, t[0]) : { detail: t }));
			};
			e.emit = (e, ...n) => {
				t(e, n), M(e) !== e && t(M(e), n);
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
}, ko = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], Ao = {
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
	exact: (e, t) => ko.some((n) => e[`${n}Key`] && !t.includes(n))
}, jo = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = Ao[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, Mo = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, No = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = M(n.key);
		if (t.some((e) => e === r || Mo[e] === r)) return e(n);
	}));
}, Po = /* @__PURE__ */ w({ patchProp: So }, Ka), Fo;
function Io() {
	return Fo ||= zi(Po);
}
var Lo = ((...e) => {
	Io().render(...e);
}), Ro = ((...e) => {
	let t = Io().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = Bo(e);
		if (!r) return;
		let i = t._component;
		!D(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, zo(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function zo(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function Bo(e) {
	return O(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function Vo(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function Ho(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function Uo(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (Ho(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			Vo(e.target) || r(e);
		};
	}
	return t;
}
function Wo(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = Uo(e), i = () => {
		n ||= ae(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? or(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), Nr(a);
}
//#endregion
//#region packages/sdk-vue/src/index.ts
function Go(e) {
	Ko(e.tagName, e.component);
	let t = /* @__PURE__ */ Eo(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(Jo(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function Ko(e, t) {
	if (typeof document > "u") return;
	let n = qo(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function qo(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function Jo(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_epics/dist/ext_epics.client.ts
var Yo = {
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
function Xo(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Zo(e) {
	return `comtrya://workspace/${e}`;
}
function Qo(e) {
	switch (e) {
		case "IN_PROGRESS":
		case "AT_RISK":
		case "DONE":
		case "CANCELED": return e;
		default: return "PLANNED";
	}
}
function $o(e) {
	return {
		id: e.id,
		workspaceId: e.workspaceId ?? e.workspace?.replace(/^comtrya:\/\/workspace\//, "") ?? "",
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: Qo(e.state),
		targetDate: e.targetDate ?? null,
		ownerRef: e.ownerRef ?? null,
		labels: e.labels ?? [],
		createdAt: e.createdAt ?? null,
		closedAt: e.closedAt ?? null,
		projectName: e.projectName ?? null
	};
}
async function es(e, t) {
	let n = Xo(await Yo.byRefEpic(t), "epicByRef");
	return n ? $o(n) : null;
}
async function ts(e, t) {
	let n = Xo(await Yo.listEpics({
		workspace: Zo(t.workspaceId),
		limit: 1024
	}), "listEpics").map($o), r = t.state ? Qo(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function ns(e, t) {
	return Xo(await Yo.progressEpic(t), "epicProgress");
}
async function rs(e, t) {
	return Xo(await Yo.issuesInEpic(t), "issuesInEpic");
}
async function is(e, t, n) {
	return $o(Xo(await Yo.changeStateEpic({
		id: t,
		state: n
	}), "changeEpicState"));
}
async function as(e, t) {
	return $o(Xo(await Yo.createEpic({
		workspace: Zo(t.workspaceId),
		title: t.title,
		bodyMarkdown: t.bodyMarkdown ?? "",
		ownerRef: null,
		targetDate: null,
		labels: [],
		parentEpicRef: null,
		projectName: t.projectName ?? null
	}), "createEpic"));
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/types.ts
var os = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", ss = "epics";
function cs(e) {
	return `comtrya://epic/${e.id}`;
}
function ls(e) {
	return a(ss, `/${e.workspaceId}/${e.id}`);
}
function us(e) {
	return `${a(ss, "/new")}?workspaceId=${e}`;
}
function ds(e) {
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
var fs = /* @__PURE__ */ new Map();
function ps(e) {
	return [
		e.id,
		e.title,
		e.state,
		e.projectName ?? ""
	].join("|");
}
var ms = [
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
function hs(e) {
	return e.projectName ? ` (${e.projectName})` : "";
}
function gs(e, t) {
	let n = [], r = hs(e);
	n.push(ce({
		id: `ext_epics.open.${e.id}`,
		title: `Open epic ${e.title}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: () => {
			window.location.href = ls(e);
		}
	}));
	for (let { state: i, verb: a } of ms) e.state !== i && n.push(ce({
		id: `ext_epics.mark.${i.toLowerCase()}.${e.id}`,
		title: `Mark epic ${e.title} ${a}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: async () => {
			await is(t, e.id, i);
		}
	}));
	return () => n.forEach((e) => e());
}
async function _s(e, t) {
	let n;
	try {
		n = await ts(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_epics] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = ps(t), i = fs.get(t.id);
		i && i.signature === n || (i?.unregister(), fs.set(t.id, {
			signature: n,
			unregister: gs(t, e)
		}));
	}
	for (let [e, t] of fs) r.has(e) || (t.unregister(), fs.delete(e));
}
function vs(e) {
	let t = os;
	_s(e, t);
	let n = ["dev.comtrya.epic.created", "dev.comtrya.epic.state-changed"].map((n) => o({
		type: n,
		onEvent: () => {
			_s(e, t);
		},
		onError: () => {}
	}));
	return () => {
		for (let e of n) e();
		for (let e of fs.values()) e.unregister();
		fs.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicCard.vue?vue&type=script&setup=true&lang.ts
var ys = ["data-state"], bs = ["data-epic-id"], xs = { class: "epic-card-title" }, Ss = ["href"], Cs = ["data-author-kind", "title"], ws = { class: "owner-glyph" }, Ts = ["title"], Es = {
	key: 0,
	class: "epic-meta"
}, Ds = {
	key: 1,
	class: "epic-meta"
}, Os = {
	key: 1,
	class: "epic-line muted"
}, ks = {
	key: 2,
	class: "epic-card-fallback"
}, As = { class: "epic-line muted" }, js = { class: "epic-line warn" }, Ms = /* @__PURE__ */ mr({
	__name: "EpicCard",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epic: { type: null },
		ref: { type: String },
		resourceRef: { type: String },
		activeOwner: { type: [String, null] },
		activeProject: { type: [String, null] }
	},
	emits: ["owner-click", "project-click"],
	setup(e, { emit: t }) {
		let n = e, r = t, i = /* @__PURE__ */ B("idle"), a = /* @__PURE__ */ B(null), o = /* @__PURE__ */ B(n.epic ?? null), s = /* @__PURE__ */ B(null), c = $(() => n.resourceRef ?? n.ref ?? ""), l = $(() => n.client ?? n.comtryaClient), u = $(() => n.epic ?? o.value), d = $(() => ds(u.value?.state)), f = $(() => (s.value?.issuesOpen ?? 0) + (s.value?.issuesClosed ?? 0));
		kr(p), or(() => [
			l.value,
			n.epic,
			c.value
		], () => void p());
		async function p() {
			if (n.epic) {
				o.value = n.epic, i.value = "ready", a.value = null, await m();
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
				o.value = await es(l.value, c.value), i.value = o.value ? "ready" : "empty", await m();
			} catch (e) {
				o.value = null, s.value = null, i.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function m() {
			if (!l.value || !c.value) {
				s.value = null;
				return;
			}
			try {
				s.value = await ns(l.value, c.value);
			} catch {
				s.value = null;
			}
		}
		function h(e) {
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
		return (e, t) => (K(), q("article", {
			class: "epic-card",
			"data-state": i.value,
			"data-smoke": "epic-card"
		}, [u.value ? (K(), q("div", {
			key: 0,
			class: "epic-card-body",
			"data-epic-id": u.value.id,
			"data-smoke": "epic-card-body"
		}, [
			J("div", xs, [
				J("span", { class: Ue(["epic-pill", d.value.className]) }, N(d.value.label), 3),
				J("a", {
					class: "epic-title-link",
					href: xn(ls)(u.value)
				}, N(u.value.title), 9, Ss),
				u.value.ownerRef ? (K(), q("button", {
					key: 0,
					type: "button",
					class: Ue(["epic-owner", { active: n.activeOwner === u.value.ownerRef }]),
					"data-author-kind": h(u.value.ownerRef).kind,
					title: `${u.value.ownerRef}\nClick to filter by this owner`,
					onClick: t[0] ||= jo((e) => r("owner-click", u.value.ownerRef), ["prevent", "stop"])
				}, [J("span", ws, N(h(u.value.ownerRef).glyph), 1), X(" " + N(h(u.value.ownerRef).label), 1)], 10, Cs)) : Z("", !0),
				u.value.projectName ? (K(), q("button", {
					key: 1,
					type: "button",
					class: Ue(["epic-project", { active: n.activeProject === u.value.projectName }]),
					title: `${u.value.projectName}\nClick to filter by this project`,
					onClick: t[1] ||= jo((e) => r("project-click", u.value.projectName), ["prevent", "stop"])
				}, [t[2] ||= J("span", { class: "project-glyph" }, "◇", -1), X(" " + N(u.value.projectName), 1)], 10, Ts)) : Z("", !0)
			]),
			s.value ? (K(), q("div", Es, [J("span", null, N(s.value.issuesClosed ?? 0) + "/" + N(f.value) + " issues", 1), J("span", null, N(s.value.percentComplete ?? 0) + "% complete", 1)])) : Z("", !0),
			u.value.targetDate ? (K(), q("div", Ds, [J("span", null, "target: " + N(u.value.targetDate), 1)])) : Z("", !0)
		], 8, bs)) : i.value === "loading" ? (K(), q("p", Os, " Loading " + N(c.value), 1)) : (K(), q("div", ks, [J("p", As, N(c.value || "epic"), 1), J("p", js, N(a.value ?? "epic not found"), 1)]))], 8, ys));
	}
}), Ns = ".epic-card[data-v-2582b594]{display:block}.epic-card-body[data-v-2582b594]{border:1px solid var(--ink-rule,#d0cfc8);gap:6px;padding:10px 12px;display:grid}.epic-card-title[data-v-2582b594]{align-items:baseline;gap:8px;min-width:0;display:flex}.epic-pill[data-v-2582b594],.epic-meta[data-v-2582b594],.epic-line[data-v-2582b594]{font-family:var(--mono,monospace)}.epic-pill[data-v-2582b594]{border:1px solid;padding:1px 8px;font-size:10px}.epic-project[data-v-2582b594]{font-family:var(--mono,monospace);color:var(--accent-blue,#1d55a6);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px solid;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-project[data-v-2582b594]:hover{background:var(--paper-tint,#f2efe7)}.epic-project.active[data-v-2582b594]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-color:var(--ink,#111)}.epic-owner+.epic-project[data-v-2582b594]{margin-left:4px}.epic-project .project-glyph[data-v-2582b594]{font-size:10px}.epic-owner[data-v-2582b594]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px dashed;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-owner[data-v-2582b594]:hover{background:var(--paper-tint,#f2efe7)}.epic-owner.active[data-v-2582b594]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-style:solid;border-color:var(--ink,#111)}.epic-owner.active .owner-glyph[data-v-2582b594]{color:inherit}.epic-owner .owner-glyph[data-v-2582b594]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.epic-owner[data-author-kind=agent][data-v-2582b594]{color:#6b3fa0}.epic-owner[data-author-kind=bot][data-v-2582b594]{color:var(--accent-blue,#1d55a6)}.epic-owner[data-author-kind=credential][data-v-2582b594]{color:var(--accent-yellow,#c89300)}.epic-owner[data-author-kind=team][data-v-2582b594]{color:var(--accent-teal,#087f6f)}.epic-state-good[data-v-2582b594]{color:var(--ink-go,#008873)}.epic-state-warn[data-v-2582b594]{color:var(--ink-warn,#c2410c)}.epic-state-muted[data-v-2582b594],.epic-meta[data-v-2582b594],.muted[data-v-2582b594]{color:var(--ink-faint,#888)}.epic-title-link[data-v-2582b594]{min-width:0;color:inherit;font-family:var(--display,system-ui);overflow-wrap:anywhere;font-weight:600}.epic-meta[data-v-2582b594]{flex-wrap:wrap;gap:8px;font-size:11px;display:flex}.epic-line[data-v-2582b594]{margin:4px 0;font-size:12px}.warn[data-v-2582b594]{color:var(--ink-warn,#c2410c)}", Ps = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, Fs = /* @__PURE__ */ Ps(Ms, [["styles", [Ns]], ["__scopeId", "data-v-2582b594"]]), Is = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
function Ls(e) {
	return e.replace(/[&<>"']/g, (e) => Is[e] ?? e);
}
function Rs(e) {
	let t = e.replace(/`([^`]+)`/g, (e, t) => `<code>${t}</code>`);
	return t = t.replace(/\*\*([^*]+)\*\*/g, (e, t) => `<strong>${t}</strong>`), t = t.replace(/(^|[^*])\*([^*\s][^*]*?[^*\s]|[^*\s])\*(?!\*)/g, (e, t, n) => `${t}<em>${n}</em>`), t;
}
function zs(e) {
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
				text: "",
				items: e
			});
			continue;
		}
		let o = [e];
		for (r += 1; r < t.length && (t[r] ?? "").trim() !== "" && !/^```/.test(t[r] ?? "") && !/^#{1,6}\s+/.test(t[r] ?? "") && !/^\s*[-*]\s+/.test(t[r] ?? "");) o.push(t[r] ?? ""), r += 1;
		n.push({
			kind: "paragraph",
			text: o.join("\n")
		});
	}
	return n;
}
function Bs(e) {
	if (!e) return "";
	let t = zs(e), n = [];
	for (let e of t) switch (e.kind) {
		case "heading": {
			let t = e.level ?? 1, r = Rs(Ls(e.text));
			n.push(`<h${t}>${r}</h${t}>`);
			break;
		}
		case "paragraph": {
			let t = Rs(Ls(e.text));
			n.push(`<p>${t.replace(/\n/g, "<br />")}</p>`);
			break;
		}
		case "code": {
			let t = e.lang ? ` data-lang="${Ls(e.lang)}"` : "";
			n.push(`<pre${t}><code>${Ls(e.text)}</code></pre>`);
			break;
		}
		case "list": {
			let t = (e.items ?? []).map((e) => `  <li>${Rs(Ls(e))}</li>`).join("\n");
			n.push(`<ul>\n${t}\n</ul>`);
			break;
		}
	}
	return n.join("\n");
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/issue-rows.ts
function Vs(e, t = "") {
	return typeof e == "string" ? e : t;
}
function Hs(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Us(e) {
	let t = typeof e == "string" ? e.toUpperCase() : "";
	return t === "CLOSED" ? "CLOSED" : t === "REOPENED" ? "REOPENED" : "OPEN";
}
function Ws(e) {
	return typeof e == "string" ? e.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/[^/]+)?$/)?.[1] ?? null : null;
}
async function Gs(t) {
	let n = await e("ext_issues", "issues", "by-ref-issue", t);
	if (!n.ok || !n.value || typeof n.value != "object") return null;
	let r = n.value, i = Hs(r.number), o = Ws(r.repository), s = i !== null && o ? a("issues", `/${o}/${i}`) : null;
	return {
		ref: t,
		id: Vs(r.id),
		number: i,
		title: Vs(r.title, "(untitled)"),
		state: Us(r.state),
		projectName: typeof r.projectName == "string" ? r.projectName : null,
		labels: Array.isArray(r.labels) ? r.labels.filter((e) => typeof e == "string") : [],
		authorRef: typeof r.authorRef == "string" ? r.authorRef : null,
		href: s
	};
}
async function Ks(e) {
	return (await Promise.all(e.map((e) => Gs(e)))).filter((e) => e !== null);
}
function qs(e) {
	return e ? e.startsWith("comtrya://agent/") ? {
		kind: "agent",
		glyph: "✦",
		label: e.slice(16) || "agent"
	} : e.startsWith("comtrya://bot/") ? {
		kind: "bot",
		glyph: "◉",
		label: e.slice(14) || "bot"
	} : e.startsWith("comtrya://credential/") ? {
		kind: "credential",
		glyph: "⚙",
		label: e.slice(21) || "credential"
	} : e.startsWith("comtrya://user/") ? {
		kind: "user",
		glyph: "●",
		label: e.slice(15) || "user"
	} : {
		kind: "unknown",
		glyph: "○",
		label: e
	} : {
		kind: "unknown",
		glyph: "○",
		label: "unknown"
	};
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/epic-detail-styles.ts
var Js = "ext-epics-detail-styles", Ys = "\n.epic-detail {\n  max-width: 880px;\n  display: grid;\n  gap: 24px;\n  padding: 24px 0 48px;\n  font-family: var(--serif, \"iA Writer Quattro\", Georgia, serif);\n}\n\n.epic-detail .epic-line,\n.epic-detail .epic-meta,\n.epic-detail .epic-progress,\n.epic-detail .epic-issues-list,\n.epic-detail .epic-actions,\n.epic-detail .epic-actions-heading,\n.epic-detail .epic-kbd-hint,\n.epic-detail .epic-section-count {\n  font-family: var(--mono, ui-monospace, \"IBM Plex Mono\", monospace);\n}\n\n.epic-header { display: grid; gap: 6px; }\n\n.epic-overline {\n  margin: 0;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10px;\n  letter-spacing: 0.18em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-title {\n  margin: 0;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  font-size: 28px;\n  letter-spacing: -0.01em;\n  line-height: 1.15;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  align-items: center;\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-pill {\n  padding: 1px 8px;\n  border: 1px solid currentColor;\n  text-transform: lowercase;\n}\n\n.epic-state-good { color: var(--ink-go, #087f6f); }\n.epic-state-warn { color: var(--ink-warn, #c2410c); }\n.epic-state-muted, .muted { color: var(--ink-faint, #888); }\n.epic-line.warn { color: var(--ink-warn, #c2410c); }\n\n.epic-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 1px 7px;\n  border-radius: 2px;\n  font-size: 11px;\n  line-height: 16px;\n  white-space: nowrap;\n}\n\n.epic-chip .chip-glyph {\n  font-size: 10px;\n}\n\n.epic-chip.tone-blue {\n  background: var(--chip-blue-bg, #e5edf7);\n  color: var(--chip-blue-ink, #1f3b6a);\n}\n.epic-chip.tone-teal {\n  background: var(--chip-teal-bg, #d8f0eb);\n  color: var(--chip-teal-ink, #0c5f54);\n}\n.epic-chip.tone-grey {\n  background: var(--chip-grey-bg, #ececea);\n  color: var(--chip-grey-ink, #4a4a45);\n}\n.epic-chip.compact {\n  padding: 0 6px;\n  font-size: 10.5px;\n}\n\n.epic-meta-time {\n  margin-left: auto;\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-progress-head {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  align-items: baseline;\n  font-size: 12px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-progress-stat {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 4px;\n}\n\n.epic-progress-stat strong {\n  font-weight: 600;\n  color: var(--ink, #1a1a1a);\n  font-size: 15px;\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-progress-stat .stat-of {\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress-stat .stat-label {\n  color: var(--ink-faint, #6e6a62);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-progress-sep {\n  color: var(--ink-rule, #c8c6bf);\n  padding: 0 2px;\n}\n\n.epic-progress-bar {\n  height: 4px;\n  background: var(--ink-rule-soft, #ebe9e2);\n  border-radius: 2px;\n  overflow: hidden;\n}\n\n.epic-progress-fill {\n  height: 100%;\n  background: var(--ink-go, #087f6f);\n  transition: width 200ms ease;\n}\n\n.epic-body {\n  margin: 0;\n  font-size: 15.5px;\n  line-height: 1.6;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-body.muted {\n  padding: 12px 14px;\n  border: 1px dashed var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  color: var(--ink-faint, #888);\n  font-size: 12px;\n  font-family: var(--mono, ui-monospace, monospace);\n}\n\n.epic-body.prose h1,\n.epic-body.prose h2,\n.epic-body.prose h3,\n.epic-body.prose h4 {\n  margin: 16px 0 6px;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  line-height: 1.2;\n  letter-spacing: -0.005em;\n}\n\n.epic-body.prose h1 { font-size: 20px; }\n.epic-body.prose h2 { font-size: 17px; }\n.epic-body.prose h3 { font-size: 15px; }\n\n.epic-body.prose p {\n  margin: 8px 0;\n}\n\n.epic-body.prose ul {\n  margin: 6px 0 6px 20px;\n  padding: 0;\n}\n\n.epic-body.prose li {\n  margin: 2px 0;\n}\n\n.epic-body.prose code {\n  font-family: var(--mono, ui-monospace, monospace);\n  background: var(--ink-rule-soft, #efeee8);\n  padding: 0 4px;\n  border-radius: 2px;\n  font-size: 0.9em;\n}\n\n.epic-body.prose pre {\n  background: var(--surface-2, #f7f6f1);\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  padding: 10px 12px;\n  overflow-x: auto;\n  font-size: 12.5px;\n  font-family: var(--mono, ui-monospace, monospace);\n}\n\n.epic-body.prose pre code {\n  background: transparent;\n  padding: 0;\n}\n\n.epic-section { display: grid; gap: 8px; }\n\n.epic-section-head {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding-bottom: 6px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-section h3 {\n  margin: 0;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  font-size: 13px;\n  letter-spacing: -0.005em;\n}\n\n.epic-section-count {\n  margin-left: auto;\n  font-size: 11px;\n  color: var(--ink-faint, #888);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-section-count [data-zero=\"true\"] { color: var(--ink-rule, #c8c6bf); }\n.epic-section-count .sep { padding: 0 2px; color: var(--ink-rule, #c8c6bf); }\n\n.epic-issues-list {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n}\n\n.epic-issue-row {\n  display: grid;\n  grid-template-columns: 18px 56px 1fr auto;\n  align-items: center;\n  gap: 10px;\n  padding: 6px 8px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n  font-size: 12.5px;\n  cursor: pointer;\n  outline: none;\n}\n\n.epic-issue-row:last-child { border-bottom: none; }\n\n.epic-issue-row:hover,\n.epic-issue-row.focused,\n.epic-issue-row:focus {\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-issue-row .row-state {\n  text-align: center;\n  font-size: 11px;\n}\n\n.epic-issue-row .row-state[data-state=\"OPEN\"],\n.epic-issue-row .row-state[data-state=\"REOPENED\"] {\n  color: var(--ink-go, #087f6f);\n}\n.epic-issue-row .row-state[data-state=\"CLOSED\"] {\n  color: var(--ink-faint, #888);\n}\n\n.epic-issue-row.state-closed {\n  color: var(--ink-faint, #888);\n}\n.epic-issue-row.state-closed .row-title {\n  text-decoration: line-through;\n  text-decoration-color: var(--ink-rule, #c8c6bf);\n}\n\n.epic-issue-row .row-number {\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-issue-row .row-title {\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-size: 13px;\n  color: var(--ink, #1a1a1a);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.epic-issue-row .row-trailing {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: nowrap;\n}\n\n.row-author {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.row-author[data-author-kind=\"agent\"] { color: var(--ink-go, #087f6f); }\n.row-author[data-author-kind=\"credential\"],\n.row-author[data-author-kind=\"bot\"] { color: var(--ink-warn, #c2410c); }\n\n.epic-kbd-hint {\n  margin: 0;\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.epic-kbd-hint kbd {\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10px;\n  padding: 0 4px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-actions-section {\n  display: grid;\n  gap: 8px;\n  padding-top: 12px;\n  border-top: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-actions-heading {\n  margin: 0;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10.5px;\n  letter-spacing: 0.16em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n  font-weight: 500;\n}\n\n.epic-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-actions button {\n  padding: 4px 12px;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 11px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n  color: var(--ink, #1a1a1a);\n  cursor: pointer;\n  letter-spacing: 0.01em;\n}\n\n.epic-actions button:hover:not(:disabled) {\n  background: var(--ink, #1a1a1a);\n  color: var(--surface, #ffffff);\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-actions button:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n";
function Xs() {
	if (typeof document > "u" || document.getElementById(Js)) return;
	let e = document.createElement("style");
	e.id = Js, e.textContent = Ys, document.head.appendChild(e);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/CustomElementHost.vue
var Zs = /* @__PURE__ */ Ps(/* @__PURE__ */ mr({
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
		let t = e, n = /* @__PURE__ */ B(null), r = null;
		kr(i), or(() => [
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
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]), Qs = ["data-state", "data-epic-id"], $s = {
	key: 0,
	class: "epic-line muted"
}, ec = {
	key: 1,
	class: "epic-line warn"
}, tc = {
	key: 2,
	class: "epic-line warn"
}, nc = { class: "epic-header" }, rc = { class: "epic-title" }, ic = { class: "epic-meta" }, ac = ["title"], oc = {
	key: 1,
	class: "epic-chip tone-grey",
	title: "Owner"
}, sc = {
	key: 2,
	class: "epic-chip tone-grey"
}, cc = {
	key: 3,
	class: "epic-meta-time"
}, lc = {
	key: 0,
	class: "epic-progress",
	"data-smoke": "epic-progress"
}, uc = { class: "epic-progress-head" }, dc = { class: "epic-progress-stat" }, fc = { class: "stat-of" }, pc = { class: "epic-progress-stat" }, mc = {
	key: 0,
	class: "epic-progress-sep"
}, hc = {
	key: 1,
	class: "epic-progress-stat"
}, gc = ["aria-valuenow"], _c = ["data-epic-id", "innerHTML"], vc = {
	key: 2,
	class: "epic-body muted"
}, yc = {
	class: "epic-section",
	"data-smoke": "epic-issues"
}, bc = { class: "epic-section-head" }, xc = { class: "epic-section-count" }, Sc = ["data-zero"], Cc = ["data-zero"], wc = {
	key: 0,
	class: "epic-line muted"
}, Tc = {
	key: 1,
	class: "epic-issues-list",
	"data-smoke": "epic-issues-list"
}, Ec = [
	"onClick",
	"onKeydown",
	"onFocus"
], Dc = ["data-state"], Oc = { key: 0 }, kc = { key: 1 }, Ac = { class: "row-number" }, jc = { class: "row-title" }, Mc = { class: "row-trailing" }, Nc = ["title"], Pc = ["data-author-kind", "title"], Fc = { class: "author-glyph" }, Ic = {
	key: 2,
	class: "epic-kbd-hint muted"
}, Lc = { class: "epic-actions-section" }, Rc = { class: "epic-actions" }, zc = ["disabled", "onClick"], Bc = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, Vc = { class: "epic-comments" }, Hc = /* @__PURE__ */ mr({
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
		], r = /* @__PURE__ */ B("idle"), i = /* @__PURE__ */ B("idle"), a = /* @__PURE__ */ B(null), o = /* @__PURE__ */ B(null), s = /* @__PURE__ */ B(t.epic ?? null), c = /* @__PURE__ */ B(null), l = /* @__PURE__ */ B([]), u = /* @__PURE__ */ B(null), d = $(() => t.client ?? t.comtryaClient), f = $(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3"), p = $(() => t.id ?? t.routeParams?.params?.id ?? ""), m = $(() => t.epic ? cs(t.epic) : `comtrya://epic/${p.value}`), h = $(() => s.value ?? t.epic ?? null), g = $(() => ds(h.value?.state)), _ = $(() => n.filter((e) => e !== h.value?.state)), v = $(() => (c.value?.issuesOpen ?? 0) + (c.value?.issuesClosed ?? 0)), y = $(() => Math.max(0, Math.min(100, c.value?.percentComplete ?? 0))), b = $(() => l.value.filter((e) => e.state !== "CLOSED").length), ee = $(() => l.value.filter((e) => e.state === "CLOSED").length), x = $(() => Bs(h.value?.bodyMarkdown ?? "")), te = $(() => d.value && !!p.value), ne = $(() => {
			let e = h.value?.ownerRef;
			return e ? e.startsWith("comtrya://user/") ? e.slice(15) : e.startsWith("comtrya://agent/") ? `${e.slice(16)} (agent)` : e : null;
		}), re = $(() => le(h.value?.createdAt));
		kr(() => {
			Xs(), ae();
		});
		let ie = (e) => {
			if (l.value.length === 0) return;
			let t = u.value === null ? 0 : Math.max(0, Math.min(l.value.length - 1, u.value + e));
			u.value = t, Hn(() => C(t));
		};
		Wo({
			j: (e) => {
				e.preventDefault(), ie(1);
			},
			ArrowDown: (e) => {
				e.preventDefault(), ie(1);
			},
			k: (e) => {
				e.preventDefault(), ie(-1);
			},
			ArrowUp: (e) => {
				e.preventDefault(), ie(-1);
			},
			Enter: (e) => {
				if (u.value === null) return;
				let t = l.value[u.value];
				t && (e.preventDefault(), S(t));
			}
		}), or(() => [
			d.value,
			t.epic,
			f.value,
			p.value
		], () => void ae());
		async function ae() {
			if (t.epic) {
				s.value = t.epic, r.value = "ready", a.value = null, await oe();
				return;
			}
			if (!te.value || !d.value) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = "epic-detail: missing params";
				return;
			}
			r.value = "loading", a.value = null;
			try {
				s.value = await es(d.value, m.value), r.value = s.value ? "ready" : "empty", await oe();
			} catch (e) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function oe() {
			if (!d.value || !h.value) {
				c.value = null, l.value = [];
				return;
			}
			let e = cs(h.value), [t, n] = await Promise.allSettled([ns(d.value, e), rs(d.value, e)]);
			c.value = t.status === "fulfilled" ? t.value : null, l.value = await Ks(n.status === "fulfilled" ? n.value : []), l.value.sort((e, t) => {
				let n = e.state !== "CLOSED";
				return n === (t.state !== "CLOSED") ? (t.number ?? 0) - (e.number ?? 0) : n ? -1 : 1;
			});
		}
		async function se(e) {
			if (!(!d.value || !h.value)) {
				i.value = "submitting", o.value = null;
				try {
					s.value = await is(d.value, h.value.id, e), await oe();
				} catch (e) {
					o.value = e instanceof Error ? e.message : String(e);
				} finally {
					i.value = "idle";
				}
			}
		}
		function ce(e) {
			return e.toLowerCase().replace("_", " ");
		}
		function S(e) {
			e.href && window.location.assign(e.href);
		}
		function C(e) {
			let t = document.querySelector(".epic-detail [data-smoke=\"epic-issues-list\"]");
			t && t.querySelectorAll(".epic-issue-row")[e]?.focus();
		}
		function le(e) {
			if (!e) return null;
			let t = new Date(e).getTime();
			if (!Number.isFinite(t)) return null;
			let n = Date.now() - t, r = 6e4, i = 60 * r, a = 24 * i;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < 30 * a ? `${Math.floor(n / a)}d ago` : new Date(e).toISOString().slice(0, 10);
		}
		return (e, t) => (K(), q("main", {
			class: "epic-detail",
			"data-state": r.value,
			"data-epic-id": h.value?.id,
			"data-smoke": "epic-detail"
		}, [r.value === "loading" ? (K(), q("p", $s, "Loading epic")) : r.value === "error" ? (K(), q("p", ec, N(a.value), 1)) : h.value ? (K(), q(W, { key: 3 }, [
			J("header", nc, [
				t[2] ||= J("p", { class: "epic-overline" }, "epic", -1),
				J("h1", rc, N(h.value.title), 1),
				J("div", ic, [
					J("span", { class: Ue(["epic-pill", g.value.className]) }, N(g.value.label), 3),
					h.value.projectName ? (K(), q("span", {
						key: 0,
						class: "epic-chip tone-blue",
						title: `Scoped to project ${h.value.projectName}`
					}, [t[0] ||= J("span", { class: "chip-glyph" }, "◇", -1), X(N(h.value.projectName), 1)], 8, ac)) : Z("", !0),
					(K(!0), q(W, null, zr(h.value.labels, (e) => (K(), q("span", {
						key: e,
						class: "epic-chip tone-teal"
					}, N(e), 1))), 128)),
					ne.value ? (K(), q("span", oc, [t[1] ||= J("span", { class: "chip-glyph" }, "@", -1), X(N(ne.value), 1)])) : Z("", !0),
					h.value.targetDate ? (K(), q("span", sc, " target " + N(h.value.targetDate), 1)) : Z("", !0),
					re.value ? (K(), q("span", cc, "opened " + N(re.value), 1)) : Z("", !0)
				])
			]),
			c.value || l.value.length > 0 ? (K(), q("section", lc, [J("div", uc, [
				J("span", dc, [
					J("strong", null, N(c.value?.issuesClosed ?? ee.value), 1),
					J("span", fc, "/ " + N(v.value || l.value.length), 1),
					t[3] ||= J("span", { class: "stat-label" }, "closed", -1)
				]),
				t[6] ||= J("span", { class: "epic-progress-sep" }, "·", -1),
				J("span", pc, [J("strong", null, N(y.value), 1), t[4] ||= J("span", { class: "stat-label" }, "% complete", -1)]),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (K(), q("span", mc, "·")) : Z("", !0),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (K(), q("span", hc, [J("strong", null, N(c.value?.childEpicsOpen ?? 0), 1), t[5] ||= J("span", { class: "stat-label" }, "child epics open", -1)])) : Z("", !0)
			]), J("div", {
				class: "epic-progress-bar",
				"aria-valuenow": y.value,
				"aria-valuemin": "0",
				"aria-valuemax": "100"
			}, [J("div", {
				class: "epic-progress-fill",
				style: Re({ width: y.value + "%" })
			}, null, 4)], 8, gc)])) : Z("", !0),
			x.value ? (K(), q("article", {
				key: 1,
				class: "epic-body prose",
				"data-epic-id": h.value.id,
				"data-smoke": "epic-detail-main",
				innerHTML: x.value
			}, null, 8, _c)) : (K(), q("p", vc, "No description yet.")),
			J("section", yc, [
				J("header", bc, [t[10] ||= J("h3", null, "Issues in this epic", -1), J("span", xc, [
					J("span", { "data-zero": b.value === 0 }, N(b.value), 9, Sc),
					t[7] ||= X(" open ", -1),
					t[8] ||= J("span", { class: "sep" }, "·", -1),
					J("span", { "data-zero": ee.value === 0 }, N(ee.value), 9, Cc),
					t[9] ||= X(" closed ", -1)
				])]),
				l.value.length === 0 ? (K(), q("p", wc, " No issues linked yet. Link issues via the issue's \"part of epic\" relation. ")) : (K(), q("ul", Tc, [(K(!0), q(W, null, zr(l.value, (e, n) => (K(), q("li", {
					key: e.ref,
					class: Ue(["epic-issue-row", [`state-${e.state.toLowerCase()}`, { focused: u.value === n }]]),
					tabindex: "0",
					onClick: (t) => S(e),
					onKeydown: [No(jo((t) => S(e), ["prevent"]), ["enter"]), No(jo((t) => S(e), ["prevent"]), ["space"])],
					onFocus: (e) => u.value = n
				}, [
					J("span", {
						class: "row-state",
						"data-state": e.state
					}, [e.state === "CLOSED" ? (K(), q("span", Oc, "●")) : (K(), q("span", kc, "○"))], 8, Dc),
					J("span", Ac, "#" + N(e.number ?? "—"), 1),
					J("span", jc, N(e.title), 1),
					J("span", Mc, [
						e.projectName ? (K(), q("span", {
							key: 0,
							class: "epic-chip tone-blue compact",
							title: e.projectName
						}, [t[11] ||= J("span", { class: "chip-glyph" }, "◇", -1), X(N(e.projectName), 1)], 8, Nc)) : Z("", !0),
						(K(!0), q(W, null, zr(e.labels, (e) => (K(), q("span", {
							key: e,
							class: "epic-chip tone-teal compact"
						}, N(e), 1))), 128)),
						e.authorRef ? (K(), q("span", {
							key: 1,
							class: "row-author",
							"data-author-kind": xn(qs)(e.authorRef).kind,
							title: e.authorRef
						}, [J("span", Fc, N(xn(qs)(e.authorRef).glyph), 1), X(" " + N(xn(qs)(e.authorRef).label), 1)], 8, Pc)) : Z("", !0)
					])
				], 42, Ec))), 128))])),
				l.value.length > 0 ? (K(), q("p", Ic, [...t[12] ||= [
					J("kbd", null, "j", -1),
					X(" / ", -1),
					J("kbd", null, "k", -1),
					X(" move · ", -1),
					J("kbd", null, "↵", -1),
					X(" open ", -1)
				]])) : Z("", !0)
			]),
			J("section", Lc, [
				t[13] ||= J("h3", { class: "epic-actions-heading" }, "Change state", -1),
				J("div", Rc, [(K(!0), q(W, null, zr(_.value, (e) => (K(), q("button", {
					key: e,
					type: "button",
					disabled: i.value === "submitting",
					onClick: (t) => se(e)
				}, " mark " + N(ce(e)), 9, zc))), 128))]),
				o.value ? (K(), q("p", Bc, N(o.value), 1)) : Z("", !0)
			]),
			J("section", Vc, [Y(Zs, {
				tag: "comtrya-comment-thread",
				attributes: { target: xn(cs)(h.value) },
				properties: {
					target: xn(cs)(h.value),
					comtryaClient: d.value
				}
			}, null, 8, ["attributes", "properties"])])
		], 64)) : (K(), q("p", tc, " No epic " + N(p.value || "?") + " in " + N(f.value), 1))], 8, Qs));
	}
}), Uc = ["data-state"], Wc = { class: "epics-list-header" }, Gc = ["href"], Kc = {
	key: 0,
	class: "epics-filter-row",
	role: "tablist",
	"aria-label": "Filter epics by state"
}, qc = ["aria-selected", "onClick"], Jc = { class: "count" }, Yc = {
	key: 1,
	class: "epics-owner-filter",
	"data-smoke": "epics-owner-filter"
}, Xc = ["title"], Zc = {
	key: 2,
	class: "epics-project-filter",
	"data-smoke": "epics-project-filter"
}, Qc = ["title"], $c = {
	key: 3,
	class: "epic-line muted"
}, el = {
	key: 4,
	class: "epic-line warn"
}, tl = {
	key: 5,
	class: "epic-line muted"
}, nl = {
	key: 6,
	class: "epic-line muted"
}, rl = {
	key: 7,
	class: "epics-list-items"
}, il = /* @__PURE__ */ Ps(/* @__PURE__ */ mr({
	__name: "EpicsList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epics: { type: [Array, null] },
		workspaceId: {
			default: os,
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
		]), i = /* @__PURE__ */ B("idle"), a = /* @__PURE__ */ B(null), o = /* @__PURE__ */ B(t.epics ?? []), s = /* @__PURE__ */ B("ALL"), c = /* @__PURE__ */ B(""), l = /* @__PURE__ */ B(""), u = $(() => {
			let e = t.epics ?? o.value;
			return t.projectName ? e.filter((e) => e.projectName === t.projectName) : e;
		}), d = $(() => {
			let e = u.value;
			s.value !== "ALL" && (e = e.filter((e) => e.state === s.value));
			let n = t.projectName ? "" : l.value;
			return n && (e = e.filter((e) => e.projectName === n)), c.value && (e = e.filter((e) => e.ownerRef === c.value)), e;
		});
		function f(e) {
			c.value === e ? c.value = "" : c.value = e;
		}
		function p() {
			c.value = "";
		}
		function m(e) {
			l.value === e ? l.value = "" : l.value = e;
		}
		function h() {
			l.value = "";
		}
		function g(e) {
			return e.replace(/^comtrya:\/\/[a-z]+\//, "");
		}
		let _ = $(() => {
			let e = {
				PLANNED: 0,
				IN_PROGRESS: 0,
				DONE: 0,
				CANCELED: 0,
				ALL: u.value.length
			};
			for (let t of u.value) t.state === "PLANNED" ? e.PLANNED += 1 : t.state === "IN_PROGRESS" ? e.IN_PROGRESS += 1 : t.state === "DONE" ? e.DONE += 1 : t.state === "CANCELED" && (e.CANCELED += 1);
			return e;
		}), v = $(() => t.client ?? t.comtryaClient), y = $(() => {
			let e = us(t.workspaceId);
			return t.projectName ? `${e}&projectName=${encodeURIComponent(t.projectName)}` : e;
		});
		function b() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search), t = (e.get("state") ?? "").toUpperCase();
			r.has(t) && (s.value = t);
			let n = e.get("owner") ?? "";
			c.value = n.startsWith("comtrya://") ? n : "";
			let i = e.get("project") ?? "";
			l.value = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(i) ? i : "";
		}
		function ee() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			s.value === "ALL" ? e.delete("state") : e.set("state", s.value), c.value ? e.set("owner", c.value) : e.delete("owner"), l.value && !t.projectName ? e.set("project", l.value) : e.delete("project");
			let n = e.toString(), r = `${window.location.pathname}${n ? `?${n}` : ""}${window.location.hash}`;
			r !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", r);
		}
		let x = !1;
		function te() {
			x = !0, b(), Hn(() => {
				x = !1;
			});
		}
		kr(() => {
			x = !0, b(), x = !1, ne(), window.addEventListener("popstate", te);
		}), Nr(() => {
			window.removeEventListener("popstate", te);
		}), or(() => [
			v.value,
			t.epics,
			t.workspaceId,
			t.state
		], () => void ne()), or([
			s,
			c,
			l
		], () => {
			x || ee();
		});
		async function ne() {
			if (t.epics) {
				o.value = t.epics, i.value = t.epics.length > 0 ? "ready" : "empty", a.value = null;
				return;
			}
			if (!v.value) {
				o.value = [], i.value = "error", a.value = "epics: no client";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				o.value = await ts(v.value, {
					workspaceId: t.workspaceId,
					state: t.state
				}), i.value = o.value.length > 0 ? "ready" : "empty";
			} catch (e) {
				o.value = [], i.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (r, o) => (K(), q("section", {
			class: "epics-list",
			"data-state": i.value,
			"data-smoke": "epics-list"
		}, [
			J("header", Wc, [J("h3", null, N(e.title), 1), e.showNewLink ? (K(), q("a", {
				key: 0,
				href: y.value
			}, "+ new", 8, Gc)) : Z("", !0)]),
			u.value.length > 0 ? (K(), q("div", Kc, [(K(), q(W, null, zr(n, (e) => J("button", {
				key: e.id,
				type: "button",
				role: "tab",
				"aria-selected": s.value === e.id,
				class: Ue(["epics-filter", { active: s.value === e.id }]),
				onClick: (t) => s.value = e.id
			}, [J("span", null, N(e.label), 1), J("span", Jc, N(_.value[e.id]), 1)], 10, qc)), 64))])) : Z("", !0),
			c.value ? (K(), q("div", Yc, [
				o[0] ||= J("span", { class: "prefix" }, "owner", -1),
				J("span", {
					class: "active-chip",
					title: c.value
				}, N(g(c.value)), 9, Xc),
				J("button", {
					type: "button",
					class: "clear",
					onClick: p,
					"aria-label": "Clear owner filter"
				}, "clear ✕")
			])) : Z("", !0),
			l.value && !t.projectName ? (K(), q("div", Zc, [
				o[2] ||= J("span", { class: "prefix" }, "project", -1),
				J("span", {
					class: "active-chip",
					title: `Scoped to project ${l.value}`
				}, [o[1] ||= J("span", { class: "project-glyph" }, "◇", -1), X(" " + N(l.value), 1)], 8, Qc),
				J("button", {
					type: "button",
					class: "clear",
					onClick: h,
					"aria-label": "Clear project filter"
				}, "clear ✕")
			])) : Z("", !0),
			i.value === "loading" ? (K(), q("p", $c, "Loading epics")) : i.value === "error" ? (K(), q("p", el, N(a.value), 1)) : u.value.length === 0 ? (K(), q("p", tl, "No epics yet.")) : d.value.length === 0 ? (K(), q("p", nl, " No " + N(s.value.toLowerCase().replace("_", " ")) + " epics in scope. ", 1)) : (K(), q("ul", rl, [(K(!0), q(W, null, zr(d.value, (e) => (K(), q("li", { key: e.id }, [Y(Fs, {
				epic: e,
				"resource-ref": xn(cs)(e),
				client: v.value,
				"active-owner": c.value,
				"active-project": l.value,
				onOwnerClick: f,
				onProjectClick: m
			}, null, 8, [
				"epic",
				"resource-ref",
				"client",
				"active-owner",
				"active-project"
			])]))), 128))]))
		], 8, Uc));
	}
}), [["styles", [".epics-list[data-v-906d3168]{gap:8px;display:grid}.epics-list-header[data-v-906d3168]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.epics-list-header h3[data-v-906d3168]{font-family:var(--display,system-ui);margin:0;font-size:14px}.epics-list-header a[data-v-906d3168],.epic-line[data-v-906d3168]{font-family:var(--mono,monospace);font-size:12px}.epics-list-header a[data-v-906d3168]{color:var(--ink-faint,#888);text-decoration:none}.epics-filter-row[data-v-906d3168]{border:1px solid var(--ink,#111);flex-wrap:wrap;align-self:flex-start;gap:0;margin-bottom:4px;display:inline-flex}.epics-filter[data-v-906d3168]{color:inherit;cursor:pointer;font-family:var(--mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:4px 9px;font-size:11px;display:inline-flex}.epics-filter[data-v-906d3168]:not(:last-child){border-right:1px solid var(--rule-light,#d8d1c4)}.epics-filter.active[data-v-906d3168]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.epics-filter .count[data-v-906d3168]{color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums}.epics-filter.active .count[data-v-906d3168]{color:var(--paper-tint,#f2efe7)}.epics-owner-filter[data-v-906d3168]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-owner-filter .prefix[data-v-906d3168]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.epics-owner-filter .active-chip[data-v-906d3168]{border:1px solid var(--ink,#111);color:var(--ink,#111);padding:0 5px}.epics-owner-filter .clear[data-v-906d3168]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-owner-filter .clear[data-v-906d3168]:hover{color:var(--ink,#111)}.epics-project-filter[data-v-906d3168]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-project-filter .prefix[data-v-906d3168]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.epics-project-filter .active-chip[data-v-906d3168]{color:var(--accent-blue,#1d55a6);border:1px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.epics-project-filter .project-glyph[data-v-906d3168]{font-size:10px}.epics-project-filter .clear[data-v-906d3168]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-project-filter .clear[data-v-906d3168]:hover{color:var(--ink,#111)}.epics-list-items[data-v-906d3168]{gap:8px;margin:0;padding:0;list-style:none;display:grid}.epic-line[data-v-906d3168]{margin:4px 0}.muted[data-v-906d3168]{color:var(--ink-faint,#888)}.warn[data-v-906d3168]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-906d3168"]]), al = "epics", ol = "ext_epics", sl = "comtrya-epic-card", cl = "comtrya-epics-board", ll = "comtrya-epics-index", ul = "comtrya-epic-detail", dl = "comtrya-epic-new";
Go({
	tagName: sl,
	component: Fs,
	propertyAliases: { ref: "resourceRef" }
}), Go({
	tagName: cl,
	component: il
}), Go({
	tagName: ll,
	component: il
}), Go({
	tagName: ul,
	component: Hc
}), pl();
var fl = {
	id: ol,
	setup(e) {
		e.registerCard({
			resourceKind: "epic",
			element: sl,
			requiredPermission: "epics.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "epic",
			loadTargets: async (t) => (await ts(e.client, { workspaceId: t.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3" })).map((e) => ({
				ref: cs(e),
				kind: "epic",
				title: e.title,
				subtitle: e.state.toLowerCase().replace(/_/g, " ")
			}))
		}), e.registerWidget({
			id: "epics-board",
			element: cl,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "epics.read"
		}), e.registerRoute("/", {
			element: ll,
			requiredPermission: "epics.read"
		}), e.registerRoute("/new", {
			element: dl,
			requiredPermission: "epics.write"
		}), e.registerRoute("/:workspaceId/:id", {
			element: ul,
			requiredPermission: "epics.read"
		}), vs(e.client);
	}
};
function pl() {
	typeof customElements > "u" || customElements.get(dl) || customElements.define(dl, class extends HTMLElement {
		routeParams;
		connectedCallback() {
			let e = ml(this.routeParams);
			this.replaceChildren(hl(e));
		}
	});
}
function ml(e) {
	let t = new URLSearchParams(window.location.search);
	return {
		workspaceId: t.get("workspaceId") ?? e?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
		projectName: t.get("projectName") ?? e?.params?.projectName ?? null
	};
}
function hl(e) {
	let t = document.createElement("main");
	t.className = "epic-new", t.dataset.smoke = "epic-new";
	let n = document.createElement("h3");
	n.textContent = e.projectName ? `New epic in ${e.projectName}` : "New epic";
	let r = document.createElement("form"), i = document.createElement("input");
	i.required = !0, i.placeholder = "Epic title";
	let o = document.createElement("textarea");
	o.rows = 5, o.placeholder = "Description (optional)";
	let s = document.createElement("button");
	s.type = "submit", s.textContent = "Create epic";
	let c = gl("", "warn");
	return c.setAttribute("role", "alert"), c.hidden = !0, r.append(i, o, s, c), r.addEventListener("submit", (t) => {
		t.preventDefault(), s.disabled = !0, c.hidden = !0, as(void 0, {
			workspaceId: e.workspaceId,
			projectName: e.projectName,
			title: i.value.trim(),
			bodyMarkdown: o.value
		}).then((e) => {
			window.location.assign(a(al, `/${e.workspaceId}/${e.id}`));
		}).catch((e) => {
			c.textContent = e instanceof Error ? e.message : String(e), c.hidden = !1, s.disabled = !1;
		});
	}), t.append(n, r), t;
}
function gl(e, t) {
	let n = document.createElement("p");
	return n.className = `epic-line ${t}`, n.textContent = e, n;
}
//#endregion
export { fl as default };
