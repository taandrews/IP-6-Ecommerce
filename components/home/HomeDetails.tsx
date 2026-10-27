import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { asset } from "@/lib/assets";
import type { Product } from "@/types";
import type { PreorderSettings } from "@/types/records";
import { Accordion } from "@/components/ui/Accordion";
import { MoleculeOrbit } from "./MoleculeOrbit";
import { RoutineGuide, type RoutineOption } from "./RoutineGuide";
import styles from "./HomeDetails.module.css";

export function HomeDetails({ supplement, pet, preorder }: { supplement: Product; pet?: Product; preorder: PreorderSettings }) {
  const options: [RoutineOption, ...RoutineOption[]] = [{ id: "people", label: "For people", title: "Four capsules. With water.", directions: supplement.howToUse, href: "/how-to-take" }];
  if (pet) options.push({ id: "pets", label: "For pets", title: "Measure. Mix into food.", directions: pet.howToUse, href: `/shop/${pet.slug}` });
  const questions = [
    { id: "formula-ip6", header: "What is IP6?", content: <p>{supplement.faq.find((item) => item.q === "What is IP6?")?.a}</p> },
    { id: "formula-ingredients", header: "What is in the capsules?", content: <ul className="space-y-2">{supplement.ingredients?.map((item) => <li key={item}>{item}</li>)}</ul> },
    ...(pet ? [{ id: "formula-powder", header: "Is the pet powder flavored?", content: <p>{pet.faq.find((item) => item.q === "Is it flavored?")?.a}</p> }] : []),
  ];
  return <>
    <section id="why-ip6" aria-labelledby="why-ip6-heading" className={`${styles.section} ${styles.science}`}>
      <div className={styles.wrap}>
        <div className={styles.scienceGrid}>
          <div className={styles.scienceCopy}>
            <p className={styles.eyebrow}>Why IP6 Original</p>
            <h2 id="why-ip6-heading" className={styles.title}>Original science.<br />Pure and simple.</h2>
            <p className={styles.body}>IP6 and Inositol. The pairing at the heart of Professor Shamsuddin&rsquo;s research, brought together in the original formula.</p>
            <p className={styles.body}>IP6 is a naturally occurring molecule found in seeds, grains, and legumes. Explore the molecule behind the name.</p>
            <Link href="/the-difference" className={styles.link}>Explore the formula <ArrowRight size={16} aria-hidden /></Link>
          </div>
          <figure className={styles.orbit}><MoleculeOrbit /><figcaption>The IP6 molecule and its six phosphate groups</figcaption></figure>
        </div>
        <dl className={styles.standards}>
          <div><dt>Third-party tested</dt><dd>Independently tested for purity, potency, and quality.</dd></div>
          <div><dt>Made in the USA</dt><dd>Manufactured in a cGMP-certified facility.</dd></div>
          <div><dt>Only what belongs</dt><dd>No magnesium stearate, no silicon dioxide, no unnecessary additives.</dd></div>
        </dl>
      </div>
    </section>
    <section id="scientist" aria-labelledby="scientist-heading" className={`${styles.section} ${styles.founder}`}>
      <div className={styles.wrap}>
        <div className={styles.founderGrid}>
          <Image src={asset("founder/shamsuddin.png")} alt="Professor AbulKalam M. Shamsuddin in a suit and red bow tie" width={1024} height={1536} sizes="(max-width: 700px) 90vw, 370px" className={styles.portrait} />
          <div className={styles.founderCopy}>
            <p className={styles.eyebrow}>Meet the scientist</p>
            <h2 id="scientist-heading" className={styles.title}>His research.<br />His original formula.</h2>
            <p className={styles.founderName}>Professor AbulKalam M. Shamsuddin, MD, PhD</p>
            <p className={styles.credentials}>Pioneer in IP6 research. Founder and formulator of IP6 Original.</p>
            <blockquote className={styles.quote}>&ldquo;Nature has sprinkled IP6 throughout the planet - in the soil, the seeds, the grains staple to all humanity, and in all our cells for good reasons; let&rsquo;s learn those and enjoy the benefits for generations to come.&rdquo;</blockquote>
            <Link href="/story#founder" className={styles.link}>Read his story <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </div>
      </div>
    </section>
    <section id="how-to-use" aria-labelledby="how-to-use-heading" className={`${styles.section} ${styles.routine}`}>
      <div className={styles.wrap}>
        <div className={styles.routineHeader}>
          <div><p className={styles.eyebrow}>How to use it</p><h2 id="how-to-use-heading" className={styles.title}>Make it part<br />of your day.</h2></div>
          <p className={styles.body}>Capsules for you. Easy-to-mix powder for them. Choose your format for the label directions.</p>
        </div>
        <RoutineGuide options={options} />
      </div>
    </section>
    <section id="before-you-order" aria-labelledby="before-you-order-heading" className={`${styles.section} ${styles.questions}`}>
      <div className={styles.wrap}>
        <div className={styles.questionsGrid}>
          <div><p className={styles.eyebrow}>A little more to know</p><h2 id="before-you-order-heading" className={styles.title}>Good questions.<br />Clear answers.</h2><p className={styles.body}>A closer look at the formula and the two formats.</p><Link href="/contact" className={styles.link}>Ask us a question <ArrowRight size={16} aria-hidden /></Link></div>
          <Accordion items={questions} />
        </div>
        <div className={styles.closing}>
          <p>For people. For pets.{preorder.active ? <small>{preorder.discountPct}% off for launch. {preorder.shipNote}.</small> : null}</p>
          <Link href="#products" className={styles.order}>Pre Order Now <ArrowRight size={16} aria-hidden /></Link>
        </div>
      </div>
    </section>
  </>;
}
