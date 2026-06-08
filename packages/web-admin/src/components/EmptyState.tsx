import React, { ReactElement } from "react";
import { Box, Typography, Button } from "@mui/material";

interface Props {
  icon: ReactElement;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

const EmptyState: React.FC<Props> = ({ icon, title, description, action }) => (
  <Box
    sx={{
      textAlign: "center", py: 8, px: 2,
      color: "text.secondary",
    }}
  >
    <Box sx={{ mb: 2, opacity: 0.3, display: "inline-flex" }}>
      {icon}
    </Box>
    <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto", mb: action ? 3 : 0 }}>
        {description}
      </Typography>
    )}
    {action && (
      <Button variant="contained" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </Box>
);

export default EmptyState;
