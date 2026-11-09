import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { APRENDIDA_MIN } from '../sm2';
import { diaCurto } from '../utils/datas';
import type { Carta, Revisao } from '../types';

// Tela de progresso: numeros gerais e grafico dos ultimos 7 dias.
export function Estatisticas() {
  const cartas = useLiveQuery(() => db.cartas.toArray());
  const revisoes = useLiveQuery(() => db.revisoes.toArray());

  if (!cartas) return <div className="vazio">Carregando...</div>;

  const agora = Date.now();
  const total = cartas.length;
  const paraHoje = cartas.filter((c) => !c.suspensa && c.dueDate <= agora).length;
  const aprendidas = cartas.filter((c) => c.interval >= APRENDIDA_MIN).length;
  const emAprendizado = cartas.filter((c) => c.status !== 'revisao' && c.interval < APRENDIDA_MIN).length;
  const dificeis = cartas.filter((c) => c.easeFactor < 2.0).length;

  const dias = ultimos7Dias(revisoes ?? [], agora);
  const maxDia = Math.max(1, ...dias.map((d) => d.quantidade));

  return (
    <div>
      <div className="estat-grid">
        <Estat valor={total} rotulo="palavras no total" />
        <Estat valor={paraHoje} rotulo="para revisar hoje" cor="var(--azul)" />
        <Estat valor={aprendidas} rotulo="aprendidas (21+ dias)" cor="var(--verde)" />
        <Estat valor={emAprendizado} rotulo="em aprendizado" cor="var(--amarelo)" />
      </div>

      <div className="estat" style={{ marginTop: 12, marginBottom: 16 }}>
        <div className="numero-grande" style={{ color: 'var(--vermelho)' }}>
          {dificeis}
        </div>
        <div className="rot">palavras difíceis (fator de facilidade abaixo de 2.0)</div>
      </div>

      <div className="cartao">
        <div className="secao-titulo">Revisões nos últimos 7 dias</div>
        {(revisoes?.length ?? 0) === 0 ? (
          <p style={{ color: 'var(--texto-suave)', fontSize: 14 }}>Ainda sem revisões registradas. Comece hoje!</p>
        ) : (
          <div className="grafico">
            {dias.map((d) => (
              <div className="col" key={d.rotulo}>
                <span className="val">{d.quantidade > 0 ? d.quantidade : ''}</span>
                <div
                  className="barra"
                  style={{ height: `${(d.quantidade / maxDia) * 100}%`, opacity: d.quantidade > 0 ? 1 : 0.25 }}
                />
                <span className="rot">{d.rotulo}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Estat({ valor, rotulo, cor }: { valor: number; rotulo: string; cor?: string }) {
  return (
    <div className="estat">
      <div className="numero-grande" style={{ color: cor }}>
        {valor}
      </div>
      <div className="rot">{rotulo}</div>
    </div>
  );
}

// Monta os 7 dias (de 6 dias atras ate hoje) com a contagem de revisoes de cada dia.
function ultimos7Dias(revisoes: Revisao[], agora: number) {
  const dias: { rotulo: string; quantidade: number }[] = [];
  const base = new Date(agora);
  base.setHours(0, 0, 0, 0);

  for (let d = 6; d >= 0; d--) {
    const inicio = new Date(base);
    inicio.setDate(base.getDate() - d);
    const ini = inicio.getTime();
    const fim = ini + 24 * 60 * 60 * 1000;
    const quantidade = revisoes.filter((r) => r.data >= ini && r.data < fim).length;
    dias.push({ rotulo: diaCurto(ini), quantidade });
  }
  return dias;
}
