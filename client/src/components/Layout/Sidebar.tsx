import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  AttachMoney,
  Assignment,
  Campaign,
  Settings,
  Timeline,
  Support,
  PieChart,
  Add,
} from '@mui/icons-material';
import { taxiMonterricoColors } from '../../theme/colors';

const drawerWidth = 80;

const mainMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Contactos', icon: <People />, path: '/contacts' },
  { text: 'Empresas', icon: <Business />, path: '/companies' },
  { text: 'Negocios', icon: <AttachMoney />, path: '/deals' },
  { text: 'Tareas', icon: <Assignment />, path: '/tasks' },
  { text: 'Tickets', icon: <Support />, path: '/tickets' },
  { text: 'Campañas', icon: <Campaign />, path: '/campaigns' },
  { text: 'Automatizaciones', icon: <Timeline />, path: '/automations' },
];

const settingsMenuItem = { text: 'Configuración', icon: <Settings />, path: '/settings' };

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          bgcolor: '#f8f9fa',
          borderRight: '1px solid #e9ecef',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
        },
      }}
    >
      {/* Logo/Icono superior */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        width: 48,
        height: 48,
        borderRadius: 2,
        bgcolor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <PieChart sx={{ 
          fontSize: 24, 
          color: taxiMonterricoColors.green,
        }} />
      </Box>

      {/* Lista de items del menú */}
      <List sx={{ 
        width: '100%', 
        px: 1.5, 
        py: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}>
        {mainMenuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <Tooltip 
              key={item.text}
              title={item.text} 
              placement="right"
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: '#424242',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1,
                    ml: 1,
                  },
                },
                arrow: {
                  sx: {
                    color: '#424242',
                  },
                },
              }}
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 48,
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  justifyContent: 'center',
                  p: 0,
                  mb: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&.Mui-selected': {
                    backgroundColor: taxiMonterricoColors.green,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: taxiMonterricoColors.greenDark,
                    },
                  },
                  '&:hover': {
                    backgroundColor: isSelected ? taxiMonterricoColors.greenDark : '#e9ecef',
                  },
                  '&:not(.Mui-selected)': {
                    color: '#6c757d',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                    color: 'inherit',
                    '& svg': {
                      fontSize: 22,
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
      
      {/* Separador y Configuración al final */}
      <Box sx={{ flex: 1 }} />
      <Box sx={{ width: '100%', px: 1.5 }}>
        <Tooltip 
          title={settingsMenuItem.text} 
          placement="right"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: '#424242',
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                ml: 1,
              },
            },
            arrow: {
              sx: {
                color: '#424242',
              },
            },
          }}
        >
          <ListItemButton
            selected={location.pathname === settingsMenuItem.path}
            onClick={() => navigate(settingsMenuItem.path)}
            sx={{
              minHeight: 48,
              width: 48,
              height: 48,
              borderRadius: 2,
              justifyContent: 'center',
              p: 0,
              mb: 0.5,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                backgroundColor: taxiMonterricoColors.green,
                color: 'white',
                '&:hover': {
                  backgroundColor: taxiMonterricoColors.greenDark,
                },
              },
              '&:hover': {
                backgroundColor: location.pathname === settingsMenuItem.path ? taxiMonterricoColors.greenDark : '#e9ecef',
              },
              '&:not(.Mui-selected)': {
                color: '#6c757d',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: 'center',
                color: 'inherit',
                '& svg': {
                  fontSize: 22,
                },
              }}
            >
              {settingsMenuItem.icon}
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      </Box>

      {/* Botón de agregar al final */}
      <Box sx={{ width: '100%', px: 1.5, mt: 1 }}>
        <Tooltip 
          title="Crear nuevo" 
          placement="right"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: '#424242',
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                ml: 1,
              },
            },
            arrow: {
              sx: {
                color: '#424242',
              },
            },
          }}
        >
          <ListItemButton
            onClick={() => navigate('/contacts')}
            sx={{
              minHeight: 48,
              width: 48,
              height: 48,
              borderRadius: 2,
              justifyContent: 'center',
              p: 0,
              backgroundColor: '#e9ecef',
              color: '#6c757d',
              '&:hover': {
                backgroundColor: '#dee2e6',
                color: taxiMonterricoColors.green,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: 'center',
                color: 'inherit',
                '& svg': {
                  fontSize: 22,
                },
              }}
            >
              <Add />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default Sidebar;




