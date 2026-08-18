import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const PrivateRoute = () => {
    const {user, loading} = useAuth();

    if(loading) {
        return (
            <div className="loading-screen">
                <div className="big-spinner"></div>
                <p>Verificando sessão segura</p>
            </div>
        );
    }

    if (!user) {
       return <Navigate to="/login" replace/> 
    }

    return <Outlet />
}