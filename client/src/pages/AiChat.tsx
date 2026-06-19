// client/src/pages/AiChat.tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface AiChatProps {
  isDarkMode: boolean;
  // ➕ أضفنا هذا التمرير لتمكين الشات من تغيير الصفحة الحالية في النظام مباشرة عند الضغط على الرابط
  onNavigate?: (view: 'hub' | 'fleet' | 'reports' | 'profile' | 'ai_chat') => void;
}

export const AiChat: React.FC<AiChatProps> = ({ isDarkMode, onNavigate }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { 
      role: 'model', 
      text: 'مرحباً بك في نظام مساعد الموقع الذكي. اكتب استفسارك هنا لمساعدتك في حصر الأعطال، مراجعة حالة المعدات، وتلخيص تكاليف المشتريات فورياً بأسلوب مبسط.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // دالة لتنظيف أي نجوم مكررة أو مشوهة قد يرسلها النموذج في القوائم والنصوص
  const cleanMarkdownText = (rawText: string) => {
    return rawText
      .replace(/\*\*\*+/g, '**') // تنظيف الثلاث نجوم المتتالية وتحويلها لنجمتين
      .replace(/(\r\n|\n|\r)/gm, "\n"); // توحيد السطور الجديدة
  };

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

  // معالج الضغط على الروابط الداخلية الموجهة للصفحات الأخرى
  const handleInternalLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (onNavigate) {
      if (href.includes('reports')) {
        e.preventDefault();
        onNavigate('reports');
      } else if (href.includes('fleet')) {
        e.preventDefault();
        onNavigate('fleet');
      } else if (href.includes('profile')) {
        e.preventDefault();
        onNavigate('profile');
      } else if (href.includes('hub')) {
        e.preventDefault();
        onNavigate('hub');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 box-border text-black font-sans" dir="rtl">
      
      {/* عنوان الصفحة البسيط والأنيق */}
      <div className={`p-3 border-2 border-solid rounded-xl flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-black text-black'}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h2 className="text-base font-black m-0">مساعد الموقع الذكي</h2>
        </div>
        <span className="text-xs font-black opacity-70">المحادثة الفورية</span>
      </div>

      {/* صندوق الشات الكبير والممتد */}
      <div className={`rounded-xl border-4 border-solid border-black overflow-hidden shadow-lg flex flex-col h-[70vh] ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        
        {/* منطقة الرسائل الفسيحة والمريحة للعين */}
        <div className={`flex-1 p-4 md:p-6 overflow-y-auto space-y-4 box-border text-sm leading-relaxed ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-xl border-2 border-solid shadow-sm font-medium text-sm prose prose-sm max-w-none ${msg.role === 'user' ? 'bg-blue-900 text-white border-blue-950 rounded-bl-none' : 'bg-amber-100 text-black border-black rounded-br-none'}`}>
                
                {/* 🎯 تعديل هندسي: استخدام المكون المطور لعرض النصوص بدون نجوم وتحويل الروابط لأزرار قابلة للضغط */}
                <ReactMarkdown
                  components={{
                    // تحويل النجوم إلى نصوص عريضة نظيفة
                    strong: ({node, ...props}) => <span className="font-black text-blue-950 block my-1 underline decoration-double" {...props} />,
                    // تحويل الروابط النصية إلى روابط تفاعلية ملونة وقابلة للنقر الفوري
                    a: ({node, href, ...props}) => (
                      <a 
                        href={href} 
                        onClick={(e) => handleInternalLinkClick(e, href || '')}
                        className="inline-block bg-blue-950 text-white font-black px-2.5 py-1 rounded text-xs mx-1 my-0.5 border border-solid border-black cursor-pointer hover:bg-blue-900 transition-colors no-underline shadow-sm animate-pulse"
                        {...props} 
                      />
                    ),
                    // تنظيف القوائم المنقطة والمترابطة
                    li: ({node, ...props}) => <li className="list-disc list-inside my-1.5 font-bold pr-1 text-right" {...props} />,
                    p: ({node, ...props}) => <p className="m-0 p-0 leading-relaxed font-semibold inline" {...props} />
                  }}
                >
                  {cleanMarkdownText(msg.text)}
                </ReactMarkdown>

              </div>
            </div>
          ))}
          
          {/* حالة الانتظار البسيطة */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-2.5 px-4 rounded-xl text-xs font-black bg-blue-50 border-2 border-solid border-blue-900 text-blue-900 animate-pulse flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-900 animate-bounce"></span>
                <span>يكتب الآن...</span>
              </div>
            </div>
          )}
        </div>

        {/* مدخل النص العريض أسفل الشاشة */}
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
