export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  addedBy: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  status: 'unconfirmed' | 'placed' | 'preparing' | 'ready' | 'served';
  items: CartItem[];
  total: number;
  placedAt: Date;
  updatedAt: Date;
}

export interface ServiceRequest {
  id: string;
  tableNumber: number;
  type: string;
  status: 'waiting' | 'in_progress' | 'resolved';
  createdAt: Date;
  message?: string;
}

export interface ChatMessage {
  id: string;
  tableNumber: number;
  sender: 'assistant' | 'user' | 'staff';
  content: string;
  timestamp: Date;
}

export interface Table {
  number: number;
  qrCode: string;
  lastActivity?: Date;
  hasWarning?: boolean;
}
