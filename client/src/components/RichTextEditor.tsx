import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  useTheme,
  alpha,
  Typography,
  Popover,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Chip,
  Menu,
  MenuList,
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
  FormatColorText,
  FormatSize,
  Undo,
  Redo,
  Code,
  FormatQuote,
  Preview,
  Edit,
  Download,
  Palette,
  Search,
  FindReplace,
  List as ListIcon,
  Toc,
  EmojiEmotions,
  VideoLibrary,
  InsertDriveFile,
  AddCircle,
  RemoveCircle,
  DeleteOutline,
  Add,
  Remove,
  TextFields,
  Functions,
  Image,
  InsertPhoto,
  Save,
  CheckCircle,
  CloudDone,
  CloudOff,
  MoreVert,
  AddBox,
  IndeterminateCheckBox,
  Palette as PaletteIcon,
  AccessTime,
  TrendingUp,
  Info,
  Keyboard,
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  Print,
} from '@mui/icons-material';

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
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0 });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [fontSizePickerOpen, setFontSizePickerOpen] = useState(false);
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);
  const [fontSizeAnchorEl, setFontSizeAnchorEl] = useState<HTMLElement | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [customColorPickerOpen, setCustomColorPickerOpen] = useState(false);
  const [customColorAnchorEl, setCustomColorAnchorEl] = useState<HTMLElement | null>(null);
  const [customColor, setCustomColor] = useState('#000000');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [searchReplaceOpen, setSearchReplaceOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [headings, setHeadings] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [headingsMenuOpen, setHeadingsMenuOpen] = useState(false);
  const [headingsMenuAnchorEl, setHeadingsMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] = useState<HTMLElement | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [templatesMenuOpen, setTemplatesMenuOpen] = useState(false);
  const [templatesMenuAnchorEl, setTemplatesMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [markdownMode, setMarkdownMode] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selectedTable, setSelectedTable] = useState<HTMLTableElement | null>(null);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [tableMenuAnchorEl, setTableMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [floatingToolbarVisible, setFloatingToolbarVisible] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ top: 0, left: 0 });
  const floatingToolbarRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [documentStats, setDocumentStats] = useState({
    readingTime: 0,
    readabilityLevel: '',
    paragraphs: 0,
    sentences: 0,
  });
  const [statsMenuOpen, setStatsMenuOpen] = useState(false);
  const [statsMenuAnchorEl, setStatsMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  // Inicializar historial
  useEffect(() => {
    if (value && historyRef.current.length === 0) {
      historyRef.current = [value];
      historyIndexRef.current = 0;
    }
  }, []);

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

  // Contador de palabras y caracteres
  const updateWordCount = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const words = text.trim() ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
      const characters = text.length;
      setWordCount({ words, characters });
    }
  }, []);

  useEffect(() => {
    updateWordCount();
  }, [value, updateWordCount]);

  // Sistema de historial (Undo/Redo)
  const saveToHistory = useCallback((content: string) => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    historyRef.current.push(content);
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current = historyRef.current.length - 1;
    }
  }, []);

  // Manejar input del editor
  const handleInput = useCallback(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      // Marcar que el usuario está escribiendo
      isUserTypingRef.current = true;
      
      // Actualizar contador de palabras inmediatamente
      updateWordCount();
      
      // Limpiar timeout anterior
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Actualizar después de un pequeño delay (solo para el callback, el editor se actualiza inmediatamente)
      debounceTimeoutRef.current = setTimeout(() => {
        if (editorRef.current) {
          const content = editorRef.current.innerHTML;
          onChange(content);
          saveToHistory(content);
          // Permitir actualizaciones externas después de que el usuario termine de escribir
          setTimeout(() => {
            isUserTypingRef.current = false;
          }, 200);
        }
      }, 150); // 150ms de delay para que sea fluido pero no excesivo
    }
  }, [onChange, updateWordCount, saveToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousContent = historyRef.current[historyIndexRef.current];
      if (editorRef.current && previousContent !== undefined) {
        isUpdatingRef.current = true;
        editorRef.current.innerHTML = previousContent;
        onChange(previousContent);
        requestAnimationFrame(() => {
          isUpdatingRef.current = false;
          updateWordCount();
        });
      }
    }
  }, [onChange, updateWordCount]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextContent = historyRef.current[historyIndexRef.current];
      if (editorRef.current && nextContent !== undefined) {
        isUpdatingRef.current = true;
        editorRef.current.innerHTML = nextContent;
        onChange(nextContent);
        requestAnimationFrame(() => {
          isUpdatingRef.current = false;
          updateWordCount();
        });
      }
    }
  }, [onChange, updateWordCount]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editorRef.current?.contains(document.activeElement) && document.activeElement !== editorRef.current) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            execCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            execCommand('underline');
            break;
          case 'k':
            e.preventDefault();
            handleOpenLinkDialog();
            break;
          case 'f':
            e.preventDefault();
            setSearchReplaceOpen(true);
            break;
          case 'p':
            e.preventDefault();
            handlePrint();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            if (!isMac) {
              e.preventDefault();
              handleRedo();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [execCommand, handleOpenLinkDialog, handleUndo, handleRedo]);

  // Guardar en historial cuando cambia el contenido
  useEffect(() => {
    if (editorRef.current && value && !isUpdatingRef.current && !isUserTypingRef.current) {
      saveToHistory(value);
    }
  }, [value, saveToHistory]);

  // Atajos de teclado adicionales (F11, etc.)
  useEffect(() => {
    const handleSpecialKeys = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleSpecialKeys);
    return () => {
      document.removeEventListener('keydown', handleSpecialKeys);
    };
  }, [fullscreenMode]);

  // Selector de color de texto
  const handleColorSelect = (color: string) => {
    execCommand('foreColor', color);
    setColorPickerOpen(false);
    setColorAnchorEl(null);
  };

  // Selector de tamaño de fuente
  const handleFontSizeSelect = (size: string) => {
    execCommand('fontSize', size);
    setFontSizePickerOpen(false);
    setFontSizeAnchorEl(null);
  };

  // Colores predefinidos
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF',
    '#FFFFFF', '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8',
    '#0000FF', '#9900FF', '#FF00FF', '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3',
    '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC', '#EA9999', '#F9CB9C', '#FFE599',
    '#B6D7A8', '#A2C4C9', '#A4C2F4', '#B4A7D6', '#D5A6BD', '#DD7E6B', '#F6B26B', '#FFD966',
    '#93C47D', '#76A5AF', '#6D9EEB', '#8E7CC3', '#C27BA0', '#CC4125', '#E69138', '#F1C232',
    '#6AA84F', '#45818E', '#3C78D8', '#674EA7', '#A64D79', '#990000', '#B45F06', '#BF9000',
    '#38761D', '#134F5C', '#1155CC', '#351C75', '#741B47', '#20124D', '#783F04', '#7F6000',
    '#274E13', '#0C343D', '#1C4587', '#4C1130'
  ];

  const fontSizes = [
    { label: 'Muy pequeño', value: '1' },
    { label: 'Pequeño', value: '2' },
    { label: 'Normal', value: '3' },
    { label: 'Mediano', value: '4' },
    { label: 'Grande', value: '5' },
    { label: 'Muy grande', value: '6' },
    { label: 'Enorme', value: '7' },
  ];

  // Toggle modo de vista previa
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  // Exportar a texto plano
  const handleExportToText = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Exportar a HTML
  const handleExportToHTML = () => {
    const blob = new Blob([value], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documento-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Manejar selector de color personalizado
  const handleCustomColorSelect = () => {
    execCommand('foreColor', customColor);
    setCustomColorPickerOpen(false);
    setCustomColorAnchorEl(null);
  };

  // Detectar encabezados en el contenido
  const detectHeadings = useCallback(() => {
    if (editorRef.current) {
      const headingElements = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const detectedHeadings: Array<{ id: string; text: string; level: number }> = [];
      
      headingElements.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        const level = parseInt(heading.tagName.charAt(1));
        detectedHeadings.push({
          id,
          text: heading.textContent || '',
          level,
        });
      });
      
      setHeadings(detectedHeadings);
    }
  }, []);

  useEffect(() => {
    if (!previewMode) {
      detectHeadings();
    }
  }, [value, previewMode, detectHeadings]);

  // Navegar a un encabezado
  const scrollToHeading = (id: string) => {
    const element = editorRef.current?.querySelector(`#${id}`) as HTMLElement;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Resaltar temporalmente
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = alpha(theme.palette.primary.main, 0.2).toString();
      setTimeout(() => {
        element.style.backgroundColor = originalBg;
      }, 2000);
    }
    setHeadingsMenuOpen(false);
    setHeadingsMenuAnchorEl(null);
  };

  // Búsqueda y reemplazo
  const performSearch = () => {
    if (!editorRef.current || !searchText.trim()) {
      setSearchResults([]);
      return;
    }

    const text = editorRef.current.innerText || '';
    const searchTerm = searchText.trim();
    const results: number[] = [];
    let index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    
    while (index !== -1) {
      results.push(index);
      index = text.toLowerCase().indexOf(searchTerm.toLowerCase(), index + 1);
    }
    
    setSearchResults(results);
    setCurrentSearchIndex(0);
    
    if (results.length > 0) {
      highlightSearchResult(results[0], searchTerm);
    }
  };

  const highlightSearchResult = (position: number, term: string) => {
    if (!editorRef.current) return;
    
    const text = editorRef.current.innerText || '';
    const range = document.createRange();
    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentPos = 0;
    let startNode: Node | null = null;
    let startOffset = 0;
    
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeText = node.textContent || '';
      const nodeLength = nodeText.length;
      
      if (currentPos + nodeLength > position) {
        startNode = node;
        startOffset = position - currentPos;
        break;
      }
      
      currentPos += nodeLength;
    }
    
    if (startNode && startNode.textContent) {
      range.setStart(startNode, startOffset);
      range.setEnd(startNode, Math.min(startOffset + term.length, startNode.textContent.length));
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        editorRef.current.focus();
      }
    }
  };

  const navigateSearchResults = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex = direction === 'next' 
      ? (currentSearchIndex + 1) % searchResults.length
      : (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    
    setCurrentSearchIndex(newIndex);
    highlightSearchResult(searchResults[newIndex], searchText.trim());
  };

  const performReplace = () => {
    if (!editorRef.current || !searchText.trim()) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText.toLowerCase() === searchText.trim().toLowerCase()) {
        range.deleteContents();
        range.insertNode(document.createTextNode(replaceText));
        onChange(editorRef.current.innerHTML);
        performSearch();
      }
    }
  };

  const performReplaceAll = () => {
    if (!editorRef.current || !searchText.trim()) return;
    
    const content = editorRef.current.innerHTML;
    const regex = new RegExp(searchText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = content.replace(regex, replaceText);
    
    if (newContent !== content) {
      editorRef.current.innerHTML = newContent;
      onChange(newContent);
      setSearchResults([]);
      setSearchText('');
      setReplaceText('');
    }
  };

  // Emojis populares
  const popularEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖',
    '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
    '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
    '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦',
    '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
    '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿',
    '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖',
    '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘',
    '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚',
    '🖐', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
    '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
    '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
    '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
    '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
    '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
    '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❓', '❕',
    '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️',
    '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠',
    'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂',
    '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶',
    '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒',
    '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣',
    '8️⃣', '9️⃣', '🔟', '🔢', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭',
    '⏮', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️',
    '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️',
    '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕',
    '➖', '➗', '✖️', '♾', '💲', '💱', '™️', '©️', '®️', '〰️',
    '➰', '➿', '🔚', '🔙', '🔛', '🔜', '🔝', '✔️', '☑️', '🔘',
    '⚪', '⚫', '🔴', '🔵', '🟠', '🟡', '🟢', '🟣', '🟤', '⬛',
    '⬜', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '🔶', '🔷',
    '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '▪️', '▫️',
    '◾', '◽', '◼️', '◻️', '🟦', '🟥', '🟧', '🟨', '🟩', '🟪',
  ];

  // Insertar emoji
  const handleEmojiSelect = (emoji: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        onChange(editorRef.current.innerHTML);
        updateWordCount();
      } else {
        document.execCommand('insertText', false, emoji);
        onChange(editorRef.current.innerHTML);
        updateWordCount();
      }
    }
    setEmojiPickerOpen(false);
    setEmojiPickerAnchorEl(null);
  };

  // Insertar video embebido
  const handleInsertVideo = () => {
    if (!videoUrl.trim() || !editorRef.current) return;

    let embedUrl = '';
    const url = videoUrl.trim();

    // Detectar YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Detectar Vimeo
    const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    if (embedUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.width = '100%';
      iframe.height = '400';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.style.margin = '16px 0';
      iframe.allowFullscreen = true;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');

      const selection = window.getSelection();
      let range: Range | null = null;

      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else if (editorRef.current) {
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }

      if (range) {
        range.insertNode(iframe);
        range.setStartAfter(iframe);
        range.collapse(true);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        onChange(editorRef.current.innerHTML);
      }
    }

    setVideoDialogOpen(false);
    setVideoUrl('');
  };

  // Plantillas predefinidas
  const templates = [
    {
      name: 'Email formal',
      content: '<p>Estimado/a [Nombre],</p><p>Espero que este mensaje le encuentre bien.</p><p>[Contenido del mensaje]</p><p>Quedo a su disposición para cualquier consulta.</p><p>Atentamente,<br/>[Su nombre]</p>',
    },
    {
      name: 'Informe',
      content: '<h1>Informe</h1><h2>Resumen Ejecutivo</h2><p>[Resumen del informe]</p><h2>Introducción</h2><p>[Introducción]</p><h2>Desarrollo</h2><p>[Contenido principal]</p><h2>Conclusiones</h2><p>[Conclusiones]</p>',
    },
    {
      name: 'Carta',
      content: '<p>[Fecha]</p><p>[Destinatario]<br/>[Dirección]</p><p>Estimado/a [Nombre],</p><p>[Cuerpo de la carta]</p><p>Saludos cordiales,<br/>[Su nombre]</p>',
    },
    {
      name: 'Lista de tareas',
      content: '<h2>Lista de Tareas</h2><ul><li>[ ] Tarea 1</li><li>[ ] Tarea 2</li><li>[ ] Tarea 3</li></ul>',
    },
    {
      name: 'Notas de reunión',
      content: '<h2>Notas de Reunión</h2><p><strong>Fecha:</strong> [Fecha]</p><p><strong>Asistentes:</strong> [Lista de asistentes]</p><h3>Puntos tratados:</h3><ul><li>Punto 1</li><li>Punto 2</li></ul><h3>Acciones:</h3><ul><li>Acción 1</li><li>Acción 2</li></ul>',
    },
  ];

  const handleTemplateSelect = (template: typeof templates[0]) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = template.content;
      onChange(template.content);
      updateWordCount();
    }
    setTemplatesMenuOpen(false);
    setTemplatesMenuAnchorEl(null);
  };

  // Conversión básica de Markdown a HTML
  const markdownToHTML = (markdown: string): string => {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li>.*<\/li>\n?)+/gim, (match) => {
      if (match.includes('<li>')) {
        return '<ul>' + match + '</ul>';
      }
      return match;
    });
    
    // Line breaks
    html = html.replace(/\n\n/gim, '</p><p>');
    html = html.replace(/\n/gim, '<br/>');
    
    // Wrap in paragraphs
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><(h[1-6]|ul|ol|blockquote|pre)/gim, '<$1');
    html = html.replace(/<\/(h[1-6]|ul|ol|blockquote|pre)><p>/gim, '</$1>');
    html = html.replace(/<p><\/p>/gim, '');
    
    return html;
  };

  // Conversión básica de HTML a Markdown
  const htmlToMarkdown = (html: string): string => {
    let markdown = html;
    
    // Headers
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/gim, '# $1\n\n');
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/gim, '## $1\n\n');
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/gim, '### $1\n\n');
    
    // Bold
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/gim, '**$1**');
    markdown = markdown.replace(/<b>(.*?)<\/b>/gim, '**$1**');
    
    // Italic
    markdown = markdown.replace(/<em>(.*?)<\/em>/gim, '*$1*');
    markdown = markdown.replace(/<i>(.*?)<\/i>/gim, '*$1*');
    
    // Links
    markdown = markdown.replace(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/gim, '[$2]($1)');
    
    // Images
    markdown = markdown.replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gim, '![$2]($1)');
    
    // Code blocks
    markdown = markdown.replace(/<pre><code>(.*?)<\/code><\/pre>/gim, '```\n$1\n```');
    markdown = markdown.replace(/<code>(.*?)<\/code>/gim, '`$1`');
    
    // Blockquotes
    markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/gim, '> $1\n');
    
    // Lists
    markdown = markdown.replace(/<ul[^>]*>/gim, '');
    markdown = markdown.replace(/<\/ul>/gim, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gim, '');
    markdown = markdown.replace(/<\/ol>/gim, '\n');
    markdown = markdown.replace(/<li>(.*?)<\/li>/gim, '- $1\n');
    
    // Paragraphs
    markdown = markdown.replace(/<p>(.*?)<\/p>/gim, '$1\n\n');
    markdown = markdown.replace(/<br\s*\/?>/gim, '\n');
    
    // Clean up
    markdown = markdown.replace(/\n{3,}/gim, '\n\n');
    markdown = markdown.trim();
    
    return markdown;
  };

  // Toggle modo Markdown
  const toggleMarkdownMode = () => {
    if (!markdownMode) {
      // Convertir HTML a Markdown
      if (editorRef.current) {
        const markdown = htmlToMarkdown(editorRef.current.innerHTML);
        editorRef.current.innerText = markdown;
        onChange(markdown);
      }
    } else {
      // Convertir Markdown a HTML
      if (editorRef.current) {
        const html = markdownToHTML(editorRef.current.innerText);
        editorRef.current.innerHTML = html;
        onChange(html);
      }
    }
    setMarkdownMode(!markdownMode);
  };

  // Insertar imagen desde URL
  const handleInsertImage = () => {
    if (!imageUrl.trim() || !editorRef.current) return;

    const img = document.createElement('img');
    img.src = imageUrl.trim();
    img.alt = imageAlt.trim() || 'Imagen';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '8px';
    img.style.margin = '8px 0';

    const selection = window.getSelection();
    let range: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else if (editorRef.current) {
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    }

    if (range) {
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      onChange(editorRef.current.innerHTML);
      updateWordCount();
    }

    setImageDialogOpen(false);
    setImageUrl('');
    setImageAlt('');
  };

  // Detectar tabla seleccionada
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;
        const table = (commonAncestor.nodeType === Node.ELEMENT_NODE 
          ? commonAncestor as HTMLElement 
          : commonAncestor.parentElement)?.closest('table') as HTMLTableElement | null;
        setSelectedTable(table);
      } else {
        setSelectedTable(null);
        setTableMenuOpen(false);
      }
    };

    const handleTableClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cell = target.closest('td, th');
      if (cell && cell instanceof HTMLElement) {
        const table = cell.closest('table');
        if (table) {
          setSelectedTable(table as HTMLTableElement);
          setTableMenuAnchorEl(cell);
          setTableMenuOpen(true);
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    editorRef.current?.addEventListener('click', handleTableClick);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      editorRef.current?.removeEventListener('click', handleTableClick);
    };
  }, []);

  // Autoguardado automático
  useEffect(() => {
    if (value && !isUpdatingRef.current && !isUserTypingRef.current) {
      setAutoSaveStatus('saving');
      
      const saveTimeout = setTimeout(() => {
        // Simular guardado (en producción, aquí iría la llamada al servidor)
        setAutoSaveStatus('saved');
      }, 500);

      return () => clearTimeout(saveTimeout);
    } else if (!value) {
      setAutoSaveStatus('saved');
    }
  }, [value]);

  // Barra de herramientas flotante (estilo Medium)
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current?.getBoundingClientRect();
        
        if (editorRect && rect.top >= editorRect.top && rect.bottom <= editorRect.bottom) {
          setSelectedText(selection.toString());
          setFloatingToolbarPosition({
            top: rect.top - 60,
            left: rect.left + (rect.width / 2) - 100,
          });
          setFloatingToolbarVisible(true);
        } else {
          setFloatingToolbarVisible(false);
        }
      } else {
        setFloatingToolbarVisible(false);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    editorRef.current?.addEventListener('mouseup', handleSelection);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      editorRef.current?.removeEventListener('mouseup', handleSelection);
    };
  }, []);

  // Funciones para edición de tablas
  const insertTableRow = (position: 'above' | 'below') => {
    if (!selectedTable) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const cell = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement).closest('td, th')
        : (range.commonAncestorContainer.parentElement as HTMLElement)?.closest('td, th');
      
      if (cell) {
        const row = cell.closest('tr');
        if (row) {
          const newRow = row.cloneNode(true) as HTMLTableRowElement;
          const cells = newRow.querySelectorAll('td, th');
          cells.forEach(cell => {
            (cell as HTMLElement).innerHTML = '&nbsp;';
          });
          
          if (position === 'above') {
            row.parentNode?.insertBefore(newRow, row);
          } else {
            row.parentNode?.insertBefore(newRow, row.nextSibling);
          }
          
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            updateWordCount();
          }
        }
      }
    }
  };

  const deleteTableRow = () => {
    if (!selectedTable) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const cell = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement).closest('td, th')
        : (range.commonAncestorContainer.parentElement as HTMLElement)?.closest('td, th');
      
      if (cell) {
        const row = cell.closest('tr');
        if (row && selectedTable.querySelectorAll('tr').length > 1) {
          row.remove();
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            updateWordCount();
          }
        }
      }
    }
  };

  const insertTableColumn = (position: 'left' | 'right') => {
    if (!selectedTable) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const cell = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement).closest('td, th')
        : (range.commonAncestorContainer.parentElement as HTMLElement)?.closest('td, th');
      
      if (cell) {
        const cellIndex = Array.from(cell.parentElement?.children || []).indexOf(cell);
        const rows = selectedTable.querySelectorAll('tr');
        
        rows.forEach(row => {
          const newCell = document.createElement(cell.tagName.toLowerCase() === 'th' ? 'th' : 'td');
          newCell.innerHTML = '&nbsp;';
          newCell.style.border = `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#ccc'}`;
          newCell.style.padding = '8px';
          newCell.style.minWidth = '50px';
          
          const cells = row.querySelectorAll('td, th');
          if (position === 'left') {
            row.insertBefore(newCell, cells[cellIndex]);
          } else {
            row.insertBefore(newCell, cells[cellIndex + 1] || null);
          }
        });
        
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
          updateWordCount();
        }
      }
    }
  };

  const deleteTableColumn = () => {
    if (!selectedTable) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const cell = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement).closest('td, th')
        : (range.commonAncestorContainer.parentElement as HTMLElement)?.closest('td, th');
      
      if (cell) {
        const cellIndex = Array.from(cell.parentElement?.children || []).indexOf(cell);
        const rows = selectedTable.querySelectorAll('tr');
        
        if (rows[0] && rows[0].querySelectorAll('td, th').length > 1) {
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells[cellIndex]) {
              cells[cellIndex].remove();
            }
          });
          
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            updateWordCount();
          }
        }
      }
    }
  };

  // Calcular estadísticas del documento
  const calculateDocumentStats = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const html = editorRef.current.innerHTML || '';
      
      // Tiempo de lectura (promedio 200 palabras por minuto)
      const readingTime = Math.ceil(wordCount.words / 200);
      
      // Número de párrafos
      const paragraphs = html.match(/<p[^>]*>/gi)?.length || 0;
      
      // Número de oraciones (aproximado)
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      
      // Nivel de legibilidad básico (Flesch Reading Ease simplificado)
      const avgWordsPerSentence = sentences > 0 ? wordCount.words / sentences : 0;
      const avgCharsPerWord = wordCount.words > 0 ? wordCount.characters / wordCount.words : 0;
      
      let readabilityLevel = 'Fácil';
      if (avgWordsPerSentence > 20 || avgCharsPerWord > 5) {
        readabilityLevel = 'Difícil';
      } else if (avgWordsPerSentence > 15 || avgCharsPerWord > 4.5) {
        readabilityLevel = 'Moderado';
      }
      
      setDocumentStats({
        readingTime,
        readabilityLevel,
        paragraphs,
        sentences,
      });
    }
  }, [wordCount]);

  useEffect(() => {
    calculateDocumentStats();
  }, [value, calculateDocumentStats]);

  // Toggle pantalla completa
  const toggleFullscreen = () => {
    if (!fullscreenMode) {
      if (editorRef.current?.requestFullscreen) {
        editorRef.current.requestFullscreen();
      } else if ((editorRef.current as any)?.webkitRequestFullscreen) {
        (editorRef.current as any).webkitRequestFullscreen();
      } else if ((editorRef.current as any)?.msRequestFullscreen) {
        (editorRef.current as any).msRequestFullscreen();
      }
      setFullscreenMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setFullscreenMode(false);
    }
  };

  // Manejar cambios de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenMode(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Ajustar zoom
  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      setZoomLevel(prev => Math.min(prev + 10, 200));
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      setZoomLevel(prev => Math.max(prev - 10, 50));
    }
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Imprimir documento
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Imprimir documento</title>
            <style>
              body {
                font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin: 16px 0;
              }
              table td, table th {
                border: 1px solid #ccc;
                padding: 8px;
              }
              blockquote {
                border-left: 4px solid #1976d2;
                padding-left: 16px;
                margin: 16px 0;
                font-style: italic;
              }
              code {
                background-color: #f5f5f5;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: monospace;
              }
              @media print {
                body {
                  padding: 20px;
                }
              }
            </style>
          </head>
          <body>
            ${value || '<p>Documento vacío</p>'}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Atajos de teclado disponibles
  const keyboardShortcuts = [
    { key: 'Ctrl+B / Cmd+B', description: 'Negrita' },
    { key: 'Ctrl+I / Cmd+I', description: 'Cursiva' },
    { key: 'Ctrl+U / Cmd+U', description: 'Subrayado' },
    { key: 'Ctrl+K / Cmd+K', description: 'Insertar enlace' },
    { key: 'Ctrl+F / Cmd+F', description: 'Búsqueda y reemplazo' },
    { key: 'Ctrl+Z / Cmd+Z', description: 'Deshacer' },
    { key: 'Ctrl+Y / Ctrl+Shift+Z', description: 'Rehacer' },
    { key: 'Ctrl+P / Cmd+P', description: 'Imprimir' },
    { key: 'F11', description: 'Pantalla completa' },
  ];

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
          : '0 2px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 6px 30px rgba(0, 0, 0, 0.4)' 
            : '0 4px 20px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      {/* Barra de herramientas */}
      <Box
        ref={toolbarRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          flexWrap: 'wrap',
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha('#374151', 0.95)} 0%, ${alpha('#2a2a2a', 0.95)} 100%)`
            : `linear-gradient(135deg, ${alpha('#fafafa', 0.95)} 0%, ${alpha('#f5f5f5', 0.95)} 100%)`,
          backdropFilter: 'blur(10px)',
          position: 'relative',
          gap: 0.5,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`,
          }
        }}
      >
        <Tooltip title="Negrita (Ctrl+B)">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: activeFormats.bold ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: activeFormats.bold 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: activeFormats.bold 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.5),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('bold')}
          >
            <FormatBold fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cursiva (Ctrl+I)">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: activeFormats.italic ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: activeFormats.italic 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: activeFormats.italic 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.5),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('italic')}
          >
            <FormatItalic fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Subrayado (Ctrl+U)">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: activeFormats.underline ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: activeFormats.underline 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: activeFormats.underline 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.5),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('underline')}
          >
            <FormatUnderlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tachado">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: activeFormats.strikeThrough ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: activeFormats.strikeThrough 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: activeFormats.strikeThrough 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.5),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('strikeThrough')}
          >
            <FormatStrikethrough fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Alinear izquierda">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('justifyLeft')}
          >
            <FormatAlignLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Alinear centro">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('justifyCenter')}
          >
            <FormatAlignCenter fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Alinear derecha">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('justifyRight')}
          >
            <FormatAlignRight fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Justificar">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('justifyFull')}
          >
            <FormatAlignJustify fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title="Deshacer (Ctrl+Z)">
          <IconButton
            size="small"
            onClick={handleUndo}
            disabled={historyIndexRef.current <= 0}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&:disabled': {
                opacity: 0.3,
              }
            }}
          >
            <Undo fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Rehacer (Ctrl+Y)">
          <IconButton
            size="small"
            onClick={handleRedo}
            disabled={historyIndexRef.current >= historyRef.current.length - 1}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&:disabled': {
                opacity: 0.3,
              }
            }}
          >
            <Redo fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title="Color de texto">
          <IconButton
            size="small"
            onClick={(e) => {
              setColorAnchorEl(e.currentTarget);
              setColorPickerOpen(true);
            }}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <FormatColorText fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tamaño de fuente">
          <IconButton
            size="small"
            onClick={(e) => {
              setFontSizeAnchorEl(e.currentTarget);
              setFontSizePickerOpen(true);
            }}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <FormatSize fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Código">
          <IconButton
            size="small"
            onClick={() => execCommand('formatBlock', '<code>')}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <Code fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cita">
          <IconButton
            size="small"
            onClick={() => execCommand('formatBlock', '<blockquote>')}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <FormatQuote fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title="Lista con viñetas">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: activeFormats.unorderedList ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: activeFormats.unorderedList 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: activeFormats.unorderedList 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.5),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('insertUnorderedList')}
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Lista numerada">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: activeFormats.orderedList ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: activeFormats.orderedList 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: activeFormats.orderedList 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.5),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={() => execCommand('insertOrderedList')}
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title="Insertar enlace (Ctrl+K)">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: linkDialogOpen ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: linkDialogOpen 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: linkDialogOpen 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.5),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={handleOpenLinkDialog}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insertar tabla">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={insertTable}
          >
            <TableChart fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Adjuntar archivo">
          <IconButton
            size="small"
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
            onClick={attachFile}
          >
            <AttachFile fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title={previewMode ? "Modo edición" : "Vista previa"}>
          <IconButton
            size="small"
            onClick={togglePreviewMode}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: previewMode ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: previewMode 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: previewMode 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            {previewMode ? <Edit fontSize="small" /> : <Preview fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Exportar">
          <IconButton
            size="small"
            onClick={(e) => {
              setExportMenuAnchorEl(e.currentTarget);
              setExportMenuOpen(true);
            }}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title="Búsqueda y reemplazo (Ctrl+F)">
          <IconButton
            size="small"
            onClick={() => setSearchReplaceOpen(true)}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: searchReplaceOpen ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: searchReplaceOpen 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: searchReplaceOpen 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <FindReplace fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Navegación por encabezados">
          <IconButton
            size="small"
            onClick={(e) => {
              detectHeadings();
              setHeadingsMenuAnchorEl(e.currentTarget);
              setHeadingsMenuOpen(true);
            }}
            disabled={headings.length === 0}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: headings.length === 0 ? theme.palette.text.disabled : theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: headings.length === 0 ? 'transparent' : alpha(theme.palette.action.hover, 0.6),
                color: headings.length === 0 ? theme.palette.text.disabled : theme.palette.primary.main,
                transform: headings.length === 0 ? 'none' : 'scale(1.1)',
              },
              '&:active': {
                transform: headings.length === 0 ? 'none' : 'scale(0.95)',
              },
              '&:disabled': {
                opacity: 0.4,
              }
            }}
          >
            <Toc fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title="Insertar emoji">
          <IconButton
            size="small"
            onClick={(e) => {
              setEmojiPickerAnchorEl(e.currentTarget);
              setEmojiPickerOpen(true);
            }}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: emojiPickerOpen ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: emojiPickerOpen 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: emojiPickerOpen 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <EmojiEmotions fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insertar video">
          <IconButton
            size="small"
            onClick={() => setVideoDialogOpen(true)}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <VideoLibrary fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Plantillas">
          <IconButton
            size="small"
            onClick={(e) => {
              setTemplatesMenuAnchorEl(e.currentTarget);
              setTemplatesMenuOpen(true);
            }}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: templatesMenuOpen ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: templatesMenuOpen 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: templatesMenuOpen 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <InsertDriveFile fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title="Insertar imagen desde URL">
          <IconButton
            size="small"
            onClick={() => setImageDialogOpen(true)}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <InsertPhoto fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={markdownMode ? "Modo HTML" : "Modo Markdown"}>
          <IconButton
            size="small"
            onClick={toggleMarkdownMode}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: markdownMode ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: markdownMode 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: markdownMode 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <TextFields fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title="Estadísticas del documento">
          <IconButton
            size="small"
            onClick={(e) => {
              calculateDocumentStats();
              setStatsMenuAnchorEl(e.currentTarget);
              setStatsMenuOpen(true);
            }}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: statsMenuOpen ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: statsMenuOpen 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: statsMenuOpen 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <TrendingUp fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            mx: 0.75, 
            height: '24px', 
            alignSelf: 'center',
            borderColor: alpha(theme.palette.divider, 0.3),
            borderWidth: '1px'
          }} 
        />
        <Tooltip title="Acercar (Zoom in)">
          <IconButton
            size="small"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&:disabled': {
                opacity: 0.3,
              }
            }}
          >
            <ZoomIn fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={`Zoom: ${zoomLevel}%`}>
          <Chip
            label={`${zoomLevel}%`}
            size="small"
            onClick={handleZoomReset}
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              fontSize: '0.7rem',
              height: '24px',
              minWidth: '50px',
              cursor: 'pointer',
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.1),
              color: theme.palette.primary.main,
              fontWeight: 500,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.25 : 0.15),
              },
            }}
          />
        </Tooltip>
        <Tooltip title="Alejar (Zoom out)">
          <IconButton
            size="small"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&:disabled': {
                opacity: 0.3,
              }
            }}
          >
            <ZoomOut fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={fullscreenMode ? "Salir de pantalla completa (F11)" : "Pantalla completa (F11)"}>
          <IconButton
            size="small"
            onClick={toggleFullscreen}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: fullscreenMode ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: fullscreenMode 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: fullscreenMode 
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                  : alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            {fullscreenMode ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Imprimir (Ctrl+P)">
          <IconButton
            size="small"
            onClick={handlePrint}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <Print fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Atajos de teclado">
          <IconButton
            size="small"
            onClick={() => setKeyboardShortcutsOpen(true)}
            sx={{ 
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              p: 1,
              borderRadius: '8px',
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
                color: theme.palette.primary.main,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <Keyboard fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Área de edición o Vista previa */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {previewMode ? (
          <Box
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              flexGrow: 1,
              p: 4,
              minHeight: '300px',
              fontSize: `${0.95 * (zoomLevel / 100)}rem`,
              lineHeight: 1.7,
              overflowY: 'auto',
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha('#1a1a1a', 0.5)
                : alpha('#ffffff', 0.8),
              transition: 'all 0.3s ease',
              position: 'relative',
              '&::-webkit-scrollbar': {
                width: '10px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
                borderRadius: '5px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.divider, 0.5),
                borderRadius: '5px',
                border: `2px solid ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.divider, 0.7),
                },
                transition: 'background-color 0.2s ease',
              },
              '& p, & div, & span': {
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                letterSpacing: '0.01em',
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 600,
                letterSpacing: '-0.01em',
              },
              '& a': {
                color: theme.palette.primary.main,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                margin: '16px 0',
              },
              '& table td, & table th': {
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                padding: '8px',
              },
              '& blockquote': {
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                paddingLeft: '16px',
                margin: '16px 0',
                fontStyle: 'italic',
                color: theme.palette.text.secondary,
              },
              '& code': {
                backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              },
            }}
            dangerouslySetInnerHTML={{ __html: value || `<p style="color: ${alpha(theme.palette.text.disabled, 0.7)}">${placeholder}</p>` }}
          />
        ) : markdownMode ? (
          <Box
            component="textarea"
            value={htmlToMarkdown(value || '')}
            onChange={(e) => {
              const markdown = e.target.value;
              const html = markdownToHTML(markdown);
              onChange(html);
              updateWordCount();
            }}
            placeholder={placeholder}
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              flexGrow: 1,
              p: 3,
              minHeight: '300px',
              fontSize: `${0.95 * (zoomLevel / 100)}rem`,
              lineHeight: 1.7,
              outline: 'none',
              overflowY: 'auto',
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha('#1a1a1a', 0.5)
                : alpha('#ffffff', 0.8),
              border: 'none',
              resize: 'none',
              width: '100%',
              transition: 'all 0.3s ease',
              '&:focus': {
                outline: 'none',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha('#1a1a1a', 0.7)
                  : alpha('#ffffff', 0.95),
                boxShadow: `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
              '&::-webkit-scrollbar': {
                width: '10px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
                borderRadius: '5px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.divider, 0.5),
                borderRadius: '5px',
                border: `2px solid ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.divider, 0.7),
                },
                transition: 'background-color 0.2s ease',
              },
            }}
          />
        ) : (
          <Box
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            suppressContentEditableWarning
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              flexGrow: 1,
              p: 3,
              minHeight: '300px',
              fontSize: `${0.95 * (zoomLevel / 100)}rem`,
              lineHeight: 1.7,
              outline: 'none',
              overflowY: 'auto',
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha('#1a1a1a', 0.5)
                : alpha('#ffffff', 0.8),
              transition: 'all 0.3s ease',
              position: 'relative',
              '&:empty:before': {
                content: `"${placeholder}"`,
                color: alpha(theme.palette.text.disabled, 0.7),
                fontStyle: 'normal',
                fontWeight: 300,
              },
              '&:focus': {
                outline: 'none',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha('#1a1a1a', 0.7)
                  : alpha('#ffffff', 0.95),
                boxShadow: `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
              '&::-webkit-scrollbar': {
                width: '10px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
                borderRadius: '5px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.divider, 0.5),
                borderRadius: '5px',
                border: `2px solid ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.divider, 0.7),
                },
                transition: 'background-color 0.2s ease',
              },
              '& p, & div, & span': {
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                letterSpacing: '0.01em',
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 600,
                letterSpacing: '-0.01em',
              },
            }}
          />
        )}
      </Box>

      {/* Contador de palabras y caracteres */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha('#1a1a1a', 0.3)
            : alpha('#fafafa', 0.5),
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Indicador de autoguardado */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {autoSaveStatus === 'saved' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircle sx={{ fontSize: '1rem', color: theme.palette.success.main }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  fontSize: '0.75rem',
                  color: theme.palette.success.main,
                  fontWeight: 500,
                }}
              >
                Guardado
              </Typography>
            </Box>
          )}
          {autoSaveStatus === 'saving' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CloudDone 
                sx={{ 
                  fontSize: '1rem', 
                  color: theme.palette.warning.main,
                  '@keyframes pulse': {
                    '0%, 100%': {
                      opacity: 1,
                    },
                    '50%': {
                      opacity: 0.5,
                    },
                  },
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} 
              />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  fontSize: '0.75rem',
                  color: theme.palette.warning.main,
                  fontWeight: 500,
                }}
              >
                Guardando...
              </Typography>
            </Box>
          )}
          {autoSaveStatus === 'unsaved' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CloudOff sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  fontSize: '0.75rem',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                Sin guardar
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            label={`${wordCount.words} palabras`}
            size="small"
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              fontSize: '0.75rem',
              height: '24px',
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.1),
              color: theme.palette.primary.main,
              fontWeight: 500,
            }}
          />
          <Chip
            label={`${wordCount.characters} caracteres`}
            size="small"
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              fontSize: '0.75rem',
              height: '24px',
              backgroundColor: alpha(theme.palette.text.secondary, theme.palette.mode === 'dark' ? 0.15 : 0.1),
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          />
        </Box>
      </Box>

      {/* Popover para selector de color */}
      <Popover
        open={colorPickerOpen}
        anchorEl={colorAnchorEl}
        onClose={() => {
          setColorPickerOpen(false);
          setColorAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 2,
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px rgba(0,0,0,0.6)'
              : '0 10px 40px rgba(0,0,0,0.2)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            mb: 1,
            display: 'block',
            fontWeight: 600,
            color: theme.palette.text.secondary,
          }}
        >
          Color de texto
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 0.5,
            width: '280px',
          }}
        >
          {colors.map((color) => (
            <Box
              key={color}
              onClick={() => handleColorSelect(color)}
              sx={{
                width: '32px',
                height: '32px',
                backgroundColor: color,
                borderRadius: '6px',
                cursor: 'pointer',
                border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.15)',
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
              }}
            />
          ))}
        </Box>
        <Button
          onClick={(e) => {
            setColorPickerOpen(false);
            setColorAnchorEl(null);
            setCustomColorAnchorEl(e.currentTarget);
            setCustomColorPickerOpen(true);
          }}
          startIcon={<Palette fontSize="small" />}
          fullWidth
          sx={{
            mt: 1.5,
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            textTransform: 'none',
            borderRadius: '8px',
            border: `1px dashed ${alpha(theme.palette.primary.main, 0.5)}`,
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          Color personalizado
        </Button>
      </Popover>

      {/* Popover para selector de tamaño de fuente */}
      <Popover
        open={fontSizePickerOpen}
        anchorEl={fontSizeAnchorEl}
        onClose={() => {
          setFontSizePickerOpen(false);
          setFontSizeAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 1,
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px rgba(0,0,0,0.6)'
              : '0 10px 40px rgba(0,0,0,0.2)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            minWidth: '180px',
          }
        }}
      >
        {fontSizes.map((size) => (
          <MenuItem
            key={size.value}
            onClick={() => handleFontSizeSelect(size.value)}
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              fontSize: size.value === '1' ? '0.7rem' : 
                       size.value === '2' ? '0.85rem' :
                       size.value === '3' ? '1rem' :
                       size.value === '4' ? '1.2rem' :
                       size.value === '5' ? '1.5rem' :
                       size.value === '6' ? '2rem' : '2.5rem',
              py: 1,
              px: 2,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
              },
            }}
          >
            {size.label}
          </MenuItem>
        ))}
      </Popover>

      {/* Menú de exportación */}
      <Menu
        open={exportMenuOpen}
        anchorEl={exportMenuAnchorEl}
        onClose={() => {
          setExportMenuOpen(false);
          setExportMenuAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px rgba(0,0,0,0.6)'
              : '0 10px 40px rgba(0,0,0,0.2)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            minWidth: '180px',
            mt: 1,
          }
        }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              handleExportToText();
              setExportMenuOpen(false);
              setExportMenuAnchorEl(null);
            }}
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              py: 1.5,
              px: 2,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Download fontSize="small" />
              <Typography variant="body2">Exportar como texto</Typography>
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleExportToHTML();
              setExportMenuOpen(false);
              setExportMenuAnchorEl(null);
            }}
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              py: 1.5,
              px: 2,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Download fontSize="small" />
              <Typography variant="body2">Exportar como HTML</Typography>
            </Box>
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Popover para selector de color personalizado */}
      <Popover
        open={customColorPickerOpen}
        anchorEl={customColorAnchorEl}
        onClose={() => {
          setCustomColorPickerOpen(false);
          setCustomColorAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 2,
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px rgba(0,0,0,0.6)'
              : '0 10px 40px rgba(0,0,0,0.2)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            minWidth: '280px',
          }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            mb: 1.5,
            display: 'block',
            fontWeight: 600,
            color: theme.palette.text.secondary,
          }}
        >
          Color personalizado
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
          <Box
            component="input"
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            sx={{
              width: '60px',
              height: '40px',
              border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
            }}
          />
          <TextField
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#000000"
            size="small"
            sx={{
              flex: 1,
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              '& .MuiOutlinedInput-root': {
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                borderRadius: '8px',
              },
            }}
          />
        </Box>
        <Button
          onClick={handleCustomColorSelect}
          variant="contained"
          fullWidth
          sx={{
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            textTransform: 'none',
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            },
          }}
        >
          Aplicar color
        </Button>
      </Popover>

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
              backgroundColor: alpha('#000', 0.5),
              backdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.2s ease-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 }
              }
            }}
            onClick={handleCloseLinkDialog}
          />
          {/* Popup flotante */}
          <Box
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1301,
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${alpha('#2a2a2a', 0.98)} 0%, ${alpha('#1a1a1a', 0.98)} 100%)`
                : `linear-gradient(135deg, ${alpha('#ffffff', 0.98)} 0%, ${alpha('#fafafa', 0.98)} 100%)`,
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.4)' 
                : '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(0,0,0,0.1)',
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              minWidth: '420px',
              maxWidth: '520px',
              p: 3,
              animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes slideIn': {
                '0%': {
                  opacity: 0,
                  transform: 'translate(-50%, -60%) scale(0.9)'
                },
                '100%': {
                  opacity: 1,
                  transform: 'translate(-50%, -50%) scale(1)'
                }
              }
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
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  '& .MuiOutlinedInput-root': {
                    fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '& fieldset': {
                      borderColor: alpha(theme.palette.divider, 0.3),
                      borderWidth: '2px',
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.7),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.5),
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                      '& fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '2px',
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                    },
                  },
                  '& input': {
                    fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 400,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                      <FormatBold fontSize="small" />
                    </Box>
                  ),
                }}
              />
              {/* Campo de URL */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <TextField
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Escribe o pega un vínculo"
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{
                    fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    '& .MuiOutlinedInput-root': {
                      fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                      backgroundColor: alpha(theme.palette.background.paper, 0.5),
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.3),
                        borderWidth: '2px',
                      },
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.7),
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        '& fieldset': {
                          borderColor: alpha(theme.palette.divider, 0.5),
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                        '& fieldset': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: '2px',
                          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                        },
                      },
                    },
                    '& input': {
                      fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                      fontSize: '0.95rem',
                      fontWeight: 400,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
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
                    fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    textTransform: 'none',
                    minWidth: '100px',
                    height: '44px',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    background: linkUrl.trim() 
                      ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                      : alpha(theme.palette.action.disabledBackground, 0.5),
                    color: linkUrl.trim() ? 'white' : theme.palette.action.disabled,
                    boxShadow: linkUrl.trim() 
                      ? `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`
                      : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: linkUrl.trim() 
                        ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                        : alpha(theme.palette.action.disabledBackground, 0.5),
                      transform: linkUrl.trim() ? 'translateY(-2px) scale(1.02)' : 'none',
                      boxShadow: linkUrl.trim() 
                        ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`
                        : 'none',
                    },
                    '&:active': {
                      transform: linkUrl.trim() ? 'translateY(0) scale(0.98)' : 'none',
                    },
                    '&:disabled': {
                      backgroundColor: alpha(theme.palette.action.disabledBackground, 0.5),
                      color: theme.palette.action.disabled,
                      boxShadow: 'none',
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
                  <Box 
                    component="span" 
                    sx={{ 
                      fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                      fontSize: '0.85rem', 
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                      letterSpacing: '0.01em',
                    }}
                  >
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
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          pb: 1.5,
          fontSize: '1.25rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          Insertar tabla
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
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
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                '& .MuiInputLabel-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                },
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
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
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                '& .MuiInputLabel-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                },
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={handleCloseTableDialog}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleInsertTable}
            variant="contained"
            disabled={!tableRows || !tableCols || parseInt(tableRows) <= 0 || parseInt(tableCols) <= 0}
            sx={{
              textTransform: 'none',
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              '&:disabled': {
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para búsqueda y reemplazo */}
      <Dialog
        open={searchReplaceOpen}
        onClose={() => {
          setSearchReplaceOpen(false);
          setSearchText('');
          setReplaceText('');
          setSearchResults([]);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 20px 60px rgba(0,0,0,0.8)'
              : '0 20px 60px rgba(0,0,0,0.3)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          pb: 1.5,
          fontSize: '1.25rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          Búsqueda y reemplazo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Buscar"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                if (e.target.value.trim()) {
                  setTimeout(() => performSearch(), 300);
                } else {
                  setSearchResults([]);
                }
              }}
              fullWidth
              variant="outlined"
              size="small"
              autoFocus
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                    <Search fontSize="small" />
                  </Box>
                ),
              }}
              sx={{
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                '& .MuiInputLabel-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                },
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
            />
            {searchResults.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                <Typography variant="caption" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>
                  {currentSearchIndex + 1} de {searchResults.length}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton
                  size="small"
                  onClick={() => navigateSearchResults('prev')}
                  sx={{ p: 0.5 }}
                >
                  <Box component="span" sx={{ transform: 'rotate(90deg)', display: 'inline-block' }}>▲</Box>
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => navigateSearchResults('next')}
                  sx={{ p: 0.5 }}
                >
                  <Box component="span" sx={{ transform: 'rotate(90deg)', display: 'inline-block' }}>▼</Box>
                </IconButton>
              </Box>
            )}
            <TextField
              label="Reemplazar con"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                    <FindReplace fontSize="small" />
                  </Box>
                ),
              }}
              sx={{
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                '& .MuiInputLabel-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                },
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={() => {
              setSearchReplaceOpen(false);
              setSearchText('');
              setReplaceText('');
              setSearchResults([]);
            }}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={performReplace}
            disabled={searchResults.length === 0 || !replaceText.trim()}
            sx={{
              textTransform: 'none',
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              borderRadius: '8px',
            }}
          >
            Reemplazar
          </Button>
          <Button
            onClick={performReplaceAll}
            disabled={searchResults.length === 0 || !replaceText.trim()}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              borderRadius: '8px',
            }}
          >
            Reemplazar todo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menú de navegación por encabezados */}
      <Menu
        open={headingsMenuOpen}
        anchorEl={headingsMenuAnchorEl}
        onClose={() => {
          setHeadingsMenuOpen(false);
          setHeadingsMenuAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px rgba(0,0,0,0.6)'
              : '0 10px 40px rgba(0,0,0,0.2)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            minWidth: '280px',
            maxWidth: '400px',
            maxHeight: '400px',
            mt: 1,
          }
        }}
      >
        {headings.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", color: theme.palette.text.secondary }}>
              No se encontraron encabezados
            </Typography>
          </Box>
        ) : (
          <MenuList>
            {headings.map((heading) => (
              <MenuItem
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                sx={{
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  py: 1,
                  px: 2,
                  pl: 2 + (heading.level - 1) * 2,
                  borderRadius: '8px',
                  fontSize: heading.level === 1 ? '1rem' : heading.level === 2 ? '0.95rem' : '0.9rem',
                  fontWeight: heading.level <= 2 ? 600 : 500,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                  },
                }}
              >
                {heading.text || `Encabezado ${heading.level}`}
              </MenuItem>
            ))}
          </MenuList>
        )}
      </Menu>

      {/* Popover para selector de emojis */}
      <Popover
        open={emojiPickerOpen}
        anchorEl={emojiPickerAnchorEl}
        onClose={() => {
          setEmojiPickerOpen(false);
          setEmojiPickerAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 2,
            borderRadius: '16px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px rgba(0,0,0,0.6)'
              : '0 10px 40px rgba(0,0,0,0.2)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            maxWidth: '400px',
            maxHeight: '500px',
          }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            mb: 1.5,
            display: 'block',
            fontWeight: 600,
            color: theme.palette.text.secondary,
          }}
        >
          Seleccionar emoji
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 0.5,
            maxHeight: '400px',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.divider, 0.5),
              borderRadius: '4px',
            },
          }}
        >
          {popularEmojis.map((emoji, index) => (
            <Box
              key={index}
              onClick={() => handleEmojiSelect(emoji)}
              sx={{
                fontSize: '1.5rem',
                p: 1,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                  transform: 'scale(1.2)',
                },
              }}
            >
              {emoji}
            </Box>
          ))}
        </Box>
      </Popover>

      {/* Dialog para insertar video */}
      <Dialog
        open={videoDialogOpen}
        onClose={() => {
          setVideoDialogOpen(false);
          setVideoUrl('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 20px 60px rgba(0,0,0,0.8)'
              : '0 20px 60px rgba(0,0,0,0.3)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          pb: 1.5,
          fontSize: '1.25rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          Insertar video
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="URL del video (YouTube o Vimeo)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              fullWidth
              variant="outlined"
              size="small"
              autoFocus
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                    <VideoLibrary fontSize="small" />
                  </Box>
                ),
              }}
              sx={{
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                '& .MuiInputLabel-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                },
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
            />
            <Typography variant="caption" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", color: theme.palette.text.secondary }}>
              Soporta enlaces de YouTube y Vimeo
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => {
              setVideoDialogOpen(false);
              setVideoUrl('');
            }}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleInsertVideo}
            variant="contained"
            disabled={!videoUrl.trim()}
            sx={{
              textTransform: 'none',
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              borderRadius: '8px',
            }}
          >
            Insertar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menú de plantillas */}
      <Menu
        open={templatesMenuOpen}
        anchorEl={templatesMenuAnchorEl}
        onClose={() => {
          setTemplatesMenuOpen(false);
          setTemplatesMenuAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px rgba(0,0,0,0.6)'
              : '0 10px 40px rgba(0,0,0,0.2)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            minWidth: '220px',
            maxHeight: '400px',
            mt: 1,
          }
        }}
      >
        <MenuList>
          {templates.map((template, index) => (
            <MenuItem
              key={index}
              onClick={() => handleTemplateSelect(template)}
              sx={{
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                py: 1.5,
                px: 2,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <InsertDriveFile fontSize="small" />
                <Typography variant="body2">{template.name}</Typography>
              </Box>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>

      {/* Barra de herramientas flotante (estilo Medium) */}
      {floatingToolbarVisible && selectedText && (
        <Box
          ref={floatingToolbarRef}
          sx={{
            position: 'fixed',
            top: floatingToolbarPosition.top,
            left: floatingToolbarPosition.left,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            p: 0.5,
            borderRadius: '8px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.8)'
              : '0 8px 32px rgba(0,0,0,0.3)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            animation: 'slideDown 0.2s ease-out',
            '@keyframes slideDown': {
              '0%': {
                opacity: 0,
                transform: 'translateY(-10px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Tooltip title="Negrita (Ctrl+B)">
            <IconButton
              size="small"
              onClick={() => {
                execCommand('bold');
                setFloatingToolbarVisible(false);
              }}
              sx={{
                p: 0.75,
                borderRadius: '6px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.6),
                },
              }}
            >
              <FormatBold fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cursiva (Ctrl+I)">
            <IconButton
              size="small"
              onClick={() => {
                execCommand('italic');
                setFloatingToolbarVisible(false);
              }}
              sx={{
                p: 0.75,
                borderRadius: '6px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.6),
                },
              }}
            >
              <FormatItalic fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Subrayado (Ctrl+U)">
            <IconButton
              size="small"
              onClick={() => {
                execCommand('underline');
                setFloatingToolbarVisible(false);
              }}
              sx={{
                p: 0.75,
                borderRadius: '6px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.6),
                },
              }}
            >
              <FormatUnderlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '20px' }} />
          <Tooltip title="Insertar enlace (Ctrl+K)">
            <IconButton
              size="small"
              onClick={() => {
                handleOpenLinkDialog();
                setFloatingToolbarVisible(false);
              }}
              sx={{
                p: 0.75,
                borderRadius: '6px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.6),
                },
              }}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Citar">
            <IconButton
              size="small"
              onClick={() => {
                execCommand('formatBlock', '<blockquote>');
                setFloatingToolbarVisible(false);
              }}
              sx={{
                p: 0.75,
                borderRadius: '6px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.6),
                },
              }}
            >
              <FormatQuote fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Menú contextual para tablas */}
      <Popover
        open={tableMenuOpen && selectedTable !== null}
        anchorEl={tableMenuAnchorEl}
        onClose={() => {
          setTableMenuOpen(false);
          setTableMenuAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 1,
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.8)'
              : '0 8px 32px rgba(0,0,0,0.3)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            px: 1,
            py: 0.5,
            fontWeight: 600,
            color: theme.palette.text.secondary,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            mb: 0.5,
          }}
        >
          Filas
        </Typography>
        <Tooltip title="Insertar fila arriba">
          <IconButton
            size="small"
            onClick={() => {
              insertTableRow('above');
              setTableMenuOpen(false);
            }}
            sx={{
              p: 0.75,
              borderRadius: '6px',
              justifyContent: 'flex-start',
              width: '100%',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
              },
            }}
          >
            <AddBox fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>
              Insertar fila arriba
            </Typography>
          </IconButton>
        </Tooltip>
        <Tooltip title="Insertar fila abajo">
          <IconButton
            size="small"
            onClick={() => {
              insertTableRow('below');
              setTableMenuOpen(false);
            }}
            sx={{
              p: 0.75,
              borderRadius: '6px',
              justifyContent: 'flex-start',
              width: '100%',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
              },
            }}
          >
            <IndeterminateCheckBox fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>
              Insertar fila abajo
            </Typography>
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar fila">
          <IconButton
            size="small"
            onClick={() => {
              deleteTableRow();
              setTableMenuOpen(false);
            }}
            sx={{
              p: 0.75,
              borderRadius: '6px',
              justifyContent: 'flex-start',
              width: '100%',
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            <DeleteOutline fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>
              Eliminar fila
            </Typography>
          </IconButton>
        </Tooltip>
        <Divider sx={{ my: 0.5 }} />
        <Typography
          variant="caption"
          sx={{
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            px: 1,
            py: 0.5,
            fontWeight: 600,
            color: theme.palette.text.secondary,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            mb: 0.5,
          }}
        >
          Columnas
        </Typography>
        <Tooltip title="Insertar columna izquierda">
          <IconButton
            size="small"
            onClick={() => {
              insertTableColumn('left');
              setTableMenuOpen(false);
            }}
            sx={{
              p: 0.75,
              borderRadius: '6px',
              justifyContent: 'flex-start',
              width: '100%',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
              },
            }}
          >
            <Add fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>
              Insertar columna izquierda
            </Typography>
          </IconButton>
        </Tooltip>
        <Tooltip title="Insertar columna derecha">
          <IconButton
            size="small"
            onClick={() => {
              insertTableColumn('right');
              setTableMenuOpen(false);
            }}
            sx={{
              p: 0.75,
              borderRadius: '6px',
              justifyContent: 'flex-start',
              width: '100%',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.6),
              },
            }}
          >
            <Add fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>
              Insertar columna derecha
            </Typography>
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar columna">
          <IconButton
            size="small"
            onClick={() => {
              deleteTableColumn();
              setTableMenuOpen(false);
            }}
            sx={{
              p: 0.75,
              borderRadius: '6px',
              justifyContent: 'flex-start',
              width: '100%',
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            <Remove fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>
              Eliminar columna
            </Typography>
          </IconButton>
        </Tooltip>
      </Popover>

      {/* Menú de estadísticas del documento */}
      <Menu
        open={statsMenuOpen}
        anchorEl={statsMenuAnchorEl}
        onClose={() => {
          setStatsMenuOpen(false);
          setStatsMenuAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px rgba(0,0,0,0.6)'
              : '0 10px 40px rgba(0,0,0,0.2)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            minWidth: '280px',
            maxWidth: '350px',
            mt: 1,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              mb: 2,
              fontWeight: 600,
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Info fontSize="small" />
            Estadísticas del documento
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", color: theme.palette.text.secondary }}>
                  Tiempo de lectura:
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", fontWeight: 600 }}>
                {documentStats.readingTime} {documentStats.readingTime === 1 ? 'minuto' : 'minutos'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", color: theme.palette.text.secondary }}>
                Nivel de legibilidad:
              </Typography>
              <Chip
                label={documentStats.readabilityLevel}
                size="small"
                sx={{
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  fontSize: '0.7rem',
                  height: '20px',
                  backgroundColor: documentStats.readabilityLevel === 'Fácil' 
                    ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                    : documentStats.readabilityLevel === 'Moderado'
                    ? alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                    : alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                  color: documentStats.readabilityLevel === 'Fácil' 
                    ? theme.palette.success.main
                    : documentStats.readabilityLevel === 'Moderado'
                    ? theme.palette.warning.main
                    : theme.palette.error.main,
                  fontWeight: 600,
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", color: theme.palette.text.secondary }}>
                Párrafos:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", fontWeight: 600 }}>
                {documentStats.paragraphs}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", color: theme.palette.text.secondary }}>
                Oraciones:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", fontWeight: 600 }}>
                {documentStats.sentences}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", color: theme.palette.text.secondary }}>
                Palabras:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", fontWeight: 600 }}>
                {wordCount.words}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", color: theme.palette.text.secondary }}>
                Caracteres:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", fontWeight: 600 }}>
                {wordCount.characters}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Menu>

      {/* Dialog para insertar imagen desde URL */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => {
          setImageDialogOpen(false);
          setImageUrl('');
          setImageAlt('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 20px 60px rgba(0,0,0,0.8)'
              : '0 20px 60px rgba(0,0,0,0.3)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          pb: 1.5,
          fontSize: '1.25rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          Insertar imagen
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="URL de la imagen"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              fullWidth
              variant="outlined"
              size="small"
              autoFocus
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                    <Image fontSize="small" />
                  </Box>
                ),
              }}
              sx={{
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                '& .MuiInputLabel-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                },
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
            />
            <TextField
              label="Texto alternativo (alt)"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Descripción de la imagen"
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                '& .MuiInputLabel-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                },
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => {
              setImageDialogOpen(false);
              setImageUrl('');
              setImageAlt('');
            }}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleInsertImage}
            variant="contained"
            disabled={!imageUrl.trim()}
            sx={{
              textTransform: 'none',
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              borderRadius: '8px',
            }}
          >
            Insertar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de atajos de teclado */}
      <Dialog
        open={keyboardShortcutsOpen}
        onClose={() => setKeyboardShortcutsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#2a2a2a', 0.98)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 20px 60px rgba(0,0,0,0.8)'
              : '0 20px 60px rgba(0,0,0,0.3)',
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          pb: 1.5,
          fontSize: '1.25rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <Keyboard fontSize="small" />
          Atajos de teclado
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
            {keyboardShortcuts.map((shortcut, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  px: 2,
                  borderRadius: '8px',
                  backgroundColor: alpha(theme.palette.action.hover, 0.3),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.5),
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    color: theme.palette.text.secondary,
                  }}
                >
                  {shortcut.description}
                </Typography>
                <Chip
                  label={shortcut.key}
                  size="small"
                  sx={{
                    fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    fontSize: '0.7rem',
                    height: '24px',
                    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => setKeyboardShortcutsOpen(false)}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              borderRadius: '8px',
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RichTextEditor;

