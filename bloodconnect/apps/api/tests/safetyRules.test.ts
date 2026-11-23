import { describe, it, expect } from 'vitest';
import { mapProvider } from '../src/modules/maps/map.provider';
import { assertValidTransition, VALID_CASE_TRANSITIONS } from '../src/modules/orchestrator/stateMachine';
import { CaseStatus } from '@bloodconnect/shared';

describe('System Safety Rules Enforcement Tests', () => {
  it('Safety Rule 8: Geolocation coordinates MUST be rounded to approx 2 decimal places (~1.1 km)', () => {
    const exactHospitalLat = 12.96147281;
    const exactHospitalLng = 77.58392019;

    const approx = mapProvider.toApproximateCoordinates({
      lat: exactHospitalLat,
      lng: exactHospitalLng,
    });

    expect(approx.lat).toBe(12.96);
    expect(approx.lng).toBe(77.58);

    const gridCell = mapProvider.toGridCell(approx);
    expect(gridCell).toBe('GRID_12.96_77.58');
  });

  it('Safety Rule 10: State Machine must block illegal jumping across stages', () => {
    // Stage 1 cannot jump directly to ESCALATED without going through stages or transitions
    expect(() => {
      assertValidTransition(CaseStatus.ACTIVE_STAGE_1, CaseStatus.ESCALATED);
    }).toThrow();

    // Terminal closed case cannot transition to anything
    expect(() => {
      assertValidTransition(CaseStatus.CLOSED, CaseStatus.ACTIVE_STAGE_1);
    }).toThrow();
  });

  it('State Machine allows valid pausing and resuming', () => {
    expect(() => {
      assertValidTransition(CaseStatus.ACTIVE_STAGE_1, CaseStatus.PAUSED);
    }).not.toThrow();

    expect(() => {
      assertValidTransition(CaseStatus.PAUSED, CaseStatus.ACTIVE_STAGE_1);
    }).not.toThrow();
  });
});
