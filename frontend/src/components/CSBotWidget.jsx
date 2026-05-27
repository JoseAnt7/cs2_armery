import { useState } from 'react';
import { useCSBot } from '../context/CSBotContext';
import { CSBotModal } from './CSBotModal';
import '../styles/csbot.css';

export function CSBotWidget() {
  const { active, ready, plan, monitoring, monitorResults } = useCSBot();
  const dealCount = monitorResults?.matches?.length ?? 0;
  const [modalOpen, setModalOpen] = useState(false);

  if (!ready || !active) return null;

  return (
    <>
      <button
        type="button"
        className="csbot-fab"
        onClick={() => setModalOpen(true)}
        title={
          monitoring
            ? `CSBot activo · ${dealCount} ofertas`
            : `CSBot · Plan ${plan?.name || ''}`
        }
        aria-label="Abrir CSBot"
      >
        <span className="csbot-fab__icon" aria-hidden>
          🔫
        </span>
        {monitoring && <span className="csbot-fab__badge">{dealCount}</span>}
        <span className={`csbot-fab__pulse ${monitoring ? 'csbot-fab__pulse--active' : ''}`} />
      </button>

      <CSBotModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
