import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { chatId } = body;

    const deletedMessages = await db.delete(messages).where(eq(messages.chatId, chatId))
    const insertedChat = await db.delete(chats).where(eq(chats.id, chatId)).returning({
      insertedId: chats.id,
    });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
