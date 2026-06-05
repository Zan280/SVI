import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axios from 'axios';

export const ExportButtons = ({ 
  excelData = [], 
  excelHeaders = {}, 
  excelFilename = 'export', 
  pdfDownloadUrl = '', 
  pdfFilename = 'report.pdf' 
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleExportExcel = () => {
    if (!excelData || excelData.length === 0) {
      alert('No hay datos para exportar a Excel.');
      return;
    }

    try {
      // 1. Mapear datos a nombres de columnas amigables
      const mappedData = excelData.map(item => {
        const row = {};
        Object.entries(excelHeaders).forEach(([key, label]) => {
          // Si el valor es un objeto o función de formateo, extraerlo o llamarlo
          let val = item[key];
          if (typeof val === 'object' && val !== null) {
            val = val.nombre || val.codigo || JSON.stringify(val);
          }
          row[label] = val;
        });
        return row;
      });

      // 2. Crear hoja de cálculo
      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

      // 3. Escribir y guardar
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${excelFilename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Ocurrió un error al exportar a Excel.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!pdfDownloadUrl) return;

    setDownloadingPdf(true);
    try {
      const response = await axios.get(pdfDownloadUrl, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, pdfFilename);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al generar el PDF oficial en el servidor.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Botón Excel (Cliente) */}
      <button
        onClick={handleExportExcel}
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all duration-200"
        title="Exportar datos editables a Excel para análisis"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>Exportar Excel</span>
      </button>

      {/* Botón PDF (Servidor WeasyPrint) */}
      {pdfDownloadUrl && (
        <button
          onClick={handleDownloadPdf}
          type="button"
          disabled={downloadingPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-400 active:scale-95 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all duration-200"
          title="Descargar reporte oficial no editable (PDF)"
        >
          {downloadingPdf ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span>{downloadingPdf ? 'Generando...' : 'Descargar PDF'}</span>
        </button>
      )}
    </div>
  );
};

export default ExportButtons;
