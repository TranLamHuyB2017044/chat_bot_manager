export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-page dark:bg-dark-page flex items-center justify-center p-4">
      {children}
    </div>
  );
}
