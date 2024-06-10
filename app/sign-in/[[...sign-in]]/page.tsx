import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-700 via-gray-900 to-black flex items-center justify-center">
      <SignIn/>
    </div>
  );
}