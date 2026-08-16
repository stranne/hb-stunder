export const REAL_API_BASE_URL = "https://hagabadet.brpsystems.com/brponline/api/ver3";
export const STORYBOOK_API_BASE_URL = "/__storybook-api";

// Customer authentication and mutations stay available during development and are
// opt-in for production builds until API usage permission and contracts are confirmed.
export const CUSTOMER_FEATURES_ENABLED =
  import.meta.env?.DEV === true || import.meta.env?.VITE_ENABLE_CUSTOMER_FEATURES === "true";
