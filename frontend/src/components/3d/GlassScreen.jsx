import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Text } from '@react-three/drei';

export default function GlassScreen() {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(t / 2) * 0.1;
    meshRef.current.rotation.y = Math.cos(t / 2) * 0.15;
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[3.6, 2.1, 0.15]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          resolution={512}
          transmission={0.9}
          roughness={0.15}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          thickness={0.3}
          chromaticAberration={0.06}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
          color="#c026d3"
        />
      </mesh>
      
      <Text
        position={[0, 0, 0.1]}
        fontSize={0.25}
        color="#ffffff"
        font="https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7NOFf5.woff"
        anchorX="center"
        anchorY="middle"
      >
        SyncRoom 🚀
      </Text>
    </Float>
  );
}