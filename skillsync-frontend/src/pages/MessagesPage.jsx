import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Clock,
  CheckCircle,
  User,
  ChevronLeft,
  Image as ImageIcon,
  FileText,
  Smile,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const MessagesPage = () => {
  const { userId } = useParams();
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch message threads
  const fetchThreads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/messages/threads', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch message threads');
      }
      
      const data = await response.json();
      setThreads(data);
      
      // If userId param exists, set it as active thread
      if (userId && data.length > 0) {
        const thread = data.find(t => t.other_user_id.toString() === userId);
        if (thread) {
          setActiveThread(thread);
          fetchMessages(thread.other_user_id);
        }
      }
      
    } catch (error) {
      console.error('Error fetching threads:', error);
      
      // Fallback mock data
      setThreads(mockThreads);
      if (userId) {
        const thread = mockThreads.find(t => t.id.toString() === userId);
        if (thread) {
          setActiveThread(thread);
          setMessages(mockMessages);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific thread
  const fetchMessages = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/messages/${otherUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages(mockMessages);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/messages/${activeThread.other_user_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          job_id: activeThread.job_id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Add message to local state
      const tempMessage = {
        id: Date.now(),
        sender_id: 1, // Current user ID from localStorage
        sender_name: 'You',
        content: newMessage,
        timestamp: 'Just now',
        is_read: true,
        is_own_message: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      toast.success('Message sent');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [userId]);

  const handleThreadClick = (thread) => {
    setActiveThread(thread);
    fetchMessages(thread.other_user_id);
  };

  const filteredThreads = threads.filter(thread =>
    thread.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.job_title && thread.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    return timestamp;
  };

  const mockThreads = [
    {
      id: 1,
      other_user_id: 101,
      other_user_name: 'TechCorp Inc.',
      other_user_avatar: null,
      last_message: 'Great! Looking forward to reviewing your proposal...',
      last_message_time: '2h ago',
      unread_count: 0,
      job_title: 'Full Stack Developer'
    },
    {
      id: 2,
      other_user_id: 102,
      other_user_name: 'DesignStudio',
      other_user_avatar: null,
      last_message: 'When can you start the interview?',
      last_message_time: '1d ago',
      unread_count: 2,
      job_title: 'UI/UX Designer'
    },
    {
      id: 3,
      other_user_id: 103,
      other_user_name: 'DataInsights Co.',
      other_user_avatar: null,
      last_message: 'Thanks for submitting the final report!',
      last_message_time: '3d ago',
      unread_count: 0,
      job_title: 'Python Data Analyst'
    }
  ];

  const mockMessages = [
    {
      id: 1,
      sender_id: 101,
      sender_name: 'TechCorp Inc.',
      content: 'Hi there! Thanks for your proposal on our e-commerce project.',
      timestamp: '10:30 AM',
      is_read: true,
      is_own_message: false
    },
    {
      id: 2,
      sender_id: 1,
      sender_name: 'You',
      content: 'Hello! I\'m very interested in this project. I have extensive experience with React and Node.js.',
      timestamp: '10:32 AM',
      is_read: true,
      is_own_message: true
    },
    {
      id: 3,
      sender_id: 101,
      sender_name: 'TechCorp Inc.',
      content: 'Great! Can you share some examples of your previous e-commerce work?',
      timestamp: '10:35 AM',
      is_read: true,
      is_own_message: false
    },
    {
      id: 4,
      sender_id: 1,
      sender_name: 'You',
      content: 'Absolutely! I\'ve sent you links to three e-commerce projects in my portfolio.',
      timestamp: '10:40 AM',
      is_read: true,
      is_own_message: true
    },
    {
      id: 5,
      sender_id: 101,
      sender_name: 'TechCorp Inc.',
      content: 'Excellent work! Looking forward to reviewing your proposal in detail.',
      timestamp: '10:45 AM',
      is_read: true,
      is_own_message: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Threads List */}
        <div className={`md:w-1/3 ${activeThread ? 'hidden md:block' : 'w-full'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                  {threads.length}
                </span>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            {/* Threads List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              ) : filteredThreads.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredThreads.map(thread => (
                    <div
                      key={thread.id}
                      onClick={() => handleThreadClick(thread)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        activeThread?.id === thread.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            {thread.other_user_avatar ? (
                              <img 
                                src={thread.other_user_avatar} 
                                alt={thread.other_user_name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <User className="w-5 h-5 text-primary-600" />
                            )}
                          </div>
                        </div>
                        
                        {/* Thread Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {thread.other_user_name}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {thread.last_message_time}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate mb-1">
                            {thread.last_message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            {thread.job_title && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                {thread.job_title}
                              </span>
                            )}
                            
                            {thread.unread_count > 0 && (
                              <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
                                {thread.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center mb-2">No conversations yet</p>
                  <p className="text-gray-400 text-sm text-center">
                    {searchQuery ? 'No conversations match your search' : 'Start a conversation by applying to jobs'}
                  </p>
                  {!searchQuery && (
                    <Link to="/find-work" className="mt-4">
                      <button className="btn-primary text-sm">
                        Browse Jobs
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Side - Messages */}
        <div className={`flex-1 ${!activeThread && 'hidden md:block'}`}>
          {activeThread ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button 
                      onClick={() => setActiveThread(null)}
                      className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {activeThread.other_user_name}
                        </h2>
                        {activeThread.job_title && (
                          <p className="text-sm text-gray-600">{activeThread.job_title}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Video className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Info className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_own_message ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${message.is_own_message ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            message.is_own_message
                              ? 'bg-primary-600 text-white rounded-br-none'
                              : 'bg-white border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          <p>{message.content}</p>
                        </div>
                        <div className={`flex items-center text-xs mt-1 ${
                          message.is_own_message ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={`${
                            message.is_own_message ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </span>
                          {message.is_own_message && (
                            <span className="ml-2">
                              {message.is_read ? (
                                <CheckCircle className="w-3 h-3 text-primary-600" />
                              ) : (
                                <Clock className="w-3 h-3 text-gray-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send • Shift + Enter for new line
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center p-6">
              <MessageSquare className="w-24 h-24 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h3>
              <p className="text-gray-600 text-center mb-6">
                Select a conversation from the list to start messaging
              </p>
              <div className="text-sm text-gray-500 text-center space-y-2">
                <p>💡 Keep your communication professional</p>
                <p>📝 Discuss project details and requirements clearly</p>
                <p>⏱️ Respond promptly to maintain good relationships</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Back Button */}
      {activeThread && (
        <button
          onClick={() => setActiveThread(null)}
          className="md:hidden fixed bottom-6 right-6 bg-white p-3 rounded-full shadow-lg border border-gray-200"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default MessagesPage;