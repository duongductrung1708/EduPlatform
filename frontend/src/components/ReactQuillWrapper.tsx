import React, { forwardRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/react-quill.css';

interface ReactQuillWrapperProps {
  value: string;
  onChange: (value: string) => void;
  modules?: any;
  formats?: string[];
  theme?: string;
  placeholder?: string;
  readOnly?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const ReactQuillWrapper = forwardRef<any, ReactQuillWrapperProps>((props, ref) => {
  return <ReactQuill {...props} ref={ref} />;
});

ReactQuillWrapper.displayName = 'ReactQuillWrapper';

export default ReactQuillWrapper;
