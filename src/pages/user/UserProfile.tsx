import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  MapPin,
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  Camera,
  Trash2,
  AlertTriangle,
  Lock,
  X,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PatientService } from '../../services/patientService';
import { PatientAccountService } from '../../services/patientAccountService';
import { useToast } from '../../contexts/ToastContext';
import { Gender } from '../../types/database';
import { useDropdownOptions } from '../../contexts/DropdownContext';

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, patientProfile, refreshProfile, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { options: genderOptions } = useDropdownOptions('gender');

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (patientProfile) {
      setFullName(patientProfile.full_name || '');
      setAge(patientProfile.age || '');
      setDob(patientProfile.dob || '');
      setGender(patientProfile.gender || 'Male');
      setAddress(patientProfile.address || '');
      setMobile(patientProfile.mobile || '');
      setPhotoUrl(patientProfile.photo_url || null);
    }
  }, [patientProfile]);

  // Handle Photo File Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be under 5MB.', 'warning');
      return;
    }

    setUploadingPhoto(true);
    try {
      const uploadedUrl = await PatientAccountService.uploadPatientPhoto(file);
      setPhotoUrl(uploadedUrl);

      if (user?.id) {
        await PatientAccountService.updatePatientPhoto(user.id, uploadedUrl);
        await PatientService.createOrUpdateProfile({
          auth_user_id: user.id,
          photo_url: uploadedUrl,
        });
        await refreshProfile();
      }
      showToast('Profile picture uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoUrl(null);
    if (user?.id) {
      try {
        await PatientAccountService.updatePatientPhoto(user.id, '');
        await PatientService.createOrUpdateProfile({
          auth_user_id: user.id,
          photo_url: null,
        });
        await refreshProfile();
        showToast('Profile picture removed.', 'info');
      } catch (_) {}
    }
  };

  // Submit Profile Changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!fullName.trim()) {
      showToast('Please enter your full name.', 'warning');
      return;
    }

    setSaving(true);
    try {
      await PatientService.createOrUpdateProfile({
        auth_user_id: user.id,
        full_name: fullName.trim(),
        age: age ? Number(age) : null,
        dob: dob || null,
        gender,
        address: address.trim() || null,
        mobile: mobile.trim() || null,
        email: user.email,
        photo_url: photoUrl,
      });

      if (photoUrl) {
        await PatientAccountService.updatePatientPhoto(user.id, photoUrl);
      }

      await refreshProfile();
      showToast('Patient profile updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Confirm Account Deletion with Password
  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      showToast('Please enter your password to confirm.', 'warning');
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteAccount(deletePassword);
      if (res.success) {
        setShowDeleteModal(false);
        showToast('✓ Your account has been permanently deleted.', 'success');
        navigate('/');
      } else {
        showToast(res.error || 'Incorrect password. Account deletion failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting account.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#006655]">Patient Profile</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep your medical identity, photo, and contact details current for hospital appointments.
            </p>
          </div>
        </div>

        {/* 1. Profile Picture Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-[#E0F2ED] text-[#006655] font-black text-2xl flex items-center justify-center overflow-hidden border-2 border-[#006655]/30 shadow-xs">
              {uploadingPhoto ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#006655]" />
              ) : photoUrl ? (
                <img src={photoUrl} alt="Patient Profile" className="w-full h-full object-cover" />
              ) : (
                fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'P'
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#006655] hover:bg-[#004C3D] text-white flex items-center justify-center shadow-md transition"
              title="Upload / Change Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="font-bold text-slate-800 text-sm">Profile Picture</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Upload a clear face photo. This picture will appear on your medical records and hospital registry.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#006655] text-slate-700 hover:text-[#006655] rounded-xl text-xs font-bold transition shadow-2xs"
              >
                {photoUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Profile Details Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Patient Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Legal full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                min={1}
                max={125}
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 29"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white text-xs"
              >
                {genderOptions.length > 0 ? (
                  genderOptions.map((opt) => (
                    <option key={opt.id} value={opt.name}>
                      {opt.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Residential Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#006655] absolute left-3.5 top-3" />
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Home address, city, postal code"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-rose-900">Danger Zone: Delete Account</h3>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
              Permanently delete your patient account and profile. This action cannot be undone. To prevent accidental deletion, your password will be required.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setDeletePassword('');
              setShowDeleteModal(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete My Account</span>
          </button>
        </div>
      </div>

      {/* Password Confirmation Popup Modal for Account Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Confirm Account Deletion</h3>
                  <span className="text-xs text-rose-600 font-semibold">Security Verification Required</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete your Rhythm Medicity account (<strong>{user?.email}</strong>)? Please enter your current account password below to confirm deletion.
            </p>

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{deleting ? 'Deleting...' : 'Confirm & Delete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
