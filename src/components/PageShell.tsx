import { type ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { SOCIAL_LINKS, APP_CONFIG } from "@/lib/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { Sparkles, Moon, Sun, Linkedin, Github, Mail } from "lucide-react";

const navLinkBase =
  "px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-smooth";
const navLinkActive = "text-primary bg-primary/10";

type PageShellProps = {
  children: ReactNode;
};

const PageShell = ({ children }: PageShellProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <NavLink
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full"
          >
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-wide">
              {APP_CONFIG.name}
            </span>
          </NavLink>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap items-center gap-2">
              <NavLink
                to="/"
                className={navLinkBase}
                activeClassName={navLinkActive}
              >
                Home
              </NavLink>
              <NavLink
                to="/from-thoughts"
                className={navLinkBase}
                activeClassName={navLinkActive}
              >
                From Thoughts
              </NavLink>
              <NavLink
                to="/from-job-description"
                className={navLinkBase}
                activeClassName={navLinkActive}
              >
                From Job Post
              </NavLink>
            </nav>
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="rounded-full bg-background border-border hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
          </div>
        </header>

        {children}

        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex justify-center gap-6">
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-6 h-6" />
            </a>
            <a
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              aria-label="GitHub"
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href={`mailto:${SOCIAL_LINKS.email}`}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              aria-label="Email"
            >
              <Mail className="w-6 h-6" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export { PageShell };
