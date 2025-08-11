"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  ChevronLeft, 
  ChevronRight, 
  Type, 
  Layers,
  MoveUp,
  MoveDown,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  RotateCw,
  Settings
} from 'lucide-react';
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
  curved?: boolean;
  curveRadius?: number;
  textShadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
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

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  textLayers: TextLayer[];
  selectedLayer: TextLayer | null;
  setSelectedLayer: (layer: TextLayer | null) => void;
  selectedLayers: TextLayer[];
  setSelectedLayers: (layers: TextLayer[]) => void;
  updateTextLayer: (layerId: string, updates: Partial<TextLayer>) => void;
  deleteTextLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  snapLayerToCenter: (layerId: string, axis: 'horizontal' | 'vertical' | 'both') => void;
  snapToCenter: boolean;
  setSnapToCenter: (enabled: boolean) => void;
  uploadedFonts: string[];
  backgroundImage?: HTMLImageElement | null;
}

const GOOGLE_FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Open Sans', 'Roboto', 'Lato', 'Montserrat', 'Source Sans Pro',
  'Oswald', 'Raleway', 'PT Sans', 'Lora', 'Playfair Display',
  'Merriweather', 'Ubuntu', 'Nunito', 'Work Sans', 'Poppins'
];

const FONT_WEIGHTS = [
  { label: 'Thin', value: '100' },
  { label: 'Light', value: '300' },
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' }
];

