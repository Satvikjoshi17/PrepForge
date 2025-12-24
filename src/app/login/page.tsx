import { AuthForm } from "@/components/auth/AuthForm";
import { AuthBackground } from "@/components/auth/AuthBackground";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4">
      <AuthBackground />
      <div className="w-full max-w-md relative z-10 transition-all duration-500">
        <AuthForm />
      </div>
    </div>
  );
}
