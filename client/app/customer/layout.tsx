import type { ReactNode } from "react";
import CustomerBottomNav from "../../components/customer/CustomerBottomNav";

type CustomerLayoutProps = {
  children: ReactNode;
};

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {children}
      <CustomerBottomNav />
    </div>
  );
}