/**
 * Schematic of IP6 (myo-inositol hexakisphosphate): a six-carbon inositol ring
 * with one phosphate group on each carbon. Drawn as a schematic, not a
 * structural formula: six ring positions, six phosphates, nothing else.
 * Colours follow the logo: navy ring, gold phosphates.
 */
export function MoleculeDiagram() {
  const cx = 200;
  const cy = 200;
  const ringR = 70;
  const phosR = 150;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return {
      rx: cx + ringR * Math.cos(a),
      ry: cy + ringR * Math.sin(a),
      px: cx + phosR * Math.cos(a),
      py: cy + phosR * Math.sin(a),
    };
  });
  const ring = pts.map((p) => `${p.rx.toFixed(1)},${p.ry.toFixed(1)}`).join(" ");

  return (
    <figure className="max-w-sm mx-auto w-full">
      <svg viewBox="0 0 400 400" role="img" aria-labelledby="ip6-diagram-title ip6-diagram-desc" className="w-full h-auto">
        <title id="ip6-diagram-title">IP6 molecule, schematic</title>
        <desc id="ip6-diagram-desc">A six-sided inositol ring in the centre with one phosphate group attached at each of its six positions.</desc>
        {/* bonds from ring to phosphates */}
        {pts.map((p, i) => (
          <line key={`b${i}`} x1={p.rx} y1={p.ry} x2={p.px} y2={p.py} stroke="#001840" strokeWidth="3" strokeLinecap="round" />
        ))}
        {/* inositol ring */}
        <polygon points={ring} fill="#FFFFFF" stroke="#001840" strokeWidth="4" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={`c${i}`} cx={p.rx} cy={p.ry} r="7" fill="#001840" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="15" fontWeight="700" fill="#001840" fontFamily="var(--font-body), system-ui, sans-serif">Inositol</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12" fill="#3A5A90" fontFamily="var(--font-body), system-ui, sans-serif">six-carbon ring</text>
        {/* phosphate groups */}
        {pts.map((p, i) => (
          <g key={`p${i}`}>
            <circle cx={p.px} cy={p.py} r="24" fill="#E8C870" stroke="#A07020" strokeWidth="3" />
            <text x={p.px} y={p.py + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#001840" fontFamily="var(--font-body), system-ui, sans-serif">P</text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-3 text-center text-sm text-ink/70 leading-relaxed">
        IP6: an inositol ring carrying six phosphate groups (P). Take the phosphates away and what remains is Inositol.
      </figcaption>
    </figure>
  );
}
