export const isAdmin =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("admin") === "true";
