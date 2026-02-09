import React from 'react';
import { Avatar, AvatarProps, useTheme } from '@mui/material';
import { getAvatarColor } from '../utils/avatarColors';

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'variant'> {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  /** Si se pasa, se usa para elegir el color (p. ej. username o id) y que cada usuario tenga color distinto */
  colorSeed?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
  variant?: 'default' | 'header' | 'minimal';
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  firstName = '',
  lastName = '',
  avatar,
  colorSeed,
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

  // Determinar estilos según la variante (color sólido por persona, iniciales en blanco)
  const getVariantStyles = () => {
    const sizeStyles = getSizeStyles();
    const isDarkMode = theme.palette.mode === 'dark';
    const nameString = `${firstName || ''}${lastName || ''}` || 'user';
    const colorKey = (colorSeed != null && colorSeed !== '') ? colorSeed : nameString;
    const solidColor = getAvatarColor(colorKey);

    switch (variant) {
      case 'header':
        return {
          ...sizeStyles,
          bgcolor: avatar ? 'transparent' : solidColor,
          color: theme.palette.common.white,
          fontWeight: 600,
          border: `1px solid ${theme.palette.divider}`,
        };
      case 'minimal':
        return {
          ...sizeStyles,
          bgcolor: avatar ? 'transparent' : solidColor,
          color: theme.palette.common.white,
          fontWeight: 600,
          border: `1px solid ${theme.palette.divider}`,
        };
      case 'default':
      default:
        return {
          ...sizeStyles,
          bgcolor: avatar ? 'transparent' : solidColor,
          color: theme.palette.common.white,
          fontWeight: 600,
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)'}`,
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
