import React, { useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
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
export const ServiceGrid = React.memo(({ 
  services, 
  progressData, 
  selectedServiceId, 
  width, 
  onSelect, 
  onEnhance 
}: ServiceGridProps) => {
  // Determine column count based on width (1, 2, or 3)
  const columnCount = useMemo(() => {
    if (width < 640) return 1;
    if (width < 1024) return 2;
    return 3;
  }, [width]);
  const rowCount = Math.ceil(services.length / columnCount);
  const columnWidth = (width - (columnCount - 1) * GUTTER) / columnCount;
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const serviceIndex = rowIndex * columnCount + columnIndex;
    const service = services[serviceIndex];
    if (!service) return null;
    return (
      <div 
        style={{
          ...style,
          left: style.left + (columnIndex * 0), // Base left from react-window
          width: columnWidth,
          paddingRight: columnIndex < columnCount - 1 ? GUTTER : 0,
          paddingBottom: GUTTER
        }}
      >
        <ServiceCard
          service={service}
          progress={progressData.find(p => p.id === service.id)}
          isSelected={selectedServiceId === service.id}
          onClick={() => onSelect(service)}
          onEnhance={onEnhance}
        />
      </div>
    );
  };
  return (
    <Grid
      columnCount={columnCount}
      columnWidth={columnWidth + (columnCount > 1 ? (GUTTER / columnCount) * (columnCount - 1) : 0)}
      height={800} // Fixed view height for the virtual window
      rowCount={rowCount}
      rowHeight={CARD_HEIGHT + GUTTER}
      width={width}
      className="custom-scrollbar"
    >
      {Cell}
    </Grid>
  );
});
ServiceGrid.displayName = 'ServiceGrid';