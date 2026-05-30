"use client";
import { useState } from "react";

interface AvatarProps {
  src?: string;
  alt: string;
  fallbackText: string;
  size?: "sm" | "md" | "lg";
  backgroundColor?: string;
}

export function Avatar({
  src,
  alt,
  fallbackText,
  size = "md",
  backgroundColor = "#2DB87A",
}: AvatarProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  const showImage = src?.startsWith("/") && !error;

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center text-white font-bold shadow-inner overflow-hidden shrink-0`}
      style={{ backgroundColor }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
          onLoad={() => setLoading(false)}
        />
      ) : (
        fallbackText.substring(0, 2).toUpperCase()
      )}
    </div>
  );
}
