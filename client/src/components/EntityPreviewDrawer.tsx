import React, { useEffect, useState, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  CircularProgress,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Close,
  LocationOn,
  Phone,
  Email,
  Business,
  Flag,
  Link as LinkIcon,
  TrendingUp,
  Person,
  KeyboardArrowDown,
  Assignment,
  Note,
  Event,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AttachMoney,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie, faHandshake } from '@fortawesome/free-solid-svg-icons';
import { Building2 } from 'lucide-react';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';

interface EntityPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  entityType: 'contact' | 'company' | 'deal' | 'task';
  entityId: number | null;
  entityData?: any; // Datos opcionales del contacto/empresa/deal/task
}

const EntityPreviewDrawer: React.FC<EntityPreviewDrawerProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityData,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [entity, setEntity] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [associatedCompanies, setAssociatedCompanies] = useState<any[]>([]);
  const [associatedContacts, setAssociatedContacts] = useState<any[]>([]);
  const [associatedDeals, setAssociatedDeals] = useState<any[]>([]);
  const [associatedTickets, setAssociatedTickets] = useState<any[]>([]);
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  const [companiesPage, setCompaniesPage] = useState(1);
  const [contactsPage, setContactsPage] = useState(1);
  const [dealsPage, setDealsPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const itemsPerPage = 5;

  const fetchEntity = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      let endpoint = '';
      if (entityType === 'contact') {
        endpoint = `/contacts/${entityId}`;
      } else if (entityType === 'company') {
        endpoint = `/companies/${entityId}`;
      } else if (entityType === 'deal') {
        endpoint = `/deals/${entityId}`;
      } else if (entityType === 'task') {
        endpoint = `/tasks/${entityId}`;
      }
      const response = await api.get(endpoint);
      setEntity(response.data);
    } catch (error) {
      console.error(`Error fetching ${entityType}:`, error);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  const fetchActivities = useCallback(async () => {
    if (!entityId) return;
    setLoadingActivities(true);
    try {
      const params: any = { limit: 50 };
      if (entityType === 'contact') {
        params.contactId = entityId;
      } else if (entityType === 'company') {
        params.companyId = entityId;
      } else if (entityType === 'deal') {
        params.dealId = entityId;
      } else if (entityType === 'task') {
        // Para tasks, no hay actividades asociadas directamente, pero podemos obtener actividades relacionadas si existe taskId
        // Por ahora, dejamos vacío ya que las tasks son actividades en sí mismas
        setActivities([]);
        setLoadingActivities(false);
        return;
      }
      const response = await api.get('/activities', { params });
      setActivities(response.data.activities || response.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, [entityId, entityType]);

  const fetchAssociations = useCallback(async () => {
    if (!entityId) return;
    setLoadingAssociations(true);
    try {
      if (entityType === 'contact') {
        // Obtener empresas asociadas desde el contacto
        const contactResponse = await api.get(`/contacts/${entityId}`);
        const companies =
          contactResponse.data?.Companies && Array.isArray(contactResponse.data.Companies)
            ? contactResponse.data.Companies
            : contactResponse.data?.Company
            ? [contactResponse.data.Company]
            : [];
        setAssociatedCompanies(companies);

        // Obtener deals asociados
        const dealsResponse = await api.get('/deals', {
          params: { contactId: entityId },
        });
        setAssociatedDeals(dealsResponse.data.deals || dealsResponse.data || []);

        // Obtener tickets asociados
        try {
          const ticketsResponse = await api.get('/tickets', {
            params: { contactId: entityId },
          });
          setAssociatedTickets(ticketsResponse.data.tickets || ticketsResponse.data || []);
        } catch (error) {
          console.error('Error fetching tickets:', error);
          setAssociatedTickets([]);
        }
      } else if (entityType === 'company') {
        // Company
        // Obtener contactos asociados desde la empresa
        const companyResponse = await api.get(`/companies/${entityId}`);
        const contacts =
          companyResponse.data?.Contacts && Array.isArray(companyResponse.data.Contacts)
            ? companyResponse.data.Contacts
            : [];
        setAssociatedContacts(contacts);

        // Obtener deals asociados
        const dealsResponse = await api.get('/deals', {
          params: { companyId: entityId },
        });
        setAssociatedDeals(dealsResponse.data.deals || dealsResponse.data || []);

        // Obtener tickets asociados
        try {
          const ticketsResponse = await api.get('/tickets', {
            params: { companyId: entityId },
          });
          setAssociatedTickets(ticketsResponse.data.tickets || ticketsResponse.data || []);
        } catch (error) {
          console.error('Error fetching tickets:', error);
          setAssociatedTickets([]);
        }
      } else if (entityType === 'deal') {
        // Deal
        // Obtener contacto asociado
        if (entity?.contactId) {
          try {
            const contactResponse = await api.get(`/contacts/${entity.contactId}`);
            setAssociatedContacts([contactResponse.data]);
          } catch (error) {
            console.error('Error fetching contact:', error);
          }
        }

        // Obtener empresa asociada
        if (entity?.companyId) {
          try {
            const companyResponse = await api.get(`/companies/${entity.companyId}`);
            setAssociatedCompanies([companyResponse.data]);
          } catch (error) {
            console.error('Error fetching company:', error);
          }
        }

        // Obtener tickets asociados
        try {
          const ticketsResponse = await api.get('/tickets', {
            params: { dealId: entityId },
          });
          setAssociatedTickets(ticketsResponse.data.tickets || ticketsResponse.data || []);
        } catch (error) {
          console.error('Error fetching tickets:', error);
          setAssociatedTickets([]);
        }
      } else if (entityType === 'task') {
        // Task
        // Obtener contacto asociado
        if (entity?.contactId) {
          try {
            const contactResponse = await api.get(`/contacts/${entity.contactId}`);
            setAssociatedContacts([contactResponse.data]);
          } catch (error) {
            console.error('Error fetching contact:', error);
          }
        }

        // Obtener empresa asociada
        if (entity?.companyId) {
          try {
            const companyResponse = await api.get(`/companies/${entity.companyId}`);
            setAssociatedCompanies([companyResponse.data]);
          } catch (error) {
            console.error('Error fetching company:', error);
          }
        }

        // Obtener deal asociado
        if (entity?.dealId) {
          try {
            const dealResponse = await api.get(`/deals/${entity.dealId}`);
            setAssociatedDeals([dealResponse.data]);
          } catch (error) {
            console.error('Error fetching deal:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching associations:', error);
    } finally {
      setLoadingAssociations(false);
    }
  }, [entityId, entityType, entity]);

  useEffect(() => {
    if (open && entityId) {
      if (entityData) {
        setEntity(entityData);
      } else {
        fetchEntity();
      }
      fetchActivities();
      fetchAssociations();
    } else if (!open) {
      // Limpiar datos al cerrar
      setEntity(null);
      setActivities([]);
      setAssociatedCompanies([]);
      setAssociatedContacts([]);
      setAssociatedDeals([]);
      setAssociatedTickets([]);
      // Resetear páginas al cerrar
      setCompaniesPage(1);
      setContactsPage(1);
      setDealsPage(1);
      setTicketsPage(1);
      setActivitiesPage(1);
    }
  }, [open, entityId, entityData, fetchEntity, fetchActivities, fetchAssociations]);

  const renderEntityInfo = () => {
    if (!entity) return null;

    if (entityType === 'contact') {
      return (
        <>
          {/* Avatar y Nombre */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: entity.avatar ? 'transparent' : (theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400]),
                  fontSize: '3rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  },
                }}
                src={entity.avatar || undefined}
              >
                {!entity.avatar && (
                  <FontAwesomeIcon icon={faUserTie} style={{ fontSize: 60, color: 'white' }} />
                )}
              </Avatar>
              <CheckCircle
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  fontSize: 28,
                  color: theme.palette.text.secondary,
                  bgcolor: theme.palette.background.paper,
                  borderRadius: '50%',
                  border: `2px solid ${theme.palette.background.paper}`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? `0 2px 8px rgba(0,0,0,0.3)` 
                    : `0 2px 8px rgba(0,0,0,0.15)`,
                  filter: theme.palette.mode === 'light' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none',
                }}
              />
            </Box>
            <Typography
              variant="h6"
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: theme.palette.text.primary,
                mb: 0.25,
              }}
            >
              {entity.firstName} {entity.lastName}
            </Typography>
            {entity.email && (
              <Typography
                variant="body2"
                align="center"
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                {entity.email}
              </Typography>
            )}
          </Box>

          {/* Información de contacto */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 1px 3px rgba(0,0,0,0.3)'
                  : '0 1px 3px rgba(0,0,0,0.1)',
              bgcolor: 'transparent',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Location */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                <LocationOn sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                  Location
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: entity.city || entity.address ? theme.palette.text.primary : theme.palette.text.disabled,
                  fontStyle: !(entity.city || entity.address) ? 'italic' : 'normal',
                  textAlign: 'right',
                }}
              >
                {entity.city || entity.address || '--'}
              </Typography>
            </Box>

            {/* Phone */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                <Phone sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                  Phone
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: entity.phone || entity.mobile ? theme.palette.text.primary : theme.palette.text.disabled,
                  fontStyle: !(entity.phone || entity.mobile) ? 'italic' : 'normal',
                  textAlign: 'right',
                }}
              >
                {entity.phone || entity.mobile || '--'}
              </Typography>
            </Box>

            {/* Email */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                <Email sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                  Email
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: entity.email ? theme.palette.text.primary : theme.palette.text.disabled,
                  textAlign: 'right',
                  fontStyle: !entity.email ? 'italic' : 'normal',
                }}
              >
                {entity.email || '--'}
              </Typography>
            </Box>

            {/* Nombre de la empresa */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                <Business sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                  Nombre de la empresa
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color:
                      (entity.Companies && entity.Companies.length > 0) || entity.Company
                        ? theme.palette.text.primary
                        : theme.palette.text.disabled,
                      fontStyle: !((entity.Companies && entity.Companies.length > 0) || entity.Company) ? 'italic' : 'normal',
                    textAlign: 'right',
                  }}
                >
                  {entity.Companies && entity.Companies.length > 0
                    ? entity.Companies[0].name
                    : entity.Company?.name || '--'}
                </Typography>
                <KeyboardArrowDown
                  sx={{
                    fontSize: 14,
                    color: theme.palette.text.secondary,
                  }}
                />
              </Box>
            </Box>

            {/* Estado del lead */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                <Flag sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                  Estado del lead
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: entity.leadStatus ? theme.palette.text.primary : theme.palette.text.disabled,
                    fontStyle: !entity.leadStatus ? 'italic' : 'normal',
                    textAlign: 'right',
                  }}
                >
                  {entity.leadStatus || '--'}
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
              </Box>
            </Box>

            {/* Etapa del ciclo de vida */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                <TrendingUp sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                  Etapa del ciclo de vida
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                  color: entity.lifecycleStage ? theme.palette.text.primary : theme.palette.text.disabled,
                  textAlign: 'right',
                  fontStyle: !entity.lifecycleStage ? 'italic' : 'normal',
                }}
              >
                {entity.lifecycleStage || '--'}
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
              </Box>
            </Box>

            {/* Rol de compra */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                <Person sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                  Rol de compra
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.disabled,
                    textAlign: 'right',
                  }}
                >
                  --
                </Typography>
                <KeyboardArrowDown
                  sx={{
                    fontSize: 14,
                    color: theme.palette.text.secondary,
                  }}
                />
              </Box>
            </Box>
          </Box>
        </>
      );
    } else if (entityType === 'company') {
      // Company
      return (
        <>
          {/* Avatar y Nombre */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: entity.logo ? 'transparent' : (theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400]),
                  fontSize: '3rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  },
                }}
                src={entity.logo || undefined}
              >
                {!entity.logo && <Building2 size={60} color="white" />}
              </Avatar>
            </Box>
            <Typography
              variant="h6"
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: theme.palette.text.primary,
                mb: 0.25,
              }}
            >
              {entity.name}
            </Typography>
            {entity.domain && (
              <Typography
                variant="body2"
                align="center"
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                {entity.domain}
              </Typography>
            )}
          </Box>

          {/* Información de empresa */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 1px 3px rgba(0,0,0,0.3)'
                  : '0 1px 3px rgba(0,0,0,0.1)',
              bgcolor: 'transparent',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Phone */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                <Phone sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                  Teléfono
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: entity.phone ? theme.palette.text.primary : theme.palette.text.disabled,
                  textAlign: 'right',
                  fontStyle: !entity.phone ? 'italic' : 'normal',
                }}
              >
                {entity.phone || '--'}
              </Typography>
            </Box>

            {/* Email */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                <Email sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                  Correo
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: entity.email ? theme.palette.text.primary : theme.palette.text.disabled,
                  textAlign: 'right',
                  fontStyle: !entity.email ? 'italic' : 'normal',
                }}
              >
                {entity.email || '--'}
              </Typography>
            </Box>

            {/* Address */}
            {(entity.address || entity.city || entity.country) && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <LocationOn sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Dirección
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                  color: [entity.address, entity.city, entity.country].filter(Boolean).length > 0 
                    ? theme.palette.text.primary 
                    : theme.palette.text.disabled,
                  textAlign: 'right',
                  fontStyle: [entity.address, entity.city, entity.country].filter(Boolean).length === 0 ? 'italic' : 'normal',
                }}
              >
                {[entity.address, entity.city, entity.country].filter(Boolean).join(', ') || '--'}
                </Typography>
              </Box>
            )}

            {/* Domain */}
            {entity.domain && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <LinkIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Dominio
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
                    textAlign: 'right',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={() => {
                    const domainUrl = entity.domain?.startsWith('http') ? entity.domain : `https://${entity.domain}`;
                    window.open(domainUrl, '_blank');
                  }}
                >
                  {entity.domain}
                </Typography>
              </Box>
            )}

            {/* RUC */}
            {entity.ruc && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Business sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    RUC
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {entity.ruc}
                </Typography>
              </Box>
            )}

            {/* Lifecycle Stage */}
            {entity.lifecycleStage && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Flag sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Etapa
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {entity.lifecycleStage}
                </Typography>
              </Box>
            )}
          </Box>
        </>
      );
    } else if (entityType === 'deal') {
      // Deal
      return (
        <>
          {/* Avatar y Nombre */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400],
                  fontSize: '3rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <FontAwesomeIcon icon={faHandshake} style={{ fontSize: 60, color: 'white' }} />
              </Avatar>
            </Box>
            <Typography
              variant="h6"
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: theme.palette.text.primary,
                mb: 0.25,
              }}
            >
              {entity.name}
            </Typography>
            {entity.amount && (
              <Typography
                variant="body2"
                align="center"
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                S/ {entity.amount.toLocaleString()}
              </Typography>
            )}
          </Box>

          {/* Información del deal */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 1px 3px rgba(0,0,0,0.3)'
                  : '0 1px 3px rgba(0,0,0,0.1)',
              bgcolor: 'transparent',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Monto */}
            {entity.amount && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <AttachMoney sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Monto
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  S/ {entity.amount.toLocaleString()}
                </Typography>
              </Box>
            )}

            {/* Etapa */}
            {entity.stage && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <TrendingUp sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Etapa
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {entity.stage}
                </Typography>
              </Box>
            )}

            {/* Fecha de cierre */}
            {entity.closeDate && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Event sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Fecha de cierre
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {new Date(entity.closeDate).toLocaleDateString('es-ES')}
                </Typography>
              </Box>
            )}

            {/* Contacto */}
            {entity.Contact && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Person sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Contacto
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {entity.Contact.firstName} {entity.Contact.lastName}
                </Typography>
              </Box>
            )}

            {/* Empresa */}
            {entity.Company && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Business sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Empresa
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {entity.Company.name}
                </Typography>
              </Box>
            )}

            {/* Prioridad */}
            {entity.priority && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Flag sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Prioridad
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: entity.priority === 'baja' ? theme.palette.grey[500] : entity.priority === 'media' ? '#F59E0B' : '#EF4444',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      color: theme.palette.text.primary,
                      textAlign: 'right',
                      textTransform: 'capitalize',
                    }}
                  >
                    {entity.priority}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </>
      );
    } else if (entityType === 'task') {
      // Task
      return (
        <>
          {/* Avatar y Nombre */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400],
                  fontSize: '3rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <Assignment sx={{ fontSize: 60, color: 'white' }} />
              </Avatar>
            </Box>
            <Typography
              variant="h6"
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: theme.palette.text.primary,
                mb: 0.25,
              }}
            >
              {entity.title || entity.subject}
            </Typography>
            {entity.type && (
              <Typography
                variant="body2"
                align="center"
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                {entity.type}
              </Typography>
            )}
          </Box>

          {/* Información de la tarea */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 1px 3px rgba(0,0,0,0.3)'
                  : '0 1px 3px rgba(0,0,0,0.1)',
              bgcolor: 'transparent',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Descripción */}
            {entity.description && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary, mb: 0.5 }}>
                  Descripción
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                  }}
                  dangerouslySetInnerHTML={{ __html: entity.description }}
                />
              </Box>
            )}

            {/* Estado */}
            {entity.status && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <CheckCircle sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Estado
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                    textTransform: 'capitalize',
                  }}
                >
                  {entity.status === 'completed' ? 'Completada' : entity.status === 'in progress' ? 'En Progreso' : entity.status === 'pending' ? 'Pendiente' : entity.status === 'cancelled' ? 'Cancelada' : entity.status}
                </Typography>
              </Box>
            )}

            {/* Prioridad */}
            {entity.priority && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Flag sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Prioridad
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: entity.priority === 'low' ? theme.palette.grey[500] : entity.priority === 'medium' ? '#F59E0B' : entity.priority === 'high' ? '#EF4444' : '#EF4444',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      color: theme.palette.text.primary,
                      textAlign: 'right',
                      textTransform: 'capitalize',
                    }}
                  >
                    {entity.priority === 'low' ? 'Baja' : entity.priority === 'medium' ? 'Media' : entity.priority === 'high' ? 'Alta' : entity.priority === 'urgent' ? 'Urgente' : entity.priority}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Fecha de vencimiento */}
            {entity.dueDate && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Event sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Fecha de vencimiento
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {new Date(entity.dueDate).toLocaleDateString('es-ES')}
                </Typography>
              </Box>
            )}

            {/* Asignado a */}
            {entity.AssignedTo && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Person sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Asignado a
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {entity.AssignedTo.firstName} {entity.AssignedTo.lastName}
                </Typography>
              </Box>
            )}

            {/* Contacto asociado */}
            {entity.Contact && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Person sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Contacto
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {entity.Contact.firstName} {entity.Contact.lastName}
                </Typography>
              </Box>
            )}

            {/* Empresa asociada */}
            {entity.Company && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <Business sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Empresa
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {entity.Company.name}
                </Typography>
              </Box>
            )}

            {/* Deal asociado */}
            {entity.Deal && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                  <TrendingUp sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                    Negocio
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    textAlign: 'right',
                  }}
                >
                  {entity.Deal.name}
                </Typography>
              </Box>
            )}
          </Box>
        </>
      );
    }
    return null;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <Note sx={{ fontSize: 18, color: 'white' }} />;
      case 'email':
        return <Email sx={{ fontSize: 18, color: 'white' }} />;
      case 'call':
        return <Phone sx={{ fontSize: 18, color: 'white' }} />;
      case 'task':
      case 'todo':
        return <Assignment sx={{ fontSize: 18, color: 'white' }} />;
      case 'meeting':
        return <Event sx={{ fontSize: 18, color: 'white' }} />;
      default:
        return <Note sx={{ fontSize: 18, color: 'white' }} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'note':
        return '#2E7D32';
      case 'email':
        return '#1976d2';
      case 'call':
        return '#0288d1';
      case 'task':
      case 'todo':
        return '#f57c00';
      case 'meeting':
        return '#7b1fa2';
      default:
        return '#757575';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      transitionDuration={{ enter: 400, exit: 300 }}
      sx={{
        zIndex: 1600,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
        transition: { timeout: { enter: 400, exit: 300 } },
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '90%', md: '480px' },
          maxWidth: '95vw',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(180deg, #1c252e 0%, ${theme.palette.background.default} 100%)`
            : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
          boxShadow: theme.palette.mode === 'dark'
            ? '-8px 0 24px rgba(0,0,0,0.4)'
            : '-8px 0 24px rgba(0,0,0,0.12)',
          border: 'none',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 4,
            py: 3,
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Vista Previa
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Cerrar">
            <Close />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            overflowX: 'hidden',
            mx: -3,
            py: 3,
            pb: 4,
            mb: -3,
            maxWidth: 710,
            alignSelf: 'center',
            width: '100%',
            '&::-webkit-scrollbar': {
              display: 'none',
              width: 0,
              height: 0,
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" sx={{ width: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Información del contacto/empresa */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                mb: 3,
              }}
            >
              {renderEntityInfo()}
            </Box>

            {/* Divider */}
            <Divider sx={{ my: 2 }} />

            {/* Entidades Vinculadas */}
            {(associatedCompanies.length > 0 || associatedContacts.length > 0 || associatedDeals.length > 0 || associatedTickets.length > 0) && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                  }}
                >
                  Vinculados
                </Typography>

                {loadingAssociations ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      py: 2,
                    }}
                  >
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Empresas vinculadas (para contactos) */}
                    {entityType === 'contact' && associatedCompanies.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 1,
                            fontWeight: 500,
                            color: theme.palette.text.secondary,
                            fontSize: '0.75rem',
                          }}
                        >
                          Empresas ({associatedCompanies.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {associatedCompanies
                            .slice((companiesPage - 1) * itemsPerPage, companiesPage * itemsPerPage)
                            .map((company: any) => (
                              <Box
                                key={company.id}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1.5,
                                  bgcolor: theme.palette.action.hover,
                                  border: `1px solid ${theme.palette.divider}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: theme.palette.mode === 'dark'
                                      ? 'rgba(255,255,255,0.05)'
                                      : 'rgba(0,0,0,0.03)',
                                  },
                                }}
                                onClick={() => {
                                  window.open(`/companies/${company.id}`, '_blank');
                                }}
                              >
                                <Business sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: theme.palette.text.primary,
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  {company.name}
                                </Typography>
                              </Box>
                            ))}
                          {associatedCompanies.length > itemsPerPage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => setCompaniesPage((prev) => Math.max(1, prev - 1))}
                                disabled={companiesPage === 1}
                                sx={{
                                  color: companiesPage === 1 ? theme.palette.action.disabled : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: companiesPage === 1 ? 'transparent' : theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ChevronLeft sx={{ fontSize: 18 }} />
                              </IconButton>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {companiesPage} de {Math.ceil(associatedCompanies.length / itemsPerPage)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => setCompaniesPage((prev) => Math.min(Math.ceil(associatedCompanies.length / itemsPerPage), prev + 1))}
                                disabled={companiesPage >= Math.ceil(associatedCompanies.length / itemsPerPage)}
                                sx={{
                                  color: companiesPage >= Math.ceil(associatedCompanies.length / itemsPerPage) ? theme.palette.action.disabled : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: companiesPage >= Math.ceil(associatedCompanies.length / itemsPerPage) ? 'transparent' : theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ChevronRight sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Contactos vinculados (para empresas) */}
                    {entityType === 'company' && associatedContacts.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 1,
                            fontWeight: 500,
                            color: theme.palette.text.secondary,
                            fontSize: '0.75rem',
                          }}
                        >
                          Contactos ({associatedContacts.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {associatedContacts
                            .slice((contactsPage - 1) * itemsPerPage, contactsPage * itemsPerPage)
                            .map((contact: any) => (
                              <Box
                                key={contact.id}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1.5,
                                  bgcolor: theme.palette.action.hover,
                                  border: `1px solid ${theme.palette.divider}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: theme.palette.mode === 'dark'
                                      ? 'rgba(255,255,255,0.05)'
                                      : 'rgba(0,0,0,0.03)',
                                  },
                                }}
                                onClick={() => {
                                  window.open(`/contacts/${contact.id}`, '_blank');
                                }}
                              >
                                <Person sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: theme.palette.text.primary,
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  {contact.firstName} {contact.lastName}
                                </Typography>
                              </Box>
                            ))}
                          {associatedContacts.length > itemsPerPage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => setContactsPage((prev) => Math.max(1, prev - 1))}
                                disabled={contactsPage === 1}
                                sx={{
                                  color: contactsPage === 1 ? theme.palette.action.disabled : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: contactsPage === 1 ? 'transparent' : theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ChevronLeft sx={{ fontSize: 18 }} />
                              </IconButton>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {contactsPage} de {Math.ceil(associatedContacts.length / itemsPerPage)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => setContactsPage((prev) => Math.min(Math.ceil(associatedContacts.length / itemsPerPage), prev + 1))}
                                disabled={contactsPage >= Math.ceil(associatedContacts.length / itemsPerPage)}
                                sx={{
                                  color: contactsPage >= Math.ceil(associatedContacts.length / itemsPerPage) ? theme.palette.action.disabled : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: contactsPage >= Math.ceil(associatedContacts.length / itemsPerPage) ? 'transparent' : theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ChevronRight sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Negocios vinculados */}
                    {associatedDeals.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 1,
                            fontWeight: 500,
                            color: theme.palette.text.secondary,
                            fontSize: '0.75rem',
                          }}
                        >
                          Negocios ({associatedDeals.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {associatedDeals
                            .slice((dealsPage - 1) * itemsPerPage, dealsPage * itemsPerPage)
                            .map((deal: any) => (
                              <Box
                                key={deal.id}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1.5,
                                  bgcolor: theme.palette.action.hover,
                                  border: `1px solid ${theme.palette.divider}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: theme.palette.mode === 'dark'
                                      ? 'rgba(255,255,255,0.05)'
                                      : 'rgba(0,0,0,0.03)',
                                  },
                                }}
                                onClick={() => {
                                  window.open(`/deals/${deal.id}`, '_blank');
                                }}
                              >
                                <TrendingUp sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: theme.palette.text.primary,
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  {deal.name}
                                </Typography>
                              </Box>
                            ))}
                          {associatedDeals.length > itemsPerPage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => setDealsPage((prev) => Math.max(1, prev - 1))}
                                disabled={dealsPage === 1}
                                sx={{
                                  color: dealsPage === 1 ? theme.palette.action.disabled : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: dealsPage === 1 ? 'transparent' : theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ChevronLeft sx={{ fontSize: 18 }} />
                              </IconButton>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {dealsPage} de {Math.ceil(associatedDeals.length / itemsPerPage)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => setDealsPage((prev) => Math.min(Math.ceil(associatedDeals.length / itemsPerPage), prev + 1))}
                                disabled={dealsPage >= Math.ceil(associatedDeals.length / itemsPerPage)}
                                sx={{
                                  color: dealsPage >= Math.ceil(associatedDeals.length / itemsPerPage) ? theme.palette.action.disabled : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: dealsPage >= Math.ceil(associatedDeals.length / itemsPerPage) ? 'transparent' : theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ChevronRight sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Tickets vinculados */}
                    {associatedTickets.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 1,
                            fontWeight: 500,
                            color: theme.palette.text.secondary,
                            fontSize: '0.75rem',
                          }}
                        >
                          Tickets ({associatedTickets.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {associatedTickets
                            .slice((ticketsPage - 1) * itemsPerPage, ticketsPage * itemsPerPage)
                            .map((ticket: any) => (
                              <Box
                                key={ticket.id}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1.5,
                                  bgcolor: theme.palette.action.hover,
                                  border: `1px solid ${theme.palette.divider}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: theme.palette.mode === 'dark'
                                      ? 'rgba(255,255,255,0.05)'
                                      : 'rgba(0,0,0,0.03)',
                                  },
                                }}
                                onClick={() => {
                                  window.open(`/tickets/${ticket.id}`, '_blank');
                                }}
                              >
                                <Assignment sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: theme.palette.text.primary,
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  {ticket.subject || ticket.title || `Ticket #${ticket.id}`}
                                </Typography>
                              </Box>
                            ))}
                          {associatedTickets.length > itemsPerPage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => setTicketsPage((prev) => Math.max(1, prev - 1))}
                                disabled={ticketsPage === 1}
                                sx={{
                                  color: ticketsPage === 1 ? theme.palette.action.disabled : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: ticketsPage === 1 ? 'transparent' : theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ChevronLeft sx={{ fontSize: 18 }} />
                              </IconButton>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {ticketsPage} de {Math.ceil(associatedTickets.length / itemsPerPage)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => setTicketsPage((prev) => Math.min(Math.ceil(associatedTickets.length / itemsPerPage), prev + 1))}
                                disabled={ticketsPage >= Math.ceil(associatedTickets.length / itemsPerPage)}
                                sx={{
                                  color: ticketsPage >= Math.ceil(associatedTickets.length / itemsPerPage) ? theme.palette.action.disabled : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: ticketsPage >= Math.ceil(associatedTickets.length / itemsPerPage) ? 'transparent' : theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ChevronRight sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Divider antes de actividades si hay vinculados */}
            {((associatedCompanies.length > 0 || associatedContacts.length > 0 || associatedDeals.length > 0 || associatedTickets.length > 0)) && (
              <Divider sx={{ my: 2 }} />
            )}

            {/* Actividades */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                Actividades
              </Typography>

              {loadingActivities ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 4,
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              ) : activities.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4,
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: theme.palette.action.hover,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <Assignment
                      sx={{
                        fontSize: 30,
                        color:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.4)'
                            : '#9CA3AF',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      maxWidth: 200,
                    }}
                  >
                    No hay actividades registradas
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {activities
                    .slice((activitiesPage - 1) * itemsPerPage, activitiesPage * itemsPerPage)
                    .map((activity) => (
                      <Paper
                        key={activity.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: theme.palette.action.hover,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow:
                              theme.palette.mode === 'dark'
                                ? '0 2px 8px rgba(0,0,0,0.3)'
                                : '0 2px 8px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: getActivityColor(activity.type),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getActivityIcon(activity.type)}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                              }}
                            >
                              {activity.subject ||
                                (activity.description
                                  ? activity.description
                                      .replace(/<[^>]*>/g, '')
                                      .substring(0, 50)
                                  : 'Sin título')}
                            </Typography>
                            {activity.description &&
                              activity.description !== activity.subject && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {activity.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                                </Typography>
                              )}
                            {activity.createdAt && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  display: 'block',
                                  mt: 0.5,
                                }}
                              >
                                {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  {activities.length > itemsPerPage && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setActivitiesPage((prev) => Math.max(1, prev - 1))}
                        disabled={activitiesPage === 1}
                        sx={{
                          color: activitiesPage === 1 ? theme.palette.action.disabled : theme.palette.text.secondary,
                          '&:hover': {
                            bgcolor: activitiesPage === 1 ? 'transparent' : theme.palette.action.hover,
                          },
                        }}
                      >
                        <ChevronLeft sx={{ fontSize: 18 }} />
                      </IconButton>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                        }}
                      >
                        {activitiesPage} de {Math.ceil(activities.length / itemsPerPage)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setActivitiesPage((prev) => Math.min(Math.ceil(activities.length / itemsPerPage), prev + 1))}
                        disabled={activitiesPage >= Math.ceil(activities.length / itemsPerPage)}
                        sx={{
                          color: activitiesPage >= Math.ceil(activities.length / itemsPerPage) ? theme.palette.action.disabled : theme.palette.text.secondary,
                          '&:hover': {
                            bgcolor: activitiesPage >= Math.ceil(activities.length / itemsPerPage) ? 'transparent' : theme.palette.action.hover,
                          },
                        }}
                      >
                        <ChevronRight sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </>
        )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default EntityPreviewDrawer;
