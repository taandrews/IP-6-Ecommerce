import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { hreflangAlternates } from "@/lib/i18n";
import { asset } from "@/lib/assets";
import styles from "./Story.module.css";

export const metadata: Metadata = {
  title: "The molecule a scientist spent his career on",
  description:
    "Professor Shamsuddin pioneered IP6 research at the University of Maryland School of Medicine before retiring in 2020. Discover the story behind IP6 Original.",
  alternates: hreflangAlternates("/story"),
};

const MOMENTS = [
  {
    label: "1988",
    title: "A research focus takes shape.",
    body: "At the University of Maryland School of Medicine, Professor Shamsuddin publishes his first paper on inositol hexaphosphate and applies for his first patent on June 30 of the same year.",
  },
  {
    label: "The years that followed",
    title: "A growing body of research.",
    body: "Publication after publication. A growing body of peer-reviewed research. A research foundation to keep the work going. The molecule remains at the center of his work.",
  },
  {
    label: "2020",
    title: "The work continues.",
    body: "Professor Shamsuddin retires from the University of Maryland School of Medicine. The research continues.",
  },
  {
    label: "IP6 Original",
    title: "From research to formulation.",
    body: "He formulates IP6 Original himself, bringing IP6 and Inositol together in a vegetable capsule. The pairing at the heart of his research becomes the original formula.",
  },
];

export default function StoryPage() {
  return (
    <>
      <article className={styles.story}>
        <section id="founder" aria-labelledby="story-title" className={styles.opening}>
          <div className={styles.wrap}>
            <div className={styles.masthead}><p className={styles.eyebrow}>The story</p><span>Behind IP6 Original</span></div>
            <h1 id="story-title" className={styles.headline}>The molecule a scientist spent his career on.</h1>
            <div className={styles.founderGrid}>
              <figure className={styles.founder}>
                <Image src={asset("founder/shamsuddin.png")} alt="Professor AbulKalam M. Shamsuddin in a suit and red bow tie" width={1024} height={1536} sizes="(max-width: 700px) 85vw, 320px" priority className={styles.portrait} />
                <figcaption>Founder and formulator of IP6 Original</figcaption>
              </figure>
              <div className={styles.biography}>
                <p className={styles.eyebrow}>Meet the founder</p>
                <h2>Professor AbulKalam M. Shamsuddin<span>MD, PhD</span></h2>
                <p className={styles.lead}>A physician-scientist. A career spent on a single molecule.</p>
                <p className={styles.body}>Professor Shamsuddin pioneered research on inositol hexaphosphate at the University of Maryland School of Medicine before retiring in 2020.</p>
                <p className={styles.body}>He formulated IP6 Original to bring the product of that research directly to consumers.</p>
                <a href="#research" className={styles.textLink}>Follow his research <ArrowDown size={16} aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>

        <section id="research" aria-labelledby="research-title" className={styles.research}>
          <div className={`${styles.wrap} ${styles.researchGrid}`}>
            <div className={styles.researchIntro}>
              <p className={styles.eyebrow}>The research</p>
              <h2 id="research-title" className={styles.title}>How the story unfolded.</h2>
              <p className={styles.body}>From his early publications to the original formula.</p>
              <Link href="/the-difference" className={styles.textLink}>About the formula <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            <ol className={styles.timeline}>
              {MOMENTS.map((moment) => (
                <li key={moment.label}>
                  <p className={/^\d{4}$/.test(moment.label) ? styles.year : styles.chapter}>{moment.label}</p>
                  <h3>{moment.title}</h3>
                  <p className={styles.body}>{moment.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="formula-title" className={styles.conclusion}>
          <div className={`${styles.wrap} ${styles.productRow}`}>
            <Image src={asset("products/supplement-240.png")} alt="IP6 Original Supplement, 240 capsules" width={870} height={1160} sizes="(max-width: 700px) 110px, 130px" className={styles.product} />
            <div className={styles.productCopy}>
              <p className={styles.eyebrow}>The story continues</p>
              <h2 id="formula-title">IP6 Original Supplement</h2>
              <p className={styles.body}>IP6 and Inositol. The original formula, developed by Professor Shamsuddin.</p>
              <p className={styles.productDetail}>240 capsules · 4 capsules per serving</p>
            </div>
            <Link href="/shop#people" className={styles.order}>Pre Order Now <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
      </article>
      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}
