const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return sessionStorage.getItem("skillsphere_admin_token");
}
function setToken(token) {
  if (token) sessionStorage.setItem("skillsphere_admin_token", token);
  else sessionStorage.removeItem("skillsphere_admin_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// Admins log in through the same /auth/login endpoint as everyone else —
// the backend's RBAC middleware is what restricts /api/admin/* routes to
// users whose role is "admin".
export const authApi = {
  login: async (payload) => {
    const data = await request("/auth/login", { method: "POST", body: payload, auth: false });
    if (data.accessToken) setToken(data.accessToken);
    return data;
  },
  logout: () => setToken(null),
  me: () => request("/auth/me"),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (token, password) =>
    request(`/auth/reset-password/${token}`, { method: "POST", body: { password }, auth: false }),
};

export const adminApi = {
  users: (params = {}) => request(`/admin/users?${new URLSearchParams(params)}`),
  suspendUser: (id, reason) => request(`/admin/users/${id}/suspend`, { method: "PUT", body: { reason } }),
  reinstateUser: (id) => request(`/admin/users/${id}/reinstate`, { method: "PUT" }),
  verifyFreelancer: (id, badge) => request(`/admin/users/${id}/verify`, { method: "PUT", body: { badge } }),
  pendingGigs: () => request("/admin/gigs/pending"),
  approveGig: (id) => request(`/admin/gigs/${id}/approve`, { method: "PUT" }),
  rejectGig: (id, reason) => request(`/admin/gigs/${id}/reject`, { method: "PUT", body: { reason } }),
  disputes: () => request("/admin/disputes"),
  resolveDispute: (id, resolution, adminNotes) =>
    request(`/admin/disputes/${id}/resolve`, { method: "PUT", body: { resolution, adminNotes } }),
  analytics: () => request("/admin/analytics"),
};

export { getToken, setToken };
