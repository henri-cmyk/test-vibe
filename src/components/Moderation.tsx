import { useState, useEffect } from "react";
import { mockSubmissions, mockMissions, type Submission } from "../data/mock-data";
import {
  CheckCircle2,
  XCircle,
  Clock,
  X,
  AlertTriangle,
  ScanLine,
  Calendar,
  Receipt,
  Edit2,
  Save,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertCircle,
  Ban,
  FileX,
  DollarSign,
  CalendarX,
  Copy,
  History,
  Star,
  Eye,
  User,
  Zap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Label } from "./ui/label";
type FilterStatus = "all" | "pending" | "approved" | "rejected";
interface EditableOCRData {
  ticketNumber: string;
  detectedStore: string;
  detectedAmount: number;
  detectedDate: string;
  items: { name: string; price: number }[];
  confidence: number;
}
interface ValidationFlag {
  type: "error" | "warning";
  code: "ineligible_product" | "duplicate" | "max_tickets" | "amount_insufficient" | "date_expired";
  message: string;
}
interface AuditLogEntry {
  id: string;
  submissionId: string;
  action: "approved" | "rejected" | "edited";
  moderatorName: string;
  timestamp: Date;
  details?: string;
  previousData?: any;
  newData?: any;
}
const ITEMS_PER_PAGE = 12;
const computePoints = (submission: Submission): number | null => {
  const mission = mockMissions.find((m) => m.id === submission.missionId);
  if (!mission) return null;
  if (mission.pointsMode === "fixed") return mission.pointsReward;
  // amount_based: sum eligible item prices (the items exposed to the moderator)
  const eligibleAmount = submission.ocrData.items.reduce((sum, item) => sum + item.price, 0);
  return Math.ceil(eligibleAmount * mission.pointsPerEuro);
};
const statusConfig = {
  pending: {
    label: "En attente",
    dotClass: "bg-amber-400",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approuvée",
    dotClass: "bg-emerald-400",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejetée",
    dotClass: "bg-red-400",
    textClass: "text-red-600",
    bgClass: "bg-red-50 border-red-200",
    icon: XCircle,
  },
};
const rejectionReasons = [
  { value: "unreadable", label: "Ticket illisible", icon: FileX },
  { value: "date_expired", label: "Date trop ancienne", icon: CalendarX },
  { value: "product_not_eligible", label: "Produit non éligible", icon: Ban },
  { value: "duplicate", label: "Doublon", icon: Copy },
  { value: "fraud_suspected", label: "Fraude suspectée", icon: Shield },
  { value: "amount_insufficient", label: "Montant insuffisant", icon: DollarSign },
];
/* ── Simulated receipt thumbnail ─────────────────────────── */
function ReceiptThumbnail({ sub, blurred = false }: { sub: Submission; blurred?: boolean }) {
  const colors = [
    ["from-stone-200 to-stone-300", "text-stone-500"],
    ["from-slate-200 to-slate-300", "text-slate-500"],
    ["from-zinc-200 to-zinc-300", "text-zinc-500"],
    ["from-neutral-200 to-neutral-300", "text-neutral-500"],
  ];
  const idx = parseInt(sub.id.replace(/\D/g, ""), 10) % colors.length;
  const [grad, txt] = colors[idx];
  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${grad} overflow-hidden`}>
      {/* Simulate receipt lines */}
      <div className="absolute inset-0 flex flex-col justify-center items-center gap-1 px-4 py-3">
        {[70, 50, 80, 40, 65, 55, 75, 45, 60].map((w, i) => (
          <div
            key={i}
            className={`h-[3px] rounded-full bg-current opacity-20 ${txt}`}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
      {blurred && (
        <div className="absolute inset-0 backdrop-blur-[6px] bg-white/20" />
      )}
      <div className={`absolute bottom-2 right-2 ${txt} opacity-30`}>
        <Receipt className="w-5 h-5" />
      </div>
    </div>
  );
}
export function Moderation() {
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [focusMode, setFocusMode] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editableData, setEditableData] = useState<EditableOCRData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDetails, setRejectionDetails] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [preValidationSub, setPreValidationSub] = useState<Submission | null>(null);
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const filtered = (() => {
    let list = filter === "all" ? sortedSubmissions : sortedSubmissions.filter((s) => s.status === filter);
    if (focusMode) list = list.filter((s) => s.status === "pending");
    return list;
  })();
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSubmissions = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  useEffect(() => { setCurrentPage(1); }, [filter, focusMode]);
  const addAuditLog = (
    submissionId: string,
    action: AuditLogEntry["action"],
    details?: string,
    previousData?: any,
    newData?: any
  ) => {
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        submissionId,
        action,
        moderatorName: "Modérateur Admin",
        timestamp: new Date(),
        details,
        previousData,
        newData,
      },
      ...prev,
    ]);
  };
  const validateSubmission = (submission: Submission): ValidationFlag[] => {
    const flags: ValidationFlag[] = [];
    const mission = mockMissions.find((m) => m.id === submission.missionId);
    if (!mission) return flags;
    if (submission.totalAmount < mission.minAmount) {
      flags.push({ type: "error", code: "amount_insufficient", message: `Montant insuffisant (min. ${mission.minAmount}€)` });
    }
    const daysSince = Math.floor((new Date().getTime() - new Date(submission.purchaseDate).getTime()) / 86400000);
    if (daysSince > mission.validityDays) {
      flags.push({ type: "error", code: "date_expired", message: `Ticket de plus de ${mission.validityDays} jours` });
    }
    const isStoreEligible = mission.allowedStores.some((s) =>
      submission.ocrData.detectedStore.toLowerCase().includes(s.toLowerCase())
    );
    if (!isStoreEligible) {
      flags.push({ type: "error", code: "ineligible_product", message: "Enseigne non éligible pour cette mission" });
    }
    const hasDuplicate = submissions.some(
      (s) => s.id !== submission.id && s.userId === submission.userId &&
        s.ocrData.detectedAmount === submission.ocrData.detectedAmount &&
        s.ocrData.detectedDate === submission.ocrData.detectedDate && s.status === "approved"
    );
    if (hasDuplicate) {
      flags.push({ type: "warning", code: "duplicate", message: "Doublon potentiel détecté" });
    }
    const userTicketCount = submissions.filter((s) => s.userId === submission.userId && s.status === "approved").length;
    if (userTicketCount >= mission.maxTicketsPerUser) {
      flags.push({ type: "warning", code: "max_tickets", message: `Limite de ${mission.maxTicketsPerUser} tickets atteinte` });
    }
    return flags;
  };
  const handleApprove = async (id: string) => {
    if (processingIds.has(id)) { toast.error("Déjà en cours de traitement"); return; }
    const sub = submissions.find((s) => s.id === id);
    if (!sub || sub.status !== "pending") { toast.error("Cette soumission ne peut pas être traitée"); return; }
    setProcessingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: "approved" as const } : s));
      addAuditLog(id, "approved", "Points crédités au client");
      toast.success("Soumission approuvée", { description: "Les points ont été crédités." });
      setSelectedSubmission(null);
      setProcessingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }, 500);
  };
  const handleReject = (id: string) => {
    if (processingIds.has(id)) { toast.error("Déjà en cours de traitement"); return; }
    if (!rejectionReason.trim()) { toast.error("Veuillez sélectionner un motif de rejet"); return; }
    const sub = submissions.find((s) => s.id === id);
    if (!sub || sub.status !== "pending") { toast.error("Cette soumission ne peut pas être traitée"); return; }
    setProcessingIds((prev) => new Set(prev).add(id));
    const reason = rejectionReasons.find((r) => r.value === rejectionReason);
    const fullReason = rejectionDetails ? `${reason?.label}: ${rejectionDetails}` : reason?.label || rejectionReason;
    setTimeout(() => {
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: "rejected" as const, rejectionReason: fullReason } : s));
      addAuditLog(id, "rejected", fullReason);
      toast.error("Soumission rejetée", { description: "Le client a été notifié." });
      setSelectedSubmission(null);
      setShowRejectDialog(false);
      setRejectionReason("");
      setRejectionDetails("");
      setProcessingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }, 500);
  };
  const handleSaveEdit = () => {
    if (!selectedSubmission || !editableData) return;
    const prev = { ...selectedSubmission.ocrData };
    setSubmissions((p) =>
      p.map((s) =>
        s.id === selectedSubmission.id
          ? { ...s, ocrData: { ...editableData }, totalAmount: editableData.detectedAmount, storeName: editableData.detectedStore }
          : s
      )
    );
    addAuditLog(selectedSubmission.id, "edited", "Données OCR modifiées manuellement", prev, editableData);
    setSelectedSubmission({ ...selectedSubmission, ocrData: editableData });
    setIsEditing(false);
    toast.success("Modifications enregistrées");
  };
  const openDetail = (sub: Submission) => {
    setSelectedSubmission(sub);
    setEditableData({
      ticketNumber: `TICKET-${sub.id.toUpperCase()}`,
      detectedStore: sub.ocrData.detectedStore,
      detectedAmount: sub.ocrData.detectedAmount,
      detectedDate: sub.ocrData.detectedDate,
      items: [...sub.ocrData.items],
      confidence: sub.ocrData.confidence,
    });
    setIsEditing(false);
  };
  const filterTabs: { value: FilterStatus; label: string; count?: number }[] = [
    { value: "all", label: "Tout voir", count: submissions.length },
    { value: "pending", label: "En attente", count: pendingCount },
    { value: "approved", label: "Approuvées", count: submissions.filter((s) => s.status === "approved").length },
    { value: "rejected", label: "Rejetées", count: submissions.filter((s) => s.status === "rejected").length },
  ];
  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-0.5">
            <span className="font-medium text-gray-900">Modération</span>
            <span>/</span>
            <span>Retrouvez tous les contenus de vos utilisateurs</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button className="flex items-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium">
              <Receipt className="w-3.5 h-3.5" />
              Contenus à modérer
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                {pendingCount}
              </span>
            </button>
          )}
          <button
            onClick={() => { setFocusMode(!focusMode); setFilter("all"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              focusMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {focusMode ? "Quitter le Focus" : "Focus"}
          </button>
          <button
            onClick={() => setShowAuditLog(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            Audit
          </button>
        </div>
      </div>
      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 px-8 pt-4 border-b border-gray-100 shrink-0">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setFocusMode(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === tab.value && !focusMode
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                filter === tab.value && !focusMode
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
        {focusMode && (
          <span className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            <Zap className="w-3 h-3" />
            Mode Focus – {filtered.length} ticket{filtered.length > 1 ? "s" : ""} à traiter
          </span>
        )}
      </div>
      {/* ── Cards grid ── */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Receipt className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Aucune soumission dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {paginatedSubmissions.map((sub) => {
              const sc = statusConfig[sub.status];
              const flags = sub.status === "pending" ? validateSubmission(sub) : [];
              const hasErrors = flags.some((f) => f.type === "error");
              return (
                <div
                  key={sub.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  {/* Image area */}
                  <div
                    className="relative h-40 cursor-pointer"
                    onClick={() => openDetail(sub)}
                  >
                    <ReceiptThumbnail sub={sub} blurred={false} />
                    {/* Status badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.bgClass} ${sc.textClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dotClass}`} />
                        {sc.label}
                      </span>
                    </div>
                    {/* Error flag */}
                    {hasErrors && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Card body */}
                  <div className="px-3 py-2.5">
                    {/* Mission name */}
                    <div className="flex items-start gap-2 mb-1">
                      <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Receipt className="w-3 h-3 text-blue-600" />
                      </div>
                      <p className="text-[12px] font-medium text-gray-800 leading-tight line-clamp-2">
                        {sub.missionName}
                      </p>
                    </div>
                    {/* User + date */}
                    <p className="text-[11px] text-gray-400 mt-1 truncate">{sub.userName}</p>
                    <p className="text-[10px] text-gray-300 truncate">
                      {new Date(sub.submittedAt).toLocaleDateString("fr-FR")}
                    </p>
                    {/* Points if approved */}
                    {sub.status === "approved" && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[11px] font-semibold text-amber-600">
                          {computePoints(sub)} pts
                        </span>
                      </div>
                    )}
                    {/* Rejection reason */}
                    {sub.status === "rejected" && sub.rejectionReason && (
                      <p className="text-[10px] text-red-500 mt-1 line-clamp-1" title={sub.rejectionReason}>
                        {sub.rejectionReason}
                      </p>
                    )}
                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100">
                      {/* View user */}
                      <button
                        onClick={() => openDetail(sub)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        title={sub.userName}
                      >
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      {/* View detail */}
                      <button
                        onClick={() => openDetail(sub)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Voir le détail"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      {sub.status === "pending" && (
                        <>
                          <div className="flex-1" />
                          {/* Reject */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(sub);
                              openDetail(sub);
                              setShowRejectDialog(true);
                            }}
                            disabled={processingIds.has(sub.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                            title="Rejeter"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                          {/* Approve */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreValidationSub(sub); }}
                            disabled={processingIds.has(sub.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                            title="Approuver"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 px-3">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Detail Modal */}
      {selectedSubmission && !showRejectDialog && editableData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl my-8">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Détail de la soumission</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedSubmission.userName} · {selectedSubmission.userEmail}
                </p>
              </div>
              <button
                onClick={() => { setSelectedSubmission(null); setIsEditing(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status + points */}
              {(() => {
                const sc = statusConfig[selectedSubmission.status];
                const pts = computePoints(selectedSubmission);
                return (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${sc.bgClass} ${sc.textClass}`}>
                      <sc.icon className="w-4 h-4" />
                      {sc.label}
                    </span>
                    {selectedSubmission.rejectionReason && (
                      <span className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {selectedSubmission.rejectionReason}
                      </span>
                    )}
                    {selectedSubmission.status === "approved" && pts !== null && (
                      <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-amber-700">{pts.toLocaleString("fr-FR")} points crédités</span>
                      </div>
                    )}
                  </div>
                );
              })()}
              {/* Validation Flags */}
              {selectedSubmission.status === "pending" && (() => {
                const flags = validateSubmission(selectedSubmission);
                if (!flags.length) return null;
                return (
                  <div className="space-y-2">
                    {flags.map((flag, i) => (
                      <Alert key={i} className={flag.type === "error" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}>
                        <AlertCircle className={`h-4 w-4 ${flag.type === "error" ? "text-red-600" : "text-amber-600"}`} />
                        <AlertTitle className={flag.type === "error" ? "text-red-900" : "text-amber-900"}>
                          {flag.type === "error" ? "Erreur détectée" : "Attention"}
                        </AlertTitle>
                        <AlertDescription className={flag.type === "error" ? "text-red-700" : "text-amber-700"}>
                          {flag.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                );
              })()}
              {/* RGPD */}
              <Alert className="border-purple-200 bg-purple-50">
                <Shield className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-900 text-sm">
                  <span className="font-semibold">Confidentialité RGPD :</span> Seuls les produits sélectionnés par le client sont visibles. Le reste du ticket est flouté.
                </AlertDescription>
              </Alert>
              {/* Receipt preview */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Photo du ticket de caisse</Label>
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                  <div className="h-80 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                    <div className="absolute inset-0 backdrop-blur-xl" />
                    <div className="relative z-10 bg-white/90 backdrop-blur-sm p-6 rounded-lg border border-gray-300 shadow-lg max-w-sm">
                      <p className="text-xs text-gray-500 mb-3 text-center">Zone visible (produits sélectionnés)</p>
                      {editableData.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm py-1">
                          <span>{item.name}</span>
                          <span className="font-medium">{item.price.toFixed(2)} €</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-300 mt-3 pt-3 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{editableData.detectedAmount.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    RGPD Protégé
                  </div>
                </div>
              </div>
              {/* OCR Data */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-900">Données OCR extraites</span>
                  </div>
                  {selectedSubmission.status === "pending" && (
                    <button
                      onClick={() => { if (isEditing) { handleSaveEdit(); } else { setIsEditing(true); } }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isEditing ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {isEditing ? (<><Save className="w-4 h-4" />Enregistrer</>) : (<><Edit2 className="w-4 h-4" />Éditer</>)}
                    </button>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Numéro de ticket", key: "ticketNumber" as const, type: "text" },
                      { label: "Enseigne détectée", key: "detectedStore" as const, type: "text" },
                      { label: "Montant détecté", key: "detectedAmount" as const, type: "number" },
                      { label: "Date détectée", key: "detectedDate" as const, type: "text" },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500 mb-1.5 block">{label}</Label>
                        {isEditing ? (
                          <Input
                            type={type}
                            step={type === "number" ? "0.01" : undefined}
                            value={editableData[key]}
                            onChange={(e) =>
                              setEditableData({
                                ...editableData,
                                [key]: type === "number" ? parseFloat(e.target.value) : e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {key === "detectedAmount" ? `${editableData[key].toFixed(2)} €` : editableData[key]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Items */}
                  <div className="pt-4 border-t border-gray-100">
                    <Label className="text-xs text-gray-500 mb-2 block">Articles détectés</Label>
                    {(() => {
                      const mission = mockMissions.find((m) => m.id === selectedSubmission.missionId);
                      const isAmountBased = mission?.pointsMode === "amount_based";
                      const ppe = mission?.pointsPerEuro ?? 1;
                      return (
                        <>
                          {isAmountBased && !isEditing && (
                            <div className="flex items-center gap-3 px-2 pb-1.5 mb-1 border-b border-gray-100">
                              <span className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Article</span>
                              <span className="w-20 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Montant</span>
                              <span className="w-20 text-right text-xs font-semibold text-amber-500 uppercase tracking-wide flex items-center justify-end gap-1">
                                <Star className="w-3 h-3" />Points
                              </span>
                            </div>
                          )}
                          <div className="space-y-2">
                            {editableData.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                {isEditing ? (
                                  <>
                                    <Input value={item.name} onChange={(e) => { const ni = [...editableData.items]; ni[i].name = e.target.value; setEditableData({ ...editableData, items: ni }); }} className="flex-1 text-sm" />
                                    <Input type="number" step="0.01" value={item.price} onChange={(e) => { const ni = [...editableData.items]; ni[i].price = parseFloat(e.target.value); setEditableData({ ...editableData, items: ni }); }} className="w-24 text-sm" />
                                    {isAmountBased && <div className="w-20 flex items-center justify-end gap-1 text-xs text-amber-600 font-medium"><Star className="w-3 h-3 shrink-0" />{Math.ceil(item.price * ppe)} pts</div>}
                                  </>
                                ) : (
                                  <>
                                    <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                                    <span className="w-20 text-right text-sm font-medium text-gray-900">{item.price.toFixed(2)} €</span>
                                    {isAmountBased && <span className="w-20 text-right text-sm font-medium text-amber-600 flex items-center justify-end gap-1"><Star className="w-3 h-3 shrink-0" />{Math.ceil(item.price * ppe)} pts</span>}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                          {isAmountBased && (
                            <>
                              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                                <span className="flex-1 text-sm font-semibold text-gray-900">Total</span>
                                <span className="w-20 text-right text-sm font-semibold text-gray-900">{editableData.detectedAmount.toFixed(2)} €</span>
                                <div className="w-20 flex items-center justify-end">
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-200">
                                    <Star className="w-3 h-3 text-amber-600" />
                                    <span className="text-sm font-bold text-amber-700">{Math.ceil(editableData.detectedAmount * ppe)} pts</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">Taux : {ppe} pt{ppe > 1 ? "s" : ""} pour 1 €</p>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              {/* Actions */}
              {selectedSubmission.status === "pending" && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => { handleApprove(selectedSubmission.id); setSelectedSubmission(null); }}
                    disabled={processingIds.has(selectedSubmission.id)}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Approuver et créditer les points
                  </button>
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={processingIds.has(selectedSubmission.id)}
                    className="flex items-center gap-2 px-5 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Pre-validation Modal */}
      {preValidationSub && (() => {
        const mission = mockMissions.find((m) => m.id === preValidationSub.missionId);
        const pts = computePoints(preValidationSub);
        const isAmountBased = mission?.pointsMode === "amount_based";
        const ppe = mission?.pointsPerEuro ?? 1;
        const flags = validateSubmission(preValidationSub);
        const errorFlags = flags.filter((f) => f.type === "error");
        const warnFlags = flags.filter((f) => f.type === "warning");
        return (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
              {/* Header strip */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 pt-7 pb-8 text-center relative">
                <button
                  onClick={() => setPreValidationSub(null)}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <p className="text-white/80 text-sm mb-1">Points à créditer</p>
                <p className="text-white text-5xl font-bold tracking-tight">
                  {pts?.toLocaleString("fr-FR") ?? "–"}
                </p>
                <p className="text-white/70 text-sm mt-1">
                  {isAmountBased
                    ? `${preValidationSub.ocrData.detectedAmount.toFixed(2)} € × ${ppe} pt${ppe > 1 ? "s" : ""}/€`
                    : "Points fixes par achat"}
                </p>
              </div>
              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-2.5">
                  {[
                    { label: "Client", value: preValidationSub.userName },
                    { label: "Mission", value: preValidationSub.missionName },
                    { label: "Enseigne", value: preValidationSub.ocrData.detectedStore },
                    { label: "Montant", value: `${preValidationSub.ocrData.detectedAmount.toFixed(2)} €` },
                    { label: "Date ticket", value: preValidationSub.ocrData.detectedDate },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{value}</span>
                    </div>
                  ))}
                </div>
                {(errorFlags.length > 0 || warnFlags.length > 0) && (
                  <div className="space-y-1.5 border-t border-gray-100 pt-3">
                    {errorFlags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">{f.message}</p>
                      </div>
                    ))}
                    {warnFlags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">{f.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setPreValidationSub(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(preValidationSub.id);
                      setPreValidationSub(null);
                    }}
                    disabled={processingIds.has(preValidationSub.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Reject Dialog */}
      {showRejectDialog && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Rejeter la soumission</h3>
                  <p className="text-sm text-gray-500">{selectedSubmission.userName}</p>
                </div>
              </div>
              <div className="mb-5">
                <Label className="block mb-3 text-sm font-medium text-gray-700">
                  Motif du rejet <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {rejectionReasons.map((reason) => {
                    const Icon = reason.icon;
                    return (
                      <button
                        key={reason.value}
                        type="button"
                        onClick={() => setRejectionReason(reason.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                          rejectionReason === reason.value
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium">{reason.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mb-5">
                <Label className="block mb-2 text-sm font-medium text-gray-700">Détails supplémentaires</Label>
                <Textarea
                  value={rejectionDetails}
                  onChange={(e) => setRejectionDetails(e.target.value)}
                  placeholder="Ajoutez des précisions pour le client..."
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReject(selectedSubmission.id)}
                  disabled={!rejectionReason.trim() || processingIds.has(selectedSubmission.id)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  Confirmer le rejet
                </button>
                <button
                  onClick={() => { setShowRejectDialog(false); setRejectionReason(""); setRejectionDetails(""); }}
                  className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Audit Log Panel */}
      {showAuditLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Journal d'audit</h2>
              </div>
              <button onClick={() => setShowAuditLog(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Aucune action enregistrée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {log.action === "approved" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {log.action === "rejected" && <XCircle className="w-4 h-4 text-red-600" />}
                          {log.action === "edited" && <Edit2 className="w-4 h-4 text-blue-600" />}
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {log.action === "approved" ? "Approuvé" : log.action === "rejected" ? "Rejeté" : "Édité"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{log.timestamp.toLocaleString("fr-FR")}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{log.moderatorName}</span> · Soumission {log.submissionId}
                      </p>
                      {log.details && <p className="text-xs text-gray-500 mt-1">{log.details}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
