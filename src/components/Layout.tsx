import React, { ReactNode, useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const isMobile = useIsMobile();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Atualizar data e hora a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Formatar data e hora
  const formattedDate = currentDateTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = currentDateTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className="flex min-h-screen bg-cafe-cream">
      <Sidebar />
      <div className={`flex-1 ${isMobile ? 'pt-16' : ''}`}>
        <header className="bg-white p-4 shadow mb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <h1 className="text-2xl font-bold text-cafe-brown">{title}</h1>
            <div className="text-sm text-muted-foreground mt-1 md:mt-0">
              <p>Bem-vindo ao Copa Café Manager</p>
              <p className="text-right">{formattedDate} - {formattedTime}</p>
            </div>
          </div>
        </header>
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
