// Icones SVG (traço, herdam a cor via currentColor). Consistentes em iOS e Android.

type Nome = 'casa' | 'raio' | 'mais' | 'grafico' | 'cartas' | 'sol' | 'lua' | 'voltar' | 'check' | 'som';

const paths: Record<Nome, React.ReactNode> = {
  casa: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </>
  ),
  raio: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  mais: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  grafico: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  cartas: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  lua: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  voltar: <path d="M15 18l-6-6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  som: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16 8.5a4 4 0 0 1 0 7" />
    </>
  )
};

export function Icon({ nome, size = 24 }: { nome: Nome; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[nome]}
    </svg>
  );
}
