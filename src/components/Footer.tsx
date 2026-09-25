import { Globe } from "lucide-react";
import developerLogo from "../assets/developer-logo.png";
import { GithubMark, LinkedinMark, OrcidMark } from "./BrandIcons";

const links = [
  { label: "GitHub", href: "https://github.com/lmwmason", icon: GithubMark },
  {
    label: "ORCID",
    href: "https://orcid.org/0009-0007-9707-6384",
    icon: OrcidMark,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/lee-muwon/",
    icon: LinkedinMark,
  },
  {
    label: "Portfolio",
    href: "https://just-grassy-web.vercel.app/",
    icon: Globe,
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-credit">
          <img src={developerLogo} alt="" />
          <span>
            <b>just_grassy</b>
            <small>CBSH 37th · © just_grassy {new Date().getFullYear()}</small>
          </span>
        </div>
        <nav className="site-footer-links">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <link.icon className="site-footer-link-icon" />
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
