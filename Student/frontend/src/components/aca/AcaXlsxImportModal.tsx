"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
}

interface AcaXlsxImportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: ImportField[];
  onImport: (mappedRows: any[], updateProgress: (current: number, total: number) => void) => Promise<void>;
  templateDescription?: string;
}

export function AcaXlsxImportModal({
  open,
  onClose,
  title,
  fields,
  onImport,
  templateDescription,
}: AcaXlsxImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  // Progress states
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (!open) {
      setFile(null);
      setHeaders([]);
      setExcelData([]);
      setMappings({});
      setIsImporting(false);
      setProgress({ current: 0, total: 0 });
      setImportLogs([]);
      setErrorMsg(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Read as array of arrays to preserve column order
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        if (data.length === 0) {
          throw new Error("File Excel không có dữ liệu hoặc trống.");
        }

        // Get header names
        const rawHeaders = (data[0] || []).map((h) => String(h).trim());
        setHeaders(rawHeaders);
        setExcelData(data.slice(1) as any[][]);

        // Auto-guess mappings
        const initialMappings: Record<string, string> = {};
        fields.forEach((field) => {
          const match = rawHeaders.find((h) => {
            const hLower = h.toLowerCase();
            const fLower = field.label.toLowerCase();
            const kLower = field.key.toLowerCase();
            return (
              hLower === fLower ||
              hLower.includes(fLower) ||
              fLower.includes(hLower) ||
              hLower === kLower ||
              hLower.includes(kLower)
            );
          });
          if (match) {
            initialMappings[field.key] = match;
          } else {
            initialMappings[field.key] = "";
          }
        });
        setMappings(initialMappings);
      } catch (err: any) {
        setErrorMsg("Không đọc được file Excel: " + (err.message || String(err)));
        setFile(null);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleMappingChange = (fieldKey: string, headerName: string) => {
    setMappings((prev) => ({
      ...prev,
      [fieldKey]: headerName,
    }));
  };

  // Get preview data based on current mappings
  const getPreviewRows = () => {
    return excelData.slice(0, 3).map((row) => {
      const mappedRow: Record<string, any> = {};
      fields.forEach((field) => {
        const headerName = mappings[field.key];
        const colIndex = headers.indexOf(headerName);
        mappedRow[field.key] = colIndex !== -1 ? row[colIndex] ?? "" : "";
      });
      return mappedRow;
    });
  };

  const handleConfirmImport = async () => {
    // Validate required fields
    const missingFields = fields
      .filter((f) => f.required && !mappings[f.key])
      .map((f) => f.label);
    
    if (missingFields.length > 0) {
      setErrorMsg(`Vui lòng ánh xạ các cột bắt buộc: ${missingFields.join(", ")}`);
      return;
    }

    setErrorMsg(null);
    setIsImporting(true);
    setImportLogs(["Bắt đầu phân tích hàng dữ liệu..."]);

    // Map all rows
    const mappedRows = excelData
      .map((row, index) => {
        const item: Record<string, any> = {};
        fields.forEach((field) => {
          const headerName = mappings[field.key];
          const colIndex = headers.indexOf(headerName);
          item[field.key] = colIndex !== -1 ? row[colIndex] : undefined;
        });
        const result: Record<string, any> = { rowNum: index + 2, ...item };
        return result;
      })
      .filter((item) => {
        // filter empty rows (where all values except rowNum are undefined or empty)
        return Object.keys(item).some((key) => key !== "rowNum" && item[key] !== undefined && String(item[key]).trim() !== "");
      });

    if (mappedRows.length === 0) {
      setErrorMsg("Không tìm thấy dòng dữ liệu hợp lệ nào để nhập.");
      setIsImporting(false);
      return;
    }

    setProgress({ current: 0, total: mappedRows.length });

    try {
      await onImport(mappedRows, (current, total) => {
        setProgress({ current, total });
        setImportLogs((prev) => [
          ...prev,
          `Đã hoàn thành ${current}/${total} dòng...`,
        ]);
      });
      
      setImportLogs((prev) => [...prev, "🎉 Nhập dữ liệu thành công!"]);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setImportLogs((prev) => [...prev, `❌ Lỗi: ${err.message || String(err)}`]);
      setErrorMsg(err.message || "Đã xảy ra lỗi trong quá trình import dữ liệu.");
      setIsImporting(false);
    }
  };

  const previewRows = getPreviewRows();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl border border-primary/15 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <h3 className="text-base font-black uppercase tracking-wide text-foreground">{title}</h3>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 max-h-[60vh] overflow-y-auto pr-2 space-y-6">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* File select drop zone */}
          {!file && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center bg-zinc-50 hover:bg-zinc-50/50 transition-colors">
              <svg className="h-10 w-10 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              </svg>
              <div className="mt-3 text-xs font-bold text-zinc-700">Chọn tệp dữ liệu Excel của bạn</div>
              <p className="mt-1 text-[11px] text-zinc-500 max-w-sm">
                Chấp nhận các định dạng `.xlsx`, `.xls` hoặc `.csv`.
                {templateDescription ? ` ${templateDescription}` : ""}
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase text-white shadow-premium hover:shadow-hover transition-all"
              >
                Chọn file từ thiết bị
              </button>
            </div>
          )}

          {file && !isImporting && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success-soft/20 p-4 text-xs font-semibold text-zinc-700">
                <svg className="h-6 w-6 text-success shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-success text-[13px]">{file.name}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Đã phát hiện <strong>{headers.length} cột</strong> và <strong>{excelData.length} hàng</strong> dữ liệu.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded-lg bg-white border border-zinc-200 px-3 py-1.5 text-[11px] font-black uppercase text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  Chọn lại
                </button>
              </div>

              {/* Column Mapping Section */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-muted mb-3">Ánh xạ tiêu đề cột</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {fields.map((field) => (
                    <div key={field.key} className="rounded-xl border border-zinc-150 p-3 bg-zinc-50/50">
                      <label className="text-[11px] font-bold text-zinc-700 block mb-1.5">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={mappings[field.key] || ""}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                      >
                        <option value="">-- Bỏ qua cột này --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Table */}
              {previewRows.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted mb-3">Xem trước 3 dòng dữ liệu</h4>
                  <div className="overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black text-muted uppercase">
                          {fields.map((field) => (
                            <th key={field.key} className="px-4 py-3 font-black">
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-600 bg-white">
                        {previewRows.map((row, idx) => (
                          <tr key={idx}>
                            {fields.map((field) => (
                              <td key={field.key} className="px-4 py-2.5 truncate max-w-[150px]">
                                {row[field.key] !== undefined ? String(row[field.key]) : "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import progress logs */}
          {isImporting && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                <span>Đang xử lý nhập dữ liệu...</span>
                <span>
                  {progress.current} / {progress.total} hàng ({progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>

              {/* Logs box */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-[11px] text-zinc-300 max-h-48 overflow-y-auto space-y-1">
                {importLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-black uppercase text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors disabled:opacity-50"
          >
            Đóng
          </button>
          {file && !isImporting && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="rounded-xl bg-success px-5 py-2 text-xs font-black uppercase text-white shadow-premium hover:shadow-hover hover:-translate-y-0.5 transition-all"
            >
              Xác nhận Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
