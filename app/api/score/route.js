import { getServerSession } from "next-auth"
import { supabase } from "@/lib/supabase"

export async function POST(request) {
  const session = await getServerSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { score } = await request.json()

  const { error } = await supabase.from("scores").insert({
    user_email: session.user.email,
    user_name: session.user.name,
    score: score,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}

export async function GET() {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(10)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}