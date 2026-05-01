import * as THREE from "three";

function makeCanvasTexture(draw, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function buildHanTextures() {
  const body = makeCanvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#d3a17b";
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.23, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3f251a";
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.2, size * 0.13, Math.PI, Math.PI * 2);
    ctx.lineTo(size * 0.63, size * 0.25);
    ctx.quadraticCurveTo(size * 0.5, size * 0.14, size * 0.37, size * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f4efe6";
    roundedRect(ctx, size * 0.37, size * 0.3, size * 0.26, size * 0.18, size * 0.04);
    ctx.fill();

    ctx.fillStyle = "#0f1723";
    roundedRect(ctx, size * 0.3, size * 0.33, size * 0.4, size * 0.36, size * 0.05);
    ctx.fill();

    ctx.fillStyle = "#365f7d";
    roundedRect(ctx, size * 0.41, size * 0.37, size * 0.18, size * 0.19, size * 0.03);
    ctx.fill();

    ctx.fillStyle = "#202c3b";
    roundedRect(ctx, size * 0.3, size * 0.66, size * 0.17, size * 0.2, size * 0.04);
    ctx.fill();
    roundedRect(ctx, size * 0.53, size * 0.66, size * 0.17, size * 0.2, size * 0.04);
    ctx.fill();

    ctx.fillStyle = "#f4efe6";
    roundedRect(ctx, size * 0.26, size * 0.34, size * 0.1, size * 0.3, size * 0.04);
    ctx.fill();
    roundedRect(ctx, size * 0.64, size * 0.34, size * 0.1, size * 0.3, size * 0.04);
    ctx.fill();

    ctx.fillStyle = "#d4b07d";
    roundedRect(ctx, size * 0.24, size * 0.6, size * 0.12, size * 0.1, size * 0.05);
    ctx.fill();
    roundedRect(ctx, size * 0.64, size * 0.6, size * 0.12, size * 0.1, size * 0.05);
    ctx.fill();

    ctx.fillStyle = "#6a3c23";
    roundedRect(ctx, size * 0.4, size * 0.58, size * 0.2, size * 0.04, size * 0.01);
    ctx.fill();
  });

  const blaster = makeCanvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.translate(size * 0.5, size * 0.55);
    ctx.rotate(-0.28);
    ctx.translate(-size * 0.5, -size * 0.55);

    ctx.fillStyle = "#566578";
    roundedRect(ctx, size * 0.2, size * 0.5, size * 0.38, size * 0.09, size * 0.03);
    ctx.fill();
    ctx.fillStyle = "#2f3744";
    roundedRect(ctx, size * 0.5, size * 0.47, size * 0.2, size * 0.05, size * 0.02);
    ctx.fill();
    ctx.fillStyle = "#7a5137";
    roundedRect(ctx, size * 0.27, size * 0.57, size * 0.1, size * 0.16, size * 0.03);
    ctx.fill();
    ctx.fillStyle = "#ffd46d";
    roundedRect(ctx, size * 0.67, size * 0.48, size * 0.07, size * 0.03, size * 0.01);
    ctx.fill();
  });

  const shadow = makeCanvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    const gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.08, size * 0.5, size * 0.5, size * 0.38);
    gradient.addColorStop(0, "rgba(0,0,0,0.55)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(size * 0.5, size * 0.56, size * 0.3, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const glow = makeCanvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    const gradient = ctx.createRadialGradient(size * 0.5, size * 0.46, size * 0.08, size * 0.5, size * 0.48, size * 0.42);
    gradient.addColorStop(0, "rgba(255, 216, 111, 0.42)");
    gradient.addColorStop(0.52, "rgba(123, 227, 255, 0.22)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });

  return { body, blaster, shadow, glow };
}

export function createHanSoloViewer(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.3, 6.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xcfdcff, 1.75);
  scene.add(ambient);

  const rim = new THREE.DirectionalLight(0x8bdcff, 2.2);
  rim.position.set(-1.8, 2.3, 3.6);
  scene.add(rim);

  const warm = new THREE.DirectionalLight(0xffd46d, 1.3);
  warm.position.set(2.4, 1.4, 2.6);
  scene.add(warm);

  const group = new THREE.Group();
  scene.add(group);

  const textures = buildHanTextures();
  const plane = new THREE.PlaneGeometry(3.4, 3.4);

  const glow = new THREE.Mesh(
    plane,
    new THREE.MeshBasicMaterial({
      map: textures.glow,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    }),
  );
  glow.position.z = -0.4;
  group.add(glow);

  const shadow = new THREE.Mesh(
    plane,
    new THREE.MeshBasicMaterial({
      map: textures.shadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    }),
  );
  shadow.position.set(0, -1.38, -0.2);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.2, 0.65, 1);
  group.add(shadow);

  const body = new THREE.Mesh(
    plane,
    new THREE.MeshStandardMaterial({
      map: textures.body,
      transparent: true,
      metalness: 0.08,
      roughness: 0.72,
    }),
  );
  body.position.z = 0.18;
  group.add(body);

  const blaster = new THREE.Mesh(
    plane,
    new THREE.MeshStandardMaterial({
      map: textures.blaster,
      transparent: true,
      metalness: 0.2,
      roughness: 0.46,
    }),
  );
  blaster.position.set(0.18, -0.05, 0.44);
  blaster.scale.set(0.88, 0.88, 1);
  group.add(blaster);

  const backdrop = new THREE.Mesh(
    new THREE.RingGeometry(1.6, 1.92, 48),
    new THREE.MeshBasicMaterial({
      color: 0x7ee2ff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    }),
  );
  backdrop.position.z = -0.55;
  backdrop.rotation.z = 0.18;
  group.add(backdrop);

  const core = new THREE.Mesh(
    new THREE.CircleGeometry(0.06, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd46d, transparent: true, opacity: 0.85 }),
  );
  core.position.set(0.95, 1.05, -0.3);
  group.add(core);

  let hovered = false;
  let rafId = 0;

  function resize() {
    const width = container.clientWidth || 520;
    const height = container.clientHeight || 420;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function onPointerEnter() {
    hovered = true;
  }

  function onPointerLeave() {
    hovered = false;
  }

  function animate(time) {
    const t = time * 0.001;
    const targetY = hovered ? -0.52 : -0.18;
    const targetX = hovered ? 0.1 : 0.03;
    const targetZ = hovered ? 0.18 : 0;

    group.rotation.y += (targetY - group.rotation.y) * 0.08;
    group.rotation.x += (targetX - group.rotation.x) * 0.08;
    group.rotation.z += (targetZ - group.rotation.z) * 0.06;
    group.position.y = Math.sin(t * 1.7) * 0.08;

    body.position.z = 0.18 + Math.sin(t * 1.6) * 0.015;
    blaster.rotation.z += ((hovered ? -0.08 : 0.04) - blaster.rotation.z) * 0.08;
    blaster.position.y = -0.05 + Math.sin(t * 2.3) * 0.03;
    glow.material.opacity += (((hovered ? 0.96 : 0.75) - glow.material.opacity) * 0.1);
    backdrop.rotation.z += 0.0022;
    shadow.scale.x += (((hovered ? 1.06 : 1.2) - shadow.scale.x) * 0.06);
    shadow.scale.y += (((hovered ? 0.56 : 0.65) - shadow.scale.y) * 0.06);

    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(animate);
  }

  resize();
  container.addEventListener("pointerenter", onPointerEnter);
  container.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("resize", resize);
  rafId = window.requestAnimationFrame(animate);

  return {
    destroy() {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      container.removeEventListener("pointerenter", onPointerEnter);
      container.removeEventListener("pointerleave", onPointerLeave);
      renderer.dispose();
      plane.dispose();
      body.material.dispose();
      blaster.material.dispose();
      glow.material.dispose();
      shadow.material.dispose();
      backdrop.geometry.dispose();
      backdrop.material.dispose();
      core.geometry.dispose();
      core.material.dispose();
      textures.body.dispose();
      textures.blaster.dispose();
      textures.shadow.dispose();
      textures.glow.dispose();
      container.replaceChildren();
    },
  };
}
