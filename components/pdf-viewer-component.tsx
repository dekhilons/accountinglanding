"use client"

import React from 'react';
import { Clock } from "lucide-react";

interface PdfViewerComponentProps {
  pdfUrl: string | null;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onLoadError: (error: any) => void;
  pageNumber: number;
  numPages: number | null;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
}

const PdfViewerComponent: React.FC<PdfViewerComponentProps> = ({
  pdfUrl,
  isLoading,
}) => {
  return (
    <div className="border rounded-lg p-2 bg-gray-50 flex flex-col items-center justify-center min-h-[400px]">
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          className="w-full h-full min-h-[400px]"
          title="PDF Viewer"
        />
      ) : isLoading ? (
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-2 animate-spin" />
          <p className="text-sm text-gray-500">Loading document...</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-500">No document selected or available.</p>
        </div>
      )}
    </div>
  );
};

export default PdfViewerComponent;
