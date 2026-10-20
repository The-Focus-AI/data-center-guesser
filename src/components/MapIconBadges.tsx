import type { FuelSourceType } from '../data/powerGridData';
import {
  buildPowerPlantMarkerSvg,
  buildDataCenterMarkerSvg,
} from '../utils/mapIcons';

export function PlantFuelIcon({
  fuel,
  size = 18,
  className = '',
}: {
  fuel: FuelSourceType;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      dangerouslySetInnerHTML={{
        __html: buildPowerPlantMarkerSvg(fuel, size, false),
      }}
    />
  );
}

export function DataCenterIcon({
  size = 16,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      dangerouslySetInnerHTML={{
        __html: buildDataCenterMarkerSvg(size, false),
      }}
    />
  );
}
