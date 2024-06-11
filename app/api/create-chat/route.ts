import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { file_key, file_name } = body;
    await loadS3IntoPinecone(file_key);

    const insertedChat = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        dataName: "",
        dataUrl: getS3Url(file_key),
        userId,
      })
      .returning({
        insertedId: chats.id,
      });

    const insertedId = insertedChat[0].insertedId;

    const updatedChat = await db
      .update(chats)
      .set({
        dataName: `${file_name} ${insertedId}`,
      })
      .where(eq(chats.id, insertedId))
      .returning({
        id: chats.id,
        dataName: chats.dataName,
      });

    return NextResponse.json(
      {
        chat_id: updatedChat[0].id,
        data_name: updatedChat[0].dataName,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
