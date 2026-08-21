import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

function BaseIcon({ title, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <BaseIcon title="Thông tin học viên" {...props}>
      <path d="M4 13.5V6.5a2 2 0 0 1 2-2h4.5v9H4Z" />
      <path d="M13.5 4.5H18a2 2 0 0 1 2 2v7h-6.5V4.5Z" />
      <path d="M4 16.5h6.5V20H6a2 2 0 0 1-2-2v-1.5Z" />
      <path d="M13.5 16.5H20V18a2 2 0 0 1-2 2h-4.5v-3.5Z" />
    </BaseIcon>
  );
}

export function IconDocs(props: IconProps) {
  return (
    <BaseIcon title="Kho tài liệu" {...props}>
      <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M8.5 8h7" />
      <path d="M8.5 11h7" />
      <path d="M8.5 14h4.5" />
    </BaseIcon>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <BaseIcon title="Skill" {...props}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 10.5v6" />
      <path d="M12 7.5h.01" />
    </BaseIcon>
  );
}

export function IconSupport(props: IconProps) {
  return (
    <BaseIcon title="Hỗ trợ tự học" {...props}>
      <path d="M7 10a5 5 0 0 1 10 0c0 3-2 4-3 5H10c-1-1-3-2-3-5Z" />
      <path d="M10 18h4" />
      <path d="M10.5 21h3" />
    </BaseIcon>
  );
}

export function IconArchive(props: IconProps) {
  return (
    <BaseIcon title="Lưu trữ bài test" {...props}>
      <path d="M5 8h14M5 8a2 2 0 1 0 0-4h14a2 2 0 1 0 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h4" />
    </BaseIcon>
  );
}


