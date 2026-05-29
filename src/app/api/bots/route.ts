import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Chatbot } from "@/store/chatbotStore";

const DB_PATH = path.join(process.cwd(), "src/lib/bots.json");

// Ensure the db file exists
function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]), "utf-8");
  }
}

function readBots(): Chatbot[] {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading bots DB:", error);
    return [];
  }
}

function writeBots(bots: Chatbot[]) {
  initDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(bots, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing bots DB:", error);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get("botId");

  if (!botId) {
    return NextResponse.json({ error: "Missing botId" }, { status: 400 });
  }

  const bots = readBots();
  const bot = bots.find((b) => b.id === botId);

  if (!bot) {
    return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
  }

  // Set CORS headers so external widgets can load this configuration
  return NextResponse.json(bot, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const bot = await req.json();
    if (!bot || !bot.id) {
      return NextResponse.json({ error: "Invalid chatbot data" }, { status: 400 });
    }

    const bots = readBots();
    const idx = bots.findIndex((b) => b.id === bot.id);
    if (idx !== -1) {
      bots[idx] = { ...bots[idx], ...bot };
    } else {
      bots.push(bot);
    }

    writeBots(bots);
    return NextResponse.json({ success: true, bot });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
