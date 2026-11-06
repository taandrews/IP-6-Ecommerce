/**
 * Where the store sells, in one place.
 *
 * SELLABLE_COUNTRIES is the single setting every sales gate reads: the
 * checkout country picker, the shipping quote, payment creation and the
 * Stripe webhook re-check. Opening a new market is a change to this list.
 *
 * "US" means the 50 states and Washington, DC. US territories (which have
 * their own country codes and their own state codes inside US addresses) and
 * APO/FPO/DPO military addresses are not sellable yet.
 */
export const SELLABLE_COUNTRIES: readonly string[] = ["US"];

/** ISO 3166-1 alpha-2 codes (plus XK, Kosovo) for the waitlist and checkout pickers. */
export const ALL_COUNTRY_CODES: readonly string[] = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE",
  "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD",
  "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
  "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
  "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
  "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
  "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
  "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK",
  "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW",
];

/** Fixed English names, so the server and every browser render the same text. */
const COUNTRY_NAMES: Readonly<Record<string, string>> = {
  AD: "Andorra",
  AE: "United Arab Emirates",
  AF: "Afghanistan",
  AG: "Antigua & Barbuda",
  AI: "Anguilla",
  AL: "Albania",
  AM: "Armenia",
  AO: "Angola",
  AQ: "Antarctica",
  AR: "Argentina",
  AS: "American Samoa",
  AT: "Austria",
  AU: "Australia",
  AW: "Aruba",
  AX: "Åland Islands",
  AZ: "Azerbaijan",
  BA: "Bosnia & Herzegovina",
  BB: "Barbados",
  BD: "Bangladesh",
  BE: "Belgium",
  BF: "Burkina Faso",
  BG: "Bulgaria",
  BH: "Bahrain",
  BI: "Burundi",
  BJ: "Benin",
  BL: "St. Barthélemy",
  BM: "Bermuda",
  BN: "Brunei",
  BO: "Bolivia",
  BQ: "Caribbean Netherlands",
  BR: "Brazil",
  BS: "Bahamas",
  BT: "Bhutan",
  BV: "Bouvet Island",
  BW: "Botswana",
  BY: "Belarus",
  BZ: "Belize",
  CA: "Canada",
  CC: "Cocos (Keeling) Islands",
  CD: "Congo (DRC)",
  CF: "Central African Republic",
  CG: "Congo (Republic)",
  CH: "Switzerland",
  CI: "Côte d’Ivoire",
  CK: "Cook Islands",
  CL: "Chile",
  CM: "Cameroon",
  CN: "China",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  CV: "Cape Verde",
  CW: "Curaçao",
  CX: "Christmas Island",
  CY: "Cyprus",
  CZ: "Czechia",
  DE: "Germany",
  DJ: "Djibouti",
  DK: "Denmark",
  DM: "Dominica",
  DO: "Dominican Republic",
  DZ: "Algeria",
  EC: "Ecuador",
  EE: "Estonia",
  EG: "Egypt",
  EH: "Western Sahara",
  ER: "Eritrea",
  ES: "Spain",
  ET: "Ethiopia",
  FI: "Finland",
  FJ: "Fiji",
  FK: "Falkland Islands",
  FM: "Micronesia",
  FO: "Faroe Islands",
  FR: "France",
  GA: "Gabon",
  GB: "United Kingdom",
  GD: "Grenada",
  GE: "Georgia",
  GF: "French Guiana",
  GG: "Guernsey",
  GH: "Ghana",
  GI: "Gibraltar",
  GL: "Greenland",
  GM: "Gambia",
  GN: "Guinea",
  GP: "Guadeloupe",
  GQ: "Equatorial Guinea",
  GR: "Greece",
  GS: "South Georgia & South Sandwich Islands",
  GT: "Guatemala",
  GU: "Guam",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HK: "Hong Kong",
  HM: "Heard & McDonald Islands",
  HN: "Honduras",
  HR: "Croatia",
  HT: "Haiti",
  HU: "Hungary",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IM: "Isle of Man",
  IN: "India",
  IO: "British Indian Ocean Territory",
  IQ: "Iraq",
  IR: "Iran",
  IS: "Iceland",
  IT: "Italy",
  JE: "Jersey",
  JM: "Jamaica",
  JO: "Jordan",
  JP: "Japan",
  KE: "Kenya",
  KG: "Kyrgyzstan",
  KH: "Cambodia",
  KI: "Kiribati",
  KM: "Comoros",
  KN: "St. Kitts & Nevis",
  KP: "North Korea",
  KR: "South Korea",
  KW: "Kuwait",
  KY: "Cayman Islands",
  KZ: "Kazakhstan",
  LA: "Laos",
  LB: "Lebanon",
  LC: "St. Lucia",
  LI: "Liechtenstein",
  LK: "Sri Lanka",
  LR: "Liberia",
  LS: "Lesotho",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  LY: "Libya",
  MA: "Morocco",
  MC: "Monaco",
  MD: "Moldova",
  ME: "Montenegro",
  MF: "St. Martin",
  MG: "Madagascar",
  MH: "Marshall Islands",
  MK: "North Macedonia",
  ML: "Mali",
  MM: "Myanmar",
  MN: "Mongolia",
  MO: "Macao",
  MP: "Northern Mariana Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MS: "Montserrat",
  MT: "Malta",
  MU: "Mauritius",
  MV: "Maldives",
  MW: "Malawi",
  MX: "Mexico",
  MY: "Malaysia",
  MZ: "Mozambique",
  NA: "Namibia",
  NC: "New Caledonia",
  NE: "Niger",
  NF: "Norfolk Island",
  NG: "Nigeria",
  NI: "Nicaragua",
  NL: "Netherlands",
  NO: "Norway",
  NP: "Nepal",
  NR: "Nauru",
  NU: "Niue",
  NZ: "New Zealand",
  OM: "Oman",
  PA: "Panama",
  PE: "Peru",
  PF: "French Polynesia",
  PG: "Papua New Guinea",
  PH: "Philippines",
  PK: "Pakistan",
  PL: "Poland",
  PM: "St. Pierre & Miquelon",
  PN: "Pitcairn Islands",
  PR: "Puerto Rico",
  PS: "Palestinian Territories",
  PT: "Portugal",
  PW: "Palau",
  PY: "Paraguay",
  QA: "Qatar",
  RE: "Réunion",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  RW: "Rwanda",
  SA: "Saudi Arabia",
  SB: "Solomon Islands",
  SC: "Seychelles",
  SD: "Sudan",
  SE: "Sweden",
  SG: "Singapore",
  SH: "St. Helena",
  SI: "Slovenia",
  SJ: "Svalbard & Jan Mayen",
  SK: "Slovakia",
  SL: "Sierra Leone",
  SM: "San Marino",
  SN: "Senegal",
  SO: "Somalia",
  SR: "Suriname",
  SS: "South Sudan",
  ST: "São Tomé & Príncipe",
  SV: "El Salvador",
  SX: "Sint Maarten",
  SY: "Syria",
  SZ: "Eswatini",
  TC: "Turks & Caicos Islands",
  TD: "Chad",
  TF: "French Southern Territories",
  TG: "Togo",
  TH: "Thailand",
  TJ: "Tajikistan",
  TK: "Tokelau",
  TL: "Timor-Leste",
  TM: "Turkmenistan",
  TN: "Tunisia",
  TO: "Tonga",
  TR: "Türkiye",
  TT: "Trinidad & Tobago",
  TV: "Tuvalu",
  TW: "Taiwan",
  TZ: "Tanzania",
  UA: "Ukraine",
  UG: "Uganda",
  UM: "U.S. Outlying Islands",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VA: "Vatican City",
  VC: "St. Vincent & Grenadines",
  VE: "Venezuela",
  VG: "British Virgin Islands",
  VI: "U.S. Virgin Islands",
  VN: "Vietnam",
  VU: "Vanuatu",
  WF: "Wallis & Futuna",
  WS: "Samoa",
  XK: "Kosovo",
  YE: "Yemen",
  YT: "Mayotte",
  ZA: "South Africa",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

const KNOWN = new Set(ALL_COUNTRY_CODES);

export function isCountryCode(code: string | null | undefined): code is string {
  return !!code && KNOWN.has(code.toUpperCase());
}

export function countryName(code: string) {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

// Names read with "the" in a sentence: the United Kingdom, the Netherlands, the Cayman Islands.
const TAKES_THE = /(Islands|Republic|Territories|Territory|Emirates|Kingdom|States|Netherlands|Philippines|Bahamas|Gambia|Maldives|Comoros)$|^(Congo|Isle of Man)/;

/** The country's name as it reads mid-sentence ("ships to the United Kingdom", "ships to France"). */
export function countryInSentence(code: string) {
  const name = countryName(code);
  return TAKES_THE.test(name) ? `the ${name}` : name;
}

/** Every country, sellable ones first, then the rest by name. */
export function countryOptions(): Array<readonly [code: string, name: string]> {
  const rest = ALL_COUNTRY_CODES.filter((c) => !SELLABLE_COUNTRIES.includes(c))
    .map((c) => [c, countryName(c)] as const)
    .sort((a, b) => a[1].localeCompare(b[1]));
  return [...SELLABLE_COUNTRIES.map((c) => [c, countryName(c)] as const), ...rest];
}

export function isSellableCountry(code: string | null | undefined) {
  return !!code && SELLABLE_COUNTRIES.includes(code.toUpperCase());
}

// Inside US addresses: territory and armed-forces "states", by code or name, and their ZIP ranges.
const US_TERRITORY_REGIONS = new Set([
  "PR", "GU", "VI", "AS", "MP", "UM", "FM", "MH", "PW",
  "PUERTO RICO", "GUAM", "VIRGIN ISLANDS", "US VIRGIN ISLANDS", "U S VIRGIN ISLANDS", "AMERICAN SAMOA",
  "NORTHERN MARIANA ISLANDS", "MARSHALL ISLANDS", "MICRONESIA", "PALAU",
]);
const US_MILITARY_REGIONS = new Set(["AA", "AE", "AP", "ARMED FORCES AMERICAS", "ARMED FORCES EUROPE", "ARMED FORCES PACIFIC"]);
const MILITARY_CITY = new Set(["APO", "FPO", "DPO"]);

function norm(v: string | null | undefined) {
  return (v ?? "").toUpperCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
}

export type AddressBlock = "country" | "territory" | "military";

/**
 * Why a shipping address can't be sold to, or null when it can. Territory
 * and military addresses are caught by state, city or ZIP so a US address
 * typed with a territory or APO detail is still stopped.
 */
export function addressBlock(a: { country: string; region?: string | null; city?: string | null; postalCode?: string | null }): AddressBlock | null {
  if (!isSellableCountry(a.country)) return "country";
  if (a.country.toUpperCase() !== "US") return null;
  const region = norm(a.region);
  const city = norm(a.city);
  const zip3 = (a.postalCode ?? "").replace(/\D/g, "").slice(0, 3);
  const zip5 = (a.postalCode ?? "").replace(/\D/g, "").slice(0, 5);
  if (US_MILITARY_REGIONS.has(region) || MILITARY_CITY.has(city)) return "military";
  if (/^(09\d|340|96[2-6])$/.test(zip3)) return "military";
  if (US_TERRITORY_REGIONS.has(region)) return "territory";
  if (/^(00[6-9]|969)$/.test(zip3) || zip5 === "96799") return "territory";
  return null;
}

export const ADDRESS_BLOCK_MESSAGES: Record<AddressBlock, string> = {
  country: "We currently ship to US addresses only.",
  territory: "We don't ship to US territories yet. We currently ship to the 50 states and Washington, DC.",
  military: "We don't ship to APO, FPO or DPO addresses yet. We currently ship to the 50 states and Washington, DC.",
};

/** Kept for the shipping rules: the countries the checkout can quote. */
export const SHIP_COUNTRY_CODES: readonly string[] = SELLABLE_COUNTRIES;
