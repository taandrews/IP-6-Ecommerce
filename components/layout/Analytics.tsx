"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_CHANGED_EVENT, effectiveConsent, parseConsent, readConsentCookie, type Consent } from "@/lib/consent";
import { rememberCampaign } from "@/lib/campaign";

/**
 * Loads Google Analytics only with analytics consent and the Meta Pixel only
 * with marketing consent (and never while Global Privacy Control is on).
 * A withdrawn consent takes effect on the next page load. Each script
 * carries the page's CSP nonce.
 */
export function Analytics({ nonce }: { nonce?: string }) {
  const [consent, setConsent] = useState<Consent>({ analytics: false, marketing: false });

  useEffect(() => {
    const read = () => {
      setConsent(effectiveConsent(parseConsent(readConsentCookie())));
      rememberCampaign();
    };
    read();
    window.addEventListener(CONSENT_CHANGED_EVENT, read);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, read);
  }, []);

  const gtm = process.env.NEXT_PUBLIC_GTM_ID;
  const ga = process.env.NEXT_PUBLIC_GA4_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const gtmId = gtm && /^GTM-[A-Z0-9]+$/.test(gtm) ? gtm : null;
  // With a Tag Manager container, Google Analytics is configured inside it, so it isn't loaded twice.
  const gaId = !gtmId && ga && /^G-[A-Z0-9]+$/.test(ga) ? ga : null;
  const pixelId = pixel && /^\d+$/.test(pixel) ? pixel : null;
  const granted = (on: boolean) => (on ? "granted" : "denied");

  return (
    <>
      {consent.analytics && gtmId ? (
        // Google Consent Mode v2 states come from the visitor's choice before the
        // container loads, so Google tags inside it honour them; ad storage only
        // with marketing consent.
        <Script id="gtm" strategy="afterInteractive" nonce={nonce}>
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
            gtag('consent','default',{analytics_storage:'granted',ad_storage:'${granted(consent.marketing)}',ad_user_data:'${granted(consent.marketing)}',ad_personalization:'${granted(consent.marketing)}'});
            dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id=${gtmId}';
            var n=document.currentScript&&document.currentScript.nonce;if(n)s.setAttribute('nonce',n);
            document.head.appendChild(s);`}
        </Script>
      ) : null}
      {consent.analytics && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" nonce={nonce} />
          <Script id="ga4" strategy="afterInteractive" nonce={nonce}>
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {consent.marketing && pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive" nonce={nonce}>
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
