import React, { ReactNode } from "react";
import { Box } from "@mui/material";

interface Props {
  children: ReactNode;
}

const PageTransition: React.FC<Props> = ({ children }) => (
  <Box sx={{ animation: "fadeIn 0.2s ease" }}>
    {children}
  </Box>
);

export default PageTransition;
