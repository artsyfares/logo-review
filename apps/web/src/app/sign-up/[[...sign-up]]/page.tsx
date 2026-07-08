import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/projects");
  }

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <SignUp />
    </div>
  );
}
