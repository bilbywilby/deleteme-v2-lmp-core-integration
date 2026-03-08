import React, { useMemo } from 'react';
import * as ReactWindow from 'react-window';
import { Service, ServiceProgress } from '@shared/types';
import { ServiceCard } from './ServiceCard';
interface ServiceGridProps {
  services: Service[];
  progressData: ServiceProgress[];
  selectedServiceId?: string;
  width: number;
  onSelect: (service: Service) => void;
  onEnhance: (service: Service) => void;
}
const GUTTER = 16;
const CARD_HEIGHT = 200;
// Extracted Cell component to prevent re-creation during parent render
const ServiceCell = React.memo(({ 
  columnIndex, 
  rowIndex, 
  style, 
  data 
}: any) => {
  const { services, progressData, selectedServiceId, onSelect, onEnhance, columnCount, columnWidth } = data;
  const serviceIndex = rowIndex * columnCount + columnIndex;
  const service = services[serviceIndex];
  if (!service) return null;
  return (
    <div
      style={{
        ...style,
        width: columnWidth,
        paddingRight: columnIndex < columnCount - 1 ? GUTTER : 0,
        paddingBottom: GUTTER
      }}
    >
      <ServiceCard
        service={service}
        progress={progressData.find((p: ServiceProgress) => p.id === service.id)}
        isSelected={selectedServiceId === service.id}
        onClick={() => onSelect(service)}
        onEnhance={onEnhance}
      />
    </div>
  );
});
ServiceCell.displayName = 'ServiceCell';
export const ServiceGrid = React.memo(({
  services,
  progressData,
  selectedServiceId,
  width,
  onSelect,
  onEnhance
}: ServiceGridProps) => {
  const columnCount = useMemo(() => {
    if (width < 640) return 1;
    if (width < 1024) return 2;
    return 3;
  }, [width]);
  const rowCount = Math.ceil(services.length / columnCount);
  const columnWidth = (width - (columnCount - 1) * GUTTER) / columnCount;
  // memoize item data to pass to the virtual list
  const itemData = useMemo(() => ({
    services,
    progressData,
    selectedServiceId,
    onSelect,
    onEnhance,
    columnCount,
    columnWidth
  }), [services, progressData, selectedServiceId, onSelect, onEnhance, columnCount, columnWidth]);
  // Adjust height based on content to avoid massive empty spaces, but cap it
  const gridHeight = Math.min(800, rowCount * (CARD_HEIGHT + GUTTER));
  return (
    <ReactWindow.FixedSizeGrid
      columnCount={columnCount}
      columnWidth={columnWidth + (columnCount > 1 ? (GUTTER / (columnCount - 1)) : 0)}
      height={gridHeight}
      rowCount={rowCount}
      rowHeight={CARD_HEIGHT + GUTTER}
      width={width}
      itemData={itemData}
      className="custom-scrollbar overflow-x-hidden"
    >
      {ServiceCell}
    </ReactWindow.FixedSizeGrid>
  );
});
ServiceGrid.displayName = 'ServiceGrid';