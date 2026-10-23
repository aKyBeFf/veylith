/* Запросы к API. В браузере хранится только токен сессии, пароль нет */
const Account = (() => {
  const KEY = "veylith_token";
  const base = () => (window.VEYLITH_API || "").replace(/\/$/, "");
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = t => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch {} };

  async function call(path, body, withToken) {
    if (!base()) return { ok: false, error: "offline" };
    const headers = { "Content-Type": "application/json" };
    if (withToken) headers.Authorization = "Bearer " + read();
    try {
      const r = await fetch(base() + path, { method: "POST", headers, body: JSON.stringify(body || {}) });
      const data = await r.json();
      if (r.status === 401 && withToken) write(null);
      return data;
    } catch { return { ok: false, error: "network" }; }
  }

  return {
    hasToken: () => !!read(),
    signOut: () => write(null),
    register: (username, password) => call("/api/register", { username, password }),
    async signIn(username, password) {
      const res = await call("/api/login", { username, password });
      if (res.ok) write(res.token);
      return res;
    },
    profile: () => call("/api/profile", {}, true),
    redeem: key => call("/api/redeem", { key }, true)
  };
})();

const ERRORS = {
  taken: "Этот логин уже занят",
  invalid: "Проверьте введённые данные",
  bad_credentials: "Неверный логин или пароль",
  bad_key: "Ключ не подходит или уже использован",
  rate_limited: "Слишком много попыток, подождите 10 минут",
  forbidden: "Запрос отклонён сервером",
  unauthorized: "Войдите заново",
  network: "Нет связи с сервером, попробуйте позже",
  offline: "Сервер ещё не подключён",
  server: "Сервер не ответил, попробуйте позже"
};
