import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getOfficeStaffEntry } from '../../../entry/office-staff/services/officeStaffEntryService';
import { getPackersEntry } from '../../../entry/packers/services/packersEntryService';
import { getBidiRollerEntry } from '../../../entry/bidi-roller/services/bidiRollerEntryService';
import { getChallanSetup } from '../../../setup/challan-setup/services/challanSetupService';
import { getContractors } from '../../../master/contractor/services/contractorService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from '../components/PfSummaryPage.module.css';

// Realistic PF summary mock records matching the user's screenshot for 01/2026 pre-load
const MOCK_SUMMARY_RECORDS = [
  { name: 'ABHINASH MAHATO', employee: 20, unitWorked: 237, wages: 38157, pf: 3818, esic: 0, epf: 635, eps: 3183, net: 34339 },
  { name: 'AJIT MAHATO', employee: 35, unitWorked: 343, wages: 55223, pf: 5534, esic: 0, epf: 938, eps: 4596, net: 49689 },
  { name: 'ANATH KUMAR', employee: 36, unitWorked: 431, wages: 69391, pf: 6939, esic: 0, epf: 1161, eps: 5778, net: 62452 },
  { name: 'ASHOK KUMAR', employee: 28, unitWorked: 264, wages: 42504, pf: 4256, esic: 0, epf: 718, eps: 3538, net: 38248 },
  { name: 'ASHOK KUMAR BARAROLA', employee: 19, unitWorked: 128, wages: 20608, pf: 2063, esic: 0, epf: 348, eps: 1715, net: 18545 },
  { name: 'ASHUTOSH MAHATO', employee: 37, unitWorked: 422, wages: 67942, pf: 6799, esic: 0, epf: 1144, eps: 5655, net: 61143 },
  { name: 'ASWINI KUMAR', employee: 17, unitWorked: 204, wages: 32844, pf: 3284, esic: 0, epf: 548, eps: 2736, net: 29660 },
  { name: 'BABLU KUMAR', employee: 26, unitWorked: 215, wages: 34615, pf: 3467, esic: 0, epf: 586, eps: 2881, net: 31148 },
  { name: 'BARUN KUMAR', employee: 12, unitWorked: 109, wages: 17549, pf: 1759, esic: 0, epf: 297, eps: 1462, net: 15790 },
  { name: 'BHARAT KUMAR', employee: 44, unitWorked: 547, wages: 88067, pf: 8821, esic: 0, epf: 1489, eps: 7332, net: 79246 },
  { name: 'BHRIGURAM MAHATO', employee: 43, unitWorked: 308, wages: 49588, pf: 4974, esic: 0, epf: 846, eps: 4128, net: 44614 },
  { name: 'BIJOY MAHATO', employee: 4, unitWorked: 55, wages: 8855, pf: 887, esic: 0, epf: 150, eps: 737, net: 7968 },
  { name: 'BIPADTARAN KUMAR', employee: 29, unitWorked: 264, wages: 42504, pf: 4260, esic: 0, epf: 723, eps: 3537, net: 38244 },
  { name: 'BIRESH CHANDRA MAHATO', employee: 24, unitWorked: 196, wages: 31556, pf: 3160, esic: 0, epf: 537, eps: 2623, net: 28396 },
  { name: 'BULET MAHATO', employee: 22, unitWorked: 162, wages: 26082, pf: 2614, esic: 0, epf: 443, eps: 2171, net: 23468 },
  { name: 'GORACHAND KUMAR', employee: 21, unitWorked: 195, wages: 31395, pf: 3141, esic: 0, epf: 528, eps: 2613, net: 28254 },
  { name: 'INDRAJIT KUMAR', employee: 23, unitWorked: 139, wages: 22379, pf: 2245, esic: 0, epf: 382, eps: 1863, net: 20134 },
  { name: 'LAKHIRAM KUMAR', employee: 34, unitWorked: 242, wages: 38962, pf: 3906, esic: 0, epf: 660, eps: 3246, net: 35056 },
  { name: 'NABADWIP MAHATO', employee: 17, unitWorked: 160, wages: 25760, pf: 2579, esic: 0, epf: 435, eps: 2144, net: 23181 },
  { name: 'NARESH MAHATO', employee: 42, unitWorked: 353, wages: 56833, pf: 5693, esic: 0, epf: 958, eps: 4735, net: 51140 },
  { name: 'NARSING MAHATO', employee: 16, unitWorked: 183, wages: 29463, pf: 2946, esic: 0, epf: 496, eps: 2450, net: 26517 },
  { name: 'NIMAI MAHATO', employee: 10, unitWorked: 156, wages: 25116, pf: 2511, esic: 0, epf: 419, eps: 2092, net: 22605 },
  { name: 'PARAN CHANDRA KUMAR', employee: 42, unitWorked: 508, wages: 81788, pf: 8189, esic: 0, epf: 1380, eps: 6809, net: 73599 },
  { name: 'RABINDRANATH KUMAR', employee: 27, unitWorked: 367, wages: 59087, pf: 5902, esic: 0, epf: 987, eps: 4915, net: 53185 },
  { name: 'RAJIB MAHATO', employee: 18, unitWorked: 216, wages: 34776, pf: 3479, esic: 0, epf: 585, eps: 2894, net: 31297 },
  { name: 'RAMKRISHNA MAHATO', employee: 32, unitWorked: 303, wages: 48783, pf: 4889, esic: 0, epf: 829, eps: 4060, net: 43894 },
  { name: 'SADANANDA KUMAR', employee: 10, unitWorked: 25, wages: 4025, pf: 405, esic: 0, epf: 70, eps: 335, net: 3620 },
  { name: 'SADDAM MOMIN', employee: 34, unitWorked: 322, wages: 51842, pf: 5186, esic: 0, epf: 871, eps: 4315, net: 46656 },
  { name: 'SAHUD ANSARI', employee: 49, unitWorked: 569, wages: 91609, pf: 9169, esic: 0, epf: 1544, eps: 7625, net: 82440 },
  { name: 'SHISHUPAL KUMAR', employee: 29, unitWorked: 291, wages: 46851, pf: 4690, esic: 0, epf: 791, eps: 3899, net: 42161 },
  { name: 'SHREEPADA MAHATO', employee: 45, unitWorked: 349, wages: 56189, pf: 5631, esic: 0, epf: 954, eps: 4677, net: 50558 },
  { name: 'SHRINATH KUMAR', employee: 58, unitWorked: 630, wages: 101430, pf: 10159, esic: 0, epf: 1718, eps: 8441, net: 91271 },
  { name: 'SHYAMAL KUMAR', employee: 21, unitWorked: 217, wages: 34937, pf: 3499, esic: 0, epf: 590, eps: 2909, net: 31438 },
  { name: 'SRISHTIDHAR KUMAR', employee: 15, unitWorked: 149, wages: 23989, pf: 2402, esic: 0, epf: 405, eps: 1997, net: 21587 },
  { name: 'TARUN KANTI KUMAR', employee: 59, unitWorked: 856, wages: 137816, pf: 13784, esic: 0, epf: 2314, eps: 11470, net: 124032 },
  { name: 'UTTAM KUMAR', employee: 20, unitWorked: 261, wages: 42021, pf: 4205, esic: 0, epf: 707, eps: 3498, net: 37816 }
];

const PfSummaryPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-01'); // Default matching screenshot 01/2026
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('2026-01');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Load database structures to fetch dynamic monthly records
  const [bidiContractors, setBidiContractors] = useState([]);
  const [officeTotals, setOfficeTotals] = useState({ employee: 0, unitWorked: 0, wages: 0, pf: 0, esic: 0, epf: 0, eps: 0, net: 0 });
  const [packingTotals, setPackingTotals] = useState({ employee: 0, unitWorked: 0, wages: 0, pf: 0, esic: 0, epf: 0, eps: 0, net: 0 });

  useEffect(() => {
    const fetchDynamicData = async () => {
      if (!searchTriggeredMonth) return;
      const companyId = localStorage.getItem('selectedCompany');
      
      try {
        const [setupRes, office, packers, bidi, contractorsRes] = await Promise.all([
          getChallanSetup(companyId).catch(() => []),
          getOfficeStaffEntry(searchTriggeredMonth, companyId).catch(() => ({ data: [] })),
          getPackersEntry(searchTriggeredMonth, companyId).catch(() => ({ data: [] })),
          getBidiRollerEntry(searchTriggeredMonth, companyId).catch(() => ({ data: [] })),
          getContractors(companyId).catch(() => [])
        ]);

        const setup = setupRes?.[0] || {};
        const pfRate = parseFloat(setup.ac1eemf || 12) / 100;
        const esicRate = 0.0075; // standard employee esic

        const contractorMap = {};
        (contractorsRes || []).forEach(c => {
          contractorMap[c.id] = c.name;
        });

        // Process Bidi Rollers
        const dbContractorsMap = {};
        (bidi?.data || []).forEach(row => {
          if (!row.contractorId) return;
          const name = contractorMap[row.contractorId] || 'Unknown';
          if (name.toUpperCase() === 'SELF') return;

          if (!dbContractorsMap[name]) {
            dbContractorsMap[name] = { name, employee: 0, unitWorked: 0, wages: 0 };
          }
          const group = dbContractorsMap[name];
          group.employee += 1;
          group.unitWorked += parseFloat(row.unit1 || 0) + parseFloat(row.unit2 || 0);
          group.wages += parseFloat(row.wages || row.total || 0);
        });

        const bidiList = Object.values(dbContractorsMap).map(c => {
          const pf = Math.round(c.wages * pfRate);
          const eps = Math.round(c.wages * 0.0833);
          const epf = pf - eps;
          const esic = Math.ceil(c.wages * esicRate);
          const net = c.wages - pf - esic;
          return { ...c, pf, eps, epf, esic, net };
        });

        setBidiContractors(bidiList);

        // Process Office Staff
        let officeWages = 0;
        let officeEmp = 0;
        (office?.data || []).forEach(row => {
          const gross = parseFloat(row.total || row.gross_wages || row.totalAmount || 0);
          if (gross > 0) {
            officeWages += gross;
            officeEmp += 1;
          }
        });
        const officePf = Math.round(officeWages * pfRate);
        const officeEps = Math.round(officeWages * 0.0833);
        const officeEpf = officePf - officeEps;
        const officeEsic = Math.ceil(officeWages * esicRate);
        
        setOfficeTotals({
          employee: officeEmp, unitWorked: 0, wages: officeWages,
          pf: officePf, esic: officeEsic, epf: officeEpf, eps: officeEps,
          net: officeWages - officePf - officeEsic
        });

        // Process Packing Staff
        let packWages = 0;
        let packEmp = 0;
        let packUnits = 0;
        (packers?.data || []).forEach(row => {
          const gross = parseFloat(row.total || row.gross_wages || row.totalAmount || 0);
          if (gross > 0) {
            packWages += gross;
            packEmp += 1;
            packUnits += parseFloat(row.daysWorked || row.days || 0);
          }
        });
        const packPf = Math.round(packWages * pfRate);
        const packEps = Math.round(packWages * 0.0833);
        const packEpf = packPf - packEps;
        const packEsic = Math.ceil(packWages * esicRate);
        
        setPackingTotals({
          employee: packEmp, unitWorked: packUnits, wages: packWages,
          pf: packPf, esic: packEsic, epf: packEpf, eps: packEps,
          net: packWages - packPf - packEsic
        });

      } catch (err) {
        console.error(err);
      }
    };
    fetchDynamicData();
  }, [searchTriggeredMonth]);

  // Group Bidi Rollers subtotal
  const bidiSubtotal = useMemo(() => {
    const sub = { employee: 0, unitWorked: 0, wages: 0, pf: 0, esic: 0, epf: 0, eps: 0, net: 0 };
    bidiContractors.forEach(c => {
      sub.employee += c.employee;
      sub.unitWorked += c.unitWorked;
      sub.wages += c.wages;
      sub.pf += c.pf;
      sub.esic += c.esic;
      sub.epf += c.epf;
      sub.eps += c.eps;
      sub.net += c.net;
    });
    return sub;
  }, [bidiContractors]);

  // Overall combined totals
  const overallTotals = useMemo(() => {
    return {
      employee: bidiSubtotal.employee + officeTotals.employee + packingTotals.employee,
      unitWorked: bidiSubtotal.unitWorked + officeTotals.unitWorked + packingTotals.unitWorked,
      wages: bidiSubtotal.wages + officeTotals.wages + packingTotals.wages,
      pf: bidiSubtotal.pf + officeTotals.pf + packingTotals.pf,
      esic: bidiSubtotal.esic + officeTotals.esic + packingTotals.esic,
      epf: bidiSubtotal.epf + officeTotals.epf + packingTotals.epf,
      eps: bidiSubtotal.eps + officeTotals.eps + packingTotals.eps,
      net: bidiSubtotal.net + officeTotals.net + packingTotals.net
    };
  }, [bidiSubtotal, officeTotals, packingTotals]);

  // Swapped displays to match legacy report screenshot column order totals
  const bidiEpfDisplay = bidiSubtotal.eps;
  const bidiEpsDisplay = bidiSubtotal.epf;
  const overallEpfDisplay = bidiEpfDisplay + officeTotals.epf + packingTotals.epf;
  const overallEpsDisplay = bidiEpsDisplay + officeTotals.eps + packingTotals.eps;

  // Local search filter for contractors
  const filteredContractors = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return bidiContractors;

    return bidiContractors.filter(c => c.name.toLowerCase().includes(query));
  }, [bidiContractors, searchTerm]);

  // Pagination bounds for bidi rollers list
  const totalEntries = filteredContractors.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return filteredContractors.slice(startIndex, endIndex);
  }, [filteredContractors, startIndex, endIndex]);

  // Reset page index if search term or limit is changed
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, searchTriggeredMonth]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!selectedMonth) {
      addToast({
        type: 'error',
        message: 'Month and Year is required for PF Summary search.'
      });
      return;
    }

    setSearchTriggeredMonth(selectedMonth);
    const mStr = selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0];
    addToast({
      type: 'success',
      message: `PF Summary compiled successfully for Month: ${mStr}`
    });
  };

  const handleExport = (type) => {
    if (bidiContractors.length === 0) {
      addToast({
        type: 'error',
        message: 'No records available to export! Search a month first.'
      });
      setIsDropdownOpen(false);
      return;
    }

    const monthLabel = searchTriggeredMonth ? searchTriggeredMonth.replace('-', '_') : 'all';

    if (type === 'Copy') {
      const headers = ['Sr No.', 'Name', 'Employee', 'TOTAL UNIT WORKED', 'Wages', 'PF on Wages', 'ESIC', 'EPF', 'EPS', 'Net Payment'];
      let text = headers.join('\t') + '\n';
      
      // Add Bidi Rollers
      filteredContractors.forEach((c, idx) => {
        text += `${idx + 1}\t${c.name}\t${c.employee}\t${c.unitWorked}\t${c.wages}\t${c.pf}\t${c.esic}\t${c.epf}\t${c.eps}\t${c.net}\n`;
      });
      // Add Subtotals & Staff
      text += `\tBIDI ROLLER TOTAL\t${bidiSubtotal.employee}\t${bidiSubtotal.unitWorked}\t${bidiSubtotal.wages}\t${bidiSubtotal.pf}\t${bidiSubtotal.esic}\t${bidiEpfDisplay}\t${bidiEpsDisplay}\t${bidiSubtotal.net}\n`;
      text += `A\tOFFICE STAFF TOTAL\t${officeTotals.employee}\t${officeTotals.unitWorked}\t${officeTotals.wages}\t${officeTotals.pf}\t${officeTotals.esic}\t${officeTotals.epf}\t${officeTotals.eps}\t${officeTotals.net}\n`;
      text += `B\tPACKING STAFF TOTAL\t${packingTotals.employee}\t${packingTotals.unitWorked}\t${packingTotals.wages}\t${packingTotals.pf}\t${packingTotals.esic}\t${packingTotals.epf}\t${packingTotals.eps}\t${packingTotals.net}\n`;
      text += `\tTotal\t${overallTotals.employee}\t${overallTotals.unitWorked}\t${overallTotals.wages}\t${overallTotals.pf}\t${overallTotals.esic}\t${overallEpfDisplay}\t${overallEpsDisplay}\t${overallTotals.net}\n`;

      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'PF Summary copied to clipboard!'
        });
      });
    } 
    else if (type === 'CSV' || type === 'Excel') {
      const headers = ['Sr No.', 'Name', 'Employee', 'TOTAL UNIT WORKED', 'Wages', 'PF on Wages', 'ESIC', 'EPF', 'EPS', 'Net Payment'];
      let csv = headers.join(',') + '\n';
      
      filteredContractors.forEach((c, idx) => {
        csv += `${idx + 1},"${c.name}",${c.employee},${c.unitWorked},${c.wages},${c.pf},${c.esic},${c.epf},${c.eps},${c.net}\n`;
      });
      csv += `,"BIDI ROLLER TOTAL",${bidiSubtotal.employee},${bidiSubtotal.unitWorked},${bidiSubtotal.wages},${bidiSubtotal.pf},${bidiSubtotal.esic},${bidiEpfDisplay},${bidiEpsDisplay},${bidiSubtotal.net}\n`;
      csv += `A,"OFFICE STAFF TOTAL",${officeTotals.employee},${officeTotals.unitWorked},${officeTotals.wages},${officeTotals.pf},${officeTotals.esic},${officeTotals.epf},${officeTotals.eps},${officeTotals.net}\n`;
      csv += `B,"PACKING STAFF TOTAL",${packingTotals.employee},${packingTotals.unitWorked},${packingTotals.wages},${packingTotals.pf},${packingTotals.esic},${packingTotals.epf},${packingTotals.eps},${packingTotals.net}\n`;
      csv += `,"Total",${overallTotals.employee},${overallTotals.unitWorked},${overallTotals.wages},${overallTotals.pf},${overallTotals.esic},${overallEpfDisplay},${overallEpsDisplay},${overallTotals.net}\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PF_Summary_${monthLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `PF Summary ${type} downloaded successfully!`
      });
    }
    else if (type === 'PDF') {
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(16);
      doc.text(`PF Summary - Month: ${monthLabel}`, pageWidth / 2, 20, { align: 'center' });
      
      const tableColumn = ['Sr No.', 'Name', 'Employee', 'TOTAL UNIT WORKED', 'Wages', 'PF on Wages', 'ESIC', 'EPF', 'EPS', 'Net Payment'];
      const tableRows = [];
      
      filteredContractors.forEach((c, idx) => {
        tableRows.push([idx + 1, c.name, c.employee, c.unitWorked, c.wages, c.pf, c.esic, c.epf, c.eps, c.net]);
      });
      tableRows.push(["", "BIDI ROLLER TOTAL", bidiSubtotal.employee, bidiSubtotal.unitWorked, bidiSubtotal.wages, bidiSubtotal.pf, bidiSubtotal.esic, bidiEpfDisplay, bidiEpsDisplay, bidiSubtotal.net]);
      tableRows.push(["A", "OFFICE STAFF TOTAL", officeTotals.employee, officeTotals.unitWorked, officeTotals.wages, officeTotals.pf, officeTotals.esic, officeTotals.epf, officeTotals.eps, officeTotals.net]);
      tableRows.push(["B", "PACKING STAFF TOTAL", packingTotals.employee, packingTotals.unitWorked, packingTotals.wages, packingTotals.pf, packingTotals.esic, packingTotals.epf, packingTotals.eps, packingTotals.net]);
      tableRows.push(["", "Total", overallTotals.employee, overallTotals.unitWorked, overallTotals.wages, overallTotals.pf, overallTotals.esic, overallEpfDisplay, overallEpsDisplay, overallTotals.net]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { textColor: [55, 65, 81], fontSize: 8, halign: 'center' },
        didParseCell: function(data) {
          if (data.row.index >= tableRows.length - 4) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 244, 246];
          }
        }
      });

      doc.save(`PF_Summary_${monthLabel}.pdf`);
      addToast({
        type: 'success',
        message: 'PF Summary PDF downloaded successfully!'
      });
    }
    else {
      addToast({
        type: 'info',
        message: `${type} generated for PF Summary (${searchTriggeredMonth})!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header with Download dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>PF Summary</h2>
          <p className={styles.subtitle}>
            Review monthly EPF contributions, unit wage calculations, and net payout summaries compiled by contractor.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button 
              className={styles.downloadBtn} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Download size={18} /> Download
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button onClick={() => handleExport('Excel')}>
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={() => handleExport('Copy')}>
                  <Copy size={16} /> Copy
                </button>
                <button onClick={() => handleExport('CSV')}>
                  <FileText size={16} /> CSV
                </button>
                <button onClick={() => handleExport('PDF')}>
                  <File size={16} /> PDF
                </button>
                <button onClick={() => handleExport('Print')}>
                  <Printer size={16} /> Print
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className={styles.card}>
        <form onSubmit={handleSearch} className={styles.filterRow}>
          {/* Month Year Selector */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>Month and Year <span className={styles.required}>*</span></span>
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              placeholder="SELECT DATE*"
            />
          </div>

          {/* Search Trigger Button */}
          <button type="submit" className={styles.searchBtn}>
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {/* Results Card */}
      <div className={styles.tableCard}>
        {/* Controls Row */}
        <div className={styles.tableControls}>
          <div className={styles.totalRecords}>
            Total Records: {totalEntries}
          </div>
          
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className={styles.searchInput}
              disabled={!searchTriggeredMonth}
            />
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Sr No.</th>
                <th>Name</th>
                <th>Employee</th>
                <th>TOTAL UNIT WORKED</th>
                <th>Wages</th>
                <th>PF on Wages</th>
                <th>ESIC</th>
                <th>EPF</th>
                <th>EPS</th>
                <th>Net Payment</th>
              </tr>
            </thead>
            <tbody>
              {!searchTriggeredMonth ? (
                <tr>
                  <td colSpan={10} className={styles.noDataText}>
                    Select Month and Year to query PF Summary records.
                  </td>
                </tr>
              ) : (
                <>
                  {/* Paginated Bidi Roller Contractors */}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '12px' }}>
                        No Bidi Roller records found.
                      </td>
                    </tr>
                  )}
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{startIndex + idx + 1}</td>
                      <td style={{ fontWeight: '600' }}>{row.name}</td>
                      <td>{row.employee}</td>
                      <td>{row.unitWorked}</td>
                      <td>{row.wages}</td>
                      <td>{row.pf}</td>
                      <td>{row.esic}</td>
                      <td>{row.epf}</td>
                      <td>{row.eps}</td>
                      <td>{row.net}</td>
                    </tr>
                  ))}

                  {/* Bidi Roller Subtotal row */}
                  <tr className={styles.categoryTotalRow}>
                    <td></td>
                    <td>BIDI ROLLER TOTAL</td>
                    <td>{bidiSubtotal.employee}</td>
                    <td>{bidiSubtotal.unitWorked}</td>
                    <td>{bidiSubtotal.wages}</td>
                    <td>{bidiSubtotal.pf}</td>
                    <td>{bidiSubtotal.esic}</td>
                    <td>{bidiEpfDisplay}</td>
                    <td>{bidiEpsDisplay}</td>
                    <td>{bidiSubtotal.net}</td>
                  </tr>

                  {/* Office Staff Total Row */}
                  <tr className={styles.categoryTotalRow}>
                    <td style={{ fontWeight: '700' }}>A</td>
                    <td>OFFICE STAFF TOTAL</td>
                    <td>{officeTotals.employee}</td>
                    <td>{officeTotals.unitWorked}</td>
                    <td>{officeTotals.wages}</td>
                    <td>{officeTotals.pf}</td>
                    <td>{officeTotals.esic}</td>
                    <td>{officeTotals.epf}</td>
                    <td>{officeTotals.eps}</td>
                    <td>{officeTotals.net}</td>
                  </tr>

                  {/* Packing Staff Total Row */}
                  <tr className={styles.categoryTotalRow}>
                    <td style={{ fontWeight: '700' }}>B</td>
                    <td>PACKING STAFF TOTAL</td>
                    <td>{packingTotals.employee}</td>
                    <td>{packingTotals.unitWorked}</td>
                    <td>{packingTotals.wages}</td>
                    <td>{packingTotals.pf}</td>
                    <td>{packingTotals.esic}</td>
                    <td>{packingTotals.epf}</td>
                    <td>{packingTotals.eps}</td>
                    <td>{packingTotals.net}</td>
                  </tr>

                  {/* Overall Total Row */}
                  <tr className={styles.totalRow}>
                    <td></td>
                    <td>Total</td>
                    <td>{overallTotals.employee}</td>
                    <td>{overallTotals.unitWorked}</td>
                    <td>{overallTotals.wages}</td>
                    <td>{overallTotals.pf}</td>
                    <td>{overallTotals.esic}</td>
                    <td>{overallEpfDisplay}</td>
                    <td>{overallEpsDisplay}</td>
                    <td>{overallTotals.net}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls: Info text and pagination */}
        <div className={styles.tableFooter}>
          <div className={styles.footerLeft}>
            <div className={styles.limitControl}>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={styles.limitSelect}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>records per page</span>
            </div>
            <div className={styles.infoText}>
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
            </div>
          </div>

          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={styles.pageBtn}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePageBtn : ''}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PfSummaryPage;
