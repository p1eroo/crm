import React from "react";
import { Box, Container, Typography, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const Terms: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, mb: 3 }}
          >
            Términos de Servicio
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Última actualización:{" "}
            {new Date().toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 3, mb: 2 }}
            >
              1. Aceptación de los Términos
            </Typography>
            <Typography variant="body1" paragraph>
              Al acceder y utilizar este servicio, usted acepta cumplir con
              estos términos de servicio. Si no está de acuerdo con alguna parte
              de estos términos, no debe utilizar el servicio.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 3, mb: 2 }}
            >
              2. Descripción del Servicio
            </Typography>
            <Typography variant="body1" paragraph>
              Este servicio proporciona una plataforma de gestión de relaciones
              con clientes (CRM) para gestionar contactos, empresas, negocios y
              tareas comerciales.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 3, mb: 2 }}
            >
              3. Uso del Servicio
            </Typography>
            <Typography variant="body1" paragraph>
              Usted se compromete a:
            </Typography>
            <Typography component="ul" variant="body1" sx={{ pl: 3 }}>
              <li>
                Utilizar el servicio únicamente para fines legales y legítimos
              </li>
              <li>No intentar acceder a áreas restringidas del servicio</li>
              <li>No interferir con el funcionamiento del servicio</li>
              <li>Mantener la confidencialidad de su cuenta y contraseña</li>
              <li>
                Notificarnos inmediatamente sobre cualquier uso no autorizado
              </li>
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 3, mb: 2 }}
            >
              4. Cuentas de Usuario
            </Typography>
            <Typography variant="body1" paragraph>
              Es responsable de mantener la confidencialidad de su cuenta y
              contraseña. Usted es responsable de todas las actividades que
              ocurran bajo su cuenta.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 3, mb: 2 }}
            >
              5. Propiedad Intelectual
            </Typography>
            <Typography variant="body1" paragraph>
              Todo el contenido del servicio, incluyendo pero no limitado a
              texto, gráficos, logos, iconos y software, es propiedad de Taxi
              Monterrico o sus proveedores de contenido y está protegido por
              leyes de propiedad intelectual.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 3, mb: 2 }}
            >
              6. Limitación de Responsabilidad
            </Typography>
            <Typography variant="body1" paragraph>
              El servicio se proporciona "tal cual" y "según disponibilidad". No
              garantizamos que el servicio esté libre de errores o
              interrupciones. No seremos responsables por daños indirectos,
              incidentales o consecuentes.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 3, mb: 2 }}
            >
              7. Modificaciones del Servicio
            </Typography>
            <Typography variant="body1" paragraph>
              Nos reservamos el derecho de modificar, suspender o discontinuar
              cualquier aspecto del servicio en cualquier momento, con o sin
              previo aviso.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 3, mb: 2 }}
            >
              8. Terminación
            </Typography>
            <Typography variant="body1" paragraph>
              Podemos terminar o suspender su acceso al servicio inmediatamente,
              sin previo aviso, por cualquier motivo, incluyendo si viola estos
              términos de servicio.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mt: 3, mb: 2 }}
            >
              9. Ley Aplicable
            </Typography>
            <Typography variant="body1" paragraph>
              Estos términos se regirán e interpretarán de acuerdo con las leyes
              de Perú, sin dar efecto a ningún principio de conflictos de leyes.
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Contacto
            </Typography>
            <Typography variant="body1">
              Si tiene preguntas sobre estos términos de servicio, puede
              contactarnos en:{" "}
              <Typography component="span" sx={{ fontWeight: 600 }}>
                soporte@3w.pe
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Terms;
