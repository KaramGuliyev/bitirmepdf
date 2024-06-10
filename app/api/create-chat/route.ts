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

    // İlk olarak veriyi ekle ve ID'yi al
    const insertedChat = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: "", // İlk başta boş string olarak ekliyoruz
        pdfUrl: getS3Url(file_key),
        userId,
      })
      .returning({
        insertedId: chats.id,
      });

    const insertedId = insertedChat[0].insertedId;

    // PDF adını ID ile güncelle
    const updatedChat = await db
      .update(chats)
      .set({
        pdfName: `${file_name} ${insertedId}`,
      })
      .where(eq(chats.id, insertedId)) // where koşulu
      .returning({
        id: chats.id,
        pdfName: chats.pdfName,
      });

    return NextResponse.json(
      {
        chat_id: updatedChat[0].id,
        pdf_name: updatedChat[0].pdfName,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
