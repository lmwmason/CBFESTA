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
  const group = useRef<THREE.Group>(null); const { pointer } = useThree(); const texture = useEmblemTexture(props);
  useFrame(({ clock }, delta) => { if (!group.current) return; group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, -.18 + pointer.x * .12, 3.2, delta); group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -.08 - pointer.y * .05, 3.2, delta); group.current.position.y = Math.sin(clock.elapsedTime * .65) * .018; });
  return <group ref={group} rotation={[-.08, -.18, -.04]}>
    <mesh position={[0, -.05, -.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.28, 1.28, .26, 64]} /><meshStandardMaterial color="#b8aaa0" metalness={.72} roughness={.25} /></mesh>
    <mesh position={[0, -.05, -.04]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.18, 1.18, .19, 64]} /><meshPhysicalMaterial color={props.primaryColor} metalness={.2} roughness={.24} clearcoat={1} clearcoatRoughness={.1} /></mesh>
    <mesh position={[0, -.05, .07]}><circleGeometry args={[1.05, 64]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
    <mesh position={[0, -.05, .085]}><ringGeometry args={[1.05, 1.1, 64]} /><meshStandardMaterial color="#f5eee9" metalness={.55} roughness={.2} /></mesh>
  </group>;
}

function Scene(props: Props) { return <><ambientLight intensity={2.2} /><directionalLight position={[3, 5, 5]} intensity={3.4} color="#fffaf4" /><pointLight position={[-3, 0, 3]} intensity={1.6} color={props.primaryColor} /><Artifact {...props} /></>; }
export default function TeamArtifact(props: Props) { return <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 4.8], fov: 34 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}><Scene {...props} /></Canvas>; }
