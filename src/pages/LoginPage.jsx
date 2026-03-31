import { useState } from "react";
import { loginRH } from "../services/api";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "../services/firebase";

export default function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [senha,    setSenha]    = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro,     setErro]     = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !senha) { setErro("Preencha todos os campos."); return; }
    setErro(""); setLoading(true);

    // 1. Tenta login pela nova API (usuários novos)
    try {
      const dados = await loginRH(email, senha);
      if (dados.usuario.perfil === "funcionario") {
        setErro("Acesso exclusivo para RH. Use o app mobile.");
        setLoading(false); return;
      }
      // Marca como usuário da nova API
      localStorage.setItem("verumdoc-api-v2", "true");
      onLogin(dados);
      return;
    } catch {
      // Se falhar na nova API, tenta Firebase (usuários legados)
    }

    // 2. Fallback: Firebase Auth (usuários legados)
    try {
      const cred   = await signInWithEmailAndPassword(auth, email, senha);
      const db     = getFirestore();
      const snap   = await getDoc(doc(db, "usuarios", email));
      const perfil = snap.exists() ? snap.data() : {};

      if (perfil.perfil !== "rh") {
        setErro("Acesso exclusivo para RH. Use o app mobile.");
        setLoading(false); return;
      }

      // Marca como usuário legado (Firebase)
      localStorage.removeItem("verumdoc-api-v2");
      localStorage.removeItem("verumdoc-token");

      onLogin({
        usuario: {
          id:     cred.user.uid,
          nome:   perfil.nome || "RH",
          email,
          perfil: "rh",
        },
        empresa: { id: null, nome: "" },
        firebase: true,
      });
    } catch (err) {
      setErro("E-mail ou senha incorretos.");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="7" width="14" height="14" rx="2.5" stroke="#B5D4F4" strokeWidth="1.5"/>
              <path d="M7 7V6C7 4.34 8.34 3 10 3H13C14.66 3 16 4.34 16 6V7" stroke="#B5D4F4" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="20" cy="19" r="4" fill="#1D9E75"/>
              <path d="M18 19l1.5 1.5L22 17" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="login-logo-nome">Verumdoc</div>
            <div className="login-logo-sub">Portal RH</div>
          </div>
        </div>

        <h1 className="login-titulo">Bem-vindo</h1>
        <p className="login-sub">Acesse com suas credenciais corporativas</p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="field-label">E-MAIL</label>
            <input className="field-input" type="email" placeholder="rh@empresa.com.br"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="field-label">SENHA</label>
            <div style={{ position: "relative" }}>
              <input className="field-input" type={verSenha ? "text" : "password"}
                placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)}
                style={{ paddingRight: 44 }} autoComplete="current-password" />
              <button type="button" onClick={() => setVerSenha(!verSenha)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 16 }}>
                {verSenha ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {erro && (
            <div style={{ background: "var(--red-50)", border: "0.5px solid var(--red-400)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 13, color: "var(--red-800)" }}>{erro}</p>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ height: 44, marginTop: 4 }} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", marginTop: 20 }}>
          Ainda não tem conta?{" "}
          <a href="https://verumdoc.com.br#cadastro" style={{ color: "var(--blue-600)", fontWeight: 600 }}>
            Cadastre sua empresa
          </a>
        </p>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
          suporte@verumdoc.com.br
        </p>
      </div>
    </div>
  );
}