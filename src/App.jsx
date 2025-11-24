import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";

/************************************
 DU Hostel Management System (Simple + Clean)
 - Routing: HashRouter (works on GitHub Pages)
 - Dummy credentials:
   • Student → user: student  pass: student123
   • Admin   → user: admin    pass: admin123
 - Storage: localStorage (no backend)
*************************************/

const LS = {
  ROOMS: "duhms_rooms_v2",
  BOOKINGS: "duhms_bookings_v2",
  MAINT: "duhms_maint_v2",
  CHANGES: "duhms_changes_v2",
  SESSION: "duhms_session_v2",
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, fb) => {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; }
};

function seedRooms() {
  const existing = load(LS.ROOMS, null);
  if (existing) return existing;
  const blocks = ["A", "B", "C", "D"];
  let id = 1; const out = [];
  for (const b of blocks) {
    for (let f = 1; f <= 3; f++) {
      for (let r = 1; r <= 4; r++) {
        out.push({ id: String(id++), number: `${b}-${f}0${r}`, block: b, floor: f, capacity: 2, occupants: [], type: f === 3 ? "Deluxe" : "Standard" });
      }
    }
  }
  save(LS.ROOMS, out); return out;
}

/************************************ App Shell ************************************/
export default function App() {
  // bootstrap seed
  useEffect(() => { seedRooms(); }, []);
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Topbar />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/admin" element={<AdminPortal />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </HashRouter>
  );
}