export function Sidebar({ 
  collapsed, 
  onCollapse, 
  textLayers,
  selectedLayer,
  setSelectedLayer,
  selectedLayers,
  setSelectedLayers,
  updateTextLayer,
  deleteTextLayer,
  duplicateLayer,
  toggleLayerLock,
  moveLayer,
  snapLayerToCenter,
  snapToCenter,
  setSnapToCenter,
  uploadedFonts,
  backgroundImage
}: SidebarProps) {
  const fontSizeInputRef = useRef<HTMLInputElement>(null);
  const [textProperties, setTextProperties] = useState({
    text: '',
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: '400',
    color: '#000000',
    opacity: 1,
    textAlign: 'left' as 'left' | 'center' | 'right',
    rotation: 0,
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
      type: 'linear' as 'linear' | 'radial',
      colors: ['#000000', '#ffffff'],
      angle: 0
    },
    animation: {
      enabled: false,
      type: 'fade' as 'fade' | 'slide' | 'bounce' | 'pulse',
      duration: 1000
    }
  });

  useEffect(() => {
    if (selectedLayer) {
      setTextProperties({
        text: selectedLayer.text,
        fontFamily: selectedLayer.fontFamily,
        fontSize: selectedLayer.fontSize,
        fontWeight: selectedLayer.fontWeight,
        color: selectedLayer.color,
        opacity: selectedLayer.opacity,
        textAlign: selectedLayer.textAlign,
        rotation: selectedLayer.rotation,
        lineHeight: selectedLayer.lineHeight,
        letterSpacing: selectedLayer.letterSpacing,
        textShadow: selectedLayer.textShadow,
        curved: selectedLayer.curved || false,
        curveRadius: selectedLayer.curveRadius || 100,
        stroke: selectedLayer.stroke || {
          enabled: false,
          color: '#000000',
          width: 2
        },
        gradient: selectedLayer.gradient || {
          enabled: false,
          type: 'linear',
          colors: ['#000000', '#ffffff'],
          angle: 0
        },
        animation: selectedLayer.animation || {
          enabled: false,
          type: 'fade',
          duration: 1000
        }
      });
    }
  }, [selectedLayer]);

  const updateProperty = (property: string, value: any) => {
    if (!selectedLayer) return;

    updateTextLayer(selectedLayer.id, { [property]: value });
    setTextProperties(prev => ({ ...prev, [property]: value }));

    // Load Google Font if needed
    if (property === 'fontFamily' && !document.querySelector(`link[href*="${value.replace(' ', '+')}"]`)) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${value.replace(' ', '+')}:wght@100;300;400;500;600;700;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  };

  return (
    <>
      <div className={cn(
        "bg-white border-l border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-0 overflow-hidden" : "w-80"
      )}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapse(true)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Canvas Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Settings className="w-4 h-4" />
                <span>Canvas Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="snap-to-center" className="text-xs font-medium">
                  Snap to Center
                </Label>
                <Switch
                  id="snap-to-center"
                  checked={snapToCenter}
                  onCheckedChange={setSnapToCenter}
                />
              </div>
              <p className="text-xs text-gray-500">
                Shows center guides and enables snapping when dragging text layers
              </p>
            </CardContent>
          </Card>

          {/* Text Properties */}
          {selectedLayer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Type className="w-4 h-4" />
                  <span>Text Properties</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="text-content" className="text-xs font-medium">Content</Label>
                  <Textarea
                    id="text-content"
                    value={textProperties.text}
                    onChange={(e) => updateProperty('text', e.target.value)}
                    placeholder="Enter your text... (Use Enter for new lines)"
                    className="mt-1 min-h-[80px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Press Enter to create multiple lines
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium">Font Family</Label>
                  <Select value={textProperties.fontFamily} onValueChange={(value) => updateProperty('fontFamily', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...GOOGLE_FONTS, ...uploadedFonts].map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="font-size" className="text-xs font-medium">Size</Label>
                    <input
                      ref={fontSizeInputRef}
                      id="font-size"
                      type="number"
                      min="8"
                      max="200"
                      defaultValue={selectedLayer?.fontSize || 24}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty field while typing
                        if (value === '') {
                          return;
                        }
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 8 && numValue <= 200) {
                          updateProperty('fontSize', numValue);
                        }
                      }}
                      onBlur={(e) => {
                        // If field is empty on blur, reset to current font size
                        if (e.target.value === '') {
                          e.target.value = String(selectedLayer?.fontSize || 24);
                        }
                      }}
                      className="mt-1 text-center w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium">Weight</Label>
                    <Select value={textProperties.fontWeight} onValueChange={(value) => updateProperty('fontWeight', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHTS.map(weight => (
                          <SelectItem key={weight.value} value={weight.value}>{weight.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Text Alignment</Label>
                  <div className="flex space-x-1 mt-1">
                    <Button
                      variant={textProperties.textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateProperty('textAlign', 'left')}
                      className="flex-1"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={textProperties.textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateProperty('textAlign', 'center')}
                      className="flex-1"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={textProperties.textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateProperty('textAlign', 'right')}
                      className="flex-1"
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="text-color" className="text-xs font-medium">Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="text-color"
                      type="color"
                      value={textProperties.color}
                      onChange={(e) => updateProperty('color', e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      value={textProperties.color}
                      onChange={(e) => updateProperty('color', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Opacity</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Slider
                      value={[textProperties.opacity * 100]}
                      onValueChange={([value]) => updateProperty('opacity', value / 100)}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-10">{Math.round(textProperties.opacity * 100)}%</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Rotation</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Slider
                      value={[textProperties.rotation]}
                      onValueChange={([value]) => updateProperty('rotation', value)}
                      min={-180}
                      max={180}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-12">{Math.round(textProperties.rotation)}°</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Line Height</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Slider
                      value={[textProperties.lineHeight * 100]}
                      onValueChange={([value]) => updateProperty('lineHeight', value / 100)}
                      min={80}
                      max={300}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-12">{Math.round(textProperties.lineHeight * 100)}%</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Letter Spacing</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Slider
                      value={[textProperties.letterSpacing]}
                      onValueChange={([value]) => updateProperty('letterSpacing', value)}
                      min={-5}
                      max={20}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-12">{textProperties.letterSpacing}px</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Text Shadow</Label>
                    <Switch
                      checked={textProperties.textShadow.enabled}
                      onCheckedChange={(enabled) => updateProperty('textShadow', { ...textProperties.textShadow, enabled })}
                    />
                  </div>
                  
                  {textProperties.textShadow.enabled && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      <div>
                        <Label className="text-xs font-medium">Shadow Color</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            type="color"
                            value={textProperties.textShadow.color}
                            onChange={(e) => updateProperty('textShadow', { ...textProperties.textShadow, color: e.target.value })}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={textProperties.textShadow.color}
                            onChange={(e) => updateProperty('textShadow', { ...textProperties.textShadow, color: e.target.value })}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium">Blur</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Slider
                            value={[textProperties.textShadow.blur]}
                            onValueChange={([value]) => updateProperty('textShadow', { ...textProperties.textShadow, blur: value })}
                            max={20}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-500 w-8">{textProperties.textShadow.blur}px</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-medium">Offset X</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Slider
                              value={[textProperties.textShadow.offsetX]}
                              onValueChange={([value]) => updateProperty('textShadow', { ...textProperties.textShadow, offsetX: value })}
                              min={-20}
                              max={20}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-xs text-gray-500 w-8">{textProperties.textShadow.offsetX}px</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium">Offset Y</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Slider
                              value={[textProperties.textShadow.offsetY]}
                              onValueChange={([value]) => updateProperty('textShadow', { ...textProperties.textShadow, offsetY: value })}
                              min={-20}
                              max={20}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-xs text-gray-500 w-8">{textProperties.textShadow.offsetY}px</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Curved Text</Label>
                    <Switch
                      checked={textProperties.curved || false}
                      onCheckedChange={(curved) => updateProperty('curved', curved)}
                    />
                  </div>
                  
                  {textProperties.curved && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <Label className="text-xs font-medium">Curve Radius</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Slider
                          value={[textProperties.curveRadius || 100]}
                          onValueChange={([value]) => updateProperty('curveRadius', value)}
                          min={20}
                          max={500}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-500 w-12">{textProperties.curveRadius || 100}px</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Text Stroke</Label>
                    <Switch
                      checked={textProperties.stroke.enabled}
                      onCheckedChange={(enabled) => updateProperty('stroke', { ...textProperties.stroke, enabled })}
                    />
                  </div>
                  
                  {textProperties.stroke.enabled && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      <div>
                        <Label className="text-xs font-medium">Stroke Color</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            type="color"
                            value={textProperties.stroke.color}
                            onChange={(e) => updateProperty('stroke', { ...textProperties.stroke, color: e.target.value })}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={textProperties.stroke.color}
                            onChange={(e) => updateProperty('stroke', { ...textProperties.stroke, color: e.target.value })}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium">Stroke Width</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Slider
                            value={[textProperties.stroke.width]}
                            onValueChange={([value]) => updateProperty('stroke', { ...textProperties.stroke, width: value })}
                            min={0.5}
                            max={10}
                            step={0.5}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-500 w-8">{textProperties.stroke.width}px</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Text Gradient</Label>
                    <Switch
                      checked={textProperties.gradient.enabled}
                      onCheckedChange={(enabled) => updateProperty('gradient', { ...textProperties.gradient, enabled })}
                    />
                  </div>
                  
                  {textProperties.gradient.enabled && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      <div>
                        <Label className="text-xs font-medium">Gradient Type</Label>
                        <Select 
                          value={textProperties.gradient.type} 
                          onValueChange={(value: 'linear' | 'radial') => updateProperty('gradient', { ...textProperties.gradient, type: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="radial">Radial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-medium">Start Color</Label>
                          <Input
                            type="color"
                            value={textProperties.gradient.colors[0]}
                            onChange={(e) => {
                              const newColors = [...textProperties.gradient.colors];
                              newColors[0] = e.target.value;
                              updateProperty('gradient', { ...textProperties.gradient, colors: newColors });
                            }}
                            className="w-full h-8 p-1 border rounded mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium">End Color</Label>
                          <Input
                            type="color"
                            value={textProperties.gradient.colors[1]}
                            onChange={(e) => {
                              const newColors = [...textProperties.gradient.colors];
                              newColors[1] = e.target.value;
                              updateProperty('gradient', { ...textProperties.gradient, colors: newColors });
                            }}
                            className="w-full h-8 p-1 border rounded mt-1"
                          />
                        </div>
                      </div>
                      
                      {textProperties.gradient.type === 'linear' && (
                        <div>
                          <Label className="text-xs font-medium">Angle</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Slider
                              value={[textProperties.gradient.angle]}
                              onValueChange={([value]) => updateProperty('gradient', { ...textProperties.gradient, angle: value })}
                              max={360}
                              step={15}
                              className="flex-1"
                            />
                            <span className="text-xs text-gray-500 w-12">{textProperties.gradient.angle}°</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => snapLayerToCenter(selectedLayer.id, 'horizontal')}
                    className="flex items-center space-x-1"
                  >
                    <Move className="w-3 h-3" />
                    <span className="text-xs">Center H</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => snapLayerToCenter(selectedLayer.id, 'vertical')}
                    className="flex items-center space-x-1"
                  >
                    <Move className="w-3 h-3" />
                    <span className="text-xs">Center V</span>
                  </Button>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Professional text effects enabled</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Advanced typography controls</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Multi-layer composition tools</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multi-Select Properties */}
          {selectedLayers.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Type className="w-4 h-4" />
                  <span>Group Properties ({selectedLayers.length} layers)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      selectedLayers.forEach(layer => {
                        if (backgroundImage) {
                          updateTextLayer(layer.id, { x: backgroundImage.width / 2 });
                        }
                      });
                    }}
                    className="flex items-center space-x-1"
                  >
                    <AlignCenter className="w-3 h-3" />
                    <span className="text-xs">Align H</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      selectedLayers.forEach(layer => {
                        if (backgroundImage) {
                          updateTextLayer(layer.id, { y: backgroundImage.height / 2 });
                        }
                      });
                    }}
                    className="flex items-center space-x-1"
                  >
                    <AlignCenter className="w-3 h-3" />
                    <span className="text-xs">Align V</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Distribute horizontally
                      const sorted = [...selectedLayers].sort((a, b) => a.x - b.x);
                      if (sorted.length > 2) {
                        const totalWidth = sorted[sorted.length - 1].x - sorted[0].x;
                        const spacing = totalWidth / (sorted.length - 1);
                        
                        sorted.forEach((layer, index) => {
                          if (index > 0 && index < sorted.length - 1) {
                            updateTextLayer(layer.id, { x: sorted[0].x + (spacing * index) });
                          }
                        });
                      }
                    }}
                    className="flex items-center space-x-1"
                  >
                    <span className="text-xs">Dist H</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Distribute vertically
                      const sorted = [...selectedLayers].sort((a, b) => a.y - b.y);
                      if (sorted.length > 2) {
                        const totalHeight = sorted[sorted.length - 1].y - sorted[0].y;
                        const spacing = totalHeight / (sorted.length - 1);
                        
                        sorted.forEach((layer, index) => {
                          if (index > 0 && index < sorted.length - 1) {
                            updateTextLayer(layer.id, { y: sorted[0].y + (spacing * index) });
                          }
                        });
                      }
                    }}
                    className="flex items-center space-x-1"
                  >
                    <span className="text-xs">Dist V</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Equal spacing
                      const avgX = selectedLayers.reduce((sum, layer) => sum + layer.x, 0) / selectedLayers.length;
                      const avgY = selectedLayers.reduce((sum, layer) => sum + layer.y, 0) / selectedLayers.length;
                      selectedLayers.forEach((layer, index) => {
                        const angle = (index / selectedLayers.length) * 2 * Math.PI;
                        const radius = 50;
                        updateTextLayer(layer.id, {
                          x: avgX + Math.cos(angle) * radius,
                          y: avgY + Math.sin(angle) * radius
                        });
                      });
                    }}
                    className="flex items-center space-x-1"
                  >
                    <span className="text-xs">Circle</span>
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500">
                  🎨 <strong>Group Mode Active:</strong> Use batch transforms, smart alignment, and distribution tools. Spacing hints show precise distances between layers.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Layer Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Layers className="w-4 h-4" />
                <span>Layers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {textLayers.map((layer, index) => {
                  const isSelected = selectedLayer?.id === layer.id || selectedLayers.some(l => l.id === layer.id);
                  return (
                    <div
                      key={layer.id}
                      className={cn(
                        "p-2 rounded border cursor-pointer transition-colors",
                        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300",
                        layer.locked && "opacity-60"
                      )}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          if (selectedLayers.includes(layer)) {
                            setSelectedLayers(selectedLayers.filter(l => l.id !== layer.id));
                          } else {
                            setSelectedLayers([...selectedLayers, layer]);
                          }
                        } else {
                          setSelectedLayer(layer);
                          setSelectedLayers([]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">
                          {layer.locked && '🔒 '}
                          {layer.text.split('\n')[0] || 'Text Layer'} {layer.text.includes('\n') ? '...' : ''}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerLock(layer.id);
                            }}
                            className="w-6 h-6 p-0"
                            title={layer.locked ? "Unlock layer" : "Lock layer"}
                          >
                            <span className="text-xs">{layer.locked ? '🔓' : '🔒'}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateLayer(layer.id);
                            }}
                            className="w-6 h-6 p-0"
                            title="Duplicate layer"
                          >
                            <span className="text-xs">📋</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveLayer(layer.id, 'up');
                            }}
                            disabled={index === textLayers.length - 1}
                            className="w-6 h-6 p-0"
                          >
                            <MoveUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveLayer(layer.id, 'down');
                            }}
                            disabled={index === 0}
                            className="w-6 h-6 p-0"
                          >
                            <MoveDown className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTextLayer(layer.id);
                            }}
                            className="w-6 h-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {textLayers.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No text layers yet. Add some text to get started!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Collapse/Expand Button */}
      {collapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapse(false)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white border shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}
    </>
  );
}