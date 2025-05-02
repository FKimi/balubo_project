import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, 
  Send, 
  PaperclipIcon, 
  MoreVertical, 
  Phone, 
  Video,
  ChevronLeft,
  Image as ImageIcon,
  File as FileIcon,
  Smile
} from 'lucide-react';
import ClientLayout from './ClientLayout';

// Supabaseクライアントの初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 型定義追加
export interface Contact {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
}

// デモ用メッセージデータ
const demoContacts: Contact[] = [
  {
    id: 1,
    name: '田中 デザイナー',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    lastMessage: 'ロゴデザインの修正案をお送りしました。ご確認ください。',
    time: '10:30',
    unread: 2,
    isOnline: true,
  },
  {
    id: 2,
    name: '佐藤 ライター',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    lastMessage: '記事の構成について相談があります。',
    time: '昨日',
    unread: 0,
    isOnline: false,
  },
  {
    id: 3,
    name: '鈴木 プログラマー',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    lastMessage: 'APIの仕様書を確認したところ、いくつか質問があります。',
    time: '昨日',
    unread: 0,
    isOnline: true,
  },
  {
    id: 4,
    name: '高橋 マーケター',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    lastMessage: 'SNS運用計画についてフィードバックありがとうございます。',
    time: '月曜日',
    unread: 0,
    isOnline: false,
  },
  {
    id: 5,
    name: '伊藤 イラストレーター',
    avatar: 'https://randomuser.me/api/portraits/women/14.jpg',
    lastMessage: 'イラストの最終版をアップロードしました。',
    time: '2023/11/15',
    unread: 0,
    isOnline: false,
  },
];

// デモ用メッセージ履歴
const demoMessages = [
  {
    id: 1,
    contactId: 1,
    senderId: 'other',
    text: 'お世話になっております。田中です。',
    time: '2023/11/20 10:15',
  },
  {
    id: 2,
    contactId: 1,
    senderId: 'other',
    text: 'ロゴデザインの最初の案をお送りします。コンセプトは「革新的でありながら親しみやすさ」を表現しています。',
    time: '2023/11/20 10:16',
  },
  {
    id: 3,
    contactId: 1,
    senderId: 'me',
    text: '田中さん、おはようございます。早速の提案ありがとうございます。',
    time: '2023/11/20 10:20',
  },
  {
    id: 4,
    contactId: 1,
    senderId: 'me',
    text: 'デザインを確認しました。全体的な方向性は良いと思います。ただ、色合いについてもう少し企業カラーを反映させたいと思っています。',
    time: '2023/11/20 10:22',
  },
  {
    id: 5,
    contactId: 1,
    senderId: 'other',
    text: '承知しました。企業カラーをより強調した案を作成します。明日の午前中までにお送りできると思います。',
    time: '2023/11/20 10:25',
  },
  {
    id: 6,
    contactId: 1,
    senderId: 'me',
    text: 'ありがとうございます。よろしくお願いします。',
    time: '2023/11/20 10:26',
  },
  {
    id: 7,
    contactId: 1,
    senderId: 'other',
    text: 'ロゴデザインの修正案をお送りしました。ご確認ください。',
    time: '2023/11/21 10:30',
    hasAttachment: true,
    attachmentType: 'image',
    attachmentPreview: 'https://via.placeholder.com/300x200?text=Logo+Design',
  },
];

