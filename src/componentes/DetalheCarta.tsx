import type { Carta } from '../types';

// Mostra os detalhes ricos de uma carta (pronuncia, significados, exemplo, dica de uso e,
// opcionalmente, collocations/sinonimos/antonimos/observacoes). Reusado na revisao e na edicao.
export function DetalheCarta({ carta, mostrarExtras = true }: { carta: Carta; mostrarExtras?: boolean }) {
  const temExtras =
    (carta.collocations && carta.collocations.length > 0) ||
    (carta.synonyms && carta.synonyms.length > 0) ||
    (carta.antonyms && carta.antonyms.length > 0) ||
    !!carta.usageNotes;

  return (
    <div>
      {/* Classe gramatical, nivel e pronuncia */}
      {(carta.partOfSpeech || carta.cefr || carta.ipa || carta.pronunciationHintPtBr) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 4 }}>
          {carta.partOfSpeech && <span className="chip">{carta.partOfSpeech}</span>}
          {carta.cefr && <span className="selo revisao">{carta.cefr}</span>}
          {carta.ipa && <span style={{ color: 'var(--texto-suave)', fontSize: 15 }}>{carta.ipa}</span>}
          {carta.pronunciationHintPtBr && (
            <span style={{ color: 'var(--texto-suave)', fontSize: 14, fontStyle: 'italic' }}>
              ({carta.pronunciationHintPtBr})
            </span>
          )}
        </div>
      )}

      {/* Significados (quando ha mais de um sentido) */}
      {carta.meanings && carta.meanings.length > 1 && (
        <div style={{ marginTop: 14 }}>
          <div className="secao-titulo" style={{ marginBottom: 6 }}>Significados</div>
          {carta.meanings.map((m, i) => (
            <div key={i} style={{ fontSize: 14, marginBottom: 6 }}>
              <strong>{i + 1}. {m.translation}</strong>
              {m.definitionPtBr && <div style={{ color: 'var(--texto-suave)' }}>{m.definitionPtBr}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Exemplo */}
      {(carta.exemplo || carta.exemploTraducao) && (
        <div className="revisao-exemplo">
          {carta.exemplo && <div>{carta.exemplo}</div>}
          {carta.exemploTraducao && (
            <div style={{ color: 'var(--texto-suave)', marginTop: 4 }}>{carta.exemploTraducao}</div>
          )}
        </div>
      )}

      {/* Dica de uso no dia a dia */}
      {carta.dailyUsage && (
        <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--azul)' }}>Como usar: </strong>
          {carta.dailyUsage}
        </div>
      )}

      {/* Extras (podem ser ocultados na revisao) */}
      {mostrarExtras && temExtras && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--borda)', paddingTop: 12 }}>
          {carta.collocations && carta.collocations.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--texto-suave)', marginBottom: 4 }}>Combinações comuns</div>
              {carta.collocations.map((c) => (
                <span className="chip" key={c}>{c}</span>
              ))}
            </div>
          )}
          {carta.synonyms && carta.synonyms.length > 0 && (
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              <strong style={{ color: 'var(--verde)' }}>Sinônimos: </strong>
              {carta.synonyms.join(', ')}
            </div>
          )}
          {carta.antonyms && carta.antonyms.length > 0 && (
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              <strong style={{ color: 'var(--vermelho)' }}>Antônimos: </strong>
              {carta.antonyms.join(', ')}
            </div>
          )}
          {carta.usageNotes && (
            <div style={{ fontSize: 13, color: 'var(--texto-suave)', marginTop: 6 }}>
              <strong>Observação: </strong>
              {carta.usageNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
