/* Роутер: один index.html, экраны переключаются с плавным исчезновением */
const $ = id => document.getElementById(id);
const views = [...document.querySelectorAll(".view")];
const byName = name => views.find(v => v.dataset.view === name);

/* Маршруты: about и gui это места на главной, остальное отдельные экраны */
const ROUTES = {
  "": ["home"], about: ["home", "about"], gui: ["home", "gui"],
  buy: ["buy"], register: ["register"], profile: ["profile"]
};
const hooks = {};
let current = null, ticket = 0;

const parse = () => { const h = location.hash.replace(/^#\/?/, ""); return h in ROUTES ? h : ""; };
const jumpTop = () => (window.lenis ? lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0));

function scrollToAnchor(id, smooth) {
  const el = $(id);
  if (!el) return jumpTop();
  if (window.lenis) lenis.scrollTo(el, { offset: -40, duration: smooth ? 1.4 : 0, immediate: !smooth });
  else el.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
}

function show(key) {
  const [name, anchor] = ROUTES[key];
  const next = byName(name);

  if (current === next) {
    anchor ? scrollToAnchor(anchor, true) : window.lenis ? lenis.scrollTo(0, { duration: 1.2 }) : scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const mine = ++ticket;
  const apply = () => {
    if (mine !== ticket) return;
    views.forEach(v => v.classList.remove("active", "leaving"));
    next.classList.add("active");
    current = next;
    document.body.dataset.view = name;
    document.title = next.dataset.title;
    jumpTop();
    if (window.lenis) lenis.resize();
    if (anchor) requestAnimationFrame(() => scrollToAnchor(anchor, false));
    onScroll();
    hooks[name] && hooks[name]();
  };

  if (!current || reduce) return apply();
  current.classList.remove("active");
  current.classList.add("leaving");
  setTimeout(apply, 220);
}

addEventListener("hashchange", () => show(parse()));
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a) return;
  e.preventDefault();
  const href = a.getAttribute("href");
  if (location.hash === href) show(parse());
  else location.hash = href;
});

/* Оплата (демо: платёж не проводится, промокоды не применяются) */
(() => {
  const form = $("b-form");
  const fmt = n => n.toLocaleString("ru-RU") + " ₽";
  let discount = 0;

  function sync() {
    const plan = form.querySelector("input[name=plan]:checked");
    const method = form.querySelector("input[name=method]:checked");
    const price = Number(plan.dataset.price);
    const disc = Math.round(price * discount);
    $("b-s-plan").textContent = plan.dataset.name;
    $("b-s-method").textContent = method.dataset.name;
    $("b-s-disc").textContent = disc ? "−" + fmt(disc) : "0 ₽";
    const total = $("b-s-total");
    total.style.opacity = 0;
    setTimeout(() => { total.textContent = fmt(price - disc); total.style.opacity = 1; }, 120);
  }
  form.addEventListener("change", e => { if (e.target.name === "plan" || e.target.name === "method") sync(); });

  function setErr(id, text) {
    const f = $(id);
    f.classList.toggle("err", !!text);
    f.querySelector(".msg").textContent = text || "";
  }

 $("b-promo-btn").addEventListener("click", () => {
    setErr("b-f-promo", $("b-promo").value.trim() ? "Промокод не найден" : "Введите промокод");
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const mail = $("b-mail").value.trim();
    const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
    setErr("b-f-mail", okMail ? "" : "Введите почту, на неё придёт ключ");
    const agree = $("b-agree").checked;
    $("b-agree-wrap").classList.toggle("err", !agree);
    if (!okMail || !agree) return;

    const btn = $("b-pay"), label = btn.querySelector("span");
    btn.disabled = true; label.textContent = "Обработка...";
    setTimeout(() => {
      btn.disabled = false; label.textContent = "Оплатить";
      const plan = form.querySelector("input[name=plan]:checked").dataset.name;
      $("b-done-p").textContent = `Подписка «${plan}». В рабочей версии здесь будет переход на платёжный шлюз, а ключ уйдёт на ${mail}.`;
      $("b-done").classList.add("show");
    }, 900);
  });
  $("b-done").addEventListener("click", e => { if (e.target.id === "b-done") e.currentTarget.classList.remove("show"); });
  addEventListener("keydown", e => { if (e.key === "Escape") $("b-done").classList.remove("show"); });
  hooks.buy = () => $("b-done").classList.remove("show");
})();

