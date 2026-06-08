import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { CaretRight } from "@phosphor-icons/react";

interface Crumb {
  label: string;
  path?: string;
}

interface Props {
  crumbs: Crumb[];
}

const Breadcrumb: React.FC<Props> = ({ crumbs }) => {
  const navigate = useNavigate();

  return (
    <Box display="flex" alignItems="center" gap={0.5} mb={2} fontSize="0.85rem" flexWrap="wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.label}>
            {i > 0 && <CaretRight size={10} weight="bold" style={{ opacity: 0.4 }} />}
            <Typography
              component="span"
              onClick={crumb.path && !isLast ? () => navigate(crumb.path!) : undefined}
              sx={{
                color: isLast ? "text.primary" : "text.secondary",
                fontWeight: isLast ? 600 : 400,
                cursor: crumb.path && !isLast ? "pointer" : "default",
                fontSize: "0.85rem",
                "&:hover": crumb.path && !isLast ? { color: "primary.main" } : {},
              }}
            >
              {crumb.label}
            </Typography>
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default Breadcrumb;
