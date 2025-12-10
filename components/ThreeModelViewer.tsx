import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ThreeModelViewerProps {
  modelUrl: string | null;
  fileName?: string;
  color: string;
  materialType?: 'standard' | 'phong' | 'wireframe';
  scale?: number;
  rotationY?: number;
  onPrintabilityChange?: (isValid: boolean, message?: string) => void;
}

const ThreeModelViewer: React.FC<ThreeModelViewerProps> = ({
  modelUrl,
  fileName,
  color,
  materialType = 'standard',
  scale = 1,
  rotationY = 0,
  onPrintabilityChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const modelRef = useRef<THREE.Mesh>();
  const animationIdRef = useRef<number>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create material based on type
  const createMaterial = (type: string, materialColor: string): THREE.Material => {
    const threeColor = new THREE.Color(materialColor);

    switch (type) {
      case 'phong':
        return new THREE.MeshPhongMaterial({
          color: threeColor,
          shininess: 100,
        });
      case 'wireframe':
        return new THREE.MeshBasicMaterial({
          color: threeColor,
          wireframe: true,
        });
      default:
        return new THREE.MeshStandardMaterial({
          color: threeColor,
          roughness: 0.4,
          metalness: 0.1,
        });
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-1, -1, -1);
    scene.add(pointLight);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Load STL model
  useEffect(() => {
    if (!sceneRef.current || !modelUrl) return;

    setIsLoading(true);
    setError(null);

    // Remove existing model
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current.geometry.dispose();
      if (Array.isArray(modelRef.current.material)) {
        modelRef.current.material.forEach(mat => mat.dispose());
      } else {
        modelRef.current.material.dispose();
      }
      modelRef.current = undefined;
    }

    const loader = new STLLoader();

    const createAndAddMesh = (geometry: THREE.BufferGeometry) => {
      // Create material
      const material = createMaterial(materialType, color);

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Center and scale the model
      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        const center = geometry.boundingBox.getCenter(new THREE.Vector3());
        mesh.position.sub(center);

        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 80 / maxDim;
        mesh.scale.setScalar(scaleFactor);
      }

      // Apply rotation
      if (rotationY !== 0) {
        mesh.rotation.y = rotationY;
      }

      // Apply additional scale
      if (scale !== 1) {
        mesh.scale.multiplyScalar(scale);
      }

      // Add to scene
      sceneRef.current!.add(mesh);
      modelRef.current = mesh;

      // Check printability
      if (geometry.boundingBox && onPrintabilityChange) {
        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        const height = Math.max(size.x, size.y, size.z);
        const isPrintable = height < 200;
        onPrintabilityChange(isPrintable, isPrintable ? 'Model is suitable for printing' : 'Model exceeds maximum height');
      }

      setIsLoading(false);
    };

    try {
      if (modelUrl.startsWith('data:')) {
        // Handle data URL
        const base64Data = modelUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }

        const geometry = loader.parse(arrayBuffer);
        createAndAddMesh(geometry);
      } else {
        // Handle regular URL
        loader.load(
          modelUrl,
          (geometry) => {
            createAndAddMesh(geometry);
          },
          (progress) => {
            // Progress callback
          },
          (error) => {
            console.error('Error loading model:', error);
            setError('Failed to load model');
            setIsLoading(false);
          }
        );
      }
    } catch (err) {
      console.error('Error parsing model:', err);
      setError(`Failed to parse model: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [modelUrl, color, materialType, scale, rotationY, onPrintabilityChange]);

  return (
    <div ref={mountRef} className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin mb-2">⚙️</div>
            <p>Loading model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-75 text-white rounded-lg z-10">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default ThreeModelViewer;
