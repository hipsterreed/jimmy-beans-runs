import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ChapterMeta } from "./chapters";

type BookProps = {
  chapter: ChapterMeta;
  onOpen: () => void;
};

const OPEN_DELAY_S = 1.4;
const OPEN_DURATION_S = 2.6;

export function Book({ chapter, onOpen }: BookProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.6, 6.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ---- Lighting: warm candlelight + cool rim ----
    scene.add(new THREE.AmbientLight(0x2a1a10, 0.6));

    const candle = new THREE.PointLight(0xffb060, 2.4, 14, 1.6);
    candle.position.set(2.5, 3.2, 3.2);
    candle.castShadow = true;
    candle.shadow.mapSize.set(1024, 1024);
    scene.add(candle);

    const fill = new THREE.DirectionalLight(0xffd9a8, 0.55);
    fill.position.set(-3, 2, 3);
    scene.add(fill);

    const rim = new THREE.PointLight(0x6a83b0, 0.6, 10);
    rim.position.set(-3, 1.5, -2);
    scene.add(rim);

    // ---- Procedural textures ----
    const leatherTex = makeLeatherTexture();
    const leatherNormal = makeLeatherNormalMap();
    const pageEdgeTex = makePageEdgeTexture();
    const pageFaceTex = makePageFaceTexture();
    const coverFrontTex = makeCoverFrontTexture(chapter.title);

    [leatherTex, leatherNormal, pageEdgeTex, pageFaceTex, coverFrontTex].forEach((t) => {
      t.anisotropy = 8;
    });

    // ---- Book geometry ----
    const W = 2.6; // cover width
    const H = 3.6; // cover height
    const T = 0.7; // total page-stack thickness
    const C = 0.08; // cover thickness

    const book = new THREE.Group();
    book.rotation.x = -0.18;
    scene.add(book);

    const leatherMat = new THREE.MeshStandardMaterial({
      map: leatherTex,
      normalMap: leatherNormal,
      normalScale: new THREE.Vector2(0.6, 0.6),
      color: 0x3a1f10,
      roughness: 0.78,
      metalness: 0.05,
    });

    // Front cover with gilt title on the outer face
    const frontCoverMats = [
      leatherMat, // +x edge
      leatherMat, // -x edge
      leatherMat, // +y top edge
      leatherMat, // -y bottom edge
      new THREE.MeshStandardMaterial({
        map: coverFrontTex,
        normalMap: leatherNormal,
        normalScale: new THREE.Vector2(0.45, 0.45),
        color: 0x4a2614,
        roughness: 0.7,
        metalness: 0.15,
      }), // +z outer face
      leatherMat, // -z inner face
    ];

    // Back cover (no embossed title)
    const backCoverMat = leatherMat;

    // Page stack — a thick block textured with edge gilt on top/bottom/right and page paper on faces
    const pageEdgeMat = new THREE.MeshStandardMaterial({
      map: pageEdgeTex,
      color: 0xd9b66a,
      roughness: 0.55,
      metalness: 0.35,
    });
    const pageFaceMat = new THREE.MeshStandardMaterial({
      map: pageFaceTex,
      color: 0xe8d3a0,
      roughness: 0.95,
    });

    const pagesMats = [
      pageEdgeMat, // +x (fore-edge — gilt)
      pageEdgeMat, // -x (spine side, hidden inside)
      pageEdgeMat, // +y top edge — gilt
      pageEdgeMat, // -y bottom edge — gilt
      pageFaceMat, // +z (top face — when cover is open)
      pageFaceMat, // -z (bottom face)
    ];

    const pagesGeo = new THREE.BoxGeometry(W - 0.12, H - 0.18, T);
    const pages = new THREE.Mesh(pagesGeo, pagesMats);
    pages.position.set(0.06, 0, 0);
    pages.castShadow = true;
    pages.receiveShadow = true;
    book.add(pages);

    // Spine — curved-ish via a slightly wider box behind the pages
    const spineGeo = new THREE.BoxGeometry(0.18, H, T + 2 * C);
    const spine = new THREE.Mesh(spineGeo, leatherMat);
    spine.position.set(-W / 2 - 0.03, 0, 0);
    spine.castShadow = true;
    spine.receiveShadow = true;
    book.add(spine);

    // Back cover (static, sits below the page stack)
    const backCoverGeo = new THREE.BoxGeometry(W, H, C);
    const backCover = new THREE.Mesh(backCoverGeo, backCoverMat);
    backCover.position.set(0, 0, -T / 2 - C / 2);
    backCover.castShadow = true;
    backCover.receiveShadow = true;
    book.add(backCover);

    // Front cover, pivoted so it opens around the spine edge
    const coverPivot = new THREE.Group();
    coverPivot.position.set(-W / 2, 0, T / 2 + C / 2);
    book.add(coverPivot);

    const frontCoverGeo = new THREE.BoxGeometry(W, H, C);
    const frontCover = new THREE.Mesh(frontCoverGeo, frontCoverMats);
    frontCover.position.set(W / 2, 0, 0);
    frontCover.castShadow = true;
    frontCover.receiveShadow = true;
    coverPivot.add(frontCover);

    // A subtle ground shadow catcher
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -H / 2 - 0.05;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // ---- Sizing ----
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---- Animation loop ----
    const start = performance.now();
    let raf = 0;
    let openedFired = false;

    const easeInOutCubic = (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const tick = () => {
      const t = (performance.now() - start) / 1000;

      // Idle float
      book.position.y = Math.sin(t * 0.6) * 0.05;
      book.rotation.z = Math.sin(t * 0.4) * 0.012;

      // Cover opens once
      const p = Math.min(Math.max((t - OPEN_DELAY_S) / OPEN_DURATION_S, 0), 1);
      const eased = easeInOutCubic(p);
      coverPivot.rotation.y = -eased * Math.PI * 0.86;

      // Candle flicker
      candle.intensity = 2.2 + Math.sin(t * 9.3) * 0.18 + Math.sin(t * 3.7) * 0.12;

      if (!openedFired && p >= 1) {
        openedFired = true;
        setReady(true);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      [pagesGeo, spineGeo, backCoverGeo, frontCoverGeo, shadowGeo].forEach((g) => g.dispose());
      [leatherMat, pageEdgeMat, pageFaceMat, shadowMat, ...frontCoverMats].forEach((m) =>
        m.dispose()
      );
      [leatherTex, leatherNormal, pageEdgeTex, pageFaceTex, coverFrontTex].forEach((t) =>
        t.dispose()
      );
    };
  }, [chapter.title]);

  return (
    <div
      ref={mountRef}
      className={`book-canvas ${ready && chapter.available ? "is-ready" : ""}`}
      onClick={() => {
        if (ready && chapter.available) onOpen();
      }}
      role={ready && chapter.available ? "button" : undefined}
      aria-label={ready && chapter.available ? `Open ${chapter.title}` : undefined}
    />
  );
}

