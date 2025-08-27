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
  onConfirm?: () => void
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

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
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

        {onConfirm && (
          <DialogFooter className="p-6 pt-2">
            <Button variant="outline" onClick={handleClose}>
              {cancelText}
            </Button>
            <Button onClick={handleConfirm}>{confirmText}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
