import axios, { AxiosError, type AxiosInstance } from "axios";
import type { MessageKey } from "@/i18n/messages/ar";
import { translateMessage } from "@/i18n/runtime";
import type { ApiEnvelope } from "@/types/api";

export const TOKEN_STORAGE_KEY = "tourist.token";
export const ADMIN_TOKEN_STORAGE_KEY = "tourist.adminToken";

const baseURL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");

/** خطأ موحّد لكل طبقة الـ API — يبسّط عرض الحالات في الواجهة. */
export class ApiRequestError extends Error {
  readonly status: number;
  /** true عندما يتعذّر الوصول إلى الخادم أصلاً (لا اتصال / الخادم متوقف). */
  readonly isNetworkError: boolean;
  /**
   * مفتاح الرسالة في قاموس اللغات — هو ما يُعرض للمستخدم.
   * يبقى `undefined` عندما يعيد الخادم نصاً لا نعرفه، فنعرض `message` كما ورد.
   */
  readonly messageKey?: MessageKey;

  constructor(
    message: string,
    status: number,
    isNetworkError = false,
    messageKey?: MessageKey,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.messageKey = messageKey;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

/**
 * الباك اند يعيد رسائله بالإنجليزية دائماً. نحوّل المعروف منها — كما ورد
 * حرفياً في `ApiError` داخل الخدمات — إلى مفاتيح القاموس، فتُعرض بلغة
 * المستخدم لا بلغة الخادم. غير المعروف يُعرض كما هو.
 */
const BACKEND_MESSAGE_KEYS: Record<string, MessageKey> = {
  // المصادقة
  "Phone already registered": "errors.phoneTaken",
  "Email already registered": "errors.emailTaken",
  "Email not verified": "errors.emailNotVerified",
  "Email already verified": "errors.emailAlreadyVerified",
  "Verification code not found": "errors.otpNotFound",
  "Verification code expired": "errors.otpExpired",
  "Invalid verification code": "errors.otpInvalid",
  "Too many attempts": "errors.otpTooManyAttempts",
  "Too many login attempts": "errors.tooManyLoginAttempts",
  "Too many verification emails": "errors.tooManyOtpEmails",
  "Email service unavailable": "errors.mailUnavailable",
  "Could not send verification email": "errors.mailSendFailed",
  "Invalid credentials": "errors.invalidCredentials",
  "Invalid phone or password": "errors.invalidPhoneOrPassword",
  "Invalid username or password": "errors.invalidUsernameOrPassword",
  "User blocked": "errors.userBlocked",
  "User not found": "errors.userNotFound",
  "Authentication required": "errors.authRequired",
  "Token missing": "errors.unauthorized",
  "Access denied": "errors.accessDenied",
  "Admin access only": "errors.adminOnly",
  "Authorization token is required": "errors.authRequired",
  "Invalid authorization format": "errors.sessionInvalid",
  "Invalid or expired token": "errors.sessionExpired",
  "No token provided": "errors.authRequired",
  "Invalid token": "errors.sessionInvalid",

  // الكتيّبات
  "Book not found": "errors.bookNotFound",
  "Book copy not found": "errors.bookCopyNotFound",
  "Book copy already sold": "errors.bookCopySold",
  "Serial number already exists": "errors.serialExists",
  "Serial number already exists for this version": "errors.serialVersionExists",
  "Book not found for this user": "errors.bookNotOwned",

  // المحتوى
  "Province not found": "errors.provinceNotFound",
  "Province already exists": "errors.provinceExists",
  "Place not found": "errors.placeNotFound",
  "Challenge not found": "errors.challengeNotFound",
  "Stamp not found": "errors.stampNotFound",
  "FAQ not found": "errors.faqNotFound",
  "Partner not found": "errors.partnerNotFound",
  "Image not found": "errors.imageNotFound",
  "Video not found": "errors.videoNotFound",
  "Area not found": "errors.areaNotFound",
  "Area does not belong to this province": "errors.areaProvinceMismatch",

  // التحديات متعدّدة الخيارات
  "Wrong answer": "errors.wrongAnswer",

  // حساب المشرف
  "Current password is incorrect": "errors.currentPasswordWrong",
  "Username already taken": "errors.usernameTaken",

  // ملكية التحديات والطوابع
  "This challenge does not belong to any of your booklets":
    "errors.challengeNotYours",
  "This challenge does not belong to the selected booklet":
    "errors.challengeOtherBooklet",
  "This stamp does not belong to any of your booklets": "errors.stampNotYours",
  "This stamp does not belong to the selected booklet":
    "errors.stampOtherBooklet",

  // الـ QR
  "Invalid QR Code": "errors.invalidQr",
  "Unknown QR Type": "errors.unknownQrType",

  // رفع الملفات
  "No image uploaded": "errors.noImageUploaded",
  "No images uploaded": "errors.noImagesUploaded",
  "Only image files are allowed": "errors.onlyImages",
  "Only video files are allowed": "errors.onlyVideos",

  // عام
  "Invalid user id": "errors.invalidUserId",
  "Validation error": "errors.badRequest",
  "Internal Server Error": "errors.server",
};

const STATUS_KEYS: Record<number, MessageKey> = {
  503: "errors.serviceUnavailable",
  400: "errors.badRequest",
  401: "errors.unauthorized",
  403: "errors.forbidden",
  404: "errors.notFound",
  500: "errors.server",
};

/**
 * يُرجع مفتاح الرسالة إن عرفناها، و`raw` النص الخام كما أرسله الخادم
 * ليُعرض عند غياب المفتاح.
 */
function describeError(error: AxiosError<unknown>): {
  key?: MessageKey;
  raw?: string;
} {
  const body = error.response?.data as
    | { message?: unknown; error?: unknown; errors?: unknown }
    | undefined;

  if (body && typeof body.message === "string" && body.message.trim()) {
    const raw = body.message.trim();
    const key = BACKEND_MESSAGE_KEYS[raw];
    if (key) return { key };

    /*
       أخطاء zod تصل بالشكل `field: message` ومعها مصفوفة `errors` — نصّ
       تقني بالإنجليزية لا يصلح للعرض، فنستبدله برسالة عامة مترجمة.
    */
    if (Array.isArray(body.errors)) return { key: "errors.badRequest" };

    return { raw };
  }

  const status = error.response?.status;
  return { key: (status && STATUS_KEYS[status]) || "errors.generic" };
}

/* ------------------------------------------------------------------ */
/* عميل HTTP بجلسة مستقلة                                              */
/* ------------------------------------------------------------------ */

/**
 * تجربة المستخدم ولوحة الإدارة تعيشان في التطبيق نفسه لكن بجلستين
 * منفصلتين تماماً — لكل واحدة توكنها ومعالج انتهاء صلاحيتها، فلا يُخرج
 * تسجيل خروج المشرف المستخدمَ ولا العكس.
 */
function createClient(storageKey: string) {
  const instance: AxiosInstance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
  });

