"use client"

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
    OrbitControls,
    PerspectiveCamera,
    Environment,
    Float,
    Stars,
    Sparkles,
    MeshReflectorMaterial,
    Text,
    Trail,
    Sphere,
    Grid,
    SpotLight,
    RoundedBox,
    Ring,
    Cylinder
} from '@react-three/drei'
import * as THREE from 'three'

// --- BACKGROUND ELEMENTS ---

function HolographicRings() {
    const groupRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.05
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
        }
    })

    return (
        <group ref={groupRef} position={[0, 0, -5]} rotation={[Math.PI / 2, 0, 0]}>
            {/* Outer Slow Ring */}
            <Ring args={[12, 12.1, 64]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#1e3a8a" transparent opacity={0.3} side={THREE.DoubleSide} />
            </Ring>

            {/* Middle Pulse Ring */}
            <Ring args={[8, 8.2, 64]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} side={THREE.DoubleSide} />
            </Ring>

            {/* Inner Fast Ring */}
            <Ring args={[5, 5.05, 64]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#60a5fa" transparent opacity={0.4} side={THREE.DoubleSide} />
            </Ring>
        </group>
    )
}

function VerticalLightColumns() {
    // Simulated light pillars in the background
    return (
        <group>
            <Cylinder args={[0.2, 0.2, 20, 16]} position={[-10, 5, -8]}>
                <meshBasicMaterial color="#1e3a8a" transparent opacity={0.1} />
            </Cylinder>
            <Cylinder args={[0.1, 0.1, 15, 16]} position={[12, 5, -12]}>
                <meshBasicMaterial color="#1e3a8a" transparent opacity={0.1} />
            </Cylinder>
            <Cylinder args={[0.3, 0.3, 25, 16]} position={[-15, 5, 5]}>
                <meshBasicMaterial color="#312e81" transparent opacity={0.05} />
            </Cylinder>
        </group>
    )
}

// --- TRUCK COMPONENTS ---

function DataOrbs() {
    const orbRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (orbRef.current) {
            orbRef.current.rotation.y = state.clock.elapsedTime * 0.2
        }
    })

    return (
        <group ref={orbRef}>
            {[...Array(3)].map((_, i) => {
                const angle = (i / 3) * Math.PI * 2
                const radius = 6
                return (
                    <Trail
                        key={i}
                        width={0.6}
                        length={8}
                        color={i === 0 ? "#ffffff" : "#3b82f6"}
                        attenuation={(t) => t * t}
                    >
                        <Sphere args={[0.08, 16, 16]} position={[Math.cos(angle) * radius, 2 + Math.sin(i * 3) * 0.5, Math.sin(angle) * radius]}>
                            <meshBasicMaterial color={i === 0 ? "#ffffff" : "#60a5fa"} toneMapped={false} />
                        </Sphere>
                    </Trail>
                )
            })}
        </group>
    )
}

