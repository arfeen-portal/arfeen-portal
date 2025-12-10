import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatRequestBody = {
  role?: 'customer' | 'agent';
  sessionId?: number;
  message: string;
};

function basicAnswer(input: string, isAgent: boolean): string {
  const text = input.toLowerCase();

  if (text.includes('ledger') || text.includes('balance')) {
    return isAgent
      ? 'Aap apna agent ledger Accounts → Agent Ledger section se dekh sakte hain. Jaldi hi yahan se direct summary bhi aa jayegi.'
      : 'Aap apna payment status “My Bookings” page se check kar sakte hain.';
  }

  if (text.includes('tawaf') || text.includes('rush')) {
    return 'Tawaf ke rush time aam tor pe Fajr se thora pehle aur Maghrib ke baad zyada hote hain. Best time aam tor pe late night ya dhuhr ke baad mana jata hai. Apne dates ke hisaab se Crowd Forecast screen bhi check karein.';
  }

  if (text.includes('rawdah') || text.includes('rawdah')) {
    return 'Rawdah ke liye ab slots Nusuk app ke zariye manage hote hain. Morning slots aam tor pe kam rush hote hain, lekin app pe available slots hi final honge.';
  }

  if (text.includes('ziyarat')) {
    return 'Ziyarat ke liye aam route: Madinah → Uhud, Quba, Qiblatain, Sabaa Masajid. Makkah → Hudaibiya, Jabal Noor, Jabal Thawr, Mina, Arafat. Aap hamari Ziyarat packages bhi dekh sakte hain.';
  }

  if (text.includes('package') || text.includes('umrah')) {
    return 'Umrah packages ke liye aap hamara AI Umrah Planner use karein: dates + budget dalen, system aap ko best combinations suggest karega.';
  }

  return 'Aap apna sawal thora clear likhein (e.g. “ledger balance”, “best time for tawaf”, “ziyarat details”), main us hisaab se madad karun ga.';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const isAgent = body.role === 'agent';

    const supabase = getSupabaseServerClient();

    const {
      data: { user }
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    let sessionId = body.sessionId;

    if (!sessionId) {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: user?.id ?? null,
          role: body.role ?? 'customer'
        })
        .select('id')
        .single();

      if (error) throw error;
      sessionId = data.id;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: body.message
    };

    const answerText = basicAnswer(body.message, isAgent);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: answerText
    };

    await supabase.from('ai_chat_messages').insert([
      {
        session_id: sessionId,
        sender: 'user',
        message: userMessage.content
      },
      {
        session_id: sessionId,
        sender: 'assistant',
        message: assistantMessage.content
      }
    ]);

    return NextResponse.json({
      success: true,
      sessionId,
      messages: [userMessage, assistantMessage]
    });
  } catch (error: any) {
    console.error('Chatbot error', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
