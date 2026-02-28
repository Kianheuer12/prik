import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-black text-[#2E86AB]">Prik</h1>
        <p className="text-slate-500 mt-1">Track your glucose, your way.</p>
      </div>
      <SignUp routing="hash" />
    </div>
  );
}
