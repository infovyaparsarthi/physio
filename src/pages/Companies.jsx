import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Mail, Phone, Edit2, CreditCard, X, KeyRound } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppContext';
import { resetCompanyPassword } from '../services/api';
import { compressImage } from '../utils';

const COMPANY_STATUS = {
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'danger' },
};

const CompanyCard = ({ company, onEdit, onManageSub, onResetPassword }) => (
  <Card hover>
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
        <Building2 size={18} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-sm text-gray-900 truncate">{company.name}</p>
          <Badge color={COMPANY_STATUS[company.status]?.color || 'gray'} dot size="sm">
            {company.status}
          </Badge>
        </div>
        {company.email && (
          <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
            <Mail size={11} /> {company.email}
          </p>
        )}
        {company.phone && (
          <p className="text-xs text-gray-400 mt-0.5 truncate flex items-center gap-1">
            <Phone size={11} /> {company.phone}
          </p>
        )}
        {(company.city || company.state) && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {company.city}{company.city && company.state ? ', ' : ''}{company.state}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(company); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 border border-gray-100 active:scale-95 transition-all"
          >
            <Edit2 size={12} /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onManageSub(company); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-xs font-semibold text-primary-700 border border-primary-100 active:scale-95 transition-all"
          >
            <CreditCard size={12} /> Subscription
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onResetPassword(company); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning-50 hover:bg-warning-100 text-xs font-semibold text-warning-700 border border-warning-100 active:scale-95 transition-all ml-auto"
          >
            <KeyRound size={12} /> Reset Pass
          </button>
        </div>
      </div>
    </div>
  </Card>
);

const Companies = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { companies, addNewCompany, updateCompanyById, loading } = useAppStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);

  const defaultForm = { name: '', email: '', phone: '', address: '', city: '', state: '', details: '', logo: '', status: 'active' };
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search);
      const matchFilter =
        filter === 'all' || c.status === filter;
      return matchSearch && matchFilter;
    });
  }, [companies, search, filter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const openCreate = () => {
    setEditingCompany(null);
    setForm(defaultForm);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (company) => {
    setEditingCompany(company);
    setForm({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      details: company.details || '',
      logo: company.logo || '',
      status: company.status || 'active',
    });
    setErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    setForm(defaultForm);
    setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Company name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast({ message: 'Please fix errors', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        details: form.details.trim(),
        logo: form.logo,
        status: form.status,
      };
      if (editingCompany) {
        await updateCompanyById(editingCompany.id, payload);
        toast({ message: 'Company updated successfully!', type: 'success' });
        closeForm();
      } else {
        const created = await addNewCompany(payload);
        setNewCredentials({
          username: created.defaultUsername,
          password: created.defaultPassword
        });
        toast({ message: 'Company created successfully!', type: 'success' });
        closeForm();
      }
    } catch (err) {
      toast({ message: err?.response?.data?.error || 'Failed to save company', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (company) => {
    if (!window.confirm(`Are you sure you want to reset the password for ${company.name}?`)) return;
    try {
      const data = await resetCompanyPassword(company.id);
      setNewCredentials({
        username: company.email || 'Email missing - Check DB', // just for display
        password: data.password
      });
      toast({ message: 'Password reset successful!', type: 'success' });
    } catch (err) {
      toast({ message: 'Failed to reset password', type: 'error' });
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <Header title="Companies" subtitle="Loading…" />
        <div className="px-4 py-16 text-center text-gray-500 text-sm">Loading…</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <Header
        title="Companies"
        subtitle={`${companies.length} tenants`}
        rightAction={
          <Button size="sm" icon={Plus} onClick={openCreate}>Add</Button>
        }
      />

      <div className="px-4 pt-3 pb-24 flex flex-col gap-4">
        <Input
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {['all', 'active', 'inactive'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 font-medium">{filtered.length} companies found</p>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No companies found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={openEdit}
                onManageSub={(c) => navigate(`/companies/${c.id}/subscriptions`)}
                onResetPassword={handleResetPassword}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in pb-20">
          <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl relative max-h-[85vh]">
            <div className="p-6 shrink-0 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building2 size={18} className="text-primary-600" />
                  {editingCompany ? 'Edit Company' : 'New Company'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingCompany ? 'Update company details.' : 'Register a new SaaS tenant.'}
                </p>
              </div>
              <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto hide-scrollbar">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                      {form.logo ? (
                        <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={24} className="text-gray-300" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 shadow-lg transition-transform active:scale-95">
                      <Edit2 size={12} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const b64 = await compressImage(file, { maxWidth: 300, maxHeight: 300, quality: 0.8 });
                              setForm((p) => ({ ...p, logo: b64 }));
                            } catch (err) {
                              toast({ message: 'Failed to compress image', type: 'error' });
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">Company Logo</p>
                </div>

                <Input
                  label="Company Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Sunrise Physiotherapy"
                  icon={Building2}
                  required
                  error={errors.name}
                />
                <Input
                  label="Email"
                  name="email"
                  type="text"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. contact@clinic.com"
                  icon={Mail}
                  error={errors.email}
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  icon={Phone}
                />
                <Input
                  label="Address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street address"
                />
                <div className="flex gap-3">
                  <Input
                    label="City"
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="flex-1"
                  />
                  <Input
                    label="State"
                    name="state"
                    type="text"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="flex-1"
                  />
                </div>
                <Input
                  label="Details / Notes"
                  name="details"
                  type="text"
                  value={form.details}
                  onChange={handleChange}
                  placeholder="Any additional details"
                />

                {editingCompany && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</label>
                    <div className="flex gap-2">
                      {['active', 'inactive'].map((s) => (
                        <label
                          key={s}
                          className={`flex-1 flex items-center justify-center py-2 rounded-xl border-2 cursor-pointer text-xs font-semibold transition-all
                          ${form.status === s
                              ? (s === 'active' ? 'border-success-500 bg-success-50 text-success-700'
                                : 'border-danger-500 bg-danger-50 text-danger-700')
                              : 'border-gray-100 text-gray-400'
                            }`}
                        >
                          <input type="radio" name="status" value={s} checked={form.status === s}
                            onChange={handleChange} className="hidden" />
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button type="button" variant="ghost" className="flex-1 border border-gray-200 text-gray-600" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" loading={saving}>
                    {editingCompany ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {newCredentials && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-success-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Credentials Updated</h3>
            <p className="text-sm text-gray-500 mb-6">
              The user account has been successfully configured with the following default credentials:
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-100 mb-6">
              <div className="mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Username</p>
                <p className="font-mono text-sm font-semibold text-gray-900 select-all">{newCredentials.username}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Password</p>
                <p className="font-mono text-sm font-semibold text-gray-900 select-all">{newCredentials.password}</p>
              </div>
            </div>

            <Button size="full" onClick={() => setNewCredentials(null)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

export default Companies;
