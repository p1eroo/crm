import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  IconButton, 
  Divider, 
  Button,
  TextField, 
  Checkbox, 
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  TableChart,
  AttachFile,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
} from '@mui/icons-material';
import { pageStyles } from '../theme/styles';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = 'Empieza a escribir...' }) => {
  const theme = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachFileInputRef = useRef<HTMLInputElement>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState('3');
  const [tableCols, setTableCols] = useState('3');
  const savedSelectionRef = useRef<Range | null>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });

  useEffect(() => {
    // Solo actualizar si el cambio NO viene del usuario escribiendo
    if (editorRef.current && editorRef.current.innerHTML !== value && !isUpdatingRef.current && !isUserTypingRef.current) {
      isUpdatingRef.current = true;
      editorRef.current.innerHTML = value || '';
      // Usar requestAnimationFrame para asegurar que el DOM se actualice antes de permitir más cambios
      requestAnimationFrame(() => {
        isUpdatingRef.current = false;
      });
    }
  }, [value]);

  const updateActiveFormats = useCallback(() => {
    if (editorRef.current) {
      // Usar requestAnimationFrame para actualizaciones más suaves
      requestAnimationFrame(() => {
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
      });
    }
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const handleMouseUp = () => {
      updateActiveFormats();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Solo actualizar formatos si no es una tecla de texto normal (evitar lag al escribir)
      if (e.key && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta')) {
        updateActiveFormats();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    editor.addEventListener('mouseup', handleMouseUp);
    editor.addEventListener('keyup', handleKeyUp as EventListener);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      editor.removeEventListener('mouseup', handleMouseUp);
      editor.removeEventListener('keyup', handleKeyUp as EventListener);
      // Limpiar timeout al desmontar
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [updateActiveFormats]);

  const execCommand = useCallback((command: string, value: string | null = null) => {
    document.execCommand(command, false, value || undefined);
    if (editorRef.current) {
      // Actualizar inmediatamente para comandos de formato (no necesita debounce)
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  // Debounce para evitar actualizaciones excesivas
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);
  const isUserTypingRef = useRef(false);

  const handleInput = useCallback(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      // Marcar que el usuario está escribiendo
      isUserTypingRef.current = true;
      
      // Limpiar timeout anterior
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Actualizar después de un pequeño delay (solo para el callback, el editor se actualiza inmediatamente)
      debounceTimeoutRef.current = setTimeout(() => {
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
          // Permitir actualizaciones externas después de que el usuario termine de escribir
          setTimeout(() => {
            isUserTypingRef.current = false;
          }, 200);
        }
      }, 150); // 150ms de delay para que sea fluido pero no excesivo
    }
  }, [onChange]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleOpenLinkDialog = () => {
    const selection = window.getSelection();
    // Guardar la selección actual antes de abrir el modal
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      const selectedText = selection.toString().trim();
      if (selectedText) {
        setLinkText(selectedText);
      } else {
        setLinkText('');
      }
    } else {
      // Si no hay selección, guardar la posición del cursor
      if (editorRef.current) {
        const range = document.createRange();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
        } else {
          // Colocar el cursor al final del contenido
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          savedSelectionRef.current = range;
        }
      }
      setLinkText('');
    }
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const handleCloseLinkDialog = () => {
    setLinkDialogOpen(false);
    setLinkText('');
    setLinkUrl('');
    setOpenInNewTab(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim() || !editorRef.current) return;

    // Restaurar el foco al editor
    editorRef.current.focus();

    // Restaurar la selección guardada o usar la selección actual
    let range: Range | null = null;
    const selection = window.getSelection();
    
    if (savedSelectionRef.current) {
      // Restaurar la selección guardada
      try {
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(savedSelectionRef.current);
          range = selection.getRangeAt(0);
        }
      } catch (e) {
        console.error('Error restoring selection:', e);
      }
    }
    
    // Si no hay selección guardada, intentar usar la selección actual
    if (!range && selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    }
    
    // Si aún no hay rango, crear uno al final del contenido
    if (!range && editorRef.current) {
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    if (range) {
      try {
        // Si hay texto seleccionado, usarlo; si no, usar el texto del campo
        const textToLink = linkText.trim() || linkUrl;
        
        // Crear el elemento de enlace
        const link = document.createElement('a');
        link.href = linkUrl.trim();
        link.textContent = textToLink;
        if (openInNewTab) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        
        // Si hay contenido seleccionado, reemplazarlo
        if (range.toString().trim()) {
          range.deleteContents();
        }
        
        // Insertar el enlace
        range.insertNode(link);
        
        // Colocar el cursor después del enlace
        range.setStartAfter(link);
        range.collapse(true);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        // Actualizar el contenido
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      } catch (e) {
        console.error('Error inserting link:', e);
        // Fallback usando execCommand
        if (linkText.trim()) {
          // Si hay texto, insertarlo primero
          document.execCommand('insertText', false, linkText);
        }
        // Seleccionar el texto insertado o el texto seleccionado
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const r = sel.getRangeAt(0);
          r.selectNodeContents(r.commonAncestorContainer);
          sel.removeAllRanges();
          sel.addRange(r);
        }
        document.execCommand('createLink', false, linkUrl.trim());
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }
    } else {
      // Fallback final usando execCommand
      if (linkText.trim()) {
        document.execCommand('insertText', false, linkText);
      }
      document.execCommand('createLink', false, linkUrl.trim());
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
    
    handleCloseLinkDialog();
  };

  const attachFile = () => {
    // Abrir el selector de archivos (misma funcionalidad que insertar imagen)
    if (attachFileInputRef.current) {
      attachFileInputRef.current.click();
    }
  };

  const handleAttachFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Leer el archivo y convertirlo a data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && editorRef.current) {
        // Restaurar el foco al editor
        editorRef.current.focus();
        
        // Obtener la selección actual o crear una nueva
        const selection = window.getSelection();
        let range: Range | null = null;
        
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        } else if (editorRef.current) {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }

        if (range) {
          try {
            // Si es una imagen, insertarla como imagen
            if (file.type.startsWith('image/')) {
              const img = document.createElement('img');
              img.src = dataUrl;
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.alt = file.name;
              range.insertNode(img);
              range.setStartAfter(img);
            } else {
              // Si no es imagen, crear un enlace al archivo
              const link = document.createElement('a');
              link.href = dataUrl;
              link.textContent = `📎 ${file.name}`;
              link.download = file.name;
              link.style.textDecoration = 'none';
              link.style.color = theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2';
              link.style.marginRight = '4px';
              range.insertNode(link);
              range.setStartAfter(link);
            }
            
            range.collapse(true);
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            // Actualizar el contenido
            onChange(editorRef.current.innerHTML);
          } catch (error) {
            console.error('Error inserting file:', error);
            // Fallback: insertar texto con el nombre del archivo
            const textNode = document.createTextNode(`📎 ${file.name} `);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }
            onChange(editorRef.current.innerHTML);
          }
        }
      }
    };
    
    reader.onerror = () => {
      alert('Error al leer el archivo.');
    };
    
    reader.readAsDataURL(file);
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    if (attachFileInputRef.current) {
      attachFileInputRef.current.value = '';
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    // Leer el archivo y convertirlo a data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && editorRef.current) {
        // Restaurar el foco al editor
        editorRef.current.focus();
        
        // Obtener la selección actual o crear una nueva
        const selection = window.getSelection();
        let range: Range | null = null;
        
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        } else if (editorRef.current) {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }

        if (range) {
          try {
            // Crear el elemento de imagen
            const img = document.createElement('img');
            img.src = dataUrl;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.alt = file.name;
            
            // Insertar la imagen
            range.insertNode(img);
            
            // Colocar el cursor después de la imagen
            range.setStartAfter(img);
            range.collapse(true);
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            // Actualizar el contenido
            onChange(editorRef.current.innerHTML);
          } catch (error) {
            console.error('Error inserting image:', error);
            // Fallback usando execCommand
            execCommand('insertImage', dataUrl);
          }
        } else {
          // Fallback usando execCommand
          execCommand('insertImage', dataUrl);
        }
      }
    };
    
    reader.onerror = () => {
      alert('Error al leer el archivo de imagen.');
    };
    
    reader.readAsDataURL(file);
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenTableDialog = () => {
    // Guardar la selección actual antes de abrir el dialog
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    } else if (editorRef.current) {
      // Si no hay selección, colocar el cursor al final del contenido
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      savedSelectionRef.current = range;
    }
    setTableRows('3');
    setTableCols('3');
    setTableDialogOpen(true);
  };

  const handleCloseTableDialog = () => {
    setTableDialogOpen(false);
    setTableRows('3');
    setTableCols('3');
  };

  const handleInsertTable = () => {
    const rows = parseInt(tableRows);
    const cols = parseInt(tableCols);
    
    if (rows > 0 && cols > 0 && !isNaN(rows) && !isNaN(cols)) {
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.border = `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#ccc'}`;
      table.style.marginTop = '8px';
      table.style.marginBottom = '8px';
      
      for (let i = 0; i < rows; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < cols; j++) {
          const td = document.createElement('td');
          td.style.border = `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#ccc'}`;
          td.style.padding = '8px';
          td.style.minWidth = '50px';
          td.innerHTML = '&nbsp;';
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      
      // Restaurar la selección guardada
      const selection = window.getSelection();
      let range: Range | null = null;
      
      if (savedSelectionRef.current && selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(savedSelectionRef.current);
          range = selection.getRangeAt(0);
        } catch (e) {
          console.error('Error restoring selection for table:', e);
        }
      }
      
      if (range) {
        range.deleteContents();
        range.insertNode(table);
        
        // Mover el cursor después de la tabla
        range.setStartAfter(table);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        onChange(editorRef.current?.innerHTML || '');
      } else if (editorRef.current) {
        // Si no hay selección, insertar al final
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
        range.insertNode(table);
        onChange(editorRef.current.innerHTML);
      }
      
      handleCloseTableDialog();
    }
  };

  const insertTable = () => {
    handleOpenTableDialog();
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
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          flexWrap: 'wrap',
          backgroundColor: 'transparent',
          position: 'relative',
          gap: 0.25,
        }}
      >
        {/* Grupo 1: Formato básico de texto */}
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            color: theme.palette.text.secondary,
            backgroundColor: activeFormats.bold 
              ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0')
              : 'transparent',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
              color: theme.palette.text.primary,
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
            color: theme.palette.text.secondary,
            backgroundColor: activeFormats.italic 
              ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0')
              : 'transparent',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
              color: theme.palette.text.primary,
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
            color: theme.palette.text.secondary,
            backgroundColor: activeFormats.underline 
              ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0')
              : 'transparent',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
              color: theme.palette.text.primary,
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
            color: theme.palette.text.secondary,
            backgroundColor: activeFormats.strikeThrough 
              ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0')
              : 'transparent',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
              color: theme.palette.text.primary,
            }
          }}
          onClick={() => execCommand('strikeThrough')}
          title="Tachado"
        >
          <FormatStrikethrough fontSize="small" />
        </IconButton>

        {/* Separador */}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '24px', alignSelf: 'center', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />

        {/* Grupo 2: Alineación */}
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.action.hover,
              color: theme.palette.text.primary,
            }
          }}
          onClick={() => execCommand('justifyLeft')}
          title="Alinear izquierda"
        >
          <FormatAlignLeft fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.action.hover,
              color: theme.palette.text.primary,
            }
          }}
          onClick={() => execCommand('justifyCenter')}
          title="Alinear centro"
        >
          <FormatAlignCenter fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.action.hover,
              color: theme.palette.text.primary,
            }
          }}
          onClick={() => execCommand('justifyRight')}
          title="Alinear derecha"
        >
          <FormatAlignRight fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.action.hover,
              color: theme.palette.text.primary,
            }
          }}
          onClick={() => execCommand('justifyFull')}
          title="Justificar"
        >
          <FormatAlignJustify fontSize="small" />
        </IconButton>

        {/* Separador */}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '24px', alignSelf: 'center', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />

        {/* Grupo 3: Listas */}
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            color: theme.palette.text.secondary,
            backgroundColor: activeFormats.unorderedList 
              ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0')
              : 'transparent',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
              color: theme.palette.text.primary,
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
            color: theme.palette.text.secondary,
            backgroundColor: activeFormats.orderedList 
              ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0')
              : 'transparent',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
              color: theme.palette.text.primary,
            }
          }}
          onClick={() => execCommand('insertOrderedList')}
          title="Lista numerada"
        >
          <FormatListNumbered fontSize="small" />
        </IconButton>

        {/* Separador */}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '24px', alignSelf: 'center', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />

        {/* Grupo 4: Inserción de elementos */}
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            color: theme.palette.text.secondary,
            backgroundColor: linkDialogOpen 
              ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0')
              : 'transparent',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
              color: theme.palette.text.primary,
            }
          }}
          onClick={handleOpenLinkDialog}
          title="Insertar enlace"
        >
          <LinkIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.action.hover,
              color: theme.palette.text.primary,
            }
          }}
          onClick={insertTable}
          title="Insertar tabla"
        >
          <TableChart fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ 
            p: 0.75,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.action.hover,
              color: theme.palette.text.primary,
            }
          }}
          onClick={attachFile}
          title="Adjuntar archivo"
        >
          <AttachFile fontSize="small" />
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
          color: theme.palette.text.primary,
          backgroundColor: 'transparent',
          '&:empty:before': {
            content: `"${placeholder}"`,
            color: theme.palette.text.disabled,
          },
          '&:focus': {
            outline: 'none',
          },
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.2)' 
              : 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.3)' 
                : 'rgba(0,0,0,0.3)',
            },
            transition: 'background-color 0.2s ease',
          },
        }}
      />

      {/* Popup flotante para insertar enlace (estilo Gmail) */}
      {linkDialogOpen && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
            }}
            onClick={handleCloseLinkDialog}
          />
          {/* Popup flotante */}
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1301,
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : 'white',
              borderRadius: '8px',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 24px rgba(0,0,0,0.6)' 
                : '0 8px 24px rgba(0,0,0,0.2)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0'}`,
              minWidth: '400px',
              maxWidth: '500px',
              p: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Campo de texto */}
              <TextField
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Texto"
                fullWidth
                variant="outlined"
                size="small"
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#bdbdbd',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '2px',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                      <FormatBold fontSize="small" />
                    </Box>
                  ),
                }}
              />
              {/* Campo de URL */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Escribe o pega un vínculo"
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#bdbdbd',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '2px',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                        <LinkIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                />
                {/* Botón Aplicar */}
                <Button
                  onClick={handleApplyLink}
                  variant="contained"
                  disabled={!linkUrl.trim()}
                  sx={{
                    textTransform: 'none',
                    minWidth: '80px',
                    height: '40px',
                    backgroundColor: linkUrl.trim() ? theme.palette.primary.main : theme.palette.action.disabledBackground,
                    color: linkUrl.trim() ? 'white' : theme.palette.action.disabled,
                    '&:hover': {
                      backgroundColor: linkUrl.trim() ? theme.palette.primary.dark : theme.palette.action.disabledBackground,
                    },
                    '&:disabled': {
                      backgroundColor: theme.palette.action.disabledBackground,
                      color: theme.palette.action.disabled,
                    },
                  }}
                >
                  Aplicar
                </Button>
              </Box>
              {/* Checkbox para abrir en nueva pestaña */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={openInNewTab}
                    onChange={(e) => setOpenInNewTab(e.target.checked)}
                    size="small"
                    sx={{
                      color: theme.palette.primary.main,
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                }
                label={
                  <Box component="span" sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                    Abrir en una nueva pestaña
                  </Box>
                }
                sx={{ mt: -0.5 }}
              />
            </Box>
          </Box>
        </>
      )}

      {/* Input oculto para seleccionar archivos de imagen */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileSelect}
      />
      {/* Input oculto para adjuntar archivos */}
      <input
        ref={attachFileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleAttachFileSelect}
      />

      {/* Dialog para insertar tabla */}
      <Dialog
        open={tableDialogOpen}
        onClose={handleCloseTableDialog}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 1700 }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1.5,
          fontSize: '1.125rem',
          fontWeight: 600,
        }}>
          Insertar tabla
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Número de filas"
              type="number"
              value={tableRows}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseInt(value) > 0 && parseInt(value) <= 50)) {
                  setTableRows(value);
                }
              }}
              inputProps={{ min: 1, max: 50 }}
              fullWidth
              variant="outlined"
              size="small"
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                },
              }}
            />
            <TextField
              label="Número de columnas"
              type="number"
              value={tableCols}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseInt(value) > 0 && parseInt(value) <= 50)) {
                  setTableCols(value);
                }
              }}
              inputProps={{ min: 1, max: 50 }}
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button
            onClick={handleCloseTableDialog}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleInsertTable}
            variant="contained"
            disabled={!tableRows || !tableCols || parseInt(tableRows) <= 0 || parseInt(tableCols) <= 0}
            sx={pageStyles.saveButton}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RichTextEditor;

