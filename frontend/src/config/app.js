const DEFAULT_APP_NAME = "Hi-AIGC";

export const APP_NAME =
  (import.meta.env.VITE_APP_NAME || "").trim() || DEFAULT_APP_NAME;
