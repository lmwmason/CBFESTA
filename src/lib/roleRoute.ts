export function roleRoute(role: string | undefined) {
  if (role === "booth_operator") return "/booth";
  if (["owner", "admin", "staff"].includes(role ?? "")) return "/admin";
  // Plain participants have no operator workspace — send them to the
  // account sheet, which is also the only place to sign out.
  return "/login";
}
