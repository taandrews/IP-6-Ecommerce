import { MoleculeModel } from "@/components/home/MoleculeModel";

/**
 * The research-site hero figure: three slowly turning orbit rings, a ring of
 * six research areas on spokes, and the rotating IP6 model at the centre,
 * with the Figure 1 caption and atom key beneath. Geometry is drawn in a
 * 700x700 viewBox centred on (400, 400) so it scales to any box.
 */

const CX = 400;
const CY = 400;
const AREAS = ["Molecular mechanisms", "Cancer biology", "Clinical investigations", "Immunology", "Metabolism & mineral biology", "Neuroscience"];
const RINGS: { r: number; dots: number; reverse?: boolean }[] = [
  { r: 120, dots: 3 },
  { r: 210, dots: 4, reverse: true },
  { r: 346, dots: 5, reverse: true },
];

function pt(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

/** Arc path for a curved label; bottom-half labels run the other way so the text stays upright. */
function labelArc(deg: number) {
  const bottom = deg > 90 && deg < 270;
  const r = bottom ? 343 : 326;
  const sweep = 32;
  const a = pt(r, deg - sweep);
  const b = pt(r, deg + sweep);
  return bottom
    ? `M ${b.x} ${b.y} A ${r} ${r} 0 0 0 ${a.x} ${a.y}`
    : `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
}

export function MoleculeOrbit() {
  return (
    <figure className="w-full">
      <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
        <svg viewBox="50 50 700 700" aria-hidden="true" focusable="false" className="absolute inset-0 h-full w-full overflow-visible">
          {RINGS.map((ring, i) => (
            <g key={i} className={ring.reverse ? "orbit-ring orbit-slow-reverse" : "orbit-ring orbit-slow"}>
              <circle className="orbit-faint" cx={CX} cy={CY} r={ring.r} />
              {Array.from({ length: ring.dots }, (_, k) => {
                const p = pt(ring.r, (360 / ring.dots) * k + 20 * i);
                return <circle key={k} className="orbit-dot" cx={p.x} cy={p.y} r="3.5" />;
              })}
            </g>
          ))}
          <g>
            <circle className="orbit-line" cx={CX} cy={CY} r="300" />
            {AREAS.map((label, i) => {
              const deg = i * 60;
              const node = pt(300, deg);
              const id = `orbit-area-${i}`;
              return (
                <g key={label}>
                  <line className="orbit-spoke" x1={CX} y1={CY} x2={node.x} y2={node.y} />
                  <circle className="orbit-node" cx={node.x} cy={node.y} r="9" />
                  <path id={id} d={labelArc(deg)} fill="none" />
                  <text className="orbit-label">
                    <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
                      {label}
                    </textPath>
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2">
          <MoleculeModel />
        </div>
      </div>
      <figcaption className="mt-6 text-center text-xs sm:text-sm text-ink/70 leading-relaxed">
        <p>
          <strong className="text-navy-800 font-semibold">Figure 1.</strong> Inositol hexaphosphate, C<sub>6</sub>H<sub>18</sub>O<sub>24</sub>P<sub>6</sub>: six phosphate groups bonded to a six-carbon inositol ring.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] sm:text-xs" aria-label="Atom colors">
          <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2 rounded-full" style={{ background: "#39424c" }} />Carbon</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2 rounded-full border border-cloud-400" style={{ background: "#e1e6ec" }} />Hydrogen</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2 rounded-full" style={{ background: "#db342d" }} />Oxygen</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2 rounded-full" style={{ background: "#e6a02b" }} />Phosphorus</span>
        </div>
      </figcaption>
    </figure>
  );
}
