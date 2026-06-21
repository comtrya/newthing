//#region packages/sdk-core/src/session.ts
var e = "__comtryaSessionState", t = "__comtryaOperatorCode";
async function n(e = {}) {
	let t = a();
	if (t.current && t.current.expiresAtMs > Date.now() + 5e3) return t.current.token;
	if (!t.inflight) {
		let n = i(e).finally(() => {
			a().inflight === n && (a().inflight = void 0);
		});
		t.inflight = n;
	}
	return t.inflight;
}
function r() {
	a().current = void 0;
}
async function i(e) {
	let t = e.operatorCode ?? o(), n = e.fetchImpl ?? fetch, r = e.baseUrl ?? "";
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
	let s = await i.json();
	if (!s.accessToken) throw Error("token-exchange response missing accessToken");
	let c = (s.expiresIn ?? 1800) * 1e3, l = {
		token: s.accessToken,
		expiresAtMs: Date.now() + c
	};
	return a().current = l, l.token;
}
function a() {
	let t = s();
	return t[e] ??= {}, t[e];
}
function o() {
	let e = s()[t];
	if (e) return e;
	try {
		let e = {
			BASE_URL: "/",
			DEV: !1,
			MODE: "production",
			PROD: !0,
			SSR: !1
		}?.PUBLIC_COMTRYA_OPERATOR_CODE;
		return e && (s()[t] = e), e;
	} catch {
		return;
	}
}
function s() {
	return globalThis;
}
//#endregion
//#region packages/sdk-core/src/runtime.ts
async function c(e, t, i, a, o = {}) {
	let s = `${o.baseUrl ?? ""}/api/ops/${encodeURIComponent(e)}/${encodeURIComponent(t)}/${encodeURIComponent(i)}`, c = { "content-type": "application/json" }, d = o.token ?? await n();
	d && (c.authorization = `Bearer ${d}`);
	try {
		let e = await fetch(s, {
			method: "POST",
			headers: c,
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
			let r = u(e.status), i = typeof n?.message == "string" ? n.message : void 0;
			return {
				ok: !1,
				error: {
					code: l(n?.code) ?? r,
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
function l(e) {
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
function u(e) {
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
var d = {
	endpoint: "/graphql",
	credentials: "include",
	fetchImpl: typeof fetch < "u" ? fetch.bind(globalThis) : (() => {
		throw Error("no fetch implementation available");
	})
}, f;
function p() {
	return f ||= m(d), f;
}
function m(e) {
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
function h(e, t = "/") {
	if (!e || e.length === 0) throw Error("buildExtensionUrl requires a non-empty routePrefix");
	if (e.includes("/")) throw Error(`routePrefix "${e}" must be a single path segment under /x/`);
	let n = t.startsWith("/") ? t : `/${t}`, r = n.length;
	for (; r > 1 && n.charCodeAt(r - 1) === 47;) --r;
	return `/x/${e}${n === "/" ? "" : n.slice(0, r)}`;
}
//#endregion
//#region packages/sdk-core/src/live-events.ts
function g(e) {
	let t = e.baseUrl ?? "", n = new AbortController();
	return _(t, e, n.signal), () => n.abort();
}
async function _(e, t, n) {
	try {
		let r = await v(e, n, t.token), i = `${e}/events?session=${encodeURIComponent(r)}`, a = await fetch(i, {
			credentials: "include",
			headers: y(t.token, { Accept: "text/event-stream" }),
			signal: n
		});
		if (!a.ok) throw Error(`event stream failed: HTTP ${a.status}`);
		await ee(a, t, n);
	} catch (e) {
		if (n.aborted) return;
		t.onError?.(e instanceof Error ? e : Error(String(e)));
	}
}
async function v(e, t, n) {
	let r = await fetch(`${e}/events/session`, {
		method: "POST",
		credentials: "include",
		headers: y(n, { "Content-Type": "application/json" }),
		body: "{}",
		signal: t
	}), i = await r.json();
	if (!r.ok || !i.session) throw Error(i.errors?.[0]?.message ?? "event stream session failed");
	return i.session;
}
function y(e, t) {
	return e ? {
		...t,
		Authorization: `Bearer ${e}`
	} : t;
}
async function ee(e, t, n) {
	let r = e.body?.getReader();
	if (!r) {
		te(await e.text(), t);
		return;
	}
	let i = new TextDecoder(), a = "";
	for (; !n.aborted;) {
		let e = await r.read();
		if (e.done) break;
		a += i.decode(e.value, { stream: !0 });
		let n = a.split("\n\n");
		a = n.pop() ?? "";
		for (let e of n) ne(e, t);
	}
	a += i.decode(), te(a, t);
}
function te(e, t) {
	for (let n of e.split("\n\n")) ne(n, t);
}
function ne(e, t) {
	let n = e.split("\n"), r = n.find((e) => e.startsWith("event: "))?.slice(7), i = n.filter((e) => e.startsWith("data: ")).map((e) => e.slice(6)).join("\n");
	if (i) try {
		let e = re(JSON.parse(i), r);
		if (t.type && e.eventType !== t.type || t.source && e.emitterExtension !== t.source && e.sourceUri !== t.source) return;
		t.onEvent(e);
	} catch {}
}
function re(e, t) {
	let n = b(e) ? e : {}, r = b(n.data) ? n.data : {}, i = x(r.eventType) ?? x(n.type) ?? t ?? "";
	return {
		id: x(r.id) ?? x(n.id) ?? "",
		eventType: i,
		payloadB64: x(r.payloadB64) ?? "",
		timestampMs: S(r.timestampMs) ?? ie(S(n.time)) ?? Date.now(),
		sourceUri: x(r.sourceUri) ?? x(n.source) ?? "",
		emitterExtension: x(r.emitterExtension) ?? x(r.extensionId) ?? x(n.source) ?? "",
		raw: e
	};
}
function b(e) {
	return typeof e == "object" && !!e;
}
function x(e) {
	return typeof e == "string" ? e : void 0;
}
function S(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function ie(e) {
	return e === void 0 ? void 0 : e * 1e3;
}
//#endregion
//#region node_modules/.bun/tinykeys@3.0.0/node_modules/tinykeys/dist/tinykeys.module.js
var ae = [
	"Shift",
	"Meta",
	"Alt",
	"Control"
], oe = typeof navigator == "object" ? navigator.platform : "", se = /Mac|iPod|iPhone|iPad/.test(oe), C = se ? "Meta" : "Control", ce = oe === "Win32" ? ["Control", "Alt"] : se ? ["Alt"] : [];
function le(e, t) {
	return typeof e.getModifierState == "function" && (e.getModifierState(t) || ce.includes(t) && e.getModifierState("AltGraph"));
}
function ue(e) {
	return e.trim().split(" ").map(function(e) {
		var t = e.split(/\b\+/), n = t.pop(), r = n.match(/^\((.+)\)$/);
		return r && (n = RegExp("^" + r[1] + "$")), [t = t.map(function(e) {
			return e === "$mod" ? C : e;
		}), n];
	});
}
function de(e, t) {
	var n = t[0], r = t[1];
	return !((r instanceof RegExp ? !r.test(e.key) && !r.test(e.code) : r.toUpperCase() !== e.key.toUpperCase() && r !== e.code) || n.find(function(t) {
		return !le(e, t);
	}) || ae.find(function(t) {
		return !n.includes(t) && r !== t && le(e, t);
	}));
}
function fe(e, t) {
	t === void 0 && (t = {});
	var n = t.timeout ?? 1e3, r = Object.keys(e).map(function(t) {
		return [ue(t), e[t]];
	}), i = /* @__PURE__ */ new Map(), a = null;
	return function(e) {
		e instanceof KeyboardEvent && (r.forEach(function(t) {
			var n = t[0], r = t[1], a = i.get(n) || n;
			de(e, a[0]) ? a.length > 1 ? i.set(n, a.slice(1)) : (i.delete(n), r(e)) : le(e, e.key) || i.delete(n);
		}), a && clearTimeout(a), a = setTimeout(i.clear.bind(i), n));
	};
}
function w(e, t, n) {
	var r = n === void 0 ? {} : n, i = r.event, a = i === void 0 ? "keydown" : i, o = r.capture, s = fe(t, { timeout: r.timeout });
	return e.addEventListener(a, s, o), function() {
		e.removeEventListener(a, s, o);
	};
}
//#endregion
//#region packages/sdk-core/src/command-palette.ts
var T = /* @__PURE__ */ new Map(), pe = /* @__PURE__ */ new Set();
function me(e) {
	T.set(e.id, e);
	for (let e of pe) e();
	return () => {
		T.delete(e.id);
		for (let e of pe) e();
	};
}
//#endregion
//#region packages/sdk-core/src/workspace-store.ts
var he = null, ge = [];
function _e() {
	return he;
}
function ve() {
	return he === null ? new Promise((e) => {
		ge.push(e);
	}) : Promise.resolve(he);
}
//#endregion
//#region node_modules/.bun/@vue+shared@3.5.34/node_modules/@vue/shared/dist/shared.esm-bundler.js
/* @__NO_SIDE_EFFECTS__ */
function ye(e) {
	let t = /* @__PURE__ */ Object.create(null);
	for (let n of e.split(",")) t[n] = 1;
	return (e) => e in t;
}
var E = {}, be = [], xe = () => {}, Se = () => !1, Ce = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), we = (e) => e.startsWith("onUpdate:"), D = Object.assign, Te = (e, t) => {
	let n = e.indexOf(t);
	n > -1 && e.splice(n, 1);
}, Ee = Object.prototype.hasOwnProperty, O = (e, t) => Ee.call(e, t), k = Array.isArray, De = (e) => Ne(e) === "[object Map]", Oe = (e) => Ne(e) === "[object Set]", ke = (e) => Ne(e) === "[object Date]", A = (e) => typeof e == "function", j = (e) => typeof e == "string", Ae = (e) => typeof e == "symbol", M = (e) => typeof e == "object" && !!e, je = (e) => (M(e) || A(e)) && A(e.then) && A(e.catch), Me = Object.prototype.toString, Ne = (e) => Me.call(e), Pe = (e) => Ne(e).slice(8, -1), Fe = (e) => Ne(e) === "[object Object]", Ie = (e) => j(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Le = /* @__PURE__ */ ye(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"), Re = (e) => {
	let t = /* @__PURE__ */ Object.create(null);
	return ((n) => t[n] || (t[n] = e(n)));
}, ze = /-\w/g, Be = Re((e) => e.replace(ze, (e) => e.slice(1).toUpperCase())), Ve = /\B([A-Z])/g, He = Re((e) => e.replace(Ve, "-$1").toLowerCase()), Ue = Re((e) => e.charAt(0).toUpperCase() + e.slice(1)), We = Re((e) => e ? `on${Ue(e)}` : ""), Ge = (e, t) => !Object.is(e, t), Ke = (e, ...t) => {
	for (let n = 0; n < e.length; n++) e[n](...t);
}, qe = (e, t, n, r = !1) => {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		writable: r,
		value: n
	});
}, Je = (e) => {
	let t = parseFloat(e);
	return isNaN(t) ? e : t;
}, Ye = (e) => {
	let t = j(e) ? Number(e) : NaN;
	return isNaN(t) ? e : t;
}, Xe, Ze = () => Xe ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
function Qe(e) {
	if (k(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = j(r) ? nt(r) : Qe(r);
			if (i) for (let e in i) t[e] = i[e];
		}
		return t;
	} else if (j(e) || M(e)) return e;
}
var $e = /;(?![^(]*\))/g, et = /:([^]+)/, tt = /\/\*[^]*?\*\//g;
function nt(e) {
	let t = {};
	return e.replace(tt, "").split($e).forEach((e) => {
		if (e) {
			let n = e.split(et);
			n.length > 1 && (t[n[0].trim()] = n[1].trim());
		}
	}), t;
}
function rt(e) {
	let t = "";
	if (j(e)) t = e;
	else if (k(e)) for (let n = 0; n < e.length; n++) {
		let r = rt(e[n]);
		r && (t += r + " ");
	}
	else if (M(e)) for (let n in e) e[n] && (t += n + " ");
	return t.trim();
}
var it = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", at = /* @__PURE__ */ ye(it);
it + "";
function ot(e) {
	return !!e || e === "";
}
function st(e, t) {
	if (e.length !== t.length) return !1;
	let n = !0;
	for (let r = 0; n && r < e.length; r++) n = ct(e[r], t[r]);
	return n;
}
function ct(e, t) {
	if (e === t) return !0;
	let n = ke(e), r = ke(t);
	if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
	if (n = Ae(e), r = Ae(t), n || r) return e === t;
	if (n = k(e), r = k(t), n || r) return n && r ? st(e, t) : !1;
	if (n = M(e), r = M(t), n || r) {
		if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
		for (let n in e) {
			let r = e.hasOwnProperty(n), i = t.hasOwnProperty(n);
			if (r && !i || !r && i || !ct(e[n], t[n])) return !1;
		}
	}
	return String(e) === String(t);
}
function lt(e, t) {
	return e.findIndex((e) => ct(e, t));
}
var ut = (e) => !!(e && e.__v_isRef === !0), N = (e) => j(e) ? e : e == null ? "" : k(e) || M(e) && (e.toString === Me || !A(e.toString)) ? ut(e) ? N(e.value) : JSON.stringify(e, dt, 2) : String(e), dt = (e, t) => ut(t) ? dt(e, t.value) : De(t) ? { [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[ft(t, r) + " =>"] = n, e), {}) } : Oe(t) ? { [`Set(${t.size})`]: [...t.values()].map((e) => ft(e)) } : Ae(t) ? ft(t) : M(t) && !k(t) && !Fe(t) ? String(t) : t, ft = (e, t = "") => Ae(e) ? `Symbol(${e.description ?? t})` : e, P, pt = class {
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
function mt() {
	return P;
}
var F, ht = /* @__PURE__ */ new WeakSet(), gt = class {
	constructor(e) {
		this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, P && (P.active ? P.effects.push(this) : this.flags &= -2);
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		this.flags & 64 && (this.flags &= -65, ht.has(this) && (ht.delete(this), this.trigger()));
	}
	notify() {
		this.flags & 2 && !(this.flags & 32) || this.flags & 8 || bt(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2, Nt(this), Ct(this);
		let e = F, t = kt;
		F = this, kt = !0;
		try {
			return this.fn();
		} finally {
			wt(this), F = e, kt = t, this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let e = this.deps; e; e = e.nextDep) Dt(e);
			this.deps = this.depsTail = void 0, Nt(this), this.onStop && this.onStop(), this.flags &= -2;
		}
	}
	trigger() {
		this.flags & 64 ? ht.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
	}
	runIfDirty() {
		Tt(this) && this.run();
	}
	get dirty() {
		return Tt(this);
	}
}, _t = 0, vt, yt;
function bt(e, t = !1) {
	if (e.flags |= 8, t) {
		e.next = yt, yt = e;
		return;
	}
	e.next = vt, vt = e;
}
function xt() {
	_t++;
}
function St() {
	if (--_t > 0) return;
	if (yt) {
		let e = yt;
		for (yt = void 0; e;) {
			let t = e.next;
			e.next = void 0, e.flags &= -9, e = t;
		}
	}
	let e;
	for (; vt;) {
		let t = vt;
		for (vt = void 0; t;) {
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
function Ct(e) {
	for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function wt(e) {
	let t, n = e.depsTail, r = n;
	for (; r;) {
		let e = r.prevDep;
		r.version === -1 ? (r === n && (n = e), Dt(r), Ot(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e;
	}
	e.deps = t, e.depsTail = n;
}
function Tt(e) {
	for (let t = e.deps; t; t = t.nextDep) if (t.dep.version !== t.version || t.dep.computed && (Et(t.dep.computed) || t.dep.version !== t.version)) return !0;
	return !!e._dirty;
}
function Et(e) {
	if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Pt) || (e.globalVersion = Pt, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Tt(e)))) return;
	e.flags |= 2;
	let t = e.dep, n = F, r = kt;
	F = e, kt = !0;
	try {
		Ct(e);
		let n = e.fn(e._value);
		(t.version === 0 || Ge(n, e._value)) && (e.flags |= 128, e._value = n, t.version++);
	} catch (e) {
		throw t.version++, e;
	} finally {
		F = n, kt = r, wt(e), e.flags &= -3;
	}
}
function Dt(e, t = !1) {
	let { dep: n, prevSub: r, nextSub: i } = e;
	if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
		n.computed.flags &= -5;
		for (let e = n.computed.deps; e; e = e.nextDep) Dt(e, !0);
	}
	!t && !--n.sc && n.map && n.map.delete(n.key);
}
function Ot(e) {
	let { prevDep: t, nextDep: n } = e;
	t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
var kt = !0, At = [];
function jt() {
	At.push(kt), kt = !1;
}
function Mt() {
	let e = At.pop();
	kt = e === void 0 ? !0 : e;
}
function Nt(e) {
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
var Pt = 0, Ft = class {
	constructor(e, t) {
		this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
}, It = class {
	constructor(e) {
		this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
	}
	track(e) {
		if (!F || !kt || F === this.computed) return;
		let t = this.activeLink;
		if (t === void 0 || t.sub !== F) t = this.activeLink = new Ft(F, this), F.deps ? (t.prevDep = F.depsTail, F.depsTail.nextDep = t, F.depsTail = t) : F.deps = F.depsTail = t, Lt(t);
		else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
			let e = t.nextDep;
			e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = F.depsTail, t.nextDep = void 0, F.depsTail.nextDep = t, F.depsTail = t, F.deps === t && (F.deps = e);
		}
		return t;
	}
	trigger(e) {
		this.version++, Pt++, this.notify(e);
	}
	notify(e) {
		xt();
		try {
			for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify();
		} finally {
			St();
		}
	}
};
function Lt(e) {
	if (e.dep.sc++, e.sub.flags & 4) {
		let t = e.dep.computed;
		if (t && !e.dep.subs) {
			t.flags |= 20;
			for (let e = t.deps; e; e = e.nextDep) Lt(e);
		}
		let n = e.dep.subs;
		n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
	}
}
var Rt = /* @__PURE__ */ new WeakMap(), zt = /* @__PURE__ */ Symbol(""), Bt = /* @__PURE__ */ Symbol(""), Vt = /* @__PURE__ */ Symbol("");
function I(e, t, n) {
	if (kt && F) {
		let t = Rt.get(e);
		t || Rt.set(e, t = /* @__PURE__ */ new Map());
		let r = t.get(n);
		r || (t.set(n, r = new It()), r.map = t, r.key = n), r.track();
	}
}
function Ht(e, t, n, r, i, a) {
	let o = Rt.get(e);
	if (!o) {
		Pt++;
		return;
	}
	let s = (e) => {
		e && e.trigger();
	};
	if (xt(), t === "clear") o.forEach(s);
	else {
		let i = k(e), a = i && Ie(n);
		if (i && n === "length") {
			let e = Number(r);
			o.forEach((t, n) => {
				(n === "length" || n === Vt || !Ae(n) && n >= e) && s(t);
			});
		} else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(Vt)), t) {
			case "add":
				i ? a && s(o.get("length")) : (s(o.get(zt)), De(e) && s(o.get(Bt)));
				break;
			case "delete":
				i || (s(o.get(zt)), De(e) && s(o.get(Bt)));
				break;
			case "set":
				De(e) && s(o.get(zt));
				break;
		}
	}
	St();
}
function Ut(e) {
	let t = /* @__PURE__ */ L(e);
	return t === e ? t : (I(t, "iterate", Vt), /* @__PURE__ */ An(e) ? t : t.map(Nn));
}
function Wt(e) {
	return I(e = /* @__PURE__ */ L(e), "iterate", Vt), e;
}
function Gt(e, t) {
	return /* @__PURE__ */ kn(e) ? Pn(/* @__PURE__ */ On(e) ? Nn(t) : t) : Nn(t);
}
var Kt = {
	__proto__: null,
	[Symbol.iterator]() {
		return qt(this, Symbol.iterator, (e) => Gt(this, e));
	},
	concat(...e) {
		return Ut(this).concat(...e.map((e) => k(e) ? Ut(e) : e));
	},
	entries() {
		return qt(this, "entries", (e) => (e[1] = Gt(this, e[1]), e));
	},
	every(e, t) {
		return Yt(this, "every", e, t, void 0, arguments);
	},
	filter(e, t) {
		return Yt(this, "filter", e, t, (e) => e.map((e) => Gt(this, e)), arguments);
	},
	find(e, t) {
		return Yt(this, "find", e, t, (e) => Gt(this, e), arguments);
	},
	findIndex(e, t) {
		return Yt(this, "findIndex", e, t, void 0, arguments);
	},
	findLast(e, t) {
		return Yt(this, "findLast", e, t, (e) => Gt(this, e), arguments);
	},
	findLastIndex(e, t) {
		return Yt(this, "findLastIndex", e, t, void 0, arguments);
	},
	forEach(e, t) {
		return Yt(this, "forEach", e, t, void 0, arguments);
	},
	includes(...e) {
		return Zt(this, "includes", e);
	},
	indexOf(...e) {
		return Zt(this, "indexOf", e);
	},
	join(e) {
		return Ut(this).join(e);
	},
	lastIndexOf(...e) {
		return Zt(this, "lastIndexOf", e);
	},
	map(e, t) {
		return Yt(this, "map", e, t, void 0, arguments);
	},
	pop() {
		return Qt(this, "pop");
	},
	push(...e) {
		return Qt(this, "push", e);
	},
	reduce(e, ...t) {
		return Xt(this, "reduce", e, t);
	},
	reduceRight(e, ...t) {
		return Xt(this, "reduceRight", e, t);
	},
	shift() {
		return Qt(this, "shift");
	},
	some(e, t) {
		return Yt(this, "some", e, t, void 0, arguments);
	},
	splice(...e) {
		return Qt(this, "splice", e);
	},
	toReversed() {
		return Ut(this).toReversed();
	},
	toSorted(e) {
		return Ut(this).toSorted(e);
	},
	toSpliced(...e) {
		return Ut(this).toSpliced(...e);
	},
	unshift(...e) {
		return Qt(this, "unshift", e);
	},
	values() {
		return qt(this, "values", (e) => Gt(this, e));
	}
};
function qt(e, t, n) {
	let r = Wt(e), i = r[t]();
	return r !== e && !/* @__PURE__ */ An(e) && (i._next = i.next, i.next = () => {
		let e = i._next();
		return e.done || (e.value = n(e.value)), e;
	}), i;
}
var Jt = Array.prototype;
function Yt(e, t, n, r, i, a) {
	let o = Wt(e), s = o !== e && !/* @__PURE__ */ An(e), c = o[t];
	if (c !== Jt[t]) {
		let t = c.apply(e, a);
		return s ? Nn(t) : t;
	}
	let l = n;
	o !== e && (s ? l = function(t, r) {
		return n.call(this, Gt(e, t), r, e);
	} : n.length > 2 && (l = function(t, r) {
		return n.call(this, t, r, e);
	}));
	let u = c.call(o, l, r);
	return s && i ? i(u) : u;
}
function Xt(e, t, n, r) {
	let i = Wt(e), a = i !== e && !/* @__PURE__ */ An(e), o = n, s = !1;
	i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
		return s && (s = !1, t = Gt(e, t)), n.call(this, t, Gt(e, r), i, e);
	}) : n.length > 3 && (o = function(t, r, i) {
		return n.call(this, t, r, i, e);
	}));
	let c = i[t](o, ...r);
	return s ? Gt(e, c) : c;
}
function Zt(e, t, n) {
	let r = /* @__PURE__ */ L(e);
	I(r, "iterate", Vt);
	let i = r[t](...n);
	return (i === -1 || i === !1) && /* @__PURE__ */ jn(n[0]) ? (n[0] = /* @__PURE__ */ L(n[0]), r[t](...n)) : i;
}
function Qt(e, t, n = []) {
	jt(), xt();
	let r = (/* @__PURE__ */ L(e))[t].apply(e, n);
	return St(), Mt(), r;
}
var $t = /* @__PURE__ */ ye("__proto__,__v_isRef,__isVue"), en = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Ae));
function tn(e) {
	Ae(e) || (e = String(e));
	let t = /* @__PURE__ */ L(this);
	return I(t, "has", e), t.hasOwnProperty(e);
}
var nn = class {
	constructor(e = !1, t = !1) {
		this._isReadonly = e, this._isShallow = t;
	}
	get(e, t, n) {
		if (t === "__v_skip") return e.__v_skip;
		let r = this._isReadonly, i = this._isShallow;
		if (t === "__v_isReactive") return !r;
		if (t === "__v_isReadonly") return r;
		if (t === "__v_isShallow") return i;
		if (t === "__v_raw") return n === (r ? i ? xn : bn : i ? yn : vn).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
		let a = k(e);
		if (!r) {
			let e;
			if (a && (e = Kt[t])) return e;
			if (t === "hasOwnProperty") return tn;
		}
		let o = Reflect.get(e, t, /* @__PURE__ */ R(e) ? e : n);
		if ((Ae(t) ? en.has(t) : $t(t)) || (r || I(e, "get", t), i)) return o;
		if (/* @__PURE__ */ R(o)) {
			let e = a && Ie(t) ? o : o.value;
			return r && M(e) ? /* @__PURE__ */ En(e) : e;
		}
		return M(o) ? r ? /* @__PURE__ */ En(o) : /* @__PURE__ */ wn(o) : o;
	}
}, rn = class extends nn {
	constructor(e = !1) {
		super(!1, e);
	}
	set(e, t, n, r) {
		let i = e[t], a = k(e) && Ie(t);
		if (!this._isShallow) {
			let e = /* @__PURE__ */ kn(i);
			if (!/* @__PURE__ */ An(n) && !/* @__PURE__ */ kn(n) && (i = /* @__PURE__ */ L(i), n = /* @__PURE__ */ L(n)), !a && /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n)) return e || (i.value = n), !0;
		}
		let o = a ? Number(t) < e.length : O(e, t), s = Reflect.set(e, t, n, /* @__PURE__ */ R(e) ? e : r);
		return e === /* @__PURE__ */ L(r) && (o ? Ge(n, i) && Ht(e, "set", t, n, i) : Ht(e, "add", t, n)), s;
	}
	deleteProperty(e, t) {
		let n = O(e, t), r = e[t], i = Reflect.deleteProperty(e, t);
		return i && n && Ht(e, "delete", t, void 0, r), i;
	}
	has(e, t) {
		let n = Reflect.has(e, t);
		return (!Ae(t) || !en.has(t)) && I(e, "has", t), n;
	}
	ownKeys(e) {
		return I(e, "iterate", k(e) ? "length" : zt), Reflect.ownKeys(e);
	}
}, an = class extends nn {
	constructor(e = !1) {
		super(!0, e);
	}
	set(e, t) {
		return !0;
	}
	deleteProperty(e, t) {
		return !0;
	}
}, on = /* @__PURE__ */ new rn(), sn = /* @__PURE__ */ new an(), cn = /* @__PURE__ */ new rn(!0), ln = (e) => e, un = (e) => Reflect.getPrototypeOf(e);
function dn(e, t, n) {
	return function(...r) {
		let i = this.__v_raw, a = /* @__PURE__ */ L(i), o = De(a), s = e === "entries" || e === Symbol.iterator && o, c = e === "keys" && o, l = i[e](...r), u = n ? ln : t ? Pn : Nn;
		return !t && I(a, "iterate", c ? Bt : zt), D(Object.create(l), { next() {
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
function fn(e) {
	return function(...t) {
		return e === "delete" ? !1 : e === "clear" ? void 0 : this;
	};
}
function pn(e, t) {
	let n = {
		get(n) {
			let r = this.__v_raw, i = /* @__PURE__ */ L(r), a = /* @__PURE__ */ L(n);
			e || (Ge(n, a) && I(i, "get", n), I(i, "get", a));
			let { has: o } = un(i), s = t ? ln : e ? Pn : Nn;
			if (o.call(i, n)) return s(r.get(n));
			if (o.call(i, a)) return s(r.get(a));
			r !== i && r.get(n);
		},
		get size() {
			let t = this.__v_raw;
			return !e && I(/* @__PURE__ */ L(t), "iterate", zt), t.size;
		},
		has(t) {
			let n = this.__v_raw, r = /* @__PURE__ */ L(n), i = /* @__PURE__ */ L(t);
			return e || (Ge(t, i) && I(r, "has", t), I(r, "has", i)), t === i ? n.has(t) : n.has(t) || n.has(i);
		},
		forEach(n, r) {
			let i = this, a = i.__v_raw, o = /* @__PURE__ */ L(a), s = t ? ln : e ? Pn : Nn;
			return !e && I(o, "iterate", zt), a.forEach((e, t) => n.call(r, s(e), s(t), i));
		}
	};
	return D(n, e ? {
		add: fn("add"),
		set: fn("set"),
		delete: fn("delete"),
		clear: fn("clear")
	} : {
		add(e) {
			let n = /* @__PURE__ */ L(this), r = un(n), i = /* @__PURE__ */ L(e), a = !t && !/* @__PURE__ */ An(e) && !/* @__PURE__ */ kn(e) ? i : e;
			return r.has.call(n, a) || Ge(e, a) && r.has.call(n, e) || Ge(i, a) && r.has.call(n, i) || (n.add(a), Ht(n, "add", a, a)), this;
		},
		set(e, n) {
			!t && !/* @__PURE__ */ An(n) && !/* @__PURE__ */ kn(n) && (n = /* @__PURE__ */ L(n));
			let r = /* @__PURE__ */ L(this), { has: i, get: a } = un(r), o = i.call(r, e);
			o ||= (e = /* @__PURE__ */ L(e), i.call(r, e));
			let s = a.call(r, e);
			return r.set(e, n), o ? Ge(n, s) && Ht(r, "set", e, n, s) : Ht(r, "add", e, n), this;
		},
		delete(e) {
			let t = /* @__PURE__ */ L(this), { has: n, get: r } = un(t), i = n.call(t, e);
			i ||= (e = /* @__PURE__ */ L(e), n.call(t, e));
			let a = r ? r.call(t, e) : void 0, o = t.delete(e);
			return i && Ht(t, "delete", e, void 0, a), o;
		},
		clear() {
			let e = /* @__PURE__ */ L(this), t = e.size !== 0, n = e.clear();
			return t && Ht(e, "clear", void 0, void 0, void 0), n;
		}
	}), [
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((r) => {
		n[r] = dn(r, e, t);
	}), n;
}
function mn(e, t) {
	let n = pn(e, t);
	return (t, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? t : Reflect.get(O(n, r) && r in t ? n : t, r, i);
}
var hn = { get: /* @__PURE__ */ mn(!1, !1) }, gn = { get: /* @__PURE__ */ mn(!1, !0) }, _n = { get: /* @__PURE__ */ mn(!0, !1) }, vn = /* @__PURE__ */ new WeakMap(), yn = /* @__PURE__ */ new WeakMap(), bn = /* @__PURE__ */ new WeakMap(), xn = /* @__PURE__ */ new WeakMap();
function Sn(e) {
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
function Cn(e) {
	return e.__v_skip || !Object.isExtensible(e) ? 0 : Sn(Pe(e));
}
/* @__NO_SIDE_EFFECTS__ */
function wn(e) {
	return /* @__PURE__ */ kn(e) ? e : Dn(e, !1, on, hn, vn);
}
/* @__NO_SIDE_EFFECTS__ */
function Tn(e) {
	return Dn(e, !1, cn, gn, yn);
}
/* @__NO_SIDE_EFFECTS__ */
function En(e) {
	return Dn(e, !0, sn, _n, bn);
}
function Dn(e, t, n, r, i) {
	if (!M(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
	let a = Cn(e);
	if (a === 0) return e;
	let o = i.get(e);
	if (o) return o;
	let s = new Proxy(e, a === 2 ? r : n);
	return i.set(e, s), s;
}
/* @__NO_SIDE_EFFECTS__ */
function On(e) {
	return /* @__PURE__ */ kn(e) ? /* @__PURE__ */ On(e.__v_raw) : !!(e && e.__v_isReactive);
}
/* @__NO_SIDE_EFFECTS__ */
function kn(e) {
	return !!(e && e.__v_isReadonly);
}
/* @__NO_SIDE_EFFECTS__ */
function An(e) {
	return !!(e && e.__v_isShallow);
}
/* @__NO_SIDE_EFFECTS__ */
function jn(e) {
	return e ? !!e.__v_raw : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function L(e) {
	let t = e && e.__v_raw;
	return t ? /* @__PURE__ */ L(t) : e;
}
function Mn(e) {
	return !O(e, "__v_skip") && Object.isExtensible(e) && qe(e, "__v_skip", !0), e;
}
var Nn = (e) => M(e) ? /* @__PURE__ */ wn(e) : e, Pn = (e) => M(e) ? /* @__PURE__ */ En(e) : e;
/* @__NO_SIDE_EFFECTS__ */
function R(e) {
	return e ? e.__v_isRef === !0 : !1;
}
/* @__NO_SIDE_EFFECTS__ */
function z(e) {
	return Fn(e, !1);
}
function Fn(e, t) {
	return /* @__PURE__ */ R(e) ? e : new In(e, t);
}
var In = class {
	constructor(e, t) {
		this.dep = new It(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : /* @__PURE__ */ L(e), this._value = t ? e : Nn(e), this.__v_isShallow = t;
	}
	get value() {
		return this.dep.track(), this._value;
	}
	set value(e) {
		let t = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ An(e) || /* @__PURE__ */ kn(e);
		e = n ? e : /* @__PURE__ */ L(e), Ge(e, t) && (this._rawValue = e, this._value = n ? e : Nn(e), this.dep.trigger());
	}
};
function B(e) {
	return /* @__PURE__ */ R(e) ? e.value : e;
}
var Ln = {
	get: (e, t, n) => t === "__v_raw" ? e : B(Reflect.get(e, t, n)),
	set: (e, t, n, r) => {
		let i = e[t];
		return /* @__PURE__ */ R(i) && !/* @__PURE__ */ R(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r);
	}
};
function Rn(e) {
	return /* @__PURE__ */ On(e) ? e : new Proxy(e, Ln);
}
var zn = class {
	constructor(e, t, n) {
		this.fn = e, this.setter = t, this._value = void 0, this.dep = new It(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Pt - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n;
	}
	notify() {
		if (this.flags |= 16, !(this.flags & 8) && F !== this) return bt(this, !0), !0;
	}
	get value() {
		let e = this.dep.track();
		return Et(this), e && (e.version = this.dep.version), this._value;
	}
	set value(e) {
		this.setter && this.setter(e);
	}
};
/* @__NO_SIDE_EFFECTS__ */
function Bn(e, t, n = !1) {
	let r, i;
	return A(e) ? r = e : (r = e.get, i = e.set), new zn(r, i, n);
}
var Vn = {}, Hn = /* @__PURE__ */ new WeakMap(), Un = void 0;
function Wn(e, t = !1, n = Un) {
	if (n) {
		let t = Hn.get(n);
		t || Hn.set(n, t = []), t.push(e);
	}
}
function Gn(e, t, n = E) {
	let { immediate: r, deep: i, once: a, scheduler: o, augmentJob: s, call: c } = n, l = (e) => i ? e : /* @__PURE__ */ An(e) || i === !1 || i === 0 ? Kn(e, 1) : Kn(e), u, d, f, p, m = !1, h = !1;
	if (/* @__PURE__ */ R(e) ? (d = () => e.value, m = /* @__PURE__ */ An(e)) : /* @__PURE__ */ On(e) ? (d = () => l(e), m = !0) : k(e) ? (h = !0, m = e.some((e) => /* @__PURE__ */ On(e) || /* @__PURE__ */ An(e)), d = () => e.map((e) => {
		if (/* @__PURE__ */ R(e)) return e.value;
		if (/* @__PURE__ */ On(e)) return l(e);
		if (A(e)) return c ? c(e, 2) : e();
	})) : d = A(e) ? t ? c ? () => c(e, 2) : e : () => {
		if (f) {
			jt();
			try {
				f();
			} finally {
				Mt();
			}
		}
		let t = Un;
		Un = u;
		try {
			return c ? c(e, 3, [p]) : e(p);
		} finally {
			Un = t;
		}
	} : xe, t && i) {
		let e = d, t = i === !0 ? Infinity : i;
		d = () => Kn(e(), t);
	}
	let g = mt(), _ = () => {
		u.stop(), g && g.active && Te(g.effects, u);
	};
	if (a && t) {
		let e = t;
		t = (...t) => {
			e(...t), _();
		};
	}
	let v = h ? Array(e.length).fill(Vn) : Vn, y = (e) => {
		if (!(!(u.flags & 1) || !u.dirty && !e)) if (t) {
			let e = u.run();
			if (i || m || (h ? e.some((e, t) => Ge(e, v[t])) : Ge(e, v))) {
				f && f();
				let n = Un;
				Un = u;
				try {
					let n = [
						e,
						v === Vn ? void 0 : h && v[0] === Vn ? [] : v,
						p
					];
					v = e, c ? c(t, 3, n) : t(...n);
				} finally {
					Un = n;
				}
			}
		} else u.run();
	};
	return s && s(y), u = new gt(d), u.scheduler = o ? () => o(y, !1) : y, p = (e) => Wn(e, !1, u), f = u.onStop = () => {
		let e = Hn.get(u);
		if (e) {
			if (c) c(e, 4);
			else for (let t of e) t();
			Hn.delete(u);
		}
	}, t ? r ? y(!0) : v = u.run() : o ? o(y.bind(null, !0), !0) : u.run(), _.pause = u.pause.bind(u), _.resume = u.resume.bind(u), _.stop = _, _;
}
function Kn(e, t = Infinity, n) {
	if (t <= 0 || !M(e) || e.__v_skip || (n ||= /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t)) return e;
	if (n.set(e, t), t--, /* @__PURE__ */ R(e)) Kn(e.value, t, n);
	else if (k(e)) for (let r = 0; r < e.length; r++) Kn(e[r], t, n);
	else if (Oe(e) || De(e)) e.forEach((e) => {
		Kn(e, t, n);
	});
	else if (Fe(e)) {
		for (let r in e) Kn(e[r], t, n);
		for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && Kn(e[r], t, n);
	}
	return e;
}
//#endregion
//#region node_modules/.bun/@vue+runtime-core@3.5.34/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function qn(e, t, n, r) {
	try {
		return r ? e(...r) : e();
	} catch (e) {
		Yn(e, t, n);
	}
}
function Jn(e, t, n, r) {
	if (A(e)) {
		let i = qn(e, t, n, r);
		return i && je(i) && i.catch((e) => {
			Yn(e, t, n);
		}), i;
	}
	if (k(e)) {
		let i = [];
		for (let a = 0; a < e.length; a++) i.push(Jn(e[a], t, n, r));
		return i;
	}
}
function Yn(e, t, n, r = !0) {
	let i = t ? t.vnode : null, { errorHandler: a, throwUnhandledErrorInProduction: o } = t && t.appContext.config || E;
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
			jt(), qn(a, null, 10, [
				e,
				i,
				o
			]), Mt();
			return;
		}
	}
	Xn(e, n, i, r, o);
}
function Xn(e, t, n, r = !0, i = !1) {
	if (i) throw e;
	console.error(e);
}
var V = [], Zn = -1, Qn = [], $n = null, er = 0, tr = /* @__PURE__ */ Promise.resolve(), nr = null;
function rr(e) {
	let t = nr || tr;
	return e ? t.then(this ? e.bind(this) : e) : t;
}
function ir(e) {
	let t = Zn + 1, n = V.length;
	for (; t < n;) {
		let r = t + n >>> 1, i = V[r], a = ur(i);
		a < e || a === e && i.flags & 2 ? t = r + 1 : n = r;
	}
	return t;
}
function ar(e) {
	if (!(e.flags & 1)) {
		let t = ur(e), n = V[V.length - 1];
		!n || !(e.flags & 2) && t >= ur(n) ? V.push(e) : V.splice(ir(t), 0, e), e.flags |= 1, or();
	}
}
function or() {
	nr ||= tr.then(dr);
}
function sr(e) {
	k(e) ? Qn.push(...e) : $n && e.id === -1 ? $n.splice(er + 1, 0, e) : e.flags & 1 || (Qn.push(e), e.flags |= 1), or();
}
function cr(e, t, n = Zn + 1) {
	for (; n < V.length; n++) {
		let t = V[n];
		if (t && t.flags & 2) {
			if (e && t.id !== e.uid) continue;
			V.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2);
		}
	}
}
function lr(e) {
	if (Qn.length) {
		let e = [...new Set(Qn)].sort((e, t) => ur(e) - ur(t));
		if (Qn.length = 0, $n) {
			$n.push(...e);
			return;
		}
		for ($n = e, er = 0; er < $n.length; er++) {
			let e = $n[er];
			e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2;
		}
		$n = null, er = 0;
	}
}
var ur = (e) => e.id == null ? e.flags & 2 ? -1 : Infinity : e.id;
function dr(e) {
	try {
		for (Zn = 0; Zn < V.length; Zn++) {
			let e = V[Zn];
			e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), qn(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2));
		}
	} finally {
		for (; Zn < V.length; Zn++) {
			let e = V[Zn];
			e && (e.flags &= -2);
		}
		Zn = -1, V.length = 0, lr(e), nr = null, (V.length || Qn.length) && dr(e);
	}
}
var fr = null, pr = null;
function mr(e) {
	let t = fr;
	return fr = e, pr = e && e.type.__scopeId || null, t;
}
function hr(e, t = fr, n) {
	if (!t || e._n) return e;
	let r = (...n) => {
		r._d && xa(-1);
		let i = mr(t), a;
		try {
			a = e(...n);
		} finally {
			mr(i), r._d && xa(1);
		}
		return a;
	};
	return r._n = !0, r._c = !0, r._d = !0, r;
}
function gr(e, t) {
	if (fr === null) return e;
	let n = to(fr), r = e.dirs ||= [];
	for (let e = 0; e < t.length; e++) {
		let [i, a, o, s = E] = t[e];
		i && (A(i) && (i = {
			mounted: i,
			updated: i
		}), i.deep && Kn(a), r.push({
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
function _r(e, t, n, r) {
	let i = e.dirs, a = t && t.dirs;
	for (let o = 0; o < i.length; o++) {
		let s = i[o];
		a && (s.oldValue = a[o].value);
		let c = s.dir[r];
		c && (jt(), Jn(c, n, 8, [
			e.el,
			s,
			e,
			t
		]), Mt());
	}
}
function vr(e, t) {
	if (Y) {
		let n = Y.provides, r = Y.parent && Y.parent.provides;
		r === n && (n = Y.provides = Object.create(r)), n[e] = t;
	}
}
function yr(e, t, n = !1) {
	let r = Ba();
	if (r || wi) {
		let i = wi ? wi._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
		if (i && e in i) return i[e];
		if (arguments.length > 1) return n && A(t) ? t.call(r && r.proxy) : t;
	}
}
var br = /* @__PURE__ */ Symbol.for("v-scx"), xr = () => yr(br);
function Sr(e, t, n) {
	return Cr(e, t, n);
}
function Cr(e, t, n = E) {
	let { immediate: r, deep: i, flush: a, once: o } = n, s = D({}, n), c = t && r || !t && a !== "post", l;
	if (Ka) {
		if (a === "sync") {
			let e = xr();
			l = e.__watcherHandles ||= [];
		} else if (!c) {
			let e = () => {};
			return e.stop = xe, e.resume = xe, e.pause = xe, e;
		}
	}
	let u = Y;
	s.call = (e, t, n) => Jn(e, u, t, n);
	let d = !1;
	a === "post" ? s.scheduler = (e) => {
		ta(e, u && u.suspense);
	} : a !== "sync" && (d = !0, s.scheduler = (e, t) => {
		t ? e() : ar(e);
	}), s.augmentJob = (e) => {
		t && (e.flags |= 4), d && (e.flags |= 2, u && (e.id = u.uid, e.i = u));
	};
	let f = Gn(e, t, s);
	return Ka && (l ? l.push(f) : c && f()), f;
}
function wr(e, t, n) {
	let r = this.proxy, i = j(e) ? e.includes(".") ? Tr(r, e) : () => r[e] : e.bind(r, r), a;
	A(t) ? a = t : (a = t.handler, n = t);
	let o = Ua(this), s = Cr(i, a.bind(r), n);
	return o(), s;
}
function Tr(e, t) {
	let n = t.split(".");
	return () => {
		let t = e;
		for (let e = 0; e < n.length && t; e++) t = t[n[e]];
		return t;
	};
}
var Er = /* @__PURE__ */ Symbol("_vte"), Dr = (e) => e.__isTeleport, Or = /* @__PURE__ */ Symbol("_leaveCb");
function kr(e, t) {
	e.shapeFlag & 6 && e.component ? (e.transition = t, kr(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/* @__NO_SIDE_EFFECTS__ */
function Ar(e, t) {
	return A(e) ? D({ name: e.name }, t, { setup: e }) : e;
}
function jr(e) {
	e.ids = [
		e.ids[0] + e.ids[2]++ + "-",
		0,
		0
	];
}
function Mr(e, t) {
	let n;
	return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
var Nr = /* @__PURE__ */ new WeakMap();
function Pr(e, t, n, r, i = !1) {
	if (k(e)) {
		e.forEach((e, a) => Pr(e, t && (k(t) ? t[a] : t), n, r, i));
		return;
	}
	if (Ir(r) && !i) {
		r.shapeFlag & 512 && r.type.__asyncResolved && r.component.subTree.component && Pr(e, t, n, r.component.subTree);
		return;
	}
	let a = r.shapeFlag & 4 ? to(r.component) : r.el, o = i ? null : a, { i: s, r: c } = e, l = t && t.r, u = s.refs === E ? s.refs = {} : s.refs, d = s.setupState, f = /* @__PURE__ */ L(d), p = d === E ? Se : (e) => Mr(u, e) ? !1 : O(f, e), m = (e, t) => !(t && Mr(u, t));
	if (l != null && l !== c) {
		if (Fr(t), j(l)) u[l] = null, p(l) && (d[l] = null);
		else if (/* @__PURE__ */ R(l)) {
			let e = t;
			m(l, e.k) && (l.value = null), e.k && (u[e.k] = null);
		}
	}
	if (A(c)) qn(c, s, 12, [o, u]);
	else {
		let t = j(c), r = /* @__PURE__ */ R(c);
		if (t || r) {
			let s = () => {
				if (e.f) {
					let n = t ? p(c) ? d[c] : u[c] : m(c) || !e.k ? c.value : u[e.k];
					if (i) k(n) && Te(n, a);
					else if (k(n)) n.includes(a) || n.push(a);
					else if (t) u[c] = [a], p(c) && (d[c] = u[c]);
					else {
						let t = [a];
						m(c, e.k) && (c.value = t), e.k && (u[e.k] = t);
					}
				} else t ? (u[c] = o, p(c) && (d[c] = o)) : r && (m(c, e.k) && (c.value = o), e.k && (u[e.k] = o));
			};
			if (o) {
				let t = () => {
					s(), Nr.delete(e);
				};
				t.id = -1, Nr.set(e, t), ta(t, n);
			} else Fr(e), s();
		}
	}
}
function Fr(e) {
	let t = Nr.get(e);
	t && (t.flags |= 8, Nr.delete(e));
}
Ze().requestIdleCallback, Ze().cancelIdleCallback;
var Ir = (e) => !!e.type.__asyncLoader, Lr = (e) => e.type.__isKeepAlive;
function Rr(e, t) {
	Br(e, "a", t);
}
function zr(e, t) {
	Br(e, "da", t);
}
function Br(e, t, n = Y) {
	let r = e.__wdc ||= () => {
		let t = n;
		for (; t;) {
			if (t.isDeactivated) return;
			t = t.parent;
		}
		return e();
	};
	if (Hr(t, r, n), n) {
		let e = n.parent;
		for (; e && e.parent;) Lr(e.parent.vnode) && Vr(r, t, n, e), e = e.parent;
	}
}
function Vr(e, t, n, r) {
	let i = Hr(t, e, r, !0);
	Yr(() => {
		Te(r[t], i);
	}, n);
}
function Hr(e, t, n = Y, r = !1) {
	if (n) {
		let i = n[e] || (n[e] = []), a = t.__weh ||= (...r) => {
			jt();
			let i = Ua(n), a = Jn(t, n, e, r);
			return i(), Mt(), a;
		};
		return r ? i.unshift(a) : i.push(a), a;
	}
}
var Ur = (e) => (t, n = Y) => {
	(!Ka || e === "sp") && Hr(e, (...e) => t(...e), n);
}, Wr = Ur("bm"), Gr = Ur("m"), Kr = Ur("bu"), qr = Ur("u"), Jr = Ur("bum"), Yr = Ur("um"), Xr = Ur("sp"), Zr = Ur("rtg"), Qr = Ur("rtc");
function $r(e, t = Y) {
	Hr("ec", e, t);
}
var ei = /* @__PURE__ */ Symbol.for("v-ndc");
function ti(e, t, n, r) {
	let i, a = n && n[r], o = k(e);
	if (o || j(e)) {
		let n = o && /* @__PURE__ */ On(e), r = !1, s = !1;
		n && (r = !/* @__PURE__ */ An(e), s = /* @__PURE__ */ kn(e), e = Wt(e)), i = Array(e.length);
		for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Pn(Nn(e[n])) : Nn(e[n]) : e[n], n, void 0, a && a[n]);
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
var ni = (e) => e ? Ga(e) ? to(e) : ni(e.parent) : null, ri = /* @__PURE__ */ D(/* @__PURE__ */ Object.create(null), {
	$: (e) => e,
	$el: (e) => e.vnode.el,
	$data: (e) => e.data,
	$props: (e) => e.props,
	$attrs: (e) => e.attrs,
	$slots: (e) => e.slots,
	$refs: (e) => e.refs,
	$parent: (e) => ni(e.parent),
	$root: (e) => ni(e.root),
	$host: (e) => e.ce,
	$emit: (e) => e.emit,
	$options: (e) => fi(e),
	$forceUpdate: (e) => e.f ||= () => {
		ar(e.update);
	},
	$nextTick: (e) => e.n ||= rr.bind(e.proxy),
	$watch: (e) => wr.bind(e)
}), ii = (e, t) => e !== E && !e.__isScriptSetup && O(e, t), ai = {
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
			else if (ii(r, t)) return o[t] = 1, r[t];
			else if (i !== E && O(i, t)) return o[t] = 2, i[t];
			else if (O(a, t)) return o[t] = 3, a[t];
			else if (n !== E && O(n, t)) return o[t] = 4, n[t];
			else si && (o[t] = 0);
		}
		let l = ri[t], u, d;
		if (l) return t === "$attrs" && I(e.attrs, "get", ""), l(e);
		if ((u = s.__cssModules) && (u = u[t])) return u;
		if (n !== E && O(n, t)) return o[t] = 4, n[t];
		if (d = c.config.globalProperties, O(d, t)) return d[t];
	},
	set({ _: e }, t, n) {
		let { data: r, setupState: i, ctx: a } = e;
		return ii(i, t) ? (i[t] = n, !0) : r !== E && O(r, t) ? (r[t] = n, !0) : O(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (a[t] = n, !0);
	},
	has({ _: { data: e, setupState: t, accessCache: n, ctx: r, appContext: i, props: a, type: o } }, s) {
		let c;
		return !!(n[s] || e !== E && s[0] !== "$" && O(e, s) || ii(t, s) || O(a, s) || O(r, s) || O(ri, s) || O(i.config.globalProperties, s) || (c = o.__cssModules) && c[s]);
	},
	defineProperty(e, t, n) {
		return n.get == null ? O(n, "value") && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n);
	}
};
function oi(e) {
	return k(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e;
}
var si = !0;
function ci(e) {
	let t = fi(e), n = e.proxy, r = e.ctx;
	si = !1, t.beforeCreate && ui(t.beforeCreate, e, "bc");
	let { data: i, computed: a, methods: o, watch: s, provide: c, inject: l, created: u, beforeMount: d, mounted: f, beforeUpdate: p, updated: m, activated: h, deactivated: g, beforeDestroy: _, beforeUnmount: v, destroyed: y, unmounted: ee, render: te, renderTracked: ne, renderTriggered: re, errorCaptured: b, serverPrefetch: x, expose: S, inheritAttrs: ie, components: ae, directives: oe, filters: se } = t;
	if (l && li(l, r, null), o) for (let e in o) {
		let t = o[e];
		A(t) && (r[e] = t.bind(n));
	}
	if (i) {
		let t = i.call(n, n);
		M(t) && (e.data = /* @__PURE__ */ wn(t));
	}
	if (si = !0, a) for (let e in a) {
		let t = a[e], i = X({
			get: A(t) ? t.bind(n, n) : A(t.get) ? t.get.bind(n, n) : xe,
			set: !A(t) && A(t.set) ? t.set.bind(n) : xe
		});
		Object.defineProperty(r, e, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		});
	}
	if (s) for (let e in s) di(s[e], r, n, e);
	if (c) {
		let e = A(c) ? c.call(n) : c;
		Reflect.ownKeys(e).forEach((t) => {
			vr(t, e[t]);
		});
	}
	u && ui(u, e, "c");
	function C(e, t) {
		k(t) ? t.forEach((t) => e(t.bind(n))) : t && e(t.bind(n));
	}
	if (C(Wr, d), C(Gr, f), C(Kr, p), C(qr, m), C(Rr, h), C(zr, g), C($r, b), C(Qr, ne), C(Zr, re), C(Jr, v), C(Yr, ee), C(Xr, x), k(S)) if (S.length) {
		let t = e.exposed ||= {};
		S.forEach((e) => {
			Object.defineProperty(t, e, {
				get: () => n[e],
				set: (t) => n[e] = t,
				enumerable: !0
			});
		});
	} else e.exposed ||= {};
	te && e.render === xe && (e.render = te), ie != null && (e.inheritAttrs = ie), ae && (e.components = ae), oe && (e.directives = oe), x && jr(e);
}
function li(e, t, n = xe) {
	k(e) && (e = _i(e));
	for (let n in e) {
		let r = e[n], i;
		i = M(r) ? "default" in r ? yr(r.from || n, r.default, !0) : yr(r.from || n) : yr(r), /* @__PURE__ */ R(i) ? Object.defineProperty(t, n, {
			enumerable: !0,
			configurable: !0,
			get: () => i.value,
			set: (e) => i.value = e
		}) : t[n] = i;
	}
}
function ui(e, t, n) {
	Jn(k(e) ? e.map((e) => e.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function di(e, t, n, r) {
	let i = r.includes(".") ? Tr(n, r) : () => n[r];
	if (j(e)) {
		let n = t[e];
		A(n) && Sr(i, n);
	} else if (A(e)) Sr(i, e.bind(n));
	else if (M(e)) if (k(e)) e.forEach((e) => di(e, t, n, r));
	else {
		let r = A(e.handler) ? e.handler.bind(n) : t[e.handler];
		A(r) && Sr(i, r, e);
	}
}
function fi(e) {
	let t = e.type, { mixins: n, extends: r } = t, { mixins: i, optionsCache: a, config: { optionMergeStrategies: o } } = e.appContext, s = a.get(t), c;
	return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach((e) => pi(c, e, o, !0)), pi(c, t, o)), M(t) && a.set(t, c), c;
}
function pi(e, t, n, r = !1) {
	let { mixins: i, extends: a } = t;
	a && pi(e, a, n, !0), i && i.forEach((t) => pi(e, t, n, !0));
	for (let i in t) if (!(r && i === "expose")) {
		let r = mi[i] || n && n[i];
		e[i] = r ? r(e[i], t[i]) : t[i];
	}
	return e;
}
var mi = {
	data: hi,
	props: yi,
	emits: yi,
	methods: vi,
	computed: vi,
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
	components: vi,
	directives: vi,
	watch: bi,
	provide: hi,
	inject: gi
};
function hi(e, t) {
	return t ? e ? function() {
		return D(A(e) ? e.call(this, this) : e, A(t) ? t.call(this, this) : t);
	} : t : e;
}
function gi(e, t) {
	return vi(_i(e), _i(t));
}
function _i(e) {
	if (k(e)) {
		let t = {};
		for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
		return t;
	}
	return e;
}
function H(e, t) {
	return e ? [...new Set([].concat(e, t))] : t;
}
function vi(e, t) {
	return e ? D(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function yi(e, t) {
	return e ? k(e) && k(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : D(/* @__PURE__ */ Object.create(null), oi(e), oi(t ?? {})) : t;
}
function bi(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = D(/* @__PURE__ */ Object.create(null), e);
	for (let r in t) n[r] = H(e[r], t[r]);
	return n;
}
function xi() {
	return {
		app: null,
		config: {
			isNativeTag: Se,
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
var Si = 0;
function Ci(e, t) {
	return function(n, r = null) {
		A(n) || (n = D({}, n)), r != null && !M(r) && (r = null);
		let i = xi(), a = /* @__PURE__ */ new WeakSet(), o = [], s = !1, c = i.app = {
			_uid: Si++,
			_component: n,
			_props: r,
			_container: null,
			_context: i,
			_instance: null,
			version: ro,
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
					let u = c._ceVNode || Oa(n, r);
					return u.appContext = i, l === !0 ? l = "svg" : l === !1 && (l = void 0), o && t ? t(u, a) : e(u, a, l), s = !0, c._container = a, a.__vue_app__ = c, to(u.component);
				}
			},
			onUnmount(e) {
				o.push(e);
			},
			unmount() {
				s && (Jn(o, c._instance, 16), e(null, c._container), delete c._container.__vue_app__);
			},
			provide(e, t) {
				return i.provides[e] = t, c;
			},
			runWithContext(e) {
				let t = wi;
				wi = c;
				try {
					return e();
				} finally {
					wi = t;
				}
			}
		};
		return c;
	};
}
var wi = null, Ti = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Be(t)}Modifiers`] || e[`${He(t)}Modifiers`];
function Ei(e, t, ...n) {
	if (e.isUnmounted) return;
	let r = e.vnode.props || E, i = n, a = t.startsWith("update:"), o = a && Ti(r, t.slice(7));
	o && (o.trim && (i = n.map((e) => j(e) ? e.trim() : e)), o.number && (i = n.map(Je)));
	let s, c = r[s = We(t)] || r[s = We(Be(t))];
	!c && a && (c = r[s = We(He(t))]), c && Jn(c, e, 6, i);
	let l = r[s + "Once"];
	if (l) {
		if (!e.emitted) e.emitted = {};
		else if (e.emitted[s]) return;
		e.emitted[s] = !0, Jn(l, e, 6, i);
	}
}
var Di = /* @__PURE__ */ new WeakMap();
function Oi(e, t, n = !1) {
	let r = n ? Di : t.emitsCache, i = r.get(e);
	if (i !== void 0) return i;
	let a = e.emits, o = {}, s = !1;
	if (!A(e)) {
		let r = (e) => {
			let n = Oi(e, t, !0);
			n && (s = !0, D(o, n));
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	return !a && !s ? (M(e) && r.set(e, null), null) : (k(a) ? a.forEach((e) => o[e] = null) : D(o, a), M(e) && r.set(e, o), o);
}
function ki(e, t) {
	return !e || !Ce(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), O(e, t[0].toLowerCase() + t.slice(1)) || O(e, He(t)) || O(e, t));
}
function Ai(e) {
	let { type: t, vnode: n, proxy: r, withProxy: i, propsOptions: [a], slots: o, attrs: s, emit: c, render: l, renderCache: u, props: d, data: f, setupState: p, ctx: m, inheritAttrs: h } = e, g = mr(e), _, v;
	try {
		if (n.shapeFlag & 4) {
			let e = i || r, t = e;
			_ = Ma(l.call(t, e, u, d, p, f, m)), v = s;
		} else {
			let e = t;
			_ = Ma(e.length > 1 ? e(d, {
				attrs: s,
				slots: o,
				emit: c
			}) : e(d, null)), v = t.props ? s : ji(s);
		}
	} catch (t) {
		_a.length = 0, Yn(t, e, 1), _ = Oa(ha);
	}
	let y = _;
	if (v && h !== !1) {
		let e = Object.keys(v), { shapeFlag: t } = y;
		e.length && t & 7 && (a && e.some(we) && (v = Mi(v, a)), y = ja(y, v, !1, !0));
	}
	return n.dirs && (y = ja(y, null, !1, !0), y.dirs = y.dirs ? y.dirs.concat(n.dirs) : n.dirs), n.transition && kr(y, n.transition), _ = y, mr(g), _;
}
var ji = (e) => {
	let t;
	for (let n in e) (n === "class" || n === "style" || Ce(n)) && ((t ||= {})[n] = e[n]);
	return t;
}, Mi = (e, t) => {
	let n = {};
	for (let r in e) (!we(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
	return n;
};
function Ni(e, t, n) {
	let { props: r, children: i, component: a } = e, { props: o, children: s, patchFlag: c } = t, l = a.emitsOptions;
	if (t.dirs || t.transition) return !0;
	if (n && c >= 0) {
		if (c & 1024) return !0;
		if (c & 16) return r ? Pi(r, o, l) : !!o;
		if (c & 8) {
			let e = t.dynamicProps;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (Fi(o, r, n) && !ki(l, n)) return !0;
			}
		}
	} else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? Pi(r, o, l) : !0 : !!o;
	return !1;
}
function Pi(e, t, n) {
	let r = Object.keys(t);
	if (r.length !== Object.keys(e).length) return !0;
	for (let i = 0; i < r.length; i++) {
		let a = r[i];
		if (Fi(t, e, a) && !ki(n, a)) return !0;
	}
	return !1;
}
function Fi(e, t, n) {
	let r = e[n], i = t[n];
	return n === "style" && M(r) && M(i) ? !ct(r, i) : r !== i;
}
function Ii({ vnode: e, parent: t, suspense: n }, r) {
	for (; t;) {
		let n = t.subTree;
		if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e) (e = t.vnode).el = r, t = t.parent;
		else break;
	}
	n && n.activeBranch === e && (n.vnode.el = r);
}
var Li = {}, Ri = () => Object.create(Li), zi = (e) => Object.getPrototypeOf(e) === Li;
function Bi(e, t, n, r = !1) {
	let i = {}, a = Ri();
	e.propsDefaults = /* @__PURE__ */ Object.create(null), Hi(e, t, i, a);
	for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
	n ? e.props = r ? i : /* @__PURE__ */ Tn(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a;
}
function Vi(e, t, n, r) {
	let { props: i, attrs: a, vnode: { patchFlag: o } } = e, s = /* @__PURE__ */ L(i), [c] = e.propsOptions, l = !1;
	if ((r || o > 0) && !(o & 16)) {
		if (o & 8) {
			let n = e.vnode.dynamicProps;
			for (let r = 0; r < n.length; r++) {
				let o = n[r];
				if (ki(e.emitsOptions, o)) continue;
				let u = t[o];
				if (c) if (O(a, o)) u !== a[o] && (a[o] = u, l = !0);
				else {
					let t = Be(o);
					i[t] = Ui(c, s, t, u, e, !1);
				}
				else u !== a[o] && (a[o] = u, l = !0);
			}
		}
	} else {
		Hi(e, t, i, a) && (l = !0);
		let r;
		for (let a in s) (!t || !O(t, a) && ((r = He(a)) === a || !O(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = Ui(c, s, a, void 0, e, !0)) : delete i[a]);
		if (a !== s) for (let e in a) (!t || !O(t, e)) && (delete a[e], l = !0);
	}
	l && Ht(e.attrs, "set", "");
}
function Hi(e, t, n, r) {
	let [i, a] = e.propsOptions, o = !1, s;
	if (t) for (let c in t) {
		if (Le(c)) continue;
		let l = t[c], u;
		i && O(i, u = Be(c)) ? !a || !a.includes(u) ? n[u] = l : (s ||= {})[u] = l : ki(e.emitsOptions, c) || (!(c in r) || l !== r[c]) && (r[c] = l, o = !0);
	}
	if (a) {
		let t = /* @__PURE__ */ L(n), r = s || E;
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			n[s] = Ui(i, t, s, r[s], e, !O(r, s));
		}
	}
	return o;
}
function Ui(e, t, n, r, i, a) {
	let o = e[n];
	if (o != null) {
		let e = O(o, "default");
		if (e && r === void 0) {
			let e = o.default;
			if (o.type !== Function && !o.skipFactory && A(e)) {
				let { propsDefaults: a } = i;
				if (n in a) r = a[n];
				else {
					let o = Ua(i);
					r = a[n] = e.call(null, t), o();
				}
			} else r = e;
			i.ce && i.ce._setProp(n, r);
		}
		o[0] && (a && !e ? r = !1 : o[1] && (r === "" || r === He(n)) && (r = !0));
	}
	return r;
}
var Wi = /* @__PURE__ */ new WeakMap();
function Gi(e, t, n = !1) {
	let r = n ? Wi : t.propsCache, i = r.get(e);
	if (i) return i;
	let a = e.props, o = {}, s = [], c = !1;
	if (!A(e)) {
		let r = (e) => {
			c = !0;
			let [n, r] = Gi(e, t, !0);
			D(o, n), r && s.push(...r);
		};
		!n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r);
	}
	if (!a && !c) return M(e) && r.set(e, be), be;
	if (k(a)) for (let e = 0; e < a.length; e++) {
		let t = Be(a[e]);
		Ki(t) && (o[t] = E);
	}
	else if (a) for (let e in a) {
		let t = Be(e);
		if (Ki(t)) {
			let n = a[e], r = o[t] = k(n) || A(n) ? { type: n } : D({}, n), i = r.type, c = !1, l = !0;
			if (k(i)) for (let e = 0; e < i.length; ++e) {
				let t = i[e], n = A(t) && t.name;
				if (n === "Boolean") {
					c = !0;
					break;
				} else n === "String" && (l = !1);
			}
			else c = A(i) && i.name === "Boolean";
			r[0] = c, r[1] = l, (c || O(r, "default")) && s.push(t);
		}
	}
	let l = [o, s];
	return M(e) && r.set(e, l), l;
}
function Ki(e) {
	return e[0] !== "$" && !Le(e);
}
var qi = (e) => e === "_" || e === "_ctx" || e === "$stable", Ji = (e) => k(e) ? e.map(Ma) : [Ma(e)], Yi = (e, t, n) => {
	if (t._n) return t;
	let r = hr((...e) => Ji(t(...e)), n);
	return r._c = !1, r;
}, Xi = (e, t, n) => {
	let r = e._ctx;
	for (let n in e) {
		if (qi(n)) continue;
		let i = e[n];
		if (A(i)) t[n] = Yi(n, i, r);
		else if (i != null) {
			let e = Ji(i);
			t[n] = () => e;
		}
	}
}, Zi = (e, t) => {
	let n = Ji(t);
	e.slots.default = () => n;
}, Qi = (e, t, n) => {
	for (let r in t) (n || !qi(r)) && (e[r] = t[r]);
}, $i = (e, t, n) => {
	let r = e.slots = Ri();
	if (e.vnode.shapeFlag & 32) {
		let e = t._;
		e ? (Qi(r, t, n), n && qe(r, "_", e, !0)) : Xi(t, r);
	} else t && Zi(e, t);
}, ea = (e, t, n) => {
	let { vnode: r, slots: i } = e, a = !0, o = E;
	if (r.shapeFlag & 32) {
		let e = t._;
		e ? n && e === 1 ? a = !1 : Qi(i, t, n) : (a = !t.$stable, Xi(t, i)), o = t;
	} else t && (Zi(e, t), o = { default: 1 });
	if (a) for (let e in i) !qi(e) && o[e] == null && delete i[e];
}, ta = pa;
function na(e) {
	return ra(e);
}
function ra(e, t) {
	let n = Ze();
	n.__VUE__ = !0;
	let { insert: r, remove: i, patchProp: a, createElement: o, createText: s, createComment: c, setText: l, setElementText: u, parentNode: d, nextSibling: f, setScopeId: p = xe, insertStaticContent: m } = e, h = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
		if (e === t) return;
		e && !Ta(e, t) && (r = _e(e), T(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
		let { type: l, ref: u, shapeFlag: d } = t;
		switch (l) {
			case ma:
				g(e, t, n, r);
				break;
			case ha:
				_(e, t, n, r);
				break;
			case ga:
				e ?? v(t, n, r, o);
				break;
			case U:
				ae(e, t, n, r, i, a, o, s, c);
				break;
			default: d & 1 ? te(e, t, n, r, i, a, o, s, c) : d & 6 ? oe(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, Se);
		}
		u != null && i ? Pr(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && Pr(e.ref, null, a, e, !0);
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
				n && n._beginPatch(), x(e, t, i, a, o, s, c);
			} finally {
				n && n._endPatch();
			}
		}
	}, ne = (e, t, n, i, s, c, l, d) => {
		let f, p, { props: m, shapeFlag: h, transition: g, dirs: _ } = e;
		if (f = e.el = o(e.type, c, m && m.is, m), h & 8 ? u(f, e.children) : h & 16 && b(e.children, f, null, i, s, ia(e, c), l, d), _ && _r(e, null, i, "created"), re(f, e, e.scopeId, l, i), m) {
			for (let e in m) e !== "value" && !Le(e) && a(f, e, null, m[e], c, i);
			"value" in m && a(f, "value", null, m.value, c), (p = m.onVnodeBeforeMount) && Ia(p, i, e);
		}
		_ && _r(e, null, i, "beforeMount");
		let v = oa(s, g);
		v && g.beforeEnter(f), r(f, t, n), ((p = m && m.onVnodeMounted) || v || _) && ta(() => {
			try {
				p && Ia(p, i, e), v && g.enter(f), _ && _r(e, null, i, "mounted");
			} finally {}
		}, s);
	}, re = (e, t, n, r, i) => {
		if (n && p(e, n), r) for (let t = 0; t < r.length; t++) p(e, r[t]);
		if (i) {
			let n = i.subTree;
			if (t === n || fa(n.type) && (n.ssContent === t || n.ssFallback === t)) {
				let t = i.vnode;
				re(e, t, t.scopeId, t.slotScopeIds, i.parent);
			}
		}
	}, b = (e, t, n, r, i, a, o, s, c = 0) => {
		for (let l = c; l < e.length; l++) h(null, e[l] = s ? Na(e[l]) : Ma(e[l]), t, n, r, i, a, o, s);
	}, x = (e, t, n, r, i, o, s) => {
		let c = t.el = e.el, { patchFlag: l, dynamicChildren: d, dirs: f } = t;
		l |= e.patchFlag & 16;
		let p = e.props || E, m = t.props || E, h;
		if (n && aa(n, !1), (h = m.onVnodeBeforeUpdate) && Ia(h, n, t, e), f && _r(t, e, n, "beforeUpdate"), n && aa(n, !0), (p.innerHTML && m.innerHTML == null || p.textContent && m.textContent == null) && u(c, ""), d ? S(e.dynamicChildren, d, c, n, r, ia(t, i), o) : s || ue(e, t, c, null, n, r, ia(t, i), o, !1), l > 0) {
			if (l & 16) ie(c, p, m, n, i);
			else if (l & 2 && p.class !== m.class && a(c, "class", null, m.class, i), l & 4 && a(c, "style", p.style, m.style, i), l & 8) {
				let e = t.dynamicProps;
				for (let t = 0; t < e.length; t++) {
					let r = e[t], o = p[r], s = m[r];
					(s !== o || r === "value") && a(c, r, o, s, i, n);
				}
			}
			l & 1 && e.children !== t.children && u(c, t.children);
		} else !s && d == null && ie(c, p, m, n, i);
		((h = m.onVnodeUpdated) || f) && ta(() => {
			h && Ia(h, n, t, e), f && _r(t, e, n, "updated");
		}, r);
	}, S = (e, t, n, r, i, a, o) => {
		for (let s = 0; s < t.length; s++) {
			let c = e[s], l = t[s];
			h(c, l, c.el && (c.type === U || !Ta(c, l) || c.shapeFlag & 198) ? d(c.el) : n, null, r, i, a, o, !0);
		}
	}, ie = (e, t, n, r, i) => {
		if (t !== n) {
			if (t !== E) for (let o in t) !Le(o) && !(o in n) && a(e, o, t[o], null, i, r);
			for (let o in n) {
				if (Le(o)) continue;
				let s = n[o], c = t[o];
				s !== c && o !== "value" && a(e, o, c, s, i, r);
			}
			"value" in n && a(e, "value", t.value, n.value, i);
		}
	}, ae = (e, t, n, i, a, o, c, l, u) => {
		let d = t.el = e ? e.el : s(""), f = t.anchor = e ? e.anchor : s(""), { patchFlag: p, dynamicChildren: m, slotScopeIds: h } = t;
		h && (l = l ? l.concat(h) : h), e == null ? (r(d, n, i), r(f, n, i), b(t.children || [], n, f, a, o, c, l, u)) : p > 0 && p & 64 && m && e.dynamicChildren && e.dynamicChildren.length === m.length ? (S(e.dynamicChildren, m, n, a, o, c, l), (t.key != null || a && t === a.subTree) && sa(e, t, !0)) : ue(e, t, n, f, a, o, c, l, u);
	}, oe = (e, t, n, r, i, a, o, s, c) => {
		t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : se(t, n, r, i, a, o, c) : C(e, t, c);
	}, se = (e, t, n, r, i, a, o) => {
		let s = e.component = za(e, r, i);
		if (Lr(e) && (s.ctx.renderer = Se), qa(s, !1, o), s.asyncDep) {
			if (i && i.registerDep(s, ce, o), !e.el) {
				let r = s.subTree = Oa(ha);
				_(null, r, t, n), e.placeholder = r.el;
			}
		} else ce(s, e, t, n, i, a, o);
	}, C = (e, t, n) => {
		let r = t.component = e.component;
		if (Ni(e, t, n)) if (r.asyncDep && !r.asyncResolved) {
			le(r, t, n);
			return;
		} else r.next = t, r.update();
		else t.el = e.el, r.vnode = t;
	}, ce = (e, t, n, r, i, a, o) => {
		let s = () => {
			if (e.isMounted) {
				let { next: t, bu: n, u: r, parent: s, vnode: c } = e;
				{
					let n = la(e);
					if (n) {
						t && (t.el = c.el, le(e, t, o)), n.asyncDep.then(() => {
							ta(() => {
								e.isUnmounted || l();
							}, i);
						});
						return;
					}
				}
				let u = t, f;
				aa(e, !1), t ? (t.el = c.el, le(e, t, o)) : t = c, n && Ke(n), (f = t.props && t.props.onVnodeBeforeUpdate) && Ia(f, s, t, c), aa(e, !0);
				let p = Ai(e), m = e.subTree;
				e.subTree = p, h(m, p, d(m.el), _e(m), e, i, a), t.el = p.el, u === null && Ii(e, p.el), r && ta(r, i), (f = t.props && t.props.onVnodeUpdated) && ta(() => Ia(f, s, t, c), i);
			} else {
				let o, { el: s, props: c } = t, { bm: l, m: u, parent: d, root: f, type: p } = e, m = Ir(t);
				if (aa(e, !1), l && Ke(l), !m && (o = c && c.onVnodeBeforeMount) && Ia(o, d, t), aa(e, !0), s && we) {
					let t = () => {
						e.subTree = Ai(e), we(s, e.subTree, e, i, null);
					};
					m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t();
				} else {
					f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
					let o = e.subTree = Ai(e);
					h(null, o, n, r, e, i, a), t.el = o.el;
				}
				if (u && ta(u, i), !m && (o = c && c.onVnodeMounted)) {
					let e = t;
					ta(() => Ia(o, d, e), i);
				}
				(t.shapeFlag & 256 || d && Ir(d.vnode) && d.vnode.shapeFlag & 256) && e.a && ta(e.a, i), e.isMounted = !0, t = n = r = null;
			}
		};
		e.scope.on();
		let c = e.effect = new gt(s);
		e.scope.off();
		let l = e.update = c.run.bind(c), u = e.job = c.runIfDirty.bind(c);
		u.i = e, u.id = e.uid, c.scheduler = () => ar(u), aa(e, !0), l();
	}, le = (e, t, n) => {
		t.component = e;
		let r = e.vnode.props;
		e.vnode = t, e.next = null, Vi(e, t.props, r, n), ea(e, t.children, n), jt(), cr(e), Mt();
	}, ue = (e, t, n, r, i, a, o, s, c = !1) => {
		let l = e && e.children, d = e ? e.shapeFlag : 0, f = t.children, { patchFlag: p, shapeFlag: m } = t;
		if (p > 0) {
			if (p & 128) {
				fe(l, f, n, r, i, a, o, s, c);
				return;
			} else if (p & 256) {
				de(l, f, n, r, i, a, o, s, c);
				return;
			}
		}
		m & 8 ? (d & 16 && ge(l, i, a), f !== l && u(n, f)) : d & 16 ? m & 16 ? fe(l, f, n, r, i, a, o, s, c) : ge(l, i, a, !0) : (d & 8 && u(n, ""), m & 16 && b(f, n, r, i, a, o, s, c));
	}, de = (e, t, n, r, i, a, o, s, c) => {
		e ||= be, t ||= be;
		let l = e.length, u = t.length, d = Math.min(l, u), f;
		for (f = 0; f < d; f++) {
			let r = t[f] = c ? Na(t[f]) : Ma(t[f]);
			h(e[f], r, n, null, i, a, o, s, c);
		}
		l > u ? ge(e, i, a, !0, !1, d) : b(t, n, r, i, a, o, s, c, d);
	}, fe = (e, t, n, r, i, a, o, s, c) => {
		let l = 0, u = t.length, d = e.length - 1, f = u - 1;
		for (; l <= d && l <= f;) {
			let r = e[l], u = t[l] = c ? Na(t[l]) : Ma(t[l]);
			if (Ta(r, u)) h(r, u, n, null, i, a, o, s, c);
			else break;
			l++;
		}
		for (; l <= d && l <= f;) {
			let r = e[d], l = t[f] = c ? Na(t[f]) : Ma(t[f]);
			if (Ta(r, l)) h(r, l, n, null, i, a, o, s, c);
			else break;
			d--, f--;
		}
		if (l > d) {
			if (l <= f) {
				let e = f + 1, d = e < u ? t[e].el : r;
				for (; l <= f;) h(null, t[l] = c ? Na(t[l]) : Ma(t[l]), n, d, i, a, o, s, c), l++;
			}
		} else if (l > f) for (; l <= d;) T(e[l], i, a, !0), l++;
		else {
			let p = l, m = l, g = /* @__PURE__ */ new Map();
			for (l = m; l <= f; l++) {
				let e = t[l] = c ? Na(t[l]) : Ma(t[l]);
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
				else for (_ = m; _ <= f; _++) if (ne[_ - m] === 0 && Ta(r, t[_])) {
					u = _;
					break;
				}
				u === void 0 ? T(r, i, a, !0) : (ne[u - m] = l + 1, u >= te ? te = u : ee = !0, h(r, t[u], n, null, i, a, o, s, c), v++);
			}
			let re = ee ? ca(ne) : be;
			for (_ = re.length - 1, l = y - 1; l >= 0; l--) {
				let e = m + l, d = t[e], f = t[e + 1], p = e + 1 < u ? f.el || da(f) : r;
				ne[l] === 0 ? h(null, d, n, p, i, a, o, s, c) : ee && (_ < 0 || l !== re[_] ? w(d, n, p, 2) : _--);
			}
		}
	}, w = (e, t, n, a, o = null) => {
		let { el: s, type: c, transition: l, children: u, shapeFlag: d } = e;
		if (d & 6) {
			w(e.component.subTree, t, n, a);
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
		if (c === U) {
			r(s, t, n);
			for (let e = 0; e < u.length; e++) w(u[e], t, n, a);
			r(e.anchor, t, n);
			return;
		}
		if (c === ga) {
			y(e, t, n);
			return;
		}
		if (a !== 2 && d & 1 && l) if (a === 0) l.beforeEnter(s), r(s, t, n), ta(() => l.enter(s), o);
		else {
			let { leave: a, delayLeave: o, afterLeave: c } = l, u = () => {
				e.ctx.isUnmounted ? i(s) : r(s, t, n);
			}, d = () => {
				s._isLeaving && s[Or](!0), a(s, () => {
					u(), c && c();
				});
			};
			o ? o(s, u, d) : d();
		}
		else r(s, t, n);
	}, T = (e, t, n, r = !1, i = !1) => {
		let { type: a, props: o, ref: s, children: c, dynamicChildren: l, shapeFlag: u, patchFlag: d, dirs: f, cacheIndex: p, memo: m } = e;
		if (d === -2 && (i = !1), s != null && (jt(), Pr(s, null, n, e, !0), Mt()), p != null && (t.renderCache[p] = void 0), u & 256) {
			t.ctx.deactivate(e);
			return;
		}
		let h = u & 1 && f, g = !Ir(e), _;
		if (g && (_ = o && o.onVnodeBeforeUnmount) && Ia(_, t, e), u & 6) he(e.component, n, r);
		else {
			if (u & 128) {
				e.suspense.unmount(n, r);
				return;
			}
			h && _r(e, null, t, "beforeUnmount"), u & 64 ? e.type.remove(e, t, n, Se, r) : l && !l.hasOnce && (a !== U || d > 0 && d & 64) ? ge(l, t, n, !1, !0) : (a === U && d & 384 || !i && u & 16) && ge(c, t, n), r && pe(e);
		}
		let v = m != null && p == null;
		(g && (_ = o && o.onVnodeUnmounted) || h || v) && ta(() => {
			_ && Ia(_, t, e), h && _r(e, null, t, "unmounted"), v && (e.el = null);
		}, n);
	}, pe = (e) => {
		let { type: t, el: n, anchor: r, transition: a } = e;
		if (t === U) {
			me(n, r);
			return;
		}
		if (t === ga) {
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
	}, me = (e, t) => {
		let n;
		for (; e !== t;) n = f(e), i(e), e = n;
		i(t);
	}, he = (e, t, n) => {
		let { bum: r, scope: i, job: a, subTree: o, um: s, m: c, a: l } = e;
		ua(c), ua(l), r && Ke(r), i.stop(), a && (a.flags |= 8, T(o, e, t, n)), s && ta(s, t), ta(() => {
			e.isUnmounted = !0;
		}, t);
	}, ge = (e, t, n, r = !1, i = !1, a = 0) => {
		for (let o = a; o < e.length; o++) T(e[o], t, n, r, i);
	}, _e = (e) => {
		if (e.shapeFlag & 6) return _e(e.component.subTree);
		if (e.shapeFlag & 128) return e.suspense.next();
		let t = f(e.anchor || e.el), n = t && t[Er];
		return n ? f(n) : t;
	}, ve = !1, ye = (e, t, n) => {
		let r;
		e == null ? t._vnode && (T(t._vnode, null, null, !0), r = t._vnode.component) : h(t._vnode || null, e, t, null, null, null, n), t._vnode = e, ve ||= (ve = !0, cr(r), lr(), !1);
	}, Se = {
		p: h,
		um: T,
		m: w,
		r: pe,
		mt: se,
		mc: b,
		pc: ue,
		pbc: S,
		n: _e,
		o: e
	}, Ce, we;
	return t && ([Ce, we] = t(Se)), {
		render: ye,
		hydrate: Ce,
		createApp: Ci(ye, Ce)
	};
}
function ia({ type: e, props: t }, n) {
	return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function aa({ effect: e, job: t }, n) {
	n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function oa(e, t) {
	return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function sa(e, t, n = !1) {
	let r = e.children, i = t.children;
	if (k(r) && k(i)) for (let e = 0; e < r.length; e++) {
		let t = r[e], a = i[e];
		a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Na(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && sa(t, a)), a.type === ma && (a.patchFlag === -1 && (a = i[e] = Na(a)), a.el = t.el), a.type === ha && !a.el && (a.el = t.el);
	}
}
function ca(e) {
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
function la(e) {
	let t = e.subTree.component;
	if (t) return t.asyncDep && !t.asyncResolved ? t : la(t);
}
function ua(e) {
	if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function da(e) {
	if (e.placeholder) return e.placeholder;
	let t = e.component;
	return t ? da(t.subTree) : null;
}
var fa = (e) => e.__isSuspense;
function pa(e, t) {
	t && t.pendingBranch ? k(e) ? t.effects.push(...e) : t.effects.push(e) : sr(e);
}
var U = /* @__PURE__ */ Symbol.for("v-fgt"), ma = /* @__PURE__ */ Symbol.for("v-txt"), ha = /* @__PURE__ */ Symbol.for("v-cmt"), ga = /* @__PURE__ */ Symbol.for("v-stc"), _a = [], va = null;
function W(e = !1) {
	_a.push(va = e ? null : []);
}
function ya() {
	_a.pop(), va = _a[_a.length - 1] || null;
}
var ba = 1;
function xa(e, t = !1) {
	ba += e, e < 0 && va && t && (va.hasOnce = !0);
}
function Sa(e) {
	return e.dynamicChildren = ba > 0 ? va || be : null, ya(), ba > 0 && va && va.push(e), e;
}
function G(e, t, n, r, i, a) {
	return Sa(K(e, t, n, r, i, a, !0));
}
function Ca(e, t, n, r, i) {
	return Sa(Oa(e, t, n, r, i, !0));
}
function wa(e) {
	return e ? e.__v_isVNode === !0 : !1;
}
function Ta(e, t) {
	return e.type === t.type && e.key === t.key;
}
var Ea = ({ key: e }) => e ?? null, Da = ({ ref: e, ref_key: t, ref_for: n }) => (typeof e == "number" && (e = "" + e), e == null ? null : j(e) || /* @__PURE__ */ R(e) || A(e) ? {
	i: fr,
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
		key: t && Ea(t),
		ref: t && Da(t),
		scopeId: pr,
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
		ctx: fr
	};
	return s ? (Pa(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= j(n) ? 8 : 16), ba > 0 && !o && va && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && va.push(c), c;
}
var Oa = ka;
function ka(e, t = null, n = null, r = 0, i = null, a = !1) {
	if ((!e || e === ei) && (e = ha), wa(e)) {
		let r = ja(e, t, !0);
		return n && Pa(r, n), ba > 0 && !a && va && (r.shapeFlag & 6 ? va[va.indexOf(e)] = r : va.push(r)), r.patchFlag = -2, r;
	}
	if (no(e) && (e = e.__vccOpts), t) {
		t = Aa(t);
		let { class: e, style: n } = t;
		e && !j(e) && (t.class = rt(e)), M(n) && (/* @__PURE__ */ jn(n) && !k(n) && (n = D({}, n)), t.style = Qe(n));
	}
	let o = j(e) ? 1 : fa(e) ? 128 : Dr(e) ? 64 : M(e) ? 4 : A(e) ? 2 : 0;
	return K(e, t, n, r, i, o, a, !0);
}
function Aa(e) {
	return e ? /* @__PURE__ */ jn(e) || zi(e) ? D({}, e) : e : null;
}
function ja(e, t, n = !1, r = !1) {
	let { props: i, ref: a, patchFlag: o, children: s, transition: c } = e, l = t ? Fa(i || {}, t) : i, u = {
		__v_isVNode: !0,
		__v_skip: !0,
		type: e.type,
		props: l,
		key: l && Ea(l),
		ref: t && t.ref ? n && a ? k(a) ? a.concat(Da(t)) : [a, Da(t)] : Da(t) : a,
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
		ssContent: e.ssContent && ja(e.ssContent),
		ssFallback: e.ssFallback && ja(e.ssFallback),
		placeholder: e.placeholder,
		el: e.el,
		anchor: e.anchor,
		ctx: e.ctx,
		ce: e.ce
	};
	return c && r && kr(u, c.clone(u)), u;
}
function q(e = " ", t = 0) {
	return Oa(ma, null, e, t);
}
function J(e = "", t = !1) {
	return t ? (W(), Ca(ha, null, e)) : Oa(ha, null, e);
}
function Ma(e) {
	return e == null || typeof e == "boolean" ? Oa(ha) : k(e) ? Oa(U, null, e.slice()) : wa(e) ? Na(e) : Oa(ma, null, String(e));
}
function Na(e) {
	return e.el === null && e.patchFlag !== -1 || e.memo ? e : ja(e);
}
function Pa(e, t) {
	let n = 0, { shapeFlag: r } = e;
	if (t == null) t = null;
	else if (k(t)) n = 16;
	else if (typeof t == "object") if (r & 65) {
		let n = t.default;
		n && (n._c && (n._d = !1), Pa(e, n()), n._c && (n._d = !0));
		return;
	} else {
		n = 32;
		let r = t._;
		!r && !zi(t) ? t._ctx = fr : r === 3 && fr && (fr.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
	}
	else A(t) ? (t = {
		default: t,
		_ctx: fr
	}, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [q(t)]) : n = 8);
	e.children = t, e.shapeFlag |= n;
}
function Fa(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		for (let e in r) if (e === "class") t.class !== r.class && (t.class = rt([t.class, r.class]));
		else if (e === "style") t.style = Qe([t.style, r.style]);
		else if (Ce(e)) {
			let n = t[e], i = r[e];
			i && n !== i && !(k(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !we(e) && (t[e] = i);
		} else e !== "" && (t[e] = r[e]);
	}
	return t;
}
function Ia(e, t, n, r = null) {
	Jn(e, t, 7, [n, r]);
}
var La = xi(), Ra = 0;
function za(e, t, n) {
	let r = e.type, i = (t ? t.appContext : e.appContext) || La, a = {
		uid: Ra++,
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
		scope: new pt(!0),
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
		propsOptions: Gi(r, i),
		emitsOptions: Oi(r, i),
		emit: null,
		emitted: null,
		propsDefaults: E,
		inheritAttrs: r.inheritAttrs,
		ctx: E,
		data: E,
		props: E,
		attrs: E,
		slots: E,
		refs: E,
		setupState: E,
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
	return a.ctx = { _: a }, a.root = t ? t.root : a, a.emit = Ei.bind(null, a), e.ce && e.ce(a), a;
}
var Y = null, Ba = () => Y || fr, Va, Ha;
{
	let e = Ze(), t = (t, n) => {
		let r;
		return (r = e[t]) || (r = e[t] = []), r.push(n), (e) => {
			r.length > 1 ? r.forEach((t) => t(e)) : r[0](e);
		};
	};
	Va = t("__VUE_INSTANCE_SETTERS__", (e) => Y = e), Ha = t("__VUE_SSR_SETTERS__", (e) => Ka = e);
}
var Ua = (e) => {
	let t = Y;
	return Va(e), e.scope.on(), () => {
		e.scope.off(), Va(t);
	};
}, Wa = () => {
	Y && Y.scope.off(), Va(null);
};
function Ga(e) {
	return e.vnode.shapeFlag & 4;
}
var Ka = !1;
function qa(e, t = !1, n = !1) {
	t && Ha(t);
	let { props: r, children: i } = e.vnode, a = Ga(e);
	Bi(e, r, a, t), $i(e, i, n || t);
	let o = a ? Ja(e, t) : void 0;
	return t && Ha(!1), o;
}
function Ja(e, t) {
	let n = e.type;
	e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, ai);
	let { setup: r } = n;
	if (r) {
		jt();
		let n = e.setupContext = r.length > 1 ? eo(e) : null, i = Ua(e), a = qn(r, e, 0, [e.props, n]), o = je(a);
		if (Mt(), i(), (o || e.sp) && !Ir(e) && jr(e), o) {
			if (a.then(Wa, Wa), t) return a.then((n) => {
				Ya(e, n, t);
			}).catch((t) => {
				Yn(t, e, 0);
			});
			e.asyncDep = a;
		} else Ya(e, a, t);
	} else Qa(e, t);
}
function Ya(e, t, n) {
	A(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : M(t) && (e.setupState = Rn(t)), Qa(e, n);
}
var Xa, Za;
function Qa(e, t, n) {
	let r = e.type;
	if (!e.render) {
		if (!t && Xa && !r.render) {
			let t = r.template || fi(e).template;
			if (t) {
				let { isCustomElement: n, compilerOptions: i } = e.appContext.config, { delimiters: a, compilerOptions: o } = r;
				r.render = Xa(t, D(D({
					isCustomElement: n,
					delimiters: a
				}, i), o));
			}
		}
		e.render = r.render || xe, Za && Za(e);
	}
	{
		let t = Ua(e);
		jt();
		try {
			ci(e);
		} finally {
			Mt(), t();
		}
	}
}
var $a = { get(e, t) {
	return I(e, "get", ""), e[t];
} };
function eo(e) {
	return {
		attrs: new Proxy(e.attrs, $a),
		slots: e.slots,
		emit: e.emit,
		expose: (t) => {
			e.exposed = t || {};
		}
	};
}
function to(e) {
	return e.exposed ? e.exposeProxy ||= new Proxy(Rn(Mn(e.exposed)), {
		get(t, n) {
			if (n in t) return t[n];
			if (n in ri) return ri[n](e);
		},
		has(e, t) {
			return t in e || t in ri;
		}
	}) : e.proxy;
}
function no(e) {
	return A(e) && "__vccOpts" in e;
}
var X = (e, t) => /* @__PURE__ */ Bn(e, t, Ka), ro = "3.5.34", io = void 0, ao = typeof window < "u" && window.trustedTypes;
if (ao) try {
	io = /* @__PURE__ */ ao.createPolicy("vue", { createHTML: (e) => e });
} catch {}
var oo = io ? (e) => io.createHTML(e) : (e) => e, so = "http://www.w3.org/2000/svg", co = "http://www.w3.org/1998/Math/MathML", lo = typeof document < "u" ? document : null, uo = lo && /* @__PURE__ */ lo.createElement("template"), fo = {
	insert: (e, t, n) => {
		t.insertBefore(e, n || null);
	},
	remove: (e) => {
		let t = e.parentNode;
		t && t.removeChild(e);
	},
	createElement: (e, t, n, r) => {
		let i = t === "svg" ? lo.createElementNS(so, e) : t === "mathml" ? lo.createElementNS(co, e) : n ? lo.createElement(e, { is: n }) : lo.createElement(e);
		return e === "select" && r && r.multiple != null && i.setAttribute("multiple", r.multiple), i;
	},
	createText: (e) => lo.createTextNode(e),
	createComment: (e) => lo.createComment(e),
	setText: (e, t) => {
		e.nodeValue = t;
	},
	setElementText: (e, t) => {
		e.textContent = t;
	},
	parentNode: (e) => e.parentNode,
	nextSibling: (e) => e.nextSibling,
	querySelector: (e) => lo.querySelector(e),
	setScopeId(e, t) {
		e.setAttribute(t, "");
	},
	insertStaticContent(e, t, n, r, i, a) {
		let o = n ? n.previousSibling : t.lastChild;
		if (i && (i === a || i.nextSibling)) for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
		else {
			uo.innerHTML = oo(r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e);
			let i = uo.content;
			if (r === "svg" || r === "mathml") {
				let e = i.firstChild;
				for (; e.firstChild;) i.appendChild(e.firstChild);
				i.removeChild(e);
			}
			t.insertBefore(i, n);
		}
		return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild];
	}
}, po = /* @__PURE__ */ Symbol("_vtc");
function mo(e, t, n) {
	let r = e[po];
	r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
var ho = /* @__PURE__ */ Symbol("_vod"), go = /* @__PURE__ */ Symbol("_vsh"), _o = /* @__PURE__ */ Symbol(""), vo = /(?:^|;)\s*display\s*:/;
function yo(e, t, n) {
	let r = e.style, i = j(n), a = !1;
	if (n && !i) {
		if (t) if (j(t)) for (let e of t.split(";")) {
			let t = e.slice(0, e.indexOf(":")).trim();
			n[t] ?? xo(r, t, "");
		}
		else for (let e in t) n[e] ?? xo(r, e, "");
		for (let i in n) {
			i === "display" && (a = !0);
			let o = n[i];
			o == null ? xo(r, i, "") : To(e, i, !j(t) && t ? t[i] : void 0, o) || xo(r, i, o);
		}
	} else if (i) {
		if (t !== n) {
			let e = r[_o];
			e && (n += ";" + e), r.cssText = n, a = vo.test(n);
		}
	} else t && e.removeAttribute("style");
	ho in e && (e[ho] = a ? r.display : "", e[go] && (r.display = "none"));
}
var bo = /\s*!important$/;
function xo(e, t, n) {
	if (k(n)) n.forEach((n) => xo(e, t, n));
	else if (n ??= "", t.startsWith("--")) e.setProperty(t, n);
	else {
		let r = wo(e, t);
		bo.test(n) ? e.setProperty(He(r), n.replace(bo, ""), "important") : e[r] = n;
	}
}
var So = [
	"Webkit",
	"Moz",
	"ms"
], Co = {};
function wo(e, t) {
	let n = Co[t];
	if (n) return n;
	let r = Be(t);
	if (r !== "filter" && r in e) return Co[t] = r;
	r = Ue(r);
	for (let n = 0; n < So.length; n++) {
		let i = So[n] + r;
		if (i in e) return Co[t] = i;
	}
	return t;
}
function To(e, t, n, r) {
	return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && j(r) && n === r;
}
var Eo = "http://www.w3.org/1999/xlink";
function Do(e, t, n, r, i, a = at(t)) {
	r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Eo, t.slice(6, t.length)) : e.setAttributeNS(Eo, t, n) : n == null || a && !ot(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? "" : Ae(n) ? String(n) : n);
}
function Oo(e, t, n, r, i) {
	if (t === "innerHTML" || t === "textContent") {
		n != null && (e[t] = t === "innerHTML" ? oo(n) : n);
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
		r === "boolean" ? n = ot(n) : n == null && r === "string" ? (n = "", o = !0) : r === "number" && (n = 0, o = !0);
	}
	try {
		e[t] = n;
	} catch {}
	o && e.removeAttribute(i || t);
}
function ko(e, t, n, r) {
	e.addEventListener(t, n, r);
}
function Ao(e, t, n, r) {
	e.removeEventListener(t, n, r);
}
var jo = /* @__PURE__ */ Symbol("_vei");
function Mo(e, t, n, r, i = null) {
	let a = e[jo] || (e[jo] = {}), o = a[t];
	if (r && o) o.value = r;
	else {
		let [n, s] = Po(t);
		r ? ko(e, n, a[t] = Ro(r, i), s) : o && (Ao(e, n, o, s), a[t] = void 0);
	}
}
var No = /(?:Once|Passive|Capture)$/;
function Po(e) {
	let t;
	if (No.test(e)) {
		t = {};
		let n;
		for (; n = e.match(No);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
	}
	return [e[2] === ":" ? e.slice(3) : He(e.slice(2)), t];
}
var Fo = 0, Io = /* @__PURE__ */ Promise.resolve(), Lo = () => Fo ||= (Io.then(() => Fo = 0), Date.now());
function Ro(e, t) {
	let n = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= n.attached) return;
		Jn(zo(e, n.value), t, 5, [e]);
	};
	return n.value = e, n.attached = Lo(), n;
}
function zo(e, t) {
	if (k(t)) {
		let n = e.stopImmediatePropagation;
		return e.stopImmediatePropagation = () => {
			n.call(e), e._stopped = !0;
		}, t.map((e) => (t) => !t._stopped && e && e(t));
	} else return t;
}
var Bo = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Vo = (e, t, n, r, i, a) => {
	let o = i === "svg";
	t === "class" ? mo(e, r, o) : t === "style" ? yo(e, n, r) : Ce(t) ? we(t) || Mo(e, t, n, r, a) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ho(e, t, r, o)) ? (Oo(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Do(e, t, r, o, a, t !== "value")) : e._isVueCE && (Uo(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !j(r))) ? Oo(e, Be(t), r, a, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), Do(e, t, r, o));
};
function Ho(e, t, n, r) {
	if (r) return !!(t === "innerHTML" || t === "textContent" || t in e && Bo(t) && A(n));
	if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
	if (t === "width" || t === "height") {
		let t = e.tagName;
		if (t === "IMG" || t === "VIDEO" || t === "CANVAS" || t === "SOURCE") return !1;
	}
	return Bo(t) && j(n) ? !1 : t in e;
}
function Uo(e, t) {
	let n = e._def.props;
	if (!n) return !1;
	let r = Be(t);
	return Array.isArray(n) ? n.some((e) => Be(e) === r) : Object.keys(n).some((e) => Be(e) === r);
}
var Wo = {};
/* @__NO_SIDE_EFFECTS__ */
function Go(e, t, n) {
	let r = /* @__PURE__ */ Ar(e, t);
	Fe(r) && (r = D({}, r, t));
	class i extends qo {
		constructor(e) {
			super(r, e, n);
		}
	}
	return i.def = r, i;
}
var Ko = typeof HTMLElement < "u" ? HTMLElement : class {}, qo = class e extends Ko {
	constructor(e, t = {}, n = fs) {
		super(), this._def = e, this._props = t, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== fs ? this._root = this.shadowRoot : e.shadowRoot === !1 ? this._root = this : (this.attachShadow(D({}, e.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
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
		this._connected = !1, rr(() => {
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
			if (n && !k(n)) for (let e in n) {
				let t = n[e];
				(t === Number || t && t.type === Number) && (e in this._props && (this._props[e] = Ye(this._props[e])), (i ||= /* @__PURE__ */ Object.create(null))[Be(e)] = !0);
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
		if (t) for (let e in t) O(this, e) || Object.defineProperty(this, e, { get: () => B(t[e]) });
	}
	_resolveProps(e) {
		let { props: t } = e, n = k(t) ? t : Object.keys(t || {});
		for (let e of Object.keys(this)) e[0] !== "_" && n.includes(e) && this._setProp(e, this[e]);
		for (let e of n.map(Be)) Object.defineProperty(this, e, {
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
		let t = this.hasAttribute(e), n = t ? this.getAttribute(e) : Wo, r = Be(e);
		t && this._numberProps && this._numberProps[r] && (n = Ye(n)), this._setProp(r, n, !1, !0);
	}
	_getProp(e) {
		return this._props[e];
	}
	_setProp(e, t, n = !0, r = !1) {
		if (t !== this._props[e] && (this._dirty = !0, t === Wo ? delete this._props[e] : (this._props[e] = t, e === "key" && this._app && (this._app._ceVNode.key = t)), r && this._instance && this._update(), n)) {
			let n = this._ob;
			n && (this._processMutations(n.takeRecords()), n.disconnect()), t === !0 ? this.setAttribute(He(e), "") : typeof t == "string" || typeof t == "number" ? this.setAttribute(He(e), t + "") : t || this.removeAttribute(He(e)), n && n.observe(this, { attributes: !0 });
		}
	}
	_update() {
		let e = this._createVNode();
		this._app && (e.appContext = this._app._context), ds(e, this._root);
	}
	_createVNode() {
		let e = {};
		this.shadowRoot || (e.onVnodeMounted = e.onVnodeUpdated = this._renderSlots.bind(this));
		let t = Oa(this._def, D(e, this._props));
		return this._instance || (t.ce = (e) => {
			this._instance = e, e.ce = this, e.isCE = !0;
			let t = (e, t) => {
				this.dispatchEvent(new CustomEvent(e, Fe(t[0]) ? D({ detail: t }, t[0]) : { detail: t }));
			};
			e.emit = (e, ...n) => {
				t(e, n), He(e) !== e && t(He(e), n);
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
}, Jo = (e) => {
	let t = e.props["onUpdate:modelValue"] || !1;
	return k(t) ? (e) => Ke(t, e) : t;
};
function Yo(e) {
	e.target.composing = !0;
}
function Xo(e) {
	let t = e.target;
	t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
var Zo = /* @__PURE__ */ Symbol("_assign");
function Qo(e, t, n) {
	return t && (e = e.trim()), n && (e = Je(e)), e;
}
var $o = {
	created(e, { modifiers: { lazy: t, trim: n, number: r } }, i) {
		e[Zo] = Jo(i);
		let a = r || i.props && i.props.type === "number";
		ko(e, t ? "change" : "input", (t) => {
			t.target.composing || e[Zo](Qo(e.value, n, a));
		}), (n || a) && ko(e, "change", () => {
			e.value = Qo(e.value, n, a);
		}), t || (ko(e, "compositionstart", Yo), ko(e, "compositionend", Xo), ko(e, "change", Xo));
	},
	mounted(e, { value: t }) {
		e.value = t ?? "";
	},
	beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: i, number: a } }, o) {
		if (e[Zo] = Jo(o), e.composing) return;
		let s = (a || e.type === "number") && !/^0\d/.test(e.value) ? Je(e.value) : e.value, c = t ?? "";
		if (s === c) return;
		let l = e.getRootNode();
		(l instanceof Document || l instanceof ShadowRoot) && l.activeElement === e && e.type !== "range" && (r && t === n || i && e.value.trim() === c) || (e.value = c);
	}
}, es = {
	deep: !0,
	created(e, { value: t, modifiers: { number: n } }, r) {
		let i = Oe(t);
		ko(e, "change", () => {
			let t = Array.prototype.filter.call(e.options, (e) => e.selected).map((e) => n ? Je(ns(e)) : ns(e));
			e[Zo](e.multiple ? i ? new Set(t) : t : t[0]), e._assigning = !0, rr(() => {
				e._assigning = !1;
			});
		}), e[Zo] = Jo(r);
	},
	mounted(e, { value: t }) {
		ts(e, t);
	},
	beforeUpdate(e, t, n) {
		e[Zo] = Jo(n);
	},
	updated(e, { value: t }) {
		e._assigning || ts(e, t);
	}
};
function ts(e, t) {
	let n = e.multiple, r = k(t);
	if (!(n && !r && !Oe(t))) {
		for (let i = 0, a = e.options.length; i < a; i++) {
			let a = e.options[i], o = ns(a);
			if (n) if (r) {
				let e = typeof o;
				e === "string" || e === "number" ? a.selected = t.some((e) => String(e) === String(o)) : a.selected = lt(t, o) > -1;
			} else a.selected = t.has(o);
			else if (ct(ns(a), t)) {
				e.selectedIndex !== i && (e.selectedIndex = i);
				return;
			}
		}
		!n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
	}
}
function ns(e) {
	return "_value" in e ? e._value : e.value;
}
var rs = [
	"ctrl",
	"shift",
	"alt",
	"meta"
], is = {
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
	exact: (e, t) => rs.some((n) => e[`${n}Key`] && !t.includes(n))
}, as = (e, t) => {
	if (!e) return e;
	let n = e._withMods ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n, ...r) => {
		for (let e = 0; e < t.length; e++) {
			let r = is[t[e]];
			if (r && r(n, t)) return;
		}
		return e(n, ...r);
	}));
}, os = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
}, ss = (e, t) => {
	let n = e._withKeys ||= {}, r = t.join(".");
	return n[r] || (n[r] = ((n) => {
		if (!("key" in n)) return;
		let r = He(n.key);
		if (t.some((e) => e === r || os[e] === r)) return e(n);
	}));
}, cs = /* @__PURE__ */ D({ patchProp: Vo }, fo), ls;
function us() {
	return ls ||= na(cs);
}
var ds = ((...e) => {
	us().render(...e);
}), fs = ((...e) => {
	let t = us().createApp(...e), { mount: n } = t;
	return t.mount = (e) => {
		let r = ms(e);
		if (!r) return;
		let i = t._component;
		!A(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
		let a = n(r, !1, ps(r));
		return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), a;
	}, t;
});
function ps(e) {
	if (e instanceof SVGElement) return "svg";
	if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml";
}
function ms(e) {
	return j(e) ? document.querySelector(e) : e;
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
		n ||= w(t.target ?? window, r);
	}, a = () => {
		n?.(), n = null;
	};
	t.enabled ? Sr(t.enabled, (e) => {
		e ? i() : a();
	}, { immediate: !0 }) : i(), Yr(a);
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
//#endregion
//#region packages/sdk-vue/src/parse-query.ts
function sl(e, t) {
	let n = {}, r = /* @__PURE__ */ new Set(), i = [], a = new Set(t);
	if (!e || !e.trim()) return {
		text: "",
		filters: n,
		unknown: []
	};
	let o = cl(e);
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
function cl(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n;) {
		for (; r < n && ll(e.charCodeAt(r));) r += 1;
		if (r >= n) break;
		let i = r, a = -1;
		for (; r < n && !ll(e.charCodeAt(r));) {
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
			if (ul(n)) {
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
function ll(e) {
	return e === 32 || e === 9 || e === 10 || e === 13;
}
function ul(e) {
	if (e.length === 0 || !dl(e.charCodeAt(0))) return !1;
	for (let t = 1; t < e.length; t += 1) {
		let n = e.charCodeAt(t);
		if (!dl(n) && !fl(n) && n !== 95 && n !== 45) return !1;
	}
	return !0;
}
function dl(e) {
	return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function fl(e) {
	return e >= 48 && e <= 57;
}
//#endregion
//#region packages/sdk-vue/src/classify-principal.ts
var pl = {
	kind: "unknown",
	label: "unknown",
	glyph: "·",
	tone: "neutral"
};
function ml(e) {
	if (!e) return pl;
	let [t = "", ...n] = e.replace(/^comtrya:\/\//, "").split("/"), r = n.join("/") || e;
	switch (t) {
		case "user": return {
			kind: "human",
			label: r,
			glyph: hl(r),
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
			glyph: hl(r) || "·",
			tone: "neutral"
		};
	}
}
function hl(e) {
	return e.slice(0, 1).toUpperCase();
}
//#endregion
//#region packages/sdk-vue/src/comtrya-config.ts
function gl() {
	if (typeof window > "u") return [];
	let e = window.location.pathname;
	if (!e.startsWith("/r/")) return [];
	let t = e.slice(3), n = t.indexOf("/p/");
	return (n >= 0 ? t.slice(0, n) : t).split("/").filter(Boolean).map(decodeURIComponent);
}
async function _l(e) {
	try {
		let t = e ?? gl();
		return t.length === 0 ? [] : (((await p().query("query ComtryaProjects($segments: [String!]!) {\n      workspace { repositoryByPath(segments: $segments) { comtryaConfig } }\n    }", { segments: t })).workspace?.repositoryByPath?.comtryaConfig ?? null)?.projects ?? []).filter((e) => typeof e == "object" && !!e);
	} catch {
		return [];
	}
}
async function vl(e, t) {
	return ((await _l(t)).find((t) => t.name === e)?.owners ?? []).map((e) => e?.ref).filter((e) => typeof e == "string" && e.length > 0);
}
//#endregion
//#region packages/sdk-vue/src/LabelPill.vue?vue&type=script&setup=true&lang.ts
var yl = ["title"], bl = {
	key: 0,
	class: "label-pill-value"
}, xl = { class: "label-pill-type" }, Sl = { class: "label-pill-value" }, Cl = /* @__PURE__ */ Ar({
	__name: "LabelPill",
	props: {
		name: { type: String },
		catalog: { type: [Object, null] }
	},
	setup(e) {
		let t = e, n = X(() => t.catalog ? t.catalog[t.name] ?? null : null), r = X(() => {
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
		}), i = X(() => n.value?.color ?? null), a = X(() => n.value?.description ?? null);
		return (e, t) => (W(), G("span", {
			class: rt(["label-pill", [`label-pill--${r.value.kind}`]]),
			title: a.value ?? void 0,
			style: Qe(i.value ? { "--label-color": i.value } : void 0)
		}, [r.value.kind === "plain" ? (W(), G("span", bl, N(r.value.value), 1)) : (W(), G(U, { key: 1 }, [
			K("span", xl, N(r.value.type), 1),
			t[0] ||= K("span", {
				class: "label-pill-sep",
				"aria-hidden": "true"
			}, "::", -1),
			K("span", Sl, N(r.value.value), 1)
		], 64))], 14, yl));
	}
});
//#endregion
//#region packages/sdk-vue/src/index.ts
function wl(e) {
	Tl(e.tagName, e.component);
	let t = /* @__PURE__ */ Go(e.component, { shadowRoot: e.shadowRoot ?? !1 });
	for (let [n, r] of Object.entries(e.propertyAliases ?? {})) Object.defineProperty(t.prototype, n, {
		configurable: !0,
		get() {
			return this[r];
		},
		set(e) {
			this[r] = e, typeof e == "string" && this.setAttribute(Dl(r), e);
		}
	});
	return typeof customElements < "u" && !customElements.get(e.tagName) && customElements.define(e.tagName, t), t;
}
function Tl(e, t) {
	if (typeof document > "u") return;
	let n = El(t);
	if (n.length === 0) return;
	let r = `comtrya-widget-styles:${e}`;
	if (document.head.querySelector(`style[data-comtrya-widget-styles="${r}"]`)) return;
	let i = document.createElement("style");
	i.dataset.comtryaWidgetStyles = r, i.textContent = n.join("\n"), document.head.append(i);
}
function El(e) {
	if (!e || typeof e != "object") return [];
	let t = e.styles;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function Dl(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../extensions/first-party/ext_epics/dist/ext_epics.client.ts
var Ol = {
	createEpic: async (e) => c("ext_epics", "epics", "create-epic", e),
	changeStateEpic: async (e) => c("ext_epics", "epics", "change-state-epic", e),
	assignProject: async (e) => c("ext_epics", "epics", "assign-project", e),
	updateEpic: async (e) => c("ext_epics", "epics", "update-epic", e),
	getEpic: async (e) => c("ext_epics", "epics", "get-epic", e),
	listEpics: async (e) => c("ext_epics", "epics", "list-epics", e),
	byRefEpic: async (e) => c("ext_epics", "epics", "by-ref-epic", e),
	byRefsEpic: async (e) => c("ext_epics", "epics", "by-refs-epic", e),
	progressEpic: async (e) => c("ext_epics", "epics", "progress-epic", e),
	roadmapBoard: async (e) => c("ext_epics", "epics", "roadmap-board", e),
	ownerBoard: async (e) => c("ext_epics", "epics", "owner-board", e),
	projectBoard: async (e) => c("ext_epics", "epics", "project-board", e),
	labelBoard: async (e) => c("ext_epics", "epics", "label-board", e),
	priorityBoard: async (e) => c("ext_epics", "epics", "priority-board", e),
	milestoneBoard: async (e) => c("ext_epics", "epics", "milestone-board", e),
	targetBoard: async (e) => c("ext_epics", "epics", "target-board", e),
	issuesInEpic: async (e) => c("ext_epics", "epics", "issues-in-epic", e),
	childrenOfEpic: async (e) => c("ext_epics", "epics", "children-of-epic", e)
}, kl = "query($from: ResourceURN!, $kind: ResourceURN) {\n  relations.outgoing(from: $from, kind: $kind) { id kind from to source target }\n}", Al = "mutation($input: RelationCreateInput!) {\n  relations.create(input: $input) { id kind from to source target }\n}", jl = "mutation($input: RelationDeleteInput!) {\n  relations.delete(input: $input)\n}";
function Ml(e, t) {
	if (e.ok) return e.value;
	throw Error(`${t}: ${e.error.message}`);
}
function Nl(e) {
	return `comtrya://workspace/${e}`;
}
function Pl(e) {
	switch (e) {
		case "IN_PROGRESS":
		case "AT_RISK":
		case "DONE":
		case "CANCELED": return e;
		default: return "PLANNED";
	}
}
function Fl(e) {
	return {
		id: e.id,
		workspaceId: e.workspaceId ?? e.workspace?.replace(/^comtrya:\/\/workspace\//, "") ?? "",
		title: e.title,
		bodyMarkdown: e.bodyMarkdown ?? "",
		state: Pl(e.state),
		targetDate: e.targetDate ?? null,
		ownerRef: e.ownerRef ?? null,
		labels: e.labels ?? [],
		createdAt: e.createdAt ?? null,
		closedAt: e.closedAt ?? null,
		projectName: e.projectName ?? null
	};
}
async function Il(e, t) {
	let n = Ml(await Ol.byRefEpic(t), "epicByRef");
	return n ? Fl(n) : null;
}
async function Ll(e, t) {
	let n = Ml(await Ol.listEpics({
		workspace: Nl(t.workspaceId),
		limit: 1024
	}), "listEpics").map(Fl), r = t.state ? Pl(t.state) : null;
	return r ? n.filter((e) => e.state === r) : n;
}
async function Rl(e, t) {
	return Ml(await Ol.progressEpic(t), "epicProgress");
}
async function zl(e, t, n = 1024) {
	return Ml(await Ol.issuesInEpic({
		ref: t,
		limit: n
	}), "issuesInEpic");
}
async function Bl(e, t, n) {
	return Fl(Ml(await Ol.changeStateEpic({
		id: t,
		state: n
	}), "changeEpicState"));
}
async function Vl(e, t) {
	return Fl(Ml(await Ol.createEpic({
		workspace: Nl(t.workspaceId),
		title: t.title,
		bodyMarkdown: t.bodyMarkdown ?? "",
		ownerRef: null,
		targetDate: null,
		labels: [],
		parentEpicRef: null,
		projectName: t.projectName ?? null
	}), "createEpic"));
}
async function Hl(e, t) {
	return Fl(Ml(await Ol.assignProject({
		id: e,
		projectName: t ?? null
	}), "assignProject"));
}
async function Ul(e, t, n) {
	return ((await e.query(kl, n ? {
		from: t,
		kind: n
	} : { from: t })).relations?.outgoing ?? []).map(Kl);
}
async function Wl(e, t) {
	let n = (await e.mutate(Al, { input: t })).relations?.create;
	if (!n) throw Error("relations.create returned no relation");
	return Kl(n);
}
async function Gl(e, t) {
	return (await e.mutate(jl, { input: { id: t } })).relations?.delete ?? !1;
}
function Kl(e) {
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
function ql() {
	return _e() ?? "";
}
var Jl = "epics";
function Yl(e) {
	return `comtrya://epic/${e.id}`;
}
function Xl(e) {
	return h(Jl, `/${e.workspaceId}/${e.id}`);
}
function Zl(e) {
	return `${h(Jl, "/new")}?workspaceId=${e}`;
}
function Ql(e) {
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
var $l = /* @__PURE__ */ new Map();
function eu(e) {
	return [
		e.id,
		e.title,
		e.state,
		e.projectName ?? ""
	].join("|");
}
var tu = [
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
function nu(e) {
	return e.projectName ? ` (${e.projectName})` : "";
}
function ru(e, t) {
	let n = [], r = nu(e);
	n.push(me({
		id: `ext_epics.open.${e.id}`,
		title: `Open epic ${e.title}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: () => {
			window.location.href = Xl(e);
		}
	}));
	for (let { state: i, verb: a } of tu) e.state !== i && n.push(me({
		id: `ext_epics.mark.${i.toLowerCase()}.${e.id}`,
		title: `Mark epic ${e.title} ${a}${r}`,
		category: "Epics",
		extensionId: "ext_epics",
		run: async () => {
			await Bl(t, e.id, i);
		}
	}));
	return () => n.forEach((e) => e());
}
async function iu(e, t) {
	let n;
	try {
		n = await Ll(e, { workspaceId: t });
	} catch (e) {
		console.warn("[ext_epics] palette sync failed:", e);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	for (let t of n) {
		r.add(t.id);
		let n = eu(t), i = $l.get(t.id);
		i && i.signature === n || (i?.unregister(), $l.set(t.id, {
			signature: n,
			unregister: ru(t, e)
		}));
	}
	for (let [e, t] of $l) r.has(e) || (t.unregister(), $l.delete(e));
}
function au(e) {
	let t = [], n = !1;
	return ve().then((r) => {
		if (!n) {
			iu(e, r);
			for (let n of ["dev.comtrya.epic.created", "dev.comtrya.epic.state-changed"]) t.push(g({
				type: n,
				onEvent: () => {
					iu(e, r);
				},
				onError: () => {}
			}));
		}
	}), () => {
		n = !0;
		for (let e of t) e();
		for (let e of $l.values()) e.unregister();
		$l.clear();
	};
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicCard.vue?vue&type=script&setup=true&lang.ts
var ou = ["data-state"], su = ["data-epic-id"], cu = { class: "epic-card-title" }, lu = ["href"], uu = ["data-author-kind", "title"], du = { class: "owner-glyph" }, fu = ["title"], pu = {
	key: 0,
	class: "epic-meta"
}, mu = {
	key: 1,
	class: "epic-meta"
}, hu = {
	key: 1,
	class: "epic-line muted"
}, gu = {
	key: 2,
	class: "epic-card-fallback"
}, _u = { class: "epic-line muted" }, vu = { class: "epic-line warn" }, yu = /* @__PURE__ */ Ar({
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
		let n = e, r = t, i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(n.epic ?? null), s = /* @__PURE__ */ z(null), c = X(() => n.resourceRef ?? n.ref ?? ""), l = X(() => n.client ?? n.comtryaClient), u = X(() => n.epic ?? o.value), d = X(() => Ql(u.value?.state)), f = X(() => (s.value?.issuesOpen ?? 0) + (s.value?.issuesClosed ?? 0));
		Gr(p), Sr(() => [
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
				o.value = await Il(l.value, c.value), i.value = o.value ? "ready" : "empty", await m();
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
				s.value = await Rl(l.value, c.value);
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
			K("div", cu, [
				K("span", { class: rt(["epic-pill", d.value.className]) }, N(d.value.label), 3),
				K("a", {
					class: "epic-title-link",
					href: B(Xl)(u.value)
				}, N(u.value.title), 9, lu),
				u.value.ownerRef ? (W(), G("button", {
					key: 0,
					type: "button",
					class: rt(["epic-owner", { active: n.activeOwner === u.value.ownerRef }]),
					"data-author-kind": h(u.value.ownerRef).kind,
					title: `${u.value.ownerRef}\nClick to filter by this owner`,
					onClick: t[0] ||= as((e) => r("owner-click", u.value.ownerRef), ["prevent", "stop"])
				}, [K("span", du, N(h(u.value.ownerRef).glyph), 1), q(" " + N(h(u.value.ownerRef).label), 1)], 10, uu)) : J("", !0),
				u.value.projectName ? (W(), G("button", {
					key: 1,
					type: "button",
					class: rt(["epic-project", { active: n.activeProject === u.value.projectName }]),
					title: `${u.value.projectName}\nClick to filter by this project`,
					onClick: t[1] ||= as((e) => r("project-click", u.value.projectName), ["prevent", "stop"])
				}, [t[2] ||= K("span", { class: "project-glyph" }, "◇", -1), q(" " + N(u.value.projectName), 1)], 10, fu)) : J("", !0)
			]),
			s.value ? (W(), G("div", pu, [K("span", null, N(s.value.issuesClosed ?? 0) + "/" + N(f.value) + " issues", 1), K("span", null, N(s.value.percentComplete ?? 0) + "% complete", 1)])) : J("", !0),
			u.value.targetDate ? (W(), G("div", mu, [K("span", null, "target: " + N(u.value.targetDate), 1)])) : J("", !0)
		], 8, su)) : i.value === "loading" ? (W(), G("p", hu, " Loading " + N(c.value), 1)) : (W(), G("div", gu, [K("p", _u, N(c.value || "epic"), 1), K("p", vu, N(a.value ?? "epic not found"), 1)]))], 8, ou));
	}
}), bu = ".epic-card[data-v-c61c70a7]{display:block}.epic-card-body[data-v-c61c70a7]{border:.5px solid var(--line,#ffffff12);gap:6px;padding:10px 12px;display:grid}.epic-card-title[data-v-c61c70a7]{align-items:baseline;gap:8px;min-width:0;display:flex}.epic-pill[data-v-c61c70a7],.epic-meta[data-v-c61c70a7],.epic-line[data-v-c61c70a7]{font-family:var(--font-mono,monospace)}.epic-pill[data-v-c61c70a7]{border:.5px solid;padding:1px 8px;font-size:10px}.epic-project[data-v-c61c70a7]{font-family:var(--font-mono,monospace);color:var(--accent-blue,#1d55a6);cursor:pointer;font-size:11px;font:inherit;font-family:var(--font-mono,monospace);background:0 0;border:.5px solid;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-project[data-v-c61c70a7]:hover{background:var(--bg-2,#0e1014)}.epic-project.active[data-v-c61c70a7]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);border-color:var(--fg,#fffffff0)}.epic-owner+.epic-project[data-v-c61c70a7]{margin-left:4px}.epic-project .project-glyph[data-v-c61c70a7]{font-size:10px}.epic-owner[data-v-c61c70a7]{font-family:var(--font-mono,monospace);color:var(--fg-2,#ffffffbd);cursor:pointer;font-size:11px;font:inherit;font-family:var(--font-mono,monospace);background:0 0;border:1px dashed;align-items:center;gap:4px;margin-left:auto;padding:0 6px;display:inline-flex}.epic-owner[data-v-c61c70a7]:hover{background:var(--bg-2,#0e1014)}.epic-owner.active[data-v-c61c70a7]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);border-style:solid;border-color:var(--fg,#fffffff0)}.epic-owner.active .owner-glyph[data-v-c61c70a7]{color:inherit}.epic-owner .owner-glyph[data-v-c61c70a7]{place-items:center;width:12px;height:12px;font-size:9px;font-weight:700;display:inline-grid}.epic-owner[data-author-kind=agent][data-v-c61c70a7]{color:#6b3fa0}.epic-owner[data-author-kind=bot][data-v-c61c70a7]{color:var(--accent-blue,#1d55a6)}.epic-owner[data-author-kind=credential][data-v-c61c70a7]{color:var(--accent-yellow,#c89300)}.epic-owner[data-author-kind=team][data-v-c61c70a7]{color:var(--accent-teal,#087f6f)}.epic-state-good[data-v-c61c70a7]{color:var(--ok,#5dc879)}@supports (color:lab(0% 0 0)){.epic-state-good[data-v-c61c70a7]{color:var(--ok,lab(72.9029% -45.1402 29.5956))}}.epic-state-warn[data-v-c61c70a7]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.epic-state-warn[data-v-c61c70a7]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}.epic-state-muted[data-v-c61c70a7],.epic-meta[data-v-c61c70a7],.muted[data-v-c61c70a7]{color:var(--fg-3,#ffffff85)}.epic-title-link[data-v-c61c70a7]{min-width:0;color:inherit;font-family:var(--font-serif,system-ui);overflow-wrap:anywhere;font-weight:600}.epic-meta[data-v-c61c70a7]{flex-wrap:wrap;gap:8px;font-size:11px;display:flex}.epic-line[data-v-c61c70a7]{margin:4px 0;font-size:12px}.warn[data-v-c61c70a7]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-c61c70a7]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}", xu = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, Su = /* @__PURE__ */ xu(yu, [["styles", [bu]], ["__scopeId", "data-v-c61c70a7"]]);
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/issue-rows.ts
function Cu(e, t = "") {
	return typeof e == "string" ? e : t;
}
function wu(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Tu(e) {
	let t = typeof e == "string" ? e.toUpperCase() : "";
	return t === "CLOSED" ? "CLOSED" : t === "REOPENED" ? "REOPENED" : "OPEN";
}
function Eu(e) {
	return typeof e == "string" ? e.match(/^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/[^/]+)?$/)?.[1] ?? null : null;
}
async function Du(e) {
	let t = await c("ext_issues", "issues", "by-ref-issue", e);
	if (!t.ok || !t.value || typeof t.value != "object") return null;
	let n = t.value, r = wu(n.number), i = Eu(n.repository), a = r !== null && i ? h("issues", `/${i}/${r}`) : null;
	return {
		ref: e,
		id: Cu(n.id),
		number: r,
		title: Cu(n.title, "(untitled)"),
		state: Tu(n.state),
		projectName: typeof n.projectName == "string" ? n.projectName : null,
		labels: Array.isArray(n.labels) ? n.labels.filter((e) => typeof e == "string") : [],
		authorRef: typeof n.authorRef == "string" ? n.authorRef : null,
		href: a
	};
}
async function Ou(e) {
	return (await Promise.all(e.map((e) => Du(e)))).filter((e) => e !== null);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/epic-detail-styles.ts
var ku = "ext-epics-detail-styles", Au = "\n.epic-detail {\n  max-width: 880px;\n  display: grid;\n  gap: 24px;\n  padding: 24px 0 48px;\n  font-family: var(--serif, \"Bitter\", Georgia, ui-serif, serif);\n}\n\n.epic-detail .epic-line,\n.epic-detail .epic-meta,\n.epic-detail .epic-progress,\n.epic-detail .epic-issues-list,\n.epic-detail .epic-actions,\n.epic-detail .epic-actions-heading,\n.epic-detail .epic-kbd-hint,\n.epic-detail .epic-section-count {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n}\n\n.epic-header { display: grid; gap: 6px; }\n\n.epic-overline {\n  margin: 0;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 10px;\n  letter-spacing: 0.18em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-title {\n  margin: 0;\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-weight: 600;\n  font-size: 28px;\n  letter-spacing: -0.01em;\n  line-height: 1.15;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  align-items: center;\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-pill {\n  padding: 1px 8px;\n  border: 1px solid currentColor;\n  text-transform: lowercase;\n}\n\n.epic-state-good { color: var(--ink-go, #087f6f); }\n.epic-state-warn { color: var(--ink-warn, #c2410c); }\n.epic-state-muted, .muted { color: var(--ink-faint, #888); }\n.epic-line.warn { color: var(--ink-warn, #c2410c); }\n\n.epic-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 1px 7px;\n  border-radius: 2px;\n  font-size: 11px;\n  line-height: 16px;\n  white-space: nowrap;\n}\n\n.epic-chip .chip-glyph {\n  font-size: 10px;\n}\n\n.epic-chip.tone-blue {\n  background: var(--chip-blue-bg, #e5edf7);\n  color: var(--chip-blue-ink, #1f3b6a);\n}\n.epic-chip.tone-teal {\n  background: var(--chip-teal-bg, #d8f0eb);\n  color: var(--chip-teal-ink, #0c5f54);\n}\n.epic-chip.tone-grey {\n  background: var(--chip-grey-bg, #ececea);\n  color: var(--chip-grey-ink, #4a4a45);\n}\n.epic-chip.compact {\n  padding: 0 6px;\n  font-size: 10.5px;\n}\n\n.epic-meta-time {\n  margin-left: auto;\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n/* \"Routed to\" panel — CUE Project ownership surfaced on the\n * detail page. Same paper-card aesthetic as the progress\n * panel above; owner chips carry classifier-glyph borders\n * so the visual vocabulary matches IssueDetail iter 59. */\n.epic-routed {\n  display: grid;\n  gap: 8px;\n  padding: 12px 14px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-routed-head {\n  display: flex;\n  align-items: baseline;\n  gap: 10px;\n}\n\n.epic-routed-label {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-project {\n  margin-left: auto;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  color: var(--accent-blue, #1d55a6);\n  text-decoration: none;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-project:hover {\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n\n/* iter 69 — inline Project picker on EpicDetail. Mirrors the\n * iter 68 IssueDetail select styling so both detail surfaces\n * read identically. */\n.epic-project-select {\n  width: 100%;\n  border: 1.5px solid var(--ink-rule, #d8d6cf);\n  background: var(--paper, #fffdf8);\n  color: var(--ink, #111);\n  padding: 8px 10px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 13px;\n  outline: none;\n  transition: border-color 120ms ease;\n}\n\n.epic-project-select:focus {\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-project-select:disabled {\n  cursor: wait;\n  opacity: 0.55;\n}\n\n.epic-routed-list {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-routed-owner {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 2px 8px;\n  border: 1px solid currentColor;\n  color: var(--ink, #111);\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-routed-owner .chip-glyph {\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-size: 12px;\n  line-height: 1;\n}\n\n.epic-routed-owner[data-author-kind=\"team\"]       { color: var(--accent-teal, #087f6f); }\n.epic-routed-owner[data-author-kind=\"human\"]      { color: var(--ink, #111); }\n.epic-routed-owner[data-author-kind=\"agent\"]      { color: #6b3fa0; }\n.epic-routed-owner[data-author-kind=\"bot\"]        { color: var(--accent-blue, #1d55a6); }\n.epic-routed-owner[data-author-kind=\"credential\"] { color: var(--accent-yellow, #c89300); }\n\n.epic-routed-source {\n  margin: 0;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-routed-source code {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  padding: 0 4px;\n  background: var(--paper-tint, #f2efe7);\n  color: var(--ink-soft, #2c2b28);\n}\n\n.epic-progress-head {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  align-items: baseline;\n  font-size: 12px;\n  color: var(--ink-faint, #6e6a62);\n}\n\n.epic-progress-stat {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 4px;\n}\n\n.epic-progress-stat strong {\n  font-weight: 600;\n  color: var(--ink, #1a1a1a);\n  font-size: 15px;\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-progress-stat .stat-of {\n  color: var(--ink-faint, #888);\n}\n\n.epic-progress-stat .stat-label {\n  color: var(--ink-faint, #6e6a62);\n  font-size: 11px;\n  letter-spacing: 0.02em;\n}\n\n.epic-progress-sep {\n  color: var(--ink-rule, #c8c6bf);\n  padding: 0 2px;\n}\n\n.epic-progress-bar {\n  height: 4px;\n  background: var(--ink-rule-soft, #ebe9e2);\n  border-radius: 2px;\n  overflow: hidden;\n}\n\n.epic-progress-fill {\n  height: 100%;\n  background: var(--ink-go, #087f6f);\n  transition: width 200ms ease;\n}\n\n.epic-body {\n  margin: 0;\n  font-size: 15.5px;\n  line-height: 1.6;\n  color: var(--ink, #1a1a1a);\n}\n\n.epic-body.muted {\n  padding: 12px 14px;\n  border: 1px dashed var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  color: var(--ink-faint, #888);\n  font-size: 12px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n}\n\n.epic-body.prose h1,\n.epic-body.prose h2,\n.epic-body.prose h3,\n.epic-body.prose h4 {\n  margin: 16px 0 6px;\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-weight: 600;\n  line-height: 1.2;\n  letter-spacing: -0.005em;\n}\n\n.epic-body.prose h1 { font-size: 20px; }\n.epic-body.prose h2 { font-size: 17px; }\n.epic-body.prose h3 { font-size: 15px; }\n\n.epic-body.prose p {\n  margin: 8px 0;\n}\n\n.epic-body.prose ul {\n  margin: 6px 0 6px 20px;\n  padding: 0;\n}\n\n.epic-body.prose li {\n  margin: 2px 0;\n}\n\n.epic-body.prose code {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  background: var(--ink-rule-soft, #efeee8);\n  padding: 0 4px;\n  border-radius: 2px;\n  font-size: 0.9em;\n}\n\n.epic-body.prose pre {\n  background: var(--surface-2, #f7f6f1);\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  padding: 10px 12px;\n  overflow-x: auto;\n  font-size: 12.5px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n}\n\n.epic-body.prose pre code {\n  background: transparent;\n  padding: 0;\n}\n\n.epic-section { display: grid; gap: 8px; }\n\n.epic-section-head {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding-bottom: 6px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-section h3 {\n  margin: 0;\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-weight: 600;\n  font-size: 13px;\n  letter-spacing: -0.005em;\n}\n\n.epic-section-count {\n  margin-left: auto;\n  font-size: 11px;\n  color: var(--ink-faint, #888);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-section-count [data-zero=\"true\"] { color: var(--ink-rule, #c8c6bf); }\n.epic-section-count .sep { padding: 0 2px; color: var(--ink-rule, #c8c6bf); }\n\n.epic-issues-list {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n}\n\n.epic-issue-row {\n  display: grid;\n  grid-template-columns: 18px 56px 1fr auto;\n  align-items: center;\n  gap: 10px;\n  padding: 6px 8px;\n  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);\n  font-size: 12.5px;\n  cursor: pointer;\n  outline: none;\n}\n\n.epic-issue-row:last-child { border-bottom: none; }\n\n.epic-issue-row:hover,\n.epic-issue-row.focused,\n.epic-issue-row:focus {\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-issue-row .row-state {\n  text-align: center;\n  font-size: 11px;\n}\n\n.epic-issue-row .row-state[data-state=\"OPEN\"],\n.epic-issue-row .row-state[data-state=\"REOPENED\"] {\n  color: var(--ink-go, #087f6f);\n}\n.epic-issue-row .row-state[data-state=\"CLOSED\"] {\n  color: var(--ink-faint, #888);\n}\n\n.epic-issue-row.state-closed {\n  color: var(--ink-faint, #888);\n}\n.epic-issue-row.state-closed .row-title {\n  text-decoration: line-through;\n  text-decoration-color: var(--ink-rule, #c8c6bf);\n}\n\n.epic-issue-row .row-number {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11.5px;\n  color: var(--ink-faint, #6e6a62);\n  font-variant-numeric: tabular-nums;\n}\n\n.epic-issue-row .row-title {\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-size: 13px;\n  color: var(--ink, #1a1a1a);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.epic-issue-row .row-trailing {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: nowrap;\n}\n\n.row-author {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.row-author[data-author-kind=\"agent\"] { color: var(--ink-go, #087f6f); }\n.row-author[data-author-kind=\"credential\"],\n.row-author[data-author-kind=\"bot\"] { color: var(--ink-warn, #c2410c); }\n\n.epic-kbd-hint {\n  margin: 0;\n  font-size: 10.5px;\n  color: var(--ink-faint, #888);\n}\n\n.epic-kbd-hint kbd {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 10px;\n  padding: 0 4px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  border-radius: 2px;\n  background: var(--surface-2, #faf9f5);\n}\n\n.epic-actions-section {\n  display: grid;\n  gap: 8px;\n  padding-top: 12px;\n  border-top: 1px solid var(--ink-rule-soft, #ebe9e2);\n}\n\n.epic-actions-heading {\n  margin: 0;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 10.5px;\n  letter-spacing: 0.16em;\n  text-transform: uppercase;\n  color: var(--ink-faint, #6e6a62);\n  font-weight: 500;\n}\n\n.epic-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.epic-actions button {\n  padding: 4px 12px;\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 11px;\n  border: 1px solid var(--ink-rule, #d8d6cf);\n  background: var(--surface-2, #faf9f5);\n  color: var(--ink, #1a1a1a);\n  cursor: pointer;\n  letter-spacing: 0.01em;\n}\n\n.epic-actions button:hover:not(:disabled) {\n  background: var(--ink, #1a1a1a);\n  color: var(--surface, #ffffff);\n  border-color: var(--ink, #1a1a1a);\n}\n\n.epic-actions button:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n\n.epic-comments {\n  display: grid;\n  gap: 8px;\n}\n\n.epic-comments-head {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  gap: 12px;\n  border-bottom: 1.5px solid var(--ink, #111);\n  padding-bottom: 4px;\n}\n\n.epic-comments-head h2 {\n  margin: 0;\n  font-family: var(--display, \"Bitter\", Georgia, ui-serif, serif);\n  font-size: 18px;\n}\n\n.epic-comments-count {\n  font-family: var(--mono, \"Monaspace Neon\", \"Monaspace Neon Var\", ui-monospace, monospace);\n  font-size: 13px;\n  color: var(--ink-faint, #68645c);\n  font-weight: normal;\n}\n";
function ju() {
	if (typeof document > "u" || document.getElementById(ku)) return;
	let e = document.createElement("style");
	e.id = ku, e.textContent = Au, document.head.appendChild(e);
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/CustomElementHost.vue
var Mu = /* @__PURE__ */ xu(/* @__PURE__ */ Ar({
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
		Gr(i), Sr(() => [
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
async function Nu(e) {
	return { ownerRefs: await vl(e) };
}
//#endregion
//#region ../extensions/first-party/ext_epics/ui/src/EpicDetail.vue?vue&type=script&setup=true&lang.ts
var Pu = ["data-state", "data-epic-id"], Fu = {
	key: 0,
	class: "epic-line muted"
}, Iu = {
	key: 1,
	class: "epic-line warn"
}, Lu = {
	key: 2,
	class: "epic-line warn"
}, Ru = { class: "epic-header" }, zu = { class: "epic-title" }, Bu = { class: "epic-meta" }, Vu = ["title"], Hu = {
	key: 1,
	class: "epic-chip tone-grey",
	title: "Owner"
}, Uu = {
	key: 2,
	class: "epic-chip tone-grey"
}, Wu = {
	key: 3,
	class: "epic-meta-time"
}, Gu = {
	key: 0,
	class: "epic-progress",
	"data-smoke": "epic-progress"
}, Ku = { class: "epic-progress-head" }, qu = { class: "epic-progress-stat" }, Ju = { class: "stat-of" }, Yu = { class: "epic-progress-stat" }, Xu = {
	key: 0,
	class: "epic-progress-sep"
}, Zu = {
	key: 1,
	class: "epic-progress-stat"
}, Qu = ["aria-valuenow"], $u = {
	class: "epic-routed",
	"data-smoke": "epic-project-picker"
}, ed = { class: "epic-routed-head" }, td = ["href", "title"], nd = ["value", "disabled"], rd = ["value"], id = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, ad = {
	key: 1,
	class: "epic-routed",
	"data-smoke": "epic-project-owners"
}, od = { class: "epic-routed-head" }, sd = ["href", "title"], cd = { class: "epic-routed-list" }, ld = ["data-author-kind", "title"], ud = { class: "chip-glyph" }, dd = { class: "epic-routed-source" }, fd = ["data-epic-id", "innerHTML"], pd = {
	key: 3,
	class: "epic-body muted"
}, md = {
	class: "epic-section",
	"data-smoke": "epic-issues"
}, hd = { class: "epic-section-head" }, gd = { class: "epic-section-count" }, _d = ["data-zero"], vd = ["data-zero"], yd = {
	key: 0,
	class: "epic-line muted"
}, bd = {
	key: 1,
	class: "epic-issues-list",
	"data-smoke": "epic-issues-list"
}, xd = [
	"onClick",
	"onKeydown",
	"onFocus"
], Sd = ["data-state"], Cd = { key: 0 }, wd = { key: 1 }, Td = { class: "row-number" }, Ed = { class: "row-title" }, Dd = { class: "row-trailing" }, Od = ["title"], kd = ["data-author-kind", "title"], Ad = { class: "author-glyph" }, jd = {
	key: 2,
	class: "epic-kbd-hint muted"
}, Md = { class: "epic-actions-section" }, Nd = { class: "epic-actions" }, Pd = ["disabled", "onClick"], Fd = {
	key: 0,
	class: "epic-line warn",
	role: "alert"
}, Id = { class: "epic-comments-head" }, Ld = {
	key: 0,
	class: "epic-comments-count"
}, Rd = /* @__PURE__ */ Ar({
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
		], r = /* @__PURE__ */ z("idle"), i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(null), s = /* @__PURE__ */ z(t.epic ?? null), c = /* @__PURE__ */ z(null), l = /* @__PURE__ */ z([]), u = /* @__PURE__ */ z(null), d = X(() => t.client ?? t.comtryaClient), f = X(() => t.workspaceId ?? t.routeParams?.params?.workspaceId ?? ql()), p = X(() => t.id ?? t.routeParams?.params?.id ?? ""), m = X(() => t.epic ? Yl(t.epic) : `comtrya://epic/${p.value}`), h = X(() => s.value ?? t.epic ?? null), g = X(() => Ql(h.value?.state)), _ = X(() => n.filter((e) => e !== h.value?.state)), v = X(() => (c.value?.issuesOpen ?? 0) + (c.value?.issuesClosed ?? 0)), y = X(() => Math.max(0, Math.min(100, c.value?.percentComplete ?? 0))), ee = X(() => l.value.filter((e) => e.state !== "CLOSED").length), te = X(() => l.value.filter((e) => e.state === "CLOSED").length), ne = X(() => ol(h.value?.bodyMarkdown ?? "", { workspaceId: f.value })), re = X(() => d.value && !!p.value), b = X(() => {
			let e = h.value?.ownerRef;
			return e ? e.startsWith("comtrya://user/") ? e.slice(15) : e.startsWith("comtrya://agent/") ? `${e.slice(16)} (agent)` : e : null;
		}), x = X(() => ge(h.value?.createdAt)), S = /* @__PURE__ */ z(null);
		function ie(e) {
			let t = e.detail;
			t && typeof t.count == "number" && (S.value = t.count);
		}
		let ae = /* @__PURE__ */ z(null), oe = X(() => ae.value?.ownerRefs ?? []);
		Sr(() => h.value?.projectName ?? "", async (e) => {
			if (!e) {
				ae.value = null;
				return;
			}
			try {
				ae.value = await Nu(e);
			} catch {
				ae.value = null;
			}
		}, { immediate: !0 });
		let se = ml, C = /* @__PURE__ */ z([]), ce = /* @__PURE__ */ z("idle"), le = /* @__PURE__ */ z(null);
		Gr(async () => {
			try {
				C.value = await _l();
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
				s.value = await Hl(n.id, r);
			} catch (e) {
				s.value = {
					...n,
					projectName: i
				}, t.value = i ?? "", le.value = e instanceof Error ? e.message : String(e);
			} finally {
				ce.value = "idle";
			}
		}
		Gr(() => {
			ju(), fe();
		});
		let de = (e) => {
			if (l.value.length === 0) return;
			let t = u.value === null ? 0 : Math.max(0, Math.min(l.value.length - 1, u.value + e));
			u.value = t, rr(() => he(t));
		};
		vs({
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
				t && (e.preventDefault(), me(t));
			}
		}), Sr(() => [
			d.value,
			t.epic,
			f.value,
			p.value
		], () => void fe());
		async function fe() {
			if (t.epic) {
				s.value = t.epic, r.value = "ready", a.value = null, await w();
				return;
			}
			if (!re.value || !d.value) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = "epic-detail: missing params";
				return;
			}
			r.value = "loading", a.value = null;
			try {
				s.value = await Il(d.value, m.value), r.value = s.value ? "ready" : "empty", await w();
			} catch (e) {
				s.value = null, c.value = null, l.value = [], r.value = "error", a.value = e instanceof Error ? e.message : String(e);
			}
		}
		async function w() {
			if (!d.value || !h.value) {
				c.value = null, l.value = [];
				return;
			}
			let e = Yl(h.value), [t, n] = await Promise.allSettled([Rl(d.value, e), zl(d.value, e)]);
			c.value = t.status === "fulfilled" ? t.value : null, l.value = await Ou(n.status === "fulfilled" ? n.value : []), l.value.sort((e, t) => {
				let n = e.state !== "CLOSED";
				return n === (t.state !== "CLOSED") ? (t.number ?? 0) - (e.number ?? 0) : n ? -1 : 1;
			});
		}
		async function T(e) {
			if (!(!d.value || !h.value)) {
				i.value = "submitting", o.value = null;
				try {
					s.value = await Bl(d.value, h.value.id, e), await w();
				} catch (e) {
					o.value = e instanceof Error ? e.message : String(e);
				} finally {
					i.value = "idle";
				}
			}
		}
		function pe(e) {
			return e.toLowerCase().replace("_", " ");
		}
		function me(e) {
			e.href && window.location.assign(e.href);
		}
		function he(e) {
			let t = document.querySelector(".epic-detail [data-smoke=\"epic-issues-list\"]");
			t && t.querySelectorAll(".epic-issue-row")[e]?.focus();
		}
		function ge(e) {
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
		}, [r.value === "loading" ? (W(), G("p", Fu, "Loading epic")) : r.value === "error" ? (W(), G("p", Iu, N(a.value), 1)) : h.value ? (W(), G(U, { key: 3 }, [
			K("header", Ru, [
				n[2] ||= K("p", { class: "epic-overline" }, "epic", -1),
				K("h1", zu, N(h.value.title), 1),
				K("div", Bu, [
					K("span", { class: rt(["epic-pill", g.value.className]) }, N(g.value.label), 3),
					h.value.projectName ? (W(), G("span", {
						key: 0,
						class: "epic-chip tone-blue",
						title: `Scoped to project ${h.value.projectName}`
					}, [n[0] ||= K("span", { class: "chip-glyph" }, "◇", -1), q(N(h.value.projectName), 1)], 8, Vu)) : J("", !0),
					(W(!0), G(U, null, ti(h.value.labels, (t) => (W(), Ca(B(Cl), {
						key: t,
						name: t,
						catalog: e.labelCatalog
					}, null, 8, ["name", "catalog"]))), 128)),
					b.value ? (W(), G("span", Hu, [n[1] ||= K("span", { class: "chip-glyph" }, "@", -1), q(N(b.value), 1)])) : J("", !0),
					h.value.targetDate ? (W(), G("span", Uu, " target " + N(h.value.targetDate), 1)) : J("", !0),
					x.value ? (W(), G("span", Wu, "opened " + N(x.value), 1)) : J("", !0)
				])
			]),
			c.value || l.value.length > 0 ? (W(), G("section", Gu, [K("div", Ku, [
				K("span", qu, [
					K("strong", null, N(c.value?.issuesClosed ?? te.value), 1),
					K("span", Ju, "/ " + N(v.value || l.value.length), 1),
					n[3] ||= K("span", { class: "stat-label" }, "closed", -1)
				]),
				n[6] ||= K("span", { class: "epic-progress-sep" }, "·", -1),
				K("span", Yu, [K("strong", null, N(y.value), 1), n[4] ||= K("span", { class: "stat-label" }, "% complete", -1)]),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (W(), G("span", Xu, "·")) : J("", !0),
				(c.value?.childEpicsOpen ?? 0) + (c.value?.childEpicsClosed ?? 0) > 0 ? (W(), G("span", Zu, [K("strong", null, N(c.value?.childEpicsOpen ?? 0), 1), n[5] ||= K("span", { class: "stat-label" }, "child epics open", -1)])) : J("", !0)
			]), K("div", {
				class: "epic-progress-bar",
				"aria-valuenow": y.value,
				"aria-valuemin": "0",
				"aria-valuemax": "100"
			}, [K("div", {
				class: "epic-progress-fill",
				style: Qe({ width: y.value + "%" })
			}, null, 4)], 8, Qu)])) : J("", !0),
			K("section", $u, [
				K("header", ed, [n[7] ||= K("span", { class: "epic-routed-label" }, "Project", -1), h.value.projectName ? (W(), G("a", {
					key: 0,
					href: `/x/epics/?project=${encodeURIComponent(h.value.projectName)}`,
					class: "epic-routed-project",
					title: `Filter epics to project ${h.value.projectName}`
				}, "◇ " + N(h.value.projectName), 9, td)) : J("", !0)]),
				K("select", {
					class: "epic-project-select",
					"data-smoke": "epic-project-select",
					value: h.value.projectName ?? "",
					disabled: ce.value === "submitting",
					onChange: ue
				}, [n[8] ||= K("option", { value: "" }, "— no project —", -1), (W(!0), G(U, null, ti(C.value, (e) => (W(), G("option", {
					key: e.name,
					value: e.name ?? ""
				}, N(e.name), 9, rd))), 128))], 40, nd),
				le.value ? (W(), G("p", id, N(le.value), 1)) : J("", !0),
				n[9] ||= K("p", { class: "epic-routed-source" }, [
					q(" Stamps "),
					K("code", null, "projectName"),
					q(" on this epic. Lights up workspace per-Project counts. ")
				], -1)
			]),
			h.value.projectName && oe.value.length > 0 ? (W(), G("section", ad, [
				K("header", od, [n[10] ||= K("span", { class: "epic-routed-label" }, "Routed to", -1), K("a", {
					href: `/x/epics/?project=${encodeURIComponent(h.value.projectName)}`,
					class: "epic-routed-project",
					title: `Filter epics to project ${h.value.projectName}`
				}, "◇ " + N(h.value.projectName), 9, sd)]),
				K("ul", cd, [(W(!0), G(U, null, ti(oe.value, (e) => (W(), G("li", {
					key: e,
					class: "epic-routed-owner",
					"data-author-kind": B(se)(e).kind,
					title: e
				}, [K("span", ud, N(B(se)(e).glyph), 1), q(" " + N(B(se)(e).label), 1)], 8, ld))), 128))]),
				K("p", dd, [
					n[11] ||= q(" From ", -1),
					n[12] ||= K("code", null, "package comtrya", -1),
					q(" · projects." + N(h.value.projectName) + ".owners ", 1)
				])
			])) : J("", !0),
			ne.value ? (W(), G("article", {
				key: 2,
				class: "epic-body prose",
				"data-epic-id": h.value.id,
				"data-smoke": "epic-detail-main",
				innerHTML: ne.value
			}, null, 8, fd)) : (W(), G("p", pd, "No description yet.")),
			K("section", md, [
				K("header", hd, [n[16] ||= K("h3", null, "Issues in this epic", -1), K("span", gd, [
					K("span", { "data-zero": ee.value === 0 }, N(ee.value), 9, _d),
					n[13] ||= q(" open ", -1),
					n[14] ||= K("span", { class: "sep" }, "·", -1),
					K("span", { "data-zero": te.value === 0 }, N(te.value), 9, vd),
					n[15] ||= q(" closed ", -1)
				])]),
				l.value.length === 0 ? (W(), G("p", yd, " No issues linked yet. Link issues via the issue's \"part of epic\" relation. ")) : (W(), G("ul", bd, [(W(!0), G(U, null, ti(l.value, (e, t) => (W(), G("li", {
					key: e.ref,
					class: rt(["epic-issue-row", [`state-${e.state.toLowerCase()}`, { focused: u.value === t }]]),
					tabindex: "0",
					onClick: (t) => me(e),
					onKeydown: [ss(as((t) => me(e), ["prevent"]), ["enter"]), ss(as((t) => me(e), ["prevent"]), ["space"])],
					onFocus: (e) => u.value = t
				}, [
					K("span", {
						class: "row-state",
						"data-state": e.state
					}, [e.state === "CLOSED" ? (W(), G("span", Cd, "●")) : (W(), G("span", wd, "○"))], 8, Sd),
					K("span", Td, "#" + N(e.number ?? "—"), 1),
					K("span", Ed, N(e.title), 1),
					K("span", Dd, [
						e.projectName ? (W(), G("span", {
							key: 0,
							class: "epic-chip tone-blue compact",
							title: e.projectName
						}, [n[17] ||= K("span", { class: "chip-glyph" }, "◇", -1), q(N(e.projectName), 1)], 8, Od)) : J("", !0),
						(W(!0), G(U, null, ti(e.labels, (e) => (W(), Ca(B(Cl), {
							key: e,
							name: e
						}, null, 8, ["name"]))), 128)),
						e.authorRef ? (W(), G("span", {
							key: 1,
							class: "row-author",
							"data-author-kind": B(ml)(e.authorRef).kind,
							title: e.authorRef
						}, [K("span", Ad, N(B(ml)(e.authorRef).glyph), 1), q(" " + N(B(ml)(e.authorRef).label), 1)], 8, kd)) : J("", !0)
					])
				], 42, xd))), 128))])),
				l.value.length > 0 ? (W(), G("p", jd, [...n[18] ||= [
					K("kbd", null, "j", -1),
					q(" / ", -1),
					K("kbd", null, "k", -1),
					q(" move · ", -1),
					K("kbd", null, "↵", -1),
					q(" open ", -1)
				]])) : J("", !0)
			]),
			K("section", Md, [
				n[19] ||= K("h3", { class: "epic-actions-heading" }, "Change state", -1),
				K("div", Nd, [(W(!0), G(U, null, ti(_.value, (e) => (W(), G("button", {
					key: e,
					type: "button",
					disabled: i.value === "submitting",
					onClick: (t) => T(e)
				}, " mark " + N(pe(e)), 9, Pd))), 128))]),
				o.value ? (W(), G("p", Fd, N(o.value), 1)) : J("", !0)
			]),
			K("section", {
				class: "epic-comments",
				onCommentThreadUpdate: ie
			}, [K("header", Id, [K("h2", null, [n[20] ||= q(" Discussion", -1), S.value === null ? J("", !0) : (W(), G("span", Ld, " (" + N(S.value) + ")", 1))])]), Oa(Mu, {
				tag: "comtrya-comment-thread",
				attributes: { target: B(Yl)(h.value) },
				properties: {
					target: B(Yl)(h.value),
					comtryaClient: d.value
				}
			}, null, 8, ["attributes", "properties"])], 32)
		], 64)) : (W(), G("p", Lu, " No epic " + N(p.value || "?") + " in " + N(f.value), 1))], 8, Pu));
	}
}), zd = ["data-state"], Bd = { class: "epics-list-header" }, Vd = ["href"], Hd = {
	key: 0,
	class: "epics-controls"
}, Ud = {
	class: "epics-filter-row",
	role: "tablist",
	"aria-label": "Filter epics by state"
}, Wd = ["aria-selected", "onClick"], Gd = { class: "count" }, Kd = { class: "epics-search" }, qd = {
	key: 1,
	class: "epics-query-chips",
	"data-smoke": "epics-query-chips",
	"aria-label": "Parsed search filters"
}, Jd = ["title"], Yd = {
	key: 2,
	class: "epics-owner-filter",
	"data-smoke": "epics-owner-filter"
}, Xd = ["title"], Zd = {
	key: 3,
	class: "epics-project-filter",
	"data-smoke": "epics-project-filter"
}, Qd = ["title"], $d = ["data-busy"], ef = ["placeholder", "disabled"], tf = {
	key: 0,
	class: "quick-add-status"
}, nf = ["title"], rf = {
	key: 4,
	class: "epic-line warn",
	role: "alert"
}, af = {
	key: 5,
	class: "epics-bulk-bar",
	"data-smoke": "epics-bulk-bar"
}, of = { class: "count" }, sf = { class: "bulk-reproject" }, cf = ["disabled"], lf = ["value"], uf = ["disabled"], df = {
	key: 6,
	class: "epic-line warn",
	role: "alert"
}, ff = {
	key: 7,
	class: "epic-line muted"
}, pf = {
	key: 8,
	class: "epic-line warn"
}, mf = {
	key: 9,
	class: "epic-line muted"
}, hf = {
	key: 10,
	class: "epic-line muted"
}, gf = {
	key: 11,
	class: "epics-list-items",
	role: "listbox",
	"aria-label": "Epic list"
}, _f = ["aria-selected", "onMouseenter"], vf = {
	key: 12,
	class: "epics-list-foot"
}, yf = /* @__PURE__ */ xu(/* @__PURE__ */ Ar({
	__name: "EpicsList",
	props: {
		client: { type: null },
		comtryaClient: { type: null },
		epics: { type: [Array, null] },
		workspaceId: {
			default: ql(),
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
		]), i = /* @__PURE__ */ z("idle"), a = /* @__PURE__ */ z(null), o = /* @__PURE__ */ z(t.epics ?? []), s = /* @__PURE__ */ z("ALL"), c = /* @__PURE__ */ z(""), l = /* @__PURE__ */ z(""), u = /* @__PURE__ */ z(""), d = X(() => {
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
		}, m = X(() => sl(c.value, f)), h = X(() => {
			for (let e of m.value.filters.is ?? []) {
				let t = p[e.toLowerCase()];
				if (t) return t;
			}
			return s.value;
		}), g = X(() => {
			for (let e of m.value.filters.owner ?? []) if (e.startsWith("comtrya://")) return e;
			return l.value;
		}), _ = X(() => {
			if (t.projectName) return "";
			for (let e of m.value.filters.project ?? []) if (e.trim()) return e.trim();
			return u.value;
		}), v = X(() => {
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
		}), y = X(() => {
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
				label: `→ ${b(t)}`,
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
		function b(e) {
			return e.replace(/^comtrya:\/\/[a-z]+\//, "");
		}
		let x = X(() => {
			let e = {
				PLANNED: 0,
				IN_PROGRESS: 0,
				DONE: 0,
				CANCELED: 0,
				ALL: d.value.length
			};
			for (let t of d.value) t.state === "PLANNED" ? e.PLANNED += 1 : t.state === "IN_PROGRESS" ? e.IN_PROGRESS += 1 : t.state === "DONE" ? e.DONE += 1 : t.state === "CANCELED" && (e.CANCELED += 1);
			return e;
		}), S = X(() => t.client ?? t.comtryaClient), ie = X(() => {
			let e = Zl(t.workspaceId);
			return t.projectName ? `${e}&projectName=${encodeURIComponent(t.projectName)}` : e;
		}), ae = /* @__PURE__ */ z(""), oe = /* @__PURE__ */ z(!1), se = /* @__PURE__ */ z(null), C = X(() => t.projectName ?? _.value ?? null), ce = X(() => {
			let e = C.value;
			return e ? `New epic in ${e}…` : "New epic…";
		});
		function le() {
			document.querySelector("[data-smoke=\"epics-quick-add\"]")?.focus();
		}
		function ue(e) {
			e.preventDefault(), ae.value = "", se.value = null, e.target?.blur();
		}
		async function de() {
			let e = ae.value.trim();
			if (!(!e || oe.value)) {
				oe.value = !0, se.value = null;
				try {
					let n = await Vl(S.value, {
						workspaceId: t.workspaceId,
						title: e,
						bodyMarkdown: "",
						projectName: C.value
					});
					o.value.some((e) => e.id === n.id) || (o.value = [n, ...o.value]), ae.value = "", i.value = "ready", Se(), rr(le);
				} catch (e) {
					se.value = e instanceof Error ? e.message : String(e);
				} finally {
					oe.value = !1;
				}
			}
		}
		let fe = /* @__PURE__ */ z(0), w = /* @__PURE__ */ z(/* @__PURE__ */ new Set()), T = /* @__PURE__ */ z(!1), pe = /* @__PURE__ */ z(null), me = /* @__PURE__ */ z([]);
		Gr(async () => {
			try {
				me.value = await _l();
			} catch {
				me.value = [];
			}
		}), Sr(v, (e) => {
			fe.value >= e.length && (fe.value = Math.max(0, e.length - 1));
		});
		function he(e) {
			let t = new Set(w.value);
			t.has(e) ? t.delete(e) : t.add(e), w.value = t;
		}
		function ge() {
			w.value = /* @__PURE__ */ new Set(), pe.value = null;
		}
		async function _e(e) {
			if (w.value.size === 0 || T.value) return;
			let t = Array.from(w.value);
			T.value = !0, pe.value = null;
			try {
				let n = await Promise.allSettled(t.map((t) => Hl(t, e))), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
				if (n.forEach((e, n) => {
					let a = t[n];
					e.status === "fulfilled" ? r.set(a, e.value) : i.add(a);
				}), o.value = o.value.map((e) => r.get(e.id) ?? e), w.value = i, i.size > 0) {
					let n = e ?? "(no project)";
					pe.value = `${i.size} of ${t.length} reassignments to ${n} failed; retry the remaining selection.`;
				}
			} catch (e) {
				pe.value = e instanceof Error ? e.message : String(e);
			} finally {
				T.value = !1;
			}
		}
		function ve(e) {
			let t = e.target;
			if (!t) return;
			let n = t.value, r = n === "__NONE__" ? null : n || null;
			t.value = "", n !== "" && _e(r);
		}
		vs({
			c: (e) => {
				e.preventDefault(), le();
			},
			j: (e) => {
				v.value.length !== 0 && (e.preventDefault(), fe.value = Math.min(v.value.length - 1, fe.value + 1));
			},
			k: (e) => {
				v.value.length !== 0 && (e.preventDefault(), fe.value = Math.max(0, fe.value - 1));
			},
			" ": (e) => {
				let t = v.value[fe.value];
				t && (e.preventDefault(), he(t.id));
			},
			Escape: (e) => {
				w.value.size !== 0 && (e.preventDefault(), ge());
			}
		});
		function ye() {
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
		function E() {
			if (typeof window > "u") return;
			let e = new URLSearchParams(window.location.search);
			s.value === "ALL" ? e.delete("state") : e.set("state", s.value), l.value ? e.set("owner", l.value) : e.delete("owner"), u.value && !t.projectName ? e.set("project", u.value) : e.delete("project");
			let n = c.value.trim();
			n ? e.set("q", n) : e.delete("q");
			let r = e.toString(), i = `${window.location.pathname}${r ? `?${r}` : ""}${window.location.hash}`;
			i !== `${window.location.pathname}${window.location.search}${window.location.hash}` && window.history.replaceState(window.history.state, "", i);
		}
		let be = !1;
		function xe() {
			be = !0, ye(), rr(() => {
				be = !1;
			});
		}
		Gr(() => {
			be = !0, ye(), be = !1, Se(), window.addEventListener("popstate", xe);
		}), Yr(() => {
			window.removeEventListener("popstate", xe);
		}), Sr(() => [
			S.value,
			t.epics,
			t.workspaceId,
			t.state
		], () => void Se()), Sr([
			s,
			l,
			u,
			c
		], () => {
			be || E();
		});
		async function Se() {
			if (t.epics) {
				o.value = t.epics, i.value = t.epics.length > 0 ? "ready" : "empty", a.value = null;
				return;
			}
			if (!S.value) {
				o.value = [], i.value = "error", a.value = "epics: no client";
				return;
			}
			i.value = "loading", a.value = null;
			try {
				o.value = await Ll(S.value, {
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
			K("header", Bd, [K("h3", null, N(e.title), 1), e.showNewLink ? (W(), G("a", {
				key: 0,
				href: ie.value
			}, "+ new", 8, Vd)) : J("", !0)]),
			d.value.length > 0 ? (W(), G("div", Hd, [K("div", Ud, [(W(), G(U, null, ti(n, (e) => K("button", {
				key: e.id,
				type: "button",
				role: "tab",
				"aria-selected": s.value === e.id,
				class: rt(["epics-filter", { active: s.value === e.id }]),
				onClick: (t) => s.value = e.id
			}, [K("span", null, N(e.label), 1), K("span", Gd, N(x.value[e.id]), 1)], 10, Wd)), 64))]), K("label", Kd, [gr(K("input", {
				"data-epics-search": "",
				"onUpdate:modelValue": o[0] ||= (e) => c.value = e,
				type: "search",
				placeholder: "Filter — try is:in-progress · project:<name> · owner:<urn> · text",
				autocomplete: "off"
			}, null, 512), [[$o, c.value]])])])) : J("", !0),
			y.value.length > 0 ? (W(), G("div", qd, [(W(!0), G(U, null, ti(y.value, (e) => (W(), G("span", {
				key: `${e.key}:${e.value || "unknown"}`,
				class: rt(["query-chip", `tone-${e.tone}`]),
				title: e.tone === "unknown" ? `Unknown filter key: ${e.key}` : e.value
			}, N(e.label), 11, Jd))), 128)), o[2] ||= K("span", { class: "query-chips-hint" }, [
				q(" syntax: "),
				K("code", null, "is:in-progress"),
				q(" · "),
				K("code", null, "project:<name>"),
				q(" · "),
				K("code", null, "owner:<urn>")
			], -1)])) : J("", !0),
			l.value ? (W(), G("div", Yd, [
				o[3] ||= K("span", { class: "prefix" }, "owner", -1),
				K("span", {
					class: "active-chip",
					title: l.value
				}, N(b(l.value)), 9, Xd),
				K("button", {
					type: "button",
					class: "clear",
					onClick: te,
					"aria-label": "Clear owner filter"
				}, "clear ✕")
			])) : J("", !0),
			u.value && !t.projectName ? (W(), G("div", Zd, [
				o[5] ||= K("span", { class: "prefix" }, "project", -1),
				K("span", {
					class: "active-chip",
					title: `Scoped to project ${u.value}`
				}, [o[4] ||= K("span", { class: "project-glyph" }, "◇", -1), q(" " + N(u.value), 1)], 8, Qd),
				K("button", {
					type: "button",
					class: "clear",
					onClick: re,
					"aria-label": "Clear project filter"
				}, "clear ✕")
			])) : J("", !0),
			K("form", {
				class: "epics-quick-add",
				"data-busy": oe.value ? "true" : "false",
				onSubmit: as(de, ["prevent"])
			}, [
				o[6] ||= K("span", {
					class: "quick-add-glyph",
					"aria-hidden": "true"
				}, "+", -1),
				gr(K("input", {
					"onUpdate:modelValue": o[1] ||= (e) => ae.value = e,
					"data-smoke": "epics-quick-add",
					type: "text",
					autocomplete: "off",
					placeholder: ce.value,
					disabled: oe.value,
					onKeydown: ss(ue, ["esc"])
				}, null, 40, ef), [[$o, ae.value]]),
				oe.value ? (W(), G("span", tf, "creating…")) : C.value ? (W(), G("span", {
					key: 1,
					class: "quick-add-chip tone-blue",
					title: `Stamps projectName = ${C.value} on create`
				}, "◇ " + N(C.value), 9, nf)) : J("", !0),
				o[7] ||= K("span", { class: "quick-add-hint" }, [
					K("kbd", null, "↵"),
					q(" create · "),
					K("kbd", null, "esc"),
					q(" clear · "),
					K("kbd", null, "c"),
					q(" focus ")
				], -1)
			], 40, $d),
			se.value ? (W(), G("p", rf, N(se.value), 1)) : J("", !0),
			w.value.size > 0 ? (W(), G("div", af, [
				K("span", of, N(w.value.size) + " selected", 1),
				K("label", sf, [o[10] ||= K("span", { class: "bulk-reproject-label" }, "reproject →", -1), K("select", {
					class: "bulk-reproject-select",
					"data-smoke": "epics-bulk-reproject",
					disabled: T.value,
					onChange: ve
				}, [
					o[8] ||= K("option", {
						value: "",
						disabled: "",
						selected: ""
					}, "pick project…", -1),
					o[9] ||= K("option", { value: "__NONE__" }, "— no project —", -1),
					(W(!0), G(U, null, ti(me.value, (e) => (W(), G("option", {
						key: e.name,
						value: e.name ?? ""
					}, "◇ " + N(e.name), 9, lf))), 128))
				], 40, cf)]),
				K("button", {
					type: "button",
					class: "bulk-clear",
					disabled: T.value,
					onClick: ge
				}, [...o[11] ||= [q("clear ", -1), K("kbd", null, "esc", -1)]], 8, uf),
				o[12] ||= K("span", { class: "hint" }, [K("kbd", null, "space"), q(" toggle row ")], -1)
			])) : J("", !0),
			pe.value ? (W(), G("p", df, N(pe.value), 1)) : J("", !0),
			i.value === "loading" ? (W(), G("p", ff, "Loading epics")) : i.value === "error" ? (W(), G("p", pf, N(a.value), 1)) : d.value.length === 0 ? (W(), G("p", mf, "No epics yet.")) : v.value.length === 0 ? (W(), G("p", hf, " No " + N(s.value.toLowerCase().replace("_", " ")) + " epics in scope. ", 1)) : (W(), G("ul", gf, [(W(!0), G(U, null, ti(v.value, (e, t) => (W(), G("li", {
				key: e.id,
				class: rt({
					focused: t === fe.value,
					selected: w.value.has(e.id)
				}),
				"aria-selected": w.value.has(e.id),
				role: "option",
				onMouseenter: (e) => fe.value = t
			}, [Oa(Su, {
				epic: e,
				"resource-ref": B(Yl)(e),
				client: S.value,
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
			])], 42, _f))), 128))])),
			v.value.length > 0 ? (W(), G("footer", vf, [...o[13] ||= [
				K("kbd", null, "j", -1),
				q(),
				K("kbd", null, "k", -1),
				q(" navigate · ", -1),
				K("kbd", null, "space", -1),
				q(" select · ", -1),
				K("kbd", null, "c", -1),
				q(" create ", -1)
			]])) : J("", !0)
		], 8, zd));
	}
}), [["styles", [".epics-list[data-v-25a0998d]{gap:8px;display:grid}.epics-list-header[data-v-25a0998d]{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.epics-list-header h3[data-v-25a0998d]{font-family:var(--font-serif,system-ui);margin:0;font-size:14px}.epics-list-header a[data-v-25a0998d],.epic-line[data-v-25a0998d]{font-family:var(--font-mono,monospace);font-size:12px}.epics-list-header a[data-v-25a0998d]{color:var(--fg-3,#ffffff85);text-decoration:none}.epics-controls[data-v-25a0998d]{flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:4px;display:flex}.epics-search[data-v-25a0998d]{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);flex:280px;align-items:center;gap:6px;padding:0 8px;display:inline-flex}.epics-search input[data-v-25a0998d]{font-family:var(--font-mono,monospace);color:inherit;background:0 0;border:0;outline:none;flex:1;min-width:0;padding:6px 0;font-size:12px}.epics-search input[data-v-25a0998d]::placeholder{color:var(--fg-3,#ffffff85)}.epics-query-chips[data-v-25a0998d]{font-family:var(--font-mono,monospace);flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:4px;font-size:11px;display:flex}.epics-query-chips .query-chip[data-v-25a0998d]{letter-spacing:.02em;white-space:nowrap;border:.5px solid;align-items:center;padding:1px 7px;display:inline-flex}.epics-query-chips .query-chip.tone-is[data-v-25a0998d]{color:var(--accent-teal,#087f6f)}.epics-query-chips .query-chip.tone-owner[data-v-25a0998d]{color:var(--fg,#fffffff0)}.epics-query-chips .query-chip.tone-project[data-v-25a0998d]{color:var(--accent-blue,#1d55a6)}.epics-query-chips .query-chip.tone-unknown[data-v-25a0998d]{color:var(--accent-yellow,#c89300);border-style:dashed}.epics-query-chips .query-chips-hint[data-v-25a0998d]{color:var(--fg-3,#ffffff85);letter-spacing:0;margin-left:4px}.epics-query-chips .query-chips-hint code[data-v-25a0998d]{font-family:var(--font-mono,monospace);background:var(--bg-2,#0e1014);color:var(--fg-2,#ffffffbd);padding:0 4px;font-size:11px}.epics-filter-row[data-v-25a0998d]{border:.5px solid var(--fg,#fffffff0);flex-wrap:wrap;align-self:flex-start;gap:0;display:inline-flex}.epics-filter[data-v-25a0998d]{color:inherit;cursor:pointer;font-family:var(--font-mono,monospace);background:0 0;border:0;align-items:center;gap:6px;padding:4px 9px;font-size:11px;display:inline-flex}.epics-filter[data-v-25a0998d]:not(:last-child){border-right:.5px solid var(--line,#ffffff12)}.epics-filter.active[data-v-25a0998d]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.epics-filter .count[data-v-25a0998d]{color:var(--fg-3,#ffffff85);font-variant-numeric:tabular-nums}.epics-filter.active .count[data-v-25a0998d]{color:var(--bg-2,#0e1014)}.epics-owner-filter[data-v-25a0998d]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-owner-filter .prefix[data-v-25a0998d]{color:var(--fg-3,#ffffff85);letter-spacing:.04em;text-transform:lowercase}.epics-owner-filter .active-chip[data-v-25a0998d]{border:.5px solid var(--fg,#fffffff0);color:var(--fg,#fffffff0);padding:0 5px}.epics-owner-filter .clear[data-v-25a0998d]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-owner-filter .clear[data-v-25a0998d]:hover{color:var(--fg,#fffffff0)}.epics-project-filter[data-v-25a0998d]{border:.5px solid var(--line,#ffffff12);background:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);align-self:flex-start;align-items:center;gap:8px;padding:6px 10px;font-size:11px;display:inline-flex}.epics-project-filter .prefix[data-v-25a0998d]{color:var(--fg-3,#ffffff85);letter-spacing:.04em;text-transform:lowercase}.epics-project-filter .active-chip[data-v-25a0998d]{color:var(--accent-blue,#1d55a6);border:.5px solid;align-items:center;gap:4px;padding:0 5px;display:inline-flex}.epics-project-filter .project-glyph[data-v-25a0998d]{font-size:10px}.epics-project-filter .clear[data-v-25a0998d]{color:var(--fg-3,#ffffff85);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 2px;font-size:10.5px}.epics-project-filter .clear[data-v-25a0998d]:hover{color:var(--fg,#fffffff0)}.epics-quick-add[data-v-25a0998d]{border:.5px solid var(--line,#ffffff12);background:var(--bg,#0a0b0e);align-items:center;gap:8px;padding:6px 10px 6px 6px;transition:border-color .12s;display:flex}.epics-quick-add[data-v-25a0998d]:focus-within{border-color:var(--fg,#fffffff0)}.epics-quick-add[data-busy=true][data-v-25a0998d]{opacity:.85;border-style:dashed}.epics-quick-add .quick-add-glyph[data-v-25a0998d]{width:22px;height:22px;font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);border:.5px solid;border-radius:2px;place-items:center;font-size:13px;display:inline-grid}.epics-quick-add input[data-v-25a0998d]{min-width:0;color:inherit;font-family:var(--font-serif,system-ui);background:0 0;border:0;outline:none;flex:1;padding:4px 0;font-size:15px}.epics-quick-add input[data-v-25a0998d]::placeholder{color:var(--fg-4,#ffffff57);font-style:italic}.epics-quick-add .quick-add-status[data-v-25a0998d]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);font-size:11px}.epics-quick-add .quick-add-chip[data-v-25a0998d]{font-family:var(--font-mono,monospace);letter-spacing:.02em;white-space:nowrap;border:.5px solid;align-items:center;padding:1px 6px;font-size:10.5px;display:inline-flex}.epics-quick-add .quick-add-chip.tone-blue[data-v-25a0998d]{color:var(--accent-blue,#1d55a6)}.epics-quick-add .quick-add-hint[data-v-25a0998d]{font-family:var(--font-mono,monospace);color:var(--fg-4,#ffffff57);white-space:nowrap;font-size:10.5px}.epics-quick-add .quick-add-hint kbd[data-v-25a0998d]{font-family:var(--font-mono,monospace);border:.5px solid var(--line,#ffffff12);margin:0 1px;padding:0 4px;font-size:10px}.epics-list-items[data-v-25a0998d]{gap:8px;margin:0;padding:0;list-style:none;display:grid}.epics-list-items>li[data-v-25a0998d]{transition:background 80ms;position:relative}.epics-list-items>li.focused[data-v-25a0998d]{background:var(--bg-2,#0e1014)}.epics-list-items>li.selected[data-v-25a0998d]{box-shadow:inset 3px 0 0 var(--fg,#fffffff0)}.epics-list-items>li.focused.selected[data-v-25a0998d]{box-shadow:inset 3px 0 0 var(--accent-teal,#087f6f)}.epics-list-foot[data-v-25a0998d]{font-family:var(--font-mono,monospace);color:var(--fg-3,#ffffff85);letter-spacing:.04em;margin-top:8px;font-size:11px}.epics-list-foot kbd[data-v-25a0998d]{font-family:var(--font-mono,monospace);border:.5px solid var(--line,#ffffff12);margin:0 1px;padding:0 4px;font-size:10px}.epics-bulk-bar[data-v-25a0998d]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e);font-family:var(--font-mono,monospace);z-index:1;flex-wrap:wrap;align-items:center;gap:12px;padding:8px 12px;font-size:11px;display:flex;position:sticky;top:0}.epics-bulk-bar .count[data-v-25a0998d]{font-weight:600}.epics-bulk-bar .bulk-reproject[data-v-25a0998d]{align-items:center;gap:6px;display:inline-flex}.epics-bulk-bar .bulk-reproject-label[data-v-25a0998d]{color:var(--bg-2,#0e1014);letter-spacing:.04em}.epics-bulk-bar .bulk-reproject-select[data-v-25a0998d]{border:.5px solid var(--bg-2,#0e1014);color:var(--bg,#0a0b0e);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;outline:none;padding:2px 6px;font-size:11px}.epics-bulk-bar .bulk-reproject-select[data-v-25a0998d]:disabled{opacity:.5;cursor:wait}.epics-bulk-bar .bulk-reproject-select option[data-v-25a0998d]{background:var(--fg,#fffffff0);color:var(--bg,#0a0b0e)}.epics-bulk-bar .bulk-clear[data-v-25a0998d]{color:var(--bg-2,#0e1014);font-family:var(--font-mono,monospace);cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0 4px;font-size:11px}.epics-bulk-bar .bulk-clear kbd[data-v-25a0998d]{border:.5px solid;margin-left:4px;padding:0 4px;font-size:10px}.epics-bulk-bar .hint[data-v-25a0998d]{color:var(--bg-2,#0e1014);letter-spacing:.04em;font-size:10.5px}.epics-bulk-bar .hint kbd[data-v-25a0998d]{border:.5px solid;padding:0 4px;font-size:10px}.epic-line[data-v-25a0998d]{margin:4px 0}.muted[data-v-25a0998d]{color:var(--fg-3,#ffffff85)}.warn[data-v-25a0998d]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-25a0998d]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}"]], ["__scopeId", "data-v-25a0998d"]]), bf = {
	class: "issue-epic-linker",
	"data-smoke": "issue-epic-linker"
}, xf = { class: "issue-epic-linker-header" }, Sf = {
	key: 0,
	class: "epic-linker-line muted"
}, Cf = {
	key: 1,
	class: "epic-linker-line warn"
}, wf = {
	key: 2,
	class: "linked-epics"
}, Tf = ["href"], Ef = {
	key: 0,
	class: "epic-linker-line muted"
}, Df = ["disabled", "onClick"], Of = {
	key: 3,
	class: "linked-epics"
}, kf = { class: "epic-linker-line muted" }, Af = ["disabled", "onClick"], jf = {
	key: 4,
	class: "epic-linker-line muted"
}, Mf = ["value"], Nf = ["disabled"], Pf = {
	key: 6,
	class: "epic-linker-line muted"
}, Ff = {
	key: 7,
	class: "epic-linker-line warn",
	role: "alert"
}, If = "comtrya://rel/part-of", Lf = /* @__PURE__ */ xu(/* @__PURE__ */ Ar({
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
		let n = e, r = t, i = X(() => n.client ?? n.comtryaClient), a = X(() => n.workspaceId ?? n.issue?.workspaceId ?? ql()), o = X(() => n.issue?.id ? `comtrya://issue/${n.issue.id}` : ""), s = X(() => {
			let e = u.value;
			return h.value.filter((t) => e.has(Yl(t)));
		}), c = X(() => {
			let e = new Set(h.value.map((e) => Yl(e)));
			return [...u.value].filter((t) => !e.has(t));
		}), l = X(() => {
			let e = u.value, t = n.issue?.projectName ?? null;
			return h.value.filter((t) => !e.has(Yl(t))).sort((e, n) => (t && e.projectName === t ? 0 : 1) - (t && n.projectName === t ? 0 : 1) || (e.projectName ?? "").localeCompare(n.projectName ?? "") || e.title.localeCompare(n.title));
		}), u = X(() => new Set(g.value.filter((e) => e.kind === If).map((e) => re(e)).filter((e) => e.startsWith("comtrya://epic/")))), d = /* @__PURE__ */ z("idle"), f = /* @__PURE__ */ z(null), p = /* @__PURE__ */ z("idle"), m = /* @__PURE__ */ z(null), h = /* @__PURE__ */ z([]), g = /* @__PURE__ */ z([]), _ = /* @__PURE__ */ z("");
		Sr(() => [
			i.value,
			a.value,
			o.value,
			n.refreshKey,
			n.relationshipRefreshKey
		], () => void v(), { immediate: !0 }), Sr(l, (e) => {
			e.some((e) => Yl(e) === _.value) || (_.value = e[0] ? Yl(e[0]) : "");
		}, { immediate: !0 });
		async function v() {
			let e = i.value;
			if (!e || !o.value) {
				h.value = [], g.value = [], d.value = "error", f.value = e ? "issue-epic-linker: missing issue" : "issue-epic-linker: no client";
				return;
			}
			d.value = "loading", f.value = null;
			try {
				let [t, n] = await Promise.all([Ll(e, { workspaceId: a.value }), Ul(e, o.value, If)]);
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
					let t = await Wl(e, {
						from: o.value,
						to: _.value,
						kind: If
					});
					await v(), b("created", t);
				} catch (e) {
					m.value = e instanceof Error ? e.message : String(e);
				} finally {
					p.value = "idle";
				}
			}
		}
		async function ee(e) {
			let t = i.value;
			if (t) {
				p.value = "submitting", m.value = null;
				try {
					await Gl(t, e.id), await v(), b("deleted", e);
				} catch (e) {
					m.value = e instanceof Error ? e.message : String(e);
				} finally {
					p.value = "idle";
				}
			}
		}
		async function te(e) {
			let t = ne(e);
			t && await ee(t);
		}
		function ne(e) {
			return g.value.find((t) => re(t) === e);
		}
		function re(e) {
			return e.to ?? e.target ?? "";
		}
		function b(e, t) {
			r("comtrya-relationship-changed", {
				source: "issue-epic-linker",
				action: e,
				relation: t
			});
		}
		return (e, t) => (W(), G("section", bf, [
			K("header", xf, [K("div", null, [t[1] ||= K("h2", null, "Epic", -1), K("p", null, N(s.value.length + c.value.length) + " linked", 1)])]),
			d.value === "loading" ? (W(), G("p", Sf, "Loading epics")) : d.value === "error" ? (W(), G("p", Cf, N(f.value), 1)) : J("", !0),
			d.value === "ready" && s.value.length > 0 ? (W(), G("div", wf, [(W(!0), G(U, null, ti(s.value, (e) => (W(), G("article", {
				key: e.id,
				class: "linked-epic"
			}, [K("div", null, [
				K("span", { class: rt(["epic-state", B(Ql)(e.state).className]) }, N(B(Ql)(e.state).label), 3),
				K("a", { href: B(Xl)(e) }, N(e.title), 9, Tf),
				e.projectName ? (W(), G("p", Ef, N(e.projectName), 1)) : J("", !0)
			]), K("button", {
				type: "button",
				disabled: p.value === "submitting",
				onClick: (t) => te(B(Yl)(e))
			}, " Remove ", 8, Df)]))), 128))])) : J("", !0),
			d.value === "ready" && c.value.length > 0 ? (W(), G("div", Of, [(W(!0), G(U, null, ti(c.value, (e) => (W(), G("article", {
				key: e,
				class: "linked-epic"
			}, [K("p", kf, N(e), 1), ne(e) ? (W(), G("button", {
				key: 0,
				type: "button",
				disabled: p.value === "submitting",
				onClick: (t) => te(e)
			}, " Remove ", 8, Af)) : J("", !0)]))), 128))])) : J("", !0),
			d.value === "ready" && s.value.length === 0 && c.value.length === 0 ? (W(), G("p", jf, " Not linked to an epic. ")) : J("", !0),
			d.value === "ready" && l.value.length > 0 ? (W(), G("form", {
				key: 5,
				class: "epic-linker-form",
				onSubmit: as(y, ["prevent"])
			}, [K("label", null, [t[2] ||= K("span", null, "Link epic", -1), gr(K("select", {
				"onUpdate:modelValue": t[0] ||= (e) => _.value = e,
				"aria-label": "Epic"
			}, [(W(!0), G(U, null, ti(l.value, (e) => (W(), G("option", {
				key: e.id,
				value: B(Yl)(e)
			}, N(e.title) + N(e.projectName ? ` - ${e.projectName}` : ""), 9, Mf))), 128))], 512), [[es, _.value]])]), K("button", {
				type: "submit",
				disabled: p.value === "submitting" || !_.value
			}, " Link ", 8, Nf)], 32)) : d.value === "ready" && l.value.length === 0 ? (W(), G("p", Pf, " No eligible epics. ")) : J("", !0),
			m.value ? (W(), G("p", Ff, N(m.value), 1)) : J("", !0)
		]));
	}
}), [["styles", [".issue-epic-linker[data-v-7883bb2f]{border:.5px solid var(--line,#ffffff12);background:var(--surface);color:var(--fg,#fffffff0);font-family:var(--font-mono,monospace);gap:12px;padding:14px;font-size:12px;display:grid}.issue-epic-linker-header[data-v-7883bb2f]{border-bottom:.5px solid var(--line,#ffffff12);align-items:center;min-height:36px;display:flex}.issue-epic-linker-header h2[data-v-7883bb2f]{font-family:var(--font-serif,system-ui);margin:0;font-size:18px;line-height:1}.issue-epic-linker-header p[data-v-7883bb2f],.epic-linker-line[data-v-7883bb2f]{margin:4px 0 0;font-size:11px}.linked-epics[data-v-7883bb2f],.epic-linker-form[data-v-7883bb2f]{gap:8px;display:grid}.linked-epic[data-v-7883bb2f]{grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:8px;display:grid}.linked-epic a[data-v-7883bb2f]{color:inherit;overflow-wrap:anywhere;text-decoration:none}.linked-epic a[data-v-7883bb2f]:hover{text-decoration:underline}.epic-state[data-v-7883bb2f]{border:.5px solid;margin-right:6px;padding:1px 6px;font-size:10px;display:inline-flex}.epic-linker-form[data-v-7883bb2f]{border-top:.5px solid var(--line,#ffffff12);padding-top:12px}.epic-linker-form label[data-v-7883bb2f]{gap:4px;min-width:0;display:grid}.epic-linker-form label>span[data-v-7883bb2f]{color:var(--fg-3,#ffffff85);letter-spacing:.08em;text-transform:uppercase;font-size:10px}.epic-linker-form select[data-v-7883bb2f],.epic-linker-form button[data-v-7883bb2f],.linked-epic button[data-v-7883bb2f]{border:.5px solid var(--fg,#fffffff0);min-height:32px;color:inherit;font:inherit;background:0 0}.epic-linker-form select[data-v-7883bb2f]{width:100%;max-width:100%;padding:5px 8px}.epic-linker-form button[data-v-7883bb2f],.linked-epic button[data-v-7883bb2f]{cursor:pointer;padding:5px 10px}.epic-linker-form button[data-v-7883bb2f]:disabled,.linked-epic button[data-v-7883bb2f]:disabled{cursor:wait;opacity:.55}.muted[data-v-7883bb2f]{color:var(--fg-3,#ffffff85)}.warn[data-v-7883bb2f]{color:var(--err,#ff645f)}@supports (color:lab(0% 0 0)){.warn[data-v-7883bb2f]{color:var(--err,lab(63.3139% 59.7937 35.1683))}}"]], ["__scopeId", "data-v-7883bb2f"]]), Rf = "epics", zf = "ext_epics", Bf = "comtrya-epic-card", Vf = "comtrya-epics-board", Hf = "comtrya-epics-index", Uf = "comtrya-epic-detail", Wf = "comtrya-issue-epic-linker", Gf = "comtrya-epic-new";
wl({
	tagName: Bf,
	component: Su,
	propertyAliases: { ref: "resourceRef" }
}), wl({
	tagName: Vf,
	component: yf
}), wl({
	tagName: Hf,
	component: yf
}), wl({
	tagName: Uf,
	component: Rd
}), wl({
	tagName: Wf,
	component: Lf
}), qf();
var Kf = {
	id: zf,
	setup(e) {
		e.registerCard({
			resourceKind: "epic",
			element: Bf,
			requiredPermission: "epics.read"
		}), e.registerRelationshipTargetProvider({
			resourceKind: "epic",
			loadTargets: async (t) => (await Ll(e.client, { workspaceId: t.workspaceId ?? ql() })).map((e) => ({
				ref: Yl(e),
				kind: "epic",
				title: e.title,
				subtitle: e.state.toLowerCase().replace(/_/g, " ")
			}))
		}), e.registerWidget({
			id: "epics-board",
			element: Vf,
			defaultSlot: "repository.sidebar",
			defaultPriority: 100,
			requiredPermission: "epics.read"
		}), e.registerWidget({
			id: "issue-epic-linker",
			element: Wf,
			defaultSlot: "issue.detail.sidebar",
			defaultPriority: 90,
			requiredPermission: "epics.write"
		}), e.registerRoute("/", {
			element: Hf,
			requiredPermission: "epics.read"
		}), e.registerRoute("/new", {
			element: Gf,
			requiredPermission: "epics.write"
		}), e.registerRoute("/:workspaceId/:id", {
			element: Uf,
			requiredPermission: "epics.read"
		}), au(e.client);
	}
};
function qf() {
	typeof customElements > "u" || customElements.get(Gf) || customElements.define(Gf, class extends HTMLElement {
		routeParams;
		connectedCallback() {
			let e = Jf(this.routeParams);
			this.replaceChildren(Yf(e));
		}
	});
}
function Jf(e) {
	let t = new URLSearchParams(window.location.search);
	return {
		workspaceId: t.get("workspaceId") ?? e?.params?.workspaceId ?? ql(),
		projectName: t.get("projectName") ?? e?.params?.projectName ?? null
	};
}
function Yf(e) {
	let t = document.createElement("main");
	t.className = "epic-new", t.dataset.smoke = "epic-new";
	let n = document.createElement("h3");
	n.textContent = e.projectName ? `New epic in ${e.projectName}` : "New epic";
	let r = document.createElement("form"), i = document.createElement("input");
	i.required = !0, i.placeholder = "Epic title";
	let a = document.createElement("select");
	a.className = "epic-new-project-select", a.dataset.smoke = "epic-new-project";
	let o = document.createElement("option");
	o.value = "", o.textContent = "— no project —", a.append(o), _l().then((t) => {
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
	let l = Xf("", "warn");
	return l.setAttribute("role", "alert"), l.hidden = !0, r.append(i, a, s, c, l), r.addEventListener("submit", (t) => {
		t.preventDefault(), c.disabled = !0, l.hidden = !0, Vl(void 0, {
			workspaceId: e.workspaceId,
			projectName: a.value || null,
			title: i.value.trim(),
			bodyMarkdown: s.value
		}).then((e) => {
			window.location.assign(h(Rf, `/${e.workspaceId}/${e.id}`));
		}).catch((e) => {
			l.textContent = e instanceof Error ? e.message : String(e), l.hidden = !1, c.disabled = !1;
		});
	}), t.append(n, r), t;
}
function Xf(e, t) {
	let n = document.createElement("p");
	return n.className = `epic-line ${t}`, n.textContent = e, n;
}
//#endregion
export { Kf as default };
