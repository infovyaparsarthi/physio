import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Phone, Clipboard, Calendar, MessageSquare, Trash2, UserPlus } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppContext';
import { formatDate } from '../utils';

const Enquiries = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { enquiries, addEnquiry, deleteEnquiry } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize date to today's date in YYYY-MM-DD
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [form, setForm] = useState({
    name: '',
    phone: '',
    reason: '',
    date: getTodayDateString(),
    source: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) {
      errs.phone = 'Phone must be exactly 10 digits';
    }
    if (!form.reason.trim()) errs.reason = 'Reason for enquiry is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.source.trim()) errs.source = 'Source of enquiry is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast({ message: 'Please correct the errors before submitting', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await addEnquiry({
        name: form.name.trim(),
        phone: form.phone.trim(),
        reason: form.reason.trim(),
        date: form.date,
        source: form.source.trim(),
      });
      toast({ message: 'Enquiry added successfully!', type: 'success' });
      setForm({
        name: '',
        phone: '',
        reason: '',
        date: getTodayDateString(),
        source: '',
      });
      setShowForm(false);
    } catch (err) {
      toast({
        message: err?.response?.data?.error || 'Failed to add enquiry',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the enquiry from ${name}?`)) {
      try {
        await deleteEnquiry(id);
        toast({ message: 'Enquiry deleted', type: 'success' });
      } catch (err) {
        toast({ message: 'Failed to delete enquiry', type: 'error' });
      }
    }
  };

  const handleConvertToPatient = (enq) => {
    navigate(`/patients/new?name=${encodeURIComponent(enq.name)}&phone=${encodeURIComponent(enq.phone)}`);
  };

  return (
    <MobileLayout>
      <Header
        title="Enquiries"
        subtitle="Manage and track enquiries"
        rightAction={
          <Button size="sm" icon={Plus} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add'}
          </Button>
        }
      />

      <div className="px-4 pt-4 pb-24 flex flex-col gap-5">
        {showForm && (
          <Card>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">New Enquiry</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                icon={User}
                required
                error={errors.name}
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                icon={Phone}
                required
                error={errors.phone}
              />
              <Input
                label="Reason for Enquiry"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="e.g. Back pain consultation, physiotherapy cost"
                icon={Clipboard}
                required
                error={errors.reason}
              />
              <Input
                label="Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                icon={Calendar}
                required
                error={errors.date}
              />
              <Input
                label="From where enquiry came (Source)"
                name="source"
                type="textarea"
                value={form.source}
                onChange={handleChange}
                placeholder="e.g. Instagram ad, referred by Dr. Gupta, walk-in..."
                icon={MessageSquare}
                rows={3}
                required
                error={errors.source}
              />
              <Button type="submit" size="full" loading={saving} className="mt-2">
                Add Enquiry
              </Button>
            </form>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Enquiry List ({enquiries.length})
          </p>

          {enquiries.length === 0 ? (
            <Card className="text-center py-12">
              <MessageSquare size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500">No enquiries found</p>
              <p className="text-xs text-gray-400 mt-1">Click Add on top right to record a new enquiry</p>
            </Card>
          ) : (
            enquiries.map((enq) => (
              <Card key={enq.id} className="relative overflow-hidden">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 truncate">{enq.name}</span>
                      <Badge color="primary" size="sm">
                        {formatDate(enq.date)}
                      </Badge>
                    </div>
                    <a
                      href={`tel:${enq.phone}`}
                      className="text-xs text-primary-600 font-semibold flex items-center gap-1.5 hover:underline mb-2"
                    >
                      <Phone size={12} />
                      {enq.phone}
                    </a>
                    
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5 text-xs text-gray-600">
                      <div>
                        <span className="font-bold text-gray-700">Reason:</span> {enq.reason}
                      </div>
                      <div className="border-t border-gray-100/70 pt-1.5">
                        <span className="font-bold text-gray-700">Source:</span> {enq.source}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleConvertToPatient(enq)}
                      className="p-2 rounded-xl bg-success-50 hover:bg-success-100 text-success-600 border border-success-100 active:scale-95 transition-all"
                      title="Convert to Patient"
                    >
                      <UserPlus size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(enq.id, enq.name)}
                      className="p-2 rounded-xl bg-danger-50 hover:bg-danger-100 text-danger-600 border border-danger-100 active:scale-95 transition-all"
                      title="Delete Enquiry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Enquiries;
