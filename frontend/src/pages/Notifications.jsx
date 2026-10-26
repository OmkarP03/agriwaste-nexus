import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API } from '../utils/apiRoot';
import SectionHead from '../components/SectionHead';
import EmptyState from '../components/EmptyState';
import { IMG } from '../utils/media';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    loadNotifications();
    // eslint-disable-next-line
  }, [user]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/notifications/${user._id}`);
      const list = res.data.notifications || [];
      setNotifications(list);

      // Opening this page is what "reading" them means. Mark the unread
      // ones read, then tell the sidebar so its badge updates without a
      // page reload.
      if (list.some(n => !n.read)) {
        await axios.put(`${API}/notifications/read-all/${user._id}`);
        window.dispatchEvent(new CustomEvent('notifications:read'));
        setNotifications(list.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionHead
        icon="🔔"
        title="Notifications"
        sub={notifications.length ? `${notifications.length} update${notifications.length === 1 ? '' : 's'}` : 'Updates on your listings and requests'}
        action={
          <button className="btn btn-outline btn-sm" onClick={loadNotifications}>
            ↻ Refresh
          </button>
        }
      />

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading notifications…</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="No notifications yet"
          description="You will be notified here when a buyer sends a purchase request, or when the status of one of your listings changes."
          image={IMG.field}
        />
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="timeline">
              {notifications.map(n => (
                <div className="tl-item" key={n._id}>
                  <span className="tl-dot" aria-hidden="true">🔔</span>
                  <div className="tl-title">{n.message}</div>
                  <div className="tl-meta">{new Date(n.createdAt).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
