"use client";
import { DrizzleChat, messages } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { Delete, Loader, MessageCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
// import SubscriptionButton from "./SubscriptionButton";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
  // isPro: boolean;
};

const ChatSideBar = ({ chats, chatId /*isPro*/ }: Props) => {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const { mutate } = useMutation({
    mutationFn: async ({ file_key, file_name }: { file_key: string; file_name: string }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data;
    },
  });

  const handleClick = async () => {
    setLoading(true);
    toast.loading("Started creating new chat...", { duration: 3000 });
    try {
      const data = {
        file_key: "data.pdf",
        file_name: "Flight",
      };

      const result = await mutate(data, {
        onSuccess: (data) => {
          toast.success("Chat created!");
          router.push(`/chat/${data.chat_id}`);
        },
        onError: (error) => {
          console.error("Mutation failed with error:", error);
          toast.error("Error creating chat");
        },
        onSettled: () => {
          setLoading(false);
        },
      });
      console.log("Mutation result:", result);
    } catch (error) {
      console.error("Error during mutation:", error);
    }
  };

  const handleDelete = async (chatId: number) => {
    toast.loading("Deleting chat...");
    try {
      const response = await fetch("/api/delete-chat", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId }),
      });

      console.log("Status Code:", response.status);

      const data = await response.json();
      if (response.ok) {
        console.log("Chat deleted successfully");
        toast.dismiss();
        toast.success("Chat deleted successfully, Refreshing... ");
        router.refresh();
      } else {
        console.error("Error:", data.error);
        toast.error("Error deleting chat");
      }
    } catch (error) {
      console.error("Request failed:", error);
    }
  };
  return (
    <div>
      <div className="w-full max-h-screen h-full overflow-hidden p-4 text-gray-200 bg-gray-900">
        <Button disabled={loading} className="w-full border-dashed border-white border" onClick={() => handleClick()}>
          {loading ? (
            <>
              Creating chat... <Loader className="w-5 h-5 ml-2 animate-spin" />
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 w-4 h-4" /> New Chat
            </>
          )}
        </Button>

        <div className="flex max-h-screen h-screen overflow-y-auto custom-scroll pb-20 flex-col gap-2 mt-4">
          {chats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <div
                className={cn("rounded-lg p-3 text-slate-300 flex items-center", {
                  "bg-blue-600 text-white": chat.id === chatId,
                  "hover:text-white": chat.id !== chatId,
                })}
              >
                <MessageCircle className="mr-2" />
                <p className="w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis">{chat.pdfName}</p>
                <Delete
                  className="w-4 h-4 ml-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(chat.id);
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSideBar;
