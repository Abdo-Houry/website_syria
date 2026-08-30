import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-context";

export function NotFoundPage() {
  const t = useT();

  return (
    <div className="grid min-h-dvh place-items-center bg-sand-50 pattern-arabesque px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="grid size-16 place-items-center rounded-3xl bg-basalt-900">
          <Compass className="size-8 text-gold-400" aria-hidden />
        </span>
        <h1 className="font-display text-4xl text-basalt-900">
          {t("state.notFoundTitle")}
        </h1>
        <p className="text-sm leading-relaxed text-basalt-600/85">
          {t("state.notFoundBody")}
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link to="/journey">
            <Home />
            {t("journey.title")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
