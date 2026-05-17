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
var S = {}, C = [], w = () => {}, me = () => !1, he = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), T = (e) => e.startsWith("onUpdate:"), E = Object.assign, ge = (e, t) => {
	let n = e.indexOf(t);
	n > -1 && e.splice(n, 1);
}, _e = Object.prototype.hasOwnProperty, D = (e, t) => _e.call(e, t), O = Array.isArray, k = (e) => Ce(e) === "[object Map]", ve = (e) => Ce(e) === "[object Set]", ye = (e) => Ce(e) === "[object Date]", A = (e) => typeof e == "function", j = (e) => typeof e == "string", be = (e) => typeof e == "symbol", M = (e) => typeof e == "object" && !!e, xe = (e) => (M(e) || A(e)) && A(e.then) && A(e.catch), Se = Object.prototype.toString, Ce = (e) => Se.call(e), we = (e) => Ce(e).slice(8, -1), Te = (e) => Ce(e) === "[object Object]", Ee = (e) => j(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, De = /* @__PURE__ */ pe(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"), Oe = (e) => {
	let t = /* @__PURE__ */ Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, ke = /-\w/g, N = Oe((e) => e.replace(ke, (e) => e.slice(1).toUpperCase())), Ae = /\B([A-Z])/g, P = Oe((e) => e.replace(Ae, "-$1").toLowerCase()), je = Oe((e) => e.charAt(0).toUpperCase() + e.slice(1)), Me = Oe((e) => e ? `on${je(e)}` : ""), Ne = (e, t) => !Object.is(e, t), Pe = (e, ...t) => {
	for (let n = 0; n < e.length; n++) e[n](...t);
}, Fe = (e, t, n, r = !1) => {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		writable: r,
		value: n
	});
}, Ie = (e) => {
	let t = parseFloat(e);
	return isNaN(t) ? e : t;
}, Le = (e) => {
	let t = j(e) ? Number(e) : NaN;
	return isNaN(t) ? e : t;
}, Re, ze = () => Re ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function Be(e) {
	if (O(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = j(r) ? We(r) : Be(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (j(e) || M(e)) return e;
}
var Ve = /;(?![^(]*\))/g, He = /:([^]+)/, Ue = /\/\*[^]*?\*\//g;
function We(e) {
	let t = {};
	return e.replace(Ue, "").split(Ve).forEach((e) => {
		if (e) {
			let n = e.split(He);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function Ge(e) {
	let t = "";
	if (j(e)) t = e;
	else if (O(e)) for (let n = 0; n < e.length; n++) {
		let r = Ge(e[n]);
		r && (t += r + " ");
	}
	else if (M(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var Ke = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", qe = /* @__PURE__ */ pe(Ke);
Ke + "";
function Je(e) {
	return !!e || e === "";
}
function Ye(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = Xe(e[r], t[r]);
	return n;
}
function Xe(e, t) {
	if (e === t) return !0;
	let n = ye(e), r = ye(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = be(e), r = be(t), n || r) return e === t;
	if (n = O(e), r = O(t), n || r) return n && r ? Ye(e, t) : !1;
	if (n = M(e), r = M(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !Xe(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
var Ze = (e) => !!(e && e.__v_isRef === !0), F = (e) => j(e) ? e : e == null ? "" : O(e) || M(e) && (e.toString === Se || !A(e.toString)) ? Ze(e) ? F(e.value) : JSON.stringify(e, Qe, 2) : String(e), Qe = (e, t) => Ze(t) ? Qe(e, t.value) : k(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[$e(t, r) + " =>"] = n, e), {}) } : ve(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => $e(e)) } : be(t) ? $e(t) : M(t) && !O(t) && !Te(t) ? String(t) : t, $e = (e, t = "") => be(e) ? `Symbol(${e.description ?? t})` : e, I, et = class {
	constructor(e = !1) {
		this.detached = e, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !e && I && (I.active ? (this.parent = I, this.index = (I.scopes ||= []).push(this) - 1) : (this._active = !1, this._warnOnRun = !1));
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
			let t = I;
			try {
				return I = this, e();
			} finally {
				I = t;
			}
		}
	}
	on() {
		++this._on === 1 && (this.prevScope = I, I = this);
	}
	off() {
		if (this._on > 0 && --this._on === 0) {
			if (I === this) I = this.prevScope;
			else {
				let e = I;
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
function tt() {
	return I;
}
var L, nt = /* @__PURE__ */ new WeakSet(), rt = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, I && (I.active ? I.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, nt.has(this) && (nt.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || st(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, bt(this), ut(this);
		let e = L, t = gt;
		L = this, gt = !0;
		try {
			return this.fn();
		} finally {
			dt(this), L = e, gt = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) mt(e);
			this.deps = this.depsTail = void 0, bt(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? nt.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		ft(this) && this.run();
	}
	get dirty() {
		return ft(this);
	}
}, it = 0, at, ot;
function st(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = ot, ot = e;
		return;
	}
	e.next = at, at = e;
}
function ct() {
	it++;
}
function lt() {
	if (--it > 0) return;
	if (ot) {
		let e = ot;
		for (ot = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; at;) {
		let t = at;
		for (at = void 0; t;) {
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
function ut(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function dt(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), mt(r), ht(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function ft(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (pt(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function pt(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === xt) || (e.globalVersion = xt, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !ft(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = L, r = gt;
	L = e, gt = !0;
	try {
		ut(e);
		let n = e.fn(e._value);
		(t.version === 0 || Ne(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		L = n, gt = r, dt(e), e.flags &= -3;
	}
}
function mt(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) mt(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function ht(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var gt = !0, _t = [];
function vt() {
	_t.push(gt), gt = !1;
}
function yt() {
	let e = _t.pop();
	gt = e === void 0 ? !0 : e;
}
function bt(e) {
	let { cleanup: t } = e;
	if (e.cleanup = void 0, t) {
		let e = L;
		L = void 0;
		try {
			t();
		} finally {
			L = e;
		}
	}
}
var xt = 0, St = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, Ct = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!L || !gt || L === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== L) t = this.activeLink = new St(L, this), L.deps ? (t.prevDep = L.depsTail, L.depsTail.nextDep = t, L.depsTail = t) : L.deps = L.depsTail = t, wt(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = L.depsTail, t.nextDep = void 0, L.depsTail.nextDep = t, L.depsTail = t, L.deps === t && (L.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, xt++, this.notify(e);
	}
	notify(e) {
		ct();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			lt();
		}
	}
};
function wt(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) wt(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var Tt = /* @__PURE__ */ new WeakMap(), Et = /* @__PURE__ */ Symbol(""), Dt = /* @__PURE__ */ Symbol(""), Ot = /* @__PURE__ */ Symbol("");
function R(e, t, n) {
	if (gt && L) {
		let t = Tt.get(e);
		t || Tt.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new Ct()), r.map = t, r.key = n), r.track();
	}
}
function kt(e, t, n, r, i, a) {
	let o = Tt.get(e);
	if (!o) {
		xt++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (ct(), t === "clear") o.forEach(s);
	else {
		let i = O(e), a = i && Ee(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === Ot || !be(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(Ot)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(Et)), k(e) && s(o.get(Dt)));
				break;
			case "delete":
				i || (s(o.get(Et)), k(e) && s(o.get(Dt)));
				break;
			case "set":
				k(e) && s(o.get(Et));
				break;
		}
	}
	lt();
}
function At(e) {
	let t = /* @__PURE__ */ z(e);
	return t === e ? t : (R(t, "iterate", Ot), /* @__PURE__ */ _n(e) ? t : t.map(bn));
}
function jt(e) {
	return R(e = /* @__PURE__ */ z(e), "iterate", Ot), e;
}
function Mt(e, t) {
	return /* @__PURE__ */ gn(e) ? xn(/* @__PURE__ */ hn(e) ? bn(t) : t) : bn(t);
}
var Nt = {
	__proto__: null,
	[Symbol.iterator]() {
		return Pt(this, Symbol.iterator, (e) => Mt(this, e));
	},
	concat(...e) {
		return At(this).concat(...e.map((e) => O(e) ? At(e) : e));
	},
	entries() {
		return Pt(this, "entries", (e) => (e[1] = Mt(this, e[1]), e));
	},
	every(e, t) {
		return It(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return It(this, "filter", e, t, (e) => e.map((e) => Mt(this, e)), arguments);
	},
	find(e, t) {
		return It(this, "find", e, t, (e) => Mt(this, e), arguments);
	},
	findIndex(e, t) {
		return It(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return It(this, "findLast", e, t, (e) => Mt(this, e), arguments);
	},
	findLastIndex(e, t) {
		return It(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return It(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return Rt(this, "includes", e);
	},
	indexOf(...e) {
		return Rt(this, "indexOf", e);
	},
	join(e) {
		return At(this).join(e);
	},
	lastIndexOf(...e) {
		return Rt(this, "lastIndexOf", e);
	},
	map(e, t) {
		return It(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return zt(this, "pop");
	},
	push(...e) {
		return zt(this, "push", e);
	},
	reduce(e, ...t) {
		return Lt(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return Lt(this, "reduceRight", e, t);
	},
	shift() {
		return zt(this, "shift");
	},
	some(e, t) {
		return It(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return zt(this, "splice", e);
	},
	toReversed() {
		return At(this).toReversed();
	},
	toSorted(e) {
		return At(this).toSorted(e);
	},
	toSpliced(...e) {
		return At(this).toSpliced(...e);
	},
	unshift(...e) {
		return zt(this, "unshift", e);
	},
	values() {
		return Pt(this, "values", (e) => Mt(this, e));
	}
};
function Pt(e, t, n) {
	let r = jt(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ _n(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var Ft = Array.prototype;
function It(e, t, n, r, i, a) {
	let o = jt(e), s = o !== e && !/* @__PURE__ */ _n(e), c = o[t];
	if (c !== Ft[t]) {
		let t = c.apply(e, a);
		return s ? bn(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, Mt(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function Lt(e, t, n, r) {
	let i = jt(e), a = i !== e && !/* @__PURE__ */ _n(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = Mt(e, t)), n.call(this, t, Mt(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? Mt(e, c) : c;
}
function Rt(e, t, n) {
	let r = /* @__PURE__ */ z(e);
	R(r, "iterate", Ot);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ vn(n[0]) ? (n[0] = /* @__PURE__ */ z(n[0]), r[t](...n)) : i;
}
function zt(e, t, n = []) {
	vt(), ct();
	let r = (/* @__PURE__ */ z(e))[t].apply(e, n);
	return lt(), yt(), r;
}
var Bt = /* @__PURE__ */ pe("__proto__,__v_isRef,__isVue"), Vt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(be));
function Ht(e) {
	be(e) || (e = String(e));
	let t = /* @__PURE__ */ z(this);
	return R(t, "has", e), t.hasOwnProperty(e);
}
var Ut = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? cn : sn : i ? on : an).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = O(e);
		if (!r) {
			let e;
			if (a && (e = Nt[t])) return e;
			if (t === "hasOwnProperty") return Ht;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ B(e) ? e : n);
		if ((be(t) ? Vt.has(t) : Bt(t)) || (r || R(e, "get", t), i)) return o;
		if (/* @__PURE__ */ B(o)) {
			let e = a && Ee(t) ? o : o.value;
			return r && M(e) ? /* @__PURE__ */ pn(e) : e;
		}
		return M(o) ? r ? /* @__PURE__ */ pn(o) : /* @__PURE__ */ dn(o) : o;
	}
}, Wt = class extends Ut {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = O(e) && Ee(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ gn(i);
			if (!/* @__PURE__ */ _n(n) && !/* @__PURE__ */ gn(n) && (i = /* @__PURE__ */ z(i), n = /* @__PURE__ */ z(n)), !a && /* @__PURE__ */ B(i) && !/* @__PURE__ */ B(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : D(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ B(e) ? e : r);
		return e === /* @__PURE__ */ z(r) && (o ? Ne(n, i) && kt(e, "set", t, n, i) : kt(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = D(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && kt(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!be(t) || !Vt.has(t)) && R(e, "has", t), n;
	}
	ownKeys(e) {
		return R(e, "iterate", O(e) ? "length" : Et), Reflect.ownKeys(e);
	}
}, Gt = class extends Ut {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, Kt = /* @__PURE__ */ new Wt(), qt = /* @__PURE__ */ new Gt(), Jt = /* @__PURE__ */ new Wt(!0), Yt = (e) => e, Xt = (e) => Reflect.getPrototypeOf(e);
function Zt(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ z(i), o = k(a), s = e === "entries" || e === Symbol.iterator && o, c = e === "keys" && o, l = i[e](...r), u = n ? Yt : t ? xn : bn;
		return !t && R(a, "iterate", c ? Dt : Et), E(Object.create(l), { next() {
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
function Qt(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function $t(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ z(r), a = /* @__PURE__ */ z(n);
			e || (Ne(n, a) && R(i, "get", n), R(i, "get", a));
			let { has: o } = Xt(i), s = t ? Yt : e ? xn : bn;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && R(/* @__PURE__ */ z(t), "iterate", Et), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ z(n), i = /* @__PURE__ */ z(t);
			return e || (Ne(t, i) && R(r, "has", t), R(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ z(a), s = t ? Yt : e ? xn : bn;
			return !e && R(o, "iterate", Et), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return E(n, e ? {
		add: Qt("add"),
		set: Qt("set"),
		delete: Qt("delete"),
		clear: Qt("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ z(this), r = Xt(n), i = /* @__PURE__ */ z(e), a = !t && !/* @__PURE__ */ _n(e) && !/* @__PURE__ */ gn(e) ? i : e;
			return r.has.call(n, a) || Ne(e, a) && r.has.call(n, e) || Ne(i, a) && r.has.call(n, i) || (n.add(a), kt(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ _n(n) && !/* @__PURE__ */ gn(n) && (n = /* @__PURE__ */ z(n));
			let r = /* @__PURE__ */ z(this), { has: i, get: a } = Xt(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ z(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? Ne(n, s) && kt(r, "set", e, n, s) : kt(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ z(this), { has: n, get: r } = Xt(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ z(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && kt(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ z(this), t = e.size !== 0, n = e.clear();
			return t && kt(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = Zt(r, e, t);
	}), n;
}
function en(e, t) {
	let n = $t(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(D(n, r) && r in t ? n : t, r, i);
}
var tn = { get: /* @__PURE__ */ en(!1, !1) }, nn = { get: /* @__PURE__ */ en(!1, !0) }, rn = { get: /* @__PURE__ */ en(!0, !1) }, an = /* @__PURE__ */ new WeakMap(), on = /* @__PURE__ */ new WeakMap(), sn = /* @__PURE__ */ new WeakMap(), cn = /* @__PURE__ */ new WeakMap();
function ln(e) {
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
function un(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : ln(we(e));
}
/* @__NO_SIDE_EFFECTS__ */
function dn(e) {
	return /* @__PURE__ */ gn(e) ? e : mn(e, !1, Kt, tn, an);
}
/* @__NO_SIDE_EFFECTS__ */
function fn(e) {
	return mn(e, !1, Jt, nn, on);
}
/* @__NO_SIDE_EFFECTS__ */
function pn(e) {
	return mn(e, !0, qt, rn, sn);
}
function mn(e, t, n, r, i) {
	if (!M(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = un(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function hn(e) {
	return /* @__PURE__ */ gn(e) ? /* @__PURE__ */ hn(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function gn(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function _n(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function vn(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function z(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ z(t) : e;
}
function yn(e) {
	return !D(e, "__v_skip") && Object.isExtensible(e) && Fe(e, "__v_skip", !0), e;
}
var bn = (e) => M(e) ? /* @__PURE__ */ dn(e) : e, xn = (e) => M(e) ? /* @__PURE__ */ pn(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function B(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function V(e) {
	return Sn(e, !1);
}
function Sn(e, t) {
	return /* @__PURE__ */ B(e) ? e : new Cn(e, t);
}
var Cn = class {
	constructor(e, t) {
		this.dep = new Ct(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ z(e), this._value = t ? e : bn(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ _n(e) || /* @__PURE__ */ gn(e);
		e = n ? e : /* @__PURE__ */ z(e), Ne(e, t) && (this._rawValue = e, this._value = n ? e : bn(e), this.dep.trigger());
	}
};
function H(e) {
	return /* @__PURE__ */ B(e) ? e.value : e;
}
var wn = {
	get: (e, t, n) => t === "__v_raw" ? e : H(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ B(i) && !/* @__PURE__ */ B(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Tn(e) {
	return /* @__PURE__ */ hn(e) ? e : new Proxy(e, wn);
}
var En = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new Ct(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = xt - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && L !== this) return st(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return pt(this), e && (e.version = this.dep.version), this._value;
	}
	set value(e) {
		this.setter && this.setter(e);
	}
};
/* @__NO_SIDE_EFFECTS__ */
function Dn(e, t, n = !1) {
	let r, i;
	return A(e) ? r = e : (r = e.get, i = e.set), new En(r, i, n);
}
var On = {}, kn = /* @__PURE__ */ new WeakMap(), An = void 0;
function jn(e, t = !1, n = An) {
	if (n) {
		let t = kn.get(n);
		t || kn.set(n, t = []), t.push(e);
	}
}
function Mn(e, t, n = S) {
	let { immediate: r, deep: i, once: a, scheduler: o, augmentJob: s, call: c } = n, l = (e) => i ? e : /* @__PURE__ */ _n(e) || i === !1 || i === 0 ? Nn(e, 1) : Nn(e), u, d, f, p, m = !1, h = !1;
	if (/* @__PURE__ */ B(e) ? (d = () => e.value, m = /* @__PURE__ */ _n(e)) : /* @__PURE__ */ hn(e) ? (d = () => l(e), m = !0) : O(e) ? (h = !0, m = e.some((e) => /* @__PURE__ */ hn(e) || /* @__PURE__ */ _n(e)), d = () => e.map((e) => {
		if (/* @__PURE__ */ B(e)) return e.value;
		if (/* @__PURE__ */ hn(e)) return l(e);
		if (A(e)) return c ? c(e, 2) : e();
	})) : d = A(e) ? t ? c ? () => c(e, 2) : e : () => {
		if (f) {
			vt();
			try {
				f();
			} finally {
				yt();
			}
		}
		let t = An;
		An = u;
		try {
			return c ? c(e, 3, [p]) : e(p);
		} finally {
			An = t;
		}
	} : w, t && i) {
		let e = d, t = i === !0 ? Infinity : i;
		d = () => Nn(e(), t);
	}
	let g = tt(), _ = () => {
		u.stop(), g && g.active && ge(g.effects, u);
	};
	if (a && t) {
		let e = t;
		t = (...t) => {
			e(...t), _();
		};
	}
	let v = h ? Array(e.length).fill(On) : On, y = (e) => {
		if (!(!(u.flags & 1) || !u.dirty && !e)) if (t) {
			let e = u.run();
			if (i || m || (h ? e.some((e, t) => Ne(e, v[t])) : Ne(e, v))) {
				f && f();
				let n = An;
				An = u;
				try {
					let n = [
						e,
						v === On ? void 0 : h && v[0] === On ? [] : v,
						p
					];
					v = e, c ? c(t, 3, n) : t(...n);
				} finally {
					An = n;
				}
			}
		} else u.run();
	};
	return s && s(y), u = new rt(d), u.scheduler = o ? () => o(y, !1) : y, p = (e) => jn(e, !1, u), f = u.onStop = () => {
		let e = kn.get(u);
		if (e) {
			if (c) c(e, 4);
			else for (let t of e) t();
			kn.delete(u);
		}
	}, t ? r ? y(!0) : v = u.run() : o ? o(y.bind(null, !0), !0) : u.run(), _.pause = u.pause.bind(u), _.resume = u.resume.bind(u), _.stop = _, _;
}
function Nn(e, t = Infinity, n) {
	if (t <= 0 || !M(e) || e.__v_skip || (n ||= /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t)) return e;
	if (n.set(e, t), t--, /* @__PURE__ */ B(e)) Nn(e.value, t, n);
	else if (O(e)) for (let r = 0; r < e.length; r++) Nn(e[r], t, n);
	else if (ve(e) || k(e)) e.forEach((e) => {
		Nn(e, t, n);
	});
	else if (Te(e)) {
		for (let r in e) Nn(e[r], t, n);
		for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && Nn(e[r], t, n);
	}
	return e;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.34/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function Pn(e, t, n, r) {
	try {
		return r ? e(...r) : e();
	} catch (e) {
		In(e, t, n);
	}
}
function Fn(e, t, n, r) {
	if (A(e)) {
		let i = Pn(e, t, n, r);
		return i && xe(i) && i.catch((e) => {
			In(e, t, n);
		}), i;
	}
	if (O(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(Fn(e[a], t, n, r));
		return i;
	}
}
function In(e, t, n, r = !0) {
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
			vt(), Pn(a, null, 10, [
				e,
				i,
				o
			]), yt();
			return;
		}
	}
	Ln(e, n, i, r, o);
}
function Ln(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var U = [], Rn = -1, zn = [], Bn = null, Vn = 0, Hn = /* @__PURE__ */ Promise.resolve(), Un = null;
function Wn(e) {
	let t = Un || Hn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function Gn(e) {
	let t = Rn + 1, n = U.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = U[r], a = Zn(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function Kn(e) {
	if (!(e.flags & 1)) {
		let t = Zn(e), n = U[U.length - 1];
		!n || !(e.flags & 2) && t >= Zn(n) ? U.push(e) : U.splice(Gn(t), 0, e), e.flags |= 1, qn();
	}
}
function qn() {
	Un ||= Hn.then(Qn);
}
function Jn(e) {
	O(e) ? zn.push(...e) : Bn && e.id === -1 ? Bn.splice(Vn + 1, 0, e) : e.flags & 1 || (zn.push(e), e.flags |= 1), qn();
}
function Yn(e, t, n = Rn + 1) {
	for (; n < U.length; n++) {
		let t = U[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			U.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function Xn(e) {
	if (zn.length) {
		let e = [...new Set(zn)].sort((e, t) => Zn(e) - Zn(t));
		if (zn.length = 0, Bn) {
			Bn.push(...e);
			return;
		}
		for (Bn = e, Vn = 0; Vn < Bn.length; Vn++) {
			let e = Bn[Vn];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		Bn = null, Vn = 0;
	}
}
var Zn = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function Qn(e) {
	try {
		for (Rn = 0; Rn < U.length; Rn++) {
			let e = U[Rn];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), Pn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; Rn < U.length; Rn++) {
			let e = U[Rn];
			e && (e.flags &= -2);
		}
		Rn = -1, U.length = 0, Xn(e), Un = null, (U.length || zn.length) && Qn(e);
	}
}
var $n = null, er = null;
function tr(e) {
	let t = $n;
	return $n = e, er = e && e.type.__scopeId || null, t;
}
function nr(e, t = $n, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && sa(-1);
		let i = tr(t), a;
		try {
			a = e(...n);
		} finally {
			tr(i), r._d && sa(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function rr(e, t) {
	if ($n === null) return e;
	let n = Va($n), r = e.dirs ||= [];
	for (let e = 0; e < t.length; e++) {
		let [i, a, o, s = S] = t[e];
		i && (A(i) && (i = {
			mounted: i,
			updated: i
		}), i.deep && Nn(a), r.push({
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
function ir(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (vt(), Fn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), yt());
	}
}
function ar(e, t) {
	if (Q) {
		let n = Q.provides, r = Q.parent && Q.parent.provides;
		r === n && (n = Q.provides = Object.create(r)), n[e] = t;
	}
}
function or(e, t, n = !1) {
	let r = Ea();
	if (r || di) {
		let i = di ? di._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && A(t) ? t.call(r && r.proxy) : t;
	}
}
var sr = /* @__PURE__ */ Symbol.for("v-scx"), cr = () => or(sr);
function lr(e, t, n) {
	return ur(e, t, n);
}
function ur(e, t, n = S) {
	let { immediate: r, deep: i, flush: a, once: o } = n, s = E({}, n), c = t && r || !t && a !== "post", l;
	if (Ma) {
		if (a === "sync") {
			let e = cr();
			l = e.__watcherHandles ||= [];
		} else if (!c) {
			let e = () => {};
			return e.stop = w, e.resume = w, e.pause = w, e;
		}
	}
	let u = Q;
	s.call = (e, t, n) => Fn(e, u, t, n);
	let d = !1;
	a === "post" ? s.scheduler = (e) => {
		G(e, u && u.suspense);
	} : a !== "sync" && (d = !0, s.scheduler = (e, t) => {
		t ? e() : Kn(e);
	}), s.augmentJob = (e) => {
		t && (e.flags |= 4), d && (e.flags |= 2, u && (e.id = u.uid, e.i = u));
	};
	let f = Mn(e, t, s);
	return Ma && (l ? l.push(f) : c && f()), f;
}
function dr(e, t, n) {
	let r = this.proxy, i = j(e) ? e.includes(".") ? fr(r, e) : () => r[e] : e.bind(r, r), a;
	A(t) ? a = t : (a = t.handler, n = t);
	let o = ka(this), s = ur(i, a.bind(r), n);
	return o(), s;
}
function fr(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var pr = /* @__PURE__ */ Symbol("_vte"), mr = (e) => e.__isTeleport, hr = /* @__PURE__ */ Symbol("_leaveCb");
function gr(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, gr(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function _r(e, t) {
	return A(e) ? E({ name: e.name }, t, { setup: e }) : e;
}
function vr(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function yr(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var br = /* @__PURE__ */ new WeakMap();
function xr(e, t, n, r, i = !1) {
	if (O(e)) {
		e.forEach((e, a) => xr(e, t && (O(t) ? t[a] : t), n, r, i));
		return;
	}
	if (Cr(r) && !i) {
		r.shapeFlag & 512 && r.type.__asyncResolved && r.component.subTree.component && xr(e, t, n, r.component.subTree);
		return;
	}
	let a = r.shapeFlag & 4 ? Va(r.component) : r.el, o = i ? null : a, { i: s, r: c } = e, l = t && t.r, u = s.refs === S ? s.refs = {} : s.refs, d = s.setupState, f = /* @__PURE__ */ z(d), p = d === S ? me : (e) => yr(u, e) ? !1 : D(f, e), m = (e, t) => !(t && yr(u, t));
	if (l != null && l !== c) {
		if (Sr(t), j(l)) u[l] = null, p(l) && (d[l] = null);
		else if (/* @__PURE__ */ B(l)) {
			let e = t;
			m(l, e.k) && (l.value = null), e.k && (u[e.k] = null);
		}
	}
	if (A(c)) Pn(c, s, 12, [o, u]);
	else {
		let t = j(c), r = /* @__PURE__ */ B(c);
		if (t || r) {
			let s = () => {
				if (e.f) {
					let n = t ? p(c) ? d[c] : u[c] : m(c) || !e.k ? c.value : u[e.k];
					if (i) O(n) && ge(n, a);
					else if (O(n)) n.includes(a) || n.push(a);
					else if (t) u[c] = [a], p(c) && (d[c] = u[c]);
					else {
						let t = [a];
						m(c, e.k) && (c.value = t), e.k && (u[e.k] = t);
					}
				} else t ? (u[c] = o, p(c) && (d[c] = o)) : r && (m(c, e.k) && (c.value = o), e.k && (u[e.k] = o));
			};
			if (o) {
				let t = () => {
					s(), br.delete(e);
				};
				t.id = -1, br.set(e, t), G(t, n);
			} else Sr(e), s();
		}
	}
}
function Sr(e) {
	let t = br.get(e);
	t && (t.flags |= 8, br.delete(e));
}
ze().requestIdleCallback, ze().cancelIdleCallback;
var Cr = (e) => !!e.type.__asyncLoader, wr = (e) => e.type.__isKeepAlive;
function Tr(e, t) {
	Dr(e, "a", t);
}
function Er(e, t) {
	Dr(e, "da", t);
}
function Dr(e, t, n = Q) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (kr(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) wr(e.parent.vnode) && Or(r, t, n, e), e = e.parent;
	}
}
function Or(e, t, n, r) {
	let i = kr(t, e, r, !0);
	Ir(() => {
		ge(r[t], i);
	}, n);
}
function kr(e, t, n = Q, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			vt();
			let i = ka(n), a = Fn(t, n, e, r);
			return i(), yt(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Ar = (e) => (t, n = Q) => {
	(!Ma || e === "sp") && kr(e, (...e) => t(...e), n);
}, jr = Ar("bm"), Mr = Ar("m"), Nr = Ar("bu"), Pr = Ar("u"), Fr = Ar("bum"), Ir = Ar("um"), Lr = Ar("sp"), Rr = Ar("rtg"), zr = Ar("rtc");
function Br(e, t = Q) {
	kr("ec", e, t);
}
var Vr = /* @__PURE__ */ Symbol.for("v-ndc");
function Hr(e, t, n, r) {
	let i, a = n && n[r], o = O(e);
	if (o || j(e)) {
		let n = o && /* @__PURE__ */ hn(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ _n(e), s = /* @__PURE__ */ gn(e), e = jt(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? xn(bn(e[n])) : bn(e[n]) : e[n], n, void 0, a && a[n]);
	} else if (typeof e == "number") {
		i = Array(e);
		for (let n = 0; n < e; n++) i[n] = t(n + 1, n, void 0, a && a[n]);
	} else if (M(e)) if (e[Symbol.iterator]) i = Array.from(e, (e, n) => t(e, n, void 0, a && a[n]));
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
var Ur = (e) => e ? ja(e) ? Va(e) : Ur(e.parent) : null, Wr = /* @__PURE__ */ E(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => Ur(e.parent),
	$root: (e) => Ur(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => $r(e),
	$forceUpdate: (e) => e.f ||= () => {
		Kn(e.update);
	},
	$nextTick: (e) => e.n ||= Wn.bind(e.proxy),
	$watch: (e) => dr.bind(e)
}), Gr = (e, t) => e !== S && !e.__isScriptSetup && D(e, t), Kr = {
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
			else if (Gr(r, t)) return o[t] = 1, r[t];
			else if (i !== S && D(i, t)) return o[t] = 2, i[t];
			else if (D(a, t)) return o[t] = 3, a[t];
			else if (n !== S && D(n, t)) return o[t] = 4, n[t];
			else Jr && (o[t] = 0);
		}
		let l = Wr[t], u, d;
		if (l) return t === "$attrs" && R(e.attrs, "get", ""), l(e);
		if ((u = s.__cssModules) && (u = u[t])) return u;
		if (n !== S && D(n, t)) return o[t] = 4, n[t];
		if (d = c.config.globalProperties, D(d, t)) return d[t];
	},
	set({ _: e }, t, n) {
		let { data: r, setupState: i, ctx: a } = e;
		return Gr(i, t) ? (i[t] = n, !0) : r !== S && D(r, t) ? (r[t] = n, !0) : D(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (a[t] = n, !0);
	},
	has({ _: { data: e, setupState: t, accessCache: n, ctx: r, appContext: i, props: a, type: o } }, s) {
		let c;
		return !!(n[s] || e !== S && s[0] !== "$" && D(e, s) || Gr(t, s) || D(a, s) || D(r, s) || D(Wr, s) || D(i.config.globalProperties, s) || (c = o.__cssModules) && c[s]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? D(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function qr(e) {
	return O(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var Jr = !0;
function Yr(e) {
	let t = $r(e), n = e.proxy, r = e.ctx;
	Jr = !1, t.beforeCreate && Zr(t.beforeCreate, e, "bc");
	let { data: i, computed: a, methods: o, watch: s, provide: c, inject: l, created: u, beforeMount: d, mounted: f, beforeUpdate: p, updated: m, activated: h, deactivated: g, beforeDestroy: _, beforeUnmount: v, destroyed: y, unmounted: ee, render: te, renderTracked: ne, renderTriggered: re, errorCaptured: ie, serverPrefetch: ae, expose: b, inheritAttrs: oe, components: se, directives: ce, filters: le } = t;
	if (l && Xr(l, r, null), o) for (let e in o) {
		let t = o[e];
		A(t) && (r[e] = t.bind(n));
	}
	if (i) {
		let t = i.call(n, n);
		M(t) && (e.data = /* @__PURE__ */ dn(t));
	}
	if (Jr = !0, a) for (let e in a) {
		let t = a[e], i = $({
			get: A(t) ? t.bind(n, n) : A(t.get) ? t.get.bind(n, n) : w,
			set: !A(t) && A(t.set) ? t.set.bind(n) : w
		});
		Object.defineProperty(r, e, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		});
	}
	if (s) for (let e in s) Qr(s[e], r, n, e);
	if (c) {
		let e = A(c) ? c.call(n) : c;
		Reflect.ownKeys(e).forEach((t) => {
			ar(t, e[t]);
		});
	}
	u && Zr(u, e, "c");
	function x(e, t) {
		O(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (x(jr, d), x(Mr, f), x(Nr, p), x(Pr, m), x(Tr, h), x(Er, g), x(Br, ie), x(zr, ne), x(Rr, re), x(Fr, v), x(Ir, ee), x(Lr, ae), O(b)) if (b.length) {
		let t = e.exposed ||= {};
		b.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	te && e.render === w && (e.render = te), oe != null && (e.inheritAttrs = oe), se && (e.components = se), ce && (e.directives = ce), ae && vr(e);
}
function Xr(e, t, n = w) {
	O(e) && (e = ii(e));
	for (let n in e) {
		let r = e[n], i;
		i = M(r) ? "default" in r ? or(r.from || n, r.default, !0) : or(r.from || n) : or(r), /* @__PURE__ */ B(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function Zr(e, t, n) {
	Fn(O(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function Qr(e, t, n, r) {
	let i = r.includes(".") ? fr(n, r) : () => n[r];
	if (j(e)) {
		let n = t[e];
		A(n) && lr(i, n);
	} else if (A(e)) lr(i, e.bind(n));
	else if (M(e)) if (O(e)) e.forEach((e) => Qr(e, t, n, r));
	else {
		let r = A(e.handler) ? e.handler.bind(n) : t[e.handler];
		A(r) && lr(i, r, e);
	}
}
function $r(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => ei(c, e, o, !0)), ei(c, t, o)), M(t) && a.set(t, c), c;
}
function ei(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && ei(e, a, n, !0), i && i.forEach((t) => ei(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = ti[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var ti = {
	data: ni,
	props: oi,
	emits: oi,
	methods: ai,
	computed: ai,
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
	components: ai,
	directives: ai,
	watch: si,
	provide: ni,
	inject: ri
};
function ni(e, t) {
	return t ? e ? function() {
		return E(A(e) ? e.call(this, this) : e, A(t) ? t.call(this, this) : t);
	} : t : e;
}
function ri(e, t) {
	return ai(ii(e), ii(t));
}
function ii(e) {
	if (O(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function W(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function ai(e, t) {
	return e ? E(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function oi(e, t) {
	return e ? O(e) && O(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : E(/* @__PURE__ */ Object.create(null), qr(e), qr(t ?? {})) : t;
}
function si(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = E(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = W(e[r], t[r]);
	return n;
}
function ci() {
	return {
		app: null,
		config: {
			isNativeTag: me,
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
var li = 0;
function ui(e, t) {
	return function(n, r = null) {
		A(n) || (n = E({}, n)), r != null && !M(r) && (r = null);
		let i = ci(), a = /* @__PURE__ */ new WeakSet(), o = [], s = !1, c = i.app = {
			_uid: li++,
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
				return a.has(e) || (e && A(e.install) ? (a.add(e), e.install(c, ...t)) : A(e) && (a.add(e), e(c, ...t))), c;
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
					let u = c._ceVNode || ma(n, r);
					return u.appContext = i, l === !0 ? l = "svg" : l === !1 && (l = void 0), o && t ? t(u, a) : e(u, a, l), s = !0, c._container = a, a.__vue_app__ = c, Va(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				s && (Fn(o, c._instance, 16), e(null, c._container), delete c._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, c;
			},
			runWithContext(e) {
				let t = di;
				di = c;
				try {
					return e();
				} finally {
					di = t;
				}
			}
		};
		return c;
	};
}
var di = null, fi = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${N(t)}Modifiers`] || e[`${P(t)}Modifiers`];
function pi(e, t, ...n) {
	if (e.isUnmounted) return;
	let r = e.vnode.props || S, i = n, a = t.startsWith("update:"), o = a && fi(r, t.slice(7));
	o && (o.trim && (i = n.map((e) => j(e) ? e.trim() : e)), o.number && (i = n.map(Ie)));
	let s, c = r[s = Me(t)] || r[s = Me(N(t))];
	!c && a && (c = r[s = Me(P(t))]), c && Fn(c, e, 6, i);
	let l = r[s + "Once"];
	if (l) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[s]) return;
		e.emitted[s] = !0, Fn(l, e, 6, i);
	}
}
var mi = /* @__PURE__ */ new WeakMap();
function hi(e, t, n = !1) {
	let r = n ? mi : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, s = !1;
	if (!A(e)) {
		let r = (e) => {
			let n = hi(e, t, !0);
			n && (s = !0, E(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !s ? (M(e) && r.set(e, null), null) : (O(a) ? a.forEach((e) => o[e] = null) : E(o, a), M(e) && r.set(e, o), o);
}
function gi(e, t) {
	return !e || !he(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), D(e, t[0].toLowerCase() + t.slice(1)) || D(e, P(t)) || D(e, t));
}
function _i(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: o, attrs: s, emit: c, render: l, renderCache: u, props: d, data: f, setupState: p, ctx: m, inheritAttrs: h } = e, g = tr(e), _, v;
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
			}) : e(d, null)), v = t.props ? s : vi(s);
		}
	} catch (t) {
		ra.length = 0, In(t, e, 1), _ = ma(ta);
	}
	let y = _;
	if (v && h !== !1) {
		let e = Object.keys(v), { shapeFlag: t } = y;
		e.length && t & 7 && (a && e.some(T) && (v = yi(v, a)), y = _a(y, v, !1, !0));
	}
	return n.dirs && (y = _a(y, null, !1, !0), y.dirs = y.dirs ? y.dirs.concat(n.dirs) : n.dirs), n.transition && gr(y, n.transition), _ = y, tr(g), _;
}
var vi = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || he(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, yi = (e, t) => {
	let n = {};
	for (let r in e) (!T(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function bi(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? xi(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (Si(o, r, n) && !gi(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? xi(r, o, l) : !0 : !!o;
	return !1;
}
function xi(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (Si(t, e, a) && !gi(n, a)) return !0;
	}
	return !1;
}
function Si(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && M(r) && M(i) ? !Xe(r, i) : r !== i;
}
function Ci({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var wi = {}, Ti = () => Object.create(wi), Ei = (e) => Object.getPrototypeOf(e) === wi;
function Di(e, t, n, r = !1) {
	let i = {}, a = Ti();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), ki(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ fn(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Oi(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ z(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (gi(e.emitsOptions, o)) continue;
				let u = t[o];
				if (c) if (D(a, o)) u !== a[o] && (a[o] = u, l = !0);
				else {
					let t = N(o);
					i[t] = Ai(c, s, t, u, e, !1);
				}
				else u !== a[o] && (a[o] = u, l = !0);
			}
		}
	} else {
		ki(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !D(t, a) && ((r = P(a)) === a || !D(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Ai(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !D(t, e)) && (delete a[e], l = !0);
	}
	l && kt(e.attrs, "set", "");
}
function ki(e, t, n, r) {
	let [i, a] = e.propsOptions, o = !1, s;
	if (t) for (let c in t) {
		if (De(c)) continue;
		let l = t[c], u;
		i && D(i, u = N(c)) ? !a || !a.includes(u) ? n[u] = l : (s ||= {})[u] = l : gi(e.emitsOptions, c) || (!(c in r) || l !== r[c]) && (r[c] = l, o = !0);
	}
	if (a) {
		let t = /* @__PURE__ */ z(n), r = s || S;
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			n[s] = Ai(i, t, s, r[s], e, !D(r, s));
		}
	}
	return o;
}
function Ai(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = D(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && A(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = ka(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === P(n)) && (r = !0));
	}
	return r;
}
var ji = /* @__PURE__ */ new WeakMap();
function Mi(e, t, n = !1) {
	let r = n ? ji : t.propsCache, i = r.get(e);
	if (i) return i;
	let a = e.props, o = {}, s = [], c = !1;
	if (!A(e)) {
		let r = (e) => {
			c = !0;
			let [n, r] = Mi(e, t, !0);
			E(o, n), r && s.push(...r);
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	if (!a && !c) return M(e) && r.set(e, C), C;
	if (O(a)) for (let e = 0; e < a.length; e++) {
		let t = N(a[e]);
		Ni(t) && (o[t] = S);
	}
	else if (a) for (let e in a) {
		let t = N(e);
		if (Ni(t)) {
			let n = a[e], r = o[t] = O(n) || A(n) ? { type: n } : E({}, n), i = r.type, c = !1, l = !0;
			if (O(i)) for (let e = 0; e < i.length; ++e) {
				let t = i[e], n = A(t) && t.name;
				if (n === "Boolean") {
					c = !0;
					break;
				} else n === "String" && (l = !1);
			}
			else c = A(i) && i.name === "Boolean";
			r[0] = c, r[1] = l, (c || D(r, "default")) && s.push(t);
		}
	}
	let l = [o, s];
	return M(e) && r.set(e, l), l;
}
function Ni(e) {
	return e[0] !== "$" && !De(e);
}
var Pi = (e) => e === "_" || e === "_ctx" || e === "$stable", Fi = (e) => O(e) ? e.map(va) : [va(e)], Ii = (e, t, n) => {
	if (t._n) return t;
	let r = nr((...e) => Fi(t(...e)), n);
	return r._c = !1, r;
}, Li = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (Pi(n)) continue;
		let i = e[n];
		if (A(i)) t[n] = Ii(n, i, r);
		else if (i != null) {
			let e = Fi(i);
			t[n] = () => e;
		}
	}
}, Ri = (e, t) => {
	let n = Fi(t);
	e.slots.default = () => n;
}, zi = (e, t, n) => {
	for (let r in t) (n || !Pi(r)) && (e[r] = t[r]);
}, Bi = (e, t, n) => {
	let r = e.slots = Ti();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (zi(r, t, n), n && Fe(r, "_", e, !0)) : Li(t, r);
	} else t && Ri(e, t);
}, Vi = (e, t, n) => {
	let { vnode: r, slots: i } = e, a = !0, o = S;
	if (r.shapeFlag & 32) {
		let e = t._;
		e ? n && e === 1 ? a = !1 : zi(i, t, n) : (a = !t.$stable, Li(t, i)), o = t;
	} else t && (Ri(e, t), o = { default: 1 });
	if (a) for (let e in i) !Pi(e) && o[e] == null && delete i[e];
}, G = $i;
function Hi(e) {
	return Ui(e);
}
function Ui(e, t) {
	let n = ze();
	n.__VUE__ = !0;
	let { insert: r, remove: i, patchProp: a, createElement: o, createText: s, createComment: c, setText: l, setElementText: u, parentNode: d, nextSibling: f, setScopeId: p = w, insertStaticContent: m } = e, h = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !da(e, t) && (r = O(e), T(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case ea:
				g(e, t, n, r);
				break;
			case ta:
				_(e, t, n, r);
				break;
			case na:
				e ?? v(t, n, r, o);
				break;
			case K:
				se(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? te(e, t, n, r, i, a, o, s, c) : d & 6 ? ce(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, ye);
		}
		u != null && i ? xr(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && xr(e.ref, null, a, e, !0);
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
		if (f = e.el = o(e.type, c, m && m.is, m), h & 8 ? u(f, e.children) : h & 16 && ie(e.children, f, null, i, s, Wi(e, c), l, d), _ && ir(e, null, i, "created"), re(f, e, e.scopeId, l, i), m) {
			for (let e in m) e !== "value" && !De(e) && a(f, e, null, m[e], c, i);
			"value" in m && a(f, "value", null, m.value, c), (p = m.onVnodeBeforeMount) && Sa(p, i, e);
		}
		_ && ir(e, null, i, "beforeMount");
		let v = Ki(s, g);
		v && g.beforeEnter(f), r(f, t, n), ((p = m && m.onVnodeMounted) || v || _) && G(() => {
			try {
				p && Sa(p, i, e), v && g.enter(f), _ && ir(e, null, i, "mounted");
			} finally {}
		}, s);
	}, re = (e, t, n, r, i) => {
		if (n && p(e, n), r) for (let t = 0; t < r.length; t++) p(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || Qi(n.type) && (n.ssContent === t || n.ssFallback === t)) {
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
		if (n && Gi(n, !1), (h = m.onVnodeBeforeUpdate) && Sa(h, n, t, e), f && ir(t, e, n, "beforeUpdate"), n && Gi(n, !0), (p.innerHTML && m.innerHTML == null || p.textContent && m.textContent == null) && u(c, ""), d ? b(e.dynamicChildren, d, c, n, r, Wi(t, i), o) : s || fe(e, t, c, null, n, r, Wi(t, i), o, !1), l > 0) {
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
		((h = m.onVnodeUpdated) || f) && G(() => {
			h && Sa(h, n, t, e), f && ir(t, e, n, "updated");
		}, r);
	}, b = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			h(c, l, c.el && (c.type === K || !da(c, l) || c.shapeFlag & 198) ? d(c.el) : n, null, r, i, a, o, !0);
		}
	}, oe = (e, t, n, r, i) => {
		if (t !== n) {
			if (t !== S) for (let o in t) !De(o) && !(o in n) && a(e, o, t[o], null, i, r);
			for (let o in n) {
				if (De(o)) continue;
				let s = n[o], c = t[o];
				s !== c && o !== "value" && a(e, o, c, s, i, r);
			}
			"value" in n && a(e, "value", t.value, n.value, i);
		}
	}, se = (e, t, n, i, a, o, c, l, u) => {
		let d = t.el = e ? e.el : s(""), f = t.anchor = e ? e.anchor : s(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (l = l ? l.concat(h) : h), e == null ? (r(d, n, i), r(f, n, i), ie(t.children || [], n, f, a, o, c, l, u)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (b(e.dynamicChildren, m, n, a, o, c, l), (t.key != null || a && t === a.subTree) && qi(e, t, !0)) : fe(e, t, n, f, a, o, c, l, u);
	}, ce = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : le(t, n, r, i, a, o, c) : x(e, t, c);
	}, le = (e, t, n, r, i, a, o) => {
		let s = e.component = Ta(e, r, i);
		if (wr(e) && (s.ctx.renderer = ye), Na(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, ue, o), !e.el) {
				let r = s.subTree = ma(ta);
				_(null, r, t, n), e.placeholder = r.el;
			}
		} else ue(s, e, t, n, i, a, o);
	}, x = (e, t, n) => {
		let r = t.component = e.component;
		if (bi(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			de(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, ue = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = Yi(e);
					if (n) {
						t && (t.el = c.el, de(e, t, o)), n.asyncDep.then(() => {
							G(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, f;
				Gi(e, !1), t ? (t.el = c.el, de(e, t, o)) : t = c, n && Pe(n), (f = t.props && t.props.onVnodeBeforeUpdate) && Sa(f, s, t, c), Gi(e, !0);
				let p = _i(e), m = e.subTree;
				e.subTree = p, h(m, p, d(m.el), O(m), e, i, a), t.el = p.el, u === null && Ci(e, p.el), r && G(r, i), (f = t.props && t.props.onVnodeUpdated) && G(() => Sa(f, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Cr(t);
				if (Gi(e, !1), l && Pe(l), !m && (o = c && c.onVnodeBeforeMount) && Sa(o, d, t), Gi(e, !0), s && j) {
					let t = () => {
						e.subTree = _i(e), j(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = _i(e);
					h(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && G(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					G(() => Sa(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Cr(d.vnode) && d.vnode.shapeFlag & 256) && e.a && G(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new rt(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => Kn(u), Gi(e, !0), l();
	}, de = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Oi(e, t.props, r, n), Vi(e, t.children, n), vt(), Yn(e), yt();
	}, fe = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, d = e ? e.shapeFlag : 0, f = t.children, { patchFlag: p, shapeFlag: m } = t;
		if (p > 0) {
			if (p & 128) {
				me(l, f, n, r, i, a, o, s, c);
				return;
			} else if (p & 256) {
				pe(l, f, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (d & 16 && D(l, i, a), f !== l && u(n, f)) : d & 16 ? m & 16 ? me(l, f, n, r, i, a, o, s, c) : D(l, i, a, !0) : (d & 8 && u(n, ""), m & 16 && ie(f, n, r, i, a, o, s, c));
	}, pe = (e, t, n, r, i, a, o, s, c) => {
		e ||= C, t ||= C;
		let l = e.length, u = t.length, d = Math.min(l, u), f;
		for (f = 0; f < d; f++) {
			let r = t[f] = c ? ya(t[f]) : va(t[f]);
			h(e[f], r, n, null, i, a, o, s, c);
		}
		l > u ? D(e, i, a, !0, !1, d) : ie(t, n, r, i, a, o, s, c, d);
	}, me = (e, t, n, r, i, a, o, s, c) => {
		let l = 0, u = t.length, d = e.length - 1, f = u - 1;
		for (; l <= d && l <= f;) {
			let r = e[l], u = t[l] = c ? ya(t[l]) : va(t[l]);
			if (da(r, u)) h(r, u, n, null, i, a, o, s, c);
			else break;
			l++;
		}
		for (; l <= d && l <= f;) {
			let r = e[d], l = t[f] = c ? ya(t[f]) : va(t[f]);
			if (da(r, l)) h(r, l, n, null, i, a, o, s, c);
			else break;
			d--, f--;
		}
		if (l > d) {
			if (l <= f) {
				let e = f + 1, d = e < u ? t[e].el : r;
				for (; l <= f;) h(null, t[l] = c ? ya(t[l]) : va(t[l]), n, d, i, a, o, s, c), l++;
			}
		} else if (l > f) for (; l <= d;) T(e[l], i, a, !0), l++;
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
					T(r, i, a, !0);
					continue;
				}
				let u;
				if (r.key != null) u = g.get(r.key);
				else for (_ = m; _ <= f; _++) if (ne[_ - m] === 0 && da(r, t[_])) {
					u = _;
					break;
				}
				u === void 0 ? T(r, i, a, !0) : (ne[u - m] = l + 1, u >= te ? te = u : ee = !0, h(r, t[u], n, null, i, a, o, s, c), v++);
			}
			let re = ee ? Ji(ne) : C;
			for (_ = re.length - 1, l = y - 1; l >= 0; l--) {
				let e = m + l, d = t[e], f = t[e + 1], p = e + 1 < u ? f.el || Zi(f) : r;
				ne[l] === 0 ? h(null, d, n, p, i, a, o, s, c) : ee && (_ < 0 || l !== re[_] ? he(d, n, p, 2) : _--);
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
			c.move(e, t, n, ye);
			return;
		}
		if (c === K) {
			r(s, t, n);
			for (let e = 0; e < u.length; e++) he(u[e], t, n, a);
			r(e.anchor, t, n);
			return;
		}
		if (c === na) {
			y(e, t, n);
			return;
		}
		if (a !== 2 && d & 1 && l) if (a === 0) l.beforeEnter(s), r(s, t, n), G(() => l.enter(s), o);
		else {
			let { leave: a, delayLeave: o, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? i(s) : r(s, t, n);
			}, d = () => {
				s._isLeaving && s[hr](!0), a(s, () => {
					u(), c && c();
				});
			};
			o ? o(s, u, d) : d();
		}
		else r(s, t, n);
	}, T = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (vt(), xr(s, null, n, e, !0), yt()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Cr(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Sa(_, t, e), u & 6) _e(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && ir(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, ye, r) : l && !l.hasOnce && (a !== K || d > 0 && d & 64) ? D(l, t, n, !1, !0) : (a === K && d & 384 || !i && u & 16) && D(c, t, n), r && E(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && G(() => {
			_ && Sa(_, t, e), h && ir(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, E = (e) => {
		let { type: t, el: n, anchor: r, transition: a } = e;
		if (t === K) {
			ge(n, r);
			return;
		}
		if (t === na) {
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
	}, ge = (e, t) => {
		let n;
		for (; e !== t;) n = f(e), i(e), e = n;
		i(t);
	}, _e = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		Xi(c), Xi(l), r && Pe(r), i.stop(), a && (a.flags |= 8, T(o, e, t, n)), s && G(s, t), G(() => {
			e.isUnmounted = !0;
		}, t);
	}, D = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) T(e[o], t, n, r, i);
	}, O = (e) => {
		if (e.shapeFlag & 6) return O(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = f(e.anchor || e.el), n = t && t[pr];
		return n ? f(n) : t;
	}, k = !1, ve = (e, t, n) => {
		let r;
		e == null ? t._vnode && (T(t._vnode, null, null, !0), r = t._vnode.component) : h(t._vnode || null, e, t, null, null, null, n), t._vnode = e, k ||= (k = !0, Yn(r), Xn(), !1);
	}, ye = {
		p: h,
		um: T,
		m: he,
		r: E,
		mt: le,
		mc: ie,
		pc: fe,
		pbc: b,
		n: O,
		o: e
	}, A, j;
	return t && ([A, j] = t(ye)), {
		render: ve,
		hydrate: A,
		createApp: ui(ve, A)
	};
}
function Wi({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function Gi({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Ki(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function qi(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (O(r) && O(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = ya(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && qi(t, a)), a.type === ea && (a.patchFlag === -1 && (a = i[e] = ya(a)), a.el = t.el), a.type === ta && !a.el && (a.el = t.el);
	}
}
function Ji(e) {
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
function Yi(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : Yi(t);
}
function Xi(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function Zi(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? Zi(t.subTree) : null;
}
var Qi = (e) => e.__isSuspense;
function $i(e, t) {
	t && t.pendingBranch ? O(e) ? t.effects.push(...e) : t.effects.push(e) : Jn(e);
}
var K = /* @__PURE__ */ Symbol.for("v-fgt"), ea = /* @__PURE__ */ Symbol.for("v-txt"), ta = /* @__PURE__ */ Symbol.for("v-cmt"), na = /* @__PURE__ */ Symbol.for("v-stc"), ra = [], ia = null;
function q(e = !1) {
	ra.push(ia = e ? null : []);
}
function aa() {
	ra.pop(), ia = ra[ra.length - 1] || null;
}
var oa = 1;
function sa(e, t = !1) {
	oa += e, e < 0 && ia && t && (ia.hasOnce = !0);
}
function ca(e) {
	return e.dynamicChildren = oa > 0 ? ia || C : null, aa(), oa > 0 && ia && ia.push(e), e;
}
function J(e, t, n, r, i, a) {
	return ca(Y(e, t, n, r, i, a, !0));
}
function la(e, t, n, r, i) {
	return ca(ma(e, t, n, r, i, !0));
}
function ua(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function da(e, t) {
	return e.type === t.type && e.key === t.key;
}
var fa = ({ key: e }) => e ?? null, pa = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : j(e) || /* @__PURE__ */ B(e) || A(e) ? {
	i: $n,
	r: e,
	k: t,
	f: !!n
} : e);
function Y(e, t = null, n = null, r = 0, i = null, a = e === K ? 0 : 1, o = !1, s = !1) {
	let c = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e,
		props: t,
		key: t && fa(t),
		ref: t && pa(t),
		scopeId: er,
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
		ctx: $n
	};
	return s ? (ba(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= j(n) ? 8 : 16), oa > 0 && !o && ia && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && ia.push(c), c;
}
var ma = ha;
function ha(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === Vr) && (e = ta), ua(e)) {
		let r = _a(e, t, !0);
		return n && ba(r, n), oa > 0 && !a && ia && (r.shapeFlag & 6 ? ia[ia.indexOf(e)] = r : ia.push(r)), r.patchFlag = -2, r;
	}
	if (Ha(e) && (e = e.__vccOpts), t) {
		t = ga(t);
		let { class: e, style: n } = t;
		e && !j(e) && (t.class = Ge(e)), M(n) && (/* @__PURE__ */ vn(n) && !O(n) && (n = E({}, n)), t.style = Be(n));
	}
	let o = j(e) ? 1 : Qi(e) ? 128 : mr(e) ? 64 : M(e) ? 4 : A(e) ? 2 : 0;
	return Y(e, t, n, r, i, o, a, !0);
}
function ga(e) {
	return e ? /* @__PURE__ */ vn(e) || Ei(e) ? E({}, e) : e : null;
}
function _a(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? xa(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && fa(l),
		ref: t && t.ref ? n && a ? O(a) ? a.concat(pa(t)) : [a, pa(t)] : pa(t) : a,
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
		ssContent: e.ssContent && _a(e.ssContent),
		ssFallback: e.ssFallback && _a(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && gr(u, c.clone(u)), u;
}
function X(e = " ", t = 0) {
	return ma(ea, null, e, t);
}
function Z(e = "", t = !1) {
	return t ? (q(), la(ta, null, e)) : ma(ta, null, e);
}
function va(e) {
	return e == null || typeof e == "boolean" ? ma(ta) : O(e) ? ma(K, null, e.slice()) : ua(e) ? ya(e) : ma(ea, null, String(e));
}
function ya(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : _a(e);
}
function ba(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (O(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), ba(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Ei(t) ? t._ctx = $n : r === 3 && $n && ($n.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else A(t) ? (t = {
		default: t,
		_ctx: $n
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [X(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function xa(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = Ge([t.class, r.class]));
		else if (e === "style") t.style = Be([t.style, r.style]);
		else if (he(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(O(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !T(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Sa(e, t, n, r = null) {
	Fn(e, t, 7, [n, r]);
}
var Ca = ci(), wa = 0;
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
		scope: new et(!0),
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
		propsOptions: Mi(r, i),
		emitsOptions: hi(r, i),
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
	return a.ctx = { _: a }, a.root = t ? t.root : a, a.emit = pi.bind(null, a), e.ce && e.ce(a), a;
}
var Q = null, Ea = () => Q || $n, Da, Oa;
{
	let e = ze(), t = (t, n) => {
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
	Di(e, r, a, t), Bi(e, i, n || t);
	let o = a ? Pa(e, t) : void 0;
	return t && Oa(!1), o;
}
function Pa(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Kr);
	let { setup: r } = n;
	if (r) {
		vt();
		let n = e.setupContext = r.length > 1 ? Ba(e) : null, i = ka(e), a = Pn(r, e, 0, [e.props, n]), o = xe(a);
		if (yt(), i(), (o || e.sp) && !Cr(e) && vr(e), o) {
			if (a.then(Aa, Aa), t) return a.then((n) => {
				Fa(e, n, t);
			}).catch((t) => {
				In(t, e, 0);
			});
			e.asyncDep = a;
		} else Fa(e, a, t);
	} else Ra(e, t);
}
function Fa(e, t, n) {
	A(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : M(t) && (e.setupState = Tn(t)), Ra(e, n);
}
var Ia, La;
function Ra(e, t, n) {
	let r = e.type;
	if (!e.render) {
		if (!t && Ia && !r.render) {
			let t = r.template || $r(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: i } = e.appContext.config, { delimiters: a, compilerOptions: o } = r;
				r.render = Ia(t, E(E({
					isCustomElement: n,
					delimiters: a
				}, i), o));
			}
		}
		e.render = r.render || w, La && La(e);
	}
	{
		let t = ka(e);
		vt();
		try {
			Yr(e);
		} finally {
			yt(), t();
		}
	}
}
var za = { get(e, t) {
	return R(e, "get", ""), e[t];
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
	return e.exposed ? e.exposeProxy ||= new Proxy(Tn(yn(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in Wr) return Wr[n](e);
		},
		has(e, t) {
			return t in e || t in Wr;
		}
	}) : e.proxy;
}
function Ha(e) {
	return A(e) && "__vccOpts" in e;
}
var $ = (e, t) => /* @__PURE__ */ Dn(e, t, Ma), Ua = "3.5.34", Wa = void 0, Ga = typeof window < "u" && window.trustedTypes;
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
	let r = e.style, i = j(n), a = !1;
	if (n && !i) {
		if (t) if (j(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? oo(r, t, "");
		}
		else for (let e in t) n[e] ?? oo(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? oo(r, i, "") : uo(e, i, !j(t) && t ? t[i] : void 0, o) || oo(r, i, o);
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
	if (O(n)) n.forEach((n) => oo(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = lo(e, t);
		ao.test(n) ? e.setProperty(P(r), n.replace(ao, ""), "important") : e[r] = n;
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
	let r = N(t);
	if (r !== "filter" && r in e) return co[t] = r;
	r = je(r);
	for (let n = 0; n < so.length; n++) {
		let i = so[n] + r;
		if (i in e) return co[t] = i;
	}
	return t;
}
function uo(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && j(r) && n === r;
}
var fo = "http://www.w3.org/1999/xlink";
function po(e, t, n, r, i, a = qe(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(fo, t.slice(6, t.length)) : e.setAttributeNS(fo, t, n) : n == null || a && !Je(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : be(n) ? String(n) : n);
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
		r === "boolean" ? n = Je(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
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
	return [e[2] === ":" ? e.slice(3) : P(e.slice(2)), t];
}
var xo = 0, So = /* @__PURE__ */ Promise.resolve(), Co = () => xo ||= (So.then(() => xo = 0), Date.now());
function wo(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		Fn(To(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Co(), n;
}
function To(e, t) {
	if (O(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Eo = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Do = (e, t, n, r, i, a) => {
	let o = i === "svg";
	t === "class" ? $a(e, r, o) : t === "style" ? io(e, n, r) : he(t) ? T(t) || vo(e, t, n, r, a) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Oo(e, t, r, o)) ? (mo(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && po(e, t, r, o, a, t !== "value")) : e._isVueCE && (ko(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !j(r))) ? mo(e, N(t), r, a, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), po(e, t, r, o));
};
function Oo(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Eo(t) && A(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Eo(t) && j(n) ? !1 : t in e;
}
function ko(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = N(t);
	return Array.isArray(n) ? n.some((e) => N(e) === r) : Object.keys(n).some((e) => N(e) === r);
}
var Ao = {};
/* @__NO_SIDE_EFFECTS__ */
function jo(e, t, n) {
	let r = /* @__PURE__ */ _r(e, t);
	Te(r) && (r = E({}, r, t));
	class i extends No {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var Mo = typeof HTMLElement < "u" ? HTMLElement : class {}, No = class e extends Mo {
	constructor(e, t = {}, n = Yo) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== Yo ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(E({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, Wn(() => {
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
			if (n && !O(n)) for (let e in n) {
				let t = n[e];
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = Le(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[N(e)] = !0);
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
		if (t) for (let e in t) D(this, e) || Object.defineProperty(this, e, { get: () => H(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = O(t) ? t : Object.keys(t || {});
		for (let e of Object.keys(this)) e[0] !== "_" && n.includes(e) && this._setProp(e, this[e]);
		for (let e of n.map(N)) Object.defineProperty(this, e, {
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : Ao, r = N(e);
		t && this._numberProps && this._numberProps[r] && (n = Le(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === Ao ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(P(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(P(e), t + "") : t || this.removeAttribute(P(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), Jo(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = ma(this._def, E(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, Te(t[0]) ? E({ detail: t }, t[0]) : { detail: t }));
			};
			e.emit = (e, ...n) => {
				t(e, n), P(e) !== e && t(P(e), n);
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
	return O(t) ? (e) => Pe(t, e) : t;
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
	return t && (e = e.trim()), n && (e = Ie(e)), e;
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
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? Ie(e.value) : e.value, c = t ?? "";
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
		let r = P(n.key);
		if (t.some((e) => e === r || Uo[e] === r)) return e(n);
	}));
}, Go = /* @__PURE__ */ E({ patchProp: Do }, Za), Ko;
function qo() {
	return Ko ||= Hi(Go);
}
var Jo = ((...e) => {
	qo().render(...e);
}), Yo = ((...e) => {
	let t = qo().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = Zo(e);
		if (!r) return;
		let i = t._component;
		!A(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, Xo(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function Xo(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function Zo(e) {
	return j(e) ? document.querySelector(e) : e;
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
	t.enabled ? lr(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), Ir(a);
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
//#region packages/sdk-vue/src/classify-principal.ts
var ds = {
	kind: "unknown",
	label: "unknown",
	glyph: "·",
	tone: "neutral"
};
function fs(e) {
	if (!e) return ds;
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: ps(r),
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
			glyph: ps(r) || "·",
			tone: "neutral"
		};
	}
}
function ps(e) {
	return e.slice(0, 1).toUpperCase();
}
//#endregion
//#region packages/sdk-vue/src/comtrya-config.ts
function ms() {
	if (typeof window > "u") return [];
	let e = window.location.pathname;
	if (!e.startsWith("/r/")) return [];
	let t = e.slice(3), n = t.indexOf("/p/");
	return (n >= 0 ? t.slice(0, n) : t).split("/").filter(Boolean).map(decodeURIComponent);
}
async function hs(e) {
	try {
		let t = e ?? ms(), n = t.length > 0 ? "query ComtryaProjects($segments: [String!]!) {\n          workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n        }" : "query ComtryaProjectsCwd { repository { comtryaConfig } }", r = t.length > 0 ? { segments: t } : void 0, i = await a().query(n, r);
		return ((i.workspace?.repositoryByPath?.comtryaConfig ?? i.repository?.comtryaConfig ?? null)?.projects ?? []).filter((e) => typeof e == "object" && !!e);
	} catch {
		return [];
	}
}
async function gs(e, t) {
	return ((await hs(t)).find((t) => t.name === e)?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0);
}
//#endregion
//#region packages/sdk-vue/src/LabelPill.vue?vue&type=script&setup=true&lang.ts
var _s = ["title"], vs = {
	key: 0,
	class: "label-pill-value"
}, ys = { class: "label-pill-type" }, bs = { class: "label-pill-value" }, xs = /* @__PURE__ */ _r({
	__name: "LabelPill",
	props: {
		name: { type: String },
		catalog: { type: [Object, null] }
	},
	setup(e) {
		let t = e, n = $(() => t.catalog ? t.catalog[t.name] ?? null : null), r = $(() => {
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
		}), i = $(() => n.value?.color ?? null), a = $(() => n.value?.description ?? null);
		return (e, t) => (q(), J("span", {
			class: Ge(["label-pill", [`label-pill--${r.value.kind}`]]),
			title: a.value ?? void 0,
			style: Be(i.value ? { "--label-color": i.value } : void 0)
		}, [r.value.kind === "plain" ? (q(), J("span", vs, F(r.value.value), 1)) : (q(), J(K, { key: 1 }, [
			Y("span", ys, F(r.value.type), 1),
			t[0] ||= Y("span", {
				class: "label-pill-sep",
				"aria-hidden": "true"
			}, "::", -1),
			Y("span", bs, F(r.value.value), 1)
		], 64))], 14, _s));
	}
});
//#endregion
//#region packages/sdk-vue/src/index.ts
function Ss(e) {
	Cs(e.tagName, e.component);
	let t = /* @__PURE__ */ jo(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(Ts(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function Cs(e, t) {
	if (typeof document > "u") return;
	let n = ws(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function ws(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function Ts(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_epics/dist/ext_epics.client.ts
var Es = {
	createEpic: async (t) => e("ext_epics", "epics", "create-epic", t),
	changeStateEpic: async (t) => e("ext_epics", "epics", "change-state-epic", t),
	assignProject: async (t) => e("ext_epics", "epics", "assign-project", t),
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
function Ds(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Os(e) {
	return `comtrya://workspace/${e}`;
}
function ks(e) {
	switch (e) {
		case "IN_PROGRESS":
		case "AT_RISK":
		case "DONE":
		case "CANCELED": return e;
		default: return "PLANNED";
	}
}
function As(e) {
	return {
		id: e.id,
		workspaceId: e.workspaceId ?? e.workspace?.replace(/^comtrya:\/\/workspace\//, "") ?? "",
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: ks(e.state),
		targetDate: e.targetDate ?? null,
		ownerRef: e.ownerRef ?? null,
		labels: e.labels ?? [],
		createdAt: e.createdAt ?? null,
		closedAt: e.closedAt ?? null,
		projectName: e.projectName ?? null
	};
}
async function js(e, t) {
	let n = Ds(await Es.byRefEpic(t), "epicByRef");
	return n ? As(n) : null;
}
async function Ms(e, t) {
	let n = Ds(await Es.listEpics({
		workspace: Os(t.workspaceId),
		limit: 1024
	}), "listEpics").map(As), r = t.state ? ks(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function Ns(e, t) {
	return Ds(await Es.progressEpic(t), "epicProgress");
}
async function Ps(e, t) {
	return Ds(await Es.issuesInEpic(t), "issuesInEpic");
}
async function Fs(e, t, n) {
	return As(Ds(await Es.changeStateEpic({
		id: t,
		state: n
	}), "changeEpicState"));
}
async function Is(e, t) {
	return As(Ds(await Es.createEpic({
		workspace: Os(t.workspaceId),
		title: t.title,
		bodyMarkdown: t.bodyMarkdown ?? "",
		ownerRef: null,
		targetDate: null,
		labels: [],
		parentEpicRef: null,
		projectName: t.projectName ?? null
	}), "createEpic"));
}
async function Ls(e, t) {
	return As(Ds(await Es.assignProject({
		id: e,
		projectName: t ?? null
	}), "assignProject"));
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/types.ts
var Rs = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3", zs = "epics";
function Bs(e) {
	return `comtrya://epic/${e.id}`;
}
function Vs(e) {
	return l(zs, `/${e.workspaceId}/${e.id}`);
}
function Hs(e) {
	return `${l(zs, "/new")}?workspaceId=${e}`;
}
function Us(e) {
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
var Ws = /* @__PURE__ */ new Map();
function Gs(e) {
	return [
		e.id,
		e.title,
		e.state,
		e.projectName ?? ""
	].join("|");
}
var Ks = [
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
function qs(e) {
	return e.projectName ? ` (${e.projectName})` : "";
}
function Js(e, t) {
	let n = [], r = qs(e);
	n.push(fe({
		id: `ext_epics.open.${e.id}`,
		title: `Open epic ${e.title}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: () => {
			window.location.href = Vs(e);
		}
	}));
	for (let { state: i, verb: a } of Ks) e.state !== i && n.push(fe({
		id: `ext_epics.mark.${i.toLowerCase()}.${e.id}`,
		title: `Mark epic ${e.title} ${a}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: async () => {
			await Fs(t, e.id, i);
		}
	}));
	return () => n.forEach((e) => e());
}
async function Ys(e, t) {
	let n;
	try {
		n = await Ms(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_epics] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = Gs(t), i = Ws.get(t.id);
		i && i.signature === n || (i?.unregister(), Ws.set(t.id, {
			signature: n,
			unregister: Js(t, e)
		}));
	}
	for (let [e, t] of Ws) r.has(e) || (t.unregister(), Ws.delete(e));
}
function Xs(e) {
	let t = Rs;
	Ys(e, t);
	let n = ["dev.comtrya.epic.created", "dev.comtrya.epic.state-changed"].map((n) => u({
		type: n,
		onEvent: () => {
			Ys(e, t);
		},
		onError: () => {}
	}));
	return () => {
		for (let e of n) e();
		for (let e of Ws.values()) e.unregister();
		Ws.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicCard.vue?vue&type=script&setup=true&lang.ts
var Zs = ["data-state"], Qs = ["data-epic-id"], $s = { class: "epic-card-title" }, ec = ["href"], tc = ["data-author-kind", "title"], nc = { class: "owner-glyph" }, rc = ["title"], ic = {
	key: 0,
	class: "epic-meta"
}, ac = {
	key: 1,
	class: "epic-meta"
}, oc = {
	key: 1,
	class: "epic-line muted"
}, sc = {
	key: 2,
	class: "epic-card-fallback"
}, cc = { class: "epic-line muted" }, lc = { class: "epic-line warn" }, uc = /* @__PURE__ */ _r({
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
		let n = e, r = t, i = /* @__PURE__ */ V("idle"), a = /* @__PURE__ */ V(null), o = /* @__PURE__ */ V(n.epic ?? null), s = /* @__PURE__ */ V(null), c = $(() => n.resourceRef ?? n.ref ?? ""), l = $(() => n.client ?? n.comtryaClient), u = $(() => n.epic ?? o.value), d = $(() => Us(u.value?.state)), f = $(() => (s.value?.issuesOpen ?? 0) + (s.value?.issuesClosed ?? 0));
		Mr(p), lr(() => [
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
				o.value = await js(l.value, c.value), i.value = o.value ? "ready" : "empty", await m();
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
				s.value = await Ns(l.value, c.value);
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
		return (e, t) => (q(), J("article", {
			class: "epic-card",
			"data-state": i.value,
			"data-smoke": "epic-card"
		}, [u.value ? (q(), J("div", {
			key: 0,
			class: "epic-card-body",
			"data-epic-id": u.value.id,
			"data-smoke": "epic-card-body"
		}, [
			Y("div", $s, [
				Y("span", { class: Ge(["epic-pill", d.value.className]) }, F(d.value.label), 3),
				Y("a", {
					class: "epic-title-link",
					href: H(Vs)(u.value)
				}, F(u.value.title), 9, ec),
				u.value.ownerRef ? (q(), J("button", {
					key: 0,
					type: "button",
					class: Ge(["epic-owner", { active: n.activeOwner === u.value.ownerRef }]),
					"data-author-kind": h(u.value.ownerRef).kind,
					title: `${u.value.ownerRef}\nClick to filter by this owner`,
					onClick: t[0] ||= Ho((e) => r("owner-click", u.value.ownerRef), ["prevent", "stop"])
				}, [Y("span", nc, F(h(u.value.ownerRef).glyph), 1), X(" " + F(h(u.value.ownerRef).label), 1)], 10, tc)) : Z("", !0),
				u.value.projectName ? (q(), J("button", {
					key: 1,
					type: "button",
					class: Ge(["epic-project", { active: n.activeProject === u.value.projectName }]),
					title: `${u.value.projectName}\nClick to filter by this project`,
					onClick: t[1] ||= Ho((e) => r("project-click", u.value.projectName), ["prevent", "stop"])
				}, [t[2] ||= Y("span", { class: "project-glyph" }, "◇", -1), X(" " + F(u.value.projectName), 1)], 10, rc)) : Z("", !0)
			]),
			s.value ? (q(), J("div", ic, [Y("span", null, F(s.value.issuesClosed ?? 0) + "/" + F(f.value) + " issues", 1), Y("span", null, F(s.value.percentComplete ?? 0) + "% complete", 1)])) : Z("", !0),
			u.value.targetDate ? (q(), J("div", ac, [Y("span", null, "target: " + F(u.value.targetDate), 1)])) : Z("", !0)
		], 8, Qs)) : i.value === "loading" ? (q(), J("p", oc, " Loading " + F(c.value), 1)) : (q(), J("div", sc, [Y("p", cc, F(c.value || "epic"), 1), Y("p", lc, F(a.value ?? "epic not found"), 1)]))], 8, Zs));
	}
}), dc = ".epic-card[data-v-2582b594]{display:block}.epic-card-body[data-v-2582b594]{border:1px solid var(--ink-rule,#d0cfc8);gap:6px;padding:10px 12px;display:grid}.epic-card-title[data-v-2582b594]{align-items:baseline;gap:8px;min-width:0;display:flex}.epic-pill[data-v-2582b594],.epic-meta[data-v-2582b594],.epic-line[data-v-2582b594]{font-family:var(--mono,monospace)}.epic-pill[data-v-2582b594]{border:1px solid;padding:1px 8px;font-size:10px}.epic-project[data-v-2582b594]{font-family:var(--mono,monospace);color:var(--accent-blue,#1d55a6);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px solid;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-project[data-v-2582b594]:hover{background:var(--paper-tint,#f2efe7)}.epic-project.active[data-v-2582b594]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-color:var(--ink,#111)}.epic-owner+.epic-project[data-v-2582b594]{margin-left:4px}.epic-project .project-glyph[data-v-2582b594]{font-size:10px}.epic-owner[data-v-2582b594]{font-family:var(--mono,monospace);color:var(--ink-soft,#2c2b28);cursor:pointer;font-size:11px;font:inherit;font-family:var(--mono,monospace);background:0 0;border:1px dashed;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-owner[data-v-2582b594]:hover{background:var(--paper-tint,#f2efe7)}.epic-owner.active[data-v-2582b594]{background:var(--ink,#111);color:var(--paper,#fffdf8);border-style:solid;border-color:var(--ink,#111)}.epic-owner.active .owner-glyph[data-v-2582b594]{color:inherit}.epic-owner .owner-glyph[data-v-2582b594]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.epic-owner[data-author-kind=agent][data-v-2582b594]{color:#6b3fa0}.epic-owner[data-author-kind=bot][data-v-2582b594]{color:var(--accent-blue,#1d55a6)}.epic-owner[data-author-kind=credential][data-v-2582b594]{color:var(--accent-yellow,#c89300)}.epic-owner[data-author-kind=team][data-v-2582b594]{color:var(--accent-teal,#087f6f)}.epic-state-good[data-v-2582b594]{color:var(--ink-go,#008873)}.epic-state-warn[data-v-2582b594]{color:var(--ink-warn,#c2410c)}.epic-state-muted[data-v-2582b594],.epic-meta[data-v-2582b594],.muted[data-v-2582b594]{color:var(--ink-faint,#888)}.epic-title-link[data-v-2582b594]{min-width:0;color:inherit;font-family:var(--display,system-ui);overflow-wrap:anywhere;font-weight:600}.epic-meta[data-v-2582b594]{flex-wrap:wrap;gap:8px;font-size:11px;display:flex}.epic-line[data-v-2582b594]{margin:4px 0;font-size:12px}.warn[data-v-2582b594]{color:var(--ink-warn,#c2410c)}", fc = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, pc = /* @__PURE__ */ fc(uc, [["styles", [dc]], ["__scopeId", "data-v-2582b594"]]);
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/issue-rows.ts
function mc(e, t = "") {
	return typeof e == "string" ? e : t;
}
function hc(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function gc(e) {
	let t = typeof e == "string" ? e.toUpperCase() : "";
	return t === "CLOSED" ? "CLOSED" : t === "REOPENED" ? "REOPENED" : "OPEN";
}
function _c(e) {
	return typeof e == "string" ? e.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/[^/]+)?$/)?.[1] ?? null : null;
}
async function vc(t) {
	let n = await e("ext_issues", "issues", "by-ref-issue", t);
	if (!n.ok || !n.value || typeof n.value != "object") return null;
	let r = n.value, i = hc(r.number), a = _c(r.repository), o = i !== null && a ? l("issues", `/${a}/${i}`) : null;
	return {
		ref: t,
		id: mc(r.id),
		number: i,
		title: mc(r.title, "(untitled)"),
		state: gc(r.state),
		projectName: typeof r.projectName == "string" ? r.projectName : null,
		labels: Array.isArray(r.labels) ? r.labels.filter((e) => typeof e == "string") : [],
		authorRef: typeof r.authorRef == "string" ? r.authorRef : null,
		href: o
	};
}
async function yc(e) {
	return (await Promise.all(e.map((e) => vc(e)))).filter((e) => e !== null);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/epic-detail-styles.ts
var bc = "ext-epics-detail-styles", xc = "\n.epic-detail {\n  max-width: 880px;\n  display: grid;\n  gap: 24px;\n  padding: 24px 0 48px;\n  font-family: var(--serif, \"iA Writer Quattro\", Georgia, serif);\n}\n\n.epic-detail .epic-line,\n.epic-detail .epic-meta,\n.epic-detail .epic-progress,\n.epic-detail .epic-issues-list,\n.epic-detail .epic-actions,\n.epic-detail .epic-actions-heading,\n.epic-detail .epic-kbd-hint,\n.epic-detail .epic-section-count {\n  font-family: var(--mono, ui-monospace, \"IBM Plex Mono\", monospace);\n}\n\n.epic-header { display: grid; gap: 6px; }\n\n.epic-overline {\n  margin: 0;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10px;\n  letter-spacing: 0.18em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-title {\n  margin: 0;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  font-size: 28px;\n  letter-spacing: -0.01em;\n  line-height: 1.15;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  align-items: center;\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-pill {\n  padding: 1px 8px;\n  border: 1px solid currentColor;\n  text-transform: lowercase;\n}\n\n.epic-state-good { color: var(--ink-go, #087f6f); }\n.epic-state-warn { color: var(--ink-warn, #c2410c); }\n.epic-state-muted, .muted { color: var(--ink-faint, #888); }\n.epic-line.warn { color: var(--ink-warn, #c2410c); }\n\n.epic-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 1px 7px;\n  border-radius: 2px;\n  font-size: 11px;\n  line-height: 16px;\n  white-space: nowrap;\n}\n\n.epic-chip .chip-glyph {\n  font-size: 10px;\n}\n\n.epic-chip.tone-blue {\n  background: var(--chip-blue-bg, #e5edf7);\n  color: var(--chip-blue-ink, #1f3b6a);\n}\n.epic-chip.tone-teal {\n  background: var(--chip-teal-bg, #d8f0eb);\n  color: var(--chip-teal-ink, #0c5f54);\n}\n.epic-chip.tone-grey {\n  background: var(--chip-grey-bg, #ececea);\n  color: var(--chip-grey-ink, #4a4a45);\n}\n.epic-chip.compact {\n  padding: 0 6px;\n  font-size: 10.5px;\n}\n\n.epic-meta-time {\n  margin-left: auto;\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n/* \"Routed to\" panel — CUE Project ownership surfaced on the\n * detail page. Same paper-card aesthetic as the progress\n * panel above; owner chips carry classifier-glyph borders\n * so the visual vocabulary matches IssueDetail iter 59. */\n.epic-routed {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-routed-head {\n  display: flex;\n  align-items: baseline;\n  gap: 10px;\n}\n\n.epic-routed-label {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-project {\n  margin-left: auto;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--accent-blue, #1d55a6);\n  text-decoration: none;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-project:hover {\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n\n/* iter 69 — inline Project picker on EpicDetail. Mirrors the\n * iter 68 IssueDetail select styling so both detail surfaces\n * read identically. */\n.epic-project-select {\n  width: 100%;\n  border: 1.5px solid var(--ink-rule, #d8d6cf);\n  background: var(--paper, #fffdf8);\n  color: var(--ink, #111);\n  padding: 8px 10px;\n  font-family: var(--mono, monospace);\n  font-size: 13px;\n  outline: none;\n  transition: border-color 120ms ease;\n}\n\n.epic-project-select:focus {\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-project-select:disabled {\n  cursor: wait;\n  opacity: 0.55;\n}\n\n.epic-routed-list {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-routed-owner {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 2px 8px;\n  border: 1px solid currentColor;\n  color: var(--ink, #111);\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-owner .chip-glyph {\n  font-family: var(--display, system-ui);\n  font-size: 12px;\n  line-height: 1;\n}\n\n.epic-routed-owner[data-author-kind=\"team\"]       { color: var(--accent-teal, #087f6f); }\n.epic-routed-owner[data-author-kind=\"human\"]      { color: var(--ink, #111); }\n.epic-routed-owner[data-author-kind=\"agent\"]      { color: #6b3fa0; }\n.epic-routed-owner[data-author-kind=\"bot\"]        { color: var(--accent-blue, #1d55a6); }\n.epic-routed-owner[data-author-kind=\"credential\"] { color: var(--accent-yellow, #c89300); }\n\n.epic-routed-source {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-source code {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  padding: 0 4px;\n  background: var(--paper-tint, #f2efe7);\n  color: var(--ink-soft, #2c2b28);\n}\n\n.epic-progress-head {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  align-items: baseline;\n  font-size: 12px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-progress-stat {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 4px;\n}\n\n.epic-progress-stat strong {\n  font-weight: 600;\n  color: var(--ink, #1a1a1a);\n  font-size: 15px;\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-progress-stat .stat-of {\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress-stat .stat-label {\n  color: var(--ink-faint, #6e6a62);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-progress-sep {\n  color: var(--ink-rule, #c8c6bf);\n  padding: 0 2px;\n}\n\n.epic-progress-bar {\n  height: 4px;\n  background: var(--ink-rule-soft, #ebe9e2);\n  border-radius: 2px;\n  overflow: hidden;\n}\n\n.epic-progress-fill {\n  height: 100%;\n  background: var(--ink-go, #087f6f);\n  transition: width 200ms ease;\n}\n\n.epic-body {\n  margin: 0;\n  font-size: 15.5px;\n  line-height: 1.6;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-body.muted {\n  padding: 12px 14px;\n  border: 1px dashed var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  color: var(--ink-faint, #888);\n  font-size: 12px;\n  font-family: var(--mono, ui-monospace, monospace);\n}\n\n.epic-body.prose h1,\n.epic-body.prose h2,\n.epic-body.prose h3,\n.epic-body.prose h4 {\n  margin: 16px 0 6px;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  line-height: 1.2;\n  letter-spacing: -0.005em;\n}\n\n.epic-body.prose h1 { font-size: 20px; }\n.epic-body.prose h2 { font-size: 17px; }\n.epic-body.prose h3 { font-size: 15px; }\n\n.epic-body.prose p {\n  margin: 8px 0;\n}\n\n.epic-body.prose ul {\n  margin: 6px 0 6px 20px;\n  padding: 0;\n}\n\n.epic-body.prose li {\n  margin: 2px 0;\n}\n\n.epic-body.prose code {\n  font-family: var(--mono, ui-monospace, monospace);\n  background: var(--ink-rule-soft, #efeee8);\n  padding: 0 4px;\n  border-radius: 2px;\n  font-size: 0.9em;\n}\n\n.epic-body.prose pre {\n  background: var(--surface-2, #f7f6f1);\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  padding: 10px 12px;\n  overflow-x: auto;\n  font-size: 12.5px;\n  font-family: var(--mono, ui-monospace, monospace);\n}\n\n.epic-body.prose pre code {\n  background: transparent;\n  padding: 0;\n}\n\n.epic-section { display: grid; gap: 8px; }\n\n.epic-section-head {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding-bottom: 6px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-section h3 {\n  margin: 0;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  font-size: 13px;\n  letter-spacing: -0.005em;\n}\n\n.epic-section-count {\n  margin-left: auto;\n  font-size: 11px;\n  color: var(--ink-faint, #888);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-section-count [data-zero=\"true\"] { color: var(--ink-rule, #c8c6bf); }\n.epic-section-count .sep { padding: 0 2px; color: var(--ink-rule, #c8c6bf); }\n\n.epic-issues-list {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n}\n\n.epic-issue-row {\n  display: grid;\n  grid-template-columns: 18px 56px 1fr auto;\n  align-items: center;\n  gap: 10px;\n  padding: 6px 8px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n  font-size: 12.5px;\n  cursor: pointer;\n  outline: none;\n}\n\n.epic-issue-row:last-child { border-bottom: none; }\n\n.epic-issue-row:hover,\n.epic-issue-row.focused,\n.epic-issue-row:focus {\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-issue-row .row-state {\n  text-align: center;\n  font-size: 11px;\n}\n\n.epic-issue-row .row-state[data-state=\"OPEN\"],\n.epic-issue-row .row-state[data-state=\"REOPENED\"] {\n  color: var(--ink-go, #087f6f);\n}\n.epic-issue-row .row-state[data-state=\"CLOSED\"] {\n  color: var(--ink-faint, #888);\n}\n\n.epic-issue-row.state-closed {\n  color: var(--ink-faint, #888);\n}\n.epic-issue-row.state-closed .row-title {\n  text-decoration: line-through;\n  text-decoration-color: var(--ink-rule, #c8c6bf);\n}\n\n.epic-issue-row .row-number {\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-issue-row .row-title {\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-size: 13px;\n  color: var(--ink, #1a1a1a);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.epic-issue-row .row-trailing {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: nowrap;\n}\n\n.row-author {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.row-author[data-author-kind=\"agent\"] { color: var(--ink-go, #087f6f); }\n.row-author[data-author-kind=\"credential\"],\n.row-author[data-author-kind=\"bot\"] { color: var(--ink-warn, #c2410c); }\n\n.epic-kbd-hint {\n  margin: 0;\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.epic-kbd-hint kbd {\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10px;\n  padding: 0 4px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-actions-section {\n  display: grid;\n  gap: 8px;\n  padding-top: 12px;\n  border-top: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-actions-heading {\n  margin: 0;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10.5px;\n  letter-spacing: 0.16em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n  font-weight: 500;\n}\n\n.epic-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-actions button {\n  padding: 4px 12px;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 11px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n  color: var(--ink, #1a1a1a);\n  cursor: pointer;\n  letter-spacing: 0.01em;\n}\n\n.epic-actions button:hover:not(:disabled) {\n  background: var(--ink, #1a1a1a);\n  color: var(--surface, #ffffff);\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-actions button:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n";
function Sc() {
	if (typeof document > "u" || document.getElementById(bc)) return;
	let e = document.createElement("style");
	e.id = bc, e.textContent = xc, document.head.appendChild(e);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/CustomElementHost.vue
var Cc = /* @__PURE__ */ fc(/* @__PURE__ */ _r({
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
		let t = e, n = /* @__PURE__ */ V(null), r = null;
		Mr(i), lr(() => [
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
		return (e, t) => (q(), J("span", {
			ref_key: "mount",
			ref: n,
			class: "custom-element-host"
		}, null, 512));
	}
}), [["styles", [".custom-element-host[data-v-cf896d02]{display:contents}"]], ["__scopeId", "data-v-cf896d02"]]);
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/project-policy.ts
async function wc(e) {
	return { ownerRefs: await gs(e) };
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicDetail.vue?vue&type=script&setup=true&lang.ts
var Tc = ["data-state", "data-epic-id"], Ec = {
	key: 0,
	class: "epic-line muted"
}, Dc = {
	key: 1,
	class: "epic-line warn"
}, Oc = {
	key: 2,
	class: "epic-line warn"
}, kc = { class: "epic-header" }, Ac = { class: "epic-title" }, jc = { class: "epic-meta" }, Mc = ["title"], Nc = {
	key: 1,
	class: "epic-chip tone-grey",
	title: "Owner"
}, Pc = {
	key: 2,
	class: "epic-chip tone-grey"
}, Fc = {
	key: 3,
	class: "epic-meta-time"
}, Ic = {
	key: 0,
	class: "epic-progress",
	"data-smoke": "epic-progress"
}, Lc = { class: "epic-progress-head" }, Rc = { class: "epic-progress-stat" }, zc = { class: "stat-of" }, Bc = { class: "epic-progress-stat" }, Vc = {
	key: 0,
	class: "epic-progress-sep"
}, Hc = {
	key: 1,
	class: "epic-progress-stat"
}, Uc = ["aria-valuenow"], Wc = {
	class: "epic-routed",
	"data-smoke": "epic-project-picker"
}, Gc = { class: "epic-routed-head" }, Kc = ["href", "title"], qc = ["value", "disabled"], Jc = ["value"], Yc = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, Xc = {
	key: 1,
	class: "epic-routed",
	"data-smoke": "epic-project-owners"
}, Zc = { class: "epic-routed-head" }, Qc = ["href", "title"], $c = { class: "epic-routed-list" }, el = ["data-author-kind", "title"], tl = { class: "chip-glyph" }, nl = { class: "epic-routed-source" }, rl = ["data-epic-id", "innerHTML"], il = {
	key: 3,
	class: "epic-body muted"
}, al = {
	class: "epic-section",
	"data-smoke": "epic-issues"
}, ol = { class: "epic-section-head" }, sl = { class: "epic-section-count" }, cl = ["data-zero"], ll = ["data-zero"], ul = {
	key: 0,
	class: "epic-line muted"
}, dl = {
	key: 1,
	class: "epic-issues-list",
	"data-smoke": "epic-issues-list"
}, fl = [
	"onClick",
	"onKeydown",
	"onFocus"
], pl = ["data-state"], ml = { key: 0 }, hl = { key: 1 }, gl = { class: "row-number" }, _l = { class: "row-title" }, vl = { class: "row-trailing" }, yl = ["title"], bl = ["data-author-kind", "title"], xl = { class: "author-glyph" }, Sl = {
	key: 2,
	class: "epic-kbd-hint muted"
}, Cl = { class: "epic-actions-section" }, wl = { class: "epic-actions" }, Tl = ["disabled", "onClick"], El = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, Dl = { class: "epic-comments" }, Ol = /* @__PURE__ */ _r({
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
		], r = /* @__PURE__ */ V("idle"), i = /* @__PURE__ */ V("idle"), a = /* @__PURE__ */ V(null), o = /* @__PURE__ */ V(null), s = /* @__PURE__ */ V(t.epic ?? null), c = /* @__PURE__ */ V(null), l = /* @__PURE__ */ V([]), u = /* @__PURE__ */ V(null), d = $(() => t.client ?? t.comtryaClient), f = $(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3"), p = $(() => t.id ?? t.routeParams?.params?.id ?? ""), m = $(() => t.epic ? Bs(t.epic) : `comtrya://epic/${p.value}`), h = $(() => s.value ?? t.epic ?? null), g = $(() => Us(h.value?.state)), _ = $(() => n.filter((e) => e !== h.value?.state)), v = $(() => (c.value?.issuesOpen ?? 0) + (c.value?.issuesClosed ?? 0)), y = $(() => Math.max(0, Math.min(100, c.value?.percentComplete ?? 0))), ee = $(() => l.value.filter((e) => e.state !== "CLOSED").length), te = $(() => l.value.filter((e) => e.state === "CLOSED").length), ne = $(() => ls(h.value?.bodyMarkdown ?? "")), re = $(() => d.value && !!p.value), ie = $(() => {
			let e = h.value?.ownerRef;
			return e ? e.startsWith("comtrya://user/") ? e.slice(15) : e.startsWith("comtrya://agent/") ? `${e.slice(16)} (agent)` : e : null;
		}), ae = $(() => he(h.value?.createdAt)), b = /* @__PURE__ */ V(null), oe = $(() => b.value?.ownerRefs ?? []);
		lr(() => h.value?.projectName ?? "", async (e) => {
			if (!e) {
				b.value = null;
				return;
			}
			try {
				b.value = await wc(e);
			} catch {
				b.value = null;
			}
		}, { immediate: !0 });
		let se = fs, ce = /* @__PURE__ */ V([]), le = /* @__PURE__ */ V("idle"), x = /* @__PURE__ */ V(null);
		Mr(async () => {
			try {
				ce.value = await hs();
			} catch {
				ce.value = [];
			}
		});
		async function ue(e) {
			let t = e.target;
			if (!t || !h.value) return;
			let n = h.value, r = t.value || null;
			if ((n.projectName ?? null) === r) return;
			le.value = "submitting", x.value = null;
			let i = n.projectName ?? null;
			s.value = {
				...n,
				projectName: r
			};
			try {
				s.value = await Ls(n.id, r);
			} catch (e) {
				s.value = {
					...n,
					projectName: i
				}, t.value = i ?? "", x.value = e instanceof Error ? e.message : String(e);
			} finally {
				le.value = "idle";
			}
		}
		Mr(() => {
			Sc(), fe();
		});
		let de = (e) => {
			if (l.value.length === 0) return;
			let t = u.value === null ? 0 : Math.max(0, Math.min(l.value.length - 1, u.value + e));
			u.value = t, Wn(() => me(t));
		};
		ts({
			j: (e) => {
				e.preventDefault(), de(1);
			},
			ArrowDown: (e) => {
				e.preventDefault(), de(1);
			},
			k: (e) => {
				e.preventDefault(), de(-1);
			},
			ArrowUp: (e) => {
				e.preventDefault(), de(-1);
			},
			Enter: (e) => {
				if (u.value === null) return;
				let t = l.value[u.value];
				t && (e.preventDefault(), w(t));
			}
		}), lr(() => [
			d.value,
			t.epic,
			f.value,
			p.value
		], () => void fe());
		async function fe() {
			if (t.epic) {
				s.value = t.epic, r.value = "ready", a.value = null, await pe();
				return;
			}
			if (!re.value || !d.value) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = "epic-detail: missing params";
				return;
			}
			r.value = "loading", a.value = null;
			try {
				s.value = await js(d.value, m.value), r.value = s.value ? "ready" : "empty", await pe();
			} catch (e) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function pe() {
			if (!d.value || !h.value) {
				c.value = null, l.value = [];
				return;
			}
			let e = Bs(h.value), [t, n] = await Promise.allSettled([Ns(d.value, e), Ps(d.value, e)]);
			c.value = t.status === "fulfilled" ? t.value : null, l.value = await yc(n.status === "fulfilled" ? n.value : []), l.value.sort((e, t) => {
				let n = e.state !== "CLOSED";
				return n === (t.state !== "CLOSED") ? (t.number ?? 0) - (e.number ?? 0) : n ? -1 : 1;
			});
		}
		async function S(e) {
			if (!(!d.value || !h.value)) {
				i.value = "submitting", o.value = null;
				try {
					s.value = await Fs(d.value, h.value.id, e), await pe();
				} catch (e) {
					o.value = e instanceof Error ? e.message : String(e);
				} finally {
					i.value = "idle";
				}
			}
		}
		function C(e) {
			return e.toLowerCase().replace("_", " ");
		}
		function w(e) {
			e.href && window.location.assign(e.href);
		}
		function me(e) {
			let t = document.querySelector(".epic-detail [data-smoke=\"epic-issues-list\"]");
			t && t.querySelectorAll(".epic-issue-row")[e]?.focus();
		}
		function he(e) {
			if (!e) return null;
			let t = new Date(e).getTime();
			if (!Number.isFinite(t)) return null;
			let n = Date.now() - t, r = 6e4, i = 60 * r, a = 24 * i;
			return n < r ? "just now" : n < i ? `${Math.floor(n / r)}m ago` : n < a ? `${Math.floor(n / i)}h ago` : n < 30 * a ? `${Math.floor(n / a)}d ago` : new Date(e).toISOString().slice(0, 10);
		}
		return (e, t) => (q(), J("main", {
			class: "epic-detail",
			"data-state": r.value,
			"data-epic-id": h.value?.id,
			"data-smoke": "epic-detail"
		}, [r.value === "loading" ? (q(), J("p", Ec, "Loading epic")) : r.value === "error" ? (q(), J("p", Dc, F(a.value), 1)) : h.value ? (q(), J(K, { key: 3 }, [
			Y("header", kc, [
				t[2] ||= Y("p", { class: "epic-overline" }, "epic", -1),
				Y("h1", Ac, F(h.value.title), 1),
				Y("div", jc, [
					Y("span", { class: Ge(["epic-pill", g.value.className]) }, F(g.value.label), 3),
					h.value.projectName ? (q(), J("span", {
						key: 0,
						class: "epic-chip tone-blue",
						title: `Scoped to project ${h.value.projectName}`
					}, [t[0] ||= Y("span", { class: "chip-glyph" }, "◇", -1), X(F(h.value.projectName), 1)], 8, Mc)) : Z("", !0),
					(q(!0), J(K, null, Hr(h.value.labels, (e) => (q(), la(H(xs), {
						key: e,
						name: e
					}, null, 8, ["name"]))), 128)),
					ie.value ? (q(), J("span", Nc, [t[1] ||= Y("span", { class: "chip-glyph" }, "@", -1), X(F(ie.value), 1)])) : Z("", !0),
					h.value.targetDate ? (q(), J("span", Pc, " target " + F(h.value.targetDate), 1)) : Z("", !0),
					ae.value ? (q(), J("span", Fc, "opened " + F(ae.value), 1)) : Z("", !0)
				])
			]),
			c.value || l.value.length > 0 ? (q(), J("section", Ic, [Y("div", Lc, [
				Y("span", Rc, [
					Y("strong", null, F(c.value?.issuesClosed ?? te.value), 1),
					Y("span", zc, "/ " + F(v.value || l.value.length), 1),
					t[3] ||= Y("span", { class: "stat-label" }, "closed", -1)
				]),
				t[6] ||= Y("span", { class: "epic-progress-sep" }, "·", -1),
				Y("span", Bc, [Y("strong", null, F(y.value), 1), t[4] ||= Y("span", { class: "stat-label" }, "% complete", -1)]),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (q(), J("span", Vc, "·")) : Z("", !0),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (q(), J("span", Hc, [Y("strong", null, F(c.value?.childEpicsOpen ?? 0), 1), t[5] ||= Y("span", { class: "stat-label" }, "child epics open", -1)])) : Z("", !0)
			]), Y("div", {
				class: "epic-progress-bar",
				"aria-valuenow": y.value,
				"aria-valuemin": "0",
				"aria-valuemax": "100"
			}, [Y("div", {
				class: "epic-progress-fill",
				style: Be({ width: y.value + "%" })
			}, null, 4)], 8, Uc)])) : Z("", !0),
			Y("section", Wc, [
				Y("header", Gc, [t[7] ||= Y("span", { class: "epic-routed-label" }, "Project", -1), h.value.projectName ? (q(), J("a", {
					key: 0,
					href: `/x/epics/?project=${encodeURIComponent(h.value.projectName)}`,
					class: "epic-routed-project",
					title: `Filter epics to project ${h.value.projectName}`
				}, "◇ " + F(h.value.projectName), 9, Kc)) : Z("", !0)]),
				Y("select", {
					class: "epic-project-select",
					"data-smoke": "epic-project-select",
					value: h.value.projectName ?? "",
					disabled: le.value === "submitting",
					onChange: ue
				}, [t[8] ||= Y("option", { value: "" }, "— no project —", -1), (q(!0), J(K, null, Hr(ce.value, (e) => (q(), J("option", {
					key: e.name,
					value: e.name ?? ""
				}, F(e.name), 9, Jc))), 128))], 40, qc),
				x.value ? (q(), J("p", Yc, F(x.value), 1)) : Z("", !0),
				t[9] ||= Y("p", { class: "epic-routed-source" }, [
					X(" Stamps "),
					Y("code", null, "projectName"),
					X(" on this epic. Lights up workspace per-Project counts. ")
				], -1)
			]),
			h.value.projectName && oe.value.length > 0 ? (q(), J("section", Xc, [
				Y("header", Zc, [t[10] ||= Y("span", { class: "epic-routed-label" }, "Routed to", -1), Y("a", {
					href: `/x/epics/?project=${encodeURIComponent(h.value.projectName)}`,
					class: "epic-routed-project",
					title: `Filter epics to project ${h.value.projectName}`
				}, "◇ " + F(h.value.projectName), 9, Qc)]),
				Y("ul", $c, [(q(!0), J(K, null, Hr(oe.value, (e) => (q(), J("li", {
					key: e,
					class: "epic-routed-owner",
					"data-author-kind": H(se)(e).kind,
					title: e
				}, [Y("span", tl, F(H(se)(e).glyph), 1), X(" " + F(H(se)(e).label), 1)], 8, el))), 128))]),
				Y("p", nl, [
					t[11] ||= X(" From ", -1),
					t[12] ||= Y("code", null, "package comtrya", -1),
					X(" · projects." + F(h.value.projectName) + ".owners ", 1)
				])
			])) : Z("", !0),
			ne.value ? (q(), J("article", {
				key: 2,
				class: "epic-body prose",
				"data-epic-id": h.value.id,
				"data-smoke": "epic-detail-main",
				innerHTML: ne.value
			}, null, 8, rl)) : (q(), J("p", il, "No description yet.")),
			Y("section", al, [
				Y("header", ol, [t[16] ||= Y("h3", null, "Issues in this epic", -1), Y("span", sl, [
					Y("span", { "data-zero": ee.value === 0 }, F(ee.value), 9, cl),
					t[13] ||= X(" open ", -1),
					t[14] ||= Y("span", { class: "sep" }, "·", -1),
					Y("span", { "data-zero": te.value === 0 }, F(te.value), 9, ll),
					t[15] ||= X(" closed ", -1)
				])]),
				l.value.length === 0 ? (q(), J("p", ul, " No issues linked yet. Link issues via the issue's \"part of epic\" relation. ")) : (q(), J("ul", dl, [(q(!0), J(K, null, Hr(l.value, (e, n) => (q(), J("li", {
					key: e.ref,
					class: Ge(["epic-issue-row", [`state-${e.state.toLowerCase()}`, { focused: u.value === n }]]),
					tabindex: "0",
					onClick: (t) => w(e),
					onKeydown: [Wo(Ho((t) => w(e), ["prevent"]), ["enter"]), Wo(Ho((t) => w(e), ["prevent"]), ["space"])],
					onFocus: (e) => u.value = n
				}, [
					Y("span", {
						class: "row-state",
						"data-state": e.state
					}, [e.state === "CLOSED" ? (q(), J("span", ml, "●")) : (q(), J("span", hl, "○"))], 8, pl),
					Y("span", gl, "#" + F(e.number ?? "—"), 1),
					Y("span", _l, F(e.title), 1),
					Y("span", vl, [
						e.projectName ? (q(), J("span", {
							key: 0,
							class: "epic-chip tone-blue compact",
							title: e.projectName
						}, [t[17] ||= Y("span", { class: "chip-glyph" }, "◇", -1), X(F(e.projectName), 1)], 8, yl)) : Z("", !0),
						(q(!0), J(K, null, Hr(e.labels, (e) => (q(), la(H(xs), {
							key: e,
							name: e
						}, null, 8, ["name"]))), 128)),
						e.authorRef ? (q(), J("span", {
							key: 1,
							class: "row-author",
							"data-author-kind": H(fs)(e.authorRef).kind,
							title: e.authorRef
						}, [Y("span", xl, F(H(fs)(e.authorRef).glyph), 1), X(" " + F(H(fs)(e.authorRef).label), 1)], 8, bl)) : Z("", !0)
					])
				], 42, fl))), 128))])),
				l.value.length > 0 ? (q(), J("p", Sl, [...t[18] ||= [
					Y("kbd", null, "j", -1),
					X(" / ", -1),
					Y("kbd", null, "k", -1),
					X(" move · ", -1),
					Y("kbd", null, "↵", -1),
					X(" open ", -1)
				]])) : Z("", !0)
			]),
			Y("section", Cl, [
				t[19] ||= Y("h3", { class: "epic-actions-heading" }, "Change state", -1),
				Y("div", wl, [(q(!0), J(K, null, Hr(_.value, (e) => (q(), J("button", {
					key: e,
					type: "button",
					disabled: i.value === "submitting",
					onClick: (t) => S(e)
				}, " mark " + F(C(e)), 9, Tl))), 128))]),
				o.value ? (q(), J("p", El, F(o.value), 1)) : Z("", !0)
			]),
			Y("section", Dl, [ma(Cc, {
				tag: "comtrya-comment-thread",
				attributes: { target: H(Bs)(h.value) },
				properties: {
					target: H(Bs)(h.value),
					comtryaClient: d.value
				}
			}, null, 8, ["attributes", "properties"])])
		], 64)) : (q(), J("p", Oc, " No epic " + F(p.value || "?") + " in " + F(f.value), 1))], 8, Tc));
	}
}), kl = ["data-state"], Al = { class: "epics-list-header" }, jl = ["href"], Ml = {
	key: 0,
	class: "epics-controls"
}, Nl = {
	class: "epics-filter-row",
	role: "tablist",
	"aria-label": "Filter epics by state"
}, Pl = ["aria-selected", "onClick"], Fl = { class: "count" }, Il = { class: "epics-search" }, Ll = {
	key: 1,
	class: "epics-query-chips",
	"data-smoke": "epics-query-chips",
	"aria-label": "Parsed search filters"
}, Rl = ["title"], zl = {
	key: 2,
	class: "epics-owner-filter",
	"data-smoke": "epics-owner-filter"
}, Bl = ["title"], Vl = {
	key: 3,
	class: "epics-project-filter",
	"data-smoke": "epics-project-filter"
}, Hl = ["title"], Ul = ["data-busy"], Wl = ["placeholder", "disabled"], Gl = {
	key: 0,
	class: "quick-add-status"
}, Kl = ["title"], ql = {
	key: 4,
	class: "epic-line warn",
	role: "alert"
}, Jl = {
	key: 5,
	class: "epics-bulk-bar",
	"data-smoke": "epics-bulk-bar"
}, Yl = { class: "count" }, Xl = { class: "bulk-reproject" }, Zl = ["disabled"], Ql = ["value"], $l = ["disabled"], eu = {
	key: 6,
	class: "epic-line warn",
	role: "alert"
}, tu = {
	key: 7,
	class: "epic-line muted"
}, nu = {
	key: 8,
	class: "epic-line warn"
}, ru = {
	key: 9,
	class: "epic-line muted"
}, iu = {
	key: 10,
	class: "epic-line muted"
}, au = {
	key: 11,
	class: "epics-list-items",
	role: "listbox",
	"aria-label": "Epic list"
}, ou = ["aria-selected", "onMouseenter"], su = {
	key: 12,
	class: "epics-list-foot"
}, cu = /* @__PURE__ */ fc(/* @__PURE__ */ _r({
	__name: "EpicsList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epics: { type: [Array, null] },
		workspaceId: {
			default: Rs,
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
		]), i = /* @__PURE__ */ V("idle"), a = /* @__PURE__ */ V(null), o = /* @__PURE__ */ V(t.epics ?? []), s = /* @__PURE__ */ V("ALL"), c = /* @__PURE__ */ V(""), l = /* @__PURE__ */ V(""), u = /* @__PURE__ */ V(""), d = $(() => {
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
			let e = Hs(t.workspaceId);
			return t.projectName ? `${e}&projectName=${encodeURIComponent(t.projectName)}` : e;
		}), se = /* @__PURE__ */ V(""), ce = /* @__PURE__ */ V(!1), le = /* @__PURE__ */ V(null), x = $(() => t.projectName ?? _.value ?? null), ue = $(() => {
			let e = x.value;
			return e ? `New epic in ${e}…` : "New epic…";
		});
		function de() {
			document.querySelector("[data-smoke=\"epics-quick-add\"]")?.focus();
		}
		function fe(e) {
			e.preventDefault(), se.value = "", le.value = null, e.target?.blur();
		}
		async function pe() {
			let e = se.value.trim();
			if (!(!e || ce.value)) {
				ce.value = !0, le.value = null;
				try {
					let n = await Is(b.value, {
						workspaceId: t.workspaceId,
						title: e,
						bodyMarkdown: "",
						projectName: x.value
					});
					o.value.some((e) => e.id === n.id) || (o.value = [n, ...o.value]), se.value = "", i.value = "ready", ye(), Wn(de);
				} catch (e) {
					le.value = e instanceof Error ? e.message : String(e);
				} finally {
					ce.value = !1;
				}
			}
		}
		let S = /* @__PURE__ */ V(0), C = /* @__PURE__ */ V(/* @__PURE__ */ new Set()), w = /* @__PURE__ */ V(!1), me = /* @__PURE__ */ V(null), he = /* @__PURE__ */ V([]);
		Mr(async () => {
			try {
				he.value = await hs();
			} catch {
				he.value = [];
			}
		}), lr(v, (e) => {
			S.value >= e.length && (S.value = Math.max(0, e.length - 1));
		});
		function T(e) {
			let t = new Set(C.value);
			t.has(e) ? t.delete(e) : t.add(e), C.value = t;
		}
		function E() {
			C.value = /* @__PURE__ */ new Set(), me.value = null;
		}
		async function ge(e) {
			if (C.value.size === 0 || w.value) return;
			let t = Array.from(C.value);
			w.value = !0, me.value = null;
			try {
				let n = await Promise.allSettled(t.map((t) => Ls(t, e))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
				if (n.forEach((e, n) => {
					let a = t[n];
					e.status === "fulfilled" ? r.set(a, e.value) : i.add(a);
				}), o.value = o.value.map((e) => r.get(e.id) ?? e), C.value = i, i.size > 0) {
					let n = e ?? "(no project)";
					me.value = `${i.size} of ${t.length} reassignments to ${n} failed; retry the remaining selection.`;
				}
			} catch (e) {
				me.value = e instanceof Error ? e.message : String(e);
			} finally {
				w.value = !1;
			}
		}
		function _e(e) {
			let t = e.target;
			if (!t) return;
			let n = t.value, r = n === "__NONE__" ? null : n || null;
			t.value = "", n !== "" && ge(r);
		}
		ts({
			c: (e) => {
				e.preventDefault(), de();
			},
			j: (e) => {
				v.value.length !== 0 && (e.preventDefault(), S.value = Math.min(v.value.length - 1, S.value + 1));
			},
			k: (e) => {
				v.value.length !== 0 && (e.preventDefault(), S.value = Math.max(0, S.value - 1));
			},
			" ": (e) => {
				let t = v.value[S.value];
				t && (e.preventDefault(), T(t.id));
			},
			Escape: (e) => {
				C.value.size !== 0 && (e.preventDefault(), E());
			}
		});
		function D() {
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
		function O() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			s.value === "ALL" ? e.delete("state") : e.set("state", s.value), l.value ? e.set("owner", l.value) : e.delete("owner"), u.value && !t.projectName ? e.set("project", u.value) : e.delete("project");
			let n = c.value.trim();
			n ? e.set("q", n) : e.delete("q");
			let r = e.toString(), i = `${window.location.pathname}${r ? `?${r}` : ""}${window.location.hash}`;
			i !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", i);
		}
		let k = !1;
		function ve() {
			k = !0, D(), Wn(() => {
				k = !1;
			});
		}
		Mr(() => {
			k = !0, D(), k = !1, ye(), window.addEventListener("popstate", ve);
		}), Ir(() => {
			window.removeEventListener("popstate", ve);
		}), lr(() => [
			b.value,
			t.epics,
			t.workspaceId,
			t.state
		], () => void ye()), lr([
			s,
			l,
			u,
			c
		], () => {
			k || O();
		});
		async function ye() {
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
				o.value = await Ms(b.value, {
					workspaceId: t.workspaceId,
					state: t.state
				}), i.value = o.value.length > 0 ? "ready" : "empty";
			} catch (e) {
				o.value = [], i.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		return (r, o) => (q(), J("section", {
			class: "epics-list",
			"data-state": i.value,
			"data-smoke": "epics-list"
		}, [
			Y("header", Al, [Y("h3", null, F(e.title), 1), e.showNewLink ? (q(), J("a", {
				key: 0,
				href: oe.value
			}, "+ new", 8, jl)) : Z("", !0)]),
			d.value.length > 0 ? (q(), J("div", Ml, [Y("div", Nl, [(q(), J(K, null, Hr(n, (e) => Y("button", {
				key: e.id,
				type: "button",
				role: "tab",
				"aria-selected": s.value === e.id,
				class: Ge(["epics-filter", { active: s.value === e.id }]),
				onClick: (t) => s.value = e.id
			}, [Y("span", null, F(e.label), 1), Y("span", Fl, F(ae.value[e.id]), 1)], 10, Pl)), 64))]), Y("label", Il, [rr(Y("input", {
				"data-epics-search": "",
				"onUpdate:modelValue": o[0] ||= (e) => c.value = e,
				type: "search",
				placeholder: "Filter — try is:in-progress · project:<name> · owner:<urn> · text",
				autocomplete: "off"
			}, null, 512), [[zo, c.value]])])])) : Z("", !0),
			y.value.length > 0 ? (q(), J("div", Ll, [(q(!0), J(K, null, Hr(y.value, (e) => (q(), J("span", {
				key: `${e.key}:${e.value || "unknown"}`,
				class: Ge(["query-chip", `tone-${e.tone}`]),
				title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
			}, F(e.label), 11, Rl))), 128)), o[2] ||= Y("span", { class: "query-chips-hint" }, [
				X(" syntax: "),
				Y("code", null, "is:in-progress"),
				X(" · "),
				Y("code", null, "project:<name>"),
				X(" · "),
				Y("code", null, "owner:<urn>")
			], -1)])) : Z("", !0),
			l.value ? (q(), J("div", zl, [
				o[3] ||= Y("span", { class: "prefix" }, "owner", -1),
				Y("span", {
					class: "active-chip",
					title: l.value
				}, F(ie(l.value)), 9, Bl),
				Y("button", {
					type: "button",
					class: "clear",
					onClick: te,
					"aria-label": "Clear owner filter"
				}, "clear ✕")
			])) : Z("", !0),
			u.value && !t.projectName ? (q(), J("div", Vl, [
				o[5] ||= Y("span", { class: "prefix" }, "project", -1),
				Y("span", {
					class: "active-chip",
					title: `Scoped to project ${u.value}`
				}, [o[4] ||= Y("span", { class: "project-glyph" }, "◇", -1), X(" " + F(u.value), 1)], 8, Hl),
				Y("button", {
					type: "button",
					class: "clear",
					onClick: re,
					"aria-label": "Clear project filter"
				}, "clear ✕")
			])) : Z("", !0),
			Y("form", {
				class: "epics-quick-add",
				"data-busy": ce.value ? "true" : "false",
				onSubmit: Ho(pe, ["prevent"])
			}, [
				o[6] ||= Y("span", {
					class: "quick-add-glyph",
					"aria-hidden": "true"
				}, "+", -1),
				rr(Y("input", {
					"onUpdate:modelValue": o[1] ||= (e) => se.value = e,
					"data-smoke": "epics-quick-add",
					type: "text",
					autocomplete: "off",
					placeholder: ue.value,
					disabled: ce.value,
					onKeydown: Wo(fe, ["esc"])
				}, null, 40, Wl), [[zo, se.value]]),
				ce.value ? (q(), J("span", Gl, "creating…")) : x.value ? (q(), J("span", {
					key: 1,
					class: "quick-add-chip tone-blue",
					title: `Stamps projectName = ${x.value} on create`
				}, "◇ " + F(x.value), 9, Kl)) : Z("", !0),
				o[7] ||= Y("span", { class: "quick-add-hint" }, [
					Y("kbd", null, "↵"),
					X(" create · "),
					Y("kbd", null, "esc"),
					X(" clear · "),
					Y("kbd", null, "c"),
					X(" focus ")
				], -1)
			], 40, Ul),
			le.value ? (q(), J("p", ql, F(le.value), 1)) : Z("", !0),
			C.value.size > 0 ? (q(), J("div", Jl, [
				Y("span", Yl, F(C.value.size) + " selected", 1),
				Y("label", Xl, [o[10] ||= Y("span", { class: "bulk-reproject-label" }, "reproject →", -1), Y("select", {
					class: "bulk-reproject-select",
					"data-smoke": "epics-bulk-reproject",
					disabled: w.value,
					onChange: _e
				}, [
					o[8] ||= Y("option", {
						value: "",
						disabled: "",
						selected: ""
					}, "pick project…", -1),
					o[9] ||= Y("option", { value: "__NONE__" }, "— no project —", -1),
					(q(!0), J(K, null, Hr(he.value, (e) => (q(), J("option", {
						key: e.name,
						value: e.name ?? ""
					}, "◇ " + F(e.name), 9, Ql))), 128))
				], 40, Zl)]),
				Y("button", {
					type: "button",
					class: "bulk-clear",
					disabled: w.value,
					onClick: E
				}, [...o[11] ||= [X("clear ", -1), Y("kbd", null, "esc", -1)]], 8, $l),
				o[12] ||= Y("span", { class: "hint" }, [Y("kbd", null, "space"), X(" toggle row ")], -1)
			])) : Z("", !0),
			me.value ? (q(), J("p", eu, F(me.value), 1)) : Z("", !0),
			i.value === "loading" ? (q(), J("p", tu, "Loading epics")) : i.value === "error" ? (q(), J("p", nu, F(a.value), 1)) : d.value.length === 0 ? (q(), J("p", ru, "No epics yet.")) : v.value.length === 0 ? (q(), J("p", iu, " No " + F(s.value.toLowerCase().replace("_", " ")) + " epics in scope. ", 1)) : (q(), J("ul", au, [(q(!0), J(K, null, Hr(v.value, (e, t) => (q(), J("li", {
				key: e.id,
				class: Ge({
					focused: t === S.value,
					selected: C.value.has(e.id)
				}),
				"aria-selected": C.value.has(e.id),
				role: "option",
				onMouseenter: (e) => S.value = t
			}, [ma(pc, {
				epic: e,
				"resource-ref": H(Bs)(e),
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
			])], 42, ou))), 128))])),
			v.value.length > 0 ? (q(), J("footer", su, [...o[13] ||= [
				Y("kbd", null, "j", -1),
				X(),
				Y("kbd", null, "k", -1),
				X(" navigate · ", -1),
				Y("kbd", null, "space", -1),
				X(" select · ", -1),
				Y("kbd", null, "c", -1),
				X(" create ", -1)
			]])) : Z("", !0)
		], 8, kl));
	}
}), [["styles", [".epics-list[data-v-a443eee4]{gap:8px;display:grid}.epics-list-header[data-v-a443eee4]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.epics-list-header h3[data-v-a443eee4]{font-family:var(--display,system-ui);margin:0;font-size:14px}.epics-list-header a[data-v-a443eee4],.epic-line[data-v-a443eee4]{font-family:var(--mono,monospace);font-size:12px}.epics-list-header a[data-v-a443eee4]{color:var(--ink-faint,#888);text-decoration:none}.epics-controls[data-v-a443eee4]{flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:4px;display:flex}.epics-search[data-v-a443eee4]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper,#fffdf8);flex:280px;align-items:center;gap:6px;padding:0 8px;display:inline-flex}.epics-search input[data-v-a443eee4]{font-family:var(--mono,monospace);color:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0;padding:6px 0;font-size:12px}.epics-search input[data-v-a443eee4]::placeholder{color:var(--ink-faint,#68645c)}.epics-query-chips[data-v-a443eee4]{font-family:var(--mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:4px;font-size:11px;display:flex}.epics-query-chips .query-chip[data-v-a443eee4]{letter-spacing:.02em;white-space:nowrap;border:1px solid;align-items:center;padding:1px 7px;display:inline-flex}.epics-query-chips .query-chip.tone-is[data-v-a443eee4]{color:var(--accent-teal,#087f6f)}.epics-query-chips .query-chip.tone-owner[data-v-a443eee4]{color:var(--ink,#111)}.epics-query-chips .query-chip.tone-project[data-v-a443eee4]{color:var(--accent-blue,#1d55a6)}.epics-query-chips .query-chip.tone-unknown[data-v-a443eee4]{color:var(--accent-yellow,#c89300);border-style:dashed}.epics-query-chips .query-chips-hint[data-v-a443eee4]{color:var(--ink-faint,#68645c);letter-spacing:0;margin-left:4px}.epics-query-chips .query-chips-hint code[data-v-a443eee4]{font-family:var(--mono,monospace);background:var(--paper-tint,#f2efe7);color:var(--ink-soft,#2c2b28);padding:0 4px;font-size:11px}.epics-filter-row[data-v-a443eee4]{border:1px solid var(--ink,#111);flex-wrap:wrap;align-self:flex-start;gap:0;display:inline-flex}.epics-filter[data-v-a443eee4]{color:inherit;cursor:pointer;font-family:var(--mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:4px 9px;font-size:11px;display:inline-flex}.epics-filter[data-v-a443eee4]:not(:last-child){border-right:1px solid var(--rule-light,#d8d1c4)}.epics-filter.active[data-v-a443eee4]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.epics-filter .count[data-v-a443eee4]{color:var(--ink-faint,#68645c);font-variant-numeric:tabular-nums}.epics-filter.active .count[data-v-a443eee4]{color:var(--paper-tint,#f2efe7)}.epics-owner-filter[data-v-a443eee4]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-owner-filter .prefix[data-v-a443eee4]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.epics-owner-filter .active-chip[data-v-a443eee4]{border:1px solid var(--ink,#111);color:var(--ink,#111);padding:0 5px}.epics-owner-filter .clear[data-v-a443eee4]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-owner-filter .clear[data-v-a443eee4]:hover{color:var(--ink,#111)}.epics-project-filter[data-v-a443eee4]{border:1px solid var(--rule-light,#d8d1c4);background:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-project-filter .prefix[data-v-a443eee4]{color:var(--ink-faint,#68645c);letter-spacing:.04em;text-transform:lowercase}.epics-project-filter .active-chip[data-v-a443eee4]{color:var(--accent-blue,#1d55a6);border:1px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.epics-project-filter .project-glyph[data-v-a443eee4]{font-size:10px}.epics-project-filter .clear[data-v-a443eee4]{color:var(--ink-faint,#68645c);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-project-filter .clear[data-v-a443eee4]:hover{color:var(--ink,#111)}.epics-quick-add[data-v-a443eee4]{border:1.5px solid var(--rule-light,#d8d1c4);background:var(--paper,#fffdf8);align-items:center;gap:8px;padding:6px 10px 6px 6px;transition:border-color .12s;display:flex}.epics-quick-add[data-v-a443eee4]:focus-within{border-color:var(--ink,#111)}.epics-quick-add[data-busy=true][data-v-a443eee4]{opacity:.85;border-style:dashed}.epics-quick-add .quick-add-glyph[data-v-a443eee4]{width:22px;height:22px;font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);border:1px solid;border-radius:2px;place-items:center;font-size:13px;display:inline-grid}.epics-quick-add input[data-v-a443eee4]{min-width:0;color:inherit;font-family:var(--display,system-ui);background:0 0;border:0;outline:none;flex:1;padding:4px 0;font-size:15px}.epics-quick-add input[data-v-a443eee4]::placeholder{color:var(--ink-fainter,#918b80);font-style:italic}.epics-quick-add .quick-add-status[data-v-a443eee4]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);font-size:11px}.epics-quick-add .quick-add-chip[data-v-a443eee4]{font-family:var(--mono,monospace);letter-spacing:.02em;white-space:nowrap;border:1px solid;align-items:center;padding:1px 6px;font-size:10.5px;display:inline-flex}.epics-quick-add .quick-add-chip.tone-blue[data-v-a443eee4]{color:var(--accent-blue,#1d55a6)}.epics-quick-add .quick-add-hint[data-v-a443eee4]{font-family:var(--mono,monospace);color:var(--ink-fainter,#918b80);white-space:nowrap;font-size:10.5px}.epics-quick-add .quick-add-hint kbd[data-v-a443eee4]{font-family:var(--mono,monospace);border:1px solid var(--rule-light,#d8d1c4);margin:0 1px;padding:0 4px;font-size:10px}.epics-list-items[data-v-a443eee4]{gap:8px;margin:0;padding:0;list-style:none;display:grid}.epics-list-items>li[data-v-a443eee4]{transition:background 80ms;position:relative}.epics-list-items>li.focused[data-v-a443eee4]{background:var(--paper-tint,#f2efe7)}.epics-list-items>li.selected[data-v-a443eee4]{box-shadow:inset 3px 0 0 var(--ink,#111)}.epics-list-items>li.focused.selected[data-v-a443eee4]{box-shadow:inset 3px 0 0 var(--accent-teal,#087f6f)}.epics-list-foot[data-v-a443eee4]{font-family:var(--mono,monospace);color:var(--ink-faint,#68645c);letter-spacing:.04em;margin-top:8px;font-size:11px}.epics-list-foot kbd[data-v-a443eee4]{font-family:var(--mono,monospace);border:1px solid var(--rule-light,#d8d1c4);margin:0 1px;padding:0 4px;font-size:10px}.epics-bulk-bar[data-v-a443eee4]{background:var(--ink,#111);color:var(--paper,#fffdf8);font-family:var(--mono,monospace);z-index:1;flex-wrap:wrap;align-items:center;gap:12px;padding:8px 12px;font-size:11px;display:flex;position:sticky;top:0}.epics-bulk-bar .count[data-v-a443eee4]{font-weight:600}.epics-bulk-bar .bulk-reproject[data-v-a443eee4]{align-items:center;gap:6px;display:inline-flex}.epics-bulk-bar .bulk-reproject-label[data-v-a443eee4]{color:var(--paper-tint,#f2efe7);letter-spacing:.04em}.epics-bulk-bar .bulk-reproject-select[data-v-a443eee4]{border:1px solid var(--paper-tint,#f2efe7);color:var(--paper,#fffdf8);font-family:var(--mono,monospace);cursor:pointer;background:0 0;outline:none;padding:2px 6px;font-size:11px}.epics-bulk-bar .bulk-reproject-select[data-v-a443eee4]:disabled{opacity:.5;cursor:wait}.epics-bulk-bar .bulk-reproject-select option[data-v-a443eee4]{background:var(--ink,#111);color:var(--paper,#fffdf8)}.epics-bulk-bar .bulk-clear[data-v-a443eee4]{color:var(--paper-tint,#f2efe7);font-family:var(--mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 4px;font-size:11px}.epics-bulk-bar .bulk-clear kbd[data-v-a443eee4]{border:1px solid;margin-left:4px;padding:0 4px;font-size:10px}.epics-bulk-bar .hint[data-v-a443eee4]{color:var(--paper-tint,#f2efe7);letter-spacing:.04em;font-size:10.5px}.epics-bulk-bar .hint kbd[data-v-a443eee4]{border:1px solid;padding:0 4px;font-size:10px}.epic-line[data-v-a443eee4]{margin:4px 0}.muted[data-v-a443eee4]{color:var(--ink-faint,#888)}.warn[data-v-a443eee4]{color:var(--ink-warn,#c2410c)}"]], ["__scopeId", "data-v-a443eee4"]]), lu = "epics", uu = "ext_epics", du = "comtrya-epic-card", fu = "comtrya-epics-board", pu = "comtrya-epics-index", mu = "comtrya-epic-detail", hu = "comtrya-epic-new";
Ss({
	tagName: du,
	component: pc,
	propertyAliases: { ref: "resourceRef" }
}), Ss({
	tagName: fu,
	component: cu
}), Ss({
	tagName: pu,
	component: cu
}), Ss({
	tagName: mu,
	component: Ol
}), _u();
var gu = {
	id: uu,
	setup(e) {
		e.registerCard({
			resourceKind: "epic",
			element: du,
			requiredPermission: "epics.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "epic",
			loadTargets: async (t) => (await Ms(e.client, { workspaceId: t.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3" })).map((e) => ({
				ref: Bs(e),
				kind: "epic",
				title: e.title,
				subtitle: e.state.toLowerCase().replace(/_/g, " ")
			}))
		}), e.registerWidget({
			id: "epics-board",
			element: fu,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "epics.read"
		}), e.registerRoute("/", {
			element: pu,
			requiredPermission: "epics.read"
		}), e.registerRoute("/new", {
			element: hu,
			requiredPermission: "epics.write"
		}), e.registerRoute("/:workspaceId/:id", {
			element: mu,
			requiredPermission: "epics.read"
		}), Xs(e.client);
	}
};
function _u() {
	typeof customElements > "u" || customElements.get(hu) || customElements.define(hu, class extends HTMLElement {
		routeParams;
		connectedCallback() {
			let e = vu(this.routeParams);
			this.replaceChildren(yu(e));
		}
	});
}
function vu(e) {
	let t = new URLSearchParams(window.location.search);
	return {
		workspaceId: t.get("workspaceId") ?? e?.params?.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
		projectName: t.get("projectName") ?? e?.params?.projectName ?? null
	};
}
function yu(e) {
	let t = document.createElement("main");
	t.className = "epic-new", t.dataset.smoke = "epic-new";
	let n = document.createElement("h3");
	n.textContent = e.projectName ? `New epic in ${e.projectName}` : "New epic";
	let r = document.createElement("form"), i = document.createElement("input");
	i.required = !0, i.placeholder = "Epic title";
	let a = document.createElement("select");
	a.className = "epic-new-project-select", a.dataset.smoke = "epic-new-project";
	let o = document.createElement("option");
	o.value = "", o.textContent = "— no project —", a.append(o), hs().then((t) => {
		for (let n of t) {
			if (!n.name) continue;
			let t = document.createElement("option");
			t.value = n.name, t.textContent = n.name, n.name === e.projectName && (t.selected = !0), a.append(t);
		}
	}), a.addEventListener("change", () => {
		n.textContent = a.value ? `New epic in ${a.value}` : "New epic";
	});
	let s = document.createElement("textarea");
	s.rows = 5, s.placeholder = "Description (optional)";
	let c = document.createElement("button");
	c.type = "submit", c.textContent = "Create epic";
	let u = bu("", "warn");
	return u.setAttribute("role", "alert"), u.hidden = !0, r.append(i, a, s, c, u), r.addEventListener("submit", (t) => {
		t.preventDefault(), c.disabled = !0, u.hidden = !0, Is(void 0, {
			workspaceId: e.workspaceId,
			projectName: a.value || null,
			title: i.value.trim(),
			bodyMarkdown: s.value
		}).then((e) => {
			window.location.assign(l(lu, `/${e.workspaceId}/${e.id}`));
		}).catch((e) => {
			u.textContent = e instanceof Error ? e.message : String(e), u.hidden = !1, c.disabled = !1;
		});
	}), t.append(n, r), t;
}
function bu(e, t) {
	let n = document.createElement("p");
	return n.className = `epic-line ${t}`, n.textContent = e, n;
}
//#endregion
export { gu as default };
