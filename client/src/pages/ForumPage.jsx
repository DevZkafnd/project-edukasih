import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Send, MessageSquare, User, CornerUpLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ForumPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [replyTarget, setReplyTarget] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!authLoading && !user) {
        navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get('/api/messages');
      setMessages(response.data);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(fetchMessages, 0);
    const interval = setInterval(fetchMessages, 5000);
    return () => {
      clearTimeout(id);
      clearInterval(interval);
    };
  }, [fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post('/api/messages', {
        pengirim_id: user.id, // Using user.id from AuthContext
        isi: newMessage,
        reply_to: replyTarget?._id || null
      });
      setNewMessage('');
      setReplyTarget(null);
      fetchMessages(); // Refresh immediately
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (authLoading || loading) return <div className="p-10 text-center">Memuat Forum...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="bg-brand-blue/10 p-2 rounded-full">
          <MessageSquare className="text-brand-blue" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Forum Diskusi Kelas</h1>
          <p className="text-xs text-gray-500">Ruang komunikasi Orang Tua & Guru</p>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = user?.id === msg.pengirim;
          const isGuru = msg.role_pengirim === 'guru';

          return (
            <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar/Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isGuru ? 'bg-brand-blue text-white' : 'bg-gray-300 text-gray-600'}`}>
                   {isGuru ? <User size={16} /> : <span className="text-xs font-bold">{msg.nama_pengirim.charAt(0)}</span>}
                </div>

                {/* Bubble */}
                <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                  isMe 
                    ? 'bg-brand-blue text-white rounded-br-none' 
                    : isGuru 
                      ? 'bg-blue-50 border border-blue-200 text-gray-800 rounded-bl-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                }`}>
                  {!isMe && (
                    <p className={`text-xs font-bold mb-1 ${isGuru ? 'text-brand-blue' : 'text-orange-600'}`}>
                      {msg.nama_pengirim} {isGuru && '(Guru)'}
                    </p>
                  )}
                  {msg.reply_to && (
                    <div className={`mb-2 rounded-xl p-3 ${isMe ? 'bg-white/10 border border-white/30' : 'bg-blue-50 border border-brand-blue/20'}`}>
                      <div className="flex items-center gap-2 text-[11px] font-semibold">
                        <CornerUpLeft size={12} className={isMe ? 'text-white' : 'text-brand-blue'} />
                        <span className={isMe ? 'text-white' : 'text-brand-blue'}>Membalas {msg.reply_to.nama_pengirim}</span>
                      </div>
                      <p className={`mt-1 text-xs ${isMe ? 'text-white/80' : 'text-gray-700'}`}>
                        {msg.reply_to.isi.length > 100 ? msg.reply_to.isi.slice(0, 100) + '…' : msg.reply_to.isi}
                      </p>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.isi}</p>
                </div>
              </div>
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-2`}>
                <button
                  className="mt-1 text-[10px] text-gray-400 hover:text-brand-blue flex items-center gap-1"
                  onClick={() => setReplyTarget(msg)}
                >
                  <CornerUpLeft size={12} /> Balas
                </button>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-2">
                {new Date(msg.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          {replyTarget && (
            <div className="mb-3 rounded-xl border border-brand-blue/30 bg-blue-50 p-3">
              <div className="flex items-start justify-between">
                <div className="text-xs">
                  <div className="flex items-center gap-2 font-semibold text-brand-blue">
                    <CornerUpLeft size={12} />
                    <span>Membalas {replyTarget.nama_pengirim}</span>
                  </div>
                  <p className="text-gray-700 mt-1">
                    {replyTarget.isi.length > 140 ? replyTarget.isi.slice(0, 140) + '…' : replyTarget.isi}
                  </p>
                </div>
                <button className="p-1 text-gray-500 hover:text-gray-700" onClick={() => setReplyTarget(null)} aria-label="Batal balas">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tulis pesan..."
            className="flex-1 border border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-brand-blue text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={20} />
          </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;
