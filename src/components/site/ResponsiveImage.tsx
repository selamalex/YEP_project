import { useState, useCallback, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Image component that preserves landscape rendering with object-cover,
 * while automatically displaying portrait images with object-contain to avoid cropping.
 */
export function ResponsiveImage({
  src,
  alt,
  className,
  ...props
}: ResponsiveImageProps) {
  const [isPortrait, setIsPortrait] = useState(false);

  const checkDimensions = useCallback((img: HTMLImageElement | null) => {
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      setIsPortrait(img.naturalHeight > img.naturalWidth);
    }
  }, []);

  return (
    <img
      src={src}
      alt={alt}
      ref={checkDimensions}
      onLoad={(e) => checkDimensions(e.currentTarget)}
      className={cn(
        "h-full w-full transition-opacity duration-300",
        isPortrait ? "object-contain bg-muted/40" : "object-cover",
        className,
      )}
      {...props}
    />
  );
}