function CyberTruck() {
    const group = useRef<THREE.Group>(null)
    const wheelsRef = useRef<THREE.Mesh[]>([])

    useFrame((state, delta) => {
        wheelsRef.current.forEach(wheel => {
            if (wheel) wheel.rotation.x -= delta * 5 // Slower rotation for massive feel
        })
    })

    // HIGH POLISH MATERIALS
    const materials = useMemo(() => ({
        body: new THREE.MeshPhysicalMaterial({
            color: '#ffffff', // Pearl White
            roughness: 0.15,
            metalness: 0.5,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            envMapIntensity: 2
        }),
        cabin: new THREE.MeshPhysicalMaterial({
            color: '#f1f5f9',
            roughness: 0.1,
            metalness: 0.5,
            clearcoat: 1
        }),
        container: new THREE.MeshPhysicalMaterial({
            color: '#172554', // Deep Navy Blue
            roughness: 0.2,
            metalness: 0.6,
            clearcoat: 0.5
        }),
        glass: new THREE.MeshPhysicalMaterial({
            color: '#0ea5e9',
            transmission: 0.9,
            opacity: 0.5,
            metalness: 0.2,
            roughness: 0,
            thickness: 1,
            ior: 1.5,
            envMapIntensity: 3
        }),
        neonBlue: new THREE.MeshBasicMaterial({ color: '#3b82f6', toneMapped: false }),
        neonCyan: new THREE.MeshBasicMaterial({ color: '#06b6d4', toneMapped: false }),
        neonWhite: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
        tire: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.8 }),
        rim: new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9, roughness: 0.2 })
    }), [])

    // Wheel Component
    const Wheel = ({ position, side }: { position: [number, number, number], side: 'left' | 'right' }) => (
        <group position={position}>
            <mesh ref={(el) => { if (el) wheelsRef.current.push(el) }} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.58, 0.58, 0.35, 32]} />
                <primitive object={materials.tire} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.38, 0.38, 0.38, 32]} />
                <primitive object={materials.rim} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} position={[side === 'left' ? 0.2 : -0.2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} position={[side === 'left' ? 0.18 : -0.18, 0, 0]}>
                <torusGeometry args={[0.42, 0.015, 16, 32]} />
                <primitive object={materials.neonCyan} />
            </mesh>
        </group>
    )

    return (
        <group ref={group} position={[0, 0, 0]}>
            {/* Chassis */}
            <group position={[0, 0.75, 0]}>
                <RoundedBox args={[3, 0.5, 1.9]} radius={0.05} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
                </RoundedBox>
            </group>

            {/* Underglow - Double Strip */}
            <mesh position={[0, 0.48, 0.8]}>
                <boxGeometry args={[2.8, 0.02, 0.02]} />
                <primitive object={materials.neonCyan} />
            </mesh>
            <mesh position={[0, 0.48, -0.8]}>
                <boxGeometry args={[2.8, 0.02, 0.02]} />
                <primitive object={materials.neonCyan} />
            </mesh>

            {/* Cabin */}
            <group position={[-0.9, 1.55, 0]}>
                <RoundedBox args={[1.3, 1.1, 1.8]} radius={0.05} smoothness={4} castShadow receiveShadow>
                    <primitive object={materials.cabin} />
                </RoundedBox>
            </group>

            {/* Front Detailing */}
            <mesh position={[-1.56, 1.05, 0]}>
                <boxGeometry args={[0.02, 0.4, 1.4]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Mirrors */}
            <group position={[-1.1, 1.6, 1.0]} rotation={[0, -0.2, 0]}>
                <RoundedBox args={[0.2, 0.3, 0.1]} radius={0.02} smoothness={2}>
                    <primitive object={materials.body} />
                </RoundedBox>
                <mesh position={[0.11, 0, 0]}>
                    <planeGeometry args={[0.01, 0.25, 0.08]} />
                    <meshStandardMaterial color="#ffffff" metalness={1} roughness={0} />
                </mesh>
            </group>
            <group position={[-1.1, 1.6, -1.0]} rotation={[0, 0.2, 0]}>
                <RoundedBox args={[0.2, 0.3, 0.1]} radius={0.02} smoothness={2}>
                    <primitive object={materials.body} />
                </RoundedBox>
            </group>

            {/* Windshield & Windows */}
            <mesh position={[-1.56, 1.55, 0]} rotation={[0, 0, -0.15]}>
                <boxGeometry args={[0.08, 0.9, 1.7]} />
                <primitive object={materials.glass} />
            </mesh>
            <mesh position={[-0.9, 1.55, 0.91]}>
                <planeGeometry args={[1.0, 0.6]} />
                <primitive object={materials.glass} />
            </mesh>
            <mesh position={[-0.9, 1.55, -0.91]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[1.0, 0.6]} />
                <primitive object={materials.glass} />
            </mesh>

            {/* Container */}
            <group position={[1.8, 1.7, 0]}>
                <RoundedBox args={[3.8, 1.9, 1.85]} radius={0.03} smoothness={4} castShadow receiveShadow>
                    <primitive object={materials.container} />
                </RoundedBox>
            </group>

            <group position={[1.8, 1.7, 0.94]}>
                <Text
                    position={[0, 0.2, 0]}
                    fontSize={0.7}
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff"
                    letterSpacing={0.05}
                    anchorX="center" anchorY="middle"
                >
                    JBRC
                    <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} toneMapped={false} />
                </Text>
                <Text
                    position={[0, -0.35, 0]}
                    fontSize={0.18}
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff"
                    letterSpacing={0.3}
                    anchorX="center" anchorY="middle"
                >
                
                    <meshBasicMaterial color="#38bdf8" toneMapped={false} />
                </Text>
            </group>

            <group position={[1.8, 1.7, -0.94]} rotation={[0, Math.PI, 0]}>
                <Text
                    position={[0, 0.2, 0]}
                    fontSize={0.7}
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff"
                    letterSpacing={0.05}
                    anchorX="center" anchorY="middle"
                >
                    JBRC
                    <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} toneMapped={false} />
                </Text>
            </group>

            {/* Wheels */}
            <Wheel position={[-1.15, 0.55, 0.85]} side="left" />
            <Wheel position={[-1.15, 0.55, -0.85]} side="right" />
            <Wheel position={[1.6, 0.55, 0.85]} side="left" />
            <Wheel position={[1.6, 0.55, -0.85]} side="right" />
            <Wheel position={[3.0, 0.55, 0.85]} side="left" />
            <Wheel position={[3.0, 0.55, -0.85]} side="right" />

            {/* Headlights & Taillights with Flare */}
            <group position={[-1.56, 1.05, 0.65]}>
                <boxGeometry args={[0.08, 0.12, 0.3]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} toneMapped={false} />
                <SpotLight
                    distance={12} angle={0.3} attenuation={5} anglePower={5}
                    target-position={[-20, 0, 0.65]} color="#dbeafe" opacity={0.6}
                />
            </group>
            <group position={[-1.56, 1.05, -0.65]}>
                <boxGeometry args={[0.08, 0.12, 0.3]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} toneMapped={false} />
                <SpotLight
                    distance={12} angle={0.3} attenuation={5} anglePower={5}
                    target-position={[-20, 0, -0.65]} color="#dbeafe" opacity={0.6}
                />
            </group>

            <mesh position={[3.71, 1.2, 0.65]}>
                <boxGeometry args={[0.05, 0.25, 0.35]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} toneMapped={false} />
                <pointLight distance={2} intensity={2} color="#ef4444" />
            </mesh>
            <mesh position={[3.71, 1.2, -0.65]}>
                <boxGeometry args={[0.05, 0.25, 0.35]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} toneMapped={false} />
                <pointLight distance={2} intensity={2} color="#ef4444" />
            </mesh>
        </group>
    )
}

