import developerLogo from "../assets/developer-logo.png";

const links = [
  { label: "GitHub", href: "https://github.com/lmwmason" },
  { label: "ORCID", href: "https://orcid.org/0009-0007-9707-6384" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/lee-muwon/" },
  { label: "Portfolio", href: "https://just-grassy-web.vercel.app/" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-credit">
        <img src={developerLogo} alt="" />
        <span>
          <b>Built by MUWON LEE</b>
          <small>충북과학고등학교 · CBSH 37th</small>
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
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
