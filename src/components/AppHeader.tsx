import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

type AppHeaderProps = {
  /** Nav links rendered between the logo and right controls. */
  center?: ReactNode;
  /** Items rendered to the right of the theme toggle. */
  right?: ReactNode;
};

export function AppHeader({ center, right }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-wide items-center gap-5 px-4 py-3 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link to="/" className="shrink-0 text-base font-semibold tracking-tight">
          TalentEdge AI
        </Link>

        {/* Center slot — nav links or empty spacer */}
        <div className="flex min-w-0 flex-1 snap-x gap-1 overflow-x-auto text-sm text-muted-foreground">
          {center}
        </div>

        {/* Shared right controls */}
        <div className="flex shrink-0 items-center gap-2">
          <select
            aria-label="Language"
            value={i18n.language}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              localStorage.setItem("language", e.target.value);
              document.documentElement.lang = e.target.value;
            }}
            className="hidden h-10 rounded-pill border border-border bg-background px-3 text-sm sm:block"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="tl">TL</option>
          </select>

          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-pill bg-background"
            data-testid="theme-toggle"
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* Page-specific right slot */}
          {right}
        </div>
      </div>
    </nav>
  );
}
