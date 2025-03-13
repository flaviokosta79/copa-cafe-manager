import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { PlusIcon, TrashIcon, DollarSign, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';

const UserPaymentsDialog: React.FC<{ userId: string, userName: string }> = ({ userId, userName }) => {
  const { getUserPayments, formatCurrency, currentMonth } = useApp();
  const payments = getUserPayments(userId, currentMonth);
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" onClick={() => setIsOpen(true)}>Pagamentos</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pagamentos de {userName}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum pagamento registrado no mês atual.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditUserDialog: React.FC<{ user: User, onSave: (updatedUser: User) => void }> = ({ user, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const { toast } = useToast();
  const { checkAdminPermission } = useAuth();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, informe um nome para o usuário.",
        variant: "destructive"
      });
      return;
    }
    
    checkAdminPermission(() => {
      const updatedUser = { ...user, name };
      onSave(updatedUser);
      setIsOpen(false);
      
      toast({
        title: "Usuário atualizado",
        description: `Nome do usuário alterado para "${name}" com sucesso.`
      });
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            setName(user.name);
            setIsOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nome
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do usuário"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UsersPage: React.FC = () => {
  const { users, addUser, deleteUser, formatCurrency, getUserPayments, currentMonth, updateUser } = useApp();
  const { checkAdminPermission } = useAuth();
  const [newUserName, setNewUserName] = useState('');
  const { toast } = useToast();
  
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, informe um nome para o usuário.",
        variant: "destructive"
      });
      return;
    }
    
    checkAdminPermission(() => {
      addUser(newUserName);
      setNewUserName('');
      
      toast({
        title: "Usuário adicionado",
        description: `Usuário "${newUserName}" foi adicionado com sucesso.`
      });
    });
  };
  
  const handleDeleteUser = (userId: string, userName: string) => {
    checkAdminPermission(() => {
      deleteUser(userId);
      
      toast({
        title: "Usuário removido",
        description: `Usuário "${userName}" foi removido com sucesso.`
      });
    });
  };
  
  // Função para calcular o total de pagamentos de um usuário no mês atual
  const getUserTotalPayments = (userId: string): number => {
    const payments = getUserPayments(userId, currentMonth);
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    checkAdminPermission(() => {
      updateUser(updatedUser);
    });
  };
  
  return (
    <Layout title="Usuários">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar Novo Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="flex gap-2">
            <Input
              placeholder="Nome do usuário"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Pagamento (mês atual)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(getUserTotalPayments(user.id))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <UserPaymentsDialog userId={user.id} userName={user.name} />
                        <EditUserDialog user={user} onSave={handleUpdateUser} />
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum usuário cadastrado. Adicione um usuário usando o formulário acima.
            </p>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default UsersPage;
