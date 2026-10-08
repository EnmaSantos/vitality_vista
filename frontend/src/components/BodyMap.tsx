import { CSSProperties, useId, useState } from 'react';
import { Box, Typography } from '@mui/material';
import frontBody from '../assets/anatomy/front.webp';
import backBody from '../assets/anatomy/back.webp';
import type { BodyRegion } from '../services/catalogApi';
import { muscleShapes } from './bodyMap/anatomy';

interface BodyMapProps {
  regions: BodyRegion[];
  selectedRegion?: string;
  onSelect: (regionId: string) => void;
}

const regionColors: Record<string, string> = {
  neck: '#ed746d', shoulders: '#ef9a42', chest: '#5cafe1',
  biceps: '#ae80d7', triceps: '#956bc6', forearms: '#b296d9',
  abdominals: '#edc44f', traps: '#75b691', lats: '#66ae82',
  'middle back': '#4c987b', 'lower back': '#97bd80', glutes: '#6ba3df',
  quadriceps: '#ed869e', hamstrings: '#de7898', calves: '#8bbc61',
  adductors: '#d69cad', abductors: '#d3a078',
};

const views = ['front', 'back'] as const;
type BodyView = typeof views[number];
const shapesByView = views.map((view) => ({
  view,
  groups: Object.keys(regionColors).map((region) => ({
    region,
    shapes: muscleShapes.filter((shape) => shape.view === view && shape.region === region),
  })).filter((group) => group.shapes.length > 0),
}));

function BodyMap({ regions, selectedRegion, onSelect }: BodyMapProps) {
  const id = useId();
  const [hoveredRegion, setHoveredRegion] = useState<string>();
  const [focusedRegion, setFocusedRegion] = useState<string>();
  const [viewChoice, setViewChoice] = useState<{ view: BodyView; region?: string }>();
  const activeRegion = hoveredRegion ?? focusedRegion ?? selectedRegion;
  const labels = new Map(regions.map((region) => [region.id, region.label]));
  const labelFor = (region: string) => labels.get(region) ?? region.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const selectedView = regions.find((region) => region.id === selectedRegion)?.view
    ?? muscleShapes.find((shape) => shape.region === selectedRegion)?.view ?? 'front';
  // A new selection (including browser Back/Forward) reveals its side on mobile.
  const mobileView = viewChoice?.region === selectedRegion ? viewChoice?.view ?? selectedView : selectedView;
  const colorStyle = (region: string) => ({ '--muscle-color': regionColors[region] ?? '#75b691' } as CSSProperties);
  const selectRegion = (region: string, view?: BodyView) => {
    setViewChoice(view ? { view, region } : undefined);
    onSelect(region);
  };
  const previewEvents = (region: string) => ({
    onMouseEnter: () => setHoveredRegion(region),
    onMouseLeave: () => setHoveredRegion(undefined),
    onFocus: () => setFocusedRegion(region),
    onBlur: () => setFocusedRegion(undefined),
  });

  return (
    <Box className="vv-body-map">
      <Box className="vv-body-map-frame">
        <div className="vv-body-view-switch" role="group" aria-label="Body view">
          {views.map((view) => (
            <button key={view} type="button" aria-pressed={mobileView === view}
              onClick={() => setViewChoice({ view, region: selectedRegion })}>
              {view === 'front' ? 'Front view' : 'Back view'}
            </button>
          ))}
        </div>
        <div className={`vv-body-figures${activeRegion ? ' has-active-region' : ''}`} data-mobile-view={mobileView}>
          {shapesByView.map(({ view, groups }) => (
            <figure className="vv-body-figure" data-view={view} key={view}>
              <figcaption>{view === 'front' ? 'Front view' : 'Back view'}</figcaption>
              <svg viewBox="35 8 291 528" role="group" aria-labelledby={`${id}-${view}-title ${id}-${view}-description`}>
                <title id={`${id}-${view}-title`}>{view === 'front' ? 'Front' : 'Back'} muscle selector</title>
                <desc id={`${id}-${view}-description`}>Select a muscle to find exercises. Each colored muscle is a button. You can also use the muscle names beside the diagram.</desc>
                <defs>
                  <clipPath id={`${id}-${view}-upper-traps`}><path d="M0 0H362V110H0Z" /></clipPath>
                  <clipPath id={`${id}-${view}-middle-traps`}><path d="M0 110H362V542H0Z" /></clipPath>
                </defs>
                <image href={view === 'front' ? frontBody : backBody} width="361.15625" height="541.86667" aria-hidden="true" />
                {groups.map(({ region, shapes }) => (
                  <g key={region} role="button" tabIndex={0}
                    aria-label={`Choose ${labelFor(region)} (${view})`}
                    aria-pressed={selectedRegion === region}
                    className={`vv-body-muscle${activeRegion === region ? ' is-previewed' : ''}${selectedRegion === region ? ' is-selected' : ''}`}
                    style={colorStyle(region)}
                    {...previewEvents(region)}
                    onClick={() => selectRegion(region, view)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectRegion(region, view);
                      }
                    }}>
                    <title>{labelFor(region)}</title>
                    {shapes.map((shape) => (
                      <g key={shape.id} clipPath={shape.clip ? `url(#${id}-${view}-${shape.clip})` : undefined}>
                        <path d={shape.d} transform={shape.transform} />
                      </g>
                    ))}
                  </g>
                ))}
              </svg>
            </figure>
          ))}
        </div>
        <div className="vv-body-map-caption" role="status" aria-live="polite" aria-atomic="true">
          <span className="vv-muscle-swatch" style={activeRegion ? colorStyle(activeRegion) : undefined} aria-hidden="true" />
          {activeRegion ? <><strong>{labelFor(activeRegion)}</strong><span>{activeRegion === selectedRegion ? 'Selected · matches below' : 'Select to explore'}</span></> : <span>Tap a muscle to explore exercises</span>}
        </div>
      </Box>

      <Box className="vv-body-region-panel">
        <Typography variant="overline" color="primary">Explore the body</Typography>
        <Typography variant="h6" component="h3" id={`${id}-muscles`}>Muscle groups</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Pick a muscle on the body or choose from the list.
        </Typography>
        <div className="vv-body-region-list" role="group" aria-labelledby={`${id}-muscles`}>
          {(regions.length > 0 ? regions.map((region) => region.id) : Object.keys(regionColors)).map((region) => (
            <button key={region} type="button" className="vv-body-region-button"
              aria-pressed={selectedRegion === region} style={colorStyle(region)}
              {...previewEvents(region)} onClick={() => selectRegion(region)}>
              <span className="vv-muscle-swatch" aria-hidden="true" />
              <span>{labelFor(region)}</span>
              {selectedRegion === region && <span className="vv-body-region-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Anatomy artwork: <a href="https://github.com/crmapache/js-rich-body-highlighter" target="_blank" rel="noreferrer">js-rich-body-highlighter</a> · <a href="/licenses/body-anatomy-MIT.txt" target="_blank" rel="noreferrer">MIT license</a>
        </Typography>
      </Box>
    </Box>
  );
}

export default BodyMap;
