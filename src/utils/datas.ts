// Formatacao amigavel de datas e intervalos, em portugues.

// Transforma um instante futuro em texto amigavel: "agora", "em 10 min", "hoje às 20h", "amanhã", "em 3 dias".
export function formatarQuando(ts: number, agora: number = Date.now()): string {
  const diff = ts - agora;
  if (diff <= 0) return 'agora';

  const min = Math.round(diff / 60000);
  if (min < 60) return `em ${min} min`;

  const horas = Math.round(min / 60);
  if (horas < 24) {
    const d = new Date(ts);
    const hoje = new Date(agora);
    const mesmoDia = d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
    if (mesmoDia) return `hoje às ${d.getHours()}h`;
    return `em ${horas}h`;
  }

  const dias = Math.round(horas / 24);
  if (dias === 1) return 'amanhã';
  if (dias < 30) return `em ${dias} dias`;

  const meses = Math.round(dias / 30);
  if (meses < 12) return `em ${meses} ${meses === 1 ? 'mês' : 'meses'}`;

  const anos = Math.round(meses / 12);
  return `em ${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}

// Descreve um intervalo (em minutos) de forma curta: "10 min", "12 h", "3 dias".
export function formatarIntervalo(minutos: number): string {
  if (minutos < 60) return `${Math.round(minutos)} min`;
  if (minutos < 24 * 60) return `${Math.round(minutos / 60)} h`;
  const dias = Math.round(minutos / (24 * 60));
  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

// Data curta dd/mm para o grafico.
export function diaCurto(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
