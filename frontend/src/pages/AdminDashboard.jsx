import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {PieChart,Pie,Cell,Tooltip,ResponsiveContainer} from 'recharts';
import { API } from '../utils/apiRoot';

export default function AdminDashboard() {

  const [stats, setStats] = useState(null);
const [users, setUsers] = useState([]);
const [listings, setListings] = useState([]);
const [cropData, setCropData] = useState([]);
const [requests,setRequests] = useState([]);
const [pendingBuyers, setPendingBuyers] = useState([]);
const [flagged, setFlagged]   = useState([]);
const [busy, setBusy]         = useState('');
const [adminMsg, setAdminMsg] = useState('');
  useEffect(() => {
  loadStats();
  loadUsers();
  loadListings();
    loadCropAnalytics();
    loadRequests();
    loadBuyers();
    loadModeration();
}, []);

  function flash(m) { setAdminMsg(m); setTimeout(() => setAdminMsg(''), 3500); }

  // ── Buyer verification ──────────────────────────────────
  // "Verified Buyer" used to be decoration. It now means an admin on
  // this screen looked at the account and confirmed it.
  async function loadBuyers() {
    try {
      const res = await axios.get(`${API}/buyers?all=1`);
      setPendingBuyers(res.data.buyers || []);
    } catch (err) {
      console.log(err);
    }
  }

  async function setVerified(id, verified) {
    setBusy(id);
    try {
      await axios.put(`${API}/admin/users/${id}/verify`, { verified });
      flash(verified ? '✅ Buyer verified' : '↩️ Verification removed');
      loadBuyers();
    } catch (err) {
      flash(`❌ ${err.response?.data?.message || 'Could not update this buyer'}`);
    } finally {
      setBusy('');
    }
  }

  // ── Listing moderation ──────────────────────────────────
  async function loadModeration() {
    try {
      const res = await axios.get(`${API}/admin/moderation/listings`);
      setFlagged(res.data.listings || []);
    } catch (err) {
      console.log(err);
    }
  }

  async function moderate(id, state, reason) {
    setBusy(id);
    try {
      await axios.put(`${API}/admin/listings/${id}/moderate`, { state, reason });
      flash(
        state === 'removed' ? '🚫 Listing removed from the marketplace'
          : state === 'flagged' ? '🚩 Listing flagged for review'
          : '✅ Listing approved'
      );
      loadModeration();
      loadListings();
    } catch (err) {
      flash(`❌ ${err.response?.data?.message || 'Could not moderate this listing'}`);
    } finally {
      setBusy('');
    }
  }

  async function loadStats() {
    try {

      const res = await axios.get(
        `${API}/admin/stats`
      );

      setStats(res.data);

    } catch (err) {

      console.log(err);

    }
  }
async function loadUsers() {

  try {

    const res = await axios.get(
      `${API}/admin/users`
    );

    setUsers(res.data.users);

  } catch (err) {

    console.log(err);

  }

}
async function loadListings() {

  try {

    const res = await axios.get(
      `${API}/admin/listings`
    );

    setListings(
      res.data.listings
    );

  } catch (err) {

    console.log(err);

  }

}
async function deleteUser(id) {

  const ok = window.confirm(
    'Delete this user?'
  );

  if (!ok) return;

  try {

    await axios.delete(
      `${API}/admin/users/${id}`
    );

    loadUsers();
    loadStats();

  } catch (err) {

    console.log(err);

  }

}

async function deleteListing(id) {

  const ok = window.confirm(
    'Delete this listing?'
  );

  if (!ok) return;

  try {

    await axios.delete(
      `${API}/admin/listings/${id}`
    );

    loadListings();
    loadStats();

  } catch (err) {

    console.log(err);

  }

}

async function loadCropAnalytics() {

  try {

    const res = await axios.get(
      `${API}/admin/analytics/crops`
    );

    setCropData(res.data.crops);

  } catch (err) {

    console.log(err);

  }

}

async function loadRequests(){

  try{

    const res =
    await axios.get(
      `${API}/requests/all`
    );

    setRequests(
      res.data.requests
    );

  }catch(err){

    console.log(err);

  }

}

const requestChartData = [
  {
    name: 'Accepted',
    value: requests.filter(
      r => r.status === 'accepted'
    ).length
  },
  {
    name: 'Pending',
    value: requests.filter(
      r => r.status === 'pending'
    ).length
  },
  {
    name: 'Rejected',
    value: requests.filter(
      r => r.status === 'rejected'
    ).length
  }
];

const completedDeals =
requests.filter(
  r => r.status === 'completed'
).length;

  if (!stats) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading platform data…
      </div>
    );
  }

  return (
    <div>

      <h2>👑 Admin Dashboard</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(220px,1fr))',
          gap: 15
        }}
      >

        <div className="card">
          <div className="card-body">
            <h3>👨‍🌾 Farmers</h3>
            <h1>{stats.farmers}</h1>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3>🏭 Buyers</h3>
            <h1>{stats.buyers}</h1>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3>👑 Admins</h3>
            <h1>{stats.admins}</h1>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3>📊 Calculations</h3>
            <h1>{stats.calculations}</h1>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3>📋 Listings</h3>
            <h1>{stats.listings}</h1>
          </div>
        </div>

            </div>

      {adminMsg && (
        <div className="alert alert-success" role="status" style={{ marginTop: 18 }}>
          {adminMsg}
        </div>
      )}

      {/* ══════════════ BUYER VERIFICATION ══════════════ */}
      <div style={{ marginTop: 40 }}>
        <h2>✅ Buyer Verification</h2>
        <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 12, maxWidth: '68ch' }}>
          Verifying an account means you have checked the buyer's details and are
          happy for farmers to see them in the directory. It is an AgriWaste Nexus
          check only — not a government or certification-body approval. Unverified
          buyers stay hidden from the directory.
        </p>

        <div className="card">
          <div className="card-body">
            {pendingBuyers.length === 0 ? (
              <p className="muted" style={{ fontSize: '0.85rem' }}>No buyer accounts yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <caption className="sr-only">Buyer accounts and their verification status</caption>
                  <thead>
                    <tr>
                      <th scope="col">Buyer</th>
                      <th scope="col">Type</th>
                      <th scope="col">District</th>
                      <th scope="col" className="num">Capacity</th>
                      <th scope="col">Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBuyers.map(b => (
                      <tr key={b._id}>
                        <td>
                          <strong style={{ color: 'var(--ink)' }}>{b.companyName || b.name}</strong>
                          {b.companyName && <div className="muted" style={{ fontSize: '0.75rem' }}>{b.name}</div>}
                        </td>
                        <td>{b.buyerType || '—'}</td>
                        <td>{[b.village, b.district].filter(Boolean).join(', ') || '—'}</td>
                        <td className="num">{b.capacityTonsPerDay ? `${b.capacityTonsPerDay} T/day` : '—'}</td>
                        <td>
                          {b.verified
                            ? <span className="pill pill-accepted">✓ Verified</span>
                            : <span className="pill pill-pending">Awaiting review</span>}
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${b.verified ? 'btn-outline' : 'btn-primary'}`}
                            disabled={busy === b._id}
                            onClick={() => setVerified(b._id, !b.verified)}
                          >
                            {busy === b._id ? '…' : b.verified ? 'Remove verification' : 'Verify'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════ LISTING MODERATION ══════════════ */}
      <div style={{ marginTop: 40 }}>
        <h2>🚩 Listing Moderation</h2>
        <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 12, maxWidth: '68ch' }}>
          Listings waiting for a decision, plus anything flagged. Removing a listing
          hides it from the marketplace and tells the farmer why.
        </p>

        <div className="card">
          <div className="card-body">
            {flagged.length === 0 ? (
              <p className="muted" style={{ fontSize: '0.85rem' }}>Nothing waiting for review.</p>
            ) : (
              <div className="stack">
                {flagged.map(l => (
                  <div className="mod-row" key={l._id}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong style={{ color: 'var(--ink)' }}>
                        {l.wasteType || l.cropType} — {l.quantity} tons
                      </strong>
                      <div className="muted" style={{ fontSize: '0.78rem', marginTop: 3 }}>
                        {l.farmerName} · {l.location || 'no location'} ·{' '}
                        {l.postedDate ? new Date(l.postedDate).toLocaleDateString('en-IN') : '—'}
                      </div>
                      {l.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray-700)', marginTop: 6 }}>
                          {l.description}
                        </p>
                      )}
                      {l.moderation?.state === 'flagged' && (
                        <div className="muted" style={{ fontSize: '0.76rem', marginTop: 4 }}>
                          🚩 Flagged{l.moderation.reason ? `: ${l.moderation.reason}` : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={busy === l._id}
                        onClick={() => moderate(l._id, 'ok')}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={busy === l._id}
                        onClick={() => moderate(l._id, 'flagged', 'Needs a closer look')}
                      >
                        🚩 Flag
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={busy === l._id}
                        onClick={() => moderate(l._id, 'removed', 'Removed by an administrator')}
                      >
                        🚫 Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

            <div style={{ marginTop: 40 }}>

  <h2>📋 Listing Management</h2>

  <div className="card">

    <div className="card-body">

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >

        <thead>

          <tr>

            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Farmer</th>
            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Crop</th>
            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Waste</th>
            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Quantity</th>
            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Price/Ton</th>
            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Action</th>

          </tr>

        </thead>

        <tbody>

          {listings.map(listing => (

            <tr key={listing._id}>

              <td>{listing.farmerName}</td>

              <td>{listing.cropType}</td>

              <td>{listing.wasteType}</td>

              <td>{listing.quantity}</td>

              <td>₹{listing.pricePerTon}</td>

              <td>

                <button
                  className="btn btn-outline"
                  onClick={() =>
                    deleteListing(
                      listing._id
                    )
                  }
                >
                  🗑 Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  </div>

</div>

<div className="card">
  <div className="card-body">
    <h3>🎉 Completed Deals</h3>
    <h1>{completedDeals}</h1>
  </div>
</div>

<div style={{ marginTop: 30 }}>

  <h2>🌾 Crop Analytics</h2>
<div className="card">

  <div className="card-body"></div>
  <table
    style={{
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: 10
    }}
  >

    <thead>

      <tr>

        <th  style={{padding: '12px',textAlign: 'left',borderBottom: '2px solid #ddd'}}>Crop</th>
        <th  style={{padding: '12px',textAlign: 'left',borderBottom: '2px solid #ddd'}}>Listings</th>

      </tr>

    </thead>

    <tbody>

      {cropData.map(crop => (

        <tr key={crop._id}>

          <td  style={{padding:'12px',borderBottom:'1px solid #eee'}}>{crop._id}</td>

          <td  style={{padding:'12px',borderBottom:'1px solid #eee'}}>{crop.count}</td>

        </tr>

      ))}

    </tbody>

  </table>

</div>

</div>

<div style={{ marginTop: 30 }}>

  <h2>📊 Crop Distribution</h2>

  <div
    className="card"
    style={{ height: 350 }}
  >

    <ResponsiveContainer>

      <PieChart>

        <Pie
          data={cropData}
          dataKey="count"
          nameKey="_id"
          outerRadius={120}
          label
        >

          {cropData.map(
            (entry,index) => (
              <Cell
                key={index}
                fill={[
                  '#2C5F2D',
                  '#4CAF50',
                  '#8BC34A',
                  '#CDDC39',
                  '#FFC107'
                ][index % 5]}
              />
            )
          )}

        </Pie>

        <Tooltip />

      </PieChart>

    </ResponsiveContainer>

  </div>

</div>

     <div style={{ marginTop: 30 }}>

  <h2>👨‍🌾 User Management</h2>

  <div className="card">

    <div className="card-body">

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: 15
        }}
      >

        <thead
  style={{
    background: '#f3f4f6'
  }}
>

          <tr>

            <th style={{padding: '12px',textAlign: 'left',borderBottom: '2px solid #ddd'}}>Name</th>
            <th style={{padding: '12px',textAlign: 'left',borderBottom: '2px solid #ddd'}}>Email</th>
            <th style={{padding: '12px',textAlign: 'left',borderBottom: '2px solid #ddd'}}>Role</th>
            <th style={{padding: '12px',textAlign: 'left',borderBottom: '2px solid #ddd'}}>District</th>
            <th style={{padding: '12px',textAlign: 'left',borderBottom: '2px solid #ddd'}}>Action</th>

          </tr>

        </thead>

        <tbody>

          {users.map(user => (

            <tr key={user._id}>

              <td style={{padding: '12px',borderBottom: '1px solid #eee'}}>{user.name}</td>

              <td style={{padding: '12px',borderBottom: '1px solid #eee'}}>{user.email}</td>

              <td style={{padding: '12px',borderBottom: '1px solid #eee'}}>{user.role}</td>

              <td style={{padding: '12px',borderBottom: '1px solid #eee'}}>{user.district}</td>

              <td>

                <button
                  className="btn btn-outline"
                  onClick={() =>
                    deleteUser(user._id)
                  }
                >
                  🗑 Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  </div>

</div>

<div style={{ marginTop: 30 }}>

  <h2>📨 Request Monitoring</h2>

  <div className="card">

    <div className="card-body">

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}
      >

        <thead>
          <tr>
            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Buyer</th>
            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Farmer</th>
            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Quantity</th>
            <th style={{padding:'12px',textAlign:'left',borderBottom:'2px solid #ddd'}}>Status</th>
          </tr>
        </thead>

        <tbody>

          {requests.map(r => (

            <tr key={r._id}>

              <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>{r.buyerName}</td>

              <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>{r.farmerName}</td>

              <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>{r.quantity} Tons</td>

              <td>
                {r.status === 'pending' && '🟡 Pending'}
                {r.status === 'accepted' && '🟢 Accepted'}
                {r.status === 'rejected' && '🔴 Rejected'}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  </div>

  </div>

<div style={{ marginTop: 30 }}>

  <h2>📨 Request Status</h2>

  <div
    className="card"
    style={{ height: 350 }}
  >

    <ResponsiveContainer>

      <PieChart>

        <Pie
          data={requestChartData}
          dataKey="value"
          nameKey="name"
          outerRadius={120}
          label
        >

          {requestChartData.map(
            (entry,index) => (
              <Cell
                key={index}
                fill={[
                  '#4CAF50',
                  '#FFC107',
                  '#F44336'
                ][index]}
              />
            )
          )}

        </Pie>

        <Tooltip />

      </PieChart>

    </ResponsiveContainer>

  </div>

</div>

    </div>



);

}




