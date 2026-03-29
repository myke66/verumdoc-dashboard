export default function PerfilPage({ usuario }) {
  return (
    <div style={{ maxWidth: 500 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--blue-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: "var(--blue-800)" }}>
            {usuario?.iniciais || "RH"}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{usuario?.nome || "Recursos Humanos"}</p>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>Administrador do sistema</p>
          </div>
        </div>

        <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "E-mail",  value: usuario?.email || "-" },
            { label: "Perfil",  value: "RH — Acesso total" },
            { label: "Sistema", value: "Portal de Afastamento v2.1.0" },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 13, color: "var(--text)" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="card-title">Segurança</p>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 14 }}>
          Para alterar sua senha, acesse o painel do Firebase Authentication ou entre em contato com o administrador do sistema.
        </p>
        <div style={{ background: "var(--blue-50)", borderRadius: 8, padding: "10px 12px", border: "0.5px solid var(--blue-100)" }}>
          <p style={{ fontSize: 12, color: "var(--blue-800)" }}>
            Sua sessão é mantida automaticamente. Para sair, use o botão <strong>"Sair"</strong> no menu lateral.
          </p>
        </div>
      </div>
    </div>
  );
}
