import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Splash } from "@/components/layout/splash";
import {
  RedirectIfAuthenticated,
  RequireAuth,
  RequireBooklet,
} from "@/routes/guards";
import { RequireAdmin } from "@/routes/admin-guards";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { LoginPage } from "@/pages/auth/login-page";
import { RegisterPage } from "@/pages/auth/register-page";
import { VerifyEmailPage } from "@/pages/auth/verify-email-page";
import { ForgotPasswordPage } from "@/pages/auth/forgot-password-page";
import { CompleteProfilePage } from "@/pages/auth/complete-profile-page";
import { MyBooksPage } from "@/pages/books/my-books-page";
import { ActivateBookPage } from "@/pages/books/activate-book-page";
import { JourneyPage } from "@/pages/journey/journey-page";
import { ProvincePage } from "@/pages/province/province-page";
import { PlacesPage } from "@/pages/places/places-page";
import { PlaceDetailPage } from "@/pages/places/place-detail-page";
import { ChallengesPage } from "@/pages/challenges/challenges-page";
import { StampsPage } from "@/pages/stamps/stamps-page";
import { PartnersPage } from "@/pages/partners/partners-page";
import { FaqPage } from "@/pages/faq/faq-page";
import { ScannerPage } from "@/pages/scanner/scanner-page";
import { QrResolvePage } from "@/pages/scanner/qr-resolve-page";
import { ProfilePage } from "@/pages/profile/profile-page";
import { AboutPage } from "@/pages/info/about-page";
import { PrivacyPage } from "@/pages/info/privacy-page";
import { NotFoundPage } from "@/pages/not-found-page";

/*
  لوحة الإدارة تُحمَّل عند الطلب فقط: المستخدم العادي لا يجب أن يدفع
  ثمن حزمتها، وهي الجزء الأكبر من الشيفرة غير المستخدمة في تجربته.
*/
const AdminLayout = lazy(() =>
  import("@/components/admin/admin-layout").then((m) => ({
    default: m.AdminLayout,
  })),
);
const AdminDashboardPage = lazy(() =>
  import("@/pages/admin/admin-dashboard-page").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import("@/pages/admin/users-page").then((m) => ({
    default: m.AdminUsersPage,
  })),
);
const AdminProvincesPage = lazy(() =>
  import("@/pages/admin/provinces-page").then((m) => ({
    default: m.AdminProvincesPage,
  })),
);
const AdminPlacesPage = lazy(() =>
  import("@/pages/admin/places-page").then((m) => ({
    default: m.AdminPlacesPage,
  })),
);
const AdminChallengesPage = lazy(() =>
  import("@/pages/admin/challenges-page").then((m) => ({
    default: m.AdminChallengesPage,
  })),
);
const AdminStampsPage = lazy(() =>
  import("@/pages/admin/stamps-page").then((m) => ({
    default: m.AdminStampsPage,
  })),
);
const AdminPartnersPage = lazy(() =>
  import("@/pages/admin/partners-page").then((m) => ({
    default: m.AdminPartnersPage,
  })),
);
const AdminFaqsPage = lazy(() =>
  import("@/pages/admin/faqs-page").then((m) => ({ default: m.AdminFaqsPage })),
);
const AdminBooksPage = lazy(() =>
  import("@/pages/admin/books-page").then((m) => ({
    default: m.AdminBooksPage,
  })),
);
const AdminBookCopiesPage = lazy(() =>
  import("@/pages/admin/book-copies-page").then((m) => ({
    default: m.AdminBookCopiesPage,
  })),
);
const AdminQrCodesPage = lazy(() =>
  import("@/pages/admin/qr-codes-page").then((m) => ({
    default: m.AdminQrCodesPage,
  })),
);
const AdminAreasPage = lazy(() =>
  import("@/pages/admin/areas-page").then((m) => ({
    default: m.AdminAreasPage,
  })),
);
const AdminProfilePage = lazy(() =>
  import("@/pages/admin/admin-profile-page").then((m) => ({
    default: m.AdminProfilePage,
  })),
);

export function AppRoutes() {
  return (
    <Suspense fallback={<Splash />}>
      <ScrollToTop />
      <Routes>
        {/* ------------------------ المصادقة ------------------------ */}
        <Route element={<RedirectIfAuthenticated />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* تأكيد البريد بعد التسجيل — الجلسة تُفتح هنا لا عند التسجيل */}
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        {/* استكمال الملف الشخصي — يتطلّب جلسة لكنه خارج تدفّق الرحلة */}
        <Route element={<RequireAuth />}>
          <Route element={<AuthLayout />}>
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
          </Route>
        </Route>

        {/* ------------------------ تجربة المستخدم ------------------------ */}
        {/*
          البريد إلزامي ومؤكَّد برمز قبل فتح الجلسة، فلا يصل إلى هنا حساب
          ناقص البيانات ولا حاجة لتوجيهه إلى صفحة استكمال.
        */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            {/* متاحة دائماً — نقطة الدخول لمن لا يملك جوازاً */}
            <Route path="/books" element={<MyBooksPage />} />
            <Route path="/books/activate" element={<ActivateBookPage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/qr/:type/:id" element={<QrResolvePage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* صفحات الفوتر — لا تتطلّب جوازاً */}
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* تتطلّب جوازاً مفعّلاً — الرحلة تبدأ من الجواز */}
            <Route element={<RequireBooklet />}>
              <Route path="/journey" element={<JourneyPage />} />
              <Route path="/province" element={<ProvincePage />} />
              <Route path="/places" element={<PlacesPage />} />
              <Route path="/places/:id" element={<PlaceDetailPage />} />
              <Route path="/challenges" element={<ChallengesPage />} />
              <Route path="/stamps" element={<StampsPage />} />
              <Route path="/partners" element={<PartnersPage />} />
            </Route>
          </Route>
        </Route>

        {/* ------------------------ لوحة الإدارة ------------------------ */}

        {/* الدخول موحّد — الرابط القديم يبقى عاملاً للمفضّلات */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="provinces" element={<AdminProvincesPage />} />
            <Route path="areas" element={<AdminAreasPage />} />
            <Route path="places" element={<AdminPlacesPage />} />
            <Route path="challenges" element={<AdminChallengesPage />} />
            <Route path="stamps" element={<AdminStampsPage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="faqs" element={<AdminFaqsPage />} />
            <Route path="books" element={<AdminBooksPage />} />
            <Route path="copies" element={<AdminBookCopiesPage />} />
            <Route path="qr-codes" element={<AdminQrCodesPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/journey" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
