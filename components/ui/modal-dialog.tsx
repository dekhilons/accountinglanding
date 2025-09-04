"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ModalDialogProps {
  title: string
  description?: string
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => Promise<void> | void // Added Promise<void> for async handlers
  onCancel?: () => Promise<void> | void // Added for custom cancel logic
  confirmText?: string
  cancelText?: string
  children?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export function ModalDialog({
  title,
  description,
  isOpen,
  onClose,
  onConfirm,
  onCancel, // Destructure onCancel prop
  confirmText = "Confirm",
  cancelText = "Cancel",
  children,
  size = "md",
}: ModalDialogProps) {
  const [open, setOpen] = useState(isOpen)

  useEffect(() => {
    setOpen(isOpen)
  }, [isOpen])

  const handleClose = () => {
    setOpen(false)
    onClose()
  }

  const handleConfirm = async () => { // Made async to handle Promise<void>
    if (onConfirm) {
      await onConfirm() // Await onConfirm
    }
    handleClose()
  }

  const handleCancel = async () => { // New handler for onCancel
    if (onCancel) {
      await onCancel() // Await onCancel
    }
    handleClose()
  }

  // Determine width based on size prop
  const getWidth = () => {
    switch (size) {
      case "sm":
        return "max-w-sm"
      case "md":
        return "max-w-md"
      case "lg":
        return "max-w-lg"
      case "xl":
        return "max-w-xl"
      default:
        return "max-w-md"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={`${getWidth()} p-0`}>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription className="mt-1">{description}</DialogDescription>}
        </DialogHeader>

        <div className="px-6 py-2">{children}</div>

        {(onConfirm || onCancel) && ( // Render footer if either confirm or cancel is provided
          <DialogFooter className="p-6 pt-2">
            {/* Render cancel button only if onCancel is provided */}
            {onCancel && (
              <Button variant="outline" onClick={handleCancel}>
                {cancelText}
              </Button>
            )}
            {/* Render confirm button only if onConfirm is provided */}
            {onConfirm && (
              <Button onClick={handleConfirm}>{confirmText}</Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
