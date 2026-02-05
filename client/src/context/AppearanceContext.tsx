import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Presets de colores
export const colorPresets = [
  { id: 'green', name: 'Verde', color: '#2E7D32' },
  { id: 'blue', name: 'Azul', color: '#1976D2' },
  { id: 'purple', name: 'Morado', color: '#7B1FA2' },
  { id: 'orange', name: 'Naranja', color: '#F57C00' },
  { id: 'red', name: 'Rojo', color: '#D32F2F' },
  { id: 'teal', name: 'Verde azulado', color: '#00796B' },
];

// Fuentes disponibles
export const fonts = [
  { id: 'Public Sans', name: 'Public Sans', value: 'Public Sans' },
  { id: 'Inter', name: 'Inter', value: 'Inter' },
  { id: 'DM Sans', name: 'DM Sans', value: 'DM Sans' },
  { id: 'Nunito Sans', name: 'Nunito Sans', value: 'Nunito Sans' },
];

interface AppearanceContextType {
  selectedColorPreset: string;
  selectedFont: string;
  fontSize: number;
  setColorPreset: (presetId: string) => void;
  setFont: (fontId: string) => void;
  setFontSize: (size: number) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const AppearanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedColorPreset, setSelectedColorPreset] = useState<string>(() => {
    return localStorage.getItem('userColorPreset') || 'green';
  });
  
  const [selectedFont, setSelectedFont] = useState<string>(() => {
    return localStorage.getItem('userFont') || 'Inter';
  });
  
  const [fontSize, setFontSizeState] = useState<number>(() => {
    // Cargar fontSize desde localStorage al iniciar
    const savedFontSize = localStorage.getItem('userFontSize');
    if (savedFontSize) {
      const parsedSize = parseInt(savedFontSize, 10);
      // Validar que esté en el rango válido (12-20)
      if (!isNaN(parsedSize) && parsedSize >= 12 && parsedSize <= 20) {
        return parsedSize;
      }
    }
    // Valor por defecto si no hay guardado o es inválido
    return 14;
  });

  // Aplicar fuente al documento cuando cambie o al iniciar
  useEffect(() => {
    const fontValue = fonts.find(f => f.id === selectedFont)?.value || 'Inter';
    document.documentElement.style.setProperty('--user-font-family', fontValue);
    // También aplicar a body para que se refleje en toda la app
    if (document.body) {
      document.body.style.fontFamily = fontValue;
    }
  }, [selectedFont]);

  // Aplicar tamaño de fuente al documento cuando cambie o al iniciar
  // Este efecto se ejecuta inmediatamente al montar el componente y cuando fontSize cambia
  useEffect(() => {
    const fontSizePx = `${fontSize}px`;
    const fontSizeRem = `${fontSize / 14}rem`; // Convertir a rem basado en 14px
    
    // Aplicar CSS variables para uso global con transición suave
    document.documentElement.style.setProperty('--user-font-size', fontSizePx);
    document.documentElement.style.setProperty('--user-font-size-rem', fontSizeRem);
    
    // Aplicar directamente al body y html para elementos que no usan MUI
    // Usar transición CSS para cambios suaves (solo si no es la carga inicial)
    const isInitialLoad = !document.body.style.fontSize;
    if (document.body) {
      if (!isInitialLoad) {
        document.body.style.transition = 'font-size 0.15s ease-out';
      }
      document.body.style.fontSize = fontSizePx;
    }
    if (document.documentElement) {
      if (!isInitialLoad) {
        document.documentElement.style.transition = 'font-size 0.15s ease-out';
      }
      document.documentElement.style.fontSize = fontSizePx;
    }
    
    // Aplicar estilo global para tamaño de fuente.
    // No usar transition con !important en * ni en elementos genéricos: anula las animaciones
    // del Drawer (Slide), Sidebar (width) y otros componentes que usan transiciones inline.
    const style = document.createElement('style');
    style.id = 'dynamic-font-size';
    style.textContent = `
      :root {
        --base-font-size: ${fontSizePx};
      }
      body, html {
        font-size: ${fontSizePx} !important;
        transition: font-size 0.15s ease-out;
      }
      /* Transición de font-size solo en elementos de texto, sin !important para no pisar Drawer/Modal */
      p, span, a, li, td, th, label, input, textarea, select, button {
        transition: font-size 0.15s ease-out;
      }
    `;
    
    // Remover estilo anterior si existe
    const existingStyle = document.getElementById('dynamic-font-size');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Agregar nuevo estilo
    document.head.appendChild(style);
    
    return () => {
      // Cleanup: remover el estilo cuando el componente se desmonte o cambie
      const styleToRemove = document.getElementById('dynamic-font-size');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [fontSize]);

  const setColorPreset = (presetId: string) => {
    setSelectedColorPreset(presetId);
    localStorage.setItem('userColorPreset', presetId);
    // El color preset se aplicará cuando se recree el tema en App.tsx
    // Por ahora solo guardamos la preferencia
  };

  const setFont = (fontId: string) => {
    setSelectedFont(fontId);
    localStorage.setItem('userFont', fontId);
  };

  const setFontSize = (size: number) => {
    // Validar que el tamaño esté en el rango válido (12-20)
    const validSize = Math.max(12, Math.min(20, size));
    setFontSizeState(validSize);
    // Guardar en localStorage inmediatamente
    try {
      localStorage.setItem('userFontSize', validSize.toString());
    } catch (error) {
      console.error('Error al guardar fontSize en localStorage:', error);
    }
  };

  return (
    <AppearanceContext.Provider
      value={{
        selectedColorPreset,
        selectedFont,
        fontSize,
        setColorPreset,
        setFont,
        setFontSize,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};
