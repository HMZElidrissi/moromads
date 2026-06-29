import { cn } from "~/lib/utils";
import { Link } from "react-router";
import { MoroccoFlag } from "~/components/ui/morocco-flag";

export type FooterProps = React.ComponentProps<"footer">;

export function Footer({ className, ...props }: FooterProps) {
  return (
    <footer
      data-slot="footer"
      className={cn("border-t border-gray-100 bg-white py-12", className)}
      {...props}
    >
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-8">
        {/* Logo */}
        <Link to="/" aria-label="Moromads home">
          <img src="/logo.svg" alt="Moromads" className="h-28" />
        </Link>

        {/* Links */}
        <nav
          aria-label="Footer"
          className="flex items-center gap-8 text-sm font-bold text-gray-400"
        >
          <Link to="/add-spot" className="hover:text-gray-900 transition-colors">
            Add a place
          </Link>
          <Link to="/about" className="hover:text-gray-900 transition-colors">
            About
          </Link>
        </nav>

        {/* Socials */}
        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/moromads_"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
            aria-label="Instagram"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
          <a
            href="https://www.tiktok.com/@moromads_"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
            aria-label="TikTok"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
          </a>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 select-none">
          <span>© {new Date().getFullYear()} · Built with love for moromads</span>
          <MoroccoFlag variant="rectangle" className="size-3.5" />
        </div>
      </div>
    </footer>
  );
}
