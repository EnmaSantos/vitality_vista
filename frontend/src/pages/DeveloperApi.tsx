import { useEffect, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, Link, Paper, Stack, Typography } from '@mui/material';
import { getOpenApiContract } from '../services/catalogApi';

interface OpenApiDocument {
  info?: { title?: string; version?: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  paths?: Record<string, Record<string, { summary?: string }>>;
}

function DeveloperApi() {
  const [contract, setContract] = useState<OpenApiDocument>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getOpenApiContract().then((result) => setContract(result as OpenApiDocument))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load API documentation.'));
  }, []);

  if (error) return <Box className="vv-developer-page"><Alert severity="error">{error}</Alert></Box>;
  if (!contract) return <Box role="status" className="vv-catalog-loading"><CircularProgress /><Typography>Loading API contract…</Typography></Box>;

  const productionServer = contract.servers?.[0]?.url ?? `${window.location.origin}/api/v1`;
  return (
    <Box component="main" className="vv-developer-page">
      <Typography variant="overline" color="primary">Developers</Typography>
      <Typography variant="h2" component="h1">{contract.info?.title}</Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mt: 1, maxWidth: 850 }}>{contract.info?.description}</Typography>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} sx={{ my: 2 }}><Chip label={`v${contract.info?.version}`} /><Chip label="Public read API" color="success" /><Chip label="120 requests/IP/minute" /></Stack>
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle2">Base URL</Typography>
        <Typography component="code" sx={{ overflowWrap: 'anywhere' }}>{productionServer}</Typography>
        <Typography sx={{ mt: 2 }}>All endpoints accept unauthenticated GET and HEAD requests. Filters combine with AND. Responses include ETags and public cache headers.</Typography>
      </Paper>
      <Typography variant="h4" component="h2" sx={{ mb: 2 }}>Endpoints</Typography>
      <Stack spacing={1.5}>
        {Object.entries(contract.paths ?? {}).flatMap(([path, methods]) => Object.entries(methods).map(([method, operation]) => (
          <Paper key={`${method}-${path}`} variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }}>
              <Chip label={method.toUpperCase()} color="primary" sx={{ fontWeight: 800 }} />
              <Typography component="code" sx={{ fontWeight: 700 }}>{path}</Typography>
              <Typography color="text.secondary">{operation.summary}</Typography>
            </Stack>
          </Paper>
        )))}
      </Stack>
      <Alert severity="info" sx={{ mt: 3 }}>Original Vitality Vista routines and body-map artwork are CC BY 4.0, attributed to “Vitality Vista / Enma Santos.” Exercise data and media are separately sourced under CC0.</Alert>
      <Typography sx={{ mt: 3 }}><Link href={`${productionServer}/openapi.json`}>Download the OpenAPI 3.1 JSON contract</Link></Typography>
    </Box>
  );
}

export default DeveloperApi;
