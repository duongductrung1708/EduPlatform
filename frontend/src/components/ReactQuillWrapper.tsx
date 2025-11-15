import React, { forwardRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/react-quill.css';

interface ReactQuillModules {
  toolbar?: unknown;
  clipboard?: unknown;
  [key: string]: unknown;
}

interface ReactQuillWrapperProps {
  value: string;
  onChange: (value: string) => void;
  modules?: ReactQuillModules;
  formats?: string[];
  theme?: string;
  placeholder?: string;
  readOnly?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const ReactQuillWrapper = forwardRef<ReactQuill, ReactQuillWrapperProps>((props, ref) => {
  return <ReactQuill {...props} ref={ref} />;
});

ReactQuillWrapper.displayName = 'ReactQuillWrapper';

export default ReactQuillWrapper;
