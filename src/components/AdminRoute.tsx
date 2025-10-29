import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
 // adjust the import path if needed
import { toast } from "sonner";
import { apiClient, User } from "@/lib/api";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      try {
        const user: User = await apiClient.getProfile();
        if (!user.isAdmin) {
          toast.error("Access denied: Admins only");
          navigate("/dashboard");
          return;
        }

        setChecking(false);
      } catch (err) {
        console.error("Failed to verify admin:", err);
        toast.error("Session expired. Please login again");
        apiClient.clearToken();
        navigate("/login");
      }
    };

    verifyAdmin();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
