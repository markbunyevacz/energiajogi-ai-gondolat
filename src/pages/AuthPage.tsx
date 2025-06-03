import { AuthForm } from '@/components/Auth/AuthForm';

export function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Jogi AI Rendszer
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Jelentkezz be a folytatáshoz
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
} 