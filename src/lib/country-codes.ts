/**
 * دول العالم لحقل الهاتف: رمز الاتصال، الاسم بالعربية والإنجليزية،
 * وأطوال الرقم الوطني المقبولة (بعد إسقاط الصفر البادئ ورمز الدولة).
 *
 * الرقم يُخزَّن دائماً بالصيغة الدولية `+963912345678`، ويُعرض الرمز
 * للمستخدم بصيغة `00963` كما هو مألوف محلياً.
 *
 * `lengths` مصدر التحقّق وعدد الخانات المسموح إدخالها: لكل دولة الأطوال
 * الشائعة لرقمها الوطني، فيرفض النموذج رقماً ناقصاً قبل إرساله للخادم.
 */
export interface CountryCode {
  /** ISO 3166-1 alpha-2 */
  iso: string;
  /** رمز الاتصال بدون + */
  dial: string;
  /** أطوال الرقم الوطني المقبولة — مرتّبة تصاعدياً */
  lengths: number[];
  name: { ar: string; en: string };
}

export const DEFAULT_COUNTRY_ISO = "SY";

export const COUNTRY_CODES: CountryCode[] = [
  { iso: "SY", dial: "963", lengths: [9], name: { ar: "سوريا", en: "Syria" } },
  { iso: "LB", dial: "961", lengths: [7, 8], name: { ar: "لبنان", en: "Lebanon" } },
  { iso: "JO", dial: "962", lengths: [9], name: { ar: "الأردن", en: "Jordan" } },
  { iso: "IQ", dial: "964", lengths: [10], name: { ar: "العراق", en: "Iraq" } },
  { iso: "TR", dial: "90", lengths: [10], name: { ar: "تركيا", en: "Türkiye" } },
  { iso: "PS", dial: "970", lengths: [9], name: { ar: "فلسطين", en: "Palestine" } },
  { iso: "EG", dial: "20", lengths: [10], name: { ar: "مصر", en: "Egypt" } },
  { iso: "SA", dial: "966", lengths: [9], name: { ar: "السعودية", en: "Saudi Arabia" } },
  { iso: "AE", dial: "971", lengths: [9], name: { ar: "الإمارات", en: "United Arab Emirates" } },
  { iso: "QA", dial: "974", lengths: [8], name: { ar: "قطر", en: "Qatar" } },
  { iso: "KW", dial: "965", lengths: [8], name: { ar: "الكويت", en: "Kuwait" } },
  { iso: "BH", dial: "973", lengths: [8], name: { ar: "البحرين", en: "Bahrain" } },
  { iso: "OM", dial: "968", lengths: [8], name: { ar: "عُمان", en: "Oman" } },
  { iso: "YE", dial: "967", lengths: [9], name: { ar: "اليمن", en: "Yemen" } },
  { iso: "LY", dial: "218", lengths: [9], name: { ar: "ليبيا", en: "Libya" } },
  { iso: "TN", dial: "216", lengths: [8], name: { ar: "تونس", en: "Tunisia" } },
  { iso: "DZ", dial: "213", lengths: [9], name: { ar: "الجزائر", en: "Algeria" } },
  { iso: "MA", dial: "212", lengths: [9], name: { ar: "المغرب", en: "Morocco" } },
  { iso: "SD", dial: "249", lengths: [9], name: { ar: "السودان", en: "Sudan" } },
  { iso: "SS", dial: "211", lengths: [9], name: { ar: "جنوب السودان", en: "South Sudan" } },
  { iso: "SO", dial: "252", lengths: [7, 8], name: { ar: "الصومال", en: "Somalia" } },
  { iso: "DJ", dial: "253", lengths: [8], name: { ar: "جيبوتي", en: "Djibouti" } },
  { iso: "KM", dial: "269", lengths: [7], name: { ar: "جزر القمر", en: "Comoros" } },
  { iso: "MR", dial: "222", lengths: [8], name: { ar: "موريتانيا", en: "Mauritania" } },
  { iso: "DE", dial: "49", lengths: [10, 11], name: { ar: "ألمانيا", en: "Germany" } },
  { iso: "AT", dial: "43", lengths: [10, 11], name: { ar: "النمسا", en: "Austria" } },
  { iso: "CH", dial: "41", lengths: [9], name: { ar: "سويسرا", en: "Switzerland" } },
  { iso: "NL", dial: "31", lengths: [9], name: { ar: "هولندا", en: "Netherlands" } },
  { iso: "BE", dial: "32", lengths: [9], name: { ar: "بلجيكا", en: "Belgium" } },
  { iso: "FR", dial: "33", lengths: [9], name: { ar: "فرنسا", en: "France" } },
  { iso: "GB", dial: "44", lengths: [10], name: { ar: "المملكة المتحدة", en: "United Kingdom" } },
  { iso: "IE", dial: "353", lengths: [9], name: { ar: "أيرلندا", en: "Ireland" } },
  { iso: "SE", dial: "46", lengths: [9], name: { ar: "السويد", en: "Sweden" } },
  { iso: "NO", dial: "47", lengths: [8], name: { ar: "النرويج", en: "Norway" } },
  { iso: "DK", dial: "45", lengths: [8], name: { ar: "الدنمارك", en: "Denmark" } },
  { iso: "FI", dial: "358", lengths: [9, 10], name: { ar: "فنلندا", en: "Finland" } },
  { iso: "IS", dial: "354", lengths: [7], name: { ar: "آيسلندا", en: "Iceland" } },
  { iso: "IT", dial: "39", lengths: [9, 10], name: { ar: "إيطاليا", en: "Italy" } },
  { iso: "ES", dial: "34", lengths: [9], name: { ar: "إسبانيا", en: "Spain" } },
  { iso: "PT", dial: "351", lengths: [9], name: { ar: "البرتغال", en: "Portugal" } },
  { iso: "GR", dial: "30", lengths: [10], name: { ar: "اليونان", en: "Greece" } },
  { iso: "CY", dial: "357", lengths: [8], name: { ar: "قبرص", en: "Cyprus" } },
  { iso: "MT", dial: "356", lengths: [8], name: { ar: "مالطا", en: "Malta" } },
  { iso: "PL", dial: "48", lengths: [9], name: { ar: "بولندا", en: "Poland" } },
  { iso: "CZ", dial: "420", lengths: [9], name: { ar: "التشيك", en: "Czechia" } },
  { iso: "SK", dial: "421", lengths: [9], name: { ar: "سلوفاكيا", en: "Slovakia" } },
  { iso: "HU", dial: "36", lengths: [9], name: { ar: "المجر", en: "Hungary" } },
  { iso: "RO", dial: "40", lengths: [9], name: { ar: "رومانيا", en: "Romania" } },
  { iso: "BG", dial: "359", lengths: [9], name: { ar: "بلغاريا", en: "Bulgaria" } },
  { iso: "HR", dial: "385", lengths: [8, 9], name: { ar: "كرواتيا", en: "Croatia" } },
  { iso: "SI", dial: "386", lengths: [8], name: { ar: "سلوفينيا", en: "Slovenia" } },
  { iso: "RS", dial: "381", lengths: [8, 9], name: { ar: "صربيا", en: "Serbia" } },
  { iso: "BA", dial: "387", lengths: [8], name: { ar: "البوسنة والهرسك", en: "Bosnia and Herzegovina" } },
  { iso: "ME", dial: "382", lengths: [8], name: { ar: "الجبل الأسود", en: "Montenegro" } },
  { iso: "MK", dial: "389", lengths: [8], name: { ar: "مقدونيا الشمالية", en: "North Macedonia" } },
  { iso: "AL", dial: "355", lengths: [9], name: { ar: "ألبانيا", en: "Albania" } },
  { iso: "XK", dial: "383", lengths: [8], name: { ar: "كوسوفو", en: "Kosovo" } },
  { iso: "UA", dial: "380", lengths: [9], name: { ar: "أوكرانيا", en: "Ukraine" } },
  { iso: "BY", dial: "375", lengths: [9], name: { ar: "بيلاروسيا", en: "Belarus" } },
  { iso: "MD", dial: "373", lengths: [8], name: { ar: "مولدوفا", en: "Moldova" } },
  { iso: "LT", dial: "370", lengths: [8], name: { ar: "ليتوانيا", en: "Lithuania" } },
  { iso: "LV", dial: "371", lengths: [8], name: { ar: "لاتفيا", en: "Latvia" } },
  { iso: "EE", dial: "372", lengths: [7, 8], name: { ar: "إستونيا", en: "Estonia" } },
  { iso: "RU", dial: "7", lengths: [10], name: { ar: "روسيا", en: "Russia" } },
  { iso: "KZ", dial: "7", lengths: [10], name: { ar: "كازاخستان", en: "Kazakhstan" } },
  { iso: "GE", dial: "995", lengths: [9], name: { ar: "جورجيا", en: "Georgia" } },
  { iso: "AM", dial: "374", lengths: [8], name: { ar: "أرمينيا", en: "Armenia" } },
  { iso: "AZ", dial: "994", lengths: [9], name: { ar: "أذربيجان", en: "Azerbaijan" } },
  { iso: "LU", dial: "352", lengths: [9], name: { ar: "لوكسمبورغ", en: "Luxembourg" } },
  { iso: "MC", dial: "377", lengths: [8], name: { ar: "موناكو", en: "Monaco" } },
  { iso: "AD", dial: "376", lengths: [6], name: { ar: "أندورا", en: "Andorra" } },
  { iso: "SM", dial: "378", lengths: [10], name: { ar: "سان مارينو", en: "San Marino" } },
  { iso: "LI", dial: "423", lengths: [7], name: { ar: "ليختنشتاين", en: "Liechtenstein" } },
  { iso: "US", dial: "1", lengths: [10], name: { ar: "الولايات المتحدة", en: "United States" } },
  { iso: "CA", dial: "1", lengths: [10], name: { ar: "كندا", en: "Canada" } },
  { iso: "MX", dial: "52", lengths: [10], name: { ar: "المكسيك", en: "Mexico" } },
  { iso: "GT", dial: "502", lengths: [8], name: { ar: "غواتيمالا", en: "Guatemala" } },
  { iso: "BZ", dial: "501", lengths: [7], name: { ar: "بليز", en: "Belize" } },
  { iso: "SV", dial: "503", lengths: [8], name: { ar: "السلفادور", en: "El Salvador" } },
  { iso: "HN", dial: "504", lengths: [8], name: { ar: "هندوراس", en: "Honduras" } },
  { iso: "NI", dial: "505", lengths: [8], name: { ar: "نيكاراغوا", en: "Nicaragua" } },
  { iso: "CR", dial: "506", lengths: [8], name: { ar: "كوستاريكا", en: "Costa Rica" } },
  { iso: "PA", dial: "507", lengths: [8], name: { ar: "بنما", en: "Panama" } },
  { iso: "CU", dial: "53", lengths: [8], name: { ar: "كوبا", en: "Cuba" } },
  { iso: "DO", dial: "1809", lengths: [10], name: { ar: "جمهورية الدومينيكان", en: "Dominican Republic" } },
  { iso: "HT", dial: "509", lengths: [8], name: { ar: "هايتي", en: "Haiti" } },
  { iso: "JM", dial: "1876", lengths: [10], name: { ar: "جامايكا", en: "Jamaica" } },
  { iso: "TT", dial: "1868", lengths: [10], name: { ar: "ترينيداد وتوباغو", en: "Trinidad and Tobago" } },
  { iso: "BB", dial: "1246", lengths: [10], name: { ar: "بربادوس", en: "Barbados" } },
  { iso: "BS", dial: "1242", lengths: [10], name: { ar: "جزر البهاما", en: "Bahamas" } },
  { iso: "PR", dial: "1787", lengths: [10], name: { ar: "بورتوريكو", en: "Puerto Rico" } },
  { iso: "CO", dial: "57", lengths: [10], name: { ar: "كولومبيا", en: "Colombia" } },
  { iso: "VE", dial: "58", lengths: [10], name: { ar: "فنزويلا", en: "Venezuela" } },
  { iso: "EC", dial: "593", lengths: [9], name: { ar: "الإكوادور", en: "Ecuador" } },
  { iso: "PE", dial: "51", lengths: [9], name: { ar: "بيرو", en: "Peru" } },
  { iso: "BO", dial: "591", lengths: [8], name: { ar: "بوليفيا", en: "Bolivia" } },
  { iso: "BR", dial: "55", lengths: [10, 11], name: { ar: "البرازيل", en: "Brazil" } },
  { iso: "CL", dial: "56", lengths: [9], name: { ar: "تشيلي", en: "Chile" } },
  { iso: "AR", dial: "54", lengths: [10], name: { ar: "الأرجنتين", en: "Argentina" } },
  { iso: "UY", dial: "598", lengths: [8], name: { ar: "أوروغواي", en: "Uruguay" } },
  { iso: "PY", dial: "595", lengths: [9], name: { ar: "باراغواي", en: "Paraguay" } },
  { iso: "GY", dial: "592", lengths: [7], name: { ar: "غيانا", en: "Guyana" } },
  { iso: "SR", dial: "597", lengths: [7], name: { ar: "سورينام", en: "Suriname" } },
  { iso: "NG", dial: "234", lengths: [10], name: { ar: "نيجيريا", en: "Nigeria" } },
  { iso: "GH", dial: "233", lengths: [9], name: { ar: "غانا", en: "Ghana" } },
  { iso: "CI", dial: "225", lengths: [10], name: { ar: "ساحل العاج", en: "Cote d’Ivoire" } },
  { iso: "SN", dial: "221", lengths: [9], name: { ar: "السنغال", en: "Senegal" } },
  { iso: "ML", dial: "223", lengths: [8], name: { ar: "مالي", en: "Mali" } },
  { iso: "BF", dial: "226", lengths: [8], name: { ar: "بوركينا فاسو", en: "Burkina Faso" } },
  { iso: "NE", dial: "227", lengths: [8], name: { ar: "النيجر", en: "Niger" } },
  { iso: "TD", dial: "235", lengths: [8], name: { ar: "تشاد", en: "Chad" } },
  { iso: "CM", dial: "237", lengths: [9], name: { ar: "الكاميرون", en: "Cameroon" } },
  { iso: "CF", dial: "236", lengths: [8], name: { ar: "أفريقيا الوسطى", en: "Central African Republic" } },
  { iso: "GA", dial: "241", lengths: [8], name: { ar: "الغابون", en: "Gabon" } },
  { iso: "CG", dial: "242", lengths: [9], name: { ar: "الكونغو", en: "Congo" } },
  { iso: "CD", dial: "243", lengths: [9], name: { ar: "الكونغو الديمقراطية", en: "DR Congo" } },
  { iso: "AO", dial: "244", lengths: [9], name: { ar: "أنغولا", en: "Angola" } },
  { iso: "GN", dial: "224", lengths: [9], name: { ar: "غينيا", en: "Guinea" } },
  { iso: "GW", dial: "245", lengths: [9], name: { ar: "غينيا بيساو", en: "Guinea-Bissau" } },
  { iso: "SL", dial: "232", lengths: [8], name: { ar: "سيراليون", en: "Sierra Leone" } },
  { iso: "LR", dial: "231", lengths: [8, 9], name: { ar: "ليبيريا", en: "Liberia" } },
  { iso: "TG", dial: "228", lengths: [8], name: { ar: "توغو", en: "Togo" } },
  { iso: "BJ", dial: "229", lengths: [8], name: { ar: "بنين", en: "Benin" } },
  { iso: "GM", dial: "220", lengths: [7], name: { ar: "غامبيا", en: "Gambia" } },
  { iso: "CV", dial: "238", lengths: [7], name: { ar: "الرأس الأخضر", en: "Cape Verde" } },
  { iso: "ST", dial: "239", lengths: [7], name: { ar: "ساو تومي وبرينسيبي", en: "Sao Tome and Principe" } },
  { iso: "GQ", dial: "240", lengths: [9], name: { ar: "غينيا الاستوائية", en: "Equatorial Guinea" } },
  { iso: "ET", dial: "251", lengths: [9], name: { ar: "إثيوبيا", en: "Ethiopia" } },
  { iso: "ER", dial: "291", lengths: [7], name: { ar: "إريتريا", en: "Eritrea" } },
  { iso: "KE", dial: "254", lengths: [9], name: { ar: "كينيا", en: "Kenya" } },
  { iso: "UG", dial: "256", lengths: [9], name: { ar: "أوغندا", en: "Uganda" } },
  { iso: "TZ", dial: "255", lengths: [9], name: { ar: "تنزانيا", en: "Tanzania" } },
  { iso: "RW", dial: "250", lengths: [9], name: { ar: "رواندا", en: "Rwanda" } },
  { iso: "BI", dial: "257", lengths: [8], name: { ar: "بوروندي", en: "Burundi" } },
  { iso: "MZ", dial: "258", lengths: [9], name: { ar: "موزمبيق", en: "Mozambique" } },
  { iso: "ZM", dial: "260", lengths: [9], name: { ar: "زامبيا", en: "Zambia" } },
  { iso: "ZW", dial: "263", lengths: [9], name: { ar: "زيمبابوي", en: "Zimbabwe" } },
  { iso: "MW", dial: "265", lengths: [9], name: { ar: "مالاوي", en: "Malawi" } },
  { iso: "BW", dial: "267", lengths: [8], name: { ar: "بوتسوانا", en: "Botswana" } },
  { iso: "NA", dial: "264", lengths: [9], name: { ar: "ناميبيا", en: "Namibia" } },
  { iso: "ZA", dial: "27", lengths: [9], name: { ar: "جنوب أفريقيا", en: "South Africa" } },
  { iso: "LS", dial: "266", lengths: [8], name: { ar: "ليسوتو", en: "Lesotho" } },
  { iso: "SZ", dial: "268", lengths: [8], name: { ar: "إسواتيني", en: "Eswatini" } },
  { iso: "MG", dial: "261", lengths: [9], name: { ar: "مدغشقر", en: "Madagascar" } },
  { iso: "MU", dial: "230", lengths: [8], name: { ar: "موريشيوس", en: "Mauritius" } },
  { iso: "SC", dial: "248", lengths: [7], name: { ar: "سيشل", en: "Seychelles" } },
  { iso: "IR", dial: "98", lengths: [10], name: { ar: "إيران", en: "Iran" } },
  { iso: "AF", dial: "93", lengths: [9], name: { ar: "أفغانستان", en: "Afghanistan" } },
  { iso: "PK", dial: "92", lengths: [10], name: { ar: "باكستان", en: "Pakistan" } },
  { iso: "IN", dial: "91", lengths: [10], name: { ar: "الهند", en: "India" } },
  { iso: "BD", dial: "880", lengths: [10], name: { ar: "بنغلاديش", en: "Bangladesh" } },
  { iso: "LK", dial: "94", lengths: [9], name: { ar: "سريلانكا", en: "Sri Lanka" } },
  { iso: "NP", dial: "977", lengths: [10], name: { ar: "نيبال", en: "Nepal" } },
  { iso: "BT", dial: "975", lengths: [8], name: { ar: "بوتان", en: "Bhutan" } },
  { iso: "MV", dial: "960", lengths: [7], name: { ar: "المالديف", en: "Maldives" } },
  { iso: "CN", dial: "86", lengths: [11], name: { ar: "الصين", en: "China" } },
  { iso: "HK", dial: "852", lengths: [8], name: { ar: "هونغ كونغ", en: "Hong Kong" } },
  { iso: "MO", dial: "853", lengths: [8], name: { ar: "ماكاو", en: "Macau" } },
  { iso: "TW", dial: "886", lengths: [9], name: { ar: "تايوان", en: "Taiwan" } },
  { iso: "JP", dial: "81", lengths: [10], name: { ar: "اليابان", en: "Japan" } },
  { iso: "KR", dial: "82", lengths: [9, 10], name: { ar: "كوريا الجنوبية", en: "South Korea" } },
  { iso: "MN", dial: "976", lengths: [8], name: { ar: "منغوليا", en: "Mongolia" } },
  { iso: "UZ", dial: "998", lengths: [9], name: { ar: "أوزبكستان", en: "Uzbekistan" } },
  { iso: "TM", dial: "993", lengths: [8], name: { ar: "تركمانستان", en: "Turkmenistan" } },
  { iso: "TJ", dial: "992", lengths: [9], name: { ar: "طاجيكستان", en: "Tajikistan" } },
  { iso: "KG", dial: "996", lengths: [9], name: { ar: "قيرغيزستان", en: "Kyrgyzstan" } },
  { iso: "TH", dial: "66", lengths: [9], name: { ar: "تايلاند", en: "Thailand" } },
  { iso: "VN", dial: "84", lengths: [9], name: { ar: "فيتنام", en: "Vietnam" } },
  { iso: "KH", dial: "855", lengths: [8, 9], name: { ar: "كمبوديا", en: "Cambodia" } },
  { iso: "LA", dial: "856", lengths: [9], name: { ar: "لاوس", en: "Laos" } },
  { iso: "MM", dial: "95", lengths: [8, 10], name: { ar: "ميانمار", en: "Myanmar" } },
  { iso: "MY", dial: "60", lengths: [9, 10], name: { ar: "ماليزيا", en: "Malaysia" } },
  { iso: "SG", dial: "65", lengths: [8], name: { ar: "سنغافورة", en: "Singapore" } },
  { iso: "ID", dial: "62", lengths: [9, 10, 11], name: { ar: "إندونيسيا", en: "Indonesia" } },
  { iso: "PH", dial: "63", lengths: [10], name: { ar: "الفلبين", en: "Philippines" } },
  { iso: "BN", dial: "673", lengths: [7], name: { ar: "بروناي", en: "Brunei" } },
  { iso: "TL", dial: "670", lengths: [8], name: { ar: "تيمور الشرقية", en: "Timor-Leste" } },
  { iso: "AU", dial: "61", lengths: [9], name: { ar: "أستراليا", en: "Australia" } },
  { iso: "NZ", dial: "64", lengths: [8, 9], name: { ar: "نيوزيلندا", en: "New Zealand" } },
  { iso: "PG", dial: "675", lengths: [8], name: { ar: "بابوا غينيا الجديدة", en: "Papua New Guinea" } },
  { iso: "FJ", dial: "679", lengths: [7], name: { ar: "فيجي", en: "Fiji" } },
  { iso: "NC", dial: "687", lengths: [6], name: { ar: "كاليدونيا الجديدة", en: "New Caledonia" } },
  { iso: "PF", dial: "689", lengths: [8], name: { ar: "بولينيزيا الفرنسية", en: "French Polynesia" } },
  { iso: "VU", dial: "678", lengths: [7], name: { ar: "فانواتو", en: "Vanuatu" } },
  { iso: "SB", dial: "677", lengths: [7], name: { ar: "جزر سليمان", en: "Solomon Islands" } },
  { iso: "WS", dial: "685", lengths: [7], name: { ar: "ساموا", en: "Samoa" } },
  { iso: "TO", dial: "676", lengths: [7], name: { ar: "تونغا", en: "Tonga" } },
];

