import type { LucideIcon } from "lucide-react";

/** Navigation link used in the landing navbar and mobile sheet. */
export interface LandingNavLink {
  label: string;
  href: string;
}

/** Footer link group (product, legal, social). */
export interface LandingFooterLink {
  label: string;
  href: string;
}

export interface LandingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  tag: string;
  highlight: string;
}

export interface LandingStep {
  step: number;
  title: string;
  description: string;
  duration: string;
  icon: LucideIcon;
}

export interface LandingBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
  metric: string;
}

export interface LandingFaqItem {
  question: string;
  answer: string;
}

/** Metadata driving a repeatable landing section shell. */
export interface LandingSectionConfig {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  variant?: "default" | "alt" | "faq";
}
