const BASE = "https://verumdoc-backend-production.up.railway.app/api";

// ── Token ─────────────────────────────────────────
const getToken = () => localStorage.getItem("verumdoc-token");

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const api = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || "Erro na requisição");
  return data;
};

// ── Auth ──────────────────────────────────────────
export const loginRH = async (email, senha) => {
  const data = await api("POST", "/auth/login", { email, senha });
  localStorage.setItem("verumdoc-token", data.token);
  localStorage.setItem("verumdoc-api-v2", "true");
  return data;
};

export const logoutRH = () => {
  localStorage.removeItem("verumdoc-token");
  localStorage.removeItem("verumdoc-api-v2");
  localStorage.removeItem("verumdoc-usuario");
};

export const cadastrarEmpresa = async (dados) => {
  const data = await api("POST", "/auth/cadastro", dados);
  localStorage.setItem("verumdoc-token", data.token);
  localStorage.setItem("verumdoc-api-v2", "true");
  return data;
};

export const getUsuarioAtual = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) { logoutRH(); return null; }
    return payload;
  } catch { return null; }
};

// ── Afastamentos ──────────────────────────────────
export const listarAfastamentos = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  return api("GET", `/afastamentos?${params}`);
};

export const aprovarAfastamento = (id) =>
  api("PATCH", `/afastamentos/${id}/aprovar`);

export const recusarAfastamento = (id, motivo) =>
  api("PATCH", `/afastamentos/${id}/recusar`, { motivo });

export const excluirAfastamento = (id) =>
  api("DELETE", `/afastamentos/${id}`);

// ── Usuários ──────────────────────────────────────
export const listarUsuarios = () =>
  api("GET", "/usuarios");

export const criarUsuario = (dados) =>
  api("POST", "/usuarios", dados);

export const enviarConvite = (email) =>
  api("POST", "/convites", { email });

// ── Empresa ───────────────────────────────────────
export const getEmpresa = () =>
  api("GET", "/empresas/minha");

export const getMetricas = () =>
  api("GET", "/empresas/minha/metricas");

// ── Pagamentos ────────────────────────────────────
export const getStatusPagamento = () =>
  api("GET", "/pagamentos/status");