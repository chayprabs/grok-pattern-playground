import { Github, Globe, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const GITHUB_URL = "https://github.com/chayprabs/grok-pattern-playground";
const TWITTER_URL = "https://x.com/chayprabs";
const WEBSITE_URL = "https://www.chaitanyaprabuddha.com";

export function TopBar() {
  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        GrokParse
      </Link>
      <nav className="topbar-links" aria-label="External links">
        <a
          href={TWITTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Twitter / X"
          aria-label="Twitter"
        >
          <Twitter size={20} />
        </a>
        <a
          href={WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Personal website"
          aria-label="Website"
        >
          <Globe size={20} />
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub repository"
          aria-label="GitHub"
        >
          <Github size={20} />
        </a>
      </nav>
    </header>
  );
}
