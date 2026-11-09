import { useEffect, useMemo, useState } from 'react';
import { db, responderCarta } from '../db';
import { cartasDoDia } from '../fila';
import { previas } from '../sm2';
import { incNovasHoje } from '../config';
import { formatarQuando } from '../utils/datas';
import { Icon } from '../componentes/Icon';
import type { Carta, Nota } from '../types';

interface Resultado {
  ingles: string;
  dueDate: number;
  acertou: boolean;
}

// Modo de revisao: uma carta por vez, revelacao em camadas e avaliacao.
export function Revisao({ onFim, toast }: { onFim: () => void; toast: (m: string) => void }) {
  const [fila, setFila] = useState<Carta[] | null>(null);
  const [i, setI] = useState(0);
  const [revelou, setRevelou] = useState(false);
  const [verMais, setVerMais] = useState(false);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const todas = await db.cartas.toArray();
      const q = cartasDoDia(todas);
      if (vivo) setFila(q);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const carta = fila && i < fila.length ? fila[i] : null;
  const previsoes = useMemo(() => (carta ? previas(carta) : null), [carta]);

  if (!fila) return <div className="vazio">Carregando...</div>;

  // ---- Fim da sessao ----
  if (i >= fila.length) {
    const acertos = resultados.filter((r) => r.acertou).length;
    const erros = resultados.length - acertos;
    return (
      <div>
        <div className="cartao" style={{ textAlign: 'center' }}>
          <div className="circulo-sucesso pop">
            <Icon nome="check" />
          </div>
          <h2 style={{ marginBottom: 6, fontSize: 22, fontWeight: 800 }}>Sessão concluída!</h2>
          <p style={{ color: 'var(--texto-suave)', marginBottom: 18 }}>
            {resultados.length === 0
              ? 'Nenhuma carta para revisar agora.'
              : `Você revisou ${resultados.length} ${resultados.length === 1 ? 'carta' : 'cartas'}. Bom trabalho!`}
          </p>
          <div className="estat-grid">
            <div className="estat">
              <div className="numero-grande" style={{ color: 'var(--verde)' }}>
                {acertos}
              </div>
              <div className="rot">acertos</div>
            </div>
            <div className="estat">
              <div className="numero-grande" style={{ color: 'var(--vermelho)' }}>
                {erros}
              </div>
              <div className="rot">a reforçar</div>
            </div>
          </div>
          <button className="btn" style={{ marginTop: 18 }} onClick={onFim}>
            Voltar ao início
          </button>
        </div>

        {resultados.length > 0 && (
          <div className="cartao">
            <div className="secao-titulo">Próximas revisões</div>
            {resultados.map((r, idx) => (
              <div className="item" key={idx} style={{ boxShadow: 'none' }}>
                <div className="en">{r.ingles}</div>
                <div className="acoes">
                  <span className={`selo ${r.acertou ? 'revisao' : 'dificil'}`}>{formatarQuando(r.dueDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  async function avaliar(nota: Nota) {
    if (!carta || salvando) return;
    setSalvando(true);
    try {
      const proxima = previsoes ? previsoes[nota] : Date.now();
      const eraNova = carta.status === 'nova';
      await responderCarta(carta, nota);
      if (eraNova) incNovasHoje();
      setResultados((r) => [...r, { ingles: carta.ingles, dueDate: proxima, acertou: nota !== 'errei' }]);
      setRevelou(false);
      setVerMais(false);
      setI((n) => n + 1);
    } catch {
      toast('Não consegui salvar. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  const c = carta!;
  const temExtras =
    (c.meanings && c.meanings.length > 1) ||
    (c.collocations && c.collocations.length > 0) ||
    (c.synonyms && c.synonyms.length > 0) ||
    (c.antonyms && c.antonyms.length > 0) ||
    !!c.usageNotes;

  return (
    <div>
      {/* topo: sair + progresso + contador */}
      <div className="rev-topo">
        <button className="sair" onClick={onFim} aria-label="Sair">
          <Icon nome="voltar" size={20} />
        </button>
        <div className="barra-progresso">
          <div style={{ width: `${(i / fila.length) * 100}%` }} />
        </div>
        <span className="contador">
          {i + 1}/{fila.length}
        </span>
      </div>

      <div className="carta-rev">
        {c.tags.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            {c.tags.slice(0, 3).map((t) => (
              <span className="chip" key={t}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="revisao-palavra">{c.ingles}</div>

        {!revelou ? (
          <button className="btn btn-mostrar" onClick={() => setRevelou(true)}>
            Mostrar resposta
          </button>
        ) : (
          <div className="surgir">
            <div className="divisor" />
            <div className="revisao-traducao">{c.portugues}</div>

            {(c.partOfSpeech || c.ipa || c.pronunciationHintPtBr) && (
              <div className="linha-pron">
                {c.partOfSpeech && <span className="chip">{c.partOfSpeech}</span>}
                {c.ipa && <span className="ipa">{c.ipa}</span>}
                {c.pronunciationHintPtBr && <span className="hint">({c.pronunciationHintPtBr})</span>}
              </div>
            )}

            {(c.exemplo || c.exemploTraducao) && (
              <div className="revisao-exemplo">
                {c.exemplo && <div className="ex-en">{c.exemplo}</div>}
                {c.exemploTraducao && <div className="ex-pt">{c.exemploTraducao}</div>}
              </div>
            )}

            {c.dailyUsage && (
              <div className="como-usar">
                <strong>Como usar: </strong>
                {c.dailyUsage}
              </div>
            )}

            {temExtras && (
              <>
                <button className="btn-link" onClick={() => setVerMais((v) => !v)}>
                  {verMais ? 'Ocultar detalhes' : 'Ver mais detalhes'}
                </button>
                {verMais && (
                  <div className="surgir">
                    {c.meanings && c.meanings.length > 1 && (
                      <div style={{ marginBottom: 10 }}>
                        <div className="mini-rot">Significados</div>
                        {c.meanings.map((m, idx) => (
                          <div key={idx} style={{ fontSize: 14, marginBottom: 4 }}>
                            <strong>
                              {idx + 1}. {m.translation}
                            </strong>
                            {m.definitionPtBr && <div style={{ color: 'var(--texto-suave)' }}>{m.definitionPtBr}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {c.collocations && c.collocations.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div className="mini-rot">Combinações comuns</div>
                        {c.collocations.map((x) => (
                          <span className="chip" key={x}>
                            {x}
                          </span>
                        ))}
                      </div>
                    )}
                    {c.synonyms && c.synonyms.length > 0 && (
                      <div style={{ fontSize: 13, marginBottom: 4 }}>
                        <strong style={{ color: 'var(--verde)' }}>Sinônimos: </strong>
                        {c.synonyms.join(', ')}
                      </div>
                    )}
                    {c.antonyms && c.antonyms.length > 0 && (
                      <div style={{ fontSize: 13, marginBottom: 4 }}>
                        <strong style={{ color: 'var(--vermelho)' }}>Antônimos: </strong>
                        {c.antonyms.join(', ')}
                      </div>
                    )}
                    {c.usageNotes && (
                      <div style={{ fontSize: 13, color: 'var(--texto-suave)', marginTop: 6 }}>
                        <strong>Observação: </strong>
                        {c.usageNotes}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {revelou && previsoes && (
        <div className="notas surgir">
          <button className="nota-btn errei" disabled={salvando} onClick={() => avaliar('errei')}>
            Errei
            <small>{formatarQuando(previsoes.errei)}</small>
          </button>
          <button className="nota-btn dificil" disabled={salvando} onClick={() => avaliar('dificil')}>
            Difícil
            <small>{formatarQuando(previsoes.dificil)}</small>
          </button>
          <button className="nota-btn bom" disabled={salvando} onClick={() => avaliar('bom')}>
            Bom
            <small>{formatarQuando(previsoes.bom)}</small>
          </button>
          <button className="nota-btn facil" disabled={salvando} onClick={() => avaliar('facil')}>
            Fácil
            <small>{formatarQuando(previsoes.facil)}</small>
          </button>
        </div>
      )}
    </div>
  );
}
