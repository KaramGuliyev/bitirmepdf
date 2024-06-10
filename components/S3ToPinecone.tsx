"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader } from "lucide-react";

const ChatCreater = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
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
    toast.loading("Started loading chats...", { duration: 3000 });
    try {
      const data = {
        file_key: "data.pdf",
        file_name: "Flight",
      };

      const result = await mutate(data, {
        onSuccess: (data) => {
          console.log("Mutation succeeded with data:", data);
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

  return (
    <div className="flex mt-2">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? (
          <>
            Loading...
            <Loader className="w-5 h-5 ml-2 animate-spin" />
          </>
        ) : (
          "Go to Chats!"
        )}
      </Button>
    </div>
  );
};

export default ChatCreater;
