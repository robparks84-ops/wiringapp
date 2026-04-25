'use client';

import { useState, useCallback } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { WidgetConfig, GridItem } from '@/lib/types';
import WidgetCard from './WidgetCard';

interface Props {
  widgets: WidgetConfig[];
  layout: GridItem[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  onLayoutChange: (layout: GridItem[]) => void;
}

const COLS = 12;
const ROW_HEIGHT = 80;

export default function DashboardGrid({ widgets, layout, onWidgetsChange, onLayoutChange }: Props) {
  const [width, setWidth] = useState(1200);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const obs = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    obs.observe(node);
  }, []);

  function handleUpdate(id: string, updated: WidgetConfig) {
    onWidgetsChange(widgets.map((w) => (w.id === id ? updated : w)));
  }

  function handleRemove(id: string) {
    onWidgetsChange(widgets.filter((w) => w.id !== id));
    onLayoutChange(layout.filter((l) => l.i !== id));
  }

  function handleLayoutChange(newLayout: GridLayout.Layout[]) {
    onLayoutChange(
      newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      })),
    );
  }

  const glLayout: GridLayout.Layout[] = layout.map((item) => ({
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: item.minW ?? 2,
    minH: item.minH ?? 2,
  }));

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <GridLayout
        layout={glLayout}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={width}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        resizeHandles={['se']}
        margin={[10, 10]}
        containerPadding={[0, 0]}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            <WidgetCard
              config={widget}
              onUpdate={(updated) => handleUpdate(widget.id, updated)}
              onRemove={() => handleRemove(widget.id)}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
