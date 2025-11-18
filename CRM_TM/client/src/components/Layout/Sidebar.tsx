import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  AttachMoney,
  Assignment,
  Campaign,
  Timeline,
  Support,
  Logout,
} from '@mui/icons-material';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;
const collapsedWidth = 64;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Contactos', icon: <People />, path: '/contacts' },
  { text: 'Empresas', icon: <Business />, path: '/companies' },
  { text: 'Negocios', icon: <AttachMoney />, path: '/deals' },
  { text: 'Tareas', icon: <Assignment />, path: '/tasks' },
  { text: 'Tickets', icon: <Support />, path: '/tickets' },
  { text: 'Campañas', icon: <Campaign />, path: '/campaigns' },
  { text: 'Automatizaciones', icon: <Timeline />, path: '/automations' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { open } = useSidebar();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <Tooltip title={!open ? item.text : ''} placement="right">
                <ListItemButton
                  selected={isSelected}
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                      borderLeft: '3px solid #1976d2',
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: isSelected ? '#1976d2' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      opacity: open ? 1 : 0,
                      transition: 'opacity 0.2s',
                      '& .MuiListItemText-primary': {
                        fontSize: '0.875rem',
                        fontWeight: isSelected ? 600 : 400,
                      },
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <Tooltip title={!open ? 'Cerrar sesión' : ''} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                color: '#d32f2f',
                '&:hover': {
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                <Logout />
              </ListItemIcon>
              <ListItemText
                primary="Cerrar sesión"
                sx={{
                  opacity: open ? 1 : 0,
                  transition: 'opacity 0.2s',
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                    fontWeight: 400,
                  },
                }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;




