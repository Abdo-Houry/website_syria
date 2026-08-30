import type { EntityTranslations } from "@/i18n/translate-entity";

/**
 * أنواع مطابقة تماماً لكيانات الباك اند (src/entities) واستجاباته.
 * لا يوجد أي حقل مخترع هنا — كل ما يظهر مأخوذ من الكود الفعلي للباك اند.
 */

/** غلاف الاستجابة الموحّد: utils/api-response.ts */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

/** شكل الخطأ القادم من middleware/error.middleware.ts */
export interface ApiErrorBody {
  success: false;
  message: string;
}

/* ------------------------------------------------------------------ */
/* المستخدم                                                            */
/* ------------------------------------------------------------------ */

export type UserStatus = "ACTIVE" | "BLOCKED";

/** ما يعيده تسجيل الدخول/الإنشاء (user-auth.service.ts) — مختصر. */
export interface AuthUser {
  id: number;
  name: string;
  phone: string;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

/** ما يعيده GET /users/profile (user-profile.service.ts select) */
export interface UserProfile {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  image?: string | null;
  status: UserStatus | string;
  created_at: string;
}

/* صف المستخدم في لوحة الإدارة — services/admin-user.service.ts (list) */
export interface AdminUserRow {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  image?: string | null;
  status: UserStatus | string;
  created_at: string;
  /** عدد نسخ الكتيّبات المفعّلة لديه */
  books: number;
  placesVisited: number;
  challengesCompleted: number;
  stampsCollected: number;
}

/** تقدّم المستخدم داخل نسخة كتيّب واحدة. */
export interface AdminUserBookProgress {
  placesVisited: number;
  placesTotal: number;
  challengesDone: number;
  challengesTotal: number;
  stampsCollected: number;
  stampsTotal: number;
  overall: number;
}

export interface AdminUserBook {
  id: number;
  active: boolean;
  purchased_at: string;
  copy?: {
    id: number;
    serial_number: string;
    version: string;
  } | null;
  book?: {
    id: number;
    name: string;
  } | null;
  progress: AdminUserBookProgress;
  visits: Array<{
    id: number;
    visited_at: string;
    place?: { id: number; name: string } | null;
    province?: { id: number; name: string } | null;
  }>;
  challenges: Array<{
    id: number;
    completed: boolean;
    completed_at: string;
    answer?: string | null;
    challenge?: { id: number; title: string } | null;
  }>;
  stamps: Array<{
    id: number;
    collected_at: string;
    stamp?: { id: number; name: string; image_url: string } | null;
  }>;
}

/** GET /api/admin/users/:id */
export interface AdminUserDetails {
  user: {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
    image?: string | null;
    status: UserStatus | string;
    created_at: string;
  };
  totals: {
    books: number;
    placesVisited: number;
    challengesCompleted: number;
    stampsCollected: number;
  };
  books: AdminUserBook[];
}

/* ------------------------------------------------------------------ */
/* المحتوى السياحي                                                     */
/* ------------------------------------------------------------------ */

export interface ProvinceImage {
  id: number;
  image_url: string;
  created_at: string;
}

export interface ProvinceVideo {
  id: number;
  video_url: string;
  title?: string | null;
  created_at: string;
}

export interface Province {
  id: number;
  name: string;
  summary?: string | null;
  description?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status: boolean;
  images?: ProvinceImage[];
  videos?: ProvinceVideo[];
  places?: Place[];
  /** ترجمات en/de/tr — العربية في الأعمدة الأصلية */
  translations?: EntityTranslations | null;
  created_at: string;
  updated_at: string;
}

export interface PlaceImage {
  id: number;
  image_url: string;
  created_at: string;
}

export interface PlaceVideo {
  id: number;
  video_url: string;
  title?: string | null;
  created_at: string;
}

/** منطقة تجمع عدة أماكن داخل محافظة — مثل «أبواب حلب» */
export interface Area {
  id: number;
  name: string;
  description?: string | null;
  status: boolean;
  province?: Province;
  places?: Place[];
  /** ترجمات en/de/tr — العربية في الأعمدة الأصلية */
  translations?: EntityTranslations | null;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: number;
  name: string;
  summary?: string | null;
  description?: string | null;
  /** معلومات الزيارة (مواعيد، تذاكر… حسب ما يدخله المشرف) */
  visit_info?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: boolean;
  /**
   * مكان استكشاف: تعريفي بحت — تفاصيل ووسائط وموقع جغرافي فقط، بلا تحديات
   * ولا طوابع ولا رمز QR. يظهر ضمن قائمة الأماكن نفسها لكن لا يُوثَّق كزيارة
   * ولا يدخل في نسبة تقدّم الرحلة.
   */
  is_exploration?: boolean;
  province?: Province;
  /** المنطقة — اختيارية، قد لا يتبع المكان أي منطقة */
  area?: Area | null;
  images?: PlaceImage[];
  videos?: PlaceVideo[];
  challenges?: Challenge[];
  stamps?: Stamp[];
  /** ترجمات en/de/tr — العربية في الأعمدة الأصلية */
  translations?: EntityTranslations | null;
  created_at: string;
  updated_at: string;
}

/** أنواع التحدي المعرّفة في تعليق challenge.entity.ts */
export type ChallengeType = "question" | "visit" | "photo" | "discovery" | string;

export interface Challenge {
  id: number;
  title: string;
  description?: string | null;
  type: ChallengeType;
  /** خيارات الإجابة (اختيار من متعدد) — التحديات القديمة قد تكون بلا خيارات */
  options?: string[] | null;
  /** دليل الخيار الصحيح داخل `options` — لا يعيده الخادم للمستخدم */
  correct_option?: number | null;
  status: boolean;
  place?: Place;
  /** ترجمات en/de/tr — العربية في الأعمدة الأصلية */
  translations?: EntityTranslations | null;
  created_at: string;
  updated_at: string;
}

export interface Stamp {
  id: number;
  name: string;
  description?: string | null;
  image_url: string;
  status: boolean;
  place?: Place;
  /** ترجمات en/de/tr — العربية في الأعمدة الأصلية */
  translations?: EntityTranslations | null;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: number;
  name: string;
  description?: string | null;
  image_url: string;
  /** نسبة الخصم — يعيدها بوستجرس كنص لأنها decimal */
  discount_percentage: number | string;
  status: boolean;
  /** ترجمات en/de/tr — العربية في الأعمدة الأصلية */
  translations?: EntityTranslations | null;
  created_at: string;
  updated_at: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  status: boolean;
  /** ترجمات en/de/tr — العربية في الأعمدة الأصلية */
  translations?: EntityTranslations | null;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* الكتيّبات                                                           */
/* ------------------------------------------------------------------ */

export interface Book {
  id: number;
  name: string;
  description?: string | null;
  status: boolean;
  province?: Province;
  places?: Place[];
  challenges?: Challenge[];
  stamps?: Stamp[];
  partners?: Partner[];
  /** النسخ المطبوعة — يعيدها `GET /admin/books` فقط */
  copies?: BookCopy[];
  /** ترجمات en/de/tr — العربية في الأعمدة الأصلية */
  translations?: EntityTranslations | null;
  created_at: string;
  updated_at: string;
  /** حذف ناعم */
  deleted_at?: string | null;
}

export interface BookCopy {
  id: number;
  serial_number: string;
  version: string;
  is_sold: boolean;
  qr_created: boolean;
  status: string;
  book?: Book;
  qrs?: QrCode[];
  created_at: string;
  updated_at: string;
  /** حذف ناعم — يعيدها `GET /users/books` حتى تُعرض النسخة المحذوفة بلون رمادي */
  deleted_at?: string | null;
}

export type QrTargetType = "PROVINCE" | "PLACE";

export interface QrCode {
  id: number;
  serial_number: string;
  version: string;
  target_type: QrTargetType;
  target_id: number;
  qr_value: string;
  /** النسخة المالكة — يعيدها `GET /qr-codes` مع كتابها */
  book_copy?: BookCopy;
  created_at: string;
}

/** نسخة الكتيّب المرتبطة بالمستخدم */
export interface UserBook {
  id: number;
  active: boolean;
  book_copy?: BookCopy;
  purchased_at: string;
}

/* ------------------------------------------------------------------ */
/* تقدّم المستخدم                                                      */
/* ------------------------------------------------------------------ */

export interface UserVisit {
  id: number;
  province?: Province | null;
  place?: Place | null;
  completed: boolean;
  visited_at: string;
}

export interface UserChallenge {
  id: number;
  challenge?: Challenge;
  completed: boolean;
  answer?: string | null;
  completed_at: string;
}

export interface UserStamp {
  id: number;
  stamp?: Stamp;
  collected_at: string;
}

/** GET /users/dashboard/:userBookId */
export interface UserDashboard {
  book?: Book;
  stats: {
    placesVisited: number;
    completedChallenges: number;
    collectedStamps: number;
  };
  recentVisits?: UserVisit[];
  recentChallenges?: UserChallenge[];
  recentStamps?: UserStamp[];
}

/* ------------------------------------------------------------------ */
/* استجابة مسح الـ QR                                                  */
/* ------------------------------------------------------------------ */

/**
 * `alreadyVisited` يميّز «وُثِّقت زيارتك الآن» عن «سبق أن زرت هذا المكان»:
 * الخادم يقرأ وجود الزيارة قبل إنشائها ويُبلّغ به هنا.
 * يبقى `false` لمن لا يملك نسخة الجواز — لا زيارة تُسجَّل له أصلاً.
 */
export type QrResolveResult =
  | { type: "PROVINCE"; alreadyVisited?: boolean; data: Province }
  | { type: "PLACE"; alreadyVisited?: boolean; data: Place };
