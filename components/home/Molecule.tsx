import { MoleculeMark } from "@/components/home/MoleculeMark";

/** The molecule: animated inositol ring left, existing primer copy right. */
export function Molecule() {
  return (
    <section className="bg-cream text-navy-800 section-y" aria-labelledby="molecule-h">
      <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="mx-auto w-full max-w-[460px]">
          <MoleculeMark size="100%" animate className="h-auto w-full" />
        </div>
        <div>
          <p className="eyebrow mb-5">First, the molecule</p>
          <h2 id="molecule-h" className="h-section text-navy-800 text-balance">
            IP6 is a molecule, not a marketing term.
          </h2>
          <p className="mt-7 font-serif text-[20px] leading-relaxed text-navy-800/85 lg:text-[24px]">
            IP6 is <strong className="font-semibold text-navy-800">inositol hexaphosphate</strong>, a molecule found naturally in seeds, grains, and legumes, where it stores energy and minerals. IP6 Original pairs it with{" "}
            <strong className="font-semibold text-navy-800">Inositol</strong>, the simpler compound at its core, the way Prof. Shamsuddin&rsquo;s research describes the two. Knowing what the molecule is makes the next question, how pure is it, the one that matters.
          </p>
        </div>
      </div>
    </section>
  );
}
