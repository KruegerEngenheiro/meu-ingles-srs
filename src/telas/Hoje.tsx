import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { cartasDoDia, revisadasHoje } from '../fila';
import { getLimiteNovas, setLimiteNovas, getNovasHoje } from '../config';
import { Icon } from '../componentes/Icon';
import type { Tela } from '../App';

// Tela inicial: foco na acao principal (revisar) com progresso do dia.
export function Hoje({ onRevisar, irPara }: { onRevisar: () => void; irPara: (t: Tela) => void }) {
  const todas = useLiveQuery(() => db.cartas.toArray());
  const datasRevisoes = useLiveQuery(() => db.revisoes.orderBy('data').keys());
  const [limite, setLim] = useState(getLimiteNovas());
  const [abrirAjustes, setAbrirAjustes] = useState(false);

  if (!todas) return <div className="vazio">Carregando...</div>;

  const agora = Date.now();
  const pendentes = cartasDoDia(todas, agora);
  const feitasHoje = revisadasHoje((datasRevisoes as number[] | undefined) ?? [], agora);
  const totalDoDia = feitasHoje + pendentes.length;

  // Sem nenhuma carta cadastrada.
  if (todas.length === 0) {
    return (
      <div className="cartao vazio">
        <div className="emoji">📚</div>
        <h2 style={{ marginBottom: 8, fontWeight: 800 }}>Bora começar?</h2>
        <p style={{ marginBottom: 18 }}>
          Você ainda não tem palavras. Adicione as primeiras e o app monta suas revisões.
        </p>
        <button className="btn" onClick={() => irPara('adicionar')}>
          Adicionar palavras
        </button>
      </div>
    );
  }

  // Sem pendencias.
  if (pendentes.length === 0) {
    return (
      <div className="cartao vazio surgir">
        <div className="circulo-sucesso pop">
          <Icon nome="check" />
        </div>
        <h2 style={{ marginBottom: 8, fontWeight: 800 }}>Revisões de hoje concluídas!</h2>
        <p style={{ marginBottom: 18 }}>
          {feitasHoje > 0
            ? `Foram ${feitasHoje} ${feitasHoje === 1 ? 'carta revisada' : 'cartas revisadas'} hoje. Volte amanhã para manter o ritmo.`
            : 'Nada vencido por enquanto. Que tal adicionar palavras novas?'}
        </p>
        <button className="btn secundario" onClick={() => irPara('capturar')}>
          Capturar uma palavra
        </button>
      </div>
    );
  }

  const progresso = totalDoDia > 0 ? Math.round((feitasHoje / totalDoDia) * 100) : 0;

  return (
    <div>
      <div className="hero surgir">
        <div className="rot-topo">Revisões de hoje</div>
        <div className="num">{pendentes.length}</div>
        <div className="sub">{pendentes.length === 1 ? 'carta esperando por você' : 'cartas esperando por você'}</div>

        {feitasHoje > 0 && (
          <>
            <div className="barra-progresso" style={{ marginTop: 16 }}>
              <div style={{ width: `${progresso}%` }} />
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>
              {feitasHoje}/{totalDoDia} revisadas hoje
            </div>
          </>
        )}

        <button className="btn" onClick={onRevisar}>
          Iniciar revisão
        </button>
      </div>

      <div className="estat-grid">
        <div className="estat">
          <div className="numero-grande">{todas.length}</div>
          <div className="rot">palavras no total</div>
        </div>
        <div className="estat">
          <div className="numero-grande">{feitasHoje}</div>
          <div className="rot">revisadas hoje</div>
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 14 }}>
        <button
          onClick={() => setAbrirAjustes((v) => !v)}
          style={{
            background: 'none',
            border: 0,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--texto)',
            padding: 0
          }}
        >
          <span className="secao-titulo" style={{ marginBottom: 0 }}>
            Ritmo de estudo
          </span>
          <span style={{ color: 'var(--texto-fraco)', fontSize: 13, fontWeight: 700 }}>
            {limite}/dia {abrirAjustes ? '▲' : '▼'}
          </span>
        </button>

        {abrirAjustes && (
          <div className="surgir" style={{ marginTop: 14 }}>
            <div className="campo" style={{ marginBottom: 6 }}>
              <label>Palavras novas por dia</label>
              <input
                type="number"
                min={0}
                max={200}
                inputMode="numeric"
                value={limite}
                onChange={(e) => {
                  const n = Math.max(0, parseInt(e.target.value || '0', 10) || 0);
                  setLim(n);
                  setLimiteNovas(n);
                }}
              />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--texto-suave)', lineHeight: 1.5 }}>
              Hoje você já começou <strong>{getNovasHoje()}</strong> de <strong>{limite}</strong> novas. As
              revisões das palavras que você já viu aparecem sempre, sem limite.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
