import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  Loader2,
  Briefcase,
  Calendar,
  FileCheck,
  DollarSign,
  Download,
  Eye,
  Bell,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const MessagesPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [websocket, setWebsocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const API_BASE_URL = 'http://127.0.0.1:8000';

  // Fetch current user and initialize WebSocket
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data);
        
        // Initialize WebSocket
        initWebSocket(response.data.id);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
    fetchThreads();
    fetchUnreadCount();

    return () => {
      if (websocket) {
        websocket.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Initialize WebSocket connection
  const initWebSocket = (userId) => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/${userId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        handleNewMessage(data.message);
      } else if (data.type === 'typing') {
        handleTypingIndicator(data);
      } else if (data.type === 'message_read') {
        handleMessageRead(data);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    setWebsocket(ws);
  };

  // Handle incoming real-time messages
  const handleNewMessage = (message) => {
    // If message is in current conversation, add it
    if (activeThread && 
        (message.sender_id === activeThread.other_user_id || 
         message.receiver_id === activeThread.other_user_id)) {
      setMessages(prev => [...prev, {
        id: message.id,
        sender_id: message.sender_id,
        sender_name: message.sender_name,
        sender_type: message.sender_id === currentUser.id ? 'user' : 'company',
        content: message.content,
        timestamp: formatTime(new Date(message.created_at)),
        is_read: message.is_read,
        is_own_message: message.sender_id === currentUser.id,
        is_system: false,
        attachments: []
      }]);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    
    // Update threads
    fetchThreads();
    fetchUnreadCount();
    
    // Show notification for new messages not in current conversation
    if (!activeThread || message.sender_id !== activeThread.other_user_id) {
      toast.success(`New message from ${message.sender_name}`, {
        icon: '💬',
        duration: 4000,
        position: 'bottom-right'
      });
    }
  };

  // Handle typing indicator
  const handleTypingIndicator = (data) => {
    if (activeThread && data.user_id === activeThread.other_user_id) {
      setIsTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };

  // Handle message read receipts
  const handleMessageRead = (data) => {
    setMessages(prev => 
      prev.map(msg => 
        data.message_ids.includes(msg.id) ? { ...msg, is_read: true } : msg
      )
    );
  };

  // Fetch message threads
  const fetchThreads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/messages/threads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setThreads(response.data);
      
      // Set active thread if userId param exists
      if (userId && response.data.length > 0) {
        const thread = response.data.find(t => t.other_user_id.toString() === userId);
        if (thread) {
          setActiveThread(thread);
          fetchMessages(thread.other_user_id);
        }
      } else if (response.data.length > 0 && !activeThread) {
        // Set first thread as active by default
        setActiveThread(response.data[0]);
        fetchMessages(response.data[0].other_user_id);
      }
      
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (otherUserId, page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/messages/conversation/${otherUserId}?page=${page}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const formattedMessages = response.data.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        sender_type: msg.sender_id === currentUser?.id ? 'user' : 'company',
        content: msg.content,
        timestamp: formatTime(new Date(msg.created_at)),
        is_read: msg.is_read,
        is_own_message: msg.sender_id === currentUser?.id,
        is_system: false,
        attachments: []
      }));
      
      setMessages(formattedMessages);
      
      // Mark messages as read via WebSocket
      const unreadMessages = formattedMessages.filter(msg => !msg.is_own_message && !msg.is_read);
      if (unreadMessages.length > 0 && websocket) {
        websocket.send(JSON.stringify({
          type: 'mark_read',
          message_ids: unreadMessages.map(msg => msg.id),
          conversation_id: otherUserId
        }));
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread || !currentUser) return;
    
    setSending(true);
    
    // Send typing indicator
    if (websocket) {
      websocket.send(JSON.stringify({
        type: 'typing',
        user_id: currentUser.id,
        conversation_id: activeThread.other_user_id,
        is_typing: true
      }));
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/messages/send`,
        {
          receiver_id: activeThread.other_user_id,
          content: newMessage,
          job_id: activeThread.job_id || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add message to local state immediately
      const newMessageObj = {
        id: response.data.id,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name || 'You',
        sender_type: 'user',
        content: newMessage,
        timestamp: 'Just now',
        is_read: true,
        is_own_message: true,
        is_system: false,
        attachments: [...attachments]
      };
      
      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage('');
      setAttachments([]);
      
      // Stop typing indicator
      if (websocket) {
        websocket.send(JSON.stringify({
          type: 'typing',
          user_id: currentUser.id,
          conversation_id: activeThread.other_user_id,
          is_typing: false
        }));
      }
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      toast.success('Message sent!');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle thread click
  const handleThreadClick = (thread) => {
    setActiveThread(thread);
    fetchMessages(thread.other_user_id);
    
    // Update URL without reload
    navigate(`/messages/${thread.other_user_id}`, { replace: true });
    
    // Mark as read
    setThreads(prev => prev.map(t => 
      t.other_user_id === thread.other_user_id ? { ...t, unread_count: 0 } : t
    ));
    
    fetchUnreadCount();
  };

  // Handle file attachment
  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      file: file,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file)
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    toast.success(`${files.length} file(s) attached`);
  };

  // Handle typing
  const handleTyping = () => {
    if (websocket && activeThread && currentUser) {
      websocket.send(JSON.stringify({
        type: 'typing',
        user_id: currentUser.id,
        conversation_id: activeThread.other_user_id,
        is_typing: true
      }));
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        if (websocket) {
          websocket.send(JSON.stringify({
            type: 'typing',
            user_id: currentUser.id,
            conversation_id: activeThread.other_user_id,
            is_typing: false
          }));
        }
      }, 3000);
    }
  };

  // Filter threads based on search
  const filteredThreads = threads.filter(thread =>
    thread.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.job_title && thread.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Render message content
  const renderMessageContent = (message) => {
    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mt-3">
            {message.attachments.map(attachment => (
              <div key={attachment.id} className="border rounded-lg p-3 bg-gray-50">
                {attachment.type === 'link' ? (
                  <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">{attachment.title}</span>
                    {attachment.description && (
                      <span className="text-sm text-gray-600">- {attachment.description}</span>
                    )}
                  </a>
                ) : attachment.type === 'file' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">{attachment.name}</span>
                      <span className="text-sm text-gray-500">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button 
                      onClick={() => window.open(attachment.url, '_blank')}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Threads List */}
        <div className={`md:w-1/3 ${activeThread ? 'hidden md:block' : 'w-full'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button 
                  onClick={fetchThreads}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Refresh"
                >
                  <Loader2 className="w-4 h-4" />
                </button>
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
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
                      key={thread.other_user_id}
                      onClick={() => handleThreadClick(thread)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        activeThread?.other_user_id === thread.other_user_id 
                          ? 'bg-primary-50 border-l-4 border-primary-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            thread.unread_count > 0 ? 'bg-primary-100' : 'bg-gray-100'
                          }`}>
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
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {thread.job_title}
                              </span>
                            )}
                            
                            {thread.unread_count > 0 && (
                              <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
                                {thread.unread_count} new
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
                      onClick={() => {
                        setActiveThread(null);
                        navigate('/messages');
                      }}
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
                        <div className="flex items-center gap-2">
                          {activeThread.job_title && (
                            <>
                              <span className="text-sm text-gray-600">{activeThread.job_title}</span>
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            </>
                          )}
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Active now
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => toast.success('Call feature coming soon!')}
                    >
                      <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => toast.success('Video call feature coming soon!')}
                    >
                      <Video className="w-5 h-5 text-gray-600" />
                    </button>
                    {activeThread.job_id && (
                      <Link to={`/contracts/new?job_id=${activeThread.job_id}&client_id=${activeThread.other_user_id}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <FileCheck className="w-5 h-5 text-gray-600" />
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-6">
                  {/* Project Info Card */}
                  {activeThread.job_title && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-md mx-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-primary-600" />
                        <span className="font-medium text-gray-900">{activeThread.job_title}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Click the document icon above to create a contract for this project
                      </div>
                    </div>
                  )}
                  
                  {/* Messages */}
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No messages yet</p>
                      <p className="text-gray-500 text-sm">
                        Start the conversation by sending a message
                      </p>
                    </div>
                  ) : (
                    messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_own_message ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${message.is_own_message ? 'order-2' : 'order-1'}`}>
                          {/* Sender Name for non-own messages */}
                          {!message.is_own_message && !message.is_system && (
                            <div className="flex items-center gap-2 mb-1 ml-1">
                              <span className="text-xs font-medium text-gray-700">
                                {message.sender_name}
                              </span>
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              message.is_own_message
                                ? 'bg-primary-600 text-white rounded-br-none'
                                : message.is_system
                                ? 'bg-gray-100 text-gray-600 text-center'
                                : 'bg-white border border-gray-200 rounded-bl-none'
                            } shadow-sm`}
                          >
                            {renderMessageContent(message)}
                          </div>
                          
                          {/* Message Footer */}
                          <div className={`flex items-center text-xs mt-1 ${
                            message.is_own_message ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className={`${
                              message.is_own_message ? 'text-gray-300' : 'text-gray-400'
                            }`}>
                              {message.timestamp}
                            </span>
                            {message.is_own_message && (
                              <span className="ml-2 flex items-center gap-1">
                                {message.is_read ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-primary-300" />
                                    <span className="text-gray-400">Read</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-gray-400">Sent</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[75%]">
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-sm text-gray-500">{activeThread.other_user_name} is typing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-100">
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Attachments ({attachments.length})
                      </span>
                      <button 
                        onClick={() => setAttachments([])}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                          {attachment.type === 'image' ? (
                            <ImageIcon className="w-4 h-4 text-primary-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="text-sm truncate max-w-[150px]">{attachment.name}</span>
                          <button 
                            onClick={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  {/* Attachment Buttons */}
                  <div className="flex items-center space-x-1">
                    <label className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileAttach}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      />
                      <Paperclip className="w-5 h-5 text-gray-600" />
                    </label>
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => toast.success('Image upload coming soon!')}
                    >
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      rows="1"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>
                  
                  {/* Send Button */}
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <div className="text-center max-w-md">
                <MessageSquare className="w-24 h-24 text-gray-300 mb-6 mx-auto" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Your Messages</h3>
                <p className="text-gray-600 mb-8">
                  Select a conversation from the list to start messaging with clients and companies.
                  Discuss project details, share files, and collaborate effectively.
                </p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <p className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Real-time messaging with WebSocket
                  </p>
                  <p>📱 Works on all devices</p>
                  <p>💬 Instant notifications</p>
                  <p>🔒 Secure and private</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;