  let inMemoryToken: string | null = null;
  let loaded = false;
  let onUnauthorized: (() => void) | null = null;

  const getToken = (): string | null => {
    if (!loaded) {
      try {
        inMemoryToken = localStorage.getItem(storageKey);
      } catch {
        inMemoryToken = null;
      }
      loaded = true;
    }
    return inMemoryToken;
  };

  const setToken = (token: string | null) => {
    inMemoryToken = token;
    loaded = true;
    try {
      if (token) localStorage.setItem(storageKey, token);
      else localStorage.removeItem(storageKey);
    } catch {
      /* التخزين قد يكون معطّلاً في وضع التصفح الخاص */
    }
  };

  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.set?.("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") {
        return Promise.reject(
          new ApiRequestError("Network error", 0, true, "errors.network"),
        );
      }

      const status = error.response?.status ?? 0;

      if (status === 401) {
        onUnauthorized?.();
      }

      const { key, raw } = describeError(error);

      return Promise.reject(
        new ApiRequestError(raw ?? "Request failed", status, false, key),
      );
    },
  );

  /**
   * يفكّ غلاف `{ success, message, data }` ويعيد `data` مباشرة.
   * بعض نقاط النهاية قد تعيد `data` فارغة، لذلك نسمح بقيمة افتراضية.
   */
  function unwrap<T>(envelope: ApiEnvelope<T>, fallback?: T): T {
    if (envelope?.data !== undefined) return envelope.data;
    if (fallback !== undefined) return fallback;
    return undefined as unknown as T;
  }

  return {
    instance,
    getToken,
    setToken,
    setUnauthorizedHandler: (handler: (() => void) | null) => {
      onUnauthorized = handler;
    },

    async get<T>(
      url: string,
      params?: Record<string, unknown>,
      fallback?: T,
    ): Promise<T> {
      const { data } = await instance.get<ApiEnvelope<T>>(url, { params });
      return unwrap(data, fallback);
    },

    async post<T>(url: string, body?: unknown, fallback?: T): Promise<T> {
      const { data } = await instance.post<ApiEnvelope<T>>(url, body);
      return unwrap(data, fallback);
    },

    async put<T>(url: string, body?: unknown, fallback?: T): Promise<T> {
      const { data } = await instance.put<ApiEnvelope<T>>(url, body);
      return unwrap(data, fallback);
    },

    async delete<T>(url: string, fallback?: T): Promise<T> {
      const { data } = await instance.delete<ApiEnvelope<T>>(url);
      return unwrap(data, fallback);
    },

    /** رفع ملفات (multipart) — يترك axios يضبط حدّ الـ boundary بنفسه. */
    async upload<T>(url: string, form: FormData, fallback?: T): Promise<T> {
      const { data } = await instance.post<ApiEnvelope<T>>(url, form, {
        headers: { "Content-Type": undefined },
      });
      return unwrap(data, fallback);
    },
  };
}

