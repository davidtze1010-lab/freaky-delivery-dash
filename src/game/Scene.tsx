import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { store, ADDRESSES, SCREAMS, pick } from "./store";
import { scream, thud, ding, setEngine } from "./audio";

const ACCEL = 14;
const MAX = 22;
const DRAG = 0.8;
const TURN = 2.2;
const BOUND = 92;
const BLOCK = 20;
const HALF = 7.5;

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function inBuilding(x: number, z: number) {
  const cx = Math.floor(x / BLOCK) * BLOCK + 10;
  const cz = Math.floor(z / BLOCK) * BLOCK + 10;
  return Math.abs(x - cx) < HALF && Math.abs(z - cz) < HALF;
}

function randomTarget() {
  const i = Math.floor(Math.random() * 9) - 4;
  const j = Math.floor(Math.random() * 9) - 5;
  return Math.random() < 0.5
    ? new THREE.Vector3(i * BLOCK, 0, j * BLOCK + 10)
    : new THREE.Vector3(j * BLOCK + 10, 0, i * BLOCK);
}

function randomRoadPoint() {
  const along = (Math.random() * 2 - 1) * 85;
  const line = (Math.floor(Math.random() * 9) - 4) * BLOCK + (Math.random() - 0.5) * 3;
  return Math.random() < 0.5 ? [line, along] : [along, line];
}

function useCanvasTex(draw: (c: CanvasRenderingContext2D) => void, size = 256, rep = 1) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d")!);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep, rep);
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function City() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const win = useCanvasTex((g) => {
    g.fillStyle = "#1a1714";
    g.fillRect(0, 0, 256, 256);
    for (let y = 8; y < 256; y += 32)
      for (let x = 8; x < 256; x += 28) {
        const r = Math.random();
        g.fillStyle = r < 0.12 ? "#d9a441" : r < 0.16 ? "#8f1d1d" : r < 0.2 ? "#4b6b5a" : "#0c0b0a";
        g.fillRect(x, y, 16, 20);
      }
  });
  const blocks = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = -5; i < 5; i++)
      for (let j = -5; j < 5; j++) arr.push([i * BLOCK + 10, j * BLOCK + 10, 6 + rand(i * 31 + j) * 22]);
    return arr;
  }, []);
  useEffect(() => {
    const m = new THREE.Matrix4();
    blocks.forEach(([x, z, h], k) => {
      m.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(14, h, 14));
      ref.current!.setMatrixAt(k, m);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [blocks]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, blocks.length]} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial map={win} emissiveMap={win} emissive="#ffffff" emissiveIntensity={0.9} roughness={0.9} />
    </instancedMesh>
  );
}

function Ground() {
  const asphalt = useCanvasTex(
    (g) => {
      g.fillStyle = "#121212";
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3000; i++) {
        const v = 10 + Math.random() * 25;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
      g.fillStyle = "rgba(80,10,10,0.5)";
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 10, 0, 7);
        g.fill();
      }
    },
    256,
    40,
  );
  const lines = [];
  for (let k = -4; k <= 4; k++) {
    lines.push(
      <mesh key={"x" + k} position={[k * BLOCK, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.15, 190]} />
        <meshBasicMaterial color="#6b5a2a" />
      </mesh>,
      <mesh key={"z" + k} position={[0, 0.02, k * BLOCK]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[190, 0.15]} />
        <meshBasicMaterial color="#6b5a2a" />
      </mesh>,
    );
  }
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial map={asphalt} roughness={0.85} metalness={0.1} />
      </mesh>
      {lines}
    </>
  );
}

function StreetLights() {
  const pts = useMemo(() => {
    const a: [number, number][] = [];
    for (let i = -4; i <= 4; i += 2) for (let j = -4; j <= 4; j += 2) a.push([i * BLOCK + 3, j * BLOCK + 3]);
    return a;
  }, []);
  return (
    <>
      {pts.map(([x, z], k) => (
        <group key={k} position={[x, 0, z]}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 5]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 5, 0]}>
            <sphereGeometry args={[0.3]} />
            <meshBasicMaterial color={k % 5 === 0 ? "#ff3322" : "#ffb35c"} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Bike() {
  return (
    <group>
      {[0.9, -0.9].map((z) => (
        <mesh key={z} position={[0, 0.4, z]} rotation-z={Math.PI / 2} castShadow>
          <torusGeometry args={[0.35, 0.12, 8, 16]} />
          <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.45, 0.4, 1.5]} />
        <meshStandardMaterial color="#7a0f0f" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* delivery box */}
      <mesh position={[0, 1.3, -0.65]} castShadow>
        <boxGeometry args={[0.8, 0.7, 0.7]} />
        <meshStandardMaterial color="#c9a227" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.3, -0.29]}>
        <planeGeometry args={[0.5, 0.4]} />
        <meshBasicMaterial color="#8f1d1d" />
      </mesh>
      {/* rider */}
      <mesh position={[0, 1.45, 0.05]} castShadow>
        <capsuleGeometry args={[0.25, 0.6]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[0, 2.05, 0.15]} castShadow>
        <sphereGeometry args={[0.24]} />
        <meshStandardMaterial color="#8f1d1d" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.95, 0.8]}>
        <sphereGeometry args={[0.12]} />
        <meshBasicMaterial color="#fff6d0" />
      </mesh>
      <pointLight position={[0, 1.2, 4]} intensity={30} distance={18} color="#fff1c2" />
    </group>
  );
}

