import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, FlaskConical, ShieldCheck, Factory } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { DsheaDisclaimer } from "@/components/product/Dshea";
import { hreflangAlternates } from "@/lib/i18n";
import capsulePhoto from "@/assets/products/lifestyle/supplement-detail.png";
import labelPhoto from "@/assets/products/supplement-240-label.jpg";
import styles from "./Difference.module.css";

export const metadata: Metadata = {
  title: "What goes into IP6 Original",
  description: "The purity, verification, formulation, and source of IP6 Original, line by line.",
  alternates: hreflangAlternates("/the-difference"),
};

const STANDARDS = [
  { label: "Purity", title: "Highest purity, research grade.", detail: "The intact molecule the research describes, not broken-down fragments.", icon: FlaskConical },
  { label: "Verification", title: "Third-party tested.", detail: "Independently tested for purity, potency, and quality. Stated on the label.", icon: ShieldCheck },
  { label: "Manufacturing", title: "Made in the USA.", detail: "Manufactured in a cGMP-certified facility to current Good Manufacturing Practice standards. Stated on the label.", icon: Factory },
];

export default function TheDifferencePage() {
  return (
    <>
      <article className={styles.page}>
        <header className={`${styles.wrap} ${styles.opening}`}>
          <p className={styles.eyebrow}>The difference</p>
          <h1>What goes into<br /><span>IP6 Original.</span></h1>
          <p className={styles.intro}>A closer look at the formula. From its ingredients to the standards behind every bottle.</p>
          <nav aria-label="Explore the difference" className={styles.sectionNav}>
            <a href="#formula"><span>01</span> The formula <ArrowDown size={15} aria-hidden /></a>
            <a href="#standards"><span>02</span> The standards <ArrowDown size={15} aria-hidden /></a>
            <a href="#label"><span>03</span> The label <ArrowDown size={15} aria-hidden /></a>
          </nav>
        </header>
        <section id="formula" aria-labelledby="formula-title" className={`${styles.wrap} ${styles.formula}`}>
          <figure className={styles.photograph}>
            <Image src={capsulePhoto} alt="IP6 Original Supplement bottle with vegetable capsules resting on a dish" sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1250px) 46vw, 552px" priority />
            <figcaption>A closer look at the capsules. Concept photography.</figcaption>
          </figure>
          <div className={styles.formulaCopy}>
            <p className={styles.eyebrow}>01 / The formula</p>
            <h2 id="formula-title">IP6 + Inositol.<br />The original pairing.</h2>
            <p className={styles.body}>IP6 and Inositol, brought together in the formula developed by Professor Shamsuddin.</p>
            <dl className={styles.amounts}>
              <div><dt>IP6</dt><dd>804<span>mg</span></dd></div>
              <div><dt>Inositol</dt><dd>196<span>mg</span></dd></div>
            </dl>
            <p className={styles.serving}>Per 4-capsule serving of IP6 Original Supplement.</p>
            <div className={styles.capsuleNote}>
              <h3>Inside a vegetable capsule.</h3>
              <p>Calcium-magnesium inositol hexaphosphate paired with Inositol, in a hypromellose capsule. No magnesium stearate, no silicon dioxide, no unnecessary additives.</p>
            </div>
            <Link href="/shop#people" className={styles.textLink}>Explore IP6 Original Supplement <ArrowRight size={17} aria-hidden /></Link>
          </div>
        </section>
        <section id="standards" aria-labelledby="standards-title" className={styles.standards}>
          <div className={styles.wrap}>
            <div className={styles.sectionHeading}>
              <div><p className={styles.eyebrow}>02 / The standards</p><h2 id="standards-title">What matters in<br />every bottle.</h2></div>
              <p className={styles.body}>Purity, independent testing, and manufacturing. The details behind the formula.</p>
            </div>
            <div className={styles.standardGrid}>
              {STANDARDS.map(({ label, title, detail, icon: Icon }) => (
                <div key={label} className={styles.standard}>
                  <Icon size={28} strokeWidth={1.4} aria-hidden />
                  <p className={styles.standardLabel}>{label}</p>
                  <h3>{title}</h3>
                  <p className={styles.body}>{detail}</p>
                </div>
              ))}
            </div>
            <div className={styles.primer}>
              <h3>First, what is IP6?</h3>
              <div>
                <p>IP6, or <strong>inositol hexaphosphate</strong>, is a naturally occurring molecule of inositol carrying six phosphate groups, found in the bran of seeds and grains. Inositol is the simpler compound at its core.</p>
                <p>IP6 Original pairs the two as Professor Shamsuddin&rsquo;s research describes them. Because IP6 is defined by those six phosphate groups, the purity of the compound is what determines its quality.</p>
              </div>
            </div>
          </div>
        </section>
        <section id="label" aria-labelledby="label-title" className={`${styles.wrap} ${styles.labelSection}`}>
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>03 / The label</p><h2 id="label-title">See it for yourself.</h2></div>
            <p className={styles.body}>The ingredients, serving size, and Supplement Facts, straight from the IP6 Original Supplement label.</p>
          </div>
          <a href={labelPhoto.src} target="_blank" rel="noopener noreferrer" className={styles.labelImage} aria-label="Open the full IP6 Original Supplement label in a new tab">
            <Image src={labelPhoto} alt="IP6 Original 240-capsule label: 4 capsules per serving, 804 mg IP6 and 196 mg Inositol" sizes="(max-width: 1250px) calc(100vw - 64px), 1200px" />
            <span>Open full-size label <ArrowRight size={17} aria-hidden /></span>
          </a>
          <dl className={styles.labelFacts}><div><dt>240</dt><dd>vegetable capsules</dd></div><div><dt>4</dt><dd>capsules per serving</dd></div><div><dt>60</dt><dd>servings per bottle</dd></div></dl>
        </section>
        <section aria-labelledby="founder-title" className={`${styles.wrap} ${styles.founder}`}>
          <div><p className={styles.eyebrow}>The scientist behind the formula</p><h2 id="founder-title">One formula. From the scientist<br />who pioneered the research.</h2></div>
          <div className={styles.founderCopy}><p>Professor AbulKalam M. Shamsuddin, MD, PhD</p><p className={styles.body}>Physician-scientist. Founder and formulator of IP6 Original.</p><Link href="/story#founder" className={styles.textLink}>Meet Professor Shamsuddin <ArrowRight size={17} aria-hidden /></Link></div>
        </section>
        <div className={`${styles.wrap} ${styles.closing}`}><div><p>Get to know the original.</p><span>Explore capsules for people and powder for pets.</span></div><Link href="/shop" className={styles.order}>Pre Order Now <ArrowRight size={18} aria-hidden /></Link></div>
        <div className={`${styles.wrap} ${styles.disclaimer}`}><DsheaDisclaimer /></div>
      </article>
      <Footer showDshea />
    </>
  );
}
