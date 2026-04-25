import * as THREE from "three";
import type {
  ThreeQuestCallbacks,
  ThreeQuestConfig,
  ThreeQuestSession,
} from "./playableQuestConfigs";

const TARGET_LADDERS = 10;
const LANE_X = [-4.8, 0, 4.8];

function makeLadderMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.95 });
}

function buildLadder(material: THREE.Material) {
  const group = new THREE.Group();
  const railGeo = new THREE.BoxGeometry(0.18, 5.8, 0.18);
  const rungGeo = new THREE.BoxGeometry(1.45, 0.12, 0.12);
  const leftRail = new THREE.Mesh(railGeo, material);
  const rightRail = new THREE.Mesh(railGeo, material);
  leftRail.position.set(-0.72, 0, 0);
  rightRail.position.set(0.72, 0, 0);
  group.add(leftRail, rightRail);
  for (let i = 0; i < 9; i += 1) {
    const rung = new THREE.Mesh(rungGeo, material);
    rung.position.set(0, -2.2 + i * 0.55, 0);
    group.add(rung);
  }
  return group;
}

function buildAttacker(color: number = 0x79805f) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.9, 0.38),
    new THREE.MeshStandardMaterial({ color }),
  );
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.32, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x62554d }),
  );
  head.position.y = 0.66;
  group.add(body, head);
  return group;
}