const ClientMessages: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [messages, setMessages] = useState(demoMessages);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileContactList, setShowMobileContactList] = useState(true);
  
  const navigate = useNavigate();

  // 検索処理
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setContacts(demoContacts);
      return;
    }
    
    const filtered = demoContacts.filter(contact => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setContacts(filtered);
  };

  // 連絡先選択
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    // モバイル表示で連絡先リストを隠す
    setShowMobileContactList(false);
  };

  // メッセージ送信
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedContact) return;
    
    const newMsg = {
      id: messages.length + 1,
      contactId: selectedContact.id,
      senderId: 'me',
      text: newMessage,
      time: new Date().toLocaleString(),
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // 最後のメッセージを更新
    const updatedContacts = contacts.map(c => {
      if (c.id === selectedContact.id) {
        return {
          ...c,
          lastMessage: newMessage,
          time: '今',
          unread: 0
        };
      }
      return c;
    });
    
    setContacts(updatedContacts);
  };

  // キーボードイベント処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 現在の連絡先のメッセージをフィルタリング
  const currentMessages = selectedContact
    ? messages.filter(msg => msg.contactId === selectedContact.id)
    : [];

  return (
    <ClientLayout>
      <div className="container mx-auto px-0 md:px-4 py-4">
        <div className="flex justify-between items-center mb-2 px-4">
          <h1 className="text-2xl font-bold text-gray-900">メッセージ</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex h-[calc(100vh-180px)] min-h-[500px]">
            {/* 連絡先リスト（モバイルでは条件付き表示） */}
            <div className={`w-full md:w-1/3 border-r ${!showMobileContactList ? 'hidden md:block' : ''}`}>
              {/* 検索バー */}
              <div className="p-3 border-b">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="検索..."
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <Search size={18} />
                  </div>
                </div>
              </div>
              
              {/* 連絡先リスト */}
              <div className="overflow-y-auto h-[calc(100%-56px)]">
                {contacts.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    連絡先が見つかりません
                  </div>
                ) : (
                  <ul>
                    {contacts.map((contact) => (
                      <li 
                        key={contact.id}
                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 border-b ${
                          selectedContact?.id === contact.id ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => handleSelectContact(contact)}
                      >
                        <div className="relative">
                          <img 
                            src={contact.avatar}
                            alt={contact.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {contact.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                          )}
                        </div>
                        <div className="ml-3 flex-grow min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                            <span className="text-xs text-gray-500">{contact.time}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                            {contact.unread > 0 && (
                              <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                                {contact.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {/* メッセージエリア（モバイルでは条件付き表示） */}
            <div className={`w-full md:w-2/3 flex flex-col ${showMobileContactList ? 'hidden md:flex' : ''}`}>
              {selectedContact ? (
                <>
                  {/* メッセージヘッダー */}
                  <div className="p-3 border-b flex justify-between items-center">
                    <div className="flex items-center">
                      <button 
                        className="md:hidden mr-2 text-gray-500"
                        onClick={() => setShowMobileContactList(true)}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <img 
                        src={selectedContact.avatar}
                        alt={selectedContact.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="ml-3">
                        <h3 className="font-medium">{selectedContact.name}</h3>
                        <p className="text-xs text-gray-500">
                          {selectedContact.isOnline ? 'オンライン' : 'オフライン'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="text-gray-500 hover:text-indigo-600">
                        <Phone size={18} />
                      </button>
                      <button className="text-gray-500 hover:text-indigo-600">
                        <Video size={18} />
                      </button>
                      <button className="text-gray-500 hover:text-indigo-600">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* メッセージ履歴 */}
                  <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
                    {currentMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`mb-4 flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.senderId !== 'me' && (
                          <img 
                            src={selectedContact.avatar}
                            alt={selectedContact.name}
                            className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
                          />
                        )}
                        <div 
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.senderId === 'me'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <p>{msg.text}</p>
                          {msg.hasAttachment && (
                            <div className="mt-2">
                              {msg.attachmentType === 'image' && (
                                <img 
                                  src={msg.attachmentPreview}
                                  alt="添付ファイル"
                                  className="rounded-md max-w-full cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(msg.attachmentPreview, '_blank')}
                                />
                              )}
                            </div>
                          )}
                          <div 
                            className={`text-xs mt-1 ${
                              msg.senderId === 'me' ? 'text-indigo-200' : 'text-gray-500'
                            }`}
                          >
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* メッセージ入力 */}
                  <form onSubmit={handleSendMessage} className="border-t p-3 flex items-center">
                    <button type="button" className="text-gray-500 mr-2">
                      <PaperclipIcon size={20} />
                    </button>
                    <button type="button" className="text-gray-500 mr-2">
                      <ImageIcon size={20} />
                    </button>
                    <button type="button" className="text-gray-500 mr-2">
                      <FileIcon size={20} />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="メッセージを入力..."
                      className="flex-grow py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`ml-2 p-2 rounded-full ${
                        newMessage.trim()
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-6 bg-gray-50">
                  <div className="text-center">
                    <div className="text-gray-400 mb-3">
                      <Smile size={48} className="mx-auto" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">メッセージを始めましょう</h3>
                    <p className="text-gray-500 mb-4">左側の連絡先リストから会話を選択してください</p>
                    <button
                      onClick={() => navigate('/client/creators')}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                      クリエイターを探す
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientMessages; 