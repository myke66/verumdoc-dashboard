import { useState, useEffect, useMemo } from "react";
import { listarAfastamentosHibrido } from "../services/dados";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RelatoriosPage() {
  const [dados, setDados]   = useState([]);
  const [periodo, setPeriodo] = useState("todos");

  useEffect(() => {
    const unsub = listarAfastamentosHibrido(setDados);
    return unsub;
  }, []);

  const filtrados = useMemo(() => {
    if (periodo === "todos") return dados;
    const agora = new Date();
    return dados.filter(d => {
      const data = d.dataInicio?.toDate?.() || new Date(d.dataInicio);
      const diff = (agora - data) / (1000 * 60 * 60 * 24);
      if (periodo === "7")  return diff <= 7;
      if (periodo === "30") return diff <= 30;
      if (periodo === "90") return diff <= 90;
      return true;
    });
  }, [dados, periodo]);

  const validos     = filtrados.filter(d => d.status !== "recusado");
  const totalDias   = validos.reduce((s, d) => s + (Number(d.dias) || 0), 0);
  const aprovados   = filtrados.filter(d => d.status === "aprovado").length;
  const pendentes   = filtrados.filter(d => d.status === "pendente").length;
  const recusados   = filtrados.filter(d => d.status === "recusado").length;
  const taxaAprov   = validos.length ? Math.round((aprovados / validos.length) * 100) : 0;

  const exportarCSV = () => {
    const linhas = [
      ["Nome", "Matrícula", "Início", "Término", "Dias", "CID", "CRM", "Médico", "Status"],
      ...filtrados.map(d => [d.nome||"-", d.matricula||"-", d.dataInicio||"-", d.dataFim||"-", d.dias||0, d.cid||"-", d.crm||"-", d.nomeMedico||"-", d.status||"-"]),
    ];
    const csv  = linhas.map(l => l.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "relatorio-afastamentos.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const agora = new Date();
    const dataHora = `${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

    // Cabeçalho azul
    doc.setFillColor(4, 44, 83);
    doc.rect(0, 0, 297, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Verumdoc", 14, 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório de Afastamentos Médicos", 14, 16);
    doc.setFontSize(8);
    doc.text(`Gerado em: ${dataHora}`, 220, 10);
    doc.text(`Total de registros: ${filtrados.length}`, 220, 16);

    // Cards de métricas
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO DO PERÍODO", 14, 32);

    const metricas = [
      ["Total", filtrados.length],
      ["Aprovados", aprovados],
      ["Pendentes", pendentes],
      ["Recusados", recusados],
      ["Total de dias", totalDias],
      ["Taxa de aprovação", `${taxaAprov}%`],
    ];

    metricas.forEach((m, i) => {
      const x = 14 + (i * 46);
      doc.setFillColor(230, 241, 251);
      doc.roundedRect(x, 35, 42, 14, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(String(m[0]), x + 4, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(24, 95, 165);
      doc.text(String(m[1]), x + 4, 47);
    });

    // Tabela principal
    autoTable(doc, {
      startY: 56,
      head: [["Funcionário", "Matrícula", "Início", "Término", "Dias", "CID", "Médico / CRM", "Status"]],
      body: filtrados.map(d => [
        d.nome || "-",
        d.matricula || "-",
        d.dataInicio || "-",
        d.dataFim || "-",
        String(d.dias || "-"),
        d.cid || "-",
        `${d.nomeMedico || "-"} / ${d.crm || "-"}`,
        (d.status || "-").charAt(0).toUpperCase() + (d.status || "").slice(1),
      ]),
      headStyles: { fillColor: [4, 44, 83], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [26, 26, 26] },
      alternateRowStyles: { fillColor: [247, 247, 245] },
      columnStyles: { 0: { cellWidth: 45 }, 4: { halign: "center" }, 7: { halign: "center" } },
    });

    // Rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Verumdoc — verumdoc.com.br — Página ${i} de ${totalPages}`, 14, doc.internal.pageSize.height - 6);
    }

    doc.save(`relatorio-verumdoc-${agora.toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div>
      {/* Filtro de período */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--text-3)" }}>Período:</span>
        {[{ v: "7", l: "7 dias" }, { v: "30", l: "30 dias" }, { v: "90", l: "90 dias" }, { v: "todos", l: "Todos" }].map(p => (
          <button key={p.v} onClick={() => setPeriodo(p.v)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "var(--font)", cursor: "pointer", border: "0.5px solid", borderColor: periodo === p.v ? "var(--blue-600)" : "var(--border-md)", background: periodo === p.v ? "var(--blue-50)" : "var(--surface)", color: periodo === p.v ? "var(--blue-600)" : "var(--text-3)" }}>
            {p.l}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={exportarCSV} style={{ marginRight: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Exportar CSV
        </button>
        <button className="btn btn-primary" onClick={exportarPDF}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h7l3 3v7a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#fff" strokeWidth="1.2"/><path d="M9 2v3h3M4 7h6M4 9.5h4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Exportar PDF
        </button>
      </div>

      {/* Métricas do período */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total de solicitações", value: filtrados.length, sub: "aprovados, pendentes e recusados" },
          { label: "Aprovados",             value: aprovados,        sub: "afastamentos válidos" },
          { label: "Taxa de aprovação",     value: `${taxaAprov}%`,  sub: "aprovados vs válidos" },
          { label: "Recusados",             value: recusados,        sub: "não contabilizados" },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <p className="metric-label">{m.label}</p>
            <p className="metric-value" style={{ color: i === 3 ? "var(--red-400)" : undefined }}>{m.value}</p>
            <p className="metric-sub">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabela resumo */}
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">Detalhamento — {filtrados.length} registros</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Funcionário</th><th>Período</th><th>Dias</th><th>Médico</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-3)", padding: 32 }}>Nenhum registro no período selecionado.</td></tr>
            )}
            {filtrados.map(d => (
              <tr key={d.id}>
                <td><div style={{ fontWeight: 500 }}>{d.nome||"-"}</div><div style={{ fontSize: 11, color: "var(--text-3)" }}>Mat. {d.matricula||"-"}</div></td>
                <td style={{ fontSize: 12 }}>{d.dataInicio||"-"} → {d.dataFim||"-"}</td>
                <td><strong>{d.dias||"-"}</strong></td>
                <td style={{ fontSize: 12 }}>{d.nomeMedico||"-"}</td>
                <td><span className={`badge ${d.status === "aprovado" ? "badge-ok" : d.status === "recusado" ? "badge-rec" : "badge-pend"}`}>{d.status||"-"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}