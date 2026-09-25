import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

function Artifact() {
  const group = useRef<Group>(null);

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    group.current.rotation.y += (pointer.x * 0.22 - group.current.rotation.y) * 0.025;
    group.current.rotation.x += (-pointer.y * 0.12 - group.current.rotation.x) * 0.025;
    group.current.position.y = Math.sin(clock.elapsedTime * 1.15) * 0.07;
  });

  return (
    <group ref={group} rotation={[0.08, -0.2, -0.08]}>
      <mesh castShadow position={[0, -0.52, 0]} scale={[1.05, 0.25, 1.05]}>
        <cylinderGeometry args={[1.1, 0.82, 0.5, 6]} />
        <meshStandardMaterial color="#123e6a" metalness={0.72} roughness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 0.08, 0]} rotation={[0, 0.35, 0]}>
        <octahedronGeometry args={[0.94, 0]} />
        <meshPhysicalMaterial color="#1779d1" metalness={0.38} roughness={0.16} clearcoat={1} />
      </mesh>
      <mesh position={[0.02, 0.12, 0.78]} scale={[0.42, 0.42, 0.18]}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshBasicMaterial color="#78e5ff" transparent opacity={0.72} />
      </mesh>
      <mesh position={[-0.55, 0.55, 0]} rotation={[0.18, 0, -0.35]}>
        <coneGeometry args={[0.18, 0.72, 5]} />
        <meshStandardMaterial color="#e9b247" metalness={0.65} roughness={0.22} />
      </mesh>
      <mesh position={[0.55, 0.55, 0]} rotation={[0.18, 0, 0.35]}>
        <coneGeometry args={[0.18, 0.72, 5]} />
        <meshStandardMaterial color="#e9b247" metalness={0.65} roughness={0.22} />
      </mesh>
    </group>
  );
}

export default function TeamArtifact() {
  return (
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0.1, 4.2], fov: 38 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 4, 3]} intensity={3.5} color="#c9f3ff" />
      <pointLight position={[-3, 0, 2]} intensity={5} color="#e9b247" />
      <Artifact />
    </Canvas>
  );
}
