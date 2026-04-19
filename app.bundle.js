// app.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
var SUPABASE_URL = "https://nhflpziwowjtphjfcadc.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZmxweml3b3dqdHBoamZjYWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDg0MDMsImV4cCI6MjA5MjA4NDQwM30.ENdnDGz2MpWB--jd-_MqyhNhazlq9ay893l1ti2rhl0";
var supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
var LENS_TYPES = {
  daily: { label: "\u041E\u0434\u043D\u043E\u0434\u043D\u0435\u0432\u043D\u044B\u0435", short: "1 \u0434\u0435\u043D\u044C", days: 1 },
  biweekly: { label: "\u0414\u0432\u0443\u0445\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u044B\u0435", short: "2 \u043D\u0435\u0434\u0435\u043B\u0438", days: 14 },
  monthly: { label: "\u041C\u0435\u0441\u044F\u0447\u043D\u044B\u0435", short: "1 \u043C\u0435\u0441\u044F\u0446", days: 30 },
  quarterly: { label: "\u041A\u0432\u0430\u0440\u0442\u0430\u043B\u044C\u043D\u044B\u0435", short: "3 \u043C\u0435\u0441\u044F\u0446\u0430", days: 90 }
};
var MONTHS_SHORT = ["\u044F\u043D\u0432", "\u0444\u0435\u0432", "\u043C\u0430\u0440", "\u0430\u043F\u0440", "\u043C\u0430\u044F", "\u0438\u044E\u043D", "\u0438\u044E\u043B", "\u0430\u0432\u0433", "\u0441\u0435\u043D", "\u043E\u043A\u0442", "\u043D\u043E\u044F", "\u0434\u0435\u043A"];
var MONTHS_LONG = ["\u044F\u043D\u0432\u0430\u0440\u044F", "\u0444\u0435\u0432\u0440\u0430\u043B\u044F", "\u043C\u0430\u0440\u0442\u0430", "\u0430\u043F\u0440\u0435\u043B\u044F", "\u043C\u0430\u044F", "\u0438\u044E\u043D\u044F", "\u0438\u044E\u043B\u044F", "\u0430\u0432\u0433\u0443\u0441\u0442\u0430", "\u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044F", "\u043E\u043A\u0442\u044F\u0431\u0440\u044F", "\u043D\u043E\u044F\u0431\u0440\u044F", "\u0434\u0435\u043A\u0430\u0431\u0440\u044F"];
var state = {
  user: null,
  cycles: null,
  activeScreen: "home",
  loading: true,
  authMode: "login",
  // 'login' | 'register'
  authError: null,
  flow: null,
  notifPermission: typeof Notification !== "undefined" ? Notification.permission : "default",
  hasPushSub: false
  // есть ли активная подписка в БД
};
var root = document.getElementById("app");
function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") el.innerHTML = v;
    else if (k in el) {
      try {
        el[k] = v;
      } catch {
        el.setAttribute(k, v);
      }
    } else el.setAttribute(k, v);
  }
  const arr = Array.isArray(children) ? children : [children];
  for (const c of arr) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  return el;
}
function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayISO() {
  return toISODate(/* @__PURE__ */ new Date());
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function fmtShort(s) {
  const d = parseDate(s);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
function fmtLong(s) {
  const d = parseDate(s);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}
function daysBetween(a, b) {
  const ms = parseDate(b) - parseDate(a);
  return Math.round(ms / 864e5);
}
function pluralRu(n, forms) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
function svg(path, opts = {}) {
  const { size = 24, stroke = "currentColor", fill = "none", strokeWidth = 2 } = opts;
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  el.setAttribute("width", size);
  el.setAttribute("height", size);
  el.setAttribute("viewBox", "0 0 24 24");
  el.setAttribute("fill", fill);
  el.setAttribute("stroke", stroke);
  el.setAttribute("stroke-width", strokeWidth);
  el.setAttribute("stroke-linecap", "round");
  el.setAttribute("stroke-linejoin", "round");
  el.innerHTML = path;
  return el;
}
var ICONS = {
  lens: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  home: '<path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  back: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
};
function icon(name, opts) {
  return svg(ICONS[name], opts);
}
function toast(text) {
  const t = h("div", { class: "toast" }, text);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
async function fetchCycles() {
  const { data, error } = await supabase.from("lens_cycles").select("*").order("start_date", { ascending: false });
  if (error) throw error;
  return data || [];
}
async function createCycle(startDateISO, lensType) {
  const replaceDate = toISODate(addDays(parseDate(startDateISO), LENS_TYPES[lensType].days));
  const active = (state.cycles || []).find((c) => c.status === "active");
  if (active) {
    const { error: upErr } = await supabase.from("lens_cycles").update({ status: "replaced" }).eq("id", active.id);
    if (upErr) throw upErr;
  }
  const { data, error } = await supabase.from("lens_cycles").insert({
    user_id: state.user.id,
    start_date: startDateISO,
    lens_type: lensType,
    replace_date: replaceDate,
    status: "active"
  }).select("id, user_id, start_date, lens_type, replace_date, status").single();
  if (error) throw error;
  return data;
}
async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
async function signUp(email, password) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}
async function signOut() {
  await supabase.auth.signOut();
  state.user = null;
  state.cycles = null;
  state.activeScreen = "home";
  render();
}
var VAPID_PUBLIC_KEY = "BGN-NqIX-O3oLXMqU-BPrwp-Z-khimbJL1rewisk4-TQCM-6C5Wj-Xaye80oeWLH_uBXQ2C_hgAbkNIBXJK0bCM";
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
async function savePushSubscription(subscription) {
  const { error } = await supabase.from("push_subscriptions").upsert({ user_id: state.user.id, subscription: subscription.toJSON() }, { onConflict: "user_id" });
  if (error) throw error;
  state.hasPushSub = true;
}
async function loadPushSubStatus() {
  if (!state.user) return;
  const { data } = await supabase.from("push_subscriptions").select("id").eq("user_id", state.user.id).maybeSingle();
  state.hasPushSub = !!data;
}
async function enableNotifications() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    toast("\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F");
    return;
  }
  try {
    const perm = await Notification.requestPermission();
    state.notifPermission = perm;
    if (perm !== "granted") {
      toast("\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E");
      render();
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await savePushSubscription(sub);
    toast("\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B \u{1F389}");
    checkAndNotify();
  } catch (err) {
    console.error(err);
    toast("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F");
  }
  render();
}
async function disableNotifications() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    const sub = await reg?.pushManager?.getSubscription();
    if (sub) await sub.unsubscribe();
    await supabase.from("push_subscriptions").delete().eq("user_id", state.user.id);
    state.hasPushSub = false;
    toast("\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u044B");
  } catch (err) {
    console.error(err);
    toast("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F");
  }
  render();
}
async function checkAndNotify() {
  if (state.notifPermission !== "granted") return;
  if (!state.hasPushSub) return;
  const active = (state.cycles || []).find((c) => c.status === "active");
  if (!active) return;
  const today = todayISO();
  if (active.replace_date <= today) {
    const reg = await navigator.serviceWorker?.getRegistration();
    const lastShown = localStorage.getItem("lastNotif:" + active.id);
    if (lastShown === today) return;
    if (reg && reg.active) {
      reg.active.postMessage({
        type: "SHOW_LOCAL_NOTIFICATION",
        title: "\u041F\u043E\u0440\u0430 \u043C\u0435\u043D\u044F\u0442\u044C \u043B\u0438\u043D\u0437\u044B \u{1F441}\uFE0F",
        body: "\u0421\u0440\u043E\u043A \u043D\u043E\u0441\u043A\u0438 \u0442\u0435\u043A\u0443\u0449\u0438\u0445 \u043B\u0438\u043D\u0437 \u0438\u0441\u0442\u0451\u043A"
      });
      localStorage.setItem("lastNotif:" + active.id, today);
    }
  }
}
function loginScreen() {
  const wrap = h("div", { class: "screen no-tabs" });
  const inner = h("div", { class: "login-wrap" });
  const isRegister = state.authMode === "register";
  const logo = h("div", { class: "login-logo" }, [
    (() => {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("viewBox", "0 0 96 96");
      s.innerHTML = `
        <circle cx="48" cy="48" r="32" fill="none" stroke="#e8a0bc" stroke-width="3"/>
        <circle cx="48" cy="48" r="32" fill="#fff0f5" opacity="0.8"/>
        <circle cx="48" cy="48" r="14" fill="none" stroke="#d98aaa" stroke-width="2"/>
        <circle cx="48" cy="48" r="5" fill="#c2748f"/>
        <circle cx="42" cy="42" r="3" fill="#ffffff" opacity="0.7"/>`;
      return s;
    })(),
    h("h1", {}, "\u0422\u0440\u0435\u043A\u0435\u0440 \u043B\u0438\u043D\u0437"),
    h("p", {}, "\u041D\u0435 \u0437\u0430\u0431\u044B\u0432\u0430\u0439 \u043C\u0435\u043D\u044F\u0442\u044C \u043B\u0438\u043D\u0437\u044B \u0432\u043E\u0432\u0440\u0435\u043C\u044F")
  ]);
  const emailInput = h("input", {
    type: "email",
    placeholder: "Email",
    required: true,
    autocomplete: "email"
  });
  const passwordInput = h("input", {
    type: "password",
    placeholder: "\u041F\u0430\u0440\u043E\u043B\u044C",
    required: true,
    autocomplete: isRegister ? "new-password" : "current-password",
    minlength: 6
  });
  const submitBtn = h(
    "button",
    { type: "submit", class: "btn btn-primary btn-large" },
    isRegister ? "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F" : "\u0412\u043E\u0439\u0442\u0438"
  );
  const toggleBtn = h("button", {
    type: "button",
    class: "btn btn-ghost",
    style: { fontSize: "14px", color: "var(--text-secondary)" },
    onclick: () => {
      state.authMode = isRegister ? "login" : "register";
      state.authError = null;
      render();
    }
  }, isRegister ? "\u0423\u0436\u0435 \u0435\u0441\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442? \u0412\u043E\u0439\u0442\u0438" : "\u041D\u0435\u0442 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430? \u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F");
  const form = h("form", { class: "login-form", onsubmit: async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) return;
    submitBtn.disabled = true;
    submitBtn.textContent = isRegister ? "\u0421\u043E\u0437\u0434\u0430\u0451\u043C \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u2026" : "\u0412\u0445\u043E\u0434\u0438\u043C\u2026";
    try {
      if (isRegister) {
        await signUp(email, password);
        toast("\u0410\u043A\u043A\u0430\u0443\u043D\u0442 \u0441\u043E\u0437\u0434\u0430\u043D! \u0422\u0435\u043F\u0435\u0440\u044C \u0432\u043E\u0439\u0434\u0438.");
        state.authMode = "login";
        state.authError = null;
      } else {
        await signIn(email, password);
        state.authError = null;
      }
    } catch (err) {
      state.authError = err.message || "\u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430";
      submitBtn.disabled = false;
      submitBtn.textContent = isRegister ? "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F" : "\u0412\u043E\u0439\u0442\u0438";
    }
    render();
  } });
  form.append(emailInput, passwordInput, submitBtn, toggleBtn);
  if (state.authError) form.append(h("div", { class: "error-text" }, state.authError));
  inner.append(logo, form);
  wrap.append(inner);
  return wrap;
}
function lensSvg() {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 36 36");
  s.innerHTML = `
    <circle cx="18" cy="18" r="14" fill="none" stroke="#e8a0bc" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="14" fill="#fff0f5" opacity="0.8"/>
    <circle cx="18" cy="18" r="6" fill="none" stroke="#d98aaa" stroke-width="1.2"/>
    <circle cx="18" cy="18" r="2.2" fill="#c2748f"/>`;
  return s;
}
function homeScreen() {
  const wrap = h("div", { class: "screen" });
  wrap.append(h("div", { class: "app-header" }, [
    h("h1", {}, "\u0413\u043B\u0430\u0432\u043D\u0430\u044F")
  ]));
  if (state.cycles === null) {
    wrap.append(h("div", { class: "skeleton skeleton-card" }));
    wrap.append(h("div", { class: "skeleton", style: { height: "56px", borderRadius: "20px", marginBottom: "12px" } }));
    wrap.append(h("div", { class: "skeleton", style: { height: "56px", borderRadius: "20px" } }));
    wrap.append(tabBar());
    return wrap;
  }
  const active = state.cycles.find((c) => c.status === "active");
  if (!active) {
    wrap.append(emptyState());
    wrap.append(tabBar());
    return wrap;
  }
  const total = LENS_TYPES[active.lens_type]?.days ?? daysBetween(active.start_date, active.replace_date);
  const passed = Math.max(0, Math.min(total, daysBetween(active.start_date, todayISO())));
  const remaining = daysBetween(todayISO(), active.replace_date);
  const isOverdue = remaining < 0;
  const progressPct = Math.min(100, Math.max(0, passed / total * 100));
  const typeLabel = LENS_TYPES[active.lens_type]?.label ?? active.lens_type;
  const card = h("div", { class: "card cycle-card" }, [
    h("div", { class: "cycle-top" }, [
      h("div", { class: "lens-icon-wrap" }, [lensSvg()]),
      h("span", { class: `badge ${isOverdue ? "badge-overdue" : "badge-active"}` }, typeLabel)
    ]),
    h("div", { class: "counter" }, [
      h("div", { class: "counter-num" }, isOverdue ? `+${Math.abs(remaining)}` : remaining),
      h(
        "div",
        { class: "counter-label" },
        isOverdue ? `${pluralRu(Math.abs(remaining), ["\u0434\u0435\u043D\u044C", "\u0434\u043D\u044F", "\u0434\u043D\u0435\u0439"])} \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0438` : remaining === 0 ? "\u0441\u0435\u0433\u043E\u0434\u043D\u044F \u0434\u0435\u043D\u044C \u0437\u0430\u043C\u0435\u043D\u044B" : `${pluralRu(remaining, ["\u0434\u0435\u043D\u044C", "\u0434\u043D\u044F", "\u0434\u043D\u0435\u0439"])} \u0434\u043E \u0437\u0430\u043C\u0435\u043D\u044B`
      )
    ]),
    h("div", {}, [
      h("div", { class: "progress" }, [
        h("div", { class: "progress-fill", style: { width: progressPct + "%" } })
      ]),
      h("div", { class: "progress-dates" }, [
        h("span", {}, fmtShort(active.start_date)),
        h("span", {}, fmtShort(active.replace_date))
      ])
    ])
  ]);
  wrap.append(card);
  wrap.append(h("div", { class: "actions" }, [
    h("button", { class: "btn btn-primary btn-large", onclick: () => startFlow() }, "\u041D\u0430\u0434\u0435\u043B\u0430 \u043D\u043E\u0432\u044B\u0435 \u043B\u0438\u043D\u0437\u044B"),
    h("button", { class: "btn btn-secondary", onclick: () => navigate("history") }, "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0437\u0430\u043C\u0435\u043D")
  ]));
  wrap.append(tabBar());
  if (isOverdue || remaining === 0) checkAndNotify();
  return wrap;
}
function emptyState() {
  return h("div", { class: "empty" }, [
    h("div", { class: "empty-icon" }, [lensSvg()]),
    h("h2", {}, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0435\u0439"),
    h("p", {}, "\u0414\u043E\u0431\u0430\u0432\u044C \u043F\u0435\u0440\u0432\u0443\u044E \u043F\u0430\u0440\u0443 \u043B\u0438\u043D\u0437, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u0447\u0430\u0442\u044C \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u0442\u044C \u0441\u0440\u043E\u043A \u0437\u0430\u043C\u0435\u043D\u044B"),
    h("button", { class: "btn btn-primary btn-large", style: { maxWidth: "280px" }, onclick: () => startFlow() }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043B\u0438\u043D\u0437\u044B")
  ]);
}
function startFlow() {
  state.flow = { step: 1, startDate: todayISO(), lensType: null };
  state.activeScreen = "flow";
  render();
}
function flowScreen() {
  const f = state.flow;
  const wrap = h("div", { class: "screen no-tabs" });
  wrap.append(h("div", { class: "flow-header" }, [
    h("button", { class: "icon-btn", onclick: () => {
      if (f.step === 2) {
        f.step = 1;
        render();
      } else {
        state.flow = null;
        state.activeScreen = "home";
        render();
      }
    } }, [icon("back", { size: 20 })]),
    h("h2", { style: { margin: 0 } }, "\u041D\u043E\u0432\u044B\u0435 \u043B\u0438\u043D\u0437\u044B")
  ]));
  wrap.append(h("div", { class: "flow-step" }, `\u0428\u0430\u0433 ${f.step} \u0438\u0437 2`));
  if (f.step === 1) {
    wrap.append(h("h2", {}, "\u041A\u043E\u0433\u0434\u0430 \u043D\u0430\u0447\u0430\u043B\u0430 \u043D\u043E\u0441\u0438\u0442\u044C?"));
    const today = todayISO();
    const yesterday = toISODate(addDays(/* @__PURE__ */ new Date(), -1));
    const opts = [
      { value: today, label: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F", sub: fmtLong(today) },
      { value: yesterday, label: "\u0412\u0447\u0435\u0440\u0430", sub: fmtLong(yesterday) },
      { value: "__pick__", label: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0434\u0430\u0442\u0443", sub: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C" }
    ];
    const list = h("div", { class: "option-list" });
    for (const o of opts) {
      const selected = o.value === "__pick__" && !["__today__", "__yesterday__"].includes(f.startDate) && f.startDate !== today && f.startDate !== yesterday || f.startDate === o.value;
      list.append(h("div", { class: "option" + (selected ? " selected" : ""), onclick: () => {
        if (o.value === "__pick__") openDatePicker();
        else {
          f.startDate = o.value;
          render();
        }
      } }, [
        h("div", { class: "option-label" }, [o.label, h("small", {}, o.sub)]),
        h("div", { class: "option-radio" })
      ]));
    }
    wrap.append(list);
    if (f.startDate && f.startDate !== today && f.startDate !== yesterday) {
      wrap.append(h("div", { class: "login-message", style: { marginTop: "8px" } }, [
        "\u0412\u044B\u0431\u0440\u0430\u043D\u0430 \u0434\u0430\u0442\u0430: ",
        h("strong", {}, fmtLong(f.startDate))
      ]));
    }
    wrap.append(h("div", { class: "flow-spacer" }));
    wrap.append(h("button", {
      class: "btn btn-primary btn-large",
      disabled: !f.startDate,
      onclick: () => {
        f.step = 2;
        render();
      }
    }, "\u0414\u0430\u043B\u0435\u0435"));
  } else {
    wrap.append(h("h2", {}, "\u041A\u0430\u043A\u0438\u0435 \u043B\u0438\u043D\u0437\u044B?"));
    const list = h("div", { class: "option-list" });
    for (const [key, t] of Object.entries(LENS_TYPES)) {
      const selected = f.lensType === key;
      list.append(h("div", { class: "option" + (selected ? " selected" : ""), onclick: () => {
        f.lensType = key;
        render();
      } }, [
        h("div", { class: "option-label" }, [t.label, h("small", {}, t.short)]),
        h("div", { class: "option-radio" })
      ]));
    }
    wrap.append(list);
    if (f.lensType) {
      const replaceDate = toISODate(addDays(parseDate(f.startDate), LENS_TYPES[f.lensType].days));
      wrap.append(h("div", { class: "login-message", style: { marginTop: "16px" } }, [
        "\u041C\u0435\u043D\u044F\u0442\u044C ",
        h("strong", {}, fmtLong(replaceDate))
      ]));
    }
    wrap.append(h("div", { class: "flow-spacer" }));
    const saveBtn = h("button", {
      class: "btn btn-primary btn-large",
      disabled: !f.lensType
    }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C");
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u043C\u2026";
      try {
        await createCycle(f.startDate, f.lensType);
        state.cycles = await fetchCycles();
        state.flow = null;
        state.activeScreen = "home";
        render();
        toast("\u0413\u043E\u0442\u043E\u0432\u043E!");
      } catch (err) {
        toast(err.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C");
        saveBtn.disabled = false;
        saveBtn.textContent = "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C";
      }
    });
    wrap.append(saveBtn);
  }
  return wrap;
}
function openDatePicker() {
  const overlay = h("div", { class: "date-picker-overlay", onclick: (e) => {
    if (e.target === overlay) overlay.remove();
  } });
  const modal = h("div", { class: "date-picker-modal" });
  const input = h("input", { type: "date", max: todayISO(), value: state.flow?.startDate || todayISO() });
  modal.append(
    h("h3", {}, "\u0412\u044B\u0431\u0435\u0440\u0438 \u0434\u0430\u0442\u0443 \u043D\u0430\u0447\u0430\u043B\u0430"),
    input,
    h("button", { class: "btn btn-primary", onclick: () => {
      if (input.value) {
        state.flow.startDate = input.value;
        overlay.remove();
        render();
      }
    } }, "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C"),
    h("button", { class: "btn btn-ghost", onclick: () => overlay.remove() }, "\u041E\u0442\u043C\u0435\u043D\u0430")
  );
  overlay.append(modal);
  document.body.append(overlay);
}
function historyScreen() {
  const wrap = h("div", { class: "screen" });
  wrap.append(h("div", { class: "app-header" }, [h("h1", {}, "\u0418\u0441\u0442\u043E\u0440\u0438\u044F")]));
  if (state.cycles === null) {
    for (let i = 0; i < 4; i++) {
      wrap.append(h("div", { class: "skeleton", style: { height: "78px", borderRadius: "16px", marginBottom: "12px" } }));
    }
    wrap.append(tabBar());
    return wrap;
  }
  if (state.cycles.length === 0) {
    wrap.append(h("div", { class: "empty", style: { padding: "20px 0" } }, [
      h("p", {}, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043D\u0438 \u043E\u0434\u043D\u043E\u0439 \u0437\u0430\u043F\u0438\u0441\u0438")
    ]));
  } else {
    const list = h("div", { class: "history-list" });
    for (const c of state.cycles) {
      const t = LENS_TYPES[c.lens_type];
      list.append(h("div", { class: "history-item" }, [
        h("div", { class: "history-item-top" }, [
          h("div", {}, [
            h("div", { class: "history-dates" }, `${fmtShort(c.start_date)} \u2192 ${fmtShort(c.replace_date)}`),
            h("div", { class: "history-type" }, t?.label ?? c.lens_type)
          ]),
          h("span", {
            class: "badge " + (c.status === "active" ? "badge-active" : "badge-replaced")
          }, c.status === "active" ? "\u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0435" : "\u0437\u0430\u043C\u0435\u043D\u0435\u043D\u044B")
        ])
      ]));
    }
    wrap.append(list);
  }
  wrap.append(h("button", {
    class: "btn btn-primary btn-large",
    style: { marginTop: "20px" },
    onclick: () => startFlow()
  }, "+ \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u044C"));
  wrap.append(tabBar());
  return wrap;
}
function settingsScreen() {
  const wrap = h("div", { class: "screen" });
  wrap.append(h("div", { class: "app-header" }, [h("h1", {}, "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438")]));
  const list = h("div", { class: "settings-list" });
  list.append(h("div", { class: "settings-row" }, [
    h("div", { class: "settings-row-label" }, "\u0410\u043A\u043A\u0430\u0443\u043D\u0442"),
    h("div", { class: "settings-row-value" }, state.user?.email ?? "\u2014")
  ]));
  const perm = state.notifPermission;
  const isGranted = perm === "granted";
  const isDenied = perm === "denied";
  const isActive = isGranted && state.hasPushSub;
  let statusText, statusClass, btnLabel, btnAction, btnClass;
  if (isDenied) {
    statusText = "\u041E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u044B \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430";
    statusClass = "denied";
  } else if (isActive) {
    statusText = "\u0412\u043A\u043B\u044E\u0447\u0435\u043D\u044B \u2014 \u043F\u0440\u0438\u0434\u0443\u0442 \u0432 \u0434\u0435\u043D\u044C \u0437\u0430\u043C\u0435\u043D\u044B";
    statusClass = "granted";
    btnLabel = "\u041E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F";
    btnAction = () => disableNotifications();
    btnClass = "btn btn-danger";
  } else if (isGranted && !state.hasPushSub) {
    statusText = "\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u044B, \u043D\u043E \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430 \u043D\u0435 \u0430\u043A\u0442\u0438\u0432\u043D\u0430";
    statusClass = "";
    btnLabel = "\u041F\u043E\u0434\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F \u043D\u0430 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F";
    btnAction = () => enableNotifications();
    btnClass = "btn btn-primary";
  } else {
    statusText = "\u041D\u0435 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B";
    statusClass = "";
    btnLabel = "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F";
    btnAction = () => enableNotifications();
    btnClass = "btn btn-primary";
  }
  const notifRow = h("div", { class: "settings-row" }, [
    h("div", { class: "settings-row-label" }, "Push-\u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F"),
    h("div", { class: "settings-row-value" }, "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435 \u0432 \u0434\u0435\u043D\u044C \u0437\u0430\u043C\u0435\u043D\u044B \u043B\u0438\u043D\u0437"),
    h("div", { class: "notif-status " + statusClass }, statusText)
  ]);
  if (!isDenied && btnLabel) {
    notifRow.append(h("button", {
      class: btnClass,
      style: { marginTop: "12px" },
      onclick: btnAction
    }, [icon("bell", { size: 18, stroke: isActive ? void 0 : "#fff" }), btnLabel]));
  }
  if (isDenied) {
    notifRow.append(h(
      "p",
      { style: { fontSize: "13px", marginTop: "8px" } },
      "\u0427\u0442\u043E\u0431\u044B \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C, \u0440\u0430\u0437\u0440\u0435\u0448\u0438 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 \u0432\u0440\u0443\u0447\u043D\u0443\u044E"
    ));
  }
  list.append(notifRow);
  list.append(h("button", {
    class: "btn btn-danger",
    style: { marginTop: "8px" },
    onclick: () => signOut()
  }, "\u0412\u044B\u0439\u0442\u0438"));
  wrap.append(list);
  wrap.append(tabBar());
  return wrap;
}
function tabBar() {
  const tabs = [
    { key: "home", label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", icon: "home" },
    { key: "history", label: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F", icon: "history" },
    { key: "settings", label: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", icon: "settings" }
  ];
  const bar = h("nav", { class: "tab-bar" });
  for (const t of tabs) {
    bar.append(h("button", {
      class: "tab" + (state.activeScreen === t.key ? " active" : ""),
      onclick: () => navigate(t.key)
    }, [icon(t.icon, { size: 22 }), t.label]));
  }
  return bar;
}
function navigate(screen) {
  state.activeScreen = screen;
  render();
}
function render() {
  root.innerHTML = "";
  if (!state.user) {
    root.append(loginScreen());
    return;
  }
  switch (state.activeScreen) {
    case "flow":
      root.append(flowScreen());
      break;
    case "history":
      root.append(historyScreen());
      break;
    case "settings":
      root.append(settingsScreen());
      break;
    case "home":
    default:
      root.append(homeScreen());
      break;
  }
}
async function init() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("service-worker.js");
    } catch (e) {
      console.warn("SW register failed", e);
    }
  }
  const { data: { session } } = await supabase.auth.getSession();
  state.user = session?.user ?? null;
  supabase.auth.onAuthStateChange(async (_event, sess) => {
    const wasUser = state.user;
    state.user = sess?.user ?? null;
    if (state.user && !wasUser) {
      try {
        state.cycles = await fetchCycles();
      } catch (_) {
        state.cycles = [];
      }
      await loadPushSubStatus();
    }
    if (!state.user) {
      state.cycles = null;
      state.hasPushSub = false;
    }
    render();
  });
  if (state.user) {
    try {
      state.cycles = await fetchCycles();
    } catch (_) {
      state.cycles = [];
    }
    await loadPushSubStatus();
    checkAndNotify();
  }
  if (window.location.hash.includes("access_token") || window.location.search.includes("code=")) {
    history.replaceState(null, "", window.location.pathname);
  }
  render();
}
init();
