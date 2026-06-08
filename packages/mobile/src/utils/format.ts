export function formatCurrency(n: number, currency = "XOF"): string {
  return `${n.toLocaleString()} ${currency}`;
}

export function formatCompact(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toString();
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "completed": case "repaid": case "paid": case "Disponible": return "#22c55e";
    case "pending": case "processing": case "active": case "En transit": return "#f59e0b";
    case "failed": case "defaulted": case "cancelled": case "overdue": case "Vendu": return "#ef4444";
    default: return "#64748b";
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: "Complété", repaid: "Remboursé", paid: "Payé",
    pending: "En attente", processing: "En cours", active: "Actif",
    failed: "Échoué", defaulted: "Par défaut", cancelled: "Annulé",
    overdue: "En retard", Disponible: "Disponible", "En transit": "En transit",
    Vendu: "Vendu",
  };
  return labels[status] || status;
}
