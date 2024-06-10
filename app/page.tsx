import { Button } from "@/components/ui/button";
import { UserButton, auth } from "@clerk/nextjs";
import Link from "next/link";
import { LogIn } from "lucide-react";
import ChatCreater from "@/components/S3ToPinecone";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-gray-700 via-gray-900 to-black">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-4xl font-semibold text-white">Find your tickets with TicketBot</h1>
            <UserButton afterSignOutUrl="/" />
          </div>

          <div className="flex mt-2">    
            {isAuth && 
              <ChatCreater/>
            }
          </div>

          <p className="max-w-2xl mt-1 text-lg text-slate-400">
          Join travelers worldwide to effortlessly discover and book flights, leveraging AI for instant answers and seamless booking experiences.
          </p>

          <div className="w-full mt-4">
            {!isAuth &&
              <Link href="/sign-in">
                <Button>
                  Login to get Started!
                  <LogIn className="w-4 h-4 ml-2"/>
                </Button>
              </Link>}
            </div>
        </div>
      </div>
    </div>
  );
}