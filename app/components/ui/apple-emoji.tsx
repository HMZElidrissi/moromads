import * as React from "react";
import { cn } from "~/lib/utils";

export type AppleEmojiProps = React.ComponentProps<"span"> & {
  /** The native emoji character to display (e.g. "🏙️" or "🏛️") */
  emoji: string;
  /** Size descriptor for preset classes, or use className directly */
  size?: "sm" | "md" | "lg" | "xl";
};

export const AppleEmoji = React.forwardRef<HTMLSpanElement, AppleEmojiProps>(
  ({ emoji, size = "md", className, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Reset state if emoji changes
    React.useEffect(() => {
      setHasError(false);
      setIsLoaded(false);
    }, [emoji]);

    const sizeClasses = {
      sm: "size-4 text-sm",
      md: "size-6 text-xl",
      lg: "size-8 text-3xl",
      xl: "size-12 text-5xl",
    };

    // Encode the emoji for the URL
    const emojiUrl = `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}`;

    return (
      <span
        ref={ref}
        data-slot="apple-emoji"
        className={cn(
          "relative inline-flex items-center justify-center select-none shrink-0 align-middle",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {!hasError ? (
          <>
            {/* Image representing iOS emoji style */}
            <img
              src={emojiUrl}
              alt={emoji}
              draggable={false}
              loading="lazy"
              onError={() => setHasError(true)}
              onLoad={() => setIsLoaded(true)}
              className={cn(
                "w-full h-full object-contain transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0 absolute",
              )}
            />
            {/* Placeholder/Loading skeleton while the image fetches */}
            {!isLoaded && (
              <span
                className="w-full h-full rounded-full bg-white/10 animate-pulse absolute inset-0"
                aria-hidden="true"
              />
            )}
          </>
        ) : (
          // Fallback to native system emoji if CDN fails
          <span aria-label={emoji} role="img">
            {emoji}
          </span>
        )}
      </span>
    );
  },
);

AppleEmoji.displayName = "AppleEmoji";
