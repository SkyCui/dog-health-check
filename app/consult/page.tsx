import ConsultationChat from "@/components/ConsultationChat";
import { getPlusCheckoutUrl } from "@/lib/commerce";

export default function ConsultPage() {
  return <ConsultationChat checkoutUrl={getPlusCheckoutUrl()} />;
}
