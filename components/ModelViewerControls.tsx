import React, { useState } from 'react';
import ThreeModelViewer from './ThreeModelViewer';

const ModelViewerControls: React.FC = () => {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [color, setColor] = useState<string>('#ffffff');
  const [materialType, setMaterialType] = useState<'standard' | 'phong' | 'wireframe'>('standard');
  const [scale, setScale] = useState<number>(1);
  const [rotationY, setRotationY] = useState<number>(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/models/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setModelUrl(data.fileUrl);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    }
  };

  const analyzeModel = async () => {
    if (!modelUrl) return;

    setLoading(true);
    try {
      const response = await fetch('/api/models/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: modelUrl }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data);
      } else {
        alert('Analysis failed: ' + data.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Controls Panel */}
      <div className="w-full lg:w-80 bg-gray-100 p-6 space-y-6">
        <h2 className="text-xl font-bold">3D Model Viewer</h2>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Upload Model (STL or GLB)</label>
          <input
            type="file"
            accept=".stl,.glb"
            onChange={handleFileUpload}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 border rounded cursor-pointer"
          />
        </div>

        {/* Material Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Material</label>
          <select
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value as 'standard' | 'phong' | 'wireframe')}
            className="w-full p-2 border rounded"
          >
            <option value="standard">Standard</option>
            <option value="phong">Phong</option>
            <option value="wireframe">Wireframe</option>
          </select>
        </div>

        {/* Scale Slider */}
        <div>
          <label className="block text-sm font-medium mb-2">Scale: {scale.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Rotation Slider */}
        <div>
          <label className="block text-sm font-medium mb-2">Rotation Y: {rotationY}°</label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={rotationY}
            onChange={(e) => setRotationY(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzeModel}
          disabled={!modelUrl || loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? 'Analyzing...' : 'Analyze Model'}
        </button>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-2 text-sm">
            <h3 className="font-bold">Analysis Results</h3>
            <div>
              <strong>Dimensions:</strong>
              <p>Width: {analysis.dimensions.width.toFixed(2)} mm</p>
              <p>Height: {analysis.dimensions.height.toFixed(2)} mm</p>
              <p>Depth: {analysis.dimensions.depth.toFixed(2)} mm</p>
            </div>
            <div>
              <strong>Volume:</strong>
              <p>{analysis.volume.mm3.toFixed(2)} mm³</p>
              <p>{analysis.volume.cm3.toFixed(2)} cm³</p>
            </div>
            <div>
              <strong>Weight:</strong>
              <p>{analysis.weightGrams.toFixed(2)} grams</p>
            </div>
            <div>
              <strong>Cost:</strong>
              <p>Students: ₹{analysis.costStudent.toFixed(2)}</p>
              <p>Guests: ₹{analysis.costGuest.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3D Viewer */}
      <div className="flex-1">
        {modelUrl ? (
          <ThreeModelViewer
            modelUrl={modelUrl}
            color={color}
            materialType={materialType}
            scale={scale}
            rotationY={rotationY}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <p className="text-gray-500">Upload a 3D model to view</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelViewerControls;
