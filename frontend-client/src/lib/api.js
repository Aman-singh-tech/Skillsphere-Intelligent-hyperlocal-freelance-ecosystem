const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return sessionStorage.getItem("skillsphere_token");
}
function setToken(token) {
  if (token) sessionStorage.setItem("skillsphere_token", token);
  else sessionStorage.removeItem("skillsphere_token");
}

async function request(path, { method = "GET", body, auth = true, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: async (payload) => {
    const data = await request("/auth/login", { method: "POST", body: payload, auth: false });
    if (data.accessToken) setToken(data.accessToken);
    return data;
  },
  logout: () => setToken(null),
  verifyEmail: (token) => request(`/auth/verify-email/${token}`, { auth: false }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (token, password) =>
    request(`/auth/reset-password/${token}`, { method: "POST", body: { password }, auth: false }),
  me: () => request("/auth/me"),
  setup2FA: () => request("/auth/2fa/setup", { method: "POST" }),
  confirm2FA: (code) => request("/auth/2fa/confirm", { method: "POST", body: { code } }),
  googleLoginUrl: () => `${BASE_URL}/auth/google`,
};

export const userApi = {
  getProfile: (id) => request(`/users/${id}`, { auth: false }),
  listFreelancers: (params = {}) => request(`/users/freelancers?${new URLSearchParams(params)}`, { auth: false }),
  updateProfile: (payload) => request("/users/me", { method: "PUT", body: payload }),
  updateAvailability: (slots) => request("/users/me/availability", { method: "PUT", body: { slots } }),
  uploadFile: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/users/me/upload", { method: "POST", body: form, isForm: true });
  },
  myAnalytics: () => request("/users/analytics/me"),
};

export const gigApi = {
  list: () => request("/gigs", { auth: false }),
  mine: () => request("/gigs/mine"),
  search: (params) => request(`/gigs/search?${new URLSearchParams(params)}`, { auth: false }),
  getById: (id) => request(`/gigs/${id}`, { auth: false }),
  create: (payload) => request("/gigs", { method: "POST", body: payload }),
  update: (id, payload) => request(`/gigs/${id}`, { method: "PUT", body: payload }),
  updateMilestone: (id, milestoneId, payload) => request(`/gigs/${id}/milestones/${milestoneId}`, { method: "PUT", body: payload }),
  invite: (id, freelancerId) => request(`/gigs/${id}/invite`, { method: "POST", body: { freelancerId } }),
  recommendations: (id) => request(`/gigs/${id}/recommendations`),
};

export const proposalApi = {
  submit: (payload) => request("/proposals", { method: "POST", body: payload }),
  mine: () => request("/proposals/mine"),
  forGig: (gigId) => request(`/proposals/gig/${gigId}`),
  negotiate: (id, proposedAmount, message) =>
    request(`/proposals/${id}/negotiate`, { method: "PUT", body: { proposedAmount, message } }),
  accept: (id) => request(`/proposals/${id}/accept`, { method: "PUT" }),
  reject: (id) => request(`/proposals/${id}/reject`, { method: "PUT" }),
};

export const reviewApi = {
  create: (payload) => request("/reviews", { method: "POST", body: payload }),
  forUser: (userId) => request(`/reviews/user/${userId}`, { auth: false }),
};

export const messageApi = {
  conversations: () => request("/messages/conversations"),
  history: (otherUserId) => request(`/messages/${otherUserId}`),
};

export const paymentApi = {
  createOrder: (payload) => request("/payments/create-order", { method: "POST", body: payload }),
  verify: (payload) => request("/payments/verify", { method: "POST", body: payload }),
  release: (id) => request(`/payments/${id}/release`, { method: "PUT" }),
  refund: (id, reason) => request(`/payments/${id}/refund`, { method: "PUT", body: { reason } }),
  history: () => request("/payments/history"),
};

export const disputeApi = {
  raise: (payload) => request("/disputes", { method: "POST", body: payload }),
  mine: () => request("/disputes/mine"),
};

export const notificationApi = {
  list: () => request("/notifications"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () => request("/notifications/read-all", { method: "PUT" }),
};

export { getToken, setToken };
