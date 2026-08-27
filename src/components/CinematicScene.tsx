"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = { progress: number; activeEvent: number };

const route = [
  new THREE.Vector3(17, 11, -43), new THREE.Vector3(14, 7, -31), new THREE.Vector3(10, 4, -20),
  new THREE.Vector3(2, 1.5, -5), new THREE.Vector3(-8, 0.2, 10), new THREE.Vector3(-16, -1, 26), new THREE.Vector3(-24, -2, 43),
];

function ribbonGeometry(curve: THREE.CatmullRomCurve3, width: number, segments = 180) {
  const vertices: number[] = []; const indices: number[] = [];
  for (let i = 0; i <= segments; i++) { const t = i / segments; const point = curve.getPointAt(t); const tangent = curve.getTangentAt(t); const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2); const wave = Math.sin(t * 55) * .08; vertices.push(point.x + side.x, point.y + .22 + wave, point.z + side.z, point.x - side.x, point.y + .22 - wave, point.z - side.z); if (i < segments) { const n = i * 2; indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); } }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function makeHouse(wall: THREE.Material, roof: THREE.Material, glass: THREE.Material) {
  const house = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.8, 2.2), wall); body.position.y = .9; body.castShadow = true; house.add(body);
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.15, 4), roof); roofMesh.position.y = 2.35; roofMesh.rotation.y = Math.PI / 4; roofMesh.castShadow = true; house.add(roofMesh);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(.42, .8), new THREE.MeshStandardMaterial({ color: 0x493426, roughness: .85 })); door.position.set(0, .52, 1.105); house.add(door);
  [-.55, .55].forEach((x) => { const window = new THREE.Mesh(new THREE.PlaneGeometry(.38, .42), glass); window.position.set(x, 1.18, 1.11); house.add(window); }); return house;
}

