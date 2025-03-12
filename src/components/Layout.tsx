
import React, { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex min-h-screen bg-cafe-cream">
      <Sidebar />
      <div className={`flex-1 ${isMobile ? 'pt-16' : ''}`}>
        <header className="bg-white p-4 shadow mb-4">
          <h1 className="text-2xl font-bold text-cafe-brown">{title}</h1>
        </header>
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
