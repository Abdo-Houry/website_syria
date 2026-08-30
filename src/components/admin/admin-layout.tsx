import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookCopy,
  BookOpen,
  HelpCircle,
  Handshake,
  Layers,
  UserCog,
  LayoutDashboard,
  LogOut,
  MapPin,
  MapPinned,
  Menu,
  QrCode,
  Stamp as StampIcon,
  Swords,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandWordmark } from "@/components/common/brand-logo";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useT } from "@/i18n/locale-context";
import type { MessageKey } from "@/i18n/messages/ar";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_GROUPS: { labelKey: MessageKey; items: NavItem[] }[] = [
  {
    labelKey: "admin.groupGeneral",
    items: [
      {
        to: "/admin",
        labelKey: "admin.dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      { to: "/admin/users", labelKey: "admin.users", icon: Users },
    ],
  },
  {
    labelKey: "admin.groupContent",
    items: [
      { to: "/admin/provinces", labelKey: "admin.provinces", icon: MapPin },
      { to: "/admin/areas", labelKey: "admin.areas", icon: Layers },
      { to: "/admin/places", labelKey: "admin.places", icon: MapPinned },
      { to: "/admin/challenges", labelKey: "admin.challenges", icon: Swords },
      { to: "/admin/stamps", labelKey: "admin.stamps", icon: StampIcon },
      { to: "/admin/partners", labelKey: "admin.partners", icon: Handshake },
      { to: "/admin/faqs", labelKey: "admin.faqs", icon: HelpCircle },
    ],
  },
  {
    labelKey: "admin.groupBooks",
    items: [
      { to: "/admin/books", labelKey: "admin.booksLabel", icon: BookOpen },
      { to: "/admin/copies", labelKey: "admin.copies", icon: BookCopy },
      { to: "/admin/qr-codes", labelKey: "admin.qrCodes", icon: QrCode },
    ],
  },
];

/**
 * غلاف لوحة الإدارة.
 *
 * هنا الشريط الجانبي والجداول مقصودان — تقييد المواصفة على «عدم استخدام
 * واجهة إدارية» يخصّ تجربة المستخدم تحت `/`، لا هذه الشجرة.
 */
export function AdminLayout() {
  const t = useT();
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div className="flex flex-col gap-2 px-2">
        <BrandWordmark className="h-7 text-gold-400" />
        <p className="text-[11px] font-bold leading-tight text-sand-100/55">
          {t("admin.panel")}
        </p>
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey}>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wide text-sand-100/40">
            {t(group.labelKey)}
          </p>
          <ul className="flex flex-col gap-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-gold-500 text-basalt-950"
                          : "text-sand-100/75 hover:bg-white/8 hover:text-sand-50",
                      )
                    }
                  >
                    <Icon className="size-4.5 shrink-0" aria-hidden />
                    {t(item.labelKey)}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
        <LanguageSwitcher variant="dark" className="w-full justify-between" />

        {/* حساب المشرف — تغيير الاسم وكلمة المرور */}
        <NavLink
          to="/admin/profile"
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-colors",
              isActive
                ? "bg-gold-500 text-basalt-950"
                : "text-sand-100/55 hover:bg-white/8 hover:text-sand-50",
            )
          }
        >
          <UserCog className="size-4.5 shrink-0" aria-hidden />
          <span className="min-w-0 truncate">
            {t("admin.signedInAs")}{" "}
            <span className="font-bold">{admin?.username ?? t("common.none")}</span>
          </span>
        </NavLink>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sand-100/70 transition-colors hover:bg-clay-500/20 hover:text-clay-400"
        >
          <LogOut className="size-4.5" aria-hidden />
          {t("auth.logout")}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-sand-50">
      {/* شريط جانبي ثابت — من lg وأعلى */}
      <aside className="fixed inset-y-0 start-0 hidden w-64 bg-basalt-900 lg:block">
        {sidebar}
      </aside>

      {/* درج جانبي — على الشاشات الصغيرة */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("admin.closeMenu")}
            className="absolute inset-0 bg-basalt-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-72 animate-fade-in bg-basalt-900 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:ps-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-basalt-900/8 glass-panel px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={open ? t("admin.closeMenu") : t("admin.openMenu")}
            onClick={() => setOpen(true)}
          >
            {open ? <X /> : <Menu />}
          </Button>
          <BrandWordmark className="h-4 text-basalt-900" />
          <span className="flex-1 font-bold text-basalt-900">
            {t("admin.panel")}
          </span>
          <LanguageSwitcher />
        </header>

        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
