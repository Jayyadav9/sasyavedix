import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { notificationsQuery } from "@/lib/queries";

export function NotificationBell({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLang();
  const notifications = useQuery(notificationsQuery);
  const unread = (notifications.data ?? []).filter((n) => !n.read).length;

  return (
    <Link
      to="/alerts"
      onClick={onNavigate}
      aria-label={t("alerts")}
      className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition hover:border-primary"
    >
      <Bell className="h-4.5 w-4.5" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
