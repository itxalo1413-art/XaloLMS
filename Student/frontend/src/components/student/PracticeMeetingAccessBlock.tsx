import {
  PRACTICE_CLASS_ZOOM_ROOM,
  resolvePracticeMeetingAccess,
  type PracticeClassSlot,
  type PracticeMeetingAccess,
} from "@/lib/practiceClass";

type MeetingAccessBlockProps = {
  meeting: PracticeMeetingAccess;
  platform: string;
  compact?: boolean;
  /** Chỉ hiển thị ID và mật khẩu (không hiển thị link). */
  credentialsOnly?: boolean;
};

type Props = {
  slot: PracticeClassSlot;
  compact?: boolean;
  credentialsOnly?: boolean;
};

function Row({
  label,
  value,
  copyable,
  compact = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  compact?: boolean;
}) {
  const isUrl = value.startsWith("http://") || value.startsWith("https://");

  return (
    <div className={compact ? "py-2" : "py-2.5"}>
      <div className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</div>
      {isUrl ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block break-all text-sm font-bold text-primary underline-offset-2 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 break-all text-sm font-bold tabular-nums text-foreground">{value}</p>
      )}
      {copyable && value !== "—" && !isUrl ? (
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(value)}
          className="mt-1 text-[10px] font-bold uppercase text-primary hover:underline"
        >
          Sao chép
        </button>
      ) : null}
    </div>
  );
}

export function MeetingAccessBlock({
  meeting,
  platform,
  compact,
  credentialsOnly = false,
}: MeetingAccessBlockProps) {
  const isZoom = platform.toLowerCase().includes("zoom");
  const idLabel = isZoom ? "ID phòng Zoom" : "Mã / ID phòng";
  const passLabel = isZoom ? "Mật khẩu Zoom" : "Mật khẩu";
  const linkLabel = isZoom ? "Link Zoom" : `Link ${platform}`;

  return (
    <div
      className={[
        "rounded-xl border border-primary/15 bg-white",
        compact ? "p-3" : "p-4",
      ].join(" ")}
    >
      <div className="text-[10px] font-black uppercase tracking-widest text-primary">
        Thông tin tham gia · {platform}
      </div>
      <div
        className={
          credentialsOnly && compact
            ? "mt-2 grid gap-3 sm:grid-cols-2"
            : "mt-1 divide-y divide-primary/5"
        }
      >
        <Row label={idLabel} value={meeting.meetingId} copyable compact={compact} />
        <Row label={passLabel} value={meeting.password} copyable compact={compact} />
        {!credentialsOnly ? (
          <Row label={linkLabel} value={meeting.joinUrl} compact={compact} />
        ) : null}
      </div>
    </div>
  );
}

/** Phòng Zoom chung — hiển thị một lần trên lịch tuần. */
export function PracticeZoomRoomBlock({
  compact,
  credentialsOnly = true,
}: Pick<MeetingAccessBlockProps, "compact" | "credentialsOnly">) {
  return (
    <MeetingAccessBlock
      meeting={PRACTICE_CLASS_ZOOM_ROOM}
      platform="Zoom"
      compact={compact}
      credentialsOnly={credentialsOnly}
    />
  );
}

export function PracticeMeetingAccessBlock({ slot, compact, credentialsOnly }: Props) {
  return (
    <MeetingAccessBlock
      meeting={resolvePracticeMeetingAccess(slot)}
      platform={slot.platform}
      compact={compact}
      credentialsOnly={credentialsOnly}
    />
  );
}
