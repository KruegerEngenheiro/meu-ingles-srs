# Meu Inglês, Repetição Espaçada

PWA mobile-first, em português, para estudar vocabulário de inglês todos os dias com um sistema estilo Anki (repetição espaçada, algoritmo SM-2). Funciona offline, instala no celular como app e guarda tudo no próprio aparelho. Sem backend, sem login.

## O que ele faz

- Você cadastra palavras em inglês com a tradução (e, se quiser, exemplo e tags).
- O app mostra a palavra em inglês, você tenta lembrar, revela a resposta e avalia seu desempenho.
- Com base na sua avaliação, ele agenda sozinho a próxima revisão. O que você erra volta logo; o que você acerta volta cada vez mais espaçado.

## Como rodar localmente

Pré-requisito: Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (algo como `http://localhost:5173`).

## Como o algoritmo de repetição espaçada funciona (SM-2 simplificado)

Cada carta guarda: `easeFactor`, `interval` (minutos), `repetitions`, `dueDate`, `lastReviewedAt` e `status`.

- Fator de facilidade inicial: 2.5. Nunca cai abaixo de 1.3.
- Errei: zera os acertos, reduz o fator e a carta volta em 10 minutos.
- Difícil: aumenta pouco o intervalo e reduz um pouco o fator.
- Bom: cálculo normal do SM-2 (1 dia, depois 6 dias, depois intervalo anterior × fator).
- Fácil: aumenta mais o intervalo e eleva o fator.

O código do algoritmo está em [`src/sm2.ts`](src/sm2.ts), comentado em português.

## Tecnologias

React, TypeScript, Vite, Dexie.js (IndexedDB) e vite-plugin-pwa (service worker e offline).
