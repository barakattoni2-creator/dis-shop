import { createContext, useContext, useEffect, useState } from "react";
import {
  COMPANY_NAME,
  ADDRESS_LINES,
  EMAIL,
  PHONE_NUMBERS,
  PHONE_DISPLAY,
  PHONE_TEL,
  WHATSAPP_NUMBER,
  WHATSAPP_DISPLAY,
} from "@/data/contact";
import { SSP_PER_USD } from "@/data/currency";

const DEFAULT_COMPANY_INFO = {
  companyName: COMPANY_NAME,
  addressLines: ADDRESS_LINES,
  email: EMAIL,
  phoneNumbers: PHONE_NUMBERS,
  phoneDisplay: PHONE_DISPLAY,
  phoneTel: PHONE_TEL,
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappDisplay: WHATSAPP_DISPLAY,
};

const DEFAULT_EXCHANGE_RATE = { rate: SSP_PER_USD, updatedAt: null };

const CompanyInfoContext = createContext(DEFAULT_COMPANY_INFO);
const ExchangeRateContext = createContext(DEFAULT_EXCHANGE_RATE);

// Renders with the static data/contact.js / SSP_PER_USD defaults immediately
// (no flash of empty content, safe for first paint), then swaps in
// admin-edited values from the database once /api/settings resolves.
export function CompanyInfoProvider({ children }) {
  const [info, setInfo] = useState(DEFAULT_COMPANY_INFO);
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.companyInfo) setInfo(data.companyInfo);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CompanyInfoContext.Provider value={info}>
      <ExchangeRateContext.Provider value={exchangeRate}>
        {children}
      </ExchangeRateContext.Provider>
    </CompanyInfoContext.Provider>
  );
}

export function useCompanyInfo() {
  return useContext(CompanyInfoContext);
}

// Returns { rate, updatedAt } — the live USD→SSP exchange rate set by an
// admin at /admin/settings, or the static default before that resolves.
export function useExchangeRate() {
  return useContext(ExchangeRateContext);
}
