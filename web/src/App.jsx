import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

const CATEGORY_LABELS = {
  service: 'Serviço detectado',
  job: 'Vaga de emprego',
  rental: 'Aluguel',
  sale: 'Venda',
  purchase: 'Compra',
  unknown: 'Outro',
};

function actionLabel(action) {
  if (action === 'removed') return { text: 'Removido', className: 'removed' };
  if (action === 'ignored_dry_run') return { text: 'Ignorado (DRY RUN)', className: 'dry' };
  return { text: 'Ignorado', className: 'ignored' };
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

function wsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Falha na requisição');
  return data;
}

function statusMeta(status) {
  switch (status) {
    case 'connected':
      return { label: 'Conectado', dot: 'ok' };
    case 'qr':
      return { label: 'Aguardando leitura do QR Code...', dot: 'warn' };
    case 'connecting':
      return { label: 'Conectando...', dot: 'warn' };
    case 'reconnecting':
      return { label: 'Conexão perdida — tentando reconectar...', dot: 'warn' };
    default:
      return { label: 'Desconectado', dot: 'danger' };
  }
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [activity, setActivity] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const refreshGroups = useCallback(async () => {
    try {
      const list = await api('/api/groups');
      setGroups(list);
    } catch {
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    let closed = false;
    let socket;
    let retryTimer;

    const connectWs = () => {
      socket = new WebSocket(wsUrl());
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'status') setStatus(payload.data);
          if (payload.type === 'activity') setActivity(payload.data || []);
        } catch {
          // ignore
        }
      };
      socket.onclose = () => {
        if (!closed) {
          retryTimer = setTimeout(connectWs, 2000);
        }
      };
    };

    connectWs();

    api('/api/status')
      .then(setStatus)
      .catch(() => {});
    api('/api/activity')
      .then(setActivity)
      .catch(() => {});

    return () => {
      closed = true;
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);

  useEffect(() => {
    if (status?.connected) {
      refreshGroups();
    } else {
      setGroups([]);
    }
  }, [status?.connected, refreshGroups]);

  useEffect(() => {
    if (status?.group?.jid) {
      setSelectedGroup(status.group.jid);
    }
  }, [status?.group?.jid]);

  useEffect(() => {
    let cancelled = false;
    async function renderQr() {
      if (!status?.qr) {
        setQrDataUrl(null);
        return;
      }
      try {
        const url = await QRCode.toDataURL(status.qr, {
          width: 280,
          margin: 1,
          color: { dark: '#1a211c', light: '#ffffff' },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    }
    renderQr();
    return () => {
      cancelled = true;
    };
  }, [status?.qr]);

  const meta = useMemo(() => statusMeta(status?.status), [status?.status]);

  async function handleConnect(forceQr = false) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api('/api/connect', {
        method: 'POST',
        body: JSON.stringify({ forceQr }),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Desconectar o WhatsApp e limpar a sessão salva?')) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api('/api/disconnect', { method: 'POST', body: '{}' });
      setMessage('WhatsApp desconectado.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveGroup() {
    if (!selectedGroup) {
      setError('Selecione um grupo.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const group = groups.find((g) => g.jid === selectedGroup);
      await api('/api/group', {
        method: 'POST',
        body: JSON.stringify({
          groupJid: selectedGroup,
          groupName: group?.name,
        }),
      });
      setMessage('✓ Grupo salvo');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDryRunToggle(next) {
    setBusy(true);
    setError(null);
    try {
      await api('/api/config', {
        method: 'PATCH',
        body: JSON.stringify({ dryRun: next }),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const monitoringBanner = (() => {
    if (!status) return null;
    if (status.connected && status.group) {
      return (
        <div className="banner ok">
          ● Monitoramento ativo
          <div className="muted" style={{ marginTop: 4, color: 'inherit', opacity: 0.9 }}>
            Grupo: {status.group.name}
          </div>
        </div>
      );
    }
    if (status.connected && !status.group) {
      return (
        <div className="banner warn">
          ⚠ Nenhum grupo selecionado
          <div style={{ marginTop: 4 }}>Selecione um grupo para iniciar o monitoramento.</div>
        </div>
      );
    }
    if (!status.connected && status.group) {
      return (
        <div className="banner warn">
          ● WhatsApp desconectado
          <div style={{ marginTop: 4 }}>Monitoramento pausado.</div>
        </div>
      );
    }
    return (
      <div className="banner info">
        Conecte o WhatsApp e escolha um grupo para começar.
      </div>
    );
  })();

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>WhatsApp Service Filter</h1>
          <p>
            Monitore um grupo e remova ofertas de prestação de serviço, preservando
            vagas, aluguel e compra/venda.
          </p>
        </div>
      </header>

      <div className="grid">
        <section className="card stack">
          <h2>WhatsApp</h2>

          <div className="row">
            <span className={`status-dot ${meta.dot}`} />
            <strong>{meta.label}</strong>
          </div>

          {status?.status === 'reconnecting' && (
            <div className="banner warn">⚠ Conexão perdida — tentando reconectar...</div>
          )}

          {status?.connected && status.account && (
            <div className="account-meta">
              <strong>{status.account.name}</strong>
              <span className="muted">{status.account.number || 'Número indisponível'}</span>
            </div>
          )}

          {!status?.connected && status?.status !== 'qr' && status?.status !== 'connecting' && (
            <p className="muted" style={{ margin: 0 }}>
              WhatsApp não conectado. Conecte sua conta para começar.
            </p>
          )}

          {status?.status === 'qr' && (
            <div className="qr-wrap">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code do WhatsApp" />
              ) : (
                <p className="muted">Gerando QR Code...</p>
              )}
              <div>
                <strong>Abra o WhatsApp no celular</strong>
                <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                  e escaneie este código.
                </p>
              </div>
            </div>
          )}

          <div className="row">
            {!status?.connected && (
              <button
                className="btn btn-primary"
                disabled={busy || status?.status === 'connecting'}
                onClick={() => handleConnect(status?.status === 'qr')}
              >
                {status?.status === 'qr' ? 'Gerar novo QR Code' : 'Gerar QR Code'}
              </button>
            )}
            {status?.connected && (
              <button className="btn btn-danger" disabled={busy} onClick={handleDisconnect}>
                Desconectar
              </button>
            )}
          </div>
        </section>

        <section className="card stack">
          <h2>Status do monitoramento</h2>
          {monitoringBanner}

          {status?.connected && (
            <div className="banner info" style={{ margin: 0 }}>
              ● WhatsApp conectado
              {status.group ? (
                <>
                  <div style={{ marginTop: 6 }}>● Grupo monitorado</div>
                  <div className="muted">{status.group.name}</div>
                </>
              ) : null}
            </div>
          )}
        </section>

        <section className="card stack">
          <h2>Grupo monitorado</h2>
          {!status?.connected ? (
            <p className="muted" style={{ margin: 0 }}>
              Conecte o WhatsApp para listar os grupos disponíveis.
            </p>
          ) : (
            <>
              <p className="muted" style={{ margin: 0 }}>
                Selecione o grupo que deverá ser moderado:
              </p>
              <select
                className="select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="">Selecione um grupo</option>
                {groups.map((g) => (
                  <option key={g.jid} value={g.jid}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className="row">
                <button className="btn btn-primary" disabled={busy} onClick={handleSaveGroup}>
                  Salvar
                </button>
                <button className="btn btn-secondary" disabled={busy} onClick={refreshGroups}>
                  Atualizar lista
                </button>
              </div>
              {status.group && (
                <div className="banner ok">
                  ✓ Grupo salvo
                  <div style={{ marginTop: 4 }}>Grupo monitorado: {status.group.name}</div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="card stack">
          <h2>Modo de teste</h2>
          <div className="toggle">
            <div>
              <div style={{ fontWeight: 700 }}>
                {status?.dryRun ? 'DRY RUN ATIVO' : 'DRY RUN DESATIVADO'}
              </div>
              <div style={{ fontSize: '0.9rem', marginTop: 4 }}>
                {status?.dryRun
                  ? 'As mensagens detectadas não serão apagadas.'
                  : 'Mensagens de serviço com alta confiança serão removidas.'}
              </div>
            </div>
            <label>
              <input
                type="checkbox"
                checked={Boolean(status?.dryRun)}
                disabled={busy || !status}
                onChange={(e) => handleDryRunToggle(e.target.checked)}
              />
              Ativo
            </label>
          </div>
        </section>

        <section className="card stack span-2">
          <h2>Atividade recente</h2>
          {message && <div className="banner ok">{message}</div>}
          {error && <div className="banner warn">{error}</div>}
          {activity.length === 0 ? (
            <p className="empty">Nenhuma atividade registrada ainda.</p>
          ) : (
            <ul className="activity">
              {activity.map((item) => {
                const action = actionLabel(item.action);
                return (
                  <li key={item.id}>
                    <span className="time">{formatTime(item.time)}</span>
                    <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                    <span className={`pill ${action.className}`}>{action.text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
