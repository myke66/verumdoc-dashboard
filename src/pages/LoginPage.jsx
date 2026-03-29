import { useState } from "react";
import { loginRH } from "../services/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const buscarPerfil = async (email) => {
  const db   = getFirestore();
  const snap = await getDoc(doc(db, "usuarios", email));
  return snap.exists() ? snap.data() : null;
};

export default function LoginPage({ onLogin }) {
  const [email,  setEmail]  = useState("");
  const [senha,  setSenha]  = useState("");
  const [erro,   setErro]   = useState("");
  const [loading, setLoading] = useState(false);

  const ERROS = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/user-not-found":     "Usuário não encontrado.",
    "auth/wrong-password":     "Senha incorreta.",
    "auth/too-many-requests":  "Muitas tentativas. Tente mais tarde.",
    "auth/invalid-email":      "E-mail inválido.",
  };

  const handleLogin = async () => {
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setErro(""); setLoading(true);
    try {
      const cred = await loginRH(email, senha);

      // Verificar perfil no Firestore
      const perfil = await buscarPerfil(email);

      if (!perfil) {
        setErro("Usuário não cadastrado no sistema.");
        setLoading(false);
        return;
      }

      // Bloquear funcionários de acessar o painel RH
      if (perfil.perfil !== "rh") {
        setErro("Acesso negado. Este painel é exclusivo para o RH.");
        setLoading(false);
        return;
      }

      const iniciais = (perfil.nome || email).slice(0, 2).toUpperCase();
      onLogin({ email, iniciais, uid: cred.user.uid, nome: perfil.nome });

    } catch (e) {
      setErro(ERROS[e.code] || "Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", height: 40,
    border: "0.5px solid var(--border-md)",
    borderRadius: 8, padding: "0 12px",
    fontSize: 13, fontFamily: "var(--font)",
    outline: "none", background: "var(--gray-50)",
    color: "var(--text)",
  };

  const labelStyle = {
    display: "block", fontSize: 10, fontWeight: 600,
    color: "var(--text-3)", textTransform: "uppercase",
    letterSpacing: "0.06em", marginBottom: 5,
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--blue-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="7" width="18" height="12" rx="3" stroke="#B5D4F4" strokeWidth="1.4"/>
              <path d="M7 7V6C7 4.34 8.34 3 10 3H12C13.66 3 15 4.34 15 6V7" stroke="#B5D4F4" strokeWidth="1.4"/>
              <circle cx="11" cy="13" r="2.2" fill="#85B7EB"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Portal RH</p>
            <p style={{ fontSize: 11, color: "var(--text-3)" }}>Acesso exclusivo para Recursos Humanos</p>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>E-mail</label>
          <input style={inputStyle} type="email" placeholder="rh@verumdoc.com.br"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Senha</label>
          <input style={inputStyle} type="password" placeholder="••••••••"
            value={senha} onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>

        {erro && (
          <div style={{ background: "var(--red-50)", border: "0.5px solid var(--red-400)", borderRadius: 8, padding: "9px 12px", marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: "var(--red-800)" }}>{erro}</p>
          </div>
        )}

        <button className="btn btn-primary"
          style={{ width: "100%", height: 42, justifyContent: "center", fontSize: 13 }}
          onClick={handleLogin} disabled={loading}>
          {loading ? "Verificando acesso..." : "Entrar no painel"}
        </button>

        <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
          Acesso negado? Contate o administrador do sistema.
        </p>
      </div>
    </div>
  );
}
