import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { BRANCHES } from '../../../entities/branch/mock';
import type { Branch } from '../../../entities/branch/model/types';
import { haversineKm } from '../../../shared/lib/geo';
import { useBranchStore } from '../model/branch.store';

export type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

function nearest(lat: number, lng: number): Branch {
  return BRANCHES.reduce((best, b) =>
    haversineKm({ lat, lng }, b) < haversineKm({ lat, lng }, best) ? b : best,
  );
}

/**
 * Geolocalización de sucursal. `locate()` pide permiso (expo-location), obtiene la
 * posición y preselecciona la cooperativa más cercana (respeta la elección manual).
 * Con `auto = true` se dispara una vez al montar. Expone `status` para feedback visible.
 */
export function useBranchLocation(auto = false): { status: LocationStatus; locate: () => Promise<void> } {
  const selectNearest = useBranchStore((s) => s.selectNearest);
  const [status, setStatus] = useState<LocationStatus>('idle');

  const locate = useCallback(async () => {
    setStatus('loading');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      selectNearest(nearest(pos.coords.latitude, pos.coords.longitude));
      setStatus('granted');
    } catch {
      setStatus('error');
    }
  }, [selectNearest]);

  useEffect(() => {
    if (auto) void locate();
  }, [auto, locate]);

  return { status, locate };
}
