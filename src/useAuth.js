import { useState, useEffect } from 'react';
import { getCurrentUser, getUserPermissions, logoutUser } from '../auth';

export function useAuth() {
  const [user,            setUser]            = useState(null);
  const [role,            setRole]            = useState(null);
  const [agencyCode,      setAgencyCode]      = useState(null);
  const [isResponder,     setIsResponder]     = useState(false);
  const [hasMedicalSuite, setHasMedicalSuite] = useState(false);
  const [totalAccess,     setTotalAccess]     = useState(false);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const perms = await getUserPermissions(currentUser.$id);
        setUser(currentUser);
        setRole(perms.role);
        setAgencyCode(perms.agencyCode);
        setIsResponder(perms.isResponder);
        setHasMedicalSuite(perms.hasMedicalSuite);
        setTotalAccess(perms.totalAccess);
      } else {
        clearState();
      }
    } catch(e) {
      clearState();
    }
    setLoading(false);
  };

  const clearState = () => {
    setUser(null);
    setRole(null);
    setAgencyCode(null);
    setIsResponder(false);
    setHasMedicalSuite(false);
    setTotalAccess(false);
  };

  const logout = async () => {
    await logoutUser();
    clearState();
  };

  return {
    user,
    role,
    agencyCode,
    isResponder,
    hasMedicalSuite,
    totalAccess,
    loading,
    logout,
    checkSession,
    isLoggedIn:   !!user,
    isPST:        role === "pst",
    isSupervisor: role === "supervisor",
    isAdmin:      role === "admin",
    isPlatform:   role === "platform" || totalAccess,
  };
}