function Creep({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <mesh position={[0, 1.6, 0]}>
        <capsuleGeometry args={[0.3, 2]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.35]} />
        <meshStandardMaterial color="#cfc7b8" />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 3.15, 0.3]}>
          <sphereGeometry args={[0.07]} />
          <meshBasicMaterial color="#ff1a1a" />
        </mesh>
      ))}
      <pointLight position={[0, 3, 1]} intensity={visible ? 15 : 0} distance={6} color="#ff2a2a" />
    </group>
  );
}

export function Scene() {
  const { camera } = useThree();
  const bike = useRef<THREE.Group>(null);
  const creep = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const sim = useRef({
    pos: new THREE.Vector3(0, 0, -5),
    h: 0,
    v: 0,
    target: randomTarget(),
    nextScare: 8,
    creepT: 0,
    shake: 0,
    hud: 0,
    confuse: 0,
    lastRun: -1,
  });
  const [obstacles, setObstacles] = useState<number[][]>([]);
  const obsRef = useRef<number[][]>([]);
  const [creepOn, setCreepOn] = useState(false);

  useEffect(() => {
    const d = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const u = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    return () => {
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
    };
  }, []);

  const spawnObstacles = () => {
    const a = Array.from({ length: 40 }, () => [...randomRoadPoint(), Math.floor(Math.random() * 3)]);
    obsRef.current = a;
    setObstacles(a);
  };

  const triggerScare = (text: string) => {
    const s = sim.current;
    store.set({ scare: { text, id: Math.random() } });
    scream();
    s.shake = 1;
    s.v *= 0.2;
    s.creepT = 1.6;
    setCreepOn(true);
    if (creep.current) {
      const f = new THREE.Vector3(Math.sin(s.h), 0, Math.cos(s.h));
      creep.current.position.copy(s.pos).addScaledVector(f, 3.5);
      creep.current.rotation.y = s.h + Math.PI;
    }
    setTimeout(() => store.set({ scare: null }), 900);
  };

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const s = sim.current;
    const st = store.get();

    if (st.runId !== s.lastRun) {
      s.lastRun = st.runId;
      s.pos.set(0, 0, -5);
      s.h = 0;
      s.v = 0;
      s.target = randomTarget();
      s.nextScare = 8;
      spawnObstacles();
    }

    if (st.phase === "play") {
      const k = keys.current;
      const up = k.KeyW || k.ArrowUp;
      const down = k.KeyS || k.ArrowDown;
      const left = k.KeyA || k.ArrowLeft;
      const right = k.KeyD || k.ArrowRight;
      if (up) s.v += ACCEL * dt;
      if (down) s.v -= ACCEL * 1.4 * dt;
      s.v = THREE.MathUtils.clamp(s.v, -6, MAX);
      s.v *= Math.exp(-DRAG * dt);
      const steer = (left ? 1 : 0) - (right ? 1 : 0);
      s.h += steer * TURN * dt * Math.min(1, Math.abs(s.v) / 5) * Math.sign(s.v || 1);

      const f = new THREE.Vector3(Math.sin(s.h), 0, Math.cos(s.h));
      const next = s.pos.clone().addScaledVector(f, s.v * dt);
      next.x = THREE.MathUtils.clamp(next.x, -BOUND, BOUND);
      next.z = THREE.MathUtils.clamp(next.z, -BOUND, BOUND);
      if (inBuilding(next.x, next.z)) {
        if (Math.abs(s.v) > 6) thud();
        s.v *= -0.3;
      } else s.pos.copy(next);

      // obstacles
      const obs = obsRef.current;
      for (let i = 0; i < obs.length; i++) {
        const o = obs[i];
        if (Math.hypot(o[0] - s.pos.x, o[1] - s.pos.z) < 1.4) {
          thud();
          s.v = -s.v * 0.3;
          s.shake = 0.6;
          const [x, z] = randomRoadPoint();
          obs[i] = [x, z, o[2]];
          setObstacles([...obs]);
          store.set({ time: Math.max(0, st.time - 4), msg: "בום! 4- שניות" });
          setTimeout(() => store.set({ msg: null }), 1200);
          break;
        }
      }

      // random scares
      s.nextScare -= dt;
      if (s.nextScare <= 0) {
        s.nextScare = 7 + Math.random() * 10;
        triggerScare(pick(SCREAMS));
      }

      // delivery
      const dist = Math.hypot(s.target.x - s.pos.x, s.target.z - s.pos.z);
      if (dist < 4) {
        ding();
        const old = s.target;
        do s.target = randomTarget();
        while (s.target.distanceTo(old) < 40);
        store.set({ score: st.score + 1, time: st.time + 22, address: pick(ADDRESSES) });
        setTimeout(() => triggerScare(pick(SCREAMS)), 300);
        if (Math.random() < 0.5) s.confuse = 5;
      }

      const time = st.time - dt;
      s.confuse -= dt;
      s.hud += dt;
      if (s.hud > 0.08) {
        s.hud = 0;
        let arrow = Math.atan2(s.target.x - s.pos.x, s.target.z - s.pos.z) - s.h;
        if (s.confuse > 0) arrow += Math.sin(performance.now() / 150) * 2.5;
        store.set({ time: Math.max(0, time), dist, arrow, speed: s.v });
      } else store.get().time = Math.max(0, time);
      if (time <= 0) store.set({ phase: "over", time: 0 });
      setEngine(s.v);
    } else setEngine(0);

    // creep timer
    if (s.creepT > 0) {
      s.creepT -= dt;
      if (s.creepT <= 0) setCreepOn(false);
    }

    if (bike.current) {
      bike.current.position.copy(s.pos);
      bike.current.rotation.set(0, s.h, 0);
      bike.current.rotateZ(-((keys.current.KeyD || keys.current.ArrowRight ? 1 : 0) - (keys.current.KeyA || keys.current.ArrowLeft ? 1 : 0)) * 0.25 * Math.min(1, Math.abs(s.v) / 10));
    }
    if (beacon.current) {
      beacon.current.position.copy(s.target);
      beacon.current.rotation.y += dt;
    }

    const f = new THREE.Vector3(Math.sin(s.h), 0, Math.cos(s.h));
    const desired = s.pos.clone().addScaledVector(f, -7).add(new THREE.Vector3(0, 3.4, 0));
    camera.position.lerp(desired, 1 - Math.exp(-5 * dt));
    s.shake *= Math.exp(-4 * dt);
    camera.position.x += (Math.random() - 0.5) * s.shake * 0.6;
    camera.position.y += (Math.random() - 0.5) * s.shake * 0.6;
    camera.lookAt(s.pos.clone().addScaledVector(f, 5).add(new THREE.Vector3(0, 1.2, 0)));
  });

  return (
    <>
      <Ground />
      <City />
      <StreetLights />
      <group ref={bike}>
        <Bike />
      </group>
      <group ref={creep}>
        <Creep visible={creepOn} />
      </group>
      <group ref={beacon}>
        <mesh position={[0, 15, 0]}>
          <cylinderGeometry args={[0.4, 1.4, 30, 12, 1, true]} />
          <meshBasicMaterial color="#ff2a2a" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <octahedronGeometry args={[0.8]} />
          <meshBasicMaterial color="#ff4d2e" />
        </mesh>
        <pointLight position={[0, 2, 0]} intensity={25} distance={12} color="#ff2a2a" />
      </group>
      {obstacles.map(([x, z, t], i) => (
        <group key={i} position={[x, 0, z]}>
          {t === 0 ? (
            <mesh position={[0, 0.45, 0]} castShadow>
              <coneGeometry args={[0.35, 0.9, 10]} />
              <meshStandardMaterial color="#d2561c" />
            </mesh>
          ) : t === 1 ? (
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[2.2, 1, 0.3]} />
              <meshStandardMaterial color="#d9d0b8" emissive="#3a0000" />
            </mesh>
          ) : (
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.45, 0.45, 0.9, 12]} />
              <meshStandardMaterial color="#3d4a2e" metalness={0.5} roughness={0.5} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
