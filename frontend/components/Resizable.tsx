import { Resizable, ResizableProps } from 're-resizable';
import React from 'react';

// propsをそのまま渡すだけのラッパー
const ResizableWrapper = React.forwardRef<Resizable, ResizableProps>((props, ref) => (
  <Resizable ref={ref} {...props} />
));
export default ResizableWrapper;
