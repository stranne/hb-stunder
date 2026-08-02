import { BookingsPage } from "../features/bookings/components/BookingsPage";
import { useSession } from "../features/auth/sessionContext";

export function BookingsRoute() {
  const { customer, canSignIn } = useSession();

  return <BookingsPage customerId={customer?.customerId} canSignIn={canSignIn} />;
}
