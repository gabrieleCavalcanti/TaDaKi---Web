import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "./LoadingScreen";
export const PrivateRoute = () => {
    const {user, loading} = useAuth();

    if(loading) {
        return <LoadingScreen />;
    }

    if (!user) {
       return <Navigate to="/login" replace/> 
    }

    return <Outlet />
}