// client/src/components/DetailCards/LinkedContactsCard.tsx
import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, IconButton } from '@mui/material';
import { Person, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { taxiMonterricoColors } from '../../theme/colors';

interface Contact {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface LinkedContactsCardProps {
  contacts: Contact[];
  maxItems?: number;
}

const LinkedContactsCard: React.FC<LinkedContactsCardProps> = ({ 
  contacts, 
  maxItems = 5 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(contacts.length / maxItems);
  const startIndex = (currentPage - 1) * maxItems;
  const endIndex = startIndex + maxItems;
  const displayContacts = contacts.slice(startIndex, endIndex);

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
    }}>
      <CardContent sx={{ bgcolor: 'transparent', backgroundColor: 'transparent' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
          Contactos vinculados
        </Typography>
        
        {contacts.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {displayContacts.map((contact) => (
                <Box
                  key={contact.id}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(46, 125, 50, 0.1)' 
                        : 'rgba(46, 125, 50, 0.05)',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                    {contact.firstName && contact.lastName 
                      ? `${contact.firstName} ${contact.lastName}`
                      : contact.email || 'Sin nombre'}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            {/* Paginación - Solo se muestra si hay más de maxItems contactos */}
            {contacts.length > maxItems && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 1, 
                  mt: 2,
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`
                }}
              >
                <IconButton
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  size="small"
                  sx={{
                    color: currentPage === 1 
                      ? theme.palette.text.disabled 
                      : taxiMonterricoColors.green,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
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
                    color: currentPage === totalPages 
                      ? theme.palette.text.disabled 
                      : taxiMonterricoColors.green,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
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
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 2 }}>
            <Person sx={{ fontSize: 28, color: theme.palette.text.secondary }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              No hay contactos vinculados
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkedContactsCard;