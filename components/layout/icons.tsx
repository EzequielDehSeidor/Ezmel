import type { ReactNode } from "react";

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export const FolderIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" />
  </Svg>
);

export const FileTextIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M9 13h6M9 17h6M9 9h1" />
  </Svg>
);

export const LogoutIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
    <path d="M9 12h12l-3-3M18 15l3-3" />
  </Svg>
);

export const MenuIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const CalendarIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M16 3v4M8 3v4M4 11h16" />
  </Svg>
);

export const ChevronLeftIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const HistoryIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 8v4l2 2" />
    <path d="M3.05 11a9 9 0 1 1 .5 4M3 4v7h7" />
  </Svg>
);

export const UsersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9" />
  </Svg>
);

export const TimelineIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01" />
  </Svg>
);

export const CalculatorIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M8 6h8v3H8zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" />
  </Svg>
);

export const CashIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 7h18v10H3z" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M7 12h.01M17 12h.01" />
  </Svg>
);

export const CalendarCheckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M16 3v4M8 3v4M4 11h16M9 16l2 2 4-4" />
  </Svg>
);

export const ChartIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M5 20v-8M12 20V5M19 20v-11M3 20h18" />
  </Svg>
);

export const ShieldIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 3 5 6v6c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const UploadIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Svg>
);

export const UserPlusIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 20a7 7 0 0 1 14 0M19 8v6M16 11h6" />
  </Svg>
);