export default function Login3DScene() {
    return (
        <div className="w-full h-full min-h-[500px] cursor-grab active:cursor-grabbing bg-slate-950">
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
                {/* Deep Space / Dark Hangar Background */}
                <color attach="background" args={['#02040a']} />
                <fog attach="fog" args={['#02040a', 8, 35]} />

                <PerspectiveCamera makeDefault position={[-6, 3, 7]} fov={35} />

                {/* --- LIGHTING --- */}
                <ambientLight intensity={0.4} color="#1e3a8a" />

                {/* Overhead Spotlights simulating hangar roof lights */}
                <SpotLight
                    position={[-5, 15, 5]} angle={0.4} penumbra={0.5} intensity={100}
                    castShadow shadow-bias={-0.0001} color="#e0f2fe"
                />
                <SpotLight
                    position={[5, 15, -5]} angle={0.4} penumbra={0.5} intensity={80}
                    castShadow color="#dbeafe"
                />

                {/* Dramatic Side Rims */}
                <SpotLight position={[10, 2, 8]} angle={0.6} penumbra={1} intensity={60} color="#3b82f6" />
                <SpotLight position={[10, 2, -8]} angle={0.6} penumbra={1} intensity={60} color="#60a5fa" />

                <Environment preset="city" blur={0.8} />

                {/* --- SCENE CONTENT --- */}
                <Float
                    speed={1.5}
                    rotationIntensity={0.05}
                    floatIntensity={0.2}
                    floatingRange={[-0.1, 0.1]}
                >
                    <CyberTruck />
                </Float>

                {/* Background Elements */}
                <HolographicRings />
                <VerticalLightColumns />
                <DataOrbs />

                {/* Dynamic Floor */}
                <group position={[0, -0.01, 0]}>
                    {/* Primary Grid */}
                    <Grid
                        renderOrder={-1}
                        position={[0, 0, 0]}
                        infiniteGrid
                        cellSize={1}
                        cellThickness={0.7}
                        sectionSize={5}
                        sectionThickness={1.2}
                        cellColor="#1e3a8a"
                        sectionColor="#3b82f6"
                        fadeDistance={30}
                    />
                    {/* Reflective Surface reflecting the grid */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                        <planeGeometry args={[100, 100]} />
                        <MeshReflectorMaterial
                            blur={[500, 100]}
                            resolution={1024}
                            mixBlur={1}
                            mixStrength={15}
                            roughness={0.6}
                            depthScale={1}
                            minDepthThreshold={0.5}
                            maxDepthThreshold={1.4}
                            color="#02040a"
                            metalness={0.8}
                            mirror={0.7}
                        />
                    </mesh>
                </group>

                {/* Particles */}
                <Stars radius={50} depth={20} count={2000} factor={4} saturation={0} fade speed={1} />
                <Sparkles count={80} scale={12} size={2} speed={0.4} opacity={0.3} color="#93c5fd" />

                <OrbitControls
                    enablePan={false}
                    enableZoom={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2.05}
                    autoRotate
                    autoRotateSpeed={0.5}
                    target={[0, 1, 0]}
                />
            </Canvas>
        </div>
    )
}
