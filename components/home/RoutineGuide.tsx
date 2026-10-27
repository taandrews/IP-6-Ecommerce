"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import scene from "@/assets/hero/ip6-capsules-powder-scene.webp";
import styles from "./HomeDetails.module.css";

export interface RoutineOption {
  id: string;
  label: string;
  title: string;
  directions: string[];
  href: string;
}

export function RoutineGuide({ options }: { options: [RoutineOption, ...RoutineOption[]] }) {
  const [selected, setSelected] = useState(options[0].id);
  const current = options.find((option) => option.id === selected) ?? options[0];
  return (
    <div className={styles.routineGrid}>
      <figure className={styles.routinePhoto}>
        <Image src={scene} alt="IP6 Original capsules and pet powder with capsules and a measuring scoop on the counter" sizes="(max-width: 700px) 90vw, 50vw" />
        <figcaption>Capsule and powder appearance illustrative.</figcaption>
      </figure>
      <div className={styles.routineContent}>
        <div className={styles.choices} role="group" aria-label="Choose directions">
          {options.map((option) => <button key={option.id} type="button" aria-pressed={selected === option.id} aria-controls="routine-directions" onClick={() => setSelected(option.id)} className={styles.choice}>{option.label}</button>)}
        </div>
        <div id="routine-directions" className={styles.routinePanel} aria-live="polite" aria-atomic="true">
          <h3>{current.title}</h3>
          <ul className={styles.directions}>{current.directions.map((line) => <li key={line}>{line}</li>)}</ul>
          <Link href={current.href} className={styles.link}>Full directions <ArrowRight size={16} aria-hidden /></Link>
        </div>
      </div>
    </div>
  );
}
