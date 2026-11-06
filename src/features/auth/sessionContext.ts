import { createContext, useContext } from "react";
import type { LoginCredentials } from "./api/auth";

export interface CustomerSession {
  customerId: string;
  displayName?: string;
}

export interface SessionContextValue {
  customer?: CustomerSession;
  canSignIn: boolean;
  /** Resolves with the signed-in customer, so a caller can continue what sign-in interrupted. */
  signIn: (credentials: LoginCredentials, remember?: boolean) => Promise<CustomerSession>;
  signOut: () => void;
}

export const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used within SessionProvider");
  return session;
}
