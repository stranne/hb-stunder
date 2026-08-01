import { createContext, useContext } from "react";

export interface CustomerSession {
  customerId: string;
  displayName: string;
}

export interface SessionContextValue {
  customer?: CustomerSession;
  canSignIn: boolean;
  signIn: () => void;
  signOut: () => void;
}

export const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used within SessionProvider");
  return session;
}
