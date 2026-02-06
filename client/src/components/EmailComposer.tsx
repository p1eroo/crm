import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
} from "@mui/material";
import { Close, Send } from "@mui/icons-material";
import RichTextEditor from "./RichTextEditor";
import { taxiMonterricoColors } from "../theme/colors";
import { pageStyles } from "../theme/styles";

interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  recipientEmail?: string;
  recipientName?: string;
  initialSubject?: string;
  initialBody?: string;
  onSend?: (emailData: {
    to: string;
    subject: string;
    body: string;
  }) => Promise<void>;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  open,
  onClose,
  recipientEmail,
  recipientName,
  initialSubject,
  initialBody,
  onSend,
}) => {
  const theme = useTheme();
  const [to, setTo] = useState(recipientEmail || "");
  const [subject, setSubject] = useState(initialSubject || "");
  const [body, setBody] = useState(initialBody || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Actualizar 'to' cuando recipientEmail cambia
  useEffect(() => {
    if (recipientEmail) {
      setTo(recipientEmail);
    }
  }, [recipientEmail]);

  // Actualizar subject cuando initialSubject cambia
  useEffect(() => {
    if (initialSubject) {
      setSubject(initialSubject);
    }
  }, [initialSubject]);

  const handleSend = async () => {
    if (!to.trim()) {
      setError("El destinatario es requerido");
      return;
    }

    if (!subject.trim()) {
      setError("El asunto es requerido");
      return;
    }

    if (
      !body.trim() ||
      body === "<p><br></p>" ||
      body === "<br>" ||
      body === ""
    ) {
      setError("El mensaje es requerido");
      return;
    }

    setError("");
    setSending(true);

    try {
      if (onSend) {
        await onSend({
          to: to.trim(),
          subject: subject.trim(),
          body: body,
        });
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al enviar el correo");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setTo(recipientEmail || "");
    setSubject(initialSubject || "");
    setBody(initialBody || "");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: { xs: "95vw", sm: "1100px", md: "600px" },
          maxWidth: { xs: "95vw", sm: "95vw" },
          height: { xs: "85vh", sm: "90vh" },
          maxHeight: { xs: "85vh", sm: "800px" },
          bgcolor: `${theme.palette.background.paper} !important`,
          color: `${theme.palette.text.primary} !important`,
          border: "none",
          display: "flex",
          flexDirection: "column",
          animation: "fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "@keyframes fadeInScale": {
            "0%": {
              opacity: 0,
              transform: "scale(0.95)",
            },
            "100%": {
              opacity: 1,
              transform: "scale(1)",
            },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 1.5,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: "1.375rem",
            letterSpacing: "-0.02em",
            color: theme.palette.text.primary,
          }}
        >
          Correo
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: theme.palette.action.hover,
              color: theme.palette.text.primary,
            },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          "&.MuiDialogContent-root": {
            pt: 0,
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 1.5,
            bgcolor: `${theme.palette.background.paper} !important`,
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Campo Para */}
          <Box sx={{ mb: 2 }}>
            <TextField
              value={to}
              onChange={(e) => setTo(e.target.value)}
              fullWidth
              size="small"
              placeholder="Para"
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: `${theme.palette.background.paper} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  "& fieldset": {
                    borderColor: theme.palette.divider,
                    borderWidth: 2,
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.divider,
                    borderWidth: 2,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.divider,
                    boxShadow: "none",
                    borderWidth: 2,
                  },
                  "& input": {
                    color: `${theme.palette.text.primary} !important`,
                    "&::placeholder": {
                      color: `${theme.palette.text.secondary} !important`,
                      opacity: 1,
                    },
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.paper} inset !important`,
                    WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                  },
                },
              }}
            />
          </Box>

          {/* Campo Asunto */}
          <Box sx={{ mb: 2 }}>
            <TextField
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              size="small"
              placeholder="Asunto"
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: `${theme.palette.background.paper} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  "& fieldset": {
                    borderColor: theme.palette.divider,
                    borderWidth: 2,
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.divider,
                    borderWidth: 2,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.divider,
                    boxShadow: "none",
                    borderWidth: 2,
                  },
                  "& input": {
                    color: `${theme.palette.text.primary} !important`,
                    "&::placeholder": {
                      color: `${theme.palette.text.secondary} !important`,
                      opacity: 1,
                    },
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.paper} inset !important`,
                    WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                  },
                },
              }}
            />
          </Box>

          {/* Editor de texto enriquecido */}
          <Box
            sx={{
              mb: 2,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                border: `2px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : theme.palette.divider
                }`,
                borderRadius: 2,
                overflow: "hidden",
                flex: 1,
                minHeight: "300px",
                display: "flex",
                flexDirection: "column",
                bgcolor: theme.palette.background.paper,
                transition: "all 0.2s ease",
              }}
            >
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Escribe tu mensaje..."
              />
            </Box>
          </Box>

          {/* Mensajes de error/éxito */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: theme.palette.error.main,
                boxShadow: `0 4px 12px ${theme.palette.error.main}33`,
                bgcolor: theme.palette.background.paper,
                "& .MuiAlert-icon": {
                  fontSize: 28,
                },
                "& .MuiAlert-message": {
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                },
              }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: taxiMonterricoColors.green,
                boxShadow: `0 4px 12px ${taxiMonterricoColors.greenLight}30`,
                bgcolor: theme.palette.background.paper,
                "& .MuiAlert-icon": {
                  fontSize: 28,
                },
                "& .MuiAlert-message": {
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                },
              }}
            >
              Correo enviado exitosamente
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={pageStyles.dialogActions}>
        <Button
          onClick={handleClose}
          sx={pageStyles.cancelButton}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          startIcon={sending ? <CircularProgress size={16} /> : <Send />}
          disabled={
            sending ||
            !subject.trim() ||
            !body.trim() ||
            body === "<p><br></p>" ||
            body === "<br>" ||
            body === ""
          }
          sx={pageStyles.saveButton}
        >
          {sending ? "Enviando..." : "Enviar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailComposer;
