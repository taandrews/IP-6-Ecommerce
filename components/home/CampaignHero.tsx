import Link from "next/link";
import { Instrument_Serif, Manrope } from "next/font/google";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { DaylightScene } from "./DaylightScene";
import styles from "./CampaignHero.module.css";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--campaign-display", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--campaign-sans", display: "swap" });

export function CampaignHero({ productHref }: { productHref: string }) {
  return (
    <section className={`${styles.hero} ${display.variable} ${sans.variable}`} aria-labelledby="campaign-title">
      <div className={styles.campaign}>
        <DaylightScene />
        <div className={styles.copy}>
          <p className={styles.eyebrow}>IP6 ORIGINAL <span>IP6 + INOSITOL</span></p>
          <h1 id="campaign-title" className={styles.title}>
            <span>Original science.</span>
            <em>Everyday ritual.</em>
          </h1>
          <p className={styles.description}>Decades of research, distilled into your daily routine. From the scientist who pioneered IP6.</p>
          <Link href={productHref} className={styles.primary}>Discover the formula <ArrowUpRight size={19} strokeWidth={1.4} aria-hidden="true" /></Link>
          <p className={styles.offer}>Pre-order IP6 Original &amp; save 15%</p>
          <Link href="/story" className={styles.story}>Meet the scientist <span aria-hidden="true">↗</span></Link>
        </div>
        <a href="#ip6-formula" className={styles.explore}>A closer look <ArrowDown size={15} strokeWidth={1.4} aria-hidden="true" /></a>
      </div>
      <div className={styles.standards}>
        <p>Original research.<br /><span>Since 1988.</span></p>
        <p>Formulated by<br /><span>Professor Shamsuddin</span></p>
        <p>Independently<br /><span>Third-party tested</span></p>
        <p>Manufactured in a<br /><span>cGMP-certified facility</span></p>
      </div>
    </section>
  );
}
