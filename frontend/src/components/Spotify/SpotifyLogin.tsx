import React from "react";

export function SpotifyLogin() {
    const login = () => {
        window.location.href = 'http://127.0.0.1:4000/api/auth/login'
    };

    return (
        <button onClick={login}>
            login with spotify
        </button>
    );
}
