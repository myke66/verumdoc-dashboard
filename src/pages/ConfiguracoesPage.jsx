import { useState } from "react";

export default function ConfiguracoesPage({ dark, toggleDark }) {
  return (
    <div style={{ maxWidth: 600 }}>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="card-title">Aparência</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 3 }}>Modo escuro</p>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>Alterna entre tema claro e escuro</p>
          </div>
          <Toggle value={dark} onChange={toggleDark} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="card-title">Notificações</p>
        {[
          { label: "Novos afastamentos", sub: "Alertar quando funcionário enviar atestado", defaultVal: true },
          { label: "Aprovações pendentes", sub: "Lembrete diário de afastamentos pendentes", defaultVal: true },
          { label: "Relatório semanal", sub: "Resumo de afastamentos toda segunda-feira", defaultVal: false },
        ].map((item, i, arr) => (
          <NotifRow key={i} label={item.label} sub={item.sub} defaultVal={item.defaultVal} border={i < arr.length - 1} />
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="card-title">Sistema</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <InfoRow label="Versão do sistema" value="2.1.0" />
          <InfoRow label="Backend" value="Firebase Firestore" />
          <InfoRow label="Storage" value="Firebase Storage" />
          <InfoRow label="Autenticação" value="Firebase Auth" />
          <InfoRow label="Ambiente" value="Produção" />
        </div>
      </div>

      <div className="card">
        <p className="card-title">Suporte</p>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
          Em caso de problemas técnicos, entre em contato com o administrador do sistema pelo e-mail <span style={{ color: "var(--blue-600)" }}>suporte@verumdoc.com.br</span> ou pelo ramal interno <strong>1234</strong>.
        </p>
      </div>

    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={onChange} style={{ width: 44, height: 26, borderRadius: 13, background: value ? "var(--blue-600)" : "var(--gray-200)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

function NotifRow({ label, sub, defaultVal, border }) {
  const [val, setVal] = useState(defaultVal);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: border ? "0.5px solid var(--border)" : "none" }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: "var(--text-3)" }}>{sub}</p>
      </div>
      <Toggle value={val} onChange={() => setVal(!val)} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--text-3)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{value}</span>
    </div>
  );
}

