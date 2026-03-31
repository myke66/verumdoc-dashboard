import { useState, useEffect } from "react";
import { listarUsuarios, criarUsuario, enviarConvite } from "../services/api";

export default function UsuariosPage() {
  const [usuarios,   setUsuarios]   = useState([]);
  const [carregou,   setCarregou]   = useState(false);
  const [modalAberto, setModalAberto] = useState(null); // "novo" | "convite"
  const [form,       setForm]       = useState({ nome: "", email: "", matricula: "", senha: "", perfil: "funcionario" });
  const [emailConvite, setEmailConvite] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [erro,       setErro]       = useState("");
  const [sucesso,    setSucesso]    = useState("");

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      const lista = await listarUsuarios();
      setUsuarios(lista);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregou(true);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCriar = async () => {
    if (!form.nome || !form.email || !form.senha) { setErro("Preencha nome, e-mail e senha."); return; }
    if (form.senha.length < 8) { setErro("Senha deve ter pelo menos 8 caracteres."); return; }
    setErro(""); setLoading(true);
    try {
      await criarUsuario(form);
      setSucesso("Usuário criado com sucesso!");
      setModalAberto(null);
      setForm({ nome: "", email: "", matricula: "", senha: "", perfil: "funcionario" });
      carregar();
      setTimeout(() => setSucesso(""), 3000);
    } catch (e) {
      setErro(e.message);
    } finally { setLoading(false); }
  };

  const handleConvite = async () => {
    if (!emailConvite) { setErro("Informe o e-mail."); return; }
    setErro(""); setLoading(true);
    try {
      await enviarConvite(emailConvite);
      setSucesso(`Convite enviado para ${emailConvite}!`);
      setModalAberto(null);
      setEmailConvite("");
      setTimeout(() => setSucesso(""), 4000);
    } catch (e) {
      setErro(e.message);
    } finally { setLoading(false); }
  };

  const fecharModal = () => { setModalAberto(null); setErro(""); setForm({ nome: "", email: "", matricula: "", senha: "", perfil: "funcionario" }); setEmailConvite(""); };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Gestão de usuários</h2>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>{usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""} cadastrado{usuarios.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => { setErro(""); setModalAberto("convite"); }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            Enviar convite
          </button>
          <button className="btn btn-primary" onClick={() => { setErro(""); setModalAberto("novo"); }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg>
            Novo usuário
          </button>
        </div>
      </div>

      {sucesso && (
        <div style={{ background: "var(--green-50)", border: "0.5px solid var(--green-400)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--green-800)", display: "flex", alignItems: "center", gap: 8 }}>
          ✅ {sucesso}
        </div>
      )}

      {/* Tabela */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Matrícula</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            {!carregou && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: "2px solid var(--blue-400)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Carregando...
                </div>
              </td></tr>
            )}
            {carregou && usuarios.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-3)", padding: 32 }}>
                Nenhum usuário cadastrado ainda.
              </td></tr>
            )}
            {usuarios.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--blue-50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--blue-600)", flexShrink: 0 }}>
                      {u.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{u.nome}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{u.matricula || "—"}</td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: u.perfil === "rh" ? "var(--blue-50)" : "var(--gray-100)", color: u.perfil === "rh" ? "var(--blue-800)" : "var(--text-3)" }}>
                    {u.perfil === "rh" ? "RH" : "Funcionário"}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: u.ativo ? "var(--green-50)" : "var(--red-50)", color: u.ativo ? "var(--green-800)" : "var(--red-800)" }}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {new Date(u.criadoEm).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal novo usuário */}
      {modalAberto === "novo" && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Novo usuário</span>
              <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={fecharModal}>✕</button>
            </div>
            <div className="modal-body">
              {erro && <div style={{ background: "var(--red-50)", border: "0.5px solid var(--red-400)", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 13, color: "var(--red-800)" }}>{erro}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="field-label">NOME COMPLETO *</label>
                  <input className="field-input" placeholder="Nome e sobrenome" value={form.nome} onChange={set("nome")} />
                </div>
                <div>
                  <label className="field-label">E-MAIL *</label>
                  <input className="field-input" type="email" placeholder="funcionario@empresa.com.br" value={form.email} onChange={set("email")} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="field-label">MATRÍCULA</label>
                  <input className="field-input" placeholder="Ex: 00123456" value={form.matricula} onChange={set("matricula")} />
                </div>
                <div>
                  <label className="field-label">PERFIL</label>
                  <select className="field-input" value={form.perfil} onChange={set("perfil")} style={{ cursor: "pointer" }}>
                    <option value="funcionario">Funcionário</option>
                    <option value="rh">RH</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="field-label">SENHA TEMPORÁRIA *</label>
                <input className="field-input" type="password" placeholder="Mínimo 8 caracteres" value={form.senha} onChange={set("senha")} />
                <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>O usuário poderá alterar a senha após o primeiro acesso.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={fecharModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCriar} disabled={loading}>
                {loading ? "Criando..." : "Criar usuário"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal convite */}
      {modalAberto === "convite" && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Enviar convite</span>
              <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={fecharModal}>✕</button>
            </div>
            <div className="modal-body">
              {erro && <div style={{ background: "var(--red-50)", border: "0.5px solid var(--red-400)", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 13, color: "var(--red-800)" }}>{erro}</div>}
              <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.6 }}>
                O funcionário receberá um e-mail com um link para criar sua conta. O convite expira em 48 horas.
              </p>
              <div>
                <label className="field-label">E-MAIL DO FUNCIONÁRIO *</label>
                <input className="field-input" type="email" placeholder="funcionario@empresa.com.br" value={emailConvite} onChange={e => setEmailConvite(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={fecharModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleConvite} disabled={loading}>
                {loading ? "Enviando..." : "Enviar convite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}