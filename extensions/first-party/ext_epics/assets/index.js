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
//#endregion
//#region packages/sdk-core/src/graphql-client.ts
var r = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, i;
function a() {
	return i ||= o(r), i;
}
function o(e) {
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
var s = Symbol.for("comtrya.relationship-registry");
c();
function c() {
	let e = globalThis;
	return e[s] ??= {
		types: /* @__PURE__ */ new Map(),
		providers: /* @__PURE__ */ new Map(),
		subscribers: /* @__PURE__ */ new Set()
	}, e[s];
}
//#endregion
//#region packages/sdk-core/src/route-registry.ts
function l(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`;
	return `/x/${e}${n === "/" ? "" : n.replace(/\/+$/, "")}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function u(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return d(t, e, n.signal), () => n.abort();
}
async function d(e, t, n) {
	try {
		let r = await f(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: p(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await m(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function f(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: p(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function p(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function m(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		h(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) g(e, t);
	}
	a += i.decode(), h(a, t);
}
function h(e, t) {
	for (let n of e.split("\n\n")) g(n, t);
}
function g(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = _(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function _(e, t) {
	let n = v(e) ? e : {}, r = v(n.data) ? n.data : {}, i = y(r.eventType) ?? y(n.type) ?? t ?? "";
	return {
		id: y(r.id) ?? y(n.id) ?? "",
		eventType: i,
		payloadB64: y(r.payloadB64) ?? "",
		timestampMs: ee(r.timestampMs) ?? te(ee(n.time)) ?? Date.now(),
		sourceUri: y(r.sourceUri) ?? y(n.source) ?? "",
		emitterExtension: y(r.emitterExtension) ?? y(r.extensionId) ?? y(n.source) ?? "",
		raw: e
	};
}
function v(e) {
	return typeof e == "object" && !!e;
}
function y(e) {
	return typeof e == "string" ? e : void 0;
}
function ee(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function te(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var ne = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], re = typeof navigator == "object" ? navigator.platform : "", ie = /Mac|iPod|iPhone|iPad/.test(re), ae = ie ? "Meta" : "Control", b = re === "Win32" ? ["Control", "Alt"] : ie ? ["Alt"] : [];
function oe(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || b.includes(t) && e.getModifierState("AltGraph"));
}
function se(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? ae : e;
		}), n];
	});
}
function ce(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !oe(e, t);
	}) || ne.find(function(t) {
		return !n.includes(t) && r !== t && oe(e, t);
	}));
}
function le(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [se(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			ce(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : oe(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function x(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = le(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var ue = /* @__PURE__ */ new Map(), de = /* @__PURE__ */ new Set();
function fe(e) {
	ue.set(e.id, e);
	for (let e of de) e();
	return () => {
		ue.delete(e.id);
		for (let e of de) e();
	};
}
//#endregion
//#region node_modules/.bun/@vue+shared@3.5.34/node_modules/@vue/shared/dist/shared.esm-bundler.js
/* @__NO_SIDE_EFFECTS__ */
function pe(e) {
	let t = /* @__PURE__ */ Object.create(null);
	for (let n of e.split(",")) t[n] = 1;
	return (e) => e in t;
}
var S = {}, me = [], he = () => {}, ge = () => !1, _e = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), C = (e) => e.startsWith("onUpdate:"), w = Object.assign, ve = (e, t) => {
	let n = e.indexOf(t);
	n > -1 && e.splice(n, 1);
}, ye = Object.prototype.hasOwnProperty, T = (e, t) => ye.call(e, t), E = Array.isArray, be = (e) => Ee(e) === "[object Map]", xe = (e) => Ee(e) === "[object Set]", Se = (e) => Ee(e) === "[object Date]", D = (e) => typeof e == "function", O = (e) => typeof e == "string", Ce = (e) => typeof e == "symbol", k = (e) => typeof e == "object" && !!e, we = (e) => (k(e) || D(e)) && D(e.then) && D(e.catch), Te = Object.prototype.toString, Ee = (e) => Te.call(e), De = (e) => Ee(e).slice(8, -1), Oe = (e) => Ee(e) === "[object Object]", ke = (e) => O(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Ae = /* @__PURE__ */ pe(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"), je = (e) => {
	let t = /* @__PURE__ */ Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, Me = /-\w/g, A = je((e) => e.replace(Me, (e) => e.slice(1).toUpperCase())), Ne = /\B([A-Z])/g, j = je((e) => e.replace(Ne, "-$1").toLowerCase()), Pe = je((e) => e.charAt(0).toUpperCase() + e.slice(1)), Fe = je((e) => e ? `on${Pe(e)}` : ""), Ie = (e, t) => !Object.is(e, t), Le = (e, ...t) => {
	for (let n = 0; n < e.length; n++) e[n](...t);
}, Re = (e, t, n, r = !1) => {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		writable: r,
		value: n
	});
}, ze = (e) => {
	let t = parseFloat(e);
	return isNaN(t) ? e : t;
}, Be = (e) => {
	let t = O(e) ? Number(e) : NaN;
	return isNaN(t) ? e : t;
}, Ve, He = () => Ve ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function Ue(e) {
	if (E(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = O(r) ? qe(r) : Ue(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (O(e) || k(e)) return e;
}
var We = /;(?![^(]*\))/g, Ge = /:([^]+)/, Ke = /\/\*[^]*?\*\//g;
function qe(e) {
	let t = {};
	return e.replace(Ke, "").split(We).forEach((e) => {
		if (e) {
			let n = e.split(Ge);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function Je(e) {
	let t = "";
	if (O(e)) t = e;
	else if (E(e)) for (let n = 0; n < e.length; n++) {
		let r = Je(e[n]);
		r && (t += r + " ");
	}
	else if (k(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var Ye = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Xe = /* @__PURE__ */ pe(Ye);
Ye + "";
function Ze(e) {
	return !!e || e === "";
}
function Qe(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = $e(e[r], t[r]);
	return n;
}
function $e(e, t) {
	if (e === t) return !0;
	let n = Se(e), r = Se(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = Ce(e), r = Ce(t), n || r) return e === t;
	if (n = E(e), r = E(t), n || r) return n && r ? Qe(e, t) : !1;
	if (n = k(e), r = k(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !$e(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
var et = (e) => !!(e && e.__v_isRef === !0), M = (e) => O(e) ? e : e == null ? "" : E(e) || k(e) && (e.toString === Te || !D(e.toString)) ? et(e) ? M(e.value) : JSON.stringify(e, tt, 2) : String(e), tt = (e, t) => et(t) ? tt(e, t.value) : be(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[nt(t, r) + " =>"] = n, e), {}) } : xe(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => nt(e)) } : Ce(t) ? nt(t) : k(t) && !E(t) && !Oe(t) ? String(t) : t, nt = (e, t = "") => Ce(e) ? `Symbol(${e.description ?? t})` : e, N, rt = class {
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
function it() {
	return N;
}
var P, at = /* @__PURE__ */ new WeakSet(), ot = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, N && (N.active ? N.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, at.has(this) && (at.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || ut(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, Ct(this), pt(this);
		let e = P, t = yt;
		P = this, yt = !0;
		try {
			return this.fn();
		} finally {
			mt(this), P = e, yt = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) _t(e);
			this.deps = this.depsTail = void 0, Ct(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? at.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		ht(this) && this.run();
	}
	get dirty() {
		return ht(this);
	}
}, st = 0, ct, lt;
function ut(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = lt, lt = e;
		return;
	}
	e.next = ct, ct = e;
}
function dt() {
	st++;
}
function ft() {
	if (--st > 0) return;
	if (lt) {
		let e = lt;
		for (lt = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; ct;) {
		let t = ct;
		for (ct = void 0; t;) {
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
function pt(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function mt(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), _t(r), vt(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function ht(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (gt(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function gt(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === wt) || (e.globalVersion = wt, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !ht(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = P, r = yt;
	P = e, yt = !0;
	try {
		pt(e);
		let n = e.fn(e._value);
		(t.version === 0 || Ie(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		P = n, yt = r, mt(e), e.flags &= -3;
	}
}
function _t(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) _t(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function vt(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var yt = !0, bt = [];
function xt() {
	bt.push(yt), yt = !1;
}
function St() {
	let e = bt.pop();
	yt = e === void 0 ? !0 : e;
}
function Ct(e) {
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
var wt = 0, Tt = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, Et = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!P || !yt || P === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== P) t = this.activeLink = new Tt(P, this), P.deps ? (t.prevDep = P.depsTail, P.depsTail.nextDep = t, P.depsTail = t) : P.deps = P.depsTail = t, Dt(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = P.depsTail, t.nextDep = void 0, P.depsTail.nextDep = t, P.depsTail = t, P.deps === t && (P.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, wt++, this.notify(e);
	}
	notify(e) {
		dt();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			ft();
		}
	}
};
function Dt(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) Dt(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var Ot = /* @__PURE__ */ new WeakMap(), kt = /* @__PURE__ */ Symbol(""), At = /* @__PURE__ */ Symbol(""), jt = /* @__PURE__ */ Symbol("");
function F(e, t, n) {
	if (yt && P) {
		let t = Ot.get(e);
		t || Ot.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new Et()), r.map = t, r.key = n), r.track();
	}
}
function Mt(e, t, n, r, i, a) {
	let o = Ot.get(e);
	if (!o) {
		wt++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (dt(), t === "clear") o.forEach(s);
	else {
		let i = E(e), a = i && ke(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === jt || !Ce(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(jt)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(kt)), be(e) && s(o.get(At)));
				break;
			case "delete":
				i || (s(o.get(kt)), be(e) && s(o.get(At)));
				break;
			case "set":
				be(e) && s(o.get(kt));
				break;
		}
	}
	ft();
}
function Nt(e) {
	let t = /* @__PURE__ */ L(e);
	return t === e ? t : (F(t, "iterate", jt), /* @__PURE__ */ I(e) ? t : t.map(Sn));
}
function Pt(e) {
	return F(e = /* @__PURE__ */ L(e), "iterate", jt), e;
}
function Ft(e, t) {
	return /* @__PURE__ */ yn(e) ? Cn(/* @__PURE__ */ vn(e) ? Sn(t) : t) : Sn(t);
}
var It = {
	__proto__: null,
	[Symbol.iterator]() {
		return Lt(this, Symbol.iterator, (e) => Ft(this, e));
	},
	concat(...e) {
		return Nt(this).concat(...e.map((e) => E(e) ? Nt(e) : e));
	},
	entries() {
		return Lt(this, "entries", (e) => (e[1] = Ft(this, e[1]), e));
	},
	every(e, t) {
		return zt(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return zt(this, "filter", e, t, (e) => e.map((e) => Ft(this, e)), arguments);
	},
	find(e, t) {
		return zt(this, "find", e, t, (e) => Ft(this, e), arguments);
	},
	findIndex(e, t) {
		return zt(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return zt(this, "findLast", e, t, (e) => Ft(this, e), arguments);
	},
	findLastIndex(e, t) {
		return zt(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return zt(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return Vt(this, "includes", e);
	},
	indexOf(...e) {
		return Vt(this, "indexOf", e);
	},
	join(e) {
		return Nt(this).join(e);
	},
	lastIndexOf(...e) {
		return Vt(this, "lastIndexOf", e);
	},
	map(e, t) {
		return zt(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return Ht(this, "pop");
	},
	push(...e) {
		return Ht(this, "push", e);
	},
	reduce(e, ...t) {
		return Bt(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return Bt(this, "reduceRight", e, t);
	},
	shift() {
		return Ht(this, "shift");
	},
	some(e, t) {
		return zt(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return Ht(this, "splice", e);
	},
	toReversed() {
		return Nt(this).toReversed();
	},
	toSorted(e) {
		return Nt(this).toSorted(e);
	},
	toSpliced(...e) {
		return Nt(this).toSpliced(...e);
	},
	unshift(...e) {
		return Ht(this, "unshift", e);
	},
	values() {
		return Lt(this, "values", (e) => Ft(this, e));
	}
};
function Lt(e, t, n) {
	let r = Pt(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ I(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var Rt = Array.prototype;
function zt(e, t, n, r, i, a) {
	let o = Pt(e), s = o !== e && !/* @__PURE__ */ I(e), c = o[t];
	if (c !== Rt[t]) {
		let t = c.apply(e, a);
		return s ? Sn(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, Ft(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function Bt(e, t, n, r) {
	let i = Pt(e), a = i !== e && !/* @__PURE__ */ I(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = Ft(e, t)), n.call(this, t, Ft(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? Ft(e, c) : c;
}
function Vt(e, t, n) {
	let r = /* @__PURE__ */ L(e);
	F(r, "iterate", jt);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ bn(n[0]) ? (n[0] = /* @__PURE__ */ L(n[0]), r[t](...n)) : i;
}
function Ht(e, t, n = []) {
	xt(), dt();
	let r = (/* @__PURE__ */ L(e))[t].apply(e, n);
	return ft(), St(), r;
}
var Ut = /* @__PURE__ */ pe("__proto__,__v_isRef,__isVue"), Wt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Ce));
function Gt(e) {
	Ce(e) || (e = String(e));
	let t = /* @__PURE__ */ L(this);
	return F(t, "has", e), t.hasOwnProperty(e);
}
var Kt = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? dn : un : i ? ln : cn).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = E(e);
		if (!r) {
			let e;
			if (a && (e = It[t])) return e;
			if (t === "hasOwnProperty") return Gt;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ R(e) ? e : n);
		if ((Ce(t) ? Wt.has(t) : Ut(t)) || (r || F(e, "get", t), i)) return o;
		if (/* @__PURE__ */ R(o)) {
			let e = a && ke(t) ? o : o.value;
			return r && k(e) ? /* @__PURE__ */ gn(e) : e;
		}
		return k(o) ? r ? /* @__PURE__ */ gn(o) : /* @__PURE__ */ mn(o) : o;
	}
}, qt = class extends Kt {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = E(e) && ke(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ yn(i);
			if (!/* @__PURE__ */ I(n) && !/* @__PURE__ */ yn(n) && (i = /* @__PURE__ */ L(i), n = /* @__PURE__ */ L(n)), !a && /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : T(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ R(e) ? e : r);
		return e === /* @__PURE__ */ L(r) && (o ? Ie(n, i) && Mt(e, "set", t, n, i) : Mt(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = T(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && Mt(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!Ce(t) || !Wt.has(t)) && F(e, "has", t), n;
	}
	ownKeys(e) {
		return F(e, "iterate", E(e) ? "length" : kt), Reflect.ownKeys(e);
	}
}, Jt = class extends Kt {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, Yt = /* @__PURE__ */ new qt(), Xt = /* @__PURE__ */ new Jt(), Zt = /* @__PURE__ */ new qt(!0), Qt = (e) => e, $t = (e) => Reflect.getPrototypeOf(e);
function en(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ L(i), o = be(a), s = e === "entries" || e === Symbol.iterator && o, c = e === "keys" && o, l = i[e](...r), u = n ? Qt : t ? Cn : Sn;
		return !t && F(a, "iterate", c ? At : kt), w(Object.create(l), { next() {
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
function tn(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function nn(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ L(r), a = /* @__PURE__ */ L(n);
			e || (Ie(n, a) && F(i, "get", n), F(i, "get", a));
			let { has: o } = $t(i), s = t ? Qt : e ? Cn : Sn;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && F(/* @__PURE__ */ L(t), "iterate", kt), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ L(n), i = /* @__PURE__ */ L(t);
			return e || (Ie(t, i) && F(r, "has", t), F(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ L(a), s = t ? Qt : e ? Cn : Sn;
			return !e && F(o, "iterate", kt), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return w(n, e ? {
		add: tn("add"),
		set: tn("set"),
		delete: tn("delete"),
		clear: tn("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ L(this), r = $t(n), i = /* @__PURE__ */ L(e), a = !t && !/* @__PURE__ */ I(e) && !/* @__PURE__ */ yn(e) ? i : e;
			return r.has.call(n, a) || Ie(e, a) && r.has.call(n, e) || Ie(i, a) && r.has.call(n, i) || (n.add(a), Mt(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ I(n) && !/* @__PURE__ */ yn(n) && (n = /* @__PURE__ */ L(n));
			let r = /* @__PURE__ */ L(this), { has: i, get: a } = $t(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ L(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? Ie(n, s) && Mt(r, "set", e, n, s) : Mt(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ L(this), { has: n, get: r } = $t(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ L(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && Mt(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ L(this), t = e.size !== 0, n = e.clear();
			return t && Mt(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = en(r, e, t);
	}), n;
}
function rn(e, t) {
	let n = nn(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(T(n, r) && r in t ? n : t, r, i);
}
var an = { get: /* @__PURE__ */ rn(!1, !1) }, on = { get: /* @__PURE__ */ rn(!1, !0) }, sn = { get: /* @__PURE__ */ rn(!0, !1) }, cn = /* @__PURE__ */ new WeakMap(), ln = /* @__PURE__ */ new WeakMap(), un = /* @__PURE__ */ new WeakMap(), dn = /* @__PURE__ */ new WeakMap();
function fn(e) {
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
function pn(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : fn(De(e));
}
/* @__NO_SIDE_EFFECTS__ */
function mn(e) {
	return /* @__PURE__ */ yn(e) ? e : _n(e, !1, Yt, an, cn);
}
/* @__NO_SIDE_EFFECTS__ */
function hn(e) {
	return _n(e, !1, Zt, on, ln);
}
/* @__NO_SIDE_EFFECTS__ */
function gn(e) {
	return _n(e, !0, Xt, sn, un);
}
function _n(e, t, n, r, i) {
	if (!k(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = pn(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function vn(e) {
	return /* @__PURE__ */ yn(e) ? /* @__PURE__ */ vn(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function yn(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function I(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function bn(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function L(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ L(t) : e;
}
function xn(e) {
	return !T(e, "__v_skip") && Object.isExtensible(e) && Re(e, "__v_skip", !0), e;
}
var Sn = (e) => k(e) ? /* @__PURE__ */ mn(e) : e, Cn = (e) => k(e) ? /* @__PURE__ */ gn(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function R(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function z(e) {
	return wn(e, !1);
}
function wn(e, t) {
	return /* @__PURE__ */ R(e) ? e : new Tn(e, t);
}
var Tn = class {
	constructor(e, t) {
		this.dep = new Et(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ L(e), this._value = t ? e : Sn(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ I(e) || /* @__PURE__ */ yn(e);
		e = n ? e : /* @__PURE__ */ L(e), Ie(e, t) && (this._rawValue = e, this._value = n ? e : Sn(e), this.dep.trigger());
	}
};
function En(e) {
	return /* @__PURE__ */ R(e) ? e.value : e;
}
var Dn = {
	get: (e, t, n) => t === "__v_raw" ? e : En(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function On(e) {
	return /* @__PURE__ */ vn(e) ? e : new Proxy(e, Dn);
}
var kn = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new Et(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = wt - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && P !== this) return ut(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return gt(this), e && (e.version = this.dep.version), this._value;
	}
	set value(e) {
		this.setter && this.setter(e);
	}
};
/* @__NO_SIDE_EFFECTS__ */
function An(e, t, n = !1) {
	let r, i;
	return D(e) ? r = e : (r = e.get, i = e.set), new kn(r, i, n);
}
var jn = {}, Mn = /* @__PURE__ */ new WeakMap(), Nn = void 0;
function Pn(e, t = !1, n = Nn) {
	if (n) {
		let t = Mn.get(n);
		t || Mn.set(n, t = []), t.push(e);
	}
}
function Fn(e, t, n = S) {
	let { immediate: r, deep: i, once: a, scheduler: o, augmentJob: s, call: c } = n, l = (e) => i ? e : /* @__PURE__ */ I(e) || i === !1 || i === 0 ? In(e, 1) : In(e), u, d, f, p, m = !1, h = !1;
	if (/* @__PURE__ */ R(e) ? (d = () => e.value, m = /* @__PURE__ */ I(e)) : /* @__PURE__ */ vn(e) ? (d = () => l(e), m = !0) : E(e) ? (h = !0, m = e.some((e) => /* @__PURE__ */ vn(e) || /* @__PURE__ */ I(e)), d = () => e.map((e) => {
		if (/* @__PURE__ */ R(e)) return e.value;
		if (/* @__PURE__ */ vn(e)) return l(e);
		if (D(e)) return c ? c(e, 2) : e();
	})) : d = D(e) ? t ? c ? () => c(e, 2) : e : () => {
		if (f) {
			xt();
			try {
				f();
			} finally {
				St();
			}
		}
		let t = Nn;
		Nn = u;
		try {
			return c ? c(e, 3, [p]) : e(p);
		} finally {
			Nn = t;
		}
	} : he, t && i) {
		let e = d, t = i === !0 ? Infinity : i;
		d = () => In(e(), t);
	}
	let g = it(), _ = () => {
		u.stop(), g && g.active && ve(g.effects, u);
	};
	if (a && t) {
		let e = t;
		t = (...t) => {
			e(...t), _();
		};
	}
	let v = h ? Array(e.length).fill(jn) : jn, y = (e) => {
		if (!(!(u.flags & 1) || !u.dirty && !e)) if (t) {
			let e = u.run();
			if (i || m || (h ? e.some((e, t) => Ie(e, v[t])) : Ie(e, v))) {
				f && f();
				let n = Nn;
				Nn = u;
				try {
					let n = [
						e,
						v === jn ? void 0 : h && v[0] === jn ? [] : v,
						p
					];
					v = e, c ? c(t, 3, n) : t(...n);
				} finally {
					Nn = n;
				}
			}
		} else u.run();
	};
	return s && s(y), u = new ot(d), u.scheduler = o ? () => o(y, !1) : y, p = (e) => Pn(e, !1, u), f = u.onStop = () => {
		let e = Mn.get(u);
		if (e) {
			if (c) c(e, 4);
			else for (let t of e) t();
			Mn.delete(u);
		}
	}, t ? r ? y(!0) : v = u.run() : o ? o(y.bind(null, !0), !0) : u.run(), _.pause = u.pause.bind(u), _.resume = u.resume.bind(u), _.stop = _, _;
}
function In(e, t = Infinity, n) {
	if (t <= 0 || !k(e) || e.__v_skip || (n ||= /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t)) return e;
	if (n.set(e, t), t--, /* @__PURE__ */ R(e)) In(e.value, t, n);
	else if (E(e)) for (let r = 0; r < e.length; r++) In(e[r], t, n);
	else if (xe(e) || be(e)) e.forEach((e) => {
		In(e, t, n);
	});
	else if (Oe(e)) {
		for (let r in e) In(e[r], t, n);
		for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && In(e[r], t, n);
	}
	return e;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.34/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function Ln(e, t, n, r) {
	try {
		return r ? e(...r) : e();
	} catch (e) {
		zn(e, t, n);
	}
}
function Rn(e, t, n, r) {
	if (D(e)) {
		let i = Ln(e, t, n, r);
		return i && we(i) && i.catch((e) => {
			zn(e, t, n);
		}), i;
	}
	if (E(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(Rn(e[a], t, n, r));
		return i;
	}
}
function zn(e, t, n, r = !0) {
	let i = t ? t.vnode : null, { errorHandler: a, throwUnhandledErrorInProduction: o } = t && t.appContext.config || S;
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
			xt(), Ln(a, null, 10, [
				e,
				i,
				o
			]), St();
			return;
		}
	}
	Bn(e, n, i, r, o);
}
function Bn(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var B = [], Vn = -1, Hn = [], Un = null, Wn = 0, Gn = /* @__PURE__ */ Promise.resolve(), Kn = null;
function qn(e) {
	let t = Kn || Gn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function Jn(e) {
	let t = Vn + 1, n = B.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = B[r], a = er(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function Yn(e) {
	if (!(e.flags & 1)) {
		let t = er(e), n = B[B.length - 1];
		!n || !(e.flags & 2) && t >= er(n) ? B.push(e) : B.splice(Jn(t), 0, e), e.flags |= 1, Xn();
	}
}
function Xn() {
	Kn ||= Gn.then(tr);
}
function Zn(e) {
	E(e) ? Hn.push(...e) : Un && e.id === -1 ? Un.splice(Wn + 1, 0, e) : e.flags & 1 || (Hn.push(e), e.flags |= 1), Xn();
}
function Qn(e, t, n = Vn + 1) {
	for (; n < B.length; n++) {
		let t = B[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			B.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function $n(e) {
	if (Hn.length) {
		let e = [...new Set(Hn)].sort((e, t) => er(e) - er(t));
		if (Hn.length = 0, Un) {
			Un.push(...e);
			return;
		}
		for (Un = e, Wn = 0; Wn < Un.length; Wn++) {
			let e = Un[Wn];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		Un = null, Wn = 0;
	}
}
var er = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function tr(e) {
	try {
		for (Vn = 0; Vn < B.length; Vn++) {
			let e = B[Vn];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), Ln(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; Vn < B.length; Vn++) {
			let e = B[Vn];
			e && (e.flags &= -2);
		}
		Vn = -1, B.length = 0, $n(e), Kn = null, (B.length || Hn.length) && tr(e);
	}
}
var V = null, nr = null;
function rr(e) {
	let t = V;
	return V = e, nr = e && e.type.__scopeId || null, t;
}
function ir(e, t = V, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && ca(-1);
		let i = rr(t), a;
		try {
			a = e(...n);
		} finally {
			rr(i), r._d && ca(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function ar(e, t) {
	if (V === null) return e;
	let n = Va(V), r = e.dirs ||= [];
	for (let e = 0; e < t.length; e++) {
		let [i, a, o, s = S] = t[e];
		i && (D(i) && (i = {
			mounted: i,
			updated: i
		}), i.deep && In(a), r.push({
			dir: i,
			instance: n,
			value: a,
			oldValue: void 0,
			arg: o,
			modifiers: s
		}));
	}
	return e;
}
function or(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (xt(), Rn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), St());
	}
}
function sr(e, t) {
	if (Q) {
		let n = Q.provides, r = Q.parent && Q.parent.provides;
		r === n && (n = Q.provides = Object.create(r)), n[e] = t;
	}
}
function cr(e, t, n = !1) {
	let r = Ea();
	if (r || pi) {
		let i = pi ? pi._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && D(t) ? t.call(r && r.proxy) : t;
	}
}
var lr = /* @__PURE__ */ Symbol.for("v-scx"), ur = () => cr(lr);
function dr(e, t, n) {
	return fr(e, t, n);
}
function fr(e, t, n = S) {
	let { immediate: r, deep: i, flush: a, once: o } = n, s = w({}, n), c = t && r || !t && a !== "post", l;
	if (Ma) {
		if (a === "sync") {
			let e = ur();
			l = e.__watcherHandles ||= [];
		} else if (!c) {
			let e = () => {};
			return e.stop = he, e.resume = he, e.pause = he, e;
		}
	}
	let u = Q;
	s.call = (e, t, n) => Rn(e, u, t, n);
	let d = !1;
	a === "post" ? s.scheduler = (e) => {
		U(e, u && u.suspense);
	} : a !== "sync" && (d = !0, s.scheduler = (e, t) => {
		t ? e() : Yn(e);
	}), s.augmentJob = (e) => {
		t && (e.flags |= 4), d && (e.flags |= 2, u && (e.id = u.uid, e.i = u));
	};
	let f = Fn(e, t, s);
	return Ma && (l ? l.push(f) : c && f()), f;
}
function pr(e, t, n) {
	let r = this.proxy, i = O(e) ? e.includes(".") ? mr(r, e) : () => r[e] : e.bind(r, r), a;
	D(t) ? a = t : (a = t.handler, n = t);
	let o = ka(this), s = fr(i, a.bind(r), n);
	return o(), s;
}
function mr(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var hr = /* @__PURE__ */ Symbol("_vte"), gr = (e) => e.__isTeleport, _r = /* @__PURE__ */ Symbol("_leaveCb");
function vr(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, vr(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function yr(e, t) {
	return D(e) ? w({ name: e.name }, t, { setup: e }) : e;
}
function br(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function xr(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var Sr = /* @__PURE__ */ new WeakMap();
function Cr(e, t, n, r, i = !1) {
	if (E(e)) {
		e.forEach((e, a) => Cr(e, t && (E(t) ? t[a] : t), n, r, i));
		return;
	}
	if (Tr(r) && !i) {
		r.shapeFlag & 512 && r.type.__asyncResolved && r.component.subTree.component && Cr(e, t, n, r.component.subTree);
		return;
	}
	let a = r.shapeFlag & 4 ? Va(r.component) : r.el, o = i ? null : a, { i: s, r: c } = e, l = t && t.r, u = s.refs === S ? s.refs = {} : s.refs, d = s.setupState, f = /* @__PURE__ */ L(d), p = d === S ? ge : (e) => xr(u, e) ? !1 : T(f, e), m = (e, t) => !(t && xr(u, t));
	if (l != null && l !== c) {
		if (wr(t), O(l)) u[l] = null, p(l) && (d[l] = null);
		else if (/* @__PURE__ */ R(l)) {
			let e = t;
			m(l, e.k) && (l.value = null), e.k && (u[e.k] = null);
		}
	}
	if (D(c)) Ln(c, s, 12, [o, u]);
	else {
		let t = O(c), r = /* @__PURE__ */ R(c);
		if (t || r) {
			let s = () => {
				if (e.f) {
					let n = t ? p(c) ? d[c] : u[c] : m(c) || !e.k ? c.value : u[e.k];
					if (i) E(n) && ve(n, a);
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
					s(), Sr.delete(e);
				};
				t.id = -1, Sr.set(e, t), U(t, n);
			} else wr(e), s();
		}
	}
}
function wr(e) {
	let t = Sr.get(e);
	t && (t.flags |= 8, Sr.delete(e));
}
He().requestIdleCallback, He().cancelIdleCallback;
var Tr = (e) => !!e.type.__asyncLoader, Er = (e) => e.type.__isKeepAlive;
function Dr(e, t) {
	kr(e, "a", t);
}
function Or(e, t) {
	kr(e, "da", t);
}
function kr(e, t, n = Q) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (jr(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) Er(e.parent.vnode) && Ar(r, t, n, e), e = e.parent;
	}
}
function Ar(e, t, n, r) {
	let i = jr(t, e, r, !0);
	Rr(() => {
		ve(r[t], i);
	}, n);
}
function jr(e, t, n = Q, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			xt();
			let i = ka(n), a = Rn(t, n, e, r);
			return i(), St(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Mr = (e) => (t, n = Q) => {
	(!Ma || e === "sp") && jr(e, (...e) => t(...e), n);
}, Nr = Mr("bm"), Pr = Mr("m"), Fr = Mr("bu"), Ir = Mr("u"), Lr = Mr("bum"), Rr = Mr("um"), zr = Mr("sp"), Br = Mr("rtg"), Vr = Mr("rtc");
function Hr(e, t = Q) {
	jr("ec", e, t);
}
var Ur = /* @__PURE__ */ Symbol.for("v-ndc");
function Wr(e, t, n, r) {
	let i, a = n && n[r], o = E(e);
	if (o || O(e)) {
		let n = o && /* @__PURE__ */ vn(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ I(e), s = /* @__PURE__ */ yn(e), e = Pt(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Cn(Sn(e[n])) : Sn(e[n]) : e[n], n, void 0, a && a[n]);
	} else if (typeof e == "number") {
		i = Array(e);
		for (let n = 0; n < e; n++) i[n] = t(n + 1, n, void 0, a && a[n]);
	} else if (k(e)) if (e[Symbol.iterator]) i = Array.from(e, (e, n) => t(e, n, void 0, a && a[n]));
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
var Gr = (e) => e ? ja(e) ? Va(e) : Gr(e.parent) : null, Kr = /* @__PURE__ */ w(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => Gr(e.parent),
	$root: (e) => Gr(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => ti(e),
	$forceUpdate: (e) => e.f ||= () => {
		Yn(e.update);
	},
	$nextTick: (e) => e.n ||= qn.bind(e.proxy),
	$watch: (e) => pr.bind(e)
}), qr = (e, t) => e !== S && !e.__isScriptSetup && T(e, t), Jr = {
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
			else if (qr(r, t)) return o[t] = 1, r[t];
			else if (i !== S && T(i, t)) return o[t] = 2, i[t];
			else if (T(a, t)) return o[t] = 3, a[t];
			else if (n !== S && T(n, t)) return o[t] = 4, n[t];
			else Xr && (o[t] = 0);
		}
		let l = Kr[t], u, d;
		if (l) return t === "$attrs" && F(e.attrs, "get", ""), l(e);
		if ((u = s.__cssModules) && (u = u[t])) return u;
		if (n !== S && T(n, t)) return o[t] = 4, n[t];
		if (d = c.config.globalProperties, T(d, t)) return d[t];
	},
	set({ _: e }, t, n) {
		let { data: r, setupState: i, ctx: a } = e;
		return qr(i, t) ? (i[t] = n, !0) : r !== S && T(r, t) ? (r[t] = n, !0) : T(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (a[t] = n, !0);
	},
	has({ _: { data: e, setupState: t, accessCache: n, ctx: r, appContext: i, props: a, type: o } }, s) {
		let c;
		return !!(n[s] || e !== S && s[0] !== "$" && T(e, s) || qr(t, s) || T(a, s) || T(r, s) || T(Kr, s) || T(i.config.globalProperties, s) || (c = o.__cssModules) && c[s]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? T(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function Yr(e) {
	return E(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var Xr = !0;
function Zr(e) {
	let t = ti(e), n = e.proxy, r = e.ctx;
	Xr = !1, t.beforeCreate && $r(t.beforeCreate, e, "bc");
	let { data: i, computed: a, methods: o, watch: s, provide: c, inject: l, created: u, beforeMount: d, mounted: f, beforeUpdate: p, updated: m, activated: h, deactivated: g, beforeDestroy: _, beforeUnmount: v, destroyed: y, unmounted: ee, render: te, renderTracked: ne, renderTriggered: re, errorCaptured: ie, serverPrefetch: ae, expose: b, inheritAttrs: oe, components: se, directives: ce, filters: le } = t;
	if (l && Qr(l, r, null), o) for (let e in o) {
		let t = o[e];
		D(t) && (r[e] = t.bind(n));
	}
	if (i) {
		let t = i.call(n, n);
		k(t) && (e.data = /* @__PURE__ */ mn(t));
	}
	if (Xr = !0, a) for (let e in a) {
		let t = a[e], i = $({
			get: D(t) ? t.bind(n, n) : D(t.get) ? t.get.bind(n, n) : he,
			set: !D(t) && D(t.set) ? t.set.bind(n) : he
		});
		Object.defineProperty(r, e, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		});
	}
	if (s) for (let e in s) ei(s[e], r, n, e);
	if (c) {
		let e = D(c) ? c.call(n) : c;
		Reflect.ownKeys(e).forEach((t) => {
			sr(t, e[t]);
		});
	}
	u && $r(u, e, "c");
	function x(e, t) {
		E(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (x(Nr, d), x(Pr, f), x(Fr, p), x(Ir, m), x(Dr, h), x(Or, g), x(Hr, ie), x(Vr, ne), x(Br, re), x(Lr, v), x(Rr, ee), x(zr, ae), E(b)) if (b.length) {
		let t = e.exposed ||= {};
		b.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	te && e.render === he && (e.render = te), oe != null && (e.inheritAttrs = oe), se && (e.components = se), ce && (e.directives = ce), ae && br(e);
}
function Qr(e, t, n = he) {
	E(e) && (e = oi(e));
	for (let n in e) {
		let r = e[n], i;
		i = k(r) ? "default" in r ? cr(r.from || n, r.default, !0) : cr(r.from || n) : cr(r), /* @__PURE__ */ R(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function $r(e, t, n) {
	Rn(E(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function ei(e, t, n, r) {
	let i = r.includes(".") ? mr(n, r) : () => n[r];
	if (O(e)) {
		let n = t[e];
		D(n) && dr(i, n);
	} else if (D(e)) dr(i, e.bind(n));
	else if (k(e)) if (E(e)) e.forEach((e) => ei(e, t, n, r));
	else {
		let r = D(e.handler) ? e.handler.bind(n) : t[e.handler];
		D(r) && dr(i, r, e);
	}
}
function ti(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => ni(c, e, o, !0)), ni(c, t, o)), k(t) && a.set(t, c), c;
}
function ni(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && ni(e, a, n, !0), i && i.forEach((t) => ni(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = ri[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var ri = {
	data: ii,
	props: ci,
	emits: ci,
	methods: si,
	computed: si,
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
	components: si,
	directives: si,
	watch: li,
	provide: ii,
	inject: ai
};
function ii(e, t) {
	return t ? e ? function() {
		return w(D(e) ? e.call(this, this) : e, D(t) ? t.call(this, this) : t);
	} : t : e;
}
function ai(e, t) {
	return si(oi(e), oi(t));
}
function oi(e) {
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
function si(e, t) {
	return e ? w(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function ci(e, t) {
	return e ? E(e) && E(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : w(/* @__PURE__ */ Object.create(null), Yr(e), Yr(t ?? {})) : t;
}
function li(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = w(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = H(e[r], t[r]);
	return n;
}
function ui() {
	return {
		app: null,
		config: {
			isNativeTag: ge,
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
var di = 0;
function fi(e, t) {
	return function(n, r = null) {
		D(n) || (n = w({}, n)), r != null && !k(r) && (r = null);
		let i = ui(), a = /* @__PURE__ */ new WeakSet(), o = [], s = !1, c = i.app = {
			_uid: di++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: Ua,
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
					return u.appContext = i, l === !0 ? l = "svg" : l === !1 && (l = void 0), o && t ? t(u, a) : e(u, a, l), s = !0, c._container = a, a.__vue_app__ = c, Va(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				s && (Rn(o, c._instance, 16), e(null, c._container), delete c._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, c;
			},
			runWithContext(e) {
				let t = pi;
				pi = c;
				try {
					return e();
				} finally {
					pi = t;
				}
			}
		};
		return c;
	};
}
var pi = null, mi = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${A(t)}Modifiers`] || e[`${j(t)}Modifiers`];
function hi(e, t, ...n) {
	if (e.isUnmounted) return;
	let r = e.vnode.props || S, i = n, a = t.startsWith("update:"), o = a && mi(r, t.slice(7));
	o && (o.trim && (i = n.map((e) => O(e) ? e.trim() : e)), o.number && (i = n.map(ze)));
	let s, c = r[s = Fe(t)] || r[s = Fe(A(t))];
	!c && a && (c = r[s = Fe(j(t))]), c && Rn(c, e, 6, i);
	let l = r[s + "Once"];
	if (l) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[s]) return;
		e.emitted[s] = !0, Rn(l, e, 6, i);
	}
}
var gi = /* @__PURE__ */ new WeakMap();
function _i(e, t, n = !1) {
	let r = n ? gi : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, s = !1;
	if (!D(e)) {
		let r = (e) => {
			let n = _i(e, t, !0);
			n && (s = !0, w(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !s ? (k(e) && r.set(e, null), null) : (E(a) ? a.forEach((e) => o[e] = null) : w(o, a), k(e) && r.set(e, o), o);
}
function vi(e, t) {
	return !e || !_e(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), T(e, t[0].toLowerCase() + t.slice(1)) || T(e, j(t)) || T(e, t));
}
function yi(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: o, attrs: s, emit: c, render: l, renderCache: u, props: d, data: f, setupState: p, ctx: m, inheritAttrs: h } = e, g = rr(e), _, v;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			_ = va(l.call(t, e, u, d, p, f, m)), v = s;
		} else {
			let e = t;
			_ = va(e.length > 1 ? e(d, {
				attrs: s,
				slots: o,
				emit: c
			}) : e(d, null)), v = t.props ? s : bi(s);
		}
	} catch (t) {
		aa.length = 0, zn(t, e, 1), _ = Y(ra);
	}
	let y = _;
	if (v && h !== !1) {
		let e = Object.keys(v), { shapeFlag: t } = y;
		e.length && t & 7 && (a && e.some(C) && (v = xi(v, a)), y = _a(y, v, !1, !0));
	}
	return n.dirs && (y = _a(y, null, !1, !0), y.dirs = y.dirs ? y.dirs.concat(n.dirs) : n.dirs), n.transition && vr(y, n.transition), _ = y, rr(g), _;
}
var bi = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || _e(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, xi = (e, t) => {
	let n = {};
	for (let r in e) (!C(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function Si(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? Ci(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (wi(o, r, n) && !vi(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? Ci(r, o, l) : !0 : !!o;
	return !1;
}
function Ci(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (wi(t, e, a) && !vi(n, a)) return !0;
	}
	return !1;
}
function wi(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && k(r) && k(i) ? !$e(r, i) : r !== i;
}
function Ti({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var Ei = {}, Di = () => Object.create(Ei), Oi = (e) => Object.getPrototypeOf(e) === Ei;
function ki(e, t, n, r = !1) {
	let i = {}, a = Di();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), ji(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ hn(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Ai(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ L(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (vi(e.emitsOptions, o)) continue;
				let u = t[o];
				if (c) if (T(a, o)) u !== a[o] && (a[o] = u, l = !0);
				else {
					let t = A(o);
					i[t] = Mi(c, s, t, u, e, !1);
				}
				else u !== a[o] && (a[o] = u, l = !0);
			}
		}
	} else {
		ji(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !T(t, a) && ((r = j(a)) === a || !T(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Mi(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !T(t, e)) && (delete a[e], l = !0);
	}
	l && Mt(e.attrs, "set", "");
}
function ji(e, t, n, r) {
	let [i, a] = e.propsOptions, o = !1, s;
	if (t) for (let c in t) {
		if (Ae(c)) continue;
		let l = t[c], u;
		i && T(i, u = A(c)) ? !a || !a.includes(u) ? n[u] = l : (s ||= {})[u] = l : vi(e.emitsOptions, c) || (!(c in r) || l !== r[c]) && (r[c] = l, o = !0);
	}
	if (a) {
		let t = /* @__PURE__ */ L(n), r = s || S;
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			n[s] = Mi(i, t, s, r[s], e, !T(r, s));
		}
	}
	return o;
}
function Mi(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = T(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && D(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = ka(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === j(n)) && (r = !0));
	}
	return r;
}
var Ni = /* @__PURE__ */ new WeakMap();
function Pi(e, t, n = !1) {
	let r = n ? Ni : t.propsCache, i = r.get(e);
	if (i) return i;
	let a = e.props, o = {}, s = [], c = !1;
	if (!D(e)) {
		let r = (e) => {
			c = !0;
			let [n, r] = Pi(e, t, !0);
			w(o, n), r && s.push(...r);
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	if (!a && !c) return k(e) && r.set(e, me), me;
	if (E(a)) for (let e = 0; e < a.length; e++) {
		let t = A(a[e]);
		Fi(t) && (o[t] = S);
	}
	else if (a) for (let e in a) {
		let t = A(e);
		if (Fi(t)) {
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
	return k(e) && r.set(e, l), l;
}
function Fi(e) {
	return e[0] !== "$" && !Ae(e);
}
var Ii = (e) => e === "_" || e === "_ctx" || e === "$stable", Li = (e) => E(e) ? e.map(va) : [va(e)], Ri = (e, t, n) => {
	if (t._n) return t;
	let r = ir((...e) => Li(t(...e)), n);
	return r._c = !1, r;
}, zi = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (Ii(n)) continue;
		let i = e[n];
		if (D(i)) t[n] = Ri(n, i, r);
		else if (i != null) {
			let e = Li(i);
			t[n] = () => e;
		}
	}
}, Bi = (e, t) => {
	let n = Li(t);
	e.slots.default = () => n;
}, Vi = (e, t, n) => {
	for (let r in t) (n || !Ii(r)) && (e[r] = t[r]);
}, Hi = (e, t, n) => {
	let r = e.slots = Di();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (Vi(r, t, n), n && Re(r, "_", e, !0)) : zi(t, r);
	} else t && Bi(e, t);
}, Ui = (e, t, n) => {
	let { vnode: r, slots: i } = e, a = !0, o = S;
	if (r.shapeFlag & 32) {
		let e = t._;
		e ? n && e === 1 ? a = !1 : Vi(i, t, n) : (a = !t.$stable, zi(t, i)), o = t;
	} else t && (Bi(e, t), o = { default: 1 });
	if (a) for (let e in i) !Ii(e) && o[e] == null && delete i[e];
}, U = ta;
function Wi(e) {
	return Gi(e);
}
function Gi(e, t) {
	let n = He();
	n.__VUE__ = !0;
	let { insert: r, remove: i, patchProp: a, createElement: o, createText: s, createComment: c, setText: l, setElementText: u, parentNode: d, nextSibling: f, setScopeId: p = he, insertStaticContent: m } = e, h = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !fa(e, t) && (r = E(e), C(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case na:
				g(e, t, n, r);
				break;
			case ra:
				_(e, t, n, r);
				break;
			case ia:
				e ?? v(t, n, r, o);
				break;
			case W:
				se(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? te(e, t, n, r, i, a, o, s, c) : d & 6 ? ce(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, Se);
		}
		u != null && i ? Cr(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && Cr(e.ref, null, a, e, !0);
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
	}, ee = ({ el: e, anchor: t }) => {
		let n;
		for (; e && e !== t;) n = f(e), i(e), e = n;
		i(t);
	}, te = (e, t, n, r, i, a, o, s, c) => {
		if (t.type === "svg" ? o = "svg" : t.type === "math" && (o = "mathml"), e == null) ne(t, n, r, i, a, o, s, c);
		else {
			let n = e.el && e.el._isVueCE ? e.el : null;
			try {
				n && n._beginPatch(), ae(e, t, i, a, o, s, c);
			} finally {
				n && n._endPatch();
			}
		}
	}, ne = (e, t, n, i, s, c, l, d) => {
		let f, p, { props: m, shapeFlag: h, transition: g, dirs: _ } = e;
		if (f = e.el = o(e.type, c, m && m.is, m), h & 8 ? u(f, e.children) : h & 16 && ie(e.children, f, null, i, s, Ki(e, c), l, d), _ && or(e, null, i, "created"), re(f, e, e.scopeId, l, i), m) {
			for (let e in m) e !== "value" && !Ae(e) && a(f, e, null, m[e], c, i);
			"value" in m && a(f, "value", null, m.value, c), (p = m.onVnodeBeforeMount) && Sa(p, i, e);
		}
		_ && or(e, null, i, "beforeMount");
		let v = Ji(s, g);
		v && g.beforeEnter(f), r(f, t, n), ((p = m && m.onVnodeMounted) || v || _) && U(() => {
			try {
				p && Sa(p, i, e), v && g.enter(f), _ && or(e, null, i, "mounted");
			} finally {}
		}, s);
	}, re = (e, t, n, r, i) => {
		if (n && p(e, n), r) for (let t = 0; t < r.length; t++) p(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || ea(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				re(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, ie = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) h(null, e[l] = s ? ya(e[l]) : va(e[l]), t, n, r, i, a, o, s);
	}, ae = (e, t, n, r, i, o, s) => {
		let c = t.el = e.el, { patchFlag: l, dynamicChildren: d, dirs: f } = t;
		l |= e.patchFlag & 16;
		let p = e.props || S, m = t.props || S, h;
		if (n && qi(n, !1), (h = m.onVnodeBeforeUpdate) && Sa(h, n, t, e), f && or(t, e, n, "beforeUpdate"), n && qi(n, !0), (p.innerHTML && m.innerHTML == null || p.textContent && m.textContent == null) && u(c, ""), d ? b(e.dynamicChildren, d, c, n, r, Ki(t, i), o) : s || fe(e, t, c, null, n, r, Ki(t, i), o, !1), l > 0) {
			if (l & 16) oe(c, p, m, n, i);
			else if (l & 2 && p.class !== m.class && a(c, "class", null, m.class, i), l & 4 && a(c, "style", p.style, m.style, i), l & 8) {
				let e = t.dynamicProps;
				for (let t = 0; t < e.length; t++) {
					let r = e[t], o = p[r], s = m[r];
					(s !== o || r === "value") && a(c, r, o, s, i, n);
				}
			}
			l & 1 && e.children !== t.children && u(c, t.children);
		} else !s && d == null && oe(c, p, m, n, i);
		((h = m.onVnodeUpdated) || f) && U(() => {
			h && Sa(h, n, t, e), f && or(t, e, n, "updated");
		}, r);
	}, b = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			h(c, l, c.el && (c.type === W || !fa(c, l) || c.shapeFlag & 198) ? d(c.el) : n, null, r, i, a, o, !0);
		}
	}, oe = (e, t, n, r, i) => {
		if (t !== n) {
			if (t !== S) for (let o in t) !Ae(o) && !(o in n) && a(e, o, t[o], null, i, r);
			for (let o in n) {
				if (Ae(o)) continue;
				let s = n[o], c = t[o];
				s !== c && o !== "value" && a(e, o, c, s, i, r);
			}
			"value" in n && a(e, "value", t.value, n.value, i);
		}
	}, se = (e, t, n, i, a, o, c, l, u) => {
		let d = t.el = e ? e.el : s(""), f = t.anchor = e ? e.anchor : s(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (l = l ? l.concat(h) : h), e == null ? (r(d, n, i), r(f, n, i), ie(t.children || [], n, f, a, o, c, l, u)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (b(e.dynamicChildren, m, n, a, o, c, l), (t.key != null || a && t === a.subTree) && Yi(e, t, !0)) : fe(e, t, n, f, a, o, c, l, u);
	}, ce = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : le(t, n, r, i, a, o, c) : x(e, t, c);
	}, le = (e, t, n, r, i, a, o) => {
		let s = e.component = Ta(e, r, i);
		if (Er(e) && (s.ctx.renderer = Se), Na(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, ue, o), !e.el) {
				let r = s.subTree = Y(ra);
				_(null, r, t, n), e.placeholder = r.el;
			}
		} else ue(s, e, t, n, i, a, o);
	}, x = (e, t, n) => {
		let r = t.component = e.component;
		if (Si(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			de(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, ue = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = Zi(e);
					if (n) {
						t && (t.el = c.el, de(e, t, o)), n.asyncDep.then(() => {
							U(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, f;
				qi(e, !1), t ? (t.el = c.el, de(e, t, o)) : t = c, n && Le(n), (f = t.props && t.props.onVnodeBeforeUpdate) && Sa(f, s, t, c), qi(e, !0);
				let p = yi(e), m = e.subTree;
				e.subTree = p, h(m, p, d(m.el), E(m), e, i, a), t.el = p.el, u === null && Ti(e, p.el), r && U(r, i), (f = t.props && t.props.onVnodeUpdated) && U(() => Sa(f, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Tr(t);
				if (qi(e, !1), l && Le(l), !m && (o = c && c.onVnodeBeforeMount) && Sa(o, d, t), qi(e, !0), s && O) {
					let t = () => {
						e.subTree = yi(e), O(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = yi(e);
					h(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && U(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					U(() => Sa(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Tr(d.vnode) && d.vnode.shapeFlag & 256) && e.a && U(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new ot(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => Yn(u), qi(e, !0), l();
	}, de = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Ai(e, t.props, r, n), Ui(e, t.children, n), xt(), Qn(e), St();
	}, fe = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, d = e ? e.shapeFlag : 0, f = t.children, { patchFlag: p, shapeFlag: m } = t;
		if (p > 0) {
			if (p & 128) {
				ge(l, f, n, r, i, a, o, s, c);
				return;
			} else if (p & 256) {
				pe(l, f, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (d & 16 && T(l, i, a), f !== l && u(n, f)) : d & 16 ? m & 16 ? ge(l, f, n, r, i, a, o, s, c) : T(l, i, a, !0) : (d & 8 && u(n, ""), m & 16 && ie(f, n, r, i, a, o, s, c));
	}, pe = (e, t, n, r, i, a, o, s, c) => {
		e ||= me, t ||= me;
		let l = e.length, u = t.length, d = Math.min(l, u), f;
		for (f = 0; f < d; f++) {
			let r = t[f] = c ? ya(t[f]) : va(t[f]);
			h(e[f], r, n, null, i, a, o, s, c);
		}
		l > u ? T(e, i, a, !0, !1, d) : ie(t, n, r, i, a, o, s, c, d);
	}, ge = (e, t, n, r, i, a, o, s, c) => {
		let l = 0, u = t.length, d = e.length - 1, f = u - 1;
		for (; l <= d && l <= f;) {
			let r = e[l], u = t[l] = c ? ya(t[l]) : va(t[l]);
			if (fa(r, u)) h(r, u, n, null, i, a, o, s, c);
			else break;
			l++;
		}
		for (; l <= d && l <= f;) {
			let r = e[d], l = t[f] = c ? ya(t[f]) : va(t[f]);
			if (fa(r, l)) h(r, l, n, null, i, a, o, s, c);
			else break;
			d--, f--;
		}
		if (l > d) {
			if (l <= f) {
				let e = f + 1, d = e < u ? t[e].el : r;
				for (; l <= f;) h(null, t[l] = c ? ya(t[l]) : va(t[l]), n, d, i, a, o, s, c), l++;
			}
		} else if (l > f) for (; l <= d;) C(e[l], i, a, !0), l++;
		else {
			let p = l, m = l, g = /* @__PURE__ */ new Map();
			for (l = m; l <= f; l++) {
				let e = t[l] = c ? ya(t[l]) : va(t[l]);
				e.key != null && g.set(e.key, l);
			}
			let _, v = 0, y = f - m + 1, ee = !1, te = 0, ne = Array(y);
			for (l = 0; l < y; l++) ne[l] = 0;
			for (l = p; l <= d; l++) {
				let r = e[l];
				if (v >= y) {
					C(r, i, a, !0);
					continue;
				}
				let u;
				if (r.key != null) u = g.get(r.key);
				else for (_ = m; _ <= f; _++) if (ne[_ - m] === 0 && fa(r, t[_])) {
					u = _;
					break;
				}
				u === void 0 ? C(r, i, a, !0) : (ne[u - m] = l + 1, u >= te ? te = u : ee = !0, h(r, t[u], n, null, i, a, o, s, c), v++);
			}
			let re = ee ? Xi(ne) : me;
			for (_ = re.length - 1, l = y - 1; l >= 0; l--) {
				let e = m + l, d = t[e], f = t[e + 1], p = e + 1 < u ? f.el || $i(f) : r;
				ne[l] === 0 ? h(null, d, n, p, i, a, o, s, c) : ee && (_ < 0 || l !== re[_] ? _e(d, n, p, 2) : _--);
			}
		}
	}, _e = (e, t, n, a, o = null) => {
		let { el: s, type: c, transition: l, children: u, shapeFlag: d } = e;
		if (d & 6) {
			_e(e.component.subTree, t, n, a);
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
		if (c === W) {
			r(s, t, n);
			for (let e = 0; e < u.length; e++) _e(u[e], t, n, a);
			r(e.anchor, t, n);
			return;
		}
		if (c === ia) {
			y(e, t, n);
			return;
		}
		if (a !== 2 && d & 1 && l) if (a === 0) l.beforeEnter(s), r(s, t, n), U(() => l.enter(s), o);
		else {
			let { leave: a, delayLeave: o, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? i(s) : r(s, t, n);
			}, d = () => {
				s._isLeaving && s[_r](!0), a(s, () => {
					u(), c && c();
				});
			};
			o ? o(s, u, d) : d();
		}
		else r(s, t, n);
	}, C = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (xt(), Cr(s, null, n, e, !0), St()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Tr(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Sa(_, t, e), u & 6) ye(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && or(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, Se, r) : l && !l.hasOnce && (a !== W || d > 0 && d & 64) ? T(l, t, n, !1, !0) : (a === W && d & 384 || !i && u & 16) && T(c, t, n), r && w(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && U(() => {
			_ && Sa(_, t, e), h && or(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, w = (e) => {
		let { type: t, el: n, anchor: r, transition: a } = e;
		if (t === W) {
			ve(n, r);
			return;
		}
		if (t === ia) {
			ee(e);
			return;
		}
		let o = () => {
			i(n), a && !a.persisted && a.afterLeave && a.afterLeave();
		};
		if (e.shapeFlag & 1 && a && !a.persisted) {
			let { leave: t, delayLeave: r } = a, i = () => t(n, o);
			r ? r(e.el, o, i) : i();
		} else o();
	}, ve = (e, t) => {
		let n;
		for (; e !== t;) n = f(e), i(e), e = n;
		i(t);
	}, ye = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		Qi(c), Qi(l), r && Le(r), i.stop(), a && (a.flags |= 8, C(o, e, t, n)), s && U(s, t), U(() => {
			e.isUnmounted = !0;
		}, t);
	}, T = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) C(e[o], t, n, r, i);
	}, E = (e) => {
		if (e.shapeFlag & 6) return E(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = f(e.anchor || e.el), n = t && t[hr];
		return n ? f(n) : t;
	}, be = !1, xe = (e, t, n) => {
		let r;
		e == null ? t._vnode && (C(t._vnode, null, null, !0), r = t._vnode.component) : h(t._vnode || null, e, t, null, null, null, n), t._vnode = e, be ||= (be = !0, Qn(r), $n(), !1);
	}, Se = {
		p: h,
		um: C,
		m: _e,
		r: w,
		mt: le,
		mc: ie,
		pc: fe,
		pbc: b,
		n: E,
		o: e
	}, D, O;
	return t && ([D, O] = t(Se)), {
		render: xe,
		hydrate: D,
		createApp: fi(xe, D)
	};
}
function Ki({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function qi({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Ji(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Yi(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (E(r) && E(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = ya(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && Yi(t, a)), a.type === na && (a.patchFlag === -1 && (a = i[e] = ya(a)), a.el = t.el), a.type === ra && !a.el && (a.el = t.el);
	}
}
function Xi(e) {
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
function Zi(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : Zi(t);
}
function Qi(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function $i(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? $i(t.subTree) : null;
}
var ea = (e) => e.__isSuspense;
function ta(e, t) {
	t && t.pendingBranch ? E(e) ? t.effects.push(...e) : t.effects.push(e) : Zn(e);
}
var W = /* @__PURE__ */ Symbol.for("v-fgt"), na = /* @__PURE__ */ Symbol.for("v-txt"), ra = /* @__PURE__ */ Symbol.for("v-cmt"), ia = /* @__PURE__ */ Symbol.for("v-stc"), aa = [], G = null;
function K(e = !1) {
	aa.push(G = e ? null : []);
}
function oa() {
	aa.pop(), G = aa[aa.length - 1] || null;
}
var sa = 1;
function ca(e, t = !1) {
	sa += e, e < 0 && G && t && (G.hasOnce = !0);
}
function la(e) {
	return e.dynamicChildren = sa > 0 ? G || me : null, oa(), sa > 0 && G && G.push(e), e;
}
function q(e, t, n, r, i, a) {
	return la(J(e, t, n, r, i, a, !0));
}
function ua(e, t, n, r, i) {
	return la(Y(e, t, n, r, i, !0));
}
function da(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function fa(e, t) {
	return e.type === t.type && e.key === t.key;
}
var pa = ({ key: e }) => e ?? null, ma = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : O(e) || /* @__PURE__ */ R(e) || D(e) ? {
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
		key: t && pa(t),
		ref: t && ma(t),
		scopeId: nr,
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
	return s ? (ba(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= O(n) ? 8 : 16), sa > 0 && !o && G && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && G.push(c), c;
}
var Y = ha;
function ha(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === Ur) && (e = ra), da(e)) {
		let r = _a(e, t, !0);
		return n && ba(r, n), sa > 0 && !a && G && (r.shapeFlag & 6 ? G[G.indexOf(e)] = r : G.push(r)), r.patchFlag = -2, r;
	}
	if (Ha(e) && (e = e.__vccOpts), t) {
		t = ga(t);
		let { class: e, style: n } = t;
		e && !O(e) && (t.class = Je(e)), k(n) && (/* @__PURE__ */ bn(n) && !E(n) && (n = w({}, n)), t.style = Ue(n));
	}
	let o = O(e) ? 1 : ea(e) ? 128 : gr(e) ? 64 : k(e) ? 4 : D(e) ? 2 : 0;
	return J(e, t, n, r, i, o, a, !0);
}
function ga(e) {
	return e ? /* @__PURE__ */ bn(e) || Oi(e) ? w({}, e) : e : null;
}
function _a(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? xa(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && pa(l),
		ref: t && t.ref ? n && a ? E(a) ? a.concat(ma(t)) : [a, ma(t)] : ma(t) : a,
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
		ssContent: e.ssContent && _a(e.ssContent),
		ssFallback: e.ssFallback && _a(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && vr(u, c.clone(u)), u;
}
function X(e = " ", t = 0) {
	return Y(na, null, e, t);
}
function Z(e = "", t = !1) {
	return t ? (K(), ua(ra, null, e)) : Y(ra, null, e);
}
function va(e) {
	return e == null || typeof e == "boolean" ? Y(ra) : E(e) ? Y(W, null, e.slice()) : da(e) ? ya(e) : Y(na, null, String(e));
}
function ya(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : _a(e);
}
function ba(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (E(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), ba(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Oi(t) ? t._ctx = V : r === 3 && V && (V.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else D(t) ? (t = {
		default: t,
		_ctx: V
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [X(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function xa(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = Je([t.class, r.class]));
		else if (e === "style") t.style = Ue([t.style, r.style]);
		else if (_e(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(E(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !C(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Sa(e, t, n, r = null) {
	Rn(e, t, 7, [n, r]);
}
var Ca = ui(), wa = 0;
function Ta(e, t, n) {
	let r = e.type, i = (t ? t.appContext : e.appContext) || Ca, a = {
		uid: wa++,
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
		scope: new rt(!0),
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
		propsOptions: Pi(r, i),
		emitsOptions: _i(r, i),
		emit: null,
		emitted: null,
		propsDefaults: S,
		inheritAttrs: r.inheritAttrs,
		ctx: S,
		data: S,
		props: S,
		attrs: S,
		slots: S,
		refs: S,
		setupState: S,
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
	return a.ctx = { _: a }, a.root = t ? t.root : a, a.emit = hi.bind(null, a), e.ce && e.ce(a), a;
}
var Q = null, Ea = () => Q || V, Da, Oa;
{
	let e = He(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Da = t("__VUE_INSTANCE_SETTERS__", (e) => Q = e), Oa = t("__VUE_SSR_SETTERS__", (e) => Ma = e);
}
var ka = (e) => {
	let t = Q;
	return Da(e), e.scope.on(), () => {
		e.scope.off(), Da(t);
	};
}, Aa = () => {
	Q && Q.scope.off(), Da(null);
};
function ja(e) {
	return e.vnode.shapeFlag & 4;
}
var Ma = !1;
function Na(e, t = !1, n = !1) {
	t && Oa(t);
	let { props: r, children: i } = e.vnode, a = ja(e);
	ki(e, r, a, t), Hi(e, i, n || t);
	let o = a ? Pa(e, t) : void 0;
	return t && Oa(!1), o;
}
function Pa(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Jr);
	let { setup: r } = n;
	if (r) {
		xt();
		let n = e.setupContext = r.length > 1 ? Ba(e) : null, i = ka(e), a = Ln(r, e, 0, [e.props, n]), o = we(a);
		if (St(), i(), (o || e.sp) && !Tr(e) && br(e), o) {
			if (a.then(Aa, Aa), t) return a.then((n) => {
				Fa(e, n, t);
			}).catch((t) => {
				zn(t, e, 0);
			});
			e.asyncDep = a;
		} else Fa(e, a, t);
	} else Ra(e, t);
}
function Fa(e, t, n) {
	D(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : k(t) && (e.setupState = On(t)), Ra(e, n);
}
var Ia, La;
function Ra(e, t, n) {
	let r = e.type;
	if (!e.render) {
		if (!t && Ia && !r.render) {
			let t = r.template || ti(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: i } = e.appContext.config, { delimiters: a, compilerOptions: o } = r;
				r.render = Ia(t, w(w({
					isCustomElement: n,
					delimiters: a
				}, i), o));
			}
		}
		e.render = r.render || he, La && La(e);
	}
	{
		let t = ka(e);
		xt();
		try {
			Zr(e);
		} finally {
			St(), t();
		}
	}
}
var za = { get(e, t) {
	return F(e, "get", ""), e[t];
} };
function Ba(e) {
	return {
		attrs: new Proxy(e.attrs, za),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function Va(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(On(xn(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in Kr) return Kr[n](e);
		},
		has(e, t) {
			return t in e || t in Kr;
		}
	}) : e.proxy;
}
function Ha(e) {
	return D(e) && "__vccOpts" in e;
}
var $ = (e, t) => /* @__PURE__ */ An(e, t, Ma), Ua = "3.5.34", Wa = void 0, Ga = typeof window < "u" && window.trustedTypes;
if (Ga) try {
	Wa = /* @__PURE__ */ Ga.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var Ka = Wa ? (e) => Wa.createHTML(e) : (e) => e, qa = "http://www.w3.org/2000/svg", Ja = "http://www.w3.org/1998/Math/MathML", Ya = typeof document < "u" ? document : null, Xa = Ya && /* @__PURE__ */ Ya.createElement("template"), Za = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? Ya.createElementNS(qa, e) : t === "mathml" ? Ya.createElementNS(Ja, e) : n ? Ya.createElement(e, { is: n }) : Ya.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => Ya.createTextNode(e),
	createComment: (e) => Ya.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => Ya.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			Xa.innerHTML = Ka(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = Xa.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, Qa = /* @__PURE__ */ Symbol("_vtc");
function $a(e, t, n) {
	let r = e[Qa];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var eo = /* @__PURE__ */ Symbol("_vod"), to = /* @__PURE__ */ Symbol("_vsh"), no = /* @__PURE__ */ Symbol(""), ro = /(?:^|;)\s*display\s*:/;
function io(e, t, n) {
	let r = e.style, i = O(n), a = !1;
	if (n && !i) {
		if (t) if (O(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? oo(r, t, "");
		}
		else for (let e in t) n[e] ?? oo(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? oo(r, i, "") : uo(e, i, !O(t) && t ? t[i] : void 0, o) || oo(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[no];
			e && (n += ";" + e), r.cssText = n, a = ro.test(n);
		}
	} else t && e.removeAttribute("style");
	eo in e && (e[eo] = a ? r.display : "", e[to] && (r.display = "none"));
}
var ao = /\s*!important$/;
function oo(e, t, n) {
	if (E(n)) n.forEach((n) => oo(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = lo(e, t);
		ao.test(n) ? e.setProperty(j(r), n.replace(ao, ""), "important") : e[r] = n;
	}
}
var so = [
	"Webkit",
	"Moz",
	"ms"
], co = {};
function lo(e, t) {
	let n = co[t];
	if (n) return n;
	let r = A(t);
	if (r !== "filter" && r in e) return co[t] = r;
	r = Pe(r);
	for (let n = 0; n < so.length; n++) {
		let i = so[n] + r;
		if (i in e) return co[t] = i;
	}
	return t;
}
function uo(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && O(r) && n === r;
}
var fo = "http://www.w3.org/1999/xlink";
function po(e, t, n, r, i, a = Xe(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(fo, t.slice(6, t.length)) : e.setAttributeNS(fo, t, n) : n == null || a && !Ze(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : Ce(n) ? String(n) : n);
}
function mo(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? Ka(n) : n);
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
		r === "boolean" ? n = Ze(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
	}
	try {
		e[t] = n;
	} catch {}
	o && e.removeAttribute(i || t);
}
function ho(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function go(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var _o = /* @__PURE__ */ Symbol("_vei");
function vo(e, t, n, r, i = null) {
	let a = e[_o] || (e[_o] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = bo(t);
		r ? ho(e, n, a[t] = wo(r, i), s) : o && (go(e, n, o, s), a[t] = void 0);
	}
}
var yo = /(?:Once|Passive|Capture)$/;
function bo(e) {
	let t;
	if (yo.test(e)) {
		t = {};
		let n;
		for (; n = e.match(yo);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : j(e.slice(2)), t];
}
var xo = 0, So = /* @__PURE__ */ Promise.resolve(), Co = () => xo ||= (So.then(() => xo = 0), Date.now());
function wo(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		Rn(To(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Co(), n;
}
function To(e, t) {
	if (E(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Eo = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Do = (e, t, n, r, i, a) => {
	let o = i === "svg";
	t === "class" ? $a(e, r, o) : t === "style" ? io(e, n, r) : _e(t) ? C(t) || vo(e, t, n, r, a) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Oo(e, t, r, o)) ? (mo(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && po(e, t, r, o, a, t !== "value")) : e._isVueCE && (ko(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !O(r))) ? mo(e, A(t), r, a, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), po(e, t, r, o));
};
function Oo(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Eo(t) && D(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Eo(t) && O(n) ? !1 : t in e;
}
function ko(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = A(t);
	return Array.isArray(n) ? n.some((e) => A(e) === r) : Object.keys(n).some((e) => A(e) === r);
}
var Ao = {};
/* @__NO_SIDE_EFFECTS__ */
function jo(e, t, n) {
	let r = /* @__PURE__ */ yr(e, t);
	Oe(r) && (r = w({}, r, t));
	class i extends No {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var Mo = typeof HTMLElement < "u" ? HTMLElement : class {}, No = class e extends Mo {
	constructor(e, t = {}, n = Yo) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== Yo ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(w({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, qn(() => {
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
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = Be(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[A(e)] = !0);
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
		if (t) for (let e in t) T(this, e) || Object.defineProperty(this, e, { get: () => En(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = E(t) ? t : Object.keys(t || {});
		for (let e of Object.keys(this)) e[0] !== "_" && n.includes(e) && this._setProp(e, this[e]);
		for (let e of n.map(A)) Object.defineProperty(this, e, {
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : Ao, r = A(e);
		t && this._numberProps && this._numberProps[r] && (n = Be(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === Ao ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(j(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(j(e), t + "") : t || this.removeAttribute(j(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), Jo(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Y(this._def, w(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, Oe(t[0]) ? w({ detail: t }, t[0]) : { detail: t }));
			};
			e.emit = (e, ...n) => {
				t(e, n), j(e) !== e && t(j(e), n);
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
}, Po = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return E(t) ? (e) => Le(t, e) : t;
};
function Fo(e) {
	e.target.composing = !0;
}
function Io(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var Lo = /* @__PURE__ */ Symbol("_assign");
function Ro(e, t, n) {
	return t && (e = e.trim()), n && (e = ze(e)), e;
}
var zo = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e[Lo] = Po(i);
		let a = r || i.props && i.props.type === "number";
		ho(e, t ? "change" : "input", (t) => {
			t.target.composing || e[Lo](Ro(e.value, n, a));
		}), (n || a) && ho(e, "change", () => {
			e.value = Ro(e.value, n, a);
		}), t || (ho(e, "compositionstart", Fo), ho(e, "compositionend", Io), ho(e, "change", Io));
	},
	mounted(e, { value: t }) {
		e.value = t ?? "";
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[Lo] = Po(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? ze(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, Bo = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], Vo = {
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
	exact: (e, t) => Bo.some((n) => e[`${n}Key`] && !t.includes(n))
}, Ho = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = Vo[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, Uo = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, Wo = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = j(n.key);
		if (t.some((e) => e === r || Uo[e] === r)) return e(n);
	}));
}, Go = /* @__PURE__ */ w({ patchProp: Do }, Za), Ko;
function qo() {
	return Ko ||= Wi(Go);
}
var Jo = ((...e) => {
	qo().render(...e);
}), Yo = ((...e) => {
	let t = qo().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = Zo(e);
		if (!r) return;
		let i = t._component;
		!D(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, Xo(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function Xo(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function Zo(e) {
	return O(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function Qo(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function $o(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function es(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if ($o(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			Qo(e.target) || r(e);
		};
	}
	return t;
}
function ts(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = es(e), i = () => {
		n ||= x(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? dr(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), Rr(a);
}
//#endregion
//#region packages/sdk-vue/src/markdown.ts
var ns = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
function rs(e) {
	return e.replace(/[&<>"']/g, (e) => ns[e] ?? e);
}
var is = /\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, as = "CODE", os = "END";
function ss(e) {
	let t = [], n = e.replace(/`([^`]+)`/g, (e, n) => (t.push("<code>" + n + "</code>"), as + (t.length - 1) + os));
	n = n.replace(is, (e) => "<a href=\"" + e + "\" rel=\"noopener noreferrer\">" + e + "</a>"), n = n.replace(/\*\*([^*]+)\*\*/g, (e, t) => "<strong>" + t + "</strong>"), n = n.replace(/(^|[^*])\*([^*\s][^*]*?[^*\s]|[^*\s])\*(?!\*)/g, (e, t, n) => t + "<em>" + n + "</em>");
	let r = /* @__PURE__ */ RegExp("CODE(\\d+)END", "g");
	return n.replace(r, (e, n) => t[Number(n)] ?? "");
}
function cs(e) {
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
function ls(e) {
	if (!e) return "";
	let t = cs(e), n = [];
	for (let e of t) switch (e.kind) {
		case "heading": {
			let t = e.level ?? 1, r = ss(rs(e.text));
			n.push("<h" + t + ">" + r + "</h" + t + ">");
			break;
		}
		case "paragraph": {
			let t = ss(rs(e.text));
			n.push("<p>" + t.replace(/\n/g, "<br />") + "</p>");
			break;
		}
		case "code": {
			let t = e.lang ? " data-lang=\"" + rs(e.lang) + "\"" : "";
			n.push("<pre" + t + "><code>" + rs(e.text) + "</code></pre>");
			break;
		}
		case "list": {
			let t = e.ordered ? "ol" : "ul", r = (e.items ?? []).map((e) => "  <li>" + ss(rs(e)) + "</li>").join("\n");
			n.push("<" + t + ">\n" + r + "\n</" + t + ">");
			break;
		}
	}
	return n.join("\n");
}
//#endregion
//#region packages/sdk-vue/src/parse-query.ts
function us(e, t) {
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
//#region packages/sdk-vue/src/index.ts
function ds(e) {
	fs(e.tagName, e.component);
	let t = /* @__PURE__ */ jo(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(ms(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function fs(e, t) {
	if (typeof document > "u") return;
	let n = ps(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function ps(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function ms(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_epics/dist/ext_epics.client.ts
var hs = {
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
function gs(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function _s(e) {
	return `comtrya://workspace/${e}`;
}
function vs(e) {
	switch (e) {
		case "IN_PROGRESS":
		case "AT_RISK":
		case "DONE":
		case "CANCELED": return e;
		default: return "PLANNED";
	}
}
function ys(e) {
	return {
		id: e.id,
		workspaceId: e.workspaceId ?? e.workspace?.replace(/^comtrya:\/\/workspace\//, "") ?? "",
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: vs(e.state),
		targetDate: e.targetDate ?? null,
		ownerRef: e.ownerRef ?? null,
		labels: e.labels ?? [],
		createdAt: e.createdAt ?? null,
		closedAt: e.closedAt ?? null,
		projectName: e.projectName ?? null
	};
}
async function bs(e, t) {
	let n = gs(await hs.byRefEpic(t), "epicByRef");
	return n ? ys(n) : null;
}
async function xs(e, t) {
	let n = gs(await hs.listEpics({
		workspace: _s(t.workspaceId),
		limit: 1024
	}), "listEpics").map(ys), r = t.state ? vs(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function Ss(e, t) {
	return gs(await hs.progressEpic(t), "epicProgress");
}
async function Cs(e, t) {
	return gs(await hs.issuesInEpic(t), "issuesInEpic");
}
async function ws(e, t, n) {
	return ys(gs(await hs.changeStateEpic({
		id: t,
		state: n
	}), "changeEpicState"));
}
async function Ts(e, t) {
	return ys(gs(await hs.createEpic({
		workspace: _s(t.workspaceId),
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
var Es = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", Ds = "epics";
function Os(e) {
	return `comtrya://epic/${e.id}`;
}
function ks(e) {
	return l(Ds, `/${e.workspaceId}/${e.id}`);
}
function As(e) {
	return `${l(Ds, "/new")}?workspaceId=${e}`;
}
function js(e) {
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
var Ms = /* @__PURE__ */ new Map();
function Ns(e) {
	return [
		e.id,
		e.title,
		e.state,
		e.projectName ?? ""
	].join("|");
}
var Ps = [
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
function Fs(e) {
	return e.projectName ? ` (${e.projectName})` : "";
}
function Is(e, t) {
	let n = [], r = Fs(e);
	n.push(fe({
		id: `ext_epics.open.${e.id}`,
		title: `Open epic ${e.title}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: () => {
			window.location.href = ks(e);
		}
	}));
	for (let { state: i, verb: a } of Ps) e.state !== i && n.push(fe({
		id: `ext_epics.mark.${i.toLowerCase()}.${e.id}`,
		title: `Mark epic ${e.title} ${a}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: async () => {
			await ws(t, e.id, i);
		}
	}));
	return () => n.forEach((e) => e());
}
async function Ls(e, t) {
	let n;
	try {
		n = await xs(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_epics] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = Ns(t), i = Ms.get(t.id);
		i && i.signature === n || (i?.unregister(), Ms.set(t.id, {
			signature: n,
			unregister: Is(t, e)
		}));
	}
	for (let [e, t] of Ms) r.has(e) || (t.unregister(), Ms.delete(e));
}
function Rs(e) {
	let t = Es;
	Ls(e, t);
	let n = ["dev.comtrya.epic.created", "dev.comtrya.epic.state-changed"].map((n) => u({
		type: n,
		onEvent: () => {
			Ls(e, t);
		},
		onError: () => {}
	}));
	return () => {
		for (let e of n) e();
		for (let e of Ms.values()) e.unregister();
		Ms.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicCard.vue?vue&type=script&setup=true&lang.ts
var zs = ["data-state"], Bs = ["data-epic-id"], Vs = { class: "epic-card-title" }, Hs = ["href"], Us = ["data-author-kind", "title"], Ws = { class: "owner-glyph" }, Gs = ["title"], Ks = {
	key: 0,
	class: "epic-meta"
}, qs = {
	key: 1,
	class: "epic-meta"
}, Js = {
	key: 1,
	class: "epic-line muted"
}, Ys = {
	key: 2,
	class: "epic-card-fallback"
}, Xs = { class: "epic-line muted" }, Zs = { class: "epic-line warn" }, Qs = /* @__PURE__ */ yr({
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
		let n = e, r = t, i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(n.epic ?? null), s = /* @__PURE__ */ z(null), c = $(() => n.resourceRef ?? n.ref ?? ""), l = $(() => n.client ?? n.comtryaClient), u = $(() => n.epic ?? o.value), d = $(() => js(u.value?.state)), f = $(() => (s.value?.issuesOpen ?? 0) + (s.value?.issuesClosed ?? 0));
		Pr(p), dr(() => [
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
				o.value = await bs(l.value, c.value), i.value = o.value ? "ready" : "empty", await m();
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
				s.value = await Ss(l.value, c.value);
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
			J("div", Vs, [
				J("span", { class: Je(["epic-pill", d.value.className]) }, M(d.value.label), 3),
				J("a", {
					class: "epic-title-link",
					href: En(ks)(u.value)
				}, M(u.value.title), 9, Hs),
				u.value.ownerRef ? (K(), q("button", {
					key: 0,
					type: "button",
					class: Je(["epic-owner", { active: n.activeOwner === u.value.ownerRef }]),
					"data-author-kind": h(u.value.ownerRef).kind,
					title: `${u.value.ownerRef}\nClick to filter by this owner`,
					onClick: t[0] ||= Ho((e) => r("owner-click", u.value.ownerRef), ["prevent", "stop"])
				}, [J("span", Ws, M(h(u.value.ownerRef).glyph), 1), X(" " + M(h(u.value.ownerRef).label), 1)], 10, Us)) : Z("", !0),
				u.value.projectName ? (K(), q("button", {
					key: 1,
					type: "button",
					class: Je(["epic-project", { active: n.activeProject === u.value.projectName }]),
					title: `${u.value.projectName}\nClick to filter by this project`,
					onClick: t[1] ||= Ho((e) => r("project-click", u.value.projectName), ["prevent", "stop"])
				}, [t[2] ||= J("span", { class: "project-glyph" }, "◇", -1), X(" " + M(u.value.projectName), 1)], 10, Gs)) : Z("", !0)
			]),
			s.value ? (K(), q("div", Ks, [J("span", null, M(s.value.issuesClosed ?? 0) + "/" + M(f.value) + " issues", 1), J("span", null, M(s.value.percentComplete ?? 0) + "% complete", 1)])) : Z("", !0),
			u.value.targetDate ? (K(), q("div", qs, [J("span", null, "target: " + M(u.value.targetDate), 1)])) : Z("", !0)
		], 8, Bs)) : i.value === "loading" ? (K(), q("p", Js, " Loading " + M(c.value), 1)) : (K(), q("div", Ys, [J("p", Xs, M(c.value || "epic"), 1), J("p", Zs, M(a.value ?? "epic not found"), 1)]))], 8, zs));
	}
}), $s = ".epic-card[data-v-2582b594]{display:block}.epic-card-body[data-v-2582b594]{border:1px solid var(--ink-rule,#d0cfc8);gap:6px;padding:10px 12px;display:grid}.epic-card-title[data-v-2582b594]{align-items:baseline;gap:8px;min-width:0;display:flex}.epic-pill[data-v-2582b594],.epic-meta[data-v-2582b594],.epic-line[data-v-2582b594]{font-family:var(--mono,monospace)}.epic-pill[data-v-2582b594]{border:1px solid;padding:1px 8px;font-size:10px}.epic-project[data-v-2582b594]{font-family:var(--mono,monospace);color:var(--accent-blue,#1d55a6);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px solid;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-project[data-v-2582b594]:hover{background:var(--paper-tint,#f2efe7)}.epic-project.active[data-v-2582b594]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-color:var(--ink,#111)}.epic-owner+.epic-project[data-v-2582b594]{margin-left:4px}.epic-project .project-glyph[data-v-2582b594]{font-size:10px}.epic-owner[data-v-2582b594]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px dashed;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-owner[data-v-2582b594]:hover{background:var(--paper-tint,#f2efe7)}.epic-owner.active[data-v-2582b594]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-style:solid;border-color:var(--ink,#111)}.epic-owner.active .owner-glyph[data-v-2582b594]{color:inherit}.epic-owner .owner-glyph[data-v-2582b594]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.epic-owner[data-author-kind=agent][data-v-2582b594]{color:#6b3fa0}.epic-owner[data-author-kind=bot][data-v-2582b594]{color:var(--accent-blue,#1d55a6)}.epic-owner[data-author-kind=credential][data-v-2582b594]{color:var(--accent-yellow,#c89300)}.epic-owner[data-author-kind=team][data-v-2582b594]{color:var(--accent-teal,#087f6f)}.epic-state-good[data-v-2582b594]{color:var(--ink-go,#008873)}.epic-state-warn[data-v-2582b594]{color:var(--ink-warn,#c2410c)}.epic-state-muted[data-v-2582b594],.epic-meta[data-v-2582b594],.muted[data-v-2582b594]{color:var(--ink-faint,#888)}.epic-title-link[data-v-2582b594]{min-width:0;color:inherit;font-family:var(--display,system-ui);overflow-wrap:anywhere;font-weight:600}.epic-meta[data-v-2582b594]{flex-wrap:wrap;gap:8px;font-size:11px;display:flex}.epic-line[data-v-2582b594]{margin:4px 0;font-size:12px}.warn[data-v-2582b594]{color:var(--ink-warn,#c2410c)}", ec = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, tc = /* @__PURE__ */ ec(Qs, [["styles", [$s]], ["__scopeId", "data-v-2582b594"]]);
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/issue-rows.ts
function nc(e, t = "") {
	return typeof e == "string" ? e : t;
}
function rc(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function ic(e) {
	let t = typeof e == "string" ? e.toUpperCase() : "";
	return t === "CLOSED" ? "CLOSED" : t === "REOPENED" ? "REOPENED" : "OPEN";
}
function ac(e) {
	return typeof e == "string" ? e.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/[^/]+)?$/)?.[1] ?? null : null;
}
async function oc(t) {
	let n = await e("ext_issues", "issues", "by-ref-issue", t);
	if (!n.ok || !n.value || typeof n.value != "object") return null;
	let r = n.value, i = rc(r.number), a = ac(r.repository), o = i !== null && a ? l("issues", `/${a}/${i}`) : null;
	return {
		ref: t,
		id: nc(r.id),
		number: i,
		title: nc(r.title, "(untitled)"),
		state: ic(r.state),
		projectName: typeof r.projectName == "string" ? r.projectName : null,
		labels: Array.isArray(r.labels) ? r.labels.filter((e) => typeof e == "string") : [],
		authorRef: typeof r.authorRef == "string" ? r.authorRef : null,
		href: o
	};
}
async function sc(e) {
	return (await Promise.all(e.map((e) => oc(e)))).filter((e) => e !== null);
}
function cc(e) {
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
var lc = "ext-epics-detail-styles", uc = "\n.epic-detail {\n  max-width: 880px;\n  display: grid;\n  gap: 24px;\n  padding: 24px 0 48px;\n  font-family: var(--serif, \"iA Writer Quattro\", Georgia, serif);\n}\n\n.epic-detail .epic-line,\n.epic-detail .epic-meta,\n.epic-detail .epic-progress,\n.epic-detail .epic-issues-list,\n.epic-detail .epic-actions,\n.epic-detail .epic-actions-heading,\n.epic-detail .epic-kbd-hint,\n.epic-detail .epic-section-count {\n  font-family: var(--mono, ui-monospace, \"IBM Plex Mono\", monospace);\n}\n\n.epic-header { display: grid; gap: 6px; }\n\n.epic-overline {\n  margin: 0;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10px;\n  letter-spacing: 0.18em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-title {\n  margin: 0;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  font-size: 28px;\n  letter-spacing: -0.01em;\n  line-height: 1.15;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  align-items: center;\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-pill {\n  padding: 1px 8px;\n  border: 1px solid currentColor;\n  text-transform: lowercase;\n}\n\n.epic-state-good { color: var(--ink-go, #087f6f); }\n.epic-state-warn { color: var(--ink-warn, #c2410c); }\n.epic-state-muted, .muted { color: var(--ink-faint, #888); }\n.epic-line.warn { color: var(--ink-warn, #c2410c); }\n\n.epic-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 1px 7px;\n  border-radius: 2px;\n  font-size: 11px;\n  line-height: 16px;\n  white-space: nowrap;\n}\n\n.epic-chip .chip-glyph {\n  font-size: 10px;\n}\n\n.epic-chip.tone-blue {\n  background: var(--chip-blue-bg, #e5edf7);\n  color: var(--chip-blue-ink, #1f3b6a);\n}\n.epic-chip.tone-teal {\n  background: var(--chip-teal-bg, #d8f0eb);\n  color: var(--chip-teal-ink, #0c5f54);\n}\n.epic-chip.tone-grey {\n  background: var(--chip-grey-bg, #ececea);\n  color: var(--chip-grey-ink, #4a4a45);\n}\n.epic-chip.compact {\n  padding: 0 6px;\n  font-size: 10.5px;\n}\n\n.epic-meta-time {\n  margin-left: auto;\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n/* \"Routed to\" panel — CUE Project ownership surfaced on the\n * detail page. Same paper-card aesthetic as the progress\n * panel above; owner chips carry classifier-glyph borders\n * so the visual vocabulary matches IssueDetail iter 59. */\n.epic-routed {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-routed-head {\n  display: flex;\n  align-items: baseline;\n  gap: 10px;\n}\n\n.epic-routed-label {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-project {\n  margin-left: auto;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--accent-blue, #1d55a6);\n  text-decoration: none;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-project:hover {\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n\n.epic-routed-list {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-routed-owner {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 2px 8px;\n  border: 1px solid currentColor;\n  color: var(--ink, #111);\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-owner .chip-glyph {\n  font-family: var(--display, system-ui);\n  font-size: 12px;\n  line-height: 1;\n}\n\n.epic-routed-owner[data-author-kind=\"team\"]       { color: var(--accent-teal, #087f6f); }\n.epic-routed-owner[data-author-kind=\"human\"]      { color: var(--ink, #111); }\n.epic-routed-owner[data-author-kind=\"agent\"]      { color: #6b3fa0; }\n.epic-routed-owner[data-author-kind=\"bot\"]        { color: var(--accent-blue, #1d55a6); }\n.epic-routed-owner[data-author-kind=\"credential\"] { color: var(--accent-yellow, #c89300); }\n\n.epic-routed-source {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-source code {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  padding: 0 4px;\n  background: var(--paper-tint, #f2efe7);\n  color: var(--ink-soft, #2c2b28);\n}\n\n.epic-progress-head {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  align-items: baseline;\n  font-size: 12px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-progress-stat {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 4px;\n}\n\n.epic-progress-stat strong {\n  font-weight: 600;\n  color: var(--ink, #1a1a1a);\n  font-size: 15px;\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-progress-stat .stat-of {\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress-stat .stat-label {\n  color: var(--ink-faint, #6e6a62);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-progress-sep {\n  color: var(--ink-rule, #c8c6bf);\n  padding: 0 2px;\n}\n\n.epic-progress-bar {\n  height: 4px;\n  background: var(--ink-rule-soft, #ebe9e2);\n  border-radius: 2px;\n  overflow: hidden;\n}\n\n.epic-progress-fill {\n  height: 100%;\n  background: var(--ink-go, #087f6f);\n  transition: width 200ms ease;\n}\n\n.epic-body {\n  margin: 0;\n  font-size: 15.5px;\n  line-height: 1.6;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-body.muted {\n  padding: 12px 14px;\n  border: 1px dashed var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  color: var(--ink-faint, #888);\n  font-size: 12px;\n  font-family: var(--mono, ui-monospace, monospace);\n}\n\n.epic-body.prose h1,\n.epic-body.prose h2,\n.epic-body.prose h3,\n.epic-body.prose h4 {\n  margin: 16px 0 6px;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  line-height: 1.2;\n  letter-spacing: -0.005em;\n}\n\n.epic-body.prose h1 { font-size: 20px; }\n.epic-body.prose h2 { font-size: 17px; }\n.epic-body.prose h3 { font-size: 15px; }\n\n.epic-body.prose p {\n  margin: 8px 0;\n}\n\n.epic-body.prose ul {\n  margin: 6px 0 6px 20px;\n  padding: 0;\n}\n\n.epic-body.prose li {\n  margin: 2px 0;\n}\n\n.epic-body.prose code {\n  font-family: var(--mono, ui-monospace, monospace);\n  background: var(--ink-rule-soft, #efeee8);\n  padding: 0 4px;\n  border-radius: 2px;\n  font-size: 0.9em;\n}\n\n.epic-body.prose pre {\n  background: var(--surface-2, #f7f6f1);\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  padding: 10px 12px;\n  overflow-x: auto;\n  font-size: 12.5px;\n  font-family: var(--mono, ui-monospace, monospace);\n}\n\n.epic-body.prose pre code {\n  background: transparent;\n  padding: 0;\n}\n\n.epic-section { display: grid; gap: 8px; }\n\n.epic-section-head {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding-bottom: 6px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-section h3 {\n  margin: 0;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  font-size: 13px;\n  letter-spacing: -0.005em;\n}\n\n.epic-section-count {\n  margin-left: auto;\n  font-size: 11px;\n  color: var(--ink-faint, #888);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-section-count [data-zero=\"true\"] { color: var(--ink-rule, #c8c6bf); }\n.epic-section-count .sep { padding: 0 2px; color: var(--ink-rule, #c8c6bf); }\n\n.epic-issues-list {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n}\n\n.epic-issue-row {\n  display: grid;\n  grid-template-columns: 18px 56px 1fr auto;\n  align-items: center;\n  gap: 10px;\n  padding: 6px 8px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n  font-size: 12.5px;\n  cursor: pointer;\n  outline: none;\n}\n\n.epic-issue-row:last-child { border-bottom: none; }\n\n.epic-issue-row:hover,\n.epic-issue-row.focused,\n.epic-issue-row:focus {\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-issue-row .row-state {\n  text-align: center;\n  font-size: 11px;\n}\n\n.epic-issue-row .row-state[data-state=\"OPEN\"],\n.epic-issue-row .row-state[data-state=\"REOPENED\"] {\n  color: var(--ink-go, #087f6f);\n}\n.epic-issue-row .row-state[data-state=\"CLOSED\"] {\n  color: var(--ink-faint, #888);\n}\n\n.epic-issue-row.state-closed {\n  color: var(--ink-faint, #888);\n}\n.epic-issue-row.state-closed .row-title {\n  text-decoration: line-through;\n  text-decoration-color: var(--ink-rule, #c8c6bf);\n}\n\n.epic-issue-row .row-number {\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-issue-row .row-title {\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-size: 13px;\n  color: var(--ink, #1a1a1a);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.epic-issue-row .row-trailing {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: nowrap;\n}\n\n.row-author {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.row-author[data-author-kind=\"agent\"] { color: var(--ink-go, #087f6f); }\n.row-author[data-author-kind=\"credential\"],\n.row-author[data-author-kind=\"bot\"] { color: var(--ink-warn, #c2410c); }\n\n.epic-kbd-hint {\n  margin: 0;\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.epic-kbd-hint kbd {\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10px;\n  padding: 0 4px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-actions-section {\n  display: grid;\n  gap: 8px;\n  padding-top: 12px;\n  border-top: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-actions-heading {\n  margin: 0;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10.5px;\n  letter-spacing: 0.16em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n  font-weight: 500;\n}\n\n.epic-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-actions button {\n  padding: 4px 12px;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 11px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n  color: var(--ink, #1a1a1a);\n  cursor: pointer;\n  letter-spacing: 0.01em;\n}\n\n.epic-actions button:hover:not(:disabled) {\n  background: var(--ink, #1a1a1a);\n  color: var(--surface, #ffffff);\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-actions button:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n";
function dc() {
	if (typeof document > "u" || document.getElementById(lc)) return;
	let e = document.createElement("style");
	e.id = lc, e.textContent = uc, document.head.appendChild(e);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/CustomElementHost.vue
var fc = /* @__PURE__ */ ec(/* @__PURE__ */ yr({
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
		Pr(i), dr(() => [
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
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]), pc = { ownerRefs: [] };
function mc() {
	if (typeof window > "u") return [];
	let e = window.location.pathname;
	if (!e.startsWith("/r/")) return [];
	let t = e.slice(3), n = t.indexOf("/p/");
	return (n >= 0 ? t.slice(0, n) : t).split("/").filter(Boolean).map(decodeURIComponent);
}
async function hc(e) {
	try {
		let t = mc(), n = t.length > 0 ? "query EpicProjectPolicy($segments: [String!]!) {\n          workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n        }" : "query EpicProjectPolicyRepo { repository { comtryaConfig } }", r = t.length > 0 ? { segments: t } : void 0, i = await a().query(n, r);
		return { ownerRefs: (((i.workspace?.repositoryByPath?.comtryaConfig ?? i.repository?.comtryaConfig ?? null)?.projects ?? []).find((t) => t.name === e)?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0) };
	} catch {
		return pc;
	}
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicDetail.vue?vue&type=script&setup=true&lang.ts
var gc = ["data-state", "data-epic-id"], _c = {
	key: 0,
	class: "epic-line muted"
}, vc = {
	key: 1,
	class: "epic-line warn"
}, yc = {
	key: 2,
	class: "epic-line warn"
}, bc = { class: "epic-header" }, xc = { class: "epic-title" }, Sc = { class: "epic-meta" }, Cc = ["title"], wc = {
	key: 1,
	class: "epic-chip tone-grey",
	title: "Owner"
}, Tc = {
	key: 2,
	class: "epic-chip tone-grey"
}, Ec = {
	key: 3,
	class: "epic-meta-time"
}, Dc = {
	key: 0,
	class: "epic-progress",
	"data-smoke": "epic-progress"
}, Oc = { class: "epic-progress-head" }, kc = { class: "epic-progress-stat" }, Ac = { class: "stat-of" }, jc = { class: "epic-progress-stat" }, Mc = {
	key: 0,
	class: "epic-progress-sep"
}, Nc = {
	key: 1,
	class: "epic-progress-stat"
}, Pc = ["aria-valuenow"], Fc = {
	key: 1,
	class: "epic-routed",
	"data-smoke": "epic-project-owners"
}, Ic = { class: "epic-routed-head" }, Lc = ["href", "title"], Rc = { class: "epic-routed-list" }, zc = ["data-author-kind", "title"], Bc = { class: "chip-glyph" }, Vc = { class: "epic-routed-source" }, Hc = ["data-epic-id", "innerHTML"], Uc = {
	key: 3,
	class: "epic-body muted"
}, Wc = {
	class: "epic-section",
	"data-smoke": "epic-issues"
}, Gc = { class: "epic-section-head" }, Kc = { class: "epic-section-count" }, qc = ["data-zero"], Jc = ["data-zero"], Yc = {
	key: 0,
	class: "epic-line muted"
}, Xc = {
	key: 1,
	class: "epic-issues-list",
	"data-smoke": "epic-issues-list"
}, Zc = [
	"onClick",
	"onKeydown",
	"onFocus"
], Qc = ["data-state"], $c = { key: 0 }, el = { key: 1 }, tl = { class: "row-number" }, nl = { class: "row-title" }, rl = { class: "row-trailing" }, il = ["title"], al = ["data-author-kind", "title"], ol = { class: "author-glyph" }, sl = {
	key: 2,
	class: "epic-kbd-hint muted"
}, cl = { class: "epic-actions-section" }, ll = { class: "epic-actions" }, ul = ["disabled", "onClick"], dl = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, fl = { class: "epic-comments" }, pl = /* @__PURE__ */ yr({
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
		], r = /* @__PURE__ */ z("idle"), i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(null), s = /* @__PURE__ */ z(t.epic ?? null), c = /* @__PURE__ */ z(null), l = /* @__PURE__ */ z([]), u = /* @__PURE__ */ z(null), d = $(() => t.client ?? t.comtryaClient), f = $(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3"), p = $(() => t.id ?? t.routeParams?.params?.id ?? ""), m = $(() => t.epic ? Os(t.epic) : `comtrya://epic/${p.value}`), h = $(() => s.value ?? t.epic ?? null), g = $(() => js(h.value?.state)), _ = $(() => n.filter((e) => e !== h.value?.state)), v = $(() => (c.value?.issuesOpen ?? 0) + (c.value?.issuesClosed ?? 0)), y = $(() => Math.max(0, Math.min(100, c.value?.percentComplete ?? 0))), ee = $(() => l.value.filter((e) => e.state !== "CLOSED").length), te = $(() => l.value.filter((e) => e.state === "CLOSED").length), ne = $(() => ls(h.value?.bodyMarkdown ?? "")), re = $(() => d.value && !!p.value), ie = $(() => {
			let e = h.value?.ownerRef;
			return e ? e.startsWith("comtrya://user/") ? e.slice(15) : e.startsWith("comtrya://agent/") ? `${e.slice(16)} (agent)` : e : null;
		}), ae = $(() => S(h.value?.createdAt)), b = /* @__PURE__ */ z(null), oe = $(() => b.value?.ownerRefs ?? []);
		dr(() => h.value?.projectName ?? "", async (e) => {
			if (!e) {
				b.value = null;
				return;
			}
			try {
				b.value = await hc(e);
			} catch {
				b.value = null;
			}
		}, { immediate: !0 });
		function se(e) {
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
		Pr(() => {
			dc(), le();
		});
		let ce = (e) => {
			if (l.value.length === 0) return;
			let t = u.value === null ? 0 : Math.max(0, Math.min(l.value.length - 1, u.value + e));
			u.value = t, qn(() => pe(t));
		};
		ts({
			j: (e) => {
				e.preventDefault(), ce(1);
			},
			ArrowDown: (e) => {
				e.preventDefault(), ce(1);
			},
			k: (e) => {
				e.preventDefault(), ce(-1);
			},
			ArrowUp: (e) => {
				e.preventDefault(), ce(-1);
			},
			Enter: (e) => {
				if (u.value === null) return;
				let t = l.value[u.value];
				t && (e.preventDefault(), fe(t));
			}
		}), dr(() => [
			d.value,
			t.epic,
			f.value,
			p.value
		], () => void le());
		async function le() {
			if (t.epic) {
				s.value = t.epic, r.value = "ready", a.value = null, await x();
				return;
			}
			if (!re.value || !d.value) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = "epic-detail: missing params";
				return;
			}
			r.value = "loading", a.value = null;
			try {
				s.value = await bs(d.value, m.value), r.value = s.value ? "ready" : "empty", await x();
			} catch (e) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function x() {
			if (!d.value || !h.value) {
				c.value = null, l.value = [];
				return;
			}
			let e = Os(h.value), [t, n] = await Promise.allSettled([Ss(d.value, e), Cs(d.value, e)]);
			c.value = t.status === "fulfilled" ? t.value : null, l.value = await sc(n.status === "fulfilled" ? n.value : []), l.value.sort((e, t) => {
				let n = e.state !== "CLOSED";
				return n === (t.state !== "CLOSED") ? (t.number ?? 0) - (e.number ?? 0) : n ? -1 : 1;
			});
		}
		async function ue(e) {
			if (!(!d.value || !h.value)) {
				i.value = "submitting", o.value = null;
				try {
					s.value = await ws(d.value, h.value.id, e), await x();
				} catch (e) {
					o.value = e instanceof Error ? e.message : String(e);
				} finally {
					i.value = "idle";
				}
			}
		}
		function de(e) {
			return e.toLowerCase().replace("_", " ");
		}
		function fe(e) {
			e.href && window.location.assign(e.href);
		}
		function pe(e) {
			let t = document.querySelector(".epic-detail [data-smoke=\"epic-issues-list\"]");
			t && t.querySelectorAll(".epic-issue-row")[e]?.focus();
		}
		function S(e) {
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
		}, [r.value === "loading" ? (K(), q("p", _c, "Loading epic")) : r.value === "error" ? (K(), q("p", vc, M(a.value), 1)) : h.value ? (K(), q(W, { key: 3 }, [
			J("header", bc, [
				t[2] ||= J("p", { class: "epic-overline" }, "epic", -1),
				J("h1", xc, M(h.value.title), 1),
				J("div", Sc, [
					J("span", { class: Je(["epic-pill", g.value.className]) }, M(g.value.label), 3),
					h.value.projectName ? (K(), q("span", {
						key: 0,
						class: "epic-chip tone-blue",
						title: `Scoped to project ${h.value.projectName}`
					}, [t[0] ||= J("span", { class: "chip-glyph" }, "◇", -1), X(M(h.value.projectName), 1)], 8, Cc)) : Z("", !0),
					(K(!0), q(W, null, Wr(h.value.labels, (e) => (K(), q("span", {
						key: e,
						class: "epic-chip tone-teal"
					}, M(e), 1))), 128)),
					ie.value ? (K(), q("span", wc, [t[1] ||= J("span", { class: "chip-glyph" }, "@", -1), X(M(ie.value), 1)])) : Z("", !0),
					h.value.targetDate ? (K(), q("span", Tc, " target " + M(h.value.targetDate), 1)) : Z("", !0),
					ae.value ? (K(), q("span", Ec, "opened " + M(ae.value), 1)) : Z("", !0)
				])
			]),
			c.value || l.value.length > 0 ? (K(), q("section", Dc, [J("div", Oc, [
				J("span", kc, [
					J("strong", null, M(c.value?.issuesClosed ?? te.value), 1),
					J("span", Ac, "/ " + M(v.value || l.value.length), 1),
					t[3] ||= J("span", { class: "stat-label" }, "closed", -1)
				]),
				t[6] ||= J("span", { class: "epic-progress-sep" }, "·", -1),
				J("span", jc, [J("strong", null, M(y.value), 1), t[4] ||= J("span", { class: "stat-label" }, "% complete", -1)]),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (K(), q("span", Mc, "·")) : Z("", !0),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (K(), q("span", Nc, [J("strong", null, M(c.value?.childEpicsOpen ?? 0), 1), t[5] ||= J("span", { class: "stat-label" }, "child epics open", -1)])) : Z("", !0)
			]), J("div", {
				class: "epic-progress-bar",
				"aria-valuenow": y.value,
				"aria-valuemin": "0",
				"aria-valuemax": "100"
			}, [J("div", {
				class: "epic-progress-fill",
				style: Ue({ width: y.value + "%" })
			}, null, 4)], 8, Pc)])) : Z("", !0),
			h.value.projectName && oe.value.length > 0 ? (K(), q("section", Fc, [
				J("header", Ic, [t[7] ||= J("span", { class: "epic-routed-label" }, "Routed to", -1), J("a", {
					href: `/x/epics/?project=${encodeURIComponent(h.value.projectName)}`,
					class: "epic-routed-project",
					title: `Filter epics to project ${h.value.projectName}`
				}, "◇ " + M(h.value.projectName), 9, Lc)]),
				J("ul", Rc, [(K(!0), q(W, null, Wr(oe.value, (e) => (K(), q("li", {
					key: e,
					class: "epic-routed-owner",
					"data-author-kind": se(e).kind,
					title: e
				}, [J("span", Bc, M(se(e).glyph), 1), X(" " + M(se(e).label), 1)], 8, zc))), 128))]),
				J("p", Vc, [
					t[8] ||= X(" From ", -1),
					t[9] ||= J("code", null, "package comtrya", -1),
					X(" · projects." + M(h.value.projectName) + ".owners ", 1)
				])
			])) : Z("", !0),
			ne.value ? (K(), q("article", {
				key: 2,
				class: "epic-body prose",
				"data-epic-id": h.value.id,
				"data-smoke": "epic-detail-main",
				innerHTML: ne.value
			}, null, 8, Hc)) : (K(), q("p", Uc, "No description yet.")),
			J("section", Wc, [
				J("header", Gc, [t[13] ||= J("h3", null, "Issues in this epic", -1), J("span", Kc, [
					J("span", { "data-zero": ee.value === 0 }, M(ee.value), 9, qc),
					t[10] ||= X(" open ", -1),
					t[11] ||= J("span", { class: "sep" }, "·", -1),
					J("span", { "data-zero": te.value === 0 }, M(te.value), 9, Jc),
					t[12] ||= X(" closed ", -1)
				])]),
				l.value.length === 0 ? (K(), q("p", Yc, " No issues linked yet. Link issues via the issue's \"part of epic\" relation. ")) : (K(), q("ul", Xc, [(K(!0), q(W, null, Wr(l.value, (e, n) => (K(), q("li", {
					key: e.ref,
					class: Je(["epic-issue-row", [`state-${e.state.toLowerCase()}`, { focused: u.value === n }]]),
					tabindex: "0",
					onClick: (t) => fe(e),
					onKeydown: [Wo(Ho((t) => fe(e), ["prevent"]), ["enter"]), Wo(Ho((t) => fe(e), ["prevent"]), ["space"])],
					onFocus: (e) => u.value = n
				}, [
					J("span", {
						class: "row-state",
						"data-state": e.state
					}, [e.state === "CLOSED" ? (K(), q("span", $c, "●")) : (K(), q("span", el, "○"))], 8, Qc),
					J("span", tl, "#" + M(e.number ?? "—"), 1),
					J("span", nl, M(e.title), 1),
					J("span", rl, [
						e.projectName ? (K(), q("span", {
							key: 0,
							class: "epic-chip tone-blue compact",
							title: e.projectName
						}, [t[14] ||= J("span", { class: "chip-glyph" }, "◇", -1), X(M(e.projectName), 1)], 8, il)) : Z("", !0),
						(K(!0), q(W, null, Wr(e.labels, (e) => (K(), q("span", {
							key: e,
							class: "epic-chip tone-teal compact"
						}, M(e), 1))), 128)),
						e.authorRef ? (K(), q("span", {
							key: 1,
							class: "row-author",
							"data-author-kind": En(cc)(e.authorRef).kind,
							title: e.authorRef
						}, [J("span", ol, M(En(cc)(e.authorRef).glyph), 1), X(" " + M(En(cc)(e.authorRef).label), 1)], 8, al)) : Z("", !0)
					])
				], 42, Zc))), 128))])),
				l.value.length > 0 ? (K(), q("p", sl, [...t[15] ||= [
					J("kbd", null, "j", -1),
					X(" / ", -1),
					J("kbd", null, "k", -1),
					X(" move · ", -1),
					J("kbd", null, "↵", -1),
					X(" open ", -1)
				]])) : Z("", !0)
			]),
			J("section", cl, [
				t[16] ||= J("h3", { class: "epic-actions-heading" }, "Change state", -1),
				J("div", ll, [(K(!0), q(W, null, Wr(_.value, (e) => (K(), q("button", {
					key: e,
					type: "button",
					disabled: i.value === "submitting",
					onClick: (t) => ue(e)
				}, " mark " + M(de(e)), 9, ul))), 128))]),
				o.value ? (K(), q("p", dl, M(o.value), 1)) : Z("", !0)
			]),
			J("section", fl, [Y(fc, {
				tag: "comtrya-comment-thread",
				attributes: { target: En(Os)(h.value) },
				properties: {
					target: En(Os)(h.value),
					comtryaClient: d.value
				}
			}, null, 8, ["attributes", "properties"])])
		], 64)) : (K(), q("p", yc, " No epic " + M(p.value || "?") + " in " + M(f.value), 1))], 8, gc));
	}
}), ml = ["data-state"], hl = { class: "epics-list-header" }, gl = ["href"], _l = {
	key: 0,
	class: "epics-controls"
}, vl = {
	class: "epics-filter-row",
	role: "tablist",
	"aria-label": "Filter epics by state"
}, yl = ["aria-selected", "onClick"], bl = { class: "count" }, xl = { class: "epics-search" }, Sl = {
	key: 1,
	class: "epics-query-chips",
	"data-smoke": "epics-query-chips",
	"aria-label": "Parsed search filters"
}, Cl = ["title"], wl = {
	key: 2,
	class: "epics-owner-filter",
	"data-smoke": "epics-owner-filter"
}, Tl = ["title"], El = {
	key: 3,
	class: "epics-project-filter",
	"data-smoke": "epics-project-filter"
}, Dl = ["title"], Ol = {
	key: 4,
	class: "epic-line muted"
}, kl = {
	key: 5,
	class: "epic-line warn"
}, Al = {
	key: 6,
	class: "epic-line muted"
}, jl = {
	key: 7,
	class: "epic-line muted"
}, Ml = {
	key: 8,
	class: "epics-list-items"
}, Nl = /* @__PURE__ */ ec(/* @__PURE__ */ yr({
	__name: "EpicsList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epics: { type: [Array, null] },
		workspaceId: {
			default: Es,
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
		]), i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(t.epics ?? []), s = /* @__PURE__ */ z("ALL"), c = /* @__PURE__ */ z(""), l = /* @__PURE__ */ z(""), u = /* @__PURE__ */ z(""), d = $(() => {
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
		}, m = $(() => us(c.value, f)), h = $(() => {
			for (let e of m.value.filters.is ?? []) {
				let t = p[e.toLowerCase()];
				if (t) return t;
			}
			return s.value;
		}), g = $(() => {
			for (let e of m.value.filters.owner ?? []) if (e.startsWith("comtrya://")) return e;
			return l.value;
		}), _ = $(() => {
			if (t.projectName) return "";
			for (let e of m.value.filters.project ?? []) if (e.trim()) return e.trim();
			return u.value;
		}), v = $(() => {
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
		}), y = $(() => {
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
				label: `→ ${ie(t)}`,
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
		function ee(e) {
			l.value === e ? l.value = "" : l.value = e;
		}
		function te() {
			l.value = "";
		}
		function ne(e) {
			u.value === e ? u.value = "" : u.value = e;
		}
		function re() {
			u.value = "";
		}
		function ie(e) {
			return e.replace(/^comtrya:\/\/[a-z]+\//, "");
		}
		let ae = $(() => {
			let e = {
				PLANNED: 0,
				IN_PROGRESS: 0,
				DONE: 0,
				CANCELED: 0,
				ALL: d.value.length
			};
			for (let t of d.value) t.state === "PLANNED" ? e.PLANNED += 1 : t.state === "IN_PROGRESS" ? e.IN_PROGRESS += 1 : t.state === "DONE" ? e.DONE += 1 : t.state === "CANCELED" && (e.CANCELED += 1);
			return e;
		}), b = $(() => t.client ?? t.comtryaClient), oe = $(() => {
			let e = As(t.workspaceId);
			return t.projectName ? `${e}&projectName=${encodeURIComponent(t.projectName)}` : e;
		});
		function se() {
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
		function ce() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			s.value === "ALL" ? e.delete("state") : e.set("state", s.value), l.value ? e.set("owner", l.value) : e.delete("owner"), u.value && !t.projectName ? e.set("project", u.value) : e.delete("project");
			let n = c.value.trim();
			n ? e.set("q", n) : e.delete("q");
			let r = e.toString(), i = `${window.location.pathname}${r ? `?${r}` : ""}${window.location.hash}`;
			i !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", i);
		}
		let le = !1;
		function x() {
			le = !0, se(), qn(() => {
				le = !1;
			});
		}
		Pr(() => {
			le = !0, se(), le = !1, ue(), window.addEventListener("popstate", x);
		}), Rr(() => {
			window.removeEventListener("popstate", x);
		}), dr(() => [
			b.value,
			t.epics,
			t.workspaceId,
			t.state
		], () => void ue()), dr([
			s,
			l,
			u,
			c
		], () => {
			le || ce();
		});
		async function ue() {
			if (t.epics) {
				o.value = t.epics, i.value = t.epics.length > 0 ? "ready" : "empty", a.value = null;
				return;
			}
			if (!b.value) {
				o.value = [], i.value = "error", a.value = "epics: no client";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				o.value = await xs(b.value, {
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
			J("header", hl, [J("h3", null, M(e.title), 1), e.showNewLink ? (K(), q("a", {
				key: 0,
				href: oe.value
			}, "+ new", 8, gl)) : Z("", !0)]),
			d.value.length > 0 ? (K(), q("div", _l, [J("div", vl, [(K(), q(W, null, Wr(n, (e) => J("button", {
				key: e.id,
				type: "button",
				role: "tab",
				"aria-selected": s.value === e.id,
				class: Je(["epics-filter", { active: s.value === e.id }]),
				onClick: (t) => s.value = e.id
			}, [J("span", null, M(e.label), 1), J("span", bl, M(ae.value[e.id]), 1)], 10, yl)), 64))]), J("label", xl, [ar(J("input", {
				"data-epics-search": "",
				"onUpdate:modelValue": o[0] ||= (e) => c.value = e,
				type: "search",
				placeholder: "Filter — try is:in-progress · project:<name> · owner:<urn> · text",
				autocomplete: "off"
			}, null, 512), [[zo, c.value]])])])) : Z("", !0),
			y.value.length > 0 ? (K(), q("div", Sl, [(K(!0), q(W, null, Wr(y.value, (e) => (K(), q("span", {
				key: `${e.key}:${e.value || "unknown"}`,
				class: Je(["query-chip", `tone-${e.tone}`]),
				title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
			}, M(e.label), 11, Cl))), 128)), o[1] ||= J("span", { class: "query-chips-hint" }, [
				X(" syntax: "),
				J("code", null, "is:in-progress"),
				X(" · "),
				J("code", null, "project:<name>"),
				X(" · "),
				J("code", null, "owner:<urn>")
			], -1)])) : Z("", !0),
			l.value ? (K(), q("div", wl, [
				o[2] ||= J("span", { class: "prefix" }, "owner", -1),
				J("span", {
					class: "active-chip",
					title: l.value
				}, M(ie(l.value)), 9, Tl),
				J("button", {
					type: "button",
					class: "clear",
					onClick: te,
					"aria-label": "Clear owner filter"
				}, "clear ✕")
			])) : Z("", !0),
			u.value && !t.projectName ? (K(), q("div", El, [
				o[4] ||= J("span", { class: "prefix" }, "project", -1),
				J("span", {
					class: "active-chip",
					title: `Scoped to project ${u.value}`
				}, [o[3] ||= J("span", { class: "project-glyph" }, "◇", -1), X(" " + M(u.value), 1)], 8, Dl),
				J("button", {
					type: "button",
					class: "clear",
					onClick: re,
					"aria-label": "Clear project filter"
				}, "clear ✕")
			])) : Z("", !0),
			i.value === "loading" ? (K(), q("p", Ol, "Loading epics")) : i.value === "error" ? (K(), q("p", kl, M(a.value), 1)) : d.value.length === 0 ? (K(), q("p", Al, "No epics yet.")) : v.value.length === 0 ? (K(), q("p", jl, " No " + M(s.value.toLowerCase().replace("_", " ")) + " epics in scope. ", 1)) : (K(), q("ul", Ml, [(K(!0), q(W, null, Wr(v.value, (e) => (K(), q("li", { key: e.id }, [Y(tc, {
				epic: e,
				"resource-ref": En(Os)(e),
				client: b.value,
				"active-owner": l.value,
				"active-project": u.value,
				onOwnerClick: ee,
				onProjectClick: ne
			}, null, 8, [
				"epic",
				"resource-ref",
				"client",
				"active-owner",
				"active-project"
			])]))), 128))]))
		], 8, ml));
	}
}), [["styles", [".epics-list[data-v-51147b4d]{gap:8px;display:grid}.epics-list-header[data-v-51147b4d]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.epics-list-header h3[data-v-51147b4d]{font-family:var(--display,system-ui);margin:0;font-size:14px}.epics-list-header a[data-v-51147b4d],.epic-line[data-v-51147b4d]{font-family:var(--mono,monospace);font-size:12px}.epics-list-header a[data-v-51147b4d]{color:var(--ink-faint,#888);text-decoration:none}.epics-controls[data-v-51147b4d]{flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:4px;display:flex}.epics-search[data-v-51147b4d]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper,#fffdf8);flex:280px;align-items:center;gap:6px;padding:0 8px;display:inline-flex}.epics-search input[data-v-51147b4d]{font-family:var(--mono,monospace);color:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0;padding:6px 0;font-size:12px}.epics-search input[data-v-51147b4d]::placeholder{color:var(--ink-faint,#68645c)}.epics-query-chips[data-v-51147b4d]{font-family:var(--mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:4px;font-size:11px;display:flex}.epics-query-chips .query-chip[data-v-51147b4d]{letter-spacing:.02em;white-space:nowrap;border:1px solid;align-items:center;padding:1px 7px;display:inline-flex}.epics-query-chips .query-chip.tone-is[data-v-51147b4d]{color:var(--accent-teal,#087f6f)}.epics-query-chips .query-chip.tone-owner[data-v-51147b4d]{color:var(--ink,#111)}.epics-query-chips .query-chip.tone-project[data-v-51147b4d]{color:var(--accent-blue,#1d55a6)}.epics-query-chips .query-chip.tone-unknown[data-v-51147b4d]{color:var(--accent-yellow,#c89300);border-style:dashed}.epics-query-chips .query-chips-hint[data-v-51147b4d]{color:var(--ink-faint,#68645c);letter-spacing:0;margin-left:4px}.epics-query-chips .query-chips-hint code[data-v-51147b4d]{font-family:var(--mono,monospace);background:var(--paper-tint,#f2efe7);color:var(--ink-soft,#2c2b28);padding:0 4px;font-size:11px}.epics-filter-row[data-v-51147b4d]{border:1px solid var(--ink,#111);flex-wrap:wrap;align-self:flex-start;gap:0;display:inline-flex}.epics-filter[data-v-51147b4d]{color:inherit;cursor:pointer;font-family:var(--mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:4px 9px;font-size:11px;display:inline-flex}.epics-filter[data-v-51147b4d]:not(:last-child){border-right:1px solid var(--rule-light,#d8d1c4)}.epics-filter.active[data-v-51147b4d]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.epics-filter .count[data-v-51147b4d]{color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums}.epics-filter.active .count[data-v-51147b4d]{color:var(--paper-tint,#f2efe7)}.epics-owner-filter[data-v-51147b4d]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-owner-filter .prefix[data-v-51147b4d]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.epics-owner-filter .active-chip[data-v-51147b4d]{border:1px solid var(--ink,#111);color:var(--ink,#111);padding:0 5px}.epics-owner-filter .clear[data-v-51147b4d]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-owner-filter .clear[data-v-51147b4d]:hover{color:var(--ink,#111)}.epics-project-filter[data-v-51147b4d]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-project-filter .prefix[data-v-51147b4d]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.epics-project-filter .active-chip[data-v-51147b4d]{color:var(--accent-blue,#1d55a6);border:1px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.epics-project-filter .project-glyph[data-v-51147b4d]{font-size:10px}.epics-project-filter .clear[data-v-51147b4d]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-project-filter .clear[data-v-51147b4d]:hover{color:var(--ink,#111)}.epics-list-items[data-v-51147b4d]{gap:8px;margin:0;padding:0;list-style:none;display:grid}.epic-line[data-v-51147b4d]{margin:4px 0}.muted[data-v-51147b4d]{color:var(--ink-faint,#888)}.warn[data-v-51147b4d]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-51147b4d"]]), Pl = "epics", Fl = "ext_epics", Il = "comtrya-epic-card", Ll = "comtrya-epics-board", Rl = "comtrya-epics-index", zl = "comtrya-epic-detail", Bl = "comtrya-epic-new";
ds({
	tagName: Il,
	component: tc,
	propertyAliases: { ref: "resourceRef" }
}), ds({
	tagName: Ll,
	component: Nl
}), ds({
	tagName: Rl,
	component: Nl
}), ds({
	tagName: zl,
	component: pl
}), Hl();
var Vl = {
	id: Fl,
	setup(e) {
		e.registerCard({
			resourceKind: "epic",
			element: Il,
			requiredPermission: "epics.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "epic",
			loadTargets: async (t) => (await xs(e.client, { workspaceId: t.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3" })).map((e) => ({
				ref: Os(e),
				kind: "epic",
				title: e.title,
				subtitle: e.state.toLowerCase().replace(/_/g, " ")
			}))
		}), e.registerWidget({
			id: "epics-board",
			element: Ll,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "epics.read"
		}), e.registerRoute("/", {
			element: Rl,
			requiredPermission: "epics.read"
		}), e.registerRoute("/new", {
			element: Bl,
			requiredPermission: "epics.write"
		}), e.registerRoute("/:workspaceId/:id", {
			element: zl,
			requiredPermission: "epics.read"
		}), Rs(e.client);
	}
};
function Hl() {
	typeof customElements > "u" || customElements.get(Bl) || customElements.define(Bl, class extends HTMLElement {
		routeParams;
		connectedCallback() {
			let e = Ul(this.routeParams);
			this.replaceChildren(Wl(e));
		}
	});
}
function Ul(e) {
	let t = new URLSearchParams(window.location.search);
	return {
		workspaceId: t.get("workspaceId") ?? e?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
		projectName: t.get("projectName") ?? e?.params?.projectName ?? null
	};
}
function Wl(e) {
	let t = document.createElement("main");
	t.className = "epic-new", t.dataset.smoke = "epic-new";
	let n = document.createElement("h3");
	n.textContent = e.projectName ? `New epic in ${e.projectName}` : "New epic";
	let r = document.createElement("form"), i = document.createElement("input");
	i.required = !0, i.placeholder = "Epic title";
	let a = document.createElement("textarea");
	a.rows = 5, a.placeholder = "Description (optional)";
	let o = document.createElement("button");
	o.type = "submit", o.textContent = "Create epic";
	let s = Gl("", "warn");
	return s.setAttribute("role", "alert"), s.hidden = !0, r.append(i, a, o, s), r.addEventListener("submit", (t) => {
		t.preventDefault(), o.disabled = !0, s.hidden = !0, Ts(void 0, {
			workspaceId: e.workspaceId,
			projectName: e.projectName,
			title: i.value.trim(),
			bodyMarkdown: a.value
		}).then((e) => {
			window.location.assign(l(Pl, `/${e.workspaceId}/${e.id}`));
		}).catch((e) => {
			s.textContent = e instanceof Error ? e.message : String(e), s.hidden = !1, o.disabled = !1;
		});
	}), t.append(n, r), t;
}
function Gl(e, t) {
	let n = document.createElement("p");
	return n.className = `epic-line ${t}`, n.textContent = e, n;
}
//#endregion
export { Vl as default };
