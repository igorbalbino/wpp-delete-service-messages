# WhatsApp Service Filter

Aplicativo **local** para monitorar um grupo do WhatsApp e remover mensagens identificadas como **oferta de prestação de serviço**, preservando vagas de emprego, aluguel e compra/venda.

A configuração é feita por uma interface web em `http://localhost:3000`. Não há banco de dados nem IA externa.

## Requisitos

- Node.js **18+**
- Conta WhatsApp (será vinculada como dispositivo)
- A conta conectada precisa ser **administradora** do grupo para apagar mensagens de outros membros

## Instalação

```bash
npm install
```

Isso também instala as dependências do frontend (`web/`).

Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

## Variáveis de ambiente

```env
PORT=3000
DRY_RUN=true
```

| Variável  | Descrição |
|-----------|-----------|
| `PORT`    | Porta do painel e da API |
| `DRY_RUN` | Se `true`, detecta serviços mas **não apaga** (padrão seguro) |

O modo DRY RUN também pode ser alterado pelo painel (fica salvo em `data/config.json`).

## Desenvolvimento

Sobe a API (com reload) e o frontend Vite:

```bash
npm run dev
```

- API / painel em produção-like: `http://localhost:3000`
- Frontend Vite (com proxy): `http://localhost:5173`

Use qualquer uma das URLs; o Vite encaminha `/api` e `/ws` para a API.

## Build e execução local (produção)

```bash
npm run build
npm start
```

Ao iniciar, o terminal mostra algo como:

```text
WhatsApp Service Filter
──────────────────────────────

✓ Servidor iniciado

Painel:
http://localhost:3000
```

Abra a URL no navegador.

## Como usar

### 1. Conectar o WhatsApp

1. Abra o painel
2. Clique em **Gerar QR Code**
3. No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho
4. Escaneie o QR Code exibido **na interface** (não no terminal)

O status atualiza em tempo real. Depois da conexão, o painel mostra nome e número da conta.

A sessão fica salva em `auth/`. Reiniciar o app **não** exige novo QR enquanto a sessão for válida.

### 2. Escolher o grupo

1. Com o WhatsApp conectado, abra o select **Grupo monitorado**
2. Escolha o grupo
3. Clique em **Salvar**

O app guarda o **JID** e o nome em `data/config.json`. O monitoramento usa o JID (não o nome).

### 3. Monitoramento

O monitoramento fica **ativo** quando:

- WhatsApp está conectado, e
- um grupo está salvo

Somente mensagens desse grupo são analisadas. Mensagens privadas e de outros grupos são ignoradas.

### 4. DRY RUN

Com **DRY RUN ativo** (recomendado no início):

- o detector classifica as mensagens
- o histórico registra o que seria removido
- **nada é apagado**

Quando estiver confiante, desative o DRY RUN no painel (ou em `.env` com `DRY_RUN=false` e reinicie se preferir o default do env em instalação limpa).

### 5. Desconectar

Clique em **Desconectar**, confirme, e a sessão em `auth/` será limpa. A configuração do grupo em `data/config.json` **permanece**.

## Como funciona o detector

O módulo `src/services/serviceDetector.js` classifica o texto de forma **conservadora**:

- procura contexto de oferta (`faço`, `prestamos`, `serviços de`, etc.)
- **não** remove só porque apareceu a palavra “serviço” ou um ofício
- vagas, aluguel, compra e venda têm prioridade e são preservados
- em caso de dúvida: **não apaga**

Exemplos:

| Mensagem | Resultado |
|----------|-----------|
| Faço instalação elétrica | Serviço (pode remover) |
| Prestamos serviços de pintura | Serviço |
| Vaga para eletricista | Emprego — preserva |
| Alugo apartamento | Aluguel — preserva |
| Vendo ferramenta | Venda — preserva |
| Compro máquina usada | Compra — preserva |

Só remove quando `isService === true` **e** a confiança for ≥ `0.80`.

O detector usa frases, verbos de oferta, tipos de serviço e anúncios-catálogo
(vários serviços listados). “Vagas de terça a sexta” (horários) **não** é tratado
como vaga de emprego.

## Testes

```bash
npm test
```

Os testes cobrem normalização e classificação (serviço, emprego, aluguel, compra/venda).

## Estrutura

```text
src/                 Backend (Express + Baileys + detector)
web/                 Frontend React + Vite
data/                config.json e activity.json (criados em runtime)
auth/                Sessão WhatsApp (criada em runtime)
tests/               Testes do detector
```

## API local

Uso exclusivo do painel (localhost):

- `GET /api/status`
- `GET /api/groups`
- `GET /api/config`
- `PATCH /api/config`
- `POST /api/connect`
- `POST /api/disconnect`
- `POST /api/group`
- `GET /api/activity`
- WebSocket `ws://localhost:PORT/ws`

## Privacidade e segurança

- Não salva o texto completo das mensagens no histórico
- Não coloca tokens no frontend
- Credenciais ficam só em `auth/` (ignorado pelo Git)
- Pensado para uso **local** — não exponha a porta publicamente

## Solução de problemas

### QR Code não aparece / expirou

Clique em **Gerar novo QR Code** e escaneie novamente.

### Pediu QR de novo após reiniciar

A sessão em `auth/` pode ter expirado ou sido invalidada no celular (aparelhos conectados). Conecte novamente.

### Mensagens não são apagadas

1. Confirme que **DRY RUN** está desativado  
2. Confirme que a conta é **admin** do grupo  
3. Confirme que o grupo salvo é o correto  
4. Veja **Atividade recente** no painel  

### Conexão cai e reconecta

O app tenta reconectar automaticamente. O grupo configurado permanece. Se aparecer logout permanente, será preciso gerar um novo QR.

### Porta em uso

Altere `PORT` no `.env`.

### Frontend em branco com `npm start`

Rode `npm run build` antes do `start`, ou use `npm run dev` em desenvolvimento.

## Licença

Uso local / privado. Respeite os termos de uso do WhatsApp e as regras do grupo monitorado.
