import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/* eslint-disable react-hooks/immutability -- Three.js textures are mutable GPU resources by design. */
type Props = { teamName: string; logoUrl?: string | null; primaryColor: string };

function drawFallback(canvas: HTMLCanvasElement, name: string, color: string) {
  const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, 512, 512); ctx.fillStyle = color; ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 210px sans-serif'; ctx.fillText(Array.from(name.trim()).slice(0, 2).join('') || 'CB', 256, 265);
}

function useEmblemTexture({ teamName, logoUrl, primaryColor }: Props) {
  const canvas = useMemo(() => { const el = document.createElement('canvas'); el.width = 512; el.height = 512; return el; }, []);
  const texture = useMemo(() => { const value = new THREE.CanvasTexture(canvas); value.colorSpace = THREE.SRGBColorSpace; return value; }, [canvas]);
  useEffect(() => {
    drawFallback(canvas, teamName, primaryColor); texture.needsUpdate = true;
    if (!logoUrl) return;
    const image = new Image(); image.onload = () => { const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, 512, 512); ctx.save(); ctx.beginPath(); ctx.arc(256, 256, 252, 0, Math.PI * 2); ctx.clip(); const scale = Math.max(512 / image.width, 512 / image.height); const w = image.width * scale, h = image.height * scale; ctx.drawImage(image, (512 - w) / 2, (512 - h) / 2, w, h); ctx.restore(); texture.needsUpdate = true; }; image.src = logoUrl;
  }, [canvas, logoUrl, primaryColor, teamName, texture]);
  useEffect(() => () => texture.dispose(), [texture]); return texture;
}

function Artifact(props: Props) {
  const group = useRef<THREE.Group>(null); const ribbonA = useRef<THREE.Mesh>(null); const ribbonB = useRef<THREE.Mesh>(null); const { pointer } = useThree(); const texture = useEmblemTexture(props);
  useFrame(({ clock }, delta) => { if (!group.current || !ribbonA.current || !ribbonB.current) return; group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * .18, 3.2, delta); group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -.04 - pointer.y * .08, 3.2, delta); group.current.position.y = Math.sin(clock.elapsedTime * .75) * .035; ribbonA.current.rotation.z += delta * .04; ribbonB.current.rotation.z -= delta * .03; });
  return <group ref={group} rotation={[-.04, -.12, 0]}>
    <mesh position={[0, -.05, -.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.32, 1.32, .22, 64]} /><meshPhysicalMaterial color="#fff8f5" metalness={.05} roughness={.18} clearcoat={1} /></mesh>
    <mesh position={[0, -.05, -.08]}><circleGeometry args={[1.18, 64]} /><meshPhysicalMaterial color="#ffc2dc" transparent opacity={.38} transmission={.35} thickness={.7} roughness={.12} /></mesh>
    <mesh position={[0, -.05, .02]}><ringGeometry args={[.84, .96, 64]} /><meshBasicMaterial color="#ffffff" transparent opacity={.9} /></mesh>
    <mesh position={[0, -.05, .05]}><circleGeometry args={[.82, 64]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
    <mesh ref={ribbonA} rotation={[1.12, .18, -.2]}><torusGeometry args={[1.5, .055, 14, 96]} /><meshPhysicalMaterial color="#f52a9a" transparent opacity={.5} transmission={.3} roughness={.1} /></mesh>
    <mesh ref={ribbonB} rotation={[1.42, -.25, .64]}><torusGeometry args={[1.62, .035, 12, 96]} /><meshPhysicalMaterial color="#ffc85a" transparent opacity={.7} transmission={.25} roughness={.12} /></mesh>
  </group>;
}

function Scene(props: Props) { return <><ambientLight intensity={2.6} /><directionalLight position={[3, 4, 5]} intensity={3} color="#fffaf2" /><pointLight position={[-3, 0, 3]} intensity={4} color="#f52a9a" /><pointLight position={[3, -1, 2]} intensity={3} color="#ffc85a" /><Artifact {...props} /></>; }
export default function TeamArtifact(props: Props) { return <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 4.8], fov: 34 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}><Scene {...props} /></Canvas>; }
