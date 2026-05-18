"use client";

import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  disabled?: boolean;
  onFile: (file: File) => void;
}

export default function UploadZone({ disabled = false, onFile }: UploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files[0]) onFile(files[0]);
    },
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
        isDragActive ? "border-blue-500 bg-blue-950/30" : "border-slate-700 hover:border-slate-500"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
      <p className="text-slate-300 font-medium">Drop your PDF here</p>
      <p className="text-slate-500 text-sm mt-1">or click to browse</p>
    </div>
  );
}
