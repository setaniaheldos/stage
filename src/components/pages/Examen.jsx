import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const FactureTousPatients = () => {
  const { cinPatient } = useParams();

  const [patients, setPatients] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [praticiens, setPraticiens] = useState([]);
  const [examens, setExamens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    montantMin: '',
    montantMax: '',
    praticien: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalRevenue: 0,
    consultationsMoyennes: 0,
    patientPlusActif: ''
  });

  // Appliquer le dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pat, rdv, consult, presc, prat, exam] = await Promise.all([
          axios.get('http://localhost:3001/patients'),
          axios.get('http://localhost:3001/rendezvous'),
          axios.get('http://localhost:3001/consultations'),
          axios.get('http://localhost:3001/prescriptions'),
          axios.get('http://localhost:3001/praticiens'),
          axios.get('http://localhost:3001/examens')
        ]);

        let filteredPatients = pat.data;
        if (cinPatient) {
          filteredPatients = filteredPatients.filter(p => p.cinPatient === cinPatient);
          if (filteredPatients.length > 0) setSelectedPatient(filteredPatients[0]);
        }

        setPatients(filteredPatients);
        setRdvs(rdv.data);
        setConsultations(consult.data);
        setPrescriptions(presc.data);
        setPraticiens(prat.data);
        setExamens(exam.data);

        // Calcul des statistiques
        calculateStats(filteredPatients, consult.data, rdv.data);
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cinPatient]);

  const calculateStats = (patientsData, consultationsData, rendezvousData) => {
    const totalPatients = patientsData.length;
    
    const totalRevenue = patientsData.reduce((sum, patient) => {
      const patientRdvs = rendezvousData.filter(r => r.cinPatient === patient.cinPatient);
      const patientConsults = consultationsData.filter(c => 
        patientRdvs.some(r => r.idRdv === c.idRdv)
      );
      return sum + patientConsults.reduce((s, c) => s + parseFloat(c.prix || 0), 0);
    }, 0);

    const consultationsMoyennes = totalPatients > 0 
      ? (consultationsData.length / totalPatients).toFixed(1)
      : 0;

    // Trouver le patient avec le plus de consultations
    const patientConsultCounts = patientsData.map(patient => {
      const patientRdvs = rendezvousData.filter(r => r.cinPatient === patient.cinPatient);
      const consultCount = consultationsData.filter(c => 
        patientRdvs.some(r => r.idRdv === c.idRdv)
      ).length;
      return { patient, count: consultCount };
    });

    const patientPlusActif = patientConsultCounts.reduce((max, current) => 
      current.count > max.count ? current : max, { count: 0, patient: null }
    );

    setStats({
      totalPatients,
      totalRevenue: totalRevenue.toFixed(2),
      consultationsMoyennes,
      patientPlusActif: patientPlusActif.patient 
        ? `${patientPlusActif.patient.prenom} ${patientPlusActif.patient.nom}`
        : 'Aucun'
    });
  };

  const normalize = (str) => str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

  const filteredPatients = useMemo(() => {
    let filtered = patients.filter(p =>
      normalize(`${p.prenom} ${p.nom}`).includes(normalize(searchTerm)) ||
      p.cinPatient.includes(searchTerm)
    );

    // Appliquer les filtres avancés
    if (filters.dateDebut || filters.dateFin || filters.montantMin || filters.montantMax || filters.praticien) {
      filtered = filtered.filter(patient => {
        const { rdvDetails } = getPatientData(patient);
        
        if (filters.dateDebut || filters.dateFin) {
          const hasMatchingDate = rdvDetails.some(rdv => {
            const rdvDate = new Date(rdv.dateHeure);
            const dateMatch = (!filters.dateDebut || rdvDate >= new Date(filters.dateDebut)) &&
                            (!filters.dateFin || rdvDate <= new Date(filters.dateFin + 'T23:59:59'));
            return dateMatch;
          });
          if (!hasMatchingDate) return false;
        }

        if (filters.montantMin || filters.montantMax) {
          const total = parseFloat(getPatientData(patient).total);
          const montantMatch = (!filters.montantMin || total >= parseFloat(filters.montantMin)) &&
                             (!filters.montantMax || total <= parseFloat(filters.montantMax));
          if (!montantMatch) return false;
        }

        if (filters.praticien) {
          const hasMatchingPraticien = rdvDetails.some(rdv => 
            normalize(rdv.praticienNom).includes(normalize(filters.praticien))
          );
          if (!hasMatchingPraticien) return false;
        }

        return true;
      });
    }

    return filtered;
  }, [patients, searchTerm, filters]);

  const getPraticienInfo = (cinPraticien) => {
    const prat = praticiens.find(p => p.cinPraticien === cinPraticien);
    return prat
      ? { nom: `${prat.prenom} ${prat.nom}`, specialite: prat.specialite || 'Non spécifiée' }
      : { nom: 'Inconnu', specialite: '-' };
  };

  const getExamensForConsultation = (idConsult) => {
    return examens.filter(e => e.idConsult === idConsult);
  };

  const getPatientData = (patient) => {
    if (!patient) return { rdvDetails: [], total: '0.00' };

    const patientRdvs = rdvs.filter(r => r.cinPatient === patient.cinPatient);
    const patientConsults = consultations.filter(c => patientRdvs.some(r => r.idRdv === c.idRdv));

    const rdvDetails = patientRdvs.map(rdv => {
      const consult = patientConsults.find(c => c.idRdv === rdv.idRdv);
      const praticien = getPraticienInfo(rdv.cinPraticien);
      const consultPrescriptions = prescriptions.filter(p => p.idConsult === consult?.idConsult);
      const consultExamens = consult ? getExamensForConsultation(consult.idConsult) : [];

      const dateObj = rdv.dateHeure ? new Date(rdv.dateHeure) : null;
      const dateStr = dateObj ? dateObj.toLocaleDateString('fr-FR') : '-';
      const heureStr = dateObj ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

      return {
        ...rdv,
        dateStr,
        heureStr,
        consult,
        praticienNom: praticien.nom,
        specialite: praticien.specialite,
        prix: consult?.prix || 0,
        compteRendu: consult?.compteRendu || 'Pas de compte-rendu',
        prescriptions: consultPrescriptions,
        examens: consultExamens
      };
    });

    const total = rdvDetails.reduce((s, r) => s + parseFloat(r.prix || 0), 0).toFixed(2);
    return { rdvDetails, total };
  };

  const totalGeneral = filteredPatients.reduce((sum, p) => sum + parseFloat(getPatientData(p).total), 0).toFixed(2);

  // Génération PDF améliorée
  const generatePDF = async (e, patient) => {
    e?.stopPropagation();
    setExportLoading(true);
    
    try {
      const { rdvDetails, total } = getPatientData(patient);
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // En-tête avec design moderne
      doc.setFillColor(0, 131, 143);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('CABINET MÉDICAL ANDRANOMADIO', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Parcelle 11/43 Andranomadio - Toamasina', pageWidth / 2, 25, { align: 'center' });
      doc.text('Tél : 038 95 067 30 • Email : contact@andranomadio.md', pageWidth / 2, 30, { align: 'center' });

      // Titre principal
      doc.setTextColor(0, 131, 143);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RELEVÉ DE FACTURATION PATIENT', pageWidth / 2, 50, { align: 'center' });

      // Informations patient
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const patientInfoY = 60;
      doc.text(`Patient : ${patient.prenom} ${patient.nom.toUpperCase()}`, 20, patientInfoY);
      doc.text(`CIN : ${patient.cinPatient}`, 20, patientInfoY + 6);
      doc.text(`Téléphone : ${patient.telephone || 'Non renseigné'}`, 20, patientInfoY + 12);
      doc.text(`Email : ${patient.email || 'Non renseigné'}`, 20, patientInfoY + 18);
      doc.text(`Date d'émission : ${new Date().toLocaleDateString('fr-FR')}`, 20, patientInfoY + 24);
      doc.text(`Heure : ${new Date().toLocaleTimeString('fr-FR')}`, 20, patientInfoY + 30);

      if (rdvDetails.length > 0) {
        const rows = rdvDetails.map(r => [
          r.dateStr,
          r.heureStr,
          r.praticienNom,
          r.specialite,
          parseFloat(r.prix || 0).toFixed(2) + ' DT'
        ]);

        doc.autoTable({
          startY: 95,
          head: [['Date', 'Heure', 'Praticien', 'Spécialité', 'Montant']],
          body: rows,
          foot: [['', '', '', 'TOTAL', total + ' DT']],
          theme: 'grid',
          headStyles: { 
            fillColor: [0, 131, 143], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
          },
          footStyles: { 
            fillColor: [230, 245, 233], 
            textColor: [0, 131, 143], 
            fontStyle: 'bold', 
            fontSize: 11 
          },
          columnStyles: { 
            4: { halign: 'right', fontStyle: 'bold' } 
          },
          styles: { 
            fontSize: 9,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          margin: { top: 10 }
        });

        // Contenu détaillé
        let y = doc.lastAutoTable.finalY + 15;
        
        rdvDetails.forEach((r, index) => {
          if (y > pageHeight - 100) {
            doc.addPage();
            y = 20;
          }

          // Prescriptions
          if (r.prescriptions.length > 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 140, 0);
            doc.text(`Prescriptions du ${r.dateStr} à ${r.heureStr}`, 15, y);
            y += 8;
            
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            
            r.prescriptions.forEach((p, pIndex) => {
              if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
              }
              doc.text(`• ${p.typePrescrire} – ${p.posologie}`, 20, y);
              y += 5;
            });
            y += 5;
          }

          // Examens
          if (r.examens.length > 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 100, 200);
            doc.text(`Examens du ${r.dateStr}`, 15, y);
            y += 8;
            
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            
            r.examens.forEach((e, eIndex) => {
              if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
              }
              doc.text(`• ${e.typeExamen} – Résultat: ${e.resultat || 'Non disponible'}`, 20, y);
              y += 5;
            });
            y += 10;
          }
        });
      } else {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text("Aucune consultation enregistrée pour ce patient.", 15, 90);
      }

      // Pied de page professionnel
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Document généré électroniquement - Cabinet Médical Andranomadio', pageWidth / 2, footerY, { align: 'center' });

      doc.save(`Facture_${patient.nom}_${new Date().toISOString().slice(0,10)}.pdf`);
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const printPatient = (e, patient) => {
    e.stopPropagation();
    const { rdvDetails, total } = getPatientData(patient);
    const printWin = window.open('', '_blank', 'width=1200,height=800');
    
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture - ${patient.nom}</title>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            background: #f8fafc;
            color: #334155;
          }
          .print-container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            color: #00838F; 
            border-bottom: 3px solid #00838F; 
            padding-bottom: 25px;
            margin-bottom: 30px;
          }
          .header h1 { 
            font-size: 32px; 
            font-weight: 700;
            margin-bottom: 8px;
          }
          .header p { 
            font-size: 14px; 
            color: #64748b;
          }
          .patient-info { 
            background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
            padding: 25px; 
            border-radius: 12px; 
            margin: 25px 0; 
            border-left: 4px solid #00838F;
          }
          .patient-info h3 {
            color: #00838F;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .info-item strong {
            color: #475569;
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          th { 
            background: #00838F; 
            color: white; 
            padding: 16px 12px; 
            font-weight: 600;
            font-size: 13px;
            text-align: left;
          }
          td { 
            padding: 14px 12px; 
            border-bottom: 1px solid #e2e8f0; 
            font-size: 13px;
          }
          tr:hover {
            background: #f8fafc;
          }
          .prescription-section, .examen-section {
            background: #fff7ed;
            padding: 20px;
            border-radius: 12px;
            margin: 25px 0;
            border-left: 4px solid #ea580c;
          }
          .examen-section {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
          }
          .prescription-item, .examen-item {
            background: white;
            padding: 16px;
            border-radius: 8px;
            margin: 12px 0;
            border: 1px solid #fed7aa;
          }
          .examen-item {
            border: 1px solid #bfdbfe;
          }
          .prescription-header, .examen-header {
            color: #ea580c;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .examen-header {
            color: #3b82f6;
          }
          .prescription-content, .examen-content {
            color: #475569;
            font-size: 13px;
          }
          .total-section { 
            font-size: 24px; 
            font-weight: 700; 
            text-align: right; 
            color: #00838F; 
            margin-top: 40px;
            padding: 25px;
            background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
            border-radius: 12px;
            border: 2px solid #00838F;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; background: white; }
            .print-container { box-shadow: none; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>CABINET MÉDICAL ANDRANOMADIO</h1>
            <p>Parcelle 11/43 Andranomadio - Toamasina | Tél : 038 95 067 30</p>
          </div>
          
          <div class="patient-info">
            <h3>INFORMATIONS PATIENT</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Nom complet</strong>
                ${patient.prenom} ${patient.nom.toUpperCase()}
              </div>
              <div class="info-item">
                <strong>CIN</strong>
                ${patient.cinPatient}
              </div>
              <div class="info-item">
                <strong>Téléphone</strong>
                ${patient.telephone || 'Non renseigné'}
              </div>
              <div class="info-item">
                <strong>Email</strong>
                ${patient.email || 'Non renseigné'}
              </div>
              <div class="info-item">
                <strong>Date d'émission</strong>
                ${new Date().toLocaleDateString('fr-FR')}
              </div>
              <div class="info-item">
                <strong>Heure</strong>
                ${new Date().toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>

          <h2 style="color: #00838F; margin: 30px 0 20px 0; font-size: 22px;">DÉTAIL DES CONSULTATIONS</h2>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>Praticien</th>
                <th>Spécialité</th>
                <th style="text-align: right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${rdvDetails.map(r => `
                <tr>
                  <td>${r.dateStr}</td>
                  <td>${r.heureStr}</td>
                  <td>${r.praticienNom}</td>
                  <td>${r.specialite}</td>
                  <td style="text-align: right; font-weight: 600;">${parseFloat(r.prix).toFixed(2)} DT</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${rdvDetails.some(r => r.prescriptions.length > 0) ? `
            <div class="prescription-section">
              <h3 style="color: #ea580c; margin-bottom: 20px;">PRESCRIPTIONS MÉDICALES</h3>
              ${rdvDetails.filter(r => r.prescriptions.length > 0).map(r => `
                <div class="prescription-item">
                  <div class="prescription-header">
                    Consultation du ${r.dateStr} à ${r.heureStr} - ${r.praticienNom}
                  </div>
                  <div class="prescription-content">
                    ${r.prescriptions.map(p => `
                      <div style="margin: 8px 0; padding-left: 15px; border-left: 3px solid #fdba74;">
                        <strong>${p.typePrescrire}</strong><br>
                        <span style="color: #475569;">${p.posologie}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${rdvDetails.some(r => r.examens.length > 0) ? `
            <div class="examen-section">
              <h3 style="color: #3b82f6; margin-bottom: 20px;">EXAMENS MÉDICAUX</h3>
              ${rdvDetails.filter(r => r.examens.length > 0).map(r => `
                <div class="examen-item">
                  <div class="examen-header">
                    Consultation du ${r.dateStr} - ${r.praticienNom}
                  </div>
                  <div class="examen-content">
                    ${r.examens.map(e => `
                      <div style="margin: 8px 0; padding-left: 15px; border-left: 3px solid #93c5fd;">
                        <strong>${e.typeExamen}</strong><br>
                        <span style="color: #475569;">Résultat: ${e.resultat || 'Non disponible'}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="total-section">
            TOTAL GÉNÉRAL : ${total} DT
          </div>

          <div class="footer">
            <p>Document généré électroniquement - Cabinet Médical Andranomadio</p>
            <p>Toamasina, Madagascar • SIRET: 12345678901234</p>
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      setTimeout(() => printWin.close(), 1000);
    }, 500);
  };

  const exportAllPDF = async () => {
    setExportLoading(true);
    try {
      for (const patient of filteredPatients) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await generatePDF(null, patient);
      }
    } catch (error) {
      console.error('Erreur export multiple:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const exportExcel = () => {
    const data = filteredPatients.map(patient => {
      const { rdvDetails, total } = getPatientData(patient);
      return {
        'CIN': patient.cinPatient,
        'Nom': patient.nom.toUpperCase(),
        'Prénom': patient.prenom,
        'Téléphone': patient.telephone || '',
        'Email': patient.email || '',
        'Total Facturé (DT)': parseFloat(total),
        'Nombre Consultations': rdvDetails.length,
        'Dernière Consultation': rdvDetails.length > 0 ? rdvDetails[rdvDetails.length - 1].dateStr : ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facturation Patients");
    XLSX.writeFile(workbook, `facturation_patients_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const clearFilters = () => {
    setFilters({
      dateDebut: '',
      dateFin: '',
      montantMin: '',
      montantMax: '',
      praticien: ''
    });
  };

  // Classes CSS pour le dark mode
  const containerClasses = `min-h-screen transition-colors duration-300 ${
    darkMode 
      ? 'bg-gradient-to-br from-gray-900 to-blue-900 text-white' 
      : 'bg-gradient-to-br from-blue-50 to-cyan-50 text-gray-800'
  }`;

  const cardClasses = `rounded-2xl shadow-xl border transition-colors duration-300 ${
    darkMode 
      ? 'bg-gray-800 border-gray-700 text-white' 
      : 'bg-white border-blue-100'
  }`;

  const inputClasses = `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-300 ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  }`;

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-teal-700 dark:text-teal-300 text-lg font-semibold">Chargement des données patients...</p>
          </div>
        </div>
      </div>
    );
  }

  const modalData = selectedPatient ? getPatientData(selectedPatient) : null;

  return (
    <div className={containerClasses}>
      
      {/* Header */}
      <div className={`backdrop-blur-sm border-b transition-colors duration-300 ${
        darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-white/20'
      }`}>
        <div className="px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent mb-3 text-center lg:text-left">
                📊 Gestion des Facturations
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg text-center lg:text-left">
                Relevés détaillés • Prescriptions • Examens • Export PDF/Excel
              </p>
            </div>
            <div className="flex gap-3 mt-4 lg:mt-0 justify-center lg:justify-end">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  darkMode 
                    ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="w-full px-8 py-6">

        {/* Cartes Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Patients
                </p>
                <p className="text-3xl font-bold text-teal-500">{stats.totalPatients}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Patients enregistrés
                </p>
              </div>
              <div className="w-12 h-12 text-teal-500 bg-teal-100 dark:bg-teal-900/30 p-2 rounded-xl flex items-center justify-center">
                👥
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Chiffre d'Affaires
                </p>
                <p className="text-3xl font-bold text-emerald-500">{stats.totalRevenue} DT</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Revenu total
                </p>
              </div>
              <div className="w-12 h-12 text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl flex items-center justify-center">
                💰
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Consultations Moy.
                </p>
                <p className="text-3xl font-bold text-purple-500">{stats.consultationsMoyennes}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Par patient
                </p>
              </div>
              <div className="w-12 h-12 text-purple-500 bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl flex items-center justify-center">
                📈
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Patient Plus Actif
                </p>
                <p className="text-xl font-bold text-orange-500 truncate">{stats.patientPlusActif}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Plus de consultations
                </p>
              </div>
              <div className="w-12 h-12 text-orange-500 bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl flex items-center justify-center">
                ⭐
              </div>
            </div>
          </div>
        </div>

        {/* Barre de Contrôle */}
        <div className={`${cardClasses} p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            {/* Recherche */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher patient (nom, prénom, CIN)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 font-semibold ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtres
              </button>

              <button
                onClick={exportExcel}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg flex items-center gap-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>

              <button
                onClick={exportAllPDF}
                disabled={exportLoading || filteredPatients.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2 font-semibold"
              >
                {exportLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Exporter Tous PDF
              </button>
            </div>
          </div>

          {/* Filtres Avancés */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-xl border ${
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-teal-50 border-teal-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Date début
                  </label>
                  <input
                    type="date"
                    value={filters.dateDebut}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateDebut: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={filters.dateFin}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFin: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Montant min (DT)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.montantMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, montantMin: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Montant max (DT)
                  </label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={filters.montantMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, montantMax: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Praticien
                  </label>
                  <input
                    type="text"
                    placeholder="Nom du praticien"
                    value={filters.praticien}
                    onChange={(e) => setFilters(prev => ({ ...prev, praticien: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    darkMode
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Effacer les filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tableau Principal */}
        <div className={`${cardClasses} overflow-hidden`}>
          <table className="w-full">
            <thead className={`sticky top-0 ${
              darkMode
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
            }`}>
              <tr>
                <th className="px-6 py-4 text-left font-semibold">CIN Patient</th>
                <th className="px-6 py-4 text-left font-semibold">Informations Patient</th>
                <th className="px-6 py-4 text-left font-semibold">Contact</th>
                <th className="px-6 py-4 text-right font-semibold">Total Facturé</th>
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              darkMode ? 'divide-gray-700' : 'divide-gray-100'
            }`}>
              {filteredPatients.map(patient => {
                const { total } = getPatientData(patient);
                return (
                  <tr 
                    key={patient.cinPatient} 
                    className={`transition-all duration-200 cursor-pointer ${
                      darkMode 
                        ? 'hover:bg-teal-900/20' 
                        : 'hover:bg-teal-50/50'
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-teal-700 dark:text-teal-300">
                      {patient.cinPatient}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {patient.nom.toUpperCase()} {patient.prenom}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {patient.age} ans • {patient.sexe}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{patient.telephone || '-'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {patient.email || 'Non renseigné'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                        {total} DT
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setSelectedPatient(patient)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md flex items-center gap-2 text-sm font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Détails
                        </button>
                        <button 
                          onClick={(e) => generatePDF(e, patient)}
                          disabled={exportLoading}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2 text-sm font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          PDF
                        </button>
                        <button 
                          onClick={(e) => printPatient(e, patient)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md flex items-center gap-2 text-sm font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Imprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Total Général */}
              <tr className={`font-bold ${
                darkMode 
                  ? 'bg-gradient-to-r from-emerald-900/20 to-green-900/20' 
                  : 'bg-gradient-to-r from-emerald-50 to-green-50'
              }`}>
                <td colSpan="3" className="px-6 py-6 text-right text-gray-700 dark:text-gray-300 text-lg">
                  CHIFFRE D'AFFAIRES TOTAL
                </td>
                <td className="px-6 py-6 text-right">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {totalGeneral} DT
                  </div>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal Détails Patient */}
        {selectedPatient && modalData && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* En-tête Modal */}
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Dossier Complet - {selectedPatient.prenom} {selectedPatient.nom.toUpperCase()}
                    </h2>
                    <p className="opacity-90 mt-1">CIN : {selectedPatient.cinPatient} • Tél: {selectedPatient.telephone || 'Non renseigné'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPatient(null)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenu Modal */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {modalData.rdvDetails.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Aucune consultation enregistrée pour ce patient.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {modalData.rdvDetails.map((rdv, i) => (
                      <div key={i} className={`rounded-xl p-6 border ${
                        darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                              {rdv.dateStr} à {rdv.heureStr}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              <strong>Praticien :</strong> {rdv.praticienNom} • {rdv.specialite}
                            </p>
                          </div>
                          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                            {parseFloat(rdv.prix).toFixed(2)} DT
                          </div>
                        </div>

                        {/* Prescriptions */}
                        {rdv.prescriptions.length > 0 && (
                          <div className={`rounded-lg p-4 border-l-4 border-amber-500 mb-4 ${
                            darkMode ? 'bg-amber-900/20' : 'bg-amber-50'
                          }`}>
                            <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Prescriptions Médicales
                            </h4>
                            <div className="space-y-2">
                              {rdv.prescriptions.map((p, idx) => (
                                <div key={idx} className={`flex items-start gap-3 rounded-lg p-3 ${
                                  darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${
                                    darkMode 
                                      ? 'bg-amber-900/30 text-amber-300' 
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">{p.typePrescrire}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{p.posologie}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Examens */}
                        {rdv.examens.length > 0 && (
                          <div className={`rounded-lg p-4 border-l-4 border-blue-500 mb-4 ${
                            darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                          }`}>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-1.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Examens Médicaux
                            </h4>
                            <div className="space-y-2">
                              {rdv.examens.map((e, idx) => (
                                <div key={idx} className={`flex items-start gap-3 rounded-lg p-3 ${
                                  darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${
                                    darkMode 
                                      ? 'bg-blue-900/30 text-blue-300' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">{e.typeExamen}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      Résultat: {e.resultat || 'Non disponible'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Compte Rendu */}
                        {rdv.compteRendu && rdv.compteRendu !== 'Pas de compte-rendu' && (
                          <div className={`rounded-lg p-4 border-l-4 border-green-500 ${
                            darkMode ? 'bg-green-900/20' : 'bg-green-50'
                          }`}>
                            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Compte Rendu Médical
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 italic">{rdv.compteRendu}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pied de Page Modal */}
              <div className={`p-6 border-t ${
                darkMode 
                  ? 'bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-gray-700' 
                  : 'bg-gradient-to-r from-emerald-50 to-green-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total des consultations</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{modalData.total} DT</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => generatePDF(e, selectedPatient)}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg flex items-center gap-2 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Télécharger PDF
                    </button>
                    <button 
                      onClick={(e) => printPatient(e, selectedPatient)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg flex items-center gap-2 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Imprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactureTousPatients;