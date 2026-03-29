export default function SobrePage() {
  return (
    <div style={{ maxWidth: 500 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--blue-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="7" width="18" height="12" rx="3" stroke="#B5D4F4" strokeWidth="1.4"/>
              <path d="M7 7V6C7 4.34 8.34 3 10 3H12C13.66 3 15 4.34 15 6V7" stroke="#B5D4F4" strokeWidth="1.4"/>
              <circle cx="11" cy="13" r="2.2" fill="#85B7EB"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>Portal RH</p>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>Gestão de afastamentos médicos</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Versão",         value: "2.1.0" },
            { label: "Lançamento",     value: "2025" },
            { label: "Backend",        value: "Firebase (Google Cloud)" },
            { label: "Autenticação",   value: "Firebase Auth" },
            { label: "Banco de dados", value: "Firestore" },
            { label: "Armazenamento",  value: "Firebase Storage" },
            { label: "Notificações",   value: "Firebase Cloud Messaging" },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="card-title">Sobre o sistema</p>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
          O Portal de Afastamento é um sistema integrado de gestão de afastamentos médicos que conecta funcionários e o departamento de Recursos Humanos. O app mobile permite que funcionários registrem atestados de forma rápida e segura, enquanto o painel web oferece ao RH controle completo sobre os registros.
        </p>
      </div>

      <div className="card">
        <p className="card-title">Conformidade</p>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
          Este sistema está em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong> e com as obrigações trabalhistas previstas na CLT. Todos os dados são tratados com base legal adequada e armazenados com segurança.
        </p>
      </div>
    </div>
  );
}
