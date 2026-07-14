'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground({ isFixed = true, color = 0x888888 }: { isFixed?: boolean, color?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const parent = containerRef.current.parentElement || document.body;
    
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(75, parent.clientWidth / parent.clientHeight, 0.1, 1000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(parent.clientWidth, parent.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const starVertices: number[] = [];
    const vectors: THREE.Vector3[] = [];
    
    for (let i = 0; i < 2000; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      starVertices.push(x, y, z);
      vectors.push(new THREE.Vector3(x, y, z));
    }
    // 5 Constellation Presets
    const CONSTELLATIONS = [
      // Ursa Major (Big Dipper)
      {
        stars: [[0, 0], [20, 10], [40, 5], [60, 20], [80, 15], [95, 30], [100, 50]],
        edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]
      },
      // Cassiopeia
      {
        stars: [[0, 30], [20, 0], [40, 20], [60, -10], [80, 40]],
        edges: [[0, 1], [1, 2], [2, 3], [3, 4]]
      },
      // Orion
      {
        stars: [[0, 40], [30, 40], [15, 0], [20, 0], [25, 0], [-10, -40], [40, -40]],
        edges: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]]
      },
      // Cygnus (Swan)
      {
        stars: [[20, 60], [20, 20], [20, -30], [-20, 20], [60, 20], [20, 0]],
        edges: [[0, 1], [1, 4], [1, 3], [1, 5], [5, 2]]
      },
      // Scorpius
      {
        stars: [[40, 40], [20, 30], [0, 20], [-10, 0], [-15, -20], [-5, -40], [10, -50], [30, -50], [40, -35]],
        edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]]
      }
    ];

    // Create Constellations
    const lineVertices: number[] = [];
    const numberOfConstellationInstances = 35; // How many constellations to spawn

    for (let i = 0; i < numberOfConstellationInstances; i++) {
      const preset = CONSTELLATIONS[i % CONSTELLATIONS.length];
      
      // Random origin in the same bounds as scattered stars
      const origin = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(2000),
        THREE.MathUtils.randFloatSpread(2000),
        THREE.MathUtils.randFloatSpread(2000)
      );
      
      // Random rotation
      const euler = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      const scale = THREE.MathUtils.randFloat(0.8, 2.5);
      const instancePoints: THREE.Vector3[] = [];
      
      preset.stars.forEach(pt => {
        // Map 2D point to 3D space, apply transformations
        const vec = new THREE.Vector3(pt[0], pt[1], 0);
        vec.multiplyScalar(scale);
        vec.applyEuler(euler);
        vec.add(origin);
        
        instancePoints.push(vec);
        
        // Push these specific stars into the general star vertices so they render
        starVertices.push(vec.x, vec.y, vec.z);
      });
      
      preset.edges.forEach(edge => {
        const p1 = instancePoints[edge[0]];
        const p2 = instancePoints[edge[1]];
        lineVertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      });
    }
    
    // Re-create the geometry for stars since we added constellation stars
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    
    const material = new THREE.PointsMaterial({ color, size: 2, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(geometry, material);

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
    const linesMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 });
    const constellations = new THREE.LineSegments(linesGeometry, linesMaterial);

    const spaceGroup = new THREE.Group();
    spaceGroup.add(stars);
    spaceGroup.add(constellations);
    scene.add(spaceGroup);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      spaceGroup.rotation.y += 0.0005;
      spaceGroup.rotation.x += 0.0002;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      linesGeometry.dispose();
      linesMaterial.dispose();
      renderer.dispose();
    };
  }, [color]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: isFixed ? 'fixed' : 'absolute', 
        inset: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0, 
        pointerEvents: 'none' 
      }} 
    />
  );
}
