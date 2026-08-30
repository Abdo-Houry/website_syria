import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Compass,
  LogOut,
  MapPinned,
  QrCode,
  Stamp as StampIcon,
  Swords,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandMark } from "@/components/common/brand-logo";
import { BookletSwitcher } from "@/components/layout/booklet-switcher";
import { SiteFooter } from "@/components/layout/site-footer";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useT } from "@/i18n/locale-context";
import type { MessageKey } from "@/i18n/messages/ar";
import { assetUrl, cn, initials } from "@/lib/utils";

interface NavEntry {
  to: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  highlight?: boolean;
}

const MOBILE_ITEMS: NavEntry[] = [
  { to: "/journey", labelKey: "nav.journey", icon: Compass },
  { to: "/places", labelKey: "nav.places", icon: MapPinned },
  { to: "/scanner", labelKey: "nav.scanner", icon: QrCode, highlight: true },
  { to: "/challenges", labelKey: "nav.challenges", icon: Swords },
  { to: "/stamps", labelKey: "nav.stamps", icon: StampIcon },
];

const DESKTOP_ITEMS: NavEntry[] = [
  { to: "/journey", labelKey: "nav.journey", icon: Compass },
  { to: "/books", labelKey: "nav.books", icon: BookOpen },
  { to: "/places", labelKey: "nav.places", icon: MapPinned },
  { to: "/challenges", labelKey: "nav.challenges", icon: Swords },
  { to: "/stamps", labelKey: "nav.stamps", icon: StampIcon },
];

export function AppLayout() {
  const t = useT();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col bg-sand-50 pattern-arabesque">
      {/* الشريط العلوي — سياق الكتيّب دائماً ظاهر */}
      <header className="sticky top-0 z-40 border-b border-basalt-900/8 glass-panel">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4 sm:gap-3 sm:px-5">
          <NavLink
            to="/journey"
            aria-label={t("app.name")}
            className="flex shrink-0 items-center"
          >
            <BrandMark tone="dark" className="h-10 px-3" wordmarkClassName="h-4" />
          </NavLink>

          <div className="flex min-w-0 flex-1 justify-center">
            <BookletSwitcher />
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {DESKTOP_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-basalt-900 text-sand-50"
                      : "text-basalt-700 hover:bg-basalt-900/6",
                  )
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher className="hidden sm:inline-flex" />

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("nav.profile")}
              onClick={() => navigate("/profile")}
            >
              <Avatar className="size-8 ring-1 ring-gold-500/40">
                <AvatarImage src={assetUrl(user?.image)} alt={user?.name ?? ""} />
                <AvatarFallback className="text-[11px]">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("auth.logout")}
              className="hidden text-basalt-600/70 hover:text-clay-500 sm:inline-flex"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-2">
        <Outlet />
      </main>

      {/* الفوتر — يُرفع فوق شريط التنقّل السفلي على الجوال */}
      <SiteFooter className="pb-28 lg:pb-0" />

      {/* شريط تنقّل سفلي — تجربة أقرب لتطبيق سفر منها للوحة تحكم */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-basalt-900/8 glass-panel pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto flex w-full max-w-lg items-end justify-around px-2 py-2">
          {MOBILE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-semibold transition-colors",
                      item.highlight || isActive
                        ? "text-basalt-900"
                        : "text-basalt-600/60",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "grid place-items-center rounded-2xl transition-all",
                          item.highlight
                            ? "-mt-6 size-13 bg-gold-500 text-basalt-950 shadow-[var(--shadow-lift)] ring-4 ring-sand-50"
                            : cn(
                                "size-9",
                                isActive ? "bg-basalt-900/8" : "bg-transparent",
                              ),
                        )}
                      >
                        <Icon
                          className={item.highlight ? "size-6" : "size-5"}
                          aria-hidden
                        />
                      </span>
                      {t(item.labelKey)}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}

          <li className="flex-1">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-semibold transition-colors",
                  isActive ? "text-basalt-900" : "text-basalt-600/60",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-2xl transition-all",
                      isActive ? "bg-basalt-900/8" : "bg-transparent",
                    )}
                  >
                    <User className="size-5" aria-hidden />
                  </span>
                  {t("nav.profile")}
                </>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}
