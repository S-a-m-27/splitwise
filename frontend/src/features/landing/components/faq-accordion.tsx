"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GlowCardWrapper } from "@/features/landing/components/glow-card-wrapper";
import type { LandingFaqItem } from "@/features/landing/types";

interface FAQAccordionProps {
  items: LandingFaqItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  return (
    <GlowCardWrapper>
      <Accordion className="gradient-card card-glow w-full rounded-2xl border px-4 shadow-sm transition-shadow duration-300 hover:border-primary/20">
        {items.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger className="py-4 text-base hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </GlowCardWrapper>
  );
}
