import { config } from '../../config/index';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  city: string;
  area: string;
  gridCell: string;
}

export interface IMapProvider {
  calculateDistanceKm(from: LocationCoordinates, to: LocationCoordinates): number;
  toApproximateCoordinates(coords: LocationCoordinates): LocationCoordinates;
  toGridCell(coords: LocationCoordinates): string;
  geocode(address: string): Promise<GeocodeResult>;
  reverseGeocode(coords: LocationCoordinates): Promise<{ city: string; area: string }>;
}

export class HaversineProvider implements IMapProvider {
  /**
   * Approximate location to 2 decimal places (~1.1 km precision)
   * This is a fundamental privacy safety constraint!
   */
  toApproximateCoordinates(coords: LocationCoordinates): LocationCoordinates {
    const factor = Math.pow(10, config.LOCATION_APPROX_DECIMALS);
    return {
      lat: Math.round(coords.lat * factor) / factor,
      lng: Math.round(coords.lng * factor) / factor,
    };
  }

  toGridCell(coords: LocationCoordinates): string {
    const approx = this.toApproximateCoordinates(coords);
    return `GRID_${approx.lat.toFixed(2)}_${approx.lng.toFixed(2)}`;
  }

  calculateDistanceKm(from: LocationCoordinates, to: LocationCoordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(to.lat - from.lat);
    const dLng = this.deg2rad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(from.lat)) *
      Math.cos(this.deg2rad(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 100) / 100;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async geocode(query: string): Promise<GeocodeResult> {
    // Default simulated geocode for local offline testing (e.g. Bangalore center coords)
    const baseLat = 12.9716;
    const baseLng = 77.5946;
    const approx = this.toApproximateCoordinates({ lat: baseLat, lng: baseLng });
    return {
      lat: approx.lat,
      lng: approx.lng,
      city: 'Bengaluru',
      area: query.slice(0, 30) || 'Central Zone',
      gridCell: this.toGridCell(approx),
    };
  }

  async reverseGeocode(coords: LocationCoordinates): Promise<{ city: string; area: string }> {
    return {
      city: 'Bengaluru',
      area: `Zone ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`,
    };
  }
}

export const mapProvider: IMapProvider = new HaversineProvider();
