import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp 
        signInUrl="/sign-in"
        redirectUrl="/intake"
        appearance={{
          elements: {
            formButtonPrimary: "bg-black hover:bg-gray-800",
            card: "shadow-2xl",
          }
        }}
      />
    </div>
  );
}