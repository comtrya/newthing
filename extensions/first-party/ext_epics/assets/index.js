//#region packages/sdk-core/src/session.ts
var e, t;
async function n(n = {}) {
	return e && e.expiresAtMs > Date.now() + 5e3 ? e.token : (t ||= i(n).finally(() => {
		t = void 0;
	}), t);
}
function r() {
	e = void 0;
}
async function i(t) {
	let n = t.operatorCode ?? a(), r = t.fetchImpl ?? fetch, i = t.baseUrl ?? "";
	if (!n) return;
	let o = await r(`${i}/auth/token-exchange`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			grantType: "urn:comtrya:grant:operator-code",
			subjectToken: n,
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
	if (!o.ok) throw Error(`token-exchange failed (${o.status}): ${await o.text()}`);
	let s = await o.json();
	if (!s.accessToken) throw Error("token-exchange response missing accessToken");
	let c = (s.expiresIn ?? 1800) * 1e3;
	return e = {
		token: s.accessToken,
		expiresAtMs: Date.now() + c
	}, e.token;
}
function a() {
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
async function o(e, t, i, a, o = {}) {
	let l = `${o.baseUrl ?? ""}/api/ops/${encodeURIComponent(e)}/${encodeURIComponent(t)}/${encodeURIComponent(i)}`, u = { "content-type": "application/json" }, d = o.token ?? await n();
	d && (u.authorization = `Bearer ${d}`);
	try {
		let e = await fetch(l, {
			method: "POST",
			headers: u,
			body: JSON.stringify(a ?? null),
			signal: o.signal,
			credentials: "include"
		});
		e.status === 401 && r();
		let t = await e.text();
		if (!e.ok) {
			let n;
			try {
				n = t ? JSON.parse(t) : void 0;
			} catch {
				n = void 0;
			}
			let r = c(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: s(n?.code) ?? r,
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
function s(e) {
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
function c(e) {
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
var l = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, u;
function d() {
	return u ||= f(l), u;
}
function f(e) {
	let t = async (t, i) => {
		let a = await n(), o = { "Content-Type": "application/json" };
		a && (o.Authorization = `Bearer ${a}`);
		let s = await e.fetchImpl(e.endpoint, {
			method: "POST",
			credentials: e.credentials,
			headers: o,
			body: JSON.stringify({
				query: t,
				variables: i
			})
		});
		s.status === 401 && r();
		let c;
		try {
			c = await s.json();
		} catch (e) {
			throw Error(`GraphQL response was not JSON: ${e instanceof Error ? e.message : String(e)}`);
		}
		if (!s.ok || c.errors?.length) throw Error(c.errors?.[0]?.message ?? s.statusText ?? "GraphQL request failed");
		if (c.data === void 0) throw Error("GraphQL response did not include data");
		return c.data;
	};
	return {
		query: t,
		mutate: t
	};
}
//#endregion
//#region packages/sdk-core/src/route-registry.ts
function p(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`, r = n.length;
	for (; r > 1 && n.charCodeAt(r - 1) === 47;) --r;
	return `/x/${e}${n === "/" ? "" : n.slice(0, r)}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function m(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return h(t, e, n.signal), () => n.abort();
}
async function h(e, t, n) {
	try {
		let r = await g(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: _(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await v(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function g(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: _(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function _(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function v(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		y(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) ee(e, t);
	}
	a += i.decode(), y(a, t);
}
function y(e, t) {
	for (let n of e.split("\n\n")) ee(n, t);
}
function ee(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = te(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function te(e, t) {
	let n = ne(e) ? e : {}, r = ne(n.data) ? n.data : {}, i = b(r.eventType) ?? b(n.type) ?? t ?? "";
	return {
		id: b(r.id) ?? b(n.id) ?? "",
		eventType: i,
		payloadB64: b(r.payloadB64) ?? "",
		timestampMs: re(r.timestampMs) ?? ie(re(n.time)) ?? Date.now(),
		sourceUri: b(r.sourceUri) ?? b(n.source) ?? "",
		emitterExtension: b(r.emitterExtension) ?? b(r.extensionId) ?? b(n.source) ?? "",
		raw: e
	};
}
function ne(e) {
	return typeof e == "object" && !!e;
}
function b(e) {
	return typeof e == "string" ? e : void 0;
}
function re(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function ie(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var x = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], ae = typeof navigator == "object" ? navigator.platform : "", S = /Mac|iPod|iPhone|iPad/.test(ae), oe = S ? "Meta" : "Control", se = ae === "Win32" ? ["Control", "Alt"] : S ? ["Alt"] : [];
function C(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || se.includes(t) && e.getModifierState("AltGraph"));
}
function ce(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? oe : e;
		}), n];
	});
}
function le(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !C(e, t);
	}) || x.find(function(t) {
		return !n.includes(t) && r !== t && C(e, t);
	}));
}
function ue(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [ce(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			le(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : C(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function de(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = ue(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var w = /* @__PURE__ */ new Map(), T = /* @__PURE__ */ new Set();
function E(e) {
	w.set(e.id, e);
	for (let e of T) e();
	return () => {
		w.delete(e.id);
		for (let e of T) e();
	};
}
//#endregion
//#region packages/sdk-core/src/workspace-store.ts
var fe = null, pe = [];
function me() {
	return fe;
}
function he() {
	return fe === null ? new Promise((e) => {
		pe.push(e);
	}) : Promise.resolve(fe);
}
//#endregion
//#region node_modules/.bun/@vue+shared@3.5.34/node_modules/@vue/shared/dist/shared.esm-bundler.js
/* @__NO_SIDE_EFFECTS__ */
function ge(e) {
	let t = /* @__PURE__ */ Object.create(null);
	for (let n of e.split(",")) t[n] = 1;
	return (e) => e in t;
}
var D = {}, _e = [], ve = () => {}, ye = () => !1, be = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), xe = (e) => e.startsWith("onUpdate:"), O = Object.assign, Se = (e, t) => {
	let n = e.indexOf(t);
	n > -1 && e.splice(n, 1);
}, Ce = Object.prototype.hasOwnProperty, k = (e, t) => Ce.call(e, t), A = Array.isArray, we = (e) => Ae(e) === "[object Map]", Te = (e) => Ae(e) === "[object Set]", Ee = (e) => Ae(e) === "[object Date]", j = (e) => typeof e == "function", M = (e) => typeof e == "string", De = (e) => typeof e == "symbol", N = (e) => typeof e == "object" && !!e, Oe = (e) => (N(e) || j(e)) && j(e.then) && j(e.catch), ke = Object.prototype.toString, Ae = (e) => ke.call(e), je = (e) => Ae(e).slice(8, -1), Me = (e) => Ae(e) === "[object Object]", Ne = (e) => M(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Pe = /* @__PURE__ */ ge(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"), Fe = (e) => {
	let t = /* @__PURE__ */ Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, Ie = /-\w/g, P = Fe((e) => e.replace(Ie, (e) => e.slice(1).toUpperCase())), Le = /\B([A-Z])/g, Re = Fe((e) => e.replace(Le, "-$1").toLowerCase()), ze = Fe((e) => e.charAt(0).toUpperCase() + e.slice(1)), Be = Fe((e) => e ? `on${ze(e)}` : ""), Ve = (e, t) => !Object.is(e, t), He = (e, ...t) => {
	for (let n = 0; n < e.length; n++) e[n](...t);
}, Ue = (e, t, n, r = !1) => {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		writable: r,
		value: n
	});
}, We = (e) => {
	let t = parseFloat(e);
	return isNaN(t) ? e : t;
}, Ge = (e) => {
	let t = M(e) ? Number(e) : NaN;
	return isNaN(t) ? e : t;
}, Ke, qe = () => Ke ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function Je(e) {
	if (A(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = M(r) ? Qe(r) : Je(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (M(e) || N(e)) return e;
}
var Ye = /;(?![^(]*\))/g, Xe = /:([^]+)/, Ze = /\/\*[^]*?\*\//g;
function Qe(e) {
	let t = {};
	return e.replace(Ze, "").split(Ye).forEach((e) => {
		if (e) {
			let n = e.split(Xe);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function $e(e) {
	let t = "";
	if (M(e)) t = e;
	else if (A(e)) for (let n = 0; n < e.length; n++) {
		let r = $e(e[n]);
		r && (t += r + " ");
	}
	else if (N(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var et = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", tt = /* @__PURE__ */ ge(et);
et + "";
function nt(e) {
	return !!e || e === "";
}
function rt(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = it(e[r], t[r]);
	return n;
}
function it(e, t) {
	if (e === t) return !0;
	let n = Ee(e), r = Ee(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = De(e), r = De(t), n || r) return e === t;
	if (n = A(e), r = A(t), n || r) return n && r ? rt(e, t) : !1;
	if (n = N(e), r = N(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !it(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
var at = (e) => !!(e && e.__v_isRef === !0), F = (e) => M(e) ? e : e == null ? "" : A(e) || N(e) && (e.toString === ke || !j(e.toString)) ? at(e) ? F(e.value) : JSON.stringify(e, ot, 2) : String(e), ot = (e, t) => at(t) ? ot(e, t.value) : we(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[st(t, r) + " =>"] = n, e), {}) } : Te(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => st(e)) } : De(t) ? st(t) : N(t) && !A(t) && !Me(t) ? String(t) : t, st = (e, t = "") => De(e) ? `Symbol(${e.description ?? t})` : e, I, ct = class {
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
function lt() {
	return I;
}
var L, ut = /* @__PURE__ */ new WeakSet(), dt = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, I && (I.active ? I.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, ut.has(this) && (ut.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || ht(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, Ot(this), vt(this);
		let e = L, t = wt;
		L = this, wt = !0;
		try {
			return this.fn();
		} finally {
			yt(this), L = e, wt = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) St(e);
			this.deps = this.depsTail = void 0, Ot(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? ut.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		bt(this) && this.run();
	}
	get dirty() {
		return bt(this);
	}
}, ft = 0, pt, mt;
function ht(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = mt, mt = e;
		return;
	}
	e.next = pt, pt = e;
}
function gt() {
	ft++;
}
function _t() {
	if (--ft > 0) return;
	if (mt) {
		let e = mt;
		for (mt = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; pt;) {
		let t = pt;
		for (pt = void 0; t;) {
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
function vt(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function yt(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), St(r), Ct(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function bt(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (xt(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function xt(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === kt) || (e.globalVersion = kt, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !bt(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = L, r = wt;
	L = e, wt = !0;
	try {
		vt(e);
		let n = e.fn(e._value);
		(t.version === 0 || Ve(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		L = n, wt = r, yt(e), e.flags &= -3;
	}
}
function St(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) St(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function Ct(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var wt = !0, Tt = [];
function Et() {
	Tt.push(wt), wt = !1;
}
function Dt() {
	let e = Tt.pop();
	wt = e === void 0 ? !0 : e;
}
function Ot(e) {
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
var kt = 0, At = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, jt = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!L || !wt || L === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== L) t = this.activeLink = new At(L, this), L.deps ? (t.prevDep = L.depsTail, L.depsTail.nextDep = t, L.depsTail = t) : L.deps = L.depsTail = t, Mt(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = L.depsTail, t.nextDep = void 0, L.depsTail.nextDep = t, L.depsTail = t, L.deps === t && (L.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, kt++, this.notify(e);
	}
	notify(e) {
		gt();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			_t();
		}
	}
};
function Mt(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) Mt(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var Nt = /* @__PURE__ */ new WeakMap(), Pt = /* @__PURE__ */ Symbol(""), Ft = /* @__PURE__ */ Symbol(""), It = /* @__PURE__ */ Symbol("");
function R(e, t, n) {
	if (wt && L) {
		let t = Nt.get(e);
		t || Nt.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new jt()), r.map = t, r.key = n), r.track();
	}
}
function Lt(e, t, n, r, i, a) {
	let o = Nt.get(e);
	if (!o) {
		kt++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (gt(), t === "clear") o.forEach(s);
	else {
		let i = A(e), a = i && Ne(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === It || !De(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(It)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(Pt)), we(e) && s(o.get(Ft)));
				break;
			case "delete":
				i || (s(o.get(Pt)), we(e) && s(o.get(Ft)));
				break;
			case "set":
				we(e) && s(o.get(Pt));
				break;
		}
	}
	_t();
}
function Rt(e) {
	let t = /* @__PURE__ */ z(e);
	return t === e ? t : (R(t, "iterate", It), /* @__PURE__ */ Tn(e) ? t : t.map(On));
}
function zt(e) {
	return R(e = /* @__PURE__ */ z(e), "iterate", It), e;
}
function Bt(e, t) {
	return /* @__PURE__ */ wn(e) ? kn(/* @__PURE__ */ Cn(e) ? On(t) : t) : On(t);
}
var Vt = {
	__proto__: null,
	[Symbol.iterator]() {
		return Ht(this, Symbol.iterator, (e) => Bt(this, e));
	},
	concat(...e) {
		return Rt(this).concat(...e.map((e) => A(e) ? Rt(e) : e));
	},
	entries() {
		return Ht(this, "entries", (e) => (e[1] = Bt(this, e[1]), e));
	},
	every(e, t) {
		return Wt(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return Wt(this, "filter", e, t, (e) => e.map((e) => Bt(this, e)), arguments);
	},
	find(e, t) {
		return Wt(this, "find", e, t, (e) => Bt(this, e), arguments);
	},
	findIndex(e, t) {
		return Wt(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return Wt(this, "findLast", e, t, (e) => Bt(this, e), arguments);
	},
	findLastIndex(e, t) {
		return Wt(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return Wt(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return Kt(this, "includes", e);
	},
	indexOf(...e) {
		return Kt(this, "indexOf", e);
	},
	join(e) {
		return Rt(this).join(e);
	},
	lastIndexOf(...e) {
		return Kt(this, "lastIndexOf", e);
	},
	map(e, t) {
		return Wt(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return qt(this, "pop");
	},
	push(...e) {
		return qt(this, "push", e);
	},
	reduce(e, ...t) {
		return Gt(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return Gt(this, "reduceRight", e, t);
	},
	shift() {
		return qt(this, "shift");
	},
	some(e, t) {
		return Wt(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return qt(this, "splice", e);
	},
	toReversed() {
		return Rt(this).toReversed();
	},
	toSorted(e) {
		return Rt(this).toSorted(e);
	},
	toSpliced(...e) {
		return Rt(this).toSpliced(...e);
	},
	unshift(...e) {
		return qt(this, "unshift", e);
	},
	values() {
		return Ht(this, "values", (e) => Bt(this, e));
	}
};
function Ht(e, t, n) {
	let r = zt(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ Tn(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var Ut = Array.prototype;
function Wt(e, t, n, r, i, a) {
	let o = zt(e), s = o !== e && !/* @__PURE__ */ Tn(e), c = o[t];
	if (c !== Ut[t]) {
		let t = c.apply(e, a);
		return s ? On(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, Bt(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function Gt(e, t, n, r) {
	let i = zt(e), a = i !== e && !/* @__PURE__ */ Tn(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = Bt(e, t)), n.call(this, t, Bt(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? Bt(e, c) : c;
}
function Kt(e, t, n) {
	let r = /* @__PURE__ */ z(e);
	R(r, "iterate", It);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ En(n[0]) ? (n[0] = /* @__PURE__ */ z(n[0]), r[t](...n)) : i;
}
function qt(e, t, n = []) {
	Et(), gt();
	let r = (/* @__PURE__ */ z(e))[t].apply(e, n);
	return _t(), Dt(), r;
}
var Jt = /* @__PURE__ */ ge("__proto__,__v_isRef,__isVue"), Yt = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(De));
function Xt(e) {
	De(e) || (e = String(e));
	let t = /* @__PURE__ */ z(this);
	return R(t, "has", e), t.hasOwnProperty(e);
}
var Zt = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? gn : hn : i ? mn : pn).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = A(e);
		if (!r) {
			let e;
			if (a && (e = Vt[t])) return e;
			if (t === "hasOwnProperty") return Xt;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ B(e) ? e : n);
		if ((De(t) ? Yt.has(t) : Jt(t)) || (r || R(e, "get", t), i)) return o;
		if (/* @__PURE__ */ B(o)) {
			let e = a && Ne(t) ? o : o.value;
			return r && N(e) ? /* @__PURE__ */ xn(e) : e;
		}
		return N(o) ? r ? /* @__PURE__ */ xn(o) : /* @__PURE__ */ yn(o) : o;
	}
}, Qt = class extends Zt {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = A(e) && Ne(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ wn(i);
			if (!/* @__PURE__ */ Tn(n) && !/* @__PURE__ */ wn(n) && (i = /* @__PURE__ */ z(i), n = /* @__PURE__ */ z(n)), !a && /* @__PURE__ */ B(i) && !/* @__PURE__ */ B(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : k(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ B(e) ? e : r);
		return e === /* @__PURE__ */ z(r) && (o ? Ve(n, i) && Lt(e, "set", t, n, i) : Lt(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = k(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && Lt(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!De(t) || !Yt.has(t)) && R(e, "has", t), n;
	}
	ownKeys(e) {
		return R(e, "iterate", A(e) ? "length" : Pt), Reflect.ownKeys(e);
	}
}, $t = class extends Zt {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, en = /* @__PURE__ */ new Qt(), tn = /* @__PURE__ */ new $t(), nn = /* @__PURE__ */ new Qt(!0), rn = (e) => e, an = (e) => Reflect.getPrototypeOf(e);
function on(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ z(i), o = we(a), s = e === "entries" || e === Symbol.iterator && o, c = e === "keys" && o, l = i[e](...r), u = n ? rn : t ? kn : On;
		return !t && R(a, "iterate", c ? Ft : Pt), O(Object.create(l), { next() {
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
function sn(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function cn(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ z(r), a = /* @__PURE__ */ z(n);
			e || (Ve(n, a) && R(i, "get", n), R(i, "get", a));
			let { has: o } = an(i), s = t ? rn : e ? kn : On;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && R(/* @__PURE__ */ z(t), "iterate", Pt), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ z(n), i = /* @__PURE__ */ z(t);
			return e || (Ve(t, i) && R(r, "has", t), R(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ z(a), s = t ? rn : e ? kn : On;
			return !e && R(o, "iterate", Pt), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return O(n, e ? {
		add: sn("add"),
		set: sn("set"),
		delete: sn("delete"),
		clear: sn("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ z(this), r = an(n), i = /* @__PURE__ */ z(e), a = !t && !/* @__PURE__ */ Tn(e) && !/* @__PURE__ */ wn(e) ? i : e;
			return r.has.call(n, a) || Ve(e, a) && r.has.call(n, e) || Ve(i, a) && r.has.call(n, i) || (n.add(a), Lt(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ Tn(n) && !/* @__PURE__ */ wn(n) && (n = /* @__PURE__ */ z(n));
			let r = /* @__PURE__ */ z(this), { has: i, get: a } = an(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ z(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? Ve(n, s) && Lt(r, "set", e, n, s) : Lt(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ z(this), { has: n, get: r } = an(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ z(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && Lt(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ z(this), t = e.size !== 0, n = e.clear();
			return t && Lt(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = on(r, e, t);
	}), n;
}
function ln(e, t) {
	let n = cn(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(k(n, r) && r in t ? n : t, r, i);
}
var un = { get: /* @__PURE__ */ ln(!1, !1) }, dn = { get: /* @__PURE__ */ ln(!1, !0) }, fn = { get: /* @__PURE__ */ ln(!0, !1) }, pn = /* @__PURE__ */ new WeakMap(), mn = /* @__PURE__ */ new WeakMap(), hn = /* @__PURE__ */ new WeakMap(), gn = /* @__PURE__ */ new WeakMap();
function _n(e) {
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
function vn(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : _n(je(e));
}
/* @__NO_SIDE_EFFECTS__ */
function yn(e) {
	return /* @__PURE__ */ wn(e) ? e : Sn(e, !1, en, un, pn);
}
/* @__NO_SIDE_EFFECTS__ */
function bn(e) {
	return Sn(e, !1, nn, dn, mn);
}
/* @__NO_SIDE_EFFECTS__ */
function xn(e) {
	return Sn(e, !0, tn, fn, hn);
}
function Sn(e, t, n, r, i) {
	if (!N(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = vn(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function Cn(e) {
	return /* @__PURE__ */ wn(e) ? /* @__PURE__ */ Cn(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function wn(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function Tn(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function En(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function z(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ z(t) : e;
}
function Dn(e) {
	return !k(e, "__v_skip") && Object.isExtensible(e) && Ue(e, "__v_skip", !0), e;
}
var On = (e) => N(e) ? /* @__PURE__ */ yn(e) : e, kn = (e) => N(e) ? /* @__PURE__ */ xn(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function B(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function V(e) {
	return An(e, !1);
}
function An(e, t) {
	return /* @__PURE__ */ B(e) ? e : new jn(e, t);
}
var jn = class {
	constructor(e, t) {
		this.dep = new jt(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ z(e), this._value = t ? e : On(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ Tn(e) || /* @__PURE__ */ wn(e);
		e = n ? e : /* @__PURE__ */ z(e), Ve(e, t) && (this._rawValue = e, this._value = n ? e : On(e), this.dep.trigger());
	}
};
function H(e) {
	return /* @__PURE__ */ B(e) ? e.value : e;
}
var Mn = {
	get: (e, t, n) => t === "__v_raw" ? e : H(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ B(i) && !/* @__PURE__ */ B(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Nn(e) {
	return /* @__PURE__ */ Cn(e) ? e : new Proxy(e, Mn);
}
var Pn = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new jt(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = kt - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && L !== this) return ht(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return xt(this), e && (e.version = this.dep.version), this._value;
	}
	set value(e) {
		this.setter && this.setter(e);
	}
};
/* @__NO_SIDE_EFFECTS__ */
function Fn(e, t, n = !1) {
	let r, i;
	return j(e) ? r = e : (r = e.get, i = e.set), new Pn(r, i, n);
}
var In = {}, Ln = /* @__PURE__ */ new WeakMap(), Rn = void 0;
function zn(e, t = !1, n = Rn) {
	if (n) {
		let t = Ln.get(n);
		t || Ln.set(n, t = []), t.push(e);
	}
}
function Bn(e, t, n = D) {
	let { immediate: r, deep: i, once: a, scheduler: o, augmentJob: s, call: c } = n, l = (e) => i ? e : /* @__PURE__ */ Tn(e) || i === !1 || i === 0 ? Vn(e, 1) : Vn(e), u, d, f, p, m = !1, h = !1;
	if (/* @__PURE__ */ B(e) ? (d = () => e.value, m = /* @__PURE__ */ Tn(e)) : /* @__PURE__ */ Cn(e) ? (d = () => l(e), m = !0) : A(e) ? (h = !0, m = e.some((e) => /* @__PURE__ */ Cn(e) || /* @__PURE__ */ Tn(e)), d = () => e.map((e) => {
		if (/* @__PURE__ */ B(e)) return e.value;
		if (/* @__PURE__ */ Cn(e)) return l(e);
		if (j(e)) return c ? c(e, 2) : e();
	})) : d = j(e) ? t ? c ? () => c(e, 2) : e : () => {
		if (f) {
			Et();
			try {
				f();
			} finally {
				Dt();
			}
		}
		let t = Rn;
		Rn = u;
		try {
			return c ? c(e, 3, [p]) : e(p);
		} finally {
			Rn = t;
		}
	} : ve, t && i) {
		let e = d, t = i === !0 ? Infinity : i;
		d = () => Vn(e(), t);
	}
	let g = lt(), _ = () => {
		u.stop(), g && g.active && Se(g.effects, u);
	};
	if (a && t) {
		let e = t;
		t = (...t) => {
			e(...t), _();
		};
	}
	let v = h ? Array(e.length).fill(In) : In, y = (e) => {
		if (!(!(u.flags & 1) || !u.dirty && !e)) if (t) {
			let e = u.run();
			if (i || m || (h ? e.some((e, t) => Ve(e, v[t])) : Ve(e, v))) {
				f && f();
				let n = Rn;
				Rn = u;
				try {
					let n = [
						e,
						v === In ? void 0 : h && v[0] === In ? [] : v,
						p
					];
					v = e, c ? c(t, 3, n) : t(...n);
				} finally {
					Rn = n;
				}
			}
		} else u.run();
	};
	return s && s(y), u = new dt(d), u.scheduler = o ? () => o(y, !1) : y, p = (e) => zn(e, !1, u), f = u.onStop = () => {
		let e = Ln.get(u);
		if (e) {
			if (c) c(e, 4);
			else for (let t of e) t();
			Ln.delete(u);
		}
	}, t ? r ? y(!0) : v = u.run() : o ? o(y.bind(null, !0), !0) : u.run(), _.pause = u.pause.bind(u), _.resume = u.resume.bind(u), _.stop = _, _;
}
function Vn(e, t = Infinity, n) {
	if (t <= 0 || !N(e) || e.__v_skip || (n ||= /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t)) return e;
	if (n.set(e, t), t--, /* @__PURE__ */ B(e)) Vn(e.value, t, n);
	else if (A(e)) for (let r = 0; r < e.length; r++) Vn(e[r], t, n);
	else if (Te(e) || we(e)) e.forEach((e) => {
		Vn(e, t, n);
	});
	else if (Me(e)) {
		for (let r in e) Vn(e[r], t, n);
		for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && Vn(e[r], t, n);
	}
	return e;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.34/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function Hn(e, t, n, r) {
	try {
		return r ? e(...r) : e();
	} catch (e) {
		Wn(e, t, n);
	}
}
function Un(e, t, n, r) {
	if (j(e)) {
		let i = Hn(e, t, n, r);
		return i && Oe(i) && i.catch((e) => {
			Wn(e, t, n);
		}), i;
	}
	if (A(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(Un(e[a], t, n, r));
		return i;
	}
}
function Wn(e, t, n, r = !0) {
	let i = t ? t.vnode : null, { errorHandler: a, throwUnhandledErrorInProduction: o } = t && t.appContext.config || D;
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
			Et(), Hn(a, null, 10, [
				e,
				i,
				o
			]), Dt();
			return;
		}
	}
	Gn(e, n, i, r, o);
}
function Gn(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var U = [], Kn = -1, qn = [], Jn = null, Yn = 0, Xn = /* @__PURE__ */ Promise.resolve(), Zn = null;
function Qn(e) {
	let t = Zn || Xn;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function $n(e) {
	let t = Kn + 1, n = U.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = U[r], a = ar(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function er(e) {
	if (!(e.flags & 1)) {
		let t = ar(e), n = U[U.length - 1];
		!n || !(e.flags & 2) && t >= ar(n) ? U.push(e) : U.splice($n(t), 0, e), e.flags |= 1, tr();
	}
}
function tr() {
	Zn ||= Xn.then(or);
}
function nr(e) {
	A(e) ? qn.push(...e) : Jn && e.id === -1 ? Jn.splice(Yn + 1, 0, e) : e.flags & 1 || (qn.push(e), e.flags |= 1), tr();
}
function rr(e, t, n = Kn + 1) {
	for (; n < U.length; n++) {
		let t = U[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			U.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function ir(e) {
	if (qn.length) {
		let e = [...new Set(qn)].sort((e, t) => ar(e) - ar(t));
		if (qn.length = 0, Jn) {
			Jn.push(...e);
			return;
		}
		for (Jn = e, Yn = 0; Yn < Jn.length; Yn++) {
			let e = Jn[Yn];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		Jn = null, Yn = 0;
	}
}
var ar = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function or(e) {
	try {
		for (Kn = 0; Kn < U.length; Kn++) {
			let e = U[Kn];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), Hn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; Kn < U.length; Kn++) {
			let e = U[Kn];
			e && (e.flags &= -2);
		}
		Kn = -1, U.length = 0, ir(e), Zn = null, (U.length || qn.length) && or(e);
	}
}
var sr = null, cr = null;
function lr(e) {
	let t = sr;
	return sr = e, cr = e && e.type.__scopeId || null, t;
}
function ur(e, t = sr, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && ha(-1);
		let i = lr(t), a;
		try {
			a = e(...n);
		} finally {
			lr(i), r._d && ha(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function dr(e, t) {
	if (sr === null) return e;
	let n = Ya(sr), r = e.dirs ||= [];
	for (let e = 0; e < t.length; e++) {
		let [i, a, o, s = D] = t[e];
		i && (j(i) && (i = {
			mounted: i,
			updated: i
		}), i.deep && Vn(a), r.push({
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
function fr(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (Et(), Un(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), Dt());
	}
}
function pr(e, t) {
	if (Q) {
		let n = Q.provides, r = Q.parent && Q.parent.provides;
		r === n && (n = Q.provides = Object.create(r)), n[e] = t;
	}
}
function mr(e, t, n = !1) {
	let r = Pa();
	if (r || yi) {
		let i = yi ? yi._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && j(t) ? t.call(r && r.proxy) : t;
	}
}
var hr = /* @__PURE__ */ Symbol.for("v-scx"), gr = () => mr(hr);
function _r(e, t, n) {
	return vr(e, t, n);
}
function vr(e, t, n = D) {
	let { immediate: r, deep: i, flush: a, once: o } = n, s = O({}, n), c = t && r || !t && a !== "post", l;
	if (Ba) {
		if (a === "sync") {
			let e = gr();
			l = e.__watcherHandles ||= [];
		} else if (!c) {
			let e = () => {};
			return e.stop = ve, e.resume = ve, e.pause = ve, e;
		}
	}
	let u = Q;
	s.call = (e, t, n) => Un(e, u, t, n);
	let d = !1;
	a === "post" ? s.scheduler = (e) => {
		G(e, u && u.suspense);
	} : a !== "sync" && (d = !0, s.scheduler = (e, t) => {
		t ? e() : er(e);
	}), s.augmentJob = (e) => {
		t && (e.flags |= 4), d && (e.flags |= 2, u && (e.id = u.uid, e.i = u));
	};
	let f = Bn(e, t, s);
	return Ba && (l ? l.push(f) : c && f()), f;
}
function yr(e, t, n) {
	let r = this.proxy, i = M(e) ? e.includes(".") ? br(r, e) : () => r[e] : e.bind(r, r), a;
	j(t) ? a = t : (a = t.handler, n = t);
	let o = La(this), s = vr(i, a.bind(r), n);
	return o(), s;
}
function br(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var xr = /* @__PURE__ */ Symbol("_vte"), Sr = (e) => e.__isTeleport, Cr = /* @__PURE__ */ Symbol("_leaveCb");
function wr(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, wr(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function Tr(e, t) {
	return j(e) ? O({ name: e.name }, t, { setup: e }) : e;
}
function Er(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function Dr(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var Or = /* @__PURE__ */ new WeakMap();
function kr(e, t, n, r, i = !1) {
	if (A(e)) {
		e.forEach((e, a) => kr(e, t && (A(t) ? t[a] : t), n, r, i));
		return;
	}
	if (jr(r) && !i) {
		r.shapeFlag & 512 && r.type.__asyncResolved && r.component.subTree.component && kr(e, t, n, r.component.subTree);
		return;
	}
	let a = r.shapeFlag & 4 ? Ya(r.component) : r.el, o = i ? null : a, { i: s, r: c } = e, l = t && t.r, u = s.refs === D ? s.refs = {} : s.refs, d = s.setupState, f = /* @__PURE__ */ z(d), p = d === D ? ye : (e) => Dr(u, e) ? !1 : k(f, e), m = (e, t) => !(t && Dr(u, t));
	if (l != null && l !== c) {
		if (Ar(t), M(l)) u[l] = null, p(l) && (d[l] = null);
		else if (/* @__PURE__ */ B(l)) {
			let e = t;
			m(l, e.k) && (l.value = null), e.k && (u[e.k] = null);
		}
	}
	if (j(c)) Hn(c, s, 12, [o, u]);
	else {
		let t = M(c), r = /* @__PURE__ */ B(c);
		if (t || r) {
			let s = () => {
				if (e.f) {
					let n = t ? p(c) ? d[c] : u[c] : m(c) || !e.k ? c.value : u[e.k];
					if (i) A(n) && Se(n, a);
					else if (A(n)) n.includes(a) || n.push(a);
					else if (t) u[c] = [a], p(c) && (d[c] = u[c]);
					else {
						let t = [a];
						m(c, e.k) && (c.value = t), e.k && (u[e.k] = t);
					}
				} else t ? (u[c] = o, p(c) && (d[c] = o)) : r && (m(c, e.k) && (c.value = o), e.k && (u[e.k] = o));
			};
			if (o) {
				let t = () => {
					s(), Or.delete(e);
				};
				t.id = -1, Or.set(e, t), G(t, n);
			} else Ar(e), s();
		}
	}
}
function Ar(e) {
	let t = Or.get(e);
	t && (t.flags |= 8, Or.delete(e));
}
qe().requestIdleCallback, qe().cancelIdleCallback;
var jr = (e) => !!e.type.__asyncLoader, Mr = (e) => e.type.__isKeepAlive;
function Nr(e, t) {
	Fr(e, "a", t);
}
function Pr(e, t) {
	Fr(e, "da", t);
}
function Fr(e, t, n = Q) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (Lr(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) Mr(e.parent.vnode) && Ir(r, t, n, e), e = e.parent;
	}
}
function Ir(e, t, n, r) {
	let i = Lr(t, e, r, !0);
	Wr(() => {
		Se(r[t], i);
	}, n);
}
function Lr(e, t, n = Q, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			Et();
			let i = La(n), a = Un(t, n, e, r);
			return i(), Dt(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Rr = (e) => (t, n = Q) => {
	(!Ba || e === "sp") && Lr(e, (...e) => t(...e), n);
}, zr = Rr("bm"), Br = Rr("m"), Vr = Rr("bu"), Hr = Rr("u"), Ur = Rr("bum"), Wr = Rr("um"), Gr = Rr("sp"), Kr = Rr("rtg"), qr = Rr("rtc");
function Jr(e, t = Q) {
	Lr("ec", e, t);
}
var Yr = /* @__PURE__ */ Symbol.for("v-ndc");
function Xr(e, t, n, r) {
	let i, a = n && n[r], o = A(e);
	if (o || M(e)) {
		let n = o && /* @__PURE__ */ Cn(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ Tn(e), s = /* @__PURE__ */ wn(e), e = zt(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? kn(On(e[n])) : On(e[n]) : e[n], n, void 0, a && a[n]);
	} else if (typeof e == "number") {
		i = Array(e);
		for (let n = 0; n < e; n++) i[n] = t(n + 1, n, void 0, a && a[n]);
	} else if (N(e)) if (e[Symbol.iterator]) i = Array.from(e, (e, n) => t(e, n, void 0, a && a[n]));
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
var Zr = (e) => e ? za(e) ? Ya(e) : Zr(e.parent) : null, Qr = /* @__PURE__ */ O(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => Zr(e.parent),
	$root: (e) => Zr(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => si(e),
	$forceUpdate: (e) => e.f ||= () => {
		er(e.update);
	},
	$nextTick: (e) => e.n ||= Qn.bind(e.proxy),
	$watch: (e) => yr.bind(e)
}), $r = (e, t) => e !== D && !e.__isScriptSetup && k(e, t), ei = {
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
			else if ($r(r, t)) return o[t] = 1, r[t];
			else if (i !== D && k(i, t)) return o[t] = 2, i[t];
			else if (k(a, t)) return o[t] = 3, a[t];
			else if (n !== D && k(n, t)) return o[t] = 4, n[t];
			else ni && (o[t] = 0);
		}
		let l = Qr[t], u, d;
		if (l) return t === "$attrs" && R(e.attrs, "get", ""), l(e);
		if ((u = s.__cssModules) && (u = u[t])) return u;
		if (n !== D && k(n, t)) return o[t] = 4, n[t];
		if (d = c.config.globalProperties, k(d, t)) return d[t];
	},
	set({ _: e }, t, n) {
		let { data: r, setupState: i, ctx: a } = e;
		return $r(i, t) ? (i[t] = n, !0) : r !== D && k(r, t) ? (r[t] = n, !0) : k(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (a[t] = n, !0);
	},
	has({ _: { data: e, setupState: t, accessCache: n, ctx: r, appContext: i, props: a, type: o } }, s) {
		let c;
		return !!(n[s] || e !== D && s[0] !== "$" && k(e, s) || $r(t, s) || k(a, s) || k(r, s) || k(Qr, s) || k(i.config.globalProperties, s) || (c = o.__cssModules) && c[s]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? k(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function ti(e) {
	return A(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var ni = !0;
function ri(e) {
	let t = si(e), n = e.proxy, r = e.ctx;
	ni = !1, t.beforeCreate && ai(t.beforeCreate, e, "bc");
	let { data: i, computed: a, methods: o, watch: s, provide: c, inject: l, created: u, beforeMount: d, mounted: f, beforeUpdate: p, updated: m, activated: h, deactivated: g, beforeDestroy: _, beforeUnmount: v, destroyed: y, unmounted: ee, render: te, renderTracked: ne, renderTriggered: b, errorCaptured: re, serverPrefetch: ie, expose: x, inheritAttrs: ae, components: S, directives: oe, filters: se } = t;
	if (l && ii(l, r, null), o) for (let e in o) {
		let t = o[e];
		j(t) && (r[e] = t.bind(n));
	}
	if (i) {
		let t = i.call(n, n);
		N(t) && (e.data = /* @__PURE__ */ yn(t));
	}
	if (ni = !0, a) for (let e in a) {
		let t = a[e], i = $({
			get: j(t) ? t.bind(n, n) : j(t.get) ? t.get.bind(n, n) : ve,
			set: !j(t) && j(t.set) ? t.set.bind(n) : ve
		});
		Object.defineProperty(r, e, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		});
	}
	if (s) for (let e in s) oi(s[e], r, n, e);
	if (c) {
		let e = j(c) ? c.call(n) : c;
		Reflect.ownKeys(e).forEach((t) => {
			pr(t, e[t]);
		});
	}
	u && ai(u, e, "c");
	function C(e, t) {
		A(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (C(zr, d), C(Br, f), C(Vr, p), C(Hr, m), C(Nr, h), C(Pr, g), C(Jr, re), C(qr, ne), C(Kr, b), C(Ur, v), C(Wr, ee), C(Gr, ie), A(x)) if (x.length) {
		let t = e.exposed ||= {};
		x.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	te && e.render === ve && (e.render = te), ae != null && (e.inheritAttrs = ae), S && (e.components = S), oe && (e.directives = oe), ie && Er(e);
}
function ii(e, t, n = ve) {
	A(e) && (e = fi(e));
	for (let n in e) {
		let r = e[n], i;
		i = N(r) ? "default" in r ? mr(r.from || n, r.default, !0) : mr(r.from || n) : mr(r), /* @__PURE__ */ B(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function ai(e, t, n) {
	Un(A(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function oi(e, t, n, r) {
	let i = r.includes(".") ? br(n, r) : () => n[r];
	if (M(e)) {
		let n = t[e];
		j(n) && _r(i, n);
	} else if (j(e)) _r(i, e.bind(n));
	else if (N(e)) if (A(e)) e.forEach((e) => oi(e, t, n, r));
	else {
		let r = j(e.handler) ? e.handler.bind(n) : t[e.handler];
		j(r) && _r(i, r, e);
	}
}
function si(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => ci(c, e, o, !0)), ci(c, t, o)), N(t) && a.set(t, c), c;
}
function ci(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && ci(e, a, n, !0), i && i.forEach((t) => ci(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = li[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var li = {
	data: ui,
	props: mi,
	emits: mi,
	methods: pi,
	computed: pi,
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
	components: pi,
	directives: pi,
	watch: hi,
	provide: ui,
	inject: di
};
function ui(e, t) {
	return t ? e ? function() {
		return O(j(e) ? e.call(this, this) : e, j(t) ? t.call(this, this) : t);
	} : t : e;
}
function di(e, t) {
	return pi(fi(e), fi(t));
}
function fi(e) {
	if (A(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function W(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function pi(e, t) {
	return e ? O(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function mi(e, t) {
	return e ? A(e) && A(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : O(/* @__PURE__ */ Object.create(null), ti(e), ti(t ?? {})) : t;
}
function hi(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = O(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = W(e[r], t[r]);
	return n;
}
function gi() {
	return {
		app: null,
		config: {
			isNativeTag: ye,
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
var _i = 0;
function vi(e, t) {
	return function(n, r = null) {
		j(n) || (n = O({}, n)), r != null && !N(r) && (r = null);
		let i = gi(), a = /* @__PURE__ */ new WeakSet(), o = [], s = !1, c = i.app = {
			_uid: _i++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: Za,
			get config() {
				return i.config;
			},
			set config(e) {},
			use(e, ...t) {
				return a.has(e) || (e && j(e.install) ? (a.add(e), e.install(c, ...t)) : j(e) && (a.add(e), e(c, ...t))), c;
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
					let u = c._ceVNode || Sa(n, r);
					return u.appContext = i, l === !0 ? l = "svg" : l === !1 && (l = void 0), o && t ? t(u, a) : e(u, a, l), s = !0, c._container = a, a.__vue_app__ = c, Ya(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				s && (Un(o, c._instance, 16), e(null, c._container), delete c._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, c;
			},
			runWithContext(e) {
				let t = yi;
				yi = c;
				try {
					return e();
				} finally {
					yi = t;
				}
			}
		};
		return c;
	};
}
var yi = null, bi = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${P(t)}Modifiers`] || e[`${Re(t)}Modifiers`];
function xi(e, t, ...n) {
	if (e.isUnmounted) return;
	let r = e.vnode.props || D, i = n, a = t.startsWith("update:"), o = a && bi(r, t.slice(7));
	o && (o.trim && (i = n.map((e) => M(e) ? e.trim() : e)), o.number && (i = n.map(We)));
	let s, c = r[s = Be(t)] || r[s = Be(P(t))];
	!c && a && (c = r[s = Be(Re(t))]), c && Un(c, e, 6, i);
	let l = r[s + "Once"];
	if (l) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[s]) return;
		e.emitted[s] = !0, Un(l, e, 6, i);
	}
}
var Si = /* @__PURE__ */ new WeakMap();
function Ci(e, t, n = !1) {
	let r = n ? Si : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, s = !1;
	if (!j(e)) {
		let r = (e) => {
			let n = Ci(e, t, !0);
			n && (s = !0, O(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !s ? (N(e) && r.set(e, null), null) : (A(a) ? a.forEach((e) => o[e] = null) : O(o, a), N(e) && r.set(e, o), o);
}
function wi(e, t) {
	return !e || !be(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), k(e, t[0].toLowerCase() + t.slice(1)) || k(e, Re(t)) || k(e, t));
}
function Ti(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: o, attrs: s, emit: c, render: l, renderCache: u, props: d, data: f, setupState: p, ctx: m, inheritAttrs: h } = e, g = lr(e), _, v;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			_ = Ea(l.call(t, e, u, d, p, f, m)), v = s;
		} else {
			let e = t;
			_ = Ea(e.length > 1 ? e(d, {
				attrs: s,
				slots: o,
				emit: c
			}) : e(d, null)), v = t.props ? s : Ei(s);
		}
	} catch (t) {
		da.length = 0, Wn(t, e, 1), _ = Sa(la);
	}
	let y = _;
	if (v && h !== !1) {
		let e = Object.keys(v), { shapeFlag: t } = y;
		e.length && t & 7 && (a && e.some(xe) && (v = Di(v, a)), y = Ta(y, v, !1, !0));
	}
	return n.dirs && (y = Ta(y, null, !1, !0), y.dirs = y.dirs ? y.dirs.concat(n.dirs) : n.dirs), n.transition && wr(y, n.transition), _ = y, lr(g), _;
}
var Ei = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || be(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, Di = (e, t) => {
	let n = {};
	for (let r in e) (!xe(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function Oi(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? ki(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (Ai(o, r, n) && !wi(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? ki(r, o, l) : !0 : !!o;
	return !1;
}
function ki(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (Ai(t, e, a) && !wi(n, a)) return !0;
	}
	return !1;
}
function Ai(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && N(r) && N(i) ? !it(r, i) : r !== i;
}
function ji({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var Mi = {}, Ni = () => Object.create(Mi), Pi = (e) => Object.getPrototypeOf(e) === Mi;
function Fi(e, t, n, r = !1) {
	let i = {}, a = Ni();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), Li(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ bn(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Ii(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ z(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (wi(e.emitsOptions, o)) continue;
				let u = t[o];
				if (c) if (k(a, o)) u !== a[o] && (a[o] = u, l = !0);
				else {
					let t = P(o);
					i[t] = Ri(c, s, t, u, e, !1);
				}
				else u !== a[o] && (a[o] = u, l = !0);
			}
		}
	} else {
		Li(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !k(t, a) && ((r = Re(a)) === a || !k(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Ri(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !k(t, e)) && (delete a[e], l = !0);
	}
	l && Lt(e.attrs, "set", "");
}
function Li(e, t, n, r) {
	let [i, a] = e.propsOptions, o = !1, s;
	if (t) for (let c in t) {
		if (Pe(c)) continue;
		let l = t[c], u;
		i && k(i, u = P(c)) ? !a || !a.includes(u) ? n[u] = l : (s ||= {})[u] = l : wi(e.emitsOptions, c) || (!(c in r) || l !== r[c]) && (r[c] = l, o = !0);
	}
	if (a) {
		let t = /* @__PURE__ */ z(n), r = s || D;
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			n[s] = Ri(i, t, s, r[s], e, !k(r, s));
		}
	}
	return o;
}
function Ri(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = k(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && j(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = La(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === Re(n)) && (r = !0));
	}
	return r;
}
var zi = /* @__PURE__ */ new WeakMap();
function Bi(e, t, n = !1) {
	let r = n ? zi : t.propsCache, i = r.get(e);
	if (i) return i;
	let a = e.props, o = {}, s = [], c = !1;
	if (!j(e)) {
		let r = (e) => {
			c = !0;
			let [n, r] = Bi(e, t, !0);
			O(o, n), r && s.push(...r);
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	if (!a && !c) return N(e) && r.set(e, _e), _e;
	if (A(a)) for (let e = 0; e < a.length; e++) {
		let t = P(a[e]);
		Vi(t) && (o[t] = D);
	}
	else if (a) for (let e in a) {
		let t = P(e);
		if (Vi(t)) {
			let n = a[e], r = o[t] = A(n) || j(n) ? { type: n } : O({}, n), i = r.type, c = !1, l = !0;
			if (A(i)) for (let e = 0; e < i.length; ++e) {
				let t = i[e], n = j(t) && t.name;
				if (n === "Boolean") {
					c = !0;
					break;
				} else n === "String" && (l = !1);
			}
			else c = j(i) && i.name === "Boolean";
			r[0] = c, r[1] = l, (c || k(r, "default")) && s.push(t);
		}
	}
	let l = [o, s];
	return N(e) && r.set(e, l), l;
}
function Vi(e) {
	return e[0] !== "$" && !Pe(e);
}
var Hi = (e) => e === "_" || e === "_ctx" || e === "$stable", Ui = (e) => A(e) ? e.map(Ea) : [Ea(e)], Wi = (e, t, n) => {
	if (t._n) return t;
	let r = ur((...e) => Ui(t(...e)), n);
	return r._c = !1, r;
}, Gi = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (Hi(n)) continue;
		let i = e[n];
		if (j(i)) t[n] = Wi(n, i, r);
		else if (i != null) {
			let e = Ui(i);
			t[n] = () => e;
		}
	}
}, Ki = (e, t) => {
	let n = Ui(t);
	e.slots.default = () => n;
}, qi = (e, t, n) => {
	for (let r in t) (n || !Hi(r)) && (e[r] = t[r]);
}, Ji = (e, t, n) => {
	let r = e.slots = Ni();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (qi(r, t, n), n && Ue(r, "_", e, !0)) : Gi(t, r);
	} else t && Ki(e, t);
}, Yi = (e, t, n) => {
	let { vnode: r, slots: i } = e, a = !0, o = D;
	if (r.shapeFlag & 32) {
		let e = t._;
		e ? n && e === 1 ? a = !1 : qi(i, t, n) : (a = !t.$stable, Gi(t, i)), o = t;
	} else t && (Ki(e, t), o = { default: 1 });
	if (a) for (let e in i) !Hi(e) && o[e] == null && delete i[e];
}, G = sa;
function Xi(e) {
	return Zi(e);
}
function Zi(e, t) {
	let n = qe();
	n.__VUE__ = !0;
	let { insert: r, remove: i, patchProp: a, createElement: o, createText: s, createComment: c, setText: l, setElementText: u, parentNode: d, nextSibling: f, setScopeId: p = ve, insertStaticContent: m } = e, h = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !ya(e, t) && (r = ge(e), E(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case ca:
				g(e, t, n, r);
				break;
			case la:
				_(e, t, n, r);
				break;
			case ua:
				e ?? v(t, n, r, o);
				break;
			case K:
				S(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? te(e, t, n, r, i, a, o, s, c) : d & 6 ? oe(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, xe);
		}
		u != null && i ? kr(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && kr(e.ref, null, a, e, !0);
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
				n && n._beginPatch(), ie(e, t, i, a, o, s, c);
			} finally {
				n && n._endPatch();
			}
		}
	}, ne = (e, t, n, i, s, c, l, d) => {
		let f, p, { props: m, shapeFlag: h, transition: g, dirs: _ } = e;
		if (f = e.el = o(e.type, c, m && m.is, m), h & 8 ? u(f, e.children) : h & 16 && re(e.children, f, null, i, s, Qi(e, c), l, d), _ && fr(e, null, i, "created"), b(f, e, e.scopeId, l, i), m) {
			for (let e in m) e !== "value" && !Pe(e) && a(f, e, null, m[e], c, i);
			"value" in m && a(f, "value", null, m.value, c), (p = m.onVnodeBeforeMount) && Aa(p, i, e);
		}
		_ && fr(e, null, i, "beforeMount");
		let v = ea(s, g);
		v && g.beforeEnter(f), r(f, t, n), ((p = m && m.onVnodeMounted) || v || _) && G(() => {
			try {
				p && Aa(p, i, e), v && g.enter(f), _ && fr(e, null, i, "mounted");
			} finally {}
		}, s);
	}, b = (e, t, n, r, i) => {
		if (n && p(e, n), r) for (let t = 0; t < r.length; t++) p(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || oa(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				b(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, re = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) h(null, e[l] = s ? Da(e[l]) : Ea(e[l]), t, n, r, i, a, o, s);
	}, ie = (e, t, n, r, i, o, s) => {
		let c = t.el = e.el, { patchFlag: l, dynamicChildren: d, dirs: f } = t;
		l |= e.patchFlag & 16;
		let p = e.props || D, m = t.props || D, h;
		if (n && $i(n, !1), (h = m.onVnodeBeforeUpdate) && Aa(h, n, t, e), f && fr(t, e, n, "beforeUpdate"), n && $i(n, !0), (p.innerHTML && m.innerHTML == null || p.textContent && m.textContent == null) && u(c, ""), d ? x(e.dynamicChildren, d, c, n, r, Qi(t, i), o) : s || ue(e, t, c, null, n, r, Qi(t, i), o, !1), l > 0) {
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
		((h = m.onVnodeUpdated) || f) && G(() => {
			h && Aa(h, n, t, e), f && fr(t, e, n, "updated");
		}, r);
	}, x = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			h(c, l, c.el && (c.type === K || !ya(c, l) || c.shapeFlag & 198) ? d(c.el) : n, null, r, i, a, o, !0);
		}
	}, ae = (e, t, n, r, i) => {
		if (t !== n) {
			if (t !== D) for (let o in t) !Pe(o) && !(o in n) && a(e, o, t[o], null, i, r);
			for (let o in n) {
				if (Pe(o)) continue;
				let s = n[o], c = t[o];
				s !== c && o !== "value" && a(e, o, c, s, i, r);
			}
			"value" in n && a(e, "value", t.value, n.value, i);
		}
	}, S = (e, t, n, i, a, o, c, l, u) => {
		let d = t.el = e ? e.el : s(""), f = t.anchor = e ? e.anchor : s(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (l = l ? l.concat(h) : h), e == null ? (r(d, n, i), r(f, n, i), re(t.children || [], n, f, a, o, c, l, u)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (x(e.dynamicChildren, m, n, a, o, c, l), (t.key != null || a && t === a.subTree) && ta(e, t, !0)) : ue(e, t, n, f, a, o, c, l, u);
	}, oe = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : se(t, n, r, i, a, o, c) : C(e, t, c);
	}, se = (e, t, n, r, i, a, o) => {
		let s = e.component = Na(e, r, i);
		if (Mr(e) && (s.ctx.renderer = xe), Va(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, ce, o), !e.el) {
				let r = s.subTree = Sa(la);
				_(null, r, t, n), e.placeholder = r.el;
			}
		} else ce(s, e, t, n, i, a, o);
	}, C = (e, t, n) => {
		let r = t.component = e.component;
		if (Oi(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			le(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, ce = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = ra(e);
					if (n) {
						t && (t.el = c.el, le(e, t, o)), n.asyncDep.then(() => {
							G(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, f;
				$i(e, !1), t ? (t.el = c.el, le(e, t, o)) : t = c, n && He(n), (f = t.props && t.props.onVnodeBeforeUpdate) && Aa(f, s, t, c), $i(e, !0);
				let p = Ti(e), m = e.subTree;
				e.subTree = p, h(m, p, d(m.el), ge(m), e, i, a), t.el = p.el, u === null && ji(e, p.el), r && G(r, i), (f = t.props && t.props.onVnodeUpdated) && G(() => Aa(f, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = jr(t);
				if ($i(e, !1), l && He(l), !m && (o = c && c.onVnodeBeforeMount) && Aa(o, d, t), $i(e, !0), s && Se) {
					let t = () => {
						e.subTree = Ti(e), Se(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Ti(e);
					h(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && G(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					G(() => Aa(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && jr(d.vnode) && d.vnode.shapeFlag & 256) && e.a && G(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new dt(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => er(u), $i(e, !0), l();
	}, le = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Ii(e, t.props, r, n), Yi(e, t.children, n), Et(), rr(e), Dt();
	}, ue = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, d = e ? e.shapeFlag : 0, f = t.children, { patchFlag: p, shapeFlag: m } = t;
		if (p > 0) {
			if (p & 128) {
				w(l, f, n, r, i, a, o, s, c);
				return;
			} else if (p & 256) {
				de(l, f, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (d & 16 && he(l, i, a), f !== l && u(n, f)) : d & 16 ? m & 16 ? w(l, f, n, r, i, a, o, s, c) : he(l, i, a, !0) : (d & 8 && u(n, ""), m & 16 && re(f, n, r, i, a, o, s, c));
	}, de = (e, t, n, r, i, a, o, s, c) => {
		e ||= _e, t ||= _e;
		let l = e.length, u = t.length, d = Math.min(l, u), f;
		for (f = 0; f < d; f++) {
			let r = t[f] = c ? Da(t[f]) : Ea(t[f]);
			h(e[f], r, n, null, i, a, o, s, c);
		}
		l > u ? he(e, i, a, !0, !1, d) : re(t, n, r, i, a, o, s, c, d);
	}, w = (e, t, n, r, i, a, o, s, c) => {
		let l = 0, u = t.length, d = e.length - 1, f = u - 1;
		for (; l <= d && l <= f;) {
			let r = e[l], u = t[l] = c ? Da(t[l]) : Ea(t[l]);
			if (ya(r, u)) h(r, u, n, null, i, a, o, s, c);
			else break;
			l++;
		}
		for (; l <= d && l <= f;) {
			let r = e[d], l = t[f] = c ? Da(t[f]) : Ea(t[f]);
			if (ya(r, l)) h(r, l, n, null, i, a, o, s, c);
			else break;
			d--, f--;
		}
		if (l > d) {
			if (l <= f) {
				let e = f + 1, d = e < u ? t[e].el : r;
				for (; l <= f;) h(null, t[l] = c ? Da(t[l]) : Ea(t[l]), n, d, i, a, o, s, c), l++;
			}
		} else if (l > f) for (; l <= d;) E(e[l], i, a, !0), l++;
		else {
			let p = l, m = l, g = /* @__PURE__ */ new Map();
			for (l = m; l <= f; l++) {
				let e = t[l] = c ? Da(t[l]) : Ea(t[l]);
				e.key != null && g.set(e.key, l);
			}
			let _, v = 0, y = f - m + 1, ee = !1, te = 0, ne = Array(y);
			for (l = 0; l < y; l++) ne[l] = 0;
			for (l = p; l <= d; l++) {
				let r = e[l];
				if (v >= y) {
					E(r, i, a, !0);
					continue;
				}
				let u;
				if (r.key != null) u = g.get(r.key);
				else for (_ = m; _ <= f; _++) if (ne[_ - m] === 0 && ya(r, t[_])) {
					u = _;
					break;
				}
				u === void 0 ? E(r, i, a, !0) : (ne[u - m] = l + 1, u >= te ? te = u : ee = !0, h(r, t[u], n, null, i, a, o, s, c), v++);
			}
			let b = ee ? na(ne) : _e;
			for (_ = b.length - 1, l = y - 1; l >= 0; l--) {
				let e = m + l, d = t[e], f = t[e + 1], p = e + 1 < u ? f.el || aa(f) : r;
				ne[l] === 0 ? h(null, d, n, p, i, a, o, s, c) : ee && (_ < 0 || l !== b[_] ? T(d, n, p, 2) : _--);
			}
		}
	}, T = (e, t, n, a, o = null) => {
		let { el: s, type: c, transition: l, children: u, shapeFlag: d } = e;
		if (d & 6) {
			T(e.component.subTree, t, n, a);
			return;
		}
		if (d & 128) {
			e.suspense.move(t, n, a);
			return;
		}
		if (d & 64) {
			c.move(e, t, n, xe);
			return;
		}
		if (c === K) {
			r(s, t, n);
			for (let e = 0; e < u.length; e++) T(u[e], t, n, a);
			r(e.anchor, t, n);
			return;
		}
		if (c === ua) {
			y(e, t, n);
			return;
		}
		if (a !== 2 && d & 1 && l) if (a === 0) l.beforeEnter(s), r(s, t, n), G(() => l.enter(s), o);
		else {
			let { leave: a, delayLeave: o, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? i(s) : r(s, t, n);
			}, d = () => {
				s._isLeaving && s[Cr](!0), a(s, () => {
					u(), c && c();
				});
			};
			o ? o(s, u, d) : d();
		}
		else r(s, t, n);
	}, E = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (Et(), kr(s, null, n, e, !0), Dt()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !jr(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Aa(_, t, e), u & 6) me(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && fr(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, xe, r) : l && !l.hasOnce && (a !== K || d > 0 && d & 64) ? he(l, t, n, !1, !0) : (a === K && d & 384 || !i && u & 16) && he(c, t, n), r && fe(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && G(() => {
			_ && Aa(_, t, e), h && fr(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, fe = (e) => {
		let { type: t, el: n, anchor: r, transition: a } = e;
		if (t === K) {
			pe(n, r);
			return;
		}
		if (t === ua) {
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
	}, pe = (e, t) => {
		let n;
		for (; e !== t;) n = f(e), i(e), e = n;
		i(t);
	}, me = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		ia(c), ia(l), r && He(r), i.stop(), a && (a.flags |= 8, E(o, e, t, n)), s && G(s, t), G(() => {
			e.isUnmounted = !0;
		}, t);
	}, he = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) E(e[o], t, n, r, i);
	}, ge = (e) => {
		if (e.shapeFlag & 6) return ge(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = f(e.anchor || e.el), n = t && t[xr];
		return n ? f(n) : t;
	}, ye = !1, be = (e, t, n) => {
		let r;
		e == null ? t._vnode && (E(t._vnode, null, null, !0), r = t._vnode.component) : h(t._vnode || null, e, t, null, null, null, n), t._vnode = e, ye ||= (ye = !0, rr(r), ir(), !1);
	}, xe = {
		p: h,
		um: E,
		m: T,
		r: fe,
		mt: se,
		mc: re,
		pc: ue,
		pbc: x,
		n: ge,
		o: e
	}, O, Se;
	return t && ([O, Se] = t(xe)), {
		render: be,
		hydrate: O,
		createApp: vi(be, O)
	};
}
function Qi({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function $i({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function ea(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function ta(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (A(r) && A(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Da(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && ta(t, a)), a.type === ca && (a.patchFlag === -1 && (a = i[e] = Da(a)), a.el = t.el), a.type === la && !a.el && (a.el = t.el);
	}
}
function na(e) {
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
function ra(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : ra(t);
}
function ia(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function aa(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? aa(t.subTree) : null;
}
var oa = (e) => e.__isSuspense;
function sa(e, t) {
	t && t.pendingBranch ? A(e) ? t.effects.push(...e) : t.effects.push(e) : nr(e);
}
var K = /* @__PURE__ */ Symbol.for("v-fgt"), ca = /* @__PURE__ */ Symbol.for("v-txt"), la = /* @__PURE__ */ Symbol.for("v-cmt"), ua = /* @__PURE__ */ Symbol.for("v-stc"), da = [], fa = null;
function q(e = !1) {
	da.push(fa = e ? null : []);
}
function pa() {
	da.pop(), fa = da[da.length - 1] || null;
}
var ma = 1;
function ha(e, t = !1) {
	ma += e, e < 0 && fa && t && (fa.hasOnce = !0);
}
function ga(e) {
	return e.dynamicChildren = ma > 0 ? fa || _e : null, pa(), ma > 0 && fa && fa.push(e), e;
}
function J(e, t, n, r, i, a) {
	return ga(Y(e, t, n, r, i, a, !0));
}
function _a(e, t, n, r, i) {
	return ga(Sa(e, t, n, r, i, !0));
}
function va(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function ya(e, t) {
	return e.type === t.type && e.key === t.key;
}
var ba = ({ key: e }) => e ?? null, xa = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : M(e) || /* @__PURE__ */ B(e) || j(e) ? {
	i: sr,
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
		key: t && ba(t),
		ref: t && xa(t),
		scopeId: cr,
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
		ctx: sr
	};
	return s ? (Oa(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= M(n) ? 8 : 16), ma > 0 && !o && fa && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && fa.push(c), c;
}
var Sa = Ca;
function Ca(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === Yr) && (e = la), va(e)) {
		let r = Ta(e, t, !0);
		return n && Oa(r, n), ma > 0 && !a && fa && (r.shapeFlag & 6 ? fa[fa.indexOf(e)] = r : fa.push(r)), r.patchFlag = -2, r;
	}
	if (Xa(e) && (e = e.__vccOpts), t) {
		t = wa(t);
		let { class: e, style: n } = t;
		e && !M(e) && (t.class = $e(e)), N(n) && (/* @__PURE__ */ En(n) && !A(n) && (n = O({}, n)), t.style = Je(n));
	}
	let o = M(e) ? 1 : oa(e) ? 128 : Sr(e) ? 64 : N(e) ? 4 : j(e) ? 2 : 0;
	return Y(e, t, n, r, i, o, a, !0);
}
function wa(e) {
	return e ? /* @__PURE__ */ En(e) || Pi(e) ? O({}, e) : e : null;
}
function Ta(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? ka(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && ba(l),
		ref: t && t.ref ? n && a ? A(a) ? a.concat(xa(t)) : [a, xa(t)] : xa(t) : a,
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
		ssContent: e.ssContent && Ta(e.ssContent),
		ssFallback: e.ssFallback && Ta(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && wr(u, c.clone(u)), u;
}
function X(e = " ", t = 0) {
	return Sa(ca, null, e, t);
}
function Z(e = "", t = !1) {
	return t ? (q(), _a(la, null, e)) : Sa(la, null, e);
}
function Ea(e) {
	return e == null || typeof e == "boolean" ? Sa(la) : A(e) ? Sa(K, null, e.slice()) : va(e) ? Da(e) : Sa(ca, null, String(e));
}
function Da(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : Ta(e);
}
function Oa(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (A(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), Oa(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !Pi(t) ? t._ctx = sr : r === 3 && sr && (sr.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else j(t) ? (t = {
		default: t,
		_ctx: sr
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [X(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function ka(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = $e([t.class, r.class]));
		else if (e === "style") t.style = Je([t.style, r.style]);
		else if (be(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(A(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !xe(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Aa(e, t, n, r = null) {
	Un(e, t, 7, [n, r]);
}
var ja = gi(), Ma = 0;
function Na(e, t, n) {
	let r = e.type, i = (t ? t.appContext : e.appContext) || ja, a = {
		uid: Ma++,
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
		scope: new ct(!0),
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
		propsOptions: Bi(r, i),
		emitsOptions: Ci(r, i),
		emit: null,
		emitted: null,
		propsDefaults: D,
		inheritAttrs: r.inheritAttrs,
		ctx: D,
		data: D,
		props: D,
		attrs: D,
		slots: D,
		refs: D,
		setupState: D,
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
	return a.ctx = { _: a }, a.root = t ? t.root : a, a.emit = xi.bind(null, a), e.ce && e.ce(a), a;
}
var Q = null, Pa = () => Q || sr, Fa, Ia;
{
	let e = qe(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Fa = t("__VUE_INSTANCE_SETTERS__", (e) => Q = e), Ia = t("__VUE_SSR_SETTERS__", (e) => Ba = e);
}
var La = (e) => {
	let t = Q;
	return Fa(e), e.scope.on(), () => {
		e.scope.off(), Fa(t);
	};
}, Ra = () => {
	Q && Q.scope.off(), Fa(null);
};
function za(e) {
	return e.vnode.shapeFlag & 4;
}
var Ba = !1;
function Va(e, t = !1, n = !1) {
	t && Ia(t);
	let { props: r, children: i } = e.vnode, a = za(e);
	Fi(e, r, a, t), Ji(e, i, n || t);
	let o = a ? Ha(e, t) : void 0;
	return t && Ia(!1), o;
}
function Ha(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, ei);
	let { setup: r } = n;
	if (r) {
		Et();
		let n = e.setupContext = r.length > 1 ? Ja(e) : null, i = La(e), a = Hn(r, e, 0, [e.props, n]), o = Oe(a);
		if (Dt(), i(), (o || e.sp) && !jr(e) && Er(e), o) {
			if (a.then(Ra, Ra), t) return a.then((n) => {
				Ua(e, n, t);
			}).catch((t) => {
				Wn(t, e, 0);
			});
			e.asyncDep = a;
		} else Ua(e, a, t);
	} else Ka(e, t);
}
function Ua(e, t, n) {
	j(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : N(t) && (e.setupState = Nn(t)), Ka(e, n);
}
var Wa, Ga;
function Ka(e, t, n) {
	let r = e.type;
	if (!e.render) {
		if (!t && Wa && !r.render) {
			let t = r.template || si(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: i } = e.appContext.config, { delimiters: a, compilerOptions: o } = r;
				r.render = Wa(t, O(O({
					isCustomElement: n,
					delimiters: a
				}, i), o));
			}
		}
		e.render = r.render || ve, Ga && Ga(e);
	}
	{
		let t = La(e);
		Et();
		try {
			ri(e);
		} finally {
			Dt(), t();
		}
	}
}
var qa = { get(e, t) {
	return R(e, "get", ""), e[t];
} };
function Ja(e) {
	return {
		attrs: new Proxy(e.attrs, qa),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function Ya(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(Nn(Dn(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in Qr) return Qr[n](e);
		},
		has(e, t) {
			return t in e || t in Qr;
		}
	}) : e.proxy;
}
function Xa(e) {
	return j(e) && "__vccOpts" in e;
}
var $ = (e, t) => /* @__PURE__ */ Fn(e, t, Ba), Za = "3.5.34", Qa = void 0, $a = typeof window < "u" && window.trustedTypes;
if ($a) try {
	Qa = /* @__PURE__ */ $a.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var eo = Qa ? (e) => Qa.createHTML(e) : (e) => e, to = "http://www.w3.org/2000/svg", no = "http://www.w3.org/1998/Math/MathML", ro = typeof document < "u" ? document : null, io = ro && /* @__PURE__ */ ro.createElement("template"), ao = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? ro.createElementNS(to, e) : t === "mathml" ? ro.createElementNS(no, e) : n ? ro.createElement(e, { is: n }) : ro.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => ro.createTextNode(e),
	createComment: (e) => ro.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => ro.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			io.innerHTML = eo(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = io.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, oo = /* @__PURE__ */ Symbol("_vtc");
function so(e, t, n) {
	let r = e[oo];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var co = /* @__PURE__ */ Symbol("_vod"), lo = /* @__PURE__ */ Symbol("_vsh"), uo = /* @__PURE__ */ Symbol(""), fo = /(?:^|;)\s*display\s*:/;
function po(e, t, n) {
	let r = e.style, i = M(n), a = !1;
	if (n && !i) {
		if (t) if (M(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? ho(r, t, "");
		}
		else for (let e in t) n[e] ?? ho(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? ho(r, i, "") : yo(e, i, !M(t) && t ? t[i] : void 0, o) || ho(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[uo];
			e && (n += ";" + e), r.cssText = n, a = fo.test(n);
		}
	} else t && e.removeAttribute("style");
	co in e && (e[co] = a ? r.display : "", e[lo] && (r.display = "none"));
}
var mo = /\s*!important$/;
function ho(e, t, n) {
	if (A(n)) n.forEach((n) => ho(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = vo(e, t);
		mo.test(n) ? e.setProperty(Re(r), n.replace(mo, ""), "important") : e[r] = n;
	}
}
var go = [
	"Webkit",
	"Moz",
	"ms"
], _o = {};
function vo(e, t) {
	let n = _o[t];
	if (n) return n;
	let r = P(t);
	if (r !== "filter" && r in e) return _o[t] = r;
	r = ze(r);
	for (let n = 0; n < go.length; n++) {
		let i = go[n] + r;
		if (i in e) return _o[t] = i;
	}
	return t;
}
function yo(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && M(r) && n === r;
}
var bo = "http://www.w3.org/1999/xlink";
function xo(e, t, n, r, i, a = tt(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(bo, t.slice(6, t.length)) : e.setAttributeNS(bo, t, n) : n == null || a && !nt(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : De(n) ? String(n) : n);
}
function So(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? eo(n) : n);
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
		r === "boolean" ? n = nt(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
	}
	try {
		e[t] = n;
	} catch {}
	o && e.removeAttribute(i || t);
}
function Co(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function wo(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var To = /* @__PURE__ */ Symbol("_vei");
function Eo(e, t, n, r, i = null) {
	let a = e[To] || (e[To] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = Oo(t);
		r ? Co(e, n, a[t] = Mo(r, i), s) : o && (wo(e, n, o, s), a[t] = void 0);
	}
}
var Do = /(?:Once|Passive|Capture)$/;
function Oo(e) {
	let t;
	if (Do.test(e)) {
		t = {};
		let n;
		for (; n = e.match(Do);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : Re(e.slice(2)), t];
}
var ko = 0, Ao = /* @__PURE__ */ Promise.resolve(), jo = () => ko ||= (Ao.then(() => ko = 0), Date.now());
function Mo(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		Un(No(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = jo(), n;
}
function No(e, t) {
	if (A(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Po = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Fo = (e, t, n, r, i, a) => {
	let o = i === "svg";
	t === "class" ? so(e, r, o) : t === "style" ? po(e, n, r) : be(t) ? xe(t) || Eo(e, t, n, r, a) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Io(e, t, r, o)) ? (So(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && xo(e, t, r, o, a, t !== "value")) : e._isVueCE && (Lo(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !M(r))) ? So(e, P(t), r, a, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), xo(e, t, r, o));
};
function Io(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Po(t) && j(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Po(t) && M(n) ? !1 : t in e;
}
function Lo(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = P(t);
	return Array.isArray(n) ? n.some((e) => P(e) === r) : Object.keys(n).some((e) => P(e) === r);
}
var Ro = {};
/* @__NO_SIDE_EFFECTS__ */
function zo(e, t, n) {
	let r = /* @__PURE__ */ Tr(e, t);
	Me(r) && (r = O({}, r, t));
	class i extends Vo {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var Bo = typeof HTMLElement < "u" ? HTMLElement : class {}, Vo = class e extends Bo {
	constructor(e, t = {}, n = rs) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== rs ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(O({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, Qn(() => {
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
			if (n && !A(n)) for (let e in n) {
				let t = n[e];
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = Ge(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[P(e)] = !0);
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
		if (t) for (let e in t) k(this, e) || Object.defineProperty(this, e, { get: () => H(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = A(t) ? t : Object.keys(t || {});
		for (let e of Object.keys(this)) e[0] !== "_" && n.includes(e) && this._setProp(e, this[e]);
		for (let e of n.map(P)) Object.defineProperty(this, e, {
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : Ro, r = P(e);
		t && this._numberProps && this._numberProps[r] && (n = Ge(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === Ro ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(Re(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(Re(e), t + "") : t || this.removeAttribute(Re(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), ns(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Sa(this._def, O(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, Me(t[0]) ? O({ detail: t }, t[0]) : { detail: t }));
			};
			e.emit = (e, ...n) => {
				t(e, n), Re(e) !== e && t(Re(e), n);
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
}, Ho = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return A(t) ? (e) => He(t, e) : t;
};
function Uo(e) {
	e.target.composing = !0;
}
function Wo(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var Go = /* @__PURE__ */ Symbol("_assign");
function Ko(e, t, n) {
	return t && (e = e.trim()), n && (e = We(e)), e;
}
var qo = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e[Go] = Ho(i);
		let a = r || i.props && i.props.type === "number";
		Co(e, t ? "change" : "input", (t) => {
			t.target.composing || e[Go](Ko(e.value, n, a));
		}), (n || a) && Co(e, "change", () => {
			e.value = Ko(e.value, n, a);
		}), t || (Co(e, "compositionstart", Uo), Co(e, "compositionend", Wo), Co(e, "change", Wo));
	},
	mounted(e, { value: t }) {
		e.value = t ?? "";
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[Go] = Ho(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? We(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, Jo = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], Yo = {
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
	exact: (e, t) => Jo.some((n) => e[`${n}Key`] && !t.includes(n))
}, Xo = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = Yo[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, Zo = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, Qo = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = Re(n.key);
		if (t.some((e) => e === r || Zo[e] === r)) return e(n);
	}));
}, $o = /* @__PURE__ */ O({ patchProp: Fo }, ao), es;
function ts() {
	return es ||= Xi($o);
}
var ns = ((...e) => {
	ts().render(...e);
}), rs = ((...e) => {
	let t = ts().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = as(e);
		if (!r) return;
		let i = t._component;
		!j(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, is(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function is(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function as(e) {
	return M(e) ? document.querySelector(e) : e;
}
//#endregion
//#region packages/sdk-vue/src/use-shortcuts.ts
function os(e) {
	if (!(e instanceof HTMLElement)) return !1;
	if (e instanceof HTMLInputElement) {
		let t = e.type;
		return t === "" || t === "text" || t === "search" || t === "email" || t === "url" || t === "password" || t === "tel" || t === "number" || t === "date" || t === "datetime-local" || t === "month" || t === "week" || t === "time";
	}
	return !!(e instanceof HTMLTextAreaElement || e.isContentEditable);
}
function ss(e) {
	return /Escape/i.test(e) ? !0 : /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(e);
}
function cs(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		if (ss(n)) {
			t[n] = r;
			continue;
		}
		t[n] = (e) => {
			os(e.target) || r(e);
		};
	}
	return t;
}
function ls(e, t = {}) {
	if (typeof window > "u") return;
	let n = null, r = cs(e), i = () => {
		n ||= de(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? _r(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), Wr(a);
}
//#endregion
//#region packages/sdk-vue/src/markdown.ts
var us = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
function ds(e) {
	return e.replace(/[&<>"']/g, (e) => us[e] ?? e);
}
var fs = /\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, ps = "CODE", ms = "END";
function hs(e, t) {
	let n = [], r = e.replace(/`([^`]+)`/g, (e, t) => (n.push("<code>" + t + "</code>"), ps + (n.length - 1) + ms));
	if (r = r.replace(fs, (e) => "<a href=\"" + e + "\" rel=\"noopener noreferrer\">" + e + "</a>"), t.workspaceId) {
		let e = encodeURIComponent(t.workspaceId);
		r = r.replace(/(^|[^\w&])#(\d+)\b/g, (t, n, r) => n + "<a href=\"/x/issues/" + e + "/" + r + "\" class=\"issue-ref\">#" + r + "</a>");
	}
	r = r.replace(/\*\*([^*]+)\*\*/g, (e, t) => "<strong>" + t + "</strong>"), r = r.replace(/(^|[^*])\*([^*\s][^*]*?[^*\s]|[^*\s])\*(?!\*)/g, (e, t, n) => t + "<em>" + n + "</em>");
	let i = /* @__PURE__ */ RegExp("CODE(\\d+)END", "g");
	return r.replace(i, (e, t) => n[Number(t)] ?? "");
}
function gs(e) {
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
function _s(e, t = {}) {
	if (!e) return "";
	let n = gs(e), r = [];
	for (let e of n) switch (e.kind) {
		case "heading": {
			let n = e.level ?? 1, i = hs(ds(e.text), t);
			r.push("<h" + n + ">" + i + "</h" + n + ">");
			break;
		}
		case "paragraph": {
			let n = hs(ds(e.text), t);
			r.push("<p>" + n.replace(/\n/g, "<br />") + "</p>");
			break;
		}
		case "code": {
			let t = e.lang ? " data-lang=\"" + ds(e.lang) + "\"" : "";
			r.push("<pre" + t + "><code>" + ds(e.text) + "</code></pre>");
			break;
		}
		case "list": {
			let n = e.ordered ? "ol" : "ul", i = (e.items ?? []).map((e) => "  <li>" + hs(ds(e), t) + "</li>").join("\n");
			r.push("<" + n + ">\n" + i + "\n</" + n + ">");
			break;
		}
	}
	return r.join("\n");
}
//#endregion
//#region packages/sdk-vue/src/parse-query.ts
function vs(e, t) {
	let n = {}, r = /* @__PURE__ */ new Set(), i = [], a = new Set(t);
	if (!e || !e.trim()) return {
		text: "",
		filters: n,
		unknown: []
	};
	let o = ys(e);
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
function ys(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n;) {
		for (; r < n && bs(e.charCodeAt(r));) r += 1;
		if (r >= n) break;
		let i = r, a = -1;
		for (; r < n && !bs(e.charCodeAt(r));) {
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
			if (xs(n)) {
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
function bs(e) {
	return e === 32 || e === 9 || e === 10 || e === 13;
}
function xs(e) {
	if (e.length === 0 || !Ss(e.charCodeAt(0))) return !1;
	for (let t = 1; t < e.length; t += 1) {
		let n = e.charCodeAt(t);
		if (!Ss(n) && !Cs(n) && n !== 95 && n !== 45) return !1;
	}
	return !0;
}
function Ss(e) {
	return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function Cs(e) {
	return e >= 48 && e <= 57;
}
//#endregion
//#region packages/sdk-vue/src/classify-principal.ts
var ws = {
	kind: "unknown",
	label: "unknown",
	glyph: "·",
	tone: "neutral"
};
function Ts(e) {
	if (!e) return ws;
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: Es(r),
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
			glyph: Es(r) || "·",
			tone: "neutral"
		};
	}
}
function Es(e) {
	return e.slice(0, 1).toUpperCase();
}
//#endregion
//#region packages/sdk-vue/src/comtrya-config.ts
function Ds() {
	if (typeof window > "u") return [];
	let e = window.location.pathname;
	if (!e.startsWith("/r/")) return [];
	let t = e.slice(3), n = t.indexOf("/p/");
	return (n >= 0 ? t.slice(0, n) : t).split("/").filter(Boolean).map(decodeURIComponent);
}
async function Os(e) {
	try {
		let t = e ?? Ds();
		return t.length === 0 ? [] : (((await d().query("query ComtryaProjects($segments: [String!]!) {\n      workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n    }", { segments: t })).workspace?.repositoryByPath?.comtryaConfig ?? null)?.projects ?? []).filter((e) => typeof e == "object" && !!e);
	} catch {
		return [];
	}
}
async function ks(e, t) {
	return ((await Os(t)).find((t) => t.name === e)?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0);
}
//#endregion
//#region packages/sdk-vue/src/LabelPill.vue?vue&type=script&setup=true&lang.ts
var As = ["title"], js = {
	key: 0,
	class: "label-pill-value"
}, Ms = { class: "label-pill-type" }, Ns = { class: "label-pill-value" }, Ps = /* @__PURE__ */ Tr({
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
			class: $e(["label-pill", [`label-pill--${r.value.kind}`]]),
			title: a.value ?? void 0,
			style: Je(i.value ? { "--label-color": i.value } : void 0)
		}, [r.value.kind === "plain" ? (q(), J("span", js, F(r.value.value), 1)) : (q(), J(K, { key: 1 }, [
			Y("span", Ms, F(r.value.type), 1),
			t[0] ||= Y("span", {
				class: "label-pill-sep",
				"aria-hidden": "true"
			}, "::", -1),
			Y("span", Ns, F(r.value.value), 1)
		], 64))], 14, As));
	}
});
//#endregion
//#region packages/sdk-vue/src/index.ts
function Fs(e) {
	Is(e.tagName, e.component);
	let t = /* @__PURE__ */ zo(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(Rs(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function Is(e, t) {
	if (typeof document > "u") return;
	let n = Ls(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function Ls(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function Rs(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_epics/dist/ext_epics.client.ts
var zs = {
	createEpic: async (e) => o("ext_epics", "epics", "create-epic", e),
	changeStateEpic: async (e) => o("ext_epics", "epics", "change-state-epic", e),
	assignProject: async (e) => o("ext_epics", "epics", "assign-project", e),
	getEpic: async (e) => o("ext_epics", "epics", "get-epic", e),
	listEpics: async (e) => o("ext_epics", "epics", "list-epics", e),
	byRefEpic: async (e) => o("ext_epics", "epics", "by-ref-epic", e),
	byRefsEpic: async (e) => o("ext_epics", "epics", "by-refs-epic", e),
	progressEpic: async (e) => o("ext_epics", "epics", "progress-epic", e),
	issuesInEpic: async (e) => o("ext_epics", "epics", "issues-in-epic", e),
	childrenOfEpic: async (e) => o("ext_epics", "epics", "children-of-epic", e)
};
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/api.ts
function Bs(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Vs(e) {
	return `comtrya://workspace/${e}`;
}
function Hs(e) {
	switch (e) {
		case "IN_PROGRESS":
		case "AT_RISK":
		case "DONE":
		case "CANCELED": return e;
		default: return "PLANNED";
	}
}
function Us(e) {
	return {
		id: e.id,
		workspaceId: e.workspaceId ?? e.workspace?.replace(/^comtrya:\/\/workspace\//, "") ?? "",
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: Hs(e.state),
		targetDate: e.targetDate ?? null,
		ownerRef: e.ownerRef ?? null,
		labels: e.labels ?? [],
		createdAt: e.createdAt ?? null,
		closedAt: e.closedAt ?? null,
		projectName: e.projectName ?? null
	};
}
async function Ws(e, t) {
	let n = Bs(await zs.byRefEpic(t), "epicByRef");
	return n ? Us(n) : null;
}
async function Gs(e, t) {
	let n = Bs(await zs.listEpics({
		workspace: Vs(t.workspaceId),
		limit: 1024
	}), "listEpics").map(Us), r = t.state ? Hs(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function Ks(e, t) {
	return Bs(await zs.progressEpic(t), "epicProgress");
}
async function qs(e, t) {
	return Bs(await zs.issuesInEpic(t), "issuesInEpic");
}
async function Js(e, t, n) {
	return Us(Bs(await zs.changeStateEpic({
		id: t,
		state: n
	}), "changeEpicState"));
}
async function Ys(e, t) {
	return Us(Bs(await zs.createEpic({
		workspace: Vs(t.workspaceId),
		title: t.title,
		bodyMarkdown: t.bodyMarkdown ?? "",
		ownerRef: null,
		targetDate: null,
		labels: [],
		parentEpicRef: null,
		projectName: t.projectName ?? null
	}), "createEpic"));
}
async function Xs(e, t) {
	return Us(Bs(await zs.assignProject({
		id: e,
		projectName: t ?? null
	}), "assignProject"));
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/types.ts
function Zs() {
	return me() ?? "";
}
var Qs = "epics";
function $s(e) {
	return `comtrya://epic/${e.id}`;
}
function ec(e) {
	return p(Qs, `/${e.workspaceId}/${e.id}`);
}
function tc(e) {
	return `${p(Qs, "/new")}?workspaceId=${e}`;
}
function nc(e) {
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
var rc = /* @__PURE__ */ new Map();
function ic(e) {
	return [
		e.id,
		e.title,
		e.state,
		e.projectName ?? ""
	].join("|");
}
var ac = [
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
function oc(e) {
	return e.projectName ? ` (${e.projectName})` : "";
}
function sc(e, t) {
	let n = [], r = oc(e);
	n.push(E({
		id: `ext_epics.open.${e.id}`,
		title: `Open epic ${e.title}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: () => {
			window.location.href = ec(e);
		}
	}));
	for (let { state: i, verb: a } of ac) e.state !== i && n.push(E({
		id: `ext_epics.mark.${i.toLowerCase()}.${e.id}`,
		title: `Mark epic ${e.title} ${a}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: async () => {
			await Js(t, e.id, i);
		}
	}));
	return () => n.forEach((e) => e());
}
async function cc(e, t) {
	let n;
	try {
		n = await Gs(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_epics] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = ic(t), i = rc.get(t.id);
		i && i.signature === n || (i?.unregister(), rc.set(t.id, {
			signature: n,
			unregister: sc(t, e)
		}));
	}
	for (let [e, t] of rc) r.has(e) || (t.unregister(), rc.delete(e));
}
function lc(e) {
	let t = [], n = !1;
	return he().then((r) => {
		if (!n) {
			cc(e, r);
			for (let n of ["dev.comtrya.epic.created", "dev.comtrya.epic.state-changed"]) t.push(m({
				type: n,
				onEvent: () => {
					cc(e, r);
				},
				onError: () => {}
			}));
		}
	}), () => {
		n = !0;
		for (let e of t) e();
		for (let e of rc.values()) e.unregister();
		rc.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicCard.vue?vue&type=script&setup=true&lang.ts
var uc = ["data-state"], dc = ["data-epic-id"], fc = { class: "epic-card-title" }, pc = ["href"], mc = ["data-author-kind", "title"], hc = { class: "owner-glyph" }, gc = ["title"], _c = {
	key: 0,
	class: "epic-meta"
}, vc = {
	key: 1,
	class: "epic-meta"
}, yc = {
	key: 1,
	class: "epic-line muted"
}, bc = {
	key: 2,
	class: "epic-card-fallback"
}, xc = { class: "epic-line muted" }, Sc = { class: "epic-line warn" }, Cc = /* @__PURE__ */ Tr({
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
		let n = e, r = t, i = /* @__PURE__ */ V("idle"), a = /* @__PURE__ */ V(null), o = /* @__PURE__ */ V(n.epic ?? null), s = /* @__PURE__ */ V(null), c = $(() => n.resourceRef ?? n.ref ?? ""), l = $(() => n.client ?? n.comtryaClient), u = $(() => n.epic ?? o.value), d = $(() => nc(u.value?.state)), f = $(() => (s.value?.issuesOpen ?? 0) + (s.value?.issuesClosed ?? 0));
		Br(p), _r(() => [
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
				o.value = await Ws(l.value, c.value), i.value = o.value ? "ready" : "empty", await m();
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
				s.value = await Ks(l.value, c.value);
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
			Y("div", fc, [
				Y("span", { class: $e(["epic-pill", d.value.className]) }, F(d.value.label), 3),
				Y("a", {
					class: "epic-title-link",
					href: H(ec)(u.value)
				}, F(u.value.title), 9, pc),
				u.value.ownerRef ? (q(), J("button", {
					key: 0,
					type: "button",
					class: $e(["epic-owner", { active: n.activeOwner === u.value.ownerRef }]),
					"data-author-kind": h(u.value.ownerRef).kind,
					title: `${u.value.ownerRef}\nClick to filter by this owner`,
					onClick: t[0] ||= Xo((e) => r("owner-click", u.value.ownerRef), ["prevent", "stop"])
				}, [Y("span", hc, F(h(u.value.ownerRef).glyph), 1), X(" " + F(h(u.value.ownerRef).label), 1)], 10, mc)) : Z("", !0),
				u.value.projectName ? (q(), J("button", {
					key: 1,
					type: "button",
					class: $e(["epic-project", { active: n.activeProject === u.value.projectName }]),
					title: `${u.value.projectName}\nClick to filter by this project`,
					onClick: t[1] ||= Xo((e) => r("project-click", u.value.projectName), ["prevent", "stop"])
				}, [t[2] ||= Y("span", { class: "project-glyph" }, "◇", -1), X(" " + F(u.value.projectName), 1)], 10, gc)) : Z("", !0)
			]),
			s.value ? (q(), J("div", _c, [Y("span", null, F(s.value.issuesClosed ?? 0) + "/" + F(f.value) + " issues", 1), Y("span", null, F(s.value.percentComplete ?? 0) + "% complete", 1)])) : Z("", !0),
			u.value.targetDate ? (q(), J("div", vc, [Y("span", null, "target: " + F(u.value.targetDate), 1)])) : Z("", !0)
		], 8, dc)) : i.value === "loading" ? (q(), J("p", yc, " Loading " + F(c.value), 1)) : (q(), J("div", bc, [Y("p", xc, F(c.value || "epic"), 1), Y("p", Sc, F(a.value ?? "epic not found"), 1)]))], 8, uc));
	}
}), wc = ".epic-card[data-v-c61c70a7]{display:block}.epic-card-body[data-v-c61c70a7]{border:.5px solid var(--line,#ffffff12);gap:6px;padding:10px 12px;display:grid}.epic-card-title[data-v-c61c70a7]{align-items:baseline;gap:8px;min-width:0;display:flex}.epic-pill[data-v-c61c70a7],.epic-meta[data-v-c61c70a7],.epic-line[data-v-c61c70a7]{font-family:var(--font-mono,monospace)}.epic-pill[data-v-c61c70a7]{border:.5px solid;padding:1px 8px;font-size:10px}.epic-project[data-v-c61c70a7]{font-family:var(--font-mono,monospace);color:var(--accent-blue,#1d55a6);cursor:pointer;font-size:11px;font:inherit;font-family:var(--font-mono,monospace);background:0 0;border:.5px solid;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-project[data-v-c61c70a7]:hover{background:var(--bg-2,#0e1014)}.epic-project.active[data-v-c61c70a7]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);border-color:var(--fg,#fffffff0)}.epic-owner+.epic-project[data-v-c61c70a7]{margin-left:4px}.epic-project .project-glyph[data-v-c61c70a7]{font-size:10px}.epic-owner[data-v-c61c70a7]{font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);cursor:pointer;font-size:11px;font:inherit;font-family:var(--font-mono,monospace);background:0 0;border:1px dashed;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-owner[data-v-c61c70a7]:hover{background:var(--bg-2,#0e1014)}.epic-owner.active[data-v-c61c70a7]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);border-style:solid;border-color:var(--fg,#fffffff0)}.epic-owner.active .owner-glyph[data-v-c61c70a7]{color:inherit}.epic-owner .owner-glyph[data-v-c61c70a7]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.epic-owner[data-author-kind=agent][data-v-c61c70a7]{color:#6b3fa0}.epic-owner[data-author-kind=bot][data-v-c61c70a7]{color:var(--accent-blue,#1d55a6)}.epic-owner[data-author-kind=credential][data-v-c61c70a7]{color:var(--accent-yellow,#c89300)}.epic-owner[data-author-kind=team][data-v-c61c70a7]{color:var(--accent-teal,#087f6f)}.epic-state-good[data-v-c61c70a7]{color:var(--ok,#5dc879)}@supports (color:lab(0% 0 0)){.epic-state-good[data-v-c61c70a7]{color:var(--ok,lab(72.9029% -45.1402 29.5956))}}.epic-state-warn[data-v-c61c70a7]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.epic-state-warn[data-v-c61c70a7]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}.epic-state-muted[data-v-c61c70a7],.epic-meta[data-v-c61c70a7],.muted[data-v-c61c70a7]{color:var(--fg-3,#ffffff85)}.epic-title-link[data-v-c61c70a7]{min-width:0;color:inherit;font-family:var(--font-serif,system-ui);overflow-wrap:anywhere;font-weight:600}.epic-meta[data-v-c61c70a7]{flex-wrap:wrap;gap:8px;font-size:11px;display:flex}.epic-line[data-v-c61c70a7]{margin:4px 0;font-size:12px}.warn[data-v-c61c70a7]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-c61c70a7]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}", Tc = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, Ec = /* @__PURE__ */ Tc(Cc, [["styles", [wc]], ["__scopeId", "data-v-c61c70a7"]]);
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/issue-rows.ts
function Dc(e, t = "") {
	return typeof e == "string" ? e : t;
}
function Oc(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function kc(e) {
	let t = typeof e == "string" ? e.toUpperCase() : "";
	return t === "CLOSED" ? "CLOSED" : t === "REOPENED" ? "REOPENED" : "OPEN";
}
function Ac(e) {
	return typeof e == "string" ? e.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/[^/]+)?$/)?.[1] ?? null : null;
}
async function jc(e) {
	let t = await o("ext_issues", "issues", "by-ref-issue", e);
	if (!t.ok || !t.value || typeof t.value != "object") return null;
	let n = t.value, r = Oc(n.number), i = Ac(n.repository), a = r !== null && i ? p("issues", `/${i}/${r}`) : null;
	return {
		ref: e,
		id: Dc(n.id),
		number: r,
		title: Dc(n.title, "(untitled)"),
		state: kc(n.state),
		projectName: typeof n.projectName == "string" ? n.projectName : null,
		labels: Array.isArray(n.labels) ? n.labels.filter((e) => typeof e == "string") : [],
		authorRef: typeof n.authorRef == "string" ? n.authorRef : null,
		href: a
	};
}
async function Mc(e) {
	return (await Promise.all(e.map((e) => jc(e)))).filter((e) => e !== null);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/epic-detail-styles.ts
var Nc = "ext-epics-detail-styles", Pc = "\n.epic-detail {\n  max-width: 880px;\n  display: grid;\n  gap: 24px;\n  padding: 24px 0 48px;\n  font-family: var(--serif, \"iA Writer Quattro\", Georgia, serif);\n}\n\n.epic-detail .epic-line,\n.epic-detail .epic-meta,\n.epic-detail .epic-progress,\n.epic-detail .epic-issues-list,\n.epic-detail .epic-actions,\n.epic-detail .epic-actions-heading,\n.epic-detail .epic-kbd-hint,\n.epic-detail .epic-section-count {\n  font-family: var(--mono, ui-monospace, \"IBM Plex Mono\", monospace);\n}\n\n.epic-header { display: grid; gap: 6px; }\n\n.epic-overline {\n  margin: 0;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10px;\n  letter-spacing: 0.18em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-title {\n  margin: 0;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  font-size: 28px;\n  letter-spacing: -0.01em;\n  line-height: 1.15;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  align-items: center;\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-pill {\n  padding: 1px 8px;\n  border: 1px solid currentColor;\n  text-transform: lowercase;\n}\n\n.epic-state-good { color: var(--ink-go, #087f6f); }\n.epic-state-warn { color: var(--ink-warn, #c2410c); }\n.epic-state-muted, .muted { color: var(--ink-faint, #888); }\n.epic-line.warn { color: var(--ink-warn, #c2410c); }\n\n.epic-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 1px 7px;\n  border-radius: 2px;\n  font-size: 11px;\n  line-height: 16px;\n  white-space: nowrap;\n}\n\n.epic-chip .chip-glyph {\n  font-size: 10px;\n}\n\n.epic-chip.tone-blue {\n  background: var(--chip-blue-bg, #e5edf7);\n  color: var(--chip-blue-ink, #1f3b6a);\n}\n.epic-chip.tone-teal {\n  background: var(--chip-teal-bg, #d8f0eb);\n  color: var(--chip-teal-ink, #0c5f54);\n}\n.epic-chip.tone-grey {\n  background: var(--chip-grey-bg, #ececea);\n  color: var(--chip-grey-ink, #4a4a45);\n}\n.epic-chip.compact {\n  padding: 0 6px;\n  font-size: 10.5px;\n}\n\n.epic-meta-time {\n  margin-left: auto;\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n/* \"Routed to\" panel — CUE Project ownership surfaced on the\n * detail page. Same paper-card aesthetic as the progress\n * panel above; owner chips carry classifier-glyph borders\n * so the visual vocabulary matches IssueDetail iter 59. */\n.epic-routed {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-routed-head {\n  display: flex;\n  align-items: baseline;\n  gap: 10px;\n}\n\n.epic-routed-label {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-project {\n  margin-left: auto;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--accent-blue, #1d55a6);\n  text-decoration: none;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-project:hover {\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n\n/* iter 69 — inline Project picker on EpicDetail. Mirrors the\n * iter 68 IssueDetail select styling so both detail surfaces\n * read identically. */\n.epic-project-select {\n  width: 100%;\n  border: 1.5px solid var(--ink-rule, #d8d6cf);\n  background: var(--paper, #fffdf8);\n  color: var(--ink, #111);\n  padding: 8px 10px;\n  font-family: var(--mono, monospace);\n  font-size: 13px;\n  outline: none;\n  transition: border-color 120ms ease;\n}\n\n.epic-project-select:focus {\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-project-select:disabled {\n  cursor: wait;\n  opacity: 0.55;\n}\n\n.epic-routed-list {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-routed-owner {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 2px 8px;\n  border: 1px solid currentColor;\n  color: var(--ink, #111);\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-owner .chip-glyph {\n  font-family: var(--display, system-ui);\n  font-size: 12px;\n  line-height: 1;\n}\n\n.epic-routed-owner[data-author-kind=\"team\"]       { color: var(--accent-teal, #087f6f); }\n.epic-routed-owner[data-author-kind=\"human\"]      { color: var(--ink, #111); }\n.epic-routed-owner[data-author-kind=\"agent\"]      { color: #6b3fa0; }\n.epic-routed-owner[data-author-kind=\"bot\"]        { color: var(--accent-blue, #1d55a6); }\n.epic-routed-owner[data-author-kind=\"credential\"] { color: var(--accent-yellow, #c89300); }\n\n.epic-routed-source {\n  margin: 0;\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-source code {\n  font-family: var(--mono, monospace);\n  font-size: 11px;\n  padding: 0 4px;\n  background: var(--paper-tint, #f2efe7);\n  color: var(--ink-soft, #2c2b28);\n}\n\n.epic-progress-head {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  align-items: baseline;\n  font-size: 12px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-progress-stat {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 4px;\n}\n\n.epic-progress-stat strong {\n  font-weight: 600;\n  color: var(--ink, #1a1a1a);\n  font-size: 15px;\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-progress-stat .stat-of {\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress-stat .stat-label {\n  color: var(--ink-faint, #6e6a62);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-progress-sep {\n  color: var(--ink-rule, #c8c6bf);\n  padding: 0 2px;\n}\n\n.epic-progress-bar {\n  height: 4px;\n  background: var(--ink-rule-soft, #ebe9e2);\n  border-radius: 2px;\n  overflow: hidden;\n}\n\n.epic-progress-fill {\n  height: 100%;\n  background: var(--ink-go, #087f6f);\n  transition: width 200ms ease;\n}\n\n.epic-body {\n  margin: 0;\n  font-size: 15.5px;\n  line-height: 1.6;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-body.muted {\n  padding: 12px 14px;\n  border: 1px dashed var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  color: var(--ink-faint, #888);\n  font-size: 12px;\n  font-family: var(--mono, ui-monospace, monospace);\n}\n\n.epic-body.prose h1,\n.epic-body.prose h2,\n.epic-body.prose h3,\n.epic-body.prose h4 {\n  margin: 16px 0 6px;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  line-height: 1.2;\n  letter-spacing: -0.005em;\n}\n\n.epic-body.prose h1 { font-size: 20px; }\n.epic-body.prose h2 { font-size: 17px; }\n.epic-body.prose h3 { font-size: 15px; }\n\n.epic-body.prose p {\n  margin: 8px 0;\n}\n\n.epic-body.prose ul {\n  margin: 6px 0 6px 20px;\n  padding: 0;\n}\n\n.epic-body.prose li {\n  margin: 2px 0;\n}\n\n.epic-body.prose code {\n  font-family: var(--mono, ui-monospace, monospace);\n  background: var(--ink-rule-soft, #efeee8);\n  padding: 0 4px;\n  border-radius: 2px;\n  font-size: 0.9em;\n}\n\n.epic-body.prose pre {\n  background: var(--surface-2, #f7f6f1);\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  padding: 10px 12px;\n  overflow-x: auto;\n  font-size: 12.5px;\n  font-family: var(--mono, ui-monospace, monospace);\n}\n\n.epic-body.prose pre code {\n  background: transparent;\n  padding: 0;\n}\n\n.epic-section { display: grid; gap: 8px; }\n\n.epic-section-head {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding-bottom: 6px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-section h3 {\n  margin: 0;\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-weight: 600;\n  font-size: 13px;\n  letter-spacing: -0.005em;\n}\n\n.epic-section-count {\n  margin-left: auto;\n  font-size: 11px;\n  color: var(--ink-faint, #888);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-section-count [data-zero=\"true\"] { color: var(--ink-rule, #c8c6bf); }\n.epic-section-count .sep { padding: 0 2px; color: var(--ink-rule, #c8c6bf); }\n\n.epic-issues-list {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n}\n\n.epic-issue-row {\n  display: grid;\n  grid-template-columns: 18px 56px 1fr auto;\n  align-items: center;\n  gap: 10px;\n  padding: 6px 8px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n  font-size: 12.5px;\n  cursor: pointer;\n  outline: none;\n}\n\n.epic-issue-row:last-child { border-bottom: none; }\n\n.epic-issue-row:hover,\n.epic-issue-row.focused,\n.epic-issue-row:focus {\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-issue-row .row-state {\n  text-align: center;\n  font-size: 11px;\n}\n\n.epic-issue-row .row-state[data-state=\"OPEN\"],\n.epic-issue-row .row-state[data-state=\"REOPENED\"] {\n  color: var(--ink-go, #087f6f);\n}\n.epic-issue-row .row-state[data-state=\"CLOSED\"] {\n  color: var(--ink-faint, #888);\n}\n\n.epic-issue-row.state-closed {\n  color: var(--ink-faint, #888);\n}\n.epic-issue-row.state-closed .row-title {\n  text-decoration: line-through;\n  text-decoration-color: var(--ink-rule, #c8c6bf);\n}\n\n.epic-issue-row .row-number {\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-issue-row .row-title {\n  font-family: var(--display, \"iA Writer Quattro\", Georgia, serif);\n  font-size: 13px;\n  color: var(--ink, #1a1a1a);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.epic-issue-row .row-trailing {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: nowrap;\n}\n\n.row-author {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.row-author[data-author-kind=\"agent\"] { color: var(--ink-go, #087f6f); }\n.row-author[data-author-kind=\"credential\"],\n.row-author[data-author-kind=\"bot\"] { color: var(--ink-warn, #c2410c); }\n\n.epic-kbd-hint {\n  margin: 0;\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.epic-kbd-hint kbd {\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10px;\n  padding: 0 4px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-actions-section {\n  display: grid;\n  gap: 8px;\n  padding-top: 12px;\n  border-top: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-actions-heading {\n  margin: 0;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 10.5px;\n  letter-spacing: 0.16em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n  font-weight: 500;\n}\n\n.epic-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-actions button {\n  padding: 4px 12px;\n  font-family: var(--mono, ui-monospace, monospace);\n  font-size: 11px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n  color: var(--ink, #1a1a1a);\n  cursor: pointer;\n  letter-spacing: 0.01em;\n}\n\n.epic-actions button:hover:not(:disabled) {\n  background: var(--ink, #1a1a1a);\n  color: var(--surface, #ffffff);\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-actions button:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n\n.epic-comments {\n  display: grid;\n  gap: 8px;\n}\n\n.epic-comments-head {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  gap: 12px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 4px;\n}\n\n.epic-comments-head h2 {\n  margin: 0;\n  font-family: var(--display, system-ui);\n  font-size: 18px;\n}\n\n.epic-comments-count {\n  font-family: var(--mono, monospace);\n  font-size: 13px;\n  color: var(--ink-faint, #68645c);\n  font-weight: normal;\n}\n";
function Fc() {
	if (typeof document > "u" || document.getElementById(Nc)) return;
	let e = document.createElement("style");
	e.id = Nc, e.textContent = Pc, document.head.appendChild(e);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/CustomElementHost.vue
var Ic = /* @__PURE__ */ Tc(/* @__PURE__ */ Tr({
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
		Br(i), _r(() => [
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
async function Lc(e) {
	return { ownerRefs: await ks(e) };
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicDetail.vue?vue&type=script&setup=true&lang.ts
var Rc = ["data-state", "data-epic-id"], zc = {
	key: 0,
	class: "epic-line muted"
}, Bc = {
	key: 1,
	class: "epic-line warn"
}, Vc = {
	key: 2,
	class: "epic-line warn"
}, Hc = { class: "epic-header" }, Uc = { class: "epic-title" }, Wc = { class: "epic-meta" }, Gc = ["title"], Kc = {
	key: 1,
	class: "epic-chip tone-grey",
	title: "Owner"
}, qc = {
	key: 2,
	class: "epic-chip tone-grey"
}, Jc = {
	key: 3,
	class: "epic-meta-time"
}, Yc = {
	key: 0,
	class: "epic-progress",
	"data-smoke": "epic-progress"
}, Xc = { class: "epic-progress-head" }, Zc = { class: "epic-progress-stat" }, Qc = { class: "stat-of" }, $c = { class: "epic-progress-stat" }, el = {
	key: 0,
	class: "epic-progress-sep"
}, tl = {
	key: 1,
	class: "epic-progress-stat"
}, nl = ["aria-valuenow"], rl = {
	class: "epic-routed",
	"data-smoke": "epic-project-picker"
}, il = { class: "epic-routed-head" }, al = ["href", "title"], ol = ["value", "disabled"], sl = ["value"], cl = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, ll = {
	key: 1,
	class: "epic-routed",
	"data-smoke": "epic-project-owners"
}, ul = { class: "epic-routed-head" }, dl = ["href", "title"], fl = { class: "epic-routed-list" }, pl = ["data-author-kind", "title"], ml = { class: "chip-glyph" }, hl = { class: "epic-routed-source" }, gl = ["data-epic-id", "innerHTML"], _l = {
	key: 3,
	class: "epic-body muted"
}, vl = {
	class: "epic-section",
	"data-smoke": "epic-issues"
}, yl = { class: "epic-section-head" }, bl = { class: "epic-section-count" }, xl = ["data-zero"], Sl = ["data-zero"], Cl = {
	key: 0,
	class: "epic-line muted"
}, wl = {
	key: 1,
	class: "epic-issues-list",
	"data-smoke": "epic-issues-list"
}, Tl = [
	"onClick",
	"onKeydown",
	"onFocus"
], El = ["data-state"], Dl = { key: 0 }, Ol = { key: 1 }, kl = { class: "row-number" }, Al = { class: "row-title" }, jl = { class: "row-trailing" }, Ml = ["title"], Nl = ["data-author-kind", "title"], Pl = { class: "author-glyph" }, Fl = {
	key: 2,
	class: "epic-kbd-hint muted"
}, Il = { class: "epic-actions-section" }, Ll = { class: "epic-actions" }, Rl = ["disabled", "onClick"], zl = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, Bl = { class: "epic-comments-head" }, Vl = {
	key: 0,
	class: "epic-comments-count"
}, Hl = /* @__PURE__ */ Tr({
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
		], r = /* @__PURE__ */ V("idle"), i = /* @__PURE__ */ V("idle"), a = /* @__PURE__ */ V(null), o = /* @__PURE__ */ V(null), s = /* @__PURE__ */ V(t.epic ?? null), c = /* @__PURE__ */ V(null), l = /* @__PURE__ */ V([]), u = /* @__PURE__ */ V(null), d = $(() => t.client ?? t.comtryaClient), f = $(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? Zs()), p = $(() => t.id ?? t.routeParams?.params?.id ?? ""), m = $(() => t.epic ? $s(t.epic) : `comtrya://epic/${p.value}`), h = $(() => s.value ?? t.epic ?? null), g = $(() => nc(h.value?.state)), _ = $(() => n.filter((e) => e !== h.value?.state)), v = $(() => (c.value?.issuesOpen ?? 0) + (c.value?.issuesClosed ?? 0)), y = $(() => Math.max(0, Math.min(100, c.value?.percentComplete ?? 0))), ee = $(() => l.value.filter((e) => e.state !== "CLOSED").length), te = $(() => l.value.filter((e) => e.state === "CLOSED").length), ne = $(() => _s(h.value?.bodyMarkdown ?? "", { workspaceId: f.value })), b = $(() => d.value && !!p.value), re = $(() => {
			let e = h.value?.ownerRef;
			return e ? e.startsWith("comtrya://user/") ? e.slice(15) : e.startsWith("comtrya://agent/") ? `${e.slice(16)} (agent)` : e : null;
		}), ie = $(() => he(h.value?.createdAt)), x = /* @__PURE__ */ V(null);
		function ae(e) {
			let t = e.detail;
			t && typeof t.count == "number" && (x.value = t.count);
		}
		let S = /* @__PURE__ */ V(null), oe = $(() => S.value?.ownerRefs ?? []);
		_r(() => h.value?.projectName ?? "", async (e) => {
			if (!e) {
				S.value = null;
				return;
			}
			try {
				S.value = await Lc(e);
			} catch {
				S.value = null;
			}
		}, { immediate: !0 });
		let se = Ts, C = /* @__PURE__ */ V([]), ce = /* @__PURE__ */ V("idle"), le = /* @__PURE__ */ V(null);
		Br(async () => {
			try {
				C.value = await Os();
			} catch {
				C.value = [];
			}
		});
		async function ue(e) {
			let t = e.target;
			if (!t || !h.value) return;
			let n = h.value, r = t.value || null;
			if ((n.projectName ?? null) === r) return;
			ce.value = "submitting", le.value = null;
			let i = n.projectName ?? null;
			s.value = {
				...n,
				projectName: r
			};
			try {
				s.value = await Xs(n.id, r);
			} catch (e) {
				s.value = {
					...n,
					projectName: i
				}, t.value = i ?? "", le.value = e instanceof Error ? e.message : String(e);
			} finally {
				ce.value = "idle";
			}
		}
		Br(() => {
			Fc(), w();
		});
		let de = (e) => {
			if (l.value.length === 0) return;
			let t = u.value === null ? 0 : Math.max(0, Math.min(l.value.length - 1, u.value + e));
			u.value = t, Qn(() => me(t));
		};
		ls({
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
				t && (e.preventDefault(), pe(t));
			}
		}), _r(() => [
			d.value,
			t.epic,
			f.value,
			p.value
		], () => void w());
		async function w() {
			if (t.epic) {
				s.value = t.epic, r.value = "ready", a.value = null, await T();
				return;
			}
			if (!b.value || !d.value) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = "epic-detail: missing params";
				return;
			}
			r.value = "loading", a.value = null;
			try {
				s.value = await Ws(d.value, m.value), r.value = s.value ? "ready" : "empty", await T();
			} catch (e) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function T() {
			if (!d.value || !h.value) {
				c.value = null, l.value = [];
				return;
			}
			let e = $s(h.value), [t, n] = await Promise.allSettled([Ks(d.value, e), qs(d.value, e)]);
			c.value = t.status === "fulfilled" ? t.value : null, l.value = await Mc(n.status === "fulfilled" ? n.value : []), l.value.sort((e, t) => {
				let n = e.state !== "CLOSED";
				return n === (t.state !== "CLOSED") ? (t.number ?? 0) - (e.number ?? 0) : n ? -1 : 1;
			});
		}
		async function E(e) {
			if (!(!d.value || !h.value)) {
				i.value = "submitting", o.value = null;
				try {
					s.value = await Js(d.value, h.value.id, e), await T();
				} catch (e) {
					o.value = e instanceof Error ? e.message : String(e);
				} finally {
					i.value = "idle";
				}
			}
		}
		function fe(e) {
			return e.toLowerCase().replace("_", " ");
		}
		function pe(e) {
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
		return (t, n) => (q(), J("main", {
			class: "epic-detail",
			"data-state": r.value,
			"data-epic-id": h.value?.id,
			"data-smoke": "epic-detail"
		}, [r.value === "loading" ? (q(), J("p", zc, "Loading epic")) : r.value === "error" ? (q(), J("p", Bc, F(a.value), 1)) : h.value ? (q(), J(K, { key: 3 }, [
			Y("header", Hc, [
				n[2] ||= Y("p", { class: "epic-overline" }, "epic", -1),
				Y("h1", Uc, F(h.value.title), 1),
				Y("div", Wc, [
					Y("span", { class: $e(["epic-pill", g.value.className]) }, F(g.value.label), 3),
					h.value.projectName ? (q(), J("span", {
						key: 0,
						class: "epic-chip tone-blue",
						title: `Scoped to project ${h.value.projectName}`
					}, [n[0] ||= Y("span", { class: "chip-glyph" }, "◇", -1), X(F(h.value.projectName), 1)], 8, Gc)) : Z("", !0),
					(q(!0), J(K, null, Xr(h.value.labels, (t) => (q(), _a(H(Ps), {
						key: t,
						name: t,
						catalog: e.labelCatalog
					}, null, 8, ["name", "catalog"]))), 128)),
					re.value ? (q(), J("span", Kc, [n[1] ||= Y("span", { class: "chip-glyph" }, "@", -1), X(F(re.value), 1)])) : Z("", !0),
					h.value.targetDate ? (q(), J("span", qc, " target " + F(h.value.targetDate), 1)) : Z("", !0),
					ie.value ? (q(), J("span", Jc, "opened " + F(ie.value), 1)) : Z("", !0)
				])
			]),
			c.value || l.value.length > 0 ? (q(), J("section", Yc, [Y("div", Xc, [
				Y("span", Zc, [
					Y("strong", null, F(c.value?.issuesClosed ?? te.value), 1),
					Y("span", Qc, "/ " + F(v.value || l.value.length), 1),
					n[3] ||= Y("span", { class: "stat-label" }, "closed", -1)
				]),
				n[6] ||= Y("span", { class: "epic-progress-sep" }, "·", -1),
				Y("span", $c, [Y("strong", null, F(y.value), 1), n[4] ||= Y("span", { class: "stat-label" }, "% complete", -1)]),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (q(), J("span", el, "·")) : Z("", !0),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (q(), J("span", tl, [Y("strong", null, F(c.value?.childEpicsOpen ?? 0), 1), n[5] ||= Y("span", { class: "stat-label" }, "child epics open", -1)])) : Z("", !0)
			]), Y("div", {
				class: "epic-progress-bar",
				"aria-valuenow": y.value,
				"aria-valuemin": "0",
				"aria-valuemax": "100"
			}, [Y("div", {
				class: "epic-progress-fill",
				style: Je({ width: y.value + "%" })
			}, null, 4)], 8, nl)])) : Z("", !0),
			Y("section", rl, [
				Y("header", il, [n[7] ||= Y("span", { class: "epic-routed-label" }, "Project", -1), h.value.projectName ? (q(), J("a", {
					key: 0,
					href: `/x/epics/?project=${encodeURIComponent(h.value.projectName)}`,
					class: "epic-routed-project",
					title: `Filter epics to project ${h.value.projectName}`
				}, "◇ " + F(h.value.projectName), 9, al)) : Z("", !0)]),
				Y("select", {
					class: "epic-project-select",
					"data-smoke": "epic-project-select",
					value: h.value.projectName ?? "",
					disabled: ce.value === "submitting",
					onChange: ue
				}, [n[8] ||= Y("option", { value: "" }, "— no project —", -1), (q(!0), J(K, null, Xr(C.value, (e) => (q(), J("option", {
					key: e.name,
					value: e.name ?? ""
				}, F(e.name), 9, sl))), 128))], 40, ol),
				le.value ? (q(), J("p", cl, F(le.value), 1)) : Z("", !0),
				n[9] ||= Y("p", { class: "epic-routed-source" }, [
					X(" Stamps "),
					Y("code", null, "projectName"),
					X(" on this epic. Lights up workspace per-Project counts. ")
				], -1)
			]),
			h.value.projectName && oe.value.length > 0 ? (q(), J("section", ll, [
				Y("header", ul, [n[10] ||= Y("span", { class: "epic-routed-label" }, "Routed to", -1), Y("a", {
					href: `/x/epics/?project=${encodeURIComponent(h.value.projectName)}`,
					class: "epic-routed-project",
					title: `Filter epics to project ${h.value.projectName}`
				}, "◇ " + F(h.value.projectName), 9, dl)]),
				Y("ul", fl, [(q(!0), J(K, null, Xr(oe.value, (e) => (q(), J("li", {
					key: e,
					class: "epic-routed-owner",
					"data-author-kind": H(se)(e).kind,
					title: e
				}, [Y("span", ml, F(H(se)(e).glyph), 1), X(" " + F(H(se)(e).label), 1)], 8, pl))), 128))]),
				Y("p", hl, [
					n[11] ||= X(" From ", -1),
					n[12] ||= Y("code", null, "package comtrya", -1),
					X(" · projects." + F(h.value.projectName) + ".owners ", 1)
				])
			])) : Z("", !0),
			ne.value ? (q(), J("article", {
				key: 2,
				class: "epic-body prose",
				"data-epic-id": h.value.id,
				"data-smoke": "epic-detail-main",
				innerHTML: ne.value
			}, null, 8, gl)) : (q(), J("p", _l, "No description yet.")),
			Y("section", vl, [
				Y("header", yl, [n[16] ||= Y("h3", null, "Issues in this epic", -1), Y("span", bl, [
					Y("span", { "data-zero": ee.value === 0 }, F(ee.value), 9, xl),
					n[13] ||= X(" open ", -1),
					n[14] ||= Y("span", { class: "sep" }, "·", -1),
					Y("span", { "data-zero": te.value === 0 }, F(te.value), 9, Sl),
					n[15] ||= X(" closed ", -1)
				])]),
				l.value.length === 0 ? (q(), J("p", Cl, " No issues linked yet. Link issues via the issue's \"part of epic\" relation. ")) : (q(), J("ul", wl, [(q(!0), J(K, null, Xr(l.value, (e, t) => (q(), J("li", {
					key: e.ref,
					class: $e(["epic-issue-row", [`state-${e.state.toLowerCase()}`, { focused: u.value === t }]]),
					tabindex: "0",
					onClick: (t) => pe(e),
					onKeydown: [Qo(Xo((t) => pe(e), ["prevent"]), ["enter"]), Qo(Xo((t) => pe(e), ["prevent"]), ["space"])],
					onFocus: (e) => u.value = t
				}, [
					Y("span", {
						class: "row-state",
						"data-state": e.state
					}, [e.state === "CLOSED" ? (q(), J("span", Dl, "●")) : (q(), J("span", Ol, "○"))], 8, El),
					Y("span", kl, "#" + F(e.number ?? "—"), 1),
					Y("span", Al, F(e.title), 1),
					Y("span", jl, [
						e.projectName ? (q(), J("span", {
							key: 0,
							class: "epic-chip tone-blue compact",
							title: e.projectName
						}, [n[17] ||= Y("span", { class: "chip-glyph" }, "◇", -1), X(F(e.projectName), 1)], 8, Ml)) : Z("", !0),
						(q(!0), J(K, null, Xr(e.labels, (e) => (q(), _a(H(Ps), {
							key: e,
							name: e
						}, null, 8, ["name"]))), 128)),
						e.authorRef ? (q(), J("span", {
							key: 1,
							class: "row-author",
							"data-author-kind": H(Ts)(e.authorRef).kind,
							title: e.authorRef
						}, [Y("span", Pl, F(H(Ts)(e.authorRef).glyph), 1), X(" " + F(H(Ts)(e.authorRef).label), 1)], 8, Nl)) : Z("", !0)
					])
				], 42, Tl))), 128))])),
				l.value.length > 0 ? (q(), J("p", Fl, [...n[18] ||= [
					Y("kbd", null, "j", -1),
					X(" / ", -1),
					Y("kbd", null, "k", -1),
					X(" move · ", -1),
					Y("kbd", null, "↵", -1),
					X(" open ", -1)
				]])) : Z("", !0)
			]),
			Y("section", Il, [
				n[19] ||= Y("h3", { class: "epic-actions-heading" }, "Change state", -1),
				Y("div", Ll, [(q(!0), J(K, null, Xr(_.value, (e) => (q(), J("button", {
					key: e,
					type: "button",
					disabled: i.value === "submitting",
					onClick: (t) => E(e)
				}, " mark " + F(fe(e)), 9, Rl))), 128))]),
				o.value ? (q(), J("p", zl, F(o.value), 1)) : Z("", !0)
			]),
			Y("section", {
				class: "epic-comments",
				onCommentThreadUpdate: ae
			}, [Y("header", Bl, [Y("h2", null, [n[20] ||= X(" Discussion", -1), x.value === null ? Z("", !0) : (q(), J("span", Vl, " (" + F(x.value) + ")", 1))])]), Sa(Ic, {
				tag: "comtrya-comment-thread",
				attributes: { target: H($s)(h.value) },
				properties: {
					target: H($s)(h.value),
					comtryaClient: d.value
				}
			}, null, 8, ["attributes", "properties"])], 32)
		], 64)) : (q(), J("p", Vc, " No epic " + F(p.value || "?") + " in " + F(f.value), 1))], 8, Rc));
	}
}), Ul = ["data-state"], Wl = { class: "epics-list-header" }, Gl = ["href"], Kl = {
	key: 0,
	class: "epics-controls"
}, ql = {
	class: "epics-filter-row",
	role: "tablist",
	"aria-label": "Filter epics by state"
}, Jl = ["aria-selected", "onClick"], Yl = { class: "count" }, Xl = { class: "epics-search" }, Zl = {
	key: 1,
	class: "epics-query-chips",
	"data-smoke": "epics-query-chips",
	"aria-label": "Parsed search filters"
}, Ql = ["title"], $l = {
	key: 2,
	class: "epics-owner-filter",
	"data-smoke": "epics-owner-filter"
}, eu = ["title"], tu = {
	key: 3,
	class: "epics-project-filter",
	"data-smoke": "epics-project-filter"
}, nu = ["title"], ru = ["data-busy"], iu = ["placeholder", "disabled"], au = {
	key: 0,
	class: "quick-add-status"
}, ou = ["title"], su = {
	key: 4,
	class: "epic-line warn",
	role: "alert"
}, cu = {
	key: 5,
	class: "epics-bulk-bar",
	"data-smoke": "epics-bulk-bar"
}, lu = { class: "count" }, uu = { class: "bulk-reproject" }, du = ["disabled"], fu = ["value"], pu = ["disabled"], mu = {
	key: 6,
	class: "epic-line warn",
	role: "alert"
}, hu = {
	key: 7,
	class: "epic-line muted"
}, gu = {
	key: 8,
	class: "epic-line warn"
}, _u = {
	key: 9,
	class: "epic-line muted"
}, vu = {
	key: 10,
	class: "epic-line muted"
}, yu = {
	key: 11,
	class: "epics-list-items",
	role: "listbox",
	"aria-label": "Epic list"
}, bu = ["aria-selected", "onMouseenter"], xu = {
	key: 12,
	class: "epics-list-foot"
}, Su = /* @__PURE__ */ Tc(/* @__PURE__ */ Tr({
	__name: "EpicsList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epics: { type: [Array, null] },
		workspaceId: {
			default: Zs(),
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
		}, m = $(() => vs(c.value, f)), h = $(() => {
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
				label: `→ ${re(t)}`,
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
		function b() {
			u.value = "";
		}
		function re(e) {
			return e.replace(/^comtrya:\/\/[a-z]+\//, "");
		}
		let ie = $(() => {
			let e = {
				PLANNED: 0,
				IN_PROGRESS: 0,
				DONE: 0,
				CANCELED: 0,
				ALL: d.value.length
			};
			for (let t of d.value) t.state === "PLANNED" ? e.PLANNED += 1 : t.state === "IN_PROGRESS" ? e.IN_PROGRESS += 1 : t.state === "DONE" ? e.DONE += 1 : t.state === "CANCELED" && (e.CANCELED += 1);
			return e;
		}), x = $(() => t.client ?? t.comtryaClient), ae = $(() => {
			let e = tc(t.workspaceId);
			return t.projectName ? `${e}&projectName=${encodeURIComponent(t.projectName)}` : e;
		}), S = /* @__PURE__ */ V(""), oe = /* @__PURE__ */ V(!1), se = /* @__PURE__ */ V(null), C = $(() => t.projectName ?? _.value ?? null), ce = $(() => {
			let e = C.value;
			return e ? `New epic in ${e}…` : "New epic…";
		});
		function le() {
			document.querySelector("[data-smoke=\"epics-quick-add\"]")?.focus();
		}
		function ue(e) {
			e.preventDefault(), S.value = "", se.value = null, e.target?.blur();
		}
		async function de() {
			let e = S.value.trim();
			if (!(!e || oe.value)) {
				oe.value = !0, se.value = null;
				try {
					let n = await Ys(x.value, {
						workspaceId: t.workspaceId,
						title: e,
						bodyMarkdown: "",
						projectName: C.value
					});
					o.value.some((e) => e.id === n.id) || (o.value = [n, ...o.value]), S.value = "", i.value = "ready", xe(), Qn(le);
				} catch (e) {
					se.value = e instanceof Error ? e.message : String(e);
				} finally {
					oe.value = !1;
				}
			}
		}
		let w = /* @__PURE__ */ V(0), T = /* @__PURE__ */ V(/* @__PURE__ */ new Set()), E = /* @__PURE__ */ V(!1), fe = /* @__PURE__ */ V(null), pe = /* @__PURE__ */ V([]);
		Br(async () => {
			try {
				pe.value = await Os();
			} catch {
				pe.value = [];
			}
		}), _r(v, (e) => {
			w.value >= e.length && (w.value = Math.max(0, e.length - 1));
		});
		function me(e) {
			let t = new Set(T.value);
			t.has(e) ? t.delete(e) : t.add(e), T.value = t;
		}
		function he() {
			T.value = /* @__PURE__ */ new Set(), fe.value = null;
		}
		async function ge(e) {
			if (T.value.size === 0 || E.value) return;
			let t = Array.from(T.value);
			E.value = !0, fe.value = null;
			try {
				let n = await Promise.allSettled(t.map((t) => Xs(t, e))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
				if (n.forEach((e, n) => {
					let a = t[n];
					e.status === "fulfilled" ? r.set(a, e.value) : i.add(a);
				}), o.value = o.value.map((e) => r.get(e.id) ?? e), T.value = i, i.size > 0) {
					let n = e ?? "(no project)";
					fe.value = `${i.size} of ${t.length} reassignments to ${n} failed; retry the remaining selection.`;
				}
			} catch (e) {
				fe.value = e instanceof Error ? e.message : String(e);
			} finally {
				E.value = !1;
			}
		}
		function D(e) {
			let t = e.target;
			if (!t) return;
			let n = t.value, r = n === "__NONE__" ? null : n || null;
			t.value = "", n !== "" && ge(r);
		}
		ls({
			c: (e) => {
				e.preventDefault(), le();
			},
			j: (e) => {
				v.value.length !== 0 && (e.preventDefault(), w.value = Math.min(v.value.length - 1, w.value + 1));
			},
			k: (e) => {
				v.value.length !== 0 && (e.preventDefault(), w.value = Math.max(0, w.value - 1));
			},
			" ": (e) => {
				let t = v.value[w.value];
				t && (e.preventDefault(), me(t.id));
			},
			Escape: (e) => {
				T.value.size !== 0 && (e.preventDefault(), he());
			}
		});
		function _e() {
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
		function ve() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			s.value === "ALL" ? e.delete("state") : e.set("state", s.value), l.value ? e.set("owner", l.value) : e.delete("owner"), u.value && !t.projectName ? e.set("project", u.value) : e.delete("project");
			let n = c.value.trim();
			n ? e.set("q", n) : e.delete("q");
			let r = e.toString(), i = `${window.location.pathname}${r ? `?${r}` : ""}${window.location.hash}`;
			i !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", i);
		}
		let ye = !1;
		function be() {
			ye = !0, _e(), Qn(() => {
				ye = !1;
			});
		}
		Br(() => {
			ye = !0, _e(), ye = !1, xe(), window.addEventListener("popstate", be);
		}), Wr(() => {
			window.removeEventListener("popstate", be);
		}), _r(() => [
			x.value,
			t.epics,
			t.workspaceId,
			t.state
		], () => void xe()), _r([
			s,
			l,
			u,
			c
		], () => {
			ye || ve();
		});
		async function xe() {
			if (t.epics) {
				o.value = t.epics, i.value = t.epics.length > 0 ? "ready" : "empty", a.value = null;
				return;
			}
			if (!x.value) {
				o.value = [], i.value = "error", a.value = "epics: no client";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				o.value = await Gs(x.value, {
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
			Y("header", Wl, [Y("h3", null, F(e.title), 1), e.showNewLink ? (q(), J("a", {
				key: 0,
				href: ae.value
			}, "+ new", 8, Gl)) : Z("", !0)]),
			d.value.length > 0 ? (q(), J("div", Kl, [Y("div", ql, [(q(), J(K, null, Xr(n, (e) => Y("button", {
				key: e.id,
				type: "button",
				role: "tab",
				"aria-selected": s.value === e.id,
				class: $e(["epics-filter", { active: s.value === e.id }]),
				onClick: (t) => s.value = e.id
			}, [Y("span", null, F(e.label), 1), Y("span", Yl, F(ie.value[e.id]), 1)], 10, Jl)), 64))]), Y("label", Xl, [dr(Y("input", {
				"data-epics-search": "",
				"onUpdate:modelValue": o[0] ||= (e) => c.value = e,
				type: "search",
				placeholder: "Filter — try is:in-progress · project:<name> · owner:<urn> · text",
				autocomplete: "off"
			}, null, 512), [[qo, c.value]])])])) : Z("", !0),
			y.value.length > 0 ? (q(), J("div", Zl, [(q(!0), J(K, null, Xr(y.value, (e) => (q(), J("span", {
				key: `${e.key}:${e.value || "unknown"}`,
				class: $e(["query-chip", `tone-${e.tone}`]),
				title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
			}, F(e.label), 11, Ql))), 128)), o[2] ||= Y("span", { class: "query-chips-hint" }, [
				X(" syntax: "),
				Y("code", null, "is:in-progress"),
				X(" · "),
				Y("code", null, "project:<name>"),
				X(" · "),
				Y("code", null, "owner:<urn>")
			], -1)])) : Z("", !0),
			l.value ? (q(), J("div", $l, [
				o[3] ||= Y("span", { class: "prefix" }, "owner", -1),
				Y("span", {
					class: "active-chip",
					title: l.value
				}, F(re(l.value)), 9, eu),
				Y("button", {
					type: "button",
					class: "clear",
					onClick: te,
					"aria-label": "Clear owner filter"
				}, "clear ✕")
			])) : Z("", !0),
			u.value && !t.projectName ? (q(), J("div", tu, [
				o[5] ||= Y("span", { class: "prefix" }, "project", -1),
				Y("span", {
					class: "active-chip",
					title: `Scoped to project ${u.value}`
				}, [o[4] ||= Y("span", { class: "project-glyph" }, "◇", -1), X(" " + F(u.value), 1)], 8, nu),
				Y("button", {
					type: "button",
					class: "clear",
					onClick: b,
					"aria-label": "Clear project filter"
				}, "clear ✕")
			])) : Z("", !0),
			Y("form", {
				class: "epics-quick-add",
				"data-busy": oe.value ? "true" : "false",
				onSubmit: Xo(de, ["prevent"])
			}, [
				o[6] ||= Y("span", {
					class: "quick-add-glyph",
					"aria-hidden": "true"
				}, "+", -1),
				dr(Y("input", {
					"onUpdate:modelValue": o[1] ||= (e) => S.value = e,
					"data-smoke": "epics-quick-add",
					type: "text",
					autocomplete: "off",
					placeholder: ce.value,
					disabled: oe.value,
					onKeydown: Qo(ue, ["esc"])
				}, null, 40, iu), [[qo, S.value]]),
				oe.value ? (q(), J("span", au, "creating…")) : C.value ? (q(), J("span", {
					key: 1,
					class: "quick-add-chip tone-blue",
					title: `Stamps projectName = ${C.value} on create`
				}, "◇ " + F(C.value), 9, ou)) : Z("", !0),
				o[7] ||= Y("span", { class: "quick-add-hint" }, [
					Y("kbd", null, "↵"),
					X(" create · "),
					Y("kbd", null, "esc"),
					X(" clear · "),
					Y("kbd", null, "c"),
					X(" focus ")
				], -1)
			], 40, ru),
			se.value ? (q(), J("p", su, F(se.value), 1)) : Z("", !0),
			T.value.size > 0 ? (q(), J("div", cu, [
				Y("span", lu, F(T.value.size) + " selected", 1),
				Y("label", uu, [o[10] ||= Y("span", { class: "bulk-reproject-label" }, "reproject →", -1), Y("select", {
					class: "bulk-reproject-select",
					"data-smoke": "epics-bulk-reproject",
					disabled: E.value,
					onChange: D
				}, [
					o[8] ||= Y("option", {
						value: "",
						disabled: "",
						selected: ""
					}, "pick project…", -1),
					o[9] ||= Y("option", { value: "__NONE__" }, "— no project —", -1),
					(q(!0), J(K, null, Xr(pe.value, (e) => (q(), J("option", {
						key: e.name,
						value: e.name ?? ""
					}, "◇ " + F(e.name), 9, fu))), 128))
				], 40, du)]),
				Y("button", {
					type: "button",
					class: "bulk-clear",
					disabled: E.value,
					onClick: he
				}, [...o[11] ||= [X("clear ", -1), Y("kbd", null, "esc", -1)]], 8, pu),
				o[12] ||= Y("span", { class: "hint" }, [Y("kbd", null, "space"), X(" toggle row ")], -1)
			])) : Z("", !0),
			fe.value ? (q(), J("p", mu, F(fe.value), 1)) : Z("", !0),
			i.value === "loading" ? (q(), J("p", hu, "Loading epics")) : i.value === "error" ? (q(), J("p", gu, F(a.value), 1)) : d.value.length === 0 ? (q(), J("p", _u, "No epics yet.")) : v.value.length === 0 ? (q(), J("p", vu, " No " + F(s.value.toLowerCase().replace("_", " ")) + " epics in scope. ", 1)) : (q(), J("ul", yu, [(q(!0), J(K, null, Xr(v.value, (e, t) => (q(), J("li", {
				key: e.id,
				class: $e({
					focused: t === w.value,
					selected: T.value.has(e.id)
				}),
				"aria-selected": T.value.has(e.id),
				role: "option",
				onMouseenter: (e) => w.value = t
			}, [Sa(Ec, {
				epic: e,
				"resource-ref": H($s)(e),
				client: x.value,
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
			])], 42, bu))), 128))])),
			v.value.length > 0 ? (q(), J("footer", xu, [...o[13] ||= [
				Y("kbd", null, "j", -1),
				X(),
				Y("kbd", null, "k", -1),
				X(" navigate · ", -1),
				Y("kbd", null, "space", -1),
				X(" select · ", -1),
				Y("kbd", null, "c", -1),
				X(" create ", -1)
			]])) : Z("", !0)
		], 8, Ul));
	}
}), [["styles", [".epics-list[data-v-25a0998d]{gap:8px;display:grid}.epics-list-header[data-v-25a0998d]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.epics-list-header h3[data-v-25a0998d]{font-family:var(--font-serif,system-ui);margin:0;font-size:14px}.epics-list-header a[data-v-25a0998d],.epic-line[data-v-25a0998d]{font-family:var(--font-mono,monospace);font-size:12px}.epics-list-header a[data-v-25a0998d]{color:var(--fg-3,#ffffff85);text-decoration:none}.epics-controls[data-v-25a0998d]{flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:4px;display:flex}.epics-search[data-v-25a0998d]{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);flex:280px;align-items:center;gap:6px;padding:0 8px;display:inline-flex}.epics-search input[data-v-25a0998d]{font-family:var(--font-mono,monospace);color:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0;padding:6px 0;font-size:12px}.epics-search input[data-v-25a0998d]::placeholder{color:var(--fg-3,#ffffff85)}.epics-query-chips[data-v-25a0998d]{font-family:var(--font-mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:4px;font-size:11px;display:flex}.epics-query-chips .query-chip[data-v-25a0998d]{letter-spacing:.02em;white-space:nowrap;border:.5px solid;align-items:center;padding:1px 7px;display:inline-flex}.epics-query-chips .query-chip.tone-is[data-v-25a0998d]{color:var(--accent-teal,#087f6f)}.epics-query-chips .query-chip.tone-owner[data-v-25a0998d]{color:var(--fg,#fffffff0)}.epics-query-chips .query-chip.tone-project[data-v-25a0998d]{color:var(--accent-blue,#1d55a6)}.epics-query-chips .query-chip.tone-unknown[data-v-25a0998d]{color:var(--accent-yellow,#c89300);border-style:dashed}.epics-query-chips .query-chips-hint[data-v-25a0998d]{color:var(--fg-3,#ffffff85);letter-spacing:0;margin-left:4px}.epics-query-chips .query-chips-hint code[data-v-25a0998d]{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);color:var(--fg-2,#ffffffbd);padding:0 4px;font-size:11px}.epics-filter-row[data-v-25a0998d]{border:.5px solid var(--fg,#fffffff0);flex-wrap:wrap;align-self:flex-start;gap:0;display:inline-flex}.epics-filter[data-v-25a0998d]{color:inherit;cursor:pointer;font-family:var(--font-mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:4px 9px;font-size:11px;display:inline-flex}.epics-filter[data-v-25a0998d]:not(:last-child){border-right:.5px solid var(--line,#ffffff12)}.epics-filter.active[data-v-25a0998d]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.epics-filter .count[data-v-25a0998d]{color:var(--fg-3,#ffffff85);font-variant-numeric:tabular-nums}.epics-filter.active .count[data-v-25a0998d]{color:var(--bg-2,#0e1014)}.epics-owner-filter[data-v-25a0998d]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-owner-filter .prefix[data-v-25a0998d]{color:var(--fg-3,#ffffff85);letter-spacing:.04em;text-transform:lowercase}.epics-owner-filter .active-chip[data-v-25a0998d]{border:.5px solid var(--fg,#fffffff0);color:var(--fg,#fffffff0);padding:0 5px}.epics-owner-filter .clear[data-v-25a0998d]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-owner-filter .clear[data-v-25a0998d]:hover{color:var(--fg,#fffffff0)}.epics-project-filter[data-v-25a0998d]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-project-filter .prefix[data-v-25a0998d]{color:var(--fg-3,#ffffff85);letter-spacing:.04em;text-transform:lowercase}.epics-project-filter .active-chip[data-v-25a0998d]{color:var(--accent-blue,#1d55a6);border:.5px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.epics-project-filter .project-glyph[data-v-25a0998d]{font-size:10px}.epics-project-filter .clear[data-v-25a0998d]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-project-filter .clear[data-v-25a0998d]:hover{color:var(--fg,#fffffff0)}.epics-quick-add[data-v-25a0998d]{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);align-items:center;gap:8px;padding:6px 10px 6px 6px;transition:border-color .12s;display:flex}.epics-quick-add[data-v-25a0998d]:focus-within{border-color:var(--fg,#fffffff0)}.epics-quick-add[data-busy=true][data-v-25a0998d]{opacity:.85;border-style:dashed}.epics-quick-add .quick-add-glyph[data-v-25a0998d]{width:22px;height:22px;font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);border:.5px solid;border-radius:2px;place-items:center;font-size:13px;display:inline-grid}.epics-quick-add input[data-v-25a0998d]{min-width:0;color:inherit;font-family:var(--font-serif,system-ui);background:0 0;border:0;outline:none;flex:1;padding:4px 0;font-size:15px}.epics-quick-add input[data-v-25a0998d]::placeholder{color:var(--fg-4,#ffffff57);font-style:italic}.epics-quick-add .quick-add-status[data-v-25a0998d]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}.epics-quick-add .quick-add-chip[data-v-25a0998d]{font-family:var(--font-mono,monospace);letter-spacing:.02em;white-space:nowrap;border:.5px solid;align-items:center;padding:1px 6px;font-size:10.5px;display:inline-flex}.epics-quick-add .quick-add-chip.tone-blue[data-v-25a0998d]{color:var(--accent-blue,#1d55a6)}.epics-quick-add .quick-add-hint[data-v-25a0998d]{font-family:var(--font-mono,monospace);color:var(--fg-4,#ffffff57);white-space:nowrap;font-size:10.5px}.epics-quick-add .quick-add-hint kbd[data-v-25a0998d]{font-family:var(--font-mono,monospace);border:.5px solid var(--line,#ffffff12);margin:0 1px;padding:0 4px;font-size:10px}.epics-list-items[data-v-25a0998d]{gap:8px;margin:0;padding:0;list-style:none;display:grid}.epics-list-items>li[data-v-25a0998d]{transition:background 80ms;position:relative}.epics-list-items>li.focused[data-v-25a0998d]{background:var(--bg-2,#0e1014)}.epics-list-items>li.selected[data-v-25a0998d]{box-shadow:inset 3px 0 0 var(--fg,#fffffff0)}.epics-list-items>li.focused.selected[data-v-25a0998d]{box-shadow:inset 3px 0 0 var(--accent-teal,#087f6f)}.epics-list-foot[data-v-25a0998d]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);letter-spacing:.04em;margin-top:8px;font-size:11px}.epics-list-foot kbd[data-v-25a0998d]{font-family:var(--font-mono,monospace);border:.5px solid var(--line,#ffffff12);margin:0 1px;padding:0 4px;font-size:10px}.epics-bulk-bar[data-v-25a0998d]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);font-family:var(--font-mono,monospace);z-index:1;flex-wrap:wrap;align-items:center;gap:12px;padding:8px 12px;font-size:11px;display:flex;position:sticky;top:0}.epics-bulk-bar .count[data-v-25a0998d]{font-weight:600}.epics-bulk-bar .bulk-reproject[data-v-25a0998d]{align-items:center;gap:6px;display:inline-flex}.epics-bulk-bar .bulk-reproject-label[data-v-25a0998d]{color:var(--bg-2,#0e1014);letter-spacing:.04em}.epics-bulk-bar .bulk-reproject-select[data-v-25a0998d]{border:.5px solid var(--bg-2,#0e1014);color:var(--bg,#0a0b0e);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;outline:none;padding:2px 6px;font-size:11px}.epics-bulk-bar .bulk-reproject-select[data-v-25a0998d]:disabled{opacity:.5;cursor:wait}.epics-bulk-bar .bulk-reproject-select option[data-v-25a0998d]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.epics-bulk-bar .bulk-clear[data-v-25a0998d]{color:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 4px;font-size:11px}.epics-bulk-bar .bulk-clear kbd[data-v-25a0998d]{border:.5px solid;margin-left:4px;padding:0 4px;font-size:10px}.epics-bulk-bar .hint[data-v-25a0998d]{color:var(--bg-2,#0e1014);letter-spacing:.04em;font-size:10.5px}.epics-bulk-bar .hint kbd[data-v-25a0998d]{border:.5px solid;padding:0 4px;font-size:10px}.epic-line[data-v-25a0998d]{margin:4px 0}.muted[data-v-25a0998d]{color:var(--fg-3,#ffffff85)}.warn[data-v-25a0998d]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-25a0998d]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}"]], ["__scopeId", "data-v-25a0998d"]]), Cu = "epics", wu = "ext_epics", Tu = "comtrya-epic-card", Eu = "comtrya-epics-board", Du = "comtrya-epics-index", Ou = "comtrya-epic-detail", ku = "comtrya-epic-new";
Fs({
	tagName: Tu,
	component: Ec,
	propertyAliases: { ref: "resourceRef" }
}), Fs({
	tagName: Eu,
	component: Su
}), Fs({
	tagName: Du,
	component: Su
}), Fs({
	tagName: Ou,
	component: Hl
}), ju();
var Au = {
	id: wu,
	setup(e) {
		e.registerCard({
			resourceKind: "epic",
			element: Tu,
			requiredPermission: "epics.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "epic",
			loadTargets: async (t) => (await Gs(e.client, { workspaceId: t.workspaceId ?? Zs() })).map((e) => ({
				ref: $s(e),
				kind: "epic",
				title: e.title,
				subtitle: e.state.toLowerCase().replace(/_/g, " ")
			}))
		}), e.registerWidget({
			id: "epics-board",
			element: Eu,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "epics.read"
		}), e.registerRoute("/", {
			element: Du,
			requiredPermission: "epics.read"
		}), e.registerRoute("/new", {
			element: ku,
			requiredPermission: "epics.write"
		}), e.registerRoute("/:workspaceId/:id", {
			element: Ou,
			requiredPermission: "epics.read"
		}), lc(e.client);
	}
};
function ju() {
	typeof customElements > "u" || customElements.get(ku) || customElements.define(ku, class extends HTMLElement {
		routeParams;
		connectedCallback() {
			let e = Mu(this.routeParams);
			this.replaceChildren(Nu(e));
		}
	});
}
function Mu(e) {
	let t = new URLSearchParams(window.location.search);
	return {
		workspaceId: t.get("workspaceId") ?? e?.params?.workspaceId ?? Zs(),
		projectName: t.get("projectName") ?? e?.params?.projectName ?? null
	};
}
function Nu(e) {
	let t = document.createElement("main");
	t.className = "epic-new", t.dataset.smoke = "epic-new";
	let n = document.createElement("h3");
	n.textContent = e.projectName ? `New epic in ${e.projectName}` : "New epic";
	let r = document.createElement("form"), i = document.createElement("input");
	i.required = !0, i.placeholder = "Epic title";
	let a = document.createElement("select");
	a.className = "epic-new-project-select", a.dataset.smoke = "epic-new-project";
	let o = document.createElement("option");
	o.value = "", o.textContent = "— no project —", a.append(o), Os().then((t) => {
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
	let l = Pu("", "warn");
	return l.setAttribute("role", "alert"), l.hidden = !0, r.append(i, a, s, c, l), r.addEventListener("submit", (t) => {
		t.preventDefault(), c.disabled = !0, l.hidden = !0, Ys(void 0, {
			workspaceId: e.workspaceId,
			projectName: a.value || null,
			title: i.value.trim(),
			bodyMarkdown: s.value
		}).then((e) => {
			window.location.assign(p(Cu, `/${e.workspaceId}/${e.id}`));
		}).catch((e) => {
			l.textContent = e instanceof Error ? e.message : String(e), l.hidden = !1, c.disabled = !1;
		});
	}), t.append(n, r), t;
}
function Pu(e, t) {
	let n = document.createElement("p");
	return n.className = `epic-line ${t}`, n.textContent = e, n;
}
//#endregion
export { Au as default };
