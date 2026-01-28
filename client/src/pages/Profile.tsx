import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Alert,
  Select,
  MenuItem,
  Paper,
  Chip,
  useTheme,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import { taxiMonterricoColors } from "../theme/colors";
import UserAvatar from "../components/UserAvatar";

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Perfil
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    language: "es",
    dateFormat: "es-ES",
    avatar: "",
  });
  const [countryCode, setCountryCode] = useState("+51");

  const countries = [
    { code: "+51", iso: "PE", name: "Perú" },
    { code: "+1", iso: "US", name: "Estados Unidos" },
    { code: "+52", iso: "MX", name: "México" },
    { code: "+54", iso: "AR", name: "Argentina" },
    { code: "+55", iso: "BR", name: "Brasil" },
    { code: "+56", iso: "CL", name: "Chile" },
    { code: "+57", iso: "CO", name: "Colombia" },
  ];

  const getCountryByCode = (code: string) => {
    return countries.find((c) => c.code === code) || countries[0];
  };

  // Correo
  const [emailConnected, setEmailConnected] = useState(false);
  const [connectingEmail, setConnectingEmail] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: "",
        language: "es",
        dateFormat: "es-ES",
        avatar: user.avatar || "",
      });
      fetchUserProfile();
      checkGoogleConnection();
    }
  }, [user]);

  // Verificar estado de conexión con Google (Gmail + Calendar + Tasks)
  const checkGoogleConnection = async () => {
    try {
      const response = await api.get("/google/token");
      const isConnected = response.data.hasToken && !response.data.isExpired;
      setEmailConnected(isConnected);
    } catch (error: any) {
      // 404 es normal si el usuario no ha conectado Google aún
      if (error.response?.status === 404) {
        setEmailConnected(false);
      } else {
        console.error("Error verificando conexión de Google:", error);
        setEmailConnected(false);
      }
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/auth/me");
      const userData = response.data;
      setProfileData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        language: userData.language || "es",
        dateFormat: userData.dateFormat || "es-ES",
        avatar: userData.avatar || "",
      });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await api.put("/auth/profile", {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        language: profileData.language,
        dateFormat: profileData.dateFormat,
        avatar: profileData.avatar,
      });

      const updatedUser = response.data;
      setUser({
        ...user!,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
      });

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user!,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          avatar: updatedUser.avatar,
        }),
      );

      setMessage({ type: "success", text: "Perfil actualizado correctamente" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Error al actualizar el perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailConnect = async () => {
    if (!user?.id) {
      setMessage({ type: "error", text: "Usuario no identificado" });
      return;
    }

    setConnectingEmail(true);
    try {
      // Obtener URL de autorización del backend (conectará Gmail + Calendar + Tasks)
      const response = await api.get("/google/auth");

      if (response.data.authUrl) {
        // Redirigir al usuario a la URL de autorización de Google
        window.location.href = response.data.authUrl;
      } else {
        throw new Error("No se pudo obtener la URL de autorización");
      }
    } catch (error: any) {
      console.error("Error iniciando conexión con Google:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Error al conectar con Google. Por favor, intenta nuevamente.";
      setMessage({ type: "error", text: errorMessage });
      setConnectingEmail(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: "error",
          text: "La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.",
        });
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        setMessage({
          type: "error",
          text: "Por favor, selecciona un archivo de imagen válido.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;

        // Comprimir imagen si es necesario
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;

          let width = img.width;
          let height = img.height;

          // Redimensionar si es necesario
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convertir a base64 con calidad reducida (0.8 = 80% calidad)
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
            setProfileData({ ...profileData, avatar: compressedBase64 });
            setMessage({
              type: "success",
              text: "Imagen cargada correctamente",
            });
            setTimeout(() => setMessage(null), 3000);
          }
        };

        img.onerror = () => {
          setMessage({ type: "error", text: "Error al procesar la imagen" });
        };

        img.src = result;
      };

      reader.onerror = () => {
        setMessage({ type: "error", text: "Error al leer el archivo" });
      };

      reader.readAsDataURL(file);
    }
  };

  const handleAvatarDelete = () => {
    setProfileData({ ...profileData, avatar: "" });
    setMessage({ type: "success", text: "Foto eliminada correctamente" });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        pb: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {message && (
        <Box sx={{ mb: 3 }}>
          <Alert
            severity={message.type}
            onClose={() => setMessage(null)}
            sx={{
              borderRadius: 2,
            }}
          >
            {message.text}
          </Alert>
        </Box>
      )}

      <Typography
        variant="h5"
        sx={{
          px: 10,
          fontWeight: 700,
          fontSize: { xs: "1.25rem", md: "1.5rem" },
          background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.mode === "dark" ? taxiMonterricoColors.greenLight : taxiMonterricoColors.green} 100%)`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Perfil
      </Typography>

      {/* Layout de dos columnas */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          px: 10,
          py: 7,
          alignItems: { xs: "center", md: "flex-start" },
        }}
      >
        {/* COLUMNA IZQUIERDA: Avatar y botones */}
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            minWidth: { xs: "100%", md: 350 },
            maxWidth: { xs: "100%", md: 400 },
            p: 3,
            py: 12,
            pb: 10,
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 2px 8px rgba(0,0,0,0.3)"
                : "0 2px 8px rgba(0,0,0,0.08)",
            border: `none`,
          }}
        >
          <Chip
            label="Activo"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              bgcolor: "",
              color: "#43e05e",
              fontWeight: 600,
              fontSize: "0.75rem",
              height: 24,
              "& .MuiChip-label": {
                px: 1.5,
              },
            }}
          />
          <UserAvatar
            firstName={profileData.firstName}
            lastName={profileData.lastName}
            avatar={profileData.avatar}
            size="large"
            variant="default"
            sx={{ flexShrink: 0 }}
          />
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.75rem",
              textAlign: "center",
              mt: 1,
              mb: -1,
            }}
          >
            Allowed *.jpeg, *.jpg, *.png, *.gif
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.75rem",
              textAlign: "center",
              mb: 1,
            }}
          >
            max size of 3 Mb
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              width: "100%",
              mt: 2,
            }}
          >
            <Button
              component="label"
              variant="outlined"
              size="small"
              sx={{
                bgcolor: "transparent",
                color: taxiMonterricoColors.green,
                borderColor: "divider",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.8125rem",
                px: 2,
                py: 0.75,
                borderRadius: 2,
                minWidth: 120,
                width: "100%",
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? `${taxiMonterricoColors.green}15`
                      : `${taxiMonterricoColors.green}08`,
                  borderColor: taxiMonterricoColors.green,
                },
              }}
            >
              Cambiar foto
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAvatarDelete}
              sx={{
                bgcolor: "transparent",
                color: theme.palette.error.main,
                borderColor: "divider",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.8125rem",
                px: 2,
                py: 0.75,
                borderRadius: 2,
                minWidth: 120,
                width: "100%",
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? `${theme.palette.error.main}15`
                      : `${theme.palette.error.main}08`,
                  borderColor: theme.palette.error.main,
                },
              }}
            >
              Eliminar
            </Button>
            {!emailConnected && (
              <Button
                variant="contained"
                size="small"
                onClick={handleEmailConnect}
                disabled={connectingEmail}
                startIcon={
                  <Box
                    component="img"
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    sx={{
                      width: 18,
                      height: 18,
                      mr: 0.5,
                    }}
                  />
                }
                sx={{
                  bgcolor: "#67ba50",
                  color: "white",
                  fontWeight: 400,
                  textTransform: "none",
                  fontSize: "0.8125rem",
                  px: 2,
                  py: 0.75,
                  mx: "auto",
                  mt: 2,
                  mb: -3,
                  borderRadius: 2,
                  width: "240px",
                  boxShadow: "0 2px 4px rgba(66, 133, 244, 0.3)",
                  "&:hover": {
                    bgcolor: "#42f463",
                    boxShadow: "0 4px 8px rgba(66, 133, 244, 0.4)",
                  },
                  "&:disabled": {
                    bgcolor: "#42f463",
                    opacity: 0.6,
                  },
                }}
              >
                {connectingEmail ? "Conectando..." : "Conectar con Google"}
              </Button>
            )}
          </Box>
        </Paper>

        {/* COLUMNA DERECHA: Campos del formulario */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            width: "100%",
            maxWidth: { xs: "100%", md: 600 },
            p: 3,
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 2px 8px rgba(0,0,0,0.3)"
                : "0 2px 8px rgba(0,0,0,0.08)",
            border: `none`,
          }}
        >
          <Box sx={{ display: "flex", gap: 2.5, width: "100%" }}>
            <TextField
              fullWidth
              size="medium"
              label="Nombre"
              value={profileData.firstName}
              onChange={(e) =>
                setProfileData({ ...profileData, firstName: e.target.value })
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.875rem",
                  py: 0.5,
                  "& .MuiInputBase-input": {
                    py: 1.5,
                  },
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.875rem",
                },
              }}
            />
            <TextField
              fullWidth
              size="medium"
              label="Apellidos"
              value={profileData.lastName}
              onChange={(e) =>
                setProfileData({ ...profileData, lastName: e.target.value })
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.875rem",
                  py: 0.5,
                  "& .MuiInputBase-input": {
                    py: 1.5,
                  },
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.875rem",
                },
              }}
            />
          </Box>
          <TextField
            fullWidth
            size="medium"
            label="Correo electrónico"
            value={profileData.email}
            disabled
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                fontSize: "0.875rem",
                py: 0.5,
                "& .MuiInputBase-input": {
                  py: 1.5,
                },
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.875rem",
              },
            }}
          />
          <TextField
            fullWidth
            size="medium"
            label="Número de teléfono"
            value={profileData.phone}
            onChange={(e) =>
              setProfileData({ ...profileData, phone: e.target.value })
            }
            placeholder="900 000 000"
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                  sx={{
                    mr: 0,
                    borderRight: 1,
                    borderColor: "divider",
                    pr: 1.5,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    py: 1.5,
                  }}
                >
                  <Select
                    id="country-code-select"
                    name="country-code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    size="small"
                    variant="standard"
                    disableUnderline
                    renderValue={(value) => {
                      const country = getCountryByCode(value);
                      return (
                        <Typography
                          sx={{ fontSize: "0.875rem", color: "text.primary" }}
                        >
                          {country.code}
                        </Typography>
                      );
                    }}
                    sx={{
                      minWidth: "auto",
                      width: "fit-content",
                      fontSize: "0.875rem",
                      color: "text.primary",
                      "& .MuiSelect-select": {
                        py: 0,
                        px: 0.5,
                        pr: 2.5,
                        display: "flex",
                        alignItems: "center",
                        minWidth: "auto",
                      },
                      "& .MuiSelect-icon": {
                        color: "text.secondary",
                        right: 0,
                        fontSize: "1rem",
                      },
                    }}
                    IconComponent={ExpandMore}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        <Typography sx={{ fontSize: "0.875rem" }}>
                          {country.code}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                fontSize: "0.875rem",
                pl: 0,
                py: 0.5,
                "& .MuiInputBase-input": {
                  pl: 2,
                  py: 1.5,
                },
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.875rem",
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleProfileUpdate}
            disabled={loading}
            size="small"
            sx={{
              mt: 2,
              mb: 2,
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              py: 1,
              bgcolor: taxiMonterricoColors.green,
              fontWeight: 600,
              fontSize: "0.8125rem",
              alignSelf: { xs: "center", md: "flex-start" },
              minWidth: 180,
              "&:hover": {
                bgcolor: taxiMonterricoColors.greenDark,
              },
            }}
          >
            Guardar cambios
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Profile;
