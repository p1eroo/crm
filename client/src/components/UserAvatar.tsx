import React from 'react';
import { Avatar, AvatarProps, useTheme } from '@mui/material';

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'variant'> {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
  variant?: 'default' | 'header' | 'minimal';
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  firstName = '',
  lastName = '',
  avatar,
  size = 'medium',
  variant = 'default',
  sx,
  ...other
}) => {
  const theme = useTheme();

  // Función para obtener iniciales
  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  // Función para generar color desde string
  const stringToColor = (string: string) => {
    let hash = 0;
    let i;
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.substr(-2);
    }
    return color;
  };

  // Función para generar gradiente desde string
  const stringToGradient = (string: string, isDarkMode: boolean) => {
    const baseColor = stringToColor(string);
    // Convertir hex a RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    // Ajustar la intensidad del degradado según el modo
    const darkenAmount = isDarkMode ? 40 : 20;
    
    // Crear un color más oscuro para el degradado
    const darkerR = Math.max(0, r - darkenAmount);
    const darkerG = Math.max(0, g - darkenAmount);
    const darkerB = Math.max(0, b - darkenAmount);
    
    return `linear-gradient(135deg, ${baseColor} 0%, rgb(${darkerR}, ${darkerG}, ${darkerB}) 100%)`;
  };

  // Determinar dimensiones según el tamaño
  const getSizeStyles = () => {
    if (typeof size === 'number') {
      return {
        width: size,
        height: size,
        fontSize: `${size * 0.4}px`,
      };
    }

    switch (size) {
      case 'small':
        return {
          width: 24,
          height: 24,
          fontSize: '0.625rem',
        };
      case 'medium':
        return {
          width: 40,
          height: 40,
          fontSize: '0.875rem',
        };
      case 'large':
        return {
          width: 100,
          height: 100,
          fontSize: '2rem',
        };
      case 'xlarge':
        return {
          width: 120,
          height: 120,
          fontSize: '2.5rem',
        };
      default:
        return {
          width: 40,
          height: 40,
          fontSize: '0.875rem',
        };
    }
  };

  // Determinar estilos según la variante
  const getVariantStyles = () => {
    const sizeStyles = getSizeStyles();
    const isDarkMode = theme.palette.mode === 'dark';
    const nameString = `${firstName || ''}${lastName || ''}` || 'user';

    switch (variant) {
      case 'header':
        return {
          ...sizeStyles,
          bgcolor: avatar ? 'transparent' : undefined,
          background: !avatar ? stringToGradient(nameString, isDarkMode) : undefined,
          color: theme.palette.common.white,
          fontWeight: 600,
          border: `1px solid ${theme.palette.divider}`,
        };
      case 'minimal':
        return {
          ...sizeStyles,
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          background: !avatar ? stringToGradient(nameString, isDarkMode) : undefined,
          color: theme.palette.common.white,
          fontWeight: 600,
          border: `1px solid ${theme.palette.divider}`,
        };
      case 'default':
      default:
        return {
          ...sizeStyles,
          background: !avatar ? stringToGradient(nameString, isDarkMode) : undefined,
          color: theme.palette.common.white,
          fontWeight: 600,
          border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
          boxShadow: isDarkMode
            ? '0 2px 8px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Avatar
      src={avatar || undefined}
      sx={{
        ...variantStyles,
        ...sx,
      }}
      {...other}
    >
      {!avatar && getInitials(firstName, lastName)}
    </Avatar>
  );
};

export default UserAvatar;
