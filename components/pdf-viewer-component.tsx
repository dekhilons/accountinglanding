"use client"

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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
  onLoadSuccess,
  onLoadError,
  pageNumber,
  numPages,
  setPageNumber,
  isLoading,
}) => {
  const { toast } = useToast();

  return (
    <div className="border rounded-lg p-2 bg-gray-50 flex flex-col items-center justify-center min-h-[400px]">
      {pdfUrl ? (
        <>
          <Document
            file={pdfUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            className="w-full h-full flex justify-center items-center"
          >
            <Page pageNumber={pageNumber} width={350} />
          </Document>
          {numPages && (
            <div className="flex items-center space-x-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPageNumber(prevPage => Math.max(1, prevPage - 1))}
                disabled={pageNumber <= 1}
              >
                Previous
              </Button>
              <p className="text-sm text-gray-700">
                Page {pageNumber} of {numPages}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPageNumber(prevPage => Math.min(numPages, prevPage + 1))}
                disabled={pageNumber >= (numPages || 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
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
