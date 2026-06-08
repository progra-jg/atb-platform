import React from "react";
import { Snackbar, Alert, AlertColor, Button } from "@mui/material";

interface NotifyState {
  open: boolean;
  message: string;
  severity: AlertColor;
  action?: { label: string; onClick: () => void };
}

export function useNotify() {
  const [state, setState] = React.useState<NotifyState>({ open: false, message: "", severity: "success" });

  const notify = (message: string, severity: AlertColor = "success", action?: NotifyState["action"]) => {
    setState({ open: true, message, severity, action });
  };

  const close = () => setState((s) => ({ ...s, open: false }));

  const snackbar = (
    <Snackbar
      open={state.open}
      autoHideDuration={4000}
      onClose={close}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={close}
        severity={state.severity}
        variant="filled"
        sx={{ borderRadius: 2, minWidth: 280 }}
        action={state.action ? (
          <Button size="small" color="inherit" onClick={() => { state.action?.onClick(); close(); }}>
            {state.action.label}
          </Button>
        ) : undefined}
      >
        {state.message}
      </Alert>
    </Snackbar>
  );

  return { notify, snackbar, close };
}
