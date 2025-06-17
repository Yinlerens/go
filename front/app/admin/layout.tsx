import React from 'react';
import { MenuLayout } from '@/components/Menu';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <MenuLayout>
      {children}
    </MenuLayout>
  );
};

export default AdminLayout;
