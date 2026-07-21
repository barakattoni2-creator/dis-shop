import { useStore } from "@/context/StoreContext";
import { useExchangeRate } from "@/components/CompanyInfoProvider";
import { formatCurrency } from "@/utils/format";

export default function Price({ amount, className }) {
  const { currency } = useStore();
  const { rate } = useExchangeRate();
  return (
    <span className={className}>
      {formatCurrency(amount, currency, rate)}
    </span>
  );
}
