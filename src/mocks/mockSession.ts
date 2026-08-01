export const MOCK_CUSTOMER_ID = "900001";

export function getMockCustomerId() {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true"
    ? MOCK_CUSTOMER_ID
    : undefined;
}
