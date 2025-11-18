

// now adding boooking capabilies  also
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { bookingsApi } from '../services/api';
import './AIBookingAssistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  bookingData?: any;
}

interface BookingInfo {
  userName?: string;
  roomId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  awaitingConfirmation?: boolean;
}

interface AIBookingAssistantProps {
  onClose: () => void;
  rooms: Array<{
    id: string;
    name: string;
    baseHourlyRate: number;
    capacity: number;
  }>;
  onBookingSuccess?: (booking: any) => void;
}

export const AIBookingAssistant: React.FC<AIBookingAssistantProps> = ({ 
  onClose, 
  rooms,
  onBookingSuccess 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi! I\'m your AI booking assistant powered by **Google Gemini**!\n\nI can:\n• Answer questions about rooms\n• Help you find the perfect space\n• **Book rooms directly for you**\n\n💡 Just chat naturally or try:\n"Book Cabin 1 for John on Nov 18 from 2PM to 4PM"\n\nWhat can I help you with? ✨',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [useGemini, setUseGemini] = useState(true);
  
  const bookingInfoRef = useRef<BookingInfo>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getRoomContext = useCallback(() => {
    return `
Available Rooms:
${rooms.map(room => `
- ${room.name} (ID: ${room.id})
  Capacity: ${room.capacity} people
  Base Rate: ₹${room.baseHourlyRate}/hour
  Peak Rate: ₹${room.baseHourlyRate * 1.5}/hour (Mon-Fri 10AM-1PM, 4PM-7PM)
`).join('\n')}

Booking Rules:
- Minimum: 30 minutes, Maximum: 12 hours
- Business hours: 6:00 AM - 11:00 PM
- Cancellation: 2+ hours before start time
- Peak hours: Mon-Fri 10AM-1PM & 4PM-7PM (1.5× rate)
`;
  }, [rooms]);

  // Extract booking information from text
  const extractBookingInfo = (text: string): Partial<BookingInfo> => {
    const info: Partial<BookingInfo> = {};
    
    // Extract name
    const namePatterns = [
      /(?:for|name(?:\s+is)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /(?:I'm|I am)\s+([A-Z][a-z]+)/,
      /\bname[:\s]+([A-Z][a-z]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.userName = match[1].trim();
        break;
      }
    }

    // Extract room
    const roomMentioned = rooms.find(r => 
      text.toLowerCase().includes(r.name.toLowerCase()) || 
      text.toLowerCase().includes(r.id.toLowerCase())
    );
    if (roomMentioned) {
      info.roomId = roomMentioned.id;
    }

    // Extract capacity
    const peopleMatch = text.match(/(\d+)\s*(?:people|persons|pax)/i);
    if (peopleMatch) {
      info.capacity = parseInt(peopleMatch[1]);
    }

    // Extract date
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (/\btomorrow\b/i.test(text)) {
      info.date = tomorrow.toISOString().split('T')[0];
    } else if (/\btoday\b/i.test(text)) {
      info.date = today.toISOString().split('T')[0];
    } else {
      const dateMatch = text.match(/(?:Nov(?:ember)?)\s+(\d{1,2})/i);
      if (dateMatch) {
        const day = dateMatch[1];
        const year = today.getFullYear();
        info.date = `${year}-11-${String(day).padStart(2, '0')}`;
      }
      
      const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) {
        info.date = isoMatch[1];
      }
    }

    // Extract times
    const times: string[] = [];
    const timePattern = /\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi;
    let match;
    
    while ((match = timePattern.exec(text)) !== null) {
      let hours = parseInt(match[1]);
      const minutes = match[2] || '00';
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      times.push(`${String(hours).padStart(2, '0')}:${minutes}:00`);
    }

    if (times.length >= 2) {
      info.startTime = times[0];
      info.endTime = times[1];
    } else if (times.length === 1) {
      info.startTime = times[0];
      
      const durationMatch = text.match(/(\d+)\s*(?:hours?|hrs)/i);
      if (durationMatch) {
        const [hours, minutes] = info.startTime.split(':').map(Number);
        const duration = parseInt(durationMatch[1]);
        const endHours = hours + duration;
        info.endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      }
    }

    return info;
  };

  const mergeBookingInfo = (newInfo: Partial<BookingInfo>) => {
    bookingInfoRef.current = {
      ...bookingInfoRef.current,
      ...newInfo
    };
    return bookingInfoRef.current;
  };

  const hasCompleteInfo = (info: BookingInfo): boolean => {
    return !!(info.userName && info.date && info.startTime && info.endTime);
  };

  const suggestRoom = (info: BookingInfo) => {
    let suitable = [...rooms];
    
    if (info.capacity) {
      suitable = suitable.filter(r => r.capacity >= info.capacity);
    }
    
    if (suitable.length === 0) suitable = rooms;
    
    return suitable.sort((a, b) => a.baseHourlyRate - b.baseHourlyRate)[0];
  };

  const calculatePrice = (roomId: string, startTime: string, endTime: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 0;

    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    const duration = endHour - startHour;

    return room.baseHourlyRate * duration;
  };

  // ACTUAL BOOKING EXECUTION
  const executeBooking = async (info: BookingInfo): Promise<void> => {
    console.log('🎯 EXECUTING BOOKING:', info);
    
    try {
      setIsBooking(true);

      if (!info.roomId) {
        const suggested = suggestRoom(info);
        info.roomId = suggested.id;
      }

      const room = rooms.find(r => r.id === info.roomId);
      
      const startDateTime = `${info.date}T${info.startTime}`;
      const endDateTime = `${info.date}T${info.endTime}`;

      const bookingPayload = {
        roomId: info.roomId,
        userName: info.userName!,
        startTime: new Date(startDateTime).toISOString(),
        endTime: new Date(endDateTime).toISOString()
      };

      console.log('📤 CALLING API:', bookingPayload);

      // REAL API CALL
      const result = await bookingsApi.create(bookingPayload);

      console.log('✅ BOOKING CREATED:', result);

      const successMsg: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `🎉 **BOOKING CONFIRMED!**

✅ **Booking ID:** \`${result.bookingId}\`
🏢 **Room:** ${room?.name}
👤 **Name:** ${info.userName}
📅 **Date:** ${info.date}
🕐 **Time:** ${info.startTime.slice(0, 5)} - ${info.endTime.slice(0, 5)}
💰 **Total Price:** ₹${result.totalPrice}

**Status:** ${result.status}

Your booking is confirmed! Check "My Bookings" to manage it. 🎊`,
        timestamp: new Date(),
        bookingData: result
      };

      setMessages(prev => [...prev, successMsg]);

      if (onBookingSuccess) {
        onBookingSuccess(result);
      }

      bookingInfoRef.current = {};

    } catch (error: any) {
      console.error('❌ BOOKING FAILED:', error);
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ **Booking Failed**

**Error:** ${error.response?.data?.error || error.message}

Let me help you fix this! What would you like to adjust? 💪`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsBooking(false);
    }
  };

  // GET GEMINI AI RESPONSE
  const getGeminiResponse = async (userMessage: string, bookingInfo: BookingInfo): Promise<string> => {
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const model of modelsToTry) {
      try {
        console.log(`🤖 Trying Gemini model: ${model}`);

        const contextPrompt = `You are an AI booking assistant that helps users book meeting rooms.

${getRoomContext()}

**Current booking information collected:**
${Object.keys(bookingInfo).length > 0 ? JSON.stringify(bookingInfo, null, 2) : 'None yet'}

**Conversation context:**
${messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

User's message: "${userMessage}"

**Your role:**
1. Help users find suitable rooms based on their needs
2. Answer questions about rooms, pricing, policies, amenities
3. Extract booking details from conversation naturally
4. When you have all required info (name, date, start time, end time), inform the user you're ready to confirm
5. Be conversational, friendly, and helpful

**Important:**
- DO NOT say you can't book - you CAN book directly
- If user confirms, the system will execute the booking
- Guide users naturally toward providing: name, room/capacity, date, time
- Answer general questions intelligently

**Required for booking:**
- User name
- Date
- Start time  
- End time
- Room preference OR capacity (we'll suggest best room)

Respond naturally (max 150 words):`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=AIzaSyCBDJsqgohGLi6R2c7X3IXE6tozlYcO5-4`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: contextPrompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (aiResponse?.trim()) {
            console.log(`✅ Gemini response from ${model}`);
            return aiResponse.trim();
          }
        }
      } catch (error) {
        console.error(`Error with ${model}:`, error);
      }
    }

    console.warn('⚠️ All Gemini models failed, using smart fallback');
    setUseGemini(false);
    return getSmartFallback(userMessage, bookingInfo);
  };

  // SMART FALLBACK (when Gemini fails)
  const getSmartFallback = (message: string, info: BookingInfo): string => {
    const msgLower = message.toLowerCase();
    
    // Check what info we have
    const missing = [];
    if (!info.userName) missing.push('your name');
    if (!info.date) missing.push('date');
    if (!info.startTime) missing.push('start time');
    if (!info.endTime) missing.push('end time');

    // General questions
    if (msgLower.match(/\b(price|cost|rate|expensive|cheap)\b/)) {
      const sorted = [...rooms].sort((a, b) => a.baseHourlyRate - b.baseHourlyRate);
      return `💰 **Room Pricing:**

**Most Affordable:**
${sorted.slice(0, 2).map(r => `• ${r.name}: ₹${r.baseHourlyRate}/hr (₹${r.baseHourlyRate * 1.5}/hr peak)`).join('\n')}

**Premium:**
${sorted.slice(-2).map(r => `• ${r.name}: ₹${r.baseHourlyRate}/hr (₹${r.baseHourlyRate * 1.5}/hr peak)`).join('\n')}

Peak hours: Mon-Fri 10AM-1PM & 4PM-7PM 📈

What fits your budget?`;
    }

    if (msgLower.match(/\b(capacity|people|seats)\b/)) {
      return `👥 **Room Capacities:**

${rooms.map(r => `• ${r.name}: Up to ${r.capacity} people - ₹${r.baseHourlyRate}/hr`).join('\n')}

How many people are you planning for?`;
    }

    if (msgLower.match(/\b(available|rooms|list)\b/)) {
      return `🏢 **All ${rooms.length} Available Rooms:**

${rooms.map((r, i) => `**${i + 1}. ${r.name}**\n   👥 ${r.capacity} people | 💰 ₹${r.baseHourlyRate}/hr`).join('\n\n')}

Which interests you?`;
    }

    if (msgLower.match(/\b(policy|rules|cancel|hours)\b/)) {
      return `📋 **Booking Policies:**

⏰ **Hours:** 6AM - 11PM daily
⏱️ **Duration:** 30 min - 12 hours
❌ **Cancellation:** 2+ hours before start
💰 **Peak Pricing:** 1.5× (Mon-Fri 10AM-1PM, 4PM-7PM)

Questions?`;
    }

    // Booking guidance
    if (missing.length > 0) {
      return `📝 **To book, I need:**

${missing.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Example: "Book Cabin 1 for John on Nov 18 from 2PM to 4PM"

What can you tell me? 😊`;
    }

    return '🤔 I can help you with room info, pricing, or booking! What would you like to know?';
  };

  // MAIN MESSAGE HANDLER
  const handleUserMessage = async (userMessage: string) => {
    console.log('💬 Processing:', userMessage);

    // Extract booking info
    const extracted = extractBookingInfo(userMessage);
    console.log('📊 Extracted:', extracted);

    const currentInfo = mergeBookingInfo(extracted);
    console.log('📦 Current info:', currentInfo);

    // Check for confirmation
    const isConfirmation = /\b(yes|confirm|book it|proceed|go ahead|sure)\b/i.test(userMessage);

    // If awaiting confirmation and user confirms - EXECUTE BOOKING
    if (currentInfo.awaitingConfirmation && isConfirmation) {
      console.log('✅ CONFIRMED - BOOKING NOW');
      await executeBooking(currentInfo);
      return;
    }

    // If we have complete info - ask for confirmation
    if (hasCompleteInfo(currentInfo) && !currentInfo.awaitingConfirmation) {
      const room = currentInfo.roomId ? 
        rooms.find(r => r.id === currentInfo.roomId) : 
        suggestRoom(currentInfo);

      const price = calculatePrice(room!.id, currentInfo.startTime!, currentInfo.endTime!);

      bookingInfoRef.current.awaitingConfirmation = true;

      return `✅ **Perfect! Ready to book:**

🏢 **Room:** ${room?.name}
👤 **Name:** ${currentInfo.userName}
📅 **Date:** ${currentInfo.date}
🕐 **Time:** ${currentInfo.startTime?.slice(0, 5)} - ${currentInfo.endTime?.slice(0, 5)}
💰 **Estimated:** ₹${price}

**Reply "yes" or "confirm" to complete booking!** 🎯`;
    }

    // Otherwise, get AI response
    if (useGemini) {
      try {
        return await getGeminiResponse(userMessage, currentInfo);
      } catch (error) {
        console.error('Gemini failed, using fallback');
        return getSmartFallback(userMessage, currentInfo);
      }
    } else {
      return getSmartFallback(userMessage, currentInfo);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isBooking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await handleUserMessage(currentInput);
      
      if (response) {
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          setIsTyping(false);
        }, 600);
      } else {
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickExamples = [
    'Book Cabin 1 for John tomorrow 2PM-4PM',
    'What rooms do you have?',
    'Show me pricing',
    'I need a room for 8 people'
  ];

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-container">
        <div className="ai-assistant-header">
          <div className="ai-assistant-header-content">
            <div className="ai-assistant-avatar">🤖</div>
            <div>
              <h3 className="ai-assistant-title">AI Booking Assistant</h3>
              <p className="ai-assistant-subtitle">
                {useGemini ? 'Powered by Google Gemini ✨' : 'Smart Mode 💡'}
              </p>
            </div>
          </div>
          <button className="ai-assistant-close" onClick={onClose}>×</button>
        </div>

        {messages.length <= 2 && (
          <div className="quick-questions">
            <p className="quick-questions-title">Quick start:</p>
            <div className="quick-questions-grid">
              {quickExamples.map((example, i) => (
                <button
                  key={i}
                  className="quick-question-btn"
                  onClick={() => setInput(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ai-assistant-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message ${
                message.role === 'user' ? 'ai-message-user' : 
                message.role === 'system' ? 'ai-message-system' :
                'ai-message-assistant'
              }`}
            >
              <div className="ai-message-avatar">
                {message.role === 'user' ? '👤' : 
                 message.role === 'system' ? '✅' : '🤖'}
              </div>
              <div className="ai-message-content">
                <div className="ai-message-text">{message.content}</div>
                <div className="ai-message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {(isTyping || isBooking) && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-avatar">
                {isBooking ? '⚡' : '🤖'}
              </div>
              <div className="ai-message-content">
                {isBooking ? (
                  <div className="ai-message-text booking-in-progress">
                    ⚡ Creating your booking...
                  </div>
                ) : (
                  <div className="ai-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-assistant-input-container">
          <input
            type="text"
            className="ai-assistant-input"
            placeholder="Ask anything or book: 'Cabin 1 for John on Nov 18 2PM-4PM'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || isBooking}
          />
          <button
            className="ai-assistant-send"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isBooking}
          >
            {isLoading || isBooking ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
};

Updated AI Assistant with Voice assistnat 




import React, { useState, useRef, useCallback, useEffect } from 'react';
import { bookingsApi } from '../services/api';
import './AIBookingAssistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  bookingData?: any;
}

interface BookingInfo {
  userName?: string;
  roomId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  awaitingConfirmation?: boolean;
}

interface AIBookingAssistantProps {
  onClose: () => void;
  rooms: Array<{
    id: string;
    name: string;
    baseHourlyRate: number;
    capacity: number;
  }>;
  onBookingSuccess?: (booking: any) => void;
}

const MAX_INPUT_LENGTH = 300; // Character limit

export const AIBookingAssistant: React.FC<AIBookingAssistantProps> = ({ 
  onClose, 
  rooms,
  onBookingSuccess 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi! I\'m your AI booking assistant with **voice support**!\n\nI can:\n• Answer questions about rooms 🏢\n• **Book rooms directly** ⚡\n• **Listen to your voice** 🎤︎︎︎ ︎ \n• **Speak responses** 🔊\n\n💡 Type or click 🎤︎︎︎︎to speak!\n\nWhat can I help you with? ✨',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [useGemini, setUseGemini] = useState(true);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  const bookingInfoRef = useRef<BookingInfo>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤︎︎︎︎Voice input:', transcript);
        setInput(transcript.slice(0, MAX_INPUT_LENGTH)); // Respect character limit
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('🎤︎︎︎︎Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      setVoiceEnabled(true);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Start voice input
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  // Stop voice input
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Speak text
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    synthesisRef.current = utterance;

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    utterance.lang = 'en-US';

    // Try to get a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en-US') && 
      (voice.name.includes('Google') || voice.name.includes('Natural'))
    ) || voices.find(voice => voice.lang.includes('en-US')) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      synthesisRef.current = null;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      synthesisRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const getRoomContext = useCallback(() => {
    return `
Available Rooms:
${rooms.map(room => `
- ${room.name} (ID: ${room.id})
  Capacity: ${room.capacity} people
  Base Rate: ₹${room.baseHourlyRate}/hour
  Peak Rate: ₹${room.baseHourlyRate * 1.5}/hour (Mon-Fri 10AM-1PM, 4PM-7PM)
`).join('\n')}

Booking Rules:
- Minimum: 30 minutes, Maximum: 12 hours
- Business hours: 6:00 AM - 11:00 PM
- Cancellation: 2+ hours before start time
- Peak hours: Mon-Fri 10AM-1PM & 4PM-7PM (1.5× rate)
`;
  }, [rooms]);

  const extractBookingInfo = (text: string): Partial<BookingInfo> => {
    const info: Partial<BookingInfo> = {};
    
    // Extract name
    const namePatterns = [
      /(?:for|name(?:\s+is)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /(?:I'm|I am)\s+([A-Z][a-z]+)/,
      /\bname[:\s]+([A-Z][a-z]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.userName = match[1].trim();
        break;
      }
    }

    const roomMentioned = rooms.find(r => 
      text.toLowerCase().includes(r.name.toLowerCase()) || 
      text.toLowerCase().includes(r.id.toLowerCase())
    );
    if (roomMentioned) {
      info.roomId = roomMentioned.id;
    }

    const peopleMatch = text.match(/(\d+)\s*(?:people|persons|pax)/i);
    if (peopleMatch) {
      info.capacity = parseInt(peopleMatch[1]);
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (/\btomorrow\b/i.test(text)) {
      info.date = tomorrow.toISOString().split('T')[0];
    } else if (/\btoday\b/i.test(text)) {
      info.date = today.toISOString().split('T')[0];
    } else {
      const dateMatch = text.match(/(?:Nov(?:ember)?)\s+(\d{1,2})/i);
      if (dateMatch) {
        const day = dateMatch[1];
        const year = today.getFullYear();
        info.date = `${year}-11-${String(day).padStart(2, '0')}`;
      }
      
      const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) {
        info.date = isoMatch[1];
      }
    }

    const times: string[] = [];
    const timePattern = /\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi;
    let match;
    
    while ((match = timePattern.exec(text)) !== null) {
      let hours = parseInt(match[1]);
      const minutes = match[2] || '00';
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      times.push(`${String(hours).padStart(2, '0')}:${minutes}:00`);
    }

    if (times.length >= 2) {
      info.startTime = times[0];
      info.endTime = times[1];
    } else if (times.length === 1) {
      info.startTime = times[0];
      
      const durationMatch = text.match(/(\d+)\s*(?:hours?|hrs)/i);
      if (durationMatch) {
        const [hours, minutes] = info.startTime.split(':').map(Number);
        const duration = parseInt(durationMatch[1]);
        const endHours = hours + duration;
        info.endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      }
    }

    return info;
  };

  const mergeBookingInfo = (newInfo: Partial<BookingInfo>) => {
    bookingInfoRef.current = {
      ...bookingInfoRef.current,
      ...newInfo
    };
    return bookingInfoRef.current;
  };

  const hasCompleteInfo = (info: BookingInfo): boolean => {
    return !!(info.userName && info.date && info.startTime && info.endTime);
  };

  const suggestRoom = (info: BookingInfo) => {
    let suitable = [...rooms];
    
    if (info.capacity) {
      suitable = suitable.filter(r => r.capacity >= info.capacity);
    }
    
    if (suitable.length === 0) suitable = rooms;
    
    return suitable.sort((a, b) => a.baseHourlyRate - b.baseHourlyRate)[0];
  };

  const calculatePrice = (roomId: string, startTime: string, endTime: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 0;

    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    const duration = endHour - startHour;

    return room.baseHourlyRate * duration;
  };

  const executeBooking = async (info: BookingInfo): Promise<void> => {
    console.log('🎯 EXECUTING BOOKING:', info);
    
    try {
      setIsBooking(true);

      if (!info.roomId) {
        const suggested = suggestRoom(info);
        info.roomId = suggested.id;
      }

      const room = rooms.find(r => r.id === info.roomId);
      
      const startDateTime = `${info.date}T${info.startTime}`;
      const endDateTime = `${info.date}T${info.endTime}`;

      const bookingPayload = {
        roomId: info.roomId,
        userName: info.userName!,
        startTime: new Date(startDateTime).toISOString(),
        endTime: new Date(endDateTime).toISOString()
      };

      console.log('📤 CALLING API:', bookingPayload);

      const result = await bookingsApi.create(bookingPayload);

      console.log('✅ BOOKING CREATED:', result);

      const successText = `Booking confirmed! Room ${room?.name} for ${info.userName} on ${info.date} from ${info.startTime.slice(0, 5)} to ${info.endTime.slice(0, 5)}. Total price is ${result.totalPrice} rupees.`;

      const successMsg: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `🎉 **BOOKING CONFIRMED!**

✅ **Booking ID:** \`${result.bookingId}\`
🏢 **Room:** ${room?.name}
👤 **Name:** ${info.userName}
📅 **Date:** ${info.date}
🕐 **Time:** ${info.startTime.slice(0, 5)} - ${info.endTime.slice(0, 5)}
💰 **Total Price:** ₹${result.totalPrice}

**Status:** ${result.status}

Your booking is confirmed! Check "My Bookings" to manage it. 🎊`,
        timestamp: new Date(),
        bookingData: result
      };

      setMessages(prev => [...prev, successMsg]);

      // Speak confirmation if auto-speak is on
      if (autoSpeak) {
        speak(successText);
      }

      if (onBookingSuccess) {
        onBookingSuccess(result);
      }

      bookingInfoRef.current = {};

    } catch (error: any) {
      console.error('❌ BOOKING FAILED:', error);
      
      const errorText = `Booking failed. ${error.response?.data?.error || error.message}`;
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ **Booking Failed**

**Error:** ${error.response?.data?.error || error.message}

Let me help you fix this! What would you like to adjust? 💪`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);

      if (autoSpeak) {
        speak(errorText);
      }
    } finally {
      setIsBooking(false);
    }
  };

  const getGeminiResponse = async (userMessage: string, bookingInfo: BookingInfo): Promise<string> => {
    try {
      console.log('🤖 Using gemini-2.0-flash model');

      const contextPrompt = `You are an AI booking assistant that helps users book meeting rooms.

${getRoomContext()}

**Current booking information collected:**
${Object.keys(bookingInfo).length > 0 ? JSON.stringify(bookingInfo, null, 2) : 'None yet'}

**Recent conversation:**
${messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

User's message: "${userMessage}"

**Your role:**
1. Help users find suitable rooms based on their needs
2. Answer questions about rooms, pricing, policies, amenities
3. Extract booking details naturally
4. When you have all info (name, date, start/end time), prepare for confirmation
5. Be conversational, friendly, and concise

**Important:**
- Keep responses under 100 words (user sees character limits)
- Guide users to provide: name, room/capacity, date, time
- Answer questions intelligently
- Be brief and helpful

Respond naturally:`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCBDJsqgohGLi6R2c7X3IXE6tozlYcO5-4`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: contextPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300, // Reduced for brevity
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (aiResponse?.trim()) {
          console.log('✅ Gemini response received');
          return aiResponse.trim();
        }
      }

      throw new Error('No response from Gemini');
    } catch (error) {
      console.error('Gemini error:', error);
      return getSmartFallback(userMessage, bookingInfo);
    }
  };

  const getSmartFallback = (message: string, info: BookingInfo): string => {
    const msgLower = message.toLowerCase();
    
    const missing = [];
    if (!info.userName) missing.push('name');
    if (!info.date) missing.push('date');
    if (!info.startTime) missing.push('start time');
    if (!info.endTime) missing.push('end time');

    if (msgLower.match(/\b(price|cost|rate)\b/)) {
      const sorted = [...rooms].sort((a, b) => a.baseHourlyRate - b.baseHourlyRate);
      return `💰 Prices range from ₹${sorted[0].baseHourlyRate}/hr (${sorted[0].name}) to ₹${sorted[sorted.length-1].baseHourlyRate}/hr (${sorted[sorted.length-1].name}). Peak hours 1.5×. What fits your budget?`;
    }

    if (msgLower.match(/\b(capacity|people)\b/)) {
      return `👥 Our rooms fit ${Math.min(...rooms.map(r => r.capacity))}-${Math.max(...rooms.map(r => r.capacity))} people. How many are you?`;
    }

    if (msgLower.match(/\b(available|rooms)\b/)) {
      return `🏢 ${rooms.length} rooms available: ${rooms.slice(0, 3).map(r => r.name).join(', ')}${rooms.length > 3 ? ', etc.' : ''}. Which interests you?`;
    }

    if (missing.length > 0) {
      return `📝 I need: ${missing.join(', ')}. Example: "Book Cabin 1 for John on Nov 18 from 2PM to 4PM"`;
    }

    return '🤔 I can help with room info, pricing, or booking! What do you need?';
  };

  const handleUserMessage = async (userMessage: string) => {
    console.log('💬 Processing:', userMessage);

    const extracted = extractBookingInfo(userMessage);
    const currentInfo = mergeBookingInfo(extracted);

    const isConfirmation = /\b(yes|confirm|book it|proceed|go ahead|sure)\b/i.test(userMessage);

    if (currentInfo.awaitingConfirmation && isConfirmation) {
      console.log('✅ CONFIRMED - BOOKING NOW');
      await executeBooking(currentInfo);
      return;
    }

    if (hasCompleteInfo(currentInfo) && !currentInfo.awaitingConfirmation) {
      const room = currentInfo.roomId ? 
        rooms.find(r => r.id === currentInfo.roomId) : 
        suggestRoom(currentInfo);

      const price = calculatePrice(room!.id, currentInfo.startTime!, currentInfo.endTime!);

      bookingInfoRef.current.awaitingConfirmation = true;

      return `✅ **Ready to book:**

🏢 ${room?.name}
👤 ${currentInfo.userName}
📅 ${currentInfo.date}
🕐 ${currentInfo.startTime?.slice(0, 5)} - ${currentInfo.endTime?.slice(0, 5)}
💰 ₹${price}

**Say "confirm" to book!** 🎯`;
    }

    return await getGeminiResponse(userMessage, currentInfo);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isBooking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await handleUserMessage(currentInput);
      
      if (response) {
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          setIsTyping(false);

          // Auto-speak if enabled
          if (autoSpeak) {
            // Extract just text without markdown/emojis for cleaner speech
            const textToSpeak = response
              .replace(/[*_#]/g, '')
              .replace(/\n/g, '. ')
              .replace(/[🎯💰👤📅🕐🏢✅📝🤔]/g, '');
            speak(textToSpeak);
          }
        }, 600);
      } else {
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_INPUT_LENGTH) {
      setInput(value);
    }
  };

  const remainingChars = MAX_INPUT_LENGTH - input.length;

  const quickExamples = [
    'What rooms are available?',
    'Show me prices',
    'Book for 8 people tomorrow'
  ];

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-container">
        <div className="ai-assistant-header">
          <div className="ai-assistant-header-content">
            <div className="ai-assistant-avatar">
              {isListening ? '🎤︎︎' : isSpeaking ? '🔊' : '🤖'}
            </div>
            <div>
              <h3 className="ai-assistant-title">AI Booking Assistant</h3>
              <p className="ai-assistant-subtitle">
                {isListening ? 'Listening... 🎤︎︎' : 
                 isSpeaking ? 'Speaking... 🔊' :
                 'Voice + Text powered by Gemini ✨'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {voiceEnabled && (
              <button 
                className={`voice-toggle-btn ${autoSpeak ? 'active' : ''}`}
                onClick={() => setAutoSpeak(!autoSpeak)}
                title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
              >
                {autoSpeak ? '🔊' : '🔇'}
              </button>
            )}
            <button className="ai-assistant-close" onClick={onClose}>×</button>
          </div>
        </div>

        {messages.length <= 2 && (
          <div className="quick-questions">
            <p className="quick-questions-title">Quick start:</p>
            <div className="quick-questions-grid">
              {quickExamples.map((example, i) => (
                <button
                  key={i}
                  className="quick-question-btn"
                  onClick={() => setInput(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ai-assistant-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message ${
                message.role === 'user' ? 'ai-message-user' : 
                message.role === 'system' ? 'ai-message-system' :
                'ai-message-assistant'
              }`}
            >
              <div className="ai-message-avatar">
                {message.role === 'user' ? '👤' : 
                 message.role === 'system' ? '✅' : '🤖'}
              </div>
              <div className="ai-message-content">
                <div className="ai-message-text">{message.content}</div>
                <div className="ai-message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {(isTyping || isBooking) && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-avatar">
                {isBooking ? '⚡' : '🤖'}
              </div>
              <div className="ai-message-content">
                {isBooking ? (
                  <div className="ai-message-text booking-in-progress">
                    ⚡ Creating your booking...
                  </div>
                ) : (
                  <div className="ai-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-assistant-input-container">
          <input
            type="text"
            className="ai-assistant-input"
            placeholder={isListening ? "Listening..." : "Type or click 🎤︎︎︎︎to speak..."}
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading || isBooking || isListening}
            maxLength={MAX_INPUT_LENGTH}
          />
          
          <div className="char-counter" style={{ 
            color: remainingChars < 50 ? '#ef4444' : remainingChars < 100 ? '#f59e0b' : 'rgba(255,255,255,0.6)',
            fontSize: '0.75rem',
            position: 'absolute',
            bottom: '1rem',
            right: voiceEnabled ? '120px' : '70px'
          }}>
            {remainingChars}
          </div>

          {voiceEnabled && (
            <button
              className={`voice-input-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading || isBooking}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? '⏹️' : '🎤︎︎︎︎'}
            </button>
          )}

          {isSpeaking && (
            <button
              className="voice-stop-btn"
              onClick={stopSpeaking}
              title="Stop speaking"
            >
              🔇
            </button>
          )}

          <button
            className="ai-assistant-send"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isBooking}
          >
            {isLoading || isBooking ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
};

