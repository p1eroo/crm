// client/src/components/DetailCards/FullActivitiesTableCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Typography,
  Box,
  TextField,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  Checkbox,
  Chip,
  useTheme,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  KeyboardArrowDown,
  Close,
  Comment,
  Email,
  ChevronLeft,
  ChevronRight,
  Assignment,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { taxiMonterricoColors } from '../../theme/colors';

library.add(fas);

interface Activity {
  id: number;
  type?: 'note' | 'email' | 'call' | 'task' | 'todo' | 'meeting';
  subject?: string;
  title?: string;
  description?: string;
  createdAt?: string;
  dueDate?: string;
  isTask?: boolean;
  User?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface FullActivitiesTableCardProps {
  title?: string;
  activities: Activity[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreateActivity?: (type: 'note' | 'task' | 'email' | 'call' | 'meeting') => void;
  onActivityClick?: (activity: Activity) => void;
  onToggleComplete?: (activity: Activity, completed: boolean) => void;
  completedActivities?: { [key: number]: boolean };
  getActivityTypeLabel?: (type: string) => string;
}

const FullActivitiesTableCard: React.FC<FullActivitiesTableCardProps> = ({
  title = 'Actividades Recientes',
  activities,
  searchValue,
  onSearchChange,
  onCreateActivity,
  onActivityClick,
  onToggleComplete,
  completedActivities = {},
  getActivityTypeLabel,
}) => {
  const theme = useTheme();
  const [createActivityMenuAnchor, setCreateActivityMenuAnchor] = useState<null | HTMLElement>(null);
  const [timeRangeMenuAnchor, setTimeRangeMenuAnchor] = useState<null | HTMLElement>(null);
  const [activityFilterMenuAnchor, setActivityFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [activityFilterSearch, setActivityFilterSearch] = useState('');
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('Todo hasta ahora');
  const activityFilterChipRef = useRef<HTMLDivElement>(null);
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Tareas (isTask): siempre "Tarea". Actividades registradas: su tipo real (Reunión, Correo, etc.)
  const defaultGetActivityTypeLabel = (type: string) => {
    const t = type?.toLowerCase() || '';
    const typeMap: { [key: string]: string } = {
      note: 'Nota',
      email: 'Correo',
      call: 'Llamada',
      meeting: 'Reunión',
      task: 'Tarea',
      todo: 'Tarea',
      other: 'Tarea',
    };
    return typeMap[t] || 'Actividad';
  };

  const getActivityTypeLabelFn = (activity: any, type: string) => {
    if ((activity as any)?.isTask || (activity as any)?.type === 'task') return 'Tarea';
    return (getActivityTypeLabel || defaultGetActivityTypeLabel)(type);
  };

  const isTaskForDisplay = (activity: any) =>
    !!(activity as any)?.isTask || (activity as any)?.type === 'task';

  const isTaskActivity = (activity: Activity) => {
    const t = (activity.type || '').toLowerCase();
    return ['task', 'todo', 'other'].includes(t) || !!(activity as any).isTask;
  };

  const isDark = theme.palette.mode === 'dark';
  const typeColors = {
    note: isDark ? '#BDBDBD' : '#9E9E9E',
    email: '#09ADB4',
    call: '#05AE49',
    meeting: '#A31F9D',
    task: '#F59E00',
  };

  const getActivityIconCompact = (type?: string, colorOverride?: string) => {
    const color = colorOverride ?? (type === 'note' ? typeColors.note : type === 'email' ? typeColors.email : type === 'call' ? typeColors.call : type === 'meeting' ? typeColors.meeting : type === 'task' || type === 'todo' ? typeColors.task : theme.palette.text.secondary);
    switch (type) {
      case 'note':
        return <FontAwesomeIcon icon={['fas', 'note-sticky']} style={{ fontSize: 18, color }} />;
      case 'email':
        return <Email sx={{ fontSize: 18, color }} />;
      case 'call':
        return <FontAwesomeIcon icon={['fas', 'phone']} style={{ fontSize: 18, color }} />;
      case 'task':
      case 'todo':
        return <FontAwesomeIcon icon={['fas', 'thumbtack']} style={{ fontSize: 18, color }} />;
      case 'meeting':
        return <FontAwesomeIcon icon={['fas', 'calendar-week']} style={{ fontSize: 18, color }} />;
      case 'other':
        return <FontAwesomeIcon icon={['fas', 'thumbtack']} style={{ fontSize: 18, color }} />;
      default:
        return <Comment sx={{ fontSize: 18, color }} />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'note':
        return typeColors.note;
      case 'email':
        return typeColors.email;
      case 'call':
        return typeColors.call;
      case 'task':
      case 'todo':
        return typeColors.task;
      case 'meeting':
        return typeColors.meeting;
      default:
        return theme.palette.text.secondary;
    }
  };

  const handleToggleComplete = (activity: Activity, checked: boolean) => {
    if (onToggleComplete) {
      onToggleComplete(activity, checked);
    }
  };

  // Filtrar actividades según el término de búsqueda
  let filteredActivities = searchValue
    ? activities.filter((activity) => {
        const searchTerm = searchValue.toLowerCase();
        const subject = (activity.subject || activity.title || '').toLowerCase();
        const description = (activity.description || '').toLowerCase();
        return subject.includes(searchTerm) || description.includes(searchTerm);
      })
    : activities;

  // Filtrar por tipo de actividad
  if (selectedActivityTypes.length > 0) {
    const typeMap: { [key: string]: string[] } = {
      Nota: ['note'],
      Correo: ['email'],
      Llamada: ['call'],
      Tarea: ['task', 'todo', 'other'],
      Reunión: ['meeting'],
    };
    filteredActivities = filteredActivities.filter((activity) => {
      let activityType = ((activity as any).taskSubType || activity.type || '')?.toLowerCase() || '';
      if (activity.isTask && !activityType) {
        activityType = 'task';
      }
      return selectedActivityTypes.some((selectedType) => {
        const mappedTypes = typeMap[selectedType] || [];
        return mappedTypes.includes(activityType);
      });
    });
  }

  // Filtrar por rango de tiempo
  if (selectedTimeRange !== 'Todo hasta ahora') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date;

    switch (selectedTimeRange) {
      case 'Hoy':
        startDate = today;
        break;
      case 'Ayer':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'Esta semana':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - today.getDay());
        break;
      case 'Semana pasada':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - today.getDay() - 7);
        break;
      case 'Últimos 7 días':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      default:
        startDate = new Date(0);
    }

    filteredActivities = filteredActivities.filter((activity) => {
      const activityDate = new Date(activity.createdAt || activity.dueDate || 0);
      return activityDate >= startDate;
    });
  }

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, selectedActivityTypes, selectedTimeRange]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

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
        px: 2,
        py: 2,
        display: 'flex',
        flexDirection: 'column',
        mt: 2,
        mb: 2,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </Typography>

      {/* Opciones de búsqueda y crear actividades */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar actividades"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{
              width: '320px',
              transition: 'all 0.3s ease',
              '& .MuiOutlinedInput-root': {
                height: '40px',
                fontSize: '0.875rem',
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
                boxShadow: 'none',
                '& fieldset': {
                  borderRadius: 2,
                  borderColor: theme.palette.divider,
                  borderWidth: 1,
                },
                '&:hover': {
                  '& fieldset': {
                    borderColor: taxiMonterricoColors.green,
                  },
                },
                '&.Mui-focused': {
                  '& fieldset': {
                    borderColor: taxiMonterricoColors.green,
                    borderWidth: 2,
                  },
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          {onCreateActivity && (
            <Button
              size="small"
              variant="outlined"
              endIcon={<ExpandMore />}
              onClick={(e) => setCreateActivityMenuAnchor(e.currentTarget)}
              sx={{
                minHeight: 40,
                borderRadius: 2,
                border: '1px solid',
                borderColor:
                  theme.palette.mode === 'light'
                    ? theme.palette.divider
                    : '#4f5761',
                boxShadow: 'none',
                color:
                  theme.palette.mode === 'light'
                    ? theme.palette.text.secondary
                    : '#a1a6b0',
                '&:hover': {
                  borderColor:
                    theme.palette.mode === 'light'
                      ? theme.palette.divider
                      : '#5f6773',
                  color:
                    theme.palette.mode === 'light'
                      ? theme.palette.text.secondary
                      : '#b8bdc7',
                  backgroundColor: 'transparent',
                },
                '& .MuiButton-endIcon svg': {
                  color:
                    theme.palette.mode === 'light'
                      ? theme.palette.text.secondary
                      : '#a1a6b0',
                },
                '&:hover .MuiButton-endIcon svg': {
                  color:
                    theme.palette.mode === 'light'
                      ? theme.palette.text.secondary
                      : '#b8bdc7',
                },
              }}
            >
              Crear actividades
            </Button>
          )}
        </Box>

        {/* Filtros alineados a la derecha */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={selectedTimeRange}
            size="small"
            deleteIcon={<KeyboardArrowDown fontSize="small" sx={{ color: '#13944C' }} />}
            onDelete={(e) => {
              e.stopPropagation();
              setTimeRangeMenuAnchor(e.currentTarget);
            }}
            onClick={(e) => setTimeRangeMenuAnchor(e.currentTarget)}
            sx={{
              minHeight: 32,
              cursor: 'pointer',
              color: '#13944C',
              border: 'none',
              bgcolor: theme.palette.background.default,
              '& .MuiChip-deleteIcon': {
                color: '#13944C',
              },
              '&:hover': {
                backgroundColor: theme.palette.background.default,
                opacity: 0.9,
              },
            }}
          />
          <Box ref={activityFilterChipRef} sx={{ display: 'inline-flex' }}>
            {selectedActivityTypes.length > 0 ? (
              <Chip
                label={`(${selectedActivityTypes.length}) Actividad`}
                size="small"
                deleteIcon={<Close fontSize="small" sx={{ color: '#13944C' }} />}
                onDelete={(e) => {
                  e.stopPropagation();
                  setSelectedActivityTypes([]);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activityFilterChipRef.current) {
                    setActivityFilterMenuAnchor(activityFilterChipRef.current);
                  }
                }}
                sx={{
                  minHeight: 32,
                  cursor: 'pointer',
                  bgcolor: theme.palette.background.default,
                  color: '#13944C',
                  border: 'none',
                  '& .MuiChip-deleteIcon': {
                    color: '#13944C',
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.background.default,
                    opacity: 0.9,
                  },
                }}
              />
            ) : (
              <Chip
                label="Actividad"
                size="small"
                deleteIcon={<KeyboardArrowDown fontSize="small" sx={{ color: '#13944C' }} />}
                onDelete={(e) => {
                  e.stopPropagation();
                  if (activityFilterChipRef.current) {
                    setActivityFilterMenuAnchor(activityFilterChipRef.current);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activityFilterChipRef.current) {
                    setActivityFilterMenuAnchor(activityFilterChipRef.current);
                  }
                }}
                sx={{
                  minHeight: 32,
                  cursor: 'pointer',
                  color: '#13944C',
                  border: 'none',
                  bgcolor: theme.palette.background.default,
                  '& .MuiChip-deleteIcon': {
                    color: '#13944C',
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.background.default,
                    opacity: 0.9,
                  },
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Menú de crear actividades */}
      {onCreateActivity && (
        <Menu
          anchorEl={createActivityMenuAnchor}
          open={Boolean(createActivityMenuAnchor)}
          onClose={() => setCreateActivityMenuAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 320,
              maxWidth: 320,
              borderRadius: 2,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(0,0,0,0.5)'
                  : '0 4px 20px rgba(0,0,0,0.15)',
              bgcolor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
              backgroundColor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
              background: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              onCreateActivity('note');
              setCreateActivityMenuAnchor(null);
            }}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <FontAwesomeIcon
              icon={['fas', 'note-sticky']}
              style={{
                marginRight: 16,
                fontSize: 14,
                color: taxiMonterricoColors.green,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                flexGrow: 1,
                color: theme.palette.text.primary,
              }}
            >
              Crear nota
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              onCreateActivity('email');
              setCreateActivityMenuAnchor(null);
            }}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Email
              sx={{
                marginRight: 2,
                fontSize: 14,
                color: taxiMonterricoColors.green,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                flexGrow: 1,
                color: theme.palette.text.primary,
              }}
            >
              Enviar correo
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              onCreateActivity('task');
              setCreateActivityMenuAnchor(null);
            }}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <FontAwesomeIcon
              icon={['fas', 'thumbtack']}
              style={{
                marginRight: 16,
                fontSize: 14,
                color: taxiMonterricoColors.green,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                flexGrow: 1,
                color: theme.palette.text.primary,
              }}
            >
              Crear tarea
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              onCreateActivity('call');
              setCreateActivityMenuAnchor(null);
            }}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <FontAwesomeIcon
              icon={['fas', 'phone']}
              style={{
                marginRight: 16,
                fontSize: 14,
                color: taxiMonterricoColors.green,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                flexGrow: 1,
                color: theme.palette.text.primary,
              }}
            >
              Llamada
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              onCreateActivity('meeting');
              setCreateActivityMenuAnchor(null);
            }}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <FontAwesomeIcon
              icon={['fas', 'calendar-week']}
              style={{
                marginRight: 16,
                fontSize: 14,
                color: taxiMonterricoColors.green,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                flexGrow: 1,
                color: theme.palette.text.primary,
              }}
            >
              Programar reunión
            </Typography>
          </MenuItem>
        </Menu>
      )}

      {/* Menú de rango de tiempo */}
      <Menu
        anchorEl={timeRangeMenuAnchor}
        open={Boolean(timeRangeMenuAnchor)}
        onClose={() => setTimeRangeMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            maxWidth: 280,
            borderRadius: 2,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.5)'
                : '0 4px 20px rgba(0,0,0,0.15)',
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
            backgroundColor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
            background: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
          },
        }}
      >
        {['Todo', 'Hoy', 'Ayer', 'Esta semana', 'Semana pasada', 'Últimos 7 días'].map((option) => {
          const isSelected =
            selectedTimeRange === option ||
            (option === 'Todo' && selectedTimeRange === 'Todo hasta ahora');
          return (
            <MenuItem
              key={option}
              onClick={() => {
                setSelectedTimeRange(option === 'Todo' ? 'Todo hasta ahora' : option);
                setTimeRangeMenuAnchor(null);
              }}
              sx={{
                py: 1.5,
                px: 2,
                color: theme.palette.text.primary,
                backgroundColor: isSelected
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(144, 202, 249, 0.16)'
                    : '#e3f2fd'
                  : 'transparent',
                '&:hover': {
                  backgroundColor: isSelected
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(144, 202, 249, 0.24)'
                      : '#bbdefb'
                    : theme.palette.action.hover,
                },
              }}
            >
              <Typography variant="body2" sx={{ color: 'inherit' }}>
                {option}
              </Typography>
            </MenuItem>
          );
        })}
      </Menu>

      {/* Menú de tipo de actividad */}
      <Menu
        anchorEl={activityFilterMenuAnchor}
        open={Boolean(activityFilterMenuAnchor)}
        onClose={() => setActivityFilterMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            maxWidth: 280,
            borderRadius: 2,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.5)'
                : '0 4px 20px rgba(0,0,0,0.15)',
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
            backgroundColor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
            background: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
          },
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar"
            fullWidth
            value={activityFilterSearch}
            onChange={(e) => setActivityFilterSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search
                    fontSize="small"
                    sx={{ color: theme.palette.text.secondary }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.default
                    : '#f5f5f5',
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.text.secondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: taxiMonterricoColors.green,
                },
              },
            }}
          />
        </Box>
        {(() => {
          const availableTypes = ['Nota', 'Correo', 'Llamada', 'Tarea', 'Reunión'];
          const filteredTypes = activityFilterSearch
            ? availableTypes.filter((type) =>
                type.toLowerCase().includes(activityFilterSearch.toLowerCase())
              )
            : availableTypes;

          return filteredTypes.map((type) => {
            const isSelected = selectedActivityTypes.includes(type);
            return (
              <MenuItem
                key={type}
                onClick={() => {
                  if (isSelected) {
                    setSelectedActivityTypes(
                      selectedActivityTypes.filter((t) => t !== type)
                    );
                  } else {
                    setSelectedActivityTypes([...selectedActivityTypes, type]);
                  }
                }}
                sx={{
                  py: 1.5,
                  px: 2,
                  backgroundColor: isSelected
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(46, 125, 50, 0.16)'
                      : 'rgba(46, 125, 50, 0.08)'
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(46, 125, 50, 0.24)'
                        : 'rgba(46, 125, 50, 0.12)'
                      : theme.palette.action.hover,
                  },
                }}
              >
                <Checkbox
                  checked={isSelected}
                  size="small"
                  sx={{
                    color: taxiMonterricoColors.green,
                    '&.Mui-checked': {
                      color: taxiMonterricoColors.green,
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    flexGrow: 1,
                    color: theme.palette.text.primary,
                  }}
                >
                  {type}
                </Typography>
              </MenuItem>
            );
          });
        })()}
      </Menu>

      {/* Lista de actividades */}
      {filteredActivities.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
          <Assignment sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
          <Typography variant="body2" color="text.secondary">
            {searchValue
              ? 'No se encontraron actividades'
              : 'No hay actividades registradas'}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            sx={{
              width: '100%',
              border: '1px solid',
              borderColor: theme.palette.divider,
              borderRadius: 1.5,
              overflow: 'hidden',
            }}
          >
            <Table
              size="small"
              sx={{
                '& .MuiTableCell-root': {
                  fontSize: '0.75rem',
                  borderBottom: '1px solid',
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                },
                '& .MuiTableBody .MuiTableRow:last-child .MuiTableCell-root': {
                  borderBottom: 'none',
                },
                '& .MuiTableHead .MuiTableCell-root': {
                  fontWeight: 600,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(46, 125, 50, 0.18)'
                      : 'rgba(46, 125, 50, 0.08)',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>ACTIVIDAD</TableCell>
                  <TableCell>ASIGNADO</TableCell>
                  <TableCell>FECHA</TableCell>
                  <TableCell align="right">TIPO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody key={currentPage}>
                {paginatedActivities.map((activity) => {
                  const isCompleted = completedActivities[activity.id] || false;
                  return (
                    <TableRow
                      key={activity.id}
                      onClick={() => onActivityClick && onActivityClick(activity)}
                      sx={{
                        cursor: onActivityClick ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(46, 125, 50, 0.04)',
                        },
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          {onToggleComplete && isTaskActivity(activity) && (
                            <Checkbox
                              checked={isCompleted}
                              disabled={isCompleted}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleComplete(activity, e.target.checked);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              size="small"
                              sx={{
                                p: 0,
                                '& .MuiSvgIcon-root': {
                                  fontSize: 20,
                                },
                              }}
                            />
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {getActivityIconCompact(
                              (activity as any).taskSubType || activity.type || 'task',
                              isTaskForDisplay(activity) ? typeColors.task : undefined
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              fontSize: '0.875rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              opacity: isCompleted ? 0.6 : 1,
                              color: theme.palette.text.primary,
                            }}
                          >
                            {activity.subject || activity.title || 'Sin título'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.813rem',
                          }}
                        >
                          {activity.User
                            ? `${activity.User.firstName} ${activity.User.lastName}`
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.813rem',
                          }}
                        >
                          {(activity.dueDate || activity.createdAt)
                            ? new Date(activity.dueDate || activity.createdAt!).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            color: getTypeColor(isTaskForDisplay(activity) ? 'task' : ((activity as any).taskSubType || activity.type)),
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                          }}
                        >
                          {getActivityTypeLabelFn(activity, (activity as any).taskSubType || activity.type || '')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación - Solo se muestra si hay más de 5 actividades */}
          {filteredActivities.length > itemsPerPage && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 2,
              }}
            >
              <IconButton
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                size="small"
                sx={{
                  color:
                    currentPage === 1
                      ? theme.palette.text.disabled
                      : taxiMonterricoColors.green,
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(46, 125, 50, 0.1)'
                        : 'rgba(46, 125, 50, 0.05)',
                  },
                  '&.Mui-disabled': {
                    color: theme.palette.text.disabled,
                  },
                }}
              >
                <ChevronLeft />
              </IconButton>

              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.primary,
                  minWidth: '60px',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                }}
              >
                {currentPage} / {totalPages}
              </Typography>

              <IconButton
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                size="small"
                sx={{
                  color:
                    currentPage === totalPages
                      ? theme.palette.text.disabled
                      : taxiMonterricoColors.green,
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(46, 125, 50, 0.1)'
                        : 'rgba(46, 125, 50, 0.05)',
                  },
                  '&.Mui-disabled': {
                    color: theme.palette.text.disabled,
                  },
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          )}
        </>
      )}
    </Card>
  );
};

export default FullActivitiesTableCard;
