import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { GLOSSARY, type GlossaryKey } from "~/lib/sim/glossary"
import { cn } from "~/lib/utils"

/** Istilah teknis yang bisa diketuk untuk melihat penjelasan singkat. */
export function Term({
  k,
  children,
  className,
}: {
  k: GlossaryKey
  children?: React.ReactNode
  className?: string
}) {
  const g = GLOSSARY[k]
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "cursor-help rounded-sm underline decoration-primary/40 decoration-dotted decoration-2 underline-offset-3 outline-none hover:decoration-primary focus-visible:ring-2 focus-visible:ring-ring/50",
          className
        )}
      >
        {children ?? g.term}
      </PopoverTrigger>
      <PopoverContent className="w-72 gap-1.5 p-3.5">
        <p className="font-heading text-sm font-semibold text-foreground">
          {g.term}
        </p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {g.short}
        </p>
      </PopoverContent>
    </Popover>
  )
}
