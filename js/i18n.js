import i18next from "https://cdn.jsdelivr.net/npm/i18next@22.4.11/+esm"
import httpBackend from "https://cdn.jsdelivr.net/npm/i18next-http-backend@2.2.0/+esm"
import locI18next from "./loc-i18next.js"

await i18next.use(httpBackend).init({
    backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json"
    },
    lng: "fr", // FIX remove this when enabling language detector
    fallbackLng: "en",
    supportedLngs: ["en", "fr", "nl"],
    load: "languageOnly",
    ns: ["common", "modal", "train-card"],
    defaultNS: "common",
    debug: true,
})
export const localize = locI18next.init(i18next)
export const t = i18next.t
