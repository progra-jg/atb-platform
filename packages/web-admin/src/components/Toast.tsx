import React, { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { onApiError } from "../services/errorEvents";

function Toast() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => onApiError((msg) => { setMessage(msg); setOpen(true); }), []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={() => setOpen(false)} severity="error" variant="filled" sx={{ borderRadius: 2 }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export default Toast;
