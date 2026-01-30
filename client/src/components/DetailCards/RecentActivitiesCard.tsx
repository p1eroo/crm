// client/src/components/DetailCards/RecentActivitiesCard.tsx
import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip, useTheme } from '@mui/material';
import { Note, Email, Phone, Assignment, Event, Comment } from '@mui/icons-material';

interface Activity {
  id: number;
  type: 'note' | 'email' | 'call' | 'task' | 'todo' | 'meeting';
  subject?: string;
  title?: string;
  createdAt?: string;
}

interface RecentActivitiesCardProps {
  activities: Activity[];
  maxItems?: number;
}

const RecentActivitiesCard: React.FC<RecentActivitiesCardProps> = ({ 
  activities, 
  maxItems = 6 
}) => {
  const theme = useTheme();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <Note sx={{ fontSize: 20, color: '#9E9E9E' }} />;
      case 'email':
        return <Email sx={{ fontSize: 20, color: '#1976D2' }} />;
      case 'call':
        return <Phone sx={{ fontSize: 20, color: '#2E7D32' }} />;
      case 'task':
      case 'todo':
        return <Assignment sx={{ fontSize: 20, color: '#F57C00' }} />;
      case 'meeting':
        return <Event sx={{ fontSize: 20, color: '#7B1FA2' }} />;
      default:
        return <Comment sx={{ fontSize: 20, color: theme.palette.text.secondary }} />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'note':
        return 'Nota';
      case 'email':
        return 'Correo';
      case 'call':
        return 'Llamada';
      case 'task':
      case 'todo':
        return 'Tarea';
      case 'meeting':
        return 'Reunión';
      default:
        return 'Actividad';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'note':
        return { bg: 'rgba(158, 158, 158, 0.1)', border: 'rgba(158, 158, 158, 0.3)' };
      case 'email':
        return { bg: 'rgba(25, 118, 210, 0.1)', border: 'rgba(25, 118, 210, 0.3)' };
      case 'call':
        return { bg: 'rgba(46, 125, 50, 0.1)', border: 'rgba(46, 125, 50, 0.3)' };
      case 'task':
      case 'todo':
        return { bg: 'rgba(245, 124, 0, 0.1)', border: 'rgba(245, 124, 0, 0.3)' };
      case 'meeting':
        return { bg: 'rgba(123, 31, 162, 0.1)', border: 'rgba(123, 31, 162, 0.3)' };
      default:
        return { bg: theme.palette.action.hover, border: theme.palette.divider };
    }
  };

  const sortedActivities = [...activities]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, maxItems);

  return (
    <Card sx={{ 
      borderRadius: 2,
      boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
      bgcolor: theme.palette.background.paper,
      border: "none",
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
          Actividades Recientes
        </Typography>
      
        {sortedActivities.length > 0 ? (
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              borderRadius: 3,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              },
            },
          }}>
            {sortedActivities.map((activity) => {
              const colors = getActivityColor(activity.type);
              const activityTitle = activity.subject || activity.title || getActivityTypeLabel(activity.type);

              return (
                <Tooltip 
                  key={activity.id} 
                  title={activityTitle}
                  arrow
                  placement="top"
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 100,
                      maxWidth: 100,
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${colors.border}`,
                      bgcolor: colors.bg,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: theme.palette.background.paper,
                      mb: 1,
                    }}>
                      {getActivityIcon(activity.type)}
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.7rem', 
                        color: theme.palette.text.primary,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        mb: 0.5,
                      }}
                    >
                      {getActivityTypeLabel(activity.type)}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        color: theme.palette.text.secondary,
                        textAlign: 'center',
                      }}
                    >
                      {activity.createdAt && new Date(activity.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
            No hay actividades recientes
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivitiesCard;