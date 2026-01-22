import React, { ReactNode } from "react";
import { Box, Card, Typography, useTheme } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { KeyboardArrowRight } from "@mui/icons-material";

export interface GeneralInfoCard {
  label: string;
  value: string | ReactNode;
  icon: IconProp; // FontAwesome icon (acepta IconDefinition o [IconPrefix, IconName])
  iconBgColor: string;
  iconColor: string;
  showArrow?: boolean; // Para mostrar flecha antes del valor (como en "Etapa del ciclo de vida")
}

interface GeneralInfoCardsProps {
  cards: GeneralInfoCard[];
}

const GeneralInfoCards: React.FC<GeneralInfoCardsProps> = ({ cards }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
        },
        gap: 3,
        mb: 2,
      }}
    >
      {cards.map((card, index) => (
        <Card
          key={index}
          sx={{
            width: "100%",
            p: 3,
            bgcolor: theme.palette.background.paper,
            border: "none",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 2px 8px rgba(0,0,0,0.3)"
                : "0 2px 8px rgba(0,0,0,0.1)",
            borderRadius: 1.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            textAlign: "left",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10%",
                bgcolor: card.iconBgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={card.icon}
                style={{ fontSize: 22, color: card.iconColor }}
              />
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: "1rem",
                textAlign: "left",
              }}
            >
              {card.label}
            </Typography>
          </Box>
          {card.showArrow ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <KeyboardArrowRight
                sx={{ fontSize: 20, color: theme.palette.text.secondary }}
              />
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: "0.9375rem", fontWeight: 500 }}
              >
                {card.value}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: "0.9375rem", fontWeight: 500 }}
            >
              {card.value}
            </Typography>
          )}
        </Card>
      ))}
    </Box>
  );
};

export default GeneralInfoCards;
