export function roleRoute(role: string | undefined) {
  return role === "booth_operator"
    ? "/booth"
    : ["owner", "admin", "staff"].includes(role ?? "")
      ? "/admin"
      : "/teams";
}
