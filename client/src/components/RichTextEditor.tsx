import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, 
  IconButton, 
  Divider, 
  Button, 
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Checkbox, 
  FormControlLabel 
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  Image,
  Code,
  TableChart,
  AttachFile,
  Add,
  ExpandMore,
} from '@mui/icons-material';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = 'Empieza a escribir...' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkButtonRef, setLinkButtonRef] = useState<HTMLButtonElement | null>(null);
  const [linkDialogPosition, setLinkDialogPosition] = useState({ top: 0, left: 0 });
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const updateActiveFormats = () => {
    if (editorRef.current) {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
      });
    }
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const handleMouseUp = () => {
      setTimeout(updateActiveFormats, 0);
    };

    const handleKeyUp = () => {
      setTimeout(updateActiveFormats, 0);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    editor.addEventListener('mouseup', handleMouseUp);
    editor.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      editor.removeEventListener('mouseup', handleMouseUp);
      editor.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const execCommand = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value || undefined);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
    setTimeout(updateActiveFormats, 0);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleOpenLinkDialog = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setLinkText(selection.toString());
    } else {
      setLinkText('');
    }
    setLinkUrl('');
    
    // Calcular posición de la ventana flotante
    if (linkButtonRef && toolbarRef.current) {
      const buttonRect = linkButtonRef.getBoundingClientRect();
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      
      setLinkDialogPosition({
        top: buttonRect.bottom - toolbarRect.top + 8,
        left: buttonRect.left - toolbarRect.left,
      });
    }
    
    setLinkDialogOpen(true);
  };

  const handleCloseLinkDialog = () => {
    setLinkDialogOpen(false);
    setLinkText('');
    setLinkUrl('');
    setOpenInNewTab(true);
  };

  const handleApplyLink = () => {
    if (linkUrl.trim()) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Si hay texto seleccionado, lo reemplazamos; si no, insertamos el texto del enlace
        if (!selection.toString().trim() && linkText.trim()) {
          range.insertNode(document.createTextNode(linkText));
          // Seleccionar el texto recién insertado
          range.setStartBefore(range.startContainer);
          range.setEndAfter(range.endContainer);
        }
        
        // Crear el enlace
        const link = document.createElement('a');
        link.href = linkUrl;
        link.textContent = linkText || linkUrl;
        if (openInNewTab) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        
        try {
          range.deleteContents();
          range.insertNode(link);
          onChange(editorRef.current?.innerHTML || '');
        } catch (e) {
          // Si falla, usar execCommand como fallback
          execCommand('createLink', linkUrl);
        }
      } else {
        // Fallback si no hay selección
        execCommand('createLink', linkUrl);
      }
    }
    handleCloseLinkDialog();
  };

  const insertImage = () => {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url) {
      execCommand('insertImage', url);
    }
    setMoreAnchorEl(null);
  };

  const insertTable = () => {
    const rows = prompt('Número de filas:', '3');
    const cols = prompt('Número de columnas:', '3');
    if (rows && cols) {
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.border = '1px solid #ccc';
      
      for (let i = 0; i < parseInt(rows); i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < parseInt(cols); j++) {
          const td = document.createElement('td');
          td.style.border = '1px solid #ccc';
          td.style.padding = '8px';
          td.innerHTML = '&nbsp;';
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(table);
        onChange(editorRef.current?.innerHTML || '');
      }
    }
    setMoreAnchorEl(null);
  };

  const insertCodeBlock = () => {
    const code = prompt('Ingresa el código:');
    if (code) {
      const pre = document.createElement('pre');
      pre.style.backgroundColor = '#f5f5f5';
      pre.style.padding = '10px';
      pre.style.borderRadius = '4px';
      pre.style.fontFamily = 'monospace';
      pre.textContent = code;
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(pre);
        onChange(editorRef.current?.innerHTML || '');
      }
    }
    setMoreAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Barra de herramientas */}
      <Box
        ref={toolbarRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 0.5,
          borderBottom: '1px solid #e0e0e0',
          flexWrap: 'wrap',
          backgroundColor: '#fafafa',
          position: 'relative',
        }}
      >
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            backgroundColor: activeFormats.bold ? '#e0e0e0' : 'transparent',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            }
          }}
          onClick={() => execCommand('bold')}
          title="Negrita"
        >
          <FormatBold fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            backgroundColor: activeFormats.italic ? '#e0e0e0' : 'transparent',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            }
          }}
          onClick={() => execCommand('italic')}
          title="Cursiva"
        >
          <FormatItalic fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            backgroundColor: activeFormats.underline ? '#e0e0e0' : 'transparent',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            }
          }}
          onClick={() => execCommand('underline')}
          title="Subrayado"
        >
          <FormatUnderlined fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            backgroundColor: activeFormats.strikeThrough ? '#e0e0e0' : 'transparent',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            }
          }}
          onClick={() => execCommand('strikeThrough')}
          title="Tachado"
        >
          <FormatStrikethrough fontSize="small" />
        </IconButton>
        <Button
          size="small"
          endIcon={<ExpandMore fontSize="small" />}
          onClick={(e) => setMoreAnchorEl(e.currentTarget)}
          sx={{
            textTransform: 'none',
            color: 'text.primary',
            minWidth: 'auto',
            px: 1,
            fontSize: '0.75rem',
          }}
        >
          Más
        </Button>
        <Menu
          anchorEl={moreAnchorEl}
          open={Boolean(moreAnchorEl)}
          onClose={() => setMoreAnchorEl(null)}
        >
          <MenuItem onClick={() => execCommand('justifyLeft')}>Alinear izquierda</MenuItem>
          <MenuItem onClick={() => execCommand('justifyCenter')}>Alinear centro</MenuItem>
          <MenuItem onClick={() => execCommand('justifyRight')}>Alinear derecha</MenuItem>
          <MenuItem onClick={() => execCommand('justifyFull')}>Justificar</MenuItem>
        </Menu>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '20px' }} />
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            backgroundColor: activeFormats.unorderedList ? '#e0e0e0' : 'transparent',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            }
          }}
          onClick={() => execCommand('insertUnorderedList')}
          title="Lista con viñetas"
        >
          <FormatListBulleted fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            backgroundColor: activeFormats.orderedList ? '#e0e0e0' : 'transparent',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            }
          }}
          onClick={() => execCommand('insertOrderedList')}
          title="Lista numerada"
        >
          <FormatListNumbered fontSize="small" />
        </IconButton>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '20px' }} />
        <IconButton
          ref={(el) => setLinkButtonRef(el)}
          size="small"
          sx={{ 
            p: 0.75,
            backgroundColor: linkDialogOpen ? '#e0e0e0' : 'transparent',
            position: 'relative',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            }
          }}
          onClick={handleOpenLinkDialog}
          title="Insertar enlace"
        >
          <LinkIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ p: 0.75 }}
          onClick={insertImage}
          title="Insertar imagen"
        >
          <Image fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ p: 0.75 }}
          onClick={insertCodeBlock}
          title="Insertar código"
        >
          <Code fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ p: 0.75 }}
          onClick={insertTable}
          title="Insertar tabla"
        >
          <TableChart fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ p: 0.75 }}
          title="Adjuntar archivo"
        >
          <AttachFile fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ p: 0.75 }}
          title="Agregar"
        >
          <Add fontSize="small" />
        </IconButton>
      </Box>

      {/* Área de edición */}
      <Box
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        suppressContentEditableWarning
        sx={{
          flexGrow: 1,
          p: 2,
          minHeight: '300px',
          fontSize: '0.875rem',
          outline: 'none',
          overflowY: 'auto',
          '&:empty:before': {
            content: `"${placeholder}"`,
            color: '#9e9e9e',
          },
          '&:focus': {
            outline: 'none',
          },
        }}
      />

      {/* Ventana flotante para insertar enlace */}
      {linkDialogOpen && (
        <Box
          sx={{
            position: 'absolute',
            top: `${linkDialogPosition.top}px`,
            left: `${linkDialogPosition.left}px`,
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 1000,
            border: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Título */}
          <Box
            sx={{
              p: 1.5,
              borderBottom: '1px solid #e0e0e0',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              color: '#424242',
            }}
          >
            Crear enlace
          </Box>

          {/* Contenido */}
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Texto del enlace"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Texto a mostrar"
            />
            <TextField
              label="URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
              placeholder="https://ejemplo.com"
              autoFocus
              required
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                  size="small"
                  sx={{
                    color: '#1976d2',
                    '&.Mui-checked': {
                      color: '#1976d2',
                    },
                  }}
                />
              }
              label={
                <Box component="span" sx={{ fontSize: '0.875rem' }}>
                  Abrir en una nueva pestaña
                </Box>
              }
            />
          </Box>

          {/* Botones */}
          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
            <Button
              onClick={handleCloseLinkDialog}
              size="small"
              sx={{
                textTransform: 'none',
                color: '#757575',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplyLink}
              size="small"
              variant="contained"
              disabled={!linkUrl.trim()}
              sx={{
                textTransform: 'none',
                backgroundColor: linkUrl.trim() ? '#1976d2' : '#e0e0e0',
                color: linkUrl.trim() ? 'white' : '#9e9e9e',
                '&:hover': {
                  backgroundColor: linkUrl.trim() ? '#1565c0' : '#e0e0e0',
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#9e9e9e',
                },
              }}
            >
              Aplicar
            </Button>
          </Box>
        </Box>
      )}

      {/* Overlay para cerrar al hacer clic fuera */}
      {linkDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={handleCloseLinkDialog}
        />
      )}
    </Box>
  );
};

export default RichTextEditor;

