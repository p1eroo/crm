declare module 'react-quill' {
  import { Component } from 'react';

  export interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    readOnly?: boolean;
    theme?: string;
    modules?: any;
    formats?: string[];
    bounds?: string | HTMLElement;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    onChangeSelection?: (selection: any, source: string, editor: any) => void;
    onFocus?: (selection: any, source: string, editor: any) => void;
    onBlur?: (previousSelection: any, source: string, editor: any) => void;
    onKeyPress?: (event: any) => void;
    onKeyDown?: (event: any) => void;
    onKeyUp?: (event: any) => void;
    style?: React.CSSProperties;
    className?: string;
  }

  export default class ReactQuill extends Component<ReactQuillProps> {}
}

declare module 'react-quill/dist/quill.snow.css';








