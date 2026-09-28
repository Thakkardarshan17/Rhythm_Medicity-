import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  Printer,
  Share2,
  Bookmark,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Sliders,
  X,
} from 'lucide-react';
import { Appointment, AppointmentLetterSettings, Doctor } from '../types/database';
import { useSettings } from '../contexts/SettingsContext';
import { generateAppointmentPdf, printAppointmentLetter } from '../utils/pdfGenerator';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { DoctorService } from '../services/doctorService';

interface AppointmentLetterViewProps {
  appointment: Appointment;
  onClose?: () => void;
  overrideSettings?: Partial<AppointmentLetterSettings>;
  showAdminControls?: boolean;
}

/* ═══════════════════════════════════════════════════════════════
 *  MASTER A5 APPOINTMENT LETTER — SINGLE SOURCE OF TRUTH
 *
 *  ONE TEMPLATE → View | PDF | Print | Save | Share | WhatsApp
 *
 *  Rules:
 *  - 100 % inline styles inside the A5 frame
 *  - All dimensions in mm for physical consistency
 *  - No lucide-react icons inside the A5 frame (raw SVG only)
 *  - Font: Inter → system-ui fallback
 *  - All colors hex — no oklch / CSS vars inside frame
 * ═══════════════════════════════════════════════════════════════ */

