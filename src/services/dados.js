/**
 * Serviço híbrido de dados
 * 
 * Empresas novas (cadastradas pela API) → PostgreSQL via API REST
 * Empresas antigas → Firebase Firestore (legado)
 * 
 * Detecta automaticamente baseado no JWT:
 * - Se tem empresaId no JWT → empresa nova → usa API
 * - Se não tem → empresa legada → usa Firebase
 */

import { getUsuarioAtual } from "./api";
import {
  listarAfastamentos as listarFirebase,
  aprovarAfastamento as aprovarFirebase,
  recusarAfastamento as recusarFirebase,
  excluirAfastamento as excluirFirebase,
} from "./firebase";

const API = "https://verumdoc-backend-production.up.railway.app/api";

const getToken = () => localStorage.getItem("verumdoc-token");

const apiReq = async (method, path, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || "Erro na requisição");
  return data;
};

// Detecta se empresa usa nova API
// Empresas que logam pela nova API salvam flag no localStorage
const usaNovaAPI = () => {
  return localStorage.getItem("verumdoc-api-v2") === "true";
};

// ── Listar afastamentos ───────────────────────────
export const listarAfastamentosHibrido = (callback) => {
  if (usaNovaAPI()) {
    // Polling para nova API (a cada 15 segundos)
    let ativo = true;

    const buscar = async () => {
      try {
        const data = await apiReq("GET", "/afastamentos?limite=200");
        if (ativo) callback(data.afastamentos || []);
      } catch (e) {
        console.error("Erro ao buscar afastamentos:", e);
      }
    };

    buscar(); // Busca imediata
    const intervalo = setInterval(() => { if (ativo) buscar(); }, 3000);

    const unsub = () => { ativo = false; clearInterval(intervalo); };
    unsub.refresh = buscar;
    return unsub;
  }

  // Firebase (tempo real) — sem refresh manual necessário (listener em tempo real)
  const unsub = listarFirebase(callback);
  unsub.refresh = () => {};
  return unsub;
};

// ── Aprovar ───────────────────────────────────────
export const aprovarAfastamentoHibrido = async (id) => {
  if (usaNovaAPI()) return apiReq("PATCH", `/afastamentos/${id}/aprovar`);
  return aprovarFirebase(id);
};

// ── Recusar ───────────────────────────────────────
export const recusarAfastamentoHibrido = async (id, motivo) => {
  if (usaNovaAPI()) return apiReq("PATCH", `/afastamentos/${id}/recusar`, { motivo });
  return recusarFirebase(id, motivo);
};

// ── Excluir ───────────────────────────────────────
export const excluirAfastamentoHibrido = async (id) => {
  if (usaNovaAPI()) return apiReq("DELETE", `/afastamentos/${id}`);
  return excluirFirebase(id);
};

// ── Métricas ──────────────────────────────────────
export const getMetricasHibrido = async () => {
  if (usaNovaAPI()) return apiReq("GET", "/empresas/minha/metricas");
  return null; // Dashboard calcula do Firebase
};