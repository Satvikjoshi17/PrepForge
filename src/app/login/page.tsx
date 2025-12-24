import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4">
      <AuthBackground />
      <div className="w-full max-w-md relative z-10 transition-all duration-500">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
