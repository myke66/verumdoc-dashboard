import { useState, useMemo, useEffect } from "react";
import { listarAfastamentos, aprovarAfastamento, recusarAfastamento, excluirAfastamento } from "../services/firebase";
import { enviarNotificacao } from "../services/notificacoes";

const MOTIVOS_RECUSA = [
  "Imagem ilegível ou de baixa qualidade",
  "Foto do atestado cortada ou incompleta",
  "Atestado sem assinatura ou carimbo do médico",
  "CRM do médico não identificado",
  "Data do atestado incompatível com o período informado",
  "Atestado já utilizado anteriormente",
  "Documento não é um atestado médico válido",
  "Informações do atestado divergem do formulário",
  "Atestado expirado",
  "Outro motivo",
];

export default function AfastamentosPage() {
  const [dados, setDados]               = useState([]);
  const [carregando, setCarregando]     = useState(true);
  const [carregou, setCarregou]         = useState(false);
  const [busca, setBusca]               = useState("");
  const [filtro, setFiltro]             = useState("todos");
  const [selecionado, setSelecionado]   = useState(null);
  const [confirmacao, setConfirmacao]   = useState(null);
  const [motivoSelecionado, setMotivoSelecionado] = useState("");
  const [motivoCustom, setMotivoCustom] = useState("");
  const [zoomFoto, setZoomFoto]         = useState(false);

  // Dados em tempo real do Firestore
  useEffect(() => {
    const unsub = listarAfastamentos((lista) => {
      setDados(lista);
      setCarregando(false);
      setCarregou(true);
    });
    return unsub;
  }, []);

  const filtrados = useMemo(() => {
    return dados
      .filter(d => filtro === "todos" || d.status === filtro)
      .filter(d => {
        const q = busca.toLowerCase();
        return !q || (d.nome || "").toLowerCase().includes(q) || (d.matricula || "").includes(q);
      });
  }, [dados, busca, filtro]);

  const aprovar = async (id) => {
    await aprovarAfastamento(id);
    await enviarNotificacao(id, "aprovado").catch(() => {});
    setSelecionado(null); setConfirmacao(null);
  };

  const recusar = async (id, motivo) => {
    await recusarAfastamento(id, motivo);
    await enviarNotificacao(id, "recusado").catch(() => {});
    setSelecionado(null); setConfirmacao(null);
    setMotivoSelecionado(""); setMotivoCustom("");
  };

  const excluir = async (id) => {
    await excluirAfastamento(id);
    setSelecionado(null); setConfirmacao(null);
  };

  const exportarCSV = () => {
    const linhas = [
      ["Nome", "Matrícula", "Início", "Término", "Dias", "CID", "CRM", "Médico", "Status"],
      ...filtrados.map(d => [
        d.nome || "-", d.matricula || "-",
        fmtData(d.dataInicio), fmtData(d.dataFim),
        d.dias || "-", d.cid || "-",
        d.crm || "-", d.nomeMedico || "-", d.status || "-",
      ]),
    ];
    const csv  = linhas.map(l => l.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "afastamentos.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const fmtData = (s) => {
    if (!s) return "-";
    if (s?.toDate) {
      const d = s.toDate();
      return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    }
    if (typeof s === "string" && s.includes("-")) {
      const [y, m, d] = s.split("-");
      return `${d}/${m}/${y}`;
    }
    return "-";
  };

  const STATUS_MAP = {
    pendente: { label: "Pendente", cls: "badge-pend" },
    aprovado: { label: "Aprovado", cls: "badge-ok"   },
    recusado: { label: "Recusado", cls: "badge-rec"  },
  };

  const CONFIRMACAO_CONFIG = {
    aprovar: { titulo: "Aprovar afastamento?", msg: "O funcionário será notificado que o afastamento foi aprovado.", btnLabel: "Confirmar aprovação", btnCls: "btn-success" },
    recusar: { titulo: "Recusar afastamento?", msg: "O funcionário será notificado que o afastamento foi recusado.", btnLabel: "Confirmar recusa", btnCls: "btn-danger" },
    excluir: { titulo: "Excluir afastamento?", msg: "Esta ação é permanente e não pode ser desfeita. O registro será removido do sistema.", btnLabel: "Excluir permanentemente", btnCls: "btn-danger" },
  };

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["todos", "pendente", "aprovado", "recusado"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            fontFamily: "var(--font)", cursor: "pointer", border: "0.5px solid",
            borderColor: filtro === f ? "var(--blue-600)" : "var(--border-md)",
            background: filtro === f ? "var(--blue-50)" : "var(--surface)",
            color: filtro === f ? "var(--blue-600)" : "var(--text-3)",
          }}>
            {f === "todos" ? "Todos" : STATUS_MAP[f]?.label}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
              {f === "todos" ? dados.length : dados.filter(d => d.status === f).length}
            </span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={exportarCSV}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Tabela */}
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">
            {carregando ? "Carregando..." : `${filtrados.length} afastamento${filtrados.length !== 1 ? "s" : ""}`}
          </span>
          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="var(--text-3)" strokeWidth="1.2"/>
              <path d="M9.5 9.5L12 12" stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input placeholder="Buscar por nome ou matrícula..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Período</th>
              <th>Dias</th>
              <th>Médico</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-3)", padding: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: "2px solid var(--blue-400)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Buscando afastamentos...
                </div>
              </td></tr>
            )}
            {carregou && filtrados.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-3)", padding: 32 }}>
                Nenhum resultado encontrado.
              </td></tr>
            )}
            {!carregando && filtrados.map(d => {
              const s = STATUS_MAP[d.status] || STATUS_MAP.pendente;
              return (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--text)" }}>{d.nome || "-"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Mat. {d.matricula || "-"}</div>
                  </td>
                  <td>
                    <div>{fmtData(d.dataInicio)} → {fmtData(d.dataFim)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Enviado em {fmtData(d.criadoEm)}</div>
                  </td>
                  <td><strong>{d.dias || "-"}</strong></td>
                  <td>
                    <div style={{ fontSize: 12 }}>{d.nomeMedico || "-"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{d.crm || "-"}</div>
                  </td>
                  <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }}
                        onClick={() => setSelecionado(d)}>
                        Ver
                      </button>
                      {d.status === "pendente" && (
                        <>
                          <button className="btn btn-success" style={{ padding: "5px 10px", fontSize: 11 }}
                            onClick={() => setConfirmacao({ id: d.id, acao: "aprovar" })}>
                            Aprovar
                          </button>
                          <button className="btn btn-danger" style={{ padding: "5px 10px", fontSize: 11 }}
                            onClick={() => setConfirmacao({ id: d.id, acao: "recusar" })}>
                            Recusar
                          </button>
                        </>
                      )}
                      <button style={{ padding: "5px 8px", fontSize: 11, background: "transparent", border: "0.5px solid var(--border-md)", borderRadius: 6, cursor: "pointer", color: "var(--red-400)", display: "flex", alignItems: "center" }}
                        onClick={() => setConfirmacao({ id: d.id, acao: "excluir" })}
                        title="Excluir afastamento">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10.5 3.5l-.7 7a.5.5 0 01-.5.5H3.7a.5.5 0 01-.5-.5l-.7-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal zoom foto */}
      {zoomFoto && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}
          onClick={() => setZoomFoto(false)}>
          <img src={zoomFoto} alt="Atestado zoom" style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", borderRadius: 8 }} />
          <button onClick={() => setZoomFoto(false)} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
          <span style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Clique em qualquer lugar para fechar</span>
        </div>
      )}

      {/* Modal detalhes */}
      {selecionado && (
        <div className="modal-overlay" onClick={() => setSelecionado(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Detalhes do afastamento</span>
              <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setSelecionado(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Foto com preview rápido */}
              {(selecionado.fotoUrl || selecionado.fotoPreview) ? (
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <div style={{ position: "relative", cursor: "zoom-in" }} onClick={() => selecionado.fotoUrl && setZoomFoto(selecionado.fotoUrl)}>
                    <img
                      src={selecionado.fotoUrl || selecionado.fotoPreview}
                      alt="Atestado"
                      className="foto-atestado"
                      style={{ filter: selecionado.fotoUrl ? "none" : "blur(2px)", transition: "filter 0.3s" }}
                    />
                    {selecionado.fotoUrl && (
                      <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="#fff" strokeWidth="1.3"/><path d="M8.5 8.5l3 3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/><path d="M3.5 5.5h4M5.5 3.5v4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>
                        <span style={{ fontSize: 10, color: "#fff" }}>Zoom</span>
                      </div>
                    )}
                  </div>
                  {!selecionado.fotoUrl && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.6)", borderRadius: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 20, height: 20, border: "2px solid var(--blue-400)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <span style={{ fontSize: 11, color: "var(--blue-600)", fontWeight: 500 }}>Otimizando foto...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="foto-placeholder" style={{ marginBottom: 16 }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="2" y="7" width="24" height="17" rx="3" stroke="var(--gray-300)" strokeWidth="1.5"/>
                    <circle cx="14" cy="15.5" r="4.5" stroke="var(--gray-300)" strokeWidth="1.5"/>
                    <path d="M10 7l2-3.5h4L18 7" stroke="var(--gray-300)" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                  <span>Foto do atestado não disponível</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <DetalheRow label="Funcionário"  value={selecionado.nome || "-"} />
                <DetalheRow label="Matrícula"    value={selecionado.matricula || "-"} />
                <DetalheRow label="Início"       value={fmtData(selecionado.dataInicio)} />
                <DetalheRow label="Término"      value={fmtData(selecionado.dataFim)} />
                <DetalheRow label="Dias"         value={selecionado.dias ? `${selecionado.dias} dia${selecionado.dias !== 1 ? "s" : ""}` : "-"} />
                <DetalheRow label="CID"          value={selecionado.cid || "Não informado"} />
                <DetalheRow label="CRM"          value={selecionado.crm || "-"} />
                <DetalheRow label="Médico"       value={selecionado.nomeMedico || "-"} />
                <DetalheRow label="Status foto"  value={selecionado.fotoStatus === "ok" ? "✅ Enviada" : selecionado.fotoStatus === "enviando" ? "⏳ Enviando..." : "-"} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" style={{ marginRight: "auto" }}
                onClick={() => { setSelecionado(null); setConfirmacao({ id: selecionado.id, acao: "excluir" }); }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10.5 3.5l-.7 7a.5.5 0 01-.5.5H3.7a.5.5 0 01-.5-.5l-.7-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Excluir
              </button>
              {selecionado.status === "pendente" && (
                <>
                  <button className="btn btn-danger" onClick={() => { setSelecionado(null); setConfirmacao({ id: selecionado.id, acao: "recusar" }); }}>Recusar</button>
                  <button className="btn btn-success" onClick={() => { setSelecionado(null); setConfirmacao({ id: selecionado.id, acao: "aprovar" }); }}>Aprovar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação — Aprovar / Excluir */}
      {confirmacao && confirmacao.acao !== "recusar" && (() => {
        const cfg = CONFIRMACAO_CONFIG[confirmacao.acao];
        return (
          <div className="modal-overlay" onClick={() => setConfirmacao(null)}>
            <div className="modal" style={{ width: 360 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">{cfg.titulo}</span>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{cfg.msg}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setConfirmacao(null)}>Cancelar</button>
                <button className={`btn ${confirmacao.acao === "aprovar" ? "btn-success" : "btn-danger"}`} onClick={() => {
                  if (confirmacao.acao === "aprovar") aprovar(confirmacao.id);
                  else excluir(confirmacao.id);
                }}>
                  {cfg.btnLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de recusa com seleção de motivo */}
      {confirmacao && confirmacao.acao === "recusar" && (
        <div className="modal-overlay" onClick={() => { setConfirmacao(null); setMotivoSelecionado(""); setMotivoCustom(""); }}>
          <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Recusar afastamento</span>
              <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => { setConfirmacao(null); setMotivoSelecionado(""); setMotivoCustom(""); }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14, lineHeight: 1.5 }}>
                Selecione o motivo da recusa. O funcionário será notificado no app.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {MOTIVOS_RECUSA.map((m, i) => (
                  <button key={i} onClick={() => { setMotivoSelecionado(m); setMotivoCustom(""); }}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "0.5px solid", textAlign: "left", cursor: "pointer", fontFamily: "var(--font)", fontSize: 13, transition: "all 0.15s",
                      borderColor: motivoSelecionado === m ? "var(--red-400)" : "var(--border-md)",
                      background: motivoSelecionado === m ? "var(--red-50)" : "var(--surface)",
                      color: motivoSelecionado === m ? "var(--red-800)" : "var(--text-2)",
                    }}>
                    {motivoSelecionado === m && <span style={{ marginRight: 8 }}>✓</span>}{m}
                  </button>
                ))}
              </div>
              {motivoSelecionado === "Outro motivo" && (
                <textarea
                  placeholder="Descreva o motivo da recusa..."
                  value={motivoCustom}
                  onChange={e => setMotivoCustom(e.target.value)}
                  style={{ width: "100%", height: 80, border: "0.5px solid var(--border-md)", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "var(--font)", resize: "none", outline: "none", color: "var(--text)", background: "var(--surface)" }}
                />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setConfirmacao(null); setMotivoSelecionado(""); setMotivoCustom(""); }}>Cancelar</button>
              <button className="btn btn-danger"
                disabled={!motivoSelecionado || (motivoSelecionado === "Outro motivo" && !motivoCustom.trim())}
                onClick={() => {
                  const motivo = motivoSelecionado === "Outro motivo" ? motivoCustom.trim() : motivoSelecionado;
                  recusar(confirmacao.id, motivo);
                }}>
                Confirmar recusa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetalheRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function fmtData(s) {
  if (!s) return "-";
  if (s?.toDate) {
    const d = s.toDate();
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  }
  if (typeof s === "string" && s.includes("-")) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  return "-";
}