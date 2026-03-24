import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './VesselLocationsMap.css';

/** Normalize location API rows → sorted voyage order (timestamp ascending when present). */
export function normalizeShipLocationRows(data) {
  if (!Array.isArray(data)) return [];
  const rows = data
    .map((row) => {
      const la = Number(row?.latitude ?? row?.lat);
      const lo = Number(row?.longitude ?? row?.lng ?? row?.lon);
      const ts = row?.timestamp != null ? String(row.timestamp).trim() : '';
      if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
      return { lat: la, lng: lo, timestamp: ts };
    })
    .filter(Boolean);
  rows.sort((a, b) => {
    if (a.timestamp && b.timestamp) return a.timestamp.localeCompare(b.timestamp);
    if (a.timestamp) return -1;
    if (b.timestamp) return 1;
    return 0;
  });
  return rows;
}

const shipHeadIcon = L.divIcon({
  className: 'vessel-map-ship-marker',
  html: '<div class="vessel-map-ship-marker__inner" aria-hidden="true">⛴</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

/** Bounds that stay valid for point-like tracks and zoom in closely on short routes. */
function boundsForTrackFit(latLngPairs) {
  if (!latLngPairs?.length) return null;
  const b = L.latLngBounds(latLngPairs);
  if (!b.isValid()) return null;
  const sw = b.getSouthWest();
  const ne = b.getNorthEast();
  const latSpan = Math.abs(ne.lat - sw.lat);
  const lngSpan = Math.abs(ne.lng - sw.lng);
  const center = b.getCenter();
  // Degenerate or single-point “line”: frame a small neighborhood so the map isn’t zoomed out world-scale
  if (latSpan < 1e-7 && lngSpan < 1e-7) {
    const r = 0.012;
    return L.latLngBounds([center.lat - r, center.lng - r], [center.lat + r, center.lng + r]);
  }
  let padded = b.pad(0.08);
  const padSw = padded.getSouthWest();
  const padNe = padded.getNorthEast();
  const minHalf = 0.0055;
  if (Math.abs(padNe.lat - padSw.lat) < minHalf * 2 || Math.abs(padNe.lng - padSw.lng) < minHalf * 2) {
    padded = L.latLngBounds(
      [center.lat - minHalf, center.lng - minHalf],
      [center.lat + minHalf, center.lng + minHalf]
    );
  }
  return padded;
}

function FitBounds({ positions, fitKey }) {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length === 0) return;
    const fit = () => {
      try {
        map.invalidateSize();
        const bounds = boundsForTrackFit(positions);
        if (!bounds) return;
        // Tighter framing + room for bottom playback overlay (extra bottom padding in px)
        map.fitBounds(bounds, {
          paddingTopLeft: [14, 14],
          paddingBottomRight: [14, 100],
          maxZoom: 18,
          animate: false,
        });
      } catch {
        /* ignore */
      }
    };
    // After layout / flex sizing, Leaflet often needs a tick before bounds fit correctly
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(fit);
    });
    return () => cancelAnimationFrame(id);
  }, [map, fitKey, positions]);

  useEffect(() => {
    const onResize = () => {
      try {
        map.invalidateSize();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map]);

  return null;
}

/**
 * OpenStreetMap: time-ordered track with explicit Play / Pause and scrubber.
 */
export default function VesselLocationsMap({
  points,
  vesselName,
  voyageKgCO2e,
  showVoyageSummary = true,
  loading,
  error,
}) {
  const pathPoints = useMemo(
    () =>
      (points || [])
        .map((p) => ({ lat: p.lat, lng: p.lng }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [points]
  );

  const positions = useMemo(() => pathPoints.map((p) => [p.lat, p.lng]), [pathPoints]);
  const n = positions.length;
  /** Stable while the voyage data is the same (avoids resetting playback when parent re-renders). */
  const trackSignature = useMemo(() => {
    if (!pathPoints.length) return '';
    const a = pathPoints[0];
    const b = pathPoints[pathPoints.length - 1];
    return `${pathPoints.length}:${a.lat}:${a.lng}:${b.lat}:${b.lng}`;
  }, [pathPoints]);

  const [headIndex, setHeadIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef(null);

  const stopPlayback = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlaybackFrom = useCallback(
    (fromIndex) => {
      if (n < 2) return;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      setIsPlaying(true);
      const i0 = Math.max(0, Math.min(fromIndex, n - 1));
      setHeadIndex(i0);
      const durationMs = Math.min(14_000, Math.max(2_500, n * 220));
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / durationMs);
        const idx = Math.round(i0 + t * (n - 1 - i0));
        setHeadIndex(Math.min(n - 1, Math.max(i0, idx)));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          setIsPlaying(false);
          setHeadIndex(n - 1);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [n]
  );

  useEffect(() => {
    stopPlayback();
    if (n <= 1) {
      setHeadIndex(Math.max(0, n - 1));
      return undefined;
    }
    setHeadIndex(n - 1);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [trackSignature, n, stopPlayback]);

  const atEnd = n >= 2 && headIndex >= n - 1 && !isPlaying;
  const segment = useMemo(() => positions.slice(0, headIndex + 1), [positions, headIndex]);
  const center = positions.length > 0 ? positions[0] : [1.28967, 103.85007];
  const head = positions[headIndex] ?? center;

  const onScrub = (e) => {
    if (isPlaying || n < 2) return;
    setHeadIndex(Number(e.target.value));
  };

  const onPlayClick = () => {
    if (n < 2) return;
    if (isPlaying) {
      stopPlayback();
      return;
    }
    startPlaybackFrom(0);
  };

  if (loading) {
    return <div className="vessel-locations-map vessel-locations-map--message">Loading vessel track…</div>;
  }
  if (error) {
    return <div className="vessel-locations-map vessel-locations-map--message vessel-locations-map--error">{error}</div>;
  }
  if (positions.length === 0) {
    return (
      <div className="vessel-locations-map vessel-locations-map--message">
        No latitude/longitude points in ship logs for this MMSI.
      </div>
    );
  }

  return (
    <div className="vessel-locations-map">
      <div className="vessel-locations-map__map-wrap">
        <MapContainer center={center} zoom={11} className="vessel-locations-map__container" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} fitKey={trackSignature} />

          {n >= 2 && atEnd && (
            <Polyline
              positions={positions}
              pathOptions={{
                className: 'vessel-track-line vessel-track-line--done',
                color: 'rgba(28, 59, 94, 0.92)',
                weight: 6,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}
          {n >= 2 && !atEnd && (
            <>
              <Polyline
                positions={positions}
                pathOptions={{
                  color: 'rgba(51, 71, 97, 0.28)',
                  weight: 6,
                  opacity: 0.55,
                  lineCap: 'round',
                  lineJoin: 'round',
                  dashArray: '6 10',
                }}
              />
              <Polyline
                positions={segment}
                pathOptions={{
                  className: isPlaying ? 'vessel-track-line vessel-track-line--playing' : 'vessel-track-line vessel-track-line--done',
                  color: 'rgba(28, 59, 94, 0.95)',
                  weight: 5,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </>
          )}

          {!atEnd && n >= 2 && (
            <>
              <CircleMarker
                center={positions[0]}
                radius={7}
                pathOptions={{
                  color: '#1e8449',
                  fillColor: '#27ae60',
                  fillOpacity: 0.95,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{vesselName || 'Vessel'}</strong>
                  <br />
                  Voyage start
                  <br />
                  {Number(positions[0][0]).toFixed(5)}, {Number(positions[0][1]).toFixed(5)}
                </Popup>
              </CircleMarker>
              <Marker position={head} icon={shipHeadIcon} zIndexOffset={700}>
                <Popup>
                  <strong>{vesselName || 'Vessel'}</strong>
                  <br />
                  Position along track ({headIndex + 1} / {n})
                </Popup>
              </Marker>
            </>
          )}

          {atEnd &&
            positions.map((pos, i) => (
              <CircleMarker
                key={`${pos[0]},${pos[1]},${i}`}
                center={pos}
                radius={i === 0 || i === positions.length - 1 ? 8 : 3}
                pathOptions={{
                  color: i === 0 ? '#1e8449' : i === positions.length - 1 ? '#c0392b' : 'rgba(51, 71, 97, 0.85)',
                  fillColor: i === 0 ? '#27ae60' : i === positions.length - 1 ? '#e74c3c' : 'rgba(51, 71, 97, 0.55)',
                  fillOpacity: 0.92,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{vesselName || 'Vessel'}</strong>
                  <br />
                  {i === 0 ? 'First fix' : i === positions.length - 1 ? 'Last fix' : `Fix ${i + 1}`}
                  <br />
                  {Number(pos[0]).toFixed(5)}, {Number(pos[1]).toFixed(5)}
                </Popup>
              </CircleMarker>
            ))}

          {n === 1 && (
            <CircleMarker
              center={positions[0]}
              radius={9}
              pathOptions={{
                color: '#1e8449',
                fillColor: '#27ae60',
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{vesselName || 'Vessel'}</strong>
                <br />
                Only one position in logs
                <br />
                {Number(positions[0][0]).toFixed(5)}, {Number(positions[0][1]).toFixed(5)}
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>

        <div className="vessel-locations-map__overlay" aria-label="Voyage playback">
          {n >= 2 ? (
            <div
              className="vessel-locations-map__overlay-panel"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <div className="vessel-locations-map__overlay-top">
                <button type="button" className="vessel-locations-map__play-btn" onClick={onPlayClick}>
                  {isPlaying ? 'Pause' : 'Play voyage'}
                </button>
                <span className="vessel-locations-map__overlay-meta">
                  Fix {headIndex + 1} of {n}
                  <span className="vessel-locations-map__overlay-meta-sub"> · drag slider when paused</span>
                </span>
              </div>
              <div className="vessel-locations-map__overlay-scrub">
                <label className="vessel-locations-map__scrub-label">
                  <span className="vessel-locations-map__scrub-hint">Position along track</span>
                  <input
                    type="range"
                    className="vessel-locations-map__scrub"
                    min={0}
                    max={n - 1}
                    value={headIndex}
                    onChange={onScrub}
                    disabled={isPlaying}
                    aria-valuemin={0}
                    aria-valuemax={n - 1}
                    aria-valuenow={headIndex}
                  />
                </label>
              </div>
            </div>
          ) : (
            <p className="vessel-locations-map__overlay-single">
              Only one AIS position for this vessel — add more ship-log fixes to animate movement along a route.
            </p>
          )}
        </div>
      </div>

      {n >= 2 && (
        <p className="vessel-locations-map__hint-below">
          Playback controls sit on the map — use <strong>Play voyage</strong>, then <strong>Pause</strong> or the slider to explore the track.
        </p>
      )}

      {showVoyageSummary && voyageKgCO2e != null && Number.isFinite(Number(voyageKgCO2e)) && (
        <p className="normal-regular vessel-locations-map__caption">
          Approx. voyage LCA (rough AIS model): <strong>{Number(voyageKgCO2e).toFixed(3)} kgCO₂e</strong>
        </p>
      )}
    </div>
  );
}
