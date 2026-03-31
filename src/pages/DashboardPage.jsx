import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { listarAfastamentosHibrido } from "../services/dados";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function DashboardPage() {
  const [dados, setDados]           = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregou, setCarregou]     = useState(false);

  useEffect(() => {
    const unsub = listarAfastamentosHibrido((lista) => {
      setDados(lista);
      setCarregando(false);
      setCarregou(true);
    });
    return unsub;
  }, []);

  // Separar aprovados/pendentes dos recusados
  const validos   = dados.filter(d => d.status !== "recusado");
  const recusados = dados.filter(d => d.status === "recusado");

  const total     = dados.length;
  const pendentes = dados.filter(d => d.status === "pendente").length;
  const aprovados = dados.filter(d => d.status === "aprovado").length;
  const totalRec  = recusados.length;

  // Total de dias só de válidos (sem recusados)
  const totalDias = validos.reduce((s, d) => s + (Number(d.dias) || 0), 0);

  // Gráfico por mês — só válidos
  const porMes = useMemo(() => {
    const mapa = {};
    validos.forEach(d => {
      let m;
      if (d.dataInicio?.toDate) m = d.dataInicio.toDate().getMonth();
      else if (typeof d.dataInicio === "string" && d.dataInicio.includes("-")) m = parseInt(d.dataInicio.split("-")[1]) - 1;
      if (m !== undefined) mapa[m] = (mapa[m] || 0) + 1;
    });
    return MESES.map((nome, i) => ({ nome, total: mapa[i] || 0 }));
  }, [validos]);

  // Ranking — só válidos
  const ranking = useMemo(() => {
    const mapa = {};
    validos.forEach(d => {
      const key = d.email || d.matricula || "?";
      if (!mapa[key]) mapa[key] = { nome: d.nome || "-", matricula: d.matricula || "-", count: 0, dias: 0 };
      mapa[key].count++;
      mapa[key].dias += Number(d.dias) || 0;
    });
    return Object.values(mapa).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [validos]);

  // Gráfico de recusados por mês
  const porMesRecusados = useMemo(() => {
    const mapa = {};
    recusados.forEach(d => {
      let m;
      if (d.dataInicio?.toDate) m = d.dataInicio.toDate().getMonth();
      else if (typeof d.dataInicio === "string" && d.dataInicio.includes("-")) m = parseInt(d.dataInicio.split("-")[1]) - 1;
      if (m !== undefined) mapa[m] = (mapa[m] || 0) + 1;
    });
    return MESES.map((nome, i) => ({ nome, total: mapa[i] || 0 }));
  }, [recusados]);

  const maxCount = ranking[0]?.count || 1;
  const medalha  = (i) => i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";

  if (carregando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 12, flexDirection: "column" }}>
        <div style={{ width: 24, height: 24, border: "2.5px solid var(--blue-400)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: 13, color: "var(--text-3)" }}>Carregando dados...</span>
      </div>
    );
  }

  if (carregou && total === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, flexDirection: "column", gap: 12 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="14" width="32" height="26" rx="4" stroke="var(--gray-300)" strokeWidth="2"/>
          <path d="M16 14V11C16 8.79 17.79 7 20 7H28C30.21 7 32 8.79 32 11V14" stroke="var(--gray-300)" strokeWidth="2"/>
          <path d="M18 26h12M18 32h8" stroke="var(--gray-300)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p style={{ fontSize: 14, color: "var(--text-3)", textAlign: "center" }}>
          Nenhum afastamento registrado ainda.<br/>
          <span style={{ fontSize: 12 }}>Os dados aparecerão aqui quando funcionários enviarem atestados pelo app.</span>
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Métricas — 5 cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        <MetricCard label="Total de solicitações" value={total} sub="aprovados, pendentes e recusados" color="var(--blue-50)">
          <IconDoc color="var(--blue-600)" />
        </MetricCard>
        <MetricCard label="Pendentes" value={pendentes} sub="aguardando análise" color="var(--amber-50)">
          <IconClock color="var(--amber-400)" />
        </MetricCard>
        <MetricCard label="Aprovados" value={aprovados} sub="afastamentos válidos" color="var(--green-50)">
          <IconCheck color="var(--green-400)" />
        </MetricCard>
        <MetricCard label="Total de dias" value={totalDias} sub="excluindo recusados" color="var(--blue-50)">
          <IconCal color="var(--blue-400)" />
        </MetricCard>
        <MetricCard label="Recusados" value={totalRec} sub="não contabilizados" color="var(--red-50)" textColor="var(--red-400)">
          <IconRec color="var(--red-400)" />
        </MetricCard>
      </div>



      {/* Linha 1: Afastamentos por mês + Ranking */}
      <div className="charts-row" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="card-title">Afastamentos por mês</p>
          {porMes.every(m => m.total === 0) ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 13 }}>Dados insuficientes</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMes} barSize={22} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "0.5px solid var(--border-md)", fontSize: 12, boxShadow: "none" }} cursor={{ fill: "var(--gray-100)" }} formatter={(v) => [v, "Afastamentos"]} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {porMes.map((entry, i) => <Cell key={i} fill={entry.total > 0 ? "var(--blue-400)" : "var(--gray-100)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <p className="card-title">Funcionários com mais afastamentos</p>
          {ranking.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "20px 0" }}>Nenhum dado disponível</p>
          ) : ranking.map((r, i) => (
            <div key={r.matricula} className="rank-item">
              <div className={`rank-num ${medalha(i)}`}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div className="rank-name">{r.nome}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{r.dias} dias no total</div>
                <div className="rank-bar-wrap" style={{ marginTop: 5 }}>
                  <div className="rank-bar" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                </div>
              </div>
              <div className="rank-count">{r.count}</div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}

function MetricCard({ label, value, sub, color, textColor, children }) {
  return (
    <div className="metric-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <p className="metric-label">{label}</p>
        <div className="metric-icon" style={{ background: color }}>{children}</div>
      </div>
      <p className="metric-value" style={{ color: textColor || undefined }}>{value}</p>
      <p className="metric-sub">{sub}</p>
    </div>
  );
}

const IconDoc   = ({ color }) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 2h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={color} strokeWidth="1.3"/><path d="M11 2v4h4" stroke={color} strokeWidth="1.3"/></svg>;
const IconClock = ({ color }) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.3"/><path d="M9 5.5V9l2.5 2.5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>;
const IconCheck = ({ color }) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.3"/><path d="M5.5 9l2.5 2.5L13 6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconRec   = ({ color }) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.3"/><path d="M6 6l6 6M12 6l-6 6" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>;
const IconCal   = ({ color }) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="1.3"/><path d="M6 2v3M12 2v3M2 8h14" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>;