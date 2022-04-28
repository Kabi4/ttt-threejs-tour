import * as THREE from "three";
import React, { Suspense, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Html, Preload, OrbitControls } from "@react-three/drei";
import { Popconfirm } from "antd";
import "antd/dist/antd.css";

const store = [
  {
    name: "Next",
    color: "lightpink",
    position: [10, 0, -15],
    url: "/viceroy-los-cabos_medium_29 Public Spaces - Otro Bar.jpg",
    link: 1
  },
  {
    name: "Next",
    color: "lightblue",
    position: [15, 0, 0],
    url: "/viceroy-los-cabos_medium_08 Accommodations - Three Bedroom Villa - Roof 2.jpg",
    link: 2
  },
  {
    name: "Next",
    color: "lightblue",
    position: [15, 0, 0],
    url: "/viceroy-los-cabos_medium_22 Public Spaces - Family Pool Deck - Main Pool Deck.jpg",
    link: 0
  }
  // ...
];

function Dome({ name, position, texture, onClick }) {
  return (
    <group>
      <mesh>
        <sphereBufferGeometry args={[500, 60, 40]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>
      <mesh position={position}>
        <sphereGeometry args={[1.25, 32, 32]} />
        <meshBasicMaterial color="white" />
        <Html center>
          <Popconfirm
            title="Are you sure you want to leave?"
            onConfirm={onClick}
            okText="Yes"
            cancelText="No"
          >
            <a href="#">{name}</a>
          </Popconfirm>
        </Html>
      </mesh>
    </group>
  );
}

function Portals({ setReset }) {
  const [which, set] = useState(0);
  const { link, ...props } = store[which];
  const maps = useLoader(THREE.TextureLoader, store.map((entry) => entry.url)) // prettier-ignore
  return (
    <Dome
      onClick={() => {
        setReset((prev) => !prev);
        setTimeout(() => {
          set(link);
          setTimeout(() => {
            setReset((prev) => !prev);
          }, 500);
        }, 500);
      }}
      {...props}
      texture={maps[which]}
    />
  );
}

function App() {
  const [reset, setReset] = useState(false);
  return (
    <Canvas
      style={{ opacity: reset ? "0.1" : "1", transition: "0.5s all linear" }}
      frameloop="demand"
      camera={{ position: [0, 0, 0.1] }}
    >
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.2}
        autoRotate={false}
        rotateSpeed={-0.5}
      />
      <Suspense fallback={null}>
        <Preload all />
        <Portals setReset={setReset} />
      </Suspense>
    </Canvas>
  );
}

export default App;