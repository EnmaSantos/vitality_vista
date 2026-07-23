import { memo, useEffect, useState } from 'react';
import {
  PauseCircleOutline as PauseCircleOutlineIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
} from '@mui/icons-material';
import { Box, Chip, Stack, Typography, useMediaQuery } from '@mui/material';
import type { ExerciseSummary } from '../services/exerciseApi';

type ExerciseMediaMode = 'interactive' | 'animated' | 'static';

interface ExerciseMediaProps {
  exercise: ExerciseSummary;
  compact?: boolean;
  mode?: ExerciseMediaMode;
}

function ExerciseMedia({
  exercise,
  compact = false,
  mode = 'interactive',
}: ExerciseMediaProps) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);

  useEffect(() => {
    setIsPinned(false);
    setImageFailed(false);
    setGifFailed(false);
  }, [exercise.id, exercise.imageUrl, exercise.gifUrl]);

  const canAnimate = Boolean(exercise.gifUrl) && !gifFailed;
  const isAnimated = canAnimate && (
    (mode === 'animated' && !prefersReducedMotion) ||
    (mode === 'interactive' && (
      isPinned || (!prefersReducedMotion && (isHovered || isFocused))
    ))
  );
  const isInteractive = mode === 'interactive' && canAnimate;
  const mediaUrl = isAnimated
    ? exercise.gifUrl
    : imageFailed
      ? undefined
      : exercise.imageUrl;

  const interactionLabel = isPinned
    ? `Pause ${exercise.name} animation`
    : `Play ${exercise.name} animation`;

  return (
    <Box
      component={isInteractive ? 'button' : 'div'}
      type={isInteractive ? 'button' : undefined}
      role={!isInteractive && !mediaUrl ? 'img' : undefined}
      aria-label={isInteractive
        ? interactionLabel
        : !mediaUrl
          ? `${exercise.name} exercise demonstration`
          : undefined}
      aria-pressed={isInteractive ? isPinned : undefined}
      onClick={isInteractive ? () => setIsPinned((current) => !current) : undefined}
      onMouseEnter={isInteractive ? () => setIsHovered(true) : undefined}
      onMouseLeave={isInteractive ? () => setIsHovered(false) : undefined}
      onFocus={isInteractive ? () => setIsFocused(true) : undefined}
      onBlur={isInteractive ? () => setIsFocused(false) : undefined}
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: compact ? 180 : 300,
        aspectRatio: compact ? '4 / 3' : '16 / 10',
        p: 0,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        border: 0,
        color: 'white',
        cursor: isInteractive ? 'pointer' : 'default',
        background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 58%, var(--color-secondary) 140%)',
        '&:focus-visible': {
          outline: '3px solid var(--color-secondary)',
          outlineOffset: -3,
        },
      }}
    >
      {mediaUrl ? (
        <Box
          key={mediaUrl}
          component="img"
          src={mediaUrl}
          alt={isInteractive ? '' : `${exercise.name} exercise demonstration`}
          loading={compact ? 'lazy' : 'eager'}
          onError={() => {
            if (isAnimated) {
              setGifFailed(true);
            } else {
              setImageFailed(true);
            }
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            bgcolor: '#f7faf7',
          }}
        />
      ) : (
        <Stack component="span" alignItems="center" spacing={0.75} sx={{ position: 'relative', zIndex: 1, px: 2 }}>
          <PlayCircleOutlineIcon sx={{ fontSize: compact ? 58 : 82 }} />
          <Typography component="span" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
            {exercise.target || exercise.bodyPart || exercise.category}
          </Typography>
          <Typography component="span" variant="caption" sx={{ opacity: 0.82, textTransform: 'capitalize' }}>
            {exercise.equipment}
          </Typography>
        </Stack>
      )}

      {isInteractive && (
        <Chip
          component="span"
          icon={isAnimated ? <PauseCircleOutlineIcon /> : <PlayCircleOutlineIcon />}
          label={isPinned
            ? 'Click to pause'
            : isAnimated
              ? 'Previewing movement'
              : prefersReducedMotion
                ? 'Click to preview'
                : 'Hover or click to preview'}
          size="small"
          sx={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            zIndex: 2,
            color: 'white',
            bgcolor: 'rgba(20, 33, 25, 0.78)',
            backdropFilter: 'blur(6px)',
            '& .MuiChip-icon': { color: 'white' },
          }}
        />
      )}

      {mode === 'animated' && canAnimate && (
        <Chip
          component="span"
          label="Movement guide"
          size="small"
          sx={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            zIndex: 2,
            color: 'white',
            bgcolor: 'rgba(20, 33, 25, 0.78)',
            backdropFilter: 'blur(6px)',
          }}
        />
      )}
    </Box>
  );
}

export default memo(ExerciseMedia);
