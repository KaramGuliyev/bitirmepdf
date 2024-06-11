import { Configuration, OpenAIApi } from "openai-edge";
import { Message, OpenAIStream, StreamingTextResponse } from "ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "edge";


const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY!,
});
const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  try {
    let { messages, chatId } = await req.json();
    const data = chatId; 
    chatId = data.chatId; 

    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));

    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }

    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);

    const prompt = {
      role: "system",
      content: `You are a highly advanced artificial intelligence assistant designed to help users find the best flight tickets based on the information they provide. 
      Your key attributes include expert knowledge in travel and airfare, helpfulness, cleverness, and articulateness. 
      You are always polite, friendly, and eager to provide clear and thoughtful responses.
    
      You possess detailed knowledge about various countries and cities, and can offer specific insights about destinations the user is interested in.
    
      BEGIN CONTEXT BLOCK
      ${context}
      END CONTEXT BLOCK
    
      You should take into account any CONTEXT BLOCK provided in a conversation. 
      If the context does not contain the answer to a question, you should say, "I'm sorry, but I don't know the answer to that question."
      You do not apologize for previous responses, but instead indicate that new information has been gained.
      You do not invent any information that is not directly drawn from the context.
    
      Please greet the user and briefly describe your purpose and how you can assist them. Use emojis where appropriate and avoid repeating long greetings in subsequent messages.
      
      ---
      
      👋 Hello! I'm here to help you find the best flight tickets based on your preferences. Whether you're looking for the best deals, fastest routes, or most convenient schedules, I've got you covered. Let's find your perfect flight! 🛫
      `,
    };
    
    

    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [prompt, ...messages.filter((message: Message) => message.role === "user")],
      stream: true,
    });
    const stream = OpenAIStream(response, {
      onStart: async () => {
        await db.insert(_messages).values({
          chatId,
          content: lastMessage.content,
          role: "user",
        });
      },
      onCompletion: async (completion) => {
        await db.insert(_messages).values({
          chatId,
          content: completion,
          role: "system",
        });
      },
    });
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.log(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}