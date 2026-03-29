# Dashboard RH — Afastamentos

Painel web para o RH gerenciar afastamentos médicos enviados pelo app mobile.

## Como rodar

```bash
npm install
npm run dev
```

Acesse: http://localhost:5174

---

## Estrutura

```
src/
  App.jsx                  # Layout, sidebar, roteamento
  styles.css               # Estilos globais
  main.jsx                 # Entry point
  pages/
    LoginPage.jsx          # Login do RH
    DashboardPage.jsx      # Métricas, gráfico por mês, ranking
    AfastamentosPage.jsx   # Tabela completa, aprovar/recusar, exportar CSV
  services/
    firebase.js            # Integração Firebase (configurar)
    dados_mock.js          # Dados simulados para desenvolvimento
```

---

## Funcionalidades

- Login do RH
- Dashboard com métricas (total, pendentes, aprovados, dias)
- Gráfico de afastamentos por mês
- Ranking de funcionários com mais afastamentos
- Tabela com todos os afastamentos
- Busca por nome ou matrícula
- Filtro por status (todos / pendente / aprovado / recusado)
- Ver detalhes e foto do atestado
- Aprovar ou recusar afastamentos (com confirmação)
- Exportar relatório em CSV

---

## Integrando com Firebase (backend real)

### 1. Criar projeto no Firebase
Acesse console.firebase.google.com e crie um novo projeto.

### 2. Ativar serviços
- **Authentication** → Email/Senha
- **Firestore Database**
- **Storage** (para fotos dos atestados)

### 3. Configurar credenciais
Abra `src/services/firebase.js` e substitua o objeto `firebaseConfig` com os dados do seu projeto (disponíveis em Configurações do Projeto > Seus apps > SDK de configuração).

### 4. Estrutura do Firestore
Coleção: `afastamentos`
Cada documento deve ter:
```json
{
  "nome":        "João da Silva",
  "matricula":   "00123456",
  "dataInicio":  "2025-03-10",
  "dataFim":     "2025-03-17",
  "dias":        7,
  "cid":         "J06.9",
  "crm":         "12345-SP",
  "nomeMedico":  "Dra. Ana Paula",
  "status":      "pendente",
  "fotoUrl":     "afastamentos/id_do_documento/atestado.jpg",
  "criadoEm":    "Timestamp"
}
```

### 5. Ativar Firebase no app mobile
No `portal-afastamento` (app mobile), instale o Firebase e use as mesmas credenciais para salvar os afastamentos no Firestore e as fotos no Storage.

### 6. Trocar mock por Firebase no dashboard
Em `AfastamentosPage.jsx`, substitua:
```js
const [dados, setDados] = useState(MOCK_AFASTAMENTOS);
```
Por:
```js
useEffect(() => {
  const unsub = listarAfastamentos(setDados);
  return unsub;
}, []);
```

---

## Exportação

O botão "Exportar CSV" gera um arquivo `.csv` compatível com Excel com todos os afastamentos filtrados. Para exportar em Excel (.xlsx), instale a biblioteca `xlsx`:
```bash
npm install xlsx
```
