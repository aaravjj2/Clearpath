"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { AlertTriangle, Upload } from "lucide-react";

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB — must match backend

interface UploadZoneProps {
  disabled?: boolean;
  onFile: (file: File) => void;
}

export default function UploadZone({ disabled = false, onFile }: UploadZoneProps) {
  const [sizeError, setSizeError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      setSizeError(null);
      const file = files[0];
      if (!file) return;
      if (file.size > MAX_PDF_BYTES) {
        setSizeError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 20 MB.`);
        return;
      }
      onFile(file);
    },
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        data-testid="upload-zone"
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive ? "border-blue-500 bg-blue-950/30" : "border-slate-700 hover:border-slate-500"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-300 font-medium">Drop your PDF here</p>
        <p className="text-slate-500 text-sm mt-1">or click to browse · max 20 MB</p>
      </div>

      {sizeError && (
        <div role="alert" className="mt-3 flex items-start gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{sizeError}</span>
        </div>
      )}
    </div>
  );
}
