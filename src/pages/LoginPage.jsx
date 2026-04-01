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
          <div className="login-logo-icon" style={{overflow:"hidden"}}><img src="data:image/png;base64,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" style={{width:"100%",height:"100%",objectFit:"contain"}} alt="Verumdoc"/></div>
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