import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <img src="/logo.svg" alt="Prik" className="h-12 mx-auto mb-2" />
        <p className="text-slate-500">Track your glucose, your way.</p>
      </div>
      <SignIn routing="hash" />
    </div>
  );
}
