/**
 * The one list of countries the store ships to. Mirrors the Shopify delivery
 * profile (US domestic zone plus the 27-country international zone). The
 * shipping page, the checkout country selector and the server-side shipping
 * check all read from here so they can never disagree.
 */
export const SHIP_COUNTRIES: ReadonlyArray<readonly [code: string, name: string]> = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["AU", "Australia"],
  ["NZ", "New Zealand"],
  ["IE", "Ireland"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["NL", "Netherlands"],
  ["BE", "Belgium"],
  ["AT", "Austria"],
  ["CH", "Switzerland"],
  ["DK", "Denmark"],
  ["SE", "Sweden"],
  ["NO", "Norway"],
  ["FI", "Finland"],
  ["ES", "Spain"],
  ["PT", "Portugal"],
  ["IT", "Italy"],
  ["PL", "Poland"],
  ["CZ", "Czechia"],
  ["IL", "Israel"],
  ["AE", "United Arab Emirates"],
  ["JP", "Japan"],
  ["KR", "South Korea"],
  ["HK", "Hong Kong"],
  ["SG", "Singapore"],
  ["MY", "Malaysia"],
];

export const SHIP_COUNTRY_CODES = SHIP_COUNTRIES.map(([code]) => code);
