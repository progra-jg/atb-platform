import React, { useState } from "react";
import {
  Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider,
} from "@mui/material";
import {
  DownloadSimple, FileText, FilePdf, Table,
} from "@phosphor-icons/react";

interface ExportReportButtonProps {
  onExport: (format: "pdf" | "excel" | "xml") => void;
  label?: string;
}

const ExportReportButton: React.FC<ExportReportButtonProps> = ({ onExport, label = "Exporter" }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<DownloadSimple />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ borderRadius: 2 }}
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        sx={{ "& .MuiPaper-root": { borderRadius: 3, mt: 1, minWidth: 180 } }}
      >
        <MenuItem onClick={() => { onExport("pdf"); setAnchorEl(null); }}>
          <ListItemIcon><FilePdf size={16} /></ListItemIcon>
          <ListItemText>PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onExport("excel"); setAnchorEl(null); }}>
          <ListItemIcon><Table size={16} /></ListItemIcon>
          <ListItemText>Excel</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onExport("xml"); setAnchorEl(null); }}>
          <ListItemIcon><FileText size={16} /></ListItemIcon>
          <ListItemText>XML EUDR</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportReportButton;