// ---------- Procedural textures ----------

function makeLeatherTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  // Base leather
  const grad = ctx.createRadialGradient(size / 2, size / 2, 100, size / 2, size / 2, size * 0.7);
  grad.addColorStop(0, "#5a311a");
  grad.addColorStop(1, "#2a1308");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Grain noise
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 36;
    img.data[i] = clamp(img.data[i] + n);
    img.data[i + 1] = clamp(img.data[i + 1] + n * 0.7);
    img.data[i + 2] = clamp(img.data[i + 2] + n * 0.4);
  }
  ctx.putImageData(img, 0, 0);

  // Pebbled dabs for leather grain
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 2.5;
    const a = Math.random() * 0.18;
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(20,10,5,${a})` : `rgba(120,80,40,${a * 0.7})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cracks / scratches
  ctx.strokeStyle = "rgba(15,8,4,0.5)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    const segs = 6 + Math.floor(Math.random() * 6);
    for (let j = 0; j < segs; j++) {
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Worn highlights
  for (let i = 0; i < 24; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 30 + Math.random() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(180,130,70,0.12)");
    g.addColorStop(1, "rgba(180,130,70,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeLeatherNormalMap(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#8080ff";
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 50;
    img.data[i] = clamp(128 + n);
    img.data[i + 1] = clamp(128 + n * 0.9);
    img.data[i + 2] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // Larger bumps
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 5;
    const dx = Math.random() < 0.5 ? -30 : 30;
    const dy = Math.random() < 0.5 ? -30 : 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgb(${128 + dx},${128 + dy},255)`);
    g.addColorStop(1, "rgba(128,128,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makePageEdgeTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // Gilt base
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#caa05a");
  grad.addColorStop(0.5, "#e9c97a");
  grad.addColorStop(1, "#a17828");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Page lines
  ctx.strokeStyle = "rgba(80,55,20,0.35)";
  ctx.lineWidth = 0.6;
  for (let y = 0; y < h; y += 1.5) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.random() * 0.3);
    ctx.lineTo(w, y + Math.random() * 0.3);
    ctx.stroke();
  }

  // Tarnish patches
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 20 + Math.random() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(60,40,15,0.25)");
    g.addColorStop(1, "rgba(60,40,15,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePageFaceTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  // Aged parchment
  const grad = ctx.createRadialGradient(size / 2, size / 2, 100, size / 2, size / 2, size * 0.8);
  grad.addColorStop(0, "#f0dba5");
  grad.addColorStop(1, "#c8a767");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Foxing stains
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 6 + Math.random() * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(120,70,30,${0.15 + Math.random() * 0.2})`);
    g.addColorStop(1, "rgba(120,70,30,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Edge darkening
  const edge = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.75);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(60,30,10,0.55)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCoverFrontTexture(title: string): THREE.CanvasTexture {
  const w = 768;
  const h = 1024;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // Leather base — same recipe as makeLeatherTexture but stretched
  const grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, h * 0.7);
  grad.addColorStop(0, "#5a311a");
  grad.addColorStop(1, "#28120a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 30;
    img.data[i] = clamp(img.data[i] + n);
    img.data[i + 1] = clamp(img.data[i + 1] + n * 0.7);
    img.data[i + 2] = clamp(img.data[i + 2] + n * 0.4);
  }
  ctx.putImageData(img, 0, 0);

  // Decorative gilt border
  ctx.strokeStyle = "#d9b066";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.strokeRect(40, 40, w - 80, h - 80);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(58, 58, w - 116, h - 116);

  // Corner flourishes
  ctx.fillStyle = "#d9b066";
  const corners: [number, number][] = [
    [56, 56],
    [w - 56, 56],
    [56, h - 56],
    [w - 56, h - 56],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#3a1f0c";
    ctx.fill();
    ctx.fillStyle = "#d9b066";
  }

  // Center emblem — a simple sunburst circle
  ctx.shadowBlur = 8;
  ctx.translate(w / 2, h / 2);
  ctx.strokeStyle = "#d9b066";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 62, Math.sin(a) * 62);
    ctx.lineTo(Math.cos(a) * 86, Math.sin(a) * 86);
    ctx.stroke();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Title
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#e9c98a";
  ctx.font = `bold 48px "Cinzel","Cormorant Garamond",Georgia,serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("THE BOOK", w / 2, h * 0.22);
  ctx.fillText("OF RUNS", w / 2, h * 0.3);

  ctx.font = `italic 30px "Cormorant Garamond",Georgia,serif`;
  ctx.fillStyle = "#c79a55";
  const safeTitle = title.length > 36 ? title.slice(0, 33) + "..." : title;
  ctx.fillText(safeTitle, w / 2, h * 0.78);

  // Random scratches on top
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(15,8,4,0.55)";
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    let x = Math.random() * w;
    let y = Math.random() * h;
    ctx.moveTo(x, y);
    const segs = 4 + Math.floor(Math.random() * 5);
    for (let j = 0; j < segs; j++) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}