const F = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export const AppointmentLetterView: React.FC<AppointmentLetterViewProps> = ({
  appointment,
  onClose,
  overrideSettings,
  showAdminControls = false,
}) => {
  const { hospitalSettings, letterSettings } = useSettings();
  const { showToast } = useToast();

  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [doctorData, setDoctorData] = useState<Doctor | null>(appointment.doctor || null);

  const effectiveSettings = { ...letterSettings, ...overrideSettings };
  const initialOpacity = effectiveSettings.watermark_opacity ?? 0.06;
  const [opacity, setOpacity] = useState<number>(initialOpacity);

  // ── Responsive scaling for mobile ──
  // The A5 letter is 148mm ≈ 559px wide. On screens < 580px, scale it down.
  const scaleContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const calcScale = useCallback(() => {
    const container = scaleContainerRef.current;
    if (!container) return;
    const availableWidth = container.parentElement?.clientWidth || window.innerWidth;
    // A5 width in px ≈ 559. Add 16px padding buffer.
    const docWidth = 559 + 16;
    if (availableWidth < docWidth) {
      setScale(Math.max(0.4, availableWidth / docWidth));
    } else {
      setScale(1);
    }
  }, []);

  useEffect(() => {
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [calcScale]);

  useEffect(() => {
    if (overrideSettings?.watermark_opacity !== undefined) setOpacity(overrideSettings.watermark_opacity);
    else if (letterSettings.watermark_opacity !== undefined) setOpacity(letterSettings.watermark_opacity);
  }, [overrideSettings?.watermark_opacity, letterSettings.watermark_opacity]);

  useEffect(() => {
    if (!doctorData && appointment.doctor_id) {
      DoctorService.getDoctorById(appointment.doctor_id)
        .then((doc) => { if (doc) setDoctorData(doc); })
        .catch((e) => console.error('Error fetching doctor:', e));
    }
  }, [appointment.doctor_id, doctorData]);

  // ── Derived data ──
  const documentId = `appointment-letter-${appointment.id}`;
  const verificationUrl = `${window.location.origin}/appointment/verify/${appointment.id}`;

  const watermarkLogo =
    effectiveSettings.watermark_logo_url ||
    (hospitalSettings.logo_url && hospitalSettings.logo_url !== '/logo.png'
      ? hospitalSettings.logo_url
      : '/emblem.png');

  const hospitalName = appointment.hospital_name_snapshot || hospitalSettings.hospital_name || 'RHYTHM MEDICITY';
  const hospitalAddress = appointment.hospital_address_snapshot || hospitalSettings.address || '79, Gotri Rd, Karmjyot Society, Gotri, Vadodara, Gujarat 390007';
  const hospitalPhone = appointment.hospital_phone_snapshot || hospitalSettings.phone || hospitalSettings.emergency_number || '+91 7201030048';
  const hospitalEmergency = appointment.hospital_emergency_snapshot || hospitalSettings.emergency_number || hospitalPhone;
  const hospitalEmail = appointment.hospital_email_snapshot || hospitalSettings.email || 'info@rhythmmedicity.com';
  const hospitalWhatsApp = hospitalSettings.whatsapp_number || hospitalPhone;

  const patientId = `RM-P-${appointment.appointment_number?.replace(/\D/g, '').slice(-6).padStart(6, '0') || '000001'}`;
  const paymentId = appointment.payment_transaction_id || `PAY-${appointment.appointment_number?.replace(/\D/g, '').slice(-8).padStart(8, '0')}`;

  const doctorQualification = doctorData?.qualification || '';
  const doctorPhoto = doctorData?.photo_url || appointment.doctor?.photo_url || '';

  // ── Action Handlers ──
  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await generateAppointmentPdf(documentId, appointment.appointment_number);
      showToast('Appointment Letter PDF downloaded.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Unable to generate PDF.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    try { printAppointmentLetter(documentId); }
    catch { showToast('Browser does not support printing. Use Download PDF.', 'warning'); }
  };

  const handleSaveDocument = () => {
    try {
      const key = 'rhythm_saved_appointment_documents';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const record = {
        appointmentId: appointment.id,
        appointmentNumber: appointment.appointment_number,
        patientName: appointment.patient_name,
        doctorName: appointment.doctor_name_snapshot,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        version: 'v1.0',
        savedAt: new Date().toISOString(),
      };
      const filtered = existing.filter((d: any) => d.appointmentId !== appointment.id);
      localStorage.setItem(key, JSON.stringify([record, ...filtered]));
      setSaved(true);
      showToast('✓ Appointment letter saved.', 'success');
    } catch { showToast('Saved.', 'info'); }
  };

  const handleShare = async () => {
    setSharing(true);
    const shareData = {
      title: `Rhythm Medicity — Appointment #${appointment.appointment_number}`,
      text: `Appointment for ${appointment.patient_name} with ${appointment.doctor_name_snapshot} on ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}.`,
      url: verificationUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); showToast('Shared.', 'success'); }
      catch (e: any) { if (e.name !== 'AbortError') copyLink(); }
      finally { setSharing(false); }
    } else { copyLink(); setSharing(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    showToast('Link copied.', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsApp = () => {
    const msg = `🏥 *RHYTHM MEDICITY*\n*Appointment Confirmation*\n\n*Appointment ID:* ${appointment.appointment_number}\n*Patient:* ${appointment.patient_name}\n*Doctor:* ${appointment.doctor_name_snapshot}\n*Speciality:* ${appointment.speciality_name_snapshot}\n*Date:* ${formatDate(appointment.appointment_date)}\n*Time:* ${formatTime(appointment.appointment_time)}\n*Fee:* ₹${appointment.consultation_fee_snapshot || appointment.consultation_fee} (Paid)\n\n📄 *Verify Appointment:*\n${verificationUrl}\n\n📞 Emergency: ${hospitalEmergency}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    showToast('Opening WhatsApp...', 'info');
  };

  // ── Shared styles ──
  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: F, fontSize: '8px', fontWeight: 800, color: '#006655',
    textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: '1',
    paddingBottom: '3px', marginBottom: '4px',
    borderBottom: '1.5px solid #006655',
  };
  const fieldRowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    fontSize: '8px', lineHeight: '1.5', padding: '0.5px 0', fontFamily: F,
  };
  const fieldLabelStyle: React.CSSProperties = { color: '#475569', fontWeight: 500, minWidth: '90px' };
  const fieldValueStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 700, textAlign: 'right' as const };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ═══ ACTION BAR (outside A5 — no-print) ═══ */}
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 12px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#003329', fontFamily: F }}>
          <CheckCircle2 style={{ width: '16px', height: '16px', color: '#006655', flexShrink: 0 }} />
          <span>Appointment Letter</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', width: '100%', marginTop: '4px' }}>
          {showAdminControls && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '11px' }}>
              <Sliders style={{ width: '13px', height: '13px', color: '#006655' }} />
              <span style={{ fontWeight: 600, color: '#64748b' }}>Watermark:</span>
              <input type="range" min="0" max="0.40" step="0.01" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} style={{ width: '60px', accentColor: '#006655', cursor: 'pointer' }} />
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#006655', fontSize: '10px' }}>{Math.round(opacity * 100)}%</span>
            </div>
          )}
          <button onClick={handleDownloadPdf} disabled={downloading} style={{ flex: '1 1 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '7px 10px', borderRadius: '10px', background: '#006655', color: '#fff', fontWeight: 700, fontSize: '11px', border: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', minWidth: '0' }}>
            {downloading ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <Download style={{ width: '13px', height: '13px', flexShrink: 0 }} />}
            <span>PDF</span>
          </button>
          <button onClick={handlePrint} style={{ flex: '1 1 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '7px 10px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '11px', border: 'none', cursor: 'pointer', minWidth: '0' }}>
            <Printer style={{ width: '13px', height: '13px', color: '#006655', flexShrink: 0 }} /> <span>Print</span>
          </button>
          <button onClick={handleSaveDocument} style={{ flex: '1 1 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '7px 10px', borderRadius: '10px', background: saved ? '#dcfce7' : '#f1f5f9', color: saved ? '#166534' : '#475569', fontWeight: 700, fontSize: '11px', border: saved ? '1px solid #86efac' : 'none', cursor: 'pointer', minWidth: '0' }}>
            <Bookmark style={{ width: '13px', height: '13px', color: '#006655', flexShrink: 0 }} />
            <span>{saved ? '✓' : 'Save'}</span>
          </button>
          <button onClick={handleShare} disabled={sharing} style={{ flex: '1 1 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '7px 10px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '11px', border: 'none', cursor: 'pointer', minWidth: '0' }}>
            {copied ? <CheckCircle2 style={{ width: '13px', height: '13px', color: '#16a34a' }} /> : <Share2 style={{ width: '13px', height: '13px', color: '#006655', flexShrink: 0 }} />}
            <span>{copied ? '✓' : 'Share'}</span>
          </button>
          <button onClick={handleWhatsApp} style={{ flex: '1 1 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '7px 10px', borderRadius: '10px', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '11px', border: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', minWidth: '0' }}>
            <MessageCircle style={{ width: '13px', height: '13px', flexShrink: 0 }} /> <span>WhatsApp</span>
          </button>
          {onClose && (
            <button onClick={onClose} style={{ padding: '7px', color: '#94a3b8', borderRadius: '10px', background: 'none', border: 'none', cursor: 'pointer' }} title="Close">
              <X style={{ width: '15px', height: '15px' }} />
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
       *  ███  MASTER A5 DOCUMENT — 148 mm × 210 mm  ███
       *  THIS IS THE SINGLE SOURCE OF TRUTH.
       *  View = PDF = Print = Save = Share
       *
       *  Mobile: scales down proportionally via CSS transform.
       *  Document layout NEVER changes — only the container scales.
       * ═══════════════════════════════════════════════════════════ */}
      <div
        ref={scaleContainerRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '8px',
          width: '100%',
        }}
      >
        <div
          style={{
            transform: scale < 1 ? `scale(${scale})` : 'none',
            transformOrigin: 'top center',
            // Shrink the outer wrapper's height to match the scaled content
            height: scale < 1 ? `calc(210mm * ${scale} + 16px)` : 'auto',
            transition: 'transform 0.2s ease',
          }}
        >
        <div
          id={documentId}
          data-master-template="true"
          style={{
            width: '148mm', minWidth: '148mm', maxWidth: '148mm',
            height: '210mm', minHeight: '210mm', maxHeight: '210mm',
            boxSizing: 'border-box',
            padding: '6mm 7mm 5mm 7mm',
            position: 'relative', overflow: 'hidden',
            backgroundColor: '#ffffff', color: '#0f172a',
            border: '1.5px solid #006655', borderRadius: '4px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            fontFamily: F, fontSize: '8px', lineHeight: '1.4',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* ── Watermark ── */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '58mm', height: '58mm', pointerEvents: 'none', zIndex: 0, opacity }} aria-hidden="true">
            <img src={watermarkLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* ── Content (z-index above watermark) ── */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', boxSizing: 'border-box' }}>

            {/* ───────────── HEADER ───────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px' }}>
              {/* Hospital Logo */}
              <img
                src={hospitalSettings.logo_url || '/logo.png'}
                alt={hospitalName}
                style={{ height: '42px', width: 'auto', maxWidth: '65px', objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F, fontWeight: 900, fontSize: '13px', color: '#006655', letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: '1.15' }}>
                  {hospitalName}
                </div>
                <div style={{ fontFamily: F, fontSize: '8px', fontWeight: 700, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: '1.3', marginTop: '0.5px' }}>
                  MULTISPECIALITY HOSPITAL
                </div>
                <div style={{ fontFamily: F, fontSize: '7px', color: '#475569', lineHeight: '1.3', marginTop: '1px' }}>
                  {hospitalAddress}
                </div>
                <div style={{ fontFamily: F, fontSize: '6.5px', color: '#64748b', lineHeight: '1.3', marginTop: '0.5px' }}>
                  Phone: <span style={{ fontWeight: 700, color: '#0f172a' }}>{hospitalPhone}</span>
                  {' '} | {' '} Emergency: <span style={{ fontWeight: 700, color: '#006655' }}>{hospitalEmergency}</span>
                  {' '} | {' '} Email: {hospitalEmail}
                </div>
              </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #006655, #004C3D, #006655)', borderRadius: '1px', margin: '2px 0 6px 0' }} />

            {/* ───────────── TITLE ───────────── */}
            <div style={{ textAlign: 'center', padding: '4px 0 8px 0' }}>
              <div style={{ fontFamily: F, fontSize: '14px', fontWeight: 900, color: '#003329', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: '1' }}>
                APPOINTMENT LETTER
              </div>
              <div style={{ fontFamily: F, fontSize: '7px', color: '#64748b', fontWeight: 500, marginTop: '2px', letterSpacing: '0.02em' }}>
                Ref: {appointment.appointment_number} &nbsp;|&nbsp; Issued: {formatDate(appointment.created_at?.split('T')[0] || appointment.appointment_date)}
              </div>
            </div>

            {/* ───────────── SECTIONS ───────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 }}>

              {/* ▸ APPOINTMENT INFORMATION */}
              <div>
                <div style={sectionTitleStyle}>APPOINTMENT INFORMATION</div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Appointment ID</span><span style={{ ...fieldValueStyle, fontFamily: 'monospace', color: '#006655' }}>{appointment.appointment_number}</span></div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Booking Date</span><span style={fieldValueStyle}>{formatDate(appointment.created_at?.split('T')[0] || appointment.appointment_date)}</span></div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Appointment Date</span><span style={{ ...fieldValueStyle, fontWeight: 800 }}>{formatDate(appointment.appointment_date)}</span></div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Time</span><span style={{ ...fieldValueStyle, color: '#006655', fontWeight: 800 }}>{formatTime(appointment.appointment_time)}</span></div>
                <div style={fieldRowStyle}>
                  <span style={fieldLabelStyle}>Status</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: appointment.appointment_status === 'CONFIRMED' ? '#16a34a' : '#eab308' }} />
                    <span style={{ fontSize: '7.5px', fontWeight: 800, color: appointment.appointment_status === 'CONFIRMED' ? '#166534' : '#854d0e', textTransform: 'uppercase', fontFamily: F }}>
                      {appointment.appointment_status === 'CONFIRMED' ? '✓ CONFIRMED' : appointment.appointment_status}
                    </span>
                  </span>
                </div>
              </div>

              {/* ▸ PATIENT INFORMATION */}
              <div>
                <div style={sectionTitleStyle}>PATIENT INFORMATION</div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Patient Name</span><span style={{ ...fieldValueStyle, textTransform: 'capitalize' }}>{appointment.patient_name}</span></div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Patient ID</span><span style={{ ...fieldValueStyle, fontFamily: 'monospace', color: '#006655' }}>{patientId}</span></div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Mobile</span><span style={{ ...fieldValueStyle, fontFamily: 'monospace' }}>{appointment.patient_mobile}</span></div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Age / Gender</span><span style={fieldValueStyle}>{appointment.patient_age} Yrs / {appointment.patient_gender}</span></div>
              </div>

              {/* ▸ DOCTOR INFORMATION */}
              <div>
                <div style={sectionTitleStyle}>DOCTOR INFORMATION</div>
                <div style={fieldRowStyle}>
                  <span style={fieldLabelStyle}>Doctor</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {doctorPhoto && (
                      <img src={doctorPhoto} alt="" crossOrigin="anonymous" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                    )}
                    <span style={{ ...fieldValueStyle, color: '#006655' }}>{appointment.doctor_name_snapshot}</span>
                  </span>
                </div>
                {doctorQualification && (
                  <div style={fieldRowStyle}><span style={fieldLabelStyle}>Qualification</span><span style={{ ...fieldValueStyle, fontSize: '7.5px' }}>{doctorQualification}</span></div>
                )}
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Specialization</span><span style={fieldValueStyle}>{appointment.speciality_name_snapshot}</span></div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Department</span><span style={fieldValueStyle}>{appointment.speciality_name_snapshot}</span></div>
              </div>

              {/* ▸ PAYMENT INFORMATION */}
              <div>
                <div style={sectionTitleStyle}>PAYMENT INFORMATION</div>
                <div style={fieldRowStyle}>
                  <span style={fieldLabelStyle}>Consultation Fee</span>
                  <span style={{ ...fieldValueStyle, fontSize: '9px', color: '#006655' }}>{formatCurrency(appointment.consultation_fee_snapshot || appointment.consultation_fee)}</span>
                </div>
                <div style={fieldRowStyle}>
                  <span style={fieldLabelStyle}>Payment Status</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ background: appointment.payment_status === 'PAID' ? '#dcfce7' : '#fef9c3', color: appointment.payment_status === 'PAID' ? '#166534' : '#854d0e', fontSize: '7px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', fontFamily: F }}>
                      {appointment.payment_status}
                    </span>
                  </span>
                </div>
                <div style={fieldRowStyle}><span style={fieldLabelStyle}>Payment ID</span><span style={{ ...fieldValueStyle, fontFamily: 'monospace', fontSize: '7px', color: '#64748b' }}>{paymentId}</span></div>
              </div>

              {/* ▸ QR CODE — centered */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '3px 0' }}>
                <div style={{ padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#ffffff', lineHeight: 0 }}>
                  <QRCodeSVG value={verificationUrl} size={54} level="M" />
                </div>
                <div style={{ fontFamily: F, fontSize: '6.5px', color: '#64748b', fontWeight: 600, textAlign: 'center', letterSpacing: '0.02em' }}>
                  Scan to Verify Appointment
                </div>
              </div>

              {/* ▸ STAMP & SIGNATURE — right aligned */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '2px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '80px' }}>
                  {effectiveSettings.show_stamp && (
                    <div style={{ width: '36px', height: '36px' }}>
                      {hospitalSettings.stamp_url ? (
                        <img src={hospitalSettings.stamp_url} alt="Stamp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px dashed #006655', background: 'rgba(0,102,85,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4.5px', color: '#006655', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', transform: 'rotate(-8deg)', fontFamily: F, lineHeight: '1.1' }}>
                          Rhythm{'\n'}Verified
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ fontFamily: F, fontSize: '6.5px', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
                    Authorized Signatory
                  </div>
                  <div style={{ width: '65px', borderTop: '1px solid #94a3b8', marginTop: '1px' }} />
                  <div style={{ fontFamily: F, fontSize: '6px', color: '#64748b', textAlign: 'center' }}>
                    {effectiveSettings.authorization_text || 'Hospital Administration'}
                  </div>
                </div>
              </div>
            </div>

            {/* ───────────── FOOTER ───────────── */}
            <div style={{ borderTop: '1.5px solid #006655', paddingTop: '3px', marginTop: '4px' }}>
              <div style={{ fontFamily: F, fontSize: '6.5px', color: '#475569', lineHeight: '1.4', textAlign: 'center' }}>
                {effectiveSettings.footer_text || 'This appointment is subject to hospital appointment policies. Please carry a valid ID at the time of visit.'}
              </div>
              <div style={{ fontFamily: F, fontSize: '6.5px', fontWeight: 700, color: '#006655', textAlign: 'center', marginTop: '2px', letterSpacing: '0.03em' }}>
                {hospitalName} &nbsp;|&nbsp; Emergency: {hospitalEmergency} &nbsp;|&nbsp; WhatsApp: {hospitalWhatsApp}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
