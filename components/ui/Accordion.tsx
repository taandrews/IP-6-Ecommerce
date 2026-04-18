"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  id: string;
  header: ReactNode;
  content: ReactNode;
}

export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className={cn("divide-y divide-ivory-300 border-y border-ivory-300", className)}>
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
              aria-controls={`panel-${item.id}`}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-medium text-forest-800 text-base">{item.header}</span>
              <ChevronDown
                className={cn("size-5 shrink-0 transition-transform duration-200", open && "rotate-180")}
                aria-hidden
              />
            </button>
            <div
              id={`panel-${item.id}`}
              hidden={!open}
              className="pb-6 text-ink/80 leading-relaxed"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
