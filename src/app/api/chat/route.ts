import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Chatbot } from "@/store/chatbotStore";

const DB_PATH = path.join(process.cwd(), "src/lib/bots.json");

export async function POST(req: NextRequest) {
  try {
    const { botId, messages } = await req.json();
    if (!botId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing botId or messages" }, { status: 400 });
    }

    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const dbData = fs.readFileSync(DB_PATH, "utf-8");
    const bots: Chatbot[] = JSON.parse(dbData);
    const bot = bots.find((b) => b.id === botId);

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const cleanQuery = lastUserMessage.toLowerCase().trim();

    let responseText = "";
    let isFallback = false;

    // Greetings
    if (cleanQuery.match(/(hello|hi|xin chào|chào bạn|chào)/i)) {
      responseText = bot.widgetConfig.welcomeMessage || "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?";
    } else if (cleanQuery.match(/(bạn là ai|tên gì|tên là gì)/i)) {
      responseText = `Tôi là ${bot.name}, chatbot AI thông minh được huấn luyện để trả lời các câu hỏi dựa trên tài liệu được cung cấp.`;
    } else {
      // Simple Keyword search in knowledge text
      const kbText = bot.knowledgeBase.text || "";
      const sentences = kbText
        .split(/[.\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);

      const words = cleanQuery.split(/\s+/).filter((w) => w.length > 2);
      const matches = sentences.filter((sentence) => {
        const lowerSentence = sentence.toLowerCase();
        return words.some((word) => lowerSentence.includes(word));
      });

      if (matches.length > 0) {
        responseText = matches.slice(0, 2).join(". ") + ".";
      } else {
        responseText = "Tôi xin lỗi, thông tin này hiện chưa nằm trong tri thức được cung cấp của tôi. Bạn có thể đặt câu hỏi khác được không?";
        isFallback = true;
      }
    }

    if (bot.status === "training") {
      responseText = "Hệ thống đang huấn luyện tôi, vui lòng đợi trong giây lát...";
    }

    // Update stats on server
    bot.messagesCount += 1;
    const userMsgCount = messages.filter((m: any) => m.role === "user").length;
    if (userMsgCount === 1) {
      bot.chatsCount += 1;
    }
    
    // Update fallback rate
    const prevMessagesCount = bot.messagesCount - 1;
    const currentFallbacks = Math.round((bot.fallbackRate / 100) * prevMessagesCount);
    const newFallbacks = currentFallbacks + (isFallback ? 1 : 0);
    bot.fallbackRate = bot.messagesCount > 0 ? Math.round((newFallbacks / bot.messagesCount) * 100) : 0;
    
    // Increment credits
    bot.creditsUsed += 1;

    // Save
    const idx = bots.findIndex((b) => b.id === botId);
    if (idx !== -1) {
      bots[idx] = bot;
      fs.writeFileSync(DB_PATH, JSON.stringify(bots, null, 2), "utf-8");
    }

    return NextResponse.json(
      {
        role: "assistant",
        content: responseText,
        botStats: {
          chatsCount: bot.chatsCount,
          messagesCount: bot.messagesCount,
          fallbackRate: bot.fallbackRate,
          creditsUsed: bot.creditsUsed,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
