import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
} from 'date-fns';
import type {
  Customer,
  Order,
  OrderItem,
  Service,
  Template,
  TemplateItem,
  Payment,
  Supplies,
  Stats,
} from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const defaultServices: Service[] = [
  { id: 'copy', name: '复印', unit: '张', price: 0.5, icon: '📄' },
  { id: 'print', name: '打印', unit: '张', price: 1.0, icon: '🖨️' },
  { id: 'color', name: '彩印', unit: '张', price: 2.0, icon: '🎨' },
  { id: 'scan', name: '扫描', unit: '张', price: 1.0, icon: '📷' },
  { id: 'bind', name: '装订', unit: '本', price: 5.0, icon: '📚' },
];

const defaultSupplies: Supplies[] = [
  { id: 'toner', name: '墨粉', currentStock: 100, threshold: 20, updatedAt: new Date().toISOString() },
  { id: 'paper', name: '纸张', currentStock: 500, threshold: 100, updatedAt: new Date().toISOString() },
];

const defaultCustomer: Customer = {
  id: 'walk-in',
  name: '散客',
  phone: '',
  debt: 0,
  createdAt: new Date().toISOString(),
};

interface AppState {
  customers: Customer[];
  orders: Order[];
  services: Service[];
  templates: Template[];
  payments: Payment[];
  supplies: Supplies[];

  addCustomer: (data: Omit<Customer, 'id' | 'debt' | 'createdAt'>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addOrder: (data: Omit<Order, 'id' | 'createdAt' | 'items'> & { items: Omit<OrderItem, 'id' | 'orderId'>[] }) => void;

  updateService: (id: string, price: number) => void;

  addTemplate: (data: Omit<Template, 'id' | 'createdAt' | 'items'> & { items: Omit<TemplateItem, 'id' | 'templateId'>[] }) => void;
  deleteTemplate: (id: string) => void;

  addPayment: (data: Omit<Payment, 'id' | 'createdAt'>) => void;

  updateSupplies: (id: string, currentStock: number, threshold?: number) => void;

  getStats: (period: 'today' | 'week' | 'month') => Stats;
  getOrdersByPeriod: (period: 'today' | 'week' | 'month') => Order[];
  getCustomerDebt: (customerId: string) => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      customers: [defaultCustomer],
      orders: [],
      services: defaultServices,
      templates: [],
      payments: [],
      supplies: defaultSupplies,

      addCustomer: (data) => {
        const newCustomer: Customer = {
          ...data,
          id: generateId(),
          debt: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
      },

      updateCustomer: (id, data) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        }));
      },

      deleteCustomer: (id) => {
        if (id === 'walk-in') return;
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },

      addOrder: (data) => {
        const orderId = generateId();
        const items: OrderItem[] = data.items.map((item) => ({
          ...item,
          id: generateId(),
          orderId,
        }));
        const newOrder: Order = {
          id: orderId,
          customerId: data.customerId,
          customerName: data.customerName,
          type: data.type,
          totalAmount: data.totalAmount,
          createdAt: new Date().toISOString(),
          remark: data.remark,
          items,
        };

        set((state) => {
          const updatedCustomers = state.customers.map((c) => {
            if (c.id === data.customerId && data.type === 'credit') {
              return { ...c, debt: c.debt + data.totalAmount };
            }
            return c;
          });
          return {
            orders: [...state.orders, newOrder],
            customers: updatedCustomers,
          };
        });
      },

      updateService: (id, price) => {
        set((state) => ({
          services: state.services.map((s) =>
            s.id === id ? { ...s, price } : s
          ),
        }));
      },

      addTemplate: (data) => {
        const templateId = generateId();
        const items: TemplateItem[] = data.items.map((item) => ({
          ...item,
          id: generateId(),
          templateId,
        }));
        const newTemplate: Template = {
          id: templateId,
          name: data.name,
          customerId: data.customerId,
          customerName: data.customerName,
          createdAt: new Date().toISOString(),
          items,
        };
        set((state) => ({ templates: [...state.templates, newTemplate] }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      addPayment: (data) => {
        const newPayment: Payment = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const updatedCustomers = state.customers.map((c) => {
            if (c.id === data.customerId) {
              return { ...c, debt: Math.max(0, c.debt - data.amount) };
            }
            return c;
          });
          return {
            payments: [...state.payments, newPayment],
            customers: updatedCustomers,
          };
        });
      },

      updateSupplies: (id, currentStock, threshold) => {
        set((state) => ({
          supplies: state.supplies.map((s) =>
            s.id === id
              ? {
                  ...s,
                  currentStock,
                  threshold: threshold ?? s.threshold,
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }));
      },

      getStats: (period) => {
        const now = new Date();
        const startOfPeriod = {
          today: startOfDay(now),
          week: startOfWeek(now, { weekStartsOn: 1 }),
          month: startOfMonth(now),
        }[period];

        return get()
          .orders.filter((o) => new Date(o.createdAt) >= startOfPeriod)
          .reduce(
            (acc, o) => ({
              total: acc.total + o.totalAmount,
              cash: acc.cash + (o.type === 'cash' ? o.totalAmount : 0),
              credit: acc.credit + (o.type === 'credit' ? o.totalAmount : 0),
            }),
            { total: 0, cash: 0, credit: 0 }
          );
      },

      getOrdersByPeriod: (period) => {
        const now = new Date();
        const startOfPeriod = {
          today: startOfDay(now),
          week: startOfWeek(now, { weekStartsOn: 1 }),
          month: startOfMonth(now),
        }[period];

        return get()
          .orders.filter((o) => new Date(o.createdAt) >= startOfPeriod)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      },

      getCustomerDebt: (customerId) => {
        const customer = get().customers.find((c) => c.id === customerId);
        return customer?.debt ?? 0;
      },
    }),
    { name: 'print-shop-storage' }
  )
);
