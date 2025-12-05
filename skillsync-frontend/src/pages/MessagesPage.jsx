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
  Loader2,
  Briefcase,
  Calendar,
  FileCheck,
  DollarSign,
  Download,
  Eye
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
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);

  // Initialize with the conversation from the image
  useEffect(() => {
    // Set initial data based on the image content
    const initialThreads = [
      {
        id: 1,
        other_user_id: 101,
        other_user_name: 'TechCorp Inc.',
        other_user_avatar: null,
        last_message: 'Great! Looking forward to reviewing your pro...',
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

    const initialMessages = [
      {
        id: 1,
        sender_id: 101,
        sender_name: 'TechCorp Inc.',
        sender_type: 'company',
        content: 'Hi there! Thanks for your proposal on our e-commerce project.',
        timestamp: '10:30 AM',
        is_read: true,
        is_own_message: false,
        is_system: false,
        attachments: []
      },
      {
        id: 2,
        sender_id: 1,
        sender_name: 'You',
        sender_type: 'user',
        content: 'Hello! I\'m very interested in this project. I have extensive experience with React and Node.js.',
        timestamp: '10:32 AM',
        is_read: true,
        is_own_message: true,
        is_system: false,
        attachments: []
      },
      {
        id: 3,
        sender_id: 101,
        sender_name: 'TechCorp Inc.',
        sender_type: 'company',
        content: 'Great! Can you share some examples of your previous e-commerce work?',
        timestamp: '10:35 AM',
        is_read: true,
        is_own_message: false,
        is_system: false,
        attachments: []
      },
      {
        id: 4,
        sender_id: 1,
        sender_name: 'You',
        sender_type: 'user',
        content: 'Absolutely! I\'ve sent you links to three e-commerce projects in my portfolio.',
        timestamp: '10:40 AM',
        is_read: true,
        is_own_message: true,
        is_system: false,
        attachments: [
          {
            id: 1,
            type: 'link',
            url: 'https://portfolio.example.com/ecom1',
            title: 'Modern E-commerce Platform',
            description: 'Built with React, Node.js, MongoDB'
          },
          {
            id: 2,
            type: 'link',
            url: 'https://portfolio.example.com/ecom2',
            title: 'Mobile Shopping App',
            description: 'React Native, Express.js, Firebase'
          },
          {
            id: 3,
            type: 'link',
            url: 'https://portfolio.example.com/ecom3',
            title: 'B2B E-commerce Solution',
            description: 'Vue.js, Django, PostgreSQL'
          }
        ]
      },
      {
        id: 5,
        sender_id: 101,
        sender_name: 'TechCorp Inc.',
        sender_type: 'company',
        content: 'Excellent work! Looking forward to reviewing your proposal in detail.',
        timestamp: '10:45 AM',
        is_read: true,
        is_own_message: false,
        is_system: false,
        attachments: []
      }
    ];

    setThreads(initialThreads);
    
    // If there's a userId param, set active thread
    if (userId) {
      const thread = initialThreads.find(t => t.other_user_id.toString() === userId);
      if (thread) {
        setActiveThread(thread);
        setMessages(initialMessages);
      }
    } else if (initialThreads.length > 0) {
      // Set first thread as active by default
      setActiveThread(initialThreads[0]);
      setMessages(initialMessages);
    }
    
    setLoading(false);
  }, [userId]);

  // Fetch message threads from API
  const fetchThreads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/messages/threads', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch threads');
      
      const data = await response.json();
      setThreads(data);
      
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load conversations');
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread) return;
    
    setSending(true);
    
    // Simulate typing indicator
    setIsTyping(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: activeThread.other_user_id,
          content: newMessage,
          attachments: attachments,
          job_id: activeThread.job_id
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const sentMessage = await response.json();
      
      // Add message to local state
      const newMessageObj = {
        id: Date.now(),
        sender_id: 1, // Current user ID
        sender_name: 'You',
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
      
      // Update last message in thread
      setThreads(prev => prev.map(thread => 
        thread.id === activeThread.id 
          ? { ...thread, last_message: newMessage, last_message_time: 'Just now' }
          : thread
      ));
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      toast.success('Message sent!');
      
      // Simulate AI/Company response after delay
      setTimeout(() => {
        simulateCompanyResponse();
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      setIsTyping(false);
    }
  };

  // Simulate company/AI response
  const simulateCompanyResponse = () => {
    const responses = [
      "Thanks for sharing! Our team will review your portfolio.",
      "That's impressive! When would you be available for a technical interview?",
      "Great examples! Could you tell us about your experience with payment gateway integrations?",
      "We're impressed with your work. What's your expected rate for this project?",
      "Perfect! We'd like to schedule a call to discuss the project details further."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const aiMessage = {
      id: Date.now() + 1,
      sender_id: activeThread.other_user_id,
      sender_name: activeThread.other_user_name,
      sender_type: 'company',
      content: randomResponse,
      timestamp: 'Just now',
      is_read: false,
      is_own_message: false,
      is_system: false,
      attachments: []
    };
    
    setMessages(prev => [...prev, aiMessage]);
    
    // Update thread with new message
    setThreads(prev => prev.map(thread => 
      thread.id === activeThread.id 
        ? { 
            ...thread, 
            last_message: randomResponse.substring(0, 40) + '...',
            last_message_time: 'Just now',
            unread_count: (thread.unread_count || 0) + 1
          }
        : thread
    ));
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

  // Handle thread click
  const handleThreadClick = (thread) => {
    setActiveThread(thread);
    // In real app, fetch messages for this thread
    // For demo, show different conversations
    if (thread.id === 1) {
      setMessages(mockTechCorpMessages);
    } else if (thread.id === 2) {
      setMessages(mockDesignStudioMessages);
    } else {
      setMessages(mockDataInsightsMessages);
    }
    
    // Mark as read
    setThreads(prev => prev.map(t => 
      t.id === thread.id ? { ...t, unread_count: 0 } : t
    ));
  };

  // Mock messages for different threads
  const mockTechCorpMessages = [
    // Same as initial messages above
    {
      id: 1,
      sender_id: 101,
      sender_name: 'TechCorp Inc.',
      sender_type: 'company',
      content: 'Hi there! Thanks for your proposal on our e-commerce project.',
      timestamp: '10:30 AM',
      is_read: true,
      is_own_message: false,
      is_system: false
    },
    {
      id: 2,
      sender_id: 1,
      sender_name: 'You',
      sender_type: 'user',
      content: 'Hello! I\'m very interested in this project. I have extensive experience with React and Node.js.',
      timestamp: '10:32 AM',
      is_read: true,
      is_own_message: true,
      is_system: false
    },
    {
      id: 3,
      sender_id: 101,
      sender_name: 'TechCorp Inc.',
      sender_type: 'company',
      content: 'Great! Can you share some examples of your previous e-commerce work?',
      timestamp: '10:35 AM',
      is_read: true,
      is_own_message: false,
      is_system: false
    },
    {
      id: 4,
      sender_id: 1,
      sender_name: 'You',
      sender_type: 'user',
      content: 'Absolutely! I\'ve sent you links to three e-commerce projects in my portfolio.',
      timestamp: '10:40 AM',
      is_read: true,
      is_own_message: true,
      is_system: false
    },
    {
      id: 5,
      sender_id: 101,
      sender_name: 'TechCorp Inc.',
      sender_type: 'company',
      content: 'Excellent work! Looking forward to reviewing your proposal in detail.',
      timestamp: '10:45 AM',
      is_read: true,
      is_own_message: false,
      is_system: false
    }
  ];

  const mockDesignStudioMessages = [
    {
      id: 1,
      sender_id: 102,
      sender_name: 'DesignStudio',
      sender_type: 'company',
      content: 'Hi! We reviewed your UI/UX portfolio and were very impressed.',
      timestamp: 'Yesterday',
      is_read: true,
      is_own_message: false
    },
    {
      id: 2,
      sender_id: 1,
      sender_name: 'You',
      sender_type: 'user',
      content: 'Thank you! I\'m excited about your mobile app design project.',
      timestamp: 'Yesterday',
      is_read: true,
      is_own_message: true
    },
    {
      id: 3,
      sender_id: 102,
      sender_name: 'DesignStudio',
      sender_type: 'company',
      content: 'When can you start the interview?',
      timestamp: 'Today',
      is_read: false,
      is_own_message: false
    }
  ];

  const mockDataInsightsMessages = [
    {
      id: 1,
      sender_id: 103,
      sender_name: 'DataInsights Co.',
      sender_type: 'company',
      content: 'Thanks for submitting the final report! The analysis was excellent.',
      timestamp: '3 days ago',
      is_read: true,
      is_own_message: false
    },
    {
      id: 2,
      sender_id: 1,
      sender_name: 'You',
      sender_type: 'user',
      content: 'Glad you liked it! Looking forward to the next phase.',
      timestamp: '2 days ago',
      is_read: true,
      is_own_message: true
    },
    {
      id: 3,
      sender_id: 103,
      sender_name: 'DataInsights Co.',
      sender_type: 'company',
      content: 'We\'ll process your payment by Friday.',
      timestamp: '1 day ago',
      is_read: true,
      is_own_message: false
    }
  ];

  // Filter threads based on search
  const filteredThreads = threads.filter(thread =>
    thread.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.job_title && thread.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Render message with attachments
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
                        activeThread?.id === thread.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
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
                              <Briefcase className="w-5 h-5 text-primary-600" />
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
                      onClick={() => setActiveThread(null)}
                      className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {activeThread.other_user_name}
                        </h2>
                        {activeThread.job_title && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{activeThread.job_title}</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Active now
                            </span>
                          </div>
                        )}
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
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => {
                        toast.success('Opening contract details');
                        // Open contract modal here
                      }}
                    >
                      <Eye className="w-5 h-5 text-gray-600" />
                    </button>
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
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Project Type:</span>
                          <span className="font-medium">E-commerce Platform</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Budget:</span>
                          <span className="font-medium text-green-600">$5,000 - $10,000</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Timeline:</span>
                          <span className="font-medium">2-3 months</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Messages */}
                  {messages.map(message => (
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
                            <span className="text-xs text-gray-500">• {message.sender_type === 'company' ? 'Company' : 'Client'}</span>
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
                            message.is_own_message ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {message.timestamp}
                          </span>
                          {message.is_own_message && (
                            <span className="ml-2 flex items-center gap-1">
                              {message.is_read ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-primary-600" />
                                  <span className="text-gray-500">Read</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-500">Sent</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
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
                      />
                      <Paperclip className="w-5 h-5 text-gray-600" />
                    </label>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
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
                  
                  {/* Emoji Button */}
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                  
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
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <Briefcase className="w-5 h-5 text-primary-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Discuss Projects</h4>
                    <p className="text-sm text-gray-600">Clarify requirements and scope</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Negotiate Rates</h4>
                    <p className="text-sm text-gray-600">Agree on budgets and payments</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <p className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Green dot indicates active users
                  </p>
                  <p>💡 Keep communication professional</p>
                  <p>📎 Attach files directly in chat</p>
                  <p>⏰ Respond within 24 hours</p>
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