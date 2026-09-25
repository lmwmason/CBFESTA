import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const PARTICLES = new Float32Array(Array.from({ length: 90 }, (_, i) => {
  const point = Math.floor(i / 3) + 1;
  const axis = i % 3;
  const scale = axis === 0 ? 2.3 : axis === 1 ? 1.9 : 1;
  return Math.sin(point * (axis + 1) * 12.9898) * scale;
}));

function DragonStroke() {
  const body = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.62,-.48,.25), new THREE.Vector3(-.1,-.64,.34), new THREE.Vector3(.52,-.3,.4),
    new THREE.Vector3(.22,.12,.45), new THREE.Vector3(-.38,.02,.42), new THREE.Vector3(-.5,.5,.38),
    new THREE.Vector3(.08,.7,.38), new THREE.Vector3(.53,.42,.34),
  ]), []);
  return <group>
    <mesh><tubeGeometry args={[body,64,.105,10,false]} /><meshPhysicalMaterial color="#d5f6ff" emissive="#198dd0" emissiveIntensity={1.1} metalness={.45} roughness={.12} clearcoat={1} /></mesh>
    <mesh position={[.55,.43,.35]} rotation={[0,0,-.25]}><coneGeometry args={[.19,.42,5]} /><meshStandardMaterial color="#e9fbff" emissive="#2aa8ed" emissiveIntensity={.8} /></mesh>
    <mesh position={[.47,.52,.51]}><sphereGeometry args={[.038,12,12]} /><meshBasicMaterial color="#ffdd58" /></mesh>
    <mesh position={[-.54,.63,.33]} rotation={[0,0,.5]}><coneGeometry args={[.07,.36,5]} /><meshStandardMaterial color="#b9edff" metalness={.7} roughness={.18} /></mesh>
    <mesh position={[-.31,.75,.34]} rotation={[0,0,-.4]}><coneGeometry args={[.065,.31,5]} /><meshStandardMaterial color="#b9edff" metalness={.7} roughness={.18} /></mesh>
  </group>;
}

function Crest() {
  const root = useRef<THREE.Group>(null), ring = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();
  useFrame(({ clock },delta) => {
    if(!root.current||!ring.current)return;
    root.current.rotation.y=THREE.MathUtils.damp(root.current.rotation.y,pointer.x*.28,3.5,delta);
    root.current.rotation.x=THREE.MathUtils.damp(root.current.rotation.x,-.05-pointer.y*.12,3.5,delta);
    root.current.position.y=Math.sin(clock.elapsedTime*.9)*.045;
    ring.current.rotation.z+=delta*.12;
  });
  return <group ref={root} rotation={[-.05,-.18,0]} scale={1.16}>
    <mesh position={[0,0,-.18]} scale={[1,1.12,.22]}><cylinderGeometry args={[1.12,1.12,.28,6]} /><meshStandardMaterial color="#071b2b" metalness={.86} roughness={.2} /></mesh>
    <mesh position={[0,0,-.01]} scale={[1,1.12,.15]}><cylinderGeometry args={[.98,.98,.18,6]} /><meshPhysicalMaterial color="#0c64a2" metalness={.75} roughness={.14} clearcoat={1} /></mesh>
    <mesh position={[0,0,.11]} scale={[1,1.12,1]}><ringGeometry args={[.79,.84,6]} /><meshStandardMaterial color="#82e7ff" emissive="#138fc5" emissiveIntensity={1.4} metalness={.55} roughness={.14} /></mesh>
    <DragonStroke />
    <mesh ref={ring} rotation={[1.12,.12,.18]}><torusGeometry args={[1.42,.018,8,96]} /><meshBasicMaterial color="#7de7ff" transparent opacity={.55} /></mesh>
    {[0,1,2].map(i=><mesh key={i} position={[Math.cos(i*2.094)*1.42,Math.sin(i*2.094)*.62,.5]}><sphereGeometry args={[.035,10,10]} /><meshBasicMaterial color={i===1?'#ff755d':'#a8efff'} /></mesh>)}
  </group>;
}

function Scene(){
  return <><fog attach="fog" args={['#071722',4.8,8]} /><ambientLight intensity={.72} /><directionalLight position={[3,4,5]} intensity={4.2} color="#d9f8ff" /><pointLight position={[-3,-1,2]} intensity={6} color="#1a88da" /><pointLight position={[3,1,3]} intensity={4} color="#ff6d43" /><Crest /><points><bufferGeometry><bufferAttribute attach="attributes-position" args={[PARTICLES,3]} /></bufferGeometry><pointsMaterial size={.025} color="#8bdff4" transparent opacity={.5} sizeAttenuation /></points></>;
}

export default function TeamArtifact(){return <Canvas dpr={[1,1.55]} camera={{position:[0,0,4.5],fov:35}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}><Scene /></Canvas>}
