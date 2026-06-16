export interface Customer {
  id: string;
  name: string;
  phone: string;
  debt: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  type: 'cash' | 'credit';
  totalAmount: number;
  createdAt: string;
  remark: string;
  items: OrderItem[];
}

export interface Service {
  id: string;
  name: string;
  unit: string;
  price: number;
  icon: string;
}

export interface TemplateItem {
  id: string;
  templateId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
}

export interface Template {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  createdAt: string;
  items: TemplateItem[];
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  createdAt: string;
  remark: string;
}

export interface Supplies {
  id: string;
  name: string;
  currentStock: number;
  threshold: number;
  updatedAt: string;
}

export interface Stats {
  total: number;
  cash: number;
  credit: number;
}
