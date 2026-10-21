"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_CHANGED_EVENT, effectiveConsent, parseConsent, readConsentCookie, type Consent } from "@/lib/consent";

/**
 * Loads Google Analytics only with analytics consent and the Meta Pixel only
 * with marketing consent (and never while Global Privacy Control is on).
 * A withdrawn consent takes effect on the next page load.
 */
export function Analytics() {
  const [consent, setConsent] = useState<Consent>({ analytics: false, marketing: false });

  useEffect(() => {
    const read = () => setConsent(effectiveConsent(parseConsent(readConsentCookie())));
    read();
    window.addEventListener(CONSENT_CHANGED_EVENT, read);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, read);
  }, []);

  const ga = process.env.NEXT_PUBLIC_GA4_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const gaId = ga && /^G-[A-Z0-9]+$/.test(ga) ? ga : null;
  const pixelId = pixel && /^\d+$/.test(pixel) ? pixel : null;

  return (
    <>
      {consent.analytics && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {consent.marketing && pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
