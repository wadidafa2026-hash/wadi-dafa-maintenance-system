// client/src/pages/AiChat.tsx
import React, { useState } from 'react';

interface AiChatProps {
  isDarkMode: boolean;
}

export const AiChat: React.FC<AiChatProps> = ({ isDarkMode }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'مرحباً بك يا هندسة في الصفحة المستقلة للمستشار الذكي (وادي دفا). اكتب سؤالك هنا لتحليل الأعطال أو المشتريات حياً من قاعدة البيانات.' }
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
        setMessages(prev => [...prev, { role: 'model', text: 'عذراً يا هندسة، حدث خطأ في معالجة البيانات بالسيرفر.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'فشل الاتصال بخادم الذكاء الاصطناعي.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 box-border text-black font-sans" dir="rtl">
      
      {/* هيدر الصفحة المستقلة */}
      <div className="p-5 rounded-xl border-4 border-solid border-black bg-black text-white flex justify-between items-center shadow-md">
        <div>
          <h2 className="text-xl font-black m-0 text-white">🤖 المستشار الفني والمحلل الذكي للنظام</h2>
          <p className="text-xs font-black text-amber-400 m-0 mt-1">صفحة كاملة مخصصة لاستخراج الإحصائيات وصياغة تقارير حصر الأعطال</p>
        </div>
        <span className="text-xs font-black bg-blue-900 px-3 py-1 rounded border-2 border-solid border-white uppercase">Gemini 1.5 Flash</span>
      </div>

      {/* صندوق الشات الكبير وممتد القامة */}
      <div className="rounded-xl border-4 border-solid border-black overflow-hidden bg-white shadow-lg flex flex-col h-[60vh]">
        
        {/* منطقة الرسائل الفسيحة */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50 box-border text-sm leading-relaxed">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-xl border-2 border-solid border-black shadow-sm font-black text-sm ${msg.role === 'user' ? 'bg-blue-900 text-white border-blue-950 rounded-bl-none' : 'bg-amber-100 text-black border-black rounded-br-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-lg text-xs font-black bg-slate-200 border-2 border-solid border-black text-black animate-pulse">
                ⚙️ جاري مراجعة سجلات قاعدة البيانات والتحليل الفوري...
              </div>
            </div>
          )}
        </div>

        {/* مدخل النص العريض أسفل الصفحة */}
        <form onSubmit={handleSendMessage} className="p-4 border-t-4 border-solid border-black bg-white flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اسأل عن أي شيء (مثال: اكتب لي تقريراً كاملاً عن المركبات والمعدات المعطلة هذا الشهر)..."
            className="flex-1 px-4 py-3 text-sm font-black rounded border-2 border-solid border-black bg-white text-black outline-none focus:border-blue-900 shadow-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-black hover:bg-slate-900 text-white border-2 border-solid border-black px-6 py-3 rounded-lg text-sm font-black cursor-pointer transition-all active:scale-95 shrink-0 shadow-md"
          >
            إرسال الأمر
          </button>
        </form>

      </div>
    </div>
  );
};
