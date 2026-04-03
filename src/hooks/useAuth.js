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
        // No session — clear everything
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
    // Identity
    user,
    role,
    agencyCode,

    // Permission flags
    isResponder,
    hasMedicalSuite,
    totalAccess,

    // State
    loading,

    // Actions
    logout,
    checkSession,

    // Convenience checks
    isLoggedIn:   !!user,
    isPST:        role === "pst",
    isSupervisor: role === "supervisor",
    isAdmin:      role === "admin",
    isPlatform:   role === "platform" || totalAccess,
  };
}
```

**Save that then confirm:**
```
✅ src/appwrite.js        — done
✅ src/auth.js            — done
✅ src/hooks/useAuth.js   — done
⏳ src/components/LoginScreen.jsx — last file

const { isPST, isAdmin, isPlatform, hasMedicalSuite } = useAuth();

// In any component
if (isPlatform)       // show platform dashboard
if (hasMedicalSuite)  // show Wave Runner access
if (isPST)            // show PST queue