/* --------------------------- جلسة المستخدم --------------------------- */

const userClient = createClient(TOKEN_STORAGE_KEY);

export const http = userClient.instance;
export const getToken = userClient.getToken;
export const setToken = userClient.setToken;
export const setUnauthorizedHandler = userClient.setUnauthorizedHandler;

export const apiGet = userClient.get;
export const apiPost = userClient.post;
export const apiPut = userClient.put;
export const apiDelete = userClient.delete;

/* --------------------------- جلسة المشرف --------------------------- */

const adminClient = createClient(ADMIN_TOKEN_STORAGE_KEY);

export const adminHttp = adminClient.instance;
export const getAdminToken = adminClient.getToken;
export const setAdminToken = adminClient.setToken;
export const setAdminUnauthorizedHandler = adminClient.setUnauthorizedHandler;

export const adminGet = adminClient.get;
export const adminPost = adminClient.post;
export const adminPut = adminClient.put;
export const adminDelete = adminClient.delete;
export const adminUpload = adminClient.upload;

/**
 * يفكّ أي خطأ إلى إمّا مفتاح قاموس (يُترجَم لاحقاً) أو نص جاهز للعرض.
 *
 * منفصل عن الترجمة عمداً: `toErrorMessage` تستخدمه خارج شجرة React،
 * و`useErrorMessage` تستخدمه أثناء الرسم لتتبدّل الرسالة مع تبديل اللغة.
 */
export function describeUnknownError(error: unknown): {
  key?: MessageKey;
  text?: string;
} {
  if (error instanceof ApiRequestError) {
    return error.messageKey ? { key: error.messageKey } : { text: error.message };
  }
  if (error instanceof Error && error.message) return { text: error.message };
  return { key: "errors.unknown" };
}

/**
 * يحوّل أي خطأ إلى رسالة بلغة المستخدم الحالية.
 * للاستخدام خارج الرسم (toast، معالجات الأحداث). داخل الرسم استخدم
 * `useErrorMessage` حتى تتبدّل الرسالة فور تبديل اللغة.
 */
export function toErrorMessage(error: unknown): string {
  const { key, text } = describeUnknownError(error);
  return key ? translateMessage(key) : (text ?? "");
}
