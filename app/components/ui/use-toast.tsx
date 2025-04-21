import { useState } from "react";

type ToastType = "default" | "success" | "error" | "warning";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface UseToastReturn {
  toast: (options: {
    title: string;
    description?: string;
    type?: ToastType;
  }) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, type = "default" }: {
    title: string;
    description?: string;
    type?: ToastType;
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, type };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
  };

  return { toast, toasts, dismiss, dismissAll };
} 