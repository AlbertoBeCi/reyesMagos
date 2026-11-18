import { useMemo } from 'react';

export default function SnowBackground() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 45 }, (_, i) => {
        const size = 2 + Math.random() * 4;
        return {
          id: i,
          style: {
            left: `${Math.random() * 100}%`,
            '--y': `${Math.random() * 100}vh`,
            '--s': `${size}px`,
            '--o': 0.3 + Math.random() * 0.5,
            '--x': `${Math.random() * 80 - 40}px`,
            '--d': `${9 + Math.random() * 12}s`,
            '--delay': `-${Math.random() * 20}s`,
          },
        };
      }),
    []
  );

  return (
    <div className="snow" aria-hidden="true">
      {flakes.map((f) => (
        <span key={f.id} className="flake" style={f.style} />
      ))}
    </div>
  );
}
