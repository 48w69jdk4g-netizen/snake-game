"use client"
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useRef, useState, useCallback } from "react"

export default function Home() {
  const { data: session } = useSession()
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const gameRef = useRef({})

  const fetchLeaderboard = async () => {
    const res = await fetch("/api/score")
    const data = await res.json()
    setLeaderboard(data)
  }

  useEffect(() => { fetchLeaderboard() }, [])

  const saveScore = async (finalScore) => {
    if (!session || finalScore === 0) return
    await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: finalScore }),
    })
    fetchLeaderboard()
  }

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const CELL = 20, COLS = 20, ROWS = 20
    let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]
    let dir = { x: 1, y: 0 }
    let nextDir = { x: 1, y: 0 }
    let food = { x: 5, y: 5 }
    let currentScore = 0
    let speed = 1

    const placeFood = () => {
      do {
        food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
      } while (snake.some(s => s.x === food.x && s.y === food.y))
    }

    const draw = () => {
      ctx.fillStyle = "#111"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = "#1a1a1a"
      ctx.lineWidth = 0.5
      for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke() }
      for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke() }
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "#39e07a" : "#1D9E75"
        ctx.beginPath(); ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, i === 0 ? 6 : 4); ctx.fill()
      })
      ctx.fillStyle = "#ff4d4d"
      ctx.beginPath(); ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2); ctx.fill()
    }

    const step = () => {
      dir = nextDir
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) {
        clearInterval(gameRef.current.timer)
        setGameOver(true)
        setStarted(false)
        saveScore(currentScore)
        ctx.fillStyle = "rgba(0,0,0,0.6)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#fff"; ctx.font = "500 24px sans-serif"; ctx.textAlign = "center"
        ctx.fillText("游戏结束", canvas.width / 2, canvas.height / 2 - 14)
        ctx.font = "400 16px sans-serif"
        ctx.fillText(`得分：${currentScore}`, canvas.width / 2, canvas.height / 2 + 16)
        return
      }
      snake.unshift(head)
      if (head.x === food.x && head.y === food.y) {
        currentScore += 10
        speed = Math.min(10, 1 + Math.floor(currentScore / 50))
        setScore(currentScore)
        placeFood()
        clearInterval(gameRef.current.timer)
        gameRef.current.timer = setInterval(step, Math.max(80, 200 - (speed - 1) * 20))
      } else { snake.pop() }
      draw()
    }

    const handleKey = (e) => {
      const map = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }
      const d = map[e.key]
      if (d && !(d.x === -dir.x && d.y === -dir.y)) { nextDir = d; e.preventDefault() }
    }

    placeFood(); draw()
    setScore(0); setGameOver(false); setStarted(true)
    clearInterval(gameRef.current.timer)
    gameRef.current.timer = setInterval(step, 200)
    gameRef.current.handleKey = handleKey
    window.addEventListener("keydown", handleKey)
    return () => { clearInterval(gameRef.current.timer); window.removeEventListener("keydown", handleKey) }
  }, [session])

  useEffect(() => {
    return () => { if (gameRef.current.timer) clearInterval(gameRef.current.timer) }
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px", fontFamily: "sans-serif", color: "#fff" }}>
      <div style={{ width: "100%", maxWidth: 460, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>🐍 贪吃蛇</h1>
        {session ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={session.user.image} style={{ width: 32, height: 32, borderRadius: "50%" }} />
            <span style={{ fontSize: 13, color: "#aaa" }}>{session.user.name}</span>
            <button onClick={() => signOut()} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer" }}>登出</button>
          </div>
        ) : (
          <button onClick={() => signIn("google")} style={{ fontSize: 13, padding: "6px 16px", borderRadius: 6, border: "none", background: "#fff", color: "#000", cursor: "pointer", fontWeight: 500 }}>Google 登录</button>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "8px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#666" }}>分数</div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>{score}</div>
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "8px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#666" }}>状态</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: started ? "#39e07a" : "#666" }}>{started ? "游戏中" : "待开始"}</div>
        </div>
      </div>

      <canvas ref={canvasRef} width={400} height={400} style={{ borderRadius: 10, border: "1px solid #222", display: "block" }} />

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={startGame} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#39e07a", color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          {gameOver ? "再来一次" : started ? "重新开始" : "开始游戏"}
        </button>
      </div>

      {!session && (
        <p style={{ marginTop: 12, fontSize: 13, color: "#555" }}>登录后可保存分数到排行榜</p>
      )}

      <div style={{ marginTop: 28, width: "100%", maxWidth: 400 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#aaa" }}>🏆 排行榜</h2>
        {leaderboard.length === 0 ? (
          <p style={{ color: "#444", fontSize: 13 }}>还没有记录，快来玩吧！</p>
        ) : leaderboard.map((item, i) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#1a1a1a", borderRadius: 8, marginBottom: 8 }}>
            <span style={{ color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#666", fontWeight: 600, width: 24 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{item.user_name}</span>
            <span style={{ fontWeight: 600, color: "#39e07a" }}>{item.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
