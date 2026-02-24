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
  dueDate?: string;
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
  const isDark = theme.palette.mode === 'dark';
  const typeColors = {
    note: isDark ? '#BDBDBD' : '#9E9E9E',
    email: '#09ADB4',
    call: '#05AE49',
    meeting: '#A31F9D',
    task: '#F59E00',
  };

  const getActivityIcon = (type: string, colorOverride?: string) => {
    const color = colorOverride ?? (type === 'note' ? typeColors.note : type === 'email' ? typeColors.email : type === 'call' ? typeColors.call : type === 'meeting' ? typeColors.meeting : type === 'task' || type === 'todo' ? typeColors.task : theme.palette.text.secondary);
    switch (type) {
      case 'note':
        return <Note sx={{ fontSize: 20, color }} />;
      case 'email':
        return <Email sx={{ fontSize: 20, color }} />;
      case 'call':
        return <Phone sx={{ fontSize: 20, color }} />;
      case 'task':
      case 'todo':
        return <Assignment sx={{ fontSize: 20, color }} />;
      case 'meeting':
        return <Event sx={{ fontSize: 20, color }} />;
      case 'other':
        return <Assignment sx={{ fontSize: 20, color }} />;
      default:
        return <Comment sx={{ fontSize: 20, color }} />;
    }
  };

  // En lista: cada tipo muestra su nombre; meeting → Reunión, task/todo/other → Tarea
  const getActivityTypeLabel = (type: string) => {
    const t = type?.toLowerCase() || '';
    switch (t) {
      case 'note':
        return 'Nota';
      case 'email':
        return 'Correo';
      case 'call':
        return 'Llamada';
      case 'meeting':
        return 'Reunión';
      case 'task':
      case 'todo':
      case 'other':
        return 'Tarea';
      default:
        return 'Actividad';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'note':
        return { bg: 'rgba(158, 158, 158, 0.1)', border: 'rgba(158, 158, 158, 0.3)' };
      case 'email':
        return { bg: 'rgba(9, 173, 180, 0.1)', border: 'rgba(9, 173, 180, 0.3)' };
      case 'call':
        return { bg: 'rgba(5, 174, 73, 0.1)', border: 'rgba(5, 174, 73, 0.3)' };
      case 'task':
      case 'todo':
        return { bg: 'rgba(245, 158, 0, 0.1)', border: 'rgba(245, 158, 0, 0.3)' };
      case 'meeting':
        return { bg: 'rgba(163, 31, 157, 0.1)', border: 'rgba(163, 31, 157, 0.3)' };
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
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2,
        boxShadow: 'none',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
        backgroundColor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
        background: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
    }}>
      <CardContent sx={{ bgcolor: 'transparent', backgroundColor: 'transparent' }}>
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
              const isTask = !!(activity as any).isTask || (activity as any).type === 'task';
              const typeForIcon = (activity as any).taskSubType || activity.type || 'task';
              const typeForColor = isTask ? 'task' : typeForIcon;
              const colors = getActivityColor(typeForColor);
              const activityTitle = activity.subject || activity.title || getActivityTypeLabel(typeForIcon);

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
                      {getActivityIcon(typeForIcon, isTask ? typeColors.task : undefined)}
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
                      {((activity as any).isTask || (activity as any).type === 'task') ? 'Tarea' : getActivityTypeLabel((activity as any).taskSubType || activity.type || '')}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        color: theme.palette.text.secondary,
                        textAlign: 'center',
                      }}
                    >
                      {(activity.dueDate || activity.createdAt) && new Date(activity.dueDate || activity.createdAt!).toLocaleDateString('es-ES', {
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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 2 }}>
            <Assignment sx={{ fontSize: 28, color: theme.palette.text.secondary }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              No hay actividades recientes
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivitiesCard;