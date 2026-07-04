import React, { useState } from 'react';
import { Button } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { GITHUB_CLIENT_ID } from '../config';
import { startGitHubOAuth } from '../services/githubOAuth';

interface GitHubSignInButtonProps {
  disabled?: boolean;
  label?: string;
  onError?: (message: string) => void;
}

const GitHubSignInButton: React.FC<GitHubSignInButtonProps> = ({
  disabled = false,
  label = 'Continue with GitHub',
  onError,
}) => {
  const [isStarting, setIsStarting] = useState(false);

  const handleClick = async () => {
    setIsStarting(true);

    try {
      await startGitHubOAuth();
    } catch (error) {
      setIsStarting(false);
      onError?.(error instanceof Error ? error.message : 'GitHub login could not be started.');
    }
  };

  if (!GITHUB_CLIENT_ID) {
    return null;
  }

  return (
    <Button
      fullWidth
      variant="outlined"
      startIcon={<GitHubIcon />}
      disabled={disabled || isStarting}
      onClick={handleClick}
      sx={{
        py: 1.1,
        borderColor: 'rgba(31, 35, 40, 0.25)',
        borderRadius: 3,
        color: '#1f2328',
        fontWeight: 600,
        textTransform: 'none',
        '&:hover': {
          borderColor: '#1f2328',
          backgroundColor: 'rgba(31, 35, 40, 0.04)',
        },
      }}
    >
      {label}
    </Button>
  );
};

export default GitHubSignInButton;
