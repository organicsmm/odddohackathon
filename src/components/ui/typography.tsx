import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Reusable typography primitives. These map to the `t-*` utilities defined
 * in `index.css` so the same scale is available with utility classes too.
 *
 *   <Heading level={1}>Page title</Heading>
 *   <Display gradient>Welcome</Display>
 *   <Lead>Subhead copy</Lead>
 *   <Eyebrow>Section label</Eyebrow>
 *   <Text variant="small" muted>helper</Text>
 */

const textVariants = cva("text-pretty", {
  variants: {
    variant: {
      display: "t-display",
      h1: "t-h1",
      h2: "t-h2",
      h3: "t-h3",
      h4: "t-h4",
      lead: "t-lead",
      body: "t-body",
      small: "t-small",
      eyebrow: "t-eyebrow",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    tone: {
      default: "",
      muted: "text-muted-foreground",
      primary: "text-primary",
      accent: "text-accent",
      destructive: "text-destructive",
      success: "text-success",
      warning: "text-warning",
      gradient: "text-gradient",
    },
  },
  defaultVariants: { variant: "body", tone: "default" },
});

type Level = 1 | 2 | 3 | 4;

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">,
    Omit<VariantProps<typeof textVariants>, "variant"> {
  level?: Level;
  asChild?: boolean;
  gradient?: boolean;
}

const headingTag = (l: Level) => (`h${l}` as "h1" | "h2" | "h3" | "h4");
const headingVariant = (l: Level): NonNullable<VariantProps<typeof textVariants>["variant"]> =>
  ({ 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const)[l];

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, className, weight, align, tone, gradient, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : headingTag(level);
    return (
      <Comp
        ref={ref}
        className={cn(
          textVariants({ variant: headingVariant(level), weight, align, tone: gradient ? "gradient" : tone }),
          className,
        )}
        {...props}
      />
    );
  },
);
Heading.displayName = "Heading";

export interface DisplayProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">,
    Omit<VariantProps<typeof textVariants>, "variant"> {
  asChild?: boolean;
  gradient?: boolean;
  as?: "h1" | "h2" | "div";
}

export const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  ({ className, weight, align, tone, gradient, asChild, as = "h1", ...props }, ref) => {
    const Comp = asChild ? Slot : as;
    return (
      <Comp
        ref={ref}
        className={cn(
          textVariants({ variant: "display", weight, align, tone: gradient ? "gradient" : tone }),
          className,
        )}
        {...props}
      />
    );
  },
);
Display.displayName = "Display";

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "small" | "label";
  asChild?: boolean;
  muted?: boolean;
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant, weight, align, tone, muted, as = "p", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : (as as React.ElementType);
    return (
      <Comp
        ref={ref as React.Ref<HTMLElement>}
        className={cn(textVariants({ variant, weight, align, tone: muted ? "muted" : tone }), className)}
        {...props}
      />
    );
  },
);
Text.displayName = "Text";

export const Lead = React.forwardRef<HTMLParagraphElement, Omit<TextProps, "variant">>(
  ({ className, ...props }, ref) => (
    <Text ref={ref as React.Ref<HTMLElement>} variant="lead" className={className} {...props} />
  ),
);
Lead.displayName = "Lead";

export const Eyebrow = React.forwardRef<HTMLSpanElement, Omit<TextProps, "variant" | "as">>(
  ({ className, ...props }, ref) => (
    <Text ref={ref as React.Ref<HTMLElement>} as="span" variant="eyebrow" className={className} {...props} />
  ),
);
Eyebrow.displayName = "Eyebrow";

export const Muted = React.forwardRef<HTMLParagraphElement, Omit<TextProps, "tone">>(
  ({ className, ...props }, ref) => (
    <Text ref={ref as React.Ref<HTMLElement>} tone="muted" className={className} {...props} />
  ),
);
Muted.displayName = "Muted";

export { textVariants };
