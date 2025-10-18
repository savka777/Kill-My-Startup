import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn 
        signUpUrl="/sign-up"
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