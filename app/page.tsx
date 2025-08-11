"use client";

import { useState, useRef, useEffect } from 'react';
import { ImageEditor } from '@/components/ImageEditor';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useImageEditor } from '@/hooks/useImageEditor';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const editorHooks = useImageEditor();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onExport={editorHooks.exportImage}
        onReset={editorHooks.resetEditor}
        canUndo={editorHooks.canUndo}
        canRedo={editorHooks.canRedo}
        onUndo={editorHooks.undo}
        onRedo={editorHooks.redo}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4">
          <ImageEditor 
            {...editorHooks}
            nudgeLayer={editorHooks.nudgeLayer}
            snapLayerToCenter={editorHooks.snapLayerToCenter}
            snapToCenter={editorHooks.snapToCenter}
          />
        </div>
        
        <Sidebar 
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          textLayers={editorHooks.textLayers}
          selectedLayer={editorHooks.selectedLayer}
          setSelectedLayer={editorHooks.setSelectedLayer}
          selectedLayers={editorHooks.selectedLayers}
          setSelectedLayers={editorHooks.setSelectedLayers}
          updateTextLayer={editorHooks.updateTextLayer}
          deleteTextLayer={editorHooks.deleteTextLayer}
          duplicateLayer={editorHooks.duplicateLayer}
          toggleLayerLock={editorHooks.toggleLayerLock}
          moveLayer={editorHooks.moveLayer}
          snapLayerToCenter={editorHooks.snapLayerToCenter}
          snapToCenter={editorHooks.snapToCenter}
          setSnapToCenter={editorHooks.setSnapToCenter}
          uploadedFonts={editorHooks.uploadedFonts}
          backgroundImage={editorHooks.backgroundImage}
        />
      </div>
      
      <Toaster />
    </div>
  );
}