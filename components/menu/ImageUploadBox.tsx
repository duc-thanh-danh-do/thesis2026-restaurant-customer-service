"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadBoxProps {
  value?: string | null;
  onChange?: (url: string) => void;
  disabled?: boolean;
}

export default function ImageUploadBox({
  value,
  onChange,
  disabled = false,
}: ImageUploadBoxProps) {
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && onChange) {
        onChange(data.imageUrl);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <label className="block text-sm text-slate-700 mb-2">Image</label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 shrink-0 overflow-hidden relative hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isUploading ? (
            <span className="text-[10px] font-medium animate-pulse">
              Uploading...
            </span>
          ) : value ? (
            <Image
              src={value}
              alt="Uploaded menu item preview"
              fill
              sizes="64px"
              className="object-cover group-hover:opacity-60 transition-opacity"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 group-hover:scale-110 transition-transform"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          )}
        </button>

        <div className="flex flex-col items-start">
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="text-sm font-semibold text-slate-500 hover:text-[#142653] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Click to upload
          </button>
          <span className="text-xs text-slate-400 mt-1">SVG, PNG, JPG</span>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
