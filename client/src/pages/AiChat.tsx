// client/src/pages/AiChat.tsx
import React, { useState } from 'react';

interface AiChatProps {
  isDarkMode: boolean;
}

export const AiChat: React.FC<AiChatProps> = ({ isDarkMode }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'مرحباً بك في نظام مساعد الموقع الذكي. اكتب استفسارك هنا لمساعدتك في حصر الأعطال، مراجعة حالة المعدات، وتلخيص تكاليف المشتريات فورياً بأسلوب مبسط.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/maintenance/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, currentView: 'ai_chat_page' }),
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'عذراً، حدث خطأ في معالجة طلبك حالياً. يرجى المحاولة مرة أخرى.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'عذراً، تعذر الاتصال بالمساعد الذكي في الوقت الحالي.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 box-border text-black font-sans" dir="rtl">
      
      {/* عنوان الصفحة البسيط والأنيق بديل الصندوق الأسود الكبير */}
      <div className={`p-3 border-2 border-solid rounded-xl flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-black text-black'}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h2 className="text-base font-black m-0">مساعد الموقع الذكي</h2>
        </div>
        <span className="text-xs font-black opacity-70">المحادثة الفورية</span>
      </div>

      {/* صندوق الشات الكبير والممتد بشكل كامل */}
      <div className={`rounded-xl border-4 border-solid border-black overflow-hidden shadow-lg flex flex-col h-[70vh] ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        
        {/* منطقة الرسائل الفسيحة والمريحة للعين */}
        <div className={`flex-1 p-4 md:p-6 overflow-y-auto space-y-4 box-border text-sm leading-relaxed ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-xl border-2 border-solid shadow-sm font-black text-sm ${msg.role === 'user' ? 'bg-blue-900 text-white border-blue-950 rounded-bl-none' : 'bg-amber-100 text-black border-black rounded-br-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {/* حالة الانتظار البسيطة والمفهومة لكل الموظفين */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-2.5 px-4 rounded-xl text-xs font-black bg-blue-50 border-2 border-solid border-blue-900 text-blue-900 animate-pulse flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-900 animate-bounce"></span>
                <span>يكتب الآن...</span>
              </div>
            </div>
          )}
        </div>

        {/* مدخل النص العريض أسفل الشاشة والأزرار الاحترافية */}
        <form onSubmit={handleSendMessage} className={`p-3 border-t-4 border-solid border-black flex gap-2 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب استفسارك هنا (مثال: ما هي المعدات المعطلة حالياً؟)..."
            className="flex-1 px-3 py-3 text-sm font-black rounded border-2 border-solid border-black bg-white text-black outline-none focus:border-blue-900 shadow-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-black hover:bg-slate-900 text-white border-2 border-solid border-black px-5 py-3 rounded-lg text-sm font-black cursor-pointer transition-all active:scale-95 shrink-0 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إرسال الأمر
          </button>
        </form>

      </div>
    </div>
  );
};
