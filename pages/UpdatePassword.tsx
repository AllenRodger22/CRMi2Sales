import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const UpdatePasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { updatePassword, logout, isLoading } = useAuth();
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        setSuccessMessage(null);

        if (password !== confirmPassword) {
            setLocalError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setLocalError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            await updatePassword(password);
            setSuccessMessage('Senha atualizada com sucesso! Você será desconectado em breve para fazer login novamente.');
            setTimeout(() => {
                logout(); // This will redirect to login via the router logic
            }, 3000);
        } catch (err: any) {
            setLocalError(err.message || 'Falha ao atualizar a senha.');
        }
    };

    const inputClass = "appearance-none relative block w-full px-3 py-3 bg-white/5 border border-white/20 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-6 sm:p-8 space-y-8 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                <div>
                    <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white">
                        Atualizar Senha
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-300">
                        Digite sua nova senha abaixo.
                    </p>
                </div>
                {!successMessage ? (
                    <form className="mt-8 space-y-4" onSubmit={handleUpdate}>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className={inputClass}
                            placeholder="Nova Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            required
                            className={inputClass}
                            placeholder="Confirme a Nova Senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
                        </button>
                        {localError && <p className="text-sm text-red-400 text-center">{localError}</p>}
                    </form>
                ) : (
                    <p className="text-sm text-green-400 text-center">{successMessage}</p>
                )}
            </div>
        </div>
    );
};

export default UpdatePasswordPage;
