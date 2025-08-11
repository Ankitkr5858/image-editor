"use client";

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  RotateCcw, 
  Undo2, 
  Redo2,
  Image as ImageIcon,
  Palette,
  Layers3,
  Zap
} from 'lucide-react';

interface HeaderProps {
  onExport: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function Header({ 
  onExport, 
  onReset, 
  canUndo, 
  canRedo, 
  onUndo, 
  onRedo 
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Image Editor</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center space-x-1"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center space-x-1"
          >
            <Redo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Redo</span>
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="flex items-center space-x-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          
          <Button 
            onClick={onExport}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PNG</span>
          </Button>
          
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Palette className="w-3 h-3" />
            <span>Pro Editor</span>
            <Layers3 className="w-3 h-3" />
            <span>Multi-Layer</span>
            <Zap className="w-3 h-3" />
            <span>Advanced</span>
          </div>
        </div>
      </div>
    </header>
  );
}