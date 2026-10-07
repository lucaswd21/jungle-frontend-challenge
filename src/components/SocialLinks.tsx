// Platform destinations; replace with official KURIO profiles when supplied.
const networks = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/",
    path: "M14 22v-9h3l.5-4H14V7c0-1 .3-2 2-2h2V1h-3c-3 0-5 2-5 5v3H7v4h3v9h4Z",
  },
  { name: "Instagram", url: "https://www.instagram.com/", path: "" },
  {
    name: "Twitter",
    url: "https://x.com/",
    path: "M23 4.8a9.4 9.4 0 0 1-2.7.7 4.7 4.7 0 0 0 2.1-2.6 9.4 9.4 0 0 1-3 1.1 4.7 4.7 0 0 0-8 4.3A13.3 13.3 0 0 1 1.7 3.4a4.7 4.7 0 0 0 1.5 6.3 4.7 4.7 0 0 1-2.1-.6v.1a4.7 4.7 0 0 0 3.8 4.6 4.7 4.7 0 0 1-2.1.1 4.7 4.7 0 0 0 4.4 3.3A9.4 9.4 0 0 1 1.3 19H.2a13.3 13.3 0 0 0 20.4-11.2v-.6A9.5 9.5 0 0 0 23 4.8Z",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/",
    path: "M3 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM1 8h4v14H1V8Zm7 0h4v2c1-2 3-2.5 4.5-2.5 4 0 5.5 2.5 5.5 6V22h-4v-8c0-2-.5-3-2.5-3S12 12.5 12 14v8H8V8Z",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/",
    path: "M22 7c0-2-1-3-3-3H5C3 4 2 5 2 7v10c0 2 1 3 3 3h14c2 0 3-1 3-3V7ZM10 8l6 4-6 4V8Z",
  },
];
export function SocialLinks() {
  return networks.map(({ name, url, path }) => (
    <a
      key={name}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name} (abre em nova aba)`}
      title={`${name} | página da plataforma`}
      className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-[4px] border border-primary text-primary transition-colors hover:text-accent"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill={name === "Instagram" ? "none" : "currentColor"}
        fillRule="evenodd"
      >
        {name === "Instagram" ? (
          <g stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle
              cx="17.5"
              cy="6.5"
              r=".8"
              fill="currentColor"
              stroke="none"
            />
          </g>
        ) : (
          <path d={path} />
        )}
      </svg>
    </a>
  ));
}
