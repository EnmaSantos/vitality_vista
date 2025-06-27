import React, { useState, useEffect, useRef } from 'react';
import { Typography, Box, CircularProgress, Fab } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

interface TimerProps {
  duration: number; // in seconds
  onFinish: () => void;
}

const Timer: React.FC<TimerProps> = ({ duration, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onFinish();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, onFinish]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          sx={{ color: 'grey.300' }}
          size={120}
          thickness={4}
        />
        <CircularProgress
          variant="determinate"
          value={progress}
          sx={{
            color: 'primary.main',
            position: 'absolute',
            left: 0,
          }}
          size={120}
          thickness={4}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" component="div" color="text.secondary">
            {`${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`}
          </Typography>
        </Box>
      </Box>
      <Fab color="primary" aria-label="toggle timer" onClick={toggleTimer} sx={{ mt: 2 }}>
        {isActive ? <PauseIcon /> : <PlayArrowIcon />}
      </Fab>
    </Box>
  );
};

export default Timer; 