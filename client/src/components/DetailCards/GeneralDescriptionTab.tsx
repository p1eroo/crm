import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import GeneralInfoCards, { GeneralInfoCard } from './GeneralInfoCards';

interface LinkedCard {
  component: ReactNode; // El componente del card (ej: <RecentActivitiesCard />)
}

interface GeneralDescriptionTabProps {
  generalInfoCards: GeneralInfoCard[];
  linkedCards: LinkedCard[];
  linkedCardsGridColumns?: {
    xs?: string;
    sm?: string;
    md?: string;
  };
}

const GeneralDescriptionTab: React.FC<GeneralDescriptionTabProps> = ({
  generalInfoCards,
  linkedCards,
  linkedCardsGridColumns = { xs: '1fr' }, // Default: 1 columna
}) => {
  return (
    <>
      {/* Los 4 cards superiores de información general */}
      <GeneralInfoCards cards={generalInfoCards} />

      {/* Grid para los cards inferiores (Actividades Recientes, Contactos, Empresas, etc.) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: linkedCardsGridColumns,
          gap: 3,
          mt: 3,
          mb: 2,
        }}
      >
        {linkedCards.map((linkedCard, index) => (
          <React.Fragment key={index}>
            {linkedCard.component}
          </React.Fragment>
        ))}
      </Box>
    </>
  );
};

export default GeneralDescriptionTab;
