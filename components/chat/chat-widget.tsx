"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Send, Mic, MicOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

interface QuickReply {
  id: string
  text: string
  action: () => void
}

interface ChatWidgetProps {
  onClose: () => void
}

export function ChatWidget({ onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickReplies: QuickReply[] = [
    {
      id: "qr1",
      text: "Show pending approvals",
      action: () => handleSendMessage("Show me all pending approvals"),
    },
    {
      id: "qr2",
      text: "Cash runway forecast",
      action: () => handleSendMessage("What's our cash runway for the next 30 days?"),
    },
    {
      id: "qr3",
      text: "Recent invoices",
      action: () => handleSendMessage("Show recent invoices"),
    },
  ]

  useEffect(() => {
    scrollToBottom()
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response after delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(content),
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const getAIResponse = (query: string): string => {
    // Simple response logic - in a real app, this would call an API
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("pending approval")) {
      return "You have 3 invoices and 2 journal entries pending approval. Would you like to review them now?"
    }

    if (lowerQuery.includes("cash") && lowerQuery.includes("runway")) {
      return "Based on current cash flow, your runway is approximately 8.5 months. Would you like to see the detailed forecast?"
    }

    if (lowerQuery.includes("invoice")) {
      return "I found 12 invoices processed in the last 7 days. The total amount is $24,350.75. Would you like me to show the details?"
    }

    return "I'll help you with that. Would you like me to navigate to the relevant section of the platform?"
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // In a real implementation, this would start/stop speech recognition
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-[350px] md:w-[450px] lg:w-[500px] max-h-[95vh] bg-white rounded-lg shadow-xl flex flex-col z-50 border border-teal-500">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI Assistant" />
            <AvatarFallback className="bg-teal-100 text-teal-600">AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-sm">AI Assistant</h3>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 pb-0">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === "user" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Replies */}
      <div className="p-4 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
        <div className="flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <Button key={reply.id} variant="outline" size="sm" className="text-xs h-auto px-3 py-1.5" onClick={reply.action}>
              {reply.text}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className={isRecording ? "text-red-500" : "text-gray-500"}
            onClick={toggleRecording}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span className="sr-only">{isRecording ? "Stop recording" : "Start recording"}</span>
          </Button>

          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1"
          />

          <Button
            variant="ghost"
            size="icon"
            className="text-teal-600"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
