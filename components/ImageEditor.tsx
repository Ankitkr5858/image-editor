"use client";

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Plus, Move, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  opacity: number;
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  width: number;
  height: number;
  selected: boolean;
  locked: boolean;
  lineHeight: number;
  letterSpacing: number;
  textShadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

interface ImageEditorProps {
  backgroundImage: HTMLImageElement | null;
  setBackgroundImage: (image: HTMLImageElement | null) => void;
  textLayers: TextLayer[];
  setTextLayers: (layers: TextLayer[]) => void;
  selectedLayer: TextLayer | null;
  setSelectedLayer: (layer: TextLayer | null) => void;
  selectedLayers: TextLayer[];
  setSelectedLayers: (layers: TextLayer[]) => void;
  addTextLayer: () => void;
  uploadImage: (file: File) => void;
  updateTextLayer: (layerId: string, updates: Partial<TextLayer>) => void;
  nudgeLayer: (direction: 'up' | 'down' | 'left' | 'right', amount?: number) => void;
  snapLayerToCenter: (layerId: string, axis: 'horizontal' | 'vertical' | 'both') => void;
  snapToCenter: boolean;
  duplicateLayer: (layerId: string) => void;
  uploadFont: (file: File) => void;
}

export function ImageEditor({
  backgroundImage,
  setBackgroundImage,
  textLayers,
  setTextLayers,
  selectedLayer,
  setSelectedLayer,
  selectedLayers,
  setSelectedLayers,
  addTextLayer,
  uploadImage,
  updateTextLayer,
  nudgeLayer,
  snapLayerToCenter,
  snapToCenter,
  duplicateLayer,
  uploadFont
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialLayerState, setInitialLayerState] = useState<Partial<TextLayer>>({});
  const [multiSelectStart, setMultiSelectStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [showSpacingHints, setShowSpacingHints] = useState(false);

  useEffect(() => {
    drawCanvas();
  }, [backgroundImage, textLayers, selectionBox]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLayer && selectedLayers.length === 0) return;

      const amount = e.shiftKey ? 10 : 1;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          nudgeLayer('up', amount);
          break;
        case 'ArrowDown':
          e.preventDefault();
          nudgeLayer('down', amount);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          nudgeLayer('left', amount);
          break;
        case 'ArrowRight':
          e.preventDefault();
          nudgeLayer('right', amount);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          // Delete layer functionality would go here
          break;
        case 'd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (selectedLayer) {
              duplicateLayer(selectedLayer.id);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayer, selectedLayers, nudgeLayer, duplicateLayer]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    if (backgroundImage) {
      canvas.width = backgroundImage.width;
      canvas.height = backgroundImage.height;
      ctx.drawImage(backgroundImage, 0, 0);
    } else {
      canvas.width = 800;
      canvas.height = 600;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw snap guides if enabled
    if (snapToCenter && (selectedLayer || selectedLayers.length > 0)) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // Vertical center line
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      
      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      
      ctx.restore();
    }

    // Draw spacing hints for multi-select
    if (selectedLayers.length > 1) {
      drawSpacingHints(ctx);
    }

    // Draw spacing hints if enabled
    if (showSpacingHints && selectedLayers.length > 1) {
      drawAdvancedSpacingHints(ctx);
    }

    // Draw text layers
    textLayers.forEach(layer => {
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      
      // Apply text shadow if enabled
      if (layer.textShadow && layer.textShadow.enabled) {
        ctx.shadowColor = layer.textShadow.color;
        ctx.shadowBlur = layer.textShadow.blur;
        ctx.shadowOffsetX = layer.textShadow.offsetX;
        ctx.shadowOffsetY = layer.textShadow.offsetY;
      }
      
      ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = layer.textAlign;
      
      // Apply letter spacing
      if (layer.letterSpacing !== 0) {
        ctx.letterSpacing = `${layer.letterSpacing}px`;
      }
      
      // Handle curved text
      if (layer.curved) {
        drawCurvedText(ctx, layer);
      } else {
        drawStraightText(ctx, layer);
      }

      // Draw selection outline and handles
      if ((layer.selected || selectedLayers.includes(layer)) && !layer.locked) {
        drawSelectionHandles(ctx, layer);
      }

      // Draw lock indicator
      if (layer.locked) {
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.font = '12px Arial';
        ctx.fillText('🔒', layer.x + 10, layer.y - 10);
      }

      ctx.restore();
    });

    // Draw multi-select box
    if (selectionBox) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      ctx.restore();
    }
  };

  const drawCurvedText = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
    const radius = layer.curveRadius || 100;
    const text = layer.text;
    const centerX = layer.x;
    const centerY = layer.y;
    
    // Calculate angle per character
    const totalAngle = (text.length - 1) * 0.2; // Adjust spacing
    const startAngle = -totalAngle / 2;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const angle = startAngle + (i * 0.2);
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  };

  const drawStraightText = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
    // Apply rotation
    if (layer.rotation !== 0) {
      ctx.translate(layer.x, layer.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-layer.x, -layer.y);
    }
    
    const lines = layer.text.split('\n');
    const lineHeight = layer.fontSize * layer.lineHeight;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, layer.x, layer.y + (index * lineHeight));
    });
  };

  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
    ctx.restore();
    ctx.save();
    
    const isMultiSelected = selectedLayers.includes(layer);
    ctx.strokeStyle = isMultiSelected ? '#ef4444' : '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Calculate bounding box
    ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
    let maxWidth = 0;
    const lines = layer.text.split('\n');
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    });
    
    const textHeight = layer.fontSize * lines.length * layer.lineHeight;
    
    let boundingX = layer.x - 10;
    if (layer.textAlign === 'center') {
      boundingX = layer.x - maxWidth / 2 - 10;
    } else if (layer.textAlign === 'right') {
      boundingX = layer.x - maxWidth - 10;
    }
    
    const boundingY = layer.y - layer.fontSize - 10;
    const boundingWidth = maxWidth + 20;
    const boundingHeight = textHeight + 20;
    
    // Selection rectangle
    ctx.strokeRect(boundingX, boundingY, boundingWidth, boundingHeight);
    
    // Resize handles (only for single selection or primary in multi-select)
    if (!isMultiSelected || selectedLayers[0].id === layer.id) {
      ctx.fillStyle = '#3b82f6';
      ctx.setLineDash([]);
      const handleSize = 8;
      
      // Corner handles
      ctx.fillRect(boundingX - handleSize/2, boundingY - handleSize/2, handleSize, handleSize);
      ctx.fillRect(boundingX + boundingWidth - handleSize/2, boundingY - handleSize/2, handleSize, handleSize);
      ctx.fillRect(boundingX - handleSize/2, boundingY + boundingHeight - handleSize/2, handleSize, handleSize);
      ctx.fillRect(boundingX + boundingWidth - handleSize/2, boundingY + boundingHeight - handleSize/2, handleSize, handleSize);
      
      // Side handles
      ctx.fillRect(boundingX + boundingWidth/2 - handleSize/2, boundingY - handleSize/2, handleSize, handleSize);
      ctx.fillRect(boundingX + boundingWidth/2 - handleSize/2, boundingY + boundingHeight - handleSize/2, handleSize, handleSize);
      ctx.fillRect(boundingX - handleSize/2, boundingY + boundingHeight/2 - handleSize/2, handleSize, handleSize);
      ctx.fillRect(boundingX + boundingWidth - handleSize/2, boundingY + boundingHeight/2 - handleSize/2, handleSize, handleSize);
      // Rotation handle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(boundingX + boundingWidth/2, boundingY - 20, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const drawSpacingHints = (ctx: CanvasRenderingContext2D) => {
    if (selectedLayers.length < 2) return;

    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Sort layers by position for spacing hints
    const sortedLayers = [...selectedLayers].sort((a, b) => a.x - b.x);
    
    for (let i = 0; i < sortedLayers.length - 1; i++) {
      const layer1 = sortedLayers[i];
      const layer2 = sortedLayers[i + 1];
      
      const midX = (layer1.x + layer2.x) / 2;
      const midY = Math.min(layer1.y, layer2.y) - 20;
      
      // Draw spacing line
      ctx.beginPath();
      ctx.moveTo(layer1.x, midY);
      ctx.lineTo(layer2.x, midY);
      ctx.stroke();
      
      // Draw distance text
      const distance = Math.abs(layer2.x - layer1.x);
      ctx.fillStyle = '#10b981';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(distance)}px`, midX, midY - 5);
    }

    ctx.restore();
  };

  const drawAdvancedSpacingHints = (ctx: CanvasRenderingContext2D) => {
    if (selectedLayers.length < 2) return;

    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.fillStyle = '#10b981';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    // Horizontal spacing
    const sortedByX = [...selectedLayers].sort((a, b) => a.x - b.x);
    for (let i = 0; i < sortedByX.length - 1; i++) {
      const layer1 = sortedByX[i];
      const layer2 = sortedByX[i + 1];
      
      const midX = (layer1.x + layer2.x) / 2;
      const midY = Math.min(layer1.y, layer2.y) - 30;
      
      // Draw spacing line
      ctx.beginPath();
      ctx.moveTo(layer1.x, midY);
      ctx.lineTo(layer2.x, midY);
      ctx.stroke();
      
      // Draw arrows
      ctx.beginPath();
      ctx.moveTo(layer1.x, midY - 3);
      ctx.lineTo(layer1.x + 5, midY);
      ctx.lineTo(layer1.x, midY + 3);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(layer2.x, midY - 3);
      ctx.lineTo(layer2.x - 5, midY);
      ctx.lineTo(layer2.x, midY + 3);
      ctx.stroke();
      
      // Draw distance text
      const distance = Math.abs(layer2.x - layer1.x);
      ctx.fillText(`${Math.round(distance)}px`, midX, midY - 8);
    }

    // Vertical spacing
    const sortedByY = [...selectedLayers].sort((a, b) => a.y - b.y);
    for (let i = 0; i < sortedByY.length - 1; i++) {
      const layer1 = sortedByY[i];
      const layer2 = sortedByY[i + 1];
      
      const midX = Math.max(layer1.x, layer2.x) + 30;
      const midY = (layer1.y + layer2.y) / 2;
      
      // Draw spacing line
      ctx.beginPath();
      ctx.moveTo(midX, layer1.y);
      ctx.lineTo(midX, layer2.y);
      ctx.stroke();
      
      // Draw arrows
      ctx.beginPath();
      ctx.moveTo(midX - 3, layer1.y);
      ctx.lineTo(midX, layer1.y + 5);
      ctx.lineTo(midX + 3, layer1.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(midX - 3, layer2.y);
      ctx.lineTo(midX, layer2.y - 5);
      ctx.lineTo(midX + 3, layer2.y);
      ctx.stroke();
      
      // Draw distance text
      const distance = Math.abs(layer2.y - layer1.y);
      ctx.save();
      ctx.translate(midX + 8, midY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${Math.round(distance)}px`, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getLayerAtPosition = (x: number, y: number): TextLayer | null => {
    for (let i = textLayers.length - 1; i >= 0; i--) {
      const layer = textLayers[i];
      const canvas = canvasRef.current;
      if (!canvas) continue;

      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
      const lines = layer.text.split('\n');
      let maxWidth = 0;
      lines.forEach(line => {
        const metrics = ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      });
      
      const textHeight = layer.fontSize * lines.length * layer.lineHeight;
      
      let boundingX = layer.x - 10;
      if (layer.textAlign === 'center') {
        boundingX = layer.x - maxWidth / 2 - 10;
      } else if (layer.textAlign === 'right') {
        boundingX = layer.x - maxWidth - 10;
      }
      
      const boundingY = layer.y - layer.fontSize - 10;
      const boundingWidth = maxWidth + 20;
      const boundingHeight = textHeight + 20;

      if (x >= boundingX && x <= boundingX + boundingWidth &&
          y >= boundingY && y <= boundingY + boundingHeight) {
        return layer;
      }
    }
    return null;
  };

  const getHandleAtPosition = (x: number, y: number, layer: TextLayer): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
    const lines = layer.text.split('\n');
    let maxWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    });
    
    const textHeight = layer.fontSize * lines.length * layer.lineHeight;
    
    let boundingX = layer.x - 10;
    if (layer.textAlign === 'center') {
      boundingX = layer.x - maxWidth / 2 - 10;
    } else if (layer.textAlign === 'right') {
      boundingX = layer.x - maxWidth - 10;
    }
    
    const boundingY = layer.y - layer.fontSize - 10;
    const boundingWidth = maxWidth + 20;
    const boundingHeight = textHeight + 20;
    
    const handleSize = 8;
    const tolerance = 5;
    
    // Check rotation handle
    const rotateX = boundingX + boundingWidth/2;
    const rotateY = boundingY - 20;
    if (Math.abs(x - rotateX) <= 6 + tolerance && Math.abs(y - rotateY) <= 6 + tolerance) {
      return 'rotate';
    }
    
    // Check corner handles
    if (Math.abs(x - boundingX) <= handleSize/2 + tolerance && Math.abs(y - boundingY) <= handleSize/2 + tolerance) {
      return 'nw-resize';
    }
    if (Math.abs(x - (boundingX + boundingWidth)) <= handleSize/2 + tolerance && Math.abs(y - boundingY) <= handleSize/2 + tolerance) {
      return 'ne-resize';
    }
    if (Math.abs(x - boundingX) <= handleSize/2 + tolerance && Math.abs(y - (boundingY + boundingHeight)) <= handleSize/2 + tolerance) {
      return 'sw-resize';
    }
    if (Math.abs(x - (boundingX + boundingWidth)) <= handleSize/2 + tolerance && Math.abs(y - (boundingY + boundingHeight)) <= handleSize/2 + tolerance) {
      return 'se-resize';
    }
    
    // Check side handles
    if (Math.abs(x - (boundingX + boundingWidth/2)) <= handleSize/2 + tolerance && Math.abs(y - boundingY) <= handleSize/2 + tolerance) {
      return 'n-resize';
    }
    if (Math.abs(x - (boundingX + boundingWidth/2)) <= handleSize/2 + tolerance && Math.abs(y - (boundingY + boundingHeight)) <= handleSize/2 + tolerance) {
      return 's-resize';
    }
    if (Math.abs(x - boundingX) <= handleSize/2 + tolerance && Math.abs(y - (boundingY + boundingHeight/2)) <= handleSize/2 + tolerance) {
      return 'w-resize';
    }
    if (Math.abs(x - (boundingX + boundingWidth)) <= handleSize/2 + tolerance && Math.abs(y - (boundingY + boundingHeight/2)) <= handleSize/2 + tolerance) {
      return 'e-resize';
    }
    
    return '';
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const clickedLayer = getLayerAtPosition(pos.x, pos.y);

    // Multi-select with Ctrl/Cmd
    if (e.ctrlKey || e.metaKey) {
      if (clickedLayer) {
        if (selectedLayers.includes(clickedLayer)) {
          setSelectedLayers(selectedLayers.filter(l => l.id !== clickedLayer.id));
          setSelectedLayer(null);
        } else {
          setSelectedLayers([...selectedLayers, clickedLayer]);
          setSelectedLayer(clickedLayer);
        }
        setShowSpacingHints(true);
      } else {
        // Start multi-select box
        setMultiSelectStart(pos);
      }
      return;
    }

    setShowSpacingHints(false);
    if (clickedLayer && clickedLayer.selected && !clickedLayer.locked) {
      const handle = getHandleAtPosition(pos.x, pos.y, clickedLayer);
      
      if (handle === 'rotate') {
        setIsRotating(true);
        setInitialMousePos(pos);
        setInitialLayerState({ rotation: clickedLayer.rotation });
      } else if (handle.includes('resize')) {
        console.log('Starting resize with handle:', handle);
        setIsResizing(true);
        setResizeHandle(handle);
        setInitialMousePos(pos);
        setInitialLayerState({ 
          fontSize: clickedLayer.fontSize,
          width: clickedLayer.width,
          height: clickedLayer.height
        });
      } else {
        setIsDragging(true);
        setDragOffset({
          x: pos.x - clickedLayer.x,
          y: pos.y - clickedLayer.y
        });
      }
    } else if (clickedLayer && !clickedLayer.locked) {
      setSelectedLayer(clickedLayer);
      setSelectedLayers([]);
      setIsDragging(true);
      setDragOffset({
        x: pos.x - clickedLayer.x,
        y: pos.y - clickedLayer.y
      });
    } else {
      setSelectedLayer(null);
      setSelectedLayers([]);
      setShowSpacingHints(false);
      setMultiSelectStart(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    // Multi-select box
    if (multiSelectStart && !isDragging && !isResizing && !isRotating) {
      const box = {
        x: Math.min(multiSelectStart.x, pos.x),
        y: Math.min(multiSelectStart.y, pos.y),
        width: Math.abs(pos.x - multiSelectStart.x),
        height: Math.abs(pos.y - multiSelectStart.y)
      };
      setSelectionBox(box);
      return;
    }
    
    if (isRotating && selectedLayer) {
      const centerX = selectedLayer.x;
      const centerY = selectedLayer.y;
      const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI);
      updateTextLayer(selectedLayer.id, { rotation: angle });
    } else if (isResizing && selectedLayer) {
      console.log('Resizing with handle:', resizeHandle);
      const deltaX = pos.x - initialMousePos.x;
      const deltaY = pos.y - initialMousePos.y;
      
      let scaleFactor = 1;
      
      if (resizeHandle.includes('e')) {
        scaleFactor = Math.max(0.1, 1 + deltaX / 200);
      } else if (resizeHandle.includes('w')) {
        scaleFactor = Math.max(0.1, 1 - deltaX / 200);
      } else if (resizeHandle.includes('s')) {
        scaleFactor = Math.max(0.1, 1 + deltaY / 200);
      } else if (resizeHandle.includes('n')) {
        scaleFactor = Math.max(0.1, 1 - deltaY / 200);
      } else {
        // Corner resize - use diagonal
        const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const sign = (resizeHandle.includes('se') || resizeHandle.includes('nw')) ? 
          ((deltaX > 0 && deltaY > 0) || (deltaX < 0 && deltaY < 0) ? 1 : -1) :
          ((deltaX > 0 && deltaY < 0) || (deltaX < 0 && deltaY > 0) ? 1 : -1);
        scaleFactor = Math.max(0.1, 1 + (diagonal * sign) / 200);
      }
      
      updateTextLayer(selectedLayer.id, {
        fontSize: Math.max(8, Math.min(200, (initialLayerState.fontSize || 24) * scaleFactor))
      });
    } else if (isDragging) {
      const layersToMove = selectedLayers.length > 0 ? selectedLayers : (selectedLayer ? [selectedLayer] : []);
      
      layersToMove.forEach(layer => {
        if (layer.locked) return;
        
        let newX = pos.x - dragOffset.x;
        let newY = pos.y - dragOffset.y;
        
        // Snap to center if enabled
        if (snapToCenter && backgroundImage) {
          const snapThreshold = 10;
          const centerX = backgroundImage.width / 2;
          const centerY = backgroundImage.height / 2;
          
          if (Math.abs(newX - centerX) < snapThreshold) {
            newX = centerX;
          }
          if (Math.abs(newY - centerY) < snapThreshold) {
            newY = centerY;
          }
        }
        
        updateTextLayer(layer.id, { x: newX, y: newY });
      });
    }
    
    // Update cursor based on what's under the mouse
    if (selectedLayer && !selectedLayer.locked) {
      const handle = getHandleAtPosition(pos.x, pos.y, selectedLayer);
      const canvas = canvasRef.current;
      if (canvas) {
        if (handle === 'rotate') {
          canvas.style.cursor = 'grab';
        } else if (handle.includes('resize')) {
          canvas.style.cursor = handle;
        } else if (getLayerAtPosition(pos.x, pos.y)) {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'default';
        }
      }
    }
  };

  const handleMouseUp = () => {
    // Handle multi-select box completion
    if (multiSelectStart && selectionBox) {
      const selectedInBox = textLayers.filter(layer => {
        return layer.x >= selectionBox.x && 
               layer.x <= selectionBox.x + selectionBox.width &&
               layer.y >= selectionBox.y && 
               layer.y <= selectionBox.y + selectionBox.height;
      });
      setSelectedLayers(selectedInBox);
      setSelectedLayer(null);
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setResizeHandle('');
    setMultiSelectStart(null);
    setSelectionBox(null);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const clickedLayer = getLayerAtPosition(pos.x, pos.y);
    
    if (clickedLayer && snapToCenter) {
      snapLayerToCenter(clickedLayer.id, 'both');
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !files[0]) return;
    
    const file = files[0];
    if (file.type.includes('font') || file.name.endsWith('.ttf') || file.name.endsWith('.otf') || file.name.endsWith('.woff') || file.name.endsWith('.woff2')) {
      uploadFont(file);
    } else if (file.type.includes('png')) {
      uploadImage(file);
    } else {
      alert('Please upload a PNG image or font file (TTF/OTF/WOFF)');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {!backgroundImage ? (
        <Card 
          className={cn(
            "w-[800px] h-[600px] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center transition-colors cursor-pointer hover:border-gray-400 hover:bg-gray-50",
            dragOver && "border-blue-500 bg-blue-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload PNG Image or Font</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Drag and drop your PNG image or font file (TTF/OTF/WOFF) here, or click to browse. 
            The canvas will automatically match your image's dimensions.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,image/png,.ttf,.otf,.woff,.woff2,font/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </Card>
      ) : (
        <div className="relative">
          <canvas 
            ref={canvasRef} 
            className="border border-gray-300 rounded-lg shadow-lg cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            tabIndex={0}
          />
          
          <div className="absolute -bottom-20 left-0 right-0 flex justify-center space-x-2">
            <Button 
              onClick={addTextLayer}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Text</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => fontInputRef.current?.click()}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Font</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowSpacingHints(!showSpacingHints)}
              className={cn("flex items-center space-x-2", showSpacingHints && "bg-green-100")}
            >
              <span>Spacing Hints</span>
            </Button>
            
            {selectedLayer && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => snapLayerToCenter(selectedLayer.id, 'both')}
                  className="flex items-center space-x-2"
                >
                  <Move className="w-4 h-4" />
                  <span>Center</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => updateTextLayer(selectedLayer.id, { rotation: 0 })}
                  className="flex items-center space-x-2"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Reset Rotation</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => duplicateLayer(selectedLayer.id)}
                  className="flex items-center space-x-2"
                >
                  <span>Duplicate (Ctrl+D)</span>
                </Button>
              </>
            )}
          </div>
          
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded space-y-1">
            <div>• Arrow keys: nudge selected text (Shift for 10px)</div>
            <div>• Ctrl+Click: multi-select layers</div>
            {selectedLayers.length > 1 && (
              <div className="text-green-300">
                • {selectedLayers.length} layers selected - group transforms active
              </div>
            )}
            <div>• Drag handles: resize • Red handle: rotate</div>
            <div>• Double-click: center layer</div>
            <div>• Ctrl+D: duplicate layer</div>
          </div>
          
          <input
            ref={fontInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}