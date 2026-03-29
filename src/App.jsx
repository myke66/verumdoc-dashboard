import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AfastamentosPage from "./pages/AfastamentosPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import PerfilPage from "./pages/PerfilPage";
import SobrePage from "./pages/SobrePage";
import { logoutRH, auth } from "./services/firebase";
import { solicitarPermissaoNotificacao, ouvirNotificacoes } from "./services/notificacoes";
import "./styles.css";

export default function App() {
  const [logado, setLogado]     = useState(false);
  const [usuario, setUsuario]   = useState(null);
  const [pagina, setPagina]     = useState("dashboard");
  const [loading, setLoading]   = useState(true);
  const [notifToast, setNotifToast] = useState(null);
  const [dark, setDark]         = useState(() => localStorage.getItem("dash-dark") === "true");

  const toggleDark = () => setDark(d => {
    localStorage.setItem("dash-dark", !d);
    return !d;
  });

  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  // Sessão persistente
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const db   = getFirestore();
          const snap = await getDoc(doc(db, "usuarios", user.email));
          const perfil = snap.exists() ? snap.data() : {};

          if (perfil.perfil !== "rh") {
            await logoutRH();
            setLoading(false);
            return;
          }

          setUsuario({ email: user.email, uid: user.uid, nome: perfil.nome || "RH", iniciais: (perfil.nome || user.email).slice(0, 2).toUpperCase() });
          setLogado(true);
        } catch {
          setLoading(false);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Notificações
  useEffect(() => {
    if (!logado || !usuario) return;
    if ("serviceWorker" in navigator) {
      solicitarPermissaoNotificacao(usuario.uid);
      const unsub = ouvirNotificacoes((payload) => {
        setNotifToast(payload.notification?.title || "Nova notificação");
        setTimeout(() => setNotifToast(null), 4000);
      });
      return unsub;
    }
  }, [logado, usuario]);

  const handleLogin  = (u) => { setUsuario(u); setLogado(true); };
  const handleLogout = async () => { await logoutRH(); setUsuario(null); setLogado(false); setPagina("dashboard"); };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--blue-900)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--blue-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="7" width="18" height="12" rx="3" stroke="#B5D4F4" strokeWidth="1.4"/>
              <circle cx="11" cy="13" r="2.2" fill="#85B7EB"/>
            </svg>
          </div>
          <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (!logado) return <LoginPage onLogin={handleLogin} />;

  const PAGINAS = {
    dashboard:    <DashboardPage />,
    afastamentos: <AfastamentosPage />,
    relatorios:   <RelatoriosPage dados={[]} />,
    configuracoes:<ConfiguracoesPage dark={dark} toggleDark={toggleDark} />,
    perfil:       <PerfilPage usuario={usuario} />,
    sobre:        <SobrePage />,
  };

  const TITULOS = {
    dashboard:    "Dashboard",
    afastamentos: "Afastamentos",
    relatorios:   "Relatórios",
    configuracoes:"Configurações",
    perfil:       "Perfil",
    sobre:        "Sobre o sistema",
  };

  return (
    <div className="layout">
      <Sidebar pagina={pagina} setPagina={setPagina} onLogout={handleLogout} />
      <div className="main">
        <Topbar titulo={TITULOS[pagina]} usuario={usuario} onLogout={handleLogout} setPagina={setPagina} />
        <div className="content">{PAGINAS[pagina]}</div>
      </div>
      {notifToast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: "#1a1a1a", color: "#fff", borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 10, animation: "toastIn 0.3s ease" }}>
          🔔 {notifToast}
        </div>
      )}
    </div>
  );
}

function Sidebar({ pagina, setPagina, onLogout }) {
  const nav = [
    { id: "dashboard",    label: "Dashboard",    icon: <IconDash /> },
    { id: "afastamentos", label: "Afastamentos", icon: <IconList /> },
    { id: "relatorios",   label: "Relatórios",   icon: <IconReport /> },
  ];
  const bottom = [
    { id: "configuracoes", label: "Configurações", icon: <IconConfig /> },
    { id: "perfil",        label: "Perfil",        icon: <IconPerfil /> },
    { id: "sobre",         label: "Sobre",         icon: <IconInfo /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="5" width="14" height="10" rx="2.5" stroke="#B5D4F4" strokeWidth="1.3"/>
            <path d="M6 5V4.5C6 3.4 6.9 2.5 8 2.5H10C11.1 2.5 12 3.4 12 4.5V5" stroke="#B5D4F4" strokeWidth="1.3"/>
            <circle cx="9" cy="10" r="2" fill="#85B7EB"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-logo-text">Portal RH</div>
          <div className="sidebar-logo-sub">Gestão de afastamentos</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 12px 6px" }}>Principal</p>
        {nav.map(i => (
          <button key={i.id} className={`nav-item ${pagina === i.id ? "active" : ""}`} onClick={() => setPagina(i.id)}>
            {i.icon} {i.label}
          </button>
        ))}

        <p style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "16px 12px 6px" }}>Sistema</p>
        {bottom.map(i => (
          <button key={i.id} className={`nav-item ${pagina === i.id ? "active" : ""}`} onClick={() => setPagina(i.id)}>
            {i.icon} {i.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={onLogout} style={{ color: "rgba(255,100,100,0.7)" }}>
          <IconLogout /> Sair
        </button>
      </div>
    </aside>
  );
}

function Topbar({ titulo, usuario, onLogout, setPagina }) {
  return (
    <header className="topbar">
      <span className="topbar-title">{titulo}</span>
      <div className="topbar-right">
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{usuario?.email}</span>
        <div className="avatar" style={{ cursor: "pointer" }} onClick={() => setPagina("perfil")} title="Perfil">
          {usuario?.iniciais || "RH"}
        </div>
      </div>
    </header>
  );
}

// ── Icons ──
const IconDash   = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>;
const IconList   = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const IconReport = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const IconConfig = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const IconPerfil = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14c0-2.76 2.69-5 6-5s6 2.24 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const IconInfo   = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 7.5v4M8 5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const IconLogout = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
