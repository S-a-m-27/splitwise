export const ROUTES = {
  home: "/",
  offline: "/offline",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  authCallback: "/auth/callback",
  dashboard: "/dashboard",
  groups: "/groups",
  groupNew: "/groups/new",
  activity: "/activity",
  expenses: "/expenses",
  expenseNew: "/expenses/new",
  settlements: "/settlements",
  profile: "/profile",
  profileEdit: "/profile/edit",
  profileChangePassword: "/profile/change-password",
  profileAbout: "/profile/about",
  settings: "/settings",
  invitations: "/invitations",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Routes that require authentication.
 * Middleware and layouts reference this list — redirects are added when auth ships.
 */
export const PROTECTED_ROUTES: AppRoute[] = [
  ROUTES.dashboard,
  ROUTES.groups,
  ROUTES.activity,
  ROUTES.expenses,
  ROUTES.settlements,
  ROUTES.profile,
  ROUTES.profileEdit,
  ROUTES.profileChangePassword,
  ROUTES.profileAbout,
  ROUTES.settings,
  ROUTES.invitations,
];

export const AUTH_ROUTES: AppRoute[] = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
];

/** Build a group detail route — UI-only until dynamic routes ship in backend milestone. */
export function groupDetailRoute(groupId: string): string {
  return `/groups/${groupId}`;
}

export function groupEditRoute(groupId: string): string {
  return `/groups/${groupId}/edit`;
}

export function groupInviteRoute(groupId: string): string {
  return `/groups/${groupId}/invite`;
}

export function inviteJoinRoute(inviteCode: string): string {
  return `/invite/${inviteCode}`;
}

export function expenseDetailRoute(expenseId: string): string {
  return `/expenses/${expenseId}`;
}

export function expenseEditRoute(expenseId: string): string {
  return `/expenses/${expenseId}/edit`;
}

export function expenseNewRoute(groupId?: string): string {
  if (!groupId) return ROUTES.expenseNew;
  return `${ROUTES.expenseNew}?groupId=${groupId}`;
}

export function profileEditRoute(): string {
  return ROUTES.profileEdit;
}

export function profileChangePasswordRoute(): string {
  return ROUTES.profileChangePassword;
}

export function invitationDetailRoute(invitationId: string): string {
  return `/invitations/${invitationId}`;
}

export function profileAboutRoute(): string {
  return ROUTES.profileAbout;
}

export const PUBLIC_ROUTES: AppRoute[] = [
  ROUTES.home,
  ROUTES.offline,
  ROUTES.authCallback,
];
