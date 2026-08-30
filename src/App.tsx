import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppErrorBoundary } from "@/components/common/error-boundary";
import { AdminAuthProvider } from "@/context/admin-auth-context";
import { AuthProvider } from "@/context/auth-context";
import { JourneyProvider } from "@/context/journey-context";
import { LocaleProvider, useLocale } from "@/i18n/locale-context";
import { queryClient } from "@/app/query-client";
import { AppRoutes } from "@/routes";

/** الإشعارات تتبع اتجاه اللغة المختارة. */
function LocalizedToaster() {
  const { dir } = useLocale();

  return (
    <Toaster
      dir={dir}
      position="top-center"
      richColors
      closeButton
      toastOptions={{ style: { fontFamily: "Cairo, sans-serif" } }}
    />
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <LocaleProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <AdminAuthProvider>
                <JourneyProvider>
                  <AppRoutes />
                  <LocalizedToaster />
                </JourneyProvider>
              </AdminAuthProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </LocaleProvider>
    </AppErrorBoundary>
  );
}