export function createHelmsDeepGame(
  host: HTMLElement,
  callbacks: ThreeQuestCallbacks = {},
): ThreeQuestSession {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161b26);
  scene.fog = new THREE.Fog(0x161b26, 10, 38);

  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.innerHTML = "";
  host.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xa8b8d4, 1.7);
  const moon = new THREE.DirectionalLight(0xdbe7ff, 1.5);
  moon.position.set(4, 10, 6);
  moon.castShadow = true;
  scene.add(ambient, moon);

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(18, 2.4, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x8a8178, roughness: 1 }),
  );
  wall.position.set(0, -1.05, 1.2);
  wall.receiveShadow = true;
  scene.add(wall);

  const parapet = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.5, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xbcb3a8, roughness: 0.95 }),
  );
  parapet.position.set(0, 0.35, -0.1);
  scene.add(parapet);

  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 48),
    new THREE.MeshStandardMaterial({ color: 0x38412f, roughness: 1 }),
  );
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, -2.25, -16);
  field.receiveShadow = true;
  scene.add(field);

  const hornburg = new THREE.Mesh(
    new THREE.BoxGeometry(8, 7, 4),
    new THREE.MeshStandardMaterial({ color: 0x556076, roughness: 0.95 }),
  );
  hornburg.position.set(0, 2, -23);
  scene.add(hornburg);

  LANE_X.forEach((x) => {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: 0x4b5870, transparent: true, opacity: 0.28 }),
    );
    marker.position.set(x, -2.18, -7);
    scene.add(marker);
  });

  const laddersGroup = new THREE.Group();
  scene.add(laddersGroup);

  const attackers = Array.from({ length: 5 }, (_, index) => {
    const attacker = buildAttacker(index % 2 === 0 ? 0x7a7f62 : 0x706954);
    attacker.visible = false;
    scene.add(attacker);
    return attacker;
  });

  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.11, 24),
    new THREE.MeshBasicMaterial({ color: 0xf2dfb4, transparent: true, opacity: 0.85 }),
  );
  reticle.position.set(0, 0, -2);
  camera.add(reticle);
  scene.add(camera);

  const clock = new THREE.Clock();
  let rafId: number | null = null;
  let running = false;
  let wallLane = 1;
  let ladder: { lane: number; mesh: THREE.Group; progress: number } | null = null;
  let knockCount = 0;
  let spawnDelay = 0.9;
  let triviaMode = false;
  let pushLatched = false;
  const held = new Set<string>();

  function resize() {
    const width = host.clientWidth || 640;
    const height = host.clientHeight || 360;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function setCameraLane() {
    const targetX = LANE_X[wallLane];
    camera.position.x += (targetX - camera.position.x) * 0.12;
    camera.position.y = 1.22;
    camera.position.z = 4.8;
    camera.lookAt(targetX, 0.15, -7.5);
  }

  function showAttackers(lane: number) {
    attackers.forEach((attacker, index) => {
      attacker.visible = true;
      attacker.position.set(LANE_X[lane] - 1.2 + index * 0.6, 0.25 + (index % 2) * 0.08, 0.6);
    });
  }

  function hideAttackers() {
    attackers.forEach((attacker) => {
      attacker.visible = false;
    });
  }

  function clearLadder(scored = true) {
    if (ladder?.mesh) {
      laddersGroup.remove(ladder.mesh);
    }
    ladder = null;
    triviaMode = false;
    hideAttackers();
    spawnDelay = 0.8;
    if (scored) {
      knockCount += 1;
      callbacks.onProgress?.(knockCount, TARGET_LADDERS);
      callbacks.onStatus?.(`Ladder cleared. ${knockCount} / ${TARGET_LADDERS} knocked off.`);
      if (knockCount >= TARGET_LADDERS) {
        callbacks.onComplete?.("Ten ladders fall. The wall still stands under your watch.");
      }
    }
  }

  function spawnLadder() {
    const lane = Math.floor(Math.random() * LANE_X.length);
    const mesh = buildLadder(makeLadderMaterial());
    mesh.position.set(LANE_X[lane], -0.2, -18);
    mesh.rotation.x = Math.PI * 0.17;
    mesh.traverse((child) => {
      if ((child as THREE.Mesh).castShadow !== undefined) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    laddersGroup.add(mesh);
    ladder = { lane, mesh, progress: 0 };
    callbacks.onStatus?.("A ladder is slamming toward the wall. Line up and shove it off.");
  }

  function handlePush() {
    if (!ladder || triviaMode) return;
    if (wallLane === ladder.lane && ladder.progress >= 0.74 && ladder.progress <= 0.97) {
      clearLadder(true);
      return;
    }
    callbacks.onStatus?.("Bad shove timing. Brace for impact.");
  }

  function onKeyDown(event: KeyboardEvent) {
    held.add(event.key);
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      wallLane = Math.max(0, wallLane - 1);
    }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      wallLane = Math.min(2, wallLane + 1);
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    held.delete(event.key);
    if (["ArrowUp", "w", "W", " ", "Space", "Spacebar", "Enter"].includes(event.key)) {
      pushLatched = false;
    }
  }

  function updateLadder(delta: number) {
    if (triviaMode) return;

    const wantsPush =
      held.has("ArrowUp") ||
      held.has("w") ||
      held.has("W") ||
      held.has(" ") ||
      held.has("Space") ||
      held.has("Spacebar") ||
      held.has("Enter");

    if (wantsPush && !pushLatched) {
      pushLatched = true;
      handlePush();
    }
    if (!wantsPush) pushLatched = false;

    if (!ladder) {
      spawnDelay -= delta;
      if (spawnDelay <= 0) spawnLadder();
      return;
    }

    ladder.progress += delta * 0.17;
    ladder.mesh.position.z = -18 + ladder.progress * 18;
    ladder.mesh.position.y = -0.2 + ladder.progress * 1.15;
    ladder.mesh.rotation.x = Math.PI * (0.17 + ladder.progress * 0.16);

    if (ladder.progress >= 1) {
      ladder.progress = 1;
      triviaMode = true;
      showAttackers(ladder.lane);
      callbacks.onLadderLanded?.();
      callbacks.onStatus?.("The ladder landed. Answer LOTR trivia to strike down 5 attackers.");
    }
  }

  function animate() {
    if (!running) return;
    const delta = Math.min(clock.getDelta(), 0.033);
    setCameraLane();
    updateLadder(delta);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  resize();

  return {
    start() {
      if (running) return;
      running = true;
      clock.start();
      callbacks.onProgress?.(knockCount, TARGET_LADDERS);
      rafId = requestAnimationFrame(animate);
    },
    clearLadderAfterTrivia() {
      clearLadder(true);
    },
    destroy() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.dispose();
      host.innerHTML = "";
    },
  };
}

export const helmsDeepConfig: ThreeQuestConfig = {
  engine: "three",
  controlsText:
    "Move lane with A / D or the arrow keys. Press W, Space, or Enter to shove a ladder.",
  objectiveText:
    "First-person wall defense. Knock off 10 ladders before they land. If one lands, answer LOTR trivia correctly to strike down 5 attackers.",
  introText: "Press start to take the wall.",
  runningText: "Uruk-hai are raising ladders. Hold the parapet.",
  successText: "Ten ladders fall. The wall still stands under your watch.",
  failureText: "The wall is overrun. Take the parapet again.",
  targetLadders: TARGET_LADDERS,
  mount: createHelmsDeepGame,
};