export default function CinematicScene({ progress, activeEvent }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const state = useRef({ progress, activeEvent, changedAt: 0 });
  useEffect(() => { state.current = { progress, activeEvent, changedAt: performance.now() }; }, [progress, activeEvent]);

  useEffect(() => {
    const host = mount.current; if (!host) return;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9dc4d2); scene.fog = new THREE.FogExp2(0xa7c0c1, 0.0065);
    const camera = new THREE.PerspectiveCamera(48, host.clientWidth / host.clientHeight, 0.1, 300); camera.position.set(44, 42, 42);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); renderer.setSize(host.clientWidth, host.clientHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xd9f1ff, 0x40512f, 2.35)); const sun = new THREE.DirectionalLight(0xfff1cf, 3.4); sun.position.set(-30, 55, -25); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);

    const terrainGeometry = new THREE.PlaneGeometry(120, 120, 100, 100); terrainGeometry.rotateX(-Math.PI / 2); const position = terrainGeometry.attributes.position;
    for (let i = 0; i < position.count; i++) { const x = position.getX(i), z = position.getZ(i); const valley = Math.max(0, Math.abs(x - (8 - z * .42)) * .15); const ridges = Math.sin(x * .13) * 2.2 + Math.cos(z * .11) * 1.8 + Math.sin((x + z) * .21) * 1.2; const northRise = Math.max(0, (-z - 8) * .23); position.setY(i, valley + ridges + northRise - 2); }
    const terrainColors: number[] = []; const green = new THREE.Color(0x617a45), rock = new THREE.Color(0x77766a), snow = new THREE.Color(0xdde5df); for (let i = 0; i < position.count; i++) { const y = position.getY(i); const blend = THREE.MathUtils.clamp((y - 7) / 16, 0, 1); const color = green.clone().lerp(rock, blend).lerp(snow, THREE.MathUtils.clamp((y - 15) / 9, 0, 1)); const variation = .88 + Math.sin(position.getX(i) * 2.1 + position.getZ(i)) * .06; color.multiplyScalar(variation); terrainColors.push(color.r, color.g, color.b); } terrainGeometry.setAttribute("color", new THREE.Float32BufferAttribute(terrainColors, 3));
    terrainGeometry.computeVertexNormals(); const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .94, metalness: 0 })); terrain.receiveShadow = true; scene.add(terrain);
    const curve = new THREE.CatmullRomCurve3(route); const riverGeometry = ribbonGeometry(curve, 3.4); const river = new THREE.Mesh(riverGeometry, new THREE.MeshPhysicalMaterial({ color: 0x2e839d, roughness: .16, metalness: .04, transparent: true, opacity: .88, clearcoat: .7, clearcoatRoughness: .18, side: THREE.DoubleSide })); river.receiveShadow = true; scene.add(river);
    const treeGroup = new THREE.Group(); const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4b3526, roughness: 1 }); const foliageMaterials = [0x365f36, 0x477541, 0x2e5434].map((color) => new THREE.MeshStandardMaterial({ color, roughness: .95 }));
    for (let i = 0; i < 140; i++) { const z = -38 + Math.random() * 82, centerX = 8 - z * .42, side = Math.random() > .5 ? 1 : -1, x = centerX + side * (7 + Math.random() * 35); const tree = new THREE.Group(); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.11, .18, 1.6, 6), trunkMaterial); trunk.position.y = .8; tree.add(trunk); const crown = new THREE.Mesh(new THREE.ConeGeometry(.8 + Math.random() * .45, 2.8 + Math.random() * 1.4, 8), foliageMaterials[i % foliageMaterials.length]); crown.position.y = 2.5; crown.castShadow = true; tree.add(crown); tree.position.set(x, Math.max(-1, Math.abs(x - centerX) * .15) - 1.5, z); tree.scale.setScalar(.7 + Math.random() * .75); treeGroup.add(tree); } scene.add(treeGroup);

    const glacier = new THREE.Group(); const iceMaterial = new THREE.MeshPhysicalMaterial({ color: 0xbce8f3, roughness: .58, transmission: .08 });
    for (let i = 0; i < 18; i++) { const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + Math.random() * 1.8, 0), iceMaterial); chunk.position.set(17 + (Math.random() - .5) * 10, 14 + Math.random() * 7, -47 + (Math.random() - .5) * 8); chunk.rotation.set(Math.random(), Math.random(), Math.random()); chunk.castShadow = true; glacier.add(chunk); } scene.add(glacier);
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }); const seismicPulse = new THREE.Mesh(new THREE.RingGeometry(2.5, 3, 64), pulseMaterial); seismicPulse.position.set(17, 8, -43); seismicPulse.rotation.x = -Math.PI / 2; scene.add(seismicPulse);

    const collapseCount = 150; const collapseGeometry = new THREE.BufferGeometry(); const collapseBase = Array.from({ length: collapseCount }, () => new THREE.Vector3(17 + (Math.random() - .5) * 10, 15 + Math.random() * 10, -46 + (Math.random() - .5) * 8)); collapseGeometry.setAttribute("position", new THREE.Float32BufferAttribute(collapseBase.flatMap((v) => [v.x, v.y, v.z]), 3)); const collapse = new THREE.Points(collapseGeometry, new THREE.PointsMaterial({ color: 0xd8eef0, size: .65, transparent: true, opacity: .88, depthWrite: false })); scene.add(collapse);
    const dust = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 12), new THREE.MeshBasicMaterial({ color: 0x9a927f, transparent: true, opacity: 0, depthWrite: false })); dust.position.set(16, 11, -42); dust.scale.set(1.8, .7, 1); scene.add(dust);

    const particleCount = 230; const floodGeometry = new THREE.SphereGeometry(.55, 7, 5); const floodMaterial = new THREE.MeshStandardMaterial({ color: 0x704b32, roughness: .72, emissive: 0x0c2630, emissiveIntensity: .4 }); const flood = new THREE.InstancedMesh(floodGeometry, floodMaterial, particleCount); flood.instanceMatrix.setUsage(THREE.DynamicDrawUsage); flood.castShadow = true; scene.add(flood); const dummy = new THREE.Object3D();
    const foamGeometry = new THREE.BufferGeometry(); const foamPositions = new Float32Array(particleCount * 3); foamGeometry.setAttribute("position", new THREE.BufferAttribute(foamPositions, 3)); const foam = new THREE.Points(foamGeometry, new THREE.PointsMaterial({ color: 0xd8f3f5, size: .38, transparent: true, opacity: .72, depthWrite: false })); scene.add(foam);
    const surgeGeometry = ribbonGeometry(curve, 6.2); surgeGeometry.setDrawRange(0, 0); const surge = new THREE.Mesh(surgeGeometry, new THREE.MeshPhysicalMaterial({ color: 0x6f4e38, roughness: .42, transparent: true, opacity: .93, clearcoat: .25, side: THREE.DoubleSide })); surge.position.y = .42; surge.castShadow = true; scene.add(surge);

    const wallMaterials = [0xd6c4a6, 0xb6a88e, 0xd4d0c4, 0xa98f73].map((color) => new THREE.MeshStandardMaterial({ color, roughness: .88 })); const roofMaterials = [0x7c2f24, 0x4f5354, 0x80623c].map((color) => new THREE.MeshStandardMaterial({ color, roughness: .72 })); const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x8fc4d3, roughness: .1, metalness: .1 }); const buildings: { mesh: THREE.Group; threshold: number; origin: THREE.Vector3 }[] = [];
    [0.18, .3, .47, .63, .78].forEach((threshold, village) => { const center = curve.getPoint(threshold); for (let i = 0; i < 8; i++) { const house = makeHouse(wallMaterials[(i + village) % wallMaterials.length], roofMaterials[(i + village) % roofMaterials.length], glassMaterial); house.position.set(center.x + (i % 2 ? 4.1 : -4.1) + (Math.random() - .5) * 2, center.y + .2, center.z + (Math.random() - .5) * 7); house.scale.setScalar(.78 + Math.random() * .45); house.rotation.y = -.55 + (Math.random() - .5) * .3; scene.add(house); buildings.push({ mesh: house, threshold: threshold + (i - 4) * .004, origin: house.position.clone() }); } });
    const bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x5a6768, metalness: .5, roughness: .55 }); const bridges: { mesh: THREE.Mesh; threshold: number }[] = [];
    [.32, .54, .72].forEach((threshold) => { const point = curve.getPoint(threshold); const bridge = new THREE.Mesh(new THREE.BoxGeometry(8, .35, 1.1), bridgeMaterial); bridge.position.copy(point).add(new THREE.Vector3(0, 1.5, 0)); bridge.rotation.y = -.55; scene.add(bridge); bridges.push({ mesh: bridge, threshold }); });

    const clock = new THREE.Clock(); let frame = 0;
    const render = () => { frame = requestAnimationFrame(render); const time = clock.getElapsedTime(); const current = state.current; const stageAge = (performance.now() - current.changedAt) / 1000; const collapsePhase = current.activeEvent === 0 ? Math.min(stageAge / 1.8, 1) : 1;
      const positions = collapseGeometry.attributes.position as THREE.BufferAttribute; collapseBase.forEach((base, i) => { const fall = collapsePhase * collapsePhase * (8 + (i % 9) * .7); positions.setXYZ(i, base.x - collapsePhase * (2 + i % 4), base.y - fall, base.z + collapsePhase * (5 + i % 7)); }); positions.needsUpdate = true; collapse.visible = collapsePhase < 1; glacier.rotation.z = collapsePhase * .08; glacier.position.set(-collapsePhase * 2, -collapsePhase * 5, collapsePhase * 4); dust.material.opacity = Math.sin(collapsePhase * Math.PI) * .23; dust.scale.setScalar(1 + collapsePhase * 2.2); const pulsePhase = current.activeEvent === 0 ? Math.min(stageAge / .9, 1) : 1; seismicPulse.visible = current.activeEvent === 0 && pulsePhase < 1; seismicPulse.scale.setScalar(1 + pulsePhase * 7); pulseMaterial.opacity = (1 - pulsePhase) * .7;
      const floodFront = Math.max(current.progress, current.activeEvent === 0 ? Math.max(0, (stageAge - 1.25) * .055) : current.progress); const surgeIndexCount = surgeGeometry.index?.count ?? 0; surgeGeometry.setDrawRange(0, Math.floor(surgeIndexCount * Math.min(1, floodFront))); surge.position.y = .34 + Math.sin(time * 2.2) * .08; for (let i = 0; i < particleCount; i++) { const offset = (i / particleCount) * .16; const p = Math.max(0, floodFront - offset + Math.sin(time * 1.8 + i * 2.1) * .005); const visible = p > .008 && p <= 1; const point = curve.getPointAt(Math.min(.999, p)); dummy.position.set(point.x + Math.sin(i * 12.3) * 1.6, point.y + .7 + Math.abs(Math.sin(i * 2.7 + time * 3)) * .75, point.z + Math.cos(i * 8.1) * 1.6); dummy.scale.setScalar(visible ? .45 + (i % 5) * .08 : 0); dummy.rotation.set(time + i, time * .5, i); dummy.updateMatrix(); flood.setMatrixAt(i, dummy.matrix); foamPositions[i * 3] = dummy.position.x; foamPositions[i * 3 + 1] = dummy.position.y + .65; foamPositions[i * 3 + 2] = dummy.position.z; } flood.instanceMatrix.needsUpdate = true; (foamGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      buildings.forEach(({ mesh, threshold, origin }, i) => { const hit = Math.max(0, Math.min(1, (floodFront - threshold) * 18)); mesh.position.y = origin.y - hit * (1.4 + i % 3); mesh.rotation.z = hit * (i % 2 ? .9 : -.75); mesh.rotation.x = hit * .35; }); bridges.forEach(({ mesh, threshold }, i) => { const hit = Math.max(0, Math.min(1, (floodFront - threshold) * 20)); mesh.rotation.z = hit * (i % 2 ? .8 : -.65); mesh.position.y -= hit * .018; });
      const focus = curve.getPointAt(Math.min(.95, floodFront)); const tangent = curve.getTangentAt(Math.min(.95, floodFront)); const desired = focus.clone().add(new THREE.Vector3(22, 19, 24)).add(tangent.multiplyScalar(-12)); camera.position.lerp(desired, .018); camera.lookAt(focus); renderer.render(scene, camera); };
    render();
    const resize = () => { if (!host) return; camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); }; window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.dispose(); terrainGeometry.dispose(); riverGeometry.dispose(); surgeGeometry.dispose(); floodGeometry.dispose(); collapseGeometry.dispose(); foamGeometry.dispose(); host.removeChild(renderer.domElement); };
  }, []);

  return <div ref={mount} className="cinematic-scene" data-testid="cinematic-scene"><div className="scene-event"><strong>{activeEvent === 0 ? "08:37 · SEISMIC SIGNAL" : "SURGE IN PROGRESS"}</strong><span>{activeEvent === 0 ? "Ice-and-rock collapse — not a confirmed earthquake" : "Mud, debris and water moving downstream"}</span></div><div className="scene-label"><span>{activeEvent === 0 ? "Glacier collapse reconstruction" : "Flood propagation reconstruction"}</span><strong>3D EVIDENCE VIEW</strong></div></div>;
}
