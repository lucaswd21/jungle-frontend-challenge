/** Original Figma exports. Keep their native geometry and colors. */
const icons = {
  user: ["user", 18, 18],
  wallets: ["wallets", 20, 20],
  activity: ["activity", 18, 18],
  wishlist: ["wishlist", 16, 16],
  offers: ["offers", 18, 18],
  downloads: ["downloads", 18, 18],
  support: ["support", 18, 18],
  logout: ["logout", 18, 17],
  avatar: ["avatar", 24, 24],
  "password-hidden": ["password-hidden", 17, 15],
} as const;

export function AccountIcon({ name }: { name: keyof typeof icons }) {
  const [file, width, height] = icons[name];
  return (
    <span className="account-icon-slot" aria-hidden="true">
      <img
        src={`/assets/kurio/account/${file}.png`}
        width={width}
        height={height}
        alt=""
        aria-hidden="true"
        className="account-icon"
      />
    </span>
  );
}
