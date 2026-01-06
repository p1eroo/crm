import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Privacy: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            Política de Privacidad
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
              1. Información que Recopilamos
            </Typography>
            <Typography variant="body1" paragraph>
              Recopilamos información que usted nos proporciona directamente, incluyendo:
            </Typography>
            <Typography component="ul" variant="body1" sx={{ pl: 3 }}>
              <li>Información de contacto (nombre, correo electrónico, teléfono)</li>
              <li>Información de la empresa</li>
              <li>Datos de transacciones y negocios</li>
              <li>Información de autenticación de Google (cuando utiliza inicio de sesión con Google)</li>
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
              2. Uso de la Información
            </Typography>
            <Typography variant="body1" paragraph>
              Utilizamos la información recopilada para:
            </Typography>
            <Typography component="ul" variant="body1" sx={{ pl: 3 }}>
              <li>Proporcionar y mejorar nuestros servicios</li>
              <li>Gestionar relaciones con clientes y contactos</li>
              <li>Enviar comunicaciones relacionadas con el servicio</li>
              <li>Cumplir con obligaciones legales</li>
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
              3. Compartir Información
            </Typography>
            <Typography variant="body1" paragraph>
              No vendemos ni alquilamos su información personal. Podemos compartir información únicamente en las siguientes circunstancias:
            </Typography>
            <Typography component="ul" variant="body1" sx={{ pl: 3 }}>
              <li>Con proveedores de servicios que nos ayudan a operar nuestra plataforma</li>
              <li>Cuando sea requerido por ley o para proteger nuestros derechos</li>
              <li>Con su consentimiento explícito</li>
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
              4. Seguridad de los Datos
            </Typography>
            <Typography variant="body1" paragraph>
              Implementamos medidas de seguridad técnicas y organizativas para proteger su información contra acceso no autorizado, pérdida o destrucción.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
              5. Sus Derechos
            </Typography>
            <Typography variant="body1" paragraph>
              Usted tiene derecho a:
            </Typography>
            <Typography component="ul" variant="body1" sx={{ pl: 3 }}>
              <li>Acceder a su información personal</li>
              <li>Corregir información inexacta</li>
              <li>Solicitar la eliminación de sus datos</li>
              <li>Oponerse al procesamiento de sus datos</li>
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
              6. Cookies y Tecnologías Similares
            </Typography>
            <Typography variant="body1" paragraph>
              Utilizamos cookies y tecnologías similares para mejorar su experiencia y analizar el uso de nuestro servicio.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
              7. Cambios a esta Política
            </Typography>
            <Typography variant="body1" paragraph>
              Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos sobre cambios significativos mediante un aviso en nuestro sitio web.
            </Typography>
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Contacto
            </Typography>
            <Typography variant="body1">
              Si tiene preguntas sobre esta política de privacidad, puede contactarnos en:{' '}
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

export default Privacy;


