"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

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
  curved?: boolean;
  curveRadius?: number;
  stroke?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  gradient?: {
    enabled: boolean;
    type: 'linear' | 'radial';
    colors: string[];
    angle: number;
  };
  animation?: {
    enabled: boolean;
    type: 'fade' | 'slide' | 'bounce' | 'pulse';
    duration: number;
  };
}

interface EditorState {
  backgroundImage: string | null;
  textLayers: TextLayer[];
  timestamp: number;
}

export function useImageEditor() {
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<TextLayer | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<TextLayer[]>([]);
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [snapToCenter, setSnapToCenter] = useState(true);
  const [uploadedFonts, setUploadedFonts] = useState<string[]>([]);
  const historyRef = useRef<EditorState[]>([]);
  const historyIndexRef = useRef(-1);
  const skipHistory = useRef(false);
  const lastSaveRef = useRef<string>('');

  // Auto-save to localStorage
  useEffect(() => {
    if (skipHistory.current) return;

    const saveState = () => {
      const state = {
        backgroundImage: backgroundImage ? backgroundImage.src : null,
        textLayers,
        timestamp: Date.now()
      };

      const stateString = JSON.stringify(state);
      if (stateString !== lastSaveRef.current) {
        localStorage.setItem('imageEditor_state', stateString);
        lastSaveRef.current = stateString;
      }
    };

    const debounce = setTimeout(saveState, 500);
    return () => clearTimeout(debounce);
  }, [backgroundImage, textLayers]);

  // Load from localStorage on mount
  useEffect(() => {
    const loadState = () => {
      try {
        const saved = localStorage.getItem('imageEditor_state');
        if (!saved) return;

        const state = JSON.parse(saved);
        if (state.backgroundImage) {
          const img = new Image();
          img.onload = () => {
            skipHistory.current = true;
            setBackgroundImage(img);
            // Ensure all loaded layers have proper textShadow structure
            const layersWithDefaults = (state.textLayers || []).map((layer: any) => ({
              ...layer,
              textShadow: layer.textShadow || {
                enabled: false,
                color: '#000000',
                blur: 4,
                offsetX: 2,
                offsetY: 2
              },
              stroke: layer.stroke || {
                enabled: false,
                color: '#000000',
                width: 2
              },
              gradient: layer.gradient || {
                enabled: false,
                type: 'linear',
                colors: ['#000000', '#ffffff'],
                angle: 0
              },
              animation: layer.animation || {
                enabled: false,
                type: 'fade',
                duration: 1000
              }
            }));
            setTextLayers(layersWithDefaults);
            // Initialize history with loaded state
            const initialState = {
              backgroundImage: state.backgroundImage,
              textLayers: layersWithDefaults,
              timestamp: Date.now()
            };
            historyRef.current = [initialState];
            historyIndexRef.current = 0;
            setHistory([initialState]);
            setHistoryIndex(0);
            skipHistory.current = false;
            toast.success('Previous work restored from autosave!');
          };
          img.src = state.backgroundImage;
        } else if (state.textLayers && state.textLayers.length > 0) {
          skipHistory.current = true;
          // Ensure all loaded layers have proper textShadow structure
          const layersWithDefaults = state.textLayers.map((layer: any) => ({
            ...layer,
            textShadow: layer.textShadow || {
              enabled: false,
              color: '#000000',
              blur: 4,
              offsetX: 2,
              offsetY: 2
            },
            stroke: layer.stroke || {
              enabled: false,
              color: '#000000',
              width: 2
            },
            gradient: layer.gradient || {
              enabled: false,
              type: 'linear',
              colors: ['#000000', '#ffffff'],
              angle: 0
            },
            animation: layer.animation || {
              enabled: false,
              type: 'fade',
              duration: 1000
            }
          }));
          setTextLayers(layersWithDefaults);
          const initialState = {
            backgroundImage: null,
            textLayers: layersWithDefaults,
            timestamp: Date.now()
          };
          historyRef.current = [initialState];
          historyIndexRef.current = 0;
          setHistory([initialState]);
          setHistoryIndex(0);
          skipHistory.current = false;
          toast.success('Previous work restored from autosave!');
        }
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    };

    loadState();
  }, []);

  // Save to history
  const saveToHistory = useCallback(() => {
    if (skipHistory.current) return;

    const state: EditorState = {
      backgroundImage: backgroundImage ? backgroundImage.src : null,
      textLayers: [...textLayers],
      timestamp: Date.now()
    };

    const newHistory = [...historyRef.current.slice(0, historyIndexRef.current + 1), state];
    
    // Keep only last 25 states
    if (newHistory.length > 25) {
      newHistory.shift();
    } else {
      historyIndexRef.current++;
    }

    historyRef.current = newHistory;
    setHistory(newHistory);
    setHistoryIndex(historyIndexRef.current);
  }, [backgroundImage, textLayers]);

  // Update selected layer when textLayers change
  useEffect(() => {
    if (selectedLayer) {
      const updatedLayer = textLayers.find(layer => layer.id === selectedLayer.id);
      if (updatedLayer) {
        setSelectedLayer(updatedLayer);
      }
    }
  }, [textLayers, selectedLayer]);

  const uploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      const img = new Image();
      
      img.onload = () => {
        setBackgroundImage(img);
        toast.success('Image uploaded successfully!');
        setTimeout(() => saveToHistory(), 100);
      };
      
      img.src = imgUrl;
    };

    reader.readAsDataURL(file);
  }, [saveToHistory]);

  const addTextLayer = useCallback(() => {
    const canvasWidth = backgroundImage?.width || 800;
    const canvasHeight = backgroundImage?.height || 600;
    
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      text: 'Click to edit text\nAdd multiple lines here',
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      fontSize: 24,
      fontFamily: 'Arial',
      fontWeight: '400',
      color: '#000000',
      opacity: 1,
      textAlign: 'center',
      rotation: 0,
      width: 200,
      height: 60,
      selected: false,
      locked: false,
      lineHeight: 1.2,
      letterSpacing: 0,
      textShadow: {
        enabled: false,
        color: '#000000',
        blur: 4,
        offsetX: 2,
        offsetY: 2
      },
      curved: false,
      curveRadius: 100,
      stroke: {
        enabled: false,
        color: '#000000',
        width: 2
      },
      gradient: {
        enabled: false,
        type: 'linear',
        colors: ['#000000', '#ffffff'],
        angle: 0
      },
      animation: {
        enabled: false,
        type: 'fade',
        duration: 1000
      }
    };

    setTextLayers(prev => [...prev, newLayer]);
    setSelectedLayer(newLayer);
    toast.success('Text layer added!');
    setTimeout(() => saveToHistory(), 100);
  }, [backgroundImage, saveToHistory]);

  const updateTextLayer = useCallback((layerId: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      )
    );
    setTimeout(() => saveToHistory(), 100);
  }, [saveToHistory]);

  const deleteTextLayer = useCallback((layerId: string) => {
    setTextLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (selectedLayer?.id === layerId) {
      setSelectedLayer(null);
    }
    toast.success('Layer deleted!');
    setTimeout(() => saveToHistory(), 100);
  }, [selectedLayer, saveToHistory]);

  const duplicateLayer = useCallback((layerId: string) => {
    const layerToDuplicate = textLayers.find(layer => layer.id === layerId);
    if (!layerToDuplicate) return;

    const newLayer: TextLayer = {
      ...layerToDuplicate,
      id: `text-${Date.now()}`,
      x: layerToDuplicate.x + 20,
      y: layerToDuplicate.y + 20,
      selected: false
    };

    setTextLayers(prev => [...prev, newLayer]);
    setSelectedLayer(newLayer);
    toast.success('Layer duplicated!');
    setTimeout(() => saveToHistory(), 100);
  }, [textLayers, saveToHistory]);

  const toggleLayerLock = useCallback((layerId: string) => {
    setTextLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      )
    );
    toast.success('Layer lock toggled!');
    setTimeout(() => saveToHistory(), 100);
  }, [saveToHistory]);

  const uploadFont = useCallback((file: File) => {
    const fontName = file.name.replace(/\.[^/.]+$/, "");
    const url = URL.createObjectURL(file);
    
    const fontFace = new FontFace(fontName, `url(${url})`);
    
    fontFace.load().then(() => {
      document.fonts.add(fontFace);
      setUploadedFonts(prev => [...prev, fontName]);
      toast.success(`Font "${fontName}" uploaded successfully!`);
    }).catch(() => {
      toast.error('Failed to load font file');
    });
  }, []);

  const moveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setTextLayers(prev => {
      const index = prev.findIndex(layer => layer.id === layerId);
      if (index === -1) return prev;

      const newLayers = [...prev];
      if (direction === 'up' && index < newLayers.length - 1) {
        [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      } else if (direction === 'down' && index > 0) {
        [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      }

      return newLayers;
    });
    
    toast.success(`Layer moved ${direction}!`);
    setTimeout(() => saveToHistory(), 100);
  }, [saveToHistory]);

  const nudgeLayer = useCallback((direction: 'up' | 'down' | 'left' | 'right', amount: number = 1) => {
    const layersToNudge = selectedLayers.length > 0 ? selectedLayers : (selectedLayer ? [selectedLayer] : []);
    if (layersToNudge.length === 0) return;

    layersToNudge.forEach(layer => {
      if (layer.locked) return;
      
      const updates: Partial<TextLayer> = {};
      switch (direction) {
        case 'up':
          updates.y = layer.y - amount;
          break;
        case 'down':
          updates.y = layer.y + amount;
          break;
        case 'left':
          updates.x = layer.x - amount;
          break;
        case 'right':
          updates.x = layer.x + amount;
          break;
      }

      updateTextLayer(layer.id, updates);
    });
  }, [selectedLayer, selectedLayers, updateTextLayer]);

  const snapLayerToCenter = useCallback((layerId: string, axis: 'horizontal' | 'vertical' | 'both') => {
    if (!backgroundImage) return;

    const canvasWidth = backgroundImage.width;
    const canvasHeight = backgroundImage.height;
    const updates: Partial<TextLayer> = {};

    if (axis === 'horizontal' || axis === 'both') {
      updates.x = canvasWidth / 2;
    }
    if (axis === 'vertical' || axis === 'both') {
      updates.y = canvasHeight / 2;
    }

    updateTextLayer(layerId, updates);
    toast.success(`Snapped to ${axis} center!`);
  }, [backgroundImage, updateTextLayer]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;

    historyIndexRef.current--;
    setHistoryIndex(historyIndexRef.current);

    const state = historyRef.current[historyIndexRef.current];
    if (state) {
      skipHistory.current = true;
      
      if (state.backgroundImage) {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
          setTextLayers(state.textLayers);
          setSelectedLayer(null);
          skipHistory.current = false;
        };
        img.src = state.backgroundImage;
      } else {
        setBackgroundImage(null);
        setTextLayers(state.textLayers);
        setSelectedLayer(null);
        skipHistory.current = false;
      }
      
      toast.success('Undone!');
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    historyIndexRef.current++;
    setHistoryIndex(historyIndexRef.current);

    const state = historyRef.current[historyIndexRef.current];
    if (state) {
      skipHistory.current = true;
      
      if (state.backgroundImage) {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
          setTextLayers(state.textLayers);
          setSelectedLayer(null);
          skipHistory.current = false;
        };
        img.src = state.backgroundImage;
      } else {
        setBackgroundImage(null);
        setTextLayers(state.textLayers);
        setSelectedLayer(null);
        skipHistory.current = false;
      }
      
      toast.success('Redone!');
    }
  }, []);

  // Helper functions for letter spacing in export
  const drawTextWithLetterSpacing = (
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    letterSpacing: number,
    textAlign: 'left' | 'center' | 'right'
  ) => {
    if (letterSpacing === 0) {
      ctx.fillText(text, x, y);
      return;
    }

    const chars = text.split('');
    let currentX = x;
    
    // Calculate total width for alignment
    if (textAlign === 'center' || textAlign === 'right') {
      const totalWidth = chars.reduce((width, char, index) => {
        const charWidth = ctx.measureText(char).width;
        return width + charWidth + (index < chars.length - 1 ? letterSpacing : 0);
      }, 0);
      
      if (textAlign === 'center') {
        currentX = x - totalWidth / 2;
      } else if (textAlign === 'right') {
        currentX = x - totalWidth;
      }
    }
    
    chars.forEach((char, index) => {
      ctx.fillText(char, currentX, y);
      const charWidth = ctx.measureText(char).width;
      currentX += charWidth + letterSpacing;
    });
  };

  const drawStrokeWithLetterSpacing = (
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    letterSpacing: number,
    textAlign: 'left' | 'center' | 'right'
  ) => {
    if (letterSpacing === 0) {
      ctx.strokeText(text, x, y);
      return;
    }

    const chars = text.split('');
    let currentX = x;
    
    // Calculate total width for alignment
    if (textAlign === 'center' || textAlign === 'right') {
      const totalWidth = chars.reduce((width, char, index) => {
        const charWidth = ctx.measureText(char).width;
        return width + charWidth + (index < chars.length - 1 ? letterSpacing : 0);
      }, 0);
      
      if (textAlign === 'center') {
        currentX = x - totalWidth / 2;
      } else if (textAlign === 'right') {
        currentX = x - totalWidth;
      }
    }
    
    chars.forEach((char, index) => {
      ctx.strokeText(char, currentX, y);
      const charWidth = ctx.measureText(char).width;
      currentX += charWidth + letterSpacing;
    });
  };

  const exportImage = useCallback(() => {
    if (!backgroundImage) {
      toast.error('No image to export');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = backgroundImage.width;
      canvas.height = backgroundImage.height;

      // Draw background
      ctx.drawImage(backgroundImage, 0, 0);

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
        
        // Apply gradient if enabled
        if (layer.gradient && layer.gradient.enabled) {
          const gradient = layer.gradient.type === 'linear' 
            ? (() => {
                const angle = (layer.gradient.angle * Math.PI) / 180;
                const distance = layer.fontSize * 2;
                const x1 = layer.x - Math.cos(angle) * distance;
                const y1 = layer.y - Math.sin(angle) * distance;
                const x2 = layer.x + Math.cos(angle) * distance;
                const y2 = layer.y + Math.sin(angle) * distance;
                return ctx.createLinearGradient(x1, y1, x2, y2);
              })()
            : ctx.createRadialGradient(layer.x, layer.y, 0, layer.x, layer.y, layer.fontSize);
          
          layer.gradient.colors.forEach((color, index) => {
            gradient.addColorStop(index / (layer.gradient!.colors.length - 1), color);
          });
          
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = layer.color;
        }
        
        ctx.textAlign = layer.textAlign;
        
        // Apply rotation
        if (layer.rotation !== 0) {
          ctx.translate(layer.x, layer.y);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.translate(-layer.x, -layer.y);
        }
        
        const lines = layer.text.split('\n');
        const lineHeight = layer.fontSize * 1.2;
        
        lines.forEach((line, index) => {
          const yPos = layer.y + (index * lineHeight);
          
          // Apply stroke if enabled
          if (layer.stroke && layer.stroke.enabled) {
            ctx.strokeStyle = layer.stroke.color;
            ctx.lineWidth = layer.stroke.width;
            ctx.strokeText(line, layer.x, yPos);
          }
          
          // Draw fill text
          ctx.fillText(line, layer.x, yPos);
        });

        ctx.restore();
      });

      const dataURL = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `image-editor-${Date.now()}.png`;
      link.href = dataURL;
      link.click();

      toast.success('Image exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export image');
    }
  }, [backgroundImage, textLayers]);

  const resetEditor = useCallback(() => {
    const confirmed = confirm('Are you sure you want to reset? This will clear all your work.');
    if (!confirmed) return;

    setBackgroundImage(null);
    setTextLayers([]);
    setSelectedLayer(null);
    setHistory([]);
    setHistoryIndex(-1);
    historyRef.current = [];
    historyIndexRef.current = -1;

    localStorage.removeItem('imageEditor_state');
    lastSaveRef.current = '';
    toast.success('Editor reset successfully!');
  }, []);

  return {
    backgroundImage,
    setBackgroundImage,
    textLayers,
    setTextLayers,
    selectedLayer,
    setSelectedLayer,
    selectedLayers,
    setSelectedLayers,
    uploadImage,
    addTextLayer,
    updateTextLayer,
    deleteTextLayer,
    duplicateLayer,
    toggleLayerLock,
    moveLayer,
    nudgeLayer,
    snapLayerToCenter,
    snapToCenter,
    setSnapToCenter,
    uploadFont,
    uploadedFonts,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    exportImage,
    resetEditor
  };
}