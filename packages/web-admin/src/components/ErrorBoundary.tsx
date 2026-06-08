import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";
import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            textAlign: "center",
            px: 2,
          }}
        >
          <WarningCircle size={48} style={{ opacity: 0.25, marginBottom: 16 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Une erreur est survenue
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 420, lineHeight: 1.6 }}
          >
            Un problème inattendu a été rencontré. Veuillez réessayer ou contacter
            le support si le problème persiste.
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleRetry}
            startIcon={<ArrowClockwise size={18} />}
          >
            Réessayer
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
