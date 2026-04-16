import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border bg-clip-padding text-[0.75rem] font-semibold tracking-[0.12em] uppercase whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary/55 bg-primary text-primary-foreground shadow-[0_0_0_1px_rgb(0_0_0_/_0.14),0_8px_18px_rgb(0_0_0_/_0.22)] hover:border-primary hover:bg-primary/93 hover:shadow-[0_0_0_1px_rgb(0_0_0_/_0.16),0_10px_22px_rgb(0_0_0_/_0.26)]",
        outline:
          "border-border/75 bg-background/70 text-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.015)] hover:border-primary/35 hover:bg-muted/72 hover:text-primary aria-expanded:border-primary/35 aria-expanded:bg-muted/72 aria-expanded:text-primary",
        secondary:
          "border-border/75 bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.015)] hover:border-primary/22 hover:bg-secondary/88 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/72 hover:text-foreground aria-expanded:border-border/70 aria-expanded:bg-muted/72 aria-expanded:text-foreground",
        destructive:
          "border-destructive/45 bg-destructive/14 text-[#ffd9ca] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.015)] hover:bg-destructive/22 focus-visible:border-destructive/55 focus-visible:ring-destructive/20",
        link: "h-auto border-transparent bg-transparent px-0 py-0 text-primary tracking-normal normal-case underline-offset-4 hover:text-primary/82 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-md px-2 text-[0.68rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-md px-3 text-[0.68rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-4.5 text-[0.78rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-md in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
