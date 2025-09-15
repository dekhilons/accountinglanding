"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import ReactMarkdown from 'react-markdown'
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
  type?: "text" | "voice_transcript" | "voice_status"
}

interface QuickReply {
  id: string
  text: string
  action: () => void
}

interface WebSocketMessage {
  type: "chat_message" | "start_voice" | "stop_voice"
  content?: string
}

interface ServerMessage {
  type: "message" | "voice_transcript" | "voice_status" | "error"
  data: {
    role?: string
    content?: string
    transcript?: string
    status?: string
    message?: string
    timestamp?: string
    code?: string
  }
}

interface ChatWidgetProps {
  onClose: () => void
}

export function ChatWidget({ onClose }: ChatWidgetProps) {
  // State management
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI Accounting Assistant. How can I help you with your financial data today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting")
  const [sessionId, setSessionId] = useState<string>("")
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle")
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0))
  const [isProcessingAudio, setIsProcessingAudio] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const currentConnectionIdRef = useRef<string | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds

  // Computed properties
  const isConnected = connectionStatus === "connected";

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
    {
      id: "qr4",
      text: "AR aging report",
      action: () => handleSendMessage("Show me the accounts receivable aging report"),
    },
    {
      id: "qr5",
      text: "Top vendors",
      action: () => handleSendMessage("Who are our top 5 vendors by spend?"),
    },
  ];

  const generateUUID = useCallback(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }, []); // Empty dependency array as UUID generation is pure.

  // Initialize WebSocket connection logic
  const initializeWebSocket = useCallback(() => {
    // Prevent multiple WebSocket initializations if one is already connecting or connected
    if (websocketRef.current && (websocketRef.current.readyState === WebSocket.CONNECTING || websocketRef.current.readyState === WebSocket.OPEN)) {
      console.log("ℹ️ WebSocket connection already in progress or open. Skipping initialization.");
      return;
    }

    // Close existing connection if any. This handles cases where a previous connection
    // might still be active, e.g., after a reconnect attempt.
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      console.log("Closing existing WebSocket connection before new attempt.");
      websocketRef.current.close();
      websocketRef.current = null;
    }

    const connectionId = generateUUID();
    currentConnectionIdRef.current = connectionId;
    const sessionId = generateUUID();
    const WS_API_URL = process.env.NEXT_PUBLIC_WS_API_URL || `ws://localhost:8008`;
    const wsUrl = `${WS_API_URL}/ws/chat/${sessionId}`;
    console.log("🔌 Initializing WebSocket connection to:", wsUrl);
    console.log("process.env.NEXT_PUBLIC_WS_API_URL:", process.env.NEXT_PUBLIC_WS_API_URL);

    setConnectionStatus("connecting");

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (currentConnectionIdRef.current === connectionId) {
        console.log("✅ WebSocket connected successfully to chat service. URL:", ws.url);
        console.log("WebSocket readyState onopen:", ws.readyState);
        // Assign websocketRef.current here only if it's the current, valid connection
        websocketRef.current = ws;
        setConnectionStatus("connected");
        setSessionId(sessionId);
        setReconnectAttempts(0);
      } else {
        // If this is an old connection (due to Strict Mode re-render), close it.
        console.log("⚠️ WebSocket opened but it's an old connection, closing connection (from onopen handler)");
        ws.close();
      }
    };

    ws.onmessage = (event) => {
      if (currentConnectionIdRef.current !== connectionId) {
        console.log("⚠️ WebSocket message received but it's an old connection, ignoring");
        return;
      }
      console.log("📨 WebSocket message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("Parsed WebSocket message:", data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      // Check if this is the current connection. If not, this is a leftover event.
      if (currentConnectionIdRef.current !== connectionId) {
        console.log("⚠️ WebSocket closed but it's an old connection, ignoring (from onclose handler)");
        return;
      }
      console.log("🔌 WebSocket disconnected from chat service. Event:", event);
      console.log("Close event code:", event.code);
      console.log("Close event reason:", event.reason);
      console.log("WebSocket readyState onclose:", ws.readyState);
      setConnectionStatus("disconnected");
      setIsVoiceMode(false);
      setVoiceStatus("idle");

      // Clear the websocketRef if this was the current connection
      if (websocketRef.current === ws) {
        websocketRef.current = null;
      }

      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
        console.log(`🔄 Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          initializeWebSocket();
        }, reconnectDelay);
      } else if (event.code === 1000) {
        console.log("ℹ️ WebSocket closed normally (code 1000). Not attempting reconnect.");
      } else {
        console.log(`🛑 Max reconnect attempts (${maxReconnectAttempts}) reached.`);
      }
    };

    ws.onerror = (error) => {
      // Check if this is the current connection. If not, this is a leftover event.
      if (currentConnectionIdRef.current !== connectionId) {
        console.log("⚠️ WebSocket error occurred but it's an old connection, ignoring (from onerror handler)");
        return;
      }
      console.error("❌ WebSocket error occurred. Error object:", error);
      console.log("WebSocket readyState onerror:", ws.readyState);
      setConnectionStatus("error");
    };

    // Do NOT set websocketRef.current = ws here. It's moved into onopen.
  }, [generateUUID]); // Dependency on generateUUID

  // Initialize WebSocket connection using useEffect
  useEffect(() => {
    console.log("🚀 ChatWidget mounted - initializing WebSocket connection (useEffect)");
    isMountedRef.current = true; // Set to true on mount
    initializeWebSocket(); // Call the WebSocket initializer

    return () => {
      console.log("🛑 ChatWidget unmounting - cleaning up connections (useEffect cleanup)");
      isMountedRef.current = false; // Set to false on unmount

      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket connection only if it's open
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        console.log("Closing WebSocket connection during cleanup.");
        websocketRef.current.close();
      }
      // Nullify websocketRef.current here to ensure clean state on re-mount
      websocketRef.current = null;

      // Close audio context and stop visualization
      if (audioContextRef.current) {
        console.log("Closing audio context during cleanup.");
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [initializeWebSocket]); // Dependency on initializeWebSocket

  // Manual reconnect function
  const reconnectWebSocket = useCallback(() => {
    if (!isMountedRef.current) { console.log("⚠️ Manual reconnect triggered but component unmounted, ignoring"); return; }
    console.log("🔄 Manual reconnect triggered")
    setReconnectAttempts(0)
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    initializeWebSocket()
  }, [initializeWebSocket])

  // Connection health check
  const checkConnection = useCallback(() => {
    if (!isMountedRef.current) { console.log("⚠️ Connection health check triggered but component unmounted, ignoring"); return; }
    if (websocketRef.current) {
      if (websocketRef.current.readyState === WebSocket.CLOSED) {
        console.log("⚠️ WebSocket detected as closed, attempting reconnect")
        setConnectionStatus("disconnected")
        reconnectWebSocket()
      }
    } else {
      console.log("⚠️ No WebSocket connection found, initializing")
      initializeWebSocket()
    }
  }, [reconnectWebSocket, initializeWebSocket])

  // REST API fallback function
  const sendViaRestAPI = useCallback(async (content: string) => {
    if (!isMountedRef.current) { console.log("⚠️ sendViaRestAPI called but component unmounted, ignoring"); return; }
    try {
      const REST_API_URL = process.env.NEXT_PUBLIC_REST_API_URL || "http://localhost:8008";
      const response = await fetch(REST_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content,
          session_id: sessionId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: data.message.content,
          sender: "ai",
          timestamp: new Date(),
          type: "text"
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      console.error("❌ Error sending message via REST API:", error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "❌ Sorry, I'm having trouble connecting to the chat service. Please try again.",
        sender: "ai",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  const handleWebSocketMessage = useCallback((data: ServerMessage) => {
    if (!isMountedRef.current) { console.log("⚠️ handleWebSocketMessage called but component unmounted, ignoring"); return; }
    switch (data.type) {
      case "message":
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: data.data.content || "No response content",
          sender: "ai",
          timestamp: new Date(data.data.timestamp || Date.now()),
          type: "text"
        }
        setMessages(prev => [...prev, aiMessage])
        setIsLoading(false)
        break

      case "voice_transcript":
        const transcriptMessage: Message = {
          id: Date.now().toString(),
          content: data.data?.transcript || "Voice input received",
          sender: "user",
          timestamp: new Date(data.data?.timestamp || Date.now()),
          type: "voice_transcript"
        }
        setMessages(prev => [...prev, transcriptMessage])

        // Stop voice mode after receiving transcript
        setIsVoiceMode(false)
        setVoiceStatus("idle")

        // Send stop_voice to backend to clean up
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({
            type: "stop_voice"
          }))
        }
        break

      case "voice_status":
        const status = data.data?.status || "idle"
        // Ensure status is a valid voice status type
        const validStatus: "idle" | "listening" | "processing" | "speaking" =
          ["idle", "listening", "processing", "speaking"].includes(status) ? status as any : "idle"
        setVoiceStatus(validStatus)
        // Don't automatically control recording from server status
        // Recording is now controlled manually by the mic button
        break

      case "error":
        console.error("Chat service error:", data.data?.message || "Unknown error", "Code:", data.data?.code)

        let errorContent = "❌ An error occurred while processing your request."
        const errorCode = data.data?.code

        // Provide specific error messages based on error codes
        switch (errorCode) {
          case "VOICE_SERVICE_UNAVAILABLE":
            errorContent = "❌ Voice service is currently unavailable. Please try again later or use text input."
            setIsVoiceMode(false)
            setVoiceStatus("idle")
            break
          case "EMPTY_AUDIO":
            errorContent = "❌ No audio data was captured. Please try recording again."
            break
          case "UNSUPPORTED_AUDIO_FORMAT":
            errorContent = "❌ Audio format not supported. Please ensure your microphone is working properly."
            break
          case "AUDIO_PROCESSING_ERROR":
            errorContent = "❌ Failed to process audio. Please try again."
            break
          case "VOICE_CONNECTION_LOST":
            errorContent = "❌ Voice connection lost. Please restart voice mode."
            setIsVoiceMode(false)
            setVoiceStatus("idle")
            break
          case "CONNECTION_ERROR":
            errorContent = "❌ Connection error. The chat service may be temporarily unavailable."
            setConnectionStatus("error")
            break
          default:
            errorContent = `❌ Error: ${data.data?.message || "Unknown error occurred"}`
        }

        const errorMessage: Message = {
          id: Date.now().toString(),
          content: errorContent,
          sender: "ai",
          timestamp: new Date(),
          type: "text"
        }
        setMessages(prev => [...prev, errorMessage])
        setIsLoading(false)
        break
    }
  }, [])

  const handleSendMessage = useCallback(async (content: string = inputValue) => {
    if (!isMountedRef.current) { console.log("⚠️ handleSendMessage called but component unmounted, ignoring"); return; }
    if (!content.trim() || connectionStatus !== "connected") return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
      type: "text"
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Send message via WebSocket
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      try {
        const messageData: WebSocketMessage = {
          type: "chat_message",
          content: content
        }
        console.log("📤 Sending WebSocket message:", messageData)
        websocketRef.current.send(JSON.stringify(messageData))
      } catch (error) {
        console.error("❌ Failed to send WebSocket message:", error)
        setConnectionStatus("error")
        // Fallback to REST API
        await sendViaRestAPI(content)
      }
    } else {
      console.log("⚠️ WebSocket not available, falling back to REST API")
      console.log("WebSocket readyState:", websocketRef.current?.readyState)
      // Fallback to REST API
      await sendViaRestAPI(content)
    }
  }, [inputValue, connectionStatus, sendViaRestAPI])

  const toggleVoiceMode = useCallback(async () => {
    if (!isMountedRef.current) { console.log("⚠️ toggleVoiceMode called but component unmounted, ignoring"); return; }
    if (connectionStatus !== "connected") return

    if (!isVoiceMode) {
      // Start voice mode and recording
      setIsVoiceMode(true)
      setVoiceStatus("idle")

      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: "start_voice"
        }))
      }
      // Start recording immediately
      startRecording()
    } else {
      // Stop recording (audio will be processed and sent in onstop callback)
      stopRecording()

      // Don't stop voice mode immediately - wait for audio processing
      // Voice mode will be stopped when transcript is received
    }
  }, [isVoiceMode, connectionStatus])

  const startRecording = useCallback(async () => {
    if (!isMountedRef.current) { console.log("⚠️ startRecording called but component unmounted, ignoring"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      // Set up audio context and analyser for visualization
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        audioChunksRef.current = []; // Clear chunks after stopping

        // Stop visualization
        stopAudioVisualization()

        setIsProcessingAudio(true)

        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          try {
            // Send the audio blob as a binary message over WebSocket
            websocketRef.current.send(audioBlob);
            console.log("📤 Sent audio blob:", audioBlob);
          } catch (error) {
            console.error("❌ Failed to send audio blob over WebSocket:", error);
            // Handle error, e.g., display an error message to the user
          }
        } else {
          console.warn("⚠️ WebSocket not open, cannot send audio data.");
          // Handle case where WebSocket is not open
        }

        setIsRecording(false);
        setIsProcessingAudio(false);
      };

      mediaRecorder.start(100) // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)

      // Start audio visualization
      updateAudioLevels()

    } catch (error) {
      console.error("Error starting recording:", error)
      setIsRecording(false)
    }
  }, [websocketRef])

  const stopRecording = useCallback(() => {
    if (!isMountedRef.current) { console.log("⚠️ stopRecording called but component unmounted, ignoring"); return; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }

    // Stop audio context and visualization
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    stopAudioVisualization()

    setIsRecording(false)
  }, [])

  const toggleRecording = useCallback(() => {
    if (!isMountedRef.current) { console.log("⚠️ toggleRecording called but component unmounted, ignoring"); return; }
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current || !isRecording) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    analyser.getByteFrequencyData(dataArray)

    // Calculate average levels for visualization bars
    const levels: number[] = []
    const barCount = 20
    const binSize = Math.floor(bufferLength / barCount)

    for (let i = 0; i < barCount; i++) {
      let sum = 0
      for (let j = 0; j < binSize; j++) {
        sum += dataArray[i * binSize + j]
      }
      levels.push(sum / binSize / 255) // Normalize to 0-1
    }

    setAudioLevels(levels)

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevels)
    }
  }, [isRecording])

  const stopAudioVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setAudioLevels(new Array(20).fill(0))
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isMountedRef.current) { console.log("⚠️ handleKeyDown called but component unmounted, ignoring"); return; }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 w-[500px] h-[600px] bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">AI Accounting Assistant</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Connection Status */}
      <div className={`px-4 py-2 text-sm bg-gray-50 border-l-4 ${
        connectionStatus === 'connected' ? 'border-green-500 text-green-700' :
        connectionStatus === 'connecting' ? 'border-yellow-500 text-yellow-700' :
        connectionStatus === 'error' ? 'border-red-500 text-red-700' :
        'border-gray-500 text-gray-600'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            connectionStatus === 'error' ? 'bg-red-500' :
            'bg-gray-500'
          }`} />
          Status: {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   connectionStatus === 'error' ? 'Connection Error' :
                   'Disconnected'}
          {reconnectAttempts > 0 && (
            <span className="text-xs text-gray-500">
              (Attempt {reconnectAttempts + 1}/{maxReconnectAttempts})
            </span>
          )}
        </div>
      </div>

      {/* Voice Status - only show when voice mode is active */}
      {isVoiceMode && (
        <div className={`px-4 py-1 text-xs border-l-4 ${
          voiceStatus === 'listening' ? 'border-blue-500 text-blue-700 bg-blue-50' :
          voiceStatus === 'processing' ? 'border-orange-500 text-orange-700 bg-orange-50' :
          voiceStatus === 'speaking' ? 'border-purple-500 text-purple-700 bg-purple-50' :
          'border-gray-500 text-gray-600 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              voiceStatus === 'listening' ? 'bg-blue-500 animate-pulse' :
              voiceStatus === 'processing' ? 'bg-orange-500 animate-spin' :
              voiceStatus === 'speaking' ? 'bg-purple-500' :
              'bg-gray-500'
            }`} />
            Voice: {voiceStatus === 'listening' ? 'Listening...' :
                    voiceStatus === 'processing' ? 'Processing...' :
                    voiceStatus === 'speaking' ? 'Speaking...' :
                    'Ready'}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {message.sender === 'user' ? 'U' : 'AI'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Quick Replies */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply.id}
                variant="outline"
                size="sm"
                onClick={reply.action}
                disabled={connectionStatus !== "connected"}
              >
                {reply.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          {isRecording || isProcessingAudio ? (
            // Audio Frequency Visualizer
            <div className="flex-1 flex items-center justify-center gap-1 h-10 bg-gray-50 rounded-md border">
              {isProcessingAudio ? (
                // Processing state - show static bars
                <>
                  {audioLevels.map((level, index) => (
                    <div
                      key={index}
                      className="bg-orange-500 rounded-sm"
                      style={{
                        width: '4px',
                        height: '16px',
                        opacity: 0.6
                      }}
                    />
                  ))}
                  <div className="ml-2 text-xs text-orange-600">Processing...</div>
                </>
              ) : (
                // Recording state - show animated bars
                <>
                  {audioLevels.map((level, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 rounded-sm transition-all duration-75"
                      style={{
                        width: '4px',
                        height: `${Math.max(4, level * 32)}px`,
                        opacity: level > 0.1 ? 1 : 0.3
                      }}
                    />
                  ))}
                  <div className="ml-2 text-xs text-gray-500">Listening...</div>
                </>
              )}
            </div>
          ) : (
            // Text Input
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={connectionStatus !== "connected"}
              className="flex-1"
            />
          )}
          <Button
            onClick={() => handleSendMessage()}
            disabled={isLoading || connectionStatus !== "connected" || !inputValue.trim() || isRecording}
            size="sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
          <Button
            onClick={toggleVoiceMode}
            disabled={connectionStatus !== "connected" || isProcessingAudio}
            variant={isProcessingAudio ? "secondary" : isRecording ? "destructive" : "outline"}
            size="sm"
          >
            {isProcessingAudio ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