/* Регистрация */
(() => {
  function setErr(id, text) {
    const f = $(id);
    f.classList.toggle("err", !!text);
    f.querySelector(".msg").textContent = text || "";
  }
  function showAlert(text) {
    const a = $("r-alert");
    a.classList.toggle("show", !!text);
    a.querySelector("span").textContent = text || "";
  }

  $("r-form").addEventListener("submit", async e => {
    e.preventDefault();
    showAlert("");
    const user = $("r-user").value.trim(), pass = $("r-pass").value, pass2 = $("r-pass2").value;
    const okUser = /^[A-Za-z0-9_]{3,24}$/.test(user);
    const okPass = pass.length >= 8 && pass.length <= 72;
    const okSame = pass === pass2;
    const agree = $("r-agree").checked;
    setErr("r-f-user", okUser ? "" : "3-24 символа: латиница, цифры, _");
    setErr("r-f-pass", okPass ? "" : "Минимум 8 символов");
    setErr("r-f-pass2", okSame ? "" : "Пароли не совпадают");
    $("r-agree-wrap").classList.toggle("err", !agree);
    if (!okUser || !okPass || !okSame || !agree) return;

    const btn = $("r-submit"), label = btn.querySelector("span");
    btn.disabled = true; label.textContent = "Создаём...";
    const res = await Account.register(user, pass);
    if (res.ok) await Account.signIn(user, pass);
    btn.disabled = false; label.textContent = "Создать аккаунт";

    if (!res.ok) {
      if (res.error === "taken") setErr("r-f-user", ERRORS.taken);
      else showAlert(ERRORS[res.error] || ERRORS.server);
      return;
    }
    $("r-pass").value = $("r-pass2").value = "";
    $("r-card").classList.add("done");
  });
  hooks.register = () => $("r-card").classList.remove("done");
})();

/* Профиль */
(() => {
  const fmtDate = iso => new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  function pane(name) {
    $("p-login").classList.toggle("show", name === "login");
    $("p-profile").classList.toggle("show", name === "profile");
  }
  function setMsg(id, text, good) {
    const f = $(id);
    f.classList.toggle("err", !!text && !good);
    const m = f.querySelector(".msg");
    m.textContent = text || "";
    m.classList.toggle("good", !!good);
  }
  function alertBox(text) {
    const a = $("p-alert");
    a.classList.toggle("show", !!text);
    a.querySelector("span").textContent = text || "";
  }

  function render(p) {
    $("p-name").textContent = p.username;
    $("p-since").textContent = fmtDate(p.created_at);
    const until = p.expires_at ? new Date(p.expires_at) : null;
    const active = until && until > new Date();
    $("p-sub-dot").className = "dot " + (active ? "on" : "off");
    $("p-sub").textContent = !until ? "Нет подписки" : active ? "до " + fmtDate(p.expires_at) : "Истекла " + fmtDate(p.expires_at);
    $("p-hw-dot").className = "dot " + (p.hw_bound ? "on" : "");
    $("p-hw").textContent = p.hw_bound ? "Привязан" : "Не привязан";
    pane("profile");
  }

  async function load() {
    alertBox("");
    if (!Account.hasToken()) return pane("login");
    const p = await Account.profile();
    if (p.ok) return render(p);
    pane("login");
    if (p.error === "network" || p.error === "offline") alertBox(ERRORS[p.error]);
  }

  $("p-login").addEventListener("submit", async e => {
    e.preventDefault();
    alertBox("");
    const user = $("p-user").value.trim(), pass = $("p-pass").value;
    setMsg("p-f-user", user ? "" : "Введите логин");
    setMsg("p-f-pass", pass ? "" : "Введите пароль");
    if (!user || !pass) return;
    const btn = $("p-login-btn");
    btn.disabled = true;
    const res = await Account.signIn(user, pass);
    btn.disabled = false;
    if (!res.ok) return alertBox(ERRORS[res.error] || ERRORS.server);
    $("p-pass").value = "";
    load();
  });

  $("p-redeem").addEventListener("submit", async e => {
    e.preventDefault();
    const key = $("p-key").value.trim().toUpperCase();
    if (!/^[A-Z0-9@$#!%^&*]{4}(-[A-Z0-9@$#!%^&*]{4}){11}$/.test(key)) return setMsg("p-f-key", "Ключ состоит из 12 групп по 4 символа");
    setMsg("p-f-key", "");
    const btn = $("p-redeem-btn");
    btn.disabled = true;
    const res = await Account.redeem(key);
    btn.disabled = false;
    if (!res.ok) return setMsg("p-f-key", ERRORS[res.error] || ERRORS.server);
    $("p-key").value = "";
    setMsg("p-f-key", "Ключ активирован", true);
    load();
  });

  $("p-out").addEventListener("click", () => { Account.signOut(); pane("login"); });
  hooks.profile = load;
})();

show(parse());
