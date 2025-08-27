"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface DocumentType {
  value: string
  label: string
}

interface FileUploaderProps {
  documentTypes: DocumentType[]
  onUpload: (file: File, documentType: string) => Promise<void>
  maxFileSize?: number // in MB
  acceptedFileTypes?: string[]
}

interface UploadFile {
  file: File
  documentType: string
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

export function FileUploader({
  documentTypes,
  onUpload,
  maxFileSize = 10,
  acceptedFileTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx"],
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files))
    }
  }, [])

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadFile[] = fileList.map((file) => ({
      file,
      documentType: documentTypes[0]?.value || "",
      status: "pending",
      progress: 0,
    }))

    // Validate files
    const validatedFiles = newFiles.map((uploadFile) => {
      const { file } = uploadFile

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        return {
          ...uploadFile,
          status: "error" as const,
          error: `File size exceeds ${maxFileSize}MB limit`,
        }
      }

      // Check file type
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
      if (!acceptedFileTypes.includes(fileExtension)) {
        return {
          ...uploadFile,
          status: "error" as const,
          error: "File type not supported",
        }
      }

      return uploadFile
    })

    setFiles((prev) => [...prev, ...validatedFiles])
  }

  const updateFileDocumentType = (index: number, documentType: string) => {
    setFiles((prev) => prev.map((file, i) => (i === index ? { ...file, documentType } : file)))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (index: number) => {
    const file = files[index]
    if (!file.documentType) {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "error", error: "Please select a document type" } : f)),
      )
      return
    }

    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: "uploading", progress: 0 } : f)))

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, progress: Math.min(f.progress + 10, 90) } : f)))
      }, 200)

      await onUpload(file.file, file.documentType)

      clearInterval(progressInterval)
      setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: "success", progress: 100 } : f)))
    } catch (error) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f,
        ),
      )
    }
  }

  const uploadAllFiles = async () => {
    const pendingFiles = files.map((file, index) => ({ file, index })).filter(({ file }) => file.status === "pending")

    for (const { index } of pendingFiles) {
      await uploadFile(index)
    }
  }

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "uploading":
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive ? "border-teal-500 bg-teal-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleChange}
          accept={acceptedFileTypes.join(",")}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-teal-600 hover:text-teal-500">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedFileTypes.join(", ")} up to {maxFileSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Files to upload</h3>
            <Button
              onClick={uploadAllFiles}
              disabled={files.every((f) => f.status !== "pending")}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
            >
              Upload All
            </Button>
          </div>

          {files.map((uploadFile, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">{getStatusIcon(uploadFile.status)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">{uploadFile.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                </div>

                {uploadFile.status === "uploading" && (
                  <div className="mt-1">
                    <Progress value={uploadFile.progress} className="h-1" />
                  </div>
                )}

                {uploadFile.status === "error" && uploadFile.error && (
                  <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                )}

                {(uploadFile.status === "pending" || uploadFile.status === "error") && (
                  <div className="mt-2">
                    <Select
                      value={uploadFile.documentType}
                      onValueChange={(value) => updateFileDocumentType(index, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {uploadFile.status === "pending" && (
                  <Button
                    onClick={() => uploadFile(index)}
                    disabled={!uploadFile.documentType}
                    size="sm"
                    variant="outline"
                  >
                    Upload
                  </Button>
                )}
                <Button
                  onClick={() => removeFile(index)}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
