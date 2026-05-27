import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Forms = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

    async function handleLogin(e) {
        e.preventDefault();
        setMessage("");
        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: identifier, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setMessage(data.msg || 'Error');
                return;
            }
            // store token and user
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setMessage('Inicio de sesión correcto');
            navigate('/');
        } catch (err) {
            setMessage('Error de conexión');
        }
    }

    return (
        <div style={{maxWidth: 420, margin: '40px auto'}}>
            <h2>Iniciar sesión</h2>
            <form onSubmit={handleLogin}>
                <div style={{marginBottom: 8}}>
                    <label>Usuario o email</label>
                    <input
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        style={{width: '100%'}}
                    />
                </div>
                <div style={{marginBottom: 8}}>
                    <label>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{width: '100%'}}
                    />
                </div>
                <button type="submit">Entrar</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};