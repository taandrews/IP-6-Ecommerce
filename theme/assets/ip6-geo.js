/*
  Where we sell, on the Shopify store (mirrors lib/countries.ts on the Amplify site).
  Display only: the visitor's "Ship to" choice, or the country Shopify detects
  from their connection, decides whether buy buttons or the launch waitlist
  show. Checkout enforces shipping itself (US market only, 50 states and DC).
*/
(function () {
  var NAMES = {"AD":"Andorra","AE":"United Arab Emirates","AF":"Afghanistan","AG":"Antigua & Barbuda","AI":"Anguilla","AL":"Albania","AM":"Armenia","AO":"Angola","AQ":"Antarctica","AR":"Argentina","AS":"American Samoa","AT":"Austria","AU":"Australia","AW":"Aruba","AX":"Åland Islands","AZ":"Azerbaijan","BA":"Bosnia & Herzegovina","BB":"Barbados","BD":"Bangladesh","BE":"Belgium","BF":"Burkina Faso","BG":"Bulgaria","BH":"Bahrain","BI":"Burundi","BJ":"Benin","BL":"St. Barthélemy","BM":"Bermuda","BN":"Brunei","BO":"Bolivia","BQ":"Caribbean Netherlands","BR":"Brazil","BS":"Bahamas","BT":"Bhutan","BV":"Bouvet Island","BW":"Botswana","BY":"Belarus","BZ":"Belize","CA":"Canada","CC":"Cocos (Keeling) Islands","CD":"Congo (DRC)","CF":"Central African Republic","CG":"Congo (Republic)","CH":"Switzerland","CI":"Côte d’Ivoire","CK":"Cook Islands","CL":"Chile","CM":"Cameroon","CN":"China","CO":"Colombia","CR":"Costa Rica","CU":"Cuba","CV":"Cape Verde","CW":"Curaçao","CX":"Christmas Island","CY":"Cyprus","CZ":"Czechia","DE":"Germany","DJ":"Djibouti","DK":"Denmark","DM":"Dominica","DO":"Dominican Republic","DZ":"Algeria","EC":"Ecuador","EE":"Estonia","EG":"Egypt","EH":"Western Sahara","ER":"Eritrea","ES":"Spain","ET":"Ethiopia","FI":"Finland","FJ":"Fiji","FK":"Falkland Islands","FM":"Micronesia","FO":"Faroe Islands","FR":"France","GA":"Gabon","GB":"United Kingdom","GD":"Grenada","GE":"Georgia","GF":"French Guiana","GG":"Guernsey","GH":"Ghana","GI":"Gibraltar","GL":"Greenland","GM":"Gambia","GN":"Guinea","GP":"Guadeloupe","GQ":"Equatorial Guinea","GR":"Greece","GS":"South Georgia & South Sandwich Islands","GT":"Guatemala","GU":"Guam","GW":"Guinea-Bissau","GY":"Guyana","HK":"Hong Kong","HM":"Heard & McDonald Islands","HN":"Honduras","HR":"Croatia","HT":"Haiti","HU":"Hungary","ID":"Indonesia","IE":"Ireland","IL":"Israel","IM":"Isle of Man","IN":"India","IO":"British Indian Ocean Territory","IQ":"Iraq","IR":"Iran","IS":"Iceland","IT":"Italy","JE":"Jersey","JM":"Jamaica","JO":"Jordan","JP":"Japan","KE":"Kenya","KG":"Kyrgyzstan","KH":"Cambodia","KI":"Kiribati","KM":"Comoros","KN":"St. Kitts & Nevis","KP":"North Korea","KR":"South Korea","KW":"Kuwait","KY":"Cayman Islands","KZ":"Kazakhstan","LA":"Laos","LB":"Lebanon","LC":"St. Lucia","LI":"Liechtenstein","LK":"Sri Lanka","LR":"Liberia","LS":"Lesotho","LT":"Lithuania","LU":"Luxembourg","LV":"Latvia","LY":"Libya","MA":"Morocco","MC":"Monaco","MD":"Moldova","ME":"Montenegro","MF":"St. Martin","MG":"Madagascar","MH":"Marshall Islands","MK":"North Macedonia","ML":"Mali","MM":"Myanmar","MN":"Mongolia","MO":"Macao","MP":"Northern Mariana Islands","MQ":"Martinique","MR":"Mauritania","MS":"Montserrat","MT":"Malta","MU":"Mauritius","MV":"Maldives","MW":"Malawi","MX":"Mexico","MY":"Malaysia","MZ":"Mozambique","NA":"Namibia","NC":"New Caledonia","NE":"Niger","NF":"Norfolk Island","NG":"Nigeria","NI":"Nicaragua","NL":"Netherlands","NO":"Norway","NP":"Nepal","NR":"Nauru","NU":"Niue","NZ":"New Zealand","OM":"Oman","PA":"Panama","PE":"Peru","PF":"French Polynesia","PG":"Papua New Guinea","PH":"Philippines","PK":"Pakistan","PL":"Poland","PM":"St. Pierre & Miquelon","PN":"Pitcairn Islands","PR":"Puerto Rico","PS":"Palestinian Territories","PT":"Portugal","PW":"Palau","PY":"Paraguay","QA":"Qatar","RE":"Réunion","RO":"Romania","RS":"Serbia","RU":"Russia","RW":"Rwanda","SA":"Saudi Arabia","SB":"Solomon Islands","SC":"Seychelles","SD":"Sudan","SE":"Sweden","SG":"Singapore","SH":"St. Helena","SI":"Slovenia","SJ":"Svalbard & Jan Mayen","SK":"Slovakia","SL":"Sierra Leone","SM":"San Marino","SN":"Senegal","SO":"Somalia","SR":"Suriname","SS":"South Sudan","ST":"São Tomé & Príncipe","SV":"El Salvador","SX":"Sint Maarten","SY":"Syria","SZ":"Eswatini","TC":"Turks & Caicos Islands","TD":"Chad","TF":"French Southern Territories","TG":"Togo","TH":"Thailand","TJ":"Tajikistan","TK":"Tokelau","TL":"Timor-Leste","TM":"Turkmenistan","TN":"Tunisia","TO":"Tonga","TR":"Türkiye","TT":"Trinidad & Tobago","TV":"Tuvalu","TW":"Taiwan","TZ":"Tanzania","UA":"Ukraine","UG":"Uganda","UM":"U.S. Outlying Islands","US":"United States","UY":"Uruguay","UZ":"Uzbekistan","VA":"Vatican City","VC":"St. Vincent & Grenadines","VE":"Venezuela","VG":"British Virgin Islands","VI":"U.S. Virgin Islands","VN":"Vietnam","VU":"Vanuatu","WF":"Wallis & Futuna","WS":"Samoa","XK":"Kosovo","YE":"Yemen","YT":"Mayotte","ZA":"South Africa","ZM":"Zambia","ZW":"Zimbabwe"};
  var SELLABLE = ["US"];
  var KEY = "ip6_country", IPKEY = "ip6_ip_country";
  var THE = /(Islands|Republic|Territories|Territory|Emirates|Kingdom|States|Netherlands|Philippines|Bahamas|Gambia|Maldives|Comoros)$|^(Congo|Isle of Man)/;
  var root = document.documentElement;
  var state = { country: "US", sellable: true };

  function read(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }
  function write(store, k, v) { try { window[store].setItem(k, v); } catch (e) {} }
  function valid(c) { return !!c && Object.prototype.hasOwnProperty.call(NAMES, String(c).toUpperCase()); }
  function sellable(c) { return SELLABLE.indexOf(c) >= 0; }
  function sentence(c) { var n = NAMES[c] || c; return THE.test(n) ? "the " + n : n; }
  var ordered = null;
  function options() {
    if (!ordered) {
      ordered = Object.keys(NAMES).filter(function (c) { return !sellable(c); }).sort(function (a, b) { return NAMES[a].localeCompare(NAMES[b]); });
      ordered = SELLABLE.concat(ordered);
    }
    return ordered;
  }
  function fill(select, onlyUnsold) {
    if (select.getAttribute("data-filled")) return;
    var keep = select.querySelector('option[value=""]');
    select.textContent = "";
    if (keep) select.appendChild(keep);
    options().forEach(function (c) {
      if (onlyUnsold && sellable(c)) return;
      var o = document.createElement("option"); o.value = c; o.textContent = NAMES[c]; select.appendChild(o);
    });
    select.setAttribute("data-filled", "1");
  }

  function paint(scope) {
    var c = state.country;
    (scope || document).querySelectorAll("[data-ship-to]").forEach(function (s) { fill(s, false); s.value = c; });
    (scope || document).querySelectorAll("[data-ship-code]").forEach(function (e) { e.textContent = c; });
    (scope || document).querySelectorAll("[data-country-sentence]").forEach(function (e) { e.textContent = sentence(c); });
    (scope || document).querySelectorAll("[data-waitlist-country]").forEach(function (s) {
      fill(s, true);
      if (!s.getAttribute("data-touched")) s.value = state.sellable ? "" : c;
    });
  }
  function apply(c) {
    c = valid(c) ? String(c).toUpperCase() : "US";
    state.country = c; state.sellable = sellable(c);
    root.setAttribute("data-ship-country", c);
    root.setAttribute("data-sellable", state.sellable ? "true" : "false");
    paint();
  }

  // Ship to switcher (header): remembered in this browser.
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.matches && t.matches("[data-ship-to]")) { write("localStorage", KEY, t.value); apply(t.value); }
    if (t.matches && t.matches("[data-waitlist-country]")) t.setAttribute("data-touched", "1");
  });

  // Launch waitlist: posts to the shared list on the Amplify site.
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form.matches || !form.matches("[data-waitlist]")) return;
    e.preventDefault();
    var err = form.querySelector("[data-wl-error]"), btn = form.querySelector("[data-wl-submit]");
    var email = form.querySelector('[name="email"]').value.trim();
    var country = form.querySelector("[data-waitlist-country]").value;
    var first = form.querySelector('[name="first_name"]').value.trim();
    var consent = form.querySelector('[name="consent"]').checked;
    function fail(msg) { err.textContent = msg; err.hidden = false; }
    err.hidden = true;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Please enter your email address.");
    if (!country) return fail("Please choose your country.");
    if (!consent) return fail("Please tick the box so we can email you at launch.");
    btn.disabled = true; btn.textContent = "Saving\u2026";
    // The solved CAPTCHA; if the visitor was quicker than the puzzle, finish it now.
    var widget = form.querySelector("altcha-widget");
    function altcha() { return new FormData(form).get("altcha") || ""; }
    var ready = altcha() || !widget || !widget.verify ? Promise.resolve() : Promise.resolve(widget.verify()).catch(function () {});
    ready.then(function () {
      return fetch(form.getAttribute("data-endpoint"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, country: country, firstName: first || undefined, consent: true, product: form.getAttribute("data-product") || undefined, page: location.pathname, source: form.getAttribute("data-source"), site: "shopify", altcha: altcha() || undefined })
      });
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { btn.disabled = false; btn.textContent = "Notify me at launch"; return fail(res.d.error || "We couldn't save that. Please try again."); }
        var done = form.querySelector("[data-wl-done]");
        done.querySelector("[data-wl-email]").textContent = email;
        done.querySelector("[data-wl-where]").textContent = sentence(country);
        form.querySelectorAll("[data-wl-field]").forEach(function (el) { el.hidden = true; });
        done.hidden = false;
      })
      .catch(function () { btn.disabled = false; btn.textContent = "Notify me at launch"; fail("We couldn't save that. Please try again."); });
  });

  // The cart drawer re-renders its contents; fill any new country text.
  new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      for (var j = 0; j < list[i].addedNodes.length; j++) {
        var n = list[i].addedNodes[j];
        if (n.nodeType === 1 && (n.matches("[data-country-sentence],[data-ship-to],[data-waitlist-country]") || n.querySelector("[data-country-sentence],[data-ship-to],[data-waitlist-country]"))) { paint(n.parentNode || n); }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  var chosen = read("localStorage", KEY), detected = read("sessionStorage", IPKEY);
  apply(valid(chosen) ? chosen : valid(detected) ? detected : "US");
  if (!valid(detected)) {
    fetch("/browsing_context_suggestions.json?country[enabled]=true", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var c = d && d.detected_values && d.detected_values.country && d.detected_values.country.handle;
        if (!valid(c)) return;
        write("sessionStorage", IPKEY, c);
        if (!valid(read("localStorage", KEY))) apply(c);
      })
      .catch(function () {});
  }
  window.ip6Geo = { get country() { return state.country; }, get sellable() { return state.sellable; }, set: function (c) { write("localStorage", KEY, c); apply(c); } };
})();
