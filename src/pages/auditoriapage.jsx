import { useState, useEffect, useMemo } from "react";
import { listarAfastamentosHibrido } from "../services/dados";

export default function AuditoriaPage() {
  const [dados,   setDados]   = useState([]);
  const [busca,   setBusca]   = useState("");
  const [filtro,  setFiltro]  = useState("todos"); // todos | aprovado | recusado

  useEffect(() => {
    const unsub = listarAfastamentosHibrido(setDados);
    return unsub;
  }, []);

  // Só mostra afastamentos que já foram processados (aprovado ou recusado)
  const auditados = useMemo(() => {
    return dados
      .filter(d => filtro === "todos" ? d.status !== "pendente" : d.status === filtro)
      .filter(d => {
        const q = busca.toLowerCase();
        return !q ||
          (d.nome || "").toLowerCase().includes(q) ||
          (d.matricula || "").includes(q) ||
          (d.aprovadoPor || "").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const ta = a.atualizadoEm?.toDate?.() || new Date(a.atualizadoEm || 0);
        const tb = b.atualizadoEm?.toDate?.() || new Date(b.atualizadoEm || 0);
        return tb - ta;
      });
  }, [dados, busca, filtro]);

  const fmtData = (s) => {
    if (!s) return "-";
    const d = s?.toDate ? s.toDate() : new Date(s);
    if (isNaN(d)) return "-";
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const totalAprovados = dados.filter(d => d.status === "aprovado").length;
  const totalRecusados = dados.filter(d => d.status === "recusado").length;
  const totalPendentes = dados.filter(d => d.status === "pendente").length;

  return (
    <div>
      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Aprovados", value: totalAprovados, cor: "var(--green-800)", bg: "var(--green-50)", borda: "rgba(29,158,117,.2)" },
          { label: "Recusados", value: totalRecusados, cor: "var(--red-800)",   bg: "var(--red-50)",   borda: "rgba(226,75,74,.2)" },
          { label: "Pendentes", value: totalPendentes, cor: "var(--text-3)",    bg: "var(--gray-100)", borda: "var(--border)" },
        ].map((m, i) => (
          <div key={i} style={{ background: m.bg, borderRadius: 12, padding: "16px 20px", border: `0.5px solid ${m.borda}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: m.cor, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>{m.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: m.cor }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="var(--text-3)" strokeWidth="1.2"/>
            <path d="M10 10l2.5 2.5" stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            style={{ width: "100%", height: 36, border: "0.5px solid var(--border)", borderRadius: 8, paddingLeft: 30, paddingRight: 12, fontSize: 13, fontFamily: "var(--font)", outline: "none", background: "var(--surface)", color: "var(--text)" }}
            placeholder="Buscar funcionário, matrícula ou responsável..."
            value={busca} onChange={e => setBusca(e.target.value)}
          />
        </div>
        {["todos", "aprovado", "recusado"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: "pointer", border: "0.5px solid",
            borderColor: filtro === f ? "var(--blue-600)" : "var(--border)",
            background: filtro === f ? "var(--blue-50)" : "var(--surface)",
            color: filtro === f ? "var(--blue-600)" : "var(--text-3)",
            fontFamily: "var(--font)",
          }}>
            {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabela de auditoria */}
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">
            Histórico de auditoria — {auditados.length} registro{auditados.length !== 1 ? "s" : ""}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Período</th>
              <th>Dias</th>
              <th>Decisão</th>
              <th>Responsável</th>
              <th>Data da decisão</th>
              <th>Motivo da recusa</th>
            </tr>
          </thead>
          <tbody>
            {auditados.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  Nenhum registro de auditoria encontrado.
                </td>
              </tr>
            )}
            {auditados.map(d => (
              <tr key={d.id}>
                <td>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{d.nome || "-"}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>Mat. {d.matricula || "-"}</div>
                </td>
                <td style={{ fontSize: 12 }}>
                  {d.dataInicio || "-"} → {d.dataFim || "-"}
                </td>
                <td style={{ fontSize: 13, fontWeight: 600 }}>
                  {d.dias || "-"}
                </td>
                <td>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: d.status === "aprovado" ? "var(--green-50)" : "var(--red-50)",
                    color: d.status === "aprovado" ? "var(--green-800)" : "var(--red-800)",
                  }}>
                    {d.status === "aprovado" ? "✅" : "❌"}
                    {d.status === "aprovado" ? "Aprovado" : "Recusado"}
                  </span>
                </td>
                <td>
                  {d.aprovadoPor ? (
                    <div style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 500 }}>{d.aprovadoPor}</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>—</span>
                  )}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {fmtData(d.atualizadoEm)}
                </td>
                <td style={{ fontSize: 12, maxWidth: 200 }}>
                  {d.motivo ? (
                    <span style={{ background: "var(--red-50)", color: "var(--red-800)", padding: "3px 8px", borderRadius: 6, fontSize: 11 }}>
                      {d.motivo}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-3)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}