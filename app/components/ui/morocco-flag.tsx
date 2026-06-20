import * as React from "react";
import { cn } from "~/lib/utils";

export type MoroccoFlagProps = React.ComponentProps<"svg"> & {
  /**
   * The visual style/shape of the flag:
   * - `circle`: Clipped to a perfect circle (default)
   * - `squircle`: Clipped to a rounded square
   * - `rectangle`: A standard 3:2 ratio flag with slight rounded corners
   */
  variant?: "circle" | "squircle" | "rectangle";
  /** Whether to add a subtle elegant border ring around the flag */
  hasBorder?: boolean;
};

export const MoroccoFlag = React.forwardRef<SVGSVGElement, MoroccoFlagProps>(
  ({ variant = "circle", hasBorder = true, className, ...props }, ref) => {
    // Shared gradient IDs to avoid collisions
    const gradientId = React.useId();
    const shadowId = React.useId();
    const clipId = React.useId();

    if (variant === "rectangle") {
      return (
        <svg
          ref={ref}
          data-slot="morocco-flag"
          viewBox="0 0 90000 60000"
          className={cn("inline-block shrink-0 overflow-hidden rounded-md shadow-sm", className)}
          aria-label="Flag of Morocco"
          role="img"
          {...props}
        >
          <defs>
            {/* Rich Moroccan red gradient matching the official #c1272d color */}
            <linearGradient id={`${gradientId}-red`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e02d34" />
              <stop offset="50%" stopColor="#c1272d" />
              <stop offset="100%" stopColor="#91181d" />
            </linearGradient>
            {/* Subtle shadow for the star */}
            <filter id={`${shadowId}-star`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="200"
                stdDeviation="300"
                floodOpacity="0.4"
                floodColor="#000000"
              />
            </filter>
          </defs>

          {/* Red field */}
          <rect width="90000" height="60000" fill={`url(#${gradientId}-red)`} />

          {/* Official Pentagram (five-pointed star) */}
          <path
            d="m45000 17308 7460 22960-19531-14190h24142L37540 40268z"
            fill="none"
            stroke="#006233"
            strokeWidth="1426"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${shadowId}-star)`}
          />
          {/* Accent stroke to make the green stand out on the deep red */}
          <path
            d="m45000 17308 7460 22960-19531-14190h24142L37540 40268z"
            fill="none"
            stroke="#008445"
            strokeWidth="500"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hasBorder && (
            <rect
              x="50"
              y="50"
              width="89900"
              height="59900"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="100"
              className="text-gray-900 dark:text-white"
            />
          )}
        </svg>
      );
    }

    // Circle or Squircle rendering
    return (
      <svg
        ref={ref}
        data-slot="morocco-flag"
        viewBox="0 0 60000 60000"
        className={cn(
          "inline-block shrink-0 select-none overflow-hidden",
          variant === "circle" ? "rounded-full" : "rounded-2xl",
          hasBorder && "ring-1 ring-black/10 dark:ring-white/15",
          className,
        )}
        aria-label="Flag of Morocco"
        role="img"
        {...props}
      >
        <defs>
          <linearGradient id={`${gradientId}-red`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e02d34" />
            <stop offset="50%" stopColor="#c1272d" />
            <stop offset="100%" stopColor="#91181d" />
          </linearGradient>
          <filter id={`${shadowId}-star`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="250"
              stdDeviation="400"
              floodOpacity="0.45"
              floodColor="#000000"
            />
          </filter>
          {variant === "squircle" && (
            <clipPath id={`${clipId}-squircle`}>
              <rect width="60000" height="60000" rx="15000" ry="15000" />
            </clipPath>
          )}
        </defs>

        <g clipPath={variant === "squircle" ? `url(#${clipId}-squircle)` : undefined}>
          {/* Background red field */}
          <rect width="60000" height="60000" fill={`url(#${gradientId}-red)`} />

          {/* Outer glow overlay for realistic badge depth */}
          <radialGradient id={`${gradientId}-glow`} cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </radialGradient>
          <rect
            width="60000"
            height="60000"
            fill={`url(#${gradientId}-glow)`}
            className="mix-blend-overlay"
          />

          {/* Centered Official Pentagram (shifted left by 15000 to center it at 30000, 30000) */}
          <path
            d="m30000 17308 7460 22960-19531-14190h24142L22540 40268z"
            fill="none"
            stroke="#006233"
            strokeWidth="1426"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${shadowId}-star)`}
          />
          {/* Highlighting inner green line */}
          <path
            d="m30000 17308 7460 22960-19531-14190h24142L22540 40268z"
            fill="none"
            stroke="#008445"
            strokeWidth="500"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    );
  },
);

MoroccoFlag.displayName = "MoroccoFlag";
