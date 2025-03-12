
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CoffeeIcon, UsersIcon, ShoppingCartIcon, BarChartIcon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, active }) => {
  return (
    <Link to={to} className="w-full">
      <Button
        variant="ghost"
        className={`w-full justify-start gap-2 mb-1 ${
          active
            ? 'bg-cafe-brown-dark text-white hover:bg-cafe-brown-dark hover:text-white'
            : 'hover:bg-cafe-brown hover:text-white'
        }`}
      >
        {icon}
        <span>{label}</span>
      </Button>
    </Link>
  );
};

const SidebarContent: React.FC = () => {
  const location = useLocation();
  
  const routes = [
    { path: '/', label: 'Dashboard', icon: <BarChartIcon size={20} /> },
    { path: '/users', label: 'Usuários', icon: <UsersIcon size={20} /> },
    { path: '/products', label: 'Produtos', icon: <ShoppingCartIcon size={20} /> },
  ];
  
  return (
    <div className="flex flex-col p-4 h-full bg-cafe-cream">
      <div className="flex items-center gap-2 mb-6 mt-2">
        <CoffeeIcon size={28} className="text-cafe-brown" />
        <h1 className="text-xl font-bold text-cafe-brown">Copa Café</h1>
      </div>
      
      <div className="flex flex-col gap-1">
        {routes.map((route) => (
          <SidebarLink
            key={route.path}
            to={route.path}
            icon={route.icon}
            label={route.label}
            active={location.pathname === route.path}
          />
        ))}
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }
  
  return (
    <div className="hidden md:block w-64 h-screen border-r">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;