const BY_ISO = new Map(COUNTRY_CODES.map((item) => [item.iso, item]));

export function findCountry(iso: string | undefined): CountryCode {
  return (iso ? BY_ISO.get(iso) : undefined) ?? BY_ISO.get(DEFAULT_COUNTRY_ISO)!;
}

/** أطول رقم وطني مقبول — الحدّ الأعلى لعدد خانات الحقل. */
export function maxDigits(country: CountryCode): number {
  return Math.max(...country.lengths);
}

/** أقصر رقم وطني مقبول. */
export function minDigits(country: CountryCode): number {
  return Math.min(...country.lengths);
}

/** الأرقام وحدها بلا صفر بادئ — الشكل الذي نتحقّق منه ونرسله. */
export function nationalDigits(local: string): string {
  return local.replace(/\D/g, "").replace(/^0+/, "");
}

/** هل عدد خانات الرقم مطابق لإحدى صيغ الدولة؟ */
export function isValidNationalNumber(
  country: CountryCode,
  local: string,
): boolean {
  return country.lengths.includes(nationalDigits(local).length);
}

/** عدد الخانات المطلوب كنصّ: «9» أو «9 / 10». */
export function digitsHint(country: CountryCode): string {
  return country.lengths.join(" / ");
}

/** قناع الإدخال المتوقّع — يُعرض كـ placeholder. */
export function phonePlaceholder(country: CountryCode): string {
  return "X".repeat(maxDigits(country));
}

/** يركّب الرقم الدولي: يزيل الصفر الأول من الرقم المحلي وأي فواصل. */
export function buildInternationalPhone(dial: string, local: string): string {
  return `+${dial}${nationalDigits(local)}`;
}

/**
 * صورة علم الدولة.
 *
 * flagcdn يقدّم أعلاماً موحّدة الشكل لكل الدول بصيغة PNG — وهو الحلّ
 * الوحيد الذي يعرض علماً حقيقياً على ويندوز أيضاً، حيث لا تُرسَم إيموجي
 * الأعلام إطلاقاً. علم سوريا يُستثنى ويُرسم محلياً في `CountryFlag`
 * لأن المصادر العامة ما زالت تعرض العلم القديم.
 */
export function flagImageUrl(iso: string, width: 20 | 40 | 80 = 40): string {
  return `https://flagcdn.com/w${width}/${iso.toLowerCase()}.png`;
}
