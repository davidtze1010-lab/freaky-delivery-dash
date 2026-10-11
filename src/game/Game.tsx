import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Scene } from "./Scene";
import { store, useGame, ADDRESSES, pick } from "./store";
import { initAudio } from "./audio";
import scareImg from "@/assets/scare.jpg";

function start() {
  initAudio();
  const s = store.get();
  store.set({ phase: "play", score: 0, time: 60, address: pick(ADDRESSES), runId: s.runId + 1, msg: null });
}

function HUD() {
  const g = useGame();
  return (
    <div dir="rtl" className="pointer-events-none fixed inset-0 z-10 font-body text-foreground">
      {g.phase === "play" && (
        <>
          <div className="absolute right-4 top-4 max-w-md rounded-md border border-border bg-card/80 p-4 backdrop-blur">
            <div className="text-xs text-muted-foreground">הזמנה חדשה מ-MC FREAKY</div>
            <div className="mt-1 font-display text-xl text-primary">{g.address}</div>
            <div className="mt-2 text-sm text-muted-foreground">מרחק: {Math.round(g.dist)} מ׳ (בערך... אולי)</div>
          </div>
          <div className="absolute left-4 top-4 rounded-md border border-border bg-card/80 p-4 text-left backdrop-blur">
            <div className={`font-display text-4xl ${g.time < 15 ? "animate-pulse text-primary" : ""}`}>{Math.ceil(g.time)}</div>
            <div className="text-sm text-muted-foreground">משלוחים: {g.score}</div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <div className="mx-auto h-16 w-16 text-primary transition-transform" style={{ transform: `rotate(${-g.arrow}rad)` }}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L20 20 L12 15 L4 20 Z" /></svg>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{Math.round(Math.abs(g.speed) * 4)} קמ״ש</div>
          </div>
          {g.msg && <div className="absolute inset-x-0 top-1/3 text-center font-display text-4xl text-primary">{g.msg}</div>}
        </>
      )}
      {g.scare && (
        <div key={g.scare.id} className="absolute inset-0 flex flex-col items-center justify-center bg-background animate-jumpscare">
          <img src={scareImg} alt="" width={1024} height={1024} className="h-[80vh] w-auto object-cover" />
          <div className="absolute bottom-16 font-display text-5xl text-primary drop-shadow-lg">{g.scare.text}</div>
        </div>
      )}
      {g.phase !== "play" && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-background/80 p-6">
          <div className="max-w-lg text-center">
            <h1 className="font-display text-7xl text-primary flicker">MC FREAKY</h1>
            {g.phase === "menu" ? (
              <p className="mt-4 text-muted-foreground">
                אתה השליח היחיד שנשאר. הלקוחות... לא בסדר. הכתובות לא הגיוניות. אל תעצור. אל תסתכל להם בעיניים.
              </p>
            ) : (
              <p className="mt-4 text-xl">נגמר הזמן. מסרת {g.score} משלוחים לפני שהם תפסו אותך.</p>
            )}
            <p className="mt-4 text-sm text-muted-foreground">W/↑ גז · S/↓ ברקס · A/D או ←/→ היגוי · עקוב אחרי האור האדום</p>
            <button onClick={start} className="mt-6 rounded-md bg-primary px-8 py-3 font-display text-2xl text-primary-foreground transition hover:scale-105">
              {g.phase === "menu" ? "צא למשלוח" : "עוד משמרת"}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">⚠ מכיל צעקות ו-jump scares. מומלץ עם אוזניות.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function Game() {
  return (
    <div className="fixed inset-0 bg-background">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 4, -12], fov: 65 }}>
        <color attach="background" args={["#0b0d0c"]} />
        <fog attach="fog" args={["#0b0d0c", 8, 55]} />
        <ambientLight intensity={0.35} color="#7f8a99" />
        <hemisphereLight args={["#3b4a5c", "#1a0a0a", 0.5]} />
        <directionalLight position={[30, 40, -20]} intensity={0.5} color="#9fb3c8" />
        <Environment resolution={64}>
          <Lightformer intensity={0.6} position={[0, 5, 0]} scale={[10, 10, 1]} color="#556" />
          <Lightformer intensity={0.4} color="#a33" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <Scene />
      </Canvas>
      <HUD />
    </div>
  );
}
