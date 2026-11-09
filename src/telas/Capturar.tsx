import { useRef, useState } from 'react';
import { adicionarCartaRica } from '../db';
import { enriquecerPalavra } from '../enriquecer';
import type { CartaRica } from '../types';

type Fase = 'inicio' | 'carregando' | 'revisao';

// Aba de captura rapida: digita a palavra em ingles, o app busca e monta a carta,
// voce confere/edita e salva no baralho.
export function Capturar({ toast }: { toast: (m: string) => void }) {
  const [fase, setFase] = useState<Fase>('inicio');
  const [palavra, setPalavra] = useState('');
  const [avisos, setAvisos] = useState<string[]>([]);

  // campos editaveis
  const [english, setEnglish] = useState('');
  const [translation, setTranslation] = useState('');
  const [exampleEn, setExampleEn] = useState('');
  const [examplePtBr, setExamplePtBr] = useState('');
  const [dailyUsage, setDailyUsage] = useState('');
  const [tags, setTags] = useState('');
  // campos automaticos (so leitura, salvos junto)
  const [auto, setAuto] = useState<CartaRica | null>(null);

  const refInput = useRef<HTMLInputElement>(null);

  async function buscar() {
    const w = palavra.trim();
    if (!w) return;
    setFase('carregando');
    setAvisos([]);
    try {
      const { carta, avisos } = await enriquecerPalavra(w);
      setAuto(carta);
      setEnglish(carta.english || w);
      setTranslation(carta.translation || '');
      setExampleEn(carta.exampleEn || '');
      setExamplePtBr(carta.examplePtBr || '');
      setDailyUsage('');
      setTags((carta.tags || []).join(', '));
      setAvisos(avisos);
      setFase('revisao');
    } catch {
      toast('Deu um problema na busca. Tente de novo.');
      setFase('inicio');
    }
  }

  async function salvar() {
    if (!english.trim() || !translation.trim()) {
      toast('Precisa ao menos da palavra e da tradução.');
      return;
    }
    const rica: CartaRica = {
      ...(auto || {}),
      english: english.trim(),
      translation: translation.trim(),
      exampleEn: exampleEn.trim() || undefined,
      examplePtBr: examplePtBr.trim() || undefined,
      dailyUsage: dailyUsage.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      source: 'import'
    };
    // mantem a traducao principal no primeiro significado
    if (rica.meanings && rica.meanings.length) rica.meanings[0] = { ...rica.meanings[0], translation: rica.translation };

    const ok = await adicionarCartaRica(rica, 'import');
    if (!ok) {
      toast(`"${english.trim()}" já existe na sua lista.`);
      return;
    }
    toast('Palavra adicionada ao baralho!');
    limpar();
  }

  function limpar() {
    setFase('inicio');
    setPalavra('');
    setAuto(null);
    setEnglish('');
    setTranslation('');
    setExampleEn('');
    setExamplePtBr('');
    setDailyUsage('');
    setTags('');
    setAvisos([]);
    setTimeout(() => refInput.current?.focus(), 50);
  }

  return (
    <div>
      <div className="cartao">
        <div className="secao-titulo">Capturar palavra</div>
        <p style={{ fontSize: 13, color: 'var(--texto-suave)', marginBottom: 12 }}>
          Leu uma palavra em inglês e não conhece? Digita aqui que o app busca a tradução, a pronúncia e um exemplo automaticamente.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={refInput}
            value={palavra}
            onChange={(e) => setPalavra(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') buscar();
            }}
            placeholder="ex.: overwhelming"
            autoCapitalize="none"
            autoCorrect="off"
            style={{
              flex: 1,
              background: 'var(--superficie-2)',
              border: '1px solid var(--borda)',
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: 'var(--texto)'
            }}
          />
          <button className="btn" style={{ width: 'auto', padding: '0 20px' }} disabled={fase === 'carregando'} onClick={buscar}>
            {fase === 'carregando' ? '...' : 'Buscar'}
          </button>
        </div>
      </div>

      {fase === 'carregando' && <div className="vazio">Buscando tradução e pronúncia...</div>}

      {fase === 'revisao' && (
        <>
          {avisos.length > 0 && (
            <div className="aviso">
              {avisos.map((a, i) => (
                <div key={i}>{a}</div>
              ))}
            </div>
          )}

          <div className="cartao">
            <div className="secao-titulo">Confira e ajuste</div>

            <div className="campo">
              <label>Palavra em inglês</label>
              <input value={english} onChange={(e) => setEnglish(e.target.value)} autoCapitalize="none" autoCorrect="off" />
            </div>
            <div className="campo">
              <label>Tradução</label>
              <input value={translation} onChange={(e) => setTranslation(e.target.value)} />
            </div>
            <div className="campo">
              <label>Exemplo em inglês</label>
              <input value={exampleEn} onChange={(e) => setExampleEn(e.target.value)} />
            </div>
            <div className="campo">
              <label>Tradução do exemplo</label>
              <input value={examplePtBr} onChange={(e) => setExamplePtBr(e.target.value)} />
            </div>
            <div className="campo">
              <label>Como usar (opcional, você escreve)</label>
              <input value={dailyUsage} onChange={(e) => setDailyUsage(e.target.value)} placeholder="uma dica sua de quando usar" />
            </div>
            <div className="campo">
              <label>Tags (opcional, separadas por vírgula)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex.: trabalho, tecnologia" />
            </div>

            {/* o que o dicionario trouxe sozinho */}
            {(auto?.ipa || auto?.partOfSpeech || (auto?.synonyms && auto.synonyms.length) || (auto?.meanings && auto.meanings.length)) && (
              <div style={{ borderTop: '1px solid var(--borda)', paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--texto-suave)', marginBottom: 6 }}>
                  Preenchido automaticamente
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  {auto?.partOfSpeech && <span className="chip">{auto.partOfSpeech}</span>}
                  {auto?.ipa && <span style={{ color: 'var(--texto-suave)', fontSize: 14 }}>{auto.ipa}</span>}
                </div>
                {auto?.meanings && auto.meanings.length > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--texto-suave)', marginBottom: 6 }}>
                    {auto.meanings.map((m, i) => (
                      <div key={i} style={{ marginBottom: 3 }}>• {m.definitionEn}</div>
                    ))}
                  </div>
                )}
                {auto?.synonyms && auto.synonyms.length > 0 && (
                  <div style={{ fontSize: 13 }}>
                    <strong style={{ color: 'var(--verde)' }}>Sinônimos: </strong>
                    {auto.synonyms.join(', ')}
                  </div>
                )}
              </div>
            )}

            <div className="linha-botoes" style={{ marginTop: 16 }}>
              <button className="btn secundario" onClick={limpar}>
                Cancelar
              </button>
              <button className="btn" onClick={salvar}>
                Salvar no baralho
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
