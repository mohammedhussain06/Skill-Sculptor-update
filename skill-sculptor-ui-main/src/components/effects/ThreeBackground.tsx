import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  /** Color of nodes and lines (default: soft indigo #818cf8) */
  primaryColor?: number;
  /** Secondary node color (default: warm sage/teal #2dd4bf) */
  secondaryColor?: number;
  /** Number of nodes (default: 80 for optimal performance and clean look) */
  nodeCount?: number;
  /** Base opacity of the canvas (default: 0.25) */
  opacity?: number;
}

/**
 * ThreeBackground — Tech-inspired interactive 3D node network (constellation).
 * Faint points connected by quiet, thin lines that represent connections/roadmaps.
 * Drifts slowly and reacts to mouse movement. Perfect "online tech study" vibe.
 */
export function ThreeBackground({
  primaryColor = 0x818cf8,
  secondaryColor = 0x2dd4bf,
  nodeCount = 85,
  opacity = 0.22,
}: ThreeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 40);

    // ── Create Nodes data ─────────────────────────
    const nodes: {
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      color: THREE.Color;
    }[] = [];

    const colorA = new THREE.Color(primaryColor);
    const colorB = new THREE.Color(secondaryColor);

    for (let i = 0; i < nodeCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 35
      );
      // Very slow movement speed
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04
      );
      const t = Math.random();
      const color = colorA.clone().lerp(colorB, t);

      nodes.push({ pos, vel, color });
    }

    // ── Point Cloud (Nodes) ───────────────────────
    const pointPositions = new Float32Array(nodeCount * 3);
    const pointColors = new Float32Array(nodeCount * 3);

    nodes.forEach((node, i) => {
      const i3 = i * 3;
      pointPositions[i3] = node.pos.x;
      pointPositions[i3 + 1] = node.pos.y;
      pointPositions[i3 + 2] = node.pos.z;

      pointColors[i3] = node.color.r;
      pointColors[i3 + 1] = node.color.g;
      pointColors[i3 + 2] = node.color.b;
    });

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));

    const pointMaterial = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(pointCloud);

    // ── Connecting Lines (Network) ────────────────
    // We allocate a line segments buffer geometry
    const maxLineConnections = nodeCount * 8; // generous limit
    const linePositions = new Float32Array(maxLineConnections * 2 * 3);
    const lineColors = new Float32Array(maxLineConnections * 2 * 3);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.12,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // ── Mouse Interaction ─────────────────────────
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 4;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // ── Animation Loop ────────────────────────────
    let raf: number;
    const connectionThreshold = 14; // max distance to draw a line

    const animate = () => {
      raf = requestAnimationFrame(animate);

      // Update node positions
      nodes.forEach((node) => {
        node.pos.add(node.vel);

        // Boundary checks (bounce back)
        if (Math.abs(node.pos.x) > 40) node.vel.x *= -1;
        if (Math.abs(node.pos.y) > 28) node.vel.y *= -1;
        if (Math.abs(node.pos.z) > 20) node.vel.z *= -1;
      });

      // Update point positions buffer attribute
      const positionsAttr = pointGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i];
        positionsAttr.setXYZ(i, node.pos.x, node.pos.y, node.pos.z);
      }
      positionsAttr.needsUpdate = true;

      // Re-calculate line connections
      let lineIndex = 0;
      const linePositionsAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute;
      const lineColorsAttr = lineGeometry.getAttribute('color') as THREE.BufferAttribute;

      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dist = nodes[i].pos.distanceTo(nodes[j].pos);

          if (dist < connectionThreshold && lineIndex < maxLineConnections) {
            // Segment start
            linePositionsAttr.setXYZ(lineIndex * 2, nodes[i].pos.x, nodes[i].pos.y, nodes[i].pos.z);
            lineColorsAttr.setXYZ(lineIndex * 2, nodes[i].color.r, nodes[i].color.g, nodes[i].color.b);

            // Segment end
            linePositionsAttr.setXYZ(lineIndex * 2 + 1, nodes[j].pos.x, nodes[j].pos.y, nodes[j].pos.z);
            lineColorsAttr.setXYZ(lineIndex * 2 + 1, nodes[j].color.r, nodes[j].color.g, nodes[j].color.b);

            lineIndex++;
          }
        }
      }

      // Reset remaining line coordinates to 0 to hide unused slots
      for (let i = lineIndex; i < maxLineConnections; i++) {
        linePositionsAttr.setXYZ(i * 2, 0, 0, 0);
        linePositionsAttr.setXYZ(i * 2 + 1, 0, 0, 0);
      }

      linePositionsAttr.needsUpdate = true;
      lineColorsAttr.needsUpdate = true;

      // Camera drift from mouse
      camera.position.x += (mouseX - camera.position.x) * 0.02;
      camera.position.y += (-mouseY - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      pointGeometry.dispose();
      pointMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [primaryColor, secondaryColor, nodeCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity }}
      aria-hidden="true"
    />
  );
}
