import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Check,
  X,
  Loader2,
  Award,
  Clock,
  IndianRupee,
  Search,
  Bot,
} from 'lucide-react';
import { DoctorService } from '../../services/doctorService';
import { SpecialityService } from '../../services/specialityService';
import { AuditService } from '../../services/auditService';
import { Doctor, Speciality, AvailabilityStatus, EntityStatus } from '../../types/database';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { useDropdownOptions } from '../../contexts/DropdownContext';

export const AdminDoctors: React.FC = () => {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dynamic Master Dropdown Options
  const { options: qualificationOptions } = useDropdownOptions('doctor_qualification');
  const { options: roomOptions } = useDropdownOptions('room_type');
  const { options: durationOptions } = useDropdownOptions('appointment_duration');


  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form fields
  const [formData, setFormData] = useState<Partial<Doctor>>({
    full_name: '',
    speciality_id: '',
    qualification: '',
    experience_years: 5,
    consultation_fee: 500,
    bio: '',
    phone: '',
    email: '',
    availability_status: 'available',
    status: 'active',
    registration_number: '',
    clinic_room: 'Room 101',
    consultation_duration: 15,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_time_start: '09:00',
    available_time_end: '17:00',
    photo_url: '',
  });

  const loadData = async () => {
    try {
      const [docs, specs] = await Promise.all([
        DoctorService.getAllDoctorsAdmin(),
        SpecialityService.getAllSpecialitiesAdmin(),
      ]);
      setDoctors(docs);
      setSpecialities(specs);
    } catch (err) {
      console.error('Error fetching admin doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('rhythm_doctors_changed', handleSync);
    window.addEventListener('rhythm_specialities_changed', handleSync);

    return () => {
      window.removeEventListener('rhythm_doctors_changed', handleSync);
      window.removeEventListener('rhythm_specialities_changed', handleSync);
    };
  }, []);

  const openAddModal = () => {
    setEditingDoctor(null);
    setFormData({
      full_name: '',
      speciality_id: specialities[0]?.id || '',
      qualification: 'MBBS, MD',
      experience_years: 5,
      consultation_fee: 500,
      bio: '',
      phone: '',
      email: '',
      availability_status: 'available',
      status: 'active',
      registration_number: '',
      clinic_room: 'Room 101',
      consultation_duration: 15,
      available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      available_time_start: '09:00',
      available_time_end: '17:00',
      show_in_dillo: true,
      photo_url: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormData({
      full_name: doc.full_name,
      speciality_id: doc.speciality_id || '',
      qualification: doc.qualification,
      experience_years: doc.experience_years,
      consultation_fee: doc.consultation_fee,
      bio: doc.bio || '',
      phone: doc.phone || '',
      email: doc.email || '',
      availability_status: doc.availability_status,
      status: doc.status,
      registration_number: doc.registration_number || '',
      clinic_room: doc.clinic_room || '',
      consultation_duration: doc.consultation_duration,
      available_days: doc.available_days || [],
      available_time_start: doc.available_time_start,
      available_time_end: doc.available_time_end,
      show_in_dillo: doc.show_in_dillo !== false,
      photo_url: doc.photo_url || '',
    });
    setModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const url = await DoctorService.uploadPhoto(file);
      setFormData((prev) => ({ ...prev, photo_url: url }));
      showToast('Doctor photograph uploaded.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.qualification) {
      showToast('Doctor name and qualification are required.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const slug = DoctorService.generateDoctorSlug(formData.full_name);
      if (editingDoctor) {
        await DoctorService.updateDoctor(editingDoctor.id, {
          ...formData,
          slug: editingDoctor.slug || slug,
        });
        await AuditService.logAction('UPDATE', 'DOCTOR', editingDoctor.id, {
          name: formData.full_name,
        });
        showToast('Doctor profile updated successfully.', 'success');
      } else {
        const created = await DoctorService.createDoctor({
          ...formData,
          slug,
        });
        await AuditService.logAction('CREATE', 'DOCTOR', created.id, {
          name: formData.full_name,
        });
        showToast('New doctor registered successfully.', 'success');
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save doctor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await DoctorService.deleteDoctor(deleteTarget.id);
      await AuditService.logAction('DELETE', 'DOCTOR', deleteTarget.id, {
        name: deleteTarget.full_name,
      });
      showToast('Doctor record deleted permanently from database.', 'info');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete doctor', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (doc: Doctor) => {
    try {
      const newStatus: EntityStatus = doc.status === 'active' ? 'inactive' : 'active';
      await DoctorService.updateDoctor(doc.id, { status: newStatus });
      showToast(`Doctor marked as ${newStatus}.`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const [selectedSpeciality, setSelectedSpeciality] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.full_name.toLowerCase().includes(search.toLowerCase()) ||
      d.qualification.toLowerCase().includes(search.toLowerCase()) ||
      (d.phone && d.phone.includes(search));
    const matchesSpec = selectedSpeciality === 'all' || d.speciality_id === selectedSpeciality;
    const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;
    return matchesSearch && matchesSpec && matchesStatus;
  });

  const allWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    const current = formData.available_days || [];
    if (current.includes(day)) {
      setFormData({ ...formData, available_days: current.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, available_days: [...current, day] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#006655] tracking-tight">
            Doctor Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add physicians, configure qualifications, OPD schedules, contact details, and upload photos.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, degree, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655]"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          {/* Speciality Filter */}
          <select
            value={selectedSpeciality}
            onChange={(e) => setSelectedSpeciality(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white font-medium text-slate-700"
          >
            <option value="all">All Departments</option>
            {specialities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white font-medium text-slate-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <div className="text-xs text-slate-500 font-semibold px-2 py-1 bg-slate-100 rounded-lg">
            Showing {filteredDoctors.length} of {doctors.length}
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : filteredDoctors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-3.5">Doctor</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Consultation Fee</th>
                  <th className="px-6 py-3.5">Timings</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {doc.photo_url ? (
                          <img
                            src={doc.photo_url}
                            alt={doc.full_name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#E0F2ED] text-[#004C3D] flex items-center justify-center font-bold text-sm">
                            {doc.full_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#006655] text-sm">{doc.full_name}</div>
                          <div className="text-slate-500">{doc.qualification} • {doc.experience_years} yrs exp</div>
                          {doc.phone && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>📞 {doc.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">
                        {doc.speciality?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#006655]">
                      {formatCurrency(doc.consultation_fee)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-medium">{doc.available_time_start} - {doc.available_time_end}</div>
                      <div className="text-[10px] text-slate-400">
                        {(doc.available_days && doc.available_days.length > 0)
                          ? doc.available_days.map((d: string) => d.slice(0, 3)).join(', ')
                          : 'Mon-Sat'}
                      </div>
                      {doc.clinic_room && <div className="text-[10px] text-[#006655]/80">{doc.clinic_room}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          onClick={() => handleToggleStatus(doc)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                            doc.status === 'active'
                              ? 'bg-[#E0F2ED] text-[#006655] border border-[#006655]/20'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {doc.status.toUpperCase()}
                        </button>
                        {doc.show_in_dillo !== false ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Bot className="w-3 h-3 text-[#C4A760]" />
                            <span>Dillo AI: ON</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Bot className="w-3 h-3 opacity-40" />
                            <span>Dillo AI: OFF</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(doc)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#006655] hover:bg-slate-100 transition"
                        title="Edit Doctor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Doctors Found</p>
            <p className="text-slate-400 mt-1">Click "Add New Doctor" above to register clinical practitioners.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Doctor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003329]/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#006655]">
                {editingDoctor ? 'Edit Doctor Profile' : 'Add New Medical Doctor'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Photo Upload with Preview (Prompt Section 13) */}
              <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                {formData.photo_url ? (
                  <img
                    src={formData.photo_url}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E5DEC9]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 font-bold">
                    PHOTO
                  </div>
                )}
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-[#006655]" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Upload Doctor Photo'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Supports JPG, PNG, WEBP. Max 5MB. Stored in Supabase Storage.
                  </p>
                </div>
              </div>

              {/* Full Name & Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Dr. Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Qualification / Degrees *
                  </label>
                  <input
                    type="text"
                    required
                    list="doctor-qualifications-list"
                    value={formData.qualification || ''}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD, DNB"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                  <datalist id="doctor-qualifications-list">
                    {qualificationOptions.map((opt) => (
                      <option key={opt.id} value={opt.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Speciality & Consultation Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Medical Speciality *
                  </label>
                  <select
                    value={formData.speciality_id || ''}
                    onChange={(e) => setFormData({ ...formData, speciality_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white text-sm"
                  >
                    <option value="">-- Select Speciality --</option>
                    {specialities.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Consultation Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.consultation_fee || ''}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) })}
                    placeholder="500"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                </div>
              </div>

              {/* Experience & Registration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.experience_years || 0}
                    onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Registration No
                  </label>
                  <input
                    type="text"
                    value={formData.registration_number || ''}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    placeholder="MCI-12345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Clinic / OPD Room
                  </label>
                  <input
                    type="text"
                    list="doctor-rooms-list"
                    value={formData.clinic_room || ''}
                    onChange={(e) => setFormData({ ...formData, clinic_room: e.target.value })}
                    placeholder="Room 204"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                  <datalist id="doctor-rooms-list">
                    {roomOptions.map((opt) => (
                      <option key={opt.id} value={opt.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Contact Information (Phone / WhatsApp & Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    WhatsApp / Contact Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@rhythmmedicity.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                </div>
              </div>

              {/* Available Days Selector */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">
                  Available Consultation Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {allWeekDays.map((day) => {
                    const isSelected = (formData.available_days || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#006655] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{day.slice(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timings & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    OPD Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.available_time_start || '09:00'}
                    onChange={(e) => setFormData({ ...formData, available_time_start: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    OPD End Time
                  </label>
                  <input
                    type="time"
                    value={formData.available_time_end || '17:00'}
                    onChange={(e) => setFormData({ ...formData, available_time_end: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EntityStatus })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white text-sm"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Dillo AI Assistant Recommendations Toggle */}
              <div className="p-3.5 rounded-2xl bg-[#E0F2ED]/60 border border-[#006655]/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#006655] flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-[#C4A760]" />
                    <span>Show this doctor in Dillo AI recommendations</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    When enabled, Dillo AI will recommend this doctor to patients inquiring about relevant medical concerns.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.show_in_dillo !== false}
                    onChange={(e) => setFormData({ ...formData, show_in_dillo: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006655]"></div>
                </label>
              </div>

              {/* Bio */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Doctor Biography / Description
                </label>
                <textarea
                  rows={3}
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Professional background, clinical focus, and fellowship details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingDoctor ? 'Save Changes' : 'Create Doctor Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Doctor Profile?"
        message={`Are you sure you want to permanently remove ${deleteTarget?.full_name}? Existing appointment history will retain snapshot doctor details.`}
        confirmText="Delete Doctor"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
