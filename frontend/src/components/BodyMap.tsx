import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { BodyRegion } from '../services/catalogApi';

interface BodyMapProps {
  regions: BodyRegion[];
  selectedRegion?: string;
  onSelect: (regionId: string) => void;
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  view: 'front' | 'back';
}

const hotspots: Hotspot[] = [
  { id: 'neck', x: 91, y: 58, width: 38, height: 30, view: 'front' },
  { id: 'shoulders', x: 55, y: 80, width: 110, height: 36, view: 'front' },
  { id: 'chest', x: 72, y: 102, width: 76, height: 48, view: 'front' },
  { id: 'biceps', x: 38, y: 112, width: 32, height: 68, view: 'front' },
  { id: 'forearms', x: 25, y: 171, width: 36, height: 72, view: 'front' },
  { id: 'abdominals', x: 79, y: 145, width: 62, height: 86, view: 'front' },
  { id: 'abductors', x: 62, y: 220, width: 46, height: 55, view: 'front' },
  { id: 'adductors', x: 106, y: 220, width: 46, height: 55, view: 'front' },
  { id: 'quadriceps', x: 70, y: 264, width: 80, height: 78, view: 'front' },
  { id: 'traps', x: 273, y: 73, width: 74, height: 55, view: 'back' },
  { id: 'triceps', x: 347, y: 111, width: 34, height: 70, view: 'back' },
  { id: 'lats', x: 269, y: 120, width: 82, height: 62, view: 'back' },
  { id: 'middle back', x: 282, y: 114, width: 56, height: 64, view: 'back' },
  { id: 'lower back', x: 280, y: 176, width: 60, height: 52, view: 'back' },
  { id: 'glutes', x: 268, y: 221, width: 84, height: 55, view: 'back' },
  { id: 'hamstrings', x: 270, y: 270, width: 80, height: 70, view: 'back' },
  { id: 'calves', x: 272, y: 336, width: 78, height: 62, view: 'back' },
];

function BodyMap({ regions, selectedRegion, onSelect }: BodyMapProps) {
  const [previewRegion, setPreviewRegion] = useState<string>();
  const activeRegion = previewRegion ?? selectedRegion;
  const labels = new Map(regions.map((region) => [region.id, region.label]));

  const activateFromKeyboard = (event: React.KeyboardEvent<SVGGElement>, regionId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(regionId);
    }
  };

  return (
    <Box>
      <Box className="vv-body-map-frame">
        <svg viewBox="0 0 420 420" role="group" aria-labelledby="vv-body-map-title vv-body-map-description">
          <title id="vv-body-map-title">Interactive front and back body-region selector</title>
          <desc id="vv-body-map-description">Choose a highlighted muscle region, or use the equivalent labeled buttons below the diagram.</desc>
          <metadata>Original Vitality Vista artwork © 2026 Vitality Vista / Enma Santos, CC BY 4.0.</metadata>
          <g className="vv-body-outline" aria-hidden="true">
            <text x="110" y="18" textAnchor="middle">Front</text>
            <circle cx="110" cy="47" r="24" />
            <path d="M91 70 C73 78 65 99 62 132 L48 211 L29 245 M129 70 C147 78 155 99 158 132 L172 211 L191 245 M87 84 C73 126 77 190 83 224 L68 302 L76 397 M133 84 C147 126 143 190 137 224 L152 302 L144 397 M83 224 Q110 244 137 224 M76 397 L60 411 M144 397 L160 411" />
            <text x="310" y="18" textAnchor="middle">Back</text>
            <circle cx="310" cy="47" r="24" />
            <path d="M291 70 C273 78 265 99 262 132 L248 211 L229 245 M329 70 C347 78 355 99 358 132 L372 211 L391 245 M287 84 C273 126 277 190 283 224 L268 302 L276 397 M333 84 C347 126 343 190 337 224 L352 302 L344 397 M283 224 Q310 244 337 224 M276 397 L260 411 M344 397 L360 411" />
          </g>
          {hotspots.map((spot) => {
            const selected = selectedRegion === spot.id;
            const previewed = activeRegion === spot.id;
            const label = labels.get(spot.id) ?? spot.id;
            return (
              <g
                key={spot.id}
                role="button"
                tabIndex={0}
                aria-label={`Choose ${label}`}
                aria-pressed={selected}
                className={`vv-body-hotspot${previewed ? ' is-previewed' : ''}${selected ? ' is-selected' : ''}`}
                onMouseEnter={() => setPreviewRegion(spot.id)}
                onMouseLeave={() => setPreviewRegion(undefined)}
                onFocus={() => setPreviewRegion(spot.id)}
                onBlur={() => setPreviewRegion(undefined)}
                onClick={() => onSelect(spot.id)}
                onKeyDown={(event) => activateFromKeyboard(event, spot.id)}
              >
                <rect x={spot.x} y={spot.y} width={spot.width} height={spot.height} rx="16" />
              </g>
            );
          })}
          {activeRegion && (
            <text x="210" y="409" textAnchor="middle" className="vv-body-map-active-label">
              {labels.get(activeRegion) ?? activeRegion}
            </text>
          )}
        </svg>
      </Box>

      <Typography variant="subtitle2" component="h3" sx={{ mt: 2, mb: 1 }}>
        Body-region buttons
      </Typography>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} aria-label="Body region alternatives">
        {regions.map((region) => (
          <Button
            key={region.id}
            variant={selectedRegion === region.id ? 'contained' : 'outlined'}
            aria-pressed={selectedRegion === region.id}
            onMouseEnter={() => setPreviewRegion(region.id)}
            onMouseLeave={() => setPreviewRegion(undefined)}
            onFocus={() => setPreviewRegion(region.id)}
            onBlur={() => setPreviewRegion(undefined)}
            onClick={() => onSelect(region.id)}
            sx={{ minHeight: 44 }}
          >
            {region.label}
          </Button>
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Original body map © Vitality Vista / Enma Santos — CC BY 4.0.
      </Typography>
    </Box>
  );
}

export default BodyMap;
