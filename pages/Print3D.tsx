import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Printer, CreditCard, Banknote, CheckCircle, ArrowRight, Loader2, AlertTriangle, Box, ChevronRight, X, Smartphone, Globe, ArrowDownToLine, ArrowUpFromLine, Wand2, Rotate3D } from 'lucide-react';
import { User, PrintOrder } from '../types';
import StlViewer from '../components/StlViewer';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { saveBlob as saveBlobToIdb } from '../services/idb';

interface Print3DProps {
  user?: User;
}

const Print3D: React.FC<Print3DProps> = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSpliced, setIsSpliced] = useState(false);
  const [orientation, setOrientation] = useState<'vertical' | 'flat' | 'ai-optimal'>('vertical');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showSupports, setShowSupports] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ volume: number; weight: number; dimensions: string } | null>(null);
  const [isPrintable, setIsPrintable] = useState(true);
  const [printabilityMessage, setPrintabilityMessage] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState('pla');
  const [color, setColor] = useState('White');
  const [infill, setInfill] = useState(20);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const PRICE_PER_GRAM = user?.type === 'university' ? 2.5 : 4.5;

  const MATERIALS = [
    { id: 'pla', name: 'PLA (Standard)', desc: 'Easy to print, biodegradable.', colors: ['White', 'Black', 'Red', 'Blue', 'Green'] },
    { id: 'abs', name: 'ABS (Durable)', desc: 'Strong, heat resistant.', colors: ['White', 'Black', 'Grey'] },
    { id: 'resin', name: 'Resin (Detail)', desc: 'High detail, smooth finish.', colors: ['Clear', 'Grey', 'Skin'] },
  ];

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  const calculateSTLDimensions = (arrayBuffer: ArrayBuffer): { volume: number; weight: number; dimensions: string } => {
    const view = new Uint8Array(arrayBuffer);
    
    if (view.length < 84) {
      console.warn('STL file too small:', view.length);
      return { volume: 0, weight: 5, dimensions: '0x0x0 mm' };
    }
    
    // Read triangle count from bytes 80-84 (little-endian uint32)
    const triangles = new Uint32Array(arrayBuffer, 80, 1)[0];
    console.log('Triangle count:', triangles);
    
    if (triangles === 0 || !isFinite(triangles) || triangles > 1000000) {
      console.warn('Invalid triangle count:', triangles);
      return { volume: 0, weight: 5, dimensions: '0x0x0 mm' };
    }
    
    // Expected file size: 80 (header) + 4 (count) + triangles * 50
    const expectedSize = 84 + triangles * 50;
    if (view.length < expectedSize) {
      console.warn('File too small for triangle count. Expected:', expectedSize, 'Got:', view.length);
      return { volume: 0, weight: 5, dimensions: '0x0x0 mm' };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let volume = 0;
    
    const dataView = new DataView(arrayBuffer);
    
    // Parse triangles
    for (let i = 0; i < triangles && i < 500000; i++) {
      const offset = 84 + (i * 50); // Byte offset for this triangle
      
      try {
        // Skip normal (offset + 0 to 12)
        // Read vertex 1 (offset + 12 to 24)
        const v1x = dataView.getFloat32(offset + 12, true);
        const v1y = dataView.getFloat32(offset + 16, true);
        const v1z = dataView.getFloat32(offset + 20, true);
        
        // Read vertex 2 (offset + 24 to 36)
        const v2x = dataView.getFloat32(offset + 24, true);
        const v2y = dataView.getFloat32(offset + 28, true);
        const v2z = dataView.getFloat32(offset + 32, true);
        
        // Read vertex 3 (offset + 36 to 48)
        const v3x = dataView.getFloat32(offset + 36, true);
        const v3y = dataView.getFloat32(offset + 40, true);
        const v3z = dataView.getFloat32(offset + 44, true);
        
        if (isFinite(v1x) && isFinite(v1y) && isFinite(v1z)) {
          minX = Math.min(minX, v1x, v2x, v3x);
          maxX = Math.max(maxX, v1x, v2x, v3x);
          minY = Math.min(minY, v1y, v2y, v3y);
          maxY = Math.max(maxY, v1y, v2y, v3y);
          minZ = Math.min(minZ, v1z, v2z, v3z);
          maxZ = Math.max(maxZ, v1z, v2z, v3z);
        }
        
        // Volume calculation using signed volume formula
        const volumeContribution = 
          v1x * (v2y * v3z - v2z * v3y) +
          v1y * (v2z * v3x - v2x * v3z) +
          v1z * (v2x * v3y - v2y * v3x);
        volume += volumeContribution;
      } catch (e) {
        console.error('Error reading triangle', i, e);
        break;
      }
    }
    
    console.log('Bounding box:', { minX, maxX, minY, maxY, minZ, maxZ });
    
    volume = Math.abs(volume) / 6;
    
    let width = maxX - minX;
    let height = maxY - minY;
    let depth = maxZ - minZ;
    
    // Fallback if parsing failed
    if (!isFinite(width)) width = 10;
    if (!isFinite(height)) height = 10;
    if (!isFinite(depth)) depth = 10;
    
    width = Math.max(1, width);
    height = Math.max(1, height);
    depth = Math.max(1, depth);
    
    const volumeCm3 = volume / 1000;
    const weightGrams = Math.max(5, Math.round(volumeCm3 * 1.24));
    const dimensionsStr = `${Math.round(width)}x${Math.round(height)}x${Math.round(depth)} mm`;
    
    console.log('Final result:', { volume, volumeCm3, weightGrams, dimensionsStr });
    
    return {
      volume: Math.round(volumeCm3),
      weight: isFinite(weightGrams) ? weightGrams : 5,
      dimensions: dimensionsStr
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setPrintabilityMessage(null);
    setIsPrintable(true);
    
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      if (uploadedFile.size > 50 * 1024 * 1024) {
        setErrorMsg("File is too large (Max 50MB). Please compress or split the file.");
        return;
      }
      const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
      if (ext !== 'stl' && ext !== 'obj') {
         setErrorMsg("Invalid file type. Please upload .stl or .obj");
         return;
      }

      setFile(uploadedFile);
      setAnalyzing(true);
      setIsSpliced(false);
      setOrientation('vertical');
      setShowSupports(false);
      
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      const url = URL.createObjectURL(uploadedFile);
      setFileUrl(url);

      // Analyze file to calculate dimensions and weight
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          console.log('ArrayBuffer length:', arrayBuffer.byteLength);
          const result = calculateSTLDimensions(arrayBuffer);
          console.log('Analysis result:', result);
          setAnalysisResult(result);
        } catch (err) {
          console.error('Error calculating dimensions:', err);
          setAnalysisResult({
            volume: 0,
            weight: 20,
            dimensions: 'Unable to parse'
          });
        }
        setAnalyzing(false);
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleClearFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setFile(null);
    setIsSpliced(false);
    setErrorMsg(null);
    setIsPrintable(true);
    setPrintabilityMessage(null);
  };

  // Calculate estimated support material needed for a given orientation
  // Based on model dimensions and overhang angles
  const calculateSupportWastage = (arrayBuffer: ArrayBuffer, orientation: 'vertical' | 'flat'): number => {
    try {
      const view = new Uint8Array(arrayBuffer);
      
      if (view.length < 84) return 0;
      
      const triangles = new Uint32Array(arrayBuffer, 80, 1)[0];
      if (triangles === 0 || !isFinite(triangles) || triangles > 1000000) return 0;
      
      const expectedSize = 84 + triangles * 50;
      if (view.length < expectedSize) return 0;
      
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      let overhangs = 0; // Count of triangles with significant overhangs
      
      const dataView = new DataView(arrayBuffer);
      
      // Parse triangles to find bounds and overhangs
      for (let i = 0; i < triangles && i < 500000; i++) {
        const offset = 84 + (i * 50);
        
        try {
          // Read normal vector
          const nx = dataView.getFloat32(offset + 0, true);
          const ny = dataView.getFloat32(offset + 4, true);
          const nz = dataView.getFloat32(offset + 8, true);
          
          // Read vertices
          const v1y = dataView.getFloat32(offset + 16, true);
          const v2y = dataView.getFloat32(offset + 28, true);
          const v3y = dataView.getFloat32(offset + 40, true);
          
          const v1x = dataView.getFloat32(offset + 12, true);
          const v2x = dataView.getFloat32(offset + 24, true);
          const v3x = dataView.getFloat32(offset + 36, true);
          
          const v1z = dataView.getFloat32(offset + 20, true);
          const v2z = dataView.getFloat32(offset + 32, true);
          const v3z = dataView.getFloat32(offset + 44, true);
          
          // Update bounds
          minX = Math.min(minX, v1x, v2x, v3x);
          maxX = Math.max(maxX, v1x, v2x, v3x);
          minY = Math.min(minY, v1y, v2y, v3y);
          maxY = Math.max(maxY, v1y, v2y, v3y);
          minZ = Math.min(minZ, v1z, v2z, v3z);
          maxZ = Math.max(maxZ, v1z, v2z, v3z);
          
          // Check for overhangs based on orientation
          // Overhang occurs when normal points mostly downward relative to print direction
          if (orientation === 'vertical') {
            // Printing vertically - check if normal has significant downward Z component
            if (nz < -0.3) overhangs++;
          } else {
            // Printing flat - check if normal has significant downward Y component
            if (ny < -0.3) overhangs++;
          }
        } catch (e) {
          // Skip malformed triangles
        }
      }
      
      const width = Math.abs(maxX - minX) || 1;
      const height = Math.abs(maxY - minY) || 1;
      const depth = Math.abs(maxZ - minZ) || 1;
      
      // Estimate support volume based on orientation
      // More overhangs and larger projection = more support needed
      let supportEstimate = 0;
      
      if (orientation === 'vertical') {
        // Vertical: footprint is width × depth, more prone to side overhangs
        const footprint = width * depth;
        supportEstimate = footprint * (height * 0.15) + (overhangs * 0.5);
      } else {
        // Flat: footprint is width × height, fewer overhangs but might have floating features
        const footprint = width * height;
        supportEstimate = footprint * (depth * 0.1) + (overhangs * 0.3);
      }
      
      return Math.max(0, supportEstimate);
    } catch (e) {
      console.error('Error calculating support:', e);
      return 0;
    }
  };

  const handleAiOrientation = () => {
    if (!file) return;
    
    setIsAiThinking(true);
    
    // Read file and calculate support for both orientations
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        const verticalWastage = calculateSupportWastage(arrayBuffer, 'vertical');
        const flatWastage = calculateSupportWastage(arrayBuffer, 'flat');
        
        console.log('Support analysis:', { verticalWastage, flatWastage });
        
        // Choose orientation with less support wastage
        const bestOrientation = flatWastage < verticalWastage ? 'flat' : 'vertical';
        
        // Simulate thinking time
        setTimeout(() => {
          setOrientation(bestOrientation);
          setIsAiThinking(false);
        }, 1500);
      } catch (err) {
        console.error('Error in AI analysis:', err);
        setIsAiThinking(false);
        setOrientation('vertical');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const onPrintabilityChange = useCallback((valid: boolean, message?: string) => {
      setIsPrintable(valid);
      setPrintabilityMessage(message || null);
  }, []);

  const getPrice = () => {
    if (!analysisResult) return 0;
    return Math.round(analysisResult.weight * PRICE_PER_GRAM);
  };

  const handleInitiateOrder = () => {
     if (paymentMethod === 'online') {
         setShowPaymentModal(true);
     } else {
         handleSubmitOrder();
     }
  };

  const handleSubmitOrder = async () => {
    if (!file) return;

    setIsProcessingPayment(true);
    if (paymentMethod === 'online') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowPaymentModal(false);
    }
    
    // Simulate Splicing conversion
    const gcodeFilename = file.name.replace(/\.(stl|obj)$/i, '.gcode');

    // Save the STL blob to IndexedDB and store its key in the order
    try {
      const stlKey = `stl-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
      await saveBlobToIdb(stlKey, file);

      const newOrder: PrintOrder = {
        id: `PRT-${Math.floor(1000 + Math.random() * 9000)}`,
        fileName: file.name,
        stlKey: stlKey,
        gcodeFile: gcodeFilename, 
        thumbnail: 'https://picsum.photos/seed/print/200/200', 
        material: MATERIALS.find(m => m.id === selectedMaterialId)?.name || 'PLA',
        color: color,
        infill: infill,
        cost: getPrice(),
        status: 'queued',
        progress: 0,
        submitDate: new Date().toLocaleDateString(),
        paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending',
        paymentMethod: paymentMethod,
        // Add model details
        dimensions: analysisResult?.dimensions,
        weight: analysisResult?.weight,
        volume: analysisResult?.volume,
        orientation: orientation as 'vertical' | 'flat',
        userId: user?.id,
        userName: user?.name,
      };

      await authService.createPrintOrder(newOrder);

      setIsProcessingPayment(false);
      setSuccessOrder(newOrder.id);
      setStep(4);
    } catch (err) {
      console.error('Failed to save STL to IndexedDB:', err);
      setErrorMsg('Failed to store model file locally. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="h-screen bg-[#0f172a] text-white flex flex-col overflow-hidden font-sans pt-16 md:pt-20">
        <div className="h-14 md:h-16 bg-[#020617] border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-20 shadow-lg shrink-0">
            <div className="flex items-center gap-3">
                 <div className="bg-brand-600 p-1.5 md:p-2 rounded-xl shadow-lg shadow-brand-900/20">
                    <Printer className="w-4 h-4 md:w-5 md:h-5 text-white" />
                 </div>
                 <div>
                    <span className="font-display font-bold text-base md:text-lg leading-tight block">IDEA Slicer</span>
                    <span className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider font-bold">Fabrication Engine v2.0</span>
                 </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
                 <div className="hidden md:flex flex-col items-end text-xs">
                    <span className="text-slate-500 font-medium">Standard Rate</span>
                    <span className="text-brand-400 font-bold text-sm">₹{PRICE_PER_GRAM}/g</span>
                 </div>
                 <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
                 <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] md:text-xs font-bold transition-all border border-slate-700 hover:border-slate-500">
                    Back to Dashboard
                 </button>
            </div>
        </div>

        <div className="flex-grow flex flex-col md:flex-row relative overflow-hidden">
            <div className="h-[50vh] md:h-auto flex-grow bg-[#0f172a] relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#020617]">
                 {!file ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6">
                         <div className="w-full max-w-lg h-48 md:h-64 border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center hover:border-brand-500 hover:bg-slate-800/50 transition-all cursor-pointer group relative overflow-hidden">
                             <div className="absolute inset-0 bg-brand-500/5 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-3xl"></div>
                             <Upload className="w-10 h-10 md:w-12 md:h-12 mb-4 group-hover:text-brand-500 transition-colors z-10" />
                             <p className="font-bold text-base md:text-lg z-10 text-center">Upload 3D Model</p>
                             <p className="text-xs mt-2 text-slate-400 z-10 text-center">Supports .STL and .OBJ files (Max 50MB)</p>
                             <input type="file" accept=".stl,.obj" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={handleFileUpload} />
                         </div>
                         {errorMsg && (
                            <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50 animate-fade-in text-xs md:text-sm">
                               <AlertTriangle className="w-4 h-4 shrink-0" />
                               <span className="font-bold">{errorMsg}</span>
                            </div>
                         )}
                     </div>
                 ) : (
                     <>
                        <StlViewer 
                            fileUrl={fileUrl} 
                            fileName={file.name} 
                            color={color} 
                            isSpliced={isSpliced} 
                            orientation={orientation}
                            showSupports={showSupports}
                            onPrintabilityChange={onPrintabilityChange}
                        />
                        {!isPrintable && (
                            <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur text-white px-4 py-2 md:px-6 md:py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up z-30 border border-red-400 w-[90%] md:w-auto">
                                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                                <div>
                                    <p className="font-bold text-xs md:text-sm">Print Not Possible</p>
                                    <p className="text-[10px] md:text-xs opacity-90">{printabilityMessage}</p>
                                </div>
                            </div>
                        )}
                     </>
                 )}
                 {file && (
                     <div className="absolute bottom-4 left-4 right-4 md:left-8 md:bottom-8 md:right-auto md:w-auto flex flex-col gap-3 animate-fade-in md:max-w-sm pointer-events-none">
                         <div className="bg-slate-900/90 backdrop-blur p-3 md:p-4 rounded-2xl border border-slate-700/50 shadow-2xl pointer-events-auto">
                             <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Controls</h4>
                             <div className="grid grid-cols-4 md:grid-cols-3 gap-2">
                                <button onClick={() => setOrientation('vertical')} className="px-2 py-2 rounded-lg text-[10px] font-bold border flex flex-col md:flex-row items-center justify-center gap-1 bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"><ArrowUpFromLine className="w-3 h-3" /> <span className="hidden md:inline">Vertical</span></button>
                                <button onClick={() => setOrientation('flat')} className="px-2 py-2 rounded-lg text-[10px] font-bold border flex flex-col md:flex-row items-center justify-center gap-1 bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"><ArrowDownToLine className="w-3 h-3" /> <span className="hidden md:inline">Flat</span></button>
                                <button onClick={handleAiOrientation} disabled={isAiThinking} className="px-2 py-2 rounded-lg text-[10px] font-bold border flex flex-col md:flex-row items-center justify-center gap-1 bg-slate-800 text-brand-400 border-slate-700 hover:bg-slate-700"><Wand2 className="w-3 h-3" /> <span className="hidden md:inline">AI</span></button>
                                <button onClick={handleClearFile} className="px-2 py-2 rounded-lg text-[10px] font-bold border flex flex-col md:flex-row items-center justify-center gap-1 bg-slate-800 text-red-400 border-slate-700 hover:bg-red-900/20"><Box className="w-3 h-3" /> <span className="hidden md:inline">Clear</span></button>
                             </div>
                         </div>
                     </div>
                 )}
            </div>

            <div className="flex-grow md:flex-none md:w-[400px] bg-slate-900/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-800 flex flex-col z-10 shadow-2xl overflow-hidden h-[50vh] md:h-auto">
                <div className="p-4 md:p-8 border-b border-slate-800 shrink-0">
                    <div className="flex justify-between items-center mb-3 md:mb-6">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                            Step {step} of 4
                        </span>
                        {step > 1 && step < 4 && <button onClick={() => setStep(step-1)} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Go Back</button>}
                    </div>
                    <div className="flex gap-2 h-1.5">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-brand-500' : 'bg-slate-800'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-6 animate-slide-up">
                            <div><h2 className="text-2xl md:text-3xl font-display font-bold mb-1 md:mb-2">Model Analysis</h2><p className="text-slate-400 text-xs md:text-sm">We need to analyze the geometry to calculate material costs.</p></div>
                            {!file ? (
                                <div className="p-4 md:p-6 border border-dashed border-slate-700 rounded-2xl bg-slate-800/50 text-center"><p className="text-slate-500 text-sm">Waiting for model upload...</p></div>
                            ) : analyzing ? (
                                <div className="text-center py-8 md:py-12"><div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4"><div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div><div className="absolute inset-0 border-4 border-t-brand-500 rounded-full animate-spin"></div></div><p className="text-sm font-bold">Scanning Geometry...</p></div>
                            ) : (
                                <><div className="bg-slate-800/50 p-4 md:p-6 rounded-2xl border border-slate-700 space-y-3"><div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-3"><span className="text-slate-400">File Name</span><span className="font-bold truncate max-w-[120px] md:max-w-[150px] text-white">{file.name}</span></div><div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-3"><span className="text-slate-400">Est. Weight</span><span className="font-bold text-white">{analysisResult?.weight}g</span></div><div className="flex justify-between items-center text-sm"><span className="text-slate-400">Dimensions</span><span className="font-mono text-xs bg-slate-900 px-2 py-1 rounded text-brand-400">{analysisResult?.dimensions}</span></div></div>
                                {!isPrintable ? <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center"><p className="text-red-400 font-bold mb-1 text-sm">Printing Unavailable</p><p className="text-[10px] md:text-xs text-red-300">Model dimensions exceed the printer's build volume.</p></div> : <button onClick={() => setStep(2)} className="w-full py-3 md:py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold transition-all shadow-lg shadow-brand-900/20 flex items-center justify-center gap-2 group">Configure Print <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>}</>
                            )}
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-6 animate-slide-up">
                            <div><h2 className="text-2xl md:text-3xl font-display font-bold mb-2">Print Settings</h2><p className="text-slate-400 text-xs md:text-sm">Choose material and structural density.</p></div>
                            <div className="space-y-3"><label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider block">Material Type</label><div className="grid grid-cols-1 gap-3">{MATERIALS.map(m => (<div key={m.id} onClick={() => { setSelectedMaterialId(m.id); setColor(m.colors[0]); }} className={`p-3 md:p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${selectedMaterialId === m.id ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}><div className="flex justify-between items-center mb-1 relative z-10"><span className={`font-bold text-sm ${selectedMaterialId === m.id ? 'text-brand-400' : 'text-white'}`}>{m.name}</span>{selectedMaterialId === m.id && <CheckCircle className="w-4 h-4 text-brand-500" />}</div><p className="text-[10px] md:text-xs text-slate-400 relative z-10">{m.desc}</p></div>))}</div></div>
                            <div className="space-y-3"><label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider block">Filament Color</label><div className="flex flex-wrap gap-2 md:gap-3">{MATERIALS.find(m => m.id === selectedMaterialId)?.colors.map(c => (<button key={c} onClick={() => setColor(c)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${color === c ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'}`}><span className="w-2 h-2 rounded-full" style={{backgroundColor: c.toLowerCase()}}></span>{c}</button>))}</div></div>
                            <div className="space-y-4"><label className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider"><span>Infill Density</span><span className="text-brand-400 bg-brand-900/30 px-2 py-0.5 rounded">{infill}%</span></label><div className="relative h-2 bg-slate-800 rounded-full"><div className="absolute h-full bg-brand-500 rounded-full" style={{width: `${infill}%`}}></div><input type="range" min="10" max="100" step="10" value={infill} onChange={(e) => setInfill(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/></div></div>
                            <div className="pt-4 md:pt-6 border-t border-slate-800"><div className="flex justify-between items-end mb-4 md:mb-6"><span className="text-slate-400 text-xs md:text-sm">Estimated Cost</span><div className="text-right"><span className="text-2xl md:text-3xl font-display font-bold text-white">₹{getPrice()}</span><span className="text-[10px] text-slate-500 block">Inc. of all taxes</span></div></div><button onClick={() => setStep(3)} className="w-full py-3 md:py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group">Proceed to Payment <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button></div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-6 animate-slide-up">
                            <div><h2 className="text-2xl md:text-3xl font-display font-bold mb-2">Checkout</h2><p className="text-slate-400 text-xs md:text-sm">Review your order.</p></div>
                            <div className="bg-slate-800/50 p-4 md:p-6 rounded-2xl border border-slate-700"><h3 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">Order Summary</h3><div className="space-y-3 text-xs md:text-sm"><div className="flex justify-between"><span className="text-slate-400">File</span> <span className="font-bold text-white truncate max-w-[120px]">{file?.name}</span></div><div className="flex justify-between"><span className="text-slate-400">Material</span> <span className="font-bold text-white">{MATERIALS.find(m => m.id === selectedMaterialId)?.name}</span></div><div className="flex justify-between"><span className="text-slate-400">Color</span> <span className="font-bold text-white">{color}</span></div><div className="flex justify-between"><span className="text-slate-400">Infill</span> <span className="font-bold text-white">{infill}%</span></div><div className="flex justify-between font-bold text-brand-400 pt-3 border-t border-slate-700 mt-3"><span >Total Payable</span> <span className="text-base md:text-lg">₹{getPrice()}</span></div></div></div>
                            <div className="space-y-3">
                                <button onClick={() => setPaymentMethod('online')} className={`w-full p-3 md:p-4 rounded-xl border flex items-center justify-between transition-all group ${paymentMethod === 'online' ? 'bg-brand-500/10 border-brand-500 text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}`}><span className="flex items-center gap-3"><div className={`p-2 rounded-lg ${paymentMethod === 'online' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-500'}`}><CreditCard className="w-4 h-4 md:w-5 md:h-5" /></div><span className="font-bold text-sm">Pay Online</span></span>{paymentMethod === 'online' && <CheckCircle className="w-4 h-4 text-brand-500" />}</button>
                                <button onClick={() => setPaymentMethod('cash')} className={`w-full p-3 md:p-4 rounded-xl border flex items-center justify-between transition-all group ${paymentMethod === 'cash' ? 'bg-brand-500/10 border-brand-500 text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}`}><span className="flex items-center gap-3"><div className={`p-2 rounded-lg ${paymentMethod === 'cash' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-500'}`}><Banknote className="w-4 h-4 md:w-5 md:h-5" /></div><span className="font-bold text-sm">Pay at Lab</span></span>{paymentMethod === 'cash' && <CheckCircle className="w-4 h-4 text-brand-500" />}</button>
                            </div>
                            <button onClick={handleInitiateOrder} disabled={isProcessingPayment} className="w-full py-3 md:py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg">{isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}</button>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="text-center py-8 md:py-12 animate-slide-up h-full flex flex-col items-center justify-center">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-500" /></div>
                            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 text-white">Order Confirmed!</h2>
                            <p className="text-slate-400 text-xs md:text-sm mb-8 max-w-xs mx-auto">Your design has been converted to G-code and sent to the Staff Portal for review.</p>
                            <div className="bg-slate-800 rounded-xl p-4 mb-8 w-full"><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Order ID</p><p className="font-mono text-lg text-brand-400 tracking-wider">{successOrder}</p></div>
                            <button onClick={() => navigate('/dashboard')} className="w-full py-3 md:py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold transition-all shadow-lg shadow-brand-900/20">Go to Dashboard</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
        {showPaymentModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowPaymentModal(false)}></div>
                <div className="relative bg-white text-slate-900 rounded-2xl w-full max-w-md overflow-hidden animate-slide-up shadow-2xl">
                    {isProcessingPayment ? (
                         <div className="p-12 text-center flex flex-col items-center justify-center"><div className="w-16 h-16 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin mb-6"></div><h3 className="text-xl font-bold">Processing Payment</h3><p className="text-slate-500 mt-2">Please do not close this window...</p></div>
                    ) : (
                        <>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="text-lg font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-600" /> Payment Method</h3><button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button></div>
                            <div className="p-6 space-y-4"><p className="text-sm text-slate-500 mb-2">Select a payment option to complete your transaction of <span className="font-bold text-slate-900">₹{getPrice()}</span>.</p><button onClick={handleSubmitOrder} className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all group"><div className="flex items-center gap-4"><div className="bg-blue-100 p-2 rounded-lg text-blue-600"><CreditCard className="w-5 h-5" /></div><div className="text-left"><p className="font-bold text-sm">Credit / Debit Card</p><p className="text-xs text-slate-500">Visa, Mastercard, RuPay</p></div></div><ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500" /></button><button onClick={handleSubmitOrder} className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all group"><div className="flex items-center gap-4"><div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Smartphone className="w-5 h-5" /></div><div className="text-left"><p className="font-bold text-sm">UPI / QR Code</p><p className="text-xs text-slate-500">GPay, PhonePe, Paytm</p></div></div><ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500" /></button><button onClick={handleSubmitOrder} className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all group"><div className="flex items-center gap-4"><div className="bg-green-100 p-2 rounded-lg text-green-600"><Globe className="w-5 h-5" /></div><div className="text-left"><p className="font-bold text-sm">Net Banking</p><p className="text-xs text-slate-500">All Major Banks Supported</p></div></div><ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500" /></button></div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center"><p className="text-xs text-slate-400 flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Secure Payment Gateway (256-bit SSL)</p></div>
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

const Lock = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

export default Print3D;
