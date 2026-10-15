import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactElement;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - 8;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 8;
          break;
      }

      setTooltipPosition({ top, left });
    }
  }, [show, position]);

  const positionTransforms = {
    top: 'translateX(-50%) translateY(-100%)',
    bottom: 'translateX(-50%)',
    left: 'translateX(-100%) translateY(-50%)',
    right: 'translateY(-50%)'
  };

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        {children}
      </span>
      {show &&
        createPortal(
          <div
            className="fixed px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md whitespace-nowrap"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              transform: positionTransforms[position],
              pointerEvents: 'none',
              zIndex: 9999
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
