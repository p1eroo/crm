import React, { useState, useRef, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import { taxiMonterricoColors } from '../theme/colors';

const ThemeToggleButton: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar posición guardada o usar posición por defecto (esquina superior derecha)
    const savedPosition = localStorage.getItem('themeButtonPosition');
    if (savedPosition) {
      const { x, y } = JSON.parse(savedPosition);
      setPosition({ x, y });
    } else {
      // Posición por defecto: esquina superior derecha
      // Se calculará después del primer render
      setTimeout(() => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setPosition({
            x: window.innerWidth - rect.width - 20,
            y: 20,
          });
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    // Guardar posición cuando cambie
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('themeButtonPosition', JSON.stringify(position));
    }
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
      setHasMoved(false);
    }
  };

  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Verificar si se ha movido desde el inicio del arrastre
        if (!hasMoved) {
          const moved = Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5;
          if (moved) {
            setHasMoved(true);
          }
        }

        // Limitar el movimiento dentro de la ventana
        const maxX = window.innerWidth - (buttonRef.current?.offsetWidth || 40);
        const maxY = window.innerHeight - (buttonRef.current?.offsetHeight || 40);

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Resetear hasMoved después de un pequeño delay para permitir el onClick
      setTimeout(() => {
        setHasMoved(false);
      }, 50);
    };

    if (isDragging && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      startX = rect.left + dragOffset.x;
      startY = rect.top + dragOffset.y;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, hasMoved]);

  const handleClick = (e: React.MouseEvent) => {
    // Solo cambiar tema si no se ha arrastrado (es un clic simple)
    if (!hasMoved && !isDragging) {
      toggleTheme();
    }
  };

  return (
    <Tooltip title={mode === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'} arrow>
      <div
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <IconButton
          sx={{
            width: 40,
            height: 40,
            bgcolor: mode === 'light' ? taxiMonterricoColors.green : taxiMonterricoColors.orange,
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              bgcolor: mode === 'light' ? taxiMonterricoColors.greenDark : taxiMonterricoColors.orangeDark,
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease-in-out',
            '& .MuiSvgIcon-root': {
              fontSize: '1.35rem',
            },
          }}
        >
          {mode === 'light' ? <DarkMode /> : <LightMode />}
        </IconButton>
      </div>
    </Tooltip>
  );
};

export default ThemeToggleButton;

