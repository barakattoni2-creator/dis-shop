import { useEffect } from "react";
import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";
import { StoreProvider } from "@/context/StoreContext";
import { CompanyInfoProvider } from "@/components/CompanyInfoProvider";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <CompanyInfoProvider>
      <StoreProvider>
        <Component {...pageProps} />
        <WhatsAppButton />
      </StoreProvider>
    </CompanyInfoProvider>
  );
}
