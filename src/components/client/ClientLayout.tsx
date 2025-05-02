import React, { ReactNode } from 'react';
import ClientSidebar from './ClientSidebar';

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* サイドバー */}
      <ClientSidebar />
      
      {/* メインコンテンツ */}
      <main className="ml-64 flex-1 p-6">
        {children}
      </main>
    </div>
  );
};

export default ClientLayout; 