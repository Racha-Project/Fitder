import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "สวัสดีครับ! ผมคือ AI Coach จาก Fitder มีอะไรให้ผมช่วยแนะนำเรื่องการออกกำลังกายหรือการใช้งานระบบไหมครับ?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Mock AI Response Logic
    setTimeout(() => {
      const botResponse = getMockResponse(input);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const getMockResponse = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("จอง") || lowerText.includes("booking")) {
      return "คุณสามารถจองเวลาได้ที่เมนู 'Matches' โดยเลือกเทรนเนอร์ที่สนใจแล้วกดปุ่ม 'Book Session' ครับ";
    }
    if (lowerText.includes("ราคา") || lowerText.includes("แพง")) {
      return "ราคาของแต่ละเซสชันจะขึ้นอยู่กับเทรนเนอร์แต่ละท่านกำหนดครับ คุณสามารถดูราคาได้ที่หน้าโปรไฟล์ของเทรนเนอร์ครับ";
    }
    if (lowerText.includes("ท่า") || lowerText.includes("ออกกำลัง")) {
      return "เรามีฟีเจอร์ AI Tracking ที่ช่วยตรวจสอบท่าทางของคุณได้ที่เมนู 'AI Tracking' นะครับ ลองใช้งานดูได้เลย!";
    }
    if (lowerText.includes("สวัสดี") || lowerText.includes("หวัดดี")) {
      return "สวัสดีครับ! ยินดีที่ได้รู้จัก มีคำถามอะไรเกี่ยวกับสุขภาพหรือการใช้งานแอปไหมครับ?";
    }
    return "ขออภัยครับ ผมยังไม่ค่อยเข้าใจคำถามนี้เท่าไหร่ แต่คุณสามารถสอบถามเรื่องการจองเทรนเนอร์ การใช้งาน AI Tracking หรือการตั้งค่าโปรไฟล์ได้นะครับ";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "flex flex-col border-border bg-card shadow-2xl transition-all duration-300 ease-in-out",
          isMinimized ? "h-14 w-64" : "h-[500px] w-[350px] sm:w-[400px]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-gradient-primary p-3 text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Fitder AI Assistant</span>
                {!isMinimized && <span className="text-[10px] opacity-80">Online | พร้อมช่วยเหลือ</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/10"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-hidden p-4">
                <ScrollArea className="h-full pr-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex w-full items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                          msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <Avatar className="h-8 w-8 border border-border/50">
                          {msg.role === "bot" ? (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </Avatar>
                        <div className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                          msg.role === "user" 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-muted text-foreground rounded-tl-none"
                        )}>
                          {msg.content}
                          <div className={cn(
                            "mt-1 text-[9px] opacity-50",
                            msg.role === "user" ? "text-right" : "text-left"
                          )}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 border border-border/50">
                          <div className="flex h-full w-full items-center justify-center bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        </Avatar>
                        <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2 text-sm shadow-sm">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Input Area */}
              <div className="border-t p-3 bg-muted/30">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input 
                    placeholder="พิมพ์ข้อความที่นี่..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-background"
                    disabled={isTyping}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="shrink-0 bg-gradient-primary"
                    disabled={!input.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-gradient-primary shadow-lg transition-transform hover:scale-110 active:scale-95"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-7 w-7 text-white" />
        </Button>
      )}
    </div>
  );
}
