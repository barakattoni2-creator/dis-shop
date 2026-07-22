import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/styles/globals.css";
import "@/styles/tailwind.css";
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
    // attribute="class" + storageKey scoped to admin: the storefront never
    // reads a `.dark` class (its CSS Modules have no dark-mode variables),
    // so this only visibly matters on /admin — but next-themes has to wrap
    // the whole app here since Next's Pages Router only allows one root.
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="dis-admin-theme">
      <CompanyInfoProvider>
        <StoreProvider>
          <Component {...pageProps} />
          <WhatsAppButton />
          <Toaster richColors position="top-right" />
        </StoreProvider>
      </CompanyInfoProvider>
    </ThemeProvider>
  );
}
