import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  disabled?: boolean
  invert?: boolean
}

export function ThemeToggle({ disabled = false, invert = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = resolvedTheme === "dark"
  const Icon = isDark ? SunIcon : MoonIcon
  const nextTheme = isDark ? "light" : "dark"

  return (
    <Button
      type="button"
      className={cn(
        "border border-border/60 bg-background/55 backdrop-blur",
        invert
          ? "text-foreground/72 hover:bg-background/70 hover:text-foreground dark:border-white/15 dark:bg-white/6 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
          : "text-muted-foreground hover:text-foreground",
        disabled && "pointer-events-none opacity-45",
      )}
      aria-label={`${t("common.theme")}: ${nextTheme}`}
      disabled={disabled}
      onClick={() => setTheme(nextTheme)}
      size="sm"
      variant="outline"
    >
      <Icon className="size-4" weight="bold" />
    </Button>
  )
}
