import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { BodySpecs, FaceSpecs } from '../types';

interface Character3DModelProps {
  body: BodySpecs;
  face: FaceSpecs;
}

const Mannequin: React.FC<Character3DModelProps> = ({ body, face }) => {
  const group = useRef<THREE.Group>(null);
  const breathFactor = useRef(0);
  
  // -- Body Params --
  const ht = 1 + (body.height - 140) / 120; // scale Y
  const waist = 0.5 + (body.waist / 100) * 0.5;
  const hips = 0.6 + (body.hips / 100) * 0.6;
  const shoulders = 0.8 + (body.shoulders / 100) * 0.8;
  const chest = 0.3 + (body.chest / 100) * 0.6;
  const belly = 0.4 + (body.bellySize / 100) * 0.5;
  const arm = 0.2 + (body.armThickness / 100) * 0.3;
  const thigh = 0.3 + (body.legs / 100) * 0.4;
  const calf = 0.2 + (body.calfSize / 100) * 0.3;
  const neckL = 0.2 + (body.neckLength / 100) * 0.5;
  const muscle = body.muscleTone / 100;
  
  // -- Face Params --
  const f_round = 0.8 + (face.roundness / 100) * 0.4;
  const f_jaw = 0.8 + (face.jawline / 100) * 0.4;
  const f_headH = 1 + (face.forehead / 100) * 0.3;
  
  const eyeSize = 0.08 + (face.eyeSize / 100) * 0.08;
  const eyeTilt = ((face.eyeTilt - 50) / 50) * 0.4; 
  const noseSize = 0.08 + (face.noseShape / 100) * 0.15;
  const lipsThick = 0.04 + (face.lipsSize / 100) * 0.08;
  const mouthWidth = 0.15 + (face.mouthWidth / 100) * 0.2;
  const earSize = 0.1 + (face.earSize / 100) * 0.2;

  // Derived metrics
  const torsoY = 2.4;
  const neckY = torsoY + 1.2 + neckL / 2;
  const headY = neckY + neckL / 2 + (f_headH * 0.5);

  const skinProps = {
    color: "#ec4899",
    roughness: 0.6 - muscle * 0.3,
    metalness: 0.1 + muscle * 0.3
  };

  useFrame((state) => {
    if (group.current) {
      const t = state.clock.getElapsedTime();
      breathFactor.current = Math.sin(t * 2.5) * 0.03;
      group.current.position.y = breathFactor.current;
    }
  });

  return (
    <group ref={group} scale={[1, ht, 1]} position={[0, -2, 0]}>
      {/* Pelvis / Hips */}
      <mesh position={[0, 1.4, 0]} scale={[hips, 0.6, hips * 0.8]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial {...skinProps} />
      </mesh>

      {/* Waist / Lower Torso */}
      <mesh position={[0, 1.9, 0]} scale={[waist, 0.6, belly]}>
        <cylinderGeometry args={[1, 1.1, 1, 32]} />
        <meshStandardMaterial {...skinProps} />
      </mesh>

      {/* Upper Torso */}
      <mesh position={[0, torsoY, 0]} scale={[shoulders, 0.8, 0.6]}>
        <cylinderGeometry args={[1.2, 0.9, 1.4, 32]} />
        <meshStandardMaterial {...skinProps} />
      </mesh>
      
      {/* Chest / Bust */}
      <mesh position={[0, torsoY + 0.2, 0.5]} scale={[chest * 1.5, chest, chest * 0.8]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial {...skinProps} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, neckY, 0]} scale={[0.3, neckL, 0.3]}>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial {...skinProps} />
      </mesh>

      {/* Head */}
      <group position={[0, headY, 0]}>
        <mesh scale={[f_round, f_headH, f_round * 0.9]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#fce7f3" roughness={0.4} />
        </mesh>
        
        {/* Jaw/Chin overlay */}
        <mesh position={[0, -0.3, 0.1]} scale={[f_jaw * 0.7, 0.4, f_round * 0.8]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#fce7f3" roughness={0.4} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.2, 0.1, f_round * 0.52]} rotation={[0, 0, eyeTilt]} scale={[eyeSize * 1.5, eyeSize, eyeSize]}>
           <sphereGeometry args={[1, 16, 16]} />
           <meshStandardMaterial color="#1e1b4b" roughness={0.2} />
        </mesh>
        <mesh position={[0.2, 0.1, f_round * 0.52]} rotation={[0, 0, -eyeTilt]} scale={[eyeSize * 1.5, eyeSize, eyeSize]}>
           <sphereGeometry args={[1, 16, 16]} />
           <meshStandardMaterial color="#1e1b4b" roughness={0.2} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.1, f_round * 0.55]} scale={[noseSize * 0.6, noseSize, noseSize * 0.8]} rotation={[0.2, 0, 0]}>
           <coneGeometry args={[1, 2, 16]} />
           <meshStandardMaterial color="#fbcfe8" />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, -0.35, f_round * 0.53]} scale={[mouthWidth, lipsThick, lipsThick]} rotation={[0, 0, Math.PI/2]}>
           <capsuleGeometry args={[0.5, 1, 8, 16]} />
           <meshStandardMaterial color="#be185d" />
        </mesh>

        {/* Ears */}
        <mesh position={[-f_round * 0.55, 0, 0]} scale={[earSize*0.3, earSize, earSize*0.8]} rotation={[0, 0, 0.2]}>
           <sphereGeometry args={[1, 16, 16]} />
           <meshStandardMaterial color="#fbcfe8" />
        </mesh>
        <mesh position={[f_round * 0.55, 0, 0]} scale={[earSize*0.3, earSize, earSize*0.8]} rotation={[0, 0, -0.2]}>
           <sphereGeometry args={[1, 16, 16]} />
           <meshStandardMaterial color="#fbcfe8" />
        </mesh>
      </group>

      {/* Left Arm */}
      <group position={[-shoulders * 1.1, torsoY + 0.4, 0]}>
        <mesh position={[0, -1, 0]} scale={[arm, 1.2, arm]}>
          <capsuleGeometry args={[1, 2, 16, 16]} />
          <meshStandardMaterial {...skinProps} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[shoulders * 1.1, torsoY + 0.4, 0]}>
        <mesh position={[0, -1, 0]} scale={[arm, 1.2, arm]}>
          <capsuleGeometry args={[1, 2, 16, 16]} />
          <meshStandardMaterial {...skinProps} />
        </mesh>
      </group>

      {/* Left Leg (Thigh + Calf) */}
      <group position={[-hips * 0.4, 1.4, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.8, 0]} scale={[thigh, 0.8, thigh]}>
          <capsuleGeometry args={[1, 2, 16, 16]} />
          <meshStandardMaterial {...skinProps} />
        </mesh>
        {/* Calf */}
        <mesh position={[0, -2.4, 0]} scale={[calf, 0.8, calf]}>
          <capsuleGeometry args={[1, 2, 16, 16]} />
          <meshStandardMaterial {...skinProps} />
        </mesh>
      </group>

      {/* Right Leg (Thigh + Calf) */}
      <group position={[hips * 0.4, 1.4, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.8, 0]} scale={[thigh, 0.8, thigh]}>
          <capsuleGeometry args={[1, 2, 16, 16]} />
          <meshStandardMaterial {...skinProps} />
        </mesh>
        {/* Calf */}
        <mesh position={[0, -2.4, 0]} scale={[calf, 0.8, calf]}>
          <capsuleGeometry args={[1, 2, 16, 16]} />
          <meshStandardMaterial {...skinProps} />
        </mesh>
      </group>
    </group>
  );
};

export const Character3DModel: React.FC<Character3DModelProps> = ({ body, face }) => {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [0, 2, 8], fov: 50 }} id="character-canvas">
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 15, 10]} angle={0.2} penumbra={1} intensity={1.2} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ec4899" />
        
        <Mannequin body={body} face={face} />
        
        <ContactShadows position={[0, -2.5, 0]} opacity={0.6} scale={12} blur={2.5} far={4} />
        <Environment preset="studio" />
        <OrbitControls enableZoom={true} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} target={[0, 2, 0]} />
      </Canvas>
    </div>
  );
};
