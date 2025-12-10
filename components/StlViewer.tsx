import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface StlViewerProps {
  fileUrl: string | null;
  fileName: string;
  color: string;
  isSpliced?: boolean;
  orientation?: 'vertical' | 'flat' | 'ai-optimal';
  showSupports?: boolean;
  onPrintabilityChange?: (isValid: boolean, message?: string) => void;
}

const StlViewer: React.FC<StlViewerProps> = ({
  fileUrl,
  fileName,
  color,
  isSpliced = false,
  orientation = 'vertical',
  showSupports = false,
  onPrintabilityChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const modelRef = useRef<THREE.Mesh>();
  const modelGroupRef = useRef<THREE.Group>(); // Group to hold model for rotation
  const animationIdRef = useRef<number>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) {
      console.error('Mount ref not available');
      return;
    }

    // Clear any existing canvas
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    console.log('Initializing Three.js scene');

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;
    console.log('Scene created');

    // Camera
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    console.log('Container size:', width, height);
    
    if (width === 0 || height === 0) {
      console.error('Container has no size!');
      return;
    }
    
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    console.log('Camera created');

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    console.log('Renderer created, appending canvas to DOM');
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    console.log('Canvas appended, size:', width, height);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    console.log('Controls initialized');

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
    console.log('Lights added');

    // Add grid (printing bed)
    const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
    console.log('Grid added');

    // Add floor reference plane
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    console.log('Floor added');

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    console.log('Animation loop started');

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        console.log('Resizing to:', newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountRef.current);

    return () => {
      console.log('Cleaning up Three.js resources');
      resizeObserver.disconnect();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Load STL model (only when fileUrl changes)
  useEffect(() => {
    if (!sceneRef.current || !fileUrl) {
      console.log('Skipping load - scene or fileUrl not ready');
      return;
    }

    console.log('Loading model from:', fileUrl);
    setIsLoading(true);
    setError(null);

    // Remove existing model and group before loading new one
    if (modelGroupRef.current) {
      console.log('Removing old model group');
      sceneRef.current.remove(modelGroupRef.current);
      if (modelRef.current) {
        modelRef.current.geometry.dispose();
        if (Array.isArray(modelRef.current.material)) {
          modelRef.current.material.forEach(mat => mat.dispose());
        } else {
          modelRef.current.material.dispose();
        }
      }
      modelGroupRef.current = undefined;
      modelRef.current = undefined;
    }

    let isMounted = true;
    const loader = new STLLoader();

    const fitCameraToObject = (object: THREE.Object3D, camera: THREE.PerspectiveCamera, controls?: OrbitControls, offset = 1.25) => {
      const boundingBox = new THREE.Box3().setFromObject(object);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const sphere = boundingBox.getBoundingSphere(new THREE.Sphere());
      const radius = sphere.radius;

      const fov = camera.fov * (Math.PI / 180);
      const distance = Math.abs(radius / Math.sin(fov / 2)) * offset;

      const dir = new THREE.Vector3(1, 1, 1).normalize();
      const camPos = center.clone().add(dir.multiplyScalar(distance));
      camera.position.copy(camPos);
      camera.near = Math.max(0.1, radius / 100);
      camera.far = Math.max(1000, radius * 100);
      camera.updateProjectionMatrix();
      camera.lookAt(center);

      if (controls) {
        controls.target.copy(center);
        controls.update();
      }
    };

    const createAndAddMesh = (geometry: THREE.BufferGeometry) => {
      if (!isMounted) {
        console.log('Component unmounted, skipping mesh creation');
        return;
      }

      // Create material
      const threeColor = new THREE.Color(color);
      const material = new THREE.MeshStandardMaterial({
        color: threeColor,
        roughness: 0.4,
        metalness: 0.1,
      });

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Position model: center on XZ plane, base at Y=0 (on bed)
      geometry.computeBoundingBox();
      geometry.computeVertexNormals();
      const bbox = geometry.boundingBox;
      console.log('Bounding box:', { min: bbox?.min, max: bbox?.max });
      
      if (bbox) {
        // Calculate offsets to center on XZ and place bottom at Y=0
        const offsetX = -(bbox.min.x + bbox.max.x) / 2;
        const offsetY = -bbox.min.y;
        const offsetZ = -(bbox.min.z + bbox.max.z) / 2;
        
        mesh.position.set(offsetX, offsetY, offsetZ);
        console.log('Positioned at:', { x: offsetX, y: offsetY, z: offsetZ });
      }

      // Create group to hold mesh (for rotation handling)
      const group = new THREE.Group();
      group.add(mesh);

      // Add to scene
      if (sceneRef.current && !modelGroupRef.current) {
        console.log('Adding model group to scene');
        sceneRef.current.add(group);
        modelGroupRef.current = group;
        modelRef.current = mesh;
        console.log('Scene children:', sceneRef.current.children.length);
      } else if (modelGroupRef.current) {
        console.warn('Model already exists, skipping add');
        mesh.geometry.dispose();
        mesh.material.dispose();
        return;
      }

      // Fit camera to group
      if (cameraRef.current && group) {
        fitCameraToObject(group, cameraRef.current, controlsRef.current, 1.4);
      }

      setIsLoading(false);

      // Check printability
      const modelBbox = new THREE.Box3().setFromObject(mesh);
      const height = modelBbox.max.y - modelBbox.min.y;
      console.log('Model height (Y):', height);
      
      if (height > 200) {
        onPrintabilityChange?.(false, 'Model height exceeds 200mm build volume');
      } else {
        onPrintabilityChange?.(true);
      }
    };

    try {
      if (fileUrl.startsWith('blob:')) {
        console.log('Loading from blob URL');
        loader.load(
          fileUrl,
          (geometry) => {
            console.log('Blob geometry loaded');
            createAndAddMesh(geometry);
          },
          undefined,
          (error) => {
            console.error('Blob load error:', error);
            if (isMounted) {
              setError('Failed to load model');
              setIsLoading(false);
            }
          }
        );
      } else if (fileUrl.startsWith('data:')) {
        console.log('Loading from data URL');
        const base64Data = fileUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }
        const geometry = loader.parse(arrayBuffer);
        createAndAddMesh(geometry);
      } else {
        console.log('Loading from regular URL');
        loader.load(
          fileUrl,
          (geometry) => {
            console.log('URL geometry loaded');
            createAndAddMesh(geometry);
          },
          undefined,
          (error) => {
            console.error('URL load error:', error);
            if (isMounted) {
              setError('Failed to load model');
              setIsLoading(false);
            }
          }
        );
      }
    } catch (err) {
      console.error('Error:', err);
      if (isMounted) {
        setError(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [fileUrl, color, onPrintabilityChange]);

  // Update orientation (separate effect - rotates the model group and enforces Y >= 0)
  useEffect(() => {
    if (!modelGroupRef.current || !modelRef.current) {
      console.log('No model group/mesh to rotate');
      return;
    }

    console.log('Updating orientation to:', orientation);

    // Reset rotation and position
    modelGroupRef.current.rotation.set(0, 0, 0);
    modelGroupRef.current.position.set(0, 0, 0);

    // Apply orientation transform to the group (which rotates the mesh)
    // NOTE: vertical = 90° (standing tall), flat = 0° (laying down)
    if (orientation === 'vertical') {
      // Standing up - rotate 90 degrees on X axis
      modelGroupRef.current.rotateX(Math.PI / 2);
    } else if (orientation === 'flat') {
      // Laying flat - no rotation (default orientation)
      // modelGroupRef.current already has no rotation
    } else if (orientation === 'ai-optimal') {
      // AI-optimized angle
      modelGroupRef.current.rotateX(Math.PI / 4);
      modelGroupRef.current.rotateZ(Math.PI / 6);
    }

    // After rotation, enforce Y >= 0 (keep model on/above bed)
    const rotatedBbox = new THREE.Box3().setFromObject(modelGroupRef.current);
    const minY = rotatedBbox.min.y;
    
    // If any part is below Y=0, lift the entire group up
    if (minY < 0) {
      modelGroupRef.current.position.y = -minY;
      console.log('Physics constraint applied: lifted group by', -minY);
    }

    console.log('Group rotation and position applied:', {
      rotation: {
        x: modelGroupRef.current.rotation.x,
        y: modelGroupRef.current.rotation.y,
        z: modelGroupRef.current.rotation.z,
      },
      position: {
        x: modelGroupRef.current.position.x,
        y: modelGroupRef.current.position.y,
        z: modelGroupRef.current.position.z,
      },
      bboxMinY: minY,
    });

    // Update controls target to group center
    if (controlsRef.current && modelGroupRef.current) {
      const bbox = new THREE.Box3().setFromObject(modelGroupRef.current);
      const center = bbox.getCenter(new THREE.Vector3());
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, [orientation]);

  return (
    <div ref={mountRef} className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p>Loading model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-75 text-white">
          <div className="text-center">
            <p className="font-bold">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StlViewer;
