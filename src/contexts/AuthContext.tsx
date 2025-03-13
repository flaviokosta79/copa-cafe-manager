import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as apiService from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';
import { AdminPasswordDialog } from '@/components/AdminPasswordDialog';

interface AuthContextType {
  isAuthenticated: boolean;
  checkAdminPermission: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);
  const { toast } = useToast();
  
  const handlePasswordSubmit = async (password: string) => {
    const isValid = await apiService.verifyAdminPassword(password);
    
    if (isValid) {
      setIsAuthenticated(true);
      setIsDialogOpen(false);
      
      // Execute a callback pendente se existir
      if (pendingCallback) {
        pendingCallback();
        setPendingCallback(null);
      }
    } else {
      toast({
        title: "Senha incorreta",
        description: "A senha de administrador fornecida está incorreta.",
        variant: "destructive"
      });
    }
  };
  
  const checkAdminPermission = (callback: () => void) => {
    // Se já estiver autenticado, execute a callback diretamente
    if (isAuthenticated) {
      callback();
    } else {
      // Caso contrário, salve a callback e abra o diálogo de senha
      setPendingCallback(() => callback);
      setIsDialogOpen(true);
    }
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, checkAdminPermission }}>
      {children}
      <AdminPasswordDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handlePasswordSubmit}
      />
    </AuthContext.Provider>
  );
};