function Topbar() {
  const session = load(LS.SESSION, null);
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-indigo-600 px-2 py-1 text-xs font-semibold text-white">DU</span>
          <div className="font-semibold">Hostel Management</div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {session ? (
            <>
              <span className="text-gray-700">{session.role.toUpperCase()}</span>
              <button
                onClick={() => { localStorage.removeItem(LS.SESSION); nav("/"); }}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              >Logout</button>
            </>
          ) : (
            <span className="text-gray-500">Please log in</span>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Delhi University — Demo. All data stored locally in your browser.
      </div>
    </footer>
  );
}

/************************************ Login ************************************/
const CREDS = {
  admin: { user: "admin", pass: "admin123", role: "admin" },
  student: { user: "student", pass: "student123", role: "student" },
};

function Login() {
  const [role, setRole] = useState("student");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const s = load(LS.SESSION, null);
    if (s?.role === "admin") nav("/admin", { replace: true });
    if (s?.role === "student") nav("/student", { replace: true });
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const c = CREDS[role];
    if (user === c.user && pass === c.pass) {
      save(LS.SESSION, { role });
      nav(role === "admin" ? "/admin" : "/student");
    } else {
      setErr("Invalid username or password");
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex gap-2">
        <button onClick={() => setRole("student")} className={`rounded-xl px-3 py-1.5 text-sm ${role === "student" ? "bg-indigo-600 text-white" : "border"}`}>Student</button>
        <button onClick={() => setRole("admin")} className={`rounded-xl px-3 py-1.5 text-sm ${role === "admin" ? "bg-indigo-600 text-white" : "border"}`}>Admin</button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <div className="mb-1 text-gray-700">Username</div>
          <input value={user} onChange={(e) => setUser(e.target.value)} className="w-full rounded-xl border px-3 py-2" placeholder={role === "admin" ? "admin" : "student"} />
        </label>
        <label className="block text-sm">
          <div className="mb-1 text-gray-700">Password</div>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full rounded-xl border px-3 py-2" placeholder={role === "admin" ? "admin123" : "student123"} />
        </label>
        <button className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white">Login</button>
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      </form>
      <div className="mt-4 text-xs text-gray-500">
        Demo creds — Admin: admin/admin123 • Student: student/student123
      </div>
    </div>
  );
}

/************************************ Student ************************************/
function StudentPortal() {
  const nav = useNavigate();
  const session = load(LS.SESSION, null);
  useEffect(() => { if (session?.role !== "student") nav("/", { replace: true }); }, []);

  const rooms = load(LS.ROOMS, []);
  const [bookings, setBookings] = useState(load(LS.BOOKINGS, []));
  const [changes, setChanges] = useState(load(LS.CHANGES, []));
  const [maint, setMaint] = useState(load(LS.MAINT, []));

  useEffect(() => save(LS.BOOKINGS, bookings), [bookings]);
  useEffect(() => save(LS.CHANGES, changes), [changes]);
  useEffect(() => save(LS.MAINT, maint), [maint]);

  const myBooking = bookings.find((b) => b.status !== "cancelled" && b.role === "student");
  const assignedRoom = useMemo(() => {
    if (!myBooking || myBooking.status !== "approved") return null;
    return rooms.find((r) => r.id === myBooking.roomId) || null;
  }, [myBooking, rooms]);

  const availableRooms = rooms.filter((r) => (r.occupants?.length || 0) < r.capacity);

  const requestBooking = (roomId, fromDate) => {
    if (myBooking && ["pending", "approved"].includes(myBooking.status)) return alert("You already have a pending/approved booking");
    const req = { id: uid(), role: "student", roomId, fromDate, requestedAt: new Date().toISOString(), status: "pending" };
    setBookings((x) => [req, ...x]);
    alert("Booking request submitted");
  };

  const cancelBooking = () => {
    if (!myBooking) return;
    setBookings((x) => x.map((b) => (b.id === myBooking.id ? { ...b, status: "cancelled" } : b)));
  };

  const submitChange = (toRoomId, reason) => {
    if (!assignedRoom) return alert("No approved room yet");
    const exists = changes.find((c) => c.status === "pending");
    if (exists) return alert("You already have a pending change request");
    const req = { id: uid(), role: "student", fromRoomId: assignedRoom.id, toRoomId, reason, status: "pending", requestedAt: new Date().toISOString() };
    setChanges((x) => [req, ...x]);
    alert("Change request submitted");
  };

  const submitMaint = (subject, details, priority) => {
    const ticket = { id: uid(), subject, details, priority, status: "open", createdAt: new Date().toISOString(), role: "student", roomId: assignedRoom?.id || null };
    setMaint((x) => [ticket, ...x]);
    alert("Maintenance ticket created");
  };

  // UI
  const [tab, setTab] = useState("book");
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0,10));
  const [targetRoom, setTargetRoom] = useState(availableRooms[0]?.id || "");
  const [changeReason, setChangeReason] = useState("");
  const [msub, setMsub] = useState("");
  const [mdet, setMdet] = useState("");
  const [mprio, setMprio] = useState("Normal");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[["book","Book Room"],["status","My Status"],["change","Room Change"],["maint","Maintenance"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl px-4 py-2 text-sm ${tab===k?"bg-indigo-600 text-white":"border bg-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "book" && (
        <Card title="Book a Room">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <div className="mb-1 text-gray-700">Select Room (available)</div>
              <select value={targetRoom} onChange={(e)=>setTargetRoom(e.target.value)} className="w-full rounded-xl border px-3 py-2">
                {availableRooms.map(r=> <option key={r.id} value={r.id}>{r.number} — {r.type}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <div className="mb-1 text-gray-700">From Date</div>
              <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
            </label>
            <div className="md:col-span-2">
              <button onClick={()=>requestBooking(targetRoom, fromDate)} className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Submit Request</button>
            </div>
          </div>
        </Card>
      )}

      {tab === "status" && (
        <Card title="My Booking Status">
          {!myBooking ? (
            <p className="text-sm text-gray-600">No booking yet.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="Requested" value={new Date(myBooking.requestedAt).toLocaleString()} />
              <Row label="From" value={myBooking.fromDate} />
              <Row label="Room" value={rooms.find(r=>r.id===myBooking.roomId)?.number || "-"} />
              <StatusBadge status={myBooking.status} />
              {myBooking.status !== "cancelled" && (
                <button onClick={cancelBooking} className="mt-2 rounded-xl border px-3 py-1.5 hover:bg-gray-50">Cancel Booking</button>
              )}
              {assignedRoom && (
                <div className="rounded-xl bg-green-50 p-3 text-green-700">Assigned Room: <b>{assignedRoom.number}</b></div>
              )}
            </div>
          )}
        </Card>
      )}

      {tab === "change" && (
        <Card title="Request Room Change">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <div className="mb-1 text-gray-700">Target Room</div>
              <select value={targetRoom} onChange={(e)=>setTargetRoom(e.target.value)} className="w-full rounded-xl border px-3 py-2">
                {availableRooms.map(r=> <option key={r.id} value={r.id}>{r.number}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <div className="mb-1 text-gray-700">Reason</div>
              <input value={changeReason} onChange={(e)=>setChangeReason(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
            </label>
            <div className="md:col-span-2">
              <button onClick={()=>submitChange(targetRoom, changeReason)} className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Submit</button>
            </div>
          </div>
        </Card>
      )}

      {tab === "maint" && (
        <Card title="Maintenance">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <div className="mb-1 text-gray-700">Subject</div>
              <input value={msub} onChange={(e)=>setMsub(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
            </label>
            <label className="block text-sm">
              <div className="mb-1 text-gray-700">Priority</div>
              <select value={mprio} onChange={(e)=>setMprio(e.target.value)} className="w-full rounded-xl border px-3 py-2">
                <option>Low</option><option>Normal</option><option>High</option>
              </select>
            </label>
            <label className="md:col-span-2 block text-sm">
              <div className="mb-1 text-gray-700">Details</div>
              <textarea value={mdet} onChange={(e)=>setMdet(e.target.value)} className="h-24 w-full rounded-xl border px-3 py-2" />
            </label>
            <div className="md:col-span-2">
              <button onClick={()=>submitMaint(msub, mdet, mprio)} className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Raise Ticket</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/************************************ Admin ************************************/
function AdminPortal() {
  const nav = useNavigate();
  const session = load(LS.SESSION, null);
  useEffect(() => { if (session?.role !== "admin") nav("/", { replace: true }); }, []);

  const [rooms, setRooms] = useState(seedRooms());
  const [bookings, setBookings] = useState(load(LS.BOOKINGS, []));
  const [changes, setChanges] = useState(load(LS.CHANGES, []));
  const [maint, setMaint] = useState(load(LS.MAINT, []));

  useEffect(() => save(LS.BOOKINGS, bookings), [bookings]);
  useEffect(() => save(LS.CHANGES, changes), [changes]);
  useEffect(() => save(LS.MAINT, maint), [maint]);
  useEffect(() => save(LS.ROOMS, rooms), [rooms]);

  const occupancy = useMemo(() => {
    const total = rooms.length;
    const used = rooms.filter(r => (r.occupants?.length || 0) >= r.capacity).length;
    return { total, used, free: total - used };
  }, [rooms]);

  const decideBooking = (id, action) => {
    setBookings((bs) => bs.map(b => {
      if (b.id !== id || b.status !== "pending") return b;
      if (action === "approve") {
        const r = rooms.find(x=>x.id===b.roomId); if (!r) return { ...b, status: "rejected" };
        if ((r.occupants?.length || 0) >= r.capacity) return { ...b, status: "rejected" };
        setRooms(rs => rs.map(x => x.id===r.id ? { ...x, occupants: [...(x.occupants||[]), "student"] } : x));
        return { ...b, status: "approved" };
      }
      return { ...b, status: "rejected" };
    }));
  };

  const decideChange = (id, action) => {
    setChanges(cs => cs.map(c => {
      if (c.id !== id || c.status !== "pending") return c;
      if (action === "approve") {
        setRooms(rs => {
          const from = rs.find(r=>r.id===c.fromRoomId);
          const to = rs.find(r=>r.id===c.toRoomId);
          if (!from || !to) return rs;
          const removed = rs.map(r => r.id===from.id ? { ...r, occupants: (r.occupants||[]).slice(0, Math.max((r.occupants||[]).length-1,0)) } : r);
          return removed.map(r => r.id===to.id ? { ...r, occupants: [...(r.occupants||[]), "student"] } : r);
        });
        // move booking record roomId for clarity
        setBookings(bs => bs.map(b => b.status==="approved" ? { ...b, roomId: c.toRoomId } : b));
        return { ...c, status: "approved" };
      }
      return { ...c, status: "rejected" };
    }));
  };

  const resolveMaint = (id) => setMaint(ms => ms.map(m => m.id===id ? { ...m, status: "resolved" } : m));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-base font-semibold">Overview</div>
          <div className="text-sm text-gray-600">Rooms: {occupancy.total} • Occupied: {occupancy.used} • Free: {occupancy.free}</div>
        </div>
      </div>

      <Card title="Booking Requests">
        <Table
          columns={["Requested", "Room", "From", "Status", "Action"]}
          rows={bookings.map(b => [
            new Date(b.requestedAt).toLocaleString(),
            b.roomId,
            b.fromDate,
            <StatusBadge key={b.id} status={b.status} />,
            b.status === "pending" ? (
              <div key={b.id} className="flex gap-2">
                <button onClick={()=>decideBooking(b.id, "approve")} className="rounded-xl border px-2 py-1 text-xs">Approve</button>
                <button onClick={()=>decideBooking(b.id, "reject")} className="rounded-xl border px-2 py-1 text-xs">Reject</button>
              </div>
            ) : <span className="text-xs text-gray-500">—</span>
          ])}
          empty="No bookings"
        />
      </Card>

      <Card title="Room Change Requests">
        <Table
          columns={["Requested", "From", "To", "Status", "Action"]}
          rows={changes.map(c => [
            new Date(c.requestedAt).toLocaleString(),
            c.fromRoomId,
            c.toRoomId,
            <StatusBadge key={c.id} status={c.status} />,
            c.status === "pending" ? (
              <div key={c.id} className="flex gap-2">
                <button onClick={()=>decideChange(c.id, "approve")} className="rounded-xl border px-2 py-1 text-xs">Approve</button>
                <button onClick={()=>decideChange(c.id, "reject")} className="rounded-xl border px-2 py-1 text-xs">Reject</button>
              </div>
            ) : <span className="text-xs text-gray-500">—</span>
          ])}
          empty="No change requests"
        />
      </Card>

      <Card title="Maintenance">
        <Table
          columns={["Created", "Room", "Subject", "Priority", "Status", "Action"]}
          rows={maint.map(m => [
            new Date(m.createdAt).toLocaleString(),
            m.roomId || "-",
            m.subject,
            m.priority,
            <StatusBadge key={m.id} status={m.status} />,
            m.status !== "resolved" ? <button key={m.id} onClick={()=>resolveMaint(m.id)} className="rounded-xl border px-2 py-1 text-xs">Resolve</button> : <span className="text-xs text-gray-500">—</span>
          ])}
          empty="No maintenance tickets"
        />
      </Card>
    </div>
  );
}

/************************************ UI bits ************************************/
function Card({ title, children }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 text-base font-semibold">{title}</div>
      {children}
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-gray-600">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
function StatusBadge({ status }) {
  const map = { pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", cancelled: "bg-gray-100 text-gray-700", open: "bg-amber-100 text-amber-800", resolved: "bg-green-100 text-green-800" };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${map[status] || "bg-gray-100 text-gray-800"}`}>{status}</span>;
}
function Table({ columns, rows, empty }) {
  return (
    <div className="overflow-auto rounded-xl border">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
          <tr>{columns.map(c => <th key={c} className="whitespace-nowrap px-3 py-2">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-3 py-4 text-center text-gray-500">{empty}</td></tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                {row.map((cell, j) => <td key={j} className="whitespace-nowrap px-3 py-2">{cell}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
