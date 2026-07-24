import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CreditCard, Plus, Calendar, DollarSign, CheckCircle2, Clock, X, Building2 } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppContext';
import { fetchSubscriptions, createSubscription, updateSubscriptionStatus } from '../services/api';
import { formatDate, formatCurrency } from '../utils';

const PLAN_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const STATUS_COLORS = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  expired: 'gray',
};

const CompanySubscriptions = () => {
  const { companyId } = useParams();
  const toast = useToast();
  const { companies, refresh } = useAppStore();

  const company = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companies, companyId]
  );

  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Default end date = 1 year from now
  const getDefaultEndDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const defaultForm = {
    amount: '',
    plan_type: 'yearly',
    plan_end_date: getDefaultEndDate(),
    status: 'paid',
  };
  const [form, setForm] = useState(defaultForm);

  const loadSubscriptions = async () => {
    if (!companyId) return;
    setLoadingSubs(true);
    try {
      const data = await fetchSubscriptions(companyId);
      setSubscriptions(data);
    } catch (err) {
      toast({ message: 'Failed to load subscriptions', type: 'error' });
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [companyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'plan_type') {
        const d = new Date();
        if (value === 'monthly') d.setMonth(d.getMonth() + 1);
        else if (value === 'quarterly') d.setMonth(d.getMonth() + 3);
        else if (value === 'yearly') d.setFullYear(d.getFullYear() + 1);
        next.plan_end_date = d.toISOString().split('T')[0];
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast({ message: 'Please enter a valid amount', type: 'error' });
      return;
    }
    if (!form.plan_end_date) {
      toast({ message: 'Please set a plan end date', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await createSubscription({
        company_id: companyId,
        amount: Number(form.amount),
        plan_type: form.plan_type,
        plan_end_date: form.plan_end_date,
        status: form.status,
      });
      toast({ message: 'Subscription payment recorded! Company activated.', type: 'success' });
      setShowForm(false);
      setForm(defaultForm);
      await loadSubscriptions();
      await refresh();
    } catch (err) {
      toast({ message: err?.response?.data?.error || 'Failed to record payment', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (subId) => {
    if (!window.confirm('Are you sure you want to mark this payment as paid?')) return;
    try {
      await updateSubscriptionStatus(subId, 'paid');
      toast({ message: 'Subscription marked as paid!', type: 'success' });
      await loadSubscriptions();
      await refresh();
    } catch (err) {
      toast({ message: 'Failed to update status', type: 'error' });
    }
  };

  const totalPaid = useMemo(
    () => subscriptions.filter((s) => s.status === 'paid').reduce((sum, s) => sum + Number(s.amount || 0), 0),
    [subscriptions]
  );

  const latestSub = useMemo(
    () => subscriptions.length > 0
      ? [...subscriptions].sort((a, b) => new Date(b.plan_end_date) - new Date(a.plan_end_date))[0]
      : null,
    [subscriptions]
  );

  const isExpired = latestSub ? new Date(latestSub.plan_end_date) < new Date() : true;

  return (
    <MobileLayout>
      <Header
        title="Subscriptions"
        subtitle={company?.name || 'Company'}
        showBack
        rightAction={
          <Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>Add Payment</Button>
        }
      />

      <div className="px-4 pt-4 pb-24 flex flex-col gap-5">
        {/* Company info banner */}
        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Building2 size={22} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">{company?.name || 'Unknown'}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge color={company?.status === 'active' ? 'success' : 'danger'} dot size="sm">
                  {company?.status || 'unknown'}
                </Badge>
                {latestSub && (
                  <Badge color={isExpired ? 'danger' : 'success'} size="sm">
                    {isExpired ? 'Expired' : `Valid until ${formatDate(latestSub.plan_end_date)}`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Summary cards */}
        <div className="flex gap-3">
          <Card className="flex-1 text-center">
            <div className="text-xl font-extrabold text-primary-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-gray-500 mt-0.5">Total Paid</p>
          </Card>
          <Card className="flex-1 text-center">
            <div className="text-xl font-extrabold text-gray-800">{subscriptions.length}</div>
            <p className="text-xs text-gray-500 mt-0.5">Payments</p>
          </Card>
        </div>

        {/* Add payment form */}
        {showForm && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Record Subscription Payment</p>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Amount (₹)"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                placeholder="e.g. 5000"
                icon={DollarSign}
                required
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Plan Type</label>
                <div className="flex gap-2 flex-wrap">
                  {PLAN_TYPES.map((t) => (
                    <label
                      key={t.value}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-2 transition-all
                        ${form.plan_type === t.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-100 bg-gray-50 text-gray-600'}`}
                    >
                      <input type="radio" name="plan_type" value={t.value}
                        checked={form.plan_type === t.value} onChange={handleChange} className="hidden" />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Plan End Date"
                name="plan_end_date"
                type="date"
                value={form.plan_end_date}
                onChange={handleChange}
                icon={Calendar}
                required
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Status</label>
                <div className="flex gap-2">
                  {['paid', 'pending'].map((s) => (
                    <label
                      key={s}
                      className={`flex-1 flex items-center justify-center py-2 rounded-xl border-2 cursor-pointer text-xs font-semibold transition-all
                        ${form.status === s
                          ? (s === 'paid' ? 'border-success-500 bg-success-50 text-success-700' : 'border-warning-500 bg-warning-50 text-warning-700')
                          : 'border-gray-100 text-gray-400'}`}
                    >
                      <input type="radio" name="status" value={s} checked={form.status === s}
                        onChange={handleChange} className="hidden" />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" size="full" loading={saving} icon={CreditCard}>
                Record Payment
              </Button>
            </form>
          </Card>
        )}

        {/* Payment history */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-gray-500" />
            <p className="text-sm font-bold text-gray-700">Payment History</p>
          </div>

          {loadingSubs ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
          ) : subscriptions.length === 0 ? (
            <Card className="text-center py-8">
              <CreditCard size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">No subscription payments yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Add Payment" to record the first one</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {[...subscriptions]
                .sort((a, b) => new Date(b.plan_end_date) - new Date(a.plan_end_date))
                .map((sub) => {
                  const endDate = new Date(sub.plan_end_date);
                  const isActive = endDate >= new Date();
                  return (
                    <Card key={sub.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-success-50' : 'bg-gray-50'}`}>
                            {isActive
                              ? <CheckCircle2 size={18} className="text-success-600" />
                              : <Clock size={18} className="text-gray-400" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(sub.amount)}</p>
                            <p className="text-xs text-gray-500 capitalize">{sub.plan_type} plan</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge color={STATUS_COLORS[sub.status] || 'gray'} size="sm">
                            {sub.status}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            {isActive ? 'Valid' : 'Expired'} · {formatDate(sub.plan_end_date)}
                          </p>
                        </div>
                      </div>
                      {sub.status === 'pending' && (
                         <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                           <Button size="sm" onClick={() => handleMarkPaid(sub.id)}>Mark as Paid</Button>
                         </div>
                      )}
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default CompanySubscriptions;
